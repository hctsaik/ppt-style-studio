# 快速樣式與柔和螢光筆

本輪依使用者確認的文字設計實作，新增一個聚焦入口。選一色後只預覽六款：柔底、細框、實心、側邊條、全字柔帶、下緣半筆。原有 Style Kit 範本 gallery 保留原用途。

## 顏色與編輯契約

- 主題來源直接解析當前 `P`／`PD`／`PT`，包含自訂 palette；不把 `semWarn`／`A`／`AL` 當裝飾色。
- 常用色順序及固定基色：紅 `D95D68`、黃 `E7BF4A`、藍 `4E83CE`、綠 `4B9679`、灰 `7D8795`、紫 `9371C6`、白 `FFFFFF`。全站 theme 更換不改這七色。
- 柔底為基色 10%＋白 90%；細框透明、1.25 pt；側條 3 pt；方塊小圓角 7 pt，左右留白 14 pt、上下 10 pt，預設 3.4 × 1 吋。
- 所有文字使用當前 body 字型、20 pt，保留輸入，不截斷或縮字。`noAutoShrink:true` 是與既有 Deck 匯出器共用的明確契約。
- 全字柔帶 24% 不透明度；下緣半筆 35%。每個手動換行有獨立原生底帶與文字框，組成一個原生群組，不是圖片，也不是精準逐字的 PowerPoint highlight。
- 在網站修改文字會重建底帶。在 PowerPoint 修改文字後，底帶不會自動追蹤字寬；可解組調整。整組 resize 同時改變文字與底帶尺寸。
- 白色仍是真白；白色細框與筆帶使用白字並標示適合深底簡報。預覽深底 `252A34` 不進匯出 items，`backgroundIntent:'dark'` 保留於 model／slide／group 作檢查提示。其他色使用深字，實心選適合底色的前景。
- 網站選 theme 會連動；匯出的 native RGB 是當下快照，不宣稱在 PowerPoint 切換 theme 後會自動改色。
- 不新增陰影、漸層或 raster 元件。

## 整合 API

`quickstyles.js` 同時支援瀏覽器 `window.QuickStyles` 及 CommonJS。它只產生 model 與 UI，不另寫匯出器：

```js
QuickStyles.render(container, params, {
  state: savedQuickStyle,
  onChange(state) { /* persist keys, text and sizing */ },
  async onDownload(snapshot) {
    // snapshot = {model, params, selection, filename}
    // The Studio host first refreshes this snapshot using current global params
    // and snapshot.selection, then checks and exports that same model.
    // Return false on cancellation; throw on failure.
  }
});
```

`buildModel(params, state)`、`snapshot(params, state)`、`getState(container)`、`palette(params, source)` 可獨立使用。保存來源與角色／固定色 key，不保存過期 RGB。重繪取得最新 theme；常用選色與文字保留。匯出進行中鎖住第二次下載，取消或失敗都恢復控制。

輸出沿用 `Deck.exportPptx(env, snapshot.params, {model:snapshot.model})` 的 native group pipeline。單檔版必須由既有建置工具重新產生，不手改。

## 已完成的測試

在 Cola 使用既有 Node runtime 與專案隨附 PptxGenJS 3.12.0／JSZip，不使用外部 runtime 的 PptxGenJS 4.0.1：

```powershell
node tools/quickstyles_test.js
```

結果：13 項契約／控制器測試通過，9 份 native PPTX 匯出驗證通過；native tests 經 `tools/bundled_export_env.js` 固定使用專案實際發布的 exporter。

- 獨立 sentinel：P `1267A3`、PD `4A205F`、PT `F2D7B4`，與 warning `DEAD00`、accent `00DEAD` 明顯不同。預期角色色為固定測試值；故意錯綁 warning 的 mutation 會被拒絕。
- 全部 9 組 presets 加自訂 palette；七個常用色跨所有主題不變，三個主題角色跟隨。
- 保存／恢復、取消、重複點擊、下載失敗後恢復、進行中全站 style 更換，以及主題色回到最新 palette。
- 6 種樣式加 3 種白色透明樣式共 9 份 PPTX，驗證 native shape/text/group、文字原文、20 pt、字型、RGB、alpha 24%／35%、沒有 `normAutofit`、沒有圖片與陰影、沒有預覽深底 shape。

控制器測試使用小型節點 adapter，只證明 handler／狀態行為；不是完整 DOM、瀏覽器排版或 Microsoft PowerPoint 的視覺驗收。真 PowerPoint 驗收由獨立 acceptance 工作提供。字寬估算不視為可靠溢出證據；長行維持原字級，由統一匯出前檢查提出與證據相符的建議或阻擋。

## 參考圖限制

本代理未親看 `image(20261025-185743).png`。已走 Library 官方 resolved-reference materialization，首次下載失敗，一次重試進入 xattr 步驟後因 Windows Python 缺少 `os.setxattr` 失敗；最終目標檔案不存在。未改 helper、未 raw URL 下載、未繞過 metadata。

之後 parent 提供確認過的完整文字設計並授權依此繼續實作，因此本結果是該文字設計的實作，不宣稱與未取得的圖片逐像素比對。
