-- V0.19.0.2 — public friend-farm visuals
-- Expose only the currently equipped outfit id (whitelisted) alongside the
-- already-public decoration slots. Wardrobe ownership and other private save
-- fields remain hidden. get_friend_farm_v6/v7 call v5, so no client RPC name
-- changes are required.

begin;

create or replace function public.get_friend_farm_v5(
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
  v_slots jsonb := '[]'::jsonb;
  v_outfit text := 'default';
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  -- Reuse V4 for friendship validation, public profile, plots and visit logging.
  v_payload := public.get_friend_farm_v4(p_friend, p_log_visit);
  if not coalesce((v_payload->>'ok')::boolean, false) then
    return v_payload;
  end if;

  select fs.state into v_state
    from public.farm_saves fs
   where fs.user_id = p_friend;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_farm');
  end if;

  -- Keep the public farm view strictly whitelisted. Only valid scene decoration
  -- ids are returned; inventory counts and unpublished save fields stay private.
  select coalesce(jsonb_agg(
    case
      when (v_state #>> array['decorations','slots',g.i::text]) in
        ('hay','barrels','flowerbed','wheel','birdhouse','bench','scarecrow','lamp','windmill','sign',
         'mid_lantern','mid_rabbit','mid_osmanthus','mid_moon_lamp',
         'halloween_pumpkin','halloween_ghost','halloween_candle',
         'christmas_tree','christmas_gifts','christmas_snowman','christmas_lamp')
      then to_jsonb(v_state #>> array['decorations','slots',g.i::text])
      else 'null'::jsonb
    end order by g.i
  ), '[]'::jsonb)
  into v_slots
  from generate_series(0,7) as g(i);

  v_outfit := case
    when coalesce(v_state #>> '{avatar,outfit}','default') in ('default','mid_autumn','halloween','christmas')
      then coalesce(v_state #>> '{avatar,outfit}','default')
    else 'default'
  end;

  return v_payload || jsonb_build_object(
    'avatar', jsonb_build_object('outfit', v_outfit),
    'decorations', jsonb_build_object('slots', v_slots)
  );
end;
$$;

revoke all on function public.get_friend_farm_v5(uuid,boolean) from public, anon;
grant execute on function public.get_friend_farm_v5(uuid,boolean) to authenticated, service_role;

commit;
