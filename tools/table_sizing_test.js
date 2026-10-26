// Table sizing v2: physical PPT geometry, stable requested typography and lossless data.
// 45% may derive bounded effective typography; height choices never shrink text.
// Model/OOXML verification only; not PowerPoint visual certification.
const assert = require('node:assert/strict');
const D = require('../deck.js');
const PptxGenJS = require('pptxgenjs');
const JSZip = require('jszip');
const { JSDOM } = require('jsdom');
const fixtures = require('./table-cases.js');
const clone = x => JSON.parse(JSON.stringify(x));
const base = { ...D.PRESETS[0] };
const font = { bodyPt: 13, headerPt: 11, scale: 1, autoBoost: 1 };
const basic = () => ({ header: true, title: '季度摘要', unit: '原始數值', note: '資料來源：完整保留', sizingFont: { ...font }, rows: [['項目', '數值', '說明'], ['甲', '00123', '中文 English 文字完整保留'], ['乙', '98.7%', '第二列']] });
const p2 = (width = 'auto', height = 'optimal') => ({ ...base, tbSizingVersion: 2, tbWidthMode: width, tbHeightMode: height });
const build = (table = basic(), params = p2()) => D.buildModel(params, { table });
const info = m => m.slides[0].table;
const native = m => m.slides[0].items.find(it => it.t === 'tbl');
const geometry = m => { const t = native(m); return [m.slides[0].w, m.slides[0].h, t.x, t.y, t.w, t.h, t.colW, t.rowH, t.cells.map(r => r.map(c => c.runs))]; };
const near = (actual, expected, epsilon = 1e-7) => assert(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
const unbreak = rows => rows.map(row => row.map(s => s.replace(/\n/g, '')));
let checks = 0;
async function check(label, fn) { await fn(); checks++; console.log('  ✓ ' + label); }
async function exportXml(m) {
  const r = await D.exportPptx({ PptxGenJS, JSZip }, m.params, { model: m, type: 'nodebuffer' });
  const zip = await JSZip.loadAsync(r.data);
  return { zip, xml: await zip.file('ppt/slides/slide1.xml').async('string'), presentation: await zip.file('ppt/presentation.xml').async('string') };
}
function sourcePreserved(m, t) {
  assert.deepEqual(info(m).rawRows, t.rows);
  assert.deepEqual(native(m).dataIntegrity.sourceValues, t.rows);
  assert.deepEqual(info(m).sourceRows, t.rows.map((_, i) => i));
  assert.equal(m.slides.length, 1);
}
(async () => {
  await check('legacy mode remains geometrically unchanged even with inactive new choices', () => {
    for (const table of Object.values(fixtures)) for (const size of ['S', 'M', 'L']) for (const tbDense of ['comfy', 'normal', 'dense']) {
      const p = { ...base, size, tbDense }, legacy = build(table, p), dormant = build(table, { ...p, tbSizingVersion: 1, tbWidthMode: '45', tbHeightMode: 'minimum' });
      assert.deepEqual(geometry(legacy), geometry(dormant)); assert.equal(info(dormant).sizing, undefined);
    }
  });
  await check('missing imported version is legacy even when a new-table fallback uses v2; enums are strict', () => {
    assert.equal(D.sanitizeParams({ tbWidthMode: '45' }, p2()).tbSizingVersion, 1);
    assert.equal(D.sanitizeParams(null, p2()).tbSizingVersion, 1);
    assert.equal(D.sanitizeParams({ tbSizingVersion: 2, tbWidthMode: '45', tbHeightMode: 'minimum' }).tbSizingVersion, 2);
    assert.deepEqual(D.tableSizingOf(D.sanitizeParams({ tbSizingVersion: 99, tbWidthMode: '100', tbHeightMode: '<script>' })), { version: 1, widthMode: 'auto', heightMode: 'optimal' });
  });
  await check('fresh auto/optimal keeps the existing neutral baseline for every supplied fixture', () => {
    for (const table of Object.values(fixtures)) {
      const p = { ...base, size: 'L', tbDense: 'dense', tbPad: 'none', tbAuto: false }, a = D.adoptTableSizing(p, table, { fresh: true });
      const baseline = build(table, { ...base, size: 'M', tbDense: 'normal', tbPad: 'm', tbAuto: true, tbWidth: 'auto' });
      assert.deepEqual(geometry(build(a.table, a.params)), geometry(baseline));
      assert.equal(a.params.size, 'L'); assert.equal(a.params.tbDense, 'dense');
    }
  });
  await check('adoption snapshots this table font without mutating inputs or coupling to global S/M/L', () => {
    const p = { ...base, size: 'S', tbDense: 'comfy', tbAuto: false }, t = basic(); delete t.sizingFont;
    const before = JSON.stringify({ p, t }), old = build(t, p), a = D.adoptTableSizing(p, t, { widthMode: '45' });
    assert.equal(JSON.stringify({ p, t }), before); assert.equal(a.table.sizingFont.bodyPt, info(old).fs); assert.equal(a.table.sizingFont.headerPt, info(old).hfs);
    const reference = build(a.table, a.params);
    for (const size of ['S', 'M', 'L']) assert.deepEqual(geometry(build(a.table, { ...a.params, size, tbDense: 'dense', tbPad: 'none', tbAuto: false })), geometry(reference));
    a.table.rows.push(['新增', '456', '更多文字']); assert.equal(info(build(a.table, a.params)).fs, a.table.sizingFont.bodyPt);
    const roundtrip = D.adoptTableSizing(a.params, a.table, { heightMode: 'minimum' }); assert.deepEqual(roundtrip.table.sizingFont, a.table.sizingFont);
  });
  await check('90% and 45% are exact physical table widths for every height, preset and card mode', () => {
    for (const width of ['90', '45']) for (const height of ['optimal', 'larger', 'smaller', 'minimum']) for (const preset of D.PRESETS) for (const tbCardOn of [false, true]) {
      const t = basic(), m = build(t, { ...preset, tbSizingVersion: 2, tbWidthMode: width, tbHeightMode: height, tbCardOn });
      assert.equal(info(m).exportComplete, true); D.assertTableExportComplete(m);
      near(m.slides[0].w, D.W); near(native(m).w / m.slides[0].w, Number(width) / 100);
      near(native(m).colW.reduce((a, b) => a + b), native(m).w); sourcePreserved(m, t);
      assert.equal(info(m).fs, font.bodyPt); assert.equal(info(m).hfs, font.headerPt);
    }
  });
  await check('height modes are monotone, preserve type/wrapping, and never go below safe row heights', () => {
    for (const width of ['auto', '90', '45']) {
      const modes = ['minimum', 'smaller', 'optimal', 'larger'].map(height => build(basic(), p2(width, height)));
      for (let i = 0; i < modes.length; i++) {
        const a = info(modes[i]); assert.deepEqual(a.displayRows, info(modes[0]).displayRows);
        near(a.fs, font.bodyPt); near(a.hfs, font.headerPt);
        a.rowH.forEach((h, r) => { assert(h >= a.sizing.minimumRowH[r] - 1e-8); if (i) assert(h >= info(modes[i - 1]).rowH[r] - 1e-8); });
      }
      assert.equal(info(modes[0]).sizing.atMinimum, true);
    }
  });
  await check('45% wraps long Chinese/English/IDs without truncating raw data, and increases the single canvas height', () => {
    const t = basic(); t.rows = [['項目', '內容'], ...Array.from({ length: 28 }, (_, i) => ['第' + i + '列', '原始中文內容 EnglishIdentifierWithNoSpaces 原始資料不能省略。'.repeat(2)])];
    const wide = build(t, p2('90')), narrow = build(t, p2('45'));
    sourcePreserved(narrow, t); D.assertTableExportComplete(narrow);
    assert(native(narrow).h > native(wide).h); assert(narrow.slides[0].h > D.H);
    assert.deepEqual(unbreak(info(narrow).displayRows), unbreak(t.rows));
    assert(info(narrow).displayRows.some(row => row.some(s => s.includes('\n'))));
    assert.equal(info(narrow).fs, info(wide).fs); assert(!info(narrow).orphans.some(o => o.why === 'auto-wrap'));
  });
  await check('manual column widths preserve feasible proportions and never override fixed total width', () => {
    const t = { sizingFont: { ...font }, header: false, rows: [['a', 'b', 'c']], cw: [4, 2, 2] };
    for (const width of ['90', '45']) {
      const m = build(t, p2(width)); D.assertTableExportComplete(m); const ws = native(m).colW;
      near(ws[0] / ws[1], 2); near(ws[1] / ws[2], 1); near(native(m).w, D.W * +width / 100);
    }
    const a = D.adoptTableSizing(base, t, { widthMode: '45' }); assert(Array.isArray(a.table.cw)); sourcePreserved(build(a.table, a.params), t);
  });
  await check('an unbreakable number/too many columns blocks export explicitly, never silently widens a successful ratio', async () => {
    for (const t of [
      { sizingFont: { ...font }, header: true, rows: [['ID', '精確數值'], ['00123', '90071992547409931234567890123456789012345678901234567890']] },
      { sizingFont: { ...font }, header: true, rows: [Array.from({ length: 20 }, (_, i) => 'C' + i), Array.from({ length: 20 }, () => '1234567890')] }
    ]) {
      const m = build(t, p2('45')); sourcePreserved(m, t); assert.equal(info(m).exportComplete, false); assert.equal(info(m).blockedReasonCode, 'table-width'); assert.equal(info(m).sizing.widthApplied, false);
      assert.match(info(m).exportReason, /尚未套用指定寬度/); assert.throws(() => D.assertTableExportComplete(m), { code: 'TABLE_EXPORT_INCOMPLETE' });
      await assert.rejects(() => exportXml(m), { code: 'TABLE_EXPORT_INCOMPLETE' });
    }
  });
  await check('56-inch limit still blocks export without pagination, deletion, or reduced type', () => {
    const t = { sizingFont: { ...font }, header: true, rows: [['項目', '值'], ...Array.from({ length: 250 }, (_, i) => [String(i), '00123'])] }, m = build(t, p2('45', 'larger'));
    sourcePreserved(m, t); assert(m.slides[0].h > 56); assert.equal(info(m).blockedReasonCode, 'slide-size'); assert.equal(info(m).fs, 13);
    assert.throws(() => D.assertTableExportComplete(m), { code: 'TABLE_EXPORT_INCOMPLETE' }); assert(D.toSvg(m.slides[0]).includes('249'));
  });
  await check('native OOXML has exact presentation-relative width and measured rows, not raster screenshots', async () => {
    for (const width of ['90', '45']) for (const height of ['optimal', 'minimum']) {
      const m = build(basic(), p2(width, height)), { xml, presentation, zip } = await exportXml(m), doc = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
      assert.equal(doc.getElementsByTagName('a:tbl').length, 1); assert.equal(doc.getElementsByTagName('p:pic').length, 0);
      const pageW = Number(presentation.match(/<p:sldSz[^>]*cx="(\d+)"/)[1]);
      const frame = doc.getElementsByTagName('p:graphicFrame')[0], cx = Number(frame.getElementsByTagName('a:ext')[0].getAttribute('cx'));
      near(cx / pageW, Number(width) / 100, 2 / 914400);
      const colWidths = [...doc.getElementsByTagName('a:gridCol')].map(c => +c.getAttribute('w'));
      near(colWidths.reduce((a, b) => a + b) / pageW, Number(width) / 100, 5 / 914400);
      [...doc.getElementsByTagName('a:tr')].forEach((row, r) => near(+row.getAttribute('h') / 914400, native(m).rowH[r], 1 / 914400));
      const values = [...doc.getElementsByTagName('a:tr')].map(row => [...row.getElementsByTagName('a:tc')].map(c => [...c.getElementsByTagName('a:p')].map(p => [...p.getElementsByTagName('a:t')].map(t => t.textContent).join('')).join('\n')));
      assert.deepEqual(values, info(m).displayRows); assert.equal(Object.keys(zip.files).filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p)).length, 1);
    }
  });
  await check('mixed export rejects a larger shared width instead of mislabelling 45%; equal widths remain valid', async () => {
    const m = build(basic(), p2('45'));
    const same = clone(m); same.slides.push({ key: 'other', w: D.W, h: 20, items: [], groups: [] }); D.assertTableExportComplete(same); await exportXml(same);
    const wider = clone(m); wider.slides.push({ key: 'other', w: 20, h: D.H, items: [], groups: [] });
    assert.throws(() => D.assertTableExportComplete(wider), error => error.code === 'TABLE_EXPORT_INCOMPLETE' && /混合素材/.test(error.message));
    await assert.rejects(() => exportXml(wider), { code: 'TABLE_EXPORT_INCOMPLETE' });
    const missing = clone(wider); delete missing.slides[0].table.sizing; delete native(missing).dataIntegrity.sizing; assert.throws(() => D.assertTableExportComplete(missing), { code: 'TABLE_EXPORT_INCOMPLETE' });
    const invalid = clone(m); delete invalid.slides[0].table.sizing.actualWidth; delete native(invalid).dataIntegrity.sizing.actualWidth; assert.throws(() => D.assertTableExportComplete(invalid), { code: 'TABLE_EXPORT_INCOMPLETE' });
    const changed = clone(m); native(changed).w *= .9; assert.throws(() => D.assertTableExportComplete(changed), { code: 'TABLE_EXPORT_INCOMPLETE' });
  });
  await check('actual mixed legacy/v2 decks keep document-local sizing identity in either order', async () => {
    const old = { kind: 'table', params: base, table: basic() }, modern = { kind: 'table', params: p2('45'), table: basic() };
    for (const entries of [[old, modern], [modern, old]]) {
      const m = D.trayDeck(entries, { sugTitle: false }); D.assertTableExportComplete(m); await exportXml(m);
      const fixed = m.slides.find(sl => sl.table.sizing), tb = fixed.items.find(it => it.t === 'tbl'); near(tb.w / D.W, .45);
      delete fixed.table.sizing; delete tb.dataIntegrity.sizing; assert.throws(() => D.assertTableExportComplete(m), { code: 'TABLE_EXPORT_INCOMPLETE' });
    }
  });
  await check('malformed font snapshots fall back safely and explicit valid font edits stay table-scoped', () => {
    for (const sizingFont of [null, [], { bodyPt: 0, headerPt: 1, scale: 1 }, { bodyPt: Infinity, headerPt: 11, scale: 1 }]) {
      const m = build({ ...basic(), sizingFont }); assert(info(m).fs >= 10); D.assertTableExportComplete(m);
    }
    const t = { ...basic(), sizingFont: { ...font, bodyPt: 16, headerPt: 14 } }, m = build(t, p2('45', 'minimum'));
    assert.equal(info(m).fs, 16); assert.equal(info(m).hfs, 14); assert.equal(m.params.size, 'M'); D.assertTableExportComplete(m);
  });

  await check('wrapping preserves grapheme clusters and status semantics', () => {
    const family = '👨‍👩‍👧‍👦', clusters = [family, 'e\u0301', '🇹🇼', '👍🏽'];
    for (const cluster of clusters) {
      const t = { sizingFont: { ...font }, header: false, rows: [[cluster.repeat(12), 'x', 'y', 'z', 'w']] }, m = build(t, p2('45'));
      for (const line of info(m).displayRows[0][0].split('\n')) assert.equal(line.split(cluster).join(''), '', 'line only contains complete grapheme clusters');
      sourcePreserved(m, t);
    }
    const t = { sizingFont: { ...font }, header: true, cw: [1, 1, 1, 1, 1, .6], rows: [['A', 'B', 'C', 'D', 'E', '狀態'], ['a', 'b', 'c', 'd', 'e', '進行中']] }, m = build(t, p2('45'));
    assert.equal(info(m).displayRows[1][5].replace(/^●\s*/,'').replace(/\n/g,''),'進行中'); assert(native(m).cells[1][5].runs[0].t.includes('●')); assert(native(m).cells[1][5].bold); D.assertTableExportComplete(m);
  });
  await check('offline grapheme fallback does not require Intl.Segmenter or Array.at', () => {
    const fs = require('node:fs'), vm = require('node:vm'), sandbox = { module: { exports: {} }, require };
    vm.runInNewContext('Intl.Segmenter=undefined;Array.prototype.at=undefined;\n' + fs.readFileSync(require.resolve('../deck.js'), 'utf8'), sandbox);
    const fallback = sandbox.module.exports;
    for (const cluster of ['👨‍👩‍👧‍👦', 'e\u0301', '🇹🇼', '👍🏽']) {
      const t = { sizingFont: { ...font }, header: false, rows: [[cluster.repeat(12), 'a', 'b', 'c']] }, m = fallback.buildModel(p2('45'), { table: t });
      for (const line of m.slides[0].table.displayRows[0][0].split('\n')) assert.equal(line.split(cluster).join(''), '');
    }
  });
  await check('very long individual cells report size limits instead of a spread-argument crash', () => {
    const t = { sizingFont: { ...font }, header: false, rows: [['X'.repeat(150000)]] }, m = build(t, p2('45'));
    sourcePreserved(m, t); assert.equal(info(m).blockedReasonCode, 'slide-size'); assert.equal(info(m).displayRows[0][0].replace(/\n/g, ''), t.rows[0][0]);
  });
  await check('update imports preserve the per-table snapshot; new imports leave fresh choice to the UI', () => {
    const t = basic(), before = clone(t), rows = [['項目', '數值'], ['新增', '00123']];
    assert.deepEqual(D.tableFromPaste(rows, t, 'update').sizingFont, t.sizingFont);
    assert.equal(D.tableFromPaste(rows, t, 'new').sizingFont, undefined); assert.deepEqual(t, before);
    assert.throws(() => D.adoptTableSizing(p2(), t, { bodyPt: 8 }), { code: 'TABLE_FONT_INVALID' });
    assert.equal(D.adoptTableSizing(p2(), t, { bodyPt: 16 }).table.sizingFont.bodyPt, 16);
  });
  console.log(`PASS ${checks} table sizing groups (model and native OOXML; no real-browser/PowerPoint visual certification)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
