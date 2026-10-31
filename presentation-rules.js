/* Opt-in rules for native models created in this studio, never imported PPTX. */
(function(root,factory){if(typeof module!=='undefined'&&module.exports)module.exports=factory();else root.PresentationRules=factory();})(this,function(){
 'use strict';
 const copy=x=>Array.isArray(x)?x.map(copy):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,copy(v)])):x;
 const DEFAULT={font:'Microsoft JhengHei',title:28,subtitle:18,body:20,note:12,margin:.65,titleTop:.38,titleHeight:.65,contentTop:1.9,radius:.07,line:1,semantic:{problem:'B44932',cause:'786449',action:'285EAD',result:'28714C',risk:'A65519'}};
 const ROLES={none:'未指定',problem:'問題',cause:'原因',action:'對策',result:'成果',risk:'風險'};
 const FONTS=['Microsoft JhengHei','Microsoft JhengHei Light','PMingLiU','Noto Sans TC','Arial','Georgia'];
 const KEYS=['typography','layout','shape','semantic'];
 function settings(raw={}){const o={...DEFAULT,...raw,semantic:{...DEFAULT.semantic,...raw.semantic}};
  if(!FONTS.includes(o.font))throw Error('字型名稱無效');
  const bounds={title:[16,60],subtitle:[10,40],body:[10,40],note:[8,24],margin:[.2,2],titleTop:[.1,1.5],titleHeight:[.3,1.5],contentTop:[1,3],radius:[0,.3],line:[.25,4]};
  for(const[k,[a,b]]of Object.entries(bounds))if(typeof o[k]!=='number'||!Number.isFinite(o[k])||o[k]<a||o[k]>b)throw Error('規則數值超出範圍：'+k);
  if(o.contentTop<o.titleTop+o.titleHeight+.1)throw Error('內容起點須在標題區下方');
  for(const k of Object.keys(DEFAULT.semantic))if(typeof o.semantic[k]!=='string'||!/^[\da-f]{6}$/i.test(o.semantic[k]))throw Error('語意色碼無效');
  return Object.fromEntries([...Object.keys(DEFAULT)].map(k=>[k,copy(o[k])]));
 }
 function blank(){return{version:1,settings:copy(DEFAULT),pages:{},exceptions:[],fixes:{}};}
 function pageKey(k){return typeof k==='string'&&/^[a-z][a-z0-9:-]{0,70}$/i.test(k)&&!['__proto__','constructor','prototype'].includes(k);}
 function clean(raw){if(!raw||raw.version!==1)throw Error('簡報規則版本不支援');const out=blank();out.settings=settings(raw.settings);
  if(!raw.pages||typeof raw.pages!=='object'||Array.isArray(raw.pages)||Object.keys(raw.pages).length>120)throw Error('頁面規則無效');
  for(const[k,v]of Object.entries(raw.pages)){if(!pageKey(k)||!v||typeof v!=='object')throw Error('頁面識別無效');out.pages[k]={};for(const c of KEYS)if(v[c])out.pages[k][c]=settings(v[c]);}
  if(!Array.isArray(raw.exceptions)||raw.exceptions.length>5000||raw.exceptions.some(k=>typeof k!=='string'||k.length>180))throw Error('例外清單無效');out.exceptions=[...new Set(raw.exceptions)];
  if(!raw.fixes||typeof raw.fixes!=='object'||Array.isArray(raw.fixes)||Object.keys(raw.fixes).length>5000)throw Error('修正清單無效');
  for(const[k,v]of Object.entries(raw.fixes)){if(!/^[a-z][a-z0-9:-]*:\d+:[^:]*:(font|size|x|y|w|h|adj|lw)$/i.test(k)||k.length>180||!v||!['font','size','x','y','w','h','adj','lw'].includes(v.prop))throw Error('修正無效');if(v.prop==='font'){settings({font:v.value});}else if(typeof v.value!=='number'||!Number.isFinite(v.value)||Math.abs(v.value)>100)throw Error('修正值無效');out.fixes[k]={prop:v.prop,value:v.value};}return out;
 }
 function assign(state,keys,categories,rule){const out=clean(state),p=settings(rule);out.settings=p;if(categories.includes('semantic')&&keys.some(k=>!k.startsWith('compare-')))throw Error('所選頁面未建立語意角色映射，請停用語意配色。');for(const k of keys){if(!pageKey(k)||k==='master')throw Error('請選取明確的頁面身份');out.pages[k]={...out.pages[k]};for(const c of categories){if(!KEYS.includes(c))throw Error('未知規則');out.pages[k][c]=copy(p);}}return out;}
 function role(it){return it.name==='標題'?'title':/副標|組合標籤/.test(it.name||'')?'subtitle':/頁碼|註腳|來源|註解|里程碑日期|里程碑狀態/.test(it.name||'')?'note':'body';}
 const editableText=it=>Array.isArray(it.runs)&&it.runs.length>0;
 function set(it,prop,value){if(prop==='font'||prop==='size'){if(!editableText(it))return;it.tx={...it.tx,[prop]:value};for(const r of it.runs)r.o={...r.o,[prop]:value};it.noAutoShrink=true;}else it[prop]=value;}
 function issueId(sl,it,i,prop){return sl.key+':'+i+':'+String(it.name||it.t).replace(/[:\n]/g,'_')+':'+prop;}
 function transform(sl,p,model){const W=sl.w||model.W||13.333,H=sl.h||model.H||7.5,title=sl.items.find(it=>it.name==='標題');
  if(title){title.x=p.margin;title.y=p.titleTop;title.w=Math.max(1,W-p.margin*2);title.h=p.titleHeight;}
  const items=sl.items.filter(it=>it!==title&&!/副標|頁碼|註腳|來源/.test(it.name||'')&&((it.t==='sp'&&it.y>=1.2&&it.w<W*.98)||(it.t==='ln'&&Math.min(it.y1,it.y2)>=1.2)));
  if(!items.length)return;
  const x0=Math.min(...items.map(it=>it.t==='ln'?Math.min(it.x1,it.x2):it.x)),x1=Math.max(...items.map(it=>it.t==='ln'?Math.max(it.x1,it.x2):it.x+it.w)),y0=Math.min(...items.map(it=>it.t==='ln'?Math.min(it.y1,it.y2):it.y));
  const k=(W-p.margin*2)/Math.max(.1,x1-x0),x=v=>p.margin+(v-x0)*k,y=v=>p.contentTop+(v-y0)*k;
  for(const it of items)if(it.t==='ln'){it.x1=x(it.x1);it.x2=x(it.x2);it.y1=y(it.y1);it.y2=y(it.y2);}else{it.x=x(it.x);it.y=y(it.y);it.w*=k;it.h*=k;if(it.points)it.points=it.points.map(q=>{const v=copy(q);for(const z of ['x','y'])if(typeof v[z]==='number')v[z]*=k;if(v.curve)for(const z of ['x1','x2','y1','y2','wR','hR'])if(typeof v.curve[z]==='number')v.curve[z]*=k;return v;});}
  for(const g of sl.groups||[])if(g.y>=y0-.01){g.x=x(g.x);g.y=y(g.y);g.w*=k;g.h*=k;}
  if(sl.items.some(it=>it.y+it.h>H+.01))sl.ruleOverflow=true;
 }
 function apply(model,state){const affected=k=>!!state.pages[k]||Object.keys(state.fixes).some(id=>id.startsWith(k+':'));const out={...model,slides:model.slides.map(sl=>affected(sl.key)?copy(sl):sl)};for(const sl of out.slides){if(!affected(sl.key))continue;const p=state.pages[sl.key];if(p){if(p.layout)transform(sl,p.layout,model);sl.items.forEach(it=>{if(p.typography&&editableText(it)){set(it,'font',p.typography.font);set(it,'size',p.typography[role(it)]);}if(p.shape){if(it.kind==='roundRect')it.adj=p.shape.radius;if(it.t==='sp'&&it.line&&it.lw>0)it.lw=p.shape.line;if(it.t==='ln')it.w=p.shape.line;}});}
   sl.items.forEach((it,i)=>{const original=model.slides.find(s=>s.key===sl.key).items[i];for(const prop of ['font','size','x','y','w','h','adj','lw']){const id=issueId(sl,it,i,prop),fix=state.fixes[id];if(state.exceptions.includes(id)){if(prop==='font'||prop==='size'){if(original.tx&&Object.hasOwn(original.tx,prop))it.tx[prop]=original.tx[prop];(it.runs||[]).forEach((r,n)=>{const o=original.runs[n].o||{};if(Object.hasOwn(o,prop))r.o[prop]=o[prop];else delete r.o[prop];});}else if(Object.hasOwn(original,prop))it[prop]=original[prop];else delete it[prop];}else if(fix)set(it,fix.prop,fix.value);}});
  }return out;}
 function inspect(model,keys,rule,state){const p=settings(rule),issues=[];for(const sl of model.slides.filter(s=>keys.includes(s.key)))sl.items.forEach((it,i)=>{
  const checks=[];if(editableText(it)){checks.push(['font',p.font,'字型']);checks.push(['size',p[role(it)],'字級']);}
  if(it.name==='標題')checks.push(['x',p.margin,'標題左緣'],['y',p.titleTop,'標題位置'],['h',p.titleHeight,'標題高度']);
  if(it.kind==='roundRect')checks.push(['adj',p.radius,'圓角']);if(it.t==='sp'&&it.line&&it.lw>0)checks.push(['lw',p.line,'線條粗細']);if(it.t==='ln')checks.push(['w',p.line,'線條粗細']);
  for(const[prop,value,label]of checks){const values=prop==='font'||prop==='size'?it.runs.map(r=>(r.o||{})[prop]??(it.tx||{})[prop]):[it[prop]];if(values.every(v=>typeof value==='number'?typeof v==='number'&&Math.abs(v-value)<.001:v===value))continue;const id=issueId(sl,it,i,prop);issues.push({id,key:sl.key,index:i,prop,value,label,page:sl.title||sl.key,item:it.name||'元件 '+(i+1),actual:[...new Set(values)].join('／'),except:state.exceptions.includes(id)});}
 });return issues;}
 function fix(state,issue){const out=clean(state);out.fixes[issue.id]={prop:issue.prop,value:issue.value};out.exceptions=out.exceptions.filter(k=>k!==issue.id);return out;}
 function except(state,id){const out=clean(state);out.exceptions=out.exceptions.includes(id)?out.exceptions.filter(k=>k!==id):[...out.exceptions,id];return out;}
 function favorites(raw,known){if(!Array.isArray(raw)||raw.length>120)throw Error('最愛清單無效');return [...new Set(raw.filter(k=>typeof k==='string'&&known.includes(k)))];}
 return Object.freeze({DEFAULT,ROLES,KEYS,FONTS,settings,blank,clean,assign,apply,inspect,fix,except,favorites,role});
});
