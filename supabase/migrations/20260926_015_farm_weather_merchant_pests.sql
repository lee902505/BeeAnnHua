-- Stellar Diary V0.13.30 — daily events, traveling merchant, pests and friend pest-help
-- Run once after migration 014. Existing farm saves, friends and activity remain intact.

begin;

-- Friend visit payload V4 exposes only gameplay-safe plot fields needed for
-- crop rendering, stealing and pest assistance. The full private save remains hidden.
create or replace function public.get_friend_farm_v4(
  p_friend uuid,
  p_log_visit boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_payload jsonb;
  v_state jsonb;
  v_plots jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  -- Reuse V3 for friendship validation, public identity/title and visit logging.
  v_payload := public.get_friend_farm_v3(p_friend, p_log_visit);
  if not coalesce((v_payload->>'ok')::boolean, false) then
    return v_payload;
  end if;

  select fs.state into v_state
    from public.farm_saves fs
   where fs.user_id = p_friend;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_farm');
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', (plot.ord - 1)::integer,
      'cropId', case when plot.elem->>'cropId' in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit','mystery') then plot.elem->>'cropId' else null end,
      'plantedAt', case when coalesce(plot.elem->>'plantedAt','') ~ '^[0-9]+$' then (plot.elem->>'plantedAt')::bigint else null end,
      'resultCropId', case when plot.elem->>'resultCropId' in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit') then plot.elem->>'resultCropId' else null end,
      'harvestYield', case when coalesce(plot.elem->>'harvestYield','') ~ '^[0-9]+$' then (plot.elem->>'harvestYield')::integer else null end,
      'stolenCount', case when coalesce(plot.elem->>'stolenCount','') ~ '^[0-9]+$' then (plot.elem->>'stolenCount')::integer else 0 end,
      'stolenByMe', exists (
        select 1 from public.farm_steals st
         where st.thief_id = v_uid and st.owner_id = p_friend
           and st.plot_id = (plot.ord - 1)::integer
           and st.planted_at = case when coalesce(plot.elem->>'plantedAt','') ~ '^[0-9]+$' then (plot.elem->>'plantedAt')::bigint else -1 end
      ),
      'watered', coalesce((plot.elem->>'watered')::boolean, false),
      'fertilizerId', case when plot.elem->>'fertilizerId' in ('fertilizerLow','fertilizerMid','fertilizerHigh') then plot.elem->>'fertilizerId' else null end,
      'hasPest', coalesce((plot.elem->>'hasPest')::boolean, false)
    ) order by plot.ord
  ), '[]'::jsonb)
  into v_plots
  from jsonb_array_elements(coalesce(v_state->'plots','[]'::jsonb)) with ordinality as plot(elem,ord)
  where plot.ord <= 20;

  return v_payload || jsonb_build_object('plots', v_plots);
end;
$$;

