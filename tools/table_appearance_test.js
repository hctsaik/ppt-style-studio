// Independent appearance regression coverage. This tests model/serialization,
// not actual browser pixels or Microsoft PowerPoint rendering.
// Run: node tools/table_appearance_test.js
// Baseline provenance: --record-legacy reads the immutable e3ac7d1 Git source.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Module = require('node:module');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');
const JSZip = require('jszip');
const PptxGenJS = require('pptxgenjs');
const ROOT = path.resolve(__dirname, '..');
const GOLDEN = path.join(__dirname, 'table_appearance_legacy.json');
const REV = 'e3ac7d1';
const clone = x => JSON.parse(JSON.stringify(x));
const canonical = x => Array.isArray(x) ? x.map(canonical) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])) : x;
const hash = x => crypto.createHash('sha256').update(typeof x === 'string' ? x : JSON.stringify(canonical(x))).digest('hex');
const looks = ['clean', 'band', 'card', 'bandcard', 'zebra', 'hair', 'minimal', 'panel'];
const fields = ['tbCardOn', 'tbHeaderStyle', 'tbStripes', 'tbGrid'];
const edges = ['bT', 'bR', 'bB', 'bL'];
const edgeNames = { bT: 'top', bR: 'right', bB: 'bottom', bL: 'left' };
const plain = () => ({ header: true, title: 'Data fidelity', unit: 'Original values', note: 'Original source', rows: [
  ['Label', 'Exact value', 'Comment'], ['alpha', '00123', 'first'], ['beta', '9007199254740993', 'two\nlines'],
  ['gamma', '-00012.3400', '中文'], ['delta', '0.1000000000001', 'last']
] });
const fixtures = {
  plain: plain(),
  annotated: { ...plain(), lastTotal: true, hcol: true, bold: [2], hiStyle: 'box', his: [
    { type: 'row', i: 2, kind: 'rec' }, { type: 'cell', r: 3, c: 2, kind: 'warn' },
    { type: 'range', r0: 0, c0: 1, r1: 2, c1: 1, presetId: 'mint' },
    { type: 'range', r0: 1, c0: 0, r1: 4, c1: 2, presetId: 'amber', styleId: 'outline' },
    { type: 'range', r0: 2, c0: 1, r1: 3, c1: 2, presetId: 'rose', styleId: 'underline' }
  ] },
  headerless: { header: false, rows: Array.from({ length: 26 }, (_, i) => ['Row ' + i, String(1000 + i), i === 13 ? '' : 'source ' + i]) }
};
function loadLegacy() {
  const source = execFileSync('git', ['show', REV + ':deck.js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 4e6 });
  const filename = path.join(ROOT, 'legacy-deck-for-test.js'), mod = new Module(filename, module);
  mod.filename = filename; mod.paths = Module._nodeModulePaths(ROOT); mod._compile(source, filename);
  return { D: mod.exports, sourceHash: hash(source) };
}
function legacyHashes(D, restoreOldFirstColumnInset = false) {
  const out = {};
  for (const preset of D.PRESETS) for (const look of looks) for (const [name, table] of Object.entries(fixtures)) {
    const m = D.buildModel({ ...preset, ...Object.fromEntries(fields.map(f => [f, null])), tbAuto: false, tbLook: look }, { table: clone(table) });
    // Preserve the immutable baseline; approved rendering corrections are
    // the restored first-column cell inset. Undo only that known delta before
    // comparing model/SVG/HTML hashes, while asserting the corrected inset first.
    // New defaults must not turn these explicitly legacy fixtures into new looks.
    if (restoreOldFirstColumnInset && ['clean', 'card', 'hair'].includes(D.tableLookOf({ tbLook: look }))) {
      for (const sl of m.slides) for (const row of sl.items.find(it => it.t === 'tbl').cells) {
        assert.equal(row[0].mL, row[0].mR, 'first-column inset follows the spacing control');
        assert(row[0].mL > 0, 'legacy medium padding is restored, not silently erased');
        row[0].mL = 0;
      }
    }
    // Outline strength was explicitly increased 1.5→2.25pt. Assert the new
    // native edge width, then project only those known outline-owned edges back
    // for the immutable legacy comparison. No golden data is rewritten.
    if (restoreOldFirstColumnInset) {
      let outlineEdges = 0;
      for (const sl of m.slides) for (const row of sl.items.find(it => it.t === 'tbl').cells) for (const cell of row) {
        for (const edge of cell.highlightEdges || []) {
          const mark = (table.his || [])[cell.highlightOrder && cell.highlightOrder[edge]];
          if (mark && mark.styleId === 'outline') { assert.equal(cell[edge].w, 2.25); cell[edge].w = 1.5; outlineEdges++; }
        }
      }
      if (name === 'annotated') assert(outlineEdges > 0, 'annotated fixture exercises stronger outlines');
    }
    out[[preset.id, look, name].join('/')] = {
      items: hash(m.slides.map(sl => ({ w: sl.w, h: sl.h, items: sl.items, groups: sl.groups }))),
      svg: hash(m.slides.map(sl => D.toSvg(sl)).join('\n')),
      html: hash(D.tableHtml(m))
    };
  }
  return out;
}
if (process.argv.includes('--record-legacy')) {
  assert(!fs.existsSync(GOLDEN), 'Never overwrite an established golden baseline. Review migration explicitly.');
  const { D, sourceHash } = loadLegacy();
  fs.writeFileSync(GOLDEN, JSON.stringify({ revision: REV, sourceHash, fixtures, records: legacyHashes(D) }, null, 2) + '\n');
  console.log('Recorded ' + Object.keys(JSON.parse(fs.readFileSync(GOLDEN)).records).length + ' immutable legacy cases from ' + REV);
  process.exit(0);
}
const D = require('../deck.js');
const base = { ...D.PRESETS[0], tbAuto: false };
const native = m => m.slides[0].items.find(it => it.t === 'tbl');
const build = (p = {}, t = plain()) => D.buildModel({ ...base, ...p }, { table: t });
const geometry = m => { const tb = native(m), sl = m.slides[0]; return [sl.w, sl.h, tb.x, tb.y, tb.w, tb.h, tb.colW, tb.rowH]; };
const withoutBorders = cell => Object.fromEntries(Object.entries(cell).filter(([k]) => !edges.includes(k)));
const withoutPaint = cell => { const out = clone(withoutBorders(cell)); delete out.fill; delete out.color; out.runs.forEach(r => delete r.o.color); return out; };
const controls = [];
for (const tbCardOn of [false, true]) for (const tbHeaderStyle of ['normal', 'primary']) for (const tbStripes of [false, true]) for (const tbGrid of ['all', 'horizontal', 'none']) controls.push({ tbCardOn, tbHeaderStyle, tbStripes, tbGrid });
function assertSource(m, t) {
  assert.equal(m.slides.length, 1);
  assert.equal(m.slides[0].items.filter(it => it.t === 'tbl').length, 1);
  assert.deepEqual(m.slides[0].table.rawRows, t.rows);
  assert.deepEqual(native(m).dataIntegrity.sourceValues, t.rows);
  assert.deepEqual(m.slides[0].table.sourceRows, t.rows.map((_, i) => i));
  D.assertTableExportComplete(m);
}
function assertBounds(m) {
  for (const sl of m.slides) for (const it of sl.items) {
    if (it.t === 'ln') continue;
    assert([it.x, it.y, it.w, it.h].every(Number.isFinite), 'finite model geometry');
    assert(it.x >= -.01 && it.y >= -.01 && it.x + it.w <= sl.w + .01 && it.y + it.h <= sl.h + .01, 'item within complete slide bounds: ' + it.name);
  }
}
function assertContrast(m, label) {
  native(m).cells.forEach((row, r) => row.forEach((cell, c) => {
    const bg = cell.fill || 'FFFFFF';
    assert(D.contrastOf(cell.color, bg) >= 4.5 - 1e-6, label + ' cell contrast ' + r + ',' + c);
    for (const run of cell.runs) if (run.t.trim()) { const minimum = /^●\s*$/.test(run.t) ? 3 : 4.5; assert(D.contrastOf(run.o.color || cell.color, bg) >= minimum - 1e-6, label + ' text/marker contrast ' + r + ',' + c); }
  }));
}
function assertGrid(tb, grid) {
  tb.cells.forEach((row, r) => row.forEach((cell, c) => {
    if (grid === 'none') edges.forEach(e => assert(!cell[e], `none removes ordinary ${r},${c}/${e}`));
    if (grid === 'horizontal') { assert(!cell.bL && !cell.bR, 'horizontal has no vertical borders'); assert(cell.bT || cell.bB, 'horizontal rules exist'); }
    if (grid === 'all') edges.forEach(e => assert(cell[e] && cell[e].w > 0, `all draws ${r},${c}/${e}`));
  }));
}
function assertHtml(m) {
  const win = new JSDOM(D.tableHtml(m)).window, doc = win.document;
  const rows = [...doc.querySelectorAll('tr')], resolved = D.tableResolvedBorders(native(m));
  assert.equal(rows.length, resolved.length);
  rows.forEach((row, r) => [...row.children].forEach((el, c) => {
    const cell = resolved[r][c], css = el.getAttribute('style');
    for (const edge of edges) if (cell[edge]) assert(css.includes(`border-${edgeNames[edge]}:${cell[edge].w}pt solid #${cell[edge].c}`), `HTML ${r},${c}/${edge}`);
    else assert(!css.includes('border-' + edgeNames[edge] + ':'), `HTML no ordinary ${r},${c}/${edge}`);
    assert.equal(el.textContent, cell.runs.map(r => r.t).join('').replace(/\n/g, ''));
  }));
  win.close();
}
function assertSvg(m) {
  const sl = m.slides[0], tb = native(m), resolved = D.tableResolvedBorders(tb);
  const win = new JSDOM(D.toSvg(sl), { contentType: 'image/svg+xml' }).window;
  const lines = [...win.document.getElementsByTagName('line')];
  let y = tb.y, count = 0;
  resolved.forEach((row, r) => { let x = tb.x; row.forEach((cell, c) => {
    const pos = { bT: [x, y, x + tb.colW[c], y], bR: [x + tb.colW[c], y, x + tb.colW[c], y + tb.rowH[r]], bB: [x, y + tb.rowH[r], x + tb.colW[c], y + tb.rowH[r]], bL: [x, y, x, y + tb.rowH[r]] };
    for (const e of edges) if (cell[e]) { count++; assert(lines.some(line => line.getAttribute('stroke') === '#' + cell[e].c && +line.getAttribute('stroke-width') === cell[e].w && ['x1', 'y1', 'x2', 'y2'].every((a, i) => Math.abs(+line.getAttribute(a) - pos[e][i] * 72) < 1e-6)), `SVG ${r},${c}/${e}`); }
    x += tb.colW[c];
  }); y += tb.rowH[r]; });
  assert.equal(lines.length, count + sl.items.filter(it => it.t === 'ln').length, 'SVG lines are exactly native border model');
  win.close();
}
async function assertPptx(m) {
  const result = await D.exportPptx({ PptxGenJS, JSZip }, m.params, { model: m, type: 'nodebuffer' });
  const zip = await JSZip.loadAsync(result.data), slides = Object.keys(zip.files).filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p));
  assert.equal(slides.length, 1);
  const xml = await zip.file(slides[0]).async('string'), win = new JSDOM(xml, { contentType: 'application/xml' }).window, doc = win.document;
  assert.equal(doc.getElementsByTagName('a:tbl').length, 1);
  assert.equal(doc.getElementsByTagName('p:pic').length, 0, 'native table is never rasterized');
  const resolved = D.tableResolvedBorders(native(m));
  const rows = [...doc.getElementsByTagName('a:tr')];
  assert.equal(rows.length, resolved.length);
  const values = rows.map((row, r) => {
    assert(Math.abs(+row.getAttribute('h') / 914400 - native(m).rowH[r]) < 1e-5, 'native row height');
    const cells = [...row.getElementsByTagName('a:tc')]; assert.equal(cells.length, resolved[r].length);
    return cells.map((tc, c) => {
      const cell = resolved[r][c], props = tc.getElementsByTagName('a:tcPr')[0];
      assert.equal(+props.getAttribute('marL'), Math.round(cell.mL * 12700), 'native left cell inset');
      assert.equal(+props.getAttribute('marR'), Math.round(cell.mR * 12700), 'native right cell inset');
      for (const e of edges) { const line = props.getElementsByTagName('a:ln' + e.slice(1))[0]; assert(line, 'editable native cell border');
        if (cell[e]) { assert.equal(+line.getAttribute('w'), Math.round(cell[e].w * 12700)); assert.equal(line.getElementsByTagName('a:srgbClr')[0].getAttribute('val'), cell[e].c); }
        else assert.equal(line.getElementsByTagName('a:noFill').length, 1);
      }
      const fill = [...props.children].find(n => n.tagName === 'a:solidFill');
      assert.equal(fill ? fill.getElementsByTagName('a:srgbClr')[0].getAttribute('val') : null, cell.fill);
      return [...tc.getElementsByTagName('a:p')].map(p => [...p.getElementsByTagName('a:t')].map(t => t.textContent).join('')).join('\n');
    });
  });
  assert.deepEqual(values, D.tablePageRows(m), 'native editable strings retain complete model display data');
  win.close();
}
let checks = 0;
async function check(name, fn) { await fn(); checks++; console.log('  ✓ ' + name); }
(async () => {
  await check('216 immutable legacy golden cases: only approved first-column inset changes', () => {
    const golden = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
    assert.equal(golden.revision, REV); assert.deepEqual(golden.fixtures, fixtures);
    const actual = legacyHashes(D, true);
    for (const [id, expected] of Object.entries(golden.records)) assert.deepEqual(actual[id], expected, 'legacy rendering changed: ' + id);
  });
  await check('new editor defaults and legacy imports stay separate', () => {
    assert.deepEqual(D.tableAppearanceOf(D.TABLE_APPEARANCE_DEFAULTS), {card:true,header:'primary',stripes:false,grid:'horizontal'});
    const fallback={...D.BASE,...D.TABLE_APPEARANCE_DEFAULTS};
    assert.deepEqual(D.tableAppearanceOf(D.sanitizeParams({tbLook:'zebra',tbCardOn:false,tbGrid:'none'},fallback)), {card:false,header:'normal',stripes:true,grid:'none'});
    assert.deepEqual(D.tableAppearanceOf(D.sanitizeParams({},fallback)), {card:false,header:'normal',stripes:false,grid:'horizontal'});
  });
  await check('all looks, densities and sizes honor none/small/medium/large padding in every cell', () => {
    const t = plain(), original = clone(t);
    for (const look of looks) for (const [tbDense, points] of Object.entries({ comfy: 12, normal: 9, dense: 7 })) {
      for (const [size, scale] of Object.entries({ S: .8, M: 1, L: 1.25 })) for (const [tbPad, multiplier] of Object.entries({ none: 0, s: .5, m: 1, l: 1.7 })) {
        const m = build({ tbLook: look, tbDense, size, tbPad, tbCardOn: true, tbHeaderStyle: 'primary', tbStripes: false, tbGrid: 'horizontal' }, t);
        const expected = points * scale * multiplier;
        for (const row of native(m).cells) for (const cell of row) {
          assert.equal(cell.mL, expected, `${look}/${tbDense}/${size}/${tbPad}: left inset`);
          assert.equal(cell.mR, expected, `${look}/${tbDense}/${size}/${tbPad}: right inset`);
        }
        assertSource(m, t); assert.deepEqual(t, original);
      }
    }
  });
  await check('first-column header/body padding agrees in SVG, HTML and native editable PPTX', async () => {
    const t = { header: true, rows: [['項目', '方案'], ['月費', '原始值 00123'], ['雲端空間', '9007199254740993']] };
    for (const tbLook of ['clean', 'bandcard', 'hair']) for (const tbPad of ['none', 's', 'm', 'l']) for (const header of [false, true]) {
      const source = { ...t, header }, original = clone(source);
      const m = build({ tbLook, tbPad, P: '0F7C80', tbCardOn: true, tbHeaderStyle: 'primary', tbStripes: false, tbGrid: 'horizontal' }, source), tb = native(m);
      const svg = new JSDOM(D.toSvg(m.slides[0]), { contentType: 'image/svg+xml' }).window;
      const html = new JSDOM(D.tableHtml(m)).window, rows = [...html.document.querySelectorAll('tr')];
      tb.cells.forEach((row, r) => {
        const cell = row[0], label = cell.runs.map(run => run.t).join('');
        const text = [...svg.document.getElementsByTagName('text')].find(el => el.textContent === label);
        assert(text, 'first-column text exists in SVG: ' + label);
        assert(Math.abs(+text.getAttribute('x') - (tb.x * 72 + cell.mL)) < .011, 'SVG uses real internal cell inset');
        assert.equal(rows[r].children[0].style.paddingLeft, cell.mL + 'pt', 'HTML uses the same first-column inset');
      });
      svg.close(); html.close();
      assertSource(m, source); assert.deepEqual(source, original); await assertPptx(m);
    }
  });
  await check('resolver maps old looks/aliases and independent null/unset fields', () => {
    assert.equal(typeof D.tableAppearanceOf, 'function');
    for (const look of looks) {
      const id = D.tableLookOf({ tbLook: look }), expected = { card: ['card', 'bandcard'].includes(id), header: ['band', 'bandcard'].includes(id) ? 'primary' : 'normal', stripes: id === 'zebra', grid: 'horizontal' };
      assert.deepEqual(D.tableAppearanceOf({ tbLook: look }), expected);
      assert.deepEqual(D.tableAppearanceOf({ tbLook: look, ...Object.fromEntries(fields.map(f => [f, null])) }), expected);
      for (const opt of controls) assert.deepEqual(D.tableAppearanceOf({ tbLook: look, ...opt }), { card: opt.tbCardOn, header: opt.tbHeaderStyle, stripes: opt.tbStripes, grid: opt.tbGrid });
    }
    assert.deepEqual(D.tableAppearanceOf({ tbPanel: true }), { card: true, header: 'normal', stripes: false, grid: 'horizontal' });
  });
  await check('explicit fields sanitize/import and null resets retain their intended dimensions', () => {
    for (const opts of controls) { const p = D.sanitizeParams({ tbLook: 'bandcard', ...opts }); for (const f of fields) assert.equal(p[f], opts[f]); }
    const fallback = { ...base, tbCardOn: true, tbHeaderStyle: 'primary', tbStripes: true, tbGrid: 'all' };
    for (const f of fields) assert.equal(D.sanitizeParams({ [f]: null }, fallback)[f], null, f + ' null means legacy, not fallback override');
    for (const f of ['tbCardOn', 'tbStripes']) for (const value of ['false', 'true', 0, 1, {}, []]) assert.notEqual(D.sanitizeParams({ [f]: value })[f], value, 'boolean appearance accepts booleans only');
    for (const f of ['tbHeaderStyle', 'tbGrid']) for (const value of ['invalid', '', true, 1, {}, []]) assert.notEqual(D.sanitizeParams({ [f]: value })[f], value);
  });
  await check('all 24 combinations × 9 palettes: contrast, bounds, exact source, and ordinary grid', () => {
    for (const preset of D.PRESETS) for (const opt of controls) {
      const t = plain(), original = clone(t), m = build({ ...preset, ...opt }, t), tb = native(m), name = preset.id + '/' + JSON.stringify(opt);
      assertSource(m, t); assertBounds(m); assertContrast(m, name); assertGrid(tb, opt.tbGrid); assert.deepEqual(t, original);
      assert.equal(m.slides[0].items.filter(it => it.name === '卡片').length, Number(opt.tbCardOn));
      tb.cells[0].forEach(c => assert.equal(c.fill, opt.tbHeaderStyle === 'primary' ? preset.P : null));
      for (let r = 1; r < tb.cells.length; r++) tb.cells[r].forEach(c => assert.equal(!!c.fill, opt.tbStripes && r % 2 === 0));
    }
  });
  await check('CARD only toggles the backing; cells, geometry, metadata items and HTML are identical', () => {
    for (const look of looks) for (const fixture of Object.values(fixtures)) for (const opts of controls.filter(p => !p.tbCardOn)) {
      const a = build({ tbLook: look, ...opts }, fixture), b = build({ tbLook: look, ...opts, tbCardOn: true }, fixture);
      assert.deepEqual(native(a), native(b)); assert.deepEqual(geometry(a), geometry(b));
      assert.deepEqual(a.slides[0].items, b.slides[0].items.filter(it => it.name !== '卡片'));
      assert.equal(D.tableHtml(a), D.tableHtml(b));
    }
  });
  await check('GRID changes borders only; HEADER changes header only; STRIPES changes body paint only', () => {
    for (const look of looks) {
      const opts = { tbLook: look, tbCardOn: false, tbHeaderStyle: 'normal', tbStripes: false, tbGrid: 'none' }, m = build(opts), baseCells = native(m).cells;
      for (const grid of ['all', 'horizontal']) { const n = build({ ...opts, tbGrid: grid }); assert.deepEqual(geometry(n), geometry(m)); assert.deepEqual(native(n).cells.map(r => r.map(withoutBorders)), baseCells.map(r => r.map(withoutBorders))); }
      const header = build({ ...opts, tbHeaderStyle: 'primary' }); assert.deepEqual(geometry(header), geometry(m)); assert.deepEqual(native(header).cells.slice(1), baseCells.slice(1));
      const stripes = build({ ...opts, tbStripes: true }); assert.deepEqual(geometry(stripes), geometry(m)); assert.deepEqual(native(stripes).cells[0], baseCells[0]); assert.deepEqual(native(stripes).cells.map(r => r.map(withoutPaint)), baseCells.map(r => r.map(withoutPaint)));
    }
  });
  await check('HEADER preserves first-column body tint and semantic outline geometry for every legacy look', () => {
    for (const look of looks) for (const hcol of [false, true]) {
      const t = { ...plain(), hcol, hiStyle: 'box', his: [{ type: 'col', i: 0, kind: 'rec' }, { type: 'cell', r: 2, c: 1, kind: 'warn' }] };
      const a = build({ tbLook: look, tbHeaderStyle: 'normal' }, t), b = build({ tbLook: look, tbHeaderStyle: 'primary' }, t);
      assert.deepEqual(native(a).cells.slice(1), native(b).cells.slice(1), look + ': header does not repaint body/header-column emphasis');
      assert.deepEqual(a.slides[0].items.filter(it => it.t !== 'tbl'), b.slides[0].items.filter(it => it.t !== 'tbl'), look + ': header does not resize existing semantic outlines');
      assert.deepEqual(a.slides[0].table.boxes, b.slides[0].table.boxes);
      assert.equal(a.slides[0].table.hiStyle, b.slides[0].table.hiStyle);
    }
  });
  await check('all combinations compose with first-column emphasis, totals, statuses and semantic marks', () => {
    const t = { header: true, hcol: true, hiStyle: 'box', lastTotal: true, rows: [['Label', 'Status', 'Exact value'], ['alpha', 'Pass', '00123'], ['beta', 'Hold', '9007199254740993'], ['gamma', 'Fail', '0.1000'], ['Total', 'N/A', '4']], his: [{ type: 'col', i: 1, kind: 'focus' }, { type: 'row', i: 2, kind: 'warn' }] };
    const original = clone(t);
    for (const preset of D.PRESETS) for (const [look] of D.TABLE_LOOKS) for (const opt of controls) {
      const m = build({ ...preset, tbLook: look, ...opt }, t);
      assertSource(m, t); assertBounds(m); assertContrast(m, preset.id + '/' + look); assert.deepEqual(t, original);
    }
  });
  await check('all 24 combinations: SVG, HTML and native editable PPTX use the exact same cell borders', async () => {
    for (const opt of controls) { const m = build(opt); assertHtml(m); assertSvg(m); await assertPptx(m); }
  });
  await check('all grid modes preserve all four manual highlight families and original semantic marks', async () => {
    const q = { r0: 1, c0: 0, r1: 3, c1: 1 };
    for (const family of ['fill', 'outline', 'underline', 'side']) for (const grid of ['none', 'horizontal', 'all']) {
      const t = plain(), applied = D.tableApplyRange(t, q, 'mint', family), marked = { ...t, his: applied.his }, original = clone(marked);
      const m = build({ tbGrid: grid, tbCardOn: true, tbHeaderStyle: 'primary', tbStripes: true }, marked), tb = native(m);
      assertSource(m, marked); assertContrast(m, family + '/' + grid); assert.deepEqual(marked, original);
      for (let r = 0; r < tb.cells.length; r++) for (let c = 0; c < tb.cells[r].length; c++) for (const edge of edges) if (D.tableRangeEdge(applied.his[0], r, c, edge)) assert(tb.cells[r][c][edge], 'manual ' + family + '/' + grid + '/' + edge);
      assertHtml(m); assertSvg(m); await assertPptx(m);
    }
  });
  await check('headerless and 60-row tables keep all source rows, geometry and editable export', async () => {
    for (const header of [false, true]) {
      const t = { header, rows: [...(header ? [['Label', 'Value']] : []), ...Array.from({ length: 60 }, (_, i) => ['R' + i, i === 59 ? 'END-00123' : String(i)])] };
      for (const opt of controls) { const m = build(opt, t); assertSource(m, t); assertBounds(m); assertContrast(m, 'long/' + header); }
      await assertPptx(build(controls.at(-1), t));
    }
  });
  console.log('PASS independent table appearance: ' + checks + ' groups');
})().catch(error => { console.error(error); process.exit(1); });
