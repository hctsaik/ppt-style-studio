/* Actual normal/offline Studio DOM contracts. Not browser layout certification. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');
const ROOT=path.resolve(__dirname,'..'),FILE=process.env.STUDIO_HTML||'studio.html';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(test,label){const end=Date.now()+30000;while(Date.now()<end){if(test())return;await delay(20);}throw Error('Timeout '+label);}
async function boot(storage={}){const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|scrollTo/.test(e.message))errors.push(e.message);});class Resources extends ResourceLoader{fetch(url){const file=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(file)?Promise.resolve(fs.readFileSync(file)):null;}}
 const source=fs.readFileSync(path.join(ROOT,FILE),'utf8').replace('function buildTableUI(){','window.__fixedEval=code=>eval(code);function buildTableUI(){');
 const dom=new JSDOM(source,{url:'http://fixed-master.test/studio.html',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*10})});w.scrollTo=()=>{};w.confirm=()=>true;w.URL.createObjectURL=()=>`blob:test`;w.URL.revokeObjectURL=()=>{};for(const[k,v]of Object.entries(storage))w.localStorage.setItem(k,v);}});
 const w=dom.window,d=w.document,$=s=>{const el=d.querySelector(s);assert(el,'Missing '+s);return el;},run=s=>w.__fixedEval(s);await until(()=>w.__fixedEval&&w.__studioApi,'Studio boot');await delay(80);// JSDOM lacks the browser postMessage task source used by bundled JSZip.
 // Run the same repository ZIP bundle on Node scheduling, retaining real package generation.
 w.JSZip={loadAsync:data=>require('../jszip.min.js').loadAsync(Buffer.from(data))};
 w.__fixedDownloads=[];run('saveBlob=(data,name)=>window.__fixedDownloads.push({data,name})');
 return {dom,w,d,$,run,errors,tab:t=>$('#tabs [data-tab="'+t+'"]').click(),state:()=>JSON.parse(JSON.stringify(w.FixedMaster.getState($('#vMaster'))))};
}
(async()=>{let checks=0;const test=async(n,fn)=>{await fn();checks++;console.log('PASS '+n);};const app=await boot();const {w,d,$,run,tab,state}=app;let storage;
 try{
  await test('Independent master nav, original-four labels, presets and seven colors',()=>{tab('master');assert(!$('#vMaster').hidden);assert($('#vQuick').hidden);assert($('#pageInfo').hidden);assert(d.body.classList.contains('tabM'));assert.equal(d.querySelectorAll('.fmOriginal').length,4);assert.equal(d.querySelectorAll('[data-fm-preset]').length,7);assert.equal(d.querySelectorAll('[data-fm-color]').length,7);assert($('.fm').textContent.includes('非 PowerPoint 忠實縮圖'));const css=$('#fixedMasterCss').textContent;assert(css.includes('.fm{width:100%;min-width:0;max-width:1260px;'));assert(css.includes('@media(max-width:850px)'));assert(css.includes('@media(max-width:480px)'));assert(css.includes('min-height:44px'));assert(css.includes('.fmCanvas{min-width:0;max-width:100%;border:1px solid #D4D6D9;background:#fff;overflow:auto}'));});
  await test('Mobile editor grid can shrink while only the 540px schematic scrolls locally',()=>{
   // CSS/DOM contract, not a JSDOM geometry claim. Real 360px rendering needs HTTPS QA.
   const rules=Array.from($('#fixedMasterCss').sheet.cssRules);
   const rule=(selector,list=rules)=>{const r=list.find(r=>r.selectorText===selector);assert(r,'Missing CSS '+selector);return r.style;};
   const media=q=>{const r=rules.find(r=>r.conditionText===q);assert(r,'Missing media '+q);return Array.from(r.cssRules);};
   assert.equal(rule('.fmLayout')['grid-template-columns'],'300px minmax(0,1fr)','Desktop columns stay unchanged');
   assert.equal(rule('.fmLayout>*,.fmControls,.fmControls>*')['min-width'],'0');
   const fields=rule('.fmControls select,.fmControls input');
   assert.equal(fields.width,'100%');assert.equal(fields['min-width'],'0');assert.equal(fields['max-width'],'100%');
   const tablet=media('(max-width:850px)'),phone=media('(max-width:480px)');
   assert.equal(rule('.fmLayout',tablet)['grid-template-columns'],'minmax(0,1fr)');
   assert.equal(rule('.fmControls',tablet)['grid-template-columns'],'repeat(2,minmax(0,1fr))');
   assert.equal(rule('.fmControls',phone)['grid-template-columns'],'minmax(0,1fr)');
   assert.equal(rule('.fmColors')['flex-wrap'],'wrap');
   assert.equal(rule('.fmCanvas')['min-width'],'0');assert.equal(rule('.fmCanvas')['max-width'],'100%');
   assert.equal(rule('.fmCanvas').overflow,'auto');assert.equal(rule('.fmCanvas svg')['min-width'],'540px');
   assert.equal($('.fmCanvas').parentElement.parentElement,$('.fmLayout'),'Preview is in a shrinkable grid child');
   assert.equal($('.fmControls').parentElement,$('.fmLayout'));
   assert.equal(d.querySelectorAll('.fmControls [data-fm-color]').length,7);
   assert.equal(d.querySelectorAll('.fmControls select,.fmControls input').length,6);
   assert(!rules.some(r=>r.style&&r.style['overflow-x']==='hidden'),'Do not hide page overflow instead of fixing sizing');
  });
  await test('Layout / quick style / marker / color / text events persist and preserve keyboard focus',()=>{
   const set=(key,value)=>{const el=$('[data-fm-field="'+key+'"]');el.focus();el.value=value;el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));assert.equal(d.activeElement.dataset.fmField,key);};
   set('layout','5');set('style','outline');set('marker','underline');const white=$('[data-fm-color="white"]');white.focus();white.click();assert.equal(d.activeElement.dataset.fmColor,'white');set('title','A<&B');set('focus','保留原文字');assert.equal(state().layout,'5');assert.equal(state().style,'outline');assert.equal(state().color,'white');assert.equal(state().focus,'保留原文字');assert(!d.querySelector('[data-fm-preview] B'));assert(!$('.fmWhite').hidden);assert.equal(JSON.parse(w.localStorage.getItem('ppt-studio-fixed-master')).focus,'保留原文字');});
  await test('Every global theme, custom font / palette and Kit apply leave fixed model, preview and state byte-identical',async()=>{const fixed=JSON.stringify(w.FixedMaster.build(state())),svg=$('[data-fm-preview]').innerHTML,selection=JSON.stringify(state());for(const preset of w.Deck.PRESETS){run("S.base='"+preset.id+"';S.p=templateParams(S.base);syncPanel();renderExtra()");assert.equal(JSON.stringify(w.FixedMaster.build(state())),fixed);assert.equal($('[data-fm-preview]').innerHTML,svg);assert.equal(JSON.stringify(state()),selection);}run("S.p.P='00FF00';S.p.tFont='Arial';S.p.bFont='Comic Sans MS';renderExtra()");assert.equal($('[data-fm-preview]').innerHTML,svg);tab('kit');d.dispatchEvent(new w.CustomEvent('stylekit-apply',{detail:{id:'wine'}}));tab('master');assert.equal($('[data-fm-preview]').innerHTML,svg);assert.equal(JSON.stringify(state()),selection);});
  await test('Cover/chapter restrict boxes without changing markers or content; switching back restores supported choice',()=>{const el=$('[data-fm-field="layout"]');el.value='1';el.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(state().style,'none');assert.equal(state().marker,'underline');assert.equal(state().title,'A<&B');assert.equal($('[data-fm-field="style"]').options.length,1);$('[data-fm-preset="6"]').click();assert.equal(state().layout,'7');assert.equal(state().style,'soft');assert.equal(state().focus,'保留原文字');});
  await test('Original download is available without changing state and byte-identical; current and preset exports have 5/11 native slides',async()=>{
   $('[data-fm-download="original"]').click();await until(()=>!$('[data-fm-download="original"]').disabled,'original download');assert.equal(w.__fixedDownloads.at(-1).name,'TSMC_Template (5).pptx');
   const read=blob=>new Promise((resolve,reject)=>{const reader=new w.FileReader();reader.onload=()=>resolve(new Uint8Array(reader.result));reader.onerror=reject;reader.readAsArrayBuffer(blob);});
   const raw=await read(w.__fixedDownloads.at(-1).data);assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),w.FixedMaster.sourceSha256);
   for(const [mode,count]of [['current',5],['presets',11]]){const button=$('[data-fm-download="'+mode+'"]');button.click();button.click();await until(()=>!$('[data-fm-download="'+mode+'"]').disabled,mode+' export');assert(!$('.fmStatus').textContent.includes('未完成'));const zip=await require('../jszip.min.js').loadAsync(await read(w.__fixedDownloads.at(-1).data));assert.equal(Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).length,count);}
   assert.equal(w.__fixedDownloads.length,3,'Repeated click is ignored');
  });
  await test('Failed/oversized export recovers enabled controls and keeps original bytes download available',async()=>{const e=$('[data-fm-field="title"]');e.value='長'.repeat(25);e.dispatchEvent(new w.Event('input',{bubbles:true}));$('[data-fm-download="current"]').click();await until(()=>!$('[data-fm-download="current"]').disabled,'validation failure');assert($('.fmStatus').textContent.includes('不會自動縮字'));assert.equal(state().title.length,25);assert.equal(w.__fixedDownloads.length,3);$('[data-fm-download="original"]').click();await until(()=>!$('[data-fm-download="original"]').disabled,'original after failure');assert.equal(w.__fixedDownloads.length,4);e.value='重新測試';$('[data-fm-field="title"]').value='重新測試';$('[data-fm-field="title"]').dispatchEvent(new w.Event('input',{bubbles:true}));});
  await test('Native download pending / failure / retry retains selection across rerender and navigation',async()=>{const host=d.createElement('div');d.body.appendChild(host);let calls=0,resolve;const download=()=>{calls++;return new Promise(r=>resolve=r);};w.FixedMaster.render(host,{state:{layout:'2',color:'purple'},onDownload:download});host.querySelector('[data-fm-download="current"]').click();host.querySelector('[data-fm-download="current"]').click();assert.equal(calls,1);w.FixedMaster.render(host,{onDownload:download});resolve(false);await until(()=>!host.querySelector('[data-fm-download="current"]').disabled,'cancel');assert(host.textContent.includes('已取消'));assert.equal(w.FixedMaster.getState(host).color,'purple');w.FixedMaster.render(host,{onDownload:async()=>{throw Error('test failure');}});host.querySelector('[data-fm-download="current"]').click();await until(()=>!host.querySelector('[data-fm-download="current"]').disabled,'failed');assert(host.textContent.includes('test failure'));w.FixedMaster.render(host,{onDownload:async()=>true});host.querySelector('[data-fm-download="current"]').click();await until(()=>!host.querySelector('[data-fm-download="current"]').disabled,'retry');assert(host.textContent.includes('已產生'));host.remove();});
  storage=Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return[k,w.localStorage.getItem(k)];}));
  await test('Other tab semantics and original quick-style palette remain unchanged',()=>{const master=JSON.stringify(state());tab('quick');assert(!$('#vQuick').hidden);assert($('#vMaster').hidden);assert(!d.body.classList.contains('tabM'));assert.equal(d.querySelectorAll('[data-qs-style]').length,6);tab('slides');assert(!$('#vSlides').hidden);assert(!$('#pageInfo').hidden);tab('master');assert.equal(JSON.stringify(state()),master);});
  assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
 const restored=await boot(storage);try{await test('Reload restores master tab and its independent selection',()=>{assert(!restored.$('#vMaster').hidden);assert.equal(restored.state().layout,'7');assert.equal(restored.state().focus,'保留原文字');assert.equal(restored.state().title,'重新測試');assert.deepEqual(restored.errors,[]);});}finally{restored.dom.window.close();}
 console.log(JSON.stringify({file:FILE,checks,browserLayout:'not covered here',PowerPoint:'not verified'}));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
