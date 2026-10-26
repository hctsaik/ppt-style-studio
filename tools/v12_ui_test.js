// Optional browser regression; not run during Cola DOM-only acceptance.
const pp=require('puppeteer-core');let F=0;const ck=(t,v)=>{console.log((v?'OK   ':'FAIL ')+t);if(!v)F++;};(async()=>{const b=await pp.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.setViewport({width:1400,height:900});await pg.goto('file:///workspace/ppt-style-studio/studio.html');await new Promise(r=>setTimeout(r,2500));
const c=await pg.target().createCDPSession();await c.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:require('os').tmpdir()});
await pg.type('#pSearch','地圖');await new Promise(r=>setTimeout(r,500));
const n=await pg.$$eval('#pRes .pck',x=>x.length);ck('搜尋結果元件可勾選',n>=2);
const cks=await pg.$$('#pRes .pck');await cks[0].click();await cks[1].click();await pg.click('#pmDl');await new Promise(r=>setTimeout(r,3000));
ck('下載所選',((await pg.evaluate(()=>window.__studio.pmDl))||{}).n===2);
ck('已移除加入待選',!(await pg.$('#pmTray'))&&!(await pg.$('#trayBtn'))&&!(await pg.$('#tray')));
await pg.keyboard.press('Escape');await pg.click('body');await pg.keyboard.press('/');ck('/ 聚焦搜尋',(await pg.evaluate(()=>document.activeElement.id))==='pSearch');
await pg.evaluate(()=>document.querySelector('#tabs [data-tab="guide"]').click());await new Promise(r=>setTimeout(r,500));
await pg.evaluate(()=>document.querySelectorAll('.rdl')[2].click());await new Promise(r=>setTimeout(r,4000));ck('食譜下載整份',((await pg.evaluate(()=>window.__studio.lastRecipe))||{}).pages>=5);

// Legacy Kit one-click apply retired. Fixed-master palette must remain independent.
const paletteBefore=await pg.evaluate(()=>getComputedStyle(document.querySelector('#dot')).backgroundColor);
await pg.click('#tabs [data-tab="master"]');await new Promise(r=>setTimeout(r,500));
ck('母片配色獨立於元件',await pg.evaluate(before=>!document.querySelector('[data-fm-field="paletteSource"]')&&[...document.querySelectorAll('[data-fm-scheme]')].map(e=>e.dataset.fmScheme).join(',')==='07,06,03,10,04'&&getComputedStyle(document.querySelector('#dot')).backgroundColor===before,paletteBefore));
ck('兩個母片出口均直接可用',await pg.evaluate(()=>[...document.querySelectorAll('[data-fm-download]')].map(x=>x.dataset.fmDownload).join(',')==='template,materials'&&[...document.querySelectorAll('[data-fm-download]')].every(x=>!x.closest('details'))));
await pg.evaluate(()=>document.querySelector('[data-tab="icons"]').click());await new Promise(r=>setTimeout(r,800));
ck('圖示庫無多選／＋待選',!(await pg.$('#iMulti'))&&!(await pg.$('#iGrid .iadd')));
await pg.type('#iSearch','錢');await new Promise(r=>setTimeout(r,500));ck('圖示搜尋同義詞：錢 → budget 類圖示',await pg.evaluate(()=>!!document.querySelector('#iGrid .ic[data-id="request_quote"]')));
ck('圖示外框選項 6 種',(await pg.$$eval('#iVar button',b=>b.length))===6);
await pg.evaluate(()=>document.querySelector('[data-tab="table"]').click());await new Promise(r=>setTimeout(r,800));ck('表格退休控制已移除',await pg.evaluate(()=>!document.querySelector('#tArrow')&&!document.querySelector('[data-tk="tbTight"]')));
ck('無 JS 錯誤',!errs.length);console.log(F?'FAILS '+F:'ALL OK');await b.close();})();
