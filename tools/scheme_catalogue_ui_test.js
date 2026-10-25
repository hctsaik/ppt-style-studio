'use strict';
// Source/isolated-handler checks only: no browser, DOM emulator, server or network.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),D=require('../deck');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','studio.html'),'utf8');
let passed=0;const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
const nodes=new Map(),node=key=>{if(!nodes.has(key)){const classes=new Set();nodes.set(key,{hidden:false,disabled:false,dataset:{},textContent:'',innerHTML:'',scrollTop:0,scrollLeft:0,classList:{toggle(k,on){if(on)classes.add(k);else classes.delete(k);},contains:k=>classes.has(k)}});}return nodes.get(key);};
const stage=node('.stage');node('#big').closest=()=>stage;
const model=D.buildModel(D.PRESETS[0]),S={slide:model.slides.findIndex(s=>s.key==='schemebody'),mine:null,base:'navy',p:{...D.PRESETS[0]},labels:{},examples:true};
const saved=[],messages=[],context={D,S,model,$:node,SEL:null,navSync(){},featShow(){},syncPageInfoHeight(){},gocards:()=>'',usedLinks:()=>'',isModified:()=>false,presetOf:()=>D.PRESETS[0],escH:String,MQ:{matches:false},setPanel(){},document:{querySelector:()=>stage},clone:x=>JSON.parse(JSON.stringify(x)),ENV:()=>({}),saveBlob:(data,name)=>saved.push({data,name}),toast:m=>messages.push(m),window:{__studio:{}},console:{error(){}}};
vm.createContext(context);
const show=source.match(/function showSlide\(\)\{[\s\S]*?\n\}/);assert(show);vm.runInContext(show[0],context);
check('Four-category page activates only the catalog-scoped layout and disclosure',()=>{vm.runInContext('showSlide()',context);assert(stage.classList.contains('scheme-catalogue'));assert.equal(node('#schemeCatalogueHelp').hidden,false);assert(node('#sTitle').innerHTML.includes('原稿固定樣式'));assert(node('#big').innerHTML.includes('viewBox="0 0 959.976 1260"'));});
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
 vm.runInContext(handler,context);const b=node('#bSchemeCatalogue');S.p.P='23547A';S.labels={'schemebody:0':{2:{from:'方案 A',to:'新方案'}}};
 const pending=b.onclick();assert(b.disabled);S.p.P='FF0000';S.labels['schemebody:0'][2].to='稍後編輯';await b.onclick();
 check('Repeated click cannot duplicate pending export; parameters and edits are snapshotted',()=>{assert.equal(calls,1);assert.deepEqual(Array.from(job.opt.only),D.SCHEME_CATALOGUE_KEYS);assert.equal(job.params.P,'23547A');assert.equal(job.opt.labels['schemebody:0'][2].to,'新方案');});
 resolve({data:{size:123},model:{slides:D.SCHEME_CATALOGUE_KEYS.map(()=>({groups:Array(28)}))}});await pending;
 check('Successful native four-page download restores the button and records all112groups',()=>{assert.equal(b.disabled,false);assert.equal(saved[0].name,'方案元件-四頁分類.pptx');assert.equal(context.window.__studio.lastSchemeExport.slides,4);assert.equal(context.window.__studio.lastSchemeExport.groups,112);});
 const failed=b.onclick();reject(Error('test export failure'));await failed;
 check('Failed export restores button without creating a misleading download',()=>{assert.equal(b.disabled,false);assert.equal(saved.length,1);assert(messages.some(m=>m.includes('test export failure')));});
 console.log(`${passed} scheme catalogue source/handler checks passed (not browser visual validation).`);
})().catch(e=>{console.error(e);process.exitCode=1;});
