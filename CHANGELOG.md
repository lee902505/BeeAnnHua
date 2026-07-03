# RO_WEB V0.9.75a

- 手機 UI 熱修：修正拖曳彈往右上並卡住的問題。
- 技能欄手機版改為實際寬度收斂，避免小螢幕爆出外框。
- 商店購買區貼近底部邊框，保留約 5px。
- 未修改 Position Engine。

## V0.9.75 Mobile UI Fit / Shop Detail / Inventory Double Tap

- 手機版彈窗改為優先吃滿可視寬高，修正小螢幕技能欄與地圖/商店彈窗裁切問題。
- 手機商店商品區與物品介紹/購買區重新分配高度，商品資訊、數量與確認購買按鈕在小螢幕更容易操作。
- 背包裝備類物品改為：單點只看介紹，雙點才穿戴；避免點一下就直接穿上。
- 本版只調整 UI / 背包互動，不修改 Position Engine / Camera / Touch / Sprite Pivot。

## V0.9.75 - Android Safe Area +28

- Android 手機底部快捷欄改為 `bottom: calc(28px + env(safe-area-inset-bottom, 0px))`。
- 戰鬥紀錄同步上移，避免與快捷欄重疊。
- 不修改 Position Engine，只做底部 UI safe-area 微調。

## V0.9.75 - Mobile Position Engine Stable Release

- 移除 Position Debug Overlay / 十字測試點，正式版不再顯示座標除錯視窗。
- 保留 V0.9.72j 已驗證的 Mobile Position Engine：Windows / iPhone Safari / Android 四角皆可到達。
- 存檔 / 清存檔按鈕加入 UI 透明判定，角色走到按鈕附近時會同步淡化。
- Android / iPhone 底部 Safe Area 修正：快捷欄、戰鬥紀錄、存檔按鈕上移，降低被手勢列或瀏覽器底欄裁切機率。
- 版本號與快取參數更新為 0.9.75。

## V0.9.72j - Mobile Position Debug / Sprite Scale Sync

- 修正手機版同一次點擊可能產生兩筆「移動到座標」紀錄的問題。
- 角色 / 怪物手機縮放改成實際寬高，不再使用 CSS zoom，避免邏輯座標已到底但 Sprite 顯示仍卡在中段。
- 加入 Position Debug Overlay，手機實測時可直接看到 Player / Target / Field / Sprite 座標；V0.9.75 正式版已關閉。
- 版本號更新為 0.9.72j。

## V0.9.72h - iPhone Safari Visual Viewport Touch Fix

- 手機觸控座標改用 battle-field 與 visualViewport 的可視交集換算，避免 Safari 底部網址列造成下方座標被壓縮。
- 手機 touch 改以 touchstart 為主，忽略 touch pointerdown，避免同一次點擊重複覆蓋移動目標。
- visualViewport resize / scroll 時重新校正 Position Engine 顯示。
- 版本號更新為 0.9.72h。

## V0.9.72g - Mobile Position Save + Touch Boundary Fix

- Position 座標改為每 60 秒自動保存一次；F5 / 關閉 / 切到背景時會補存一次。
- 一般掛機移動不再每一步或每次到點都寫入，保留未來雲端同步的安全頻率。
- 手機版角色/怪物腳底座標加入 CSS zoom 反校正，修正下方邊界走不到、往下點反而偏移的問題。
- 戰鬥紀錄透明 UI 不再阻擋地圖點擊；按鈕、彈窗、快捷列仍會保留互動阻擋。
- 版本號更新為 0.9.72g。

## V0.9.72f - Mobile Position / Shop / Inventory Fix
- PC 與手機可走範圍改為動態大範圍：左右接近整張戰鬥畫面，上方避開角色資訊欄，下方避開戰鬥紀錄/快捷欄。
- 等待怪物出現的問號狀態不參與可走邊界與鎖定判定，避免座標範圍被怪物位置誤影響。
- 手機版背包格子區置中，修正僅手機版偏左問題。
- 手機版商店購買窗重新整理為商品清單 + 物品明細區，取消 sticky 購買列覆蓋說明。
- 金幣列完整數量提示改為 3 秒後自動關閉，並修正 `<br>` 顯示成文字的問題。
- 版本號更新為 0.9.72f。


