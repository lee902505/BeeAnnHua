# Bark 推播接回指南（V0.11.1.7）

GitHub Pages 只負責靜態網頁；`js/bark.js` 把推播內容交給 Supabase Edge Function `bark-push`。只有 Edge Function 能讀取 `BARK_DEVICE_KEY`，網站壓縮檔不含金鑰。

## 上線順序

1. **更新金鑰**：以前版本曾把 Bark 裝置金鑰寫在公開網頁檔案中。請把舊金鑰視為已曝光，改用新的 Bark 裝置金鑰。不要把金鑰貼到 GitHub、HTML、JavaScript、SQL 或這份說明。
2. 在現有 Supabase 專案的 **SQL Editor** 執行 `supabase/migrations/20260919_002_bark_push_quota.sql`。它建立原子計數與限制：同一雲端身分每 UTC 日最多 15 次、兩次至少相隔 10 秒；整個網站每天最多 2000 次。限制可按實際使用量調整。
3. 在 Supabase 專案 **Edge Functions → Deploy a new function → Via Editor**，函式名稱填 `bark-push`，貼上 `supabase/functions/bark-push/index.ts` 的全部內容並部署。保留 **Verify JWT** 開啟。
4. 在 Supabase 專案 **Edge Function Secrets** 新增 `BARK_DEVICE_KEY`，值填新的 Bark 裝置金鑰。這是伺服器機密設定，不會隨網站壓縮檔上傳。
5. 上傳 V0.11.1.7 網站檔案到 GitHub Pages，使用已連接 Supabase 的帳號，先抽取一次每日籤，再到 Bark App 確認推播；接著測塔羅與星盤。網站本身若可操作但無推播，檢查 Supabase 的 Edge Function Logs、JWT 設定與金鑰設定。

Supabase 支援 [Dashboard 建立與部署函式](https://supabase.com/docs/guides/functions/quickstart-dashboard)、[設定函式機密](https://supabase.com/docs/guides/functions/secrets) 與 [使用者 JWT 驗證](https://supabase.com/docs/guides/functions/auth)。Bark [支援 POST 推播](https://github.com/Finb/Bark)。

## 行為與限制

- 每日籤、塔羅、本命盤原有的觸發時機與摘要不變；雲端身分暫時無法建立時，個人功能仍可使用，但當次推播會略過。
- 函式驗證每個請求的 Supabase 使用者憑證，僅允許三類既定推播，限制字數與發送次數。匿名 Supabase 使用者也是已驗證的使用者；總量上限可限制濫用量，但無法保證完全不被惡意訪客耗盡。
- 網頁上傳本身不會部署 Edge Function 或加入機密設定。完成第 2 至 4 步後，V0.11.1.7 才會恢復推播。
- 本地原始碼沒有連線到你正式的 Supabase 專案與 Bark 裝置，最終的手機收訊需在部署後確認。
