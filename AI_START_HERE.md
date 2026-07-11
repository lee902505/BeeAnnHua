
### V0.9.80C note
Use the V64 exported novice male idle atlas with anchor 128,150 for RO_WEB foot/reference-point validation. Only idle was replaced; other motions remain from V0.9.79F.



## RO_WEB V0.9.79E - RO Studio Atlas Runtime Direction Fix
- 修正 RO Studio V59 Atlas 左右方向反向問題：左右與斜向攻擊/移動同步修正。
- Idle 站立改為固定第 1 偵，避免村莊待機時一直擺頭。
- Walk 播放速度微調為 140ms/幀。
- 清存檔改為清除 RO_WEB localStorage、sessionStorage，並嘗試清除 Cache Storage 後帶 cache-bust 重新載入。
- 恢復綠十字座標對位功能，文字 debug overlay 仍保持關閉。

## V0.9.78CD
- 回補 CSS UI 透明度顯示層：玩家腳底判定壓到 UI 時，UI 透明度由 100% 降為 80%。
- 沿用 CC 穩定版 UI，不套用 AA 舊版未修好的視窗版面。
- CSS 快取更新為 0.9.78CD；position_engine 快取同步刷新。

# AI START HERE - V0.9.78W

本版從 78V 繼續修：座標與 camera 正常，但背景不動。
核心改動：新增 #world-camera-layer，把世界背景從 battle-field background 改成實際 DOM layer，並用 transform 套用 camera。
Debug 左下角新增 Layer / Transform。

## V0.9.78Y Notes
- 78W 已確認 PC / 手機大地圖 camera layer 移動成功，後續不要再動 world-camera transform。
- 78Y 只修 CSS UI fade：`updateUiFadeForPosition()` 改用 `#player-sprite.getBoundingClientRect()` 的實際腳底中心，透明度改為 0.7。


## V0.9.78Y Notes
- 以 78X 為基準，只調整 UI fade 透明度為 70%。
- index.html 全部 css/js 資源版本更新為 `?v=0.9.78Y`，強制刷新快取。
- 未修手機 UI 錯位與右/下拖曳邊界牆；預計下一版 78Z 專修。


## V0.9.78AG
- 以 78Y 為基準重構背包欄 / 技能欄 / 裝備欄視窗尺寸。
- 手機三大 UI 改用固定可控尺寸，避免黑色大塊與視窗拉爆。
- 手機 draggable 改用 viewport 邊界，右側與下方可像左側一樣拖出畫面。
- 快取版本更新至 0.9.78AG。


## V0.9.78AH
- Inventory Framework V1：背包視窗完全改為 Header / Tabs / 5x8 Grid / Footer 固定骨架。
- 修正 78AG Footer 裁切、手機 Grid 被裁掉、右側空白問題。
- 快取版本更新為 0.9.78AH。


## V0.9.78AQ
- Inventory tabs 在 78AP 基礎上往下 3px。
- CSS cache key 更新為 `v=0.9.78AQ`。
- 僅 CSS/cache key，不動 JS / 資料 / 圖片。


## V0.9.78AR
- Inventory tabs moved down another 3px from 78AQ.
- CSS cache key updated to v=0.9.78AR.
- No JS/data/image changes.


## V0.9.78AS
- Skill footer row and border moved up 5px.
- CSS cache key updated to v=0.9.78AS.
- CSS/cache only; no JS/data/image changes.


## V0.9.78AU
- 技能欄下方 footer 在 78AS 基礎上往下 3px。
- CSS cache key 更新為 `v=0.9.78AU`。
- 只改 CSS / cache key。


## V0.9.78AV
- 技能欄下方 footer 在 78AU 基礎上再往下 2px。
- CSS cache key 更新為 `v=0.9.78AV`。
- 只改 CSS / cache key，不動 JS、不動資料、不動圖片。


## V0.9.78AW
- Inventory: 同分類超過 40 個物品時，改由格子區內垂直捲動，不推動 Header / Tabs / Footer。
- Shop: 修正共用商店/武器防具清單滾到底時最後商品被底框裁切。
- Cache: index.html CSS cache key 更新為 v=0.9.78AW。


## V0.9.78AX
- 商店清單底部安全空間加大，最後一行商品不再被底框裁切。
- 技能欄超過 40 格時支援技能格區垂直滾輪。
- CSS cache key 更新為 v=0.9.78AX。


## V0.9.78AY - Shop List Bottom Frame +15 / Cache Fix
- 共用道具商人 / 武器防具商店底部內容區與清單視窗再增加 15px。
- 加大最後一行商品的 bottom safety space，避免滾到底仍被底框裁切。
- 保留技能欄超過 40 格的垂直滾輪支援。
- CSS cache key 更新為 `v=0.9.78AY`。


