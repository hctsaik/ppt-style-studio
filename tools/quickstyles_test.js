/* Model/native export and controller regressions. The tiny DOM adapter tests
 * handlers only; it is not a browser layout or PowerPoint acceptance claim. */
'use strict';
const assert=require('assert/strict');
const D=require('../deck.js'),Q=require('../quickstyles.js');
let checks=0,nativeExports=0;
const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const clone=x=>JSON.parse(JSON.stringify(x));
const SENTINEL={...D.BASE,P:'1267A3',PD:'4A205F',PT:'F2D7B4',semWarn:'DEAD00',A:'00DEAD',AL:'00DEAD',bFont:'Microsoft JhengHei'};
const FIXED=['D95D68','E7BF4A','4E83CE','4B9679','7D8795','9371C6','FFFFFF'];
function assertRoleContract(model,expected){assert.equal(model.quickStyle.baseColor,expected);assert.equal(model.slides[0].items[0].fill,expected);}
function stubRoot(){
 const nodes=new Map(),styles=new Map();
 const node=()=>({value:'',innerHTML:'',textContent:'',hidden:false,style:{setProperty(){}},dataset:{}});
 const doc={getElementById:id=>styles.get(id)||null,createElement:()=>node(),head:{appendChild:s=>styles.set(s.id,s)}};
 return {ownerDocument:doc,innerHTML:'',contains:()=>true,querySelector:selector=>{if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);}};
}
function button(dataset){return {dataset,closest(){return this;},hasAttribute:name=>name==='data-qs-download'&&dataset.download};}
const click=(root,dataset)=>root.onclick({target:button(dataset)});
(async()=>{
 check('Fixed palette order and exact user-selected colors',()=>{
  assert.deepEqual(Q.COMMON.map(c=>c.label),['紅','黃','藍','綠','灰','紫','白']);assert.deepEqual(Q.COMMON.map(c=>c.color),FIXED);
  assert.deepEqual(Q.STYLES.map(s=>s.key),['soft','outline','solid','side','marker','underline']);
 });
 check('Independent role contract and warning mutations',()=>{
  for(const [key,c] of [['main','1267A3'],['deep','4A205F'],['light','F2D7B4']]){
   const m=Q.buildModel(SENTINEL,{style:'solid',themeKey:key});assertRoleContract(m,c);
   const altered=Q.buildModel({...SENTINEL,semWarn:'FF0000',A:'00FF00',AL:'0000FF'},{style:'solid',themeKey:key});
   assert.deepEqual(altered.slides,m.slides);
   const wrong=clone(m);wrong.quickStyle.baseColor='DEAD00';wrong.slides[0].items[0].fill='DEAD00';
   assert.throws(()=>assertRoleContract(wrong,c),assert.AssertionError,'Contract must reject decorative warning binding');
  }
  assert.equal(Q.buildModel(SENTINEL,{style:'soft'}).slides[0].items[0].fill,'E7F0F6','Independent 10% sentinel/90% white expectation');
 });
 check('Every preset and custom palette follows theme while all common colors stay fixed',()=>{
  for(const p of [...D.PRESETS,SENTINEL]){
   assert.deepEqual(Q.palette(p,'theme').map(c=>c.color),[p.P,p.PD,p.PT]);
   assert.deepEqual(Q.palette(p,'common').map(c=>c.color),FIXED);
   for(const style of Q.STYLES)for(const c of Q.COMMON){const m=Q.buildModel(p,{source:'common',commonKey:c.key,style:style.key});assert.equal(m.quickStyle.baseColor,c.color);}
  }
 });
 check('Native construction: six styles, fixed type, no shadow, true white preview metadata',()=>{
  for(const s of Q.STYLES){
   const m=Q.buildModel(SENTINEL,{style:s.key,text:'原生文字 Native'}),sl=m.slides[0];
   assert.equal(sl.groups.length,1);assert.equal(sl.groups[0].from,0);assert.equal(sl.groups[0].to,sl.items.length-1);
   assert(sl.items.every(i=>i.t==='sp'&&!i.sh));
   for(const t of sl.items.filter(i=>i.runs)){assert.equal(t.noAutoShrink,true);assert(t.runs.every(r=>r.o.size===20&&r.o.font==='Microsoft JhengHei'));}
  }
  const outline=Q.buildModel(SENTINEL,{style:'outline'}).slides[0].items[0];assert.equal(outline.fill,null);assert.equal(outline.lw,1.25);
  const side=Q.buildModel(SENTINEL,{style:'side'}).slides[0].items[1];assert.equal(side.w,3/72);
  for(const style of ['outline','marker','underline']){
   const m=Q.buildModel(SENTINEL,{source:'common',commonKey:'white',style});
   assert.equal(m.quickStyle.baseColor,'FFFFFF');assert.equal(m.quickStyle.backgroundIntent,'dark');assert.equal(m.quickStyle.previewOnlyBackground,'252A34');
   assert(m.slides[0].items.filter(i=>i.runs).every(i=>i.runs.every(r=>r.o.color==='FFFFFF')));
   assert(!m.slides[0].items.some(i=>i.fill==='252A34'),'Preview backdrop must never become native shape');
  }
 });
 check('Highlighter opacity, explicit lines and no truncation or silent shrinking',()=>{
  for(const [style,transparency] of [['marker',76],['underline',65]]){
   const text='中文換行\nLongIdentifier_0123456789'.repeat(4),m=Q.buildModel(SENTINEL,{style,text}),its=m.slides[0].items;
   assert.equal(its.filter(i=>i.fill).length,text.split('\n').length);
   assert(its.filter(i=>i.fill).every(i=>i.ft===transparency));
   assert.equal(its.filter(i=>i.runs).map(i=>i.runs.map(r=>r.t).join('')).join('\n'),text);
   assert(its.filter(i=>i.runs).flatMap(i=>i.runs).every(r=>r.o.size===20));
  }
 });
 check('Snapshot and persistence preserve semantic keys rather than resolved theme colors',()=>{
  const state=Q.normalizeState({source:'theme',themeKey:'deep',commonKey:'purple',style:'marker',text:'原文 < > &'}),saved=JSON.parse(JSON.stringify(state));
  assert(!JSON.stringify(saved).includes('4A205F'));
  const snap=Q.snapshot(SENTINEL,saved),changed={...SENTINEL,PD:'552211'};
  assert.equal(snap.model.quickStyle.baseColor,'4A205F');assert.equal(Q.buildModel(changed,saved).quickStyle.baseColor,'552211');
  changed.PD='000000';state.text='changed';assert.equal(snap.selection.text,'原文 < > &');assert.equal(snap.params.PD,'4A205F');
  assert.equal(Q.getState(null),null);
 });
 const root=stubRoot(),calls=[],changes=[];let resolveDownload;
 const onDownload=snapshot=>{calls.push(snapshot);return new Promise(resolve=>{resolveDownload=resolve;});};
 Q.render(root,SENTINEL,{onDownload,onChange:s=>changes.push(s)});
 root.querySelector('[data-qs-text]').oninput({target:{value:'保存原文'}});
 await click(root,{qsSource:'common'});await click(root,{qsColor:'purple'});await click(root,{qsStyle:'marker'});
 const restored=Q.getState(root);
 check('Controller saves explicit common choice and text',()=>{assert.equal(restored.text,'保存原文');assert.equal(restored.commonKey,'purple');assert.equal(restored.style,'marker');assert(changes.length>=4);});
 const pending=click(root,{download:true});await click(root,{download:true});
 check('Repeated download is ignored while the same snapshot is pending',()=>{assert.equal(calls.length,1);assert.equal(calls[0].model.quickStyle.baseColor,'9371C6');});
 Q.render(root,{...SENTINEL,P:'ABCDEF'},{onDownload});
 resolveDownload(false);await pending;
 check('Cancellation restores download control without losing edits after style change',()=>{assert.equal(Q.getState(root).text,'保存原文');assert.equal(Q.getState(root).commonKey,'purple');assert(root.innerHTML.includes('已取消'));});
 const retry=click(root,{download:true});resolveDownload(true);await retry;
 check('A second requested download succeeds after cancellation',()=>{assert.equal(calls.length,2);assert(root.innerHTML.includes('已完成'));});
 const newRoot=stubRoot();Q.render(newRoot,{...SENTINEL,P:'654321'},{state:restored,onDownload:async()=>{throw new Error('test download error');}});
 await click(newRoot,{download:true});
 check('Restore and failed download retain source and recover enabled state',()=>{assert.deepEqual(Q.getState(newRoot),restored);assert(newRoot.innerHTML.includes('test download error'));assert(!newRoot.innerHTML.includes('正在檢查'));});
 await click(newRoot,{qsSource:'theme'});await click(newRoot,{qsColor:'main'});
 Q.render(newRoot,{...SENTINEL,P:'654321'},{});
 check('Returning to theme source uses current palette rather than saved RGB',()=>{assert(newRoot.innerHTML.includes('#654321'));assert.equal(Q.getState(newRoot).text,'保存原文');});
 const env=require('./bundled_export_env.js');
 for(const selection of [...Q.STYLES.map(s=>({style:s.key})),...['outline','marker','underline'].map(style=>({style,source:'common',commonKey:'white'}))]){
  const m=Q.buildModel(SENTINEL,{...selection,text:'中文字 Native'}),out=await D.exportPptx(env,m.params,{model:m,type:'uint8array'}),zip=await env.JSZip.loadAsync(out.data),xml=await zip.file('ppt/slides/slide1.xml').async('string');
  assert.equal((xml.match(/<p:grpSp>/g)||[]).length,1);assert(!/<p:pic\b|<a:blip\b/.test(xml));assert(!/<a:outerShdw\b/.test(xml));
  assert(!/<a:normAutofit\b/.test(xml),'Quick styles must not enable silent text shrink');
  assert(xml.includes('中文字 Native'));assert(!xml.includes('252A34'),'Dark preview backdrop is not exported');
  assert(xml.includes('sz="2000"'));assert(xml.includes('Microsoft JhengHei'));
  for(const it of m.slides[0].items){if(it.fill)assert(xml.includes('val="'+it.fill+'"'));if(it.runs)for(const r of it.runs)assert(xml.includes('val="'+r.o.color+'"'));}
  if(selection.style==='marker')assert(xml.includes('<a:alpha val="24000"/>'));if(selection.style==='underline')assert(xml.includes('<a:alpha val="35000"/>'));
  nativeExports++;
 }
 check('Nine native PPTX exports preserve colors, alpha, text, grouping and no auto-shrink',()=>assert.equal(nativeExports,9));
 console.log(JSON.stringify({checks,nativeExports,exporter:'repository bundled pptxgen.min.js',ui:'controller adapter only; no browser rendering',powerpoint:'not performed by this test'}));
})().catch(e=>{console.error(e&&e.stack?e.stack:e);process.exitCode=1;});
