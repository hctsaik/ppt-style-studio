/* Settings-only reset: DOM/model/history/storage contracts, not browser layout certification. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');
const ROOT=path.resolve(__dirname,'..'),file=process.env.STUDIO_HTML||'studio.html';
const source=fs.readFileSync(path.join(ROOT,file),'utf8').replace('function buildTableUI(){','window.__settingsEval=code=>eval(code);function buildTableUI(){');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const errors=[];
class Resources extends ResourceLoader{fetch(url){const p=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(p)?Promise.resolve(fs.readFileSync(p)):null;}}
async function open(storage={}){
 const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|scrollTo/.test(e.message))errors.push(e.message);});
 const dom=new JSDOM(source,{url:'http://settings.test/studio.html',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*50})});w.scrollTo=()=>{};w.confirm=()=>true;
  for(const [key,value]of Object.entries(storage))w.localStorage.setItem(key,value);
 }});
 await new Promise(r=>dom.window.addEventListener('load',r));await sleep(90);return dom;
}
async function main(){
 const dom=await open(),w=dom.window,d=w.document;
 const $=q=>{const e=d.querySelector(q);assert(e,'Missing '+q);return e;},click=q=>$(q).click(),run=s=>w.__settingsEval(s),json=s=>JSON.parse(run('JSON.stringify('+s+')'));
 const snap=()=>run('snapT()'),history=()=>json('HIST.a'),storage=()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));
 const event=(el,type)=>el.dispatchEvent(new w.MouseEvent(type,{bubbles:true,cancelable:true}));
 const seed=()=>{
  w.confirm=()=>true;
  run(`cancelRangePreview();closeChip();S.base='navy';S.p=Object.assign(templateParams(S.base),{P:'226677',A:'C36334',size:'L',bFont:'Arial',tbSizingVersion:1,tbFont:'arial',tbCardOn:false,tbHeaderStyle:'normal',tbStripes:true,tbGrid:'all',tbWidthMode:'45',tbHeightMode:'larger',tbPad:'l',tbH:'left',tbV:'top',tbTight:true,tbHiMode:'box',tbHiColor:'alert',tbPanel:true,tbTitleInk:'FF0000'});
   T={rows:[['名稱','數值','代碼'],['甲','9007199254740993','00123'],['多行\\n乙','0.000000000123',''],['合計','1000.12300',' A B ']],title:' 精確標題 ',unit:' 原單位 ',note:'註腳\\n來源',header:false,lastTotal:false,hcol:true,pin:true,keep:false,legend:{focus:'自訂圖例'},cw:[3,4,2],hiStyle:'box',his:[{type:'range',r0:1,c0:1,r1:2,c1:2,presetId:'v2-red-soft',family:'outline',borderWidth:3,bold:true,kind:'focus',color:'auto'},{type:'col',i:1,kind:'rec',color:'auto'}],hi:{type:'col',i:2},rules:[{c:1,op:'<',v:3,tone:'warn',style:'text'}],bold:[1,3],align:{1:'center'},fmt:{1:{dec:1,pct:true}},types:{1:'number'},formats:{1:'grouped'}};
   HIST.a=[];HIST.i=-1;clearTimeout(HIST.t);saveT();pushHist(true);renderGrid(true);renderTable();showSec('look');persist();`);
  w.localStorage.setItem('unrelated-page','unchanged');
 };
 const keptTable=t=>Object.fromEntries(Object.entries(t).filter(([key])=>!['cw','hiStyle','sizingFont'].includes(key)));
 const globals=()=>json('Object.fromEntries(Object.entries(S.p).filter(([key])=>!TABLE_FORMAT_KEYS.includes(key)))');
 let count=0;const test=async(name,f)=>{await f();count++;console.log('PASS '+name);};
 try{
  click('#tabs [data-tab="table"]');await sleep(50);
  await test('direct Appearance action describes preserved data and marks; old destructive format reset is separate',()=>{
   run("showSec('look')");const b=$('#tSettingsReset');assert.equal(b.textContent,'還原預設設定');assert.equal(b.closest('.tsec').id,'tSecLook');assert(!b.closest('details'));assert.equal(b.getAttribute('aria-describedby'),'tSettingsResetScope');assert($('#tSettingsResetScope').textContent.includes('保留資料、文字與已套用的強調標記'));assert($('#tFormatReset').closest('details').textContent.includes('清除強調標記'));
  });
  await test('Cancel changes no params, marks, selection, history, preview or storage',()=>{
   seed();run("setRange({r:1,c:1},{r:2,c:2});RANGE_OPEN=true;renderRangePanel();previewRangePreset('v2-yellow-soft')");const before=snap(),hist=history(),saved=storage(),selection=json('TRANGE'),preview=$('#tPrev .tsvg').innerHTML;let prompts=0;
   w.confirm=text=>{prompts++;assert(text.includes('列欄數與已套用的強調標記'));return false;};click('#tSettingsReset');assert.equal(prompts,1);assert.equal(snap(),before);assert.deepEqual(history(),hist);assert.deepEqual(storage(),saved);assert.deepEqual(json('TRANGE'),selection);assert.equal($('#tPrev .tsvg').innerHTML,preview);assert(run('!!RANGE_PREVIEW'));
  });
  await test('Confirm restores appearance/emphasis/output defaults while preserving every mark and content field',()=>{
   seed();const table=json('T'),global=globals(),base=run('S.base'),beforeHistory=history().length;click('#tSettingsReset');assert.deepEqual(keptTable(json('T')),keptTable(table));assert.deepEqual(globals(),global);assert.equal(run('S.base'),base);assert.equal(w.localStorage.getItem('unrelated-page'),'unchanged');assert.equal(run('T.cw'),null);assert.equal(run('T.hiStyle'),null);assert(run('!!D.tableSizingFontOf(T.sizingFont)'));
   assert.deepEqual(json('D.tableAppearanceOf(S.p)'),{card:true,header:'primary',stripes:false,grid:'horizontal'});assert.deepEqual(json('D.tableSizingOf(S.p)'),{version:2,widthMode:'auto',heightMode:'optimal'});assert.deepEqual(json('[S.p.tbH,S.p.tbV,S.p.tbFont,S.p.tbTight,S.p.tbHiMode,S.p.tbHiColor]'),['center','center','jh',false,'auto','auto']);assert(!run("Object.hasOwn(S.p,'tbPanel')||Object.hasOwn(S.p,'tbTitleInk')"));assert.equal(history().length,beforeHistory+1);
  });
  await test('reset is one undo step and repeated clicks add no entries or new confirmations',async()=>{
   seed();const before=snap(),n=history().length;let prompts=0;w.confirm=()=>{prompts++;return true;};click('#tSettingsReset');const after=snap();click('#tSettingsReset');click('#tSettingsReset');await sleep(400);assert.equal(prompts,1);assert.equal(history().length,n+1);assert.equal(snap(),after);click('#tUndo');assert.equal(snap(),before);click('#tRedo');assert.equal(snap(),after);
  });
  await test('a reentrant click during confirmation cannot create a second transaction',()=>{
   seed();const n=history().length;let prompts=0;w.confirm=()=>{prompts++;click('#tSettingsReset');return true;};click('#tSettingsReset');assert.equal(prompts,1);assert.equal(history().length,n+1);assert.equal(run('TABLE_SETTINGS_RESETTING'),false);
  });
  await test('accepted reset clears only the pending preview and keeps logical selection and committed marks',()=>{
   seed();run("setRange({r:1,c:1},{r:2,c:2});RANGE_OPEN=true;renderRangePanel();previewRangePreset('v2-yellow-soft')");const marks=json('T.his'),selection=json('TRANGE');click('#tSettingsReset');assert.equal(run('RANGE_PREVIEW'),null);assert(!$('#tPrev').classList.contains('range-preview'));assert.deepEqual(json('T.his'),marks);assert.deepEqual(json('TRANGE'),selection);
  });
  await test('inline text is untouched on Cancel, committed on Confirm, and survives reset undo',()=>{
   seed();event($('#tPrev .tc[data-r="1"][data-c="1"]'),'dblclick');const editor=$('.trange-editor');editor.value='00123\n新資料';const before=snap();w.confirm=()=>false;click('#tSettingsReset');assert.equal(snap(),before);assert.strictEqual($('.trange-editor'),editor);assert.equal(editor.value,'00123\n新資料');w.confirm=()=>true;click('#tSettingsReset');assert.equal(run('T.rows[1][1]'),'00123\n新資料');assert(!d.querySelector('.trange-editor'));click('#tUndo');assert.equal(run('T.rows[1][1]'),'00123\n新資料');assert.equal(run('T.hiStyle'),'box');
  });
  await test('Chinese composition blocks reset before opening confirmation',()=>{
   seed();event($('#tPrev .tc[data-r="1"][data-c="1"]'),'dblclick');const editor=$('.trange-editor');editor.dispatchEvent(new w.CompositionEvent('compositionstart',{bubbles:true}));editor.value='輸入中';const before=snap(),hist=history();let prompts=0;w.confirm=()=>{prompts++;return true;};click('#tSettingsReset');assert.equal(prompts,0);assert.equal(snap(),before);assert.deepEqual(history(),hist);assert.strictEqual($('.trange-editor'),editor);editor.dispatchEvent(new w.CompositionEvent('compositionend',{bubbles:true}));run('finishCellEdit(true,false)');
   seed();const grid=$('#tGrid td[data-r="1"][data-c="1"]');grid.dispatchEvent(new w.CompositionEvent('compositionstart',{bubbles:true}));const raw=snap();let gridPrompts=0;w.confirm=()=>{gridPrompts++;return true;};click('#tSettingsReset');assert.equal(gridPrompts,0);assert.equal(snap(),raw);grid.dispatchEvent(new w.CompositionEvent('compositionend',{bubbles:true}));
  });
  await test('ragged rows, blank rows, long numbers and cell endings stay exact',()=>{
   seed();run("T.rows=[['碼','數值','備註'],['00123','9007199254740993'],[],['','0.000000000123','末列\\n']];saveT();pushHist(true);renderGrid(true);renderTable()");const before=keptTable(json('T'));click('#tSettingsReset');assert.deepEqual(keptTable(json('T')),before);
  });
  await test('new defaults and empty data are idempotent',()=>{
   for(const rows of ["[['a','b'],['c','d']]",'[]']){run(`cancelRangePreview();closeChip();S.p=templateParams('navy');T=freshEditorTable({rows:${rows},title:'',unit:'',note:'',his:[],rules:[],cw:null,header:'auto'});HIST.a=[];HIST.i=-1;saveT();pushHist(true);renderGrid(true);renderTable();persist()`);const before=snap(),hist=history();let prompts=0;w.confirm=()=>{prompts++;return true;};click('#tSettingsReset');assert.equal(prompts,0);assert.equal(snap(),before);assert.deepEqual(history(),hist);}
  });
  await test('saved defaults and preserved marks survive a real app reload without touching unrelated state',async()=>{
   // The app normalizes legacy aliases on load. Start this reload case with the
   // same current mark format; earlier tests preserve even raw legacy fields.
   seed();run('T.header=true;fixT();saveT();pushHist(true);renderTable();persist()');const marks=json('T.his');assert.equal(marks.length,2);click('#tSettingsReset');assert.deepEqual(json('T.his'),marks);const expected=json('T'),params=json('S.p');await sleep(80);const reopened=await open(storage());try{const rw=reopened.window;assert.deepEqual(JSON.parse(rw.__settingsEval('JSON.stringify(T)')),expected);const rp=JSON.parse(rw.__settingsEval('JSON.stringify(S.p)'));for(const key of ['tbWidthMode','tbHeightMode','tbCardOn','tbHeaderStyle','tbStripes','tbGrid','tbHiMode','tbHiColor','P','A'])assert.equal(rp[key],params[key],key);assert.equal(rw.localStorage.getItem('unrelated-page'),'unchanged');}finally{reopened.window.close();}
  });
  assert.deepEqual(errors,[]);console.log(`${count} settings-only reset checks passed (${file}; no real-browser layout certification).`);
 }finally{dom.window.close();}
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
