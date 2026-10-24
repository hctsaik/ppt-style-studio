/* Selected-icon pack: complete native two-page exports plus real DOM download logic.
 * node tools/icon_pack_test.js [--model-only|--dom-only]
 * STUDIO_HTML=PPT-Style-Studio.html node tools/icon_pack_test.js --dom-only
 * DOM checks inspect the generated download Blob, not browser layout/OS download UX.
 */
'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const D=require('../deck'),O=require('./overlap'),R=require('./readorder');
const PptxGenJS=require('pptxgenjs'),JSZip=require('jszip');
const ROOT=path.resolve(__dirname,'..'),REPRESENTATIVE=['wafer','groups','settings','fingerprint','star'];
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
const plain=x=>JSON.parse(JSON.stringify(x));
const glyphs=m=>m.slides.flatMap(s=>s.items.filter(i=>i.ic));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,ms=30000){const start=Date.now();while(!fn()){if(Date.now()-start>ms)throw Error('Timeout: '+label);await sleep(20);}}
function assertGeometry(it,id){
 assert.equal(it.kind,'custGeom');assert.equal(it.ic.id,id);assert.equal(it.name,'圖示 '+D.ICONS.BY[id].zh);
 const geom=D.ICONS.geom(it.ic.variant,it.ic.wt);
 assert.deepEqual(plain(it.points),D.ICONS.points(id,it.w,geom.k,geom.off,geom.wt),'Geometry must be the selected icon, not just renamed metadata');
 assert(it.points.some(p=>p.close),'Icon has closed native subpaths');
 for(const p of it.points){if(p.close)continue;assert(Number.isFinite(p.x)&&Number.isFinite(p.y));if(p.curve)for(const key of ['x1','y1','x2','y2'])assert(Number.isFinite(p.curve[key]));}
}
function assertPack(model,id,{geometry=true}={}){
 assert.deepEqual(plain(model.iconPack),{id,name:D.ICONS.BY[id].zh,bases:24,components:9,pages:2});
 assert.deepEqual(model.slides.map(s=>s.key),['iconvariants','iconcomponents']);
 assert.deepEqual(model.slides.map(s=>s.no),[1,2]);
 assert.deepEqual(model.slides.map(s=>s.groups.length),[24,9]);
 assert.deepEqual(model.slides.map(s=>s.items.filter(i=>i.ic).length),[24,16]);
 assert.deepEqual(model.warns,[]);
 assert.equal(glyphs(model).length,40);
 model.slides.forEach((s,si)=>{
  const w=s.W||model.W||D.W,h=s.H||model.H||D.H;
  assert(s.title.includes(D.ICONS.BY[id].zh));
  assert(s.items.some(i=>D.textOf(i)===`${String(si+1).padStart(2,'0')} / 02`),'Page footer is relative to the two-page pack');
  assert(!s.items.some(i=>/\d+ \/ 72/.test(D.textOf(i))),'No catalog page count leaks into the pack');
  assert.deepEqual(O.overlaps(s),[]);assert.deepEqual(R.readOrder(s),[]);
  assert(s.items.every(i=>i.t!=='pic'));
  s.items.forEach(i=>{if(i.t==='ln')return;assert(i.x>=-.01&&i.y>=-.01&&i.x+i.w<=w+.01&&i.y+i.h<=h+.01,`In bounds: ${s.key}/${i.name}`);});
  s.groups.forEach(g=>{
   const its=s.items.slice(g.from,g.to+1);assert(its.some(i=>i.ic));
   if(g.iconStyle){const base=its.find(i=>i.iconBase),ic=its.find(i=>i.ic),label=its.find(i=>i.iconStateLabel),paint=D.iconComponentPaint(g.iconStyle,model.params.P);
    assert.equal(base.fill,paint.fill);assert.equal(base.line,paint.line);assert.equal(base.ft,0);assert.equal(g.iconStyle.look==='outline',base.fill===null);
    assert.equal(ic.fill,paint.fg);assert(D.contrastOf(ic.fill,base.fill||'FFFFFF')>=4.5);assert.equal(D.textOf(label),paint.label);
   }
  });
 });
 if(geometry)glyphs(model).forEach(it=>assertGeometry(it,id));
}
async function assertNative(data,id){
 const zip=await JSZip.loadAsync(data),files=Object.keys(zip.files);
 assert.equal(files.filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).length,2);
 assert(!files.some(n=>n.startsWith('ppt/media/')),'Native pack must not include media files');
 const pres=await zip.file('ppt/presentation.xml').async('string');assert.equal((pres.match(/<p:sldId\b/g)||[]).length,2);
 for(let n=1;n<=2;n++){
  const xml=await zip.file(`ppt/slides/slide${n}.xml`).async('string');
  assert.equal((xml.match(/<p:grpSp>/g)||[]).length,n===1?24:9);
  assert.equal((xml.match(/<a:custGeom>/g)||[]).length,n===1?24:16);
  assert(!/<p:pic\b|<a:blip\b|asvg:svgBlip/.test(xml),'No raster or embedded SVG fallback');
  assert.equal((xml.match(new RegExp('name="圖示 '+D.ICONS.BY[id].zh+'"','g'))||[]).length,n===1?24:16);
  assert(xml.includes(`>${String(n).padStart(2,'0')} / 02<`));
  assert(!/\b(?:NaN|Infinity)\b/.test(xml));
  if(n===1){const bases=(xml.match(/<p:sp>[\s\S]*?<\/p:sp>/g)||[]).filter(s=>s.includes('name="可調圖示底座"'));
   assert.equal(bases.length,24);
   bases.forEach((s,i)=>{const sp=s.match(/<p:spPr>[\s\S]*?<\/p:spPr>/)[0].replace(/<a:ln\b[^>]*>[\s\S]*?<\/a:ln>/g,'');assert.equal(sp.includes('<a:noFill/>'),i<6,'Outline bases retain actual noFill in native XML');});
  }
 }
 return zip;
}
async function modelSuite(){
 check('Pack headers retain theme brackets and calculate title dots from the chosen icon name',()=>{
  const framed=D.iconPackModel(D.PRESETS.find(p=>p.id==='frame'),'star');
  for(const sl of framed.slides)assert.equal(D.textOf(sl.items.find(i=>i.name==='標題')),'《'+sl.title+'》');
  const dotted=D.iconPackModel(D.PRESETS.find(p=>p.id==='charcoal'),'star');
  for(const sl of dotted.slides){const head=sl.items.find(i=>i.name==='標題'),dot=sl.items.find(i=>i.kind==='ellipse'&&i.y<1.5),text=D.textOf(head),size=dotted.params.tSize;
   assert(dot);assert(Math.abs(dot.x-(.6+D.tw(text,size)+(text.match(/[A-Za-z]/g)||[]).length*size/72*.07+.08))<.001,'Title dot follows final selected-icon heading');}
 });

 check('Pack API rejects empty, invalid and prototype icon IDs without fallback',()=>{
  assert.equal(typeof D.iconPackModel,'function');assert.equal(typeof D.iconPackFilename,'function');
  for(const id of [undefined,null,'','not_an_icon','constructor','__proto__','toString',{},['star']]){assert.throws(()=>D.iconPackModel(D.PRESETS[0],id));assert.throws(()=>D.iconPackFilename(id));}
 });
 check('Representative cases include original wafer and compound/hole-bearing glyphs',()=>{
  assert.equal(D.PRESETS.length,9);assert.equal(D.ICONS.LIST.length,521);
  REPRESENTATIVE.forEach(id=>assert(D.ICONS.segs(id,400).filter(p=>p[0]==='M').length>1));
 });
 const catalogBefore=JSON.stringify(D.SLIDES),presetsBefore=JSON.stringify(D.PRESETS);let matrix=0;
 for(const p of D.PRESETS){for(const size of ['S','M','L'])for(const id of REPRESENTATIVE){
   const params={...p,size},before=JSON.stringify(params),m=D.iconPackModel(params,id);assertPack(m,id);assert.equal(JSON.stringify(params),before);assert.equal(m.k,D.SIZE_K[size]);matrix++;
  }
  check(`${p.id}: five selected icons × S/M/L preserve 40 real glyphs, 33 groups, paint and order`,()=>{});
 }
 check('135 icon/theme/size combinations leave presets and 72 catalog identities unchanged',()=>{assert.equal(matrix,135);assert.equal(JSON.stringify(D.PRESETS),presetsBefore);assert.equal(JSON.stringify(D.SLIDES),catalogBefore);assert.equal(D.SLIDES.length,72);});
 check('Every one of 521 library icons produces correct native geometry in all 40 pack slots',()=>{
  for(const ic of D.ICONS.LIST){const m=D.iconPackModel(D.PRESETS[0],ic.id);assert.equal(glyphs(m).length,40);glyphs(m).forEach(it=>assertGeometry(it,ic.id));const filename=D.iconPackFilename(ic.id);assert(filename.endsWith('.pptx'));assert(!/[\\/:*?"<>|\u0000-\u001f]/.test(filename));}
 });
 check('Fresh packs do not inherit edited catalog icons, labels, or styles',()=>{
  const p=D.PRESETS[0],before=D.iconPackModel(p,'wafer'),edited=D.buildModel(p,{only:['iconvariants','iconcomponents']});
  for(const s of edited.slides){const g=s.groups[0],items=s.items.slice(g.from,g.to+1),ix=items.findIndex(i=>i.ic);D.applyLabels(s,{[s.key+':0']:{[ix]:{icon:'star'},_iconStyle:{base:'hex',look:'solid',state:'danger'}}});}
  assert.deepEqual(D.iconPackModel(p,'wafer'),before);
  const same=D.iconPackModel(p,'wafer');same.slides[0].items.find(i=>i.ic).points[0].x=999;
  assert.deepEqual(D.iconPackModel(p,'wafer'),before,'Returned pack models do not share mutable geometry');
 });
 check('Semantic paint is fixed across custom brands and bright solid glyphs remain readable',()=>{
  const a=D.iconPackModel({...D.PRESETS[0],P:'FFFF00'},'star'),b=D.iconPackModel({...D.PRESETS[0],P:'000000'},'star');assertPack(a,'star');assertPack(b,'star');
  a.slides[0].groups.forEach((g,idx)=>{const pick=(m,g)=>m.slides[0].items.slice(g.from,g.to+1).find(i=>i.iconBase).fill;if(g.iconStyle.state!=='brand')assert.equal(pick(a,g),pick(b,b.slides[0].groups[idx]));});
 });
 let exports=0;
 for(const id of REPRESENTATIVE)for(const size of ['S','M','L']){
  const p={...D.PRESETS[0],size},m=D.iconPackModel(p,id),r=await D.exportPptx({PptxGenJS,JSZip},p,{model:m,type:'nodebuffer'});await assertNative(r.data,id);assert.equal(r.model.connectors.fail,0);assert.equal(r.model.connectors.one,0);exports++;
 }
 for(const p of D.PRESETS){const m=D.iconPackModel(p,'wafer'),r=await D.exportPptx({PptxGenJS,JSZip},p,{model:m,type:'nodebuffer'});await assertNative(r.data,'wafer');exports++;}
 check('24 real PPTX exports retain two pages, 33 editable groups, 40 custom geometries and no media',()=>assert.equal(exports,24));
}
async function domSuite(){
 const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom'),errors=[],downloads=[],blobs=new Map();let blobId=0;
 class Resources extends ResourceLoader{fetch(url){const f=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(f)?Promise.resolve(fs.readFileSync(f)):null;}}
 const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|window.scrollTo/.test(e.message))errors.push(e.message);});
 const savedLabels={'iconvariants:0':{1:{from:'groups',icon:'star'},_iconStyle:{base:'hex',look:'solid',state:'danger'}},'iconcomponents:0':{1:{from:'groups',icon:'settings'}}};
 const storedStyles=JSON.stringify([{name:'保留的風格',base:'navy',params:{...D.PRESETS[0]}}]);
 const dom=new JSDOM(fs.readFileSync(path.join(ROOT,process.env.STUDIO_HTML||'studio.html'),'utf8'),{url:'http://studio.test/studio.html#/A14/iconvariants',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.localStorage.setItem('ppt-studio-v4',JSON.stringify({base:'navy',p:D.PRESETS[0],key:'iconvariants',tab:'icons',labels:savedLabels}));w.localStorage.setItem('ppt-studio-mystyles',storedStyles);
  w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.ResizeObserver=class{observe(){}disconnect(){}};w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
  w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.scrollTo=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*50})});
  w.URL.createObjectURL=b=>{const u='blob:pack-'+(++blobId);blobs.set(u,b);return u;};w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){if(this.download)downloads.push({name:this.download,blob:blobs.get(this.href)});else this.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));};
 }});
 try{
  await new Promise((res,rej)=>{const t=setTimeout(()=>rej(Error('load timeout')),20000);dom.window.addEventListener('load',()=>{clearTimeout(t);res();});});await sleep(100);
  const w=dom.window,doc=w.document,$=s=>{const e=doc.querySelector(s);assert(e,'Missing '+s);return e;},click=s=>$(s).dispatchEvent(new w.MouseEvent('click',{bubbles:true})),select=id=>click(`#iGrid .ic[data-id="${id}"]`),input=(s,v)=>{const e=$(s);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));};
  const labelsBefore=JSON.stringify(w.__studioApi.S.labels),catalogBefore=JSON.stringify(w.Deck.SLIDES);
  check('Library has a disabled one-click pack action before any selection',()=>{assert.equal(w.__studioApi.S.tab,'icons');assert.equal($('#iPackDownload').disabled,true);assert($('#iPackSummary').textContent.includes('24 款底座＋9 種組合'));assert(/2\s*頁/.test($('#iPackSummary').textContent));});
  select('wafer');check('Selected Chinese name and original SVG/PNG/native download tools remain available',()=>{assert($('#iPackName').textContent.includes(w.Icons.BY.wafer.zh));assert.equal($('#iPackDownload').disabled,false);for(const a of ['svg','png2','png4','pic','shape'])assert($(`#ibar2 [data-a="${a}"]`));assert.equal($('#lbEd').hidden,true);});
  // jsdom does not complete the browser ZIP scheduler reliably. Use the same real
  // export function with Node binary libraries, adapting only its output to a DOM Blob.
  const original=w.Deck.exportPptx,nativeExport=async(env,p,opt)=>{const r=await original({PptxGenJS,JSZip},p,{...opt,type:'nodebuffer'});return{...r,data:new w.Blob([r.data],{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation'})};};let calls=0,lastRequest;
  w.Deck.exportPptx=async(env,p,opt)=>{calls++;lastRequest={params:plain(p),model:plain(opt.model)};return nativeExport(env,p,opt);};
  click('#iPackDownload');click('#iPackDownload');
  check('One click immediately starts the actual export and blocks a duplicate',()=>{assert.equal(calls,1);assert.equal($('#iPackDownload').disabled,true);assert.equal($('#lbEd').hidden,true);});
  await until(()=>downloads.length===1||/下載失敗/.test(w.__lastToast||''),'real pack download');
  assert.equal(downloads.length,1,w.__lastToast||'Expected a binary download');
  const blobBuffer=blob=>new Promise((res,rej)=>{const r=new w.FileReader();r.onload=()=>res(Buffer.from(new Uint8Array(r.result)));r.onerror=()=>rej(r.error);r.readAsArrayBuffer(blob);});
  await assertNative(await blobBuffer(downloads[0].blob),'wafer');
  check('Real DOM download produces a native two-page wafer PPTX and restores the button',()=>{assert.equal(downloads[0].name,w.Deck.iconPackFilename('wafer'));assert(downloads[0].blob.size>10000);assert.equal($('#iPackDownload').disabled,false);assert.equal(w.__studio.lastIconPack.id,'wafer');assertPack(lastRequest.model,'wafer');assert.equal(lastRequest.model.slides[0].groups[0].iconStyle.look,'outline');});
  let release,request;const gate=new Promise(r=>release=r);calls=0;
  w.Deck.exportPptx=async(env,p,opt)=>{calls++;request={p,model:opt.model,atClick:plain(p)};await gate;return nativeExport(env,p,opt);};
  select('fingerprint');click('#iPackDownload');assert.equal(calls,1);
  w.__studioApi.S.p.P='E60012';w.__studioApi.S.p.size='L';select('settings');select('star');click('#iPackDownload');click('#tabs [data-tab="slides"]');click('#tabs [data-tab="icons"]');click('#iPackDownload');
  check('Rapid selection, in-place theme edits and tab changes cannot alter or duplicate an in-flight pack',()=>{assert.equal(calls,1);assert.equal($('#iPackDownload').disabled,true);assert.equal($('#iPack').getAttribute('aria-busy'),'true');assert($('#iPackName').textContent.includes(w.Icons.BY.star.zh));assert.deepEqual(plain(request.p),request.atClick);assert.equal(request.model.iconPack.id,'fingerprint');assert.equal(request.model.params.P,request.atClick.P);assert.equal(request.model.params.size,request.atClick.size);});
  release();await until(()=>downloads.length===2||/下載失敗/.test(w.__lastToast||''),'snapshot download');assert.equal(downloads.length,2,w.__lastToast);
  await assertNative(await blobBuffer(downloads[1].blob),'fingerprint');
  check('Started download finishes with original icon/theme snapshot while new selection stays active',()=>{assert.equal(downloads[1].name,w.Deck.iconPackFilename('fingerprint'));assert.equal($('#iPackDownload').disabled,false);assert($('#iPackName').textContent.includes(w.Icons.BY.star.zh));assert.equal(w.__studio.lastIconPack.id,'fingerprint');});
  let reject;const broken=new Promise((_,r)=>reject=r);calls=0;w.Deck.exportPptx=async()=>{calls++;return broken;};click('#iPackDownload');select('wafer');click('#iPackDownload');
  assert.equal(calls,1);assert.equal($('#iPackDownload').disabled,true);click('#ibar2 [data-a="x"]');reject(Error('controlled export failure'));await until(()=>$('#iPack').getAttribute('aria-busy')==='false','failed export cleanup');
  check('Export failure clears busy state without a false download and keeps an empty selection disabled',()=>{assert.equal(downloads.length,2);assert.equal($('#iPackDownload').disabled,true);assert(w.__lastToast.includes('controlled export failure'));});
  w.Deck.exportPptx=nativeExport;select('wafer');click('#iPackDownload');await until(()=>downloads.length===3,'retry after failure');assert.equal(downloads.length,3,w.__lastToast);await assertNative(await blobBuffer(downloads[2].blob),'wafer');
  check('A real retry succeeds after export failure using the current selection',()=>{assert.equal(downloads[2].name,w.Deck.iconPackFilename('wafer'));assert.equal($('#iPackDownload').disabled,false);});
  w.Deck.exportPptx=original;
  click('#ibar2 [data-a="x"]');check('Clearing selection disables export without a stale filename or icon',()=>{assert.equal($('#iPackDownload').disabled,true);assert(!$('#iPackName').textContent.includes(w.Icons.BY.wafer.zh));});
  for(const id of ['constructor','__proto__','toString','not_an_icon']){const b=doc.createElement('button');b.className='ic';b.dataset.id=id;$('#iGrid').appendChild(b);b.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));assert.equal($('#iPackDownload').disabled,true);click('#iPackDownload');assert.equal(downloads.length,3);b.remove();}
  check('Invalid and prototype DOM selections remain disabled and do not throw',()=>{});
  select('star');input('#iSearch','not_an_icon_999');await sleep(130);check('Searching away the selected icon clears the pack action',()=>{assert.equal($('#iPackDownload').disabled,true);assert.equal(doc.querySelectorAll('#iGrid .ic').length,0);});
  input('#iSearch','');await sleep(130);click('#tabs [data-tab="slides"]');click('#pTree a[data-k="iconvariants"]');click('#big g.el[data-g="1"]');click('#ebar button[data-a="lbl"]');click('[data-pick="0"]');click('#tabs [data-tab="icons"]');
  check('Existing editor/picker closes on navigation; pack introduces no modal',()=>{assert.equal($('#lbEd').hidden,true);assert($('#lbIcPicker').closest('[hidden]'),'Picker is hidden with its closed editor');assert.equal(doc.querySelectorAll('#iPackDownload').length,1);});
  check('Pack creation leaves saved labels, custom styles and catalog keys intact',()=>{assert.equal(JSON.stringify(w.__studioApi.S.labels),labelsBefore);assert.equal(w.localStorage.getItem('ppt-studio-mystyles'),storedStyles);assert.equal(JSON.stringify(w.Deck.SLIDES),catalogBefore);assert.deepEqual(JSON.parse(w.localStorage.getItem('ppt-studio-v4')).labels,JSON.parse(labelsBefore));});
  w.Deck.exportPptx=nativeExport;select('star');const prior=downloads.length;click('#ibar2 [data-a="svg"]');
  const svg=String(await blobBuffer(downloads[prior].blob));
  check('Existing single-icon SVG download still uses the current selection',()=>{assert(downloads[prior].name.startsWith('icon-star-'));assert(downloads[prior].name.endsWith('.svg'));assert(svg.includes('<svg'));assert(svg.includes('path'));});
  click('#ibar2 [data-a="shape"]');await until(()=>downloads.length===prior+2,'existing native icon PPTX');
  const single=await JSZip.loadAsync(await blobBuffer(downloads[prior+1].blob)),xml=await single.file('ppt/slides/slide1.xml').async('string');
  check('Existing standalone native PPTX remains one page with the current glyph',()=>{assert(downloads[prior+1].name.startsWith('icon-star-'));assert(downloads[prior+1].name.endsWith('-圖案.pptx'));assert.equal(Object.keys(single.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).length,1);assert(xml.includes('<a:custGeom>'));assert(xml.includes('圖示 '+w.Icons.BY.star.zh));assert(!xml.includes('<p:pic>'));});
  w.Deck.exportPptx=original;
  check('DOM harness has no uncaught page errors',()=>assert.deepEqual(errors,[]));
 }finally{dom.window.close();}
}
(async()=>{if(!process.argv.includes('--dom-only'))await modelSuite();if(!process.argv.includes('--model-only'))await domSuite();console.log(`${passed} icon-pack checks passed (native artifacts and DOM logic; not browser visual certification).`);})().catch(e=>{console.error(e);process.exitCode=1;});
