/* Dedicated tab/state/accessibility regression for source and offline bundle.
 * jsdom event checks do not certify real-browser layout or system clipboard. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');
const ROOT=path.resolve(__dirname,'..');
async function main(){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|scrollTo/.test(e.message))errors.push(e.message);});
 class Resources extends ResourceLoader{fetch(url){const p=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(p)?Promise.resolve(fs.readFileSync(p)):null;}}
 const source=fs.readFileSync(path.join(ROOT,process.env.STUDIO_HTML||'studio.html'),'utf8').replace('function buildTableUI(){','window.__emphasisEval=code=>eval(code);function buildTableUI(){');
 const dom=new JSDOM(source,{url:'http://emphasis.test/studio.html',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*50})});w.scrollTo=()=>{};w.confirm=()=>true;}});
 const w=dom.window,d=w.document,wait=ms=>new Promise(r=>setTimeout(r,ms)),$=s=>{const e=d.querySelector(s);assert(e,'Missing '+s);return e;},run=s=>w.__emphasisEval(s),click=s=>$(s).click(),tab=k=>click(`.tinsTabs [data-t="${k}"]`),active=()=>$('.tinsTabs [aria-selected="true"]').dataset.t,cell=(r=1,c=1)=>$(`#tPrev .tc[data-r="${r}"][data-c="${c}"]`),json=s=>JSON.parse(run('JSON.stringify('+s+')')),svg=()=>$('#tPrev .tsvg').innerHTML;
 const key=(el,k,p={})=>el.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true,...p}));
 const pointer=(el,type,x,y,p={})=>{const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:x,clientY:y});for(const[k,v]of Object.entries({pointerId:1,pointerType:'mouse',isPrimary:true,...p}))Object.defineProperty(e,k,{value:v});el.dispatchEvent(e);};
 const state=()=>run('JSON.stringify([T,S.p,HIST.a,HIST.i])'),selection=()=>json('[TRANGE,RANGE_ANCHOR,RANGE_FOCUS]');
 const hasFocus=()=>{assert(d.activeElement!==d.body);assert(!d.activeElement.closest('[hidden]'));};
 let passed=0;const test=async(n,f)=>{await f();passed++;console.log('PASS '+n);};
 try{await new Promise(r=>w.addEventListener('load',r));await wait(80);click('#tabs [data-tab="table"]');await wait(80);run('saveT();pushHist(true)');
 await test('Exactly three named accessible tabs separate all H/L controls from whole-table appearance',()=>{
  const tabs=[...d.querySelectorAll('.tinsTabs button')];assert.deepEqual(tabs.map(x=>x.textContent),['資料','外觀','強調']);
  for(const b of tabs){assert.equal(b.getAttribute('role'),'tab');const panel=d.getElementById(b.getAttribute('aria-controls'));assert(panel);assert.equal(panel.getAttribute('role'),'tabpanel');assert.equal(panel.getAttribute('aria-labelledby'),b.id);}
  for(const id of ['tHLLauncher','tHLHint','tSelection','tRangeStatus','tSelPanel'])assert.equal($('#'+id).closest('.tsec').dataset.sec,'emphasis');
  for(const id of ['tFormatReset','tLStrip','tStyle','tCwReset','tCleanV'])assert.equal($('#'+id).closest('.tsec').dataset.sec,'look');
  assert.equal($('#tRawPaste').closest('.tsec').dataset.sec,'data');assert.equal(d.querySelectorAll('[data-range-action="palette"]').length,1);
 });
 await test('New rectangle switches only after pointerup; one-cell and keyboard selections agree',()=>{
  tab('data');const raw=state(),P=$('#tPrev');P.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:1000,right:1000,bottom:1000});
  const point=(r,c)=>run(`(()=>{const t=tableMeta(),s=tableSlide();return{x:(t.tx+t.colW.slice(0,${c}).reduce((a,b)=>a+b,0)+t.colW[${c}]/2)/s.w*1000,y:(t.ty+t.rowH.slice(0,${r}).reduce((a,b)=>a+b,0)+t.rowH[${r}]/2)/s.h*1000};})()`),a=point(1,1),b=point(2,2);
  pointer(cell(),'pointerdown',a.x,a.y);pointer(P,'pointermove',b.x,b.y);assert.equal(active(),'data');pointer(P,'pointerup',b.x,b.y);P.click();assert.equal(active(),'emphasis');assert.deepEqual(json('TRANGE'),{r0:1,c0:1,r1:2,c1:2});assert($('#tHLHint').textContent.includes('4'));assert.strictEqual(d.activeElement,cell(2,2));
  tab('look');cell().click();assert.equal(active(),'emphasis');assert($('#tHLHint').textContent.includes('1'));assert.strictEqual(d.activeElement,cell());
  tab('data');cell().focus();key(cell(),'ArrowRight',{shiftKey:true});assert.equal(active(),'emphasis');assert($('#tHLHint').textContent.includes('2'));assert.equal(state(),raw);
 });
 await test('Manual Data or Appearance survives redraw, fit, resize, and retains selection/history',async()=>{
  run('setRange({r:1,c:1},{r:2,c:2})');const before=selection(),raw=state();
  for(const k of ['data','look']){tab(k);run('renderTable(true);schedule()');w.dispatchEvent(new w.Event('resize'));await wait(80);assert.equal(active(),k);assert.deepEqual(selection(),before);assert.equal(state(),raw);assert($('#tHLLauncher').hidden);assert($('#tSelPanel').hidden);assert($('#tPop').hidden);assert.equal($('#tSelPanel').innerHTML,'');}
  cell(3,2).click();assert.equal(active(),'emphasis');assert.equal(state(),raw);
 });
 await test('Tab changes discard preview, not committed model, source, selection or undo history',()=>{
  for(const k of ['look','data']){run('setRange({r:1,c:1},{r:2,c:2});RANGE_OPEN=true;renderRangePanel()');const before=selection(),raw=state(),model=run('JSON.stringify(TM)'),committed=svg();$('[data-range-preset="v2-red-soft"]').focus();assert(run('RANGE_PREVIEW'));assert.notEqual(svg(),committed);tab(k);assert.equal(run('RANGE_PREVIEW'),null);assert.equal(svg(),committed);assert.deepEqual(selection(),before);assert.equal(state(),raw);assert.equal(run('JSON.stringify(TM)'),model);assert.strictEqual(d.activeElement,$(`.tinsTabs [data-t="${k}"]`));hasFocus();}
 });
 await test('Arrow/Home/End tab navigation provides one roving stop and visible focus',()=>{
  tab('data');$('#tTabData').focus();const raw=state();
  for(const[k,want]of [['ArrowRight','look'],['ArrowRight','emphasis'],['ArrowRight','data'],['ArrowLeft','emphasis'],['Home','data'],['End','emphasis']]){key(d.activeElement,k);assert.equal(active(),want);assert.equal(d.activeElement.dataset.t,want);assert.equal(d.querySelectorAll('.tinsTabs button[tabindex="0"]').length,1);assert.equal(d.querySelectorAll('#tIns .tsec:not([hidden])').length,1);hasFocus();}
  assert.equal(state(),raw);
 });
 await test('Explicit H/L from an existing selection reopens Emphasis and dismissal restores focus',()=>{
  cell().click();tab('look');const before=selection(),raw=state();cell().focus();key(cell(),'h');assert.equal(active(),'emphasis');assert.equal(d.activeElement.dataset.rangePreset,'v2-theme-soft');assert.deepEqual(selection(),before);key(d.activeElement,'Escape');assert.equal(run('RANGE_PREVIEW'),null);key(d.activeElement,'Escape');assert.equal(run('TRANGE'),null);assert.strictEqual(d.activeElement,cell());hasFocus();assert.equal(state(),raw);
 });
 await test('All widths use one Emphasis host, preserve focused control and never leak into other tabs',async()=>{
  const media=w.matchMedia;let mobile=false;w.matchMedia=q=>({matches:mobile&&q.includes('max-width:900px'),media:q,addListener(){},addEventListener(){}});
  try{cell().click();key(cell(),'h');const raw=state(),focused=d.activeElement,preview=run('RANGE_PREVIEW'),previewSvg=svg();for(const width of [true,false,true,false]){mobile=width;const preset=d.activeElement.dataset.rangePreset;w.dispatchEvent(new w.Event('resize'));await wait(60);assert.equal(d.querySelectorAll('.trange-panel').length,1);assert.equal(d.querySelectorAll('[data-range-family]').length,4);assert.equal(d.querySelectorAll('[data-range-preset]').length,5);assert($('#tSecEmphasis').contains($('.trange-panel')));assert.equal($('#tPop').innerHTML,'');assert($('#tPop').hidden);assert.equal(d.activeElement.dataset.rangePreset,preset);assert.strictEqual(d.activeElement,focused);assert.strictEqual(run('RANGE_PREVIEW'),preview);assert.equal(svg(),previewSvg);hasFocus();}
   for(const k of ['data','look']){tab(k);w.dispatchEvent(new w.Event('resize'));await wait(40);assert.equal(active(),k);assert.equal(d.querySelectorAll('.trange-panel').length,0);assert($('#tPop').hidden);assert.equal(state(),raw);}
  }finally{w.matchMedia=media;}
 });
 await test('Touch preview/apply/cancel/clear stay within Emphasis; committed styles survive manual tabs and undo',async()=>{
  pointer(cell(),'pointerdown',0,0,{pointerType:'touch'});cell().click();click('[data-range-action="palette"]');const rows=run('JSON.stringify(T.rows)'),before=run('JSON.stringify(T.his)');click('[data-range-family="outline"]');click('[data-range-preset="v2-green-soft"]');assert(run('RANGE_PREVIEW'));click('[data-range-action="cancel"]');assert.equal(run('JSON.stringify(T.his)'),before);click('[data-range-preset="v2-green-soft"]');click('[data-range-action="apply"]');const committed=run('JSON.stringify(T.his)');assert.notEqual(committed,before);const raw=state(),sel=selection();tab('look');tab('data');tab('emphasis');assert.equal(state(),raw);assert.deepEqual(selection(),sel);click('[data-range-action="clear"]');assert.notEqual(run('JSON.stringify(T.his)'),committed);tab('look');click('#tUndo');await wait(80);assert.equal(active(),'look');assert.equal(run('JSON.stringify(T.his)'),committed);assert.equal(run('JSON.stringify(T.rows)'),rows);
 });
 assert.deepEqual(errors,[]);console.log(`${passed} Emphasis tab checks passed (${process.env.STUDIO_HTML||'studio.html'}).`);
 }finally{dom.window.close();}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
