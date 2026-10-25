/* Versioned fixed palette contract. Model/native/SVG/HTML tests are not Office visual certification. */
'use strict';
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const JSZip = require('jszip'), PptxGenJS = require('pptxgenjs');
const D = require('../deck');
const clone = x => JSON.parse(JSON.stringify(x));
const fixed = { blue:['D7E5F5','285785'], green:['D8EACF','356343'], red:['F3D0D0','8B3535'], yellow:['F6E4AD','745313'], gray:['E6E6E6','595959'] };
const families = ['fill','outline','underline','side'];
const themes = [...D.PRESETS, ...['FFFFFF','000000','FFFFCC','FFE0F0','00FFFF'].map(P=>({ ...D.PRESETS[0], P }))];
const table = { header:true, lastTotal:true, rows:[['Item','Value','Code'],['Alpha','00123','9007199254740993'],['Total','0.1234567890','last\nline']] };
const range = { r0:0, c0:1, r1:2, c1:2 };
const native = model => model.slides[0].items.find(i=>i.t==='tbl');
const nonBorder = cell => Object.fromEntries(Object.entries(cell).filter(([k])=>!['bT','bR','bB','bL','highlightEdges','highlightOrder','fillBorderOrder'].includes(k)));
const modelFor = (id, family, theme) => D.buildModel({ ...theme, tbAuto:false, tbStatus:false }, { table:{ ...table, his:D.tableApplyRange(table,range,id,family).his } });
let checks=0;
const check = async (name, fn) => { await fn(); console.log('PASS '+name); checks++; };
async function assertSerializations(model, theme) {
 const tb = native(model), cells = D.tableResolvedBorders(tb), svg = D.toSvg(model.slides[0]);
 const htmlDom = new JSDOM(D.tableHtml(model));
 const htmlRows=[...htmlDom.window.document.querySelectorAll('tr')];
 const out = await D.exportPptx({ PptxGenJS, JSZip }, theme, { model, type:'nodebuffer' });
 const zip = await JSZip.loadAsync(out.data), xml = await zip.file('ppt/slides/slide1.xml').async('string');
 const dom = new JSDOM(xml, { contentType:'application/xml' }), doc=dom.window.document;
 assert.equal(doc.getElementsByTagName('parsererror').length,0);
 assert.equal(doc.getElementsByTagName('a:tbl').length,1);assert.equal(doc.getElementsByTagName('p:pic').length,0);
 const xmlRows=[...doc.getElementsByTagName('a:tr')];
 const sideNames={bT:'top',bR:'right',bB:'bottom',bL:'left'};
 const textRows=xmlRows.map((row,r)=>[...row.getElementsByTagName('a:tc')].map((tc,c)=>{
  const cell=cells[r][c], props=tc.getElementsByTagName('a:tcPr')[0], htmlStyle=htmlRows[r].children[c].getAttribute('style');
  const fill=[...props.children].find(e=>e.tagName==='a:solidFill');
  assert.equal(fill?fill.getElementsByTagName('a:srgbClr')[0].getAttribute('val'):null,cell.fill);
  if(cell.fill){assert(svg.includes(`fill="#${cell.fill}"`));assert(htmlStyle.includes(`background:#${cell.fill}`));}
  for(const rp of tc.getElementsByTagName('a:rPr')){const color=rp.getElementsByTagName('a:srgbClr')[0];if(color)assert.equal(color.getAttribute('val'),cell.color);}
  for(const [edge,side] of Object.entries(sideNames)){
   const line=props.getElementsByTagName('a:ln'+edge.slice(1))[0];assert(line);
   if(cell[edge]){assert.equal(+line.getAttribute('w'),Math.round(cell[edge].w*12700));assert.equal(line.getElementsByTagName('a:srgbClr')[0].getAttribute('val'),cell[edge].c);assert(htmlStyle.includes(`border-${side}:${cell[edge].w}pt solid #${cell[edge].c}`));assert(svg.includes(`stroke="#${cell[edge].c}"`));}
   else assert.equal(line.getElementsByTagName('a:noFill').length,1);
  }
  return [...tc.getElementsByTagName('a:p')].map(p=>[...p.getElementsByTagName('a:t')].map(t=>t.textContent).join('')).join('\n');
 }));
 assert.deepEqual(textRows,D.tablePageRows(model));assert.deepEqual(model.slides[0].table.rawRows,table.rows);
 dom.window.close();htmlDom.window.close();
}
(async()=>{
 await check('six whitelisted hues, twelve v2 fills; legacy catalog is untouched',()=>{
  assert.deepEqual(D.TABLE_HIGHLIGHT_HUES.map(h=>h.id),['theme','blue','green','red','yellow','gray']);
  assert.deepEqual(D.TABLE_HIGHLIGHT_PRESETS.map(p=>p.id),['theme-light','theme-dark','mint','amber','rose','slate']);
  assert.equal(D.TABLE_HIGHLIGHT_PRESETS_V2.length,12);
  assert(D.TABLE_HIGHLIGHT_HUES.every(Object.isFrozen));assert(D.TABLE_HIGHLIGHT_PRESETS_V2.every(Object.isFrozen));
  for(const p of D.TABLE_HIGHLIGHT_PRESETS_V2){assert.match(p.id,/^v2-(theme|blue|green|red|yellow|gray)-(soft|deep)$/);assert(D.tableHighlightPreset(p.id));}
  for(const id of ['v2-blue','v2-blue-darker','v2-slate-soft','v3-blue-soft','v2-red-soft\" onclick=\"bad'])assert.equal(D.tableHighlightPreset(id),null);
 });
 await check('fixed colors are exact and invariant across every theme; both fill tones meet 4.5:1',()=>{
  for(const theme of themes)for(const [hue,[soft,dark]] of Object.entries(fixed))for(const tone of ['soft','deep'])for(const family of families){
   const id=`v2-${hue}-${tone}`, paint=D.tableHighlightPreset(id,theme,family);
   assert.deepEqual(paint,D.tableHighlightPreset(id,D.PRESETS[0],family));
   if(family==='fill'){assert.equal(paint.fill,tone==='soft'?soft:dark);assert.equal(paint.color,tone==='soft'?dark:'FFFFFF');assert.equal(paint.border,dark);assert(D.contrastOf(paint.fill,paint.color)>=4.5);}
   else{assert.equal(paint.stroke,dark);assert.equal(paint.fill,null);assert.equal(paint.color,null);assert.equal(paint.bold,null);assert(D.contrastOf(paint.stroke,'FFFFFF')>=3);}
  }
 });
 await check('only new theme hue follows the active theme, including white/black/pastel extremes',()=>{
  for(const theme of themes){for(const tone of ['soft','deep']){const paint=D.tableHighlightPreset(`v2-theme-${tone}`,theme);assert(D.contrastOf(paint.fill,paint.color)>=4.5);if(tone==='deep')assert.equal(paint.color,'FFFFFF');}
   for(const family of families.slice(1)){const a=D.tableHighlightPreset('v2-theme-soft',theme,family),b=D.tableHighlightPreset('v2-theme-deep',theme,family);assert.equal(a.stroke,b.stroke);assert(D.contrastOf(a.stroke,'FFFFFF')>=3);}
  }
  assert.notEqual(D.tableHighlightPreset('v2-theme-soft',{P:'C02754'}).fill,D.tableHighlightPreset('v2-theme-soft',{P:'285785'}).fill);
  assert.notEqual(D.tableHighlightPreset('v2-theme-soft',{P:'C02754'},'outline').stroke,D.tableHighlightPreset('v2-theme-soft',{P:'285785'},'outline').stroke);
 });
 await check('every new ID/family persists without migration, leaves input unchanged and repeats as no-op',()=>{
  for(const preset of D.TABLE_HIGHLIGHT_PRESETS_V2)for(const family of families){const before=clone(table),applied=D.tableApplyRange(table,range,preset.id,family),marked={...table,his:applied.his};assert(applied.changed);assert.deepEqual(table,before);assert.equal(applied.his[0].presetId,preset.id);assert.deepEqual(D.tableMarks(clone(marked),3,3).his,applied.his);assert.equal(D.tableApplyRange(marked,range,preset.id,family).changed,false);assert(D.tableClearRange(marked,range).changed);}
 });
 await check('imported deep line IDs and visible soft line IDs are visual no-ops without migration',()=>{
  for(const hue of D.TABLE_HIGHLIGHT_HUES)for(const family of families.slice(1)){
   const deep=D.tableApplyRange(table,range,`v2-${hue.id}-deep`,family),marked={...table,his:deep.his};
   const soft=D.tableApplyRange(marked,range,`v2-${hue.id}-soft`,family);assert.equal(soft.changed,false);assert.deepEqual(soft.his,deep.his);
  }
 });
 await check('all themes × hues × tones × families share model paint and preserve data, geometry and line-family text',()=>{
  for(const theme of themes){const baseline=D.buildModel({...theme,tbAuto:false,tbStatus:false},{table});
   for(const preset of D.TABLE_HIGHLIGHT_PRESETS_V2)for(const family of families){const m=modelFor(preset.id,family,theme),tb=native(m),base=native(baseline),p=D.tableHighlightPreset(preset.id,theme,family);
    assert.deepEqual(m.slides[0].table.rawRows,table.rows);assert.deepEqual(tb.colW,base.colW);assert.deepEqual(tb.rowH,base.rowH);
    tb.cells.forEach((row,r)=>row.forEach((cell,c)=>{
     if(family!=='fill')assert.deepEqual(nonBorder(cell),nonBorder(base.cells[r][c]));
     else if(c>=range.c0){assert.equal(cell.fill,p.fill);assert.equal(cell.color,p.color);assert(D.contrastOf(cell.fill,cell.color)>=4.5);}
    }));
    if(family!=='fill')for(const backgrounds of [['FFFFFF'],['000000'],['FFFFFF','000000']]){const stroke=D.tableHighlightStroke(p.stroke,backgrounds);for(const bg of backgrounds)assert(D.contrastOf(stroke,bg)>=3-1e-6);}
   }
  }
 });
 await check('native editable PPTX, SVG and HTML match model paint for all 48 v2 palette/family combinations',async()=>{
  for(const preset of D.TABLE_HIGHLIGHT_PRESETS_V2)for(const family of families)await assertSerializations(modelFor(preset.id,family,D.PRESETS[0]),D.PRESETS[0]);
 });
 await check('all 24 legacy palette/family combinations retain native/SVG/HTML paint and saved IDs',async()=>{
  for(const preset of D.TABLE_HIGHLIGHT_PRESETS)for(const family of families){const m=modelFor(preset.id,family,D.PRESETS[0]);assert.equal(D.tableMarks({his:[{type:'range',...range,presetId:preset.id,styleId:family}]},3,3).his[0].presetId,preset.id);await assertSerializations(m,D.PRESETS[0]);}
 });
 console.log(`${checks} versioned highlight palette checks passed.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
