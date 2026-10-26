# 投影片母片：固定原件與內容組合

## 來源

- `TSMC_Template.pptx` 是附件 `TSMC_Template (5).pptx` 的原 bytes，不是重建／另存新檔。
- Library：`libfile_91da4dec0718819188da04d164eaf803`，version 0。
- SHA-256：`1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae`。
- `source-manifest.json` 記錄原封裝 45 個 parts 的 SHA-256。原件為 4 頁、1 個 slide master、7 個 layouts、16:9／1280 × 720；字型未內嵌。品牌標記公開展示及下載已獲使用者同意。

## 獨立邊界

`fixed-master.js` 不引用 Deck 或 QuickStyles，也不接受全站配色／字型參數。母片自身 title／body／bullet／footer／logo 完全從原 package 保留。新內容層固定七色對齊既有 common quick styles，但不可把其紅色 `D95D68` 誤當母片標題的 `C00000`。原 theme accent1 是 `4472C4`，不作為定義紅色的來源。

選擇儲存在獨立 `ppt-studio-fixed-master` key。原有 QuickStyles、Style Kit、表格、全站 preflight／export 邏輯未改。母片有自己的短句長度檢查，不會默默截斷或縮字。

### 462 種搭配

- 封面／章節 2 種版面：只用輕量標記，不加大卡片；`2 × 1 × 3 × 7 = 42`。
- 單欄／雙欄／左右比較／只有標題／雙欄報表 5 種：四種快速樣式；`5 × 4 × 3 × 7 = 420`。
- 三種 marker 選擇：無、全字柔帶 24%、下緣半筆 35%。
- 七色：紅、黃、藍、綠、灰、紫、白。合計 462 種，並非 462 頁大目錄。
- 每次選一組預覽；下載為「原 4＋自選 1 頁」或「原 4＋推薦 7 頁」。新頁只放一組有用途的內容。報表保留原 layout 的藍紫雙欄標題，再加入可編輯表格；原第 4 頁的兩張表格 bytes 完整保留。

## 原生匯出合約

- 原件下載：直接使用 embedded 原 bytes；正常版與離線版相同，不經 import/export。
- 組合包：以 JSZip 載入原 bytes，新增 slide XML 與其 layout relationship。
- 只有以下 4 個既有 parts 可改：`[Content_Types].xml`、`ppt/presentation.xml`、`ppt/_rels/presentation.xml.rels`、`docProps/app.xml`。
- 原 4 頁、所有 master／layout／theme／media／notes parts 保持逐 entry bytes 不變。ZIP 容器會重新壓縮，因此組合包整檔 hash 不等於原件；不宣稱壓縮位元組完全相同。
- 新頁 title／bullet 的幾何與 `bodyPr`／`lstStyle` 複製對應原 layout，使用原 placeholder type／idx：結論 layout4/5 idx11、layout7 idx1。新頁碼保留 `a:fld type="slidenum"`。報表 native `graphicFrame` 引用 idx3/5。
- 卡片／marker 為 native shape／text groups，group bounds 為實際內容大小；表格為 native `a:tbl`，不是圖片。白色是真白，深色示意底板只存在 HTML，不進 PPTX。

## 建置與驗證

```sh
python3 tools/build_fixed_master_assets.py
python3 tools/stamp_version.py
python3 tools/build_single.py
npm run test:fixed-master
npm test
python3 tools/check_pptx.py fixed-master/TSMC_Template.pptx out/fixed-master/recommended.pptx
```

來源素材生成器只讀 ZIP/XML，不 import/re-export，來源 hash 不符會中止。`fixed-master-data.js` 同時攜帶原 bytes、精確 placeholder styles 與原 logo，離線版內嵌同一資料。

`fixed_master_test.js`：462 組 XML、13 份 native 封裝、逐 part hash、4 原頁、7 layouts／1 master、rels target、shape ID／placeholder mapping、native tables、字級／顏色、marker alpha、group bounds、白色示意底不匯出、動態頁碼與防截斷。

`fixed_master_ui_test.js`：正常／離線頁實際 JSDOM 事件、全站各主題與字型變更隔離、保存／重新載入、選擇與鍵盤焦點、double click／pending／failure／retry、原件 bytes、5/11 頁 ZIP。JSDOM 的 postMessage 排程與瀏覽器不同；測試使用同一 repository JSZip bundle 的 Node 排程以檢查真實封裝，saveBlob 只捕捉 Blob，**不代表瀏覽器已落盤**。

## 明確限制

- HTML/SVG 是有標籤的示意，非 PowerPoint 忠實縮圖；不使用會錯畫 bullet 的雲端 render PNG。原 master 淡色裝飾保留在 PPTX，未在示意重畫。
- 微軟正黑體未內嵌，顯示取決於使用者安裝字型。未完成 PowerPoint 開啟、換字型、重排頁後動態頁碼或逐項編輯的實機驗收，也未跑完整 Open XML XSD。
- CSS 有 850／480px 響應式斷點與至少 44px 控制；DOM/CSS 合約不等同真實手機觸控／捲動／視覺驗收。本次未啟動瀏覽器／本地 HTTP／CDP。
- 使用既有標準 Blob 下載出口，並明示產生成功不代表已存檔。受管瀏覽器可能封鎖 blob 或下載；實際檔案落地未驗證，沒有透過其他 scheme／host／下載橋梁繞過政策。
