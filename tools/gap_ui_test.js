// 用法：python3 -m http.server 8765 & timeout 180 node tools/gap_ui_test.js [URL] [截圖.png]
// v12 缺漏元件：4 頁出現（19–22，範例頁 23–25 前）、無警告、改字改數值 → Δ／進度條重算、重新整理保留、下載此元件 .pptx、標註頁有 SwiffChart 連結
const puppeteer=require('puppeteer-core');const sl=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.argv[2]||'http://localhost:8765/studio.html';let fail=0;const ck=(n,c)=>{console.log((c?'OK   ':'FAIL ')+n);if(!c)fail++;};
(async()=>{const b=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});const pg=await b.newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.setViewport({width:1366,height:768});await pg.goto(URL,{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});
 const go=async re=>{const i=await pg.evaluate(re=>{const t=[...document.querySelectorAll('#thumbs .th')];const i=t.findIndex(x=>new RegExp(re).test(x.innerText));if(i>=0)t[i].click();return i;},re);await sl(700);return i;};
 const ng=()=>pg.evaluate(()=>new Set([...document.querySelectorAll('g.el')].map(g=>g.dataset.g)).size);
 const gIdx=name=>pg.evaluate(n=>{const g=[...document.querySelectorAll('g.el')].find(g=>g.dataset.name===n);return g?+g.dataset.g:-1;},name);
 const pick=gi=>pg.evaluate(gi=>{document.querySelector(`g.el[data-g="${gi}"] .hit`).dispatchEvent(new MouseEvent('click',{bubbles:true}));},gi);
 for(const [re,n,no] of [['KPI 卡與評比',9,19],['時間軸與甘特',4,20],['矩陣與議程',6,21],['註腳與強調',8,22]]){const i=await go(re);const k=await ng();const w=await pg.evaluate(()=>window.__studio.warns);ck(re+' #'+(i+1)+'：'+k+' 個元件、無警告',i+1===no&&k>=n&&!w);}
 await go('KPI 卡與評比');let gi=await gIdx('KPI 數值＋目標＋Δ');await pick(gi);await sl(300);await pg.evaluate(()=>document.querySelector('#ebar button[data-a="lbl"]').click());await sl(300);
 const ed=await pg.evaluate(()=>[...document.querySelectorAll('#lbList textarea')].map(t=>t.value));ck('改字面板：'+ed.join('｜'),ed.includes('96.8 %')&&ed.includes('95.0 %')&&ed.includes('▲ +2%')&&ed.includes('W42 · 2026'));
 await pg.evaluate(()=>{const t=[...document.querySelectorAll('#lbList textarea')].find(t=>t.value==='96.8 %');t.value='90.0 %';t.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#lbOk').click();});await sl(700);
 const t0=await pg.evaluate(gi=>document.querySelector(`g.el[data-g="${gi}"]`).textContent,gi);ck('改 96.8→90.0：Δ 自動 ▼ −5%',/90\.0/.test(t0)&&/▼ −5%/.test(t0));
 gi=await gIdx('進度條（細）');await pick(gi);await sl(300);await pg.evaluate(()=>document.querySelector('#ebar button[data-a="lbl"]').click());await sl(300);
 await pg.evaluate(()=>{const t=[...document.querySelectorAll('#lbList textarea')].find(t=>t.value==='65%');t.value='20%';t.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#lbOk').click();});await sl(700);
 if(process.argv[3])await pg.screenshot({path:process.argv[3]});
 await pg.reload({waitUntil:'networkidle0'});await go('KPI 卡與評比');gi=await gIdx('KPI 數值＋目標＋Δ');ck('重新整理後仍保留 ▼ −5%',/▼ −5%/.test(await pg.evaluate(gi=>document.querySelector(`g.el[data-g="${gi}"]`).textContent,gi)));
 await pick(gi);await sl(300);await pg.evaluate(()=>document.querySelector('#ebar button[data-a="pptx"]').click());await sl(2500);
 const le=await pg.evaluate(()=>window.__studio.lastElement);ck('下載此元件 .pptx：'+JSON.stringify(le),le&&/KPI/.test(le.name)&&le.size>10000);
 await go('註腳與強調');ck('螢光底在預覽有底色矩形',await pg.evaluate(()=>[...document.querySelectorAll('g.el')].some(g=>g.dataset.name==='螢光底強調'&&g.querySelectorAll('rect:not(.hit)').length>=2)&&[...document.querySelectorAll('g.el')].some(g=>g.dataset.name==='半高螢光筆'&&g.querySelector('rect.mk'))));
 gi=await gIdx('底線強調');await pick(gi);await sl(300);await pg.evaluate(()=>document.querySelector('#ebar button[data-a="lbl"]').click());await sl(300);
 const nm=await pg.evaluate(()=>document.querySelectorAll('#lbList input[data-m]').length);ck('改字面板：強調句有「半高螢光筆」勾選（'+nm+'）',nm>=2);
 await pg.evaluate(()=>{document.querySelector('#lbList input[data-m]').checked=true;document.querySelector('#lbOk').click();});await sl(700);
 ck('勾選後預覽出現半高色帶',await pg.evaluate(gi=>!!document.querySelector(`g.el[data-g="${gi}"] rect.mk`),gi));
 gi=await gIdx('前後值（刪除線）');await pick(gi);await sl(300);await pg.evaluate(()=>document.querySelector('#ebar button[data-a="lbl"]').click());await sl(300);
 await pg.evaluate(()=>{const t=[...document.querySelectorAll('#lbList textarea')].find(t=>t.value==='1.2%');t.value='2.5%';document.querySelector('#lbOk').click();});await sl(700);
 ck('前後值改 1.2→2.5%：徽章自動 ↓50%',/↓50%/.test(await pg.evaluate(gi=>document.querySelector(`g.el[data-g="${gi}"]`).textContent,gi)));
 await go('06　標註$');ck('標註頁標題列有 SwiffChart 連結',await pg.evaluate(()=>!!document.querySelector('#sTitle a.chartln[href*="swiffchart-web-preview"]')));
 ck('無 JS 錯誤 '+errs.join(';'),!errs.length);
 console.log(fail?'FAILS '+fail:'ALL OK');await b.close();process.exit(fail?1:0);})();
