/* Table-workbench release regression suite.
 *   node tools/table_workbench_test.js --model-only
 *   CHROME=/usr/bin/chromium node tools/table_workbench_test.js [URL]
 *   node tools/table_workbench_test.js --dom-only
 *   STUDIO_HTML=PPT-Style-Studio.html node tools/table_workbench_test.js --dom-only
 *
 * Browser automation needs Playwright (an existing global installation works),
 * or set PLAYWRIGHT_MODULE to its installed package directory. --dom-only needs
 * jsdom (JSDOM_MODULE may point to a separately installed copy); it tests event
 * handlers, not rendering, layout, trusted keyboard defaults, or real clipboard.
 * browserSuite uses synthetic DOM events. For a cloud browser whose evaluate is
 * read-only, use its documented locators and clipboard to reproduce scenarios;
 * do not inject this mutating suite there.
 * No production data is sent anywhere. This suite modifies local test storage.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');

async function modelSuite() {
  const D = require('../deck.js');
  const PptxGenJS = require('pptxgenjs');
  const JSZip = require('jszip');
  const results = [];
  const check = (name, pass, detail) => results.push({ name, pass: !!pass, ...(detail ? { detail } : {}) });
  const values = ['00123', '9007199254740993', '1.123456789'];
  const cells = m => m.slides.flatMap(s => s.items.filter(i => i.t === 'tbl').flatMap(i => i.cells));
  const cellText = c => (c.runs || []).map(r => r.t).join('');
  const xmlOf = async model => {
    const out = await D.exportPptx({ PptxGenJS, JSZip }, D.PRESETS[0], { model, type: 'nodebuffer' });
    const zip = await JSZip.loadAsync(out.data);
    const names = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n));
    return { xml: await Promise.all(names.map(n => zip.file(n).async('string'))), zip };
  };
  try {
    const rows = [['Identifier', 'Big integer', 'Exact decimal'], values];
    const model = D.buildModel(D.PRESETS[0], { table: { rows, header: true } });
    const rendered = cells(model).map(r => r.map(cellText));
    check('Default model preserves exact numeric-looking text', values.every(v => rendered.flat().includes(v)), JSON.stringify(rendered));
    const { xml } = await xmlOf(model);
    check('Native PPT XML preserves all exact numeric strings', values.every(v => xml.join('').includes('>' + v + '<')));
    check('PPT contains native editable table cells', /<a:tbl>/.test(xml.join('')) && /<a:tc>/.test(xml.join('')));
  } catch (e) { check('Raw-value export completes', false, e.stack || e.message); }
  for (const count of [25, 26, 60]) {
    try {
      const rows = [Array.from({ length: 12 }, (_, c) => `Header${c + 1}`), ...Array.from({ length: count }, (_, r) => Array.from({ length: 12 }, (_, c) => `R${String(r + 1).padStart(2, '0')}C${String(c + 1).padStart(2, '0')}`))];
      const table = { rows, header: true };
      const model = D.buildModel(D.PRESETS[0], { table });
      const source = D.tableSource(table);
      check(`${count} body rows × 12 preserve every source cell`, JSON.stringify(source.rawRows) === JSON.stringify(rows));
      check(`${count} body rows × 12 preview retains all columns`, cells(model).every(r => r.length === 12));
      if (count <= 25) {
        const { xml } = await xmlOf(model);
        check('25 body rows × 12 export contains every source cell', rows.flat().every(v => xml.join('').includes('>' + v + '<')));
        check('25 body rows exports a native editable table', xml.every(x => /<a:tbl>/.test(x)));
      } else {
        check(`${count} body rows are explicitly flagged incomplete`, source.exportComplete === false && !!source.exportReason);
        let pptxError; try { await xmlOf(model); } catch (e) { pptxError = e; }
        check(`${count} body rows cannot silently truncate PPT export`, pptxError?.code === 'TABLE_EXPORT_INCOMPLETE', pptxError?.message);
        let htmlError; try { D.tableHtml(model); } catch (e) { htmlError = e; }
        check(`${count} body rows cannot silently truncate clipboard HTML`, htmlError?.code === 'TABLE_EXPORT_INCOMPLETE', htmlError?.message);
      }
    } catch (e) { check(`${count} × 12 integrity check completes`, false, e.stack || e.message); }
  }
  try {
    const rows = [['Key', 'Value'], ['first', '00123'], ['', ''], ['marked', '9007199254740993'], ['last', '1.123456789']];
    const model = D.buildModel(D.PRESETS[0], { table: { rows, header: true, his: [{ type: 'cell', r: 3, c: 1, kind: 'warn' }] } });
    const table = model.slides[0].items.find(i => i.t === 'tbl');
    check('Blank interior row remains in the model', table.cells.length === rows.length && table.cells[2].every(c => cellText(c) === ''));
    const text = cells(model).flat().map(cellText);
    check('Blank-row fixture keeps exact strings and final row', ['00123', '9007199254740993', '1.123456789'].every(v => text.includes(v)));
    const marks = model.slides[0].table.his;
    check('Blank row does not shift stored mark coordinates', marks.some(h => h.type === 'cell' && h.r === 3 && h.c === 1));
  } catch (e) { check('Blank-row model completes', false, e.stack || e.message); }
  return results;
}

/* Self-contained: no lexical dependencies. May be evaluated in a real browser. */
async function browserSuite(options = {}) {
  const results = [];
  const visual = options.visual !== false;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const check = (name, pass, detail) => results.push({ name, pass: !!pass, ...(detail ? { detail } : {}) });
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const el = selector => { const e = document.querySelector(selector); assert(e, `Missing ${selector}`); return e; };
  const click = async selector => { el(selector).click(); await sleep(100); };
  const state = () => JSON.parse(localStorage.getItem('ppt-studio-table') || '{}');
  const cell = (r, c) => el(`#tGrid td[data-r="${r}"][data-c="${c}"]`);
  const focus = (r, c) => { const t = cell(r, c); t.focus(); t.dispatchEvent(new MouseEvent('click', { bubbles: true })); return t; };
  const key = (target, value, options = {}) => target.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...options }));
  const edit = (target, value) => { target.textContent = value; target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value })); };
  const choose = async (selector, value) => { const t = el(selector); t.value = value; t.dispatchEvent(new Event('change', { bubbles: true })); await sleep(100); };
  const paste = async (text, target = document.body, html = '') => {
    // ClipboardEvent/DataTransfer are unavailable in jsdom. A supplied read-only
    // clipboardData object exercises the same app handler without clipboard I/O.
    const dt = typeof DataTransfer !== 'undefined' ? new DataTransfer() : { values: {}, setData(k, v) { this.values[k] = v; }, getData(k) { return this.values[k] || ''; } };
    dt.setData('text/plain', text); if (html) dt.setData('text/html', html);
    const event = typeof ClipboardEvent !== 'undefined' ? new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }) : new Event('paste', { bubbles: true, cancelable: true });
    if (!event.clipboardData) Object.defineProperty(event, 'clipboardData', { value: dt });
    target.dispatchEvent(event); await sleep(150);
  };
  const tableText = () => [...document.querySelectorAll('#tGrid tr')].map(tr => [...tr.querySelectorAll('td[data-r][data-c]')].map(td => td.innerText == null ? td.textContent : td.innerText)).filter(r => r.length);
  const visible = element => {
    for (let p = element; p; p = p.parentElement) {
      const s = getComputedStyle(p); if (p.hidden || s.display === 'none' || s.visibility === 'hidden') return false;
    }
    return !visual || (element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0);
  };
  const run = async (name, fn) => { try { await fn(); check(name, true); } catch (e) { check(name, false, e.message); } };
  const reset = async () => {
    if (document.querySelector('#tEdit.wide')) await click('#tWideDone');
    await choose('#tSample', 'yield');
    if (document.querySelector('#tImportMode')) await choose('#tImportMode', 'new');
    if (document.querySelector('#tDelimiter')) await choose('#tDelimiter', 'auto');
    document.activeElement?.blur();
  };
  const setMark = async (r, c, scope, kind) => {
    await click(`#tPrev .tc[data-r="${r}"][data-c="${c}"]`);
    const prefix = visible(el('#tSelPanel')) ? '#tSelPanel' : '#tPop';
    await click(`${prefix} [data-a="scope"][data-v="${scope}"]`);
    await click(`${prefix} [data-a="star"][data-v="${kind}"]`);
    await sleep(400);
  };
  await click('#tabs button[data-tab="table"]');
  await sleep(300);
  await run('Expanded A1 paste immediately renders all 6 × 8 cells', async () => {
    await reset(); await click(document.querySelector('#tWorkbench') ? '#tWorkbench' : '#tWide');
    assert(document.querySelector('#tEdit.wide'), 'Expanded workbench did not open');
    const rows = Array.from({ length: 6 }, (_, r) => Array.from({ length: 8 }, (_, c) => `${String.fromCharCode(65 + c)}${r + 1}`));
    await paste(rows.map(r => r.join('\t')).join('\n'), focus(0, 0));
    assert(JSON.stringify(state().rows) === JSON.stringify(rows), 'Stored data differs from pasted 6 × 8 grid');
    assert(JSON.stringify(tableText()) === JSON.stringify(rows), 'Active A1 prevented immediate full-grid repaint');
    assert(document.querySelectorAll('#tGrid td[data-r][data-c]').length === 48, 'Grid does not expose all 48 cells');
    assert(el('#tWorkbenchPreview').querySelector('svg'), 'Live preview is missing');
    assert(visible(el('#tWorkbenchPreview')), 'Live preview is hidden');
  });
  await run('Raw numeric strings survive editor, preview and default format', async () => {
    await reset();
    const raw = ['00123', '9007199254740993', '1.123456789'];
    await paste('Identifier\tBig integer\tDecimal\n' + raw.join('\t'));
    assert(JSON.stringify(state().rows[1]) === JSON.stringify(raw), 'Stored numeric-looking strings changed');
    assert(JSON.stringify(tableText()[1]) === JSON.stringify(raw), 'Editor numeric-looking strings changed');
    const text = el('#tPrev').textContent;
    assert(raw.every(v => text.includes(v)), 'Rendered preview changed raw numeric strings');
  });
  await run('Single-row CSV A1,123 produces two cells', async () => {
    await reset(); await paste('A1,123');
    assert(JSON.stringify(state().rows) === JSON.stringify([['A1', '123']]), 'CSV was rejected or interpreted as a thousands-formatted number');
    assert(tableText()[0].length === 2, 'CSV grid column count is not two');
  });
  await run('Quoted multiline TSV and doubled quotes retain cell boundaries', async () => {
    await reset(); await paste('Key\tDescription\nA\t"first line\nsecond line with ""quote"""');
    assert(JSON.stringify(state().rows) === JSON.stringify([['Key', 'Description'], ['A', 'first line\nsecond line with "quote"']]), 'Quoted TSV was split or trimmed incorrectly');
    assert(tableText().length === 2, 'Quoted newline created an extra row');
  });
  await run('CSV quoted tabs remain within one field', async () => {
    await reset(); await paste('Key,Description\nA,"foo\tbar"');
    assert(JSON.stringify(state().rows) === JSON.stringify([['Key', 'Description'], ['A', 'foo\tbar']]), 'Quoted tab incorrectly overrode comma delimiter');
  });
  await run('HTML line breaks and matching TSV clipboard preserve multiline cells', async () => {
    await reset();
    const html = '<table><tr><th>Key</th><th>Description</th></tr><tr><td>A</td><td>first<br>second</td></tr></table>';
    await paste('Key\tDescription\nA\t"first\nsecond"', document.body, html);
    assert(JSON.stringify(state().rows) === JSON.stringify([['Key', 'Description'], ['A', 'first\nsecond']]), 'Mixed HTML/TSV clipboard lost newline');
    await reset(); await paste('', document.body, html);
    assert(state().rows[1][1] === 'first\nsecond', 'HTML-only <br> cell lost newline');
  });
  await run('Pasting 1,234 into B2 stays one cell unless comma delimiter is explicit', async () => {
    await reset(); await paste('Key\tValue\nA\told'); await click('#tWorkbench');
    let td = focus(1, 1); let range = document.createRange(); range.selectNodeContents(td); getSelection().removeAllRanges(); getSelection().addRange(range);
    await paste('1,234', td);
    assert(state().rows.length === 2 && state().rows[1].length === 2 && state().rows[1][1] === '1,234', 'Thousands-formatted single-cell paste spread across columns');
    await choose('#tDelimiter', 'comma'); td = focus(1, 1); await paste('1,234', td);
    assert(state().rows[1][1] === '1' && state().rows[1][2] === '234', 'Explicit comma mode did not split the pasted cells');
    await choose('#tDelimiter', 'auto');
  });
  await run('Merged HTML paste is visibly rejected without modifying data', async () => {
    await reset(); const before = JSON.stringify(state().rows);
    await paste('Top\t\nA\tB', document.body, '<table><tr><th colspan="2">Top</th></tr><tr><td>A</td><td>B</td></tr></table>');
    assert(JSON.stringify(state().rows) === before, 'Merged HTML was silently flattened or its plain-text fallback imported');
    const notice = document.querySelector('#toast.on,[role="alert"]');
    assert(notice && visible(notice) && /合併|merged|rowspan|colspan/i.test(notice.textContent), 'No visible merged-cell rejection');
  });
  await run('New data clears stale title, unit, note; explicit update preserves them', async () => {
    await reset(); const old = state();
    assert(old.title && old.unit && old.note, 'Metadata fixture is incomplete');
    await paste('Key\tValue\nnew\t123');
    assert(['title', 'unit', 'note'].every(k => !state()[k]), 'New table retained old content metadata');
    await reset(); const update = state();
    await choose('#tImportMode', 'update'); await paste('Key\tValue\nupdated\t456');
    assert(['title', 'unit', 'note'].every(k => state()[k] === update[k]), 'Explicit update did not retain existing metadata');
  });
  await run('Blank row remains visible and marks target the intended row', async () => {
    await reset(); await paste('Key\tValue\nfirst\t00123\n\t\nmarked\t9007199254740993\nlast\t1.123456789');
    assert(state().rows.length === 5 && tableText().length === 5, 'Blank row was dropped');
    assert(state().rows[2].every(v => v === ''), 'Blank row was filled or shifted');
    await setMark(3, 1, 'cell', 'warn');
    assert(state().his.some(h => h.type === 'cell' && h.r === 3 && h.c === 1 && h.kind === 'warn'), 'Highlight moved after blank row');
    assert(el('#tPrev .tc[data-r="3"][data-c="1"]'), 'Preview coordinate missing');
  });
  await run('Middle row/column insertion and deletion remap marks; undo restores them', async () => {
    await reset(); await paste('Key\tOne\tTwo\tThree\nA\ta1\ta2\ta3\nB\tb1\tb2\tb3\nC\tc1\tc2\tc3\nD\td1\td2\td3');
    await setMark(2, 1, 'row', 'warn'); await setMark(1, 2, 'col', 'rec'); await setMark(3, 3, 'cell', 'focus');
    const original = state(); const signature = t => JSON.stringify({ rows: t.rows, his: t.his, bold: t.bold, align: t.align, types: t.types, formats: t.formats }, (_key, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value);
    await click('#tWorkbench');
    focus(2, 1); await click('[data-g="r-before"]');
    let t = state(); assert(t.rows.length === 6 && t.rows[2].every(v => v === '') && t.rows[3][0] === 'B', 'Inserted row is not above the selected middle row');
    assert(t.his.some(h => h.type === 'row' && h.i === 3 && h.kind === 'warn') && t.his.some(h => h.type === 'cell' && h.r === 4 && h.c === 3), 'Row insertion did not remap marks');
    await click('#tWorkUndo'); assert(JSON.stringify(tableText()) === JSON.stringify(original.rows), 'Undo left the focused editor grid stale'); assert(signature(state()) === signature(original), 'Undo did not restore original row data and marks');
    focus(2, 1); await click('[data-g="r-"]'); t = state();
    assert(t.rows.length === 4 && t.rows[2][0] === 'C', 'Delete removed a different row');
    assert(!t.his.some(h => h.type === 'row' && h.kind === 'warn') && t.his.some(h => h.type === 'cell' && h.r === 2 && h.c === 3), 'Row deletion retained stale marks or shifted the wrong cell');
    await click('#tWorkUndo'); assert(JSON.stringify(tableText()) === JSON.stringify(original.rows), 'Undo left the focused editor grid stale'); assert(signature(state()) === signature(original), 'Undo row deletion did not restore marks: expected ' + signature(original) + '; actual ' + signature(state()));
    focus(1, 2); await click('[data-g="c-before"]'); t = state();
    assert(t.rows[0].length === 5 && t.rows[0][2] === '' && t.rows[0][3] === 'Two', 'Inserted column is not left of selected middle column');
    assert(t.his.some(h => h.type === 'col' && h.i === 3 && h.kind === 'rec') && t.his.some(h => h.type === 'cell' && h.r === 3 && h.c === 4), 'Column insertion did not remap marks');
    await click('#tWorkUndo'); assert(JSON.stringify(tableText()) === JSON.stringify(original.rows), 'Undo left the focused editor grid stale'); assert(signature(state()) === signature(original), 'Undo column insertion did not restore marks');
    focus(1, 2); await click('[data-g="c-"]'); t = state();
    assert(t.rows[0].length === 3 && t.rows[0][2] === 'Three', 'Delete removed a different column');
    assert(!t.his.some(h => h.type === 'col' && h.kind === 'rec') && t.his.some(h => h.type === 'cell' && h.r === 3 && h.c === 2), 'Column deletion retained stale marks or shifted the wrong cell');
    await click('#tWorkUndo'); assert(JSON.stringify(tableText()) === JSON.stringify(original.rows), 'Undo left the focused editor grid stale'); assert(signature(state()) === signature(original), 'Undo column deletion did not restore marks');
  });
  await run('Focused workbench Ctrl+Z/Y restores a structural change', async () => {
    await reset(); await paste('Key\tValue\nA\t10\nB\t20'); await click('#tWorkbench');
    focus(1, 1); await click('[data-g="r+"]');
    assert(state().rows.length === 4 && state().rows[2].every(v => v === ''), 'Insert-below fixture failed');
    key(document.activeElement, 'z', { ctrlKey: true }); await sleep(150);
    assert(state().rows.length === 3 && tableText().length === 3, 'Ctrl+Z did not restore application structure history while cell focused');
    key(document.activeElement, 'y', { ctrlKey: true }); await sleep(150);
    assert(state().rows.length === 4 && tableText().length === 4, 'Ctrl+Y did not redo application structure history');
  });
  await run('Workbench history buttons and boundary Tab navigation stay accessible', async () => {
    await reset(); await paste('Key\tValue\nA\t10'); await click('#tWorkbench');
    assert(visible(el('#tWorkUndo')) && visible(el('#tWorkRedo')), 'Workbench lacks visible history controls');
    let td = focus(0, 0); key(td, 'Tab', { shiftKey: true });
    assert(document.activeElement === el('#tColType'), 'Shift+Tab at A1 cannot leave the grid');
    td = focus(1, 1); key(td, 'Tab');
    assert(document.activeElement === el('[data-g="r-before"]'), 'Tab at last cell cannot reach structural controls');
    await click('#tWideDone'); assert(!document.querySelector('#tEdit.wide'), 'Workbench did not close');
    await click('#tWorkbench'); assert(document.querySelector('#tEdit.wide'), 'Workbench did not reopen');
    key(el('#tWideDone'), 'Escape'); await sleep(100);
    assert(!document.querySelector('#tEdit.wide') && document.activeElement === el('#tWorkbench'), 'Escape did not close and return focus');
  });
  await run('Unresolvable layout overflow blocks export even below the row limit', async () => {
    await reset(); const rows = [['Key', 'Description'], ...Array.from({ length: 4 }, (_, r) => ['Row' + r, '長文字'.repeat(200)])];
    await paste(rows.map(r => r.join('\t')).join('\n'));
    assert(JSON.stringify(state().rows) === JSON.stringify(rows), 'Oversized layout changed the source data');
    assert(el('#tCopy').disabled && el('#tPptx').disabled, 'Off-slide content remains exportable');
    assert(/版面待調整/.test(el('#tAuto').textContent), 'Layout problem is misreported as a row-capacity issue');
    assert(visible(el('#tExportBlocked')), 'Raw-data recovery actions are unavailable');
  });
  await run('Explicit number formatting groups strings without changing stored values', async () => {
    await reset(); await paste('Code\tAmount\n00123\t9007199254740993\n00002\t1.123456789'); await click('#tWorkbench');
    focus(1, 0); await choose('#tColType', 'text'); assert(el('#tColFormat').disabled, 'Text column incorrectly permits numeric formatting');
    focus(1, 1); await choose('#tColType', 'number'); await choose('#tColFormat', 'grouped');
    assert(state().rows[1][1] === '9007199254740993' && state().rows[2][1] === '1.123456789', 'Explicit display format changed original stored values');
    assert(el('#tWorkbenchPreview').textContent.includes('9,007,199,254,740,993'), 'Grouped preview rounded large integer');
    assert(el('#tWorkbenchPreview').textContent.includes('1.123456789'), 'Grouped preview rounded decimal');
    await choose('#tColFormat', 'raw'); assert(el('#tWorkbenchPreview').textContent.includes('9007199254740993'), 'Raw format did not restore original display');
  });
  await run('25/26/60 body-row UI preserves all 12 columns and blocks incomplete export', async () => {
    for (const count of [25, 26, 60]) {
      await reset();
      const rows = [Array.from({ length: 12 }, (_, c) => `Header${c + 1}`), ...Array.from({ length: count }, (_, r) => Array.from({ length: 12 }, (_, c) => `R${r + 1}C${c + 1}`))];
      await paste(rows.map(r => r.join('\t')).join('\n'));
      el('#tHRow').checked = true; el('#tHRow').dispatchEvent(new Event('change', { bubbles: true }));
      assert(JSON.stringify(state().rows) === JSON.stringify(rows), `${count} body rows lost source data`);
      await click('#tWorkbench');
      assert(document.querySelectorAll('#tGrid td[data-r][data-c]').length === (count + 1) * 12, `${count} body rows are incomplete in editor`);
      assert(cell(count, 11).textContent === `R${count}C12`, `${count} final cell missing`);
      await click('#tWideDone');
      assert(el('#tCopy').disabled === (count > 25) && el('#tPptx').disabled === (count > 25), `${count} export availability disagrees with completeness`);
      if (count > 25) {
        assert(visible(el('#tExportBlocked')), `${count} overflow recovery controls are hidden`);
        assert(/25/.test(el('#tMsg').textContent) && /停用|無法|超出|超過|避免遺漏/.test(el('#tMsg').textContent), `${count} overflow reason is not clear`);
        assert(!el('#tBlockedData').disabled, `${count} complete TSV recovery is unavailable`);
      }
    }
  });
  await run('Overflow TSV recovery includes every source row and quoted multiline cells', async () => {
    await reset();
    const rows = [['Key', 'Description'], ...Array.from({ length: 60 }, (_, r) => [`row${r + 1}`, r === 59 ? 'last line\nwith "quote"' : `value${r + 1}`])];
    const tsv = rows.map(r => r.map(v => /[\t\n"]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v).join('\t')).join('\n');
    await paste(tsv);
    let captured;
    const create = URL.createObjectURL, revoke = URL.revokeObjectURL;
    URL.createObjectURL = blob => { captured = blob; return create ? create.call(URL, blob) : 'blob:table-regression'; };
    URL.revokeObjectURL = () => {};
    try {
      await click('#tBlockedData'); assert(captured, 'Recovery action did not create a data download');
      const text = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsText(captured); });
      assert(String(text).replace(/^\uFEFF/, '') === tsv, 'Complete TSV omitted, reformatted or misquoted source cells');
    } finally { if (create) URL.createObjectURL = create; else delete URL.createObjectURL; if (revoke) URL.revokeObjectURL = revoke; else delete URL.revokeObjectURL; }
  });
  await run('Single-column TSV download and reimport preserve a trailing blank row', async () => {
    await reset(); await choose('#tDelimiter', 'tab'); await paste('Header\nfirst\n""'); await click('#tWorkbench');
    assert(JSON.stringify(state().rows) === JSON.stringify([['Header'], ['first'], ['']]), 'Trailing blank single-column import was dropped');
    let captured; const create = URL.createObjectURL, revoke = URL.revokeObjectURL;
    URL.createObjectURL = blob => { captured = blob; return create ? create.call(URL, blob) : 'blob:table-regression'; }; URL.revokeObjectURL = () => {};
    try {
      await click('#tDataDownload'); assert(captured, 'Single-column download did not create a blob');
      const text = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).replace(/^\uFEFF/, '')); reader.onerror = reject; reader.readAsText(captured); });
      assert(text.endsWith('\n""'), 'TSV did not quote the final empty cell');
      await paste(text, focus(0, 0)); assert(JSON.stringify(state().rows) === JSON.stringify([['Header'], ['first'], ['']]), 'Single-column TSV roundtrip lost final blank row');
    } finally { if (create) URL.createObjectURL = create; else delete URL.createObjectURL; if (revoke) URL.revokeObjectURL = revoke; else delete URL.revokeObjectURL; await choose('#tDelimiter', 'auto'); }
  });
  await run('Enter commits down, Shift+Enter commits up, Escape cancels', async () => {
    await reset(); await paste('Key\tValue\nfirst\told\nsecond\told2');
    await click(document.querySelector('#tWorkbench') ? '#tWorkbench' : '#tWide');
    let td = focus(1, 1); edit(td, 'committed'); key(td, 'Enter'); await sleep(150);
    assert(state().rows[1][1] === 'committed', 'Enter did not commit edit');
    assert(document.activeElement.dataset.r === '2' && document.activeElement.dataset.c === '1', 'Enter did not move down');
    td = document.activeElement; edit(td, 'shift-committed'); key(td, 'Enter', { shiftKey: true }); await sleep(100);
    assert(state().rows[2][1] === 'shift-committed', 'Shift+Enter did not commit');
    assert(document.activeElement.dataset.r === '1' && document.activeElement.dataset.c === '1', 'Shift+Enter did not move up');
    td = document.activeElement; edit(td, 'cancel this'); key(td, 'Escape'); await sleep(100);
    assert(state().rows[1][1] === 'committed' && cell(1, 1).textContent === 'committed', 'Escape did not restore pre-edit value');
    assert(document.querySelector('#tEdit.wide'), 'Cell Escape incorrectly closed the workbench');
  });
  await run('Alt+Enter makes a newline without moving; IME Enter does not commit', async () => {
    await reset(); await paste('Key\tValue\nfirst\tline\nsecond\tother');
    await click(document.querySelector('#tWorkbench') ? '#tWorkbench' : '#tWide');
    let td = focus(1, 1); const range = document.createRange(); range.selectNodeContents(td); range.collapse(false); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    key(td, 'Enter', { altKey: true }); await sleep(100);
    assert(document.activeElement === td, 'Alt+Enter moved focus');
    assert(/\n/.test(td.innerText || td.textContent), 'Alt+Enter did not insert a line break');
    key(td, 'Enter'); await sleep(100); assert(/\n/.test(state().rows[1][1]), 'Committed line break was lost');
    td = focus(2, 1); td.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); edit(td, '輸入中');
    key(td, 'Enter', { isComposing: true, keyCode: 229 }); await sleep(100);
    assert(document.activeElement === td, 'IME confirmation moved to another row');
    td.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '輸入中' })); key(td, 'Enter'); await sleep(100);
    assert(state().rows[2][1] === '輸入中', 'IME text was lost');
  });
  await run('Clipboard metadata exclusion is clear before copying', async () => {
    await reset();
    const copy = el('#tCopy');
    assert(/僅|只|表格本體|不含/.test(copy.textContent + ' ' + copy.title), 'Copy button does not warn that it copies only the table');
    const candidates = [...document.querySelectorAll('#tOut *,#tDock *,#tCopyNote')].filter(e => !e.querySelector('*') && visible(e));
    assert(candidates.some(e => /標題/.test(e.textContent) && /單位/.test(e.textContent) && /註腳|註解|備註/.test(e.textContent) && /不含|不包含|僅|下載/.test(e.textContent)), 'No visible pre-action note explains metadata exclusion');
    assert(!window.__studio.lastTableCopy, 'Fixture already invoked clipboard action');
  });
  return results;
}

