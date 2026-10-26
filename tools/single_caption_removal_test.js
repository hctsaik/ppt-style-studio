/* One local regression: remove five added single-column bottom samples only. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const JSZip=require('../jszip.min'),F=require('../fixed-master');
const singles=['slide1','slideScheme06','slideScheme03','slideScheme10','slideScheme04'].map(n=>'ppt/slides/'+n+'.xml');
const colors=['F6D8DB','F9F0D4','7C9CC3','D4E6DF','E0E2E6','E5DDF1','595959','1F3864'];
(async()=>{
 const input=process.env.MASTER_FIXTURE,previous=process.env.MASTER_PREVIOUS_FIXTURE;
 const data=input?fs.readFileSync(input):await F.exportPptx(JSZip,[],{PptxGenJS:require('pptxgenjs')}),z=await JSZip.loadAsync(data);
 const pres=await z.file('ppt/presentation.xml').async('string');assert.equal((pres.match(/<p:sldId\s/g)||[]).length,26);assert.equal(F.DOWNLOAD_PAGES.length,26);
 for(const n of singles){const s=await z.file(n).async('string');assert(!/\bid="9001"|Native highlight|重點文字|原生文字醒目提示示範|<a:highlight\b/.test(s),n+' has no added sample');}
 const native=await z.file('ppt/slides/slideMaterial10.xml').async('string');assert.deepEqual([...native.matchAll(/<a:highlight><a:srgbClr val="([A-F0-9]+)"\/><\/a:highlight>/g)].map(m=>m[1]),colors);
 let total=0;for(const n of Object.keys(z.files).filter(n=>/^ppt\/slides\/[^/]+\.xml$/.test(n)))total+=((await z.file(n).async('string')).match(/<a:highlight\b/g)||[]).length;assert.equal(total,8);
 const props=await z.file('ppt/presProps.xml').async('string'),mru=props.match(/<p:clrMru>[\s\S]*?<\/p:clrMru>/)[0];assert.deepEqual([...mru.matchAll(/<a:srgbClr val="([A-F0-9]+)"/g)].map(m=>m[1]),colors.slice().reverse());
 console.log('PASS 26 pages, no five bottom samples, eight native highlights and eight MRU colors');
 if(previous){const old=await JSZip.loadAsync(fs.readFileSync(previous)),names=x=>Object.keys(x.files).filter(n=>!x.files[n].dir).sort();assert.deepEqual(names(z),names(old));let changed=[];
  for(const n of names(z)){const a=await old.file(n).async('nodebuffer'),b=await z.file(n).async('nodebuffer');if(a.equals(b))continue;changed.push(n);assert(singles.includes(n),'Unexpected changed part '+n);const before=a.toString('utf8'),removed=[...before.matchAll(/<p:sp\b[^>]*>[\s\S]*?<\/p:sp>/g)].filter(m=>/\bid="9001"/.test(m[0]));assert.equal(removed.length,1);assert.equal(b.toString('utf8'),before.replace(removed[0][0],''),'Only remove specified shape');}
  assert.deepEqual(changed.sort(),singles.slice().sort());console.log('PASS only five slide parts changed; every other package part is byte-identical');
 }
 if(process.env.MASTER_OUTPUT){fs.mkdirSync(path.dirname(process.env.MASTER_OUTPUT),{recursive:true});fs.writeFileSync(process.env.MASTER_OUTPUT,data);}
 console.log(JSON.stringify({passed:previous?2:1,pages:26,removedSamples:5,nativeHighlights:8,mruColors:8}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
