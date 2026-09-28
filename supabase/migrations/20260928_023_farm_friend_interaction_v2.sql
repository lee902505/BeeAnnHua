-- Stellar Diary V0.17.0 — Farm Friends Interaction 2.0
-- Run once after migration 022. Existing farms, friendships, steals and activity are preserved.
-- Adds friend overview counts, one-time friend watering (-5% growth time), batch care,
-- and a two-way activity feed (received interactions / my footsteps).

begin;

-- ---------------------------------------------------------------------------
-- 1) Activity feed: allow friend watering events.
-- ---------------------------------------------------------------------------
alter table public.farm_activity
  drop constraint if exists farm_activity_activity_type_check;

alter table public.farm_activity
  add constraint farm_activity_activity_type_check
  check (activity_type in ('visit','steal','help_bug','help_water','friend'));

-- ---------------------------------------------------------------------------
-- 2) Shared authoritative grow-duration helper.
--    friendWatered=true adds one extra 0.95 factor for the current crop cycle.
-- ---------------------------------------------------------------------------
create or replace function public.farm_plot_duration_ms_v1(p_plot jsonb)
returns bigint
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_crop text := coalesce(p_plot->>'cropId','');
  v_minutes integer;
  v_factor numeric := 1.0;
  v_fertilizer text := coalesce(p_plot->>'fertilizerId','');
  v_event_factor numeric := 1.0;
begin
  v_minutes := case v_crop
    when 'carrot' then 20
    when 'wheat' then 30
    when 'corn' then 30
    when 'tomato' then 50
    when 'strawberry' then 90
    when 'pumpkin' then 150
    when 'grape' then 240
    when 'starfruit' then 480
    when 'mystery' then 240
    else 0
  end;

  if v_minutes <= 0 then return 0; end if;
  if v_crop = 'mystery' then return (v_minutes::bigint * 60000); end if;

  if coalesce(p_plot->>'watered','false') = 'true' then
    v_factor := v_factor * 0.92;
  end if;

  v_factor := v_factor * case v_fertilizer
    when 'fertilizerLow' then 0.90
    when 'fertilizerMid' then 0.80
    when 'fertilizerHigh' then 0.70
    else 1.00
  end;

  if coalesce(p_plot->>'eventGrowFactor','') ~ '^[0-9]+([.][0-9]+)?$' then
    v_event_factor := greatest(0.90, least(1.0, (p_plot->>'eventGrowFactor')::numeric));
  end if;
  v_factor := v_factor * v_event_factor;

  if coalesce(p_plot->>'friendWatered','false') = 'true' then
    v_factor := v_factor * 0.95;
  end if;

  v_factor := greatest(0.45, least(1.0, v_factor));
  return round(v_minutes::numeric * 60000 * v_factor)::bigint;
end;
$$;

revoke all on function public.farm_plot_duration_ms_v1(jsonb) from public, anon, authenticated;
grant execute on function public.farm_plot_duration_ms_v1(jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 3) Friend farm payload V6: preserve V5 decorations and expose friend-help
--    watering metadata without exposing the full private save.
-- ---------------------------------------------------------------------------
create or replace function public.get_friend_farm_v6(
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
  v_state jsonb;
  v_plots jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  v_payload := public.get_friend_farm_v5(p_friend, p_log_visit);
  if not coalesce((v_payload->>'ok')::boolean, false) then
    return v_payload;
  end if;

  select fs.state into v_state
    from public.farm_saves fs
   where fs.user_id = p_friend;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_farm');
  end if;

  select coalesce(jsonb_agg(
    coalesce(base.elem, '{}'::jsonb) || jsonb_build_object(
      'friendWatered', coalesce((owner_plot.elem->>'friendWatered')::boolean, false),
      'friendWateredByName', left(coalesce(owner_plot.elem->>'friendWateredByName',''), 80),
      'friendWateredAt', case
        when coalesce(owner_plot.elem->>'friendWateredAt','') ~ '^[0-9]+$'
          then (owner_plot.elem->>'friendWateredAt')::bigint
        else null
      end
    ) order by base.ord
  ), '[]'::jsonb)
  into v_plots
  from jsonb_array_elements(coalesce(v_payload->'plots','[]'::jsonb)) with ordinality as base(elem,ord)
  left join lateral (
    select x.elem
    from jsonb_array_elements(coalesce(v_state->'plots','[]'::jsonb)) with ordinality as x(elem,ord)
    where x.ord = base.ord
    limit 1
  ) owner_plot on true;

  return v_payload || jsonb_build_object('plots', v_plots);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) Batch friend overview. One RPC returns all existing friendship rows plus
