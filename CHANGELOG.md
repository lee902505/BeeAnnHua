## V0.9.78CF
- 座標 CSS UI 從左下角移到系統對話框右下角。
- 右側預留捲軸與新訊息箭頭空間，移動時的 `→ 目標座標` 不遮擋捲軸。
- CSS / position_engine 快取更新為 0.9.78CF。

## V0.9.78CE
- 移動到座標訊息不再寫入聊天欄，改用 CSS 小 UI 顯示當前座標 / 目標座標。
- 回補戰鬥紀錄分類顏色：打怪、被打、掉落、Zeny、Base/Job EXP、技能、死亡、稀有。
- CSS / position_engine 快取更新為 0.9.78CE。

## V0.9.78CD
- 回補 CSS UI 透明度顯示層：玩家腳底判定壓到 UI 時，UI 透明度由 100% 降為 80%。
- 沿用 CC 穩定版 UI，不套用 AA 舊版未修好的視窗版面。
- CSS 快取更新為 0.9.78CD；position_engine 快取同步刷新。

## V0.9.78CC
- 商店清單視窗改為顯示約 5 格商品高度，剩餘商品靠清單內捲軸瀏覽。
- 修正手機版商店清單高度超出畫面問題。
- 關閉左下角座標測試框與地圖十字 debug 顯示。
- CSS 快取更新為 0.9.78CC。

## V0.9.78BZ - Inventory Button Down Fine Tune
- 以 V0.9.78BV 為基準修正。
- 背包下方「整理 / 分解 / 鎖定」按鈕下移 15px。
- 背包內部格子方框向下加長 5px。
- 保留 5×4 顯示、右側捲軸槽與超過 20 格才捲動。
- CSS 快取更新為 0.9.78BZ。


## V0.9.78BV - Inventory 5x4 Scroll-Gutter Compact
- 背包欄 PC / 手機固定 5×4 顯示。
- 格子區加寬並預留右側捲軸槽，超過 20 格自動出現捲軸，未超過時不顯示。
- 下方整理 / 分解 / 鎖定按鈕上移，外框保持精簡。
- CSS 快取更新為 0.9.78BV。

## V0.9.78BU - Inventory 5x4 Compact Hotfix
- 背包格子區固定 5x4 顯示。
- 隱藏格子區原生捲軸，避免右側捲軸吃到第 5 欄。
- 縮短背包視窗高度，減少底部空白。
- CSS cache key 更新為 v=0.9.78BU。


## V0.9.78BT - Inventory 5x4 + Tooltip Text
- 背包視覺顯示改為 5x4 格，PC / mobile 共用。
- 同分類超過 20 個物品時，格子區保留垂直捲動。
- 裝備 tooltip 刪除「單點查看介紹」，只保留「雙點可穿上裝備」。
- CSS cache key 更新為 v=0.9.78BT。

# RO_WEB Changelog

## V0.9.78BS - Status Window PC/Mobile Polish
- 微調能力值欄 PC / 手機版寬度、左右欄比例與數值對齊。
- 手機版保留雙欄配置，但縮小內距與欄距，避免右側戰鬥能力貼邊。
- CSS cache 更新到 0.9.78BS。
- 不動已修好的快捷欄、系統對話欄滾輪、技能 PNG 路徑。



## V0.9.78BR - Battle Log Scroll Restore / Mobile Hotbar Square
- Restore system battle log scrolling behavior from v0.9.65C.
- Keep battle log history capped by existing JS at 100 lines.
- Restore user scroll lock behavior: when scrolling up, new messages no longer force jump to bottom; new-message notice remains available.
- Adjust mobile 1-0 quick slots back to square cells.
- Update CSS cache version to 0.9.78BR.

