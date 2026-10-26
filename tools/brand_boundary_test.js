/* User-approved boundary: neutral UI/download names; original master/preview intact.
 * Scan decoded Office parts, never replace chance strings inside Base64. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{JSDOM}=require('jsdom'),Z=require('../jszip.min.js');
const ROOT=path.resolve(__dirname,'..'),PAT=/tsmc|台積電|台积电/i,SHA='1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
(async()=>{
 const input=fs.readFileSync(path.join(ROOT,'fixed-master/Fixed_Red_Template.pptx'));
 assert.equal(digest(input),SHA,'Original master, logo and footer must be byte-preserved');
 const sources=['deck.js','native-styles.js','fixed-master-data.js','fixed-master-previews.js','fixed-master.js'];
 let uiRuns=0;
 for(const htmlFile of ['studio.html','PPT-Style-Studio.html']){
  const html=fs.readFileSync(path.join(ROOT,htmlFile),'utf8'),dom=new JSDOM('<!doctype html><main id="test"></main>',{runScripts:'outside-only'}),w=dom.window;
  for(const name of sources){let code;if(htmlFile==='studio.html')code=fs.readFileSync(path.join(ROOT,name),'utf8');else{const open='<script data-inlined="'+name+'">',start=html.indexOf(open);assert(start>=0);code=html.slice(start+open.length,html.indexOf('</script>',start));}w.eval(code);}
  assert.equal(digest(Buffer.from(w.FixedMasterData.originalBase64,'base64')),SHA);
  assert(!PAT.test(w.FixedMasterData.sourceName),'Public source name is neutral');
  const root=w.document.getElementById('test');w.FixedMaster.render(root,{});
  const originalPreviewHashes=['f8600efdfe563e3316ea9b07db2dd4d424911d90893b2fe078f49c49b71df43e','e9ee6f6288ec890c21cbb016e32e142c1f56ac9cba7e82656d951b265f16c5d8','c6af2d47f15fcc55751a31d789355b2b4920295578a5a48527f29a2e8abca8b6'];
  assert.equal(w.FixedMasterPreviews.renderer,'Microsoft PowerPoint 16.0.20527.20088');
  for(const source of ['common','theme']){
   w.FixedMaster.render(root,{state:{paletteSource:source}});const profile=w.FixedMasterPreviews;assert.equal(profile.pages,26);assert.equal(profile.images.length,26);assert.equal(profile.imageSha256.length,26);
   const originalPreviews=[...root.querySelectorAll('.fmOriginal img')],added=[...root.querySelectorAll('.fmAdded img')];assert.equal(originalPreviews.length,7,'Cover, five independent singles and double preview');assert.equal(added.length,19,'Three material pages plus four component pages in four styles');
   for(const [i,image]of [...originalPreviews,...added].entries()){const png=Buffer.from(image.src.split(',')[1],'base64');assert.equal(digest(png),profile.imageSha256[i]);assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');if(i===0)assert.equal(digest(png),originalPreviewHashes[0],'Cover preview retains its independent approved SHA');}
  }
  const legacyPreview=w.FixedMaster.preview(w.FixedMaster.build({}));assert(PAT.test(legacyPreview),'Original preview renderer/footer retained');
  const clone=root.cloneNode(true);clone.querySelectorAll('svg').forEach(e=>e.remove());
  assert(!PAT.test(clone.textContent),'Explanations, controls and labels must be neutral');
  assert(!PAT.test(htmlFile==='studio.html'?html:html.replace(/<script\b[\s\S]*?<\/script>/g,'')),'Static UI text is neutral');
  const host=htmlFile==='studio.html'?html:html.slice(html.lastIndexOf('<script>'));
  assert(host.includes("'固定紅色_'+FixedMaster.DOWNLOAD_PAGES.length+'頁母片.pptx'"));assert.equal(w.FixedMaster.DOWNLOAD_PAGES.length,26);assert(host.includes('固定紅色_卡片與文字素材.pptx'));
  dom.window.close();uiRuns++;
 }
 let packages=0,preservedHits=0;
 for(const dir of ['stylekit','native-stylekit','fixed-master'])for(const file of files(path.join(ROOT,dir)).filter(f=>/\.(pptx|potx)$/i.test(f))){
  assert(!PAT.test(path.basename(file)),'Public asset filename must be neutral');const zip=await Z.loadAsync(fs.readFileSync(file)),original=digest(fs.readFileSync(file))===SHA;
  for(const name of Object.keys(zip.files).filter(n=>!zip.files[n].dir)){
   const text=/\.(xml|rels)$/i.test(name)?await zip.file(name).async('string'):'';
   if(PAT.test(name)||PAT.test(text)){assert(original,'Unexpected brand outside approved original master: '+file+' '+name);preservedHits++;}
  }packages++;
 }
 assert(preservedHits>0,'Brand exception must refer to actual preserved source, not a silent replacement');
 console.log(JSON.stringify({pass:true,uiRuns,decodedOfficePackages:packages,preservedOriginalBrandParts:preservedHits,originalSha256:SHA,scope:'UI and filenames neutral; original template and preview preserved; history unchanged'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