--    live interaction counts for accepted friends, avoiding one request/friend.
-- ---------------------------------------------------------------------------
create or replace function public.get_farm_friends_v3()
returns table (
  user_id uuid,
  display_name text,
  sex text,
  farm_level integer,
  coins bigint,
  title_id text,
  relation_state text,
  requested_at timestamptz,
  mature_count integer,
  stealable_count integer,
  pest_count integer,
  help_water_count integer,
  interaction_score integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  return query
  select
    f.user_id,
    f.display_name,
    f.sex,
    f.farm_level,
    f.coins,
    f.title_id,
    f.relation_state,
    f.requested_at,
    case when f.relation_state='friend' then coalesce(o.mature_count,0) else 0 end,
    case when f.relation_state='friend' then coalesce(o.stealable_count,0) else 0 end,
    case when f.relation_state='friend' then coalesce(o.pest_count,0) else 0 end,
    case when f.relation_state='friend' then coalesce(o.help_water_count,0) else 0 end,
    case when f.relation_state='friend' then coalesce(o.interaction_score,0) else 0 end
  from public.get_farm_friends_v2() f
  left join public.farm_saves fs on fs.user_id = f.user_id
  left join lateral (
    select
      count(*) filter (
        where p.crop_id <> ''
          and p.planted_at is not null
          and p.duration_ms > 0
          and v_now_ms - p.planted_at >= p.duration_ms
      )::integer as mature_count,
      count(*) filter (
        where p.crop_id in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit')
          and p.planted_at is not null
          and p.duration_ms > 0
          and v_now_ms - p.planted_at >= p.duration_ms
          and greatest(1, p.total_yield - p.stolen_count) > 1
          and not p.stolen_by_me
      )::integer as stealable_count,
      count(*) filter (
        where p.crop_id <> '' and p.has_pest
      )::integer as pest_count,
      count(*) filter (
        where p.crop_id in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit')
          and p.planted_at is not null
          and p.duration_ms > 0
          and v_now_ms - p.planted_at < p.duration_ms
          and not p.friend_watered
      )::integer as help_water_count,
      (
        count(*) filter (
          where p.crop_id in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit')
            and p.planted_at is not null
            and p.duration_ms > 0
            and v_now_ms - p.planted_at >= p.duration_ms
            and greatest(1, p.total_yield - p.stolen_count) > 1
            and not p.stolen_by_me
        ) * 100
        + count(*) filter (where p.crop_id <> '' and p.has_pest) * 40
        + count(*) filter (
          where p.crop_id in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit')
            and p.planted_at is not null
            and p.duration_ms > 0
            and v_now_ms - p.planted_at < p.duration_ms
            and not p.friend_watered
        ) * 10
      )::integer as interaction_score
    from (
      select
        (plot.ord - 1)::integer as plot_id,
        case when plot.elem->>'cropId' in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit','mystery') then plot.elem->>'cropId' else '' end as crop_id,
        case when coalesce(plot.elem->>'plantedAt','') ~ '^[0-9]+$' then (plot.elem->>'plantedAt')::bigint else null end as planted_at,
        public.farm_plot_duration_ms_v1(plot.elem) as duration_ms,
        case when coalesce(plot.elem->>'harvestYield','') ~ '^[0-9]+$' then greatest(1,(plot.elem->>'harvestYield')::integer) else 4 end as total_yield,
        case when coalesce(plot.elem->>'stolenCount','') ~ '^[0-9]+$' then greatest(0,(plot.elem->>'stolenCount')::integer) else 0 end as stolen_count,
        coalesce((plot.elem->>'hasPest')::boolean,false) as has_pest,
        coalesce((plot.elem->>'friendWatered')::boolean,false) as friend_watered,
        exists (
          select 1 from public.farm_steals st
          where st.thief_id = v_uid
            and st.owner_id = f.user_id
            and st.plot_id = (plot.ord - 1)::integer
            and st.planted_at = case when coalesce(plot.elem->>'plantedAt','') ~ '^[0-9]+$' then (plot.elem->>'plantedAt')::bigint else -1 end
        ) as stolen_by_me
      from jsonb_array_elements(coalesce(fs.state->'plots','[]'::jsonb)) with ordinality as plot(elem,ord)
      where plot.ord <= 20
    ) p
  ) o on f.relation_state='friend'
  order by
    case
      when f.relation_state='pending_in' then 0
      when f.relation_state='friend' then 1
      else 2
    end,
    case when f.relation_state='friend' then coalesce(o.interaction_score,0) else 0 end desc,
    f.requested_at desc,
    f.display_name asc;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) One-time friend watering. p_plot=NULL means one-click water all eligible
