// ① 資料：貼上照原樣、欄樣式預設沿用但新資料清除舊標題、↶ 還原上一份、核取方塊與狀態一致
const puppeteer=require('puppeteer-core');const sl=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.argv[2]||'http://localhost:8765/studio.html';let fail=0;const ck=(n,c)=>{console.log((c?'OK   ':'FAIL ')+n);if(!c)fail++;};
const paste=(pg,txt)=>pg.evaluate(t=>{const dt=new DataTransfer();dt.setData('text/plain',t);document.body.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true}));},txt);
(async()=>{const b=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});const pg=await b.newPage();
 await pg.setViewport({width:1366,height:768});await pg.goto(URL,{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});
 await pg.click('#tabs button[data-tab="table"]');await sl(700);
 await pg.evaluate(()=>{window.confirm=()=>true;document.querySelector('#tClear').click();});await sl(400);
 const st=()=>pg.evaluate(()=>({rows:window.__studio.table.rows,title:window.__studio.table.title,drop:getComputedStyle(document.querySelector('#tDrop')).display,keep:document.querySelector('#tKeep').checked,
  hrow:document.querySelector('#tHRow').checked,last:document.querySelector('#tLast').checked,auto:document.querySelector('#tAuto').innerText,undo:!document.querySelector('#tUndoPaste').hidden,
  old:!!document.querySelector('#tPasteBtn,#tPasteTop,#tPinC'),scroll:document.documentElement.scrollHeight>innerHeight+1}));
 let s=await st();ck('空狀態顯示貼上區、沿用預設開、舊按鈕已移除 '+JSON.stringify({d:s.drop,k:s.keep,o:s.old}),s.drop==='block'&&s.keep&&!s.old);
 const T1="2026 Q3 各廠良率\t\t\t\n單位：%\t\t\t\n廠區\t7月\t8月\t9月\nF12\t95.2\t96.1\t96.8\n合計\t93.1\t94.2\t95.0";
 await pg.select('#tSample','yield');await sl(600);const t0=(await st()).title;
 await paste(pg,T1);await sl(700);s=await st();ck('沿用欄樣式（預設）：新貼上清除舊標題 '+t0,!!t0&&s.title==='');
 ck('貼上照原樣（5 列，標題列仍在第 1 列） '+s.rows,s.rows===5&&s.drop==='none');
 ck('合計自動偵測 → 核取方塊勾起 '+s.last,s.last);
 ck('表頭核取方塊與狀態一致 '+s.hrow+' / '+s.auto,s.hrow===/第 1 列＝表頭/.test(s.auto));
 await pg.evaluate(()=>{const c=document.querySelector('#tLast');c.click();});await sl(500);s=await st();ck('取消合計 → 狀態不再顯示合計',!s.last&&!/列合計/.test(s.auto));
 await paste(pg,"F12\t95.2\t96.1\nF14\t91.0\t92.4\nF15\t88.0\t90.1");await sl(700);s=await st();
 ck('再貼一次不帶入舊標題',s.title==='');
 ck('無表頭資料：核取方塊未勾、狀態寫無表頭 '+s.hrow+' / '+s.auto,!s.hrow&&/無表頭/.test(s.auto));
 ck('有「↶ 還原上一份」',s.undo);ck('1366×768 不捲動',!s.scroll);
 await pg.click('#tUndoPaste');await sl(600);s=await st();ck('還原上一份 → 回到 5 列 '+s.rows,s.rows===5&&!s.undo);
 console.log(fail?'FAILS '+fail:'ALL OK');await b.close();process.exit(fail?1:0);})();
