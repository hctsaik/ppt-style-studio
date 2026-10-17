// 用法：python3 -m http.server 8765 & NODE_PATH=/tmp/pptr/node_modules timeout 180 node tools/feat_ui_test.js [URL] [截圖資料夾]
// v25：①複製到 PPT（SVG／不支援時自動下載 .pptx）②多重篩選＋URL 狀態 ③相關／常一起用 ④框架說明＋備忘稿 ⑤保證可編輯徽章 ⑥項目數 3/4/5/6
const puppeteer=require('puppeteer-core');const sl=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.argv[2]||'http://localhost:8765/studio.html';const SHOT=process.argv[3]||'';let fail=0;const ck=(n,c)=>{console.log((c?'OK   ':'FAIL ')+n);if(!c)fail++;};
(async()=>{const b=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});const pg=await b.newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 const dl='/tmp/feat_dl';require('fs').rmSync(dl,{recursive:true,force:true});require('fs').mkdirSync(dl,{recursive:true});
 const cdp=await pg.target().createCDPSession();await cdp.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:dl});
 await pg.setViewport({width:1440,height:900});await pg.goto(URL,{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());
 const shot=async n=>{if(SHOT)await pg.screenshot({path:SHOT+'/feat-'+n+'.png'});};
 const selG=async(name)=>pg.evaluate(n=>{const sl=window.__studioApi&&document.querySelector('#big');const gs=[...document.querySelectorAll('#big g.el')];const i=gs.findIndex(g=>(g.getAttribute('data-name')||'').indexOf(n)===0);return i;},name);
 // ⑥ 項目數
 await pg.goto(URL.replace(/[?#].*$/,'')+'#/A7/lists',{waitUntil:'networkidle0'});await sl(300);
 const clickGroup=async re=>pg.evaluate(src=>{const r=new RegExp(src);const st=window.__studioApi.S;const gs=document.querySelectorAll('#big g.el');for(const g of gs){g.dispatchEvent(new MouseEvent('click',{bubbles:true}));if(r.test(document.querySelector('#eName').textContent))return document.querySelector('#eName').textContent;}return '';},re);
 let nm=await clickGroup('^編號清單');ck('選取「'+nm+'」顯示項目數 3/4/5/6',/編號清單/.test(nm)&&await pg.evaluate(()=>!document.querySelector('#eCnt').hidden&&document.querySelectorAll('#eCnt button').length===4&&document.querySelector('#eCnt button.on').textContent==='4'));
 await pg.evaluate(()=>document.querySelector('#eCnt [data-a="cn6"]').click());await sl(400);
 nm=await pg.evaluate(()=>document.querySelector('#eName').textContent);ck('改 6 項 → 重新排版並保持選取：'+nm,/6 項/.test(nm)&&await pg.evaluate(()=>window.__studioApi.S.p.nList===6&&document.querySelector('#eCnt button.on').textContent==='6'));
 await shot('6-count');
 await pg.evaluate(()=>document.querySelector('#ebar [data-a="pptx"]').click());await sl(1500);let fs=require('fs').readdirSync(dl);ck('6 項元件可匯出 .pptx：'+fs.join(','),fs.some(f=>/編號清單.*6.*\.pptx$/.test(f)));
 await pg.evaluate(()=>document.querySelector('#pTree a[data-k="steps"]').click());await sl(300);nm=await clickGroup('^大編號步驟');await pg.evaluate(()=>document.querySelector('#eCnt [data-a="cn5"]').click());await sl(300);
 ck('步驟元件 5 項：'+await pg.evaluate(()=>document.querySelector('#eName').textContent),await pg.evaluate(()=>window.__studioApi.S.p.nLin===5&&/5/.test(document.querySelector('#eName').textContent)));
 // ① 主按鈕：⬇ 下載單頁 .pptx（可編輯）；無剪貼簿／SVG 複製路徑
 fs.forEach(f=>require('fs').unlinkSync(dl+'/'+f));
 const pb=await pg.evaluate(()=>{const b=document.querySelector('#ebar button.pri');return{t:b.textContent,a:b.dataset.a,tip:b.title,copy:!!document.querySelector('#ebar [data-a="copy"],#ebar [data-a="cpinfo"]'),dup:document.querySelectorAll('#ebar [data-a="pptx"]').length};});
 ck('主按鈕「'+pb.t+'」＋提示「'+pb.tip+'」、無複製／ⓘ',pb.t==='⬇ 下載單頁 .pptx（可編輯）'&&pb.a==='pptx'&&pb.tip==='開啟後 Ctrl+C → 貼到你的簡報，仍是可編輯圖形'&&!pb.copy&&pb.dup===1);
 await pg.evaluate(()=>document.querySelector('#ebar button.pri').click());await sl(1500);fs=require('fs').readdirSync(dl);
 const le=await pg.evaluate(()=>window.__studio.lastElement);ck('立即下載 1 頁 .pptx（'+fs.join(',')+'，'+(le&&le.items)+' 個原生圖形、套用 5 項）',fs.some(f=>/大編號步驟（5）.*\.pptx$/.test(f))&&le&&le.items>5);
 {const JSZip=require('jszip');const z=await JSZip.loadAsync(require('fs').readFileSync(dl+'/'+fs.find(f=>/\.pptx$/.test(f))));const sls=Object.keys(z.files).filter(f=>/^ppt\/slides\/slide\d+\.xml$/.test(f));const x=await z.file(sls[0]).async('string');
  ck('.pptx 只有 1 頁、原生圖形無圖片（'+sls.length+' 頁）',sls.length===1&&/<p:sp>/.test(x)&&!/<p:pic>/.test(x)&&/>05</.test(x));}
 ck('程式中已無 SVG／PNG 剪貼簿複製',await pg.evaluate(()=>!/複製到 PPT/.test(document.body.innerHTML)));
 await shot('1-download');
 // ⑤ 徽章
 await pg.evaluate(()=>document.querySelector('#edBadge').click());await sl(200);ck('保證可編輯徽章 → 說明（原生圖形、下載單頁、例外，無 SVG）',await pg.evaluate(()=>{const t=document.querySelector('#edPop').innerText;return !document.querySelector('#edPop').hidden&&/原生圖形/.test(t)&&/下載單頁 \.pptx/.test(t)&&/例外/.test(t)&&!/SVG/.test(t);}));
 await shot('5-badge');await pg.mouse.click(700,600);await sl(100);ck('點別處關閉說明',await pg.evaluate(()=>document.querySelector('#edPop').hidden));
 // ③ 相關
 await pg.evaluate(()=>document.querySelector('#pTree a[data-k="kpi"]').click());await sl(300);
 const rel=await pg.evaluate(()=>window.__studio.related);ck('C1 KPI 相關：'+rel.pages.join(',')+'｜食譜：'+rel.recipes.join(','),rel.pages.length>=3&&rel.recipes.length>=1);
 await shot('3-related');
 await pg.evaluate(()=>document.querySelector('#xInfo a[data-rk]').click());await sl(300);ck('點相關頁 → 跳頁',await pg.evaluate(k=>window.__studio.key===k,rel.pages[0]));
 await pg.evaluate(()=>document.querySelector('#pTree a[data-k="kpi"]').click());await sl(200);await pg.evaluate(()=>document.querySelector('#xInfo a[data-ri]').click());await sl(300);ck('點食譜 → 簡報食譜分頁',await pg.evaluate(()=>!document.querySelector('#vGuide').hidden));
 // ④ 框架說明
 await pg.evaluate(()=>document.querySelector('#pTree a[data-k="biz"]').click());await sl(300);
 ck('D9 商業框架：說明面板（什麼時候用／怎麼填／示範文案）',await pg.evaluate(()=>{const p=document.querySelector('#fwPanel');return !p.hidden&&/什麼時候用/.test(p.innerText)&&/怎麼填/.test(p.innerText)&&/示範文案/.test(p.innerText)&&window.__studio.fw.n===4;}));
 await clickGroup('^波特五力');await sl(200);ck('選取波特五力 → 說明面板置頂顯示五力',await pg.evaluate(()=>window.__studio.fw.first==='波特五力'));
 await shot('4-framework');
 await pg.evaluate(()=>document.querySelector('#fwPanel .fwx').click());await sl(200);ck('收起說明 → 按鈕可再開',await pg.evaluate(()=>document.querySelector('#fwPanel').hidden&&!!document.querySelector('#fwBtn')));
 await pg.evaluate(()=>document.querySelector('#fwBtn').click());await sl(200);ck('再開說明',await pg.evaluate(()=>!document.querySelector('#fwPanel').hidden));
 await pg.evaluate(()=>document.querySelector('#pTree a[data-k="kpi"]').click());await sl(200);ck('非框架頁不顯示說明面板',await pg.evaluate(()=>document.querySelector('#fwPanel').hidden&&!document.querySelector('#fwBtn')));
 // ② 多重篩選＋URL
 await pg.evaluate(()=>{document.querySelector('#pFilt [data-k="type"][data-v="B"]').click();document.querySelector('#pFilt [data-k="o"][data-v="h"]').click();});await sl(300);
 let f1=await pg.evaluate(()=>({f:window.__studio.filter,s:location.search,chips:document.querySelectorAll('#pFilt .fact span').length}));ck('篩選 類型 B × 橫式：'+f1.f.n+' 個、URL '+f1.s+'、chips '+f1.chips,f1.f.n>0&&/type=B/.test(f1.s)&&/o=h/.test(f1.s)&&f1.chips===2);
 await pg.evaluate(()=>document.querySelector('#pFilt [data-k="n"][data-v="4"]').click());await sl(300);let f2=await pg.evaluate(()=>window.__studio.filter);ck('再加 項目數 4：'+f2.n+' 個（≤ '+f1.f.n+'）',f2.n>0&&f2.n<=f1.f.n);
 await shot('2-filter');
 const u=await pg.evaluate(()=>location.href);await pg.goto(u,{waitUntil:'networkidle0'});await sl(300);let f3=await pg.evaluate(()=>({f:window.__studio.filter,on:document.querySelectorAll('#pFilt button.on').length}));ck('重新開啟 URL 還原篩選：'+f3.f.n+' 個',f3.f.n===f2.n&&f3.on===3);
 await pg.evaluate(()=>document.querySelector('#fRes a[data-i]').click());await sl(400);ck('點結果 → 跳頁並選取元件',await pg.evaluate(()=>!!document.querySelector('#ebar.on')));
 await pg.evaluate(()=>{document.querySelector('#pFilt [data-k="c"][data-v="pa"]').click();});await sl(200);
 await pg.evaluate(()=>document.querySelector('#pFilt [data-clr]').click());await sl(200);ck('全部清除 → URL 無篩選',await pg.evaluate(()=>!/type=|o=|n=|c=/.test(location.search)&&document.querySelector('#fRes').hidden));
 ck('無 JS 錯誤 '+errs.join(';'),!errs.length);
 await b.close();console.log(fail?'FAILS '+fail:'ALL OK');process.exit(fail?1:0);})();