async function domSuite() {
  const { JSDOM, VirtualConsole, ResourceLoader } = require(process.env.JSDOM_MODULE || 'jsdom');
  class LocalResources extends ResourceLoader {
    fetch(url) {
      const name = path.basename(new URL(url).pathname);
      const target = path.join(ROOT, name);
      return fs.existsSync(target) ? Promise.resolve(fs.readFileSync(target)) : null;
    }
  }
  const virtualConsole = new VirtualConsole();
  const pageErrors = [];
  virtualConsole.on('jsdomError', error => { if (!/navigation|HTMLCanvasElement|window.scrollTo/.test(error.message)) pageErrors.push(error.message); });
  const html = fs.readFileSync(path.resolve(ROOT, process.env.STUDIO_HTML || 'studio.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: 'http://studio.test/studio.html',
    runScripts: 'dangerously', resources: new LocalResources(), pretendToBeVisual: true, virtualConsole,
    beforeParse(window) {
      window.matchMedia = query => ({ matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      window.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
      window.HTMLElement.prototype.scrollIntoView = function () {};
      window.HTMLElement.prototype.animate = function () { return { finished: Promise.resolve(), cancel() {} }; };
      Object.defineProperty(window.HTMLElement.prototype, 'innerText', { get() { return this.textContent; }, set(value) { this.textContent = value; }, configurable: true });
      window.HTMLAnchorElement.prototype.click = function () { if (!this.download) this.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); };
      window.HTMLCanvasElement.prototype.getContext = () => ({ font: '', measureText: text => ({ width: String(text).length * 50 }) });
      window.confirm = () => true;
      window.scrollTo = () => {};
      window.document.execCommand = (command, _, value) => {
        if (command !== 'insertText' && command !== 'insertLineBreak') return false;
        const selection = window.getSelection(); if (!selection.rangeCount) return false;
        const range = selection.getRangeAt(0); range.deleteContents(); const node = window.document.createTextNode(command === 'insertLineBreak' ? '\n' : value); range.insertNode(node); range.setStartAfter(node); range.collapse(true); selection.removeAllRanges(); selection.addRange(range); window.document.activeElement.dispatchEvent(new window.InputEvent('input', { bubbles: true, inputType: 'insertText', data: node.textContent })); return true;
      };
    }
  });
  try {
    await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('jsdom load timeout')), 20000); dom.window.addEventListener('load', () => { clearTimeout(timer); resolve(); }); });
    await new Promise(resolve => setTimeout(resolve, 300));
    const run = dom.window.eval('(' + browserSuite.toString() + ')');
    const results = await run({ visual: false });
    results.push({ name: 'DOM event harness has no uncaught page errors', pass: pageErrors.length === 0, detail: pageErrors.join('\n') });
    return results;
  } finally { dom.window.close(); }
}

