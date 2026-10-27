# 母片與原生樣式

母片頁只提供頂部的 24 頁主下載，固定母片字型、原紅色內容與 R2 balanced-v2 主題效果，不跟隨網站風格。

- **下載 24 頁母片**：單欄07／06／03／10／04、兩頁矩形及八色文字高亮；第 9–24 頁按深藍、青綠、墨綠、框架四風格分組，每組依序 00 總覽、Cards、A16、A18。封面與雙欄示範只從衍生下載移除，來源原件不變。
- 副素材按鈕、折疊說明、編號目錄與技術配色列表已移除；內部三頁 `exportMaterials` helper 保留相容性。

原「範本 Style Kit」與「快速樣式」入口均導向母片頁。舊模組、靜態資產與偏好保留相容性；舊 common／theme 或 Kit 跟隨設定不能覆寫五個選定主題。五個單欄各有獨立具名 layout／master／theme；07 為首選，矩形素材也用 07；後十六頁保留各自 PRESETS。具體六色值見 `fixed-master/download-manifest.json`。

## 原生主題與素材的差異

先在來源共同主題鏈套用 07 的 R2 profile，再逐一建立五個單欄的獨立主題鏈；不以單一 profile 廣播洗掉各母片配色。不同有效 master 色盤的封裝會被通用單 profile API 在寫入前拒絕。Text1 保留深色，白色另選。保留字型、文字／背景色槽、背景樣式與 notes 主題；若 notes 共用待改主題，寫入前停止。

R2 保留指定試色檔的 tint／shade 順序、線條與陰影。Office 內建樣式共享填色槽，部分線框樣式呈灰底；精確白底外卡請用素材。素材保有十款外觀；前兩列各只保留 Text1 中性白卡，六 Accent 改為淡主色同色框與主色白字柔影，其他列不變。它們不是十個新 Ribbon 按鈕，也不改變任意形狀的幾何。

原生高亮八色為 F6D8DB、F9F0D4、7C9CC3、D4E6DF、E0E2E6、E5DDF1、595959、1F3864，使用 a:highlight，沒有獨立底帶。五個單欄與素材共用一組近期色記錄。深灰／深藍的素材文字以白字展示，套用高亮不會自動改使用者字色。近期色顯示、順序與保留時間由 Office 決定，不替換內建 15 色。

原始四頁來源 bytes 不變；衍生主檔保留原 master、7 layouts、media 與仍使用的 notes，另建五個單欄 master／layout／theme，不能宣稱全部 theme bytes 不變。五個單欄各留下原 24／18／14 pt 的三級示例及紅標題，右側加入六 Accent × 六效果共 36 個原生 theme-reference 樣式。沒有底部示例文字框；36 形狀不直接覆寫 fill／line／effect，不是圖片或新增 Ribbon 按鈕。原標誌、公司資訊與頁尾依確認保留，按鈕和下載檔名採中性名稱。

## 元件素材契約

第 9–24 頁只取既有 Deck renderer 的原生物件，使用原母片 layout6，不引入 Deck master、theme、notes 或整頁圖片。每個風格含 catalog、cards、schemebody、schemeiconbody；總覽保留同風格中存在的頁面連結。Cards 保留 9 群組，A16／A18 各保留 28 群組，內文 9 pt、A16 標籤 8.5 pt，是可複製放大的密集素材，不承諾投影正文可讀性。resolved RGB 來自各自 PRESETS，不保證 PowerPoint 日後換主題自動變色。

## 建置與檢查

先執行 `tools/stamp_version.py`，再以 `tools/build_single.py` 同步單檔。`tools/build_master_previews.js` 內嵌最終 24 頁的 PowerPoint 960×540 PNG 原 bytes，記錄來源與圖片 SHA-256，沒有近似重畫。

本輪只執行針對性檢查：`master_sections_test.js` 驗24頁、6小節、180個原生參照、12個指定素材改色與保護parts；`table_merge_model_test.js` 8組及正常／單檔 `table_merge_ui_test.js` 各6組；`export_status_ui_test.js` 驗1366／360 DOM中正常文流、真關閉與後續匯出、資料結構搬到外觀頂部。沒有跑整站 aggregate，部分歷史大測仍保留舊26頁契約，未宣稱全套通過。

六個真正 PowerPoint 小節按 5／3／4／4／4／4 頁分組；當下可收折，但實測另存重開恢復展開，不保證跨機保存、不加巨集。資料結構移至外觀頂部；合併／拆分保存原始逐格值，重疊貼上或可能丟失合併文字的結構刪除會先拒絕。TSV 只輸出原逐格值，合併結構和已改顯示文字需用設定 JSON／PPTX 保留。

提供的 PowerPoint 證據含24頁轉圖、180樣式索引回讀及一個樣本改字另存重開，另有合併格fixture改字／保存重開。最終標籤改字只重畫第6頁，其餘23張保留前一候選圖與來源證據；metadata 明示。這不等於可見repair提示、Ribbon／MRU UI、真Excel剪貼簿或Android驗收。字型未內嵌；POTX新建仍未驗。標準Blob產生成功不等於瀏覽器落盤。
