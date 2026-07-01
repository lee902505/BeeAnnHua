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


## Cache Busting / 快取版本號

每次更新 CSS / JS / HTML 後，必須同步更新 `index.html` 內所有資源引用版本號，例如：

```html
<link rel="stylesheet" href="css/style.css?v=0.9.64">
<script src="./js/game.js?v=0.9.64"></script>
```

避免瀏覽器讀取舊快取，造成 UI 位置、CSS、JS 看似沒有更新。


## V0.9.64 Auto UI Scale 規則

- `:root` 必須保留 `--ui-scale` 作為 UI 總縮放閥門。
- 新增 UI 視窗、彈窗、快捷按鈕、操作列時，必須納入共用縮放架構。
- 背景戰鬥畫布與左上角人物資訊為主畫面核心，不吃 `--ui-scale`。
- 依解析度可用 CSS media query 自動調整 `--ui-scale`。
- 手機版目標是 Mobile Playable Mode：能玩、能點、彈窗不爆版，不要求完整 RWD。
- 音效 / sound / audio 架構暫時不預留。


## V0.9.64 Skill Icon Remaster Trial 規則
- 本版為技能圖示試作版，不一次重做所有技能。
- 初心者 / 劍士一轉技能 ICON 可使用黑金發光 RO Remaster 試作風格。
- 技能狀態 Normal / Learned / Can Learn / Locked 優先由 CSS 控制，不要為每個狀態複製大量圖片。
- 新增技能 ICON 不得破壞前置技能發光、高亮、鎖定、可學習邏輯。
- 若後續導入 RO Studio Skill Builder，官方 skill id 仍為唯一主鍵，分類與文字不可覆蓋 id。


## V0.9.64 工作筆記
- 技能樹前置路徑採 Hover 顯示紅金線，目標是提升可讀性，不改技能數值邏輯。
- 技能 ICON 美術仍為 Trial，不得直接寫入正式憲法。
- Mobile Battle Fix 只應在小螢幕 media query 啟用，不可影響 PC 版 1280×720 主規格。
- 每次更新 CSS / JS / HTML 後必須同步更新 `?v=` 快取版本號。


## V0.9.64 工作筆記
- Skill Icon Remaster 仍屬 Prototype，不可直接寫入憲法。
- 目前試作範圍：劍士一轉技能 ICON（images/skills/2~8、144~146）。
- 技能前置路徑 Hover 時，箭頭方向必須指向「前置技能」，用來提示玩家先點哪一招。
- Mobile Battle Layout V2 僅在 max-width: 900px 啟用，不得影響 PC 版 1280x720 觀感。
- 手機戰鬥位置後續優先用 CSS 變數 `--battle-offset-x` / `--battle-offset-y` 微調，不要直接散落寫死座標。

## V0.9.64 工作筆記
- Skill Tree Complete：初心者與劍士一轉技能必須保留技能點數、Hover、介紹、前置判斷與待確認配點流程。
- Skill Path V2：Hover 有前置的技能時，紅金路徑必須由目前技能一路回指所有前置技能；不只顯示直接前置。
- Mobile Battle Layout v3：手機版以戰鬥重心置中為主，人物、怪物、Top UI、金幣列與下方快捷列不得跑出可視範圍；PC 版不得受影響。
- UI Drag Fix：所有 draggable-window 在 --ui-scale / CSS zoom 下，拖曳第一下不得跳向左上角。
- 商店彈窗：保持固定高度與內部 scrollbar，Padding / 底部留白需維持緊湊。
- 本版只做程式、CSS、JSON 與文件更新；不要新增生圖。
