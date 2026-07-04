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
- 商店清單固定約 5 格顯示高度，超出部分使用捲軸。
- 移除座標測試 overlay / debug 十字。
- CSS 快取更新為 0.9.78CC。

RO_WEB V0.9.78BO

RO_WEB V0.9.78W - mobile world camera actual background layer fix.


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


### V0.9.78AL
Inventory Polish：背包 grid 外加淡金內框，Footer 按鈕置中下移。


### V0.9.78AN
Inventory Polish Fine Tune + Skill Slot Border Purge：背包內框與 Footer 微調；技能 40 格移除雙層框殘留。


V0.9.78AN：Inventory / Skill Frame Separation Cleanup。純 CSS 修正，不更動 JS / 資料 / 圖片。


### V0.9.78AP
Inventory micro-position hotfix: Tabs -5px, Footer +8px, CSS cache key refreshed to 0.9.78AP.


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


### V0.9.78BA
商店 scroll frame 底部加高，修正滾到底時右下下箭頭顯示空間不足；CSS cache key 已更新。


## V0.9.78BB - Shop Layout Refactor
- 修正 78BA 商店 scroll frame 撐爆底層外框問題。
- 改為固定 shop-window / shop-window-body / shop-list 層級高度，讓商品清單只在內層滾動。
- 保留 scrollbar 下箭頭顯示空間，但收斂 padding / margin 避免外溢。
- CSS cache key 更新為 v=0.9.78BB。


### V0.9.78BC
Equipment Framework v1: equipment grid centering and mobile balance polish.

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


### V0.9.78BF
Legacy bottom UI CSS remnants were removed. Inventory, skill, shop and equipment framework behavior is unchanged.


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

## V0.9.78BZ
- Inventory: based on BV, buttons down +15px and inner grid frame height +5px.
- CSS cache: 0.9.78BZ.

## V0.9.78BV
- Inventory 5x4 compact hotfix.
- Hide inventory grid native scrollbar and refresh CSS cache to v=0.9.78BU.


## V0.9.78CB
- 以 BZ 為基準修正背包內框，不沿用 CA 的過度高度修正。
- 內框視覺底線只往下延伸 5px。
- 恢復右側捲軸槽與 overflow-y，避免捲軸被內框覆蓋。
- CSS 快取更新為 0.9.78CB。


### V0.9.78CH
- 手機版角色資訊 Base EXP / Job EXP 條恢復完整顯示。
- CSS 快取：0.9.78CH。
