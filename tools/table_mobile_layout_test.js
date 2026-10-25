/* Local responsive layout regression. No DevTools / CDP / remote-debugging.
 * Uses Chromium's ordinary headless screenshot + dump-dom CLI against a local
 * HTTP test fixture. Synthetic events cover app behavior, not native touch or
 * the system clipboard. CHROME may point to an installed Chromium executable.
 * npm run test:table-mobile-ui [-- --offline]
 * npm run preview:table-mobile (ordinary browser fixture at localhost:8767)
 */
'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {execFile}=require('child_process');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'out/test/mobile-layout');
const offline=process.argv.includes('--offline'),name=offline?'PPT-Style-Studio.html':'studio.html';
fs.mkdirSync(OUT,{recursive:true});
const source=fs.readFileSync(path.join(ROOT,name),'utf8').replace('function buildTableUI(){','window.__mobileEval=code=>eval(code);function buildTableUI(){');
async function fixture(){
 const $=q=>document.querySelector(q),run=s=>window.__mobileEval(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 const checks=[],snap=()=>run('JSON.stringify([T,S.p,TM,HIST.a,HIST.i])'),near=(a,b)=>Math.abs(a-b)<1.1;
 const check=(n,p,detail)=>checks.push({name:n,pass:!!p,...(detail?{detail}:{})});
 const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
 const tag=new URLSearchParams(location.search).get('tag')||'manual';
 const mobile=innerWidth<=900,side=mobile&&innerWidth>=600&&innerHeight<=500,metrics={width:innerWidth,height:innerHeight,mobile};
 const settle=async()=>{run('fitPrev();applyView(tableMeta())');await wait(120);};
 try{
  $('#tabs [data-tab="table"]').click();await wait(150);
  run("T=JSON.parse(JSON.stringify(T_SAMPLES.yield));S.base='teal';S.p=templateParams(S.base);T.rules=[];S.p.tbHeaderStyle='primary';T.header=true;saveT();renderGrid(true);renderTable();pushHist(true);showSec('emphasis');RANGE_TOUCH=true;setRange({r:2,c:1},{r:2,c:1});renderRangePanel()");await settle();
  const canvas=$('#tCanvas'),ins=$('#tIns'),tabs=$('.tinsTabs'),start=snap(),ppi=window.__studio.tableViewport.pixelsPerInch;
  metrics.header=rect($('header'));metrics.inspector=rect(ins);metrics.canvas=rect(canvas);metrics.preview=window.__studio.tableViewport;
  check('preview has nonzero usable area',canvas.clientHeight>60&&canvas.clientWidth>200,rect(canvas));
  check('preview is not covered by inspector',!mobile||(side?rect(canvas).right<=rect(ins).x+1:near(rect(canvas).bottom,rect(ins).y)));
  if(mobile){
   check('page has no horizontal overflow',document.documentElement.scrollWidth<=innerWidth+1,{scrollWidth:document.documentElement.scrollWidth});
   check('compact header uses at most 110px',rect($('header')).height<=110);
   check('inspector has bounded allocation',side?rect(ins).width<=Math.max(280,innerWidth*.42)+1:rect(ins).height<=innerHeight*(innerWidth<600&&innerHeight<=700?.35:.40)+1);if(side){check('landscape settings have usable scrolling space',$('.tsecs').clientHeight>=176);check('landscape preview keeps full workspace height',canvas.clientHeight>=innerHeight-metrics.header.height-rect($('.tpreviewbar')).height-1);}
   check('preview gets at least 38% viewport height',canvas.clientHeight>=innerHeight*.38,{height:canvas.clientHeight});
   check('native disclosure initially collapsed',$('#tMoreOptions').open===false);
   check('nav overflow stays internal',getComputedStyle($('#tabs')).overflowX==='auto'&&$('#tabs').clientWidth<=innerWidth);
   const min=run("tablePreviewMinFont(tableSlide(),tableMeta())");
   check('table text has 12 CSS px floor',min*ppi/72>=11.99,{minFontPx:min*ppi/72});
   const overflows=w=>w.width>w.availableWidth+1;check('overflow is contained without forcing a fitted table to scroll',getComputedStyle(canvas).overflowX==='auto'&&(!overflows(window.__studio.tableViewport)||canvas.scrollWidth>canvas.clientWidth));
   if(overflows(window.__studio.tableViewport)){canvas.scrollLeft=canvas.scrollWidth;check('overflowing right edge can be reached',canvas.scrollLeft>0);canvas.scrollLeft=0;}
  }else{
   check('desktop disclosure is open and transparent',$('#tMoreOptions').open&&getComputedStyle($('#tMoreOptions')).display==='contents');
   const p=window.__studio.tableViewport;check('desktop fit keeps original width-and-height formula',near(ppi,Math.min(p.availableWidth/(p.x1-p.x0),p.availableHeight/(p.y1-p.y0))));
   check('desktop inspector remains 320px',near(rect(ins).width,320));
  }
  // The right-anchored template popup must not disappear behind the side inspector.
  const menuState=snap();for(const [id,trigger] of [['mTpl','bTpl'],['mMore','bMore']]){$('#'+trigger).click();await wait(40);const menu=$('#'+id),mb=rect(menu);
  check(id+' is open',!menu.hidden&&$('#'+trigger).getAttribute('aria-expanded')==='true');
  if(mobile){check(id+' stays inside viewport',mb.x>=0&&mb.right<=innerWidth&&mb.y>=0&&mb.bottom<=innerHeight,mb);const items=[...menu.querySelectorAll('button,a[href]')].filter(e=>getComputedStyle(e).display!=='none'),first=items[0],fb=rect(first),hit=document.elementFromPoint(fb.x+fb.width/2,fb.y+Math.min(fb.height/2,20));check(id+' paints above inspector',first.contains(hit));check(id+' retains 44px hit targets',items.every(e=>rect(e).height>=44));check(id+' has internal scrolling',getComputedStyle(menu).overflowY==='auto');menu.scrollTop=menu.scrollHeight;const last=rect(items[items.length-1]);check(id+' last action remains reachable',last.bottom<=mb.bottom+1&&last.y>=mb.y-1);}
  $('#'+trigger).click();check(id+' repeated trigger closes popup',menu.hidden);}check('opening header menus does not change table model or history',snap()===menuState);
  const controls=['#tUndo','#tRedo','#tTabData','#tTabLook','#tTabEmphasis','#tTabOut','#tPptx','[data-range-action="close"]'];
  for(const q of controls)check('tap target '+q,!mobile||rect($(q)).height>=43.9&&rect($(q)).width>=43.9,rect($(q)));
  // Repeated tab collapse/reopen must not mutate data, selection or history.
  $('#tTabEmphasis').click();await settle();
  if(mobile&&!side){check('second tap collapses inspector',!ins.classList.contains('open'));check('collapse exposes more preview',canvas.clientHeight>metrics.canvas.height);check('collapsed tab conveys state',$('#tTabEmphasis').getAttribute('aria-expanded')==='false');$('#tTabEmphasis').click();await settle();check('reopen retains readable scale',near(window.__studio.tableViewport.pixelsPerInch,ppi));}
  $('#tTabData').click();await settle();check('data panel alone is active',$('#tSecData').hidden===false&&$('#tSecEmphasis').hidden);
  $('#tTabLook').click();await settle();check('appearance panel alone is active',$('#tSecLook').hidden===false&&$('#tSecData').hidden);
  check('navigation and sizing do not change source, model or history',snap()===start);
  $('#tMoreOptions').open=true;await settle();if(mobile&&!side)check('expanded secondary controls remain capped',rect(ins).height<=innerHeight*(innerWidth<600&&innerHeight<=700?.35:.40)+1);
  check('secondary formatting remains available',getComputedStyle($('#tStyle')).display!=='none');
  const before=run('snapT()');$('[data-appearance="tbStripes"] [data-v="true"]').click();await wait(100);const after=run('snapT()');
  $('#tUndo').click();await wait(100);check('visible undo restores appearance',run('snapT()')===before);$('#tRedo').click();await wait(100);check('visible redo restores appearance',run('snapT()')===after);
  // Width-independent export geometry/data: UI operations cannot alter a model.
  const model=run('JSON.stringify(TM)');run("TZ='100';applyView(tableMeta())");check('100% remains 90 CSS px/in',window.__studio.tableViewport.pixelsPerInch===90);check('zoom cannot change export model',run('JSON.stringify(TM)')===model);
  run("TZ='fit';showSec('emphasis');setRange({r:2,c:1},{r:2,c:1});renderRangePanel()");await settle();
  check('selection survives the interrupted flow',run('TRANGE.r0===2&&TRANGE.c0===1'));
  for(const card of document.querySelectorAll('[data-range-preset]')){check('palette card target '+card.dataset.rangePreset,rect(card).height>=44&&rect(card).width>=44);check('palette card content fits '+card.dataset.rangePreset,card.scrollWidth<=card.clientWidth+1);}check('seven palette choices present',document.querySelectorAll('[data-range-preset]').length===7);
  check('palette fills its available inspector width',near(rect($('.trange-panel')).width,rect($('#tSelPanel')).width),{panel:rect($('.trange-panel')),host:rect($('#tSelPanel'))});
  // Palette is scrollable rather than increasing the sheet height.
  await settle();if(mobile&&!side){check('palette is capped at configured viewport cap',rect(ins).height<=innerHeight*(innerWidth<600&&innerHeight<=700?.35:.40)+1);check('long controls scroll internally',$('.tsecs').scrollHeight>$('.tsecs').clientHeight);}
  await settle();
  if(mobile){const saved=run('JSON.stringify(T)');run("T.rows=[Array.from({length:12},(_,i)=>'Header '+i),Array.from({length:12},(_,i)=>'9007199254740993')];renderTable(true)");await settle();check('genuinely wide fixture scrolls internally',canvas.scrollWidth>canvas.clientWidth);canvas.scrollLeft=canvas.scrollWidth;check('wide fixture reaches its right edge',canvas.scrollLeft>0);run('T='+saved+';renderTable(true);setRange({r:2,c:1},{r:2,c:1});renderRangePanel()');canvas.scrollLeft=0;await settle();}
  metrics.final={header:rect($('header')),inspector:rect(ins),canvas:rect(canvas),preview:window.__studio.tableViewport};
 }catch(e){check('fixture completes',false,e.stack||e.message);}
 const result={checks,metrics};document.documentElement.setAttribute('data-mobile-qa',encodeURIComponent(JSON.stringify(result)));
 parent.postMessage({tag,...result},location.origin);await fetch('/report?tag='+encodeURIComponent(tag),{method:'POST',body:JSON.stringify(result)});
}
const html=source.replace('</body>',`<script>addEventListener('load',()=>{(${fixture.toString()})()});</script></body>`);
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=u.pathname;
 if(p==='/report'&&req.method==='POST'){let body='';req.on('data',c=>body+=c);req.on('end',()=>{const tag=u.searchParams.get('tag');if(/^[a-zA-Z0-9x-]+$/.test(tag||'')){fs.writeFileSync(path.join(OUT,tag+'.json'),body);console.log('REPORT '+tag+' '+body);}res.end('ok');});return;}
 if(p==='/'){res.setHeader('Content-Type','text/html');res.end(`<!doctype html><meta charset="utf-8"><title>Mobile layout local QA</title><style>body{font:14px system-ui;background:#e8edf2;margin:16px}article{display:inline-block;vertical-align:top;margin:0 14px 24px 0}iframe{display:block;border:1px solid #aaa;background:white}pre{max-width:900px;white-space:pre-wrap}h2{margin:8px 0}</style><h1>PPT Studio 手機版・本地驗證</h1><p>固定尺寸 iframe 使用正常瀏覽器排版；無 DevTools、無 remote debugging。測試約 5 秒後完成。</p>${[[360,505],[400,606],[360,740],[390,844],[412,915],[500,757],[768,1024],[740,360],[844,390],[900,800],[901,800],[1280,800],[1440,900]].map(([w,h])=>`<article><h2>${w} × ${h}</h2><iframe title="${w} × ${h}" width="${w}" height="${h}" src="/qa.html?tag=${offline?'offline':'source'}-${w}x${h}"></iframe><pre id="${offline?'offline':'source'}-${w}x${h}">檢查中…</pre></article>`).join('')}<script>addEventListener('message',e=>{if(e.origin!==location.origin||!e.data.checks)return;const p=document.getElementById(e.data.tag);if(p)p.textContent=e.data.checks.map(c=>(c.pass?'PASS ':'FAIL ')+c.name).join('\n')})</script>`);return;}
 if(p==='/qa.html'){res.setHeader('Content-Type','text/html');res.end(html);return;}const f=path.join(ROOT,decodeURIComponent(p));if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(f));});