## V0.9.78AP - Inventory Micro Position + CSS Residue Audit
- 修正 78AO 只改 margin 導致 Tabs / Footer 視覺位置可能沒有變的問題。
- 背包 Tabs 使用 top + transform 雙保險上移 5px。
- 背包 Footer 使用 top + transform 雙保險下移 8px。
- 更新 index.html 的 style.css cache key 到 v=0.9.78AP，避免瀏覽器沿用舊 CSS。
- 再加一層 Inventory / Skill residue lock，避免舊 nth-child、absolute、雙框樣式回壓。
- 不動 JS、不動資料、不改 HTML 結構。


## V0.9.78AI - Inventory CSS Purge

- 背包 CSS 最終硬封鎖：清除舊版 absolute / nth-child 座標影響。
- 背包改為唯一骨架：Header / Tabs / Grid / Footer。
- PC / Mobile 共用同一套 5 x 8 grid，手機只調整視窗縮放。
- Footer 操作列改由新骨架控制，避免舊 `.inventory-action-row` 覆蓋。

# RO_WEB V0.9.78AG

- 背包 Footer 整合修正：整理 / 分解 / 鎖定正式納入背包視窗內。
- 保留 78AF 已修好的背包 5×8 Grid。
- 不動技能欄、裝備欄、素質欄與 World Camera。
- 快取版本更新為 0.9.78AG。

# RO_WEB V0.9.78AG

- Inventory Body Final Rewrite.
- 背包欄改成 Header / Tabs / 5x8 Grid / Footer 四層直接結構。
- 修正 78AG PC/手機右側空白、Grid 偏左、Body 容器殘留問題。
- 不動技能欄 / 裝備欄 / 素質欄 / World Camera。
- 快取版本更新為 0.9.78AG。

# RO_WEB V0.9.78AG

- 重建背包欄 Inventory V2。
- 移除背包舊版 absolute/nth-child/zoom 版面干擾。
- PC / 手機共用同一套 5×8 背包 Grid。
- 不修改技能欄、裝備欄、素質欄與大地圖 Camera。
- 快取版本更新為 0.9.78AG。

# RO_WEB V0.9.78AG

- 以 78AC 為基準，只重構背包欄，不動技能欄 / 裝備欄 / 素質欄 / 大地圖 Camera。
- 背包欄改成乾淨 5×8 grid，共 40 格；移除舊版絕對座標與過長黑色空白區的影響。
- 背包分頁、格子、整理/分解/鎖定、翻頁列重新定位。
- 背包每頁數量改為 40，與 5×8 UI 一致。
- PC / 手機共用同一套背包版面，手機只調整 zoom。
- 快取版本更新為 0.9.78AG。

# RO_WEB V0.9.78AB

- 以 78AA 為基準，掃描並整理五個舊版重複最多的 UI 欄目：角色資訊、背包、技能、素質、裝備。
- 地圖欄暫時不動，保留後續改版空間。
- 移除 78AA 末端造成背包/技能/裝備壓縮錯位的手機補丁段，改成五欄最終覆寫層。
- 三大視窗新增專用縮放閥：PC 0.86，手機 0.78~0.92 依寬度。
- 拖曳位置記憶 key 更新為 78AB，避免沿用舊錯位座標。
- 快取版本更新為 0.9.78AB。

# RO_WEB V0.9.78W

- 修正手機大地圖 Camera 已計算但背景不動的問題。
- 新增 #world-camera-layer，將 4608×4608 世界背景放入實際 DOM layer。
- Camera 改用 transform: translate(-cameraX, -cameraY) 套到真正背景層。
- Debug 顯示 Layer / Transform，方便確認是否套用到正確層。

## V0.9.78Y - CSS UI Fade Sync
- 以 78W World Camera 成功版為基準，不更動大地圖 camera / movement。
- UI 透明判定改優先讀取 player-sprite 實際畫面腳底座標，避免城鎮右側站位或 camera layer translate 後吃到舊 player.position。
- UI 透明度由 30% 調整為 50%。
- index.html 資源版本更新為 0.9.78Y，降低快取殘留。


## V0.9.78Y Notes
- 以 78X 為基準，只調整 UI fade 透明度為 70%。
- index.html 全部 css/js 資源版本更新為 `?v=0.9.78Y`，強制刷新快取。
- 未修手機 UI 錯位與右/下拖曳邊界牆；預計下一版 78Z 專修。


