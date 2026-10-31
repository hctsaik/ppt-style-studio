/* Scoped generated-mother copy tests. Original files are never modified. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),Z=require('jszip'),{JSDOM}=require('jsdom'),M=require('../master-rules'),R=require('../presentation-rules');
const OUT=path.resolve(__dirname,'../out/test/master-rules'),F=require('../fixed-master');
const win=new JSDOM('').window,options={DOMParser:win.DOMParser,XMLSerializer:win.XMLSerializer},A='http://schemas.openxmlformats.org/drawingml/2006/main';
const nodes=(d,ns,n)=>Array.from(d.getElementsByTagNameNS(ns,n));
async function changedParts(a,b){const aa=await Z.loadAsync(a),bb=await Z.loadAsync(b),changed=[];assert.deepEqual(Object.keys(aa.files).sort(),Object.keys(bb.files).sort());for(const k of Object.keys(aa.files)){if(aa.files[k].dir)continue;if(!(await aa.file(k).async('nodebuffer')).equals(await bb.file(k).async('nodebuffer')))changed.push(k);}return changed;}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});const bytes=Buffer.from(await F.exportPptx(Z)),original=Buffer.from(bytes);const book=await M.open(Z,bytes,options);
 assert.equal(M.PAGES.length,24);assert.equal(new Set(M.PAGES.map(p=>p.id)).size,24);assert.equal(book.pages.length,24);
 assert.equal((await M.apply(Z,bytes,R.blank(),options)).bytes,bytes);
 assert.throws(()=>R.assign(R.blank(),['cards'],['semantic'],R.DEFAULT),/語意角色/);
 assert.throws(()=>R.assign(R.blank(),['master:single:07'],['semantic'],R.DEFAULT),/語意角色/);
 let state=R.assign(R.blank(),['master:single:07'],['typography'],{...R.DEFAULT,body:18,title:30});
 state=R.assign(state,['master:single:06'],['layout'],{...R.DEFAULT,contentTop:1.3,titleHeight:.55});
 state=R.assign(state,['master:rectangles-1'],['shape'],{...R.DEFAULT,radius:.045,line:1.25});
 const initial=await M.inspect(Z,bytes,R.blank(),['master:single:07'],{...R.DEFAULT,font:'Arial'},options);
 for(const prop of ['font','size','x','y','h','adj','lw'])assert(initial.some(q=>q.prop===prop),'inspect '+prop);
 // Keep one deliberately different native sample size and change one explicit title position.
 const keep=initial.find(q=>q.prop==='size'&&q.index===9101);assert(keep);state=R.except(state,keep.id);
 const fix=initial.find(q=>q.prop==='y'&&q.index===2);state=R.fix(state,{...fix,value:.35});
 const result=await M.apply(Z,bytes,state,options);const changed=await changedParts(bytes,result.bytes);
 assert.deepEqual(changed.sort(),[book.pages[0].part,book.pages[1].part,book.pages[5].part].sort());
 const after=await M.open(Z,result.bytes,options);
 for(let i=0;i<24;i++){
  const a=book.pages[i],b=after.pages[i];assert.deepEqual(nodes(b.doc,A,'t').map(n=>n.textContent),nodes(a.doc,A,'t').map(n=>n.textContent),'all text retained '+i);
  assert.equal(nodes(b.doc,A,'highlight').length,nodes(a.doc,A,'highlight').length);
  assert.deepEqual(nodes(b.doc,A,'buChar').map(n=>n.getAttribute('char')),nodes(a.doc,A,'buChar').map(n=>n.getAttribute('char')));
 }
 const checks=await M.inspect(Z,bytes,state,['master:single:07'],{...R.DEFAULT,body:18,title:30},options);
 assert(checks.some(q=>q.id===keep.id&&q.except));assert(!checks.some(q=>q.prop==='font'));
 assert.equal(after.pages[0].shapes.find(s=>s.sid==='2').box.y,.35);
 assert(Math.abs(after.pages[1].shapes.find(s=>s.sid==='2').box.x-.65)<.00001);
 const extreme=R.assign(R.blank(),['master:single:07'],['layout'],{...R.DEFAULT,contentTop:3});
 await assert.rejects(M.apply(Z,bytes,extreme,options),/超出/);
 const bad=R.blank();bad.pages['master:single:07']={semantic:R.DEFAULT};await assert.rejects(M.apply(Z,bytes,bad,options),/語意角色/);
 // A selected component material page also supports typography, title, line/corner inspection and item fix.
 const cardIssues=await M.inspect(Z,bytes,R.blank(),['master:navy:cards'],R.DEFAULT,options);
 assert(cardIssues.some(q=>q.item.startsWith('內文')&&q.prop==='size'&&q.value===20));assert(cardIssues.some(q=>q.item.startsWith('標題')&&q.prop==='size'&&q.value===18));assert(cardIssues.some(q=>q.item.startsWith('圖說')&&q.prop==='size'&&q.value===12));
 const cardTitle=cardIssues.find(q=>q.prop==='y'&&q.index===2);assert(cardTitle);
 const cardState=R.fix(R.blank(),{...cardTitle,value:.36}),cardResult=await M.apply(Z,bytes,cardState,options);
 assert.deepEqual(await changedParts(bytes,cardResult.bytes),[book.pages[9].part]);
 assert(bytes.equals(original),'input bytes unchanged');
 fs.writeFileSync(path.join(OUT,'Mother-rules-copy.pptx'),result.bytes);fs.writeFileSync(path.join(OUT,'rules-state.json'),JSON.stringify(state,null,2));
 fs.writeFileSync(path.join(OUT,'model-report.json'),JSON.stringify({status:'pass',pageCount:24,stableIds:M.PAGES.map(p=>p.id),changedParts:changed,unchangedParts:'All unselected slides and all master/layout/theme/media/notes/relationships',allTextsAndBulletsRetained:true,highlightCount:after.pages.reduce((n,p)=>n+nodes(p.doc,A,'highlight').length,0),exceptions:true,explicitFix:true,unknownSemanticRejected:true,overflowRejected:true,cardPageFix:true},null,2));
 console.log('PASS: 24 stable IDs; selected 3 slide parts only; fonts/title/layout/corners/line; exception/fix; text/bullets/highlights; unsupported semantic/overflow blocked; source immutable');win.close();
})().catch(e=>{console.error(e.stack);win.close();process.exitCode=1;});