## V0.9.72b - Mobile Bounds Fix

- 修正手機直式螢幕角色可能跑出框外。
- Position Engine 新增手機動態可行走區計算。
- 手機版座標依 battle-field 實際尺寸校正。
- 玩家 / 怪物位置會被限制在安全邊界。
- 底部戰鬥紀錄、快捷欄、右側功能按鈕納入手機安全邊界。
- 橫直切換與視窗尺寸變動時重新校正座標。

# V0.9.72b - Mobile Fix / iPhone Safari Position Hotfix

- 修正 iPhone Safari 點地圖無反應：Position Engine 同時綁定 pointerdown / touchstart / click。
- 修正手機版角色 / 怪物座標被 CSS `!important` 固定導致原地不動：改由 Position Engine inline important 控制。
- 手機版戰鬥區新增 `touch-action: none`，避免瀏覽器捲動/縮放吃掉移動事件。
- 修正手機版上方金幣列偏左蓋到圖示。
- 修正手機版左上角 Job Lv 顯示被裁切。
- 背包 / 技能 / 裝備 / 素質 / 地圖 / 城鎮 / 戰鬥設定等彈窗在手機版預設置中。
- 版本號更新為 0.9.72b。

## V0.9.69 - RA DB_re Level Cap / EXP Constitution Update

- 依專案入口 `RA開機檔案英文版20260608(DB_re)/rathena-master/db/re/job_exp.yml` 重新整理 Base / Job 上限與 EXP 表。
- `data/exp_tables.json` 擴充至四轉時代：Base Lv 275、Job Lv 60。
- 補齊目前預留職業的 EXP 表：超級初學者、擴充超初、忍者、影狼/朧、槍手、反叛者、跆拳、拳聖、悟靈士、拳皇、獵靈士、喵族、四轉擴充等。
- `data/jobs.json` 的 baseMaxLevel / jobMaxLevel 改為依 RA DB_re job_exp.yml 寫入。
- `data/job_constitution.json` 更新為 v2.1：
  - RO_WEB 一般職業二轉固定 Job50。
  - RO_WEB 進階二轉固定 Job50。
  - 明確不採 RA jobmaster 的一般二轉 Job40。
  - 一般職業仍排除未轉生直升三轉。
  - 其他等級條件與 Job 上限依 RA DB_re。
- 新增 `docs/RA_JOB_EXP_CAP_AUDIT_V0.9.69.md`，記錄本次 RA DB_re 對照結果。

# RO_WEB V0.9.69

- Job Constitution 升級為 v2.0：一般職業線與擴充職業線分開定義。
- 一般職業明確禁止「未轉生直接三轉」，RO_WEB 必須走轉生 → 進階二轉 → 三轉。
- 擴充職業依 RA 開機檔逐條寫入 JSON：超級初學者、忍者/影狼/朧、神槍手/反叛者、跆拳/拳聖/悟靈士、喵族等。
- 修正 job_constitution.json 與 job_constitution.js 格式不一致，避免技能點=0憲法失效。
- 新增 RA_JOB_ROUTE_AUDIT_V0.9.69.md 作為本次職業路線檢查紀錄。
- 快取版本更新為 0.9.69。

## V0.9.66a - Job Constitution Skill/Rebirth Patch

- 補強憲法：剩餘技能點 > 0 時，所有階段皆不可轉職。
- 補強憲法：轉生後素質點固定 125，不繼承轉生前剩餘素質點。
- 新增轉生 reset 防呆函式，避免未來實作時產生 125 + 舊剩餘點。
- 抽查 RA/rAthena 資料並新增 `docs/v0_9_66a_job_constitution_audit.md`。
- 3轉/4轉不確定值維持 pending_confirm / 待確認。