--    growing normal crops. Each crop cycle can receive this bonus only once.
-- ---------------------------------------------------------------------------
create or replace function public.help_friend_water_v1(
  p_friend uuid,
  p_plot integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_low uuid;
  v_high uuid;
  v_owner_state jsonb;
  v_plot jsonb;
  v_crop_id text;
  v_planted_at bigint;
  v_duration_ms bigint;
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_helper_name text := '农场好友';
  v_count integer := 0;
  v_ids jsonb := '[]'::jsonb;
  i integer;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','not_authenticated'); end if;
  if p_friend is null or p_friend = v_uid then return jsonb_build_object('ok',false,'reason','invalid_target'); end if;
  if p_plot is not null and (p_plot < 0 or p_plot > 19) then return jsonb_build_object('ok',false,'reason','invalid_plot'); end if;

  if v_uid::text < p_friend::text then v_low := v_uid; v_high := p_friend;
  else v_low := p_friend; v_high := v_uid; end if;

  if not exists (
    select 1 from public.farm_friendships f
    where f.user_low=v_low and f.user_high=v_high and f.status='accepted'
  ) then return jsonb_build_object('ok',false,'reason','not_friend'); end if;

  select coalesce(nullif(trim(p.display_name),''),'农场好友')
    into v_helper_name
    from public.profiles p
   where p.id=v_uid;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('water:' || p_friend::text,0));
  select fs.state into v_owner_state
    from public.farm_saves fs
   where fs.user_id=p_friend
   for update;
  if not found then return jsonb_build_object('ok',false,'reason','no_farm'); end if;

  for i in 0..19 loop
    if p_plot is not null and i <> p_plot then continue; end if;

    v_plot := v_owner_state->'plots'->i;
    if v_plot is null then continue; end if;
    v_crop_id := coalesce(v_plot->>'cropId','');
    if v_crop_id not in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit') then continue; end if;
    if coalesce(v_plot->>'friendWatered','false') = 'true' then continue; end if;
    if coalesce(v_plot->>'plantedAt','') !~ '^[0-9]+$' then continue; end if;

    v_planted_at := (v_plot->>'plantedAt')::bigint;
    v_duration_ms := public.farm_plot_duration_ms_v1(v_plot);
    if v_duration_ms <= 0 or v_now_ms - v_planted_at >= v_duration_ms then continue; end if;

    v_owner_state := jsonb_set(v_owner_state,array['plots',i::text,'friendWatered'],'true'::jsonb,true);
    v_owner_state := jsonb_set(v_owner_state,array['plots',i::text,'friendWateredBy'],to_jsonb(v_uid::text),true);
    v_owner_state := jsonb_set(v_owner_state,array['plots',i::text,'friendWateredByName'],to_jsonb(left(v_helper_name,80)),true);
    v_owner_state := jsonb_set(v_owner_state,array['plots',i::text,'friendWateredAt'],to_jsonb(v_now_ms),true);
    v_count := v_count + 1;
    v_ids := v_ids || jsonb_build_array(i);

    insert into public.farm_activity(owner_id,actor_id,activity_type,crop_id,amount,plot_id,created_at)
    values(p_friend,v_uid,'help_water',v_crop_id,5,i,clock_timestamp());
  end loop;

  if v_count <= 0 then
    return jsonb_build_object('ok',false,'reason','no_eligible','count',0,'plot_ids',v_ids);
  end if;

  v_owner_state := jsonb_set(v_owner_state,'{updatedAt}',to_jsonb(v_now_ms),true);
  update public.farm_saves
     set state=v_owner_state,
         client_updated_at=v_now_ms
   where user_id=p_friend;

  delete from public.farm_activity a
   where a.owner_id=p_friend and a.id in (
     select x.id from public.farm_activity x
     where x.owner_id=p_friend
     order by x.created_at desc,x.id desc
     offset 100
   );

  return jsonb_build_object('ok',true,'count',v_count,'plot_ids',v_ids,'bonus_percent',5);
