/* Retired table controls: preserve source whitespace and normalize legacy options.
 * DOM/model/OOXML coverage only, not a browser or PowerPoint visual certificate. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');
const D=require('../deck.js'),PptxGenJS=require('pptxgenjs'),JSZip=require('jszip');
const ROOT=path.resolve(__dirname,'..'),clone=x=>JSON.parse(JSON.stringify(x));
const rows=[['項目','原始文字','變化'],['A','甲  Beta','▲ 12%'],['B','A\u00a0\u00a0中文','▼ 3%'],['C','  中文 A  ','△ 5%'],['D','B 中文\n中 C','▽ 2%']];
const fixture=mode=>D.tableSetHeaderMode({rows:clone(rows),title:' 空白測試 ',unit:'',note:'來源  A 中文',lastTotal:false,bold:[],his:[],rules:[],types:{0:'text',1:'text',2:'text'},sizingFont:{bodyPt:13,headerPt:11,scale:1,autoBoost:1}},mode);
const p=(extra={})=>({...D.PRESETS[0],tbSizingVersion:2,tbWidthMode:'45',tbHeightMode:'optimal',tbTight:true,tbArrow:'sem',...extra});
const tb=m=>m.slides[0].items.find(i=>i.t==='tbl'),flat=x=>x.map(row=>row.map(t=>t.replace(/\n/g,'')));
let count=0;const test=async(name,fn)=>{await fn();count++;console.log('PASS '+name);};
async function modelTests(){
 await test('sanitizer locks retired values for imports, missing values and legacy fallback',()=>{
  const fallback={...D.PRESETS[0],tbTight:true,tbArrow:'ink'};
  for(const input of [null,{},[],{tbTight:true,tbArrow:'sem'},{tbTight:'true',tbArrow:'ink'},{tbTight:false,tbArrow:'mono'}]){const before=JSON.stringify(input),clean=D.sanitizeParams(input,fallback,{tbArrow:['sem','ink'],tbTight:[true]});assert.equal(clean.tbTight,false);assert.equal(clean.tbArrow,'mono');assert.equal(JSON.stringify(input),before);assert.equal(clean.P,fallback.P);}
 });
 await test('direct model/legacy snapshots cannot remove spaces or restore semantic arrows',()=>{
  for(const mode of ['none','row','col','both'])for(const width of ['auto','45']){const t=fixture(mode),params=p({tbWidthMode:width}),before=JSON.stringify([params,t]),m=D.buildModel(params,{table:t}),clean=D.buildModel(p({tbWidthMode:width,tbTight:false,tbArrow:'mono'}),{table:t});
   D.assertTableExportComplete(m);assert.deepEqual(m,clean);assert.equal(m.params.tbTight,false);assert.equal(m.params.tbArrow,'mono');assert.deepEqual(m.slides[0].table.rawRows,rows);assert.deepEqual(flat(m.slides[0].table.displayRows),flat(rows));assert.equal(JSON.stringify([params,t]),before);assert.equal(m.slides[0].table.hcol,mode==='col'||mode==='both');assert.equal(m.slides[0].table.h0,mode==='row'||mode==='both'?1:0);
   if(width==='45')assert(Math.abs(tb(m).w-D.W*.45)<1e-7);
   for(const [r,c]of [[1,params.P],[2,params.t2],[3,params.P],[4,params.t2]])assert.equal(tb(m).cells[r][2].color,c);
  }
 });
 await test('native PPTX preserves literal whitespace and mono arrow color after legacy input',async()=>{
  const m=D.buildModel(p(),{table:fixture('both')}),out=await D.exportPptx({PptxGenJS,JSZip},p(),{model:m,type:'nodebuffer'}),zip=await JSZip.loadAsync(out.data),xml=await zip.file('ppt/slides/slide1.xml').async('string'),dom=new JSDOM(xml,{contentType:'application/xml'}),doc=dom.window.document;
  const cells=[...doc.getElementsByTagName('a:tr')].map(row=>[...row.getElementsByTagName('a:tc')]);assert.deepEqual(cells.map(row=>row.map(c=>[...c.getElementsByTagName('a:t')].map(t=>t.textContent).join(''))),flat(rows));
  for(const [r,color]of [[1,p().P],[2,p().t2],[3,p().P],[4,p().t2]])assert([...cells[r][2].getElementsByTagName('a:srgbClr')].some(c=>c.getAttribute('val')===color));dom.window.close();
 });
}
async function domTests(){
 const file=process.env.STUDIO_HTML||'studio.html',source=fs.readFileSync(path.join(ROOT,file),'utf8').replace('function buildTableUI(){','window.__retiredEval=code=>eval(code);function buildTableUI(){'),errors=[];
 class Resources extends ResourceLoader{fetch(url){const f=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(f)?Promise.resolve(fs.readFileSync(f)):null;}}
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 async function open(storage){const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|scrollTo/.test(e.message))errors.push(e.message);});
  const dom=new JSDOM(source,{url:'http://retired.test/studio.html',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*50})});w.scrollTo=()=>{};w.confirm=()=>true;for(const[k,v]of Object.entries(storage||{}))w.localStorage.setItem(k,v);}});await new Promise(r=>dom.window.addEventListener('load',r));await sleep(50);return dom;}
 const old={'ppt-studio-v4':JSON.stringify({base:'navy',p:p(),tab:'table'}),'ppt-studio-table':JSON.stringify(fixture('both'))};
 const dom=await open(old),w=dom.window,d=w.document,run=s=>w.__retiredEval(s),json=s=>JSON.parse(run('JSON.stringify('+s+')')),state=()=>json('T');
 const saved=()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));
 const locked=()=>{assert.equal(run('S.p.tbTight'),false);assert.equal(run('S.p.tbArrow'),'mono');assert.deepEqual(state().rows,rows);};
 try{
  d.querySelector('#tabs [data-tab="table"]').click();await sleep(30);
  await test('only the two retired UI controls are removed; header/font/spacing/layout controls remain',()=>{
   assert.equal(d.querySelector('[data-tk="tbTight"]'),null);assert.equal(d.querySelector('#tArrow'),null);const ins=d.querySelector('#tIns');assert(!ins.textContent.includes('移除中英文之間的空格'));assert(!ins.textContent.includes('▲▼ 符號色'));
   for(const q of ['#tHeaderMode','[data-tp="tbFont"]','#tLStrip','#tSettingsReset','[data-tsizing="width"]','[data-tsizing="height"]'])assert(d.querySelector(q),'kept '+q);
  });
  await test('legacy localStorage migrates only retired options, leaving data and header choices intact',()=>{locked();assert.equal(D.tableHeaderMode(state()),'both');assert.equal(run('S.p.tbWidthMode'),'45');assert.deepEqual(json('TM.slides[0].table.rawRows'),rows);assert.deepEqual(flat(json('TM.slides[0].table.displayRows')),flat(rows));});
  await test('actual JSON file import normalizes legacy values without modifying table content',async()=>{
   const input=d.querySelector('#fLoad'),event={target:{files:[{name:'legacy-settings.json',text:async()=>JSON.stringify({base:'navy',params:p({tbArrow:'ink'})})}],value:'legacy-settings.json'}};await input.onchange(event);locked();assert.equal(event.target.value,'');assert.equal(D.tableHeaderMode(state()),'both');
  });
  await test('paste updates and saved state keep exact spaces in every header mode',()=>{
   d.querySelector('#tImportMode').value='update';for(const mode of ['none','row','col','both']){run(`T=D.tableSetHeaderMode(T,${JSON.stringify(mode)});saveT();loadData(${JSON.stringify(rows)});persist()`);locked();assert.equal(D.tableHeaderMode(state()),mode);const persisted=JSON.parse(w.localStorage.getItem('ppt-studio-v4'));assert.equal(persisted.p.tbTight,false);assert.equal(persisted.p.tbArrow,'mono');assert.deepEqual(JSON.parse(w.localStorage.getItem('ppt-studio-table')).rows,rows);}
  });
  await test('Save settings JSON writes canonical retired values without changing the table',async()=>{
   const before=state();run('saveBlob=(blob,name)=>{window.__retiredSaved={blob,name}}');d.querySelector('#bSave').click();const artifact=w.__retiredSaved;assert(artifact&&artifact.name.endsWith('.json'));
   const text=await new Promise((resolve,reject)=>{const reader=new w.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsText(artifact.blob);});const data=JSON.parse(text);assert.equal(data.params.tbTight,false);assert.equal(data.params.tbArrow,'mono');assert.deepEqual(state(),before);
  });
  await test('save transaction cannot re-persist retired values and reload retains all source spaces',async()=>{
   run("S.p.tbTight=true;S.p.tbArrow='sem';persist();saveT()");locked();const fresh=await open(saved());try{fresh.window.document.querySelector('#tabs [data-tab="table"]').click();await sleep(20);const t=JSON.parse(fresh.window.localStorage.getItem('ppt-studio-table')),p=JSON.parse(fresh.window.localStorage.getItem('ppt-studio-v4')).p;assert.deepEqual(t.rows,rows);assert.equal(D.tableHeaderMode(t),'both');assert.equal(p.tbTight,false);assert.equal(p.tbArrow,'mono');assert.equal(fresh.window.document.querySelector('#tHeaderMode').value,'both');}finally{fresh.window.close();}
  });
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
}
if(require.main===module)(async()=>{if(!process.argv.includes('--dom-only'))await modelTests();if(!process.argv.includes('--model-only'))await domTests();console.log(`${count} retired table control checks passed (${process.env.STUDIO_HTML||'studio.html'}).`);})().catch(e=>{console.error(e);process.exitCode=1;});
