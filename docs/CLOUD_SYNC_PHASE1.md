# V0.10.7.4 — Cloud Sync Phase 1

本版在既有 Supabase Anonymous Auth + RLS 基础上，第一次开启核心资料的双向云端同步，同时保留 localStorage 作为本机副本与离线 fallback。

## 同步范围

- `profiles`：玩家称呼、性别、语言、时区（沿用 V0.10.7.3）
- `natal_charts`：最近的本命盘结构化 report payload
- `synastry_reports`：最近的两人合盘结构化 report payload
- `fortune_history`：最近 60 天每日星辰签
- `tarot_history`：塔罗历史记录；本机 UI 继续只显示最近 10 则

`ai_reports` 本版不写入，留给 V0.11 AI 报告后端。

## 同步原则

1. **Local-first**：所有既有功能仍先写入 localStorage；即使 Supabase 暂时离线，网站照常可用。
2. **非破坏式合并**：页面恢复网络或匿名身份准备完成后，会将本机与云端资料合并。
3. **每日签 first-draw wins**：同一天若不同设备／离线状态出现冲突，以较早的 `drawnAt` 为准，尽量维持「一天一签」语义。
4. **本命盘／合盘以 fingerprint 去重**：相同确定性命盘不会重复建立。
5. **塔罗以 draw id / fingerprint 去重**：本机保留最近 10 则，云端可保留更多；明确点击「清空记录」时会同步清除该账号的云端塔罗历史。
6. **不删除本机副本**：成功上传后不会清掉 localStorage。

## 触发时机

- Anonymous Auth session 建立／恢复后自动同步一次
- 玩家 profile 修改后
- 新本命盘 report payload 生成后
- 新合盘 report payload 生成后
- 每日签写入后
- 塔罗完整翻牌并保存历史后
- 浏览器从 offline 回到 online 后
- `supabase-test.html` 可手动点击「同步全部资料」

## 安全边界

- 前端仅使用 `sb_publishable_...`
- 所有表继续由 RLS `auth.uid() = user_id` 保护
- 不在前端使用 `sb_secret_...`、service role 或 Database password
- `ai_reports` 仍不允许浏览器直接 INSERT / UPDATE

## 下一阶段

V0.10.7.4 Phase 2 / 后续版本将处理账号绑定与跨设备恢复：

- Email OTP（QQ邮箱、Foxmail、163、126、Outlook、iCloud、Gmail 等）
- 账号绑定后跨设备恢复
- 后续视需求增加 Google / Apple；QQ / 微信一键登录另行评估 OAuth/OIDC 整合
