# 固定紅色母片：十三頁、五個具名單欄主題

## 不變來源

原始四頁附件保留為 `Fixed_Red_Template.pptx`，53,913 bytes，SHA-256 `1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae`。來源品牌、logo、頁尾與內容按使用者要求保留。`source-manifest.json` 仍記錄原件的 4 頁、1 master、7 layouts 與 45 個 parts；它不是衍生下載檔清單。

## 兩個下載

主檔 `固定紅色_十三頁母片.pptx` 順序固定：封面；單欄 07 E01 v5、06 D3-01 Category10、03 Seaborn04 muted6、10 E13 purplepassion、04 D3-02 Observable10；雙欄；兩頁矩形樣式；八色原生文字螢光筆；Cards & Panels；A16；A18。副檔 `固定紅色_卡片與文字素材.pptx` 是主檔第 8–10 頁的三頁素材，便於取用。

五個單欄各自有具名 layout、master 與 theme，PowerPoint 的「新增投影片／版面配置」可沿用，或直接複製第 2–6 頁。07 為首選；封面、雙欄與素材共用 07。來源母片加五個單欄 clone，因此主檔共有 6 個有效 master。舊 common／theme 狀態仍可讀，但不再改變已選五款。

| ID | 六個 Accent |
| --- | --- |
| 07 | 5470C6 91CC75 FAC858 EE6666 73C0DE 3BA272 |
| 06 | 1F77B4 FF7F0E 2CA02C D62728 9467BD 8C564B |
| 03 | 4878D0 6ACC64 D65F5F 956CB4 D5BB67 82C6E2 |
| 10 | 8A7CA8 E098C7 8FD3E8 71669E CC70AF 7CB4CC |
| 04 | 4269D0 EFB118 FF725C 6CC5B0 3CA951 FF8AB7 |

## 原生能力與保護

先在單一來源鏈套 R2 balanced-v2，再建立五組獨立鏈。沿 relationships 解析 theme，保留 fontScheme、文字／背景色槽、bgFillStyleLst、原 master／layout／media bytes 與所有保留 notes bytes。原單欄內容複製五次，每頁只新增一小段可編輯原生 highlight；原雙欄僅換頁碼 7。原件不寫入。若不同母片已帶不同色盤，通用單 profile API 會在任何寫入前拒絕覆蓋。

R2 的 fill／line／effect 清單與指定試色成品完全相同。原生槽位共享，因此部分內建線框樣式是灰底；白底外卡請用素材。70 個矩形預設不是新增 70 個 Ribbon 按鈕。A16／A18 保留各 28 組，等比例重排為 16:9 的密集素材（9pt，A16 A/B 小字標 8.5pt），可複製放大。

高亮八色固定 `F6D8DB F9F0D4 7C9CC3 D4E6DF E0E2E6 E5DDF1 595959 1F3864`，皆真 `a:highlight`，沒有獨立底帶。五單欄共用一組 `p:clrMru`；近期色顯示、順序及保留時間由 Office 決定，不替換內建 15 色。深灰／深藍範例以白字展示，套用醒目提示不會自動修改使用者字色。

## 重建與驗證

`npm run build:master-samples` 生成 template-thirteen.pptx 與 materials-07.pptx；`npm run test:master-thirteen` 檢查明確頁序、獨立主題關係、保護零件、R2 與原生結構。修改後先以 `python3 tools/stamp_version.py` 更新相依檔快取戳，再以 `python3 tools/build_single.py` 重建單檔。

本輪 PowerPoint 16.0.20527.20088 已開啟並轉圖 13+3 頁。在測試副本從五個具名 layout 各新增投影片，對矩形真正呼叫 Shape.ShapeStyle 1–42（共 210 次），無直接覆寫 fill／line／shadow；保存重開讀值一致。新文字框字型為微軟正黑體，五段原生高亮改字後保存重開成功。使用者原有簡報維持 4→4。十三頁 PNG 原 bytes、來源 hash 保存在 fixed-master-previews.js。

字型未內嵌，其他裝置可能顯示不同。A16／A18 為密集可編輯素材，不承諾投影正文可讀性；Cards／A16／A18 的元件顏色按匯出時的 07 配色解析，不保證日後在 PowerPoint 換主題時自動變色。Ribbon 點擊、MRU dropdown、POTX 新建、Android 未驗。表頭四模式及退役控制只完成模型／DOM／OOXML 驗證，表格 PowerPoint 實視未驗。JSDOM 與封裝測試不等於瀏覽器下載落盤；既有 CUA 擷取失敗未繞過，也未改安全設定。
