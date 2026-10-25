# Microsoft PowerPoint 實機驗收（COLA）

此報告由本機 `../acceptance/README.md` 複製；下述原始檔案／render 目錄均位於 repository 外的 `../acceptance/`。精簡數值證據另保存在本報告旁 `powerpoint-evidence/`。

使用 Windows COLA 的 Microsoft PowerPoint `16.0.20527.20088`。本輪由 PowerPoint COM 實際開啟 37 份測試 PPTX、轉出 117 張投影片 PNG；另產生 3 份編輯後重開的測試副本。這不是 LibreOffice 或 XML 模擬驗收。

`view_image` 親看過 **19 張不同 PNG**，其中 15 張是輸入測試檔的投影片、4 張來自 quick-style 編輯／深底目的地副本。117 頁不是逐頁人工視覺通過數。

## 測試來源與版本

- 首輪 30 份／102 頁：以基準 `bc7aa828cc084b07084f6da8afd43fa847f7c9b7` 的表格、A15–A18、推薦頁及 13 種 Style Kit 為測試範圍。
- 最終補充 7 份／15 頁：本地修正版 E7 五種 palette、六種新 quick style、白色透明三款及固定黃實心。`supplement-expected.json` 記錄實際生成時的 `deck.js` / `quickstyles.js` SHA256。
- **所有生成均使用 repository 正式瀏覽器 bundle**，由 VM 載入，沒有使用 `NODE_PATH` 的 PptxGenJS 4.x。
- PptxGenJS `3.12.0`；JSZip `3.10.2`。
- `pptxgen.min.js` SHA256: `36dda044a99c3c83059ba011a08c361b506aeed5cb30733a7252f6b8593246b4`
- `jszip.min.js` SHA256: `0d8c303d7ac0c36b9903431481aa85ad0d1234a81182f6e96b7b687f385dae1f`
- Style Kit 測試檔由 repository 靜態資產重包成 acceptance 專用副本；未開啟使用者現有文件。

## 已完成的實機／原生檢查

| 範圍 | 輸入 PPTX | PowerPoint 轉圖頁數 | 檢查方式 |
| --- | ---: | ---: | --- |
| 五 palette 表格、45% 窄表格、四種外框 | 10 | 10 | 完整讀回原生 table cells、字型大小、粗體、文字、欄寬、列高、PowerPoint 文字 bounds |
| A15–A18 藍／紫／綠／酒紅／自訂色 | 5 | 20 | 每頁 28 個原生群組；navy 另有完整深層形狀讀回 |
| 推薦元件的 navy／custom | 2 | 20 | 原生型別 inventory、每頁三個 shape samples；未逐頁親看 PNG |
| 13 種 Style Kit | 13 | 52 | 所有 PPTX 由 PowerPoint 開啟／轉圖；原生 inventory；親看 wire gallery |
| 六款快速樣式＋白色 outline／marker／underline | 1 | 9 | 完整原生子形狀、20 pt、RGB、原生 24%／35% opacity |
| E7 navy／wire／green／wine／custom | 5 | 5 | 實機讀回引言與姓名使用各自 PD；五張 PNG 全部親看 |
| 常用色黃實心 | 1 | 1 | 固定 `E7BF4A`、深色文字 `303640`；親看 PNG |

