-- Stellar Diary V0.18.2 — Release Mid-Autumn outfit #5002
-- Run AFTER 20260928_027_farm_item_wardrobe.sql.
--
-- Both male/female Sprite Sheets now ship with the client, so the previously
-- reserved permanent outfit can be safely distributed through GM/system mail.

begin;

update public.mail_item_catalog
   set mail_enabled = true,
       active = true,
       max_quantity = 1,
       name_zh_cn = '中秋节造型',
       name_zh_tw = '中秋節造型',
       name_en = 'Mid-Autumn Outfit',
       updated_at = now()
 where item_id = 5002
   and item_code = 'outfit.mid_autumn'
   and category = 'outfit'
   and reward_kind = 'outfit'
   and state_key = 'mid_autumn';

do $$
begin
  if not exists (
    select 1
      from public.mail_item_catalog
     where item_id = 5002
       and item_code = 'outfit.mid_autumn'
       and category = 'outfit'
       and reward_kind = 'outfit'
       and state_key = 'mid_autumn'
       and active
       and mail_enabled
       and max_quantity = 1
  ) then
    raise exception 'mid_autumn_outfit_5002_not_ready';
  end if;
end $$;

commit;
