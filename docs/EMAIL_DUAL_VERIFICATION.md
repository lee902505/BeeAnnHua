# V0.10.7.13 Email Link + OTP Templates — Mobile-safe

手机邮件客户端（尤其 Gmail / 部分内建 Mail）可能会对重复邮件内容进行折叠，或对部分 CSS 支援不一致。以下模板把 **OTP 与直接验证按钮都放在邮件前半段**，并使用较传统的 table-based email markup，避免「方式二」在手机端被折叠到看不到。

Supabase Hosted Email Templates 必须同时保留：

- `{{ .Token }}`
- `{{ .ConfirmationURL }}`

## 1. Change email address

**Subject**

```text
【星辰日记】确认您的邮箱
```

**Body**

```html
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0;padding:0;background:#f5f1fb;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei','Noto Sans SC',Arial,sans-serif;color:#2d2640;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;background:#ffffff;border:1px solid #e5d9ef;border-radius:22px;">
        <tr><td align="center" style="padding:34px 26px 18px;font-size:30px;font-weight:700;letter-spacing:.10em;color:#33274f;">星辰日记 ✦</td></tr>
        <tr><td align="center" style="padding:0 26px 28px;font-size:12px;letter-spacing:.20em;color:#9a88ad;">YOUR STARS, YOUR STORY</td></tr>
        <tr><td style="padding:0 26px 14px;font-size:21px;font-weight:700;color:#34294e;">确认您的邮箱</td></tr>
        <tr><td style="padding:0 26px 18px;font-size:15px;line-height:1.8;color:#61556d;">您正在将以下邮箱绑定到「星辰日记」云端账号：<br><strong style="color:#443755;">{{ .NewEmail }}</strong></td></tr>

        <tr><td align="center" style="padding:0 26px 8px;font-size:13px;font-weight:700;color:#8e7ba0;">方式一 · 输入 8 位验证码</td></tr>
        <tr><td align="center" style="padding:4px 26px 18px;font-size:34px;font-weight:800;letter-spacing:.20em;color:#392b57;">{{ .Token }}</td></tr>

        <tr><td align="center" style="padding:4px 26px 10px;font-size:13px;font-weight:700;color:#8e7ba0;">方式二 · 直接前往验证</td></tr>
        <tr>
          <td align="center" style="padding:0 26px 26px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td bgcolor="#392b57" style="border-radius:999px;">
                  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:15px 30px;color:#fffaf2;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:.04em;">确认并绑定邮箱</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:0 26px 18px;font-size:14px;line-height:1.8;color:#61556d;">完成确认后，您的玩家资料、每日签、塔罗记录、本命星盘与两人合盘资料都会继续保留在目前的云端身份中。</td></tr>
        <tr><td style="padding:0 26px 28px;font-size:12px;line-height:1.8;color:#95899f;">如果这不是您的操作，请直接忽略这封邮件。</td></tr>
        <tr><td align="center" style="padding:20px 26px 30px;border-top:1px solid #eee7f3;font-size:12px;line-height:1.8;color:#9b8ba8;">与星辰同行，遇见更好的自己 ♡<br><span style="letter-spacing:.16em;">STELLAR DIARY</span></td></tr>
      </table>
    </td>
  </tr>
</table>
```

## 2. Magic Link / OTP

**Subject**

```text
【星辰日记】登录您的云端账号
```

**Body**

```html
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:0;padding:0;background:#f5f1fb;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei','Noto Sans SC',Arial,sans-serif;color:#2d2640;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;background:#ffffff;border:1px solid #e5d9ef;border-radius:22px;">
        <tr><td align="center" style="padding:34px 26px 18px;font-size:30px;font-weight:700;letter-spacing:.10em;color:#33274f;">星辰日记 ✦</td></tr>
        <tr><td align="center" style="padding:0 26px 28px;font-size:12px;letter-spacing:.20em;color:#9a88ad;">YOUR STARS, YOUR STORY</td></tr>
        <tr><td style="padding:0 26px 14px;font-size:21px;font-weight:700;color:#34294e;">登录您的星辰日记账号</td></tr>
        <tr><td style="padding:0 26px 20px;font-size:15px;line-height:1.8;color:#61556d;">您正在登录已经绑定的星辰日记云端账号。请选择任一种方式完成登录。</td></tr>

        <tr><td align="center" style="padding:0 26px 8px;font-size:13px;font-weight:700;color:#8e7ba0;">方式一 · 输入 8 位登录验证码</td></tr>
        <tr><td align="center" style="padding:4px 26px 18px;font-size:34px;font-weight:800;letter-spacing:.20em;color:#392b57;">{{ .Token }}</td></tr>

        <tr><td align="center" style="padding:4px 26px 10px;font-size:13px;font-weight:700;color:#8e7ba0;">方式二 · 直接前往登录</td></tr>
        <tr>
          <td align="center" style="padding:0 26px 26px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td bgcolor="#392b57" style="border-radius:999px;">
                  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:15px 30px;color:#fffaf2;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:.04em;">登录星辰日记</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td style="padding:0 26px 28px;font-size:12px;line-height:1.8;color:#95899f;">如果这不是您的操作，请直接忽略这封邮件，您的账号资料不会受到影响。</td></tr>
        <tr><td align="center" style="padding:20px 26px 30px;border-top:1px solid #eee7f3;font-size:12px;line-height:1.8;color:#9b8ba8;">与星辰同行，遇见更好的自己 ♡<br><span style="letter-spacing:.16em;">STELLAR DIARY</span></td></tr>
      </table>
    </td>
  </tr>
</table>
```

## Notes

- Gmail 手机端若把同主题的多封邮件归在同一 conversation，会折叠较旧或重复内容。测试时请确认打开的是最新一封邮件。
- 如果仍看到左下角 `...`，新版模板已经把 OTP 与直接登录按钮放在最前段，因此即使后段被折叠，两种验证方式也应先显示。
