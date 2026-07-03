## V0.9.75b 快取更新提醒

本版已同步更新 HTML 資源引用 `?v=0.9.75b`、`RO_WEB_VERSION` 與進入歡迎訊息版本號。之後任何 CSS / JS / HTML 更新都必須同步更新快取版本。

## V0.9.75 Mobile UI Fit / Shop Detail / Inventory Double Tap

- 手機版彈窗改為優先吃滿可視寬高，修正小螢幕技能欄與地圖/商店彈窗裁切問題。
- 手機商店商品區與物品介紹/購買區重新分配高度，商品資訊、數量與確認購買按鈕在小螢幕更容易操作。
- 背包裝備類物品改為：單點只看介紹，雙點才穿戴；避免點一下就直接穿上。
- 本版只調整 UI / 背包互動，不修改 Position Engine / Camera / Touch / Sprite Pivot。


## V0.9.75 Android Safe Area 微調

- 本版只調整 Android 底部 UI Safe Area。
- 快捷欄 / 存檔按鈕底部距離設定為 `28px + env(safe-area-inset-bottom, 0px)`。
- 戰鬥紀錄同步上移，避免與快捷欄重疊。
- 禁止因本項微調改動 Position Engine / Camera / Touch / Sprite Pivot。

# AI_START_HERE

# RO_WEB AI START

任何修改前，必須先閱讀：

RO_WEB_CONSTITUTION.json

禁止：

- 跳過憲法
- 違反憲法
- 建立第二份資料來源

所有更新完成後：

再次確認修改沒有違反憲法。

如果憲法不足，
請先提出討論，
不要自行更改架構。


## V0.9.73 Position Engine 憲法

- Mobile Position Engine 已完成跨平台驗證：Windows 桌面、iPhone Safari、Android 均可到達左上、右上、左下、右下四個角落。
- Camera、Viewport、Touch / Pointer 輸入、Sprite Pivot、World Position 換算屬於穩定核心，不可任意重構或改回 CSS 固定座標。
- 角色與怪物位置必須以 Position Engine 的 inline left/top 與腳底 Pivot 為準；不要再用手機 CSS 固定 `left/top` 覆蓋。
- 若未來修改上述模組，必須重新驗證：四角可到達、點擊座標只記錄一筆、UI 透明判定同步、iPhone Safari 與 Android 實機皆通過。
- Debug Overlay 只允許臨時開啟用於除錯，正式版本預設必須關閉。


## Cache Busting / 快取版本號

每次更新 CSS / JS / HTML 後，必須同步更新 `index.html` 內所有資源引用版本號，例如：

```html
<link rel="stylesheet" href="css/style.css?v=0.9.69">
<script src="./js/game.js?v=0.9.69"></script>
```

避免瀏覽器讀取舊快取，造成 UI 位置、CSS、JS 看似沒有更新。


## V0.9.65ca Auto UI Scale 規則

- `:root` 必須保留 `--ui-scale` 作為 UI 總縮放閥門。
- 新增 UI 視窗、彈窗、快捷按鈕、操作列時，必須納入共用縮放架構。
- 背景戰鬥畫布與左上角人物資訊為主畫面核心，不吃 `--ui-scale`。
- 依解析度可用 CSS media query 自動調整 `--ui-scale`。
- 手機版目標是 Mobile Playable Mode：能玩、能點、彈窗不爆版，不要求完整 RWD。
- 音效 / sound / audio 架構暫時不預留。


## V0.9.65ca Skill Icon Remaster Trial 規則
- 本版為技能圖示試作版，不一次重做所有技能。
- 初心者 / 劍士一轉技能 ICON 可使用黑金發光 RO Remaster 試作風格。
- 技能狀態 Normal / Learned / Can Learn / Locked 優先由 CSS 控制，不要為每個狀態複製大量圖片。
- 新增技能 ICON 不得破壞前置技能發光、高亮、鎖定、可學習邏輯。
- 若後續導入 RO Studio Skill Builder，官方 skill id 仍為唯一主鍵，分類與文字不可覆蓋 id。


## V0.9.65ca 工作筆記
- 技能樹前置路徑採 Hover 顯示紅金線，目標是提升可讀性，不改技能數值邏輯。
- 技能 ICON 美術仍為 Trial，不得直接寫入正式憲法。
- Mobile Battle Fix 只應在小螢幕 media query 啟用，不可影響 PC 版 1280×720 主規格。
- 每次更新 CSS / JS / HTML 後必須同步更新 `?v=` 快取版本號。


## V0.9.65ca 工作筆記
- Skill Icon Remaster 仍屬 Prototype，不可直接寫入憲法。
- 目前試作範圍：劍士一轉技能 ICON（images/skills/2~8、144~146）。
- 技能前置路徑 Hover 時，箭頭方向必須指向「前置技能」，用來提示玩家先點哪一招。
- Mobile Battle Layout V2 僅在 max-width: 900px 啟用，不得影響 PC 版 1280x720 觀感。
- 手機戰鬥位置後續優先用 CSS 變數 `--battle-offset-x` / `--battle-offset-y` 微調，不要直接散落寫死座標。

