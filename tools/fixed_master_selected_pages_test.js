#!/usr/bin/env node
'use strict';
// Scoped contract: one current master, the four requested component styles,
// and the protected original master parts and five single themes. No site-wide style/export matrix.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const JSZip=require('../jszip.min'),F=require('../fixed-master'),D=require('../deck');
const {JSDOM}=require('jsdom'),parser=new (new JSDOM('').window.DOMParser)();
const A='http://schemas.openxmlformats.org/drawingml/2006/main',P='http://schemas.openxmlformats.org/presentationml/2006/main',R='http://schemas.openxmlformats.org/officeDocument/2006/relationships',PKG='http://schemas.openxmlformats.org/package/2006/relationships';
const STYLE_IDS=['navy','teal','green','frame'],KEYS=['catalog','cards','schemebody','schemeiconbody'];
const PRIMARY=['1F4E79','0F7C80','2F5D50','2F4B6E'];
const SCHEMES=[
 ['07',['5470C6','91CC75','FAC858','EE6666','73C0DE','3BA272'],'7C9CC3'],
 ['06',['1F77B4','FF7F0E','2CA02C','D62728','9467BD','8C564B'],'F9F0D4'],
 ['03',['4878D0','6ACC64','D65F5F','956CB4','D5BB67','82C6E2'],'D4E6DF'],
 ['10',['8A7CA8','E098C7','8FD3E8','71669E','CC70AF','7CB4CC'],'E5DDF1'],
 ['04',['4269D0','EFB118','FF725C','6CC5B0','3CA951','FF8AB7'],'F6D8DB']
];
const text=(z,n)=>{assert(z.file(n),'Missing '+n);return z.file(n).async('string');};
const xml=s=>{const d=parser.parseFromString(s,'application/xml');assert.equal(d.getElementsByTagName('parsererror').length,0);return d;};
const els=(d,ns,n)=>Array.from(d.getElementsByTagNameNS(ns,n));
const joined=d=>els(d,A,'t').map(n=>n.textContent).join('').replace(/\r?\n/g,'');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const relPath=n=>path.posix.join(path.posix.dirname(n),'_rels',path.posix.basename(n)+'.rels');
const resolve=(n,target)=>path.posix.normalize(target.startsWith('/')?target.slice(1):path.posix.join(path.posix.dirname(n),target));
async function rels(z,n){return els(xml(await text(z,relPath(n))),PKG,'Relationship').map(r=>({id:r.getAttribute('Id'),type:r.getAttribute('Type'),target:r.getAttribute('Target'),external:r.hasAttribute('TargetMode')}));}
async function target(z,n,type){const rs=(await rels(z,n)).filter(r=>r.type===R+'/'+type);assert.equal(rs.length,1);return resolve(n,rs[0].target);}
const expectedParts=['ppt/slides/slide1.xml',...['06','03','10','04'].map(id=>'ppt/slides/slideScheme'+id+'.xml'),...Array.from({length:19},(_,i)=>'ppt/slides/slideMaterial'+(i+6)+'.xml')];
let checks=0;
async function check(label,fn){await fn();checks++;console.log('PASS '+label);}
(async()=>{
 const data=process.env.MASTER_FIXTURE?fs.readFileSync(process.env.MASTER_FIXTURE):await F.exportPptx(JSZip,[],{PptxGenJS:require('pptxgenjs')});
 const z=await JSZip.loadAsync(data),sourceBytes=fs.readFileSync(path.join(__dirname,'../fixed-master/Fixed_Red_Template.pptx')),original=await JSZip.loadAsync(sourceBytes);
 const pres=xml(await text(z,'ppt/presentation.xml')),rs=await rels(z,'ppt/presentation.xml');
 const ordered=els(pres,P,'sldId').map(s=>resolve('ppt/presentation.xml',rs.find(r=>r.id===s.getAttributeNS(R,'id')).target));
 await check('24 pages, exact requested 4 x 4 order, manifest and page numbers',async()=>{
  assert.deepEqual(ordered,expectedParts);assert.equal(F.DOWNLOAD_PAGES.length,24);
  assert.deepEqual(F.DOWNLOAD_PAGES.slice(8).map(p=>[p.styleId,p.key]),STYLE_IDS.flatMap(id=>KEYS.map(key=>[id,key])));
  const manifest=require('../fixed-master/download-manifest.json');assert.equal(manifest.slideCount,24);assert.equal(manifest.filename,'固定紅色_24頁母片.pptx');
  assert.deepEqual(manifest.pages.slice(8).map(p=>[p.styleId,p.key]),STYLE_IDS.flatMap(id=>KEYS.map(key=>[id,key])));
  assert.match(await text(z,'docProps/app.xml'),/<(?:\w+:)?Slides>24<\/(?:\w+:)?Slides>/);
  for(let i=0;i<24;i++){const d=xml(await text(z,ordered[i])),fields=els(d,A,'fld').filter(f=>f.getAttribute('type')==='slidenum');assert.equal(fields.length,1);assert.equal(joined(fields[0]),String(i+1));}
 });
 await check('original source, master, layouts, notes, media and five single palettes remain protected',async()=>{
  assert.equal(sha(sourceBytes),'1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae');
  assert.deepEqual(Buffer.from(F.originalBytes()),sourceBytes);
  for(const n of Object.keys(original.files).filter(n=>!original.files[n].dir&&(/ppt\/(?:media|slideLayouts)\//.test(n)||n==='ppt/slideMasters/slideMaster1.xml'||/^ppt\/notes/.test(n)&&z.file(n))))assert.deepEqual(await z.file(n).async('nodebuffer'),await original.file(n).async('nodebuffer'),n);
  const sourceSingle=await text(original,'ppt/slides/slide1.xml');
  for(let i=0;i<5;i++){
   const [id,accents,highlight]=SCHEMES[i],part=ordered[i],s=await text(z,part),d=xml(s),layout=await target(z,part,'slideLayout'),master=await target(z,layout,'slideMaster'),theme=xml(await text(z,await target(z,master,'theme')));
   assert.equal(els(xml(await text(z,layout)),P,'cSld')[0].getAttribute('name'),'單欄'+id);
   assert.equal(els(xml(await text(z,master)),P,'cSld')[0].getAttribute('name'),'單欄'+id);
   assert.equal(theme.documentElement.getAttribute('name'),'單欄'+id);
   for(let k=0;k<6;k++)assert.equal(els(els(theme,A,'accent'+(k+1))[0],A,'srgbClr')[0].getAttribute('val'),accents[k]);
   const added=[...s.matchAll(/<p:sp\b[^>]*>[\s\S]*?<\/p:sp>/g)].filter(m=>/\bid="9001"/.test(m[0]));assert.equal(added.length,0);
   assert.equal(els(d,A,'highlight').length,0);
   const content=els(d,P,'sp').find(sp=>els(sp,P,'ph').some(ph=>ph.getAttribute('idx')==='1'));assert.equal(els(content,A,'p').length,3);assert.deepEqual(els(content,A,'pPr').map(p=>p.getAttribute('lvl')),['0','1','2']);assert.equal(els(d,P,'sp').filter(sp=>els(sp,P,'cNvPr')[0]?.getAttribute('name').startsWith('Native ShapeStyle ')).length,36);
   for(const phrase of ['大標題：主要重點（24 pt）','次標題：說明重點與背景（18 pt）','再次標題：補充資料與細節（14 pt）'])assert(joined(content).includes(phrase));
  }
  assert.equal(els(pres,P,'sldMasterId').length,6);
 });
 await check('all sixteen selected pages retain genuine preset paint, editable source groups and fonts',async()=>{
  for(let si=0;si<4;si++){
   const preset=D.PRESETS.find(p=>p.id===STYLE_IDS[si]);assert.equal(preset.P,PRIMARY[si]);
   const raw=D.buildModel({...preset},{only:KEYS}),model=F.componentModel({palette:{accents:SCHEMES[0][1]}},STYLE_IDS[si]);
   for(let ki=0;ki<4;ki++){
    const key=KEYS[ki],source=raw.slides.find(s=>s.key===key),actual=model.slides.find(s=>s.key===key),s=await text(z,ordered[8+si*4+ki]),d=xml(s),groups=els(d,P,'grpSp');
    assert.equal(actual.groups.length,[si===3?54:55,9,28,28][ki]);assert.equal(groups.length,source.groups.filter(g=>g.to>g.from).length);assert.equal(els(d,P,'pic').length,0);assert(s.includes('val="'+PRIMARY[si]+'"'));
    assert(joined(d).endsWith(actual.items.flatMap(it=>(it.runs||[]).map(r=>r.t)).join('').replace(/\r?\n/g,'')),'Every component text, category and caption is retained in native order');
    for(let gi=0;gi<source.groups.length;gi++){
     const old=source.groups[gi],got=actual.groups[gi],oi=source.items.slice(old.from,old.to+1),ni=actual.items.slice(got.from,got.to+1);assert.equal(oi.length,ni.length);
     if(old.to>old.from){const native=groups.find(g=>els(g,P,'cNvPr')[0].getAttribute('name')===old.name);assert(native,old.name);assert.equal(joined(native),oi.flatMap(it=>(it.runs||[]).map(r=>r.t)).join('').replace(/\r?\n/g,''));}
     oi.forEach((it,j)=>{for(const k of ['fill','line','ft','dash'])assert.deepEqual(ni[j][k],it[k],key+' '+k);assert.deepEqual((ni[j].runs||[]).map(r=>[r.t,r.o.font,r.o.color,r.o.bold]),(it.runs||[]).map(r=>[r.t,r.o.font,r.o.color,r.o.bold]));});
    }
   }
  }
 });
 await check('selected-page hyperlinks resolve only to existing same-style components',async()=>{
  let links=0;
  for(let i=8;i<24;i++){
   const part=ordered[i],d=xml(await text(z,part)),rr=await rels(z,part),linkRefs=els(d,A,'hlinkClick');
   for(const r of rr){assert(!r.external);assert(z.file(resolve(part,r.target)),'Internal target exists');}
   for(const h of linkRefs){const r=rr.find(r=>r.id===h.getAttributeNS(R,'id'));assert(r&&r.type===R+'/slide');const to=ordered.indexOf(resolve(part,r.target));assert(to>=8&&Math.floor((to-8)/4)===Math.floor((i-8)/4),'Link stays in style group');assert([1,2,3].includes((to-8)%4),'Only included Cards/A16/A18 target');links++;}
   const ids=els(d,P,'cNvPr').map(n=>n.getAttribute('id'));assert.equal(new Set(ids).size,ids.length);
  }
  assert.equal(links,8,'Two existing Cards links per catalogue; absent pages have no dangling links');
 });
 if(process.env.MASTER_PREVIOUS_FIXTURE)await check('unchanged materials and components retain bytes except numbers and internal slide targets',async()=>{
  const previous=await JSZip.loadAsync(fs.readFileSync(process.env.MASTER_PREVIOUS_FIXTURE));const norm=s=>s.replace(/<a:fld\b[^>]*\btype="slidenum"[^>]*>[\s\S]*?<\/a:fld>/g,'<page-number/>');
  for(let i=6;i<24;i++)assert.equal(norm(await text(z,ordered[i])),norm(await text(previous,'ppt/slides/slideMaterial'+(i+3)+'.xml')),'Retained page '+(i+1));
 });
 console.log(JSON.stringify({checks,failures:0,pages:24,componentPages:16,styles:STYLE_IDS,fixtureSha256:sha(data)}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
