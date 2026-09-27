-- Stellar Diary V0.16.3 — bulk cleanup of claimed player mail
begin;

create or replace function public.clear_claimed_system_mail_v1()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode='28000';
  end if;

  -- Player-local soft delete only. This never deletes the shared system_mail row,
  -- never touches unclaimed reward mail, and never removes plain announcements
  -- unless that mail actually has a claimed_at state.
  update public.player_mail_state s
     set deleted_at = coalesce(s.deleted_at, now()),
         read_at = coalesce(s.read_at, now())
   where s.user_id = v_uid
     and s.claimed_at is not null
     and s.deleted_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.clear_claimed_system_mail_v1() from public, anon;
grant execute on function public.clear_claimed_system_mail_v1() to authenticated;

commit;
