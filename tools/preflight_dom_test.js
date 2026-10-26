/* Actual Studio DOM/event integration in JSDOM. No browser, server or DevTools.
 * Run with NODE_PATH pointing to an existing jsdom installation, optionally
 * STUDIO_HTML=PPT-Style-Studio.html for the bundled page. Native export bytes
 * are stubbed; these checks do not certify PowerPoint rendering or downloads.
 * Uses visible page/table controls. Retired Quick/Kit links route to master;
 * compatibility issue models are tested without mounting removed interfaces. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');
const ROOT=path.resolve(__dirname,'..'),FILE=process.env.STUDIO_HTML||'studio.html';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
async function until(test,label,timeout=8000){const end=Date.now()+timeout;while(Date.now()<end){if(test())return;await delay(20);}throw new Error('Timed out: '+label);}
async function boot(storage={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|scrollTo/.test(e.message))errors.push(e.message);});
 class Resources extends ResourceLoader{fetch(url){const target=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(target)?Promise.resolve(fs.readFileSync(target)):null;}}
 const source=fs.readFileSync(path.join(ROOT,FILE),'utf8').replace('function buildTableUI(){','window.__preflightEval=code=>eval(code);function buildTableUI(){');
 assert(source.includes('window.__preflightEval='),'Test hook must be placed in the actual Studio closure');
 const dom=new JSDOM(source,{url:'http://preflight.test/studio.html',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){w.__lastScroll=this;};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});
  w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*10})});w.scrollTo=()=>{};w.__confirms=[];w.confirm=message=>{w.__confirms.push(message);return true;};
  let blob=0;w.URL.createObjectURL=()=>`blob:test-${++blob}`;w.URL.revokeObjectURL=()=>{};for(const[key,value]of Object.entries(storage))w.localStorage.setItem(key,value);
 }});
 const w=dom.window,d=w.document,$=selector=>{const e=d.querySelector(selector);assert(e,'Missing '+selector);return e;},run=code=>w.__preflightEval(code);
 await until(()=>w.__preflightEval&&w.__studioApi,'Studio initialized',30000);await delay(80);
 w.__downloads=[];run('saveBlob=(data,name)=>window.__downloads.push({data,name})');
 const originalCheck=w.Preflight.check,exported=[];let reportMode='ready',pending=null;
 w.Preflight.check=model=>{
  if(reportMode==='actual')return originalCheck(model,{deck:w.Deck});
  const status=reportMode,table=model.slides[0]&&model.slides[0].table,issue={severity:status==='blocked'?'error':'warning',code:status==='blocked'?'TEST_INVALID_GEOMETRY':'TEST_SMALL_TEXT',slideIndex:0,itemIndex:table?0:(model.slides[0]?.groups?.[0]?.from??0),location:table?'第 1 頁 · 表格':'第 1 頁 · 投影片元件',reason:status==='blocked'?'測試：尺寸無效':'測試：小字建議',fix:'調整此位置再下載',...(table?{rowIndex:1,columnIndex:1,sourceRow:1}:{})};
  return{status,label:{ready:'可以匯出',advisory:'建議調整',blocked:'必須修正'}[status],canExport:status!=='blocked',errors:status==='blocked'?1:0,warnings:status==='advisory'?1:0,issues:status==='ready'?[]:[issue]};
 };
 w.Deck.exportPptx=async(_env,p,opt)=>{exported.push({params:p,settings:opt});if(pending)await pending.promise;return{data:new w.Blob(['test native export']),model:opt.model,patched:0};};
 const click=selector=>$(selector).click(),tab=name=>{if(['quick','kit'].includes(name)){run("setTab('"+name+"')");assert.equal(run('S.tab'),'master');assert($('#vQuick').hidden);assert($('#vKit').hidden);}else click('#tabs [data-tab="'+name+'"]');},state=()=>JSON.parse(run('JSON.stringify(S.p)'));
 return{dom,w,d,$,run,click,tab,state,errors,exported,setMode:value=>{reportMode=value;},hold:()=>pending=deferred(),release:()=>{const old=pending;pending=null;old&&old.resolve();},settled:()=>until(()=>!run('exportFlow.busy()')&&!$('#bOne').disabled&&!$('#tPptx').disabled&&!$('#bSchemeCatalogue').disabled,'export settled'),downloads:()=>w.__downloads};
}

async function main(){
 let count=0;const test=async(name,fn)=>{await fn();count++;console.log('PASS '+name);};
 const oldQuick=JSON.stringify({source:'common',commonKey:'purple',style:'underline',text:'保存恢復\n9007199254740993'}),oldKit=JSON.stringify({source:'independent',id:'wire',paletteSource:'theme'});
 const app=await boot({'ppt-studio-quick-styles':oldQuick,'ppt-studio-stylekit-v1':oldKit});const{w,d,$,run,click,tab,state}=app;let storage;
 try{
  await test('Retired Kit and Quick routes select master without mounting hidden controls or changing legacy storage',()=>{
   for(const old of ['kit','quick']){tab(old);assert(!$('#vMaster').hidden);assert($('#vQuick').hidden);assert($('#vKit').hidden);assert(!$('#vQuick').children.length);assert(!d.querySelector('#tabs [data-tab="'+old+'"]'));assert.equal(w.FixedMaster.getState($('#vMaster')).paletteSource,'common');}
   assert.equal(w.localStorage.getItem('ppt-studio-quick-styles'),oldQuick);assert.equal(w.localStorage.getItem('ppt-studio-stylekit-v1'),oldKit);
  });
  await test('Master palette remains independent while global presets and custom colors change',async()=>{
   const e=$('[data-fm-field="paletteSource"]');e.value='theme';e.dispatchEvent(new w.Event('change',{bubbles:true}));const before=JSON.stringify(w.FixedMaster.getState($('#vMaster'))),gallery=$('.fmGallery').innerHTML;
   click('#tpls .tpl[data-id="wine"]');await delay(100);tab('master');assert.equal(JSON.stringify(w.FixedMaster.getState($('#vMaster'))),before);assert.equal($('.fmGallery').innerHTML,gallery);
   run("setColor('PD','123A56');syncPanel();schedule()");await delay(100);assert.equal(JSON.stringify(w.FixedMaster.getState($('#vMaster'))),before);assert.equal($('.fmGallery').innerHTML,gallery);assert.equal(w.localStorage.getItem('ppt-studio-stylekit-v1'),oldKit);
  });
  await test('Same-tick global palette change exports latest page params and model before RAF redraw',async()=>{
   click('#tpls .tpl[data-id="navy"]');await delay(100);tab('slides');run("goKey('cards')");app.setMode('ready');const before=app.exported.length;click('#tpls .tpl[data-id="wine"]');click('#bOne');await app.settled();assert.equal(app.exported.length,before+1);const out=app.exported.at(-1);assert.equal(out.params.P,'7A1F2B');assert.equal(out.settings.model.params.P,'7A1F2B');assert.equal(out.settings.model.slides[0].key,'cards');await delay(100);
  });
  await test('Ready and advisory page exports need no confirmation; blockers show exact reason and remedy',async()=>{
   tab('slides');run("goKey('cards')");for(const mode of ['ready','advisory']){app.setMode(mode);const n=app.downloads().length;click('#bOne');await app.settled();assert.equal(app.downloads().length,n+1);assert.equal($('#exportCheck').dataset.status,mode);assert($('#exportCheckTitle').textContent.includes(mode==='ready'?'可以匯出':'建議調整'));}
   app.setMode('blocked');const before=[app.exported.length,app.downloads().length];click('#bOne');await app.settled();assert.deepEqual([app.exported.length,app.downloads().length],before);assert.equal($('#exportCheck').dataset.status,'blocked');assert($('#exportCheck').open);assert($('#exportIssues').textContent.includes('尺寸無效'));assert($('#exportIssues').textContent.includes('調整此位置'));assert.equal(w.__confirms.length,0);
  });
  await test('Page issue location returns to the affected live page and selects its editable component',()=>{
   const checked=run('checkedModel.slides[0].key');tab('master');click('#exportIssues [data-issue="0"]');assert.equal(run('S.tab'),'slides');assert.equal(run('model.slides[S.slide].key'),checked);assert(run('SEL!==null'));assert($('#ebar').classList.contains('on'));
  });
  await test('A retained quick-style issue model redirects to visible master, never to a hidden interface',async()=>{
   app.setMode('blocked');run("window.__legacyIssueModel=QuickStyles.snapshot(S.p,{source:'theme',themeKey:'main',style:'soft',text:'Legacy issue'}).model");await run("checkedExport(ENV(),S.p,{model:window.__legacyIssueModel}).catch(()=>null)");tab('slides');click('#exportIssues [data-issue="0"]');assert.equal(run('S.tab'),'master');assert($('#vQuick').hidden);assert($('#vKit').hidden);assert(!$('#vMaster').hidden);assert.equal(d.activeElement.dataset.tab,'master');assert.equal(w.__lastScroll,$('#vMaster'));
  });
  await test('Cancel button discards pending page bytes, releases UI and allows retry',async()=>{
   app.setMode('ready');tab('slides');const before=app.downloads().length,n=app.exported.length;app.hold();click('#bOne');await until(()=>app.exported.length===n+1&&run('exportFlow.busy()'),'export started');assert.equal($('#exportCancel').hidden,false);click('#exportCancel');app.release();await app.settled();assert.equal(app.downloads().length,before);assert.equal(w.__studio.preflight.state,'cancelled');assert.equal($('#bOne').disabled,false);click('#bOne');await app.settled();assert.equal(app.downloads().length,before+1);
  });
  await test('Repeated page clicks and table/catalogue downloads share one active native-export lock',async()=>{
   tab('table');run("T=freshEditorTable({rows:[['Key','Value'],['A','00123'],['B','456']],header:true,title:'Location test',his:[]});fixT();saveT();renderGrid(true);renderTable()");tab('slides');const n=app.exported.length,s=app.downloads().length;app.hold();click('#bOne');click('#bOne');click('#bSchemeCatalogue');tab('table');click('#tPptx');await delay(30);assert.equal(app.exported.length,n+1);app.release();await app.settled();assert.equal(app.downloads().length,s+1);assert.equal($('#bOne').disabled,false);assert.equal($('#tPptx').disabled,false);
  });
  await test('Style changes during export invalidate its snapshot and retry uses the current style',async()=>{
   click('#tpls .tpl[data-id="navy"]');await delay(100);tab('slides');const before=app.downloads().length;app.hold();click('#bOne');click('#tpls .tpl[data-id="wine"]');await delay(100);app.release();await app.settled();assert.equal(app.downloads().length,before);assert.equal(w.__studio.preflight.state,'stale');click('#bOne');await app.settled();assert.equal(app.downloads().length,before+1);assert.equal(app.exported.at(-1).params.P,run('S.p.P'));
  });
  await test('Ordinary tab, retired-route and slide navigation preserves a valid pending page snapshot',async()=>{
   tab('slides');run("goKey('cards')");const before=app.downloads().length;app.hold();click('#bOne');tab('kit');tab('slides');run('go((S.slide+1)%model.slides.length)');await delay(30);app.release();await app.settled();assert.equal(app.downloads().length,before+1);assert.equal(w.__studio.preflight.state,'complete');assert(app.downloads().at(-1).name.includes('cards'));
  });
  await test('Table ready/advisory export without confirmation; blocker locates the unchanged source cell',async()=>{
   tab('table');assert.equal($('#tPptx').disabled,false);for(const mode of ['ready','advisory']){app.setMode(mode);const n=app.downloads().length;click('#tPptx');await app.settled();assert.equal(app.downloads().length,n+1);assert.equal($('#exportCheck').dataset.status,mode);assert.equal(run('T.rows[1][1]'),'00123');}
   app.setMode('blocked');const before=app.exported.length;click('#tPptx');await app.settled();assert.equal(app.exported.length,before);assert.equal($('#exportCheck').dataset.status,'blocked');tab('slides');click('#exportIssues [data-issue="0"]');assert.equal(run('S.tab'),'table');assert.equal(d.activeElement.dataset.r,'1');assert.equal(d.activeElement.dataset.c,'1');assert.equal(run('T.rows[1][1]'),'00123');assert.equal(w.__confirms.length,0);
  });
  await test('Table data changes during export suppress the old file without rewriting other values',async()=>{
   app.setMode('ready');const n=app.downloads().length;app.hold();click('#tPptx');run("T.rows[2][1]='9007199254740993';saveT();renderTable()");app.release();await app.settled();assert.equal(app.downloads().length,n);assert.equal(w.__studio.preflight.state,'stale');assert.equal(run('T.rows[1][1]'),'00123');assert.equal(run('T.rows[2][1]'),'9007199254740993');click('#tPptx');await app.settled();assert.equal(app.downloads().length,n+1);
  });
  await test('Normal whole-deck and catalogue exports do not ask for confirmation',async()=>{
   app.setMode('ready');tab('slides');for(const button of ['#bAll','#bSchemeCatalogue']){const n=app.downloads().length;click(button);await app.settled();assert.equal(app.downloads().length,n+1);}assert.equal(w.__confirms.length,0);
  });
  await test('Settings save/restore keeps values and invalidates pending native bytes',async()=>{
   const p=state(),before=app.downloads().length;click('#bSave');assert.equal(app.downloads().length,before+1);const data=app.downloads().at(-1).data,text=await new Promise((resolve,reject)=>{const reader=new w.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsText(data);});assert.equal(JSON.parse(text).params.P,p.P);
   run("S.p.P='13AC57';syncPanel();schedule()");await delay(100);app.hold();click('#bOne');const input=$('#fLoad');Object.defineProperty(input,'files',{configurable:true,value:[{name:'saved.json',text:async()=>text}]});input.dispatchEvent(new w.Event('change',{bubbles:true}));await until(()=>run('S.p.P')===p.P,'saved settings restored');app.release();await app.settled();assert.equal(app.downloads().length,before+1);assert.equal(w.__studio.preflight.state,'stale');assert.equal(input.value,'');assert.equal(run('T.rows[1][1]'),'00123');
  });
  tab('master');storage=Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const key=w.localStorage.key(i);return[key,w.localStorage.getItem(key)];}));assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
 const restored=await boot(storage);try{await test('Reload preserves fixed palette, exact table data and old preference bytes without exposing retired UI',()=>{
   assert(!restored.$('#vMaster').hidden);assert.equal(restored.w.FixedMaster.getState(restored.$('#vMaster')).paletteSource,'theme');assert.equal(restored.run('T.rows[1][1]'),'00123');assert.equal(restored.run('T.rows[2][1]'),'9007199254740993');assert.equal(restored.w.localStorage.getItem('ppt-studio-quick-styles'),oldQuick);assert.equal(restored.w.localStorage.getItem('ppt-studio-stylekit-v1'),oldKit);assert(restored.$('#vQuick').hidden);assert(restored.$('#vKit').hidden);assert.equal(restored.w.__confirms.length,0);assert.deepEqual(restored.errors,[]);
  });}finally{restored.dom.window.close();}
 console.log(`${count} preflight DOM checks passed (${FILE}; JSDOM events only, native bytes stubbed).`);
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
