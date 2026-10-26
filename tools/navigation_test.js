/* Real source/offline DOM events and responsive CSS contracts. No browser,
 * local server, CDP, screenshots, or synthetic layout certification. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');
const ROOT=path.resolve(__dirname,'..'),FILE=process.env.STUDIO_HTML||'studio.html';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function boot(storage={},suffix=''){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|scrollTo/.test(e.message))errors.push(e.message);});
 class Resources extends ResourceLoader{fetch(url){const file=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(file)?Promise.resolve(fs.readFileSync(file)):null;}}
 const source=fs.readFileSync(path.join(ROOT,FILE),'utf8').replace('function buildTableUI(){','window.__navEval=code=>eval(code);function buildTableUI(){');
 const dom=new JSDOM(source,{url:'https://navigation.test/studio.html'+suffix,runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(options){w.__lastNavScroll={node:this,options};};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});
  w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*10})});w.scrollTo=()=>{};w.confirm=()=>true;w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
  for(const[k,v]of Object.entries(storage))w.localStorage.setItem(k,v);
 }});
 const w=dom.window,d=w.document,$=s=>{const el=d.querySelector(s);assert(el,'Missing '+s);return el;},run=code=>w.__navEval(code);
 const end=Date.now()+30000;while(!w.__navEval||!w.__studioApi){if(Date.now()>end)throw Error('Studio boot timed out');await pause(20);}await pause(80);
 return{dom,w,d,$,run,errors,tab:name=>$(`#tabs [data-tab="${name}"]`).click()};
}
(async()=>{
 let checks=0;const test=async(name,fn)=>{await fn();checks++;console.log('PASS '+name);};
 const quickBytes='{ "source":"common", "commonKey":"purple", "style":"underline", "text":"保留 00123" }';
 const kitBytes=JSON.stringify({source:'independent',id:'wine'}),base=require('../deck.js').PRESETS[0];
 const saved={base:'navy',p:base,tab:'quick',key:'cards',labels:{},autoTone:false};
 const storage={'ppt-studio-v4':JSON.stringify(saved),'ppt-studio-quick-styles':quickBytes,'ppt-studio-stylekit-v1':kitBytes};
 const app=await boot(storage),{w,d,$,run,tab}=app;
 try{
  await test('Old current tab migrates to master and persists without changing either preference store',()=>{
   assert.equal(run('S.tab'),'master');assert.equal(JSON.parse(w.localStorage.getItem('ppt-studio-v4')).tab,'master');assert.equal(run('S.autoTone'),false);assert.equal(run('model.slides[S.slide].key'),'cards');
   assert.equal(w.localStorage.getItem('ppt-studio-quick-styles'),quickBytes);assert.equal(w.localStorage.getItem('ppt-studio-stylekit-v1'),kitBytes);
   assert.equal(w.StyleKit.state().source,'independent');assert.equal(w.StyleKit.state().id,'wine');assert($('#vQuick').hidden);assert($('#vQuick').hasAttribute('inert'));assert(!$('#vQuick').children.length);assert($('#vKit').hidden);assert($('#vKit').hasAttribute('inert'));assert(!$('#vMaster').hidden);
  });
  await test('Exactly six discoverable entries expose master materials and valid ARIA targets',()=>{
   assert.deepEqual([...d.querySelectorAll('#tabs button')].map(b=>b.dataset.tab),['style','slides','icons','table','master','guide']);assert.equal(d.querySelector('#tabs [data-tab="quick"]'),null);assert.equal($('#tabs').getAttribute('aria-label'),'工作室功能');
   for(const b of d.querySelectorAll('#tabs button'))assert(d.getElementById(b.getAttribute('aria-controls')));
   assert.equal(d.querySelectorAll('[data-fm-card]').length,70);assert.equal(d.querySelectorAll('.fmGalleryRow').length,10);assert.equal(d.querySelector('#tabs [data-tab="kit"]'),null);assert.equal(w.FixedMaster.getState($('#vMaster')).paletteSource,'common');
   assert.equal(d.querySelectorAll('#tabs [aria-current="page"]').length,1);assert.equal($('#tabs [aria-current="page"]').dataset.tab,'master');assert.equal(typeof w.QuickStyles.buildModel,'function');
  });
  await test('Repeated legacy programmatic routes never mount the old view or clear state',()=>{
   for(const legacy of ['quick','kit','quick']){tab('table');run("setTab('"+legacy+"')");assert.equal(run('S.tab'),'master');assert($('#vKit').hidden);assert(!$('#vMaster').hidden);assert($('#vQuick').hidden);assert.equal($('#tabs button.on').dataset.tab,'master');}
   assert.equal(w.localStorage.getItem('ppt-studio-quick-styles'),quickBytes);assert.equal(w.StyleKit.state().id,'wine');
   run("setTab('unknown')");assert.equal(run('S.tab'),'slides');assert(!$('#vSlides').hidden);
  });
  await test('Header keyboard navigation scrolls focus locally and never changes the selected slide',()=>{
   tab('slides');const key=run('model.slides[S.slide].key');$('#tabs [data-tab="style"]').focus();
   const press=k=>d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));
   press('ArrowLeft');assert.equal(d.activeElement.dataset.tab,'guide');press('Home');assert.equal(d.activeElement.dataset.tab,'style');press('End');assert.equal(d.activeElement.dataset.tab,'guide');press('ArrowRight');assert.equal(d.activeElement.dataset.tab,'style');press('ArrowDown');press('ArrowUp');
   assert.equal(run('model.slides[S.slide].key'),key);assert.equal(run('S.tab'),'slides');assert.equal(w.__lastNavScroll.node,d.activeElement);assert.equal(w.__lastNavScroll.options.inline,'nearest');
   $('#tabs [data-tab="master"]').focus();$('#tabs [data-tab="master"]').click();assert.equal(run('S.tab'),'master');assert.equal(d.activeElement.dataset.tab,'master');assert.equal(d.querySelectorAll('#tabs [aria-current="page"]').length,1);
  });
  await test('Programmatic navigation releases focus from a newly hidden view',()=>{
   tab('master');$('[data-fm-field="paletteSource"]').focus();assert($('#vMaster').contains(d.activeElement));tab('slides');assert.equal(d.activeElement,$('#tabs [data-tab="slides"]'));
  });
  await test('Legacy hash changes redirect without swallowing real slide links or filters',()=>{
   for(const hash of ['#/quick','#quick','#/tab/quick','#/kit','#kit','#/tab/kit','#/master']){tab('table');w.history.replaceState(null,'','?type=C&n=2'+hash);w.dispatchEvent(new w.HashChangeEvent('hashchange'));assert.equal(run('S.tab'),'master');assert.equal(w.location.hash,'#/master');assert.equal(w.location.search,'?type=C&n=2');assert($('#vKit').hidden);assert(!$('#vMaster').hidden);}
   const href=run("pageHref('cards')");w.history.replaceState(null,'','?type=C&n=2'+href);w.dispatchEvent(new w.HashChangeEvent('hashchange'));assert.equal(run('S.tab'),'slides');assert.equal(run('model.slides[S.slide].key'),'cards');assert.equal(w.location.hash,href);
  });
  await test('Real Back and Forward restore canonical master routes without extra history entries',async()=>{
   const until=async(fn,label)=>{const end=Date.now()+5000;while(!fn()){assert(Date.now()<end,'History timeout: '+label);await pause(10);}};
   for(const oldHash of ['#/kit','#/quick','#/master']){
    const href=run("pageHref('cards')");w.history.replaceState(null,'','?type=C&n=2'+href);w.dispatchEvent(new w.HashChangeEvent('hashchange'));assert.equal(run('S.tab'),'slides');
    const length=w.history.length;w.location.hash=oldHash;await until(()=>run('S.tab')==='master'&&w.location.hash==='#/master','route '+oldHash);assert.equal(w.history.length,length+1);
    w.history.back();await until(()=>run('S.tab')==='slides'&&w.location.hash===href,'back '+oldHash);assert.equal(run('model.slides[S.slide].key'),'cards');
    w.history.forward();await until(()=>run('S.tab')==='master'&&w.location.hash==='#/master','forward '+oldHash);assert.equal(w.history.length,length+1);assert.equal(w.location.search,'?type=C&n=2');
    assert.equal(w.localStorage.getItem('ppt-studio-quick-styles'),quickBytes);assert.equal(w.localStorage.getItem('ppt-studio-stylekit-v1'),kitBytes);
   }
  });
  await test('Desktop single-row CSS reserves action sizing and keeps scrolling local at 901–1920px',()=>{
   const rules=[...$('style').sheet.cssRules];
   const matching=(query,width)=>query.split(',').some(q=>!q.includes('orientation')&&!q.includes('height')&&[...q.matchAll(/\((min|max)-width:\s*(\d+)px\)/g)].every(([,side,n])=>side==='min'?width>=+n:width<=+n));
   const declaration=(selector,prop,width)=>{let result='';for(const r of rules){if(r.selectorText===selector&&r.style.getPropertyValue(prop))result=r.style.getPropertyValue(prop);else if(r.conditionText&&matching(r.conditionText,width))for(const nested of r.cssRules||[])if(nested.selectorText===selector&&nested.style.getPropertyValue(prop))result=nested.style.getPropertyValue(prop);}return result;};
   for(const width of [901,1024,1280,1440,1441,1920]){
    assert.equal(declaration('header','flex-wrap',width),'nowrap',String(width));assert.equal(declaration('header .tabs','flex',width),'0 1 auto');assert.equal(declaration('header .tabs','min-width',width),'0');assert.equal(declaration('header .tabs','overflow-x',width),'auto');assert.notEqual(declaration('header .tabs','order',width),'9');
    assert.equal(declaration('.tabs button','flex',width),'0 0 auto');assert.equal(declaration('header h1,header .btn','flex',width),'none');assert.equal(declaration('.more','flex',width),'none');
   }
   for(const width of [360,768,900]){assert.equal(declaration('header','flex-wrap',width),'wrap');assert.equal(declaration('header .tabs','flex',width),'1 1 100%');assert.equal(declaration('header .btn','min-height',width),'44px');}
   for(const width of [901,1024,1440])assert.equal(declaration('header h1 small','display',width),'none');
   for(const width of [360,768,900,901,1024,1440,1920]){assert.equal(declaration('header .reqnote','display',width),'block');assert.equal(declaration('header .reqnote','font-size',width),'11.5px');assert.equal(declaration('header .reqnote','color',width),'#595959');assert.equal(declaration('header .reqnote','white-space',width),'normal');}
   assert.equal(d.querySelectorAll('header .reqnote').length,1);
   assert.equal($('header .brand .reqnote').textContent,'如有需求請寄給 HCTSAIK，謝謝');assert(!$('#mMore').contains($('header .reqnote')));assert.equal(d.querySelector('#mMore .mobile-reqnote'),null);assert(!rules.some(r=>r.conditionText==='(min-width:901px) and (max-width:1440px)'));
   tab('slides');for(const id of ['bOne','bAll','bTpl','bMore'])assert.notEqual($('#'+id).style.display,'none');
   assert.equal($('#bTpl').getAttribute('aria-controls'),'mTpl');assert.equal($('#bMore').getAttribute('aria-controls'),'mMore');
  });
  assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
 for(const hash of ['#/quick','#quick','#/tab/quick','#/kit','#kit','#/tab/kit','#/master']){
  const initial=await boot({...storage,'ppt-studio-v4':JSON.stringify({...saved,tab:'table'})},'?type=C'+hash);
  try{await test('Initial legacy '+hash+' overrides retired current view without blank startup',()=>{assert.equal(initial.run('S.tab'),'master');assert(initial.$('#vKit').hidden);assert(!initial.$('#vMaster').hidden);assert(initial.$('#vQuick').hidden);assert.equal(initial.w.location.hash,'#/master');assert.equal(initial.w.location.search,'?type=C');assert.equal(initial.w.localStorage.getItem('ppt-studio-quick-styles'),quickBytes);assert.deepEqual(initial.errors,[]);});}finally{initial.dom.window.close();}
 }
 for(const oldTab of ['kit','quick']){const restored=await boot({...storage,'ppt-studio-v4':JSON.stringify({...saved,tab:oldTab}),'ppt-studio-fixed-master':JSON.stringify({paletteSource:'theme'})});try{await test('Saved '+oldTab+' tab routes to master without importing Kit theme preferences',()=>{assert.equal(restored.run('S.tab'),'master');assert.equal(restored.w.FixedMaster.getState(restored.$('#vMaster')).paletteSource,'theme');assert.equal(restored.w.localStorage.getItem('ppt-studio-stylekit-v1'),kitBytes);assert.equal(JSON.parse(restored.w.localStorage.getItem('ppt-studio-v4')).tab,'master');assert.deepEqual(restored.errors,[]);});}finally{restored.dom.window.close();}}
 console.log(`${checks} navigation checks passed (${FILE}; CSS/DOM only; desktop/mobile visual QA still requires authorized HTTPS).`);
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
