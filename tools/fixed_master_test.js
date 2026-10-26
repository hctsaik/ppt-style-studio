'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const F=require('../fixed-master.js'),DATA=require('../fixed-master-data.js'),Z=require('../jszip.min.js');
const ns={p:'http://schemas.openxmlformats.org/presentationml/2006/main',a:'http://schemas.openxmlformats.org/drawingml/2006/main',r:'http://schemas.openxmlformats.org/officeDocument/2006/relationships'};
const dom=new JSDOM(),parse=s=>{const d=new dom.window.DOMParser().parseFromString(s,'application/xml');assert.equal(d.getElementsByTagName('parsererror').length,0);return d;},els=(d,n,k)=>[...d.getElementsByTagNameNS(ns[n],k)],hash=b=>crypto.createHash('sha256').update(b).digest('hex');
let checks=0;const check=(n,fn)=>{fn();checks++;console.log('PASS '+n);};
(async()=>{
 const raw=fs.readFileSync(path.join(__dirname,'../fixed-master/TSMC_Template.pptx')),original=await Z.loadAsync(raw);
 check('Exact source file, embedded normal/offline bytes and recorded manifest hashes',()=>{assert.equal(hash(raw),F.sourceSha256);assert.equal(hash(F.originalBytes()),F.sourceSha256);const offline=fs.readFileSync(path.join(__dirname,'../PPT-Style-Studio.html'),'utf8');assert(offline.includes(DATA.originalBase64));});
 for(const [name,expected]of Object.entries(DATA.parts))assert.equal(hash(await original.file(name).async('uint8array')),expected,name);
 check('Complete combination catalogue: 462 unique valid layout × style × marker × color records',()=>{const all=F.combinations();assert.equal(all.length,462);assert.equal(new Set(all.map(v=>JSON.stringify(v))).size,462);assert.deepEqual(F.COLORS.map(x=>x.color),['D95D68','E7BF4A','4E83CE','4B9679','7D8795','9371C6','FFFFFF']);for(const c of all){assert.deepEqual({...F.normalize(c),title:undefined,summary:undefined,focus:undefined},{version:1,...c,title:undefined,summary:undefined,focus:undefined});}assert.equal(new Set(F.PRESETS.map(p=>p.layout)).size,7);});
 check('Every combination is native and keeps exact source placeholder mapping; no preview backdrop in XML',()=>{
  for(const c of F.combinations()){
   const model=F.build(c),xml=F.slideXml(model,5),doc=parse(xml);assert.equal(els(doc,'p','pic').length,0);assert.equal(els(doc,'a','blip').length,0);assert(!xml.includes('252A34'));assert(!xml.includes('normAutofit'));
   const ids=els(doc,'p','cNvPr').map(x=>x.getAttribute('id'));assert.equal(new Set(ids).size,ids.length);
   for(const p of els(doc,'p','ph')){const source=model.sourceLayout.placeholders[p.getAttribute('idx')||'0'];assert(source);assert.equal(p.getAttribute('type')||'obj',source.type);}
   const title=els(doc,'p','sp').find(sp=>els(sp,'p','ph').some(p=>p.getAttribute('idx')==='0'));assert(title.textContent.includes(model.selection.title));assert(title.outerHTML.includes('val="C00000"'));assert(title.outerHTML.includes('sz="3200"'));
   if(['4','5','7'].includes(c.layout)){const expected=c.layout==='7'?'1':'11';assert(model.placeholders.some(x=>x.index===expected));}
   assert.equal(els(doc,'a','fld').filter(f=>f.getAttribute('type')==='slidenum').length,1);assert.equal(els(doc,'a','fld')[0].textContent,'5');assert.equal(els(doc,'a','tbl').length,c.layout==='7'?2:0);assert(els(doc,'p','grpSp').length>=1);
   if(c.marker!=='none'){assert(xml.includes('val="'+(c.marker==='marker'?'24000':'35000')+'"'));}
   const shapes=model.objects.flatMap(o=>o.items||[o]);for(const o of shapes){assert(o.x>=0&&o.y>=90&&o.x+o.w<=1280&&o.y+o.h<=692.48,JSON.stringify(o));}
  }
 });
 check('Fixed model never accepts theme input; original title/bullets are not recolored by content selection',()=>{const s={layout:'2',color:'purple',style:'solid'};const baseline=F.build(s);assert.deepEqual(F.build({...s,P:'00FF00',PD:'FFFFFF',font:'Comic Sans MS',tFont:'Arial',bFont:'Arial',accent1:'0000FF'}),baseline);const title=baseline.sourceLayout.placeholders['0'].xml;assert(title.includes('C00000'));const bullet=baseline.sourceLayout.placeholders['1'].xml;assert(bullet.includes('val="50000"'));assert(bullet.includes('val="75000"'));assert(bullet.includes('val="100000"'));assert(bullet.includes('char="●"')||bullet.includes('&#9679;'));});
 check('Text validation blocks blank and oversized input without silent mutation; XML escapes user text',()=>{const s=F.normalize({title:'A<&"B',summary:'summary',focus:'測試'});F.validate(s);assert(F.slideXml(F.build(s),5).includes('A&lt;&amp;&quot;B'));const tooLong=F.normalize({title:'長'.repeat(25)});assert.equal(tooLong.title.length,25);assert.throws(()=>F.validate(tooLong));assert.throws(()=>F.validate(F.normalize({focus:''})));});
 const immutableExcept=new Set(['[Content_Types].xml','ppt/presentation.xml','ppt/_rels/presentation.xml.rels','docProps/app.xml']);
 async function verify(values){const bytes=await F.exportPptx(Z,values),zip=await Z.loadAsync(bytes);for(const [name,expected]of Object.entries(DATA.parts))if(!immutableExcept.has(name))assert.equal(hash(await zip.file(name).async('uint8array')),expected,name);
  const present=parse(await zip.file('ppt/presentation.xml').async('string'));assert.equal(els(present,'p','sldId').length,4+values.length);assert.equal(els(present,'p','sldMasterId').length,1);assert.equal(Object.keys(zip.files).filter(n=>/^ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(n)).length,7);assert.equal(els(present,'p','sldSz')[0].getAttribute('cx'),'12192000');
  for(const name of Object.keys(zip.files).filter(n=>n.endsWith('.rels'))){const doc=parse(await zip.file(name).async('string')),rels=[...doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/package/2006/relationships','Relationship')],ids=rels.map(r=>r.getAttribute('Id'));assert.equal(new Set(ids).size,ids.length,name);for(const r of rels){if(r.getAttribute('TargetMode')==='External')continue;const t=r.getAttribute('Target'),base=path.posix.dirname(name).replace(/(?:^|\/)\_rels$/,''),resolved=t.startsWith('/')?t.slice(1):path.posix.normalize(path.posix.join(base,t));assert(zip.file(resolved),name+' => '+resolved);}}
  for(let i=5;i<=4+values.length;i++){const xml=await zip.file('ppt/slides/slide'+i+'.xml').async('string');parse(xml);assert(xml.includes('showMasterSp="1"'));assert(!xml.includes('252A34'));assert((await zip.file('ppt/slides/_rels/slide'+i+'.xml.rels').async('string')).includes('slideLayout'+F.normalize(values[i-5]).layout+'.xml'));}
  const app=parse(await zip.file('docProps/app.xml').async('string'));assert.equal(app.getElementsByTagNameNS('http://schemas.openxmlformats.org/officeDocument/2006/extended-properties','Slides')[0].textContent,String(4+values.length));return bytes;
 }
 const sample=await verify(F.PRESETS);fs.mkdirSync(path.join(__dirname,'../out/fixed-master'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../out/fixed-master/recommended.pptx'),sample);
 for(const style of F.STYLES)for(const marker of F.MARKERS)await verify(F.COLORS.map(c=>({layout:'7',style:style.key,marker:marker.key,color:c.key})));
 check('13 packages preserve every original part except four required metadata/index parts, native original four pages, all relationship targets and 1 master / 7 layouts',()=>assert(sample.length>0));
 await assert.rejects(F.exportPptx(Z,[]));await assert.rejects(F.exportPptx(Z,new Array(8).fill({})));await assert.rejects(F.exportPptx(Z,[{title:''}]));
 console.log(JSON.stringify({checks,combinations:462,nativePackages:13,originalParts:Object.keys(DATA.parts).length,PowerPointVisual:'not verified'}));
 dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1;});
