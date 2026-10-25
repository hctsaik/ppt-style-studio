/* State/anchor contracts only: no browser layout or PowerPoint claim. */
'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..'),D=require('../deck.js');
function script(name){if(!process.env.STUDIO_HTML)return fs.readFileSync(path.join(ROOT,name),'utf8');const html=fs.readFileSync(path.join(ROOT,process.env.STUDIO_HTML),'utf8'),tag='<script data-inlined="'+name+'">',start=html.indexOf(tag);assert(start>=0,'Missing inlined '+name);return html.slice(start+tag.length,html.indexOf('</script>',start));}
const source=script('stylekit.js'),data=script('stylekit-data.js');
const plain=v=>JSON.parse(JSON.stringify(v));
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
// A small DOM adapter exercises the actual generated anchor attributes and
// handlers. Browser geometry is deliberately outside this test's claim.
function harness({saved,bundled=false,mutate,storageThrows=false}={}){
 const store=new Map(saved?Object.entries(saved):[]),events=[],els=new Map(),styles=new Map();let html='',links=[];
 const parseAttrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
 const root={style:{setProperty(k,v){styles.set(k,v);}},querySelector:s=>els.get(s),querySelectorAll:s=>s==='[data-stylekit-file]'?links:[]};
 Object.defineProperty(root,'innerHTML',{get:()=>html,set(value){html=value;els.clear();links=[];
  for(const m of html.matchAll(/<(?:button|a)\b[^>]*\bid="[^"]+"[^>]*>/g)){const a=parseAttrs(m[0]),el={attrs:a,dataset:{},href:a.href||'',download:a.download||'',onclick:null};
   for(const [k,v]of Object.entries(a))if(k.startsWith('data-'))el.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;
   els.set('#'+a.id,el);if(a['data-stylekit-file'])links.push(el);
  }
  els.set('#skThemes',{onclick:null});
 }});
 const document={getElementById:id=>id==='vKit'?root:styles.has(id)?{}:null,createElement:()=>({}),head:{appendChild(s){styles.set(s.id,s.textContent);}},dispatchEvent(e){events.push(e);if(document.cancelDownloads&&e.type==='stylekit-download')e.preventDefault();return !e.defaultPrevented;}};
 class CustomEvent{constructor(type,options={}){this.type=type;Object.assign(this,options);this.defaultPrevented=false;}preventDefault(){if(this.cancelable)this.defaultPrevented=true;}}
 const context={window:null,document,CustomEvent,localStorage:{getItem:k=>{if(storageThrows)throw Error('storage unavailable');return store.get(k)||null;},setItem:(k,v)=>{if(storageThrows)throw Error('storage unavailable');store.set(k,v);}},Blob,Uint8Array,atob,URL:{createObjectURL:b=>'blob:test/'+b.size+'/'+Math.random()},Deck:D};context.window=context;
 vm.createContext(context);vm.runInContext(data,context);if(mutate)mutate(context.STYLEKIT_THEMES);
 if(bundled)context.STYLEKIT_B64=Object.fromEntries(context.STYLEKIT_THEMES.flatMap(t=>[t.id+'.pptx',t.id+'.potx',t.id+'_colors.xml'].map(f=>[f,Buffer.from(f).toString('base64')])));
 vm.runInContext(source,context);
 return{kit:context.StyleKit,root,document,store,events,context,html:()=>html,link:kind=>els.get('#sk'+({pptx:'Pptx',potx:'Potx',xml:'Xml'}[kind])),click(id){const el=els.get('#'+id);assert(el,'missing '+id);el.onclick();},download(kind){const event={defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};const el=this.link(kind);if(el.onclick)el.onclick(event);return event;}};
}
const p=id=>({...D.PRESETS.find(t=>t.id===id)});
const expected={navy:['1F4E79','1F3864','2E75B6'],wire:['4F5BD5','2B2B2B','E0533D'],green:['2F5D50','24483E','C9A227'],wine:['7A1F2B','5E1620','B08D57']};
for(const bundled of [false,true]){
 const mode=bundled?'embedded-asset mode':'relative-asset mode',h=harness({bundled});
 test(mode+': opening Kit then switching each built-in follows current values',()=>{
  for(const item of D.PRESETS){const input={...item};h.kit.sync(input,item.id);assert.equal(h.kit.state().id,item.id);assert.equal(h.kit.state().source,'follow');assert.equal(h.kit.current(),item.id);for(const kind of ['pptx','potx','xml']){const a=h.link(kind);assert.equal(a.dataset.stylekitTheme,item.id);assert.equal(a.dataset.stylekitFile,item.id+(kind==='xml'?'_colors.xml':'.'+kind));assert.equal(a.dataset.stylekitSource,'follow');assert.match(a.href,bundled?/^blob:test\//:/^stylekit\//);}
   if(expected[item.id]){const [main,deep,accent]=expected[item.id];assert(h.html().includes('background:#'+main));assert(h.html().includes('color:#'+deep));assert(h.html().includes('#'+accent));}
  }
 });
 test(mode+': stale base id cannot choose an unrelated asset',()=>{h.kit.sync(p('wine'),'navy');assert.equal(h.kit.state().id,'wine');assert.equal(h.link('pptx').dataset.stylekitFile,'wine.pptx');});
 test(mode+': old detached anchor cannot download after palette changes',()=>{h.kit.sync(p('navy'),'navy');const old=h.link('pptx');h.kit.sync(p('wine'),'wine');const e={defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};old.onclick(e);assert(e.defaultPrevented);});
 test(mode+': explicit independent choice survives global changes and reload',()=>{
  h.kit.selectTheme('forest');h.kit.sync(p('green'),'green');assert.equal(h.kit.state().id,'forest');assert.equal(h.kit.state().source,'independent');assert.match(h.html(),/全站改色不會覆蓋/);
  const restored=harness({saved:Object.fromEntries(h.store),bundled});restored.kit.sync(p('wine'),'wine');assert.equal(restored.kit.state().id,'forest');restored.click('skFollow');assert.equal(restored.kit.state().id,'wine');assert.equal(restored.kit.state().source,'follow');
  const follow=harness({saved:Object.fromEntries(restored.store),bundled});follow.kit.sync(p('green'),'green');assert.equal(follow.kit.state().id,'green');assert.equal(follow.kit.state().source,'follow');
 });
 test(mode+': custom P / PD / PT / A and neutral palette cannot download old files',()=>{
  h.kit.selectSource('follow');for(const key of ['P','PD','PT','A','ink','t2','mute','line','l2','fill']){const input={...p('navy'),[key]:'13AC57'};const before=JSON.stringify(input);h.kit.sync(input,'navy');assert.equal(h.kit.state().id,null,key);assert.equal(h.kit.state().downloadable,false,key);assert.equal(JSON.stringify(input),before);assert.match(h.html(),/自訂色尚未提供/);assert(!h.html().includes('id="skGal"'));for(const kind of ['pptx','potx','xml']){assert.equal(h.link(kind).attrs['aria-disabled'],'true');assert.equal(h.link(kind).attrs.href,undefined);assert.equal(h.link(kind).attrs.download,undefined);}}
 });
 test(mode+': warnings and appearance choices are not mistaken for a palette change',()=>{h.kit.sync({...p('wire'),size:'L',tBold:false,tFont:'Noto Sans TC',tbWidthMode:'45',semWarn:'D5A80C',semGood:'22AA33',semBad:'AA2233'},'wire');assert.equal(h.kit.state().id,'wire');assert.equal(h.kit.state().downloadable,true);});
 test(mode+': all thirteen explicit assets retain their independent color intent',()=>{for(const t of h.context.STYLEKIT_THEMES){h.kit.selectTheme(t.id);h.kit.sync({...p('navy'),P:'13AC57'},'navy');assert.equal(h.kit.state().id,t.id);for(const kind of ['pptx','potx','xml'])assert.equal(h.link(kind).dataset.stylekitTheme,t.id);}});
 test(mode+': custom palette recovers by returning to an actual preset',()=>{h.kit.selectSource('follow');h.kit.sync({...p('navy'),P:'13AC57'},'navy');h.kit.sync(p('green'),'green');assert.equal(h.kit.state().downloadable,true);assert.equal(h.kit.state().id,'green');});
 test(mode+': host can cancel any static asset download without fetching',()=>{h.document.cancelDownloads=true;for(const format of ['pptx','potx','xml']){assert(h.download(format).defaultPrevented);const e=h.events.at(-1);assert.equal(e.type,'stylekit-download');assert.equal(e.detail.format,format);assert.equal(e.detail.theme,'green');assert.equal(e.detail.source,'follow');assert.equal(e.detail.validation,'build-time-package');}h.document.cancelDownloads=false;assert(!h.download('pptx').defaultPrevented);});
}
test('asset main/deep/accent slot mutations are rejected, even with matching id',()=>{for(const alter of [t=>t.sc.acc[0]='D5A80C',t=>t.sc.dk2='13AC57',t=>t.sc.acc[4]='13AC57',t=>t.sc.acc[1]='13AC57']){const h=harness({mutate:themes=>alter(themes.find(t=>t.id==='navy'))});h.kit.sync(p('navy'),'navy');assert.equal(h.kit.state().downloadable,false);}});
test('malformed or unavailable storage safely defaults to following Studio',()=>{for(const options of [{saved:{'ppt-studio-stylekit-v1':'broken'}},{saved:{'ppt-studio-stylekit-v1':'{"source":"independent","id":"missing"}'}},{storageThrows:true}]){const h=harness(options);h.kit.sync(p('navy'),'navy');assert.equal(h.kit.state().id,'navy');h.kit.selectTheme('wine');assert.equal(h.kit.state().id,'wine');}});
console.log('Style Kit state/anchor contracts: '+checks+' passed; source '+(process.env.STUDIO_HTML||'stylekit.js'));
