-- Stellar Diary V0.17.0.1 — Farm stability + traffic optimization
-- Run once after migration 023.
-- Goals:
--   * batch friend care into one farm update / one activity row
--   * fix helper EXP level conversion
--   * harden JSON boolean/array parsing
--   * verify friendship before batch reads
--   * use deterministic pair locking for two-player economic mutations
--   * mark all received activity seen when the feed is opened

begin;

-- ---------------------------------------------------------------------------
-- 1) Shared server-side EXP application helper.
--    Keeps friend-care rewards aligned with the same level curve used by mail.
-- ---------------------------------------------------------------------------
create or replace function private.farm_apply_exp_v1(p_state jsonb, p_delta integer)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_state jsonb := coalesce(p_state, '{}'::jsonb);
  v_level integer := 1;
  v_exp integer := 0;
  v_need integer;
begin
  if coalesce(v_state->>'level','') ~ '^[0-9]+$' then
    v_level := greatest(1, least(999, (v_state->>'level')::integer));
  end if;
  if coalesce(v_state->>'exp','') ~ '^[0-9]+$' then
    v_exp := greatest(0, (v_state->>'exp')::integer);
  end if;

  v_exp := v_exp + greatest(0, coalesce(p_delta,0));

  while v_level < 999 loop
    v_need := case v_level
      when 1 then 100 when 2 then 140 when 3 then 190 when 4 then 250 when 5 then 320
      when 6 then 400 when 7 then 500 when 8 then 620 when 9 then 750 when 10 then 900
      when 11 then 1060 when 12 then 1230 when 13 then 1410 when 14 then 1600 when 15 then 1800
      when 16 then 2010 when 17 then 2230 when 18 then 2460 when 19 then 2700 when 20 then 2950
      when 21 then 3210 when 22 then 3480 when 23 then 3760 when 24 then 4050 when 25 then 4350
      else 4350 + greatest(0, v_level - 25) * 350
    end;
    exit when v_exp < v_need;
    v_exp := v_exp - v_need;
    v_level := v_level + 1;
  end loop;

  v_state := jsonb_set(v_state,'{level}',to_jsonb(v_level),true);
  v_state := jsonb_set(v_state,'{exp}',to_jsonb(v_exp),true);
  return v_state;
end;
$$;

