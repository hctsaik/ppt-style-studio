// Lossless table source + export integrity. No browser, Office CLI or rendering service required.
const assert = require('assert/strict');
const D = require('../deck.js');
const PptxGenJS = require('pptxgenjs');
const JSZip = require('jszip');
const env = { PptxGenJS, JSZip };
const params = Object.assign({}, D.PRESETS[0], { tbAuto: false });
let checks = 0;
function check(name, run) { run(); checks++; console.log('  ✓ ' + name); }
const model = (table, extra) => D.buildModel(Object.assign({}, params, extra), { table });
const native = m => m.slides[0].items.find(i => i.t === 'tbl');
const text = c => c.runs.map(r => r.t + (r.o.br ? '\n' : '')).join('');
const matrix = m => native(m).cells.map(r => r.map(text));
const fixture = (count, cols = 12, header = true) => ({ header, rows: [
  ...(header ? [Array.from({ length: cols }, (_, c) => 'C' + c)] : []),
  ...Array.from({ length: count }, (_, r) => Array.from({ length: cols }, (_, c) => String((r + 1) * 100 + c)))
] });
async function slideXml(m) {
  const result = await D.exportPptx(env, params, { model: m, type: 'nodebuffer' });
  const zip = await JSZip.loadAsync(result.data);
  return zip.file('ppt/slides/slide1.xml').async('string');
}
(async () => {
  const raw = { header: true, rows: [['label', 'value'], ['code', '00123'], ['large', '9007199254740993'], ['decimal', '1.123456789'], ['percent', '91%'], ['signed', '-00012.3400']] };
  check('default raw values retain zeroes, unsafe integers, exact decimals and percent precision', () => {
    const before = JSON.stringify(raw);
    const m = model(raw);
    assert.deepEqual(matrix(m), raw.rows);
    assert.equal(JSON.stringify(raw), before);
    assert.deepEqual(m.slides[0].table.rawRows, raw.rows);
    const html = D.tableHtml(m);
    for (const r of raw.rows.slice(1)) assert(html.includes('>' + r[1] + '</td>'));
  });
  check('legacy decimal and threshold settings cannot silently change data or colour it', () => {
    const t = Object.assign({}, raw, { fmt: { 1: { dec: 1, pct: true } }, rules: [{ c: 1, op: '<', v: 90, tone: 'warn', style: 'text' }] });
    assert.deepEqual(matrix(model(t)), raw.rows);
    assert.equal(model(t).slides[0].table.ruleHits, 0);
    assert.equal(D.tableMarks(t, 2, raw.rows.length).rules.length, 0);
  });
  check('explicit column display grouping preserves every digit, sign, unit and whitespace', () => {
    const input = ' ( NT$ 9007199254740993.123456789 ) ';
    assert.equal(D.tableFormatValue(input, 'number', 'grouped'), ' ( NT$ 9,007,199,254,740,993.123456789 ) ');
    assert.equal(D.tableFormatValue(input, 'text', 'grouped'), input);
    assert.equal(D.tableFormatValue(input, undefined, 'grouped'), input);
    assert.equal(D.tableFormatValue(input, 'number', 'raw'), input);
    const t = { header: true, rows: [['ID', 'Amount'], ['00123', '9007199254740993.123456789']], types: { 0: 'text', 1: 'number' }, formats: { 1: 'grouped' } };
    const m = model(t);
    assert.equal(text(native(m).cells[1][0]), '00123');
    assert.equal(text(native(m).cells[1][1]), '9,007,199,254,740,993.123456789');
    assert.equal(native(m).cells[1][0].align, 'left');
    assert.equal(native(m).cells[1][1].align, 'right');
    assert.deepEqual(m.slides[0].table.rawRows, t.rows);
    assert.equal(D.tFmt('9007199254740993', {}), '9,007,199,254,740,993');
    assert.equal(D.tFmt('1.123456789', {}), '1.123456789');
    assert.equal(D.tFmt('9.995', { dec: 2 }), '10.00');
  });
  check('explicit text suppresses numeric/status inference; explicit first-column number aligns right', () => {
    const rows = [['value', 'state'], ['00123', 'Pass'], ['00999', 'Hold']];
    assert.deepEqual(D.tableAuto(rows, { types: { 0: 'number', 1: 'text' } }).numC, [true, false]);
    assert.deepEqual(D.tableAuto(rows, { types: { 0: 'number', 1: 'text' } }).statC, [false, false]);
    assert.equal(native(model({ rows, types: { 0: 'number' } })).cells[1][0].align, 'right');
  });
  check('blank rows retain source indices, highlights and total-row identity', () => {
    const t = { header: true, rows: [['label', 'value'], ['a', '1'], ['', ''], ['b', '2'], ['total', '3']], his: [{ type: 'cell', r: 3, c: 1 }], hiStyle: 'box', lastTotal: true };
    const m = model(t), source = D.tableSource(t), sl = m.slides[0];
    assert.deepEqual(matrix(m), t.rows);
    assert.deepEqual(source.sourceRows, [0, 1, 2, 3, 4]);
    assert.deepEqual(sl.table.sourceRows, source.sourceRows);
    assert.equal(sl.table.his[0].r, 3);
    assert.equal(sl.table.boxes[0].r, 3);
    assert(sl.table.key.includes(4));
    const ragged = D.tableSource({ rows: [['a', 'b'], [], null, ['x']] });
    assert.deepEqual(ragged.rows, [['a', 'b'], ['', ''], ['', ''], ['x', '']]);
  });
  check('explicit header choice is shared by inference, preview and full-source counts', () => {
    assert.equal(D.tableSource(fixture(25, 12, false)).h0, 0);
    assert.equal(D.tableSource(fixture(25, 12, false)).bodyRows, 25);
    assert.equal(D.tableSource(fixture(25, 12, true)).h0, 1);
    assert.equal(D.tableSource(fixture(25, 12, true)).bodyRows, 25);
  });
  check('new paste clears stale metadata; explicit update retains it; column appearance maps by name', () => {
    const prev = { rows: [['ID', 'Amount'], ['001', '1']], title: 'Old report', unit: '$', note: 'Old footnote', pin: true, keep: true,
      types: { 0: 'text', 1: 'number' }, formats: { 1: 'grouped' }, align: { 1: 'right' },
      his: [{ type: 'cell', r: 1, c: 1 }, { type: 'row', i: 1 }, { type: 'col', i: 1 }] };
    const rows = [['Amount', 'ID'], ['2', '002']];
    const fresh = D.tableFromPaste(rows, prev);
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
  const geometry = [];
  for (const [look] of D.TABLE_LOOKS) {
    const m = model(fixture(25), { tbLook: look }), tb = native(m), info = m.slides[0].table;
    check('25 × 12 ' + look + ': all cells retained with complete export metadata', () => {
      assert.equal(info.exportComplete, true);
      assert.equal(info.rawBodyRows, 25);
      assert.equal(info.rawRowCount, 26);
      assert.equal(tb.cells.length, 26);
      assert.equal(tb.cells[25].length, 12);
      assert.deepEqual(matrix(m), fixture(25).rows);
      assert.equal((D.tableHtml(m).match(/<tr /g) || []).length, 26);
      assert(tb.x + tb.w <= D.W + .01);
      assert(tb.y + tb.h <= D.H + .01);
      geometry.push(JSON.stringify([tb.x, tb.y, tb.w, tb.h, tb.rowH, tb.colW, info.fs, info.hfs]));
    });
    const xml = await slideXml(m);
    check('25 × 12 ' + look + ': PPTX stays an editable native table, all 312 cells present', () => {
      assert(xml.includes('<a:tbl>'));
      assert.equal((xml.match(/<a:tr /g) || []).length, 26);
      assert.equal((xml.match(/<a:tc>/g) || []).length, 26 * 12);
      assert(xml.includes('>2511</a:t>'));
    });
  }
  check('all five looks preserve table geometry', () => assert.equal(new Set(geometry).size, 1));
  const rawXml = await slideXml(model(raw));
  check('native PPTX contains exact raw numeric strings', () => raw.rows.slice(1).forEach(r => assert(rawXml.includes('>' + r[1] + '</a:t>'))));
  for (const count of [26, 60]) {
    const t = fixture(count), m = model(t), info = m.slides[0].table;
    check(count + ' × 12: full source retained, clearly incomplete preview, no fake total row', () => {
      assert.equal(info.rawBodyRows, count);
      assert.equal(info.rawRows.length, count + 1);
      assert.equal(info.rawRows[count][11], String(count * 100 + 11));
      assert.equal(info.exportComplete, false);
      assert.equal(info.nR, 26);
      assert.equal(info.sourceRows.length, 26);
      assert(info.exportReason.includes(String(count)));
      assert(m.warns.some(w => /停用匯出/.test(w)));
      const total = model(Object.assign({}, t, { lastTotal: true })).slides[0].table;
      assert(!total.key.includes(25));
      assert.throws(() => D.tableHtml(m), { code: 'TABLE_EXPORT_INCOMPLETE' });
      assert.throws(() => D.toPptx({}, m), { code: 'TABLE_EXPORT_INCOMPLETE' });
    });
    await assert.rejects(D.exportPptx(env, params, { model: m }), { code: 'TABLE_EXPORT_INCOMPLETE' });
    await assert.rejects(D.exportPptx(env, params, { table: t }), { code: 'TABLE_EXPORT_INCOMPLETE' });
    for (const tray of [D.trayDeck([{ kind: 'table', params, table: t }]), D.trayModel([{ kind: 'table', params, table: t }])]) {
      await assert.rejects(D.exportPptx(env, params, { model: tray }), { code: 'TABLE_EXPORT_INCOMPLETE' });
    }
    check(count + ' × 12: direct export and both tray export routes reject partial content', () => {});
  }
  const tooTall = { header: true, rows: [['項目', '說明'], ...Array.from({ length: 4 }, (_, r) => ['r' + r, '需要完整保留的原始資料。'.repeat(50)])] };
  const overflow = model(tooTall), overflowInfo = overflow.slides[0].table;
  check('four long rows: unresolvable off-slide table is blocked despite complete row count', () => {
    assert.equal(D.tableSource(tooTall).exportComplete, true);
    assert.equal(overflowInfo.rawBodyRows, 4);
    assert.equal(overflowInfo.nR, 5);
    assert.deepEqual(overflowInfo.rawRows, tooTall.rows);
    assert(native(overflow).y + native(overflow).h > D.H);
    assert.equal(overflowInfo.layoutOverflow, true);
    assert.equal(overflowInfo.exportComplete, false);
    assert(overflowInfo.exportReason.includes('超出投影片邊界'));
    assert(overflow.warns.some(w => /停用匯出/.test(w)));
    assert.throws(() => D.tableHtml(overflow), { code: 'TABLE_EXPORT_INCOMPLETE' });
    assert.throws(() => D.toPptx({}, overflow), { code: 'TABLE_EXPORT_INCOMPLETE' });
  });
  await assert.rejects(D.exportPptx(env, params, { model: overflow }), { code: 'TABLE_EXPORT_INCOMPLETE' });
  await assert.rejects(D.exportPptx(env, params, { table: tooTall }), { code: 'TABLE_EXPORT_INCOMPLETE' });
  for (const tray of [D.trayDeck([{ kind: 'table', params, table: tooTall }]), D.trayModel([{ kind: 'table', params, table: tooTall }])]) {
    await assert.rejects(D.exportPptx(env, params, { model: tray }), { code: 'TABLE_EXPORT_INCOMPLETE' });
  }
  check('off-slide table cannot bypass integrity guard via direct or either tray export route', () => {});
  check('explicit multiline cells also block off-slide output without dropping source lines', () => {
    const multiline = { header: true, rows: [['項目', '說明'], ['r0', Array.from({ length: 60 }, (_, i) => 'line ' + i).join('\n')]] };
    const m = model(multiline);
    assert.equal(m.slides[0].table.layoutOverflow, true);
    assert.deepEqual(m.slides[0].table.rawRows, multiline.rows);
    assert.equal(m.slides[0].table.rawBodyRows, 1);
    assert.throws(() => D.tableHtml(m), { code: 'TABLE_EXPORT_INCOMPLETE' });
  });
  const shorter = { header: true, rows: [['項目', '說明'], ['r0', '需要完整保留的原始資料。'.repeat(50)]] };
  check('long content that safely fits remains exportable', () => {
    const fitted = model(shorter);
    assert.equal(fitted.slides[0].table.layoutOverflow, false);
    assert.equal(fitted.slides[0].table.exportComplete, true);
    assert(D.tableHtml(fitted));
  });
  const longNote = { header: true, rows: [['項目', '值'], ['A', '123']], note: Array.from({ length: 40 }, (_, i) => '來源第 ' + i + ' 行').join('\n') };
  const noteModel = model(longNote), noteItem = noteModel.slides[0].items.find(it => it.name === '註腳');
  check('a short table with an off-slide footnote cannot claim complete-slide export', () => {
    assert(native(noteModel).y + native(noteModel).h <= D.H);
    assert(noteItem.y + noteItem.h > D.H);
    assert.equal(noteModel.slides[0].table.layoutOverflow, true);
    assert.equal(noteModel.slides[0].table.exportComplete, false);
    assert.equal(noteModel.slides[0].table.note, longNote.note);
    assert.deepEqual(noteModel.slides[0].table.rawRows, longNote.rows);
    assert.throws(() => D.tableHtml(noteModel), { code: 'TABLE_EXPORT_INCOMPLETE' });
  });
  await assert.rejects(D.exportPptx(env, params, { model: noteModel }), { code: 'TABLE_EXPORT_INCOMPLETE' });
  for (const tray of [D.trayDeck([{ kind: 'table', params, table: longNote }]), D.trayModel([{ kind: 'table', params, table: longNote }])]) {
    await assert.rejects(D.exportPptx(env, params, { model: tray }), { code: 'TABLE_EXPORT_INCOMPLETE' });
  }
  check('metadata overflow cannot bypass the native or either tray export route', () => {});
  check('ordinary title, unit, note and legend remain exportable', () => {
    const m = model({ header: true, title: '季度摘要', unit: '單位：萬元', note: '資料來源：營運報表', rows: [['項目', '值'], ['A', '123'], ['B', '456']], his: [{ type: 'col', i: 1, kind: 'focus' }, { type: 'row', i: 2, kind: 'warn' }] });
    assert.equal(m.slides[0].table.exportComplete, true);
    assert(D.tableHtml(m));
  });
  console.log('PASS ' + checks + ' table source/export integrity checks');
})().catch(err => { console.error(err); process.exitCode = 1; });
