# COLA 本地候選版驗收紀錄

本輪只做本地實作、測試與提交，未 push、建立 PR、merge 或 deploy。正式網站仍是遠端版本。

## 環境與隔離

- Windows COLA；PowerShell；Node.js 24.13；使用現有 Python 3.12 與 jsdom 26.1.0，未安裝 Office／CLI／字型或修改安全設定。僅曾嘗試離線還原 npm cache，因 xmlchars 未快取而失敗；改用既有 jsdom 路徑，沒有網路安裝。
- 起點與遠端 main：`bc7aa828cc084b07084f6da8afd43fa847f7c9b7`（PR #17）；分支 `local/theme-style-preflight`。
- 原 checkout：`C:\Users\hctsa\Documents\Codex\2026-10-25\task-3\ppt-style-studio`，起始為乾淨的 `922c74d`；保留不動。本輪獨立 clone 位於 `C:\Users\hctsa\Documents\Codex\2026-10-26\task\ppt-style-studio`。
- 未找到 repository AGENTS.md／.agents/skills；未讀 sessions，亦不需要讀本機 memory。
- 原生輸出證據一律使用網站隨附 PptxGenJS 3.12.0／JSZip 3.10.2。機器另有 4.x runtime 的早期相容性結果不列正式成績。

## 確認的故障與改動

| 位置 | Before／根因 | After |
| --- | --- | --- |
| E7 `quote2` | 金句、姓名與三個情境膠囊的文字寫死 `1F3864`，換主題仍留深藍 | 五個原生文字物件使用 PD；幾何、字型、中性色不動 |
| Style Kit 回頁／頁內改 style | `StyleKit.current() || S.base` 留住首次進入的舊 theme，且 `renderExtra()` 無 Kit 分支 | 預設跟隨全站；顯式點 Kit theme 切為獨立模式，保存並尊重使用者選擇 |
| Style Kit 自訂色 | 靜態 13 theme 資產無法表達任意自訂 palette，舊 UI 仍可能展示／下載舊檔 | 比對實際 palette 與資產槽；不支援時顯示原因、當前色票並移除舊下載連結，允許另選獨立 Kit |
| 動態 PPTX 各入口 | 已有 table validator，但提示與下載路徑分散；缺乏共用取消／快照鎖 | 共用三態 preflight 與同一 snapshot；非阻擋建議不彈確認框，位置／原因／改善方式可展開 |
| Kit／快速樣式預覽下一 frame 前立即下載 | 當下全站 palette 已更新，但畫面 controller 還持有舊 params | Kit 下載時同步並拒絕不符當下主題的舊連結；Quick 使用當下 params＋選項重建 snapshot，獨立 reviewer 已重現並複驗修正 |
| 圖示 SVG／PNG ZIP | 每個非同步 raster 迴圈讀 live style，期間換色可能產生混合配色 | 顏色、尺寸、字重、README、檔名皆使用同一入口 snapshot；獨立防連點 |
| 圖示圖片 PPTX 預處理 | 非同步 PNG 準備可能早於共用鎖與 snapshot | 預處理也在同一作業鎖與 revision 內；取消／換 style 丟棄結果 |

新增快速樣式是本輪另行授權的功能，並非將固定色誤判為 bug。既有表格四 tabs、90%／45%／auto 與四高度、四外框粗細、可選粗體、legacy IDs、A15–A18、推薦 12 頁與 03E 主色色相皆保留。未新增陰影。

## 全站與下載矩陣

完整 **76 註冊頁**逐頁角色與固定色清單見 [theme-audit.md](theme-audit.md)；本機 JSON 同名附件保留每個 paint slot 與自動枚舉的 call sites。九個 presets 加一組刻意不同的 sentinel 做模型／SVG；藍 navy、紫 wire、綠 green、酒紅 wine、自訂 sentinel 做 native PPTX。推薦 12 頁只是 smoke，不代替全站。

