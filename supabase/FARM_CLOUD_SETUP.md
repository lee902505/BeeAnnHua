# 星辰農場 Supabase 雲端存檔（V0.13.0）

V0.13.0 新增 `farm_saves` 私人雲端存檔。網站仍保留 localStorage 作為離線/失敗備援；SQL 尚未執行時，農場仍可正常單機遊玩，右上會顯示「☁ 雲端待啟用」。

## 啟用

1. Supabase → **SQL Editor** → New query。
2. 貼上 `supabase/migrations/20260923_003_farm_cloud_save.sql` 全部內容。
3. **Ctrl+A 全選後按 Run**。
4. 成功應看到 `Success. No rows returned`。
5. 重新整理農場頁，右上應從「☁ 雲端連接中」變成「☁ 雲端已同步」。

## 安全設計

- `farm_saves` 開啟 RLS。
- 每個 Supabase `authenticated` 使用者（包含匿名 Auth 使用者）只能讀寫 `user_id = auth.uid()` 的那一筆農場存檔。
- GitHub Pages 只使用公開 publishable key；不需要新增任何 secret。
- 這張表目前只做「私人雲端存檔 / 跨裝置恢復」，**暫時不拿來做排行榜**。

> 注意：V0.13.0 的農場經濟運算仍由瀏覽器遊戲邏輯執行，因此不應直接把 `farm_saves` 的金幣/等級當成公開排行榜的可信資料。等排行榜、好友、偷菜上線時，金幣、收成、偷菜會改由 Supabase RPC / Edge Function 做伺服器驗證。
