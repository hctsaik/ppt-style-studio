/* Export lifecycle tests use controlled promises: no browser, download or timers. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Flow=require('../export-flow.js');
const Preflight=require('../preflight.js');
const D=require('../deck.js');
const READY={status:'ready',canExport:true,errors:0,warnings:0,issues:[]};
const ADVICE={status:'advisory',canExport:true,errors:0,warnings:1,issues:[{severity:'warning',code:'SMALL_TEXT'}]};
const BLOCKED={status:'blocked',canExport:false,errors:1,warnings:0,issues:[{severity:'error',code:'INVALID_GEOMETRY'}]};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
let checks=0,failures=0;
async function check(name,fn){try{await fn();checks++;console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+'\n'+(e.stack||e));}}
function harness(overrides={}){
 const trace={built:[],checked:[],exported:[],reports:[],saved:[]};let version='initial';
 const options={revision:()=>version,build:(p,s)=>{trace.built.push([p,s]);return{params:p,slides:[{key:'one',items:[],groups:[]}],warns:[]};},check:(m,p)=>{trace.checked.push([m,p]);return READY;},export:async(p,s)=>{trace.exported.push([p,s]);return{data:'native',model:s.model};},report:(r,state)=>trace.reports.push({report:r,state}),...overrides};
 const flow=Flow.create(options);
 return{flow,trace,options,setRevision:v=>{version=v;},download:(p,s)=>flow.run(p,s).then(r=>{trace.saved.push(r);return r;})};
}
(async()=>{
 await check('clean run checks and exports exactly one shared copied snapshot',async()=>{
  const params={P:'123456',nested:{value:'00123'}},opt={labels:{caption:'中文'},table:{rows:[['x','9007199254740993']]}};
  const h=harness(),result=await h.download(params,opt);
  assert.equal(h.trace.built.length,1);assert.equal(h.trace.checked.length,1);assert.equal(h.trace.exported.length,1);assert.equal(h.trace.saved.length,1);
  const [checked,p]=h.trace.checked[0],[exportedP,settings]=h.trace.exported[0];assert.strictEqual(checked,settings.model);assert.strictEqual(result.model,checked);assert.strictEqual(p,exportedP);
  assert.notStrictEqual(p,params);assert.notStrictEqual(p.nested,params.nested);assert.deepEqual(p,params);assert.notStrictEqual(settings.table,opt.table);assert.deepEqual(settings.table,opt.table);
  assert.deepEqual(h.trace.reports.map(r=>r.state),['checked','exporting','complete']);assert.equal(h.flow.busy(),false);assert.equal(h.flow.last().state,'complete');
 });
 await check('provided model is copied once, never rebuilt, and used for both check and export',async()=>{
  const supplied={slides:[{items:[],groups:[]}],tableDocuments:[],custom:true};const h=harness();await h.flow.run({P:'334455'},{model:supplied});
  assert.equal(h.trace.built.length,0);const model=h.trace.checked[0][0];assert.notStrictEqual(model,supplied);assert.deepEqual(model,supplied);assert.strictEqual(model,h.trace.exported[0][1].model);
 });
 await check('async preparation owns the lock, receives snapshot parameters, and never reaches the exporter as an option',async()=>{
  const pending=deferred(),params={P:'112233',nested:{label:'00123'}},h=harness();let preparedParams,prepareCalls=0,secondPrepareCalls=0;
  const run=h.download(params,{prepare:async p=>{prepareCalls++;preparedParams=p;await pending.promise;return{params:p,slides:[{key:'prepared',items:[],groups:[]}]};},labels:{text:'original'}});
  assert.equal(h.flow.busy(),true);assert.equal(h.flow.last().state,'preparing');assert.equal(h.trace.checked.length,0);assert.equal(h.trace.exported.length,0);
  params.P='AA00CC';params.nested.label='changed';assert.notStrictEqual(preparedParams,params);assert.equal(preparedParams.P,'112233');assert.equal(preparedParams.nested.label,'00123');
  await assert.rejects(h.download(params,{prepare:async()=>{secondPrepareCalls++;return{slides:[]};}}),{code:'EXPORT_BUSY'});
  assert.equal(prepareCalls,1);assert.equal(secondPrepareCalls,0);pending.resolve();await run;
  assert.equal(h.trace.built.length,0);assert.equal(h.trace.checked.length,1);assert.equal(h.trace.exported.length,1);assert.equal(h.trace.saved.length,1);
  const [p,settings]=h.trace.exported[0];assert.strictEqual(p,preparedParams);assert.strictEqual(settings.model,h.trace.checked[0][0]);assert.equal(settings.model.params.P,'112233');assert.equal(Object.hasOwn(settings,'prepare'),false);
  assert.deepEqual(h.trace.reports.map(r=>r.state),['preparing','checked','exporting','complete']);
 });
 await check('cancel, style change, or invalidation during preparation suppresses check/export/save and allows retry',async()=>{
  for(const action of ['cancel','style','invalidate']){
   const pending=deferred(),h=harness(),run=h.download({P:'112233'},{prepare:async p=>{await pending.promise;return{params:p,slides:[{items:[],groups:[]}]};}});
   if(action==='cancel')h.flow.cancel();else if(action==='style')h.setRevision('new theme');else h.flow.invalidate();
   assert.equal(h.flow.busy(),true);pending.resolve();await assert.rejects(run,{code:action==='cancel'?'EXPORT_CANCELLED':'EXPORT_STALE'});
   assert.equal(h.trace.checked.length,0);assert.equal(h.trace.exported.length,0);assert.equal(h.trace.saved.length,0);assert.equal(h.flow.busy(),false);
   await h.download({P:'AA00CC'},{prepare:async p=>({params:p,slides:[{items:[],groups:[]}]})});assert.equal(h.trace.saved.length,1);assert.equal(h.trace.exported[0][0].P,'AA00CC');
  }
 });
 await check('failed async preparation releases the lock without validation or save and can be retried',async()=>{
  const pending=deferred(),h=harness(),run=h.download({P:'112233'},{prepare:async()=>pending.promise});
  pending.reject(Object.assign(new Error('PNG preparation failed'),{code:'PREPARE_FAILED'}));await assert.rejects(run,{code:'PREPARE_FAILED'});
  assert.equal(h.flow.busy(),false);assert.equal(h.flow.last().state,'failed');assert.equal(h.trace.built.length,0);assert.equal(h.trace.checked.length,0);assert.equal(h.trace.exported.length,0);assert.equal(h.trace.saved.length,0);
  await h.download({P:'112233'},{prepare:async p=>({params:p,slides:[{items:[],groups:[]}]})});assert.equal(h.trace.saved.length,1);assert.equal(h.flow.last().state,'complete');
 });
 await check('warnings are advisory and do not block or require a confirmation callback',async()=>{
  const h=harness({check:()=>ADVICE});await h.download({},{});assert.equal(h.trace.exported.length,1);assert.equal(h.trace.saved.length,1);assert.strictEqual(h.flow.last().report,ADVICE);
 });
 await check('blockers never reach native export or save, and restoring content permits retry',async()=>{
  let blocked=true;const h=harness({check:()=>blocked?BLOCKED:READY});await assert.rejects(h.download({},{}),{code:'EXPORT_BLOCKED'});assert.equal(h.trace.exported.length,0);assert.equal(h.trace.saved.length,0);assert.equal(h.flow.busy(),false);assert.strictEqual(h.flow.last().report,BLOCKED);
  blocked=false;await h.download({},{});assert.equal(h.trace.exported.length,1);assert.equal(h.trace.saved.length,1);
 });
 await check('cancel during checking avoids the exporter and releases the lock',async()=>{
  let flow;const h=harness({report:(_r,state)=>{if(state==='checked')flow.cancel();}});flow=h.flow;
  await assert.rejects(h.download({},{}),{code:'EXPORT_CANCELLED'});assert.equal(h.trace.exported.length,0);assert.equal(h.trace.saved.length,0);assert.equal(flow.busy(),false);assert.equal(flow.cancel(),false);
 });
 await check('duplicate clicks start only one export while a result is pending',async()=>{
  const pending=deferred(),h=harness({export:async(p,s)=>{h.trace.exported.push([p,s]);return pending.promise;}});
  const first=h.download({P:'112233'},{});assert.equal(h.flow.busy(),true);
  await assert.rejects(h.download({P:'445566'},{}),e=>e.code==='EXPORT_BUSY'&&e.exportCancelled===true);
  assert.equal(h.trace.exported.length,1);pending.resolve({data:'first'});await first;assert.equal(h.trace.saved.length,1);assert.equal(h.flow.busy(),false);
 });
 await check('cancel during export suppresses save and permits a later retry',async()=>{
  let pending=deferred();const h=harness({export:async(p,s)=>{h.trace.exported.push([p,s]);return pending.promise;}});
  const first=h.download({},{});assert.equal(h.flow.cancel(),true);assert.equal(h.flow.busy(),true,'uncancellable serializer still owns its lock until settlement');
  pending.resolve({data:'cancelled bytes'});await assert.rejects(first,e=>e.code==='EXPORT_CANCELLED'&&e.exportCancelled===true);assert.equal(h.trace.saved.length,0);assert.equal(h.flow.busy(),false);assert.equal(h.flow.last().state,'cancelled');
  pending=deferred();const second=h.download({},{});pending.resolve({data:'retry bytes'});await second;assert.equal(h.trace.saved.length,1);assert.equal(h.flow.last().state,'complete');
 });
 await check('changing style or data during export discards the stale result, then exports current content',async()=>{
  for(const change of ['style','data']){
   let pending=deferred();const params={P:'112233'},opt={table:{rows:[['ID','00123']]}};
   const h=harness({export:async(p,s)=>{h.trace.exported.push([p,s]);return pending.promise;}}),first=h.download(params,opt);
   if(change==='style')params.P='AA00CC';else opt.table.rows[0][1]='9007199254740993';h.setRevision(change+' changed');
   assert.equal(h.trace.exported[0][0].P,'112233');assert.equal(h.trace.exported[0][1].table.rows[0][1],'00123');
   pending.resolve({data:'old'});await assert.rejects(first,{code:'EXPORT_STALE'});assert.equal(h.trace.saved.length,0);assert.equal(h.flow.last().state,'stale');assert.equal(h.flow.busy(),false);
   pending=deferred();const retry=h.download(params,opt);pending.resolve({data:'current'});await retry;assert.equal(h.trace.saved.length,1);assert.deepEqual(h.trace.exported[1][0],params);assert.deepEqual(h.trace.exported[1][1].table,opt.table);
  }
 });
 await check('explicit invalidation makes an active snapshot stale even without a revision change',async()=>{
  const pending=deferred(),h=harness({export:async()=>pending.promise}),run=h.download({},{});h.flow.invalidate();pending.resolve({data:'stale'});
  await assert.rejects(run,{code:'EXPORT_STALE'});assert.equal(h.trace.saved.length,0);assert.equal(h.flow.busy(),false);assert.equal(h.flow.last().state,'stale');
 });
 await check('idle invalidation marks previous report stale without starting a new export',async()=>{
  const h=harness();h.flow.invalidate();assert.equal(h.flow.last(),null);await h.download({},{});h.flow.invalidate();assert.equal(h.flow.last().state,'stale');assert.equal(h.trace.exported.length,1);assert.equal(h.flow.busy(),false);
 });
 await check('build, check, and export exceptions all release the lock and allow retry',async()=>{
  for(const stage of ['build','check','export']){
   let fail=true,h;const special={};special[stage]=(...args)=>{if(fail)throw Object.assign(new Error(stage+' failed'),{code:'TEST_FAILURE'});return stage==='build'?{slides:[{items:[],groups:[]}]}:stage==='check'?READY:Promise.resolve({data:'retry'});};
   h=harness(special);await assert.rejects(h.download({},{}),{code:'TEST_FAILURE'});assert.equal(h.flow.busy(),false);assert.equal(h.trace.saved.length,0);assert.equal(h.flow.last().state,'failed');
   fail=false;await h.download({},{});assert.equal(h.trace.saved.length,1);assert.equal(h.flow.last().state,'complete');
  }
 });
 await check('snapshot clone preserves non-finite numbers so validation cannot mistake them for normal values',async()=>{
  const model={params:D.PRESETS[0],slides:[{w:D.W,h:D.H,items:[{t:'sp',kind:'rect',x:NaN,y:1,w:Infinity,h:1,fill:'000000'}],groups:[]}],warns:[]};
  let checked;const h=harness({check:m=>{checked=m;return Preflight.check(m);}});await assert.rejects(h.download({P:'112233'},{model}),{code:'EXPORT_BLOCKED'});
  assert(Number.isNaN(checked.slides[0].items[0].x));assert.equal(checked.slides[0].items[0].w,Infinity);assert.equal(h.trace.exported.length,0);assert.equal(h.trace.saved.length,0);
 });
 await check('saved and restored style/data snapshots keep exact values and are checked anew',async()=>{
  const saved=JSON.stringify({params:{P:'AA00CC',PD:'221144',custom:true},table:{rows:[['ID','Value'],['00123','9007199254740993'],['中文','1.123456789']]}}),restored=JSON.parse(saved);
  const h=harness();await h.download(restored.params,{table:restored.table});assert.deepEqual(h.trace.exported[0][0],restored.params);assert.deepEqual(h.trace.exported[0][1].table.rows,restored.table.rows);
  restored.params.P='007744';h.setRevision('restored and changed');await h.download(restored.params,{table:restored.table});assert.equal(h.trace.checked.length,2);assert.equal(h.trace.exported[1][0].P,'007744');assert.equal(h.trace.exported[0][0].P,'AA00CC');assert.equal(h.trace.saved.length,2);
 });
 await check('browser UMD exposes the same lifecycle API',async()=>{
  const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require.resolve('../export-flow.js'),'utf8'),sandbox);assert.equal(typeof sandbox.ExportFlow.create,'function');
  const f=sandbox.ExportFlow.create({build:()=>({slides:[]}),check:()=>READY,export:async()=>({data:'test'})});assert.equal((await f.run({},{})).data,'test');assert.equal(f.busy(),false);
 });
 console.log('Export flow: '+checks+' checks passed, '+failures+' failed.');if(failures)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
