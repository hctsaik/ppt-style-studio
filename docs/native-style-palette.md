# 舊 Kit 原生配色與文字醒目提示（相容性契約）

獨立 Kit 頁籤已撤除，舊模組及靜態資產保留相容性；本文件描述其封裝，不是目前母片頁的產品出口。現行雙三頁下載及實際母片主題 profile 見 [母片整合契約](master-style-integration.md)。

Style Kit 的「主題色／常用色」決定下載檔案的一組 theme，不會增加第二套 PowerPoint Quick Styles 選單。13 組範本、兩種配色皆提供十款可編輯矩形，分為兩頁、每頁 5 列 × 7 欄，前三款是外層白卡。Ribbon 固定組合、字色及排列不保證與示範逐格相同。

## 常用形狀色與十款矩形

Accent 1–6 依序為紅 D95D68、黃 E7BF4A、藍 4E83CE、綠 4B9679、灰 7D8795、紫 9371C6。白色另提供 FFFFFF，不取代 Text1。這是裝飾色，不代表成功／警告語義。

| 順序 | 矩形外觀 |
|---|---|
| 1 | 白底、明確深灰框、柔影 |
| 2 | 白底、淡灰細框、柔影 |
| 3 | 白底、主題框、深字、柔影 |
| 4 | 白底、細灰框、無影 |
| 5 | 淺主色底、無框、無影 |
| 6 | 淺灰底、無框、無影 |
| 7 | 白底、主色粗框、無影 |
| 8 | 深底白字、柔影 |
| 9 | 深底白字、粗白框、柔影 |
| 10 | 主色白字、無影 |

每格是一個原生 roundRect，小圓角 7.2pt，無點陣圖或額外文字框。灰框、灰底與中性字色有固定角色，不是未跟隨主題；不包含來源參考中的膠囊、圓形、標題、箭頭或分隔線。

native-styles.js 是網頁與產生器共用描述。Kit 專用 API 寫入三個 fill、三個 line、兩個柔影及空 effect；無法在矩陣槽表達的外框由形狀直接設定。這不會註冊十個 Ribbon 按鈕，也不控制任意新形狀幾何。一般 applyToZip 與固定母片 fmtScheme 不變。

白字矩形必要時暗化填色引用，以維持至少 4.5:1 對比，Accent 色槽不變。DrawingML tint／shade 使用線性 RGB；此調整只適用矩形，不修改指定螢光筆 RGB，也不自動改使用者文字色。

## 八色原生螢光筆

| 色名 | RGB |
|---|---|
| 淡紅 | F6D8DB |
| 淡黃 | F9F0D4 |
| 參考藍 | 7C9CC3 |
| 淡綠 | D4E6DF |
| 淺灰 | E0E2E6 |
| 淡紫 | E5DDF1 |
| 深灰 | 595959 |
| 深藍 | 1F3864 |

參考藍取代原淡藍，移除白色高亮，保留淺灰並新增深灰與深藍，合計八色。形狀白框、白底、白字不受影響。深灰／深藍可搭配白字，但高亮只改 a:highlight，文字顏色由使用者設定。

八色獨立於 theme/common Accent，隨文字編輯延伸。沒有全字或半高 shape 底帶。舊母片 marker／underline 遷移成原生高亮；舊白色標記移轉為無高亮，卡片與文字保留。

八色也寫入 p:clrMru，但不保證各版高亮選單顯示、排序或永久保留，不能替換內建 15 色。可複製已套色文字再編輯。格式刷尚未經 Ribbon 操作驗證，且可能連帶字型與字級。

## 固定母片與保存

主下載仍是封面、單欄、雙欄三頁，封面不加獨立筆帶。原來源 bytes、master、七個 layouts、media、字型、固定紅色與原 fmtScheme 保留。網站說明／按鈕／下載名稱中性化；原母片與預覽公司標誌、頁尾依使用者最新確認保留。來源只改名為 Fixed_Red_Template.pptx，不改 bytes 或 Git 歷史。

常用配色只改六個 Accent，主題配色保留原 theme，兩種都含八色 MRU。示範另選「母片 3＋示範 1 頁」下載，不塞進主三頁。卡片 color 與文字 highlightColor 分開保存。

Style Kit 配色來源與跟隨／獨立範本分開保存；既有 theme 意圖保留。自訂主題無對應資產時停用主題版下載。設定改變後舊連結失效，匯出使用點擊時快照。

## 重建與驗證

1. npm run build:native-styles
2. python3 tools/build_fixed_master_assets.py
3. python3 tools/stamp_version.py
4. python3 tools/build_single.py
5. npm run test:native-styles
6. node tools/brand_boundary_test.js

產生器以 stylekit/ 為唯讀種子，固定 ZIP 時間與排序；--check 驗逐 byte 一致。離線版保留 39 份舊資產、內嵌 78 份新資產。XML 只含色彩集。

測試分開檢查角色／對比、封裝、正常／離線 UI 狀態。PowerPoint 開檔轉圖與編輯保存重開另行記錄；XML／DOM／COM 成功不能冒稱 Ribbon、新形狀套用或 MRU 選色操作已通過。實際瀏覽器與 Android 版面仍需裝置驗收。