| 網頁／入口 | 範圍與檢查方式 |
| --- | --- |
| `index.html` | 導向 `studio.html`；固定入口 logo／link 藍為站台樣式，不是投影片主題 |
| `studio.html` | 風格設定、投影片元件、圖示庫、表格、快速樣式、範本 Style Kit、簡報食譜七 tabs |
| `PPT-Style-Studio.html` | 同一應用的單檔版，內嵌九個 script 與 39 Kit 資產；獨立 parity／DOM 測試 |
| `review/table-mocks/index.html` | 已存在的開發靜態表格 mock，不是正式生成器；固定示意色不強改 |
| 標準整包／本頁／A15–A18 四頁包 | `checkedExport → Preflight → Deck.exportPptx`；長頁與標準頁維持分包 |
| 單元件／搜尋選取／食譜 | elementModel／trayDeck／指定 keys，同一 PPTX 檢查與鎖 |
| 圖示單張原生／圖片 PPTX、底座＋組合包 | 同一檢查；圖片模式仍明確是使用者選的 raster，原生模式不意外轉圖 |
| 表格 PPTX | 復用 `Deck.assertTableExportComplete`；完整列／格／值與寬度驗證 |
| 快速樣式單元件 PPTX | 4 款方塊＋2 款筆帶；原生 shape＋text；同一 snapshot 與檢查 |
| `stylekit/<id>.pptx`、`.potx`、`_colors.xml` | 13 theme ×3；單檔內為相同資產的 Blob；build-time 12 槽／封裝檢查，下載遵守有效 palette 與共用忙碌防連點 |
| 單元件 SVG／PNG、單圖 SVG／PNG、全圖示 ZIP | 原有明確圖像用途，保留；不宣稱 PNG 可原生編輯，也不套用 PPTX 文字可編輯驗收 |
| 表格 TSV／HTML／複製、設定 JSON 保存／匯入 | 原資料與恢復路徑保留；相關 regression 測試仍執行 |
| `gen.js` CLI | 原生模型／輸出檢查；網頁 UI 的 preflight 面板不套用到 CLI |

角色契約：P／PD／PT 及公開文字／線條 tokens 應跟各自設定；A、semGood／semWarn／semBad 等維持原語義。白／黑、中性 panel、品牌 logo／圖片、手動 override 依原意保留。明列固定中性色 `5B6474`、`D0D7E2`、`B8C4D3`、`8A94A6`；圖示語義色 success `207345`、attention `806000`、warning `A14D00`、danger `B3261E`、neutral `596675`；C2 固定分類色 `8EA9DB`。既有 Kit gallery 的範例漸層／陰影與固定黃色半高 marker 不重設計。

獨立預期值不由被測 resolver 產生：E7 必須為 PD；A16 03E 必須沿 P 色相；刻意改綁 warning 的 mutation 會失敗。其餘全站 slot 掃描是角色依賴與固定色 inventory，並不假稱每個固定色都經設計者重新定義。

## 快速樣式設計與行為

- 主題色 P／PD／PT，或依序固定紅 `D95D68`、黃 `E7BF4A`、藍 `4E83CE`、綠 `4B9679`、灰 `7D8795`、紫 `9371C6`、白 `FFFFFF`。
- 柔底（預設）／細框／實心／側邊條；全字柔帶／下緣半筆。六個選項共用改字、預覽與單元件下載，不另做自由畫布或 42 格重複 gallery。
- 20 pt 現有 style 字型；原生可解組的形狀與文字，無新陰影、raster 或靜默縮字。長字串只給估算建議。
- 筆帶是獨立可編輯形狀，opacity 24%／35%，不是精準逐字 text highlight；改字後可手動調整帶寬，整組 resize 一起縮放。
- 白色保留真白；透明白色款搭淺字供深底使用。預覽深底不匯出，PowerPoint 深底實測只改專用驗收副本。
- 網頁換 style 更新主題來源；七常用色不變。匯出保存當下 RGB，沒有宣稱 PowerPoint 換 theme 可自動改色（未輸出 schemeClr 綁定）。
- Cola 未成功取回參考圖片；本輪依 parent 已親看圖片後提供並明確授權的文字契約設計，未宣稱做過原圖視覺比對。

