# 投影片母片：指定三頁與不變來源

## 不變安全基準

- `TSMC_Template.pptx` 仍是附件 `TSMC_Template (5).pptx` 的完整原 bytes；不覆寫、不永久刪除來源頁。
- Library：`libfile_91da4dec0718819188da04d164eaf803`，version 0。
- SHA-256：`1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae`。
- `source-manifest.json` 記錄原封裝 45 個 parts 的 SHA-256。來源為 4 頁、1 master、7 layouts、16:9／1280 × 720；字型未內嵌。

## 目前產品範本：恰好三頁

使用者新圖要求只留三頁，覆蓋先前「原四頁皆保留於下載」的產品契約：

1. **封面「專案重點與下一步」**：原 layout1 的 native placeholders，摘要「聚焦主要判斷，保留執行依據」、強調短句「優先確認關鍵事項」，沿用已提供的輕量下緣標記。
2. **單欄內容**：來源 `slide1.xml`。
3. **雙欄內容**：來源 `slide2.xml`。

這不是「來源附件前三頁」：原 slide3 是左右比較、原 slide4 是報表，兩者不在目前範本。封面沿用原 master 的 logo、裝飾、紅底線與黑頁尾，不重繪成全頁圖片。

主下載檔名 `TSMC_三頁母片.pptx`，不包含自動追加的示範。另展開「另做一頁組合示範（非三頁範本）」並按下載，才會得到 `TSMC_組合示範_3加1頁.pptx`。主範本不受示範輸入或樣式選擇影響；即使示範文字無效仍可下載固定三頁。

## 獨立邊界與活動選擇

`fixed-master.js` 不引用 Deck 或 QuickStyles，也不接受全站配色／字型參數。母片 title／body／bullet／footer／logo 保留原規格。新內容層紅色 `D95D68` 不是母片標題的 `C00000`；theme accent1 `4472C4` 不用於定義固定紅色。

活動版面限 layout1 封面、layout2 單欄、layout4 雙欄；其他 layouts 留在 package 供 PowerPoint 使用，不從原 master 移除。舊保存的比較／報表等選擇回到單欄，保留文字、顏色、marker 與有效快速樣式。

- 封面：1 個無卡片樣式 × 3 markers × 7 色 = 21。
- 單欄／雙欄：2 × 4 快速樣式 × 3 markers × 7 色 = 168。
- 合計 **189** 種搭配；3 個輕量推薦選項僅切換示範選擇，不增加下載頁數。
- 四種快速樣式仍為柔底、細框、實心、側邊條，沒有在這次改成另一套樣式；marker 仍為無、24% 全字柔帶、35% 下緣半筆。
- 選擇使用獨立 `ppt-studio-fixed-master` key。原有 QuickStyles、Style Kit、表格及全站 preflight／export 語義未改。

## 精確原生封裝合約

以 JSZip 讀取不變來源，產生衍生 package；不 import/re-export 或近似重建 master。

- 移除 6 個來源 parts：`ppt/slides/slide3.xml`、`ppt/slides/_rels/slide3.xml.rels`、`ppt/slides/slide4.xml`、`ppt/slides/_rels/slide4.xml.rels`、`ppt/notesSlides/notesSlide3.xml`、`ppt/notesSlides/_rels/notesSlide3.xml.rels`。
- 新增 `ppt/slides/slideCover.xml` 與其 layout1 relationship，排在第一頁。
- 保留來源 slide1／slide2；只改各自 `a:fld type="slidenum"` 的快取文字為 2／3，所有其他 XML bytes 不變。原 notes1／notes2 無文字或頁碼欄位，保留 bytes。
- 更新 4 個 metadata/index parts：`[Content_Types].xml`、`ppt/presentation.xml`、`ppt/_rels/presentation.xml.rels`、`docProps/app.xml`；sldIdList 與 slide relationships 恰為 3 筆。
- 所有其他原 parts（含 1 master、7 layouts、theme、media）逐 entry SHA256 不變。
- 可選示範才另新增 `slide4.xml` 與其 relationship；這是新內容，不是被移除的原報表。完整 count 恰為 4，沒有原比較／報表內容。
- ZIP 的新增／修改項目沿用固定來源時間；不建立帶目前時間的 folder entries。相同輸入產生穩定 bytes，正常／離線內容一致。三頁衍生檔 hash **不等於**原四頁來源 hash。

新頁 title／bullet geometry、bodyPr／lstStyle 與 placeholder type／idx 沿用原 layout。雙欄結論 placeholder 是 idx11；所有頁碼維持原生 `a:fld type="slidenum"`。示範卡片／marker 為 native shape/text groups；真白色示意深底只在 HTML，不進 PPTX。

## 建置與驗證

```sh
python3 tools/build_fixed_master_assets.py
python3 tools/stamp_version.py
python3 tools/build_single.py
npm run test:fixed-master
npm test
python3 tools/check_pptx.py out/fixed-master/template-3pages.pptx out/fixed-master/example-4pages.pptx
```

來源生成器 hash guard 仍檢查不變四頁附件。測試涵蓋 189 組 native XML、14 個衍生封裝、原件 hash、3／4 頁精確順序、sldIdList、relationships／ContentTypes、刪除 parts、保留頁僅頁碼差異、7 layouts／master bytes、全站主題隔離、動態頁碼、防截斷，以及正常／離線 UI 狀態與實際 Blob 內容。

JSDOM 以同一 repository JSZip bundle 的 Node 排程產生真實 bytes；saveBlob 僅捕捉 Blob，**不代表檔案已落盤**。

## 明確限制

- HTML/SVG 明標示意，非 PowerPoint 忠實縮圖；不採用會錯畫 bullet 的雲端 render PNG。
- 微軟正黑體未內嵌；未完成 PowerPoint 實視、重排頁碼及逐物件編輯驗收，也未跑完整 Open XML XSD。
- DOM/CSS 合約不等同真實手機觸控／捲動／視覺驗收；本次不啟動本地瀏覽器／HTTP／CDP。
- 使用既有標準 Blob 出口。受管瀏覽器可能封鎖 blob；沒有其他 scheme／host／下載橋梁繞過政策。