revoke all on function private.farm_apply_exp_v1(jsonb,integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Friend payload V6 — same public payload, but tolerate malformed booleans
--    and malformed plots containers instead of throwing for every friend.
-- ---------------------------------------------------------------------------
create or replace function public.get_friend_farm_v6(
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

  v_payload := public.get_friend_farm_v5(p_friend, p_log_visit);
  if coalesce(v_payload->>'ok','false') <> 'true' then
    return v_payload;
  end if;

  select fs.state into v_state
    from public.farm_saves fs
   where fs.user_id = p_friend;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_farm');
  end if;

  select coalesce(jsonb_agg(
    coalesce(base.elem, '{}'::jsonb) || jsonb_build_object(
      'friendWatered', coalesce(owner_plot.elem->>'friendWatered','false') = 'true',
      'friendWateredByName', left(coalesce(owner_plot.elem->>'friendWateredByName',''), 80),
      'friendWateredAt', case
        when coalesce(owner_plot.elem->>'friendWateredAt','') ~ '^[0-9]+$'
          then (owner_plot.elem->>'friendWateredAt')::bigint
        else null
      end
    ) order by base.ord
  ), '[]'::jsonb)
  into v_plots
  from jsonb_array_elements(
    case when jsonb_typeof(v_payload->'plots')='array' then v_payload->'plots' else '[]'::jsonb end
  ) with ordinality as base(elem,ord)
  left join lateral (
    select x.elem
    from jsonb_array_elements(
      case when jsonb_typeof(v_state->'plots')='array' then v_state->'plots' else '[]'::jsonb end
    ) with ordinality as x(elem,ord)
    where x.ord = base.ord
    limit 1
  ) owner_plot on true;

  return v_payload || jsonb_build_object('plots', v_plots);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Batch friend overview — safe booleans/arrays. Still one RPC for the whole
--    friend list, with no request-per-friend fan-out from the browser.
-- ---------------------------------------------------------------------------
create or replace function public.get_farm_friends_v3()
returns table (
  user_id uuid,
  display_name text,
  sex text,
  farm_level integer,
  coins bigint,
  title_id text,
  relation_state text,
  requested_at timestamptz,
  mature_count integer,
  stealable_count integer,
  pest_count integer,
  help_water_count integer,
  interaction_score integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  return query
  select
    f.user_id,
    f.display_name,
    f.sex,
    f.farm_level,
    f.coins,
    f.title_id,
    f.relation_state,
    f.requested_at,
    case when f.relation_state='friend' then coalesce(o.mature_count,0) else 0 end,
    case when f.relation_state='friend' then coalesce(o.stealable_count,0) else 0 end,
    case when f.relation_state='friend' then coalesce(o.pest_count,0) else 0 end,
    case when f.relation_state='friend' then coalesce(o.help_water_count,0) else 0 end,
    case when f.relation_state='friend' then coalesce(o.interaction_score,0) else 0 end
  from public.get_farm_friends_v2() f
  left join public.farm_saves fs on fs.user_id = f.user_id
  left join lateral (
    select
      count(*) filter (
        where p.crop_id <> ''
          and p.planted_at is not null
          and p.duration_ms > 0
          and v_now_ms - p.planted_at >= p.duration_ms
      )::integer as mature_count,
      count(*) filter (
        where p.crop_id in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit')
          and p.planted_at is not null
          and p.duration_ms > 0
          and v_now_ms - p.planted_at >= p.duration_ms
          and greatest(1, p.total_yield - p.stolen_count) > 1
          and not p.stolen_by_me
      )::integer as stealable_count,
      count(*) filter (where p.crop_id <> '' and p.has_pest)::integer as pest_count,
      count(*) filter (
        where p.crop_id in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit')
          and p.planted_at is not null
          and p.duration_ms > 0
          and v_now_ms - p.planted_at < p.duration_ms
          and not p.friend_watered
      )::integer as help_water_count,
      (
        count(*) filter (
          where p.crop_id in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit')
            and p.planted_at is not null
            and p.duration_ms > 0
            and v_now_ms - p.planted_at >= p.duration_ms
            and greatest(1, p.total_yield - p.stolen_count) > 1
            and not p.stolen_by_me
        ) * 100
        + count(*) filter (where p.crop_id <> '' and p.has_pest) * 40
        + count(*) filter (
          where p.crop_id in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit')
            and p.planted_at is not null
            and p.duration_ms > 0
            and v_now_ms - p.planted_at < p.duration_ms
            and not p.friend_watered
        ) * 10
      )::integer as interaction_score
    from (
      select
        (plot.ord - 1)::integer as plot_id,
        case when plot.elem->>'cropId' in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit','mystery') then plot.elem->>'cropId' else '' end as crop_id,
        case when coalesce(plot.elem->>'plantedAt','') ~ '^[0-9]+$' then (plot.elem->>'plantedAt')::bigint else null end as planted_at,
        public.farm_plot_duration_ms_v1(plot.elem) as duration_ms,
        case when coalesce(plot.elem->>'harvestYield','') ~ '^[0-9]+$' then greatest(1,(plot.elem->>'harvestYield')::integer) else 4 end as total_yield,
        case when coalesce(plot.elem->>'stolenCount','') ~ '^[0-9]+$' then greatest(0,(plot.elem->>'stolenCount')::integer) else 0 end as stolen_count,
        coalesce(plot.elem->>'hasPest','false') = 'true' as has_pest,
        coalesce(plot.elem->>'friendWatered','false') = 'true' as friend_watered,
        exists (
          select 1 from public.farm_steals st
          where st.thief_id = v_uid
            and st.owner_id = f.user_id
            and st.plot_id = (plot.ord - 1)::integer
            and st.planted_at = case when coalesce(plot.elem->>'plantedAt','') ~ '^[0-9]+$' then (plot.elem->>'plantedAt')::bigint else -1 end
        ) as stolen_by_me
      from jsonb_array_elements(
        case when jsonb_typeof(fs.state->'plots')='array' then fs.state->'plots' else '[]'::jsonb end
      ) with ordinality as plot(elem,ord)
      where plot.ord <= 20
    ) p
  ) o on f.relation_state='friend'
  order by
    case
      when f.relation_state='pending_in' then 0
      when f.relation_state='friend' then 1
      else 2
    end,
    case when f.relation_state='friend' then coalesce(o.interaction_score,0) else 0 end desc,
    f.requested_at desc,
    f.display_name asc;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) One-time friend watering. p_plot=NULL is a true batch operation:
--    one owner save UPDATE and one aggregated activity row.
-- ---------------------------------------------------------------------------
create or replace function public.help_friend_water_v1(
  p_friend uuid,
  p_plot integer default null
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
  v_plot jsonb;
  v_crop_id text;
  v_first_crop text := null;
  v_first_plot integer := null;
  v_planted_at bigint;
  v_duration_ms bigint;
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_helper_name text := '农场好友';
  v_count integer := 0;
  v_ids jsonb := '[]'::jsonb;
  i integer;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','not_authenticated'); end if;
  if p_friend is null or p_friend = v_uid then return jsonb_build_object('ok',false,'reason','invalid_target'); end if;
  if p_plot is not null and (p_plot < 0 or p_plot > 19) then return jsonb_build_object('ok',false,'reason','invalid_plot'); end if;

  if v_uid::text < p_friend::text then v_low := v_uid; v_high := p_friend;
  else v_low := p_friend; v_high := v_uid; end if;

  if not exists (
    select 1 from public.farm_friendships f
    where f.user_low=v_low and f.user_high=v_high and f.status='accepted'
  ) then return jsonb_build_object('ok',false,'reason','not_friend'); end if;

  select coalesce(nullif(trim(p.display_name),''),'农场好友')
    into v_helper_name
    from public.profiles p
   where p.id=v_uid;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('water:' || p_friend::text,0));
  select fs.state into v_owner_state
    from public.farm_saves fs
   where fs.user_id=p_friend
   for update;
  if not found then return jsonb_build_object('ok',false,'reason','no_farm'); end if;

  for i in 0..19 loop
    if p_plot is not null and i <> p_plot then continue; end if;

    v_plot := v_owner_state->'plots'->i;
    if v_plot is null then continue; end if;
    v_crop_id := coalesce(v_plot->>'cropId','');
    if v_crop_id not in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit') then continue; end if;
    if coalesce(v_plot->>'friendWatered','false') = 'true' then continue; end if;
    if coalesce(v_plot->>'plantedAt','') !~ '^[0-9]+$' then continue; end if;

    v_planted_at := (v_plot->>'plantedAt')::bigint;
    v_duration_ms := public.farm_plot_duration_ms_v1(v_plot);
    if v_duration_ms <= 0 or v_now_ms - v_planted_at >= v_duration_ms then continue; end if;

    v_owner_state := jsonb_set(v_owner_state,array['plots',i::text,'friendWatered'],'true'::jsonb,true);
    v_owner_state := jsonb_set(v_owner_state,array['plots',i::text,'friendWateredBy'],to_jsonb(v_uid::text),true);
    v_owner_state := jsonb_set(v_owner_state,array['plots',i::text,'friendWateredByName'],to_jsonb(left(v_helper_name,80)),true);
    v_owner_state := jsonb_set(v_owner_state,array['plots',i::text,'friendWateredAt'],to_jsonb(v_now_ms),true);
    v_count := v_count + 1;
    v_ids := v_ids || jsonb_build_array(i);
    if v_first_plot is null then v_first_plot := i; v_first_crop := v_crop_id; end if;
  end loop;

  if v_count <= 0 then
    return jsonb_build_object('ok',false,'reason','no_eligible','count',0,'plot_ids',v_ids);
  end if;

  v_owner_state := jsonb_set(v_owner_state,'{updatedAt}',to_jsonb(v_now_ms),true);
  update public.farm_saves
     set state=v_owner_state,
         client_updated_at=v_now_ms
   where user_id=p_friend;

  insert into public.farm_activity(owner_id,actor_id,activity_type,crop_id,amount,plot_id,created_at)
  values(
    p_friend,
    v_uid,
    'help_water',
    case when v_count=1 then v_first_crop else null end,
    v_count,
    case when v_count=1 then v_first_plot else null end,
    clock_timestamp()
  );

  delete from public.farm_activity a
   where a.owner_id=p_friend and a.id in (
     select x.id from public.farm_activity x
     where x.owner_id=p_friend
     order by x.created_at desc,x.id desc
     offset 100
   );

  return jsonb_build_object('ok',true,'count',v_count,'plot_ids',v_ids,'bonus_percent',5);
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) Single-plot pest help — deterministic pair lock + immediate EXP leveling.
-- ---------------------------------------------------------------------------
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
  v_lock_id uuid;
  v_owner_state jsonb;
  v_helper_state jsonb;
  v_plot jsonb;
  v_crop_id text;
  v_roll double precision := random();
  v_reward_type text := 'none';
  v_reward_amount integer := 0;
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_coins bigint := 0;
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
     where f.user_low=v_low and f.user_high=v_high and f.status='accepted'
  ) then return jsonb_build_object('ok',false,'reason','not_friend'); end if;

  -- One pair-wide lock order covers A->B and B->A concurrent care.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('farm-pair:' || v_low::text || ':' || v_high::text,0));
  for v_lock_id in
    select fs.user_id from public.farm_saves fs
     where fs.user_id in (v_low,v_high)
     order by fs.user_id
     for update
  loop
    null;
  end loop;

  select fs.state into v_owner_state from public.farm_saves fs where fs.user_id=p_friend;
  if not found then return jsonb_build_object('ok',false,'reason','no_farm'); end if;
  select fs.state into v_helper_state from public.farm_saves fs where fs.user_id=v_uid;
  if not found then return jsonb_build_object('ok',false,'reason','no_own_farm'); end if;

  v_plot := v_owner_state->'plots'->p_plot;
  if v_plot is null or coalesce(v_plot->>'cropId','') = '' then return jsonb_build_object('ok',false,'reason','no_crop'); end if;
  if coalesce(v_plot->>'hasPest','false') <> 'true' then return jsonb_build_object('ok',false,'reason','no_pest'); end if;
  v_crop_id := v_plot->>'cropId';

  v_owner_state := jsonb_set(v_owner_state,array['plots',p_plot::text,'hasPest'],'false'::jsonb,true);

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
    v_helper_state := private.farm_apply_exp_v1(v_helper_state,v_reward_amount);
  elsif v_roll < 0.90 then
    v_reward_type := 'mystery';
    v_reward_amount := 1;
    v_helper_state := jsonb_set(v_helper_state,'{seeds}',coalesce(v_helper_state->'seeds','{}'::jsonb),true);
    if coalesce(v_helper_state->'seeds'->>'mystery','') ~ '^[0-9]+$' then v_mystery := (v_helper_state->'seeds'->>'mystery')::integer; end if;
    v_helper_state := jsonb_set(v_helper_state,'{seeds,mystery}',to_jsonb(v_mystery+1),true);
  end if;

  v_owner_state := jsonb_set(v_owner_state,'{updatedAt}',to_jsonb(v_now_ms),true);
  v_helper_state := jsonb_set(v_helper_state,'{updatedAt}',to_jsonb(v_now_ms),true);

  update public.farm_saves set state=v_owner_state,client_updated_at=v_now_ms where user_id=p_friend;
  update public.farm_saves set state=v_helper_state,client_updated_at=v_now_ms where user_id=v_uid;

  insert into public.farm_activity(owner_id,actor_id,activity_type,crop_id,amount,plot_id,created_at)
  values(p_friend,v_uid,'help_bug',v_crop_id,1,p_plot,clock_timestamp());

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

