-- Stellar Diary V0.13.14 — achievements + public equipped titles
-- Run once after migrations 004, 006, 008 and 009.
-- Existing farm saves remain intact. This adds v2 multiplayer RPCs that expose
-- only the currently equipped cosmetic title id, and a v2 steal RPC that also
-- increments the thief's long-term steal counter in the authoritative farm save.

begin;

create or replace function public.get_farm_rankings_v2(
  p_sort text default 'level',
  p_limit integer default 50
)
returns table (
  rank_no bigint,
  user_id uuid,
  display_name text,
  sex text,
  farm_level integer,
  coins bigint,
  title_id text,
  relation_state text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sort text := case when p_sort = 'coins' then 'coins' else 'level' end;
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 100));
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  return query
  with base as (
    select
      fs.user_id,
      coalesce(nullif(trim(p.display_name), ''), '星辰农友') as display_name,
      case when p.sex in ('male','female') then p.sex else 'unspecified' end as sex,
      least(999, greatest(1,
        case when coalesce(fs.state->>'level','') ~ '^[0-9]+$'
          then (fs.state->>'level')::integer else 1 end
      )) as farm_level,
      least(999999999999::bigint, greatest(0::bigint,
        case when coalesce(fs.state->>'coins','') ~ '^[0-9]+$'
          then (fs.state->>'coins')::bigint else 0::bigint end
      )) as coins,
      left(coalesce(nullif(fs.state->'titles'->>'equipped',''), 'newbie'), 64) as title_id,
      case
        when fs.user_id = v_uid then 'self'
        when ff.status = 'accepted' then 'friend'
        when ff.status = 'pending' and ff.requested_by = v_uid then 'pending_out'
        when ff.status = 'pending' then 'pending_in'
        else 'none'
      end as relation_state
    from public.farm_saves fs
    join public.profiles p on p.id = fs.user_id
    left join public.farm_friendships ff
      on ((ff.user_low = v_uid and ff.user_high = fs.user_id)
       or (ff.user_high = v_uid and ff.user_low = fs.user_id))
    where p.display_name is not null
  ), ranked as (
    select
      row_number() over (
        order by
          case when v_sort = 'coins' then base.coins end desc,
          case when v_sort = 'level' then base.farm_level end desc,
          case when v_sort = 'level' then base.coins end desc,
          case when v_sort = 'coins' then base.farm_level end desc,
          base.display_name asc,
          base.user_id asc
      ) as rank_no,
      base.*
    from base
  )
  select r.rank_no, r.user_id, r.display_name, r.sex, r.farm_level, r.coins, r.title_id, r.relation_state
  from ranked r
  order by r.rank_no
  limit v_limit;
end;
$$;

create or replace function public.get_farm_friends_v2()
returns table (
  user_id uuid,
  display_name text,
  sex text,
  farm_level integer,
  coins bigint,
  title_id text,
  relation_state text,
  requested_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  return query
  with pairs as (
    select
      case when f.user_low = v_uid then f.user_high else f.user_low end as other_id,
      f.status,
      f.requested_by,
      f.created_at
    from public.farm_friendships f
    where f.user_low = v_uid or f.user_high = v_uid
  )
  select
    pairs.other_id as user_id,
    coalesce(nullif(trim(p.display_name), ''), '星辰农友') as display_name,
    case when p.sex in ('male','female') then p.sex else 'unspecified' end as sex,
    least(999, greatest(1,
      case when coalesce(fs.state->>'level','') ~ '^[0-9]+$'
        then (fs.state->>'level')::integer else 1 end
    )) as farm_level,
    least(999999999999::bigint, greatest(0::bigint,
      case when coalesce(fs.state->>'coins','') ~ '^[0-9]+$'
        then (fs.state->>'coins')::bigint else 0::bigint end
    )) as coins,
    left(coalesce(nullif(fs.state->'titles'->>'equipped',''), 'newbie'), 64) as title_id,
    case
      when pairs.status = 'accepted' then 'friend'
      when pairs.requested_by = v_uid then 'pending_out'
      else 'pending_in'
    end as relation_state,
    pairs.created_at as requested_at
  from pairs
  join public.profiles p on p.id = pairs.other_id
  left join public.farm_saves fs on fs.user_id = pairs.other_id
  order by
    case
      when pairs.status = 'pending' and pairs.requested_by <> v_uid then 0
      when pairs.status = 'accepted' then 1
      else 2
    end,
    pairs.created_at desc,
    p.display_name asc;
end;
$$;

create or replace function public.get_friend_farm_v2(p_friend uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payload jsonb;
  v_title text := 'newbie';
begin
  v_payload := public.get_friend_farm(p_friend);
  if coalesce((v_payload->>'ok')::boolean, false) then
    select left(coalesce(nullif(fs.state->'titles'->>'equipped',''), 'newbie'), 64)
      into v_title
      from public.farm_saves fs
     where fs.user_id = p_friend;
    v_payload := v_payload || jsonb_build_object('title_id', coalesce(v_title, 'newbie'));
  end if;
  return v_payload;
end;
$$;

create or replace function public.steal_friend_crop_v2(p_friend uuid, p_plot integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
  v_state jsonb;
  v_stats jsonb;
  v_steals integer := 0;
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  -- Reuse the already-audited atomic steal implementation from migration 006.
  v_result := public.steal_friend_crop(p_friend, p_plot);
  if not coalesce((v_result->>'ok')::boolean, false) then
    return v_result;
  end if;

  -- The old RPC has already credited produce. Add the long-term successful
  -- steal counter to the thief's authoritative save in the same request.
  select fs.state into v_state
  from public.farm_saves fs
  where fs.user_id = v_uid
  for update;

  if found then
    v_stats := coalesce(v_state->'stats', '{}'::jsonb);
    if coalesce(v_stats->>'steals','') ~ '^[0-9]+$' then
      v_steals := (v_stats->>'steals')::integer;
    end if;
    v_stats := jsonb_set(v_stats, '{steals}', to_jsonb(v_steals + 1), true);
    v_state := jsonb_set(v_state, '{stats}', v_stats, true);
    v_state := jsonb_set(v_state, '{updatedAt}', to_jsonb(v_now_ms), true);

    update public.farm_saves
       set state = v_state,
           client_updated_at = v_now_ms
     where user_id = v_uid;

    v_result := v_result || jsonb_build_object('thief_state', v_state);
  end if;

  return v_result;
end;
$$;

revoke all on function public.get_farm_rankings_v2(text,integer) from public, anon;
revoke all on function public.get_farm_friends_v2() from public, anon;
revoke all on function public.get_friend_farm_v2(uuid) from public, anon;
revoke all on function public.steal_friend_crop_v2(uuid,integer) from public, anon;

grant execute on function public.get_farm_rankings_v2(text,integer) to authenticated, service_role;
grant execute on function public.get_farm_friends_v2() to authenticated, service_role;
grant execute on function public.get_friend_farm_v2(uuid) to authenticated, service_role;
grant execute on function public.steal_friend_crop_v2(uuid,integer) to authenticated, service_role;

commit;
