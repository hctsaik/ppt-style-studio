/* Table-header semantics: model, native OOXML and DOM state transitions.
 * JSDOM is not a visual/browser accessibility or PowerPoint Ribbon certification.
 * STUDIO_HTML=PPT-Style-Studio.html exercises the separately rebuilt single file. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');
const D=require('../deck.js'),PptxGenJS=require('pptxgenjs'),JSZip=require('jszip');
const ROOT=path.resolve(__dirname,'..'),MODES=['none','row','col','both'];
const clone=x=>JSON.parse(JSON.stringify(x));
const rows=[['名稱','數值','備註'],['Google','15GB','正常'],['Gmail','20GB','待確認']];
const fixture=mode=>D.tableSetHeaderMode({rows:clone(rows),title:'模式測試',unit:'',note:'',lastTotal:false,bold:[],his:[],rules:[],types:{0:'text',1:'text',2:'text'},sizingFont:{bodyPt:13,headerPt:11,scale:1,autoBoost:1}},mode);
const params=width=>({...D.PRESETS[0],tbSizingVersion:2,tbWidthMode:width,tbHeightMode:'optimal',tbHeaderStyle:'primary'});
const model=(mode,width='auto')=>D.buildModel(params(width),{table:fixture(mode)});
const table=m=>m.slides[0].items.find(x=>x.t==='tbl');
let passed=0;
const test=async(name,fn)=>{await fn();passed++;console.log('PASS '+name);};
async function modelTests(){
 await test('four modes project legacy header/hcol and infer only automatic first rows',()=>{
  assert.deepEqual(D.TABLE_HEADER_MODES.map(x=>x.key),MODES);
  for(const mode of MODES){const t=fixture(mode),saved=JSON.stringify(t);assert.equal(D.tableHeaderMode(t),mode);assert.equal(D.tableHeaderMode(clone(t)),mode);assert.equal(JSON.stringify(t),saved);assert(!('headerMode' in t));}
  assert.equal(D.tableHeaderMode({rows,header:'auto'}),'row');assert.equal(D.tableHeaderMode({rows:[['1','2'],['3','4']],header:'auto',hcol:true}),'col');
  assert.throws(()=>D.tableSetHeaderMode({},'invalid'),/未知/);
 });
 await test('updating pasted data preserves every explicit mode, including legacy false',()=>{
  for(const mode of MODES){const prev=fixture(mode),before=JSON.stringify(prev),next=D.tableFromPaste(rows,prev,'update');assert.equal(D.tableHeaderMode(next),mode);assert.equal(next.header,prev.header);assert.equal(next.hcol,prev.hcol);assert.deepEqual(next.rows,rows);assert.equal(JSON.stringify(prev),before);}
  const next=D.tableFromPaste(rows,{rows:[],header:'auto'},'new');assert.equal(next.header,true);
  assert.equal(D.tableFromPaste(rows,{rows,header:false,hcol:true},'update').header,false);
  const totals=D.tableFromPaste([['合計','說明','10'],['甲','乙','11']],{rows,header:false},'update');assert(totals.bold.includes(0),'first data row remains eligible for total detection');
  const periods=D.tableFromPaste([['項目','Q1','Q2'],['Revenue','10','20']],{rows,header:false},'update');assert.equal(periods.his.length,0,'first data row is not interpreted as period headers');
 });
 await test('tables without a first-row header preserve column formats by position when updating',()=>{
  const prev={rows:[['A','B'],['C','D']],header:false,hcol:true,align:{0:'right',1:'center'},types:{0:'text',1:'number'}};
  const next=D.tableFromPaste([['B','A'],['D','C']],prev,'update');assert.deepEqual(next.align,prev.align);assert.deepEqual(next.types,prev.types);
 });
 await test('auto, 90 and 45 layouts keep mode, full data and explicit source typography',()=>{
  for(const mode of MODES)for(const width of ['auto','90','45']){const t=fixture(mode),before=JSON.stringify(t),m=D.buildModel(params(width),{table:t}),b=table(m),meta=m.slides[0].table;D.assertTableExportComplete(m);
   assert.equal(meta.h0,mode==='row'||mode==='both'?1:0);assert.equal(meta.hcol,mode==='col'||mode==='both');assert.deepEqual(meta.rawRows,rows);assert.equal(JSON.stringify(t),before);
   if(width==='45'){assert(Math.abs(b.w-D.W*.45)<1e-7);assert.equal(meta.sizing.fit.stubLines>0,meta.hcol);}
  }
 });
 await test('both axes share selected header paint and the corner is applied once',()=>{
  const row=table(model('row')),both=table(model('both')),col=table(model('col'));
  assert.deepEqual(both.cells[0][0],row.cells[0][0]);assert.equal(both.cells[0][0].fill,D.PRESETS[0].P);
  assert.equal(both.cells[1][0].bold,true);assert.equal(col.cells[0][0].bold,true);assert.equal(both.cells[1][0].fill,both.cells[0][0].fill);assert.equal(both.cells[1][0].color,both.cells[0][0].color);
 });
 await test('copied HTML uses explicit row/column header scopes without changing content',()=>{
  for(const mode of MODES){const m=model(mode),d=new JSDOM(D.tableHtml(m)).window.document,header=mode==='row'||mode==='both',hcol=mode==='col'||mode==='both';
   assert.equal(d.querySelectorAll('th[scope="col"]').length,header?3:0);assert.equal(d.querySelectorAll('th[scope="row"]').length,hcol?3-(header?1:0):0);
   assert.deepEqual([...d.querySelectorAll('tr')].map(r=>[...r.cells].map(c=>c.textContent.replace(/\n/g,''))),rows);
   assert.equal(d.querySelector('tr').firstElementChild.tagName,header||hcol?'TH':'TD');
  }
 });
 await test('native table flags match all modes at ordinary and 45% width',async()=>{
  for(const mode of MODES)for(const width of ['auto','45']){const m=model(mode,width),r=await D.exportPptx({PptxGenJS,JSZip},params(width),{model:m,type:'nodebuffer'}),z=await JSZip.loadAsync(r.data),xml=await z.file('ppt/slides/slide1.xml').async('string');
   const d=new JSDOM(xml,{contentType:'application/xml'}).window.document,pr=d.getElementsByTagName('a:tblPr')[0];assert(pr);assert.equal(pr.getAttribute('firstRow'),mode==='row'||mode==='both'?'1':'0');assert.equal(pr.getAttribute('firstCol'),mode==='col'||mode==='both'?'1':'0');
   assert.equal(d.getElementsByTagName('a:tr').length,rows.length);assert.equal(d.getElementsByTagName('a:tc').length,9);
   const cells=[...d.getElementsByTagName('a:tc')].map(c=>[...c.getElementsByTagName('a:t')].map(t=>t.textContent).join(''));assert.deepEqual(cells,rows.flat());
  }
 });
}
async function domTests(){
 const errors=[],source=fs.readFileSync(path.join(ROOT,process.env.STUDIO_HTML||'studio.html'),'utf8').replace('function buildTableUI(){','window.__headerEval=code=>eval(code);function buildTableUI(){');
 class Resources extends ResourceLoader{fetch(url){const p=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(p)?Promise.resolve(fs.readFileSync(p)):null;}}
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 async function open(storage={}){const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|scrollTo/.test(e.message))errors.push(e.message);});
  const dom=new JSDOM(source,{url:'http://header.test/studio.html',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*50})});w.scrollTo=()=>{};w.confirm=()=>true;for(const[k,v]of Object.entries(storage))w.localStorage.setItem(k,v);}});
  await new Promise(r=>dom.window.addEventListener('load',r));await sleep(50);return dom;}
 const dom=await open(),w=dom.window,d=w.document,$=q=>{const e=d.querySelector(q);assert(e,'Missing '+q);return e;},run=s=>w.__headerEval(s),json=s=>JSON.parse(run('JSON.stringify('+s+')')),state=()=>json('T');
 const choose=mode=>{$('#tHeaderMode').value=mode;$('#tHeaderMode').dispatchEvent(new w.Event('change',{bubbles:true}));};
 const seed=mode=>run(`T=${JSON.stringify(fixture(mode))};S.p=Object.assign(templateParams(S.base),{tbSizingVersion:2,tbWidthMode:'45',tbHeightMode:'optimal'});HIST.a=[];HIST.i=-1;clearTimeout(HIST.t);saveT();pushHist(true);renderAll();`);
 try{
  $('#tabs [data-tab="table"]').click();await sleep(30);run("showSec('data')");
  await test('visible four-state selector and help retain hidden legacy controls',()=>{
   const e=$('#tHeaderMode');assert.deepEqual([...e.options].map(x=>x.value),MODES);assert(!e.closest('[hidden]'));assert.equal(e.getAttribute('aria-describedby'),'tHeaderModeHelp');assert($('#tHeaderModeHelp').textContent.includes('左上角沿用首列樣式'));assert($('#tHRow').closest('[hidden]'));assert($('#tHCol').closest('[hidden]'));
  });
  await test('mode changes, repeated selection and undo/redo preserve data and marks',()=>{
   seed('none');run("T.his=[{type:'range',r0:1,c0:1,r1:1,c1:2,presetId:'mint'}];saveT();pushHist(true)");const original=state();
   for(const mode of MODES){choose(mode);assert.equal(D.tableHeaderMode(state()),mode);assert.equal($('#tHeaderMode').value,mode);assert.deepEqual(state().rows,original.rows);assert.deepEqual(state().his,original.his);const length=json('HIST.a').length;choose(mode);assert.equal(json('HIST.a').length,length);}
   run('histGo(-1)');assert.equal(D.tableHeaderMode(state()),'col');assert.equal($('#tHeaderMode').value,'col');run('histGo(1)');assert.equal(D.tableHeaderMode(state()),'both');
  });
  await test('UI paste update and undo-paste preserve each explicit mode',()=>{
   for(const mode of MODES){seed(mode);choose(mode);$('#tImportMode').value='update';const pasted=[['服務','數量','註記'],['Gemini','25GB','完整'],['Google','30GB','保留']];run(`loadData(${JSON.stringify(pasted)})`);assert.equal(D.tableHeaderMode(state()),mode);assert.deepEqual(state().rows,pasted);assert.equal($('#tHeaderMode').value,mode);$('#tUndoPaste').click();assert.equal(D.tableHeaderMode(state()),mode);assert.deepEqual(state().rows,rows);}
  });
  await test('settings reset cancel and confirm retain header semantics and data',()=>{
   for(const mode of MODES){seed(mode);run("S.p.tbPad='l';saveT();renderTable()");const before=run('snapT()');w.confirm=()=>false;$('#tSettingsReset').click();assert.equal(run('snapT()'),before);w.confirm=()=>true;$('#tSettingsReset').click();assert.equal(D.tableHeaderMode(state()),mode);assert.equal($('#tHeaderMode').value,mode);assert.deepEqual(state().rows,rows);}
  });
  await test('saved explicit none and column modes survive reload without heuristic replacement',async()=>{
   for(const mode of ['none','col']){seed(mode);choose(mode);run('persist();saveT()');const saved=Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));const fresh=await open(saved);try{fresh.window.document.querySelector('#tabs [data-tab="table"]').click();await sleep(20);assert.equal(fresh.window.document.querySelector('#tHeaderMode').value,mode);const t=JSON.parse(fresh.window.localStorage.getItem('ppt-studio-table'));assert.equal(D.tableHeaderMode(t),mode);assert.deepEqual(t.rows,rows);}finally{fresh.window.close();}}
  });
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
}
if(require.main===module)(async()=>{if(!process.argv.includes('--dom-only'))await modelTests();if(!process.argv.includes('--model-only'))await domTests();console.log(`${passed} table header mode checks passed (${process.env.STUDIO_HTML||'studio.html'}).`);})().catch(e=>{console.error(e);process.exitCode=1;});
