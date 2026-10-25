/* Responsive state/geometry contracts only. jsdom is not a layout engine:
 * no real-browser touch, keyboard, clipping or pixel certification is claimed. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');
const ROOT=path.resolve(__dirname,'..'),file=process.env.STUDIO_HTML||'studio.html';
async function main(){
 let width=390,height=844,vvHeight=844,vvTop=0;const errors=[],vc=new VirtualConsole();
 vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|scrollTo/.test(e.message))errors.push(e.message);});
 class Resources extends ResourceLoader{fetch(url){const p=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(p)?Promise.resolve(fs.readFileSync(p)):null;}}
 const source=fs.readFileSync(path.join(ROOT,file),'utf8').replace('function buildTableUI(){','window.__mobileStateEval=code=>eval(code);function buildTableUI(){');
 const dom=new JSDOM(source,{url:'http://mobile-state.test/studio.html',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.matchMedia=q=>({matches:[...q.matchAll(/(min|max)-(width|height)\s*:\s*(\d+)px/g)].every(([,bound,axis,n])=>bound==='min'?(axis==='width'?width:height)>=+n:(axis==='width'?width:height)<=+n),media:q,addListener(){},addEventListener(){}});
  Object.defineProperties(w,{innerWidth:{configurable:true,get:()=>width},innerHeight:{configurable:true,get:()=>height}});
  const vv=new w.EventTarget();Object.defineProperties(vv,{height:{get:()=>vvHeight},offsetTop:{get:()=>vvTop}});Object.defineProperty(w,'visualViewport',{configurable:true,value:vv});
  w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*50})});w.scrollTo=()=>{};w.confirm=()=>true;
 }});
 const w=dom.window,d=w.document,$=q=>{const e=d.querySelector(q);assert(e,'Missing '+q);return e;},run=s=>w.__mobileStateEval(s),wait=ms=>new Promise(r=>setTimeout(r,ms)),click=q=>$(q).click();
 const side=()=>width>=600&&width<=900&&height<=500,header=()=>side()?53:105,canvasWidth=()=>side()?width-Math.max(280,width*.42):width;
 const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height,x:left,y:top});
 const setViewport=(x,y)=>{width=x;height=y;vvHeight=y;vvTop=0;w.dispatchEvent(new w.Event('resize'));run('fitPrev();applyView(tableMeta())');};
 const snapshot=()=>run('JSON.stringify([T,S.p,TM,HIST.a,HIST.i])');let count=0;
 const test=async(n,fn)=>{await fn();count++;console.log('PASS '+n);};
 try{
  await new Promise(r=>w.addEventListener('load',r));await wait(80);click('#tabs [data-tab="table"]');await wait(80);
  const canvas=$('#tCanvas'),ins=$('#tIns');
  Object.defineProperty(canvas,'clientWidth',{configurable:true,get:canvasWidth});Object.defineProperty(canvas,'clientHeight',{configurable:true,get:()=>parseFloat(canvas.style.height)||height-header()});
  canvas.getBoundingClientRect=()=>rect(0,header(),canvasWidth(),canvas.clientHeight);
  ins.getBoundingClientRect=()=>side()?rect(canvasWidth(),header(),width-canvasWidth(),height-header()):rect(0,height-(ins.classList.contains('open')?height*.45:110),width,ins.classList.contains('open')?height*.45:110);
  run("S.base='navy';S.p=templateParams(S.base);T={rows:[['項目','數值'],['A','123']],title:'標題',unit:'單位',note:'來源',header:true,his:[],rules:[]};saveT();renderGrid(true);renderTable();pushHist(true)");
  await test('all visible semantic text and metadata have a 12px mobile preview floor',()=>{
   for(const [x,y]of [[360,740],[390,844],[412,915],[768,1024]]){setViewport(x,y);const p=w.__studio.tableViewport,min=run('tablePreviewMinFont(tableSlide(),tableMeta())');assert(min*p.pixelsPerInch/72>=12-.001);for(const k of ['title','unit','note'])assert(run(`tableMeta().slots.${k}.size`)*p.pixelsPerInch/72>=12-.001);}
  });
  await test('decorative dots cannot change floor; standalone glyph cells remain meaningful',()=>{
   const got=run(`(()=>{const old=[T.title,T.unit,T.note];T.title=T.unit=T.note='';try{const tb={slots:{}},sl={items:[{t:'tbl',cells:[[{runs:[{t:'●',o:{size:6}},{t:'Pass',o:{size:18}}]}]]}]};const decorated=tablePreviewMinFont(sl,tb);sl.items[0].cells[0][0].runs.shift();const plain=tablePreviewMinFont(sl,tb);sl.items[0].cells[0][0].runs=[{t:'●',o:{size:6}}];return[decorated,plain,tablePreviewMinFont(sl,tb)];}finally{[T.title,T.unit,T.note]=old;}})()`);assert.deepEqual(Array.from(got),[18,18,6]);
  });
  await test('zoom-collapse returns hidden control focus to a visible selected tab',async()=>{
   setViewport(390,844);for(const mode of ['fit','100']){run("showSec('look')");const before=snapshot();$(`.tzoom [data-z="${mode}"]`).focus();click(`.tzoom [data-z="${mode}"]`);await wait(40);assert(!ins.classList.contains('open'));assert.equal(d.activeElement.id,'tTabLook');assert.equal($('#tTabLook').getAttribute('aria-expanded'),'false');assert.equal(snapshot(),before);}
   click('.tzoom [data-z="fit"]');
  });
  await test('short-landscape side inspector is persistent with no auto-open width jump',()=>{
   setViewport(740,360);run("showSec('data')");assert(run('tableSideInspector()'));assert(ins.classList.contains('open'));assert.equal(canvas.style.height,'307px');const before=snapshot(),p=w.__studio.tableViewport.pixelsPerInch,cw=canvasWidth();click('#tTabData');assert(ins.classList.contains('open'));assert(!$('#tTabData').hasAttribute('aria-expanded'));assert.equal($('#tTabData').title,'切換設定');run('setRange({r:1,c:0},{r:1,c:0});fitPrev();applyView(tableMeta())');assert.equal(canvasWidth(),cw);assert.equal(w.__studio.tableViewport.pixelsPerInch,p);assert.equal(snapshot(),before);
  });
  await test('900↔901 breakpoint keeps focus and restores unchanged desktop fit contract',()=>{
   setViewport(900,800);run("showSec('look')");$('#tMoreOptions').open=true;$('#tStyle').focus();const before=snapshot();setViewport(901,800);assert.equal($('#tRawPaste').getAttribute('aria-describedby'),'tRawPasteHelp tRawPasteNotice');assert.equal(canvas.style.height,'');assert($('#tMoreOptions').open);assert.equal(d.activeElement.id,'tStyle');let p=w.__studio.tableViewport;assert(Math.abs(p.pixelsPerInch-Math.min(p.availableWidth/(p.x1-p.x0),p.availableHeight/(p.y1-p.y0)))<.001);assert(!$('#tTabLook').hasAttribute('aria-expanded'));setViewport(900,800);assert(ins.classList.contains('open'));assert($('#tMoreOptions').open);assert.equal(d.activeElement.id,'tStyle');assert.equal(snapshot(),before);
  });
  await test('virtual-viewport resize preserves draft, selection and 16px rendered editor text',async()=>{
   setViewport(390,844);run("TZ='fit';renderTable();startCellEdit(document.querySelector('#tPrev .tc[data-r=\"1\"][data-c=\"1\"]'))");const editor=$('.trange-editor');editor.value='尚未儲存';const before=snapshot(),selected=run('JSON.stringify(TRANGE)');
   for(const [vh,top]of [[360,0],[320,40],[844,0]]){vvHeight=vh;vvTop=top;w.visualViewport.dispatchEvent(new w.Event('resize'));await wait(40);assert.strictEqual($('.trange-editor'),editor);assert.strictEqual(d.activeElement,editor);assert.equal(editor.value,'尚未儲存');assert(parseFloat(editor.style.fontSize)>=16);assert(parseFloat(editor.style.minHeight)*w.__studio.closeScale>=44-.001);assert(parseFloat(editor.style.minHeight)>=parseFloat(editor.style.fontSize)*1.3+10-.001);assert(parseFloat(editor.style.fontSize)*w.__studio.closeScale>=16-.001);assert.equal(snapshot(),before);assert.equal(run('JSON.stringify(TRANGE)'),selected);assert(canvas.clientHeight>=0);}
   setViewport(740,360);assert.strictEqual($('.trange-editor'),editor);assert(parseFloat(editor.style.fontSize)*w.__studio.closeScale>=16-.001);setViewport(901,800);assert.equal(editor.style.fontSize,'');assert.equal(editor.style.minHeight,'');assert.equal(editor.style.minWidth,'');assert.strictEqual(d.activeElement,editor);run('finishCellEdit(false)');assert.equal(snapshot(),before);
  });
  await test('dense last-cell editor fits a complete line and stays inside the expanded UI crop',async()=>{
   setViewport(390,844);run("S.p.tbAuto=false;S.p.tbDense='dense';S.p.tbPad='none';renderTable();startCellEdit(document.querySelector('#tPrev .tc[data-r=\"1\"][data-c=\"1\"]'))");const e=$('.trange-editor'),p=w.__studio.tableViewport,sl=run('tableSlide()'),sc=w.__studio.closeScale,stage=$('.tstagew');
   const bottom=(parseFloat(e.style.top)/100*sl.h*90+Math.max(parseFloat(e.style.height)/100*sl.h*90,parseFloat(e.style.minHeight)))*sc-p.y0*p.pixelsPerInch;
   assert(parseFloat(e.style.minHeight)*sc>=44-.001);assert(parseFloat(e.style.minHeight)>=parseFloat(e.style.fontSize)*1.3+10-.001);assert(parseFloat(stage.style.height)>=bottom+1);run('finishCellEdit(false)');await wait(50);assert.equal(parseFloat(stage.style.height),w.__studio.tableViewport.height);
  });
  await test('Emphasis palette is always open without a disclosure gate at every breakpoint',()=>{
   for(const [x,y]of [[390,844],[740,360],[1280,800]]){setViewport(x,y);run("showSec('emphasis');closeChip()");const before=snapshot();assert(run('RANGE_OPEN'));assert(!$('#tSelPanel').hidden);assert(!$('.trange-palette').hidden);assert.equal(d.querySelectorAll('[data-range-preset]').length,6);assert(!d.querySelector('[data-range-action="palette"]'));run('setRange({r:1,c:0},{r:1,c:0})');assert(!$('.trange-palette').hidden);click('[data-range-action="close"]');assert.equal(run('TRANGE'),null);assert(!$('.trange-palette').hidden);assert.equal(snapshot(),before);run("showSec('data')");assert($('#tSelPanel').hidden);run("showSec('emphasis')");assert(!$('.trange-palette').hidden);}
  });
  await test('existing mobile workbench opens, closes and preserves data; no new importer',()=>{
   setViewport(390,844);run("showSec('data')");assert.equal($('#tRawPaste').getAttribute('aria-describedby'),'tRawPasteTouchHelp tRawPasteNotice');const before=run('JSON.stringify(T)');click('#tWorkbench');assert($('#tEdit').classList.contains('wide'));assert($('#tCsv'));assert.equal($('#tCsv').getAttribute('accept'),'.csv,.tsv,.txt,text/csv');click('#tWideDone');assert(!$('#tEdit').classList.contains('wide'));assert.equal(run('JSON.stringify(T)'),before);
  });
  await test('mobile CSS contract preserves pinch, existing data entry and bounded side layout',()=>{
   const rules=[...d.styleSheets].flatMap(s=>[...s.cssRules]);const texts=rules.map(r=>r.cssText).join('\n');assert(texts.includes('touch-action: pan-x pan-y pinch-zoom'));assert(texts.includes('#tIns .tsec[data-sec="data"] > #tWorkbench'));assert(texts.includes('minmax(280px,42%)')||texts.includes('minmax(280px, 42%)'));assert(texts.includes('.tinsTabs button[aria-expanded="true"]::after'));assert(!d.querySelector('meta[name="viewport"]').content.includes('user-scalable=no'));
  });
  assert.deepEqual(errors,[]);console.log(`${count} mobile state/geometry checks passed (${file}; real-browser visual and native gestures remain unverified).`);
 }finally{dom.window.close();}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
