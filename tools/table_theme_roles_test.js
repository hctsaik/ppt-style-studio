/* Reference-inspired theme roles. Model/XML verification is not Office visual certification. */
'use strict';
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const JSZip = require('jszip'), PptxGenJS = require('pptxgenjs');
const D = require('../deck');
const clone = x => JSON.parse(JSON.stringify(x));
const themes = [...D.PRESETS, ...['FFFFFF','000000','010101','FFFFCC','FFE0F0','00FFFF','727272'].map(P=>({...D.PRESETS[0],P}))];
const families = ['fill','outline','underline','side'];
const q = {r0:1,c0:1,r1:3,c1:2};
const table = {header:true,lastTotal:false,bold:[],rows:[['Item','Value','Code'],['Alpha','00123','A'],['Beta','9007199254740993','B'],['Gamma','0.1234567890','C']]};
const params = theme=>({...theme,tbAuto:false,tbStatus:false,tbHeaderStyle:'primary',tbGrid:'all'});
const apply = (t,range,id,family='fill')=>({...t,his:D.tableApplyRange(t,range,id,family).his});
const model = (t,theme=D.PRESETS[0])=>D.buildModel(params(theme),{table:t});
const native = m=>m.slides[0].items.find(it=>it.t==='tbl');
let checks=0;
async function check(name,fn){await fn();checks++;console.log('PASS '+name);}
function assertNativeRule(tb,p,r=1,c=1){
 const resolved=D.tableResolvedBorders(tb),cell=resolved[r][c];
 assert.deepEqual(cell.bT,{c:p.accent,w:p.accentWidth});
 assert(cell.highlightEdges.includes('bT'));
 if(r)assert.deepEqual(resolved[r-1][c].bB,cell.bT,'shared edge preserves the light rule');
}
async function assertExport(m,theme){
 const tb=native(m),cells=D.tableResolvedBorders(tb),svg=D.toSvg(m.slides[0]);
 const html=new JSDOM(D.tableHtml(m));
 const out=await D.exportPptx({PptxGenJS,JSZip},params(theme),{model:m,type:'nodebuffer'});
 const zip=await JSZip.loadAsync(out.data),xml=await zip.file('ppt/slides/slide1.xml').async('string');
 const dom=new JSDOM(xml,{contentType:'application/xml'}),doc=dom.window.document;
 assert.equal(doc.getElementsByTagName('parsererror').length,0);
 assert.equal(doc.getElementsByTagName('a:tbl').length,1);
 assert.equal(doc.getElementsByTagName('p:pic').length,0);
 const rows=[...doc.getElementsByTagName('a:tr')],htmlRows=[...html.window.document.querySelectorAll('tr')];
 rows.forEach((row,r)=>[...row.getElementsByTagName('a:tc')].forEach((tc,c)=>{
  const cell=cells[r][c],pr=tc.getElementsByTagName('a:tcPr')[0],fill=[...pr.children].find(n=>n.tagName==='a:solidFill');
  assert.equal(fill?fill.getElementsByTagName('a:srgbClr')[0].getAttribute('val'):null,cell.fill);
  for(const rp of tc.getElementsByTagName('a:rPr')){const color=rp.getElementsByTagName('a:srgbClr')[0];if(color)assert.equal(color.getAttribute('val'),cell.color);}
  for(const [edge,side] of Object.entries({bT:'top',bR:'right',bB:'bottom',bL:'left'}))if(cell[edge]){
   const line=pr.getElementsByTagName('a:ln'+edge.slice(1))[0];
   assert.equal(+line.getAttribute('w'),Math.round(cell[edge].w*12700));
   assert.equal(line.getElementsByTagName('a:srgbClr')[0].getAttribute('val'),cell[edge].c);
   assert(htmlRows[r].children[c].getAttribute('style').includes(`border-${side}:${cell[edge].w}pt solid #${cell[edge].c}`));
   assert(svg.includes(`stroke="#${cell[edge].c}"`));
  }
 }));
 const text=rows.map(row=>[...row.getElementsByTagName('a:tc')].map(tc=>[...tc.getElementsByTagName('a:p')].map(p=>[...p.getElementsByTagName('a:t')].map(t=>t.textContent).join('')).join('\n')));
 assert.deepEqual(text,D.tablePageRows(m));
 dom.window.close();html.window.close();
}
(async()=>{
 await check('new-click helper opts into v3 theme fills only, without aliasing old IDs',()=>{
  assert.deepEqual(D.TABLE_HIGHLIGHT_PRESETS_V3.map(p=>p.id),['v3-theme-soft','v3-theme-deep']);
  for(const hue of D.TABLE_HIGHLIGHT_HUES)for(const tone of ['soft','deep'])for(const family of families){
   const id=D.tableHighlightPresetId(hue.id,tone,family);
   assert.equal(id,hue.id==='theme'&&family==='fill'?`v3-theme-${tone}`:`v2-${hue.id}-${family==='fill'?tone:'soft'}`);
   assert(D.tableHighlightPreset(id,{},family));
  }
  for(const args of [['bad','soft','fill'],['theme','bad','fill'],['theme','soft','bad']])assert.equal(D.tableHighlightPresetId(...args),null);
  assert.equal(D.tableHighlightPreset('v3-gray-deep'),null);
 });
 await check('navy exactly matches the supplied medium-blue and pale-blue references',()=>{
  const deep=D.tableHighlightPreset('v3-theme-deep'),soft=D.tableHighlightPreset('v3-theme-soft');
  assert.equal(deep.fill,'2E75B6');assert.equal(deep.color,'FFFFFF');assert.equal(deep.accent,'DEE7F1');assert.equal(deep.accentWidth,1.25);
  assert.equal(soft.fill,'DEE7F1');assert.equal(soft.color,'1F3864');assert.equal(soft.accent,undefined);
  assert(D.contrastOf(deep.fill,deep.color)>4.84);assert(D.contrastOf(soft.fill,soft.color)>9);
 });
 await check('all nine themes and very light/dark custom colors retain readable fills and a visible role rule',()=>{
  for(const theme of themes){
   const deep=D.tableHighlightPreset('v3-theme-deep',theme),soft=D.tableHighlightPreset('v3-theme-soft',theme);
   assert.equal(deep.color,'FFFFFF');assert(D.contrastOf(deep.fill,deep.color)>=4.5);
   assert(D.contrastOf(soft.fill,soft.color)>=4.5);assert(D.contrastOf(deep.fill,deep.accent)>=3);
   const baseline=native(model(table,theme)),marked=apply(table,q,deep.id),m=model(marked,theme),tb=native(m);
   assert.deepEqual(tb.colW,baseline.colW);assert.deepEqual(tb.rowH,baseline.rowH);assert.deepEqual(tb.cells[0],baseline.cells[0],'header model remains unchanged');
   assertNativeRule(tb,deep);
   for(let r=1;r<=3;r++)for(let c=1;c<=2;c++){assert.equal(tb.cells[r][c].fill,deep.fill);assert.equal(tb.cells[r][c].color,'FFFFFF');}
   assert.deepEqual(m.slides[0].table.rawRows,table.rows);
  }
 });
 await check('saved theme-dark and v2 fills keep their historical resolver and never acquire a rule',()=>{
  for(const theme of themes){
   const dark=D.ensureContrast(theme.P,'FFFFFF',4.5),soft=D.mix(theme.P,'FFFFFF',.86);
   for(const id of ['theme-dark','v2-theme-deep']){const p=D.tableHighlightPreset(id,theme);assert.equal(p.fill,dark);assert.equal(p.color,'FFFFFF');assert.equal(p.accent,undefined);}
   const p=D.tableHighlightPreset('v2-theme-soft',theme);assert.equal(p.fill,soft);assert.equal(p.color,D.ensureContrast(theme.P,soft,4.5));
   for(const id of ['theme-dark','v2-theme-soft','v2-theme-deep']){const t=apply(table,q,id),before=clone(t),m=model(t,theme);assert.deepEqual(t,before);assert.deepEqual(D.tableMarks(clone(t),3,4).his,t.his);assert(native(m).cells.flat().every(c=>!c.highlightEdges));}
  }
 });
 await check('reapply explicitly upgrades only the selected range; save/reload and repeat retain identities',()=>{
  const old=apply(table,q,'v2-theme-deep'),before=clone(old),small={r0:2,c0:1,r1:2,c1:1};
  const upgraded=apply(old,small,D.tableHighlightPresetId('theme','deep'));
  assert.deepEqual(old,before);assert.equal(D.tableRangeWinner(upgraded.his,1,1,'fill').presetId,'v2-theme-deep');
  assert.equal(D.tableRangeWinner(upgraded.his,2,1,'fill').presetId,'v3-theme-deep');
  assert.deepEqual(D.tableMarks(clone(upgraded),3,4).his,upgraded.his);
  assert.equal(D.tableApplyRange(upgraded,small,'v3-theme-deep').changed,false);
  assert.equal(D.tableApplyRange(old,q,'v2-theme-deep').changed,false);
  for(const family of families.slice(1)){const t=apply(table,q,'v2-theme-deep',family);assert.equal(D.tableApplyRange(t,q,'v3-theme-deep',family).changed,false);}
 });
 await check('native top rule follows exclusions, explicit line overrides, and inserted source rows',()=>{
  const p=D.tableHighlightPreset('v3-theme-deep');let t=apply(table,q,p.id);
  t={...t,his:D.tableClearRange(t,{r0:2,c0:1,r1:2,c1:1}).his};const tb=native(model(t));
  assertNativeRule(tb,p,1,1);assertNativeRule(tb,p,3,1);assert(!tb.cells[2][1].highlightEdges);
  const lined=apply(apply(table,q,p.id),q,'v2-red-soft','outline'),linedTb=native(model(lined));
  assert.notEqual(D.tableResolvedBorders(linedTb)[1][1].bT.c,p.accent,'explicit outline takes priority');
  const original=apply(table,q,p.id),shifted={...original,rows:[table.rows[0],['New','0','N'],...table.rows.slice(1)],his:D.tableShiftMarks(original.his,'row',1,false,5,3)};
  assertNativeRule(native(model(shifted)),p,2,1);assert.equal(shifted.his[0].presetId,p.id);
 });
 await check('all theme roles export as editable native cells and borders matching SVG/HTML',async()=>{
  for(const theme of D.PRESETS)for(const id of ['v3-theme-soft','v3-theme-deep'])await assertExport(model(apply(table,q,id),theme),theme);
 });
 console.log(`${checks} theme-role checks passed.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
