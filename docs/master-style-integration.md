# 母片與原生樣式

母片頁提供兩個獨立下載，固定母片字型、原紅色內容與 R2 balanced-v2 主題效果，不跟隨網站風格。

- **下載十三頁母片**：封面；單欄 07／06／03／10／04；雙欄；矩形樣式 1/2、2/2；八色文字螢光筆；Cards & Panels；A16 內文＋強調；A18 Icon＋內文＋強調。
- **下載卡片與文字素材**：兩頁共 70 個原生可編輯矩形，以及一頁八色文字醒目提示。這三頁對應主檔第 8–10 頁，副下載仍恰好三頁。

原「範本 Style Kit」與「快速樣式」入口均導向母片頁。舊模組、靜態資產與偏好保留相容性；舊 common／theme 或 Kit 跟隨設定不能覆寫五個選定主題。五個單欄各有獨立具名 layout／master／theme；07 為首選，封面、雙欄與素材也用 07。具體六色值見 `fixed-master/download-manifest.json`。

## 原生主題與素材的差異

先在來源共同主題鏈套用 07 的 R2 profile，再逐一建立五個單欄的獨立主題鏈；不以單一 profile 廣播洗掉各母片配色。不同有效 master 色盤的封裝會被通用單 profile API 在寫入前拒絕。Text1 保留深色，白色另選。保留字型、文字／背景色槽、背景樣式與 notes 主題；若 notes 共用待改主題，寫入前停止。

R2 保留指定試色檔的 tint／shade 順序、線條與陰影。Office 內建樣式共享填色槽，部分線框樣式呈灰底；精確白底外卡請用素材。素材保有十款外觀，前三款是深灰框、細灰框與主色框的外層白卡。它們不是十個新 Ribbon 按鈕，也不改變任意形狀的幾何。

原生高亮八色為 F6D8DB、F9F0D4、7C9CC3、D4E6DF、E0E2E6、E5DDF1、595959、1F3864，使用 a:highlight，沒有獨立底帶。五個單欄與素材共用一組近期色記錄。深灰／深藍的素材文字以白字展示，套用高亮不會自動改使用者字色。近期色顯示、順序與保留時間由 Office 決定，不替換內建 15 色。

原始四頁來源 bytes 不變；衍生主檔保留原 master、7 layouts、media、notes，另建五個單欄 master／layout／theme，不能宣稱全部 theme bytes 不變。原單欄內容複製五次，新增各頁高亮示例與頁碼；原雙欄頁碼更新為 7。原標誌、公司資訊與頁尾依確認保留，按鈕和下載檔名採中性名稱。

## 元件素材契約

第 11–13 頁只取既有 Deck renderer 的原生物件，使用原母片 layout6，不引入 Deck master、theme、notes 或整頁圖片。Cards 保留 9 個群組；A16／A18 各保留全部 14 款 A/B（28 群組），等比 50% 重排成 7 列，內文 9 pt、A16 小字母標籤 8.5 pt。這是可複製後放大的密集素材，不是投影正文可讀性承諾。元件的 resolved RGB 來自 07 匯出配色，不保證日後 PowerPoint 換主題會自動變色。

## 建置與檢查

先執行 `tools/stamp_version.py`，再以 `tools/build_single.py` 同步單檔。`tools/build_master_previews.js` 內嵌最終十三頁的 PowerPoint 960×540 PNG 原 bytes，記錄來源與圖片 SHA-256，沒有近似重畫。

`test:master-thirteen` 檢查頁序、五組關係、保護零件、R2 與原生結構；`native_master_profile_test.js` 驗 notes 共享阻擋與失敗原子性；素材、UI、navigation、export-entrypoint tests 驗正常／單檔的兩出口、焦點與快照鎖。主檔十三頁、副檔三頁的 manifest 與頁碼一致。

PowerPoint ShapeStyle API、轉圖與保存重開不等於 Ribbon 點擊或 MRU 選單驗收。字型未內嵌，其他裝置可能不同；Android、POTX 新建與本輪表格 PowerPoint 實視未驗。標準 Blob 產生成功也不等於瀏覽器落盤。
