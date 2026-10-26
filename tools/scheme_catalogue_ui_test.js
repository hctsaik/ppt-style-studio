'use strict';
// Source/isolated-handler checks only: no browser, DOM emulator, server or network.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),D=require('../deck');
const Flow=require('../export-flow'),Preflight=require('../preflight');
const source=fs.readFileSync(require('node:path').join(__dirname,'..',process.env.STUDIO_HTML||'studio.html'),'utf8');
let passed=0;const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
const nodes=new Map(),node=key=>{if(!nodes.has(key)){const classes=new Set();nodes.set(key,{hidden:false,disabled:false,dataset:{},textContent:'',innerHTML:'',scrollTop:0,scrollLeft:0,classList:{toggle(k,on){if(on)classes.add(k);else classes.delete(k);},contains:k=>classes.has(k)}});}return nodes.get(key);};
const stage=node('.stage');node('#big').closest=()=>stage;
const model=D.buildModel(D.PRESETS[0]),S={slide:model.slides.findIndex(s=>s.key==='schemebody'),mine:null,base:'navy',p:{...D.PRESETS[0]},labels:{},examples:true};
const saved=[],messages=[],context={D,S,model,$:node,SEL:null,navSync(){},featShow(){},syncPageInfoHeight(){},gocards:()=>'',usedLinks:()=>'',isModified:()=>false,presetOf:()=>D.PRESETS[0],escH:String,MQ:{matches:false},setPanel(){},document:{querySelector:()=>stage},clone:x=>JSON.parse(JSON.stringify(x)),ENV:()=>({}),saveBlob:(data,name)=>saved.push({data,name}),toast:m=>messages.push(m),window:{__studio:{}},console:{error(){}}};
vm.createContext(context);
const show=source.match(/function showSlide\(\)\{[\s\S]*?\n\}/);assert(show);vm.runInContext(show[0],context);
check('Four-category page activates only the catalog-scoped layout and disclosure',()=>{vm.runInContext('showSlide()',context);assert(stage.classList.contains('scheme-catalogue'));assert.equal(node('#schemeCatalogueHelp').hidden,false);assert(node('#sTitle').innerHTML.includes(D.PRESETS[0].zh));assert(!source.includes('不隨全站風格改變'));assert(source.includes('配色跟隨全站主題'));assert(node('#big').innerHTML.includes('viewBox="0 0 959.976 1260"'));});
check('Changing the global theme updates the current catalogue preview and theme caption',()=>{
 const wine=D.PRESETS.find(p=>p.id==='wine');context.model=D.buildModel(wine);S.base=wine.id;S.p={...wine};context.presetOf=id=>D.PRESETS.find(p=>p.id===id);vm.runInContext('showSlide()',context);
 assert(node('#sTitle').innerHTML.includes(wine.zh));assert(node('#big').innerHTML.includes('fill="#'+wine.P+'"'));assert(!node('#big').innerHTML.includes('#23547A'));
 context.model=model;S.base='navy';S.p={...D.PRESETS[0]};vm.runInContext('showSlide()',context);
});
check('A redraw on the same catalog page retains scrolling',()=>{stage.scrollTop=800;stage.scrollLeft=123;vm.runInContext('showSlide()',context);assert.equal(stage.scrollTop,800);assert.equal(stage.scrollLeft,123);});
check('Navigating to a standard page restores normal layout and hides catalog controls',()=>{S.slide=model.slides.findIndex(s=>s.key==='iconcomponents');vm.runInContext('showSlide()',context);assert(!stage.classList.contains('scheme-catalogue'));assert.equal(node('#schemeCatalogueHelp').hidden,true);assert.equal(stage.scrollTop,0);assert.equal(stage.scrollLeft,0);assert(!node('#sTitle').innerHTML.includes('原稿固定樣式'));});
check('Long-sheet CSS is scoped and preserves readable scrollable original aspect ratio',()=>{assert(source.includes('.stage.scheme-catalogue .slide{aspect-ratio:13.333/17.5'));assert(source.includes('min-width:720px;max-width:none;height:auto;max-height:none'));assert(source.includes('.stage.scheme-catalogue{display:block;overflow:auto;'));assert(!/\.t\w*[^\n]*scheme-catalogue/.test(source.split('</style>')[0]));});
check('Standard and four-sheet exports are visibly distinguished',()=>{assert(/id="bAll"[^>]*>下載標準投影片/.test(source));assert(/id="bSchemeCatalogue">下載四頁方案元件/.test(source));assert(source.includes("$('#bAll').textContent=m?'⬇ 標準投影片':'下載標準投影片'"));});
check('Search/favorite selection reveals catalog rows without scrolling standard pages',()=>{
 const selected={classList:{add(){}},scrollIntoView(opt){assert.equal(opt.block,'nearest');assert.equal(opt.inline,'nearest');this.calls=(this.calls||0)+1;}};
 context.document.querySelector=()=>selected;context.closeLabelEditor=()=>{};context.clearSel=()=>{};context.featSel=()=>{};
 node('#ebar').classList.add=()=>{};node('#ebar').style={};node('#ebar').offsetWidth=400;node('#ebar').offsetHeight=30;node('#big').clientWidth=960;node('#big').clientHeight=1260;
 const select=source.match(/function selectEl\(gi\)\{[\s\S]*?\nfunction svgToPng/);assert(select);vm.runInContext(select[0].replace(/\nfunction svgToPng$/,''),context);
 S.p.minFont=0;S.slide=model.slides.findIndex(s=>s.key==='schemeiconbody');vm.runInContext('selectEl(27)',context);assert.equal(selected.calls,1);
 S.slide=model.slides.findIndex(s=>s.key==='iconcomponents');vm.runInContext('selectEl(0)',context);assert.equal(selected.calls,1);
});
const handler=source.split('\n').find(l=>l.startsWith("$('#bSchemeCatalogue').onclick="));assert(handler);
(async()=>{
 let calls=0,resolve,reject,job;context.D={...D,exportPptx:(env,params,opt)=>{calls++;job={params,opt};return new Promise((a,b)=>{resolve=a;reject=b;});}};
 const checked=[],reports=[];let invalid=false;
 // The production handler now uses the shared lifecycle. Keep its real
 // snapshot, preflight, cancellation and stale-result policies in this test.
 const flow=Flow.create({revision:()=>JSON.stringify([S.p,S.labels]),
  build:(params,opt)=>{const m=D.buildModel(params,opt);if(invalid)m.slides[0].w=0;return m;},
  check:m=>{checked.push(m);return Preflight.check(m,{deck:D});},
  export:(params,opt)=>context.D.exportPptx({},params,opt),report:(report,state)=>reports.push({report,state})});
 context.checkedExport=(_env,params,opt)=>flow.run(params,opt);
 vm.runInContext(handler,context);const b=node('#bSchemeCatalogue');S.p.P='23547A';S.labels={'schemebody:0':{2:{from:'方案 A',to:'新方案'}}};
 const pending=b.onclick();assert(b.disabled);S.p.P='FF0000';S.labels['schemebody:0'][2].to='稍後編輯';await b.onclick();
 check('Repeated click cannot duplicate pending export; check and export share the copied snapshot',()=>{assert.equal(calls,1);assert.deepEqual(Array.from(job.opt.only),D.SCHEME_CATALOGUE_KEYS);assert.equal(job.params.P,'23547A');assert.equal(job.opt.labels['schemebody:0'][2].to,'新方案');assert.strictEqual(job.opt.model,checked[0]);});
 resolve({data:{size:123},model:job.opt.model});await pending;
 check('Style or label changes during export discard old bytes and restore the button',()=>{assert.equal(b.disabled,false);assert.equal(saved.length,0);assert.equal(flow.busy(),false);assert.equal(reports.at(-1).state,'stale');assert(messages.some(m=>m.includes('內容或樣式已變更')));});
 const retry=b.onclick();
 check('Retry checks the current palette and labels again',()=>{assert.equal(calls,2);assert.equal(checked.length,2);assert.equal(job.params.P,'FF0000');assert.equal(job.opt.labels['schemebody:0'][2].to,'稍後編輯');assert.strictEqual(job.opt.model,checked[1]);});
 resolve({data:{size:123},model:job.opt.model});await retry;
 check('Successful native four-page download restores the button and records all112groups',()=>{assert.equal(b.disabled,false);assert.equal(saved[0].name,'方案元件-四頁分類.pptx');assert.equal(context.window.__studio.lastSchemeExport.slides,4);assert.equal(context.window.__studio.lastSchemeExport.groups,112);});
 const failed=b.onclick();reject(Error('test export failure'));await failed;
 check('Failed export restores button without creating a misleading download',()=>{assert.equal(b.disabled,false);assert.equal(saved.length,1);assert(messages.some(m=>m.includes('test export failure')));});
 const cancelled=b.onclick();assert(flow.cancel());resolve({data:{size:123},model:job.opt.model});await cancelled;
 check('Cancelling the catalogue export suppresses save and releases its button',()=>{assert.equal(b.disabled,false);assert.equal(saved.length,1);assert.equal(flow.busy(),false);assert.equal(reports.at(-1).state,'cancelled');});
 invalid=true;const before=calls;await b.onclick();
 check('Reliable invalid dimensions stop before native export without stranding the button',()=>{assert.equal(calls,before);assert.equal(saved.length,1);assert.equal(b.disabled,false);assert.equal(reports.at(-1).report.status,'blocked');});
 console.log(`${passed} scheme catalogue source/handler checks passed (not browser visual validation).`);
})().catch(e=>{console.error(e);process.exitCode=1;});