首輪數值／結構檢查 **1252/1252 通過**；最終補充 **100/100 通過**。四種外框 `1 / 1.5 / 2.25 / 3 pt` 的 48 段外緣在 PowerPoint COM 讀回皆精確符合指定寬度。邊線方向依 [Microsoft PpBorderType 官方列舉](https://learn.microsoft.com/en-us/office/vba/api/powerpoint.ppbordertype) 對應。

原生編輯測試：table cell、獨立 textbox、A15 群組內文字，以及 quick-style 群組文字，皆在專用副本完成修改、SaveCopyAs、關閉與重開。文字與 group/table 型別保留；quick-style 重開仍為 20 pt。原始測試來源 SHA256 不變。三次操作的既有 PowerPoint 簡報數皆為 **5 → 5**。

可靠阻擋驗例：45% 表格加不可拆分長數字被既有驗證器拒絕匯出，並說明改用 90%／auto 或減少欄數；沒有靜默縮字或截斷。另用短 SKU 的有效 45% 表格完成實機渲染及 bounds 檢查。

## 已親看的 19 張 PNG 與結果

所有檔案均在 `render/`。以下清單明確區分 PNG 視覺觀察與程式數值檢查。

| PNG | 視覺觀察 |
| --- | --- |
| `table-navy-slide-1.png` | 中文／English、00123、98.5%、明確兩行與長字串完整；局部粗體和 base bold 可區分，1 pt 四段外框連續 |
| `table-narrow-45-slide-1.png` | 長中文於窄欄換行、沒有可見截字；45% 寬度與較高表格合理，保留原字級 |
| `outline-3-slide-1.png` | 3 pt 上下左右外框明確、內部橫線較細，粗體與原資料完整 |
| `catalogue-navy-slide-2.png` | A16 14 款左右對稱；中文完整；03E 是中藍且與深色標題分開，沒有變成警示土黃 |
| `catalogue-custom-slide-4.png` | A18 圖示、標題、側線／框線隨自訂紫色；03E 中間紫與標題紫可區別；中性底色保留 |
| `stylekit-wire-slide-4.png` | 7×6 gallery、各 accent 與文字清楚；既有漸層／陰影仍屬原資產，未新增 |
| `quote2-sentinel-slide-1.png` | 自訂紫色引言、姓名、強調跟隨 palette；無可見文字截斷 |
| `quote2-navy-slide-1.png` | 深藍 PD 引言／姓名與 P 裝飾一致 |
| `quote2-wire-slide-1.png` | wire 預設 PD 為深灰，文字為深灰、P 裝飾為紫，符合角色契約 |
| `quote2-green-slide-1.png` | 引言／姓名深綠，裝飾綠，中文換行維持 |
| `quote2-wine-slide-1.png` | 引言／姓名深酒紅，裝飾酒紅，沒有殘留 navy 深藍 |
| `quickstyles-nine-slide-3.png` | 自訂紫實心、白字可讀，文字置於原生底座內 |
| `quickstyles-nine-slide-5.png` | 全字柔帶呈淡紫、混合中英完整可讀 |
| `quickstyles-nine-slide-6.png` | 下緣半筆帶呈淡紫，文字不被遮蔽 |
| `quickstyles-solid-yellow-slide-1.png` | 黃實心配深字，沒有白字低對比問題 |
| `quickstyles-roundtrip-slide-7.png` | 白色透明 outline 在深底目的地副本清楚可見，含白色文字 |
| `quickstyles-roundtrip-slide-8.png` | 白色全字柔帶在深底副本呈透明淡帶，白字清楚 |
| `quickstyles-roundtrip-slide-9.png` | 白色下緣半筆帶在深底副本可見，文字完整 |
| `quickstyles-roundtrip-slide-1.png` | 編輯後的「快速樣式已編輯」重開可見；仍在原生柔底群組內 |

白色款的深底只加入 `quickstyles-edited-dark-roundtrip.pptx` 這份驗收副本，模擬貼入深底簡報。產品原始匯出沒有增加深底形狀、沒有修改真白 RGB。

## 限制與阻擋

- **可見 UI 開檔／無修復對話框：未驗。** 子代理的 `cua.getState()`（45 秒 timeout）與重設後 `cua.getApp('PowerPoint')`（30 秒 timeout）均逾時並重設 kernel。這兩次都是 UI discovery，未到開檔動作；沒有拒絕碼，也沒有修改 UI 的已知結果。停止重試，不將 WithWindow=False 的成功等同「無 repair UI」。
- COM 在 sandbox 內首次 activation 回 `E_ACCESSDENIED`；經正常 `require_escalated` 審核後已成功。這項已解決，不是剩餘產品故障。
- PowerPoint `Font.Name` 回的是指定字型，並非逐字 glyph fallback 證據。登錄檔確認 Microsoft JhengHei（含 Bold／Light）、Noto Sans TC、Calibri 已安裝；本輪親看中文沒有缺字方框。未宣稱任意未安裝自訂字型不會替換。
- `.potx` 的可見開啟、色彩 `.xml` 的 UI 匯入、真 Android、瀏覽器 preview 與 PowerPoint 的逐像素比較，均不在本實機已通過範圍。
- 單檔網站的下載流程由主線另驗。本資料證明的是相同正式 bundle 的輸出器＋Microsoft PowerPoint 產物，不替代瀏覽器事件流程驗證。
- 除上列 19 張 PNG，其他頁面只做轉圖／原生 inventory 或數值檢查，沒有逐頁肉眼簽核。

## 證據與可重跑腳本

- `powerpoint-report.json`：首輪 30 份／102 頁 COM 記錄。
- `powerpoint-smoke-detailed.json`：navy 表格與四頁目錄的完整深層記錄。
- `verification.json`：1252 個首輪檢查。
- `native-roundtrip-report.json`：四種外框及 table／textbox／group 編輯重開。
- `powerpoint-supplement-report.json`、`supplement-verification.json`：最終補充 15 頁與 100 個檢查。
- `quickstyles-roundtrip-report.json`：新 quick-style 原生編輯及深底目的地驗收。
- `bundle-evidence.json`、`supplement-expected.json`：版本、hash、fixture 來源。
- `generate-fixtures.js`、`generate-supplement.js`、`inspect-powerpoint.ps1`、`verify-native-roundtrip.ps1`、`verify-quickstyles-roundtrip.ps1`、`analyze-powerpoint.js`、`analyze-supplement.js`。

所有讀檔以 acceptance manifest 限制路徑；不變更安全／信任設定，不安裝軟體、不使用 Application.Quit、不 push／PR／merge／deploy。只關閉自行開啟的測試簡報。
