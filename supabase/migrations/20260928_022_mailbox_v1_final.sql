-- Stellar Diary V0.16.5 — System Mail V1 finalization
-- Run AFTER 20260927_021_mail_bulk_cleanup.sql.
-- Adds recipient scope (future/current players), GM withdrawal, and hardens
-- player visibility/claim eligibility around cutoff + withdrawal state.

begin;

alter table public.system_mail
  add column if not exists recipient_cutoff_at timestamptz,
  add column if not exists withdrawn_at timestamptz,
  add column if not exists withdrawn_by uuid references auth.users(id) on delete set null;

create index if not exists system_mail_recipient_cutoff_idx
  on public.system_mail(recipient_cutoff_at);
create index if not exists system_mail_withdrawn_idx
  on public.system_mail(withdrawn_at, created_at desc);

-- V0.16.4 emergency cutoff script used an Auth INSERT trigger. V0.16.5 no longer
-- needs per-new-user state writes: eligibility is checked directly against
-- auth.users.created_at, so future registrations cost zero mailbox writes.
drop trigger if exists stellar_hide_cutoff_mail_for_new_user on auth.users;
drop function if exists public.hide_cutoff_mail_for_new_user_v1();

create or replace function private.mail_is_visible_to_user_v2(
  p_mail_id bigint,
  p_uid uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
      from public.system_mail m
      join auth.users u on u.id = p_uid
      left join public.player_mail_state s
        on s.user_id = p_uid and s.mail_id = m.id
     where m.id = p_mail_id
       and m.withdrawn_at is null
       and m.starts_at <= now()
       and (m.expires_at is null or m.expires_at > now())
       and s.deleted_at is null
       and (
         (m.audience_type = 'user' and m.target_user_id = p_uid)
         or
         (m.audience_type = 'all'
          and (m.recipient_cutoff_at is null or u.created_at <= m.recipient_cutoff_at))
       )
  );
$$;

