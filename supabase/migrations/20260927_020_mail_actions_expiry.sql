-- Stellar Diary V0.16.2 — mailbox actions / soft delete / expiry UX support
-- Run AFTER 20260927_019_mail_item_catalog.sql.
-- Player deletion is per-account soft deletion; the GM/system mail record is retained.

begin;

alter table public.player_mail_state
  add column if not exists deleted_at timestamptz;

create index if not exists player_mail_state_deleted_idx
  on public.player_mail_state(user_id, deleted_at, read_at, claimed_at);

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
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode='28000'; end if;
  return query
    select m.id, m.title, m.body, m.mail_type, m.rewards, m.starts_at, m.expires_at, m.created_at,
           s.read_at, s.claimed_at
      from public.system_mail m
      left join public.player_mail_state s on s.user_id = v_uid and s.mail_id = m.id
     where m.starts_at <= now()
       and (m.expires_at is null or m.expires_at > now())
       and (m.audience_type = 'all' or (m.audience_type = 'user' and m.target_user_id = v_uid))
       and s.deleted_at is null
     order by (s.read_at is null) desc, m.created_at desc, m.id desc
     limit least(greatest(coalesce(p_limit,60),1),100);
end;
$$;

create or replace function public.get_mailbox_unread_v1()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case when auth.uid() is null then 0 else (
    select count(*)::integer
    from public.system_mail m
    left join public.player_mail_state s on s.user_id = auth.uid() and s.mail_id = m.id
    where m.starts_at <= now()
      and (m.expires_at is null or m.expires_at > now())
      and (m.audience_type = 'all' or (m.audience_type = 'user' and m.target_user_id = auth.uid()))
      and s.deleted_at is null
      and s.read_at is null
  ) end;
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
  if v_uid is null then raise exception 'not_authenticated' using errcode='28000'; end if;
  if exists(
    select 1 from public.player_mail_state s
     where s.user_id=v_uid and s.mail_id=p_mail_id and s.deleted_at is not null
  ) then return false; end if;
  if not exists(
    select 1 from public.system_mail m
    where m.id = p_mail_id and m.starts_at <= now() and (m.expires_at is null or m.expires_at > now())
      and (m.audience_type='all' or (m.audience_type='user' and m.target_user_id=v_uid))
  ) then return false; end if;

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
  if v_uid is null then raise exception 'not_authenticated' using errcode='28000'; end if;
  if not exists(
    select 1 from public.system_mail m
     where m.id=p_mail_id
       and m.starts_at<=now()
       and (m.expires_at is null or m.expires_at>now())
       and (m.audience_type='all' or (m.audience_type='user' and m.target_user_id=v_uid))
  ) then return false; end if;

  insert into public.player_mail_state(user_id,mail_id,read_at,deleted_at)
  values(v_uid,p_mail_id,now(),now())
  on conflict(user_id,mail_id) do update
    set read_at=coalesce(public.player_mail_state.read_at,excluded.read_at),
        deleted_at=coalesce(public.player_mail_state.deleted_at,excluded.deleted_at);
  return true;
end;
$$;

