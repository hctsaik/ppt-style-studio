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
  const cw=CW/11;S.forEach(([k,zh,en,fn],i)=>{const cx0=X0+cw*i+cw/2,w=cw-.2,h=.56;grp(zh,()=>fn(cx0-w/2,2.08,w,h));T(cx0-cw/2,2.82,cw,.26,zh,{size:10.5,bold:1,color:G.ink,align:'center',wrap:0,name:'符號名'});T(cx0-cw/2,3.06,cw,.24,en,{size:10,color:G.mute,align:'center',font:nf,wrap:0,name:'英文'});});
  T(X0,1.84,CW,.2,'',{name:'空白'});ln(X0,3.48,X1,3.48,{c:G.l2,w:.5});
  const C1={x:X0,y:3.7,w:7.3,h:2.78},C2={x:X0+7.6,y:3.7,w:CW-7.6,h:2.78};
  comp('L','基本流程範例','Basic flow',C1,(x,y,w,h)=>{const cy=y+.8,ws=[.9,1.15,1.2,1.05,1.0,.9],g=(w-ws.reduce((a,b)=>a+b))/5,xs=[];let xx=x;ws.forEach(v=>{xs.push(xx);xx+=v+g;});
   const N=[sym('term',xs[0],cy-.25,ws[0],.5,'開始',{strong:1,size:fs}),sym('io',xs[1],cy-.28,ws[1],.56,'輸入需求',{size:fs}),sym('dec',xs[2],cy-.42,ws[2],.84,'可行？',{alt:1,size:fs}),sym('proc',xs[3],cy-.28,ws[3],.56,'執行',{size:fs}),sym('doc',xs[4],cy-.32,ws[4],.64,'報告',{size:fs}),sym('term',xs[5],cy-.25,ws[5],.5,'結束',{strong:1,size:fs})];
   link(N[0],3,N[1],5);link(N[1],2,N[2],1);link(N[2],3,N[3],1);link(N[3],3,N[4],1);link(N[4],3,N[5],1);T(xs[2]+ws[2],cy-.36,g,.24,'是',{size:10,bold:1,color:G.t2,align:'center',name:'標註'});
   const dx=xs[2]+ws[2]/2,ix=xs[1]+ws[1]/2;link(N[2],2,N[1],4,{via:[[dx,cy+.82],[ix,cy+.82]]});T(dx+.08,cy+.46,.4,.24,'否',{size:10,bold:1,color:G.t2,name:'標註'});
   const db=sym('db',xs[3]+ws[3]/2-.42,y+1.85,.84,.72,'資料庫',{size:fs});link(N[3],2,db,0,{style:{tail:'triangle',dash:'sysDash'}});});
  comp('M','泳道符號版','Swimlane',C2,(x,y,w,h)=>{const lh=1.28,hw=.5;[['申請','Req'],['審核','Rev']].forEach(([t,e],i)=>{const ly=y+i*(lh+.06);box(x,ly,w,lh,{fill:W2,line:G.l2,lw:.75,name:'泳道'});box(x,ly,hw,lh,{fill:'F2F2F2',text:t.split('').join('\n'),size:10.5,bold:1,color:G.t2,margin:0,lsp:.95,name:'泳道標題'});});
   const a=sym('term',x+hw+.2,y+.38,.95,.48,'提出',{strong:1,size:fs}),b=sym('dec',x+hw+1.45,y+lh+.06+.3,1.1,.7,'核准？',{alt:1,size:fs}),c=sym('doc',x+w-1.1,y+.34,.95,.58,'歸檔',{size:fs});
   link(a,2,b,1,{mid:0});link(b,3,c,2);T(x+w-1.25,y+lh+.5,.4,.24,'是',{size:10,bold:1,color:G.t2,name:'標註'});});};
 /* B3·2 編號步驟 */
 SL.steps=()=>{const n=NUM('nLin',4,3);title('編號步驟 Numbered Steps','大編號、垂直步驟、大數字直式、圓形鏈、時間軸、V 形階段：數量跟「可調數量」同步 3–6（選取後按 − ＋）');
  const {Z,comp,T,H,pill,bdg,GRID,TN,DARK,W2,AC2,card,light,calc1,ph,av,chev,chevD,RAD}=UK();const C=GRID(3,2,Y0,Y1);const ST=[['釐清目的','Purpose'],['蒐集事實','Facts'],['分析根因','Analyze'],['導入對策','Act'],['標準化','Standardize'],['擴散','Scale']].slice(0,n);
  comp('A',`大編號步驟（${n}）`,'Big-number steps',C[0],(x,y,w,h)=>{const cw=w/n;ST.forEach(([t,e],i)=>{const xx=x+i*cw;txt(xx,y,cw,.6,two(i+1),{size:Z(n>4?24:30),bold:1,color:i===0?P:G.l1,font:nf,valign:'middle',name:'大編號'});box(xx,y+.66,cw-.16,.04,{fill:i===0?P:G.l2,name:'色條'});
   T(xx,y+.78,cw-.1,.3,t,{size:Z(n>4?10.5:12),bold:1,color:G.ink,wrap:0,name:'步驟'});T(xx,y+1.08,cw-.1,.26,e,{size:10,color:G.mute,font:nf,wrap:0,name:'英文'});});},{count:'nLin'});
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
   path([[cx0-t0/2,yy],[cx0+t0/2,yy],[cx0+t1/2,yy+lh-.04],[cx0-t1/2,yy+lh-.04]],{close:true,fill:f,name:'金字塔層'});T(x+pw+.16,yy,w-pw-.16,lh,[{t,b:1,c:G.ink},{t:'  '+['Vision','Strategy','Plan','Action'][i],s:10,c:G.mute,f:nf}],{size:Z(11.5),name:'層名'});ln(cx0+t1/2-.1,yy+lh/2,x+pw+.12,yy+lh/2,{c:G.l2,w:.5});});});
  comp('C','漏斗＋轉換率','Funnel',C[2],(x,y,w,h)=>{const n=4,lh=(h-.1)/n,fw=2.5;[['潛在客戶','1,200'],['需求確認','480'],['報價','160'],['成交','52']].forEach(([t,v],i)=>{const w0=fw*(1-i*.2),w1=fw*(1-(i+1)*.2),yy=y+i*lh,cx0=x+fw/2;
   path([[cx0-w0/2,yy],[cx0+w0/2,yy],[cx0+w1/2,yy+lh-.04],[cx0-w1/2,yy+lh-.04]],{close:true,fill:i===n-1?P:mix(G.l2,'FFFFFF',i*.1),name:'漏斗層'});T(cx0-.6,yy,1.2,lh-.04,v,{size:Z(11),bold:1,color:i===n-1?W2:G.ink,align:'center',font:nf,name:'數值'});
   T(x+fw+.16,yy,w-fw-.16,lh,t+(i?'  '+Math.round(100*[1200,480,160,52][i]/[1200,480,160,52][i-1])+'%':''),{size:10.5,color:G.t2,name:'層名'});});});
  comp('D','層級堆疊','Layer stack',C[3],(x,y,w,h)=>{[['應用層','Apps',W2],['平台層','Platform',TN(P,.85)],['基礎設施','Infra',P]].forEach(([t,e,f],i)=>{const yy=y+.06+i*.58;box(x+i*.18,yy,w-i*.36,.48,{fill:f,line:f===W2?G.l1:null,lw:1,r:.06,text:[{t,b:1},{t:'  '+e,s:10,b:0,f:nf}],size:Z(12),color:f===P?W2:G.ink,name:'層'});});});
  comp('E','寬欄透明條','Columns',C[4],(x,y,w,h)=>{const b1=x+1.2,b2=x+2.1,bw=.62;T(b1-.2,y,bw+.4,.26,'吸收',{size:10.5,bold:1,color:G.t2,align:'center',name:'欄名'});T(b2-.2,y,bw+.4,.26,'產出',{size:10.5,bold:1,color:G.t2,align:'center',name:'欄名'});colBar(b1,y+.3,bw,h-.34);colBar(b2,y+.3,bw,h-.34);
   [['階段一','看','練'],['階段二','問','談'],['階段三','想','寫']].forEach(([l,a,b],i)=>{const yy=y+.62+i*.46;T(x,yy-.15,1.0,.3,l,{size:10.5,name:'階段'});badge(b1+bw/2,yy,a,{d:.36,size:12,nodot:1});badge(b2+bw/2,yy,b,{d:.36,size:12,nodot:1});});});
  comp('F','階層樹 1→3','Top-down tree',C[5],(x,y,w,h)=>{const top=nd(x+w/2-.6,y+.05,1.2,'專案經理',{strong:1});const cw=(w-.3)/3;const ch=['製程','品保','設備'].map((t,i)=>nd(x+i*(cw+.15),y+.9,cw,t));ch.forEach(c=>link(top,2,c,0,{mid:y+.68}));
   ['3 人','2 人','4 人'].forEach((t,i)=>T(x+i*(cw+.15),y+1.36,cw,.26,t,{size:10,color:G.mute,align:'center',name:'說明'}));});};
