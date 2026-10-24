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
 {const src=require('fs').readFileSync(__dirname+'/../studio.html','utf8');const T_SAMPLES={};eval(src.slice(src.indexOf('Object.assign(T_SAMPLES,{'),src.indexOf('const SAMPLE_T')));const bad=[];
  for(const st of D.PRESETS)for(const k of ['risk','issue','action','raci']){const m=D.buildModel(st,{table:T_SAMPLES[k]});const t=m.slides[0].items.find(x=>x.name==='表格標題');if(m.warns.length||!t||t.runs[0].o.color!==st.P)bad.push(st.id+'/'+k);}
  ok(!bad.length,'表格預設：風險表／議題追蹤／行動項目／RACI，9 風格無警告、標題跟隨主色'+(bad.length?'｜'+bad.join(','):''));
  const r=D.buildModel(nav,{table:T_SAMPLES.issue}).slides[0];ok(r.items.some(i=>i.t==='tbl'),'議題追蹤：原生表格');
  {const T2={rows:[['項目','變化'],['良率','▲ 2%'],['成本','▼ 3%']]};const cl=o=>D.buildModel(Object.assign({},nav,o),{table:T2}).slides[0].items.find(i=>i.t==='tbl').cells;const c1=cl({}),c2=cl({tbArrow:'sem'});const col=(c,r)=>c[r][1].color||((c[r][1].runs||[])[0]||{o:{}}).o.color;ok(col(c1,1)===nav.P&&col(c1,2)===nav.t2&&col(c2,2)==='A15C00','表格 ▲▼ 預設主色＋灰（不用紅綠），可切換好壞色');}}
 const big={rows:[['項目','數值','說明']].concat(Array.from({length:60},(_,i)=>['列'+i,String(i*1234),'這是一段很長的說明文字，用來測試欄寬上限與列高下限'.repeat(i%3?1:3)]))};
 const m2=D.buildModel(wine,{table:big});await save('table-big.pptx',wine,{model:m2});ok(m2.slides.length===1&&m2.slides.every(s=>s.table.exportComplete)&&JSON.stringify(m2.slides.flatMap(s=>s.table.bodySourceRows))===JSON.stringify(Array.from({length:60},(_,i)=>i+1)),'60 列表格：單張完整原生表格、保留字級、全部資料依序匯出一次');
 const tray=D.trayModel([{kind:'el',params:nav,key:'patterns',gi:5,name:'平行分流'},{kind:'icon',params:wine,icon:{id:'wafer',variant:'tint'},name:'晶圓'},{kind:'table',params:nav,table:kpi,name:'KPI'},{kind:'el',params:D.PRESETS[8],key:'patterns',gi:3,name:'審核迴圈'}]);
 await save('tray.pptx',nav,{model:tray});ok(tray.tray.n===4,'待選素材 4 項');
 const em=D.elementModel(nav,'patterns2',1);await save('element.pptx',nav,{model:em});
 const em2=D.elementModel(nav,'catalog',0);await save('element-catalog.pptx',nav,{model:em2});
 {const iv=D.PRESETS.find(p=>p.canvas)||nav;const e3=D.elementModel(iv,'catalog',41);const lb=e3.slides[0].items.find(i=>i.bgMatch);ok(lb&&lb.fill==='FFFFFF','單一元件匯出（'+iv.id+'）：群組名稱遮線底色改白');}
 // v9：數量 2／6、組版、改字、最小字級、語意色
 for(const st of D.PRESETS)for(const n of [2,6]){const r=await save(`counts-${st.id}-${n}.pptx`,Object.assign({},st,{nLin:n,nLane:n,nPcc:n,nWhy:n,nCause:n}),{only:['flex','rca']});
  const c=r.model.connectors;ok(!r.model.warns.length&&c.fail===0&&c.one===0,`${st.id} 數量 ${n}：無警告、連接線 ${c.both} 條兩端黏著`);}
 {/* v25：項目數 3–6（清單／步驟）9 風格無警告、不重疊；框架說明寫進備忘稿 */const O=require('./overlap.js');const bad=[];
  for(const st of D.PRESETS)for(const n of [3,4,5,6]){const m=D.buildModel(Object.assign({},st,{nIcon:n,nList:n,nLin:n}),{only:['lists','steps']});m.warns.forEach(w=>bad.push(st.id+n+w));m.slides.forEach(s=>O.overlaps(s).forEach(o=>bad.push(st.id+n+s.key+o)));
   const g=m.slides.find(s=>s.key==='lists').groups.find(g=>/^編號清單/.test(g.name));if(!g||g.count!=='nList'||!g.name.includes(n+' 項'))bad.push(st.id+n+' 編號清單數量');}
  ok(!bad.length,'項目數 3/4/5/6：清單、步驟 9 風格無警告、不重疊'+(bad.length?'｜'+bad.slice(0,4).join('；'):''));
  for(const n of [3,6]){await save(`counts-list-${n}.pptx`,Object.assign({},nav,{nIcon:n,nList:n,nLin:n}),{only:['lists','steps']});}
  const fw=await save('framework-notes.pptx',nav,{only:['biz','mtx','rca2']});const z=await JSZip.loadAsync(fs.readFileSync(path.join(OUT,'framework-notes.pptx')));let nn=0;for(const f of Object.keys(z.files).filter(f=>/notesSlide\d+\.xml$/.test(f))){const x=await z.file(f).async('string');nn+=(x.match(/什麼時候用/g)||[]).length;}
  ok(nn>=10&&D.fwHelp('波特五力').how.length===3,'框架說明：備忘稿含 '+nn+' 份「什麼時候用／怎麼填／示範文案」');}
 const trayE=[{kind:'el',params:nav,key:'patterns',gi:0,name:'三步驟流程'},{kind:'el',params:wine,key:'patterns',gi:1,name:'判斷分岔'},{kind:'el',params:nav,key:'patterns2',gi:2,name:'輸入→處理→輸出'},{kind:'table',params:nav,table:kpi,name:'KPI'}];
 for(const lay of D.TRAY_LAYOUTS.map(l=>l[0])){const m=D.trayModel(trayE,{compose:{title:'CVD 參數優化後，良率提升 1.2 pt',sub:'2026 Q3 晶圓廠 A',foot:'資料來源：MES；期間 7–9 月',layout:lay,margin:'normal',unify:lay==='grid2'},frame:D.PRESETS.find(p=>p.id==='investor')});
  await save(`compose-${lay}.pptx`,nav,{model:m});const b=require('../deck.js');const over=m.slides[0].items.some(it=>it.t!=='ln'&&(it.x<-.01||it.y<-.01||it.x+it.w>13.34||it.y+it.h>7.51));ok(m.tray.n===4&&!over,`組版 ${lay}：4 項、全部在投影片內（×${m.tray.scale}、最小字 ${m.tray.minSize}pt）`);}
{/* v19：變體字母依閱讀順序（同列左→右）＋灰字標籤旁必有圖形或文字 */const R=require("./readorder.js");const bad=[];for(const st of D.PRESETS){const m=D.buildModel(st,{examples:true});m.slides.forEach(s=>{R.readOrder(s).forEach(o=>bad.push(st.id+"/"+s.key+"："+o));R.orphanLabels(s).forEach(o=>bad.push(st.id+"/"+s.key+" 孤兒灰字："+o));});}ok(!bad.length,"變體字母閱讀順序、灰字標籤皆有對應圖形"+(bad.length?"："+bad.slice(0,6).join("；"):""));}
{/* v18：文字框彼此重疊檢查（估算實際字寬／行數，全站 9 主題） */const O=require("./overlap.js");const bad=[];for(const st of D.PRESETS){const m=D.buildModel(st,{examples:true});m.slides.forEach(s=>O.overlaps(s).forEach(o=>bad.push(st.id+"/"+s.key+"："+o)));}ok(!bad.length,"文字框不重疊（全站 9 主題）"+(bad.length?"："+bad.slice(0,6).join("；"):""));}
 {/* v17：標題下方必有元件（產生檢查）＋表格「只有細橫線」樣式 */const bad=[];for(const st of D.PRESETS){const m=D.buildModel(st,{examples:true});m.warns.filter(w=>/heading/.test(w)).forEach(w=>bad.push(w));}
  const hm=D.buildModel(Object.assign({},nav,{tbLook:'hair'}),{table:kpi});const tc=hm.slides[0].items.find(i=>i.t==='tbl');const bs=tc?tc.cells.flat().map(c=>c.bB).filter(Boolean):[];
  ok(!bad.length&&D.TABLE_LOOKS.some(l=>l[0]==='hair')&&bs.length&&bs.every(b=>b.c==='D9D9D9'&&b.w===.5),'每個標題下方 0.7 吋內有元件（9 風格）；表格「只有細橫線」0.5pt #D9D9D9'+(bad.length?'｜'+bad.slice(0,3).join('；'):''));}
 {const GI=D.buildModel(nav,{only:['cmp2']}).slides[0].groups.findIndex(g=>g.name==='痛點 vs 改善');const L={['cmp2:'+GI]:{'5':{from:'人工對帳耗時 3 天',to:'12 吋廠 B 線人工對帳耗時 3 天，主要集中在月底結帳與跨部門核對'}}};const m=D.buildModel(nav,{only:['cmp2'],labels:L});const sl=m.slides[0],g=sl.groups[GI],it=sl.items[g.from+5];
  ok(D.textOf(it).includes('12 吋廠')&&it.shrunk>0&&it.shrunk<1,`改字：套用＋放不下自動縮小（×${it.shrunk}）`);const em=D.elementModel(nav,'cmp2',GI,{labels:L});await save('labels-element.pptx',nav,{model:em});
  const bad={'cmp2:1':{'5':{from:'別的字',to:'不該套用'}}};ok(!D.textOf(D.buildModel(nav,{only:['cmp2'],labels:bad}).slides[0].items[g.from+5]).includes('不該'),'改字：原文對不上就不套用');}
 {const e0=D.elementModel(nav,'patterns',0),e1=D.elementModel(Object.assign({},nav,{minFont:12}),'patterns',0);ok(e1.element.scale>1&&e1.element.minSize>=12&&e1.element.w>e0.element.w*0||D.minFontOf(e1.slides[0].items)>=12,`最小字級 12：三步驟流程放大 ×${e1.element.scale}，最小字 ${e1.element.minSize}pt`);await save('minfont-element.pptx',nav,{model:e1});}
 {const inv=D.PRESETS.find(p=>p.id==='investor');const m=D.buildModel(inv,{only:['catalog']});ok(m.sem.warn!==inv.P,`法說會紅：警示色 ${m.sem.warn} ≠ 主色 ${inv.P}`);
  const k=D.buildModel(nav,{only:['kpi'],nosplit:1}).slides[0];const runs=[].concat(...k.items.filter(i=>i.name==='變化').map(i=>i.runs));ok(runs.some(r=>r.o.color===nav.P)&&runs.some(r=>r.o.color==='A15C00'),'KPI ▲▼ 依越高／越低越好上色（良＝主色、不良＝深琥珀，不用紅綠）');}
 // v10：標籤元件（左＝圖示／短字、右＝文字）：9 風格無警告、≥11 個元件、圖示可換、單一元件 .pptx
 {let bad=[];for(const st of D.PRESETS){const m=D.buildModel(st,{only:['labels'],nosplit:1});const g=m.slides[0].groups;if(m.warns.length||g.length<11)bad.push(st.id+' '+g.length+' '+m.warns.join());}
  ok(!bad.length,'標籤元件：9 風格各 '+D.buildModel(nav,{only:['labels'],nosplit:1}).slides[0].groups.length+' 個元件、無排版警告'+(bad.length?'｜'+bad.join('；'):''));
  const sl0=D.buildModel(nav,{only:['labels'],nosplit:1}).slides[0],g0=sl0.groups[0];const gi=sl0.items.slice(g0.from,g0.to+1).findIndex(i=>i.ic);
  const L={['labels:0']:{[gi]:{from:sl0.items[g0.from+gi].ic.id,icon:'star'}}};const em=D.elementModel(nav,'labels',0,{labels:L});const it=em.slides[0].items.find(i=>i.ic);
  ok(gi>=0&&it.ic.id==='star'&&/^圖示 /.test(it.name)&&JSON.stringify(it.points)!==JSON.stringify(sl0.items[g0.from+gi].points),'標籤元件：改字面板換圖示（shopping_cart → star）');
  ok(!D.buildModel(nav,{only:['labels'],labels:{'labels:0':{[gi]:{from:'other',icon:'star'}}}}).slides[0].items.some(i=>i.ic&&i.ic.id==='star'),'標籤元件：原圖示對不上就不換');
  await save('labelcomp-element.pptx',nav,{model:em});await save('labelcomp-investor.pptx',D.PRESETS.find(p=>p.id==='investor'),{only:['labels'],nosplit:1});
  const K=D.buildModel(nav,{only:['labels'],nosplit:1}).slides[0];const kg=K.groups.find(g=>g.name==='直式標籤清單');ok(kg&&K.items.slice(kg.from,kg.to+1).filter(i=>i.runs).length>=8,'直式清單：4 組短字＋文字皆可編輯');}
 // v11：對比式排版（2 頁、11 款）：9 風格無警告；只改數字保留格式；倍數／增減／長條自動重算；單一元件 .pptx
 {let bad=[];for(const st of D.PRESETS){const m=D.buildModel(st,{only:['cmp','cmp2'],nosplit:1});const n=m.slides.reduce((a,s)=>a+s.groups.length,0);if(m.warns.length||n<11)bad.push(st.id+' '+n+' '+m.warns.join());}
  ok(!bad.length,'對比式排版：9 風格各 11 個元件、無排版警告'+(bad.length?'｜'+bad.join('；'):''));
  const sl=D.buildModel(nav,{only:['cmp']}).slides[0];const gA=sl.groups.findIndex(g=>/橫向對比/.test(g.name)),g=sl.groups[gA];const its=sl.items.slice(g.from,g.to+1);
  const ix=its.findIndex(i=>D.textOf(i)==='4000 元');ok(ix>=0&&its.some(i=>i.calc&&D.textOf(i)==='×2'),'橫向對比：數值「4000 元」＋徽章 ×2');
  const L={['cmp:'+gA]:{[ix]:{from:'4000 元',to:'6000 元'}}};const s2=D.buildModel(nav,{only:['cmp'],labels:L}).slides[0];const i2=s2.items.slice(g.from,g.to+1);
  ok(i2[ix].runs[0].t==='6000'&&i2[ix].runs[0].o.size>i2[ix].runs[1].o.size&&i2.some(i=>i.calc&&D.textOf(i)==='×3'),'改數字 4000→6000：保留大數字＋小單位格式、徽章自動 ×3');
  const gB=sl.groups.findIndex(g=>/多指標/.test(g.name)),b=sl.groups[gB],bi=sl.items.slice(b.from,b.to+1);const k=bi.findIndex(i=>D.textOf(i)==='7 天');
  const s3=D.buildModel(nav,{only:['cmp'],labels:{['cmp:'+gB]:{[k]:{from:'7 天',to:'5 天'}}}}).slides[0];ok(s3.items.slice(b.from,b.to+1).some(i=>i.calc&&D.textOf(i)==='−50%'),'多指標：交期 10→5 天 → Δ −50%');
  const gC=sl.groups.findIndex(g=>/長條/.test(g.name)),c=sl.groups[gC],ci=sl.items.slice(c.from,c.to+1);const kc=ci.findIndex(i=>D.textOf(i).trim()==='2000');
  const s4=D.buildModel(nav,{only:['cmp'],labels:{['cmp:'+gC]:{[kc]:{from:D.textOf(ci[kc]),to:'3000 '}}}}).slides[0];const bars=s4.items.slice(c.from,c.to+1).filter(i=>i.calc&&i.calc.m==='bar');
  ok(bars.length===2&&Math.abs(bars[0].w/bars[1].w-.75)<.01,'長條比較：2000→3000，長度比自動變 75%');
  const s5=D.buildModel(nav,{only:['cmp2']}).slides[0];ok(s5.items.some(i=>i.calc&&D.textOf(i)==='↓80%'),'降幅：5%→1% 徽章 ↓80%');
  for(const [kk,gi] of [['cmp',gA],['cmp2',1]]){const em=D.elementModel(nav,kk,gi);await save('compare-'+kk+'-'+gi+'.pptx',nav,{model:em});}
  await save('compare-investor.pptx',D.PRESETS.find(p=>p.id==='investor'),{only:['cmp','cmp2'],nosplit:1});}
 // v12：缺漏元件 4 頁（KPI＋評比、時間軸／甘特、2×2／議程、註腳／強調）：9 風格各頁元件數、無警告、白底、改字重算、螢光底 OOXML、單一元件 .pptx
 {const PG={kpi:7,rating:6,tline:4,mtx:6,emph:8};let bad=[];for(const st of D.PRESETS){const m=D.buildModel(st,{only:Object.keys(PG),nosplit:1});
   m.slides.forEach(s=>{if(s.groups.length<PG[s.key])bad.push(st.id+'/'+s.key+' '+s.groups.length);if(s.items.some(i=>i.name==='畫布面板'))bad.push(st.id+'/'+s.key+' 有畫布');});if(m.warns.length)bad.push(st.id+' '+m.warns.join());}
  ok(!bad.length,'缺漏元件 4 頁：9 風格各 '+Object.entries(PG).map(([k,v])=>k+'≥'+v).join('／')+'、無排版警告、白底'+(bad.length?'｜'+bad.join('；'):''));
  const all=D.buildModel(nav).slides.map(s=>s.key);ok(all[0]==='catalog'&&all.indexOf('kpi')===D.SLIDES.findIndex(e=>e[0]==='kpi')&&all.length===D.SLIDES.length&&all.indexOf('ex1')<all.indexOf('profile'),'頁序依 SLIDES（00 總覽 → A–G → X 附錄）');
  {const NEW=['frame','lists','steps','agenda','people','rating','chart','cmp3','rca2','decide','shots','story','sum','pcn','weekly','profile','skills','star','folio','frame2','story2','skills2','cover2','cover3','section2','section3','closing2','closing3','map2','quote2','biz2','quote','map','biz','pitch','plan','cover','section','closing'];const bad=[];
   for(const st of D.PRESETS){const m=D.buildModel(st,{only:NEW});m.slides.forEach(s=>{if(s.groups.length<(/^(cover|closing|quote)\d$/.test(s.key)?1:/^(sum|pcn|weekly|cover|section|closing|biz|plan|map|quote)\d*$/.test(s.key)||D.SPLIT_PARTS[s.key.replace(/\d+$/,'')]?2:6))bad.push(st.id+'/'+s.key+' 元件 '+s.groups.length);const mf=Math.min(...s.groups.map(g=>D.minFontOf(s.items.slice(g.from,g.to+1))||99));if(mf<9)bad.push(st.id+'/'+s.key+' 最小字 '+mf);});if(m.warns.length)bad.push(st.id+' '+m.warns.join());}
   ok(!bad.length,'新頁 '+NEW.length+' 頁：9 風格各 ≥6 元件（頁型 ≥3）、元件內最小字 ≥9pt（英文小標、地名 9pt）、無警告'+(bad.length?'｜'+bad.slice(0,8).join('；'):''));
  {const EX=new Set(['catalog','icons','iconcomponents','iconvariants','ex1','ex2','ex3','sum','pcn','weekly','flow','star','cards','cmp2']);const bad=[];for(const st of D.PRESETS){D.buildModel(st,{examples:true}).slides.forEach(s=>{const n=new Set(s.groups.filter(g=>!/^示意/.test(g.name)).map(g=>g.name.replace(/^小標籤・.*/,'小標籤'))).size;if(!EX.has(s.key)&&n>6)bad.push(st.id+'/'+s.key+' '+n);});}ok(!bad.length,'每頁 ≤6 個變體（總覽／圖示／Icon 元件／整頁範例除外），超過的拆成子頁'+(bad.length?'｜'+bad.slice(0,6).join('；'):''));}
   const secs=D.SECTIONS.map(x=>x[0]);ok(D.SLIDES.every(e=>e.length===5&&secs.includes(e[4]))&&new Set(D.SLIDES.map(e=>e[2])).size===D.SLIDES.length&&new Set(D.SLIDES.map(e=>e[0])).size===D.SLIDES.length,'SLIDES：頁碼／ID 唯一、皆屬於 SECTIONS 分組');
   const F=D.buildModel(nav,{only:['folio','shots','profile']}).slides;ok(F.every(s=>s.items.some(i=>i.t==='pic'&&/^data:image\/png/.test(i.png))),'圖片框：作品集／截圖／個人檔案含可「變更圖片」的真圖片');
   ok(Object.keys(D.USED).every(k=>D.SLIDES.some(e=>e[0]===k)&&D.USED[k].every(c=>D.SLIDES.some(e=>e[2]===c||e[2]===c.replace(/·[A-Z]$/,'')))),'範例頁「本頁使用元件」頁碼皆存在');}
  const K=D.buildModel(nav,{only:['kpi'],nosplit:1}).slides[0];const gi=n=>K.groups.findIndex(g=>g.name===n);const its=g=>K.items.slice(K.groups[g].from,K.groups[g].to+1);
  const gB=gi('數值＋目標＋Δ'),bI=its(gB),kv=bI.findIndex(i=>D.textOf(i)==='96.8 %');ok(kv>=0&&bI.some(i=>i.calc&&D.textOf(i)==='▲ +2%'),'KPI：數值 96.8 %、目標 95.0 %、Δ ▲ +2%');
  const s2=D.buildModel(nav,{only:['kpi'],labels:{['kpi:'+gB]:{[kv]:{from:'96.8 %',to:'90.0 %'}}}}).slides[0];ok(s2.items.slice(K.groups[gB].from,K.groups[gB].to+1).some(i=>i.calc&&D.textOf(i)==='▼ −5%'),'KPI：改數值 90.0 → Δ 自動 ▼ −5%');
  const R=D.buildModel(nav,{only:['rating']}).slides[0];const gr=n=>R.groups.findIndex(g=>g.name===n);const itr=g=>R.items.slice(R.groups[g].from,R.groups[g].to+1);
  const gE=gr('細進度條'),eI=itr(gE),pk=eI.findIndex(i=>D.textOf(i)==='65%');const s3=D.buildModel(nav,{only:['rating'],labels:{['rating:'+gE]:{[pk]:{from:'65%',to:'50%'}}}}).slides[0];
  const bars=s3.items.slice(R.groups[gE].from,R.groups[gE].to+1).filter(i=>i.calc&&i.calc.m==='pbar');ok(Math.abs(bars[1].w/bars[0].w-.5)<.01,'進度條：65%→50% 長度自動調整');
  const gH=gr('Harvey ball'),hI=itr(gH),hk=hI.findIndex(i=>D.textOf(i)==='25%');const s4=D.buildModel(nav,{only:['rating'],labels:{['rating:'+gH]:{[hk]:{from:'25%',to:'75%'}}}}).slides[0];
  const w4=s4.items.slice(R.groups[gH].from,R.groups[gH].to+1).filter(i=>i.calc&&i.calc.m==='hb');ok(Math.abs(w4[1].points[2].curve.swAng-270)<.01,'Harvey ball：25%→75% 扇形 270°');
  const gD=gr('1–5 點數'),dI=itr(gD),dk=dI.findIndex(i=>D.textOf(i)==='4/5');const s5=D.buildModel(nav,{only:['rating'],labels:{['rating:'+gD]:{[dk]:{from:'4/5',to:'2/5'}}}}).slides[0];
  ok(s5.items.slice(R.groups[gD].from,R.groups[gD].to+1).filter(i=>i.calc&&i.calc.m==='dot'&&i.fill===nav.P).length===2+3+5,'1–5 點數：4/5→2/5 自動上色');
  const E=D.buildModel(nav,{only:['emph'],nosplit:1}).slides[0];const runs=[].concat(...E.items.filter(i=>i.runs).map(i=>i.runs));ok(runs.filter(r=>r.o.hl).length===2&&runs.some(r=>r.o.strike)&&runs.some(r=>r.o.u),'強調：淡色螢光底 2 種、刪除線、底線');
  {const mi=E.items.findIndex(i=>i.mk);const M=E.items[mi];ok(M&&M.name==='半高螢光筆'&&M.mk.a===.55&&M.mk.b===.92&&E.groups.length===10&&E.groups.every(g=>E.items.slice(g.from,g.to+1).some(i=>i.name==='編號徽章')),'強調：10 張卡各有編號徽章；半高螢光筆 55%／92% 硬切');
   const gM=E.groups.findIndex(g=>g.name==='半高螢光筆'),ix=mi-E.groups[gM].from;const S2=D.buildModel(nav,{only:['emph'],nosplit:1,labels:{['emph:'+gM]:{[ix]:{from:'良率提升 1.2 pt',to:'良率提升 1.2 pt，交期縮短 2 天'}}}}).slides[0];ok(S2.items[mi].mk&&S2.items[mi].w>M.w+1,'半高螢光筆：改字後方塊（色帶）跟著變寬');
   const gU=E.groups.findIndex(g=>g.name==='底線強調'),uI=E.items.slice(E.groups[gU].from,E.groups[gU].to+1),uk=uI.findIndex(i=>i.name==='強調句');const S3=D.buildModel(nav,{only:['emph'],nosplit:1,labels:{['emph:'+gU]:{[uk]:{from:D.textOf(uI[uk]),mk:1}}}}).slides[0];const U=S3.items[E.groups[gU].from+uk];
   ok(U.mk&&U.mk.c===S3.mkC&&U.w<uI[uk].w&&D.textOf(U)===D.textOf(uI[uk])&&U.runs.some(r=>r.o.u),'改字：任一強調句可勾「半高螢光筆」（保留原格式、寬度貼字）');}
  const S=D.buildModel(nav,{only:['emph'],nosplit:1,labels:{}}).slides[0];ok(S.items.some(i=>i.calc&&D.textOf(i)==='↓76%'),'前後值：5.0%→1.2% 徽章 ↓76%');
  const r=await save('gap-navy.pptx',nav,{only:Object.keys(PG).concat(['emph2'])});const z=await JSZip.loadAsync(r.data);const x4=await z.file('ppt/slides/slide'+(D.SLIDES.filter(e=>PG[e[0]]).findIndex(e=>e[0]==='emph')+1)+'.xml').async('string');
  ok(/name="半高螢光筆"[\s\S]*?<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0">[\s\S]*?pos="55000"[\s\S]*?pos="92000"[\s\S]*?<\/a:gradFill>[\s\S]*?wrap="none"><a:spAutoFit\/><\/a:bodyPr>/.test(x4),'OOXML：半高螢光筆＝文字方塊硬切漸層＋wrap none＋spAutoFit');
  const xAll=(await Promise.all(Object.keys(z.files).filter(f=>/^ppt\/slides\/slide\d+\.xml$/.test(f)).map(f=>z.file(f).async('string')))).join('');
  ok(/<a:highlight><a:srgbClr val="[0-9A-F]{6}"\/><\/a:highlight>/.test(xAll)&&/strike="sngStrike"/.test(xAll)&&/ u="sng"/.test(xAll),'OOXML：自訂 srgb 醒目提示、刪除線、底線');
  for(const k of Object.keys(PG))for(const g of [0,1]){const em=D.elementModel(nav,k,g);await save('gap-'+k+'-'+g+'.pptx',nav,{model:em});}
  for(const id of ['investor','wire','charcoal'])await save('gap-'+id+'.pptx',D.PRESETS.find(p=>p.id===id),{only:Object.keys(PG),nosplit:1});
  ok(D.buildModel(nav,{only:['chart']}).slides[0].items.some(i=>/swiffchart/.test(D.textOf(i))),'圖表頁：指向 SwiffChart');}
 // R1：表格重新設計（4 外觀 × 9 風格、單一強調色、狀態字精準比對、合計列、數字格式、門檻建議、貼上重設、舊快照相容）
 {const Y={title:'批次良率',rows:[['Lot','站點','Yield%','Defect','Status'],['A1','CMP','95.2%','12','Pass'],['A2','CMP','88.1%','31','Hold'],['A3','Etch','(86.4%)','40','Scrap'],['A4','Litho','93.7%','15','已完成 60%']],
   his:[{type:'col',i:2,color:'auto'},{type:'row',i:3,color:'alert'},{type:'cell',r:1,c:3,color:'A'},{type:'col',i:1}],rules:[{c:2,op:'<',v:90,tone:'warn',style:'fill'},{c:3,op:'>=',v:30,tone:'warn',style:'box'},{c:3,op:'=',v:12,tone:'good',style:'text'}]};
  let bad=0,n=0;const why=[];for(const st of D.PRESETS)for(const [lk] of D.TABLE_LOOKS)for(const hs of ['fill','box','bold']){const m=D.buildModel(Object.assign({},st,{tbLook:lk}),{table:Object.assign({},Y,{hiStyle:hs})});const t=m.slides[0].table;n++;
   const cells=m.slides[0].items.find(i=>i.t==='tbl').cells;const sizes=new Set();cells.forEach(r=>r.forEach(c=>c.runs.forEach(x=>{if(String(x.t).trim()&&x.t!=='●\u2002')sizes.add(x.o.size);})));
   const lowC=[];cells.forEach(r=>r.forEach(c=>{if(String(c.runs.map(x=>x.t).join('')).trim()&&D.contrastOf(c.color,c.fill||'FFFFFF')<4.5)lowC.push(c.color+'/'+(c.fill||'FFFFFF'));}));
   const colours=new Set(t.his.map(h=>h.C));
   if(m.warns.length||t.his.length!==4||(t.ruleHits||0)!==0||(t.his.filter(h=>h.kind!=='warn').some(h=>h.C!==t.his[0].C)||!t.his.some(h=>h.kind==='warn'&&h.C!==t.his[0].C))||[...sizes].some(s=>s*2!==Math.round(s*2))||lowC.length){bad++;why.push(st.id+'/'+lk+'/'+hs+' '+m.warns.join()+' '+lowC.slice(0,2).join());}
   if((st.id==='navy'||st.id==='investor')&&hs==='box')await save(`table-r1-${st.id}-${lk}.pptx`,st,{model:m});}
  ok(!bad,`表格 R1：${n} 種組合（9 風格 × 4 外觀 × 3 重點樣式）都正確：重點同一強調色、警告另用紅、門檻規則已移除（舊 rules 被忽略）、字級為 0.5pt 倍數、文字對比 ≥ 4.5:1`+(bad?'｜'+why.slice(0,3).join('；'):''));
  const tm=D.tableMarks({his:[{type:'col',i:99},{type:'x'},{type:'cell',r:'1',c:1,color:'<b>'}],rules:[{c:1,op:'DROP',v:'abc',tone:'x',style:'y'}]},3,3);
  ok(tm.his.length===1&&tm.his[0].color==='auto'&&!tm.rules.length,'tableMarks 擋掉非法強調／規則');
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
   const m=D.buildModel(nav,{table:{rows:R}});ok(m.slides[0].items.find(i=>i.t==='tbl').cells[2][1].runs[0].t==='91%','預覽／匯出：91% 保留原始小數位');
   const ft=m.slides[0].items.find(i=>i.t==='tbl').cells[1][1].font;ok(!/Georgia|Times/.test(D.buildModel(D.PRESETS.find(p=>p.nFont==='Georgia')||nav,{table:{rows:R}}).slides[0].items.find(i=>i.t==='tbl').cells[1][1].font),'數字一律無襯線（Georgia 風格的表格數字改 Arial）');}
  // 門檻建議
  {const s1=D.tableSuggest([['Lot','片數','Yield%','Defect'],['A','25','95.2%','12'],['B','25','88.1%','31'],['C','24','91.0%','18']]);ok(s1.rule.c===2&&s1.rule.v===90&&s1.rule.op==='<'&&s1.rule.style==='text','門檻預設：挑 Yield% 欄、門檻 90（不是第一個數字欄、不是平均）');
   const s2=D.tableSuggest([['Tool','WPH','MTBF (h)'],['A','118','430'],['B','131','610'],['C','125','520']]);ok(Number.isInteger(s2.rule.v)&&s2.rule.v>0,'門檻預設：非 % 欄＝中位數取整 '+s2.rule.v);
   const s3=D.tableSuggest([['','3Q25','2Q25','QoQ'],['營收','989.9','933.8','+6.0%'],['毛利率','59.5%','58.6%','+0.9 ppts']]);ok(s3.period===1&&(s3.rule.c!==3||s3.rule.v===0),'財報表：最新期別欄＝3Q25；變化欄門檻＝0');}
  // 貼上重設
  {const prev={rows:[['a','b'],['1','2']],title:'舊標題',unit:'單位：新台幣十億元（EPS 除外）',note:'舊註',his:[{type:'col',i:1}],rules:[{c:1,op:'<',v:1}],pin:false};
   const n1=D.tableFromPaste([['項目','狀態'],['A','完成']],Object.assign({},prev,{keep:false}));ok(n1.title===''&&n1.unit===''&&n1.note===''&&!n1.his.length&&!n1.rules.length,'關閉沿用目前樣式：標題／單位／註腳／重點／門檻全部重設');
   const n2=D.tableFromPaste([['項目','狀態'],['A','完成']],Object.assign({},prev,{pin:true,keep:false}));ok(n2.title===''&&n2.unit==='','新資料：不因舊版釘住狀態保留不相關標題');
   const n0=D.tableFromPaste([['項目','狀態'],['A','完成']],prev);ok(n0.title===''&&n0.unit===''&&n0.note===''&&n0.keep===true,'沿用目前樣式預設開：不沿用新資料的標題／單位／註腳');
   const nu=D.tableFromPaste([['項目','狀態'],['A','完成']],prev,'update');ok(nu.title===prev.title&&nu.unit===prev.unit&&nu.note===prev.note,'明確更新資料：保留標題／單位／註腳');
   const pa=[['2026 Q3 各廠良率','',''],['單位：%','',''],['廠區','7月','8月'],['F12','95.2','96.1'],['合計','93.1','94.2']];const n4=D.tableFromPaste(pa.map(r=>r.slice()),{});ok(JSON.stringify(n4.rows)===JSON.stringify(pa)&&n4.lastTotal===true&&JSON.stringify(n4.bold)==='[4]','貼上照原樣：不抽標題／單位列；合計自動偵測→lastTotal 勾起');
   ok(D.tableAuto([['a','b'],['x','1'],['合計','2']],{lastTotal:false}).key.length===0,'取消勾「最後一列是合計」：不再自動加粗');
   const n3=D.tableFromPaste([['','3Q25','2Q25'],['營收','989.9','933.8'],['淨利','452.3','398.3']],Object.assign({},prev,{keep:false}));ok(n3.his.length===1&&n3.his[0].i===1&&JSON.stringify(n3.bold)==='[2]','財報表貼上：自動把最新期別欄設為重點、合計列加粗');}
  // 版面
  {const R5=[['a','b','c','d','e'],['1','2','3','4','5']];const m=D.buildModel(Object.assign({},nav,{tbWidth:'fill'}),{table:{title:'T',unit:'U',rows:R5}}).slides[0].table;const m2=D.buildModel(Object.assign({},nav,{tbH:'left'}),{table:{rows:[['a','b'],['1','2']]}}).slides[0].table;
   ok(m.tW>11.3&&m.tW<=12.14&&m.tx>=.6&&m.tx<1&&m2.tW<9&&Math.abs(m2.tx-.6)<.001,`版面：填滿＝12.13" 靠左 x0.6；自動＝依內容寬、小表靠左對齊標題（${m.tW.toFixed(2)}／${m2.tW.toFixed(2)}）`);
   const cw=D.buildModel(nav,{table:{rows:[['a','b','c'],['1','2','3']],cw:[3,2,1]}}).slides[0].table;ok(Math.abs(cw.colW[0]/cw.colW[2]-3)<.01&&Math.abs(cw.colW[1]/cw.colW[2]-2)<.01,'拖曳欄寬：T.cw 生效');}
  // 舊資料相容
  {ok(D.buildModel(nav,{table:{rows:Y.rows,hi:{type:'col',i:1}}}).slides[0].table.his.length===1,'舊版 T.hi 仍可用');
   const old=D.sanitizeParams(Object.assign({},nav,{tbLook:'panel'}),nav);const old2=D.sanitizeParams(Object.assign({},nav,{tbLook:'minimal'}),nav);const old3=D.sanitizeParams({P:nav.P,tbPanel:true},nav);
   ok(old.tbLook==='card'&&old.tbCard==='white'&&old2.tbLook==='clean'&&old3.tbLook==='card','舊外觀（灰底面板／極簡／tbPanel）自動轉成新外觀');
   const tr=D.trayModel([{kind:'table',params:Object.assign({},nav,{tbLook:'panel',tbHiColor:'alert',tbHiMode:'box'}),table:Y,name:'良率（舊快照）'},{kind:'table',params:Object.assign({},nav,{tbLook:'minimal'}),table:{rows:[['a','b'],['1','2']]},name:'極簡'},{kind:'el',params:wine,key:'annot',gi:3,name:'標註'}]);await save('tray-marks.pptx',nav,{model:tr});ok(tr.tray.n===3,'待選素材：舊表格快照（灰底面板／極簡）仍可重建＋標註');}
  // 四個驗收案例（LibreOffice 也會畫）
  // R9：第一欄表頭、儲存格邊界、預設微軟正黑體、重點不再限 3 個
  {const C=require('./table-cases.js');const base=Object.assign({},C.pl||C.plT);
   const hc=D.buildModel(nav,{table:Object.assign({},base,{hcol:true})});const it=hc.slides[0].items.find(i=>i.t==='tbl');
   ok(it.cells.slice(1).every(r=>r[0].bold&&r[0].fill)&&hc.slides[0].table.hcol&&!hc.slides[0].table.orphans.length,'第一欄為表頭：首欄粗體＋淡底');
   const pn=D.buildModel(Object.assign({},nav,{tbPad:'none'}),{table:base}),pl=D.buildModel(Object.assign({},nav,{tbPad:'l'}),{table:base});const c0=pn.slides[0].items.find(i=>i.t==='tbl').cells[1][1],c1=pl.slides[0].items.find(i=>i.t==='tbl').cells[1][1];
   ok(c0.mL===0&&c0.mR===0&&c1.mL>8,'儲存格邊界：無＝0、大＞中（'+c1.mL+'pt）');
   ok(D.BASE.tbFont==='jh'&&it.cells[1][0].runs[0].o.font==='Microsoft JhengHei','預設表格字型＝微軟正黑體');
   ok(D.sanitizeParams(Object.assign({},nav,{tbPad:'l'}),nav).tbPad==='l','tbPad 參數保留');
   {const mn=D.buildModel(Object.assign({},nav,{tbFont:'noto'}),{table:base});ok(mn.slides[0].items.find(i=>i.t==='tbl').cells[1][0].runs[0].o.font==='Microsoft JhengHei','舊設定 Noto Sans TC → 改用微軟正黑體');}
   const many=D.buildModel(nav,{table:Object.assign({},base,{his:[1,2,3,4,5].map(i=>({type:'row',i,kind:'focus'}))})});ok(many.slides[0].table.his.length===5,'重點可超過 3 個（'+many.slides[0].table.his.length+'）');
   const r=await D.exportPptx(env,nav,{type:'nodebuffer',model:hc});fs.writeFileSync(path.join(OUT,'tbl-hcol.pptx'),r.data);files.push(path.join(OUT,'tbl-hcol.pptx'));}
  // R9b：小表自動放大（3×3）：內文 ≥20pt、寬 ≥55% 內容寬、無孤字、不出界；關閉 tbAuto 時維持原尺寸
  {const T3={rows:[['','A','B','C'],['X','1','2','887'],['Y','3','7','66'],['Z','5','6','3']]};let bad=[];
   for(const [lk] of D.TABLE_LOOKS)for(const sz of ['S','M','L']){const m=D.buildModel(Object.assign({},nav,{tbLook:lk,size:sz}),{table:T3});const t=m.slides[0].table;if(t.fs<20||t.fs>24||t.tW<.55*(D.W-1.2)||t.orphans.length||t.ty+t.tH>D.H-.45||m.warns.length)bad.push(lk+sz+':'+t.fs+'/'+t.tW.toFixed(1));}
   ok(!bad.length,'小表自動放大：3×3 各外觀×S/M/L 內文 20–24pt、寬≥55%'+(bad.length?'｜'+bad.join(' '):''));
   const off=D.buildModel(Object.assign({},nav,{tbAuto:false}),{table:T3}).slides[0].table;ok(off.fs<16&&!off.boost,'列少自動放大 關閉：不放大（'+off.fs+'pt）');}
  // R10：換外觀不改幾何（表格框、字級、列高、欄寬、標題／註腳位置），固定密度與尺寸
  {const C=require('./table-cases.js');const bad=[];for(const s of Object.keys(C).filter(k=>C[k]&&C[k].rows))for(const dn of ['comfy','normal','dense'])for(const sz of ['S','M','L']){
    const g=D.TABLE_LOOKS.map(([lk])=>{const t=D.buildModel(Object.assign({},nav,{tbLook:lk,tbDense:dn,size:sz}),{table:C[s]}).slides[0].table;return JSON.stringify([t.tx,t.ty,t.tW,t.tH,t.fs,t.hfs,t.rowH,t.colW,t.slots.title.x,t.slots.title.y,t.slots.note&&t.slots.note.y],(k,x)=>typeof x==='number'?+x.toFixed(2):x);});
    if(new Set(g).size>1)bad.push(s+'/'+dn+'/'+sz);}
   ok(!bad.length,'換外觀：4 種外觀的表格框／字級／列高／欄寬／標題位置完全相同（0.01"）'+(bad.length?'｜'+bad.slice(0,4).join(' '):''));
   // pptx：graphicFrame 位置與大小相同
   const JSZip=require('jszip');const xs=[];for(const [lk] of D.TABLE_LOOKS){const pp=Object.assign({},nav,{tbLook:lk,tbDense:'normal'});const r=await D.exportPptx(env,pp,{type:'nodebuffer',model:D.buildModel(pp,{table:C.pl})});const z=await JSZip.loadAsync(r.data);const x=await z.file('ppt/slides/slide1.xml').async('string');const m=x.match(/<p:graphicFrame>[\s\S]*?<a:off x="(\d+)" y="(\d+)"\/><a:ext cx="(\d+)" cy="(\d+)"/);xs.push(m?m.slice(1).join(','):'none');}
   ok(new Set(xs).size===1&&xs[0]!=='none','換外觀：pptx 表格位置／大小相同（'+xs[0]+'）');
   const fx=D.buildModel(Object.assign({},nav,{tbNeg:true,tbThou:false,tbMinus:'paren',tbStatus:false}),{table:C.pl}),f0=D.buildModel(nav,{table:C.pl});ok(JSON.stringify(fx.slides[0].items.find(i=>i.t==='tbl').cells)===JSON.stringify(f0.slides[0].items.find(i=>i.t==='tbl').cells),'舊設定的格式選項被忽略（④格式已移除）');}
  // R8：壓力範例 12/16/20 列（長中文表頭與內文、% 與負數、多行註腳）× 4 外觀 × 3 密度 × S/M/L × 9 風格
  {const C=require('./table-cases.js');let bad=[];for(const st of D.PRESETS)for(const k of ['s12','s16','s20'])for(const lk of ['clean','band','card','zebra'])for(const dn of ['comfy','normal','dense'])for(const size of ['S','M','L']){const m=D.buildModel(Object.assign({},st,{tbLook:lk,tbDense:dn,size}),{table:C[k]});const tb=m.slides[0].table;const bot=Math.max(...m.slides[0].items.map(i=>i.y+i.h));
    if(tb.orphans.length||tb.fs<10||bot>(m.slides[0].h||D.H)-.15||tb.tx+tb.tW>(m.slides[0].w||D.W)-.4||m.warns.some(w=>/放不下|太寬/.test(w)))bad.push(st.id+k+lk+dn+size);}
   ok(!bad.length,`壓力範例：無孤字、無溢出、內文 ≥10pt（${bad.length} 失敗）${bad.slice(0,3).join(' ')}`);
   // 編輯提示（placeholder／📌）不會進 pptx 或複製的 HTML
   const em=D.buildModel(nav,{table:Object.assign({},C.yield,{title:'',unit:'',note:''})});const html=D.tableHtml(em);
   const r=await D.exportPptx(env,nav,{type:'nodebuffer',model:em});const z=await JSZip.loadAsync(r.data);let xml='';for(const f of Object.keys(z.files).filter(f=>/^ppt\/slides\/slide\d+\.xml$/.test(f)))xml+=await z.file(f).async('string');
   const PH=/點這裡輸入|單位／副標|註腳／資料來源|📌|data-ph|套用建議/;ok(!PH.test(xml)&&!PH.test(html),'空白標題／單位／註腳的提示文字與 📌 不會匯出到 pptx 或 HTML');}
  // R7：孤字／語意斷行／有空間就加寬
  {const C=require('./table-cases.js');let bad=[];for(const st of D.PRESETS)for(const k of Object.keys(C))for(const lk of ['clean','band','card','zebra'])for(const dn of ['comfy','normal','dense'])for(const size of ['S','M','L']){const tb=D.buildModel(Object.assign({},st,{tbLook:lk,tbDense:dn,size}),{table:C[k]}).slides[0].table;if(tb.orphans.length)bad.push(st.id+k+lk+dn+size+JSON.stringify(tb.orphans[0]));}
   ok(!bad.length,`所有範例×外觀×密度×尺寸×9 風格：無孤字、無自動折行（${bad.length}）${bad.slice(0,2).join(' ')}`);
   const cmpHdr=m=>m.slides[0].items.find(i=>i.t==='tbl').cells[0].map(c=>c.runs.map(x=>(x.o&&x.o.br?'\n':'')+x.t).join(''));
   const free=D.buildModel(nav,{table:C.cmp});ok(free.slides[0].table.orphans.length===0&&!cmpHdr(free).some(t=>/\n/.test(t)),'方案比較：有空間時表頭一行（方案 A：自建 不折行）');
   const tight=D.buildModel(Object.assign({},nav,{tbWidth:'compact'}),{table:Object.assign({},C.cmp,{cw:[1.2,.5,.5,.5]})}).slides[0].table;ok(tight.orphans.length===0&&tight.colW[1]>=tight.colMin[1]-1e-6,'窄欄：最小欄寬＝語意兩行寬，不留孤字');
   const H=D.buildModel(Object.assign({},nav,{tbWidth:'compact'}),{table:Object.assign({},C.cmp,{cw:[1.2,.5,.5,.5]})});const hc=H.slides[0].items.find(i=>i.t==='tbl').cells[0][1].runs.map(x=>x.t);ok(hc.length>=2&&/：$/.test(hc[0].trim()),'語意斷行：在「：」後斷（'+hc.join(' / ')+'）');
   {const t9=D.tableTitleSuggest({rows:[['機台','WK41 良率'],['EQ-01','95.1%'],['EQ-02','86.9%'],['EQ-03','93.0%']],rules:[{c:1,op:'<',v:90}]});ok(/86\.9%/.test(t9)&&!/門檻/.test(t9),'舊快照含門檻規則：標題改用極值、不再提門檻（'+t9+'）');}
   const sm=D.buildModel(nav,{table:{rows:[['項目','值'],['A','1'],['B','2']]}}).slides[0].table;ok(sm.fs>=16,'小表自動放大到可讀字級（'+sm.fs+'pt）');}
  // R6：建議標題去單位、縮短列名、≤ 約 24 字
  {const C=require('./table-cases.js');const s=D.tableTitleSuggest(Object.assign({},C.stress,{rules:[],his:[]}));const VL=x=>[...x].reduce((n,ch)=>n+(/[\u0000-\u024f]/.test(ch)?.55:1),0);
   ok(!/[（(]%[）)]/.test(s)&&/CVD-00 A/.test(s)&&VL(s)<=24,'建議標題：去掉（%）、列名縮成代碼、≤24 字（'+s+'）');
   ok(['yield','pl','status','dense'].every(k=>VL(D.tableTitleSuggest(Object.assign({},C[k],{rules:[],his:[]})))<=30),'建議標題長度合理（4 種表）');}
  // R5：通用建議標題、標題不懸出、38% 錨點、警告優先
  {const C=require('./table-cases.js');const nv=D.PRESETS[0];const tb=(p,T)=>D.buildModel(Object.assign({},nv,p),{table:T}).slides[0];
   const sg=['yield','pl','status','dense','stress'].map(k=>D.tableTitleSuggest(Object.assign({},C[k],{rules:[],his:[]})));ok(sg.every(Boolean)&&/最低/.test(sg[4]),'每種表都有建議標題（'+sg[4]+'）');
   ok(D.tableTitleSuggest({rows:[['機台','WK41 Yield'],['EQ-01','95.1%'],['EQ-02','86.9%']]})==='WK41 Yield 最低：EQ-02 86.9%','通用：Yield 最低：EQ-02 86.9%');
   const dk=D.trayDeck([{kind:'table',table:Object.assign({},C.stress,{title:''}),params:nv}]);ok(!!dk.slides[0].items.find(i=>i.name==='表格標題'),'待選：沒有期別/狀態欄的表也拿到建議標題');
   const LT='3Q25 稅後淨利 452.3，QoQ +13.6%、YoY +39.0%，營收與毛利率同步創新高';const s=tb({},Object.assign({},C.pl,{title:LT}));const ti=s.items.find(i=>i.name==='表格標題');ok(ti.x+ti.w<=D.W-.59&&ti.x>=s.table.tx-.01&&ti.y+ti.h<s.table.ty,'長標題使用已量測的說明區，不出投影片或重疊表格');
   const y=tb({},Object.assign({},C.yield,{title:''})).table,top=y.slots.title.y-.5,bot=7.5-.45-(y.slots.note?y.slots.note.y+y.slots.note.h:y.ty+y.tH);ok(top>0&&top/(top+bot)>.3&&top/(top+bot)<.46,'置中＝上方留白約 38%（'+(top/(top+bot)).toFixed(2)+'）');
   const w=tb({},Object.assign({},C.pl,{hiStyle:'fill',his:[{type:'col',i:1,kind:'rec'},{type:'col',i:2},{type:'row',i:3,kind:'warn'}]})).items.find(i=>i.t==='tbl').cells[3];ok(new Set(w.map(c=>c.fill)).size===1,'警告列跨重點/推薦欄：只用警告色、不疊色');}
  // R4：最小欄寬、水平置中、不必要的換行、圖例只列用到的、建議標題、底線、舒適密度
  {const C=require('./table-cases.js');const nv=D.PRESETS[0];const tb=(p,T)=>D.buildModel(Object.assign({},nv,p),{table:T}).slides[0];
   const t1=tb({},Object.assign({},C.yield,{cw:[1,.25,1,1,1]})).table;ok(t1.colW[1]>=t1.colMin[1]-.002&&t1.colMin[1]>.5,'拖曳欄寬：不小於最長字（'+t1.colMin[1].toFixed(2)+'"）');
   const c1=tb({},C.yield).table,l1=tb({tbH:'left'},C.yield).table;ok(Math.abs(c1.tx+c1.tW/2-13.333/2)<.6&&Math.abs(l1.tx-.6)<1e-6,'左右：預設置中、置左＝0.6"');
   const s1=tb({},C.status);const cells=s1.items.find(i=>i.t==='tbl');const t2=s1.table;ok(t2.colW[4]>=t2.colMin[4]&&!t2.rowH.slice(1).some(h=>h>t2.rowH[1]*1.3),'有空間不換行（已完成 60% 一行）');
   const g1=tb({},Object.assign({},C.pl,{his:[{type:'col',i:1,kind:'rec'},{type:'col',i:2}],legend:{rec:'建議方案',focus:'本季'}})).items.find(i=>i.name==='圖例');ok(!g1,'表格圖例：保留舊標籤資料但不產生右下角圖例');
   const dk=D.trayDeck([{kind:'table',table:Object.assign({},C.status,{title:''}),params:nv}]);const dk2=D.trayDeck([{kind:'table',table:Object.assign({},C.status,{title:''}),params:nv}],{sugTitle:false});
   ok(!!dk.slides[0].items.find(i=>i.name==='表格標題')&&!dk2.slides[0].items.find(i=>i.name==='表格標題'),'待選匯出：沒標題時用建議標題（可關）');
   const bd=tb({tbLook:'band'},Object.assign({},C.pl,{his:[{type:'col',i:1}]}));const hc=bd.items.find(i=>i.t==='tbl').cells[0][1];ok(hc.bB&&hc.bB.w===3&&hc.fill===bd.items.find(i=>i.t==='tbl').cells[0][3].fill,'主色表頭重點：3pt 強調色底線、不換填色');
   const rc=tb({tbDense:'comfy'},C.status).table,rn=tb({tbDense:'normal'},C.status).table;const ratio=rc.rowH[1]/rn.rowH[1];ok(ratio>=1.3&&ratio<=1.55,'舒適列高 ≈ 1.4× 標準（'+ratio.toFixed(2)+'）');}
  // R3：待選每項一頁、區塊間距、推薦色、檔名、套用上次樣式、標題平衡
  {const C=require('./table-cases.js');const nv=D.PRESETS[0];
   const es=['yield','pl','status','stress'].map(k=>({kind:'table',table:C[k],params:nv}));es.push({kind:'el',key:'patterns',gi:0,params:nv});
   const dk=D.trayDeck(es),expectedPages=es.slice(0,4).reduce((n,e)=>n+D.buildModel(nv,{table:e.table}).slides.length,1);ok(dk.slides.length===expectedPages&&dk.tray.pages===expectedPages&&dk.slides.filter(s=>s.table).every(s=>s.table.exportComplete),'待選：表格展開全部分頁，其他元件各一頁（'+expectedPages+' 頁）');
   await save('tray-deck.pptx',nv,{model:dk});
   let gb=[];for(const v of ['top','center'])for(const c of ['yield','pl','status']){const t=D.buildModel(Object.assign({},nv,{tbV:v}),{table:C[c]}).slides[0].table;const u=t.slots.unit,gap=t.ty-(u.y+u.h)-(t.look==='card'?.25:0);const s=t.slots.title;
     if(Math.abs(t.ty-(s.y+s.h+.3+.35*0+(C[c].unit?0:0)))>.6||gap<.2||gap>.5)gb.push(v+c+' gap'+gap.toFixed(2));if(v==='center'&&Math.abs((s.y-.5)-(7.5-.45-(t.ty+t.tH)-(t.slots.note?0:0)))>1.2)gb.push(v+c+' off');}
   ok(!gb.length,'標題／單位／表格＝同一區塊（間距 0.2–0.5"），置中時整組移動'+(gb.length?'｜'+gb.join('；'):''));
   let rb=[];for(const st of D.PRESETS){const t=D.buildModel(st,{table:Object.assign({},C.pl,{his:[{type:'col',i:1,kind:'rec'},{type:'col',i:2,kind:'focus'},{type:'row',i:3,kind:'warn'}]})}).slides[0].table;const [r,f,w]=t.his.map(h=>h.C);if(r===f||r===w||D.contrastOf(r,'FFFFFF')<3)rb.push(st.id);}
   ok(!rb.length,'推薦色：9 風格都跟重點／警告不同色、白底對比 ≥ 3:1'+(rb.length?'｜'+rb.join():''));
   const lg=D.buildModel(nv,{table:Object.assign({},C.pl,{his:[{type:'col',i:1,kind:'rec'},{type:'col',i:2}]})}).slides[0].items.find(i=>i.name==='圖例');ok(!lg,'兩種以上語意標示仍保留儲存格樣式，但不產生圖例');
   const fn=D.shortName('3Q25 稅後淨利 452.3，QoQ +13.6%、YoY +39.0%');ok([...fn].length<=20&&!/[，、%+\s]/.test(fn),'檔名：去標點、≤ 20 字（'+fn+'）');
   const prev=Object.assign({},C.yield,{keep:true,rules:[{c:2,op:'<',v:90,tone:'warn',style:'text'}],his:[{type:'col',i:2,kind:'rec'}],unit:'U',note:'N'});
   const nx=D.tableFromPaste([['Lot','Yield%','Station'],['B1','80%','CMP']],prev);ok(nx.his[0].i===1&&nx.unit==='','沿用目前樣式：依欄名帶入重點，不帶入新資料的舊單位');
   ok(!D.tableFromPaste([['Lot','Yield%'],['B1','80%']],Object.assign({},prev,{keep:false})).rules.length,'關閉沿用目前樣式：照常重設');
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
    if(bot>(m.slides[0].h||D.H)-.2||right>(m.slides[0].w||D.W)-.3||t.fs<10||m.warns.some(w=>/放不下|太寬/.test(w)))sb.push(`${lk}/${dn}/${size} fs${t.fs} bot${bot.toFixed(2)}`);}
   ok(!sb.length,'表格壓力測試 36 組：不溢出、內文 ≥ 10pt'+(sb.length?'｜'+sb.slice(0,4).join('；'):''));}
  {const C=require('./table-cases.js');for(const [k,T] of Object.entries(C))for(const lk of ['clean','band','card','zebra']){const m=D.buildModel(Object.assign({},nav,{tbLook:lk}),{table:T});await save(`table-case-${k}-${lk}.pptx`,nav,{model:m});}}
 }
 {const am=D.buildModel(nav,{only:['annot','catalog']});const an=am.slides.find(x=>x.key==='annot'),ca=am.slides.find(x=>x.key==='catalog');const names=an.groups.map(g=>g.name);
  ok(['強調框（實線）','圈選','編號釘 ①②③','對話框','箭頭＋標籤','旗標＋日期'].every(k=>names.includes(k))&&an.groups.length<=7&&ca.groups.filter(g=>/^標註・/.test(g.full||'')).length===7,`標註頁 ${an.groups.length} 組、元件總表標註列 7 格`);
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
