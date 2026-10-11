const P=require('puppeteer-core');const URL=process.env.U||'file:///workspace/ppt-style-studio/studio.html';const sl=ms=>new Promise(r=>setTimeout(r,ms));
let fail=0;const OUT='/workspace/ppt-style-studio/render';
const geo=pg=>pg.evaluate(()=>{const R=s=>{const e=document.querySelector(s);if(!e||!e.offsetParent)return null;const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(Math.round);};
 const p=document.querySelector('#tPrev');return {ch:document.querySelector('#tCanvas').style.height,used:0,kids:[...document.querySelector('#tCanvas').children].map(x=>(x.id||x.className).slice(0,12)+':'+Math.round(x.getBoundingClientRect().height)).join(','),canvas:R('#tCanvas'),prev:R('#tPrev'),ins:R('#tIns'),dock:R('#tDock'),stage:R('.tstagew'),tf:p&&getComputedStyle(p).transform,sy:Math.round(scrollY)};});
const diff=(a,b)=>Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])&&!(Array.isArray(a[k])&&b[k]&&a[k].every((v,i)=>Math.abs(v-b[k][i])<=1)));
(async()=>{const b=await P.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const M=JSON.parse(process.env.M||'null')||[[1366,768,0],[1440,900,0],[1920,1080,0],[390,844,1]].flatMap(([w,h,m])=>['','paste'].flatMap(s=>['star:focus','star:rec','star:warn',''].flatMap(f=>['fill','box','bold'].map(hs=>[w,h,m,s,f,hs])))).filter((x,i)=>process.env.FULL||i%5===0||(x[1]===900&&!x[3]&&!x[4]&&x[5]==='fill'));for(const [w,h,mob,samp,first,hs] of M){
  const pg=await b.newPage();await pg.setViewport({width:w,height:h,isMobile:!!mob,hasTouch:!!mob});await pg.goto(URL,{waitUntil:'networkidle0'});await sl(300);
  await pg.evaluate(()=>{localStorage.clear();});await pg.reload({waitUntil:'networkidle0'});await sl(300);
  await pg.evaluate(()=>document.querySelector('#tabs button[data-tab="table"]').click());await sl(600);
  if(samp)await pg.evaluate(()=>{const dt=new DataTransfer();dt.setData('text/plain','Lot\tYield%\tDefect\tStatus\nA1\t95.2%\t12\tPass\nA2\t88.1%\t31\tHold\nA3\t86.4%\t40\tScrap');document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true}));});
  await sl(900);
  const cell=await pg.evaluate(()=>{const c=document.querySelector('#tPrev .tc[data-r="2"][data-c="1"]');c.scrollIntoView({block:matchMedia('(max-width:900px)').matches?'start':'nearest'});return 1;});await sl(300);
  const clk=async s=>{if(mob)await pg.tap(s);else await pg.click(s);await sl(500);};
  await clk('#tPrev .tc[data-r="2"][data-c="1"]');await clk((mob?'#tPop':'#tSelPanel')+' button[data-a="scope"][data-v="col"]');
  const g0=await geo(pg);if(w===1440&&!samp&&!first&&hs==='fill')await pg.screenshot({path:OUT+'/tbl-jump-before.png'});
  const acts=[];if(first){const [a,v]=first.split(':');acts.push((mob?'#tPop':'#tSelPanel')+` button[data-a="${a}"][data-v="${v}"]`);}acts.push((mob?'#tPop':'#tSelPanel')+` button[data-a="hs"][data-v="${hs}"]`);
  for(const s of acts){if(!await pg.$(s))continue;await clk(s);await sl(700);const g1=await geo(pg);const d=diff(g0,g1);if(d.length){fail++;console.log(`FAIL ${w}x${h} ${samp||'sample'} ${first||'-'} ${s.match(/v="(\w+)"/)[1]}:`,d.map(k=>k+' '+JSON.stringify(g0[k])+'→'+JSON.stringify(g1[k])).join(' | '));}
   if(w===1440&&!samp&&!first&&hs==='fill')await pg.screenshot({path:OUT+'/tbl-jump-after.png'});}
  await pg.close();}
 console.log(fail?'FAILS '+fail:'ALL OK');await b.close();})();