## V0.9.66 - Job Engine Constitution

- 正式新增 `data/job_constitution.json` 與 `js/job_constitution.js`。
- 所有轉職統一經過 Job Constitution 驗證，不再讓城鎮 NPC 或職業程式各自判斷共通規則。
- 加入共通規則：技能點必須全部點完、手推車/獵鷹等特殊系統必須卸除、Base/Job/技能前置/轉職路線統一檢查。
- 將「新增職業不得修改核心轉職程式，只允許新增 JSON」寫入專案憲法。
- 合併 V0.9.65d 裝備能力公式修正：DEF/MDEF/HIT/FLEE/ASPD/CRI 等裝備數值實際套用。


## V0.9.65ca - Skill Placeholder Retirement

- 移除 `images/skills/placeholder.webp` 技能保底圖。
- 快捷欄改為使用技能本身 icon / officialId 圖片路徑，缺圖時隱藏圖片而不是載入 placeholder。
- 移除 skills.json meta 內的技能 iconFallback 設定。
- 確認目前技能圖片皆以官方數字 Skill ID 對應。

# V0.9.65ca - Skill Official ID Logic Hotfix

- 技能資料主鍵改為官方數字 Skill ID。
- 英文技能代號改保留在 `code` 欄位，例如 `SM_BASH`，不再作為主要邏輯 ID。
- `requires` 前置技能改為吃官方數字 ID，並保留原英文代號於 `code` 方便查資料。
- 技能學習、暫存配點、快捷欄、Auto Battle 技能選擇加入舊存檔相容轉換。
- 技能圖片維持官方數字 ID 路徑，例如 `images/skills/5.webp`。
- 快取版本更新為 `?v=0.9.65c`。

# V0.9.64 - Skill Tree Complete + Mobile Layout v3 + UX Fix

- 初心者 / 劍士一轉技能流程整理：技能 Hover、介紹、技能點數與前置判斷維持完整。
- Skill Path V2：Hover 技能時，紅金路徑會一路回指所有前置技能。
- 修正技能路徑箭頭方向，不再指向當前技能。
- Mobile Battle Layout v3：人物、怪物、Top UI、金幣列、Battle Log 與快捷列位置再調整。
- 修正 draggable-window 在縮放狀態下第一次拖曳會往左上角跳的問題。
- 商店視窗 padding、scrollbar、高度與底部留白再整理。
- 快取版本更新為 `?v=0.9.64`。

# V0.9.64 - Classic Remaster Alpha

- 修正技能前置路徑箭頭方向：Hover 目前技能時，紅金箭頭改為指向前置技能。
- 保留技能前置路徑紅金高亮與前置技能粗框提示。
- 劍士一轉技能 ICON 進入 Remaster Prototype：先以黑金框、低飽和、清楚剪影方式試作，不列入正式憲法。
- Mobile Battle Layout V2：人物與怪物在手機窄螢幕往中央收，金幣列與 Battle Log 再微調。
- 新增 `--battle-offset-x` / `--battle-offset-y` 作為後續手機戰鬥位置微調總閥。
- 快取版本更新為 `?v=0.9.64`。


## V0.9.64 - Skill Path Highlight + Mobile Battle Fix
- 技能樹 Hover 有前置技能時顯示紅金色路徑線。
- 前置技能改用粗框 / 白金描邊高亮，避免被技能圖示 Glow 吃掉。
- 手機版人物與怪物位置往中間收，怪物不再跑出可視範圍。
- 手機版金幣 / 寶石列位置調整，Battle Log 高度縮小。
- 快取版本更新為 ?v=0.9.64。

# V0.9.64 - Skill Icon Remaster Trial

- 嘗試導入初心者 / 劍士一轉技能 ICON 黑金發光 Remaster 風格。
- 補齊初心者修練技能圖示路徑。
- 保留並強化技能 learned / learnable / locked CSS 狀態效果。
- 憲法加入技能 ICON 規則：官方辨識度優先、狀態由 CSS 控制、不得破壞前置高亮。
- 快取版本更新為 `?v=0.9.64`。