end;
$$;

-- ---------------------------------------------------------------------------
-- 6) One-click friend pest help. Reuses the audited single-plot function so
--    rewards and helper-state updates stay identical to manual clicking.
-- ---------------------------------------------------------------------------
create or replace function public.help_friend_bug_all_v1(p_friend uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_state jsonb;
  v_result jsonb;
  v_helper_state jsonb := null;
  v_count integer := 0;
  v_ids jsonb := '[]'::jsonb;
  rec record;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','not_authenticated'); end if;
  if p_friend is null or p_friend = v_uid then return jsonb_build_object('ok',false,'reason','invalid_target'); end if;

  select fs.state into v_state from public.farm_saves fs where fs.user_id=p_friend;
  if not found then return jsonb_build_object('ok',false,'reason','no_farm'); end if;

  for rec in
    select (plot.ord - 1)::integer as plot_id
    from jsonb_array_elements(coalesce(v_state->'plots','[]'::jsonb)) with ordinality as plot(elem,ord)
    where plot.ord <= 20
      and coalesce(plot.elem->>'cropId','') <> ''
      and coalesce((plot.elem->>'hasPest')::boolean,false)
    order by plot.ord
  loop
    v_result := public.help_friend_bug_v1(p_friend, rec.plot_id);
    if coalesce((v_result->>'ok')::boolean,false) then
      v_count := v_count + 1;
      v_ids := v_ids || jsonb_build_array(rec.plot_id);
      if v_result ? 'helper_state' then v_helper_state := v_result->'helper_state'; end if;
    end if;
  end loop;

  if v_count <= 0 then
    return jsonb_build_object('ok',false,'reason','no_pest','count',0,'plot_ids',v_ids);
  end if;

  return jsonb_build_object('ok',true,'count',v_count,'plot_ids',v_ids,'helper_state',v_helper_state);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7) Two-way activity feed. One request returns both directions.