## 匯出分級與狀態

`可以匯出`：正常內容直接下載，沒有例行 confirm。`建議調整`：小字、低對比、密集、估算溢出、既有改字縮放等，不阻擋。`必須修正`：資料缺列／缺格／被改寫、無效或超限尺寸、非有限座標、非法格線／文字結構、確定可見圖形超出頁面、已選素材遺漏。

未經 PowerPoint 實測的文字寬度不宣稱精準溢出；部分越界透明 text box 是建議。既有 E10 map2 文字框稍超畫布仍未證明 glyph 裁切，因此不擅改版型。只有既有表格數值寬度完整性條件是可靠阻擋。

檢查與匯出使用同份資料；變更內容／style 使舊結果失效。取消只禁止下載舊結果，不強停底層壓縮；原作業結束後可重試。Static Kit 下載交給瀏覽器後不宣稱能取消，也不宣稱 runtime 已檢查文字溢出；它使用本次強化的 build-time 資產檢查。

## 三層驗收結果

1. **角色／模型／事件**：全 76 頁 ×10 palettes 共 760 SVG 頁、126,191 assertions；單檔 parity 133,623 assertions、來源＋單檔 1,520 SVG 評估。Preflight 19 組（含 2,052 頁 preset／size 組合及 570 個元件不誤擋）；ExportFlow 17 組；所有動態 PPTX entrypoint 59 組 ×來源／單檔；Kit state 20 組 ×來源／單檔；真 JSDOM 整合 17 組 ×來源／單檔；Quick Styles 13 組。
2. **原生與封裝**：角色審核 380 頁原生 PPTX；Quick Styles 9 個 native exports；Kit 13 themes／39 assets／2,979 checks；所有 12 theme 色槽、關係、content type、四頁、master／layout／fmtScheme；118 份通用 PPTX 的 ZIP／id／connector 與 check_pptx 檢查通過。
3. **Microsoft PowerPoint 實機**：版本 `16.0.20527.20088`。37 份自產 PPTX，117 頁真 PowerPoint PNG；另外 3 份編輯存檔重開副本。1252＋100 數值／結構檢查通過，48 段四外框線寬符合 1／1.5／2.25／3 pt。表格、textbox、A15 group、quick-style group 均實際改字、保存、關閉、重開，20 pt 保留。使用者原有開啟簡報數 5→5，未改動使用者檔案。

**肉眼視覺驗收是 19 張，不是 117 頁全數簽核**：15 張輸入渲染＋4 張編輯／深底副本；主代理另複看其中窄表格、實心紫、白色深底三張，沒有把重複觀看加入總數。包括長中文窄表格、四段粗框、A16／A18、E7 五 palette、Kit gallery、柔和／半高筆帶、白色深底、實心紫與黃。逐張結果與完整檔名見 [POWERPOINT_ACCEPTANCE.md](POWERPOINT_ACCEPTANCE.md)。本機全部原始證據位於 repository 外的 `../acceptance/`。

獨立 read-only reviewer 檢查分級、取消、連點鎖、snapshot、Kit follow／independent／reload 與 golden 保護，找到上述兩項下載時序問題；修後再以 JSDOM 最小重現確認 Kit 與 Quick race 已消除，並核對 ZIP snapshot，未發現其他必須修正項目。DOM 匯出 bytes stub，不代替 PowerPoint 成品。

