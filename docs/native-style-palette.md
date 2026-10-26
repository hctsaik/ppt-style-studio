# 原生樣式配色與文字高亮

Style Kit 的「主題色／常用色」選項決定下載檔的一組 theme，不會在 PowerPoint 註冊兩套獨立 Quick Styles 選單。13 個範本皆保留原 fmtScheme 的六種示範效果：外框、填滿、淺框填滿、輕微、中度、強烈。原生選單的外觀與排列仍由 Office 版本決定；42 格形狀頁是可編輯示範，不是 Ribbon 截圖。

| 色彩 | Accent | 常用 RGB | 柔色文字高亮 |
|---|---|---|---|
| 紅 | 1 | D95D68 | F6D8DB |
| 黃 | 2 | E7BF4A | F9F0D4 |
| 藍 | 3 | 4E83CE | D5E1F3 |
| 綠 | 4 | 4B9679 | D4E6DF |
| 灰 | 5 | 7D8795 | E0E2E6 |
| 紫 | 6 | 9371C6 | E5DDF1 |
| 白 | 另選，非第七 Accent | FFFFFF | FFFFFF |

Text1、其他文字／背景色槽、超連結色、字型與效果矩陣不變。上述裝飾色不代表警告或成功語義。

## 螢光筆

- 原生文字醒目提示是文字 run 的 `a:highlight`。柔色是實色混白，隨文字編輯；不是透明矩形。
- 半高螢光條是獨立可編輯 shape。變更文字長度或換行後需調整底帶；無法以原生 highlight 指定半高。
- 七個柔色存入 `p:clrMru`。不保證各版本的高亮下拉選單會載入或永久保留，也不能用 PPTX/POTX 替換內建 15 色。
- Kit 有可直接編輯的七色文字範例。白色保留真白，深底只是 Kit 示範區；固定母片匯出不會被加上深底。

## 母片與保存

三頁主下載仍為封面、單欄、雙欄。原附件下載 bytes、master、七個 layouts、media、字型及固定紅色保留。常用配色只修改六個 Accent；主題配色保留原 theme。兩種下載都包含柔色最近色記錄。新增組合頁需要明確選擇「母片 3＋示範 1 頁」。

Style Kit 的配色與跟隨／獨立狀態分開保存。舊 v1 設定沒有配色欄位時保留原主題色意圖；新的狀態預設常用色。無對應資產的自訂全站主題不冒用靜態主題檔。配色改變後，舊下載連結失效；匯出母片使用點擊時的配色快照。

## 重建與測試

1. `npm run build:native-styles`
2. `python3 tools/stamp_version.py`
3. `python3 tools/build_single.py`
4. `npm run test:native-styles`

生成器以版本控制中的 `stylekit/` 為唯讀種子，使用固定 ZIP 時間與排序，可用 `node tools/build_native_stylekit.js --check` 檢查逐 byte 一致性。單檔保留 39 份舊資產並加入 78 份新資產；新資產以完整相對路徑作 key。

回歸包含所有 13 × 2 × 3 資產、12 色槽、格式矩陣、原 parts、schema 對齊列舉、錯綁 warning／role mutation、真正文字高亮與半高形狀區別、下載快照、連點、回呼取消／錯誤恢復、保存與換 style。母片沒有一般 UI 取消按鈕；取消回呼測試不等於 UI 取消驗收。

實際 PowerPoint 仍須另外驗證開檔、轉圖、另存重開，以及可見 Ribbon 中的新 shape／選色／新文字／移除高亮操作。XML、DOM 和 COM 成功都不單獨證明這些 Ribbon 操作通過。
