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
<link rel="stylesheet" href="css/style.css?v=0.9.56">
<script src="./js/game.js?v=0.9.56"></script>
```

避免瀏覽器讀取舊快取，造成 UI 位置、CSS、JS 看似沒有更新。
