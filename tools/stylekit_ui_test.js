// 用法：python3 -m http.server 8765 & NODE_PATH=/tmp/pptr/node_modules timeout 180 node tools/stylekit_ui_test.js [URL] [截圖目錄]
// 範本 Style Kit 分頁：切主題 → 快速樣式 7×6／螢光筆預覽跟著換色（與 mapping 色碼一致）；下載連結可取得 .pptx／.potx／.xml 且內嵌該主題色彩
const puppeteer=require('puppeteer-core');const JSZip=require('jszip');const sl=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.argv[2]||'http://localhost:8765/studio.html',SHOT=process.argv[3];let fail=0;const ck=(n,c)=>{console.log((c?'OK   ':'FAIL ')+n);if(!c)fail++;};
(async()=>{const b=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});const pg=await b.newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.setViewport({width:1366,height:900});await pg.goto(URL,{waitUntil:'networkidle0'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'networkidle0'});
 await pg.evaluate(()=>document.querySelector('#tabs button[data-tab="kit"]').click());await sl(400);
 ck('分頁「範本 Style Kit」顯示、13 個主題',await pg.evaluate(()=>!document.querySelector('#vKit').hidden&&document.querySelectorAll('#skThemes button').length===13));
 ck('每套主題顯示主色對比值＋5 色對比表',await pg.evaluate(()=>[...document.querySelectorAll('#skThemes .skCr')].length===13&&/\d\.\d:1/.test(document.querySelector('#skThemes .skCr').textContent)&&document.querySelectorAll('#skCt span').length===5));
 for(const id of ['navy','investor','green','wine']){
  await pg.evaluate(id=>document.querySelector(`#skThemes button[data-sk="${id}"]`).click(),id);await sl(300);
  const r=await pg.evaluate(id=>{const t=StyleKit.themes.find(x=>x.id===id);const rgb=h=>'rgb('+[0,2,4].map(i=>parseInt(h.substr(i,2),16)).join(', ')+')';
   const q=document.querySelectorAll('#skGal .skQ');const c=document.querySelector('#skGal .skQ[data-r="1"][data-c="1"]');const hl=[...document.querySelectorAll('#skHls .t')].map(e=>getComputedStyle(e).backgroundColor);
   return{n:q.length,acc1:getComputedStyle(c).backgroundColor===rgb(t.sc.acc[0]),hl:hl.length===6&&hl.every((v,i)=>v===rgb(t.sc.hl[i])),on:document.querySelector('#skThemes .on').dataset.sk,
    links:['#skPptx','#skPotx','#skXml'].map(s=>{const a=document.querySelector(s);return{h:a.href,d:a.getAttribute('download')};})};},id);
  ck(`${id}：7×6=${r.n} 格、Accent1 實心格＝主色、6 色螢光筆一致`,r.n===42&&r.acc1&&r.hl&&r.on===id);
  for(const L of r.links){const buf=await pg.evaluate(async h=>{const x=await fetch(h);if(!x.ok)return null;const a=new Uint8Array(await x.arrayBuffer());return Array.from(a);},L.h);
   let good=!!buf&&buf.length>500;if(good&&/\.(pptx|potx)$/.test(L.d)){const z=await JSZip.loadAsync(Buffer.from(buf));const th=await z.file('ppt/theme/theme1.xml').async('string');const t=await pg.evaluate(id=>StyleKit.themes.find(x=>x.id===id),id);
    good=th.includes(`<a:accent1><a:srgbClr val="${t.sc.acc[0]}"/>`)&&th.includes('fmtScheme name="PPT Template Style Kit"')&&Object.keys(z.files).filter(f=>/slides\/slide\d+\.xml$/.test(f)).length===4;}
   else if(good)good=Buffer.from(buf).toString().includes('<a:clrScheme');
   ck(`  下載 ${L.d}（${buf?buf.length:0} B）`,good);}
  if(SHOT&&(id==='navy'||id==='investor')){await pg.setViewport({width:1366,height:1350});await sl(300);
   const el=await pg.$('#vKit');await el.screenshot({path:`${SHOT}/stylekit-${id}.png`});await pg.setViewport({width:1366,height:900});}}
 await pg.reload({waitUntil:'networkidle0'});ck('重新整理後停在 Style Kit 分頁',await pg.evaluate(()=>!document.querySelector('#vKit').hidden));
 await pg.evaluate(()=>document.querySelector('#tabs button[data-tab="slides"]').click());await sl(300);ck('切回投影片元件正常',await pg.evaluate(()=>document.querySelector('#vKit').hidden&&!document.querySelector('#vSlides').hidden));
 ck('無 JS 錯誤 '+errs.join('；'),!errs.length);await b.close();console.log(fail?`${fail} FAIL`:'ALL OK');process.exit(fail?1:0);})();
