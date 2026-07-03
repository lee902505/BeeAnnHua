## V0.9.75b

快取版本與歡迎訊息版本號更新為 0.9.75b；本版不更動 Position Engine。

## V0.9.75a Mobile UI Fit / Shop Detail / Inventory Double Tap

- 手機版彈窗改為優先吃滿可視寬高，修正小螢幕技能欄與地圖/商店彈窗裁切問題。
- 手機商店商品區與物品介紹/購買區重新分配高度，商品資訊、數量與確認購買按鈕在小螢幕更容易操作。
- 背包裝備類物品改為：單點只看介紹，雙點才穿戴；避免點一下就直接穿上。
- 本版只調整 UI / 背包互動，不修改 Position Engine / Camera / Touch / Sprite Pivot。

## V0.9.75

- Android 底部快捷欄 / 戰鬥紀錄上移 28px safe-area 微調。
- Position Engine 保持 V0.9.73 穩定版，不變更。

## V0.9.75

- Mobile Position Debug / Sprite Scale Sync。
- 修正手機點一次移動出現兩筆座標 log。
- 手機角色顯示座標改用實際縮放尺寸，方便測試右 / 下透明牆問題。

## V0.9.69 Job Route Constitution

- Job Constitution 升級為 v2.0。
- 一般職業與擴充職業分流：一般職業必須轉生後才能三轉；擴充職業依 RA 開機檔逐條定義。
- 擴充職業條件已整理：超級初學者、忍者、神槍手、跆拳系、喵族與其上位職。
- 已排除 RA 內一般職業未轉生直接三轉入口。
- 新增 `docs/RA_JOB_ROUTE_AUDIT_V0.9.69.md`。

## V0.9.66a Job Engine Constitution

- 正式建立 Job Constitution：所有冒險者轉職前必須通過共同檢查。
- 新增職業不得修改核心轉職程式，只允許新增 JSON。
- 技能點必須全部點完、手推車/獵鷹等特殊系統必須卸除後才可轉職。


## V0.9.53 - Log System V2
- 戰鬥 Log 保留最近 100 行。
- 右側黑金風格滾輪。
- 玩家往上查看舊訊息時暫停自動下捲。
- 回到底部後恢復自動追蹤最新訊息。
- 新訊息提示按鈕。

RO_WEB Alpha V0.9.52


## V0.9.65ca Classic Remaster Alpha
- 技能前置紅金箭頭改指向前置技能。
- 劍士一轉技能 ICON Remaster Prototype。
- Mobile Battle Layout V2 微調人物、怪物、金幣列與 Battle Log。

## V0.9.65ca
Skill Icon Remaster Trial：初心者與劍士一轉技能 ICON 試作版。


## V0.9.65ca
- Skill Tree Complete + Mobile Battle Layout v3 + UI Drag Bug Fix.

- v0.9.65ca：技能 placeholder.webp 已退休；技能圖應以官方 Skill ID 圖片路徑對應，缺圖時應由報告處理，不使用保底圖混淆。

## V0.9.66a Job Constitution 補強

- 技能點必須點完規則適用所有階段：一般轉職、轉生後轉職、未來 3/4 轉。
- 轉生後素質點固定為 125，不繼承轉生前剩餘素質點。
- 3轉/4轉仍標記待確認，不硬寫死。


## V0.9.71

新增 Position Combat Prototype：平面地圖座標、近戰/遠攻射程、怪物追擊、蒼蠅翅膀瞬移與自動找不到怪物瞬移設定。


## V0.9.75

- iPhone Safari visualViewport 觸控座標修正：下方點擊改以可視戰鬥區換算，減少人物走不到底或反向修正。
- 手機 touch 事件去重：避免同一次觸控被 pointerdown / touchstart / click 重複下達座標。

手機直式可行走區、商店滾動與金幣列完整數量顯示修正。


## V0.9.72f

Full Map Walk + UI Fade：Position 座標改以腳底中心 / 1 Cell 為基準，玩家與怪物可在整張背景圖範圍內移動與出生；UI 不再硬擋路，角色進入 UI 覆蓋區時 UI 透明度降至 0.3。


## V0.9.75

Mobile Position Engine Stable Release：

- 移除手機測試用 Debug 視窗。
- Windows / iPhone Safari / Android 四角可到達驗證完成。
- 存檔與清存檔按鈕加入 UI 透明判定。
- 手機底部 Safe Area 修正，降低快捷欄被系統手勢列裁切。
- Position Engine 已列入 AI_START_HERE 穩定核心規則。
