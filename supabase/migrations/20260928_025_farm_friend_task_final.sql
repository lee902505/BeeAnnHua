begin;

-- Stellar Diary V0.17.1
-- Friend / task / achievement / title final pass.
--
-- Goals:
--   * daily social EXP pool: 50 EXP max per UTC+8 farm day
--   * first visit to each real friend per day: +2 EXP
--   * friend watering: +5 EXP per successfully helped plot
--   * cumulative friend-visit / watering / pest-help statistics
--   * keep pest-help's existing random rewards outside the 50 EXP social cap
--   * return authoritative helper farm state so the browser can sync immediately

-- ---------------------------------------------------------------------------
-- 1) Central helper for daily social EXP and cumulative social statistics.
--    Returned JSON: {state, awarded, social_exp_today, new_visit}
-- ---------------------------------------------------------------------------
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
  v_requested integer := greatest(0, coalesce(p_exp_requested,0));
  v_visit_delta integer := greatest(0, coalesce(p_friend_visit_delta,0));
begin
  v_stats := case when jsonb_typeof(v_state->'stats')='object' then v_state->'stats' else '{}'::jsonb end;
  v_daily := case when jsonb_typeof(v_state->'daily')='object' then v_state->'daily' else '{}'::jsonb end;

  -- A server-side interaction can be the first farm action after midnight.
  -- Reset the same daily fields used by the browser so stale yesterday values
  -- are never mixed into today's social cap.
  if coalesce(v_daily->>'date','') <> v_day then
    v_daily := jsonb_build_object(
      'date', v_day,
      'plant', 0,
      'harvest', 0,
      'sell', 0,
      'steal', 0,
      'visitedFriends', '[]'::jsonb,
      'socialExp', 0,
      'claimed', '[]'::jsonb,
      'bonusClaimed', false
    );
  end if;

  if coalesce(v_daily->>'socialExp','') ~ '^[0-9]+$' then
    v_current := least(50, greatest(0, (v_daily->>'socialExp')::integer));
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
  v_stats := jsonb_set(v_stats,'{helpWater}',to_jsonb(v_help_water + greatest(0,coalesce(p_help_water_delta,0))),true);
  v_stats := jsonb_set(v_stats,'{helpBug}',to_jsonb(v_help_bug + greatest(0,coalesce(p_help_bug_delta,0))),true);

  v_daily := jsonb_set(v_daily,'{date}',to_jsonb(v_day),true);
  v_daily := jsonb_set(v_daily,'{visitedFriends}',v_visited,true);
  v_daily := jsonb_set(v_daily,'{socialExp}',to_jsonb(v_current),true);
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

