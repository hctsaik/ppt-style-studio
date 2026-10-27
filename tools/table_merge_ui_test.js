/* Merge-specific Studio DOM/event tests. No browser rendering or real clipboard
 * certification. Run after the model helper and before the offline rebuild. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');
const ROOT=path.resolve(__dirname,'..'),FILE=process.env.STUDIO_HTML||'studio.html',pause=ms=>new Promise(r=>setTimeout(r,ms));
class Resources extends ResourceLoader{fetch(url){const f=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(f)?Promise.resolve(fs.readFileSync(f)):null;}}
async function boot(storage={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|scrollTo/.test(e.message))errors.push(e.message);});
 const source=fs.readFileSync(path.join(ROOT,FILE),'utf8').replace('function buildTableUI(){','window.__mergeEval=code=>eval(code);function buildTableUI(){');
 const dom=new JSDOM(source,{url:'http://merge.test/studio.html',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:s=>({width:String(s).length*10})});w.scrollTo=()=>{};w.confirm=()=>true;w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};for(const[k,v]of Object.entries(storage))w.localStorage.setItem(k,v);}});
 const w=dom.window,d=w.document,$=s=>{const el=d.querySelector(s);assert(el,'Missing '+s);return el;},run=s=>w.__mergeEval(s),click=s=>$(s).click();
 for(let i=0;i<1000&&!w.__studioApi;i++)await pause(20);assert(w.__studioApi,'Studio initialized: '+errors.join('\n'));click('#tabs [data-tab="table"]');click('#tWorkbench');
 const paste=(text,html='',target=$('#tRawPaste'))=>{const e=new w.Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(e,'clipboardData',{value:{getData:k=>k==='text/html'?html:text}});target.dispatchEvent(e);assert(e.defaultPrevented);};
 const state=()=>JSON.parse(w.localStorage.getItem('ppt-studio-table')),cell=(r,c)=>$(`#tGrid td[data-r="${r}"][data-c="${c}"]`),choose=(r0,c0,r1,c1)=>{cell(r0,c0).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));cell(r1,c1).dispatchEvent(new w.MouseEvent('click',{bubbles:true,shiftKey:true,cancelable:true}));};
 return{dom,w,d,$,run,click,paste,state,cell,choose,errors};
}
(async()=>{
 let app=await boot(),count=0;const test=async(name,fn)=>{await fn();count++;console.log('PASS '+name);};
 try{
  await test('horizontal, vertical and rectangular selection merge and unmerge preserve exact source cells',()=>{
   for(const [text,q] of [[' A \t001\t0',[0,0,0,2]],[' A \tB\n001\tC\n0\tD',[0,0,2,0]],[' A \t001\n0\t"line1\nline2"',[0,0,1,1]]]){app.paste(text);const before=app.state().rows;app.choose(...q);assert(!app.$('#tMergeCells').disabled);app.click('#tMergeCells');const t=app.state();assert.deepEqual(t.rows,before);assert.equal(t.merges.length,1);assert.equal(app.cell(q[0],q[1]).rowSpan,q[2]-q[0]+1);assert.equal(app.cell(q[0],q[1]).colSpan,q[3]-q[1]+1);assert(!app.$('#tUnmergeCells').disabled);app.click('#tUnmergeCells');assert.deepEqual(app.state().rows,before);assert.equal(app.state().merges.length,0);}
  });
  await test('editing a merged anchor, undo/redo and reload preserve both edited display and source',async()=>{
   app.paste('A\t001\n0\tB');const raw=app.state().rows;app.choose(0,0,1,1);app.click('#tMergeCells');let td=app.cell(0,0);td.focus();td.textContent='New text\nsecond';td.dispatchEvent(new app.w.Event('input',{bubbles:true}));app.run('pushHist(true)');assert.deepEqual(app.state().rows,raw);assert.equal(app.state().merges[0].text,'New text\nsecond');
   const saved=Object.fromEntries(Array.from({length:app.w.localStorage.length},(_,i)=>{const k=app.w.localStorage.key(i);return[k,app.w.localStorage.getItem(k)];}));app.dom.window.close();app=await boot(saved);assert.equal(app.cell(0,0).textContent,'New text\nsecond');assert.deepEqual(app.state().rows,raw);app.cell(0,0).click();app.click('#tUnmergeCells');assert(app.state().rows[0][0].includes('New text\nsecond'));assert(app.state().rows[0][0].includes('A'));assert.equal(app.state().rows[0][1],'001');assert.equal(app.state().rows[1][0],'0');assert(app.$('#tMergeStatus').textContent);app.click('#tUndo');assert.equal(app.state().merges[0].text,'New text\nsecond');app.click('#tRedo');assert.equal(app.state().merges.length,0);
  });
  await test('HTML mixed rowspan/colspan imports exact geometry; malformed HTML is atomic',()=>{
   app.paste('ignored','<table><tr><td rowspan="2" colspan="2">A</td><td>R1</td></tr><tr><td>R2</td></tr><tr><td>B</td><td>C</td><td>D</td></tr></table>');assert.equal(app.state().rows[0][2],'R1');assert.equal(app.state().rows[1][2],'R2');assert.equal(app.cell(0,0).rowSpan,2);assert.equal(app.cell(0,0).colSpan,2);const before=JSON.stringify(app.state());app.paste('Valid\tTSV','<table><tr><td rowspan="0">bad</td><td>other</td></tr></table>');assert.equal(JSON.stringify(app.state()),before);assert(app.$('#tRawPasteNotice').textContent.includes('未匯入'));const raw=app.state().rows;app.cell(0,0).click();app.click('#tUnmergeCells');assert.deepEqual(app.state().rows,raw);assert.equal(app.state().rows[0][0],'A');
  });
  await test('partial paste, unsafe structural delete and update reject atomically; insertion expands spans',()=>{
   app.paste('A\tB\tC\nD\tE\tF\nG\tH\tI');app.choose(1,1,2,2);app.click('#tMergeCells');const before=JSON.stringify(app.state());app.paste('X\tY','',app.cell(1,1));assert.equal(JSON.stringify(app.state()),before);assert(app.$('#tRawPasteNotice').textContent);app.cell(1,1).click();app.click('[data-g="r-"]');assert.equal(JSON.stringify(app.state()),before);app.click('[data-g="r+"]');assert.equal(app.state().rows.length,4);assert.equal(app.state().merges[0].r1,3);app.$('#tImportMode').value='update';const now=JSON.stringify(app.state());app.paste('A\tB\nC\tD');assert.equal(JSON.stringify(app.state()),now);assert(app.$('#tRawPasteNotice').textContent);app.$('#tImportMode').value='new';
  });
  await test('Shift-arrow rectangle selection and merged preview editing use the anchor',()=>{
   app.paste('A\tB\nC\tD');let td=app.cell(0,0);td.click();td.focus();for(const key of ['ArrowRight','ArrowDown'])td.dispatchEvent(new app.w.KeyboardEvent('keydown',{bubbles:true,cancelable:true,key,shiftKey:true}));app.click('#tMergeCells');assert.equal(app.state().merges.length,1);assert.equal(app.d.querySelectorAll('#tPrev .tc').length,1);assert.equal(app.$('#tPrev .tc').getAttribute('aria-rowspan'),'2');app.$('#tPrev .tc').dispatchEvent(new app.w.MouseEvent('dblclick',{bubbles:true,cancelable:true}));const edit=app.$('.trange-editor');assert(edit.value.includes('A'));assert(edit.value.includes('D'));edit.value='preview edit';edit.dispatchEvent(new app.w.KeyboardEvent('keydown',{bubbles:true,cancelable:true,key:'Enter'}));assert.equal(app.state().merges[0].text,'preview edit');assert.deepEqual(app.state().rows,[['A','B'],['C','D']]);
  });
  await test('pointer rectangle and keyboard navigation skip covered cells; crossing merges reject safely',()=>{
   app.paste('A\tB\tC\nD\tE\tF\nG\tH\tI');const pointer=(td,type)=>td.dispatchEvent(new app.w.MouseEvent(type,{bubbles:true,cancelable:true,button:0}));pointer(app.cell(0,0),'pointerdown');pointer(app.cell(1,1),'pointermove');pointer(app.cell(1,1),'pointerup');app.click('#tMergeCells');assert.equal(app.state().merges.length,1);assert.equal(app.cell(0,0).rowSpan,2);assert.equal(app.cell(0,0).colSpan,2);
   app.cell(0,0).focus();app.cell(0,0).dispatchEvent(new app.w.KeyboardEvent('keydown',{bubbles:true,cancelable:true,key:'Tab'}));assert.equal(app.d.activeElement,app.cell(0,2));const prev=app.$('#tPrev .tc[data-r="0"][data-c="0"]');prev.focus();prev.dispatchEvent(new app.w.KeyboardEvent('keydown',{bubbles:true,cancelable:true,key:'ArrowRight'}));assert.equal(app.d.activeElement,app.$('#tPrev .tc[data-r="0"][data-c="2"]'));
   const before=JSON.stringify(app.state());app.run('setRange({r:0,c:2},{r:2,c:1},false)');app.click('#tMergeCells');assert.equal(JSON.stringify(app.state()),before);assert(app.$('#tMergeStatus').textContent);
  });
  assert.equal(app.errors.length,0,app.errors.join('\n'));console.log(JSON.stringify({status:'pass',tests:count,file:FILE}));
 }finally{app.dom.window.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
