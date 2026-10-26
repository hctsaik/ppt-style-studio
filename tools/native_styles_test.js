'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..'),Z=require('../jszip.min.js'),N=require('../native-styles.js');
const COMMON=['D95D68','E7BF4A','4E83CE','4B9679','7D8795','9371C6'],LEGACY_SOFT=['F6D8DB','F9F0D4','D5E1F3','D4E6DF','E0E2E6','E5DDF1','FFFFFF'];
const HIGHLIGHTS=['F6D8DB','F9F0D4','7C9CC3','D4E6DF','E0E2E6','E5DDF1','595959','1F3864'];
const SENTINEL=['123456','AC0571','03DAE1','FA7111','68712C','1100F2'];
const tags=(x,t)=>(x.match(new RegExp('<a:'+t+'\\b[^>]*>[\\s\\S]*?</a:'+t+'>'))||[])[0];
const slot=(x,t)=>{const s=tags(x,t);return(s.match(/<a:srgbClr\b[^>]*val="([A-F0-9]+)"/)||s.match(/lastClr="([A-F0-9]+)"/))[1];};
const colors=x=>[1,2,3,4,5,6].map(i=>slot(x,'accent'+i));
function alignmentContract(xml){for(const m of xml.matchAll(/<a:pPr\b[^>]*\balgn="([^"]+)"/g))assert(['l','ctr','r','just','justLow','dist','thaiDist'].includes(m[1]),'DrawingML alignment enum: '+m[1]);}
function commonContract(xml){assert.deepEqual(colors(xml),COMMON,'native Accent 1–6 must be red/yellow/blue/green/gray/purple, never semantic warning');}
function galleryContract(pages){
 const tuples=[[1,1,1],[2,1,1],[3,1,1],[1,1,0],[0,2,0],[0,3,0],[3,1,0],[0,1,2],[3,1,2],[0,1,0]],roles=['tx1','accent1','accent2','accent3','accent4','accent5','accent6'];
 const signatures=[];
 assert.equal(pages.length,2);
 pages.forEach((xml,page)=>{const shapes=[...xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map(m=>m[0]).filter(s=>/name="Native style row /.test(s));assert.equal(shapes.length,35,'each gallery page has five complete rows');
  shapes.forEach((s,i)=>{const row=page*5+Math.floor(i/7),col=i%7,role=roles[col];assert(s.includes('name="Native style row '+(row+1)+' '+role+'"'));const r=(s.match(/<p:style>[\s\S]*?<\/p:style>/)||[])[0];assert(r,'missing native style reference');for(const [j,n]of ['lnRef','fillRef','effectRef'].entries())assert(r.includes('<a:'+n+' idx="'+tuples[row][j]+'">'));
   const fillRole=[0,1,2,3,6].includes(row)?'lt1':role,fontRole=[0,1,2,3,5].includes(row)?'dk2':row>=7?'lt1':role;
   assert(r.includes('<a:fillRef idx="'+tuples[row][1]+'"><a:schemeClr val="'+fillRole+'">'));assert(r.includes('<a:fontRef idx="minor"><a:schemeClr val="'+fontRole+'">'));
   assert(s.includes('<a:prstGeom prst="roundRect">'));assert(s.includes('<a:gd name="adj" fmla="val 17241"/>'));
   assert(s.includes('<a:rPr lang="zh-TW" sz="2000" b="'+(row>=6?'1':'0')+'">'));assert(s.includes('<a:t>'+(row<3?'外層卡片':row>=7?'關鍵步驟':'處理步驟')+'</a:t>'));
   const direct=(s.match(/<p:spPr>[\s\S]*?<\/p:spPr>/)||[])[0];
   if(row===0){assert(direct.includes('<a:ln w="15875"'));assert(direct.includes('<a:srgbClr val="666666"/>'));}
   else {assert(!s.includes('<a:srgbClr'),'only the explicitly fixed gray outline uses literal RGB');if(row===6||row===8){assert(direct.includes('<a:ln w="28575"'));assert(direct.includes('<a:schemeClr val="'+(row===8?'lt1':role)+'">'));}}
   if(col===1)signatures.push(r+direct.replace(/<a:xfrm>[\s\S]*?<\/a:xfrm>/,''));
  });
 });assert.equal(new Set(signatures).size,10,'ten appearances must remain distinct');
}
function highlightContract(xml){
 assert.deepEqual([...xml.matchAll(/<a:highlight><a:srgbClr val="([A-F0-9]+)"\/><\/a:highlight>/g)].map(m=>m[1]),HIGHLIGHTS);
 assert(!/name="(?:Half-height|Half marker|Full-height|Marker band)/.test(xml),'no independent highlighter bands');assert(!xml.includes('<a:alpha val="35000"/>'));assert(!xml.includes('<p:pic>'));
 const shapes=[...xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map(m=>m[0]).filter(s=>/name="Native highlight [1-8]"/.test(s));assert.equal(shapes.length,8);
 for(const shape of shapes){assert(shape.includes('<a:solidFill><a:srgbClr val="333333"/></a:solidFill>'),'highlighter application preserves original text color');assert(shape.includes('<a:noFill/><a:ln><a:noFill/></a:ln>'),'highlight sample has no backing shape fill');}
 assert(xml.includes('name="White editable shape"'));assert(xml.includes('#FFFFFF'),'white stays separately available to shapes');
}
function packageContract(presentation,rels,types){
 const ids=[...presentation.matchAll(/<p:sldId\b[^>]*\bid="(\d+)"[^>]*\br:id="([^"]+)"/g)];assert.equal(ids.length,5);assert.equal(new Set(ids.map(x=>x[1])).size,5);assert.equal(new Set(ids.map(x=>x[2])).size,5);
 const relationshipTags=[...rels.matchAll(/<Relationship\b[^>]*\/>/g)].map(m=>m[0]);
 ids.forEach((id,i)=>{const entry=relationshipTags.filter(t=>t.includes('Id="'+id[2]+'"'));assert.equal(entry.length,1);assert(entry[0].includes('Target="slides/slide'+(i+1)+'.xml"'));assert(entry[0].includes('Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide"'));assert(types.includes('PartName="/ppt/slides/slide'+(i+1)+'.xml"'));});
}
async function main(){let assertions=0;assert.deepEqual(N.COMMON.map(x=>x.color),COMMON.concat('FFFFFF'));assert.deepEqual(N.COMMON.map(x=>x.highlight),LEGACY_SOFT);assert.deepEqual(N.HIGHLIGHTS.map(x=>x.color),HIGHLIGHTS);assert.equal(N.softColor('FFFFFF'),'FFFFFF');assert.throws(()=>N.softColor('warning'));assert.throws(()=>N.replaceAccents('<x/>',COMMON));assertions+=6;
 const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,'stylekit-data.js'),'utf8'),sandbox);const ids=sandbox.window.STYLEKIT_THEMES.map(t=>t.id);assert.equal(ids.length,13);
 for(const id of ids){const seedBytes=fs.readFileSync(path.join(ROOT,'stylekit',id+'.pptx')),seed=await Z.loadAsync(seedBytes),seedTheme=await seed.file('ppt/theme/theme1.xml').async('string');
  for(const source of ['theme','common'])for(const ext of ['pptx','potx']){const file=path.join(ROOT,'native-stylekit',source,id+'.'+ext),z=await Z.loadAsync(fs.readFileSync(file)),theme=await z.file('ppt/theme/theme1.xml').async('string');
   if(source==='common')commonContract(theme);else assert.deepEqual(colors(theme),colors(seedTheme));
   for(const role of ['dk1','lt1','dk2','lt2','hlink','folHlink'])assert.equal(tags(theme,role),tags(seedTheme,role),role+' must not change');
   assert.equal(tags(theme,'fontScheme'),tags(seedTheme,'fontScheme'));assert.equal(tags(theme,'bgFillStyleLst'),tags(seedTheme,'bgFillStyleLst'));assert(theme.includes('<a:fmtScheme name="PPT Style Studio rectangle presets">'));assert.notEqual(tags(theme,'fmtScheme'),tags(seedTheme,'fmtScheme'));
   const presentation=await z.file('ppt/presentation.xml').async('string'),presentationRels=await z.file('ppt/_rels/presentation.xml.rels').async('string');
   const types=await z.file('[Content_Types].xml').async('string');assert(types.includes('application/vnd.openxmlformats-officedocument.presentationml.'+(ext==='pptx'?'presentation':'template')+'.main+xml'));
   packageContract(presentation,presentationRels,types);const app=await z.file('docProps/app.xml').async('string');assert(app.includes('<Slides>5</Slides>'));assert.equal(app.replace(/<Slides>\d+<\/Slides>/,'<Slides/>'),(await seed.file('docProps/app.xml').async('string')).replace(/<Slides>\d+<\/Slides>/,'<Slides/>'),'only app page count changes');
   assert.equal(await z.file('ppt/slides/_rels/slide5.xml.rels').async('string'),await z.file('ppt/slides/_rels/slide4.xml.rels').async('string'));
   const grids=await Promise.all([4,5].map(n=>z.file('ppt/slides/slide'+n+'.xml').async('string')));galleryContract(grids);grids.forEach(alignmentContract);
   const hl=await z.file('ppt/slides/slide3.xml').async('string');alignmentContract(hl);highlightContract(hl);
   const props=await z.file('ppt/presProps.xml').async('string'),mru=(props.match(/<p:clrMru>[\s\S]*?<\/p:clrMru>/)||[])[0];assert.deepEqual([...mru.matchAll(/<a:srgbClr val="([A-F0-9]+)"\/>/g)].map(m=>m[1]),HIGHLIGHTS.slice().reverse());assert.equal((props.match(/<p:clrMru>/g)||[]).length,1);assert(props.indexOf('<p:clrMru>')<props.indexOf('<p:extLst>'));
   const allowed=new Set(['ppt/theme/theme1.xml','ppt/presProps.xml','ppt/slides/slide3.xml','ppt/slides/slide4.xml','ppt/presentation.xml','ppt/_rels/presentation.xml.rels','docProps/app.xml','[Content_Types].xml']);for(const f of Object.keys(seed.files).filter(f=>!seed.files[f].dir&&!allowed.has(f)))assert.deepEqual(await z.file(f).async('uint8array'),await seed.file(f).async('uint8array'),'unexpected seed part change '+f);
   assertions+=100;
  }
  for(const source of ['theme','common']){const x=fs.readFileSync(path.join(ROOT,'native-stylekit',source,id+'_colors.xml'),'utf8');assert.deepEqual(colors(x),source==='common'?COMMON:colors(seedTheme));}
 }
 const z=await Z.loadAsync(fs.readFileSync(path.join(ROOT,'stylekit/navy.pptx'))),before=await z.file('ppt/theme/theme1.xml').async('string');await N.applyToZip(z,{source:'theme',accents:SENTINEL});const x=await z.file('ppt/theme/theme1.xml').async('string');assert.deepEqual(colors(x),SENTINEL);assert.equal(tags(x,'dk1'),tags(before,'dk1'));assert.equal(tags(x,'fontScheme'),tags(before,'fontScheme'));assert.equal(tags(x,'fmtScheme'),tags(before,'fmtScheme'));
 await assert.rejects(()=>N.applyToZip(z,{source:'warning'}));await assert.rejects(()=>N.applyToZip(z,{source:'theme',accents:['000000']}));
 const commonZip=await Z.loadAsync(fs.readFileSync(path.join(ROOT,'native-stylekit/common/navy.pptx'))),commonXml=await commonZip.file('ppt/theme/theme1.xml').async('string');assert.throws(()=>commonContract(commonXml.replace('<a:accent2><a:srgbClr val="E7BF4A"/>','<a:accent2><a:srgbClr val="C9A227"/>')),'warning-slot mutation must fail');
 const grids=await Promise.all([4,5].map(n=>commonZip.file('ppt/slides/slide'+n+'.xml').async('string'))),wrongRole=grids[0].replace('<a:fillRef idx="1"><a:schemeClr val="lt1">','<a:fillRef idx="1"><a:schemeClr val="accent2">');assert.notEqual(wrongRole,grids[0],'role mutation must modify the actual matrix reference');assert.throws(()=>galleryContract([wrongRole,grids[1]]),'role mutation must fail');
 const highlights=await commonZip.file('ppt/slides/slide3.xml').async('string'),wrongBlue=highlights.replace('<a:highlight><a:srgbClr val="7C9CC3"/>','<a:highlight><a:srgbClr val="D5A80C"/>');assert.notEqual(wrongBlue,highlights);assert.throws(()=>highlightContract(wrongBlue),'reference blue cannot become warning or theme color');
 const presentation=await commonZip.file('ppt/presentation.xml').async('string'),relationships=await commonZip.file('ppt/_rels/presentation.xml.rels').async('string'),types=await commonZip.file('[Content_Types].xml').async('string'),missingSlide=relationships.replace(/<Relationship\b[^>]*Target="slides\/slide5.xml"[^>]*\/>/,'');assert.notEqual(missingSlide,relationships);assert.throws(()=>packageContract(presentation,missingSlide,types),'missing new gallery relationship must fail');
 const fixedBytes=fs.readFileSync(path.join(ROOT,'fixed-master/Fixed_Red_Template.pptx'));assert.equal(crypto.createHash('sha256').update(fixedBytes).digest('hex'),'1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae');const fixed=await Z.loadAsync(fixedBytes),original={};for(const f of Object.keys(fixed.files).filter(f=>!fixed.files[f].dir))original[f]=await fixed.file(f).async('uint8array');await N.applyToZip(fixed,{source:'common'});for(const f of Object.keys(original)){const a=await fixed.file(f).async('uint8array');if(/(?:^|\/)theme[^/]*\.xml$/.test(f))commonContract(Buffer.from(a).toString());else if(f!=='ppt/presProps.xml')assert.deepEqual(a,original[f],'fixed source content changed '+f);}
 const fixedProps=await fixed.file('ppt/presProps.xml').async('string');assert(/<p:presentationPr\b[^>]*xmlns:a="http:\/\/schemas.openxmlformats.org\/drawingml\/2006\/main"/.test(fixedProps),'MRU DrawingML prefix must be declared on p:presentationPr');assert.throws(()=>alignmentContract('<a:pPr algn="left"/>'),'HTML alignment must be rejected in DrawingML');
 console.log(JSON.stringify({pass:true,themeFamilies:13,packages:52,colorFiles:26,galleryShapes:3640,nativeHighlightSamples:416,assertionsAtLeast:assertions+32,mutationCases:5,fixedSourceHashUnchanged:true}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
