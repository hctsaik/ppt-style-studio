# 固定紅色母片：26 頁與五個具名單欄主題

## 不變來源

原始四頁母片保存在 `Fixed_Red_Template.pptx`，53,913 bytes，SHA-256 `1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae`。來源品牌、logo、頁尾與內容依使用者要求保留。`source-manifest.json` 記錄原始 4 頁、1 master、7 layouts 與 45 個 parts；它不是衍生下載清單。

## 主下載與順序

網站只有頂部的「下載 26 頁母片」主按鈕，檔名 `固定紅色_26頁母片.pptx`，下方保留 26 頁實際預覽。副素材按鈕、兩個折疊區、技術名稱／色票清單與編號目錄已移除；內部 `exportMaterials` 三頁 helper 保留相容性。

1. 封面。
2. 單欄07、單欄06、單欄03、單欄10、單欄04（第 2–6 頁）。
3. 雙欄（第 7 頁）。
4. 兩頁可編輯矩形、八色原生文字螢光筆（第 8–10 頁）。
5. 商務深藍卡片、青綠科技、墨綠筆記、框架鑑各四頁，組內依序 00 總覽、A2 卡片與面板、A16、A18（第 11–26 頁）。

五個單欄各有具名 layout、master、theme，可由 PowerPoint 新增投影片／版面配置選用，也可複製第 2–6 頁。07 為首選；封面、雙欄與矩形素材共用 07。後十六頁直接復用各自的 PRESETS 元件外觀，保留原生群組、文字、圖示與字型，不用 PNG 代替、不被 07 配色覆寫。總覽只保留在同風格組內存在的投影片連結。

| 單欄 | 六個 Accent |
| --- | --- |
| 07 | 5470C6 91CC75 FAC858 EE6666 73C0DE 3BA272 |
| 06 | 1F77B4 FF7F0E 2CA02C D62728 9467BD 8C564B |
| 03 | 4878D0 6ACC64 D65F5F 956CB4 D5BB67 82C6E2 |
| 10 | 8A7CA8 E098C7 8FD3E8 71669E CC70AF 7CB4CC |
| 04 | 4269D0 EFB118 FF725C 6CC5B0 3CA951 FF8AB7 |

## 原生能力與保護

先在來源單一鏈套用既有 R2 balanced-v2，再建立五個獨立 theme；沿 relationships 解析，不猜檔名。保留 fontScheme、文字／背景色槽、bgFillStyleLst、原 master／layout／media 及保留 notes bytes。單欄只改顯示標題、頁碼並加「重點文字」原生 highlight；雙欄只改頁碼。來源母片加五個 clone，共 6 個有效 master。通用單 profile API 仍在寫入前拒絕覆寫不同母片色盤。

70 個矩形並非新增 70 個 Ribbon 按鈕。A16／A18 各保留 28 組，密集素材內文 9 pt、A16 A/B 小字標 8.5 pt，可複製放大，不承諾投影正文可讀性。原生槽位共享，部分線框呈灰底；精確白底外卡可複製素材。

八色 `F6D8DB F9F0D4 7C9CC3 D4E6DF E0E2E6 E5DDF1 595959 1F3864` 都是真 `a:highlight`，沒有獨立底帶。全簡報共用 `p:clrMru`；近期色顯示、排序及保留由 Office 決定，不替換內建 15 色。深灰／深藍範例用白字，套用 highlight 不會自動修改使用者字色。

## 重建與局部驗證

`npm run build:master-samples` 生成 template-26.pptx，保留 materials-07.pptx helper 樣本。`npm run test:master-selected` 只驗 26 頁順序、指定 16 頁真 PRESETS／原生群組／連結與來源保護。MASTER_FIXTURE 可指向已生成檔；MASTER_PREVIOUS_FIXTURE 核對前十頁只含已批准的文字清理。`test:master-thirteen` 是相容命令別名，舊十三頁測試檔保留歷史參考。修改後先跑 `python3 tools/stamp_version.py`，再跑 `python3 tools/build_single.py`。

本輪提供的 PowerPoint 16.0.20527.20088 證據為 26 頁主檔及三份表頭小範例轉圖，共 29 頁；使用者既有簡報數 5→5。26 頁 PNG 原 bytes、來源 hash 記錄於 fixed-master-previews.js。本輪沒有整站、全部主題、ShapeStyle 大矩陣或新增編輯／保存重開測試；上輪 210 次原生 API／保存重開不冒稱本輪新增驗收。

字型未內嵌，其他裝置可能不同。元件顏色按各自 PRESETS 解析，不保證日後 PowerPoint 換主題時自動變色。Ribbon、MRU dropdown、POTX 新建與 Android 仍未驗。表頭本輪僅三份小範例實視，不宣完整表格矩陣。JSDOM／封裝通過不等同瀏覽器落盤；CUA 擷取限制未繞過，未改安全設定。
