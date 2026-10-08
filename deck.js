/* PPT Style Studio v4 — 參數化圖解元件庫（永遠白底）
   params → 幾何模型（model）→ ① SVG 即時預覽  ② PptxGenJS 匯出（含陰影 XML 修補）
   瀏覽器（studio.html）與 Node（gen.js）共用。 */
(function(root){
'use strict';
const W=13.333,H=7.5,PT=72;
function mix(a,b,t){const p=s=>[0,2,4].map(i=>parseInt(s.substr(i,2),16));const A=p(a),B=p(b);return A.map((v,i)=>Math.round(v*(1-t)+B[i]*t).toString(16).padStart(2,'0')).join('').toUpperCase();}
const clone=o=>JSON.parse(JSON.stringify(o));

/* ============ 參數：預設值＋ 8 個範本 ============ */
const BASE={
 P:'1F4E79',PD:'1F3864',PT:'DEE7F1',A:'2E75B6',useA:true,
 ink:'3A3A3A',t2:'595959',mute:'8C8C8C',line:'BFBFBF',l2:'D9D9D9',fill:'F2F2F2',
 canvas:false,canvasColor:'F5F5F5',
 r:.1,colR:'full',colStyle:'fill',
 sh:false,shMode:'drop',shB:7,shO:2,shA:.25,shDir:90,haloB:16,haloA:.32,ring:false,
 card:'outline',cardLW:1.25,cardLine:'D9D9D9',headColor:'P',bandStyle:'fill',cornerTag:true,ribbonTone:'p',
 tag:'pill',badge:'circle',sep:'tri',chain:'chev',circle:'ring3',circleLW:3,sym:'outlineP',mark:'none',bar:'under',bracket:false,titleColor:'P',
 cnW:1.25,cnC:'7F7F7F',cnDash:'solid',cnHead:'triangle',cnTail:'none',cnHs:'lg',
 tFont:'Microsoft JhengHei',bFont:'Microsoft JhengHei',nFont:'',tSize:36,tBold:true,lSize:16,lBold:true,nSize:10.5
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
  cnW:2,cnC:'3A3A3A',cnHs:'med',tSize:38,colR:'small'}
].map(p=>Object.assign(clone(BASE),p));
const LANG_OF={card:{outline:'白底外框',gray:'淺灰實心',soft:'白底無框＋陰影',head:'實心表頭色帶',top:'頂邊色條'},
 tag:{pill:'全圓角膠囊',round:'小圓角方籤',square:'直角實心',outline:'空心線框',soft:'淡色底膠囊',dot:'圓點方籤'},
 badge:{circle:'實心圓',ring:'實心圓＋白環',halo:'實心圓＋光暈',odot:'實心圓＋橘點',oring:'空心細圓',rsq:'圓角方塊',square:'方形襯線數字',pill:'01 數字膠囊',enc:'①②③ 圈號'},
 sep:{tri:'▶ 小三角',dots:'▶▶▶ 點狀',line:'細線箭頭',harrow:'開放箭頭',stealth:'燕尾箭頭',chev:'細 V 形 ›',block:'區塊 V 形'},
 chain:{chev:'漸層 V 形箭號',hex:'六角形鏈',gray:'灰卡＋▶',outline:'細框方塊',hairchev:'空心線框 V 形',home:'五邊形箭號',pill:'膠囊鏈',block:'區塊 V 形'}};
function langOf(p){return{card:LANG_OF.card[p.card]+(p.card==='outline'?' '+p.cardLW+'pt':'')+(p.sh?'＋陰影':''),tag:LANG_OF.tag[p.tag],badge:LANG_OF.badge[p.badge],sep:LANG_OF.sep[p.sep],
 conn:p.cnW+'pt '+({solid:'實線',sysDot:'點線',sysDash:'虛線',dash:'長虛線'}[p.cnDash]||'')+({triangle:'＋三角箭頭',arrow:'＋開放箭頭',stealth:'＋燕尾箭頭',oval:'＋圓點',none:''}[p.cnHead]||''),chain:LANG_OF.chain[p.chain]};}
const SLIDES=[['guide','風格規範'],['cards','卡片'],['tags','標籤與編號'],['circles','圓形與流程鏈'],['conn','連接線與箭頭'],['flow','流程圖符號'],['struct','結構元件'],['ex1','範例｜三圓架構'],['ex2','範例｜框架流程'],['ex3','範例｜分支樹狀']];

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
 function shadowSpec(type){
  if(type==='halo')return{blur:st.haloB,dist:Math.min(st.shO,2),dir:90,alpha:st.haloA,scale:1.02,color:'000000',kind:'halo'};
  if(type==='small')return{blur:Math.max(3,st.shB*.6),dist:Math.min(st.shO,1.5),dir:st.shDir,alpha:Math.min(.35,st.shA+.04),scale:1,color:'000000',kind:'drop'};
  if(st.shMode==='halo')return{blur:st.shB*1.5,dist:Math.min(st.shO,1),dir:90,alpha:st.shA,scale:1.01,color:'000000',kind:'halo'};
  return{blur:st.shB,dist:st.shO,dir:st.shDir,alpha:st.shA,scale:1,color:'000000',kind:'drop'};}
 /* ---------- 基本圖元：全部寫入 model ---------- */
 function runsOf(text,o){const items=typeof text==='string'?text.split('\n').map((t,i,a)=>({t,br:i<a.length-1})):text;
  const out=[],paras=[[]];
  items.forEach((r,i)=>{const size=r.s||o.size||14;const ro={size,font:r.f||o.font||F,bold:r.b!=null?!!r.b:!!o.bold,color:r.c||o.color||G.ink};
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
  if(o.sh&&(st.sh||o.force))it.sh=shadowSpec(o.sh===true||o.sh===1?'card':o.sh);
  if(o.points)it.points=o.points;
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
  if(pts.length===2)return ln(pts[0][0],pts[0][1],pts[1][0],pts[1][1],sty);
  path(pts,{line:sty.c,lw:sty.w,dash:sty.dash,head:sty.head,hs:sty.hs,tail:sty.tail,name:'連接線'});}
 function curve(p0,c1,c2,p1,o){o=Object.assign(CN(),o||{});const all=[p0,c1,c2,p1];const x0=Math.min(...all.map(p=>p[0])),y0=Math.min(...all.map(p=>p[1]));
  const w=Math.max(...all.map(p=>p[0]))-x0,h=Math.max(...all.map(p=>p[1]))-y0;const q=p=>({x:p[0]-x0,y:p[1]-y0});
  el('custGeom',x0,y0,Math.max(w,.01),Math.max(h,.01),{line:o.c,lw:o.w,dash:o.dash==='solid'?'sysDash':o.dash,head:o.head,hs:o.hs,tail:o.tail===false?null:o.tail,name:'曲線箭頭',
   points:[q(p0),Object.assign(q(p1),{curve:{type:'cubic',x1:c1[0]-x0,y1:c1[1]-y0,x2:c2[0]-x0,y2:c2[1]-y0}})]});}
 function tri(x,y,w,h,o){path([[x,y],[x+w,y+h/2],[x,y+h]],Object.assign({close:true,name:'三角形'},o));}
 function topRound(x,y,w,h,r,o){const R=Math.min(r,h,w/2);if(R<.005)return box(x,y,w,h,o);
  el('custGeom',x,y,w,h,Object.assign({},o,{points:[{x:0,y:h},{x:0,y:R},{x:R,y:0,curve:{type:'arc',hR:R,wR:R,stAng:180,swAng:90}},{x:w-R,y:0},{x:w,y:R,curve:{type:'arc',hR:R,wR:R,stAng:270,swAng:90}},{x:w,y:h},{close:true}]}));}

 /* ---------- 版面骨架 ---------- */
 function canvas(){if(st.canvas)box(.25,.25,W-.5,H-.5,{fill:st.canvasColor,r:.06,name:'畫布面板'});}
 function footer(){const y=st.canvas?6.9:7.0;
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
   case 'dot':{tt(.6,.4,11);const dx=.6+tw(T,ts)+.08;circ(dx+.08,.4+.36+ts/150,.16,{fill:A});txt(.6,1.12,11,.38,sub,{size:15,color:subC});box(.6,1.6,.5,.06,{fill:A});break;}}}
 function mark(x,yc){switch(st.mark){case 'bar':box(x,yc-.11,.05,.22,{fill:P});return .17;case 'vbar':box(x,yc-.11,.05,.22,{fill:A});return .17;
   case 'sq':box(x,yc-.055,.11,.11,{fill:A});return .22;case 'dot':circ(x+.055,yc,.11,{fill:A});return .22;default:return 0;}}
 function section(x,y,w,t){const dx=mark(x,y+.16);txt(x+dx,y,w-dx,.32,t,{size:LS(13),bold:st.lBold,color:G.ink});ln(x,y+.42,x+w,y+.42,{c:G.l2,w:.75});}
 function note(x,y,w,t,o){txt(x,y,w,(o&&o.h)||.28,t,Object.assign({size:st.nSize,color:G.mute,wrap:o&&o.wrap},o||{}));}

 /* ---------- 標籤 ---------- */
 function tagLook(tone){const W2='FFFFFF';
  switch(st.tag){
   case 'pill':return{p:{fill:P,c:W2},a:HASA?{fill:A,c:W2}:{fill:PTn,c:P},g:{fill:GF,c:G.ink},o:{line:P,lw:1,c:P,fill:W2}}[tone];
   case 'round':return{p:{fill:P,c:W2},a:{fill:A,c:HASA?G.ink:W2},g:{fill:mix(GF,'000000',.03),c:G.ink},o:{line:G.line,lw:1.25,c:G.t2,fill:W2}}[tone];
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
 function badge(cx,cy,n,o){o=o||{};const d=o.d||.42,size=o.size||Math.round(d*30),t=String(n);const W2='FFFFFF';
  switch(st.badge){
   case 'ring':circ(cx,cy,d,{fill:o.alt?A:P,line:W2,lw:1.75,sh:'small',text:t,size,bold:1,color:W2,margin:0,name:'編號'});break;
   case 'rsq':box(cx-d/2,cy-d/2,d,d,{fill:o.alt?A:P,r:.06,text:t,size,bold:1,color:o.alt&&HASA?G.ink:W2,margin:0,name:'編號'});break;
   case 'pill':{const w=Math.max(d*1.25,tw(t,size*.8)+.2),h=d*.68;box(cx-w/2,cy-h/2,w,h,{fill:o.alt?PTn:P,r:'full',text:t,size:Math.round(size*.8),bold:1,color:o.alt?P:W2,margin:0,name:'編號'});break;}
   case 'circle':circ(cx,cy,d,{fill:o.alt?A:P,text:t,size,bold:1,color:W2,margin:0,name:'編號'});break;
   case 'oring':circ(cx,cy,d,{fill:W2,line:o.alt?G.ink:P,lw:.75,text:t,size,color:o.alt?G.ink:P,font:FL,margin:0,name:'編號'});break;
   case 'square':box(cx-d/2,cy-d/2,d,d,{fill:o.alt?A:P,text:t,size,color:W2,font:st.nFont||'Georgia',margin:0,name:'編號'});break;
   case 'halo':circ(cx,cy,d*1.32,{fill:o.alt?mix(A,'FFFFFF',.75):PTn});circ(cx,cy,d,{fill:o.alt?A:P,text:t,size,bold:1,color:W2,margin:0,name:'編號'});break;
   case 'odot':circ(cx,cy,d,{fill:o.alt?A:P,text:t,size,bold:1,color:W2,margin:0,name:'編號'});if(d>=.4&&!o.nodot)circ(cx+d*.36,cy-d*.36,d*.3,{fill:A,line:W2,lw:1});break;
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
 function bigCircle(cx,cy,r,big,sub){const d=2*r,x=cx-r,y=cy-r,lw=st.circleLW;
  if(st.ring&&st.sh)oval(x-.07,y-.07,d+.14,d+.14,{line:mix(G.l2,'FFFFFF',.35),lw:.75,name:'外圈細環'});
  switch(st.circle){
   case 'ring3':oval(x,y,d,d,{fill:'FFFFFF',line:G.l2,lw,sh:'halo',name:'光暈大圓'});break;
   case 'thick':oval(x,y,d,d,{fill:'FFFFFF',line:G.line,lw,sh:'halo',name:'大圓'});break;
   case 'gray':oval(x,y,d,d,{fill:GF,sh:'halo',name:'光暈大圓'});break;
   case 'thin':oval(x,y,d,d,{fill:'FFFFFF',line:G.g7,lw,sh:'halo',name:'大圓'});break;
   case 'hair':oval(x,y,d,d,{fill:'FFFFFF',line:G.l1,lw,sh:'halo',name:'大圓'});break;
   case 'double':oval(x,y,d,d,{fill:'FFFFFF',line:G.l2,lw,sh:'halo',name:'大圓'});oval(x+.09,y+.09,d-.18,d-.18,{line:A,lw:.75});break;
   case 'soft':oval(x,y,d,d,{fill:'FFFFFF',sh:'halo',line:st.sh?null:G.l2,lw:.75,name:'光暈大圓'});break;
   case 'heavy':oval(x,y,d,d,{fill:'FFFFFF',line:P,lw,sh:'halo',name:'大圓'});break;}
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
   case 'heavy':return strong?{fill:P,c:W2}:alt?{fill:W2,line:A,lw:2,c:G.ink}:{fill:GF,line:P,lw:2,c:G.ink};}}
 function sym(kind,x,y,w,h,t,o){o=o||{};const L=symLook(o.strong,o.alt);const size=o.size||LS(14);
  const base={fill:L.fill,line:L.line,lw:L.lw,dash:L.dash,sh:L.sh?'small':0,text:t,size,bold:st.tBold&&st.lBold,color:L.c};
  switch(kind){
   case 'term':box(x,y,w,h,Object.assign(base,{r:'full',name:'開始／結束'}));break;
   case 'proc':box(x,y,w,h,Object.assign(base,{r:st.r>0?(st.sym==='soft'?st.r:Math.min(st.r,.12)):0,name:'處理'}));break;
   case 'dec':el('diamond',x,y,w,h,Object.assign(base,{inner:.62,margin:0,name:'判斷'}));break;
   case 'io':el('parallelogram',x,y,w,h,Object.assign(base,{adj:h*.42,inner:.8,name:'輸入輸出'}));break;
   case 'doc':el('custGeom',x,y,w,h,Object.assign(base,{margin:[3,3,h*.2*72,0],innerH:.8,name:'文件',points:[{x:0,y:0},{x:w,y:0},{x:w,y:h*.802},{x:0,y:h*.934,curve:{type:'cubic',x1:w*.5,y1:h*.802,x2:w*.5,y2:h*1.1075}},{close:true}]}));break;
   case 'db':el('can',x,y,w,h,Object.assign(base,{adj:h*.13,margin:[2,2,0,0],name:'資料庫'}));break;}}
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

 /* ================= 投影片 ================= */
 const X0=.6,X1=W-.6,CW=X1-X0;const lang=langOf(st);
 const SL={};
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

 SL.conn=()=>{title('連接線與箭頭','細直線、折線、點狀線、曲線、▶ 小三角與區塊箭號');
  const cw=(CW-3*.32)/4,cx=i=>X0+i*(cw+.32);
  const cells=['細直線 Straight','折線 Elbow','點狀線 Dotted','曲線 Curved','▶ 小三角分隔','▶▶▶ 點狀箭號','區塊箭號 Chevron','分支 Branch'];
  cells.forEach((l,i)=>{const r=Math.floor(i/4),c=i%4,x=cx(c),y=1.95+r*2.35;section(x,y,cw,l);
   const nw=.9,nh=.46,top=y+.75,mid=y+1.35;
   switch(i){
    case 0:node(x,mid-nh/2,nw,nh,'A');node(x+cw-nw,mid-nh/2,nw,nh,'B');conn([[x+nw+.06,mid],[x+cw-nw-.06,mid]],{dash:'solid'});break;
    case 1:node(x,top,nw,nh,'A');node(x+cw-nw,top+1.0,nw,nh,'B');conn([[x+nw+.06,top+nh/2],[x+cw/2,top+nh/2],[x+cw/2,top+1.0+nh/2],[x+cw-nw-.06,top+1.0+nh/2]]);break;
    case 2:node(x,mid-nh/2,nw,nh,'A');node(x+cw-nw,mid-nh/2,nw,nh,'B');conn([[x+nw+.06,mid],[x+cw-nw-.06,mid]],{dash:'sysDot',w:Math.max(1.25,st.cnW)});break;
    case 3:node(x,top+.85,nw,nh,'A');node(x+cw-nw,top+.85,nw,nh,'B');curve([x+nw/2,top+.79],[x+nw/2,top-.05],[x+cw-nw/2,top-.05],[x+cw-nw/2,top+.79]);break;
    case 4:{const ws=['輸入','處理','輸出'];const gw=(cw-3*.62)/2;ws.forEach((t,j)=>{const xx=x+j*(.62+gw);txt(xx,mid-.2,.62,.4,t,{size:13,bold:1,color:G.ink,align:'center'});if(j<2)sep(xx+.62+gw/2,mid);});break;}
    case 5:node(x,mid-nh/2,nw,nh,'A');node(x+cw-nw,mid-nh/2,nw,nh,'B');sep(x+cw/2,mid,{kind:'dots',k:1.2});break;
    case 6:{const n=3,bw=(cw+2*.18)/3,ol=st.chain==='hairchev';for(let j=0;j<n;j++)el(j?'chevron':'homePlate',x+j*(bw-.18+.04),mid-.27,bw,.54,{fill:ol?'FFFFFF':(j===2&&HASA?A:mix(P,'FFFFFF',j*.25)),line:ol?P:null,lw:.75,adj:.18,text:['一','二','三'][j],size:13,bold:1,color:ol?P:'FFFFFF',margin:[2,2,0,0],name:'區塊箭號'});break;}
    case 7:{const t1=mid-.42-nh/2,t2=mid+.42-nh/2;node(x,mid-nh/2,nw,nh,'A');node(x+cw-nw,t1,nw,nh,'B1');node(x+cw-nw,t2,nw,nh,'B2');const jx=x+nw+(cw-2*nw)/2;
     conn([[x+nw+.06,mid],[jx,mid]],{head:false,tail:false});conn([[jx,mid],[jx,t1+nh/2],[x+cw-nw-.06,t1+nh/2]],{tail:false});conn([[jx,mid],[jx,t2+nh/2],[x+cw-nw-.06,t2+nh/2]],{tail:false});break;}}});
  note(X0,6.5,CW,'※ 連接線為獨立線條，移動圖形後需手動調整；建議先排好圖形再拉線');};

 SL.flow=()=>{title('流程圖符號','開始／結束、處理、判斷、輸入輸出、文件、資料庫');
  const items=[['term','開始','開始／結束','Terminator',1.5,.62],['proc','處理','處理','Process',1.6,.72],['dec','判斷','判斷','Decision',1.5,1.0],['io','輸入','輸入／輸出','Input / Output',1.7,.72],['doc','文件','文件','Document',1.5,.85],['db','資料庫','資料庫','Database',1.1,1.0]];
  const cw=CW/6;items.forEach(([k,t,zh,en,w,h],i)=>{const cx=X0+cw*i+cw/2;sym(k,cx-w/2,2.75-h/2,w,h,t,{strong:k==='term',alt:k==='dec'});
   txt(cx-cw/2,3.42,cw,.52,[{t:zh,s:12,b:1,c:G.ink,br:1},{t:en,s:9,c:G.mute,f:nf}],{align:'center'});});
  section(X0,4.12,CW,'基本流程範例');
  const cy=5.15;const ws=[1.25,1.8,1.7,1.6,1.6,1.25];const g=(CW-ws.reduce((a,b)=>a+b))/5;const xs=[];let xx=X0;ws.forEach(w=>{xs.push(xx);xx+=w+g;});
  sym('term',xs[0],cy-.3,ws[0],.6,'開始',{strong:1});sym('io',xs[1],cy-.34,ws[1],.68,'輸入需求');
  sym('dec',xs[2],cy-.5,ws[2],1.0,'是否可行？',{alt:1,size:LS(13)});sym('proc',xs[3],cy-.34,ws[3],.68,'執行處理');
  sym('doc',xs[4],cy-.4,ws[4],.8,'產出報告');sym('term',xs[5],cy-.3,ws[5],.6,'結束',{strong:1});
  const ga=.07;for(let i=0;i<5;i++){const x1=xs[i]+ws[i]+ga-(i===1?.12:0),x2=xs[i+1]-ga+(i===0?.1:0);conn([[x1,cy],[x2,cy]],{tail:false});}
  txt(xs[2]+ws[2]+.02,cy-.42,g,.3,'是',{size:11,bold:1,color:G.t2,align:'center'});
  const dbx=xs[3]+ws[3]/2;sym('db',dbx-.5,5.92,1.0,.82,'資料庫',{size:LS(12)});conn([[dbx,cy+.4],[dbx,5.86]],{tail:'triangle',dash:'sysDash'});
  const dx=xs[2]+ws[2]/2,ix=xs[1]+ws[1]/2;conn([[dx,cy+.56],[dx,6.4],[ix,6.4],[ix,cy+.4]],{tail:false});
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

 SLIDES.forEach(([k,zh],i)=>{if(opt.only&&!opt.only.includes(k))return;sno=i+1;cur={key:k,title:zh,no:i+1,items:[]};slides.push(cur);canvas();SL[k]();footer();});
 return{slides,warns,params:st};}

/* ================= PptxGenJS 匯出 ================= */
function ahType(t,sz){return t?(sz&&sz!=='med'?`${t}" w="${sz}" len="${sz}`:t):undefined;}
function toPptx(pptx,model){
 pptx.layout='LAYOUT_WIDE';pptx.title='精緻圖解元件庫 · '+(model.params.zh||'自訂風格');pptx.author='PPT Style Studio';
 model.slides.forEach(sl=>{const s=pptx.addSlide();s.background={color:'FFFFFF'};
  sl.items.forEach(it=>{
   if(it.t==='ln'){const L={color:it.color,width:it.w,dashType:it.dash};if(it.head)L.endArrowType=ahType(it.head,it.hs);if(it.tail)L.beginArrowType=ahType(it.tail,it.hs);
    s.addShape('line',{x:Math.min(it.x1,it.x2),y:Math.min(it.y1,it.y2),w:Math.abs(it.x2-it.x1),h:Math.abs(it.y2-it.y1),flipH:it.x2<it.x1,flipV:it.y2<it.y1,line:L,objectName:'線條'});return;}
   const p={x:it.x,y:it.y,w:it.w,h:it.h};if(it.name)p.objectName=it.name;
   if(it.kind){p.shape=it.kind;p.fill=it.fill?{color:it.fill,transparency:it.ft||0}:{type:'none'};
    p.line=it.line?{color:it.line,width:it.lw,dashType:it.dash}:{type:'none'};if(it.line&&it.head)p.line.endArrowType=ahType(it.head,it.hs);if(it.line&&it.tail)p.line.beginArrowType=ahType(it.tail,it.hs);}
   if(it.adj)p.rectRadius=it.adj;if(it.points)p.points=it.points;
   if(it.sh)p.shadow={type:'outer',blur:it.sh.blur,offset:it.sh.dist,angle:it.sh.dir,color:it.sh.color,opacity:it.sh.alpha};
   let runs='';
   if(it.runs){const T=it.tx;runs=it.runs.map(r=>{const o={fontSize:r.o.size,fontFace:r.o.font,bold:r.o.bold,color:r.o.color};if(r.o.cs!=null)o.charSpacing=r.o.cs;if(r.o.br)o.breakLine=true;return{text:r.t,options:o};});
    Object.assign(p,{align:T.align,valign:T.valign,margin:T.margin,fontFace:T.font,fontSize:T.size,color:T.color,bold:T.bold});if(T.lsp&&T.lsp!==1)p.lineSpacingMultiple=T.lsp;}
   s.addText(runs,p);});});
 return pptx;}
/* 陰影修補：PptxGenJS 固定寫 algn="bl"、無 sx/sy；這裡依 model 逐一改寫成正確的 outerShdw（光暈置中、放大、柔和） */
function effectXml(sh){const e=v=>Math.round(v*12700);const sc=Math.round((sh.scale||1)*100000);
 return `<a:effectLst><a:outerShdw blurRad="${e(sh.blur)}" dist="${e(sh.dist)}" dir="${Math.round(sh.dir*60000)}" sx="${sc}" sy="${sc}" algn="ctr" rotWithShape="0"><a:srgbClr val="${sh.color}"><a:alpha val="${Math.round(sh.alpha*100000)}"/></a:srgbClr></a:outerShdw></a:effectLst>`;}
async function patchZip(zip,model){let n=0;
 for(let i=0;i<model.slides.length;i++){const f='ppt/slides/slide'+(i+1)+'.xml';const file=zip.file(f);if(!file)continue;const items=model.slides[i].items;
  let x=await file.async('string');
  x=x.replace(/<p:sp>[\s\S]*?<\/p:sp>/g,blk=>{const m=blk.match(/<p:cNvPr id="(\d+)"/);if(!m)return blk;const it=items[+m[1]-2];if(!it||!it.sh)return blk;
   n++;return blk.replace(/<a:effectLst>[\s\S]*?<\/a:effectLst>/,effectXml(it.sh));});
  zip.file(f,x);}
 return n;}
async function exportPptx(env,params,opt){opt=opt||{};const model=buildModel(params,{only:opt.only});
 const pptx=new env.PptxGenJS();toPptx(pptx,model);
 const buf=await pptx.write({outputType:'arraybuffer'});const zip=await env.JSZip.loadAsync(buf);const patched=await patchZip(zip,model);
 const data=await zip.generateAsync({type:opt.type||'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation'});
 return{data,model,patched};}

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
    else d+=(i===0?'M':'L')+X(p.x)+','+Y(p.y);px=p.x;py=p.y;});return d;}}
 return '';}
