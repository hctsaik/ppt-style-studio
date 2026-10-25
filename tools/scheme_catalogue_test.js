/* Four approved scheme catalogs: source/model/native-PPTX contracts only.
 * No browser, server, screenshot or JSDOM execution is performed.
 * Source: Library 方案元件-四頁分類.pptx, SHA256
 * 5fd6377ccfc1c67f1bdb5e75a495d16b6e84d70ad31d1ec9a7e96708c3514067.
 */
'use strict';
const assert=require('assert/strict'),crypto=require('crypto');
const D=require('../deck'),PptxGenJS=require('pptxgenjs'),JSZip=require('jszip');
const LEGACY=require('./fixtures/scheme_catalogue_legacy.json'),GEOMETRY=require('./fixtures/scheme_catalogue_geometry.json');
const KEYS=['schemeemphasis','schemebody','schemeicon','schemeiconbody'];
const STYLES=[
 ['01','短底線＋全寬細線'],['02','短直線標記'],['03','中性淡底帶'],['04','開放式底角框'],
 ['05','置中斷線標題'],['07','頂線標示'],['08','細框主題'],['09','字標與主題'],
 ['03A','淡色小圓角'],['03B','白底輕陰影'],['03C','深色實心'],['03D','線框與短色條'],
 ['03E','強調色實心'],['03F','淡灰與側色條']
];
const BODY=['分批交付，逐階確認。','集中交付，一次驗收。'],env={PptxGenJS,JSZip};
let checks=0,nativeExports=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
const plain=x=>JSON.parse(JSON.stringify(x));
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
// Omit paint and display text only; retain all geometry, typography, shadow,
// corners, native item types, group addressing and layout metadata.
const geometry=x=>JSON.parse(JSON.stringify(x,function(k,v){return ['name','fill','line','color','mkC'].includes(k)||(k==='t'&&this.o)?undefined:v;}));
function expectedPaint(p,id,body){
 const roles=Object.fromEntries(['main','deep','light','accent'].map(r=>[r,D.tableHighlightPreset('v4-role-'+r,p)]));
 const solid=['03C','03E'].includes(id),band=id==='03C'?roles.main:roles.accent,badge=id==='03C'?roles.deep:roles.main,bg=id==='03A'?roles.light.fill:id==='03'?'F1F4F6':id==='03F'?'F1F3F5':'FFFFFF';
 return {title:solid?badge.color:D.ensureContrast(roles.main.fill,bg,4.5),body:solid?band.color:D.ensureContrast(D.ensureContrast(p.t2,'FFFFFF',4.5),bg,4.5),titleBg:solid?badge.fill:bg,bodyBg:solid?band.fill:bg,band:body?band.fill:badge.fill};
}
const close=(a,b,label,eps=1e-6)=>assert(Math.abs(a-b)<=eps,label+': '+a+' != '+b);
const items=(s,g)=>s.items.slice(g.from,g.to+1);
const text=i=>D.textOf(i);
const paint=i=>i.runs&&i.runs[0].o.color;
function bounds(it){
 return it.t==='ln'?{x:Math.min(it.x1,it.x2),y:Math.min(it.y1,it.y2),w:Math.abs(it.x2-it.x1),h:Math.abs(it.y2-it.y1)}:it;
}
function inBounds(sl){
 const w=sl.w||sl.W||D.W,h=sl.h||sl.H||D.H;
 sl.items.forEach(it=>{const b=bounds(it);for(const k of ['x','y','w','h'])assert(Number.isFinite(b[k]),sl.key+': finite '+k);
  assert(b.x>=-.001&&b.y>=-.001&&b.x+b.w<=w+.001&&b.y+b.h<=h+.001,sl.key+'/'+(it.name||it.t)+' in '+w+'×'+h+': '+JSON.stringify(b));
 });
}
function normalizedHalf(sl,g){
 return items(sl,g).map(source=>{
  const it=plain(source);delete it.name;
  if(it.t==='ln'){it.x1-=g.x;it.x2-=g.x;it.y1-=g.y;it.y2-=g.y;}else{it.x-=g.x;it.y-=g.y;}
  if(it.runs)for(const r of it.runs)r.t=r.t.replace(/方案 [AB]/g,'方案 X').replace(/^[AB]$/,'X').replace(BODY[0],'內文').replace(BODY[1],'內文');
  return it;
 });
}
function sameGeometry(actual,expected,label){
 if(typeof actual==='number'&&typeof expected==='number'){close(actual,expected,label);return;}
 if(actual&&expected&&typeof actual==='object'&&typeof expected==='object'){
  assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),label+' fields');
  for(const k of Object.keys(actual))sameGeometry(actual[k],expected[k],label+'.'+k);
 }else assert.deepEqual(actual,expected,label);
}
async function native(model,expectedGroups,dimensions){
 const result=await D.exportPptx(env,model.params,{model,type:'nodebuffer'}),zip=await JSZip.loadAsync(result.data);
 const names=Object.keys(zip.files),slides=names.filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n));
 assert.equal(slides.length,expectedGroups.length);
 assert(!names.some(n=>/^ppt\/media\/.+/.test(n)&&!zip.files[n].dir),'No media fallback');
 const presentation=await zip.file('ppt/presentation.xml').async('string');
 const size=/<p:sldSz\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/.exec(presentation);assert(size,'PPTX has declared dimensions');
 close(+size[1],dimensions[0]*914400,'PPTX width EMU',1);close(+size[2],dimensions[1]*914400,'PPTX height EMU',1);
 const xml=[];
 for(let i=0;i<slides.length;i++){
  const s=await zip.file('ppt/slides/slide'+(i+1)+'.xml').async('string');xml.push(s);
  assert.equal((s.match(/<p:grpSp>/g)||[]).length,expectedGroups[i],'Native group count');
  assert(!/<p:pic\b|<a:blip\b|asvg:svgBlip/.test(s),'All contents remain editable native shapes/text');
  assert(!/\b(?:NaN|Infinity)\b/.test(s),'No invalid coordinates');
  const ids=[...s.matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Unique drawing IDs');
  const primitives=new Map([...s.matchAll(/<p:(sp|cxnSp)\b[\s\S]*?<\/p:\1>/g)].map(m=>[+m[0].match(/<p:cNvPr\b[^>]*id="(\d+)"/)[1],m[0]])),svg=D.toSvg(model.slides[i]);
  const colorOf=xml=>xml&&xml.match(/<a:solidFill>\s*<a:srgbClr val="([^"]+)"/)?xml.match(/<a:solidFill>\s*<a:srgbClr val="([^"]+)"/)[1]:null;
  model.slides[i].items.forEach((it,index)=>{
   const shape=primitives.get(index+2);assert(shape,'Native primitive retains model identity '+index);
   const sp=shape.match(/<p:spPr>[\s\S]*?<\/p:spPr>/)[0],line=sp.match(/<a:ln\b[\s\S]*?<\/a:ln>/);
   if(it.runs){const runs=[...shape.matchAll(/<a:r>[\s\S]*?<\/a:r>/g)];assert.equal(runs.length,it.runs.length);runs.forEach((r,j)=>{assert.equal(colorOf(r[0]),it.runs[j].o.color,'Native text uses preview/model role color');assert(svg.includes('fill="#'+it.runs[j].o.color+'"'));});}
   else if(it.t==='ln'){assert.equal(colorOf(line&&line[0]),it.color);assert(svg.includes('stroke="#'+it.color+'"'));}
   else {const face=sp.replace(/<a:ln\b[\s\S]*?<\/a:ln>/g,'').replace(/<a:effectLst>[\s\S]*?<\/a:effectLst>/g,'');assert.equal(colorOf(face),it.fill||null);assert.equal(colorOf(line&&line[0]),it.line||null);if(it.fill)assert(svg.includes('fill="#'+it.fill+'"'));if(it.line)assert(svg.includes('stroke="#'+it.line+'"'));}
  });
 }
 assert.equal(result.model.connectors.fail,0);assert.equal(result.model.connectors.one,0);
 nativeExports++;return {zip,xml};
}
(async()=>{
 check('Four stable appended A15–A18 catalog identities and exact 14 retained styles',()=>{
  assert.deepEqual(D.SCHEME_CATALOGUE_KEYS,KEYS);assert.equal(D.SLIDES.length,76);
  assert.deepEqual(D.SLIDES.slice(-4).map(s=>[s[0],s[2],s[4]]),KEYS.map((k,i)=>[k,'A'+(15+i),'A']));
  assert.deepEqual(D.SCHEME_CATALOGUE_STYLES.map(s=>Array.isArray(s)?s.slice(0,2):[s.id,s.name]),STYLES);
  assert(KEYS.every(k=>!D.SPLIT_PARTS[k]),'Four catalogs must not be automatically split');
 });
 const reference=D.buildModel(D.PRESETS[0],{only:KEYS});
 check('Four sheets preserve 112 separate native A/B groups',()=>{
  assert.deepEqual(reference.slides.map(s=>s.key),KEYS);assert.deepEqual(reference.slides.map(s=>s.groups.length),[28,28,28,28]);
  assert.equal(reference.slides.reduce((n,s)=>n+s.groups.length,0),112);assert.deepEqual(reference.warns,[]);
 });
 for(const preset of D.PRESETS)for(const size of ['S','M','L']){
  const params={...preset,size},before=JSON.stringify(params),m=D.buildModel(params,{only:KEYS}),k=D.SIZE_K[size];
  check(preset.id+'/'+size+': all 56 style/category cases preserve order, symmetry, typography and bounds',()=>{
   assert.equal(JSON.stringify(params),before);assert.deepEqual(m.warns,[]);assert.equal(m.slides.length,4);assert.equal(digest(geometry(m.slides)),GEOMETRY.scenarios[size],'Complete original geometry/type/shadow/typography unchanged');
   m.slides.forEach((s,page)=>{
    const withBody=page%2===1,withIcon=page>=2;assert.equal(s.groups.length,28);close(s.w||s.W,13.333*k,'sheet width');close(s.h||s.H,17.5*k,'sheet height');inBounds(s);
    assert(s.items.every(it=>it.t!=='pic'),'No pictures in source model');
    assert(D.toSvg(s).includes('viewBox="0 0 '+(s.w||s.W)*72+' '+(s.h||s.H)*72+'"'),'SVG keeps full long sheet');
    for(let i=0;i<14;i++){
     const left=s.groups[i*2],right=s.groups[i*2+1];assert.equal(left.schemeStyle,STYLES[i][0]);assert.equal(right.schemeStyle,STYLES[i][0]);
     assert.equal(left.schemeBody,withBody);assert.equal(right.schemeBody,withBody);assert.equal(left.schemeIcon,withIcon);assert.equal(right.schemeIcon,withIcon);
     assert.notEqual(left.schemeSide,right.schemeSide);close(left.y,right.y,'symmetric y');close(left.w,right.w,'symmetric width');close(left.h,right.h,'symmetric height');close(right.x-left.x,6.2865*k,'A/B translation');
     sameGeometry(normalizedHalf(s,left),normalizedHalf(s,right),'Same translated geometry/style, only A/B copy differs');
     for(const [side,g] of [left,right].entries()){
      const its=items(s,g),topic=its.find(it=>text(it)==='方案 '+(side?'B':'A')),body=its.find(it=>text(it)===BODY[side]);
      assert(topic,'Separate topic text shape');assert.equal(!!body,withBody,'Body presence matches category');assert.equal(topic.runs.length,1);assert(topic.runs[0].o.bold);
      close(topic.runs[0].o.size,Math.round(18*k*2)/2,'topic size');assert.equal(topic.runs[0].o.font,'Microsoft JhengHei');
      const colors=expectedPaint(params,STYLES[i][0],withBody);assert.equal(paint(topic),colors.title,'Existing theme role determines title foreground');assert(D.contrastOf(paint(topic),colors.titleBg)>=4.5);
      if(body){assert.notEqual(topic,body);assert.equal(body.runs.length,1);assert(!body.runs[0].o.bold);assert.equal(body.runs[0].o.font,'Microsoft JhengHei');close(body.runs[0].o.size,Math.round(18*k*2)/2,'body size');assert.equal(paint(body),colors.body);assert(D.contrastOf(paint(body),colors.bodyBg)>=4.5);}
     }
    }
   });
  });
 }
 check('Approved small corners, single subtle shadow, filled-container variants and source briefcase geometry',()=>{
  reference.slides.forEach((s,page)=>s.groups.forEach((g,gi)=>{
   const its=items(s,g),rounds=its.filter(i=>i.kind==='roundRect'),shadows=its.filter(i=>i.sh),dark=['03C','03E'].includes(g.schemeStyle);
   if(/^03[A-F]$/.test(g.schemeStyle)){assert.equal(rounds.length,1);close(rounds[0].adj,.04,'businesslike corner radius',2e-5);}else assert.equal(rounds.length,0,'Non-rounded original styles stay square');
   assert.equal(shadows.length,g.schemeStyle==='03B'?1:0,'Only white shadow style has shadow');
   if(shadows.length){close(shadows[0].sh.alpha,.15,'shadow opacity');close(shadows[0].sh.blur,3,'shadow blur');close(shadows[0].sh.dist,1,'shadow distance');close(shadows[0].sh.dir,90,'shadow direction');}
   if(dark){const band=rounds[0];assert.equal(band.fill,expectedPaint(D.PRESETS[0],g.schemeStyle,page%2).band);}
   const noIconPage=reference.slides[page%2],noIcon=items(noIconPage,noIconPage.groups[gi]);
   if(page>=2)assert.equal(its.length-noIcon.length,g.schemeStyle==='09'?3:4,'Briefcase uses four native primitives; style09 replaces the marker letter');
  }));
 });
 check('Custom roles and light/dark fills resolve live with readable text, fixed neutrals and unchanged geometry',()=>{
  for(const p of [
   {...D.PRESETS[5],P:'5F1234',PD:'35001A',PT:'F3DCE8',semWarn:'E5C441',t2:'454545',mute:'555555'},
   {...D.PRESETS[0],P:'FFFFFF',PD:'FFFFEE',PT:'101010',semWarn:'000000',t2:'FFFFFF'},
   {...D.PRESETS[0],P:'000000',PD:'010101',PT:'FFFFFF',semWarn:'FFFFFF',t2:'EEEEEE'}
  ]){const m=D.buildModel(p,{only:KEYS});assert.equal(digest(geometry(m.slides)),GEOMETRY.scenarios.M);
   m.slides.forEach((sl,page)=>sl.groups.forEach(g=>{const its=items(sl,g),c=expectedPaint(p,g.schemeStyle,page%2),topic=its.find(i=>/^方案 [AB]$/.test(text(i))),body=its.find(i=>BODY.includes(text(i)));
    assert.equal(paint(topic),c.title);assert(D.contrastOf(paint(topic),c.titleBg)>=4.5);if(body){assert.equal(paint(body),c.body);assert(D.contrastOf(paint(body),c.bodyBg)>=4.5);}
    const base=its.find(i=>i.kind==='roundRect');if(g.schemeStyle==='03A')assert.equal(base.fill,p.PT);if(g.schemeStyle==='03B')assert.equal(base.fill,'FFFFFF');if(g.schemeStyle==='03F')assert.equal(base.fill,'F1F3F5');
   }));
  }
 });
 for(const theme of D.PRESETS)for(const size of ['S','M','L']){const p={...theme,size},k=D.SIZE_K[size],m=D.buildModel(p,{only:KEYS});await native(m,[28,28,28,28],[13.333*k,17.5*k]);check(p.id+'/'+size+': all catalogue SVG/native primitive colors match the shared theme role model',()=>{});}
 check('All editable topic/body labels remain independent and retain bold/regular roles',()=>{
  reference.slides.forEach(s=>s.groups.forEach((g,gi)=>{
   const its=items(s,g),topic=its.findIndex(i=>/^方案 [AB]$/.test(text(i))),body=its.findIndex(i=>BODY.includes(text(i))),patch={};
   patch[topic]={from:text(its[topic]),to:'新方案'};if(body>=0)patch[body]={from:text(its[body]),to:'新的說明'};
   const labels={[s.key+':'+gi]:patch},edited=D.buildModel(D.PRESETS[0],{only:[s.key],labels}).slides[0],eg=edited.groups[gi],ei=items(edited,eg);
   assert.equal(text(ei[topic]),'新方案');assert(ei[topic].runs.every(r=>r.o.bold));assert.equal(paint(ei[topic]),paint(its[topic]));
   if(body>=0){assert.equal(text(ei[body]),'新的說明');assert(ei[body].runs.every(r=>!r.o.bold));assert.equal(paint(ei[body]),paint(its[body]));}
   assert.deepEqual(edited.groups.map(x=>[x.from,x.to]),s.groups.map(x=>[x.from,x.to]),'Editing does not change persistent group/shape addressing');
   const wine=D.PRESETS.find(p=>p.id==='wine'),rethemed=D.buildModel(wine,{only:[s.key],labels}).slides[0],ri=items(rethemed,rethemed.groups[gi]),pc=expectedPaint(wine,g.schemeStyle,g.schemeBody);
   assert.equal(text(ri[topic]),'新方案');assert.equal(paint(ri[topic]),pc.title);if(body>=0){assert.equal(text(ri[body]),'新的說明');assert.equal(paint(ri[body]),pc.body);}assert.deepEqual(geometry(ri),geometry(ei),'Theme change retains edits and all geometry/typography');
   const next=gi%2?gi-1:gi+1;assert.deepEqual(items(edited,edited.groups[next]),items(s,s.groups[next]),'Editing one half does not mutate the other');
   const stale=D.buildModel(D.PRESETS[0],{only:[s.key],labels:{[s.key+':'+gi]:{[topic]:{from:'stale source',to:'不該套用'}}}}).slides[0];assert.equal(text(items(stale,stale.groups[gi])[topic]),text(its[topic]));
  }));
 });
 check('All 72 legacy identities remain in their original registry order',()=>assert.deepEqual(D.SLIDES.slice(0,72),LEGACY.registry));
 for(const p of D.PRESETS)for(const size of ['S','M','L']){
  const params={...p,size},old=LEGACY.scenarios[p.id+'/'+size],now=D.buildModel(params,{examples:true});
  check(p.id+'/'+size+': all 72 legacy pages and their groups are byte-for-byte unchanged',()=>{
   assert(old,'Committed baseline includes this theme/size');
   const slides=now.slides.slice(0,72);assert.equal(slides.length,72);
   assert.equal(slides.reduce((n,s)=>n+s.groups.length,0),old.groups);
   assert.equal(digest(slides),old.slidesSha256,'Legacy geometry/text/style/metadata unchanged');
   // Versioned table sizing adds inert metadata to all models. Assert the
   // exact legacy defaults and project only these new fields out; keep every
   // legacy slide hash, semantic value and warning byte-for-byte unchanged.
   assert.deepEqual(Object.fromEntries(D.TABLE_SIZING_KEYS.map(k=>[k,now.params[k]])),{tbSizingVersion:1,tbWidthMode:'auto',tbHeightMode:'optimal'});
   const legacyParams={...now.params};D.TABLE_SIZING_KEYS.forEach(k=>delete legacyParams[k]);
   assert.equal(digest({params:legacyParams,sem:now.sem,warns:now.warns}),old.contractSha256,'Legacy model semantics and warnings unchanged');
  });
 }
 for(const size of ['S','M','L']){
  const p={...D.PRESETS[0],size},m=D.buildModel(p,{only:KEYS}),k=D.SIZE_K[size],r=await native(m,[28,28,28,28],[13.333*k,17.5*k]);
  check(size+': complete four-page PPTX has 112 groups, full canvas, no image fallback',()=>{
   assert.equal(r.xml.reduce((n,x)=>n+(x.match(/<p:grpSp>/g)||[]).length,0),112);
   for(let page=0;page<4;page++){assert.equal((r.xml[page].match(/<a:t>分批交付，逐階確認。<\/a:t>/g)||[]).length,page%2?14:0);assert.equal((r.xml[page].match(/<a:t>集中交付，一次驗收。<\/a:t>/g)||[]).length,page%2?14:0);}
  });
 }
 const beforeIndividuals=nativeExports;
 for(const s of reference.slides)for(let gi=0;gi<s.groups.length;gi++){
  const em=D.elementModel(D.PRESETS[0],s.key,gi),g=em.slides[0].groups[0];
  assert.equal(em.slides.length,1);assert.equal(em.slides[0].groups.length,1);inBounds(em.slides[0]);
  // The source includes deliberate blank top padding. Center its logical box,
  // not the smaller visible-ink bounds recalculated by the existing extractor.
  const sourceGroup=s.groups[gi],centered={...g,x:(D.W-sourceGroup.w)/2,y:(D.H-sourceGroup.h)/2};
  sameGeometry(normalizedHalf(em.slides[0],centered),normalizedHalf(s,sourceGroup),'Individual extraction preserves source geometry at centered logical bounds');
  const r=await native(em,[1],[40/3,D.H]);assert(r.xml[0].includes('方案 '),'Native editable text is retained');
 }
 check('All 112 individual native exports remain grouped on regular 16:9 slides',()=>assert.equal(nativeExports-beforeIndividuals,112));
 const entries=reference.slides.map(s=>({kind:'el',key:s.key,gi:27,params:D.PRESETS[0],name:s.groups[27].name}));
 for(const mode of ['deck','compose']){
  const m=mode==='deck'?D.trayDeck(entries):D.trayModel(entries,{compose:{layout:'grid2'}});m.slides.forEach(inBounds);assert.equal(m.tray.skipped.length,0);
  await native(m,mode==='deck'?[1,1,1,1]:[4],[40/3,D.H]);
  check(mode+': four last-row components extract without bringing the long source canvas',()=>assert(m.slides.every(s=>(s.h||s.H||D.H)===D.H)));
 }
 // Explicit standard-only export cannot be expanded by the long catalogs.
 const standard=D.buildModel(D.PRESETS[0],{only:LEGACY.registry.map(s=>s[0]),examples:true}),probe=new PptxGenJS();D.toPptx(probe,standard);
 check('Ordinary 72-slide model retains standard canvas and excludes all four long catalogs',()=>{
  assert.equal(standard.slides.length,72);assert(standard.slides.every(s=>!KEYS.includes(s.key)));assert.equal(probe.layout,'LAYOUT_WIDE');
 });
 check('Mixed normal/catalog export fails explicitly instead of stretching old slides',()=>{
  assert.throws(()=>D.toPptx(new PptxGenJS(),D.buildModel(D.PRESETS[0])),{code:'SCHEME_CATALOGUE_MIXED_SIZE'});
 });
 for(const examples of [true,false]){
  const result=await D.exportPptx(env,D.PRESETS[0],{examples,type:'nodebuffer'}),zip=await JSZip.loadAsync(result.data),presentation=await zip.file('ppt/presentation.xml').async('string');nativeExports++;
  check('Default standard-deck export with examples='+examples+' preserves legacy scope and 16:9 size',()=>{
   assert.equal(result.model.slides.length,examples?72:69);assert(result.model.slides.every(s=>!KEYS.includes(s.key)));assert.equal(result.model.slides.some(s=>/^ex\d/.test(s.key)),examples);
   assert(/<p:sldSz\b[^>]*cx="12192000"[^>]*cy="6858000"/.test(presentation),'Standard LAYOUT_WIDE size is unchanged');
  });
 }
 console.log(checks+' scheme catalogue checks passed; '+nativeExports+' native PPTX exports inspected. Browser/desktop Office rendering not tested.');
})().catch(error=>{console.error(error);process.exitCode=1;});

