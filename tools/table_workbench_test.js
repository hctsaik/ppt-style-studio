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
      check(`${count} body rows are complete and exportable`, source.exportComplete !== false && model.slides.every(s => s.table.exportComplete !== false));
      const { xml } = await xmlOf(model);
      check(`${count} body rows × 12 export contains every source cell`, rows.flat().every(v => xml.join('').includes('>' + v + '<')));
      check(`${count} body rows export native editable tables on every page`, xml.length === model.slides.length && xml.every(x => /<a:tbl>/.test(x)));
      const sourceRows = model.slides.flatMap(s => s.table.sourceRows.filter(r => r >= s.table.h0));
      check(`${count} body rows occur on exactly one page each`, JSON.stringify(sourceRows) === JSON.stringify(Array.from({ length: count }, (_, r) => r + 1)));
      if (model.slides.length > 1) {
        let scopeError; try { D.tableHtml(model); } catch (e) { scopeError = e; }
        check(`${count} body rows require explicit clipboard page`, scopeError?.code === 'TABLE_COPY_SCOPE_REQUIRED', scopeError?.message);
      }
      check(`${count} body rows allow explicit per-page HTML copy`, model.slides.every((_, pageIndex) => /<table/.test(D.tableHtml(model, { pageIndex }))));
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
  const run = async (name, fn) => { if (options.only && !name.includes(options.only)) return; try { await fn(); check(name, true); } catch (e) { check(name, false, e.message); } };
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
  await run('Single oversized row blocks export and links to the exact original row', async () => {
    await reset(); const rows = [['Key', 'Description'], ['short row', 'fits'], ...Array.from({ length: 4 }, (_, r) => ['Row' + r, '長文字'.repeat(200)])];
    await paste(rows.map(r => r.join('\t')).join('\n'));
    assert(JSON.stringify(state().rows) === JSON.stringify(rows), 'Oversized layout changed the source data');
    assert(el('#tCopy').disabled && el('#tPptx').disabled, 'Off-slide content remains exportable');
    assert(/版面待調整/.test(el('#tAuto').textContent), 'Layout problem is misreported as a row-capacity issue');
    assert(visible(el('#tExportBlocked')), 'Raw-data recovery actions are unavailable');
    assert(window.__studio.table.blockedRow === 2 && visible(el('#tBlockedRow')), 'Oversized row is not identified by its original grid index');
    await click('#tBlockedRow');
    assert(window.__studio.gridSelection.r === 2 && document.activeElement === cell(2, 0), 'Inspect-row action did not focus the exact original row');
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
  await run('25/26/60 body-row UI retains all cells and exposes every exportable page', async () => {
    for (const count of [25, 26, 60]) {
      await reset();
      const rows = [Array.from({ length: 12 }, (_, c) => `Header${c + 1}`), ...Array.from({ length: count }, (_, r) => Array.from({ length: 12 }, (_, c) => `R${r + 1}C${c + 1}`))];
      await paste(rows.map(r => r.join('\t')).join('\n'));
      el('#tHRow').checked = true; el('#tHRow').dispatchEvent(new Event('change', { bubbles: true }));
      assert(JSON.stringify(state().rows) === JSON.stringify(rows), `${count} body rows lost source data`);
      await click('#tWorkbench');
      assert(document.querySelectorAll('#tGrid td[data-r][data-c]').length === (count + 1) * 12, `${count} body rows are incomplete in editor`);
      assert(cell(count, 11).textContent === `R${count}C12`, `${count} final cell missing`);
      const first = window.__studio.table;
      assert(first.pageIndex === 0 && first.pageCount >= 1, `${count} page state not initialized`);
      assert(/原始列/.test(el('#tWorkPageInfo').textContent) && el('#tAuto').textContent.includes(`資料 ${count} 列`), 'Source-row and body-row labels are ambiguous');
      if (count > 25) assert(first.pageCount > 1, `${count} long table was not paginated`);
      assert(el('#tWorkPagePrev').disabled, 'Previous-page control should be disabled on first page');
      focus(count, 11); await sleep(120);
      assert(window.__studio.table.sourceRows.includes(count), `${count} selection did not reveal its page`);
      assert(el(`#tWorkbenchPreview .tc[data-r="${count}"][data-c="11"]`).classList.contains('gsel'), 'Preview failed to select the raw final row');
      assert(window.__studio.gridSelection.r === count, 'Grid selection was changed to a page-local row');
      if (window.__studio.table.pageCount > 1) {
        const lastPage = window.__studio.table.pageIndex;
        await click('#tWorkPagePrev'); await sleep(120);
        assert(window.__studio.table.pageIndex === lastPage - 1, 'Manual page navigation snapped back to the selected row');
        assert(window.__studio.gridSelection.r === count, 'Manual navigation changed the data selection');
        assert(/不在本頁/.test(el('#tWorkbenchStatus').textContent), 'Off-page selection is not explained');
        focus(count, 11); await sleep(120);
        assert(window.__studio.table.pageIndex === lastPage, 'Clicking an already selected off-page cell did not reveal it');
      }
      assert(el('#tWorkPageNext').disabled, 'Next-page control should be disabled on last page');
      await click('#tWideDone');
      assert(!el('#tCopy').disabled && !el('#tPptx').disabled, `${count} complete paginated export is disabled`);
      assert(!visible(el('#tExportBlocked')), `${count} complete table shows an export-blocked warning`);
    }
  });
  await run('Page 2 preview keyboard and repeated header map to raw source rows', async () => {
    await reset();
    await paste([['Key', 'Value'], ...Array.from({ length: 60 }, (_, r) => [`row${r + 1}`, String(r + 1)])].map(r => r.join('\t')).join('\n'));
    await click('#tPageNext'); const page = JSON.parse(JSON.stringify(window.__studio.table));
    const firstBody = page.sourceRows.find(r => r !== 0), header = el('#tPrev .tc[data-r="0"][data-c="1"]');
    header.focus(); key(header, 'ArrowDown');
    assert(+document.activeElement.dataset.r === firstBody && +document.activeElement.dataset.localR === 1, 'ArrowDown from repeated header targeted page-local row 1 as a raw row');
    key(document.activeElement, 'ArrowUp'); assert(+document.activeElement.dataset.r === 0, 'ArrowUp did not return to repeated header');
    await click('#tPrev .tc[data-r="0"][data-c="1"]'); assert(window.__studio.table.pageIndex === 1, 'Selecting repeated header jumped to page 1');
    const target = el(`#tPrev .tc[data-r="${firstBody}"][data-c="1"]`); target.focus(); key(target, 'Enter');
    assert(window.__studio.gridSelection.r === firstBody, 'Preview Enter selected a page-local row in the full grid');
    await click('#tSelPanel [data-a="star"][data-v="warn"]');
    assert(state().his.some(h => h.type === 'cell' && h.r === firstBody && h.c === 1 && h.kind === 'warn'), 'Preview keyboard mark stored the wrong raw row');
    const colors = [...document.querySelectorAll('#tHil .it i')].map(i => i.style.background);
    await click('#tPagePrev');
    assert(JSON.stringify([...document.querySelectorAll('#tHil .it i')].map(i => i.style.background)) === JSON.stringify(colors), 'Mark colors changed when its row moved off-page');
    const lastFirstPage = window.__studio.table.sourceRows.slice(-1)[0]; await click('#tWorkbench');
    let gridCell = focus(lastFirstPage, 1); key(gridCell, 'Enter'); await sleep(100);
    assert(window.__studio.table.pageIndex === 1 && +document.activeElement.dataset.r === lastFirstPage + 1, 'Grid Enter did not follow the next source row across the page boundary');
    gridCell = document.activeElement; key(gridCell, 'Enter', { shiftKey: true }); await sleep(100);
    assert(window.__studio.table.pageIndex === 0 && +document.activeElement.dataset.r === lastFirstPage, 'Grid Shift+Enter did not return across the page boundary');
    await click('#tWideDone');
    el('#tHRow').checked = false; el('#tHRow').dispatchEvent(new Event('change', { bubbles: true })); await click('#tPageNext');
    const noHeader = window.__studio.table.sourceRows; const first = el(`#tPrev .tc[data-r="${noHeader[0]}"][data-c="1"]`); first.focus(); key(first, 'ArrowDown');
    assert(+document.activeElement.dataset.r === noHeader[1], 'Headerless page keyboard movement is not mapped to raw rows');
  });
  await run('Paginated row insertion, deletion and undo preserve raw-row marks at 25/26/60 boundaries', async () => {
    for (const count of [25, 26, 60]) {
      await reset();
      const rows = [['Key', 'Value'], ...Array.from({ length: count }, (_, r) => [`row${r + 1}`, String(1000 + r)])];
      await paste(rows.map(r => r.join('\t')).join('\n'));
      await click('#tWorkbench'); focus(count, 1); await sleep(100); await click('#tWideDone');
      await setMark(count, 1, 'cell', 'warn');
      const original = state();
      await click('#tWorkbench'); focus(count, 1); await click('[data-g="r-before"]');
      assert(state().rows[count + 1][0] === `row${count}` && state().his.some(h => h.type === 'cell' && h.r === count + 1 && h.kind === 'warn'), `${count} insert shifted the wrong raw mark`);
      assert(window.__studio.table.sourceRows.includes(count), `${count} inserted row is absent from selected preview page`);
      await click('#tWorkUndo');
      assert(JSON.stringify(state().rows) === JSON.stringify(original.rows) && JSON.stringify(state().his.map(h => Object.entries(h).sort())) === JSON.stringify(original.his.map(h => Object.entries(h).sort())), `${count} insert undo lost raw rows or marks`);
      focus(count - 1, 1); await click('[data-g="r-"]');
      assert(state().rows[count - 1][0] === `row${count}` && state().his.some(h => h.type === 'cell' && h.r === count - 1 && h.kind === 'warn'), `${count} delete shifted the wrong raw mark`);
      await click('#tWorkUndo');
      assert(JSON.stringify(state().rows) === JSON.stringify(original.rows) && JSON.stringify(state().his.map(h => Object.entries(h).sort())) === JSON.stringify(original.his.map(h => Object.entries(h).sort())), `${count} delete undo lost raw rows or marks`);
    }
  });
  await run('Full TSV download includes every source row and quoted multiline cells', async () => {
    await reset();
    const rows = [['Key', 'Description'], ...Array.from({ length: 60 }, (_, r) => [`row${r + 1}`, r === 59 ? 'last line\nwith "quote"' : `value${r + 1}`])];
    const tsv = rows.map(r => r.map(v => /[\t\n"]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v).join('\t')).join('\n');
    await paste(tsv);
    let captured;
    const create = URL.createObjectURL, revoke = URL.revokeObjectURL;
    URL.createObjectURL = blob => { captured = blob; return create ? create.call(URL, blob) : 'blob:table-regression'; };
    URL.revokeObjectURL = () => {};
    try {
      await click('#tWorkbench'); await click('#tDataDownload'); assert(captured, 'Full data action did not create a data download');
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
  await run('Alt+Enter at end, middle and repeated blank lines places subsequent typing after the newline', async () => {
    await reset(); await paste('Key\tValue\nfirst\tAlpha\nsecond\tother'); await click('#tWorkbench');
    const typeAtCaret = text => {
      const selection = getSelection(), range = selection.getRangeAt(0); range.deleteContents();
      const node = document.createTextNode(text); range.insertNode(node); range.setStart(node, node.length); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
      document.activeElement.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    };
    const caret = (td, offset) => { const range = document.createRange(); range.setStart(td.firstChild, offset); range.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(range); };
    let td = focus(1, 1); caret(td, 5); key(td, 'Enter', { altKey: true }); await sleep(100);
    assert(document.activeElement === td, 'Alt+Enter moved focus');
    assert(td.textContent === 'Alpha\n' && td.querySelector('br[data-grid-tail]'), 'Trailing newline has no rendered empty-line anchor');
    assert(getSelection().anchorNode.nodeType === Node.TEXT_NODE && getSelection().anchorOffset === getSelection().anchorNode.length, 'Caret is outside the inserted newline text node');
    typeAtCaret('Beta'); assert(state().rows[1][1] === 'Alpha\nBeta', 'Typing after Alt+Enter landed before the newline');
    assert(!td.querySelector('br[data-grid-tail]'), 'Nonempty final line retained a stale caret sentinel');
    key(td, 'Enter', { altKey: true }); key(td, 'Enter', { altKey: true }); typeAtCaret('Gamma');
    assert(state().rows[1][1] === 'Alpha\nBeta\n\nGamma', 'Repeated Alt+Enter did not preserve an empty line');
    key(td, 'Enter'); await sleep(100); assert(state().rows[1][1] === 'Alpha\nBeta\n\nGamma', 'Committed line breaks were lost');
    td = focus(1, 1); edit(td, 'AlphaBeta'); caret(td, 5); key(td, 'Enter', { altKey: true }); typeAtCaret('middle');
    assert(state().rows[1][1] === 'Alpha\nmiddleBeta', 'Mid-cell line break moved the following text or caret');
    const range = document.createRange(); range.setStart(td.firstChild, 2); range.setEnd(td.lastChild, Math.min(2, td.lastChild.length)); getSelection().removeAllRanges(); getSelection().addRange(range);
    key(td, 'Enter', { altKey: true }); typeAtCaret('selected'); assert(state().rows[1][1].includes('\nselected'), 'Selection replacement did not leave the caret after the newline');
  });
  await run('IME Enter does not commit or leave the current cell', async () => {
    await reset(); await paste('Key\tValue\nfirst\tline\nsecond\tother'); await click('#tWorkbench');
    const td = focus(2, 1); td.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); edit(td, '輸入中');
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
  await run('Page 2 copy uses page-only display values while TSV keeps each original row once', async () => {
    await reset();
    const rows = [['Key', 'Amount'], ...Array.from({ length: 60 }, (_, r) => [`raw${r + 1}`, r === 59 ? '9007199254740993' : String(1234000 + r)])];
    await paste(rows.map(r => r.join('\t')).join('\n')); await click('#tWorkbench');
    focus(1, 1); await choose('#tColType', 'number'); await choose('#tColFormat', 'grouped'); await click('#tWideDone');
    await click('#tPageNext');
    const page = JSON.parse(JSON.stringify(window.__studio.table));
    assert(page.pageIndex === 1 && page.pageCount > 1, 'Page 2 fixture is missing');
    let copied;
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard'), oldItem = window.ClipboardItem;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { write: async items => { copied = items[0].data; } } });
    window.ClipboardItem = class { constructor(data) { this.data = data; } };
    const read = blob => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsText(blob); });
    try {
      await click('#tCopy'); assert(copied, 'Copy handler did not provide both clipboard types');
      const html = await read(copied['text/html']), text = await read(copied['text/plain']);
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const htmlRows = [...parsed.querySelectorAll('tr')].map(tr => [...tr.querySelectorAll('th,td')].map(td => td.textContent));
      const expected = page.sourceRows.map(r => rows[r].map((v, c) => r && c === 1 ? v.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : v));
      assert(JSON.stringify(htmlRows) === JSON.stringify(expected), 'HTML includes another page or differs from displayed grouped values');
      assert(text === expected.map(r => r.join('\t')).join('\n'), 'Plaintext differs from this page’s HTML display values');
      assert(window.__studio.lastTableCopy.pageIndex === 1, 'Clipboard diagnostics did not record the chosen page');
      const oldExec = document.execCommand, fallback = {}; navigator.clipboard.write = async () => { throw new Error('Test fallback'); };
      document.execCommand = command => { if (command !== 'copy') return false; const event = new Event('copy', { bubbles: true, cancelable: true }); Object.defineProperty(event, 'clipboardData', { value: { setData(type, value) { fallback[type] = value; } } }); document.dispatchEvent(event); return true; };
      try { await click('#tCopy'); assert(fallback['text/html'] === html && fallback['text/plain'] === text && window.__studio.lastTableCopy.fallback, 'Legacy clipboard path differs in scope or display values'); } finally { document.execCommand = oldExec; }
    } finally { if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard); else delete navigator.clipboard; window.ClipboardItem = oldItem; }
    let captured; const create = URL.createObjectURL, revoke = URL.revokeObjectURL;
    URL.createObjectURL = blob => { captured = blob; return 'blob:table-page-copy-test'; }; URL.revokeObjectURL = () => {};
    try {
      await click('#tWorkbench'); await click('#tDataDownload');
      assert((await read(captured)).replace(/^\uFEFF/, '') === rows.map(r => r.join('\t')).join('\n'), 'Full TSV repeated page headers or reformatted original values');
    } finally { if (create) URL.createObjectURL = create; else delete URL.createObjectURL; if (revoke) URL.revokeObjectURL = revoke; else delete URL.revokeObjectURL; }
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
    const results = await run({ visual: false, only: process.env.SUITE_FILTER });
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