## V0.9.65ca 工作筆記
- Skill Tree Complete：初心者與劍士一轉技能必須保留技能點數、Hover、介紹、前置判斷與待確認配點流程。
- Skill Path V2：Hover 有前置的技能時，紅金路徑必須由目前技能一路回指所有前置技能；不只顯示直接前置。
- Mobile Battle Layout v3：手機版以戰鬥重心置中為主，人物、怪物、Top UI、金幣列與下方快捷列不得跑出可視範圍；PC 版不得受影響。
- UI Drag Fix：所有 draggable-window 在 --ui-scale / CSS zoom 下，拖曳第一下不得跳向左上角。
- 商店彈窗：保持固定高度與內部 scrollbar，Padding / 底部留白需維持緊湊。
- 本版只做程式、CSS、JSON 與文件更新；不要新增生圖。


## V0.9.65ca Skill ID 規則

技能系統主鍵改為官方數字 Skill ID。

- `id`：官方數字 Skill ID，作為主要邏輯 ID。
- `officialId`：與 `id` 保持一致，方便官方資料匯入與 Studio 對接。
- `code`：英文技能代號，例如 `SM_BASH`，只作開發閱讀 / 查資料用途，不作主要邏輯 ID。
- `name`：玩家介面顯示繁體中文。
- `icon`：使用 `images/skills/{officialId}.webp`。
- 前置技能 `requires[].id` 也必須使用官方數字 Skill ID。

舊存檔若仍保存 `SM_BASH` 等英文 key，啟動時會由 `migrateSkillStorageToOfficialIds()` 自動轉成官方數字 ID。

- v0.9.65ca：技能 placeholder.webp 已退休；技能圖應以官方 Skill ID 圖片路徑對應，缺圖時應由報告處理，不使用保底圖混淆。


## V0.9.69 Job Engine Constitution 必讀

- 修改任何職業、技能、轉職、Job EXP、Job Level、技能點流程前，必須先讀 `RO_WEB_CONSTITUTION.json` 與 `data/job_constitution.json`。
- 任何轉職請求都必須走 `validateJobConstitution()` → `changeJob()`，不得直接寫 `player.jobKey = ...` 或 `player.job = ...`。
- 新增任何職業（含二轉、進階二轉、三轉、四轉、擴充職業）不得修改核心轉職程式，只允許新增 JSON 資料。
- 所有冒險者共通轉職條件：技能點必須全部點完、手推車/獵鷹等特殊系統必須卸除、Base/Job/技能前置/轉職路線必須通過 Job Constitution。

## V0.9.69 Job Constitution 補強

- 技能點必須點完規則適用所有階段：一般轉職、轉生後轉職、未來 3/4 轉。
- 轉生後素質點固定為 125，不繼承轉生前剩餘素質點。
- 3轉/4轉仍標記待確認，不硬寫死。


## V0.9.69 Job Route 憲法補強

- 一般職業與擴充職業分成兩套路線。
- 一般職業禁止未轉生直接三轉；必須走轉生 → 高級一轉 → 進階二轉 → 三轉。
- 擴充職業不得硬套一般職 1~4 轉，條件以 `data/job_constitution.json > extendedJobRoutes` 為唯一資料來源。
- 參照資料為 RA 開機檔 `npc/custom/jobmaster.txt` 與 `db/re/job_exp.yml`。
- 新增擴充職業只能補 JSON，不得修改核心轉職程式。


## V0.9.69 Job/EXP 憲法補充

- 一般職業二轉與進階二轉：RO_WEB 決定版固定 Job50，不採 RA jobmaster `.Req_Second 1/40`。
- 一般職業：禁止未轉生直接三轉；必須經過轉生與進階二轉。
- 除上述 RO_WEB 排除/覆寫規則外，Base / Job 上限與 EXP 表依專案入口 RA DB_re `db/re/job_exp.yml`。
- 四轉與擴充四轉：Base 上限 275，Job 上限 60。
- 修改 Job/EXP 系統時，必讀 `data/job_constitution.json` 與 `docs/RA_JOB_EXP_CAP_AUDIT_V0.9.69.md`。


## V0.9.71 Position Combat Prototype 注意事項

- 修改戰鬥、移動、射程、蒼蠅翅膀、怪物追擊前，必須先查看 `js/position_engine.js`。
- 怪物行為欄位參照 RA mob_db：AttackRange / SkillRange / ChaseRange / WalkSpeed / Ai / Modes。
- 不要把距離判定散落在技能或怪物資料外的臨時 if；應集中到 Position Engine。


## V0.9.71 Movement Engine 必讀

- RO_WEB 採用 RA WalkSpeed 邏輯：數值越小越快。
- 普通玩家 `walkSpeed = 150`，最快 `20`，最慢 `1000`。
- 移動速度相關效果（加速術、緩速術、月夜貓卡、坐騎、騎狼、手推車加速等）不得直接改座標位移。
- 所有速度效果必須統一寫入 `walkSpeed` / `walkSpeedFlat` / `walkSpeedRate`，再由 Position Engine 轉成畫面移動速度。

## V0.9.72 Position Combat 注意事項

- 普攻、技能、怪物攻擊都不得繞過 Position Engine 距離判定。
- 玩家普攻射程請修改 `data/weapon_types.json`，不要在 `battle.js` 硬寫。
- 技能射程請在 `data/skills.json` 使用 `rangeCells`。
- 手機點擊地圖使用 Pointer Events；不要只綁 click。


## V0.9.75a 補充
- 手機 UI 拖曳修正僅限 ui.js / CSS 視窗定位，不可改 Position Engine。
- 手機技能欄使用實際寬度收斂，不再使用 transform scale 壓縮整窗。