## V0.9.78AB
- 以 78Y 為基準重構背包欄 / 技能欄 / 裝備欄視窗尺寸。
- 手機三大 UI 改用固定可控尺寸，避免黑色大塊與視窗拉爆。
- 手機 draggable 改用 viewport 邊界，右側與下方可像左側一樣拖出畫面。
- 快取版本更新至 0.9.78AB。


## V0.9.78AH
- Inventory Framework V1：背包視窗完全改為 Header / Tabs / 5x8 Grid / Footer 固定骨架。
- 修正 78AG Footer 裁切、手機 Grid 被裁掉、右側空白問題。
- 快取版本更新為 0.9.78AH。


## V0.9.78AJ - Inventory Content Anchor Fix
- 修正 78AI 後 PC 版背包 Tabs/Grid/Footer 可能被舊 absolute anchor 拉到視窗外的問題。
- 背包視窗改為 flex 視窗骨架：Title / Body 正常文件流排列。
- 背包 Body 改回 relative，不再用 absolute top/left 錨定。
- Grid、Tabs、Footer 全部固定在 #inventory-window 內置中。
- 手機版維持同一套 5x8 grid，不另外切版。


## V0.9.78AK - Inventory Toggle / Close Fix

- 修正 78AJ 背包 `display:flex !important` 覆蓋 `.hidden-window`，造成右上 X 關不掉。
- 修正右上「背包」快捷按鈕 toggle 後視覺上沒有關閉的問題。
- 新增背包關閉狀態 hard lock：`#inventory-window.hidden-window { display:none !important; }`。
- 提高背包右上 X 的 pointer-events / z-index，避免被標題或拖曳層吃掉點擊。


## V0.9.78AL - Inventory Polish / Inner Gold Frame
- 在背包 5x8 grid 外層加入淡金內框，增加 RO UI 層次感。
- Footer「整理 / 分解 / 鎖定」改為水平置中。
- Footer 與 grid 區域間距下移，預留底部弧形裝飾空間。
- 僅修改 CSS，不更動背包 JS toggle / close 邏輯。

## V0.9.78AM - Inventory Polish Fine Tune + Skill Slot Border Purge
- 背包內金框微調：左右/上下留白更自然，線條降低存在感。
- 背包 Footer 三顆按鈕維持置中並稍微下移，保留底部裝飾空間。
- 技能欄 40 格清除雙層 border 殘留：slot 改為定位容器，單一淡框由 pseudo-element 繪製。
- 純 CSS 修正，不更動 JS、資料與背包開關邏輯。


## V0.9.78AN - Inventory / Skill Frame Separation Cleanup
- 不生圖、不改圖，只做 CSS。
- 背包內框移除 AM 版多餘第二層疊線，只保留單層淡金框。
- 背包 Tabs 往上收，Grid 與 Tabs 間距更接近原始骨架。
- 技能欄恢復 40 格外層大框。
- 技能格本身維持單層淡框，避免回到雙框殘留。


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


## V0.9.78AT
- 技能欄下方 footer 在 78AS 基礎上往下 3px。
- CSS cache key 更新為 `v=0.9.78AT`。
- 只改 CSS / cache key。


## V0.9.78AU
- 技能欄下方 footer 在 78AT 基礎上再往下 3px。
- CSS cache key 更新為 v=0.9.78AU。
- 僅 CSS/cache key，未修改 JS/資料/圖片。


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


## V0.9.78BA - Shop Scroll Frame Bottom + Code Audit
- 加大商店清單模式外窗與內層 scroll frame 底部空間。
- 修正共用道具商店 / 武器 / 防具商店滾到底時 scrollbar 底部箭頭被裁切的問題。
- 保留 V0.9.78AX+ 的技能欄超過 40 格滾輪支援。
- CSS cache key 更新為 `v=0.9.78BA`。


