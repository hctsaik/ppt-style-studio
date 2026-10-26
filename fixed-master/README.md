# 投影片母片：雙三頁出口與不變來源

## 不變安全基準

- `Fixed_Red_Template.pptx` 是原始四頁附件的完整原 bytes；來源不覆寫、不永久刪頁。
- Library：`libfile_91da4dec0718819188da04d164eaf803`，version 0。
- SHA-256：`1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae`。
- `source-manifest.json` 記錄原封裝 45 parts；4 頁、1 master、7 layouts、16:9／1280×720，字型未內嵌。

## 目前兩個獨立下載

1. **`固定紅色_三頁母片.pptx`**：原 layout1 的 native 封面「專案重點與下一步」，接來源 slide1 單欄及 slide2 雙欄。封面摘要「聚焦主要判斷，保留執行依據」、短句「優先確認關鍵事項」，無下緣底帶。這不是來源附件前三頁；原比較／報表不在活動範本。
2. **`固定紅色_卡片與文字素材.pptx`**：兩頁共 70 個原生矩形卡片，另加一頁八色 `a:highlight` 文字，恰三頁。採固定母片的字型、配色、主題 profile 與 layout6，不使用舊 13 款 Kit seed。

兩出口使用同一份 common／theme 快照及下載鎖。沒有 3＋1、逐款下載或效果開關，素材不會自動加入主檔。舊 Kit／quick 導覽一律到母片，保留舊 storage／模組但不把其全站跟隨偏好移到母片。

## 固定外觀與增強主題的邊界

`fixed-master.js` 不接受 Deck 全站配色／字型。三頁紅標題、微軟正黑體、bullet、行距、原標誌與黑頁尾保留。固定標題 `C00000` 不由 Accent1 定義；common 的紅 `D95D68` 是另一個裝飾色。

衍生檔會增強主題的填色／線條／效果清單，不能再宣稱所有 theme bytes 不變。`native-styles.js` 沿 presentation 與有效 master relationships 找到實際 theme；原件對應 `ppt/theme/theme1.xml` 與 `ppt/slideMasters/theme/theme2.xml`。保留 fontScheme、文字／背景色槽、超連結、背景樣式與矩陣名稱。common 僅另外替換 Accent1–6；theme 保留原 Accent。

notes 的 theme（原件 `ppt/notesMasters/theme/theme3.xml`）及 notes parts 不受主題增強影響。若與主檔共用 theme、關係缺失或無法安全解析，會在寫入前停止；不靜默跳過。兩模式都更新 `ppt/presProps.xml` 的八色 `p:clrMru`。

原生樣式共享填色槽，因此部分線框樣式實際呈灰底。精確白底外卡由可編輯素材提供；十款素材不是十個新 Ribbon 按鈕，也不控制任意圖形幾何。素材的局部填色、框線、柔影保留，字型／色槽及共同 profile 與主母片一致。

八色高亮為 `F6D8DB F9F0D4 7C9CC3 D4E6DF E0E2E6 E5DDF1 595959 1F3864`，沒有白色高亮或獨立底帶。深灰／深藍的素材範例使用白字，這不代表套用高亮會自動改使用者字色。MRU 不保證在各版本選單顯示、排序或永久保留，也不替換內建 15 色。

## 原生封裝保護

以 JSZip 讀不變來源產生衍生檔，不 import/re-export 或近似重建 master。

- 主下載移除原 slide3／slide4 及其兩個 relationships、notesSlide3 及 relationship；新增 layout1 封面及 relationship。
- 來源 slide1／slide2 僅改 `a:fld type="slidenum"` 快取為 2／3，其餘 XML bytes 不變。保留 notes1／notes2。
- 更新 `[Content_Types].xml`、`ppt/presentation.xml`、其 relationships、`docProps/app.xml`；sldIdList 恰三筆。
- 保留 1 master、7 layouts、media 原 bytes；只有上述 metadata、頁碼、兩個 reachable themes 與 MRU 是明確例外。
- 素材以相同衍生 package 替換三個可見 slide XML 與 layout6 links；仍恰三頁，無隱藏範例或 raster 卡片。原來源檔不變。
- 新增／修改 ZIP entries 沿用固定時間。相同輸入產生穩定 bytes，source／offline 一致；下載檔 hash 不等於原來源 hash。

## 建置與檢查

```sh
python3 tools/build_fixed_master_assets.py
python3 tools/build_single.py
npm run build:master-samples
npm run test:fixed-master
npm run test:master-integration
npm test
```

`native_master_profile_test.js` 驗關係解析、notes 共享阻擋、protected parts 與原子失敗；`fixed_master_materials_test.js` 驗兩出口、70 卡片、八色高亮及同 profile。UI／navigation／export-entrypoint tests 驗正常／單檔狀態、舊入口遷移、焦點、快照鎖、重試及錯誤恢復。JSDOM 捕捉真 Blob bytes，不代表瀏覽器已落盤。

## 視覺證據與限制

主三頁預覽是 Microsoft PowerPoint `Slide.Export` 的 960×540 PNG 原 bytes，含來源／圖片 SHA，見 `fixed-master-previews.js`；common／theme 三頁轉圖與增強前基準相同。素材網頁預覽仍是 HTML 示意。

本輪 PowerPoint COM 84 次真正 `Shape.ShapeStyle` 套用、代表素材複製／改字／保存重開與主頁轉圖已有驗證；沒有以直接覆寫效果假裝樣式繼承。一般新增文字框測得微軟正黑體。字型未內嵌，其他裝置仍可能不同。

Ribbon 點擊、MRU 下拉、POTX 新建與真 Android 未驗。DOM／CSS 不等同瀏覽器視覺認證；不使用本地 browser／HTTP／CDP 繞限制。標準 Blob 出口可能受受管瀏覽器政策阻擋，產生成功不保證落盤，未設其他 scheme／host／下載橋梁。
