/* Total-row separator only: shared paint, HTML/SVG and native table borders. */
'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),D=require('../deck'),Z=require('jszip'),Pptx=require('pptxgenjs'),{JSDOM}=require('jsdom');
const p={...D.PRESETS[0],tbSizingVersion:2,tbWidthMode:'auto',tbHeightMode:'optimal',tbCardOn:true,tbHeaderStyle:'primary',tbStripes:false,tbGrid:'horizontal'};
const seed=()=>({rows:[['A','1','2'],['B','3','4'],['C','5','6'],['Total','9','12']],header:false,hcol:true,lastTotal:true,his:[],rules:[],bold:[],sizingFont:{bodyPt:13,headerPt:11,scale:1,autoBoost:1}});
const build=t=>D.buildModel(p,{table:t}),tb=m=>m.slides[0].items.find(i=>i.t==='tbl'),doc=s=>new JSDOM(s,{contentType:'application/xml'}).window.document;
async function native(m){const pptx=new Pptx();D.toPptx(pptx,m);const z=await Z.loadAsync(await pptx.write({outputType:'nodebuffer'}));await D.patchZip(z,m);return{z,xml:await z.file('ppt/slides/slide1.xml').async('string')};}
(async()=>{
 const source=seed(),raw=JSON.stringify(source),m=build(source),table=tb(m),paint=D.tableResolvedBorders(table);
 D.assertTableExportComplete(m);assert.equal(JSON.stringify(source),raw);
 paint[3].forEach((c,k)=>{assert(c.bold);assert(c.bT.w>=1);assert(c.bT.w>paint[1][k].bB.w);assert.deepEqual(c.bT,paint[2][k].bB);assert(D.contrastOf(c.bT.c,c.fill||'FFFFFF')>=3);assert(!c.bL&&!c.bR);});
 assert.equal(paint[1][1].bT,null);assert.equal(paint[1][1].bB.c,'D9D9D9');
 const html=new JSDOM(D.tableHtml(m)).window.document;
 [...html.querySelectorAll('tr')][3].querySelectorAll('th,td').forEach(c=>assert(parseFloat(c.style.borderTopWidth)>=1));
 const svg=doc(D.toSvg(m.slides[0]));assert([...svg.querySelectorAll('[stroke]')].some(n=>parseFloat(n.getAttribute('stroke-width'))>=1&&n.getAttribute('stroke').toUpperCase()==='#'+paint[3][1].bT.c.toUpperCase()));
 const a=await native(m),xd=doc(a.xml),rows=[...xd.getElementsByTagName('a:tr')];
 [...rows[3].getElementsByTagName('a:tc')].forEach(c=>assert(+c.getElementsByTagName('a:lnT')[0].getAttribute('w')>=12700));
 [...rows[2].getElementsByTagName('a:tc')].forEach((c,i)=>{const above=c.getElementsByTagName('a:lnB')[0],below=rows[3].getElementsByTagName('a:tc')[i].getElementsByTagName('a:lnT')[0];assert.equal(above.getAttribute('w'),below.getAttribute('w'));assert.equal(above.textContent,below.textContent);assert.equal(above.getElementsByTagName('a:srgbClr')[0].getAttribute('val'),below.getElementsByTagName('a:srgbClr')[0].getAttribute('val'));});
 assert.equal(xd.getElementsByTagName('a:tbl').length,1);
 console.log('PASS total separator survives grid in shared model, HTML, SVG and native PPTX; first-column contrast and ordinary grid preserved');
 const consecutive=seed();consecutive.bold=[2];assert(tb(build(consecutive)).cells[3][1].bT.w>=1);
 const off=seed();off.lastTotal=false;assert.equal(tb(build(off)).cells[3][1].bT,null);
 console.log('PASS explicit total rule survives previous bold row; unchecked total does not add a separator');
 for(const range of [{r0:3,c0:1,r1:3,c1:2},{r0:1,c0:0,r1:3,c1:0}]){
  const merged=D.tableMerge(seed(),range),mm=build(merged),tt=tb(mm),resolved=D.tableResolvedBorders(tt);D.assertTableExportComplete(mm);
  const anchor=resolved[range.r0][range.c0];assert.deepEqual(anchor.bB,table.cells[range.r1][range.c0].bB);assert(!anchor.bL&&!anchor.bR);
  if(range.r0===3)assert(anchor.bT.w>=1);else assert.equal(anchor.bT,null,'Do not draw total line through a vertical merge');
  const out=await native(mm),xml=doc(out.xml);assert.equal(xml.getElementsByTagName('a:gridCol').length,3);assert.equal(xml.getElementsByTagName('a:tr').length,4);assert(out.xml.includes(range.r0===3?'gridSpan="2"':'rowSpan="3"'));
 }
 console.log('PASS horizontal total merge and vertical header merge keep native spans and outer borders');
 let marked=seed();marked={...marked,...D.tableApplyRange(marked,{r0:3,c0:1,r1:3,c1:1},'v2-red-soft','outline')};marked.his.find(h=>h.type==='range').borderWidth=3;
 const manual=D.tableResolvedBorders(tb(build(marked)));assert.equal(manual[3][1].bT.w,3);assert.deepEqual(manual[2][1].bB,manual[3][1].bT);assert.notEqual(manual[3][1].bT.c,paint[3][1].bT.c);
 console.log('PASS explicit manual outline retains priority over semantic total separator');
 const dir=process.argv[2];if(dir){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'total-row.pptx'),await a.z.generateAsync({type:'nodebuffer'}));fs.writeFileSync(path.join(dir,'total-row.svg'),D.toSvg(m.slides[0]));}
 console.log('4 total-line groups passed');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