create or replace function public.claim_system_mail_v1(p_mail_id bigint)
returns table(ok boolean, reason text, rewards jsonb, farm_state jsonb, revision bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_rewards jsonb;
  v_state jsonb;
  v_claimed timestamptz;
  v_key text;
  v_value jsonb;
  v_qty integer;
  v_current integer;
  v_coins integer;
  v_exp integer;
  v_exp_bonus integer := 0;
  v_level integer;
  v_need integer;
  v_revision bigint;
  v_item jsonb;
  v_item_id integer;
  v_kind text;
  v_state_key text;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode='28000'; end if;
  if not exists(select 1 from auth.users u where u.id=v_uid and nullif(u.email,'') is not null) then
    return query select false,'member_required','{}'::jsonb,null::jsonb,null::bigint; return;
  end if;

  if exists(
    select 1 from public.player_mail_state s
     where s.user_id=v_uid and s.mail_id=p_mail_id and s.deleted_at is not null
  ) then
    return query select false,'mail_deleted','{}'::jsonb,null::jsonb,null::bigint; return;
  end if;

  select m.rewards into v_rewards
    from public.system_mail m
   where m.id=p_mail_id and m.starts_at<=now() and (m.expires_at is null or m.expires_at>now())
     and (m.audience_type='all' or (m.audience_type='user' and m.target_user_id=v_uid))
   for share;
  if not found then return query select false,'mail_unavailable','{}'::jsonb,null::jsonb,null::bigint; return; end if;
  perform private.validate_mail_rewards(v_rewards);
  if v_rewards='{}'::jsonb or (v_rewards ? 'items' and jsonb_array_length(v_rewards->'items')=0 and (v_rewards-'items')='{}'::jsonb) then
    return query select false,'no_attachments',v_rewards,null::jsonb,null::bigint; return;
  end if;

  insert into public.player_mail_state(user_id,mail_id,read_at,claimed_at)
  values(v_uid,p_mail_id,now(),null)
  on conflict(user_id,mail_id) do nothing;

  select s.claimed_at into v_claimed
    from public.player_mail_state s where s.user_id=v_uid and s.mail_id=p_mail_id for update;
  if v_claimed is not null then return query select false,'already_claimed',v_rewards,null::jsonb,null::bigint; return; end if;

  insert into public.farm_saves(user_id,state,client_updated_at)
  values(v_uid,jsonb_build_object(
      'version',1,'createdAt',floor(extract(epoch from now())*1000)::bigint,
      'coins',100,'level',1,'exp',0,'plots','[]'::jsonb,
      'seeds',jsonb_build_object('carrot',3,'wheat',2),'produce','{}'::jsonb,
      'supplies',jsonb_build_object('fertilizerLow',0,'fertilizerMid',0,'fertilizerHigh',0),
      'stats',jsonb_build_object('visit',1,'plant',0,'harvest',0,'sell',0,'friend',0,'blindBoxPlant',0,'steals',0,'maxCoins',100),
      'updatedAt',floor(extract(epoch from now())*1000)::bigint),
    floor(extract(epoch from now())*1000)::bigint)
  on conflict(user_id) do nothing;

  select fs.state into v_state from public.farm_saves fs where fs.user_id=v_uid for update;
  v_state := coalesce(v_state,'{}'::jsonb);
  v_state := jsonb_set(v_state,'{seeds}',coalesce(v_state->'seeds','{}'::jsonb),true);
  v_state := jsonb_set(v_state,'{supplies}',coalesce(v_state->'supplies','{}'::jsonb),true);
  v_state := jsonb_set(v_state,'{stats}',coalesce(v_state->'stats','{}'::jsonb),true);

  v_coins := greatest(0,coalesce(nullif(v_state->>'coins','')::integer,0));
  v_exp_bonus := greatest(0,coalesce((v_rewards->>'exp')::integer,0));

  -- New item-ID attachment format.
  if v_rewards ? 'items' then
    for v_item in select value from jsonb_array_elements(v_rewards->'items') loop
      v_item_id := (v_item->>'item_id')::integer;
      v_qty := (v_item->>'quantity')::integer;
      select c.reward_kind,c.state_key into v_kind,v_state_key
        from public.mail_item_catalog c
       where c.item_id=v_item_id and c.active and c.mail_enabled;
      if v_kind='coin' then
        v_coins := v_coins + v_qty;
      elsif v_kind='exp' then
        v_exp_bonus := v_exp_bonus + v_qty;
      elsif v_kind='seed' then
        v_current := greatest(0,coalesce(nullif(v_state->'seeds'->>v_state_key,'')::integer,0));
        v_state := jsonb_set(v_state,array['seeds',v_state_key],to_jsonb(v_current+v_qty),true);
      elsif v_kind='supply' then
        v_current := greatest(0,coalesce(nullif(v_state->'supplies'->>v_state_key,'')::integer,0));
        v_state := jsonb_set(v_state,array['supplies',v_state_key],to_jsonb(v_current+v_qty),true);
      end if;
    end loop;
  end if;

  -- Legacy V0.16.0 attachments remain supported.
  v_coins := v_coins + greatest(0,coalesce((v_rewards->>'coins')::integer,0));
  if v_rewards ? 'seeds' then
    for v_key,v_value in select key,value from jsonb_each(v_rewards->'seeds') loop
      v_qty := greatest(0,trim(both '"' from v_value::text)::integer);
      v_current := greatest(0,coalesce(nullif(v_state->'seeds'->>v_key,'')::integer,0));
      v_state := jsonb_set(v_state,array['seeds',v_key],to_jsonb(v_current+v_qty),true);
    end loop;
  end if;
  if v_rewards ? 'supplies' then
    for v_key,v_value in select key,value from jsonb_each(v_rewards->'supplies') loop
      v_qty := greatest(0,trim(both '"' from v_value::text)::integer);
      v_current := greatest(0,coalesce(nullif(v_state->'supplies'->>v_key,'')::integer,0));
      v_state := jsonb_set(v_state,array['supplies',v_key],to_jsonb(v_current+v_qty),true);
    end loop;
  end if;

  v_state := jsonb_set(v_state,'{coins}',to_jsonb(v_coins),true);
  v_current := greatest(v_coins,coalesce(nullif(v_state->'stats'->>'maxCoins','')::integer,0));
  v_state := jsonb_set(v_state,'{stats,maxCoins}',to_jsonb(v_current),true);

  v_level := greatest(1,coalesce(nullif(v_state->>'level','')::integer,1));
  v_exp := greatest(0,coalesce(nullif(v_state->>'exp','')::integer,0)) + v_exp_bonus;
  loop
    v_need := private.farm_exp_need(v_level);
    exit when v_exp < v_need;
    v_exp := v_exp-v_need;
    v_level := v_level+1;
  end loop;
  v_state := jsonb_set(v_state,'{level}',to_jsonb(v_level),true);
  v_state := jsonb_set(v_state,'{exp}',to_jsonb(v_exp),true);
  v_state := jsonb_set(v_state,'{updatedAt}',to_jsonb(floor(extract(epoch from now())*1000)::bigint),true);

  update public.farm_saves fs
     set state=v_state,client_updated_at=floor(extract(epoch from now())*1000)::bigint,updated_at=now()
   where fs.user_id=v_uid
   returning fs.revision into v_revision;

  update public.player_mail_state
     set read_at=coalesce(read_at,now()),claimed_at=now()
   where user_id=v_uid and mail_id=p_mail_id;

  return query select true,'claimed',v_rewards,v_state,v_revision;
end;
$$;


revoke all on function public.delete_system_mail_v1(bigint) from public,anon;
grant execute on function public.delete_system_mail_v1(bigint) to authenticated;

commit;
