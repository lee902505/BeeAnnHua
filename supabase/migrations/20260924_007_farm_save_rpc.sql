-- Stellar Diary V0.13.10 — authoritative farm save RPC
-- Run once in Supabase SQL Editor.
-- Purpose: make browser farm saves reliable by binding writes to auth.uid()
-- server-side instead of relying on a direct RLS table upsert.

begin;

create or replace function public.save_farm_state(
  p_state jsonb,
  p_client_updated_at bigint
)
returns table(
  state jsonb,
  client_updated_at bigint,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_stamp bigint := greatest(coalesce(p_client_updated_at, 0), 0);
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception 'invalid_farm_state' using errcode = '22023';
  end if;

  insert into public.farm_saves(user_id, state, client_updated_at)
  values(v_uid, p_state, v_stamp)
  on conflict (user_id) do update
    set state = excluded.state,
        client_updated_at = excluded.client_updated_at,
        updated_at = now()
    -- Do not allow an older browser request to overwrite a newer farm revision.
    where public.farm_saves.client_updated_at <= excluded.client_updated_at;

  return query
  select fs.state, fs.client_updated_at, fs.updated_at
  from public.farm_saves fs
  where fs.user_id = v_uid;
end;
$$;

revoke all on function public.save_farm_state(jsonb, bigint) from public, anon;
grant execute on function public.save_farm_state(jsonb, bigint) to authenticated;

commit;
