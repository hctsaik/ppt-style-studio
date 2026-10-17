// 用法：python3 -m http.server 8765 & timeout 180 node tools/compare_ui_test.js [URL] [截圖.png]
// 對比式排版（v11）：兩頁出現、元件可選取、改字面板改數字 → 倍數徽章自動重算、重新整理保留、下載此元件 .pptx
const puppeteer=require('puppeteer-core');const sl=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.argv[2]||'http://localhost:8765/studio.html';let fail=0;const ck=(n,c)=>{console.log((c?'OK   ':'FAIL ')+n);if(!c)fail++;};
(async()=>{const b=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});const pg=await b.newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.setViewport({width:1366,height:768});await pg.goto(URL,{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});
 const go=async re=>{const i=await pg.evaluate(re=>{const t=[...window.Deck.SLIDES.map((s,i)=>({innerText:String(i+1).padStart(2,'0')+'　'+s[1],click:()=>{const a=document.querySelector(`#pTree a[data-k="${s[0]}"]`);a.click();}}))];const i=t.findIndex(x=>new RegExp(re).test(x.innerText));if(i>=0)t[i].click();return i;},re);await sl(700);return i;};
 const pick=gi=>pg.evaluate(gi=>{document.querySelector(`g.el[data-g="${gi}"] .hit`).dispatchEvent(new MouseEvent('click',{bubbles:true}));},gi);
 const i2=await go('前後對比 · 版型零件');const n2=await pg.evaluate(()=>new Set([...document.querySelectorAll('g.el')].map(g=>g.dataset.g)).size);ck('第二頁 #'+(i2+1)+'：'+n2+' 個元件',i2>=0&&n2>=6);
 const i=await go('前後對比 · 數字$');const info=await pg.evaluate(()=>({n:new Set([...document.querySelectorAll('g.el')].map(g=>g.dataset.g)).size,warns:window.__studio.warns,title:document.querySelector('#sTitle').innerText}));
 ck('縮圖列有「對比式排版」頁 #'+(i+1)+'：'+info.n+' 個元件、無警告',i>=0&&info.n>=5&&!info.warns);
 await pick(0);await sl(300);await pg.evaluate(()=>document.querySelector('#ebar button[data-a="lbl"]').click());await sl(300);
 const ed=await pg.evaluate(()=>[...document.querySelectorAll('#lbList textarea')].map(t=>t.value));
 ck('改字面板列出數字欄：'+ed.join('｜'),ed.includes('4000 元')&&ed.includes('×2'));
 await pg.evaluate(()=>{const t=[...document.querySelectorAll('#lbList textarea')].find(t=>t.value==='4000 元');t.value='8000 元';t.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#lbOk').click();});await sl(700);
 if(process.argv[3])await pg.screenshot({path:process.argv[3]});
 const t0=await pg.evaluate(()=>document.querySelector('g.el[data-g="0"]').textContent);ck('改 4000→8000：徽章自動變 ×4',/8000/.test(t0)&&/×4/.test(t0));
 await pg.reload({waitUntil:'networkidle0'});await go('前後對比 · 數字$');ck('重新整理後仍保留 ×4',/×4/.test(await pg.evaluate(()=>document.querySelector('g.el[data-g="0"]').textContent)));
 await pick(0);await sl(300);await pg.evaluate(()=>document.querySelector('#ebar button[data-a="pptx"]').click());await sl(2500);
 const le=await pg.evaluate(()=>window.__studio.lastElement);ck('下載此元件 .pptx：'+JSON.stringify(le),le&&/橫向對比/.test(le.name)&&le.size>10000);
 ck('無 JS 錯誤 '+errs.join(';'),!errs.length);
 console.log(fail?'FAILS '+fail:'ALL OK');await b.close();process.exit(fail?1:0);})();
