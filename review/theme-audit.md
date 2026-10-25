# Theme/style audit

Base: `bc7aa828cc084b07084f6da8afd43fa847f7c9b7`. Local role/serialization audit; PowerPoint visual evidence is maintained separately.

## Confirmed local correction

E7 `quote2` used hardcoded `1F3864` for its quote, name and three context pills (three source sites / five editable objects). They now use `PD`. P-linked backgrounds already followed the theme. Geometry, fonts, neutral text, and shadows are unchanged.

The independent sentinel contract requires every affected run to equal PD. A deliberate `1F3864` mutation is rejected. A separate mutation binding decorative A16 03E bands to semWarn is rejected by the P-hue contract.

## Coverage

- All 76 registered pages, all 9 presets plus a deliberately distinct sentinel palette: model and SVG.
- Native whole-deck export: blue/navy, purple/wire, green, wine and sentinel; 72 standard pages plus the dedicated four catalogue pages per palette.
- This invocation: 760 SVG pages, 380 native pages, 126191 assertions; single-file parity checked: false.
- Style Kit assets: separate `tools/stylekit_assets_test.py` validates 13 palettes / 39 files, all 12 color slots, relationships, content types, four slides, masters/layouts and fmtScheme.
- Browser pixel appearance, live download clicks and Microsoft PowerPoint rendering are separate acceptance layers.

## Fixed-color policy

- White/black and neutral panels, rules, body/reference grays remain fixed unless exposed token governs them.
- Icon success/attention/warning/danger/neutral are explicit semantic categories.
- C2 At risk has fixed categorical 8EA9DB; preserve status meaning.
- Existing brand/logo image bytes and manual overrides are not retinted.
- Static Style Kit uses its selected named palette; custom global colors cannot silently claim to change these files.

Low-chroma fixed reference colors are explicit: `5B6474` text, `D0D7E2` grid, `B8C4D3` map boundary and `8A94A6` guide line. Fixed icon semantic colors are success `207345`, attention `806000`, warning `A14D00`, danger `B3261E`, neutral `596675`. Existing image/logo bytes and manual overrides are preserved.

## All registered pages

