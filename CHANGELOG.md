# RO_WEB 0.9.82

- Added shared CombatDamagePipeline and six registries based on RA Renewal battle flow.
- Normal attack, physical skill and magic skill now enter the same architecture.
- Unmet passive/equipment/job conditions safely continue to the next registry entry.
- Auto battle remains in compatibility mode. Skill Coverage remains 73/1139.

# RO_WEB 0.9.82

- 導入 RA Renewal 統一傷害管線。
- 普攻、物理主動技、魔法主動技、六合拳／二刀連擊被動觸發改走同一套計算。
- 支援技能固定屬性、武器屬性、半防禦與無視防禦模式。
- Coverage 維持 73 / 1139，本版不新增技能。

# 0.9.82 — Runtime Passive Batch13

- Official Runtime 70 → 73 / 1139；Pending 1069 → 1066。
- AL_DEMONBANE 天使之擊：對惡魔／不死追加 Lv × (BaseLv/20 + 3) 固定物理傷害。
- HT_BEASTBANE 動物殺手：對動物／昆蟲每級追加 4 點固定物理傷害。
- MO_DODGE 閃躲：FLEE 增加 floor(Lv × 1.5)，Lv10 +15。
- 三招皆為被動技能，不可主動施放，不消耗 SP。

# 0.9.81D1 — 六合拳被動觸發修正

- MO_TRIPLEATTACK（六合拳）由主動技能修正為被動技能。
- 普攻命中後依技能等級以 30%～21% 機率觸發。
- 傷害倍率維持 120%～300%，顯示 3 Hit。
- 不需要 SP，不可拖入快捷欄主動施放。
- RO_WEB 仍忽略後續接技前置；本次 Coverage 維持 70 / 1139。

# RO_WEB 0.9.81C - RA Runtime Integration Test

- No new skills; coverage remains 66/1139.
- Integrated manual skill HIT/CRI/perfect dodge/multi-hit/area/status/knockback.
- GroundEffectManager now runs on a 100ms runtime loop.
- Legacy auto battle retains its existing pre-hit check and calls skill runtime with skipHitCheck compatibility.
- Monster normal attacks now resolve perfect dodge.
- Added data/combat_runtime/combat_rules.json.

# RO_WEB 0.9.81C
- 新增第一至第九優先共用 Combat Mechanics Runtime；技能 Coverage 維持 66/1139。
- 命中、暴擊、防禦、狀態、位移、範圍、多段、資源、Boss、地面效果統一 Resolver。
- 忽略隱匿/接技前置；位移不做牆壁阻擋；手推車重量改為每級 ATK +1%，Lv10 +10%。

# RO_WEB 0.9.81A — RA Renewal Combat Formula Runtime

- 本版停止新增技能，Official Coverage 維持 66 / 1139。
- 新增 CombatFormulaRuntime，共用處理 RA Renewal 屬性相剋、武器體型修正、種族/體型/屬性增減傷。
- 匯入 RA Renewal 四階屬性表與 Renewal size_fix。
- 目前 10 隻怪物補上官方 race、size、element、elementLevel。
- 普攻、Runtime 物理技能、Runtime 魔法技能及怪物攻擊接入共用修正層。
- 修正怪物 Runtime ATK 加成計算後未實際用於 baseDamage 的舊問題。
- 隱匿、接技等施放前置仍依 RO_WEB 決議忽略。

# 0.9.81 Runtime Physical Batch11

- Runtime Coverage: 65 → 66 / 1139.
- Added HT_PHANTASMIC（幻影箭）Official Runtime.
- RA Renewal formula: 500% ATK, Wind element, 3-cell knockback, SP 50.
- Bow weapon family reused; no duplicate WEAPON JSON added.
- RO_WEB ammo policy retained: arrows are neither required nor consumed.
- Pending: 1074 → 1073.

# 0.9.80ZZ Runtime Physical Batch10

