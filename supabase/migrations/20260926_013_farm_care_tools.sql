-- Stellar Diary V0.13.27 — watering + fertilizer care system
-- Run once after migration 012.
-- Existing farm saves remain valid; new plot keys are optional JSON fields.

begin;

-- Keep server-side steal maturity checks consistent with the client care rules.
-- Watering multiplies the base grow duration by 0.92. A single fertilizer can
-- multiply it again by 0.90 / 0.80 / 0.70. Mystery boxes remain protected.
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
  v_owner_state jsonb;
  v_thief_state jsonb;
  v_plot jsonb;
  v_crop_id text;
  v_planted_at bigint;
  v_grow_minutes integer;
  v_factor numeric := 1.0;
  v_fertilizer text;
  v_effective_ms bigint;
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_total integer;
  v_stolen integer := 0;
  v_remaining integer;
  v_take integer := 1;
  v_current_produce integer := 0;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'not_authenticated'); end if;
  if p_friend is null or p_friend = v_uid or p_plot is null or p_plot < 0 or p_plot > 19 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_target');
  end if;

  if v_uid::text < p_friend::text then v_low := v_uid; v_high := p_friend;
  else v_low := p_friend; v_high := v_uid; end if;

  if not exists (
    select 1 from public.farm_friendships f
    where f.user_low = v_low and f.user_high = v_high and f.status = 'accepted'
  ) then return jsonb_build_object('ok', false, 'reason', 'not_friend'); end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_friend::text || ':' || p_plot::text, 0));

  select fs.state into v_owner_state
  from public.farm_saves fs where fs.user_id = p_friend for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_farm'); end if;

  select fs.state into v_thief_state
  from public.farm_saves fs where fs.user_id = v_uid for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_own_farm'); end if;

  v_plot := v_owner_state->'plots'->p_plot;
  if v_plot is null then return jsonb_build_object('ok', false, 'reason', 'no_crop'); end if;
  v_crop_id := v_plot->>'cropId';
  if v_crop_id is null or v_crop_id = '' then return jsonb_build_object('ok', false, 'reason', 'no_crop'); end if;
  if v_crop_id = 'mystery' then return jsonb_build_object('ok', false, 'reason', 'protected'); end if;
  if v_crop_id not in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit') then
    return jsonb_build_object('ok', false, 'reason', 'no_crop');
  end if;

  if coalesce(v_plot->>'plantedAt','') !~ '^[0-9]+$' then
    return jsonb_build_object('ok', false, 'reason', 'no_crop');
  end if;
  v_planted_at := (v_plot->>'plantedAt')::bigint;

  v_grow_minutes := case v_crop_id
    when 'carrot' then 20 when 'wheat' then 30 when 'corn' then 30 when 'tomato' then 50
    when 'strawberry' then 90 when 'pumpkin' then 150 when 'grape' then 240 when 'starfruit' then 480
    else 999999 end;

  if coalesce(v_plot->>'watered', 'false') = 'true' then
    v_factor := v_factor * 0.92;
  end if;

  v_fertilizer := coalesce(v_plot->>'fertilizerId', '');
  v_factor := v_factor * case v_fertilizer
    when 'fertilizerLow' then 0.90
    when 'fertilizerMid' then 0.80
    when 'fertilizerHigh' then 0.70
    else 1.00 end;

  v_effective_ms := round(v_grow_minutes::numeric * 60000 * v_factor)::bigint;
  if v_now_ms - v_planted_at < v_effective_ms then
    return jsonb_build_object('ok', false, 'reason', 'not_mature');
  end if;

  if exists (
    select 1 from public.farm_steals st
    where st.thief_id = v_uid and st.owner_id = p_friend and st.plot_id = p_plot and st.planted_at = v_planted_at
  ) then return jsonb_build_object('ok', false, 'reason', 'already_stolen'); end if;

  if coalesce(v_plot->>'harvestYield','') ~ '^[0-9]+$' then
    v_total := least(5, greatest(4, (v_plot->>'harvestYield')::integer));
  else
    v_total := 4 + floor(random() * 2)::integer;
  end if;

  select coalesce(sum(st.amount), 0)::integer into v_stolen
  from public.farm_steals st
  where st.owner_id = p_friend and st.plot_id = p_plot and st.planted_at = v_planted_at;

  v_remaining := v_total - v_stolen;
  if v_remaining <= 1 then return jsonb_build_object('ok', false, 'reason', 'protected', 'remaining', 1); end if;

  insert into public.farm_steals(thief_id, owner_id, plot_id, planted_at, crop_id, amount)
  values(v_uid, p_friend, p_plot, v_planted_at, v_crop_id, v_take);

  v_stolen := v_stolen + v_take;
  v_remaining := v_total - v_stolen;

  v_owner_state := jsonb_set(v_owner_state, array['plots', p_plot::text, 'harvestYield'], to_jsonb(v_total), true);
  v_owner_state := jsonb_set(v_owner_state, array['plots', p_plot::text, 'stolenCount'], to_jsonb(v_stolen), true);
  v_owner_state := jsonb_set(v_owner_state, '{updatedAt}', to_jsonb(v_now_ms), true);

  v_thief_state := jsonb_set(v_thief_state, '{produce}', coalesce(v_thief_state->'produce', '{}'::jsonb), true);
  if coalesce(v_thief_state->'produce'->>v_crop_id,'') ~ '^[0-9]+$' then
    v_current_produce := (v_thief_state->'produce'->>v_crop_id)::integer;
  end if;
  v_thief_state := jsonb_set(v_thief_state, array['produce', v_crop_id], to_jsonb(v_current_produce + 1), true);
  v_thief_state := jsonb_set(v_thief_state, '{updatedAt}', to_jsonb(v_now_ms), true);

  update public.farm_saves
     set state = v_owner_state,
         client_updated_at = v_now_ms
   where user_id = p_friend;

  update public.farm_saves
     set state = v_thief_state,
         client_updated_at = v_now_ms
   where user_id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'crop_id', v_crop_id,
    'amount', 1,
    'owner_remaining', v_remaining,
    'thief_state', v_thief_state
  );
end;
$$;

revoke all on function public.steal_friend_crop(uuid,integer) from public, anon;
grant execute on function public.steal_friend_crop(uuid,integer) to authenticated, service_role;

commit;
