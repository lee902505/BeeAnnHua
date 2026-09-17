# V0.10.7.4 · Anonymous Auth Foundation

## 目标
第一次打开星辰日记时不要求注册。只要 Supabase public configuration 已就绪，网站会：

1. 尝试恢复既有 Supabase session。
2. 若没有 session，则调用 `signInAnonymously()` 建立临时云端身份。
3. Supabase Auth 产生真实 user UUID。
4. 既有 `auth.users -> public.profiles` trigger 自动建立 `profiles` 行。
5. 若本机已有玩家称呼／性别，则只同步基本 profile 字段：
   - `display_name`
   - `sex`
   - `locale`
   - `timezone`

本版不会把本命盘、合盘、塔罗、每日签、AI report payload 自动上传到 Supabase。

## Dashboard 前置条件
必须在 Supabase Authentication 里开启 Anonymous Sign-Ins。若未开启：

- 网站继续以本机模式正常使用；
- 不会阻断每日运势、塔罗、本命星盘、合盘；
- `supabase-test.html` 会显示匿名 Auth 建立失败原因。

## Publishable Key
V0.10.7.2 系列为了避免从截图猜测 key，没有把完整 `sb_publishable_...` 写进源码。

因此：
- 已在 `supabase-test.html` 保存过 Publishable Key 的浏览器可以直接测试 V0.10.7.4；
- 新装置若没有 public key，会保持 `local-only`；
- 正式公开前，应把 **Publishable Key** 以 public config 方式部署给所有访客。Publishable Key 是浏览器端公开配置，不是 secret；`sb_secret_...` / service role / Database password 绝不能放进 GitHub Pages。

## 临时身份限制
匿名身份本身没有账号恢复方式。若用户：

- 清除网站储存；
- 换浏览器；
- 换装置；
- 在尚未绑定正式身份前登出；

原匿名 session 可能无法恢复。

因此 V0.10.7.4 将加入「绑定账号」流程，优先支持通用 Email（QQ邮箱、Foxmail、163、126、Outlook、iCloud、Gmail 等），之后再评估 Google / Apple 与其他 provider。

## 安全边界
- 匿名用户仍属于 Supabase `authenticated` role。
- 所有资料仍由既有 RLS `auth.uid() = user_id` 限制。
- 本版不暴露 service role。
- 本版不允许浏览器写入 `ai_reports`。