- Runtime Coverage: 64 → 65 / 1139.
- Added SA_ADVANCEDBOOK (進階書本修練): Book-only passive, ATK +3 per level and ASPD +ceil(level/2).
- Existing book weapon family reused; no duplicate WEAPON JSON added.
- Pending: 1075 → 1074.

## 0.9.80ZY Runtime Physical Batch9

- Official Runtime Coverage：62 → 64 / 1139。
- Pending：1077 → 1075。
- 新增 BA_MUSICALLESSON（樂器練習）：裝備樂器時 Mastery ATK 每級 +3，Lv10 +30。
- 新增 DC_DANCINGLESSON（舞蹈練習）：裝備鞭子時 Mastery ATK 每級 +3，Lv10 +30。
- 沿用既有 instrument / whip WEAPON 系列，不建立重複武器分類。
- Runtime / Formula / Handler / JSON / JS / Bundle / Cache / Regression / Weapon Family Audit 通過。

## 0.9.80ZX Runtime Physical Batch8
- Official Runtime Coverage: 61 → 62 / 1139.
- Added ASC_KATAR（進階拳刃修練）: KATAR/拳刃限定，物理傷害 +12%~20%.
- Pending: 1078 → 1077.
- Weapon family audit: existing KATAR/拳刃 reused; no duplicate WEAPON JSON created.

# 0.9.80ZX Runtime Physical Batch7

- Runtime Coverage 60 → 61 / 1139。
- 新增 259 MO_IRONHAND 鐵沙掌：空手或拳套時，每級 Mastery ATK +3。
- WEAPON 系列 fist / knuckle 已存在，本版不重複新增 JSON。
- Pending 1079 → 1078。
- 未將尚未完整支援的雙持、連擊、種族條件與表演加成技能計入 Coverage。

# 0.9.80ZV — Runtime Physical Batch6

- Runtime Coverage：57 → 60。
- 新增樂器攻擊、纏箭投擲、投擲飛鏢 Official Runtime。
- 樂器/鞭子系列已存在，不重複新增 WEAPON JSON。
- 箭矢與飛鏢一律不檢查、不扣除。
- 多段顯示與總傷害分離，避免 2 Hit 重複乘算。
- 新增 WEAPON-001 憲法規則。

# 0.9.80ZU Runtime Physical Batch 5

- Runtime Coverage: 55 → 57.
- Added Sonic Blow and Charge Arrow official Runtime profiles. Grimtooth remains pending until Hiding Runtime is executable.
- Added state requirement and shared monster knockback capability.
- Arrow consumption remains disabled by RO_WEB policy.
- Full Runtime/Formula/Handler/JSON/JS/Bundle/Cache/Regression audit passed.

# 0.9.80ZU

- Runtime 第四批：強制減價、斧頭和單手劍使用熟練度、魔力減免、瞄準之眼。
- SP 消耗正式接入被動減免；槍械射程與 HIT 接入共用被動 Runtime。

# 0.9.80ZU

- Runtime 被動／經濟／普攻第三批：低價買進、高價賣出、二刀連擊、殘影。
- 二刀連擊僅短劍生效；商店價格與分解販售價格正式接入 Runtime。

## V0.9.80ZU — Runtime 被動技能第二批與 CRI 單位修正

- 修正 PR_MACEMASTERY：RA 內部 CRI 十倍精度轉為 RO_WEB 面板單位，每級 CRI +1。
- 新增 MG_SRECOVERY：自然 SP 恢復公式正式接入玩家 5 秒恢復循環。
- 新增 AC_VULTURE：裝備弓時普攻射程每級 +1 格。
- 新增 BS_WEAPONRESEARCH：Renewal 武器傷害每級 +2。
- Runtime Profile 44 → 47；未恢復任何舊公式 fallback。
- 重建 Runtime Catalog、Pending Review、離線 Bundle 與快取。

# 0.9.80ZU

