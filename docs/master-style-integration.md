# 母片與原生樣式

母片頁提供兩個獨立下載，使用相同的配色快照、固定母片字型與主題效果。

- **下載三頁母片**：封面、單欄內容、雙欄內容，維持既有三頁內容與紅色外觀。
- **下載卡片與文字素材**：兩頁共 70 個原生可編輯矩形，以及一頁八色文字醒目提示。素材不放進主三頁。

原「範本 Style Kit」與「快速樣式」入口均導向母片頁。舊模組、靜態資產與偏好保留相容性，但不把舊 13 主題偏好移到固定母片。原生配色只有「常用色」與「原母片主題色」兩種選擇，不跟隨網站風格。

## 原生主題與素材的差異

配色選項決定下載檔的一組 Accent 1–6，不新增第二組 Ribbon。白色仍可另選，Text1 維持深色。兩個下載沿 relationships 找到 presentation 與所有有效 master 的 theme，更新指定填色、線條、效果清單及 Accent，保留字型、文字色槽、背景樣式與 notes 主題。若主題與 notes 共用，會在寫入前停止並說明，不把未修改當成成功。

Office 內建樣式共享填色槽，無法讓同一槽只加深彩色白字而維持純白線框底。因此原生填色採安全深階，部分線框樣式呈灰底；需要精確白底外卡時，使用可編輯矩形素材。素材保有十款外觀，前三款是深灰框、細灰框與主色框的外層白卡。它們不是十個新 Ribbon 按鈕，也不會改變任意形狀的幾何。

原生螢光筆八色為 F6D8DB、F9F0D4、7C9CC3、D4E6DF、E0E2E6、E5DDF1、595959、1F3864，使用 a:highlight，沒有獨立底帶。深灰與深藍的素材文字以白字展示。這只是範例文字的字色，不會在套用醒目提示時自動改動使用者字色。近期色記錄不保證各版本選單顯示、排序或永久保留，也不替換內建 15 色。

原始四頁來源檔的 bytes 保持不變。三頁母片為衍生檔，不能宣稱全部 theme bytes 不變。原標誌、公司資訊與頁尾依已確認範圍保留，網站按鈕和下載檔名採中性名稱。

## 建置與檢查

以 tools/build_single.py 同步單檔版。tools/build_master_previews.js 將最終三頁母片的 Microsoft PowerPoint 960×540 PNG 轉圖原 bytes 內嵌，附來源與圖片 SHA-256，沒有重新繪製縮圖。

針對主題關係、保護清單與失敗原子性執行 tools/native_master_profile_test.js；兩個出口與素材封裝執行 tools/fixed_master_materials_test.js；介面、導覽和匯出快照執行 fixed_master_ui_test.js、navigation_test.js 與 export_entrypoints_test.js，來源版與單檔版皆測。

Microsoft PowerPoint 的 Shape.ShapeStyle API 與 Ribbon 點擊是不同驗證層級。API、開檔、轉圖、儲存重開成功不等於 Ribbon 選單操作或近期色選單已驗。真正 Android 與 POTX 新建也需獨立驗證。
