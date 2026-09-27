-- Stellar Diary V0.16.1 — Mail item catalog + item-ID reward attachments
-- Run AFTER 20260927_018_system_mail_gm.sql.
-- Existing V0.16.0 mail remains claimable; new GM mail uses stable item_id values.

begin;

create table if not exists public.mail_item_catalog (
  item_id integer primary key,
  item_code text not null unique,
  category text not null check (category in ('currency','box','seed','supply')),
  reward_kind text not null check (reward_kind in ('coin','exp','seed','supply')),
  state_key text,
  name_zh_cn text not null,
  name_zh_tw text not null,
  name_en text not null,
  icon_source text not null default 'farm' check (icon_source in ('farm','farm_item','site')),
  icon_key text,
  icon_cell integer,
  max_quantity integer not null default 100000 check (max_quantity > 0),
  sort_order integer not null default 0,
  mail_enabled boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mail_item_catalog_code_check check (item_code ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  constraint mail_item_catalog_state_key_check check (
    (reward_kind in ('coin','exp') and state_key is null)
    or (reward_kind in ('seed','supply') and nullif(state_key,'') is not null)
  )
);

alter table public.mail_item_catalog enable row level security;
revoke all on table public.mail_item_catalog from public, anon, authenticated;

insert into public.mail_item_catalog
(item_id,item_code,category,reward_kind,state_key,name_zh_cn,name_zh_tw,name_en,icon_source,icon_key,icon_cell,max_quantity,sort_order,mail_enabled,active)
values
(1001,'currency.coin','currency','coin',null,'金币','金幣','Coins','farm','coin',null,1000000,10,true,true),
(1002,'currency.exp','currency','exp',null,'EXP','EXP','EXP','farm','exp',null,1000000,20,true,true),
(2001,'box.mystery','box','seed','mystery','蔬果盲盒','蔬果盲盒','Produce mystery box','farm','reward-box',null,100000,30,true,true),
(3001,'seed.carrot','seed','seed','carrot','红萝卜种子','紅蘿蔔種子','Carrot seeds','farm','seed-carrot',null,100000,101,true,true),
(3002,'seed.wheat','seed','seed','wheat','小麦种子','小麥種子','Wheat seeds','farm','seed-wheat',null,100000,102,true,true),
(3003,'seed.corn','seed','seed','corn','玉米种子','玉米種子','Corn seeds','farm','seed-corn',null,100000,103,true,true),
(3004,'seed.tomato','seed','seed','tomato','番茄种子','番茄種子','Tomato seeds','farm','seed-tomato',null,100000,104,true,true),
(3005,'seed.strawberry','seed','seed','strawberry','草莓种子','草莓種子','Strawberry seeds','farm','seed-strawberry',null,100000,105,true,true),
(3006,'seed.pumpkin','seed','seed','pumpkin','南瓜种子','南瓜種子','Pumpkin seeds','farm','seed-pumpkin',null,100000,106,true,true),
(3007,'seed.grape','seed','seed','grape','葡萄种子','葡萄種子','Grape seeds','farm','seed-grape',null,100000,107,true,true),
(3008,'seed.starfruit','seed','seed','starfruit','星辰果种子','星辰果種子','Starfruit seeds','farm','seed-starfruit',null,100000,108,true,true),
(4001,'supply.fertilizer_low','supply','supply','fertilizerLow','低级肥料','低級肥料','Basic fertilizer','farm_item',null,5,100000,201,true,true),
(4002,'supply.fertilizer_mid','supply','supply','fertilizerMid','中级肥料','中級肥料','Medium fertilizer','farm_item',null,6,100000,202,true,true),
(4003,'supply.fertilizer_high','supply','supply','fertilizerHigh','高级肥料','高級肥料','Advanced fertilizer','farm_item',null,7,100000,203,true,true)
on conflict (item_id) do update set
  item_code=excluded.item_code,
  category=excluded.category,
  reward_kind=excluded.reward_kind,
  state_key=excluded.state_key,
  name_zh_cn=excluded.name_zh_cn,
  name_zh_tw=excluded.name_zh_tw,
  name_en=excluded.name_en,
  icon_source=excluded.icon_source,
  icon_key=excluded.icon_key,
  icon_cell=excluded.icon_cell,
  max_quantity=excluded.max_quantity,
  sort_order=excluded.sort_order,
  mail_enabled=excluded.mail_enabled,
  active=excluded.active,
  updated_at=now();

-- Authenticated players may retrieve the safe public item catalog only through RPC.
create or replace function public.get_mail_item_catalog_v1()
returns table(
  item_id integer,
  item_code text,
  category text,
  name_zh_cn text,
  name_zh_tw text,
  name_en text,
  icon_source text,
  icon_key text,
  icon_cell integer,
  max_quantity integer,
  sort_order integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.item_id,c.item_code,c.category,c.name_zh_cn,c.name_zh_tw,c.name_en,
         c.icon_source,c.icon_key,c.icon_cell,c.max_quantity,c.sort_order
    from public.mail_item_catalog c
   where c.active and c.mail_enabled
   order by c.sort_order,c.item_id;
$$;

-- GM-only UID lookup so targeted mail can be verified before publishing.
create or replace function public.gm_lookup_player_v1(p_user_id uuid)
returns table(user_id uuid, display_name text, email text, farm_level integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or not private.is_stellar_gm(v_uid) then
    raise exception 'gm_forbidden' using errcode='42501';
  end if;
  return query
    select u.id,
           coalesce(nullif(trim(p.display_name),''),'未设置名称')::text,
           coalesce(u.email,'')::text,
           greatest(1,coalesce(nullif(fs.state->>'level','')::integer,1))
      from auth.users u
      left join public.profiles p on p.id=u.id
      left join public.farm_saves fs on fs.user_id=u.id
     where u.id=p_user_id;
end;
$$;

-- V0.16.1 reward validator: accepts new {items:[{item_id,quantity}]} format,
-- while retaining V0.16.0 legacy fields so already-issued mail never breaks.
create or replace function private.validate_mail_rewards(p_rewards jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
  v_value jsonb;
  v_num numeric;
  v_item jsonb;
  v_item_id integer;
  v_qty integer;
  v_max integer;
begin
  if p_rewards is null or jsonb_typeof(p_rewards) <> 'object' then
    raise exception 'invalid_rewards' using errcode='22023';
  end if;

  if (p_rewards - 'items' - 'coins' - 'exp' - 'seeds' - 'supplies') <> '{}'::jsonb then
    raise exception 'unknown_reward_key' using errcode='22023';
  end if;

  if p_rewards ? 'items' then
    if jsonb_typeof(p_rewards->'items') <> 'array' then raise exception 'invalid_reward_items'; end if;
    if jsonb_array_length(p_rewards->'items') > 20 then raise exception 'too_many_reward_items'; end if;
    if (select count(*) from jsonb_array_elements(p_rewards->'items')) <>
       (select count(distinct (value->>'item_id')) from jsonb_array_elements(p_rewards->'items')) then
      raise exception 'duplicate_reward_item';
    end if;
    for v_item in select value from jsonb_array_elements(p_rewards->'items') loop
      if jsonb_typeof(v_item) <> 'object' or (v_item - 'item_id' - 'quantity') <> '{}'::jsonb then
        raise exception 'invalid_reward_item';
      end if;
      begin
        v_item_id := (v_item->>'item_id')::integer;
        v_qty := (v_item->>'quantity')::integer;
      exception when others then raise exception 'invalid_reward_item'; end;
      select c.max_quantity into v_max
        from public.mail_item_catalog c
       where c.item_id=v_item_id and c.active and c.mail_enabled;
      if not found then raise exception 'unknown_item_id:%',v_item_id; end if;
      if v_qty <= 0 or v_qty > v_max then raise exception 'invalid_reward_quantity'; end if;
    end loop;
  end if;

  foreach v_key in array array['coins','exp'] loop
    if p_rewards ? v_key then
      begin v_num := (p_rewards->>v_key)::numeric; exception when others then raise exception 'invalid_reward_quantity'; end;
      if v_num < 0 or v_num > 1000000 or trunc(v_num) <> v_num then raise exception 'invalid_reward_quantity'; end if;
    end if;
  end loop;

  if p_rewards ? 'seeds' then
    if jsonb_typeof(p_rewards->'seeds') <> 'object' then raise exception 'invalid_seed_rewards'; end if;
    for v_key,v_value in select key,value from jsonb_each(p_rewards->'seeds') loop
      if v_key not in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit','mystery') then raise exception 'unknown_seed_reward'; end if;
      begin v_num := trim(both '"' from v_value::text)::numeric; exception when others then raise exception 'invalid_reward_quantity'; end;
      if v_num < 0 or v_num > 100000 or trunc(v_num) <> v_num then raise exception 'invalid_reward_quantity'; end if;
    end loop;
  end if;

  if p_rewards ? 'supplies' then
    if jsonb_typeof(p_rewards->'supplies') <> 'object' then raise exception 'invalid_supply_rewards'; end if;
    for v_key,v_value in select key,value from jsonb_each(p_rewards->'supplies') loop
      if v_key not in ('fertilizerLow','fertilizerMid','fertilizerHigh') then raise exception 'unknown_supply_reward'; end if;
      begin v_num := trim(both '"' from v_value::text)::numeric; exception when others then raise exception 'invalid_reward_quantity'; end;
      if v_num < 0 or v_num > 100000 or trunc(v_num) <> v_num then raise exception 'invalid_reward_quantity'; end if;
    end loop;
  end if;
end;
$$;

-- Replace claim RPC to understand both stable item IDs and legacy rewards.
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

revoke all on function public.get_mail_item_catalog_v1() from public,anon;
revoke all on function public.gm_lookup_player_v1(uuid) from public,anon;
grant execute on function public.get_mail_item_catalog_v1() to authenticated;
grant execute on function public.gm_lookup_player_v1(uuid) to authenticated;

commit;
