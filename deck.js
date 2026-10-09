/* PPT Style Studio v4 — 參數化圖解元件庫（永遠白底）
   params → 幾何模型（model）→ ① SVG 即時預覽  ② PptxGenJS 匯出（含陰影 XML 修補）
   瀏覽器（studio.html）與 Node（gen.js）共用。 */
(function(root){
'use strict';
const W=13.333,H=7.5,PT=72;
const ICONS=(root&&root.Icons)||(typeof require==='function'?(function(){try{return require('./icons.js');}catch(e){return null;}})():null);
function mix(a,b,t){const p=s=>[0,2,4].map(i=>parseInt(s.substr(i,2),16));const A=p(a),B=p(b);return A.map((v,i)=>Math.round(v*(1-t)+B[i]*t).toString(16).padStart(2,'0')).join('').toUpperCase();}
const clone=o=>JSON.parse(JSON.stringify(o));
// XML 不允許的控制字元（U+0000–U+0008、U+000B、U+000C、U+000E–U+001F、U+FFFE/FFFF）：留著會讓 .pptx 需要「修復」→ 所有文字進 model 前先去掉
const stripCtl=s=>String(s==null?'':s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'');

/* ============ 參數：預設值＋ 8 個範本 ============ */
const BASE={
 P:'1F4E79',PD:'1F3864',PT:'DEE7F1',A:'2E75B6',useA:true,
 ink:'3A3A3A',t2:'595959',mute:'8C8C8C',line:'BFBFBF',l2:'D9D9D9',fill:'F2F2F2',
 canvas:false,canvasColor:'F5F5F5',
 r:.1,colR:'full',colStyle:'fill',
 size:'M',sh:false,shFit:true,shMode:'drop',shB:7,shO:2,shA:.25,shDir:90,haloB:16,haloA:.32,ring:false,
 card:'outline',cardLW:1.25,cardLine:'D9D9D9',headColor:'P',bandStyle:'fill',cornerTag:true,ribbonTone:'p',
 tag:'pill',badge:'circle',sep:'tri',chain:'chev',circle:'ring3',circleLW:3,sym:'outlineP',mark:'none',bar:'under',bracket:false,titleColor:'P',
 footRule:false,
 cnW:1.25,cnC:'7F7F7F',cnDash:'solid',cnHead:'triangle',cnTail:'none',cnHs:'med',
 tFont:'Microsoft JhengHei',bFont:'Microsoft JhengHei',nFont:'',tSize:36,tBold:true,lSize:16,lBold:true,nSize:10.5,
 icColor:'P',icVar:'line',icSW:0,
 tbDense:'normal',tbHiColor:'auto',tbHiMode:'auto',tbNeg:false,tbStatus:true
};
const PRESETS=[
 {id:'navy',zh:'商務深藍卡片',en:'Navy Card',ref:'參考圖 2',desc:'淺灰畫布＋白色大外框圓與柔和光暈，深藍膠囊白字，▶ 小三角分隔',
  canvas:true,canvasColor:'F5F5F5',sh:true,shB:7,shO:2,shA:.24,haloB:16,haloA:.32,ring:true,
  card:'outline',cardLW:1.25,cardLine:'D9D9D9',tag:'pill',badge:'ring',sep:'tri',chain:'chev',circle:'ring3',circleLW:3,sym:'outlineP',mark:'bar',bar:'under'},
 {id:'green',zh:'墨綠筆記',en:'Green Notes',ref:'參考圖 1',desc:'暖灰畫布、粗灰外框扁平卡片，墨綠小圓角標籤＋芥末黃點綴，六角鏈與 ▶▶▶ 點狀箭號',
  P:'2F5D50',PD:'24483E',PT:'E2EBE7',A:'C9A227',canvas:true,canvasColor:'F4F4F1',r:.12,
  card:'outline',cardLW:2.25,cardLine:'BFBFBF',tag:'round',badge:'rsq',sep:'dots',chain:'hex',circle:'thick',circleLW:2.25,sym:'thick',mark:'sq',bar:'banner',
  cnW:1.5,cnC:'8C8C8C',cnHs:'med',tSize:40,colR:'small'},
 {id:'frame',zh:'框架鑑',en:'Framework Atlas',ref:'參考圖 3',desc:'淺灰實心圓角卡＋陰影，中英雙語標籤，01 02 編號小膠囊，點狀折線／曲線箭頭',
  P:'2F4B6E',PD:'243A56',PT:'E3E8EF',A:'6B8CB5',useA:false,sh:true,shB:7,shO:2,shA:.24,
  card:'gray',headColor:'ink',tag:'pill',badge:'pill',sep:'tri',chain:'gray',circle:'gray',sym:'gray',bar:'rule',bracket:true,
  cnC:'595959',cnDash:'sysDot',tSize:34,colR:'small'},
 {id:'iceberg',zh:'冰山能力圖',en:'Iceberg Map',ref:'參考圖 4',desc:'炭灰細框直角卡＋角落標籤緞帶，半透明寬欄條上的圓點，細折線樹狀與淺藍漸隱大箭頭',
  P:'404040',PD:'262626',PT:'E7E7E7',A:'5B9BD5',canvas:true,canvasColor:'F5F5F5',r:.03,
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
const SLIDES=[['catalog','元件總表'],['patterns','常見組合'],['patterns2','常見組合（二）'],['icons','圖示庫'],['guide','風格規範'],['cards','卡片'],['tags','標籤與編號'],['circles','圓形與流程鏈'],['conn','連接線與箭頭'],['flow','流程圖符號'],['struct','結構元件'],['ex1','範例｜三圓架構'],['ex2','範例｜框架流程'],['ex3','範例｜分支樹狀']];

/* ---------- 文字寬度估算（Node 端排版檢查用；瀏覽器預覽改用 canvas 實測） ---------- */
function tw(str,size){let u=0;for(const ch of String(str)){const c=ch.codePointAt(0);
 if(c>=0x2000)u+=1;else if(c===32)u+=.3;else if(/[A-Z]/.test(ch))u+=.66;else if(/[0-9]/.test(ch))u+=.57;else if(/[mw]/.test(ch))u+=.84;else if(/[iljft.,:;'|!()]/.test(ch))u+=.3;else u+=.55;}
 return u*size/72;}

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
 const warns=[],slides=[];let cur=null,sno=0;
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
  items.forEach((r,i)=>{r=Object.assign({},r,{t:stripCtl(r.t)});const size=r.s||o.size||14;const ro={size,font:r.f||o.font||F,bold:r.b!=null?!!r.b:!!o.bold,color:r.c||o.color||G.ink};
   if(r.cs!=null)ro.cs=r.cs;const brk=r.br&&i<items.length-1;if(brk)ro.br=true;
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
  if(o.points)it.points=o.points;if(o.sites)it.sites=o.sites;if(o.bgMatch)it.bgMatch=1;if(it.name)it.name=stripCtl(it.name).replace(/[<>&"]/g,'');if(o.doc)it.doc=1;if(o.cap)it.cap=o.cap;
  if(o.text!=null&&o.text!==''){const R=runsOf(o.text,o);it.runs=R.out;
   it.tx={align:o.align||'center',valign:o.valign||'middle',margin:o.margin!=null?o.margin:(kind?3:0),lsp:o.lsp||1,font:o.font||F,size:o.size||14,color:o.color||G.ink,bold:!!o.bold,cs:o.cs};
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
   return{runs,fill:c.fill||null,align:c.align||o.align||'center',size,color:c.color||G.ink,bold:!!c.bold,font:c.font||F,mL:o.mL!=null?o.mL:4,mT:o.mT!=null?o.mT:1,bT:c.bT||null,bB:c.bB||null};}));
  const it={t:'tbl',x,y,w,h,colW:colW.slice(),rowH:rowH.slice(),cells:C,name:o.name||'表格'};cur.items.push(it);return it;}
 /* 圖示（v7）：Material Symbols＝一個填色自訂圖形（多段子路徑、無外框）；tint／solid 變化另加一個底圓。回傳 {bg,glyph} */
 const ICC=c=>({P,PD,A:HASA?A:P,g:G.t2,ink:G.ink}[c]||P);
 function icon(id,x,y,s,o){o=o||{};if(!ICONS||!ICONS.BY[id])return{};const ic=ICONS.BY[id];const variant=o.variant||st.icVar||'line';
  const fg0=o.color||ICC(o.tone||st.icColor);const g=ICONS.geom(variant,ICONS.weightOf(st));let fg=fg0,bg=null;
  if(g.circle){bg=oval(x,y,s,s,{fill:variant==='solid'?fg0:mix(fg0,'FFFFFF',.86),name:'圖示底圓'});if(variant==='solid')fg='FFFFFF';}
  const glyph=el('custGeom',x,y,s,s,{points:ICONS.points(id,s,g.k,g.off,g.wt),fill:fg,name:'圖示 '+ic.zh});
  return{bg,glyph};}
 /* ---------- 版面骨架 ---------- */
 function canvas(){if(st.canvas)box(.25,.25,W-.5,H-.5,{fill:st.canvasColor,r:.06,name:'畫布面板'});}
 function footer(){const y=st.canvas?6.9:7.0;if(st.footRule)ln(.4,y-.05,W-.4,y-.05,{c:P,w:1.25});
  txt(.6,y,6,.24,[{t:st.zh||'自訂風格',b:1,c:G.t2},{t:'｜精緻圖解元件庫',c:G.mute}],{size:9});
  txt(W-.6-1.5,y,1.5,.24,String(sno).padStart(2,'0')+' / '+String(SLIDES.length).padStart(2,'0'),{size:9,color:G.mute,align:'right',font:nf});}
 function title(t,sub){const T=st.bracket?'《'+t+'》':t;const ts=st.tSize;
  const tt=(x,y,w,o)=>txt(x,y,w,.72,T,Object.assign({size:ts,bold:st.tBold,color:titleColor,font:st.tFont,name:'標題'},o||{}));
  switch(st.bar){
   case 'under':tt(.6,.42,11);txt(.6,1.12,11,.38,sub,{size:16,color:subC,font:FL});box(.6,1.6,.55,.06,{fill:P});break;
   case 'banner':{tt(.6,.36,11);const bw=tw(sub,14)+.44;box(.6,1.17,bw,.4,{fill:P,text:sub,size:14,color:'FFFFFF',bold:1});box(.6+bw+.07,1.17,.12,.4,{fill:A});break;}
   case 'rule':tt(st.bracket?.5:.6,.4,11);txt(.6,1.1,11,.36,sub,{size:15,color:subC});ln(.6,1.62,W-.6,1.62,{c:G.l2,w:.75});box(.6,1.595,1.1,.05,{fill:P});break;
   case 'vbar':box(.6,.5,.07,1.02,{fill:A});tt(.86,.4,11);txt(.86,1.1,11,.38,sub,{size:16,color:subC,font:FL});break;
   case 'over':box(.6,.42,.5,.035,{fill:P});tt(.6,.56,11);txt(.6,1.3,11,.34,sub,{size:14,color:G.mute,font:FL});break;
   case 'gold':tt(.6,.38,11);box(.6,1.16,.9,.025,{fill:A});txt(.6,1.27,11,.34,sub,{size:14,color:G.t2,cs:1});break;
   case 'pill':tt(.6,.42,11);box(.6,1.27,.45,.1,{fill:P,r:'full'});txt(1.17,1.13,11,.38,sub,{size:16,color:subC,font:FL});break;
   case 'plain':tt(.5,.34,11.5);txt(.52,1.06,11,.36,sub,{size:15,color:G.t2});break;
   case 'dot':{tt(.6,.4,11);const nLat=(T.match(/[A-Za-z]/g)||[]).length;const dx=.6+tw(T,ts)+nLat*ts/72*.07+.08;circ(dx+.08,.4+.36+ts/150,.16,{fill:A});txt(.6,1.12,11,.38,sub,{size:15,color:subC});box(.6,1.6,.5,.06,{fill:A});break;}}}
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
 function grp(name,fn){const a=cur.items.length;fn();const b=cur.items.length-1;if(b<a)return;
  const bb=bboxOf(cur.items.slice(a,b+1));cur.groups.push(Object.assign({name,from:a,to:b},bb));}
 const hue=h=>{const [r,g,b]=[0,2,4].map(i=>parseInt(h.substr(i,2),16)/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx-mn<.12)return -1;
  let H=mx===r?((g-b)/(mx-mn))%6:mx===g?(b-r)/(mx-mn)+2:(r-g)/(mx-mn)+4;return (H*60+360)%360;};
 const satOf=h=>{const v=[0,2,4].map(i=>parseInt(h.substr(i,2),16));return (Math.max(...v)-Math.min(...v))/Math.max(1,Math.max(...v));};
 const hp=hue(P),ha=HASA?hue(A):-1;
 const AL=hp>=0&&(hp<=15||hp>=345)&&satOf(P)>.7?P:(ha>=0&&(ha<=40||ha>=340)&&satOf(A)>.6?A:'C0504D');   // 警示色：主色是紅→主色；暖色強調色→強調色；否則克制的磚紅
 const ALt=mix(AL,'FFFFFF',.86),ALd=mix(AL,'000000',.25);
 /* ================= 投影片 ================= */
 const X0=.6,X1=W-.6,CW=X1-X0;const lang=langOf(st);
 const SL={};

 /* ---------- 01 元件總表：每一列一個類別，每格一個可直接複製的獨立圖形，圖說另為文字框 ---------- */
 SL.catalog=()=>{title('元件總表 Element Catalog','一頁看完本風格的所有元件變化：挑好樣式，直接複製圖形使用');
  const LX=X0,CX0=X0+1.42,NC=7,CWc=(X1-CX0)/NC,SW=Math.min(1.2,CWc-.3);
  const fs=Math.min(LS(11.5),13),PR=st.r>0?Math.min(st.r,.1):0;
  const rows=[['流程方塊','Process',.42],['判斷菱形','Decision',.52],['開始／結束','Start / End',.38],['箭頭與連接線','Arrows',.4],['例外與警示','Exception',.44],['圓形・編號・標籤','Circle / Badge / Tag',.62],['容器與群組','Container',.46]];
  const capH=.17,gap=.11;let y=1.9;const total=rows.reduce((a,r)=>a+r[2]+capH+gap,0)-gap;
  const yEnd=(st.canvas?6.82:6.92);if(y+total>yEnd)y=yEnd-total;
  const cx=i=>CX0+(i+.5)*CWc;
  let rowY,rowH;
  const cap=(i,t)=>txt(cx(i)-CWc/2+.03,rowY+rowH+.035,CWc-.06,capH,t,{size:Math.max(7.5,st.nSize-2),color:G.mute,align:'center',name:'圖說'});
  const cell=(i,t,fn)=>{grp(t,()=>fn(cx(i)-SW/2,rowY,SW,rowH,cx(i),rowY+rowH/2));cap(i,t);};
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
    txt(dx+ww/2+.02,my-.2,.3,.18,'是',{size:8,color:G.t2,name:'標註'});});};
  R[2]=()=>{const p=(x,y,w,h,o)=>box(x,y,w,h,Object.assign({r:'full',size:fs,margin:[2,2,0,0],name:'開始／結束'},o));
   cell(0,'外框',(x,y,w,h)=>p(x,y,w,h,{fill:'FFFFFF',line:P,lw:1.25,text:'開始',color:P,bold:1}));
   cell(1,'淺主色底',(x,y,w,h)=>p(x,y,w,h,{fill:PTn,text:'開始',color:PD,bold:1}));
   cell(2,'淺灰底',(x,y,w,h)=>p(x,y,w,h,{fill:GF,text:'開始',color:G.ink,bold:1}));
   cell(3,'柔和陰影',(x,y,w,h)=>p(x,y,w,h,{fill:'FFFFFF',line:G.l2,lw:.5,sh:'card',force:1,text:'開始',color:G.ink,bold:1}));
   cell(4,'深底白字強調',(x,y,w,h)=>p(x,y,w,h,{fill:P,sh:'small',force:1,text:'結束',color:'FFFFFF',bold:1}));
   if(HASA)cell(5,'強調色',(x,y,w,h)=>p(x,y,w,h,{fill:A,text:'結束',color:hue(A)>=35&&hue(A)<=70?G.ink:'FFFFFF',bold:1}));};
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
   cell(0,'虛線群組框',(x,y,w,h)=>{box(x,y+.06,w,h-.06,{line:G.mute,lw:.75,dash:'dash',r:PR,name:'群組框'});box(x+.1,y-.03,.62,.18,{fill:st.canvas?st.canvasColor:'FFFFFF',bgMatch:1,text:'群組 A',size:8,color:G.t2,margin:0,name:'群組名稱'});});
   cell(1,'淺灰面板',(x,y,w,h)=>box(x,y,w,h,{fill:GF,r:PR,name:'淺灰面板'}));
   cell(2,'本風格卡片',(x,y,w,h)=>cardBase(x,y,w,h));
   cell(3,'卡片＋陰影',(x,y,w,h)=>cardBase(x,y,w,h,{force:1}));
   cell(4,'表頭色帶卡',(x,y,w,h)=>{box(x,y,w,h,{fill:'FFFFFF',line:G.l2,lw:.75,r:PR,name:'卡片'});topRound(x,y,w,.16,rr(w,h,PR),{fill:P,name:'表頭'});});
   cell(5,'頂邊／側邊色條',(x,y,w,h)=>{box(x,y,w,h,{fill:'FFFFFF',line:G.l2,lw:.75,name:'卡片'});box(x,y,.06,h,{fill:A,name:'側邊色條'});});
   cell(6,'半透明寬欄條',(x,y,w,h,mx,my)=>{const cw=.34;colBar(mx-cw-.06,y,cw,h);colBar(mx+.06,y,cw,h);});};
  rows.forEach((r,i)=>{rowY=y;rowH=r[2];
   const lcy=y+(rowH+capH)/2;
   txt(LX,lcy-.22,1.32,.44,[{t:r[0],s:10.5,b:1,c:G.t2,br:1},{t:r[1],s:8,c:G.mute,f:nf}],{lsp:1.05,valign:'middle',name:'類別'});
   R[i]();
   y+=rowH+capH+gap;
   if(i<rows.length-1)ln(LX,y-gap/2,X1,y-gap/2,{c:mix(G.l2,'FFFFFF',.45),w:.5});});
  ln(CX0-.12,1.9-.04,CX0-.12,y-gap,{c:mix(G.l2,'FFFFFF',.3),w:.5});};

 /* ---------- 02 常見組合：已排好、已連線的小流程，每組在 pptx 中是一個群組 ---------- */
 SL.patterns=()=>{title('常見組合 Common Patterns','已排好、已連線的流程小組合：整組複製即可使用（純流程圖語意）');
  const NCOL=4,GAPc=.22,cw=(CW-(NCOL-1)*GAPc)/NCOL,lh=.4,ch=1.86,rowGap=.26;
  const y0=1.9,rows2=y0+lh+ch+rowGap;const fs=Math.min(LS(10.5),12),nh=.42;
  const N=(x,y,w,t,o)=>sym('proc',x,y,w,nh,t,Object.assign({size:fs},o||{}));
  const lab=(x,y,w,t,o)=>txt(x,y,w,.2,t,Object.assign({size:8.5,color:G.t2,align:'center',name:'標註'},o||{}));
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
     const ly=y+.24;link(d,0,a,0,{via:[[dx+dw/2,ly],[x+.4,ly]]});lab(x+.42,ly-.22,dx+dw/2-x-.42,'退回修改後重送');}],
   ['泳道（雙道）','Swimlane',(x,y)=>{const lh2=.8,hw=.46,l1=y+.04,l2=l1+lh2+.06,c1=l1+lh2/2,c2=l2+lh2/2,w=.7;
     [[l1,'申\n請\n人'],[l2,'主\n管']].forEach(([ly,t])=>{box(x,ly,cw,lh2,{fill:'FFFFFF',line:G.l2,lw:.75,name:'泳道'});box(x,ly,hw,lh2,{fill:GF,text:t,size:8.5,bold:1,color:G.t2,margin:0,lsp:.95,name:'泳道標題'});});
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
   ['輸入→處理→輸出','Input / Process / Output',(x,y)=>{const ww=[.82,.7,.82],g=(cw-ww[0]-ww[1]-ww[2])/2,yy=y+.5;let xi=x;
     const ns=[['io','輸入'],['proc','處理'],['doc','報表']].map(([k,t],i)=>{const n=sym(k,xi,k==='doc'?yy-.05:yy,ww[i],k==='doc'?.52:nh,t,{size:fs,strong:i===1});
      lab(xi-.05,yy+.6,ww[i]+.1,['資料來源','整理運算','產出結果'][i],{color:G.mute});xi+=ww[i]+g;return n;});
     link(ns[0],2,ns[1],1);link(ns[1],3,ns[2],1);}],
   ['前後對照','Before / After',(x,y)=>{const w=1.18,h=1.3,yy=y+.2,xb=x+cw-w;
     cardBase(x,yy,w,h);txt(x+.14,yy+.12,w-.28,.3,[{t:'現況 ',b:1,c:G.t2},{t:'Before',s:8,c:G.mute,f:nf}],{size:LS(11),name:'卡片標題'});
     txt(x+.14,yy+.48,w-.28,.7,'流程分散\n交接常出錯',{size:9.5,color:G.t2,valign:'top',lsp:1.2,name:'卡片內文'});
     sep(x+cw/2,yy+h/2);
     box(xb,yy,w,h,{fill:'FFFFFF',line:P,lw:1.75,r:st.r,sh:1,name:'強調卡片'});txt(xb+.14,yy+.12,w-.28,.3,[{t:'改善後 ',b:1,c:P},{t:'After',s:8,c:G.mute,f:nf}],{size:LS(11),name:'卡片標題'});
     txt(xb+.14,yy+.48,w-.28,.7,'單一窗口\n進度一目了然',{size:9.5,color:G.ink,valign:'top',lsp:1.2,name:'卡片內文'});}]];
  combos.forEach(([zh,en,fn],i)=>{const col=i%NCOL,row=Math.floor(i/NCOL);const x=X0+col*(cw+GAPc),y=row?rows2:y0;
   const dx=mark(x,y+.14);txt(x+dx,y,cw-dx,.3,[{t:zh,s:LS(11.5),b:st.lBold,c:G.ink},{t:'  '+en,s:8,c:G.mute,f:nf}],{name:'組合名稱'});
   ln(x,y+.34,x+cw,y+.34,{c:G.l2,w:.5});
   grp(zh,()=>fn(x,y+lh));});};
 /* ---------- 03 常見組合（二）：表格、比較、數字卡、PDCA；每組在 pptx 中是一個群組（含表格者除外：PowerPoint 不允許表格入群組） ---------- */
 SL.patterns2=()=>{title('常見組合（二）Common Patterns II','分工表、前後對照、問題對策、方案比較、KPI 數字卡與 PDCA：整組複製即可使用');
  const NCOL=3,GAPc=.34,cw=(CW-(NCOL-1)*GAPc)/NCOL,lh=.4,ch=1.86,rowGap=.24;
  const y0=1.9,rows2=y0+lh+ch+rowGap;const fs=Math.min(LS(10),11.5);const W2='FFFFFF';
  const bHead={c:P,w:1.25},bRow={c:G.l2,w:.5};
  const combos=[
   ['責任分工 RACI','RACI Matrix',(x,y)=>{const roles=['PM','設計','工程','業務'],tasks=['需求定義','方案設計','開發測試','上線推廣'];
     const M=[['A','C','C','R'],['A','R','C','I'],['A','C','R','I'],['A','I','C','R']];
     const c0=1.16,cr=(cw-c0)/4,rh0=.32,rh=.34;
     const head=[{t:'工作項目',bold:1,color:G.t2,align:'left',size:fs-1,bB:bHead}].concat(roles.map(r=>({t:r,bold:1,color:G.ink,size:fs-1,bB:bHead})));
     const body=tasks.map(t=>[{t,color:G.ink,align:'left',size:fs-.5,bB:bRow}].concat(roles.map(()=>({t:'',bB:bRow}))));
     table(x,y,[c0,cr,cr,cr,cr],[rh0,rh,rh,rh,rh],[head].concat(body),{name:'RACI 表格'});
     const look={R:{fill:P,c:W2},A:{fill:HASA?A:PD,c:HASA&&lum(A)>.55?G.ink:W2},C:{fill:PTn,c:PD},I:{fill:W2,line:G.line,c:G.t2}};
     M.forEach((row,i)=>row.forEach((k,j)=>{const L=look[k],cx=x+c0+cr*(j+.5),cy=y+rh0+rh*(i+.5),pw=.34,ph=.21;
      box(cx-pw/2,cy-ph/2,pw,ph,{fill:L.fill,line:L.line,lw:.75,r:'full',text:k,size:8,bold:1,color:L.c,margin:0,font:nf,name:'RACI 標記'});}));
     const ly=y+rh0+4*rh+.08;let lx=x;[['R','執行'],['A','當責'],['C','諮詢'],['I','知會']].forEach(([k,t])=>{const L=look[k];
      box(lx,ly+.02,.22,.16,{fill:L.fill,line:L.line,lw:.5,r:'full',text:k,size:6.5,bold:1,color:L.c,margin:0,font:nf,name:'圖例'});
      txt(lx+.26,ly,.6,.2,t,{size:8,color:G.t2,name:'圖例'});lx+=.86;});}],
   ['改善前後對照表','Before / After Table',(x,y)=>{const c0=1.0,c1=(cw-c0)/2,rh0=.34,rh=.36;
     const rows=[['交期','10 天','6 天'],['不良率','3.2%','1.1%'],['人力','5 人','3 人'],['客訴','8 件／月','2 件／月']];
     const head=[{t:'項目',bold:1,color:G.t2,align:'left',size:fs-1,bB:bHead},{t:'改善前 Before',bold:1,color:G.t2,size:fs-1,fill:GF,bB:{c:G.line,w:1.25}},{t:'改善後 After',bold:1,color:W2,size:fs-1,fill:P,bB:bHead}];
     const body=rows.map(r=>[{t:r[0],color:G.ink,align:'left',size:fs-.5,bB:bRow},{t:r[1],color:G.mute,size:fs,bB:bRow,font:nf},{t:r[2],color:P,bold:1,size:fs+1,bB:bRow,font:nf}]);
     table(x,y,[c0,c1,c1],[rh0,rh,rh,rh,rh],[head].concat(body),{name:'前後對照表'});
     note(x,y+rh0+4*rh+.06,cw,'※ 改善後一欄以主色粗體標示',{size:8,h:.2});}],
   ['問題 → 原因 → 對策','Problem / Cause / Countermeasure',(x,y)=>{const bw=1.02,g=(cw-3*bw)/2,bh=1.16,yy=y+.22;
     const sh=symLook(false).sh?'small':0;
     const spec=[['問題','Problem','交期常延誤\n客戶抱怨增加',{fill:W2,line:AL,lw:1.5,c:ALd}],['原因','Cause','需求變更頻繁\n排程未同步',{fill:GF,c:G.ink}],['對策','Countermeasure','需求凍結點\n每週排程會議',{fill:P,c:W2}]];
     const B=spec.map(([zh,en,body,L],i)=>box(x+i*(bw+g),yy,bw,bh,{fill:L.fill,line:L.line,lw:L.lw,r:st.r>0?Math.min(st.r,.12):0,sh,valign:'top',align:'left',margin:[7,5,4,8],lsp:1.15,size:fs-1.5,
      text:[{t:zh,s:fs+1.5,b:1,c:L.c===W2?W2:(i===0?ALd:G.ink),br:1},{t:en,s:7,c:L.c===W2?mix(P,'FFFFFF',.7):G.mute,f:nf,br:1}].concat(body.split('\n').map((t,k,a)=>({t,s:fs-1.5,c:L.c===W2?W2:G.t2,br:k<a.length-1?1:0}))),name:zh}));
     link(B[0],3,B[1],1);link(B[1],3,B[2],1);}],
   ['三方案比較','3-Column Comparison',(x,y)=>{const g=.12,w=(cw-2*g)/3,h=1.8,yy=y+.06,hh=.4;
     const opts=[['方案 A','Option A',['成本：低','時程：2 週','擴充：有限']],['方案 B','Option B',['成本：中','時程：4 週','擴充：佳']],['方案 C','Option C',['成本：高','時程：8 週','擴充：最佳']]];
     opts.forEach(([zh,en,rows],i)=>{const xi=x+i*(w+g),hi=i===1;
      if(hi){box(xi,yy,w,h,{fill:W2,line:P,lw:1.75,r:st.r>0?Math.min(st.r,.12):0,sh:1,name:'推薦方案'});topRound(xi,yy,w,hh,st.r>0?Math.min(st.r,.12):0,{fill:P,name:'表頭'});}
      else{box(xi,yy,w,h,{fill:W2,line:G.l2,lw:1,r:st.r>0?Math.min(st.r,.12):0,name:'方案'});box(xi+.001,yy+.001,w-.002,hh,{fill:GF,r:0,name:'表頭底'});}
      txt(xi,yy,w,hh,[{t:zh,s:fs+.5,b:1,c:hi?W2:G.ink,br:1},{t:en,s:7,c:hi?mix(P,'FFFFFF',.7):G.mute,f:nf}],{align:'center',lsp:.95,name:'方案名稱'});
      rows.forEach((r,j)=>{const ry=yy+hh+.14+j*.36;const [k,v]=r.split('：');
       txt(xi+.12,ry,w-.24,.18,k,{size:7.5,color:G.mute,name:'項目'});txt(xi+.12,ry+.15,w-.24,.2,v,{size:fs-.5,bold:hi?1:0,color:hi?P:G.ink,name:'內容'});});
      if(hi)tag(xi+w/2,yy+h-.08,'推薦',{tone:'a',size:8,h:.22,anchor:'center'});});}],
   ['KPI 數字卡','KPI Cards',(x,y)=>{const g=.14,w=(cw-2*g)/3,h=1.36,yy=y+.22;
     const K=[['準時交貨率','98.6','%','▲ 2.1 pt',1],['平均交期','6.2','天','▼ 1.8 天',1],['客訴件數','2','件／月','▼ 75%',1]];
     K.forEach(([l,v,u,d,good],i)=>{const xi=x+i*(w+g);cardBase(xi,yy,w,h,{});box(xi+.14,yy+.16,.24,.04,{fill:i===0?P:G.line,name:'色條'});
      txt(xi+.14,yy+.26,w-.2,.22,l,{size:8.5,color:G.t2,name:'指標名稱'});
      txt(xi+.12,yy+.5,w-.18,.46,[{t:v,s:24,b:1,c:i===0?P:G.ink,f:nf},{t:' '+u,s:9,c:G.t2}],{valign:'bottom',name:'數值'});
      txt(xi+.14,yy+1.0,w-.2,.2,[{t:d,s:8,b:1,c:good?P:ALd},{t:'  較上季',s:7,c:G.mute}],{name:'變化'});});}],
   ['PDCA 循環','PDCA Cycle',(x,y)=>{const bw=1.44,bh=.68,vg=.44,yy=y+.06,xr=x+cw-bw,yb=yy+bh+vg;const L=symLook(false);
     const S=[['P','計畫','Plan','設定目標與做法',x,yy],['D','執行','Do','依計畫小步執行',xr,yy],['C','查核','Check','量測結果與差異',xr,yb],['A','行動','Act','標準化並修正',x,yb]];
     const B=S.map(([k,zh,en,t,bx,by])=>box(bx,by,bw,bh,{fill:L.fill===P?W2:L.fill,line:L.line||(L.fill===P?P:null),lw:L.lw||1.5,dash:L.dash,r:st.r>0?Math.min(st.r,.12):0,sh:L.sh?'small':0,align:'left',valign:'middle',margin:[8,4,0,0],lsp:1.08,size:fs-1.5,
      text:[{t:k,s:15,b:1,c:P,f:nf},{t:'  '+zh+' ',s:fs+.5,b:1,c:G.ink},{t:en,s:7.5,c:G.mute,f:nf,br:1},{t:t,s:fs-1.5,c:G.t2}],name:'PDCA '+en}));
     link(B[0],3,B[1],1);link(B[1],2,B[2],0);link(B[2],1,B[3],3);link(B[3],0,B[0],2);
     const cx=x+cw/2,cy=yy+bh+vg/2;box(cx-.5,cy-.13,1.0,.26,{fill:W2,line:G.l2,lw:.75,r:'full',text:[{t:'PDCA',s:8,b:1,c:P,f:nf},{t:'  持續改善',s:7.5,c:G.t2}],size:8,margin:0,name:'中心標籤'});}]];
  combos.forEach(([zh,en,fn],i)=>{const col=i%NCOL,row=Math.floor(i/NCOL);const x=X0+col*(cw+GAPc),y=row?rows2:y0;
   const dx=mark(x,y+.14);txt(x+dx,y,cw-dx,.3,[{t:zh,s:LS(11.5),b:st.lBold,c:G.ink},{t:'  '+en,s:8,c:G.mute,f:nf}],{name:'組合名稱'});
   ln(x,y+.34,x+cw,y+.34,{c:G.l2,w:.5});
   grp(zh,()=>fn(x,y+lh));});};
 /* ---------- 04 圖示庫：Material Symbols 圖示（每個都是可單獨複製的原生圖案）＋圖示＋文字的常用組合 ---------- */
 SL.icons=()=>{const TOPI=ICONS?(ICONS.TOP||ICONS.LIST):[];title('圖示庫 Icon Library','精選 '+TOPI.length+' 個 Material Symbols（Studio 共 '+(ICONS?ICONS.LIST.length:0)+' 個）：顏色、粗細跟著風格；每個都是可編輯圖案');
  if(!ICONS)return;const NC=20,cw=CW/NC,s=.33,pitch=.585,y0=1.8,W2='FFFFFF',PR=st.r>0?Math.min(st.r,.1):0;const cs=Math.max(7.5,Math.min(8.5,st.nSize-3));
  TOPI.forEach((ic,i)=>{const c=i%NC,r=Math.floor(i/NC);const cx=X0+(c+.5)*cw,y=y0+r*pitch;
   grp(ic.zh,()=>icon(ic.id,cx-s/2,y,s));txt(cx-cw/2-.02,y+s+.03,cw+.04,.18,ic.zh,{size:cs,color:G.t2,align:'center',name:'圖說'});});
  const ys=y0+Math.ceil(TOPI.length/NC)*pitch+.02;ln(X0,ys-.06,X1,ys-.06,{c:G.l2,w:.5});
  const dx=mark(X0,ys+.13);txt(X0+dx,ys,6,.28,[{t:'圖示＋文字組合',s:LS(11.5),b:st.lBold,c:G.ink},{t:'  Icon + Label',s:8,c:G.mute,f:nf}],{name:'小節'});
  const yb=Math.min(ys+.36,(st.canvas?6.82:6.92)-.8),hb=.74,gap=.16;const ws=[2.15,2.15,2.3,2.05];const w5=CW-ws.reduce((a,b)=>a+b,0)-4*gap;let xb=X0;
  const place=(w,name,fn)=>{const x=xb;grp(name,()=>fn(x,w));xb+=w+gap;};
  const two=(x,y,w,h,a,b,o)=>txt(x,y,w,h,[{t:a,s:LS(11.5),b:1,c:(o&&o.c)||G.ink,br:1},{t:b,s:Math.max(8,LS(9)),c:(o&&o.c2)||G.t2}],{lsp:1.05,valign:'middle',name:'文字'});
  place(ws[0],'圖示＋流程方塊',(x,w)=>{box(x,yb,w,hb,{fill:W2,line:G.line,lw:1,r:PR,name:'流程方塊'});icon('precision_manufacturing',x+.14,yb+(hb-.4)/2,.4);two(x+.66,yb,w-.74,hb,'設備保養','每月 PM 排程');});
  place(ws[1],'淺色圓底＋說明',(x,w)=>{icon('frame_inspect',x,yb+(hb-.56)/2,.56,{variant:'tint'});two(x+.68,yb,w-.7,hb,'線上檢測','AOI 全檢・即時回饋');});
  place(ws[2],'深色圓底＋卡片',(x,w)=>{cardBase(x,yb,w,hb,{sh:'small'});icon('neurology',x+.14,yb+(hb-.46)/2,.46,{variant:'solid'});two(x+.72,yb,w-.8,hb,'AI 判片','自動分類缺陷');});
  place(ws[3],'數字＋圖示',(x,w)=>{box(x,yb,w,hb,{fill:GF,r:PR,name:'淺灰面板'});
   txt(x+.16,yb+.06,w-.7,.4,[{t:'98.6',s:22,b:1,c:P,f:nf},{t:' %',s:10,c:G.t2}],{valign:'bottom',name:'數值'});txt(x+.16,yb+.47,w-.7,.2,'整體良率',{size:Math.max(8,LS(9)),color:G.t2,name:'指標名稱'});
   icon('verified',x+w-.56,yb+(hb-.4)/2,.4);});
  place(w5,'圖示流程',(x,w)=>{const d=.44,sp=(w-d)/2;const B=[['wafer','投片'],['frame_inspect','檢測'],['build','改善']].map(([id,t],i)=>{const xi=x+i*sp;
    const r=icon(id,xi,yb+.02,d,{variant:i===2?'solid':'tint'});txt(xi-.3,yb+d+.06,d+.6,.2,t,{size:Math.max(8,LS(9)),color:G.t2,align:'center',name:'圖說'});return r.bg;});
   link(B[0],6,B[1],2);link(B[1],6,B[2],2);});};
 SL.guide=()=>{title('風格規範','色彩、字級與元件語言一覽'+(st.desc?'：'+st.desc.split('，')[0]:''));
  section(X0,1.95,5.5,'色彩 Palette');
  const sw=[[P,'主色'],[PD,'深色'],[PTn,'淺色']].concat(HASA?[[A,'輔助色']]:[]).concat([[G.ink,'文字'],[G.mute,'註解'],[G.line,'框線'],[G.fill,'底色']]);
  sw.forEach(([c,l],i)=>{const x=X0+i*.69;box(x,2.55,.54,.54,{fill:c,line:mix(c,'FFFFFF',0)===c&&parseInt(c,16)>0xE0E0E0?G.l2:null,lw:.75,r:st.r>0?Math.min(st.r,.1):0});
   txt(x-.08,3.16,.7,.24,l,{size:10,color:G.ink,align:'center'});txt(x-.12,3.38,.78,.2,'#'+c,{size:7.5,color:G.mute,align:'center',font:nf});});
  section(X0,3.88,5.5,'字級 Typography');
  txt(X0,4.3,5.5,.66,[{t:'大標題文字',s:Math.min(32,st.tSize),b:st.tBold,f:st.tFont,c:titleColor},{t:'   '+st.tSize+'pt',s:10,c:G.mute,f:nf}]);
  txt(X0,5.02,5.5,.36,[{t:'副標題・細字主色',s:16,c:subC,f:FL},{t:'   16pt',s:10,c:G.mute,f:nf}]);
  txt(X0,5.46,5.5,.34,[{t:'標籤與卡片標題',s:LS(15),b:st.lBold,c:G.ink},{t:'   '+st.lSize+'pt',s:10,c:G.mute,f:nf}]);
  txt(X0,5.88,5.5,.3,[{t:'內文說明文字，灰色、行距寬鬆',s:12,c:G.t2},{t:'   12pt',s:10,c:G.mute,f:nf}]);
  note(X0,6.26,5.5,'※ 註解文字以灰色呈現，'+st.nSize+'pt，放在版面下緣');
  const RX=6.75,RW=X1-RX;section(RX,1.95,RW,'元件語言 Shape Language');
  const rows=[['卡片','card'],['標籤','tag'],['編號','badge'],['分隔','sep'],['連接線','conn'],['流程鏈','chain']];
  rows.forEach(([l,k],i)=>{const y=2.55+i*.71,cy=y+.3;txt(RX,y,.9,.6,l,{size:13,bold:1,color:G.ink});
   txt(10.95,y,X1-10.95,.6,lang[k],{size:10,color:G.mute,wrap:1});
   const sx=7.75;
   if(k==='card'){cardBase(sx,y+.04,1.45,.52);if(st.card==='head')topRound(sx,y+.04,1.45,.18,rr(1.45,.52,st.r),{fill:P});cardBase(sx+1.65,y+.04,1.3,.52,{force:1});
    if(st.bandStyle==='line'){ln(sx+1.65,y+.22,sx+2.95,y+.22,{c:P,w:1.5});}else topRound(sx+1.65,y+.04,1.3,.18,rr(1.3,.52,st.r),{fill:st.card==='head'?A:P});}
   if(k==='tag'){let x=sx;x+=tag(x,cy-.16,'主要',{h:.32})+.12;x+=tag(x,cy-.16,'輔助',{tone:'a',h:.32})+.12;tag(x,cy-.16,'灰階',{tone:'g',h:.32});}
   if(k==='badge'){[1,2,3].forEach(n=>badge(sx+.24+(n-1)*.62,cy,bnum(n),{d:.4}));txt(sx+1.95,y,1.1,.6,'① ② ③',{size:14,color:G.t2});}
   if(k==='sep'){['輸入','處理','輸出'].forEach((w,j)=>{txt(sx+j*1.2,y,.6,.6,w,{size:12,color:G.t2,align:'center'});if(j<2)sep(sx+j*1.2+.9,cy);});}
   if(k==='conn'){conn([[sx,cy],[sx+1.3,cy]]);conn([[sx+1.6,y+.08],[sx+2.2,y+.08],[sx+2.2,y+.52],[sx+2.95,y+.52]]);}
   if(k==='chain')chain(sx,y+.08,3.0,.44,['規劃','執行','檢核'],{size:11});
   if(i<rows.length-1)ln(RX,y+.66,X1,y+.66,{c:mix(G.l2,'FFFFFF',.5),w:.5});});};

 SL.cards=()=>{title('卡片','標題＋內文、角落標籤、表頭強調三種基本卡片');
  const cw=3.73,gap=(CW-3*cw)/2,y=2.05,h=2.35;const xs=[0,1,2].map(i=>X0+i*(cw+gap));
  card(xs[0],y,cw,h,{head:'標題＋內文',en:'Card',body:'先用一句話說清楚重點，\n再以兩到三行補充說明。\n內文維持灰色、行距寬鬆，\n留白讓卡片更好讀。'});
  card(xs[1],y,cw,h,{head:'角落標籤卡片',body:'右上角的小標籤標示階段、\n分類或狀態，跨在邊框上，\n不佔用內文空間。',tag:st.cornerTag?'第一階段':null,tag2:st.cornerTag&&st.ribbonTone==='a'?'價值說明':null});
  card(xs[2],y,cw,h,{head:'表頭強調卡片',band:1,force:1,body:'以主色表頭強調，\n用來標出最重要的一張卡。\n同一頁建議只放一張。'});
  ['A｜基本卡片','B｜角標卡片','C｜強調卡片（含陰影）'].forEach((t,i)=>note(xs[i],y+h+.18,cw,t,{align:'center'}));
  section(X0,5.0,7.0,'標籤＋說明列');
  [['簡潔','一頁只講一個重點，讀者不費力'],['具體','用例子與數字說話，避免空泛'],['深入','提出觀點與洞見，留下記憶點']].forEach(([a,b],i)=>{const yy=5.58+i*.42;
   tag(X0,yy,a,{size:12,h:.32,w:.82,tone:i===1&&HASA&&st.tag!=='soft'?'a':'p'});txt(X0+1.0,yy,5.8,.32,b,{size:13,color:G.ink});});
  section(8.0,5.0,X1-8.0,'註解 Note');
  note(8.0,5.6,X1-8.0,'※ 註解用灰色小字，補充前提或資料來源。',{h:.3});
  note(8.0,6.0,X1-8.0,'※ 每張卡片內文以 3–4 行為上限。',{h:.3});};

 SL.tags=()=>{title('標籤與編號','單一標籤、堆疊清單、編號徽章與圈號清單');
  section(X0,1.95,CW,'單一標籤 Tags');
  let x=X0;const ty=2.55;
  [['主要標籤','p'],['輔助標籤','a'],['灰階標籤','g'],['外框標籤','o']].forEach(([t,tone])=>{x+=tag(x,ty,t,{tone,size:13,h:.38})+.3;});
  x+=.3;txt(x,ty,.9,.38,'小尺寸',{size:11,color:G.mute});x+=.8;
  ['元素','關聯','因果'].forEach((t,i)=>{x+=tag(x,ty+.04,t,{tone:i===0?'o':'g',size:10,h:.3})+.15;});
  const cw=3.79,gap=(CW-3*cw)/2;const cx=[0,1,2].map(i=>X0+i*(cw+gap));const y0=3.35;
  section(cx[0],y0,cw,'堆疊清單 Stacked');
  ['釐清溝通目的','對齊彼此期待','降低理解門檻','提升決策效率'].forEach((t,i)=>tag(cx[0],y0+.66+i*.62,t,{w:2.9,h:.42,size:13,tone:'p',sh:1}));
  section(cx[1],y0,cw,'編號 Badges');
  [1,2,3,4].forEach(n=>badge(cx[1]+.25+(n-1)*.62,y0+.88,bnum(n),{d:.42,alt:n===4&&HASA}));
  [['界定問題','先釐清要解決什麼'],['盤點現況','蒐集事實與數據'],['排序優先','聚焦影響最大處']].forEach(([a,b],i)=>{const yy=y0+1.6+i*.62;
   badge(cx[1]+.25,yy+.17,bnum(i+1),{d:.36});txt(cx[1]+.62,yy,1.2,.34,a,{size:13,bold:1,color:G.ink});txt(cx[1]+1.75,yy,cw-1.75,.34,b,{size:11,color:G.t2});});
  section(cx[2],y0,cw,'圈號清單 ①②③');
  ['① 釐清目的','② 拆解結構','③ 重新組合','④ 檢查一致'].forEach((t,i)=>txt(cx[2],y0+.65+i*.42,1.8,.34,t,{size:14,color:i===0?G.ink:G.t2,bold:i===0}));
  ['過濾數據','確認關係','產出圖表'].forEach((t,i)=>txt(cx[2]+2.0,y0+.65+i*.42,1.79,.34,'①②③'[i]+' '+t,{size:12,color:G.t2}));
  note(cx[2],y0+2.45,cw,'※ 清單 3–5 項最易記',{h:.28});};

 SL.circles=()=>{title('圓形與流程鏈','大外框圓＋疊放小圓，以及三段式流程鏈');
  section(X0,1.95,5.6,'大圓＋疊圓 Circles');
  const ccx=X0+2.8,ccy=3.95,R=1.38;bigCircle(ccx,ccy,R,'How','如何做到\n三個關鍵');
  [['觀察',143],['分析',90],['表達',37]].forEach(([t,a],i)=>{const r=a*Math.PI/180;smallCircle(ccx+R*Math.cos(r),ccy+R*Math.sin(r),.84,t,{hi:i===1});});
  const RX=6.9,RW=X1-RX;section(RX,1.95,RW,'流程鏈 Chain');
  chain(RX,2.62,RW,.72,['主題思考','主題定位','內容產出']);
  chain(RX,3.85,RW,.56,['願景','使命','目標','策略','戰術'],{size:LS(14)});
  chain(RX,4.95,RW,.56,['規劃','設計','執行','檢討'],{size:LS(14)});
  const cd=chainDims(RW,.56,4);
  ['界定範圍','產出方案','落實計畫','回顧改善'].forEach((t,i)=>txt(RX+i*cd.step,5.62,cd.iw,.3,t,{size:11,color:G.t2,align:'center'}));
  note(RX,6.3,RW,'※ 流程鏈以 3–5 個步驟為佳，重點步驟可用強調色');};

 SL.conn=()=>{title('連接線與箭頭','細直線、折線、點狀線、曲線、▶ 小三角與區塊箭號');const TL=st.cnTail==='none'?false:st.cnTail;
  const cw=(CW-3*.32)/4,cx=i=>X0+i*(cw+.32);
  const cells=['細直線 Straight','折線 Elbow','點狀線 Dotted','曲線 Curved','▶ 小三角分隔','▶▶▶ 點狀箭號','區塊箭號 Chevron','分支 Branch'];
  cells.forEach((l,i)=>{const r=Math.floor(i/4),c=i%4,x=cx(c),y=1.95+r*2.35;section(x,y,cw,l);
   const nw=.9,nh=.46,top=y+.75,mid=y+1.35;
   switch(i){
    case 0:{const a=node(x,mid-nh/2,nw,nh,'A'),b=node(x+cw-nw,mid-nh/2,nw,nh,'B');link(a,3,b,1,{style:{dash:'solid',tail:TL}});break;}
    case 1:{const a=node(x,top,nw,nh,'A'),b=node(x+cw-nw,top+1.0,nw,nh,'B');link(a,3,b,1,{style:{tail:TL}});break;}
    case 2:{const a=node(x,mid-nh/2,nw,nh,'A'),b=node(x+cw-nw,mid-nh/2,nw,nh,'B');link(a,3,b,1,{style:{dash:'sysDot',w:Math.max(1.25,st.cnW),tail:TL}});break;}
    case 3:node(x,top+.85,nw,nh,'A');node(x+cw-nw,top+.85,nw,nh,'B');curve([x+nw/2,top+.79],[x+nw/2,top-.05],[x+cw-nw/2,top-.05],[x+cw-nw/2,top+.79]);break;
    case 4:{const ws=['輸入','處理','輸出'];const gw=(cw-3*.62)/2;ws.forEach((t,j)=>{const xx=x+j*(.62+gw);txt(xx,mid-.2,.62,.4,t,{size:13,bold:1,color:G.ink,align:'center'});if(j<2)sep(xx+.62+gw/2,mid);});break;}
    case 5:node(x,mid-nh/2,nw,nh,'A');node(x+cw-nw,mid-nh/2,nw,nh,'B');sep(x+cw/2,mid,{kind:'dots',k:1.2});break;
    case 6:{const n=3,bw=(cw+2*.18)/3,ol=st.chain==='hairchev';for(let j=0;j<n;j++)el(j?'chevron':'homePlate',x+j*(bw-.18+.04),mid-.27,bw,.54,{fill:ol?'FFFFFF':(j===2&&HASA?A:mix(P,'FFFFFF',j*.25)),line:ol?P:null,lw:.75,adj:.18,text:['一','二','三'][j],size:13,bold:1,color:ol?P:'FFFFFF',margin:[2,2,0,0],name:'區塊箭號'});break;}
    case 7:{const t1=mid-.42-nh/2,t2=mid+.42-nh/2;const a=node(x,mid-nh/2,nw,nh,'A'),b1=node(x+cw-nw,t1,nw,nh,'B1'),b2=node(x+cw-nw,t2,nw,nh,'B2');const jx=x+nw+(cw-2*nw)/2;
     link(a,3,b1,1,{mid:jx});link(a,3,b2,1,{mid:jx});break;}}});
  note(X0,6.5,CW,'※ 直線、折線、點狀線、分支在 pptx 中是「黏著連接線」：移動圖形，線會跟著走（曲線為一般線條）');};

 SL.flow=()=>{title('流程圖符號','開始／結束、處理、判斷、輸入輸出、文件、資料庫');
  const items=[['term','開始','開始／結束','Terminator',1.5,.62],['proc','處理','處理','Process',1.6,.72],['dec','判斷','判斷','Decision',1.5,1.0],['io','輸入','輸入／輸出','Input / Output',1.7,.72],['doc','文件','文件','Document',1.5,.85],['db','資料庫','資料庫','Database',1.1,1.0]];
  const cw=CW/6;items.forEach(([k,t,zh,en,w,h],i)=>{const cx=X0+cw*i+cw/2;sym(k,cx-w/2,2.75-h/2,w,h,t,{strong:k==='term',alt:k==='dec'});
   txt(cx-cw/2,3.42,cw,.52,[{t:zh,s:12,b:1,c:G.ink,br:1},{t:en,s:9,c:G.mute,f:nf}],{align:'center'});});
  section(X0,4.12,CW,'基本流程範例');
  const cy=5.15;const ws=[1.25,1.8,1.7,1.6,1.6,1.25];const g=(CW-ws.reduce((a,b)=>a+b))/5;const xs=[];let xx=X0;ws.forEach(w=>{xs.push(xx);xx+=w+g;});
  const S=[sym('term',xs[0],cy-.3,ws[0],.6,'開始',{strong:1}),sym('io',xs[1],cy-.34,ws[1],.68,'輸入需求'),
  sym('dec',xs[2],cy-.5,ws[2],1.0,'是否可行？',{alt:1,size:LS(13)}),sym('proc',xs[3],cy-.34,ws[3],.68,'執行處理'),
  sym('doc',xs[4],cy-.4,ws[4],.8,'產出報告'),sym('term',xs[5],cy-.3,ws[5],.6,'結束',{strong:1})];
  link(S[0],3,S[1],5);link(S[1],2,S[2],1);link(S[2],3,S[3],1);link(S[3],3,S[4],1);link(S[4],3,S[5],1);
  txt(xs[2]+ws[2]+.02,cy-.42,g,.3,'是',{size:11,bold:1,color:G.t2,align:'center'});
  const dbx=xs[3]+ws[3]/2;const db=sym('db',dbx-.5,5.92,1.0,.82,'資料庫',{size:LS(12)});link(S[3],2,db,0,{style:{tail:'triangle',dash:'sysDash'}});
  const dx=xs[2]+ws[2]/2,ix=xs[1]+ws[1]/2;link(S[2],2,S[1],4,{via:[[dx,6.4],[ix,6.4]]});
  txt(dx+.1,cy+.62,.5,.3,'否',{size:11,bold:1,color:G.t2});};

 SL.struct=()=>{title('結構元件','樹狀分支、十字矩陣與半透明寬欄條');
  const LW=5.7;section(X0,1.95,LW,'樹狀分支 Tree');
  const cy=4.4,nh=.5;const bw=[.82,.92,.82,1.25];const g=(LW-bw.reduce((a,b)=>a+b))/3;const bx=[];let xx=X0;bw.forEach(w=>{bx.push(xx);xx+=w+g;});
  node(bx[0],cy-nh/2,bw[0],nh,'起點');
  const l2=[cy-.8,cy+.8];l2.forEach((yy,i)=>node(bx[1],yy-nh/2,bw[1],nh,['分支一','分支二'][i],{size:LS(12)}));
  node(bx[2],cy-nh/2,bw[2],nh,'整合',{strong:1});
  const l3=[cy-1.3,cy,cy+1.3];l3.forEach((yy,i)=>node(bx[3],yy-nh/2,bw[3],nh,['結果 A','結果 B','結果 C'][i],{size:LS(12)}));
  const ga=.06;const m1=bx[0]+bw[0]+g/2;
  l2.forEach(yy=>conn([[bx[0]+bw[0]+ga,cy],[m1,cy],[m1,yy],[bx[1]-ga,yy]],{tail:false}));
  const m2=bx[1]+bw[1]+g/2;l2.forEach(yy=>conn([[bx[1]+bw[1]+ga,yy],[m2,yy],[m2,cy],[bx[2]-ga,cy]],{tail:false}));
  const m3=bx[2]+bw[2]+g/2;l3.forEach(yy=>conn(yy===cy?[[bx[2]+bw[2]+ga,cy],[bx[3]-ga,cy]]:[[bx[2]+bw[2]+ga,cy],[m3,cy],[m3,yy],[bx[3]-ga,yy]],{tail:false}));
  const MX=6.75,MW=2.95;section(MX,1.95,MW,'十字矩陣 2×2');
  const mcx=MX+MW/2,mcy=4.4;ln(MX+.42,mcy,MX+MW-.42,mcy,{c:G.line,w:1});ln(mcx,2.95,mcx,5.85,{c:G.line,w:1});
  circ(mcx,mcy,.92,{fill:P,line:'FFFFFF',lw:2,sh:'small',text:'定位\n核心',size:12,bold:1,color:'FFFFFF',margin:0,lsp:.95,name:'中心圓'});
  [['吸引',-1,-1],['實用',1,-1],['好記',-1,1],['可信',1,1]].forEach(([t,sx,sy],i)=>tag(mcx+sx*.78,mcy+sy*.72-.15,t,{anchor:'center',size:11,h:.3,tone:i===1?'p':'g'}));
  txt(mcx-.6,2.6,1.2,.3,'具體',{size:11,color:G.t2,align:'center'});txt(mcx-.6,5.9,1.2,.3,'抽象',{size:11,color:G.t2,align:'center'});
  txt(MX-.05,mcy-.15,.45,.3,'感性',{size:11,color:G.t2,align:'center'});txt(MX+MW-.4,mcy-.15,.45,.3,'理性',{size:11,color:G.t2,align:'center'});
  const CX=10.1,CWd=X1-CX;section(CX,1.95,CWd,'寬欄透明條 Columns');
  const b1=CX+1.0,b2=CX+1.85,bwid=.62;
  txt(b1-.2,2.5,bwid+.4,.3,'輸入',{size:11,bold:1,color:G.t2,align:'center'});txt(b2-.2,2.5,bwid+.4,.3,'輸出',{size:11,bold:1,color:G.t2,align:'center'});
  colBar(b1,2.85,bwid,3.4);colBar(b2,2.85,bwid,3.4);
  [['階段一','看','練'],['階段二','問','談'],['階段三','想','寫']].forEach(([l,a,b],i)=>{const yy=3.5+i*1.05;txt(CX,yy-.17,.9,.34,l,{size:11,color:G.t2});badge(b1+bwid/2,yy,a,{d:.46,size:13,nodot:1});badge(b2+bwid/2,yy,b,{d:.46,size:13,nodot:1});});};

 SL.ex1=()=>{title('高效溝通：讓想法被看見','關鍵在於把資訊整理成對方能理解的結構');
  const R=1.3,cy=3.3,cxs=[X0+CW/6,X0+CW/2,X0+CW*5/6];
  [['Why','為何要重視\n溝通品質'],['How','溝通的\n三個關鍵'],['What','呈現的\n三個層次']].forEach(([b,t],i)=>bigCircle(cxs[i],cy,R,b,t));
  sep((cxs[0]+cxs[1])/2,cy,{k:1.2});sep((cxs[1]+cxs[2])/2,cy,{k:1.2});
  const sm=[['觀察',143],['分析',90],['表達',37]].map(([t,a])=>{const r=a*Math.PI/180;return[t,cxs[1]+R*Math.cos(r),cy+R*Math.sin(r)];});
  sm.forEach(([t,x,y],i)=>smallCircle(x,y,.8,t,{hi:i===1}));
  const lists=[['蒐集','篩選','歸納'],['比較','拆解','連結'],['聚焦','排序','呈現']];
  sm.forEach(([t,x],i)=>txt(x-.42,5.15,.95,1.05,lists[i].map((w,j)=>({t:'①②③'[j]+' '+w,br:1})),{size:11.5,color:G.t2,valign:'top',lsp:1.2}));
  [[0,['節省理解時間','對齊彼此認知','提升決策效率']],[2,['資料','資訊','洞見']]].forEach(([ci,ws])=>ws.forEach((w,j)=>tag(cxs[ci],5.0+j*.55,w,{anchor:'center',w:2.3,h:.42,size:13,sh:1})));
  note(X0,6.58,CW,'※ 三個圓依序回答 Why／How／What，中間的小圓拆出方法，左右兩側以清單補充',{align:'center'});};

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
  const grp=(x,y,nums,label,o)=>{let xx=x;nums.forEach(q=>{const w=bwid();badge(xx+w/2,y+.16,two(q),{d:.34,size:11});xx+=w+.07;});tag(xx+.03,y,label,{size:11,h:.32,tone:(o&&o.tone)||'p'});};
  grp(X0,2.05,[1,2],'界定問題');grp(X0,2.55,[3,4],'排序優先');
  grp(bx(4)-.1,2.05,[5,6],'設定目標',{tone:'g'});grp(bx(4)-.1,2.55,[7,8],'規劃路徑',{tone:'g'});
  const oy=5.55,oh=.6;cardBase(X0,oy,CW,oh);txt(X0,oy,CW,oh,[{t:'組織',s:LS(18),b:st.lBold,c:G.ink},{t:'  Organization',s:11,c:G.mute,f:nf}],{align:'center'});
  [[[9,10],'凝聚共識'],[[11,12],'提升能力'],[[13],'資訊透明'],[[14,15],'激勵動機']].forEach(([ns,l],i)=>grp(X0+CW*(i+.5)/4-grpW(ns,l)/2,6.37,ns,l,{tone:i%2?'g':'p'}));};

 SL.ex3=()=>{title('能力成長地圖','從個人特質到可遷移能力的三階段路徑');
  const cy=4.45,ys=[3.0,4.45,5.9];
  fadeArrow(6.08,2.55,.78,4.15,'down');
  txt(6.98,6.3,1.3,.34,'成長路徑',{size:12,bold:1,color:A});
  node(X0,cy-.3,.95,.6,'特質',{size:LS(15)});note(X0-.1,cy+.38,1.15,'個性、動機\n與價值觀',{h:.5,align:'center',wrap:1});
  node(2.05,3.55-.27,1.0,.54,'知識',{size:LS(14)});node(2.05,5.35-.27,1.0,.54,'技能',{size:LS(14)});
  note(2.0,3.0,1.1,'知道是什麼',{h:.26,align:'center'});note(2.0,5.66,1.1,'知道怎麼做',{h:.26,align:'center'});
  node(3.55,cy-.3,.95,.6,'能力',{size:LS(15),strong:1});note(3.45,cy+.38,1.15,'能產生價值',{h:.26,align:'center'});
  const m1=(X0+.95+2.05)/2;[3.55,5.35].forEach(y=>conn([[X0+.95+.06,cy],[m1,cy],[m1,y],[2.05-.06,y]],{tail:false}));
  const m2=(3.05+3.55)/2;[3.55,5.35].forEach(y=>conn([[3.05+.06,y],[m2,y],[m2,cy],[3.55-.06,cy]],{tail:false}));
  const cx=5.25,cw=2.0,ch=.72;const m3=(4.5+cx)/2;
  ys.forEach(y=>conn(y===cy?[[4.5+.06,cy],[cx-.06,cy]]:[[4.5+.06,cy],[m3,cy],[m3,y],[cx-.06,y]],{tail:false}));
  [['執行實踐','前期','打基礎'],['溝通協作','中期','擴影響'],['整合創新','後期','建槓桿']].forEach(([t,a,b],i)=>{const y=ys[i]-ch/2;
   cardBase(cx,y,cw,ch);txt(cx,y,cw,ch,t,{size:LS(16),bold:st.lBold,color:lblC,align:'center'});
   if(st.cornerTag){ribbon(cx+cw-.15,y,a,'p','right');ribbon(cx+.15,y+ch,b,'g','left');}});
  const b1=7.75,b2=8.55,bw=.6;colBar(b1,2.25,bw,4.25);colBar(b2,2.25,bw,4.25);
  txt(b1-.35,1.92,bw*2+.8+.1,.3,'吸收　／　產出',{size:11,bold:1,color:G.t2,align:'center'});
  [['看','練'],['問','談'],['想','寫']].forEach(([a,b],i)=>{badge(b1+bw/2,ys[i],a,{d:.48,size:14,nodot:1});badge(b2+bw/2,ys[i],b,{d:.48,size:14,nodot:1});
   conn([[cx+cw+.08,ys[i]],[b1+bw/2-.3,ys[i]]],{head:false,tail:false,c:G.line,w:1,dash:'solid'});});
  const dx=9.75,dw=2.3;const desc=[['流程操作、工具使用','標準作業與規範'],['表達、傾聽、協調','提案、談判、領導'],['結構思考、問題解決','資源整合、創新']];
  desc.forEach((d,i)=>{const y=ys[i];const yy=[y-.32,y+.32];const jx=b2+bw+.25;
   conn([[b2+bw/2+.3,y],[jx,y]],{head:false,tail:false});
   yy.forEach((t,j)=>{conn([[jx,y],[jx,t],[dx-.08,t]],{tail:false});txt(dx,t-.15,dw,.3,d[j],{size:11,color:G.t2});});});
  fadeBar(12.3,2.25,.38,4.25,G.l1);
  txt(11.35,1.92,1.4,.3,'情境限定',{size:10,bold:1,color:G.t2,align:'right'});txt(11.35,6.55,1.4,.3,'跨域通用',{size:10,bold:1,color:A,align:'right'});};

 if(opt.icon||opt.table){const kk=SIZE_K[st.size]||1;sno=1;cur={key:opt.icon?'icon':'table',title:opt.icon?'圖示':'表格',no:1,items:[],groups:[]};slides.push(cur);
  if(opt.icon)oneIcon(opt.icon,kk);else userTable(opt.table,kk);return{slides,warns,params:st,k:kk,custom:true};}
 /* 單一圖示投影片：pic＝SVG 圖片（PNG 備援，PowerPoint 365 可「轉換成圖案」）；否則＝原生自訂圖案 */
 function oneIcon(o,k){const ic=ICONS&&ICONS.BY[o.id];if(!ic)throw new Error('沒有這個圖示：'+o.id);const s=(o.size||.6)*k,x=(W-s)/2,y=(H-s)/2;
  if(o.pic){cur.items.push({t:'pic',x,y,w:s,h:s,png:o.png,svg:o.svg,name:'圖示 '+ic.zh});cur.groups.push({name:ic.zh,from:0,to:0,x,y,w:s,h:s});return;}
  grp(ic.zh,()=>icon(o.id,x,y,s,{variant:o.variant}));}
 /* 使用者表格（v7 重新設計）：貼上的資料 → 原生 PowerPoint 表格。
    外觀（tbLook）＝一組完整、已調好的設計（表頭、分隔線、底板、強調方式）；自動判斷表頭、數字欄、狀態欄、小節列、合計列。
    只畫橫線（表頭底線＋細分隔線），數字靠右、同寬，強調只用一種顏色。預覽、匯出、HTML 複製共用這份 model。 */
 function userTable(T,k){const raw=(T.rows||[]).filter(r=>r&&r.some(c=>String(c==null?'':c).trim()!==''));if(!raw.length)return;
  const nC=Math.max(...raw.map(r=>r.length));const rows=raw.map(r=>{const a=r.map(c=>String(c==null?'':c).replace(/\r/g,'').trim());while(a.length<nC)a.push('');return a;});
  let AU=tableAuto(rows);const head=T.header==null||T.header==='auto'?AU.head:!!T.header,h0=head?1:0;
  // 一張投影片最多 25 列資料（PowerPoint 有最小列高，再多就會超出投影片）：多的不放，並提示拆表
  const MAXR=25;if(rows.length-h0>MAXR){const n=rows.length-h0;rows.length=h0+MAXR;AU=tableAuto(rows);warn('表格列數過多',`共 ${n} 列，只放前 ${MAXR} 列；請拆成多張表或先摘要`);}
  const lookId=TABLE_LOOKS.some(l=>l[0]===st.tbLook)?st.tbLook:(st.tbPanel?'panel':'clean');
  const dense=st.tbDense==='compact';
  const LK={
   clean:{hdr:{color:G.ink,bB:{c:P,w:1.5}},row:{c:G.l2,w:.5},last:{c:G.line,w:1},key:{c:G.ink,w:.75},hi:'fill'},
   minimal:{hdr:{color:G.mute,small:1,bB:{c:G.line,w:.75}},row:null,last:{c:G.l2,w:.75},key:{c:G.l2,w:.75},hi:'fill',air:1.1},
   zebra:{hdr:{color:G.t2,bB:{c:G.line,w:1}},row:null,zebra:mix(G.fill,'FFFFFF',.15),last:null,key:null,hi:'fill'},
   band:{hdr:{fill:P,color:'FFFFFF'},row:{c:G.l2,w:.5},last:{c:P,w:1},key:{c:G.ink,w:.75},hi:'fill'},
   panel:{panel:1,hdr:{color:P,bB:{c:P,w:1.25}},row:{c:'FFFFFF',w:1.25},last:null,key:null,hi:'box'},
   card:{card:1,hdr:{fill:PTn,color:PD},row:{c:G.l2,w:.5},last:null,key:{c:G.line,w:.75},hi:'fill'}}[lookId];
  const hiMode=st.tbHiMode==='fill'||st.tbHiMode==='box'?st.tbHiMode:LK.hi;
  const HC=st.tbHiColor==='alert'?AL:st.tbHiColor==='A'?(HASA?A:PD):st.tbHiColor==='P'?P:(hiMode==='box'?AL:P);
  const HT=mix(HC,'FFFFFF',.88);
  let fs=(dense?10.5:12)*k;let hfs=fs*(LK.hdr.small?.86:.94);let pad=(dense?6:8)*k;
  const air=LK.air||1;let rh=(dense?.31:.4)*k*air;
  const ST={good:'2E7D4F',prog:'B7791F',risk:AL,mark:P,weak:G.mute};
  const bold=new Set((Array.isArray(T.bold)?T.bold:AU.key).map(Number));const al=T.align||{};
  const colAl=Array.from({length:nC},(_,c)=>al[c]||(c===0?'left':AU.numC[c]?'right':AU.statC[c]?'center':'left'));
  const isHiC=c=>T.hi&&T.hi.type==='col'&&T.hi.i===c,isHiR=r=>T.hi&&T.hi.type==='row'&&T.hi.i===r;
  const measureW=(t,size,b)=>Math.max(...String(t).split('\n').map(l=>tw(l,size)*(b?1.07:1)));
  let colW=Array.from({length:nC},(_,c)=>Math.max(c===0?1.1*k:.7*k,...rows.map((r,ri)=>AU.section[ri]&&c===0?0:measureW(r[c],ri<h0?hfs:fs,ri<h0||bold.has(ri)||isHiC(c))))+2*pad/72+.06*k);
  const numIdx=colW.map((_,c)=>c).filter(c=>c>0&&(AU.numC[c]||AU.statC[c]));
  if(numIdx.length>=2){const m=Math.max(...numIdx.map(c=>colW[c]));numIdx.forEach(c=>colW[c]=m);}   // 數字欄同寬：欄與欄的節奏一致
  AU.section.forEach((s,ri)=>{if(s)colW[0]=Math.max(colW[0],Math.min(measureW(rows[ri][0],fs,1)+2*pad/72,colW[0]*1.6));});
  const frame=(LK.panel?.26:LK.card?.22:0)*k;
  const maxW=W-2*X0-2*frame,minW=Math.min(maxW,(nC>=5?8.6:nC>=3?7:5.2)*k);let sum=colW.reduce((a,b)=>a+b,0);
  // 單欄最多佔表格可用寬度的 45%：一格很長的中文說明會換行，不會把其他欄擠扁
  {const cap=.45*maxW;if(nC>1&&colW.some(w=>w>cap)){colW=colW.map(w=>Math.min(w,cap));sum=colW.reduce((a,b)=>a+b,0);}}
  if(sum<minW){const ex=minW-sum;const rest=nC>1?nC-1:0;colW=colW.map((w,c)=>w+(nC===1?ex:c===0?ex*.3:ex*.7/rest));}
  else if(sum>maxW){const f=maxW/sum;colW=colW.map(w=>w*f);fs*=Math.max(.72,f);hfs*=Math.max(.72,f);pad*=Math.max(.72,f);if(f<.85)warn('表格太寬','字級已縮小，或請減少欄位');}
  const lines=t=>String(t).split('\n').length;
  const wrapN=(t,size,b,cw)=>String(t).split('\n').reduce((a,l)=>a+Math.max(1,Math.ceil(tw(l,size)*(b?1.07:1)/Math.max(.2,cw-2*pad/72-.04))),0);
  const cellN=(r,ri)=>Math.max(...r.map((t,c)=>wrapN(t,ri<h0?hfs:fs,ri<h0||bold.has(ri),colW[c])));
  let rowH=rows.map((r,ri)=>{const base=ri<h0?rh*1.05:AU.section[ri]?rh*.95:rh;return Math.max(base,cellN(r,ri)*(ri<h0?hfs:fs)*1.25/72+.14*k);});
  const tW=colW.reduce((a,b)=>a+b,0);
  const titH=T.title?.5*k+.16*k:0,unitH=T.unit?.28*k:0,noteN=T.note?lines(T.note):0,noteH=noteN?noteN*.19*k+.14*k:0;
  let tH=rowH.reduce((a,b)=>a+b,0);const avail=H-.8-titH-unitH-noteH-2*frame;
  if(tH>avail){const f=avail/tH;fs*=Math.max(.7,f);hfs*=Math.max(.7,f);
   // 列高下限＝字級需要的高度（PowerPoint 不會讓列比文字矮，硬壓只會讓表格超出投影片）
   rowH=rowH.map((h,ri)=>Math.max(h*f,cellN(rows[ri],ri)*(ri<h0?hfs:fs)*1.2/72+2*Math.max(1,2*k)/72));tH=rowH.reduce((a,b)=>a+b,0);
   if(tH>avail+.01)warn('表格太高',`字級已縮到最小仍放不下（約超出 ${(tH-avail).toFixed(1)} 吋）；請減少列數或拆成多張表`);else if(f<.8)warn('表格太高','列高與字級已縮小，或請減少列數');}
  const blockH=titH+unitH+tH+noteH+2*frame;const top=Math.max(.4,(H-blockH)/2);
  const tx=(W-tW)/2;let y=top;
  if(T.title){txt(tx-frame,y,tW+2*frame,.5*k,T.title,{size:20*k,bold:1,color:titleColor,font:st.tFont,name:'表格標題',valign:'bottom'});y+=titH;}
  const fy=y;
  if(LK.panel)box(tx-frame,fy,tW+2*frame,unitH+tH+noteH+1.6*frame-(noteH?.06*k:0),{fill:G.fill,r:.14*k,name:'灰色底板'});
  if(LK.card)box(tx-frame,fy,tW+2*frame,unitH+tH+noteH+1.6*frame-(noteH?.06*k:0),{fill:'FFFFFF',line:G.line,lw:.75*k,r:.12*k,name:'外框卡片'});
  y+=frame;
  if(T.unit){txt(tx,y,tW,.24*k,T.unit,{size:9*k,color:G.mute,align:'right',name:'單位'});y+=unitH;}
  const ty=y;const bw=b=>b?{c:b.c,w:b.w*k}:null;
  const cells=rows.map((r,ri)=>r.map((t,c)=>{const align=colAl[c];const isN=AU.numC[c]&&ri>=h0;const font=isN?nf:F;
   if(ri<h0){const o={t,bold:1,size:hfs,align,font:F,color:LK.hdr.color,fill:LK.hdr.fill||null,bB:bw(LK.hdr.bB)};
    if(hiMode==='fill'&&isHiC(c)){if(LK.hdr.fill){o.fill=HC===LK.hdr.fill?mix(HC,'000000',.25):HC;o.color='FFFFFF';}else{o.fill=HT;o.color=HC;}}
    return o;}
   const last=ri===rows.length-1,key=bold.has(ri),sec=AU.section[ri];
   const o={t,size:fs,align,font,bold:key||sec,color:sec?PD:G.ink,fill:null,bB:bw(last?(LK.last||LK.row):LK.row)};
   if(LK.zebra&&(ri-h0)%2===1)o.fill=LK.zebra;
   if(key&&LK.key&&ri>h0)o.bT=bw(LK.key);
   const s=st.tbStatus===false?null:statusOf(t);if(s){o.color=ST[s];o.bold=true;if(s==='good'||s==='prog'||s==='risk')o.fill=mix(ST[s],'FFFFFF',.88);}
   if(isN&&st.tbNeg&&/^[\s(（]*[-−▼]|^\s*[(（]/.test(t))o.color=AL;
   if(hiMode==='fill'&&(isHiC(c)||isHiR(ri))){if(!s)o.fill=HT;o.bold=true;}
   return o;}));
  const tb=table(tx,ty,colW,rowH,cells,{mL:pad,mT:Math.max(1,2*k),name:'表格'});
  if(T.note)txt(tx,ty+tH+.1*k,tW,noteN*.19*k,T.note,{size:8.5*k,color:G.mute,valign:'top',wrap:1,lsp:1,name:'註腳'});
  const hi=T.hi||{};
  if(hiMode==='box'){
   if(hi.type==='col'&&hi.i>=0&&hi.i<nC){const x=tx+colW.slice(0,hi.i).reduce((a,b)=>a+b,0);box(x+.01*k,ty-.04*k,colW[hi.i]-.02*k,tH+.08*k,{line:HC,lw:1.75*k,r:.07*k,name:'強調框'});}
   if(hi.type==='row'&&hi.i>=0&&hi.i<rows.length){const yy=ty+rowH.slice(0,hi.i).reduce((a,b)=>a+b,0);box(tx-.05*k,yy+.01*k,tW+.1*k,rowH[hi.i]-.02*k,{line:HC,lw:1.75*k,r:.07*k,name:'強調框'});}}
  cur.table={tx,ty,tW,tH,colW,rowH,h0,nC,nR:rows.length,look:lookId,hiMode,colNum:AU.numC,hi:hiMode==='box'&&(hi.type==='col'||hi.type==='row')?Object.assign({color:HC},hi):null,unit:T.unit||'',note:T.note||'',title:T.title||'',font:F,nf};}
 SLIDES.forEach(([k,zh],i)=>{if(opt.only&&!opt.only.includes(k))return;if(!opt.only&&opt.examples===false&&/^ex\d/.test(k))return;/* 12–14 範例頁（主題式版面）：studio 預設不含，勾「含範例頁」才加 */sno=i+1;cur={key:k,title:zh,no:i+1,items:[],groups:[]};slides.push(cur);canvas();SL[k]();footer();});
 const k=SIZE_K[st.size]||1;if(k!==1)slides.forEach(sl=>scaleSlide(sl,k));
 return{slides,warns,params:st,W:W*k,H:H*k,k};}
/* ---------- S／M／L 元件尺寸（v5.2）：整頁幾何、字級、線寬、陰影一起等比縮放，投影片也同比例（仍是 16:9）。
   所以每一頁都放得下；把元件複製到標準 13.33×7.5 吋簡報時，實際大小就是 ×0.8／×1／×1.25。 ---------- */
/* ---------- 表格：自動判斷（v7）——表頭、數字欄、狀態欄、小節列、合計列 ---------- */
const TABLE_LOOKS=[['clean','細線'],['panel','灰底面板'],['band','主色表頭'],['minimal','極簡'],['zebra','斑馬紋'],['card','外框卡片']];
const T_NUM=/^[\s(（]*[-−+±▲▼△▽]?\s*(?:NT\$|US\$|\$|＄|€|¥)?\s*(?:\d{1,3}(?:,\d{3})+|\d+)?(?:\.\d+)?\s*(?:%|％|x|X|倍|ppts?|pts?|bps|[KkMmBb]|億|萬|元|天|週|日|h|hr|小時|件|台|片)?\s*[)）]?\s*$/;
const tIsNum=t=>/\d/.test(t)&&T_NUM.test(t),tBlank=t=>/^\s*(|-|—|–|n\/a|NA|N\/A)\s*$/.test(t);
const ST_RE={good:/^(✓|✔|☑|完成|已完成|達成|已達成|正常|通過|OK|Ok|ok|Done|DONE|Pass|PASS|On track|綠燈?)(\s|$|（|\()/,prog:/^(◐|進行中|執行中|處理中|In progress|WIP|黃燈?|待確認|規劃中)(\s|$|（|\()/,risk:/^(✗|✘|×|NG|風險|高風險|延遲|落後|異常|未達成?|Risk|Delay(ed)?|Fail|FAIL|紅燈?|卡關)(\s|$|（|\()/,mark:/^(●|◎)$/,weak:/^(○|△|－|未開始|待定|暫停|N\/A)(\s|$|（|\()/};
function statusOf(t){t=String(t||'').trim();if(!t||t.length>14)return null;for(const k in ST_RE)if(ST_RE[k].test(t))return k;return null;}
function tableAuto(rows){const nC=Math.max(0,...rows.map(r=>r.length));const cell=(r,c)=>String((rows[r]||[])[c]==null?'':rows[r][c]).trim();
 const r0=Array.from({length:nC},(_,c)=>cell(0,c)).filter(t=>t);const head=rows.length>1&&r0.length>0&&r0.filter(tIsNum).length/r0.length<.34;const h0=head?1:0;
 const section=rows.map((r,ri)=>ri>=h0&&nC>=3&&cell(ri,0)!==''&&Array.from({length:nC-1},(_,c)=>cell(ri,c+1)).every(t=>t===''));
 const colStat=(c,f)=>{let n=0,y=0;for(let r=h0;r<rows.length;r++){if(section[r])continue;const t=cell(r,c);if(tBlank(t))continue;n++;if(f(t))y++;}return n>0&&y/n>=.6;};
 const numC=Array.from({length:nC},(_,c)=>c>0&&colStat(c,tIsNum));
 const statC=Array.from({length:nC},(_,c)=>c>0&&!numC[c]&&colStat(c,t=>!!statusOf(t)));
 const KEY=/^(合計|總計|小計|總額|總和|淨利|稅後淨利|本期淨利|營業利益|毛利|每股盈餘|EPS|Total|Subtotal|Grand total|Net income|Net profit)/i;
 const key=[];rows.forEach((r,ri)=>{if(ri>=h0&&!section[ri]&&KEY.test(cell(ri,0))&&/合計|總計|小計|總額|總和|Total|Subtotal/i.test(cell(ri,0)))key.push(ri);});
 const kind=numC.filter(Boolean).length>=Math.max(1,(nC-1)/2)?'number':statC.some(Boolean)?'status':'text';
 return{nC,head,numC,statC,section,key,kind};}
const SIZE_K={S:.8,M:1,L:1.25};
function scaleSlide(sl,k){const r2=v=>Math.round(v*k*2)/2,f=v=>v*k,r100=v=>Math.round(v*k*100)/100;
 const runs=rs=>rs&&rs.forEach(r=>{r.o.size=r2(r.o.size);if(r.o.cs)r.o.cs=r100(r.o.cs);});
 sl.items.forEach(it=>{
  if(it.t==='ln'){it.x1=f(it.x1);it.y1=f(it.y1);it.x2=f(it.x2);it.y2=f(it.y2);it.w=r100(it.w);return;}
  it.x=f(it.x);it.y=f(it.y);it.w=f(it.w);it.h=f(it.h);
  if(it.t==='tbl'){it.colW=it.colW.map(f);it.rowH=it.rowH.map(f);
   it.cells.forEach(r=>r.forEach(c=>{runs(c.runs);c.size=r2(c.size);c.mL=Math.max(1,r100(c.mL));c.mT=Math.max(1,r100(c.mT));   /* PptxGenJS：表格 margin[0]<1 會被當成英吋 → 下限 1pt */['bT','bB'].forEach(b=>{if(c[b])c[b]=Object.assign({},c[b],{w:r100(c[b].w)});});}));return;}
  if(it.adj)it.adj=f(it.adj);if(it.lw)it.lw=r100(it.lw);
  if(it.sites)it.sites=it.sites.map(q=>[f(q[0]),f(q[1]),q[2]]);
  if(it.points)it.points.forEach(p=>{if(p.close)return;p.x=f(p.x);p.y=f(p.y);const c=p.curve;if(c){['x1','y1','x2','y2','hR','wR'].forEach(q=>{if(c[q]!=null)c[q]=f(c[q]);});}});
  if(it.sh)it.sh=Object.assign({},it.sh,{blur:r100(it.sh.blur),dist:r100(it.sh.dist)});
  if(it.runs){runs(it.runs);it.tx.size=r2(it.tx.size);it.tx.margin=Array.isArray(it.tx.margin)?it.tx.margin.map(r100):r100(it.tx.margin);if(it.tx.cs)it.tx.cs=r100(it.tx.cs);}});
 (sl.groups||[]).forEach(g=>{g.x=f(g.x);g.y=f(g.y);g.w=f(g.w);g.h=f(g.h);});
 sl.W=W*k;sl.H=H*k;sl.k=k;}

/* ================= PptxGenJS 匯出 ================= */
function lum(h){const v=[0,2,4].map(i=>parseInt(h.substr(i,2),16)/255);return .2126*v[0]+.7152*v[1]+.0722*v[2];}
function bboxOf(items){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
 items.forEach(it=>{if(it.t==='ln'){x0=Math.min(x0,it.x1,it.x2);x1=Math.max(x1,it.x1,it.x2);y0=Math.min(y0,it.y1,it.y2);y1=Math.max(y1,it.y1,it.y2);}
  else{x0=Math.min(x0,it.x);y0=Math.min(y0,it.y);x1=Math.max(x1,it.x+it.w);y1=Math.max(y1,it.y+it.h);}});
 return{x:x0,y:y0,w:Math.max(x1-x0,.01),h:Math.max(y1-y0,.01)};}
function ahType(t,sz){return t?(sz&&sz!=='med'?`${t}" w="${sz}" len="${sz}`:t):undefined;}
function toPptx(pptx,model){
 if(model.W&&Math.abs(model.W-W)>.001){pptx.defineLayout({name:'KIT_'+model.k,width:model.W,height:model.H});pptx.layout='KIT_'+model.k;}else pptx.layout='LAYOUT_WIDE';pptx.title='精緻圖解元件庫 · '+(model.params.zh||'自訂風格');pptx.author='PPT Style Studio';
 model.slides.forEach(sl=>{const s=pptx.addSlide();s.background={color:'FFFFFF'};
  sl.items.forEach(it=>{
   if(it.t==='tbl'){const bd=b=>b?{type:'solid',pt:b.w,color:b.c}:{type:'none'};
    const rows=it.cells.map(r=>r.map(c=>({text:c.runs.map(rn=>({text:rn.t,options:Object.assign({fontSize:rn.o.size,fontFace:rn.o.font,bold:rn.o.bold,color:rn.o.color},rn.o.br?{breakLine:true}:{})})),
     options:Object.assign({align:c.align,valign:'middle',margin:[c.mT,c.mL,c.mT,c.mL],border:[bd(c.bT),{type:'none'},bd(c.bB),{type:'none'}]},c.fill?{fill:{color:c.fill}}:{})})));
    s.addTable(rows,{x:it.x,y:it.y,w:it.w,colW:it.colW,rowH:it.rowH,autoPage:false});return;}
   if(it.t==='pic'){s.addImage({data:it.png,x:it.x,y:it.y,w:it.w,h:it.h,objectName:it.name||'圖片'});return;}
   if(it.t==='ln'){const L={color:it.color,width:it.w,dashType:it.dash};if(it.head)L.endArrowType=ahType(it.head,it.hs);if(it.tail)L.beginArrowType=ahType(it.tail,it.hs);
    s.addShape('line',{x:Math.min(it.x1,it.x2),y:Math.min(it.y1,it.y2),w:Math.abs(it.x2-it.x1),h:Math.abs(it.y2-it.y1),flipH:it.x2<it.x1,flipV:it.y2<it.y1,line:L,objectName:'線條'});return;}
   const p={x:it.x,y:it.y,w:it.w,h:it.h};if(it.name)p.objectName=it.name;
   if(it.kind){p.shape=it.doc?'flowChartDocument':it.kind;p.fill=it.fill?{color:it.fill,transparency:it.ft||0}:{type:'none'};
    p.line=it.line?{color:it.line,width:it.lw,dashType:it.dash}:{type:'none'};if(it.line&&it.head)p.line.endArrowType=ahType(it.head,it.hs);if(it.line&&it.tail)p.line.beginArrowType=ahType(it.tail,it.hs);}
   if(it.adj)p.rectRadius=it.adj;if(it.points&&!it.doc)p.points=it.points;
   if(it.sh)p.shadow={type:'outer',blur:it.sh.blur,offset:it.sh.dist,angle:it.sh.dir,color:it.sh.color,opacity:it.sh.alpha};
   let runs='';
   if(it.runs){const T=it.tx;runs=it.runs.map(r=>{const o={fontSize:r.o.size,fontFace:r.o.font,bold:r.o.bold,color:r.o.color};if(r.o.cs!=null)o.charSpacing=r.o.cs;if(r.o.br)o.breakLine=true;return{text:r.t,options:o};});
    Object.assign(p,{align:T.align,valign:T.valign,margin:it.doc&&Array.isArray(T.margin)?[T.margin[0],T.margin[1],0,T.margin[3]]:T.margin,fontFace:T.font,fontSize:T.size,color:T.color,bold:T.bold});if(T.lsp&&T.lsp!==1)p.lineSpacingMultiple=T.lsp;}
   s.addText(runs,p);});});
 return pptx;}
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
 const cf=zip.file('[Content_Types].xml');if(cf){let x=await cf.async('string');
  x=x.replace(/<Override PartName="\/([^"]+)"[^>]*\/>/g,(m,part)=>zip.file(part)?m:'');zip.file('[Content_Types].xml',x);}}
async function exportPptx(env,params,opt){opt=opt||{};const model=opt.model||buildModel(params,{only:opt.only,examples:opt.examples});
 const pptx=new env.PptxGenJS();toPptx(pptx,model);
 const buf=await pptx.write({outputType:'arraybuffer'});const zip=await env.JSZip.loadAsync(buf);const patched=await patchZip(zip,model);
 const data=await zip.generateAsync({type:opt.type||'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation'});
 return{data,model,patched};}

/* 單一元件：取出某頁某群組的圖形，置中到一張新投影片 */
function elementModel(params,key,gi){const m=buildModel(params,{only:[key]});const sl=m.slides[0];const g=sl.groups[gi];if(!g)throw new Error('找不到元件 '+gi);
 const dx=(W-g.w)/2-g.x,dy=(H-g.h)/2-g.y;
 const n=g.to-g.from+1;const items=clone(sl.items.slice(g.from,g.to+1)).map(it=>{if(it.t==='ln'){it.x1+=dx;it.x2+=dx;it.y1+=dy;it.y2+=dy;}else{it.x+=dx;it.y+=dy;}
  if(it.cx){['a','b'].forEach(k=>{if(!it.cx[k])return;const j=it.cx[k][0]-g.from;if(j<0||j>=n)delete it.cx[k];else it.cx[k]=[j,it.cx[k][1]];});}
  if(it.bgMatch)it.fill='FFFFFF';   // 單獨匯出＝白色投影片：遮線用的底色改白（不帶畫布灰）
  return it;});
 return{slides:[{key:key+'-'+gi,title:g.name,no:1,items,groups:[Object.assign({},g,{from:0,to:items.length-1,x:g.x+dx,y:g.y+dy})]}],warns:[],params:m.params,element:g};}
async function exportElement(env,params,key,gi,opt){const model=elementModel(params,key,gi);return exportPptx(env,params,Object.assign({},opt||{},{model}));}

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
/* 表格 → 預覽用的儲存格矩形＋框線（pptx 端是原生 <a:tbl>） */
function tblItems(it){const out=[],lines=[];let yy=it.y;
 it.cells.forEach((r,ri)=>{let xx=it.x;const rh=it.rowH[ri];
  r.forEach((c,ci)=>{const cw=it.colW[ci];
   out.push({t:'sp',kind:'rect',x:xx,y:yy,w:cw,h:rh,fill:c.fill,line:null,lw:0,runs:c.runs,tx:{align:c.align,valign:'middle',margin:[c.mL,c.mL,c.mT,c.mT],lsp:1,size:c.size,font:F0(c),color:c.color,bold:c.bold}});
   if(c.bT)lines.push({t:'ln',x1:xx,y1:yy,x2:xx+cw,y2:yy,color:c.bT.c,w:c.bT.w,dash:'solid'});
   if(c.bB)lines.push({t:'ln',x1:xx,y1:yy+rh,x2:xx+cw,y2:yy+rh,color:c.bB.c,w:c.bB.w,dash:'solid'});xx+=cw;});yy+=rh;});
 return out.concat(lines);}
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
  if(it.t==='pic')return `<image x="${it.x*PT}" y="${it.y*PT}" width="${it.w*PT}" height="${it.h*PT}" href="${it.png}"/>`;
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
  if(it.runs){layoutText(it).forEach(l=>{if(!l.runs.length)return;
   body.push(`<text x="${l.x.toFixed(2)}" y="${l.base.toFixed(2)}" xml:space="preserve">${l.runs.map(r=>`<tspan font-family="${esc(flat?(r.o.font+', '+fstack(r.o.font)).replace(/'/g,''):fstack(r.o.font))}" font-size="${r.o.size}" font-weight="${fweight(r.o.font,r.o.bold)}" fill="#${r.o.color}"${r.o.cs?` letter-spacing="${r.o.cs}"`:''}>${esc(r.t)}</tspan>`).join('')}</text>`);});}
  return body.join('');}
 slide.items.forEach((it,idx)=>{parts[idx]=it.t==='tbl'?tblItems(it).map(one).join(''):one(it);});
 /* 互動模式：每個群組包成 <g class="el">，最上層加一個透明命中框 */
 let out=parts;
 if(opt.interactive&&slide.groups&&slide.groups.length){out=parts.slice();const pad=4;
  slide.groups.forEach((g,gi)=>{const x=g.x*PT-pad,y=g.y*PT-pad,w=g.w*PT+2*pad,h=g.h*PT+2*pad;
   out[g.from]=`<g class="el" data-g="${gi}" data-name="${esc(g.name)}">`+out[g.from];
   out[g.to]=out[g.to]+`<rect class="hit" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="4"/></g>`;});}
 const vb=opt.viewBox||`0 0 ${(slide.W||W)*PT} ${(slide.H||H)*PT}`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${opt.attrs||''}><defs>${Object.values(defs).map(d=>d.xml).join('')}</defs>${opt.bg===false?'':'<rect width="100%" height="100%" fill="#FFFFFF"/>'}${out.join('')}</svg>`;}
/* 單一元件 SVG：只取群組內的圖形，裁切到外框（含留白）；flat=剪貼簿相容版（無濾鏡、箭頭實體化、透明背景） */
function elementSvg(slide,gi,opt){opt=opt||{};const g=slide.groups[gi];const pad=(opt.pad!=null?opt.pad:6);
 const items=slide.items.slice(g.from,g.to+1);const hasSh=items.some(i=>i.sh);const m=pad+(hasSh&&!opt.flat?16:0);
 const x=g.x*PT-m,y=g.y*PT-m,w=g.w*PT+2*m,h=g.h*PT+2*m;
 const svg=toSvg({items},{id:opt.id||'e',flat:opt.flat,bg:opt.bg,viewBox:`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`,attrs:`width="${(w*(opt.scale||1)).toFixed(1)}pt" height="${(h*(opt.scale||1)).toFixed(1)}pt"`.replace(/pt"/g,opt.px?'"':'pt"')});
 return{svg,w,h,name:g.name};}
/* ================= 待選素材（v6）：多個元件（各自保留加入當時的風格參數）排到同一張投影片 =================
   entries[i]={kind:'el'|'icon'|'table',params:{…完整風格…},key,gi | icon:{id,variant} | table:{rows,…},name}
   每項先用自己的 params 建 model（顏色、圓角、陰影、線寬、S/M/L 都已算進圖形）→ 依外框做「分列排版」，放不下就整體等比縮小 → 合併成一頁。 */
function shiftItems(items,dx,dy){items.forEach(it=>{if(it.t==='ln'){it.x1+=dx;it.x2+=dx;it.y1+=dy;it.y2+=dy;}else{it.x+=dx;it.y+=dy;}});}
function trayPart(e){
 if(e.kind==='el')return elementModel(e.params,e.key,e.gi).slides[0];
 if(e.kind==='icon')return buildModel(e.params,{icon:{id:e.icon.id,variant:e.icon.variant}}).slides[0];
 if(e.kind==='table')return buildModel(e.params,{table:e.table}).slides[0];
 throw new Error('未知的素材種類 '+e.kind);}
function trayModel(entries,opt){opt=opt||{};const parts=[],skipped=[];
 (entries||[]).forEach((e,i)=>{try{const sl=trayPart(e);if(!sl||!sl.items.length){skipped.push(i);return;}
   parts.push({items:clone(sl.items),bb:bboxOf(sl.items),name:e.name||sl.title,params:e.params});}catch(err){skipped.push(i);}});
 const M=.45,AW=W-2*M,AH=H-2*M,g=.32;
 function pack(s){let x=0,y=0,rowH=0;const rows=[[]],pos=[];
  parts.forEach((p,i)=>{const w=p.bb.w*s,h=p.bb.h*s;if(x>0&&x+w>AW+1e-6){y+=rowH+g;x=0;rowH=0;rows.push([]);}
   pos[i]={x,y,w,h,row:rows.length-1};rows[rows.length-1].push(i);x+=w+g;rowH=Math.max(rowH,h);});
  return{pos,rows,H:y+rowH,ok:y+rowH<=AH+1e-6&&pos.every(q=>q.w<=AW+1e-6)};}
 let s=1,r=pack(s);while(!r.ok&&s>.1){s*=.95;r=pack(s);}
 const items=[],groups=[];const oy=M+(AH-r.H)/2;
 r.rows.forEach(row=>{if(!row.length)return;const rw=row.reduce((a,i)=>a+r.pos[i].w,0)+g*(row.length-1);const rh=Math.max(...row.map(i=>r.pos[i].h));let x=M+(AW-rw)/2;
  row.forEach(i=>{const p=parts[i],q=r.pos[i];const base=items.length;const its=p.items;
   shiftItems(its,-p.bb.x,-p.bb.y);if(Math.abs(s-1)>1e-6)scaleSlide({items:its,groups:[]},s);
   const X=x,Y=oy+q.y+(rh-q.h)/2;shiftItems(its,X,Y);
   its.forEach(it=>{if(it.cx)['a','b'].forEach(k=>{if(it.cx[k])it.cx[k]=[it.cx[k][0]+base,it.cx[k][1]];});items.push(it);});
   groups.push({name:p.name,from:base,to:items.length-1,x:X,y:Y,w:q.w,h:q.h});x+=q.w+g;});});
 return{slides:[{key:'tray',title:'待選素材',no:1,items,groups}],warns:[],params:Object.assign({},(parts[0]||{}).params||BASE,{zh:'待選素材'}),tray:{n:parts.length,skipped,scale:Math.round(s*100)/100}};}
/* 表格 → 剪貼簿 HTML（貼到 PowerPoint 會成為原生表格；強調框改成該欄／列的外框線，灰色底板不帶過去） */
function tableHtml(model){const sl=model.slides[0];const tb=sl.items.find(i=>i.t==='tbl');if(!tb)return '';const T=sl.table||{};const hi=T.hi;const n=tb.cells.length;
 const pt=v=>+(v*72).toFixed(1)+'pt';const HB=hi?`1.75pt solid #${hi.color}`:'';
 let h=`<table style="border-collapse:collapse;table-layout:fixed;width:${pt(tb.w)};font-family:${fstack(T.font||'Microsoft JhengHei').replace(/"/g,"'")}">`;
 h+='<colgroup>'+tb.colW.map(w=>`<col style="width:${pt(w)}">`).join('')+'</colgroup>';
 tb.cells.forEach((r,ri)=>{h+=`<tr style="height:${pt(tb.rowH[ri])}">`;
  r.forEach((c,ci)=>{const f=(c.runs[0]&&c.runs[0].o.font)||T.font;const bd=(side,b)=>b?`border-${side}:${b.w}pt solid #${b.c};`:'';let hb='';
   if(hi&&hi.type==='col'&&hi.i===ci)hb=`border-left:${HB};border-right:${HB};`+(ri===0?`border-top:${HB};`:'')+(ri===n-1?`border-bottom:${HB};`:'');
   if(hi&&hi.type==='row'&&hi.i===ri)hb=`border-top:${HB};border-bottom:${HB};`+(ci===0?`border-left:${HB};`:'')+(ci===r.length-1?`border-right:${HB};`:'');
   const css=`${c.fill?`background:#${c.fill};`:''}color:#${c.color};font-size:${c.size}pt;font-weight:${c.bold?700:400};text-align:${c.align};vertical-align:middle;padding:${c.mT}pt ${c.mL}pt;font-family:${fstack(f).replace(/"/g,"'")};`+bd('top',c.bT)+bd('bottom',c.bB)+hb;
   h+=`<td style="${css}">${esc(c.runs.map(x=>x.t+(x.o.br?'\n':'')).join('')).replace(/\n/g,'<br>')}</td>`;});h+='</tr>';});
 return h+'</table>';}
/* 參數驗證（匯入 JSON、localStorage、待選素材快照）：只收 BASE 有的鍵（＋zh／tbLook／tbPanel），顏色必須是 6 碼 hex，數字必須是有限值（可給範圍），
   列舉值必須在清單內（enums 由 studio 的選項表提供）；不合格的值改回 fallback（範本預設）。擋住 "/><img onerror=…> 這類注入。 */
function sanitizeParams(p,fallback,enums,ranges){fallback=fallback||BASE;enums=enums||{};ranges=ranges||{};const out=clone(fallback);if(!p||typeof p!=='object')return out;
 Object.keys(p).forEach(k=>{const v=p[k],d=fallback[k];
  if(k==='zh'){out.zh=stripCtl(v).replace(/[<>&"]/g,'').slice(0,40);return;}
  if(k==='tbLook'){if(TABLE_LOOKS.some(l=>l[0]===v))out.tbLook=v;return;}
  if(k==='tbPanel'){out.tbPanel=!!v;return;}
  if(!(k in BASE))return;
  if(enums[k]){if(enums[k].some(o=>String(o)===String(v)))out[k]=typeof d==='number'?+v:v;return;}
  if(typeof BASE[k]==='boolean'){out[k]=!!v;return;}
  if(typeof BASE[k]==='number'){const n=+v;if(!Number.isFinite(n))return;const r=ranges[k];out[k]=r?Math.min(r[1],Math.max(r[0],n)):n;return;}
  if(typeof BASE[k]==='string'&&/^[0-9A-F]{6}$/i.test(BASE[k])){const h=String(v).replace('#','');if(/^[0-9A-F]{6}$/i.test(h))out[k]=h.toUpperCase();return;}
  if(typeof BASE[k]==='string'){const t=stripCtl(v);if(/^[\w .\-\u4e00-\u9fff]{0,40}$/.test(t))out[k]=t;return;}});
 return out;}
const api={W,H,BASE,stripCtl,sanitizeParams,PRESETS,STYLES:PRESETS,SLIDES,SIZE_K,ICONS,mix,buildModel,toPptx,patchZip,groupXml,effectXml,exportPptx,exportElement,elementModel,elementSvg,toSvg,tableHtml,trayModel,tableAuto,statusOf,TABLE_LOOKS,langOf,FONT_STACK};
if(typeof module!=='undefined')module.exports=api;else root.Deck=api;
})(this);
