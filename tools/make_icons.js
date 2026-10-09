// 產生 icons.js 的圖示資料區塊（v7：Google Material Symbols Rounded，Apache License 2.0）
// 來源：google/material-design-icons 的 Material Symbols SVG（npm 套件 @material-symbols/svg-300／400／500，同一份官方 SVG 的打包）
// 用法：npm i @material-symbols/svg-300 @material-symbols/svg-400 @material-symbols/svg-500 && node tools/make_icons.js [node_modules 路徑]
const fs=require('fs'),path=require('path');
const NM=process.argv[2]||path.join(process.cwd(),'node_modules');
const WEIGHTS=[300,400,500];
const ver=JSON.parse(fs.readFileSync(path.join(NM,'@material-symbols/svg-400/package.json'),'utf8')).version;
// [類別, [[Material 名稱, 中文, English, 額外關鍵字]]]；名稱前加 * ＝自繪（Material 沒有對應圖示）
const LIST=[
 ['人員與組織',[['person','人員','Person','使用者 user 個人'],['group','團隊','Team','小組 成員 members'],['groups','部門','Department','組織 群組 people'],['account_tree','組織架構','Org chart','架構 階層 hierarchy tree'],['badge','員工','Employee','識別證 ID 職員'],['handshake','合作','Partnership','夥伴 協議 deal'],['engineering','工程師','Engineer','工程 技術 安全帽'],['support_agent','客服','Support','支援 服務 helpdesk'],['school','訓練','Training','教育 學習 課程']]],
 ['製造與設備',[['factory','工廠','Fab','廠房 晶圓廠 plant fab'],['precision_manufacturing','機台','Equipment','設備 自動化 機械手臂 robot tool'],['conveyor_belt','產線','Production line','輸送帶 生產 line'],['*wafer','晶圓','Wafer','wafer 矽晶圓 半導體 die'],['memory','晶片','Chip','IC 晶片 半導體 semiconductor cpu'],['developer_board','電路板','PCB','板子 封裝 board'],['frame_inspect','檢測','Inspection','量測 AOI 檢查 inspect metrology'],['biotech','顯微分析','Microscope','顯微鏡 分析 FA'],['science','實驗','Experiment','研發 R&D lab'],['build','維修','Maintenance','保養 PM 扳手 repair'],['inventory_2','庫存','Inventory','物料 箱子 stock'],['warehouse','倉儲','Warehouse','倉庫 存放'],['local_shipping','物流','Logistics','運輸 出貨 卡車 truck'],['package_2','包裝','Package','物料 封裝 box']]],
 ['資料與 IT',[['database','資料庫','Database','DB 資料'],['cloud','雲端','Cloud','cloud 雲'],['dns','伺服器','Server','主機 server'],['lan','網路','Network','網路 拓樸 LAN'],['computer','電腦','Computer','PC 桌機'],['code','程式','Code','開發 程式碼 software'],['api','API','API','介面 整合'],['smart_toy','AI 機器人','AI bot','AI 聊天 機器人 bot'],['neurology','AI','AI','人工智慧 大腦 brain 模型'],['deployed_code','模組','Module','部署 元件 package']]],
 ['分析與圖表',[['analytics','分析','Analytics','數據 統計'],['bar_chart','長條圖','Bar chart','圖表 chart'],['leaderboard','排名','Ranking','排行 比較'],['monitoring','監控','Monitoring','趨勢 監測 SPC'],['query_stats','數據查詢','Data query','分析 搜尋 統計'],['trending_up','上升','Trend up','成長 增加 growth'],['trending_down','下降','Trend down','衰退 減少'],['pie_chart','占比','Share','比例 圓餅圖'],['table_chart','表格','Table','表單 資料表'],['dashboard','儀表板','Dashboard','看板 總覽'],['timeline','時間軸','Timeline','進程 歷程']]],
 ['狀態',[['check_circle','完成','Done','OK 通過 確認 pass'],['task_alt','達成','Achieved','完成 勾選'],['cancel','錯誤','Error','失敗 取消 NG fail'],['warning','警示','Warning','風險 注意 risk'],['error','異常','Alert','警告 問題 issue'],['info','資訊','Info','說明 提示'],['help','問題','Question','疑問 FAQ'],['priority_high','緊急','Urgent','重要 優先'],['block','阻擋','Blocked','禁止 停止 stop'],['pending','進行中','In progress','處理中 等待'],['verified','已驗證','Verified','認證 合格 qualified'],['notifications','通知','Notification','提醒 鈴'],['bug_report','問題追蹤','Bug','缺陷 defect bug']]],
 ['時間',[['schedule','時間','Time','時鐘 clock'],['timer','計時','Timer','碼表 cycle time'],['hourglass_empty','等待','Waiting','沙漏 queue'],['calendar_month','行事曆','Calendar','日期 月曆'],['event','事件','Event','日期 會議'],['event_available','已排程','Scheduled','完成 預約']]],
 ['文件',[['description','文件','Document','檔案 doc'],['article','報告','Report','文章 report'],['assignment','任務','Assignment','工作 交辦 task'],['assignment_turned_in','已交付','Delivered','完成 任務'],['checklist','檢核表','Checklist','清單 SOP'],['fact_check','查核','Review','稽核 審查'],['folder','資料夾','Folder','歸檔 檔案'],['edit_note','筆記','Notes','紀錄 會議記錄 memo'],['menu_book','手冊','Manual','規範 SOP 書']]],
 ['工具與思考',[['settings','設定','Settings','齒輪 配置'],['tune','參數','Parameters','調整 recipe'],['filter_alt','篩選','Filter','過濾 漏斗 funnel'],['search','搜尋','Search','查詢 找'],['lightbulb','想法','Idea','創意 點子'],['target','目標','Target','靶 goal'],['flag','里程碑','Milestone','旗子 milestone'],['trophy','成果','Achievement','獎盃 冠軍 award'],['star','重點','Highlight','星 重要'],['psychology','思考','Thinking','腦 策略'],['rocket_launch','啟動','Launch','火箭 開始 kickoff'],['speed','效能','Performance','速度 儀表'],['bolt','快速','Fast','電力 閃電 power']]],
 ['安全',[['lock','鎖定','Lock','權限 保密 access'],['security','資安','Security','盾 防護'],['verified_user','認證','Certified','合規 授權'],['key','金鑰','Key','鑰匙 密碼'],['policy','稽核','Audit','政策 法規 compliance']]],
 ['流程與連結',[['swap_horiz','交換','Swap','對調 交接'],['sync','同步','Sync','更新 循環'],['autorenew','循環','Cycle','持續改善 PDCA 迴圈 loop'],['route','路徑','Route','路線 流程'],['alt_route','分流','Branch','分支 替代'],['call_split','分歧','Split','分開 fork'],['merge','合併','Merge','整合 匯流'],['hub','樞紐','Hub','中心 連結 平台']]],
 ['財務',[['payments','付款','Payment','費用 支付'],['attach_money','金額','Money','錢 營收 revenue'],['savings','節省','Savings','省錢 撲滿 cost down'],['paid','收益','Profit','獲利 利潤'],['account_balance','財務','Finance','銀行 會計'],['request_quote','報價','Quotation','估價 預算 budget']]],
 ['溝通',[['mail','郵件','Mail','email 信件'],['chat','訊息','Chat','對話 聊天'],['forum','討論','Discussion','會議 意見'],['campaign','公告','Announcement','宣傳 廣播'],['call','電話','Phone','通話 聯絡'],['videocam','視訊','Video call','會議 meeting']]],
 ['其他',[['public','全球','Global','世界 國際'],['location_on','地點','Location','位置 據點 site'],['apartment','辦公室','Office','大樓 總部'],['eco','環保','ESG','永續 綠色 葉子'],['recycling','回收','Recycling','循環 再利用'],['energy_savings_leaf','節能','Energy saving','能源 省電'],['thermostat','溫度','Temperature','溫控'],['water_drop','用水','Water','水資源 化學品']]]];
