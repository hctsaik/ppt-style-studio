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
   [['人',0,-1],['機',1,0],['料',0,1],['法',-1,0]].forEach(([t,sx,sy])=>{const px=cx0+sx*1.05,py=cy0+sy*.72;ln(cx0+sx*.37,cy0+sy*.37,px-sx*.25,py-sy*.25,{c:G.l1,w:1});circ(px,py,.48,{fill:W2,line:G.l1,lw:1,text:t,size:Z(12),bold:1,color:G.ink,margin:0,name:'放射點'});});});
  const r2=C[4].y,rh=C[4].h,wE=CW-2*2.6-.6,CE={x:X0,y:r2,w:wE,h:rh},CF={x:X0+wE+.3,y:r2,w:2.6,h:rh},CG={x:X0+wE+2.9,y:r2,w:2.6,h:rh};
  comp('E','流程鏈＋說明','Chain + notes',CE,(x,y,w,h)=>{chain(x,y+.2,w,.56,['規劃','執行','檢討'],{size:Z(12)});const cd=chainDims(w,.56,3);[['Plan','界定範圍與目標'],['Do','小步執行、留紀錄'],['Check','比對差異、標準化']].forEach(([e,t],i)=>{const xx=x+i*cd.step;T(xx,y+.86,cd.iw,.26,e,{size:10,color:G.mute,align:'center',font:nf,wrap:0,name:'英文'});T(xx,y+1.12,cd.iw,.3,t,{size:10.5,color:G.ink,align:'center',wrap:0,name:'說明'});});});
  comp('F','垂直鏈','Vertical chain',CF,(x,y,w,h)=>{['蒐集資料','分析根因','導入對策'].forEach((t,i)=>{const yy=y+.02+i*.62;box(x+.3,yy,w-.6,.42,{fill:i===2?P:W2,line:i===2?null:G.l1,lw:1,r:.21,text:t,size:Z(11.5),bold:1,color:i===2?W2:G.ink,name:'流程鏈'});if(i<2)chevD(x+w/2-.09,yy+.48,.18);});});
  comp('G','文氏圖 2 圓','Venn',CG,(x,y,w,h)=>{const cy0=y+h/2-.08,d=1.3,cx0=x+w/2;circ(cx0-.42,cy0,d,{fill:P,ft:78,line:P,lw:1,name:'集合 A'});circ(cx0+.42,cy0,d,{fill:AC2,ft:78,line:AC2,lw:1,name:'集合 B'});
   T(cx0-1.05,cy0-.15,.6,.3,'技術',{size:Z(12),bold:1,color:PD,align:'center',name:'集合名'});T(cx0+.45,cy0-.15,.6,.3,'市場',{size:Z(12),bold:1,color:mix(AC2,'000000',.3),align:'center',name:'集合名'});T(cx0-.35,cy0-.15,.7,.3,'機會',{size:Z(11),bold:1,color:G.ink,align:'center',name:'交集'});});};
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
