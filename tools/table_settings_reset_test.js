/* Single clear-format action: scoped source/offline DOM checks only. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const ROOT=path.resolve(__dirname,'..'),file=process.env.STUDIO_HTML||'studio.html',sleep=ms=>new Promise(r=>setTimeout(r,ms));
class Resources extends ResourceLoader{fetch(url){const p=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(p)?Promise.resolve(fs.readFileSync(p)):null;}}
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvas|scrollTo/.test(e.message))errors.push(e.message)});
 const source=fs.readFileSync(path.join(ROOT,file),'utf8').replace('function buildTableUI(){','window.__clearEval=code=>eval(code);function buildTableUI(){');
 const dom=new JSDOM(source,{url:'http://clear.test/studio.html',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:s=>({width:String(s).length*10})});w.scrollTo=()=>{};w.confirm=()=>true;}});
 const w=dom.window,d=w.document,$=s=>d.querySelector(s),run=s=>w.__clearEval(s),json=s=>JSON.parse(run('JSON.stringify('+s+')')),snap=()=>run('snapT()'),storage=()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));
 let passed=0;const test=(name,f)=>{f();passed++;console.log('PASS '+name)};
 try{
  for(let i=0;i<500&&!w.__studioApi;i++)await sleep(20);assert(w.__studioApi);run("setTab('table');showSec('look')");
  test('one top-level Appearance button and one handler, no duplicate reset route',()=>{
   assert.equal(d.querySelectorAll('#tFormatReset').length,1);assert.equal($('#tFormatReset').textContent,'清除全部格式');assert.equal($('#tFormatReset').closest('.tsec').id,'tSecLook');assert(!$('#tFormatReset').closest('details'));assert(!$('#tSettingsReset'));assert(!d.querySelector('.treset-options'));assert($('#tFormatReset').compareDocumentPosition($('#tDataSemantics'))&4);assert.equal($('#tFormatReset').getAttribute('aria-describedby'),'tFormatResetScope');assert.equal(run('typeof resetTableSettings'),'undefined');
  });
  run("cancelRangePreview();closeChip();S.base='navy';S.p=Object.assign(templateParams(S.base),{P:'226677',tbCardOn:false,tbHeaderStyle:'normal',tbGrid:'all',tbFont:'arial',tbWidthMode:'45'});T={rows:[['名稱','數值','備註'],[' A ','001','0'],['多行\\n文字','','tail']],title:'標題',unit:'單位',note:'來源',header:false,hcol:true,lastTotal:true,his:[{type:'col',i:2,kind:'rec',color:'auto'}],rules:[],bold:[1],align:{1:'right'},fmt:{1:{pct:true}},types:{1:'number'},formats:{1:'grouped'},cw:[3,2,2],hiStyle:'box'};T=D.tableMerge(T,{r0:1,c0:0,r1:2,c1:1});T=D.tableEditCell(T,1,0,'編輯後合併\\n0');HIST.a=[];HIST.i=-1;HIST.lock=false;clearTimeout(HIST.t);saveT();pushHist(true);renderGrid(true);renderTable();persist();");
  w.localStorage.setItem('unrelated-state','keep');
  const before=snap(),beforeT=json('T'),beforeHist=json('HIST.a'),beforeStorage=storage(),globals=json('Object.fromEntries(Object.entries(S.p).filter(([k])=>!TABLE_FORMAT_KEYS.includes(k)))');
  test('Cancel leaves data, merged original/edited text, formats, history and storage unchanged',()=>{
   let count=0;w.confirm=message=>{count++;for(const t of ['保留資料','合併範圍','合併前各格原文','標題／合計','不刪除資料'])assert(message.includes(t),t);return false};$('#tFormatReset').click();assert.equal(count,1);assert.equal(snap(),before);assert.deepEqual(json('HIST.a'),beforeHist);assert.deepEqual(storage(),beforeStorage);
  });
  let after;
  test('Confirm clears full format once while preserving every source and merge field',()=>{
   let count=0;w.confirm=()=>{count++;$('#tFormatReset').click();return true};$('#tFormatReset').click();assert.equal(count,1);const t=json('T');
   for(const k of ['rows','merges','title','unit','note'])assert.deepEqual(t[k],beforeT[k],k);
   for(const k of ['his','rules','bold'])assert.deepEqual(t[k],[],k);
   for(const k of ['align','fmt','types','formats'])assert.deepEqual(t[k],{},k);
   assert.equal(t.header,'auto');assert.equal(t.lastTotal,null);assert.equal(t.hcol,false);
   assert.deepEqual(json('Object.fromEntries(Object.entries(S.p).filter(([k])=>!TABLE_FORMAT_KEYS.includes(k)))'),globals);
   assert.deepEqual(JSON.parse(w.localStorage.getItem('ppt-studio-table')).merges,beforeT.merges);assert.equal(w.localStorage.getItem('unrelated-state'),'keep');
   after=snap();assert.equal(json('HIST.a').length,beforeHist.length+1);
  });
  test('one Undo restores all formats and merges; Redo restores clear without losing raw text',()=>{
   $('#tUndo').click();assert.equal(snap(),before);assert.deepEqual(json('T.merges'),beforeT.merges);$('#tRedo').click();assert.equal(snap(),after);assert.deepEqual(json('T.rows'),beforeT.rows);assert.deepEqual(json('T.merges'),beforeT.merges);
  });
  await sleep(250);assert.equal(errors.length,0,errors.join('\n'));console.log(JSON.stringify({status:'pass',tests:passed,file}));
 }finally{dom.window.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
