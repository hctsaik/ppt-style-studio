/* Page-level footer regression for source and offline bundle.
 * jsdom validates DOM/events/CSS contracts, not real-browser layout or scrolling. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');
const ROOT=path.resolve(__dirname,'..');
async function main(){
 const file=process.env.STUDIO_HTML||'studio.html',errors=[],vc=new VirtualConsole();
 vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|scrollTo/.test(e.message))errors.push(e.message);});
 class Resources extends ResourceLoader{fetch(url){const p=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(p)?Promise.resolve(fs.readFileSync(p)):null;}}
 const source=fs.readFileSync(path.join(ROOT,file),'utf8');
 const dom=new JSDOM(source,{url:'http://footer.test/studio.html',runScripts:'dangerously',resources:new Resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.URL.createObjectURL=()=> 'blob:footer-test';w.URL.revokeObjectURL=()=>{};w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(options){w.__footerScroll={element:this,options};};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*50})});w.scrollTo=()=>{};w.confirm=()=>true;}});
 const w=dom.window,d=w.document,wait=ms=>new Promise(r=>setTimeout(r,ms)),$=s=>{const e=d.querySelector(s);assert(e,'Missing '+s);return e;},click=s=>$(s).click();
 const key=(el,k)=>el.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));
 const state=()=>JSON.stringify([w.__studioApi.S.p,w.__studio.tableData]);
 const catalog=()=>{click('#pTree a[data-k="catalog"]');assert.equal(w.__studio.key,'catalog');};
 let passed=0;const test=async(n,f)=>{await f();passed++;console.log('PASS '+n);};
 try{await new Promise(r=>w.addEventListener('load',r));await wait(80);click('#tabs [data-tab="table"]');click('#tabs [data-tab="slides"]');await wait(40);
 await test('One existing information strip is a page footer after the complete workspace',()=>{
  const footer=$('#pageInfo');assert.equal(footer.tagName,'FOOTER');assert.strictEqual(footer.parentElement,d.body);assert.strictEqual(footer.previousElementSibling,$('.wrap'));assert.equal(d.querySelectorAll('.bar').length,1);
  for(const id of ['sTitle','chips','edBadge','edPop','bZoom']){assert.equal(d.querySelectorAll('#'+id).length,1);assert(footer.contains($('#'+id)));}
  assert(!$('#vSlides').contains(footer));assert(!$('#tIns').contains(footer));assert(!$('#big').contains(footer));assert(!$('#tPrev').contains(footer));assert.equal(d.querySelector('#vSlides .bar'),null);
 });
 await test('All A–X links keep their category targets and restore a live focus target',()=>{
  catalog();const cats=[...d.querySelectorAll('#pageInfo .gocards a')].map(a=>({key:a.dataset.k,code:a.querySelector('b').textContent,href:a.getAttribute('href')}));assert.deepEqual(cats.map(c=>c.code),['A','B','C','D','E','F','G','X']);
  for(const c of cats){catalog();const a=$(`#pageInfo .gocards a[data-k="${c.key}"]`);assert.equal(a.tabIndex,0);assert.equal(a.getAttribute('href'),c.href);assert(c.href.endsWith('/'+c.key));a.focus();a.click();assert.equal(w.__studio.key,c.key);assert.equal(w.location.hash,c.href);assert.strictEqual(d.activeElement,$('#sTitle'));assert(!$('#pageInfo').hidden);}
 });
 await test('Category keyboard navigation scrolls locally without changing the current slide',()=>{
  catalog();const links=[...d.querySelectorAll('#pageInfo .gocards a')],before=state();links[0].focus();
  for(const[k,i]of [['ArrowRight',1],['End',7],['ArrowRight',0],['ArrowLeft',7],['Home',0]]){key(d.activeElement,k);assert.strictEqual(d.activeElement,links[i]);assert.equal(w.__studio.key,'catalog');assert.strictEqual(w.__footerScroll.element,links[i]);assert.equal(w.__footerScroll.options.inline,'nearest');}
  assert.equal(state(),before);$('#sTitle').focus();key(d.activeElement,'ArrowRight');assert.notEqual(w.__studio.key,'catalog');key(d.activeElement,'ArrowLeft');assert.equal(w.__studio.key,'catalog');
 });
 await test('Footer follows the existing slides-only scope through every tab and repeated changes',()=>{
  const footer=$('#pageInfo'),before=state();
  for(let i=0;i<2;i++)for(const t of ['style','icons','table','master','guide']){click('#edBadge');assert(!$('#edPop').hidden);click(`#tabs [data-tab="${t}"]`);assert(footer.hidden);assert.equal(w.getComputedStyle(footer).display,'none');assert($('#edPop').hidden);assert.equal($('#edBadge').getAttribute('aria-expanded'),'false');click('#tabs [data-tab="slides"]');assert(!footer.hidden);assert.strictEqual($('#pageInfo'),footer);}
  assert.equal(state(),before);
 });
 await test('Editable popover and mobile zoom remain live, without altering table/style state',()=>{
  const before=state();for(let i=0;i<2;i++){click('#edBadge');assert(!$('#edPop').hidden);assert.equal($('#edBadge').getAttribute('aria-expanded'),'true');key($('#edBadge'),'Escape');assert($('#edPop').hidden);assert.strictEqual(d.activeElement,$('#edBadge'));}
  click('#edBadge');$('.stage').click();assert($('#edPop').hidden);click('#bZoom');assert($('.stage').classList.contains('zoom'));assert.equal($('#bZoom').getAttribute('aria-pressed'),'true');click('#bZoom');assert(!$('.stage').classList.contains('zoom'));assert.equal(state(),before);
 });
 await test('Sidebar, search, hash, recipes, and used-component links reach the relocated title',async()=>{
  assert.equal(d.querySelectorAll('#pTree details:not([data-collection])').length,9);assert.equal(d.querySelectorAll('#pTree details[data-collection="recommended"]').length,1);click('#pTree a[data-k="kpi"]');assert($('#sTitle').textContent.startsWith('C1'));assert.equal(w.location.hash,'#/C1/kpi');
  const search=q=>{const el=$('#pSearch');el.value=q;el.dispatchEvent(new w.Event('input',{bubbles:true}));return [...d.querySelectorAll('#pRes a[data-i]')];};
  assert(search('VS').some(a=>a.textContent.includes('對比')));assert(search('指標').some(a=>a.textContent.includes('KPI')));const result=search('STAR').find(a=>+a.dataset.gi>=0&&a.textContent.startsWith('G4'));assert(result);result.click();assert.equal(w.__studio.key,'star');assert($('#eName').textContent);
  w.history.replaceState(null,'','#/G5/folio');w.dispatchEvent(new w.HashChangeEvent('hashchange'));await wait(40);assert.equal(w.__studio.key,'folio');assert($('#sTitle').textContent.startsWith('G5'));w.history.replaceState(null,'','#/Z9/nope');w.dispatchEvent(new w.HashChangeEvent('hashchange'));await wait(40);assert.equal(w.__studio.key,'catalog');
  click('#pTree a[data-k="ex1"]');assert(d.querySelectorAll('#pageInfo .gocards a').length>=3);const used=$('#pageInfo .gocards a'),target=used.dataset.k;assert(used.getAttribute('href').endsWith('/'+target));used.focus();used.click();assert.equal(w.__studio.key,target);assert.strictEqual(d.activeElement,$('#sTitle'));
  click('#tabs [data-tab="guide"]');click('.rcp a[data-k="profile"]');assert.equal(w.__studio.key,'profile');assert(!$('#pageInfo').hidden);click('#pTree a[data-k="chart"]');assert($('#pageInfo a.chartln').href.includes('swiffchart-web-preview'));catalog();search('');assert($('#pRes').hidden);
 });
 await test('Style metadata still refreshes in the same footer nodes',async()=>{
  const chips=$('#chips'),title=$('#sTitle'),before=chips.innerHTML,S=w.__studioApi.S,old=S.p.card;S.p.card=old==='none'?'round':'none';w.__studioApi.render();assert.strictEqual($('#chips'),chips);assert.strictEqual($('#sTitle'),title);assert.notEqual(chips.innerHTML,before);assert.equal(chips.children.length,5);S.p.card=old;w.__studioApi.render();assert.equal(chips.innerHTML,before);await wait(20);
 });
 await test('Responsive CSS keeps normal-flow footer, horizontally scrollable links/chips, and upward popover',()=>{
  const css=$('style').textContent;assert(/\.page-info\{[^}]*flex-wrap:wrap/.test(css));assert(!/\.page-info\{[^}]*(?:position:(?:absolute|fixed|sticky)|overflow:hidden)/.test(css));assert(/\.page-info \.gocards\{[^}]*flex-wrap:nowrap[^}]*overflow-x:auto/.test(css));assert(/\.page-info \.chips\{[^}]*display:flex[^}]*overflow-x:auto/.test(css));assert(/\.page-info \.edpop\{[^}]*top:auto;bottom:calc\(100% \+ 8px\)[^}]*max-height:[^}]*overflow:auto/.test(css));assert(/\.page-info\{[^}]*safe-area-inset-bottom/.test(css));assert.equal(w.getComputedStyle($('#pageInfo')).flex,'0 0 auto');assert.equal(w.getComputedStyle($('#edPop')).top,'auto');assert(/\.ebar\{bottom:calc\(var\(--page-info-height,130px\) \+ 8px\)\}/.test(css));const footer=$('#pageInfo');footer.getBoundingClientRect=()=>({height:124});w.dispatchEvent(new w.Event('resize'));assert.equal(d.documentElement.style.getPropertyValue('--page-info-height'),'124px');click('#tabs [data-tab="table"]');assert.equal(d.documentElement.style.getPropertyValue('--page-info-height'),'0px');click('#tabs [data-tab="slides"]');assert.equal(d.documentElement.style.getPropertyValue('--page-info-height'),'124px');
 });
 assert.deepEqual(errors,[]);console.log(`${passed} page footer checks passed (${file}).`);
 }finally{dom.window.close();}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