-- A confirmed friend may remove one active pest from one plot. The operation
-- is server-authoritative and atomically updates both farms. A small reward is
-- intentionally probabilistic so helping is fun without becoming a farm-money exploit.
create or replace function public.help_friend_bug_v1(
  p_friend uuid,
  p_plot integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_low uuid;
  v_high uuid;
  v_owner_state jsonb;
  v_helper_state jsonb;
  v_plot jsonb;
  v_crop_id text;
  v_roll double precision := random();
  v_reward_type text := 'none';
  v_reward_amount integer := 0;
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_coins bigint := 0;
  v_exp integer := 0;
  v_max_coins bigint := 0;
  v_mystery integer := 0;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','not_authenticated'); end if;
  if p_friend is null or p_friend = v_uid or p_plot is null or p_plot < 0 or p_plot > 19 then
    return jsonb_build_object('ok',false,'reason','invalid_target');
  end if;

  if v_uid::text < p_friend::text then v_low := v_uid; v_high := p_friend;
  else v_low := p_friend; v_high := v_uid; end if;

  if not exists (
    select 1 from public.farm_friendships f
     where f.user_low = v_low and f.user_high = v_high and f.status='accepted'
  ) then return jsonb_build_object('ok',false,'reason','not_friend'); end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('bug:' || p_friend::text || ':' || p_plot::text,0));

  select fs.state into v_owner_state from public.farm_saves fs where fs.user_id=p_friend for update;
  if not found then return jsonb_build_object('ok',false,'reason','no_farm'); end if;

  v_plot := v_owner_state->'plots'->p_plot;
  if v_plot is null or coalesce(v_plot->>'cropId','') = '' then return jsonb_build_object('ok',false,'reason','no_crop'); end if;
  if not coalesce((v_plot->>'hasPest')::boolean,false) then return jsonb_build_object('ok',false,'reason','no_pest'); end if;
  v_crop_id := v_plot->>'cropId';

  select fs.state into v_helper_state from public.farm_saves fs where fs.user_id=v_uid for update;
  if not found then return jsonb_build_object('ok',false,'reason','no_own_farm'); end if;

  v_owner_state := jsonb_set(v_owner_state,array['plots',p_plot::text,'hasPest'],'false'::jsonb,true);
  v_owner_state := jsonb_set(v_owner_state,'{updatedAt}',to_jsonb(v_now_ms),true);
  update public.farm_saves set state=v_owner_state,client_updated_at=v_now_ms where user_id=p_friend;

  -- 45% coins, 35% EXP, 10% mystery box, 10% simple good deed.
  if v_roll < 0.45 then
    v_reward_type := 'coins';
    v_reward_amount := 2 + floor(random()*4)::integer;
    if coalesce(v_helper_state->>'coins','') ~ '^[0-9]+$' then v_coins := (v_helper_state->>'coins')::bigint; end if;
    v_helper_state := jsonb_set(v_helper_state,'{coins}',to_jsonb(v_coins + v_reward_amount),true);
    v_helper_state := jsonb_set(v_helper_state,'{stats}',coalesce(v_helper_state->'stats','{}'::jsonb),true);
    if coalesce(v_helper_state->'stats'->>'maxCoins','') ~ '^[0-9]+$' then v_max_coins := (v_helper_state->'stats'->>'maxCoins')::bigint; end if;
    v_helper_state := jsonb_set(v_helper_state,'{stats,maxCoins}',to_jsonb(greatest(v_max_coins,v_coins+v_reward_amount)),true);
  elsif v_roll < 0.80 then
    v_reward_type := 'exp';
    v_reward_amount := 3 + floor(random()*6)::integer;
    if coalesce(v_helper_state->>'exp','') ~ '^[0-9]+$' then v_exp := (v_helper_state->>'exp')::integer; end if;
    v_helper_state := jsonb_set(v_helper_state,'{exp}',to_jsonb(v_exp + v_reward_amount),true);
  elsif v_roll < 0.90 then
    v_reward_type := 'mystery';
    v_reward_amount := 1;
    v_helper_state := jsonb_set(v_helper_state,'{seeds}',coalesce(v_helper_state->'seeds','{}'::jsonb),true);
    if coalesce(v_helper_state->'seeds'->>'mystery','') ~ '^[0-9]+$' then v_mystery := (v_helper_state->'seeds'->>'mystery')::integer; end if;
    v_helper_state := jsonb_set(v_helper_state,'{seeds,mystery}',to_jsonb(v_mystery+1),true);
  end if;

  v_helper_state := jsonb_set(v_helper_state,'{updatedAt}',to_jsonb(v_now_ms),true);
  update public.farm_saves set state=v_helper_state,client_updated_at=v_now_ms where user_id=v_uid;

  insert into public.farm_activity(owner_id,actor_id,activity_type,crop_id,amount,plot_id,created_at)
  values(p_friend,v_uid,'help_bug',v_crop_id,case when v_reward_type='none' then null else v_reward_amount end,p_plot,clock_timestamp());

  delete from public.farm_activity a
   where a.owner_id=p_friend and a.id in (
    select x.id from public.farm_activity x where x.owner_id=p_friend order by x.created_at desc,x.id desc offset 100
   );

  return jsonb_build_object(
    'ok',true,'crop_id',v_crop_id,'plot_id',p_plot,
    'reward_type',v_reward_type,'reward_amount',v_reward_amount,
    'helper_state',v_helper_state
  );
end;
$$;

revoke all on function public.get_friend_farm_v4(uuid,boolean) from public,anon;
revoke all on function public.help_friend_bug_v1(uuid,integer) from public,anon;
grant execute on function public.get_friend_farm_v4(uuid,boolean) to authenticated,service_role;
grant execute on function public.help_friend_bug_v1(uuid,integer) to authenticated,service_role;

commit;
