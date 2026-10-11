// npm test：產生 9 種風格（M）＋表格／待選素材／單一元件測試檔 → office validate（嚴格 OOXML）＋ tools/check_pptx.py（PowerPoint 挑剔點）
// 另外檢查：studio.html 的版本戳記、文字控制字元、CSV／千分位、參數驗證。任何一項失敗 → exit 1。
const PptxGenJS=require('pptxgenjs'),JSZip=require('jszip'),D=require('../deck.js'),fs=require('fs'),path=require('path'),cp=require('child_process');
const OUT=path.join(__dirname,'..','out','test');fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const env={PptxGenJS,JSZip};let fail=0;const ok=(c,msg)=>{console.log((c?'  ✓ ':'  ✗ ')+msg);if(!c)fail++;};
const files=[];const save=async(name,params,opt)=>{const r=await D.exportPptx(env,params,Object.assign({type:'nodebuffer'},opt||{}));const f=path.join(OUT,name);fs.writeFileSync(f,r.data);files.push(f);return r;};
(async()=>{
 console.log('產生測試檔…');
 for(const st of D.PRESETS){const r=await save(`kit-${st.id}.pptx`,st);ok(!r.model.warns.length,`${st.id}：${r.model.slides.length} 頁、無排版警告${r.model.warns.length?'（'+r.model.warns.join('；')+'）':''}`);
  const c=r.model.connectors;ok(c.fail===0&&c.one===0,`${st.id}：黏著連接線 ${c.ok} 條（兩端 ${c.both}／單端 ${c.one}／失敗 ${c.fail}）`);}
 const nav=D.PRESETS[0],wine=D.PRESETS.find(p=>p.id==='wine');
 const kpi={title:'',unit:'',note:'註：\u0007控制字元測試',rows:[['指標','目標','實際'],['良率\u0000','98.5%','98.9%'],['產出','',''],['客訴','2','1']]};
 const m1=D.buildModel(nav,{table:kpi});await save('table-kpi.pptx',nav,{model:m1});
 const big={rows:[['項目','數值','說明']].concat(Array.from({length:60},(_,i)=>['列'+i,String(i*1234),'這是一段很長的說明文字，用來測試欄寬上限與列高下限'.repeat(i%3?1:3)]))};
 const m2=D.buildModel(wine,{table:big});await save('table-big.pptx',wine,{model:m2});ok(m2.warns.some(w=>/列數過多/.test(w)),'60 列表格：只放 25 列並提示');
 const tray=D.trayModel([{kind:'el',params:nav,key:'patterns',gi:5,name:'平行分流'},{kind:'icon',params:wine,icon:{id:'wafer',variant:'tint'},name:'晶圓'},{kind:'table',params:nav,table:kpi,name:'KPI'},{kind:'el',params:D.PRESETS[8],key:'patterns2',gi:0,name:'模式'}]);
 await save('tray.pptx',nav,{model:tray});ok(tray.tray.n===4,'待選素材 4 項');
 const em=D.elementModel(nav,'patterns',5);await save('element.pptx',nav,{model:em});
 const em2=D.elementModel(nav,'catalog',0);await save('element-catalog.pptx',nav,{model:em2});
 {const iv=D.PRESETS.find(p=>p.canvas)||nav;const e3=D.elementModel(iv,'catalog',41);const lb=e3.slides[0].items.find(i=>i.bgMatch);ok(lb&&lb.fill==='FFFFFF','單一元件匯出（'+iv.id+'）：群組名稱遮線底色改白');}
 // v9：數量 2／6、組版、改字、最小字級、語意色
 for(const st of D.PRESETS)for(const n of [2,6]){const r=await save(`counts-${st.id}-${n}.pptx`,Object.assign({},st,{nLin:n,nLane:n,nPcc:n,nWhy:n,nCause:n}),{only:['flex','rca']});
  const c=r.model.connectors;ok(!r.model.warns.length&&c.fail===0&&c.one===0,`${st.id} 數量 ${n}：無警告、連接線 ${c.both} 條兩端黏著`);}
 const trayE=[{kind:'el',params:nav,key:'patterns',gi:0,name:'三步驟流程'},{kind:'el',params:wine,key:'patterns2',gi:2,name:'問題對策'},{kind:'el',params:nav,key:'patterns2',gi:5,name:'PDCA'},{kind:'table',params:nav,table:kpi,name:'KPI'}];
 for(const lay of D.TRAY_LAYOUTS.map(l=>l[0])){const m=D.trayModel(trayE,{compose:{title:'CVD 參數優化後，良率提升 1.2 pt',sub:'2026 Q3 晶圓廠 A',foot:'資料來源：MES；期間 7–9 月',layout:lay,margin:'normal',unify:lay==='grid2'},frame:D.PRESETS.find(p=>p.id==='investor')});
  await save(`compose-${lay}.pptx`,nav,{model:m});const b=require('../deck.js');const over=m.slides[0].items.some(it=>it.t!=='ln'&&(it.x<-.01||it.y<-.01||it.x+it.w>13.34||it.y+it.h>7.51));ok(m.tray.n===4&&!over,`組版 ${lay}：4 項、全部在投影片內（×${m.tray.scale}、最小字 ${m.tray.minSize}pt）`);}
 {const L={'patterns2:2':{'0':{from:'問題\nProblem\n交期常延誤\n客戶抱怨增加',to:'問題\nProblem\n12 吋廠 B 線良率連三週低於目標，主要集中在 CMP 後段與量測站\n客訴 3 件'}}};const m=D.buildModel(nav,{only:['patterns2'],labels:L});const sl=m.slides[0],g=sl.groups[2],it=sl.items[g.from];
  ok(D.textOf(it).includes('12 吋廠')&&it.shrunk>0&&it.shrunk<1,`改字：套用＋放不下自動縮小（×${it.shrunk}）`);const em=D.elementModel(nav,'patterns2',2,{labels:L});await save('labels-element.pptx',nav,{model:em});
  const bad={'patterns2:2':{'0':{from:'別的字',to:'不該套用'}}};ok(!D.textOf(D.buildModel(nav,{only:['patterns2'],labels:bad}).slides[0].items[g.from]).includes('不該'),'改字：原文對不上就不套用');}
 {const e0=D.elementModel(nav,'patterns',0),e1=D.elementModel(Object.assign({},nav,{minFont:12}),'patterns',0);ok(e1.element.scale>1&&e1.element.minSize>=12&&e1.element.w>e0.element.w*0||D.minFontOf(e1.slides[0].items)>=12,`最小字級 12：三步驟流程放大 ×${e1.element.scale}，最小字 ${e1.element.minSize}pt`);await save('minfont-element.pptx',nav,{model:e1});}
 {const inv=D.PRESETS.find(p=>p.id==='investor');const m=D.buildModel(inv,{only:['catalog']});ok(m.sem.warn!==inv.P,`法說會紅：警示色 ${m.sem.warn} ≠ 主色 ${inv.P}`);
  const k=D.buildModel(nav,{only:['patterns2']}).slides[0];const runs=[].concat(...k.items.filter(i=>i.name==='變化').map(i=>i.runs));ok(runs.some(r=>r.o.color==='2E7D4F')&&runs.some(r=>r.o.color==='C0504D'),'KPI ▲▼ 依越高／越低越好上色（良＝綠、不良＝紅）');}
 // R1：表格重新設計（4 外觀 × 9 風格、單一強調色、狀態字精準比對、合計列、數字格式、門檻建議、貼上重設、舊快照相容）
 {const Y={title:'批次良率',rows:[['Lot','站點','Yield%','Defect','Status'],['A1','CMP','95.2%','12','Pass'],['A2','CMP','88.1%','31','Hold'],['A3','Etch','(86.4%)','40','Scrap'],['A4','Litho','93.7%','15','已完成 60%']],
   his:[{type:'col',i:2,color:'auto'},{type:'row',i:3,color:'alert'},{type:'cell',r:1,c:3,color:'A'},{type:'col',i:1}],rules:[{c:2,op:'<',v:90,tone:'warn',style:'fill'},{c:3,op:'>=',v:30,tone:'warn',style:'box'},{c:3,op:'=',v:12,tone:'good',style:'text'}]};
  let bad=0,n=0;const why=[];for(const st of D.PRESETS)for(const [lk] of D.TABLE_LOOKS)for(const hs of ['fill','box','bold']){const m=D.buildModel(Object.assign({},st,{tbLook:lk}),{table:Object.assign({},Y,{hiStyle:hs})});const t=m.slides[0].table;n++;
   const cells=m.slides[0].items.find(i=>i.t==='tbl').cells;const sizes=new Set();cells.forEach(r=>r.forEach(c=>c.runs.forEach(x=>{if(String(x.t).trim()&&x.t!=='●\u2002')sizes.add(x.o.size);})));
   const lowC=[];cells.forEach(r=>r.forEach(c=>{if(String(c.runs.map(x=>x.t).join('')).trim()&&D.contrastOf(c.color,c.fill||'FFFFFF')<4.5)lowC.push(c.color+'/'+(c.fill||'FFFFFF'));}));
   const colours=new Set(t.his.map(h=>h.C));
   if(m.warns.length||t.his.length!==3||t.ruleHits!==5||!/border:1\.5pt solid/.test(D.tableHtml(m))||(t.his.filter(h=>h.kind!=='warn').some(h=>h.C!==t.his[0].C)||!t.his.some(h=>h.kind==='warn'&&h.C!==t.his[0].C))||[...sizes].some(s=>s*2!==Math.round(s*2))||lowC.length){bad++;why.push(st.id+'/'+lk+'/'+hs+' '+m.warns.join()+' '+lowC.slice(0,2).join());}
   if((st.id==='navy'||st.id==='investor')&&hs==='box')await save(`table-r1-${st.id}-${lk}.pptx`,st,{model:m});}
  ok(!bad,`表格 R1：${n} 種組合（9 風格 × 4 外觀 × 3 重點樣式）都正確：重點同一強調色、警告另用紅、條件 5 格、字級為 0.5pt 倍數、文字對比 ≥ 4.5:1`+(bad?'｜'+why.slice(0,3).join('；'):''));
  const tm=D.tableMarks({his:[{type:'col',i:99},{type:'x'},{type:'cell',r:'1',c:1,color:'<b>'}],rules:[{c:1,op:'DROP',v:'abc',tone:'x',style:'y'}]},3,3);
  ok(tm.his.length===1&&tm.his[0].color==='auto'&&tm.rules[0].op==='<'&&!Number.isFinite(tm.rules[0].v)&&tm.rules[0].tone==='warn','tableMarks 擋掉非法強調／規則');
  // 解析
  ok(D.tNumVal('(86.2)')===-86.2&&D.tNumVal('▼ 4.1')===-4.1&&D.tNumVal('98.5%')===98.5&&D.tNumVal('1,234')===1234&&Number.isNaN(D.tNumVal('OK'))&&D.tNumVal('−3.5')===-3.5,'數值解析：括號負數、▼、%、千分位、U+2212');
  {const a=D.tableAuto([['Lot','Yield','Status','備註'],['A1','95%','Pass','已完成 60%'],['A2','88%','hold','OK'],['A3','91%','Scrap','']]);
   ok(a.head&&a.numC[1]&&a.statC[2]&&!a.statC[3]&&D.statusOf('Pass')==='good'&&D.statusOf('hold')==='prog'&&D.statusOf('Scrap')==='risk'&&D.statusOf('NG')==='risk'&&D.statusOf('WIP')==='prog'&&D.statusOf('已完成 60%')===null&&D.statusOf('Passed by QA')===null,'狀態字：英文 Pass／Hold／Scrap／NG／WIP、整格完全相同才算（「已完成 60%」不算）、只在狀態欄');
   const m=D.buildModel(nav,{table:{rows:[['項目','狀態','備註'],['A','完成','已完成 60%'],['B','風險','OK 了']]}});const c=m.slides[0].items.find(i=>i.t==='tbl').cells;
   ok(c[1][2].color===c[2][2].color&&c[1][2].runs.length===1&&c[1][1].runs[0].t==='●\u2002'&&!c[1][1].fill,'狀態欄＝小圓點＋上色文字、不填底；備註欄不上色');}
  // 合計列
  {const a=D.tableAuto([['','3Q25','2Q25'],['營收','989.9','933.8'],['毛利率','59.5%','58.6%'],['稅後淨利','452.3','398.3'],['EPS','17.44','15.36']]);ok(JSON.stringify(a.key)==='[3,4]','合計列：稅後淨利、EPS（毛利率不算）');
   const b=D.tableAuto([['週','產出'],['W1','10'],['W2','12'],['週平均','11']]);const c=D.tableAuto([['Tool','WPH'],['A','1'],['Total','1']]);const d=D.tableAuto([['Tool','WPH'],['A','1'],['B','2']],{lastTotal:true});
   ok(JSON.stringify(b.key)==='[3]'&&JSON.stringify(c.key)==='[2]'&&JSON.stringify(d.key)==='[2]','合計列：週平均、Total、勾「最後一列是合計」');
   const m=D.buildModel(nav,{table:{rows:[['','3Q25','2Q25'],['營收','989.9','933.8'],['稅後淨利','452.3','398.3'],['EPS','17.44','15.36']]}});const cl=m.slides[0].items.find(i=>i.t==='tbl').cells;
   ok(cl[2][1].bold&&cl[2][1].bT&&cl[3][1].bold&&!cl[3][1].bT,'合計列加粗＋上方一條線（連續合計只畫第一條）');}
  // 數字格式
  ok(D.tFmt('(1234.5)',{})==='(1,234.5)'&&D.tFmt('(1234.5)',{minus:'minus'})==='\u22121,234.5'&&D.tFmt('-0.5%',{minus:'paren'})==='(0.5%)'&&D.tFmt('-2',{minus:'hyphen'})==='-2'&&D.tFmt('+6.0%',{})==='+6.0%'&&D.tFmt('▼ 4.1',{})==='▼ 4.1'&&D.tFmt('91%',{dec:1})==='91.0%'&&D.tFmt('0.952',{pct:1,dec:1})==='95.2%'&&D.tFmt('1234567',{thou:false})==='1234567'&&D.tFmt('+0.9 ppts',{})==='+0.9 ppts'&&D.tFmt('NT$1200',{})==='NT$1,200','數字格式：U+2212／-／( ) 負號（預設保留原樣）、千分位、小數位、%、ppts、貨幣');
  {const R=[['Lot','Yield'],['A','95.2%'],['B','91%'],['C','88.4%']];ok(D.tableColDec(R,1,1,D.tableAuto(R))===1&&D.tableColDec([['x','v'],['a','989.9'],['b','17.44'],['c','1.2'],['d','3']],1,1,null)===null,'同欄小數位：眾數 ≥60% 才補齊，只補不砍');
   const m=D.buildModel(nav,{table:{rows:R}});ok(m.slides[0].items.find(i=>i.t==='tbl').cells[2][1].runs[0].t==='91.0%','預覽／匯出：91% → 91.0%');
   const ft=m.slides[0].items.find(i=>i.t==='tbl').cells[1][1].font;ok(!/Georgia|Times/.test(D.buildModel(D.PRESETS.find(p=>p.nFont==='Georgia')||nav,{table:{rows:R}}).slides[0].items.find(i=>i.t==='tbl').cells[1][1].font),'數字一律無襯線（Georgia 風格的表格數字改 Arial）');}
  // 門檻建議
  {const s1=D.tableSuggest([['Lot','片數','Yield%','Defect'],['A','25','95.2%','12'],['B','25','88.1%','31'],['C','24','91.0%','18']]);ok(s1.rule.c===2&&s1.rule.v===90&&s1.rule.op==='<'&&s1.rule.style==='text','門檻預設：挑 Yield% 欄、門檻 90（不是第一個數字欄、不是平均）');
   const s2=D.tableSuggest([['Tool','WPH','MTBF (h)'],['A','118','430'],['B','131','610'],['C','125','520']]);ok(Number.isInteger(s2.rule.v)&&s2.rule.v>0,'門檻預設：非 % 欄＝中位數取整 '+s2.rule.v);
   const s3=D.tableSuggest([['','3Q25','2Q25','QoQ'],['營收','989.9','933.8','+6.0%'],['毛利率','59.5%','58.6%','+0.9 ppts']]);ok(s3.period===1&&(s3.rule.c!==3||s3.rule.v===0),'財報表：最新期別欄＝3Q25；變化欄門檻＝0');}
  // 貼上重設
  {const prev={rows:[['a','b'],['1','2']],title:'舊標題',unit:'單位：新台幣十億元（EPS 除外）',note:'舊註',his:[{type:'col',i:1}],rules:[{c:1,op:'<',v:1}],pin:false};
   const n1=D.tableFromPaste([['項目','狀態'],['A','完成']],prev);ok(n1.title===''&&n1.unit===''&&n1.note===''&&!n1.his.length&&!n1.rules.length,'新貼上：標題／單位／註腳／重點／門檻全部重設');
   const n2=D.tableFromPaste([['項目','狀態'],['A','完成']],Object.assign({},prev,{pin:true}));ok(n2.title==='舊標題'&&n2.unit==='','📌 釘住標題：只保留標題');
   const n3=D.tableFromPaste([['','3Q25','2Q25'],['營收','989.9','933.8'],['淨利','452.3','398.3']],prev);ok(n3.his.length===1&&n3.his[0].i===1&&JSON.stringify(n3.bold)==='[2]','財報表貼上：自動把最新期別欄設為重點、合計列加粗');}
  // 版面
  {const R5=[['a','b','c','d','e'],['1','2','3','4','5']];const m=D.buildModel(Object.assign({},nav,{tbWidth:'fill'}),{table:{title:'T',unit:'U',rows:R5}}).slides[0].table;const m2=D.buildModel(nav,{table:{rows:[['a','b'],['1','2']]}}).slides[0].table;
   ok(Math.abs(m.tW-12.133)<.02&&Math.abs(m.tx-.6)<.001&&m2.tW<9&&Math.abs(m2.tx-.6)<.001,`版面：填滿＝12.13" 靠左 x0.6；自動＝依內容寬、小表靠左對齊標題（${m.tW.toFixed(2)}／${m2.tW.toFixed(2)}）`);
   const cw=D.buildModel(nav,{table:{rows:[['a','b','c'],['1','2','3']],cw:[3,2,1]}}).slides[0].table;ok(Math.abs(cw.colW[0]/cw.colW[2]-3)<.01&&Math.abs(cw.colW[1]/cw.colW[2]-2)<.01,'拖曳欄寬：T.cw 生效');}
  // 舊資料相容
  {ok(D.buildModel(nav,{table:{rows:Y.rows,hi:{type:'col',i:1}}}).slides[0].table.his.length===1,'舊版 T.hi 仍可用');
   const old=D.sanitizeParams(Object.assign({},nav,{tbLook:'panel'}),nav);const old2=D.sanitizeParams(Object.assign({},nav,{tbLook:'minimal'}),nav);const old3=D.sanitizeParams({P:nav.P,tbPanel:true},nav);
   ok(old.tbLook==='card'&&old.tbCard==='grey'&&old2.tbLook==='clean'&&old3.tbLook==='card','舊外觀（灰底面板／極簡／tbPanel）自動轉成新外觀');
   const tr=D.trayModel([{kind:'table',params:Object.assign({},nav,{tbLook:'panel',tbHiColor:'alert',tbHiMode:'box'}),table:Y,name:'良率（舊快照）'},{kind:'table',params:Object.assign({},nav,{tbLook:'minimal'}),table:{rows:[['a','b'],['1','2']]},name:'極簡'},{kind:'el',params:wine,key:'annot',gi:3,name:'標註'}]);await save('tray-marks.pptx',nav,{model:tr});ok(tr.tray.n===3,'待選素材：舊表格快照（灰底面板／極簡）仍可重建＋標註');}
  // 四個驗收案例（LibreOffice 也會畫）
  // R3：待選每項一頁、區塊間距、推薦色、檔名、套用上次樣式、標題平衡
  {const C=require('./table-cases.js');const nv=D.PRESETS[0];
   const es=['yield','pl','status','stress'].map(k=>({kind:'table',table:C[k],params:nv}));es.push({kind:'el',key:'patterns',gi:0,params:nv});
   const dk=D.trayDeck(es);ok(dk.slides.length===5&&dk.tray.pages===5&&dk.slides.slice(0,4).every((s,i)=>Math.abs(s.table.tx-D.buildModel(nv,{table:es[i].table}).slides[0].table.tx)<1e-6),'待選：每項一頁（5 頁），表格位置與單張匯出一致');
   await save('tray-deck.pptx',nv,{model:dk});
   let gb=[];for(const v of ['top','center'])for(const c of ['yield','pl','status']){const t=D.buildModel(Object.assign({},nv,{tbV:v}),{table:C[c]}).slides[0].table;const u=t.slots.unit,gap=t.ty-(u.y+u.h)-(t.look==='card'?.25:0);const s=t.slots.title;
     if(Math.abs(t.ty-(s.y+s.h+.3+.35*0+(C[c].unit?0:0)))>.6||gap<.2||gap>.5)gb.push(v+c+' gap'+gap.toFixed(2));if(v==='center'&&Math.abs((s.y-.5)-(7.5-.45-(t.ty+t.tH)-(t.slots.note?0:0)))>1.2)gb.push(v+c+' off');}
   ok(!gb.length,'標題／單位／表格＝同一區塊（間距 0.2–0.5"），置中時整組移動'+(gb.length?'｜'+gb.join('；'):''));
   let rb=[];for(const st of D.PRESETS){const t=D.buildModel(st,{table:Object.assign({},C.pl,{his:[{type:'col',i:1,kind:'rec'},{type:'col',i:2,kind:'focus'},{type:'row',i:3,kind:'warn'}]})}).slides[0].table;const [r,f,w]=t.his.map(h=>h.C);if(r===f||r===w||D.contrastOf(r,'FFFFFF')<3)rb.push(st.id);}
   ok(!rb.length,'推薦色：9 風格都跟重點／警告不同色、白底對比 ≥ 3:1'+(rb.length?'｜'+rb.join():''));
   const lg=D.buildModel(nv,{table:Object.assign({},C.pl,{his:[{type:'col',i:1,kind:'rec'},{type:'col',i:2}]})}).slides[0].items.find(i=>i.name==='圖例');ok(lg&&/推薦/.test(D.textOf(lg))&&/重點/.test(D.textOf(lg)),'兩種以上意義 → 註腳列有圖例');
   const fn=D.shortName('3Q25 稅後淨利 452.3，QoQ +13.6%、YoY +39.0%');ok([...fn].length<=20&&!/[，、%+\s]/.test(fn),'檔名：去標點、≤ 20 字（'+fn+'）');
   const prev=Object.assign({},C.yield,{keep:true,rules:[{c:2,op:'<',v:90,tone:'warn',style:'text'}],his:[{type:'col',i:2,kind:'rec'}],unit:'U',note:'N'});
   const nx=D.tableFromPaste([['Lot','Yield%','Station'],['B1','80%','CMP']],prev);ok(nx.rules.length===1&&nx.rules[0].c===1&&nx.his[0].i===1&&nx.unit==='U','套用上次樣式：依欄名帶入門檻／重點／單位');
   ok(!D.tableFromPaste([['Lot','Yield%'],['B1','80%']],Object.assign({},prev,{keep:false})).rules.length,'未勾選套用上次樣式：照常重設');
   const lt=D.buildModel(nv,{table:Object.assign({},C.pl,{title:'3Q25 稅後淨利 452.3 億元，QoQ +13.6%、YoY +39.0%，營收與毛利率雙雙創下歷史新高，第四季展望持續樂觀'})}).slides[0].items.find(i=>i.name==='表格標題');const tl=D.textOf(lt).split('\n');
   ok(tl.length===2&&lt.tx.size<=20&&Math.abs(D.tw(tl[0],20)-D.tw(tl[1],20))<=D.tw(tl[0],20)*.35&&!/[0-9.%]$/.test(tl[0])||tl.length===1,'長標題：降到 20pt 並平衡斷成兩行（寬 '+tl.map(x=>D.tw(x,20).toFixed(1)).join('/')+'"）');}
  {const C=require('./table-cases.js');const nv=D.PRESETS[0];const tb=(p,T)=>{const m=D.buildModel(Object.assign({},nv,p),{table:T});return {m,t:m.slides[0].table};};
   // 意義：重點／推薦＝強調色、警告＝紅；換外觀不變
   const T1=Object.assign({},C.yield,{his:[{type:'col',i:1,kind:'rec'},{type:'row',i:2,kind:'warn'},{type:'cell',r:3,c:3,kind:'focus'}]});let bad=0;
   for(const lk of ['clean','band','card','zebra'])for(const hs of ['fill','box','bold']){const {t}=tb({tbLook:lk},Object.assign({},T1,{hiStyle:hs}));const h=t.his;if(!(h[0].C!==h[2].C&&h[1].C!==h[0].C&&h[1].C!==h[2].C&&h[0].kind==='rec'))bad++;}
   ok(!bad,'表格：重點＝強調色、推薦＝綠/青、警告＝紅，4 外觀 × 3 樣式都保持');
   // 密度：字級、列高、邊距各自變
   const den=['comfy','normal','dense'].map(v=>tb({tbDense:v,tbLook:'clean'},C.status).t);
   ok(den[0].fs>den[1].fs&&den[1].fs>den[2].fs&&den[0].rowH[1]>den[2].rowH[1]&&den[0].rowH[1]/den[2].rowH[1]!==den[0].fs/den[2].fs,'表格：密度 舒適>標準>密集（字級、列高非等比）');
   // 壓力：長中文表頭、空白、負數、百分比、14 列 → 不溢出、內文 ≥ 10pt
   let sb=[];for(const lk of ['clean','band','card','zebra'])for(const dn of ['comfy','normal','dense'])for(const size of ['S','M','L']){const {m,t}=tb({tbLook:lk,tbDense:dn,size},C.stress);const bot=Math.max(...m.slides[0].items.map(i=>i.y+i.h));const right=Math.max(...m.slides[0].items.map(i=>i.x+i.w));
    if(bot>7.5-.2||right>13.333-.3||t.fs<10||m.warns.some(w=>/放不下|太寬/.test(w)))sb.push(`${lk}/${dn}/${size} fs${t.fs} bot${bot.toFixed(2)}`);}
   ok(!sb.length,'表格壓力測試 36 組：不溢出、內文 ≥ 10pt'+(sb.length?'｜'+sb.slice(0,4).join('；'):''));}
  {const C=require('./table-cases.js');for(const [k,T] of Object.entries(C))for(const lk of ['clean','band','card','zebra']){const m=D.buildModel(Object.assign({},nav,{tbLook:lk}),{table:T});await save(`table-case-${k}-${lk}.pptx`,nav,{model:m});}}
 }
 {const am=D.buildModel(nav,{only:['annot','catalog']});const an=am.slides.find(x=>x.key==='annot'),ca=am.slides.find(x=>x.key==='catalog');const names=an.groups.map(g=>g.name);
  ok(['強調框（實線）','強調框（虛線）','圈選','編號釘 ①②③','對話框','箭頭＋標籤','括號（橫）','括號（直）','旗標＋日期'].every(k=>names.includes(k))&&ca.groups.filter(g=>/^標註・/.test(g.full||'')).length===7,`標註頁 ${an.groups.length} 組、元件總表標註列 7 格`);
  const gi=an.groups.findIndex(g=>g.name==='對話框');const L={[`annot:${gi}`]:{}};const g=an.groups[gi];const ti=an.items.slice(g.from,g.to+1).findIndex(it=>it.runs&&it.runs.length);L[`annot:${gi}`][ti]={from:D.textOf(an.items[g.from+ti]),to:'良率連 6 批上升'};
  const e1=D.elementModel(Object.assign({},nav,{minFont:14,size:'L'}),'annot',gi,{labels:L});ok(D.textOf(e1.slides[0].items.find(it=>it.runs&&it.runs.length))==='良率連 6 批上升'&&e1.element.minSize>=14,`標註對話框：改字＋L＋最小字 14（×${e1.element.scale}）`);
  await save('annot-element.pptx',nav,{model:e1});
  const fill=an.items.filter(it=>it.t==='sp'&&/強調框|圈選/.test(it.name||''));ok(fill.length>=4&&fill.every(it=>!it.fill),'強調框／圈選是透明底（無填色）');
  const inv=D.PRESETS.find(p=>p.id==='investor');const ai=D.buildModel(inv,{only:['annot']}).slides[0].items.find(it=>it.name==='強調框');ok(ai&&ai.line!==inv.P,'法說會紅：標註預設警示色（不是主色紅）');
  const ap=D.buildModel(Object.assign({},nav,{anC:'P'}),{only:['annot']}).slides[0].items.find(it=>it.name==='強調框');ok(ap&&ap.line===nav.P,'標註顏色＝主色');
  for(const sz of ['S','L'])await save(`annot-${sz}.pptx`,Object.assign({},wine,{size:sz}),{only:['annot','catalog']});}
 console.log('嚴格 OOXML 驗證（office validate）＋ check_pptx.py…');
 for(const f of files){let v=0;try{cp.execFileSync('office',['validate',f],{stdio:'pipe'});}catch(e){v=1;}ok(!v,'office validate '+path.basename(f));}
 {let v=0;try{cp.execFileSync('python3',[path.join(__dirname,'check_zip.py'),...files],{stdio:'pipe'});}catch(e){v=1;console.log(String(e.stdout));}ok(!v,`封裝／id／連接線檢查（${files.length} 檔）`);}
 {const dn=[process.env.DOTNET,path.join(require('os').homedir(),'.dotnet/dotnet')].find(x=>x&&fs.existsSync(x));const ox=path.join(__dirname,'oxv/bin/oxv.dll');
  if(dn&&fs.existsSync(ox)){let v=0;try{cp.execFileSync(dn,[ox,...files],{stdio:'pipe'});}catch(e){v=1;console.log(String(e.stdout).split('\n').filter(l=>!/^OK/.test(l)).join('\n'));}ok(!v,`Open XML SDK（Microsoft365）驗證（${files.length} 檔）`);}
  else console.log('  （略過 Open XML SDK：先 cd tools/oxv && dotnet build -c Release -o bin）');}
 try{const r=cp.execFileSync('python3',[path.join(__dirname,'check_pptx.py'),...files],{encoding:'utf8'});ok(true,'check_pptx.py：全部 clean');}catch(e){console.log(e.stdout);ok(false,'check_pptx.py 有問題');}
 console.log('其他檢查…');
 ok(D.stripCtl('a\u0000b\u000Bc\u001Fd\n\te')==='abcd\n\te','stripCtl 去掉 XML 不允許的控制字元、保留換行／Tab');
 const bad=D.sanitizeParams({P:'1F4E79"/><img src=x onerror=alert(1)>',cnW:'NaN',tFont:'<b>',zh:'我的<script>'},nav);ok(bad.P===nav.P&&bad.cnW===nav.cnW&&bad.tFont===nav.tFont&&!/[<>]/.test(bad.zh),'sanitizeParams 擋掉注入／非法值');
 try{cp.execFileSync('python3',[path.join(__dirname,'stamp_version.py'),'--check'],{stdio:'pipe'});ok(true,'studio.html 版本戳記是最新');}catch(e){ok(false,'studio.html 版本戳記過期（python3 tools/stamp_version.py）');}
 console.log(fail?`\n✗ ${fail} 項失敗`:'\n✓ 全部通過');process.exit(fail?1:0);})().catch(e=>{console.error(e);process.exit(1);});
