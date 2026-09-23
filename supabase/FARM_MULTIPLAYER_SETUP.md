# 星辰农场多人系统接回指南（V0.13.4）

V0.13.4 已开放排行榜、好友、拜访好友农场与偷菜。

## 上线步骤

依序确认这些 migration 已执行：

1. `20260923_003_farm_cloud_save.sql`
2. `20260923_004_farm_rankings_friends.sql`
3. `20260923_005_farm_friend_visits.sql`
4. **新增：`20260924_006_farm_steal.sql`**

在 Supabase → SQL Editor → New Query 中贴入 006 全部内容，Ctrl+A 全选后按 Run。成功应显示 `Success. No rows returned`。

## 偷菜规则

- 只有已接受好友可以偷菜。
- 只能偷成熟普通作物。
- 每次随机 1～3 个。
- 同一位好友对同一格、同一轮种植只能偷一次。
- 无论多少好友来偷，地主至少保留 1 个。
- 蔬果盲盒每格只有 1 个收成，因此受保底保护，不可偷。
- 偷菜写入 `farm_steals`，并由 `steal_friend_crop` RPC 在服务器端验证。

## 安全说明

好友仍无法直接读取或写入别人的 `farm_saves`。拜访通过 `get_friend_farm` 返回裁剪后的农田状态；偷菜通过 SECURITY DEFINER RPC 原子验证好友关系、成熟时间、重复偷取与地主保底后，再同时更新双方云端存档。

当前农场整体仍属于多人 Beta：玩家自己的金币与一般种植/出售仍主要由前端游戏逻辑维护，后续可继续把关键经济操作迁移到服务器端做更完整的防作弊。