| Code | Page key | Page | Dynamic roles observed | Fixed paint slots |
|---|---|---|---|---:|
| 00 | catalog | 總覽 | P, PD, PT, A, ink, t2, mute, line, l2, fill, cardLine, cnC, semWarn | 66 |
| A0 | frame | 頁面骨架 | P, PD, A, ink, t2, mute, l2 | 6 |
| A1 | frame2 | 頁面骨架（二） | P, PD, A, ink, t2, mute, l2, semWarn | 8 |
| A2 | cards | 卡片與面板 | P, semGood, A, ink, t2, mute, line, l2 | 25 |
| A3 | tags | 標籤與編號 | P, PD, A, ink, t2, mute, fill, semWarn | 36 |
| A4 | tags2 | 標籤與編號（二） | P, semGood, A, ink, t2, mute, l2, semBad | 17 |
| A5 | labels | 標籤元件 | P, PD, A, ink, t2, mute, line, l2, fill | 22 |
| A6 | labels2 | 標籤元件（二） | P, PT, A, ink, t2, mute, line, l2, fill | 20 |
| A7 | lists | 清單與勾選 | P, semGood, A, ink, t2, mute, line | 14 |
| A8 | circles | 圓形與流程鏈 | P, PD, A, ink, t2, mute, line, l2 | 30 |
| A9 | circles2 | 圓形與流程鏈（二） | P, PD, A, ink, t2, mute, line, l2 | 12 |
| A10 | conn | 連接線與箭頭 | P, A, ink, t2, mute, cnC | 14 |
| A11 | conn2 | 連接線與箭頭（二） | P, PD, PT, A, ink, t2, mute, line, cnC | 12 |
| A12 | icons | 圖示精選 | P, semGood, A, ink, t2, mute, l2, cnC, semWarn | 3 |
| A13 | iconcomponents | Icon 元件 | P, A, ink, t2, mute, line, l2, semWarn | 6 |
| A14 | iconvariants | Icon 底座變體 | P, A, ink, t2, mute | 86 |
| B1 | flow | 流程圖符號 | P, PD, PT, A, ink, t2, mute | 13 |
| B2 | flow2 | 流程圖範例 | P, PD, PT, A, ink, t2, mute, l2, cnC | 27 |
| B3 | patterns | 常用流程組合 | P, A, ink, t2, mute, l2, cnC, semWarn | 26 |
| B4 | patterns2 | 常用流程組合（二） | P, A, ink, t2, mute, l2, fill, cnC | 20 |
| B5 | flex | 可調數量流程 | P, A, ink, t2, mute, l2, fill, cnC, semWarn | 31 |
| B6 | steps | 編號步驟 | P, A, ink, t2, mute, line, l2, cnC | 28 |
| B7 | struct | 結構元件 | P, A, ink, t2, mute, line, l2, cnC | 39 |
| B8 | agenda | 議程與章節 | P, A, ink, t2, mute, line, l2 | 29 |
| B9 | people | 人員與組織 | P, PD, A, ink, t2, mute, line, l2, cnC | 39 |
| C1 | kpi | KPI 卡 | P, semGood, A, ink, t2, mute, line, l2, semBad | 34 |
| C2 | rating | 評比指標 | P, PD, A, ink, t2, mute, line, l2 | 56 |
| C3 | tline | 時間軸與甘特 | P, A, ink, t2, mute, line, l2, semWarn | 61 |
| C4 | chart | 圖表頁零件 | P, A, ink, t2, mute, line, l2 | 50 |
| D1 | cmp | 前後對比 · 數字 | P, semGood, A, ink, t2, mute, line, l2, fill | 35 |
| D2 | asis | 前後對比 · 版型零件 | P, A, ink, t2, mute, line | 37 |
| D3 | cmp2 | 步驟與欄位對比 | P, semGood, A, ink, t2, mute, line, l2, fill | 53 |
| D4 | cmp3 | 表格與方案比較 | P, PD, A, ink, t2, mute, line, l2 | 27 |
| D5 | mtx | 矩陣與風險 | P, PD, A, ink, t2, mute, line, l2, fill | 53 |
| D6 | rca | 原因分析 | P, PD, PT, A, ink, t2, mute, line, l2, cnC, semWarn | 22 |
| D7 | rca2 | 管理框架 | P, PD, A, ink, t2, mute, line, l2, cnC, semWarn | 53 |
| D8 | decide | 決策與下一步 | P, semGood, PD, A, ink, t2, mute, line, l2, semBad | 37 |
| D9 | biz | 商業框架 | P, A, ink, t2, mute, line, l2, cnC | 62 |
| D10 | biz2 | 組織、時程與畫布 | P, PD, A, ink, t2, mute, line, l2, cnC, semWarn | 29 |
| D11 | pitch | 提案與募資 | P, A, ink, t2, mute, line, l2 | 29 |
| E1 | annot | 標註 | P, A, ink, t2, mute, l2, semWarn | 44 |
| E2 | emph | 強調與註腳 | P, semGood, A, ink, t2, mute, line, l2, semWarn | 24 |
| E3 | emph2 | 強調與註腳（二） | P, A, ink, t2, mute, l2, semWarn | 40 |
| E4 | shots | 截圖與裝置框 | P, A, ink, t2, mute, line, l2, semWarn | 29 |
| E5 | story | 引言與故事 | P, A, ink, t2, mute, line | 14 |
| E6 | quote | 整頁引言 | P, PD, ink, t2, mute | 3 |
| E7 | quote2 | 整頁引言・主色卡 | P, PD, ink, t2, mute | 13 |
| E8 | story2 | 引言與故事（二） | P, PD, A, ink, t2, mute, l2 | 22 |
| E9 | map | 地圖與據點 | P, PD, A, ink, t2, mute | 48 |
| E10 | map2 | 亞洲與世界地圖 | P, PD, A, ink, t2, mute | 136 |
| F1 | cover | 封面頁 | P, ink, t2, mute, l2 | 2 |
| F2 | cover2 | 封面・左圖右文 | P, ink, t2, mute, l2 | 6 |
| F3 | cover3 | 封面・大數字 | P, ink, t2, mute | 5 |
| F4 | section | 章節分隔頁 | P, ink, t2, mute, l2 | 13 |
| F5 | section2 | 章節・大編號＋目錄 | P, ink, t2, mute | 4 |
| F6 | section3 | 章節・置中大標 | P, ink, t2, mute, line, l2 | 9 |
| F7 | closing | 結尾 Q&A 頁 | P, ink, t2, mute, l2, cardLine | 21 |
| F8 | closing2 | 結尾・Q&A 大字 | P, PD, ink, t2, mute, line | 12 |
| F9 | closing3 | 結尾・純感謝＋聯絡 | P, ink, t2, mute, l2 | 12 |
| F10 | ex1 | 範例：三圓架構 | P, PD, A, ink, t2, mute, l2 | 25 |
| F11 | ex2 | 範例：框架流程 | P, PD, A, ink, t2, mute, line, fill, cardLine, cnC | 40 |
| F12 | ex3 | 範例：分支樹狀 | P, PD, A, ink, t2, mute, line, fill, cardLine, cnC | 39 |
| F13 | sum | 頁型：結論＋3 支撐 | P, A, ink, t2, mute, l2 | 15 |
| F14 | pcn | 頁型：問題→對策→下一步 | P, A, ink, t2, mute, l2, semWarn | 22 |
| F15 | weekly | 頁型：週報一頁 | P, semGood, PD, A, ink, t2, mute, line, l2, semWarn, semBad | 34 |
| G1 | profile | 自我介紹 | P, A, ink, t2, mute, line, l2, fill | 30 |
| G2 | skills | 技能與成就 | P, A, ink, t2, mute, line | 15 |
| G3 | skills2 | 技能與成就（二） | P, PD, A, ink, t2, mute, line, l2 | 17 |
| G4 | star | 專案案例 STAR | P, A, ink, t2, mute, l2 | 25 |
| G5 | folio | 作品集版面 | P, PD, A, ink, t2, mute, line, l2 | 18 |
| G6 | plan | 30-60-90 與自我推薦 | P, PD, A, ink, t2, mute, l2 | 20 |
| X1 | guide | 風格規範 | P, semGood, PD, PT, A, ink, semWarn, t2, mute, l2, cardLine, cnC, semBad | 2 |
| A15 | schemeemphasis | 方案元件・只有強調 | P, PD, PT, mute | 30 |
| A16 | schemebody | 方案元件・內文＋強調 | P, PD, PT, t2, mute | 34 |
| A17 | schemeicon | 方案元件・Icon＋只有強調 | P, PD, PT, mute | 46 |
| A18 | schemeiconbody | 方案元件・Icon＋內文＋強調 | P, PD, PT, t2, mute | 50 |

