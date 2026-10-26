#!/usr/bin/env node
'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const JSZip=require('../jszip.min.js'),PptxGenJS=require('pptxgenjs'),F=require('../fixed-master'),D=require('../deck');
const {JSDOM}=require('jsdom'),parser=new (new JSDOM('').window.DOMParser)();
const A='http://schemas.openxmlformats.org/drawingml/2006/main',P='http://schemas.openxmlformats.org/presentationml/2006/main',R='http://schemas.openxmlformats.org/officeDocument/2006/relationships',PKG='http://schemas.openxmlformats.org/package/2006/relationships',CT='http://schemas.openxmlformats.org/package/2006/content-types';
const SOURCE=fs.readFileSync(path.join(__dirname,'../fixed-master/Fixed_Red_Template.pptx'));
const SOURCE_SHA='1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae';
// Independent user-selected contract. Never derive these values from F.
const SCHEMES=[
 {id:'07',name:'E01 v5',label:'單欄 07 · E01 v5',accents:['5470C6','91CC75','FAC858','EE6666','73C0DE','3BA272'],highlight:'7C9CC3'},
 {id:'06',name:'D3-01 Category10',label:'單欄 06 · D3-01 Category10',accents:['1F77B4','FF7F0E','2CA02C','D62728','9467BD','8C564B'],highlight:'F9F0D4'},
 {id:'03',name:'Seaborn04 muted6',label:'單欄 03 · Seaborn04 muted6',accents:['4878D0','6ACC64','D65F5F','956CB4','D5BB67','82C6E2'],highlight:'D4E6DF'},
 {id:'10',name:'E13 purplepassion',label:'單欄 10 · E13 purplepassion',accents:['8A7CA8','E098C7','8FD3E8','71669E','CC70AF','7CB4CC'],highlight:'E5DDF1'},
 {id:'04',name:'D3-02 Observable10',label:'單欄 04 · D3-02 Observable10',accents:['4269D0','EFB118','FF725C','6CC5B0','3CA951','FF8AB7'],highlight:'F6D8DB'}
];
const HIGHLIGHTS=['F6D8DB','F9F0D4','7C9CC3','D4E6DF','E0E2E6','E5DDF1','595959','1F3864'];
const EXTRA_TITLES=['可編輯矩形樣式 1 / 2','可編輯矩形樣式 2 / 2','八色原生文字螢光筆','卡片與面板 Cards & Panels','方案元件・內文＋強調','方案元件・Icon＋內文＋強調'];
const EXPECTED_SLIDES=['ppt/slides/slideCover.xml','ppt/slides/slide1.xml',...['06','03','10','04'].map(id=>'ppt/slides/slideScheme'+id+'.xml'),'ppt/slides/slide2.xml',...Array.from({length:6},(_,i)=>'ppt/slides/slideMaterial'+(i+8)+'.xml')];
const ORIGINAL_MASTER='ppt/slideMasters/slideMaster1.xml',ORIGINAL_THEME='ppt/slideMasters/theme/theme2.xml';
const REMOVED=['ppt/slides/slide3.xml','ppt/slides/_rels/slide3.xml.rels','ppt/slides/slide4.xml','ppt/slides/_rels/slide4.xml.rels','ppt/notesSlides/notesSlide3.xml','ppt/notesSlides/_rels/notesSlide3.xml.rels'];
const CHANGED=['[Content_Types].xml','ppt/presentation.xml','ppt/_rels/presentation.xml.rels','docProps/app.xml','ppt/presProps.xml','ppt/theme/theme1.xml',ORIGINAL_THEME,'ppt/slides/slide1.xml','ppt/slides/_rels/slide1.xml.rels','ppt/slides/slide2.xml'];
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const fileNames=z=>Object.keys(z.files).filter(n=>!z.files[n].dir).sort();
const bytes=(z,n)=>{assert(z.file(n),'Missing part '+n);return z.file(n).async('uint8array');};
const text=(z,n)=>{assert(z.file(n),'Missing part '+n);return z.file(n).async('string');};
const xml=s=>{const doc=parser.parseFromString(s,'application/xml');assert.equal(doc.getElementsByTagName('parsererror').length,0,'Invalid XML');return doc;};
const els=(n,ns,local)=>Array.from(n.getElementsByTagNameNS(ns,local));
const joined=n=>els(n,A,'t').map(t=>t.textContent).join('').replace(/\r?\n/g,'');
const close=(a,b,label)=>assert(Math.abs(a-b)<1e-8,label+': '+a+' != '+b);
const sourceGroupItems=(s,g)=>s.items.slice(g.from,g.to+1);
const sourceGroupText=(s,g)=>sourceGroupItems(s,g).flatMap(it=>(it.runs||[]).map(r=>r.t)).join('').replace(/\r?\n/g,'');
function resolve(from,to){const result=path.posix.normalize(to[0]==='/'?to.slice(1):path.posix.join(path.posix.dirname(from),to));assert(!result.startsWith('../')&&!result.includes('\\'),'Safe internal target');return result;}
function relPath(part){return path.posix.join(path.posix.dirname(part),'_rels',path.posix.basename(part)+'.rels');}
function relOwner(part){return part==='_rels/.rels'?'':part.replace(/(?:^|\/)_rels\//,m=>m.startsWith('/')?'/':'').replace(/\.rels$/,'');}
async function relations(z,part){const p=part?relPath(part):'_rels/.rels';return els(xml(await text(z,p)),PKG,'Relationship').map(n=>({id:n.getAttribute('Id'),type:n.getAttribute('Type'),target:n.getAttribute('Target'),external:n.getAttribute('TargetMode')==='External'}));}
async function onlyTarget(z,part,type){const r=(await relations(z,part)).filter(r=>r.type===R+'/'+type);assert.equal(r.length,1,part+' has one '+type);assert(!r[0].external);return resolve(part,r[0].target);}
async function orderedSlides(z){const pres=xml(await text(z,'ppt/presentation.xml')),rs=await relations(z,'ppt/presentation.xml');return els(pres,P,'sldId').map(s=>{const id=s.getAttributeNS(R,'id');assert(id,'Declared relationships namespace');const r=rs.find(r=>r.id===id);assert(r&&r.type===R+'/slide');return resolve('ppt/presentation.xml',r.target);});}
function canonical(n){return JSON.stringify((function visit(n){return[n.namespaceURI,n.localName,Array.from(n.attributes||[]).filter(a=>a.namespaceURI!=='http://www.w3.org/2000/xmlns/').map(a=>[a.namespaceURI,a.localName,a.value]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),Array.from(n.childNodes).filter(c=>c.nodeType===1||c.nodeType===3&&c.textContent.trim()).map(c=>c.nodeType===1?visit(c):c.textContent)];})(n));}
function block(s,tag){const m=s.match(new RegExp('<a:'+tag+'\\b[^>]*>[\\s\\S]*?</a:'+tag+'>'));assert(m,'Missing '+tag);return m[0];}
function allowedThemeStripped(s){return s.replace(/<a:accent[1-6]>[\s\S]*?<\/a:accent[1-6]>/g,'').replace(/<a:(fillStyleLst|lnStyleLst|effectStyleLst)\b[^>]*>[\s\S]*?<\/a:\1>/g,'');}
function renumber(s,n){let count=0;const out=s.replace(/(<a:fld\b[^>]*\btype="slidenum"[^>]*>[\s\S]*?<a:t>)\d+(<\/a:t>[\s\S]*?<\/a:fld>)/g,(_,a,b)=>{count++;return a+n+b;});assert.equal(count,1);return out;}
function originalName(s,old,local='p:cSld'){const re=new RegExp('(<'+local+'\\b[^>]*\\bname=")[^"]*(")'),m=old.match(re);assert(m,'Source has named '+local);return s.replace(re,()=>m[0]);}
function sourceParams(accents){return {...D.BASE,P:accents[0],PD:D.mix(accents[0],'000000',.35),PT:D.mix(accents[0],'FFFFFF',.85),A:accents[1],bFont:'微軟正黑體',tFont:'微軟正黑體',nFont:'微軟正黑體'};}

const R2_LISTS={
 fillStyleLst:'<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"><a:tint val="90000"/><a:shade val="27500"/></a:schemeClr></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="20000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:tint val="12000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="85000"/><a:shade val="26000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:tint val="90000"/><a:shade val="27500"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:fillStyleLst>',
 lnStyleLst:'<a:lnStyleLst><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:round/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:round/></a:ln><a:ln w="22225" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:round/></a:ln></a:lnStyleLst>',
 effectStyleLst:'<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst><a:outerShdw blurRad="38100" dist="15875" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="14000"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle><a:effectStyle><a:effectLst><a:outerShdw blurRad="57150" dist="19050" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="19000"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle></a:effectStyleLst>'
};
function checkTransform(source,actual,key){
 assert.equal(actual.schemeCatalogue,false);close(actual.w,13+1/3,key+' slide width');close(actual.h,7.5,key+' slide height');
 assert.equal(actual.groups.length,key==='cards'?9:28);const k=key==='cards'?1:.5;
 source.groups.forEach((g,i)=>{const got=actual.groups[i];assert.equal(got.name,g.name);close(got.w/g.w,k,key+' group width scale');close(got.h/g.h,k,key+' group height scale');const oldItems=sourceGroupItems(source,g),newItems=sourceGroupItems(actual,got);assert.equal(newItems.length,oldItems.length,'All group objects retained');
  oldItems.forEach((old,j)=>{const now=newItems[j];assert.equal(now.t,old.t);assert.equal(now.kind,old.kind);for(const field of ['x','x1','x2'])if(typeof old[field]==='number')close(now[field]-got.x,(old[field]-g.x)*k,key+'/'+i+'/'+field);for(const field of ['y','y1','y2'])if(typeof old[field]==='number')close(now[field]-got.y,(old[field]-g.y)*k,key+'/'+i+'/'+field);for(const field of ['w','h','lw','adj'])if(typeof old[field]==='number')close(now[field],old[field]*k,key+'/'+i+'/'+field);
   for(const field of ['fill','line','ft','dash','cap'])assert.equal(now[field],old[field],key+' paint unchanged');
   if(old.sh){for(const field of ['blur','dist'])close(now.sh[field],old.sh[field]*k,key+' shadow '+field);assert.equal(now.sh.alpha,old.sh.alpha);}
   if(old.points){assert.equal(now.points.length,old.points.length);old.points.forEach((p,pi)=>{for(const field of ['x','y','x1','y1','x2','y2'])if(typeof p[field]==='number')close(now.points[pi][field],p[field]*k,key+' custom geometry');});}
   if(old.runs){assert.deepEqual(now.runs.map(r=>r.t),old.runs.map(r=>r.t));old.runs.forEach((r,ri)=>{close(now.runs[ri].o.size,r.o.size*k,key+' font scale');assert.equal(now.runs[ri].o.bold,r.o.bold);assert.equal(now.runs[ri].o.color,r.o.color);assert.equal(now.runs[ri].o.font,'微軟正黑體');});}
   if(old.tx){const margin=Array.isArray(old.tx.margin)?old.tx.margin.map(v=>v*k):typeof old.tx.margin==='number'?old.tx.margin*k:old.tx.margin;assert.deepEqual(now.tx.margin,margin);}
  });
 });
 for(const it of actual.items){const b=it.t==='ln'?{x:Math.min(it.x1,it.x2),y:Math.min(it.y1,it.y2),w:Math.abs(it.x2-it.x1),h:Math.abs(it.y2-it.y1)}:it;for(const f of ['x','y','w','h'])assert(Number.isFinite(b[f]),'Finite geometry');assert(b.x>=0&&b.y>=1.2&&b.x+b.w<=13+1/3+.0001&&b.y+b.h<6.94,'Content stays outside fixed title/footer');}
 if(key==='cards'){assert.deepEqual(actual.items.filter(i=>i.name==='圖說').map(i=>D.textOf(i)),source.items.filter(i=>i.name==='圖說').map(i=>D.textOf(i)));}
 else{const captions=actual.items.filter(i=>i.name==='素材款名');assert.equal(captions.length,14);assert(captions.every(c=>c.runs[0].o.size===9));assert.equal(new Set(actual.groups.map(g=>g.y.toFixed(6))).size,7);for(let i=0;i<28;i+=2){assert.equal(actual.groups[i].schemeSide,'A');assert.equal(actual.groups[i+1].schemeSide,'B');assert.equal(actual.groups[i].schemeStyle,actual.groups[i+1].schemeStyle);}for(const g of actual.groups)for(const it of sourceGroupItems(actual,g))for(const r of it.runs||[]){const badge=key==='schemebody'&&g.schemeStyle==='09'&&r.t===g.schemeSide;assert.equal(r.o.size,badge?8.5:9,'Only original 17pt A/B badge scales to 8.5pt');}}
}



let checks=0,failures=0;
async function check(name,fn){try{await fn();checks++;console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack);}}
(async()=>{
 await check('immutable original bytes and independent five-scheme contract',async()=>{assert.equal(sha(SOURCE),SOURCE_SHA);assert.deepEqual(Buffer.from(F.originalBytes()),SOURCE);assert.deepEqual(F.SINGLE_SCHEMES,SCHEMES);});
 const original=await JSZip.loadAsync(SOURCE),data=await F.exportPptx(JSZip,[],{PptxGenJS}),main=await JSZip.loadAsync(data),ordered=await orderedSlides(main);
 await check('exact thirteen-page order, titles, layout links and page numbers',async()=>{
  assert.deepEqual(ordered,EXPECTED_SLIDES);const pres=xml(await text(main,'ppt/presentation.xml')),size=els(pres,P,'sldSz')[0];assert.deepEqual([size.getAttribute('cx'),size.getAttribute('cy')],['12192000','6858000']);assert.equal(els(xml(await text(main,'docProps/app.xml')),'http://schemas.openxmlformats.org/officeDocument/2006/extended-properties','Slides')[0].textContent,'13');
  const sourceSingleName=els(xml(await text(original,'ppt/slides/slide1.xml')),P,'cSld')[0].getAttribute('name'),sourceDoubleName=els(xml(await text(original,'ppt/slides/slide2.xml')),P,'cSld')[0].getAttribute('name');
  const expectedNames=['封面 · none',...SCHEMES.map(()=>sourceSingleName),sourceDoubleName,...EXTRA_TITLES];
  for(let i=0;i<13;i++){const s=xml(await text(main,ordered[i]));assert.equal(els(s,P,'cSld')[0].getAttribute('name'),expectedNames[i]);const fields=els(s,A,'fld').filter(n=>n.getAttribute('type')==='slidenum');assert.equal(fields.length,1);assert.equal(joined(fields[0]),String(i+1));const layout=await onlyTarget(main,ordered[i],'slideLayout'),want=i===0?'slideLayout1.xml':i===6?'slideLayout4.xml':i<6?'slideLayoutScheme'+SCHEMES[i-1].id+'.xml':'slideLayout6.xml';assert.equal(layout,'ppt/slideLayouts/'+want);}
  assert.deepEqual(F.DOWNLOAD_PAGES.map(p=>[p.title,p.schemeId||null,p.layout,p.key||null]),[['專案重點與下一步',null,1,null],...SCHEMES.map(s=>['單欄內容',s.id,2,null]),['雙欄內容',null,4,null],...EXTRA_TITLES.map((t,i)=>[t,null,6,i<3?null:['cards','schemebody','schemeiconbody'][i-3]])]);
 });
 await check('all package XML, content types, relationships and shape IDs are valid',async()=>{
  const types=xml(await text(main,'[Content_Types].xml')),overrides=els(types,CT,'Override'),defaults=els(types,CT,'Default'),names=overrides.map(n=>n.getAttribute('PartName'));assert.equal(new Set(names).size,names.length);for(const n of names)assert(main.file(n.slice(1)),'Content-type part exists '+n);
  for(const name of fileNames(main)){if(name==='[Content_Types].xml')continue;assert(overrides.some(o=>o.getAttribute('PartName')==='/'+name)||defaults.some(d=>d.getAttribute('Extension')===name.split('.').at(-1)),'Content type assigned '+name);if(!/\.(xml|rels)$/.test(name))continue;const doc=xml(await text(main,name));
   if(name.endsWith('.rels')){const rs=els(doc,PKG,'Relationship'),ids=rs.map(r=>r.getAttribute('Id'));assert.equal(new Set(ids).size,ids.length,'Unique relationship IDs '+name);for(const r of rs)if(r.getAttribute('TargetMode')!=='External')assert(main.file(resolve(relOwner(name),r.getAttribute('Target'))),'Relationship target exists '+name+' '+r.getAttribute('Target'));}
   else{const refs=Array.from(doc.getElementsByTagName('*')).flatMap(n=>Array.from(n.attributes).filter(a=>a.namespaceURI===R&&['id','embed','link'].includes(a.localName)).map(a=>a.value));if(refs.length){const ids=(await relations(main,name)).map(r=>r.id);for(const id of refs)assert(ids.includes(id),'Content reference resolves '+name+' '+id);}}
  }
  for(const name of ordered){const doc=xml(await text(main,name)),ids=els(doc,P,'cNvPr').map(n=>n.getAttribute('id'));assert.equal(new Set(ids).size,ids.length,'Unique shape IDs '+name);for(const tag of ['stCxn','endCxn'])for(const c of els(doc,A,tag)){assert(ids.includes(c.getAttribute('id')));assert(Number.isInteger(+c.getAttribute('idx'))&&+c.getAttribute('idx')>=0);}}
  const p=xml(await text(main,'ppt/presentation.xml'));for(const tag of ['sldId','sldMasterId']){const ids=els(p,P,tag).map(n=>n.getAttribute('id'));assert.equal(ids.length,new Set(ids).size);}
 });
 await check('source master, seven layouts, media, notes and every unapproved source part remain exact',async()=>{
  for(const part of REMOVED)assert(!main.file(part),'Only previously retired source part removed '+part);
  for(const part of fileNames(original).filter(p=>!REMOVED.includes(p)&&!CHANGED.includes(p)))assert.deepEqual(Buffer.from(await bytes(main,part)),Buffer.from(await bytes(original,part)),'Exact source bytes '+part);
  for(const part of ['ppt/theme/theme1.xml',ORIGINAL_THEME])assert.equal(allowedThemeStripped(await text(main,part)),allowedThemeStripped(await text(original,part)),'Only theme accents and three matrices changed '+part);
  // Previously accepted cover values, independent of the current exporter.
  assert.equal(sha(await bytes(main,'ppt/slides/slideCover.xml')),'1d35bf1edb25be3958c575a6ae0a41514bd0c0efb5b98bef0d1bc745d83a1075');assert.equal(sha(await bytes(main,'ppt/slides/_rels/slideCover.xml.rels')),'27320281910a84f9a7570e793b403fd6f09832dc0bc1b4bf2a3e000febf382d3');
  assert.equal(await text(main,'ppt/slides/slide2.xml'),renumber(await text(original,'ppt/slides/slide2.xml'),7),'Double column changes page number only');
 });
 await check('five singles preserve original text and add only page number, layout and native highlight',async()=>{
  const source=await text(original,'ppt/slides/slide1.xml'),sourceRels=await relations(original,'ppt/slides/slide1.xml');
  for(let i=0;i<5;i++){const scheme=SCHEMES[i],part=ordered[i+1],s=await text(main,part),doc=xml(s);const added=Array.from(s.matchAll(/<p:sp\b[^>]*>[\s\S]*?<\/p:sp>/g)).filter(m=>/\bid="9001"/.test(m[0]));assert.equal(added.length,1);assert.equal(s.replace(added[0][0],''),renumber(source,i+2),'Source single-column title, text and unnamed cSld remain exact');
   const shape=els(doc,P,'sp').find(n=>els(n,P,'cNvPr')[0].getAttribute('id')==='9001');assert.equal(els(shape,P,'cNvPr')[0].getAttribute('name'),'Native highlight '+scheme.id);assert.equal(els(shape,A,'highlight').length,1);assert.equal(els(els(shape,A,'highlight')[0],A,'srgbClr')[0].getAttribute('val'),scheme.highlight);assert.equal(joined(shape),scheme.label+' · 原生文字醒目提示示範');assert.equal(els(shape,A,'solidFill').filter(n=>n.parentNode.localName==='spPr').length,0);assert.equal(els(shape,P,'spPr')[0].getElementsByTagNameNS(A,'noFill').length,2);assert.equal(els(doc,A,'highlight').length,1);
   const rs=await relations(main,part),notes=rs.filter(r=>r.type===R+'/notesSlide');assert.equal(notes.length,i===0?1:0);if(i===0)assert.equal(resolve(part,notes[0].target),resolve('ppt/slides/slide1.xml',sourceRels.find(r=>r.type===R+'/notesSlide').target));
   const keep=rs.filter(r=>r.type!==R+'/slideLayout'&&r.type!==R+'/notesSlide').map(r=>[r.id,r.type,resolve(part,r.target)]),expected=sourceRels.filter(r=>r.type!==R+'/slideLayout'&&r.type!==R+'/notesSlide').map(r=>[r.id,r.type,resolve('ppt/slides/slide1.xml',r.target)]);assert.deepEqual(keep,expected);
  }
 });
 await check('six active masters and five independently named layout/master/theme chains preserve source content',async()=>{
  const pres=xml(await text(main,'ppt/presentation.xml')),rs=await relations(main,'ppt/presentation.xml'),masterRefs=els(pres,P,'sldMasterId').map(n=>resolve('ppt/presentation.xml',rs.find(r=>r.id===n.getAttributeNS(R,'id')).target));assert.equal(masterRefs.length,6);assert.equal(new Set(masterRefs).size,6);assert(masterRefs.includes(ORIGINAL_MASTER));
  const layoutSource=await text(original,'ppt/slideLayouts/slideLayout2.xml'),masterSource=await text(original,ORIGINAL_MASTER),themeSource=await text(original,ORIGINAL_THEME),allLayouts=[],allThemes=[];
  for(let i=0;i<5;i++){const scheme=SCHEMES[i],layout=await onlyTarget(main,ordered[i+1],'slideLayout'),master=await onlyTarget(main,layout,'slideMaster'),theme=await onlyTarget(main,master,'theme');allLayouts.push(layout);allThemes.push(theme);assert(masterRefs.includes(master));assert.notEqual(master,ORIGINAL_MASTER);
   const lx=await text(main,layout),mx=await text(main,master),tx=await text(main,theme);for(const s of [lx,mx])assert.equal(els(xml(s),P,'cSld')[0].getAttribute('name'),scheme.label);assert.equal(xml(lx).documentElement.getAttribute('preserve'),'1');assert.equal(xml(tx).documentElement.getAttribute('name'),scheme.label);assert.equal(els(xml(tx),A,'clrScheme')[0].getAttribute('name'),scheme.name);
   assert.equal(originalName(lx.replace(/<p:sldLayout\b[^>]*>/,()=>layoutSource.match(/<p:sldLayout\b[^>]*>/)[0]),layoutSource),layoutSource,'Clone layout preserves geometry, text, bullets');
   assert.equal(originalName(mx.replace(/<p:sldLayoutIdLst>[\s\S]*?<\/p:sldLayoutIdLst>/,()=>masterSource.match(/<p:sldLayoutIdLst>[\s\S]*?<\/p:sldLayoutIdLst>/)[0]),masterSource),masterSource,'Clone master preserves brand and typography');
   const ml=els(xml(mx),P,'sldLayoutId');assert.equal(ml.length,1);const mrs=await relations(main,master),lr=mrs.find(r=>r.id===ml[0].getAttributeNS(R,'id'));assert(lr&&lr.type===R+'/slideLayout');assert.equal(resolve(master,lr.target),layout);
   const originalExtra=(await relations(original,ORIGINAL_MASTER)).filter(r=>![R+'/theme',R+'/slideLayout'].includes(r.type)).map(r=>[r.id,r.type,resolve(ORIGINAL_MASTER,r.target)]);assert.deepEqual(mrs.filter(r=>![R+'/theme',R+'/slideLayout'].includes(r.type)).map(r=>[r.id,r.type,resolve(master,r.target)]),originalExtra);
   const stripNames=x=>originalName(originalName(x,themeSource,'a:theme'),themeSource,'a:clrScheme');assert.equal(allowedThemeStripped(stripNames(tx)),allowedThemeStripped(themeSource));
  }
  assert.equal(new Set(allLayouts).size,5);assert.equal(new Set(allThemes).size,5);
 });
 await check('all seven active presentation/master themes use exact R2 matrices and intended accents',async()=>{
  const themes=[['ppt/theme/theme1.xml',SCHEMES[0]], [ORIGINAL_THEME,SCHEMES[0]],...await Promise.all(SCHEMES.map(async(s,i)=>[await onlyTarget(main,await onlyTarget(main,await onlyTarget(main,ordered[i+1],'slideLayout'),'slideMaster'),'theme'),s]))];
  for(const [part,scheme]of themes){const s=await text(main,part),doc=xml(s);for(let i=1;i<=6;i++)assert.equal(els(els(doc,A,'accent'+i)[0],A,'srgbClr')[0].getAttribute('val'),scheme.accents[i-1]);for(const [tag,expected]of Object.entries(R2_LISTS)){const want=xml('<wrap xmlns:a="'+A+'">'+expected+'</wrap>').documentElement.firstElementChild;assert.equal(canonical(els(doc,A,tag)[0]),canonical(want),part+' '+tag);}}
 });
 await check('seventy editable cards and thirteen native highlights contain no shape-band substitute',async()=>{
  let highlights=0,cards=0;for(const [i,part]of ordered.entries()){const doc=xml(await text(main,part));highlights+=els(doc,A,'highlight').length;cards+=els(doc,P,'cNvPr').filter(n=>/^Material card /.test(n.getAttribute('name'))).length;if(i<10)assert(!els(doc,P,'cNvPr').some(n=>/half.height|marker band|螢光條|底帶/i.test(n.getAttribute('name'))),'No new highlight band; unrelated catalogue decorations are source-protected separately');}
  assert.equal(highlights,13);assert.equal(cards,70);
  for(const i of [7,8]){const doc=xml(await text(main,ordered[i])),cardNames=els(doc,P,'cNvPr').filter(n=>/^Material card /.test(n.getAttribute('name')));assert.equal(cardNames.length,35);assert.equal(els(doc,P,'pic').length,0);}
  const sheet=xml(await text(main,ordered[9]));assert.deepEqual(els(sheet,A,'highlight').map(h=>els(h,A,'srgbClr')[0].getAttribute('val')),HIGHLIGHTS);assert.equal(els(sheet,P,'pic').length,0);
 });
 const sourceModel=D.buildModel(sourceParams(SCHEMES[0].accents),{only:['cards','schemebody','schemeiconbody']}),actualModel=F.componentModel({palette:{accents:SCHEMES[0].accents.slice()}});
 await check('A2/A16/A18 retain all source text, editable groups and valid native connections',async()=>{
  for(let i=0;i<3;i++){const key=['cards','schemebody','schemeiconbody'][i],raw=await text(main,ordered[10+i]),doc=xml(raw),groups=els(doc,P,'grpSp'),source=sourceModel.slides.find(s=>s.key===key);assert.equal(groups.length,i?28:9);assert.equal(els(doc,P,'pic').length,0);assert(!/\br:(?:id|embed|link)=/.test(raw));
   for(const g of source.groups){const found=groups.filter(n=>els(n,P,'cNvPr')[0].getAttribute('name')===g.name);assert.equal(found.length,1);assert.equal(joined(found[0]),sourceGroupText(source,g));}
   if(i){assert(raw.includes('密集素材總覽（9 pt）'));for(const group of groups){const name=els(group,P,'cNvPr')[0].getAttribute('name');for(const pr of els(group,A,'rPr')){const badge=i===1&&name.startsWith('09 字標與主題・方案 ')&&['A','B'].includes(joined(pr.parentNode));assert.equal(pr.getAttribute('sz'),badge?'850':'900');}}}
  }
 });
 await check('component geometry remains uniformly scaled with seven dense rows and preserved captions',async()=>{for(const key of ['cards','schemebody','schemeiconbody'])checkTransform(sourceModel.slides.find(s=>s.key===key),actualModel.slides.find(s=>s.key===key),key);});
 console.log(JSON.stringify({checks,failures,exports:1,pages:13,masters:6,independentSchemes:5,cards:70,nativeHighlights:13,sourceSha256:sha(SOURCE)}));if(failures)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
