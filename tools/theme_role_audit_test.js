/* Full registered-page role audit using the repository's browser exporter.
 * --bundle also checks the regenerated single file.
 * These checks prove model/SVG/OOXML role consistency, not Office visual fidelity.
 */
'use strict';
const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const D=require('../deck.js');
const EXPORT_ENV=require('./bundled_export_env.js');
const ROOT=path.resolve(__dirname,'..');
const clone=x=>JSON.parse(JSON.stringify(x));
const roles=['P','PD','PT','A','ink','t2','mute','line','l2','fill','cardLine','cnC','semWarn','semGood','semBad'];
const tokens=['047A83','2E1784','E4CDF1','D12A69','122C17','37330F','6D1F53','98B4B9','CBD2AC','F2DAE6','352911','1A5B3D','E5A300','3E9C42','C73E28'];
const custom={...D.BASE,...Object.fromEntries(roles.map((r,i)=>[r,tokens[i]])),id:'sentinel',zh:'Sentinel palette',sh:false};
const palettes=['navy','wire','green','wine'].map(id=>D.PRESETS.find(p=>p.id===id)).concat(custom);
const selectedText=new Set(['金句','姓名','情境膠囊']);
const fixedNeutral=new Set(['5B6474','D0D7E2','B8C4D3','8A94A6']);
const fixedStatus={success:'207345',attention:'806000',warning:'A14D00',danger:'B3261E',neutral:'596675'};
let checks=0,nativeSlides=0,svgSlides=0;
function verify(condition,label){checks++;assert(condition,label);}
function colors(value,prefix='',out={}){
 if(!value||typeof value!=='object')return out;
 for(const[k,v]of Object.entries(value)){const p=prefix?prefix+'.'+k:k;
  if(typeof v==='string'&&/^[\da-f]{6}$/i.test(v)&&!['t','name','data','id'].includes(k))out[p]=v.toUpperCase();
  else if(v&&typeof v==='object')colors(v,p,out);
 }return out;
}
function paints(it){
 const out=[];for(const k of ['fill','line','color'])if(typeof it[k]==='string'&&/^[\da-f]{6}$/i.test(it[k]))out.push(it[k].toUpperCase());
 for(const r of it.runs||[])if(r.t&&r.o&&r.o.color)out.push(r.o.color.toUpperCase());
 return [...new Set(out)];
}
function fixedReason(sl,index,color){
 const group=sl.groups.find(g=>index>=g.from&&index<=g.to);
 if(sl.key==='iconvariants'&&group?.iconStyle&&group.iconStyle.state!=='brand')return 'fixed semantic icon state '+group.iconStyle.state;
 if(sl.key==='rating'&&color==='8EA9DB')return 'fixed categorical status: At risk';
 if(fixedNeutral.has(color))return 'fixed neutral reference text/rule/map boundary';
 const rgb=[0,2,4].map(i=>parseInt(color.slice(i,i+2),16));
 if(Math.max(...rgb)-Math.min(...rgb)<=15)return 'fixed white/black/neutral surface or line';
 return null;
}
function quoteContract(sl,p){
 const items=sl.items.filter(it=>selectedText.has(it.name));
 assert.equal(items.length,5,'E7 has quote, name and three context pills');
 for(const it of items)for(const run of it.runs||[])assert.equal(run.o.color,p.PD,'E7 '+it.name+' must use PD');
}
function hue(hex){const[r,g,b]=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));const hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo;if(d<4)return null;return ((hi===r?(g-b)/d:hi===g?2+(b-r)/d:4+(r-g)/d)*60+360)%360;}
function catalogueContract(sl,p){
 const expected={main:p.P,deep:p.PD,light:p.PT};
 for(const g of sl.groups){const its=sl.items.slice(g.from,g.to+1);
  if(g.schemeStyle==='03A')assert.equal(its.find(it=>it.kind==='roundRect').fill,expected.light,'03A follows PT');
  if(g.schemeStyle==='03C'&&g.schemeBody){const blocks=its.filter(it=>it.kind&&it.fill);assert.equal(blocks[0].fill,expected.main,'03C band follows P');assert.equal(blocks[1].fill,expected.deep,'03C title follows PD');}
  if(g.schemeStyle==='03E'&&g.schemeBody){const blocks=its.filter(it=>it.kind&&it.fill),band=blocks[0].fill;
   assert.equal(blocks[1].fill,expected.main,'03E title follows P');
   assert.notEqual(band,p.semWarn,'03E must not use warning color');
   const hp=hue(p.P),hb=hue(band);if(hp!==null){assert.notEqual(hb,null);const delta=Math.abs(hp-hb);assert(Math.min(delta,360-delta)<2,'03E medium band must keep P hue');}
  }
 }
}
function auditDependencies(){
 const baseline=D.buildModel({...D.BASE,sh:false});
 const variants=roles.map((role,i)=>[role,D.buildModel({...D.BASE,sh:false,[role]:tokens[i]})]);
 assert.deepEqual(baseline.slides.map(s=>s.key),D.SLIDES.map(s=>s[0]),'enumerate every registered page');
 return baseline.slides.map((sl,index)=>{
  const original=colors(sl.items),dependent={};
  for(const[role,m]of variants){const changed=colors(m.slides[index].items);for(const p of Object.keys(original))if(original[p]!==changed[p])(dependent[p]||(dependent[p]=[])).push(role);}
  const fixed=Object.entries(original).filter(([p])=>!dependent[p]).map(([p,color])=>{
   const itemIndex=+p.split('.')[0],reason=fixedReason(sl,itemIndex,color);
   verify(!!reason,sl.key+' unclassified fixed color '+color+' in '+sl.items[itemIndex].name+' '+p);
   return{path:p,color,item:sl.items[itemIndex].name||sl.items[itemIndex].t,reason};
  });
  verify(Object.values(dependent).some(a=>a.includes('P')),sl.key+' exposes a primary theme slot');
  return{key:sl.key,code:D.SLIDES[index][2],title:D.SLIDES[index][1],items:sl.items.length,groups:sl.groups.length,paintSlots:Object.keys(original).length,
   roles:[...new Set(Object.values(dependent).flat())],dependent,fixed,
   download:D.SCHEME_CATALOGUE_KEYS.includes(sl.key)?'single page / dedicated four-page catalogue / element':'single page / full standard deck / element when grouped'};
 });
}
function svgCheck(sl,api=D){
 const svg=api.toSvg(sl,{id:'role-'+sl.key});svgSlides++;
 for(const it of sl.items){if(it.t==='pic')continue;for(const color of paints(it))verify(svg.includes('#'+color),sl.key+' SVG missing '+color+' for '+it.name);}
 return svg;
}
async function nativeCheck(api,p,keys){
 const env=EXPORT_ENV;
 const result=await api.exportPptx(env,p,{only:keys,type:'nodebuffer'});
 const zip=await env.JSZip.loadAsync(result.data);
 const files=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n));
 assert.equal(files.length,keys.length,'native export page count');
 for(const[si,sl]of result.model.slides.entries()){
  nativeSlides++;const xml=await zip.file('ppt/slides/slide'+(si+1)+'.xml').async('string');
  const native=xml.match(/<p:(?:sp|cxnSp|graphicFrame)>[\s\S]*?<\/p:(?:sp|cxnSp|graphicFrame)>/g)||[];
  for(const[index,it]of sl.items.entries()){
   if(it.t==='pic')continue;
   const block=native.find(x=>new RegExp('<p:cNvPr id="'+(index+2)+'"').test(x));
   verify(!!block,sl.key+' native editable item '+index+' exists');
   for(const color of paints(it))verify(block.includes('val="'+color+'"'),sl.key+' native slot '+index+' '+it.name+' has '+color);
  }
 }
 return result;
}
function loadBundle(){
 const html=fs.readFileSync(path.join(ROOT,'PPT-Style-Studio.html'),'utf8');
 const match=html.match(/<script data-inlined="deck\.js">([\s\S]*?)<\/script>/);
 assert(match,'single file contains deck module');
 const context={Icons:D.ICONS};vm.runInNewContext(match[1],context,{filename:'single-file/deck.js'});
 return context.Deck;
}
(async()=>{
 const pages=auditDependencies();
 const standard=D.SLIDES.map(s=>s[0]).filter(k=>!D.SCHEME_CATALOGUE_KEYS.includes(k));
 for(const p of D.PRESETS.concat(custom)){
  const model=D.buildModel(p);assert.equal(model.slides.length,76);
  for(const sl of model.slides)svgCheck(sl);
  quoteContract(model.slides.find(s=>s.key==='quote2'),p);
  for(const sl of model.slides.filter(s=>D.SCHEME_CATALOGUE_KEYS.includes(s.key)))catalogueContract(sl,p);
  const semantics=model.slides.find(s=>s.key==='iconvariants');
  for(const g of semantics.groups.filter(g=>g.iconStyle&&g.iconStyle.state!=='brand')){
   const tone=fixedStatus[g.iconStyle.state];verify(!!tone,'known fixed semantic state');
   verify(semantics.items.slice(g.from,g.to+1).some(it=>paints(it).includes(tone)),p.id+' semantic '+g.iconStyle.state+' remains '+tone);
  }
 }
 // Mutation checks deliberately introduce the former class of defect. They must
 // fail an independent role contract, even if a resolver reports the same error.
 const sentinel=D.buildModel(custom),q=clone(sentinel.slides.find(s=>s.key==='quote2'));
 for(const it of q.items.filter(it=>selectedText.has(it.name)))for(const run of it.runs||[])run.o.color='1F3864';
 assert.throws(()=>quoteContract(q,custom),/must use PD/);checks++;
 const cat=clone(sentinel.slides.find(s=>s.key==='schemebody'));
 for(const g of cat.groups.filter(g=>g.schemeStyle==='03E'))cat.items.slice(g.from,g.to+1).find(it=>it.kind==='roundRect').fill=custom.semWarn;
 assert.throws(()=>catalogueContract(cat,custom),/warning color/);checks++;
 const original=D.buildModel({...custom,semWarn:'E5A300'},{only:D.SCHEME_CATALOGUE_KEYS});
 const changed=D.buildModel({...custom,semWarn:'10DB72',semBad:'F809F2'},{only:D.SCHEME_CATALOGUE_KEYS});
 assert.deepEqual(changed.slides,original.slides,'decorative catalogue unaffected by semantic warnings');checks++;
 if(!process.argv.includes('--model-only'))for(const p of palettes){await nativeCheck(D,p,standard);await nativeCheck(D,p,D.SCHEME_CATALOGUE_KEYS);console.log('PASS native '+p.id+' all 76 pages');}
 let bundleChecked=false;
 if(process.argv.includes('--bundle')){
  const B=loadBundle();
  for(const p of D.PRESETS.concat(custom)){
   const source=D.buildModel(p),bundled=B.buildModel(p);
   assert.deepEqual(clone(bundled.slides),clone(source.slides),p.id+' single-file model matches source');checks++;
   for(const sl of bundled.slides)svgCheck(sl,B);
  }
  if(!process.argv.includes('--model-only')){await nativeCheck(B,custom,standard);await nativeCheck(B,custom,D.SCHEME_CATALOGUE_KEYS);}
  bundleChecked=true;
 }
 const routes=[
  ['bAll','all standard pages','Deck.exportPptx (excludes long catalogues)'],['bOne','current page','Deck.exportPptx only:[key]'],
  ['bSchemeCatalogue','A15-A18 four-page pack','Deck.exportPptx only:SCHEME_CATALOGUE_KEYS'],['selected element PPTX','current group','Deck.exportElement'],
  ['selected element SVG/PNG','current group','Deck.elementSvg / browser raster conversion'],['search selected','one page per selected group','Deck.trayDeck -> exportPptx'],
  ['recipe','recipe page keys','Deck.exportPptx only:keys'],['iPackDownload','selected icon 24+9 native variants','Deck.iconPackModel -> exportPptx'],
  ['icon single PPTX/SVG/PNG','selected icon','Deck.buildModel icon / exportPptx / SVG / browser raster'],['iZip','selected icon set ZIP','per-icon exports -> ZIP'],
  ['table PPTX','complete paginated table','Deck.buildModel table -> exportPptx'],['table TSV/HTML/copy','table source/current explicit page','table source / Deck.tableHtml'],
  ['tray model API (no separate active download button)','saved snapshot composition or each group page','Deck.trayModel / trayDeck; search selected uses trayDeck'],
  ['skPptx / skPotx / skXml','chosen one of 13 static palettes','stylekit/<id>.pptx, .potx, _colors.xml; embedded blobs in single file'],
  ['PPT-Style-Studio.html','standalone app','same modules and embedded 39 Style Kit assets'],['gen.js CLI','selected presets/full standard pages','Deck.exportPptx']
 ];
 const exportSites=[];
 for(const filename of ['studio.html','stylekit.js','quickstyles.js'])if(fs.existsSync(path.join(ROOT,filename)))fs.readFileSync(path.join(ROOT,filename),'utf8').split(/\r?\n/).forEach((line,i)=>{
  if(/saveBlob\(|checkedExport\(|\.exportPptx\(|\.exportElement\(|download=|stylekit-download/.test(line))exportSites.push({file:filename,line:i+1,source:line.slice(0,1000)});
 });
 const report={base:'bc7aa828cc084b07084f6da8afd43fa847f7c9b7',exporter:EXPORT_ENV.evidence,pageCount:pages.length,presetCount:D.PRESETS.length,palettes:palettes.map(p=>p.id),checks,svgSlides,nativeSlides,bundleChecked,
  scope:'Model, SVG serialization and native OOXML paint roles; no browser pixel or PowerPoint visual claims.',routes,exportSites,pages,
  fixedPolicy:['White/black and neutral panels, rules, body/reference grays remain fixed unless exposed token governs them.','Icon success/attention/warning/danger/neutral are explicit semantic categories.','C2 At risk has fixed categorical 8EA9DB; preserve status meaning.','Existing brand/logo image bytes and manual overrides are not retinted.','Static Style Kit uses its selected named palette; custom global colors cannot silently claim to change these files.']};
 const reportName='theme-audit'+(process.argv.includes('--model-only')?(bundleChecked?'-bundle':'-model'):'');
 fs.mkdirSync(path.join(ROOT,'review'),{recursive:true});fs.writeFileSync(path.join(ROOT,'review',reportName+'.json'),JSON.stringify(report,null,2)+'\n');
 const lines=['# Theme/style audit','',
  'Base: `bc7aa828cc084b07084f6da8afd43fa847f7c9b7`. Local role/serialization audit; PowerPoint visual evidence is maintained separately.','',
  '## Confirmed local correction','',
  'E7 `quote2` used hardcoded `1F3864` for its quote, name and three context pills (three source sites / five editable objects). They now use `PD`. P-linked backgrounds already followed the theme. Geometry, fonts, neutral text, and shadows are unchanged.','',
  'The independent sentinel contract requires every affected run to equal PD. A deliberate `1F3864` mutation is rejected. A separate mutation binding decorative A16 03E bands to semWarn is rejected by the P-hue contract.','',
  '## Coverage','',
  '- All '+pages.length+' registered pages, all '+D.PRESETS.length+' presets plus a deliberately distinct sentinel palette: model and SVG.','- Native whole-deck export: blue/navy, purple/wire, green, wine and sentinel; 72 standard pages plus the dedicated four catalogue pages per palette.','- This invocation: '+svgSlides+' SVG pages, '+nativeSlides+' native pages, '+checks+' assertions; single-file parity checked: '+bundleChecked+'.','- Style Kit assets: separate `tools/stylekit_assets_test.py` validates 13 palettes / 39 files, all 12 color slots, relationships, content types, four slides, masters/layouts and fmtScheme.','- Browser pixel appearance, live download clicks and Microsoft PowerPoint rendering are separate acceptance layers.','',
  '## Fixed-color policy','',...report.fixedPolicy.map(x=>'- '+x),'',
  'Low-chroma fixed reference colors are explicit: `5B6474` text, `D0D7E2` grid, `B8C4D3` map boundary and `8A94A6` guide line. Fixed icon semantic colors are success `207345`, attention `806000`, warning `A14D00`, danger `B3261E`, neutral `596675`. Existing image/logo bytes and manual overrides are preserved.','',
  '## All registered pages','',
  '| Code | Page key | Page | Dynamic roles observed | Fixed paint slots |','|---|---|---|---|---:|',
  ...pages.map(p=>'| '+[p.code,p.key,p.title,p.roles.join(', '),p.fixed.length].join(' | ')+' |'),'',
  'The JSON companion records each dynamic color slot and its role dependencies, and each fixed color slot with its reason. Dependencies are identified by changing one input at a time; expected bug-regression contracts are independently specified, not copied from a resolver.','',
  '## Download/serialization paths','',
  '| Entry | Scope | Implementation |','|---|---|---|',...routes.map(r=>'| '+r.join(' | ')+' |'),'',
  'The JSON companion also automatically records every matching download/export call site in the current source, including settings JSON/TSV recovery routes. New quick-style entry points are covered by their dedicated native tests.',''];
 fs.writeFileSync(path.join(ROOT,'review',reportName+'.md'),lines.join('\n'));
 console.log('Theme audit: '+checks+' checks, '+svgSlides+' SVG pages, '+nativeSlides+' native pages; bundle='+bundleChecked);
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
