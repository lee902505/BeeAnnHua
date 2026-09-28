-- Stellar Diary V0.18.3 — Release Halloween #5003 + Christmas #5004 outfits
-- Run AFTER 20260928_027_farm_item_wardrobe.sql and 20260928_028_mid_autumn_outfit.sql.
--
-- Both male/female Sprite Sheets now ship with the client. These two permanent
-- Item IDs are therefore enabled for GM/system-mail distribution. Receiving an
-- outfit only unlocks wardrobe ownership; it never auto-equips the cosmetic.

begin;

insert into public.mail_item_catalog
(item_id,item_code,category,reward_kind,state_key,name_zh_cn,name_zh_tw,name_en,icon_source,icon_key,icon_cell,max_quantity,sort_order,mail_enabled,active)
values
(5003,'outfit.halloween','outfit','outfit','halloween','万圣节造型','萬聖節造型','Halloween Outfit','farm','outfit',null,1,303,true,true),
(5004,'outfit.christmas','outfit','outfit','christmas','圣诞造型','聖誕造型','Christmas Outfit','farm','outfit',null,1,304,true,true)
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

do $$
begin
  if not exists (
    select 1 from public.mail_item_catalog
     where item_id = 5003
       and item_code = 'outfit.halloween'
       and category = 'outfit'
       and reward_kind = 'outfit'
       and state_key = 'halloween'
       and active and mail_enabled and max_quantity = 1
  ) then
    raise exception 'halloween_outfit_5003_not_ready';
  end if;

  if not exists (
    select 1 from public.mail_item_catalog
     where item_id = 5004
       and item_code = 'outfit.christmas'
       and category = 'outfit'
       and reward_kind = 'outfit'
       and state_key = 'christmas'
       and active and mail_enabled and max_quantity = 1
  ) then
    raise exception 'christmas_outfit_5004_not_ready';
  end if;
end $$;

commit;