-- ---------------------------------------------------------------------------
-- 6) One-click pest help — true batch implementation.
--    One pair lock, one owner UPDATE, one helper UPDATE, one activity row.
-- ---------------------------------------------------------------------------
create or replace function public.help_friend_bug_all_v1(p_friend uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_low uuid;
  v_high uuid;
  v_lock_id uuid;
  v_owner_state jsonb;
  v_helper_state jsonb;
  v_plot jsonb;
  v_crop_id text;
  v_first_crop text := null;
  v_first_plot integer := null;
  v_count integer := 0;
  v_ids jsonb := '[]'::jsonb;
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_roll double precision;
  v_coin_reward integer := 0;
  v_exp_reward integer := 0;
  v_mystery_reward integer := 0;
  v_coins bigint := 0;
  v_max_coins bigint := 0;
  v_mystery integer := 0;
  i integer;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','not_authenticated'); end if;
  if p_friend is null or p_friend = v_uid then return jsonb_build_object('ok',false,'reason','invalid_target'); end if;

  if v_uid::text < p_friend::text then v_low := v_uid; v_high := p_friend;
  else v_low := p_friend; v_high := v_uid; end if;

  -- Check friendship before reading any target farm state.
  if not exists (
    select 1 from public.farm_friendships f
    where f.user_low=v_low and f.user_high=v_high and f.status='accepted'
  ) then return jsonb_build_object('ok',false,'reason','not_friend'); end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('farm-pair:' || v_low::text || ':' || v_high::text,0));
  for v_lock_id in
    select fs.user_id from public.farm_saves fs
     where fs.user_id in (v_low,v_high)
     order by fs.user_id
     for update
  loop
    null;
  end loop;

  select fs.state into v_owner_state from public.farm_saves fs where fs.user_id=p_friend;
  if not found then return jsonb_build_object('ok',false,'reason','no_farm'); end if;
  select fs.state into v_helper_state from public.farm_saves fs where fs.user_id=v_uid;
  if not found then return jsonb_build_object('ok',false,'reason','no_own_farm'); end if;

  for i in 0..19 loop
    v_plot := v_owner_state->'plots'->i;
    if v_plot is null then continue; end if;
    v_crop_id := coalesce(v_plot->>'cropId','');
    if v_crop_id = '' or coalesce(v_plot->>'hasPest','false') <> 'true' then continue; end if;

    v_owner_state := jsonb_set(v_owner_state,array['plots',i::text,'hasPest'],'false'::jsonb,true);
    v_count := v_count + 1;
    v_ids := v_ids || jsonb_build_array(i);
    if v_first_plot is null then v_first_plot := i; v_first_crop := v_crop_id; end if;

    -- Preserve the old per-plot reward odds, but aggregate the resulting writes.
    v_roll := random();
    if v_roll < 0.45 then
      v_coin_reward := v_coin_reward + 2 + floor(random()*4)::integer;
    elsif v_roll < 0.80 then
      v_exp_reward := v_exp_reward + 3 + floor(random()*6)::integer;
    elsif v_roll < 0.90 then
      v_mystery_reward := v_mystery_reward + 1;
    end if;
  end loop;

  if v_count <= 0 then
    return jsonb_build_object('ok',false,'reason','no_pest','count',0,'plot_ids',v_ids);
  end if;

  if v_coin_reward > 0 then
    if coalesce(v_helper_state->>'coins','') ~ '^[0-9]+$' then v_coins := (v_helper_state->>'coins')::bigint; end if;
    v_helper_state := jsonb_set(v_helper_state,'{coins}',to_jsonb(v_coins + v_coin_reward),true);
    v_helper_state := jsonb_set(v_helper_state,'{stats}',coalesce(v_helper_state->'stats','{}'::jsonb),true);
    if coalesce(v_helper_state->'stats'->>'maxCoins','') ~ '^[0-9]+$' then v_max_coins := (v_helper_state->'stats'->>'maxCoins')::bigint; end if;
    v_helper_state := jsonb_set(v_helper_state,'{stats,maxCoins}',to_jsonb(greatest(v_max_coins,v_coins+v_coin_reward)),true);
  end if;

  if v_exp_reward > 0 then
    v_helper_state := private.farm_apply_exp_v1(v_helper_state,v_exp_reward);
  end if;

  if v_mystery_reward > 0 then
    v_helper_state := jsonb_set(v_helper_state,'{seeds}',coalesce(v_helper_state->'seeds','{}'::jsonb),true);
    if coalesce(v_helper_state->'seeds'->>'mystery','') ~ '^[0-9]+$' then v_mystery := (v_helper_state->'seeds'->>'mystery')::integer; end if;
    v_helper_state := jsonb_set(v_helper_state,'{seeds,mystery}',to_jsonb(v_mystery+v_mystery_reward),true);
  end if;

  v_owner_state := jsonb_set(v_owner_state,'{updatedAt}',to_jsonb(v_now_ms),true);
  v_helper_state := jsonb_set(v_helper_state,'{updatedAt}',to_jsonb(v_now_ms),true);

  update public.farm_saves set state=v_owner_state,client_updated_at=v_now_ms where user_id=p_friend;
  update public.farm_saves set state=v_helper_state,client_updated_at=v_now_ms where user_id=v_uid;

  insert into public.farm_activity(owner_id,actor_id,activity_type,crop_id,amount,plot_id,created_at)
  values(
    p_friend,
    v_uid,
    'help_bug',
    case when v_count=1 then v_first_crop else null end,
    v_count,
    case when v_count=1 then v_first_plot else null end,
    clock_timestamp()
  );

  delete from public.farm_activity a
   where a.owner_id=p_friend and a.id in (
     select x.id from public.farm_activity x
     where x.owner_id=p_friend
     order by x.created_at desc,x.id desc
     offset 100
   );

  return jsonb_build_object(
    'ok',true,
    'count',v_count,
    'plot_ids',v_ids,
    'helper_state',v_helper_state,
    'rewards',jsonb_build_object(
      'coins',v_coin_reward,
      'exp',v_exp_reward,
      'mystery',v_mystery_reward
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 7) Two-way activity feed. Opening received activity marks ALL unread rows,
--    not only the latest p_limit rows, so the unread badge cannot jump back.
-- ---------------------------------------------------------------------------
create or replace function public.get_farm_activity_v2(
  p_limit integer default 50,
  p_mark_seen boolean default false
)
returns table (
  direction text,
  id bigint,
  activity_type text,
  peer_id uuid,
  display_name text,
  sex text,
  crop_id text,
  amount integer,
  plot_id integer,
  activity_at timestamptz,
  is_unread boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit,50),100));
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode='28000';
  end if;

  return query
  with received as (
    select
      'received'::text as direction,
      a.id,
      a.activity_type,
      a.actor_id as peer_id,
      coalesce(nullif(trim(p.display_name),''),'农场好友') as display_name,
      case when p.sex in ('male','female') then p.sex else 'unspecified' end as sex,
      a.crop_id,
      a.amount,
      a.plot_id,
      a.created_at as activity_at,
      (a.seen_at is null) as is_unread
    from public.farm_activity a
    left join public.profiles p on p.id=a.actor_id
    where a.owner_id=v_uid
    order by a.created_at desc,a.id desc
    limit v_limit
  ), sent as (
    select
      'sent'::text as direction,
      a.id,
      a.activity_type,
      a.owner_id as peer_id,
      coalesce(nullif(trim(p.display_name),''),'农场好友') as display_name,
      case when p.sex in ('male','female') then p.sex else 'unspecified' end as sex,
      a.crop_id,
      a.amount,
      a.plot_id,
      a.created_at as activity_at,
      false as is_unread
    from public.farm_activity a
    left join public.profiles p on p.id=a.owner_id
    where a.actor_id=v_uid
    order by a.created_at desc,a.id desc
    limit v_limit
  )
  select * from received
  union all
  select * from sent
  order by activity_at desc,id desc;

  if coalesce(p_mark_seen,false) then
    update public.farm_activity a
       set seen_at=coalesce(a.seen_at,clock_timestamp())
     where a.owner_id=v_uid
       and a.seen_at is null;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8) Atomic steal base — preserve V0.17 friend-water maturity, but lock both
