/* PPT Style Studio — 圖示庫（v6）
   60 個線條圖示：58 個取自 Lucide（ISC 授權，© Lucide Icons and Contributors，https://lucide.dev），另 2 個自繪（晶圓、機台），
   全部 24×24 網格、圓頭線端與圓角轉折，只用線條（無填色）→ 顏色、線寬都跟著目前風格。
   同一份資料提供：① SVG 字串（預覽、剪貼簿、下載）② PowerPoint 自訂圖形座標（deck.js 匯出成原生可編輯圖案）。
   瀏覽器與 Node 共用；不需要網路。 */
(function(root){
'use strict';
/*DATA*/
const ICON_SRC={"lucide":"1.53.0","count":60};
const ICON_DATA=[["user","人員","Person","人員","lucide","<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/>"],
["users","團隊","Team","人員","lucide","<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><path d=\"M16 3.128a4 4 0 0 1 0 7.744\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/>"],
["user-check","負責人","Owner","人員","lucide","<path d=\"m16 11 2 2 4-4\"/><path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/>"],
["handshake","合作","Partnership","人員","lucide","<path d=\"m11 17 2 2a1 1 0 1 0 3-3\"/><path d=\"m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4\"/><path d=\"m21 3 1 11h-2\"/><path d=\"M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3\"/><path d=\"M3 4h8\"/>"],
["tool","機台","Equipment","設備與資料","custom","<rect x=\"3\" y=\"6\" width=\"18\" height=\"13\" rx=\"2\"/><rect x=\"6\" y=\"9\" width=\"7\" height=\"6\" rx=\"1\"/><path d=\"M16.5 10h1.5M16.5 13h1.5\"/><path d=\"M7 19v2M17 19v2\"/><path d=\"M8 6V3.5h4V6\"/>"],
["wafer","晶圓","Wafer","設備與資料","custom","<path d=\"M7.88 20A9 9 0 1 1 16.12 20Z\"/><path d=\"M9 5v13M15 5v13M5 9h14M5 15h14\"/>"],
["cpu","晶片","Chip","設備與資料","lucide","<path d=\"M12 20v2\"/><path d=\"M12 2v2\"/><path d=\"M17 20v2\"/><path d=\"M17 2v2\"/><path d=\"M2 12h2\"/><path d=\"M2 17h2\"/><path d=\"M2 7h2\"/><path d=\"M20 12h2\"/><path d=\"M20 17h2\"/><path d=\"M20 7h2\"/><path d=\"M7 20v2\"/><path d=\"M7 2v2\"/><rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\"/><rect x=\"8\" y=\"8\" width=\"8\" height=\"8\" rx=\"1\"/>"],
["factory","工廠","Fab","設備與資料","lucide","<path d=\"M12 16h.01\"/><path d=\"M16 16h.01\"/><path d=\"M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z\"/><path d=\"M8 16h.01\"/>"],
["server","伺服器","Server","設備與資料","lucide","<rect width=\"20\" height=\"8\" x=\"2\" y=\"2\" rx=\"2\" ry=\"2\"/><rect width=\"20\" height=\"8\" x=\"2\" y=\"14\" rx=\"2\" ry=\"2\"/><line x1=\"6\" x2=\"6.01\" y1=\"6\" y2=\"6\"/><line x1=\"6\" x2=\"6.01\" y1=\"18\" y2=\"18\"/>"],
["database","資料庫","Database","設備與資料","lucide","<ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"/><path d=\"M3 5V19A9 3 0 0 0 21 19V5\"/><path d=\"M3 12A9 3 0 0 0 21 12\"/>"],
["cloud","雲端","Cloud","設備與資料","lucide","<path d=\"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z\"/>"],
["monitor","電腦","Computer","設備與資料","lucide","<rect width=\"20\" height=\"14\" x=\"2\" y=\"3\" rx=\"2\"/><line x1=\"8\" x2=\"16\" y1=\"21\" y2=\"21\"/><line x1=\"12\" x2=\"12\" y1=\"17\" y2=\"21\"/>"],
["package","物料","Material","設備與資料","lucide","<path d=\"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z\"/><path d=\"M12 22V12\"/><polyline points=\"3.29 7 12 12 20.71 7\"/><path d=\"m7.5 4.27 9 5.15\"/>"],
["triangle-alert","警示","Warning","狀態與時間","lucide","<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"/><path d=\"M12 9v4\"/><path d=\"M12 17h.01\"/>"],
["circle-check","完成","Done","狀態與時間","lucide","<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m16 9-5.5 5.5L8 12\"/>"],
["circle-x","錯誤","Error","狀態與時間","lucide","<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m15 9-6 6\"/><path d=\"m9 9 6 6\"/>"],
["clock","時間","Time","狀態與時間","lucide","<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 6v6l4 2\"/>"],
["calendar-days","日期","Calendar","狀態與時間","lucide","<path d=\"M8 2v3\"/><path d=\"M16 2v3\"/><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M3 9h18\"/><path d=\"M8 13h.01\"/><path d=\"M12 13h.01\"/><path d=\"M16 13h.01\"/><path d=\"M8 17h.01\"/><path d=\"M12 17h.01\"/><path d=\"M16 17h.01\"/>"],
["hourglass","等待","Waiting","狀態與時間","lucide","<path d=\"M5 22h14\"/><path d=\"M5 2h14\"/><path d=\"M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22\"/><path d=\"M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2\"/>"],
["gauge","效能","Performance","狀態與時間","lucide","<path d=\"m12 14 4-4\"/><path d=\"M3.34 19a10 10 0 1 1 17.32 0\"/>"],
["file-text","文件","Document","文件與數據","lucide","<path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\"/><path d=\"M14 2v5a1 1 0 0 0 1 1h5\"/><path d=\"M10 9H8\"/><path d=\"M16 13H8\"/><path d=\"M16 17H8\"/>"],
["clipboard-list","檢核表","Checklist","文件與數據","lucide","<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\"/><path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"/><path d=\"M12 11h4\"/><path d=\"M12 16h4\"/><path d=\"M8 11h.01\"/><path d=\"M8 16h.01\"/>"],
["chart-column","報表","Report","文件與數據","lucide","<path d=\"M3 3v16a2 2 0 0 0 2 2h16\"/><path d=\"M18 17V9\"/><path d=\"M13 17V5\"/><path d=\"M8 17v-3\"/>"],
["trending-up","上升","Trend up","文件與數據","lucide","<path d=\"M16 7h6v6\"/><path d=\"m22 7-8.5 8.5-5-5L2 17\"/>"],
["trending-down","下降","Trend down","文件與數據","lucide","<path d=\"M16 17h6v-6\"/><path d=\"m22 17-8.5-8.5-5 5L2 7\"/>"],
["chart-pie","占比","Share","文件與數據","lucide","<path d=\"M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z\"/><path d=\"M21.21 15.89A10 10 0 1 1 8 2.83\"/>"],
["activity","監控","Monitoring","文件與數據","lucide","<path d=\"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2\"/>"],
["settings","設定","Settings","工具與思考","lucide","<path d=\"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>"],
["wrench","維修","Maintenance","工具與思考","lucide","<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z\"/>"],
["search","搜尋","Search","工具與思考","lucide","<path d=\"m21 21-4.34-4.34\"/><circle cx=\"11\" cy=\"11\" r=\"8\"/>"],
["list-filter","篩選","Filter","工具與思考","lucide","<path d=\"M2 5h20\"/><path d=\"M6 12h12\"/><path d=\"M9 19h6\"/>"],
["lightbulb","想法","Idea","工具與思考","lucide","<path d=\"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5\"/><path d=\"M9 18h6\"/><path d=\"M10 22h4\"/>"],
["target","目標","Target","工具與思考","lucide","<circle cx=\"12\" cy=\"12\" r=\"10\"/><circle cx=\"12\" cy=\"12\" r=\"6\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/>"],
["sliders-horizontal","參數","Parameters","工具與思考","lucide","<path d=\"M10 5H3\"/><path d=\"M12 19H3\"/><path d=\"M14 3v4\"/><path d=\"M16 17v4\"/><path d=\"M21 12h-9\"/><path d=\"M21 19h-5\"/><path d=\"M21 5h-7\"/><path d=\"M8 10v4\"/><path d=\"M8 12H3\"/>"],
["puzzle","整合","Integration","工具與思考","lucide","<path d=\"M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z\"/>"],
["shield-check","安全","Security","安全","lucide","<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/><path d=\"m9 12 2 2 4-4\"/>"],
["lock","權限","Access","安全","lucide","<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/>"],
["mail","郵件","Mail","溝通與流程","lucide","<path d=\"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7\"/><rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"/>"],
["phone","電話","Phone","溝通與流程","lucide","<path d=\"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384\"/>"],
["link","連結","Link","溝通與流程","lucide","<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\"/><path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\"/>"],
["git-branch","分支","Branch","溝通與流程","lucide","<path d=\"M15 6a9 9 0 0 0-9 9V3\"/><circle cx=\"18\" cy=\"6\" r=\"3\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/>"],
["workflow","流程","Workflow","溝通與流程","lucide","<rect width=\"8\" height=\"8\" x=\"3\" y=\"3\" rx=\"2\"/><path d=\"M7 11v4a2 2 0 0 0 2 2h4\"/><rect width=\"8\" height=\"8\" x=\"13\" y=\"13\" rx=\"2\"/>"],
["message-square","討論","Discussion","溝通與流程","lucide","<path d=\"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z\"/>"],
["microscope","顯微檢測","Inspection","檢測與 AI","lucide","<path d=\"M6 18h8\"/><path d=\"M3 22h18\"/><path d=\"M14 22a7 7 0 1 0 0-14h-1\"/><path d=\"M9 14h2\"/><path d=\"M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z\"/><path d=\"M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3\"/>"],
["camera","AOI 影像","AOI camera","檢測與 AI","lucide","<path d=\"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z\"/><circle cx=\"12\" cy=\"13\" r=\"3\"/>"],
["brain-circuit","AI","AI","檢測與 AI","lucide","<path d=\"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z\"/><path d=\"M9 13a4.5 4.5 0 0 0 3-4\"/><path d=\"M6.003 5.125A3 3 0 0 0 6.401 6.5\"/><path d=\"M3.477 10.896a4 4 0 0 1 .585-.396\"/><path d=\"M6 18a4 4 0 0 1-1.967-.516\"/><path d=\"M12 13h4\"/><path d=\"M12 18h6a2 2 0 0 1 2 2v1\"/><path d=\"M12 8h8\"/><path d=\"M16 8V5a2 2 0 0 1 2-2\"/><circle cx=\"16\" cy=\"13\" r=\".5\"/><circle cx=\"18\" cy=\"3\" r=\".5\"/><circle cx=\"20\" cy=\"21\" r=\".5\"/><circle cx=\"20\" cy=\"8\" r=\".5\"/>"],
["bot","機器人","Robot","檢測與 AI","lucide","<path d=\"M12 8V4H8\"/><rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\"/><path d=\"M2 14h2\"/><path d=\"M20 14h2\"/><path d=\"M15 13v2\"/><path d=\"M9 13v2\"/>"],
["truck","物流","Logistics","其他","lucide","<path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\"/><path d=\"M15 18H9\"/><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14\"/><circle cx=\"17\" cy=\"18\" r=\"2\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/>"],
["circle-dollar-sign","成本","Cost","其他","lucide","<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8\"/><path d=\"M12 18V6\"/>"],
["funnel","良率漏斗","Yield funnel","其他","lucide","<path d=\"M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z\"/>"],
["recycle","回收","Recycle","其他","lucide","<path d=\"M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5\"/><path d=\"M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12\"/><path d=\"m14 16-3 3 3 3\"/><path d=\"M8.293 13.596 7.196 9.5 3.1 10.598\"/><path d=\"m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843\"/><path d=\"m13.378 9.633 4.096 1.098 1.097-4.096\"/>"],
["flag","里程碑","Milestone","其他","lucide","<path d=\"M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528\"/>"],
["star","重點","Highlight","其他","lucide","<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\"/>"],
["house","首頁","Home","其他","lucide","<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\"/><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/>"],
["map-pin","地點","Location","其他","lucide","<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/>"],
["globe","全球","Global","其他","lucide","<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\"/><path d=\"M2 12h20\"/>"],
["rocket","啟動","Launch","其他","lucide","<path d=\"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5\"/><path d=\"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09\"/><path d=\"M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z\"/><path d=\"M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05\"/>"],
["zap","電力","Power","其他","lucide","<path d=\"M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z\"/>"],
["thermometer","溫度","Temperature","其他","lucide","<path d=\"M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z\"/>"],
["award","品質","Quality","其他","lucide","<path d=\"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526\"/><circle cx=\"12\" cy=\"8\" r=\"6\"/>"]];
/*END*/
const LIST=ICON_DATA.map(([id,zh,en,cat,src,body])=>({id,zh,en,cat,src,body}));
const BY={};LIST.forEach(i=>BY[i.id]=i);
const CATS=[];LIST.forEach(i=>{if(!CATS.includes(i.cat))CATS.push(i.cat);});
const LICENSE='Lucide icons (ISC License) — Copyright (c) Lucide Icons and Contributors. Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies. THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES. 晶圓、機台 2 個圖示為 PPT Style Studio 自繪（同授權）。';

/* ---------- 樣式：線寬、變化 ---------- */
// 線寬（24 網格單位）：跟風格的連接線粗細走（髮絲線風格→細、粗線風格→粗）；icSW>0 時手動指定
function strokeOf(p){if(p&&+p.icSW>0)return +p.icSW;const w=p&&p.cnW!=null?+p.cnW:1.25;return Math.round(Math.max(1.25,Math.min(2.5,1+w*.6))*100)/100;}
// 變化：line＝純線條；tint＝淺色圓底＋主色線；solid＝深色實心圓＋白線。圓底時圖形縮到 58%，線寬視覺上約 0.72 倍
const VARIANTS=[['line','線條'],['tint','淺色圓底'],['solid','深色圓底']];
function geom(variant,sw){if(variant==='tint'||variant==='solid'){const k=.58;return{circle:true,k,off:12*(1-k),sw:sw*.72/k};}return{circle:false,k:1,off:0,sw};}

/* ---------- SVG 字串 ---------- */
const attrEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function svg(id,o){o=o||{};const ic=BY[id];if(!ic)throw new Error('沒有這個圖示：'+id);
 const g=geom(o.variant,o.sw||2);const fg=o.fg||'1F4E79',bg=o.bg||'DEE7F1';const px=o.px||null;
 const size=px?` width="${px}" height="${px}"`:'';
 const circle=g.circle?`<circle cx="12" cy="12" r="12" fill="#${bg}"/>`:'';
 const tr=g.k!==1?` transform="translate(${g.off.toFixed(3)} ${g.off.toFixed(3)}) scale(${g.k})"`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"${size}>${o.title?`<title>${attrEsc(o.title)}</title>`:''}${circle}<g${tr} fill="none" stroke="#${fg}" stroke-width="${+g.sw.toFixed(3)}" stroke-linecap="round" stroke-linejoin="round">${ic.body}</g></svg>`;}

/* ---------- SVG → 路徑（M／L／C／Z，24 網格座標） ---------- */
function arcToCubic(x1,y1,rx,ry,phi,fa,fs,x2,y2){const out=[];if(!rx||!ry){out.push(['L',x2,y2]);return out;}
 const s=Math.sin(phi*Math.PI/180),c=Math.cos(phi*Math.PI/180);rx=Math.abs(rx);ry=Math.abs(ry);
 const dx=(x1-x2)/2,dy=(y1-y2)/2;const x1p=c*dx+s*dy,y1p=-s*dx+c*dy;
 let L=x1p*x1p/(rx*rx)+y1p*y1p/(ry*ry);if(L>1){rx*=Math.sqrt(L);ry*=Math.sqrt(L);}
 const num=rx*rx*ry*ry-rx*rx*y1p*y1p-ry*ry*x1p*x1p,den=rx*rx*y1p*y1p+ry*ry*x1p*x1p;
 let co=Math.sqrt(Math.max(0,num/den));if(fa===fs)co=-co;
 const cxp=co*rx*y1p/ry,cyp=-co*ry*x1p/rx;const cx=c*cxp-s*cyp+(x1+x2)/2,cy=s*cxp+c*cyp+(y1+y2)/2;
 const ang=(ux,uy,vx,vy)=>{const a=Math.atan2(ux*vy-uy*vx,ux*vx+uy*vy);return a;};
 let t1=ang(1,0,(x1p-cxp)/rx,(y1p-cyp)/ry),dt=ang((x1p-cxp)/rx,(y1p-cyp)/ry,(-x1p-cxp)/rx,(-y1p-cyp)/ry);
 if(!fs&&dt>0)dt-=2*Math.PI;else if(fs&&dt<0)dt+=2*Math.PI;
 const n=Math.max(1,Math.ceil(Math.abs(dt)/(Math.PI/2)-1e-9)),d=dt/n,k=4/3*Math.tan(d/4);
 const P=(t)=>[cx+rx*Math.cos(t)*c-ry*Math.sin(t)*s,cy+rx*Math.cos(t)*s+ry*Math.sin(t)*c];
 const D=(t)=>[-rx*Math.sin(t)*c-ry*Math.cos(t)*s,-rx*Math.sin(t)*s+ry*Math.cos(t)*c];
 for(let i=0;i<n;i++){const a=t1+i*d,b=a+d;const pa=P(a),pb=P(b),da=D(a),db=D(b);
  out.push(['C',pa[0]+k*da[0],pa[1]+k*da[1],pb[0]-k*db[0],pb[1]-k*db[1],i===n-1?x2:pb[0],i===n-1?y2:pb[1]]);}
 return out;}
function parseD(d){d=String(d);let i=0;const out=[];let cx=0,cy=0,sx=0,sy=0,cmd='',lc=null;
 const ws=()=>{while(i<d.length&&/[\s,]/.test(d[i]))i++;};
 const isN=()=>{ws();return i<d.length&&/[-+.\d]/.test(d[i]);};
 const num=()=>{ws();const m=/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(d.slice(i));if(!m)throw new Error('路徑解析失敗：'+d.slice(i,i+12));i+=m[0].length;return +m[0];};
 const flag=()=>{ws();const c=d[i++];if(c!=='0'&&c!=='1')throw new Error('弧線旗標錯誤');return c==='1';};
 while(true){ws();if(i>=d.length)break;if(/[a-zA-Z]/.test(d[i]))cmd=d[i++];else if(!cmd)break;
  const rel=cmd===cmd.toLowerCase(),C=cmd.toUpperCase();const X=v=>rel?cx+v:v,Y=v=>rel?cy+v:v;
  switch(C){
   case 'Z':out.push(['Z']);cx=sx;cy=sy;lc=null;cmd='';continue;
   case 'M':{const x=X(num()),y=Y(num());out.push(['M',x,y]);cx=sx=x;cy=sy=y;cmd=rel?'l':'L';lc=null;break;}
   case 'L':{const x=X(num()),y=Y(num());out.push(['L',x,y]);cx=x;cy=y;lc=null;break;}
   case 'H':{const x=rel?cx+num():num();out.push(['L',x,cy]);cx=x;lc=null;break;}
   case 'V':{const y=rel?cy+num():num();out.push(['L',cx,y]);cy=y;lc=null;break;}
   case 'C':{const a=X(num()),b=Y(num()),c2=X(num()),d2=Y(num()),x=X(num()),y=Y(num());out.push(['C',a,b,c2,d2,x,y]);lc=['c',c2,d2];cx=x;cy=y;break;}
   case 'S':{const r=lc&&lc[0]==='c'?[2*cx-lc[1],2*cy-lc[2]]:[cx,cy];const c2=X(num()),d2=Y(num()),x=X(num()),y=Y(num());out.push(['C',r[0],r[1],c2,d2,x,y]);lc=['c',c2,d2];cx=x;cy=y;break;}
   case 'Q':{const qx=X(num()),qy=Y(num()),x=X(num()),y=Y(num());out.push(['C',cx+2/3*(qx-cx),cy+2/3*(qy-cy),x+2/3*(qx-x),y+2/3*(qy-y),x,y]);cx=x;cy=y;lc=['q',qx,qy];break;}
   case 'T':{const q=lc&&lc[0]==='q'?[2*cx-lc[1],2*cy-lc[2]]:[cx,cy];const x=X(num()),y=Y(num());out.push(['C',cx+2/3*(q[0]-cx),cy+2/3*(q[1]-cy),x+2/3*(q[0]-x),y+2/3*(q[1]-y),x,y]);cx=x;cy=y;lc=['q',q[0],q[1]];break;}
   case 'A':{const rx=num(),ry=num(),ph=num(),fa=flag(),fs=flag(),x=X(num()),y=Y(num());arcToCubic(cx,cy,rx,ry,ph,fa,fs,x,y).forEach(s=>out.push(s));cx=x;cy=y;lc=null;break;}
   default:throw new Error('不支援的路徑指令 '+cmd);}
  if(!isN()&&i<d.length&&!/[a-zA-Z]/.test(d[i]))i++;}
 return out;}
const KAPPA=.5522847498;
function ellipseD(cx,cy,rx,ry){const kx=rx*KAPPA,ky=ry*KAPPA;return[['M',cx+rx,cy],['C',cx+rx,cy+ky,cx+kx,cy+ry,cx,cy+ry],['C',cx-kx,cy+ry,cx-rx,cy+ky,cx-rx,cy],['C',cx-rx,cy-ky,cx-kx,cy-ry,cx,cy-ry],['C',cx+kx,cy-ry,cx+rx,cy-ky,cx+rx,cy],['Z']];}
function rectD(x,y,w,h,rx,ry){rx=Math.min(rx||ry||0,w/2);ry=Math.min(ry||rx||0,h/2);if(!rx)return[['M',x,y],['L',x+w,y],['L',x+w,y+h],['L',x,y+h],['Z']];
 const kx=rx*(1-KAPPA),ky=ry*(1-KAPPA);
 return[['M',x+rx,y],['L',x+w-rx,y],['C',x+w-kx,y,x+w,y+ky,x+w,y+ry],['L',x+w,y+h-ry],['C',x+w,y+h-ky,x+w-kx,y+h,x+w-rx,y+h],['L',x+rx,y+h],['C',x+kx,y+h,x,y+h-ky,x,y+h-ry],['L',x,y+ry],['C',x,y+ky,x+kx,y,x+rx,y],['Z']];}
const _cache={};
function segs(id){if(_cache[id])return _cache[id];const ic=BY[id];if(!ic)throw new Error('沒有這個圖示：'+id);const out=[];
 const re=/<(\w+)\s([^>]*?)\/>/g;let m;
 while((m=re.exec(ic.body))){const t=m[1],a={};m[2].replace(/([\w-]+)="([^"]*)"/g,(_,k,v)=>{a[k]=v;});const n=k=>+(a[k]||0);
  if(t==='path')out.push(...parseD(a.d));
  else if(t==='circle')out.push(...ellipseD(n('cx'),n('cy'),n('r'),n('r')));
  else if(t==='ellipse')out.push(...ellipseD(n('cx'),n('cy'),n('rx'),n('ry')));
  else if(t==='rect')out.push(...rectD(n('x'),n('y'),n('width'),n('height'),n('rx'),n('ry')));
  else if(t==='line')out.push(['M',n('x1'),n('y1')],['L',n('x2'),n('y2')]);
  else if(t==='polyline'||t==='polygon'){const p=(a.points||'').trim().split(/[\s,]+/).map(Number);for(let j=0;j+1<p.length;j+=2)out.push([j?'L':'M',p[j],p[j+1]]);if(t==='polygon')out.push(['Z']);}}
 return(_cache[id]=out);}
/* PowerPoint 自訂圖形座標：box 邊長 s（吋），glyph 在 box 內縮放 k、平移 off（24 單位） */
function points(id,s,k,off){k=k||1;off=off||0;const f=v=>Math.round((off+v*k)*s/24*1e5)/1e5;const pts=[];let first=true;
 segs(id).forEach(g=>{const op=g[0];
  if(op==='M'){pts.push({x:f(g[1]),y:f(g[2]),moveTo:!first||undefined});first=false;}
  else if(op==='L')pts.push({x:f(g[1]),y:f(g[2])});
  else if(op==='C')pts.push({x:f(g[5]),y:f(g[6]),curve:{type:'cubic',x1:f(g[1]),y1:f(g[2]),x2:f(g[3]),y2:f(g[4])}});
  else if(op==='Z')pts.push({close:true});});
 pts.forEach(p=>{if(p.moveTo===undefined)delete p.moveTo;});return pts;}
const api={LIST,BY,CATS,VARIANTS,LICENSE,SRC:ICON_SRC,strokeOf,geom,svg,segs,points,parseD};
if(typeof module!=='undefined')module.exports=api;else root.Icons=api;
})(typeof window!=='undefined'?window:globalThis);