- Runtime Coverage：39 → 44。
- 啟用鶚梟之眼、鈍器使用熟練度、武器保有、拳刃修練、單槍射擊。
- 被動 Runtime 現在會檢查 weaponTypes，武器不符時不套用加成。
- 未恢復舊公式或 fallback；多人特殊技能政策維持不變。

# V0.9.80ZU Runtime Batch Handler Engine

- Added profiles for all 1139 player skills.
- Added reusable handler registry and formula templates.
- Generated profiles are pending by default; only verified profiles execute.
- Rebuilt pending-review list; no legacy fallback restored.

# 0.9.80ZU — Runtime 批次遷移目錄與待確認清單

- 新增 `data/skill_runtime/runtime_formula_catalog.json`，涵蓋全部 1139 個玩家技能。
- 新增 `data/skill_runtime/runtime_pending_review.json`，記錄 1100 個尚待公式移植或系統確認的技能。
- 既有 39 個已驗證 Runtime Profile 維持唯一可執行來源。
- 新增多人/雙人技能 `official / self_only_override / pending` 決策規則。
- 新增批次遷移稽核與政策文件；未恢復任何舊公式 fallback。

## 0.9.80ZU
- 新增十字軍 Runtime 第一批：信任、盾擊、聖十字攻擊、長矛攻擊速度增加。
- 新增盾牌/武器條件驗證與攻擊狀態命中 Runtime。
- 維持 Runtime Profile 唯一執行來源，不加入舊公式 fallback。

# V0.9.80ZU

- Skill Runtime V3：完成快速恢復、挑釁、霸體、騎乘攻擊、反擊、騎乘術、騎兵修練、衝鋒攻擊。
- 新增 RO_WEB 原生 runtimeState / mountState / monster.runtimeState。
- 坐騎圖片尚未接入；未來統一經 `setPlayerMounted()` 與 `window.onROWebMountStateChanged` 切換素材。
- 遊戲結果依 RA，實作方式依 RO_WEB；不使用 SPR/ACT。
- 舊公式 fallback 維持 0。

# V0.9.80ZU — Skill Runtime V2（劍士／騎士公式第一批）

- 新增 10 組經 RA 原始碼核對的 Runtime Profile。
- 新增單手劍、雙手劍、長矛熟練度被動 ATK。
- 新增怒爆、連刺攻擊、長矛刺擊、投擲長矛、怪物互擊公式。
- 連刺攻擊依怪物體型使用 1／2／3 Hit。
- 新增雙手劍攻速增加與單手劍攻速增加 Buff Profile。
- 未確認的反擊、騎乘、衝鋒距離分段及複雜特殊技能保持 pending。
- Runtime Profile 總數由 17 增至 27；沒有恢復任何舊公式 fallback。

## 0.9.80ZU

- 技能 Runtime 改為 Runtime Profile 唯一執行來源。
- 完全移除 `data/skills.json` 舊技能相容回退。
- 冒險者修練拆分至 `data/adventurer_training.json`。
- Core 1/Core 2 移除舊 `power`、`healPower`、`effects`、`passiveBonuses` 執行欄位。
- Buff、Heal、Attack、Passive 全部只讀 `data/skill_runtime`。
- 缺少 Runtime Profile 的技能明確顯示 pending，禁止套用舊簡化傷害。

# 0.9.80ZH Skill Data Final Audit

- 完整掃描 Core 1/Core 2、100 份技能樹、1139 張技能圖片與所有 JSON。
- Core 頂部新增 `title` 資料來源與完成狀態區。
- 確認 2284.png、5068.png 已使用使用者提供的官方圖示。
- Runtime 公式尚未完成者維持 pending，不假報完成。

# 0.9.80ZH CORE 2 Expanded Job Skill Trees

