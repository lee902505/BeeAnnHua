## V0.9.76c 注意事項

本版只修手機 UI / Drag / Shop Layout，不修改 Position Engine。

核心規則：
- Position Engine 已跨平台驗證，禁止任意修改。
- 拖曳只由 `.drag-handle` / `.window-title` 啟動。
- 視窗內容區必須保留 `touch-action: pan-y`，避免商店與列表無法滑動。
- 每次版本更新必須同步更新 `?v=`、歡迎訊息版本號、CHANGELOG。

## V0.9.76c
- 商店改為商品清單 + 獨立購買確認窗，手機版不再讓商品列表、說明、購買區互相覆蓋。
- 手機背包格子與物品圖示放大回可點尺寸。
- 已同步更新快取版本號與歡迎版本號。
- 未修改 Position Engine / Camera / Viewport / Drag Engine。

