/* Icon Components: native model/export contract + DOM event regressions.
 * DOM checks intentionally do not certify browser layout or actual downloads.
 * STUDIO_HTML=PPT-Style-Studio.html node tools/icon_components_test.js checks offline too.
 */
'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const D=require('../deck'),O=require('./overlap'),R=require('./readorder');
const ROOT=path.resolve(__dirname,'..');let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
async function modelSuite(){
 const PptxGenJS=require('pptxgenjs'),JSZip=require('jszip');
 check('Stable A13 and A14 pages; all 72 prior catalog identities remain beside four scheme catalogs',()=>{assert.equal(D.SLIDES.length,76);assert.equal(D.SLIDES.filter(s=>!D.SCHEME_CATALOGUE_KEYS.includes(s[0])).length,72);assert.deepEqual(D.SLIDES.find(s=>s[0]==='iconcomponents'),['iconcomponents','Icon 元件','A13','Icon Components','A']);assert.equal(new Set(D.SLIDES.map(s=>s[0])).size,76);});
 for(const p of D.PRESETS){const m=D.buildModel(p,{only:['iconcomponents']}),s=m.slides[0];
  check(p.id+': 9 groups, no overlap, no warnings, native shapes only',()=>{assert.equal(m.slides.length,1);assert.equal(s.groups.length,9);assert.deepEqual(m.warns,[]);assert.deepEqual(O.overlaps(s),[]);assert.deepEqual(R.readOrder(s),[]);assert(s.items.every(i=>i.t!=='pic'));assert(s.items.filter(i=>i.ic).every(i=>i.kind==='custGeom'));assert(s.items.filter(i=>i.cx).every(i=>i.cx.a&&i.cx.b));});
  for(let gi=0;gi<s.groups.length;gi++){const g=s.groups[gi],items=s.items.slice(g.from,g.to+1),ix=items.findIndex(i=>i.ic),original=items[ix];assert(ix>=0);const labels={['iconcomponents:'+gi]:{[ix]:{from:original.ic.id,icon:'star'}}};
   const em=D.elementModel(p,'iconcomponents',gi,{labels});const replacement=em.slides[0].items.find(i=>i.ic&&i.ic.id==='star');assert(replacement);assert.equal(replacement.fill,original.fill);assert.equal(em.slides[0].groups.length,1);assert(em.slides[0].items.every(i=>i.t!=='pic'));assert(D.minFontOf(items)>=10);
   const exported=await D.exportPptx({PptxGenJS,JSZip},p,{model:em,type:'nodebuffer'}),zip=await JSZip.loadAsync(exported.data),xml=await zip.file('ppt/slides/slide1.xml').async('string');assert(xml.includes('<a:custGeom>'));assert(xml.includes('<p:grpSp>'));assert(!xml.includes('<p:pic>'));assert(xml.includes('圖示 '+D.ICONS.BY.star.zh));assert.equal(exported.model.connectors.fail,0);assert.equal(exported.model.connectors.one,0);
  }
  check(p.id+': all 9 individual assembled exports preserve editable icon replacement and grouping',()=>{});
 }
 check('Prototype property names cannot enter native icon model',()=>{const raw=D.buildModel(D.PRESETS[0],{only:['iconcomponents']}).slides[0],g=raw.groups[0],ix=raw.items.slice(g.from,g.to+1).findIndex(i=>i.ic);for(const id of ['constructor','__proto__','toString']){const m=D.elementModel(D.PRESETS[0],'iconcomponents',0,{labels:{'iconcomponents:0':{[ix]:{from:'groups',icon:id}}}});assert.equal(m.slides[0].items.find(i=>i.ic).ic.id,'groups');}});
 const all=D.buildModel(D.PRESETS[0],{examples:true});check('Full deck includes new page exactly once',()=>assert.equal(all.slides.filter(s=>s.key==='iconcomponents').length,1));
}
async function domSuite(){
 const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom');const errors=[],downloads=[];let blobs=0;
 class LocalResources extends ResourceLoader{fetch(url){const p=path.join(ROOT,path.basename(new URL(url).pathname));return fs.existsSync(p)?Promise.resolve(fs.readFileSync(p)):null;}}
 const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLCanvasElement|window.scrollTo/.test(e.message))errors.push(e.message);});
 const dom=new JSDOM(fs.readFileSync(path.join(ROOT,process.env.STUDIO_HTML||'studio.html'),'utf8'),{url:'http://studio.test/studio.html#/A13/iconcomponents',runScripts:'dangerously',resources:new LocalResources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.matchMedia=q=>({matches:false,media:q,addListener(){},addEventListener(){}});w.ResizeObserver=class{observe(){}disconnect(){}};w.IntersectionObserver=class{observe(){}disconnect(){}unobserve(){}};w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve()});w.scrollTo=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:t=>({width:String(t).length*50})});w.URL.createObjectURL=()=>`blob:test-${++blobs}`;w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){if(this.download)downloads.push(this.download);else this.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));};
 }});
 try{await new Promise((res,rej)=>{const t=setTimeout(()=>rej(Error('load timeout')),20000);dom.window.addEventListener('load',()=>{clearTimeout(t);res();});});await new Promise(r=>setTimeout(r,100));
  const w=dom.window,doc=w.document,$=s=>{const e=doc.querySelector(s);assert(e,'Missing '+s);return e;},click=s=>$(s).dispatchEvent(new w.MouseEvent('click',{bubbles:true})),input=(s,v)=>{const e=$(s);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));},escape=()=>doc.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  check('Deep link and sidebar expose A13 catalog, with nine selectable components',()=>{assert.equal(w.__studio.key,'iconcomponents');assert($('#pTree a[data-k="iconcomponents"]'));assert.equal(doc.querySelectorAll('#big g.el').length,9);assert.equal($('#iconCompHelp').hidden,false);});
  click('#big g.el[data-g="0"]');check('Selected icon component explicitly offers icon replacement',()=>assert.equal($('#ebar button[data-a="lbl"]').textContent,'換圖示／改字'));
  click('#ebar button[data-a="lbl"]');check('Existing editor includes 4 replaceable icons and individual SVG download',()=>{assert.equal($('#lbEd').hidden,false);assert.equal(doc.querySelectorAll('#lbList input[data-k]').length,4);assert.equal(doc.querySelectorAll('[data-icon-svg]').length,4);});
  click('[data-pick="0"]');input('#lbIcSearch','star');check('Visual picker reuses icon library search',()=>{assert($('#lbIcResults [data-icon="star"]'));assert($('#lbIcStatus').textContent.includes('找到'));});
  click('#lbIcResults [data-icon="star"]');check('Choosing icon stages a change without saving it',()=>{assert.equal($('#lbList input[data-k="0"]').value,'star');assert(!w.__studioApi.S.labels['iconcomponents:0']);});click('#lbCancel');
  click('#ebar button[data-a="lbl"]');check('Cancel discards staged replacement',()=>assert.equal($('#lbList input[data-k="0"]').value,'groups'));
  click('[data-pick="0"]');input('#lbIcSearch','not_a_real_icon_999');check('No-result state remains actionable',()=>{assert.equal(doc.querySelectorAll('#lbIcResults button').length,0);assert($('#lbIcStatus').textContent.includes('找不到'));});escape();check('Escape dismisses picker but keeps editor open',()=>{assert.equal($('#lbIcPicker').hidden,true);assert.equal($('#lbEd').hidden,false);});escape();check('Second Escape closes editor',()=>assert.equal($('#lbEd').hidden,true));
  click('#ebar button[data-a="lbl"]');click('[data-pick="0"]');input('#lbIcSearch','star');click('#lbIcResults [data-icon="star"]');input('#lbList input[data-k="0"]','invalid_stale_value');click('#lbOk');check('Invalid edited name never reuses stale picker selection',()=>{assert.equal($('#lbEd').hidden,false);assert.equal($('#lbList input[data-k="0"]').getAttribute('aria-invalid'),'true');assert(!w.__studioApi.S.labels['iconcomponents:0']);});
  for(const id of ['constructor','__proto__','toString']){input('#lbList input[data-k="0"]',id);click('#lbOk');check('Prototype name '+id+' is rejected without mutation',()=>{assert.equal($('#lbEd').hidden,false);assert.equal($('#lbList input[data-k="0"]').getAttribute('aria-invalid'),'true');assert(!w.__studioApi.S.labels['iconcomponents:0']);});}
  input('#lbList input[data-k="0"]','star');click('[data-icon-svg="0"]');check('Individual icon SVG follows current choice',()=>assert(downloads.includes('icon-star.svg')));click('#lbOk');
  check('Apply persists icon replacement and preserves native model',()=>{const labels=w.__studioApi.S.labels,m=D.buildModel(D.PRESETS[0],{only:['iconcomponents'],labels});assert(m.slides[0].items.some(i=>i.ic?.id==='star'&&i.kind==='custGeom'));assert.equal($('#lbEd').hidden,true);assert.equal(w.__studio.lastLabels.n,1);});
  click('#ebar button[data-a="lbl"]');check('Reopen restores saved replacement',()=>assert.equal($('#lbList input[data-k="0"]').value,'star'));click('[data-pick="0"]');click('#pTree a[data-k="icons"]');check('New navigation dismisses old editor and does not leak selection',()=>{assert.equal(w.__studio.key,'icons');assert.equal($('#lbEd').hidden,true);assert.equal($('#iconCompHelp').hidden,true);});
  click('#pTree a[data-k="iconcomponents"]');click('#big g.el[data-g="0"]');click('#ebar button[data-a="lbl"]');click('#lbReset');check('Restore resets replacement and keeps correct component selected',()=>{assert(!w.__studioApi.S.labels['iconcomponents:0']);assert.equal(w.__studio.key,'iconcomponents');assert.equal($('#ebar').classList.contains('on'),true);});
  click('#iconCompLibrary');check('Page helper opens existing standalone icon library',()=>{assert.equal(w.__studioApi.S.tab,'icons');assert.equal($('#vIcons').hidden,false);});click('#tabs [data-tab="slides"]');check('Returning from library retains component page',()=>assert.equal(w.__studio.key,'iconcomponents'));
  input('#pSearch','圖示元件');check('Chinese synonym finds Icon Components',()=>assert($('#pRes').textContent.includes('Icon 元件')));
  check('DOM harness has no uncaught page errors',()=>assert.deepEqual(errors,[]));
 }finally{dom.window.close();}
}
(async()=>{if(!process.argv.includes('--dom-only'))await modelSuite();if(!process.argv.includes('--model-only'))await domSuite();console.log(`${passed} Icon Components checks passed (model/export and optional DOM logic, not browser visual certification).`);})().catch(e=>{console.error(e);process.exitCode=1;});