- 依 RA skill_tree.yml 建立 20 份擴充玩家職業技能樹。
- 技能樹格式與初學者至六大職業一致，只引用 Core 1 / Core 2 官方 Skill ID。
- 以專案 SkillInfoz、官方 Skill ID 與技能圖片交叉驗證。
- 怪物、傭兵、公會、NPC、GM、測試技能維持排除。
- 完成前置技能合法性、循環依賴、Core 引用與圖片完整性檢查。
- CSS、JS 與資料快取更新為 0.9.80ZH。

# 0.9.80ZH CORE 2 Expanded Skill Database

- 完成擴充玩家職業 CORE 2 技能本體資料，依官方 Skill ID 升冪排序。
- 共用 Skill ID 引用 CORE 1，不在 CORE 2 重複保存。
- 加入 CORE 2 對應官方技能圖片。
- 怪物、傭兵、公會、NPC、GM、測試、生命體與元素精靈技能維持排除。
- 本版不建立擴充職業技能樹，留待後續逐職業更新。
- CSS、JS 與資料快取更新為 0.9.80ZH。

# RO_WEB V0.9.80ZH

- Re-audited the player-skill whitelist, Skill Core IDs, job-tree references, prerequisites, JSON files and JavaScript syntax.
- Added the complete 823-player-skill icon set to `images/skills/{SkillID}.png`.
- 821 icons came from the project skill-image library; the two library gaps (2284 and 5068) were resolved by their named official skill-icon resources and converted to 24×24 PNG.
- Monster, mercenary, guild, NPC, GM and test skills remain excluded.
- Added `docs/SKILL_ICON_AUDIT_V0.9.80ZH.json`.
- Updated CSS/JS/data cache key to `0.9.80ZH`.

# 0.9.80ZH Player Skill Scope Audit

- 技能 Core 改採玩家職業技能樹白名單。
- 明確排除怪物、傭兵、公會、NPC、GM 與測試技能。
- 重建技能引用稽核；孤兒技能與前置引用為 0。
- CSS/JS/資料快取版本更新為 0.9.80ZH。

# 0.9.80ZH Skill Core V3

- Core 1 匯入初學者、超初與六大職業系至四轉的 RA 技能資料與獨立技能樹。
- 技能視覺改為 SkillID.png + SkillID.json，不再保存 SPR/ACT。
- MC_INCCARRY 改為每級最大 HP +2%，Lv10 +20%。
- 實際特殊公式以 metadata_ready_formula_pending 明確區分，避免假完成。


## V0.9.80ZH — Super Novice animation/skill-tree hotfix
- Added all `assets/characters/**/*.json` files to `js/data_bundle.js`, restoring atlas animation when opening `index.html` directly with `file://`.
- Fixed Super Novice family skill UI so it no longer uses the hard-coded Swordsman list.
- Super Novice tabs now display `超初 / 界限解放 / — / 終初`; later stages show only newly unlocked skills.
- Updated CSS/JS cache keys to `0.9.80ZH`.
# V0.9.80ZH
- 普隆德拉新增超級初學者導師。
- 開放 初學者→超初→界限解放→終初，依憲法檢查 Base/Job、基本技能與技能點清空。
- 加入超初系列完整 Skill Tree V2、前置技能與官方數字 ID 圖示。
- 未完成的戰鬥效果標記為 tree_only。

# V0.9.80Y
- 初學者系列男女動畫與超初共用資源規則。
- 初學者→超初門檻改為 Base10/Job10/基本技能Lv9/技能點清空。
- Cache Key 更新為 0.9.80Y。

## V0.9.80W - Item DB Loader / Inventory Display Fix
- 修正 V80S/T 後 item_index 改為 compact item records，舊 loader 仍把 index value 當路徑，導致物品資料 count=0、背包圖示空白。
- 新增 data/items/database_manifest.json 的 allDataPaths，Runtime 以 manifest 為 split JSON 清單。
- loadItemData 支援三種模式：manifest allDataPaths、舊 id->path index、新 id->item compact index。
- file:/// 雙擊模式會從 RO_WEB_DATA 自動補抓 data/items 與 data/equipment split JSON，不再因 fetch 被 CORS 擋而讓物品消失。
- 更新快取到 0.9.80W。


