/* Read-only Data surface / clipboard / native export regression.
 * DOM tests are not browser layout or real clipboard certification.
 * STUDIO_HTML=PPT-Style-Studio.html node tools/table_data_grid_test.js
 */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');
const D=require('../deck.js'),PptxGenJS=require('pptxgenjs'),JSZip=require('jszip');
const ROOT=path.resolve(__dirname,'..');
const fixture=[
 ['項目','免費版','Google AI Plus','Google AI Pro','Google AI Ultra 5x','Google AI Ultra 20x'],
 ['月費','NT$0','NT$165','NT$650','NT$3,300','NT$6,500'],
 ['適用對象','日常查詢或較輕度使用者','進階辦公、小資工作者','重度使用者','進階開發者、高頻創作者','企業級應用、高強度重度使用者'],
 ['Gmail、Google雲端硬碟、Google相簿儲存空間','15 GB','400 GB','5 TB','20 TB','30 TB'],
 ['Gemini用量限制','標準限制','標準限制的 2 倍額度','標準限制的 4 倍額度','Pro 方案的 5 倍','Pro 方案的 20 倍'],
 ['可用模型','3.5 Flash-Lite','3.6 Flash、3.1 Pro','3.8 Flash、3.1 Pro','3.8 Flash、3.1 Pro','3.8 Flash、3.1 Pro']
];
const quote=(s,delimiter)=>/[\n\r"]/.test(s)||s.includes(delimiter)||s===''?'"'+s.replace(/"/g,'""')+'"':s;
const serialize=(rows,delimiter='\t')=>rows.map(r=>r.map(s=>quote(s,delimiter)).join(delimiter)).join('\n');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const html=rows=>'<table>'+rows.map(r=>'<tr>'+r.map(s=>'<td>'+esc(s).replace(/\n/g,'<br>')+'</td>').join('')+'</tr>').join('')+'</table>';
const markdown=rows=>[rows[0],rows[0].map(()=>'---'),...rows.slice(1)].map(r=>'| '+r.map(s=>s.replace(/\\/g,'\\\\').replace(/\|/g,'\\|')).join(' | ')+' |').join('\n');
async function main(){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|scrollTo/.test(e.message))errors.push(e.message);});
 class Resources extends ResourceLoader{fetch(url){const p=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(p)?Promise.resolve(fs.readFileSync(p)):null;}}
 const source=fs.readFileSync(path.join(ROOT,process.env.STUDIO_HTML||'studio.html'),'utf8').replace('function buildTableUI(){','window.__dataTestEval=code=>eval(code);function buildTableUI(){');
 const beforeParse=w=>{w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*50})});w.scrollTo=()=>{};w.confirm=()=>true;};
 const dom=new JSDOM(source,{url:'http://data.test/studio.html',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse});
 const w=dom.window,d=w.document,sleep=ms=>new Promise(r=>setTimeout(r,ms)),$=s=>{const e=d.querySelector(s);assert(e,'Missing '+s);return e;},click=s=>$(s).click(),state=()=>JSON.parse(w.localStorage.getItem('ppt-studio-table')),key=(el,k,p={})=>el.dispatchEvent(new w.KeyboardEvent('keydown',{bubbles:true,cancelable:true,key:k,...p}));
 const evalApp=s=>w.__dataTestEval(s),shown=()=>[...d.querySelectorAll('#tRawPaste tr')].map(tr=>[...tr.cells].map(td=>td.textContent));
 const paste=(text,markup='',target=$('#tRawPaste'))=>{const e=new w.Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(e,'clipboardData',{value:{getData:k=>k==='text/html'?markup:text}});target.dispatchEvent(e);assert(e.defaultPrevented);};
 const copy=()=>{const values={},e=new w.Event('copy',{bubbles:true,cancelable:true});Object.defineProperty(e,'clipboardData',{value:{setData:(k,v)=>values[k]=v}});$('#tRawPaste').dispatchEvent(e);assert(e.defaultPrevented);return values;};
 let passed=0;const test=async(name,fn)=>{await fn();passed++;console.log('PASS '+name);};
 try{await new Promise(r=>w.addEventListener('load',r));await sleep(100);click('#tabs [data-tab="table"]');await sleep(100);evalApp('saveT();pushHist(true)');
 await test('Data is a visible focusable readonly HTML table, without a draft input or editing toolbar',()=>{
  const area=$('#tRawPaste');assert.equal(area.tagName,'DIV');assert.equal(area.tabIndex,0);assert.equal(area.getAttribute('role'),'region');assert.equal(area.getAttribute('aria-describedby'),'tRawPasteHelp tRawPasteNotice');assert(area.querySelector('table'));assert(!$('#tDrop').querySelector('input,textarea,button,select,[contenteditable]'));assert.equal(w.getComputedStyle(area).overflow,'auto');assert.equal(w.getComputedStyle(area.querySelector('td')).whiteSpace,'pre-wrap');area.querySelector('td').click();assert.strictEqual(d.activeElement,area);assert.equal(w.getComputedStyle(area).outline,'2px solid #2563EB');
 });
 await test('Exact user TSV fixture retains all 36 cells, ordinary spaces and comma amounts',()=>{
  $('#tDelimiter').value='comma';paste(serialize(fixture));$('#tDelimiter').value='auto';assert.deepEqual(state().rows,fixture);assert.deepEqual(shown(),fixture);assert.equal($('#tRawPasteLabel').textContent,'目前資料 · 6 列 × 6 欄');assert.equal($('#tRawPaste').querySelectorAll('td').length,36);
 });
 await test('CSV and bounded Markdown render the same exact 6 × 6 matrix',()=>{
  paste(serialize(fixture,','));assert.deepEqual(shown(),fixture);assert.deepEqual(state().rows,fixture);
  paste(markdown(fixture));assert.deepEqual(shown(),fixture);assert.deepEqual(state().rows,fixture);
 });
 await test('Excel HTML wins over conflicting text values and dimensions without numeric conversion',()=>{
  const exact=[['Identifier','Big integer','Amount','Description'],['00123','12345678901234567890','NT$3,300','first\nsecond']];
  paste('Identifier\tBig integer\tAmount\tDescription\n123\t12345678901234568000\t3300\tflattened',html(exact));assert.deepEqual(state().rows,exact);assert.deepEqual(shown(),exact);
  paste('wrong\tshape',html(fixture));assert.deepEqual(state().rows,fixture);assert.deepEqual(shown(),fixture);
 });
 await test('HTML block/inline boundaries preserve multiline cell text without added terminal newlines',()=>{
  paste('ignored\ttext','<table><tr><td>A</td><td><div>first</div>second</td><td><p>first</p><p>second</p>tail</td><td>start<div><div>nested</div>block</div>end</td><td>first<br>second<br></td></tr></table>');assert.deepEqual(state().rows,[['A','first\nsecond','first\nsecond\ntail','start\nnested\nblock\nend','first\nsecond\n']]);assert.deepEqual(shown(),state().rows);
 });
 await test('HTML without a table falls back to text; merged HTML is rejected instead of silently falling back',()=>{
  paste(serialize(fixture),'<p>Copied as plain text</p>');assert.deepEqual(state().rows,fixture);
  const before=JSON.stringify(state());paste('A\tB\n1\t2','<table><tr><td colspan="2">Merged</td></tr></table>');assert.equal(JSON.stringify(state()),before);assert($('#tRawPasteNotice').textContent.includes('合併'));assert(!$('#tRawPasteNotice').hidden);
 });
 await test('Multiple or nested HTML tables are rejected atomically instead of dropping cells or falling back',()=>{
  const before=JSON.stringify(state()),shownBefore=shown();for(const markup of [html([['A','B']])+html([['C','D']]),'<table><tr><td>A</td><td><table><tr><td>nested</td></tr></table></td></tr></table>']){paste('Valid\tTSV\n00123\t9007199254740993',markup);assert.equal(JSON.stringify(state()),before);assert.deepEqual(shown(),shownBefore);assert($('#tRawPasteNotice').textContent.includes('多個或巢狀'));}
 });
 await test('Literal text, whitespace, quotes, blank interior rows and multiline cells round trip exactly',()=>{
  const exact=[['Key','Value','Detail'],['00123','9007199254740993',' first\nsecond '],['','',''],['A','NT$6,500','say "yes"'],['B','  spaced  ','one\ttwo']];
  paste(serialize(exact));assert.deepEqual(state().rows,exact);assert.deepEqual(shown(),exact);const copied=copy();assert.equal(copied['text/plain'],serialize(exact));paste(copied['text/plain'],copied['text/html']);assert.deepEqual(state().rows,exact);assert.deepEqual(shown(),exact);
 });
 await test('Markdown requires a separator, keeps inline markup literal, and supports escaped pipes',()=>{
  const exact=[['Name','Notes'],['Google AI Pro','**not formatting**'],['A | B','C:\\Docs']];paste(markdown(exact));assert.deepEqual(state().rows,exact);
  const raw=JSON.stringify(state());paste('Google AI Pro is one string');assert.equal(JSON.stringify(state()),raw);
  paste('Heading words\nGoogle AI Pro');assert.deepEqual(state().rows,[['Heading words'],['Google AI Pro']]);
  const before=JSON.stringify(state());paste('Name | Notes\n--- | ---\nOnly one cell');assert($('#tRawPasteNotice').textContent.includes('Markdown'));assert.equal(JSON.stringify(state()),before);
 });
 await test('Rejected malformed CSV/Markdown does not replace the current matrix or hide its error',()=>{
  paste(serialize(fixture));const before=JSON.stringify(state()),grid=$('#tRawPaste table');paste('Header\t"unfinished');assert.equal(JSON.stringify(state()),before);assert.strictEqual($('#tRawPaste table'),grid);assert($('#tRawPasteNotice').textContent.includes('引號'));
  paste('| Name | Value |\n| --- | --- |\n| too | many | columns |');assert.equal(JSON.stringify(state()),before);assert($('#tRawPasteNotice').textContent.includes('Markdown'));
 });
 await test('Payload-like cell strings are text only and HTML scripts never enter the visible grid',()=>{
  const exact=[['Name','Value'],['<img src=x onerror=window.__xss=1>','<script>window.__xss=2</script>'],['& < > "','00123']];paste(serialize(exact));assert.deepEqual(shown(),exact);assert(!$('#tRawPaste').querySelector('img,script,iframe'));assert.equal(w.__xss,undefined);const copied=copy();assert(copied['text/html'].includes('&lt;img'));paste('',html(exact));assert.deepEqual(shown(),exact);assert.equal(w.__xss,undefined);
  paste('','<table><tr><td>Key</td><td>Value</td></tr><tr><td>A<script>window.__xss=3</script></td><td>safe<style>body{display:none}</style></td></tr></table>');assert.deepEqual(shown(),[['Key','Value'],['A','safe']]);assert.equal(w.__xss,undefined);
 });
 await test('Keyboard copy/select-all and cancelled typing keep canonical state and visible focus unchanged',()=>{
  paste(serialize(fixture));const area=$('#tRawPaste');area.focus();const raw=JSON.stringify(state());key(area,'a',{ctrlKey:true});assert(w.getSelection().toString().includes('Google AI Ultra 20x'));assert.equal(copy()['text/plain'],serialize(fixture));const e=new w.InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'insertText',data:'x'});area.dispatchEvent(e);assert(e.defaultPrevented);key(area,'Backspace');key(area,'/');assert.equal(evalApp('S.tab'),'table');assert.equal(JSON.stringify(state()),raw);assert.strictEqual(d.activeElement,area);
 });
 await test('Inline commit, undo/redo and unrelated redraws share one raw matrix without losing focus or scroll',async()=>{
  paste('Key\tValue\nA\t00123');evalApp('pushHist(true)');const target=$('#tPrev .tc[data-r="1"][data-c="1"]');target.dispatchEvent(new w.MouseEvent('dblclick',{bubbles:true,cancelable:true}));$('.trange-editor').value='9007199254740993\nnext';key($('.trange-editor'),'Enter');assert.deepEqual(shown(),state().rows);assert.equal(shown()[1][1],'9007199254740993\nnext');click('.tinsTabs [data-t="data"]');const area=$('#tRawPaste');area.focus();key(area,'z',{ctrlKey:true});await sleep(80);assert.equal(shown()[1][1],'00123');key(area,'z',{metaKey:true,shiftKey:true});await sleep(80);assert.equal(shown()[1][1],'9007199254740993\nnext');area.scrollLeft=90;area.scrollTop=30;const table=area.querySelector('table');evalApp('renderTable(true)');assert.strictEqual(table,area.querySelector('table'));assert.equal(area.scrollLeft,90);assert.equal(area.scrollTop,30);assert.strictEqual(d.activeElement,area);
 });
 await test('Mobile paste keeps the focused Data surface open instead of creating invisible focus',()=>{
  const media=w.matchMedia;try{w.matchMedia=q=>({matches:/max-width:(820|900)px/.test(q),media:q,addListener(){},addEventListener(){}});evalApp("showSec('data')");$('#tRawPaste').focus();paste(serialize(fixture));assert($('#tIns').classList.contains('open'));assert.strictEqual(d.activeElement,$('#tRawPaste'));assert.equal(w.getComputedStyle($('.tsec[data-sec="data"]')).display,'block');}finally{w.matchMedia=media;}
 });
 await test('Source model and native editable PPTX retain the pasted fixture and exact numeric-looking values',async()=>{
  const rows=[...fixture,['Raw identifiers','00123','12345678901234567890','9007199254740993','first\nsecond','1.123456789']];paste(serialize(rows));const table=state(),model=D.buildModel(D.PRESETS[0],{table});assert.deepEqual(D.tableSource(table).rawRows,rows);assert.deepEqual(model.slides[0].table.rawRows,rows);
  const matrix=m=>m.slides.flatMap(s=>s.items.filter(i=>i.t==='tbl').flatMap(i=>i.cells.map(r=>r.map(c=>c.runs.map(x=>x.t+(x.o?.br?'\n':'')).join('')))));
  const rendered=matrix(model);assert.deepEqual(rendered.map(r=>r.map(v=>v.replace(/\n/g,''))),rows.map(r=>r.map(v=>v.replace(/\n/g,''))));assert.equal(rendered[6][4],'first\nsecond');
  const nativeRows=async m=>{const out=await D.exportPptx({PptxGenJS,JSZip},D.PRESETS[0],{model:m,type:'nodebuffer'}),zip=await JSZip.loadAsync(out.data),xml=await zip.file('ppt/slides/slide1.xml').async('string');const doc=new w.DOMParser().parseFromString(xml,'text/xml'),tables=[...doc.getElementsByTagName('a:tbl')];assert.equal(tables.length,1);return [...tables[0].getElementsByTagName('a:tr')].map(tr=>[...tr.children].filter(x=>x.nodeName==='a:tc').map(tc=>[...tc.getElementsByTagName('a:p')].map(p=>[...p.childNodes].map(n=>n.nodeName==='a:br'?'\n':[...n.getElementsByTagName?.('a:t')||[]].map(x=>x.textContent).join('')).join('')).join('\n')));};
  // Default display may add layout line breaks, but neither characters nor raw
  // data change. A wide layout also verifies exact cells without added wrapping.
  assert.deepEqual(await nativeRows(model),rendered);const wide=D.buildModel(D.PRESETS[0],{table:{...table,cw:Array(6).fill(7)}});assert.deepEqual(matrix(wide),rows);assert.deepEqual(await nativeRows(wide),rows);
 });
 await test('Fresh reload restores the full grid from canonical persisted values',async()=>{
  const saved=JSON.stringify(state()),fresh=new JSDOM(source,{url:'http://data-reload.test/studio.html',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse:v=>{beforeParse(v);v.localStorage.setItem('ppt-studio-table',saved);}});try{await new Promise(r=>fresh.window.addEventListener('load',r));await sleep(80);fresh.window.document.querySelector('#tabs [data-tab="table"]').click();await sleep(80);assert.deepEqual([...fresh.window.document.querySelectorAll('#tRawPaste tr')].map(tr=>[...tr.cells].map(td=>td.textContent)),JSON.parse(saved).rows);}finally{fresh.window.close();}
 });
 assert.deepEqual(errors,[]);console.log(`${passed} Data grid / paste / export checks passed (${process.env.STUDIO_HTML||'studio.html'}).`);
 }finally{dom.window.close();}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
