# V0.10.7.11 Email Link + OTP Templates

V0.10.7.11 supports two user-facing verification methods:

1. Open the Stellar Diary email and click the verification/sign-in button.
2. Enter the 8-digit OTP shown in the same email.

Supabase Hosted Email Templates must include both `{{ .ConfirmationURL }}` and `{{ .Token }}` for both methods to appear.

## 1. Change email address

Use this for first-time anonymous-account email binding and later email changes.

**Subject**

```text
【星辰日记】确认您的邮箱
```

**Body**

```html
<div style="margin:0;padding:32px 16px;background:#f5f1fb;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei','Noto Sans SC',Arial,sans-serif;color:#2d2640;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5d9ef;border-radius:22px;padding:38px 32px;box-shadow:0 12px 36px rgba(68,46,96,.10);">
    <div style="text-align:center;margin-bottom:30px;">
      <div style="font-size:30px;font-weight:700;letter-spacing:.10em;color:#33274f;">星辰日记 ✦</div>
      <div style="margin-top:8px;font-size:12px;letter-spacing:.20em;color:#9a88ad;">YOUR STARS, YOUR STORY</div>
    </div>

    <div style="font-size:21px;font-weight:700;margin-bottom:18px;color:#34294e;">确认您的邮箱</div>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.9;color:#61556d;">您正在将以下邮箱绑定到「星辰日记」云端账号：</p>
    <div style="margin:18px 0 24px;padding:14px 18px;background:#f7f3fb;border-radius:12px;font-size:15px;color:#443755;word-break:break-all;">{{ .NewEmail }}</div>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.9;color:#61556d;">您可以选择任一种方式完成验证：</p>

    <div style="margin:20px 0;padding:20px;border-radius:16px;background:#faf7fd;border:1px solid #eadff2;text-align:center;">
      <div style="font-size:13px;color:#8d7aa5;margin-bottom:8px;">方式一 · 输入 8 位验证码</div>
      <div style="font-size:34px;font-weight:800;letter-spacing:.22em;color:#392b57;">{{ .Token }}</div>
    </div>

    <div style="text-align:center;margin:28px 0 20px;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:15px 36px;background:#392b57;color:#fffaf2;text-decoration:none;border-radius:999px;font-size:16px;font-weight:700;letter-spacing:.06em;">方式二 · 确认并绑定邮箱</a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;line-height:1.8;color:#95899f;">如果这不是您的操作，请直接忽略这封邮件，您的账号与资料不会受到影响。</p>
    <div style="margin-top:30px;padding-top:22px;border-top:1px solid #eee7f3;text-align:center;color:#9b8ba8;">
      <div style="font-size:13px;line-height:1.8;">与星辰同行，遇见更好的自己 ♡</div>
      <div style="margin-top:5px;font-size:11px;letter-spacing:.16em;">STELLAR DIARY</div>
    </div>
  </div>
</div>
```

## 2. Magic Link / OTP

Use this for signing in to an already-linked account from a new device.

**Subject**

```text
【星辰日记】登录您的云端账号
```

**Body**

```html
<div style="margin:0;padding:32px 16px;background:#f5f1fb;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei','Noto Sans SC',Arial,sans-serif;color:#2d2640;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5d9ef;border-radius:22px;padding:38px 32px;box-shadow:0 12px 36px rgba(68,46,96,.10);">
    <div style="text-align:center;margin-bottom:30px;">
      <div style="font-size:30px;font-weight:700;letter-spacing:.10em;color:#33274f;">星辰日记 ✦</div>
      <div style="margin-top:8px;font-size:12px;letter-spacing:.20em;color:#9a88ad;">YOUR STARS, YOUR STORY</div>
    </div>

    <div style="font-size:21px;font-weight:700;margin-bottom:18px;color:#34294e;">登录您的云端账号</div>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.9;color:#61556d;">我们收到了在新设备登录「星辰日记」的请求。您可以选择任一种方式完成登录：</p>

    <div style="margin:20px 0;padding:20px;border-radius:16px;background:#faf7fd;border:1px solid #eadff2;text-align:center;">
      <div style="font-size:13px;color:#8d7aa5;margin-bottom:8px;">方式一 · 输入 8 位登录验证码</div>
      <div style="font-size:34px;font-weight:800;letter-spacing:.22em;color:#392b57;">{{ .Token }}</div>
    </div>

    <div style="text-align:center;margin:28px 0 20px;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:15px 36px;background:#392b57;color:#fffaf2;text-decoration:none;border-radius:999px;font-size:16px;font-weight:700;letter-spacing:.06em;">方式二 · 登录星辰日记</a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;line-height:1.8;color:#95899f;">如果这不是您的操作，请忽略这封邮件。</p>
    <div style="margin-top:30px;padding-top:22px;border-top:1px solid #eee7f3;text-align:center;color:#9b8ba8;">
      <div style="font-size:13px;line-height:1.8;">与星辰同行，遇见更好的自己 ♡</div>
      <div style="margin-top:5px;font-size:11px;letter-spacing:.16em;">STELLAR DIARY</div>
    </div>
  </div>
</div>
```

## Dashboard paths

- Authentication → Emails → Change email address
- Authentication → Emails → Magic Link

After saving the templates, test both the button link and OTP code on `account.html`.
