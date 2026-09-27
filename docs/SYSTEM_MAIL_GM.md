# V0.16 系统信箱 / GM 管理台

## 1. Supabase

在 Supabase SQL Editor 执行：

`supabase/migrations/20260927_018_system_mail_gm.sql`

脚本会：

- 建立 `admin_users`、`system_mail`、`player_mail_state`、`gm_audit_log`。
- 将预先指定的第一个 Auth UID 设为 `super_admin`。
- 建立玩家读信、未读数量、已读、附件领取 RPC。
- 建立 GM 发全服／指定 UID 邮件与发布记录 RPC。
- 奖励领取会在数据库交易内直接更新 `farm_saves`，并利用 `player_mail_state.claimed_at` 防止 F5、多装置、重复点击重复领取。

## 2. 第一轮测试

1. 用 GM 帐号登录：右上角应出现信箱和 `GM` 按钮。
2. 用一般正式帐号登录：只应出现信箱，不应出现 `GM`。
3. GM 发一封全服公告，一般帐号应立即可读取。
4. GM 发一封含金币、种子或盲盒的奖励信。
5. 一般帐号领取一次后 F5、换装置再打开，同一附件都应显示已领取。
6. 在农场页面领取后，农场会立即重新拉取云端存档显示奖励。

## 3. 第一版支持附件

- 金币
- EXP（会按农场既有等级经验表自动升级）
- 红萝卜／小麦／玉米／番茄／草莓／南瓜／葡萄／星辰果种子
- 蔬果盲盒
- 低级／中级／高级肥料

## 4. 安全

GM 权限由 Supabase Auth UUID + `admin_users` 判断，不用 Email 或前端隐藏按钮作为授权依据。所有 GM 发信 RPC 都会在服务器端再次验证身份。