-- ---------------------------------------------------------------------------
create or replace function public.get_farm_activity_v2(
  p_limit integer default 50,
  p_mark_seen boolean default false
)
returns table (
  direction text,
  id bigint,
  activity_type text,
  peer_id uuid,
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
  v_limit integer := greatest(1, least(coalesce(p_limit,50),100));
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode='28000';
  end if;

  return query
  with received as (
    select
      'received'::text as direction,
      a.id,
      a.activity_type,
      a.actor_id as peer_id,
      coalesce(nullif(trim(p.display_name),''),'农场好友') as display_name,
      case when p.sex in ('male','female') then p.sex else 'unspecified' end as sex,
      a.crop_id,
      a.amount,
      a.plot_id,
      a.created_at as activity_at,
      (a.seen_at is null) as is_unread
    from public.farm_activity a
    left join public.profiles p on p.id=a.actor_id
    where a.owner_id=v_uid
    order by a.created_at desc,a.id desc
    limit v_limit
  ), sent as (
    select
      'sent'::text as direction,
      a.id,
      a.activity_type,
      a.owner_id as peer_id,
      coalesce(nullif(trim(p.display_name),''),'农场好友') as display_name,
      case when p.sex in ('male','female') then p.sex else 'unspecified' end as sex,
      a.crop_id,
      a.amount,
      a.plot_id,
      a.created_at as activity_at,
      false as is_unread
    from public.farm_activity a
    left join public.profiles p on p.id=a.owner_id
    where a.actor_id=v_uid
    order by a.created_at desc,a.id desc
    limit v_limit
  )
  select * from received
  union all
  select * from sent
  order by activity_at desc,id desc;

  if coalesce(p_mark_seen,false) then
    update public.farm_activity a
       set seen_at=coalesce(a.seen_at,clock_timestamp())
     where a.owner_id=v_uid
       and a.seen_at is null
       and a.id in (
         select x.id from public.farm_activity x
         where x.owner_id=v_uid
         order by x.created_at desc,x.id desc
         limit v_limit
       );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8) Keep stealing maturity checks aligned with friendWatered (-5%).