## V0.9.78AZ
- 修正商店清單滾到底時右下方 scrollbar 下箭頭被裁切。
- 商店內層 scroll frame 底部補顯示空間，套用共用道具商人 / 武器防具商店。
- CSS cache key 更新為 `v=0.9.78AZ`。


## V0.9.78BA 注意
本版只改 CSS / cache key。重點是商店清單 scroll frame 底部空間，不動 JS / 資料 / 圖片。


## V0.9.78BB - Shop Layout Refactor
- 修正 78BA 商店 scroll frame 撐爆底層外框問題。
- 改為固定 shop-window / shop-window-body / shop-list 層級高度，讓商品清單只在內層滾動。
- 保留 scrollbar 下箭頭顯示空間，但收斂 padding / margin 避免外溢。
- CSS cache key 更新為 v=0.9.78BB。


## V0.9.78BC note
Base: 78BB. Inventory scroll >40 confirmed. Equipment CSS now has final isolated override block at the end of css/style.css.

## V0.9.78BD - Equipment CSS Purge / Framework v2
- Rebuilt equipment window as a CSS-only framework.
- Retired legacy image-panel/absolute positioning rules by final scoped overrides.
- PC/mobile equipment slot grid centered consistently.
- CSS cache key updated to v=0.9.78BD.

## V0.9.78BE - Legacy UI CSS Purge
- Deleted old image-based equipment CSS blocks from `style.css` instead of only overriding them.
- Removed legacy bottom system/battle log panel markup.
- Removed legacy 1~0 quick-slot bar markup and script include.
- Kept a safety CSS lock so cached old bottom UI markup stays hidden.
- Updated CSS cache key to `v=0.9.78BE`.


## V0.9.78BF notes
Retired bottom system dialog and 1~0 quick-slot UI CSS/script remnants were deleted. Do not reintroduce legacy bottom UI without explicit request.


## V0.9.78BG
- Equipment Framework Final Polish.
- Enlarged equipment slots from 44px to 54px.
- Removed old white equipment slot look by hard-locking RO dark/gold slot styles.
- Added rounded gold inner frame around the ten equipment slots.
- Unified equipment close button styling.
- CSS cache key updated to v=0.9.78BG.


## V0.9.78BH
- Equipment inner gold frame visual line pushed outward by 5px using CSS outline-offset.
- Equipment slot positions unchanged.
- Removed the 78BG equipment-only close button styling override; shared X button will be handled later.
- CSS cache key updated to v=0.9.78BH.


## V0.9.78BI - Equipment Inner Frame Cleanup
- 移除 78BH 裝備內框多出的半透明第二層框。
- 只保留一條金色圓角內框，四邊往外 +5px。
- 裝備格位置與大小不動。
- CSS cache key 更新為 v=0.9.78BI。

## V0.9.78BJ - Equipment Inner Frame Real Target Fix
- 以 78BI 為基底。
- 確認裝備欄真正繪製金色內框的是 equipment grid 的 ::before 偽元素。
- 將正確內框由 -5px 改為 -10px，讓四邊實際再向外增加約 5px。
- 同步調整圓角為 20px，避免外推後角落太緊。
- 裝備格位置、大小與 X 按鈕不動。
- CSS cache key 更新為 v=0.9.78BJ。


### V0.9.78BP note
- 系統對話欄與 1~0 快捷欄曾在 CSS 清理時被整段移除；本版已從 0.9.65C 補回 DOM/quick_slots.js。
- 技能圖素材路徑維持 PNG，不要再改回 WebP。
- 底部系統對話欄與快捷欄目前採純 CSS 最終層，不依賴舊 panel/button 圖片。


## V0.9.78BQ NOTE
- 基底：V0.9.78BP。
- 只微調底部 HUD：#battle-log 與 #quick-slot-bar。
- 桌機版置中；手機版快捷欄改為較小格子與較窄間距。
- CSS 快取參數已更新為 css/style.css?v=0.9.78BQ。


### V0.9.78BR Note
- Bottom HUD: battle log and quick slot bar restored from v0.9.65C behavior.
- Battle log list must remain scrollable (`overflow-y:auto`, display block) because `js/battle.js` handles 100-line cap and auto-scroll lock.
- Mobile quick slots are square; do not compress them into tall rectangles.


## V0.9.78BS note
- 能力值欄只做 PC / mobile 排版微調。
- 不要動 bottom HUD、battle log scroll、quick_slots.js、skills PNG paths。


## V0.9.78CB
- 以 BZ 為基準修正背包內框，不沿用 CA 的過度高度修正。
- 內框視覺底線只往下延伸 5px。
- 恢復右側捲軸槽與 overflow-y，避免捲軸被內框覆蓋。
- CSS 快取更新為 0.9.78CB。