const exec=(cmd,args)=>new Promise((resolve,reject)=>execFile(cmd,args,{timeout:60000,maxBuffer:16*1024*1024},(e,stdout,stderr)=>e?reject(Object.assign(e,{stderr})):resolve({stdout,stderr})));
(async()=>{await new Promise(r=>server.listen(process.argv.includes('--serve')?8767:0,'127.0.0.1',r));if(process.argv.includes('--serve')){console.log('Local layout fixture: http://127.0.0.1:8767/');return;}try{const results=[];for(const [width,height] of [[360,505],[400,606],[360,740],[390,844],[412,915],[500,757],[768,1024],[740,360],[844,390],[900,800],[901,800],[1280,800],[1440,900]]){const tag=`${offline?'offline':'source'}-${width}x${height}`,profile=fs.mkdtempSync('/tmp/ppt-mobile-');try{const {stdout}=await exec(process.env.CHROME||'/usr/bin/chromium',['--headless','--no-sandbox',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check',`--window-size=${width},${height}`,'--force-device-scale-factor=1','--virtual-time-budget=5000','--run-all-compositor-stages-before-draw',`--screenshot=${path.join(OUT,tag+'.png')}`,'--dump-dom',`http://127.0.0.1:${server.address().port}/qa.html`]);const m=stdout.match(/data-mobile-qa="([^"]+)"/);assert(m,'Local browser fixture did not return a report');const result=JSON.parse(decodeURIComponent(m[1]));fs.writeFileSync(path.join(OUT,tag+'.json'),JSON.stringify(result,null,2));results.push({tag,...result});for(const c of result.checks)console.log(`${c.pass?'PASS':'FAIL'} ${tag}: ${c.name}${!c.pass?' '+JSON.stringify(c.detail||''):''}`);}finally{fs.rmSync(profile,{recursive:true,force:true});}}
 fs.writeFileSync(path.join(OUT,offline?'offline-results.json':'source-results.json'),JSON.stringify(results,null,2));const failed=results.flatMap(r=>r.checks.filter(c=>!c.pass));console.log(`${results.reduce((n,r)=>n+r.checks.length,0)} local Chromium checks; ${failed.length} failed (${name}).`);if(failed.length)process.exitCode=1;
 }finally{server.close();}})().catch(e=>{console.error(e.stack,e.stderr||'');server.close();process.exitCode=1;});
