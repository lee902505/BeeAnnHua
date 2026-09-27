# V0.16.2 系统信箱 / GM 管理台

## 1. Supabase

如果是第一次安装信箱系统，请依序在 Supabase SQL Editor 执行：

1. `supabase/migrations/20260927_018_system_mail_gm.sql`
2. `supabase/migrations/20260927_019_mail_item_catalog.sql`

如果 V0.16.0 的 018 已经执行成功，这次只需要执行 019。

019 会新增：

- `mail_item_catalog`：邮件可发放物品目录。
- 固定 `item_id` + 永久 `item_code`。
- `get_mail_item_catalog_v1()`：前端读取可发放物品。
- `gm_lookup_player_v1(uid)`：GM 发指定玩家邮件前验证 UID。
- V0.16.1 版附件验证与领取逻辑。

旧 V0.16.0 已经发布的奖励信仍可正常领取。

## 2. Item ID 规则

GM 管理台不再把所有物品写死成输入框。附件改成：

1. 选择分类
2. 选择物品
3. 输入数量
4. 加入附件

每个下拉选项都会显示：

`#Item ID · 物品名称 · item_code`

当前核心 ID：

- `1001` / `currency.coin` — 金币
- `1002` / `currency.exp` — EXP
- `2001` / `box.mystery` — 蔬果盲盒
- `3001–3008` — 8 种种子
- `4001–4003` — 低／中／高级肥料

未来增加同类物品时，只要在 `mail_item_catalog` 增加一笔启用项目，GM 下拉选单会自动读取，不需要再改一整排 HTML 输入框。

## 3. 指定玩家 UID

发送对象选择「指定 UID」后：

- 输入 Supabase Auth UID。
- 点击「验证 UID」。
- GM 管理台会显示玩家名称、农场等级与 Email，确认目标正确后再发布。
- 真正权限与收件对象仍由后端 UUID 验证。

## 4. 防重复领取

奖励领取会在数据库交易中：

- 验证邮件是否属于该玩家。
- 验证 `item_id` 与数量。
- 锁定 `player_mail_state`。
- 更新 `farm_saves`。
- 写入 `claimed_at`。

所以 F5、多装置或重复点击不会重复发放。

## 5. 测试建议

1. GM 登录后开启管理台。
2. 选择 `货币 → #1001 金币`，数量 100。
3. 再加入 `种子 → #3004 番茄种子`，数量 3。
4. 发给第二个测试帐号 UID。
5. 用第二个帐号确认收到信并领取。
6. F5 后再次开启同封信，应显示已领取。
7. 进入农场确认金币与番茄种子数量已同步。


## V0.16.2 邮件操作

执行 `supabase/migrations/20260927_020_mail_actions_expiry.sql` 后：

- 玩家可单封领取附件。
- 玩家可删除自己的邮件视图；这是 `player_mail_state.deleted_at` 软删除，不影响其他玩家或 GM 历史。
- 未领取附件的邮件删除前会警告。
- D+7 / D+14 / D+30 到期后自动从玩家信箱隐藏；永久邮件无到期时间。
- GM 历史仍保留原始 `system_mail`。
