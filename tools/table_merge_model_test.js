'use strict';
// Narrow merged-table regression: source safety, shared geometry and native spans.
// This does not claim PowerPoint UI/editability verification; the fixture is for COM review.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../deck.js'),PptxGenJS=require('pptxgenjs'),JSZip=require('jszip'),{JSDOM}=require('jsdom');
const clone=x=>JSON.parse(JSON.stringify(x));let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
const source=()=>({rows:[[' A ','001','0','R'],['','多行\n第二行','乙','S'],['丙','丁','','T'],['尾','U','V','W']],header:false,hcol:false,his:[],rules:[],bold:[],types:{},formats:{},sizingFont:{bodyPt:13,headerPt:11,scale:1,autoBoost:1}});
const params=width=>({...D.PRESETS[0],tbSizingVersion:2,tbWidthMode:width,tbHeightMode:'optimal',tbHeaderStyle:'primary',tbGrid:'all'});
const model=(t,width='auto')=>D.buildModel(params(width),{table:t});
const table=m=>m.slides[0].items.find(x=>x.t==='tbl');
async function native(m){const pptx=new PptxGenJS();D.toPptx(pptx,m);const z=await JSZip.loadAsync(await pptx.write({outputType:'nodebuffer'}));await D.patchZip(z,m);return{zip:z,xml:await z.file('ppt/slides/slide1.xml').async('string')};}
function fixture(){let t={...source(),title:'原生合併儲存格 · 局部驗收',header:true,hcol:true,rows:[['合併表頭','','','狀態'],['縱向保留 A','區塊 001','0','正常'],['縱向保留 B','多行\n第二行','乙','待確認'],['縱向保留 C','一般欄','完整文字','右側'],['全寬跨列長中文說明，原始文字逐格保留。','第二項','第三項','第四項'],['空間','','',''],['尾列','Google Gmail','15GB','完成']]};
 for(const q of [{r0:0,c0:0,r1:0,c1:2},{r0:1,c0:0,r1:3,c1:0},{r0:1,c0:1,r1:2,c1:2},{r0:4,c0:0,r1:5,c1:3}])t=D.tableMerge(t,q);return t;}
