const pp=require('puppeteer-core');let F=0;const ck=(t,v)=>{console.log((v?'OK   ':'FAIL ')+t);if(!v)F++;};(async()=>{const b=await pp.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.setViewport({width:1400,height:900});await pg.goto('file:///workspace/ppt-style-studio/studio.html');await new Promise(r=>setTimeout(r,2500));
const c=await pg.target().createCDPSession();await c.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:require('os').tmpdir()});
await pg.type('#pSearch','地圖');await new Promise(r=>setTimeout(r,500));
const n=await pg.$$eval('#pRes .pck',x=>x.length);ck('搜尋結果元件可勾選',n>=2);
const cks=await pg.$$('#pRes .pck');await cks[0].click();await cks[1].click();await pg.click('#pmDl');await new Promise(r=>setTimeout(r,3000));
ck('下載所選',((await pg.evaluate(()=>window.__studio.pmDl))||{}).n===2);
await pg.click('#pmTray');ck('加入待選',(await pg.evaluate(()=>window.__studio.pmTray))===2);
await pg.keyboard.press('Escape');await pg.click('body');await pg.keyboard.press('/');ck('/ 聚焦搜尋',(await pg.evaluate(()=>document.activeElement.id))==='pSearch');
await pg.evaluate(()=>document.querySelector('[data-go="guide"]').click());await new Promise(r=>setTimeout(r,500));
await pg.evaluate(()=>document.querySelectorAll('.rdl')[2].click());await new Promise(r=>setTimeout(r,4000));ck('食譜下載整份',((await pg.evaluate(()=>window.__studio.lastRecipe))||{}).pages>=5);

await pg.evaluate(()=>document.querySelector('[data-go="kit"]').click());await new Promise(r=>setTimeout(r,800));
await pg.evaluate(()=>{document.querySelector('[data-sk="teal"]').click();});await pg.evaluate(()=>document.querySelector('#skApply').click());await new Promise(r=>setTimeout(r,1500));
ck('Style Kit 一鍵套用',(await pg.evaluate(()=>window.__studio.kitApplied))==='teal');
ck('無 JS 錯誤',!errs.length);console.log(F?'FAILS '+F:'ALL OK');await b.close();})();