## V0.9.80W - Character Motion JSON Local Bundle Fix
- 修正 V80S 在 file:/// 雙擊開啟時，Character System V2 的 `assets/characters/.../body_hair.json` 會被瀏覽器 CORS 阻擋，導致人物 atlas 不顯示。
- 將初學者男/女所有 motion JSON 內嵌到 `js/data_bundle.js`，讓 `loadJson()` 可從 bundle 讀取，不再 fetch 本機 JSON。
- 不更動人物座標、倍率、城鎮/世界顯示規則。
- CSS/JS cache key 更新為 0.9.80W。

# V0.9.80R WeaponType Constitution / Equipment Data Update

- 將 weaponType 規則寫入 RO_WEB_CONSTITUTION.json 與 AI_START_HERE.md。
- 為現有 `data/equipment/weapon/*.json` 可裝備武器補上 `weaponType` 欄位。
- 新增 `data/weapon_motion_schema.json`，記錄普通攻擊動畫解析規則。
- 更新 `data/weapon_types.json`，補齊 canonical weaponType 與射程預設。
- 更新 data_bundle 與 cache key 到 0.9.80R。



## V0.9.80Q - Character System V2 Migration

- 正式遷移初學者男/女到 `assets/characters/novice/{male|female}/`。
- 新增每性別 `motions.json`，動畫改由 `currentJob + gender + weaponType` 解析。
- 城鎮與角色面板 idle 圖改由 `assets/characters/{job}/{gender}/idle.png` 解析，F5 不再寫死初學者或舊騎士圖。
- 舊 `images/player/male/*`、`images/player/novice_male/*`、`images/player/world/*` 退休，不再作為角色 fallback。
- 保留既有 PC/手機 Profile、城鎮、世界地圖位置與倍率規則；南門舊測試地圖不再作為主要維護目標。
# Changelog

## V0.9.80Q - Mobile Profile Idle Y Fine Tune
- 只調整手機版角色資訊欄 idle 單圖：往上 15px。
- 電腦版角色資訊、城鎮展示、世界地圖、南門/一般野外 atlas 尺寸不動。
- CSS/JS cache key 更新到 0.9.80Q。



## V0.9.80M - Mobile World Atlas Sharpness / Portrait Y Fix
- 修正手機世界地圖人物模糊：V80K 的 DPR canvas backing store 會在手機世界圖被 CSS 二次縮放，改為手機使用 CSS 尺寸 backing store + imageSmoothing=false。
- 保留 Town → World 後 atlas 重新啟用修正。
- 手機左上角色資訊 idle 單圖再往下微調。
- CSS/JS cache key 更新到 0.9.80M。
# RO_WEB V0.9.80J - Atlas/Town Visibility Fix

- 比對 V80D / V80G / V80H / V80I 後，修正 atlas 與舊 playerImage / town idle 單圖的顯示條件。
- 非城鎮（南門、世界地圖）固定只顯示新版 RO Studio atlas canvas，避免舊騎士/舊展示圖被拉爆。
- 城鎮固定只顯示使用者提供的 256x256 idle 單圖。
- 修正 player.currentCity 殘留導致南門/世界圖誤判為 town、atlas 被關閉。
- 左上角色資訊圖位置下移 10~15px 微調。
- CSS/JS cache key 更新到 0.9.80J。

## V0.9.80C - Anchor140 Idle Test
- Updated novice male idle atlas JSON anchor to X=128 / Y=140.
- Synced RO_WEB data_bundle for local/offline launch.
- Kept walk/attack/hurt/dead/cast runtime unchanged for anchor-only verification.