async function main() {
  const argv = process.argv.slice(2);
  let results = [];
  if (!argv.includes('--dom-only') && !argv.includes('--browser-only')) results.push(...await modelSuite());
  if (argv.includes('--dom-only')) results.push(...await domSuite());
  else if (!argv.includes('--model-only')) {
    const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
    const url = argv.find(v => !v.startsWith('--')) || pathToFileURL(path.join(ROOT, 'studio.html')).href;
    const executablePath = process.env.CHROME || ['/usr/bin/chromium', '/usr/bin/google-chrome'].find(p => fs.existsSync(p));
    const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] });
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(url, { waitUntil: 'load' }); await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'load' });
      results.push(...await page.evaluate(browserSuite, { visual: true }));
      results.push({ name: 'Real browser has no uncaught page errors', pass: errors.length === 0, detail: errors.join('\n') });
    } finally { await browser.close(); }
  }
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? '\n  ' + r.detail : ''}`);
  const fail = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - fail}/${results.length} checks passed${argv.includes('--dom-only') ? ' (DOM event logic only; not browser/visual certification)' : ''}.`);
  if (process.env.RESULTS_JSON) fs.writeFileSync(process.env.RESULTS_JSON, JSON.stringify(results, null, 2));
  process.exitCode = fail ? 1 : 0;
}
module.exports = { modelSuite, browserSuite, domSuite };
if (require.main === module) main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