# RO_WEB V0.9.64

## Hotfix

- 修正瀏覽器分頁標題版本仍顯示 V0.9.55。
- 將角色資訊、中央玩家角色、怪物顯示納入 `--ui-scale` 總閥控制。
- 縮短共用商店視窗下方留白，底部約保留 10px。
- 快取版本更新為 `?v=0.9.64`。

# RO_WEB V0.9.64

## 本版定位
Auto UI Scale / Mobile Playable Mode 補強版。

## 更新內容
- 新增 CSS UI 總縮放閥門 `--ui-scale`。
- 依解析度自動切換 UI 縮放比例。
- 背景戰鬥區與左上角人物資訊不吃縮放；其他 UI 視窗、快捷按鈕、對話/操作列統一縮放。
- 手機版維持「可玩模式」：不做完整 RWD，但確保主要 UI 可縮放、可點擊、彈窗可滾動。
- 音效 / sound / audio 架構暫時不預留，避免過早增加系統複雜度。
- 快取版本更新為 0.9.64。

---

# RO_WEB V0.9.64

## 修正
- 商店視窗改成左右欄版面，避免商品介紹 / 購買數量 / 確認購買區被下方裁切。
- 商店視窗、商品列表、商品介紹區強制加入右側滾輪。
- 共用道具商店移除「單眼眼鏡」。
- 共用道具商店加入「菠色克藥水」（ID 657，價格 4500 Zeny）。
- 從專案門口 `itemInfo_UTF8.lub` 補入菠色克藥水介紹，並複製 `images/items/657.webp`。
- 快取版本更新為 0.9.64。

# RO_WEB V0.9.56

- 商店獨立視窗加寬加高，改善新增 CSS UI 下方購買區塊顯示不完整問題。
- 物品介紹 / 購買區塊加入右側滾輪，長介紹可直接捲動查看。
- 商店視窗本體加入垂直滾輪與小螢幕保護，避免 UI 超出畫面底部。
- 快取版本更新為 0.9.56。

# V0.9.55 NPC Shop UI V2

- 新增憲法規則：每次更新 CSS / JS / HTML 必須同步更新快取版本號。
- 城鎮商店改為獨立視窗，不再塞在城鎮 NPC 清單下方。
- 商店商品改為左鍵查看詳情，不再直接購買。
- 商品詳情支援物品圖片、介紹、單價、購買數量、總價與確認購買。
- 商店介紹沿用 Item DB V2 與 RO 色碼解析。


# V0.9.54 - Item DB V2

- data/items.json 正式退役並移除。
- 改由 item_index.json 載入 data/items/ 與 data/equipment/ 細分 JSON。
- 商店、背包、掉落、商城、Tooltip、裝備欄統一使用 getItemById()/getItemData()。
- 目前使用物品依 itemInfo_UTF8.lub 的 identifiedDisplayName / identifiedDescriptionName 校正。
- 移除放大鏡販售。
- Tooltip 支援 RO 色碼解析，不直接顯示 ^777777 類色碼。


## V0.9.53 - Log System V2
- 戰鬥 Log 保留最近 100 行。
- 右側黑金風格滾輪。
- 玩家往上查看舊訊息時暫停自動下捲。
- 回到底部後恢復自動追蹤最新訊息。
- 新訊息提示按鈕。

# RO_WEB V0.9.52

- 修正對話欄第一行被上緣裁切。
- 恢復 Log 分類顏色，避免被新版對話欄 CSS 覆蓋。
- 其他已成功項目不變。

# RO_WEB V0.9.51

- 修正對話欄文字顯示與白色內建滾輪問題。
- 技能配點列再往下 5px。
- 修正藥水 tooltip 重複說明。
- 快取版本更新為 0.9.51。

# RO_WEB V0.9.49

