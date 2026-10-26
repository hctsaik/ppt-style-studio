# 匯出前檢查契約

`preflight.js` 是不修改輸入的檢查模組。瀏覽器載入 `deck.js` 後載入它，可呼叫 `Preflight.check(model, { deck: Deck })`；Node 可直接 `require('../preflight.js')`。回傳 `status`（`ready`／`advisory`／`blocked`）、中文 `label`、`canExport`、錯誤與建議數量，以及 `issues`。

每個問題都有 `severity`（`error`／`warning`）、`code`、頁面／元件的零起算 index、`slideKey`、可讀位置、原因與改善方式。表格內容不符時，盡可能提供 `rowIndex`、`columnIndex` 與來源 `sourceRow`；這些皆為零起算。UI 顯示時應加一。無法定位的整份文件問題使用 `null`。

## 三層判斷

| 結果 | 條件 | 互動 |
| --- | --- | --- |
| 可以匯出 | 沒有問題 | 直接匯出，不需每次彈窗。 |
| 建議調整 | 小字、已知底色低對比、密集表格、既有版面估算、透明文字框部分超界、既有縮字提示 | 仍可匯出；顯示可展開的建議，不自動更改字級或內容。 |
| 必須修正 | 空文件、非法頁面／元件結構、非有限或非正尺寸、超過 56 吋、確定可見圖形超界、無效文字／路徑、表格資料完整性失敗、待選素材缺失 | 阻擋這次匯出，提供位置、原因與修正建議。 |

文字框範圍不等於實際字形範圍。透明文字框只有部分超出投影片時，這個模組不宣稱文字已裁切；完全在頁外的文字框則確定無法顯示。一般文字長度、字寬、換行與行高估算一律不作為必須修正。精確的 PowerPoint 字型與實際換行仍須實機驗證；這個模組不冒充 PowerPoint 渲染器。

## 復用既有檢查

`Deck.assertTableExportComplete(model)` 是表格唯一的完整性規則來源，原本也由 `exportPptx`、`toPptx`、`tableHtml` 與 `tablePageRows` 使用。模組直接呼叫它，保留其 `TABLE_EXPORT_INCOMPLETE` code 及 `reason`，並補上使用者位置與改善建議。它已檢查來源值、native cells、列／頁與文件 manifest、固定寬度、欄寬列高、完整性與尺寸等。模組沒有另一套資料修復或捨棄資料的路徑。

`model.warns` 是現有字寬／段高估算；`tray.notes` 是既有閱讀提示；它們永遠為建議。既有 `item.shrunk` 只報告先前編輯產生的縮字，檢查不呼叫 `applyLabels` 或 `autoShrink`。對比只比較文字本身已知的不透明實色底；不猜測透明文字的背景，也不把裝飾色或品牌色當錯誤。

## 匯出流程整合責任

呼叫者應先取得一份確定的 model snapshot，再檢查並將**同一份** snapshot 傳給 `Deck.exportPptx`。檢查結果不是永久核准，設定／樣式／內容改動後應重新檢查。取消或匯出失敗應釋放下載鎖，連點只處理一次；檔名與參數亦應來自相同 snapshot。UI 不應把所有 `model.warns` 升級為阻擋。

靜態 Style Kit `.pptx`／`.potx`／色彩 `.xml` 必須走資產檢查；此 model 模組本身不能確認外部靜態 ZIP 的 relationships、theme parts 或下載網路狀態。對生成後 OOXML 與 Microsoft PowerPoint 的驗收亦分開報告。

## 回歸範圍

`node tools/preflight_model_test.js` 檢查全部註冊 model 頁面、9 組 presets × S/M/L、所有 570 個 native 單元件匯出、獨立 sentinel 色盤、表格寬高選項、正常內容、缺格／值被改寫／缺文件 mutation、無效幾何、可見超界、透明文字例外、小字／密集／對比僅建議、已保存資料恢復、樣式改變重新檢查，以及 frozen input 不被修改。DOM 的取消、連點、儲存恢復與 style 事件由 UI 整合測試驗證。