## V0.9.80C - RO Studio Anchor Idle Test
- 套用 V64 匯出的 novice male idle body_hair.png/json。
- 站立素材 anchor = 128,150，用於 RO_WEB 腳底座標測試。
- 更新 data_bundle，確保本機直接開啟也能讀到新 JSON。


## V0.9.79E - Save Reset + Debug Cross Restore

- 修復「清存檔」後舊角色 Lv.99 仍殘留的問題：清除期間禁止自動存檔，並清空本網域 localStorage/sessionStorage/cache。
- 修復綠十字座標被舊 CSS 規則強制隱藏的問題。
- 方向修正沿用 V0.9.79C。



## RO_WEB V0.9.79E - RO Studio Atlas Runtime Direction Fix
- 修正 RO Studio V59 Atlas 左右方向反向問題：左右與斜向攻擊/移動同步修正。
- Idle 站立改為固定第 1 偵，避免村莊待機時一直擺頭。
- Walk 播放速度微調為 140ms/幀。
- 清存檔改為清除 RO_WEB localStorage、sessionStorage，並嘗試清除 Cache Storage 後帶 cache-bust 重新載入。
- 恢復綠十字座標對位功能，文字 debug overlay 仍保持關閉。

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


## V0.9.79B
- 修正 RO Studio Atlas Runtime 在 file:// / 無痕 / IE 模式下新 JSON 無法 fetch 時的載入問題：把角色 manifest 與 motion JSON 打入 data_bundle。
- 修正 Atlas 載入失敗時舊版角色圖被隱藏導致玩家完全不顯示。


## V0.9.79F - Reference Point / Attack Lock Debug
- RO Studio Atlas 玩家錨點改讀 JSON anchor（舊資料預設 128,220）。
- 綠十字旁加入世界座標與 ref anchor 顯示，方便對照 Anchor Preview。
- 普攻動畫鎖定完整播放，傷害或 Miss 觸發時不再被 idle/hurt 立即蓋掉。
- CSS/JS cache key 更新至 0.9.79F。


## V0.9.80C Anchor140 All Motions Update
- 初學者 male atlas 全動作素材改為 Anchor X=128 / Y=140。
- 更新 idle / walk / hurt / dead / cast / attack(fist)。
- 預留 dagger / sword / axe / mace / staff 攻擊素材路徑。


## V0.9.80D Anchor140 Weapon Motions + World 5x
- 世界大地圖角色顯示倍率暫測 5x：playerWorldHeight 64→320、Width 30→150。
- 初學者武器攻擊圖檔與 JSON 保留並啟用：fist / dagger / sword / axe / mace / staff。
- 急救播放初學者施法動作 cast。
- 裝死技能自 novice 技能清單移除，暫不使用。
- 角色面板頭像改用使用者提供的初學者站立圖。

## V0.9.80E - World Player Width Fix + Portrait Cache Fix

- 大地圖角色高度維持 5x 測試：320px。
- 大地圖角色寬度由 150px 放寬到 240px，修正「高度剛好但身體太窄」問題。
- 角色資訊面板頭像改為新版初學者站立圖，移除舊圖裁切/放大疊層效果。
- index.html 全部 CSS/JS cache key 更新為 `0.9.80E`。


## V0.9.80I - Town Mode Static Player / Legacy Sprite Conflict Fix
- 城鎮模式：玩家固定於舊右側展示位置，不吃存檔座標，不接受移動。
- 城鎮角色改用使用者提供的 256x256 idle 單圖；角色資訊圖同步使用同一張。
- 手機板城鎮角色 x2；PC 城鎮維持舊展示大小。
- 世界地圖 PC 版角色寬度在目前數值上 x1.5；手機世界地圖維持 0.9.80D/E 比例。
- CSS/JS 快取更新至 0.9.80I。


