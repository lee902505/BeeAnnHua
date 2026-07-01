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
<link rel="stylesheet" href="css/style.css?v=0.9.60">
<script src="./js/game.js?v=0.9.60"></script>
```

避免瀏覽器讀取舊快取，造成 UI 位置、CSS、JS 看似沒有更新。


## V0.9.60 Auto UI Scale 規則

- `:root` 必須保留 `--ui-scale` 作為 UI 總縮放閥門。
- 新增 UI 視窗、彈窗、快捷按鈕、操作列時，必須納入共用縮放架構。
- 背景戰鬥畫布與左上角人物資訊為主畫面核心，不吃 `--ui-scale`。
- 依解析度可用 CSS media query 自動調整 `--ui-scale`。
- 手機版目標是 Mobile Playable Mode：能玩、能點、彈窗不爆版，不要求完整 RWD。
- 音效 / sound / audio 架構暫時不預留。
