-- Stellar Diary V0.13.26 — server day + daily-task steal counter
-- Run once after migration 011. Existing farm data is preserved.

begin;

-- Authoritative UTC+8 farm day used by the browser for daily resets.
create or replace function public.get_farm_day_v1()
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select ((clock_timestamp() at time zone 'Asia/Taipei')::date)::text;
$$;

-- V4 keeps the fixed ×1 steal rule from V3, then updates the thief's
-- daily-task counter using the server's UTC+8 date. This avoids relying on
-- the phone/computer clock for the daily steal mission.
create or replace function public.steal_friend_crop_v4(p_friend uuid, p_plot integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
  v_state jsonb;
  v_daily jsonb;
  v_day text := ((clock_timestamp() at time zone 'Asia/Taipei')::date)::text;
  v_steal integer := 0;
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  v_result := public.steal_friend_crop_v3(p_friend, p_plot);
  if not coalesce((v_result->>'ok')::boolean, false) then
    return v_result;
  end if;

  select fs.state into v_state
  from public.farm_saves fs
  where fs.user_id = v_uid
  for update;

  if found then
    v_daily := coalesce(v_state->'daily', '{}'::jsonb);

    if coalesce(v_daily->>'date', '') <> v_day then
      v_daily := jsonb_build_object(
        'date', v_day,
        'plant', 0,
        'harvest', 0,
        'sell', 0,
        'steal', 0,
        'visitedFriends', '[]'::jsonb,
        'claimed', '[]'::jsonb,
        'bonusClaimed', false
      );
    end if;

    if coalesce(v_daily->>'steal','') ~ '^[0-9]+$' then
      v_steal := (v_daily->>'steal')::integer;
    end if;

    v_daily := jsonb_set(v_daily, '{steal}', to_jsonb(v_steal + 1), true);
    v_state := jsonb_set(v_state, '{daily}', v_daily, true);
    v_state := jsonb_set(v_state, '{updatedAt}', to_jsonb(v_now_ms), true);

    update public.farm_saves
       set state = v_state,
           client_updated_at = v_now_ms
     where user_id = v_uid;

    v_result := v_result || jsonb_build_object('thief_state', v_state, 'farm_day', v_day);
  end if;

  return v_result;
end;
$$;

revoke all on function public.get_farm_day_v1() from public, anon;
revoke all on function public.steal_friend_crop_v4(uuid,integer) from public, anon;
grant execute on function public.get_farm_day_v1() to authenticated, service_role;
grant execute on function public.steal_friend_crop_v4(uuid,integer) to authenticated, service_role;

commit;
