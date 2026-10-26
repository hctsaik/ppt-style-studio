/* Package/model evidence only. Native PowerPoint rendering and Ribbon UI are separate gates. */
'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const {JSDOM}=require('jsdom'),F=require('../fixed-master.js'),Z=require('../jszip.min.js');
const A='http://schemas.openxmlformats.org/drawingml/2006/main',P='http://schemas.openxmlformats.org/presentationml/2006/main',R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const parse=xml=>{const d=new JSDOM(xml,{contentType:'text/xml'}).window.document;assert.equal(d.getElementsByTagName('parsererror').length,0);return d;};
const all=(d,ns,name)=>Array.from(d.getElementsByTagNameNS(ns,name)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const SELECTED07=['5470C6','91CC75','FAC858','EE6666','73C0DE','3BA272'];
const INKS=['F6D8DB','F9F0D4','7C9CC3','D4E6DF','E0E2E6','E5DDF1','595959','1F3864'];
const sourceBytes=F.originalBytes();
async function string(z,p){assert(z.file(p),'missing '+p);return z.file(p).async('string');}
function targets(xml,base,type){return all(parse(xml),'http://schemas.openxmlformats.org/package/2006/relationships','Relationship').filter(e=>!type||e.getAttribute('Type')===R+'/'+type).map(e=>({id:e.getAttribute('Id'),part:path.posix.normalize((e.getAttribute('Target').startsWith('/')?'':base+'/')+e.getAttribute('Target')).replace(/^\//,''),external:e.getAttribute('TargetMode')==='External'}));}
async function active(z){const rel=targets(await string(z,'ppt/_rels/presentation.xml.rels'),'ppt','slide');return all(parse(await string(z,'ppt/presentation.xml')),P,'sldId').map(e=>rel.find(r=>r.id===e.getAttributeNS(R,'id')).part);}
async function noDangling(z){for(const name of Object.keys(z.files).filter(n=>n.endsWith('.rels')&&!z.files[n].dir)){const base=name==='_rels/.rels'?'':path.posix.dirname(name).replace(/(?:^|\/)\_rels$/,'');for(const r of targets(await string(z,name),base)){if(!r.external)assert(z.file(r.part),name+' -> '+r.part);}}}
function scheme(xml){const s={};const d=parse(xml);for(const k of ['dk1','lt1','dk2','lt2','accent1','accent2','accent3','accent4','accent5','accent6','hlink','folHlink']){const e=all(d,A,k)[0].firstElementChild;s[k]=e.getAttribute('val')||e.getAttribute('lastClr');if(e.localName==='sysClr')s[k]=e.getAttribute('lastClr');}return s;}
function block(xml,name){return xml.match(new RegExp('<a:'+name+'\\b[^>]*>[\\s\\S]*?</a:'+name+'>'))[0];}
let checks=0;async function test(name,fn){await fn();checks++;console.log('PASS '+name);}
(async()=>{
 const original=await Z.loadAsync(sourceBytes),sourceHash=sha(sourceBytes);
 await test('Thirteen-page download descriptors follow the independent user-selected order',()=>{
  assert.deepEqual(F.DOWNLOAD_PAGES.map(p=>[p.title,p.label,p.key||null,p.layout]),[
   ['專案重點與下一步','封面',null,1],
   ['單欄內容','單欄 07 · E01 v5',null,2],['單欄內容','單欄 06 · D3-01 Category10',null,2],['單欄內容','單欄 03 · Seaborn04 muted6',null,2],['單欄內容','單欄 10 · E13 purplepassion',null,2],['單欄內容','單欄 04 · D3-02 Observable10',null,2],
   ['雙欄內容','雙欄內容',null,4],
   ['可編輯矩形樣式 1 / 2','矩形樣式 1 / 2',null,6],['可編輯矩形樣式 2 / 2','矩形樣式 2 / 2',null,6],['八色原生文字螢光筆','八色文字螢光筆',null,6],
   ['卡片與面板 Cards & Panels','卡片與面板 · A2','cards',6],['方案元件・內文＋強調','內文＋強調 · A16','schemebody',6],['方案元件・Icon＋內文＋強調','Icon＋內文＋強調 · A18','schemeiconbody',6]
  ]);
 });
 assert.equal(sourceHash,'1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae');
 for(const source of ['common','theme']){
  const snapshot={paletteSource:source,title:'保存文字',layout:'4',marker:'highlight',highlightColor:'navy'},before=JSON.stringify(snapshot);
  const main=await Z.loadAsync(await F.exportPptx(Z,[],{source})),materials=await Z.loadAsync(await F.exportMaterials(Z,snapshot));
  await test('stored '+source+' preference still exports thirteen main pages and three materials pages',async()=>{assert.equal((await active(main)).length,13);assert.equal((await active(materials)).length,3);await noDangling(main);await noDangling(materials);for(const [z,n]of [[main,'13'],[materials,'3']])assert.equal(all(parse(await string(z,'docProps/app.xml')),'http://schemas.openxmlformats.org/officeDocument/2006/extended-properties','Slides')[0].textContent,n);});
  await test(source+' both outputs share presentation/master native profile and preserve notes',async()=>{
   for(const part of ['ppt/theme/theme1.xml','ppt/slideMasters/theme/theme2.xml']){const a=await string(main,part),b=await string(materials,part),o=await string(original,part);assert.equal(a,b);assert.notEqual(block(a,'fmtScheme'),block(o,'fmtScheme'));assert.equal(block(a,'fontScheme'),block(o,'fontScheme'));assert.equal(block(a,'bgFillStyleLst'),block(o,'bgFillStyleLst'));const sc=scheme(a),orig=scheme(o);assert.deepEqual(Array.from({length:6},(_,i)=>sc['accent'+(i+1)]),SELECTED07,'Saved legacy palette cannot replace selected 07');for(const k of ['dk1','lt1','dk2','lt2','hlink','folHlink'])assert.equal(sc[k],orig[k]);assert(block(a,'fillStyleLst').includes('<a:tint val="90000"/><a:shade val="27500"/>'));assert(block(a,'effectStyleLst').includes('blurRad="38100"'));assert(block(a,'effectStyleLst').includes('blurRad="57150"'));}
   for(const part of Object.keys(main.files).filter(n=>/notes/i.test(n)&&!main.files[n].dir)){assert.deepEqual(await main.file(part).async('uint8array'),await original.file(part).async('uint8array'),part);assert.deepEqual(await materials.file(part).async('uint8array'),await main.file(part).async('uint8array'),part);}
  });
  await test(source+' original master/layout/logo parts retain their exact bytes',async()=>{for(const part of Object.keys(original.files).filter(n=>!original.files[n].dir&&(/^(ppt\/(slideMasters|slideLayouts|media)\/)/.test(n))&&!n.includes('/theme/'))){for(const z of [main,materials])assert.deepEqual(await z.file(part).async('uint8array'),await original.file(part).async('uint8array'),part);}});
  const pages=await active(materials),docs=await Promise.all(pages.map(async p=>parse(await string(materials,p))));
  await test(source+' materials contain 70 standalone editable roundRects on original title-only layout',async()=>{
   let count=0;for(let page=0;page<2;page++){const doc=docs[page],cards=all(doc,P,'sp').filter(s=>/^Material card /.test(all(s,P,'cNvPr')[0].getAttribute('name')));assert.equal(cards.length,35);assert.equal(all(doc,P,'pic').length,0);assert.equal(all(doc,P,'grpSp').length,0);const names=cards.map(s=>all(s,P,'cNvPr')[0].getAttribute('name'));for(let row=page*5+1;row<=page*5+5;row++)for(const role of ['tx1','accent1','accent2','accent3','accent4','accent5','accent6'])assert(names.includes('Material card '+row+' '+role));for(const card of cards){assert.equal(all(card,A,'prstGeom')[0].getAttribute('prst'),'roundRect');assert.equal(all(card,P,'txBody').length,1);assert.equal(all(card,A,'latin')[0].getAttribute('typeface'),'微軟正黑體');assert.equal(all(card,A,'ea')[0].getAttribute('typeface'),'微軟正黑體');assert(all(card,A,'schemeClr').length>0);count++;}const rel=targets(await string(materials,pages[page].replace('/slides/','/slides/_rels/')+'.rels'),'ppt/slides','slideLayout');assert.equal(rel[0].part,'ppt/slideLayouts/slideLayout6.xml');}assert.equal(count,70);
  });
  await test(source+' 10 card appearances match independent fill/line/shadow contracts',()=>{const cards=docs.slice(0,2).flatMap(d=>all(d,P,'sp').filter(s=>/^Material card /.test(all(s,P,'cNvPr')[0].getAttribute('name'))));for(const card of cards){const name=all(card,P,'cNvPr')[0].getAttribute('name'),row=+name.match(/card (\d+)/)[1],pr=all(card,P,'spPr')[0],fills=Array.from(pr.children).filter(e=>e.localName==='solidFill'),ln=Array.from(pr.children).find(e=>e.localName==='ln');assert.equal(fills.length,1);if([1,2,3,4,7].includes(row))assert.equal(fills[0].firstElementChild.getAttribute('val'),'lt1');if(row===5){assert.equal(all(fills[0],A,'tint')[0].getAttribute('val'),'20000');}if(row===6)assert.equal(fills[0].firstElementChild.getAttribute('val'),'F2F2F2');if([5,6,8,10].includes(row))assert.equal(all(ln,A,'noFill').length,1);if([1,2,3,8,9].includes(row))assert.equal(all(pr,A,'outerShdw').length,1);else assert.equal(all(pr,A,'outerShdw').length,0);if([8,9,10].includes(row)){const rpr=all(card,A,'rPr')[0];assert.equal(all(rpr,A,'schemeClr')[0].getAttribute('val'),'lt1');assert.equal(rpr.getAttribute('b'),'1');}if(row===9){assert.equal(all(ln,A,'schemeClr')[0].getAttribute('val'),'lt1');assert.equal(ln.getAttribute('w'),'28575');}}});
  await test(source+' highlight page has 8 true run highlights and no colored backing shapes',()=>{const d=docs[2],hs=all(d,A,'highlight');assert.deepEqual(hs.map(e=>all(e,A,'srgbClr')[0].getAttribute('val')),INKS);for(const [i,h]of hs.entries()){assert.equal(h.parentElement.localName,'rPr');assert.equal(all(h.parentElement,A,'latin')[0].getAttribute('typeface'),'微軟正黑體');const color=Array.from(h.parentElement.children).find(e=>e.localName==='solidFill').firstElementChild.getAttribute('val');assert.equal(color,i>=6?'FFFFFF':'333333');}for(const sp of all(d,P,'sp').filter(s=>/^Native highlight/.test(all(s,P,'cNvPr')[0].getAttribute('name')))){const pr=all(sp,P,'spPr')[0];assert.equal(Array.from(pr.children).some(e=>e.localName==='solidFill'),false);}assert.equal(all(d,P,'pic').length,0);});
  await test(source+' embedded material pages match the standalone three pages except their page-number field',async()=>{
   const mainPages=await active(main),standalone=await active(materials);
   const normalizePage=xml=>xml.replace(/<a:fld\b[^>]*\btype="slidenum"[^>]*>[\s\S]*?<\/a:fld>/g,'<page-number/>');
   for(let i=0;i<3;i++){
    const embedded=await string(main,mainPages[i+7]),separate=await string(materials,standalone[i]);
    assert.equal(normalizePage(embedded),normalizePage(separate),'Material payload '+i+' remains exact');
    const number=doc=>all(parse(doc),A,'fld').filter(e=>e.getAttribute('type')==='slidenum').map(e=>e.textContent);
    assert.deepEqual(number(embedded),[String(i+8)]);assert.deepEqual(number(separate),[String(i+1)]);
   }
  });
  await test(source+' export leaves caller snapshot and source unchanged',()=>{assert.equal(JSON.stringify(snapshot),before);assert.equal(sha(F.originalBytes()),sourceHash);});
 }
 console.log(JSON.stringify({checks,outputs:4,legacyPreferencesIgnored:2,mainPages:13,materialPages:3,cardsPerMaterials:70,highlightsPerMaterials:8,sourceSha256:sourceHash}));
})().catch(e=>{console.error(e);process.exitCode=1;});
