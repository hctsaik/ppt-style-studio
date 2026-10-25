/* PPT Style Studio v4 — 參數化圖解元件庫（永遠白底）
   params → 幾何模型（model）→ ① SVG 即時預覽  ② PptxGenJS 匯出（含陰影 XML 修補）
   瀏覽器（studio.html）與 Node（gen.js）共用。 */
(function(root){
'use strict';
const W=13.333,H=7.5,PT=72;
const ICONS=(root&&root.Icons)||(typeof require==='function'?(function(){try{return require('./icons.js');}catch(e){return null;}})():null);
function mix(a,b,t){const p=s=>[0,2,4].map(i=>parseInt(s.substr(i,2),16));const A=p(a),B=p(b);return A.map((v,i)=>Math.round(v*(1-t)+B[i]*t).toString(16).padStart(2,'0')).join('').toUpperCase();}
const clone=o=>JSON.parse(JSON.stringify(o));
/* Icon base variants use the same native icon library and persisted per-group labels. */
const ICON_BASES=[['round','圓角方塊'],['circle','圓形'],['pill','膠囊'],['hex','六角形']];
const ICON_LOOKS=[['outline','只有線框'],['soft','淡色底'],['solid','實心底'],['softborder','淡底＋線框']];
const ICON_STATES=[['brand','一般','', 'groups','一般內容，跟隨主色'],['success','成功','207345','task_alt','已完成或已通過'],['attention','注意','806000','info','需留意，尚未形成問題'],['warning','警示','A14D00','warning','已有問題，需要處理'],['danger','危險','B3261E','error','重大風險，需要立即處理'],['neutral','停用','596675','pause','暫不使用或尚未開放']];
function cleanIconStyle(value,fallback){const out=Object.assign({base:'round',look:'outline',state:'brand'},fallback||{});value=value&&typeof value==='object'?value:{};
 for(const [k,choices] of [['base',ICON_BASES],['look',ICON_LOOKS],['state',ICON_STATES]]){if(choices.some(x=>x[0]===value[k]))out[k]=value[k];if(!choices.some(x=>x[0]===out[k]))out[k]=choices[0][0];}return out;}
// Display/download labels are derived; catalog group names remain stable for stored selections.
function iconComponentName(value){const s=cleanIconStyle(value);return ICON_LOOKS.find(x=>x[0]===s.look)[1]+'・'+ICON_STATES.find(x=>x[0]===s.state)[1];}
function iconComponentPaint(value,brand){const s=cleanIconStyle(value),state=ICON_STATES.find(x=>x[0]===s.state),tone=state[2]||brand||BASE.P;
 const fill=s.look==='outline'?null:s.look==='solid'?tone:mix(tone,'FFFFFF',.89),line=s.look==='outline'||s.look==='softborder'?tone:null;
 const fg=s.look==='solid'?(contrastOf('FFFFFF',tone)>=contrastOf('000000',tone)?'FFFFFF':'000000'):ensureContrast(tone,fill||'FFFFFF',4.5);
 return{fill,line,fg,label:state[1],labelColor:ensureContrast(tone,'FFFFFF',4.5)};}
function applyIconComponentStyle(sl,g,value){if(!g.iconStyle)return;const style=cleanIconStyle(value,g.iconStyle),paint=iconComponentPaint(style,g.iconBrand),items=sl.items.slice(g.from,g.to+1),b=items.find(i=>i.iconBase),ic=items.find(i=>i.ic),label=items.find(i=>i.iconStateLabel);if(!b||!ic||!label)return;
 const slot=b.iconBase;b.x=slot.cx-(style.base==='pill'?slot.d*1.6:slot.d)/2;b.y=slot.cy-slot.d/2;b.w=style.base==='pill'?slot.d*1.6:slot.d;b.h=slot.d;b.kind=style.base==='circle'?'ellipse':style.base==='hex'?'hexagon':'roundRect';b.adj=style.base==='circle'?null:style.base==='hex'?slot.d*.24:style.base==='pill'?slot.d/2:slot.d*.18;b.fill=paint.fill;b.line=paint.line;b.ft=0;b.lw=1.25;
 ic.fill=paint.fg;label.runs.forEach(r=>{r.t=paint.label;r.o.color=paint.labelColor;});label.tx.color=paint.labelColor;g.iconStyle=style;}

// XML 不允許的控制字元（U+0000–U+0008、U+000B、U+000C、U+000E–U+001F、U+FFFE/FFFF）：留著會讓 .pptx 需要「修復」→ 所有文字進 model 前先去掉
const stripCtl=s=>String(s==null?'':s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'');

/* ============ 參數：預設值＋ 8 個範本 ============ */
const BASE={
 P:'1F4E79',PD:'1F3864',PT:'DEE7F1',A:'2E75B6',useA:true,
 ink:'3A3A3A',t2:'595959',mute:'6E6E6E',line:'BFBFBF',l2:'D9D9D9',fill:'F2F2F2',
 canvas:false,canvasColor:'F5F5F5',
 r:.1,colR:'full',colStyle:'fill',
 size:'M',sh:false,shFit:true,shMode:'drop',shB:7,shO:2,shA:.25,shDir:90,haloB:16,haloA:.32,ring:false,
 card:'outline',cardLW:1.25,cardLine:'D9D9D9',headColor:'P',bandStyle:'fill',cornerTag:true,ribbonTone:'p',
 tag:'pill',badge:'circle',sep:'tri',chain:'chev',circle:'ring3',circleLW:3,sym:'outlineP',mark:'none',bar:'under',bracket:false,titleColor:'P',
 footRule:false,
 cnW:1.25,cnC:'7F7F7F',cnDash:'solid',cnHead:'triangle',cnTail:'none',cnHs:'med',
 tFont:'Microsoft JhengHei',bFont:'Microsoft JhengHei',nFont:'',tSize:36,tBold:true,lSize:16,lBold:true,nSize:10.5,
 icColor:'P',icVar:'line',icSW:0,
 tbDense:'auto',tbHiColor:'auto',tbHiMode:'auto',tbNeg:false,tbArrow:'mono',tbStatus:true,tbLook:'clean',tbCard:'white',tbCardOn:null,tbHeaderStyle:null,tbStripes:null,tbGrid:null,tbMinus:'auto',tbThou:true,tbWidth:'auto',tbV:'center',tbH:'center',tbSugTitle:true,tbAuto:true,tbFont:'jh',tbPad:'m',tbTight:false,
 /* Missing/v1 sizing is deliberately legacy: opening an old snapshot never reflows it. */
 tbSizingVersion:1,tbWidthMode:'auto',tbHeightMode:'optimal',
 /* v9：可調數量（04／05 頁）、語意色（與品牌色分開）、最小字級（單一元件／待選素材匯出時放大幾何） */
 nLin:4,nLane:3,nPcc:3,nWhy:5,nCause:4,nIcon:3,nList:4,semWarn:'',semGood:'',semBad:'',minFont:0,
 /* v10 標註顏色：alert＝警示色（預設）／P 主色／A 強調色／ink 深灰 */
 anC:'alert'
};
const PRESETS=[
 {id:'navy',zh:'商務深藍卡片',en:'Navy Card',ref:'參考圖 2',desc:'白底＋白色大外框圓與柔和光暈，深藍膠囊白字，▶ 小三角分隔',
  canvas:false,canvasColor:'F5F5F5',sh:true,shB:7,shO:2,shA:.24,haloB:16,haloA:.32,ring:true,
  card:'outline',cardLW:1.25,cardLine:'D9D9D9',tag:'pill',badge:'ring',sep:'tri',chain:'chev',circle:'ring3',circleLW:3,sym:'outlineP',mark:'bar',bar:'under'},
 {id:'green',zh:'墨綠筆記',en:'Green Notes',ref:'參考圖 1',desc:'白底、粗灰外框扁平卡片，墨綠小圓角標籤＋芥末黃點綴，六角鏈與 ▶▶▶ 點狀箭號',
  P:'2F5D50',PD:'24483E',PT:'E2EBE7',A:'C9A227',canvas:false,canvasColor:'F4F4F1',r:.12,
  card:'outline',cardLW:2.25,cardLine:'BFBFBF',tag:'round',badge:'rsq',sep:'dots',chain:'hex',circle:'thick',circleLW:2.25,sym:'thick',mark:'sq',bar:'banner',
  cnW:1.5,cnC:'8C8C8C',cnHs:'med',tSize:40,colR:'small'},
 {id:'frame',zh:'框架鑑',en:'Framework Atlas',ref:'參考圖 3',desc:'淺灰實心圓角卡＋陰影，中英雙語標籤，01 02 編號小膠囊，點狀折線／曲線箭頭',
  P:'2F4B6E',PD:'243A56',PT:'E3E8EF',A:'6B8CB5',useA:false,sh:true,shB:7,shO:2,shA:.24,
  card:'gray',headColor:'ink',tag:'pill',badge:'pill',sep:'tri',chain:'gray',circle:'gray',sym:'gray',bar:'rule',bracket:true,
  cnC:'595959',cnDash:'sysDot',tSize:34,colR:'small'},
 {id:'iceberg',zh:'冰山能力圖',en:'Iceberg Map',ref:'參考圖 4',desc:'炭灰細框直角卡＋角落標籤緞帶，半透明寬欄條上的圓點，細折線樹狀與淺藍漸隱大箭頭',
  P:'404040',PD:'262626',PT:'E7E7E7',A:'5B9BD5',canvas:false,canvasColor:'F5F5F5',r:.03,
  card:'outline',cardLW:1,cardLine:'7F7F7F',headColor:'ink',ribbonTone:'a',tag:'square',badge:'circle',sep:'line',chain:'outline',circle:'thin',circleLW:1,sym:'thin',mark:'vbar',bar:'vbar',
  cnW:1,cnC:'595959',tSize:34},
 {id:'wire',zh:'極簡線框',en:'Hairline',ref:'延伸',desc:'全部 0.75pt 髮絲線、無填色無陰影，細字標題，單一靛藍強調色，空心編號',
  P:'4F5BD5',PD:'2B2B2B',PT:'EEF0FB',A:'E0533D',useA:false,r:0,
  card:'outline',cardLW:.75,cardLine:'A6A6A6',headColor:'ink',bandStyle:'line',tag:'outline',badge:'oring',sep:'harrow',chain:'hairchev',circle:'hair',circleLW:.75,sym:'hair',bar:'over',titleColor:'PD',
  cnW:.75,cnHead:'arrow',tFont:'Microsoft JhengHei Light',tBold:false,tSize:40,colR:'square',colStyle:'dash'},
 {id:'wine',zh:'酒紅精品',en:'Burgundy Atelier',ref:'延伸',desc:'直角、頂邊色條卡片，明體細標題＋金色細線，方形襯線數字，燕尾箭頭',
  P:'7A1F2B',PD:'5E1620',PT:'F3E6E8',A:'B08D57',r:0,
  card:'top',cardLW:.75,cardLine:'D9D9D9',tag:'square',badge:'square',sep:'stealth',chain:'home',circle:'double',circleLW:.75,sym:'square',mark:'sq',bar:'gold',
  cnW:1,cnHead:'stealth',tFont:'PMingLiU',tBold:false,tSize:38,nFont:'Georgia',colR:'square'},
 {id:'teal',zh:'青綠科技',en:'Teal Tech',ref:'延伸',desc:'全圓角膠囊與大圓角卡、較深柔和陰影，淡青底標籤，起點圓點連接線，光暈編號',
  P:'0F7C80',PD:'0B5E61',PT:'E0F0F0',A:'F2A541',r:.22,sh:true,shB:10,shO:3,shA:.2,haloB:18,haloA:.28,
  card:'soft',tag:'soft',badge:'halo',sep:'chev',chain:'pill',circle:'soft',sym:'soft',mark:'dot',bar:'pill',titleColor:'ink',
  cnC:'8C8C8C',cnTail:'oval'},
 {id:'charcoal',zh:'炭灰橘點',en:'Charcoal Dot',ref:'延伸',desc:'炭灰實心表頭卡、2pt 粗線，橘色圓點標記重點，區塊 V 形箭號，粗黑標題＋橘點',
  P:'3A3A3A',PD:'2B2B2B',PT:'EDEDED',A:'F07F2D',r:.05,
  card:'head',headColor:'ink',ribbonTone:'a',tag:'dot',badge:'odot',sep:'block',chain:'block',circle:'heavy',circleLW:2.75,sym:'heavy',mark:'dot',bar:'dot',titleColor:'ink',
  cnW:2,cnC:'3A3A3A',cnHs:'med',tSize:38,colR:'small'},
 {id:'investor',zh:'法說會紅',en:'Investor Red',ref:'參考：法說會',desc:'純白底、左上大號粗體紅標題、淺灰大圓角面板承載內容，紅色外框框出重點，底部細紅線＋灰色小字頁尾，藍色僅作次要強調',
  P:'E60012',PD:'B3000E',PT:'FCE4E6',A:'1F3FBF',r:.14,fill:'E8E8E8',l2:'D4D4D4',
  card:'gray',headColor:'ink',cardLine:'D4D4D4',ribbonTone:'p',tag:'round',badge:'circle',sep:'tri',chain:'gray',circle:'gray',sym:'redbox',mark:'psq',bar:'plain',titleColor:'P',footRule:true,
  cnW:1.25,cnC:'595959',cnHs:'med',tSize:36,nFont:'Arial',colR:'small'}
].map(p=>Object.assign(clone(BASE),p));
const LANG_OF={card:{outline:'白底外框',gray:'淺灰實心',soft:'白底無框＋陰影',head:'實心表頭色帶',top:'頂邊色條'},
 tag:{pill:'全圓角膠囊',round:'小圓角方籤',square:'直角實心',outline:'空心線框',soft:'淡色底膠囊',dot:'圓點方籤'},
 badge:{circle:'實心圓',ring:'實心圓＋白環',halo:'實心圓＋光暈',odot:'實心圓＋橘點',oring:'空心細圓',rsq:'圓角方塊',square:'方形襯線數字',pill:'01 數字膠囊',enc:'①②③ 圈號'},
 sep:{tri:'▶ 小三角',dots:'▶▶▶ 點狀',line:'細線箭頭',harrow:'開放箭頭',stealth:'燕尾箭頭',chev:'細 V 形 ›',block:'區塊 V 形'},
 chain:{chev:'漸層 V 形箭號',hex:'六角形鏈',gray:'灰卡＋▶',outline:'細框方塊',hairchev:'空心線框 V 形',home:'五邊形箭號',pill:'膠囊鏈',block:'區塊 V 形'}};
function langOf(p){return{card:LANG_OF.card[p.card]+(p.card==='outline'?' '+p.cardLW+'pt':'')+(p.sh?'＋陰影':''),tag:LANG_OF.tag[p.tag],badge:LANG_OF.badge[p.badge],sep:LANG_OF.sep[p.sep],
 conn:p.cnW+'pt '+({solid:'實線',sysDot:'點線',sysDash:'虛線',dash:'長虛線'}[p.cnDash]||'')+({triangle:'＋三角箭頭',arrow:'＋開放箭頭',stealth:'＋燕尾箭頭',oval:'＋圓點',none:''}[p.cnHead]||''),chain:LANG_OF.chain[p.chain]};}
const WHITE_PG=new Set(['kpi','tline','mtx','emph']);/* v12 新頁一律白底（不畫淺灰畫布面板） */
const SECTIONS=[['S','開始','Start'],['A','基礎元件','Basics'],['B','流程與結構','Flow & Structure'],['C','資料呈現','Data'],['D','對比與分析','Compare & Analyze'],['E','標註與強調','Annotate & Emphasize'],['F','範例與頁型','Examples & Page types'],['G','求職與作品集','Career & Portfolio'],['X','附錄','Reference']];
/* v14 重整：[key, 標題, 代號, 英文, 群組]；key 是穩定 ID（位置記憶、URL、改字 labels 都用 key） */
const R_=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const SPLIT_PARTS={frame:[R_(0,5),R_(6,11)],cards:[R_(0,8)],tags:[[0,1,2,3,8,9],R_(4,7)],labels:[R_(0,5),[6,7,8,[9,10,11],13,12]],circles:[[0,1,2,3,9,10],R_(4,8)],conn:[R_(0,5),R_(6,11)],flow:[R_(0,10),[13,11,12]],patterns:[R_(0,3),R_(4,7)],kpi:[R_(0,5)],cmp2:[[0,1,[2,3],4,5,6]],emph:[R_(0,3),[8,9,4,5,6,7]],story:[[0,1,2,3,8,9],[4,5,6,7,10,11]],skills:[R_(0,4),R_(5,10)]};
const SPLIT_KEY={};Object.entries(SPLIT_PARTS).forEach(([k,ps])=>ps.forEach((_,i)=>{if(i)SPLIT_KEY[k+(i+1)]=[k,i+1];}));
const SLIDES=[['catalog', '總覽', '00', 'Overview', 'S'],
 ['frame', '頁面骨架', 'A0', 'Page Skeleton', 'A'],
 ['frame2', '頁面骨架（二）', 'A1', 'Page Skeleton II', 'A'],
 ['cards', '卡片與面板', 'A2', 'Cards & Panels', 'A'],
 ['tags', '標籤與編號', 'A3', 'Labels & Numbers', 'A'],
 ['tags2', '標籤與編號（二）', 'A4', 'Labels & Numbers II', 'A'],
 ['labels', '標籤元件', 'A5', 'Label Components', 'A'],
 ['labels2', '標籤元件（二）', 'A6', 'Label Components II', 'A'],
 ['lists', '清單與勾選', 'A7', 'Lists & Checklists', 'A'],
 ['circles', '圓形與流程鏈', 'A8', 'Circles & Chains', 'A'],
 ['circles2', '圓形與流程鏈（二）', 'A9', 'Circles & Chains II', 'A'],
 ['conn', '連接線與箭頭', 'A10', 'Connectors & Arrows', 'A'],
 ['conn2', '連接線與箭頭（二）', 'A11', 'Connectors & Arrows II', 'A'],
 ['icons', '圖示精選', 'A12', 'Icons', 'A'],
 ['iconcomponents', 'Icon 元件', 'A13', 'Icon Components', 'A'],
 ['iconvariants', 'Icon 底座變體', 'A14', 'Icon Base Variants', 'A'],
 ['flow', '流程圖符號', 'B1', 'Flowchart Symbols', 'B'],
 ['flow2', '流程圖範例', 'B2', 'Flowchart Examples', 'B'],
 ['patterns', '常用流程組合', 'B3', 'Flow Patterns', 'B'],
 ['patterns2', '常用流程組合（二）', 'B4', 'Flow Patterns II', 'B'],
 ['flex', '可調數量流程', 'B5', 'Scalable Flows', 'B'],
 ['steps', '編號步驟', 'B6', 'Numbered Steps', 'B'],
 ['struct', '結構元件', 'B7', 'Structure', 'B'],
 ['agenda', '議程與章節', 'B8', 'Agenda & Sections', 'B'],
 ['people', '人員與組織', 'B9', 'People & Team', 'B'],
 ['kpi', 'KPI 卡', 'C1', 'KPI Cards', 'C'],
 ['rating', '評比指標', 'C2', 'Ratings & Status', 'C'],
 ['tline', '時間軸與甘特', 'C3', 'Timeline & Gantt', 'C'],
 ['chart', '圖表頁零件', 'C4', 'Chart Kit', 'C'],
 ['cmp', '前後對比 · 數字', 'D1', 'Before & After', 'D'],
 ['asis', '前後對比 · 版型零件', 'D2', 'Before & After Kit', 'D'],
 ['cmp2', '步驟與欄位對比', 'D3', 'Side-by-side', 'D'],
 ['cmp3', '表格與方案比較', 'D4', 'Tables & Options', 'D'],
 ['mtx', '矩陣與風險', 'D5', 'Matrix & Risk', 'D'],
 ['rca', '原因分析', 'D6', 'Root Cause', 'D'],
 ['rca2', '管理框架', 'D7', 'Fishbone, 8D & RACI', 'D'],
 ['decide', '決策與下一步', 'D8', 'Decision & Next Steps', 'D'],
 ['biz', '商業框架', 'D9', 'Business Frameworks', 'D'],
 ['biz2', '組織、時程與畫布', 'D10', 'Org, Gantt & Canvas', 'D'],
 ['pitch', '提案與募資', 'D11', 'Pitch Kit', 'D'],
 ['annot', '標註', 'E1', 'Callouts', 'E'],
 ['emph', '強調與註腳', 'E2', 'Emphasis & Footnotes', 'E'],
 ['emph2', '強調與註腳（二）', 'E3', 'Emphasis & Footnotes II', 'E'],
 ['shots', '截圖與裝置框', 'E4', 'Screenshots & Frames', 'E'],
 ['story', '引言與故事', 'E5', 'Quotes & Storytelling', 'E'],
 ['quote', '整頁引言', 'E6', 'Full-page Quote', 'E'],
 ['quote2', '整頁引言・主色卡', 'E7', 'Full-page Quote · Card', 'E'],
 ['story2', '引言與故事（二）', 'E8', 'Quotes & Storytelling II', 'E'],
 ['map', '地圖與據點', 'E9', 'Maps & Locations', 'E'],
 ['map2', '亞洲與世界地圖', 'E10', 'Asia & World Maps', 'E'],
 ['cover', '封面頁', 'F1', 'Cover', 'F'],
 ['cover2', '封面・左圖右文', 'F2', 'Cover · Split', 'F'],
 ['cover3', '封面・大數字', 'F3', 'Cover · Big number', 'F'],
 ['section', '章節分隔頁', 'F4', 'Section Divider', 'F'],
 ['section2', '章節・大編號＋目錄', 'F5', 'Section · Index', 'F'],
 ['section3', '章節・置中大標', 'F6', 'Section · Centered', 'F'],
 ['closing', '結尾 Q&A 頁', 'F7', 'Closing & Q&A', 'F'],
 ['closing2', '結尾・Q&A 大字', 'F8', 'Closing · Q&A', 'F'],
 ['closing3', '結尾・純感謝＋聯絡', 'F9', 'Closing · Thanks', 'F'],
 ['ex1', '範例：三圓架構', 'F10', 'Example: 3 circles', 'F'],
 ['ex2', '範例：框架流程', 'F11', 'Example: framework', 'F'],
 ['ex3', '範例：分支樹狀', 'F12', 'Example: tree', 'F'],
 ['sum', '頁型：結論＋3 支撐', 'F13', 'Page: Key takeaway', 'F'],
 ['pcn', '頁型：問題→對策→下一步', 'F14', 'Page: Problem to action', 'F'],
 ['weekly', '頁型：週報一頁', 'F15', 'Page: Weekly one-pager', 'F'],
 ['profile', '自我介紹', 'G1', 'Profile & Intro', 'G'],
 ['skills', '技能與成就', 'G2', 'Skills & Achievements', 'G'],
 ['skills2', '技能與成就（二）', 'G3', 'Skills & Achievements II', 'G'],
 ['star', '專案案例 STAR', 'G4', 'STAR Case Study', 'G'],
 ['folio', '作品集版面', 'G5', 'Portfolio Layouts', 'G'],
 ['plan', '30-60-90 與自我推薦', 'G6', '30-60-90 & Why Me', 'G'],
 ['guide', '風格規範', 'X1', 'Style Guide', 'X'],
 // Append rather than insert: existing IDs, indexes and saved selections stay stable.
 ['schemeemphasis', '方案元件・只有強調', 'A15', 'Scheme Components · Emphasis', 'A'],
 ['schemebody', '方案元件・內文＋強調', 'A16', 'Scheme Components · Body & Emphasis', 'A'],
 ['schemeicon', '方案元件・Icon＋只有強調', 'A17', 'Scheme Components · Icon & Emphasis', 'A'],
 ['schemeiconbody', '方案元件・Icon＋內文＋強調', 'A18', 'Scheme Components · Icon & Body', 'A']];
const SCHEME_CATALOGUE_KEYS=['schemeemphasis','schemebody','schemeicon','schemeiconbody'];
const SCHEME_CATALOGUE_TITLES=['01  沒有內文：只有強調','02  有內文＋強調','03  Icon＋沒有內文','04  Icon＋有內文＋強調'];
// [approved ID, name, title x, title width], relative to each 5.8465-inch half.
const SCHEME_CATALOGUE_STYLES=[['01','短底線＋全寬細線',0,2.1],['02','短直線標記',.2,1.9],['03','中性淡底帶',.17,1.76],['04','開放式底角框',.15,1.8],['05','置中斷線標題',.35,1.4],['07','頂線標示',0,2.1],['08','細框主題',.18,1.74],['09','字標與主題',.66,1.44],['03A','淡色小圓角',.18,1.74],['03B','白底輕陰影',.18,1.74],['03C','深色實心',.18,1.74],['03D','線框與短色條',.34,1.58],['03E','主題色實心',.18,1.74],['03F','淡灰與側色條',.24,1.68]];

const USED={ex1:['A8·A','A8·B','A3·C','A4·B'],ex2:['A2','A3·D','A10·E','B7'],ex3:['B7·A','B7·E','A3·D','A10'],sum:['A0','A2·F','A4·A','C1'],pcn:['A0','D6','D8','A4·C'],weekly:['A0','C1·D','D8·A','A4·A']};
const SWIFF="data:image/png;base64,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";
const PH={"w":"data:image/png;base64,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","m":"data:image/png;base64,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","s":"data:image/png;base64,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","t":"data:image/png;base64,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","p":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAAJYCAIAAAA1x6JHAAAKTElEQVR42u3cwW3bShSF4YhwRSpBBahYFaASVIoWWmjtRXZGBFsxhzxz7/ftHx7A4fw4YYQc7o/nHwDyLB4BgEADINAAAg2AQAMINAACDYBAAwg0AAININAACDQAAg0g0AAINIBAAyDQAAINgEADINAAAg2AQAMINAACDYBAAwg0AAININAACDSAQAMg0AAINIBAAyDQAAINgEADINAAAg2AQAMINAACDSDQAAg0AAININAACDSAQAMg0AAINIBAAyDQAAINgEADINAAAg2AQAMINAACDSDQAAg0AAININAACDSAQAMg0AAINIBAAyDQAAINgEADCDQAAg2AQAMINAACDSDQAAg0AAININAACDSAQAMg0AACDYBAAyDQAAINgEADCDQAAg2AQAMINAACDSDQAAg0AAININAACDSAQAMg0AACDYBAAyDQAAINgEADCDQAAg2AQAMINAACDSDQAAg0gEADINAACDSAQAMg0AACDYBAAyDQAAINgEADCDQAAg0g0AAINAACDSDQAAg0gEADINAACDTATD48AqZzud7+7z88n46eHhM53B9PT4F6LVZtBBrmK7JeI9AwTZTFGoGGCaIs1gg0ujwrpUagkWaZRqAFGl1WagQaaZZpEGikWaYRaJBmmUagkWaZRqBBmmUagUaaZRpe8M+Nos6eFRY0cmNKm9JY0Kizp4cFjbhgSmNBo86eJwINauKpksAnDkRkZz53YEGjzp4zAo1q4Gkj0OiFZ05hvkEjE1l8ksaCRp2dAgKNLuAsEGgUwYkg0GgBzgWBRgWcDgKN+48zQqBx83FSCDTuvPNCoAEQaMwxp4ZA457j7BBo3HCcIALtbuMcEWgABBqzy2ki0LjPOFMEGjcZJyvQAAg0RhbOF4HG7XXKCDQAAo1hhbMWaNxYnDgCDYBAG1M4dwQaAIHGjMLpCzQAAo0BhXcAgQYQaEwnvAkINIBAYzThfUCgAQQacwlvBQINgEADCDT+JIt3A4EGEGhMJLwhCDQAAg0g0PjTK94TBBpAoAEQaACBZio+LOJtEWgABBoAgQYQaIbwSRHvjEADINAACDSAQAMg0J342x68OQINgEADINAAAg2AQAMINAACzb/5pRTeH4EGQKABEGgAgQZAoAEEGgCBBkCg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","q":"data:image/png;base64,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"};

/* ---------- 文字寬度估算（Node 端排版檢查用；瀏覽器預覽改用 canvas 實測） ---------- */
function tw(str,size){let u=0;for(const ch of String(str)){const c=ch.codePointAt(0);
 if(c>=0x2000)u+=1;else if(c===32)u+=.3;else if(/[A-Z]/.test(ch))u+=.66;else if(/[0-9]/.test(ch))u+=.57;else if(/[mw]/.test(ch))u+=.84;else if(/[iljft.,:;'|!()]/.test(ch))u+=.3;else u+=.55;}
 return u*size/72;}

// Shared with the Style Guide and role-linked table highlights. Keep these
// existing semantic rules in one place: AL is not always the raw accent A.
function themeHue(h){const [r,g,b]=[0,2,4].map(i=>parseInt(h.substr(i,2),16)/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx-mn<.12)return -1;
 let H=mx===r?((g-b)/(mx-mn))%6:mx===g?(b-r)/(mx-mn)+2:(r-g)/(mx-mn)+4;return (H*60+360)%360;}
function themeSemanticColors(st){
 const P=st.P,HASA=!!(st.useA&&st.A),A=HASA?st.A:st.P;
 const satOf=h=>{const v=[0,2,4].map(i=>parseInt(h.substr(i,2),16));return (Math.max(...v)-Math.min(...v))/Math.max(1,Math.max(...v));};
 const hp=themeHue(P),ha=HASA?themeHue(A):-1;
 const warn=/^[0-9A-F]{6}$/i.test(st.semWarn||'')?st.semWarn.toUpperCase():(hp>=0&&(hp<=20||hp>=330)&&satOf(P)>.45?'C27C0E':(ha>=0&&(ha<=40||ha>=340)&&satOf(A)>.6&&Math.abs(ha-hp)>25?A:'9A5F00'));
 return{warn,good:/^[0-9A-F]{6}$/i.test(st.semGood||'')?st.semGood:P,bad:/^[0-9A-F]{6}$/i.test(st.semBad||'')?st.semBad:'A15C00'};
}
/* ================= 幾何模型 ================= */
function buildModel(params,opt){
 opt=opt||{};const st=Object.assign(clone(BASE),params||{});
 const P=st.P,PD=st.PD,PTn=st.PT,HASA=!!(st.useA&&st.A),A=HASA?st.A:st.P;
 const G={ink:st.ink,t2:st.t2,mute:st.mute,line:st.line,l2:st.l2,fill:st.fill,g7:mix(st.t2,st.mute,.45),l1:mix(st.mute,st.line,.5),white:'FFFFFF'};
 const F=st.bFont,FL=F==='Microsoft JhengHei'?'Microsoft JhengHei Light':F,nf=st.nFont||F;
 const K=st.lSize/16,LS=v=>Math.round(v*K*2)/2;
 const GF=st.canvas?mix(st.fill,'000000',.05):G.fill;
 const titleColor={P:P,PD:PD,ink:G.ink}[st.titleColor]||P;
 const subC={under:A,banner:P,rule:mix(P,'8C8C8C',.45),vbar:A,over:G.mute,gold:G.t2,pill:P,dot:G.t2}[st.bar];
 const headC=st.card==='head'?'FFFFFF':(st.headColor==='P'?P:G.ink);
 const lblC=st.card==='head'?G.ink:(st.headColor==='P'?PD:G.ink);
 const warns=[],slides=[];let cur=null,sno=0;const NSL=SLIDES.filter(([k])=>!SCHEME_CATALOGUE_KEYS.includes(k)&&!(opt.examples===false&&/^ex\d/.test(k))).length;
 const warn=(k,t)=>warns.push(`[${st.id||'custom'} #${sno}] ${k}: ${String(t).replace(/\n/g,'/').slice(0,30)}`);
 const rr=(w,h,r)=>r==='full'?Math.min(w,h)/2:Math.min(r||0,Math.min(w,h)/2);
 /* 陰影隨尺寸收斂（v5.1）：參數以舊版頁面（卡片、大圓）為基準；比基準小的圖形（總表的小圓、小方塊）按比例縮小模糊與距離，
    避免 16pt 光暈套在 0.6" 小圓上變成一團灰霧。基準＝舊版各類陰影的最小尺寸，所以舊頁面輸出與 v4 完全相同。shFit:false＝v5 原樣。 */
 const SH_REF={halo:2.6,card:.44,small:.28};
 function fitShadow(s,type,w,h){if(!st.shFit||!(w>0&&h>0))return s;const ref=SH_REF[type]||SH_REF.card;const k=Math.max(.42,Math.min(1,Math.min(w,h)/ref));if(k>=1)return s;
  const r=v=>Math.round(v*100)/100;
  return Object.assign({},s,{blur:r(Math.max(2,s.blur*k)),dist:r(s.dist*Math.max(.6,k)),alpha:r(s.alpha*(type==='halo'?.8+.2*k:1)),scale:Math.round((1+(s.scale-1)*k)*10000)/10000});}
 function shadowSpec(type,w,h){const t=type===true||type===1?'card':type;return fitShadow(shadowSpec0(t),t==='halo'?'halo':t==='small'?'small':'card',w,h);}
 function shadowSpec0(type){
  if(type==='halo')return{blur:st.haloB,dist:Math.min(st.shO,2),dir:90,alpha:st.haloA,scale:1.02,color:'000000',kind:'halo'};
  if(type==='small')return{blur:Math.max(3,st.shB*.6),dist:Math.min(st.shO,1.5),dir:st.shDir,alpha:Math.min(.35,st.shA+.04),scale:1,color:'000000',kind:'drop'};
  if(st.shMode==='halo')return{blur:st.shB*1.5,dist:Math.min(st.shO,1),dir:90,alpha:st.shA,scale:1.01,color:'000000',kind:'halo'};
  return{blur:st.shB,dist:st.shO,dir:st.shDir,alpha:st.shA,scale:1,color:'000000',kind:'drop'};}
 /* ---------- 基本圖元：全部寫入 model ---------- */
 function runsOf(text,o){const items=typeof text==='string'?text.split('\n').map((t,i,a)=>({t,br:i<a.length-1})):text;
  const out=[],paras=[[]];
  items.forEach((r,i)=>{r=Object.assign({},r,{t:stripCtl(r.t)});const size=Math.max(9,r.s||o.size||14);const ro={size,font:r.f||o.font||F,bold:r.b!=null?!!r.b:!!o.bold,color:r.c||o.color||G.ink};
   if(r.cs!=null)ro.cs=r.cs;if(r.link)ro.link=r.link;if(r.hl)ro.hl=r.hl;if(r.u)ro.u=r.u;if(r.st||o.strike)ro.strike=1;const brk=r.br&&i<items.length-1;if(brk)ro.br=true;
   out.push({t:r.t,o:ro});paras[paras.length-1].push({t:r.t,size});if(brk)paras.push([]);});
  return{out,paras};}
 function lint(paras,w,h,o){const m=Array.isArray(o.margin)?(o.margin[0]+o.margin[1])/72:2*(o.margin||0)/72;
  const avail=w*(o.inner||1)-m;let need=0;
  paras.forEach(p=>{const pw=p.reduce((a,r)=>a+tw(r.t,r.size),0);const ms=Math.max(1,...p.map(r=>r.size));const n=Math.max(1,Math.ceil(pw/avail-.02));
   if(n>1&&!o.wrap)warn('wrap',p.map(r=>r.t).join(''));need+=n*ms*(o.lsp||1)*1.3/72;});
  const mh=Array.isArray(o.margin)?(o.margin[2]+o.margin[3])/72:2*(o.margin||0)/72;
  if(need>h*(o.innerH||1)-mh+.03)warn('overflow',paras.map(p=>p.map(r=>r.t).join('')).join('/'));}
 function el(kind,x,y,w,h,o){o=o||{};const it={t:'sp',kind,x,y,w,h,name:o.name};
  if(kind){it.fill=o.fill||null;it.ft=o.ft||0;it.line=o.line||null;it.lw=o.lw||1;it.dash=o.dash||'solid';if(o.line){it.head=o.head||null;it.tail=o.tail||null;it.hs=o.hs||'med';}}
  if(o.adj!=null&&o.adj>0)it.adj=o.adj;
  if(o.sh&&(st.sh||o.force))it.sh=shadowSpec(o.sh===true||o.sh===1?'card':o.sh,w,h);
  if(o.mk)it.mk=o.mk;if(o.points)it.points=o.points;if(o.sites)it.sites=o.sites;if(o.bgMatch)it.bgMatch=1;if(it.name)it.name=stripCtl(it.name).replace(/[<>&"]/g,'');if(o.doc)it.doc=1;if(o.cap)it.cap=o.cap;
  if(o.text!=null&&o.text!==''){const R=runsOf(o.text,o);it.runs=R.out;
   it.tx={align:o.align||'center',valign:o.valign||'middle',margin:o.margin!=null?o.margin:(kind?3:0),lsp:o.lsp||1,font:o.font||F,size:Math.max(9,o.size||14),color:o.color||G.ink,bold:!!o.bold,cs:o.cs};
   if(!o.nolint)lint(R.paras,w,h,o);}
  cur.items.push(it);return it;}
 const box=(x,y,w,h,o)=>{o=o||{};const R=rr(w,h,o.r);return el(R>.004?'roundRect':'rect',x,y,w,h,Object.assign({},o,{adj:R>.004?R:null}));};
 const oval=(x,y,w,h,o)=>el('ellipse',x,y,w,h,o||{});
 const circ=(cx,cy,d,o)=>oval(cx-d/2,cy-d/2,d,d,o);
 const txt=(x,y,w,h,t,o)=>el(null,x,y,w,h,Object.assign({align:'left',margin:0},o||{},{text:t}));
 function ln(x1,y1,x2,y2,o){o=o||{};cur.items.push({t:'ln',x1,y1,x2,y2,color:o.c||G.line,w:o.w||1,dash:o.dash||'solid',head:o.head||null,tail:o.tail||null,hs:o.hs||'med'});}
 function path(pts,o){o=o||{};const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);const x0=Math.min(...xs),y0=Math.min(...ys);
  const w=Math.max(Math.max(...xs)-x0,.01),h=Math.max(Math.max(...ys)-y0,.01);
  const points=pts.map(p=>({x:p[0]-x0,y:p[1]-y0}));if(o.close)points.push({close:true});
  return el('custGeom',x0,y0,w,h,Object.assign({},o,{points}));}
 const CN=()=>({c:st.cnC,w:st.cnW,dash:st.cnDash,head:st.cnHead==='none'?null:st.cnHead,tail:st.cnTail==='none'?null:st.cnTail,hs:st.cnHs});
 function conn(pts,o){o=Object.assign(CN(),o||{});const sty={c:o.c,w:o.w,dash:o.dash,head:o.head===false?null:o.head,hs:o.hs,tail:o.tail===false?null:o.tail};
  if(pts.length===2){ln(pts[0][0],pts[0][1],pts[1][0],pts[1][1],sty);return cur.items[cur.items.length-1];}
  return path(pts,{line:sty.c,lw:sty.w,dash:sty.dash,head:sty.head,hs:sty.hs,tail:sty.tail,name:'連接線'});}
 /* ---------- 黏著連接線（v5.2）：端點＝圖形的連接點；匯出時轉成 <p:cxnSp> 並寫入 stCxn／endCxn，PowerPoint 中移動圖形線會跟著走 ----------
    連接點編號依 OOXML 預設圖形定義：rect／roundRect／diamond：0 上 1 左 2 下 3 右；ellipse：0 上 2 左 4 下 6 右；
    parallelogram：0 上 2 右（斜邊中點）4 下 5 左（斜邊中點）；文件在 pptx 中改用預設圖形 flowChartDocument（與預覽的自訂路徑同形）：0 上 1 左 2 下 3 右。
    can（資料庫圓柱）有 5 個連接點：0＝上蓋內緣、1 上 2 左 3 下 4 右 → 程式裡一樣寫 0 上 1 左 2 下 3 右，匯出時自動 +1（CAN_IDX）。
    自訂圖形可帶 sites（[[x,y,方向角]]，相對圖形左上角）：匯出時寫進 <a:cxnLst>（LibreOffice 不認自訂連接點，目前沒有元件使用；分流棒改用 3 段原生方形）。 */
 const CAN_IDX=[1,2,3,4];
 const SITE_DIR={rect:['v','h','v','h'],roundRect:['v','h','v','h'],diamond:['v','h','v','h'],can:['v','h','v','h'],custGeom:['v','h','v','h'],
  ellipse:['v',null,'h',null,'v',null,'h',null],parallelogram:['v',null,'h',null,'v','h']};
 function siteXY(it,i){const x=it.x,y=it.y,w=it.w,h=it.h,a=it.adj||0;if(it.sites){const s=it.sites[i];return[x+s[0],y+s[1]];}
  if(it.kind==='ellipse')return[[x+w/2,y],null,[x,y+h/2],null,[x+w/2,y+h],null,[x+w,y+h/2]][i];
  if(it.kind==='parallelogram'){const d=Math.min(a,w);return[[x+w/2,y],null,[x+w-d/2,y+h/2],null,[x+w/2,y+h],[x+d/2,y+h/2]][i];}
  if(it.kind==='custGeom'&&it.doc)return[[x+w/2,y],[x,y+h/2],[x+w/2,y+h*20172/21600],[x+w,y+h/2]][i];
  return[[x+w/2,y],[x,y+h/2],[x+w/2,y+h],[x+w,y+h/2]][i];}
 function link(a,sa,b,sb,o){o=o||{};const A=Array.isArray(a)?a:siteXY(a,sa),B=Array.isArray(b)?b:siteXY(b,sb);
  const sd=(it,i)=>it.sites?(Math.abs(it.sites[i][2]%180)===90?'v':'h'):(SITE_DIR[it.kind]||[])[i];const da=Array.isArray(a)?(o.dirA||'h'):sd(a,sa),db=Array.isArray(b)?(o.dirB||'h'):sd(b,sb);
  let pts;const eq=(p,q)=>Math.abs(p-q)<.004;
  if(o.via)pts=[A].concat(o.via).concat([B]);
  else if(eq(A[0],B[0])||eq(A[1],B[1]))pts=[A,B];
  else if(da==='h'&&db==='h'){const mx=o.mid!=null?o.mid:(A[0]+B[0])/2;pts=[A,[mx,A[1]],[mx,B[1]],B];}
  else if(da==='v'&&db==='v'){const my=o.mid!=null?o.mid:(A[1]+B[1])/2;pts=[A,[A[0],my],[B[0],my],B];}
  else if(da==='h')pts=[A,[B[0],A[1]],B];else pts=[A,[A[0],B[1]],B];
  const it=conn(pts,Object.assign({tail:false},o.style||{}));
  const ix=(it,i)=>it.kind==='can'?CAN_IDX[i]:i;it.cx={};if(!Array.isArray(a))it.cx.a=[cur.items.indexOf(a),ix(a,sa)];if(!Array.isArray(b))it.cx.b=[cur.items.indexOf(b),ix(b,sb)];
  return it;}
 function curve(p0,c1,c2,p1,o){o=Object.assign(CN(),o||{});const all=[p0,c1,c2,p1];const x0=Math.min(...all.map(p=>p[0])),y0=Math.min(...all.map(p=>p[1]));
  const w=Math.max(...all.map(p=>p[0]))-x0,h=Math.max(...all.map(p=>p[1]))-y0;const q=p=>({x:p[0]-x0,y:p[1]-y0});
  el('custGeom',x0,y0,Math.max(w,.01),Math.max(h,.01),{line:o.c,lw:o.w,dash:o.dash==='solid'?'sysDash':o.dash,head:o.head,hs:o.hs,tail:o.tail===false?null:o.tail,name:'曲線箭頭',
   points:[q(p0),Object.assign(q(p1),{curve:{type:'cubic',x1:c1[0]-x0,y1:c1[1]-y0,x2:c2[0]-x0,y2:c2[1]-y0}})]});}
 function tri(x,y,w,h,o){path([[x,y],[x+w,y+h/2],[x,y+h]],Object.assign({close:true,name:'三角形'},o));}
 function topRound(x,y,w,h,r,o){const R=Math.min(r,h,w/2);if(R<.005)return box(x,y,w,h,o);
  el('custGeom',x,y,w,h,Object.assign({},o,{points:[{x:0,y:h},{x:0,y:R},{x:R,y:0,curve:{type:'arc',hR:R,wR:R,stAng:180,swAng:90}},{x:w-R,y:0},{x:w,y:R,curve:{type:'arc',hR:R,wR:R,stAng:270,swAng:90}},{x:w,y:h},{close:true}]}));}

 /* 原生表格：cells[r][c]={t,fill,color,bold,size,align,bT,bB}（bT／bB＝{c,w} 上／下框線；只畫橫線，較精緻） */
 function table(x,y,colW,rowH,cells,o){o=o||{};const w=colW.reduce((a,b)=>a+b,0),h=rowH.reduce((a,b)=>a+b,0);
  const C=cells.map(r=>r.map(c=>{c=typeof c==='string'?{t:c}:c;const size=c.size||o.size||10;
   const runs=runsOf(c.t==null?'':c.t,{size,color:c.color||G.ink,bold:!!c.bold,font:c.font||F}).out;
   return{runs,fill:c.fill||null,align:c.align||o.align||'center',size,color:c.color||G.ink,bold:!!c.bold,font:c.font||F,mL:o.mL!=null?o.mL:4,mT:o.mT!=null?o.mT:1,bT:c.bT||null,bB:c.bB||null,bL:c.bL||null,bR:c.bR||null};}));
  const it={t:'tbl',x,y,w,h,colW:colW.slice(),rowH:rowH.slice(),cells:C,name:o.name||'表格'};cur.items.push(it);return it;}
 /* 圖示（v7）：Material Symbols＝一個填色自訂圖形（多段子路徑、無外框）；tint／solid 變化另加一個底圓。回傳 {bg,glyph} */
 const ICC=c=>({P,PD,A:HASA?A:P,g:G.t2,ink:G.ink,w:'FFFFFF'}[c]||P);
 function icon(id,x,y,s,o){o=o||{};if(!ICONS||!Object.prototype.hasOwnProperty.call(ICONS.BY,id))return{};const ic=ICONS.BY[id];const variant=o.variant||st.icVar||'line';
  const fg0=o.color||ICC(o.tone||st.icColor);const g=ICONS.geom(variant,ICONS.weightOf(st));let fg=fg0,bg=null;
  if(g.circle){const bf=g.dark?fg0:mix(fg0,'FFFFFF',.86);bg=g.shape==='square'?box(x,y,s,s,{fill:bf,r:s*.22,name:'圖示底方'}):g.shape==='ring'?oval(x,y,s,s,{fill:'FFFFFF',line:fg0,lw:Math.max(.75,s*1.3/24*72/72*1.2),name:'圖示外框圓'}):oval(x,y,s,s,{fill:bf,name:'圖示底圓'});if(g.dark)fg='FFFFFF';}
  const glyph=el('custGeom',x,y,s,s,{points:ICONS.points(id,s,g.k,g.off,g.wt),fill:fg,name:'圖示 '+ic.zh});glyph.ic={id,variant,wt:ICONS.weightOf(st)};
  return{bg,glyph};}
 /* ---------- 版面骨架 ---------- */
 function canvas(){if(st.canvas)box(.25,.25,W-.5,H-.5,{fill:st.canvasColor,r:.06,name:'畫布面板'});}
 function footer(){const y=st.canvas?6.9:7.0;if(st.footRule)ln(.4,y-.05,W-.4,y-.05,{c:P,w:1.25});
  txt(.6,y,6,.24,[{t:st.zh||'自訂風格',b:1,c:G.t2},{t:'｜精緻圖解元件庫',c:G.mute}],{size:9});
  txt(W-.6-1.5,y,1.5,.24,String(sno).padStart(2,'0')+' / '+String(NSL).padStart(2,'0'),{size:9,color:G.mute,align:'right',font:nf});}
 function title(t,sub0){if(opt.iconPackName&&(cur.key==='iconvariants'||cur.key==='iconcomponents')){const bases=cur.key==='iconvariants';t=opt.iconPackName+'｜'+(bases?'24 款底座':'9 種組合元件');sub0=bases?'線框透明・淡底・實心・淡底＋線框｜4 種形狀，6 種狀態':'同一圖示套用每個位置｜卡片、KPI、膠囊、步驟、時間軸，皆可編輯';}if(cur.part>1)t=String(t).replace(/^(.*?[\u3000-\u9fff\uff00-\uffef])(\s+[A-Za-z]|$)/,'$1'+'（'+['','','二','三','四'][cur.part]+'）$2');const T=st.bracket?'《'+t+'》':t;const ts=cur.tsz||st.tSize;const S=!!(sub0&&String(sub0).trim());const sub=S?sub0:'';
  const txt0=txt,txt1=(x,y,w,h,v,o)=>S?txt0(x,y,w,h,v,o):null;
  const tt=(x,y,w,o)=>txt(x,y,w,.72,T,Object.assign({size:ts,bold:st.tBold,color:titleColor,font:st.tFont,name:'標題'},o||{}));
  switch(st.bar){
   case 'under':tt(.6,.42,11);txt1(.6,1.12,11,.38,sub,{size:16,color:subC,font:FL});box(.6,1.6,.55,.06,{fill:P});break;
   case 'banner':{tt(.6,.36,11);if(!S){box(.6,1.17,.5,.08,{fill:P});box(.6+.57,1.17,.12,.08,{fill:A});break;}const bw=tw(sub,14)+.44;box(.6,1.17,bw,.4,{fill:P,text:sub,size:14,color:'FFFFFF',bold:1});box(.6+bw+.07,1.17,.12,.4,{fill:A});break;}
   case 'rule':tt(st.bracket?.5:.6,.4,11);txt1(.6,1.1,11,.36,sub,{size:15,color:subC});ln(.6,1.62,W-.6,1.62,{c:G.l2,w:.75});box(.6,1.595,1.1,.05,{fill:P});break;
   case 'vbar':box(.6,.5,.07,1.02,{fill:A});tt(.86,.4,11);txt1(.86,1.1,11,.38,sub,{size:16,color:subC,font:FL});break;
   case 'over':box(.6,.42,.5,.035,{fill:P});tt(.6,.56,11);txt1(.6,1.3,11,.34,sub,{size:14,color:G.mute,font:FL});break;
   case 'gold':tt(.6,.38,11);box(.6,1.16,.9,.025,{fill:A});txt1(.6,1.27,11,.34,sub,{size:14,color:G.t2,cs:1});break;
   case 'pill':tt(.6,.42,11);box(.6,1.27,.45,.1,{fill:P,r:'full'});txt1(1.17,1.13,11,.38,sub,{size:16,color:subC,font:FL});break;
   case 'plain':tt(.5,.34,11.5);txt1(.52,1.06,11,.36,sub,{size:15,color:G.t2});break;
   case 'dot':{tt(.6,.4,11);const nLat=(T.match(/[A-Za-z]/g)||[]).length;const dx=.6+tw(T,ts)+nLat*ts/72*.07+.08;circ(dx+.08,.4+.36+ts/150,.16,{fill:A});txt1(.6,1.12,11,.38,sub,{size:15,color:subC});box(.6,1.6,.5,.06,{fill:A});break;}}}
 function mark(x,yc){switch(st.mark){case 'bar':box(x,yc-.11,.05,.22,{fill:P});return .17;case 'vbar':box(x,yc-.11,.05,.22,{fill:A});return .17;
   case 'sq':box(x,yc-.055,.11,.11,{fill:A});return .22;case 'psq':box(x,yc-.055,.11,.11,{fill:P});return .22;case 'dot':circ(x+.055,yc,.11,{fill:A});return .22;default:return 0;}}
 function section(x,y,w,t){const dx=mark(x,y+.16);txt(x+dx,y,w-dx,.32,t,{size:LS(13),bold:st.lBold,color:G.ink});ln(x,y+.42,x+w,y+.42,{c:G.l2,w:.75});}
 function note(x,y,w,t,o){txt(x,y,w,(o&&o.h)||.28,t,Object.assign({size:st.nSize,color:G.mute,wrap:o&&o.wrap},o||{}));}

 /* ---------- 標籤 ---------- */
 function tagLook(tone){const W2='FFFFFF';
  switch(st.tag){
   case 'pill':return{p:{fill:P,c:W2},a:HASA?{fill:A,c:W2}:{fill:PTn,c:P},g:{fill:GF,c:G.ink},o:{line:P,lw:1,c:P,fill:W2}}[tone];
   case 'round':return{p:{fill:P,c:W2},a:{fill:A,c:HASA&&lum(A)>.5?G.ink:W2},g:{fill:mix(GF,'000000',.03),c:G.ink},o:{line:G.line,lw:1.25,c:G.t2,fill:W2}}[tone];
   case 'square':return{p:{fill:P,c:W2},a:{fill:A,c:W2},g:{fill:mix(GF,'000000',.05),c:G.ink},o:{line:P,lw:.75,c:P,fill:W2}}[tone];
   case 'outline':return{p:{line:P,lw:.75,c:P},a:{line:G.ink,lw:.75,c:G.ink},g:{line:G.l1,lw:.75,c:G.t2},o:{line:P,lw:.75,c:P,dash:'dash'}}[tone];
   case 'soft':return{p:{fill:PTn,c:P},a:HASA?{fill:mix(A,'FFFFFF',.78),c:mix(A,'000000',.45)}:{fill:P,c:W2},g:{fill:GF,c:G.t2},o:{fill:P,c:W2}}[tone];
   case 'dot':return{p:{fill:P,c:W2},a:{fill:A,c:W2},g:{fill:GF,c:G.ink},o:{fill:W2,line:G.line,lw:1,c:G.ink}}[tone];}}
 function tagR(h){return st.tag==='pill'||st.tag==='soft'?h/2:st.tag==='round'?.05:st.tag==='dot'?.03:0;}
 function tagW(t,size,h){const pad=Math.max(.13,h*.42)+(st.tag==='dot'?size/72*.75:0);return tw(t,size)+2*pad;}
 function tag(x,y,t,o){o=o||{};const size=o.size||12,h=o.h||Math.max(.3,size/72*2.05),w=o.w||tagW(t,size,h);
  if(o.anchor==='right')x-=w;else if(o.anchor==='center')x-=w/2;
  const L=tagLook(o.tone||'p');const bold=st.tag!=='outline'||o.tone==='p';const sh=o.sh?'small':0;
  if(st.tag==='dot'){const dd=size/72*.5,dx=Math.max(.13,h*.42);
   box(x,y,w,h,{fill:L.fill,line:L.line,lw:L.lw,r:tagR(h),text:t,size,color:L.c,bold:1,margin:[(dx+dd+.07)*72,dx*72*.6,0,0],align:o.w?'center':'left',name:'標籤'});
   circ(x+dx+dd/2,y+h/2,dd,{fill:o.tone==='a'?'FFFFFF':A});return w;}
  box(x,y,w,h,{fill:L.fill,line:L.line,lw:L.lw,dash:L.dash,r:tagR(h),text:t,size,color:L.c,bold,margin:[2,2,0,0],sh,name:'標籤'});return w;}

 /* ---------- 編號 ---------- */
 function badge(cx,cy,n,o){o=o||{};const d=o.d||.42,size=o.size||Math.round(d*30),t=String(n);const W2='FFFFFF';const RG=q=>o.ring&&!q.line?Object.assign(q,{line:W2,lw:1.5}):q;   // ring：貼在卡片角落時加白環，與卡片框線分開
  switch(st.badge){
   case 'ring':circ(cx,cy,d,{fill:o.alt?A:P,line:W2,lw:1.75,sh:'small',text:t,size,bold:1,color:W2,margin:0,name:'編號'});break;
   case 'rsq':box(cx-d/2,cy-d/2,d,d,RG({fill:o.alt?A:P,r:.06,text:t,size,bold:1,color:o.alt&&HASA?G.ink:W2,margin:0,name:'編號'}));break;
   case 'pill':{const w=Math.max(d*1.25,tw(t,size*.8)+.2),h=d*.68;box(cx-w/2,cy-h/2,w,h,RG({fill:o.alt?PTn:P,r:'full',text:t,size:Math.round(size*.8),bold:1,color:o.alt?P:W2,margin:0,name:'編號'}));break;}
   case 'circle':circ(cx,cy,d,RG({fill:o.alt?A:P,text:t,size,bold:1,color:W2,margin:0,name:'編號'}));break;
   case 'oring':circ(cx,cy,d,{fill:W2,line:o.alt?G.ink:P,lw:.75,text:t,size,color:o.alt?G.ink:P,font:FL,margin:0,name:'編號'});break;
   case 'square':box(cx-d/2,cy-d/2,d,d,RG({fill:o.alt?A:P,text:t,size,color:W2,font:st.nFont||'Georgia',margin:0,name:'編號'}));break;
   case 'halo':circ(cx,cy,d*1.32,{fill:o.alt?mix(A,'FFFFFF',.75):PTn});circ(cx,cy,d,RG({fill:o.alt?A:P,text:t,size,bold:1,color:W2,margin:0,name:'編號'}));break;
   case 'odot':circ(cx,cy,d,RG({fill:o.alt?A:P,text:t,size,bold:1,color:W2,margin:0,name:'編號'}));if(d>=.4&&!o.nodot)circ(cx+d*.36,cy-d*.36,d*.3,{fill:A,line:W2,lw:1});break;
   case 'enc':{const num=parseInt(t,10);const g=num>=1&&num<=20&&String(num)===t.replace(/^0/,'')?String.fromCodePoint(0x245F+num):t;
    if(g!==t)txt(cx-d/2,cy-d/2,d,d,g,{size:Math.round(d*46),color:o.alt?A:P,align:'center',name:'編號'});
    else circ(cx,cy,d,{fill:'FFFFFF',line:o.alt?A:P,lw:1.25,text:t,size,bold:1,color:o.alt?A:P,margin:0,name:'編號'});break;}}}
 const two=n=>String(n).padStart(2,'0');
 const bnum=n=>st.badge==='pill'||st.badge==='square'?two(n):String(n);

 /* ---------- 分隔符號 ---------- */
 function sep(cx,cy,o){o=o||{};const k=o.k||1;
  switch(o.kind||st.sep){
   case 'tri':tri(cx-.075*k,cy-.1*k,.15*k,.2*k,{fill:G.t2});break;
   case 'dots':for(let i=0;i<3;i++)tri(cx-.19*k+i*.14*k,cy-.065*k,.1*k,.13*k,{fill:A});break;
   case 'line':ln(cx-.24*k,cy,cx+.24*k,cy,{c:G.t2,w:1,head:'triangle',hs:'lg'});break;
   case 'harrow':ln(cx-.26*k,cy,cx+.26*k,cy,{c:G.g7,w:.75,head:'arrow',hs:'lg'});break;
   case 'stealth':ln(cx-.26*k,cy,cx+.24*k,cy,{c:P,w:1,head:'stealth',hs:'lg'});break;
   case 'chev':el('chevron',cx-.055*k,cy-.11*k,.11*k,.22*k,{fill:P,adj:.075*k,name:'分隔'});break;
   case 'block':el('chevron',cx-.1*k,cy-.15*k,.2*k,.3*k,{fill:A,adj:.12*k,name:'分隔'});break;}}
 const sepW={tri:.4,dots:.55,line:.62,harrow:.66,stealth:.66,chev:.4,block:.45};

 /* ---------- 卡片 ---------- */
 function cardBase(x,y,w,h,o){o=o||{};const sh=o.sh!=null?o.sh:1;const force=!!o.force;
  switch(st.card){
   case 'outline':box(x,y,w,h,{fill:'FFFFFF',line:st.cardLine,lw:st.cardLW,r:st.r,sh,force,name:'卡片'});break;
   case 'gray':box(x,y,w,h,{fill:GF,r:st.r,sh,force,name:'卡片'});break;
   case 'soft':box(x,y,w,h,{fill:'FFFFFF',r:st.r,sh,force,line:st.sh||force?null:G.l2,lw:.75,name:'卡片'});break;
   case 'top':box(x,y,w,h,{fill:'FFFFFF',line:st.cardLine,lw:st.cardLW,r:st.r,sh,force,name:'卡片'});topRound(x,y,w,.07,rr(w,h,st.r),{fill:P,name:'色條'});break;
   case 'head':box(x,y,w,h,{fill:GF,r:st.r,sh,force,name:'卡片'});break;}}
 function card(x,y,w,h,o){o=o||{};const pad=.26;cardBase(x,y,w,h,o);const hs=LS(16);
  let by=y+.3;
  if(o.head){const band=o.band||st.card==='head';const hh=.58;const BC=o.band&&st.card==='head'?A:P;
   if(band){const R=rr(w,h,st.r);
    if(st.bandStyle==='line'){ln(x,y+hh,x+w,y+hh,{c:P,w:1.5});box(x,y,.08,hh,{fill:P});txt(x+pad,y,w-2*pad,hh,o.head,{size:hs,color:P,bold:st.lBold&&st.tBold});}
    else{topRound(x,y,w,hh,R,{fill:BC,name:'表頭'});txt(x+pad,y,w-2*pad,hh,o.head,{size:hs,bold:st.lBold,color:'FFFFFF'});}by=y+hh+.2;}
   else{const ty=y+(st.card==='top'?.2:.16);txt(x+pad,ty,w-2*pad,.44,o.en?[{t:o.head,s:hs,b:st.lBold,c:headC},{t:'  '+o.en,s:10,c:G.mute,f:nf}]:o.head,{size:hs,bold:st.lBold,color:headC});
    if(st.card==='outline'||st.card==='top')ln(x+pad,ty+.54,x+w-pad,ty+.54,{c:G.l2,w:.75});by=ty+.7;}}
  if(o.body)txt(x+pad,by,w-2*pad,y+h-by-.2,o.body,{size:12,color:G.t2,valign:'top',lsp:1.25,wrap:1});
  if(o.tag)ribbon(x+w-.22,y,o.tag,'p','right');
  if(o.tag2)ribbon(x+.22,y+h,o.tag2,'g','left');}
 function ribbon(x,yc,t,tone,anchor){const T=tone==='p'?st.ribbonTone:'g';tag(x,yc-.14,t,{tone:T,size:10,h:.28,anchor,sh:1});}

 /* ---------- 大圓 / 疊圓 ---------- */
 function circleShape(x,y,d,o){o=o||{};const lw=st.circleLW,f=o.force?{force:1}:{};
  if(st.ring&&(st.sh||o.force)&&!o.noring)oval(x-.07,y-.07,d+.14,d+.14,{line:mix(G.l2,'FFFFFF',.35),lw:.75,name:'外圈細環'});
  const sh=o.nosh?0:'halo';
  switch(st.circle){
   case 'ring3':oval(x,y,d,d,Object.assign({fill:'FFFFFF',line:G.l2,lw,sh,name:'光暈大圓'},f));break;
   case 'thick':oval(x,y,d,d,Object.assign({fill:'FFFFFF',line:G.line,lw,sh,name:'大圓'},f));break;
   case 'gray':oval(x,y,d,d,Object.assign({fill:GF,sh,name:'光暈大圓'},f));break;
   case 'thin':oval(x,y,d,d,Object.assign({fill:'FFFFFF',line:G.g7,lw,sh,name:'大圓'},f));break;
   case 'hair':oval(x,y,d,d,Object.assign({fill:'FFFFFF',line:G.l1,lw,sh,name:'大圓'},f));break;
   case 'double':oval(x,y,d,d,Object.assign({fill:'FFFFFF',line:G.l2,lw,sh,name:'大圓'},f));{const k=d>1.2?.09:d*.06;oval(x+k,y+k,d-2*k,d-2*k,{line:A,lw:.75});}break;
   case 'soft':oval(x,y,d,d,Object.assign({fill:'FFFFFF',sh,line:(st.sh||o.force)&&!o.nosh?null:G.l2,lw:.75,name:'光暈大圓'},f));break;
   case 'heavy':oval(x,y,d,d,Object.assign({fill:'FFFFFF',line:P,lw,sh,name:'大圓'},f));break;}}
 function bigCircle(cx,cy,r,big,sub){const d=2*r,x=cx-r,y=cy-r;
  circleShape(x,y,d);
  const bs=Math.round(r*30);
  txt(x,cy-r*.74,d,r*.62,big,{size:bs,bold:st.tBold,color:st.circle==='hair'?PD:G.t2,align:'center',font:st.nFont||(st.tBold?F:FL)});
  if(sub)txt(x+r*.2,cy-r*.1,d-r*.4,r*.56,sub,{size:LS(15),bold:st.lBold,color:st.circle==='hair'?P:PD,align:'center',lsp:1.05,wrap:1});}
 function smallCircle(cx,cy,d,t,o){o=o||{};const W2='FFFFFF';
  if(st.badge==='oring'||st.badge==='enc')return circ(cx,cy,d,{fill:W2,line:P,lw:1,text:t,size:LS(16),color:P,margin:0,sh:'small',name:'小圓'});
  if(st.badge==='halo')circ(cx,cy,d*1.18,{fill:PTn});
  const fill=st.badge==='odot'&&o.hi?A:P;const ring=!['rsq','odot','halo'].includes(st.badge);
  circ(cx,cy,d,{fill,line:ring?W2:null,lw:2.5,sh:'small',text:t,size:LS(16),bold:1,color:W2,margin:0,name:'小圓'});}

 /* ---------- 流程鏈 ---------- */
 function chain(x,y,w,h,labels,o){o=o||{};const n=labels.length,W2='FFFFFF',size=o.size||LS(16);
  const lab=(i)=>Array.isArray(labels[i])?[{t:labels[i][0],s:size,b:1,br:1},{t:labels[i][1],s:Math.round(size*.62),b:0}]:labels[i];
  const arrowy=(kind,fills)=>{const d=h*.36,g=.06;const iw=(w+(n-1)*(d-g))/n;
   for(let i=0;i<n;i++){const xi=x+i*(iw-d+g);const f=fills(i);const first=i===0||kind==='home';
    el(first?'homePlate':'chevron',xi,y,iw,h,{fill:f.fill,line:f.line,lw:f.lw,adj:d,text:lab(i),size,bold:f.bold!==0&&st.lBold,color:f.c,
     margin:[first?6:2,2,0,0],inner:1-(first?1:2)*d/iw,name:'流程鏈'});}};
  const sepped=(drawItem,sepKind)=>{const sw=(sepW[sepKind]||.45)*(n>=5?.78:1);const iw=(w-(n-1)*sw)/n;
   for(let i=0;i<n;i++){const xi=x+i*(iw+sw);drawItem(i,xi,iw);if(i<n-1)sep(xi+iw+sw/2,y+h/2,{kind:sepKind});}};
  const B=st.lBold;
  switch(st.chain){
   case 'chev':arrowy('chev',i=>({fill:mix(P,'FFFFFF',Math.min(.42,i*(.42/(n-1||1)))),c:W2}));break;
   case 'hex':sepped((i,xi,iw)=>el('hexagon',xi,y,iw,h,{fill:P,adj:h*.28,text:lab(i),size,bold:B,color:W2,margin:[1,1,0,0],inner:1-2*h*.28*.85/iw,name:'流程鏈'}),'dots');break;
   case 'gray':sepped((i,xi,iw)=>box(xi,y,iw,h,{fill:GF,r:st.r,sh:1,text:lab(i),size,bold:B,color:G.ink,name:'流程鏈'}),'tri');break;
   case 'outline':sepped((i,xi,iw)=>box(xi,y,iw,h,{fill:'FFFFFF',line:i===(o.hi||0)?P:G.g7,lw:i===(o.hi||0)?1.5:1,r:st.r,text:lab(i),size,bold:B,color:G.ink,name:'流程鏈'}),'line');break;
   case 'hairchev':arrowy('chev',i=>({fill:'FFFFFF',line:i===0?P:G.l1,lw:.75,c:i===0?P:G.ink,bold:0}));break;
   case 'home':arrowy('home',i=>i===0?{fill:P,c:W2}:{fill:G.fill,c:G.ink});break;
   case 'pill':sepped((i,xi,iw)=>box(xi,y,iw,h,{fill:i===n-1?P:PTn,r:'full',sh:i===n-1?'small':0,text:lab(i),size,bold:B,color:i===n-1?W2:P,name:'流程鏈'}),'chev');break;
   case 'block':arrowy('chev',i=>({fill:i===n-1?A:(i%2?mix(P,'FFFFFF',.2):P),c:W2}));break;}}
 const chainDims=(w,h,n)=>{const d=['chev','hairchev','block','home'].includes(st.chain);
  const sw=d?0:(sepW[{hex:'dots',gray:'tri',outline:'line',pill:'chev'}[st.chain]]||.45)*(n>=5?.78:1);
  const iw=d?(w+(n-1)*(h*.36-.06))/n:(w-(n-1)*sw)/n;return{iw,step:d?iw-h*.36+.06:iw+sw};};

 /* ---------- 流程圖符號 ---------- */
 function symLook(strong,alt){const W2='FFFFFF';
  switch(st.sym){
   case 'outlineP':return strong?{fill:P,c:W2,sh:1}:alt?{fill:PTn,line:P,lw:1.5,c:PD,sh:1}:{fill:W2,line:P,lw:1.5,c:G.ink,sh:1};
   case 'thick':return strong?{fill:P,c:W2}:alt?{fill:W2,line:A,lw:2.25,c:G.ink}:{fill:W2,line:G.line,lw:2.25,c:G.ink};
   case 'gray':return strong?{fill:P,c:W2,sh:1}:alt?{fill:PTn,c:PD,sh:1}:{fill:GF,c:G.ink,sh:1};
   case 'thin':return strong?{fill:P,c:W2}:alt?{fill:mix(A,'FFFFFF',.8),line:A,lw:1,c:G.ink}:{fill:W2,line:G.g7,lw:1,c:G.ink};
   case 'hair':return strong?{fill:W2,line:P,lw:1.25,c:P}:alt?{fill:W2,line:P,lw:.75,c:G.ink,dash:'dash'}:{fill:W2,line:G.l1,lw:.75,c:G.ink};
   case 'square':return strong?{fill:P,c:W2}:alt?{fill:PTn,line:P,lw:.75,c:PD}:{fill:W2,line:G.l1,lw:.75,c:G.ink};
   case 'soft':return strong?{fill:P,c:W2,sh:1}:alt?{fill:HASA?mix(A,'FFFFFF',.75):PTn,c:G.ink,sh:1}:{fill:PTn,c:PD};
   case 'heavy':return strong?{fill:P,c:W2}:alt?{fill:W2,line:A,lw:2,c:G.ink}:{fill:GF,line:P,lw:2,c:G.ink};
   case 'redbox':return strong?{fill:W2,line:P,lw:2.25,c:P}:alt?{fill:W2,line:G.line,lw:1,c:G.ink}:{fill:GF,c:G.ink};}}
 function sym(kind,x,y,w,h,t,o){o=o||{};const L=symLook(o.strong,o.alt);const size=o.size||LS(14);
  const base={fill:L.fill,line:L.line,lw:L.lw,dash:L.dash,sh:L.sh?'small':0,text:t,size,bold:st.tBold&&st.lBold,color:L.c};
  switch(kind){
   case 'term':return box(x,y,w,h,Object.assign(base,{r:'full',name:'開始／結束'}));break;
   case 'proc':return box(x,y,w,h,Object.assign(base,{r:st.r>0?(st.sym==='soft'?st.r:Math.min(st.r,.12)):0,name:'處理'}));break;
   case 'dec':return el('diamond',x,y,w,h,Object.assign(base,{inner:.62,margin:0,name:'判斷'}));break;
   case 'io':return el('parallelogram',x,y,w,h,Object.assign(base,{adj:h*.42,inner:.8,name:'輸入輸出'}));break;
   case 'doc':return el('custGeom',x,y,w,h,Object.assign(base,{doc:1,margin:[3,3,h*.2*72,0],innerH:.8,name:'文件',points:[{x:0,y:0},{x:w,y:0},{x:w,y:h*.802},{x:0,y:h*.934,curve:{type:'cubic',x1:w*.5,y1:h*.802,x2:w*.5,y2:h*1.1075}},{close:true}]}));break;
   case 'db':return el('can',x,y,w,h,Object.assign(base,{adj:h*.13,margin:[2,2,0,0],name:'資料庫'}));break;}}
 const node=(x,y,w,h,t,o)=>sym('proc',x,y,w,h,t,Object.assign({size:LS(13)},o||{}));

 /* ---------- 寬欄透明條、漸隱大箭頭 ---------- */
 function colBar(x,y,w,h){const R=st.colR==='full'?w/2:st.colR==='small'?Math.max(st.r,.05):0;
  if(st.colStyle==='dash')return box(x,y,w,h,{line:G.l1,lw:.75,dash:'dash',r:R,name:'寬欄條'});
  box(x,y,w,h,{fill:G.l1,ft:62,r:R,name:'寬欄條'});}
 function fadeArrow(x,y,w,len,dir,color){color=color||A;const n=6,sw=w*.5,hh=w*.62,a=12;
  const shaft=len-hh,sx=x+(w-sw)/2;
  for(let i=0;i<n;i++){const yi=y+i*shaft/n;box(sx,yi,sw,y+shaft-yi+.01,{fill:color,ft:100-a,name:'漸隱箭頭'});}
  path([[x,y+shaft],[x+w,y+shaft],[x+w/2,y+len]],{close:true,fill:color,ft:Math.round(100*Math.pow(1-a/100,n)),name:'漸隱箭頭'});}
 function fadeBar(x,y,w,h,color){color=color||G.l1;const n=6,a=11,hh=w*.55;
  for(let i=0;i<n;i++){const yi=y+hh+i*(h-2*hh)/(2*n);box(x+w*.25,yi,w*.5,h-2*hh-2*(yi-y-hh)+.01,{fill:color,ft:100-a,name:'漸隱直條'});}
  path([[x,y+hh],[x+w/2,y],[x+w,y+hh]],{close:true,fill:color,ft:100-a});
  path([[x,y+h-hh],[x+w,y+h-hh],[x+w/2,y+h]],{close:true,fill:color,ft:Math.round(100*Math.pow(1-a/100,n))});}

 /* ---------- 元件群組：記錄 items 範圍 → pptx 群組、預覽可點選複製 ---------- */
 function grp(name,fn,meta){const a=cur.items.length;fn();const b=cur.items.length-1;if(b<a)return;
  const bb=bboxOf(cur.items.slice(a,b+1));cur.groups.push(Object.assign({name,from:a,to:b},bb,meta||{}));}
 /* 警示色（v9 與品牌色分開）：可在「語意色」指定；自動＝主色是紅系（法說會紅、酒紅）→ 琥珀色（不再與主色同色）；暖色強調色→強調色；否則克制的磚紅 */
 const {warn:AL,good:GOOD,bad:BAD}=themeSemanticColors(st);/* v12：不用紅綠表示好壞 → 良＝主色、不良＝深琥珀，再配 ▲▼／正負號／文字 */
 const ALt=mix(AL,'FFFFFF',.86),ALd=mix(AL,'000000',.25);
 /* ---------- v10 標註（Annotation）：疊在貼上的 SPC 管制圖／晶圓圖／截圖上。只有線框（透明底），文字泡泡與旗標才有底色；預設警示色 ---------- */
 const AC={alert:AL,P,A:HASA?A:PD,ink:G.ink}[st.anC]||AL,ACd=mix(AC,'000000',.22),anLW=Math.max(1.75,Math.min(3,st.cnW*1.4));
 const AN={
  box:(x,y,w,h,o)=>{o=o||{};return box(x,y,w,h,{line:AC,lw:o.lw||anLW,dash:o.dash?'dash':'solid',r:Math.min(.1,Math.min(w,h)*.22),name:o.dash?'強調框（虛線）':'強調框'});},
  ring:(cx,cy,w,h)=>oval(cx-w/2,cy-h/2,w,h,{line:AC,lw:anLW,name:'圈選'}),
  /* 編號釘：圓形編號（白字）＋引線＋目標點 */
  pin:(n,px,py,bx,by,o)=>{o=o||{};const d=o.d||.3;const L=Math.hypot(px-bx,py-by);
   if(L>d/2+.02){const ux=(px-bx)/L,uy=(py-by)/L;ln(bx+ux*d/2,by+uy*d/2,px,py,{c:AC,w:1,name:'引線'});}
   circ(px,py,o.dot||.08,{fill:AC,name:'標註點'});
   return circ(bx,by,d,{fill:AC,line:'FFFFFF',lw:1.25,text:String(n),size:o.size||Math.max(9,Math.round(d*34)),bold:1,color:'FFFFFF',margin:0,font:nf,name:'編號釘'});},
  /* 對話框：圓角泡泡（白底＋標註色外框）＋指向目標的尖角；文字是泡泡上的文字框（改字、PowerPoint 編輯都方便） */
  callout:(x,y,w,h,t,tx,ty,o)=>{o=o||{};const r=Math.min(.08,h/3),pw=Math.min(.2,w/4),up=ty<y;
   const b1=Math.max(x+r+.02,Math.min(tx-pw/2,x+w-r-.02-pw)),b2=b1+pw;
   const x0=Math.min(x,tx),y0=Math.min(y,ty),x1=Math.max(x+w,tx),y1=Math.max(y+h,ty);const X=v=>v-x0,Y=v=>v-y0;
   const A=(px,py,s0)=>({x:X(px),y:Y(py),curve:{type:'arc',hR:r,wR:r,stAng:s0,swAng:90}});
   const pts=[{x:X(x+r),y:Y(y)}];
   if(up)pts.push({x:X(b1),y:Y(y)},{x:X(tx),y:Y(ty)},{x:X(b2),y:Y(y)});
   pts.push({x:X(x+w-r),y:Y(y)},A(x+w,y+r,270),{x:X(x+w),y:Y(y+h-r)},A(x+w-r,y+h,0));
   if(!up)pts.push({x:X(b2),y:Y(y+h)},{x:X(tx),y:Y(ty)},{x:X(b1),y:Y(y+h)});
   pts.push({x:X(x+r),y:Y(y+h)},A(x,y+h-r,90),{x:X(x),y:Y(y+r)},A(x+r,y,180),{close:true});
   el('custGeom',x0,y0,x1-x0,y1-y0,{fill:'FFFFFF',line:AC,lw:1.5,points:pts,name:'對話框'});
   return txt(x+.06,y,w-.12,h,t,{size:o.size||11,color:o.color||G.ink,bold:o.bold!=null?o.bold:1,align:'center',valign:'middle',wrap:1,name:'標註文字'});},
  /* 括號：橫向（開口朝上，標籤在下）／直向（開口朝左，標籤在右） */
  bracket:(x,y,len,t,o)=>{o=o||{};const d=o.d||.1,size=o.size||10;
   if(o.v){path([[x,y],[x+d,y],[x+d,y+len],[x,y+len]],{line:AC,lw:1.5,name:'括號'});ln(x+d,y+len/2,x+d+.08,y+len/2,{c:AC,w:1.5});
    return txt(x+d+.14,y+len/2-.16,o.w||1.2,.32,t,{size,bold:1,color:ACd,valign:'middle',name:'括號標籤'});}
   path([[x,y],[x,y+d],[x+len,y+d],[x+len,y]],{line:AC,lw:1.5,name:'括號'});ln(x+len/2,y+d,x+len/2,y+d+.08,{c:AC,w:1.5});
   const tw0=Math.max(len,tw(t,size)+.1);return txt(x+len/2-tw0/2,y+d+.1,tw0,size/72*1.5,t,{size,bold:1,color:ACd,align:'center',name:'括號標籤'});},
  /* 旗標：從資料點拉起的旗桿＋標註色旗面（例：Excursion start 10/02） */
  flag:(x,yb,yt,t,o)=>{o=o||{};const size=o.size||10,h=size/72*1.75+.06,w=tw(t,size)*1.04+.24;
   ln(x,yb,x,yt,{c:AC,w:1.5});circ(x,yb,.1,{fill:AC,line:'FFFFFF',lw:1,name:'標註點'});
   return box(x,yt,w,h,{fill:AC,r:Math.min(.05,st.r||0),text:t,size,bold:1,color:'FFFFFF',align:'left',margin:[6,4,0,0],name:'旗標'});},
  /* 箭頭＋標籤 */
  arrow:(lx,ly,t,px,py,o)=>{o=o||{};const size=o.size||11,w=tw(t,size)*1.04+.12,h=size/72*1.6;const lb=txt(lx,ly,w,h,t,{size,bold:1,color:ACd,align:'center',valign:'middle',name:'箭頭標籤'});
   const cx=lx+w/2,cy=ly+h/2,dx=px-cx,dy=py-cy;const k=Math.min(Math.abs(dx)>1e-6?(w/2+.04)/Math.abs(dx):1e9,Math.abs(dy)>1e-6?(h/2+.04)/Math.abs(dy):1e9);
   ln(cx+dx*k,cy+dy*k,px,py,{c:AC,w:1,head:'triangle',hs:'med',name:'引線'});return lb;}};
 /* ================= 投影片 ================= */
 const X0=.6,X1=W-.6,CW=X1-X0;const lang=langOf(st);
 const SL={};

 /* ---------- 01 元件總表：每一列一個類別，每格一個可直接複製的獨立圖形，圖說另為文字框 ---------- */
 SL.catalog=()=>{title('元件總表 Element Catalog','一頁看完本風格的所有元件變化：挑好樣式，直接複製圖形使用');
  const LX=X0,CX0=X0+1.42,NC=7,CWc=(X1-CX0)/NC,SW=Math.min(1.2,CWc-.3);
  const fs=Math.min(LS(11.5),13),PR=st.r>0?Math.min(st.r,.1):0;
  const rows=[['流程方塊','Process',.42],['判斷菱形','Decision',.52],['開始／結束','Start / End',.38],['箭頭與連接線','Arrows',.4],['例外與警示','Exception',.44],['圓形・編號・標籤','Circle · Badge',.62],['容器與群組','Container',.46],['標註','Annotation',.44]];
  /* v10 多了「標註」列：放不下時先縮列距，再等比縮列高（上緣不超過 1.76，避開副標題） */
  let capH=.19,gap=.16,f=1;let y=1.9;const sumH=rows.reduce((a,r)=>a+r[2],0);const tot=()=>sumH*f+rows.length*(capH+gap)-gap;
  const yEnd=(st.canvas?6.82:6.92);if(y+tot()>yEnd){y=1.76;if(y+tot()>yEnd){capH=.16;gap=.06;}if(y+tot()>yEnd)f=Math.max(.8,(yEnd-y-rows.length*(capH+gap)+gap)/sumH);}
  const total=tot();if(y+total>yEnd)y=Math.max(1.7,yEnd-total);
  const cx=i=>CX0+(i+.5)*CWc;
  let rowY,rowH;
  const cap=(i,t)=>txt(cx(i)-CWc/2+.03,rowY+rowH+.035,CWc-.06,capH,t,{size:Math.max(10,st.nSize-2),color:G.t2,align:'center',name:'圖說'});
  let rowZh='';const cell=(i,t,fn)=>{grp(t,()=>fn(cx(i)-SW/2,rowY,SW,rowH,cx(i),rowY+rowH/2),{full:rowZh+'・'+t});cap(i,t);};
  const R={};
  R[0]=()=>{const b=(x,y,w,h,o)=>box(x,y,w,h,Object.assign({r:PR,size:fs,margin:[2,2,0,0],name:'流程方塊'},o));
   cell(0,'無陰影・外框',(x,y,w,h)=>b(x,y,w,h,{fill:'FFFFFF',line:G.line,lw:1,text:'處理步驟',color:G.ink}));
   cell(1,'柔和陰影',(x,y,w,h)=>b(x,y,w,h,{fill:'FFFFFF',line:G.l2,lw:.5,sh:'card',force:1,text:'處理步驟',color:G.ink}));
   cell(2,'淺主色底',(x,y,w,h)=>b(x,y,w,h,{fill:PTn,text:'處理步驟',color:PD}));
   cell(3,'淺灰底',(x,y,w,h)=>b(x,y,w,h,{fill:GF,text:'處理步驟',color:G.ink}));
   cell(4,'主色粗外框',(x,y,w,h)=>b(x,y,w,h,{fill:'FFFFFF',line:P,lw:1.75,text:'處理步驟',color:P,bold:1}));
   cell(5,'深底白字強調',(x,y,w,h)=>b(x,y,w,h,{fill:P,sh:'small',force:1,text:'關鍵步驟',color:'FFFFFF',bold:1}));
   cell(6,'虛線・待定',(x,y,w,h)=>b(x,y,w,h,{fill:'FFFFFF',line:G.mute,lw:1,dash:'dash',text:'待定步驟',color:G.mute}));};
  R[1]=()=>{const d=(x,y,w,h,o)=>{const ww=Math.min(w,1.05);el('diamond',x+(w-ww)/2,y,ww,h,Object.assign({size:fs-1,margin:0,inner:.62,text:'判斷？',name:'判斷菱形'},o));};
   cell(0,'外框',(x,y,w,h)=>d(x,y,w,h,{fill:'FFFFFF',line:G.line,lw:1,color:G.ink}));
   cell(1,'柔和陰影',(x,y,w,h)=>d(x,y,w,h,{fill:'FFFFFF',line:G.l2,lw:.5,sh:'card',force:1,color:G.ink}));
   cell(2,'淺主色底',(x,y,w,h)=>d(x,y,w,h,{fill:PTn,color:PD}));
   cell(3,'主色外框',(x,y,w,h)=>d(x,y,w,h,{fill:'FFFFFF',line:P,lw:1.5,color:P,bold:1}));
   cell(4,'深底白字強調',(x,y,w,h)=>d(x,y,w,h,{fill:P,sh:'small',force:1,color:'FFFFFF',bold:1}));
   cell(5,'虛線・待確認',(x,y,w,h)=>d(x,y,w,h,{fill:'FFFFFF',line:G.mute,lw:1,dash:'dash',color:G.mute}));
   cell(6,'判斷＋分岔箭頭',(x,y,w,h,mx,my)=>{const ww=.62,dx=mx-.36;el('diamond',dx-ww/2,y,ww,h,{fill:'FFFFFF',line:P,lw:1.25,name:'判斷菱形'});
    const o=Object.assign(CN(),{tail:false});ln(dx+ww/2,my,mx+.55,my,o);
    txt(dx+ww/2+.02,my-.2,.3,.18,'是',{size:10,color:G.t2,name:'標註'});});};
  R[2]=()=>{const p=(x,y,w,h,o)=>box(x,y,w,h,Object.assign({r:'full',size:fs,margin:[2,2,0,0],name:'開始／結束'},o));
   cell(0,'外框',(x,y,w,h)=>p(x,y,w,h,{fill:'FFFFFF',line:P,lw:1.25,text:'開始',color:P,bold:1}));
   cell(1,'淺主色底',(x,y,w,h)=>p(x,y,w,h,{fill:PTn,text:'開始',color:PD,bold:1}));
   cell(2,'淺灰底',(x,y,w,h)=>p(x,y,w,h,{fill:GF,text:'開始',color:G.ink,bold:1}));
   cell(3,'柔和陰影',(x,y,w,h)=>p(x,y,w,h,{fill:'FFFFFF',line:G.l2,lw:.5,sh:'card',force:1,text:'開始',color:G.ink,bold:1}));
   cell(4,'深底白字強調',(x,y,w,h)=>p(x,y,w,h,{fill:P,sh:'small',force:1,text:'結束',color:'FFFFFF',bold:1}));
   if(HASA)cell(5,'強調色',(x,y,w,h)=>p(x,y,w,h,{fill:A,text:'結束',color:themeHue(A)>=35&&themeHue(A)<=70?G.ink:'FFFFFF',bold:1}));};
  R[3]=()=>{const L=.58,base=CN();
   cell(0,'細直線箭頭',(x,y,w,h,mx,my)=>ln(mx-L,my,mx+L,my,Object.assign({},base,{tail:null})));
   cell(1,'粗箭頭',(x,y,w,h,mx,my)=>ln(mx-L,my,mx+L,my,{c:P,w:Math.max(2.25,st.cnW*1.8),head:'triangle',hs:'med'}));
   cell(2,'折線連接',(x,y,w,h,mx,my)=>conn([[mx-L,y+.05],[mx,y+.05],[mx,y+h-.05],[mx+L,y+h-.05]],{tail:false}));
   cell(3,'虛線（次要／回饋）',(x,y,w,h,mx,my)=>ln(mx-L,my,mx+L,my,{c:G.g7,w:Math.max(1,st.cnW),dash:'sysDash',head:'arrow',hs:'med'}));
   cell(4,'雙向箭頭',(x,y,w,h,mx,my)=>ln(mx-L,my,mx+L,my,{c:base.c,w:base.w,head:'triangle',tail:'triangle',hs:base.hs}));
   cell(5,'▶ 三角／V 形分隔',(x,y,w,h,mx,my)=>{tri(mx-.36,my-.11,.17,.22,{fill:G.t2,name:'三角分隔'});el('chevron',mx+.18,my-.14,.16,.28,{fill:P,adj:.1,name:'V 形分隔'});});
   cell(6,'區塊箭頭',(x,y,w,h,mx,my)=>{const l=mx-.55,r=mx+.55,t=my-h/2,b=my+h/2,s1=my-h*.2,s2=my+h*.2,hx=r-h*.6;
    path([[l,s1],[hx,s1],[hx,t],[r,my],[hx,b],[hx,s2],[l,s2]],{close:true,fill:P,name:'區塊箭頭'});});};
  R[4]=()=>{
   cell(0,'警示外框',(x,y,w,h)=>box(x,y,w,h,{fill:'FFFFFF',line:AL,lw:1.5,r:PR,text:'例外狀況',size:fs,color:ALd,bold:1,margin:[2,2,0,0],name:'警示方塊'}));
   cell(1,'警示淺底',(x,y,w,h)=>box(x,y,w,h,{fill:ALt,r:PR,text:'注意事項',size:fs,color:ALd,bold:1,margin:[2,2,0,0],name:'警示方塊'}));
   cell(2,'深底警示',(x,y,w,h)=>box(x,y,w,h,{fill:AL,r:PR,sh:'small',force:1,text:'中止',size:fs,color:'FFFFFF',bold:1,margin:[2,2,0,0],name:'警示方塊'}));
   cell(3,'警告三角',(x,y,w,h,mx,my)=>{const s=h*1.02,tx=mx-s*.58;
    path([[tx,my+s/2],[tx+s*.58,my-s/2],[tx+s*1.16,my+s/2]],{close:true,fill:AL,name:'警告三角'});
    txt(tx,my-s*.2,s*1.16,s*.68,'!',{size:Math.round(s*38),bold:1,color:'FFFFFF',align:'center',font:'Arial',name:'驚嘆號'});});
   cell(4,'× 錯誤標記',(x,y,w,h,mx,my)=>{const d=h*.82;circ(mx,my,d,{fill:AL,text:'×',size:Math.round(d*44),bold:1,color:'FFFFFF',margin:0,font:'Arial',name:'錯誤標記'});});
   cell(5,'紅點提示',(x,y,w,h)=>{box(x,y,w,h,{fill:'FFFFFF',line:G.line,lw:1,r:PR,text:'待處理',size:fs,color:G.ink,margin:[2,2,0,0],name:'流程方塊'});circ(x+w-.02,y+.02,.17,{fill:AL,line:'FFFFFF',lw:1.25,name:'提示紅點'});});
   cell(6,'例外路徑（虛線）',(x,y,w,h,mx,my)=>conn([[mx-.58,y+.06],[mx-.1,y+.06],[mx-.1,y+h-.06],[mx+.58,y+h-.06]],{c:AL,w:1.25,dash:'sysDash',head:'triangle',hs:'med',tail:false}));};
  R[5]=()=>{const d=rowH;
   cell(0,'光暈大圓',(x,y,w,h,mx,my)=>circleShape(mx-d/2,y,d,{force:1,noring:1}));
   cell(1,'光暈＋外圈細環',(x,y,w,h,mx,my)=>{if(st.ring&&st.sh)circleShape(mx-d/2,y,d,{force:1});else{oval(mx-d/2-.06,y-.06,d+.12,d+.12,{line:mix(G.l2,'FFFFFF',.35),lw:.75,name:'外圈細環'});circleShape(mx-d/2,y,d,{force:1,noring:1});}});
   cell(2,'無陰影外框圓',(x,y,w,h,mx,my)=>oval(mx-d/2,y,d,d,{fill:'FFFFFF',line:G.line,lw:Math.min(st.circleLW,2),name:'外框圓'}));
   cell(3,'編號徽章',(x,y,w,h,mx,my)=>{[1,2,3].forEach((n,j)=>badge(mx-.42+j*.42,my,bnum(n),{d:.34,alt:j===2}));});
   cell(4,'深色標籤',(x,y,w,h,mx,my)=>{tag(mx,my-.16,'主要標籤',{anchor:'center',h:.32,size:11,sh:1});});
   cell(5,'淺色／灰階標籤',(x,y,w,h,mx,my)=>{const a=tagW('輔助',11,.3),b=tagW('灰階',11,.3);let xx=mx-(a+b+.08)/2;tag(xx,my-.15,'輔助',{tone:'a',h:.3,size:11});tag(xx+a+.08,my-.15,'灰階',{tone:'g',h:.3,size:11});});
   cell(6,'小圓點',(x,y,w,h,mx,my)=>{[P,A,G.line].forEach((c,j)=>circ(mx-.3+j*.3,my,.15,{fill:c,name:'圓點'}));});};
  R[6]=()=>{
   cell(0,'虛線群組框',(x,y,w,h)=>{box(x,y+.06,w,h-.06,{line:G.mute,lw:.75,dash:'dash',r:PR,name:'群組框'});box(x+.1,y-.03,.62,.18,{fill:st.canvas?st.canvasColor:'FFFFFF',bgMatch:1,text:'群組 A',size:10,color:G.t2,margin:0,name:'群組名稱'});});
   cell(1,'淺灰面板',(x,y,w,h)=>box(x,y,w,h,{fill:GF,r:PR,name:'淺灰面板'}));
   cell(2,'本風格卡片',(x,y,w,h)=>cardBase(x,y,w,h));
   cell(3,'卡片＋陰影',(x,y,w,h)=>cardBase(x,y,w,h,{force:1}));
   cell(4,'表頭色帶卡',(x,y,w,h)=>{box(x,y,w,h,{fill:'FFFFFF',line:G.l2,lw:.75,r:PR,name:'卡片'});topRound(x,y,w,.16,rr(w,h,PR),{fill:P,name:'表頭'});});
   cell(5,'頂邊／側邊色條',(x,y,w,h)=>{box(x,y,w,h,{fill:'FFFFFF',line:G.l2,lw:.75,name:'卡片'});box(x,y,.06,h,{fill:A,name:'側邊色條'});});
   cell(6,'半透明寬欄條',(x,y,w,h,mx,my)=>{const cw=.34;colBar(mx-cw-.06,y,cw,h);colBar(mx+.06,y,cw,h);});};
  R[7]=()=>{
   cell(0,'強調框（實線）',(x,y,w,h)=>AN.box(x+.06,y+.02,w-.12,h-.04));
   cell(1,'強調框（虛線）',(x,y,w,h)=>AN.box(x+.06,y+.02,w-.12,h-.04,{dash:1}));
   cell(2,'圈選',(x,y,w,h,mx,my)=>AN.ring(mx,my,Math.min(w*.62,.8),h));
   cell(3,'編號釘＋引線',(x,y,w,h,mx,my)=>{const d=Math.min(.26,h*.6);AN.pin(1,mx-.18,my+h*.3,mx-.42,y+d/2,{d,dot:.07});AN.pin(2,mx+.38,my+h*.3,mx+.14,y+d/2,{d,dot:.07});});
   cell(4,'對話框',(x,y,w,h,mx,my)=>AN.callout(x+.02,y,w-.04,h*.66,'連續上升',x+w*.3,y+h,{size:Math.min(9.5,fs-1)}));
   cell(5,'括號＋標籤',(x,y,w,h,mx,my)=>AN.bracket(x+.12,y+.02,w-.24,'PM 後 3 天',{d:.09,size:10}));
   cell(6,'旗標＋日期',(x,y,w,h,mx,my)=>AN.flag(x+.12,y+h-.05,y,'Exc. 10/02',{size:9}));};
  rows.forEach((r,i)=>{rowY=y;rowH=r[2]*f;rowZh=r[0];
   const lcy=y+(rowH+capH)/2;
   {const LK=['flow','flow','flow','conn','annot','tags','cards','annot'][i];const LC=(SLIDES.find(e=>e[0]===LK)||[])[2];txt(LX,lcy-.3,1.32,.6,[{t:r[0],s:10.5,b:1,c:G.t2,br:1},{t:r[1],s:10,c:G.mute,f:nf,br:1},{t:'→ '+LC,s:10,b:1,c:P,f:nf,link:LK}],{lsp:1.0,valign:'middle',name:'類別'});}
   R[i]();
   y+=rowH+capH+gap;
   if(i<rows.length-1)ln(LX,y-gap/2,X1,y-gap/2,{c:mix(G.l2,'FFFFFF',.45),w:.5});});
  ln(CX0-.12,1.9-.04,CX0-.12,y-gap,{c:mix(G.l2,'FFFFFF',.3),w:.5});};

 /* ---------- 02 常見組合：已排好、已連線的小流程，每組在 pptx 中是一個群組 ---------- */
 SL.patterns=()=>{title('常見組合 Common Patterns','已排好、已連線的流程小組合：整組複製即可使用（純流程圖語意）');
  const NCOL=4,GAPc=.22,cw=(CW-(NCOL-1)*GAPc)/NCOL,lh=.4,ch=1.86,rowGap=.26;
  const y0=1.9,rows2=y0+lh+ch+rowGap;const fs=Math.min(LS(10.5),12),nh=.42;
  const N=(x,y,w,t,o)=>sym('proc',x,y,w,nh,t,Object.assign({size:fs},o||{}));
  const lab=(x,y,w,t,o)=>txt(x,y,w,.2,t,Object.assign({size:10,color:G.t2,align:'center',name:'標註'},o||{}));
  const A2=(pts,o)=>conn(pts,Object.assign({tail:false},o||{}));
  const combos=[
   ['三步驟流程','Linear Process',(x,y)=>{const w=.74,g=(cw-3*w)/2,yy=y+.62;
     const ns=['步驟一','步驟二','步驟三'].map((t,i)=>{const xi=x+i*(w+g);const n=N(xi,yy,w,t,i===2?{strong:1}:{});badge(xi+.02,yy+.02,bnum(i+1),{ring:1,d:.26,size:9,nodot:1});return n;});
     link(ns[0],3,ns[1],1);link(ns[1],3,ns[2],1);}],
   ['判斷分岔（是／否）','Decision Branch',(x,y)=>{const yy=y+.24,cy=yy+nh/2,dx=x+.98,dw=.84,dh=.64,dcy=cy;
     const a=N(x,yy,.72,'檢查');const d=sym('dec',dx,dcy-dh/2,dw,dh,'通過？',{size:fs-1});link(a,3,d,1);
     const e=N(x+cw-.74,yy,.74,'執行',{strong:1});link(d,3,e,1);lab(dx+dw,cy-.24,.4,'是');
     const f=N(dx+dw/2-.37,y+1.26,.74,'修正');link(d,2,f,0);lab(dx+dw/2+.02,dcy+dh/2+.04,.3,'否',{align:'left'});}],
   ['例外退回路徑','Exception Return',(x,y)=>{const w=.74,g=(cw-3*w)/2,yy=y+.36,c=i=>x+i*(w+g)+w/2;
     const ns=['受理','審查','完成'].map((t,i)=>N(x+i*(w+g),yy,w,t,i===2?{strong:1}:{}));link(ns[0],3,ns[1],1);link(ns[1],3,ns[2],1);
     const ly=yy+nh+.42;link(ns[1],2,ns[0],2,{via:[[c(1),ly],[c(0),ly]],style:{c:AL,w:Math.max(1.25,st.cnW),dash:'sysDash',head:'triangle',hs:'med'}});
     lab(c(0),ly+.04,c(1)-c(0),'例外：退回補件',{color:ALd});}],
   ['審核迴圈','Approval Loop',(x,y)=>{const yy=y+.78,cy=yy+nh/2,dw=.74,dh=.6,dx=x+1.0,kw=.62;
     const a=N(x,yy,.8,'提出申請');const d=sym('dec',dx,cy-dh/2,dw,dh,'審核',{size:fs-1});link(a,3,d,1);
     const k=N(x+cw-kw,yy,kw,'核准',{strong:1});link(d,3,k,1);lab(dx+dw,cy-.24,x+cw-kw-dx-dw,'通過');
     const ly=y+.24;link(d,0,a,0,{via:[[dx+dw/2,ly],[x+.4,ly]]});lab(x+.42,ly-.22,dx+dw/2-x-.42,'退回重送');}],
   ['泳道（雙道）','Swimlane',(x,y)=>{const lh2=.8,hw=.46,l1=y+.04,l2=l1+lh2+.06,c1=l1+lh2/2,c2=l2+lh2/2,w=.7;
     [[l1,'申\n請\n人'],[l2,'主\n管']].forEach(([ly,t])=>{box(x,ly,cw,lh2,{fill:'FFFFFF',line:G.l2,lw:.75,name:'泳道'});box(x,ly,hw,lh2,{fill:GF,text:t,size:10,bold:1,color:G.t2,margin:0,lsp:.95,name:'泳道標題'});});
     const xa=x+hw+.14,xb=xa+w+.3,xc=x+cw-w-.08;
     const a=N(xa,c1-nh/2,w,'填寫'),b=N(xb,c2-nh/2,w,'審核'),c=N(xc,c1-nh/2,w,'歸檔',{strong:1});
     link(a,3,b,0);link(b,3,c,2);}],
   ['平行分流／合流','Parallel Split / Merge',(x,y)=>{const ca=y+.38,cb=y+1.3,cm=(ca+cb)/2,bw=.045,sw0=.5,ew=.56,g1=.22,g2=.26,w=Math.max(.6,cw-sw0-ew-2*g1-2*g2-2*bw);
     // 分流／合流棒＝3 段相接的細長方形（上段中心＝分支 A、下段中心＝分支 B、中段中心＝主線）→ 每條連接線兩端都黏在原生連接點上；線長至少 0.22"
     const d=.28,o=.006,bar=(bx,nm)=>[box(bx,ca-d,bw,2*d+o,{fill:P,name:nm,r:0}),box(bx,cm-(cb-ca)/2+d-o,bw,(cb-ca)-2*d+2*o,{fill:P,name:nm,r:0}),box(bx,cb-d-o,bw,2*d+o,{fill:P,name:nm,r:0})];
     const s0=N(x,cm-nh/2,sw0,'開始');const xs=x+sw0+g1;const sp=bar(xs,'分流');
     const xA=xs+bw+g2;const na=N(xA,ca-nh/2,w,'作業 A'),nb=N(xA,cb-nh/2,w,'作業 B');
     const xj=xA+w+g2;const mg=bar(xj,'合流');const e=N(x+cw-ew,cm-nh/2,ew,'彙整',{strong:1});
     link(s0,3,sp[1],1);link(sp[0],3,na,1);link(sp[2],3,nb,1);
     link(na,3,mg[0],1);link(nb,3,mg[2],1);link(mg[1],3,e,1);}],
   ['輸入→處理→輸出','IPO',(x,y)=>{const ww=[.82,.7,.82],g=(cw-ww[0]-ww[1]-ww[2])/2,yy=y+.5;let xi=x;
     const ns=[['io','輸入'],['proc','處理'],['doc','報表']].map(([k,t],i)=>{const n=sym(k,xi,k==='doc'?yy-.05:yy,ww[i],k==='doc'?.52:nh,t,{size:fs,strong:i===1});
      lab(xi-.05,yy+.6,ww[i]+.1,['資料來源','整理運算','產出結果'][i],{color:G.mute});xi+=ww[i]+g;return n;});
     link(ns[0],2,ns[1],1);link(ns[1],3,ns[2],1);}],
   ['迴圈回饋（PDCA）','Feedback Loop',(x,y)=>{const w=.92,y1=y+.2,y2=y+1.22,xr=x+cw-w;
     const a=N(x,y1,w,'計畫 Plan',{strong:1}),b=N(xr,y1,w,'執行 Do'),c=N(xr,y2,w,'檢核 Check'),d=N(x,y2,w,'行動 Act');
     link(a,3,b,1);link(b,2,c,0);link(c,1,d,3);link(d,0,a,2);
     txt(x+w,y+.72,cw-2*w,.36,'持續改善',{size:fs,bold:1,color:P,align:'center',valign:'middle',name:'中心標註'});}]];
  combos.forEach(([zh,en,fn],i)=>{const col=i%NCOL,row=Math.floor(i/NCOL);const x=X0+col*(cw+GAPc),y=row?rows2:y0;
   const dx=mark(x,y+.14);txt(x+dx,y,cw-dx,.3,[{t:zh,s:LS(11.5),b:st.lBold,c:G.ink},{t:'  '+en,s:10,c:G.mute,f:nf}],{name:'組合名稱'});
   ln(x,y+.34,x+cw,y+.34,{c:G.l2,w:.5});
   grp(zh,()=>fn(x,y+lh));});};
 /* ---------- 03 常見組合（二）：表格、比較、數字卡、PDCA；每組在 pptx 中是一個群組（含表格者除外：PowerPoint 不允許表格入群組） ---------- */
 /* ---------- 04 可調數量（v9）：線性流程、泳道、問題→原因→對策；數量 2–6 由參數 nLin／nLane／nPcc 決定（純流程圖語意，不套主題版面） ---------- */
 const head2=(x,y,w,zh,en)=>{const dx=mark(x,y+.14);txt(x+dx,y,w-dx,.3,[{t:zh,s:LS(11.5),b:st.lBold,c:G.ink},{t:'  '+en,s:10,c:G.mute,f:nf}],{name:'組合名稱'});ln(x,y+.34,x+w,y+.34,{c:G.l2,w:.5});};
 const NUM=(k,d,lo)=>Math.max(lo||2,Math.min(6,Math.round(+st[k]||d)));
 const ZH_N=['一','二','三','四','五','六'];
 SL.flex=()=>{title('可調數量 Adjustable Patterns','步驟、泳道、原因的數量 2–6 可調：左側「數量」，或選取元件後按工具列的 − ＋');
  const fs=Math.min(LS(10.5),12),W2='FFFFFF',PR=st.r>0?Math.min(st.r,.12):0,yB=6.78;
  {const n=NUM('nLin',4),x=X0,y=1.9,w0=CW,zh=`線性流程（${n} 步）`;head2(x,y,w0,zh,'Linear Process');
   grp(zh,()=>{const g=.55,nw=Math.min(1.7,(w0-.1-(n-1)*g)/n),nh=.52,yy=y+.72;const x0=x+.05;
    const ns=Array.from({length:n},(_,i)=>{const xi=x0+i*(nw+g);const nd=sym('proc',xi,yy,nw,nh,'步驟'+ZH_N[i],{size:fs,strong:i===n-1});badge(xi+.02,yy+.02,bnum(i+1),{ring:1,d:.26,size:9,nodot:1});return nd;});
    for(let i=0;i<n-1;i++)link(ns[i],3,ns[i+1],1);},{count:'nLin'});}
  {const n=NUM('nLane',3),x=X0,y=3.3,w0=6.55,zh=`泳道（${n} 道）`;head2(x,y,w0,zh,'Swimlane');
   grp(zh,()=>{const top=y+.42,gap=.06,lh=Math.min(.78,(yB-top-(n-1)*gap)/n),hw=.74;
    const roles=['申請人','主管','工程','品保','採購','財務'],steps=['提出申請','主管審核','技術評估','品質確認','採購執行'].slice(0,n-1).concat(['歸檔']);
    const nw=1.02,nh=Math.min(.42,lh-.14),xa=x+hw+.2,step=n>1?Math.min(1.5,(w0-hw-.2-.15-nw)/(n-1)):0;
    for(let i=0;i<n;i++){const ly=top+i*(lh+gap);box(x,ly,w0,lh,{fill:W2,line:G.l2,lw:.75,name:'泳道'});box(x,ly,hw,lh,{fill:GF,text:roles[i],size:10,bold:1,color:G.t2,margin:0,name:'泳道標題'});}
    const ns=[];for(let i=0;i<n;i++){const ly=top+i*(lh+gap);ns.push(sym('proc',xa+i*step,ly+(lh-nh)/2,nw,nh,steps[i],{size:fs-1,strong:i===n-1}));}
    for(let i=0;i<n-1;i++)link(ns[i],3,ns[i+1],0);},{count:'nLane'});}
  {const n=NUM('nPcc',3),x=X0+6.55+.36,w0=X1-x,y=3.3,zh=`問題 → 原因 → 對策（${n} 項）`;head2(x,y,w0,zh,'Problem / Cause / Countermeasure');
   grp(zh,()=>{const pw=1.18,g1=.34,cwid=(w0-pw-2*g1)/2,xc=x+pw+g1,xk=xc+cwid+g1,top=y+.72,gap=.1;
    txt(xc,y+.44,cwid,.22,[{t:'原因',b:1,c:G.t2},{t:'  Cause',s:9,c:G.mute,f:nf}],{size:10,name:'欄名'});
    txt(xk,y+.44,cwid,.22,[{t:'對策',b:1,c:G.t2},{t:'  Countermeasure',s:9,c:G.mute,f:nf}],{size:10,name:'欄名'});
    const rh=Math.min(.56,(yB-top-(n-1)*gap)/n),tot=n*rh+(n-1)*gap;
    const causes=['需求變更頻繁','排程未同步','人力調度不足','設備異常停機','物料到貨延遲','規格定義不明'],acts=['設需求凍結點','每週排程會議','跨線支援機制','預防保養計畫','建立安全庫存','規格審查會議'];
    const pb=box(x,top,pw,tot,{fill:W2,line:AL,lw:1.5,r:PR,lsp:1.1,margin:[4,4,4,4],text:[{t:'問題',s:fs+1.5,b:1,c:ALd,br:1},{t:'Problem',s:9,c:G.mute,f:nf,br:1},{t:'交期常延誤',s:fs-1.5,c:G.t2}],name:'問題'});
    for(let i=0;i<n;i++){const ry=top+i*(rh+gap);const c=box(xc,ry,cwid,rh,{fill:GF,r:PR,text:causes[i],size:fs-1,color:G.ink,name:'原因'});
     const k=box(xk,ry,cwid,rh,{fill:P,r:PR,text:acts[i],size:fs-1,color:W2,bold:1,name:'對策'});link(pb,3,c,1);link(c,3,k,1);}},{count:'nPcc'});}};
 /* ---------- 05 原因分析（v9）：直向 5 Why 追問（層數可調）、多因 → 問題（原因數可調；確認／排除是一般膠囊標籤，不是主題版面） ---------- */
 SL.rca=()=>{title('原因分析 Root Cause','5 Why 追問與多因 → 問題：數量可調；確認／排除標籤可直接改字');
  const fs=Math.min(LS(10.5),12),W2='FFFFFF',PR=st.r>0?Math.min(st.r,.12):0;
  {const n=NUM('nWhy',5),x=X0,w0=4.3,y=1.9,zh=`5 Why 追問（${n} 層）`;head2(x,y,w0,zh,'5 Whys');
   grp(zh,()=>{const top=y+.52,bottom=6.8,N=n+2,nh=n>=6?.38:.42,gap=(bottom-top-N*nh)/(N-1),pw=.66,bx=x+pw+.14,bw=w0-pw-.14-.05;
    const whys=['排程常臨時變動','業務插單未經評估','沒有需求凍結點','變更規則未明訂','缺少跨部門審查','權責歸屬不清'];
    const pill=(yy,t,strong)=>box(x,yy+(nh-.26)/2,pw,.26,{fill:strong?P:PTn,r:'full',text:t,size:10,bold:1,color:strong?W2:PD,font:nf,margin:0,name:'Why 標籤'});
    const ns=[box(bx,top,bw,nh,{fill:W2,line:AL,lw:1.5,r:PR,text:[{t:'問題｜',b:1,c:ALd},{t:'交期常延誤',c:G.ink}],size:fs-.5,name:'問題'})];
    for(let i=0;i<n;i++){const yy=top+(i+1)*(nh+gap);pill(yy,'Why '+(i+1));ns.push(sym('proc',bx,yy,bw,nh,whys[i],{size:fs-1}));}
    const ry=top+(n+1)*(nh+gap);pill(ry,'根因',1);ns.push(sym('proc',bx,ry,bw,nh,'缺少需求變更管理規則',{size:fs-1,strong:1}));
    for(let i=0;i<ns.length-1;i++)link(ns[i],2,ns[i+1],0);},{count:'nWhy'});}
  {const n=NUM('nCause',4),x=X0+4.3+.5,w0=X1-x,y=1.9,zh=`多因 → 問題（${n} 個原因）`;head2(x,y,w0,zh,'Multiple Causes → Problem');
   grp(zh,()=>{const top=y+.62,bottom=6.35,gap=.16,rh=Math.min(.6,(bottom-top-(n-1)*gap)/n),tot=n*rh+(n-1)*gap,y0=top+(bottom-top-tot)/2;
    const pw=.62,cx0=x+pw+.14,cwid=3.4,prw=1.9,prx=x+w0-prw-.05;
    const C=[['人','新進人員操作不熟',1],['機','設備參數漂移',1],['料','來料批次差異',0],['法','SOP 版本未更新',1],['環','溫濕度波動',0],['測','量測系統誤差',0]].slice(0,n);
    const cs=C.map(([k,t,ok],i)=>{const ry=y0+i*(rh+gap);
     box(x,ry+(rh-.26)/2,pw,.26,{fill:ok?P:W2,line:ok?null:G.line,lw:1,r:'full',text:ok?'確認':'排除',size:10,bold:1,color:ok?W2:G.mute,margin:0,name:'狀態標籤'});
     return box(cx0,ry,cwid,rh,{fill:W2,line:ok?G.line:G.l2,lw:1,dash:ok?'solid':'dash',r:PR,align:'left',margin:[8,4,0,0],text:[{t:k+'｜',b:1,c:ok?P:G.mute},{t,c:ok?G.ink:G.mute}],size:fs-1,name:'原因'});});
    const ph=Math.max(.7,Math.min(1.1,tot)),pb=box(prx,y0+tot/2-ph/2,prw,ph,{fill:W2,line:AL,lw:1.75,r:PR,lsp:1.1,text:[{t:'問題',s:fs+1.5,b:1,c:ALd,br:1},{t:'不良率上升',s:fs-.5,c:G.ink}],name:'問題'});
    /* 排除的虛線先畫、確認的實線後畫 → 共用的匯流段是實線 */cs.forEach((c,i)=>{if(!C[i][2])link(c,3,pb,1,{style:{c:G.line,dash:'sysDash'}});});cs.forEach((c,i)=>{if(C[i][2])link(c,3,pb,1);});
    note(x,bottom+.12,w0,'確認＝已用數據驗證；排除＝已查證非主因（虛線）。標籤文字可在工作室「改字」或 PowerPoint 中修改',{size:10,h:.22});},{count:'nCause'});}};
/* ---------- 06 標註（v10）：左＝疊在灰色示意圖表上的用法，右＝每個標註元件（各自一個群組、透明底、預設警示色） ---------- */
 SL.annot=()=>{title('標註 Annotation','疊在管制圖、截圖上：透明底、原生可編輯；強調色＋主色，不用紅綠（顏色：左側「語意色 › 標註顏色」）');
  const W2='FFFFFF';const lx=X0,lw=7.1,ty0=1.9;head2(lx,ty0,lw,'示意：標註疊在管制圖上（灰＝你貼上的圖）','Example');
  const cx=lx,cy=ty0+.5,cw=lw,ch=6.78-cy;
  const px0=cx+.7,px1=cx+cw-.3,py0=cy+.45,py1=cy+ch-.5,N=20,vy=v=>py1-(v/10)*(py1-py0),vx=i=>px0+i*(px1-px0)/(N-1);
  const V=[4.6,5.3,4.4,5.6,4.9,3.8,5.2,4.7,5.0,4.8,5.4,5.9,6.4,6.9,7.4,8.9,5.6,4.4,5.1,4.6];
  grp('示意：管制圖＋標註（整組）',()=>{box(cx,cy,cw,ch,{fill:'FAFAFA',line:G.l2,lw:.75,name:'圖表區'});
   ln(px0,py0-.1,px0,py1,{c:'A6A6A6',w:.75});ln(px0,py1,px1+.1,py1,{c:'A6A6A6',w:.75});
   [[8,'UCL'],[5,'CL'],[2,'LCL']].forEach(([v,t])=>{ln(px0,vy(v),px1,vy(v),{c:v===5?'8C8C8C':'A6A6A6',w:.75,dash:v===5?'solid':'sysDash'});txt(px0-.62,vy(v)-.13,.55,.26,t,{size:10,color:G.t2,align:'right',font:nf,name:'管制線標籤'});});
   path(V.map((v,i)=>[vx(i),vy(v)]),{line:'8C8C8C',lw:1.25,name:'資料線'});V.forEach((v,i)=>circ(vx(i),vy(v),.08,{fill:'7F7F7F',name:'資料點'}));
   txt(px0,py1+.08,px1-px0,.26,'Lot 1 → 20',{size:10,color:G.t2,align:'center',font:nf,name:'X 軸'});[[15,'8.9'],[19,'4.6']].forEach(([i,t])=>txt(i===19?vx(i)-.58:vx(i)+.08,vy(V[i])-.32,.5,.24,t,{size:10,bold:1,color:G.ink,font:nf,wrap:0,align:i===19?'right':'left',name:'資料標籤'}));txt(cx+.1,cy+.06,cw-.2,.26,'形狀版：點、線、標籤都是原生圖形，可拖曳改值；要換整組資料請用 SwiffChart',{size:10,color:G.t2,wrap:0,name:'說明'});
   const ys=V.slice(10,15).map(vy);AN.box(vx(10)-.15,Math.min(...ys)-.2,vx(14)-vx(10)+.3,Math.max(...ys)-Math.min(...ys)+.4,{dash:1});
   AN.callout(vx(9)-.2,vy(2.2),1.9,.42,'連續 5 點上升',vx(12),Math.max(...ys)+.22,{size:11});
   AN.ring(vx(15),vy(V[15]),.44,.44);AN.arrow(vx(16)+.1,vy(9.7)-.1,'超出 UCL',vx(15)+.22,vy(V[15])-.1,{size:11});
   AN.pin(1,vx(5),vy(V[5]),vx(5)-.3,vy(V[5])+.5,{d:.32,size:11});});
  const rx=lx+lw+.4,rw=X1-rx;head2(rx,ty0,rw,'標註元件（6 種）','Annotation Kit');
  const gw=(rw-.3)/2,gh=.9,capH=.28,top=ty0+.55,pitch=gh+capH+.3;
  const at=(i,zh,fn)=>{const c=i%2,r=Math.floor(i/2),x=rx+c*(gw+.3),y=top+r*pitch;grp(zh,()=>fn(x,y,gw,gh,x+gw/2,y+gh/2));txt(x,y+gh+.04,gw,capH,zh,{size:10,color:G.t2,align:'center',name:'圖說'});};
  at(0,'強調框（實線）',(x,y,w,h)=>AN.box(x+.1,y+.1,w-.2,h-.2));
  at(1,'圈選',(x,y,w,h,mx,my)=>AN.ring(mx,my,1.3,h-.1));
  at(2,'編號釘 ①②③',(x,y,w,h)=>[0,1,2].forEach(j=>AN.pin(j+1,x+.4+j*.6,y+h-.1,x+.26+j*.6,y+.22,{d:.32,dot:.07,size:11})));
  at(3,'對話框',(x,y,w,h)=>AN.callout(x+.05,y+.05,w-.1,h*.55,'良率掉 3%',x+.45,y+h-.02,{size:11}));
  at(4,'箭頭＋標籤',(x,y,w,h)=>AN.arrow(x+.05,y+.1,'異常點',x+w-.2,y+h-.1,{size:11}));
  at(5,'旗標＋日期',(x,y,w,h)=>AN.flag(x+.2,y+h-.08,y+.05,'Exc. 10/02',{size:11}));};
 /* ---------- 待選素材組版（v9）：只有標題／副標／註解，沿用本風格的標題處理；不加頁尾、不加畫布（白底） ---------- */
 SL.compose=()=>{const C=opt.compose||{};const t=stripCtl(C.title||'').trim(),sub=stripCtl(C.sub||'').trim(),f=stripCtl(C.foot||'').trim();
  if(t){let ts=st.tSize;while(ts>20&&tw(t,ts)>11.4)ts-=1;cur.tsz=ts;title(t,sub);}
  if(f){const y=6.82;if(st.footRule)ln(.4,y-.08,W-.4,y-.08,{c:P,w:1.25});note(.6,y,W-1.2,f,{h:.3,name:'註解'});}};
 /* ---------- 06 圖示庫：Material Symbols 圖示（每個都是可單獨複製的原生圖案）＋圖示＋文字的常用組合 ---------- */
 SL.guide=()=>{title('風格規範 Style Guide','色彩用途與對比、字級階層、格線與間距、陰影與線條、升降與狀態：整份簡報照這張做就一致');
  const {T,TN}=UK();
  const lum=h=>{const c=[0,2,4].map(k=>parseInt(h.slice(k,k+2),16)/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2];};
  const cr=h=>{const L=lum(h);return (1.05/(L+.05)).toFixed(1);};
  const c1=X0,w1=4.55,c2=c1+w1+.35,w2=3.5,c3=c2+w2+.35,w3=X1-c3,y0=1.9;
  grp('色彩用途與對比',()=>{head2(c1,y0,w1,'色彩用途','Color roles');
   const R=[[P,'主色','標題、重點資料、主要按鈕'],[PD,'深色','膠囊標籤、表頭、編號'],[PTn,'淺色','只當底色，不可用於文字'],[AL,'強調色','標註、唯一需要警示的點'],[BAD,'不良／▼','變差、延遲（不用紅）'],[G.ink,'文字','標題與內文'],[G.t2,'說明文字','副標、圖說（最小 9pt）'],[G.l2,'框線','只當線條，不可用於文字']];
   R.forEach(([c,n,u],i)=>{const y=y0+.48+i*.5;box(c1,y,.42,.42,{fill:c,line:lum(c)>.8?G.l2:null,lw:.75,r:.06,name:'色塊'});T(c1+.52,y-.02,1.1,.26,n,{size:10.5,bold:1,color:G.ink,wrap:0,name:'名稱'});T(c1+.52,y+.2,1.1,.24,'#'+c,{size:10,color:G.t2,font:nf,wrap:0,name:'色碼'});
    T(c1+1.62,y+.06,w1-2.42,.3,u,{size:10,color:G.t2,wrap:0,name:'用途'});const r=+cr(c),okc=r>=4.5;T(c1+w1-.8,y+.06,.8,.3,(okc?'':'⚠ ')+r+':1',{size:10,bold:1,color:okc?G.ink:BAD,font:nf,align:'right',wrap:0,name:'對比'});});
   T(c1,y0+.44+8*.5,w1,.56,'對比＝與白底比；文字需 ≥ 4.5:1（⚠ 的顏色不可當字色）\nPPT 主題色：輔色1＝主色・輔色5＝深色・文字2＝說明',{size:10,color:G.t2,valign:'top',name:'註'});});
  grp('字級階層',()=>{head2(c2,y0,w2,'字級階層','Type scale');
   const R=[['標題',Math.min(28,st.tSize),1,titleColor,st.tSize+'pt'],['副標',16,0,subC,'16pt'],['卡片標題',LS(14),1,G.ink,st.lSize+'pt'],['內文',12,0,G.ink,'12pt'],['說明／圖說',10,0,G.t2,'10pt'],['最小字級',9,0,G.t2,'9pt']];
   let y=y0+.48;R.forEach(([n,sz,b,c,lab],i)=>{const h=Math.max(.32,sz/72*1.45);T(c2,y,w2-.7,h,n,{size:sz,bold:!!b,color:c,wrap:0,name:'範例'});T(c2+w2-.7,y,.7,h,lab,{size:10,color:G.t2,font:nf,align:'right',valign:'middle',wrap:0,name:'字級'});y+=h+.14;ln(c2,y-.07,c2+w2,y-.07,{c:G.l2,w:.5});});
   T(c2,y+.04,w2,.5,'字型：'+st.tFont+'；數字用等寬無襯線；一頁最多 3 種字級',{size:10,color:G.t2,valign:'top',name:'註'});});
  grp('格線與間距',()=>{head2(c3,y0,w3,'格線與間距','Grid & spacing');const gy=y0+.5,gh=1.3,gw=w3;box(c3,gy,gw,gh,{line:G.l2,lw:.75,r:0,name:'頁面'});const m=gw*.6/13.33,cw=(gw-2*m-11*.04)/12;
   for(let k=0;k<12;k++)box(c3+m+k*(cw+.04),gy+.12,cw,gh-.24,{fill:TN(P,.88),r:0,name:'欄'});
   T(c3,gy+gh+.06,gw,.5,'邊界 0.6"・12 欄・欄距 0.3"\n元件間距 ≥ 0.3"；內容區 y 1.9–6.8"',{size:10,color:G.t2,valign:'top',name:'規格'});});
  grp('陰影與線條',()=>{const y=y0+2.5;head2(c3,y,w3,'陰影與線條','Shadow & lines');cardBase(c3,y+.48,1.3,.6,{force:1});T(c3+1.45,y+.44,w3-1.45,.66,'陰影 blur '+st.shB+'pt・位移 '+st.shO+'pt・透明 '+Math.round((1-st.shA)*100)+'%',{size:10,color:G.t2,valign:'middle',name:'規格'});
   conn([[c3,y+1.42],[c3+1.3,y+1.42]]);T(c3+1.45,y+1.28,w3-1.45,.3,'連接線 '+st.cnW+'pt・三角箭頭',{size:10,color:G.t2,wrap:0,name:'規格'});});
  grp('升降與狀態',()=>{const y=y0+4.25;head2(c3,y-.02,w3,'升降與狀態','Change & status');
   T(c3,y+.4,w3,.3,[{t:'▲ +2.1 pt',b:1,c:GOOD,f:nf},{t:'   '},{t:'▼ −0.8 pt',b:1,c:BAD,f:nf},{t:'   符號＋正負號'}],{size:11,color:G.t2,wrap:0,name:'升降'});
   T(c3,y+.72,w3,.3,[{t:'● 完成',c:P,b:1},{t:'  ◐ 進行中',c:G.t2,b:1},{t:'  ○ 延遲',c:BAD,b:1}],{size:10.5,wrap:0,name:'狀態'});});};


 /* ---------- 標籤元件（v10）：左＝圖示或 1–3 字短字（01／重點／A），右＝標籤文字；全部原生圖形、文字可編輯、圖示可在「改字」換 ---------- */
 SL.labels=()=>{title('標籤元件 Labels','左側放圖示或短字（01／重點／A），右側放標籤文字；選取後按「改字」換字或換圖示');
  const W2='FFFFFF',PR=st.r>0?Math.min(st.r,.08):0,onC=c=>lum(c)>.55?G.ink:W2,AC=HASA?A:PD;
  const cw=3.85,gx=(CW-3*cw)/2,cx=[0,1,2].map(i=>X0+i*(cw+gx)),ry=[2.0,3.12,4.24,5.36],h=.46,s=.46,LT=LS(13),cs=Math.max(9,st.nSize-2);
  const cap=(x,y,t)=>txt(x,y+.56,cw,.22,t,{size:cs,color:G.mute,name:'圖說'});
  const glyph=(id,x,y,d,c)=>icon(id,x,y,d,{variant:'line',color:c});
  const lab=(x,y,w,t,o)=>box(x,y,w,h,Object.assign({text:t,size:LT,bold:st.lBold,color:G.ink,align:'left',margin:[10,6,0,0],name:'標籤文字'},o||{}));
  const USE={A:['用於：行動呼籲、功能入口','例：「立即購買」「下載報告」'],B:['用於：章節編號、議程項目','例：01 市場分析 → 02 競品比較'],C:['用於：重點摘要、可點選卡片','例：每頁右上角放一句結論'],D:['用於：步驟清單、檢核項目','例：1 對齊期待 → 2 拆解問題'],E:['用於：同頁切換兩種視角','例：數據總覽／明細兩個分頁'],F:['用於：下一步、優先行動','例：結論頁最後一句行動'],G:['用於：里程碑、階段名稱','例：Q2 試產、Q4 量產'],H:['用於：次要標籤、未啟用狀態','例：持續改善、待評估'],I:['用於：方案比較的段落標題','例：方案 A／B／C 並排']};
  const cell=(c,r,zh,fn)=>{const x=cx[c],y=ry[r],k=zh[0];grp(zh.split('｜')[1].split(' ')[0],()=>{fn(x,y);if(USE[k]){const [u,e]=USE[k];box(x,y+.84,cw-.1,.78,{fill:'FFFFFF',line:G.l2,lw:.75,r:PR,name:'情境底'});box(x,y+.84,.06,.78,{fill:P,r:0,name:'色條'});txt(x+.18,y+.88,cw-.36,.34,u,{size:11,bold:1,color:G.ink,valign:'middle',name:'使用情境'});txt(x+.18,y+1.2,cw-.36,.36,e,{size:10.5,color:G.t2,valign:'middle',name:'範例'});}});cap(x,y,zh);};
  // A 方塊圖示＋灰條
  cell(0,0,'A｜方塊圖示＋灰條 Icon block',(x,y)=>{lab(x+s-.02,y,2.75,[{t:'立即購買'},{t:'  BUY',s:Math.max(9,LS(9)),b:0,c:G.mute,f:nf}],{fill:GF,r:PR,margin:[11,6,0,0]});
   box(x,y,s,h,{fill:P,r:PR,sh:'small',name:'圖示方塊'});glyph('shopping_cart',x+(s-.28)/2,y+(h-.28)/2,.28,W2);});
  // B 方塊短字＋灰條
  cell(0,1,'B｜方塊短字＋灰條 Number block',(x,y)=>{lab(x+s-.02,y,2.75,[{t:'市場分析'},{t:'  Market',s:Math.max(9,LS(9)),b:0,c:G.mute,f:nf}],{fill:GF,r:PR,margin:[11,6,0,0]});
   box(x,y,s,h,{fill:P,r:PR,sh:'small',text:'01',size:LS(13),bold:1,color:W2,font:nf,margin:0,name:'短字方塊'});});
  // C 深色膠囊＋圓形圖示徽章＋箭頭
  cell(0,2,'C｜深色膠囊＋圖示徽章 Capsule',(x,y)=>{const w=3.0,d=.34;box(x,y,w,h,{fill:G.ink,r:'full',sh:'small',text:'重點摘要',size:LT,bold:1,color:W2,align:'left',margin:[(d+.2)*72,.36*72,0,0],name:'膠囊標籤'});
   circ(x+.06+d/2,y+h/2,d,{fill:W2,name:'圖示徽章'});glyph('lightbulb',x+.06+(d-.22)/2,y+(h-.22)/2,.22,P);
   el('chevron',x+w-.25,y+h/2-.075,.08,.15,{fill:mix(G.ink,'FFFFFF',.6),adj:.05,name:'箭頭'});});
  // D 外框膠囊＋編號徽章
  cell(0,3,'D｜外框膠囊＋編號 Numbered pill',(x,y)=>{const w=3.0,d=.34;box(x,y,w,h,{fill:W2,line:G.line,lw:1,r:'full',text:'對齊期待',size:LT,bold:st.lBold,color:G.ink,align:'left',margin:[(d+.2)*72,.36*72,0,0],name:'膠囊標籤'});
   circ(x+.06+d/2,y+h/2,d,{fill:P,text:'1',size:LS(11),bold:1,color:W2,font:nf,margin:0,name:'編號徽章'});
   el('chevron',x+w-.25,y+h/2-.075,.08,.15,{fill:G.mute,adj:.05,name:'箭頭'});});
  // E 頁籤 Tab
  cell(1,0,'E｜頁籤 Tab header',(x,y)=>{const tw1=1.62,tw2=1.12;ln(x,y+h,x+cw,y+h,{c:P,w:1.5});
   topRound(x,y,tw1,h,Math.min(.08,PR||.06),{fill:P,name:'頁籤'});glyph('analytics',x+.12,y+(h-.26)/2,.26,W2);txt(x+.44,y,tw1-.5,h,'數據總覽',{size:LT,bold:1,color:W2,valign:'middle',name:'標籤文字'});
   topRound(x+tw1+.06,y+.06,tw2,h-.06,Math.min(.08,PR||.06),{fill:GF,name:'頁籤'});txt(x+tw1+.06,y+.06,tw2,h-.06,'明細',{size:LS(12),color:G.t2,align:'center',valign:'middle',name:'標籤文字'});});
  // F 箭頭旗標
  cell(1,1,'F｜箭頭旗標 Arrow flag',(x,y)=>{const w=3.0,s2=.62;el('homePlate',x+s2-.02,y,w-s2+.02,h,{fill:P,adj:.2,text:'先做這一步',size:LT,bold:1,color:W2,align:'left',margin:[10,16,0,0],sh:'small',name:'標籤文字'});
   box(x,y,s2,h,{fill:PD,r:PR,text:'重點',size:LS(12),bold:1,color:W2,margin:0,name:'短字方塊'});});
  // G 缺口旗標
  cell(1,2,'G｜缺口旗標 Notched ribbon',(x,y)=>{const w=3.0,n=.16,bx=x+s-.02;path([[bx,y],[x+w,y],[x+w-n,y+h/2],[x+w,y+h],[bx,y+h]],{close:true,fill:PTn,name:'旗標底'});
   txt(bx+.14,y,w-s-.3,h,'里程碑 Milestone',{size:LT,bold:st.lBold,color:P,valign:'middle',name:'標籤文字'});
   box(x,y,s,h,{fill:P,r:PR,name:'圖示方塊'});glyph('flag',x+(s-.28)/2,y+(h-.28)/2,.28,W2);});
  // H 外框版
  cell(1,3,'H｜外框版 Outlined',(x,y)=>{lab(x+s-.01,y,2.75,'持續改善',{fill:W2,line:G.line,lw:1,r:PR,margin:[11,6,0,0]});
   box(x,y,s,h,{fill:W2,line:P,lw:1.25,r:PR,name:'圖示方塊'});glyph('autorenew',x+(s-.28)/2,y+(h-.28)/2,.28,P);});
  // I 六角徽章標題
  cell(2,0,'I｜六角徽章標題 Hex headline',(x,y)=>{el('hexagon',x,y-.02,.58,h+.04,{fill:AC,adj:.13,text:'A',size:LS(14),bold:1,color:onC(AC),font:nf,margin:0,name:'短字徽章'});
   txt(x+.72,y-.04,cw-.75,.3,'方案一：導入自動化',{size:LT,bold:1,color:G.ink,name:'標籤文字'});ln(x+.72,y+.29,x+cw-.05,y+.29,{c:G.l2,w:.75});
   txt(x+.72,y+.31,cw-.75,.2,'Option A · Automation',{size:Math.max(9,LS(9)),color:G.mute,font:nf,name:'英文副標'});});
  // J 小尺寸 S：三個獨立小標籤
  {const x0=cx[2],y=ry[1]+.08,hh=.3,ss=.3,sz=LS(10);let x=x0;
   [['check_circle','完成','P'],['schedule','進行中','g'],['warning','風險','A']].forEach(([id,t,tn])=>{const w=ss+tw(t,sz)+.3,c=tn==='P'?P:tn==='A'?AC:G.t2;
    grp('小標籤・'+t,()=>{box(x+ss-.02,y,w-ss+.02,hh,{fill:GF,r:PR?Math.min(PR,.05):0,text:t,size:sz,bold:1,color:G.ink,align:'left',margin:[7,4,0,0],name:'標籤文字'});
     box(x,y,ss,hh,{fill:c,r:PR?Math.min(PR,.05):0,name:'圖示方塊'});glyph(id,x+.05,y+.05,.2,onC(c));});x+=w+.14;});
   txt(x0,ry[1]+.56,cw,.22,'J｜小尺寸 Small chips（各自獨立）',{size:cs,color:G.mute,name:'圖說'});}
  // K 直式清單（4 項，第 1 項強調）
  {const x0=cx[2],y0=ry[2],ph=.44,gp=.1;grp('直式標籤清單',()=>{const items=[['01','釐清目的','Purpose'],['02','拆解結構','Structure'],['03','重新組合','Compose'],['04','檢查一致','Review']];
    ln(x0+s/2,y0+h/2,x0+s/2,y0+3*(ph+gp)+h/2,{c:G.l2,w:.75});
    items.forEach(([n,t,e],i)=>{const y=y0+i*(ph+gp),hi=i===0;lab(x0+s+.1,y,cw-s-.12,[{t},{t:'  '+e,s:Math.max(9,LS(9)),b:0,c:G.mute,f:nf}],{fill:hi?W2:GF,line:hi?P:null,lw:1,r:PR,sh:hi?'small':0});
     box(x0,y,s,h,{fill:hi?P:G.ink,r:PR,text:n,size:LS(12),bold:1,color:W2,font:nf,margin:0,name:'短字方塊'});});});
   txt(x0,y0+4*(ph+gp)-.08,cw,.22,'K｜直式清單 Stacked list（3–5 項）',{size:cs,color:G.mute,name:'圖說'});}
  // L 標籤＋說明（左色條）
  {const x=cx[0],y=5.9;grp('標籤＋說明',()=>{box(x,y,.07,.62,{fill:AC,r:0,name:'色條'});txt(x+.18,y-.02,cw-.2,.3,'關鍵假設',{size:LT,bold:1,color:G.ink,valign:'middle',name:'標籤文字'});txt(x+.18,y+.3,cw-.2,.3,'需求年增 8%；低於 5% 時重估產能',{size:Math.max(10,LS(10.5)),color:G.t2,valign:'middle',name:'說明'});});
   txt(x,y+.7,cw,.22,'L｜標籤＋說明 Label with note',{size:cs,color:G.mute,name:'圖說'});}
 };

 /* ---------- 對比式排版（v11）：As Was → To Be 的基本元件；數字可在「改字」改，倍數／增減徽章（calc）依兩邊數字自動重算 ---------- */
 const CMPK=()=>{const W2='FFFFFF',CARD=mix(G.fill||'F4F4F4','FFFFFF',.35),DARK=G.ink,RAD=st.r>0?Math.min(Math.max(st.r,.06),.12):0,onC=c=>lum(c)>.55?G.ink:W2,cs=Math.max(9,st.nSize-1.5);
  const cw=5.85,cx=[X0,X1-cw];
  const calc=(it,a,b,m,extra)=>{it.calc=Object.assign({a:cur.items.indexOf(a),b:cur.items.indexOf(b),m},extra||{});return it;};
  const cap=(x,y,w,t)=>txt(x,y,w,.22,t,{size:cs,color:G.mute,name:'圖說'});
  const pill=(x,y,w,h,t,fill,o)=>box(x,y,w,h,Object.assign({fill,r:'full',text:t,size:LS(11),bold:1,color:onC(fill),margin:0,name:'膠囊標籤'},o||{}));
  const chev=(cx0,cy0,d,dir,c)=>{circ(cx0,cy0,d,{fill:W2,line:G.line,lw:1,sh:'small',name:'箭頭底'});const k=d*.22;
   path(dir==='down'?[[cx0-k,cy0-k*.5],[cx0,cy0+k*.5],[cx0+k,cy0-k*.5]]:[[cx0-k*.5,cy0-k],[cx0+k*.5,cy0],[cx0-k*.5,cy0+k]],{line:c||G.t2,lw:2,name:'V 形箭頭'});};
  const num=(x,y,w,h,n,u,c,o)=>{o=o||{};return txt(x,y,w,h,[{t:n,s:o.s||LS(24),b:1,c,f:nf},{t:u?' '+u:'',s:o.us||LS(12),b:0,c:o.uc||c}],{valign:'middle',align:o.align||'left',name:o.name||'數值'});};
  const dbadge=(x,y,w,h,t,fill,o)=>box(x,y,w,h,Object.assign({fill,r:'full',text:t,size:LS(11),bold:1,color:onC(fill),font:nf,margin:0,line:W2,lw:1.5,name:'增減徽章'},o||{}));
  return{W2,CARD,DARK,RAD,onC,cs,cw,cx,calc,cap,pill,chev,num,dbadge};};
 SL.cmp=()=>{title('前後對比 · 數字 Before & After','As Was → To Be 基本元件；選取 →「改字」改數字，倍數／增減徽章自動重算');
  const {W2,CARD,DARK,RAD,onC,cw,cx,calc,cap,pill,chev,num,dbadge}=CMPK();
  // A 橫向一列（同 As Was／To Be 頁）
  {const x=cx[0],y=2.02,AG=.5,w=(cw-AG)/2,h=.86;let nA,nB;grp('橫向對比 As Was→To Be',()=>{
    [[x,'As Was','2000',0],[x+w+AG,'To Be','4000',1]].forEach(([xx,lab,n,hi])=>{const f=hi?P:CARD,fg=hi?onC(P):G.t2;
     box(xx,y,w,h,{fill:f,r:RAD*1.3,sh:'card',force:1,name:lab+' 卡'});pill(xx+.16,y+(h-.32)/2,.84,.32,lab,hi?W2:DARK,{color:hi?P:W2});
     txt(xx+1.1,y+.1,w-1.2,.24,'銷售額',{size:LS(11),color:hi?mix(fg,P,.25):G.mute,name:'指標名稱'});const it=num(xx+1.1,y+.32,w-1.2,.44,n,'元',hi?fg:G.ink,{s:LS(22)});if(hi)nB=it;else nA=it;});
    chev(x+w+AG/2,y+h/2,.36,'right');calc(dbadge(x+cw-.62,y-.14,.62,.28,'×2',DARK,{size:10}),nA,nB,'x');});
   cap(x,y+h+.08,cw,'A｜橫向對比 Side by side（＋倍數徽章 ×2）');}
  // B 多指標對照（每列 As Was｜To Be｜增減）
  {const x=cx[0],y=3.32,c=[1.35,1.3,.42,1.3,1.0],xs=c.reduce((a,v,i)=>(a.push(a[i]+v),a),[x]),rh=.42,hh=.34,tw0=c.reduce((a,b)=>a+b,0);
   grp('多指標對照',()=>{txt(x,y,c[0],hh,'指標 Metric',{size:LS(11),color:G.mute,valign:'middle',name:'欄頭'});
    pill(xs[1]+.12,y+.02,c[1]-.24,hh-.04,'As Was',DARK);pill(xs[3]+.12,y+.02,c[3]-.24,hh-.04,'To Be',P);txt(xs[4],y,c[4],hh,'增減 Δ',{size:LS(11),color:G.mute,align:'center',valign:'middle',name:'欄頭'});
    [['銷售額','2000','4000','元'],['客戶數','100','160','人'],['交期','10','7','天']].forEach(([m,a,b,u],i)=>{const yy=y+hh+.06+i*rh;ln(x,yy,x+tw0,yy,{c:G.l2,w:.75});
     txt(x,yy,c[0],rh,m,{size:LS(12),bold:1,color:G.ink,valign:'middle',name:'指標名稱'});
     const na=num(xs[1],yy,c[1],rh,a,u,G.t2,{s:LS(15),us:LS(10),align:'center',uc:G.mute}),nb=num(xs[3],yy,c[3],rh,b,u,P,{s:LS(15),us:LS(10),align:'center',uc:G.mute});
     path([[xs[2]+c[2]/2-.04,yy+rh/2-.07],[xs[2]+c[2]/2+.04,yy+rh/2],[xs[2]+c[2]/2-.04,yy+rh/2+.07]],{line:G.l1,lw:1.5,name:'V 形箭頭'});
     const up=+b>=+a,good=i<2?up:!up;const gc=good?GOOD:BAD;
     calc(box(xs[4]+.17,yy+.08,c[4]-.34,rh-.16,{fill:mix(gc,'FFFFFF',.86),r:'full',text:(up?'+':'−')+Math.round(Math.abs(b-a)/a*100)+'%',size:LS(10.5),bold:1,color:gc,font:nf,margin:0,name:'增減徽章'}),na,nb,'pct');});
    ln(x,y+hh+.06+3*rh,x+tw0,y+hh+.06+3*rh,{c:G.l2,w:.75});});
   cap(x,y+hh+.12+3*rh,cw,'B｜多指標對照 Multi-metric（Δ 自動算 +100%／−30%）');}
  // C 長條比較（長度依數值比例）
  {const x=cx[0],y=5.42,lw=.95,bw=3.7,vw=cw-lw-bw,bh=.28;let na,nb,ba,bb;grp('長條比較',()=>{
    txt(x,y,2.5,.26,'銷售額 Sales',{size:LS(11),bold:1,color:G.ink,valign:'middle',name:'指標名稱'});
    [['As Was','2000',0],['To Be','4000',1]].forEach(([lab,n,hi],i)=>{const yy=y+.36+i*.44;pill(x,yy,lw-.12,bh,lab,hi?P:DARK);
     box(x+lw,yy,bw,bh,{fill:GF,r:'full',name:'長條底'});const b=box(x+lw,yy,bw*(hi?1:.5),bh,{fill:hi?P:G.l1,r:'full',name:'長條'});
     const t=num(x+lw+bw,yy-.06,vw,bh+.12,n,'',hi?P:G.t2,{s:LS(14),align:'right'});if(hi){nb=t;bb=b;}else{na=t;ba=b;}});
    calc(ba,na,nb,'bar',{full:bw,side:'a'});calc(bb,na,nb,'bar',{full:bw,side:'b'});
    calc(dbadge(x+cw-.62,y-.02,.62,.28,'×2',DARK,{size:10}),na,nb,'x');});
   cap(x,y+1.22,cw,'C｜長條比較 Bar length（長度依數字比例）');}
  // D 直式上下（下 V 形箭頭）
  {const x=cx[1],y=2.02,h=.66,gp=.42;let nA,nB;grp('直式對比 上→下',()=>{
    [[y,'As Was','導入前 Before','2000',0],[y+h+gp,'To Be','導入後 After','4000',1]].forEach(([yy,lab,sub,n,hi])=>{const f=hi?P:CARD,fg=hi?onC(P):G.ink;
     box(x,yy,cw,h,{fill:f,r:RAD*1.3,sh:'card',force:1,name:lab+' 卡'});pill(x+.18,yy+(h-.32)/2,.9,.32,lab,hi?W2:DARK,{color:hi?P:W2});
     txt(x+1.25,yy,2,h,[{t:'銷售額 ',s:LS(13),b:1,c:fg},{t:sub,s:LS(10),c:hi?mix(fg,P,.3):G.mute}],{valign:'middle',name:'指標名稱'});
     const it=num(x+cw-2.1,yy,1.9,h,n,'元',hi?fg:G.t2,{s:LS(22),align:'right'});if(hi)nB=it;else nA=it;});
    chev(x+cw/2,y+h+gp/2,.36,'down');calc(dbadge(x+cw-.62,y+h+gp-.14,.62,.28,'×2',DARK,{size:10}),nA,nB,'x');});
   cap(x,y+2*h+gp+.08,cw,'D｜直式上下 Stacked（下 V 形箭頭）');}
  // E 大數字分割（細分隔線＋增減箭頭）
  {const x=cx[1],y=4.12,h=1.3,hw=cw/2;let nA,nB;grp('大數字分割',()=>{
    ln(x+hw,y+.08,x+hw,y+h-.08,{c:G.line,w:.75});
    [[x,'As Was','導入前','2000',0],[x+hw+.3,'To Be','導入後','4000',1]].forEach(([xx,lab,sub,n,hi])=>{
     txt(xx,y,hw-.4,.26,[{t:lab,b:1,c:hi?P:G.t2,f:nf},{t:'  '+sub,c:G.mute}],{size:LS(11),name:'欄頭'});
     const it=num(xx,y+.28,hw-.4,.66,n,'元',hi?P:G.t2,{s:LS(36),us:LS(14),uc:G.mute});if(hi)nB=it;else nA=it;});
    chev(x+hw,y+h/2,.34,'right');
    calc(txt(x+hw+.3,y+.98,hw-.4,.28,'▲ +100%',{size:LS(12),bold:1,color:GOOD,font:nf,name:'增減'}),nA,nB,'arrow');
    txt(x,y+.98,hw-.4,.28,'銷售額（元）',{size:LS(11),color:G.mute,name:'指標名稱'});});
   cap(x,y+h+.08,cw,'E｜大數字分割 Big number split（細分隔線＋▲▼ 增減）');}
 };
 SL.cmp2=()=>{title('步驟與欄位對比 Compare Layouts','三步驟、痛點對改善、降幅、VS 左右欄、時間軸、小尺寸');
  const {W2,CARD,DARK,RAD,onC,cs,cw,cx,calc,cap,pill,chev,num,dbadge}=CMPK();
  // F 三步驟 現況→改善→目標
  {const x=cx[0],y=2.02,gp=.36,w=(cw-2*gp)/3,h=.98;grp('三步驟 現況→改善→目標',()=>{
    [['現況 Now','60',0],['改善 Better','75',0],['目標 Goal','90',1]].forEach(([lab,n,hi],i)=>{const xx=x+i*(w+gp),f=hi?P:CARD,fg=hi?onC(P):G.ink;
     box(xx,y,w,h,{fill:f,r:RAD*1.3,sh:'card',force:1,name:'步驟卡 '+(i+1)});
     circ(xx+.26,y+.27,.28,{fill:hi?W2:DARK,text:String(i+1),size:LS(10),bold:1,color:hi?P:W2,font:nf,margin:0,name:'編號徽章'});
     pill(xx+.46,y+.13,w-.6,.28,lab,hi?mix(P,'FFFFFF',.18):W2,{color:hi?W2:G.ink,line:hi?null:G.line,lw:.75});
     txt(xx+.14,y+.48,w-.24,.42,[{t:'達成率 ',s:LS(10),c:hi?mix(fg,P,.3):G.mute},{t:n,s:LS(20),b:1,c:hi?fg:G.ink,f:nf},{t:'%',s:LS(11),b:1,c:hi?fg:G.t2}],{valign:'middle',name:'數值'});
     if(i<2)chev(xx+w+gp/2,y+h/2,.3,'right');});});
   cap(x,y+h+.08,cw,'F｜三步驟 Three-step（現況 → 改善 → 目標）');}
  // G Before／After 卡＋條列（痛點 vs 改善）
  {const x=cx[0],y=3.38,AG=.44,w=(cw-AG)/2,h=1.62;grp('痛點 vs 改善',()=>{
    box(x,y,w,h,{fill:CARD,r:RAD*1.3,sh:'card',force:1,name:'Before 卡'});box(x+w+AG,y,w,h,{fill:W2,line:P,lw:1.25,r:RAD*1.3,sh:'card',force:1,name:'After 卡'});
    pill(x+.18,y+.16,1.3,.32,'Before 痛點',DARK);pill(x+w+AG+.18,y+.16,1.3,.32,'After 改善',P);
    ['人工對帳耗時 3 天','資料散落多個系統','錯誤難追蹤'].forEach((t,i)=>{const yy=y+.62+i*.3;circ(x+.28,yy+.13,.08,{fill:G.l1,name:'項目符號'});txt(x+.42,yy,w-.52,.26,t,{size:LS(12),color:G.t2,valign:'middle',name:'痛點 '+(i+1)});});
    ['自動對帳半天完成','單一平台即時查詢','異常自動提醒'].forEach((t,i)=>{const yy=y+.62+i*.3,xx=x+w+AG;icon('check_circle',xx+.18,yy+.03,.2,{variant:'line',color:P});txt(xx+.44,yy,w-.54,.26,t,{size:LS(12),bold:1,color:G.ink,valign:'middle',name:'改善 '+(i+1)});});
    chev(x+w+AG/2,y+h/2,.36,'right');});
   cap(x,y+h+.08,cw,'G｜Before／After 條列 Pain points → Improvements');}
  // K 小尺寸 inline chips
  {const x=cx[0],y=5.5,hh=.32;
   grp('小尺寸對比 ×2',()=>{const a=box(x,y,1.3,hh,{fill:GF,r:'full',text:[{t:'As Was  ',s:LS(9),b:1,c:G.mute,f:nf},{t:'2000',s:LS(12),b:1,c:G.t2,f:nf}],margin:0,name:'數值'});
    path([[x+1.38,y+hh/2-.07],[x+1.45,y+hh/2],[x+1.38,y+hh/2+.07]],{line:G.t2,lw:1.5,name:'V 形箭頭'});
    const b=box(x+1.53,y,1.3,hh,{fill:P,r:'full',text:[{t:'To Be  ',s:LS(9),b:1,c:mix(onC(P),P,.3),f:nf},{t:'4000',s:LS(12),b:1,c:onC(P),f:nf}],margin:0,name:'數值'});
    calc(dbadge(x+2.91,y+.03,.5,hh-.06,'×2',DARK,{line:null}),a,b,'x');});
   const x2=x+3.65;grp('小尺寸對比 降幅',()=>{const a=box(x2,y,.9,hh,{fill:GF,r:'full',text:[{t:'前 ',s:LS(9),b:1,c:G.mute},{t:'5%',s:LS(12),b:1,c:G.t2,f:nf}],margin:0,name:'數值'});
    path([[x2+.98,y+hh/2-.07],[x2+1.05,y+hh/2],[x2+.98,y+hh/2+.07]],{line:G.t2,lw:1.5,name:'V 形箭頭'});
    const b=box(x2+1.13,y,.9,hh,{fill:mix(GOOD,'FFFFFF',.86),r:'full',text:[{t:'後 ',s:LS(9),b:1,c:GOOD},{t:'1%',s:LS(12),b:1,c:GOOD,f:nf}],margin:0,name:'數值'});
    calc(txt(x2+2.08,y,.6,hh,'↓80%',{size:LS(11),bold:1,color:GOOD,font:nf,valign:'middle',name:'增減'}),a,b,'down');});
   cap(x,y+hh+.1,cw-1.5,'K｜小尺寸 Inline chips（放在句子或表格旁）');}
  // H 降幅（不良率 5% → 1%，綠色）
  {const x=cx[1],y=2.02,AG=.5,w=(cw-AG)/2,h=.86,GS=mix(GOOD,'FFFFFF',.9);let nA,nB;grp('降幅對比 ↓%',()=>{
    box(x,y,w,h,{fill:CARD,r:RAD*1.3,sh:'card',force:1,name:'As Was 卡'});box(x+w+AG,y,w,h,{fill:GS,line:GOOD,lw:1,r:RAD*1.3,sh:'card',force:1,name:'To Be 卡'});
    pill(x+.16,y+(h-.32)/2,.84,.32,'As Was',DARK);pill(x+w+AG+.16,y+(h-.32)/2,.84,.32,'To Be',GOOD);
    [[x,'5',G.t2,0],[x+w+AG,'1',GOOD,1]].forEach(([xx,n,c,hi])=>{txt(xx+1.1,y+.1,w-1.2,.24,'不良率 Defect',{size:LS(11),color:G.mute,name:'指標名稱'});const it=num(xx+1.1,y+.32,w-1.2,.44,n+'%','',c,{s:LS(22)});if(hi)nB=it;else nA=it;});
    chev(x+w+AG/2,y+h/2,.36,'right',GOOD);calc(dbadge(x+cw-.7,y-.15,.7,.3,'↓80%',GOOD),nA,nB,'down');});
   cap(x,y+h+.08,cw,'H｜降幅 Reduction（越低越好，綠色 ↓80%）');}
  // I 左右欄 VS
  {const x=cx[1],y=3.38,h=1.62,cl=(cw-.7)/2;grp('左右欄 VS',()=>{
    ln(x+cw/2,y,x+cw/2,y+h,{c:G.line,w:.75});
    [[x,'方案 A 自建',DARK,[['成本','120 萬'],['時程','6 個月'],['維運','自行負責']]],[x+cl+.7,'方案 B 外包',P,[['成本','80 萬'],['時程','3 個月'],['維運','廠商支援']]]].forEach(([xx,hd,f,rows],k)=>{
     pill(xx,y,cl,.34,hd,f);rows.forEach(([a,b],i)=>{const yy=y+.46+i*.38;if(i)ln(xx,yy,xx+cl,yy,{c:G.l2,w:.5});
      txt(xx+.08,yy,.8,.38,a,{size:LS(11),color:G.mute,valign:'middle',name:'項目'});txt(xx+.8,yy,cl-.88,.38,b,{size:LS(13),bold:1,color:k?P:G.ink,align:'right',valign:'middle',name:'內容'});});});
    circ(x+cw/2,y+h/2+.17,.52,{fill:DARK,line:W2,lw:2,sh:'small',text:'VS',size:LS(13),bold:1,color:W2,font:nf,margin:0,name:'VS 圓'});});
   cap(x,y+h+.08,cw,'I｜左右欄 VS（兩案比較）');}
  // J 時間軸 前後（年份）
  {const x=cx[1]+.8,cw=CW/2-1.1,y=5.5,ly=y+.42;let nA,nB;grp('時間軸前後',()=>{
    ln(x+.2,ly,x+cw-.2,ly,{c:G.line,w:1.25,head:'triangle'});
    [[x+.5,'2024','As Was','2000',0],[x+cw-1.2,'2026','To Be','4000',1]].forEach(([xx,yr,lab,n,hi])=>{const c=hi?P:G.t2;
     pill(xx-.38,y,.76,.28,yr,hi?P:DARK,{font:nf});circ(xx,ly,.16,{fill:hi?P:W2,line:hi?W2:G.l1,lw:2,name:'時間點'});
     txt(xx+.42,y,1.0,.28,lab,{size:LS(10),bold:1,color:hi?P:G.mute,font:nf,valign:'middle',name:'階段'});
     const it=num(xx-.8,ly+.1,1.6,.34,n,'萬',c,{s:LS(17),us:LS(11),align:'center'});if(hi)nB=it;else nA=it;});
    calc(dbadge(x+cw/2-.32,ly-.15,.64,.3,'×2',DARK),nA,nB,'x');});
   cap(x,y+.9,cw,'J｜時間軸前後 Timeline（年份標籤）');}
 };

 /* ---------- v12 缺漏元件（KPI 卡、評比指標、時間軸／甘特、2×2 矩陣、議程／章節、註腳與強調）：白底、灰階＋1–2 強調色；每個元件一個群組，改字面板可改文字、數字自動重算 ---------- */
 const GPK=()=>{const W2='FFFFFF',DARK=G.ink,RAD=st.r>0?Math.min(Math.max(st.r,.06),.12):0,onC=c=>lum(c)>.55?G.ink:W2,cs=Math.max(9,st.nSize-1.5),AC2=HASA?A:PD,TN=(c,t)=>mix(c,'FFFFFF',t==null?.86:t),SF='F2F2F2',AMB='8C8C8C';
  const card=(x,y,w,h,o)=>box(x,y,w,h,Object.assign({fill:W2,line:G.l2,lw:.75,r:RAD,sh:'card',force:1,name:'卡片'},o||{}));
  const pill=(x,y,w,h,t,fill,o)=>box(x,y,w,h,Object.assign({fill,r:'full',text:t,size:LS(10.5),bold:1,color:onC(fill),margin:0,name:'膠囊標籤'},o||{}));
  const nm=(x,y,w,zh,en,o)=>txt(x,y,w,.24,[{t:zh,b:1},{t:en?'  '+en:'',s:Math.max(9,LS(9)),b:0,c:G.mute,f:nf}],Object.assign({size:LS(11),color:G.ink,valign:'middle',name:'指標名稱'},o||{}));
  const num=(x,y,w,h,n,u,c,o)=>{o=o||{};return txt(x,y,w,h,[{t:n,s:o.s||LS(24),b:1,c,f:nf},{t:u?' '+u:'',s:o.us||LS(11),b:0,c:o.uc||G.mute,f:nf}],{valign:'middle',align:o.align||'left',name:o.name||'數值'});};
  const light=(cx0,cy0,d,c)=>circ(cx0,cy0,d,{fill:c,line:W2,lw:1,sh:'small',name:'燈號'});
  const cap=(x,y,w,t)=>txt(x,y,w,.22,t,{size:cs,color:G.mute,name:'圖說'});
  const small=(x,y,w,t,o)=>txt(x,y,w,.2,t,Object.assign({size:Math.max(9,LS(9)),color:G.mute,valign:'middle',name:'說明'},o||{}));
  const calc1=(it,src,m,extra)=>{it.calc=Object.assign({a:cur.items.indexOf(src),m},extra||{});return it;};
  const badge=(cx0,cy0,d,t,fill,o)=>circ(cx0,cy0,d,Object.assign({fill,text:t,size:LS(11),bold:1,color:onC(fill),font:nf,margin:0,name:'編號徽章'},o||{}));
  return{AMB,W2,DARK,RAD,onC,cs,AC2,TN,SF,card,pill,nm,num,light,cap,small,calc1,badge};};
 SL.tline=()=>{title('時間軸與甘特 Timeline & Gantt','里程碑、日期、任務名稱皆可「改字」；甘特：灰＝計畫、強調色＝實際、虛線＝今天');
  const {W2,DARK,RAD,TN,onC,card,pill,small,cap}=GPK();const wL=7.6;
  // A 水平里程碑
  {const x=X0,y=1.98,ay=y+.92,n=5,sp=wL/n;grp('水平里程碑時間軸',()=>{ln(x,ay,x+wL,ay,{c:G.line,w:1.25,head:'triangle'});
    [['01/15','立案','Kick-off'],['03/01','設計凍結','Design freeze'],['05/20','試產','Pilot run'],['08/10','驗證','Qualification'],['10/30','量產','Mass production']].forEach(([d,t,e],i)=>{const cx0=x+sp*(i+.5),up=i%2===0,done=i<2,now=i===2;
     el('diamond',cx0-.12,ay-.12,.24,.24,{fill:now?P:done?DARK:W2,line:now||done?W2:G.l1,lw:1.5,sh:now?'small':0,name:'里程碑'});
     ln(cx0,up?ay-.14:ay+.14,cx0,up?ay-.3:ay+.3,{c:G.l2,w:.75});
     pill(cx0-.42,up?ay-.56:ay+.3,.84,.26,d,now?P:DARK,{font:nf,size:LS(10)});
     txt(cx0-sp/2+.04,up?y-.04:ay+.62,sp-.08,.24,t,{size:LS(11),bold:1,color:now?P:G.ink,align:'center',valign:'middle',name:'里程碑名稱'});
     small(cx0-sp/2+.04,up?y+.18:ay+.84,sp-.08,e,{align:'center',font:nf,name:'英文說明'});});});
   cap(x,y+1.98,wL,'A｜水平里程碑 Milestones（菱形＋日期膠囊、上下交錯）');}
  // B 週別甘特
  {const x=X0,y=4.3,lc=1.75,nW=8,cw=(wL-lc)/nW,hh=.3,rh=.32,T=[['需求確認 Spec',0,2,0,2],['設計 Design',1,3,1,3.4],['打樣 Sample',3,2,3.4,2.2],['驗證 Verify',4,3,5.6,.9],['量產準備 Ramp',6,2,null,null]],today=6.5;
   grp('週別甘特',()=>{const gx=c=>x+lc+c*cw;
    for(let c=0;c<nW;c++){box(gx(c)+.03,y,cw-.06,hh-.04,{fill:'F2F2F2',r:'full',text:'W'+(36+c),size:Math.max(9,LS(9)),bold:1,color:G.t2,font:nf,margin:0,name:'週'});}
    txt(x,y,lc,hh-.04,'任務 Task',{size:Math.max(9,LS(9.5)),bold:1,color:G.mute,valign:'middle',name:'欄頭'});
    for(let c=1;c<nW;c++)ln(gx(c),y+hh,gx(c),y+hh+T.length*rh,{c:'EDEDED',w:.5});
    T.forEach(([t,ps,pl,as,al],i)=>{const yy=y+hh+i*rh;ln(x,yy+rh,x+wL,yy+rh,{c:G.l2,w:.5});txt(x,yy,lc,rh,t,{size:LS(10),color:G.ink,valign:'middle',name:'任務'});
     box(gx(ps)+.04,yy+.07,pl*cw-.08,.1,{fill:'D9D9D9',r:'full',name:'計畫'});if(as!=null)box(gx(as)+.04,yy+.19,al*cw-.08,.1,{fill:i===3?AL:P,r:'full',name:'實際'});});
    el('diamond',gx(8)-.13,y+hh+4*rh+.07,.2,.2,{fill:DARK,name:'里程碑'});
    const tx0=gx(today);ln(tx0,y+hh-.02,tx0,y+hh+T.length*rh+.04,{c:AL,w:1.25,dash:'sysDash'});pill(tx0-.32,y+hh+T.length*rh+.06,.64,.22,'今天',AL,{size:Math.max(10,LS(10))});});
   const ly=y+hh+T.length*rh+.34;cap(x,ly,4.6,'B｜週別甘特 Weekly Gantt（灰＝計畫、色＝實際、虛線＝今天）');}
  // C 垂直時間軸
  {const x=X0+wL+.45,w=CW-wL-.45,y=1.98,rh=.9,lx=x+1.08;grp('垂直時間軸',()=>{ln(lx,y+.2,lx,y+3*rh+.4,{c:G.l2,w:1.25});
    [['2026 Q1','建立基準','現況良率 95.2%'],['2026 Q2','根因分析','鎖定 CMP 參數'],['2026 Q3','導入對策','良率提升至 98.6%'],['2026 Q4','標準化','擴展至 B 線']].forEach(([d,t,s],i)=>{const yy=y+i*rh,now=i===2,done=i<2;
     pill(x,yy+.17,.86,.26,d,now?P:done?DARK:'E6E6E6',{font:nf,size:Math.max(9,LS(9))});
     circ(lx,yy+.3,.16,{fill:now?P:done?DARK:W2,line:now||done?W2:G.l1,lw:1.5,name:'時間點'});
     card(lx+.2,yy,w-1.3,.66,now?{line:P,lw:1.25}:{});txt(lx+.34,yy+.08,w-1.55,.26,t,{size:LS(11),bold:1,color:now?P:G.ink,valign:'middle',name:'階段'});
     small(lx+.34,yy+.36,w-1.55,s,{name:'說明'});});});
   cap(x,y+3*rh+.74,w,'C｜垂直時間軸 Vertical（目前階段＝強調外框）');
   const py=y+3*rh+1.2,pw=(w+.2)/3;grp('階段 V 形時程',()=>{[['Q1','規劃'],['Q2','執行'],['Q3','驗收']].forEach(([q,t],i)=>{const now=i===1,f=now?P:i<1?DARK:'E6E6E6';
     el(i===0?'homePlate':'chevron',x+i*(pw-.07),py,pw,.42,{fill:f,adj:.16,text:[{t:q+' ',b:1,f:nf},{t,b:0}],size:LS(10.5),color:onC(f),margin:0,name:'階段'});});});
   cap(x,py+.5,w,'D｜階段 V 形時程 Phase chevrons');}
 };
 SL.emph=()=>{title('註腳與強調 Footnote & Emphasis','8 種強調手法：各一張卡＝用途＋實例；上標 ¹² 對應頁尾來源列與資料截止日');
  const {W2,DARK,RAD,TN,card,pill,badge,num}=GPK();const gp=.2,cw=(CW-3*gp)/4,cx=[0,1,2,3].map(i=>X0+i*(cw+gp)),y1=1.92,h1=1.98,y2=y1+h1+gp,h2=1.94;
  const AC=HASA?A:P,MK=TN(AC,.62),HL=[TN(AC,.8),TN(AL,.8)],bs=LS(12.5),us=Math.max(9,LS(9.5));
  const EW=5.5,AV={1:'整段都畫螢光筆，重點反而消失',2:'一段超過 2 處醒目底色',3:'只寫新值、不寫比較基準',4:'一頁放兩個以上的放大數字'};
  /* 卡片表頭：編號徽章＋深色膠囊（中文）＋英文小字；「適用」一行；細分隔線 */
  const head=(x,y,w,n,zh,en,use)=>{card(x,y,w,w===EW?2.32:n===7?h2:(y<y2?h1:h2));if(w===EW&&AV[n]){ln(x+.2,y+1.9,x+w-.2,y+1.9,{c:G.l2,w:.75,dash:'dash'});txt(x+.2,y+1.94,w-.4,.32,[{t:'避免 ',b:1,c:AL},{t:AV[n]}],{size:Math.max(10,LS(10.5)),color:G.t2,valign:'middle',name:'避免'});}badge(x+.33,y+.32,.3,String(n).padStart(2,'0'),P,{size:Math.max(9,LS(9.5))});
   const pw=tw(zh,LS(10.5))+.34;pill(x+.54,y+.18,pw,.28,zh,DARK);txt(x+.62+pw,y+.18,w-.8-pw,.28,en,{size:Math.max(9,LS(9)),color:G.mute,font:nf,valign:'middle',name:'英文'});
   txt(x+.2,y+.58,w-.4,.24,[{t:'適用 ',b:1,c:P},{t:use}],{size:us,color:G.t2,valign:'middle',name:'用途'});ln(x+.2,y+.9,x+w-.2,y+.9,{c:G.l2,w:.75});};
  // 01 半高螢光筆：文字方塊＋硬切漸層（上 55% 透明、下緣淡色帶、最後 8% 透明），不換行＋圖形隨文字調整大小
  {const cw=EW,x=X0+0*.1,y=y1;grp('半高螢光筆',()=>{head(x,y,cw,1,'半高螢光筆','Marker','單一關鍵詞／結論');
    txt(x+.2,y+1.02,cw-.4,.24,'本季結論 Key message',{size:us,color:G.mute,valign:'middle',name:'說明'});
    const s=LS(19),t='良率提升 1.2 pt',m=txt(x+.2,y+1.3,tw(t,s)*1.06+.08,s*1.3/72,[{t,b:1}],{size:s,color:G.ink,valign:'middle',name:'半高螢光筆'});m.mk={c:MK,a:.55,b:.92};
    txt(x+.2,y+1.62,cw-.4,.24,'主因：CMP 參數優化',{size:us,color:G.t2,valign:'middle',name:'補充'});});}
  // 02 淡色螢光底（自訂 srgb 醒目提示）
  {const cw=EW,x=X0+1*.1,y=y1;grp('螢光底強調',()=>{head(x,y,cw,2,'淡色螢光底','Highlight','段落裡的行內片語');
    [[['交期 ',''],['縮短 2 天',HL[0]],['，滿意度上升','']],[['仍需注意 ',''],['B 線產能',HL[1]],[' 瓶頸','']]].forEach((rs,i)=>
     txt(x+.2,y+1.06+i*.4,cw-.4,.32,rs.map(([t,h])=>h?{t,b:1,hl:h}:{t}),{size:bs,color:G.ink,valign:'middle',name:'強調句'}));});}
  // 03 前後值：刪除線＋V 形箭頭＋增減徽章（改字自動重算）
  {const cw=EW,x=X0+2*.1,y=y1;grp('前後值（刪除線）',()=>{head(x,y,cw,3,'前後對比','Old → New','改善成果、版本差異');
    txt(x+.2,y+1.06,cw-.4,.26,[{t:'不良率 ',b:1},{t:'Defect · 月均',c:G.mute,f:nf,s:Math.max(9,LS(9))}],{size:LS(10.5),color:G.ink,valign:'middle',name:'指標名稱'});
    const yy=y+1.4,o1=txt(x+.2,yy,.78,.42,'5.0%',{size:LS(15),color:G.mute,font:nf,strike:1,valign:'middle',name:'舊值'});
    path([[x+1.02,yy+.12],[x+1.11,yy+.21],[x+1.02,yy+.3]],{line:G.l1,lw:1.5,name:'V 形箭頭'});
    const n1=txt(x+1.22,yy-.04,1.0,.5,'1.2%',{size:LS(22),bold:1,color:P,font:nf,valign:'middle',name:'新值'});
    box(x+cw-.84,yy+.08,.64,.26,{fill:TN(GOOD),r:'full',text:'↓76%',size:Math.max(9,LS(10)),bold:1,color:GOOD,font:nf,margin:0,name:'增減徽章'}).calc={a:cur.items.indexOf(o1),b:cur.items.indexOf(n1),m:'down'};});}
  // 04 放大數字＋單位＋說明
  {const cw=EW,x=X0+3*.1,y=y1;grp('放大數字',()=>{head(x,y,cw,4,'放大數字','Big number','一頁一個主角數字');
    box(x+.2,y+1.1,.05,.72,{fill:AC,name:'強調色條'});num(x+.36,y+1.0,cw-.56,.62,'+1.2','pt',P,{s:LS(34),us:LS(13),uc:P});
    txt(x+.38,y+1.6,cw-.58,.24,[{t:'良率提升 ',b:1,c:G.ink},{t:'vs. 上季 QoQ',c:G.mute,f:nf}],{size:us,valign:'middle',name:'數字說明'});});}
  // 05 底線強調（強調色／黑）
  {const x=cx[0],y=y2;grp('底線強調',()=>{head(x,y,cw,5,'底線強調','Underline','目標、承諾、行動項');
    txt(x+.2,y+1.06,cw-.4,.32,[{t:'下季目標：'},{t:'良率 99%',b:1,u:AC,c:AC}],{size:bs,color:G.ink,valign:'middle',name:'強調句'});
    txt(x+.2,y+1.46,cw-.4,.32,[{t:'關鍵：'},{t:'先穩定 CMP',b:1,u:G.ink},{t:'，再擴線'}],{size:bs,color:G.ink,valign:'middle',name:'強調句'});});}
  // 06 星號／NEW 徽章：同高 0.28"
  {const x=cx[1],y=y2,bh=.28;grp('星號徽章',()=>{head(x,y,cw,6,'標記徽章','Badge','新增、重點、需關注');
    const r1=y+1.08,r2=y+1.48;circ(x+.2+bh/2,r1+bh/2,bh,{fill:AL,name:'徽章底'});icon('star',x+.2+bh*.2,r1+bh*.2,bh*.6,{variant:'line',color:W2});
    txt(x+.58,r1,cw-.78,bh,[{t:'重點 ',b:1,c:AL},{t:'本月新增 2 條產線'}],{size:bs,color:G.ink,valign:'middle',name:'強調句'});
    box(x+.2,r2,.62,bh,{fill:DARK,r:'full',text:'NEW',size:Math.max(9,LS(9)),bold:1,color:W2,font:nf,align:'left',margin:[17,4,0,0],name:'膠囊標籤'});icon('star',x+.25,r2+.06,.16,{variant:'line',color:AL});
    txt(x+.92,r2,cw-1.12,bh,'新版 SOP 上線',{size:bs,color:G.ink,valign:'middle',name:'強調句'});});}
  // 07 內文上標 ¹²（與 08 頁尾同一套編號，以細點線連到頁尾）
  {const x=cx[2],y=y2,w=2*cw+gp;grp('內文上標',()=>{head(x,y,w,7,'上標註腳','Superscript','數字需要出處或定義時；編號與頁尾一致');
    txt(x+.2,y+1.04,w-2.2,.4,[{t:'平均良率 '},{t:'98.6%',b:1,c:P,f:nf},{t:'¹',b:1,c:AC},{t:'，較去年提升 '},{t:'1.2 pt',b:1,c:P,f:nf},{t:'²',b:1,c:AC}],{size:LS(15),color:G.ink,valign:'middle',name:'強調句'});
    txt(x+.2,y+1.52,3.3,.24,[{t:'¹ ² ',b:1,c:AC},{t:'淡色小號，與頁尾同一套編號'}],{size:us,color:G.mute,valign:'middle',name:'說明'});
    const cx0=x+w-1.82,cw0=1.62;[['¹','資料來源','Source'],['²','註解','Note']].forEach(([k,zh,en],i)=>{const yy=y+1.06+i*.4;box(cx0,yy,cw0,.3,{fill:'F2F2F2',r:'full',name:'對應頁尾'});
     txt(cx0+.14,yy,cw0-.2,.3,[{t:k+'  ',b:1,c:AC},{t:zh+' ',b:1,c:G.t2},{t:en,c:G.mute,f:nf}],{size:us,valign:'middle',name:'對應頁尾'});});
    });}
  // 08 頁尾來源／註解列（對齊投影片頁尾、單列）＋資料截止日膠囊
  {const x=X0,y=6.36,w=CW,fs=Math.max(9,LS(9));grp('頁尾來源／註解',()=>{ln(x,y,x+w,y,{c:G.l2,w:.75});badge(x+.12,y+.21,.24,'08',P,{size:Math.max(9,LS(7.5))});
    txt(x+.34,y+.08,4.4,.26,[{t:'¹ ',b:1,c:AC},{t:'資料來源 Source：',b:1,c:G.t2},{t:'MES／YMS 系統，2026 W30–W42 晶圓資料'}],{size:fs,color:G.mute,valign:'middle',name:'來源'});
    txt(x+4.9,y+.08,4.0,.26,[{t:'² ',b:1,c:AC},{t:'註 Note：',b:1,c:G.t2},{t:'良率以晶圓數加權；不含工程批'}],{size:fs,color:G.mute,valign:'middle',name:'註解'});
    const cw2=2.55,xx=x+w-cw2;box(xx,y+.08,cw2,.26,{fill:'F2F2F2',r:'full',name:'資料截止日底'});pill(xx,y+.08,.9,.26,'資料截止',DARK,{size:fs});
    txt(xx+.98,y+.08,cw2-1.06,.26,[{t:'Data as of ',c:G.mute},{t:'2026/10/16',b:1,c:G.ink}],{size:fs,font:nf,valign:'middle',align:'center',name:'資料截止日'});});}
  // 09 資料警示框、10 註記編號列（v17：E3 補元件；位置與 01–04 重疊，只在拆頁的第二頁出現）
  {const x=cx[0],y=y1,w=2*cw+gp;grp('資料警示框',()=>{head(x,y,w,9,'資料警示框','Data caveat','數字有前提、樣本小或口徑改變時');
    box(x+.2,y+1.0,w-.4,.78,{fill:TN(AL,.88),r:.06,name:'警示底'});box(x+.2,y+1.0,.06,.78,{fill:AL,r:0,name:'警示色條'});
    txt(x+.4,y+1.04,w-.7,.34,[{t:'▲ 注意 ',b:1,c:ALd},{t:'W41 起良率改以晶圓數加權',b:1,c:G.ink}],{size:bs,valign:'middle',name:'警示標題'});
    txt(x+.4,y+1.38,w-.7,.3,'與 W40 以前的數字不可直接比較；樣本 n = 1,240 片',{size:us+.5,color:G.t2,valign:'middle',name:'警示說明'});});}
  {const x=cx[2],y=y1,w=2*cw+gp;grp('註記編號列',()=>{head(x,y,w,10,'註記編號列','Numbered notes','一頁多個註腳時，依出現順序編號');
    [['¹','資料來源：MES／YMS，W30–W42'],['²','良率以晶圓數加權，不含工程批'],['³','成本以 2026 預算匯率 31.5 計']].forEach(([n,t],i)=>txt(x+.2,y+1.0+i*.3,w-.4,.28,[{t:n+' ',b:1,c:AC},{t}],{size:us+.5,color:G.t2,valign:'middle',name:'註記'}));});}
 };




 /* ---------- 版型｜As Was／To Be（參考法說會簡報版面）：上方三行重點句 20pt → 前後對照兩框 20pt → 左：四個行動方塊 18pt（6 字、兩行、內距 0）／右：原生表格（首列＋首欄為表頭） ---------- */
 SL.ex1=()=>{title('高效溝通：讓想法被看見','關鍵在於把資訊整理成對方能理解的結構');
  const R=1.3,cy=3.3,cxs=[X0+CW/6,X0+CW/2,X0+CW*5/6];
  [['Why','為何要重視\n溝通品質'],['How','溝通的\n三個關鍵'],['What','呈現的\n三個層次']].forEach(([b,t],i)=>bigCircle(cxs[i],cy,R,b,t));
  sep((cxs[0]+cxs[1])/2,cy,{k:1.2});sep((cxs[1]+cxs[2])/2,cy,{k:1.2});
  const sm=[['觀察',143],['分析',90],['表達',37]].map(([t,a])=>{const r=a*Math.PI/180;return[t,cxs[1]+R*Math.cos(r),cy+R*Math.sin(r)];});
  sm.forEach(([t,x,y],i)=>smallCircle(x,y,.8,t,{hi:i===1}));
  const lists=[['蒐集','篩選','歸納'],['比較','拆解','連結'],['聚焦','排序','呈現']];
  sm.forEach(([t,x],i)=>txt(x-.42,5.15,.95,1.05,lists[i].map((w,j)=>({t:'①②③'[j]+' '+w,br:1})),{size:11.5,color:G.t2,valign:'top',lsp:1.2}));
  [[0,['節省理解時間','對齊彼此認知','提升決策效率']],[2,['資料','資訊','洞見']]].forEach(([ci,ws])=>ws.forEach((w,j)=>tag(cxs[ci],5.0+j*.55,w,{anchor:'center',w:2.3,h:.42,size:13,sh:1})));
  note(X0,6.58,7.4,'※ 三個圓依序回答 Why／How／What，中間的小圓拆出方法，左右兩側以清單補充');used(null);};

 SL.ex2=()=>{title('策略規劃框架地圖','從現況、課題到行動方案的思考路徑');
  const n=5,sw=.46,cw=(CW-(n-1)*sw)/n,by=4.3,bh=.92;const bx=i=>X0+i*(cw+sw);const k=K;
  const lc=(x,y,w,h,zh,en,o)=>{o=o||{};const zs=Math.round((o.s||20)*k);
   if(o.strong&&st.sym==='hair'){box(x,y,w,h,{fill:'FFFFFF',line:P,lw:1.5,text:[{t:zh,s:zs,c:P,br:1},{t:en,s:10,c:P,f:nf}],lsp:.95});return;}
   if(o.strong){box(x,y,w,h,{fill:P,r:st.r,sh:1,text:[{t:zh,s:zs,b:st.lBold,c:'FFFFFF',br:1},{t:en,s:10,c:mix(P,'FFFFFF',.7),f:nf}],lsp:.95,name:'重點卡片'});return;}
   cardBase(x,y,w,h);txt(x,y+(st.card==='top'?.04:0),w,h,[{t:zh,s:zs,b:st.lBold,c:lblC,br:1},{t:en,s:10,c:G.mute,f:nf}],{align:'center',lsp:.95});};
  [['願景','Vision'],['使命','Mission'],['目標','Objective'],['策略','Strategy'],['戰術','Tactic']].forEach(([z,e],i)=>{lc(bx(i),by,cw,bh,z,e,{strong:i===2});if(i<n-1)sep(bx(i)+cw+sw/2,by+bh/2);});
  const sx=bx(2),sy=2.0,sW=cw,sH=.9;lc(sx,sy,sW,sH,'現況','Situation');
  const px=bx(1)-.2,py=3.05,pw=cw*.82,ph=.72,qx=bx(3)+cw+.2-cw*.82;lc(px,py,pw,ph,'問題','Problem',{s:16});lc(qx,py,pw,ph,'課題','Question',{s:16});
  curve([px+pw/2,py-.06],[px+pw/2,sy+sH/2],[px+pw/2+.3,sy+sH/2],[sx-.08,sy+sH/2],{tail:false});
  curve([sx+sW+.08,sy+sH/2],[qx+pw/2-.3,sy+sH/2],[qx+pw/2,sy+sH/2],[qx+pw/2,py-.06],{tail:false});
  conn([[px+pw+.08,py+ph/2],[qx-.08,py+ph/2]],{dash:'sysDash',tail:'triangle',c:G.l1,head:'triangle'});
  const bwid=()=>st.badge==='pill'?.44:.34;
  const grpW=(nums,label)=>nums.length*(bwid()+.07)+.03+tagW(label,11,.32);
  const grp=(x,y,nums,label,o)=>{let xx=x;nums.forEach(q=>{const w=bwid();badge(xx+w/2,y+.16,two(q),{d:.32,size:11});xx+=w+.07;});tag(xx+.03,y,label,{size:11,h:.32,tone:(o&&o.tone)||'p'});};
  [['界定問題'],['排序優先'],['盤點資源']].forEach(([l],i)=>grp(X0,2.0+i*.48,[i+1],l));
  [['設定目標'],['規劃路徑'],['分配資源']].forEach(([l],i)=>grp(bx(4)+.2,2.0+i*.48,[i+4],l,{tone:'g'}));
  const oy=5.55,oh=.6;cardBase(X0,oy,CW,oh);txt(X0,oy,CW,oh,[{t:'組織',s:LS(18),b:st.lBold,c:G.ink},{t:'  Organization',s:11,c:G.mute,f:nf}],{align:'center'});
  [[[7],'凝聚共識'],[[8],'提升能力'],[[9],'資訊透明'],[[10],'激勵動機']].forEach(([ns,l],i)=>grp(X0+CW*(i+.5)/4-grpW(ns,l)/2,6.37,ns,l,{tone:i%2?'g':'p'}));
  {const lx=bx(4)+.2,ly=3.5;[[P,'藍：01–03・07・09'],[G.t2,'灰：04–06・08・10']].forEach(([c,t],i)=>{circ(lx+.08,ly+.13+i*.3,.14,{fill:c,name:'圖例點'});txt(lx+.24,ly+i*.3,cw,.26,t,{size:10,color:G.t2,valign:'middle',name:'圖例'});});}
  used(null,.5);};

 SL.ex3=()=>{title('能力成長地圖','從個人特質到可遷移能力的三階段路徑');
  const cy=4.6,ys=[3.15,4.6,6.05];
  {const steps=[[X0+.47,'起點：特質'],[2.55,'知識＋技能'],[4.02,'能力'],[6.25,'三階段實踐'],[8.45,'吸收／產出'],[10.9,'終點：可遷移']];ln(steps[0][0],2.4,steps[5][0],2.4,{c:G.l1,w:1,head:'triangle'});
   steps.forEach(([x,t],i)=>{badge(x,2.4,bnum(i+1),{d:.3,size:10,nodot:1});txt(x-.8,1.95,1.6,.26,t,{size:10,bold:1,color:i===0||i===5?P:G.t2,align:'center'});});}
  txt(5.25,6.64,2.0,.26,'前期 → 後期（由上往下）',{size:10,bold:1,color:G.t2,align:'center'});
  node(X0,cy-.3,.95,.6,'特質',{size:LS(15)});note(X0-.1,cy+.38,1.15,'個性、動機\n與價值觀',{h:.5,align:'center',wrap:1});
  node(2.05,3.7-.27,1.0,.54,'知識',{size:LS(14)});node(2.05,5.5-.27,1.0,.54,'技能',{size:LS(14)});
  note(2.0,3.15,1.1,'知道是什麼',{h:.26,align:'center'});note(2.0,5.81,1.1,'知道怎麼做',{h:.26,align:'center'});
  node(3.55,cy-.3,.95,.6,'能力',{size:LS(15),strong:1});note(3.45,cy+.38,1.15,'能產生價值',{h:.26,align:'center'});
  const m1=(X0+.95+2.05)/2;[3.7,5.5].forEach(y=>conn([[X0+.95+.06,cy],[m1,cy],[m1,y],[2.05-.06,y]],{tail:false}));
  const m2=(3.05+3.55)/2;[3.7,5.5].forEach(y=>conn([[3.05+.06,y],[m2,y],[m2,cy],[3.55-.06,cy]],{tail:false}));
  const cx=5.25,cw=2.0,ch=.72;const m3=(4.5+cx)/2;
  ys.forEach(y=>conn(y===cy?[[4.5+.06,cy],[cx-.06,cy]]:[[4.5+.06,cy],[m3,cy],[m3,y],[cx-.06,y]],{tail:false}));
  [['執行實踐','前期','打基礎'],['溝通協作','中期','擴影響'],['整合創新','後期','建槓桿']].forEach(([t,a,b],i)=>{const y=ys[i]-ch/2;
   cardBase(cx,y,cw,ch);txt(cx,y,cw,ch,t,{size:LS(16),bold:st.lBold,color:lblC,align:'center'});
   if(st.cornerTag){ribbon(cx+cw-.25,y,a,'p','right');ribbon(cx+.15,y+ch,b,'g','left');}});
  const b1=7.75,b2=8.55,bw=.6;colBar(b1,2.85,bw,3.7);colBar(b2,2.85,bw,3.7);
  
  
  [['看','練'],['問','談'],['想','寫']].forEach(([a,b],i)=>{badge(b1+bw/2,ys[i],a,{d:.48,size:14,nodot:1});badge(b2+bw/2,ys[i],b,{d:.48,size:14,nodot:1});
   conn([[cx+cw+.08,ys[i]],[b1+bw/2-.3,ys[i]]],{head:false,tail:false,c:G.line,w:1,dash:'solid'});});
  const dx=9.75,dw=2.3;const desc=[['流程操作、工具使用','標準作業與規範'],['表達、傾聽、協調','提案、談判、領導'],['結構思考、問題解決','資源整合、創新']];
  desc.forEach((d,i)=>{const y=ys[i];const yy=[y-.32,y+.32];const jx=b2+bw+.25;
   conn([[b2+bw/2+.3,y],[jx,y]],{head:false,tail:false});
   yy.forEach((t,j)=>{conn([[jx,y],[jx,t],[dx-.08,t]],{tail:false});txt(dx,t-.15,dw,.3,d[j],{size:11,color:G.t2});});});
  fadeBar(12.28,3.1,.42,3.45,G.l1);txt(11.0,2.45,1.75,.28,'能力可遷移度',{size:10.5,bold:1,color:G.ink,align:'right',name:'刻度標題'});
  txt(11.15,2.77,1.6,.26,'↑ 情境限定',{size:10.5,bold:1,color:G.t2,align:'right'});txt(11.15,6.68,1.6,.3,'↓ 跨域通用',{size:10.5,bold:1,color:A,align:'right'});used(null,.5);};

 /* ================= v14 重整新頁（A0／A1–A5、B1／B3·2–B6）：白底、灰階＋1–2 強調色、可選元件、最小字 10pt ================= */
 const UK=()=>{const K0=GPK();const Z=v=>Math.max(10,LS(v));const W2='FFFFFF',AC2=HASA?A:PD;
  const cap=(x,y,w,t)=>txt(x,y,w,.24,t,{size:10,color:G.t2,valign:'middle',name:'圖說'});
  const comp=(code,zh,en,c,fn,meta)=>{grp(zh,()=>fn(c.x,c.y,c.w,c.h),meta);cap(c.x,c.y+c.h+.04,c.w,code+'｜'+zh+(en?' '+en:''));};
  const T=(x,y,w,h,t,o)=>txt(x,y,w,h,t,Object.assign({size:11,color:G.t2,valign:'middle',wrap:1},o||{}));
  const H=(x,y,w,zh,en,o)=>txt(x,y,w,.3,[{t:zh,b:1},{t:en?'  '+en:'',s:10,b:0,c:G.mute,f:nf}],Object.assign({size:Z(13),color:G.ink,valign:'middle',name:'標題'},o||{}));
  const chev=(x,y,s,c,lw)=>path([[x,y],[x+s*.5,y+s*.5],[x,y+s]],{line:c||G.l1,lw:lw||1.5,name:'V 形箭頭'});
  const chevD=(x,y,s,c)=>path([[x,y],[x+s*.5,y+s*.5],[x+s,y]],{line:c||G.l1,lw:1.5,name:'V 形箭頭'});
  const ph=(x,y,w,h,nm,kk)=>{const r=w/h,k=kk||(r>1.6?'w':r>1.15?'m':r>.85?'s':'t');const it={t:'pic',x,y,w,h,png:PH[k],name:nm||'圖片佔位（右鍵→變更圖片）'};cur.items.push(it);box(x,y,w,h,{line:G.l2,lw:.75,name:'圖片外框'});return it;};
  const pill=(x,y,w,h,t,fill,o)=>K0.pill(x,y,w,h,t,fill,Object.assign({size:Z(10.5)},o||{}));
  const bdg=(cx0,cy0,d,t,fill,o)=>K0.badge(cx0,cy0,d,t,fill||P,Object.assign({size:Z(11)},o||{}));
  const av=(cx0,cy0,d,t,fill)=>circ(cx0,cy0,d,{fill:fill||K0.TN(P,.8),text:t,size:Math.max(10,Math.round(d*30)),bold:1,color:fill?W2:PD,margin:0,name:'頭像（姓名縮寫）'});
  const GRID=(nc,nr,y0,y1,o)=>{o=o||{};const gx=o.gx!=null?o.gx:.3,gy=o.gy!=null?o.gy:.3,ch=o.cap!=null?o.cap:.3;const w=(CW-(nc-1)*gx)/nc,h=(y1-y0-(nr-1)*gy-nr*ch)/nr;const a=[];
   for(let r=0;r<nr;r++)for(let c=0;c<nc;c++)a.push({x:X0+c*(w+gx),y:y0+r*(h+ch+gy),w,h});return a;};
  return Object.assign({},K0,{Z,cap,comp,T,H,chev,chevD,ph,pill,bdg,av,GRID,W2,AC2});};
 const Y0=1.9,Y1=6.82;
 /* A0 頁面骨架 */
 SL.frame=()=>{title('頁面骨架 Page Skeleton','結論先行標題 4+2 種變體＋標準頁尾（來源／資料截止／頁碼／機密等級）：每頁都從這裡開始');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,2,Y0,5.86,{gy:.14});const hs=Z(18),HL='B 線良率回升至 98.6%\nCMP 參數優化見效';
  const sub=(x,y,w,t)=>T(x,y,w,.26,[{t:'依據 ',b:1,c:P},{t}],{size:Z(11),name:'副標依據'});
  comp('A','純文字結論標題','Plain headline',C[0],(x,y,w,h)=>{T(x,y+.08,w,.9,HL,{size:hs,bold:1,color:G.ink,valign:'top',lsp:1.05,name:'結論標題'});box(x,y+1.08,.5,.05,{fill:P,name:'色條'});sub(x,y+1.2,w,'W40–W42 MES 晶圓資料');});
  comp('B','編號徽章＋標題','Numbered headline',C[1],(x,y,w,h)=>{bdg(x+.26,y+.36,.46,'01',P,{size:Z(13)});T(x+.62,y+.08,w-.62,.9,HL,{size:hs,bold:1,color:G.ink,valign:'top',lsp:1.05,name:'結論標題'});sub(x+.62,y+1.2,w-.62,'良率週報 W42');});
  comp('C','章節膠囊＋標題','Section pill + headline',C[2],(x,y,w,h)=>{pill(x,y+.04,1.5,.3,'02 現況分析',DARK,{align:'left',margin:[8,4,0,0]});T(x,y+.44,w,.9,HL,{size:hs,bold:1,color:G.ink,valign:'top',lsp:1.05,name:'結論標題'});sub(x,y+1.32,w,'2026 Q3 品質檢討');});
  comp('D','結論框＋底線','Conclusion box',C[3],(x,y,w,h)=>{box(x,y+.04,w,1.06,{fill:TN(P,.92),r:.06,name:'結論底'});box(x,y+.04,.07,1.06,{fill:P,name:'色條'});
   T(x+.24,y+.12,w-.4,.9,HL,{size:hs,bold:1,color:PD,valign:'middle',lsp:1.05,name:'結論標題'});ln(x,y+1.2,x+w,y+1.2,{c:G.l2,w:.75});sub(x,y+1.28,w,'MES／YMS，晶圓數加權');});
  comp('E','關鍵數字標題','Key-number headline',C[4],(x,y,w,h)=>{txt(x,y+.1,1.36,.8,[{t:'+1.2',b:1,c:P,f:nf},{t:' pt',s:Z(12),c:G.mute,f:nf}],{size:Z(30),valign:'middle',name:'關鍵數字'});ln(x+1.42,y+.18,x+1.42,y+.92,{c:G.l2,w:1});
   T(x+1.56,y+.06,w-1.56,.9,'良率三週回升，\nCMP 參數優化見效',{size:Z(16),bold:1,color:G.ink,lsp:1.05,name:'結論標題'});sub(x,y+1.2,w,'vs. 上季 QoQ，W42');});
  comp('F','標題＋結論列','Headline + takeaway',C[5],(x,y,w,h)=>{T(x,y+.04,w,.5,'B 線良率三週回升至 98.6%',{size:hs,bold:1,color:G.ink,name:'結論標題'});ln(x,y+.62,x+w,y+.62,{c:G.l2,w:.75});
   pill(x,y+.8,.7,.3,'結論',DARK);T(x+.82,y+.76,w-.82,.38,'下季擴線到 C 線，需 2 位製程工程師',{size:Z(11.5),color:G.ink,name:'結論句'});});
  const fy=6.16;grp('標準頁尾（來源／截止／頁碼）',()=>{const w=8.9;ln(X0,fy,X0+w,fy,{c:G.l2,w:.75});
   T(X0,fy+.06,4.1,.3,[{t:'資料來源 ',b:1,c:G.t2},{t:'MES／YMS，W30–W42 晶圓資料'}],{size:10,color:G.mute,name:'來源'});
   const xx=X0+4.25;box(xx,fy+.08,2.75,.28,{fill:'F2F2F2',r:'full',name:'資料截止底'});pill(xx,fy+.08,.95,.28,'資料截止',DARK,{size:10});T(xx+1.0,fy+.08,1.7,.28,'2026/10/16',{size:10,color:G.ink,bold:1,align:'center',font:nf,name:'資料截止日'});
   T(X0+w-1.6,fy+.06,1.6,.3,[{t:'07',b:1,c:G.ink,f:nf},{t:' / 24',c:G.mute,f:nf}],{size:10.5,align:'right',name:'頁碼'});});
  T(X0,fy+.42,8.9,.24,'G｜標準頁尾 Standard footer：來源 Source · 資料截止 Data as of · 頁碼 Page',{size:10,color:G.mute,name:'圖說'});
  grp('機密等級膠囊',()=>{const x=X0+9.25;pill(x,fy+.06,1.25,.3,'內部使用',AL,{size:10});T(x+1.34,fy+.06,1.6,.3,'Internal only',{size:10,color:G.mute,font:nf,name:'英文'});});
  T(X0+9.25,fy+.42,CW-9.25,.24,'H｜機密等級 Classification',{size:10,color:G.mute,name:'圖說'});
  /* v14：補兩種骨架（3:7 左窄右寬、上圖下文） */
  comp('I','3:7 左窄右寬骨架','3:7 split',{x:X0,y:2.0,w:3.8,h:2.1},(x,y,w,h)=>{T(x,y,w,.3,'結論：B 線良率回升 1.2 pt',{size:Z(12),bold:1,color:G.ink,wrap:0,name:'結論標題'});box(x,y+.42,w*.3-.08,h-.5,{fill:TN(P,.9),r:.06,name:'左欄 30%'});T(x+.1,y+.52,w*.3-.28,.6,'重點\n3 點',{size:10.5,bold:1,color:PD,name:'左欄字'});
   box(x+w*.3+.08,y+.42,w*.7-.08,h-.5,{fill:W2,line:G.l2,lw:.75,r:.06,name:'右欄 70%'});T(x+w*.3+.2,y+.52,w*.7-.3,.3,'圖表／表格區',{size:10.5,color:G.t2,wrap:0,name:'右欄字'});});
  comp('J','上圖下文骨架','Image over text',{x:X0+4.17,y:2.0,w:3.8,h:2.1},(x,y,w,h)=>{ph(x,y,w,h-.72,'圖片佔位（右鍵→變更圖片）','w');T(x,y+h-.66,w,.3,'一句話說明這張圖的重點',{size:Z(12),bold:1,color:G.ink,wrap:0,name:'圖說標題'});T(x,y+h-.34,w,.3,'來源：MES／W42',{size:10,color:G.t2,wrap:0,name:'來源'});});
  comp('K','5:5 雙欄骨架','5:5 two columns',{x:X0+8.34,y:2.0,w:CW-8.34,h:2.1},(x,y,w,h)=>{T(x,y,w,.3,'結論：兩方案成本相近，B 交期短',{size:Z(12),bold:1,color:G.ink,wrap:0,name:'結論標題'});[['方案 A','自建｜120 萬｜6 個月'],['方案 B','外包｜80 萬｜3 個月']].forEach(([a,b],i)=>{const xx=x+i*(w/2+.06);box(xx,y+.42,w/2-.06,h-.5,{fill:i?TN(P,.92):W2,line:i?null:G.l2,lw:.75,r:.06,name:'欄 '+(i+1)});T(xx+.14,y+.54,w/2-.3,.3,a,{size:Z(12),bold:1,color:i?P:G.ink,wrap:0,name:'欄標題'});T(xx+.14,y+.9,w/2-.3,.6,b.replace(/｜/g,'\n'),{size:10.5,color:G.t2,valign:'top',name:'欄內容'});});});
  comp('L','結論列＋三格骨架','Takeaway + 3 cells',{x:X0,y:4.62,w:CW,h:1.2},(x,y,w,h)=>{box(x,y,w,.4,{fill:TN(P,.92),r:.06,name:'結論列'});T(x+.16,y+.05,w-.3,.3,'結論：三項改善都在 Q4 前可落地',{size:Z(12),bold:1,color:PD,wrap:0,name:'結論標題'});
   ['現況｜良率 97.4%','做法｜CMP 參數優化','效益｜+1.2 pt／月省 18 萬'].forEach((t,i)=>{const cw=(w-.3)/3,xx=x+i*(cw+.15);box(xx,y+.5,cw,h-.56,{fill:W2,line:G.l2,lw:.75,r:.06,name:'格'+(i+1)});T(xx+.14,y+.56,cw-.28,h-.68,t,{size:Z(11),color:G.ink,valign:'middle',name:'格字'});});});
};
 /* A1 卡片與面板 */
 SL.cards=()=>{title('卡片與面板 Cards & Panels','9 種卡片：基本、角標、表頭、側色條、圖示頭、數字頭、編號、待定、雙欄；整張可選、文字可改');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,3,Y0,Y1,{gy:.1,cap:.28});const bt='先用一句話說重點，再補兩行說明。';
  const body=(x,y,w,h,t)=>T(x,y,w,h,t||bt,{size:11,valign:'top',lsp:1.15,name:'內文'});
  comp('A','基本卡片','Basic',C[0],(x,y,w,h)=>{card(x,y,w,h);H(x+.22,y+.16,w-.44,'標題＋內文','Card');ln(x+.22,y+.52,x+w-.22,y+.52,{c:G.l2,w:.75});body(x+.22,y+.62,w-.44,h-.7);});
  comp('B','角標卡片','Corner tag',C[1],(x,y,w,h)=>{card(x,y+.1,w,h-.1);pill(x+w-1.2,y-.02,1.0,.28,'第一階段',P);H(x+.22,y+.26,w-1.5,'角落標籤','Ribbon');body(x+.22,y+.66,w-.44,h-.72,'標示階段、分類或狀態，\n跨在邊框上不佔內文。');});
  comp('C','表頭強調卡','Header band',C[2],(x,y,w,h)=>{card(x,y,w,h,{line:P,lw:1});topRound(x,y,w,.46,RAD,{fill:P,name:'表頭'});T(x+.22,y,w-.44,.46,[{t:'表頭強調',b:1},{t:'  Key card',s:10,c:TN(P,.6),f:nf}],{size:Z(13),color:W2,name:'表頭文字'});body(x+.22,y+.58,w-.44,h-.64,'同頁只放一張，\n標出最重要的結論。');});
  comp('D','側邊色條卡','Side bar',C[3],(x,y,w,h)=>{card(x,y,w,h);box(x,y,.08,h,{fill:AC2,name:'側邊色條'});H(x+.3,y+.16,w-.5,'側邊色條','Accent bar');body(x+.3,y+.56,w-.5,h-.62);});
  comp('E','圖示頭卡片','Icon head',C[4],(x,y,w,h)=>{card(x,y,w,h);icon('lightbulb',x+.22,y+.2,.56,{variant:'tint'});H(x+.92,y+.18,w-1.1,'圖示頭','Icon');body(x+.92,y+.52,w-1.1,h-.6,'圖示放左上，\n標題與內文靠右。');});
  comp('F','數字頭卡片','Number head',C[5],(x,y,w,h)=>{card(x,y,w,h);txt(x+.22,y+.1,w-.44,.6,[{t:'98.6',b:1,c:P,f:nf},{t:' %',s:Z(13),c:G.mute,f:nf}],{size:Z(30),valign:'middle',name:'數值'});
   H(x+.22,y+.72,w-.44,'整體良率','Yield');T(x+.22,y+1.0,w-.44,.26,'較上季 +1.2 pt',{size:11,color:GOOD,bold:1,name:'說明'});});
  comp('G','編號徽章卡','Numbered',C[6],(x,y,w,h)=>{card(x+.14,y+.1,w-.14,h-.1);bdg(x+.2,y+.16,.4,'01',P);H(x+.54,y+.22,w-.76,'編號徽章','Step');body(x+.54,y+.6,w-.76,h-.66,'跨在左上角，\n用於步驟與重點清單。');});
  comp('H','虛線待定卡','Pending',C[7],(x,y,w,h)=>{box(x,y,w,h,{fill:W2,line:G.l1,lw:1,dash:'dash',r:RAD,name:'待定卡片'});pill(x+.22,y+.18,.9,.28,'待確認',G.t2);H(x+1.22,y+.17,w-1.4,'尚未定案','TBD',{color:G.mute});body(x+.22,y+.6,w-.44,h-.66,'虛線＝未確定，\n定案後改成實線卡片。');});
  comp('I','雙欄卡片','Two-column',C[8],(x,y,w,h)=>{card(x,y,w,h);const m=x+w/2;ln(m,y+.2,m,y+h-.2,{c:G.l2,w:.75});
   [['現況','As is','人工抽檢 10%',G.t2],['目標','To be','AOI 全檢 100%',P]].forEach(([a,b,c,col],i)=>{const xx=x+.22+i*w/2;H(xx,y+.16,w/2-.4,a,b,{color:col});T(xx,y+.56,w/2-.4,.6,c,{size:Z(12),bold:1,color:col,valign:'top',name:'內文'});});});};
 /* A2 標籤與編號 */
 SL.tags=()=>{title('標籤與編號 Labels & Numbers','標籤 4 色調、小尺寸、堆疊清單、編號徽章、徽章說明、圈號、狀態膠囊、步驟徽章列：全部可選');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(4,2,Y0,Y1);
  comp('A','單一標籤 4 色調','Tag tones',C[0],(x,y,w,h)=>{[['主要標籤','p'],['輔助標籤','a'],['灰階標籤','g'],['外框標籤','o']].forEach(([t,tone],i)=>tag(x+(i%2)*1.42,y+.3+Math.floor(i/2)*.7,t,{tone,size:12,h:.36,w:1.3}));});
  comp('B','小尺寸標籤','Small tags',C[1],(x,y,w,h)=>{let xx=x;['元素','關聯','因果'].forEach((t,i)=>{xx+=tag(xx,y+.3,t,{tone:i===0?'o':'g',size:10,h:.28})+.12;});xx=x;['NEW','v2.1','Q3'].forEach((t,i)=>{xx+=tag(xx,y+.84,t,{tone:i===0?'p':'g',size:10,h:.28})+.12;});
   T(x,y+1.36,w,.5,'小標籤用於註記版本、分類，\n每處最多 3 個',{size:10,color:G.mute,valign:'top',name:'說明'});});
  comp('C','堆疊清單','Stacked',C[2],(x,y,w,h)=>{['釐清溝通目的','對齊彼此期待','降低理解門檻','提升決策效率'].forEach((t,i)=>tag(x,y+.08+i*.48,t,{w:w,h:.38,size:12,tone:i===0?'p':'g',sh:1}));});
  comp('D','編號徽章樣式','Badges',C[3],(x,y,w,h)=>{[1,2,3,4].forEach(n=>badge(x+.28+(n-1)*.62,y+.4,bnum(n),{d:.42,alt:n===4&&HASA}));[1,2,3,4].forEach(n=>bdg(x+.28+(n-1)*.62,y+1.1,.42,two(n),n===1?P:n===4?TN(P,.8):DARK,n===4?{color:PD}:{}));
   T(x,y+1.5,w,.4,'實心＝目前／完成，淡色＝未開始',{size:10,color:G.mute,name:'說明'});});
  comp('E','徽章＋說明清單','Badge list',C[4],(x,y,w,h)=>{[['界定問題','先釐清要解決什麼'],['盤點現況','蒐集事實與數據'],['排序優先','聚焦影響最大處']].forEach(([a,b],i)=>{const yy=y+.1+i*.62;bdg(x+.2,yy+.24,.38,String(i+1),P);
   T(x+.5,yy,w-.5,.28,a,{size:Z(12),bold:1,color:G.ink,name:'項目'});T(x+.5,yy+.27,w-.5,.26,b,{size:10.5,name:'說明'});});});
  comp('F','圈號清單 ①②③','Circled list',C[5],(x,y,w,h)=>{['① 釐清目的','② 拆解結構','③ 重新組合','④ 檢查一致'].forEach((t,i)=>T(x,y+.08+i*.44,w,.36,t,{size:Z(13),color:i===0?G.ink:G.t2,bold:i===0,name:'清單'}));});
  comp('G','狀態膠囊','Status pills',C[6],(x,y,w,h)=>{[['完成','Done',GOOD],['進行中','Doing',G.t2],['延遲','Late',BAD],['未開始','To do','8C8C8C']].forEach(([t,e,c],i)=>{const yy=y+.06+i*.46;
   box(x,yy,1.3,.32,{fill:TN(c,.86),r:'full',name:'狀態膠囊'});T(x+.06,yy,.3,.32,{完成:'✓',進行中:'◐',延遲:'▲',未開始:'○'}[t],{size:10.5,bold:1,color:c,align:'center',font:nf,wrap:0,name:'狀態符號'});T(x+.34,yy,.96,.32,t,{size:10.5,bold:1,color:c==='8C8C8C'?G.t2:mix(c,'000000',.15),name:'狀態'});T(x+1.42,yy,w-1.42,.32,e,{size:10,color:G.mute,font:nf,name:'英文'});});});
  comp('H','步驟徽章橫列 01–05','Step badges',C[7],(x,y,w,h)=>{const n=5,sp=(w-.4)/(n-1);ln(x+.2,y+.5,x+.2+sp*(n-1),y+.5,{c:G.l2,w:1.25});
   ['立案','設計','試產','驗證','量產'].forEach((t,i)=>{bdg(x+.2+i*sp,y+.5,.38,two(i+1),i<2?DARK:i===2?P:'E3E3E3',i>2?{color:G.t2}:{});T(x+.2+i*sp-.32,y+.78,.64,.26,t,{size:10,color:i===2?P:G.t2,bold:i===2,align:'center',name:'步驟'});});
   T(x,y+1.3,w,.5,'深＝完成、主色＝目前、淺灰＝未到',{size:10,color:G.mute,valign:'top',name:'說明'});});
  comp('I','數量標籤','Count tags',C[4],(x,y,w,h)=>{[['待辦',12,G.t2],['進行中',5,P],['已完成',28,DARK],['延遲',2,AL]].forEach(([t,v,c],i)=>{const xx=x+(i%2)*(w/2),yy=y+.2+Math.floor(i/2)*.62;box(xx,yy,w/2-.15,.4,{fill:'F7F7F7',r:'full',name:'數量標籤底'});T(xx+.16,yy,w/2-.8,.4,t,{size:Z(11),bold:1,color:G.ink,wrap:0,name:'標籤'});circ(xx+w/2-.42,yy+.2,.32,{fill:c,text:String(v),size:10,bold:1,color:W2,font:nf,margin:0,name:'數量'});});});
  comp('J','分類色點標籤','Category dots',C[5],(x,y,w,h)=>{[['製程',P],['品質',DARK],['設備',G.t2],['安全',AL]].forEach(([t,c],i)=>{const yy=y+.15+i*.36;circ(x+.12,yy+.14,.14,{fill:c,name:'色點'});T(x+.3,yy,1.0,.28,t,{size:Z(11),bold:1,color:G.ink,wrap:0,name:'分類'});box(x+1.25,yy+.08,(w-1.4)*[.8,.55,.4,.15][i],.12,{fill:TN(c,.4),r:'full',name:'比例條'});});});};
 /* A2·3 清單與勾選 */
 SL.lists=()=>{title('清單與勾選 Lists & Checklists','圖示＋文字（直／橫／2×2）、三態勾選、編號清單、關鍵詞清單：3–6 項最易讀');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,2,Y0,Y1);
  const IT=[['speed','縮短交期','Lead time −30%'],['verified','提升良率','Yield +1.2 pt'],['savings','降低成本','Cost −8%'],['groups','團隊協作','4 teams aligned'],['schedule','準時交貨','OTD 98%'],['shield','安全零災','0 incidents']];
  const nI=NUM('nIcon',3,3),nL=NUM('nList',4,3);
  comp('A',`圖示＋文字（直式 ${nI} 項）`,'Icon list',C[0],(x,y,w,h)=>{const sp=Math.min(.66,(h-.06)/nI),d=Math.min(.5,sp-.12);IT.slice(0,nI).forEach(([ic,a,b],i)=>{const yy=y+.06+i*sp;icon(ic,x,yy,d,{variant:'tint'});
   if(nI<=4){T(x+.64,yy,w-.64,.28,a,{size:Z(12),bold:1,color:G.ink,name:'項目'});T(x+.64,yy+.26,w-.64,.26,b,{size:10.5,font:nf,name:'說明'});}
   else T(x+d+.14,yy,w-d-.14,d,[{t:a,b:1,c:G.ink},{t:'  '+b,s:10,c:G.mute,f:nf}],{size:Z(11.5),valign:'middle',wrap:0,name:'項目'});});},{count:'nIcon'});
  comp('B',`圖示＋文字（橫式 ${nI} 欄）`,'Icon row',C[1],(x,y,w,h)=>{const cw=w/nI,d=nI>4?.48:.6,fs=nI>4?10:12;IT.slice(0,nI).forEach(([ic,a,b],i)=>{const cx0=x+cw*i+cw/2;icon(ic,cx0-d/2,y+.1,d,{variant:i===1?'solid':'tint'});
   T(cx0-cw/2,y+.82,cw,.3,a,{size:Z(fs),bold:1,color:G.ink,align:'center',wrap:0,name:'項目'});T(cx0-cw/2,y+1.12,cw,.5,b,{size:nI>4?9:10,align:'center',valign:'top',font:nf,name:'說明'});});},{count:'nIcon'});
  comp('C','圖示＋文字 2×2','Icon grid',C[2],(x,y,w,h)=>{IT.slice(0,4).forEach(([ic,a,b],i)=>{const xx=x+(i%2)*w/2,yy=y+.06+Math.floor(i/2)*.98;box(xx,yy,w/2-.12,.86,{fill:'F7F7F7',r:.06,name:'淺灰面板'});icon(ic,xx+.14,yy+.2,.44);
   T(xx+.66,yy+.12,w/2-.84,.3,a,{size:Z(11.5),bold:1,color:G.ink,name:'項目'});T(xx+.66,yy+.44,w/2-.84,.3,b,{size:10,font:nf,name:'說明'});});});
  comp('D','勾選清單三態','Checklist',C[3],(x,y,w,h)=>{[['done','SPC 管制圖更新','完成'],['done','CMP 參數鎖定','完成'],['todo','B 線擴線評估','進行中'],['no','舊機台改造','不做']].forEach(([k,t,s],i)=>{const yy=y+.08+i*.46,d=.28;
   if(k==='done')box(x,yy,d,d,{fill:P,r:.05,text:'✓',size:12,bold:1,color:W2,margin:0,name:'已完成'});else if(k==='todo')box(x,yy,d,d,{fill:W2,line:G.t2,lw:1.25,r:.05,name:'未完成'});else box(x,yy,d,d,{fill:'EDEDED',r:.05,text:'✕',size:11,bold:1,color:G.mute,margin:0,name:'不做'});
   T(x+.42,yy-.02,w-1.5,.32,t,{size:Z(12),color:k==='no'?G.mute:G.ink,strike:k==='no',name:'項目'});T(x+w-1.0,yy-.02,1.0,.32,s,{size:10,color:k==='done'?GOOD:k==='todo'?P:G.mute,bold:1,align:'right',name:'狀態'});});});
  comp('E',`編號清單＋分隔線（${nL} 項）`,'Numbered list',C[4],(x,y,w,h)=>{const sp=Math.min(.46,(h-.04)/nL),bh=Math.min(.36,sp-.06);['釐清目的與受眾','拆解成 3 個論點','每點配一個證據','結論放在第一頁','預演並計時','收集回饋再修'].slice(0,nL).forEach((t,i)=>{const yy=y+.04+i*sp;txt(x,yy,.5,bh,two(i+1),{size:Z(nL>4?13:16),bold:1,color:i===0?P:G.l1,font:nf,valign:'middle',name:'編號'});
   T(x+.56,yy,w-.56,bh,t,{size:Z(nL>4?11:12),color:G.ink,name:'項目'});if(i<nL-1)ln(x,yy+sp-.03,x+w,yy+sp-.03,{c:'EDEDED',w:.75});});},{count:'nList'});
  comp('F',`關鍵詞清單（${nL} 項）`,'Keyword bullets',C[5],(x,y,w,h)=>{const sp=Math.min(.46,(h-.06)/nL),bh=Math.min(.34,sp-.06);[['聚焦','一頁只講一個重點'],['具體','用數字與例子說話'],['結構','先結論、後理由'],['一致','同類資訊同一格式'],['留白','元素之間留出呼吸'],['對比','重點用顏色拉開']].slice(0,nL).forEach(([a,b],i)=>{const yy=y+.06+i*sp;circ(x+.07,yy+bh/2,.1,{fill:i===0?AC2:G.l1,name:'項目符號'});
   T(x+.24,yy,w-.24,bh,[{t:a+'　',b:1,c:G.ink},{t:b}],{size:Z(nL>4?11:12),name:'項目'});});},{count:'nList'});};
 /* A3 圓形與流程鏈 */
 SL.circles=()=>{title('圓形與流程鏈 Circles & Chains','大圓疊圓、Why／How／What、同心圓、放射、流程鏈、垂直鏈、文氏圖：全部可選');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(4,2,Y0,Y1);
  comp('A','大圓＋疊圓','Hub circle',C[0],(x,y,w,h)=>{const cx0=x+w/2,cy0=y+h/2+.05,R=.72;circleShape(cx0-R,cy0-R,2*R,{noring:1});T(cx0-R,cy0-.32,2*R,.36,'How',{size:Z(20),bold:1,color:G.t2,align:'center',font:nf,name:'大字'});T(cx0-R,cy0+.04,2*R,.3,'三個關鍵',{size:11,color:PD,bold:1,align:'center',name:'說明'});
   [['觀察',200],['分析',270],['表達',340]].forEach(([t,a],i)=>{const r=a*Math.PI/180;circ(cx0+R*Math.cos(r),cy0+R*Math.sin(r),.5,{fill:i===1?P:W2,line:i===1?W2:P,lw:1.25,sh:'small',text:t,size:10,bold:1,color:i===1?W2:P,margin:0,name:'小圓'});});});
  comp('B','Why／How／What 三圓','3 circles',C[1],(x,y,w,h)=>{const d=.78,sp=(w-d)/2;[['Why','為何'],['How','如何'],['What','做什麼']].forEach(([a,b],i)=>{const cx0=x+d/2+i*sp;circ(cx0,y+.7,d,{fill:i===1?P:W2,line:i===1?null:G.l1,lw:1.25,text:a,size:Z(14),bold:1,color:i===1?W2:G.t2,font:nf,margin:0,name:'圓'});
   T(cx0-.6,y+1.16,1.2,.28,b,{size:Z(11),bold:1,color:G.ink,align:'center',name:'說明'});if(i<2)chev(cx0+d/2+(sp-d)/2-.06,y+.62,.16);});});
  comp('C','同心圓','Concentric',C[2],(x,y,w,h)=>{const cx0=x+.9,cy0=y+h/2;[[1.7,'F2F2F2','生態'],[1.15,TN(P,.75),'產品'],[.6,P,'核心']].forEach(([d,f,t],i)=>circ(cx0,cy0,d,{fill:f,line:W2,lw:1.5,name:'同心圓'}));
   T(cx0-.3,cy0-.14,.6,.28,'核心',{size:10,bold:1,color:W2,align:'center',name:'圈名'});[['產品 Product',-.42],['生態 Eco',-.72]].forEach(([a,dy],i)=>{ln(cx0+.1,cy0+dy+.04,x+1.84,cy0+dy+.04,{c:G.l1,w:.75});T(x+1.88,cy0+dy-.1,w-1.88,.28,a,{size:10,color:G.ink,bold:1,wrap:0,name:'圈名'});});
   T(x+1.88,cy0+.08,w-1.88,.28,'核心 Core',{size:10,color:P,bold:1,wrap:0,name:'圈名'});ln(cx0+.1,cy0+.18,x+1.84,cy0+.18,{c:G.l1,w:.75});});
  comp('D','圓＋放射 4 點','Radial',C[3],(x,y,w,h)=>{const cx0=x+w/2,cy0=y+h/2;const c0=circ(cx0,cy0,.74,{fill:P,line:W2,lw:2,sh:'small',text:'目標',size:Z(12),bold:1,color:W2,margin:0,name:'中心圓'});
   [['人',0,-1],['機',1,0],['料',0,1],['法',-1,0]].forEach(([t,sx,sy])=>{const px=cx0+sx*1.05,py=cy0+sy*.72;const pc=circ(px,py,.48,{fill:W2,line:G.l1,lw:1,text:t,size:Z(12),bold:1,color:G.ink,margin:0,name:'放射點'});const S={'0,-1':[0,4],'1,0':[6,2],'0,1':[4,0],'-1,0':[2,6]}[sx+','+sy];link(c0,S[0],pc,S[1],{style:{c:G.l1,w:1,head:false,tail:false}});});});
  const r2=C[4].y,rh=C[4].h,wE=CW-2*2.6-.6,CE={x:X0,y:r2,w:wE,h:rh},CF={x:X0+wE+.3,y:r2,w:2.6,h:rh},CG={x:X0+wE+2.9,y:r2,w:2.6,h:rh};
  comp('E','流程鏈＋說明','Chain + notes',CE,(x,y,w,h)=>{chain(x,y+.2,w,.56,['規劃','執行','檢討'],{size:Z(12)});const cd=chainDims(w,.56,3);[['Plan','界定範圍與目標'],['Do','小步執行、留紀錄'],['Check','比對差異、標準化']].forEach(([e,t],i)=>{const xx=x+i*cd.step;T(xx,y+.86,cd.iw,.26,e,{size:10,color:G.mute,align:'center',font:nf,wrap:0,name:'英文'});T(xx,y+1.12,cd.iw,.3,t,{size:10.5,color:G.ink,align:'center',wrap:0,name:'說明'});});});
  comp('F','垂直鏈','Vertical chain',CF,(x,y,w,h)=>{['蒐集資料','分析根因','導入對策'].forEach((t,i)=>{const yy=y+.02+i*.62;box(x+.3,yy,w-.6,.42,{fill:i===2?P:W2,line:i===2?null:G.l1,lw:1,r:.21,text:t,size:Z(11.5),bold:1,color:i===2?W2:G.ink,name:'流程鏈'});if(i<2)chevD(x+w/2-.09,yy+.48,.18);});});
  comp('G','文氏圖 2 圓','Venn',CG,(x,y,w,h)=>{const cy0=y+h/2-.08,d=1.3,cx0=x+w/2;circ(cx0-.42,cy0,d,{fill:P,ft:78,line:P,lw:1,name:'集合 A'});circ(cx0+.42,cy0,d,{fill:AC2,ft:78,line:AC2,lw:1,name:'集合 B'});
   T(cx0-1.05,cy0-.15,.6,.3,'技術',{size:Z(12),bold:1,color:PD,align:'center',name:'集合名'});T(cx0+.45,cy0-.15,.6,.3,'市場',{size:Z(12),bold:1,color:mix(AC2,'000000',.3),align:'center',name:'集合名'});T(cx0-.35,cy0-.15,.7,.3,'機會',{size:Z(11),bold:1,color:G.ink,align:'center',name:'交集'});});
  /* v14：補 4 圓維恩、環形百分比 */
  comp('H','4 圓維恩','4-set Venn',{x:X0,y:2.0,w:3.8,h:2.2},(x,y,w,h)=>{const cx0=x+w/2,cy0=y+h/2,d=1.25,o=.38;[[-o,-o*.6,P],[o,-o*.6,AC2],[-o,o*.6,G.t2],[o,o*.6,PD]].forEach(([dx,dy,c],i)=>circ(cx0+dx,cy0+dy,d,{fill:c,ft:80,line:c,lw:1,name:'集合 '+(i+1)}));
   [['品質',-1.2,-.95],['成本',.55,-.95],['交期',-1.2,.7],['人才',.55,.7]].forEach(([t,dx,dy])=>T(cx0+dx,cy0+dy,.65,.26,t,{size:10.5,bold:1,color:G.ink,align:'center',wrap:0,name:'集合名'}));
   box(cx0-.38,cy0-.15,.76,.3,{fill:mix(PD,'FFFFFF',.0),ft:40,r:'full',text:'核心',size:10.5,bold:1,color:'FFFFFF',margin:0,name:'交集'});});
  comp('I','環形百分比','Donut %',{x:X0,y:2.0,w:3.8,h:2.2},(x,y,w,h)=>{[[.72,'良率達標','72%'],[.45,'SOP 更新','45%']].forEach(([v,t,lab],i)=>{const cx0=x+w*(.27+.46*i),cy0=y+.95,d=1.4;
   circ(cx0,cy0,d,{fill:null,line:G.l2,lw:12,name:'底環'});{const R=d/2,N=40,a0=-Math.PI/2;path(Array.from({length:N+1},(_,k)=>{const t=a0+v*2*Math.PI*k/N;return[cx0+R*Math.cos(t),cy0+R*Math.sin(t)];}),{line:i===0?P:G.t2,lw:12,name:'進度環'});}
   T(cx0-.6,cy0-.2,1.2,.4,lab,{size:Z(16),bold:1,color:G.ink,align:'center',font:nf,wrap:0,name:'百分比'});T(cx0-.8,cy0+d/2+.08,1.6,.28,t,{size:10.5,color:G.t2,align:'center',wrap:0,name:'標籤'});});});
  comp('I','循環 4 階段','4-step cycle',C[4],(x,y,w,h)=>{const cx0=x+w/2,cy0=y+h/2,R=Math.min(w,h)*.33,d=.62;const S=['計畫','執行','查核','行動'];const pts=S.map((_,i)=>[cx0+R*Math.cos(-Math.PI/2+i*Math.PI/2),cy0+R*Math.sin(-Math.PI/2+i*Math.PI/2)]);circ(cx0,cy0,2*R,{line:G.l2,lw:1.25,dash:'dash',name:'循環軌跡'});S.forEach((t,i)=>circ(pts[i][0],pts[i][1],d,{fill:i===0?P:W2,line:i===0?P:G.l1,lw:1.25,text:t,size:10.5,bold:1,color:i===0?W2:G.ink,margin:0,name:'階段'}));T(cx0-.6,cy0-.15,1.2,.3,'PDCA',{size:Z(12),bold:1,color:G.t2,align:'center',font:nf,wrap:0,name:'中心'});});
  comp('J','里程碑圓點','Milestone dots',C[5],(x,y,w,h)=>{const S=[['Q1','啟動'],['Q2','試產'],['Q3','量產'],['Q4','擴線']],sp=(w-.4)/3;ln(x+.2,y+.55,x+w-.2,y+.55,{c:G.l1,w:2});S.forEach(([q,t],i)=>{const xx=x+.2+i*sp,on=i<=1;circ(xx,y+.55,i===1?.36:.24,{fill:on?P:W2,line:on?P:G.l1,lw:1.5,name:'里程碑'});T(xx-.5,y+.1,1,.26,q,{size:10,bold:1,color:on?P:G.t2,align:'center',font:nf,wrap:0,name:'季'});T(xx-.5,y+.82,1,.28,t,{size:10.5,color:G.ink,align:'center',wrap:0,name:'里程碑名'});});T(x,y+1.25,w,.28,'目前：Q2 試產（大圓）',{size:10,color:G.t2,wrap:0,name:'說明'});});
};
 /* A4 連接線與箭頭 */
 SL.conn=()=>{title('連接線與箭頭 Connectors & Arrows','直線、折線、點線、曲線、分隔、區塊箭頭、分支、雙向、回饋、編號、粗細三階、虛線計畫：黏著連接線');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(4,3,Y0,Y1,{gy:.08,cap:.28});const TL=st.cnTail==='none'?false:st.cnTail;
  const nd=(x,y,t,o)=>sym('proc',x,y,.7,.4,t,Object.assign({size:Z(12)},o||{}));
  const cell=(i,code,zh,en,fn)=>comp(code,zh,en,C[i],(x,y,w,h)=>fn(x,y,w,h,y+h/2));
  cell(0,'A','細直線','Straight',(x,y,w,h,m)=>{const a=nd(x,m-.2,'A'),b=nd(x+w-.7,m-.2,'B');link(a,3,b,1,{style:{dash:'solid',tail:TL}});});
  cell(1,'B','折線','Elbow',(x,y,w,h,m)=>{const a=nd(x,y+.1,'A'),b=nd(x+w-.7,y+h-.5,'B');link(a,3,b,1,{style:{tail:TL}});});
  cell(2,'C','點狀線','Dotted',(x,y,w,h,m)=>{const a=nd(x,m-.2,'A'),b=nd(x+w-.7,m-.2,'B');link(a,3,b,1,{style:{dash:'sysDot',w:Math.max(1.25,st.cnW),tail:TL}});});
  cell(3,'D','曲線','Curved',(x,y,w,h,m)=>{nd(x,y+h-.42,'A');nd(x+w-.7,y+h-.42,'B');curve([x+.35,y+h-.46],[x+.35,y],[x+w-.35,y],[x+w-.35,y+h-.46]);});
  cell(4,'E','▶ 分隔符號','Separator',(x,y,w,h,m)=>{const ws=['輸入','處理','輸出'],gw=(w-3*.62)/2;ws.forEach((t,j)=>{const xx=x+j*(.62+gw);T(xx,m-.18,.62,.36,t,{size:Z(12),bold:1,color:G.ink,align:'center',name:'文字'});if(j<2)sep(xx+.62+gw/2,m);});});
  cell(5,'F','區塊箭號','Chevron',(x,y,w,h,m)=>{const bw=(w+2*.18)/3;for(let j=0;j<3;j++)el(j?'chevron':'homePlate',x+j*(bw-.18+.04),m-.25,bw,.5,{fill:j===2?AC2:mix(P,'FFFFFF',j*.25),adj:.18,text:['一','二','三'][j],size:Z(12),bold:1,color:'FFFFFF',margin:[2,2,0,0],name:'區塊箭號'});});
  cell(6,'G','分支','Branch',(x,y,w,h,m)=>{const a=nd(x,m-.2,'A'),b1=nd(x+w-.7,y+.04,'B1'),b2=nd(x+w-.7,y+h-.44,'B2');const jx=x+.7+(w-1.4)/2;link(a,3,b1,1,{mid:jx});link(a,3,b2,1,{mid:jx});});
  cell(7,'H','雙向箭頭','Two-way',(x,y,w,h,m)=>{const a=nd(x,m-.2,'甲'),b=nd(x+w-.7,m-.2,'乙');link(a,3,b,1,{style:{head:'triangle',tail:'triangle'}});T(x+.7,m-.42,w-1.4,.24,'雙向溝通',{size:10,color:G.mute,align:'center',name:'標註'});});
  cell(8,'I','回饋迴圈','Feedback loop',(x,y,w,h,m)=>{const a=nd(x,y+.06,'執行'),b=nd(x+w-.7,y+.06,'檢查');link(a,3,b,1);link(b,2,a,2,{via:[[x+w-.35,y+h-.16],[x+.35,y+h-.16]],style:{dash:'sysDash',c:AC2}});T(x+.7,y+h-.44,w-1.4,.24,'回饋 Feedback',{size:10,color:AC2,bold:1,align:'center',name:'標註'});});
  cell(9,'J','帶編號連線','Numbered link',(x,y,w,h,m)=>{const a=nd(x,m-.2,'A'),b=nd(x+w-.7,m-.2,'B');link(a,3,b,1);bdg(x+w/2,m,.3,'1',P,{size:10});});
  cell(10,'K','粗細三階','Weights',(x,y,w,h,m)=>{[[2.75,'主流程',P],[1.5,'次流程',G.t2],[.75,'參考',G.l1]].forEach(([lw,t,c],i)=>{const yy=y+.16+i*.36;ln(x,yy,x+w-1.0,yy,{c,w:lw,head:'triangle'});T(x+w-.92,yy-.14,.92,.28,t,{size:10,color:G.t2,name:'標註'});});});
  cell(11,'L','虛線＝計畫中','Planned',(x,y,w,h,m)=>{const a=nd(x,m-.2,'現行'),b=sym('proc',x+w-.7,m-.2,.7,.4,'規劃',{size:Z(12),alt:1});link(a,3,b,1,{style:{dash:'dash',c:G.t2}});T(x+.7,m-.42,w-1.4,.24,'2027 導入',{size:10,color:G.mute,align:'center',name:'標註'});});};
 /* A5 圖示精選 */
 SL.icons=()=>{title('圖示精選 Icons','24 個高頻圖示＋6 種圖示＋文字組合；完整 521 個在上方「圖示庫」分頁（可搜尋、換色、下載 ZIP）');
  if(!ICONS)return;const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();
  const L=[['groups','團隊'],['person','人員'],['support_agent','窗口'],['factory','工廠'],['precision_manufacturing','設備'],['wafer','晶圓'],['verified','品質'],['frame_inspect','檢測'],['schedule','時間'],['calendar_month','排程'],['payments','成本'],['savings','節省'],
   ['warning','風險'],['error','異常'],['task_alt','完成'],['flag','里程碑'],['target','目標'],['trending_up','成長'],['analytics','分析'],['lightbulb','想法'],['rocket_launch','啟動'],['handshake','合作'],['mail','聯絡'],['search','調查']].filter(([id])=>ICONS.BY[id]);
  const NC=12,cw=CW/NC,s=.42;L.forEach(([id,zh],i)=>{const c=i%NC,r=Math.floor(i/NC),cx0=X0+(c+.5)*cw,yy=Y0+r*.82;grp(zh,()=>icon(id,cx0-s/2,yy,s));txt(cx0-cw/2,yy+s+.04,cw,.24,zh,{size:10,color:G.t2,align:'center',name:'圖說'});});
  ln(X0,3.62,X1,3.62,{c:G.l2,w:.5});const C=GRID(3,2,3.76,Y1,{gy:.08,cap:.28});
  comp('A','直式（圖示在上）','Stacked',C[0],(x,y,w,h)=>{[['verified','品質'],['speed','效率'],['savings','成本']].forEach(([id,t],i)=>{const cx0=x+w*(i+.5)/3;icon(id,cx0-.25,y+.06,.5,{variant:'tint'});T(cx0-.6,y+.62,1.2,.3,t,{size:Z(12),bold:1,color:G.ink,align:'center',name:'文字'});});});
  comp('B','橫式（圖示在左）','Inline',C[1],(x,y,w,h)=>{icon('precision_manufacturing',x,y+.18,.6,{variant:'solid'});T(x+.76,y+.12,w-.8,.34,'設備保養',{size:Z(13),bold:1,color:G.ink,name:'標題'});T(x+.76,y+.46,w-.8,.3,'每月 PM 排程，停機 −20%',{size:11,name:'說明'});});
  comp('C','圓底＋數字','Circle + number',C[2],(x,y,w,h)=>{icon('trending_up',x,y+.14,.66,{variant:'tint'});txt(x+.8,y+.06,w-.8,.5,[{t:'+18',b:1,c:P,f:nf},{t:' %',s:Z(12),c:G.mute,f:nf}],{size:Z(24),valign:'middle',name:'數值'});T(x+.8,y+.56,w-.8,.3,'年營收成長',{size:11,name:'說明'});});
  comp('D','方底＋標籤','Square tile',C[3],(x,y,w,h)=>{[['groups','團隊'],['schedule','時程'],['warning','風險'],['task_alt','完成']].forEach(([id,t],i)=>{const xx=x+i*(w/4);box(xx,y+.06,.56,.56,{fill:i===2?AL:TN(P,.88),r:.1,name:'方底'});icon(id,xx+.1,y+.16,.36,{color:i===2?W2:P});T(xx-.1,y+.66,.76,.26,t,{size:10,color:G.t2,align:'center',name:'文字'});});});
  comp('E','清單（圖示項目符號）','Icon bullets',C[4],(x,y,w,h)=>{[['task_alt','SOP 已更新'],['task_alt','人員訓練完成'],['pending','B 線評估中']].forEach(([id,t],i)=>{const yy=y+.02+i*.3;icon(ICONS.BY[id]?id:'schedule',x,yy,.26,{color:i<2?GOOD:G.mute});T(x+.36,yy-.02,w-.36,.3,t,{size:11,color:G.ink,name:'項目'});});});
  comp('F','圖示流程','Icon flow',C[5],(x,y,w,h)=>{const d=.5,sp=(w-d)/2;const B=[['wafer','投片'],['frame_inspect','檢測'],['build','改善']].map(([id,t],i)=>{const xi=x+i*sp;const r=icon(id,xi,y+.04,d,{variant:i===2?'solid':'tint'});T(xi-.3,y+.6,d+.6,.26,t,{size:10.5,color:G.t2,align:'center',name:'圖說'});return r.bg;});link(B[0],6,B[1],2);link(B[1],6,B[2],2);});};
 /* A13 Icon 元件：九款完整底座與文字。沿用 Material Symbols 原生 custGeom，圖示可直接替換。 */
 SL.iconcomponents=()=>{title('Icon 元件 Icon Components','挑底座、換圖示、整組下載。圖示、文字與底座都是可編輯圖形');
  const {comp,T,GRID,W2}=UK(),C=GRID(3,3,Y0,6.72,{gx:.36,gy:.2,cap:.28});
  const rad=st.r>0?Math.max(.06,Math.min(st.r,.14)):0,tint=mix(P,W2,.89);
  const glyph=(id,x,y,d,c)=>icon(id,x,y,d,{variant:'line',color:c||P});
  const label=(x,y,w,t)=>T(x,y,w,.29,t,{size:11.5,bold:1,color:G.ink,align:'center',wrap:0,name:'標籤文字'});
  comp('A','圓角方塊＋文字','',C[0],(x,y,w,h)=>{
   [['groups','團隊'],['schedule','時程'],['warning','風險'],['task_alt','完成']].forEach(([id,t],i)=>{const cx=x+(i+.5)*w/4,yy=y+.03,c=i===2?AL:P;
    box(cx-.3,yy,.6,.6,{fill:i===2?AL:tint,r:Math.max(.09,rad),name:'圖示底座'});glyph(id,cx-.2,yy+.1,.4,i===2?W2:c);label(cx-w/8,yy+.69,w/4,t);});
  });
  comp('B','圓形徽章','',C[1],(x,y,w,h)=>{
   [['verified','品質'],['speed','效率'],['savings','成本']].forEach(([id,t],i)=>{const cx=x+(i+.5)*w/3;circ(cx,y+.35,.64,{fill:i===0?P:tint,name:'圓形底座'});glyph(id,cx-.21,y+.14,.42,i===0?W2:P);label(cx-w/6,y+.75,w/3,t);});
  });
  comp('C','外框圖示卡','',C[2],(x,y,w,h)=>{
   box(x,y+.04,w,1.0,{fill:W2,line:P,lw:Math.max(.75,st.cardLW),r:rad,name:'外框底座'});glyph('target',x+.18,y+.25,.52);
   T(x+.88,y+.18,w-1.06,.32,'聚焦目標',{size:15,bold:1,color:P,name:'標題'});T(x+.88,y+.57,w-1.06,.28,'一張卡只放一個重點',{size:11,name:'說明'});
  });
  comp('D','橫向膠囊','',C[3],(x,y,w,h)=>{
   box(x,y+.25,w,.62,{fill:tint,r:'full',name:'膠囊底座'});circ(x+.34,y+.56,.46,{fill:P,name:'圓形底座'});glyph('handshake',x+.18,y+.4,.32,W2);
   T(x+.74,y+.39,w-.96,.34,'跨部門協作',{size:15,bold:1,color:P,wrap:0,name:'標籤文字'});
  });
  comp('E','圖示＋標題＋說明','',C[4],(x,y,w,h)=>{
   box(x,y+.04,w,1.0,{fill:W2,line:G.l2,lw:1,r:rad,sh:'card',name:'資訊卡底座'});box(x+.14,y+.22,.62,.62,{fill:tint,r:rad||.06,name:'圖示底座'});glyph('lightbulb',x+.24,y+.32,.42);
   T(x+.94,y+.17,w-1.1,.32,'改善提案',{size:15,bold:1,color:G.ink,name:'標題'});T(x+.94,y+.57,w-1.1,.28,'把想法寫成可執行的一步',{size:11,name:'說明'});
  });
  comp('F','圖示 KPI 卡','',C[5],(x,y,w,h)=>{
   box(x,y+.04,w,1.0,{fill:tint,r:rad,name:'指標卡底座'});glyph('analytics',x+.18,y+.28,.52);
   txt(x+.88,y+.12,w-1.04,.5,[{t:'98.6',s:26,b:1,c:P,f:nf},{t:' %',s:12,c:P,f:nf}],{name:'數值'});
   T(x+.9,y+.67,w-1.08,.24,'良率（示例數值）',{size:11,color:G.t2,name:'指標名稱'});
  });
  comp('G','圖示步驟列','',C[6],(x,y,w,h)=>{
   const nodes=[['search','釐清'],['build','執行'],['task_alt','完成']].map(([id,t],i)=>{const cx=x+(i+.5)*w/3;
    const b=circ(cx,y+.35,.58,{fill:i===2?P:tint,name:'步驟底座'});glyph(id,cx-.19,y+.16,.38,i===2?W2:P);label(cx-w/6,y+.73,w/3,t);return b;});
   link(nodes[0],6,nodes[1],2,{style:{c:G.line,w:1,head:'triangle',tail:false,dash:'solid'}});link(nodes[1],6,nodes[2],2,{style:{c:G.line,w:1,head:'triangle',tail:false,dash:'solid'}});
  });
  comp('H','里程碑時間軸','',C[7],(x,y,w,h)=>{
   ln(x+.12,y+.76,x+w-.12,y+.76,{c:G.l2,w:1.25});circ(x+.43,y+.76,.12,{fill:P,name:'里程碑節點'});glyph('flag',x+.15,y+.03,.56);
   T(x+.88,y+.04,w-1.0,.3,'Q3 里程碑',{size:11,color:P,bold:1,name:'日期'});T(x+.88,y+.4,w-1.0,.3,'試產驗證完成',{size:14,color:G.ink,bold:1,name:'里程碑'});
  });
  comp('I','警示與狀態卡','',C[8],(x,y,w,h)=>{
   box(x,y+.04,w,1.0,{fill:ALt,r:rad,name:'狀態卡底座'});box(x,y+.04,.06,1.0,{fill:AL,name:'警示色條'});glyph('warning',x+.2,y+.28,.52,ALd);
   T(x+.9,y+.18,w-1.08,.32,'風險待確認',{size:15,bold:1,color:ALd,name:'狀態標題'});T(x+.9,y+.57,w-1.08,.28,'負責人・下一步・截止日',{size:11,color:G.ink,name:'說明'});
  });
 };

 /* A15–A18: approved four-sheet catalogue geometry/type/radius, with colors
    linked to existing theme roles; decorative bars never use warning semantics.
    Geometry is transcribed from 方案元件-四頁分類.pptx (Library source SHA256
    5fd6377ccfc1c67f1bdb5e75a495d16b6e84d70ad31d1ec9a7e96708c3514067).
    Every half is an independent native group; title/body stay separate text boxes. */
 function schemeCatalogue(page){
  const body=page%2===1,withIcon=page>=2,roles=Object.fromEntries(['main','deep','light'].map(r=>[r,tableHighlightPreset('v4-role-'+r,st)])),ink=roles.main.fill,muted=ensureContrast(G.t2,'FFFFFF',4.5),caption=ensureContrast(G.mute,'FFFFFF',4.5),rule='D5DDE2',font='Microsoft JhengHei',hw=5.8465,hh=.65;
  // 03E is the source's medium-tone decorative band, not a warning. Reuse
  // the P-hue medium tone, locally separating it from the P title block.
  // Keep v3/table/warning behavior unchanged, including for custom palettes.
  let medium=tableHighlightPreset('v3-theme-deep',st).fill;
  if(contrastOf(medium,ink)<1.5){const seed=medium;outer:for(const target of ['FFFFFF','000000'])for(let n=1;n<=100;n++){const c=mix(seed,target,n/100);if(contrastOf(c,ink)>=1.5){medium=c;break outer;}}}
  const mediumBand=tableHighlightPreset('v4-role-main',Object.assign({},st,{P:medium}));
  cur.w=W;cur.h=17.5;cur.schemeCatalogue=true;
  const text=(x,y,w,h,t,size,color,bold,align)=>txt(x,y,w,h,t,{size,color,bold:!!bold,font,align:align||'left',margin:0,valign:'middle',name:t,wrap:1});
  text(.6,.38,12,.6,SCHEME_CATALOGUE_TITLES[page],28,ensureContrast(ink,'FFFFFF',4.5),true);
  text(.6,1.04,12,.29,'14 種樣式 · 左右對稱 · 方案 A／方案 B',13,caption,false);
  SCHEME_CATALOGUE_STYLES.forEach(([id,name,tx,tw0],row)=>{
   const y=1.75+row*1.08;text(.6,y-.3,12,.23,id+'  '+name,12,caption,false);
   ['A','B'].forEach((side,col)=>{const x=.6+col*(hw+.44),dark=id==='03C'||id==='03E',band=id==='03C'?roles.main:mediumBand,badge=id==='03C'?roles.deep:roles.main,background=id==='03A'?roles.light.fill:id==='03'?'F1F4F6':id==='03F'?'F1F3F5':'FFFFFF',fg=dark?badge.color:ensureContrast(ink,background,4.5);
    grp(id+' '+name+'・方案 '+side,()=>{
     const rect=(dx,dy,w,h,fill,line,lw,r)=>box(x+dx,y+dy,w,h,{fill,line,lw,r:r||0,name:name+'底座'});
     const line=(x1,y1,x2,y2,c,lw)=>ln(x+x1,y+y1,x+x2,y+y2,{c,w:lw});
     const bottom=(c,lw)=>line(0,hh,hw,hh,c,lw);
     let titleX=tx,titleW=tw0,align='left',glyphX=tx;
     switch(id){
      case '01':bottom(rule,.8);line(0,hh,1.1,hh,ink,1.8);break;
      case '02':rect(0,.13,.045,.34,ink);bottom(rule,.8);break;
      case '03':rect(0,0,hw,hh,'F1F4F6');break;
      case '04':bottom(ink,.9);line(0,.42,0,hh,ink,.9);line(hw,.42,hw,hh,ink,.9);break;
      case '05':{const d=body?0:(hw-2.1)/2;line(0,hh,.35+d,hh,rule,1);line(1.75+d,hh,hw,hh,rule,1);align='center';titleX=.35+d;glyphX=.45+d;if(withIcon){titleX=.85+d;titleW=.8;}break;}
      case '07':line(0,0,hw,0,ink,1.8);break;
      case '08':rect(0,0,hw,hh,null,ink,.9);break;
      case '09':bottom(rule,.8);rect(0,.08,.46,.46,null,ink,1);if(!withIcon)text(x,y+.08,.46,.46,side,17,fg,true,'center');break;
      case '03A':rect(0,0,hw,hh,roles.light.fill,null,0,.04);break;
      case '03B':{const b=rect(0,0,hw,hh,'FFFFFF','D9E0E5',.6,.04);b.sh={blur:3,dist:1,dir:90,alpha:.15,scale:1,color:'000000',kind:'drop'};break;}
      case '03C':case '03E':{rect(0,0,hw,hh,body?band.fill:badge.fill,null,0,.04);if(body)rect(.025,.025,2.075,.6,badge.fill);break;}
      case '03D':rect(0,0,hw,hh,'FFFFFF',ink,1.5,.04);rect(.14,.15,.045,.34,ink);break;
      case '03F':rect(0,0,hw,hh,'F1F3F5',null,0,.04);rect(0,.07,.065,.51,ink);break;
     }
     if(withIcon){
      // Original editable briefcase: two outline rectangles + two straight lines.
      // It is not a replacement Material glyph, SVG image, or raster picture.
      if(id==='09'){rect(.077,.225,.2975,.2125,null,fg,1);rect(.1535,.157,.136,.068,null,fg,1);line(.077,.3015,.3745,.3015,fg,1);line(.22575,.293,.22575,.344,fg,1);}
      else{rect(glyphX+.014,.25,.245,.175,null,fg,1);rect(glyphX+.077,.194,.112,.056,null,fg,1);line(glyphX+.014,.313,glyphX+.259,.313,fg,1);line(glyphX+.1365,.306,glyphX+.1365,.348,fg,1);if(id!=='05'){titleX+=.4;titleW-=.4;}}
     }
     text(x+titleX,y+.08,titleW,.46,'方案 '+side,18,fg,true,align);
     if(body)text(x+2.28,y+.115,3.4065,.46,side==='A'?'分批交付，逐階確認。':'集中交付，一次驗收。',18,dark?band.color:ensureContrast(muted,background,4.5),false);
    },{x,y,w:hw,h:hh,schemeStyle:id,schemeSide:side,schemeBody:body,schemeIcon:withIcon});
   });
  });
 }
 SCHEME_CATALOGUE_KEYS.forEach((key,page)=>{SL[key]=()=>schemeCatalogue(page);});

 /* A14 底座變體：六種狀態 × 四種外觀；每個獨立群組都能換底座、外觀、狀態與圖示。 */
 SL.iconvariants=()=>{title('Icon 底座變體 Icon Variants','24 款起點，4 種底座 × 4 種外觀 × 6 種狀態自由搭配');
  const left=1.85,cw=(X1-left)/6,top=2.15,step=1.12,d=.6;
  ICON_STATES.forEach((s,c)=>txt(left+c*cw,1.8,cw,.26,s[1],{size:12,bold:1,color:G.ink,align:'center',name:'欄標題'}));
  ICON_LOOKS.forEach((look,r)=>{const y=top+r*step;txt(X0,y+.1,1.12,.3,look[1],{size:12,bold:1,color:G.ink,name:'外觀名稱'});txt(X0,y+.44,1.12,.24,['透明無底色','柔和背景','高對比圖示','底色與邊框'][r],{size:10,color:G.t2,name:'外觀說明'});
   ICON_STATES.forEach((state,c)=>{const cx=left+(c+.5)*cw,style={base:ICON_BASES[(r+c)%ICON_BASES.length][0],look:look[0],state:state[0]},name=look[1]+'・'+state[1];
    grp(name,()=>{const b=box(cx-d/2,y,d,d,{r:.1,line:P,name:'可調圖示底座'});b.iconBase={cx,cy:y+d/2,d};icon(state[3],cx-.2,y+.1,.4,{variant:'line',color:P});const t=txt(cx-cw/2+.06,y+.69,cw-.12,.28,state[1],{size:11.5,color:P,bold:1,align:'center',name:'狀態名稱'});t.iconStateLabel=true;},{iconStyle:style,iconBrand:P});
    applyIconComponentStyle(cur,cur.groups[cur.groups.length-1],style);
   });
  });
 };

 /* B1 流程圖符號 */
 SL.flow=()=>{title('流程圖符號 Flowchart Symbols','11 個標準符號（含子流程、人工作業、延遲、連接點、多文件）＋基本流程＋泳道版：全部可選、黏著連接線');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const L=symLook(false),fs=Z(11);const base=o=>Object.assign({fill:L.fill,line:L.line||G.line,lw:L.lw||1,size:fs,bold:0,color:L.c},o||{});
  const S=[['term','開始／結束','Terminator',(x,y,w,h)=>sym('term',x,y,w,h,'開始',{strong:1,size:fs})],['proc','處理','Process',(x,y,w,h)=>sym('proc',x,y,w,h,'處理',{size:fs})],['dec','判斷','Decision',(x,y,w,h)=>sym('dec',x,y-.06,w,h+.12,'判斷',{alt:1,size:fs})],
   ['io','輸入／輸出','I / O',(x,y,w,h)=>sym('io',x,y,w,h,'輸入',{size:fs})],['doc','文件','Document',(x,y,w,h)=>sym('doc',x,y,w,h,'文件',{size:fs})],['db','資料庫','Database',(x,y,w,h)=>sym('db',x+.12,y-.04,w-.24,h+.08,'DB',{size:fs})],
   ['sub','子流程','Subprocess',(x,y,w,h)=>{box(x,y,w,h,base({text:'子流程',name:'子流程'}));ln(x+.1,y,x+.1,y+h,{c:L.line||G.line,w:L.lw||1});ln(x+w-.1,y,x+w-.1,y+h,{c:L.line||G.line,w:L.lw||1});}],
   ['man','人工作業','Manual op.',(x,y,w,h)=>path([[x,y],[x+w,y],[x+w-.14,y+h],[x+.14,y+h]],Object.assign(base({text:'人工',name:'人工作業'}),{close:true}))],
   ['dly','延遲','Delay',(x,y,w,h)=>{const r=h/2;el('custGeom',x,y,w,h,base({text:'等待',name:'延遲',points:[{x:0,y:0},{x:w-r,y:0},{x:w-r,y:h,curve:{type:'arc',hR:r,wR:r,stAng:270,swAng:180}},{x:0,y:h},{close:true}]}));}],
   ['cnt','連接點','Connector',(x,y,w,h)=>circ(x+w/2,y+h/2,h,base({text:'A',bold:1,margin:0,name:'連接點'}))],
   ['mdoc','多文件','Multi-doc',(x,y,w,h)=>{[2,1,0].forEach(k=>sym('doc',x+k*.06,y-k*.06+.08,w-.14,h-.06,k?'':'多份',{size:fs}));}]];
  const cw=CW/11;S.forEach(([k,zh,en,fn],i)=>{const cx0=X0+cw*i+cw/2,w=cw-.2,h=.56;grp(zh,()=>{fn(cx0-w/2,2.08,w,h);T(cx0-cw/2,2.82,cw,.26,zh,{size:10.5,bold:1,color:G.ink,align:'center',wrap:0,name:'符號名'});T(cx0-cw/2,3.06,cw,.24,en,{size:10,color:G.mute,align:'center',font:nf,wrap:0,name:'英文'});});});
  T(X0,1.84,CW,.2,'',{name:'空白'});ln(X0,3.48,X1,3.48,{c:G.l2,w:.5});
  const C1={x:X0,y:3.7,w:7.3,h:2.78},C2={x:X0+7.6,y:3.7,w:CW-7.6,h:2.78};
  comp('L','基本流程範例','Basic flow',C1,(x,y,w,h)=>{const cy=y+.8,ws=[.9,1.15,1.2,1.05,1.0,.9],g=(w-ws.reduce((a,b)=>a+b))/5,xs=[];let xx=x;ws.forEach(v=>{xs.push(xx);xx+=v+g;});
   const N=[sym('term',xs[0],cy-.25,ws[0],.5,'開始',{strong:1,size:fs}),sym('io',xs[1],cy-.28,ws[1],.56,'輸入需求',{size:fs}),sym('dec',xs[2],cy-.42,ws[2],.84,'可行？',{alt:1,size:fs}),sym('proc',xs[3],cy-.28,ws[3],.56,'執行',{size:fs}),sym('doc',xs[4],cy-.32,ws[4],.64,'報告',{size:fs}),sym('term',xs[5],cy-.25,ws[5],.5,'結束',{strong:1,size:fs})];
   link(N[0],3,N[1],5);link(N[1],2,N[2],1);link(N[2],3,N[3],1);link(N[3],3,N[4],1);link(N[4],3,N[5],1);T(xs[2]+ws[2],cy-.36,g,.24,'是',{size:10,bold:1,color:G.t2,align:'center',name:'標註'});
   const dx=xs[2]+ws[2]/2,ix=xs[1]+ws[1]/2;link(N[2],2,N[1],4,{via:[[dx,cy+.82],[ix,cy+.82]]});T(dx+.08,cy+.46,.4,.24,'否',{size:10,bold:1,color:G.t2,name:'標註'});
   const db=sym('db',xs[3]+ws[3]/2-.42,y+1.85,.84,.72,'資料庫',{size:fs});link(N[3],2,db,0,{style:{tail:'triangle',dash:'sysDash'}});});
  comp('M','泳道符號版','Swimlane',C2,(x,y,w,h)=>{const lh=1.28,hw=.5;[['申請','Req'],['審核','Rev']].forEach(([t,e],i)=>{const ly=y+i*(lh+.06);box(x,ly,w,lh,{fill:W2,line:G.l2,lw:.75,name:'泳道'});box(x,ly,hw,lh,{fill:'F2F2F2',text:t.split('').join('\n'),size:10.5,bold:1,color:G.t2,margin:0,lsp:.95,name:'泳道標題'});});
   const a=sym('term',x+hw+.2,y+.38,.95,.48,'提出',{strong:1,size:fs}),b=sym('dec',x+hw+1.45,y+lh+.06+.3,1.1,.7,'核准？',{alt:1,size:fs}),c=sym('doc',x+w-1.1,y+.34,.95,.58,'歸檔',{size:fs});
   link(a,2,b,1,{mid:0});link(b,3,c,2);T(x+w-1.25,y+lh+.5,.4,.24,'是',{size:10,bold:1,color:G.t2,name:'標註'});});
  comp('N','跨部門泳道（3 道・橫向）','Cross-functional lanes',{x:X0,y:1.9,w:CW,h:1.5},(x,y,w,h)=>{const lh=.48,hw=1.0,L=['申請人','主管','工程'];L.forEach((t,i)=>{const ly=y+i*lh;box(x,ly,w,lh,{fill:i%2?'FAFAFA':W2,line:G.l2,lw:.75,name:'泳道'});box(x,ly,hw,lh,{fill:'F2F2F2',line:G.l2,lw:.75,text:t,size:10.5,bold:1,color:G.t2,margin:0,name:'泳道標題'});});
   const sx=x+hw+.35,st2=(w-hw-.7-1.1)/4,bw=1.1,bh=.34;const P5=[[0,'提出需求','term'],[1,'審核','dec'],[2,'評估工時','proc'],[1,'核准排程','proc'],[0,'收到通知','doc']];const N=P5.map(([l,t,k],i)=>sym(k,sx+i*st2,y+l*lh+(lh-bh)/2-(k==='dec'?.04:0),bw,bh+(k==='dec'?.08:0),t,{size:10,strong:i===0}));
   for(let i=0;i<4;i++){const a1=P5[i][0],b1=P5[i+1][0];link(N[i],a1===b1?3:(b1>a1?2:0),N[i+1],a1===b1?1:(b1>a1?1:1));}});};
 /* B3·2 編號步驟 */
 SL.steps=()=>{const n=NUM('nLin',4,3);title('編號步驟 Numbered Steps','大編號、垂直步驟、大數字直式、圓形鏈、時間軸、V 形階段：數量 3–6：選取後在工具列切換 3／4／5／6');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,2,Y0,Y1);const ST=[['釐清目的','Purpose'],['蒐集事實','Facts'],['分析根因','Analyze'],['導入對策','Act'],['標準化','Codify'],['擴散','Scale']].slice(0,n);
  comp('A',`大編號步驟（${n}）`,'Big-number steps',C[0],(x,y,w,h)=>{const cw=w/n;ST.forEach(([t,e],i)=>{const xx=x+i*cw;txt(xx,y,cw,.6,two(i+1),{size:Z(n>4?24:30),bold:1,color:i===0?P:G.l1,font:nf,valign:'middle',name:'大編號'});box(xx,y+.66,cw-.16,.04,{fill:i===0?P:G.l2,name:'色條'});
   T(xx,y+.78,cw-.06,.3,t,{size:Z(n>5?9.5:n>4?10.5:12),bold:1,color:G.ink,wrap:0,name:'步驟'});T(xx,y+1.08,cw-.06,.26,e,{size:n>4?9:10,color:G.mute,font:nf,wrap:0,name:'英文'});});},{count:'nLin'});
  comp('B',`垂直步驟（${n}）`,'Vertical steps',C[1],(x,y,w,h)=>{const rh=h/n;ln(x+.18,y+.18,x+.18,y+h-rh/2,{c:G.l2,w:1.25});ST.forEach(([t,e],i)=>{const yy=y+i*rh;bdg(x+.18,yy+.18,.32,String(i+1),i===0?P:DARK,{size:10});T(x+.46,yy,w-.46,.34,[{t,b:1,c:G.ink},{t:'  '+e,s:10,c:G.mute,f:nf}],{size:Z(11.5),wrap:0,name:'步驟'});});},{count:'nLin'});
  comp('C',`大數字直式步驟（${n}）`,'Big-number vertical',C[2],(x,y,w,h)=>{const rh=h/n;ST.forEach(([t,e],i)=>{const yy=y+i*rh;txt(x,yy,.7,rh,two(i+1),{size:Z(n>4?16:20),bold:1,color:i===n-1?P:G.l1,font:nf,valign:'middle',name:'大編號'});ln(x+.74,yy+rh*.2,x+.74,yy+rh*.8,{c:G.l2,w:1});
   T(x+.86,yy,w-.86,rh,[{t,b:1,c:i===n-1?P:G.ink},{t:'  '+e,s:10,c:G.mute,f:nf}],{size:Z(11.5),wrap:0,name:'步驟'});});},{count:'nLin'});
  comp('D',`圓形鏈（${n}）`,'Circle chain',C[3],(x,y,w,h)=>{const d=Math.min(.7,(w-(n-1)*.2)/n),sp=(w-d)/(n-1);const cs=ST.map(([t],i)=>circ(x+d/2+i*sp,y+.5,d,{fill:i===n-1?P:W2,line:i===n-1?null:G.l1,lw:1.25,text:two(i+1),size:Z(13),bold:1,color:i===n-1?W2:G.t2,font:nf,margin:0,name:'圓形'}));
   for(let i=0;i<n-1;i++)link(cs[i],6,cs[i+1],2);ST.forEach(([t],i)=>T(x+d/2+i*sp-sp/2,y+.94,sp,.3,t,{size:10,color:G.ink,align:'center',wrap:0,name:'步驟'}));},{count:'nLin'});
  comp('E',`時間軸（${n} 點）`,'Timeline',C[4],(x,y,w,h)=>{const sp=(w-.3)/(n-1||1),ay=y+.62;ln(x,ay,x+w,ay,{c:G.line,w:1.25,head:'triangle'});ST.forEach(([t],i)=>{const cx0=x+.1+i*sp;circ(cx0,ay,.18,{fill:i<2?DARK:i===2?P:W2,line:i>2?G.l1:W2,lw:1.25,name:'時間點'});
   pill(cx0-.36,ay-.5,.72,.26,'M'+(i+1),i===2?P:'E6E6E6',{font:nf,size:10,color:i===2?W2:G.t2});T(cx0-sp/2,ay+.18,sp,.28,t,{size:10,color:G.ink,align:'center',wrap:0,name:'里程碑'});});},{count:'nLin'});
  comp('F',`V 形階段（${n}）`,'Phase chevrons',C[5],(x,y,w,h)=>{const pw=(w+(n-1)*.07)/n;ST.forEach(([t],i)=>{const f=i===1?P:i<1?DARK:'E6E6E6';el(i===0?'homePlate':'chevron',x+i*(pw-.07),y+.3,pw,.5,{fill:f,adj:.16,text:t,size:Z(n>4?10:11),bold:1,color:lum(f)>.55?G.ink:W2,margin:0,name:'階段'});});
   T(x,y+.96,w,.3,'深＝完成、主色＝進行中、灰＝未開始',{size:10,color:G.mute,name:'說明'});},{count:'nLin'});};
 /* B4 結構元件 */
 SL.struct=()=>{title('結構元件 Structure','樹狀分支、金字塔、漏斗、層級堆疊、寬欄透明條、階層樹：層數與文字可改');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,2,Y0,Y1);const nd=(x,y,w,t,o)=>sym('proc',x,y,w,.4,t,Object.assign({size:Z(11)},o||{}));
  comp('A','樹狀分支','Tree',C[0],(x,y,w,h)=>{const cy=y+h/2,a=nd(x,cy-.2,.8,'起點');const ys=[y+.1,cy-.2,y+h-.5];const b=ys.map((yy,i)=>nd(x+1.3,yy,.9,'分支'+'一二三'[i]));const c=ys.map((yy,i)=>nd(x+w-1.0,yy,1.0,'結果 '+'ABC'[i],{strong:i===1}));
   b.forEach((bb,i)=>{link(a,3,bb,1,{mid:x+1.05});link(bb,3,c[i],1);});});
  comp('B','金字塔 4 層','Pyramid',C[1],(x,y,w,h)=>{const n=4,lh=(h-.1)/n,pw=2.3;['願景','策略','計畫','行動'].forEach((t,i)=>{const t0=pw*i/n,t1=pw*(i+1)/n,yy=y+i*lh,cx0=x+pw/2;const f=mix(P,'FFFFFF',i*.22);
   path([[cx0-t0/2,yy],[cx0+t0/2,yy],[cx0+t1/2,yy+lh-.04],[cx0-t1/2,yy+lh-.04]],{close:true,fill:f,name:'金字塔層'});T(x+pw+.16,yy,w-pw-.16,lh,[{t,b:1,c:G.ink},{t:'  '+['Vision','Strategy','Plan','Action'][i],s:10,c:G.mute,f:nf}],{size:Z(11.5),name:'層名'});ln(cx0+t1/2-.1,yy+lh/2,x+pw+.12,yy+lh/2,{c:'A6A6A6',w:.75,name:'引線'});});});
  comp('C','漏斗＋轉換率','Funnel',C[2],(x,y,w,h)=>{const n=4,lh=(h-.1)/n,fw=2.5;[['潛在客戶','1,200'],['需求確認','480'],['報價','160'],['成交','52']].forEach(([t,v],i)=>{const w0=fw*(1-i*.2),w1=fw*(1-(i+1)*.2),yy=y+i*lh,cx0=x+fw/2;
   path([[cx0-w0/2,yy],[cx0+w0/2,yy],[cx0+w1/2,yy+lh-.04],[cx0-w1/2,yy+lh-.04]],{close:true,fill:i===n-1?P:mix(G.l2,'FFFFFF',i*.1),name:'漏斗層'});T(cx0-.6,yy,1.2,lh-.04,v,{size:Z(11),bold:1,color:i===n-1?W2:G.ink,align:'center',font:nf,name:'數值'});
   ln(cx0+w1/2,yy+lh/2,x+fw+.12,yy+lh/2,{c:'A6A6A6',w:.75,name:'引線'});T(x+fw+.16,yy,w-fw-.7,lh,t,{size:10.5,color:G.t2,name:'層名'});if(i)T(x+w-.55,yy,.55,lh,Math.round(100*[1200,480,160,52][i]/[1200,480,160,52][i-1])+'%',{size:10.5,bold:1,color:G.ink,font:nf,align:'right',wrap:0,name:'轉換率'});});});
  comp('D','層級堆疊','Layer stack',C[3],(x,y,w,h)=>{[['應用層','Apps',W2],['平台層','Platform',TN(P,.85)],['基礎設施','Infra',P]].forEach(([t,e,f],i)=>{const yy=y+.06+i*.58;box(x+i*.18,yy,w-i*.36,.48,{fill:f,line:f===W2?G.l1:null,lw:1,r:.06,text:[{t,b:1},{t:'  '+e,s:10,b:0,f:nf}],size:Z(12),color:f===P?W2:G.ink,name:'層'});});});
  comp('E','寬欄透明條','Columns',C[4],(x,y,w,h)=>{const b1=x+1.2,b2=x+2.1,bw=.62;T(b1-.2,y,bw+.4,.26,'吸收',{size:10.5,bold:1,color:G.t2,align:'center',name:'欄名'});T(b2-.2,y,bw+.4,.26,'產出',{size:10.5,bold:1,color:G.t2,align:'center',name:'欄名'});colBar(b1,y+.3,bw,h-.34);colBar(b2,y+.3,bw,h-.34);
   [['階段一','看','練'],['階段二','問','談'],['階段三','想','寫']].forEach(([l,a,b],i)=>{const yy=y+.62+i*.46;T(x,yy-.15,1.0,.3,l,{size:10.5,name:'階段'});badge(b1+bw/2,yy,a,{d:.36,size:12,nodot:1});badge(b2+bw/2,yy,b,{d:.36,size:12,nodot:1});});});
  comp('F','階層樹 1→3','Top-down tree',C[5],(x,y,w,h)=>{const top=nd(x+w/2-.6,y+.05,1.2,'專案經理',{strong:1});const cw=(w-.3)/3;const ch=['製程','品保','設備'].map((t,i)=>nd(x+i*(cw+.15),y+.9,cw,t));ch.forEach(c=>link(top,2,c,0,{mid:y+.68}));
   ['3 人','2 人','4 人'].forEach((t,i)=>T(x+i*(cw+.15),y+1.36,cw,.26,t,{size:10,color:G.mute,align:'center',name:'說明'}));});};
 /* B5 議程與章節 */
 SL.agenda=()=>{title('議程與章節 Agenda & Sections','議程清單、側欄目錄、議程進度條、章節分隔（大編號＋本節重點）、頁首章節標籤、麵包屑：目前章節高亮');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,2,Y0,Y1);const AG=[['背景','Background'],['現況分析','Status'],['對策','Actions'],['時程','Timeline'],['結論','Summary']];
  comp('A','議程清單','Agenda list',C[0],(x,y,w,h)=>{const rh=(h-.04)/5;AG.forEach(([t,e],i)=>{const yy=y+i*rh,now=i===1;if(now){box(x,yy+.02,w,rh-.04,{fill:TN(P,.88),r:.04,name:'目前章節底'});box(x,yy+.02,.042,rh-.04,{fill:P,r:0,name:'目前色條 3pt'});}bdg(x+rh/2,yy+rh/2,.3,two(i+1),now?P:i<1?DARK:'E3E3E3',{color:now||i<1?W2:G.t2,size:10});
   T(x+.5,yy,w-.6,rh,[{t,b:1},{t:'  '+e,s:10,b:0,c:G.mute,f:nf}],{size:Z(11.5),color:now?P:G.ink,wrap:0,name:'議程項目'});});});
  comp('B','側欄目錄','Side TOC',C[1],(x,y,w,h)=>{box(x,y,1.5,h,{fill:'F7F7F7',r:.06,name:'側欄底'});AG.forEach(([t],i)=>{const yy=y+.12+i*.34,now=i===1;if(now)box(x,yy,.06,.28,{fill:P,name:'目前標記'});T(x+.18,yy,1.3,.28,t,{size:10.5,bold:now,color:now?P:G.t2,wrap:0,name:'目錄項'});});
   T(x+1.7,y+.04,w-1.7,.3,'現況分析',{size:Z(14),bold:1,color:G.ink,name:'本頁標題'});T(x+1.7,y+.42,w-1.7,.9,'側欄常駐在每頁左側，\n讀者隨時知道位置。',{size:10.5,valign:'top',name:'說明'});});
  comp('C','議程進度條','Agenda progress',C[2],(x,y,w,h)=>{const sw=w/5;AG.forEach(([t],i)=>{const f=i<1?DARK:i===1?P:'E6E6E6';box(x+i*sw+.02,y+.3,sw-.04,.12,{fill:f,r:'full',name:'進度段'});T(x+i*sw,y+.48,sw,.28,t,{size:10,color:i===1?P:G.t2,bold:i===1,align:'center',wrap:0,name:'章節'});});
   pill(x+sw*1.5-.45,y-.04,.9,.26,'目前',P,{size:10});T(x,y+.9,w,.5,'放在頁首或頁尾一列，不佔版面\n整頁章節頁 → F4／F5／F6',{size:10,color:G.t2,valign:'top',name:'說明'});});
  comp('D','章節分隔（大編號）','Section divider',C[3],(x,y,w,h)=>{txt(x,y,1.2,1.0,'02',{size:Z(54),bold:1,color:P,font:nf,valign:'middle',name:'章節編號'});ln(x+1.3,y+.16,x+1.3,y+.9,{c:G.l2,w:1});
   T(x+1.46,y+.06,w-1.46,.4,'現況分析',{size:Z(20),bold:1,color:G.ink,name:'章節名'});T(x+1.46,y+.5,w-1.46,.3,'Current status',{size:11,color:G.mute,font:nf,name:'英文'});
   ln(x,y+1.06,x+w,y+1.06,{c:G.l2,w:.75});['良率三週回升','CMP 為主因','C 線待擴'].forEach((t,i)=>{const xx=x+i*w/3;bdg(xx+.14,y+1.36,.26,String(i+1),DARK,{size:10});T(xx+.32,y+1.22,w/3-.34,.28,t,{size:10.5,color:G.ink,wrap:0,name:'本節重點'});});});
  comp('E','頁首章節標籤＋麵包屑','Section tag',C[4],(x,y,w,h)=>{box(x,y+.06,1.9,.32,{fill:DARK,r:'full',text:'現況分析',size:Z(11),bold:1,color:W2,align:'left',margin:[30,6,0,0],name:'章節標籤'});bdg(x+.18,y+.22,.26,'02',P,{size:10,line:W2,lw:1});T(x+2.0,y+.06,w-2.0,.32,'Status · 2／5',{size:10,color:G.mute,font:nf,name:'英文'});
   let xx=x;const yy=y+.72;[['背景',0],['現況',1],['對策',0]].forEach(([t,on],i)=>{const ww=.9;box(xx,yy,ww,.28,{fill:on?P:'EDEDED',r:'full',text:t,size:10,bold:on,color:on?W2:G.mute,margin:0,name:'麵包屑'});xx+=ww;if(i<2){path([[xx+.08,yy+.07],[xx+.15,yy+.14],[xx+.08,yy+.21]],{line:G.l1,lw:1.25,name:'V 形箭頭'});xx+=.24;}});});
  comp('F','章節頁（本節 3 重點）','Section page',C[5],(x,y,w,h)=>{box(x,y,w,h,{fill:'F7F7F7',r:.08,name:'章節底'});txt(x+.24,y+.12,1.0,.6,'03',{size:Z(34),bold:1,color:P,font:nf,valign:'middle',name:'章節編號'});T(x+1.2,y+.16,w-1.4,.36,'對策與時程',{size:Z(16),bold:1,color:G.ink,name:'章節名'});
   T(x+1.2,y+.5,w-1.4,.26,'Actions & timeline',{size:10.5,color:G.mute,font:nf,name:'英文'});['三項對策的成本與效益','導入時程與里程碑','需要的決策與資源'].forEach((t,i)=>{const yy=y+.9+i*.32;circ(x+.36,yy+.13,.08,{fill:AC2,name:'項目符號'});T(x+.5,yy,w-.7,.28,t,{size:10.5,color:G.t2,wrap:0,name:'重點'});});});};
 /* B6 人員與組織 */
 SL.people=()=>{title('人員與組織 People & Team','人員卡（橫／直）、聯絡卡、團隊列、小型組織樹、窗口表：頭像可換成照片（右鍵→變更圖片）');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,2,Y0,Y1);
  comp('A','人員卡（橫式）','Person card',C[0],(x,y,w,h)=>{card(x,y,w,h);photo(x+.6,y+.62,.8,'人像（右鍵→變更圖片）');T(x+1.16,y+.2,w-1.3,.34,'陳怡君',{size:Z(14),bold:1,color:G.ink,name:'姓名'});T(x+1.16,y+.52,w-1.3,.28,'製程整合經理 PIE Manager',{size:10.5,name:'職稱'});
   pill(x+1.16,y+.9,1.1,.28,'專案負責',P,{size:10});pill(x+2.36,y+.9,1.0,.28,'CMP',TN(P,.85),{size:10,color:PD});T(x+.24,y+1.34,w-.48,.3,'負責 B 線良率改善與擴線評估',{size:10.5,name:'職責'});});
  comp('B','人員卡（直式）×3','Person tiles',C[1],(x,y,w,h)=>{const cw=(w-.24)/3;[['LW','林維','品保'],['HC','黃承','設備'],['SY','孫宇','製程']].forEach(([i0,n0,r0],i)=>{const xx=x+i*(cw+.12);card(xx,y,cw,h);photo(xx+cw/2,y+.5,.62,'人像（右鍵→變更圖片）');
   T(xx,y+.9,cw,.3,n0,{size:Z(12),bold:1,color:G.ink,align:'center',name:'姓名'});T(xx,y+1.2,cw,.26,r0,{size:10.5,color:G.mute,align:'center',name:'職稱'});});});
  comp('C','聯絡卡','Contact card',C[2],(x,y,w,h)=>{card(x,y,w,h);av(x+.5,y+.5,.6,'CY',P);T(x+.94,y+.2,w-1.1,.32,'陳怡君 Chen Yi-Chun',{size:Z(12.5),bold:1,color:G.ink,name:'姓名'});T(x+.94,y+.5,w-1.1,.26,'製程整合 · B 廠',{size:10.5,name:'單位'});
   [['mail','yc.chen@example.com'],['call','分機 3721'],['location_on','B 廠 3F'] ].forEach(([ic,t],i)=>{const yy=y+.94+i*.24;icon(ic,x+.3,yy,.2,{color:G.t2});T(x+.6,yy-.04,w-.8,.26,t,{size:10,color:G.t2,font:nf,wrap:0,name:'聯絡方式'});});});
  comp('D','團隊列 4 人','Team row',C[3],(x,y,w,h)=>{const cw=w/4;[['CY','陳怡君','PM'],['LW','林維','QA'],['HC','黃承','EE'],['SY','孫宇','PE']].forEach(([a,b,c],i)=>{const cx0=x+cw*i+cw/2;av(cx0,y+.4,.58,a,i===0?P:null);T(cx0-cw/2,y+.76,cw,.28,b,{size:11,bold:1,color:G.ink,align:'center',name:'姓名'});
   pill(cx0-.3,y+1.08,.6,.26,c,i===0?DARK:'EDEDED',{size:10,font:nf,color:i===0?W2:G.t2});});});
  comp('E','小型組織樹','Org tree',C[4],(x,y,w,h)=>{const bw=1.1,bh=.5;const top=box(x+w/2-bw/2,y,bw,bh,{fill:P,r:.08,text:[{t:'陳怡君',b:1,br:1},{t:'PM',s:10,f:nf}],size:Z(11),color:W2,lsp:.95,name:'主管'});const cw=(w-.3)/3;
   const ch=[['林維','QA'],['黃承','EE'],['孫宇','PE']].map(([a,b],i)=>box(x+i*(cw+.15)+(cw-bw)/2,y+1.0,bw,bh,{fill:W2,line:G.l1,lw:1,r:.08,text:[{t:a,b:1,br:1},{t:b,s:10,c:G.mute,f:nf}],size:Z(11),color:G.ink,lsp:.95,name:'成員'}));ch.forEach(c=>link(top,2,c,0,{mid:y+.76}));});
  comp('F','窗口對照表','Contact matrix',C[5],(x,y,w,h)=>{[['品質問題','林維','QA'],['設備異常','黃承','EE'],['製程變更','孫宇','PE'],['交期排程','陳怡君','PM']].forEach(([a,b,c],i)=>{const yy=y+i*.36;T(x,yy,1.3,.32,a,{size:10.5,color:G.t2,wrap:0,name:'事項'});chev(x+1.34,yy+.09,.14,G.l1,1.25);
   box(x+1.6,yy+.03,1.3,.26,{fill:i===3?P:'F2F2F2',r:'full',text:b,size:10.5,bold:1,color:i===3?W2:G.ink,margin:0,name:'窗口'});T(x+3.0,yy,w-3.0,.32,c,{size:10,color:G.mute,font:nf,wrap:0,name:'部門'});if(i<3)ln(x,yy+.34,x+w,yy+.34,{c:'EDEDED',w:.5});});
   T(x,y+1.48,w,.26,'RACI 分工表見 D4·2',{size:10,color:G.mute,name:'說明'});});};
 /* C1 KPI 卡 */
 SL.kpi=()=>{title('KPI 卡 KPI Cards','單值、目標＋Δ、迷你趨勢、4 卡橫排、變化上色三卡、KPI 表列、大數字三欄：改數值 Δ 自動重算');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const AMB='8C8C8C';
  const nm=(x,y,w,zh,en)=>T(x,y,w,.28,[{t:zh,b:1,c:G.ink},{t:en?'  '+en:'',s:10,c:G.mute,f:nf}],{size:Z(11),wrap:0,name:'指標名稱'});
  const num=(x,y,w,h,n,u,c,s,us,nm0)=>txt(x,y,w,h,[{t:n,s,b:1,c,f:nf},{t:u?' '+u:'',s:us||Z(11),c:G.mute,f:nf}],{valign:'middle',name:nm0||'數值'});
  const sm=(x,y,w,t,o)=>T(x,y,w,.26,t,Object.assign({size:10,color:G.mute,wrap:0,name:'說明'},o||{}));
  const r1={y:Y0,h:1.36},wA=3.2,wB=4.3,g=.3,wC=CW-wA-wB-2*g;
  comp('A','單值大數字','Single KPI',{x:X0,y:r1.y,w:wA,h:r1.h},(x,y,w,h)=>{card(x,y,w,h);nm(x+.2,y+.12,1.9,'良率','Yield');sm(x+w-1.1,y+.12,.9,'2026 Q3',{align:'right',font:nf,name:'期間'});num(x+.2,y+.42,w-.4,.56,'98.6','%',P,Z(30));light(x+.28,y+1.12,.13,GOOD);sm(x+.42,y+.99,2.4,'達標 On target',{name:'燈號說明'});});
  comp('B','數值＋目標＋Δ','Value vs target',{x:X0+wA+g,y:r1.y,w:wB,h:r1.h},(x,y,w,h)=>{card(x,y,w,h);nm(x+.2,y+.12,2.4,'CMP 良率','CMP yield');light(x+w-.98,y+.25,.13,GOOD);sm(x+w-.86,y+.12,.7,'正常',{name:'燈號說明'});
   const v=num(x+.2,y+.44,2.1,.56,'96.8','%',DARK,Z(28));sm(x+.2,y+1.02,2.0,'W42 · 2026',{font:nf,name:'期間'});const cx0=x+2.4;ln(cx0-.12,y+.5,cx0-.12,y+1.2,{c:G.l2,w:.75});sm(cx0,y+.46,1.7,'目標 Target',{name:'欄名'});
   const t=num(cx0,y+.7,.95,.28,'95.0','%',G.t2,Z(13),10,'目標值');sm(cx0,y+1.0,.95,'Δ vs 目標',{name:'欄名'});const bd=box(cx0+.96,y+.72,.86,.28,{fill:TN(GOOD),r:'full',text:'▲ +2%',size:10,bold:1,color:GOOD,font:nf,margin:0,name:'增減徽章'});bd.calc={a:cur.items.indexOf(t),b:cur.items.indexOf(v),m:'arrow'};});
  comp('C','數值＋迷你趨勢','Sparkline',{x:X0+wA+wB+2*g,y:r1.y,w:wC,h:r1.h},(x,y,w,h)=>{card(x,y,w,h);nm(x+.2,y+.12,1.6,'產出','Output');sm(x+w-1.2,y+.12,1.0,'近 8 週',{align:'right',name:'期間'});num(x+.2,y+.44,1.9,.5,'1,240','片',DARK,Z(24));
   T(x+.2,y+.98,1.9,.26,[{t:'▲ 8%',b:1,c:GOOD,f:nf},{t:'  vs 上週',c:G.mute}],{size:10,wrap:0,name:'增減'});const sx=x+2.1,sw=w-2.35,sy=y+.5,sh=.62,V=[3.1,3.6,3.3,4.2,3.9,4.6,4.4,5.2],px=i=>sx+i*sw/7,py=v=>sy+sh-(v-3)/2.4*sh;
   ln(sx,sy+sh+.04,sx+sw,sy+sh+.04,{c:G.l2,w:.75});path(V.map((v,i)=>[px(i),py(v)]),{line:G.l1,lw:1.5,name:'趨勢線'});path(V.slice(-3).map((v,i)=>[px(i+5),py(v)]),{line:P,lw:2,name:'近期趨勢'});circ(px(7),py(V[7]),.11,{fill:P,line:W2,lw:1,name:'最新點'});T(px(7)-.98,py(V[7])-.26,.85,.24,'1,240',{size:10,bold:1,color:P,align:'right',font:nf,wrap:0,name:'終點值'});T(sx-.05,py(V[0])+.02,.6,.22,'920',{size:10,color:G.t2,font:nf,wrap:0,name:'起點值'});});
  const y2=3.62,h2=1.1,wD=7.4;
  comp('D','4 卡橫排','KPI row',{x:X0,y:y2,w:wD,h:h2},(x,y,w,h)=>{const gw=.16,cw=(w-3*gw)/4;[['良率','98.6','%','▲ 0.4 pt',GOOD,GOOD],['產出','12.4','K','▲ 3%',GOOD,GOOD],['交期','7.2','天','▼ 0.5 天',GOOD,AMB],['客訴','3','件','▲ 1 件',BAD,BAD]].forEach(([zh,v,u,d,dc,lc],i)=>{const xx=x+i*(cw+gw);
   card(xx,y,cw,h);box(xx+.14,y,.42,.05,{fill:i===0?P:G.l1,name:'頂邊色條'});T(xx+.14,y+.1,cw-.4,.26,zh,{size:Z(11),bold:1,color:G.ink,name:'指標名稱'});light(xx+cw-.2,y+.23,.12,lc);num(xx+.14,y+.38,cw-.28,.4,v,u,DARK,Z(20),10);T(xx+.14,y+.78,cw-.28,.24,d,{size:10,bold:1,color:dc,font:nf,wrap:0,name:'增減'});});});
  comp('E','三卡（變化依好壞上色）','Better/worse',{x:X0+wD+g,y:y2,w:CW-wD-g,h:h2},(x,y,w,h)=>{const gw=.14,cw=(w-2*gw)/3;[['準時交貨','98.6','%','▲ 2.1 pt',1],['平均交期','6.2','天','▼ 1.8 天',1],['客訴','3','件','▲ 1 件',0]].forEach(([l,v,u,d,good],i)=>{const xx=x+i*(cw+gw);card(xx,y,cw,h);
   T(xx+.12,y+.1,cw-.2,.26,l,{size:10.5,color:G.t2,wrap:0,name:'指標名稱'});num(xx+.12,y+.38,cw-.2,.4,v,u,i===0?P:G.ink,Z(20),10);T(xx+.12,y+.78,cw-.2,.24,d,{size:10,bold:1,color:good?GOOD:BAD,font:nf,wrap:0,name:'變化'});});});
  const y3=5.08,h3=1.46;
  comp('F','KPI 表列','KPI list',{x:X0,y:y3,w:7.4,h:h3},(x,y,w,h)=>{const cols=[0,2.6,4.0,5.4,6.4];['指標 Metric','實際','目標','燈號',''].forEach((t,i)=>T(x+cols[i],y,1.6,.26,t,{size:10,bold:1,color:G.mute,wrap:0,name:'欄頭'}));ln(x,y+.3,x+w,y+.3,{c:G.t2,w:1});
   [['良率 Yield','98.6%','98.0%',GOOD,'達標'],['產出 Output','12.4K','13.0K',AMB,'注意'],['客訴 Complaints','3 件','≤ 2 件',BAD,'未達']].forEach(([a,b,c,col,s],i)=>{const yy=y+.36+i*.36;T(x,yy,2.5,.3,a,{size:11,color:G.ink,wrap:0,name:'指標'});T(x+cols[1],yy,1.3,.3,b,{size:Z(12),bold:1,color:G.ink,font:nf,wrap:0,name:'實際'});T(x+cols[2],yy,1.3,.3,c,{size:11,color:G.t2,font:nf,wrap:0,name:'目標'});
    circ(x+cols[3]+.1,yy+.15,.16,{fill:col,name:'燈號'});T(x+cols[3]+.26,yy,.9,.3,s,{size:10.5,color:col,bold:1,wrap:0,name:'燈號說明'});ln(x,yy+.34,x+w,yy+.34,{c:'EDEDED',w:.5});});});
  comp('G','大數字三欄','Big numbers',{x:X0+7.4+g,y:y3,w:CW-7.4-g,h:h3},(x,y,w,h)=>{const cw=w/3;[['98.6','%','良率'],['−30','%','交期'],['12','件','改善提案']].forEach(([v,u,l],i)=>{const xx=x+i*cw;if(i)ln(xx,y+.2,xx,y+h-.2,{c:G.l2,w:.75});num(xx+.12,y+.2,cw-.16,.66,v,u,i===0?P:G.ink,Z(28),Z(12));T(xx+.14,y+.92,cw-.2,.3,l,{size:11,color:G.t2,wrap:0,name:'說明'});});});};
 /* C2 評比指標 */
 SL.rating=()=>{title('評比指標 Ratings & Status','進度條、目標刻度、Harvey ball、三階燈號、1–5 點數：改 % 或分數自動重畫；狀態一律「形狀／深淺＋文字」');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const AMB='8C8C8C';const C=GRID(3,2,Y0,Y1);const sm=(x,y,w,t,o)=>T(x,y,w,.28,t,Object.assign({size:10.5,color:G.t2,wrap:0,name:'項目'},o||{}));
  comp('A','細進度條','Thin progress',C[0],(x,y,w,h)=>{const lw=.7,bw=w-lw-.6;[['設計','100%'],['驗證','65%'],['量產','30%']].forEach(([t,p],i)=>{const yy=y+.1+i*.46;sm(x,yy,lw,t);box(x+lw,yy+.11,bw,.07,{fill:'E6E6E6',r:'full',name:'進度底'});
   const pt=T(x+lw+bw+.06,yy,.54,.28,p,{size:10,bold:1,color:'262626',font:nf,align:'right',wrap:0,name:'百分比'});calc1(box(x+lw,yy+.11,bw*parseFloat(p)/100,.07,{fill:i===1?P:G.l1,r:'full',name:'進度條'}),pt,'pbar',{full:bw});});});
  comp('B','粗進度條','Thick progress',C[1],(x,y,w,h)=>{const lw=.7,bw=w-lw-.6,bh=.3;[['Q1','90%'],['Q2','60%'],['Q3','35%']].forEach(([t,p],i)=>{const yy=y+.06+i*.46;sm(x,yy+.01,lw,t,{font:nf});box(x+lw,yy,bw,bh,{fill:'EDEDED',r:'full',name:'進度底'});
   const bar=box(x+lw,yy,bw*parseFloat(p)/100,bh,{fill:i===0?P:i===1?mix(P,'FFFFFF',.35):G.l1,r:'full',name:'進度條'});const pt=T(x+lw+bw+.06,yy,.56,bh,p,{size:10,bold:1,color:'262626',font:nf,align:'right',wrap:0,name:'百分比'});calc1(bar,pt,'pbar',{full:bw});});});
  comp('C','進度＋目標刻度','Progress vs target',C[2],(x,y,w,h)=>{[['良率','86%',.9],['OEE','72%',.8],['準交','95%',.92]].forEach(([t,p,tg],i)=>{const yy=y+.1+i*.5,lw=.7,bw=w-lw-.6,v=parseFloat(p)/100;sm(x,yy,lw,t);box(x+lw,yy+.08,bw,.14,{fill:'EDEDED',r:'full',name:'進度底'});
   const pt=T(x+lw+bw+.06,yy,.54,.28,p,{size:10,bold:1,color:'262626',font:nf,align:'right',wrap:0,name:'百分比'});calc1(box(x+lw,yy+.08,bw*v,.14,{fill:v>=tg?P:'8C8C8C',r:'full',name:'進度條'}),pt,'pbar',{full:bw});
   ln(x+lw+bw*tg,yy,x+lw+bw*tg,yy+.3,{c:G.ink,w:1.5,name:'目標刻度'});});T(x,y+h-.3,w,.26,'│ 黑線＝目標；達標＝主色，未達＝灰',{size:10,color:G.mute,name:'說明'});});
  comp('D','Harvey ball','Harvey ball',C[3],(x,y,w,h)=>{const d=.42,sp=(w-d)/4;['0%','25%','50%','75%','100%'].forEach((p,i)=>{const cx0=x+d/2+i*sp,cy0=y+.4;circ(cx0,cy0,d,{fill:W2,line:G.t2,lw:1,name:'Harvey 外圈'});const lb=T(cx0-.3,y+.68,.6,.26,p,{size:10,color:G.t2,font:nf,align:'center',wrap:0,name:'評分'});
   calc1(el('custGeom',cx0-d/2,cy0-d/2,d,d,{points:PIE(d/2,parseFloat(p)/100),fill:G.ink,name:'Harvey 扇形'}),lb,'hb');});T(x,y+1.06,w,.5,'0＝未符合 · 100＝完全符合\n（數字並列，色盲也讀得懂）',{size:10,color:G.mute,valign:'top',name:'說明'});});
  comp('E','三階燈號（深淺＋文字）','Status lights',C[4],(x,y,w,h)=>{box(x,y+.06,.42,1.16,{fill:W2,line:G.l2,lw:1,r:'full',name:'燈號底'});[[PD,'正常 On track','●'],['8EA9DB','注意 At risk','◐'],['D9D9D9','落後 Off track','○']].forEach(([c,t,sy],i)=>{circ(x+.21,y+.27+i*.37,.24,{fill:c,line:i===2?'8C8C8C':null,lw:.75,name:'燈號'});T(x+.6,y+.13+i*.37,w-.6,.28,sy+' '+t,{size:Z(11),color:G.ink,wrap:0,name:'狀態'});});
   T(x,y+1.34,w,.5,'不用紅綠：以深淺＋符號＋文字區分，色盲與黑白列印都讀得懂',{size:10,color:G.t2,valign:'top',name:'說明'});});
  comp('F','1–5 點數','Dot rating',C[5],(x,y,w,h)=>{[['品質','4/5'],['成本','3/5'],['交期','5/5']].forEach(([t,v],i)=>{const yy=y+.1+i*.44;sm(x,yy,.8,t);const vt=T(x+2.22,yy,.5,.28,v,{size:10,color:G.mute,font:nf,align:'left',wrap:0,name:'評分'});
   for(let k=1;k<=5;k++)calc1(circ(x+.95+(k-1)*.26,yy+.14,.17,{fill:k<=parseFloat(v)?P:'E3E3E3',name:'評分點'}),vt,'dot',{k,on:P,off:'E3E3E3'});});});
};
 /* C4 圖表佔位與圖例 */
 SL.chart=()=>{title('圖表頁零件 Chart Kit','灰階＋1 個主色標出重點；形狀版可直接改高度與數字，要換資料請用 SwiffChart 產生原生圖表');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,2,Y0,Y1);const INK='262626',GR='BFBFBF';
  const bars=(x,y,w,h,v,lab,hi,o)=>{o=o||{};const mx=o.min!=null?Math.max(...v)+.5:Math.max(...v)*1.08,n=v.length,g=w/n,bw=g*.58,base=y+h-.3;ln(x,base,x+w,base,{c:G.line,w:.75});
   v.forEach((d,i)=>{const bh=(h-.62)*(o.min!=null?(d-o.min)/(mx-o.min):d/mx),bx=x+i*g+(g-bw)/2;box(bx,base-bh,bw,bh,{fill:i===hi?P:GR,r:0,name:'長條'});
    T(bx-.15,base-bh-.27,bw+.3,.26,String(d)+(o.u||''),{size:10,bold:i===hi,color:i===hi?P:INK,align:'center',font:nf,wrap:0,name:'資料標籤'});
    T(x+i*g,base+.04,g,.24,lab[i],{size:10,color:G.t2,align:'center',font:nf,wrap:0,name:'類別'});});return{base,mx};};
  comp('A','重點長條（最後一根上色＋目標線）','Highlight bar',C[0],(x,y,w,h)=>{T(x,y,w,.3,'W42 良率 98.6%，連 3 週達標',{size:Z(12),bold:1,color:G.ink,wrap:0,name:'結論標題'});
   const v=[95.1,95.8,96.4,97.9,98.2,98.6],yy=y+.38,hh=h-.38,mn=93;const r=bars(x,yy,w-.5,hh,v,['W37','W38','W39','W40','W41','W42'],5,{min:mn});
   const ty=r.base-(hh-.62)*(98-mn)/(r.mx-mn);ln(x,ty,x+w-.5,ty,{c:G.t2,w:1,dash:'dash'});T(x+w-.48,ty-.13,.5,.26,'目標',{size:10,color:G.t2,wrap:0,name:'目標線標籤'});});
  comp('B','折線＋終點值','Line + end label',C[1],(x,y,w,h)=>{T(x,y,w,.3,'客訴件數 6 個月減半',{size:Z(12),bold:1,color:G.ink,wrap:0,name:'結論標題'});
   const v=[12,11,9,9,7,6],L=['5月','6月','7月','8月','9月','10月'],x0=x+.1,x1=x+w-.75,y0=y+.6,y1=y+h-.34,mx=13;const px=i=>x0+i*(x1-x0)/5,py=d=>y1-(y1-y0)*d/mx;
   ln(x0,y1,x1,y1,{c:G.line,w:.75});for(let i=0;i<5;i++)ln(px(i),py(v[i]),px(i+1),py(v[i+1]),{c:i===4?P:'8C8C8C',w:2});
   v.forEach((d,i)=>{circ(px(i),py(d),i===5?.16:.1,{fill:i===5?P:'8C8C8C',line:W2,lw:1,name:'資料點'});T(px(i)-.3,y1+.04,.6,.24,L[i],{size:10,color:G.t2,align:'center',wrap:0,name:'類別'});});
   T(px(0)-.3,py(v[0])-.32,.6,.26,'12',{size:10,color:INK,align:'center',font:nf,wrap:0,name:'起點值'});T(px(5)+.14,py(v[5])-.15,.6,.3,'6 件',{size:Z(11),bold:1,color:P,wrap:0,name:'終點值'});});
  comp('C','橫條排名（第一名上色）','Ranked bars',C[2],(x,y,w,h)=>{T(x,y,w,.3,'A 線產出最高',{size:Z(12),bold:1,color:G.ink,wrap:0,name:'結論標題'});
   const D=[['A 線',1240],['B 線',980],['C 線',760],['D 線',520]],lw=.6,bw=w-lw-.75,rh=(h-.44)/4;D.forEach(([t,v],i)=>{const yy=y+.42+i*rh;T(x,yy,lw,rh,t,{size:10.5,color:G.ink,wrap:0,name:'類別'});
    box(x+lw,yy+rh*.2,bw*v/1240,rh*.6,{fill:i===0?P:GR,r:0,name:'橫條'});T(x+lw+bw*v/1240+.06,yy,.7,rh,v.toLocaleString('en-US'),{size:10,bold:i===0,color:i===0?P:INK,font:nf,wrap:0,name:'資料標籤'});});});
  comp('D','圖例組（色塊／線型／符號）','Legends',C[3],(x,y,w,h)=>{const cw=w/2;[[P,'本廠'],[GR,'同業']].forEach(([c,t],i)=>{box(x+i*cw,y+.1,.24,.16,{fill:c,r:.03,name:'色塊'});T(x+i*cw+.32,y+.03,cw-.34,.3,t,{size:10.5,color:G.t2,wrap:0,name:'圖例'});});
   [['solid',P,'實際'],['dash',G.t2,'預測']].forEach(([d,c,t],i)=>{const yy=y+.62;ln(x+i*cw,yy,x+i*cw+.44,yy,{c,w:2,dash:d});T(x+i*cw+.52,yy-.15,cw-.54,.3,t,{size:10.5,color:G.t2,wrap:0,name:'圖例'});});
   circ(x+.12,y+1.06,.16,{fill:P,name:'符號'});T(x+.32,y+.91,cw-.34,.3,'量測點',{size:10.5,color:G.t2,wrap:0,name:'圖例'});el('diamond',x+cw+.03,y+.97,.18,.18,{fill:DARK,name:'符號'});T(x+cw+.32,y+.91,cw-.34,.3,'里程碑',{size:10.5,color:G.t2,wrap:0,name:'圖例'});
   T(x,y+1.32,w,.5,'圖例放在圖的正上方、色塊緊貼文字；能直接標在線尾就不要圖例',{size:10,color:G.t2,valign:'top',name:'說明'});});
  comp('E','圖表框（結論＋單位＋來源）','Chart frame',C[4],(x,y,w,h)=>{T(x,y,w,.3,'結論句寫在圖表上方',{size:Z(12),bold:1,color:G.ink,wrap:0,name:'結論標題'});T(x,y+.3,w,.26,'單位：%，晶圓數加權',{size:10,color:G.t2,wrap:0,name:'單位'});
   {const ah=h-1.0,aw=Math.min(w,ah*632/369);cur.items.push({t:'pic',x:x,y:y+.62,w:aw,h:ah,png:SWIFF,name:'SwiffChart 圖表截圖（右鍵→變更圖片）'});box(x,y+.62,aw,ah,{line:G.l2,lw:.75,name:'圖表外框'});if(w-aw>.9)T(x+aw+.1,y+.62,w-aw-.1,ah,[{t:'建議尺寸',b:1,c:G.ink},{t:'\n半寬 6.2×3.2 吋\n全寬 11.9×4.4 吋\n¼ 頁 3.9×2.4 吋'}],{size:10,color:G.t2,valign:'top',name:'建議尺寸'});}
   T(x,y+h-.32,w,.28,'資料來源：MES／YMS｜SwiffChart 建議 6.2×3.2 吋',{size:10,color:G.t2,wrap:0,name:'來源'});});
  comp('F','SwiffChart 三步驟（原生可編輯圖表）','Get native charts',C[5],(x,y,w,h)=>{card(x,y,w,h,{line:P,lw:1});T(x+.2,y+.12,w-.4,.3,'要可改資料的原生圖表？',{size:Z(12),bold:1,color:G.ink,wrap:0,name:'標題'});
   ['到 SwiffChart 選圖表（直條／折線／瀑布…）','貼上 Excel 資料、套用本站主色','複製 → 貼到投影片，仍可在 PowerPoint 改資料'].forEach((t,i)=>{const yy=y+.52+i*.38;bdg(x+.34,yy+.14,.28,String(i+1),i===2?P:DARK,{size:10});T(x+.56,yy,w-.7,.3,t,{size:10,color:G.ink,wrap:0,name:'步驟'});});
   T(x+.2,y+h-.36,w-.4,.28,'github.com/hctsaik/swiffchart-web-preview ↗',{size:10,color:P,font:nf,wrap:0,name:'SwiffChart 連結'});});};
 /* D1·2 前後對比零件（原 As Was／To Be 版型拆成零件） */
 SL.asis=()=>{title('前後對比 · 版型零件 Before & After Kit','大字對比條、倍數徽章、指標對照表、四行動方塊、編號說明列、三行重點句：自由拼成一頁');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const SOFT=TN(P,.92),CARD='F7F7F7';
  comp('A','大字對比條','Big contrast bar',{x:X0,y:Y0,w:CW/2,h:.9},(x,y,w0,h)=>{const w=CW,AG=.62,cw=(w-AG)/2;[[0,'As Was','2000',0],[1,'To Be','4000',1]].forEach(([i,lab,num,hi])=>{const xx=x+i*(cw+AG);box(xx,y,cw,h,{fill:hi?P:CARD,r:.12,sh:'card',force:1,name:lab+' 卡'});
   box(xx+.26,y+.21,1.5,.48,{fill:hi?W2:DARK,r:'full',text:lab,size:Z(18),bold:1,color:hi?P:W2,margin:0,name:lab+' 標籤'});T(xx+2.0,y,cw-2.2,h,[{t:'銷售額 ',s:Z(18),c:hi?W2:G.t2},{t:num,s:Z(32),b:1,c:hi?W2:G.t2,f:nf},{t:' 元',s:Z(18),c:hi?W2:G.t2}],{size:18,wrap:0,name:lab+' 數值'});});
});
  grp('倍數徽章＋箭頭',()=>{const cw=(CW-.62)/2,ax=X0+cw+.31,ay=Y0+.45;circ(ax,ay,.46,{fill:W2,line:G.line,lw:1,name:'箭頭底'});path([[ax-.07,ay-.12],[ax+.07,ay],[ax-.07,ay+.12]],{line:G.t2,lw:2.75,name:'箭頭'});box(X1-.98,Y0-.2,.86,.38,{fill:DARK,r:.19,text:'×2',size:14,bold:1,color:W2,margin:0,name:'倍數徽章'});});
  T(X0+CW/2+.6,Y0+.94,CW/2-.6,.24,'B｜倍數徽章＋箭頭 Multiplier',{size:10,color:G.mute,name:'圖說'});
  const ty=3.32;
  comp('C','四行動方塊','4 action tiles',{x:X0,y:ty,w:5.9,h:.84},(x,y,w,h)=>{const bw=1.34,g=(w-4*bw)/3;[['鎖客群','抓需求'],['升方案','提單價'],['拓通路','接線上'],['顧回購','養忠誠']].forEach(([a,b],i)=>{const hi=i===2;box(x+i*(bw+g),y,bw,h,{fill:hi?P:CARD,line:hi?null:G.line,lw:.75,r:.09,sh:hi?'card':null,force:hi?1:0,text:a+'\n'+b,size:Z(16),bold:1,lsp:.9,margin:0,color:hi?W2:G.ink,name:'行動 '+(i+1)});});});
  comp('D','編號說明列','Numbered notes',{x:X0,y:4.6,w:5.9,h:1.9},(x,y,w,h)=>{const lh=h/4;[['鎖客群抓需求','聚焦高價值客群，停掉低毛利通路'],['升方案提單價','推出加值方案，客單價 20 → 25 元'],['拓通路接線上','線上預約與會員，客戶數 +60%'],['顧回購養忠誠','回購提醒與專屬服務，回購率翻倍']].forEach(([a,b],i)=>{const yy=y+i*lh,hi=i===2;
   circ(x+.15,yy+lh/2,.28,{fill:hi?P:DARK,text:String(i+1),size:10.5,bold:1,color:W2,margin:0,name:'說明編號'});T(x+.4,yy,w-.4,lh,[{t:a+'　',b:1,c:hi?P:G.ink},{t:b,c:G.t2}],{size:Z(12),wrap:0,name:'行動說明'});});});
  comp('E','指標對照表（原生表格）','Metric table',{x:X0+6.2,y:ty,w:CW-6.2,h:2.0},(x,y,w,h)=>{const cw=[w*.34,w*.33,w*.33];const rows=[['指標','As Was','To Be'],['銷售額','2000 元','4000 元'],['客戶數','100 人','160 人'],['客單價','20 元','25 元'],['回購率','15%','30%']];
   table(x,y,cw,[.38,.4,.4,.4,.4],rows.map((r,ri)=>r.map((c,ci)=>{const o={t:c,size:Z(14),bB:{c:G.line,w:.75}};if(ri===0)Object.assign(o,{fill:ci===2?P:DARK,color:W2,bold:1,size:Z(13),bB:null});else if(ci===0)Object.assign(o,{bold:1,color:G.t2,align:'left',fill:'FAFAFA'});else if(ci===2)Object.assign(o,{bold:1,color:P,fill:SOFT});else Object.assign(o,{color:G.t2});return o;})),{name:'As Was／To Be 對照表',mL:10});});
  comp('F','三行重點句','3 key lines',{x:X0+6.2,y:5.68,w:CW-6.2,h:.84},(x,y,w,h)=>{['鎖定高價值客群，銷售額 2000 → 4000 元','客戶數與客單價同步成長，回購率翻倍','四項行動依序推進，每月追蹤'].forEach((t,i)=>{const yy=y+i*.28;circ(x+.06,yy+.14,.08,{fill:G.g7,name:'項目符號'});T(x+.2,yy,w-.2,.28,t,{size:Z(12),color:G.ink,wrap:0,name:'重點句'});});});};
 /* D2·2 表格與方案比較 */
 SL.cmp3=()=>{title('表格與方案比較 Tables & Options','改善前後表、三方案比較、優缺點、加權評分、功能勾選、二選一推薦：表格皆為原生 PowerPoint 表格');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,2,Y0,Y1);const bH={c:P,w:1.25},bR={c:G.l2,w:.5};
  comp('A','改善前後對照表','Before/after table',C[0],(x,y,w,h)=>{const c0=1.1,c1=(w-c0)/2;table(x,y,[c0,c1,c1],[.36,.38,.38,.38,.38],[[{t:'項目',bold:1,color:G.t2,align:'left',bB:bH},{t:'改善前',bold:1,color:G.t2,fill:'F2F2F2',bB:{c:G.line,w:1.25}},{t:'改善後',bold:1,color:W2,fill:P,bB:bH}]]
   .concat([['交期','10 天','6 天'],['不良率','3.2%','1.1%'],['人力','5 人','3 人'],['客訴','8 件','2 件']].map(r=>[{t:r[0],align:'left',bB:bR},{t:r[1],color:G.t2,bB:bR,font:nf},{t:r[2],color:P,bold:1,bB:bR,font:nf,size:Z(12)}])),{size:Z(11),name:'前後對照表'});});
  comp('B','三方案比較','3 options',C[1],(x,y,w,h)=>{const g=.12,cw=(w-2*g)/3,hh=.42;[['方案 A',['低成本','2 週','擴充有限']],['方案 B',['中成本','4 週','擴充佳']],['方案 C',['高成本','8 週','最佳']]].forEach(([zh,rows],i)=>{const xx=x+i*(cw+g),hi=i===1;
   box(xx,y,cw,h,{fill:W2,line:hi?P:G.l2,lw:hi?2:1,r:.08,sh:hi?1:0,name:hi?'推薦方案':'方案'});topRound(xx,y,cw,hh,.08,{fill:hi?P:'F2F2F2',name:'表頭'});T(xx,y,cw,hh,zh,{size:Z(12),bold:1,color:hi?W2:G.ink,align:'center',wrap:0,name:'方案名稱'});
   rows.forEach((r,j)=>T(xx+.1,y+hh+.1+j*.34,cw-.2,.3,r,{size:Z(11),bold:hi,color:hi?P:G.ink,align:'center',wrap:0,name:'內容'}));if(hi)pill(xx+cw/2-.4,y+h-.36,.8,.26,'推薦',P,{size:10});});});
  comp('C','優缺點雙欄','Pros & cons',C[2],(x,y,w,h)=>{const cw=(w-.2)/2;[['＋ 優點 Pros',PD,['導入快','成本低','風險小']],['− 缺點 Cons','7F7F7F',['擴充有限','需人工','依賴廠商']]].forEach(([t,c,L],i)=>{const xx=x+i*(cw+.2);box(xx,y,cw,.34,{fill:c,r:'full',text:t,size:Z(11),bold:1,color:W2,margin:0,name:'欄名'});
   L.forEach((s,j)=>{const yy=y+.5+j*.38;T(xx+.08,yy,.3,.3,i?'−':'＋',{size:Z(12),bold:1,color:i?G.t2:P,name:'符號'});T(xx+.36,yy,cw-.4,.3,s,{size:Z(11.5),color:G.ink,wrap:0,name:'項目'});});});});
  comp('D','加權評分表','Weighted scoring',C[3],(x,y,w,h)=>{const c0=1.0,cw=(w-c0-.6)/3;const rows=[['準則','權重','A','B','C'],['成本','40%','3','4','2'],['時程','30%','4','3','2'],['擴充','30%','2','4','5'],['加權','','3.0','3.7','2.9']];
   table(x,y,[c0,.6,cw,cw,cw],[.34,.34,.34,.34,.38],rows.map((r,ri)=>r.map((c,ci)=>{const o={t:c,bB:bR,font:ci?nf:undefined};if(ri===0)Object.assign(o,{bold:1,color:ci===3?W2:G.t2,fill:ci===3?P:null,bB:bH});if(ci===0)o.align='left';if(ci===3&&ri>0)Object.assign(o,{fill:TN(P,.9),color:P,bold:1});if(ri===4)Object.assign(o,{bold:1,size:Z(12),bT:{c:G.t2,w:1}});return o;})),{size:Z(11),name:'加權評分表'});});
  comp('E','功能勾選比較表','Feature check',C[4],(x,y,w,h)=>{const c0=1.6,cw=(w-c0)/3;const rows=[['功能','本案','現行','競品'],['即時看板','✓','—','✓'],['自動警示','✓','—','—'],['行動版','✓','✓','—'],['API 串接','✓','—','✓']];
   table(x,y,[c0,cw,cw,cw],[.34,.36,.36,.36,.36],rows.map((r,ri)=>r.map((c,ci)=>{const o={t:c,bB:bR};if(ri===0)Object.assign(o,{bold:1,color:ci===1?W2:G.t2,fill:ci===1?P:null,bB:bH});else if(ci===0)o.align='left';else Object.assign(o,{color:c==='✓'?(ci===1?P:G.ink):G.t2,bold:1,size:Z(12),fill:ci===1?TN(P,.92):null});return o;})),{size:Z(11),name:'功能比較表'});});
  comp('F','二選一推薦卡','A vs B',C[5],(x,y,w,h)=>{const cw=(w-.5)/2;[['A 方案','外包','3 個月 · 120 萬',0],['B 方案','自建','5 個月 · 80 萬',1]].forEach(([a,b,c,hi],i)=>{const xx=x+i*(cw+.5);card(xx,y+.12,cw,h-.12,hi?{line:P,lw:1.5}:{});if(hi)pill(xx+cw-.9,y,.8,.26,'推薦',P,{size:10});
   T(xx+.18,y+.3,cw-.3,.3,a,{size:10.5,color:G.mute,bold:1,name:'方案'});T(xx+.18,y+.6,cw-.3,.4,b,{size:Z(18),bold:1,color:hi?P:G.ink,name:'方案名稱'});T(xx+.18,y+1.06,cw-.3,.3,c,{size:10.5,color:G.t2,font:nf,wrap:0,name:'成本時程'});});
   T(x+cw,y+.62,.5,.4,'VS',{size:Z(13),bold:1,color:G.t2,align:'center',font:nf,name:'VS'});});};
 /* D3 矩陣與風險 */
 SL.mtx=()=>{title('矩陣與風險 Matrix, SWOT & Risk','2×2 矩陣、5×5 風險熱圖、3×3 九宮格、SWOT（完整／橫列）、十字定位：軸標題、象限與泡泡皆可改字');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,2,Y0,Y1);const AMB='8C8C8C';
  comp('A','2×2 矩陣','2×2 matrix',C[0],(x,y,w,h)=>{const ox=x+.3,oy=y+h-.3,qw=(w-.4)/2,qh=(h-.4)/2;ln(ox,oy,ox,y,{c:G.t2,w:1.25,head:'triangle'});ln(ox,oy,x+w,oy,{c:G.t2,w:1.25,head:'triangle'});
   T(x-.04,y-.02,.3,.6,'影響',{size:10,color:G.t2,bold:1,name:'Y 軸'});T(x+w-1.0,oy+.02,1.0,.26,'執行難度',{size:10,bold:1,color:G.t2,align:'right',wrap:0,name:'X 軸'});
   [[0,0,'速贏','Quick wins',1],[1,0,'重大專案','Major'],[0,1,'順手做','Fill-ins'],[1,1,'避免','Thankless']].forEach(([c,r,t,e,hi])=>{const xx=ox+.06+c*qw,yy=y+.04+r*qh;box(xx,yy,qw-.08,qh-.08,{fill:hi?TN(P,.88):'F5F5F5',line:hi?P:null,lw:1.25,r:.06,name:'象限'});
    T(xx+.1,yy+.06,qw-.3,.28,[{t,b:1},{t:' '+e,s:10,b:0,c:G.mute,f:nf}],{size:Z(11),color:hi?P:G.ink,wrap:0,name:'象限標題'});});circ(ox+.7,y+.6,.32,{fill:P,line:W2,lw:1.5,text:'A',size:10,bold:1,color:W2,margin:0,name:'泡泡'});});
  comp('B','5×5 風險熱圖','Risk heatmap',C[1],(x,y,w,h)=>{const lw=.5,cs=Math.min((w-lw-.1)/5,(h-.36)/5);const col=s=>s>=20?PD:s>=15?P:s>=8?mix(P,'FFFFFF',.45):s>=4?mix(P,'FFFFFF',.72):'EEF3FA';/* 單一色相 5 階（不用紅黃綠） */
   for(let r=0;r<5;r++)for(let c=0;c<5;c++){const s=(5-r)*(c+1);box(x+lw+c*cs,y+r*cs,cs-.03,cs-.03,{fill:col(s),r:.03,name:'熱圖格'});}
   T(x,y,lw-.06,5*cs,'機率',{size:10,bold:1,color:G.t2,align:'center',name:'Y 軸'});T(x+lw,y+5*cs+.02,5*cs,.28,'影響 Impact →',{size:10,bold:1,color:G.t2,align:'center',wrap:0,name:'X 軸'});
   [['R1',1,3],['R2',3,1],['R3',2,4]].forEach(([t,r,c])=>circ(x+lw+(c+.5)*cs,y+(r+.5)*cs,.32,{fill:W2,line:DARK,lw:1.5,text:t,size:10,bold:1,color:DARK,margin:0,font:nf,name:'風險點'}));
   const lx=x+lw+5*cs+.16;[[PD,'高'],[mix(P,'FFFFFF',.45),'中'],['EEF3FA','低']].forEach(([c,t],i)=>{box(lx,y+.1+i*.36,.2,.2,{fill:c,r:.03,name:'色塊'});T(lx+.26,y+.06+i*.36,.5,.28,t,{size:10,color:G.t2,name:'圖例'});});});
  comp('C','3×3 九宮格','3×3 grid',C[2],(x,y,w,h)=>{const lw=.5,cw=(w-lw)/3,ch=(h-.3)/3;['高','中','低'].forEach((t,r)=>T(x,y+r*ch,lw-.06,ch,t,{size:10,color:G.t2,bold:1,align:'center',name:'列名'}));['低','中','高'].forEach((t,c)=>T(x+lw+c*cw,y+3*ch,cw,.28,t,{size:10,color:G.t2,bold:1,align:'center',name:'欄名'}));
   for(let r=0;r<3;r++)for(let c=0;c<3;c++){const sc=(2-r)+c;box(x+lw+c*cw,y+r*ch,cw-.04,ch-.04,{fill:sc>=4?P:sc>=2?TN(P,.75):'F2F2F2',r:.04,text:sc>=4?'明星':sc===3?'潛力':'',size:10.5,bold:1,color:sc>=4?W2:PD,name:'九宮格'});}});
  comp('D','SWOT','SWOT',C[3],(x,y,w,h)=>{const g=.08,cw=(w-g)/2,ch=(h-g)/2;[['S','優勢','製程良率領先',P],['W','劣勢','產能吃緊',G.t2],['O','機會','AI 晶片需求',AC2],['T','威脅','價格競爭',DARK]].forEach(([k,zh,it,c],i)=>{const xx=x+(i%2)*(cw+g),yy=y+Math.floor(i/2)*(ch+g);
   card(xx,yy,cw,ch);box(xx+.1,yy+.12,.42,.42,{fill:c,r:.06,text:k,size:Z(16),bold:1,color:lum(c)>.55?G.ink:W2,font:nf,margin:0,name:'SWOT 字母'});T(xx+.6,yy+.1,cw-.7,.28,zh,{size:Z(12),bold:1,color:G.ink,name:'象限標題'});T(xx+.6,yy+.38,cw-.7,.4,it,{size:10.5,valign:'top',name:'項目'});});});
  comp('E','SWOT 橫列（精簡）','SWOT compact',C[4],(x,y,w,h)=>{const cw=(w-.24)/4;[['S','優勢','良率領先',P],['W','劣勢','產能吃緊',G.t2],['O','機會','AI 需求',AC2],['T','威脅','價格戰',DARK]].forEach(([k,zh,it,c],i)=>{const xx=x+i*(cw+.08);box(xx,y,cw,.42,{fill:c,r:.06,text:k+' '+zh,size:Z(11),bold:1,color:lum(c)>.55?G.ink:W2,margin:0,name:'SWOT 欄頭'});
   box(xx,y+.48,cw,h-.48,{fill:'F7F7F7',r:.06,name:'SWOT 內容底'});T(xx+.08,y+.56,cw-.16,h-.64,it,{size:10.5,color:G.ink,valign:'top',name:'項目'});});});
  comp('F','十字定位','Positioning cross',C[5],(x,y,w,h)=>{const cx0=x+w/2,cy0=y+h/2;ln(x+.4,cy0,x+w-.4,cy0,{c:G.line,w:1});ln(cx0,y+.2,cx0,y+h-.2,{c:G.line,w:1});circ(cx0,cy0,.7,{fill:P,line:W2,lw:2,sh:'small',text:'定位',size:Z(11),bold:1,color:W2,margin:0,name:'中心圓'});
   [['吸引',-1,-1],['實用',1,-1],['好記',-1,1],['可信',1,1]].forEach(([t,sx,sy],i)=>tag(cx0+sx*.9,cy0+sy*.5-.15,t,{anchor:'center',size:10.5,h:.3,tone:i===1?'p':'g'}));T(cx0-.6,y-.04,1.2,.26,'具體',{size:10,color:G.t2,align:'center',name:'軸'});T(cx0-.6,y+h-.2,1.2,.26,'抽象',{size:10,color:G.t2,align:'center',name:'軸'});});};
 /* D4·2 管理框架 */
 SL.rca2=()=>{title('原因分析 · 管理框架 Fishbone, 8D & RACI','魚骨圖 6M、8D 步驟條、問題陳述卡、問題→原因→對策、RACI 分工、PDCA：8D／異常報告常用');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();
  comp('A','魚骨圖 6M','Fishbone',{x:X0,y:Y0,w:7.3,h:2.5},(x,y,w,h)=>{const sy=y+h/2,hx=x+w-1.5;ln(x+.1,sy,hx,sy,{c:G.t2,w:2,head:'triangle',hs:'lg'});box(hx+.05,sy-.4,1.45,.8,{fill:W2,line:AL,lw:1.75,r:.08,text:[{t:'問題',b:1,c:ALd,br:1},{t:'不良率上升',s:10.5,c:G.ink}],size:Z(12),lsp:1.05,name:'問題'});
   const M=[['人','新人不熟'],['機','參數漂移'],['料','批次差異'],['法','SOP 未更新'],['環','溫濕波動'],['測','量測誤差']];M.forEach(([k,t],i)=>{const top=i<3,j=i%3,bx=x+.6+j*(hx-x-.6)/3+.9,ey=top?y+.18:y+h-.18;ln(bx-.55,ey,bx,sy,{c:G.l1,w:1,name:'分支線'});
    box(bx-1.0,top?ey-.14:ey-.16,.44,.3,{fill:i===1||i===3?P:DARK,r:'full',text:k,size:10.5,bold:1,color:W2,margin:0,name:'骨名'});T(bx-.5,top?ey-.16:ey-.16,1.2,.32,t,{size:10.5,color:G.ink,wrap:0,name:'原因'});});});
  comp('B','8D 步驟條','8D steps',{x:X0+7.6,y:Y0,w:CW-7.6,h:1.0},(x,y,w,h)=>{const n=8,sw=(w+(n-1)*.05)/n;['團隊','描述','圍堵','根因','對策','驗證','預防','結案'].forEach((t,i)=>{const f=i<4?DARK:i===4?P:'E6E6E6';el(i?'chevron':'homePlate',x+i*(sw-.05),y,sw,.44,{fill:f,adj:.1,text:'D'+(i+1),size:10,bold:1,color:lum(f)>.55?G.t2:W2,font:nf,margin:0,name:'8D 步驟'});
   T(x+i*(sw-.05),y+.5,sw,.26,t,{size:10,color:i===4?P:G.t2,bold:i===4,align:'center',wrap:0,name:'步驟名'});});});
  comp('C','問題陳述卡','Problem statement',{x:X0+7.6,y:Y0+1.36,w:CW-7.6,h:1.14},(x,y,w,h)=>{card(x,y,w,h,{line:AL,lw:1.25});const cw=w/4;[['What','CMP 刮傷'],['Where','B 線 #3'],['When','W40 起'],['How much','+0.8%']].forEach(([k,v],i)=>{const xx=x+i*cw;if(i)ln(xx,y+.18,xx,y+h-.18,{c:G.l2,w:.75});
   T(xx+.12,y+.14,cw-.2,.26,k,{size:10,bold:1,color:ALd,font:nf,wrap:0,name:'欄名'});T(xx+.12,y+.46,cw-.2,.5,v,{size:Z(12),bold:1,color:G.ink,valign:'top',name:'內容'});});});
  const y2=4.78,h2=1.72,cw3=(CW-.6)/3;
  comp('D','問題 → 原因 → 對策','Problem → cause → action',{x:X0,y:y2,w:cw3,h:h2},(x,y,w,h)=>{const bw=(w-.6)/3;const B=[['問題','交期延誤',{fill:W2,line:AL,lw:1.5,c:ALd}],['原因','排程未同步',{fill:'F2F2F2',c:G.ink}],['對策','每週排程會',{fill:P,c:W2}]].map(([a,b,L],i)=>box(x+i*(bw+.3),y+.1,bw,h-.2,{fill:L.fill,line:L.line,lw:L.lw,r:.08,lsp:1.1,
   text:[{t:a,b:1,s:Z(13),c:L.c,br:1},{t:b,s:10.5,c:L.c===W2?W2:G.t2}],size:Z(12),name:a}));link(B[0],3,B[1],1);link(B[1],3,B[2],1);});
  comp('E','RACI 分工表','RACI',{x:X0+cw3+.3,y:y2,w:cw3,h:h2},(x,y,w,h)=>{const roles=['PM','製程','品保','設備'],cr=Math.min(.45*1.4,(w-1.2)/4),c0=w-4*cr,rh=.3;const M=[['A','R','C','I'],['A','C','R','I'],['I','A','C','R']];
   table(x,y,[c0,cr,cr,cr,cr],[rh,rh,rh,rh],[[{t:'工作',bold:1,color:G.t2,align:'left',bB:{c:P,w:1.25}}].concat(roles.map(r=>({t:r,bold:1,bB:{c:P,w:1.25}})))].concat(['需求定義','製程驗證','設備改造'].map(t=>[{t,align:'left',bB:{c:G.l2,w:.5}}].concat(roles.map(()=>({t:'',bB:{c:G.l2,w:.5}}))))),{size:10.5,name:'RACI 表格'});
   const look={R:[P,W2],A:[AC2,W2],C:[TN(P,.8),PD],I:[W2,G.t2]};M.forEach((row,i)=>row.forEach((k,j)=>{const [f,c]=look[k];box(x+c0+cr*(j+.5)-.18,y+rh*(i+1.5)-.11,.36,.22,{fill:f,line:k==='I'?G.line:null,lw:.75,r:'full',text:k,size:10,bold:1,color:c,margin:0,font:nf,name:'RACI 標記'});}));
   let lx=x;[['R','執行'],['A','當責'],['C','諮詢'],['I','知會']].forEach(([k,t])=>{T(lx,y+4*rh+.08,.9,.26,[{t:k+' ',b:1,c:P,f:nf},{t}],{size:10,color:G.t2,wrap:0,name:'圖例'});lx+=w/4;});});
  comp('F','PDCA 循環','PDCA',{x:X0+2*(cw3+.3),y:y2,w:cw3,h:h2},(x,y,w,h)=>{const bw=(w-.5)/2,bh=(h-.36)/2;const S=[['P','計畫'],['D','執行'],['C','查核'],['A','行動']];const pos=[[0,0],[1,0],[1,1],[0,1]];
   const B=S.map(([k,t],i)=>box(x+pos[i][0]*(bw+.5),y+pos[i][1]*(bh+.36),bw,bh,{fill:i===0?P:W2,line:i===0?null:G.l1,lw:1.25,r:.08,text:[{t:k+' ',b:1,s:Z(15),f:nf},{t,s:Z(12),b:1}],size:12,color:i===0?W2:G.ink,name:'PDCA '+k}));
   link(B[0],3,B[1],1);link(B[1],2,B[2],0);link(B[2],1,B[3],3);link(B[3],0,B[0],2);});};
 /* D5 決策與下一步 */
 SL.decide=()=>{title('決策與下一步 Decision & Next Steps','行動項目表、決策倒數、決策框、三段下一步、行動卡、需要的支援');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const AMB='8C8C8C';
  comp('A','行動項目表（原生表格）','Action items',{x:X0,y:Y0,w:5.5,h:2.3},(x,y,w,h)=>{const cw=[.4,2.6,.85,.75,.9];const S={完成:GOOD,進行中:G.t2,延遲:BAD};const rows=[['#','行動 Action','負責','到期','狀態'],['1','鎖定 CMP 參數並更新 SOP','陳怡君','10/25','完成'],['2','B 線擴線產能評估','黃承','11/08','進行中'],['3','供應商來料批次管制','林維','11/15','延遲'],['4','C 線導入計畫提報','孫宇','11/30','進行中']];
   table(x,y,cw,[.38,.46,.46,.46,.46],rows.map((r,ri)=>r.map((c,ci)=>{const o={t:c,bB:{c:G.l2,w:.5}};if(ri===0)Object.assign(o,{bold:1,color:W2,fill:DARK,bB:null});else{if(ci===1)o.align='left';if(ci===0)Object.assign(o,{bold:1,color:P,font:nf});if(ci===3)o.font=nf;if(ci===4)Object.assign(o,{bold:1,size:10.5,color:S[c],t:({完成:'✓ ',進行中:'◐ ',延遲:'▲ '}[c]||'○ ')+c});}return o;})),{size:Z(11),name:'行動項目表'});});
  comp('B','決策倒數','Countdown',{x:X0+5.75,y:Y0,w:1.7,h:2.3},(x,y,w,h)=>{card(x,y,w,h);T(x,y+.14,w,.28,'距決策期限',{size:10.5,color:G.t2,align:'center',wrap:0,name:'標題'});
   T(x,y+.46,w,.78,[{t:'18',s:Z(36),b:1,c:P,f:nf},{t:' 天',s:Z(13),c:G.ink}],{align:'center',wrap:0,name:'倒數'});const bw=w-.4;box(x+.2,y+1.36,bw,.1,{fill:G.l2,r:'full',name:'進度底'});box(x+.2,y+1.36,bw*.6,.1,{fill:P,r:'full',name:'進度'});
   T(x,y+1.56,w,.26,'11/05 前回覆',{size:10.5,bold:1,color:G.ink,align:'center',wrap:0,name:'期限'});T(x,y+1.86,w,.26,'已過 60%',{size:10,color:G.mute,align:'center',wrap:0,name:'註'});});
  comp('C','決策框（強調）','Decision box',{x:X0+7.7,y:Y0,w:CW-7.7,h:2.3},(x,y,w,h)=>{box(x,y,w,h,{fill:TN(P,.92),r:.1,name:'決策底'});pill(x+.2,y+.16,1.6,.32,'需要您決定',DARK,{size:Z(11)});T(x+1.92,y+.16,w-2.0,.32,'11/05 前',{size:10.5,color:G.mute,font:nf,name:'期限'});
   [['A','B 線擴線（推薦）','+12% 產能 · 投資 2.4 億 · 6 個月',1],['B','維持現況','零投資 · Q2 起產能不足']].forEach(([k,t,s,rec],i)=>{const yy=y+.62+i*.8;box(x+.2,yy,w-.4,.68,{fill:W2,line:rec?P:G.l2,lw:rec?1.5:.75,r:.08,name:'選項'});bdg(x+.48,yy+.34,.36,k,rec?P:'BFBFBF');
    T(x+.78,yy+.06,w-1.1,.3,t,{size:Z(12),bold:1,color:rec?P:G.ink,wrap:0,name:'選項名'});T(x+.78,yy+.36,w-1.1,.26,s,{size:10.5,color:G.t2,wrap:0,name:'影響'});});});
  const y2=4.62,h2=1.88;
  comp('D','三段下一步','Next steps timeline',{x:X0,y:y2,w:5.2,h:h2},(x,y,w,h)=>{const cw=(w-.4)/3;[['本週','This week',['鎖定參數','SOP 發行']],['下月','Next month',['B 線評估','人員訓練']],['下季','Next quarter',['C 線導入','成本覆盤']]].forEach(([a,b,L],i)=>{const xx=x+i*(cw+.2);
   el(i?'chevron':'homePlate',xx,y,cw+.12,.42,{fill:i===0?P:i===1?TN(P,.4):'E6E6E6',adj:.14,text:a,size:Z(11.5),bold:1,color:i<2?W2:G.t2,margin:0,name:'階段'});T(xx,y+.46,cw,.26,b,{size:10,color:G.mute,font:nf,align:'center',wrap:0,name:'英文'});
   L.forEach((t,j)=>{circ(xx+.12,y+.95+j*.36,.08,{fill:i===0?P:G.l1,name:'項目符號'});T(xx+.24,y+.8+j*.36,cw-.26,.3,t,{size:10.5,color:G.ink,wrap:0,name:'行動'});});});});
  comp('E','行動卡（負責人＋到期）','Action cards',{x:X0+5.5,y:y2,w:3.6,h:h2},(x,y,w,h)=>{[['鎖定 CMP 參數','陳怡君','10/25',GOOD],['擴線產能評估','黃承','11/08',P],['來料批次管制','林維','11/15',BAD]].forEach(([t,o,d,c],i)=>{const yy=y+i*.62;card(x,yy,w,.52);bdg(x+.28,yy+.26,.3,String(i+1),DARK,{size:10});
   T(x+.52,yy+.02,w-.6,.28,t,{size:Z(11),bold:1,color:G.ink,wrap:0,name:'行動'});T(x+.52,yy+.26,w-.6,.24,[{t:o,b:1,c:G.t2},{t:'  · '+d,c:G.mute,f:nf}],{size:10,wrap:0,name:'負責與到期'});T(x+w-.42,yy+.06,.36,.4,c===GOOD?'✓':c===BAD?'▲':'◐',{size:12,bold:1,color:c,align:'center',font:nf,wrap:0,name:'狀態符號'});});});
  comp('F','需要的支援','Asks',{x:X0+9.4,y:y2,w:CW-9.4,h:h2},(x,y,w,h)=>{box(x,y,w,h,{fill:W2,line:G.ink,lw:1,r:.08,name:'支援框'});T(x+.16,y+.1,w-.3,.3,[{t:'需要的支援 ',b:1,c:G.ink},{t:'Asks',s:10,c:G.mute,f:nf}],{size:Z(12),name:'標題'});
   [['人力','製程工程師 ×2'],['預算','治具 NT$ 80 萬'],['跨部門','IT 開放 MES API']].forEach(([a,b],i)=>{const yy=y+.5+i*.42;pill(x+.16,yy,.72,.28,a,TN(P,.85),{size:10,color:PD});T(x+.96,yy,w-1.06,.28,b,{size:10.5,color:G.ink,wrap:0,name:'內容'});});});};
 /* E3 截圖與圖片框 */
 SL.shots=()=>{title('截圖與裝置框 Screens & Devices','灰藍示意圖是真的圖片：PowerPoint 右鍵 →「變更圖片」換成你的截圖；外框、編號、遮罩都是原生圖形');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,2,Y0,Y1);const BZ='2B2B2B';
  comp('A','圖片框 16:9＋圖說','16:9 frame',C[0],(x,y,w,h)=>{const ih=Math.min(h-.36,w*9/16),iw=ih*16/9,ix=x+(w-iw)/2;ph(ix,y,iw,ih);T(ix,y+ih+.08,iw,.26,[{t:'圖 1 ',b:1,c:P},{t:'B 線良率看板（每日 8:00 更新）'}],{size:10.5,color:G.t2,wrap:0,name:'圖說'});});
  comp('B','筆電框','Laptop mockup',C[1],(x,y,w,h)=>{const sh=h-.3,sw=Math.min(w-.6,(sh-.16)*16/9+.16),sx=x+(w-sw)/2;box(sx,y,sw,sh,{fill:BZ,r:.08,name:'螢幕外框'});ph(sx+.08,y+.08,sw-.16,sh-.16,'螢幕畫面（右鍵→變更圖片）','w');
   el('trapezoid',sx-.3,y+sh,sw+.6,.2,{fill:'D9D9D9',line:'BFBFBF',lw:.5,adj:.08,name:'底座'});box(sx+sw/2-.4,y+sh,.8,.06,{fill:'BFBFBF',r:0,name:'凹槽'});});
  comp('C','手機框','Phone mockup',C[2],(x,y,w,h)=>{const ph2=h,pw=ph2*.49,gap=.5,tw2=pw*2+gap,x0=x+(w-tw2)/2;[0,1].forEach(i=>{const px=x0+i*(pw+gap);box(px,y,pw,ph2,{fill:BZ,r:.22,name:'手機外框'});ph(px+.07,y+.07,pw-.14,ph2-.14,'手機畫面（右鍵→變更圖片）','t');box(px+pw/2-.22,y+.12,.44,.1,{fill:BZ,r:'full',name:'瀏海'});});});
  comp('D','瀏覽器視窗框','Browser frame',C[3],(x,y,w,h)=>{const bh=Math.min(h,(w-.12)*9/16+.4),bw=Math.min(w,(bh-.4)*16/9+.12),bx=x+(w-bw)/2;box(bx,y,bw,bh,{fill:W2,line:G.l1,lw:1,r:.08,name:'視窗框'});box(bx,y,bw,.3,{fill:'EFEFEF',r:.08,name:'網址列底'});['8C8C8C','A6A6A6','BFBFBF'].forEach((c,i)=>circ(bx+.16+i*.17,y+.15,.1,{fill:c,name:'視窗按鈕'}));
   box(bx+.7,y+.07,bw-.9,.16,{fill:W2,r:'full',name:'網址列'});T(bx+.8,y+.04,bw-1,.22,'yieldboard.example.com',{size:10,color:G.t2,font:nf,wrap:0,name:'網址'});ph(bx+.06,y+.36,bw-.12,bh-.42,'網頁畫面（右鍵→變更圖片）','w');});
  comp('E','截圖＋編號釘＋說明','Pins + legend',C[4],(x,y,w,h)=>{const ih=h-.5,iw=Math.min(w,ih*16/9),ix=x+(w-iw)/2;ph(ix,y,iw,ih,null,'w');[[1,.2,.25],[2,.5,.6],[3,.8,.6]].forEach(([n,fx,fy])=>AN.pin(n,ix+iw*fx,y+ih*fy,ix+iw*fx-.25,y+ih*fy-.2,{d:.3,dot:.06,size:10}));
   ['1 篩選列','2 趨勢圖','3 達成率'].forEach((t,i)=>T(ix+i*iw/3,y+ih+.14,iw/3,.28,t,{size:10.5,color:G.ink,wrap:0,name:'說明'}));});
  comp('F','半透明遮罩聚焦（黑 60%）','Spotlight mask',C[5],(x,y,w,h)=>{const ih=h,iw=Math.min(w,ih*16/9),ix=x+(w-iw)/2;ph(ix,y,iw,ih,null,'w');const hx=ix+iw*.64,hy=y+ih*.42,hw=iw*.33,hh=ih*.52,m={fill:'000000',ft:40,name:'遮罩'};
   box(ix,y,iw,hy-y,m);box(ix,hy+hh,iw,y+ih-hy-hh,m);box(ix,hy,hx-ix,hh,m);box(hx+hw,hy,ix+iw-hx-hw,hh,m);box(hx,hy,hw,hh,{line:AC2||P,lw:2,r:0,name:'聚焦框'});
   pill(ix+.15,y+.15,1.5,.3,'重點：達成率',P,{size:10});});};
 SL.story=()=>{title('引言與故事 Storytelling','開場鉤子、引言、故事三幕、金句與結尾行動呼籲');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(4,2,Y0,Y1);const MK=TN(AC2,.62);
  comp('A','大引言','Quote',C[0],(x,y,w,h)=>{txt(x,y-.1,.9,.8,'“',{size:40,bold:1,color:P,font:'Georgia',valign:'top',name:'引號'});T(x+.1,y+.56,w-.1,.9,'把結論放第一頁，\n主管才會看第二頁。',{size:Z(15),bold:1,color:G.ink,valign:'top',lsp:1.1,name:'引言'});
   ln(x+.1,y+1.56,x+.5,y+1.56,{c:P,w:1.5});T(x+.6,y+1.42,w-.6,.28,'製造處 處長',{size:10.5,color:G.mute,name:'出處'});});
  comp('B','客戶聲音 VOC','Voice of customer',C[1],(x,y,w,h)=>{[['交期終於穩定了','客戶 A · 採購'],['報表一眼看懂','客戶 B · 品保'],['回覆速度快很多','客戶 C · PM']].forEach(([q,s],i)=>{const yy=y+i*.62;box(x,yy,w,.52,{fill:'F7F7F7',r:.08,name:'聲音卡'});box(x,yy,.06,.52,{fill:i===0?P:G.l1,name:'色條'});
   T(x+.18,yy+.02,w-.3,.28,'「'+q+'」',{size:Z(11.5),bold:1,color:G.ink,wrap:0,name:'客戶原話'});T(x+.18,yy+.27,w-.3,.24,s,{size:10,color:G.mute,wrap:0,name:'來源'});});});
  comp('C','驚人數字開場','Stat hook',C[2],(x,y,w,h)=>{T(x,y,w,.3,'你知道嗎？',{size:Z(12),bold:1,color:G.mute,name:'引子'});txt(x,y+.24,w,1.04,[{t:'37',b:1,c:P,f:nf},{t:' 小時',s:Z(16),c:G.ink,b:1}],{size:Z(54),valign:'middle',name:'驚人數字'});
   T(x,y+1.24,w,.5,'每月花在手動整理報表的時間',{size:Z(12),color:G.t2,valign:'top',name:'說明'});});
  comp('D','提問開場','Question hook',C[3],(x,y,w,h)=>{box(x,y,w,h,{fill:DARK,r:.1,name:'提問底'});T(x+.24,y+.24,w-.48,.3,'先問一個問題',{size:10.5,color:G.l1,name:'引子'});T(x+.24,y+.6,w-.48,.9,'如果良率再升 1%，\n一年能省多少？',{size:Z(17),bold:1,color:W2,valign:'top',lsp:1.1,name:'問題'});
   box(x+.24,y+h-.34,.5,.05,{fill:AC2,name:'色條'});});
  comp('E','故事三幕','Story arc',C[4],(x,y,w,h)=>{const cw=(w+.14)/3;[['情境','Situation'],['衝突','Conflict'],['解方','Resolution']].forEach(([a,b],i)=>{el(i?'chevron':'homePlate',x+i*(cw-.07),y,cw,.5,{fill:i===2?P:i===1?TN(P,.5):'E6E6E6',adj:.14,text:a,size:Z(12),bold:1,color:i?W2:G.ink,margin:0,name:'幕'});
   T(x+i*(cw-.07),y+.56,cw,.26,b,{size:10,color:G.mute,font:nf,align:'center',wrap:0,name:'英文'});});['產能滿載','客訴上升','擴線＋調參'].forEach((t,i)=>T(x+i*(cw-.07),y+.84,cw,.3,t,{size:10.5,bold:1,color:G.ink,align:'center',valign:'top',name:'內容'}));ln(x,y+1.2,x+w,y+1.2,{c:G.l2,w:.5,name:'分隔線'});['訂單 +30%\n三條線滿載','交期延誤\n客訴 ×2','B 線擴線\n參數優化'].forEach((t,i)=>T(x+i*(cw-.07),y+1.26,cw,.4,t,{size:9,color:G.t2,align:'center',valign:'top',lsp:1.05,name:'事件說明'}));});
  comp('F','一句話總結','One-line takeaway',C[5],(x,y,w,h)=>{pill(x,y+.1,1.1,.32,'一句話總結',P,{size:10.5});T(x,y+.56,w,1.0,'不是做更多，\n是先做對的 20%。',{size:Z(18),bold:1,color:G.ink,valign:'top',lsp:1.1,name:'總結'});});
  comp('G','金句＋半高螢光筆','Marker statement',C[6],(x,y,w,h)=>{T(x,y+.1,w,.3,'本季關鍵',{size:10.5,color:G.mute,name:'引子'});const s=Z(20),t='資料先於意見',m=txt(x,y+.5,tw(t,s)*1.06+.08,s*1.3/72,[{t,b:1}],{size:s,color:G.ink,valign:'middle',name:'半高螢光筆'});m.mk={c:MK,a:.55,b:.92};
   T(x,y+1.0,w,.6,'每個結論都附資料來源與截止日',{size:10.5,color:G.t2,valign:'top',name:'說明'});});
  comp('H','結尾行動呼籲 CTA','Closing CTA',C[7],(x,y,w,h)=>{card(x,y,w,h,{line:P,lw:1.25});pill(x+.18,y+.16,1.0,.3,'下一步',DARK,{size:10.5});
   ['11/05 前核准擴線','指派 2 位工程師'].forEach((t,i)=>{bdg(x+.32,y+.72+i*.4,.28,String(i+1),P,{size:10});T(x+.54,y+.58+i*.4,w-.7,.3,t,{size:Z(11),color:G.ink,wrap:0,name:'行動'});});T(x+.18,y+h-.36,w-.3,.28,'聯絡：yc.chen@example.com',{size:10,color:G.mute,font:nf,wrap:0,name:'聯絡'});});
  comp('I','前後對照句','Before / After line',C[4],(x,y,w,h)=>{[['以前','每週手動彙整報表 6 小時',G.t2,'F2F2F2'],['現在','自動報表，10 分鐘看完',P,TN(P,.9)]].forEach(([k,t,c,f],i)=>{const yy=y+.05+i*.86;box(x,yy,w,.7,{fill:f,r:.08,name:'對照底'});pill(x+.14,yy+.2,.62,.3,k,i?P:'8C8C8C',{size:10});T(x+.86,yy,w-.96,.7,t,{size:Z(11.5),bold:i,color:i?G.ink:G.t2,name:'對照句'});});
   T(x,y+.7,w,.2,'▼',{size:10,color:P,align:'center',wrap:0,name:'箭頭'});});
  comp('J','迷你時間軸故事','Mini timeline',C[5],(x,y,w,h)=>{const L=[['3 月','客訴暴增'],['6 月','找到根因'],['9 月','良率回升']];ln(x+.15,y+.35,x+w-.15,y+.35,{c:G.l1,w:1.5});L.forEach(([d,t],i)=>{const cx0=x+.15+i*(w-.3)/2;circ(cx0,y+.35,.2,{fill:i===2?P:W2,line:i===2?P:G.l1,lw:1.5,name:'時間點'});
   T(cx0-.6,y,1.2,.24,d,{size:10,bold:1,color:i===2?P:G.t2,align:'center',font:nf,wrap:0,name:'日期'});T(cx0-.6,y+.52,1.2,.5,t,{size:10.5,color:G.ink,align:'center',valign:'top',name:'事件'});});
   T(x,y+1.1,w,.5,'用 3 個時間點講完一個轉折',{size:10,color:G.t2,valign:'top',name:'說明'});});
  comp('K','人物卡 Persona','',C[0],(x,y,w,h)=>{av(x+.36,y+.4,.72,'林');T(x+.86,y+.08,w-.9,.3,'林課長｜CMP 課',{size:Z(11.5),bold:1,color:G.ink,wrap:0,name:'人物'});T(x+.86,y+.4,w-.9,.26,'每天早上先救火 2 小時',{size:10,color:G.t2,wrap:0,name:'處境'});
   box(x,y+.92,w,.62,{fill:'F7F7F7',r:.08,name:'痛點底'});T(x+.14,y+.92,w-.24,.62,'「我需要的是一眼看出哪台機台出問題。」',{size:10.5,color:G.ink,name:'痛點'});});
  comp('L','三點收尾','Three takeaways',C[1],(x,y,w,h)=>{T(x,y,w,.3,'今天只要記得 3 件事',{size:Z(12),bold:1,color:G.ink,wrap:0,name:'標題'});['結論放第一頁','數字要有比較基準','每頁只講一件事'].forEach((t,i)=>{const yy=y+.42+i*.38;bdg(x+.14,yy+.14,.28,String(i+1),i?DARK:P,{size:10});T(x+.36,yy,w-.4,.28,t,{size:Z(11),color:G.ink,wrap:0,name:'要點'});});});};
 /* F 頁型骨架：結論先行標題＋標準頁尾；右下標示本頁使用元件 */
 const used=(codes,y)=>{codes=codes||USED[cur.key];const t='本頁使用元件：'+codes.join('・');const w=Math.min(6,tw(t,10)+.4);box(X1-w,y||6.56,w,.28,{fill:'F2F2F2',r:'full',text:t,size:10,color:G.t2,margin:0,name:'使用元件'});};
 const srcFoot=(t)=>{ln(X0,6.5,X0+5.6,6.5,{c:G.l2,w:.75});txt(X0,6.56,5.6,.28,[{t:'資料來源 ',b:1,c:G.t2},{t}],{size:10,color:G.mute,valign:'middle',name:'來源'});};
 const skel=(h,s)=>{cur.tsz=Math.min(st.tSize,28);title(h,s);};
 SL.sum=()=>{skel('B 線良率三週回升至 98.6%，CMP 優化見效','依據：W40–W42 MES 晶圓資料；以下 3 個支撐點');const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();
  grp('結論大字框',()=>{box(X0,Y0,4.4,4.4,{fill:TN(P,.92),r:.12,name:'結論底'});pill(X0+.3,Y0+.3,.9,.32,'結論',DARK,{size:Z(11)});txt(X0+.3,Y0+.9,3.9,1.0,[{t:'+1.2',b:1,c:P,f:nf},{t:' pt',s:Z(18),c:G.mute,f:nf}],{size:Z(54),valign:'middle',name:'關鍵數字'});
   T(X0+.3,Y0+2.0,3.9,1.2,'良率回到目標以上，\n下季可擴線到 C 線',{size:Z(18),bold:1,color:G.ink,valign:'top',lsp:1.15,name:'結論句'});T(X0+.3,Y0+3.6,3.9,.5,'vs. 上季 97.4%',{size:Z(12),color:G.t2,name:'比較基準'});});
  [['參數鎖定','CMP 壓力與轉速固定後，刮傷率 −62%','62%'],['人員到位','SOP 改版＋12 人完成訓練，誤操作 0 件','0 件'],['持續監控','SPC 管制圖每日更新，連 3 週在管制內','3 週']].forEach(([t,s,n],i)=>{const y=Y0+i*1.5;
   grp('支撐點 '+(i+1),()=>{card(X0+4.8,y,CW-4.8,1.32);bdg(X0+5.2,y+.66,.5,two(i+1),i===0?P:DARK,{size:Z(14)});T(X0+5.6,y+.2,4.6,.36,t,{size:Z(16),bold:1,color:G.ink,name:'支撐標題'});
    T(X0+5.6,y+.6,4.9,.5,s,{size:Z(12),valign:'top',name:'支撐內容'});txt(X1-1.7,y+.3,1.5,.7,n,{size:Z(26),bold:1,color:i===0?P:G.ink,font:nf,align:'right',valign:'middle',name:'數值'});});});
  srcFoot('MES／YMS，資料截止 2026/10/16');used(['A0','A2·F','A4·A','C1']);};
 SL.pcn=()=>{skel('交期延誤主因是排程未同步，建議導入每週排程會','8D 摘要：問題 → 原因 → 對策 → 下一步');const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const cw=(CW-.9)/3,h=2.9;
  [['問題','Problem','交期延誤率 18%',['客訴 8 件／月','急單插單無評估','加班費 +22%'],AL],['原因','Root cause','排程未同步',['業務、生管各自排程','變更沒有凍結點','缺單一窗口'],G.t2],['對策','Countermeasure','每週排程會',['設需求凍結點 T−5','變更走單一窗口','延誤率週報追蹤'],P]].forEach(([a,b,c,L,col],i)=>{const x=X0+i*(cw+.45);
   grp(a,()=>{card(x,Y0,cw,h,i===0?{line:G.t2,lw:1.5}:i===2?{line:P,lw:1.5}:{});pill(x+.24,Y0+.22,1.0,.32,a,i===2?P:DARK,{size:Z(11.5)});T(x+1.34,Y0+.22,cw-1.5,.32,b,{size:10.5,color:G.mute,font:nf,name:'英文'});
    T(x+.24,Y0+.74,cw-.48,.5,c,{size:Z(20),bold:1,color:i===0?ALd:i===2?P:G.ink,name:'重點'});ln(x+.24,Y0+1.36,x+cw-.24,Y0+1.36,{c:G.l2,w:.75});L.forEach((t,j)=>{circ(x+.32,Y0+1.68+j*.46,.09,{fill:col,name:'項目符號'});T(x+.48,Y0+1.52+j*.46,cw-.7,.32,t,{size:Z(12),color:G.ink,name:'內容'});});});
   if(i<2)chev(x+cw+.16,Y0+h/2-.1,.2,G.t2,2);});
  grp('下一步列',()=>{const y=Y0+h+.3;box(X0,y,CW,1.06,{fill:'F7F7F7',r:.1,name:'下一步底'});pill(X0+.24,y+.36,1.0,.34,'下一步',DARK,{size:Z(11.5)});
   [['T−5 凍結點上線','陳怡君','10/25'],['每週一排程會','黃承','11/01'],['月底檢討延誤率','林維','11/30']].forEach(([t,o,d],i)=>{const x=X0+1.5+i*3.55;bdg(x+.16,y+.53,.3,String(i+1),P,{size:10});T(x+.38,y+.2,3.1,.32,t,{size:Z(12),bold:1,color:G.ink,name:'行動'});T(x+.38,y+.54,3.1,.28,[{t:o,b:1,c:G.t2},{t:'  · '+d,c:G.mute,f:nf}],{size:10,name:'負責與到期'});});});
  srcFoot('生管排程系統，W30–W42');used(['A0','D6','D8','A4·C']);};
 SL.weekly=()=>{skel('W42 良率達標、交期改善，B 線產能仍是風險','週報一頁：KPI → 議題 → 下一步');const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const AMB='8C8C8C';const gw=.2,cw=(CW-3*gw)/4;
  [['良率','98.6','%','▲ 0.4 pt',GOOD],['產出','12.4','K','▲ 3%',GOOD],['交期','7.2','天','▼ 0.5 天',GOOD],['產能利用','96','%','逼近上限',AMB]].forEach(([a,v,u,d,c],i)=>{const x=X0+i*(cw+gw);grp('KPI '+a,()=>{card(x,Y0,cw,1.16);box(x+.16,Y0,.5,.05,{fill:i===0?P:G.l1,name:'頂邊色條'});T(x+.18,Y0+.1,cw-.6,.3,a,{size:Z(12),bold:1,color:G.ink,name:'指標'});light(x+cw-.26,Y0+.25,.14,c);
   txt(x+.18,Y0+.4,cw-.36,.46,[{t:v,b:1,c:DARK,f:nf},{t:' '+u,s:Z(12),c:G.mute,f:nf}],{size:Z(24),valign:'middle',name:'數值'});T(x+.18,Y0+.84,cw-.36,.26,d,{size:10.5,bold:1,color:c,name:'變化'});});});
  const y2=Y0+1.44;grp('議題表（原生表格）',()=>{T(X0,y2,7.4,.3,[{t:'議題 Issues',b:1,c:G.ink}],{size:Z(13),name:'標題'});const S={高:BAD,中:G.t2,低:P};const rows=[['議題','影響','負責','狀態'],['B 線產能 96%','高','黃承','評估中'],['來料批次差異','中','林維','管制中'],['新人訓練進度','低','孫宇','80%']];
   table(X0,y2+.38,[3.2,1.0,1.4,1.8],[.36,.36,.36,.36],rows.map((r,ri)=>r.map((c,ci)=>{const o={t:c,bB:{c:G.l2,w:.5}};if(ri===0)Object.assign(o,{bold:1,color:W2,fill:DARK,bB:null});else{if(ci===0)o.align='left';if(ci===1)Object.assign(o,{bold:1,color:S[c],t:'● '+c});if(ci===3){const g={評估中:['▲',AL],管制中:['◐',P],'80%':['✓',GOOD]}[c];if(g)Object.assign(o,{bold:1,color:g[1],t:g[0]+' '+c});}}return o;})),{size:Z(11.5),name:'議題表'});});
  grp('下一步清單',()=>{const x=X0+7.8,w=CW-7.8;card(x,y2,w,2.4);T(x+.2,y2+.12,w-.4,.32,'下一步 Next steps',{size:Z(13),bold:1,color:G.ink,name:'標題'});
   [['B 線擴線提案','11/05'],['來料 IQC 加嚴','11/08'],['訓練完成 100%','11/15']].forEach(([t,d],i)=>{const yy=y2+.6+i*.56;bdg(x+.36,yy+.16,.32,String(i+1),i===0?P:DARK,{size:10});T(x+.6,yy,w-1.6,.32,t,{size:Z(12),color:G.ink,name:'行動'});T(x+w-1.0,yy,.8,.32,d,{size:10.5,color:G.mute,font:nf,align:'right',name:'到期'});});});
  grp('決策需求列',()=>{const y=5.42;box(X0,y,7.4,.78,{fill:TN(P,.92),r:.1,name:'決策底'});pill(X0+.2,y+.24,1.4,.32,'需要您決定',DARK,{size:Z(11)});T(X0+1.76,y,5.5,.78,'11/05 前核准 B 線擴線提案（+12% 產能）',{size:Z(12.5),bold:1,color:PD,name:'決策內容'});});
  srcFoot('MES／生管，資料截止 2026/10/16');used(['A0','C1·D','D8·A','A4·A']);};
 /* G 求職與作品集 */
 SL.profile=()=>{title('自我介紹 Profile & Intro','自介卡、聯絡＋QR、職涯時間軸、價值主張、關於我數字、個人特質：面試第一頁與作品集封底');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();
  comp('A','自介卡（照片可換）','Intro card',{x:X0,y:Y0,w:5.6,h:2.1},(x,y,w,h)=>{card(x,y,w,h);photo(x+.89,y+1.05,1.3,'大頭照（右鍵→變更圖片）');T(x+1.8,y+.22,w-2.0,.44,'陳怡君',{size:Z(22),bold:1,color:G.ink,name:'姓名'});T(x+1.8,y+.66,w-2.0,.3,'製程整合工程師 · 6 年經驗',{size:Z(12),color:P,bold:1,name:'職稱'});
   T(x+1.8,y+1.0,w-2.0,.5,'用數據把良率問題變成可執行的改善',{size:Z(11.5),valign:'top',name:'一句話定位'});[['CMP',P],['SPC',DARK],['Python',DARK]].forEach(([t,c],i)=>pill(x+1.8+i*1.0,y+1.56,.9,.28,t,c,{size:10,font:nf}));});
  comp('B','聯絡＋QR','Contact & QR',{x:X0+5.9,y:Y0,w:3.0,h:2.1},(x,y,w,h)=>{card(x,y,w,h);ph(x+.2,y+.2,.9,.9,'QR Code（右鍵→變更圖片）');T(x+1.2,y+.24,w-1.3,.6,'掃描看\n作品集',{size:Z(12),bold:1,color:G.ink,valign:'top',name:'QR 說明'});
   [['mail','yc.chen@example.com'],['link','linkedin.com/in/ycchen'],['call','0912-345-678']].forEach(([ic,t],i)=>{const yy=y+1.24+i*.26;icon(ic,x+.2,yy,.2,{color:G.t2});T(x+.48,yy-.04,w-.56,.28,t,{size:10,color:G.t2,font:nf,wrap:0,name:'聯絡方式'});});});
  comp('C','關於我數字','About in numbers',{x:X0+9.2,y:Y0,w:CW-9.2,h:2.1},(x,y,w,h)=>{[['6','年','製程經驗'],['12','項','改善專案'],['3','件','專利']].forEach(([v,u,t],i)=>{const yy=y+i*.7;txt(x,yy,1.3,.6,[{t:v,b:1,c:i===0?P:G.ink,f:nf},{t:' '+u,s:10,c:G.t2}],{size:Z(26),valign:'middle',name:'數值'});T(x+1.3,yy,w-1.3,.6,t,{size:Z(12),color:G.t2,name:'說明'});});});
  const y2=4.38;
  comp('D','職涯時間軸','Career timeline',{x:X0,y:y2,w:7.4,h:1.38},(x,y,w,h)=>{const ay=y+.62,P4=[['2018','台大化工 碩士','學歷'],['2020','A 公司 製程工程師','良率 +2%'],['2023','B 公司 資深工程師','帶 4 人'],['2026','求職：製程整合','下一步']];const sp=w/4;ln(x,ay,x+w,ay,{c:G.line,w:1.25,head:'triangle'});
   P4.forEach(([yr,t,s],i)=>{const cx0=x+sp*(i+.5),now=i===3;circ(cx0,ay,.2,{fill:now?P:DARK,line:W2,lw:1.5,name:'時間點'});pill(cx0-.4,ay-.52,.8,.28,yr,now?P:'E6E6E6',{font:nf,size:10,color:now?W2:G.t2});
    T(cx0-sp/2,ay+.2,sp,.3,t,{size:10.5,bold:1,color:now?P:G.ink,align:'center',wrap:0,name:'經歷'});T(cx0-sp/2,ay+.5,sp,.26,s,{size:10,color:G.mute,align:'center',wrap:0,name:'成果'});});});
  comp('E','價值主張 3 點','I bring',{x:X0+7.7,y:y2,w:CW-7.7,h:1.38},(x,y,w,h)=>{[['數據分析','SPC／Python 自動化報表'],['跨部門溝通','整合製程、設備、品保'],['問題解決','8D 結案 12 件']].forEach(([a,b],i)=>{const yy=y+i*.46;bdg(x+.18,yy+.2,.34,two(i+1),i===0?P:DARK,{size:10});T(x+.46,yy,w-.46,.4,[{t:a+'　',b:1,c:G.ink},{t:b,c:G.t2}],{size:Z(11.5),wrap:0,name:'價值'});});});
  comp('F','個人特質標籤列','Traits',{x:X0,y:6.08,w:CW,h:.4},(x,y,w,h)=>{T(x,y,1.3,h,'個人特質',{size:Z(11),bold:1,color:G.ink,name:'標題'});let xx=x+1.4;['好奇','重視數據','樂於分享','抗壓','跨文化合作','終身學習'].forEach((t,i)=>{xx+=tag(xx,y+.05,t,{tone:i<2?'p':'g',size:10.5,h:.3})+.14;});});};
 SL.skills=()=>{title('技能與成就 Skills & Achievements','技能條、技能矩陣、雙系列能力條（取代雷達圖）、成就數字、證照學歷、語言、工具 chips：履歷頁與自評頁');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(4,2,Y0,Y1);
  comp('A','技能條','Skill bars',C[0],(x,y,w,h)=>{[['SPC 統計','90%'],['Python','75%'],['DOE 實驗','60%'],['簡報溝通','85%']].forEach(([t,p],i)=>{const yy=y+.04+i*.44,bw=w-.5;T(x,yy,bw,.24,t,{size:10.5,color:G.ink,wrap:0,name:'技能'});
   const pt=T(x+bw,yy,.5,.24,p,{size:10,bold:1,color:'262626',font:nf,align:'right',wrap:0,name:'百分比'});box(x,yy+.27,w,.08,{fill:'E6EAF0',r:'full',name:'進度底'});calc1(box(x,yy+.27,w*parseFloat(p)/100,.08,{fill:i===0?P:G.t2,r:'full',name:'進度條'}),pt,'pbar',{full:w});});});
  comp('B','技能矩陣（點數）','Skill matrix',C[1],(x,y,w,h)=>{['','入門','熟練','精通'].forEach((t,i)=>i&&T(x+1.2+(i-1)*(w-1.2)/3,y,(w-1.2)/3,.26,t,{size:10,color:G.mute,align:'center',wrap:0,name:'欄頭'}));
   [['製程整合',3],['資料分析',3],['設備維護',2],['專案管理',2],['英文',2]].forEach(([t,l],i)=>{const yy=y+.32+i*.32;T(x,yy,1.2,.28,t,{size:10.5,color:G.ink,wrap:0,name:'技能'});for(let k=1;k<=3;k++)circ(x+1.2+(k-.5)*(w-1.2)/3,yy+.14,.16,{fill:k<=l?P:'E3E3E3',name:'等級點'});});});
  comp('C','能力雙系列條（取代雷達）','Me vs target',C[2],(x,y,w,h)=>{const lw=.9,bw=w-lw;[['分析',.9,.8],['溝通',.7,.8],['領導',.55,.7],['技術',.85,.75]].forEach(([t,a,b],i)=>{const yy=y+.06+i*.38;T(x,yy,lw,.3,t,{size:10.5,color:G.ink,wrap:0,name:'能力'});
   box(x+lw,yy+.03,bw*a,.11,{fill:P,r:'full',name:'自評'});box(x+lw,yy+.17,bw*b,.11,{fill:G.l1,r:'full',name:'職缺要求'});});
   [[P,'我'],[G.l1,'職缺要求']].forEach(([c,t],i)=>{box(x+lw+i*1.2,y+1.62,.2,.14,{fill:c,r:.03,name:'色塊'});T(x+lw+i*1.2+.26,y+1.55,1.0,.28,t,{size:10,color:G.t2,wrap:0,name:'圖例'});});});
  comp('D','成就數字卡','Achievements',C[3],(x,y,w,h)=>{[['+2.1','pt','良率提升'],['NT$ 1,200','萬','年省成本'],['−35','%','交期縮短']].forEach(([v,u,t],i)=>{const yy=y+i*.6;txt(x,yy,w*.62,.52,[{t:v,b:1,c:i===0?P:G.ink,f:nf},{t:' '+u,s:10.5,c:G.mute}],{size:Z(18),valign:'middle',name:'數值'});T(x+w*.62,yy,w*.38,.52,t,{size:10.5,color:G.t2,name:'說明'});});});
  comp('E','證照與學歷','Credentials',C[4],(x,y,w,h)=>{[['school','台大 化工所 碩士','2018'],['workspace_premium','六標準差黑帶','2022'],['verified','PMP 專案管理','2024']].forEach(([ic,t,d],i)=>{const yy=y+.04+i*.56;icon(ic,x,yy,.42,{variant:'tint'});T(x+.54,yy,w-.54,.26,t,{size:Z(11),bold:1,color:G.ink,wrap:0,name:'證照'});T(x+.54,yy+.24,w-.54,.24,d,{size:10,color:G.mute,font:nf,name:'年份'});});});
  comp('F','語言能力','Languages',C[5],(x,y,w,h)=>{[['中文','母語',5],['英文','TOEIC 905',4],['日文','N3',2]].forEach(([t,s,l],i)=>{const yy=y+.06+i*.5;T(x,yy,.7,.28,t,{size:Z(11),bold:1,color:G.ink,name:'語言'});T(x,yy+.24,1.2,.24,s,{size:10,color:G.mute,font:nf,wrap:0,name:'程度'});for(let k=1;k<=5;k++)box(x+1.3+(k-1)*.28,yy+.1,.22,.12,{fill:k<=l?P:'E3E3E3',r:'full',name:'等級'});});});
  comp('G','工具 chips','Tool chips',C[6],(x,y,w,h)=>{let xx=x,yy=y+.04;['Python','JMP','Minitab','SQL','Power BI','Excel VBA','Git','Tableau'].forEach((t,i)=>{const cw=tw(t,10.5)+.34;if(xx+cw>x+w){xx=x;yy+=.42;}box(xx,yy,cw,.32,{fill:i<3?TN(P,.86):'F2F2F2',r:'full',text:t,size:10.5,bold:i<3,color:i<3?PD:G.t2,font:nf,margin:0,name:'工具'});xx+=cw+.1;});});
  comp('H','亮點列表（STAR 精簡）','Highlights',C[7],(x,y,w,h)=>{[['良率改善','+2.1 pt'],['自動化報表','每月省 37 h'],['跨廠導入','3 條產線']].forEach(([a,b],i)=>{const yy=y+.04+i*.52;box(x,yy,.06,.42,{fill:i===0?P:G.l1,name:'色條'});T(x+.16,yy,w-.16,.24,a,{size:Z(11),bold:1,color:G.ink,name:'亮點'});T(x+.16,yy+.22,w-.16,.22,b,{size:10,color:P,bold:1,font:nf,name:'成果'});});});
  comp('I','強項／待加強','Strengths & growth',C[0],(x,y,w,h)=>{[['強項',P,['數據分析','跨部門溝通','問題拆解']],['待加強',G.t2,['大型簡報','預算規劃','英文談判']]].forEach(([t,c,L],j)=>{const xx=x+j*(w/2+.05);pill(xx,y+.04,1.0,.28,t,j?'8C8C8C':P,{size:10});L.forEach((v,i)=>T(xx,y+.42+i*.32,w/2-.1,.28,(j?'○ ':'✓ ')+v,{size:10.5,color:j?G.t2:G.ink,wrap:0,name:'項目'}));});});
  comp('J','推薦語','Endorsement',{x:C[1].x,y:C[1].y,w:Math.min(3.9,(CW-.6)/3),h:C[1].h},(x,y,w,h)=>{box(x,y,w,1.5,{fill:'F7F7F7',r:.08,name:'推薦底'});T(x+.1,y+.02,.5,.7,'“',{size:30,bold:1,color:TN(P,.5),font:'Georgia',valign:'top',wrap:0,name:'引號'});T(x+.5,y+.18,w-.64,.8,'怡君能把複雜的製程問題講成主管 30 秒就懂的決策。',{size:10.5,color:G.ink,valign:'top',name:'推薦語'});T(x+.5,y+1.06,w-.64,.3,'— 王經理｜前主管',{size:10,color:G.t2,wrap:0,name:'推薦人'});});
  comp('K','學習計畫','Learning plan',C[2],(x,y,w,h)=>{[['Q1','Python 自動化報表','進行中',P],['Q2','英文簡報 B2','規劃',G.t2],['Q3','專案管理 PMP','規劃',G.t2]].forEach(([q,t,s0,c],i)=>{const yy=y+.04+i*.44;pill(x,yy,.5,.28,q,i?TN(P,.85):P,{size:10,color:i?PD:W2});T(x+.62,yy,w-1.5,.28,t,{size:10.5,bold:1,color:G.ink,wrap:0,name:'學習項目'});T(x+w-.85,yy,.85,.28,s0,{size:10,color:c,align:'right',wrap:0,name:'狀態'});if(i<2)ln(x,yy+.37,x+w,yy+.37,{c:G.l2,w:.5,name:'分隔線'});});});};
 SL.star=()=>{title('專案案例 STAR Case Study','情境 S → 任務 T → 行動 A → 結果 R：面試、升遷簡報、作品集的專案頁；可直接當一頁使用');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();
  comp('H','專案標頭卡','Project header',{x:X0,y:Y0,w:CW,h:.62},(x,y,w,h)=>{box(x,y,w,h,{fill:'F7F7F7',r:.1,name:'標頭底'});T(x+.24,y,4.6,h,'B 線 CMP 良率改善專案',{size:Z(16),bold:1,color:G.ink,name:'專案名稱'});
   [['角色','專案負責人'],['期間','2025/03–09'],['團隊','5 人跨部門']].forEach(([a,b],i)=>{const xx=x+5.0+i*2.35;pill(xx,y+.17,.62,.28,a,DARK,{size:10});T(xx+.7,y,1.6,h,b,{size:Z(11),color:G.ink,wrap:0,name:'資訊'});});});
  const y2=Y0+1.0,cw=(CW-.6)/4,h2=2.3;
  [['S','情境','Situation','B 線良率連 3 週低於目標，客訴增加'],['T','任務','Task','3 個月內良率回到 98% 以上'],['A','行動','Action','DOE 鎖定 CMP 參數、改版 SOP、訓練 12 人'],['R','結果','Result','良率 96.5 → 98.6%，年省 1,200 萬']].forEach(([k,zh,en,t],i)=>{const x=X0+i*(cw+.2);
   comp(k,zh+' '+en,'',{x,y:y2,w:cw,h:h2},(x,y,w,h)=>{card(x,y,w,h,i===3?{line:P,lw:1.5}:{});box(x+.2,y+.2,.6,.6,{fill:i===3?P:DARK,r:.08,text:k,size:Z(24),bold:1,color:W2,font:nf,margin:0,name:'STAR 字母'});T(x+.92,y+.2,w-1.0,.32,zh,{size:Z(14),bold:1,color:i===3?P:G.ink,name:'標題'});
    T(x+.92,y+.5,w-1.0,.28,en,{size:10.5,color:G.mute,font:nf,name:'英文'});ln(x+.2,y+.98,x+w-.2,y+.98,{c:G.l2,w:.75});T(x+.2,y+1.1,w-.4,1.0,t,{size:Z(12),color:G.ink,valign:'top',lsp:1.15,name:'內容'});});});
  const y3=y2+h2+.38;
  comp('N','成果數字列','Results',{x:X0,y:y3,w:7.6,h:1.1},(x,y,w,h)=>{[['+2.1','pt','良率'],['1,200','萬','年省成本'],['0','件','重複異常']].forEach(([v,u,t],i)=>{const xx=x+i*w/3;if(i)ln(xx,y+.1,xx,y+h-.1,{c:G.l2,w:.75});txt(xx+.2,y,w/3-.3,.66,[{t:v,b:1,c:i===0?P:G.ink,f:nf},{t:' '+u,s:Z(12),c:G.mute}],{size:Z(28),valign:'middle',name:'數值'});T(xx+.2,y+.68,w/3-.3,.3,t,{size:Z(11),color:G.t2,name:'說明'});});});
  comp('L','學到的事','Lessons',{x:X0+7.9,y:y3,w:CW-7.9,h:1.1},(x,y,w,h)=>{box(x,y,w,h,{fill:TN(P,.92),r:.1,name:'學習底'});pill(x+.18,y+.14,1.0,.28,'我學到',P,{size:10.5});T(x+.18,y+.5,w-.36,.56,'先用數據對齊問題，再談對策；跨部門要有單一窗口',{size:Z(11),color:G.ink,valign:'top',name:'學習'});});};
 SL.folio=()=>{title('作品集版面 Portfolio Layouts','2×2、主圖、作品卡、前後對比、深度頁、問題→成果：示意圖可右鍵「變更圖片」');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,2,Y0,Y1);
  comp('A','作品格 2×2','2×2 grid',C[0],(x,y,w,h)=>{const g=.12,iw=(w-g)/2,ih=(h-g-.52)/2;[0,1,2,3].forEach(i=>{const xx=x+(i%2)*(iw+g),yy=y+Math.floor(i/2)*(ih+.26+g);ph(xx,yy,iw,ih);T(xx,yy+ih,iw,.26,[{t:['看板設計','報表自動化','製程地圖','訓練教材'][i]+'  '},{t:['−2 天','37 h／月','3 廠','120 人'][i],b:1,c:P,f:nf}],{size:10,color:G.t2,wrap:0,name:'作品名'});});});
  comp('B','主圖＋側欄','Hero + notes',C[1],(x,y,w,h)=>{const iw=w*.6;ph(x,y,iw,h,null,'w');T(x+iw+.16,y,w-iw-.16,.3,'良率看板',{size:Z(13),bold:1,color:G.ink,name:'作品名'});['Power BI','每日自動更新','主管 3 秒看懂'].forEach((t,i)=>{circ(x+iw+.22,y+.56+i*.36,.08,{fill:i===0?P:G.l1,name:'項目符號'});T(x+iw+.34,y+.42+i*.36,w-iw-.36,.28,t,{size:10.5,color:G.t2,wrap:0,name:'重點'});});T(x+iw+.16,y+1.6,w-iw-.16,.3,[{t:'+1.2',b:1,c:P,f:nf},{t:' pt 良率',s:10,c:G.t2}],{size:Z(14),wrap:0,name:'成果數字'});});
  comp('C','三欄作品卡','3 project cards',C[2],(x,y,w,h)=>{const cw=(w-.24)/3;['看板','報表','SOP'].forEach((t,i)=>{const xx=x+i*(cw+.12);card(xx,y,cw,h);ph(xx+.08,y+.08,cw-.16,(cw-.16)*.75);T(xx+.1,y+.16+(cw-.16)*.75,cw-.2,.28,t,{size:Z(11),bold:1,color:G.ink,name:'作品名'});pill(xx+.1,y+.5+(cw-.16)*.75,cw-.2,.26,['BI','Python','教材'][i],TN(P,.86),{size:10,color:PD});T(xx+.1,y+.82+(cw-.16)*.75,cw-.2,.26,['−2 天','37 h','0 錯'][i],{size:10,bold:1,color:P,font:nf,wrap:0,name:'成果數字'});});});
  comp('D','作品前後對比','Before / after',C[3],(x,y,w,h)=>{const iw=(w-.4)/2,ih=h-.4;[['改版前',DARK],['改版後',P]].forEach(([t,c],i)=>{const xx=x+i*(iw+.4);ph(xx,y+.36,iw,ih,null,'w');pill(xx,y,.9,.28,t,c,{size:10});T(xx+1.0,y,iw-1.0,.28,['判讀 15 分','判讀 3 分'][i],{size:10,bold:i,color:i?P:G.t2,wrap:0,name:'成果數字'});});chev(x+iw+.13,y+.36+ih/2-.1,.2,G.t2,2);});
  comp('E','單一作品深度頁','Case deep-dive',C[4],(x,y,w,h)=>{const iw=w*.66;ph(x,y,iw,h,null,'w');[['挑戰','人工報表 2 天'],['做法','Python＋BI'],['成果','每日 8:00 自動']].forEach(([a,b],i)=>{const yy=y+i*(h/3);T(x+iw+.18,yy+.02,w-iw-.2,.28,a,{size:10.5,bold:1,color:i===2?P:G.t2,wrap:0,name:'段落標題'});T(x+iw+.18,yy+.3,w-iw-.2,.28,b,{size:10.5,color:G.ink,wrap:0,name:'段落內容'});if(i)ln(x+iw+.18,yy-.04,x+w,yy-.04,{c:G.l2,w:.75});});});
  comp('F','問題→解法→成果卡','Case card',C[5],(x,y,w,h)=>{card(x,y,w,h);const iw=w*.42;ph(x+.1,y+.1,iw,h-.2);[['問題','報表靠人工'],['解法','Python 自動化'],['成果','每月省 37 h']].forEach(([a,b],i)=>{const yy=y+.16+i*.54;pill(x+iw+.24,yy,.62,.26,a,i===2?P:DARK,{size:10});T(x+iw+.24,yy+.26,w-iw-.32,.26,b,{size:10.5,color:i===2?P:G.ink,bold:i===2,wrap:0,name:'內容'});});});};
 /* ================= v12 新頁：封面／章節／結尾頁型、地圖與據點、商業框架、提案與募資、30-60-90 ================= */
 const photo=(cx,cy,d,nm)=>{const it={t:'pic',x:cx-d/2,y:cy-d/2,w:d,h:d,png:PH.q,round:1,name:nm||'圓形照片（右鍵→變更圖片）'};cur.items.push(it);circ(cx,cy,d,{line:'FFFFFF',lw:3,name:'照片白邊'});return it;};
 const pinS=(x,y,s,c,t)=>{const r=s/2;path([[x-r*.62,y-s*.62],[x+r*.62,y-s*.62],[x,y]],{fill:c,close:true,name:'據點尖端'});circ(x,y-s*.9,s,{fill:c,line:'FFFFFF',lw:1,text:t||'',size:Math.max(10,Math.round(s*30)),bold:1,color:'FFFFFF',margin:0,font:nf,name:'據點釘'});};
 SL.cover=()=>{const {Z,T,TN,DARK,W2,ph,pill}=UK();cur.noFoot=1;
  grp('封面標題區',()=>{box(X0,1.95,.12,1.85,{fill:P,r:0,name:'色條'});T(X0+.4,1.85,8.6,1.4,'B 線良率提升專案\n結案報告',{size:Z(32),bold:1,color:G.ink,valign:'top',lsp:1.1,name:'主標題'});
   T(X0+.4,3.4,8.6,.4,'CMP 參數優化讓良率三週回升至 98.6%',{size:Z(16),color:P,name:'副標題（一句話結論）'});});
  grp('講者與日期',()=>{ln(X0+.4,4.3,X0+4.4,4.3,{c:G.l2,w:.75});T(X0+.4,4.42,6,.32,[{t:'陳怡君',b:1,c:G.ink},{t:'  製程整合工程師'}],{size:Z(13),color:G.t2,wrap:0,name:'講者'});T(X0+.4,4.78,6,.3,'2026 / 10 / 16 ・ 品質月會',{size:Z(11),color:G.t2,font:nf,wrap:0,name:'日期場合'});});
  grp('封面圖（可換）',()=>{ph(9.0,1.6,3.73,4.3,'封面圖（右鍵→變更圖片）','m');});
  grp('頁首小標',()=>{pill(X0+.4,1.25,1.4,.3,'結案報告',DARK,{size:10});T(X0+1.95,1.25,3,.3,'Final Report',{size:10,color:G.t2,font:nf,wrap:0,name:'英文'});});};
 const endMark=(n)=>grp('頁碼區',()=>{ln(X1-2.0,6.62,X1,6.62,{c:P,w:.9,name:'細線'});txt(X1-2.0,6.3,2.0,.28,[{t:n,b:1,c:P,f:nf},{t:' / 24',c:'5B6474',f:nf}],{size:11,align:'right',wrap:0,name:'頁碼'});txt(X1-3.2,6.3,1.15,.28,'範例簡報頁碼',{size:9,color:'5B6474',valign:'middle',wrap:0,name:'頁碼說明'});});
 SL.section=()=>{const {Z,T,TN,DARK,W2,bdg}=UK();cur.noFoot=1;
  grp('大編號＋章節標題',()=>{T(X0+.4,2.0,3.0,1.6,'02',{size:Z(72),bold:1,color:P,font:nf,wrap:0,name:'章節編號'});T(X0+3.3,2.35,8.5,.7,'問題與根因',{size:Z(32),bold:1,color:G.ink,wrap:0,name:'章節標題'});
   T(X0+3.3,3.05,8.5,.4,'Problem & Root Cause',{size:Z(16),color:G.t2,font:nf,wrap:0,name:'英文'});});
  grp('本章重點',()=>{ln(X0+3.3,3.8,X1,3.8,{c:G.l2,w:.75});['良率連 3 週低於目標','CMP 後段與量測站最集中','根因：參數漂移＋SOP 未更新'].forEach((t,i)=>{bdg(X0+3.48+i*3.0,4.25,.32,String(i+1),i===0?P:DARK);T(X0+3.75+i*3.0,4.1,2.7,.3,t,{size:Z(12),color:G.ink,wrap:0,name:'重點'});});});
  grp('章節進度',()=>{['背景','問題與根因','對策','成果','下一步'].forEach((t,i)=>{const x=X0+3.3+i*1.75,on=i===1;box(x,5.4,1.6,.08,{fill:on?P:'D9D9D9',r:'full',name:'進度段'});T(x,5.55,1.6,.28,t,{size:10.5,bold:on,color:on?P:G.t2,wrap:0,name:'章節'});});});endMark('05');};
 SL.closing=()=>{const {Z,T,TN,DARK,W2,pill,bdg}=UK();cur.noFoot=1;
  grp('結尾主訊息',()=>{T(X0,1.7,CW,.9,'謝謝聆聽，歡迎提問',{size:Z(36),bold:1,color:G.ink,align:'center',wrap:0,name:'主訊息'});T(X0,2.6,CW,.4,'Q & A',{size:Z(18),color:P,align:'center',font:nf,wrap:0,name:'英文'});});
  grp('三點回顧',()=>{const w=3.6,x0=X0+(CW-3*w-.6)/2;['良率 96.5% → 98.6%','年省 1,200 萬','C 線 Q1 導入'].forEach((t,i)=>{const x=x0+i*(w+.3);card(x,3.4,w,.9);bdg(x+.4,3.85,.36,String(i+1),i===0?P:DARK);T(x+.72,3.4,w-.8,.9,t,{size:Z(14),bold:1,color:G.ink,wrap:0,name:'回顧'});});});
  grp('行動呼籲＋聯絡',()=>{{const bx=X0+(CW-11.4)/2;box(bx,4.75,11.4,.95,{fill:TN(P,.93),r:.12,name:'底'});pill(bx+.3,5.07,1.3,.32,'需要您',P,{size:Z(11)});}T(X0+2.4,4.75,4.6,.95,'11/05 前核准 B 線擴線',{size:Z(14),bold:1,color:G.ink,wrap:0,name:'行動'});
   T(X1-3.95,4.75,2.1,.95,'yc.chen@example.com\n分機 3721',{size:Z(10.5),color:G.t2,font:nf,name:'聯絡'});qr(X1-1.6,4.85,.75);});
  grp('會後資源',()=>{const L=[['簡報檔','PDF'],['附錄','A1–A3'],['回饋問卷','2 分鐘']],w=2.4,x0=W/2-(3*w+.4)/2;L.forEach(([a,b],i)=>{const x=x0+i*(w+.2);box(x,6.0,w,.36,{fill:W2,line:G.l2,lw:.75,r:'full',name:'資源膠囊'});T(x,6.0,w,.36,[{t:a,b:1,c:G.ink},{t:'  '+b,c:G.t2,f:nf}],{size:Z(10.5),align:'center',wrap:0,name:'資源'});});});endMark('24');};
 SL.quote=()=>{const {Z,T,TN,DARK,W2}=UK();
  grp('整頁引言（大引號＋金句）',()=>{T(X0+.6,.95,1.4,2.0,'“',{size:72,bold:1,color:mix(P,'FFFFFF',.8),font:'Georgia',valign:'top',wrap:0,name:'大引號'});
   T(X0+1.9,2.1,8.8,1.9,'品質不是檢驗出來的，\n是設計與製造出來的。',{size:Z(34),bold:1,color:G.ink,valign:'top',lsp:1.15,name:'金句'});
   box(X0+1.9,4.35,.9,.05,{fill:P,r:0,name:'分隔線'});
   T(X0+1.9,4.55,7,.4,'姓名 Name｜職稱 Title',{size:Z(12),bold:1,color:'5B6474',wrap:0,name:'出處'});
   T(X0+1.9,5.0,8.8,.4,'用在：開場定調、章節轉場、結尾收束；一頁只放一句，字數 ≤ 30',{size:Z(11),color:G.mute,wrap:0,name:'使用說明'});});
  grp('主題標籤',()=>{box(X0+1.9,1.55,1.2,.3,{fill:TN(P,.88),r:'full',text:'品質文化',size:Z(10.5),bold:1,color:PD,margin:0,name:'主題膠囊'});T(X0+3.2,1.55,3,.3,'第 2 章・開場',{size:Z(10.5),color:G.t2,valign:'middle',wrap:0,name:'位置'});});
  grp('引言＋人像',()=>{photo(X1-1.35,3.15,1.7,'人像（右鍵→變更圖片）');T(X1-2.45,4.15,2.2,.35,'客戶 品保經理',{size:Z(11),color:G.t2,align:'center',wrap:0,name:'身分'});});};
 SL.quote2=()=>{const {Z,T,TN,DARK,W2,bdg}=UK();const QC=mix(P,'FFFFFF',.8);
  grp('主色直條引言（白底）',()=>{box(X0+.3,2.0,.12,2.4,{fill:P,r:0,name:'主色直條'});T(X0+.75,1.0,1.6,2.0,'“',{size:96,bold:1,color:QC,font:'Georgia',valign:'top',wrap:0,name:'大引號'});
   T(X0+2.0,2.2,5.4,1.6,'先把問題說清楚，\n答案就會自己出現。',{size:28,bold:1,color:'1F3864',valign:'top',lsp:1.2,name:'金句'});
   box(X0+2.0,4.0,.9,.05,{fill:P,r:0,name:'分隔線'});T(X0+2.0,4.2,5.4,.4,'姓名 Name｜職稱 Title',{size:12,bold:1,color:'5B6474',wrap:0,name:'出處'});
   T(X0+2.0,4.7,5.4,.4,'章節轉場或結尾金句用；一頁只放一句',{size:Z(11),color:'5B6474',wrap:0,name:'使用說明'});});

  {const bw=CW*.35,bx=X1-bw,by=1.0,bh=5.15;grp('右側淺色塊（人像＋重點）',()=>{box(bx,by,bw,bh,{fill:mix(P,'FFFFFF',.94),r:.1,name:'淺色塊'});
   photo(bx+bw/2,by+.98,1.2,'人像（右鍵→變更圖片）');T(bx+.3,by+1.8,bw-.6,.36,'姓名 Name',{size:Z(16),bold:1,color:'1F3864',align:'center',wrap:0,name:'姓名'});T(bx+.3,by+2.16,bw-.6,.3,'職稱｜單位 Title | Org',{size:Z(11),color:'5B6474',align:'center',wrap:0,name:'頭銜'});
   ln(bx+.4,by+2.62,bx+bw-.4,by+2.62,{c:mix(P,'FFFFFF',.75),w:.75});T(bx+.4,by+2.74,bw-.8,.3,'本章重點',{size:Z(11),bold:1,color:P,wrap:0,name:'重點標題'});
   ['先寫結論，再補依據','一頁只回答一個問題','用數字取代形容詞'].forEach((t,k)=>{bdg(bx+.55,by+3.27+k*.5,.3,String(k+1),P,{size:10});T(bx+.82,by+3.12+k*.5,bw-1.1,.3,t,{size:Z(12),color:G.ink,valign:'middle',wrap:0,name:'重點'});});});}
  grp('適用情境膠囊',()=>{T(X0+2.0,5.3,1.0,.3,'適用情境',{size:Z(11),bold:1,color:P,valign:'middle',wrap:0,name:'情境標題'});['章節轉場','結尾金句','開場定調'].forEach((t,k)=>box(X0+3.05+k*1.25,5.3,1.12,.3,{fill:mix(P,'FFFFFF',.9),r:'full',text:t,size:Z(10.5),bold:1,color:'1F3864',margin:0,name:'情境膠囊'}));});
  grp('下一章提示',()=>{T(X0,6.38,CW,.3,[{t:'下一章  ',c:G.t2},{t:'問題定義 →',b:1,c:P}],{size:Z(11),align:'right',wrap:0,name:'下一章'});});};
 /* ================= v14：封面／章節／結尾變體、亞洲與世界地圖 ================= */
 const qr=(x,y,s,nm)=>{box(x,y,s,s,{fill:'FFFFFF',line:G.l2,lw:.75,r:.03,name:nm||'QR 佔位（換成你的 QR 圖）'});const q=.056,m=s-2*q,n=9,c=m/n;
  const fin=(fx,fy)=>{box(fx,fy,c*3,c*3,{fill:G.ink,r:0,name:'定位框'});box(fx+c*.6,fy+c*.6,c*1.8,c*1.8,{fill:'FFFFFF',r:0,name:'定位框'});box(fx+c,fy+c,c,c,{fill:G.ink,r:0,name:'定位框'});};
  fin(x+q,y+q);fin(x+q+c*6,y+q);fin(x+q,y+q+c*6);[[4,1],[4,3],[5,4],[3,4],[7,4],[4,6],[6,6],[7,7],[5,7],[4,8],[8,5],[6,8]].forEach(([a,b])=>box(x+q+a*c,y+q+b*c,c,c,{fill:G.ink,r:0,name:'QR 點'}));};
 SL.cover2=()=>{const {Z,T,TN,DARK,W2,pill,ph}=UK();
  grp('左圖右文封面',()=>{ph(0,0,W*.42,H,'封面主圖（右鍵→變更圖片）','m');box(W*.42,0,.2,H,{fill:P,r:0,name:'分隔色條'});
   pill(W*.42+.7,1.6,1.4,.3,'專案提案',DARK,{size:10});T(W*.42+.7,2.1,W*.58-1.3,1.5,'B 線擴線\n投資提案',{size:Z(36),bold:1,color:G.ink,valign:'top',lsp:1.1,name:'主標題'});
   T(W*.42+.7,3.75,W*.58-1.3,.4,'＋12% 產能、6 個月回收、投資 2.4 億',{size:Z(14),color:P,wrap:0,name:'副標題'});box(W*.42+.7,4.4,3,.02,{fill:G.l2,r:0,name:'細線'});
   T(W*.42+.7,4.55,W*.58-1.3,.6,[{t:'陳怡君',b:1,c:G.ink},{t:'  製程整合經理',c:G.t2},{t:'\n2026／10／16',c:G.mute,f:nf}],{size:Z(12),valign:'top',name:'署名'});});
  grp('封面議程預告',()=>{['為什麼要擴線','投資與回收','需要的決策'].forEach((t,i)=>{const y=5.55+i*.36;circ(W*.42+.84,y+.14,.26,{fill:i===2?P:'F2F2F2',text:String(i+1),size:10,bold:1,color:i===2?'FFFFFF':G.t2,margin:0,font:nf,name:'議程編號'});T(W*.42+1.08,y,4,.28,t,{size:Z(11),color:G.ink,wrap:0,name:'議程'});});});};
 SL.cover3=()=>{const {Z,T,TN,DARK,W2,pill}=UK();
  grp('大數字封面',()=>{T(X0+.4,1.5,8,.4,'2026 Q3 成果報告',{size:Z(16),bold:1,color:P,wrap:0,name:'眉標'});
   T(X0+.3,1.85,8.5,2.2,[{t:'98.6',f:nf},{t:'%',s:Z(40),f:nf}],{size:Z(100),bold:1,color:P,valign:'top',wrap:0,name:'大數字'});
   T(X0+.4,4.05,9,.6,'B 線良率創新高：CMP 參數優化三週見效',{size:Z(24),bold:1,color:G.ink,wrap:0,name:'主標題'});
   T(X0+.4,4.75,9,.35,'製程整合部｜陳怡君｜2026/10/16',{size:Z(12),color:G.t2,wrap:0,name:'署名'});});
  grp('右側重點三格',()=>{[['▲ 1.2 pt','良率'],['1,200 萬','年省成本'],['3 週','見效時間']].forEach(([v,t],i)=>{const y=1.6+i*1.2;box(X1-3.0,y,3.0,1.0,{fill:i===0?TN(P,.9):'F7F7F7',r:.08,name:'重點底'});
   T(X1-2.8,y+.1,2.6,.5,v,{size:Z(22),bold:1,color:i===0?P:G.ink,font:nf,wrap:0,name:'重點數字'});T(X1-2.8,y+.6,2.6,.3,t,{size:10.5,color:G.t2,wrap:0,name:'重點標籤'});});});endMark('01');};
 SL.section2=()=>{const {Z,T,TN,DARK,W2}=UK();
  grp('左側大編號',()=>{box(0,0,4.2,H,{fill:TN(P,.92),r:0,name:'左側底'});T(.7,1.6,3.2,1.8,'03',{size:Z(96),bold:1,color:P,font:nf,wrap:0,name:'章節編號'});T(.75,3.5,3.2,.5,'對策與成果',{size:Z(24),bold:1,color:G.ink,wrap:0,name:'章節標題'});T(.75,4.05,3.2,.35,'Actions & Results',{size:Z(12),color:G.t2,font:nf,wrap:0,name:'英文'});});
  grp('目錄（目前章節強調）',()=>{['背景與目標','問題與根因','對策與成果','下一步','附錄'].forEach((t,i)=>{const y=1.7+i*.82,on=i===2;if(on)box(5.0,y-.12,7.6,.66,{fill:'EEF3FA',r:.06,name:'目前底'});if(on)box(5.0,y-.12,.06,.66,{fill:P,r:0,name:'目前色條'});
   T(5.3,y,.8,.42,String(i+1).padStart(2,'0'),{size:Z(16),bold:1,color:on?P:G.mute,font:nf,wrap:0,name:'目錄編號'});T(6.2,y,6,.42,t,{size:Z(16),bold:on,color:on?G.ink:G.t2,wrap:0,name:'目錄項'});});});endMark('09');};
 SL.section3=()=>{const {Z,T,TN,DARK,W2}=UK();
  grp('置中大標章節',()=>{T(X0,2.1,CW,.4,'PART 02',{size:Z(14),bold:1,color:P,align:'center',font:nf,wrap:0,name:'章節編號'});T(X0,2.6,CW,.9,'問題出在哪裡？',{size:Z(40),bold:1,color:G.ink,align:'center',wrap:0,name:'章節標題'});
   box(W/2-.4,3.65,.8,.05,{fill:P,r:0,name:'色條'});T(X0+2,3.85,CW-4,.4,'用三張圖看懂良率下滑的原因',{size:Z(14),color:G.t2,align:'center',wrap:0,name:'章節說明'});});
  grp('章節進度點',()=>{const n=5,sp=1.6,x0=W/2-sp*(n-1)/2;ln(x0,5.3,x0+sp*(n-1),5.3,{c:G.l2,w:1});['背景','問題','對策','成果','下一步'].forEach((t,i)=>{circ(x0+i*sp,5.3,i===1?.32:.24,{fill:i===1?P:i<1?TN(P,.5):W2,line:i>1?G.l1:null,lw:1,name:'進度點'});T(x0+i*sp-.6,5.55,1.2,.3,t,{size:10.5,bold:i===1,color:i===1?P:G.t2,align:'center',wrap:0,name:'進度名'});});});
  grp('本章重點預告',()=>{const L=['良率趨勢','根因樹','機台比較'],w=1.5,x0=W/2-(L.length*w+(L.length-1)*.2)/2+.55;T(x0-1.25,6.1,1.15,.3,'本章 3 張圖',{size:10.5,bold:1,color:G.t2,align:'right',wrap:0,name:'預告標題'});L.forEach((t,i)=>box(x0+i*(w+.2),6.1,w,.3,{fill:'F2F2F2',r:'full',text:t,size:10.5,color:G.ink,margin:0,name:'預告項目'}));});endMark('13');};
 SL.closing2=()=>{const {Z,T,TN,DARK,W2,pill}=UK();
  grp('Q&A 大字',()=>{T(X0,1.7,CW,1.8,'Q & A',{size:Z(96),bold:1,color:P,align:'center',font:nf,wrap:0,name:'Q&A'});T(X0,3.55,CW,.5,'歡迎提問：任何數字都可以現場展開',{size:Z(18),color:G.ink,align:'center',wrap:0,name:'說明'});});
  grp('備詢附錄頁碼',()=>{const w=3.5,x0=W/2-(3*w+.6)/2;[['良率明細','各線良率與 12 週趨勢','附錄 A1'],['投資試算','CAPEX、回收期與敏感度','附錄 A2'],['風險對策','前 5 大風險與備案','附錄 A3']].forEach(([t,d,p],i)=>{const x=x0+i*(w+.3);box(x,4.45,w,1.1,{fill:'F7F7F7',r:.08,name:'附錄卡'});box(x,4.45,.07,1.1,{fill:i?G.l1:P,r:0,name:'色條'});T(x+.25,4.55,w-1.6,.4,t,{size:Z(13),bold:1,color:G.ink,wrap:0,name:'附錄名'});T(x+.25,4.98,w-.4,.36,d,{size:10.5,color:G.t2,wrap:0,name:'附錄說明'});pill(x+w-1.3,4.6,1.1,.28,p,DARK,{size:10});});});
  grp('提問管道',()=>{T(X0,5.95,CW,.34,[{t:'線上提問  ',b:1,c:G.ink},{t:'Slido #QA2026',f:nf,c:P,b:1},{t:'   ·   會後信箱  ',c:G.t2},{t:'yc.chen@example.com',f:nf,c:G.t2}],{size:Z(11.5),align:'center',wrap:0,name:'提問管道'});});
  grp('預留時間',()=>{box(W/2-.85,1.2,1.7,.32,{fill:TN(P,.88),r:'full',text:'預留 10 分鐘',size:Z(10.5),bold:1,color:PD,margin:0,name:'時間膠囊'});});endMark('23');};
 SL.closing3=()=>{const {Z,T,TN,DARK,W2}=UK();
  grp('純感謝＋聯絡',()=>{T(X0,1.75,CW,1.3,'謝謝',{size:Z(72),bold:1,color:G.ink,align:'center',wrap:0,name:'謝謝'});T(X0,3.1,CW,.45,'Thank you',{size:Z(18),color:G.t2,align:'center',font:nf,wrap:0,name:'英文'});box(W/2-.4,3.75,.8,.05,{fill:P,r:0,name:'色條'});
   box(W/2-3.6,4.15,7.2,1.8,{fill:W2,line:G.l2,lw:.75,r:.1,name:'聯絡卡'});qr(W/2-3.35,4.3,1.5);T(W/2-1.6,4.3,5.0,1.5,[{t:'陳怡君  製程整合經理',b:1,c:G.ink,br:1},{t:'yc.chen@example.com',c:G.t2,f:nf,br:1},{t:'分機 3721｜linkedin.com/in/ycchen',c:G.t2,f:nf}],{size:Z(13),valign:'middle',lsp:1.3,name:'聯絡資訊'});T(X0,6.15,CW,.3,'簡報檔與附錄：掃描左側 QR｜歡迎會後交流',{size:Z(11),color:G.t2,align:'center',wrap:0,name:'附註'});});
  grp('會後連結',()=>{const L=['簡報檔','回饋問卷','預約交流'],w=1.6,x0=W/2-(3*w+.4)/2;L.forEach((t,i)=>box(x0+i*(w+.2),6.52,w,.3,{fill:i===0?P:'F2F2F2',r:'full',text:t,size:Z(10.5),bold:i===0,color:i===0?'FFFFFF':G.ink,margin:0,name:'連結膠囊'}));});endMark('22');};
 /* 世界／亞洲 低多邊形輪廓（經緯度 → 畫布；原生自訂圖形，可分區上色） */
 const geoP=(pts,x,y,w,h,lo0,lo1,la0,la1)=>pts.map(([lo,la])=>[x+(lo-lo0)/(lo1-lo0)*w,y+(la1-la)/(la1-la0)*h]);
 /* Natural Earth 110m（世界，依洲合併）／50m（亞洲，依國家／區域合併），以 Douglas–Peucker 簡化到每區 ≤150 點；公有領域資料 */
 const WORLD={"亞洲":[[[26,40.6],[27.1,42.1],[40.4,41],[41.7,42],[40.1,43.6],[48.6,41.8],[50.4,40.3],[49.2,37.6],[53.7,37],[52.7,40],[54.4,41.2],[52.8,41.1],[50.3,44.6],[53.1,46.7],[48.6,46.6],[46.5,48.4],[47.5,50.5],[50.8,51.7],[61.2,50.8],[60,52],[61.4,54],[69.1,55.4],[73.7,53.5],[76.9,54.5],[79.9,51],[87.4,49.2],[92.2,50.8],[97.3,49.8],[98.9,52],[108.6,49.3],[117.9,49.5],[120.2,52.8],[123.6,53.5],[131.1,47.8],[135,48.5],[127.6,39.7],[129.1,35.1],[126.5,34.4],[125.3,39.5],[121.1,38.9],[121.7,40.9],[117.7,38.9],[119.6,37.2],[122.4,37.5],[119.3,35],[121.9,31.7],[121.9,29],[118.7,24.5],[110.8,21.3],[110.3,18.7],[108.7,18.5],[109.5,21.5],[105.9,19.8],[108.9,15.3],[109.2,11.7],[105.2,8.6],[100.1,13.2],[99.2,9.4],[103.4,4.9],[104.2,1.3],[102.6,1.3],[106.1,-3.1],[105.9,-5.8],[115.7,-8.4],[114.6,-8.8],[105.4,-6.9],[95.4,5],[97.5,5.2],[101.7,2.3],[98.2,8.3],[97.6,16.1],[94.2,16],[91.4,22.7],[87.1,21.5],[80.3,15.8],[79.9,10.4],[77.5,8],[72.6,21.2],[70.5,20.9],[66.4,25.4],[53.5,26.8],[48.9,30.2],[48.4,28.5],[51.6,24.3],[54,24.1],[56.4,26.4],[56.8,24.3],[59.8,22.3],[55.3,17.2],[43.5,12.6],[42.3,17.4],[34.6,28.1],[36,36],[27.6,36.7]],[[109,0.4],[116.7,6.9],[119.2,5.4],[117.4,3.3],[119,0.9],[116.1,-4],[110.2,-2.9]],[[129.4,33.3],[139.4,38.2],[139.8,42.6],[142,45.6],[145.3,44.4],[143.2,42],[141.5,42.4],[140.3,35.1],[132,33],[130.7,31]],[[130.5,-0.9],[134,-0.8],[135.3,-3.3],[137.4,-1.7],[141,-2.6],[141,-9.1],[137.6,-8.4],[137.9,-5.4],[133,-4.1]],[[119.9,16.4],[120.7,18.5],[122.2,18.5],[121.7,14.5],[125.2,12.5],[125.3,10.4],[124.2,10.9],[123,9],[121.9,11.9],[124.8,11.9],[121.9,13.8],[121.3,12.2]],[[125.4,9.8],[126.5,7.2],[125.4,5.6],[123.8,7.7],[122.1,6.9]]],"歐洲":[[[-8.9,36.9],[-9.4,43],[-1.4,44],[-1.3,46.1],[-4.6,48.7],[1.6,50.8],[-5.8,50.2],[-3,53.9],[-5.6,55.3],[-5,58.6],[-2,57.7],[-2.7,56.1],[1.7,51],[8.6,53.9],[8.1,56.5],[10.6,57.7],[11.1,54.1],[19.6,54.5],[21.6,57.4],[24.1,57.1],[23.3,59.2],[28.7,59.9],[21.3,60.7],[21.1,62.6],[25.2,65.6],[17.9,62.7],[18.8,60.1],[15.9,56.1],[12.1,54.8],[11,58.9],[5.7,58.6],[5,62],[24.5,71],[41.1,67.5],[34.4,66.6],[36.8,64],[44,66.2],[43.5,68.6],[46.2,68.2],[46.4,66.7],[53.7,68.9],[60,68.3],[60.6,69.8],[68.5,68.1],[66.7,71],[72.6,72.8],[72.3,66.2],[74.8,67.7],[73.1,71.4],[74.7,72.8],[80.4,72.1],[80.5,73.6],[104.2,77.8],[99.4,77.9],[102.1,79.3],[114.1,75.8],[110.7,74],[127,73.6],[131.1,70.8],[139.3,71.6],[142.1,73.9],[160.9,69.4],[180,69],[179.2,62.3],[163.6,59.8],[162.1,54.9],[156.8,51],[155.9,56.8],[164.1,62.5],[160.1,60.5],[156.7,61.4],[155,59.1],[142.1,59],[135.8,54.9],[141.4,53.1],[142.7,54.4],[144.7,49],[142.6,48],[143.5,46.1],[142.1,46],[141.3,52],[138.2,46.3],[130.8,42.2],[131,45],[134.7,48.2],[131,47.8],[125,53.2],[121,53.2],[117.9,49.5],[108.5,49.3],[98.9,52],[97.3,49.7],[92.2,50.8],[87.4,49.2],[80,50.9],[76.4,54.2],[69.1,55.4],[61.4,54],[61.3,50.8],[50.8,51.7],[47.5,50.3],[46.6,48.3],[49.1,46.4],[46.8,44.7],[47.8,41.2],[36.6,45.2],[33.9,44.4],[31.4,46.7],[28,42],[23,39.8],[23.2,36.4],[19.4,41.9],[13.2,45.7],[12.6,44.1],[18.5,40.2],[16.8,40.3],[15.1,36.6],[12.4,37.6],[15.7,38.3],[15.5,40],[8.9,44.3],[3.2,43.1],[-2.1,36.7]],[[10.4,79.7],[22.9,80.7],[27.4,80.1],[15.9,76.8]],[[51.5,72],[55.6,75.1],[68.9,76.5],[58.5,74.3],[55.5,72.3],[57.5,70.7]],[[-180,65],[-180,69],[-169.9,66],[-173,64.3]],[[-24.3,65.6],[-14.5,66.5],[-13.6,65.1],[-18.7,63.5]],[[99.9,78.9],[95,79],[91.2,80.3],[95.9,81.3]],[[-10,51.8],[-9.7,53.9],[-5.7,54.6],[-6.8,52.3]]],"非洲":[[[-17.6,14.7],[-16.3,17.2],[-17.1,21],[-16,23.7],[-13.1,27.6],[-9.7,29.8],[-9.3,32.6],[-5.9,35.8],[-2.2,35.2],[1.5,36.6],[9.5,37.3],[11.1,36.9],[10.4,33.8],[19,30.3],[21.5,32.8],[28.9,30.9],[34.3,31.2],[34.9,29.5],[33.6,27.3],[39.3,15.9],[43.1,12.7],[44.1,10.5],[51.1,11.7],[48.6,5.3],[40.3,-2.6],[39.2,-4.7],[38.8,-6.4],[40.5,-10.8],[40.8,-14.7],[39.5,-16.7],[34.8,-19.8],[35.5,-24.1],[32.7,-25.7],[32.2,-28.7],[28.2,-32.8],[19.6,-34.8],[18.2,-33.9],[18.2,-31.6],[15.2,-27.1],[14.3,-22.2],[11.8,-18.1],[13.7,-10.8],[11.9,-5.1],[8.8,-1.1],[9.4,3.7],[8.3,4.7],[5.9,4.3],[4.2,6.3],[-8,4.4],[-12.9,7.8]],[[43.3,-22.1],[44.4,-20],[44.4,-16.2],[47.7,-14.6],[49.2,-12],[50.5,-15.2],[47.1,-24.9],[45.4,-25.6],[44,-25]]],"北美":[[[-168.1,65.7],[-162.4,66.1],[-166.8,68.4],[-156.6,71.4],[-116.5,69],[-119,72.5],[-125.9,71.9],[-124.9,74.3],[-121.5,74.4],[-108.2,71.8],[-104.5,73.4],[-104.5,71],[-101,70],[-105.2,68.5],[-98.8,67.8],[-99.8,69.4],[-96.5,69.9],[-94.6,74.3],[-96.8,74.9],[-94.9,75.6],[-90.5,73.9],[-94,71.9],[-87.3,67.3],[-85.5,69.9],[-89.5,70.8],[-89.4,73.1],[-78.1,73.7],[-62.2,66.2],[-67.9,66.3],[-64.7,63.4],[-68.9,62.3],[-78.6,64.6],[-72.8,67.5],[-81.3,69.7],[-81.4,67.1],[-86,66],[-80.1,63.7],[-87.2,63.5],[-86.4,65.7],[-94.6,59],[-82.3,55.1],[-79.9,51.2],[-79.8,54.7],[-76.6,56.6],[-78.1,62.3],[-69.6,61.1],[-67.6,58.3],[-64.6,60.3],[-55.8,53.3],[-56.2,50.3],[-52.6,47.5],[-59.3,47.6],[-57.4,51.3],[-68.5,49],[-59.8,45.9],[-65.4,43.5],[-66.8,45.2],[-73.9,40.5],[-75.7,35.5],[-81.3,31.4],[-80.4,25.2],[-84,30.1],[-97.2,27.8],[-96.3,19.3],[-92,18.7],[-87.1,21.5],[-88.5,15.9],[-83.2,15],[-82,9],[-79.6,9.6],[-77.4,8.7],[-80.9,7.2],[-87.8,13.1],[-105,19.3],[-114.7,31.7],[-109.4,23.2],[-112.2,24.7],[-123.7,39],[-124.7,48.5],[-134.1,58.1],[-152,60.5],[-153,57.1],[-164.8,54.4],[-157.6,58.5],[-166.1,61.5],[-161,64.2]],[[-98.6,78.9],[-86.4,75.5],[-82.1,76.1],[-89.5,76.5],[-88.1,78.5],[-96.7,80.2],[-72.8,83.2],[-27.1,83.5],[-12.2,81.3],[-19.6,78.8],[-18.5,77],[-20.7,76.7],[-19.4,74.3],[-22.6,73.2],[-22.3,70.1],[-39.8,65.4],[-44.8,60],[-51.6,63.6],[-54,67.2],[-51,69.6],[-54.7,69.6],[-53.5,71.3],[-57.3,74.7],[-73.3,78],[-66.3,79.4],[-67.4,80.9],[-75.4,79.4],[-81.9,74.4],[-92.4,74.8]],[[-117.7,75.2],[-109.6,76.8],[-105.7,75.5],[-112.2,74.4]],[[-85,21.9],[-83.3,23],[-80.6,23.1],[-74.2,20.3]],[[-96.7,71.7],[-99.3,71.4],[-102.5,72.8],[-97.4,73.8]],[[-74.5,18.3],[-73.2,19.9],[-68.3,18.6],[-71.4,17.6]],[[-102.6,76.3],[-98.5,76.7],[-97.7,75.7],[-99.8,74.9]]],"南美":[[[-81.4,-4.7],[-80.1,-3.1],[-81,-2.2],[-80.1,0.8],[-77.3,3.7],[-77.5,8.5],[-74.9,11.1],[-71.8,12.4],[-71.2,11.1],[-69.9,12.2],[-68,10.6],[-61.9,10.7],[-62.4,10],[-57.2,6],[-54,5.8],[-54.2,2.3],[-52.9,2.2],[-51.3,4.2],[-50,1.7],[-50.4,0],[-44.9,-1.5],[-44.2,-2.6],[-40,-2.9],[-35.2,-5.5],[-35.1,-9],[-38.7,-13.2],[-39.3,-17.9],[-40.9,-21.9],[-47.7,-24.9],[-48.9,-28.7],[-53.8,-34.4],[-57.7,-34.5],[-56.7,-36.4],[-57.7,-38.2],[-62,-38.9],[-62.1,-40.7],[-65,-41],[-64.9,-42.1],[-63.5,-42.6],[-65.1,-43.5],[-65.6,-45],[-67.3,-45.6],[-67.4,-46.4],[-65.6,-47.2],[-69.1,-50.8],[-67.8,-53.8],[-65.1,-54.7],[-65.5,-55.2],[-71,-55.1],[-75.3,-51.6],[-75.6,-48.7],[-74.6,-47.1],[-75.6,-46.6],[-72.8,-42.6],[-74.3,-43.2],[-73.6,-37.2],[-71.4,-32.5],[-70.2,-19.7],[-71.5,-17.3],[-76,-14.6]],[[-61.2,-51.9],[-58.5,-51.1],[-57.8,-51.6],[-59.4,-52.2]]],"大洋洲":[[[113.3,-26.1],[114.1,-21.8],[120.9,-19.7],[125.7,-14.2],[129.3,-14.9],[132.5,-12.1],[131.8,-11.3],[136.5,-11.9],[135.5,-15],[140.8,-17.4],[142.5,-10.7],[146.4,-18.9],[150.7,-22.4],[153.6,-28.1],[150,-37.4],[146.3,-39],[140.6,-38],[138.3,-34.8],[136.8,-35.3],[137.6,-33.5],[136,-34.9],[131.3,-31.5],[116.6,-35],[115,-34.2],[115.7,-31.7]],[[141,-2.6],[147.6,-6.1],[147.2,-7.4],[150.7,-10.6],[144.8,-7.6],[141,-9.1]],[[166.5,-45.9],[172.8,-40.5],[174.3,-41.4],[170.6,-45.9]],[[174.6,-41.3],[174.7,-37.4],[172.6,-34.5],[176.1,-37.6],[178.5,-37.7]],[[144.7,-41.2],[148.3,-40.9],[147.9,-43.2],[146,-43.5]],[[148.3,-5.7],[152.2,-4],[150.9,-2.5],[153,-4],[150.2,-6.3]],[[164,-20.1],[165,-20.5],[167.1,-22.2],[165.5,-21.7]]]};
 const ASIA={"東南亞":[[[92.2,21.3],[95.1,26.6],[97.1,27.1],[97.6,28.5],[98.7,26.7],[97.6,23.9],[98.8,24.1],[99.2,22.1],[100.1,21.5],[101.7,21.2],[101.7,22.5],[105.3,23.3],[108.0,21.5],[105.6,19.0],[108.8,15.4],[109.0,11.3],[104.8,8.6],[105.0,10.1],[100.6,13.6],[99.2,10.3],[100.6,7.2],[103.2,5.3],[104.3,1.4],[101.3,2.9],[99.7,7.1],[98.6,8.3],[98.3,7.8],[98.8,11.7],[98.2,11.5],[98.6,12.9],[97.2,17.1],[94.4,15.8],[94.4,18.2]],[[108.9,0.4],[109.4,1.9],[111.0,1.5],[111.3,2.7],[115.4,5.0],[116.8,7.0],[119.3,5.4],[117.2,3.6],[119.0,1.0],[117.7,0.7],[116.1,-4.1],[110.3,-3.0]],[[95.2,5.3],[97.5,5.2],[100.5,2.2],[101.6,2.1],[103.1,1.0],[104.6,-2.6],[106.0,-3.1],[105.7,-5.8],[104.6,-5.9],[101.6,-3.2],[98.6,1.9]],[[130.4,-0.9],[132.5,-0.3],[134.0,-0.8],[135.1,-3.3],[137.8,-1.5],[141.0,-2.6],[141.0,-9.1],[139.9,-8.1],[137.7,-8.4],[138.8,-7.2],[138.1,-5.5],[133.6,-3.4],[133.0,-4.1],[132.0,-2.8],[133.8,-2.2],[132.3,-2.2]],[[118.8,-2.7],[120.3,1.0],[123.9,0.8],[125.2,1.6],[124.3,0.4],[120.1,0.0],[120.7,-1.4],[123.4,-0.7],[121.4,-1.9],[122.9,-4.4],[121.6,-4.8],[120.7,-2.7],[120.4,-5.6],[119.7,-5.7]],[[105.1,-6.6],[106.1,-5.9],[109.3,-6.9],[111.0,-6.4],[115.7,-8.4],[108.2,-7.8]],[[119.8,16.0],[120.4,16.2],[120.6,18.5],[122.2,18.5],[122.5,17.1],[121.4,15.3],[121.9,14.0],[123.9,13.8],[124.1,12.6],[122.6,13.9],[122.6,13.2],[120.6,13.8],[120.9,14.6]],[[121.9,7.1],[123.4,8.7],[123.9,8.1],[125.5,9.0],[125.5,9.8],[126.2,9.3],[126.6,7.2],[126.2,6.3],[125.8,7.3],[125.7,7.3],[125.3,5.6],[123.7,7.8]],[[123.6,-10.0],[125.2,-8.6],[127.3,-8.4],[124.4,-10.1]],[[124.3,12.6],[125.5,12.2],[125.3,9.9],[124.4,10.9],[125.0,11.7]],[[128.4,-0.9],[127.4,1.3],[128.0,2.2],[127.6,0.9],[128.7,1.6],[128.3,0.8],[128.9,0.2],[127.9,0.4]],[[127.9,-3.5],[130.4,-3.0],[130.8,-3.9]]],"其他":[[[66.0,54.0],[137.8,53.9],[137.3,53.5],[138.6,53.9],[138.4,53.5],[140.2,54.0],[141.4,53.3],[141.0,53.0],[141.5,52.2],[140.5,50.8],[140.1,48.4],[137.7,45.8],[134.0,42.9],[133.2,42.7],[131.9,43.3],[130.7,42.3],[130.4,42.7],[131.3,43.4],[131.0,44.8],[133.1,45.1],[134.7,48.2],[131.0,47.7],[130.6,48.9],[127.6,49.8],[126.0,52.7],[123.6,53.5],[120.1,52.8],[120.7,52.0],[119.3,50.1],[117.9,49.5],[114.3,50.3],[110.7,49.1],[108.6,49.3],[106.7,50.3],[103.3,50.2],[102.3,50.6],[102.1,51.4],[98.9,52.1],[97.8,51.1],[98.2,50.3],[97.4,49.7],[92.3,50.9],[86.9,49.1],[85.7,48.3],[85.5,47.1],[83.0,47.2],[82.5,45.1],[79.9,44.9],[80.5,44.7],[80.8,43.2],[80.2,42.0],[76.9,41.0],[76.3,40.4],[75.5,40.6],[73.9,40.0],[73.8,38.7],[74.8,38.5],[75.1,37.4],[74.4,37.1],[75.8,36.7],[76.2,35.8],[77.8,35.5],[75.7,34.5],[74.0,34.6],[74.0,33.2],[75.3,32.2],[71.9,28.0],[70.4,28.0],[69.5,27.1],[71.0,24.4],[68.8,24.3],[68.1,23.8],[66.0,25.4]],[[141.1,-9.2],[141.1,-2.6],[144.5,-3.8],[145.8,-4.8],[145.8,-5.4],[147.6,-6.1],[147.8,-6.7],[147.0,-6.8],[147.2,-7.4],[148.6,-9.1],[150.0,-9.7],[150.0,-10.5],[147.8,-10.1],[146.0,-8.1],[144.5,-7.6],[142.9,-8.3],[143.6,-8.4],[143.6,-8.7],[142.6,-9.3]],[[80.1,28.9],[80.8,30.1],[82.0,30.3],[86.0,27.9],[88.1,27.9],[88.2,26.7],[87.3,26.4],[85.2,26.8]],[[88.0,24.6],[88.9,25.2],[88.1,25.9],[88.4,26.6],[89.7,26.2],[89.8,25.3],[92.5,24.9],[91.2,23.7],[91.6,23.0],[92.2,23.7],[92.3,20.8],[91.9,21.5],[91.5,22.8],[90.7,22.9],[90.8,22.1],[89.2,21.7],[88.7,24.3]],[[141.7,51.9],[141.9,53.4],[143.0,54.0],[143.2,51.9],[144.7,48.8],[143.0,49.1],[142.6,47.7],[143.5,46.8],[143.4,46.0],[142.6,46.7],[141.9,46.1],[142.2,51.2]],[[79.9,9.0],[80.3,9.8],[81.9,7.3],[81.6,6.4],[80.7,6.0],[79.9,6.8]],[[88.7,27.2],[90.0,28.3],[91.6,28.0],[92.1,27.3],[92.0,26.9],[89.8,26.7]]],"台灣":[[[120.1,23.1],[120.2,23.7],[121.0,25.0],[121.5,25.3],[121.9,25.1],[121.8,24.5],[121.6,24.1],[121.4,23.2],[120.9,22.5],[120.8,21.9],[120.7,22.0],[120.6,22.4],[120.3,22.5]]],"韓國":[[[126.1,34.4],[126.3,34.7],[126.5,34.7],[126.3,35.2],[126.5,35.5],[126.5,35.6],[126.7,35.9],[126.5,36.2],[126.5,36.7],[126.4,36.6],[126.4,36.4],[126.2,36.8],[126.5,37.0],[126.9,36.9],[126.6,37.6],[126.4,37.8],[126.6,37.8],[127.1,38.3],[128.0,38.3],[128.4,38.6],[129.4,37.1],[129.4,36.1],[129.6,36.1],[129.4,35.5],[129.2,35.2],[128.5,35.1],[128.5,34.9],[128.7,35.0],[128.6,34.7],[128.0,35.0],[127.9,34.9],[128.1,34.7],[127.9,34.7],[127.8,35.0],[127.6,34.9],[127.8,34.6],[127.5,34.8],[127.3,34.5],[127.2,34.7],[126.9,34.4],[126.7,34.5],[126.8,34.3],[126.5,34.3],[126.4,34.5]]],"北韓":[[[124.3,39.9],[124.4,40.1],[124.9,40.5],[126.0,40.9],[126.7,41.7],[128.2,41.4],[128.3,41.6],[128.0,42.0],[128.9,42.0],[129.3,42.4],[129.7,42.5],[129.9,43.0],[130.2,42.9],[130.7,42.3],[130.2,42.2],[129.8,41.7],[129.7,40.9],[128.5,40.1],[127.6,39.8],[127.4,39.2],[128.4,38.6],[128.1,38.3],[127.1,38.3],[126.6,37.8],[126.4,37.9],[126.1,37.7],[125.8,38.0],[125.4,37.7],[125.0,37.9],[125.1,38.1],[124.7,38.1],[125.3,38.7],[125.2,38.9],[125.4,39.3],[125.4,39.5],[125.0,39.6],[124.8,39.5],[124.9,39.7],[124.6,39.6]]],"蒙古":[[[87.7,48.9],[88.2,49.5],[89.1,49.5],[92.4,50.9],[94.3,50.6],[94.6,50.0],[97.4,49.7],[98.2,50.3],[97.8,51.1],[98.9,52.1],[102.1,51.4],[102.3,50.6],[103.3,50.2],[106.7,50.3],[107.9,49.9],[108.6,49.3],[110.7,49.1],[112.8,49.5],[114.3,50.3],[116.4,50.0],[116.7,49.8],[115.6,47.9],[117.3,47.7],[118.5,48.0],[119.9,46.7],[117.4,46.6],[116.6,46.3],[115.7,45.5],[114.6,45.4],[113.6,44.7],[111.9,45.1],[111.4,44.4],[111.9,43.7],[110.4,42.8],[106.8,42.3],[105.0,41.6],[101.5,42.5],[96.4,42.7],[95.3,44.3],[93.5,44.9],[90.9,45.2],[90.7,45.5],[91.0,46.6],[90.3,47.7],[88.6,48.2]]],"日本":[[[130.9,34.0],[131.0,34.4],[132.9,35.5],[135.9,35.6],[136.8,37.4],[137.3,37.5],[136.9,37.1],[137.2,36.8],[138.3,37.2],[139.4,38.1],[139.8,38.9],[140.1,39.6],[139.7,39.9],[140.3,41.2],[140.6,41.2],[140.7,40.8],[141.1,40.9],[141.2,41.2],[140.8,41.1],[140.9,41.5],[141.5,41.4],[141.4,40.7],[142.0,39.4],[141.5,38.4],[141.0,38.1],[141.0,37.1],[140.6,36.2],[140.9,35.7],[140.4,35.2],[139.8,35.0],[140.1,35.6],[139.9,35.7],[139.7,35.1],[139.2,35.2],[138.9,34.6],[138.7,35.1],[138.2,34.6],[137.1,34.6],[137.2,34.7],[136.9,34.7],[136.8,35.0],[136.5,34.7],[136.9,34.3],[136.3,34.2],[135.7,33.5],[135.1,34.0],[135.4,34.6],[134.7,34.8],[132.3,34.3],[132.4,33.8]],[[140.1,41.4],[139.9,42.6],[140.5,43.0],[140.4,43.3],[141.4,43.3],[141.8,44.5],[141.6,45.3],[141.9,45.5],[143.8,44.1],[144.7,43.9],[145.4,44.3],[145.1,43.7],[145.4,43.3],[145.8,43.4],[144.0,42.9],[143.2,42.0],[141.9,42.6],[141.0,42.3],[140.5,42.6],[140.3,42.3],[141.2,41.8],[140.7,41.8]],[[129.4,33.2],[130.5,33.8],[130.9,33.9],[131.2,33.6],[131.7,33.6],[131.6,33.3],[132.0,32.9],[131.3,31.4],[130.7,31.0],[130.8,31.7],[130.6,31.2],[130.1,31.4],[130.5,32.8],[130.2,33.2],[130.3,32.7],[129.8,32.6],[129.7,33.1]],[[135.0,34.5],[134.2,33.2],[133.6,33.5],[132.8,32.8],[132.4,33.4],[132.0,33.3],[132.9,34.1],[133.2,33.9],[133.9,34.3],[134.6,34.2]]],"印度":[[[68.2,23.9],[68.8,24.3],[71.0,24.4],[69.5,27.1],[70.4,28.0],[71.9,28.0],[74.6,31.0],[74.6,31.8],[75.3,32.2],[74.0,33.2],[74.0,34.7],[75.7,34.5],[77.8,35.5],[79.0,34.3],[79.2,32.5],[78.4,32.5],[78.8,31.3],[81.0,30.2],[80.1,28.8],[82.8,27.5],[88.0,26.4],[88.1,27.9],[88.8,28.0],[89.1,26.8],[92.0,26.9],[91.6,27.8],[92.5,27.9],[94.6,29.3],[95.4,29.0],[96.0,29.4],[96.6,28.8],[96.3,28.4],[97.3,28.2],[96.9,27.6],[97.1,27.1],[96.2,27.3],[95.1,26.6],[94.1,23.9],[93.3,24.0],[92.9,22.0],[92.6,22.0],[92.2,23.7],[91.6,23.0],[91.2,23.6],[92.5,24.9],[89.8,25.3],[89.7,26.2],[88.4,26.6],[88.1,25.9],[89.0,25.3],[88.0,24.6],[88.7,24.3],[89.1,21.7],[88.7,22.1],[88.1,21.6],[88.1,22.0],[87.1,21.5],[86.8,20.3],[85.3,19.8],[82.3,16.6],[80.3,15.7],[80.3,13.4],[79.8,10.3],[78.9,9.6],[79.4,9.2],[78.4,9.1],[77.5,8.1],[76.6,8.9],[73.5,16.1],[72.6,22.2],[72.0,21.2],[70.7,20.7],[69.0,22.3],[70.4,22.9],[69.2,22.8]]],"中國":[[[73.6,39.2],[74.8,40.5],[76.3,40.4],[76.9,41.0],[80.2,42.0],[80.2,42.7],[80.8,43.2],[80.4,44.7],[79.9,44.9],[82.5,45.1],[82.3,45.6],[83.0,47.2],[85.5,47.1],[85.7,48.3],[86.9,49.1],[87.8,49.2],[88.0,48.6],[90.3,47.7],[91.0,46.6],[90.9,45.2],[95.4,44.3],[96.4,42.7],[101.5,42.5],[105.0,41.6],[110.4,42.8],[111.9,43.7],[111.4,44.4],[111.9,45.1],[113.6,44.7],[117.4,46.6],[119.9,46.7],[118.5,48.0],[115.9,47.7],[115.5,48.1],[116.7,49.8],[117.9,49.5],[119.3,50.1],[120.7,52.1],[120.0,52.7],[121.0,53.3],[123.6,53.5],[125.6,53.0],[127.6,49.8],[130.6,48.9],[131.0,47.7],[134.3,48.4],[134.8,47.7],[133.1,45.1],[131.8,45.3],[131.0,44.8],[131.3,43.4],[130.5,42.5],[129.9,43.0],[129.7,42.4],[128.0,42.0],[128.1,41.4],[126.7,41.7],[124.3,39.9],[121.2,38.7],[121.7,39.3],[121.3,39.5],[122.3,40.5],[121.8,40.9],[121.2,40.9],[119.0,39.2],[117.8,39.1],[117.7,38.4],[118.9,38.0],[119.3,37.1],[120.7,37.8],[122.7,37.4],[122.3,36.8],[120.2,36.2],[119.2,34.9],[120.3,34.3],[120.9,32.7],[121.8,31.9],[121.8,31.5],[120.7,32.0],[121.9,30.9],[120.5,30.3],[121.3,30.3],[122.1,29.9],[122.2,29.7],[121.5,29.2],[121.6,28.3],[121.1,28.3],[120.0,26.6],[119.6,26.7],[119.6,25.4],[118.1,24.6],[117.4,23.6],[114.6,22.5],[113.5,23.1],[113.5,22.2],[110.4,21.2],[110.5,20.5],[110.1,20.3],[109.7,20.9],[109.9,21.5],[108.6,21.9],[107.4,21.6],[106.7,22.0],[106.7,22.8],[105.3,23.3],[103.9,22.5],[101.7,22.5],[101.7,21.2],[101.1,21.8],[100.1,21.5],[99.9,22.0],[99.2,22.2],[99.5,23.0],[98.9,23.2],[98.8,24.1],[97.6,23.9],[97.8,25.3],[98.7,25.9],[98.7,27.6],[97.7,28.5],[96.3,28.4],[96.6,28.8],[96.0,29.4],[95.4,29.0],[94.6,29.3],[92.0,27.7],[89.9,28.3],[88.9,27.3],[88.6,28.1],[86.0,27.9],[82.0,30.3],[81.1,30.0],[78.7,31.3],[78.4,32.5],[79.2,32.5],[79.0,34.3],[78.3,34.7],[78.0,35.5],[76.2,35.8],[75.8,36.7],[74.4,37.1],[75.1,37.4],[74.8,38.4],[73.8,38.6]],[[108.7,19.3],[109.3,19.9],[111.0,19.9],[109.7,18.2],[108.7,18.5]]]};
 SL.map2=()=>{title('亞洲與世界地圖 Asia & World Maps','Natural Earth 簡化輪廓：六大洲、亞洲國家與東南亞分區皆為原生圖形，可單獨上色');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,card}=UK();
  const draw=(D,hi,base,box4,x,y,w,h,pre)=>Object.entries(D).forEach(([k,rs])=>rs.forEach((pts,j)=>path(geoP(pts,x,y,w,h,...box4),{fill:hi[k]||base,line:'FFFFFF',lw:.5,close:true,name:pre+k+(j?' '+(j+1):'')})));
  const lab=(t,px,py,o)=>T(px-.6,py-.12,1.2,.24,t,Object.assign({size:9,bold:1,color:G.ink,align:'center',wrap:0,name:'地名'},o||{}));
  comp('A','世界地圖（六大洲可上色）','World map',{x:X0,y:Y0,w:7.4,h:2.95},(x,y,w,h)=>{const B4=[-170,180,-56,78],hi={亞洲:P,北美:mix(P,'FFFFFF',.45)};draw(WORLD,hi,'D9D9D9',B4,x,y,w,h,'洲 ');
   [['台北',121.5,25],['聖荷西',-121.9,37.3],['德勒斯登',13.7,51]].forEach(([t,lo,la],i)=>{const [px,py]=geoP([[lo,la]],x,y,w,h,...B4)[0];pinS(px,py,.18,i===0?DARK:PD,String(i+1));lab(t,px,py+.14);});});
  comp('B','亞洲地圖（台灣・日韓・東南亞分區）','Asia map',{x:X0+7.7,y:Y0,w:CW-7.7,h:2.95},(x,y,w,h)=>{const B4=[66,150,-11,54],hi={台灣:P,日本:mix(P,'FFFFFF',.35),韓國:mix(P,'FFFFFF',.5),東南亞:mix(P,'FFFFFF',.7),中國:'D9D9D9'};draw(ASIA,hi,'E6E6E6',B4,x,y,w,h,'區 ');
   [['日本',146.5,38.5],['韓國',122.5,38.6],['東南亞',112,13],['中國',100,35],['印度',78,22]].forEach(([t,lo,la])=>{const [px,py]=geoP([[lo,la]],x,y,w,h,...B4)[0];lab(t,px,py,{color:t==='東南亞'||t==='中國'||t==='印度'?'5B6474':PD});});
   [['新竹',121,24.8],['熊本',130.7,32.8],['新加坡',103.8,1.35]].forEach(([t,lo,la],i)=>{const [px,py]=geoP([[lo,la]],x,y,w,h,...B4)[0];pinS(px,py,.18,DARK,String(i+1));if(i===2)lab('新加坡',px+.8,py-.12,{align:'left',size:10.5,color:'5B6474'});if(i===1){ln(px+.08,py+.02,px+.5,py+.12,{c:'8A94A6',w:.5,name:'引導線'});lab('熊本',px+1.14,py+.12,{align:'left',color:'5B6474'});}if(i===0){lab('台灣・新竹',px+.77,py-.08,{align:'left'});const cx0=px+.62,cy0=py+.62,d=.6;ln(px+.08,py+.08,cx0-d/2*.7,cy0-d/2*.7,{c:P,w:.75});circ(cx0,cy0,d,{fill:W2,line:P,lw:1,name:'台灣放大圓'});(ASIA['台灣']||[]).forEach(pts=>path(geoP(pts,cx0-.17,cy0-.24,.34,.48,119.9,122.1,21.8,25.4),{fill:P,line:P,lw:.25,close:true,name:'台灣（放大）'}));circ(cx0+(121-119.9)/2.2*.34-.17,cy0-.24+(25.4-24.8)/3.6*.48,.07,{fill:'FFFFFF',line:DARK,lw:.75,name:'新竹點'});}});});
  const y2=Y0+2.95+.5,h2=Math.max(1.12,Y1-y2-.3);
  comp('C','區域營收占比','Revenue by region',{x:X0,y:y2,w:5.6,h:h2},(x,y,w,h)=>{[['亞洲',62,P],['北美',24,mix(P,'FFFFFF',.45)],['歐洲',10,'BFBFBF'],['其他',4,'D9D9D9']].forEach(([t,v,c],i)=>{const yy=y+i*.27;T(x,yy,.8,.26,t,{size:10,color:G.ink,wrap:0,name:'區域'});box(x+.85,yy+.06,(w-1.6)*v/62,.15,{fill:c,r:0,name:'占比條'});T(x+.95+(w-1.6)*v/62,yy,.7,.26,v+'%',{size:10,bold:1,color:G.ink,font:nf,wrap:0,name:'占比'});});});
  comp('D','全球據點清單','Site list',{x:X0+5.9,y:y2,w:CW-5.9,h:h2},(x,y,w,h)=>{[['台北','總部｜研發','1,200 人'],['聖荷西','北美業務','80 人'],['德勒斯登','歐洲工廠','300 人']].forEach(([a,b,c],i)=>{const xx=x+i*(w/3);bdg(xx+.2,y+.2,.32,String(i+1),i===0?DARK:PD);T(xx+.45,y+.04,w/3-.5,.32,a,{size:Z(12),bold:1,color:G.ink,wrap:0,name:'據點'});T(xx+.45,y+.36,w/3-.5,.28,b,{size:10.5,color:'5B6474',wrap:0,name:'功能'});T(xx+.45,y+.82,w/3-.5,.28,c,{size:10.5,bold:1,color:P,font:nf,wrap:0,name:'人數'});});});};
 SL.map=()=>{title('地圖與據點 Maps & Locations','台灣示意地圖＋據點釘、據點清單、世界區域方塊圖、路線與距離：全部原生形狀，可改色改字');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,card}=UK();const C=GRID(3,2,Y0,Y1);
  const TWP=[[121.5,25.3],[121.9,25.1],[122.0,24.85],[121.8,24.5],[121.65,24.0],[121.5,23.5],[121.3,23.0],[121.0,22.55],[120.85,21.92],[120.7,22.3],[120.5,22.5],[120.3,22.7],[120.12,23.0],[120.1,23.45],[120.2,23.8],[120.4,24.2],[120.7,24.62],[121.0,25.02],[121.3,25.2]];
  const tw2=(x,y,w,h)=>{const s=Math.min(w/2.4,h/3.6),ox=x+(w-1.9*s)/2,oy=y+.05;return [lo=>ox+(lo-120.1)*s,la=>oy+(25.35-la)*s];};
  comp('A','台灣示意地圖＋據點','Taiwan map + pins',{x:C[0].x,y:C[0].y,w:C[0].w,h:C[3].y+C[3].h-C[0].y},(x,y,w,h)=>{const [mx,my]=tw2(x,y,w,h);path(TWP.map(([a,b])=>[mx(a),my(b)]),{fill:'E4EAF1',line:'B8C4D3',lw:1,close:true,name:'台灣（示意）'});
   [[121.52,25.04,'台北'],[120.97,24.8,'新竹'],[120.68,24.15,'台中'],[120.3,22.62,'高雄']].forEach(([a,b,t],i)=>{pinS(mx(a),my(b),.3,i===1?P:DARK,String(i+1));T(mx(a)+.2,my(b)-.42,.9,.28,t,{size:10.5,bold:1,color:G.ink,wrap:0,name:'城市'});});});
  comp('B','據點釘 5 款','Pin styles',C[1],(x,y,w,h)=>{pinS(x+.4,y+.8,.4,P,'1');pinS(x+1.2,y+.8,.4,DARK,'');circ(x+2.0,y+.6,.22,{fill:P,line:W2,lw:2,name:'圓點據點'});circ(x+2.0,y+.6,.5,{line:P,lw:1,name:'範圍圈'});
   T(x,y+1.0,w,.3,'編號釘 · 實心釘 · 圓點＋範圍',{size:10,color:G.t2,wrap:0,name:'說明'});
   const y2=y+1.5;pill(x,y2,1.2,.28,'台中廠 300',P,{size:10,name:'標籤釘'});circ(x+1.32,y2+.14,.12,{fill:P,name:'標籤釘點'});[[.2,'40'],[.28,'120'],[.36,'300']].forEach(([d,t],i)=>{circ(x+1.9+i*.5,y2+.14,d,{fill:TN(P,.75-.2*i),line:W2,lw:1,name:'規模泡泡'});});
   T(x+3.25,y2,w-3.25,.28,'規模泡泡',{size:10,color:G.t2,wrap:0,name:'說明'});});
  comp('C','據點清單（編號對應地圖）','Location list',C[2],(x,y,w,h)=>{[['台北','總部 · 120 人'],['新竹','研發 · 80 人'],['台中','工廠 · 300 人'],['高雄','倉儲 · 40 人']].forEach(([a,b],i)=>{const yy=y+i*.42;bdg(x+.16,yy+.16,.3,String(i+1),i===1?P:DARK,{size:10});T(x+.42,yy,.9,.32,a,{size:Z(11.5),bold:1,color:G.ink,wrap:0,name:'城市'});T(x+1.3,yy,w-1.3,.32,b,{size:10.5,color:G.t2,wrap:0,name:'說明'});});});
  comp('D','世界區域方塊圖','Region tile map',C[4],(x,y,w,h)=>{const R=[['北美',0,0,'12'],['歐洲',1.15,0,'8'],['亞太',2.3,0,'25'],['中南美',0,.75,'3'],['中東非',1.15,.75,'2'],['台灣',2.3,.75,'40']],cw=Math.min(1.05,(w-.2)/3);R.forEach(([t,dx,dy,v],i)=>{const on=t==='台灣'||t==='亞太';const xx=x+dx*(cw/1.05)*1.05/1.1,yy=y+dy;box(xx,yy,cw,.65,{fill:on?P:TN(P,.85),r:.06,name:'區域'});T(xx,yy+.04,cw,.3,t,{size:10.5,bold:1,color:on?W2:PD,align:'center',wrap:0,name:'區域名'});T(xx,yy+.32,cw,.3,v+' 家',{size:10.5,color:on?W2:PD,align:'center',font:nf,wrap:0,name:'數值'});});});
  comp('E','路線與距離','Route',C[5],(x,y,w,h)=>{pinS(x+.3,y+.75,.32,DARK,'A');pinS(x+w-.35,y+.75,.32,P,'B');ln(x+.5,y+.5,x+w-.55,y+.5,{c:G.t2,w:1.5,dash:'dash',head:'triangle'});pill(x+w/2-.75,y+.12,1.5,.28,'2.5 小時 · 180 km',DARK,{size:10});
   T(x,y+.9,1.2,.3,'新竹廠',{size:10.5,bold:1,color:G.ink,wrap:0,name:'起點'});T(x+w-1.2,y+.9,1.2,.3,'台中廠',{size:10.5,bold:1,color:P,align:'right',wrap:0,name:'終點'});});};
 SL.biz=()=>{title('商業框架 Business Frameworks','商業模式圖 BMC、PESTEL、OKR、波特五力：格子與文字都可改，適合提案與策略簡報');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,card}=UK();
  comp('A','商業模式圖 BMC（9 格）','Business Model Canvas',{x:X0,y:Y0,w:7.2,h:2.6},(x,y,w,h)=>{const vw=2.6,c=(w-vw)/4,X=[x,x+c,x+2*c,x+2*c+vw,x+3*c+vw],r1=h*.68,r2=h-r1;const BEN={關鍵夥伴:'KP',關鍵活動:'KA',關鍵資源:'KR',價值主張:'Value',顧客關係:'CR',通路:'CH',客戶區隔:'Segments',目標客群:'CS',成本結構:'Cost',收入來源:'Revenue'};const cell=(cx,cy,cw,chh,t,s,hi)=>{box(cx,cy,cw,chh,{fill:hi?TN(P,.9):W2,line:'D0D7E2',lw:.75,r:0,name:'格'});T(cx+.12,cy+.12,cw-.24,.42,[{t,b:1,c:P},{t:BEN[t]?'\n'+BEN[t]:'',s:10,b:0,c:'5B6474',f:nf}],{size:11,wrap:0,valign:'top',name:'格名'});T(cx+.12,cy+.56,cw-.24,chh-.64,s,{size:10.5,lsp:1.15,color:G.t2,valign:'top',name:'內容'});};
   cell(x,y,c,r1,'關鍵夥伴','設備商\n材料商');cell(X[1],y,c,r1/2,'關鍵活動','製程優化');cell(X[1],y+r1/2,c,r1/2,'關鍵資源','工程團隊');cell(X[2],y,vw,r1,'價值主張','高良率\n穩定交期',1);
   cell(X[3],y,c,r1/2,'顧客關係','專屬窗口');cell(X[3],y+r1/2,c,r1/2,'通路','直銷');cell(X[4],y,c,r1,'目標客群','IC 設計\n車用');cell(x,y+r1,w/2,r2,'成本結構','設備折舊 · 人力');cell(x+w/2,y+r1,w/2,r2,'收入來源','晶圓代工 · NRE');});
  comp('B','PESTEL（6 面向）','PESTEL',{x:X0+7.5,y:Y0,w:CW-7.5,h:2.6},(x,y,w,h)=>{const cw=(w-.2)/2,rh=(h-.2)/3;[['P','政治','補助政策'],['E','經濟','匯率波動'],['S','社會','人才短缺'],['T','科技','AI 需求'],['E','環境','用水用電'],['L','法規','出口管制']].forEach(([k,t,s],i)=>{const xx=x+(i%2)*(cw+.2),yy=y+Math.floor(i/2)*(rh+.1);
   box(xx,yy,cw,rh-.0,{fill:W2,line:G.l2,lw:.75,r:.06,name:'格'});box(xx+.1,yy+(rh-.44)/2,.44,.44,{fill:i===3?P:DARK,r:.06,text:k,size:Z(14),bold:1,color:W2,font:nf,margin:0,name:'字母'});T(xx+.64,yy+.06,cw-.7,.3,t,{size:Z(11),bold:1,color:G.ink,wrap:0,name:'面向'});T(xx+.64,yy+.38,cw-.7,.3,s,{size:10.5,color:G.t2,wrap:0,name:'內容'});});});
  const y2=Y0+2.6+.62,h2=Y1-y2-.3;
  comp('C','OKR 目標與關鍵結果','OKR',{x:X0,y:y2,w:5.6,h:h2},(x,y,w,h)=>{box(x,y,w,.42,{fill:P,r:.06,name:'目標底'});T(x+.14,y,w-.2,.42,[{t:'O  ',b:1,f:nf},{t:'B 線良率達到業界前段班'}],{size:Z(12),bold:1,color:W2,wrap:0,name:'目標'});
   [['KR1','良率 ≥ 98.5%','80%'],['KR2','客訴 ≤ 2 件／月','60%'],['KR3','SOP 100% 更新','100%']].forEach(([k,t,p],i)=>{const yy=y+.5+i*.34;T(x+.14,yy,.5,.3,k,{size:10.5,bold:1,color:P,font:nf,wrap:0,name:'KR'});T(x+.7,yy,2.7,.3,t,{size:10.5,color:G.ink,wrap:0,name:'關鍵結果'});box(x+3.5,yy+.11,1.4,.09,{fill:'E6E6E6',r:'full',name:'進度底'});box(x+3.5,yy+.11,1.4*parseFloat(p)/100,.09,{fill:P,r:'full',name:'進度'});T(x+4.95,yy,.6,.3,p,{size:10,bold:1,color:'262626',font:nf,align:'right',wrap:0,name:'%'});});});
  comp('D','波特五力','Five forces',{x:X0+5.9,y:y2,w:CW-5.9,h:h2},(x,y,w,h)=>{const bw=1.7,bh=.42,cx=x+w/2,cy=y+h/2;const B=(x0,y0,t,hi)=>box(x0-bw/2,y0-bh/2,bw,bh,{fill:hi?P:W2,line:hi?P:G.l1,lw:1,r:.06,text:t,size:10.5,bold:1,color:hi?W2:G.ink,margin:0,name:'力量'});
   const c0=B(cx,cy,'產業競爭',1),n=B(cx,y+bh/2,'新進入者'),s=B(cx,y+h-bh/2,'替代品'),l=B(x+bw/2,cy,'供應商議價'),r=B(x+w-bw/2,cy,'買方議價');link(n,2,c0,0);link(s,0,c0,2);link(l,3,c0,1);link(r,1,c0,3);});};
 SL.biz2=()=>{title('組織、時程與畫布 Org, Gantt & Canvas','3 層組織圖、月／季刻度甘特、精實畫布、價值鏈：格子與文字都可改，連線黏著');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card}=UK();const C=GRID(2,2,Y0,Y1,{gy:.12});const nd=(x,y,w,t,o)=>sym('proc',x,y,w,.36,t,Object.assign({size:10.5},o||{}));
  comp('A','3 層組織圖','3-level org chart',C[0],(x,y,w,h)=>{const top=nd(x+w/2-.75,y,1.5,'廠長 王大明',{strong:1});const L2=['製程部','品保部','設備部'],cw2=1.5,sp2=(w-cw2)/2;
   const m=L2.map((t,i)=>nd(x+i*sp2,y+.8,cw2,t));m.forEach(b=>link(top,2,b,0,{mid:y+.6}));
   const L3=[['CMP 課','蝕刻課'],['IQC 課','OQC 課'],['保養課','治具課']];L3.forEach((ks,i)=>ks.forEach((t,j)=>{const cw3=(cw2-.1)/2,b=nd(x+i*sp2+j*(cw3+.1),y+1.6,cw3,t,{size:10});link(m[i],2,b,0,{mid:y+1.4});}));});
  comp('B','甘特圖（月／季刻度）','Gantt · month & quarter',C[1],(x,y,w,h)=>{const lc=1.3,gw=w-lc,M=['1月','2月','3月','4月','5月','6月'],mw=gw/6;
   ['Q1','Q2'].forEach((q,i)=>{const on=i===1;box(x+lc+i*3*mw+.02,y,3*mw-.04,.26,{fill:on?P:TN(P,.85),r:0,text:q+(on?'（本季）':''),size:10,bold:1,color:on?W2:PD,font:nf,margin:0,name:'季'});});
   box(x,y+.07,.14,.12,{fill:P,r:0,name:'圖例・本季'});T(x+.2,y,lc-.25,.26,'本季',{size:9,color:G.t2,wrap:0,name:'圖例'});ln(x+.07,y+.31,x+.07,y+.47,{c:AL,w:1.25,dash:'dash',name:'圖例・今天'});T(x+.2,y+.26,lc-.25,.26,'今天',{size:9,color:G.t2,wrap:0,name:'圖例'});
   M.forEach((t,i)=>{T(x+lc+i*mw,y+.28,mw,.24,t,{size:10,color:G.t2,align:'center',wrap:0,name:'月'});if(i)ln(x+lc+i*mw,y+.54,x+lc+i*mw,y+h-.05,{c:i%3?G.l2:G.l1,w:i%3?.5:1,dash:i%3?'sysDot':'solid'});});
   [['需求定義',0,1.5,DARK],['設計開發',1,3,P],['試產驗證',3.5,1.5,P],['量產導入',5,1,AC2]].forEach(([t,s0,d,c],i)=>{const yy=y+.62+i*.38;T(x,yy,lc-.08,.3,t,{size:10.5,color:G.ink,wrap:0,name:'任務'});box(x+lc+s0*mw,yy+.06,d*mw,.2,{fill:c,r:'full',name:'任務條'});});
   const tx=x+lc+4.5*mw;ln(tx,y+.54,tx,y+h-.1,{c:AL,w:1.25,dash:'dash',name:'今天'});});
  comp('C','精實畫布 Lean Canvas','',C[2],(x,y,w,h)=>{const c=w/5,r1=h*.68,r2=h-r1;const cell=(cx,cy,cw,ch,t,e,s,hi)=>{box(cx,cy,cw,ch,{fill:hi?TN(P,.9):W2,line:G.l2,lw:.75,r:0,name:'格'});T(cx+.06,cy+.03,cw-.1,.44,[{t,b:1,c:hi?P:G.ink},{t:'\n'+e,s:9,b:0,c:G.mute,f:nf}],{size:10,wrap:0,valign:'top',name:'格名'});T(cx+.06,cy+.46,cw-.1,ch-.48,s,{size:10,color:G.t2,valign:'top',name:'內容'});};
   cell(x,y,c,r1,'問題','Problem','良率靠人工判讀');cell(x+c,y,c,r1/2,'解法','Solution','AI 自動判片');cell(x+c,y+r1/2,c,r1/2,'指標','Key Metrics','誤判率');cell(x+2*c,y,c,r1,'獨特價值','UVP','判片時間 −80%',1);
   cell(x+3*c,y,c,r1/2,'門檻優勢','Moat','製程資料');cell(x+3*c,y+r1/2,c,r1/2,'通路','Channels','廠內 IT');cell(x+4*c,y,c,r1,'客群','Segments','12 吋廠');
   cell(x,y+r1,w/2,r2,'成本結構','Cost Structure','GPU · 標註人力');cell(x+w/2,y+r1,w/2,r2,'收入來源','Revenue Streams','年授權 · 導入費');});
  comp('D','價值鏈 Value Chain','',C[3],(x,y,w,h)=>{const sh=.42,supH=4*sh;const S=['企業基礎設施','人力資源','技術研發','採購'];S.forEach((t,i)=>box(x,y+i*sh,w-.8,sh-.04,{fill:i%2?'F2F2F2':'F7F7F7',r:0,text:t,size:10,color:G.t2,margin:[6,4,0,0],align:'left',name:'支援活動'}));
   const P5=['進料物流','生產製造','出貨物流','行銷銷售','售後服務'],pw=(w-.8)/5,py=y+supH+.06,ph=h-supH-.1;P5.forEach((t,i)=>el(i?'chevron':'homePlate',x+i*pw,py,pw+.08,ph,{fill:i===1?P:TN(P,.82),adj:.18,text:t,size:10,bold:1,color:i===1?W2:PD,margin:0,name:'主要活動'}));
   el('homePlate',x+w-.8,y,.8,h-.04,{fill:DARK,adj:.5,name:'利潤箭頭'});T(x+w-.35-.28,y+(h-.04)/2-.15,.56,.3,'利潤',{size:10,bold:1,color:W2,align:'center',valign:'middle',wrap:0,name:'利潤'});});};
 SL.pitch=()=>{title('提案與募資 Pitch Kit','市場 TAM／SAM／SOM、The Ask、財務摘要、單位經濟、團隊照片牆、里程碑：比賽與提案最常用的頁面零件');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,card,ph}=UK();const C=GRID(3,2,Y0,Y1);
  comp('A','市場規模 TAM／SAM／SOM','Market sizing',C[0],(x,y,w,h)=>{const d=Math.min(h,w*.55),cx=x+d/2,cb=y+d;[[1,'E4EAF1'],[.68,TN(P,.6)],[.38,P]].forEach(([k,c],i)=>circ(cx,cb-d*k/2,d*k,{fill:c,line:W2,lw:1,name:['TAM','SAM','SOM'][i]}));
   [['TAM','NT$ 1,200 億','整體市場'],['SAM','NT$ 300 億','可服務'],['SOM','NT$ 24 億','3 年可取得']].forEach(([k,v,t],i)=>{const yy=y+.1+i*(d/3);T(x+d+.2,yy,w-d-.2,.28,[{t:k+' ',b:1,c:i===2?P:G.ink,f:nf},{t:v,b:1,f:nf}],{size:Z(11),color:G.ink,wrap:0,name:'數值'});T(x+d+.2,yy+.28,w-d-.2,.26,t,{size:10,color:G.t2,wrap:0,name:'說明'});});});
  comp('B','The Ask 募資需求','The ask',C[1],(x,y,w,h)=>{card(x,y,w,h,{line:P,lw:1.5});T(x+.2,y+.1,w-.4,.3,'我們需要',{size:Z(11),color:G.t2,wrap:0,name:'標題'});T(x+.2,y+.38,w-.4,.6,[{t:'NT$ 3,000',b:1,c:P,f:nf},{t:' 萬',s:Z(14),c:G.ink}],{size:Z(30),wrap:0,name:'金額'});
   [['研發',50],['業務',30],['營運',20]].forEach(([t,p],i)=>{const yy=y+1.08+i*.3,bw=w-1.6;T(x+.2,yy,.6,.26,t,{size:10,color:G.ink,wrap:0,name:'用途'});box(x+.8,yy+.08,bw*p/50*.9,.12,{fill:i===0?P:'A6A6A6',r:0,name:'比例'});T(x+.86+bw*p/50*.9,yy,.5,.26,p+'%',{size:10,bold:1,color:'262626',font:nf,wrap:0,name:'%'});});});
  comp('C','財務摘要表（原生表格）','Financial summary',C[2],(x,y,w,h)=>{const bR={c:G.l2,w:.5},bH={c:P,w:1.25};const rows=[['NT$ 百萬','2025','2026E','2027E'],['營收','120','210','380'],['毛利率','38%','42%','46%'],['營業利益','−15','18','62'],['現金流','−22','5','40']];
   const c0=w*.34,cw=(w-c0)/3;table(x,y,[c0,cw,cw,cw],[.34,.34,.34,.34,.34],rows.map((r,ri)=>r.map((c,ci)=>{const o={t:c,bB:bR,font:ci?nf:undefined,align:ci?'right':'left'};if(ri===0)Object.assign(o,{bold:1,color:G.t2,bB:bH});if(ci===3&&ri>0)Object.assign(o,{bold:1,color:P});return o;})),{size:Z(10.5),name:'財務摘要'});});
  comp('D','單位經濟 Unit economics','Unit economics',C[3],(x,y,w,h)=>{const cw=(w-.3)/3;[['CAC','1.2 萬','獲客成本'],['LTV','7.8 萬','顧客終身價值'],['LTV/CAC','6.5×','≥ 3 為健康']].forEach(([k,v,t],i)=>{const xx=x+i*(cw+.15);card(xx,y,cw,h);T(xx,y+.15,cw,.28,k,{size:10.5,bold:1,color:G.t2,align:'center',font:nf,wrap:0,name:'指標'});T(xx,y+.48,cw,.5,v,{size:Z(20),bold:1,color:i===2?P:G.ink,align:'center',font:nf,wrap:0,name:'數值'});T(xx,y+1.02,cw,.28,t,{size:10,color:G.t2,align:'center',wrap:0,name:'說明'});});});
  comp('E','團隊照片牆','Team photo wall',C[4],(x,y,w,h)=>{const n=4,cw=w/n,d=Math.min(cw-.25,h-.7);[['陳怡君','CEO'],['黃承','CTO'],['林維','COO'],['孫宇','CFO']].forEach(([a,b],i)=>{const cx=x+cw*(i+.5);photo(cx,y+d/2,d);T(cx-cw/2,y+d+.06,cw,.28,a,{size:Z(11),bold:1,color:G.ink,align:'center',wrap:0,name:'姓名'});T(cx-cw/2,y+d+.32,cw,.26,b,{size:10,color:G.t2,align:'center',font:nf,wrap:0,name:'職稱'});});});
  comp('F','里程碑路線圖','Roadmap',C[5],(x,y,w,h)=>{const n=4,cw=w/n,yy=y+.55;ln(x,yy,x+w,yy,{c:G.l1,w:1.5,head:'triangle'});[['2025 Q4','原型'],['2026 Q2','首家客戶'],['2026 Q4','損益兩平'],['2027','海外']].forEach(([a,b],i)=>{const cx=x+cw*(i+.5),on=i===1;circ(cx,yy,on?.26:.18,{fill:on?P:W2,line:on?P:G.t2,lw:1.5,name:'里程碑'});
   T(cx-cw/2,y,cw,.28,a,{size:10,bold:1,color:on?P:G.t2,align:'center',font:nf,wrap:0,name:'時間'});T(cx-cw/2,yy+.22,cw,.3,b,{size:10.5,bold:on,color:G.ink,align:'center',wrap:0,name:'里程碑名'});});pill(x+cw*1.5-.4,yy+.6,.8,.26,'現在',P,{size:10});});};
 SL.plan=()=>{title('到職計畫與自我推薦 30-60-90 & Why Me','30-60-90 天計畫、為什麼選我、一頁履歷、圓形照片名片：面試最後一哩');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,card}=UK();
  comp('A','30-60-90 天計畫','30-60-90 plan',{x:X0,y:Y0,w:CW,h:2.0},(x,y,w,h)=>{const cw=(w-.6)/3;[['30 天','學習 Learn',['熟悉產線與 SOP','訪談 10 位關鍵人','盤點良率資料']],['60 天','貢獻 Contribute',['提出 3 項改善提案','完成第一個 DOE','建立週報看板']],['90 天','主導 Lead',['主導 B 線改善專案','良率 +0.5 pt','建立跨部門例會']]].forEach(([a,b,L],i)=>{const xx=x+i*(cw+.3);
   el(i?'chevron':'homePlate',xx,y,cw+.15,.46,{fill:i===2?P:i===1?TN(P,.4):'D9D9D9',adj:.15,text:a+'  '+b,size:Z(12),bold:1,color:i===0?G.ink:W2,margin:0,name:'階段'});L.forEach((t,j)=>{circ(xx+.2,y+.8+j*.4,.1,{fill:i===2?P:'8C8C8C',name:'項目符號'});T(xx+.36,y+.64+j*.4,cw-.4,.32,t,{size:Z(11.5),color:G.ink,wrap:0,name:'行動'});});});});
  const y2=Y0+2.0+.62,h2=Y1-y2-.3;
  comp('B','為什麼選我（3 個理由＋證據）','Why me',{x:X0,y:y2,w:6.0,h:h2},(x,y,w,h)=>{[['懂製程','6 年 CMP／蝕刻整合','良率 +2.1 pt'],['會用數據','Python／JMP 自動化','每月省 37 h'],['能帶人','帶 5 人跨部門專案','如期結案']].forEach(([a,b,c],i)=>{const yy=y+i*(h/3);bdg(x+.22,yy+.32,.4,String(i+1),i===0?P:DARK);T(x+.55,yy+.06,1.5,.32,a,{size:Z(13),bold:1,color:G.ink,wrap:0,name:'理由'});T(x+.55,yy+.38,3.2,.28,b,{size:10.5,color:G.t2,wrap:0,name:'說明'});pill(x+w-1.5,yy+.18,1.4,.3,c,TN(P,.86),{size:10.5,color:PD,name:'證據'});});});
  comp('C','圓形照片名片','Photo name card',{x:X0+6.3,y:y2,w:CW-6.3,h:h2},(x,y,w,h)=>{card(x,y,w,h);const d=Math.min(1.5,h-.4);photo(x+.25+d/2,y+h/2,d);T(x+d+.5,y+.25,w-d-.6,.5,'陳怡君',{size:Z(28),bold:1,color:G.ink,wrap:0,name:'姓名'});T(x+d+.5,y+.78,w-d-.6,.32,'製程整合工程師 · 6 年',{size:Z(14),color:P,wrap:0,name:'職稱'});
   T(x+d+.5,y+1.18,w-d-.6,.28,'yc.chen@example.com',{size:10.5,color:G.t2,font:nf,wrap:0,name:'Email'});T(x+d+.5,y+1.46,w-d-.6,.28,'linkedin.com/in/ycchen',{size:10.5,color:G.t2,font:nf,wrap:0,name:'LinkedIn'});});};
 if(opt.icon||opt.table){const kk=SIZE_K[st.size]||1;sno=1;cur={key:opt.icon?'icon':'table',title:opt.icon?'圖示':'表格',no:1,items:[],groups:[]};slides.push(cur);
  if(opt.icon)oneIcon(opt.icon,kk);else userTable(opt.table,kk);const info=opt.table&&slides[0].table,tableDocuments=info?[Object.fromEntries(['documentId','pageCount','rawRowCount','rawBodyRows','h0','nC'].map(key=>[key,info[key]]))]:[];if(info&&info.sizing&&info.sizing.version===2)tableDocuments[0].sizing={version:2,widthMode:info.sizing.widthMode};return{slides,warns,params:st,k:kk,custom:true,tableDocuments};}
 /* 單一圖示投影片：pic＝SVG 圖片（PNG 備援，PowerPoint 365 可「轉換成圖案」）；否則＝原生自訂圖案 */
 function oneIcon(o,k){const ic=ICONS&&ICONS.BY[o.id];if(!ic)throw new Error('沒有這個圖示：'+o.id);const s=(o.size||.6)*k,x=(W-s)/2,y=(H-s)/2;
  if(o.pic){cur.items.push({t:'pic',x,y,w:s,h:s,png:o.png,svg:o.svg,name:'圖示 '+ic.zh});cur.groups.push({name:ic.zh,from:0,to:0,x,y,w:s,h:s});return;}
  grp(ic.zh,()=>icon(o.id,x,y,s,{variant:o.variant}));}
 /* 使用者表格（R1 重新設計）：貼上的資料 → 原生 PowerPoint 表格。
    版面固定：標題 x0.6 y0.5（24pt）→ 單位（12pt）→ 表格 y1.45（≥5 欄滿版 12.13"，否則依內容、最少 6"、靠左）→ 註腳（10pt）。
    外觀：bandcard 主色表頭＋卡片、hair 細橫線，以及 clean 細線（FT 式 1.5／0.75／0.25／0.75／1.5）、band 主色表頭、card 卡片（白卡＋陰影）、zebra 斑馬密集。
    數字預設保留原始文字；只有明確指定數字欄與千分位時才加入分隔符，絕不經浮點數轉換；狀態＝小圓點＋上色文字（不填底）；
    重點只用一種強調色（紅色只留給警示／條件），不疊色；文字對底色自動加深到 4.5:1。預覽、匯出、HTML 複製共用這份 model。 */
 function hueOf(x){const [r,g,b]=[0,2,4].map(i=>parseInt(x.slice(i,i+2),16)/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),dd=mx-mn;if(!dd)return -1;let h=mx===r?((g-b)/dd)%6:mx===g?(b-r)/dd+2:(r-g)/dd+4;return (h*60+360)%360;}
function hueD(a,b){const x=hueOf(a),y=hueOf(b);if(x<0||y<0)return 90;const d=Math.abs(x-y);return Math.min(d,360-d);}
function stO_(){return st;}
// 小表自動放大（列少自動放大 tbAuto）：表格太小時把字級／列高／欄寬一起放大，直到約佔內容寬 62% 或高度用完（內文最多 24pt）
function userTable(T,k){if(tableSizingOf(st).version===2)return userTableSized(T);const first=cur,slideStart=slides.indexOf(first),n0=first.items.length,w0=warns.length;
  const reset=()=>{slides.splice(slideStart+1);cur=first;cur.items.length=n0;warns.length=w0;delete cur.table;};
  userTable0(T,k,1);
  // Only genuinely small tables may auto-enlarge within the ordinary canvas.
  if(st.tbAuto===false||!first.table||first.table.pageCount>1||!first.table.exportComplete||(Array.isArray(T.cw)&&T.cw.length)||st.tbDense==='dense'||st.tbDense==='compact')return;
  const CW=W-1.2;let best=1;
  for(let b=1.1;b<=2.6;b=+(b+.1).toFixed(2)){const prev=first.table;const FCAP={comfy:24,dense:20}[st.tbDense]||22;
   if(prev.fs>=FCAP||(prev.tW>=.62*CW&&prev.tH>=.45*(H-1.5)))break;
   reset();userTable0(T,k,b);const t=first.table;
   if(!t||t.pageCount>1||!t.exportComplete||t.tW>CW+.01||first.h>H+.01||t.fs>FCAP+.01||t.orphans.length>prev.orphans.length){reset();userTable0(T,k,best);break;}best=b;}
  first.table.boost=best;cur=first;}
// Resolve readable typography from the unchanged default auto/optimal layout first.
// Width/height choices then reflow that typography; reducing height cannot shrink type.
function userTableSized(T){const first=cur,slideStart=slides.indexOf(first),n0=first.items.length,w0=warns.length;
 const reset=()=>{slides.splice(slideStart+1);cur=first;cur.items.length=n0;warns.length=w0;delete cur.table;};
 const savedFont=tableSizingFontOf(T.sizingFont);if(savedFont){userTable0(T,savedFont.scale/savedFont.autoBoost,savedFont.autoBoost,false,savedFont);if(first.table)first.table.boost=savedFont.autoBoost;return;}
 userTable0(T,1,1,true);let best=1;const CW=W-1.2;
 if(first.table&&first.table.exportComplete&&!(Array.isArray(T.cw)&&T.cw.length)){
  for(let b=1.1;b<=2.6;b=+(b+.1).toFixed(2)){const prev=first.table;
   if(prev.fs>=22||(prev.tW>=.62*CW&&prev.tH>=.45*(H-1.5)))break;
   reset();userTable0(T,1,b,true);const t=first.table;
   if(!t||!t.exportComplete||t.tW>CW+.01||first.h>H+.01||t.fs>22.01||t.orphans.length>prev.orphans.length)break;best=b;}}
 reset();userTable0(T,1,best,true);if(!first.table)return;
 const font={bodyPt:first.table.fs,headerPt:first.table.hfs,scale:first.table.k,autoBoost:best};
 reset();userTable0(T,font.scale/best,best,false,font);if(first.table)first.table.boost=best;cur=first;}
function userTable0(T,k,boost,sizingProbe,fontSnapshot){const st=TBL_FIXED(tableLayoutParams(stO_()));if(sizingProbe){st.tbWidthMode='auto';st.tbHeightMode='optimal';}if(fontSnapshot)st.tbAuto=false;
  const sizing=tableSizingOf(st),fixedWidth=sizing.version===2&&sizing.widthMode!=='auto',fixedTarget=fixedWidth?W*Number(sizing.widthMode)/100:null;
  const source=tableSource(T);const {nC,h0}=source;const src=source.previewRows;if(!src.length||!nC)return;
  // Do not filter empty rows: editor, marks and export all use the same source indices.
  const AU=source.auto;
  // 列數少→字大一點、列數多→維持（S／M／L 仍是基準）；tbAuto=false 關閉
  if(st.tbAuto!==false){const nb=src.length-h0;k=Math.min(1.45,k*(nb<=5?1.3:nb<=9?1.15:1));}if(boost>1)k*=boost;   // 文件長度不會降低使用者選擇的尺寸
  const lookId=tableLookOf(st),appearance=tableAppearanceOf(st);const grey=typeof st.tbCardOn==='boolean'||['card','bandcard'].includes(lookId)?false:st.tbLook==='panel'||st.tbCard==='grey'||(st.tbPanel&&!st.tbLook); // Table cards always use the white shadow backing, including legacy snapshots.
  const sz=v=>Math.round(v*k*2)/2;
  const TF=st.tbFont==='arial'?'Arial':(st.tbFont==='jh'||st.tbFont==='noto')?'Microsoft JhengHei':F;   // 表格文字字型（arial＝拉丁 Arial＋中文正黑：a:ea 會自動補成中文字型）
  const NF=st.tbFont==='arial'?'Arial':tableNumFont((st.tbFont==='jh'||st.tbFont==='noto')?'Microsoft JhengHei':nf);
  const tidy=t=>st.tbTight?String(t).replace(/([A-Za-z0-9%)\]])[ \u00A0]+(?=[\u3400-\u9fff])/g,'$1').replace(/([\u3400-\u9fff])[ \u00A0]+(?=[A-Za-z0-9(\[])/g,'$1'):t;
  const EC=P;                                     // 唯一強調色
  const ECd=mix(EC,'000000',.18);
  const looks={
   clean:{hdr:{color:G.ink,bT:{c:G.ink,w:1.5},bB:{c:G.ink,w:.75}},row:{c:G.line,w:.25},last:{c:G.ink,w:1.5},key:{c:G.ink,w:.75},hi:'fill'},
   band:{hdr:{fill:P,color:'FFFFFF'},row:{c:G.l2,w:.5},last:{c:P,w:1},key:{c:P,w:.75},keyFill:mix(P,'FFFFFF',.92),hi:'fill',tint:.94,hh:.40},
   card:{card:1,hdr:{color:PD,bB:{c:P,w:1}},row:grey?{c:'FFFFFF',w:1.25}:{c:G.l2,w:.5},last:null,key:{c:grey?G.t2:G.ink,w:.75},hi:'fill'},
   hair:{hdr:{color:G.ink,bB:{c:'D9D9D9',w:.4}},row:{c:'D9D9D9',w:.4},last:{c:'D9D9D9',w:.4},key:{c:'D9D9D9',w:.4},hi:'bold'},
   zebra:{dense:1,hdr:{color:G.t2,bB:{c:G.line,w:1}},row:null,zebra:mix(G.fill,'000000',.035),last:{c:G.t2,w:1},key:{c:G.t2,w:.75},hi:'bold'}};
  // Compose the colored header with the existing card backing, without changing geometry.
  const legacyLK=lookId==='bandcard'?Object.assign({},looks.band,{card:1,row:looks.card.row,last:null}):looks[lookId];
  // Null means an untouched legacy dimension. Override one concern at a time:
  // CARD must never change cells, spacing, header, stripes or semantic highlights.
  const LK=Object.assign({},legacyLK,{hdr:Object.assign({},legacyLK.hdr)});
  if(typeof st.tbCardOn==='boolean')LK.card=st.tbCardOn;
  if(['normal','primary'].includes(st.tbHeaderStyle)){LK.hdr.fill=appearance.header==='primary'?P:null;LK.hdr.color=appearance.header==='primary'?'FFFFFF':G.ink;}
  if(typeof st.tbStripes==='boolean')LK.zebra=st.tbStripes?mix(G.fill,'000000',.035):null;
  const explicitGrid=['all','horizontal','none'].includes(st.tbGrid);
  // Grid paint precedes semantic/manual highlights, which remain independent.
  const baseGrid=(o,ri)=>{if(!explicitGrid)return o;for(const edge of ['bT','bB','bL','bR'])delete o[edge];
   if(appearance.grid!=='none'){const b={c:'D9D9D9',w:Math.max(.5,Math.round(.5*k*4)/4)};o.bB=b;if(ri===0||appearance.grid==='all')o.bT=b;if(appearance.grid==='all')o.bL=o.bR=b;}return o;};
  let hiStyle=['fill','box','bold'].includes(T.hiStyle)?T.hiStyle:(st.tbHiMode==='fill'||st.tbHiMode==='box')?st.tbHiMode:LK.hi;
  if(legacyLK.hdr.fill&&hiStyle==='box')hiStyle='fill';   // 主色表頭：重點＝表頭填強調色＋內文 6% 淡底，不再疊外框（避免壓在表頭色帶與合計底色上）
  // 密度：舒適／標準／密集＝字級、列高、左右邊距各自調整（不是等比縮放）；斑馬外觀預設密集
  const DEN={comfy:{fs:14,hfs:12,rh:.48,hh:.48,pad:12},normal:{fs:13,hfs:11,rh:.34,hh:.38,pad:9},dense:{fs:11.5,hfs:10.5,rh:.28,hh:.32,pad:7}};
  const dn=DEN[st.tbDense==='compact'?'dense':st.tbDense]&&st.tbDense!=='normal'?DEN[st.tbDense==='compact'?'dense':st.tbDense]:DEN.normal;   /* 密度與外觀脫鉤：斑馬不再強制密集 */
  let fs=fontSnapshot?fontSnapshot.bodyPt:Math.max(10,sz(dn.fs)),hfs=fontSnapshot?fontSnapshot.headerPt:Math.max(9.5,sz(dn.hfs));const tfs=sz(24),ufs=sz(12),nfs=sz(10);   // 內文最小 10pt
  let rh=dn.rh*k,hh=dn.hh*k;   /* 表頭高不隨外觀改變 */
  // 儲存格邊界：無／小／中（預設）／大
  // Cell padding belongs to the spacing control, not to a legacy look. Apply
  // the same real inset to the first column, including its header. Explicit
  // "none" remains zero; card/header/grid paint must never override spacing.
  const PADM={none:0,s:.5,m:1,l:1.7}[st.tbPad]??1;const padH=dn.pad*k*PADM;
  const ST={good:GOOD,prog:G.t2,risk:BAD,mark:P,weak:G.mute};
  const bold=new Set((Array.isArray(T.bold)?T.bold:AU.key).map(Number));
  const keySet=new Set(AU.key);if(Array.isArray(T.bold))T.bold.forEach(r=>keySet.add(+r));
  const al=T.align||{};
  const colAl=Array.from({length:nC},(_,c)=>al[c]||((T.types||{})[c]==='number'?'right':c===0?'left':AU.numC[c]?'right':'left'));
  // Raw is the default, including inferred numeric columns. Legacy fmt/dec settings stay ignored.
  const rows=src.map((r,ri)=>r.map((t,c)=>ri<h0||AU.section[ri]?t:tableFormatValue(t,(T.types||{})[c],(T.formats||{})[c])));
  const MK=tableMarks(T,nC,rows.length),REC='176B70',WARN='875B1A';
  const his=MK.his.map(h=>Object.assign({},h,{C:h.type==='range'?tableHighlightPreset(h.presetId,st).color:h.kind==='warn'?WARN:h.kind==='rec'?REC:EC}));
  const hiCol=(r,c)=>his.find(h=>h.type==='col'&&tableMarkContains(h,r,c)),hiRow=(r,c)=>his.find(h=>h.type==='row'&&tableMarkContains(h,r,c)),hiCell=(r,c)=>his.find(h=>h.type==='cell'&&tableMarkContains(h,r,c));
  const rangeAt=(r,c)=>r>=0&&r<rows.length&&c>=0&&c<nC?tableRangeWinner(his,r,c,'fill'):null;
  const rangeBoldAt=(r,c)=>his.some(h=>tableMarkBoldAt(h,r,c));
  const rangePaint=(o,r,c)=>{if(rangeBoldAt(r,c))o.bold=true;const mark=rangeAt(r,c);if(!mark)return o;const preset=tableHighlightPreset(mark.presetId,st);
   o.fill=preset.fill;o.color=preset.color;if(preset.bold!=null)o.bold=!!preset.bold;
   if(preset.border){const border={c:preset.border,w:preset.borderWidth||1.5};
    if(rangeAt(r-1,c)!==mark)o.bT=border;if(rangeAt(r+1,c)!==mark)o.bB=border;if(rangeAt(r,c-1)!==mark)o.bL=border;if(rangeAt(r,c+1)!==mark)o.bR=border;}
   return o;};
  const TONE={warn:WARN,good:REC,accent:EC};
  const ruleOf=(ri,c)=>{if(ri<h0||AU.section[ri])return null;const v=tNumVal(src[ri][c]);if(!Number.isFinite(v))return null;return MK.rules.find(R=>R.c===c&&ruleHit(R,v))||null;};
  let ruleHits=0;const ruleBoxes=[];
  // 欄寬：數字欄＝內容＋18pt、同寬；第一欄吸收剩餘；單欄最多 45%
  const isNumFont=(ri,c)=>ri>=h0&&AU.numC[c]&&!AU.section[ri];
  const layoutBold=(ri,c,t)=>ri<h0||bold.has(ri)||keySet.has(ri)||rangeBoldAt(ri,c)||fixedWidth&&(AU.section[ri]||T.hcol&&c===0||AU.statC[c]&&statusOf(src[ri][c])||/^\s*[▲△▼▽]/.test(t)||hiStyle==='fill'&&(hiCell(ri,c)||c===0&&hiRow(ri,c)));
  const measureW=(t,size,b)=>Math.max(...String(t).split('\n').map(l=>tw(l,size)*(b?1.08:1)));
  const padOf=c=>padH+padH;   /* 欄寬與每欄實際內距一致，且不隨外觀改變 */
  // 中英混排寬度（含 PowerPoint／LibreOffice 的中英自動間距）
  const mw=(l,size,b)=>{l=String(l);const tr=st.tbTight?0:(l.match(/[\u3400-\u9fff][A-Za-z0-9]|[A-Za-z0-9][\u3400-\u9fff]/g)||[]).length;const mx=/[\u3400-\u9fff]/.test(l)&&/[A-Za-z0-9]/.test(l)?1.15:1.06;return tw(l,size)*(b?1.08:1)*mx+tr*size*.25/72;};
  // 語意斷行：優先在 ：/:/空白/（ 前/中英交界 斷；每行都放得下、不留 1–2 字孤行
  const semBreak=(t,size,b,av,dp=0)=>{t=String(t);if(/\n/.test(t)||mw(t,size,b)<=av||dp>8||t.length>160)return t;const L=fixedWidth?tableGraphemes(t):[...t];const vis=s=>s.replace(/\s/g,'').length;
   const cands=[];for(let i=1;i<L.length;i++){const a=L[i-1],z=L[i];let sc=0;if(/[：:；;，,、]/.test(a))sc=3;else if(/\s/.test(a)||/\s/.test(z))sc=2.5;else if(/[（(]/.test(z))sc=2.8;else if(/[)）]/.test(a))sc=2.2;else if(/[\u3400-\u9fff]/.test(a)!==/[\u3400-\u9fff]/.test(z)&&!/[\-./%]/.test(a+z))sc=1.6;else if(/[\u3400-\u9fff]/.test(a)&&/[\u3400-\u9fff]/.test(z))sc=.5;if(sc)cands.push({i,sc});}
   let best=null;for(const {i,sc} of cands){const p1=L.slice(0,i).join(''),p2=L.slice(i).join('');if(vis(p1)<2||vis(p2)<(sc>=2.2?2:3)&&vis(t)>4)continue;const w1=mw(p1,size,b),w2=mw(p2,size,b);
    const fit=Math.max(w1,w2)<=av?0:1;const score=fit*100-sc*2+Math.abs(w1-w2)/Math.max(.1,av)*1.5+(w2>av?Math.ceil(w2/av):0);if(!best||score<best.s)best={s:score,p1,p2};}
   if(!best)return t;const rest=mw(best.p2,size,b)>av?semBreak(best.p2,size,b,av,dp+1):best.p2;return best.p1+'\n'+rest;};
  // 表頭兩行最小寬：優先用語意最好的斷點（：、空白、（），不是最平均的斷點
  const sem2=(t,size,b)=>{t=String(t);const full=mw(t,size,b);const L=fixedWidth?tableGraphemes(t):[...t];const vis=s=>s.replace(/\s/g,'').length;let best=null;
   for(let i=1;i<L.length;i++){const a=L[i-1],z=L[i];let sc=0;if(/[：:；;，,、]/.test(a))sc=3;else if(/[（(]/.test(z))sc=2.8;else if(/\s/.test(a)||/\s/.test(z))sc=2.5;else if(/[)）]/.test(a))sc=2.2;else if(/[\u3400-\u9fff]/.test(a)!==/[\u3400-\u9fff]/.test(z)&&!/[\-./%]/.test(a+z))sc=1.6;else if(/[\u3400-\u9fff]/.test(a)&&/[\u3400-\u9fff]/.test(z))sc=.5;if(!sc)continue;
    const p1=L.slice(0,i).join('').replace(/\s+$/,''),p2=L.slice(i).join('').replace(/^\s+/,'');if(vis(p1)<2||vis(p2)<(sc>=2.2?2:3)&&vis(t)>4)continue;const w=Math.max(mw(p1,size,b),mw(p2,size,b));if(w>full*.85)continue;const s=-sc+w/full*1.2;if(!best||s<best.s)best={s,w};}
   return best?best.w+.005:full;};
  let colW=Array.from({length:nC},(_,c)=>{const body=Math.max(0,...rows.map((r,ri)=>ri<h0||AU.section[ri]&&c===0?0:Math.max(...String(r[c]).split('\n').map(l=>mw(l,fs,bold.has(ri)||keySet.has(ri)||rangeBoldAt(ri,c))))+(AU.statC[c]&&ri>=h0&&statusOf(r[c])?.14*k:0)));
   // 表頭可以換行（最多約 3 行）：長中文表頭不把數字欄撐寬
   const hw=h0?measureW(rows[0][c],hfs,1):0;const m=Math.max(body,/[\u3400-\u9fff]/.test(rows[0][c]||'')?Math.min(hw,Math.max(body,hw/3,.7*k)):hw);
   return m+Math.max(18*k,padOf(c))/72+.06*k;});
  const numIdx=colW.map((_,c)=>c).filter(c=>c>0&&AU.numC[c]);
  if(numIdx.length>=2){const m=Math.max(...numIdx.map(c=>colW[c]));numIdx.forEach(c=>colW[c]=m);}
  let X=.6;const GC=1;/* 版面幾何一律預留卡片外框，換外觀時表格大小與位置不變 */const maxW=fixedWidth?fixedTarget:W-2*X-(GC?.36*k:0);
  const wMode=['fill','compact'].includes(st.tbWidth)?st.tbWidth:'auto';
  const sum0=colW.reduce((a,b)=>a+b,0);
  // 自動：內容寬＋依欄數給一個舒服的最小寬（2 欄 4.5"、≤4 欄 6"、≤6 欄 7.5"、更多 10"），多出來的給第一欄（最多 36%；填滿 45%），再給文字欄；數字欄維持內容寬、靠在一起
  let target=wMode==='fill'?maxW:wMode==='compact'?Math.min(maxW,sum0):Math.min(maxW,Math.max(sum0,(nC<=2?4:nC<=4?5:nC<=6?6.5:9)*k));
  if(boost>1&&wMode==='auto')target=Math.min(maxW,Math.max(target,.6*maxW));   // 小表放大時至少佔內容寬 60%
  const colFit=colW.slice();
  const cap=(wMode==='fill'?.45:.36)*target;
  const uw=Array.isArray(T.cw)&&T.cw.length===nC&&T.cw.every(v=>Number.isFinite(+v)&&(sizing.version===2?+v>0&&+v<=224:+v>.2&&+v<12))?T.cw.map(v=>+v*k):null;
  // 最小欄寬＝欄內最長「不可斷」字串（英數連續字；中文可逐字斷）＋邊距
  const colMin=Array.from({length:nC},(_,c)=>{let m=!fixedWidth&&h0&&rows[0][c]?sem2(rows[0][c],hfs,1):0;rows.forEach((r,ri)=>{const b=layoutBold(ri,c,r[c]),text=String(r[c]||'');
   if(fixedWidth){const atoms=ri>=h0&&AU.numC[c]||tParts(text)?text.split('\n'):tableGraphemes(text).filter(ch=>ch!=='\n');atoms.forEach(tok=>m=Math.max(m,mw(tok,ri<h0?hfs:fs,b)));}
   else text.split(/[\s\n]+|(?=[\u3400-\u9fff\uff00-\uffef])|(?<=[\u3400-\u9fff\uff00-\uffef])/).forEach(tok=>{if(tok)m=Math.max(m,tw(tok,ri<h0?hfs:fs)*(b?1.08:1));});});const marker=fixedWidth&&AU.statC[c]&&src.some((r,ri)=>ri>=h0&&statusOf(r[c]))?.14*k:0;return Math.max(fixedWidth?.45*k:0,m+marker+padOf(c)/72+.06*k);});
  if(uw){colW=uw.map((v,c)=>Math.max(v,colMin[c]));target=Math.min(maxW,colW.reduce((a,b)=>a+b,0));}
  else{
   if(nC>1&&colW.some(w=>w>cap))colW=colW.map(w=>Math.min(w,Math.max(cap,1.2*k)));
   let ex=target-colW.reduce((a,b)=>a+b,0);
   if(ex>.001){if(nC===1)colW[0]+=ex;else{const g0=Math.min(ex,Math.max(0,(wMode==='auto'?Math.min(cap,colW[0]+.9*k):cap)-colW[0]));colW[0]+=g0;ex-=g0;
    if(wMode==='auto'&&!(boost>1))ex=0;   // 自動：文字欄＝max(內容, 表頭)＋邊距，多出的只給第一欄（stub），不再撐寬其他欄
    const txtC=colW.map((_,c)=>c).filter(c=>c>0&&!AU.numC[c]);const grp=wMode==='fill'||boost>1||!txtC.length?colW.map((_,c)=>c).filter(c=>c>0):txtC;
    if(ex>.001&&grp.length){const each=ex/grp.length;grp.forEach(c=>colW[c]+=each);}}}}
  colW=colW.map((w,c)=>Math.max(w,colMin[c]));   // 每欄至少＝最長不可斷字／表頭語意兩行寬
  // 太寬：先讓文字欄換行（每欄至少 1.3"），數字欄不動；還是放不下才縮字
  {let sum=colW.reduce((a,b)=>a+b,0);if(sum>maxW+.001&&!uw){const tc=colW.map((_,c)=>c).filter(c=>!AU.numC[c]);const mn=1.3*k;
   for(let it=0;it<4;it++){sum=colW.reduce((a,b)=>a+b,0);if(sum<=maxW+.001)break;const M=c=>Math.max(mn,colMin[c]);const flex=tc.filter(c=>colW[c]>M(c)+.001);if(!flex.length)break;const fsum=flex.reduce((a,c)=>a+colW[c]-M(c),0);const need=sum-maxW;const f=Math.max(0,1-need/fsum);flex.forEach(c=>colW[c]=M(c)+(colW[c]-M(c))*f);}}}
  const lines=t=>String(t).split('\n').length;
  const wrapN=(t,size,b,cw,c)=>String(t).split('\n').reduce((a,l)=>a+Math.max(1,Math.ceil(mw(l,size,b)/Math.max(.01,cw-padOf(c)/72-.03)-.02)),0);
  const cellN=(r,ri)=>Math.max(...r.map((t,c)=>wrapN(t,ri<h0?hfs:fs,layoutBold(ri,c,t)||AU.section[ri]||T.hcol&&c===0,colW[c]-(AU.statC[c]&&ri>=h0&&statusOf(sizing.version===2?src[ri][c]:t)?.14*k:0),c)));
  let mpad=2.5/72;const minH=(n,size)=>n*size*1.45/72+mpad;   // 1.45＝CJK 字型行高（Noto／正黑），上下邊距各 1pt
  // 有空間就不要換行（例：已完成 60%）：文字欄若會折行而且還有剩餘寬度，加寬到一行放得下
  if(!uw&&wMode!=='compact'){let spare=maxW-colW.reduce((a,b)=>a+b,0);colW.forEach((w,c)=>{if(AU.numC[c])return;let need=0;rows.forEach((r,ri)=>{if(ri<h0)return;const b=bold.has(ri)||keySet.has(ri)||rangeBoldAt(ri,c);const tr=st.tbTight?0:(String(r[c]).match(/[\u3400-\u9fff][A-Za-z0-9]|[A-Za-z0-9][\u3400-\u9fff]/g)||[]).length;const mx=/[\u3400-\u9fff]/.test(r[c])&&/[A-Za-z0-9]/.test(r[c])?1.12:1;need=Math.max(need,measureW(r[c],fs,b)*(b?1.08:1)*mx+tr*fs*.3/72+padOf(c)/72+.05);/* 中英交界留自動間距 */});
    if(need>w&&need-w<=spare+1e-6){spare-=need-w;colW[c]=need;}});}
  // 表頭也一樣：有空間就加寬到一行
  if(!uw&&wMode!=='compact'&&h0){let spare=maxW-colW.reduce((a,b)=>a+b,0);colW.forEach((w,c)=>{const t0=rows[0][c];const full=mw(t0,hfs,1);const need=full+padOf(c)/72+.05;if(need>w&&need-w<=spare+1e-6){spare-=need-w;colW[c]=need;return;}
    if(need>w){let av=Math.max(full/2,w-padOf(c)/72-.03);for(let i=0;i<40&&av<full;i++,av+=.04){const s=semBreak(t0,hfs,1,av);const ls=s.split('\n');if(ls.length<=2&&ls.every(l=>mw(l,hfs,1)<=av)&&!ls.some(l=>l.replace(/\s/g,'').length<=2))break;}
     const n2=av+padOf(c)/72+.03;if(n2>w&&n2-w<=spare+1e-6){spare-=n2-w;colW[c]=n2;}}});
   if(numIdx.length>=2){const m=Math.max(...numIdx.map(c=>colW[c]));const add=numIdx.reduce((a,c)=>a+m-colW[c],0);if(add<=spare+1e-6)numIdx.forEach(c=>colW[c]=m);}}
  // 放不下才斷行：在語意點加明確換行（預覽與 pptx 一致）
  if(T.hcol&&nC>1)colW[0]*=1.08;   // 第一欄為表頭：粗體需要多一點寬度
  // Fixed percentages are constraints, not zoom or a preferred width. Existing
  // dragged widths become relative weights; their sum cannot defeat the constraint.
  let fixedWidthOverflow=false;
  if(fixedWidth){const minSum=colMin.reduce((a,b)=>a+b,0);fixedWidthOverflow=minSum>fixedTarget+1e-7;
   if(fixedWidthOverflow)colW=colMin.slice();
   else colW=tableFitColumns(uw||colW,colMin,fixedTarget);}
  // Guarantee every explicit line fits the measured width, even when the semantic
  // splitter reaches its recursion guard. Keep the final fragment readable.
  const fitLines=(text,size,b,av)=>String(text).split('\n').flatMap(line=>{const out=[];let part='';for(const ch of (fixedWidth?tableGraphemes(line):[...line])){if(part&&mw(part+ch,size,b)>av){out.push(part);part='';}part+=ch;}out.push(part);
   if(out.length>1&&out[out.length-1].replace(/\s/g,'').length<3){const last=out.pop(),prev=out.pop(),chars=fixedWidth?tableGraphemes(prev):[...prev];let cut=chars.length;while(cut>1&&[...chars.slice(cut).join('')+last].filter(c=>!/\s/.test(c)).length<3)cut--;const rest=chars.slice(cut).join('')+last;if(mw(rest,size,b)<=av)out.push(chars.slice(0,cut).join(''),rest);else out.push(prev,last);}return out;}).join('\n');
  const rowsO=rows.map(r=>r.slice());
  const brk=()=>rows.forEach((r,ri)=>r.forEach((_,c)=>{const t=rowsO[ri][c];if(AU.numC[c]&&ri>=h0)return;const sz0=ri<h0?hfs:fs,b=layoutBold(ri,c,t);const av=colW[c]-padOf(c)/72-.03-(AU.statC[c]&&ri>=h0&&statusOf(t)?.14*k:0);let safeAv=ri>=h0&&mw(t,sz0,b)>av*.92&&String(t).length>10?av*.92:av;if(fixedWidth)for(const ch of tableGraphemes(t))if(ch!=='\n')safeAv=Math.max(safeAv,mw(ch,sz0,b));r[c]=tParts(t)||!fixedWidth&&/^[A-Za-z0-9_.-]+$/.test(String(t))?String(t):fitLines(semBreak(t,sz0,b,safeAv),sz0,b,safeAv);}));   // 長字串接近欄寬時預留 8%（PowerPoint／LibreOffice 實際字寬較寬）
  const calcH=(g=1)=>{brk();return rows.map((r,ri)=>{const base=(ri<h0?hh:AU.section[ri]?rh*.95:rh)*g;return Math.max(base,minH(cellN(r,ri),ri<h0?hfs:fs));});};
  // Freeze full-source widths, wrapped display strings and typography before sizing the canvas.
  // Never shrink type or row padding merely because the document has many rows.
  const optimalH=calcH(),minimumH=rows.map((r,ri)=>minH(cellN(r,ri),ri<h0?hfs:fs));
  const rowHAll=sizing.version!==2||sizing.heightMode==='optimal'?optimalH:optimalH.map((h,r)=>sizing.heightMode==='larger'?h*1.25:sizing.heightMode==='smaller'?Math.max(minimumH[r],h*.85):minimumH[r]),tW=colW.reduce((a,b)=>a+b,0),frame=GC?.18*k:0;
  const wrapMeta=(value,size,b,width)=>String(value||'').split('\n').map(line=>{let out='',part='';for(const ch of (fixedWidth?tableGraphemes(line):[...line])){if(part&&mw(part+ch,size,b)>width){out+=part+'\n';part='';}part+=ch;}return out+part;}).join('\n');
  const metaH=(text,size,min=0)=>Math.max(min,Math.max(1,String(text).split('\n').length)*size*1.45/72+.05);
  let tfsT=sz(24);const titleRaw=String(T.title||''),metaW=Math.min(maxW,Math.max(tW,6.5));
  if(titleRaw&&mw(titleRaw,tfsT,1)>metaW)tfsT=Math.min(tfsT,20);
  const titleWidth=titleRaw&&mw(titleRaw,tfsT,1)>metaW?maxW:metaW;
  const ttl=fitLines(semBreak(titleRaw,tfsT,1,titleWidth),tfsT,1,titleWidth),titH=metaH(ttl,tfsT,.5*k);
  const unitText=wrapMeta(T.unit,ufs,0,metaW),unitH=T.unit?metaH(unitText,ufs,.27*k):.04;
  // Table-only footer legend is intentionally omitted. Legacy legend labels stay
  // compatible in stored data, but do not reserve space or alter cell formatting.
  const noteW=tW;
  const noteText=wrapMeta(T.note,nfs,0,noteW),noteH=T.note?metaH(noteText,nfs):0;
  const afterH=noteH,noteGap=afterH?.11*k:0;
  const TOP=.4,GAP=.30,ty0=TOP+titH+unitH+(T.unit?.02:0)+GAP;
  const bottom=.4,footerH=.26,footerGap=.12,headerH=h0?rowHAll[0]:0;
  let blockedRow=null,blockedReasonCode='',exportReason='';
  // One source table is one canvas. Physical PowerPoint limits never truncate the web model.
  const totalH=rowHAll.reduce((n,h)=>n+h,0);
  const canvasW=fixedWidth&&!fixedWidthOverflow?W:Math.max(W,tW+2*(.6+frame),titleWidth+1.2);
  const canvasH=Math.max(H,ty0+totalH+frame+noteGap+afterH+bottom);
  if(canvasW>56||canvasH>56){blockedReasonCode='slide-size';exportReason=`完整表格需要 ${canvasW.toFixed(2)} × ${canvasH.toFixed(2)} 吋，超過 PowerPoint 單張投影片最大 56 × 56 吋。網頁仍完整呈現原始表格；不分頁、不刪列、不縮小文字，已停用 PPTX 匯出。`;}
  else if(fixedWidthOverflow){blockedReasonCode='table-width';exportReason=`${sizing.widthMode}% 寬度無法容納目前的欄數或不可拆開的數字。預覽保留完整內容，尚未套用指定寬度；請改用 ${sizing.widthMode==='45'?'90% 或自動':'自動'}，或減少欄數。未縮字、未截斷，已停用 PPTX 匯出。`;}
  const planned={pages:[source.sourceRows.slice()],capacity:canvasH-bottom-ty0-frame-noteGap-afterH};
  const pageCount=1,hasFooter=false;
  const off=st.tbV==='top'?0:Math.max(0,(planned.capacity-totalH)*.38);
  if(fixedWidth&&!fixedWidthOverflow)X=st.tbH==='left'?Math.min(.6+frame,(canvasW-tW)/2):(canvasW-tW)/2;
  else if(st.tbH!=='left')X=Math.max(.6+frame,(canvasW-Math.max(tW,titleRaw?titleWidth:0))/2);
  const tx=X,ty=ty0+off,Y0=TOP+off;
  cur.w=canvasW;cur.h=canvasH;
  const documentId='table-doc-0';
  const bw=b=>b?{c:b.c,w:b.w<.5?.5:Math.max(.25,Math.round(b.w*k*4)/4)}:null;
  // 對比：文字對底色至少 4.5:1，不夠就加深
  const cc=(fg,bg)=>ensureContrast(fg,bg||'FFFFFF',4.5);
  const firstKey=ri=>keySet.has(ri)&&!keySet.has(ri-1);
  const cells=rows.map((r,ri)=>r.map((t,c)=>{const align=colAl[c];const isN=isNumFont(ri,c);const font=isN?NF:TF;t=isN?t:tidy(t);const mL=padH;
   if(ri<h0){const o={t,bold:1,size:hfs,align,font:TF,color:LK.hdr.color,fill:LK.hdr.fill||null,bT:bw(LK.hdr.bT),bB:bw(LK.hdr.bB),mL,mR:padH};
    baseGrid(o,ri);const hc=hiCol(ri,c)||hiCell(ri,c);
    if(hc){if(LK.hdr.fill){o.bB={c:contrastOf(hc.C,LK.hdr.fill)>=3?hc.C:ensureContrast(mix(hc.C,'FFFFFF',.85),LK.hdr.fill,3),w:3};/* 主色表頭：重點欄只加 3pt 強調色底線 */}else{if(hiStyle==='fill')o.fill=mix(hc.C,'FFFFFF',.9);o.color=ensureContrast(mix(hc.C,'000000',.18),o.fill||'FFFFFF',5);}}
    o.color=cc(o.color,o.fill);return rangePaint(o,ri,c);}
   const last=ri===rows.length-1,key=keySet.has(ri)||bold.has(ri),sec=AU.section[ri];
   const o={t,size:fs,align,font,bold:key||sec,color:sec?PD:G.ink,fill:null,bB:bw(last?(LK.last||LK.row):LK.row),mL,mR:padH};
   if(LK.zebra&&(ri-h0)%2===1)o.fill=LK.zebra;
   if(key&&LK.keyFill)o.fill=LK.keyFill;
   if(firstKey(ri)&&LK.key&&ri>h0)o.bT=bw(LK.key);
   if(sec&&LK.row&&ri>h0)o.bT=bw(LK.row);
   baseGrid(o,ri);
   const s=st.tbStatus===false||!AU.statC[c]?null:statusOf(sizing.version===2?src[ri][c]:t);
   if(s){o.color=ST[s];o.bold=true;if(/[A-Za-z\u4e00-\u9fff]/.test(t))o.dot=ST[s];}
   if(isN&&st.tbNeg&&tNumVal(src[ri][c])<0&&!/^[\s(（]*[▲△]/.test(src[ri][c]))o.color=BAD;
   {const am=/^[\s(（]*([▲△▼▽])/.exec(String(src[ri][c]||''));if(am){const up=/[▲△]/.test(am[1]);o.color=st.tbArrow==='sem'?(up?GOOD:BAD):st.tbArrow==='ink'?G.ink:(up?P:G.t2);o.bold=true;}}
   let hx=hiCell(ri,c),hr=hiRow(ri,c),hcol=hiCol(ri,c);const wn=[hx,hr,hcol].find(z=>z&&z.kind==='warn');if(wn){hx=wn===hx?hx:null;hcol=wn===hcol?hcol:null;hr=wn===hr?hr:null;}const h=hx||hcol||hr;/* 警告優先、不疊色 */
   const R=ruleOf(ri,c);
   if(h){
    if(hiStyle==='fill'){if(!R||R.style!=='fill')o.fill=mix(h.C,'FFFFFF',h.kind==='warn'?(hx?.88:.94):hx?.84:(LK.tint||.9));
     if(hx){o.bold=true;if(!s)o.color=mix(h.C,'000000',.18);}else if(hr&&c===0)o.bold=true;}   // 粗體只給標籤（stub）與關鍵值
    else if(hiStyle==='bold'){if((hx||hcol)&&!s)o.color=mix(h.C,'000000',.18);if(hx||hr)o.bold=true;if(hr)o.fill=mix(hr.C,'FFFFFF',.9);}
    else{o.bold=hx||(hr&&c===0)?true:o.bold;}}
   if(R){ruleHits++;const C=TONE[R.tone];o.bold=true;
    if(R.style==='fill'){o.fill=mix(C,'FFFFFF',.86);o.color=mix(C,'000000',.25);}
    else if(R.style==='text'){o.color=C;if(LK.dense)o.t=(/[<]/.test(R.op)?'▼ ':'▲ ')+o.t;}
    else ruleBoxes.push({r:ri,c,color:C});}
   o.color=cc(o.color,o.fill);
   return rangePaint(o,ri,c);}));
  const firstSlide=cur;
  planned.pages.forEach((sourceRows,pageIndex)=>{
   if(pageIndex){cur={key:'table',title:'表格',no:slides.length+1,items:[],groups:[]};slides.push(cur);}else cur=firstSlide;
   const rowH=sourceRows.map(r=>rowHAll[r]),tH=rowH.reduce((a,b)=>a+b,0),bodySourceRows=sourceRows.slice(h0);
   const pageCells=sourceRows.map(raw=>cells[raw].map(c=>Object.assign({},c)));
   // A page closing border is visual punctuation, never a subtotal or lastTotal.
   if(!explicitGrid&&pageCells.length>h0&&LK.last)pageCells[pageCells.length-1].forEach((c,ci)=>{if(!rangeAt(sourceRows[sourceRows.length-1],ci))c.bB=bw(LK.last);});
   const slots={title:{x:X,y:Y0,w:titleWidth,h:titH,size:tfsT,font:(st.tbFont==='jh'||st.tbFont==='noto')?'Microsoft JhengHei':st.tFont,color:G.ink,bold:1},
    unit:{x:X,y:Y0+titH+.02,w:metaW,h:Math.max(unitH,.27*k),size:ufs,color:G.t2}};
   if(T.title)txt(X,Y0,titleWidth,titH,ttl,{size:tfsT,bold:1,color:st.tbTitleInk?G.ink:P,font:slots.title.font,name:'表格標題',valign:'bottom'});
   if(T.unit)txt(X,slots.unit.y,metaW,unitH,unitText,{size:ufs,color:G.t2,name:'單位',valign:'top',wrap:1});
   if(LK.card){const o=grey?{fill:G.fill,r:.14*k,name:'灰色底板'}:{fill:'FFFFFF',line:G.line,lw:.75*k,r:.14*k,sh:'card',force:1,name:'卡片'};box(X-frame,ty-frame,tW+2*frame,tH+2*frame,o);}
   const tb=table(tx,ty,colW.slice(),rowH,pageCells,{mL:padH,mT:1,name:'表格'});
   tb.cells.forEach((r,ri)=>r.forEach((c,ci)=>{const o=pageCells[ri][ci];c.mL=o.mL;c.mR=o.mR;
    if(o.dot&&c.runs.length)c.runs.unshift({t:'●\u2002',o:Object.assign({},c.runs[0].o,{size:sz(7),color:o.dot,bold:false,br:false})});}));
   const noteY=ty+tH+frame+noteGap;
   slots.note={x:X,y:noteY,w:noteW,h:Math.max(noteH,.26*k),size:nfs,color:G.mute};
   if(T.note)txt(X,noteY,noteW,noteH,noteText,{size:nfs,color:G.mute,valign:'top',wrap:1,lsp:1,name:'註腳'});
   const bodyStart=bodySourceRows.length?bodySourceRows[0]:h0,bodyEnd=bodySourceRows.length?bodySourceRows[bodySourceRows.length-1]:h0-1;
   if(hasFooter){const label=`第 ${pageIndex+1}／${pageCount} 頁 · 資料列 ${bodyStart-h0+1}–${bodyEnd-h0+1}／${source.bodyRows}`;
    const footerW=Math.min(W-1.2,Math.max(tW,mw(label,10,0)+.12)),footerX=Math.max(.6,X+tW-footerW);
    slots.footer={x:footerX,y:H-bottom-footerH,w:footerW,h:footerH,size:10,color:G.mute};txt(footerX,slots.footer.y,footerW,footerH,label,{size:10,color:G.mute,align:'right',valign:'top',name:'表格頁碼'});}
   const cx0=c=>tx+colW.slice(0,c).reduce((a,b)=>a+b,0),ry0=r=>ty+rowH.slice(0,r).reduce((a,b)=>a+b,0),boxes=[];
   const ins=(st.tbPad==='none'?-3:3)*k/72,rad=4*k/72,blw=1.5*k;
   // Visual H/L never changes semantic marks. Mask legacy box paint only while
   // a visible manual range covers it; clearing that range reveals the semantics.
   const visualRegions=his.filter(h=>h.type==='range'&&tableHighlightFamily(h)==='fill').flatMap(h=>tableMarkRegions(h,rows.length,nC));
   const localMarks=his.filter(h=>h.type!=='range').map(h=>visualRegions.length?Object.assign({},h,{excludes:[...(h.excludes||[]),...visualRegions]}):h).map(h=>{if(h.type==='col')return h;const local=sourceRows.indexOf(h.type==='row'?h.i:h.r);return local<0?null:Object.assign({},h,h.type==='row'?{i:local}:{r:local});}).filter(Boolean);
   if(hiStyle==='box')localMarks.forEach(h=>{
    if(h.excludes&&h.excludes.length){tableMarkRegions(h,sourceRows.length,nC).forEach(q=>{const bx=cx0(q.c0),by=ry0(q.r0),bw0=colW.slice(q.c0,q.c1+1).reduce((a,b)=>a+b,0),bh=rowH.slice(q.r0,q.r1+1).reduce((a,b)=>a+b,0);
      const segIns=Math.max(blw/144,ins);box(bx+segIns,by+segIns,bw0-2*segIns,bh-2*segIns,{line:h.C,lw:blw,r:rad,name:h.kind==='warn'?'警告框':h.kind==='rec'?'推薦框':'重點框'});boxes.push(Object.assign({type:'range',color:h.C,kind:h.kind},q));});return;}
    if(h.type==='col'){const y0=legacyLK.hdr.fill&&h0?ty+rowH[0]:ty;box(cx0(h.i)+ins,y0+ins,colW[h.i]-2*ins,ty+tH-y0-2*ins,{line:h.C,lw:blw,r:rad,name:h.kind==='warn'?'警告框':h.kind==='rec'?'推薦框':'重點框'});}
    else if(h.type==='row')box(tx+ins,ry0(h.i)+ins,tW-2*ins,rowH[h.i]-2*ins,{line:h.C,lw:blw,r:rad,name:h.kind==='warn'?'警告框':h.kind==='rec'?'推薦框':'重點框'});
    else box(cx0(h.c)+ins,ry0(h.r)+ins,colW[h.c]-2*ins,rowH[h.r]-2*ins,{line:h.C,lw:blw,r:rad,name:h.kind==='warn'?'警告框':h.kind==='rec'?'推薦框':'重點框'});
    boxes.push(Object.assign({color:h.C,kind:h.kind},h.type==='cell'?{type:'cell',r:h.r,c:h.c}:{type:h.type,i:h.i}));});
   ruleBoxes.forEach(b=>{const r=sourceRows.indexOf(b.r);if(r<0)return;box(cx0(b.c)+ins,ry0(r)+ins,colW[b.c]-2*ins,rowH[r]-2*ins,{line:b.color,lw:blw,r:rad,name:'條件框'});boxes.push({type:'cell',r,c:b.c,color:b.color,rule:1});});
   const b0=boxes.find(b=>!b.rule&&b.type!=='cell'),orphans=[];
   sourceRows.forEach(ri=>rows[ri].forEach((t,c)=>{const str=String(t);if(!str.trim())return;const sz0=ri<h0?hfs:fs,b=ri<h0||bold.has(ri)||keySet.has(ri)||rangeBoldAt(ri,c),av=colW[c]-padOf(c)/72-.03-(AU.statC[c]&&ri>=h0&&statusOf(t)?.14*k:0),ls=str.split('\n'),vis=x=>x.replace(/\s/g,'').length;
    if(ls.some(l=>mw(l,sz0,b)>av+.01))orphans.push({r:ri,c,t:str,why:'auto-wrap'});else if(ls.length>1&&vis(str)>4&&ls.some((l,i)=>vis(l)<=1||vis(l)<=2&&i>0&&!/[：:；;，,、)）\s]$/.test(ls[i-1])&&!/^[（(]/.test(l)))orphans.push({r:ri,c,t:str,why:'orphan'});}));
   if(T.hcol){const tint=legacyLK.hdr&&legacyLK.hdr.fill?mix(P,'FFFFFF',.88):mix(G.fill||'F2F2F2','FFFFFF',.2);tb.cells.forEach((r,ri)=>{const raw=sourceRows[ri];if(raw<h0||AU.section[raw])return;const cl=r[0];if(!cl)return;cl.bold=true;(cl.runs||[]).forEach(x=>{x.o=Object.assign({},x.o,{bold:true});});if(!cl.fill&&!rangeAt(raw,0))cl.fill=tint;});}
   // The new deep theme fill has a light top rule on each visible region/page.
   // Keep it in native cell borders, below explicit line-family overrides; old
   // preset IDs never acquire this decoration or any new fill resolution.
   tb.cells.forEach((row,ri)=>row.forEach((cell,c)=>{const r=sourceRows[ri],mark=rangeAt(r,c);if(!mark)return;
    const preset=tableHighlightPreset(mark.presetId,st);if(!preset.accent)return;
    const above=ri?sourceRows[ri-1]:null;if(above===r-1&&rangeAt(above,c)===mark)return;
    cell.bT={c:preset.accent,w:preset.accentWidth};cell.highlightEdges=['bT'];cell.highlightOrder={bT:-.5};
   }));
   // Apply line-only families after every semantic/header/first-column fill has
   // resolved. All render/export paths consume these same native cell borders.
   const edgeOffsets=[['bT',-1,0],['bR',0,1],['bB',1,0],['bL',0,-1]];
   for(const [order,mark] of his.entries()){const family=tableHighlightFamily(mark);if(mark.type!=='range'||family==='fill')continue;const preset=tableHighlightPreset(mark.presetId,st,family);
    tb.cells.forEach((row,ri)=>row.forEach((cell,c)=>{const r=sourceRows[ri];for(const [edge,dr,dc]of edgeOffsets){if(!tableRangeEdge(mark,r,c,edge))continue;
     const neighbor=tb.cells[ri+dr]&&tb.cells[ri+dr][c+dc];cell[edge]={c:tableHighlightStroke(preset.stroke,[cell.fill,neighbor&&neighbor.fill]),w:tableHighlightBorderWidth(mark)};if(!cell.highlightEdges)cell.highlightEdges=[];if(!cell.highlightEdges.includes(edge))cell.highlightEdges.push(edge);if(!cell.highlightOrder)cell.highlightOrder={};cell.highlightOrder[edge]=order;
    }}));
   }
   const layoutOverflow=!!exportReason||cur.items.some(it=>it.t!=='ln'&&(it.x<-.01||it.y<-.01||it.x+it.w>canvasW+.01||it.y+it.h>canvasH+.01));
   const complete=!layoutOverflow,reason=exportReason||(layoutOverflow?'表格或標題／註腳超出投影片邊界，已停用匯出。請縮短內容或調整欄寬；原始資料仍可下載完整 TSV。':'');
   if(layoutOverflow)warn('表格無法完整匯出',reason);
   const displayRows=tb.cells.map(row=>row.map(c=>c.runs.map(r=>r.t+(r.o&&r.o.br?'\n':'')).join('')));
   const integrity={documentId,pageIndex,pageCount,h0,nC,sourceValues:source.rows.map(row=>row.slice()),displayRows,bodyStart,bodyEnd,sourceRows:sourceRows.slice(),bodySourceRows:bodySourceRows.slice(),rawRowCount:source.nR,rawBodyRows:source.bodyRows,renderedRowCount:sourceRows.length,renderedBodyRows:bodySourceRows.length,exportComplete:complete,exportReason:reason,layoutOverflow,blockedRow,blockedReasonCode};
   if(sizing.version===2)integrity.sizing={version:2,widthMode:sizing.widthMode,heightMode:sizing.heightMode,referenceWidth:fixedWidth?W:canvasW,targetWidth:fixedTarget,actualWidth:tW,widthApplied:!fixedWidthOverflow,font:{bodyPt:fs,headerPt:hfs,scale:k,autoBoost:boost},minimumRowH:minimumH.slice(),optimalRowH:optimalH.slice(),atMinimum:rowHAll.every((h,r)=>Math.abs(h-minimumH[r])<1e-7)};
   tb.dataIntegrity=Object.assign({},integrity);
   cur.table=Object.assign({},integrity,{rawRows:source.rows,previewBodyRows:bodySourceRows.length,types:Object.assign({},T.types),formats:Object.assign({},T.formats),hcol:!!T.hcol,pad:st.tbPad||'m',orphans,colMin:colMin.map(v=>+v.toFixed(3)),REC,k,colFit:colFit.map(v=>+v.toFixed(3)),tx,ty,tW,tH,colW:colW.slice(),rowH,h0,nC,nR:sourceRows.length,look:lookId,appearance,grey,hiMode:hiStyle,hiStyle,EC,colNum:AU.numC,colStat:AU.statC,key:[...keySet].sort((a,b)=>a-b),hi:b0||null,boxes,his:his.map(h=>Object.assign({},h)),rules:MK.rules,ruleHits,
    ruleCols:[...new Set(MK.rules.map(r=>r.c))],unit:T.unit||'',note:T.note||'',title:T.title||'',font:TF,nf:NF,slots,fs,hfs,k});
  });cur=firstSlide;}

 /* v13：每頁 ≤6 個變體——超過的頁拆成子頁（同一 SL 函式畫完後，依分組挑選元件並重新排版） */
 function splitSlide(sl,parts,p){const gs=sl.groups,its=sl.items;const owner=new Array(its.length).fill(-1);gs.forEach((g,gi)=>{for(let k=g.from;k<=g.to;k++)owner[k]=gi;});
  const bb=it=>it.t==='ln'?{x:Math.min(it.x1,it.x2),y:Math.min(it.y1,it.y2),w:Math.abs(it.x2-it.x1),h:Math.abs(it.y2-it.y1)}:{x:it.x,y:it.y,w:it.w||0,h:it.h||0};
  const f0=gs.length?gs[0].from:its.length;const chrome=[];
  its.forEach((it,k)=>{if(owner[k]>=0)return;const b=bb(it);{const ct=(it.runs||[]).map(r=>r.t).join('');if(/^[A-Z]｜/.test(ct)){const nm=ct.slice(2);const gi=gs.findIndex(g=>g.name&&nm.startsWith(g.name));if(gi>=0){owner[k]=gi;return;}}}if(k>=f0&&(b.w>CW*.85||it.name==='空白')){owner[k]=-2;return;}if(k<f0&&b.y<1.75){chrome.push(k);return;}
   if(/^[A-Z]｜/.test((it.runs||[]).map(r=>r.t).join(''))){let pg=-1;gs.forEach((g,gi)=>{if(g.to<k&&(pg<0||g.to>gs[pg].to))pg=gi;});if(pg>=0){const g=gs[pg],d=b.y-(g.y+g.h);if(d>-.1&&d<.6){owner[k]=pg;return;}}}
   const cx=b.x+b.w/2,cy=b.y+b.h/2;const inG=gs.findIndex(g=>cx>=g.x-.1&&cx<=g.x+g.w+.1&&cy>=g.y-.1&&cy<=g.y+g.h+.1);if(inG>=0){owner[k]=inG;return;}
   const ov=g=>Math.min(b.x+b.w,g.x+g.w)-Math.max(b.x,g.x)>Math.min(b.w,g.w)*.3;
   let bi=-1,bd=.5;gs.forEach((g,gi)=>{const d=b.y-(g.y+g.h);if(d>-.08&&d<bd&&ov(g)){bd=d;bi=gi;}});
   const isCap=/^[A-Z]｜/.test((it.runs||[]).map(r=>r.t).join(''));const isHd=it.name==='標題'||(it.runs||[]).some(r=>r.o&&r.o.bold);if(!isCap&&isHd){let ng=-1;gs.forEach((g,gi)=>{if(g.from>k&&(ng<0||g.from<gs[ng].from))ng=gi;});if(ng>=0){const g=gs[ng],d=g.y-(b.y+b.h);if(d>-.08&&d<1.2&&ov(g)){owner[k]=ng;return;}}}let ai=-1,ad=.55;if(!isCap)gs.forEach((g,gi)=>{const d=g.y-(b.y+b.h);if(d>-.08&&d<ad&&ov(g)){ad=d;ai=gi;}});
   if(bi>=0||ai>=0){owner[k]=(ai>=0&&(bi<0||ad<bd))?ai:bi;return;}
   const tx=(it.runs||[]).map(r=>r.t).join('');const m=/^([A-Z])｜/.exec(tx);if(m&&m[1].charCodeAt(0)-65<gs.length){owner[k]=m[1].charCodeAt(0)-65;return;}
   let best=0;gs.forEach((g,gi)=>{if(g.from<=k)best=gi;});owner[k]=best;});
  /* 分組：parts 的元素可以是數字（一個元件）或陣列（數個小元件併成一格） */
  const spec=parts[p-1].map(e=>(Array.isArray(e)?e:[e]).filter(gi=>gi<gs.length)).filter(a=>a.length);
  const units0=spec.map(gis=>{const ks=its.map((_,k)=>k).filter(k=>gis.includes(owner[k]));let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;ks.forEach(k=>{const b=bb(its[k]);x0=Math.min(x0,b.x);y0=Math.min(y0,b.y);x1=Math.max(x1,b.x+b.w);y1=Math.max(y1,b.y+b.h);});return{gis,ks,x0,y0,w:x1-x0,h:y1-y0};});
  units0.forEach((u,i)=>u.ui=i);const fixed=[];const units=units0.filter(u=>{if(u.y0<1.2||u.y0+u.h>7.5-.45){fixed.push(u);return false;}return true;});
  const AX0=X0,AW=CW,AY0=1.85,AY1=7.5-.62,AH=AY1-AY0,pos=new Map();let done=false;const n=units.length;
  /* 3×2（或 2×2）格線：每格等寬等高，元件在格內水平置中、垂直偏上，整頁填滿 */
  const tryGrid=(cols)=>{const rows=Math.max(n<=3?1:2,Math.ceil(n/cols));const gx=.3,gy=.15;const cw=(AW-gx*(cols-1))/cols,ch=(AH-gy*(rows-1))/rows;if(!units.every(u=>u.w<=cw+.02&&u.h<=ch+.12))return false;
   const h1m=Math.max(...units.slice(0,cols).map(u=>u.h)),up=rows===2?Math.max(0,Math.min(.4,ch-h1m-.5)):0;units.forEach((u,i)=>{const r=Math.floor(i/cols),c=i%cols;const ru=Math.min(cols,n-r*cols);const x=AX0+c*(cw+gx)+(cw-u.w)/2+(cols-ru)*(cw+gx)/2;const y=AY0+r*(ch+gy)-(r===1?up:0)+(rows===1?Math.min(.6,(ch-u.h)*.25):Math.min(.15,(ch-u.h)*.3));pos.set(u.ui,[x-u.x0,y-u.y0]);});return true;};
  for(const c of [n<=3?n:n===4?2:n===9?3:n>6?4:3,3,4,2,1].filter((v,i,a)=>v>=1&&v<=n&&a.indexOf(v)===i))if(tryGrid(c)){done=true;break;}
  if(!done){const ovl=(a,b)=>a.x0<b.x0+b.w-.02&&b.x0<a.x0+a.w-.02&&a.y0<b.y0+b.h-.02&&b.y0<a.y0+a.h-.02;if(!units.some((a,i)=>units.some((b,j)=>j>i&&ovl(a,b)))){const mv2=units.filter(u=>u.y0<6),ty=Math.min(...mv2.map(u=>u.y0));const dy=mv2.length?AY0-ty:0;units.forEach(u=>pos.set(u.ui,[0,u.y0<6?dy:0]));done=true;}}
  if(!done){const us=units.slice().sort((p,q)=>p.y0-q.y0);const rows=[];us.forEach(u=>{const r=rows.find(r=>u.y0<r.y1-.05&&u.y0+u.h>r.y0+.05);if(r){r.us.push(u);r.y0=Math.min(r.y0,u.y0);r.y1=Math.max(r.y1,u.y0+u.h);}else rows.push({us:[u],y0:u.y0,y1:u.y0+u.h});});
   rows.sort((p,q)=>p.y0-q.y0);for(let i=0;i<rows.length;i++){const r=rows[i];r.us.sort((p,q)=>p.x0-q.x0);let w=0,cut=-1;r.us.forEach((u,j)=>{w+=u.w+(j?.3:0);if(w>AW+.02&&cut<0)cut=j;});if(cut>0){const rest=r.us.splice(cut);const mk=us=>({us,y0:Math.min(...us.map(u=>u.y0)),y1:0});rows.splice(i+1,0,mk(rest));[r,rows[i+1]].forEach(q=>{q.y0=Math.min(...q.us.map(u=>u.y0));q.y1=q.y0+Math.max(...q.us.map(u=>u.y0+u.h-q.y0));});
     rows[i+1].us.forEach(u=>u._dy=u.y0-rows[i+1].y0);}}
   rows.forEach(r=>{r.y0=Math.min(...r.us.map(u=>u.y0));r.y1=Math.max(...r.us.map(u=>u.y0+u.h));});const th=rows.reduce((a,r)=>a+r.y1-r.y0,0);const gy=rows.length>1?Math.max(.12,Math.min(.9,(AH-th)/(rows.length-1))):0;if(th+gy*(rows.length-1)>AH+.25)warn('overflow','split '+sl.key);
   let y=AY0+(rows.length>1?0:Math.min(.6,Math.max(0,(AH-th)*.3)));rows.forEach(r=>{const us2=r.us.slice().sort((p,q)=>p.x0-q.x0);const tw=us2.reduce((a,u)=>a+u.w,0);const gx2=us2.length>1?Math.max(.3,Math.min(1.2,(AW-tw)/(us2.length-1))):0;let x=AX0+Math.max(0,(AW-tw-gx2*(us2.length-1))/2);us2.forEach(u=>{pos.set(u.ui,[x-u.x0,y-r.y0]);x+=u.w+gx2;});y+=r.y1-r.y0+gy;});}
  fixed.forEach(u=>pos.set(u.ui,[0,0]));const all=units0.slice().sort((p,q)=>{const a=pos.get(p.ui),b=pos.get(q.ui);const A0=p.y0+a[1],B0=q.y0+b[1],ov=Math.min(A0+p.h,B0+q.h)-Math.max(A0,B0);if(ov>.5*Math.min(p.h,q.h))return (p.x0+a[0])-(q.x0+b[0]);return A0-B0;});const order=chrome.slice();all.forEach(u=>order.push(...u.ks));const remap=new Map(order.map((k,i)=>[k,i]));const uOf=new Map();all.forEach(u=>u.ks.forEach(k=>uOf.set(k,u.ui)));
  const mv=(it,dx,dy)=>{const o=Object.assign({},it);if(o.t==='ln'){o.x1+=dx;o.x2+=dx;o.y1+=dy;o.y2+=dy;}else{o.x+=dx;o.y+=dy;}if(o.cx){const c={};if(o.cx.a&&remap.has(o.cx.a[0]))c.a=[remap.get(o.cx.a[0]),o.cx.a[1]];if(o.cx.b&&remap.has(o.cx.b[0]))c.b=[remap.get(o.cx.b[0]),o.cx.b[1]];if(c.a||c.b)o.cx=c;else delete o.cx;}return o;};
  const ni=order.map(k=>{const d=chrome.includes(k)?[0,0]:pos.get(uOf.get(k));return mv(its[k],d[0],d[1]);});
  /* 每頁變體重新編號 A、B、C…（說明列「X｜」依出現順序） */
  let L=0;ni.forEach((it,i)=>{if(i<chrome.length||!it.runs||!it.runs.length)return;const r0=it.runs[0];if(/^[A-Z]｜/.test(r0.t||'')){it.runs=it.runs.slice();it.runs[0]=Object.assign({},r0,{t:String.fromCharCode(65+L++)+r0.t.slice(1)});}});
  const ng=[];all.forEach(u=>u.gis.forEach(gi=>{const g=Object.assign({},gs[gi]);const d=pos.get(u.ui);const ix=u.ks.filter(k=>k>=g.from&&k<=g.to).map(k=>remap.get(k));g.from=Math.min(...ix);g.to=Math.max(...ix);g.x+=d[0];g.y+=d[1];ng.push(g);}));
  sl.items=ni;sl.groups=ng;
  /* 產生檢查：每個標題（不屬於任何元件的文字）下方 0.7 吋內要有元件（或它是元件下方的說明） */
  ni.forEach((it,k)=>{if(k<chrome.length||!it.runs||it.t==='ln'||ng.some(g=>k>=g.from&&k<=g.to))return;const t=it.runs.map(r=>r.t).join('');if(!t.trim()||/^[A-Z]｜/.test(t)||it.y<1.75||it.y>6.9)return;
   const ok=ng.some(g=>{const d=g.y-(it.y+it.h),u=it.y-(g.y+g.h);return((d>-.15&&d<.7)||(u>-.1&&u<.6))&&Math.min(it.x+it.w,g.x+g.w)-Math.max(it.x,g.x)>Math.min(it.w,g.w)*.3;});if(!ok)warn('heading','標題下方沒有元件：'+t.slice(0,16));});}
 if(opt.compose){sno=0;cur={key:'compose',title:'待選素材',no:1,items:[],groups:[]};slides.push(cur);SL.compose();}
 else SLIDES.forEach(([k,zh],i)=>{if(opt.only&&!opt.only.includes(k))return;if(!opt.only&&opt.examples===false&&/^ex\d/.test(k))return;/* 12–14 範例頁（主題式版面）：studio 預設不含，勾「含範例頁」才加 */sno=i+1;cur={key:k,title:zh,no:i+1,items:[],groups:[],mkC:mix(A,'FFFFFF',.62)};slides.push(cur);const SPx=SPLIT_KEY[k];if(SPx)cur.part=SPx[1];if(!WHITE_PG.has(k)&&!SCHEME_CATALOGUE_KEYS.includes(k))canvas();SL[SPx?SPx[0]:k]();if((SPx||SPLIT_PARTS[k])&&!opt.nosplit)splitSlide(cur,SPLIT_PARTS[SPx?SPx[0]:k],SPx?SPx[1]:1);if(!cur.schemeCatalogue)footer();if(opt.labels)applyLabels(cur,opt.labels);recalc(cur);});
 const k=SIZE_K[st.size]||1;if(k!==1)slides.forEach(sl=>scaleSlide(sl,k));
 return{slides,warns,params:st,W:W*k,H:H*k,k,sem:{warn:AL,good:GOOD,bad:BAD}};}
/* Selected-icon pack: reuse both catalog builders in a fresh model, never the user's labels.
   All ic slots are replaceable glyphs. Native connectors and other geometry stay untouched. */
function iconPackFilename(id){if(!ICONS||typeof id!=='string'||!Object.prototype.hasOwnProperty.call(ICONS.BY,id))throw new Error('請先選擇有效圖示');
 const name=stripCtl(ICONS.BY[id].zh).replace(/[\\/:*?"<>|\s]+/g,'_').replace(/^[. _]+|[. _]+$/g,'').slice(0,60)||'圖示';return name+'-底座與組合元件.pptx';}
function iconPackModel(params,id){iconPackFilename(id);const name=ICONS.BY[id].zh,model=buildModel(params,{only:['iconvariants','iconcomponents'],iconPackName:name});
 model.slides.sort((a,b)=>Number(a.key!=='iconvariants')-Number(b.key!=='iconvariants'));
 model.slides.forEach((sl,page)=>{const patches={};sl.groups.forEach((g,gi)=>{const patch={};sl.items.slice(g.from,g.to+1).forEach((it,ix)=>{if(it.ic)patch[ix]={from:it.ic.id,icon:id};});patches[sl.key+':'+gi]=patch;});applyLabels(sl,patches);
  const bases=sl.key==='iconvariants',foot=sl.items.find(it=>textOf(it)===String(sl.no).padStart(2,'0')+' / '+String(SLIDES.filter(e=>!SCHEME_CATALOGUE_KEYS.includes(e[0])).length).padStart(2,'0'));
  const put=(it,text)=>{if(!it||!it.runs||!it.runs.length)return;it.runs=[{t:text,o:Object.assign({},it.runs[0].o)}];autoShrink(it);};
  sl.title=name+'｜'+(bases?'24 款底座':'9 種組合元件');put(foot,String(page+1).padStart(2,'0')+' / 02');sl.no=page+1;
 });
 model.iconPack={id,name,bases:model.slides[0].groups.length,components:model.slides[1].groups.length,pages:model.slides.length};return model;}
/* ---------- S／M／L 元件尺寸（v5.2）：整頁幾何、字級、線寬、陰影一起等比縮放，投影片也同比例（仍是 16:9）。
   所以每一頁都放得下；把元件複製到標準 13.33×7.5 吋簡報時，實際大小就是 ×0.8／×1／×1.25。 ---------- */
/* ---------- 表格：自動判斷（R1）——表頭、數字欄、狀態欄、小節列、合計列；外觀；數字格式；建議（重點欄、門檻） ---------- */
const TABLE_LOOKS=[['clean','細線'],['band','主色表頭'],['card','卡片'],['bandcard','主色表頭＋卡片'],['zebra','斑馬'],['hair','只有細橫線']];
/* 舊版全域數字格式已移除；新格式只讀 T.types / T.formats，預設不改原始值。 */
function TBL_FIXED(s){return Object.assign({},s,{tbMinus:'auto',tbNeg:false,tbThou:true,tbStatus:true});}
const TABLE_LOOK_ALIAS={minimal:'clean',panel:'card'};
const tableLookOf=p=>{const v=TABLE_LOOK_ALIAS[p.tbLook]||p.tbLook;return TABLE_LOOKS.some(l=>l[0]===v)?v:(p.tbPanel?'card':'clean');};
// Persist independent overrides, not an ever-growing list of combination looks.
// Legacy names survive only as a compatibility profile for unset dimensions.
const TABLE_APPEARANCE_KEYS=['tbCardOn','tbHeaderStyle','tbStripes','tbGrid'];
// New editor tables and format reset use explicit defaults; BASE stays legacy-compatible.
const TABLE_APPEARANCE_DEFAULTS={tbCardOn:true,tbHeaderStyle:'primary',tbStripes:false,tbGrid:'horizontal'};
const TABLE_SIZING_KEYS=['tbSizingVersion','tbWidthMode','tbHeightMode'];
const TABLE_SIZING_DEFAULTS=Object.freeze({tbSizingVersion:2,tbWidthMode:'auto',tbHeightMode:'optimal'});
const TABLE_GRAPHEME_SEGMENTER=typeof Intl!=='undefined'&&typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
function tableGraphemes(value){const text=String(value);if(TABLE_GRAPHEME_SEGMENTER)return Array.from(TABLE_GRAPHEME_SEGMENTER.segment(text),part=>part.segment);
 // Preserve combining marks, emoji modifiers/ZWJ sequences, flags and CRLF on
 // older offline browsers as well. The fallback never splits these clusters.
 const out=[];for(const ch of text){const code=ch.codePointAt(0),prev=out[out.length-1]||'',previousChars=[...prev],last=previousChars[previousChars.length-1]||'',mark=/\p{Mark}/u.test(ch)||code>=0xFE00&&code<=0xFE0F||code>=0xE0100&&code<=0xE01EF||code>=0x1F3FB&&code<=0x1F3FF||code>=0xE0020&&code<=0xE007F;
  const regional=code>=0x1F1E6&&code<=0x1F1FF,previousRegional=previousChars.filter(c=>{const n=c.codePointAt(0);return n>=0x1F1E6&&n<=0x1F1FF;}).length;
  if(prev&&(mark||ch==='\u200d'||last==='\u200d'||last==='\r'&&ch==='\n'||regional&&previousRegional===1))out[out.length-1]+=ch;else out.push(ch);}return out;}
function tableSizingOf(p){p=p||{};return{version:p.tbSizingVersion===2?2:1,widthMode:['auto','90','45'].includes(p.tbWidthMode)?p.tbWidthMode:'auto',heightMode:['optimal','larger','smaller','minimum'].includes(p.tbHeightMode)?p.tbHeightMode:'optimal'};}
function tableSizingFontOf(font){if(!font||typeof font!=='object'||Array.isArray(font))return null;
 const {bodyPt,headerPt,scale}=font,autoBoost=font.autoBoost==null?1:font.autoBoost;if(![bodyPt,headerPt,scale,autoBoost].every(Number.isFinite)||bodyPt<10||bodyPt>72||headerPt<9.5||headerPt>72||scale<.25||scale>4||autoBoost<1||autoBoost>2.6)return null;
 return{bodyPt,headerPt,scale,autoBoost};}
function tableFitColumns(preferred,minimum,target){const widths=minimum.slice(),free=new Set(widths.map((_,i)=>i));let remaining=target;
 while(free.size){const weight=[...free].reduce((n,c)=>n+preferred[c],0),clamped=[...free].filter(c=>remaining*(weight?preferred[c]/weight:1/free.size)<minimum[c]-1e-9);
  if(!clamped.length){for(const c of free)widths[c]=remaining*(weight?preferred[c]/weight:1/free.size);break;}
  for(const c of clamped){remaining-=minimum[c];free.delete(c);}}
 widths[widths.length-1]+=target-widths.reduce((a,b)=>a+b,0);return widths;}
// New table sizing is independent of the catalog-wide S/M/L and superseded
// density/padding/auto-grow switches. Explicit legacy mode remains untouched.
function tableLayoutParams(p){return tableSizingOf(p).version===2?Object.assign({},p,{size:'M',tbDense:'normal',tbPad:'m',tbAuto:true,tbWidth:'auto'}):p;}
// UI adoption is one undoable transaction. This never mutates inputs or storage.
// fresh=true starts a new table with neutral readable defaults; otherwise the
// current table's effective body/header sizes are frozen, not global S/M/L.
function adoptTableSizing(params,table,choices){params=params||BASE;table=table||{rows:[]};choices=choices||{};
 const previous=tableSizingOf(params),nextParams=Object.assign({},params,{tbSizingVersion:2,
  tbWidthMode:['auto','90','45'].includes(choices.widthMode)?choices.widthMode:previous.widthMode,
  tbHeightMode:['optimal','larger','smaller','minimum'].includes(choices.heightMode)?choices.heightMode:previous.heightMode});
 const nextTable=clone(table);let font=!choices.fresh&&previous.version===2?tableSizingFontOf(table.sizingFont):null;
 if(!font){const probe=choices.fresh?Object.assign({},params,{size:'M',tbDense:'normal',tbPad:'m',tbAuto:true,tbWidth:'auto',tbSizingVersion:1}):params;
  const m=buildModel(probe,{table}),info=m.slides[0]&&m.slides[0].table;
  font=info?{bodyPt:info.fs,headerPt:info.hfs,scale:info.k,autoBoost:info.boost||1}:{bodyPt:13,headerPt:11,scale:1,autoBoost:1};
  if(info&&Array.isArray(table.cw)&&table.cw.length===info.nC)nextTable.cw=info.colW.map(w=>w/info.k);}
 if(Object.prototype.hasOwnProperty.call(choices,'bodyPt')||Object.prototype.hasOwnProperty.call(choices,'headerPt')){const nextFont=Object.assign({},font);
  for(const key of ['bodyPt','headerPt'])if(Object.prototype.hasOwnProperty.call(choices,key))nextFont[key]=choices[key];
  font=tableSizingFontOf(nextFont);if(!font){const error=new Error('表格內文字級需為 10–72 pt，表頭需為 9.5–72 pt。');error.code='TABLE_FONT_INVALID';throw error;}}
 nextTable.sizingFont=font;return{params:nextParams,table:nextTable};}
function tableAppearanceOf(p){p=p||{};const look=tableLookOf(p);return {
 card:typeof p.tbCardOn==='boolean'?p.tbCardOn:['card','bandcard'].includes(look),
 header:['normal','primary'].includes(p.tbHeaderStyle)?p.tbHeaderStyle:['band','bandcard'].includes(look)?'primary':'normal',
 stripes:typeof p.tbStripes==='boolean'?p.tbStripes:look==='zebra',
 grid:['all','horizontal','none'].includes(p.tbGrid)?p.tbGrid:'horizontal'};}

const tableNumFont=nf=>!nf||/Georgia|Times|Cambria|Garamond|Palatino|Book|serif|明體|Mincho|Song|宋/i.test(nf)?'Arial':nf;
const T_NUM=/^[\s(（]*[-−+±▲▼△▽]?\s*(?:NT\$|US\$|\$|＄|€|¥)?\s*(?:\d{1,3}(?:,\d{3})+|\d+)?(?:\.\d+)?\s*(?:%|％|x|X|倍|ppts?|pts?|bps|[KkMmBb]|億|萬|元|天|週|日|h|hr|小時|件|台|片|顆)?\s*[)）]?\s*$/;
const tIsNum=t=>/\d/.test(t)&&T_NUM.test(t),tBlank=t=>/^\s*(|-|—|–|n\/a|NA|N\/A)\s*$/.test(t);
// 狀態字：整格完全相同才算（「已完成 60%」不算）；中英都收
const ST_WORDS={good:['✓','✔','☑','完成','已完成','達成','已達成','正常','通過','合格','OK','Done','Pass','Passed','On track','Complete','Completed','Good','Normal','綠','綠燈'],
 prog:['◐','進行中','執行中','處理中','待確認','規劃中','審查中','In progress','WIP','Hold','On hold','Review','Pending','Monitor','黃','黃燈'],
 risk:['✗','✘','×','NG','風險','高風險','延遲','落後','異常','未達成','未達','卡關','Risk','At risk','Delay','Delayed','Fail','Failed','Scrap','Blocked','Abnormal','紅','紅燈'],
 mark:['●','◎'],weak:['○','△','－','未開始','待定','暫停','取消','N/A','Not started','TBD','Cancelled']};
const ST_MAP=(()=>{const m=new Map();for(const k in ST_WORDS)ST_WORDS[k].forEach(w=>m.set(w.toLowerCase(),k));return m;})();
function statusOf(t){t=String(t||'').trim().replace(/\s+/g,' ');if(!t||t.length>14)return null;return ST_MAP.get(t.toLowerCase())||null;}
// 合計／平均列
const T_SUM=/^(合計|總計|小計|總額|總和|全年|累計|平均|週平均|月平均|日平均|年平均|稅後淨利|本期淨利|淨利|每股盈餘|EPS|Total|Grand total|Subtotal|Sum|Avg|Average|Mean|Net income|Net profit|YTD)(\b|[\s（(：:]|$)|^.{0,6}(合計|總計|小計|平均)$/i;
function tableAuto(rows,T){const nC=rows.reduce((n,r)=>Math.max(n,Array.isArray(r)?r.length:0),0);const cell=(r,c)=>String((rows[r]||[])[c]==null?'':rows[r][c]).trim();
 const r0=Array.from({length:nC},(_,c)=>cell(0,c)).filter(t=>t);const inferredHead=rows.length>1&&r0.length>0&&r0.filter(tIsNum).length/r0.length<.34;
 const head=T&&T.header!=null&&T.header!=='auto'?!!T.header:inferredHead,h0=head?1:0;
 const section=rows.map((r,ri)=>ri>=h0&&nC>=3&&cell(ri,0)!==''&&Array.from({length:nC-1},(_,c)=>cell(ri,c+1)).every(t=>t===''));
 const colStat=(c,f)=>{let n=0,y=0;for(let r=h0;r<rows.length;r++){if(section[r])continue;const t=cell(r,c);if(tBlank(t))continue;n++;if(f(t))y++;}return n>0&&y/n>=.6;};
 const types=T&&T.types||{};
 const numC=Array.from({length:nC},(_,c)=>types[c]==='number'||types[c]!=='text'&&c>0&&colStat(c,tIsNum));
 const statC=Array.from({length:nC},(_,c)=>types[c]!=='text'&&types[c]!=='number'&&c>0&&!numC[c]&&colStat(c,t=>!!statusOf(t)));
 const key=[];rows.forEach((r,ri)=>{if(ri>=h0&&!section[ri]&&T_SUM.test(cell(ri,0)))key.push(ri);});
 if(T&&T.lastTotal&&rows.length-1>=h0+1&&!key.includes(rows.length-1))key.push(rows.length-1);
 if(T&&T.lastTotal===false&&key.includes(rows.length-1))key.splice(key.indexOf(rows.length-1),1);
 const kind=numC.filter(Boolean).length>=Math.max(1,(nC-1)/2)?'number':statC.some(Boolean)?'status':'text';
 return{nC,head,numC,statC,section,key,kind};}

// One lossless source for editor and preview. Row numbers are never renumbered by filtering.
const TABLE_PREVIEW_BODY_ROWS=25; // Legacy API constant only; no longer caps source, preview or export.
function tableSource(T){T=T||{};const input=Array.isArray(T.rows)?T.rows:[];
 const nC=input.reduce((n,r)=>Math.max(n,Array.isArray(r)?r.length:0),0);
 const rows=Array.from(input,r=>Array.from({length:nC},(_,c)=>String(Array.isArray(r)&&r[c]!=null?r[c]:'').replace(/\r\n?/g,'\n')));
 const auto=tableAuto(rows,T),h0=auto.head?1:0,nR=rows.length,bodyRows=Math.max(0,nR-h0);
 const previewRows=rows,exportComplete=true,exportReason='';
 return{rows,rawRows:rows,nC,nR,h0,bodyRows,rawRowCount:nR,rawBodyRows:bodyRows,auto,previewRows,sourceRows:previewRows.map((_,r)=>r),exportComplete,exportReason};}
// Group only the digit substring, preserving precision, leading zeroes, signs, units and spacing.
function tableFormatValue(value,type,format){const t=String(value==null?'':value);if(type!=='number'||format!=='grouped')return t;
 const m=t.match(T_PARTS);if(!m||!/\d/.test(m[4]))return t;
 const [integer,fraction]=m[4].split('.'),grouped=integer.replace(/,/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction==null?'':'.'+fraction);
 const start=m.index+m[0].indexOf(m[4]);return t.slice(0,start)+grouped+t.slice(start+m[4].length);}
// Reject partial models in every public export route, not just disabled UI buttons.
function assertTableExportComplete(model){const docs=new Map(),isPage=info=>info&&['pageIndex','pageCount','documentId'].some(k=>Object.prototype.hasOwnProperty.call(info,k));
 const sharedWidth=Math.max(model&&model.W||W,...(model&&model.slides||[]).map(sl=>sl.w||sl.W||model.W||W));
 const fail=(info,why)=>{const err=new Error(info&&info.exportReason||`表格資料不完整（${why}），已停用匯出以避免資料遺漏。`);err.code='TABLE_EXPORT_INCOMPLETE';err.reason=why;if(info){err.rawRowCount=info.rawRowCount;err.rawBodyRows=info.rawBodyRows;err.documentId=info.documentId;err.pageIndex=info.pageIndex;}throw err;};
 const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
 const sameRows=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((row,i)=>same(row,b[i]));
 const mirror=['documentId','pageIndex','pageCount','rawRowCount','rawBodyRows','h0','nC','bodyStart','bodyEnd','renderedRowCount','exportComplete'];
 for(const sl of model&&model.slides||[]){const tables=(sl.items||[]).filter(it=>it.t==='tbl'),infos=[sl.table,...tables.map(it=>it.dataIntegrity)].filter(Boolean);
  for(const info of infos){if(info.exportComplete===false||info.layoutOverflow===true)fail(info,'export blocked');
   // Old non-paginated snapshots still reject their original truncated previews.
   if(!isPage(info)&&Number.isFinite(info.rawRowCount)&&Number.isFinite(info.renderedRowCount)&&info.rawRowCount>info.renderedRowCount)fail(info,'legacy partial preview');}
  if(isPage(sl.table)){const matched=tables.filter(tb=>tb.dataIntegrity&&tb.dataIntegrity.documentId===sl.table.documentId);if(matched.length!==1)fail(sl.table,'missing or duplicate native table');
   const info=matched[0].dataIntegrity;if(mirror.some(k=>sl.table[k]!==info[k])||!same(sl.table.sourceRows,info.sourceRows)||!sameRows(sl.table.displayRows,info.displayRows)||sl.table.renderedBodyRows!==info.renderedBodyRows||sl.table.bodySourceRows&&!same(sl.table.bodySourceRows,info.bodySourceRows))fail(sl.table,'slide/native metadata mismatch');
   if(!Array.isArray(sl.table.rawRows)||sl.table.rawRows.length!==info.rawRowCount||sl.table.rawRows.some(r=>!Array.isArray(r)||r.length!==info.nC))fail(info,'invalid full source');
   if(info.sourceValues&&!sameRows(sl.table.rawRows,info.sourceValues))fail(info,'full source values mismatch');
   if(sl.table.nR!==info.renderedRowCount)fail(info,'slide/native row count mismatch');}
  for(const tb of tables){const info=tb.dataIntegrity;if(!isPage(info))continue;
   if(model.custom&&!model.tray&&tableSizingOf(model.params).version===2&&sl.key==='table'&&(!info.sizing||info.sizing.version!==2))fail(info,'missing table sizing identity');
   if(info.pageCount!==1||info.pageIndex!==0)fail(info,'table pagination is not permitted');
   if(typeof info.documentId!=='string'||!info.documentId||!Number.isInteger(info.pageIndex)||!Number.isInteger(info.pageCount)||info.pageCount<1||info.pageIndex<0||info.pageIndex>=info.pageCount)fail(info,'invalid page identity');
   if(!Number.isInteger(info.rawRowCount)||!Number.isInteger(info.rawBodyRows)||info.rawRowCount<0||info.rawBodyRows<0||![0,1].includes(info.h0)||info.rawRowCount-info.h0!==info.rawBodyRows||!Number.isInteger(info.nC)||info.nC<1)fail(info,'invalid source counts');
   if(info.exportComplete!==true||!Number.isInteger(info.renderedRowCount)||!Array.isArray(info.sourceRows)||info.renderedRowCount!==info.sourceRows.length)fail(info,'invalid rendered counts');
   const body=info.sourceRows.slice(info.h0),expectedStart=body.length?body[0]:info.h0,expectedEnd=body.length?body[body.length-1]:info.h0-1;
   if(info.sourceRows.length<info.h0||(info.h0&&info.sourceRows[0]!==0)||body.some((r,i)=>!Number.isInteger(r)||r<info.h0||r>=info.rawRowCount||i>0&&r!==body[i-1]+1)||info.bodyStart!==expectedStart||info.bodyEnd!==expectedEnd||info.rawBodyRows>0&&!body.length)fail(info,'invalid source row map');
   if(info.renderedBodyRows!=null&&info.renderedBodyRows!==body.length||info.bodySourceRows&&!same(info.bodySourceRows,body))fail(info,'invalid body row counts');
   if(!Array.isArray(tb.cells)||tb.cells.length!==info.renderedRowCount||tb.cells.some(r=>!Array.isArray(r)||r.length!==info.nC||r.some(c=>!c||!Array.isArray(c.runs)||c.runs.some(run=>!run||typeof run.t!=='string'||!run.o||typeof run.o!=='object'))))fail(info,'native cell count mismatch');
   if(!Array.isArray(info.displayRows)||info.displayRows.length!==info.renderedRowCount||info.displayRows.some(r=>!Array.isArray(r)||r.length!==info.nC||r.some(t=>typeof t!=='string'))||!sameRows(info.displayRows,tb.cells.map(r=>r.map(c=>c.runs.map(run=>run.t+(run.o&&run.o.br?'\n':'')).join('')))))fail(info,'native cell content mismatch');
   if(!Array.isArray(tb.rowH)||tb.rowH.length!==info.renderedRowCount||!Array.isArray(tb.colW)||tb.colW.length!==info.nC||[...tb.rowH,...tb.colW].some(v=>!Number.isFinite(v)||v<=0))fail(info,'invalid native grid');
   const width=sl.w||sl.W||model.W||W,height=sl.h||sl.H||model.H||H;
   if(info.sizing&&info.sizing.version===2){const z=info.sizing;
    if(!['auto','90','45'].includes(z.widthMode)||!['optimal','larger','smaller','minimum'].includes(z.heightMode)||!tableSizingFontOf(z.font)||![z.referenceWidth,z.actualWidth].every(v=>Number.isFinite(v)&&v>0)||typeof z.widthApplied!=='boolean'||z.widthMode!=='auto'&&(!Number.isFinite(z.targetWidth)||z.targetWidth<=0))fail(info,'invalid table sizing');
    if(sl.table&&JSON.stringify(sl.table.sizing)!==JSON.stringify(z))fail(info,'slide/native sizing mismatch');
    if(z.widthMode!=='auto'&&(!z.widthApplied||Math.abs(tb.w-width*Number(z.widthMode)/100)>.00001||Math.abs(z.actualWidth-tb.w)>.00001||Math.abs(z.targetWidth-tb.w)>.00001))fail(Object.assign({},info,{exportReason:`這份版面不再符合表格的 ${z.widthMode}% 寬度設定，已停用匯出。請單獨下載這張表格，或明確改選自動寬度。` }),'table width ratio mismatch');
    if(z.widthMode!=='auto'&&Math.abs(tb.w-sharedWidth*Number(z.widthMode)/100)>.00001)fail(Object.assign({},info,{exportReason:`混合素材的 PPT 頁寬不同，無法保證這張表格的 ${z.widthMode}% 寬度。請單獨下載這張表格；未縮放或更改原始資料。` }),'shared canvas width ratio mismatch');
   }
   if(!Number.isFinite(width)||!Number.isFinite(height)||width>56||height>56)fail(info,'PowerPoint slide size exceeds 56 inches');
   if([tb.x,tb.y,tb.w,tb.h].some(v=>!Number.isFinite(v))||tb.x<-.01||tb.y<-.01||tb.x+tb.w>width+.01||tb.y+tb.h>height+.01||Math.abs(tb.colW.reduce((a,b)=>a+b,0)-tb.w)>.01||Math.abs(tb.rowH.reduce((a,b)=>a+b,0)-tb.h)>.01)fail(info,'native table outside slide bounds');
   if(isPage(sl.table)&&(sl.items||[]).some(it=>['表格標題','單位','註腳','圖例','表格頁碼'].includes(it.name)&&([it.x,it.y,it.w,it.h].some(v=>!Number.isFinite(v))||it.x<-.01||it.y<-.01||it.x+it.w>width+.01||it.y+it.h>height+.01)))fail(info,'table metadata outside slide bounds');
   let doc=docs.get(info.documentId);if(!doc){doc={info,pages:0,nextRow:info.h0,colW:tb.colW.slice(),rawRows:null};docs.set(info.documentId,doc);}
   if(['pageCount','rawRowCount','rawBodyRows','h0','nC'].some(k=>doc.info[k]!==info[k]))fail(info,'inconsistent document counts');
   if(info.h0&&!same(info.displayRows[0],doc.info.displayRows[0]))fail(info,'inconsistent repeated header');
   if(info.pageIndex!==doc.pages||body.length&&body[0]!==doc.nextRow)fail(info,'missing, duplicate or reordered page');
   if(tb.colW.some((w,c)=>Math.abs(w-doc.colW[c])>.00001))fail(info,'inconsistent page column widths');
   if(isPage(sl.table)&&sl.table.documentId===info.documentId){const raw=JSON.stringify(sl.table.rawRows);if(doc.rawRows!==null&&doc.rawRows!==raw)fail(info,'inconsistent full source');doc.rawRows=raw;}
   doc.pages++;doc.nextRow+=body.length;
  }
 }
 for(const doc of docs.values())if(doc.pages!==doc.info.pageCount||doc.nextRow!==doc.info.rawRowCount)fail(doc.info,'missing pages or body rows');
 // The manifest survives deleting every slide or a whole table document.
 // Legacy snapshots without one still use the per-table checks above.
 if(model&&model.tableDocuments!==undefined){const expected=new Set();if(!Array.isArray(model.tableDocuments))fail(null,'invalid table document manifest');
  for(const info of model.tableDocuments){if(!info||typeof info.documentId!=='string'||!info.documentId||expected.has(info.documentId))fail(info,'invalid or duplicate manifest document');expected.add(info.documentId);
   const doc=docs.get(info.documentId);if(!doc||['pageCount','rawRowCount','rawBodyRows','h0','nC'].some(k=>info[k]!==doc.info[k]))fail(info,'missing table document or manifest mismatch');
   if(info.sizing&&info.sizing.version===2&&(!doc.info.sizing||doc.info.sizing.version!==2||doc.info.sizing.widthMode!==info.sizing.widthMode))fail(info,'missing or mismatched table sizing identity');}
  if(expected.size!==docs.size)fail(null,'table document absent from manifest');}
 return model;}

// 數字格式：拆成 前綴／正負／貨幣／數字／單位 → 依設定重組
const T_PARTS=/^\s*([(（]?)\s*([-−+±▲▼△▽]?)\s*(NT\$|US\$|\$|＄|€|¥)?\s*((?:\d{1,3}(?:,\d{3})+|\d+)?(?:\.\d+)?)\s*(%|％|x|X|倍|ppts?|pts?|bps|[KkMmBb]|億|萬|元|天|週|日|h|hr|小時|件|台|片|顆)?\s*([)）]?)\s*$/;
function tParts(t){const m=String(t==null?'':t).match(T_PARTS);if(!m||!/\d/.test(m[4]))return null;
 const paren=!!(m[1]&&m[6]);const sign=m[2]||'';return{paren,sign,cur:m[3]||'',num:m[4],unit:m[5]||'',neg:paren||sign==='-'||sign==='−',dec:(m[4].split('.')[1]||'').length,sp:/\d\s+\S+$/.test(String(t).trim())&&!!m[5]};}
function tFmt(t,o){o=o||{};const p=tParts(t);if(!p)return String(t==null?'':t);
 // Legacy explicit formatting API, also lossless: never parse a decimal through Number.
 let [integer,fraction='']=p.num.replace(/,/g,'').split('.');integer=integer||'0';let unit=p.unit;
 if(o.pct&&!unit){const whole=integer.replace(/^0+(?=\d)/g,'');const small=whole==='0'||whole==='1'&&(!fraction||fraction.padEnd(1,'0')<='5'+'0'.repeat(Math.max(0,fraction.length-1)));
  if(small&&p.dec>=2){const digits=integer+fraction.padEnd(2,'0'),point=integer.length+2;integer=digits.slice(0,point).replace(/^0+(?=\d)/g,'');fraction=digits.slice(point);}unit='%';}
 const dec=Number.isInteger(o.dec)?Math.max(0,Math.min(100,o.dec)):p.dec;
 if(fraction.length>dec){const round=fraction[dec]>='5';fraction=fraction.slice(0,dec);if(round){let ds=(integer+fraction).split(''),carry=1;for(let i=ds.length-1;i>=0&&carry;i--){const v=+ds[i]+carry;ds[i]=String(v%10);carry=v>9?1:0;}if(carry)ds.unshift('1');const digits=ds.join('');integer=dec?digits.slice(0,-dec)||'0':digits;fraction=dec?digits.slice(-dec):'';}}
 else fraction=fraction.padEnd(dec,'0');
 let s=(o.thou!==false?integer.replace(/\B(?=(\d{3})+(?!\d))/g,','):integer)+(dec?'.'+fraction:'');
 const cur=p.cur,u=unit?(p.sp?' ':'')+unit:'';const body=cur+s+u;
 if(/[▲▼△▽+±]/.test(p.sign))return p.sign+(p.sign==='+'||p.sign==='±'?'':' ')+body;
 if(!p.neg)return body;let ms=o.minus||'auto';if(ms==='auto')ms=p.paren?'paren':'minus';
 return ms==='paren'?'('+body+')':(ms==='hyphen'?'-':'\u2212')+body;}
// 同欄小數位：眾數 ≥ 60% 才補齊（只補不砍，例 91% → 91.0%）
function tableColDec(rows,c,h0,AU){const ds=[];for(let r=h0;r<rows.length;r++){if(AU&&AU.section[r])continue;const p=tParts(rows[r][c]);if(p)ds.push(p.dec);}
 if(ds.length<2)return null;const cnt={};ds.forEach(d=>cnt[d]=(cnt[d]||0)+1);const [m,n]=Object.entries(cnt).sort((a,b)=>b[1]-a[1]||b[0]-a[0])[0];
 if(n/ds.length<.6)return null;return ds.every(d=>d<=+m)?+m:null;}
function lumOf(h){const v=[0,2,4].map(i=>{let x=parseInt(h.substr(i,2),16)/255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4);});return .2126*v[0]+.7152*v[1]+.0722*v[2];}
function contrastOf(a,b){const x=lumOf(a),y=lumOf(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function ensureContrast(fg,bg,r){fg=String(fg||'3A3A3A').toUpperCase();bg=bg||'FFFFFF';if(contrastOf(fg,bg)>=r)return fg;const dark=lumOf(bg)>.4;
 for(const to of dark?['000000','FFFFFF']:['FFFFFF','000000'])for(let t=.08;t<=1.001;t+=.08){const c=mix(fg,to,t);if(contrastOf(c,bg)>=r)return c;}return contrastOf('000000',bg)>contrastOf('FFFFFF',bg)?'000000':'FFFFFF';}
// 建議：門檻規則預設欄（%／Yield／良率／率／rate 優先）與整數門檻（% 欄＝90，其他＝中位數取整）；財報表的最新期別欄
const T_METRIC=/(%|％|yield|良率|率|rate|ratio|margin)/i;
function tableSuggest(rows){const A=tableAuto(rows);const h0=A.head?1:0;const nC=A.nC;const hdr=c=>h0?String(rows[0][c]||''):'';
 const nums=c=>rows.slice(h0).filter((r,i)=>!A.section[i+h0]).map(r=>tNumVal(r[c])).filter(Number.isFinite);
 const cand=Array.from({length:nC},(_,c)=>c).filter(c=>A.numC[c]);
 const pctCol=c=>rows.slice(h0).filter(r=>/[%％]\s*[)）]?\s*$/.test(String(r[c]||''))).length>=Math.max(1,(rows.length-h0)*.5);
 const score=c=>(T_METRIC.test(hdr(c))?3:0)+(pctCol(c)&&!/QoQ|YoY|MoM|WoW|Δ|增減|變化|差異|成長|vs/i.test(hdr(c))?2:0);
 const c=cand.length?cand.slice().sort((a,b)=>score(b)-score(a)||a-b)[0]:null;let rule=null;
 const CHG=/QoQ|YoY|MoM|WoW|Δ|增減|變化|差異|成長|vs\.?|與上/i;
 if(c!=null){const v=nums(c).sort((a,b)=>a-b);const chg=CHG.test(hdr(c));const pc=!chg&&(pctCol(c)||/%|％|yield|良率/i.test(hdr(c)));let thr;
  if(chg)thr=0;else if(pc)thr=90;else if(v.length){const med=v[Math.floor(v.length/2)];const mag=Math.pow(10,Math.max(0,Math.floor(Math.log10(Math.abs(med)||1))-0));thr=Math.round(med/mag)*mag;if(!thr)thr=Math.round(med);}
  rule={c,op:'<',v:thr,tone:'warn',style:'text'};}
 const PER=/^(?:[1-4]Q\d{2}|Q[1-4][\s'’]?\d{2,4}|FY\s?\d{2,4}|\d{4}\s?(?:年|Q[1-4]|H[12])?|H[12][\s'’]?\d{2,4}|\d{1,2}\s?月|(?:19|20)\d{2}[\/.-]\d{1,2})$/i;
 let period=null;if(h0){const pc=Array.from({length:nC},(_,c)=>c).filter(c=>A.numC[c]&&PER.test(String(rows[0][c]||'').trim()));
  if(pc.length>=2){const key=t=>{t=String(t).trim();let y=+(t.match(/(?:19|20)?(\d{2})(?!.*\d{2})/)||[0,0])[1],q=+(t.match(/([1-4])Q|Q([1-4])/i)||[0,0,0]).slice(1).find(Boolean)||0,m=+(t.match(/(\d{1,2})\s?月/)||[0,0])[1];return y*100+q*10+m;};
   period=pc.slice().sort((a,b)=>key(rows[0][b])-key(rows[0][a])||a-b)[0];}}
 return{rule,period,kind:A.kind,auto:A};}
// 新資料清除標題／單位／註腳；只有 mode='update' 明確保留。keep 只沿用欄位外觀。
// 建議標題（重點句）：重點欄＋第一列／合計列的數字＋變化欄；門檻命中；狀態統計
function tableTitleSuggest(T){const rows=tableSource(T).rows;if(rows.length<2)return '';const A=tableAuto(rows,T);const h0=A.head?1:0;const nC=A.nC;
 const hdr=c=>h0?String(rows[0][c]||'').trim():'';const cell=(r,c)=>String((rows[r]||[])[c]||'').trim();const MK=tableMarks(T,nC,rows.length);
 const CHG=/QoQ|YoY|MoM|WoW|Δ|增減|變化|成長/i;
 const hc=MK.his.find(h=>h.type==='col'&&A.numC[h.i]);
 if(hc&&h0){const r=A.key.length?A.key[0]:h0;const chg=Array.from({length:nC},(_,c)=>c).filter(c=>CHG.test(hdr(c))&&cell(r,c));
  return `${hdr(hc.i)} ${cell(r,0)} ${cell(r,hc.i)}${chg.length?'，'+chg.map(c=>hdr(c)+' '+cell(r,c)).join('、'):''}`.trim();}
 const R=MK.rules.find(x=>Number.isFinite(x.v));
 if(R){const hit=[];for(let r=h0;r<rows.length;r++){if(A.section[r]||A.key.includes(r))continue;const v=tNumVal(cell(r,R.c));if(Number.isFinite(v)&&ruleHit(R,v))hit.push(cell(r,0));}
  const op={'<':'<','<=':'≤','>':'>','>=':'≥','=':'='}[R.op];const pct=/%/.test(cell(h0,R.c))?'%':'';
  const H=hdr(R.c).replace(/[（(][^）)]*[）)]/g,'').trim();const wd=/</.test(R.op)?'低於':/>/.test(R.op)?'高於':'等於';
  if(hit.length===1){let rr=-1;for(let r=h0;r<rows.length;r++){if(A.section[r]||A.key.includes(r))continue;const v=tNumVal(cell(r,R.c));if(Number.isFinite(v)&&ruleHit(R,v)){rr=r;break;}}return `${cell(rr,0)} ${H} ${cell(rr,R.c)}，${wd}門檻`.replace(/\s+/g,' ').trim();}
  return hit.length?`${hit.length} 筆 ${H} ${wd} ${R.v}${pct}：${hit.slice(0,3).join('、')}${hit.length>3?' 等':''}`:`全部 ${H} 皆未${wd} ${R.v}${pct}`;}
 const sc=A.statC.findIndex(Boolean);
 if(sc>0){const n={good:0,prog:0,risk:0};for(let r=h0;r<rows.length;r++){const s=statusOf(cell(r,sc));if(s in n)n[s]++;}
  const parts=[];if(n.good)parts.push(`${n.good} 項完成`);if(n.prog)parts.push(`${n.prog} 項進行中`);if(n.risk)parts.push(`${n.risk} 項有風險`);
  if(parts.length)return parts.join('、')+(n.risk?'，需優先處理':'');}
 // 通用：挑一個指標欄，報極值（良率／稼動類＝最低；其他＝最高）
 const nums=Array.from({length:nC},(_,c)=>c).filter(c=>A.numC[c]&&!CHG.test(hdr(c)));
 if(nums.length){const LOWBAD=/yield|良率|uptime|稼動|達成|合格|pass|oee|%/i;const c=nums.find(c=>LOWBAD.test(hdr(c)))??nums[0];const low=LOWBAD.test(hdr(c));
  let best=-1,bv=low?Infinity:-Infinity;for(let r=h0;r<rows.length;r++){if(A.section[r]||A.key.includes(r))continue;const v=tNumVal(cell(r,c));if(!Number.isFinite(v))continue;if(low?v<bv:v>bv){bv=v;best=r;}}
  if(best>=0){const clean=h=>String(h).replace(/[（(][^）)]*[）)]/g,'').replace(/\s+/g,' ').trim();
   const short=l=>{l=String(l).trim();if([...l].length<=10)return l;const tk=(l.match(/[A-Za-z0-9][A-Za-z0-9._\-]*/g)||[]).filter(t=>!/^\d{1,2}$/.test(t));return tk.length?tk.join(' '):[...l].slice(0,10).join('');};
   let lab=short(cell(best,0));const l2=nC>2&&!A.numC[1]&&1!==c?short(cell(best,1)):'';const H=clean(hdr(c))||'數值',V=cell(best,c);
   const VL=s=>[...s].reduce((n,ch)=>n+(/[\u0000-\u024f]/.test(ch)?.55:1),0);let out=`${H} ${low?'最低':'最高'}：${lab}${l2?' '+l2:''} ${V}`.replace(/\s+/g,' ').trim();if(VL(out)>24)out=`${H} ${low?'最低':'最高'}：${lab} ${V}`.replace(/\s+/g,' ').trim();
   if(VL(out)>24)out=`${low?'最低':'最高'}：${lab} ${V}`;return out;}}
 return h0&&hdr(0)?`${hdr(0)} 一覽`:'';}
function tableFromPaste(rows,prev,mode){prev=prev||{};rows=tableSource({rows}).rows;const S=tableSuggest(rows);const keep=prev.keep!==false,update=mode==='update';const keepTitle=update&&!!prev.title;
 const his=S.period!=null&&S.kind==='number'?[{type:'col',i:S.period,color:'auto'}]:[];const nR=rows.length;
 // 表頭／合計：自動判斷的結果直接寫進狀態（核取方塊＝唯一真相）
 const out={rows,title:keepTitle?prev.title:'',pin:keepTitle&&!!prev.pin,unit:update?prev.unit||'':'',note:update?prev.note||'':'',his,rules:[],bold:S.auto.key,align:{},fmt:{},types:{},formats:{},header:!!S.auto.head,lastTotal:S.auto.key.includes(nR-1),hcol:!!prev.hcol,cw:null,hiStyle:prev.hiStyle||null,keep};
 if(update&&tableSizingFontOf(prev.sizingFont))out.sizingFont=clone(prev.sizingFont);
 // 沿用目前樣式（預設開）：依「欄名」對應；欄名對不上但欄數相同時依位置對應
 if(keep&&Array.isArray(prev.rows)&&prev.rows[0]){const oh=prev.rows[0].map(x=>String(x).trim()),nh=(rows[0]||[]).map(x=>String(x).trim());const same=oh.length===nh.length;
  const map=c=>{const n=oh[c];const j=n?nh.indexOf(n):-1;if(j>=0)return j;return same&&c<nh.length?c:-1;};
  out.rules=(prev.rules||[]).map(r=>{const c=map(r.c);return c>0?Object.assign({},r,{c}):null;}).filter(Boolean);
  const hs=(prev.his||[]).filter(h=>h.type==='col').map(h=>{const i=map(h.i);return i>=0?Object.assign({},h,{i}):null;}).filter(Boolean);if(hs.length)out.his=hs;
  const mv=o=>{const r={};Object.entries(o||{}).forEach(([c,v])=>{const j=map(+c);if(j>=0)r[j]=v;});return r;};out.fmt=mv(prev.fmt);out.align=mv(prev.align);out.types=mv(prev.types);out.formats=mv(prev.formats);
  if(prev.legend)out.legend=prev.legend;}
 return out;}
/* Table highlights retain source coordinates, including blank rows. One user range is
   one mark, regardless of its cell count. Exclusions preserve all style outside a
   cleared/replaced visual intersection without expanding marks into individual cells.
   Visual H/L does not erase legacy semantic marks; clearing reveals them again. */
const TABLE_HIGHLIGHT_LIMIT=12;
const TABLE_HIGHLIGHT_PRESETS=Object.freeze([
 Object.freeze({id:'theme-light',label:'主題淡色',fill:'D9E6F2',color:'1F3864',border:'7995AF',mode:'fill',bold:null}),
 Object.freeze({id:'theme-dark',label:'主題深色',fill:'1F4E79',color:'FFFFFF',border:'1F4E79',mode:'fill',bold:null}),
 Object.freeze({id:'mint',label:'薄荷綠',fill:'DDEDED',color:'0B5E61',border:'6C9B9D',mode:'fill',bold:null}),
 Object.freeze({id:'amber',label:'琥珀黃',fill:'FFF1D6',color:'6B4700',border:'BA9A5C',mode:'fill',bold:null}),
 Object.freeze({id:'rose',label:'玫瑰紅',fill:'F6E0E2',color:'7A1F2B',border:'B07980',mode:'fill',bold:null}),
 Object.freeze({id:'slate',label:'中性灰',fill:'EDEDED',color:'3A3A3A',border:'999999',mode:'fill',bold:null})
]);
// Versioned palette: new marks use these hues, while legacy IDs below keep their
// original resolver and serialized appearance. Fixed hues never depend on a theme.
const TABLE_HIGHLIGHT_HUES=Object.freeze([
 Object.freeze({id:'theme',label:'主題色',dynamic:true}),
 Object.freeze({id:'blue',label:'藍色',soft:'D7E5F5',dark:'285785'}),
 Object.freeze({id:'green',label:'綠色',soft:'D8EACF',dark:'356343'}),
 Object.freeze({id:'red',label:'紅色',soft:'F3D0D0',dark:'8B3535'}),
 Object.freeze({id:'yellow',label:'黃色',soft:'F6E4AD',dark:'745313'}),
 Object.freeze({id:'gray',label:'灰色',soft:'E6E6E6',dark:'595959'})
]);
const TABLE_HIGHLIGHT_PRESETS_V2=Object.freeze(TABLE_HIGHLIGHT_HUES.flatMap(h=>['soft','deep'].map(tone=>Object.freeze({id:`v2-${h.id}-${tone}`,hue:h.id,tone,label:h.label+'・'+(tone==='soft'?'柔色':'深色白字'),mode:'fill',bold:null}))));
// New clicks opt in to the distinct theme fill. Saved v2 IDs are not aliases and
// retain their original appearance, even after loading, reapplying or exporting.
const TABLE_HIGHLIGHT_PRESETS_V3=Object.freeze([
 Object.freeze({id:'v3-theme-soft',hue:'theme',tone:'soft',label:'主題色・柔色',mode:'fill',bold:null}),
 Object.freeze({id:'v3-theme-deep',hue:'theme',tone:'deep',label:'主題色・深色白字＋淺色細線',mode:'fill',bold:null})
]);
// Exact existing style roles, not a new palette or a new tone of P. Persist only
// the role ID so changing a style/role color updates explicitly linked marks.
const TABLE_HIGHLIGHT_ROLES=Object.freeze([
 Object.freeze({id:'main',label:'主色',token:'P'}),
 Object.freeze({id:'deep',label:'深色',token:'PD'}),
 Object.freeze({id:'light',label:'淺色',token:'PT'}),
 Object.freeze({id:'accent',label:'強調色',token:'AL'})
]);
const TABLE_HIGHLIGHT_PRESETS_V4=Object.freeze(TABLE_HIGHLIGHT_ROLES.map(role=>Object.freeze({id:`v4-role-${role.id}`,role:role.id,roleToken:role.token,label:role.label,group:'theme-role',dynamic:true,mode:'fill',bold:null})));
const TABLE_HIGHLIGHT_FAMILIES=Object.freeze([
 Object.freeze({id:'fill',label:'底色',width:1.5}),Object.freeze({id:'outline',label:'外框',width:2.25}),
 Object.freeze({id:'underline',label:'底線',width:2}),Object.freeze({id:'side',label:'側線',width:3})
]);
const TABLE_HIGHLIGHT_BORDER_WIDTHS=Object.freeze([1,1.5,2.25,3]);
function tableHighlightBorderWidth(mark){const family=tableHighlightFamily(mark);return family==='outline'&&TABLE_HIGHLIGHT_BORDER_WIDTHS.includes(mark&&mark.borderWidth)?mark.borderWidth:TABLE_HIGHLIGHT_FAMILIES.find(f=>f.id===family)?.width;}
const TABLE_HIGHLIGHT_STROKES=Object.freeze({'theme-light':'52779B','theme-dark':'1F4E79',mint:'267A76',amber:'9B6B12',rose:'A14553',slate:'666666'});
// Missing styleId is the legacy fill schema. Reject unknown values, never hydrate CSS.
function tableHighlightFamily(value){const id=typeof value==='object'&&value?value.styleId??value.family??'fill':value??'fill';return TABLE_HIGHLIGHT_FAMILIES.some(f=>f.id===id)?id:null;}
function tableHighlightPresetId(hue,tone='soft',family='fill'){
 if(!TABLE_HIGHLIGHT_HUES.some(h=>h.id===hue)||!['soft','deep'].includes(tone)||!tableHighlightFamily(family))return null;
 return hue==='theme'&&family==='fill'?`v3-theme-${tone}`:`v2-${hue}-${family==='fill'?tone:'soft'}`;
}
function tableRoleParams(params){const st=Object.assign({},BASE,params||{});
 for(const key of ['P','PD','PT','A','ink'])st[key]=/^[0-9A-F]{6}$/i.test(st[key]||'')?st[key].toUpperCase():BASE[key];
 return st;
}
function tableHighlightRolePresets(params,family='fill',options={}){
 if(!tableHighlightFamily(family))return[];const st=tableRoleParams(params);
 const input=Object.prototype.hasOwnProperty.call(options,'headerFill')?options.headerFill:tableAppearanceOf(st).header==='primary'?st.P:null;
 const headerFill=/^[0-9A-F]{6}$/i.test(input||'')?input.toUpperCase():null;
 return TABLE_HIGHLIGHT_PRESETS_V4.map(role=>{const p=tableHighlightPreset(role.id,st,family),matchesHeader=headerFill===p.sourceColor;
  return Object.assign({},p,{headerFill,headerContrast:headerFill?contrastOf(p.sourceColor,headerFill):null,matchesHeader,recommended:p.role==='accent'&&!matchesHeader});
 });
}
// Reference roles: navy header / medium-blue emphasis / pale-blue soft fill.
// Other themes retain P's hue and saturation, solving lightness for readable
// white text. Some custom/theme headers can equal that medium tone; the light
// top rule then supplies a role cue without changing any header or saved IDs.
function tableThemePaint(p,tone){
 const rgb=[0,2,4].map(i=>parseInt(p.substr(i,2),16)/255),max=Math.max(...rgb),min=Math.min(...rgb),d=max-min,l=(max+min)/2;
 const sat=d?d/(1-Math.abs(2*l-1)):0,hue=!d?0:max===rgb[0]?60*(((rgb[1]-rgb[2])/d+6)%6):max===rgb[1]?60*((rgb[2]-rgb[0])/d+2):60*((rgb[0]-rgb[1])/d+4);
 const at=L=>[0,8,4].map(n=>{const k=(n+hue/30)%12,a=sat*Math.min(L,1-L);return Math.round(255*(L-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0');}).join('').toUpperCase();
 let lo=0,hi=1;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(contrastOf(at(mid),'FFFFFF')>=4.8)lo=mid;else hi=mid;}
 const medium=p===BASE.P?'2E75B6':at(lo),soft=p===BASE.P?'DEE7F1':mix(p,'FFFFFF',.86);
 if(tone==='soft')return{fill:soft,color:p===BASE.P?'1F3864':ensureContrast(p,soft,4.5),border:medium};
 return{fill:medium,color:'FFFFFF',border:medium,accent:ensureContrast(soft,medium,3),accentWidth:1.25};
}
function tableRangeEdge(mark,r,c,edge){if(!tableMarkContains(mark,r,c))return false;const family=tableHighlightFamily(mark);
 return family==='outline'?(edge==='bT'?r===mark.r0:edge==='bB'?r===mark.r1:edge==='bL'?c===mark.c0:edge==='bR'?c===mark.c1:false):family==='underline'?edge==='bB'&&r===mark.r1:family==='side'?edge==='bL'&&c===mark.c0:false;
}
function tableRangeEdgeRegions(mark){const family=tableHighlightFamily(mark),q=(r0,c0,r1,c1)=>({r0,c0,r1,c1});
 return family==='outline'?[q(mark.r0,mark.c0,mark.r0,mark.c1),q(mark.r1,mark.c0,mark.r1,mark.c1),q(mark.r0,mark.c0,mark.r1,mark.c0),q(mark.r0,mark.c1,mark.r1,mark.c1)]:family==='underline'?[q(mark.r1,mark.c0,mark.r1,mark.c1)]:family==='side'?[q(mark.r0,mark.c0,mark.r1,mark.c0)]:[];
}
function tableMarkPaintRegions(mark,nR,nC){const regions=tableMarkRegions(mark,nR,nC);if(mark.type!=='range'||tableHighlightFamily(mark)==='fill')return regions;
 return regions.flatMap(q=>tableRangeEdgeRegions(mark).map(edge=>tableRangeIntersection(q,edge)).filter(Boolean)).concat(tableMarkBoldRegions(mark,nR,nC));
}
// Prefer the exact token. If an edge touches dark cells, choose the closest tint or
// shade meeting 3:1 against both sides; retain the strongest minimum if impossible.
function tableHighlightStroke(stroke,backgrounds){const bgs=[...new Set(backgrounds.map(c=>c||'FFFFFF'))],score=c=>Math.min(...bgs.map(b=>contrastOf(c,b)));
 if(score(stroke)>=3)return stroke;let best=stroke,bestScore=score(stroke);
 for(let i=1;i<=100;i++)for(const to of ['FFFFFF','000000']){const c=mix(stroke,to,i/100),v=score(c);if(v>=3)return c;if(v>bestScore){best=c;bestScore=v;}}return best;
}
const HI_COLORS=['auto','P','A','alert'],RULE_OPS=['<','<=','>','>=','='],RULE_TONES=['warn','good','accent'],RULE_STYLES=['fill','text','box'];
function tableHighlightPreset(id,params,family='fill'){family=tableHighlightFamily(family);if(!family)return null;
 const role=TABLE_HIGHLIGHT_PRESETS_V4.find(p=>p.id===id);
 if(role){const st=tableRoleParams(params),sourceColor=role.roleToken==='AL'?themeSemanticColors(st).warn.toUpperCase():st[role.roleToken];
  if(family!=='fill'){const stroke=tableHighlightStroke(sourceColor,['FFFFFF']);return Object.assign({},role,{family,mode:family,sourceColor,fill:null,color:null,border:stroke,stroke,strokeAdjusted:stroke!==sourceColor,borderWidth:TABLE_HIGHLIGHT_FAMILIES.find(f=>f.id===family).width});}
  const color=contrastOf(st.ink,sourceColor)>=4.5?st.ink:contrastOf('FFFFFF',sourceColor)>=4.5?'FFFFFF':'000000';
  return Object.assign({},role,{sourceColor,fill:sourceColor,color,border:sourceColor});
 }
 const modern=TABLE_HIGHLIGHT_PRESETS_V2.find(p=>p.id===id)||TABLE_HIGHLIGHT_PRESETS_V3.find(p=>p.id===id);
 if(modern){const hue=TABLE_HIGHLIGHT_HUES.find(h=>h.id===modern.hue),p=params&&/^[0-9A-F]{6}$/i.test(params.P||'')?params.P.toUpperCase():BASE.P;
  if(id.startsWith('v3-')&&family==='fill')return Object.assign({},modern,tableThemePaint(p,modern.tone));
  const dark=hue.dynamic?ensureContrast(p,'FFFFFF',4.5):hue.dark,soft=hue.dynamic?mix(p,'FFFFFF',.86):hue.soft;
  if(family!=='fill')return Object.assign({},modern,{label:hue.label,family,mode:family,fill:null,color:null,border:dark,stroke:dark,borderWidth:TABLE_HIGHLIGHT_FAMILIES.find(f=>f.id===family).width});
  const fill=modern.tone==='deep'?dark:soft,color=modern.tone==='deep'?'FFFFFF':hue.dynamic?ensureContrast(p,soft,4.5):dark;
  return Object.assign({},modern,{fill,color,border:dark});
 }
 // Legacy branch intentionally unchanged: do not migrate or recolor saved marks.
 const preset=TABLE_HIGHLIGHT_PRESETS.find(p=>p.id===id);if(!preset)return null;
 if(family!=='fill')return Object.assign({},preset,{family,mode:family,fill:null,color:null,border:TABLE_HIGHLIGHT_STROKES[id],stroke:TABLE_HIGHLIGHT_STROKES[id],borderWidth:TABLE_HIGHLIGHT_FAMILIES.find(f=>f.id===family).width});
 const out=Object.assign({},preset),p=params&&/^[0-9A-F]{6}$/i.test(params.P||'')?params.P.toUpperCase():BASE.P;
 if(p!==BASE.P&&id==='theme-light'){out.fill=mix(p,'FFFFFF',.86);out.color=ensureContrast(p,out.fill,4.5);out.border=mix(p,'FFFFFF',.4);}
 if(id==='theme-dark'){out.fill=ensureContrast(p,'FFFFFF',4.5);out.color='FFFFFF';out.border=out.fill;}
 out.color=ensureContrast(out.color,out.fill,4.5);return out;
}
function tableNormalizeRange(range,nR,nC){
 if(!range||typeof range!=='object'||!Number.isInteger(nR)||!Number.isInteger(nC)||nR<1||nC<1)return null;
 const keys=['r0','c0','r1','c1'];if(keys.some(k=>range[k]===null||range[k]===''||typeof range[k]==='boolean'||!Number.isInteger(+range[k])))return null;
 const a=Math.min(+range.r0,+range.r1),b=Math.max(+range.r0,+range.r1),c=Math.min(+range.c0,+range.c1),d=Math.max(+range.c0,+range.c1);
 if(b<0||a>=nR||d<0||c>=nC)return null;
 return{r0:Math.max(0,a),c0:Math.max(0,c),r1:Math.min(nR-1,b),c1:Math.min(nC-1,d)};
}
function tableRangeIntersection(a,b){if(!a||!b)return null;const r0=Math.max(a.r0,b.r0),c0=Math.max(a.c0,b.c0),r1=Math.min(a.r1,b.r1),c1=Math.min(a.c1,b.c1);return r0<=r1&&c0<=c1?{r0,c0,r1,c1}:null;}
function tableRangeSubtract(a,b){const q=tableRangeIntersection(a,b);if(!q)return[a];const out=[];
 if(a.r0<q.r0)out.push({r0:a.r0,c0:a.c0,r1:q.r0-1,c1:a.c1});
 if(q.r1<a.r1)out.push({r0:q.r1+1,c0:a.c0,r1:a.r1,c1:a.c1});
 if(a.c0<q.c0)out.push({r0:q.r0,c0:a.c0,r1:q.r1,c1:q.c0-1});
 if(q.c1<a.c1)out.push({r0:q.r0,c0:q.c1+1,r1:q.r1,c1:a.c1});return out;
}
function tableMarkBounds(mark,nR,nC){if(!mark)return null;
 const rect=mark.type==='range'?mark:mark.type==='row'?{r0:mark.i,c0:0,r1:mark.i,c1:nC-1}:mark.type==='col'?{r0:0,c0:mark.i,r1:nR-1,c1:mark.i}:mark.type==='cell'?{r0:mark.r,c0:mark.c,r1:mark.r,c1:mark.c}:null;
 return tableNormalizeRange(rect,nR,nC);
}
function tableMarkContains(mark,r,c){if(!mark||!Number.isInteger(r)||!Number.isInteger(c)||r<0||c<0)return false;
 const inside=mark.type==='range'?r>=mark.r0&&r<=mark.r1&&c>=mark.c0&&c<=mark.c1:mark.type==='row'?r===mark.i:mark.type==='col'?c===mark.i:mark.type==='cell'?r===mark.r&&c===mark.c:false;
 return inside&&!(mark.excludes||[]).some(q=>r>=q.r0&&r<=q.r1&&c>=q.c0&&c<=q.c1);
}
function tableMarkRegions(mark,nR,nC){const bounds=tableMarkBounds(mark,nR,nC);let regions=bounds?[bounds]:[];
 for(const q of mark&&mark.excludes||[])regions=regions.flatMap(a=>tableRangeSubtract(a,q));return regions;
}
// Optional per-mark text emphasis never forces regular weight. Regions describe
// only overrides inside an existing mark; they never add a fill or an inner edge.
function tableMarkBoldAt(mark,r,c){return mark?.type==='range'&&tableMarkContains(mark,r,c)&&(mark.bold===true||(mark.boldRegions||[]).some(q=>r>=q.r0&&r<=q.r1&&c>=q.c0&&c<=q.c1));}
function tableMarkBoldRegions(mark,nR,nC){if(mark?.type!=='range')return[];const coverage=tableMarkRegions(mark,nR,nC);if(mark.bold===true)return coverage;
 return coverage.flatMap(a=>(mark.boldRegions||[]).map(q=>tableRangeIntersection(a,q)).filter(Boolean));
}
function tableRegionUnion(regions){const out=[];for(const region of regions){let rest=[region];for(const old of out)rest=rest.flatMap(q=>tableRangeSubtract(q,old));out.push(...rest);}return out;}
function tableRegionsCover(coverage,regions){let rest=coverage;for(const q of regions)rest=rest.flatMap(a=>tableRangeSubtract(a,q));return !rest.length;}
function tableWithBoldRegions(mark,regions,nR,nC){const next=Object.assign({},mark);delete next.bold;delete next.boldRegions;const coverage=tableMarkRegions(mark,nR,nC),bold=tableRegionUnion(coverage.flatMap(a=>regions.map(q=>tableRangeIntersection(a,q)).filter(Boolean)));
 if(bold.length){if(tableRegionsCover(coverage,bold))next.bold=true;else next.boldRegions=bold;}return next;
}
function tableRangeBoldState(T,range){T=T||{};const source=tableSource(T),q=tableNormalizeRange(range,source.nR,source.nC);if(!q)return null;
 const marks=tableMarks(T,source.nC,source.nR).his.filter(h=>h.type==='range'),coverage=marks.flatMap(h=>tableMarkRegions(h,source.nR,source.nC).map(a=>tableRangeIntersection(a,q)).filter(Boolean));if(!coverage.length)return null;
 const bold=marks.flatMap(h=>tableMarkBoldRegions(h,source.nR,source.nC).map(a=>tableRangeIntersection(a,q)).filter(Boolean));return !bold.length?false:tableRegionsCover(coverage,bold)?true:'mixed';
}
function tableSetRangeBold(T,range,bold){T=T||{};const source=tableSource(T),his=tableMarks(T,source.nC,source.nR).his,q=tableNormalizeRange(range,source.nR,source.nC);
 if(!q)return{his,changed:false,error:'INVALID_RANGE'};if(typeof bold!=='boolean')return{his,changed:false,error:'INVALID_BOLD'};
 const next=his.map(mark=>{if(mark.type!=='range')return mark;const coverage=tableMarkRegions(mark,source.nR,source.nC),hit=coverage.map(a=>tableRangeIntersection(a,q)).filter(Boolean);if(!hit.length)return mark;
  const before=tableMarkBoldRegions(mark,source.nR,source.nC);return tableWithBoldRegions(mark,bold?[...before,...hit]:before.flatMap(a=>tableRangeSubtract(a,q)),source.nR,source.nC);}).filter(mark=>tableMarkPaintRegions(mark,source.nR,source.nC).length);
 return{his:next,changed:JSON.stringify(next)!==JSON.stringify(his)};
}
function tableRangeBorderWidth(T,range){T=T||{};const source=tableSource(T),q=tableNormalizeRange(range,source.nR,source.nC);if(!q)return null;
 const mark=tableMarks(T,source.nC,source.nR).his.slice().reverse().find(h=>h.type==='range'&&tableHighlightFamily(h)==='outline'&&['r0','c0','r1','c1'].every(k=>h[k]===q[k]));return mark?tableHighlightBorderWidth(mark):null;
}
function tableSetRangeBorderWidth(T,range,width){T=T||{};const source=tableSource(T),his=tableMarks(T,source.nC,source.nR).his,q=tableNormalizeRange(range,source.nR,source.nC);
 if(!q)return{his,changed:false,error:'INVALID_RANGE'};if(!TABLE_HIGHLIGHT_BORDER_WIDTHS.includes(width))return{his,changed:false,error:'INVALID_BORDER_WIDTH'};
 let index=-1;for(let i=his.length-1;i>=0;i--)if(his[i].type==='range'&&tableHighlightFamily(his[i])==='outline'&&['r0','c0','r1','c1'].every(k=>his[i][k]===q[k])){index=i;break;}
 if(index<0)return{his,changed:false,error:'NO_OUTLINE_RANGE'};if(tableHighlightBorderWidth(his[index])===width)return{his,changed:false};
 const next=his.slice(),mark=Object.assign({},his[index]);if(width===2.25)delete mark.borderWidth;else mark.borderWidth=width;next[index]=mark;return{his:next,changed:true};
}
function tableRangeWinner(his,r,c,family){for(let i=(his||[]).length-1;i>=0;i--)if(his[i].type==='range'&&(!family||tableHighlightFamily(his[i])===family)&&tableMarkContains(his[i],r,c))return his[i];return null;}
function tableClearRange(T,range){T=T||{};const source=tableSource(T),his=tableMarks(T,source.nC,source.nR).his,q=tableNormalizeRange(range,source.nR,source.nC);
 if(!q)return{his,changed:false,error:'INVALID_RANGE'};
 let changed=false;const next=his.map(mark=>{if(mark.type!=='range')return mark;const regions=tableMarkRegions(mark,source.nR,source.nC);if(!regions.some(a=>tableRangeIntersection(a,q)))return mark;
  changed=true;const intersection=tableRangeIntersection(tableMarkBounds(mark,source.nR,source.nC),q);const out=Object.assign({},mark,{excludes:[...(mark.excludes||[]).filter(a=>!(a.r0>=intersection.r0&&a.r1<=intersection.r1&&a.c0>=intersection.c0&&a.c1<=intersection.c1)),intersection]});
  return tableMarkPaintRegions(out,source.nR,source.nC).length?out:null;}).filter(Boolean);
 return{his:next,changed};
}
// Resolve topmost visual coverage geometrically, without iterating every cell.
function tableRangeUsesPreset(his,range,presetId,nR,nC){let remaining=[range];
 for(let i=his.length-1;i>=0&&remaining.length;i--){const mark=his[i];if(mark.type!=='range')continue;
  if(tableHighlightFamily(mark)!=='fill'){if(tableMarkPaintRegions(mark,nR,nC).some(q=>tableRangeIntersection(q,range)))return false;continue;}
  for(const region of tableMarkRegions(mark,nR,nC)){if(!remaining.some(q=>tableRangeIntersection(q,region)))continue;
   if(tableHighlightFamily(mark)!=='fill'||mark.presetId!==presetId)return false;remaining=remaining.flatMap(q=>tableRangeSubtract(q,region));}}
 return !remaining.length;
}
// Line no-op identity includes family AND actual perimeter, not filled-area coverage.
function tableRangeUsesLine(his,range,presetId,family,width){const edges=[];
 // V2 fill tones share exactly one line paint; preserve imported IDs on no-op.
 const lineKey=id=>{const p=TABLE_HIGHLIGHT_PRESETS_V2.find(p=>p.id===id)||TABLE_HIGHLIGHT_PRESETS_V3.find(p=>p.id===id);return p?'v2-'+p.hue:id;},wanted=lineKey(presetId);
 if(family==='outline'){for(let c=range.c0;c<=range.c1;c++){edges.push([range.r0,c,'bT'],[range.r1,c,'bB']);}for(let r=range.r0;r<=range.r1;r++){edges.push([r,range.c0,'bL'],[r,range.c1,'bR']);}}
 else if(family==='underline')for(let c=range.c0;c<=range.c1;c++)edges.push([range.r1,c,'bB']);
 else for(let r=range.r0;r<=range.r1;r++)edges.push([r,range.c0,'bL']);
 return edges.every(([r,c,edge])=>{const [dr,dc,opposite]={bT:[-1,0,'bB'],bR:[0,1,'bL'],bB:[1,0,'bT'],bL:[0,-1,'bR']}[edge];
  for(let i=his.length-1;i>=0;i--){const h=his[i];if(h.type!=='range')continue;
   if(tableRangeEdge(h,r,c,edge)||tableRangeEdge(h,r+dr,c+dc,opposite))return lineKey(h.presetId)===wanted&&tableHighlightFamily(h)===family&&tableHighlightBorderWidth(h)===width;
  }return false;});
}
function tableApplyRange(T,range,presetId,family='fill',options={}){T=T||{};options=options||{};const source=tableSource(T),his=tableMarks(T,source.nC,source.nR).his,q=tableNormalizeRange(range,source.nR,source.nC);family=tableHighlightFamily(family);
 if(!q)return{his,changed:false,error:'INVALID_RANGE'};if(!family)return{his,changed:false,error:'INVALID_FAMILY'};if(!tableHighlightPreset(presetId))return{his,changed:false,error:'INVALID_PRESET'};
 if(options.bold!==undefined&&typeof options.bold!=='boolean')return{his,changed:false,error:'INVALID_BOLD'};
 const borderWidth=family==='outline'?(options.borderWidth??2.25):TABLE_HIGHLIGHT_FAMILIES.find(f=>f.id===family).width;if(family==='outline'&&!TABLE_HIGHLIGHT_BORDER_WIDTHS.includes(borderWidth))return{his,changed:false,error:'INVALID_BORDER_WIDTH'};
 const samePaint=family==='fill'?tableRangeUsesPreset(his,q,presetId,source.nR,source.nC):tableRangeUsesLine(his,q,presetId,family,borderWidth);
 if(samePaint&&(options.bold===undefined||tableRangeBoldState(Object.assign({},T,{his:his.filter(h=>h.type==='range'&&tableHighlightFamily(h)===family)}),q)===options.bold))return{his,changed:false};
 // Fill retains its historical replacement behavior. Lines only write their edges,
 // keeping underlying fill/text and other families' edges. Exact same-family range
 // replacement compacts obsolete paint without consuming another range slot.
 const previous=family==='fill'?tableClearRange(T,q).his:his.filter(h=>!(h.type==='range'&&tableHighlightFamily(h)===family&&['r0','c0','r1','c1'].every(k=>h[k]===q[k])));
 if(previous.filter(h=>h.type==='range').length>=TABLE_HIGHLIGHT_LIMIT)return{his,changed:false,error:'MARK_LIMIT'};
 let mark=Object.assign({type:'range'},q,{presetId,color:'auto',kind:'focus'});if(family!=='fill')mark.styleId=family;if(options.bold===true)mark.bold=true;if(family==='outline'&&borderWidth!==2.25)mark.borderWidth=borderWidth;
 if(options.bold===undefined)mark=tableWithBoldRegions(mark,his.flatMap(h=>tableMarkBoldRegions(h,source.nR,source.nC)),source.nR,source.nC);
 const next=[...previous,mark];return{his:next,changed:JSON.stringify(next)!==JSON.stringify(his)};
}
/* nR/nC are the dimensions AFTER inserting/removing one row or column. Insertions
   inside an existing rectangle expand it; deletion of its sole row/column drops it. */
function tableShiftMarks(his,axis,index,remove,nR,nC){if(!['row','col'].includes(axis)||!Number.isInteger(index)||index<0)return tableMarks({his},nC,nR).his;
 const coord=axis==='row'?'r':'c',lo=coord+'0',hi=coord+'1',deleted=!!remove;
 const point=n=>deleted?(n===index?null:n>index?n-1:n):(n>=index?n+1:n);
 const rect=q=>{const out=Object.assign({},q);if(deleted){if(q[lo]===index&&q[hi]===index)return null;out[lo]=q[lo]>index?q[lo]-1:q[lo];out[hi]=q[hi]>=index?q[hi]-1:q[hi];}
  else{out[lo]=q[lo]>=index?q[lo]+1:q[lo];out[hi]=q[hi]>=index?q[hi]+1:q[hi];}return out;};
 const next=(his||[]).map(mark=>{let out=Object.assign({},mark);
  if(mark.type==='range'){out=rect(out);if(!out)return null;}
  else if(mark.type===axis){out.i=point(mark.i);if(out.i===null)return null;}
  else if(mark.type==='cell'){out[coord]=point(mark[coord]);if(out[coord]===null)return null;}
  if(mark.excludes)out.excludes=mark.excludes.map(rect).filter(Boolean);if(mark.boldRegions)out.boldRegions=mark.boldRegions.map(rect).filter(Boolean);return out;}).filter(Boolean);
 return tableMarks({his:next},nC,nR).his;
}
function tNumVal(t){t=String(t==null?'':t).trim();if(!tIsNum(t))return NaN;const m=t.replace(/[,，\s]/g,'').match(/\d+(?:\.\d+)?|\.\d+/);if(!m)return NaN;
 const neg=/^[(（]/.test(t)||/^[(（]?\s*[-−▼▽]/.test(t);const v=parseFloat(m[0]);return neg?-v:v;}
function ruleHit(R,v){if(!Number.isFinite(v)||!Number.isFinite(R.v))return false;switch(R.op){case '<':return v<R.v-1e-9;case '<=':return v<=R.v+1e-9;case '>':return v>R.v+1e-9;case '>=':return v>=R.v-1e-9;default:return Math.abs(v-R.v)<1e-9;}}
function tableMarks(T,nC,nR){T=T||{};const int=v=>v!==null&&v!==''&&typeof v!=='boolean'&&Number.isInteger(+v)?+v:-1;
 let his=Array.isArray(T.his)?T.his:(T.hi&&(T.hi.type==='col'||T.hi.type==='row')?[T.hi]:[]);
 his=his.filter(h=>h&&typeof h==='object').map(h=>{const type=['col','row','cell','range'].includes(h.type)?h.type:null,color=HI_COLORS.includes(h.color)?h.color:'auto';
  const kind=['focus','rec','warn'].includes(h.kind)?h.kind:(h.color==='alert'?'warn':'focus');let mark;
  if(type==='range'){const q=tableNormalizeRange(h,nR,nC);const family=tableHighlightFamily(h);if(!q||!tableHighlightPreset(h.presetId)||!family)return null;mark=Object.assign({type},q,{presetId:h.presetId,color,kind});if(family!=='fill')mark.styleId=family;}
  else mark=type==='cell'?{type,r:int(h.r),c:int(h.c),color,kind}:{type,i:int(h.i),color,kind};
  const bounds=tableMarkBounds(mark,nR,nC);if(!bounds)return null;
  if(Array.isArray(h.excludes)){const excludes=h.excludes.map(q=>tableRangeIntersection(bounds,tableNormalizeRange(q,nR,nC))).filter(Boolean);if(excludes.length)mark.excludes=excludes;}
  if(type==='range'){if(tableHighlightFamily(mark)==='outline'&&TABLE_HIGHLIGHT_BORDER_WIDTHS.includes(h.borderWidth)&&h.borderWidth!==2.25)mark.borderWidth=h.borderWidth;
   const regions=h.bold===true?tableMarkRegions(mark,nR,nC):Array.isArray(h.boldRegions)?h.boldRegions.map(q=>tableRangeIntersection(bounds,tableNormalizeRange(q,nR,nC))).filter(Boolean):[];if(regions.length)mark=tableWithBoldRegions(mark,regions,nR,nC);}
  return tableMarkPaintRegions(mark,nR,nC).length?mark:null;}).filter(Boolean);
 // Imported snapshots are never silently truncated. Mutation helpers enforce the
 // visual range limit atomically, separate from preserved legacy semantics,
 // allowing an exact replacement even at capacity.
 const seen=new Set();his=his.filter(h=>{if(h.type==='range')return true;const k=h.type+':'+(h.type==='cell'?h.r+','+h.c:h.i);if(seen.has(k))return false;seen.add(k);return true;});
 const rules=[]; // Legacy threshold rules remain retired.
 return{his,rules};}
const SIZE_K={S:.8,M:1,L:1.25};
function scaleSlide(sl,k){const r2=v=>Math.round(v*k*2)/2,f=v=>v*k,r100=v=>Math.round(v*k*100)/100;
 const runs=rs=>rs&&rs.forEach(r=>{r.o.size=r2(r.o.size);if(r.o.cs)r.o.cs=r100(r.o.cs);});
 sl.items.forEach(it=>{
  if(it.t==='ln'){it.x1=f(it.x1);it.y1=f(it.y1);it.x2=f(it.x2);it.y2=f(it.y2);it.w=r100(it.w);return;}
  it.x=f(it.x);it.y=f(it.y);it.w=f(it.w);it.h=f(it.h);
  if(it.t==='tbl'){it.colW=it.colW.map(f);it.rowH=it.rowH.map(f);
   it.cells.forEach(r=>r.forEach(c=>{runs(c.runs);c.size=r2(c.size);c.mL=Math.max(1,r100(c.mL));c.mT=Math.max(1,r100(c.mT));   /* PptxGenJS：表格 margin[0]<1 會被當成英吋 → 下限 1pt */['bT','bB','bL','bR'].forEach(b=>{if(c[b])c[b]=Object.assign({},c[b],{w:r100(c[b].w)});});}));return;}
  if(it.adj)it.adj=f(it.adj);if(it.lw)it.lw=r100(it.lw);
  if(it.sites)it.sites=it.sites.map(q=>[f(q[0]),f(q[1]),q[2]]);
  if(it.points)it.points.forEach(p=>{if(p.close)return;p.x=f(p.x);p.y=f(p.y);const c=p.curve;if(c){['x1','y1','x2','y2','hR','wR'].forEach(q=>{if(c[q]!=null)c[q]=f(c[q]);});}});
  if(it.sh)it.sh=Object.assign({},it.sh,{blur:r100(it.sh.blur),dist:r100(it.sh.dist)});
  if(it.runs){runs(it.runs);it.tx.size=r2(it.tx.size);it.tx.margin=Array.isArray(it.tx.margin)?it.tx.margin.map(r100):r100(it.tx.margin);if(it.tx.cs)it.tx.cs=r100(it.tx.cs);}});
 (sl.groups||[]).forEach(g=>{g.x=f(g.x);g.y=f(g.y);g.w=f(g.w);g.h=f(g.h);});
 if(sl.schemeCatalogue){sl.w=f(sl.w);sl.h=f(sl.h);}sl.W=W*k;sl.H=H*k;sl.k=k;}

/* ================= PptxGenJS 匯出 ================= */
function lum(h){const v=[0,2,4].map(i=>parseInt(h.substr(i,2),16)/255);return .2126*v[0]+.7152*v[1]+.0722*v[2];}
function bboxOf(items){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
 items.forEach(it=>{if(it.t==='ln'){x0=Math.min(x0,it.x1,it.x2);x1=Math.max(x1,it.x1,it.x2);y0=Math.min(y0,it.y1,it.y2);y1=Math.max(y1,it.y1,it.y2);}
  else{x0=Math.min(x0,it.x);y0=Math.min(y0,it.y);x1=Math.max(x1,it.x+it.w);y1=Math.max(y1,it.y+it.h);}});
 return{x:x0,y:y0,w:Math.max(x1-x0,.01),h:Math.max(y1-y0,.01)};}
function ahType(t,sz){return t?(sz&&sz!=='med'?`${t}" w="${sz}" len="${sz}`:t):undefined;}
/* ---------- v25：商業框架「什麼時候用／怎麼填」＋示範文案（網站說明面板、.pptx 備忘稿共用） ---------- */
const FW_HELP=[
 ['商業模式圖 BMC','Business Model Canvas','說明一門生意怎麼賺錢：新事業提案、募資、年度策略盤點。',['先填右半：目標客群 → 價值主張 → 通路 → 顧客關係 → 收入來源','再填左半：關鍵活動、關鍵資源、關鍵夥伴、成本結構','每格 1–3 個名詞片語，數字放收入／成本格'],'價值主張：交期縮短 30%、良率 ≥ 98.5%｜目標客群：車用 IC 設計公司｜收入來源：代工費＋一次性工程費'],
 ['PESTEL','PESTEL','進入新市場、寫年度計畫前，盤點外部環境的機會與威脅。',['六格各寫 1 個最重要的趨勢，不要列滿','每格寫「趨勢＋影響」，例如「電價上漲 → 成本 +3%」','用主色標出對你影響最大的 1 格'],'政治：在地化補助延長兩年｜經濟：匯率波動 ±5%｜科技：AI 晶片需求年增 40%'],
 ['OKR','OKR','對齊一季的團隊目標：O 是方向、KR 是可量化的終點線。',['O 寫成一句有企圖心、不含數字的話','KR 3 個以內，每個都有數字和期限','進度條填實際達成率，季中檢討時更新'],'O：B 線良率達到業界前段班｜KR1：良率 ≥ 98.5%｜KR2：客訴 ≤ 2 件／月｜KR3：SOP 100% 更新'],
 ['波特五力','Porter\'s Five Forces','評估一個產業值不值得進入、利潤會被誰吃掉。',['中間寫產業名稱，四周五力各寫一句判斷','用「高／中／低」標強度，最強的一力用主色','最後一句結論：利潤壓力主要來自哪裡'],'買方議價：高（前 3 大客戶占營收 60%）｜替代品：低｜新進入者：中（設備投資門檻高）'],
 ['精實畫布','Lean Canvas','新創或內部新專案的一頁假設：問題、解法、指標。',['從「問題」與「客群」開始，最多 3 個問題','獨特價值用一句話，最好有數字','「指標」只放 1 個北極星指標'],'問題：良率靠人工判讀、耗時｜獨特價值：判片時間 −80%｜指標：誤判率 < 1%'],
 ['價值鏈','Value Chain','找出在哪個環節創造或流失價值、該投資哪裡。',['主要活動由左到右照實際流程填','支援活動只寫跟本次議題有關的','把要改善的環節用主色標出'],'主要活動：進料 → 製造 → 出貨 → 銷售 → 服務｜改善重點：製造（良率）'],
 ['SWOT','SWOT','策略規劃起手式：內部優劣勢 × 外部機會威脅。',['S／W 寫內部、可控制的；O／T 寫外部、不可控的','每格 2–3 點，具體到可以驗證','下一頁接「SO／WT 對策」，SWOT 本身不是結論'],'優勢：良率領先 1.2 pt｜劣勢：產能吃緊｜機會：車用需求成長｜威脅：新競爭者降價'],
 ['2×2 矩陣','2×2 Matrix','把一堆選項分成四類，快速決定優先順序。',['先定兩個軸（例：影響 × 投入），軸名寫在外側','每個選項放成一個點或卡片','右上角用主色，標題直接寫「先做右上 3 項」'],'X 軸：投入成本｜Y 軸：影響程度｜右上：自動判片、預防保養、SOP 數位化'],
 ['5×5 風險熱圖','Risk Heat Map','專案或營運風險盤點，讓主管一眼看到最大的風險。',['X＝發生機率、Y＝影響程度，各 1–5 分','每個風險放編號，旁邊或下方附清單','紅區（高×高）的風險都要有負責人與對策'],'R1 關鍵設備交期延誤（4×5）｜R2 主要供應商斷料（2×5）｜R3 人力流動（3×3）'],
 ['魚骨圖 6M','Fishbone (6M)','異常或客訴的原因發散：先把可能原因列全，再驗證。',['魚頭寫「問題＝現象＋數字」','六根骨依人、機、料、法、環、測各列 1–3 個原因','已驗證為根因的用主色，其餘保持灰色'],'問題：B 線良率 7 月下降 1.5 pt｜機：CMP 墊片壽命過長（已驗證）｜料：漿料批次差異'],
 ['8D 步驟條','8D Problem Solving','客訴或重大異常的正式回覆流程。',['D1–D8 依序，一頁標出目前在第幾步','每一步旁邊寫負責人與完成日','D4 根因、D5 對策是主管最在意的兩步'],'D3 暫時對策：全數加檢（已完成）｜D4 根因：墊片壽命設定錯誤｜D5 永久對策：改為 300 片更換'],
 ['RACI 分工表','RACI Matrix','專案啟動時釐清誰負責、誰決策，避免三不管。',['列＝工作項目、欄＝角色','每列只能有 1 個 A（最終負責）','R 太多的列，代表需要再拆工作'],'需求定義：PM＝A、工程＝R、品保＝C、業務＝I'],
 ['PDCA 循環','PDCA Cycle','持續改善的進度報告：現在走到哪一步、下一步做什麼。',['四格各寫一句本輪的重點','目前所在的步驟用主色','Act 寫成下一輪的 Plan'],'Plan：目標良率 98.5%｜Do：導入新墊片｜Check：良率 98.7%｜Act：擴到 C 線'],
 ['5 Why 追問','5 Whys','從現象一路追到可以行動的根因。',['第一層寫看得到的現象，不要直接寫原因','每一層都回答上一層的「為什麼」','追到可以下對策、而且是流程或制度的層級就停'],'良率下降 → 刮傷增加 → 墊片磨耗 → 更換週期太長 → 規格沒隨新製程更新'],
 ['市場規模 TAM／SAM／SOM','TAM / SAM / SOM','募資或新事業提案時說明市場有多大、你能拿多少。',['TAM＝全市場、SAM＝你能服務的、SOM＝3 年內實際拿得到的','每層都寫金額與計算依據（一行）','SOM 要保守、可驗證'],'TAM：全球晶圓檢測 USD 80 億｜SAM：亞洲 12 吋廠 USD 20 億｜SOM：3 年 USD 4,000 萬'],
 ['30-60-90 天計畫','30-60-90 Day Plan','面試或新職就任時，說明你前三個月要做什麼。',['30 天：學習與建立關係','60 天：找到 1–2 個快速見效的改善','90 天：交付可量化的成果'],'30 天：熟悉產線與 KPI｜60 天：完成良率分析看板｜90 天：主導一項改善，良率 +0.5 pt']];
function fwHelp(name){name=String(name||'');const h=FW_HELP.find(([k])=>name.indexOf(k)===0);return h?{name:h[0],en:h[1],when:h[2],how:h[3],sample:h[4]}:null;}
function fwNotes(sl){const seen=new Set();const out=[];(sl.groups||[]).forEach(g=>{const h=fwHelp(g.name);if(!h||seen.has(h.name))return;seen.add(h.name);
 out.push(`【${h.name}｜${h.en}】\n什麼時候用：${h.when}\n怎麼填：\n${h.how.map((t,i)=>(i+1)+'. '+t).join('\n')}\n示範文案：${h.sample}`);});return out.join('\n\n');}
function toPptx(pptx,model){
 // PowerPoint has one size for the entire presentation. Never stretch the
 // existing standard pages when a caller accidentally mixes long catalogues.
 if(model.slides.some(sl=>sl.schemeCatalogue)&&model.slides.some(sl=>!sl.schemeCatalogue)){const e=new Error('方案元件長頁目錄請獨立下載；標準投影片與長頁不可混合，避免改變原有頁面尺寸。');e.code='SCHEME_CATALOGUE_MIXED_SIZE';throw e;}
 assertTableExportComplete(model);
 // PowerPoint has one presentation-wide size. Expand the shared canvas, never rescale tables.
 const exportW=Math.max(model.W||W,...model.slides.map(sl=>sl.w||sl.W||model.W||W)),exportH=Math.max(model.H||H,...model.slides.map(sl=>sl.h||sl.H||model.H||H));
 if(exportW>56||exportH>56||!Number.isFinite(exportW)||!Number.isFinite(exportH)){const err=new Error('完整內容超過 PowerPoint 56 × 56 吋投影片限制，無法忠實匯出。');err.code='TABLE_EXPORT_INCOMPLETE';throw err;}
 if(model.slides.some(sl=>sl.w||sl.h)){pptx.defineLayout({name:'FULL_CONTENT',width:exportW,height:exportH});pptx.layout='FULL_CONTENT';}else if(model.W&&Math.abs(model.W-W)>.001){pptx.defineLayout({name:'KIT_'+model.k,width:model.W,height:model.H});pptx.layout='KIT_'+model.k;}else pptx.layout='LAYOUT_WIDE';pptx.title='精緻圖解元件庫 · '+(model.params.zh||'自訂風格');pptx.author='PPT Style Studio';
 const KI={};model.slides.forEach((sl,i)=>{if(!(sl.key in KI))KI[sl.key]=i+1;});
 model.slides.forEach(sl=>{const s=pptx.addSlide();s.background={color:'FFFFFF'};
  sl.items.forEach(it=>{
   if(it.t==='tbl'){const bd=b=>b?{type:'solid',pt:b.w,color:b.c}:{type:'none'};
    const rows=tableResolvedBorders(it).map(r=>r.map(c=>({text:c.runs.map(rn=>({text:rn.t,options:Object.assign({fontSize:rn.o.size,fontFace:rn.o.font,bold:rn.o.bold,color:rn.o.color},rn.o.br?{breakLine:true}:{})})),
     options:Object.assign({align:c.align,valign:'middle',margin:[c.mT,c.mR!=null?c.mR:c.mL,c.mT,c.mL],border:[bd(c.bT),bd(c.bR),bd(c.bB),bd(c.bL)]},c.fill?{fill:{color:c.fill}}:{})})));
    s.addTable(rows,{x:it.x,y:it.y,w:it.w,colW:it.colW,rowH:it.rowH,autoPage:false});return;}
   if(it.t==='pic'){s.addImage({data:it.png,x:it.x,y:it.y,w:it.w,h:it.h,rounding:!!it.round,objectName:it.name||'圖片'});return;}
   if(it.t==='ln'){const L={color:it.color,width:it.w,dashType:it.dash};if(it.head)L.endArrowType=ahType(it.head,it.hs);if(it.tail)L.beginArrowType=ahType(it.tail,it.hs);
    s.addShape('line',{x:Math.min(it.x1,it.x2),y:Math.min(it.y1,it.y2),w:Math.abs(it.x2-it.x1),h:Math.abs(it.y2-it.y1),flipH:it.x2<it.x1,flipV:it.y2<it.y1,line:L,objectName:'線條'});return;}
   const p={x:it.x,y:it.y,w:it.w,h:it.h};if(it.name)p.objectName=it.name;
   if(it.kind){p.shape=it.doc?'flowChartDocument':it.kind;p.fill=it.fill?{color:it.fill,transparency:it.ft||0}:{type:'none'};
    p.line=it.line?{color:it.line,width:it.lw,dashType:it.dash}:{type:'none'};if(it.line&&it.head)p.line.endArrowType=ahType(it.head,it.hs);if(it.line&&it.tail)p.line.beginArrowType=ahType(it.tail,it.hs);}
   // PowerPoint repaired away icon-base groups with an explicit hexagon adj guide.
   // Native defaults are confirmed usable; preserve adjustments of unrelated catalog shapes.
   if(it.adj&&!(it.kind==='hexagon'&&it.iconBase))p.rectRadius=it.adj;if(it.points&&!it.doc)p.points=it.points;
   if(it.sh)p.shadow={type:'outer',blur:it.sh.blur,offset:it.sh.dist,angle:it.sh.dir,color:it.sh.color,opacity:it.sh.alpha};
   let runs='';
   if(it.runs){const T=it.tx;runs=it.runs.map(r=>{const o={fontSize:r.o.size,fontFace:r.o.font,bold:r.o.bold,color:r.o.color};if(r.o.cs!=null)o.charSpacing=r.o.cs;if(r.o.hl)o.highlight=r.o.hl;if(r.o.strike)o.strike='sngStrike';if(r.o.u)o.underline=typeof r.o.u==='string'?{style:'sng',color:r.o.u}:{style:'sng'};if(r.o.br)o.breakLine=true;if(r.o.link&&KI[r.o.link])o.hyperlink={slide:KI[r.o.link],tooltip:'跳到該頁'};return{text:r.t,options:o};});
    Object.assign(p,{align:T.align,valign:T.valign,margin:it.doc&&Array.isArray(T.margin)?[T.margin[0],T.margin[1],0,T.margin[3]]:T.margin,fontFace:T.font,fontSize:T.size,color:T.color,bold:T.bold});if(T.lsp&&T.lsp!==1)p.lineSpacingMultiple=T.lsp;}
   if(it.runs&&it.name!=='標題'&&!it.mk)p.fit='shrink';   /* v9：<a:normAutofit/>——在 PowerPoint 裡改長文字時自動縮小，不會溢出圖形 */
   s.addText(runs,p);});});
 return pptx;}
/* v13 半高螢光筆：文字方塊的硬切線性漸層（上 a 透明 → 淡色帶 → 最後 1−b 透明），不換行＋圖形隨文字調整大小（改字時色帶跟著伸縮） */
function mkGrad(mk){const g=(p,a)=>`<a:gs pos="${Math.round(p*100000)}"><a:srgbClr val="${mk.c}"><a:alpha val="${a}"/></a:srgbClr></a:gs>`;
 return `<a:gradFill rotWithShape="1"><a:gsLst>${g(0,0)}${g(mk.a,0)}${g(mk.a,100000)}${g(mk.b,100000)}${g(mk.b,0)}${g(1,0)}</a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill>`;}
function mkXml(blk,mk){return blk.replace(/(<\/a:prstGeom>)(?:<a:noFill\/>|<a:solidFill>[\s\S]*?<\/a:solidFill>)?/,'$1'+mkGrad(mk))
  .replace(/<a:bodyPr\b([^>]*?)\s*(\/?)>(?:([\s\S]*?)<\/a:bodyPr>)?/,(m0,a,sc,inner)=>'<a:bodyPr'+a.replace(/\s+wrap="[^"]*"/,'')+' wrap="none">'+String(sc?'':inner||'').replace(/<a:(?:normAutofit|spAutoFit|noAutofit)\b[^>]*\/>|<a:normAutofit\b[^>]*>[\s\S]*?<\/a:normAutofit>/g,'')+'<a:spAutoFit/></a:bodyPr>');}
/* 陰影修補：PptxGenJS 固定寫 algn="bl"、無 sx/sy；這裡依 model 逐一改寫成正確的 outerShdw（光暈置中、放大、柔和） */
function effectXml(sh){const e=v=>Math.round(v*12700);const sc=Math.round((sh.scale||1)*100000);
 return `<a:effectLst><a:outerShdw blurRad="${e(sh.blur)}" dist="${e(sh.dist)}" dir="${Math.round(sh.dir*60000)}" sx="${sc}" sy="${sc}" algn="ctr" rotWithShape="0"><a:srgbClr val="${sh.color}"><a:alpha val="${Math.round(sh.alpha*100000)}"/></a:srgbClr></a:outerShdw></a:effectLst>`;}
/* ---------- 黏著連接線：model 折線 → OOXML 連接線幾何（straightConnector1／bentConnector2／bentConnector3＋rot／flip） ---------- */
function connGeom(pts){const n=pts.length;if(n<2||n>4)return null;const eps=.003;
 const S=pts[0],E=pts[n-1];const C=[(S[0]+E[0])/2,(S[1]+E[1])/2];
 const R=(v,deg)=>{const t=deg*Math.PI/180,c=Math.round(Math.cos(t)),s=Math.round(Math.sin(t));return[v[0]*c-v[1]*s,v[0]*s+v[1]*c];};
 for(const rot of n===2?[0]:[0,90,180,270]){
  const d=R([E[0]-S[0],E[1]-S[1]],-rot);const w=Math.abs(d[0]),h=Math.abs(d[1]);const fH=d[0]<-1e-9,fV=d[1]<-1e-9;
  const toW=(px,py)=>{const qx=fH?w-px:px,qy=fV?h-py:py;const r=R([qx-w/2,qy-h/2],rot);return[C[0]+r[0],C[1]+r[1]];};
  const near=(a,b)=>Math.abs(a[0]-b[0])<eps&&Math.abs(a[1]-b[1])<eps;
  if(n===2)return{prst:'straightConnector1',rot:0,fH,fV,w,h,C};
  if(n===3){if(near(toW(w,0),pts[1]))return{prst:'bentConnector2',rot,fH,fV,w,h,C};continue;}
  if(w<1e-6)continue;
  const rel=R([pts[1][0]-C[0],pts[1][1]-C[1]],-rot);const qx=rel[0]+w/2;const px=fH?w-qx:qx;const a=px/w;
  if(near(toW(a*w,0),pts[1])&&near(toW(a*w,h),pts[2]))return{prst:'bentConnector3',rot,fH,fV,w,h,C,adj:Math.round(a*100000)};}
 return null;}
function cxnXml(blk,it,cxnId){const ofs=it.t==='ln'?null:[it.x,it.y];
 let pts=it.t==='ln'?[[it.x1,it.y1],[it.x2,it.y2]]:it.points.filter(p=>!p.close&&!p.curve).map(p=>[p.x+ofs[0],p.y+ofs[1]]);
 if(it.t!=='ln'&&it.points.some(p=>p.curve))return null;
 let g=connGeom(pts);
 if(!g&&pts.length===4){const L=pts[3],Q=pts[2];const dx=Math.sign(L[0]-Q[0]),dy=Math.sign(L[1]-Q[1]);   // U 形且起訖同高：終點沿最後一段縮 0.006"
  const p2=pts.slice();p2[3]=[L[0]-dx*.006,L[1]-dy*.006];g=connGeom(p2);}
 if(!g)return null;
 const E=v=>Math.round(v*914400);const lnM=blk.match(/<a:ln\b[^>]*\/>|<a:ln\b[^>]*>[\s\S]*?<\/a:ln>/);if(!lnM)return null;
 let nm=(blk.match(/<p:cNvPr id="\d+" name="([^"]*)"/)||[])[1]||'連接線';if(nm==='線條')nm='連接線';
 const c=it.cx||{};const st=c.a?`<a:stCxn id="${c.a[0]+2}" idx="${c.a[1]}"/>`:'',en=c.b?`<a:endCxn id="${c.b[0]+2}" idx="${c.b[1]}"/>`:'';
 const xf=`<a:xfrm${g.rot?` rot="${g.rot*60000}"`:''}${g.fH?' flipH="1"':''}${g.fV?' flipV="1"':''}><a:off x="${E(g.C[0]-g.w/2)}" y="${E(g.C[1]-g.h/2)}"/><a:ext cx="${E(g.w)}" cy="${E(g.h)}"/></a:xfrm>`;
 const av=g.prst==='bentConnector3'?`<a:avLst><a:gd name="adj1" fmla="val ${g.adj}"/></a:avLst>`:'<a:avLst/>';
 return `<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="${cxnId}" name="${nm}"/><p:cNvCxnSpPr>${st}${en}</p:cNvCxnSpPr><p:nvPr/></p:nvCxnSpPr><p:spPr>${xf}<a:prstGeom prst="${g.prst}">${av}</a:prstGeom>${lnM[0]}</p:spPr></p:cxnSp>`;}
function connectXml(x,slide,stat){const items=slide.items;
 return x.replace(/<p:sp>[\s\S]*?<\/p:sp>/g,blk=>{const m=blk.match(/<p:cNvPr id="(\d+)"/);if(!m)return blk;const it=items[+m[1]-2];if(!it)return blk;
  if(!it.cx)return blk;const y=cxnXml(blk,it,+m[1]);if(!y){stat.fail++;return blk;}stat.ok++;if(it.cx.a&&it.cx.b)stat.both++;else stat.one++;return y;});}
/* 群組修補：PptxGenJS 不支援群組；把同一元件的連續 <p:sp> 包進 <p:grpSp>（子座標＝原座標，可直接複製整組） */
function groupXml(x,slide){const G=(slide.groups||[]).filter(g=>g.to>g.from);if(!G.length)return x;
 const E=v=>Math.round(v*914400);const blocks=[];const re=/<p:(sp|cxnSp|graphicFrame)>[\s\S]*?<\/p:\1>/g;let m;
 while((m=re.exec(x))){const id=(m[0].match(/<p:cNvPr id="(\d+)"/)||[])[1];blocks.push({id:+id,s:m.index,e:m.index+m[0].length,tbl:m[1]==='graphicFrame'});}
 const byId={};blocks.forEach((b,i)=>byId[b.id]=i);
 const jobs=[];G.forEach((g,gi)=>{const i0=byId[g.from+2],i1=byId[g.to+2];if(i0==null||i1==null||i1-i0!==g.to-g.from)return;
  for(let k=i0;k<=i1;k++)if(blocks[k].id!==g.from+2+(k-i0)||blocks[k].tbl)return;jobs.push({g,gi,s:blocks[i0].s,e:blocks[i1].e});});
 jobs.sort((a,b)=>b.s-a.s).forEach(j=>{const g=j.g;const nm=stripCtl(g.name||'元件').replace(/[<>&"]/g,'');
  const o=`<a:off x="${E(g.x)}" y="${E(g.y)}"/><a:ext cx="${E(g.w)}" cy="${E(g.h)}"/><a:chOff x="${E(g.x)}" y="${E(g.y)}"/><a:chExt cx="${E(g.w)}" cy="${E(g.h)}"/>`;
  x=x.slice(0,j.s)+`<p:grpSp><p:nvGrpSpPr><p:cNvPr id="${5000+j.gi}" name="${nm}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm>${o}</a:xfrm></p:grpSpPr>`+x.slice(j.s,j.e)+'</p:grpSp>'+x.slice(j.e);});
 return x;}
async function patchZip(zip,model){let n=0,svgN=0;const cst={ok:0,both:0,one:0,fail:0};
 for(let i=0;i<model.slides.length;i++){const f='ppt/slides/slide'+(i+1)+'.xml';const file=zip.file(f);if(!file)continue;const items=model.slides[i].items;
  let x=await file.async('string');
  {const tIdx=items.map((it,k)=>it.t==='tbl'?k:-1).filter(k=>k>=0);let ti=0;   // PptxGenJS 表格 id 與其他圖形重複 → 改成 index+2
   x=x.replace(/<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="\d+"/g,m0=>tIdx[ti]!=null?`<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${tIdx[ti++]+2}"`:m0);}
  x=x.replace(/<p:sp>[\s\S]*?<\/p:sp>/g,blk=>{const m=blk.match(/<p:cNvPr id="(\d+)"/);if(!m)return blk;const it=items[+m[1]-2];if(!it||!it.sh)return blk;
   n++;return blk.replace(/<a:effectLst>[\s\S]*?<\/a:effectLst>/,effectXml(it.sh));});
  /* 明確寫出「無填色／無框線」：PptxGenJS 省略 fill 元素時，LibreOffice 會把封閉的自訂圖形（圖示）填滿；PowerPoint 也以明確值最穩 */
  x=x.replace(/(<\/a:(?:prstGeom|custGeom)>)(<a:ln\b)/g,'$1<a:noFill/>$2').replace(/<a:ln><\/a:ln>/g,'<a:ln><a:noFill/></a:ln>');
  x=x.replace(/<p:sp>[\s\S]*?<\/p:sp>/g,blk=>{const m=blk.match(/<p:cNvPr id="(\d+)"/);if(!m)return blk;const it=items[+m[1]-2];if(!it||!it.mk)return blk;return mkXml(blk,it.mk);});
  x=x.replace(/<p:sp>[\s\S]*?<\/p:sp>/g,blk=>{const m=blk.match(/<p:cNvPr id="(\d+)"/);if(!m)return blk;const it=items[+m[1]-2];if(!it||!it.cap)return blk;   // 圖示：圓頭線端＋圓角轉折
   return blk.replace(/<a:ln\b([^>]*)>/,(m0,a)=>`<a:ln${a.replace(/\s+cap="[^"]*"/,'')} cap="rnd">`).replace(/(<a:prstDash val="[^"]*"\/>)(?!\s*<a:(?:round|bevel|miter))/,'$1<a:round/>');});
  const pics=items.map((it,k)=>it.t==='pic'&&it.svg?k:-1).filter(k=>k>=0);
  if(pics.length){const rf='ppt/slides/_rels/slide'+(i+1)+'.xml.rels';let rels=await zip.file(rf).async('string');
   pics.forEach(k=>{const rid='rIdSvg'+k,nm='image-svg-'+(i+1)+'-'+k+'.svg';zip.file('ppt/media/'+nm,items[k].svg);svgN++;
    rels=rels.replace('</Relationships>',`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${nm}"/></Relationships>`);
    x=x.replace(/<p:pic>[\s\S]*?<\/p:pic>/g,blk=>{if(!new RegExp(`<p:cNvPr id="${k+2}"`).test(blk))return blk;
     return blk.replace(/<a:blip r:embed="(rId\d+)"\s*(?:\/>|>\s*<\/a:blip>)/,(m0,r)=>`<a:blip r:embed="${r}"><a:extLst><a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}"><asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="${rid}"/></a:ext></a:extLst></a:blip>`);});});
   zip.file(rf,rels);}
  x=x.replace(/<p:sp>[\s\S]*?<\/p:sp>/g,blk=>{const m=blk.match(/<p:cNvPr id="(\d+)"/);if(!m)return blk;const it=items[+m[1]-2];if(!it||!it.sites)return blk;
   const E=v=>Math.round(v*914400);return blk.replace(/<a:cxnLst>\s*<\/a:cxnLst>|<a:cxnLst\s*\/>/,'<a:cxnLst>'+it.sites.map(q=>`<a:cxn ang="${Math.round(((q[2]%360)+360)%360*60000)}"><a:pos x="${E(q[0])}" y="${E(q[1])}"/></a:cxn>`).join('')+'</a:cxnLst>');});
  x=connectXml(x,model.slides[i],cst);
  x=groupXml(x,model.slides[i]);
  zip.file(f,x);}
 model.connectors=cst;model.svgPics=svgN;
 if(svgN){const cf=zip.file('[Content_Types].xml');let x=await cf.async('string');if(!/Extension="svg"/i.test(x))x=x.replace(/(<Types\b[^>]*>)/,'$1<Default Extension="svg" ContentType="image/svg+xml"/>');zip.file('[Content_Types].xml',x);}
 await fixOoxml(zip);
 await fontFix(zip,model);
 return n;}
/* 繁中字型／語言（Windows PowerPoint 實際使用時的關鍵；LibreOffice 預覽看不出來）：
   1) <a:ea> 永遠是中文字型（Arial／Georgia 這類只有拉丁字的字型 → 改用內文字型），charset -122（簡中 GB2312）→ -120（繁中 Big5）
   2) lang="en-US" → lang="zh-TW" altLang="en-US"：中文不再出現拼字紅線、標點／斷行依繁中規則
   3) 段落結尾的 endParaRPr 沿用最後一個 run 的字級／字型／顏色：清空後重打字、或在空白表格儲存格打字，格式與旁邊一致
   4) 佈景主題字型：標題／內文的 latin＋ea＋Hant 都設成本風格字型 → 在 PowerPoint 新增文字方塊時預設就是同一套字（不是 Calibri／新細明體） */
const CJK_FACE=/^(Microsoft JhengHei( Light)?|PMingLiU|Noto Sans TC|Noto Serif TC|微軟正黑體|新細明體|標楷體|DFKai-SB)$/;
function cjkFaces(p){p=p||BASE;const b=CJK_FACE.test(p.bFont)?p.bFont:'Microsoft JhengHei';const t=CJK_FACE.test(p.tFont)?p.tFont:b;return{body:b,title:t};}
function fontFixXml(x,cjk){
 x=x.replace(/<a:ea typeface="([^"]*)"([^>]*)\/>/g,(m,face,rest)=>`<a:ea typeface="${CJK_FACE.test(face)?face:cjk}"${/charset=/.test(rest)?rest.replace(/charset="-?\d+"/,'charset="-120"'):rest}/>`);
 x=x.replace(/<a:(rPr|endParaRPr|defRPr) lang="en-US"(?! altLang)/g,'<a:$1 lang="zh-TW" altLang="en-US"');
 x=x.replace(/<a:p>([\s\S]*?)<\/a:p>/g,(all,inner)=>{if(!/<a:endParaRPr\b/.test(inner))return all;const runs=[...inner.matchAll(/<a:rPr ([^>]*)>([\s\S]*?)<\/a:rPr>/g)];if(!runs.length)return all;const last=runs[runs.length-1];
  const attrs=last[1].replace(/\s*dirty="0"/,'').replace(/\s*err="1"/,'');
  return '<a:p>'+inner.replace(/<a:endParaRPr\b[^>]*\/>|<a:endParaRPr\b[^>]*>[\s\S]*?<\/a:endParaRPr>/,`<a:endParaRPr ${attrs} dirty="0">${last[2]}</a:endParaRPr>`)+'</a:p>';});
 return x;}
// 空白表格儲存格：PptxGenJS 只寫 <a:endParaRPr lang sz/>（沒有字型、顏色）→ 補上與該格相同的字級／字型／顏色
function emptyCellRPr(c,cjk){const f=c.font||cjk,ea=CJK_FACE.test(f)?f:cjk;
 return `<a:endParaRPr lang="zh-TW" altLang="en-US" sz="${Math.round((c.size||10)*100)}"${c.bold?' b="1"':''} dirty="0"><a:solidFill><a:srgbClr val="${c.color||'3A3A3A'}"/></a:solidFill><a:latin typeface="${f}" charset="0"/><a:ea typeface="${ea}" charset="-120"/><a:cs typeface="${f}" charset="0"/></a:endParaRPr>`;}
async function fontFix(zip,model){const F=cjkFaces(model&&model.params),cjk=F.body;
 const files=Object.keys(zip.files).filter(f=>/^ppt\/(slides|slideLayouts|slideMasters|notesSlides|notesMasters)\/[^/]+\.xml$/.test(f));
 for(const f of files){let x=await zip.file(f).async('string');
  const m=f.match(/^ppt\/slides\/slide(\d+)\.xml$/);
  if(m&&model&&model.slides[+m[1]-1]){const tbls=model.slides[+m[1]-1].items.filter(it=>it.t==='tbl');let ti=0;
   x=x.replace(/<a:tbl>[\s\S]*?<\/a:tbl>/g,tx=>{const tb=tbls[ti++];if(!tb)return tx;const flat=[].concat(...tb.cells);let ci=0;
    return tx.replace(/<a:tc>[\s\S]*?<\/a:tc>/g,tc=>{const c=flat[ci++];if(!c||/<a:r>/.test(tc))return tc;
     const r0=(c.runs&&c.runs[0]&&c.runs[0].o)||{};return tc.replace(/<a:endParaRPr\b[^>]*\/>/,emptyCellRPr({size:r0.size||c.size,font:r0.font||c.font,color:r0.color||c.color,bold:r0.bold},cjk));});});}
  const y=fontFixXml(x,cjk);if(y!==x)zip.file(f,y);}
 const tf=zip.file('ppt/theme/theme1.xml');if(tf){let t=await tf.async('string');
  t=t.replace(/<a:majorFont><a:latin typeface="[^"]*"( panose="[^"]*")?\/><a:ea typeface="[^"]*"\/>/,`<a:majorFont><a:latin typeface="${F.title}"/><a:ea typeface="${F.title}"/>`)
   .replace(/<a:minorFont><a:latin typeface="[^"]*"( panose="[^"]*")?\/><a:ea typeface="[^"]*"\/>/,`<a:minorFont><a:latin typeface="${cjk}"/><a:ea typeface="${cjk}"/>`);
  let k=0;t=t.replace(/<a:font script="Hant" typeface="[^"]*"\/>/g,()=>`<a:font script="Hant" typeface="${k++===0?F.title:cjk}"/>`);
  zip.file('ppt/theme/theme1.xml',t);}
 const pf=zip.file('ppt/presentation.xml');if(pf){const x=await pf.async('string');const y=x.replace(/<a:defRPr lang="en-US"(?! altLang)/g,'<a:defRPr lang="zh-TW" altLang="en-US"');if(y!==x)zip.file('ppt/presentation.xml',y);}}
/* OOXML 結構修正（PptxGenJS 3.12 已知缺陷；不修的話嚴格驗證不過，部分 PowerPoint 版本可能拒開）：
   1) 多段 run 的段落會重複輸出 <a:pPr>（只允許一個且須在最前）→ 移除後續的
   2) presentation.xml 的 notesMasterIdLst 位置錯（須緊接 sldMasterIdLst 之後）
   3) [Content_Types].xml 宣告了不存在的 slideMaster2..N → 移除 */
function fixParas(x){return x.replace(/<a:p>([\s\S]*?)<\/a:p>/g,(all,inner)=>{let first=true;
  const out=inner.replace(/<a:pPr\b[^>]*?\/>|<a:pPr\b[^>]*>[\s\S]*?<\/a:pPr>/g,(m,off)=>{if(first&&off===0){first=false;return m;}first=false;return '';});
  return '<a:p>'+out+'</a:p>';});}
async function fixOoxml(zip){
 for(const f of Object.keys(zip.files).filter(f=>/^ppt\/(slides|slideLayouts|slideMasters|notesSlides|notesMasters)\/[^/]+\.xml$/.test(f))){
  const x=await zip.file(f).async('string');const y=fixParas(x);if(y!==x)zip.file(f,y);}
 const pf=zip.file('ppt/presentation.xml');if(pf){let x=await pf.async('string');const m=x.match(/<p:notesMasterIdLst>[\s\S]*?<\/p:notesMasterIdLst>/);
  if(m){x=x.replace(m[0],'');x=x.replace('</p:sldMasterIdLst>','</p:sldMasterIdLst>'+m[0]);zip.file('ppt/presentation.xml',x);}}
 // PowerPoint 實機修復證據：PptxGenJS 的備忘稿母片與投影片母片共用 theme1.xml → 「已修復…已移除內容」，修復後拆成 theme2.xml。
 // 每個母片要有自己的佈景主題 part。
 const nmr=zip.file('ppt/notesMasters/_rels/notesMaster1.xml.rels');let addTheme2=false;
 if(nmr){const r=await nmr.async('string');if(/Target="\.\.\/theme\/theme1\.xml"/.test(r)&&!zip.file('ppt/theme/theme2.xml')){
  zip.file('ppt/theme/theme2.xml',await zip.file('ppt/theme/theme1.xml').async('string'));zip.file('ppt/notesMasters/_rels/notesMaster1.xml.rels',r.replace('../theme/theme1.xml','../theme/theme2.xml'));addTheme2=true;}}
 // 備忘稿裡的空白 run（<a:r><a:rPr …/><a:t/></a:r>）PowerPoint 存檔時會刪掉，先拿掉
 for(const f of Object.keys(zip.files).filter(n=>/^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n))){const x=await zip.file(f).async('string');const y=x.replace(/<a:r><a:rPr[^>]*\/><a:t\s*\/><\/a:r>|<a:r><a:rPr[^>]*\/><a:t><\/a:t><\/a:r>/g,'');if(y!==x)zip.file(f,y);}
 const cf=zip.file('[Content_Types].xml');if(cf){let x=await cf.async('string');
  x=x.replace(/<Override PartName="\/([^"]+)"[^>]*\/>/g,(m,part)=>zip.file(part)?m:'');
  if(addTheme2&&!/theme2\.xml/.test(x))x=x.replace('</Types>','<Override PartName="/ppt/theme/theme2.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/></Types>');zip.file('[Content_Types].xml',x);}}
async function addFwNotes(zip,model){const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));let n=0;
 for(let i=0;i<model.slides.length;i++){const nt=fwNotes(model.slides[i]);if(!nt)continue;const f='ppt/notesSlides/notesSlide'+(i+1)+'.xml';const z=zip.file(f);if(!z)continue;let x=await z.async('string');
  const ps=nt.split('\n').map(l=>l?`<a:p><a:r><a:rPr lang="zh-TW" altLang="en-US" sz="1200"${/^【/.test(l)?' b="1"':''} dirty="0"/><a:t>${esc(l)}</a:t></a:r></a:p>`:'<a:p><a:endParaRPr lang="zh-TW" altLang="en-US" sz="1200" dirty="0"/></a:p>').join('');
  const y=x.replace(/(<p:ph type="body" idx="1"\/><\/p:nvPr><\/p:nvSpPr><p:spPr\/><p:txBody><a:bodyPr\/><a:lstStyle\/>)[\s\S]*?(<\/p:txBody>)/,(m,a,b)=>a+ps+b);if(y!==x){zip.file(f,y);n++;}}
 return n;}
async function exportPptx(env,params,opt){opt=opt||{};
 // The default/CLI export remains the standard 16:9 collection. Long catalogue
 // pages are explicit only:[...] exports, as are the separate four-page UI button.
 const only=opt.only||(!opt.model&&!opt.table?SLIDES.map(e=>e[0]).filter(k=>!SCHEME_CATALOGUE_KEYS.includes(k)&&!(opt.examples===false&&/^ex\d/.test(k))):undefined);
 const model=opt.model||buildModel(params,{only,examples:opt.examples,labels:opt.labels,table:opt.table});
 assertTableExportComplete(model);
 const pptx=new env.PptxGenJS();toPptx(pptx,model);
 const buf=await pptx.write({outputType:'arraybuffer'});const zip=await env.JSZip.loadAsync(buf);const patched=await patchZip(zip,model);
 await addFwNotes(zip,model);
 // 重新打包成像 PowerPoint 存出的 zip：[Content_Types].xml 第一個、不含資料夾項目（空的 charts/、media/ 等）
 const out=new env.JSZip();const names=Object.keys(zip.files).filter(n=>!zip.files[n].dir).sort((x,y)=>(y==='[Content_Types].xml')-(x==='[Content_Types].xml')||(y==='_rels/.rels')-(x==='_rels/.rels'));
 for(const n of names)out.file(n,await zip.file(n).async('uint8array'),{createFolders:false,date:new Date(Date.UTC(2026,0,1))});
 const data=await out.generateAsync({type:opt.type||'blob',compression:'DEFLATE',compressionOptions:{level:6},mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation'});
 return{data,model,patched};}

/* ---------- v9：文字自動縮小（模擬 PowerPoint normAutofit，預覽與匯出一致）＋改字（不重排版面） ---------- */
function textOf(it){return(it.runs||[]).map(r=>r.t+(r.o.br?'\n':'')).join('');}
function autoShrink(it){if(!it.runs||!it.runs.length||it.t!=='sp')return 1;const T=it.tx||{};const m=Array.isArray(T.margin)?T.margin:[T.margin||0,T.margin||0,T.margin||0,T.margin||0];
 const inner=it.kind==='diamond'?.62:it.kind==='parallelogram'?.8:1;const aw=it.w*inner-(m[0]+m[1])/72,ah=it.h-(m[2]+m[3])/72;if(aw<=.05||ah<=.05)return 1;
 const paras=[[]];it.runs.forEach(r=>{paras[paras.length-1].push(r);if(r.o.br)paras.push([]);});
 const need=k=>{let hh=0;paras.forEach(p=>{if(!p.length)return;const pw=p.reduce((a,r)=>a+tw(r.t,r.o.size*k),0),ms=Math.max(...p.map(r=>r.o.size*k));hh+=Math.max(1,Math.ceil(pw/aw-.02))*ms*(T.lsp||1)*1.2/72;});return hh;};

 let k=1;while(k>.6&&need(k)>ah+.02)k-=.05;if(k>=1)return 1;
 it.runs.forEach(r=>{r.o.size=Math.max(6,Math.round(r.o.size*k*2)/2);});if(it.tx)it.tx.size=Math.max(6,Math.round(it.tx.size*k*2)/2);it.shrunk=Math.round(k*100)/100;return k;}
/* labels：{ '<頁>:<群組>': { '<群組內第幾個圖形>': {from:'原文', to:'新文字'} } }；原文對不上（數量改了、版本變了）就略過。
   換行＝新段落；第 j 段沿用原本第 j 段第一個字串的格式（例如「問題」大字粗體＋英文小字＋內文）。不重排版面：放不下時字級自動縮小（最多到 60%）。 */
function applyLabels(sl,labels){if(!labels||typeof labels!=='object')return 0;let n=0;
 Object.keys(labels).forEach(key=>{const [k,gs]=key.split(':');if(k!==sl.key&&k+'-'+gs!==sl.key)return;const g=k===sl.key?sl.groups[+gs]:sl.groups[0];if(!g)return;const L=labels[key]||{};if(L._iconStyle)applyIconComponentStyle(sl,g,L._iconStyle);
  Object.keys(L).forEach(ix=>{const it=sl.items[g.from+(+ix)];const o=L[ix]||{};if(!it||g.from+(+ix)>g.to)return;
   if(o.icon!=null){if(it.ic&&ICONS&&Object.prototype.hasOwnProperty.call(ICONS.BY,o.icon)&&(o.from==null||o.from===it.ic.id)){const q=ICONS.geom(it.ic.variant,it.ic.wt);it.points=ICONS.points(o.icon,it.w,q.k,q.off,q.wt);it.ic=Object.assign({},it.ic,{id:o.icon});it.name='圖示 '+ICONS.BY[o.icon].zh;it.edited=1;n++;}return;}
   if(!it.runs)return;if(o.from!=null&&textOf(it)!==o.from)return;
   if(o.mk!=null){if(o.mk&&!it.mk)it.mk={c:sl.mkC||'BDD7EE',a:.55,b:.92};else if(!o.mk)delete it.mk;if(it.mk&&!it.tx.size0){it.tx.size0=1;const s=Math.max(...it.runs.map(r=>r.o.size));it.y+=(it.h-s*1.3/72)/2;it.h=s*1.3/72;}it.edited=1;n++;}
   if(o.to==null||o.to===textOf(it)){if(it.mk)mkFit(it);return;}
   const to=stripCtl(o.to==null?'':o.to).slice(0,400);const paras=[[]];it.runs.forEach(r=>{paras[paras.length-1].push(r);if(r.o.br)paras.push([]);});
   const lines=to.split('\n');if(keepNums(it,lines,paras)){it.edited=1;if(it.mk)mkFit(it);else autoShrink(it);n++;return;}it.runs=lines.map((t,j)=>{const src=(paras[Math.min(j,paras.length-1)][0]||it.runs[0]).o;const ro=Object.assign({},src);delete ro.br;if(j<lines.length-1)ro.br=true;return{t,o:ro};});
   it.edited=1;if(it.mk)mkFit(it);else autoShrink(it);n++;});});
 if(n)recalc(sl);return n;}
/* 半高螢光筆的方塊寬＝文字寬（不換行；PowerPoint 端由 spAutoFit 伸縮），每段一行 */
function mkFit(it){const paras=[[]];it.runs.forEach(r=>{paras[paras.length-1].push(r);if(r.o.br)paras.push([]);});const w=Math.max(...paras.map(p=>p.reduce((a,r)=>a+tw(r.t,r.o.size),0)))*1.06+.08;
 const T=it.tx||{};if(T.align==='center')it.x+=(it.w-w)/2;else if(T.align==='right')it.x+=it.w-w;it.w=w;const s=Math.max(...it.runs.map(r=>r.o.size));it.h=Math.max(it.h,paras.length*s*1.3/72);}
/* v11：只改數字（其餘字不變）→ 逐段把數字換進原本的字串，保留大數字／小單位的格式 */
const NUM_RE=/[-+−]?\d[\d,]*(?:\.\d+)?/g;
function keepNums(it,lines,paras){if(lines.length!==paras.length)return false;const sk=t=>t.replace(NUM_RE,'#');
 for(let j=0;j<lines.length;j++){const old=paras[j].map(r=>r.t).join('');if(sk(old)!==sk(lines[j])||!NUM_RE.test(old))return false;NUM_RE.lastIndex=0;}
 lines.forEach((ln,j)=>{const nums=ln.match(NUM_RE)||[];let k=0;paras[j].forEach(r=>{r.t=r.t.replace(NUM_RE,()=>nums[k++]);});});return true;}
/* v11：對比元件的倍數／增減徽章與長條長度，依兩邊數字自動重算（徽章本身被改過字就不動） */
function numOf(it){if(!it)return NaN;const m=textOf(it).replace(/,/g,'').replace('−','-').match(/-?\d+(?:\.\d+)?/);return m?+m[0]:NaN;}
const PIE=(r,f)=>{f=Math.max(0,Math.min(1,f));return[{x:r,y:r},{x:r,y:0},{x:0,y:0,curve:{type:'arc',hR:r,wR:r,stAng:270,swAng:Math.max(.01,Math.min(359.9,f*360))}},{close:true}];};
function recalc(sl){sl.items.forEach(it=>{const c=it.calc;if(!c||it.edited)return;
  if(c.m==='pbar'||c.m==='hb'||c.m==='dot'){const v=numOf(sl.items[c.a]);if(!isFinite(v))return;
   if(c.m==='pbar')it.w=Math.max(.02,c.full*Math.max(0,Math.min(1,v/100)));else if(c.m==='hb')it.points=PIE(it.w/2,v/100);else it.fill=c.k<=v?c.on:c.off;return;}const a=numOf(sl.items[c.a]),b=numOf(sl.items[c.b]);if(!(isFinite(a)&&isFinite(b)))return;
  if(c.m==='bar'){const mx=Math.max(Math.abs(a),Math.abs(b));if(mx>0)it.w=Math.max(it.h,c.full*Math.abs(c.side==='a'?a:b)/mx);return;}
  if(!it.runs||!it.runs.length||a===0)return;const r=b/a,d=(b-a)/Math.abs(a)*100,f=v=>String(Math.round(v*10)/10),p=v=>String(Math.round(Math.abs(v)));let t;
  if(c.m==='x')t=r>=1?'×'+f(r):(d>=0?'+':'−')+p(d)+'%';else if(c.m==='pct')t=(d>=0?'+':'−')+p(d)+'%';else if(c.m==='down')t=(d<=0?'↓':'↑')+p(d)+'%';else if(c.m==='arrow')t=(d>=0?'▲ +':'▼ −')+p(d)+'%';else return;
  it.runs=[{t,o:Object.assign({},it.runs[0].o,{br:undefined})}];delete it.runs[0].o.br;});}
/* ---------- v9：最小字級——單一元件／待選素材匯出時，若元件內最小的字小於設定值，整個元件（幾何＋字級）等比放大 ---------- */
function runSizes(items){const a=[];items.forEach(it=>{if(it.runs)it.runs.forEach(r=>{if(String(r.t).trim())a.push(r.o.size);});if(it.t==='tbl')it.cells.forEach(row=>row.forEach(c=>c.runs.forEach(r=>{if(String(r.t).trim())a.push(r.o.size);})));});return a;}
function minFontOf(items){const a=runSizes(items);return a.length?Math.min(...a):0;}
function medFontOf(items){const a=runSizes(items).sort((x,y)=>x-y);return a.length?a[Math.floor(a.length/2)]:0;}
function smallRuns(slide,lim){return runSizes(slide.items).filter(v=>v<(lim||10)).length;}
function fitMinFont(items,min,maxW,maxH){const m=minFontOf(items);if(!(min>0)||!m||m>=min-.01)return{k:1,min:m};const bb=bboxOf(items);
 let k=min/m;const cap=Math.min(maxW/bb.w,maxH/bb.h);const capped=k>cap;if(capped)k=Math.max(1,cap);
 if(k<=1.0001)return{k:1,min:m,capped};shiftItems(items,-bb.x,-bb.y);scaleSlide({items,groups:[]},k);shiftItems(items,bb.x,bb.y);return{k:Math.round(k*100)/100,min:minFontOf(items),capped};}
/* 單一元件：取出某頁某群組的圖形，置中到一張新投影片 */
function elementModel(params,key,gi,opt){opt=opt||{};let m=buildModel(params,{only:[key],labels:opt.labels});let sl=m.slides[0];let g=sl&&sl.groups[gi];
 if((!g||(opt.name&&g.name!==opt.name&&(g.full||'')!==opt.name))&&opt.name){/* v13 拆頁後舊的待選項目：依名稱在同系列子頁找 */const base=key.replace(/\d+$/,'');const ks=SLIDES.map(e=>e[0]).filter(k=>k===base||(k.startsWith(base)&&/^\d+$/.test(k.slice(base.length))));
  for(const k of ks){const mm=buildModel(params,{only:[k],labels:opt.labels});const s2=mm.slides[0];const j=s2.groups.findIndex(x=>x.name===opt.name||x.full===opt.name||String(x.name).startsWith(opt.name));if(j>=0){m=mm;sl=s2;g=s2.groups[j];gi=j;key=k;break;}}}
 if(!g)throw new Error('找不到元件 '+gi);
 const dx=(W-g.w)/2-g.x,dy=(H-g.h)/2-g.y;
 const n=g.to-g.from+1;const items=clone(sl.items.slice(g.from,g.to+1)).map(it=>{if(it.t==='ln'){it.x1+=dx;it.x2+=dx;it.y1+=dy;it.y2+=dy;}else{it.x+=dx;it.y+=dy;}
  if(it.cx){['a','b'].forEach(k=>{if(!it.cx[k])return;const j=it.cx[k][0]-g.from;if(j<0||j>=n)delete it.cx[k];else it.cx[k]=[j,it.cx[k][1]];});}
  if(it.bgMatch)it.fill='FFFFFF';   // 單獨匯出＝白色投影片：遮線用的底色改白（不帶畫布灰）
  return it;});
 /* 最小字級（v9）：元件內最小字 < 設定值 → 整個元件等比放大（以投影片可容納為上限），再置中 */
 const mf=opt.minFont!=null?+opt.minFont:+(m.params.minFont||0);let fit={k:1,min:minFontOf(items)};
 if(mf>0){fit=fitMinFont(items,mf,W-.6,H-.6);if(fit.k!==1){const b2=bboxOf(items);shiftItems(items,(W-b2.w)/2-b2.x,(H-b2.h)/2-b2.y);}}
 const gb=bboxOf(items);
 return{slides:[{key:key+'-'+gi,title:g.name,no:1,items,groups:[Object.assign({},g,{from:0,to:items.length-1},gb)]}],warns:[],params:m.params,element:Object.assign({},g,{scale:fit.k,minSize:fit.min,capped:!!fit.capped})};}
async function exportElement(env,params,key,gi,opt){const model=elementModel(params,key,gi,opt);return exportPptx(env,params,Object.assign({},opt||{},{model}));}

/* ================= SVG 預覽（與匯出共用同一份 model） ================= */
const FONT_STACK={'Microsoft JhengHei':"'Microsoft JhengHei','微軟正黑體','Noto Sans CJK TC','Noto Sans TC','PingFang TC',sans-serif",
 'Microsoft JhengHei Light':"'Microsoft JhengHei Light','Microsoft JhengHei','Noto Sans CJK TC','Noto Sans TC',sans-serif",
 'PMingLiU':"PMingLiU,'新細明體','Noto Serif CJK TC','Noto Serif TC',serif",'Noto Sans TC':"'Noto Sans TC','Noto Sans CJK TC','Microsoft JhengHei',sans-serif",
 'Arial':"Arial,'Noto Sans CJK TC','Microsoft JhengHei',sans-serif",'Georgia':"Georgia,'Noto Serif CJK TC',serif"};
const fstack=f=>FONT_STACK[f]||`'${f}',sans-serif`;
const fweight=(f,b)=>b?700:(/Light/.test(f)?300:400);
let _ctx=null;const _wc={};
function measure(t,size,font,bold){
 if(typeof document==='undefined')return tw(t,size)*72;
 if(!_ctx)_ctx=document.createElement('canvas').getContext('2d');
 const key=font+'|'+(bold?1:0);_ctx.font=`${fweight(font,bold)} 100px ${fstack(font)}`;return _ctx.measureText(t).width*size/100;}
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function textRect(it){const w=it.w*PT,h=it.h*PT,a=(it.adj||0)*PT;
 switch(it.kind){case 'roundRect':return[a*.29,a*.29,w-a*.29,h-a*.29];case 'ellipse':return[w*.146,h*.146,w*.854,h*.854];
  case 'diamond':return[w/4,h/4,w*.75,h*.75];case 'chevron':return[a,0,w-a,h];case 'homePlate':return[0,0,w-a/2,h];
  case 'hexagon':return[a,0,w-a,h];case 'parallelogram':return[a*.55,0,w-a*.55,h];case 'can':return[0,a,w,h-a/2];default:return[0,0,w,h];}}
function layoutText(it){const T=it.tx;const m=Array.isArray(T.margin)?T.margin:[T.margin,T.margin,T.margin,T.margin];
 const r=textRect(it);const x0=it.x*PT+r[0]+m[0],x1=it.x*PT+r[2]-m[1],y0=it.y*PT+r[1]+m[3],y1=it.y*PT+r[3]-m[2];const avail=Math.max(4,x1-x0);
 const paras=[[]];it.runs.forEach(rn=>{paras[paras.length-1].push(rn);if(rn.o.br)paras.push([]);});
 const lines=[];
 paras.forEach(p=>{let line=[],lw=0,ms=Math.max(...p.map(r=>r.o.size),T.size);
  const flush=()=>{lines.push({runs:line,w:lw,size:ms});line=[];lw=0;};
  if(!p.length){lines.push({runs:[],w:0,size:T.size});return;}
  p.forEach(rn=>{const o=rn.o;const cs=(o.cs||0);
   const tokens=String(rn.t).match(/[A-Za-z0-9.,:;'’!?()\-\/+%#]+|\s+|./gu)||[];
   tokens.forEach(tok=>{const wv=measure(tok,o.size,o.font,o.bold)+cs*tok.length;
    if(lw+wv>avail+.5&&lw>0&&!/^\s+$/.test(tok)){flush();}
    if(!line.length&&/^\s+$/.test(tok)&&lines.length&&lw===0)return;
    const last=line[line.length-1];if(last&&last.o===o)last.t+=tok;else line.push({t:tok,o});lw+=wv;});});
  flush();});
 const lh=l=>l.size*1.2*(T.lsp||1);const total=lines.reduce((a,l)=>a+lh(l),0);
 let y=T.valign==='top'?y0:T.valign==='bottom'?y1-total:(y0+y1)/2-total/2;
 return lines.map(l=>{const top=y;y+=lh(l);const x=T.align==='center'?(x0+x1)/2-l.w/2:T.align==='right'?x1-l.w:x0;return{x,base:top+lh(l)/2+l.size*.36,runs:l.runs};});}
function svgShapePath(it){const x=it.x*PT,y=it.y*PT,w=it.w*PT,h=it.h*PT,R=x+w,B=y+h,cx=x+w/2,cy=y+h/2,a=(it.adj||0)*PT;
 const poly=pts=>'M'+pts.map(p=>p[0].toFixed(2)+','+p[1].toFixed(2)).join('L')+'Z';
 switch(it.kind){
  case 'rect':return poly([[x,y],[R,y],[R,B],[x,B]]);
  case 'roundRect':{const q=Math.min(a,w/2,h/2);return `M${x+q},${y}H${R-q}A${q},${q} 0 0 1 ${R},${y+q}V${B-q}A${q},${q} 0 0 1 ${R-q},${B}H${x+q}A${q},${q} 0 0 1 ${x},${B-q}V${y+q}A${q},${q} 0 0 1 ${x+q},${y}Z`;}
  case 'ellipse':return `M${x},${cy}A${w/2},${h/2} 0 1 0 ${R},${cy}A${w/2},${h/2} 0 1 0 ${x},${cy}Z`;
  case 'diamond':return poly([[cx,y],[R,cy],[cx,B],[x,cy]]);
  case 'chevron':{const d=Math.min(a,w);return poly([[x,y],[R-d,y],[R,cy],[R-d,B],[x,B],[x+d,cy]]);}
  case 'homePlate':{const d=Math.min(a,w);return poly([[x,y],[R-d,y],[R,cy],[R-d,B],[x,B]]);}
  case 'hexagon':{const d=Math.min(a,w/2);return poly([[x,cy],[x+d,y],[R-d,y],[R,cy],[R-d,B],[x+d,B]]);}
  case 'parallelogram':{const d=Math.min(a,w);return poly([[x,B],[x+d,y],[R,y],[R-d,B]]);}
  case 'can':{const e=a/2;return `M${x},${y+e}A${w/2},${e} 0 0 1 ${R},${y+e}V${B-e}A${w/2},${e} 0 0 1 ${x},${B-e}Z`;}
  case 'custGeom':{let d='',px=0,py=0;const X=v=>(x+v*PT),Y=v=>(y+v*PT);
   it.points.forEach((p,i)=>{if(p.close){d+='Z';return;}
    if(p.curve&&p.curve.type==='cubic'){d+=`C${X(p.curve.x1)},${Y(p.curve.y1)} ${X(p.curve.x2)},${Y(p.curve.y2)} ${X(p.x)},${Y(p.y)}`;}
    else if(p.curve&&p.curve.type==='arc'){const c=p.curve;const st=c.stAng*Math.PI/180,sw=c.swAng*Math.PI/180;const ccx=px-c.wR*Math.cos(st),ccy=py-c.hR*Math.sin(st);
     const ex=ccx+c.wR*Math.cos(st+sw),ey=ccy+c.hR*Math.sin(st+sw);d+=`A${c.wR*PT},${c.hR*PT} 0 ${Math.abs(c.swAng)>180?1:0} ${sw>0?1:0} ${X(ex)},${Y(ey)}`;px=ex;py=ey;return;}
    else d+=(i===0||p.moveTo?'M':'L')+X(p.x)+','+Y(p.y);px=p.x;py=p.y;});return d;}}
 return '';}
function dashArr(d,w){w=Math.max(w,.5);return{sysDot:`${w},${w}`,sysDash:`${3*w},${w}`,dash:`${4*w},${3*w}`,lgDash:`${8*w},${3*w}`}[d]||'';}
/* 平面箭頭（給剪貼簿 SVG 用：Office 對 <marker> 支援不穩，改畫成實體三角形） */
function headShape(tx,ty,fx,fy,type,sz,color,w){const f={sm:2,med:3,lg:5}[sz]||3,k=f*Math.max(w,.5)/10;const ang=Math.atan2(ty-fy,tx-fx);
 const T=(px,py)=>{const X=(px-10)*k,Y=(py-5)*k;return[(tx+X*Math.cos(ang)-Y*Math.sin(ang)).toFixed(2),(ty+X*Math.sin(ang)+Y*Math.cos(ang)).toFixed(2)];};
 const P=pts=>pts.map(p=>T(p[0],p[1]).join(',')).join(' ');
 switch(type){case 'triangle':return `<polygon points="${P([[0,0],[10,5],[0,10]])}" fill="#${color}"/>`;
  case 'stealth':return `<polygon points="${P([[0,0],[10,5],[0,10],[3,5]])}" fill="#${color}"/>`;
  case 'arrow':return `<polyline points="${P([[1,1],[9,5],[1,9]])}" fill="none" stroke="#${color}" stroke-width="${(1.6*k).toFixed(2)}"/>`;
  case 'oval':{const c=T(5,5);return `<circle cx="${c[0]}" cy="${c[1]}" r="${(4.2*k).toFixed(2)}" fill="#${color}"/>`;}
  default:return '';}}
// One physical grid edge must have one paint across SVG, native PPTX and HTML.
// Mirror only in this read-only renderer projection: source mark ownership and
// unselected cell appearance stay untouched. Lines overlay fill/semantic borders;
// chronology resolves only competing line edges. Legacy fill-only XML is unchanged.
function tableResolvedBorders(table){if(!table.cells.some(row=>row.some(c=>(c.highlightEdges||[]).length)))return table.cells;
 const cells=table.cells.map(row=>row.map(c=>Object.assign({},c,{highlightEdges:[...(c.highlightEdges||[])]})));
 const resolve=(a,ae,b,be)=>{if(!a.highlightEdges.includes(ae)&&!b.highlightEdges.includes(be))return;
  const order=(c,e)=>c.highlightOrder&&c.highlightOrder[e]!=null?c.highlightOrder[e]:-1;
  const border=order(a,ae)>=order(b,be)?a[ae]:b[be];a[ae]=border;b[be]=border;if(!a.highlightEdges.includes(ae))a.highlightEdges.push(ae);if(!b.highlightEdges.includes(be))b.highlightEdges.push(be);
 };
 cells.forEach((row,r)=>row.forEach((c,k)=>{if(k+1<row.length)resolve(c,'bR',row[k+1],'bL');if(r+1<cells.length)resolve(c,'bB',cells[r+1][k],'bT');}));return cells;
}
/* 表格 → 預覽用的儲存格矩形＋框線（pptx 端是原生 <a:tbl>） */
function tblItems(it){const out=[],lines=[],highlights=[];let yy=it.y;
 tableResolvedBorders(it).forEach((r,ri)=>{let xx=it.x;const rh=it.rowH[ri];
  r.forEach((c,ci)=>{const cw=it.colW[ci];
   out.push({t:'sp',kind:'rect',x:xx,y:yy,w:cw,h:rh,fill:c.fill,line:null,lw:0,runs:c.runs,tx:{align:c.align,valign:'middle',margin:[c.mL,c.mR!=null?c.mR:c.mL,c.mT,c.mT],lsp:1,size:c.size,font:F0(c),color:c.color,bold:c.bold}});
   const edgeLines=edge=>(c.highlightEdges||[]).includes(edge)?highlights:lines;
   if(c.bT)edgeLines('bT').push({t:'ln',x1:xx,y1:yy,x2:xx+cw,y2:yy,color:c.bT.c,w:c.bT.w,dash:'solid'});
   if(c.bB)edgeLines('bB').push({t:'ln',x1:xx,y1:yy+rh,x2:xx+cw,y2:yy+rh,color:c.bB.c,w:c.bB.w,dash:'solid'});
   if(c.bL)edgeLines('bL').push({t:'ln',x1:xx,y1:yy,x2:xx,y2:yy+rh,color:c.bL.c,w:c.bL.w,dash:'solid'});
   if(c.bR)edgeLines('bR').push({t:'ln',x1:xx+cw,y1:yy,x2:xx+cw,y2:yy+rh,color:c.bR.c,w:c.bR.w,dash:'solid'});xx+=cw;});yy+=rh;});
 return out.concat(lines,highlights);}
const F0=c=>(c.runs[0]&&c.runs[0].o.font)||'Microsoft JhengHei';
function toSvg(slide,opt){opt=opt||{};const id=(opt.id||'s')+'_';const defs={},parts=[];let fi=0,mi=0;const flat=!!opt.flat;
 const marker=(type,sz,color)=>{const k='m'+type+sz+color;if(defs[k])return defs[k].id;const mid=id+'m'+(mi++);const f={sm:2,med:3,lg:5}[sz]||3;
  const shp={triangle:`<path d="M0,0L10,5L0,10Z" fill="#${color}"/>`,arrow:`<path d="M1,1L9,5L1,9" fill="none" stroke="#${color}" stroke-width="1.6"/>`,stealth:`<path d="M0,0L10,5L0,10L3,5Z" fill="#${color}"/>`,oval:`<circle cx="5" cy="5" r="4.2" fill="#${color}"/>`,diamond:`<path d="M5,0L10,5L5,10L0,5Z" fill="#${color}"/>`}[type]||'';
  defs[k]={id:mid,xml:`<marker id="${mid}" viewBox="0 0 10 10" refX="${type==='oval'||type==='diamond'?5:9}" refY="5" markerWidth="${f}" markerHeight="${f}" orient="auto-start-reverse" markerUnits="strokeWidth">${shp}</marker>`};return mid;};
 const filt=(sh,size)=>{const dil=((sh.scale||1)-1)*size/2;const k='f'+[sh.blur,sh.dist,sh.dir,sh.alpha,dil.toFixed(1)].join('_');if(defs[k])return defs[k].id;const fid=id+'f'+(fi++);
  const dx=sh.dist*Math.cos(sh.dir*Math.PI/180),dy=sh.dist*Math.sin(sh.dir*Math.PI/180);
  defs[k]={id:fid,xml:`<filter id="${fid}" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB">${dil>.05?`<feMorphology in="SourceAlpha" operator="dilate" radius="${dil.toFixed(2)}" result="d"/>`:''}<feGaussianBlur in="${dil>.05?'d':'SourceAlpha'}" stdDeviation="${(sh.blur/2).toFixed(2)}"/><feOffset dx="${dx.toFixed(2)}" dy="${dy.toFixed(2)}" result="o"/><feFlood flood-color="#${sh.color}" flood-opacity="${sh.alpha}"/><feComposite in2="o" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`};return fid;};
 const mk=(head,tail,hs,c)=>flat?'':`${head?` marker-end="url(#${marker(head,hs,c)})"`:''}${tail?` marker-start="url(#${marker(tail,hs,c)})"`:''}`;
 function one(it){const body=[];
  if(it.t==='pic'){const im=`<image x="${it.x*PT}" y="${it.y*PT}" width="${it.w*PT}" height="${it.h*PT}" href="${it.png}"`;if(it.round){const cid='rc'+Math.round(it.x*1e3)+'_'+Math.round(it.y*1e3);return `<clipPath id="${cid}"><ellipse cx="${(it.x+it.w/2)*PT}" cy="${(it.y+it.h/2)*PT}" rx="${it.w/2*PT}" ry="${it.h/2*PT}"/></clipPath>${im} clip-path="url(#${cid})"/>`;}return im+'/>';}
  if(it.t==='ln'){const x1=it.x1*PT,y1=it.y1*PT,x2=it.x2*PT,y2=it.y2*PT;
   body.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#${it.color}" stroke-width="${it.w}" fill="none"${it.dash&&it.dash!=='solid'?` stroke-dasharray="${dashArr(it.dash,it.w)}"`:''}${mk(it.head,it.tail,it.hs,it.color)}/>`);
   if(flat){if(it.head)body.push(headShape(x2,y2,x1,y1,it.head,it.hs,it.color,it.w));if(it.tail)body.push(headShape(x1,y1,x2,y2,it.tail,it.hs,it.color,it.w));}
   return body.join('');}
  if(it.kind){const d=svgShapePath(it);const f=it.sh&&!flat?` filter="url(#${filt(it.sh,Math.min(it.w,it.h)*PT)})"`:'';
   const fill=it.fill?`fill="#${it.fill}"${it.ft?` fill-opacity="${(1-it.ft/100).toFixed(3)}"`:''}`:'fill="none"';
   const stroke=it.line?` stroke="#${it.line}" stroke-width="${it.lw}"${it.dash&&it.dash!=='solid'?` stroke-dasharray="${dashArr(it.dash,it.lw)}"`:''}${mk(it.head,it.tail,it.hs,it.line)}`:'';
   body.push(`<path d="${d}" ${fill}${stroke}${f} ${it.cap?'stroke-linecap="round" stroke-linejoin="round"':'stroke-linejoin="miter"'}/>`);
   if(flat&&it.line&&(it.head||it.tail)&&it.points){const X=v=>(it.x+v)*PT,Y=v=>(it.y+v)*PT;const pts=it.points.filter(q=>!q.close);
    if(it.head){const L=pts[pts.length-1],Q=L.curve&&L.curve.type==='cubic'?{x:L.curve.x2,y:L.curve.y2}:pts[pts.length-2];body.push(headShape(X(L.x),Y(L.y),X(Q.x),Y(Q.y),it.head,it.hs,it.line,it.lw));}
    if(it.tail){const F=pts[0],Q=pts[1].curve&&pts[1].curve.type==='cubic'?{x:pts[1].curve.x1,y:pts[1].curve.y1}:pts[1];body.push(headShape(X(F.x),Y(F.y),X(Q.x),Y(Q.y),it.tail,it.hs,it.line,it.lw));}}
   if(it.kind==='can'){const x=it.x*PT,y=it.y*PT,w=it.w*PT,e=(it.adj||0)*PT/2;body.push(`<ellipse cx="${x+w/2}" cy="${y+e}" rx="${w/2}" ry="${e}" fill="${it.fill?'#'+mix(it.fill,'FFFFFF',.25):'none'}"${it.line?` stroke="#${it.line}" stroke-width="${it.lw}"`:''}/>`);}}
  if(it.mk&&it.runs)body.push(`<rect class="mk" x="${(it.x*PT).toFixed(2)}" y="${((it.y+it.h*it.mk.a)*PT).toFixed(2)}" width="${(it.w*PT).toFixed(2)}" height="${(it.h*(it.mk.b-it.mk.a)*PT).toFixed(2)}" fill="#${it.mk.c}"/>`);
  if(it.runs){layoutText(it).forEach(l=>{if(!l.runs.length)return;
   if(l.runs.some(r=>r.o.hl)){let xx=l.x;l.runs.forEach(r=>{const w=measure(r.t,r.o.size,r.o.font,r.o.bold)+(r.o.cs||0)*r.t.length;if(r.o.hl)body.push(`<rect x="${(xx-1).toFixed(2)}" y="${(l.base-r.o.size*.95).toFixed(2)}" width="${(w+2).toFixed(2)}" height="${(r.o.size*1.25).toFixed(2)}" fill="#${r.o.hl}"/>`);xx+=w;});}
   body.push(`<text x="${l.x.toFixed(2)}" y="${l.base.toFixed(2)}" xml:space="preserve">${l.runs.map(r=>`<tspan font-family="${esc(flat?(r.o.font+', '+fstack(r.o.font)).replace(/'/g,''):fstack(r.o.font))}" font-size="${r.o.size}" font-weight="${fweight(r.o.font,r.o.bold)}" fill="#${r.o.color}"${r.o.cs?` letter-spacing="${r.o.cs}"`:''}${r.o.strike||r.o.u?` text-decoration="${r.o.strike?'line-through':'underline'}"`:''}>${esc(r.t)}</tspan>`).join('')}</text>`);});}
  return body.join('');}
 slide.items.forEach((it,idx)=>{parts[idx]=it.t==='tbl'?tblItems(it).map(one).join(''):one(it);});
 /* 互動模式：每個群組包成 <g class="el">，最上層加一個透明命中框 */
 let out=parts;
 if(opt.interactive&&slide.groups&&slide.groups.length){out=parts.slice();const pad=4;
  slide.groups.forEach((g,gi)=>{const x=g.x*PT-pad,y=g.y*PT-pad,w=g.w*PT+2*pad,h=g.h*PT+2*pad;
   out[g.from]=`<g class="el" data-g="${gi}" data-name="${esc(g.iconStyle?iconComponentName(g.iconStyle):g.name)}">`+out[g.from];
   out[g.to]=out[g.to]+`<rect class="hit" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="4"/></g>`;});}
 const vb=opt.viewBox||`0 0 ${(slide.w||slide.W||W)*PT} ${(slide.h||slide.H||H)*PT}`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${opt.attrs||''}><defs>${Object.values(defs).map(d=>d.xml).join('')}</defs>${opt.bg===false?'':'<rect width="100%" height="100%" fill="#FFFFFF"/>'}${out.join('')}</svg>`;}
/* 單一元件 SVG：只取群組內的圖形，裁切到外框（含留白）；flat=剪貼簿相容版（無濾鏡、箭頭實體化、透明背景） */
function elementSvg(slide,gi,opt){opt=opt||{};const g=slide.groups[gi];const pad=(opt.pad!=null?opt.pad:6);
 const items=slide.items.slice(g.from,g.to+1);const hasSh=items.some(i=>i.sh);const m=pad+(hasSh&&!opt.flat?16:0);
 const x=g.x*PT-m,y=g.y*PT-m,w=g.w*PT+2*m,h=g.h*PT+2*m;
 const svg=toSvg({items},{id:opt.id||'e',flat:opt.flat,bg:opt.bg,viewBox:`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`,attrs:`width="${(w*(opt.scale||1)).toFixed(1)}pt" height="${(h*(opt.scale||1)).toFixed(1)}pt"`.replace(/pt"/g,opt.px?'"':'pt"')});
 return{svg,w,h,name:g.iconStyle?iconComponentName(g.iconStyle):g.name};}
/* ================= 待選素材（v6）：多個元件（各自保留加入當時的風格參數）排到同一張投影片 =================
   entries[i]={kind:'el'|'icon'|'table',params:{…完整風格…},key,gi | icon:{id,variant} | table:{rows,…},name}
   每項先用自己的 params 建 model（顏色、圓角、陰影、線寬、S/M/L 都已算進圖形）→ 依外框做「分列排版」，放不下就整體等比縮小 → 合併成一頁。 */
function shiftItems(items,dx,dy){items.forEach(it=>{if(it.t==='ln'){it.x1+=dx;it.x2+=dx;it.y1+=dy;it.y2+=dy;}else{it.x+=dx;it.y+=dy;}});}
// Each tray entry is a separate source document, even when two snapshots are identical.
function scopeTableDocuments(slides,prefix,documents){const ids=new Map(),seen=new Set();const rekey=info=>{if(info&&typeof info.documentId==='string'&&!seen.has(info)){seen.add(info);if(!ids.has(info.documentId))ids.set(info.documentId,prefix+info.documentId);info.documentId=ids.get(info.documentId);}};
 for(const sl of slides)[sl.table,...(sl.items||[]).filter(it=>it.t==='tbl').map(it=>it.dataIntegrity)].forEach(rekey);(documents||[]).forEach(rekey);return slides;}
function nativeTableDocuments(items){return(items||[]).filter(it=>it.t==='tbl'&&it.dataIntegrity&&it.dataIntegrity.documentId).map(it=>{const out={};for(const k of ['documentId','pageCount','rawRowCount','rawBodyRows','h0','nC'])out[k]=it.dataIntegrity[k];if(it.dataIntegrity.sizing&&it.dataIntegrity.sizing.version===2)out.sizing={version:2,widthMode:it.dataIntegrity.sizing.widthMode};return out;});}
function trayPart(e,o){o=o||{};
 if(e.kind==='el')return elementModel(e.params,e.key,e.gi,{labels:e.labels,minFont:0,name:e.name}).slides[0];
 if(e.kind==='icon')return buildModel(e.params,{icon:{id:e.icon.id,variant:e.icon.variant}}).slides[0];
 if(e.kind==='table'){const model=buildModel(e.params,{table:e.table});assertTableExportComplete(model);if(model.slides.length>1||model.slides[0].w>W+.001||model.slides[0].h>H+.001){const err=new Error('完整表格超出一般投影片大小，不能縮小合併；請使用每項一頁的完整表格下載。');err.code='TABLE_CANVAS_COMPOSITION';err.pageCount=model.slides.length;throw err;}return model.slides[0];}
 throw new Error('未知的素材種類 '+e.kind);}
/* 待選素材 → 一頁（v9 組版）：
   opt.compose = {title 重點句, sub 副標, foot 註解, layout:'auto'|'row'|'grid2'|'main', margin:'narrow'|'normal'|'wide', unify 統一字級, minFont}
   opt.frame = 標題／註解用的風格參數（studio 傳目前範本）；素材本身各自保留加入時的風格。 */
const TRAY_LAYOUTS=[['auto','自動排列'],['row','單列'],['grid2','兩欄格線'],['main','主圖＋側欄']];
// 待選 → 每項一頁（預設）：表格用完整版面（同位置），其他元件置中一頁
// 檔名：去標點、空白變 _、最多 20 字
function shortName(t,n){n=n||20;let s=String(t||'').replace(/（示意）/g,'').replace(/[\\/:*?"<>|，。、；：！？「」『』（）【】《》,;:!?'()\[\]{}%+=#&@$^~`]+/g,' ').trim().replace(/\s+/g,'_');s=[...s].slice(0,n).join('').replace(/[_.\-]+$/,'');return s||'表格';}
function trayDeck(entries,opt){opt=opt||{};const slides=[],skipped=[],warns=[],tableDocuments=[];
 (entries||[]).forEach((e,i)=>{try{let model;if(e.kind==='table'){const tb=Object.assign({},e.table);if(opt.sugTitle!==false&&!String(tb.title||'').trim()){const sg=tableTitleSuggest(tb);if(sg)tb.title=sg;}model=buildModel(e.params,{table:tb});warns.push(...model.warns);}else model=trayModel([e],{frame:opt.frame});
  const pages=model.slides,documents=clone(model.tableDocuments||[]);if(!pages||!pages.length||pages.some(sl=>!sl||!sl.items.length)){skipped.push(i);return;}slides.push(...scopeTableDocuments(pages,'tray-'+i+':',documents));tableDocuments.push(...documents);}catch(err){if(err&&/^TABLE_/.test(err.code||''))throw err;skipped.push(i);}});
 const params=opt.frame||((entries||[])[0]||{}).params||BASE;return{slides,warns,params,k:1,custom:true,tableDocuments,tray:{n:slides.length,pages:slides.length,skipped,mode:'deck'}};}
function trayModel(entries,opt){opt=opt||{};const C=opt.compose||{};const parts=[],skipped=[];
 (entries||[]).forEach((e,i)=>{try{const sl=trayPart(e);if(!sl||!sl.items.length){skipped.push(i);return;}
   const its=clone(sl.items),documents=nativeTableDocuments(its);scopeTableDocuments([{items:its}],'tray-'+i+':',documents);parts.push({items:its,documents,bb:bboxOf(its),name:e.name||sl.title,params:e.params,med:medFontOf(its)});}catch(err){if(err&&/^TABLE_/.test(err.code||''))throw err;skipped.push(i);}});
 const hasT=!!String(C.title||'').trim(),hasF=!!String(C.foot||'').trim();
 const fp=Object.assign({},opt.frame||(parts[0]||{}).params||BASE,{size:'M'});
 const frame=(hasT||hasF)?buildModel(fp,{compose:{title:C.title,sub:C.sub,foot:C.foot}}).slides[0]:null;
 const MG={narrow:.3,normal:.5,wide:.8}[C.margin]||.45;
 const L=MG,R=W-MG,T=hasT?(String(C.sub||'').trim()?1.85:1.6):MG,B=hasF?6.68:H-MG;const AW=R-L,AH=B-T,g=.32;
 // 統一字級（選用）：先把每項的「中位字級」對齊到全部的中位數，之後所有項目再用同一個倍率縮放 → 版面上字級一致
 const meds=parts.map(p=>p.med).filter(Boolean).sort((a,b)=>a-b),TM=meds.length?meds[Math.floor(meds.length/2)]:0;
 const u=parts.map(p=>C.unify&&p.med&&TM?TM/p.med:1);
 // 最小字級（選用）：先把每項放大到最小字 ≥ 設定值（統一字級時全部同倍率），版面放不下時再整體縮小並提示
 const mf0=+C.minFont||0;if(mf0>0){const need=parts.map((p,i)=>{const m=minFontOf(p.items);return m?mf0/(m*u[i]):1;});if(C.unify){const f=Math.max(1,...need);u.forEach((v,i)=>{u[i]=v*f;});}else need.forEach((f,i)=>{if(f>1)u[i]*=f;});}
 const n=parts.length,layout=TRAY_LAYOUTS.some(l=>l[0]===C.layout)?C.layout:'auto';const place=[];   // place[i]={x,y,w,h}（格子）＋ k
 const ws=i=>parts[i].bb.w*u[i],hs=i=>parts[i].bb.h*u[i];
 if(layout==='auto'||n<2){
  function pack(s){let x=0,y=0,rowH=0;const rows=[[]],pos=[];
   parts.forEach((p,i)=>{const w=ws(i)*s,h=hs(i)*s;if(x>0&&x+w>AW+1e-6){y+=rowH+g;x=0;rowH=0;rows.push([]);}
    pos[i]={x,y,w,h,row:rows.length-1};rows[rows.length-1].push(i);x+=w+g;rowH=Math.max(rowH,h);});
   return{pos,rows,H:y+rowH,ok:y+rowH<=AH+1e-6&&pos.every(q=>q.w<=AW+1e-6)};}
  let s=1,r=pack(s);while(!r.ok&&s>.1){s*=.95;r=pack(s);}
  const oy=T+(AH-r.H)/2;
  r.rows.forEach(row=>{if(!row.length)return;const rw=row.reduce((a,i)=>a+r.pos[i].w,0)+g*(row.length-1);const rh=Math.max(...row.map(i=>r.pos[i].h));let x=L+(AW-rw)/2;
   row.forEach(i=>{const q=r.pos[i];place[i]={x,y:oy+q.y+(rh-q.h)/2,k:u[i]*s};x+=q.w+g;});});}
 else{let cells=[];
  if(layout==='row'){const cw=(AW-g*(n-1))/n;cells=parts.map((p,i)=>({x:L+i*(cw+g),y:T,w:cw,h:AH}));}
  else if(layout==='grid2'){const nr=Math.ceil(n/2),cw=(AW-g)/2,ch=(AH-g*(nr-1))/nr;cells=parts.map((p,i)=>({x:L+(i%2)*(cw+g),y:T+Math.floor(i/2)*(ch+g),w:i===n-1&&n%2?AW:cw,h:ch}));if(n%2)cells[n-1]={x:L,y:cells[n-1].y,w:AW,h:cells[n-1].h};}
  else{const mw=AW*.58,sw=AW-mw-g,m=n-1,ch=(AH-g*(m-1))/m;cells=parts.map((p,i)=>i===0?{x:L,y:T,w:mw,h:AH}:{x:L+mw+g,y:T+(i-1)*(ch+g),w:sw,h:ch});}
  const fit=cells.map((c,i)=>Math.min(c.w/ws(i),c.h/hs(i),1.5));
  const sAll=C.unify?Math.min(...fit):null;
  if(layout==='row'&&!C.unify){/* 單列：同一倍率，寬度依比例分配 */const tw0=parts.reduce((a,p,i)=>a+ws(i),0);const s=Math.min(1.5,(AW-g*(n-1))/tw0,...parts.map((p,i)=>AH/hs(i)));let x=L+(AW-g*(n-1)-tw0*s)/2;
   parts.forEach((p,i)=>{place[i]={x,y:T+(AH-hs(i)*s)/2,k:u[i]*s};x+=ws(i)*s+g;});}
  else cells.forEach((c,i)=>{const k=sAll!=null?sAll:fit[i];place[i]={x:c.x+(c.w-ws(i)*k)/2,y:c.y+(c.h-hs(i)*k)/2,k:u[i]*k};});}
 const items=frame?clone(frame.items):[],groups=[];
 parts.forEach((p,i)=>{const q=place[i];const base=items.length;const its=p.items;
  shiftItems(its,-p.bb.x,-p.bb.y);if(Math.abs(q.k-1)>1e-6)scaleSlide({items:its,groups:[]},q.k);shiftItems(its,q.x,q.y);
  its.forEach(it=>{if(it.cx)['a','b'].forEach(k=>{if(it.cx[k])it.cx[k]=[it.cx[k][0]+base,it.cx[k][1]];});items.push(it);});
  const bb=bboxOf(its);groups.push(Object.assign({name:p.name,from:base,to:items.length-1},bb));});
 const content=items.slice(frame?frame.items.length:0);const minSize=minFontOf(content);const mf=+C.minFont||0;
 const warns=[];if(mf>0&&minSize&&minSize<mf-.01)warns.push(`最小字 ${minSize}pt，低於設定的 ${mf}pt：請減少項目、改用「單列／主圖」或拿掉英文小字`);
 else if(minSize&&minSize<10)warns.push(`最小字 ${minSize}pt（小於 10pt，投影時可能看不清）`);
 const ks=place.filter(Boolean).map(q=>q.k);
 return{slides:[{key:'tray',title:'待選素材',no:1,items,groups,frameN:frame?frame.items.length:0}],warns:[],params:Object.assign({},(parts[0]||{}).params||BASE,{zh:'待選素材'}),tableDocuments:parts.flatMap(p=>p.documents),
  tray:{n:parts.length,skipped,scale:ks.length?Math.round(Math.min(...ks)*100)/100:1,layout,minSize,notes:warns,unify:!!C.unify}};}
/* 表格 → 剪貼簿 HTML（貼到 PowerPoint 會成為原生表格；強調框改成該欄／列的外框線，灰色底板不帶過去） */
function tableCopyPage(model,opt){assertTableExportComplete(model);const slides=model&&model.slides||[];opt=opt||{};
 if(slides.length>1&&opt.pageIndex==null){const err=new Error('這張表格包含多頁，請明確選擇要複製的頁面。');err.code='TABLE_COPY_SCOPE_REQUIRED';throw err;}
 const pageIndex=opt.pageIndex==null?0:opt.pageIndex;if(!Number.isInteger(pageIndex)||pageIndex<0||pageIndex>=slides.length&&(slides.length>0||opt.pageIndex!=null)){const err=new Error('選取的表格頁面不存在。');err.code='TABLE_PAGE_INVALID';throw err;}return slides[pageIndex];}
function tablePageRows(model,opt){const sl=tableCopyPage(model,opt),tb=sl&&(sl.items||[]).find(i=>i.t==='tbl');return tb?tb.cells.map(row=>row.map(cell=>(cell.runs||[]).map(run=>run.t+(run.o&&run.o.br?'\n':'')).join(''))):[];}
function tableHtml(model,opt){const sl=tableCopyPage(model,opt);if(!sl)return ''; const tb=sl.items.find(i=>i.t==='tbl');if(!tb)return '';const T=sl.table||{};const BX=T.boxes||(T.hi?[T.hi]:[]);const n=tb.cells.length;
 const pt=v=>+(v*72).toFixed(1)+'pt';
 let h=`<table style="border-collapse:collapse;table-layout:fixed;width:${pt(tb.w)};font-family:${fstack(T.font||'Microsoft JhengHei').replace(/"/g,"'")}">`;
 h+='<colgroup>'+tb.colW.map(w=>`<col style="width:${pt(w)}">`).join('')+'</colgroup>';
 tableResolvedBorders(tb).forEach((r,ri)=>{h+=`<tr style="height:${pt(tb.rowH[ri])}">`;
  r.forEach((c,ci)=>{const f=(c.runs[0]&&c.runs[0].o.font)||T.font;const bd=(side,b)=>b?`border-${side}:${b.w}pt solid #${b.c};`:'';let hb='';
   BX.forEach(b=>{const HB=`${b.rule?1.5:1.75}pt solid #${b.color}`;
    if(b.type==='col'&&b.i===ci)hb+=`border-left:${HB};border-right:${HB};`+(ri===0?`border-top:${HB};`:'')+(ri===n-1?`border-bottom:${HB};`:'');
    if(b.type==='row'&&b.i===ri)hb+=`border-top:${HB};border-bottom:${HB};`+(ci===0?`border-left:${HB};`:'')+(ci===r.length-1?`border-right:${HB};`:'');
    if(b.type==='cell'&&b.r===ri&&b.c===ci)hb+=`border:${HB};`;
    if(b.type==='range'&&ri>=b.r0&&ri<=b.r1&&ci>=b.c0&&ci<=b.c1)hb+=(ri===b.r0?`border-top:${HB};`:'')+(ri===b.r1?`border-bottom:${HB};`:'')+(ci===b.c0?`border-left:${HB};`:'')+(ci===b.c1?`border-right:${HB};`:'');});
   const css=`${c.fill?`background:#${c.fill};`:''}color:#${c.color};font-size:${c.size}pt;font-weight:${c.bold?700:400};text-align:${c.align};vertical-align:middle;padding:${c.mT}pt ${c.mR!=null?c.mR:c.mL}pt ${c.mT}pt ${c.mL}pt;font-family:${fstack(f).replace(/"/g,"'")};`+bd('top',c.bT)+bd('bottom',c.bB)+bd('left',c.bL)+bd('right',c.bR)+hb+(c.highlightEdges||[]).map(edge=>bd({bT:'top',bR:'right',bB:'bottom',bL:'left'}[edge],c[edge])).join('');
   const one=x=>{const t=esc(x.t).replace(/\n/g,'<br>');const dif=x.o.size!==c.size||x.o.color!==c.color||!!x.o.bold!==!!c.bold;return (dif?`<span style="font-size:${x.o.size}pt;color:#${x.o.color};font-weight:${x.o.bold?700:400}">${t}</span>`:t)+(x.o.br?'<br>':'');};
   h+=`<td style="${css}">${c.runs.map(one).join('')}</td>`;});h+='</tr>';});
 return h+'</table>';}
/* 參數驗證（匯入 JSON、localStorage、待選素材快照）：只收 BASE 有的鍵（＋zh／tbLook／tbPanel），顏色必須是 6 碼 hex，數字必須是有限值（可給範圍），
   列舉值必須在清單內（enums 由 studio 的選項表提供）；不合格的值改回 fallback（範本預設）。擋住 "/><img onerror=…> 這類注入。 */
function sanitizeParams(p,fallback,enums,ranges){fallback=fallback||BASE;enums=enums||{};ranges=ranges||{};const out=clone(fallback);out.tbCard='white';out.tbSizingVersion=1;if(!p||typeof p!=='object')return out;
 // Saved/imported missing dimensions retain legacy look fallback, not new-table defaults.
 TABLE_APPEARANCE_KEYS.forEach(k=>{if(!Object.prototype.hasOwnProperty.call(p,k))out[k]=null;});
 Object.keys(p).forEach(k=>{const v=p[k],d=fallback[k];
  if(k==='zh'){out.zh=stripCtl(v).replace(/[<>&"]/g,'').slice(0,40);return;}
  if(k==='tbLook'){const w=TABLE_LOOK_ALIAS[v]||v;if(TABLE_LOOKS.some(l=>l[0]===w)){out.tbLook=w;}return;}
  if(k==='tbCard'){out.tbCard='white';return;}
  if(k==='tbSizingVersion'){out.tbSizingVersion=v===2?2:1;return;}
  if(k==='tbWidthMode'){out.tbWidthMode=['auto','90','45'].includes(v)?v:'auto';return;}
  if(k==='tbHeightMode'){out.tbHeightMode=['optimal','larger','smaller','minimum'].includes(v)?v:'optimal';return;}
  if(k==='tbCardOn'||k==='tbStripes'){out[k]=typeof v==='boolean'?v:null;return;}
  if(k==='tbHeaderStyle'){out[k]=['normal','primary'].includes(v)?v:null;return;}
  if(k==='tbGrid'){out[k]=['all','horizontal','none'].includes(v)?v:null;return;}
  if(k==='tbPanel'){out.tbPanel=!!v;return;}
  if(k==='tbArrow'){out.tbArrow=['mono','sem','ink'].includes(v)?v:'mono';return;}
  if(k==='semWarn'){const h=String(v||'').replace('#','');out.semWarn=/^[0-9A-F]{6}$/i.test(h)?h.toUpperCase():'';return;}
  if(!(k in BASE))return;
  if(enums[k]){if(enums[k].some(o=>String(o)===String(v)))out[k]=typeof d==='number'?+v:v;return;}
  if(typeof BASE[k]==='boolean'){out[k]=!!v;return;}
  if(typeof BASE[k]==='number'){const n=+v;if(!Number.isFinite(n))return;const r=ranges[k];out[k]=r?Math.min(r[1],Math.max(r[0],n)):n;return;}
  if(typeof BASE[k]==='string'&&/^[0-9A-F]{6}$/i.test(BASE[k])){const h=String(v).replace('#','');if(/^[0-9A-F]{6}$/i.test(h))out[k]=h.toUpperCase();return;}
  if(typeof BASE[k]==='string'){const t=stripCtl(v);if(/^[\w .\-\u4e00-\u9fff]{0,40}$/.test(t))out[k]=t;return;}});
 if(p.tbPanel&&!p.tbLook)out.tbLook='card';out.tbCard='white';
 return out;}
const api={SCHEME_CATALOGUE_KEYS,SCHEME_CATALOGUE_STYLES,TABLE_SIZING_DEFAULTS,TABLE_SIZING_KEYS,tableSizingOf,tableSizingFontOf,adoptTableSizing,iconPackModel,iconPackFilename,ICON_BASES,ICON_LOOKS,ICON_STATES,cleanIconStyle,iconComponentName,iconComponentPaint,FW_HELP,fwHelp,fwNotes,SPLIT_PARTS,USED,SECTIONS,tw,shortName,trayDeck,W,H,BASE,stripCtl,sanitizeParams,PRESETS,STYLES:PRESETS,SLIDES,SIZE_K,ICONS,mix,buildModel,toPptx,patchZip,groupXml,effectXml,exportPptx,exportElement,elementModel,elementSvg,toSvg,tableHtml,tablePageRows,tableSource,tableFormatValue,assertTableExportComplete,TABLE_PREVIEW_BODY_ROWS,TABLE_HIGHLIGHT_LIMIT,TABLE_HIGHLIGHT_PRESETS,TABLE_HIGHLIGHT_HUES,TABLE_HIGHLIGHT_PRESETS_V2,TABLE_HIGHLIGHT_PRESETS_V3,TABLE_HIGHLIGHT_ROLES,TABLE_HIGHLIGHT_PRESETS_V4,TABLE_HIGHLIGHT_FAMILIES,TABLE_HIGHLIGHT_BORDER_WIDTHS,tableHighlightBorderWidth,tableRangeBorderWidth,tableSetRangeBorderWidth,tableRangeBoldState,tableSetRangeBold,tableHighlightFamily,tableHighlightStroke,tableResolvedBorders,tableRangeEdge,tableHighlightPreset,tableHighlightPresetId,tableHighlightRolePresets,tableNormalizeRange,tableRangeIntersection,tableRangeSubtract,tableMarkBounds,tableMarkContains,tableMarkRegions,tableRangeWinner,tableApplyRange,tableClearRange,tableShiftMarks,tableMarks,tNumVal,trayModel,TRAY_LAYOUTS,applyLabels,textOf,minFontOf,smallRuns,tableAuto,statusOf,TABLE_LOOKS,TABLE_LOOK_ALIAS,tableLookOf,TABLE_APPEARANCE_KEYS,TABLE_APPEARANCE_DEFAULTS,tableAppearanceOf,tFmt,tParts,tableColDec,tableSuggest,tableFromPaste,tableTitleSuggest,ensureContrast,contrastOf,langOf,FONT_STACK};
if(typeof module!=='undefined')module.exports=api;else root.Deck=api;
})(this);