## V0.9.79F - Reference Point / Attack Lock Debug
- RO Studio Atlas 玩家錨點改讀 JSON anchor（舊資料預設 128,220）。
- 綠十字旁加入世界座標與 ref anchor 顯示，方便對照 Anchor Preview。
- 普攻動畫鎖定完整播放，傷害或 Miss 觸發時不再被 idle/hurt 立即蓋掉。
- CSS/JS cache key 更新至 0.9.79F。


## V0.9.80C Anchor140 All Motions Update
- 初學者 male atlas 全動作素材改為 Anchor X=128 / Y=140。
- 更新 idle / walk / hurt / dead / cast / attack(fist)。
- 預留 dagger / sword / axe / mace / staff 攻擊素材路徑。




## V0.9.80R WeaponType / Motion Constitution Update
- 所有可裝備武器必須有 `weaponType`。不得只靠 `subCategory`、`ClassNum`、`handed` 或中文說明判斷武器類型。
- 普通攻擊動畫唯一規則：`currentJob + gender + weaponType -> assets/characters/{job}/{gender}/motions.json.attack[weaponType]`。
- 例：十幾把單手劍都設定同一個 `weaponType`，裝備後自動套用該職業/性別的單手劍攻擊動畫。
- 普通攻擊特效可由 `weaponType` 決定；技能特效必須由 SkillID / 技能資料決定。
- 新增武器時必須同步檢查：`weaponType`、`data/weapon_types.json` 射程、可裝備職業、對應職業 `motions.json` 是否有動畫。
- 本版已為現有 `data/equipment/weapon/*.json` 寫入 `weaponType` 欄位，避免未來只靠資料夾/中文描述推斷。

## Character System V2 規則

- 玩家角色素材路徑固定為 `assets/characters/{job}/{gender}/`。
- 城鎮與角色資訊面板一律讀 `idle.png`。
- 野外/世界地圖一律讀 `motions.json` 指到的 atlas/json。
- 攻擊動畫查詢順序：`currentJob + gender + weaponType`。
- 不允許再使用舊 `images/player/male/idle/0001.png` 或舊騎士/劍士大圖當 fallback。
- 目前已驗證成功的 PC/手機 Profile、城鎮、世界地圖 XY 與倍率不得因新增職業而改動。


## V0.9.80W Item / Equipment Constitution V2
- 中文名稱、說明與圖示來源：`itemInfo_UTF8.lub`。
- 裝備/武器/防具能力、限制、位置、射程與效果來源：DB_RE `item_db_equip.yml`。
- 保留欄位：Id、AegisName、Type、SubType、Buy、Attack、MagicAttack、Defense、Range、Slots、Jobs、Classes、Locations、WeaponLevel、ArmorLevel、EquipLevelMin、Refineable、Gradable、View、Script、EquipScript、UnEquipScript。
- 不使用：Weight、未鑑定、Gender、Trade、Stack、NoUse、Delay、DropEffect。
- 價格規則：Buy 缺少時預設 20；Sell 優先用官方 Sell，否則 `floor(Buy / 2)`。
- `weaponType` 改為由 DB_RE `SubType` 自動轉換；普攻射程優先使用每件武器的 `Range`，`data/weapon_types.json` 只作 fallback。


## V0.9.80W - Character Attack Weapon Motion Fix
- 修正 Character V2 攻擊 JSON 指向 `body_hair_weapon.png`，但實際輸出檔名為 `body_hair.png` 造成攻擊 Atlas 載入失敗。
- 修正 F5 / 讀檔後未從已裝備武器同步 weaponType，導致拿劍、短劍、杖仍播放拳頭攻擊。
- 裝備切換後會從 `getEquippedWeaponData()` → `weaponType/dbSubType` → `motions.json.attack` 重新載入對應攻擊動畫。
- CSS/JS cache key 更新為 0.9.80W。

## V0.9.80X - Equipment Job/Class Enforcement
- 裝備前正式執行 RA DB_RE `Jobs`、`Classes`、`EquipLevelMin`。
- 初學者無法再裝備弓等未允許裝備。
- 新增 `data/equipment_job_map.json`，統一 RO_WEB 職業 ID 與 RA Jobs/Classes Key 對照。
- 裝備限制失敗時不扣背包、不替換原裝備，並顯示原因。


## V0.9.80Y 初學者系列素材規則
- 初學者、超級初學者、終極初學者皆有男女獨立素材。
- `expanded_super_novice` 共用 `super_novice` 素材，不複製 PNG。
- Anchor 固定 X=128 / Y=140。
- 初學者→超級初學者：Base10、Job10、基本技能Lv9，剩餘與暫存技能點皆為0。
