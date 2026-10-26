/* Recommended quick entries: stable identities, DOM/events, persistence and
 * model invariants. No browser/server/CDP; jsdom cannot certify visual layout,
 * native keyboard defaults, touch interaction or actual downloads.
 * STUDIO_HTML=PPT-Style-Studio.html node tools/recommended_components_test.js
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');
const ROOT=path.resolve(__dirname,'..'),D=require('../deck');
const file=process.env.STUDIO_HTML||'studio.html',source=fs.readFileSync(path.resolve(ROOT,file),'utf8');
const codes=['00','A2','A5','A12','A13','A14','C1','D3','D4','D8','E2','A16','A18'];
const keys=['catalog','cards','labels','icons','iconcomponents','iconvariants','kpi','cmp2','cmp3','decide','emph','schemebody','schemeiconbody'];
let passed=0,mobile=false;
const check=async(name,fn)=>{await fn();passed++;console.log('PASS '+name);},wait=ms=>new Promise(r=>setTimeout(r,ms));
class LocalResources extends ResourceLoader{fetch(url){const f=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(f)?Promise.resolve(fs.readFileSync(f)):null;}}
async function openStudio(saved={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|window.scrollTo/.test(e.message))errors.push(e.message);});
 const dom=new JSDOM(source,{url:'http://recommended.test/studio.html',runScripts:'dangerously',resources:new LocalResources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  for(const[k,v]of Object.entries(saved))w.localStorage.setItem(k,v);
  w.matchMedia=q=>({get matches(){return mobile&&/max-width|pointer:coarse/.test(q);},media:q,addListener(){},addEventListener(){}});
  w.ResizeObserver=class{observe(){}disconnect(){}};w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
  w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.scrollTo=()=>{};
  w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*50})});
  w.URL.createObjectURL=()=> 'blob:recommended-test';w.URL.revokeObjectURL=()=>{};w.confirm=()=>true;
 }});
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Studio load timeout')),20000);dom.window.addEventListener('load',()=>{clearTimeout(t);resolve();});});await wait(60);
 return{dom,w:dom.window,d:dom.window.document,errors};
}
async function main(){
 await check('Overview precedes the original twelve codes with unique frozen keys in unchanged order',()=>{
  assert.deepEqual(codes.map(c=>{const e=D.SLIDES.filter(e=>e[2]===c);assert.equal(e.length,1);return e[0][0];}),keys);
  const declaration=source.match(/const RECOMMENDED_PAGE_KEYS=Object\.freeze\((\[[^\n]+\])\);/);assert(declaration);
  assert.deepEqual(vm.runInNewContext(declaration[0]+'JSON.stringify(RECOMMENDED_PAGE_KEYS)'),JSON.stringify(keys));assert.equal(new Set(keys).size,13);
 });
 const iconPage=D.buildModel(D.PRESETS[0],{only:['iconcomponents']}).slides[0],group=iconPage.groups[0];
 const iconIndex=iconPage.items.slice(group.from,group.to+1).findIndex(i=>i.ic);
 const seededLabels={'iconcomponents:0':{[iconIndex]:{from:'groups',icon:'star'}}};
 const seed={'ppt-studio-v4':JSON.stringify({base:'navy',p:D.PRESETS[0],key:'catalog',tab:'slides',labels:seededLabels}),
  'pss-nav-open':JSON.stringify({A:false,D:false,recommended:true}),'ppt-studio-mystyles':'[]'};
 const {dom,w,d,errors}=await openStudio(seed);
 const $=s=>{const e=d.querySelector(s);assert(e,'Missing '+s);return e;},click=s=>$(s).dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
 const recommended=k=>$(`#pTree [data-collection="recommended"] a[data-k="${k}"]`);
 const canonical=k=>$(`#pTree details:not([data-collection]) a[data-k="${k}"]`);
 const sendKey=(el,key)=>el.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
 const search=q=>{const el=$('#pSearch');el.value=q;el.dispatchEvent(new w.Event('input',{bubbles:true}));return [...d.querySelectorAll('#pRes a[data-i]')];};
 const active=k=>{const list=[...d.querySelectorAll('#pTree a.on')];assert.equal(list.length,keys.includes(k)?2:1);assert(list.every(a=>a.dataset.k===k&&a.getAttribute('aria-current')==='page'));assert.equal(d.querySelectorAll('#pTree [aria-current="page"]').length,list.length);};
 try{
  const api=w.__studioApi,initialPages=JSON.stringify(w.Deck.SLIDES),modelKeys=JSON.stringify(w.Deck.buildModel(api.S.p,{examples:true,labels:api.S.labels}).slides.map(s=>s.key));
  const unchanged=JSON.stringify([api.S.p,api.S.labels]),myStyles=w.localStorage.getItem('ppt-studio-mystyles');
  await check('Recommended is first; all nine original categories and all 76 original page entries remain',()=>{
   const T=$('#pTree'),r=T.firstElementChild;assert.equal(T.getAttribute('role'),'navigation');assert.equal(r.dataset.collection,'recommended');assert(r.open);
   assert.deepEqual([...r.querySelectorAll('a b')].map(e=>e.textContent),codes);assert.deepEqual([...r.querySelectorAll('a')].map(a=>a.dataset.k),keys);
   assert.equal(r.querySelector('i').textContent,'★');assert.equal(r.querySelector('i').getAttribute('aria-hidden'),'true');assert(r.querySelector('summary').textContent.includes('推薦精選'));assert.equal(r.querySelector('small').textContent,'13 頁');
   assert.deepEqual([...T.querySelectorAll('details:not([data-collection])')].map(e=>e.dataset.g),D.SECTIONS.map(e=>e[0]));
   assert.equal(T.querySelectorAll('details:not([data-collection]) a').length,D.SLIDES.length);assert.equal(D.SLIDES.length,76);
   assert.equal(T.querySelectorAll('[id]').length,0);assert.equal(T.querySelectorAll('a').length,D.SLIDES.length+13);
  });
  await check('Each duplicate entry uses the identical canonical URL, page index, title and active aria state',()=>{
   const historyLength=w.history.length;
   for(const [i,k]of keys.entries()){
    const a=recommended(k),b=canonical(k);assert.equal(a.getAttribute('href'),b.getAttribute('href'));assert.equal(a.tabIndex,0);assert.equal(b.tabIndex,0);
    a.focus();a.click();assert.equal(w.__studio.key,k);assert.equal(w.location.hash,`#/${codes[i]}/${k}`);active(k);assert.strictEqual(d.activeElement,a);
    assert.equal($('#sTitle .pcode').textContent,codes[i]);const index=api.S.slide;
    b.focus();b.click();b.click();assert.equal(api.S.slide,index);assert.strictEqual(d.activeElement,b);active(k);
    assert.equal(JSON.parse(w.localStorage.getItem('ppt-studio-v4')).key,k);
   }
   assert.equal(w.history.length,historyLength);assert.equal(JSON.stringify([api.S.p,api.S.labels]),unchanged);
  });
  await check('Collapsed recommendation stays collapsed while canonical category opens on deep links',async()=>{
   const r=$('#pTree [data-collection]'),a=$('#pTree details[data-g="A"]');r.open=false;a.open=false;await wait(15);
   w.history.replaceState(null,'','#/A5/labels');w.dispatchEvent(new w.HashChangeEvent('hashchange'));assert.equal(w.__studio.key,'labels');active('labels');assert(a.open);assert.equal(r.open,false);await wait(15);
   const stored=JSON.parse(w.localStorage.getItem('pss-nav-open'));assert.equal(stored.recommended,false);assert.equal(stored.A,true);
  });
  await check('Browser Back/Forward and invalid deep links retain canonical identity and active duplicates',async()=>{
   const navigate=k=>{const c=D.SLIDES.find(e=>e[0]===k)[2];w.history.pushState(null,'',`#/${c}/${k}`);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
   navigate('cards');navigate('kpi');w.history.back();await wait(40);assert.equal(w.__studio.key,'cards');active('cards');w.history.forward();await wait(40);assert.equal(w.__studio.key,'kpi');active('kpi');
   w.history.replaceState(null,'','#/Z9/no-such-page');w.dispatchEvent(new w.HashChangeEvent('hashchange'));assert.equal(w.__studio.key,'catalog');active('catalog');assert.equal(w.location.hash,'#/00/catalog');
  });
  await check('Native links and summaries keep Tab/Enter semantics; sidebar arrows never change the slide',()=>{
   const r=$('#pTree [data-collection]');r.open=true;const keyBefore=w.__studio.key;
   for(const el of [r.querySelector('summary'),recommended('catalog'),canonical('catalog'),recommended('cards'),canonical('cards')]){
    el.focus();for(const key of ['ArrowDown','ArrowUp','ArrowRight','ArrowLeft']){assert(sendKey(el,key));assert.equal(w.__studio.key,keyBefore);assert.strictEqual(d.activeElement,el);}
    for(const key of ['Tab','Enter',' '])assert(sendKey(el,key));
   }
   assert.equal(r.querySelector('summary').getAttribute('role'),null);assert.equal(recommended('cards').getAttribute('role'),null);
  });
  await check('Search remains model-based and returns each recommended page once; keyboard result opens the same page',()=>{
   for(const c of codes){const hits=search(c).filter(a=>a.dataset.gi==='-1'&&a.querySelector('b').textContent===c);assert.equal(hits.length,1,c);const ids=search(c).map(a=>a.dataset.i+':'+a.dataset.gi);assert.equal(new Set(ids).size,ids.length);}
   const hit=search('A16').find(a=>a.dataset.gi==='-1');hit.focus();sendKey(hit,'Enter');assert.equal(w.__studio.key,'schemebody');active('schemebody');search('');assert($('#pRes').hidden);
  });
  await check('Saved component edits remain shared across recommended and original entries',()=>{
   for(const entry of [recommended('iconcomponents'),canonical('iconcomponents')]){entry.click();click('#big g.el[data-g="0"]');click('#ebar button[data-a="lbl"]');assert.equal($('#lbList input[data-k="0"]').value,'star');click('#lbCancel');}
   assert.equal(JSON.stringify(api.S.labels),JSON.stringify(seededLabels));assert.equal(w.localStorage.getItem('ppt-studio-mystyles'),myStyles);
   assert.equal(JSON.stringify(w.Deck.SLIDES),initialPages);assert.equal(JSON.stringify(w.Deck.buildModel(api.S.p,{examples:true,labels:api.S.labels}).slides.map(s=>s.key)),modelKeys);
  });
  await check('Decorative star is static and theme-bound; nav-only CSS supplies wrapping and mobile touch targets',()=>{
   const rules=source.slice(0,source.indexOf('</style>'));assert(rules.includes('#pTree details[data-collection]>summary i{background:var(--p);color:#fff;'));
   assert(rules.includes('#pTree a .pname{min-width:0;overflow-wrap:anywhere}'));assert(rules.includes('@media(max-width:820px){#pTree a,#pTree summary{min-height:44px;align-items:center}}'));
   assert(!/\[data-collection\][^}]*\b(?:animation|transition)\s*:/.test(rules));assert(rules.includes('#pTree a:focus-visible,#pTree summary:focus-visible'));
  });
  await check('Mobile repeated selection closes the drawer, returns visible focus and cannot compress table workspace',()=>{
   mobile=true;click('#tabs [data-tab="table"]');click('#tabs [data-tab="slides"]');const before=JSON.stringify([api.S.p,api.S.labels,w.__studio.tableData]);
   for(const entry of [recommended('cards'),canonical('cards')]){click('#bPanel');assert(d.body.classList.contains('pan'));entry.focus();entry.click();assert(!d.body.classList.contains('pan'));assert.equal($('#bPanel').getAttribute('aria-expanded'),'false');assert.strictEqual(d.activeElement,$('#bPanel'));}
   click('#tabs [data-tab="table"]');assert.equal(w.getComputedStyle($('aside')).display,'none');assert(!$('#vTable').hidden);assert($('#vSlides').hidden);assert.equal(w.getComputedStyle($('.wrap')).gridTemplateColumns,'1fr');
   click('#tabs [data-tab="slides"]');assert.equal(JSON.stringify([api.S.p,api.S.labels,w.__studio.tableData]),before);recommended('schemeiconbody').click();$('#pTree [data-collection]').open=false;
  });
  await wait(20);
  const saved=Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>w.localStorage.key(i)).map(k=>[k,w.localStorage.getItem(k)]));
  await check('Reload restores the same canonical A18 page, edits and collapsed collection without duplicate DOM ids',async()=>{
   const reopened=await openStudio(saved);try{assert.equal(reopened.w.__studio.key,'schemeiconbody');assert.equal(reopened.w.location.hash,'#/A18/schemeiconbody');assert.equal(reopened.d.querySelector('[data-collection]').open,false);
    assert.equal(reopened.d.querySelectorAll('#pTree a[aria-current="page"]').length,2);assert.equal(JSON.stringify(reopened.w.__studioApi.S.labels),JSON.stringify(seededLabels));
    const ids=[...reopened.d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);assert.deepEqual(reopened.errors,[]);
   }finally{reopened.dom.window.close();}
  });
  await check('Overview entry saves and reloads the canonical 00 route with both active entries',async()=>{
   mobile=false;const overview=recommended('catalog');overview.focus();assert.strictEqual(d.activeElement,overview);
   assert.equal(overview.getAttribute('href'),'#/00/catalog');assert(sendKey(overview,'Tab'));assert(sendKey(overview,'Enter'));
   overview.click();assert.equal(w.__studio.key,'catalog');assert.equal(w.location.hash,'#/00/catalog');active('catalog');
   assert.equal($('#sTitle .pcode').textContent,'00');assert.strictEqual(d.activeElement,overview);
   const overviewSaved=Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>w.localStorage.key(i)).map(k=>[k,w.localStorage.getItem(k)]));
   assert.equal(JSON.parse(overviewSaved['ppt-studio-v4']).key,'catalog');
   const reopened=await openStudio(overviewSaved);try{
    assert.equal(reopened.w.__studio.key,'catalog');assert.equal(reopened.w.location.hash,'#/00/catalog');
    assert.equal(reopened.d.querySelector('#sTitle .pcode').textContent,'00');
    const current=[...reopened.d.querySelectorAll('#pTree a[aria-current="page"]')];assert.equal(current.length,2);assert(current.every(a=>a.dataset.k==='catalog'));
    assert.equal(reopened.d.querySelector('#pTree [data-collection] a').dataset.k,'catalog');
    assert.equal(JSON.stringify(reopened.w.__studioApi.S.labels),JSON.stringify(seededLabels));assert.deepEqual(reopened.errors,[]);
   }finally{reopened.dom.window.close();}
  });
  await check('No uncaught DOM errors and no changes to page registry, model order, count or labels',()=>{
   assert.deepEqual(errors,[]);assert.equal(JSON.stringify(w.Deck.SLIDES),initialPages);assert.equal(JSON.stringify(w.Deck.buildModel(api.S.p,{examples:true,labels:api.S.labels}).slides.map(s=>s.key)),modelKeys);assert.equal(JSON.stringify([api.S.p,api.S.labels]),unchanged);
  });
 }finally{dom.window.close();}
 console.log(`${passed} recommended-component checks passed (${file}; Node/jsdom only, not visual browser validation).`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
