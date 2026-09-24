-- Stellar Diary V0.13.10 — authoritative farm revision guard
-- Run once after 007.
-- Goals:
-- 1) stop old/cached clients from directly overwriting farm_saves;
-- 2) make every browser save use optimistic concurrency control;
-- 3) reject stale full-state writes instead of letting a later timestamp erase newer data.

begin;

alter table public.farm_saves
  add column if not exists revision bigint not null default 1 check (revision >= 1);


-- Every server-side mutation (including friend stealing from migration 006)
-- must advance the same revision. This trigger makes the revision universal,
-- not only something changed by the browser save RPC.
create or replace function private.bump_farm_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.revision = old.revision + 1;
  return new;
end;
$$;

drop trigger if exists trg_farm_saves_revision on public.farm_saves;
create trigger trg_farm_saves_revision
before update on public.farm_saves
for each row execute function private.bump_farm_revision();

revoke all on function private.bump_farm_revision() from public, anon, authenticated;

-- The browser may read its own save, but must no longer write the table directly.
-- This blocks older site builds / stale tabs that still use .upsert() against farm_saves.
revoke insert, update, delete on table public.farm_saves from authenticated;
grant select on table public.farm_saves to authenticated;

-- Retire the V0.13.9 write RPC for browser clients. Old cached pages will fail closed
-- instead of silently overwriting a newer farm save.
revoke execute on function public.save_farm_state(jsonb, bigint) from authenticated;

create or replace function public.save_farm_state_v2(
  p_state jsonb,
  p_client_updated_at bigint,
  p_expected_revision bigint
)
returns table(
  state jsonb,
  client_updated_at bigint,
  updated_at timestamptz,
  revision bigint,
  applied boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_stamp bigint := greatest(coalesce(p_client_updated_at, 0), 0);
  v_expected bigint := greatest(coalesce(p_expected_revision, 0), 0);
  v_current_revision bigint;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception 'invalid_farm_state' using errcode = '22023';
  end if;

  -- Serialize saves for this user's row while checking the revision.
  select fs.revision
    into v_current_revision
    from public.farm_saves fs
   where fs.user_id = v_uid
   for update;

  if not found then
    if v_expected <> 0 then
      return;
    end if;

    insert into public.farm_saves(user_id, state, client_updated_at, revision)
    values(v_uid, p_state, v_stamp, 1);

    return query
      select fs.state, fs.client_updated_at, fs.updated_at, fs.revision, true
        from public.farm_saves fs
       where fs.user_id = v_uid;
    return;
  end if;

  if v_expected <> v_current_revision then
    return query
      select fs.state, fs.client_updated_at, fs.updated_at, fs.revision, false
        from public.farm_saves fs
       where fs.user_id = v_uid;
    return;
  end if;

  update public.farm_saves fs
     set state = p_state,
         client_updated_at = v_stamp,
         updated_at = now()
   where fs.user_id = v_uid;

  return query
    select fs.state, fs.client_updated_at, fs.updated_at, fs.revision, true
      from public.farm_saves fs
     where fs.user_id = v_uid;
end;
$$;

revoke all on function public.save_farm_state_v2(jsonb, bigint, bigint) from public, anon;
grant execute on function public.save_farm_state_v2(jsonb, bigint, bigint) to authenticated;

commit;