// 自訂：晶圓（Material 沒有晶圓）。960 網格、與 Material 同樣的線寬（300/400/500 ≈ 40/60/72）
function wafer(w){const t={300:40,400:60,500:72}[w];const C=480,R=400,F=372,a=Math.sqrt(R*R-F*F),ri=R-t,fi=F-t,ai=Math.sqrt(ri*ri-fi*fi);const r=v=>Math.round(v*10)/10;
 // 外圈（底部小平邊＝晶圓定位邊）＋內圈反向（挖空）＋ 2×2 晶粒；各字重晶粒相同，只有外圈粗細跟字重
 let d=`M${r(C-a)} ${r(-C+F)}A${R} ${R} 0 1 1 ${r(C+a)} ${r(-C+F)}Z M${r(C+ai)} ${r(-C+fi)}A${ri} ${ri} 0 1 0 ${r(C-ai)} ${r(-C+fi)}Z`;
 const s=140,g=60,rr=20;[[-1,-1],[0,-1],[-1,0],[0,0]].forEach(([i,j])=>{const x0=C+(i<0?-g/2-s:g/2),y0=-C+(j<0?-g/2-s:g/2);
  d+=` M${r(x0+rr)} ${r(y0)}h${s-2*rr}a${rr} ${rr} 0 0 1 ${rr} ${rr}v${s-2*rr}a${rr} ${rr} 0 0 1 -${rr} ${rr}h-${s-2*rr}a${rr} ${rr} 0 0 1 -${rr} -${rr}v-${s-2*rr}a${rr} ${rr} 0 0 1 ${rr} -${rr}Z`;});
 return d;}
