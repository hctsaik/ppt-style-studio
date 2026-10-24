// Lossless, native single-canvas tables. No browser, Office CLI or rendering service required.
const assert = require('assert/strict');
const { JSDOM } = require('jsdom');
const D = require('../deck.js');
const PptxGenJS = require('pptxgenjs');
const JSZip = require('jszip');
const env = { PptxGenJS, JSZip };
const params = Object.assign({}, D.PRESETS[0], { tbAuto: false });
let checks = 0;
function check(name, run) { run(); checks++; console.log('  ✓ ' + name); }
const model = (table, extra) => D.buildModel(Object.assign({}, params, extra), { table });
const native = (m, page = 0) => m.slides[page].items.find(i => i.t === 'tbl');
const text = c => c.runs.map(r => r.t + (r.o.br ? '\n' : '')).join('');
const matrix = (m, page = 0) => native(m, page).cells.map(r => r.map(text));
const clone = value => JSON.parse(JSON.stringify(value));
const fixture = (count, cols = 12, header = true) => ({ header, rows: [
  ...(header ? [Array.from({ length: cols }, (_, c) => 'C' + c)] : []),
  ...Array.from({ length: count }, (_, r) => Array.from({ length: cols }, (_, c) => String((r + 1) * 100 + c)))
] });
const coverage = m => m.slides.flatMap(sl => sl.table.sourceRows.slice(sl.table.h0));
const fullMatrix = m => [...(m.slides[0].table.h0 ? matrix(m).slice(0, 1) : []), ...m.slides.flatMap((sl, p) => matrix(m, p).slice(sl.table.h0))];
function htmlRows(html) {
  const dom = new JSDOM(html);
  for (const br of dom.window.document.querySelectorAll('br')) br.replaceWith('\n');
  return Array.from(dom.window.document.querySelectorAll('tr'), row => Array.from(row.querySelectorAll('td'), cell => cell.textContent));
}
function xmlRows(xml) {
  const document = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
  assert.equal(document.getElementsByTagName('parsererror').length, 0);
  return Array.from(document.getElementsByTagName('a:tr'), row => Array.from(row.getElementsByTagName('a:tc'), cell =>
    Array.from(cell.getElementsByTagName('a:p'), p => Array.from(p.getElementsByTagName('a:t'), t => t.textContent).join('')).join('\n')));
}
async function pptxFiles(m) {
  const result = await D.exportPptx(env, params, { model: m, type: 'nodebuffer' });
  const zip = await JSZip.loadAsync(result.data);
  const paths = Object.keys(zip.files).filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a, b) => Number(a.match(/slide(\d+)\.xml$/)[1]) - Number(b.match(/slide(\d+)\.xml$/)[1]));
  return { zip, xml: await Promise.all(paths.map(p => zip.file(p).async('string'))) };
}
function assertCoverage(m, t, wrapped = false) {
  const h0 = t.header ? 1 : 0, nC = t.rows[0].length;
  assert.equal(D.assertTableExportComplete(m), m);
  assert.deepEqual(coverage(m), Array.from({ length: t.rows.length - h0 }, (_, i) => i + h0));
  // Sentence layout may add measured line breaks; numeric/ID fixtures remain byte-exact.
  const unwrapped = rows => rows.map(row => row.map(cell => String(cell).replace(/\n/g, '')));
  assert.deepEqual(wrapped ? unwrapped(fullMatrix(m)) : fullMatrix(m), wrapped ? unwrapped(t.rows) : t.rows);
  const first = m.slides[0].table;
  for (const [p, sl] of m.slides.entries()) {
    const info = sl.table, tb = native(m, p), body = info.sourceRows.slice(h0);
    assert.equal(info.exportComplete, true);
    assert.equal(info.pageIndex, p);
    assert.equal(info.pageCount, m.slides.length);
    assert.equal(info.h0, h0);
    assert.equal(info.rawRowCount, t.rows.length);
    assert.equal(info.rawBodyRows, t.rows.length - h0);
    assert.deepEqual(info.rawRows, t.rows);
    assert.equal(info.nR, tb.cells.length);
    assert.equal(info.renderedRowCount, tb.cells.length);
    assert.equal(info.bodyStart, body.length ? body[0] : h0);
    assert.equal(info.bodyEnd, body.length ? body.at(-1) : h0 - 1);
    assert.deepEqual(tb.dataIntegrity.sourceRows, info.sourceRows);
    assert.equal(tb.dataIntegrity.documentId, info.documentId);
    assert.equal(tb.dataIntegrity.pageCount, info.pageCount);
    assert.equal(tb.dataIntegrity.pageIndex, p);
    assert(tb.cells.every(r => r.length === nC));
    assert(tb.x >= -.01 && tb.y >= -.01 && tb.x + tb.w <= (sl.w||D.W) + .01 && tb.y + tb.h <= (sl.h||D.H) + .01);
    assert.deepEqual(tb.colW, native(m).colW);
    assert.equal(info.fs, first.fs);
    assert.equal(info.hfs, first.hfs);
    assert(info.fs >= 10, 'pagination must not squeeze body text below 10pt');
    assert.deepEqual(D.tablePageRows(m, { pageIndex: p }), matrix(m, p));
    assert.deepEqual(htmlRows(D.tableHtml(m, { pageIndex: p })), matrix(m, p));
  }
}
async function assertNativeExport(m) {
  const { zip, xml } = await pptxFiles(m);
  assert.equal(xml.length, m.slides.length);
  assert.equal(Object.keys(zip.files).filter(p => /^ppt\/media\//.test(p) && !zip.files[p].dir).length, 0, 'tables must not be exported as screenshots');
  for (const [p, x] of xml.entries()) {
    assert.equal((x.match(/<a:tbl>/g) || []).length, 1);
    assert.equal((x.match(/<a:tr /g) || []).length, native(m, p).cells.length);
    assert.equal((x.match(/<a:tc>/g) || []).length, native(m, p).cells.length * native(m, p).colW.length);
    assert.equal((x.match(/<p:pic>/g) || []).length, 0);
    const xmlHeights = Array.from(x.matchAll(/<a:tr h="(\d+)"/g), match => Number(match[1]) / 914400);
    assert(xmlHeights.every((h, r) => Math.abs(h - native(m, p).rowH[r]) < .00001), 'native XML must retain the measured row heights');
    assert(native(m, p).y + xmlHeights.reduce((sum, h) => sum + h, 0) <= (m.slides[p].h||D.H) + .01, 'native XML rows must remain inside the slide');
    assert.deepEqual(xmlRows(x), matrix(m, p));
  }
  return xml;
}
function assertRejected(m) {
  assert.throws(() => D.assertTableExportComplete(m), { code: 'TABLE_EXPORT_INCOMPLETE' });
  assert.throws(() => D.toPptx({}, m), { code: 'TABLE_EXPORT_INCOMPLETE' });
  assert.throws(() => D.tableHtml(m, { pageIndex: 0 }), { code: 'TABLE_EXPORT_INCOMPLETE' });
  assert.throws(() => D.tablePageRows(m, { pageIndex: 0 }), { code: 'TABLE_EXPORT_INCOMPLETE' });
}
(async () => {
  const raw = { header: true, rows: [['label', 'value'], ['code', '00123'], ['large', '9007199254740993'], ['decimal', '1.123456789'], ['percent', '91%'], ['signed', '-00012.3400']] };
  check('default raw values retain zeroes, unsafe integers, exact decimals and percent precision', () => {
    const before = JSON.stringify(raw), m = model(raw);
    assertCoverage(m, raw);
    assert.equal(JSON.stringify(raw), before);
    for (const r of raw.rows.slice(1)) assert(D.tableHtml(m).includes('>' + r[1] + '</td>'));
  });
  check('legacy decimal and threshold settings cannot silently change data or colour it', () => {
    const t = Object.assign({}, raw, { fmt: { 1: { dec: 1, pct: true } }, rules: [{ c: 1, op: '<', v: 90, tone: 'warn', style: 'text' }] });
    assert.deepEqual(matrix(model(t)), raw.rows);
    assert.equal(model(t).slides[0].table.ruleHits, 0);
    assert.equal(D.tableMarks(t, 2, raw.rows.length).rules.length, 0);
  });
  check('explicit grouping preserves every digit, sign, unit and whitespace', () => {
    const input = ' ( NT$ 9007199254740993.123456789 ) ';
    assert.equal(D.tableFormatValue(input, 'number', 'grouped'), ' ( NT$ 9,007,199,254,740,993.123456789 ) ');
    for (const type of ['text', undefined]) assert.equal(D.tableFormatValue(input, type, 'grouped'), input);
    assert.equal(D.tableFormatValue(input, 'number', 'raw'), input);
    const t = { header: true, rows: [['ID', 'Amount'], ['00123', '9007199254740993.123456789']], types: { 0: 'text', 1: 'number' }, formats: { 1: 'grouped' } }, m = model(t);
    assert.deepEqual(matrix(m)[1], ['00123', '9,007,199,254,740,993.123456789']);
    assert.equal(native(m).cells[1][0].align, 'left');
    assert.equal(native(m).cells[1][1].align, 'right');
    assert.deepEqual(m.slides[0].table.rawRows, t.rows);
    assert.equal(D.tFmt('9007199254740993', {}), '9,007,199,254,740,993');
    assert.equal(D.tFmt('1.123456789', {}), '1.123456789');
    assert.equal(D.tFmt('9.995', { dec: 2 }), '10.00');
  });
  check('explicit text suppresses numeric/status inference and first-column number aligns right', () => {
    const rows = [['value', 'state'], ['00123', 'Pass'], ['00999', 'Hold']];
    assert.deepEqual(D.tableAuto(rows, { types: { 0: 'number', 1: 'text' } }).numC, [true, false]);
    assert.deepEqual(D.tableAuto(rows, { types: { 0: 'number', 1: 'text' } }).statC, [false, false]);
    assert.equal(native(model({ rows, types: { 0: 'number' } })).cells[1][0].align, 'right');
  });
  check('blank rows retain source indices, highlights and total-row identity', () => {
    const t = { header: true, rows: [['label', 'value'], ['a', '1'], ['', ''], ['b', '2'], ['total', '3']], his: [{ type: 'cell', r: 3, c: 1 }], hiStyle: 'box', lastTotal: true };
    const m = model(t), source = D.tableSource(t), sl = m.slides[0];
    assertCoverage(m, t);
    assert.deepEqual(source.sourceRows, [0, 1, 2, 3, 4]);
    assert.deepEqual(sl.table.sourceRows, source.sourceRows);
    assert.equal(sl.table.his[0].r, 3);
    assert.equal(sl.table.boxes[0].r, 3);
    assert(sl.table.key.includes(4));
    const ragged = D.tableSource({ rows: [['a', 'b'], [], null, ['x']] });
    assert.deepEqual(ragged.rows, [['a', 'b'], ['', ''], ['', ''], ['x', '']]);
  });
  check('explicit header choice and full-source counts have no row cap', () => {
    for (const header of [true, false]) {
      const t = fixture(60, 12, header), source = D.tableSource(t);
      assert.equal(source.h0, header ? 1 : 0);
      assert.equal(source.bodyRows, 60);
      assert.equal(source.exportComplete, true);
      assert.deepEqual(source.rows, t.rows);
    }
  });
  check('new paste clears stale metadata; explicit update retains it; column appearance maps by name', () => {
    const prev = { rows: [['ID', 'Amount'], ['001', '1']], title: 'Old report', unit: '$', note: 'Old footnote', pin: true, keep: true,
      types: { 0: 'text', 1: 'number' }, formats: { 1: 'grouped' }, align: { 1: 'right' },
      his: [{ type: 'cell', r: 1, c: 1 }, { type: 'row', i: 1 }, { type: 'col', i: 1 }] };
    const rows = [['Amount', 'ID'], ['2', '002']], fresh = D.tableFromPaste(rows, prev);
    assert.deepEqual([fresh.title, fresh.unit, fresh.note, fresh.pin], ['', '', '', false]);
    assert.deepEqual(fresh.types, { 0: 'number', 1: 'text' });
    assert.deepEqual(fresh.formats, { 0: 'grouped' });
    assert(fresh.his.every(h => h.type === 'col'));
    assert.equal(fresh.his[0].i, 0);
    const updated = D.tableFromPaste(rows, Object.assign({}, prev, { keep: false }), 'update');
    assert.deepEqual([updated.title, updated.unit, updated.note], [prev.title, prev.unit, prev.note]);
    assert.deepEqual(updated.types, {});
    assert.deepEqual(rows, [['Amount', 'ID'], ['2', '002']]);
  });
  check('combined look survives parameter import and keeps legacy aliases', () => {
    assert.equal(D.sanitizeParams({ tbLook: 'bandcard' }).tbLook, 'bandcard');
    assert.equal(D.tableLookOf({ tbLook: 'panel' }), 'card');
    for (const legacy of [{ tbLook: 'card', tbCard: 'grey' }, { tbLook: 'panel' }, { tbPanel: true }]) {
      assert.equal(D.sanitizeParams(legacy).tbCard, 'white');
      assert.deepEqual(model(fixture(5), D.sanitizeParams(legacy, params)).slides[0].items, model(fixture(5), { tbLook: 'card', tbCard: 'white' }).slides[0].items);
    }
  });
  for (const preset of D.PRESETS) for (const tbCard of ['white', 'grey']) {
    const table = { ...fixture(26, 3), title: 'Quarterly overview', unit: 'USD', note: 'Source: original data', hiStyle: 'box', his: [{ type: 'col', i: 1, kind: 'focus' }] };
    const m = D.buildModel({ ...preset, tbAuto: false, tbLook: 'bandcard', tbCard }, { table });
    check(`${preset.id}/${tbCard}: colored headers coexist with card backing on every page`, () => {
      assertCoverage(m, table);
      for (const [pageIndex, sl] of m.slides.entries()) {
        assert(sl.items.some(i => i.name === '卡片' && i.fill === 'FFFFFF' && i.sh));
        const tb = native(m, pageIndex);
        assert(tb.cells[0].every(c => c.fill === preset.P && D.contrastOf(c.color, c.fill) >= 4.5));
        assert.equal(sl.table.hiStyle, 'fill');
        assert.deepEqual([sl.table.title, sl.table.unit, sl.table.note], [table.title, table.unit, table.note]);
        const html = new JSDOM(D.tableHtml(m, { pageIndex })).window.document;
        assert.equal(html.querySelector('th,td').style.backgroundColor, `rgb(${[0,2,4].map(i => parseInt(preset.P.slice(i,i+2),16)).join(', ')})`);
      }
    });
    await assertNativeExport(m);
  }
  const geometry = [];
  for (const [look] of D.TABLE_LOOKS) {
    const t = fixture(25), m = model(t, { tbLook: look });
    check('25 × 12 ' + look + ': all rows on one readable complete canvas', () => {
      assertCoverage(m, t);
      geometry.push(JSON.stringify(m.slides.map((sl, p) => { const tb = native(m, p); return [tb.x, tb.y, tb.w, tb.h, tb.rowH, tb.colW, sl.table.fs, sl.table.hfs, sl.table.sourceRows]; })));
    });
    await assertNativeExport(m);
    check('25 × 12 ' + look + ': one canvas contains editable native tables, not screenshots', () => {});
  }
  check('all looks preserve full-source coverage and table geometry', () => assert.equal(new Set(geometry).size, 1));
  await assertNativeExport(model(raw));
  check('native PPTX contains exact raw numeric strings', () => {});
  for (const count of [26, 60]) for (const header of [true, false]) {
    const t = fixture(count, 12, header), offset = header ? 1 : 0;
    t.rows[offset + 13] = Array(12).fill('');
    t.rows[t.rows.length - 1] = ['LAST-' + count, '00123', '9007199254740993', '1.123456789', ...Array.from({ length: 7 }, (_, i) => String(count * 100 + i + 4)), 'END-' + count];
    const before = JSON.stringify(t), m = model(t);
    check(count + ' × 12, header ' + header + ': blank row and last-row sentinel retain exact-once ordered coverage', () => {
      assert.equal(m.slides.length, 1);
      assertCoverage(m, t);
      assert.equal(JSON.stringify(t), before);
      assert.equal(fullMatrix(m).at(-1).at(-1), 'END-' + count);
      assert.deepEqual(D.tablePageRows(m), matrix(m));
      for (const pageIndex of [-1, .5, m.slides.length, '1']) assert.throws(() => D.tableHtml(m, { pageIndex }), { code: 'TABLE_PAGE_INVALID' });
    });
    const xml = await assertNativeExport(m);
    check(count + ' × 12, header ' + header + ': native XML covers every page and exact final values', () => {
      for (const value of ['LAST-' + count, '00123', '9007199254740993', '1.123456789', 'END-' + count]) assert(xml.at(-1).includes('>' + value + '</a:t>'));
    });
    const direct = await D.exportPptx(env, params, { table: t, type: 'nodebuffer' });
    assert.equal(direct.model.slides.length, m.slides.length);
    check(count + ' rows: table option and prebuilt model use the same complete one-canvas model', () => {});
  }
  const paginated = model(fixture(60));
  const mutate = (name, change) => check('guard rejects ' + name + ' through every model export/copy route', () => { const m = clone(paginated); change(m); assertRejected(m); });
  mutate('all slides removed while the source manifest remains', m => m.slides = []);
  mutate('all table metadata removed while the source manifest remains', m => { for (const sl of m.slides) { delete sl.table; for (const tb of sl.items.filter(it => it.t === 'tbl')) delete tb.dataIntegrity; } });
  mutate('an empty manifest hiding an observed document', m => m.tableDocuments = []);
  mutate('a duplicated manifest document', m => m.tableDocuments.push(clone(m.tableDocuments[0])));
  mutate('a changed manifest row count', m => m.tableDocuments[0].rawRowCount++);
  mutate('a malformed manifest', m => m.tableDocuments = null);
  mutate('a dropped last page', m => m.slides.pop());
  mutate('a dropped first page', m => m.slides.shift());
  mutate('a duplicate page', m => m.slides.splice(1, 0, clone(m.slides[0])));
  mutate('a missing native integrity record', m => delete native(m).dataIntegrity);
  mutate('a duplicate source row mapping', m => { const sl = m.slides[0]; sl.table.sourceRows[1]--; native(m, 0).dataIntegrity.sourceRows[1]--; });
  mutate('an out-of-range source row mapping', m => { m.slides[0].table.sourceRows[1] = -1; native(m).dataIntegrity.sourceRows[1] = -1; });
  mutate('a missing repeated header', m => { m.slides[0].table.sourceRows[0] = 1; native(m, 0).dataIntegrity.sourceRows[0] = 1; });
  mutate('inconsistent page counts', m => { m.slides[0].table.pageCount++; native(m, 0).dataIntegrity.pageCount++; });
  mutate('inconsistent raw counts', m => { m.slides[0].table.rawBodyRows++; native(m, 0).dataIntegrity.rawBodyRows++; });
  mutate('a wrong row-range boundary', m => { m.slides[0].table.bodyStart++; native(m, 0).dataIntegrity.bodyStart++; });
  mutate('mismatching slide and native metadata', m => m.slides[0].table.pageIndex++);
  mutate('invalid full source shape', m => m.slides[0].table.rawRows[1].pop());
  mutate('changed raw source values', m => m.slides[0].table.rawRows[1][0]='changed');
  mutate('native cells with one row missing', m => native(m).cells.pop());
  mutate('a duplicated native body row', m => { const tb = native(m, 0); tb.cells[1] = clone(tb.cells[2]); });
  mutate('native cells with one column missing', m => native(m).cells[1].pop());
  mutate('native text changed without its planned display record', m => native(m).cells[1][0].runs[0].t = 'wrong source row');
  mutate('malformed native text runs', m => native(m).cells[1][0].runs = [null]);
  mutate('a mismatching display record', m => m.slides[0].table.displayRows[1][0] = 'wrong source row');
  mutate('a native table outside the slide', m => native(m).y = m.slides[0].h);
  mutate('a mismatching native grid', m => native(m).rowH[0] += .1);
  const missingPage = clone(paginated); missingPage.slides.pop();
  await assert.rejects(D.exportPptx(env, params, { model: missingPage }), { code: 'TABLE_EXPORT_INCOMPLETE' });
  check('async PPTX export also rejects missing pages', () => {});
  check('legacy snapshots remain compatible while their truncated previews stay blocked', () => {
    assert.equal(D.assertTableExportComplete({ slides: [{ items: [] }] }).slides.length, 1);
    assertRejected({ slides: [{ table: { rawRowCount: 60, renderedRowCount: 26 }, items: [] }] });
  });
  for (const header of [true, false]) {
    const t = { header, rows: header ? [['field', 'value']] : [['00123', '9007199254740993']] }, m = model(t);
    check(header ? 'header-only document is a complete one-page table' : 'one body row without header exports without inventing a header', () => assertCoverage(m, t));
    await assertNativeExport(m);
  }
  const prose = (count, value) => ({ header: true, rows: [['項目', '說明'], ...Array.from({ length: count }, (_, i) => ['r' + i, value])] });
  const shortProse = model(prose(12, '短')), longProseSource = prose(12, '需要完整保留的原始資料。'.repeat(12)), longProse = model(longProseSource);
  check('measured row height, not a fixed row cap, determines canvas height', () => {
    assert.equal(shortProse.slides.length, 1);
    assert.equal(longProse.slides.length,1);
    assert(longProse.slides[0].h > shortProse.slides[0].h);
    assertCoverage(longProse, longProseSource, true);
    assert.equal(longProse.slides[0].table.fs, shortProse.slides[0].table.fs);
    assert.equal(model(prose(60, '短')).slides[0].table.fs, shortProse.slides[0].table.fs);
    assert(native(longProse).rowH[1] > native(shortProse).rowH[1]);
  });
  await assertNativeExport(longProse);
  check('wrapped single-canvas prose exports with the same native line breaks as the preview', () => {});
  const markedSource = Object.assign(fixture(60, 3), { hiStyle: 'box', his: [{ type: 'row', i: 25 }, { type: 'cell', r: 26, c: 1 }, { type: 'row', i: 60 }, { type: 'col', i: 2 }] });
  const marked = model(markedSource);
  check('raw-coordinate marks on rows 25, 26 and 60 map only to their own page-local boxes', () => {
    assertCoverage(marked, markedSource);
    for (const sl of marked.slides) {
      assert.deepEqual(sl.table.his.map(h => [h.type, h.i, h.r, h.c]), markedSource.his.map(h => [h.type, h.i, h.r, h.c]));
      const actual = sl.table.boxes.map(b => b.type === 'cell' ? ['cell', sl.table.sourceRows[b.r], b.c] : [b.type, b.type === 'row' ? sl.table.sourceRows[b.i] : b.i]);
      const expected = markedSource.his.filter(h => h.type === 'col' || sl.table.sourceRows.includes(h.type === 'row' ? h.i : h.r)).map(h => h.type === 'cell' ? ['cell', h.r, h.c] : [h.type, h.i]);
      assert.deepEqual(actual, expected);
      for (const box of sl.table.boxes) if (box.type !== 'col') assert((box.type === 'row' ? box.i : box.r) < sl.table.nR);
    }
  });
  check('lastTotal bolds the true final source row only, never the last row of an earlier page', () => {
    const m = model(Object.assign(fixture(60, 3), { lastTotal: true }));
    for (const [p, sl] of m.slides.entries()) for (let r = sl.table.h0; r < sl.table.nR; r++) {
      const rawRow = sl.table.sourceRows[r];
      assert.equal(!!native(m, p).cells[r][0].bold, rawRow === 60);
      assert.equal(!!native(m, p).cells[r][1].bold, rawRow === 60);
    }
  });
  check('zebra striping keeps full-source row parity across page breaks', () => {
    const t = fixture(60, 3); t.rows[1][0] = 'row\nfirst';
    const m = model(t, { tbLook: 'zebra' });
    assertCoverage(m, t);
    for (const [p, sl] of m.slides.entries()) for (let r = sl.table.h0; r < sl.table.nR; r++) assert.equal(!!native(m, p).cells[r][1].fill, (sl.table.sourceRows[r] - sl.table.h0) % 2 === 1);
  });
  const metaSource = Object.assign(fixture(26, 2), { title: '中文標題'.repeat(10), unit: '單位資訊'.repeat(10), note: '資料來源說明'.repeat(12) });
  const withMetadata = model(metaSource);
  check('wrapped title, unit and footnote reserve measured space and exact per-page data ranges', () => {
    assertCoverage(withMetadata, metaSource);
    assert.equal(withMetadata.slides.length,1);
    assert(withMetadata.slides[0].h > model(fixture(26, 2)).slides[0].h);
    for (const [p, sl] of withMetadata.slides.entries()) {
      const tb = native(withMetadata, p), title = sl.items.find(it => it.name === '表格標題'), unit = sl.items.find(it => it.name === '單位'), note = sl.items.find(it => it.name === '註腳'), footer = sl.items.find(it => it.name === '表格頁碼');
      for (const item of [title, unit, note]) {
        assert(D.textOf(item).includes('\n'));
        assert(item.y >= 0 && item.y + item.h <= sl.h);
      }
      assert(title.y + title.h <= unit.y + .01);
      assert(unit.y + unit.h <= tb.y + .01);
      assert(tb.y + tb.h <= note.y + .01);
      assert.equal(footer,undefined);
    }
  });
  const badMetadataBounds = clone(withMetadata); badMetadataBounds.slides[0].items.find(it => it.name === '註腳').y = badMetadataBounds.slides[0].h;
  check('export guard independently rejects metadata moved outside the slide', () => assertRejected(badMetadataBounds));
  const grouped = fixture(60, 2), last = grouped.rows.length - 1;
  grouped.rows[last] = ['00123', '9007199254740993.123456789'];
  grouped.types = { 0: 'text', 1: 'number' }; grouped.formats = { 1: 'grouped' };
  const groupedModel = model(grouped);
  check('internal compatibility serialization uses exactly the native rendered strings and no other page', () => {
    const p = 0, rows = D.tablePageRows(groupedModel, { pageIndex: p });
    assert.deepEqual(rows, matrix(groupedModel, p));
    assert.deepEqual(htmlRows(D.tableHtml(groupedModel, { pageIndex: p })), rows);
    assert.equal(D.tablePageRows(groupedModel, { pageIndex: groupedModel.slides.length - 1 }).at(-1)[1], '9,007,199,254,740,993.123456789');
    assert.deepEqual(groupedModel.slides[0].table.rawRows, grouped.rows);
  });
  check('HTML and plain-text page copying share status-dot runs and explicit line breaks', () => {
    const t = { header: true, rows: [['item', 'status'], ...Array.from({ length: 30 }, (_, i) => ['row\n' + i, i % 2 ? 'Hold' : 'Pass'])] };
    const m = model(t, { tbStatus: true }), p = 0, rows = D.tablePageRows(m, { pageIndex: p });
    assert(rows.slice(1).some(row => row[0].includes('\n')));
    assert(rows.slice(1).some(row => row[1].includes('●')));
    assert.deepEqual(rows, matrix(m, p));
    assert.deepEqual(htmlRows(D.tableHtml(m, { pageIndex: p })), rows);
  });
  const entries = [fixture(26), fixture(60)].map(table => ({ kind: 'table', params, table }));
  const tray = D.trayDeck(entries, { sugTitle: false });
  check('full tray export retains all pages with collision-free per-entry document identities', () => {
    assert.equal(tray.slides.length, entries.reduce((sum, e) => sum + model(e.table).slides.length, 0));
    assert.equal(tray.tray.pages, tray.slides.length);
    assert.deepEqual(tray.tray.skipped, []);
    assert.equal(new Set(tray.slides.map(sl => sl.table.documentId)).size, 2);
    assert.equal(tray.tableDocuments.length, 2);
    assert.deepEqual(tray.tableDocuments.map(doc => doc.documentId), Array.from(new Set(tray.slides.map(sl => sl.table.documentId))));
    assert.equal(D.assertTableExportComplete(tray), tray);
    for (const [i, e] of entries.entries()) {
      const slides = tray.slides.filter(sl => sl.table.documentId.startsWith('tray-' + i + ':'));
      assertCoverage({ slides }, e.table);
    }
    assert.throws(() => D.trayModel(entries), { code: 'TABLE_CANVAS_COMPOSITION' });
  });
  await assertNativeExport(tray);
  check('full tray PPTX preserves every native table page and never silently composes a partial table', () => {});
  check('the tray manifest detects removal of an entire table document', () => {
    const m = clone(tray), removedId = m.tableDocuments[0].documentId;
    m.slides = m.slides.filter(sl => sl.table.documentId !== removedId);
    assertRejected(m);
  });
  const tiny = { header: true, rows: [['ID', 'Amount'], ['00123', '123']] };
  const tinyEntries = [0, 1].map(() => ({ kind: 'table', params, table: tiny }));
  const composed = D.trayModel(tinyEntries);
  check('two single-page tables still compose, with unique native integrity identities', () => {
    assert.equal(composed.slides.length, 1);
    const tables = composed.slides[0].items.filter(it => it.t === 'tbl');
    assert.equal(tables.length, 2);
    assert.equal(new Set(tables.map(tb => tb.dataIntegrity.documentId)).size, 2);
    assert.equal(composed.tableDocuments.length, 2);
    assert.deepEqual(composed.tableDocuments.map(doc => doc.documentId), tables.map(tb => tb.dataIntegrity.documentId));
    assert.equal(D.assertTableExportComplete(composed), composed);
  });
  check('the composed tray manifest detects removal of every native table', () => {
    const m = clone(composed); m.slides[0].items = m.slides[0].items.filter(it => it.t !== 'tbl'); assertRejected(m);
  });
  await D.exportPptx(env, params, { model: composed, type: 'nodebuffer' });
  const tooTall = { header: true, rows: [['項目', '說明'], ['r0', Array.from({ length: 300 }, (_, i) => 'line ' + i).join('\n')]] };
  const longNote = { header: true, rows: [['項目', '值'], ['A', '123']], note: Array.from({ length: 400 }, (_, i) => '來源第 ' + i + ' 行').join('\n') };
  const tooNarrow = { header: true, rows: [Array.from({ length: 40 }, (_, c) => 'C' + c), ...Array.from({ length: 5 }, () => Array(40).fill('9007199254740993'))] };
  for (const [name, t, reason] of [['one oversized row', tooTall, 'slide-size'], ['oversized metadata', longNote, 'slide-size'], ['40 wide columns of unsafe integers', tooNarrow, 'slide-size']]) {
    const m = model(t);
    check(name + ': full source stays available but all lossy export/copy routes are blocked', () => {
      assert.equal(D.tableSource(t).exportComplete, true);
      assert.equal(m.slides[0].table.exportComplete, false);
      assert.deepEqual(m.slides[0].table.rawRows, t.rows);
      assert(m.slides[0].table.exportReason);
      assert(m.slides[0].table.fs >= 10);
      assert.equal(m.slides[0].table.blockedReasonCode, reason);
      if (reason === 'row') {
        assert.equal(m.slides[0].table.blockedRow, 1);
        assert(m.slides[0].table.exportReason.includes('資料第 2 列'));
      }
      if (t === tooNarrow) assert(matrix(m).slice(1).every(row => row.every(value => value === '9007199254740993')));
      assertRejected(m);
      assert.throws(() => D.trayModel([{ kind: 'table', params, table: t }]), { code: 'TABLE_EXPORT_INCOMPLETE' });
    });
    await assert.rejects(D.exportPptx(env, params, { model: m }), { code: 'TABLE_EXPORT_INCOMPLETE' });
    await assert.rejects(D.exportPptx(env, params, { table: t }), { code: 'TABLE_EXPORT_INCOMPLETE' });
    const blockedTray = D.trayDeck([{ kind: 'table', params, table: t }]);
    await assert.rejects(D.exportPptx(env, params, { model: blockedTray }), { code: 'TABLE_EXPORT_INCOMPLETE' });
  }
  check('ordinary title, unit and note remain exportable with semantic cell marks', () => {
    const m = model({ header: true, title: '季度摘要', unit: '單位：萬元', note: '資料來源：營運報表', rows: [['項目', '值'], ['A', '123'], ['B', '456']], his: [{ type: 'col', i: 1, kind: 'focus' }, { type: 'row', i: 2, kind: 'warn' }] });
    assert.equal(m.slides[0].table.exportComplete, true);
    assert(D.tableHtml(m));
  });
  check('SVG uses the full canvas and focus/recommendation/warning are calm semantic colors', () => {
    const m=model({...fixture(60,3), his:[{type:'col',i:0,kind:'focus'},{type:'col',i:1,kind:'rec'},{type:'col',i:2,kind:'warn'}]},{tbLook:'bandcard'}), sl=m.slides[0];
    assert(D.toSvg(sl).includes(`viewBox="0 0 ${sl.w*72} ${sl.h*72}"`));
    assert.deepEqual(sl.table.his.map(h=>h.C),[params.P,'176B70','875B1A']);
    for(const c of native(m).cells[0]) assert(D.contrastOf(c.bB.c,c.fill)>=3);
  });
  check('wrapped prose preserves original spaces and every character',()=>{
    const value='original  spaces and 長中文說明 '.repeat(12), t={header:true,rows:[['ID','description'],['00001',value]]};
    const m=model(t,{tbWidth:'compact'});assert.equal(matrix(m)[1][1].replace(/\n/g,''),value);assert.deepEqual(m.slides[0].table.rawRows,t.rows);
  });
  const full60=model(fixture(60,3)), files=await pptxFiles(full60);
  check('PPTX presentation declares the complete shared canvas without scaling content',async()=>{});
  const pres=await files.zip.file('ppt/presentation.xml').async('string');
  const size=pres.match(/<p:sldSz cx="(\d+)" cy="(\d+)"/);
  assert(size); assert(Math.abs(+size[2]/914400-full60.slides[0].h)<.00001);
  check('500-row web model stays complete even beyond PowerPoint limits',()=>{
    const t=fixture(500,3),m=model(t),sl=m.slides[0];assert.equal(m.slides.length,1);assert.equal(native(m).cells.length,501);assert.deepEqual(sl.table.rawRows,t.rows);assert.equal(sl.table.exportComplete,false);assert(sl.h>56);assert(D.toSvg(sl).includes('50002'));assertRejected(m);
  });
  console.log('PASS ' + checks + ' table source/full-canvas/export integrity checks');
})().catch(err => { console.error(err); process.exitCode = 1; });
