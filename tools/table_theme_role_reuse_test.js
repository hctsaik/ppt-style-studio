/* Existing theme-role colors, dynamic saved references, and native serialization.
 * This is source/model/XML coverage, not browser or PowerPoint visual certification. */
'use strict';
const assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const JSZip=require('jszip'),PptxGenJS=require('pptxgenjs'),D=require('../deck');
const clone=x=>JSON.parse(JSON.stringify(x));
const roleIds=['main','deep','light','accent'],families=['fill','outline','underline','side'];
const ids=roleIds.map(r=>'v4-role-'+r),fixed={blue:['D7E5F5','285785'],green:['D8EACF','356343'],red:['F3D0D0','8B3535'],yellow:['F6E4AD','745313'],gray:['E6E6E6','595959']};
const extras=[{P:'FFFFFF',PD:'FFFFEE',PT:'010101',A:'000000',ink:'FFFFFF'},{P:'000000',PD:'010101',PT:'FFFFFF',A:'F2A541',ink:'000000'},{P:'E60012',semWarn:'00aaff',semGood:'0aBcDe',semBad:'fF1200'},{P:'00FFFF',A:'FF0000',useA:true},{P:'4F5BD5',A:'F2A541',useA:false}];
const themes=[...D.PRESETS,...extras.map(p=>({...D.BASE,...p}))];
const table={header:true,lastTotal:false,bold:[],rows:[['Item','Value','Code'],['Alpha','00123','A'],['Beta','9007199254740993','B'],['Gamma','0.1234567890','C']]};
const q={r0:1,c0:1,r1:3,c1:2},params=p=>({...p,tbAuto:false,tbStatus:false,tbHeaderStyle:'primary',tbGrid:'all'});
const apply=(t,id,family='fill',range=q)=>({...t,his:D.tableApplyRange(t,range,id,family).his});
const model=(t,p)=>D.buildModel(params(p),{table:t}),native=m=>m.slides[0].items.find(it=>it.t==='tbl');
const withoutBorder=c=>Object.fromEntries(Object.entries(c).filter(([k])=>!['bT','bR','bB','bL','highlightEdges','highlightOrder'].includes(k)));
let checks=0;async function check(name,run){await run();checks++;console.log('PASS '+name);}
async function assertExport(m,p){
 const tb=native(m),cells=D.tableResolvedBorders(tb),svg=D.toSvg(m.slides[0]),html=new JSDOM(D.tableHtml(m));
 const out=await D.exportPptx({PptxGenJS,JSZip},params(p),{model:m,type:'nodebuffer'}),zip=await JSZip.loadAsync(out.data);
 const dom=new JSDOM(await zip.file('ppt/slides/slide1.xml').async('string'),{contentType:'application/xml'}),doc=dom.window.document;
 assert.equal(doc.getElementsByTagName('parsererror').length,0);assert.equal(doc.getElementsByTagName('a:tbl').length,1);assert.equal(doc.getElementsByTagName('p:pic').length,0);
 const rows=[...doc.getElementsByTagName('a:tr')],htmlRows=[...html.window.document.querySelectorAll('tr')];
 const text=rows.map((row,r)=>[...row.getElementsByTagName('a:tc')].map((tc,c)=>{
  const cell=cells[r][c],pr=tc.getElementsByTagName('a:tcPr')[0],fill=[...pr.children].find(n=>n.tagName==='a:solidFill'),style=htmlRows[r].children[c].getAttribute('style');
  assert.equal(fill?fill.getElementsByTagName('a:srgbClr')[0].getAttribute('val'):null,cell.fill);
  if(cell.fill){assert(svg.includes(`fill="#${cell.fill}"`));assert(style.includes(`background:#${cell.fill}`));}
  for(const rp of tc.getElementsByTagName('a:rPr')){const color=rp.getElementsByTagName('a:srgbClr')[0];if(color)assert.equal(color.getAttribute('val'),cell.color);}
  for(const [edge,side]of Object.entries({bT:'top',bR:'right',bB:'bottom',bL:'left'}))if(cell[edge]){const line=pr.getElementsByTagName('a:ln'+edge.slice(1))[0];assert.equal(+line.getAttribute('w'),Math.round(cell[edge].w*12700));assert.equal(line.getElementsByTagName('a:srgbClr')[0].getAttribute('val'),cell[edge].c);assert(style.includes(`border-${side}:${cell[edge].w}pt solid #${cell[edge].c}`));assert(svg.includes(`stroke="#${cell[edge].c}"`));}
  return[...tc.getElementsByTagName('a:p')].map(p=>[...p.getElementsByTagName('a:t')].map(t=>t.textContent).join('')).join('\n');
 }));
 assert.deepEqual(text,D.tablePageRows(m));assert.deepEqual(m.slides[0].table.rawRows,table.rows);html.window.close();dom.window.close();
}
(async()=>{
 await check('four immutable role IDs are separate from old hue/tone IDs and reject unknown roles',()=>{
  assert.deepEqual(D.TABLE_HIGHLIGHT_ROLES.map(r=>r.id),roleIds);assert.deepEqual(D.TABLE_HIGHLIGHT_ROLES.map(r=>r.token),['P','PD','PT','AL']);
  assert(D.TABLE_HIGHLIGHT_ROLES.every(Object.isFrozen));assert(D.TABLE_HIGHLIGHT_PRESETS_V4.every(Object.isFrozen));
  assert.deepEqual(D.TABLE_HIGHLIGHT_PRESETS_V4.map(p=>p.id),ids);
  for(const id of ['v4-role-bad','v4-role-ink','v4-role-line','v4-role-accent-deep','v4-role-light" onclick="bad'])assert.equal(D.tableHighlightPreset(id),null);
  assert.equal(D.tableHighlightPreset('v4-role-main',{},'invalid'),null);assert.deepEqual(D.tableHighlightRolePresets({},'invalid'),[]);
  assert.equal(D.tableHighlightPresetId('theme','deep'),'v3-theme-deep');assert.equal(D.tableHighlightPresetId('theme','soft'),'v3-theme-soft');
 });
 await check('role fills match the actual Style Guide swatches and the existing semantic resolver',()=>{
  const expectedWarn=['9A5F00','9A5F00','9A5F00','9A5F00','9A5F00','C27C0E','F2A541','F07F2D','C27C0E'];
  for(const [i,p]of themes.entries()){
   const m=D.buildModel(p,{examples:false}),guide=m.slides.find(s=>s.key==='guide'),group=guide.groups.find(g=>g.name==='色彩用途與對比');
   const swatches=guide.items.slice(group.from,group.to+1).filter(it=>it.name==='色塊').map(it=>it.fill);
   assert.equal(swatches.length,8);if(i<9)assert.equal(m.sem.warn,expectedWarn[i]);
   assert.equal(m.sem.good,/^[\dA-F]{6}$/i.test(p.semGood||'')?p.semGood:p.P);assert.equal(m.sem.bad,/^[\dA-F]{6}$/i.test(p.semBad||'')?p.semBad:'A15C00');
   const paints=D.tableHighlightRolePresets(p);assert.deepEqual(paints.map(x=>x.fill),swatches.slice(0,4).map(x=>x.toUpperCase()));
   for(const paint of paints){assert.equal(paint.sourceColor,paint.fill);assert(D.contrastOf(paint.fill,paint.color)>=4.5);assert.equal(paint.tone,undefined);assert.equal(paint.accent,undefined);}
  }
 });
 await check('teal orange stays orange with readable dark text; AL is not incorrectly replaced by raw A',()=>{
  const teal=D.PRESETS.find(p=>p.id==='teal'),accent=D.tableHighlightPreset('v4-role-accent',teal),light=D.tableHighlightPreset('v4-role-light',teal);
  assert.equal(accent.fill,'F2A541');assert.equal(accent.color,'3A3A3A');assert(D.contrastOf(accent.fill,'FFFFFF')<4.5);assert(D.contrastOf(accent.fill,accent.color)>5.5);
  assert.equal(light.fill,'E0F0F0');assert.equal(light.color,'3A3A3A');
  const navy=D.PRESETS[0];assert.notEqual(D.tableHighlightPreset('v4-role-accent',navy).fill,navy.A);
  assert.equal(D.tableHighlightPreset('v4-role-accent',{...teal,semWarn:'00aaff'}).fill,'00AAFF');
  assert.equal(D.tableHighlightPreset('v4-role-accent',{...teal,useA:false}).fill,'9A5F00');
 });
 await check('recommendation metadata uses supplied rendered header fill and never hides or mutates a role',()=>{
  const p=D.PRESETS.find(p=>p.id==='teal'),before=clone(p),a=D.tableHighlightRolePresets(p,'fill',{headerFill:p.P});
  assert.equal(a.length,4);assert(a[0].matchesHeader);assert(!a[0].recommended);assert(a[3].recommended);assert(a[3].headerContrast>2.4);
  const swapped=D.tableHighlightRolePresets(p,'fill',{headerFill:p.A});assert(swapped[3].matchesHeader);assert(!swapped[3].recommended);assert(!swapped[0].matchesHeader);
  for(const paint of D.tableHighlightRolePresets(p,'fill',{headerFill:null})){assert.equal(paint.headerFill,null);assert.equal(paint.headerContrast,null);assert(!paint.matchesHeader);}
  assert.deepEqual(p,before);assert.deepEqual(a.map(x=>x.fill),swapped.map(x=>x.fill));
 });
 await check('each saved role follows later theme and role-token edits without rewriting its ID or source values',()=>{
  for(const id of ids)for(const family of families){const t=apply(table,id,family),before=clone(t);
   for(const p of themes){const m=model(t,p),tb=native(m),baseline=native(model(table,p)),paint=D.tableHighlightPreset(id,p,family);
    assert.deepEqual(tb.colW,baseline.colW);assert.deepEqual(tb.rowH,baseline.rowH);assert.deepEqual(tb.cells[0],baseline.cells[0]);
    if(family==='fill'){for(let r=1;r<=3;r++)for(let c=1;c<=2;c++){assert.equal(tb.cells[r][c].fill,paint.fill);assert.equal(tb.cells[r][c].color,paint.color);}}
    else tb.cells.forEach((row,r)=>row.forEach((c,k)=>assert.deepEqual(withoutBorder(c),withoutBorder(baseline.cells[r][k]))));
    assert.deepEqual(t,before);assert.deepEqual(D.tableMarks(clone(t),3,4).his,t.his);assert.equal(t.his[0].presetId,id);assert.equal(D.tableApplyRange(t,q,id,family).changed,false);
   }
   const token=D.TABLE_HIGHLIGHT_PRESETS_V4.find(p=>p.id===id).roleToken,key=token==='AL'?'semWarn':token;
   assert.equal(D.tableHighlightPreset(id,{...D.BASE,[key]:'123456'},family).sourceColor,'123456');
  }
 });
 await check('light role lines disclose contrast adjustment while preserving exact role source color',()=>{
  for(const p of themes)for(const id of ids)for(const family of families.slice(1)){const paint=D.tableHighlightPreset(id,p,family);
   assert.equal(paint.sourceColor,D.tableHighlightPreset(id,p).fill);assert.equal(paint.fill,null);assert.equal(paint.color,null);assert.equal(paint.strokeAdjusted,paint.stroke!==paint.sourceColor);assert(D.contrastOf(paint.stroke,'FFFFFF')>=3);
   for(const bg of ['000000','FFFFFF'])assert(D.contrastOf(D.tableHighlightStroke(paint.stroke,[bg]),bg)>=3);
  }
  const p=D.tableHighlightPreset('v4-role-light',D.PRESETS.find(p=>p.id==='teal'),'outline');assert(p.strokeAdjusted);assert.equal(p.sourceColor,'E0F0F0');assert.notEqual(p.stroke,p.sourceColor);
 });
 await check('fixed five palettes and v2/v3 saved meanings are unaffected by added role cards',()=>{
  for(const p of themes)for(const [hue,[soft,deep]]of Object.entries(fixed))for(const tone of ['soft','deep'])for(const family of families){const id=`v2-${hue}-${tone}`,paint=D.tableHighlightPreset(id,p,family);assert.deepEqual(paint,D.tableHighlightPreset(id,D.BASE,family));if(family==='fill')assert.equal(paint.fill,tone==='soft'?soft:deep);}
  for(const id of ['theme-dark','v2-theme-soft','v2-theme-deep','v3-theme-soft','v3-theme-deep']){const t=apply(table,id),before=clone(t);D.tableHighlightRolePresets(D.PRESETS[6]);model(t,D.PRESETS[6]);assert.deepEqual(t,before);assert.equal(t.his[0].presetId,id);assert.equal(D.tableApplyRange(t,q,id).changed,false);}
 });
 await check('role fills and lines share editable native PPTX, SVG and HTML paint',async()=>{
  for(const p of D.PRESETS)for(const id of ids)await assertExport(model(apply(table,id),p),p);
  for(const id of ids)for(const family of families.slice(1))await assertExport(model(apply(table,id,family),D.PRESETS[6]),D.PRESETS[6]);
 });
 console.log(`${checks} reusable theme-role checks passed.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
