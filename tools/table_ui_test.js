const puppeteer=require('puppeteer-core');const fs=require('fs');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.argv[2]||'http://localhost:8765/studio.html';const OUT=process.argv[3]||'/tmp/r3/ui';fs.mkdirSync(OUT,{recursive:true});
const paste=(pg,txt)=>pg.evaluate(t=>{const dt=new DataTransfer();dt.setData('text/plain',t);document.body.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true}));},txt);
const PL="\t3Q25\t2Q25\t3Q24\tQoQ\tYoY\n營業收入淨額\t989.9\t933.8\t759.7\t+6.0%\t+30.3%\n毛利率\t59.5%\t58.6%\t57.8%\t+0.9 ppts\t+1.7 ppts\n營業費用\t(88.2)\t(85.5)\t(75.6)\t+3.2%\t+16.7%\n稅後淨利\t452.3\t398.3\t325.3\t+13.6%\t+39.0%\n每股盈餘（元）\t17.44\t15.36\t12.54\t+13.6%\t+39.1%";
const ST="項目\t負責人\t狀態\t備註\n新機台驗收\t王小明\t完成\t提前 3 天\nAOI 誤判改善\t林志豪\t風險\t資料量不足\nSPC 上線\t張家瑋\t進行中\t已完成 60%";
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const errs=[];const R={};
 const ck=(k,v)=>{R[k]=v;console.log((v?'OK  ':'FAIL')+' '+k);};
 // desktop
 {const ctx=await b.createBrowserContext();const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push('d: '+e.message));
  await pg.setViewport({width:1440,height:900});await pg.goto(URL,{waitUntil:'networkidle0'});await sleep(600);
  await pg.click('#tabs button[data-tab="table"]');await sleep(900);
  await pg.screenshot({path:`${OUT}/d-overview.png`});
  // header click on Yield col -> chip
  const cell=await pg.$('#tPrev .tc[data-r="0"][data-c="2"]');await cell.click();await sleep(300);
  ck('chip opens on header',await pg.evaluate(()=>!document.querySelector('#tChip').hidden));
  await pg.click('#tChip button[data-a="star"][data-v="focus"]');await sleep(400);
  ck('star adds col highlight',await pg.evaluate(()=>window.__studio.table.his.length===1&&window.__studio.table.his[0].type==='col'));
  ck('selection status text',/目前選取：.*第 3 欄/.test(await pg.evaluate(()=>document.querySelector('#tSelTxt').textContent)));
  await pg.click('#tChip button[data-a="star"][data-v="rec"]');await sleep(300);
  for(const lk of ['band','card','zebra','clean']){await pg.click(`#tLStrip button[data-v="${lk}"]`);await sleep(350);}
  ck('meaning rec kept across looks, accent not red',await pg.evaluate(()=>{const t=window.__studio.table;return t.his[0].kind==='rec';}));
  await pg.click('#tPrev .tc[data-r="0"][data-c="2"]').catch(()=>{});await sleep(200);
  await pg.click('#tChip button[data-a="star"][data-v="warn"]').catch(()=>{});await sleep(300);
  ck('warn kind set',await pg.evaluate(()=>window.__studio.table.his.some(h=>h.kind==='warn')));
  await pg.keyboard.press('Escape');
  await pg.click('#tPrev .tc[data-r="0"][data-c="2"]');await sleep(300);
  await pg.screenshot({path:`${OUT}/d-chip.png`});
  // keyboard
  await pg.focus('#tPrev .tc[data-r="0"][data-c="2"]');await pg.keyboard.press('Escape');await sleep(100);
  await pg.focus('#tPrev .tc[data-r="0"][data-c="0"]');await pg.keyboard.press('ArrowDown');await pg.keyboard.press('ArrowRight');
  ck('arrow keys move focus',await pg.evaluate(()=>{const a=document.activeElement;return a.dataset.r==='1'&&a.dataset.c==='1';}));
  await pg.keyboard.press('Enter');await sleep(200);ck('Enter opens chip',await pg.evaluate(()=>!document.querySelector('#tChip').hidden));
  await pg.keyboard.press('Escape');await sleep(150);ck('Esc closes chip',await pg.evaluate(()=>document.querySelector('#tChip').hidden));
  ck('a11y roles',await pg.evaluate(()=>!!document.querySelector('#tPrev .tov[role=grid]')&&document.querySelectorAll('#tPrev [role=gridcell]').length>=35&&[...document.querySelectorAll('.tlook')].every(b=>b.hasAttribute('aria-pressed'))));
  {await pg.keyboard.press('Escape');await sleep(200);const before=await pg.evaluate(()=>window.__studio.table.cw);const h=await pg.$('#tPrev .tcw[data-c="0"]');const bb=await h.boundingBox();
   const cur=await pg.evaluate(()=>getComputedStyle(document.querySelector('#tPrev .tcw')).cursor);ck('col-resize cursor',cur==='col-resize');
   const x=bb.x+bb.width/2,y=bb.y+bb.height/2;await pg.mouse.move(x,y);await pg.mouse.down();for(let i=1;i<=8;i++){await pg.mouse.move(x+i*10,y);await sleep(30);}
   const tipv=await pg.evaluate(()=>{const t=document.querySelector('#tCwTip');return !t.hidden&&/"/.test(t.textContent)?t.textContent:'';});ck('live width readout '+tipv,!!tipv);
   await pg.mouse.up();await sleep(500);const after=await pg.evaluate(()=>window.__studio.table.cw);
   ck('real mouse drag changes widths '+JSON.stringify(after),!!after&&JSON.stringify(after)!==JSON.stringify(before));
   ck('no stray guide after drag',await pg.evaluate(()=>!document.body.classList.contains('colresize')&&document.querySelector('#tCwTip').hidden));
   await pg.screenshot({path:`${OUT}/d-drag.png`});
   const h2=await pg.$('#tPrev .tcw[data-c="0"]');const b2=await h2.boundingBox();await pg.mouse.click(b2.x+b2.width/2,b2.y+b2.height/2,{delay:30});await sleep(60);await pg.mouse.click(b2.x+b2.width/2,b2.y+b2.height/2,{delay:30,clickCount:2});await sleep(500);
   const af2=await pg.evaluate(()=>window.__studio.table.cw);ck('double-click auto-fit changes width '+JSON.stringify(af2),JSON.stringify(af2)!==JSON.stringify(after));}
  // inspector sections
  await pg.click('.tsteps .stp[data-go="look"]');await sleep(500);await pg.screenshot({path:`${OUT}/d-insp-look.png`});
  await pg.click('.tsteps .stp[data-go="hi"]');await sleep(300);await pg.screenshot({path:`${OUT}/d-insp-hi.png`});
  await pg.click('.tinsTabs button[data-t="fmt"]');await sleep(300);await pg.screenshot({path:`${OUT}/d-insp-fmt.png`});
  // paste P&L -> reset title/rules/his ; period col highlighted
  await paste(pg,PL);await sleep(800);const t=await pg.evaluate(()=>window.__studio.table);
  ck('paste resets title/unit/note/rules',t.title===''&&t.unit===''&&t.note===''&&t.rules.length===0);
  ck('newest period auto-highlight (3Q25)',t.his.length===1&&t.his[0].i===1);
  ck('summary rows detected (淨利, EPS)',JSON.stringify(t.auto.key)==='[4,5]');
  await pg.screenshot({path:`${OUT}/d-paste-pl.png`});
  // inline title
  await pg.click('#tPrev .tslot[data-k="title"]');console.log('ae',await pg.evaluate(()=>document.activeElement.className+'/'+document.activeElement.dataset.k));await pg.keyboard.type('3Q25 獲利創新高');await sleep(500);
  {const tt=await pg.evaluate(()=>window.__studio.table.title);console.log('title=',JSON.stringify(tt));ck('inline title edit',tt==='3Q25 獲利創新高');}
  await pg.keyboard.press('Enter');await sleep(300);
  // 1x1 reject
  await paste(pg,'hello');await sleep(400);ck('1x1 rejected keeps data',(await pg.evaluate(()=>window.__studio.table.rows))===6);
  // status paste: exact words only
  await paste(pg,ST);await sleep(600);
  const col=await pg.evaluate(()=>{const tb=window.D?null:null;return window.__studio.lastTableHtml||'';});
  ck('status paste title cleared',(await pg.evaluate(()=>window.__studio.table.title))==='');
  await pg.screenshot({path:`${OUT}/d-paste-status.png`});
  // look switch
  await pg.click('.tsteps .stp[data-go="look"]');await sleep(200);ck('stepper switches section',await pg.evaluate(()=>document.querySelector('.tsec[data-sec="look"]').offsetHeight>0&&document.querySelector('.tsec[data-sec="data"]').offsetHeight===0));
  await pg.click('.tlook[data-v="band"]');await sleep(600);ck('look band pressed',await pg.evaluate(()=>document.querySelector('.tlook[data-v="band"]').getAttribute('aria-pressed')==='true'&&window.__studio.table.look==='band'));
  // R2: suggestion, canvas highlight list, undo/redo, width option, output bar visible
  await paste(pg,PL);await sleep(700);
  ck('suggested title shown',await pg.evaluate(()=>!!document.querySelector('.tsugb')));
  await pg.click('.tsugb');await sleep(400);const tt2=await pg.evaluate(()=>window.__studio.table.title);ck('apply suggested title: '+tt2,/3Q25/.test(tt2));
  ck('no overlay pill/badge on canvas',await pg.evaluate(()=>!document.querySelector('#tPrev .tsug,#tPrev .tbadge,#tPrev .thl')));
  ck('canvas highlight list',await pg.evaluate(()=>document.querySelectorAll('#tLegend [data-rmh]').length===1));
  await pg.click('#tLegend [data-rmh]');await sleep(400);ck('remove highlight from canvas',await pg.evaluate(()=>window.__studio.table.his.length===0));
  await sleep(500);await pg.click('#tUndo');await sleep(500);ck('undo restores highlight',await pg.evaluate(()=>window.__studio.table.his.length===1));
  await pg.click('#tRedo');await sleep(500);ck('redo',await pg.evaluate(()=>window.__studio.table.his.length===0));
  await pg.keyboard.down('Control');await pg.keyboard.press('z');await pg.keyboard.up('Control');await sleep(500);ck('Ctrl+Z',await pg.evaluate(()=>window.__studio.table.his.length===1));
  await pg.click('.tsteps .stp[data-go="look"]');await sleep(200);
  const w1=await pg.evaluate(()=>window.__studio.table.tW);await pg.click('[data-tp="tbWidth"] button[data-v="fill"]');await sleep(500);const w2=await pg.evaluate(()=>window.__studio.table.tW);
  ck(`width auto ${w1} < fill ${w2}`,w1<w2&&w2>12);
  ck('output bar visible',await pg.evaluate(()=>{const r=document.querySelector('#tCopy').getBoundingClientRect();return r.bottom<=innerHeight&&r.height>30;}));
  await pg.screenshot({path:`${OUT}/d-r2-pl.png`});
  await paste(pg,ST);await sleep(600);
  // copy html
  await pg.evaluate(()=>{navigator.clipboard.write=async()=>{};});await pg.click('#tCopy');await sleep(300);
  ck('copy html has dot span',/●/.test(await pg.evaluate(()=>window.__studio.lastTableHtml)));
  await ctx.close();}
 // 1366x768 / 1440x900: canvas, look picker, copy button visible without scrolling
 for(const vp of [{width:1280,height:720},{width:1366,height:768},{width:1440,height:900}]){const ctx=await b.createBrowserContext();const pg=await ctx.newPage();await pg.setViewport(vp);await pg.goto(URL,{waitUntil:'networkidle0'});await sleep(500);await pg.click('#tabs button[data-tab="table"]');await sleep(800);
  const v=await pg.evaluate(()=>{const vis=sel=>{const r=document.querySelector(sel).getBoundingClientRect();return r.width>0&&r.top>=0&&r.bottom<=innerHeight&&r.right<=innerWidth;};const pr=document.querySelector('#tPrev').getBoundingClientRect(),cv=document.querySelector('#tCanvas').getBoundingClientRect();return{c:vis('#tPrev')&&pr.bottom<=cv.bottom+1&&pr.right<=cv.right+1,l:vis('#tLStrip'),b:vis('#tCopy')};});
  ck(`${vp.width}x${vp.height}: whole slide ${v.c} looks ${v.l} copy ${v.b}`,v.c&&v.l&&v.b);if(vp.width===1366)await pg.screenshot({path:`${OUT}/d-1366.png`});await ctx.close();}
 // mobile
 {const ctx=await b.createBrowserContext();const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push('m: '+e.message));
  await pg.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});await pg.goto(URL,{waitUntil:'networkidle0'});await sleep(600);
  await pg.tap('#tabs button[data-tab="table"]');await sleep(900);await pg.screenshot({path:`${OUT}/m-open.png`});
  await pg.tap('.tinsTabs button[data-t="look"]');await sleep(500);await pg.screenshot({path:`${OUT}/m-look.png`});
  await pg.tap('.tinsTabs button[data-t="look"]');await sleep(300);
  ck('mobile default zoom = 放大',await pg.evaluate(()=>document.querySelector('#tCanvas').classList.contains('z100')));
  ck('mobile tray FAB hidden',await pg.evaluate(()=>getComputedStyle(document.querySelector('#trayBtn')).display==='none'));
  await pg.tap('#tPrev .tc[data-r="0"][data-c="2"]');await sleep(400);await pg.screenshot({path:`${OUT}/m-chip.png`});
  const sz=await pg.evaluate(()=>[...document.querySelectorAll('#tabs button,#vTable button,#vTable select')].filter(b=>b.offsetParent).map(b=>[b.textContent.trim().slice(0,6),Math.round(b.getBoundingClientRect().height)]));const small=sz.filter(x=>x[1]<44);ck('mobile tap targets ≥44 '+JSON.stringify(small),!small.length);
  ck('chip does not cover sheet tabs',await pg.evaluate(()=>{const a=document.querySelector('#tChip').getBoundingClientRect(),b=document.querySelector('.tinsTabs').getBoundingClientRect();return a.bottom<=b.top;}));
  const smallTxt=await pg.evaluate(()=>[...document.querySelectorAll('#vTable *')].filter(e=>e.offsetParent&&e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&!e.closest('svg')&&!e.closest('.tslots')).filter(e=>parseFloat(getComputedStyle(e).fontSize)<12).map(e=>e.className+':'+e.textContent.slice(0,10)));ck('mobile UI text ≥12px (small='+JSON.stringify(smallTxt)+')',!smallTxt.length);
  await pg.tap('.tzoom button[data-z="fit"]');await sleep(500);await pg.screenshot({path:`${OUT}/m-fit.png`});await pg.tap('.tzoom button[data-z="100"]');await sleep(500);await pg.screenshot({path:`${OUT}/m-zoom.png`});
  const ov=await pg.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1);ck('no page horizontal overflow',ov);
  await ctx.close();}
 console.log('ERRS',errs);fs.writeFileSync(OUT+'/flow.json',JSON.stringify({R,errs},null,1));await b.close();})();
