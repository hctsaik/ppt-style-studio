# 母片與原生樣式

母片頁只提供頂部的 26 頁主下載，固定母片字型、原紅色內容與 R2 balanced-v2 主題效果，不跟隨網站風格。

- **下載 26 頁母片**：前十頁是封面、單欄07／06／03／10／04、雙欄、兩頁矩形及八色文字高亮；第 11–26 頁按深藍、青綠、墨綠、框架四風格分組，每組依序 00 總覽、Cards、A16、A18。
- 副素材按鈕、折疊說明、編號目錄與技術配色列表已移除；內部三頁 `exportMaterials` helper 保留相容性。

原「範本 Style Kit」與「快速樣式」入口均導向母片頁。舊模組、靜態資產與偏好保留相容性；舊 common／theme 或 Kit 跟隨設定不能覆寫五個選定主題。五個單欄各有獨立具名 layout／master／theme；07 為首選，封面、雙欄與前十頁矩形素材也用 07；後十六頁保留各自 PRESETS。具體六色值見 `fixed-master/download-manifest.json`。

## 原生主題與素材的差異

先在來源共同主題鏈套用 07 的 R2 profile，再逐一建立五個單欄的獨立主題鏈；不以單一 profile 廣播洗掉各母片配色。不同有效 master 色盤的封裝會被通用單 profile API 在寫入前拒絕。Text1 保留深色，白色另選。保留字型、文字／背景色槽、背景樣式與 notes 主題；若 notes 共用待改主題，寫入前停止。

R2 保留指定試色檔的 tint／shade 順序、線條與陰影。Office 內建樣式共享填色槽，部分線框樣式呈灰底；精確白底外卡請用素材。素材保有十款外觀，前三款是深灰框、細灰框與主色框的外層白卡。它們不是十個新 Ribbon 按鈕，也不改變任意形狀的幾何。

原生高亮八色為 F6D8DB、F9F0D4、7C9CC3、D4E6DF、E0E2E6、E5DDF1、595959、1F3864，使用 a:highlight，沒有獨立底帶。五個單欄與素材共用一組近期色記錄。深灰／深藍的素材文字以白字展示，套用高亮不會自動改使用者字色。近期色顯示、順序與保留時間由 Office 決定，不替換內建 15 色。

原始四頁來源 bytes 不變；衍生主檔保留原 master、7 layouts、media、notes，另建五個單欄 master／layout／theme，不能宣稱全部 theme bytes 不變。原單欄內容複製五次，只改為簡短顯示名、增加「重點文字」高亮與頁碼；原雙欄頁碼更新為 7。原標誌、公司資訊與頁尾依確認保留，按鈕和下載檔名採中性名稱。

## 元件素材契約

第 11–26 頁只取既有 Deck renderer 的原生物件，使用原母片 layout6，不引入 Deck master、theme、notes 或整頁圖片。每個風格含 catalog、cards、schemebody、schemeiconbody；總覽保留同風格中存在的頁面連結。Cards 保留 9 群組，A16／A18 各保留 28 群組，內文 9 pt、A16 標籤 8.5 pt，是可複製放大的密集素材，不承諾投影正文可讀性。resolved RGB 來自各自 PRESETS，不保證 PowerPoint 日後換主題自動變色。

## 建置與檢查

先執行 `tools/stamp_version.py`，再以 `tools/build_single.py` 同步單檔。`tools/build_master_previews.js` 內嵌最終 26 頁的 PowerPoint 960×540 PNG 原 bytes，記錄來源與圖片 SHA-256，沒有近似重畫。

`test:master-selected` 局部驗頁序、五款保護、16 頁 PRESETS／原生群組／連結；`test:table-header-paint` 只用一份 3×3 資料驗首列、首欄、交角及手動強調優先。來源／離線母片 UI 合約同步，不把本輪局部檢查稱為整站回歸。

本輪提供 PowerPoint 26 頁及三份表頭小範例轉圖，沒有新 ShapeStyle 大矩陣或編輯／保存重開測試。先前 API／重開證據不等於 Ribbon 或 MRU UI 驗收。字型未內嵌；Android、POTX 新建與 Ribbon/MRU 未驗。標準 Blob 產生成功不等於瀏覽器落盤。
