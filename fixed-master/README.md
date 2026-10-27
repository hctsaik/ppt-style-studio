# 固定紅色母片：24 頁與五個具名單欄主題

## 不變來源

原始四頁母片保存在 `Fixed_Red_Template.pptx`，53,913 bytes，SHA-256 `1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae`。來源品牌、logo、頁尾與內容依使用者要求保留。`source-manifest.json` 記錄原始 4 頁、1 master、7 layouts 與 45 個 parts；它不是衍生下載清單。

## 主下載與順序

網站只有頂部的「下載 24 頁母片」主按鈕，檔名 `固定紅色_24頁母片.pptx`，下方保留 24 頁實際預覽。副素材按鈕、兩個折疊區、技術名稱／色票清單與編號目錄已移除；內部 `exportMaterials` 三頁 helper 保留相容性。

1. 單欄07、單欄06、單欄03、單欄10、單欄04（第 1–5 頁）。
2. 兩頁可編輯矩形、八色原生文字螢光筆（第 6–8 頁）。
3. 商務深藍卡片、青綠科技、墨綠筆記、框架鑑各四頁，組內依序 00 總覽、A2 卡片與面板、A16、A18（第 9–24 頁）。

封面與雙欄示範頁已從衍生下載移除，來源檔不變。五個單欄各有具名 layout、master、theme，可由 PowerPoint 新增投影片／版面配置選用，也可複製第 1–5 頁。07 為首選，矩形素材共用 07。後十六頁直接復用各自的 PRESETS 元件外觀，保留原生群組、文字、圖示與字型，不用 PNG 代替、不被 07 配色覆寫。總覽只保留在同風格組內存在的投影片連結。

六個真正 PowerPoint 小節按頁面身份建立：單欄五頁、素材三頁、四風格各四頁。PowerPoint 16.0.20527 的 `DocumentWindow.ExpandSection` 可收折指定小節，但實測另存重開全部恢復展開；因此不保證預設收折跨機保存，也不加入巨集或修改 Office 設定。

| 單欄 | 六個 Accent |
| --- | --- |
| 07 | 5470C6 91CC75 FAC858 EE6666 73C0DE 3BA272 |
| 06 | 1F77B4 FF7F0E 2CA02C D62728 9467BD 8C564B |
| 03 | 4878D0 6ACC64 D65F5F 956CB4 D5BB67 82C6E2 |
| 10 | 8A7CA8 E098C7 8FD3E8 71669E CC70AF 7CB4CC |
| 04 | 4269D0 EFB118 FF725C 6CC5B0 3CA951 FF8AB7 |

## 原生能力與保護

先在來源單一鏈套用既有 R2 balanced-v2，再建立五個獨立 theme；沿 relationships 解析，不猜檔名。保留 fontScheme、文字／背景色槽、bgFillStyleLst、原 master／layout／media 及保留 notes bytes。單欄留下原 24／18／14 pt 三級示例與紅標題，右側加入六色 × 六效果的 36 個原生樣式形狀；shape 的 fill／line／effect 全由 theme 參照解析，不用圖片或直接顏色偽裝。來源母片加五個 clone，共 6 個有效 master。通用單 profile API 仍在寫入前拒絕覆寫不同母片色盤。

70 個矩形並非新增 70 個 Ribbon 按鈕。素材前兩列各保留 Text1 中性白卡；Accent1–6 改為淡主色同色框柔影、主色白字柔影，淺色會加深到白字對比至少 4.5。其他八款不變。A16／A18 各保留 28 組，密集素材內文 9 pt、A16 A/B 小字標 8.5 pt，可複製放大，不承諾投影正文可讀性。原生槽位共享，部分線框呈灰底；精確白底外卡可複製素材。

八色 `F6D8DB F9F0D4 7C9CC3 D4E6DF E0E2E6 E5DDF1 595959 1F3864` 都是真 `a:highlight`，沒有獨立底帶。全簡報共用 `p:clrMru`；近期色顯示、排序及保留由 Office 決定，不替換內建 15 色。深灰／深藍範例用白字，套用 highlight 不會自動修改使用者字色。

## 重建與局部驗證

`npm run build:master-samples` 生成 template-24.pptx，保留 materials-07.pptx helper 樣本。`node tools/master_sections_test.js <fixture.pptx>` 只查本輪頁面、小節、原生樣式參照、兩列素材與來源保護。`test:master-selected` 保留指定元件的群組／連結契約。`test:master-thirteen` 是相容命令別名。修改後先跑 `python3 tools/stamp_version.py`，再跑 `python3 tools/build_single.py`。

本輪 PowerPoint 16.0.20527：一份 24 頁候選轉圖，親看五張單欄及第一張矩形素材；180 個樣本的 ShapeStyle 回讀索引吻合，一個新樣本改字另存重開通過。使用者既有簡報數 6→6。PNG bytes 與來源 hash 記錄於 fixed-master-previews.js。沒有整站或全部主題回歸。新參考圖下載技術失敗，依父層親看後明訂的文字規格及既有原生產物實作，不宣稱本機親看了參考圖。

字型未內嵌，其他裝置可能不同。元件顏色按各自 PRESETS 解析，不保證日後 PowerPoint 換主題時自動變色。Ribbon、MRU dropdown、POTX 新建與 Android 仍未驗。表頭本輪僅三份小範例實視，不宣完整表格矩陣。JSDOM／封裝通過不等同瀏覽器落盤；CUA 擷取限制未繞過，未改安全設定。