## V0.9.80I - Legacy Sprite Conflict Fix
- 左上角色資訊圖使用 256x256 idle 單圖並放大 2.5 倍。
- 回退 V80F 的 PC 世界地圖寬度 x1.5，避免舊圖層被拉爆。
- 世界地圖只顯示 RO Studio atlas canvas，強制隱藏舊 playerImage，避免劍士/騎士舊圖相衝。
- 城鎮模式只顯示單張 idle 圖，隱藏 atlas canvas，避免新舊圖層重疊。
- 舊 male/idle、attack、dead、run、test_sheet fallback 圖先以初學者 idle 單圖覆蓋，避免劍士/騎士舊圖被誤抓。
- CSS/JS cache key 更新至 0.9.80I。


## V0.9.80I - Town Static / South Gate Duplicate Fix
- 修正南門同時顯示 playerImage 與 RO Studio atlas canvas 的雙人物重疊。
- 非城鎮地圖強制只顯示 RO Studio atlas canvas。
- 城鎮地圖強制只顯示使用者提供的 idle 單圖。
- 角色資訊圖維持 2.5 倍並往下 50px。
- 城鎮展示人物往右 50px。
- CSS/JS 快取更新到 0.9.80I。


## V0.9.80I - Atlas Visibility Recovery / Town Fine Tune
- 修復 V80H 非城鎮地圖人物消失：atlasActive=true 才隱藏 legacy playerImage，atlas 未就緒時保留 fallback。
- 世界地圖 / 南門外恢復新版 RO Studio atlas 顯示。
- 城鎮 PC 靜態人物在 V80H 基礎上放大 1.5 倍並右移 50px。
- 角色資訊圖位置沿用 V80H，大小在 V80H 基礎上 ×1.2。
- CSS/JS cache key 更新為 0.9.80I。


## V0.9.80M - SouthGate/World Atlas Scale Regression Fix
- 修正 V80L 將所有非城鎮地圖都套用 world-player 尺寸，導致南門/一般野外人物變小或尺寸錯亂。
- 非城鎮一般地圖（南門）恢復標準 atlas 尺寸：220x220 / top 16px。
- 世界地圖仍使用 world-camera 專用尺寸，不再影響南門。
- 手機角色資訊單圖往上 30px。
- CSS/JS cache key 更新為 0.9.80M。


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


## V0.9.80W - Item DB V2 Canonical Field Audit
- 全面檢查現有 items/equipment 細分 JSON。
- 新增官方格式 canonical 欄位：Id/AegisName/Name/Type/SubType/Buy/Attack/MagicAttack/Defense/Range/Slots/Jobs/Classes/Locations/WeaponLevel/ArmorLevel/EquipLevelMin/Refineable/Gradable/View/Script。
- Runtime 由 normalizeItemRecord 統一產生舊欄位相容別名，不再讓各模組自行猜欄位。
- 移除 Weight、Gender、未鑑定相關資料。
- 價格統一：官方 Sell 優先，否則 floor(Buy/2)；Buy 缺少時預設 20。
- 新增 data/item_db_v2_audit.json 驗收報告。

## V0.9.80X - Equipment Job/Class Enforcement
- 裝備前正式執行 RA DB_RE `Jobs`、`Classes`、`EquipLevelMin`。
- 初學者無法再裝備弓等未允許裝備。
- 新增 `data/equipment_job_map.json`，統一 RO_WEB 職業 ID 與 RA Jobs/Classes Key 對照。
- 裝備限制失敗時不扣背包、不替換原裝備，並顯示原因。


## 0.9.80ZU
- Skill Runtime V1 data-driven profiles.
- RA SpCost/HitCount normalization.
- First-job verified formulas and custom MC_INCCARRY HP rule.


## 0.9.81D Runtime Physical Batch12
- Official Runtime 66 → 70 / 1139.
- Added AS_GRIMTOOTH, MO_TRIPLEATTACK, MO_CHAINCOMBO, MO_COMBOFINISH.
- Hiding/combo/spirit-sphere activation prerequisites ignored per RO_WEB policy.
