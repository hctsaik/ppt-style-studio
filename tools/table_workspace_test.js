/* Scoped portable-table and reusable-style contracts. */
'use strict';
const assert=require('node:assert/strict'),D=require('../deck'),T=require('../table-workspace');
const clone=x=>JSON.parse(JSON.stringify(x));
let table={rows:[[' Label ','001','0'],['line1\nline2',' B ',' C ']],title:'<img onerror=1>',unit:'件',note:'原文',header:false,hcol:true,lastTotal:false,his:[],rules:[],cw:[1.5,2,2],types:{1:'text'},formats:{1:'raw'}};
table=D.tableMerge(table,{r0:0,c0:0,r1:1,c1:1});table=D.tableEditCell(table,0,0,'合併後新字');
const sized=D.adoptTableSizing({...D.BASE},table,{widthMode:'45',heightMode:'optimal'}),doc=T.makeProject('每週作品',sized.params,sized.table),round=T.validateProject(T.parse(JSON.stringify(doc)));
assert.deepEqual(round,doc);assert.deepEqual(round.table.rows,table.rows);assert.deepEqual(round.table.merges,table.merges);assert.equal(round.params.tbWidthMode,'45');assert.deepEqual(D.tableUnmerge(round.table,{r0:0,c0:0,r1:1,c1:1}).rows,D.tableUnmerge(table,{r0:0,c0:0,r1:1,c1:1}).rows);
for(const mutate of [o=>o.schemaVersion=999,o=>o.type='my-styles',o=>o.table.rows[0][0]=42,o=>o.table.merges[0].r1=999,o=>o.table.merges.push(clone(o.table.merges[0])),o=>o.table.surprise=1,o=>o.table.theme.P='url(javascript:x)',o=>o.table.his=[{type:'cell',r:'0',c:0}],o=>o.params.tbGrid='unknown']){const bad=clone(doc);mutate(bad);assert.throws(()=>T.validateProject(bad));}
assert.throws(()=>T.parse('{"__proto__":{"polluted":true}}'));assert.throws(()=>T.parse('1e999'));assert.throws(()=>T.parse(' '.repeat(T.MAX_BYTES+1)));
const style=T.makeStyle('<b>週報</b>',{...D.BASE,P:'663399',tbHeaderStyle:'primary',tbGrid:'none',tbCardOn:false,tbFont:'arial'}),prior=JSON.stringify({table,params:sized.params}),applied=T.applyStyle(sized.params,table,style);
assert.equal(JSON.stringify({table,params:sized.params}),prior);assert.deepEqual(applied.table.rows,table.rows);assert.deepEqual(applied.table.merges,table.merges);assert.deepEqual(applied.table.cw,table.cw);assert.equal(applied.params.tbWidthMode,'45');assert.equal(D.tableParams(applied.params,applied.table).P,'663399');assert(!('rows'in style.params));assert(!('size'in style.params));assert.deepEqual(T.applyStyle(applied.params,applied.table,style),applied);assert.throws(()=>T.validateStyles({type:T.STYLES,schemaVersion:1,styles:[{name:'x',params:{cw:[1,2]}}]}));assert.throws(()=>T.validateStyles({type:T.STYLES,schemaVersion:2,styles:[]}));
const m=D.buildModel(applied.params,{table:applied.table});assert.equal(m.params.P,'663399');assert.equal(m.slides[0].table.sizing.widthMode,'45');
console.log('PASS projects: typed version/strict invalid rejection/merged originals/45% roundtrip; styles: appearance-only/idempotent/local theme/source preserved');
