const puppeteer=require('puppeteer-core');const fs=require('fs');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.argv[2]||'http://localhost:8765/studio.html';const OUT=process.argv[3]||'/tmp/r1/ui';fs.mkdirSync(OUT,{recursive:true});
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
  await pg.click('#tChip button[data-a="star"]');await sleep(400);
  ck('star adds col highlight',await pg.evaluate(()=>window.__studio.table.his.length===1&&window.__studio.table.his[0].type==='col'));
  await pg.screenshot({path:`${OUT}/d-chip.png`});
  // keyboard
  await pg.focus('#tPrev .tc[data-r="0"][data-c="2"]');await pg.keyboard.press('Escape');await sleep(100);
  await pg.focus('#tPrev .tc[data-r="0"][data-c="0"]');await pg.keyboard.press('ArrowDown');await pg.keyboard.press('ArrowRight');
  ck('arrow keys move focus',await pg.evaluate(()=>{const a=document.activeElement;return a.dataset.r==='1'&&a.dataset.c==='1';}));
  await pg.keyboard.press('Enter');await sleep(200);ck('Enter opens chip',await pg.evaluate(()=>!document.querySelector('#tChip').hidden));
  await pg.keyboard.press('Escape');await sleep(150);ck('Esc closes chip',await pg.evaluate(()=>document.querySelector('#tChip').hidden));
  ck('a11y roles',await pg.evaluate(()=>!!document.querySelector('#tPrev .tov[role=grid]')&&document.querySelectorAll('#tPrev [role=gridcell]').length>=35&&[...document.querySelectorAll('.tlook')].every(b=>b.hasAttribute('aria-pressed'))));
  // inspector sections
  await pg.evaluate(()=>document.querySelector('.tsec[data-sec="look"]').scrollIntoView());await sleep(500);await pg.screenshot({path:`${OUT}/d-insp-look.png`});
  await pg.evaluate(()=>document.querySelector('.tsec[data-sec="hi"]').scrollIntoView());await sleep(300);await pg.screenshot({path:`${OUT}/d-insp-hi.png`});
  await pg.evaluate(()=>document.querySelector('.tsec[data-sec="fmt"]').scrollIntoView());await sleep(300);await pg.screenshot({path:`${OUT}/d-insp-fmt.png`});
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
  await pg.click('.tlook[data-v="band"]');await sleep(600);ck('look band pressed',await pg.evaluate(()=>document.querySelector('.tlook[data-v="band"]').getAttribute('aria-pressed')==='true'&&window.__studio.table.look==='band'));
  // copy html
  await pg.evaluate(()=>{navigator.clipboard.write=async()=>{};});await pg.click('#tCopy');await sleep(300);
  ck('copy html has dot span',/●/.test(await pg.evaluate(()=>window.__studio.lastTableHtml)));
  await ctx.close();}
 // mobile
 {const ctx=await b.createBrowserContext();const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push('m: '+e.message));
  await pg.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});await pg.goto(URL,{waitUntil:'networkidle0'});await sleep(600);
  await pg.tap('#tabs button[data-tab="table"]');await sleep(900);await pg.screenshot({path:`${OUT}/m-open.png`});
  await pg.tap('.tinsTabs button[data-t="look"]');await sleep(500);await pg.screenshot({path:`${OUT}/m-look.png`});
  await pg.tap('.tinsTabs button[data-t="look"]');await sleep(300);
  await pg.tap('#tPrev .tc[data-r="0"][data-c="2"]');await sleep(400);await pg.screenshot({path:`${OUT}/m-chip.png`});
  const sz=await pg.evaluate(()=>[...document.querySelectorAll('#tChip button')].map(b=>b.getBoundingClientRect().height));ck('mobile chip tap targets ≥44',sz.every(h=>h>=43.5));
  await pg.tap('.tzoom button[data-z="100"]');await sleep(500);await pg.screenshot({path:`${OUT}/m-zoom.png`});
  const ov=await pg.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1);ck('no page horizontal overflow',ov);
  await ctx.close();}
 console.log('ERRS',errs);fs.writeFileSync(OUT+'/flow.json',JSON.stringify({R,errs},null,1));await b.close();})();
