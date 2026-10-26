/* Native palette / highlight contract. XML and DOM checks do not certify Ribbon UI. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom'),F=require('../fixed-master.js'),DATA=require('../fixed-master-data.js'),Z=require('../jszip.min.js');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'out/fixed-master-native-v2');
const A='http://schemas.openxmlformats.org/drawingml/2006/main',P='http://schemas.openxmlformats.org/presentationml/2006/main';
// Independent, literal acceptance contract: never derive expected colors from NativeStyles.
const COLORS=['D95D68','E7BF4A','4E83CE','4B9679','7D8795','9371C6','FFFFFF'];
const HIGHLIGHTS=['F6D8DB','F9F0D4','7C9CC3','D4E6DF','E0E2E6','E5DDF1','595959','1F3864'];
const KEYS=['red','yellow','blue','green','gray','purple','dark-gray','navy'];
const ORIGINAL=['4472C4','ED7D31','A5A5A5','FFC000','5B9BD5','70AD47'];
const SELECTED07=['5470C6','91CC75','FAC858','EE6666','73C0DE','3BA272'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const dom=new JSDOM('<!doctype html><html><head></head><body><div id="host"></div></body></html>',{runScripts:'outside-only',url:'https://fixed-master.test/'});
const w=dom.window,d=w.document,parse=xml=>{const v=new w.DOMParser().parseFromString(xml,'application/xml');assert.equal(v.getElementsByTagName('parsererror').length,0,xml.slice(0,250));return v;};
const els=(v,ns,name)=>Array.from(v.getElementsByTagNameNS(ns,name));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(test){const end=Date.now()+3000;while(!test()){if(Date.now()>end)throw Error('UI did not settle');await delay(5);}}

// Only presentation/master-reachable themes may change these three effect lists.
const enhancedThemes=new Set(['ppt/theme/theme1.xml','ppt/slideMasters/theme/theme2.xml']);
const stableTheme=xml=>xml.replace(/(<a:fmtScheme\b[^>]*\bname=")[^"]*(")/,'$1PROFILE$2').replace(/<a:(fillStyleLst|lnStyleLst|effectStyleLst)\b[^>]*>[\s\S]*?<\/a:\1>/g,'<mutableEffectList/>');
function assertThemeBoundary(before,after,name){
 if(!enhancedThemes.has(name)){assert.equal(after,before,'Non-target/notes theme must remain byte-identical '+name);return;}
 const expected=before.replace(/<a:accent([1-6])>[\s\S]*?<\/a:accent\1>/g,(_,n)=>'<a:accent'+n+'><a:srgbClr val="'+SELECTED07[n-1]+'"/></a:accent'+n+'>');
 assert.equal(stableTheme(after),stableTheme(expected),'Only Accent slots and fill/line/effect lists may change '+name);
 assert.equal(after.match(/<a:fmtScheme[^>]*>/)[0],before.match(/<a:fmtScheme[^>]*>/)[0],'Formatting matrix attributes stay unchanged');
 assert(after.includes('<a:tint val="90000"/><a:shade val="27500"/>'));assert(after.includes('blurRad="38100"'));assert(after.includes('blurRad="57150"'));
}
let checks=0;async function test(name,fn){await fn();checks++;console.log('PASS '+name);}
(async()=>{
 const original=await Z.loadAsync(F.originalBytes());fs.mkdirSync(OUT,{recursive:true});
 const themes=Object.keys(DATA.parts).filter(n=>/\/theme[^/]*\.xml$/.test(n));
 const sourceTheme=await original.file('ppt/theme/theme1.xml').async('string');
 const rawHash=hash(fs.readFileSync(path.join(ROOT,'fixed-master/Fixed_Red_Template.pptx')));
 await test('Legacy bands migrate to native highlight; white markers retire without changing cards or text',()=>{
  for(const marker of ['marker','underline','highlight','none']){const s=F.normalize({layout:'7',style:'solid',marker,color:'white',focus:'既有重點'});assert.equal(s.marker,'none');assert.equal(s.color,'white');assert.equal(s.layout,'2');assert.equal(s.style,'solid');assert.equal(s.focus,'既有重點');assert.equal(s.paletteSource,'common');assert.equal(s.version,2);}
  for(const marker of ['marker','underline'])for(const color of KEYS.slice(0,6)){const s=F.normalize({layout:'4',style:'side',marker,color,focus:'舊文字'});assert.equal(s.marker,'highlight');assert.equal(s.highlightColor,color);assert.equal(s.color,color);assert.equal(s.focus,'舊文字');assert.deepEqual(F.normalize(s),s);}
  assert.equal(F.normalize({color:'white',marker:'highlight',highlightColor:'navy'}).marker,'highlight','New white card plus native ink is supported');
  assert.deepEqual(F.MARKERS.map(m=>m.key),['none','highlight']);assert.deepEqual(F.HIGHLIGHTS.map(h=>h.color),HIGHLIGHTS);
  assert.equal(F.normalize({paletteSource:'theme',marker:'highlight'}).paletteSource,'theme');
  assert.equal(F.normalize({paletteSource:'invalid'}).paletteSource,'common');
  const lum=c=>c.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  for(const c of ['595959','1F3864'])assert(1.05/(lum(c)+.05)>=4.5,'The two optional dark inks can support user-selected white text');
  assert.equal(F.HIGHLIGHTS.find(h=>h.key==='blue').color,'7C9CC3','Reference blue must not be darkened to force white text');
 });
 const outputs={};
 for(const source of ['common','theme'])await test('Stored '+source+' preference exports selected five schemes and twenty-six pages with protected source parts',async()=>{
  const bytes=await F.exportPptx(Z,[],{source}),zip=await Z.loadAsync(bytes);outputs[source]=zip;
  fs.writeFileSync(path.join(OUT,'template-'+source+'-26pages.pptx'),bytes);
  assert.equal(els(parse(await zip.file('ppt/presentation.xml').async('string')),P,'sldId').length,26);
  assert.equal(Object.keys(zip.files).filter(n=>/^ppt\/slides\/[^/]+\.xml$/.test(n)).length,26);
  for(const name of themes){const before=await original.file(name).async('string'),after=await zip.file(name).async('string');parse(after);
   assertThemeBoundary(before,after,name);
   for(const role of ['dk1','lt1','dk2','lt2','hlink','folHlink']){const pattern=new RegExp('<a:'+role+'>[\\s\\S]*?</a:'+role+'>');assert.equal(after.match(pattern)[0],before.match(pattern)[0]);}
  }
  for(const name of Object.keys(DATA.parts).filter(n=>/^ppt\/(?:slideMasters|slideLayouts|media)\//.test(n)&&!themes.includes(n)))assert.equal(hash(await zip.file(name).async('uint8array')),DATA.parts[name],name);
  for(const name of ['ppt/slides/slide1.xml','ppt/slides/slide2.xml']){const strip=s=>s.replace(/<p:sp\b[^>]*>[\s\S]*?<\/p:sp>/g,shape=>/\bid="9001"/.test(shape)?'':shape).replace(/(<a:fld\b[^>]*type="slidenum"[\s\S]*?<a:t>)\d+(<\/a:t>)/g,'$1PAGE$2');let current=await zip.file(name).async('string');if(name==='ppt/slides/slide1.xml'){assert.equal(current.split('<a:t>單欄07</a:t>').length,2);const highlight=els(parse(current),P,'sp').find(s=>els(s,P,'cNvPr')[0].getAttribute('id')==='9001');assert.equal(els(highlight,A,'t').map(t=>t.textContent).join(''),'重點文字');current=current.replace('<a:t>單欄07</a:t>','<a:t>單欄內容</a:t>');}assert.equal(strip(current),strip(await original.file(name).async('string')));}
  const props=parse(await zip.file('ppt/presProps.xml').async('string')),mru=els(props,P,'clrMru');assert.equal(mru.length,1);assert.equal(els(mru[0],A,'srgbClr').length,8);assert.equal(els(mru[0],A,'srgbClr')[0].getAttribute('val'),'1F3864');
  assert.deepEqual(els(mru[0],A,'srgbClr').map(c=>c.getAttribute('val')).reverse(),HIGHLIGHTS,'Native ink palette is independent of Accent source');
  const cover=await zip.file('ppt/slides/slideCover.xml').async('string');assert(!cover.includes('螢光筆底帶'));assert(!cover.includes('<a:highlight>'),'Main cover has no example marker');
  assert.equal(hash(F.originalBytes()),rawHash);assert.equal(rawHash,'1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae');
 });
 await test('Saved legacy palette preference cannot change any part of the twenty-six-page package',async()=>{
  const names=Object.keys(outputs.common.files).filter(n=>!outputs.common.files[n].dir);assert.deepEqual(names.sort(),Object.keys(outputs.theme.files).filter(n=>!outputs.theme.files[n].dir).sort());for(const name of names)assert.deepEqual(await outputs.common.file(name).async('uint8array'),await outputs.theme.file(name).async('uint8array'),name);
  assert.deepEqual(F.ORIGINAL_ACCENTS,ORIGINAL);for(let i=0;i<6;i++)assert(sourceTheme.includes(`<a:accent${i+1}><a:srgbClr val="${ORIGINAL[i]}"/></a:accent${i+1}>`));
 });
 for(let i=0;i<KEYS.length;i++)await test('Editable native text highlight uses exact '+KEYS[i]+' while keeping card color and text ink',async()=>{
  const value={layout:'4',style:'solid',marker:'highlight',color:'blue',highlightColor:KEYS[i],focus:'原生色彩測試'},model=F.build(value),xml=F.slideXml(model,4),slide=parse(xml);
  const unmarked=F.build({...value,marker:'none'}),before=unmarked.objects.flatMap(g=>g.items||[g]).filter(o=>o.name==='強調短句');
  assert.deepEqual(els(slide,A,'highlight').map(h=>els(h,A,'srgbClr')[0].getAttribute('val')),[HIGHLIGHTS[i],HIGHLIGHTS[i]]);
  assert(!model.objects.flatMap(g=>g.items||[g]).some(o=>o.name==='螢光筆底帶'));
  for(const [n,h]of els(slide,A,'highlight').entries()){assert.equal(h.parentElement.localName,'rPr');assert.equal(els(h,A,'alpha').length,0);assert.equal(els(h.parentElement,A,'latin')[0].getAttribute('typeface'),'微軟正黑體');assert.equal(els(h.parentElement,A,'solidFill')[0].textContent,'');assert.equal(els(els(h.parentElement,A,'solidFill')[0],A,'srgbClr')[0].getAttribute('val'),before[n].color);}
  assert.equal(model.color,'4E83CE');
  assert.equal(els(slide,P,'pic').length,0);assert(!xml.includes('normAutofit'));assert(!xml.includes('252A34'));
  const bytes=await F.exportPptx(Z,[value],{source:'common'}),zip=await Z.loadAsync(bytes);assert.equal(els(parse(await zip.file('ppt/presentation.xml').async('string')),P,'sldId').length,4);assert.equal(await zip.file('ppt/slides/slide4.xml').async('string'),xml);
  fs.writeFileSync(path.join(OUT,'highlight-'+KEYS[i]+'-4pages.pptx'),bytes);
 });
 await test('All supported combinations use only native run highlighting; unrelated side-card decoration survives',()=>{
  for(const value of F.combinations()){const model=F.build(value),items=model.objects.flatMap(g=>g.items||[g]);assert(!items.some(o=>o.name==='螢光筆底帶'));assert.equal(model.selection.color,value.color);assert.equal(model.selection.highlightColor,value.highlightColor);assert(items.filter(o=>o.name==='強調短句').every(o=>value.marker==='none'?!o.highlight:o.highlight===HIGHLIGHTS[KEYS.indexOf(value.highlightColor)]));
   const plain=F.build({...value,marker:'none'});assert.deepEqual(items.filter(o=>o.name==='強調短句').map(o=>o.color),plain.objects.flatMap(g=>g.items||[g]).filter(o=>o.name==='強調短句').map(o=>o.color));
   if(value.style==='side')assert(items.some(o=>o.name==='3 pt 側邊條'));
  }
  for(const marker of ['marker','underline']){const model=F.build({layout:'2',marker,color:'yellow'}),slide=parse(F.slideXml(model,4));assert.equal(els(slide,A,'highlight').length,1);assert.equal(els(els(slide,A,'highlight')[0],A,'srgbClr')[0].getAttribute('val'),'F9F0D4');}
 });
 for(const script of ['deck.js','fixed-master-data.js','native-styles.js','fixed-master.js'])w.eval(fs.readFileSync(path.join(ROOT,script),'utf8'));
 const host=d.getElementById('host'),get=sel=>{const el=host.querySelector(sel);assert(el,'Missing '+sel);return el;},state=()=>JSON.parse(JSON.stringify(w.FixedMaster.getState(host)));
 const onChange=()=>{};
 await test('One main download precedes twenty-six previews; hidden legacy helper and state remain compatible',()=>{
  w.FixedMaster.render(host,{state:{paletteSource:'theme',focus:'保留的舊文字',highlightColor:'navy'},onChange,onDownload:async()=>true});assert.equal(state().paletteSource,'theme');
  assert.deepEqual(Array.from(w.FixedMaster.SINGLE_SCHEMES,s=>s.label),['單欄07','單欄06','單欄03','單欄10','單欄04']);
  const palettes=[SELECTED07,['1F77B4','FF7F0E','2CA02C','D62728','9467BD','8C564B'],['4878D0','6ACC64','D65F5F','956CB4','D5BB67','82C6E2'],['8A7CA8','E098C7','8FD3E8','71669E','CC70AF','7CB4CC'],['4269D0','EFB118','FF725C','6CC5B0','3CA951','FF8AB7']];assert.deepEqual(JSON.parse(JSON.stringify(w.FixedMaster.SINGLE_SCHEMES.map(s=>s.accents))),palettes);
  assert.equal(host.querySelectorAll('[data-fm-download]').length,1);assert(get('[data-fm-download="template"]').textContent.includes('26 頁母片'));assert(get('.fmActions').compareDocumentPosition(get('.fmOrigins'))&w.Node.DOCUMENT_POSITION_FOLLOWING);assert(!host.querySelector('[data-fm-download="materials"]'));assert.equal(typeof w.FixedMaster.exportMaterials,'function');
  assert.equal(host.querySelectorAll('[data-fm-field]').length,0);assert(!host.querySelector('[data-fm-download="current"]'));assert.equal(host.querySelectorAll('.fmOrigins figure').length,26);
  assert.equal(state().focus,'保留的舊文字');assert.equal(state().highlightColor,'navy');const restored=d.createElement('div');d.body.appendChild(restored);w.FixedMaster.render(restored,{state:state()});assert.equal(w.FixedMaster.getState(restored).paletteSource,'theme');assert.equal(w.FixedMaster.getState(restored).focus,'保留的舊文字');assert.equal(restored.querySelector('.fmOrigins').innerHTML,get('.fmOrigins').innerHTML);restored.remove();
 });
 await test('Global theme/font input cannot replace fixed-source palette or content',()=>{
  const before=state(),model=JSON.stringify(w.FixedMaster.build(before)),previews=get('.fmOrigins').innerHTML;
  w.FixedMaster.render(host,{state:{...before,P:'00FF00',font:'Arial',base:'wine'},onChange,onDownload:async()=>true});assert.equal(JSON.stringify(w.FixedMaster.build(state())),model);assert.equal(get('.fmOrigins').innerHTML,previews);assert.equal(state().paletteSource,'theme');
 });
 await test('Main export snapshots selection once, ignores double click, and restores after cancel/failure',async()=>{
  const captured=[];let resolve;w.FixedMaster.render(host,{onChange,onDownload:value=>{captured.push(value);return new Promise(r=>resolve=r);}});
  const before=state(),button=get('[data-fm-download="template"]');button.click();button.click();assert.equal(captured.length,1);assert.equal(captured[0].mode,'template');assert.equal(captured[0].selection.paletteSource,'theme');assert(get('[data-fm-download="template"]').disabled);
  w.FixedMaster.render(host,{state:{...before,paletteSource:'common',focus:'另一段文字'},onChange,onDownload:async()=>true});assert.deepEqual(state(),before,'Busy rerender cannot change export snapshot');assert.deepEqual(JSON.parse(JSON.stringify(captured[0].selection)),before);
  assert(get('[data-fm-download="template"]').disabled,'Rerender cannot start another operation');resolve(false);await until(()=>!get('[data-fm-download="template"]').disabled);assert(get('[data-fm-status]').textContent.includes('已取消'));assert.deepEqual(state(),before);
  w.FixedMaster.render(host,{onChange,onDownload:async()=>{throw Error('simulated failure');}});get('[data-fm-download="template"]').click();await until(()=>!get('[data-fm-download="template"]').disabled);assert(get('[data-fm-status]').textContent.includes('simulated failure'));assert.deepEqual(state(),before);
  w.FixedMaster.render(host,{onChange,onDownload:async()=>true});get('[data-fm-download="template"]').click();await until(()=>!get('[data-fm-download="template"]').disabled);assert(get('[data-fm-status]').textContent.includes('26 頁母片'));assert.deepEqual(state(),before);
 });
 await test('Retired example state remains stored but cannot block the main download',async()=>{
  const modes=[];w.FixedMaster.render(host,{state:{...state(),focus:'長'.repeat(17)},onChange,onDownload:async({mode})=>{modes.push(mode);return true;}});get('[data-fm-download="template"]').click();await until(()=>!get('[data-fm-download="template"]').disabled);assert.deepEqual(modes,['template']);assert.equal(state().focus.length,17);
 });
 console.log(JSON.stringify({checks,mainPages:26,legacyInternalExamplePages:4,materialsPages:3,highlightColors:8,fixtureFiles:10,sourceSHA256:rawHash,RibbonUI:'not covered',PowerPointVisual:'not covered'}));dom.window.close();
})().catch(err=>{console.error(err);dom.window.close();process.exitCode=1;});
