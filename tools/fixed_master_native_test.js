/* Native palette / highlight contract. XML and DOM checks do not certify Ribbon UI. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom'),F=require('../fixed-master.js'),DATA=require('../fixed-master-data.js'),Z=require('../jszip.min.js');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'out/fixed-master-native');
const A='http://schemas.openxmlformats.org/drawingml/2006/main',P='http://schemas.openxmlformats.org/presentationml/2006/main';
// Independent, literal acceptance contract: never derive expected colors from NativeStyles.
const COLORS=['D95D68','E7BF4A','4E83CE','4B9679','7D8795','9371C6','FFFFFF'];
const HIGHLIGHTS=['F6D8DB','F9F0D4','D5E1F3','D4E6DF','E0E2E6','E5DDF1','FFFFFF'];
const KEYS=['red','yellow','blue','green','gray','purple','white'];
const ORIGINAL=['4472C4','ED7D31','A5A5A5','FFC000','5B9BD5','70AD47'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const dom=new JSDOM('<!doctype html><html><head></head><body><div id="host"></div></body></html>',{runScripts:'outside-only',url:'https://fixed-master.test/'});
const w=dom.window,d=w.document,parse=xml=>{const v=new w.DOMParser().parseFromString(xml,'application/xml');assert.equal(v.getElementsByTagName('parsererror').length,0,xml.slice(0,250));return v;};
const els=(v,ns,name)=>Array.from(v.getElementsByTagNameNS(ns,name));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(test){const end=Date.now()+3000;while(!test()){if(Date.now()>end)throw Error('UI did not settle');await delay(5);}}
let checks=0;async function test(name,fn){await fn();checks++;console.log('PASS '+name);}
(async()=>{
 const original=await Z.loadAsync(F.originalBytes());fs.mkdirSync(OUT,{recursive:true});
 const themes=Object.keys(DATA.parts).filter(n=>/\/theme[^/]*\.xml$/.test(n));
 const sourceTheme=await original.file('ppt/theme/theme1.xml').async('string');
 const rawHash=hash(fs.readFileSync(path.join(ROOT,'fixed-master/TSMC_Template.pptx')));
 await test('Legacy saved selections keep shape markers and text while new export palette defaults common',()=>{
  for(const marker of ['marker','underline','none']){const s=F.normalize({layout:'7',style:'solid',marker,color:'white',focus:'既有重點'});assert.equal(s.marker,marker);assert.equal(s.layout,'2');assert.equal(s.style,'solid');assert.equal(s.focus,'既有重點');assert.equal(s.paletteSource,'common');}
  assert.equal(F.normalize({paletteSource:'theme',marker:'highlight'}).paletteSource,'theme');
  assert.equal(F.normalize({paletteSource:'invalid'}).paletteSource,'common');
 });
 const outputs={};
 for(const source of ['common','theme'])await test(source+' download preserves three pages and original parts except declared accents/MRU',async()=>{
  const bytes=await F.exportPptx(Z,[],{source}),zip=await Z.loadAsync(bytes);outputs[source]=zip;
  fs.writeFileSync(path.join(OUT,'template-'+source+'-3pages.pptx'),bytes);
  assert.equal(els(parse(await zip.file('ppt/presentation.xml').async('string')),P,'sldId').length,3);
  assert.equal(Object.keys(zip.files).filter(n=>/^ppt\/slides\/[^/]+\.xml$/.test(n)).length,3);
  for(const name of themes){const before=await original.file(name).async('string'),after=await zip.file(name).async('string');parse(after);
   const expected=source==='theme'?before:before.replace(/<a:accent([1-6])>[\s\S]*?<\/a:accent\1>/g,(_,i)=>`<a:accent${i}><a:srgbClr val="${COLORS[i-1]}"/></a:accent${i}>`);
   assert.equal(after,expected,'Exactly six accent slots; preserve all other theme bytes '+name);
   for(const role of ['dk1','lt1','dk2','lt2','hlink','folHlink']){const pattern=new RegExp('<a:'+role+'>[\\s\\S]*?</a:'+role+'>');assert.equal(after.match(pattern)[0],before.match(pattern)[0]);}
  }
  for(const name of Object.keys(DATA.parts).filter(n=>/^ppt\/(?:slideMasters|slideLayouts|media)\//.test(n)&&!themes.includes(n)))assert.equal(hash(await zip.file(name).async('uint8array')),DATA.parts[name],name);
  for(const name of ['ppt/slides/slide1.xml','ppt/slides/slide2.xml']){const strip=s=>s.replace(/(<a:fld\b[^>]*type="slidenum"[\s\S]*?<a:t>)\d+(<\/a:t>)/g,'$1PAGE$2');assert.equal(strip(await zip.file(name).async('string')),strip(await original.file(name).async('string')));}
  const props=parse(await zip.file('ppt/presProps.xml').async('string')),mru=els(props,P,'clrMru');assert.equal(mru.length,1);assert.equal(els(mru[0],A,'srgbClr').length,7);assert.equal(els(mru[0],A,'srgbClr')[0].getAttribute('val'),'FFFFFF');
  if(source==='common')assert.deepEqual(els(mru[0],A,'srgbClr').map(c=>c.getAttribute('val')).reverse(),HIGHLIGHTS);
  assert.equal(hash(F.originalBytes()),rawHash);assert.equal(rawHash,'1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae');
 });
 await test('Palette changes do not silently modify any of the three slide contents or add a gallery',async()=>{
  for(const name of ['slideCover','slide1','slide2'])assert.equal(await outputs.common.file('ppt/slides/'+name+'.xml').async('string'),await outputs.theme.file('ppt/slides/'+name+'.xml').async('string'));
  assert.deepEqual(F.ORIGINAL_ACCENTS,ORIGINAL);for(let i=0;i<6;i++)assert(sourceTheme.includes(`<a:accent${i+1}><a:srgbClr val="${ORIGINAL[i]}"/></a:accent${i+1}>`));
 });
 for(let i=0;i<KEYS.length;i++)await test('Editable native text highlight uses exact soft '+KEYS[i]+' and no marker shape',async()=>{
  const value={layout:'4',style:'solid',marker:'highlight',color:KEYS[i],focus:'原生柔色測試'},model=F.build(value),xml=F.slideXml(model,4),slide=parse(xml);
  assert.deepEqual(els(slide,A,'highlight').map(h=>els(h,A,'srgbClr')[0].getAttribute('val')),[HIGHLIGHTS[i],HIGHLIGHTS[i]]);
  assert(!model.objects.flatMap(g=>g.items||[g]).some(o=>o.name==='螢光筆底帶'));
  for(const h of els(slide,A,'highlight')){assert.equal(h.parentElement.localName,'rPr');assert.equal(els(h,A,'alpha').length,0);assert.equal(els(h.parentElement,A,'latin')[0].getAttribute('typeface'),'微軟正黑體');assert.equal(els(h.parentElement,A,'solidFill')[0].textContent,'');assert.equal(els(els(h.parentElement,A,'solidFill')[0],A,'srgbClr')[0].getAttribute('val'),'333333');}
  assert.equal(els(slide,P,'pic').length,0);assert(!xml.includes('normAutofit'));assert(!xml.includes('252A34'));
  const bytes=await F.exportPptx(Z,[value],{source:'common'}),zip=await Z.loadAsync(bytes);assert.equal(els(parse(await zip.file('ppt/presentation.xml').async('string')),P,'sldId').length,4);assert.equal(await zip.file('ppt/slides/slide4.xml').async('string'),xml);
  fs.writeFileSync(path.join(OUT,'highlight-'+KEYS[i]+'-4pages.pptx'),bytes);
 });
 await test('Half-height and full-height legacy bands remain editable shapes, not a:highlight',async()=>{
  for(const [marker,alpha]of [['marker',24000],['underline',35000]]){const model=F.build({layout:'2',marker,color:'yellow'}),slide=parse(F.slideXml(model,4)),items=model.objects.flatMap(g=>g.items||[g]);assert.equal(els(slide,A,'highlight').length,0);assert.equal(items.filter(o=>o.name==='螢光筆底帶').length,1);assert.equal(items.find(o=>o.name==='螢光筆底帶').alpha,alpha);assert(items.find(o=>o.name==='螢光筆底帶').h<items.find(o=>o.name==='強調短句').h);}
  fs.writeFileSync(path.join(OUT,'half-height-yellow-4pages.pptx'),await F.exportPptx(Z,[{layout:'2',marker:'underline',color:'yellow'}]));
 });
 for(const script of ['fixed-master-data.js','native-styles.js','fixed-master.js'])w.eval(fs.readFileSync(path.join(ROOT,script),'utf8'));
 const host=d.getElementById('host'),get=sel=>{const el=host.querySelector(sel);assert(el,'Missing '+sel);return el;},state=()=>JSON.parse(JSON.stringify(w.FixedMaster.getState(host)));
 let persisted;const onChange=s=>{persisted=s;},set=(key,value)=>{const el=get('[data-fm-field="'+key+'"]');el.focus();el.value=value;el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};
 await test('Palette UI is outside optional examples, has six accents plus white, and preserves focus/state',()=>{
  w.FixedMaster.render(host,{onChange,onDownload:async()=>true});assert.equal(state().paletteSource,'common');assert.equal(get('[data-fm-field="paletteSource"]').closest('[data-fm-examples]'),null);assert.equal(host.querySelectorAll('.fmAccentList li').length,7);assert(get('.fmSeparate').textContent.includes('不改 Text1'));
  set('paletteSource','theme');assert.equal(d.activeElement.dataset.fmField,'paletteSource');assert.equal(state().paletteSource,'theme');assert.equal(persisted.paletteSource,'theme');assert(get('.fmAccentList i').style.background.includes('68, 114, 196'));
  set('marker','highlight');set('focus','可編輯重點');assert.equal(persisted.marker,'highlight');assert(host.textContent.includes('不替換內建 15 色'));assert(host.textContent.includes('並非工具列文字醒目提示'));
  get('[data-fm-color="white"]').click();assert.equal(get('.fmWhiteDemo span').style.background,'rgb(255, 255, 255)');assert.equal(get('.fmWhiteDemo span').style.color,'rgb(51, 51, 51)');assert.equal(state().color,'white');
  const restored=d.createElement('div');d.body.appendChild(restored);w.FixedMaster.render(restored,{state:JSON.parse(JSON.stringify(persisted))});assert.equal(w.FixedMaster.getState(restored).paletteSource,'theme');assert.equal(w.FixedMaster.getState(restored).marker,'highlight');restored.remove();
 });
 await test('Global theme/font input cannot replace fixed-source palette or content',()=>{
  const before=state(),model=JSON.stringify(w.FixedMaster.build(before)),svg=get('[data-fm-preview]').innerHTML;
  w.FixedMaster.render(host,{state:{...before,P:'00FF00',font:'Arial',base:'wine'},onChange,onDownload:async()=>true});assert.equal(JSON.stringify(w.FixedMaster.build(state())),model);assert.equal(get('[data-fm-preview]').innerHTML,svg);assert.equal(state().paletteSource,'theme');
 });
 await test('Busy export captures palette/marker once, ignores double click, and restores after cancel/failure',async()=>{
  const captured=[];let resolve;w.FixedMaster.render(host,{onChange,onDownload:value=>{captured.push(value);return new Promise(r=>resolve=r);}});
  const before=state(),button=get('[data-fm-download="current"]');button.click();button.click();assert.equal(captured.length,1);assert.equal(captured[0].selection.paletteSource,'theme');assert.equal(captured[0].selection.marker,'highlight');assert(get('[data-fm-field="paletteSource"]').disabled);
  set('paletteSource','common');assert.equal(state().paletteSource,'theme','Disabled events cannot change export snapshot');assert.deepEqual(JSON.parse(JSON.stringify(captured[0].selection)),before);
  w.FixedMaster.render(host,{onChange,onDownload:async()=>true});assert(get('[data-fm-download="current"]').disabled,'Rerender cannot start another operation');resolve(false);await until(()=>!get('[data-fm-download="current"]').disabled);assert(get('[data-fm-status]').textContent.includes('已取消'));assert.deepEqual(state(),before);
  w.FixedMaster.render(host,{onChange,onDownload:async()=>{throw Error('simulated failure');}});get('[data-fm-download="template"]').click();await until(()=>!get('[data-fm-download="template"]').disabled);assert(get('[data-fm-status]').textContent.includes('simulated failure'));assert.deepEqual(state(),before);
  w.FixedMaster.render(host,{onChange,onDownload:async()=>true});get('[data-fm-download="template"]').click();await until(()=>!get('[data-fm-download="template"]').disabled);assert(get('[data-fm-status]').textContent.includes('三頁母片'));assert.deepEqual(state(),before);
 });
 await test('Invalid optional content blocks only the optional example without shrinking or altering state',async()=>{
  let count=0;w.FixedMaster.render(host,{onChange,onDownload:async()=>{count++;return true;}});set('focus','長'.repeat(17));get('[data-fm-download="current"]').click();await until(()=>!get('[data-fm-download="current"]').disabled);assert.equal(count,0);assert.equal(state().focus.length,17);assert(get('[data-fm-status]').textContent.includes('不會自動縮字'));get('[data-fm-download="template"]').click();await until(()=>!get('[data-fm-download="template"]').disabled);assert.equal(count,1);assert.equal(state().focus.length,17);
 });
 console.log(JSON.stringify({checks,mainPages:3,explicitExamplePages:4,highlightColors:7,fixtureFiles:10,sourceSHA256:rawHash,RibbonUI:'not covered',PowerPointVisual:'not covered'}));dom.window.close();
})().catch(err=>{console.error(err);dom.window.close();process.exitCode=1;});
