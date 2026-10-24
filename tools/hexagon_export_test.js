/* Native PowerPoint regression: an explicit hexagon adj guide caused repair to
 * remove 18 of 24 base groups. The same file with six empty hexagon avLst nodes
 * was confirmed usable in PowerPoint. Schema validation alone did not catch it.
 */
'use strict';
const assert=require('assert/strict'),D=require('../deck');
const PptxGenJS=require('pptxgenjs'),JSZip=require('jszip');
let passed=0;
const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
async function exportXml(model,env={PptxGenJS,JSZip}){
 const before=JSON.stringify(model),r=await D.exportPptx(env,model.params,{model,type:'nodebuffer'});
 // Export records diagnostics, but must not mutate geometry or grouping.
 const stable=m=>JSON.stringify({slides:m.slides,params:m.params});
 assert.equal(stable(model),stable(JSON.parse(before)));
 const z=await JSZip.loadAsync(r.data),xml=[];
 for(let i=1;i<=model.slides.length;i++)xml.push(await z.file(`ppt/slides/slide${i}.xml`).async('string'));
 assert(!Object.keys(z.files).some(n=>n.startsWith('ppt/media/')));
 return xml;
}
function hexagons(xml){return [...xml.matchAll(/<a:prstGeom prst="hexagon">([\s\S]*?)<\/a:prstGeom>/g)];}
function assertDefaultHexagons(xml,count){
 const hs=hexagons(xml);assert.equal(hs.length,count);
 hs.forEach(h=>assert.match(h[1],/^<a:avLst(?:\/>|><\/a:avLst>)$/));
}
(async()=>{
 for(const p of D.PRESETS)for(const size of ['S','M','L']){
  const m=D.iconPackModel({...p,size},'groups'),xml=await exportXml(m);
  check(`${p.id}/${size}: native defaults preserve 24 bases, 9 patterns and 40 department glyphs`,()=>{
   assertDefaultHexagons(xml[0],6);assertDefaultHexagons(xml[1],0);
   assert.deepEqual(xml.map(x=>(x.match(/<p:grpSp>/g)||[]).length),[24,9]);
   assert.deepEqual(xml.map(x=>(x.match(/<a:custGeom>/g)||[]).length),[24,16]);
   assert.deepEqual(xml.map(x=>(x.match(/name="圖示 部門"/g)||[]).length),[24,16]);
   assert(xml[0].includes('>01 / 02<')&&xml[1].includes('>02 / 02<'));
  });
 }
 // Shared native export must also cover catalog/element/tray hexagons, not only
 // a download handler or the six default icon-pack positions.
 const p=D.PRESETS[0];
 for(const [name,m] of [
  ['A14 catalog',D.buildModel(p,{only:['iconvariants']})],
  ['individual A14 element',D.elementModel(p,'iconvariants',3)],
  ['saved A14 tray element',D.trayModel([{kind:'el',params:p,key:'iconvariants',gi:3,name:'只有線框・警示'}])]
 ]){
  const xml=await exportXml(m);
  check(`${name}: shared native export retains the iconBase flag and default hexagon guides`,()=>{
   m.slides.forEach((s,i)=>{const hs=s.items.filter(it=>it.kind==='hexagon');assert(hs.length>0);assert(hs.every(it=>it.iconBase));assertDefaultHexagons(xml[i],hs.length);});
  });
 }
 const opts=[];class Recorder extends PptxGenJS{addSlide(){const s=super.addSlide(),add=s.addText;s.addText=function(text,o){opts.push(o);return add.call(this,text,o);};return s;}}
 const sample={params:p,slides:[{key:'adjustment-regression',no:1,title:'Adjustments',groups:[],items:[
  {t:'shape',kind:'hexagon',iconBase:{},x:1,y:1,w:1,h:1,adj:.24,fill:'FFFFFF',line:'123456',lw:1},
  {t:'shape',kind:'roundRect',x:3,y:1,w:1,h:1,adj:.18,fill:'FFFFFF',line:'123456',lw:1},
  {t:'shape',kind:'chevron',x:5,y:1,w:1,h:1,adj:.2,fill:'FFFFFF',line:'123456',lw:1},
  {t:'shape',kind:'hexagon',x:7,y:1,w:1,h:1,adj:.28,fill:'FFFFFF',line:'123456',lw:1}
 ]}]};
 const sx=(await exportXml(sample,{PptxGenJS:Recorder,JSZip}))[0];
 check('Only icon-base hexagons omit rectRadius; unrelated shape adjustments remain unchanged',()=>{
  assert.equal(opts[0].rectRadius,undefined);assert.equal(opts[1].rectRadius,.18);assert.equal(opts[2].rectRadius,.2);
  assert.equal(opts[3].rectRadius,.28);const hs=hexagons(sx);assert.equal(hs.length,2);assert.match(hs[0][1],/^<a:avLst(?:\/>|><\/a:avLst>)$/);assert.match(hs[1][1],/fmla="val 28000"/);
  assert.match(sx,/<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 18000"\/>/);
  assert.match(sx,/<a:prstGeom prst="chevron"><a:avLst><a:gd name="adj" fmla="val 20000"\/>/);
 });
 console.log(`${passed} hexagon-export checks passed (native serialization regression, not a substitute for PowerPoint).`);
})().catch(e=>{console.error(e);process.exitCode=1;});
