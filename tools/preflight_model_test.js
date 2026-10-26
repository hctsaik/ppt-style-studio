/* Preflight regression: actual model checks; no browser/Office installation needed. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const D=require('../deck.js');
const P=require('../preflight.js');
const clone=x=>structuredClone(x);
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);Object.values(x).forEach(freeze);}return x;};
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
const text=(label='Simple text',size=18,color='202020',fill='FFFFFF')=>({t:'sp',kind:'rect',x:1,y:1,w:3,h:1,fill,runs:[{t:label,o:{size,color,font:'Microsoft JhengHei'}}],tx:{size,color,margin:0}});
const simple=()=>({params:D.PRESETS[0],slides:[{key:'test',title:'Test',w:D.W,h:D.H,items:[text()],groups:[]}],warns:[]});
const table=()=>D.buildModel({...D.PRESETS[0],tbSizingVersion:2,tbWidthMode:'90',tbHeightMode:'optimal'},{table:{header:true,sizingFont:{bodyPt:13,headerPt:11,scale:1,autoBoost:1},rows:[['項目','精確值'],['Identifier','00123'],['中文','9007199254740993'],['Decimal','1.123456789']]}});
const native=m=>m.slides[0].items.find(it=>it.t==='tbl');
const contains=(r,code,severity)=>r.issues.some(i=>i.code===code&&(!severity||i.severity===severity));
check('clean content is ready with no prompt-worthy issues',()=>assert.deepEqual(P.check(simple()),{status:'ready',label:'可以匯出',canExport:true,errors:0,warnings:0,issues:[]}));
check('browser UMD exposes the same check contract',()=>{const sandbox={Deck:D};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require.resolve('../preflight.js'),'utf8'),sandbox);assert.equal(sandbox.Preflight.check(simple()).status,'ready');});
check('checking frozen input does not change data, geometry, or fonts',()=>{const m=freeze(table()),before=JSON.stringify(m);assert(P.check(m).canExport);assert.equal(JSON.stringify(m),before);assert.deepEqual(P.check(m),P.check(m));});
check('every registered default page across all presets and sizes remains exportable',()=>{
 for(const params of D.PRESETS)for(const size of ['S','M','L']){
  const m=D.buildModel({...params,size}),r=P.check(m);assert.equal(r.errors,0,params.id+'/'+size+': '+JSON.stringify(r.issues.filter(i=>i.severity==='error')));
  assert.equal(m.slides.length,D.SLIDES.length);
 }
});
check('sentinel custom palette does not make low contrast or semantics blocking',()=>{
 const m=D.buildModel({...D.PRESETS[0],P:'FF00FF',PD:'061A40',PT:'00FFFF',A:'FCFC00',semWarn:'8B4513',ink:'999999',t2:'AAAAAA'}),r=P.check(m);
 assert.equal(r.errors,0);assert(r.canExport);
});
check('every registered native single-component export remains exportable',()=>{
 const params=D.PRESETS[0],collection=D.buildModel(params);let count=0;
 for(const sl of collection.slides)for(let group=0;group<(sl.groups||[]).length;group++){
  const result=P.check(D.elementModel(params,sl.key,group));assert.equal(result.errors,0,sl.key+'/'+group+': '+JSON.stringify(result.issues.filter(i=>i.severity==='error')));count++;
 }
 assert(count>500,'Cover every registered group, not just recommended examples');
});
check('fixed table widths and every height preserve an exportable complete table',()=>{
 for(const width of ['auto','90','45'])for(const height of ['optimal','larger','smaller','minimum']){
  const m=table();const built=D.buildModel({...m.params,tbWidthMode:width,tbHeightMode:height},{table:{rows:[['A','B'],['123','456']],header:true,sizingFont:{bodyPt:13,headerPt:11,scale:1,autoBoost:1}}});assert(P.check(built).canExport,width+'/'+height);
 }
});
check('missing native cells and rewritten values reuse the existing integrity guard',()=>{
 const a=table();native(a).cells[1].pop();const ar=P.check(a);assert.equal(ar.status,'blocked');assert(contains(ar,'TABLE_EXPORT_INCOMPLETE','error'));assert(ar.issues.some(i=>i.validator==='Deck.assertTableExportComplete'&&i.rowIndex===1&&i.columnIndex===1));
 const b=table();native(b).cells[1][1].runs[0].t='123';const br=P.check(b);assert.equal(br.status,'blocked');assert(br.issues.some(i=>i.rowIndex===1&&i.columnIndex===1));
});
check('deleting an entire table document is blocked by its surviving manifest',()=>{const m=table();m.slides=[];const r=P.check(m);assert.equal(r.status,'blocked');assert(contains(r,'TABLE_EXPORT_INCOMPLETE','error'));});
check('existing width limit failures stay blocked without truncation or font changes',()=>{
 const raw='90071992547409931234567890123456789012345678901234567890';
 const m=D.buildModel({...D.PRESETS[0],tbSizingVersion:2,tbWidthMode:'45'},{table:{rows:[['ID','Exact value'],['00123',raw]],header:true,sizingFont:{bodyPt:13,headerPt:11,scale:1,autoBoost:1}}});
 const before=JSON.stringify(m),r=P.check(m);assert.equal(r.status,'blocked');assert(contains(r,'TABLE_EXPORT_INCOMPLETE'));assert.equal(JSON.stringify(m),before);assert(m.slides[0].table.rawRows.flat().includes(raw));
});
check('invalid slide size, NaN/Infinity geometry, and non-positive extents block',()=>{
 for(const value of [0,-1,Infinity,NaN,57]){const m=simple();m.slides[0].w=value;assert(contains(P.check(m),'INVALID_SLIDE_SIZE','error'));}
 for(const [field,value]of [['x',NaN],['y',Infinity],['w',0],['h',-1]]){const m=simple();m.slides[0].items[0][field]=value;assert(contains(P.check(m),'INVALID_GEOMETRY','error'));}
});
check('visible off-slide geometry blocks; a partly off-slide transparent text box only advises',()=>{
 const m=simple();m.slides[0].items[0].x=D.W-1;assert(contains(P.check(m),'OUTSIDE_SLIDE','error'));
 m.slides[0].items[0].kind=null;delete m.slides[0].items[0].fill;const r=P.check(m);assert.equal(r.status,'advisory');assert(contains(r,'TEXT_BOX_OUTSIDE','warning'));
 m.slides[0].items[0].x=D.W+1;assert(contains(P.check(m),'OUTSIDE_SLIDE','error'));
});
check('invalid custom path coordinates and text font values block',()=>{
 const m=simple();m.slides[0].items[0].points=[{x:NaN,y:0}];assert(contains(P.check(m),'INVALID_PATH','error'));
 const n=simple();n.slides[0].items[0].runs[0].o.size=Infinity;assert(contains(P.check(n),'INVALID_TEXT','error'));
});
check('small text, contrast, estimated overflow and existing shrink never become blockers',()=>{
 const m=simple();m.slides[0].no=1;m.slides[0].items[0]=text('Small',8,'DDDDDD','FFFFFF');m.slides[0].items[0].shrunk=.7;m.warns=['[navy #1] overflow: estimated only'];
 const r=P.check(m);assert.equal(r.status,'advisory');assert.equal(r.errors,0);for(const code of ['SMALL_TEXT','LOW_CONTRAST','LAYOUT_ESTIMATE','EXISTING_TEXT_SHRINK'])assert(contains(r,code,'warning'),code);assert(r.issues.every(i=>i.reason&&i.fix&&i.location));
});
check('transparent backgrounds and decorative shapes do not get speculative contrast warnings',()=>{
 const m=simple();m.slides[0].items[0].kind=null;delete m.slides[0].items[0].fill;m.slides[0].items[0].runs[0].o.color='FFFFFF';assert(!contains(P.check(m),'LOW_CONTRAST'));
 m.slides[0].items.push({t:'sp',kind:'rect',x:0,y:0,w:1,h:1,fill:'FAFAFA'});assert(!contains(P.check(m),'LOW_CONTRAST'));
});
check('density advises while an omitted requested asset blocks',()=>{
 const m=table(),t=native(m);t.cells=Array.from({length:20},()=>Array.from({length:10},()=>({fill:'FFFFFF',runs:[{t:'a',o:{size:13,color:'222222'}}]})));t.rowH=Array(20).fill(.2);t.colW=Array(10).fill(.4);delete t.dataIntegrity;delete m.slides[0].table;delete m.tableDocuments;
 assert(contains(P.check(m),'DENSE_TABLE','warning'));const n=simple();n.tray={skipped:['missing']};assert(contains(P.check(n),'SKIPPED_ASSETS','error'));
});
check('new checks always reflect restored content and changed styles rather than cached approval',()=>{
 const m=simple();m.slides[0].items[0].w=0;assert.equal(P.check(m).status,'blocked');m.slides[0].items[0].w=3;assert.equal(P.check(m).status,'ready');
 m.slides[0].items[0].fill='202020';assert.equal(P.check(m).status,'advisory');m.slides[0].items[0].runs[0].o.color='FFFFFF';assert.equal(P.check(m).status,'ready');
 assert.equal(P.check(JSON.parse(JSON.stringify(m))).status,'ready');
});
check('malformed inputs return actionable blockers instead of throwing',()=>{
 for(const m of [null,{}, {slides:[null]}, {slides:[{items:'bad'}]}, {slides:[{items:[null]}]}])assert.equal(P.check(m).status,'blocked');
});
check('quick-style long text advises without shrinking and restored text clears the estimate',()=>{
 const Q=require('../quickstyles.js'),params=D.PRESETS[0];
 const long=Q.buildModel(params,{source:'common',commonKey:'red',style:'marker',text:'很長的中文字串'.repeat(25)}),before=JSON.stringify(long),r=P.check(long);
 assert.equal(r.status,'advisory');assert(contains(r,'QUICKSTYLE_TEXT_FIT','warning'));assert.equal(r.errors,0);assert.equal(JSON.stringify(long),before);
 const clean=Q.buildModel(params,{source:'common',commonKey:'red',style:'marker',text:'重點'});assert(!contains(P.check(clean),'QUICKSTYLE_TEXT_FIT'));
});
console.log('Preflight: '+checks+' regression checks passed.');
