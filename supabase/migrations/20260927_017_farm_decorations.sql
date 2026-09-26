-- Stellar Diary V0.14.0 — farm decorations and friend-visible layout
-- Run once after migration 016. Decoration ownership/layout lives inside the existing farm state JSON.
-- This migration only exposes a sanitized 8-slot layout to confirmed friends.

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

  select coalesce(jsonb_agg(
    case
      when (v_state #>> array['decorations','slots',g.i::text]) in
        ('hay','barrels','flowerbed','wheel','birdhouse','bench','scarecrow','lamp','windmill','sign')
      then to_jsonb(v_state #>> array['decorations','slots',g.i::text])
      else 'null'::jsonb
    end order by g.i
  ), '[]'::jsonb)
  into v_slots
  from generate_series(0,7) as g(i);

  return v_payload || jsonb_build_object(
    'decorations', jsonb_build_object('slots', v_slots)
  );
end;
$$;

revoke all on function public.get_friend_farm_v5(uuid,boolean) from public, anon;
grant execute on function public.get_friend_farm_v5(uuid,boolean) to authenticated, service_role;

commit;
