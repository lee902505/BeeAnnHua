-- Stellar Diary V0.13.1 — Farm rankings + friends foundation
-- Run once in Supabase SQL Editor after 20260923_003_farm_cloud_save.sql.
-- Public reads are exposed only through SECURITY DEFINER RPCs; the private farm save remains RLS-protected.

begin;

create table if not exists public.farm_friendships (
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_low, user_high),
  constraint farm_friendships_distinct_users check (user_low <> user_high),
  constraint farm_friendships_requester_is_party check (requested_by = user_low or requested_by = user_high)
);

create index if not exists idx_farm_friendships_low_status on public.farm_friendships (user_low, status);
create index if not exists idx_farm_friendships_high_status on public.farm_friendships (user_high, status);

alter table public.farm_friendships enable row level security;
revoke all on table public.farm_friendships from public, anon, authenticated;
grant all privileges on table public.farm_friendships to service_role;

drop trigger if exists trg_farm_friendships_updated_at on public.farm_friendships;
create trigger trg_farm_friendships_updated_at
before update on public.farm_friendships
for each row execute function private.set_updated_at();

-- Read a real leaderboard from existing farm_saves + profiles.
-- Only a small public-safe subset is returned; private inventory/plots/history stay private.
create or replace function public.get_farm_rankings(
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
  select r.rank_no, r.user_id, r.display_name, r.sex, r.farm_level, r.coins, r.relation_state
  from ranked r
  order by r.rank_no
  limit v_limit;
end;
$$;

-- One friend request row represents a pair. If both sides request each other,
-- the second request automatically accepts the friendship.
create or replace function public.request_farm_friend(p_target uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_low uuid;
  v_high uuid;
  v_status text;
  v_requested_by uuid;
begin
  if v_uid is null then return 'not_authenticated'; end if;
  if p_target is null or p_target = v_uid then return 'invalid_target'; end if;

  if not exists (
    select 1
    from public.farm_saves fs
    join public.profiles p on p.id = fs.user_id
    where fs.user_id = p_target and p.display_name is not null
  ) then return 'not_found'; end if;

  if v_uid::text < p_target::text then v_low := v_uid; v_high := p_target;
  else v_low := p_target; v_high := v_uid; end if;

  select f.status, f.requested_by into v_status, v_requested_by
  from public.farm_friendships f
  where f.user_low = v_low and f.user_high = v_high;

  if found then
    if v_status = 'accepted' then return 'already_friend'; end if;
    if v_requested_by = v_uid then return 'pending'; end if;
    update public.farm_friendships
      set status = 'accepted'
      where user_low = v_low and user_high = v_high;
    return 'accepted';
  end if;

  insert into public.farm_friendships(user_low, user_high, requested_by, status)
  values(v_low, v_high, v_uid, 'pending');
  return 'requested';
end;
$$;

create or replace function public.respond_farm_friend(p_other uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_low uuid;
  v_high uuid;
  v_status text;
  v_requested_by uuid;
begin
  if v_uid is null then return 'not_authenticated'; end if;
  if p_other is null or p_other = v_uid then return 'invalid_target'; end if;

  if v_uid::text < p_other::text then v_low := v_uid; v_high := p_other;
  else v_low := p_other; v_high := v_uid; end if;

  select f.status, f.requested_by into v_status, v_requested_by
  from public.farm_friendships f
  where f.user_low = v_low and f.user_high = v_high;

  if not found then return 'not_found'; end if;
  if v_status = 'accepted' then return 'already_friend'; end if;
  if v_requested_by = v_uid then return 'not_incoming'; end if;

  if coalesce(p_accept, false) then
    update public.farm_friendships set status = 'accepted'
      where user_low = v_low and user_high = v_high;
    return 'accepted';
  end if;

  delete from public.farm_friendships where user_low = v_low and user_high = v_high;
  return 'rejected';
end;
$$;

create or replace function public.remove_farm_friend(p_other uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_low uuid;
  v_high uuid;
begin
  if v_uid is null then return 'not_authenticated'; end if;
  if p_other is null or p_other = v_uid then return 'invalid_target'; end if;

  if v_uid::text < p_other::text then v_low := v_uid; v_high := p_other;
  else v_low := p_other; v_high := v_uid; end if;

  delete from public.farm_friendships
  where user_low = v_low and user_high = v_high;
  if found then return 'removed'; end if;
  return 'not_found';
end;
$$;

create or replace function public.get_farm_friends()
returns table (
  user_id uuid,
  display_name text,
  sex text,
  farm_level integer,
  coins bigint,
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

revoke all on function public.get_farm_rankings(text,integer) from public, anon;
revoke all on function public.request_farm_friend(uuid) from public, anon;
revoke all on function public.respond_farm_friend(uuid,boolean) from public, anon;
revoke all on function public.remove_farm_friend(uuid) from public, anon;
revoke all on function public.get_farm_friends() from public, anon;

grant execute on function public.get_farm_rankings(text,integer) to authenticated;
grant execute on function public.request_farm_friend(uuid) to authenticated;
grant execute on function public.respond_farm_friend(uuid,boolean) to authenticated;
grant execute on function public.remove_farm_friend(uuid) to authenticated;
grant execute on function public.get_farm_friends() to authenticated;

grant execute on function public.get_farm_rankings(text,integer) to service_role;
grant execute on function public.request_farm_friend(uuid) to service_role;
grant execute on function public.respond_farm_friend(uuid,boolean) to service_role;
grant execute on function public.remove_farm_friend(uuid) to service_role;
grant execute on function public.get_farm_friends() to service_role;

commit;
