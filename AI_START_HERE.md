
## RO_WEB V0.9.78M
- 以 0.9.78L 為底，保留大地圖人物不抽動修正。
- 修正城鎮模式右側固定人物只移動 DOM、沒有同步 player.position 的問題；現在進城會同步 player 座標、target、hitbox 與 UI 透明判定腳底座標。
- 手機大地圖點擊補強 screen → camera → world 換算，並降低透明/空白 UI 容器整片擋住地圖點擊的風險。
- 新增 document-level fallback：手機世界地圖若點擊落在 battle-field 可視範圍內，即使上層透明 UI 接到事件，也會轉成世界座標移動。



## RO_WEB V0.9.78L
- 以 0.9.78k 為底，保留 4608×4608 野外世界與回城修正。
- 參考 0.9.76c 手機修法：手機 / 窄螢幕 world camera 改用 battle-field 實際 layout 尺寸作為邏輯 viewport。
- 修正手機野外點擊後角色左右抽動、Camera 座標與背景尺度不同步問題。

# AI START HERE - RO_WEB V0.9.78j

目前世界地圖方向已定案：

- 野外採 1280×720 Camera。
- 地圖資料採 Chunk Streaming 概念。
- 測試地圖為 3×3 Chunk，每張 512×512，以 3 倍世界尺寸呈現。
- 總世界大小：4608×4608。
- 野外人物維持小比例，城鎮人物恢復正常比例。

本版修正重點：

- `town.js`：回城時清除 World Camera / Large Map 狀態。
- `position_engine.js`：城鎮模式不再套用大型地圖 Camera；城鎮玩家固定右側。
- `position_engine.js`：手機版背景尺寸與 Camera offset 依 DOM 實際比例換算。
- `style.css`：補上 City Mode 與手機版 World Camera 等比縮放規則。

後續若要接怪物，應在 Chunk Streaming 架構上處理，不要再回到單張 512 或 Camera Zoom 0.5 測試。


## V0.9.78k - Responsive World Camera Fix
- 維持 9 張 512×512 Chunk ×3 的 4608×4608 野外區域設定。
- 修正手機 / 窄螢幕 World Camera 不再只顯示一條 16:9 地圖帶並留下大片黑底。
- PC 版維持 1280×720 Camera；手機 / 觸控裝置改由實際視窗矩形縮放背景與 Camera offset。
- 城鎮回村修正與城鎮玩家右側站位沿用 V0.9.78j。

## V0.9.78N AI Notes
- 78M confirmed: town/player/UI transparency coordinate sync is OK.
- 78N changes only two areas:
  1. `js/position_engine.js`: mobile worldCamera pointer input now uses a document-level capture path for all taps inside the battle-field visible rect, not only target-outside-field fallback.
  2. `js/ui.js`: mobile draggable window clamp no longer applies extra bottom wall; right/down overflow allowance matches left-side behavior.


## V0.9.78O
- 手機大地圖移動：世界地圖模式增加 pointerdown / touchstart / click 三重保險入口，使用 battle-field 可視矩形命中後直接 screen → camera → world。
- 手機 CSS UI：保留 78N 右/下可超出畫面拖曳，但背包拖曳後固定回原本內容高度，避免面板黑色大塊或內容跑位。
- 保留 78M 城鎮角色位置 / hitbox / UI 透明判定同步修正。

## V0.9.78Q handoff
- 這版是診斷版：`POSITION_DEBUG_ENABLED = true`。
- 手機大地圖點擊時，左下角 `World Touch Debug 78Q` 會顯示 screen / camera / world / block reason，地圖上會放綠色十字。
- 若點擊沒有任何更新，代表事件完全被別層吃掉或快取仍未更新。
- 若顯示 `blocked UI ...`，代表點在可互動 UI 上；若 UI 正在透明 `.ui-under-player`，內容區已允許點穿，標題列/按鈕仍會阻擋。


V0.9.78Q 重點：大地圖手機/滑鼠診斷版。左下角 Debug 會顯示 Chunk / Local / Walkable / Reason / State / Distance。綠十字=點擊落點，紅十字=MoveTarget，藍十字=Player目前位置。
