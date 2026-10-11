const P=require('puppeteer-core');const URL='file:///workspace/ppt-style-studio/studio.html';const sl=ms=>new Promise(r=>setTimeout(r,ms));const OUT='/workspace/ppt-style-studio/render';
let fail=0;const ck=(m,c)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fail++;};
const ov=(a,b)=>!(a.right<=b.left+1||a.left>=b.right-1||a.bottom<=b.top+1||a.top>=b.bottom-1);
(async()=>{const b=await P.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const pg=await b.newPage();await pg.setViewport({width:1440,height:900});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(URL,{waitUntil:'networkidle0'});await sl(400);await pg.click('#tabs button[data-tab="table"]');await sl(700);await pg.select('#tSample','status');await sl(700);
 const popInfo=()=>pg.evaluate(()=>{const p=document.querySelector('#tSelPanel');const sel=document.querySelector('#tPrev .tc.sel');const a=p.getBoundingClientRect(),c=sel.getBoundingClientRect();return {hid:p.hidden,side:p.dataset.side,cov:!(a.right<=c.left+1||a.left>=c.right-1||a.bottom<=c.top+1||a.top>=c.bottom-1),scope:[...p.querySelectorAll('.pscope')].map(x=>x.textContent+(x.getAttribute('aria-pressed')==='true'?'*':'')),secs:[...p.querySelectorAll('.plab')].map(x=>x.textContent),inView:a.left>=0&&a.right<=innerWidth&&a.top>=0&&a.bottom<=innerHeight};});
 await pg.click('#tPrev .tc[data-r="2"][data-c="3"]');await sl(400);let i=await popInfo();ck('click → ③重點 tab with scope menu in panel, no floating popup '+JSON.stringify(i),!i.hid&&!i.cov&&i.scope.length===3&&await pg.evaluate(()=>document.querySelector('#tPop').hidden&&document.querySelector('.tinsTabs button[data-t="hi"]').getAttribute('aria-pressed')==='true'&&!!document.querySelector('#tIns .tsec.on #tSelPanel')));
 ck('no buttons on the slide canvas / legend',await pg.evaluate(()=>!document.querySelector('#tPrev button,#tLegend .tsugb')));
 for(const sc of ['col','row','cell']){await pg.click(`#tSelPanel button[data-a="scope"][data-v="${sc}"]`);await sl(300);i=await popInfo();ck(`scope ${sc} pressed ${JSON.stringify(i.secs)}`,i.scope.some(x=>x.endsWith('*'))&&!i.cov);await pg.screenshot({path:`${OUT}/tbl-ux-pop-${sc}.png`});}
 await pg.hover('#tSelPanel button[data-a="scope"][data-v="row"]');await sl(200);const nh=await pg.evaluate(()=>document.querySelectorAll('#tPrev .tc.scopehl').length);ck('hover 整列 previews the row ('+nh+' cells)',nh===5);
 await pg.screenshot({path:`${OUT}/tbl-ux-pop-hover.png`});
 await pg.click('#tSelPanel button[data-a="scope"][data-v="col"]');await sl(200);await pg.click('#tSelPanel button[data-a="star"][data-v="warn"]');await sl(500);
 ck('★ action applies to column',await pg.evaluate(()=>JSON.parse(localStorage.getItem('ppt-studio-table')).his.some(h=>h.type==='col'&&h.i===3&&h.kind==='warn')));
 // bottom-right cell: popup flips
 await pg.keyboard.press('Escape');await sl(200);await pg.click('#tPrev .tc[data-r="5"][data-c="4"]');await sl(400);i=await popInfo();ck('bottom-right cell: menu in panel',!i.hid&&!i.cov);
 // first column header via popup
 await pg.keyboard.press('Escape');await sl(200);await pg.click('#tPrev .tc[data-r="2"][data-c="0"]');await sl(300);await pg.click('#tSelPanel button[data-a="scope"][data-v="col"]');await sl(300);
 ck('設為表頭 offered for first column',await pg.evaluate(()=>!!document.querySelector('#tSelPanel button[data-a="hcol"]')));await pg.click('#tSelPanel button[data-a="hcol"]');await sl(500);
 ck('first column header toggle synced',await pg.evaluate(()=>document.querySelector('#tHCol').checked));
 await pg.keyboard.press('Escape');await sl(200);
 for(const t of ['data','look','hi']){await pg.click(`.tinsTabs button[data-t="${t}"]`);await sl(300);await pg.screenshot({path:`${OUT}/tbl-ux-panel-${t}.png`});}
 ck('panel has no duplicate selection controls',await pg.evaluate(()=>!document.querySelector('#tSelPanel button')));
 ck('font default 微軟正黑體',await pg.evaluate(()=>document.querySelector('[data-tp="tbFont"] button[aria-pressed="true"]').dataset.v)==='jh');
 await pg.click('.tinsTabs button[data-t="look"]');await sl(300);ck('儲存格邊界 only once, in ②外觀',await pg.evaluate(()=>document.querySelectorAll('[data-tp="tbPad"]').length===1&&!!document.querySelector('.tsec[data-sec="look"] [data-tp="tbPad"]')));
 for(const v of ['none','l']){await pg.click(`[data-tp="tbPad"] button[data-v="${v}"]`);await sl(500);await pg.screenshot({path:`/tmp/ux/pad-${v}.png`,clip:await pg.evaluate(()=>{const r=document.querySelector('#tPrev').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};})});}
 await pg.click(`[data-tp="tbPad"] button[data-v="m"]`);
 ck('no page errors '+errs.join('|'),!errs.length);
 // mobile
 const m=await b.newPage();await m.setViewport({width:390,height:844,isMobile:true,hasTouch:true});m.on('pageerror',e=>errs.push(e.message));await m.goto(URL,{waitUntil:'networkidle0'});await sl(400);await m.tap('#tabs button[data-tab="table"]');await sl(700);
 await m.evaluate(()=>document.querySelector('#tPrev .tc[data-r="1"][data-c="2"]').scrollIntoView({block:'start'}));await sl(300);console.log(await m.evaluate(()=>{const c=document.querySelector('#tPrev .tc[data-r="1"][data-c="2"]').getBoundingClientRect();const e=document.elementFromPoint(c.x+c.width/2,c.y+c.height/2);let s=[];for(let x=e;x&&s.length<6;x=x.parentElement)s.push(x.tagName+'.'+x.className+'#'+x.id);return s;}));await m.tap('#tPrev .tc[data-r="1"][data-c="2"]');await sl(600);console.log(errs);console.log(await m.evaluate(()=>({h:document.querySelector("#tPop").hidden,sel:!!document.querySelector("#tPrev .tc.sel"),n:document.querySelectorAll("#tPrev .tc").length})));const mi=await m.evaluate(()=>{const p=document.querySelector('#tPop').getBoundingClientRect(),c=document.querySelector('#tPrev .tc.sel').getBoundingClientRect();return {hid:document.querySelector('#tPop').hidden,cov:!(p.right<=c.left+1||p.left>=c.right-1||p.bottom<=c.top+1||p.top>=c.bottom-1),tap:[...document.querySelectorAll('#tPop .prow button')].every(x=>x.getBoundingClientRect().height>=44)};});
 ck('mobile popup sheet, cell visible, targets ≥44 '+JSON.stringify(mi),!mi.hid&&!mi.cov&&mi.tap);await m.screenshot({path:`${OUT}/tbl-ux-mobile.png`});
 console.log(fail?'FAILS '+fail:'ALL OK');await b.close();})();