-- ---------------------------------------------------------------------------
-- 2) Friend farm payload V7.
--    V6 remains available for older clients. V7 keeps the existing public farm
--    payload but makes the first visit to a different friend each UTC+8 day
--    server-authoritative (+2 EXP, shared 50 EXP cap).
-- ---------------------------------------------------------------------------
create or replace function public.get_friend_farm_v7(
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
  v_helper_state jsonb;
  v_social jsonb;
  v_day text := to_char(clock_timestamp() at time zone 'Asia/Taipei','YYYY-MM-DD');
  v_now timestamptz := clock_timestamp();
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_revision bigint := null;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','not_authenticated'); end if;

  -- V6 already performs friendship validation and returns only safe friend data.
  -- Disable its visit logging so V7 can handle activity + reward in one place.
  v_payload := public.get_friend_farm_v6(p_friend, false);
  if coalesce(v_payload->>'ok','false') <> 'true' then return v_payload; end if;

  if coalesce(p_log_visit,true) and p_friend is not null and p_friend <> v_uid then
    -- Keep the existing anti-spam activity rule: at most one visible visit row
    -- to the same friend every 10 minutes.
    if not exists (
      select 1 from public.farm_activity a
      where a.owner_id=p_friend
        and a.actor_id=v_uid
        and a.activity_type='visit'
        and a.created_at > v_now - interval '10 minutes'
    ) then
      insert into public.farm_activity(owner_id,actor_id,activity_type,created_at)
      values(p_friend,v_uid,'visit',v_now);

      delete from public.farm_activity a
      where a.owner_id=p_friend and a.id in (
        select x.id from public.farm_activity x
        where x.owner_id=p_friend
        order by x.created_at desc,x.id desc
        offset 100
      );
    end if;

    select fs.state into v_helper_state
      from public.farm_saves fs
      where fs.user_id=v_uid
      for update;

    if found then
      v_social := private.farm_social_progress_v1(
        v_helper_state,
        v_day,
        2,
        p_friend::text,
        1,
        0,
        0
      );
      v_helper_state := v_social->'state';

      if coalesce((v_social->>'new_visit')::boolean,false) then
        v_helper_state := jsonb_set(v_helper_state,'{updatedAt}',to_jsonb(v_now_ms),true);
        update public.farm_saves
           set state=v_helper_state,
               client_updated_at=v_now_ms
         where user_id=v_uid;
        select fs.revision into v_revision from public.farm_saves fs where fs.user_id=v_uid;

        v_payload := v_payload || jsonb_build_object(
          'helper_state', v_helper_state,
          'helper_revision', v_revision
        );
      end if;

      v_payload := v_payload || jsonb_build_object(
        'social_exp_awarded', coalesce((v_social->>'awarded')::integer,0),
        'social_exp_today', coalesce((v_social->>'social_exp_today')::integer,0),
        'new_daily_visit', coalesce((v_social->>'new_visit')::boolean,false),
        'farm_day', v_day
      );
    end if;
  end if;

  return v_payload;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Friend watering: true batch + helper reward/stat update.
--    Every successfully watered plot requests +5 social EXP, capped at 50/day.
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
  v_lock_id uuid;
  v_owner_state jsonb;
  v_helper_state jsonb;
  v_social jsonb;
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
  v_day text := to_char(clock_timestamp() at time zone 'Asia/Taipei','YYYY-MM-DD');
  v_revision bigint := null;
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
  v_helper_name := coalesce(nullif(trim(v_helper_name),''),'农场好友');

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('farm-pair:' || v_low::text || ':' || v_high::text,0));
  for v_lock_id in
    select fs.user_id from public.farm_saves fs
    where fs.user_id in (v_low,v_high)
    order by fs.user_id
    for update
  loop null; end loop;

  select fs.state into v_owner_state from public.farm_saves fs where fs.user_id=p_friend;
  if not found then return jsonb_build_object('ok',false,'reason','no_farm'); end if;
  select fs.state into v_helper_state from public.farm_saves fs where fs.user_id=v_uid;
  if not found then return jsonb_build_object('ok',false,'reason','no_own_farm'); end if;

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

  v_social := private.farm_social_progress_v1(v_helper_state,v_day,v_count*5,null,0,v_count,0);
  v_helper_state := v_social->'state';

  v_owner_state := jsonb_set(v_owner_state,'{updatedAt}',to_jsonb(v_now_ms),true);
  v_helper_state := jsonb_set(v_helper_state,'{updatedAt}',to_jsonb(v_now_ms),true);

  update public.farm_saves set state=v_owner_state,client_updated_at=v_now_ms where user_id=p_friend;
  update public.farm_saves set state=v_helper_state,client_updated_at=v_now_ms where user_id=v_uid;
  select fs.revision into v_revision from public.farm_saves fs where fs.user_id=v_uid;

  insert into public.farm_activity(owner_id,actor_id,activity_type,crop_id,amount,plot_id,created_at)
  values(
    p_friend,v_uid,'help_water',
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
    'bonus_percent',5,
    'social_exp_awarded',coalesce((v_social->>'awarded')::integer,0),
    'social_exp_today',coalesce((v_social->>'social_exp_today')::integer,0),
    'helper_state',v_helper_state,
    'helper_revision',v_revision,
    'farm_day',v_day
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) Pest help keeps the existing random reward table. The cumulative helpBug
--    statistic is added, but random EXP does NOT consume the social 50 EXP cap.
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
  v_social jsonb;
  v_plot jsonb;
  v_crop_id text;
  v_roll double precision := random();
  v_reward_type text := 'none';
  v_reward_amount integer := 0;
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_coins bigint := 0;
  v_max_coins bigint := 0;
  v_mystery integer := 0;
  v_day text := to_char(clock_timestamp() at time zone 'Asia/Taipei','YYYY-MM-DD');
  v_revision bigint := null;
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

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('farm-pair:' || v_low::text || ':' || v_high::text,0));
  for v_lock_id in
    select fs.user_id from public.farm_saves fs
    where fs.user_id in (v_low,v_high)
    order by fs.user_id
    for update
  loop null; end loop;

  select fs.state into v_owner_state from public.farm_saves fs where fs.user_id=p_friend;
  if not found then return jsonb_build_object('ok',false,'reason','no_farm'); end if;
  select fs.state into v_helper_state from public.farm_saves fs where fs.user_id=v_uid;
  if not found then return jsonb_build_object('ok',false,'reason','no_own_farm'); end if;

  v_plot := v_owner_state->'plots'->p_plot;
  if v_plot is null or coalesce(v_plot->>'cropId','') = '' then return jsonb_build_object('ok',false,'reason','no_crop'); end if;
  if coalesce(v_plot->>'hasPest','false') <> 'true' then return jsonb_build_object('ok',false,'reason','no_pest'); end if;
  v_crop_id := v_plot->>'cropId';
  v_owner_state := jsonb_set(v_owner_state,array['plots',p_plot::text,'hasPest'],'false'::jsonb,true);

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

  v_social := private.farm_social_progress_v1(v_helper_state,v_day,0,null,0,0,1);
  v_helper_state := v_social->'state';
  v_owner_state := jsonb_set(v_owner_state,'{updatedAt}',to_jsonb(v_now_ms),true);
  v_helper_state := jsonb_set(v_helper_state,'{updatedAt}',to_jsonb(v_now_ms),true);

  update public.farm_saves set state=v_owner_state,client_updated_at=v_now_ms where user_id=p_friend;
  update public.farm_saves set state=v_helper_state,client_updated_at=v_now_ms where user_id=v_uid;
  select fs.revision into v_revision from public.farm_saves fs where fs.user_id=v_uid;

  insert into public.farm_activity(owner_id,actor_id,activity_type,crop_id,amount,plot_id,created_at)
  values(p_friend,v_uid,'help_bug',v_crop_id,1,p_plot,clock_timestamp());

  delete from public.farm_activity a
  where a.owner_id=p_friend and a.id in (
    select x.id from public.farm_activity x where x.owner_id=p_friend order by x.created_at desc,x.id desc offset 100
  );

  return jsonb_build_object(
    'ok',true,'crop_id',v_crop_id,'plot_id',p_plot,
    'reward_type',v_reward_type,'reward_amount',v_reward_amount,
    'helper_state',v_helper_state,'helper_revision',v_revision,'farm_day',v_day
  );
