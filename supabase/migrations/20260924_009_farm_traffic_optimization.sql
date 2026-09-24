-- Stellar Diary V0.13.13 — farm traffic optimization
-- Run once after 008.
-- Goals:
-- 1) successful browser saves return metadata only instead of the full farm JSON;
-- 2) revision conflicts still return the authoritative state so the client can rebase safely;
-- 3) retire the V2 browser RPC so stale builds fail closed instead of wasting bandwidth.

begin;

revoke execute on function public.save_farm_state_v2(jsonb, bigint, bigint) from authenticated;

create or replace function public.save_farm_state_v3(
  p_state jsonb,
  p_client_updated_at bigint,
  p_expected_revision bigint
)
returns table(
  revision bigint,
  client_updated_at bigint,
  updated_at timestamptz,
  applied boolean,
  conflict_state jsonb
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
      select fs.revision,
             fs.client_updated_at,
             fs.updated_at,
             true,
             null::jsonb
        from public.farm_saves fs
       where fs.user_id = v_uid;
    return;
  end if;

  if v_expected <> v_current_revision then
    return query
      select fs.revision,
             fs.client_updated_at,
             fs.updated_at,
             false,
             fs.state
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
    select fs.revision,
           fs.client_updated_at,
           fs.updated_at,
           true,
           null::jsonb
      from public.farm_saves fs
     where fs.user_id = v_uid;
end;
$$;

revoke all on function public.save_farm_state_v3(jsonb, bigint, bigint) from public, anon;
grant execute on function public.save_farm_state_v3(jsonb, bigint, bigint) to authenticated;

commit;
