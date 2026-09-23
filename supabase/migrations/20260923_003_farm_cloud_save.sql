-- Stellar Diary V0.13.0 — Farm cloud save foundation
-- Run once in Supabase SQL Editor before enabling farm cloud sync.
-- This table is a private per-user cloud save. It is NOT used for public rankings yet.

begin;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists public.farm_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  client_updated_at bigint not null default 0 check (client_updated_at >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_farm_saves_updated_at on public.farm_saves;
create trigger trg_farm_saves_updated_at
before update on public.farm_saves
for each row execute function private.set_updated_at();

alter table public.farm_saves enable row level security;

revoke all on table public.farm_saves from public, anon;
grant select, insert, update, delete on table public.farm_saves to authenticated;

drop policy if exists farm_saves_select_own on public.farm_saves;
create policy farm_saves_select_own
on public.farm_saves
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists farm_saves_insert_own on public.farm_saves;
create policy farm_saves_insert_own
on public.farm_saves
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists farm_saves_update_own on public.farm_saves;
create policy farm_saves_update_own
on public.farm_saves
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists farm_saves_delete_own on public.farm_saves;
create policy farm_saves_delete_own
on public.farm_saves
for delete
to authenticated
using (auth.uid() = user_id);

revoke all on function private.set_updated_at() from public, anon, authenticated;

commit;