create or replace function public.get_mailbox_v1(p_limit integer default 60)
returns table(
  id bigint,
  title text,
  body text,
  mail_type text,
  rewards jsonb,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz,
  read_at timestamptz,
  claimed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_user_created_at timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode='28000';
  end if;

  select u.created_at into v_user_created_at
    from auth.users u where u.id = v_uid;

  return query
    select m.id, m.title, m.body, m.mail_type, m.rewards,
           m.starts_at, m.expires_at, m.created_at,
           s.read_at, s.claimed_at
      from public.system_mail m
      left join public.player_mail_state s
        on s.user_id = v_uid and s.mail_id = m.id
     where m.withdrawn_at is null
       and m.starts_at <= now()
       and (m.expires_at is null or m.expires_at > now())
       and s.deleted_at is null
       and (
         (m.audience_type = 'user' and m.target_user_id = v_uid)
         or
         (m.audience_type = 'all'
          and (m.recipient_cutoff_at is null or v_user_created_at <= m.recipient_cutoff_at))
       )
     order by (s.read_at is null) desc, m.created_at desc, m.id desc
     limit least(greatest(coalesce(p_limit,60),1),100);
end;
$$;

create or replace function public.get_mailbox_unread_v1()
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_user_created_at timestamptz;
  v_count integer := 0;
begin
  if v_uid is null then return 0; end if;

  select u.created_at into v_user_created_at
    from auth.users u where u.id = v_uid;

  select count(*)::integer into v_count
    from public.system_mail m
    left join public.player_mail_state s
      on s.user_id = v_uid and s.mail_id = m.id
   where m.withdrawn_at is null
     and m.starts_at <= now()
     and (m.expires_at is null or m.expires_at > now())
     and s.deleted_at is null
     and s.read_at is null
     and (
       (m.audience_type = 'user' and m.target_user_id = v_uid)
       or
       (m.audience_type = 'all'
        and (m.recipient_cutoff_at is null or v_user_created_at <= m.recipient_cutoff_at))
     );

  return coalesce(v_count,0);
end;
$$;

create or replace function public.mark_system_mail_read_v1(p_mail_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode='28000';
  end if;
  if not private.mail_is_visible_to_user_v2(p_mail_id, v_uid) then
    return false;
  end if;

  insert into public.player_mail_state(user_id,mail_id,read_at)
  values(v_uid,p_mail_id,now())
  on conflict(user_id,mail_id) do update
    set read_at = coalesce(public.player_mail_state.read_at, excluded.read_at)
    where public.player_mail_state.deleted_at is null;
  return true;
end;
$$;

create or replace function public.delete_system_mail_v1(p_mail_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode='28000';
  end if;
  if not private.mail_is_visible_to_user_v2(p_mail_id, v_uid) then
    return false;
  end if;

  insert into public.player_mail_state(user_id,mail_id,read_at,deleted_at)
  values(v_uid,p_mail_id,now(),now())
  on conflict(user_id,mail_id) do update
    set read_at=coalesce(public.player_mail_state.read_at,excluded.read_at),
        deleted_at=coalesce(public.player_mail_state.deleted_at,excluded.deleted_at);
  return true;
end;
$$;

-- V2 is the hardened claim entrypoint. The legacy V1 implementation remains
-- as the atomic reward engine but is no longer executable by client roles.
create or replace function public.claim_system_mail_v2(p_mail_id bigint)
returns table(ok boolean, reason text, rewards jsonb, farm_state jsonb, revision bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_allowed boolean := false;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode='28000';
  end if;

  -- Row share lock prevents a GM withdrawal from racing past an in-flight claim.
  select true into v_allowed
    from public.system_mail m
    join auth.users u on u.id = v_uid
    left join public.player_mail_state s
      on s.user_id=v_uid and s.mail_id=m.id
   where m.id=p_mail_id
     and m.withdrawn_at is null
     and m.starts_at<=now()
     and (m.expires_at is null or m.expires_at>now())
     and s.deleted_at is null
     and (
       (m.audience_type='user' and m.target_user_id=v_uid)
       or
       (m.audience_type='all'
        and (m.recipient_cutoff_at is null or u.created_at<=m.recipient_cutoff_at))
     )
   for share of m;

  if not coalesce(v_allowed,false) then
    return query select false,'mail_unavailable','{}'::jsonb,null::jsonb,null::bigint;
    return;
  end if;

  return query
    select * from public.claim_system_mail_v1(p_mail_id);
end;
$$;

create or replace function public.gm_send_system_mail_v2(
  p_title text,
  p_body text default '',
  p_mail_type text default 'announcement',
  p_recipient_scope text default 'all_future',
  p_target_user_id uuid default null,
  p_rewards jsonb default '{}'::jsonb,
  p_starts_at timestamptz default now(),
  p_expires_at timestamptz default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id bigint;
  v_audience_type text;
  v_cutoff timestamptz;
  v_start timestamptz := coalesce(p_starts_at,now());
begin
  if v_uid is null or not private.is_stellar_gm(v_uid) then
    raise exception 'gm_forbidden' using errcode='42501';
  end if;
  if char_length(trim(coalesce(p_title,''))) < 1 or char_length(trim(p_title)) > 120 then
    raise exception 'invalid_title';
  end if;
  if char_length(coalesce(p_body,'')) > 6000 then raise exception 'body_too_long'; end if;
  if p_mail_type not in ('announcement','reward') then raise exception 'invalid_mail_type'; end if;
  if p_recipient_scope not in ('all_future','current_all','user') then raise exception 'invalid_recipient_scope'; end if;

  v_audience_type := case when p_recipient_scope='user' then 'user' else 'all' end;
  v_cutoff := case when p_recipient_scope='current_all' then now() else null end;

  if v_audience_type='all' then p_target_user_id := null; end if;
  if v_audience_type='user' and (
    p_target_user_id is null
    or not exists(select 1 from auth.users u where u.id=p_target_user_id)
  ) then
    raise exception 'invalid_target_user';
  end if;
  if p_expires_at is not null and p_expires_at <= v_start then raise exception 'invalid_expiry'; end if;

  perform private.validate_mail_rewards(coalesce(p_rewards,'{}'::jsonb));

  insert into public.system_mail(
    title,body,mail_type,audience_type,target_user_id,rewards,
    starts_at,expires_at,recipient_cutoff_at,created_by
  ) values(
    trim(p_title),coalesce(p_body,''),p_mail_type,v_audience_type,p_target_user_id,
    coalesce(p_rewards,'{}'::jsonb),v_start,p_expires_at,v_cutoff,v_uid
  ) returning id into v_id;

  insert into public.gm_audit_log(gm_user_id,action,subject_id,detail)
  values(
    v_uid,'send_system_mail',v_id::text,
    jsonb_build_object(
      'title',trim(p_title),
      'mail_type',p_mail_type,
      'audience_type',v_audience_type,
      'recipient_scope',p_recipient_scope,
      'target_user_id',p_target_user_id,
      'recipient_cutoff_at',v_cutoff,
      'starts_at',v_start,
      'expires_at',p_expires_at,
      'rewards',coalesce(p_rewards,'{}'::jsonb)
    )
  );

  return v_id;
end;
$$;

create or replace function public.gm_list_system_mail_v2(p_limit integer default 30)
returns table(
  id bigint,
  title text,
  body text,
  mail_type text,
  audience_type text,
  recipient_scope text,
  target_user_id uuid,
  rewards jsonb,
  starts_at timestamptz,
  expires_at timestamptz,
  recipient_cutoff_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not private.is_stellar_gm(v_uid) then
    raise exception 'gm_forbidden' using errcode='42501';
  end if;

  return query
    select m.id,m.title,m.body,m.mail_type,m.audience_type,
           case
             when m.audience_type='user' then 'user'::text
             when m.recipient_cutoff_at is not null then 'current_all'::text
             else 'all_future'::text
           end as recipient_scope,
           m.target_user_id,m.rewards,m.starts_at,m.expires_at,
           m.recipient_cutoff_at,m.withdrawn_at,m.created_at
      from public.system_mail m
     order by m.created_at desc,m.id desc
     limit least(greatest(coalesce(p_limit,30),1),100);
end;
$$;

create or replace function public.gm_withdraw_system_mail_v1(p_mail_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_title text;
begin
  if v_uid is null or not private.is_stellar_gm(v_uid) then
    raise exception 'gm_forbidden' using errcode='42501';
  end if;

  select m.title into v_title
    from public.system_mail m
   where m.id=p_mail_id and m.withdrawn_at is null
   for update;

  if not found then return false; end if;

  update public.system_mail
     set withdrawn_at=now(), withdrawn_by=v_uid
   where id=p_mail_id;

  insert into public.gm_audit_log(gm_user_id,action,subject_id,detail)
  values(v_uid,'withdraw_system_mail',p_mail_id::text,jsonb_build_object('title',v_title));

  return true;
end;
$$;

revoke all on function private.mail_is_visible_to_user_v2(bigint,uuid) from public,anon,authenticated;

-- Client must use V2 for claims so cutoff/withdrawal cannot be bypassed.
revoke execute on function public.claim_system_mail_v1(bigint) from authenticated;
revoke all on function public.claim_system_mail_v2(bigint) from public,anon;
revoke all on function public.gm_send_system_mail_v2(text,text,text,text,uuid,jsonb,timestamptz,timestamptz) from public,anon;
revoke all on function public.gm_list_system_mail_v2(integer) from public,anon;
revoke all on function public.gm_withdraw_system_mail_v1(bigint) from public,anon;

grant execute on function public.claim_system_mail_v2(bigint) to authenticated;
grant execute on function public.gm_send_system_mail_v2(text,text,text,text,uuid,jsonb,timestamptz,timestamptz) to authenticated;
grant execute on function public.gm_list_system_mail_v2(integer) to authenticated;
grant execute on function public.gm_withdraw_system_mail_v1(bigint) to authenticated;

commit;
