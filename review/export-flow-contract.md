# 匯出生命週期與快照契約

`ExportFlow.create({ revision, build, check, export, report })` 管理一次匯出工作。`run(params, options)` 複製參數與選項一次，取得或建立 model，將同一個 model 交給檢查與 native exporter；成功後才把結果交給呼叫者儲存。模組本身不下載、不顯示確認彈窗、不改資料或字級。

需要圖片等非同步準備時，可提供 `options.prepare = async snapshotParams => model`。它在相同下載鎖與 revision 範圍內執行，狀態先為 `preparing`，完成後才檢查 model。準備期間取消、切換樣式或 invalidate 都會丟棄結果且不進 native exporter；準備函式不會傳給 exporter。準備失敗亦釋放鎖，能重新下載。

| 狀況 | 預期行為 |
| --- | --- |
| 正常 | 檢查 → 匯出 → 呼叫者儲存；一次下載。 |
| 僅建議 | 正常匯出，不要求確認。 |
| 必須修正 | `EXPORT_BLOCKED`，不呼叫 native exporter、不儲存。 |
| 處理中連點 | 第二次回 `EXPORT_BUSY`；第一個工作維持唯一的匯出。 |
| 檢查時取消 | `EXPORT_CANCELLED`，不進 exporter。 |
| 匯出時取消 | 讓不可中止的 serializer 完成，但丟棄結果；不儲存。Promise 結束後釋放鎖，可再下載。 |
| 匯出期間內容／樣式改變 | revision 不同或明確 invalidate，回 `EXPORT_STALE`；不儲存過期結果，可重新下載最新內容。 |
| 建立／檢查／匯出例外 | 回傳例外、釋放鎖，修正後可以重試。 |
| 保存／恢復 | 恢復後下一次下載重建／檢查新快照，不沿用舊核准。 |

複製函式保留 `NaN` 與 `Infinity`，讓檢查模組能阻擋它們；不能以 JSON round trip 把非法數字變為 `null` 而掩蓋來源。資料保存的 JSON 格式另受現有保存流程約束，生命週期測試使用完整字串確認 `00123`、`9007199254740993` 與 `1.123456789` 不被數值轉換。

`cancel()` 不能停止已執行的 PptxGenJS 內部運算；保留鎖到 Promise 結束可防止取消後立刻重按造成兩份大型序列化同時運行。取消／過期回應應由 UI 顯示簡潔狀態，不當作產品資料錯誤。

## 入口範圍

所有動態 native PPTX 路徑應經 `checkedExport`，包含整包、單頁、單元件、四頁方案元件、搜尋選取、食譜、單圖示／圖示包、表格與待選素材。單元件須先取得 `elementModel`，再交相同檢查流程，不能直接呼叫 `exportElement` 跳過檢查。

Style Kit 的靜態 `.pptx`／`.potx`／色彩 `.xml` 不經 model 建立；其下載事件必須確認當前主題與資產吻合，並以全部 13 主題的建置資產檢查保障封裝內容。靜態主題檢查不是 `Preflight.check(model)` 的能力，不應顯示成動態 model 已通過。

SVG、PNG、TSV、JSON 等明確選擇的非 PPT 輸出保留自身檢查與儲存流程，不聲稱它們通過 native PPTX 結構檢查。

## 測試

`node tools/export_flow_test.js` 以可手動完成的 Promise 測生命週期，沒有定時等待、瀏覽器或 Office 依賴。驗證同一份快照、提供 model 不重建、advisory／blocker、取消與連點、匯出中 style／data 改變、explicit invalidate、idle invalidate、三階段例外恢復、非有限數值、保存恢復，以及瀏覽器 UMD API。非同步 prepare 另驗證快照參數、連點不啟動第二次準備、取消／改 style 不進檢查及匯出、準備失敗後重試，與 prepare 不漏到 exporter options。

此測試不宣稱真正瀏覽器按鈕、檔案下載或 PowerPoint 渲染已驗證；DOM 入口和 Microsoft PowerPoint 實機證據需分開報告。
