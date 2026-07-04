
## RO_WEB V0.9.78M
- 以 0.9.78L 為底，保留大地圖人物不抽動修正。
- 修正城鎮模式右側固定人物只移動 DOM、沒有同步 player.position 的問題；現在進城會同步 player 座標、target、hitbox 與 UI 透明判定腳底座標。
- 手機大地圖點擊補強 screen → camera → world 換算，並降低透明/空白 UI 容器整片擋住地圖點擊的風險。
- 新增 document-level fallback：手機世界地圖若點擊落在 battle-field 可視範圍內，即使上層透明 UI 接到事件，也會轉成世界座標移動。



## RO_WEB V0.9.78L
- 以 0.9.78k 為底，保留 4608×4608 野外世界與回城修正。
- 參考 0.9.76c 手機修法：手機 / 窄螢幕 world camera 改用 battle-field 實際 layout 尺寸作為邏輯 viewport。
- 修正手機野外點擊後角色左右抽動、Camera 座標與背景尺度不同步問題。

# RO_WEB V0.9.78j

## 本版重點

- 地圖區域架構維持：9 張 512×512 Chunk，每張以 3 倍世界尺寸呈現，總世界 4608×4608。
- 修正野外回城鎮時，World Camera / Large Map 背景尺寸與 offset 殘留，導致城鎮背景被放大成模糊巨圖的問題。
- 新增 City Mode：回城後完整清掉 world-camera 狀態，城鎮背景恢復 cover / center。
- 城鎮模式玩家固定在畫面右側，左側預留給 NPC / 商店 / 任務角色。
- 手機版 World Camera 以 1280×720 等比縮放顯示，背景尺寸與 Camera offset 由 JS 同步換算，避免背景尺度錯位。

## 備註

本版不改人物比例、不改野外世界尺寸、不新增怪物。主要是穩定「野外 ↔ 城鎮」切換，以及手機版世界背景尺度。


## V0.9.78k - Responsive World Camera Fix
- 維持 9 張 512×512 Chunk ×3 的 4608×4608 野外區域設定。
- 修正手機 / 窄螢幕 World Camera 不再只顯示一條 16:9 地圖帶並留下大片黑底。
- PC 版維持 1280×720 Camera；手機 / 觸控裝置改由實際視窗矩形縮放背景與 Camera offset。
- 城鎮回村修正與城鎮玩家右側站位沿用 V0.9.78j。

## V0.9.78N - Mobile World Movement + UI Drag Edge Fix
- 修正手機版進入大地圖後點擊不移動：worldCamera 地圖新增 document-level pointer 主入口，直接做 screen → camera → world 換算並下達移動。
- 保留 78M 的城鎮 CSS UI 透明判斷同步修正。
- 修正手機 UI 視窗拖曳右側/下方像有邊界牆：右邊與下方改成與左側相同，只保留可抓標題區即可超出畫面。


## V0.9.78O
- 手機大地圖移動：世界地圖模式增加 pointerdown / touchstart / click 三重保險入口，使用 battle-field 可視矩形命中後直接 screen → camera → world。
- 手機 CSS UI：保留 78N 右/下可超出畫面拖曳，但背包拖曳後固定回原本內容高度，避免面板黑色大塊或內容跑位。
- 保留 78M 城鎮角色位置 / hitbox / UI 透明判定同步修正。

## V0.9.78Q - World Move Diagnostics
- 保留手機大地圖綠色十字測試，新增紅色 MoveTarget 十字與藍色 Player 十字。
- Debug 框新增 chunkX/chunkY、localX/localY、walkable/reason、state/distance/speed。
- 大地圖目前沒有精細不可走遮罩時，chunk 範圍內落點採 fallback 可走，避免 world touch 算對但 move target 被查詢缺資料擋死。
- index.html / css / js cache bust 更新為 ?v=0.9.78Q。

## V0.9.78P - World Touch Debug / Cache Bust
- 強制更新 index.html 內 css/js query string 至 `?v=0.9.78Q`，避免手機吃舊快取。
- 開啟手機大地圖 World Touch Debug：左下角框框 + 綠色十字，顯示 screen/camera/world/move target。
- 透明中的 UI 內容區允許點穿到大地圖，標題列與按鈕仍可拖曳/操作。
- 移除 78O 對背包高度的強制覆蓋，避免物品欄下半部被撐出黑色大塊。
