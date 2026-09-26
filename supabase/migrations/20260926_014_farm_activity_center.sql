-- Stellar Diary V0.13.29 — farm activity center
-- Adds visit history and a unified, bounded activity feed for visits + steals.
-- Run once after migration 013. Existing farm/friend/steal data is preserved.

begin;

create table if not exists public.farm_activity (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null check (activity_type in ('visit','steal','help_bug','friend')),
  crop_id text,
  amount integer,
  plot_id integer,
  source_steal_id bigint unique,
  created_at timestamptz not null default now(),
  seen_at timestamptz,
  check (owner_id <> actor_id)
);

create index if not exists idx_farm_activity_owner_created
  on public.farm_activity(owner_id, created_at desc, id desc);
create index if not exists idx_farm_activity_owner_unread
  on public.farm_activity(owner_id, seen_at) where seen_at is null;
create index if not exists idx_farm_activity_actor_created
  on public.farm_activity(actor_id, created_at desc);

alter table public.farm_activity enable row level security;
revoke all on table public.farm_activity from public, anon, authenticated;

-- Backfill existing steal history into the unified feed. source_steal_id makes
-- the operation safe to rerun and keeps future trigger inserts idempotent.
insert into public.farm_activity(
  owner_id, actor_id, activity_type, crop_id, amount, plot_id,
  source_steal_id, created_at, seen_at
)
select
  st.owner_id,
  st.thief_id,
  'steal',
  st.crop_id,
  greatest(1, coalesce(st.amount, 1)),
  st.plot_id,
  st.id,
  st.created_at,
  st.seen_at
from public.farm_steals st
where st.owner_id <> st.thief_id
on conflict (source_steal_id) do nothing;

-- Keep only the newest 100 display activities per farm owner. farm_steals is
-- never pruned here because it remains the authoritative anti-repeat ledger.
delete from public.farm_activity a
where a.id in (
  select old.id
  from (
    select id, row_number() over (partition by owner_id order by created_at desc, id desc) as rn
    from public.farm_activity
  ) old
  where old.rn > 100
);

create or replace function public.farm_activity_from_steal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.farm_activity(
    owner_id, actor_id, activity_type, crop_id, amount, plot_id,
    source_steal_id, created_at
  ) values (
    new.owner_id, new.thief_id, 'steal', new.crop_id,
    greatest(1, coalesce(new.amount,1)), new.plot_id, new.id, new.created_at
  )
  on conflict (source_steal_id) do nothing;

  delete from public.farm_activity a
  where a.owner_id = new.owner_id
    and a.id in (
      select x.id
      from public.farm_activity x
      where x.owner_id = new.owner_id
      order by x.created_at desc, x.id desc
      offset 100
    );

  return new;
end;
$$;

drop trigger if exists trg_farm_steals_activity on public.farm_steals;
create trigger trg_farm_steals_activity
after insert on public.farm_steals
for each row execute function public.farm_activity_from_steal();

-- V3 returns the same sanitized friend-farm payload as V2 and, for genuine
-- user-initiated visits, writes a visit event. Repeat refreshes within ten
-- minutes are deduplicated so the owner's activity feed cannot be spammed.
create or replace function public.get_friend_farm_v3(
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
  v_now timestamptz := clock_timestamp();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  v_payload := public.get_friend_farm_v2(p_friend);

  if coalesce((v_payload->>'ok')::boolean, false)
     and coalesce(p_log_visit, true)
     and p_friend is not null
     and p_friend <> v_uid then

    if not exists (
      select 1
      from public.farm_activity a
      where a.owner_id = p_friend
        and a.actor_id = v_uid
        and a.activity_type = 'visit'
        and a.created_at > v_now - interval '10 minutes'
    ) then
      insert into public.farm_activity(owner_id, actor_id, activity_type, created_at)
      values(p_friend, v_uid, 'visit', v_now);

      delete from public.farm_activity a
      where a.owner_id = p_friend
        and a.id in (
          select x.id
          from public.farm_activity x
          where x.owner_id = p_friend
          order by x.created_at desc, x.id desc
          offset 100
        );
    end if;
  end if;

  return v_payload;
end;
$$;

create or replace function public.get_farm_activity_v1(
  p_limit integer default 50,
  p_mark_seen boolean default false
)
returns table (
  id bigint,
  activity_type text,
  actor_id uuid,
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
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 100));
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  return query
  select
    a.id,
    a.activity_type,
    a.actor_id,
    coalesce(nullif(trim(p.display_name), ''), '农场好友') as display_name,
    case when p.sex in ('male','female') then p.sex else 'unspecified' end as sex,
    a.crop_id,
    a.amount,
    a.plot_id,
    a.created_at as activity_at,
    (a.seen_at is null) as is_unread
  from public.farm_activity a
  left join public.profiles p on p.id = a.actor_id
  where a.owner_id = v_uid
  order by a.created_at desc, a.id desc
  limit v_limit;

  if coalesce(p_mark_seen, false) then
    update public.farm_activity a
       set seen_at = coalesce(a.seen_at, clock_timestamp())
     where a.owner_id = v_uid
       and a.seen_at is null
       and a.id in (
         select x.id
         from public.farm_activity x
         where x.owner_id = v_uid
         order by x.created_at desc, x.id desc
         limit v_limit
       );
  end if;
end;
$$;


create or replace function public.get_farm_activity_unread_v1()
returns integer
language sql
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null then 0
    else (
      select count(*)::integer
      from public.farm_activity a
      where a.owner_id = auth.uid()
        and a.seen_at is null
    )
  end;
$$;

revoke all on function public.get_friend_farm_v3(uuid,boolean) from public, anon;
revoke all on function public.get_farm_activity_v1(integer,boolean) from public, anon;
revoke all on function public.get_farm_activity_unread_v1() from public, anon;
grant execute on function public.get_friend_farm_v3(uuid,boolean) to authenticated, service_role;
grant execute on function public.get_farm_activity_v1(integer,boolean) to authenticated, service_role;
grant execute on function public.get_farm_activity_unread_v1() to authenticated, service_role;

commit;
