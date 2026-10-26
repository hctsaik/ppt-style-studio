// Half-width reflow regression. These are reconstructed data fixtures, not a
// claim to reproduce the user's original document or a PowerPoint visual test.
const assert=require('node:assert/strict');
const D=require('../deck.js');
const PptxGenJS=require('pptxgenjs'),JSZip=require('jszip');
const {JSDOM}=require('jsdom');
const clone=x=>JSON.parse(JSON.stringify(x));
const font={bodyPt:17,headerPt:14.5,scale:1.3,autoBoost:1};
const fixture=()=>({header:true,hcol:true,title:'雲端方案比較',sizingFont:{...font},his:[{type:'range',r0:1,c0:1,r1:2,c1:2,presetId:'mint',family:'outline',borderWidth:2.25}],rows:[
 ['項目','Google','Gmail','Gemini','OneDrive','其他'],
 ['儲存空間（含Google Drive、Gmail及Google相簿）','15GB','100GB','200GB','2TB','30GB'],
 ['價格','免費','NT$6500','每月650','每年2300','999'],
 ['服務','Google雲端','Gmail','Gemini','同步處理','其他用途'],
 ['帳號','1','2','3','4','5'],
 ['說明','商務用','私人的','人工智慧','備份用途','原始文字']
]});
// Same 6x6 input used by table_data_grid_test, including the long storage stub.
const comparisonFixture=()=>({header:true,hcol:true,title:'方案比較（排版測試）',sizingFont:{...font},rows:[
 ['項目','免費版','Google AI Plus','Google AI Pro','Google AI Ultra 5x','Google AI Ultra 20x'],
 ['月費','NT$0','NT$165','NT$650','NT$3,300','NT$6,500'],
 ['適用對象','日常查詢或較輕度使用者','進階辦公、小資工作者','重度使用者','進階開發者、高頻創作者','企業級應用、高強度重度使用者'],
 ['Gmail、Google雲端硬碟、Google相簿儲存空間','15 GB','400 GB','5 TB','20 TB','30 TB'],
 ['Gemini用量限制','標準限制','標準限制的 2 倍額度','標準限制的 4 倍額度','Pro 方案的 5 倍','Pro 方案的 20 倍'],
 ['可用模型','3.5 Flash-Lite','3.6 Flash、3.1 Pro','3.8 Flash、3.1 Pro','3.8 Flash、3.1 Pro','3.8 Flash、3.1 Pro']
]});
const params=(width='45',height='optimal')=>({...D.PRESETS[0],tbSizingVersion:2,tbWidthMode:width,tbHeightMode:height});
const model=(table=fixture(),width='45',height='optimal')=>D.buildModel(params(width,height),{table});
const info=m=>m.slides[0].table,tbl=m=>m.slides[0].items.find(x=>x.t==='tbl');
const near=(a,b,e=1e-7)=>assert(Math.abs(a-b)<e,`${a} != ${b}`);
const strips=rows=>rows.map(row=>row.map(v=>v.replace(/\n/g,'')));
let count=0;
async function test(name,fn){await fn();count++;console.log('  ✓ '+name);}
if(require.main===module)(async()=>{
 await test('6x6 narrows by content/padding before bounded type, keeps short tokens and source marks',()=>{
  const t=fixture(),before=JSON.stringify(t),m=model(t),i=info(m),b=tbl(m);
  D.assertTableExportComplete(m);near(b.w/D.W,.45);assert.equal(m.slides.length,1);
  assert.equal(JSON.stringify(t),before);assert.deepEqual(i.rawRows,t.rows);assert.deepEqual(strips(i.displayRows),strips(t.rows));assert.deepEqual(i.his.map(h=>({type:h.type,r0:h.r0,c0:h.c0,r1:h.r1,c1:h.c1})),t.his.map(h=>({type:h.type,r0:h.r0,c0:h.c0,r1:h.r1,c1:h.c1})));
  assert(i.fs>=13.6&&i.fs<=17);assert(i.sizing.fit.effective.paddingPt>=4&&i.sizing.fit.effective.paddingPt<11.7);assert.equal(i.sizing.fit.applied,true);
  assert(i.displayRows[1][0].split('\n').length<=6);assert(i.rowH[1]<2.2);assert(i.tH<5.6);
  for(const token of ['Google','Gmail','Gemini','15GB','NT$6500'])for(let r=0;r<t.rows.length;r++)for(let c=0;c<t.rows[r].length;c++)if(t.rows[r][c].includes(token))assert(i.displayRows[r][c].includes(token),token+' stays whole');
  assert(!i.orphans.some(o=>o.why==='auto-wrap'));assert(b.cells.every(row=>row.every(c=>c.mL===i.sizing.fit.effective.paddingPt&&c.mR===i.sizing.fit.effective.paddingPt)));
 });
 await test('width/height changes and serialization restore original snapshots without cumulative shrink',()=>{
  const t=fixture(),n=model(t),wide=model(t,'90'),auto=model(t,'auto');
  assert.equal(info(wide).fs,font.bodyPt);assert.equal(info(auto).fs,font.bodyPt);assert.equal(info(wide).sizing.fit,undefined);
  assert.deepEqual(t.sizingFont,font);const a=D.adoptTableSizing(params(),t,{widthMode:'90'}),b=D.adoptTableSizing(a.params,a.table,{widthMode:'45'});
  assert.deepEqual(b.table.sizingFont,font);assert.deepEqual(info(D.buildModel(b.params,{table:b.table})).colW,info(n).colW);assert.equal(info(model(clone(t))).fs,info(n).fs);
  const reference=info(n);for(const height of ['minimum','smaller','optimal','larger']){const x=info(model(t,'45',height));assert.equal(x.fs,reference.fs);assert.deepEqual(x.colW,reference.colW);assert.deepEqual(x.displayRows,reference.displayRows);assert.deepEqual(x.sizing.fit,reference.sizing.fit);}
 });
 await test('missing/invalid v2 snapshots recover requested type through width and height changes',()=>{
  for(const invalid of [undefined,null,{},[],{bodyPt:0,headerPt:1,scale:1},{bodyPt:17,headerPt:14.5,scale:NaN}])for(const manual of [false,true]){
   const t=comparisonFixture();if(invalid===undefined)delete t.sizingFont;else t.sizingFont=invalid;
   if(manual)t.cw=[2,1,1.2,1.2,1.2,1.2];const before=JSON.stringify(t),auto=info(model(t,'auto'));
   const expected={bodyPt:auto.fs,headerPt:auto.hfs,scale:auto.k,autoBoost:auto.boost||1};
   assert(info(model(t)).fs<expected.bodyPt);
   for(const first of [{widthMode:'90'},{heightMode:'minimum'},{heightMode:'larger'}]){
    let a=D.adoptTableSizing(params(),t,first);assert.deepEqual(a.table.sizingFont,expected);
    for(const widthMode of ['90','auto','45','90','auto']){
     a=D.adoptTableSizing(a.params,a.table,{widthMode});assert.deepEqual(a.table.sizingFont,expected);
     if(widthMode!=='45'){const i=info(D.buildModel(a.params,{table:a.table}));near(i.fs,expected.bodyPt);near(i.hfs,expected.headerPt);}
     assert.deepEqual(a.table.rows,t.rows);assert.deepEqual(a.table.cw,t.cw);
    }
   }
   assert.equal(JSON.stringify(t),before);
  }
 });
 await test('existing 6x6 comparison fixture protects storage stub and service-name tokens',()=>{
  const t=comparisonFixture(),m=model(t),i=info(m);D.assertTableExportComplete(m);near(i.tW,D.W*.45);assert.deepEqual(strips(i.displayRows),strips(t.rows));
  assert(i.displayRows[3][0].split('\n').length<=6);assert(i.rowH[3]<2.2);assert(i.fs>=13.6);assert.equal(i.sizing.fit.effective.paddingPt,4);
  for(const token of ['Gmail','Google','Gemini'])for(let r=0;r<t.rows.length;r++)for(let c=0;c<t.rows[r].length;c++)if(t.rows[r][c].includes(token))assert(i.displayRows[r][c].includes(token));
  assert(!i.orphans.some(o=>o.why==='auto-wrap'));
 });
 await test('clean small table does not shrink font or padding just because 45% is selected',()=>{
  const t={header:true,sizingFont:{bodyPt:13,headerPt:11,scale:1,autoBoost:1},rows:[['項目','值'],['甲','00123'],['乙','98.7%']]},i=info(model(t));
  assert.equal(i.fs,13);assert.equal(i.hfs,11);assert.equal(i.sizing.fit.effective.paddingPt,9);assert.equal(i.sizing.fit.adjusted,false);assert.equal(i.exportComplete,true);
 });
 await test('padding search scores whole rows before settling, preserving numeric strings and capacity tokens',()=>{
  const t={header:true,sizingFont:{bodyPt:13,headerPt:11,scale:1,autoBoost:1},rows:[
   ['項目','原值','小數','金額','百分比','容量'],
   ['基本','00123','1.123456789','NT$6,500','98.70%','400 GB'],
   ['進階','00000','-00012.3400','US$1,234.50','+0.90 ppts','20 TB']
  ]},before=JSON.stringify(t),m=model(t),i=info(m);
  D.assertTableExportComplete(m);near(i.tW,D.W*.45);assert.equal(i.fs,13);assert.equal(i.hfs,11);
  assert.equal(i.sizing.fit.effective.paddingPt,5);assert.deepEqual(i.displayRows,t.rows);
  [.38,.34,.34].forEach((h,r)=>near(i.rowH[r],h));near(i.tH,1.06);
  assert.deepEqual(i.rawRows,t.rows);assert.equal(JSON.stringify(t),before);
 });
 await test('infeasible long numeric data gets readable fallback and reliable blocker, never false 45%',()=>{
  const t=fixture();t.rows[1][2]='90071992547409931234567890123456789012345678901234567890';const m=model(t),i=info(m);
  assert.equal(i.exportComplete,false);assert.equal(i.sizing.widthApplied,false);assert.equal(i.sizing.fit.applied,false);assert.match(i.exportReason,/尚未套用指定寬度/);assert.equal(i.fs,font.bodyPt);
  assert(i.colW[0]>1.2);assert(i.displayRows[1][0].includes('Gmail'));assert.deepEqual(i.rawRows,t.rows);assert.throws(()=>D.assertTableExportComplete(m),{code:'TABLE_EXPORT_INCOMPLETE'});
 });
 await test('long URLs and emoji clusters remain complete and all geometry is finite',()=>{
  const family='👨‍👩‍👧‍👦',t={header:true,sizingFont:{bodyPt:13,headerPt:11,scale:1,autoBoost:1},rows:[['項目','網址','備註'],['Gmail','https://example.com/a/very-long-identifier-without-spaces?ref=123456789',family.repeat(8)]]},m=model(t),i=info(m);
  D.assertTableExportComplete(m);assert.deepEqual(strips(i.displayRows),strips(t.rows));for(const line of i.displayRows[1][2].split('\n'))assert.equal(line.split(family).join(''),'');
  for(const item of m.slides[0].items)for(const key of ['x','y','w','h'])if(key in item)assert(Number.isFinite(item[key]));assert(!i.orphans.some(o=>o.why==='auto-wrap'));
 });
 await test('PowerPoint native XML uses effective fonts and point margins, not inch-scaled padding',async()=>{
  const m=model(),i=info(m),out=await D.exportPptx({PptxGenJS,JSZip},m.params,{model:m,type:'nodebuffer'}),zip=await JSZip.loadAsync(out.data),xml=await zip.file('ppt/slides/slide1.xml').async('string'),doc=new JSDOM(xml,{contentType:'application/xml'}).window.document;
  assert.equal(doc.getElementsByTagName('a:tbl').length,1);assert.equal(doc.getElementsByTagName('p:pic').length,0);
  for(const props of doc.getElementsByTagName('a:tcPr')){near(+props.getAttribute('marL')/12700,i.sizing.fit.effective.paddingPt,1e-4);near(+props.getAttribute('marR')/12700,i.sizing.fit.effective.paddingPt,1e-4);near(+props.getAttribute('marT')/12700,1,1e-4);near(+props.getAttribute('marB')/12700,1,1e-4);}
  const rows=[...doc.getElementsByTagName('a:tr')];rows.forEach((row,r)=>{const sizes=[...row.getElementsByTagName('a:rPr')].map(x=>+x.getAttribute('sz')/100);assert(sizes.every(s=>Math.abs(s-(r===0?i.hfs:i.fs))<=.011));});
  const widths=[...doc.getElementsByTagName('a:gridCol')].map(c=>+c.getAttribute('w'));near(widths.reduce((a,b)=>a+b,0)/914400,D.W*.45,6/914400);
 });
 console.log(`PASS ${count} half-width adaptive groups (model/OOXML; PowerPoint visual remains separate)`);
})().catch(e=>{console.error(e);process.exitCode=1;});

module.exports={fixture,comparisonFixture};