--    Existing v2/v3/v4 steal wrappers still call this base function.
-- ---------------------------------------------------------------------------
create or replace function public.steal_friend_crop(p_friend uuid, p_plot integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_low uuid;
  v_high uuid;
  v_owner_state jsonb;
  v_thief_state jsonb;
  v_plot jsonb;
  v_crop_id text;
  v_planted_at bigint;
  v_effective_ms bigint;
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_total integer;
  v_stolen integer := 0;
  v_remaining integer;
  v_take integer := 1;
  v_current_produce integer := 0;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'reason','not_authenticated'); end if;
  if p_friend is null or p_friend=v_uid or p_plot is null or p_plot<0 or p_plot>19 then
    return jsonb_build_object('ok',false,'reason','invalid_target');
  end if;

  if v_uid::text < p_friend::text then v_low:=v_uid; v_high:=p_friend;
  else v_low:=p_friend; v_high:=v_uid; end if;

  if not exists (
    select 1 from public.farm_friendships f
    where f.user_low=v_low and f.user_high=v_high and f.status='accepted'
  ) then return jsonb_build_object('ok',false,'reason','not_friend'); end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_friend::text || ':' || p_plot::text,0));

  select fs.state into v_owner_state from public.farm_saves fs where fs.user_id=p_friend for update;
  if not found then return jsonb_build_object('ok',false,'reason','no_farm'); end if;
  select fs.state into v_thief_state from public.farm_saves fs where fs.user_id=v_uid for update;
  if not found then return jsonb_build_object('ok',false,'reason','no_own_farm'); end if;

  v_plot := v_owner_state->'plots'->p_plot;
  if v_plot is null then return jsonb_build_object('ok',false,'reason','no_crop'); end if;
  v_crop_id := coalesce(v_plot->>'cropId','');
  if v_crop_id='' then return jsonb_build_object('ok',false,'reason','no_crop'); end if;
  if v_crop_id='mystery' then return jsonb_build_object('ok',false,'reason','protected'); end if;
  if v_crop_id not in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit') then
    return jsonb_build_object('ok',false,'reason','no_crop');
  end if;
  if coalesce(v_plot->>'plantedAt','') !~ '^[0-9]+$' then return jsonb_build_object('ok',false,'reason','no_crop'); end if;

  v_planted_at := (v_plot->>'plantedAt')::bigint;
  v_effective_ms := public.farm_plot_duration_ms_v1(v_plot);
  if v_effective_ms <= 0 or v_now_ms - v_planted_at < v_effective_ms then
    return jsonb_build_object('ok',false,'reason','not_mature');
  end if;

  if exists (
    select 1 from public.farm_steals st
    where st.thief_id=v_uid and st.owner_id=p_friend and st.plot_id=p_plot and st.planted_at=v_planted_at
  ) then return jsonb_build_object('ok',false,'reason','already_stolen'); end if;

  if coalesce(v_plot->>'harvestYield','') ~ '^[0-9]+$' then
    v_total := least(5,greatest(4,(v_plot->>'harvestYield')::integer));
  else
    v_total := 4 + floor(random()*2)::integer;
  end if;

  select coalesce(sum(st.amount),0)::integer into v_stolen
  from public.farm_steals st
  where st.owner_id=p_friend and st.plot_id=p_plot and st.planted_at=v_planted_at;

  v_remaining := v_total - v_stolen;
  if v_remaining <= 1 then return jsonb_build_object('ok',false,'reason','protected','remaining',1); end if;

  insert into public.farm_steals(thief_id,owner_id,plot_id,planted_at,crop_id,amount)
  values(v_uid,p_friend,p_plot,v_planted_at,v_crop_id,v_take);

  v_stolen := v_stolen + v_take;
  v_remaining := v_total - v_stolen;

  v_owner_state := jsonb_set(v_owner_state,array['plots',p_plot::text,'harvestYield'],to_jsonb(v_total),true);
  v_owner_state := jsonb_set(v_owner_state,array['plots',p_plot::text,'stolenCount'],to_jsonb(v_stolen),true);
  v_owner_state := jsonb_set(v_owner_state,'{updatedAt}',to_jsonb(v_now_ms),true);

  v_thief_state := jsonb_set(v_thief_state,'{produce}',coalesce(v_thief_state->'produce','{}'::jsonb),true);
  if coalesce(v_thief_state->'produce'->>v_crop_id,'') ~ '^[0-9]+$' then
    v_current_produce := (v_thief_state->'produce'->>v_crop_id)::integer;
  end if;
  v_thief_state := jsonb_set(v_thief_state,array['produce',v_crop_id],to_jsonb(v_current_produce+1),true);
  v_thief_state := jsonb_set(v_thief_state,'{updatedAt}',to_jsonb(v_now_ms),true);

  update public.farm_saves set state=v_owner_state,client_updated_at=v_now_ms where user_id=p_friend;
  update public.farm_saves set state=v_thief_state,client_updated_at=v_now_ms where user_id=v_uid;

  return jsonb_build_object('ok',true,'crop_id',v_crop_id,'amount',1,'owner_remaining',v_remaining,'thief_state',v_thief_state);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on function public.get_friend_farm_v6(uuid,boolean) from public, anon;
revoke all on function public.get_farm_friends_v3() from public, anon;
revoke all on function public.help_friend_water_v1(uuid,integer) from public, anon;
revoke all on function public.help_friend_bug_all_v1(uuid) from public, anon;
revoke all on function public.get_farm_activity_v2(integer,boolean) from public, anon;
revoke all on function public.steal_friend_crop(uuid,integer) from public, anon;

grant execute on function public.get_friend_farm_v6(uuid,boolean) to authenticated, service_role;
grant execute on function public.get_farm_friends_v3() to authenticated, service_role;
grant execute on function public.help_friend_water_v1(uuid,integer) to authenticated, service_role;
grant execute on function public.help_friend_bug_all_v1(uuid) to authenticated, service_role;
grant execute on function public.get_farm_activity_v2(integer,boolean) to authenticated, service_role;
grant execute on function public.steal_friend_crop(uuid,integer) to authenticated, service_role;

commit;
