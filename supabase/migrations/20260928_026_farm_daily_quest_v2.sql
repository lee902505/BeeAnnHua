begin;

-- Stellar Diary V0.17.2
-- Daily Quest 2.0 compatibility layer.
--
-- No new tables are required. Daily quest selection / mastery / the train reset
-- ticket live inside the existing farm_saves.state JSON. This migration only
-- upgrades the server-authoritative social helper so a friend interaction that
-- happens just after UTC+8 midnight cannot reset the new daily fields back to
-- the older V0.17.1 shape.
--
-- It also records today's helpWater / helpBug counters on the server. Those
-- counters feed the new random daily quest pool while the existing cumulative
-- stats and 50 EXP social cap keep their V0.17.1 behaviour.

create or replace function private.farm_social_progress_v1(
  p_state jsonb,
  p_day text,
  p_exp_requested integer default 0,
  p_visit_key text default null,
  p_friend_visit_delta integer default 0,
  p_help_water_delta integer default 0,
  p_help_bug_delta integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_state jsonb := coalesce(p_state, '{}'::jsonb);
  v_daily jsonb;
  v_stats jsonb;
  v_visited jsonb := '[]'::jsonb;
  v_day text := coalesce(nullif(p_day,''), to_char(clock_timestamp() at time zone 'Asia/Taipei','YYYY-MM-DD'));
  v_current integer := 0;
  v_awarded integer := 0;
  v_new_visit boolean := false;
  v_friend_visits bigint := 0;
  v_help_water bigint := 0;
  v_help_bug bigint := 0;
  v_daily_help_water bigint := 0;
  v_daily_help_bug bigint := 0;
  v_requested integer := greatest(0, coalesce(p_exp_requested,0));
  v_visit_delta integer := greatest(0, coalesce(p_friend_visit_delta,0));
  v_water_delta integer := greatest(0, coalesce(p_help_water_delta,0));
  v_bug_delta integer := greatest(0, coalesce(p_help_bug_delta,0));
begin
  v_stats := case when jsonb_typeof(v_state->'stats')='object' then v_state->'stats' else '{}'::jsonb end;
  v_daily := case when jsonb_typeof(v_state->'daily')='object' then v_state->'daily' else '{}'::jsonb end;

  -- A server-side friend interaction can be the first action after midnight.
  -- Build the full V0.17.2 daily shape so the browser can safely generate its
  -- deterministic five-task plan after receiving this authoritative state.
  if coalesce(v_daily->>'date','') <> v_day then
    v_daily := jsonb_build_object(
      'date', v_day,
      'plant', 0,
      'harvest', 0,
      'sell', 0,
      'steal', 0,
      'helpWater', 0,
      'helpBug', 0,
      'trainCars', 0,
      'trainDepart', 0,
      'fertilize', 0,
      'mysteryPlant', 0,
      'plantByCrop', '{}'::jsonb,
      'harvestByCrop', '{}'::jsonb,
      'visitedFriends', '[]'::jsonb,
      'socialExp', 0,
      'taskIds', '[]'::jsonb,
      'levelSnapshot', 0,
      'rerollUsed', false,
      'rerollSlot', null,
      'claimed', '[]'::jsonb,
      'masteryClaimed', '[]'::jsonb,
      'bonusClaimed', false
    );
  end if;

  if coalesce(v_daily->>'socialExp','') ~ '^[0-9]+$' then
    v_current := least(50, greatest(0, (v_daily->>'socialExp')::integer));
  end if;
  if coalesce(v_daily->>'helpWater','') ~ '^[0-9]+$' then
    v_daily_help_water := (v_daily->>'helpWater')::bigint;
  end if;
  if coalesce(v_daily->>'helpBug','') ~ '^[0-9]+$' then
    v_daily_help_bug := (v_daily->>'helpBug')::bigint;
  end if;

  if jsonb_typeof(v_daily->'visitedFriends')='array' then
    v_visited := v_daily->'visitedFriends';
  end if;

  if p_visit_key is not null and btrim(p_visit_key) <> '' then
    if not exists (
      select 1
      from jsonb_array_elements_text(v_visited) as x(value)
      where x.value = left(btrim(p_visit_key),100)
    ) then
      v_new_visit := true;
      v_visited := v_visited || jsonb_build_array(left(btrim(p_visit_key),100));
    else
      v_requested := 0;
      v_visit_delta := 0;
    end if;
  end if;

  v_awarded := least(v_requested, greatest(0, 50 - v_current));
  if v_awarded > 0 then
    v_state := private.farm_apply_exp_v1(v_state, v_awarded);
    v_current := v_current + v_awarded;
  end if;

  if coalesce(v_stats->>'friendVisits','') ~ '^[0-9]+$' then v_friend_visits := (v_stats->>'friendVisits')::bigint; end if;
  if coalesce(v_stats->>'helpWater','') ~ '^[0-9]+$' then v_help_water := (v_stats->>'helpWater')::bigint; end if;
  if coalesce(v_stats->>'helpBug','') ~ '^[0-9]+$' then v_help_bug := (v_stats->>'helpBug')::bigint; end if;

  v_stats := jsonb_set(v_stats,'{friendVisits}',to_jsonb(v_friend_visits + v_visit_delta),true);
  v_stats := jsonb_set(v_stats,'{helpWater}',to_jsonb(v_help_water + v_water_delta),true);
  v_stats := jsonb_set(v_stats,'{helpBug}',to_jsonb(v_help_bug + v_bug_delta),true);

  v_daily := jsonb_set(v_daily,'{date}',to_jsonb(v_day),true);
  v_daily := jsonb_set(v_daily,'{visitedFriends}',v_visited,true);
  v_daily := jsonb_set(v_daily,'{socialExp}',to_jsonb(v_current),true);
  v_daily := jsonb_set(v_daily,'{helpWater}',to_jsonb(v_daily_help_water + v_water_delta),true);
  v_daily := jsonb_set(v_daily,'{helpBug}',to_jsonb(v_daily_help_bug + v_bug_delta),true);

  -- Backfill keys for same-day V0.17.1 state without replacing any V0.17.2
  -- task plan / reroll / claimed mastery data that may already exist.
  if coalesce(jsonb_typeof(v_daily->'plantByCrop'),'') <> 'object' then v_daily := jsonb_set(v_daily,'{plantByCrop}','{}'::jsonb,true); end if;
  if coalesce(jsonb_typeof(v_daily->'harvestByCrop'),'') <> 'object' then v_daily := jsonb_set(v_daily,'{harvestByCrop}','{}'::jsonb,true); end if;
  if coalesce(jsonb_typeof(v_daily->'taskIds'),'') <> 'array' then v_daily := jsonb_set(v_daily,'{taskIds}','[]'::jsonb,true); end if;
  if coalesce(jsonb_typeof(v_daily->'claimed'),'') <> 'array' then v_daily := jsonb_set(v_daily,'{claimed}','[]'::jsonb,true); end if;
  if coalesce(jsonb_typeof(v_daily->'masteryClaimed'),'') <> 'array' then v_daily := jsonb_set(v_daily,'{masteryClaimed}','[]'::jsonb,true); end if;
  if not (v_daily ? 'trainCars') then v_daily := jsonb_set(v_daily,'{trainCars}','0'::jsonb,true); end if;
  if not (v_daily ? 'trainDepart') then v_daily := jsonb_set(v_daily,'{trainDepart}','0'::jsonb,true); end if;
  if not (v_daily ? 'fertilize') then v_daily := jsonb_set(v_daily,'{fertilize}','0'::jsonb,true); end if;
  if not (v_daily ? 'mysteryPlant') then v_daily := jsonb_set(v_daily,'{mysteryPlant}','0'::jsonb,true); end if;
  if not (v_daily ? 'levelSnapshot') then v_daily := jsonb_set(v_daily,'{levelSnapshot}','0'::jsonb,true); end if;
  if not (v_daily ? 'rerollUsed') then v_daily := jsonb_set(v_daily,'{rerollUsed}','false'::jsonb,true); end if;
  if not (v_daily ? 'bonusClaimed') then v_daily := jsonb_set(v_daily,'{bonusClaimed}','false'::jsonb,true); end if;

  v_state := jsonb_set(v_state,'{stats}',v_stats,true);
  v_state := jsonb_set(v_state,'{daily}',v_daily,true);

  return jsonb_build_object(
    'state', v_state,
    'awarded', v_awarded,
    'social_exp_today', v_current,
    'new_visit', v_new_visit
  );
end;
$$;

revoke all on function private.farm_social_progress_v1(jsonb,text,integer,text,integer,integer,integer)
from public, anon, authenticated;

commit;
