/* Actual Studio DOM/event integration in JSDOM. No browser, server or DevTools.
 * Run with NODE_PATH pointing to an existing jsdom installation, optionally
 * STUDIO_HTML=PPT-Style-Studio.html for the bundled page. Native export bytes
 * are stubbed; these checks do not certify PowerPoint rendering or downloads. */
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
  const status=reportMode,table=model.slides[0]&&model.slides[0].table,issue={severity:status==='blocked'?'error':'warning',code:status==='blocked'?'TEST_INVALID_GEOMETRY':'TEST_SMALL_TEXT',slideIndex:0,itemIndex:0,location:table?'第 1 頁 · 表格':'第 1 頁 · 快速樣式',reason:status==='blocked'?'測試：尺寸無效':'測試：小字建議',fix:'調整此位置再下載',...(table?{rowIndex:1,columnIndex:1,sourceRow:1}:{})};
  return{status,label:{ready:'可以匯出',advisory:'建議調整',blocked:'必須修正'}[status],canExport:status!=='blocked',errors:status==='blocked'?1:0,warnings:status==='advisory'?1:0,issues:status==='ready'?[]:[issue]};
 };
 w.Deck.exportPptx=async(_env,p,opt)=>{exported.push({params:p,settings:opt});if(pending)await pending.promise;return{data:new w.Blob(['test native export']),model:opt.model,patched:0};};
 const click=selector=>$(selector).click(),tab=name=>click(`#tabs [data-tab="${name}"]`),state=()=>JSON.parse(run('JSON.stringify(QuickStyles.getState($("#vQuick")))'));
 return{dom,w,d,$,run,click,tab,state,errors,exported,setMode:value=>{reportMode=value;},hold:()=>pending=deferred(),release:()=>{const old=pending;pending=null;old&&old.resolve();},settled:()=>until(()=>!run('exportFlow.busy()')&&!d.querySelector('[data-qs-download]:disabled'),'export settled'),downloads:()=>w.__downloads};
}
async function main(){
 let count=0;const test=async(name,fn)=>{await fn();count++;console.log('PASS '+name);};const app=await boot();
 const{w,d,$,run,click,tab,state}=app;let saved,kitSaved;
 try{
  await test('quick tab has one focused gallery with stable default selection',()=>{
   tab('quick');assert.equal($('#vQuick').hidden,false);assert.equal(state().source,'theme');assert.equal(state().style,'soft');assert.equal(state().themeKey,'main');assert.equal($('[data-qs-text]').value,'重點說明');assert.equal(d.querySelectorAll('[data-qs-style]').length,6);assert.equal(d.querySelectorAll('[data-qs-color]').length,3);
  });
  await test('quick source, text, colour and style events persist without losing selection',()=>{
   click('[data-qs-source="common"]');assert.deepEqual([...d.querySelectorAll('[data-qs-color]')].map(e=>e.dataset.qsColor),['red','yellow','blue','green','gray','purple','white']);
   click('[data-qs-color="white"]');click('[data-qs-style="marker"]');$('[data-qs-text]').value='中文重點\n00123';$('[data-qs-text]').dispatchEvent(new w.Event('input',{bubbles:true}));
   assert.equal(state().text,'中文重點\n00123');assert.equal(state().style,'marker');assert.equal(state().commonKey,'white');assert.equal(d.querySelectorAll('.qsPreview.dark').length,6);
   const stored=JSON.parse(w.localStorage.getItem('ppt-studio-quick-styles'));assert.equal(stored.text,state().text);assert.equal(stored.commonKey,'white');
  });
  await test('common colors stay fixed while theme colors and custom roles rerender',async()=>{
   const fixed=$('[data-qs-color="white"]').title;click('#tpls .tpl[data-id="wine"]');await delay(100);tab('quick');assert.equal($('[data-qs-color="white"]').title,fixed);assert.equal(state().text,'中文重點\n00123');
   click('[data-qs-source="theme"]');click('[data-qs-color="deep"]');assert.equal($('[data-qs-color="deep"]').title,'#'+run('S.p.PD'));
   run("setColor('PD','123A56');syncPanel();schedule()");await delay(100);assert.equal($('[data-qs-color="deep"]').title,'#123A56');assert.equal(state().style,'marker');assert.equal(state().text,'中文重點\n00123');
  });
  await test('Kit follows global theme across tabs, but explicit independent selection survives',async()=>{
   click('#tpls .tpl[data-id="navy"]');await delay(100);tab('kit');assert.equal(w.StyleKit.state().source,'follow');assert.equal(w.StyleKit.state().id,'navy');
   tab('slides');click('#tpls .tpl[data-id="green"]');await delay(100);tab('kit');assert.equal(w.StyleKit.state().id,'green');assert.equal($('#skPptx').dataset.stylekitTheme,'green');
   click('#skThemes [data-sk="wine"]');assert.equal(w.StyleKit.state().source,'independent');tab('slides');click('#tpls .tpl[data-id="navy"]');await delay(100);tab('kit');assert.equal(w.StyleKit.state().id,'wine');assert.equal($('#skPptx').dataset.stylekitTheme,'wine');
  });
  await test('Kit follow mode explicitly disables custom assets instead of serving old colors',async()=>{
   click('#skFollow');const stale=$('#skPptx');let requests=0;const observe=()=>requests++;d.addEventListener('stylekit-download',observe);run("setColor('P','AB12CD');syncPanel();schedule()");await delay(100);
   assert.equal(w.StyleKit.state().downloadable,false);assert($('#skCustomNotice'));for(const id of ['skPptx','skPotx','skXml']){assert.equal($('#'+id).getAttribute('aria-disabled'),'true');assert.equal($('#'+id).hasAttribute('href'),false);click('#'+id);}
   const staleClick=new w.MouseEvent('click',{bubbles:true,cancelable:true});stale.dispatchEvent(staleClick);assert(staleClick.defaultPrevented);assert.equal(requests,0);
   click('#skIndependent');assert.equal(w.StyleKit.state().downloadable,true);assert($('#skPptx').hasAttribute('href'));
   // Rendering the large gallery can exceed 650 ms on a busy JSDOM host; hold
   // time constant only for this deterministic duplicate-click contract.
   const realNow=w.Date.now,instant=realNow();w.Date.now=()=>instant;
   try{click('#skPptx');assert.equal(requests,1);assert($('#exportCheckNote').textContent.includes('建置時驗證'));const duplicate=new w.MouseEvent('click',{bubbles:true,cancelable:true});$('#skPptx').dispatchEvent(duplicate);assert(duplicate.defaultPrevented);}
   finally{w.Date.now=realNow;d.removeEventListener('stylekit-download',observe);}
  });
  await test('same-tick custom color change blocks the old followed Kit link before RAF redraw',async()=>{
   click('#tpls .tpl[data-id="navy"]');await delay(700);tab('kit');click('#skFollow');assert.equal(w.StyleKit.state().id,'navy');const oldLink=$('#skPptx');
   // Deliberately no await between schedule() and the old link's click.
   run("setColor('P','AB12CD');syncPanel();schedule()");const event=new w.MouseEvent('click',{bubbles:true,cancelable:true});oldLink.dispatchEvent(event);
   assert(event.defaultPrevented,'Old navy asset must not download for a new custom palette');assert.equal(w.StyleKit.state().downloadable,false);assert($('#skCustomNotice'));assert.equal($('#skPptx').hasAttribute('href'),false);assert.equal($('#skPptx').getAttribute('aria-disabled'),'true');await delay(100);
  });
  await test('same-tick wine selection exports the latest quick theme params and model before RAF redraw',async()=>{
   click('#tpls .tpl[data-id="navy"]');await delay(100);tab('quick');click('[data-qs-source="theme"]');click('[data-qs-color="main"]');click('[data-qs-style="solid"]');app.setMode('ready');const before=app.exported.length;
   // The visible gallery still has navy params until the scheduled repaint.
   click('#tpls .tpl[data-id="wine"]');click('[data-qs-download]');await app.settled();assert.equal(app.exported.length,before+1);
   const output=app.exported.at(-1);assert.equal(output.params.P,'7A1F2B');assert.equal(output.settings.model.params.P,'7A1F2B');assert.equal(output.settings.model.quickStyle.baseColor,'7A1F2B');assert.equal(output.settings.model.slides[0].items[0].fill,'7A1F2B');await delay(100);
  });
  await test('same-tick global change still permits the explicitly independent Kit asset',async()=>{
   tab('kit');click('#skThemes [data-sk="wire"]');assert.equal(w.StyleKit.state().source,'independent');assert.equal(w.StyleKit.state().id,'wire');await delay(700);const independent=$('#skPptx');
   // A separate Kit choice is intentional; refreshing globals must preserve it.
   click('#tpls .tpl[data-id="green"]');const event=new w.MouseEvent('click',{bubbles:true,cancelable:true});independent.dispatchEvent(event);
   assert.equal(event.defaultPrevented,false);assert.equal(independent.dataset.stylekitFile,'wire.pptx');assert.equal(w.StyleKit.state().source,'independent');assert.equal(w.StyleKit.state().id,'wire');await delay(100);assert.equal($('#skPptx').dataset.stylekitTheme,'wire');
   assert.deepEqual(JSON.parse(w.localStorage.getItem('ppt-studio-stylekit-v1')),{source:'independent',id:'wire'});
  });
  await test('ready and advisory quick exports proceed without confirmation and blockers show reasons',async()=>{
   tab('quick');click('[data-qs-source="theme"]');click('[data-qs-color="main"]');click('[data-qs-style="soft"]');$('[data-qs-text]').value='正常內容';$('[data-qs-text]').dispatchEvent(new w.Event('input',{bubbles:true}));
   for(const mode of ['ready','advisory']){app.setMode(mode);const n=app.downloads().length;click('[data-qs-download]');await app.settled();assert.equal(app.downloads().length,n+1);assert.equal($('#exportCheck').dataset.status,mode);assert($('#exportCheckTitle').textContent.includes(mode==='ready'?'可以匯出':'建議調整'));}
   app.setMode('blocked');const before=[app.exported.length,app.downloads().length];click('[data-qs-download]');await app.settled();assert.deepEqual([app.exported.length,app.downloads().length],before);assert.equal($('#exportCheck').dataset.status,'blocked');assert($('#exportCheck').open);assert($('#exportIssues').textContent.includes('尺寸無效'));assert($('#exportIssues').textContent.includes('調整此位置'));assert.equal(w.__confirms.length,0);
  });
  await test('quick blocker location returns to the actual quick tab',()=>{
   tab('slides');click('#exportIssues [data-issue="0"]');assert.equal(run('S.tab'),'quick');assert.equal($('#vQuick').hidden,false);
  });
  await test('cancel button discards pending bytes, resets UI and permits retry',async()=>{
   app.setMode('ready');tab('quick');const before=app.downloads().length;app.hold();click('[data-qs-download]');await until(()=>app.exported.length&&run('exportFlow.busy()'),'export started');assert.equal($('#exportCancel').hidden,false);click('#exportCancel');app.release();await app.settled();assert.equal(app.downloads().length,before);assert.equal(w.__studio.preflight.state,'cancelled');assert.equal($('[data-qs-download]').disabled,false);
   click('[data-qs-download]');await app.settled();assert.equal(app.downloads().length,before+1);
  });
  await test('quick double clicks and another native download share one active lock',async()=>{
   tab('quick');const n=app.exported.length,s=app.downloads().length;app.hold();click('[data-qs-download]');click('[data-qs-download]');tab('slides');click('#bOne');await delay(30);assert.equal(app.exported.length,n+1);app.release();await app.settled();assert.equal(app.downloads().length,s+1);assert.equal($('#bOne').disabled,false);
  });
  await test('changing the global style during export discards bytes and then allows current style export',async()=>{
   tab('quick');const before=app.downloads().length;app.hold();click('[data-qs-download]');click('#tpls .tpl[data-id="wine"]');await delay(100);app.release();await app.settled();assert.equal(app.downloads().length,before);assert.equal(w.__studio.preflight.state,'stale');
   tab('quick');click('[data-qs-download]');await app.settled();assert.equal(app.downloads().length,before+1);assert.equal(app.exported.at(-1).params.P,run('S.p.P'));
  });
  await test('ordinary tab and slide navigation keeps a valid pending snapshot',async()=>{
   tab('quick');const before=app.downloads().length;app.hold();click('[data-qs-download]');tab('slides');run('go((S.slide+1)%model.slides.length)');await delay(30);app.release();await app.settled();assert.equal(app.downloads().length,before+1);assert.equal(w.__studio.preflight.state,'complete');
  });
  await test('table blocker location selects the correct original data cell',async()=>{
   app.setMode('ready');tab('table');run("T=freshEditorTable({rows:[['Key','Value'],['A','00123'],['B','456']],header:true,title:'Location test',his:[]});fixT();saveT();renderGrid(true);renderTable()");assert.equal($('#tPptx').disabled,false);app.setMode('blocked');const before=app.exported.length;click('#tPptx');await until(()=>!run('exportFlow.busy()')&&!$('#tPptx').disabled,'table check settled');assert.equal(app.exported.length,before);assert.equal($('#exportCheck').dataset.status,'blocked');
   tab('slides');click('#exportIssues [data-issue="0"]');assert.equal(run('S.tab'),'table');assert.equal(d.activeElement.dataset.r,'1');assert.equal(d.activeElement.dataset.c,'1');
  });
  await test('normal native page and catalogue buttons do not call confirm',async()=>{
   app.setMode('ready');tab('slides');for(const button of ['#bOne','#bSchemeCatalogue']){const n=app.downloads().length;click(button);await until(()=>!run('exportFlow.busy()')&&!$(button).disabled,'native path '+button);assert.equal(app.downloads().length,n+1);}assert.equal(w.__confirms.length,0);
  });
  tab('quick');click('[data-qs-source="common"]');click('[data-qs-color="purple"]');click('[data-qs-style="underline"]');$('[data-qs-text]').value='保存恢復\n9007199254740993';$('[data-qs-text]').dispatchEvent(new w.Event('input',{bubbles:true}));saved=w.localStorage.getItem('ppt-studio-quick-styles');kitSaved=w.localStorage.getItem('ppt-studio-stylekit-v1');
  assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
 const restored=await boot({'ppt-studio-quick-styles':saved,'ppt-studio-stylekit-v1':kitSaved});
 try{
  await test('quick localStorage restores source, separate color selection, style and exact text',()=>{
   restored.tab('quick');const value=restored.state();assert.equal(value.source,'common');assert.equal(value.commonKey,'purple');assert.equal(value.style,'underline');assert.equal(value.text,'保存恢復\n9007199254740993');assert.equal(restored.$('[data-qs-text]').value,value.text);assert.equal(restored.$('[data-qs-source="common"]').getAttribute('aria-pressed'),'true');assert.equal(restored.$('[data-qs-color="purple"]').getAttribute('aria-pressed'),'true');
   restored.tab('kit');assert.equal(restored.w.StyleKit.state().source,'independent');assert.equal(restored.w.StyleKit.state().id,'wire');assert.equal(restored.$('#skPptx').dataset.stylekitFile,'wire.pptx');
  });assert.deepEqual(restored.errors,[]);assert.equal(restored.w.__confirms.length,0);
 }finally{restored.dom.window.close();}
 console.log(`${count} preflight DOM checks passed (${FILE}; JSDOM events only, native bytes stubbed).`);
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
