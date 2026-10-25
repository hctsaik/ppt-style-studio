// Four manual highlight families: source-coordinate geometry and editable native borders.
// This is model/serialization coverage, not browser, Office or visual-rendering certification.
// Run: node tools/table_range_family_test.js
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const D = require('../deck.js');
const JSZip = require('jszip');
const PptxGenJS = require('pptxgenjs');
const clone = value => JSON.parse(JSON.stringify(value));
const params = { ...D.PRESETS[0], tbAuto: false };
const families = ['fill', 'outline', 'underline', 'side'];
const lines = families.slice(1);
const palettes = ['theme-light', 'theme-dark', 'mint', 'amber', 'rose', 'slate'];
const widths = { fill: 1.5, outline: 2.25, underline: 2, side: 3 };
const edges = ['bT', 'bR', 'bB', 'bL'];
const sideNames = { bT: 'top', bR: 'right', bB: 'bottom', bL: 'left' };
const rect = (r0, c0, r1, c1) => ({ r0, c0, r1, c1 });
const inside = (q, r, c) => r >= q.r0 && r <= q.r1 && c >= q.c0 && c <= q.c1;
const fixture = () => ({
  header: true, lastTotal: true, bold: [2],
  title: 'Original title', note: 'Original source note',
  rows: [
    ['Item', 'Status', 'Amount', 'Comment', 'Code'],
    ['A', 'Pass', '00123', 'first', 'A01'],
    ['B', 'Hold', '9007199254740993', 'two\nlines', 'B02'],
    ['C', 'Fail', '0.1000000000001', '', 'C03'],
    ['Total', 'Pass', '987.6543210', 'sum', 'T00']
  ]
});
const model = (table, extra = {}) => D.buildModel({ ...params, ...extra }, { table });
const native = m => m.slides[0].items.find(it => it.t === 'tbl');
const apply = (table, q, id = 'mint', family = 'fill') => {
  const result = D.tableApplyRange(table, q, id, family);
  assert.equal(result.error, undefined, `${family}/${id}: apply failed`);
  return { ...table, his: result.his };
};
const clear = (table, q) => ({ ...table, his: D.tableClearRange(table, q).his });
const appearance = cell => Object.fromEntries(Object.entries(cell).filter(([k]) => !['highlightEdges','highlightOrder','fillBorderOrder'].includes(k)));
const cellMatrix = tb => tb.cells.map(row => row.map(appearance));
const nonBorders = cell => Object.fromEntries(Object.entries(appearance(cell)).filter(([k]) => !edges.includes(k)));
const neighborAt = (tb, r, c, edge) => {
  const [dr, dc] = { bT: [-1, 0], bR: [0, 1], bB: [1, 0], bL: [0, -1] }[edge];
  return tb.cells[r + dr] && tb.cells[r + dr][c + dc];
};
const lineBorder = (tb, r, c, edge, family, id) => {
  const paint = D.tableHighlightPreset(id, params, family), neighbor = neighborAt(tb, r, c, edge);
  return { c: D.tableHighlightStroke(paint.stroke, [tb.cells[r][c].fill, neighbor && neighbor.fill]), w: widths[family] };
};
const geometry = m => {
  const tb = native(m), sl = m.slides[0];
  return { w: sl.w, h: sl.h, x: tb.x, y: tb.y, tableW: tb.w, tableH: tb.h, colW: tb.colW, rowH: tb.rowH };
};
const hasEdge = (q, family, r, c, edge) => inside(q, r, c) && (
  (family === 'fill' || family === 'outline') && (
    edge === 'bT' && r === q.r0 || edge === 'bR' && c === q.c1 ||
    edge === 'bB' && r === q.r1 || edge === 'bL' && c === q.c0
  ) || family === 'underline' && edge === 'bB' && r === q.r1 ||
  family === 'side' && edge === 'bL' && c === q.c0
);
function assertEdges(actual, baseline, q, family, id, message = '') {
  const paint = D.tableHighlightPreset(id, params, family);
  const expectedBorder = { c: paint.border, w: widths[family] };
  actual.cells.forEach((row, r) => row.forEach((cell, c) => edges.forEach(edge => {
    const expected = hasEdge(q, family, r, c, edge) ? (family === 'fill' ? expectedBorder : lineBorder(baseline, r, c, edge, family, id)) : baseline.cells[r][c][edge];
    assert.deepEqual(cell[edge], expected, `${message} ${family}/${id}/${r},${c}/${edge}`);
  })));
}
function assertSource(m, table) {
  assert.equal(m.slides.length, 1);
  assert.equal(m.slides[0].items.filter(it => it.t === 'tbl').length, 1);
  assert.deepEqual(m.slides[0].table.rawRows, table.rows);
  assert.deepEqual(m.slides[0].table.sourceRows, table.rows.map((_, i) => i));
  assert.equal(native(m).cells.length, table.rows.length);
  assert(native(m).cells.every(row => row.length === table.rows[0].length));
  assert(!m.slides[0].items.some(it => it.name === '圖例'));
  D.assertTableExportComplete(m);
}
function assertHtml(m) {
  const doc = new JSDOM(D.tableHtml(m)).window.document;
  const rows = [...doc.querySelectorAll('tr')];
  assert.equal(rows.length, native(m).cells.length);
  rows.forEach((row, r) => [...row.children].forEach((element, c) => {
    const cell = D.tableResolvedBorders(native(m))[r][c], style = element.getAttribute('style');
    for (const edge of edges) if (cell[edge]) {
      assert(style.includes(`border-${sideNames[edge]}:${cell[edge].w}pt solid #${cell[edge].c}`), `HTML ${r},${c}/${edge}`);
    }
  }));
  doc.defaultView.close();
}
function assertSvg(m) {
  const sl = m.slides[0], tb = { ...native(m), cells:D.tableResolvedBorders(native(m)) };
  const doc = new JSDOM(D.toSvg(sl), { contentType: 'image/svg+xml' }).window.document;
  const actual = [...doc.getElementsByTagName('line')];
  let y = tb.y;
  let count = 0;
  tb.cells.forEach((row, r) => {
    let x = tb.x;
    row.forEach((cell, c) => {
      const positions = {
        bT: [x, y, x + tb.colW[c], y],
        bR: [x + tb.colW[c], y, x + tb.colW[c], y + tb.rowH[r]],
        bB: [x, y + tb.rowH[r], x + tb.colW[c], y + tb.rowH[r]],
        bL: [x, y, x, y + tb.rowH[r]]
      };
      for (const edge of edges) if (cell[edge]) {
        count++;
        assert(actual.some(line => line.getAttribute('stroke') === '#' + cell[edge].c &&
          +line.getAttribute('stroke-width') === cell[edge].w &&
          ['x1', 'y1', 'x2', 'y2'].every((attr, i) => Math.abs(+line.getAttribute(attr) - positions[edge][i] * 72) < 1e-6)),
        `SVG ${r},${c}/${edge} retains native geometry and width`);
      }
      x += tb.colW[c];
    });
    y += tb.rowH[r];
  });
  assert.equal(actual.length, count + sl.items.filter(it => it.t === 'ln').length, 'no detached highlight line overlays');
  doc.defaultView.close();
}
async function nativeXml(m) {
  const result = await D.exportPptx({ PptxGenJS, JSZip }, params, { model: m, type: 'nodebuffer' });
  const zip = await JSZip.loadAsync(result.data);
  const slidePaths = Object.keys(zip.files).filter(path => /^ppt\/slides\/slide\d+\.xml$/.test(path));
  assert.equal(slidePaths.length, 1);
  const xml = await zip.file(slidePaths[0]).async('string');
  const doc = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
  assert.equal(doc.getElementsByTagName('parsererror').length, 0);
  assert.equal(doc.getElementsByTagName('a:tbl').length, 1);
  assert.equal(doc.getElementsByTagName('p:pic').length, 0, 'table highlights must not rasterize');
  assert(!xml.includes('LEGEND_ONLY_'));
  const rows = [...doc.getElementsByTagName('a:tr')];
  assert.equal(rows.length, native(m).cells.length);
  const values = rows.map((row, r) => [...row.getElementsByTagName('a:tc')].map((element, c) => {
    const cell = D.tableResolvedBorders(native(m))[r][c];
    const props = element.getElementsByTagName('a:tcPr')[0];
    for (const edge of edges) {
      const line = props.getElementsByTagName('a:ln' + edge.slice(1))[0];
      assert(line, `PPTX editable cell border ${r},${c}/${edge}`);
      if (cell[edge]) {
        assert.equal(+line.getAttribute('w'), Math.round(cell[edge].w * 12700), `PPTX ${r},${c}/${edge} width`);
        assert.equal(line.getElementsByTagName('a:srgbClr')[0].getAttribute('val'), cell[edge].c);
      } else assert.equal(line.getElementsByTagName('a:noFill').length, 1);
    }
    const fill = [...props.children].find(node => node.tagName === 'a:solidFill');
    assert.equal(fill ? fill.getElementsByTagName('a:srgbClr')[0].getAttribute('val') : null, cell.fill);
    return [...element.getElementsByTagName('a:p')].map(p => [...p.getElementsByTagName('a:t')].map(t => t.textContent).join('')).join('\n');
  }));
  assert.deepEqual(values, D.tablePageRows(m), 'native editable text equals complete display rows');
  assert.equal(doc.getElementsByTagName('a:tc').length, native(m).cells.flat().length);
  const shapeCount = doc.getElementsByTagName('p:sp').length;
  doc.defaultView.close();
  return { xml, shapeCount };
}
let checks = 0;
async function check(name, run) { await run(); checks++; console.log('  ✓ ' + name); }
(async () => {
  await check('four whitelisted families × six palettes, with legacy fill tokens unchanged', () => {
    assert.deepEqual(D.TABLE_HIGHLIGHT_FAMILIES.map(f => f.id), families);
    assert(D.TABLE_HIGHLIGHT_FAMILIES.every(f => typeof f.label === 'string' && f.label));
    assert.deepEqual(D.TABLE_HIGHLIGHT_PRESETS.map(p => p.id), palettes);
    const legacyTokens = [
      ['D9E6F2', '1F3864', '7995AF'], ['1F4E79', 'FFFFFF', '1F4E79'],
      ['DDEDED', '0B5E61', '6C9B9D'], ['FFF1D6', '6B4700', 'BA9A5C'],
      ['F6E0E2', '7A1F2B', 'B07980'], ['EDEDED', '3A3A3A', '999999']
    ];
    palettes.forEach((id, i) => {
      const legacy = D.tableHighlightPreset(id, params);
      assert.deepEqual(D.tableHighlightPreset(id, params, 'fill'), legacy);
      assert.deepEqual([legacy.fill, legacy.color, legacy.border], legacyTokens[i]);
      for (const family of lines) {
        const paint = D.tableHighlightPreset(id, params, family);
        assert.equal(paint.family, family);
        assert.equal(paint.borderWidth, widths[family]);
        assert.match(paint.stroke, /^[A-F0-9]{6}$/i);
        assert(!paint.fill && !paint.color && paint.bold == null, 'line presets cannot recolor or bold text');
      }
    });
    assert.equal(D.tableHighlightPreset('bad', params, 'outline'), null);
    assert.equal(D.tableHighlightPreset('mint', params, 'bad'), null);
  });
  await check('line colors retain exact tokens on white and meet 3:1 when a feasible shared contrast exists', () => {
    for (const family of lines) for (const id of palettes) {
      const paint = D.tableHighlightPreset(id, params, family);
      assert.equal(D.tableHighlightStroke(paint.stroke, ['FFFFFF', null]), paint.stroke);
      for (const backgrounds of [['FFFFFF', 'FFFFFF'], ['000000', '000000'], ['FFFFFF', '000000']]) {
        const stroke = D.tableHighlightStroke(paint.stroke, backgrounds);
        assert.match(stroke, /^[A-F0-9]{6}$/i);
        backgrounds.forEach(bg => assert(D.contrastOf(stroke, bg) >= 3 - 1e-6, `${family}/${id}/${bg}: line contrast`));
      }
    }
  });
  await check('family validation/import, default fill compatibility and non-mutating operations', () => {
    const T = fixture(), q = rect(0, 1, 4, 3), original = clone(T);
    const legacy = D.tableApplyRange(T, q, 'mint');
    assert.deepEqual(D.tableApplyRange(T, q, 'mint', 'fill'), legacy);
    for (const family of families) {
      const marked = apply(T, q, 'amber', family), before = clone(marked);
      assert.deepEqual(D.tableMarks(marked, 5, 5).his, marked.his);
      const imported = D.tableMarks({ his: [{ type: 'range', ...q, presetId: 'amber', family }] }, 5, 5).his;
      assert.equal(imported.length, 1);
      assert.equal(imported[0].styleId || 'fill', family);
      D.tableClearRange(marked, rect(1, 2, 3, 2));
      assert.deepEqual(marked, before);
    }
    const invalid = D.tableApplyRange(T, q, 'mint', 'bad');
    assert(invalid.error); assert.equal(invalid.changed, false); assert.deepEqual(invalid.his, []);
    assert.equal(D.tableMarks({ his: [{ type: 'range', ...q, presetId: 'mint', styleId: 'bad' }] }, 5, 5).his.length, 0);
    assert.deepEqual(T, original);
  });
  await check('all line families/palettes preserve all non-border fields across every table look', () => {
    const q = rect(0, 1, 4, 3);
    for (const [look] of D.TABLE_LOOKS) for (const family of lines) for (const id of palettes) {
      const T = { ...fixture(), his: [{ type: 'row', i: 2, kind: 'rec' }, { type: 'cell', r: 3, c: 1, kind: 'warn' }] };
      const base = model(T, { tbLook: look }), marked = model(apply(T, q, id, family), { tbLook: look });
      native(marked).cells.forEach((row, r) => row.forEach((cell, c) => {
        assert.deepEqual(nonBorders(cell), nonBorders(native(base).cells[r][c]), `${look}/${family}/${id}/${r},${c} fill/text/bold/status`);
      }));
      assertEdges(native(marked), native(base), q, family, id, look);
      assert.deepEqual(geometry(marked), geometry(base));
      assertSource(marked, T);
    }
  });
  await check('single-cell, single-row, single-column and clipped/reversed selections use only their own outer edges', () => {
    const T = fixture(), baseline = model(T);
    for (const family of lines) for (const q of [rect(0, 0, 0, 0), rect(4, 4, 4, 4), rect(2, 1, 2, 3), rect(1, 2, 4, 2), rect(4, 4, -2, -2)]) {
      const normalized = D.tableNormalizeRange(q, 5, 5), m = model(apply(T, q, 'amber', family));
      assertEdges(native(m), native(baseline), normalized, family, 'amber');
      native(m).cells.forEach((row, r) => row.forEach((cell, c) => assert.deepEqual(nonBorders(cell), nonBorders(native(baseline).cells[r][c]))));
      assert.deepEqual(geometry(m), geometry(baseline));
    }
  });
  await check('line overlays preserve legacy semantic box marks and original semantic source data', () => {
    const T = { ...fixture(), hiStyle: 'box', his: [{ type: 'row', i: 2, kind: 'rec' }, { type: 'col', i: 1, kind: 'warn' }] };
    const baseline = model(T), q = rect(1, 1, 3, 3);
    for (const family of lines) {
      const marked = apply(T, q, 'slate', family), m = model(marked);
      assert.deepEqual(m.slides[0].table.boxes, baseline.slides[0].table.boxes);
      assert.deepEqual(marked.his.filter(h => h.type !== 'range'), D.tableMarks(T, 5, 5).his);
      assert.deepEqual(model(clear(marked, q)), baseline);
    }
  });
  await check('line-only styles retain prior manual fill, text, bold and unmodified fill borders', () => {
    const fillRange = rect(0, 1, 4, 3), lineRange = rect(1, 2, 4, 3);
    for (const family of lines) for (const id of palettes) {
      const T = apply(fixture(), fillRange, 'theme-dark'), base = model(T);
      const marked = model(apply(T, lineRange, id, family));
      native(marked).cells.forEach((row, r) => row.forEach((cell, c) => {
        assert.deepEqual(nonBorders(cell), nonBorders(native(base).cells[r][c]), `${family}/${id}/${r},${c}`);
      }));
      assertEdges(native(marked), native(base), lineRange, family, id);
      assert.deepEqual(geometry(marked), geometry(base));
    }
  });
  await check('all 24 variants serialize matching borders through SVG, HTML and editable native PPTX', async () => {
    const T = fixture(), q = rect(0, 1, 4, 3), baseline = model(T);
    const baseXml = await nativeXml(baseline);
    for (const family of families) for (const id of palettes) {
      const before = clone(T), marked = model(apply(T, q, id, family));
      assertEdges(native(marked), native(baseline), q, family, id);
      assert.deepEqual(geometry(marked), geometry(baseline));
      assertSource(marked, T); assertSvg(marked); assertHtml(marked);
      const out = await nativeXml(marked);
      assert.equal(out.shapeCount, baseXml.shapeCount, `${family}/${id}: highlight belongs to native cells, not extra shapes`);
      assert.deepEqual(T, before);
    }
  });
  await check('line families compose by edge, while latest same-edge palette wins', () => {
    const q = rect(1, 1, 3, 3), baseline = model(fixture());
    let T = apply(fixture(), q, 'mint', 'outline');
    T = apply(T, q, 'amber', 'underline');
    T = apply(T, q, 'rose', 'side');
    const m = model(T), expected = clone(native(baseline));
    for (const [family, id] of [['outline', 'mint'], ['underline', 'amber'], ['side', 'rose']]) {
      expected.cells.forEach((row, r) => row.forEach((cell, c) => edges.forEach(edge => {
        if (hasEdge(q, family, r, c, edge)) cell[edge] = lineBorder(expected, r, c, edge, family, id);
      })));
    }
    assert.deepEqual(cellMatrix(native(m)), cellMatrix(expected));
    const replaced = model(apply(T, q, 'slate', 'underline'));
    expected.cells[3].forEach((cell, c) => { if (c >= 1 && c <= 3) cell.bB = lineBorder(expected, 3, c, 'bB', 'underline', 'slate'); });
    assert.deepEqual(cellMatrix(native(replaced)), cellMatrix(expected));
    assert.deepEqual(geometry(replaced), geometry(baseline));
  });
  await check('line clear/exclusions remove only selected original edges without inventing hole boundaries', () => {
    const q = rect(1, 1, 4, 3), cuts = [rect(2, 2, 2, 2), rect(1, 2, 2, 2), rect(3, 1, 4, 2)];
    for (const family of lines) for (const cut of cuts) {
      const T = apply(fixture(), q, 'rose', family), baseline = native(model(fixture())), before = native(model(T));
      const cleared = clear(T, cut), after = native(model(cleared));
      after.cells.forEach((row, r) => row.forEach((cell, c) => {
        assert.deepEqual(appearance(cell), appearance(inside(cut, r, c) ? baseline.cells[r][c] : before.cells[r][c]), `${family}/${JSON.stringify(cut)}/${r},${c}`);
      }));
      assert.deepEqual(native(model(clear(cleared, q))).cells, baseline.cells);
      assert.equal(D.tableClearRange(cleared, cut).changed, false);
    }
  });
  await check('clearing an overlap clears every manual layer, never revealing a hidden previous highlight', () => {
    const q = rect(0, 1, 4, 3), cut = rect(0, 1, 1, 2), baseline = model(fixture());
    let T = apply(fixture(), q, 'theme-dark');
    T = apply(T, q, 'mint', 'outline');
    T = apply(T, q, 'amber', 'underline');
    T = apply(T, q, 'rose', 'side');
    const marked = clone(T), partial = clear(T, cut), after = model(partial);
    for (let r = cut.r0; r <= cut.r1; r++) for (let c = cut.c0; c <= cut.c1; c++) {
      assert.deepEqual(appearance(native(after).cells[r][c]), appearance(native(baseline).cells[r][c]));
      assert(!partial.his.some(h => h.type === 'range' && D.tableMarkContains(h, r, c)));
    }
    assert.deepEqual(native(model(clear(partial, q))).cells, native(baseline).cells);
    assert.deepEqual(T, marked);
  });
  await check('no-op detects line geometry, and exact same-family replacement works at capacity', () => {
    const q = rect(0, 1, 4, 3);
    for (const family of lines) {
      const T = apply(fixture(), q, 'mint', family);
      const again = D.tableApplyRange(T, q, 'mint', family);
      assert.equal(again.changed, false); assert.deepEqual(again.his, T.his);
      assert.equal(D.tableApplyRange(T, rect(1, 2, 3, 2), 'mint', family).changed, true, 'nested line creates a distinct boundary');
      let full = { header: false, rows: Array.from({ length: 4 }, () => Array.from({ length: 15 }, (_, c) => String(c))) };
      for (let c = 0; c < 12; c++) full = apply(full, rect(1, c, 2, c), 'mint', family);
      assert.equal(full.his.filter(h => h.type === 'range').length, 12);
      const original = clone(full), blocked = D.tableApplyRange(full, rect(1, 13, 2, 13), 'amber', family);
      assert.equal(blocked.error, 'MARK_LIMIT'); assert.equal(blocked.changed, false); assert.deepEqual(blocked.his, full.his);
      const replaced = D.tableApplyRange(full, rect(1, 5, 2, 5), 'amber', family);
      assert.equal(replaced.error, undefined); assert.equal(replaced.changed, true); assert.equal(replaced.his.length, 12);
      assert.deepEqual(full, original);
    }
  });
  await check('clearing all line paint frees its range slot, and outside edges preserve fill no-ops', () => {
    const q = rect(0, 0, 4, 4), inside = rect(1, 1, 3, 3);
    for (const family of lines) {
      const marked = apply(fixture(), q, 'mint', family);
      let erased = marked;
      for (const edge of family === 'outline' ? [rect(0,0,0,4),rect(4,0,4,4),rect(0,0,4,0),rect(0,4,4,4)] : family === 'underline' ? [rect(4,0,4,4)] : [rect(0,0,4,0)]) erased = clear(erased, edge);
      assert.equal(erased.his.length, 0, family + ' invisible mark does not consume capacity');
      const filled = apply(apply(fixture(), q, 'mint'), q, 'rose', family);
      assert.equal(D.tableApplyRange(filled, inside, 'mint', 'fill').changed, false, family + ' outside edge does not defeat same fill no-op');
    }
  });
  await check('adjacent opposite edges resolve by latest line layer in every renderer, regardless of order or width', async () => {
    const configurations = [
      { a:rect(1,1,1,3), b:rect(2,1,2,3), af:'outline', bf:'outline', ac:[1,2,'bB'], bc:[2,2,'bT'] },
      { a:rect(1,1,1,3), b:rect(2,1,2,3), af:'underline', bf:'outline', ac:[1,2,'bB'], bc:[2,2,'bT'] },
      { a:rect(1,1,3,1), b:rect(1,2,3,2), af:'outline', bf:'outline', ac:[2,1,'bR'], bc:[2,2,'bL'] },
      { a:rect(1,1,3,1), b:rect(1,2,3,2), af:'outline', bf:'side', ac:[2,1,'bR'], bc:[2,2,'bL'] }
    ];
    for (const config of configurations) for (const reverse of [false,true]) {
      const {a,b,af,bf,ac,bc}=config, applications=reverse?[[b,'rose',bf],[a,'mint',af]]:[[a,'mint',af],[b,'rose',bf]];
      let T=fixture();for(const [q,id,family] of applications)T=apply(T,q,id,family);
      const m=model(T),tb=native(m),before=JSON.stringify(tb),resolved=D.tableResolvedBorders(tb),last=applications[1],owner=reverse?ac:bc,other=reverse?bc:ac;
      const winner=tb.cells[owner[0]][owner[1]][owner[2]];
      assert.deepEqual(resolved[owner[0]][owner[1]][owner[2]],winner);assert.deepEqual(resolved[other[0]][other[1]][other[2]],winner);
      assert.equal(winner.w,widths[last[2]]);assert.equal(JSON.stringify(tb),before,'projection is read-only');
      assert.equal(D.tableApplyRange(T,...last).changed,false,'latest visible line repeat is a no-op');
      assert.equal(D.tableApplyRange(T,...applications[0]).changed,true,'opposing newer line invalidates older no-op');
      assertSvg(m);assertHtml(m);await nativeXml(m);assert.equal(JSON.stringify(tb),before,'all serializers keep logical marks/cells unchanged');
      const cleared=model(clear(T,last[0])),remain=applications[0],only=model(apply(fixture(),...remain));
      assert.deepEqual(D.tableResolvedBorders(native(cleared)).map(r=>r.map(appearance)),D.tableResolvedBorders(native(only)).map(r=>r.map(appearance)),'clear newest restores surviving adjacent layer');
    }
  });
  await check('line projections override thicker semantic shared borders without changing source cells', async () => {
    const T={...fixture(),his:[{type:'col',i:1,kind:'rec'}]},q=rect(1,1,2,2),baseline=model(T,{tbLook:'band'}),m=model(apply(T,q,'mint','outline'),{tbLook:'band'}),tb=native(m),before=clone(tb);
    assert.equal(native(baseline).cells[0][1].bB.w,3);assert.equal(tb.cells[0][1].bB.w,3,'unselected logical header unchanged');
    const resolved=D.tableResolvedBorders(tb);assert.deepEqual(resolved[0][1].bB,resolved[1][1].bT);assert.equal(resolved[0][1].bB.w,2.25);
    assert.deepEqual(tb,before);assertSvg(m);assertHtml(m);await nativeXml(m);
  });
  await check('neighbor fill changes retint only the same shared boundary for contrast', async () => {
    const fillRange=rect(1,1,1,3),lineRange=rect(2,1,2,3),T=apply(apply(fixture(),fillRange,'theme-dark'),lineRange,'rose','outline'),before=model(T),after=model(clear(T,fillRange));
    const a=native(before),b=native(after);assert.notEqual(a.cells[2][2].bT.c,b.cells[2][2].bT.c);
    b.cells.forEach((row,r)=>row.forEach((cell,c)=>{if(inside(fillRange,r,c))return;
      const x=appearance(cell),y=appearance(a.cells[r][c]);if(r===2&&c>=1&&c<=3){assert.deepEqual(nonBorders(cell),nonBorders(a.cells[r][c]));delete x.bT;delete y.bT;}assert.deepEqual(x,y,'no unrelated outside appearance changes');
    }));
    assert.deepEqual(geometry(after),geometry(before));assert.deepEqual(after.slides[0].table.rawRows,T.rows);
    const p=D.tableResolvedBorders(b);assert.deepEqual(p[1][2].bB,p[2][2].bT);assertSvg(after);assertHtml(after);await nativeXml(after);
  });
  await check('row/column edits preserve family and transform range exclusions losslessly', () => {
    const q = rect(1, 1, 4, 3);
    for (const family of families) {
      const T = clear(apply(fixture(), q, 'amber', family), rect(2, 2, 2, 2));
      const rows = D.tableShiftMarks(T.his, 'row', 2, false, 6, 5);
      assert(rows.every(mark => (mark.styleId || 'fill') === family));
      assert.equal(D.tableMarkContains(rows[0], 3, 2), false);
      assert.deepEqual(D.tableShiftMarks(rows, 'row', 2, true, 5, 5), T.his);
      const columns = D.tableShiftMarks(T.his, 'col', 2, false, 5, 6);
      assert(columns.every(mark => (mark.styleId || 'fill') === family));
      assert.equal(D.tableMarkContains(columns[0], 2, 3), false);
      assert.deepEqual(D.tableShiftMarks(columns, 'col', 2, true, 5, 5), T.his);
    }
  });
  await check('each family × all palettes keeps the complete 61×12 source on one editable canvas without legend', async () => {
    const T = { header: true, rows: Array.from({ length: 61 }, (_, r) => Array.from({ length: 12 }, (_, c) => `${r}:${c}`)),
      legend: { focus: 'LEGEND_ONLY_FOCUS', rec: 'LEGEND_ONLY_REC', warn: 'LEGEND_ONLY_WARN' } };
    T.rows[10] = Array(12).fill(''); T.rows[60][10] = '00123'; T.rows[60][11] = '9007199254740993';
    const before = clone(T), baseline = model(T);
    for (const family of families) {
      let marked = T;
      palettes.forEach((id, i) => { marked = apply(marked, rect(0, i * 2, 60, i * 2 + 1), id, family); });
      const m = model(marked);
      assertSource(m, T); assert.deepEqual(geometry(m), geometry(baseline));
      assert.equal(m.slides[0].table.rawRows[10].join(''), '');
      assert(!D.toSvg(m.slides[0]).includes('LEGEND_ONLY_'));
      const out = await nativeXml(m);
      assert(out.xml.includes('00123')); assert(out.xml.includes('9007199254740993'));
    }
    assert.deepEqual(T, before);
  });
  console.log(`\nRange highlight families: ${checks} checks passed (24 native-export variants).`);
})().catch(error => { console.error(error); process.exitCode = 1; });
