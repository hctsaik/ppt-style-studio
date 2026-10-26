#!/usr/bin/env node
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const Z=require('../jszip.min.js'),N=require('../native-styles.js');
const SOURCE=fs.readFileSync(path.join(__dirname,'../fixed-master/Fixed_Red_Template.pptx'));
const load=()=>Z.loadAsync(SOURCE),read=(z,n)=>z.file(n).async('string');
const match=(s,tag)=>s.match(new RegExp('<a:'+tag+'\\b[^>]*>[\\s\\S]*?</a:'+tag+'>'))[0];
const snapshot=async z=>Object.fromEntries(await Promise.all(Object.keys(z.files).filter(n=>!z.files[n].dir).map(async n=>[n,Buffer.from(await z.file(n).async('uint8array')).toString('base64')])));
const names={p:'ppt/theme/theme1.xml',m:'ppt/slideMasters/theme/theme2.xml',n:'ppt/notesMasters/theme/theme3.xml'};
let checks=0;
async function test(name,fn){await fn();checks++;console.log('PASS '+name);}
(async()=>{
 await test('source relationship graph finds actual master theme and protects notes',async()=>{
  const z=await load(),g=await N.resolveThemeGraph(z);
  assert.equal(g.presentationPart,'ppt/presentation.xml');assert.equal(g.sourceThemePart,names.m);assert.deepEqual(g.themeParts,[names.p,names.m]);assert(g.notesThemeParts.includes(names.n));
 });
 for(const source of ['common','theme'])await test(source+' profile updates only declared portions and recent colors',async()=>{
  const z=await load(),before=await snapshot(z),profile=await N.nativeStyleProfile(z,{source});
  const expected=source==='common'?['D95D68','E7BF4A','4E83CE','4B9679','7D8795','9371C6']:['4472C4','ED7D31','A5A5A5','FFC000','5B9BD5','70AD47'];
  assert.deepEqual(profile.palette.accents,expected);assert.equal(profile.palette.slots.dk1,'000000');
  const result=await N.applyProfileToZip(z,profile),after=await snapshot(z),actual=Object.keys(before).filter(n=>before[n]!==after[n]);
  assert.deepEqual(actual.sort(),[names.p,names.m,'ppt/presProps.xml'].sort());
  for(const part of [names.p,names.m]){const old=Buffer.from(before[part],'base64').toString(),now=await read(z,part);for(const tag of ['fontScheme','bgFillStyleLst'])assert.equal(match(now,tag),match(old,tag),tag+' '+part);for(const key of ['dk1','lt1','dk2','lt2','hlink','folHlink'])assert.equal(match(now,key),match(old,key));for(let i=1;i<=6;i++)assert.equal(N.readScheme(now)['accent'+i],expected[i-1]);assert(!match(now,'fillStyleLst').includes('F2F2F2'),'native slots must not become pale-gray specimen fills');}
  assert.equal(after[names.n],before[names.n]);assert.equal(result.scheme.accent1,expected[0]);assert.equal((await read(z,'ppt/presProps.xml')).match(/<a:srgbClr/g).length,8);
 });
 await test('theme palette comes from master, never first filename or presentation theme',async()=>{
  const z=await load();z.file(names.p,N.replaceAccents(await read(z,names.p),['FF0000','00FF00','0000FF','FF00FF','00FFFF','FFFF00']));z.file('000-fake/theme0.xml',await read(z,names.p));
  const profile=await N.nativeStyleProfile(z,{source:'theme'});assert.equal(profile.palette.accents[0],'4472C4');const fake=await read(z,'000-fake/theme0.xml');await N.applyProfileToZip(z,profile);assert.equal(await read(z,'000-fake/theme0.xml'),fake);
 });
 await test('nonstandard paths and second active master are followed through relationships',async()=>{
  const z=await load(),mr='ppt/slideMasters/_rels/slideMaster1.xml.rels',newTheme='assets/palettes/source-brand.xml';z.file(newTheme,await read(z,names.m));z.remove(names.m);z.file(mr,(await read(z,mr)).replace('/'+names.m,'../../'+newTheme));
  const second='ppt/other/secondMaster.xml',secondTheme='palette/another.xml';z.file(second,await read(z,'ppt/slideMasters/slideMaster1.xml'));z.file(secondTheme,await read(z,newTheme));z.file('ppt/other/_rels/secondMaster.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="t" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../../'+secondTheme+'"/></Relationships>');
  z.file('ppt/_rels/presentation.xml.rels',(await read(z,'ppt/_rels/presentation.xml.rels')).replace('</Relationships>','<Relationship Id="second" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="other/secondMaster.xml"/></Relationships>'));
  z.file('ppt/presentation.xml',(await read(z,'ppt/presentation.xml')).replace('</p:sldMasterIdLst>','<p:sldMasterId xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" id="2147483649" r:id="second"/></p:sldMasterIdLst>'));
  const profile=await N.nativeStyleProfile(z,{source:'common'});assert.equal(profile.graph.sourceThemePart,newTheme);assert(profile.graph.themeParts.includes(secondTheme));await N.applyProfileToZip(z,profile);assert.equal(N.readScheme(await read(z,secondTheme)).accent6,'9371C6');
 });
 await test('shared notes theme blocks without any package mutation',async()=>{
  const z=await load(),nr='ppt/notesMasters/_rels/notesMaster1.xml.rels';z.file(nr,(await read(z,nr)).replace('/'+names.n,'/'+names.m));const before=await snapshot(z);await assert.rejects(()=>N.applyProfileToZip(z,{source:'common'}),/shared with notes/);assert.deepEqual(await snapshot(z),before);
 });
 await test('missing master theme fails before mutation',async()=>{
  const z=await load();z.remove(names.m);const before=await snapshot(z);await assert.rejects(()=>N.applyProfileToZip(z,{source:'common'}),/Missing package part/);assert.deepEqual(await snapshot(z),before);
 });
 await test('invalid formatting matrix fails transactionally after valid earlier theme',async()=>{
  const z=await load();z.file(names.m,(await read(z,names.m)).replace(/<a:fmtScheme[\s\S]*?<\/a:fmtScheme>/,''));const before=await snapshot(z);await assert.rejects(()=>N.applyProfileToZip(z,{source:'common'}),/Missing formatting matrix/);assert.deepEqual(await snapshot(z),before);
 });
 await test('properties follows its relationship and permits standard part creation',async()=>{
  const z=await load(),pr='ppt/_rels/presentation.xml.rels',rp='properties/presentation-options.xml';z.file(rp,await read(z,'ppt/presProps.xml'));z.remove('ppt/presProps.xml');z.file(pr,(await read(z,pr)).replace('/ppt/presProps.xml','/'+rp));await N.applyProfileToZip(z,{source:'theme'});assert((await read(z,rp)).includes('clrMru'));assert(!z.file('ppt/presProps.xml'));
  const no=await load();no.remove('ppt/presProps.xml');no.file(pr,(await read(no,pr)).replace(/<Relationship[^>]*\/presProps"[^>]*\/>/,''));await N.applyProfileToZip(no,{source:'theme'});assert(no.file('ppt/presProps.xml'));assert((await read(no,pr)).includes('rIdNativeProfileProps'));
 });
 await test('prefixed relationships and content types accept properties creation',async()=>{
  const z=await load();z.remove('ppt/presProps.xml');const pr='ppt/_rels/presentation.xml.rels';z.file(pr,(await read(z,pr)).replace(/<Relationship[^>]*\/presProps"[^>]*\/>/,''));
  for(const name of ['_rels/.rels',pr,'ppt/slideMasters/_rels/slideMaster1.xml.rels','ppt/notesMasters/_rels/notesMaster1.xml.rels']){let xml=await read(z,name);xml=xml.replace(/(<\/?)(Relationships?)(\b)/g,'$1rel:$2$3').replace('xmlns="http://schemas.openxmlformats.org/package/2006/relationships"','xmlns:rel="http://schemas.openxmlformats.org/package/2006/relationships"');z.file(name,xml);}
  z.file('[Content_Types].xml',(await read(z,'[Content_Types].xml')).replace(/(<\/?)(Types|Override|Default)(\b)/g,'$1ct:$2$3').replace('xmlns="http://schemas.openxmlformats.org/package/2006/content-types"','xmlns:ct="http://schemas.openxmlformats.org/package/2006/content-types"'));
  await N.applyProfileToZip(z,{source:'common'});assert((await read(z,pr)).includes('<rel:Relationship Id="rIdNativeProfileProps"'));assert((await read(z,'[Content_Types].xml')).includes('<ct:Override PartName="/ppt/presProps.xml"'));assert.equal((await N.resolveThemeGraph(z)).presPropsPart,'ppt/presProps.xml');
 });
 await test('native matrices use measured safe fill roles without altering other theme markup',async()=>{
  const z=await load(),old=await read(z,names.m);await N.applyProfileToZip(z,{source:'common'});const now=await read(z,names.m),strip=x=>x.replace(/<a:accent[1-6]>[\s\S]*?<\/a:accent[1-6]>/g,'').replace(/<a:(fillStyleLst|lnStyleLst|effectStyleLst)\b[^>]*>[\s\S]*?<\/a:\1>/g,'');assert.equal(strip(now),strip(old));
  assert(match(now,'fillStyleLst').includes('<a:shade val="30000"/>'));assert(match(now,'fillStyleLst').includes('<a:tint val="20000"/>'));assert(match(now,'fillStyleLst').includes('<a:shade val="25000"/>'));
 });
 console.log(JSON.stringify({checks,sourceBytes:SOURCE.length,sourceSha256:require('crypto').createHash('sha256').update(SOURCE).digest('hex')}));
})().catch(e=>{console.error(e);process.exitCode=1;});
