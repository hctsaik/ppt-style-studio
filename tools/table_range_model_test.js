// Range highlights use source coordinates and editable native table styling.
// Run: node tools/table_range_model_test.js
const assert = require('node:assert/strict');
const D = require('../deck.js');
const JSZip = require('jszip');
const PptxGenJS = require('pptxgenjs');
const { JSDOM } = require('jsdom');
const clone = value => JSON.parse(JSON.stringify(value));
const params = Object.assign({}, D.PRESETS[0], { tbAuto: false });
const makeTable = (nR = 8, nC = 7) => ({ header: true, rows: Array.from({ length: nR }, (_, r) => Array.from({ length: nC }, (_, c) => `${r}:${c}`)) });
const model = (table, more = {}) => D.buildModel(Object.assign({}, params, more), { table });
const native = m => m.slides[0].items.find(it => it.t === 'tbl');
const apply = (T, q, id = 'theme-light') => Object.assign({}, T, { his: D.tableApplyRange(T, q, id).his });
const rect = (r0, c0, r1, c1) => ({ r0, c0, r1, c1 });
const has = (marks, r, c) => marks.some(h => D.tableMarkContains(h, r, c));
let checks = 0;
async function check(name, fn) { await fn(); checks++; console.log('  ✓ ' + name); }
(async () => {
  await check('normalize reversed rectangles and clip intersection, not disjoint ranges', () => {
    assert.deepEqual(D.tableNormalizeRange(rect(5, 4, 1, 2), 8, 7), rect(1, 2, 5, 4));
    assert.deepEqual(D.tableNormalizeRange(rect(-4, -2, 2, 3), 8, 7), rect(0, 0, 2, 3));
    assert.equal(D.tableNormalizeRange(rect(9, 0, 12, 1), 8, 7), null);
    for (const bad of [null, '', true, 1.5, Infinity, NaN, undefined]) assert.equal(D.tableNormalizeRange({ ...rect(0, 0, 1, 1), r0: bad }, 8, 7), null);
  });
  await check('six preset IDs are whitelisted and tokens remain contrast-safe across themes', () => {
    assert.deepEqual(D.TABLE_HIGHLIGHT_PRESETS.map(p => p.id), ['theme-light', 'theme-dark', 'mint', 'amber', 'rose', 'slate']);
    for (const p of [...D.PRESETS, { P: 'FFFFCC' }, { P: 'FFFFFF' }, { P: '000000' }]) for (const preset of D.TABLE_HIGHLIGHT_PRESETS) {
      const resolved = D.tableHighlightPreset(preset.id, p);
      assert(D.contrastOf(resolved.color, resolved.fill) >= 4.5 - 1e-6);
    }
    assert.equal(D.tableHighlightPreset('" onmouseover="alert(1)'), null);
    assert.equal(D.tableMarks({ his: [{ type: 'range', ...rect(0, 0, 3, 3), presetId: 'evil' }] }, 7, 8).his.length, 0);
  });
  await check('one large rectangle is one mark and neither apply nor clear mutates source data', () => {
    const T = makeTable(61, 12), before = clone(T), q = rect(0, 0, 60, 11);
    const result = D.tableApplyRange(T, q, 'mint');
    assert.equal(result.his.length, 1); assert.equal(result.changed, true); assert.equal(result.his[0].kind, 'focus');
    assert.deepEqual(T, before);
    const committed = Object.assign({}, T, { his: result.his }), snapshot = clone(committed);
    D.tableClearRange(committed, rect(4, 4, 8, 8)); assert.deepEqual(committed, snapshot);
    assert.equal(D.tableApplyRange(committed, q, 'mint').changed, false);
  });
  await check('same-style subrectangles and combined coverage are no-ops, including at capacity', () => {
    let T = apply(makeTable(), rect(1, 1, 5, 5), 'mint');
    let result = D.tableApplyRange(T, rect(2, 2, 4, 4), 'mint');
    assert.equal(result.changed, false); assert.deepEqual(result.his, T.his);
    T = apply(makeTable(), rect(1, 1, 3, 2), 'mint'); T = apply(T, rect(1, 3, 3, 4), 'mint');
    result = D.tableApplyRange(T, rect(1, 1, 3, 4), 'mint');
    assert.equal(result.changed, false); assert.equal(result.his.length, 2);
    const hole = { ...T, his: D.tableClearRange(T, rect(2, 2, 2, 2)).his };
    assert.equal(D.tableApplyRange(hole, rect(1, 1, 3, 4), 'mint').changed, true);
    const overlap = apply(T, rect(2, 2, 2, 2), 'rose');
    assert.equal(D.tableApplyRange(overlap, rect(1, 1, 3, 4), 'mint').changed, true);
    let full = apply(makeTable(5, 15), rect(0, 0, 3, 2), 'mint');
    for (let c = 3; c < 14; c++) full = apply(full, rect(1, c, 1, c), 'rose');
    assert.equal(full.his.length, 12);
    result = D.tableApplyRange(full, rect(1, 0, 2, 1), 'mint');
    assert.equal(result.error, undefined); assert.equal(result.changed, false); assert.deepEqual(result.his, full.his);
  });
  await check('new overlapping range changes only intersection and preserves old remainder', () => {
    let T = apply(makeTable(), rect(1, 1, 5, 5), 'mint');
    T = apply(T, rect(3, 3, 6, 6), 'rose');
    assert.equal(T.his.length, 2);
    assert.equal(D.tableRangeWinner(T.his, 2, 2).presetId, 'mint');
    assert.equal(D.tableRangeWinner(T.his, 4, 4).presetId, 'rose');
    assert.equal(D.tableMarkContains(T.his[0], 4, 4), false);
    assert.equal(D.tableRangeWinner(T.his, 0, 0), null);
    const cleared = D.tableClearRange(T, rect(4, 4, 4, 4));
    assert.equal(has(cleared.his, 4, 4), false, 'clearing must not reveal the old range');
    assert.equal(D.tableRangeWinner(cleared.his, 3, 3).presetId, 'rose');
    assert.equal(D.tableRangeWinner(cleared.his, 2, 2).presetId, 'mint');
  });
  await check('visual apply/clear preserve legacy semantic marks and reveal them unchanged', () => {
    const T = makeTable(); T.his = [{ type: 'col', i: 2, kind: 'rec' }, { type: 'row', i: 4, kind: 'warn' }, { type: 'cell', r: 2, c: 5 }];
    const before = D.tableMarks(T, 7, 8).his, q = rect(2, 2, 4, 3), result = D.tableClearRange(T, q);
    assert.equal(result.changed, false); assert.deepEqual(result.his, before);
    const applied = apply(T, q, 'mint');
    assert.deepEqual(applied.his.filter(h => h.type !== 'range'), before);
    const cleared = D.tableClearRange(applied, q);
    assert.equal(cleared.changed, true); assert.deepEqual(cleared.his, before);
    assert.deepEqual(D.tableMarks({ his: clone(applied.his) }, 7, 8).his, applied.his);
    assert.deepEqual(D.tableClearRange(applied, rect(0, 0, 7, 6)).his, before);
  });
  await check('invalid requests and the 12-mark cap are atomic, with exact replacement allowed', () => {
    let T = makeTable(3, 15);
    for (let c = 0; c < 12; c++) T = apply(T, rect(1, c, 1, c));
    const before = clone(T), blocked = D.tableApplyRange(T, rect(2, 13, 2, 13), 'rose');
    assert.equal(blocked.error, 'MARK_LIMIT'); assert.equal(blocked.changed, false); assert.deepEqual(blocked.his, T.his); assert.deepEqual(T, before);
    const replacement = D.tableApplyRange(T, rect(1, 5, 1, 5), 'amber');
    assert.equal(replacement.error, undefined); assert.equal(replacement.his.length, 12); assert.equal(D.tableRangeWinner(replacement.his, 1, 5).presetId, 'amber');
    assert.equal(D.tableApplyRange(T, rect(1, 1, 1, 1), 'bad').error, 'INVALID_PRESET');
    assert.equal(D.tableApplyRange(T, rect(100, 1, 101, 2), 'mint').error, 'INVALID_RANGE');
    const imported = [...T.his, { type: 'range', ...rect(2, 14, 2, 14), presetId: 'mint' }];
    assert.equal(D.tableMarks({ his: imported }, 15, 3).his.length, 13, 'import must not silently evict older valid marks');
  });
  await check('12 legacy semantic marks do not consume the separate 12-range capacity', () => {
    let T = makeTable(5, 15);
    T.his = Array.from({ length: 12 }, (_, c) => ({ type: 'col', i: c, kind: c % 2 ? 'warn' : 'rec' }));
    const legacy = D.tableMarks(T, 15, 5).his, source = clone(T.rows), original = clone(T);
    const first = D.tableApplyRange(T, rect(1, 0, 1, 0), 'mint');
    assert.equal(first.error, undefined); assert.equal(first.changed, true); assert.equal(first.his.length, 13);
    assert.deepEqual(first.his.filter(h => h.type !== 'range'), legacy); assert.deepEqual(T, original);
    T = { ...T, his: first.his };
    for (let c = 1; c < 12; c++) T = apply(T, rect(1, c, 1, c), 'mint');
    assert.equal(T.his.filter(h => h.type === 'range').length, 12); assert.equal(T.his.length, 24);
    const before = clone(T), blocked = D.tableApplyRange(T, rect(2, 14, 2, 14), 'rose');
    assert.equal(blocked.error, 'MARK_LIMIT'); assert.equal(blocked.changed, false);
    assert.deepEqual(blocked.his, before.his); assert.deepEqual(T, before); assert.deepEqual(T.rows, source);
    const replacement = D.tableApplyRange(T, rect(1, 5, 1, 5), 'amber');
    assert.equal(replacement.error, undefined); assert.equal(replacement.his.length, 24);
    assert.deepEqual(replacement.his.filter(h => h.type !== 'range'), legacy);
    assert.equal(D.tableApplyRange(T, rect(1, 0, 1, 1), 'mint').changed, false);
  });
  await check('row/column insertions and deletions transform ranges and exclusions together', () => {
    let T = apply(makeTable(), rect(1, 1, 5, 5), 'mint');
    T.his = D.tableClearRange(T, rect(3, 3, 3, 3)).his;
    const inserted = D.tableShiftMarks(T.his, 'row', 2, false, 9, 7);
    assert.equal(inserted[0].r1, 6); assert.equal(D.tableMarkContains(inserted[0], 4, 3), false); assert.equal(D.tableMarkContains(inserted[0], 3, 3), true);
    assert.deepEqual(D.tableShiftMarks(inserted, 'row', 2, true, 8, 7), T.his);
    const column = D.tableShiftMarks(T.his, 'col', 2, false, 8, 8);
    assert.equal(column[0].c1, 6); assert.equal(D.tableMarkContains(column[0], 3, 4), false);
    assert.deepEqual(D.tableShiftMarks(column, 'col', 2, true, 8, 7), T.his);
    assert.equal(D.tableShiftMarks([{ type: 'range', ...rect(2, 1, 2, 4), presetId: 'mint' }], 'row', 2, true, 7, 7).length, 0);
    assert.equal(D.tableShiftMarks([{ type: 'row', i: 2 }, { type: 'cell', r: 2, c: 3 }], 'row', 2, true, 7, 7).length, 0);
  });
  await check('palette paints selected header/status/key cells, leaving all unselected cells unchanged', () => {
    const T = { header: true, lastTotal: true, bold: [2], rows: [['Item', 'Status', 'Amount'], ['A', 'Pass', '00123'], ['Total', 'Hold', '9007199254740993']] };
    for (const look of D.TABLE_LOOKS.map(l => l[0])) for (const preset of D.TABLE_HIGHLIGHT_PRESETS) {
      const p = { tbLook: look }, base = native(model(T, p)), marked = native(model(apply(T, rect(0, 1, 2, 2), preset.id), p));
      const paint = D.tableHighlightPreset(preset.id, params);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        if (!c) assert.deepEqual(marked.cells[r][c], base.cells[r][c]);
        else { assert.equal(marked.cells[r][c].fill, paint.fill); assert.equal(marked.cells[r][c].color, paint.color); }
      }
      assert.deepEqual(marked.colW, base.colW); assert.deepEqual(marked.rowH, base.rowH);
    }
  });
  await check('legacy focus/recommended row highlights visibly include key/status cells', () => {
    const T = { header: true, bold: [1], rows: [['Item', 'Status', 'Value'], ['A', 'Pass', '123'], ['B', 'Hold', '456']] };
    for (const kind of ['focus', 'rec']) for (const look of ['clean', 'band', 'hair', 'zebra']) {
      const m = model({ ...T, his: [{ type: 'row', i: 1, kind }] }, { tbLook: look }), base = model(T, { tbLook: look });
      native(m).cells[1].forEach((cell, c) => assert.notEqual(cell.fill, native(base).cells[1][c].fill, `${look}/${kind}/${c}`));
    }
  });
  await check('visual presets do not create semantic legends or change original typography', () => {
    const T = makeTable(), base = model(T), marked = model(apply(T, rect(1, 1, 4, 4), 'mint'));
    assert.equal(marked.slides[0].items.filter(it => it.name === '圖例').length, 0);
    assert.deepEqual(native(marked).rowH, native(base).rowH);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 7; c++) assert.equal(native(marked).cells[r][c].bold, native(base).cells[r][c].bold);
    const semantic = { ...T, his: [{ type: 'col', i: 0, kind: 'rec' }, { type: 'col', i: 6, kind: 'warn' }] };
    const mixed = model(apply(semantic, rect(2, 2, 4, 4), 'mint'));
    assert.equal(mixed.slides[0].items.filter(it => it.name === '圖例').length, 0);
    assert.deepEqual(native(mixed).colW, native(model(semantic)).colW);
    assert.equal(native(mixed).y, native(model(semantic)).y);
  });
  await check('visual ranges mask legacy box paint without changing semantic data or legends', () => {
    const T = { ...makeTable(), hiStyle: 'box', note: 'Semantics remain', his: [{ type: 'row', i: 3, kind: 'rec' }, { type: 'row', i: 5, kind: 'warn' }] };
    const q = rect(3, 2, 3, 4), applied = apply(T, q, 'mint'), m = model(applied);
    const boxes = m.slides[0].table.boxes.filter(b => b.kind === 'rec');
    assert.equal(boxes.length, 2); assert(boxes.every(b => b.type === 'range'));
    for (const b of boxes) assert.equal(D.tableRangeIntersection(b, q), null);
    assert.deepEqual(applied.his.filter(h => h.type !== 'range'), D.tableMarks(T, 7, 8).his);
    const doc = new JSDOM(D.tableHtml(m)).window.document, row = doc.querySelectorAll('tr')[3];
    assert(row.children[0].getAttribute('style').includes('border-left:1.75pt'));
    assert(!row.children[3].getAttribute('style').includes('1.75pt'));
    assert(row.children[6].getAttribute('style').includes('border-right:1.75pt'));
    const all = apply(T, rect(0, 0, 7, 6), 'theme-dark'), base = model(T), covered = model(all);
    assert.deepEqual(covered.slides[0].items.filter(it => it.name === '圖例'), base.slides[0].items.filter(it => it.name === '圖例'));
    assert.equal(native(covered).y, native(base).y); assert.deepEqual(native(covered).rowH, native(base).rowH);
    assert.equal(covered.slides[0].table.boxes.length, 0);
    assert.deepEqual(model({ ...all, his: D.tableClearRange(all, rect(0, 0, 7, 6)).his }), base);
  });
  await check('table semantic footer legend is absent from model, SVG and native PPTX without losing marks or values', async () => {
    const T = {header:true,title:'Original table',note:'Original source note',rows:[['Item','Value','Status'],['重點','00123','Pass'],['推薦','9007199254740993','Hold']],his:[{type:'row',i:1,kind:'focus'},{type:'row',i:2,kind:'rec'},{type:'cell',r:2,c:2,kind:'warn'}],legend:{focus:'LEGEND_ONLY_FOCUS',rec:'LEGEND_ONLY_REC',warn:'LEGEND_ONLY_WARN'}};
    const before=JSON.stringify(T),m=model(T),sl=m.slides[0],tb=native(m);
    assert.equal(m.slides.length,1);assert.deepEqual(sl.table.rawRows,T.rows);assert.equal(sl.table.his.length,3);assert.equal(JSON.stringify(T),before);
    assert(!sl.items.some(it=>it.name==='圖例'));assert.equal(sl.table.slots.note.w,sl.table.tW);
    const withoutLabels=model({...T,legend:{}});assert.deepEqual(native(withoutLabels),tb);
    const plain=native(model({...T,his:[]}));assert.notEqual(tb.cells[1][0].fill,plain.cells[1][0].fill);assert.notEqual(tb.cells[2][0].fill,plain.cells[2][0].fill);
    const svg=D.toSvg(sl);assert(!svg.includes('LEGEND_ONLY_'));assert(svg.includes('重點')&&svg.includes('推薦'));
    const out=await D.exportPptx({PptxGenJS,JSZip},params,{model:m,type:'nodebuffer'}),zip=await JSZip.loadAsync(out.data),xml=await zip.file('ppt/slides/slide1.xml').async('string');
    assert(!xml.includes('LEGEND_ONLY_'));assert(!xml.includes('name="圖例"'));assert(xml.includes('00123')&&xml.includes('9007199254740993')&&xml.includes('重點')&&xml.includes('推薦'));
    const doc=new JSDOM(xml,{contentType:'application/xml'}).window.document;assert.equal(doc.getElementsByTagName('a:tbl').length,1);assert.equal(doc.getElementsByTagName('a:tc').length,9);
  });
  await check('full 61×12 source persists on one canvas and all range styles export as editable native cells', async () => {
    const T = makeTable(61, 12); T.rows[10] = Array(12).fill(''); T.rows[60][11] = '9007199254740993';
    let marked = T;
    for (let i = 0; i < 6; i++) marked = apply(marked, rect(0, i * 2, 60, i * 2 + 1), D.TABLE_HIGHLIGHT_PRESETS[i].id);
    const m = model(marked), tb = native(m); D.assertTableExportComplete(m);
    assert.equal(m.slides.length, 1); assert.equal(tb.cells.length, 61); assert(tb.cells.every(r => r.length === 12));
    assert.deepEqual(m.slides[0].table.rawRows, T.rows); assert.deepEqual(m.slides[0].table.sourceRows, Array.from({ length: 61 }, (_, r) => r));
    const svg = D.toSvg(m.slides[0]), html = D.tableHtml(m);
    const out = await D.exportPptx({ PptxGenJS, JSZip }, params, { model: m, type: 'nodebuffer' });
    const zip = await JSZip.loadAsync(out.data), xml = await zip.file('ppt/slides/slide1.xml').async('string');
    const doc = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
    assert.equal(doc.getElementsByTagName('a:tbl').length, 1); assert.equal(doc.getElementsByTagName('a:tr').length, 61); assert.equal(doc.getElementsByTagName('a:tc').length, 61 * 12);
    assert.equal(doc.getElementsByTagName('p:pic').length, 0);
    assert(xml.includes('9007199254740993'));
    for (const preset of D.TABLE_HIGHLIGHT_PRESETS) {
      const paint = D.tableHighlightPreset(preset.id, params);
      for (const value of [paint.fill, paint.color, paint.border]) { assert(svg.includes('#' + value), `SVG ${preset.id}/${value}`); assert(xml.includes(value), `PPTX ${preset.id}/${value}`); assert(html.includes('#' + value), `HTML ${preset.id}/${value}`); }
    }
    assert(tb.cells[0][0].bT && tb.cells[0][0].bL); assert(tb.cells[60][11].bB && tb.cells[60][11].bR);
    assert.equal(xml.match(/<a:lnL[^>]*>/g).length, 61 * 12); assert.equal(xml.match(/<a:lnR[^>]*>/g).length, 61 * 12);
  });
  console.log(`\nRange model: ${checks} checks passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
