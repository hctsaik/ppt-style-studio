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
 console.log('嚴格 OOXML 驗證（office validate）＋ check_pptx.py…');
 for(const f of files){let v=0;try{cp.execFileSync('office',['validate',f],{stdio:'pipe'});}catch(e){v=1;}ok(!v,'office validate '+path.basename(f));}
 try{const r=cp.execFileSync('python3',[path.join(__dirname,'check_pptx.py'),...files],{encoding:'utf8'});ok(true,'check_pptx.py：全部 clean');}catch(e){console.log(e.stdout);ok(false,'check_pptx.py 有問題');}
 console.log('其他檢查…');
 ok(D.stripCtl('a\u0000b\u000Bc\u001Fd\n\te')==='abcd\n\te','stripCtl 去掉 XML 不允許的控制字元、保留換行／Tab');
 const bad=D.sanitizeParams({P:'1F4E79"/><img src=x onerror=alert(1)>',cnW:'NaN',tFont:'<b>',zh:'我的<script>'},nav);ok(bad.P===nav.P&&bad.cnW===nav.cnW&&bad.tFont===nav.tFont&&!/[<>]/.test(bad.zh),'sanitizeParams 擋掉注入／非法值');
 try{cp.execFileSync('python3',[path.join(__dirname,'stamp_version.py'),'--check'],{stdio:'pipe'});ok(true,'studio.html 版本戳記是最新');}catch(e){ok(false,'studio.html 版本戳記過期（python3 tools/stamp_version.py）');}
 console.log(fail?`\n✗ ${fail} 項失敗`:'\n✓ 全部通過');process.exit(fail?1:0);})().catch(e=>{console.error(e);process.exit(1);});
