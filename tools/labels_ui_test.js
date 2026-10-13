// 用法：python3 -m http.server 8765 & timeout 180 node tools/labels_ui_test.js [URL] [截圖.png]
// 標籤元件（v10）：頁面出現、元件可選取、改字面板換圖示＋改字、下載此元件 .pptx（原生圖形）
const puppeteer=require('puppeteer-core');const sl=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.argv[2]||'http://localhost:8765/studio.html';let fail=0;const ck=(n,c)=>{console.log((c?'OK   ':'FAIL ')+n);if(!c)fail++;};
(async()=>{const b=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});const pg=await b.newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.setViewport({width:1366,height:768});await pg.goto(URL,{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});
 const goL=async()=>{const i=await pg.evaluate(()=>{const t=[...document.querySelectorAll('#thumbs .th')];const i=t.findIndex(x=>/標籤元件/.test(x.innerText));if(i>=0)t[i].click();return i;});await sl(700);return i;};
 const i=await goL();ck('縮圖列有「標籤元件」頁 #'+(i+1),i>=0);
 const pick=gi=>pg.evaluate(gi=>{const h=document.querySelector(`#stage g.el[data-g="${gi}"] .hit`)||document.querySelector(`g.el[data-g="${gi}"] .hit`);h.dispatchEvent(new MouseEvent('click',{bubbles:true}));},gi);
 const info=await pg.evaluate(()=>({n:new Set([...document.querySelectorAll('g.el')].map(g=>g.dataset.g)).size,warns:window.__studio.warns,title:document.querySelector('#sTitle').innerText}));
 ck('標籤元件頁：'+info.n+' 個可選元件、無警告',info.n>=11&&!info.warns&&/標籤元件/.test(info.title));
 await pick(0);await sl(300);await pg.evaluate(()=>document.querySelector('#ebar button[data-a="lbl"]').click());await sl(300);
 const ed=await pg.evaluate(()=>({open:!document.querySelector('#lbEd').hidden,ic:[...document.querySelectorAll('#lbList input[data-k]')].map(x=>x.value),ta:document.querySelectorAll('#lbList textarea').length}));
 if(process.argv[3])await pg.screenshot({path:process.argv[3]});
 ck('改字面板：文字 '+ed.ta+' 段＋圖示欄 '+ed.ic,ed.open&&ed.ta>=1&&ed.ic[0]==='shopping_cart');
 await pg.evaluate(()=>{const q=document.querySelector('#lbList input[data-k]');q.value='star';q.dispatchEvent(new Event('input',{bubbles:true}));const t=document.querySelector('#lbList textarea');t.value='加入收藏';t.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#lbOk').click();});await sl(600);
 const af=await pg.evaluate(()=>({svg:document.querySelector('g.el[data-g="0"]').textContent,ls:Object.values(localStorage).join(''),toast:document.body.innerText}));
 ck('換圖示＋改字生效（預覽文字、已存檔）',/加入收藏/.test(af.svg)&&/"icon":"star"/.test(af.ls));
 await pg.reload({waitUntil:'networkidle0'});await goL();await pick(0);await sl(300);await pg.evaluate(()=>document.querySelector('#ebar button[data-a="lbl"]').click());await sl(300);
 ck('重新整理後仍保留圖示（改字面板顯示 star）',await pg.evaluate(()=>{const q=document.querySelector('#lbList input[data-k]');const v=q&&q.value;document.querySelector('#lbCancel').click();return v==='star';}));
 const k=await pg.evaluate(()=>[...document.querySelectorAll('g.el')].find(g=>g.dataset.name==='直式標籤清單').dataset.g);await pick(k);await sl(300);
 await pg.evaluate(()=>document.querySelector('#ebar button[data-a="pptx"]').click());await sl(2500);
 const le=await pg.evaluate(()=>window.__studio.lastElement);ck('下載此元件 .pptx：'+JSON.stringify(le),le&&le.name==='直式標籤清單'&&le.items===9&&le.size>10000);
 ck('無 JS 錯誤 '+errs.join(';'),!errs.length);
 console.log(fail?'FAILS '+fail:'ALL OK');await b.close();process.exit(fail?1:0);})();
