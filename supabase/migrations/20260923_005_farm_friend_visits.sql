-- Stellar Diary V0.13.2 — friend farm visit (read-only)
-- Run once in Supabase SQL Editor after migration 004.
-- Only accepted farm friends may read this sanitized visit payload.

begin;

create or replace function public.get_friend_farm(p_friend uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_state jsonb;
  v_updated_at timestamptz;
  v_display_name text;
  v_sex text;
  v_level integer := 1;
  v_coins bigint := 0;
  v_plots jsonb := '[]'::jsonb;
  v_low uuid;
  v_high uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;
  if p_friend is null or p_friend = v_uid then
    return jsonb_build_object('ok', false, 'reason', 'invalid_target');
  end if;

  if v_uid::text < p_friend::text then
    v_low := v_uid;
    v_high := p_friend;
  else
    v_low := p_friend;
    v_high := v_uid;
  end if;

  if not exists (
    select 1
    from public.farm_friendships f
    where f.user_low = v_low
      and f.user_high = v_high
      and f.status = 'accepted'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'not_friend');
  end if;

  select
    fs.state,
    fs.updated_at,
    coalesce(nullif(trim(p.display_name), ''), '星辰农友'),
    case when p.sex in ('male','female') then p.sex else 'unspecified' end
  into v_state, v_updated_at, v_display_name, v_sex
  from public.farm_saves fs
  join public.profiles p on p.id = fs.user_id
  where fs.user_id = p_friend;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_farm');
  end if;

  v_level := least(999, greatest(1,
    case when coalesce(v_state->>'level','') ~ '^[0-9]+$'
      then (v_state->>'level')::integer else 1 end
  ));
  v_coins := least(999999999999::bigint, greatest(0::bigint,
    case when coalesce(v_state->>'coins','') ~ '^[0-9]+$'
      then (v_state->>'coins')::bigint else 0::bigint end
  ));

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', (plot.ord - 1)::integer,
      'cropId', case
        when plot.elem->>'cropId' in ('carrot','wheat','corn','tomato','strawberry','pumpkin','grape','starfruit')
          then plot.elem->>'cropId'
        else null
      end,
      'plantedAt', case
        when coalesce(plot.elem->>'plantedAt','') ~ '^[0-9]+$'
          then (plot.elem->>'plantedAt')::bigint
        else null
      end
    ) order by plot.ord
  ), '[]'::jsonb)
  into v_plots
  from jsonb_array_elements(coalesce(v_state->'plots', '[]'::jsonb)) with ordinality as plot(elem, ord)
  where plot.ord <= 20;

  return jsonb_build_object(
    'ok', true,
    'user_id', p_friend,
    'display_name', v_display_name,
    'sex', v_sex,
    'level', v_level,
    'coins', v_coins,
    'plots', v_plots,
    'updated_at', v_updated_at
  );
end;
$$;

revoke all on function public.get_friend_farm(uuid) from public, anon;
grant execute on function public.get_friend_farm(uuid) to authenticated;
grant execute on function public.get_friend_farm(uuid) to service_role;

commit;