The JSON companion records each dynamic color slot and its role dependencies, and each fixed color slot with its reason. Dependencies are identified by changing one input at a time; expected bug-regression contracts are independently specified, not copied from a resolver.

## Download/serialization paths

| Entry | Scope | Implementation |
|---|---|---|
| bAll | all standard pages | Deck.exportPptx (excludes long catalogues) |
| bOne | current page | Deck.exportPptx only:[key] |
| bSchemeCatalogue | A15-A18 four-page pack | Deck.exportPptx only:SCHEME_CATALOGUE_KEYS |
| selected element PPTX | current group | Deck.elementModel -> checkedExport |
| selected element SVG/PNG | current group | Deck.elementSvg / browser raster conversion |
| search selected | one page per selected group | Deck.trayDeck -> exportPptx |
| recipe | recipe page keys | Deck.exportPptx only:keys |
| iPackDownload | selected icon 24+9 native variants | Deck.iconPackModel -> exportPptx |
| icon single PPTX/SVG/PNG | selected icon | Deck.buildModel icon / exportPptx / SVG / browser raster |
| iZip | selected icon set ZIP | one click-time palette/size/metadata snapshot -> per-icon SVG/PNG -> ZIP |
| table PPTX | complete paginated table | Deck.buildModel table -> exportPptx |
| table TSV/HTML/copy | table source/current explicit page | table source / Deck.tableHtml |
| tray model API (no separate active download button) | saved snapshot composition or each group page | Deck.trayModel / trayDeck; search selected uses trayDeck |
| skPptx / skPotx / skXml | chosen one of 13 static palettes | stylekit/<id>.pptx, .potx, _colors.xml; embedded blobs in single file |
| PPT-Style-Studio.html | standalone app | same modules and embedded 39 Style Kit assets |
| gen.js CLI | selected presets/full standard pages | Deck.exportPptx |

The JSON companion also automatically records every matching download/export call site in the current source, including settings JSON/TSV recovery routes. New quick-style entry points are covered by their dedicated native tests.
