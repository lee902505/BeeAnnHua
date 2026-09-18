# Stellar Diary · Email Branding / SMTP

V0.10.7.11 records the production-facing email branding currently configured in Supabase.

## Custom SMTP

- Provider: Gmail SMTP (development / low-volume phase)
- Host: `smtp.gmail.com`
- Port: `587`
- Sender name: `星辰日記`
- Sender email / SMTP username: the dedicated Gmail account configured in Supabase
- Password: Google App Password stored only in Supabase SMTP settings; never commit it to GitHub.

> Gmail SMTP is being used for development and low-volume verification. A transactional provider / custom domain can replace it later without changing Supabase user UUIDs or database ownership.

## Change email address template

This template is used by the current anonymous-account → email binding flow and can also be used when the bound email is changed later.

Suggested subject:

`【星辰日记】确认您的邮箱`

Required Supabase template variables:

- `{{ .NewEmail }}`
- `{{ .ConfirmationURL }}`

Do not hard-code the confirmation URL in the template.

## Current account model

- Anonymous account = `游客 / 遊客 / Guest`
- Email-bound account = `正式会员 / 正式會員 / Member`
- Binding upgrades the current Supabase user; existing cloud data remains under the same UUID.
