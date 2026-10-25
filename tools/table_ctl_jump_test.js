const P=require('puppeteer-core');const URL=process.env.U||'file:///workspace/ppt-style-studio/studio.html';const sl=ms=>new Promise(r=>setTimeout(r,ms));
let fail=0;
const geo=pg=>pg.evaluate(()=>{const R=s=>{const e=document.querySelector(s);if(!e||!e.offsetParent)return null;const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(Math.round);};
 return {tbl:R('#tPrev .tov'),title:R('#tPrev .tslot[data-k="title"]'),canvas:R('#tCanvas'),prev:R('#tPrev'),ins:R('#tIns'),dock:R('#tDock'),strip:R('#tLStrip'),stage:R('.tstagew'),sy:Math.round(scrollY),psy:Math.round((document.querySelector('#tIns .tsecs')||{}).scrollTop||0)};});
const diff=(a,b)=>Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])&&!(Array.isArray(a[k])&&b[k]&&a[k].every((v,i)=>Math.abs(v-b[k][i])<=1))&&!(typeof a[k]==='number'&&Math.abs(a[k]-b[k])<=1));
(async()=>{const b=await P.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const VP=JSON.parse(process.env.VP||'[[1366,768,0],[1440,900,0],[1920,1080,0],[390,844,1]]');
 for(const [w,h,mob] of VP){const pg=await b.newPage();await pg.setViewport({width:w,height:h,isMobile:!!mob,hasTouch:!!mob});await pg.goto(URL,{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});await sl(300);
  await pg.evaluate(()=>document.querySelector('#tabs button[data-tab="table"]').click());await sl(800);
  const prep=async s=>{const e=await pg.$(s);await e.evaluate(x=>{const r=x.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)x.scrollIntoView({block:'nearest'});});await sl(250);return e;};const clk=async e=>{const r=await e.evaluate(x=>{const b=x.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2];});if(mob)await pg.touchscreen.tap(r[0],r[1]);else await pg.mouse.click(r[0],r[1]);await sl(600);};
  const steps=[];for(const [key,values] of [['tbCardOn',['true','false']],['tbHeaderStyle',['primary','normal']],['tbStripes',['true','false']],['tbGrid',['all','none','horizontal']]])for(const v of values)steps.push(['look',`#tLStrip [data-appearance="${key}"] button[data-v="${v}"]`]);
  for(const [tab,tp,vs] of [['look','tbDense',['comfy','dense','normal']],['look','size',['S','L','M']],['look','tbWidth',['fill','compact','auto']],['look','tbH',['left','center']],['look','tbPad',['none','l','m']],['look','tbFont',['auto','arial','jh']]])for(const v of vs)steps.push([tab,`[data-tp="${tp}"] button[data-v="${v}"]`]);
  for(const [tab,s] of steps){if(tab){await pg.evaluate(t=>{const b=document.querySelector(`.tinsTabs button[data-t="${t}"]`);if(b)b.click();},tab);await sl(300);}
   if(!await pg.$(s)){console.log('skip',s);continue;}const el=await prep(s);const g0=await geo(pg);await clk(el);const g1=await geo(pg);
   // scroll the clicked control into view is ours, so compare after re-measure excluding psy changes caused by scrollIntoView
   const d=diff(g0,g1).filter(k=>k!=='psy'&&(s.includes('tLStrip')||(k!=='tbl'&&k!=='title')));if(d.length){fail++;console.log(`FAIL ${w}x${h} ${s}:`,d.map(k=>k+' '+JSON.stringify(g0[k])+'→'+JSON.stringify(g1[k])).join(' | '));}}
  await pg.close();}
 console.log(fail?'FAILS '+fail:'ALL OK');await b.close();})();