--    player farm rows in one deterministic pair order to reduce deadlocks.
-- ---------------------------------------------------------------------------
create or replace function public.steal_friend_crop(p_friend uuid, p_plot integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_low uuid;
  v_high uuid;
  v_lock_id uuid;
  v_owner_state jsonb;
  v_thief_state jsonb;
  v_plot jsonb;
  v_crop_id text;
  v_planted_at bigint;
  v_effective_ms bigint;
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_total integer;
  v_stolen integer := 0;
  v_remaining integer;
  v_take integer := 1;
  v_current_produce integer := 0;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','not_authenticated'); end if;
  if p_friend is null or p_friend=v_uid or p_plot is null or p_plot<0 or p_plot>19 then
    return jsonb_build_object('ok',false,'reason','invalid_target');
  end if;

  if v_uid::text < p_friend::text then v_low:=v_uid; v_high:=p_friend;
  else v_low:=p_friend; v_high:=v_uid; end if;

  if not exists (
    select 1 from public.farm_friendships f
    where f.user_low=v_low and f.user_high=v_high and f.status='accepted'
  ) then return jsonb_build_object('ok',false,'reason','not_friend'); end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('farm-pair:' || v_low::text || ':' || v_high::text,0));
  for v_lock_id in
    select fs.user_id from public.farm_saves fs
     where fs.user_id in (v_low,v_high)
     order by fs.user_id
     for update
  loop
    null;
  end loop;

  select fs.state into v_owner_state from public.farm_saves fs where fs.user_id=p_friend;
  if not found then return jsonb_build_object('ok',false,'reason','no_farm'); end if;
  select fs.state into v_thief_state from public.farm_saves fs where fs.user_id=v_uid;
  if not found then return jsonb_build_object('ok',false,'reason','no_own_farm'); end if;

  v_plot := v_owner_state->'plots'->p_plot;
  if v_plot is null then return jsonb_build_object('ok',false,'reason','no_crop'); end if;
  v_crop_id := coalesce(v_plot->>'cropId','');
  if v_crop_id='' then return jsonb_build_object('ok',false,'reason','no_crop'); end if;
  if v_crop_id='mystery' then return jsonb_build_object('ok',false,'reason','protected'); end if;
  if v_crop_id not in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit') then
    return jsonb_build_object('ok',false,'reason','no_crop');
  end if;
  if coalesce(v_plot->>'plantedAt','') !~ '^[0-9]+$' then return jsonb_build_object('ok',false,'reason','no_crop'); end if;

  v_planted_at := (v_plot->>'plantedAt')::bigint;
  v_effective_ms := public.farm_plot_duration_ms_v1(v_plot);
  if v_effective_ms <= 0 or v_now_ms - v_planted_at < v_effective_ms then
    return jsonb_build_object('ok',false,'reason','not_mature');
  end if;

  if exists (
    select 1 from public.farm_steals st
    where st.thief_id=v_uid and st.owner_id=p_friend and st.plot_id=p_plot and st.planted_at=v_planted_at
  ) then return jsonb_build_object('ok',false,'reason','already_stolen'); end if;

  if coalesce(v_plot->>'harvestYield','') ~ '^[0-9]+$' then
    v_total := least(5,greatest(4,(v_plot->>'harvestYield')::integer));
  else
    v_total := 4 + floor(random()*2)::integer;
  end if;

  select coalesce(sum(st.amount),0)::integer into v_stolen
  from public.farm_steals st
  where st.owner_id=p_friend and st.plot_id=p_plot and st.planted_at=v_planted_at;

  v_remaining := v_total - v_stolen;
  if v_remaining <= 1 then return jsonb_build_object('ok',false,'reason','protected','remaining',1); end if;

  insert into public.farm_steals(thief_id,owner_id,plot_id,planted_at,crop_id,amount)
  values(v_uid,p_friend,p_plot,v_planted_at,v_crop_id,v_take);

  v_stolen := v_stolen + v_take;
  v_remaining := v_total - v_stolen;

  v_owner_state := jsonb_set(v_owner_state,array['plots',p_plot::text,'harvestYield'],to_jsonb(v_total),true);
  v_owner_state := jsonb_set(v_owner_state,array['plots',p_plot::text,'stolenCount'],to_jsonb(v_stolen),true);
  v_owner_state := jsonb_set(v_owner_state,'{updatedAt}',to_jsonb(v_now_ms),true);

  v_thief_state := jsonb_set(v_thief_state,'{produce}',coalesce(v_thief_state->'produce','{}'::jsonb),true);
  if coalesce(v_thief_state->'produce'->>v_crop_id,'') ~ '^[0-9]+$' then
    v_current_produce := (v_thief_state->'produce'->>v_crop_id)::integer;
  end if;
  v_thief_state := jsonb_set(v_thief_state,array['produce',v_crop_id],to_jsonb(v_current_produce+1),true);
  v_thief_state := jsonb_set(v_thief_state,'{updatedAt}',to_jsonb(v_now_ms),true);

  update public.farm_saves set state=v_owner_state,client_updated_at=v_now_ms where user_id=p_friend;
  update public.farm_saves set state=v_thief_state,client_updated_at=v_now_ms where user_id=v_uid;

  return jsonb_build_object('ok',true,'crop_id',v_crop_id,'amount',1,'owner_remaining',v_remaining,'thief_state',v_thief_state);
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions: keep all game-mutating RPCs authenticated-only.
-- ---------------------------------------------------------------------------
revoke all on function public.get_friend_farm_v6(uuid,boolean) from public, anon;
revoke all on function public.get_farm_friends_v3() from public, anon;
revoke all on function public.help_friend_water_v1(uuid,integer) from public, anon;
revoke all on function public.help_friend_bug_v1(uuid,integer) from public, anon;
revoke all on function public.help_friend_bug_all_v1(uuid) from public, anon;
revoke all on function public.get_farm_activity_v2(integer,boolean) from public, anon;
revoke all on function public.steal_friend_crop(uuid,integer) from public, anon;

grant execute on function public.get_friend_farm_v6(uuid,boolean) to authenticated, service_role;
grant execute on function public.get_farm_friends_v3() to authenticated, service_role;
grant execute on function public.help_friend_water_v1(uuid,integer) to authenticated, service_role;
grant execute on function public.help_friend_bug_v1(uuid,integer) to authenticated, service_role;
grant execute on function public.help_friend_bug_all_v1(uuid) to authenticated, service_role;
grant execute on function public.get_farm_activity_v2(integer,boolean) to authenticated, service_role;
grant execute on function public.steal_friend_crop(uuid,integer) to authenticated, service_role;

commit;