## V0.9.78BB - Shop Layout Refactor
- 修正 78BA 商店 scroll frame 撐爆底層外框問題。
- 改為固定 shop-window / shop-window-body / shop-list 層級高度，讓商品清單只在內層滾動。
- 保留 scrollbar 下箭頭顯示空間，但收斂 padding / margin 避免外溢。
- CSS cache key 更新為 v=0.9.78BB。


## V0.9.78BC - Equipment Framework v1
- Confirmed inventory >40 slot scroll support remains in CSS/JS.
- Rebuilt equipment window CSS as isolated framework.
- Centered equipment grid for PC/mobile.
- Moved mobile equipment grid slightly downward for visual balance.
- Updated CSS cache key to v=0.9.78BC.

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


## V0.9.78BF - Legacy UI CSS Deep Clean
- Deleted retired bottom system dialog / battle-log CSS safety-lock remnants.
- Deleted retired 1~0 quick-slot / hotbar CSS remnants and unused quick_slots.js.
- Removed the old hotbar width root variable and legacy comment block.
- Kept Inventory / Skill / Shop / Equipment framework behavior unchanged.
- Updated CSS cache key to v=0.9.78BF.


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


## V0.9.78BL - Equipment Background Purge / Skill Recovery
- Cleaned equipment grid body background so only the correct ::before gold inner frame remains.
- Kept equipment slots, size, and position unchanged.
- Added strict skill tooltip/prerequisite visibility recovery lock to prevent prerequisite text from showing permanently.
- Updated CSS cache key to v=0.9.78BL.


## V0.9.78BN - Skill Framework Restore on BL Base
- Base: V0.9.78BL.
- Restored skill grid display behavior without reverting equipment cleanup.
- Hid skill name / prerequisite mini text in the 40-slot skill grid.
- Forced skill icon alpha backgrounds back to transparent.
- Updated CSS cache key to v=0.9.78BN.


## V0.9.78BN
- 修復技能 icon 透明背景被黑底填滿的問題。
- 僅限制於 `#skill-window.true-skill-window`，不影響裝備欄。
- CSS cache key 更新為 `v=0.9.78BN`。


## V0.9.78BP - Quick Slot / System Log Restore
- 從 V0.9.65C 補回 `#battle-log` 系統對話欄 DOM。
- 從 V0.9.65C 補回 `#quick-slot-bar` 1~0 快捷欄 DOM 與 `js/quick_slots.js`。
- 快捷欄技能圖路徑延續 BO 規格，技能圖使用 PNG。
- 補上最終層純 CSS，避免回帶舊圖片面板疊層。
- 清除未被 HTML/CSS/JS/Data 參照的 `images/ui/buttons` 與 `images/ui/panels` 舊素材。


## V0.9.78BQ - Bottom HUD Center / Mobile Quickbar Compact
- 以 BP 為基底。
- 系統對話欄與 1~0 快捷欄桌機版水平置中。
- 手機版快捷欄格子縮小、間距縮小，避免貼邊與溢出。
- 更新 CSS / quick_slots.js 快取版本參數到 0.9.78BQ。


## V0.9.78CB
- 以 BZ 為基準修正背包內框，不沿用 CA 的過度高度修正。
- 內框視覺底線只往下延伸 5px。
- 恢復右側捲軸槽與 overflow-y，避免捲軸被內框覆蓋。
- CSS 快取更新為 0.9.78CB。


## V0.9.78CH - Mobile Character EXP Bars Restore
- 修正手機版角色資訊卡高度不足，Base EXP / Job EXP 條被裁切不顯示。
- 只補手機 / 觸控版角色卡高度，不影響 PC 版角色資訊外觀。
- CSS 快取更新至 0.9.78CH。


## V0.9.78CH - Mobile Job EXP Clearance
- 手機版角色資訊卡再增加底部高度，避免 Job EXP 條被底框遮擋。
- 保持 HP / SP / Base EXP / Job EXP 原本位置，只補外框與內容容器高度。
- CSS 快取更新至 0.9.78CH。