function dashArr(d,w){w=Math.max(w,.5);return{sysDot:`${w},${w}`,sysDash:`${3*w},${w}`,dash:`${4*w},${3*w}`,lgDash:`${8*w},${3*w}`}[d]||'';}
function toSvg(slide,opt){opt=opt||{};const id=(opt.id||'s')+'_';const defs={},body=[];let fi=0,mi=0;
 const marker=(type,sz,color)=>{const k='m'+type+sz+color;if(defs[k])return defs[k].id;const mid=id+'m'+(mi++);const f={sm:2,med:3,lg:5}[sz]||3;
  const shp={triangle:`<path d="M0,0L10,5L0,10Z" fill="#${color}"/>`,arrow:`<path d="M1,1L9,5L1,9" fill="none" stroke="#${color}" stroke-width="1.6"/>`,stealth:`<path d="M0,0L10,5L0,10L3,5Z" fill="#${color}"/>`,oval:`<circle cx="5" cy="5" r="4.2" fill="#${color}"/>`,diamond:`<path d="M5,0L10,5L5,10L0,5Z" fill="#${color}"/>`}[type]||'';
  defs[k]={id:mid,xml:`<marker id="${mid}" viewBox="0 0 10 10" refX="${type==='oval'||type==='diamond'?5:9}" refY="5" markerWidth="${f}" markerHeight="${f}" orient="auto-start-reverse" markerUnits="strokeWidth">${shp}</marker>`};return mid;};
 const filt=(sh,size)=>{const dil=((sh.scale||1)-1)*size/2;const k='f'+[sh.blur,sh.dist,sh.dir,sh.alpha,dil.toFixed(1)].join('_');if(defs[k])return defs[k].id;const fid=id+'f'+(fi++);
  const dx=sh.dist*Math.cos(sh.dir*Math.PI/180),dy=sh.dist*Math.sin(sh.dir*Math.PI/180);
  defs[k]={id:fid,xml:`<filter id="${fid}" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB">${dil>.05?`<feMorphology in="SourceAlpha" operator="dilate" radius="${dil.toFixed(2)}" result="d"/>`:''}<feGaussianBlur in="${dil>.05?'d':'SourceAlpha'}" stdDeviation="${(sh.blur/2).toFixed(2)}"/><feOffset dx="${dx.toFixed(2)}" dy="${dy.toFixed(2)}" result="o"/><feFlood flood-color="#${sh.color}" flood-opacity="${sh.alpha}"/><feComposite in2="o" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`};return fid;};
 const strokeAttrs=(c,w,dash,head,tail,hs)=>`stroke="#${c}" stroke-width="${w}" fill="none"${dash&&dash!=='solid'?` stroke-dasharray="${dashArr(dash,w)}"`:''}${head?` marker-end="url(#${marker(head,hs,c)})"`:''}${tail?` marker-start="url(#${marker(tail,hs,c)})"`:''}`;
 slide.items.forEach(it=>{
  if(it.t==='ln'){body.push(`<line x1="${it.x1*PT}" y1="${it.y1*PT}" x2="${it.x2*PT}" y2="${it.y2*PT}" ${strokeAttrs(it.color,it.w,it.dash,it.head,it.tail,it.hs)}/>`);return;}
  if(it.kind){const d=svgShapePath(it);const f=it.sh?` filter="url(#${filt(it.sh,Math.min(it.w,it.h)*PT)})"`:'';
   const fill=it.fill?`fill="#${it.fill}"${it.ft?` fill-opacity="${(1-it.ft/100).toFixed(3)}"`:''}`:'fill="none"';
   const stroke=it.line?` stroke="#${it.line}" stroke-width="${it.lw}"${it.dash&&it.dash!=='solid'?` stroke-dasharray="${dashArr(it.dash,it.lw)}"`:''}${it.head?` marker-end="url(#${marker(it.head,it.hs,it.line)})"`:''}${it.tail?` marker-start="url(#${marker(it.tail,it.hs,it.line)})"`:''}`:'';
   body.push(`<path d="${d}" ${fill}${stroke}${f} stroke-linejoin="miter"/>`);
   if(it.kind==='can'){const x=it.x*PT,y=it.y*PT,w=it.w*PT,e=(it.adj||0)*PT/2;body.push(`<ellipse cx="${x+w/2}" cy="${y+e}" rx="${w/2}" ry="${e}" fill="${it.fill?'#'+mix(it.fill,'FFFFFF',.25):'none'}"${it.line?` stroke="#${it.line}" stroke-width="${it.lw}"`:''}/>`);}}
  if(it.runs){layoutText(it).forEach(l=>{if(!l.runs.length)return;
   body.push(`<text x="${l.x.toFixed(2)}" y="${l.base.toFixed(2)}" xml:space="preserve">${l.runs.map(r=>`<tspan font-family="${esc(fstack(r.o.font))}" font-size="${r.o.size}" font-weight="${fweight(r.o.font,r.o.bold)}" fill="#${r.o.color}"${r.o.cs?` letter-spacing="${r.o.cs}"`:''}>${esc(r.t)}</tspan>`).join('')}</text>`);});}});
 const vb=`0 0 ${W*PT} ${H*PT}`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${opt.attrs||''}><defs>${Object.values(defs).map(d=>d.xml).join('')}</defs><rect width="100%" height="100%" fill="#FFFFFF"/>${body.join('')}</svg>`;}

const api={W,H,BASE,PRESETS,STYLES:PRESETS,SLIDES,mix,buildModel,toPptx,patchZip,effectXml,exportPptx,toSvg,langOf,FONT_STACK};
if(typeof module!=='undefined')module.exports=api;else root.Deck=api;
})(this);