完整 `package.json` test 入口展開為 **49 個子命令：48 通過，1 個因工具缺席受阻**；該命令內 118 次 `office validate` 缺 CLI，沒有剩餘已知產品 assertion 失敗，SDK 仍 skip。Windows 僅適配既有 POSIX env assignment／python3 名稱，沒有替換或假造 validator。原先 jsdom 未解析的 34 組全數補跑；過時 exporter stub／舊 style-change 期待修正後重新通過。最終圖示變體 40 項、圖示包 34 項，另做單檔 DOM 23／17 項；四頁目錄 99 項與 146 native exports、DOM 14×2 通過。最終合併紀錄見 [regression-final.json](regression-final.json)。

第一次通用檢查額外出現一次 Windows cp950 輸出勾號失敗；以 `PYTHONIOENCODING=utf-8` 重跑後 ZIP 118 檔通過、總失敗回到且僅為缺 Office CLI 的 118 項。完整測試沒有啟用 browser-only 指令。最後修改僅下載控制與測試銜接，另以來源／單檔入口 59×2 與 DOM 17×2 檢查；PowerPoint 成品對應的 deck.js／quickstyles.js hash 仍與實機產生時一致。

## 舊 golden 保護

`tools/fixtures/scheme_catalogue_legacy.json` 完全不改。僅在比較副本 normalize E7 五個已確認物件：index 2 金句（2 runs）、9 姓名（1）、20／21／22 情境膠囊（各1）的 `tx.color` 與 `runs[].o.color`，從新 PD 還原舊 `1F3864` 再對原 hash。先獨立斷言每個新值等於 PD；幾何、其他顏色、文字與 metadata 仍被舊 hash 保護。錯綁色、改座標、改非目標中性色的 mutation 都會失敗。沒有重寫 golden。另將 `scheme_catalogue_ui_test` 與 `icon_variants_test` 的舊直接 exporter stub 更新為實際共用 preflight 路徑；仍驗原來的 group index、有效名稱與下載檔名，沒有放寬產品預期。`icon_pack_test` 原先要求換 style 後仍交付舊檔，更新為本輪授權的「舊結果失效、當前 style 重試」契約，保留原生 ZIP／群組／glyph 斷言，另外驗證僅換圖示選取不會丟棄有效 snapshot。

## 剩餘阻擋／未驗事項

| 狀態 | 動作與目標 | 原因與已完成部分 |
| --- | --- | --- |
| 技術失敗；已停止 | 在 Cola 透過 Library resolved-reference prepare_materialize 取得 `libfile_8eea07e69a9c819184817ac1db917bcf`／`image(20261025-185743).png` 到本機 reference 目錄 | 初次下載失敗；一次支持路徑重試取得 bytes 後，官方 helper 在 Windows 呼叫 `os.setxattr` 發生 AttributeError；目標檔不存在。未繞路取 URL；僅依已授權文字契約完成設計 |
| 未執行 UI 開檔 | 可見 PowerPoint 開檔、無修復對話框、POTX 新建、XML UI 匯入 | `cua.getState()` 45s 與 reset 後 `cua.getApp('PowerPoint')` 30s discovery timeout；停止重試，未改安全設定。COM 開檔／轉圖／編輯重開已成功，但不等於 UI 無提示 |
| 工具缺席 | 118 次 `office validate`／Open XML SDK | 本機沒有 Office CLI；SDK 未建置而 skip。未安裝。真 PowerPoint 與本地 OOXML／ZIP 檢查另列，沒有冒充這兩個 validator |
| 未執行 | 真瀏覽器逐頁視覺與下載完成、Android | 尊重既有 localhost／socket 與 DevTools 限制，未繞路開 server 或 CDP。JSDOM 僅驗事件與狀態；既有 RWD 95 仍只代表先前雲端 viewport／zoom |
| 覆蓋限制 | 任意缺字型替換與所有頁面肉眼簽核 | JhengHei／Noto Sans TC／Calibri 已安裝，親看中文無缺字框；COM Font.Name 不是 glyph fallback 證明。其餘渲染頁沒有逐頁視覺簽核 |

本輪沒有尚未解決的自動審核拒絕；以上為已停止的技術阻擋或明確未驗範圍。