end;
$$;

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
  v_social jsonb;
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
  v_day text := to_char(clock_timestamp() at time zone 'Asia/Taipei','YYYY-MM-DD');
  v_revision bigint := null;
  i integer;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','not_authenticated'); end if;
  if p_friend is null or p_friend = v_uid then return jsonb_build_object('ok',false,'reason','invalid_target'); end if;

  if v_uid::text < p_friend::text then v_low := v_uid; v_high := p_friend;
  else v_low := p_friend; v_high := v_uid; end if;

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
  loop null; end loop;

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

    v_roll := random();
    if v_roll < 0.45 then
      v_coin_reward := v_coin_reward + 2 + floor(random()*4)::integer;
    elsif v_roll < 0.80 then
      v_exp_reward := v_exp_reward + 3 + floor(random()*6)::integer;
    elsif v_roll < 0.90 then
      v_mystery_reward := v_mystery_reward + 1;
    end if;
  end loop;

  if v_count <= 0 then return jsonb_build_object('ok',false,'reason','no_pest','count',0,'plot_ids',v_ids); end if;

  if v_coin_reward > 0 then
    if coalesce(v_helper_state->>'coins','') ~ '^[0-9]+$' then v_coins := (v_helper_state->>'coins')::bigint; end if;
    v_helper_state := jsonb_set(v_helper_state,'{coins}',to_jsonb(v_coins + v_coin_reward),true);
    v_helper_state := jsonb_set(v_helper_state,'{stats}',coalesce(v_helper_state->'stats','{}'::jsonb),true);
    if coalesce(v_helper_state->'stats'->>'maxCoins','') ~ '^[0-9]+$' then v_max_coins := (v_helper_state->'stats'->>'maxCoins')::bigint; end if;
    v_helper_state := jsonb_set(v_helper_state,'{stats,maxCoins}',to_jsonb(greatest(v_max_coins,v_coins+v_coin_reward)),true);
  end if;
  if v_exp_reward > 0 then v_helper_state := private.farm_apply_exp_v1(v_helper_state,v_exp_reward); end if;
  if v_mystery_reward > 0 then
    v_helper_state := jsonb_set(v_helper_state,'{seeds}',coalesce(v_helper_state->'seeds','{}'::jsonb),true);
    if coalesce(v_helper_state->'seeds'->>'mystery','') ~ '^[0-9]+$' then v_mystery := (v_helper_state->'seeds'->>'mystery')::integer; end if;
    v_helper_state := jsonb_set(v_helper_state,'{seeds,mystery}',to_jsonb(v_mystery+v_mystery_reward),true);
  end if;

  v_social := private.farm_social_progress_v1(v_helper_state,v_day,0,null,0,0,v_count);
  v_helper_state := v_social->'state';
  v_owner_state := jsonb_set(v_owner_state,'{updatedAt}',to_jsonb(v_now_ms),true);
  v_helper_state := jsonb_set(v_helper_state,'{updatedAt}',to_jsonb(v_now_ms),true);

  update public.farm_saves set state=v_owner_state,client_updated_at=v_now_ms where user_id=p_friend;
  update public.farm_saves set state=v_helper_state,client_updated_at=v_now_ms where user_id=v_uid;
  select fs.revision into v_revision from public.farm_saves fs where fs.user_id=v_uid;

  insert into public.farm_activity(owner_id,actor_id,activity_type,crop_id,amount,plot_id,created_at)
  values(
    p_friend,v_uid,'help_bug',
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
    'helper_revision',v_revision,
    'farm_day',v_day,
    'rewards',jsonb_build_object('coins',v_coin_reward,'exp',v_exp_reward,'mystery',v_mystery_reward)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) Permissions.
-- ---------------------------------------------------------------------------
revoke all on function public.get_friend_farm_v7(uuid,boolean) from public, anon;
revoke all on function public.help_friend_water_v1(uuid,integer) from public, anon;
revoke all on function public.help_friend_bug_v1(uuid,integer) from public, anon;
revoke all on function public.help_friend_bug_all_v1(uuid) from public, anon;

grant execute on function public.get_friend_farm_v7(uuid,boolean) to authenticated, service_role;
grant execute on function public.help_friend_water_v1(uuid,integer) to authenticated, service_role;
grant execute on function public.help_friend_bug_v1(uuid,integer) to authenticated, service_role;
grant execute on function public.help_friend_bug_all_v1(uuid) to authenticated, service_role;

commit;