async function run(){
 await test('horizontal, vertical and rectangular merge/unmerge preserve every original value',()=>{
  for(const q of [{r0:0,c0:0,r1:0,c1:2},{r0:0,c0:0,r1:2,c1:0},{r0:0,c0:0,r1:1,c1:1}]){const t=source(),before=JSON.stringify(t),merged=D.tableMerge(t,q);assert.deepEqual(merged.rows,t.rows);assert.equal(JSON.stringify(t),before);const values=[];for(let r=q.r0;r<=q.r1;r++)for(let c=q.c0;c<=q.c1;c++)values.push(t.rows[r][c]);assert.equal(D.tableCellAt(merged,q.r0,q.c0).text,values.join('\n'));assert.deepEqual(D.tableUnmerge(merged,q).rows,t.rows);assert.deepEqual(D.tableUnmerge(clone(merged),q).merges,[]);}
 });
 await test('edited merge splits without silently losing new or old text; snapshots are immutable',()=>{
  const t=source(),q={r0:0,c0:0,r1:1,c1:1},merged=D.tableMerge(t,q),before=JSON.stringify(merged),edited=D.tableEditCell(merged,1,1,'新文字');assert.equal(JSON.stringify(merged),before);assert.deepEqual(edited.rows,t.rows);const restored=D.tableUnmerge(clone(edited),{r0:1,c0:1,r1:1,c1:1});assert.equal(restored.rows[0][0],'新文字\n A ');assert.equal(restored.rows[0][1],'001');assert.equal(restored.rows[1][1],'多行\n第二行');assert.match(restored.mergeNotice,/保留/);assert.equal(clone(merged).merges[0].text,merged.merges[0].text);
 });
 await test('invalid, overlapping and partial operations reject atomically',()=>{
  const t=D.tableMerge(source(),{r0:0,c0:0,r1:1,c1:1}),before=JSON.stringify(t);for(const fn of [()=>D.tableMerge(t,{r0:0,c0:1,r1:2,c1:2}),()=>D.tableUnmerge(t,{r0:0,c0:0,r1:0,c1:1}),()=>D.tableMerge(t,{r0:0,c0:0,r1:9,c1:1}),()=>D.tablePasteCells(t,[['x']],1,1),()=>D.tableFromPaste([['x']],t,'update')])assert.throws(fn,/合併|範圍/);assert.equal(JSON.stringify(t),before);const next=D.tablePasteCells(t,[['new','0']],3,2);assert.equal(next.rows[3][2],'new');assert.equal(next.rows[3][3],'0');assert.deepEqual(next.merges,t.merges);
 });
 await test('HTML mixed spans preserve right/bottom placement and unchanged split; malformed spans reject',()=>{
  const parsed=D.tableParseHtmlCells([[{text:'左',rowSpan:2},{text:'橫',colSpan:2},{text:'右'}],[{text:'B'},{text:'C'},{text:'D'}],[{text:'末',colSpan:4}]]);
  assert.deepEqual(parsed.rows,[['左','橫','','右'],['','B','C','D'],['末','','','']]);assert.equal(parsed.merges.length,3);const t=D.tableFromPaste(parsed,source(),'new');assert.deepEqual(t.rows,parsed.rows);assert.equal(D.tableCellAt(t,0,0).text,'左');assert.deepEqual(D.tableUnmerge(t,{r0:0,c0:0,r1:2,c1:3}).rows,parsed.rows);
  for(const cells of [[[{text:'bad',rowSpan:3}],[]],[[{text:'x',colSpan:0}]],[[{text:'a'},{text:'b'}],[{text:'c'}]],[[{text:'a'},{text:'b',rowSpan:2}],[{text:'overlap',colSpan:2}]]])assert.throws(()=>D.tableParseHtmlCells(cells),/HTML/);
  const plain=D.tableFromPaste([['001','0'],[' a ','b\nc']],source(),'new');assert.deepEqual(plain.rows,[['001','0'],[' a ','b\nc']]);assert.deepEqual(plain.merges,[]);
 });
 await test('row/column changes shift or expand merges; populated deletion safely refuses',()=>{
  const t=D.tableMerge(source(),{r0:1,c0:1,r1:2,c1:2}),before=JSON.stringify(t);for(const axis of ['row','col']){const inserted=D.tableShiftStructure(t,axis,2,false),m=inserted.merges[0];assert.equal(axis==='row'?m.r1:m.c1,3);const back=D.tableShiftStructure(inserted,axis,2,true);assert.deepEqual(back.rows,t.rows);assert.deepEqual(back.merges,t.merges);const shifted=D.tableShiftStructure(t,axis,0,false);assert.equal(axis==='row'?shifted.merges[0].r0:shifted.merges[0].c0,2);assert.throws(()=>D.tableShiftStructure(t,axis,1,true),/取消合併/);}assert.equal(JSON.stringify(t),before);
  const empty=D.tableParseHtmlCells([[{text:'keep',colSpan:2}]]),one=D.tableShiftStructure(empty,'col',1,true);assert.deepEqual(one.rows,[['keep']]);assert.deepEqual(one.merges,[]);
 });
 await test('auto/45 shared model uses summed span geometry, anchor header role, and keeps raw source',()=>{
  for(const mode of ['none','row','col','both']){let t=D.tableSetHeaderMode(fixture(),mode),before=JSON.stringify(t);for(const width of ['auto','45']){const m=model(t,width),tb=table(m);D.assertTableExportComplete(m);assert.equal(JSON.stringify(t),before);assert.deepEqual(m.slides[0].table.rawRows,t.rows);assert.equal(tb.cells[1][1].colSpan,2);assert.equal(tb.cells[1][1].rowSpan,2);assert(tb.cells[2][2].covered);assert.equal(tb.cells[2][2].runs.map(r=>r.t).join(''),'');if(width==='45')assert(Math.abs(tb.w-D.W*.45)<1e-7);assert.equal(tb.cells[1][0].fill,mode==='col'||mode==='both'?D.PRESETS[0].P:null);const html=D.tableHtml(m),doc=new JSDOM(html).window.document;assert.equal(doc.querySelector('[rowspan="3"]').textContent.replace(/\s/g,''),'縱向保留A縱向保留B縱向保留C');assert.equal(doc.querySelectorAll('td,th').length,14);const svg=D.toSvg(m.slides[0]);assert(svg.includes('區塊'));assert(!svg.includes('NaN'));}}
 });
 await test('long Chinese merged text spans full width and enough row height without source rewriting',()=>{
  const t=D.tableMerge({rows:[['長中文合併說明保留原文以及換行，Google Gmail 不拆散，下一段內容繼續。','001','0'],['下一列資料','',''],['footer','x','y']],header:false,sizingFont:{bodyPt:13,headerPt:11,scale:1,autoBoost:1}},{r0:0,c0:0,r1:1,c1:2});const m=model(t,'45'),tb=table(m),c=tb.cells[0][0];D.assertTableExportComplete(m);const text=c.runs.map(r=>r.t).join('');assert(text.includes('Gmail'));assert(tb.rowH[0]+tb.rowH[1]>=text.split('\n').length*c.size*1.45/72);const edited=clone(m);table(edited).cells[0][0].rowSpan=1;assert.throws(()=>D.assertTableExportComplete(edited),/資料不完整/);
 });
 await test('native merge XML keeps exact grid and texts on repeated exports, including all-covered row',async()=>{
  const t=fixture(),before=JSON.stringify(t),m=model(t,'45'),cells=JSON.stringify(table(m)),a=await native(m),b=await native(m);assert.equal(JSON.stringify(t),before);assert.equal(JSON.stringify(table(m)),cells);assert.equal(a.xml,b.xml);const doc=new JSDOM(a.xml,{contentType:'text/xml'}).window.document,tbl=doc.getElementsByTagName('a:tbl')[0];assert(tbl);assert.equal(doc.getElementsByTagName('p:pic').length,0);assert.equal(tbl.getElementsByTagName('a:gridCol').length,4);const trs=[...tbl.getElementsByTagName('a:tr')];assert.equal(trs.length,7);trs.forEach(tr=>assert.equal(tr.getElementsByTagName('a:tc').length,4));assert.equal(tbl.querySelectorAll('[rowSpan="3"]').length,1);assert(tbl.querySelector('[gridSpan="4"][rowSpan="2"]'));assert.equal(trs[5].querySelectorAll('[vMerge="1"]').length,4);assert(a.xml.includes('001'));assert(a.xml.includes('第二行'));assert.equal(tbl.querySelector('[firstRow]').getAttribute('firstCol'),'1');
  const checked=require('../preflight.js').check(m);assert.equal(checked.errors,0,JSON.stringify(checked.issues));const changed=clone(m);changed.slides[0].table.rawRows[1][1]='changed';assert.equal(require('../preflight.js').check(changed).status,'blocked');const corrupted=clone(m),cb=table(corrupted);cb.cells[1][1].runs[0].t='lost';cb.dataIntegrity.displayRows[1][1]=corrupted.slides[0].table.displayRows[1][1]='lost';assert.throws(()=>D.assertTableExportComplete(corrupted),/資料不完整/);
 const out=process.argv.find(a=>a.startsWith('--fixture='));if(out){const dest=path.resolve(out.slice(10));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,await a.zip.generateAsync({type:'nodebuffer'}));fs.writeFileSync(dest.replace(/\.pptx$/i,'.svg'),D.toSvg(m.slides[0]));fs.writeFileSync(dest.replace(/\.pptx$/i,'.json'),JSON.stringify({source:t,meta:m.slides[0].table},null,2));console.log('FIXTURE '+dest);}
 });
 console.log(`${passed} merged-table groups passed`);
}
run().catch(e=>{console.error(e);process.exitCode=1;});
