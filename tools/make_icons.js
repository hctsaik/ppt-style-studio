// 產生 icons.js 的圖示資料區塊（來源：lucide-static icon-nodes.json，ISC 授權；另含 2 個自繪：晶圓、機台）
// 用法：npm i --no-save lucide-static && node tools/make_icons.js [path/to/icon-nodes.json]
const fs=require('fs'),path=require('path');
const src=process.argv[2]||require.resolve('lucide-static/icon-nodes.json');
const N=JSON.parse(fs.readFileSync(src,'utf8'));const ver=JSON.parse(fs.readFileSync(path.join(path.dirname(src),'package.json'),'utf8')).version;
const LIST=[
 ['人員',[['user','人員','Person'],['users','團隊','Team'],['user-check','負責人','Owner'],['handshake','合作','Partnership']]],
 ['設備與資料',[['*tool','機台','Equipment'],['*wafer','晶圓','Wafer'],['cpu','晶片','Chip'],['factory','工廠','Fab'],['server','伺服器','Server'],['database','資料庫','Database'],['cloud','雲端','Cloud'],['monitor','電腦','Computer'],['package','物料','Material']]],
 ['狀態與時間',[['triangle-alert','警示','Warning'],['circle-check','完成','Done'],['circle-x','錯誤','Error'],['clock','時間','Time'],['calendar-days','日期','Calendar'],['hourglass','等待','Waiting'],['gauge','效能','Performance']]],
 ['文件與數據',[['file-text','文件','Document'],['clipboard-list','檢核表','Checklist'],['chart-column','報表','Report'],['trending-up','上升','Trend up'],['trending-down','下降','Trend down'],['chart-pie','占比','Share'],['activity','監控','Monitoring']]],
 ['工具與思考',[['settings','設定','Settings'],['wrench','維修','Maintenance'],['search','搜尋','Search'],['list-filter','篩選','Filter'],['lightbulb','想法','Idea'],['target','目標','Target'],['sliders-horizontal','參數','Parameters'],['puzzle','整合','Integration']]],
 ['安全',[['shield-check','安全','Security'],['lock','權限','Access']]],
 ['溝通與流程',[['mail','郵件','Mail'],['phone','電話','Phone'],['link','連結','Link'],['git-branch','分支','Branch'],['workflow','流程','Workflow'],['message-square','討論','Discussion']]],
 ['檢測與 AI',[['microscope','顯微檢測','Inspection'],['camera','AOI 影像','AOI camera'],['brain-circuit','AI','AI'],['bot','機器人','Robot']]],
 ['其他',[['truck','物流','Logistics'],['circle-dollar-sign','成本','Cost'],['funnel','良率漏斗','Yield funnel'],['recycle','回收','Recycle'],['flag','里程碑','Milestone'],['star','重點','Highlight'],['house','首頁','Home'],['map-pin','地點','Location'],['globe','全球','Global'],['rocket','啟動','Launch'],['zap','電力','Power'],['thermometer','溫度','Temperature'],['award','品質','Quality']]]];
const CUSTOM={
 wafer:'<path d="M7.88 20A9 9 0 1 1 16.12 20Z"/><path d="M9 5v13M15 5v13M5 9h14M5 15h14"/>',
 tool:'<rect x="3" y="6" width="18" height="13" rx="2"/><rect x="6" y="9" width="7" height="6" rx="1"/><path d="M16.5 10h1.5M16.5 13h1.5"/><path d="M7 19v2M17 19v2"/><path d="M8 6V3.5h4V6"/>'};
const attr=o=>Object.entries(o).map(([k,v])=>`${k}="${v}"`).join(' ');
const out=[];
LIST.forEach(([cat,items])=>items.forEach(([id,zh,en])=>{let body,src='lucide';
 if(id[0]==='*'){id=id.slice(1);body=CUSTOM[id];src='custom';}else{if(!N[id])throw new Error('missing '+id);body=N[id].map(([t,a])=>`<${t} ${attr(a)}/>`).join('');}
 out.push([id,zh,en,cat,src,body]);}));
const js='const ICON_SRC='+JSON.stringify({lucide:ver,count:out.length})+';\nconst ICON_DATA='+JSON.stringify(out).replace(/\],\[/g,'],\n[')+';';
const f=path.join(__dirname,'..','icons.js');let s=fs.readFileSync(f,'utf8');
s=s.replace(/\/\*DATA\*\/[\s\S]*?\/\*END\*\//,'/*DATA*/\n'+js+'\n/*END*/');fs.writeFileSync(f,s);console.log('icons:',out.length,'lucide',ver);