// 座標四捨五入到 0.1（960 網格 → 24 網格誤差 < 0.003），只處理小數，整數與指令不動
function round1(d){return d.replace(/\d*\.\d+/g,(x,i,all)=>{let v=(+x).toFixed(1);if(v.endsWith('.0')&&all[i+x.length]!=='.')v=v.slice(0,-2);if(/[\d.]/.test(all[i-1]||''))v=v.startsWith('0.')?v.slice(1):' '+v;return v;});}
const out=[];const seen=new Set();
LIST.forEach(([cat,items])=>items.forEach(([name,zh,en,kw])=>{let id=name,src='material',d={};
 if(name[0]==='*'){id=name.slice(1);src='custom';WEIGHTS.forEach(w=>d[w]=wafer(w));}
 else WEIGHTS.forEach(w=>{const s=fs.readFileSync(path.join(NM,`@material-symbols/svg-${w}/rounded/${name}.svg`),'utf8');const m=s.match(/<path d="([^"]+)"/g);if(!m||m.length!==1)throw new Error('path? '+name);
  d[w]=m[0].slice(9,-1).replace(/M(-?[\d.]+)(-?[\d.]+)h(-?[\d.]+)(-?[\d.]+)Z/g,(a,x,y,h1,h2)=>(Math.abs(+h1+ +h2)<1e-9?'':a));d[w]=round1(d[w]);});  // 去掉退化的 0 面積子路徑
 if(seen.has(id)){id=id+'_2';}seen.add(id);
 out.push([id,zh,en,cat,src,kw||'',WEIGHTS.map(w=>d[w])]);}));
const js='const ICON_SRC='+JSON.stringify({material:ver,style:'Rounded',weights:WEIGHTS,count:out.length})+';\nconst ICON_DATA='+JSON.stringify(out).replace(/\],\[/g,'],\n[')+';';
const f=path.join(__dirname,'..','icons.js');let s=fs.readFileSync(f,'utf8');
s=s.replace(/\/\*DATA\*\/[\s\S]*?\/\*END\*\//,'/*DATA*/\n'+js+'\n/*END*/');fs.writeFileSync(f,s);console.log('icons:',out.length,'material',ver,'bytes',js.length);