- 技能窗技能區往下微調，初心者列改為黑金底、Hover 才點亮。
- 戰鬥紀錄加入顏色分類：玩家傷害、怪物傷害、掉寶、Zeny、Base/Job EXP、技能/系統訊息。
- 暫時取消戰鬥紀錄的「綜合 / 戰鬥 / 系統」分頁按鈕。
- 職業名稱同步顯示：左上角色資訊與角色頭上名稱改讀目前 jobKey 的職業名稱。
- 商店物品名稱/說明依官方 itemInfo_UTF8 資料修正，包含輕便鞋、長靴、戰士長靴等。
- 修正開局/城鎮狀態下直接傳送南門的初始化邏輯。
- 快取版本更新為 0.9.49。

# RO_WEB V0.9.48

- 技能窗確認配點列往上固定到內框與外框中間。
- 取消配點列的暫存數字顯示。
- 初始化提示改為「需要：技能重置棒」。
- 補入商城道具：ID 12213 技能重置棒，含圖片與 cash.json 資料。
- 快取版本更新為 0.9.48。

# RO_WEB V0.9.47

- 徹底排查技能窗 CSS 覆蓋問題。
- 確認配點 / 初始化 footer 改掛技能窗外層，避免被 scroll 區裁切。
- 修正技能窗底部金色邊框與圓角顯示。
- 保留技能格正常版面。
- 快取版本更新為 0.9.47。

## V0.9.50
- 修正對話欄文字顯示。
- 修正城鎮中南門傳送按鈕誤判目前地圖。
- 修正商店/背包裝備名稱，優先採用官方 identified 名稱。
- 背包裝備 tooltip 清除韓文、重量、未鑑定提示，結尾改為「點擊可穿上裝備」。
- 技能配點列下移至底框上方約 5px。


## V0.9.65c
- 修正出生 Lv1 初始素質點：固定 25 點。
- 修正普攻傷害未即時吃到裝備 ATK：攻擊前重新計算衍生能力。
- 修正初心者未點滿基本技能 Lv9 仍可轉 1 轉：轉職 NPC 與 changeJob 雙層檢查。

## V0.9.71 - Position Combat Prototype

- 新增 `js/position_engine.js`。
- 新增玩家 / 怪物 x,y 座標。
- 玩家可點擊地圖移動。
- 近戰需靠近到射程內才會攻擊。
- 弓類武器可用較遠距離普攻。
- 怪物會依 AttackRange / ChaseRange / WalkSpeed 概念追擊玩家。
- 蒼蠅翅膀可真正隨機瞬移。
- 出生 / 舊存檔首載贈送蒼蠅翅膀 x100。
- 自動戰鬥新增「找不到可鎖定怪物 1 秒 / 3 秒後自動瞬移」。
- 新增 `docs/POSITION_COMBAT_PROTOTYPE_V0.9.71.md`。


## V0.9.71 - Movement Engine v0.1

- 接入 RA WalkSpeed 規則：普通 150、最快 20、最慢 1000。
- `walkSpeed` 成為玩家移動速度的統一來源，數值越小越快。
- Position Engine 改用 `walkSpeed -> px/sec` 轉換，不再使用固定移動速度。
- 裝備 / 卡片 / 技能 / Buff 預留 `walkSpeedFlat`、`walkSpeedRate`。
- 能力面板新增「移動速度」顯示。
- 新增 `data/movement_config.json`。
- 新增 `docs/MOVEMENT_ENGINE_V0.9.71.md`。

## V0.9.72 - Position Combat Engine v0.2

- 普攻加入真正射程判定，距離不足不再隔空命中。
- 新增 `data/weapon_types.json`，武器射程資料化。
- 弓類普攻預設 4 Cell，近戰 1 Cell，長矛暫定 2 Cell。
- 技能射程架構接入 `rangeCells`，投擲長矛先設為 7 Cell 測試。
- 手機 / 平板點地圖移動改用 Pointer Events。
- 補充 Position Constitution 規則。
