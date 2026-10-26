# 原生樣式配色與文字醒目提示

Style Kit 的「主題色／常用色」決定下載檔案的一組 theme，不會在 PowerPoint 裡增加第二套 Quick Styles 選單。13 組範本、兩種配色都使用新的元件風格矩陣；7 欄 × 6 列是可編輯示範形狀。Ribbon 固定的組合、字色及排列由 Office 決定，不保證和範例逐格相同，不能把範例頁視作 Ribbon 操作已驗收。

| 色名 | Accent | 常用 RGB | 柔和文字醒目提示 |
|---|---|---|---|
| 紅 | 1 | D95D68 | F6D8DB |
| 黃 | 2 | E7BF4A | F9F0D4 |
| 藍 | 3 | 4E83CE | D5E1F3 |
| 綠 | 4 | 4B9679 | D4E6DF |
| 灰 | 5 | 7D8795 | E0E2E6 |
| 紫 | 6 | 9371C6 | E5DDF1 |
| 白 | 另選，非第七 Accent | FFFFFF | FFFFFF |

Text1、其他文字背景色槽、超連結色與字型不變。這組裝飾色不代表警告或成功語義。只有 Style Kit 透過明確的 Kit API 更新效果矩陣；一般 applyToZip 與固定母片的效果矩陣保持原樣。

## 六款元件風格

| 示範列 | 填色與框線 | 陰影（blur／offset／不透明度） | 文字 |
|---|---|---|---|
| 清爽線框 | 無填色、0.75 pt 同色框 | 無 | 同色深階 |
| 主色實心 | 主色、0.75 pt 深階細框 | 無 | 依對比選深／白 |
| 白框浮起 | 主色、1 pt 白框 | 4.2 pt／1.5 pt／20% | 依對比選深／白 |
| 柔底微浮 | 混白 88%→80%、0.75 pt 淺框 | 4.2 pt／1.5 pt／20% | 同色深階 |
| 主色微立體 | 5% 混白→5% 混黑微漸層、無框 | 7 pt／2 pt／18% | 檢查兩端對比 |
| 深色浮起 | 同色深階、無框 | 7 pt／2 pt／24% | 白字 |

native-styles.js 提供 HTML 與生成器共用的描述。kitThemeXml 寫入三種原生 fill、三種 line、三種 effect；沒有 bevel、glow 或 3D 材質，背景填色列表及字型方案保持原樣。42 個範例用 fillRef／lnRef／effectRef 組合，fontRef 與文字 run 的字色一致。自適應深階及字色屬於範例引用；不宣稱 fmtScheme 可以控制 Ribbon 每個選項的文字顏色或任意增加六種矩陣槽位。矩形是範例自身幾何，不是樣式可強制修改的幾何。

對比以 WCAG sRGB 相對亮度計算，範例至少 4.5:1，生成時留 4.6 的取整餘裕。DrawingML tint／shade 在**線性 RGB** 上運算，不能直接混合 sRGB 通道；以 PowerPoint 16.0.20527.20088 的實際解析色值核對，例如 E7BF4A 的 45% shade 得到 A28531，不是 685621。深底白字只暗化形狀引用，不改 Accent 色槽。[Tint 定義](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.drawing.tint?view=openxml-3.0.1)、[Shade 定義](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.drawing.shade?view=openxml-3.0.1)。

## 螢光筆

- 真正文字醒目提示是文字 run 的 a:highlight。柔色為 24% 基色混白的 RGB，隨文字編輯；不是透明矩形。
- 半高螢光筆是獨立可編輯 shape。改變文字長度或換行後需調整底帶；文字 highlight 不支援半高。
- 七個柔色寫入 p:clrMru。不保證各版本的醒目提示選單會載入或永久保留，也不宣稱 PPTX/POTX 能替換內建 15 色。
- 白色保留 FFFFFF，深底只是 Kit 的白色示範區。格式刷傳遞尚未經 Ribbon 操作驗證，且可能連帶字型與字級。

## 固定母片與保存

三頁主下載仍是封面、單欄、雙欄。原檔下載 bytes、master、七個 layouts、media、字型、固定紅色及原 fmtScheme 保持不變。一般 applyToZip 沒有呼叫 Kit 效果 API；固定母片的常用配色只修改六個 Accent，主題配色保留原 theme。兩種下載都包含柔色最近色記錄。新增組合頁需要明確選擇「母片 3＋示範 1 頁」。

Style Kit 配色來源與跟隨／獨立範本分開保存。舊 v1 設定沒有配色欄位時保留主題色意圖；新狀態預設常用色。沒有對應靜態資產的自訂主題停用主題版下載。設定改變後舊下載連結失效，匯出使用點擊當時的快照。

## 重建與測試

1. npm run build:native-styles
2. python3 tools/stamp_version.py
3. python3 tools/build_single.py
4. npm run test:native-styles

生成器以 stylekit/ 為唯讀種子，固定 ZIP 時間與排序；--check 檢查逐 byte 一致性。單檔保留 39 份舊資產並內嵌 78 份新資產，新資產以完整相對路徑為 key。色盤 XML 只包含色彩集，不包含效果矩陣。

測試覆蓋 13×2 配色的 PPTX／POTX／XML、十二色槽、矩陣參數、關聯及 content types、原母片保護、highlight 與半高 shape、獨立對比計算、故意錯誤角色／字色／陰影 mutation、來源和單檔 UI、保存與失效連結。PowerPoint 開檔、轉圖、編輯另存重開另行記錄；XML／DOM／COM 通過都不能取代 Ribbon 新形狀套用或原生高亮選單操作。
