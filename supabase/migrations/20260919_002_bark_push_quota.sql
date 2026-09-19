-- Apply once in the Supabase SQL Editor before deploying bark-push.
-- Only the Edge Function's service role can reserve a push slot.
begin;

create schema if not exists private;

create table if not exists private.bark_push_quota (
  day_utc date not null,
  user_id uuid not null,
  push_count integer not null default 0 check (push_count >= 0),
  last_push_at timestamptz not null default now(),
  primary key (day_utc, user_id)
);

alter table private.bark_push_quota enable row level security;
revoke all on table private.bark_push_quota from public, anon, authenticated;

create or replace function public.reserve_bark_push(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'UTC')::date;
  v_user_count integer;
  v_global_count integer;
  v_last_push timestamptz;
begin
  if p_user_id is null then return false; end if;

  -- Serialize all reservations so limits stay correct for concurrent requests.
  perform pg_catalog.pg_advisory_xact_lock(5827724470231201);

  select coalesce(sum(push_count), 0)::integer
    into v_global_count
    from private.bark_push_quota
   where day_utc = v_day;
  if v_global_count >= 50 then return false; end if;

  select push_count, last_push_at
    into v_user_count, v_last_push
    from private.bark_push_quota
   where day_utc = v_day and user_id = p_user_id;
  if coalesce(v_user_count, 0) >= 6 then return false; end if;
  if v_last_push is not null and v_last_push > now() - interval '20 seconds' then
    return false;
  end if;

  insert into private.bark_push_quota(day_utc, user_id, push_count, last_push_at)
  values(v_day, p_user_id, 1, now())
  on conflict (day_utc, user_id) do update
    set push_count = private.bark_push_quota.push_count + 1,
        last_push_at = now();

  delete from private.bark_push_quota where day_utc < v_day - 14;
  return true;
end;
$$;

revoke all on function public.reserve_bark_push(uuid) from public, anon, authenticated;
grant execute on function public.reserve_bark_push(uuid) to service_role;

commit;
