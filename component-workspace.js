/* Purpose discovery, ordered page packs and one-content layout comparisons.
 * Reuses the Deck renderer/exporter; no network, storage or document mutation. */
(function(root,factory){'use strict';if(typeof module!=='undefined'&&module.exports)module.exports=factory(require('./deck.js'));else root.ComponentWorkspace=factory(root.Deck);})(this,function(D){
 'use strict';
 const PURPOSES=Object.freeze([
  {id:'conclusion',label:'結論',keys:['decide','quote','quote2','frame','pitch','schemebody','schemeiconbody'],words:['結論','建議','決策','下一步','總結']},
  {id:'compare',label:'對比',keys:['cmp','asis','cmp2','cmp3','schemebody','schemeiconbody'],words:['對比','比較','差異','優劣','vs']},
  {id:'risk',label:'風險',keys:['mtx','rating','rca','rca2','annot','emph'],words:['風險','異常','警示','問題']},
  {id:'flow',label:'流程',keys:['flow','flow2','patterns','patterns2','flex','steps','conn','conn2','tline'],words:['流程','步驟','程序','sop']},
  {id:'kpi',label:'KPI',keys:['kpi','chart','cmp','rating'],words:['kpi','指標','績效','數字','成果']}
 ].map(x=>Object.freeze({...x,keys:Object.freeze(x.keys),words:Object.freeze(x.words)})));
 const clone=x=>JSON.parse(JSON.stringify(x));
 const norm=x=>String(x||'').toLowerCase().replace(/\s+/g,'');
 function purposeWords(key){return PURPOSES.filter(p=>p.keys.includes(key)).flatMap(p=>[p.label,...p.words]).join(' ');}
 function purposeMatches(key,query){const q=norm(query);return !!q&&PURPOSES.some(p=>p.keys.includes(key)&&p.words.some(w=>norm(w)===q));}
 function cleanPages(keys){if(!Array.isArray(keys))throw Error('素材包頁面清單無效');if(keys.length>80)throw Error('素材包最多 80 頁');const known=new Set(D.SLIDES.map(s=>s[0])),seen=new Set();return keys.map(k=>{if(typeof k!=='string'||!known.has(k)||seen.has(k))throw Error('素材包含未知或重複頁面');seen.add(k);return k;});}
 function pageModel(params,keys,labels){keys=cleanPages(keys);if(!keys.length)throw Error('請先加入元件頁');const model=D.buildModel(params,{only:keys,labels:clone(labels||{}),examples:true}),map=new Map(model.slides.map(s=>[s.key,s]));model.slides=keys.map(k=>{if(!map.has(k))throw Error('找不到元件頁 '+k);return map.get(k);});const keep=new Set(keys);for(const sl of model.slides)for(const it of sl.items)for(const r of it.runs||[])if(r.o.link&&!keep.has(r.o.link))delete r.o.link;return model;}
 function packPlan(params,keys,labels){const model=pageModel(params,keys,labels),kinds=new Set(model.slides.map(s=>s.schemeCatalogue?'long':'standard'));
  if(kinds.size===1)return{kind:'pptx',models:[model],keys:keys.slice()};
  // PowerPoint has one slide size per file. Preserve native dimensions by
  // packaging mixed sizes as numbered PPTX files, never stretching shapes.
  return{kind:'zip',models:keys.map(k=>pageModel(params,[k],labels)),keys:keys.slice()};
 }
 const LAYOUTS=Object.freeze([{id:'single',label:'單欄'},{id:'double',label:'雙欄'},{id:'cards',label:'卡片'},{id:'beforeafter',label:'改善前／後'},{id:'cause',label:'問題／原因／對策'},{id:'timeline',label:'里程碑／進度'}].map(Object.freeze));
 const LOOKS=Object.freeze([{id:'soft',label:'淺底深字'},{id:'solid',label:'主色白字'},{id:'outline',label:'白底描邊'}].map(Object.freeze));
 function content(input){if(!input||typeof input.title!=='string'||typeof input.body!=='string')throw Error('請輸入標題與內文');if(input.title.length>80||input.body.length>2400)throw Error('標題最多 80 字、內文最多 2400 字；請分頁呈現');if(D.stripCtl(input.title)!==input.title||D.stripCtl(input.body)!==input.body)throw Error('文字含無法匯出的控制字元');const paragraphs=input.body.replace(/\r\n?/g,'\n').split('\n');if(paragraphs.length>6)throw Error('最多 6 項，每項一行；請把多餘內容分到另一頁');if(!paragraphs.some(s=>s.trim()))throw Error('請輸入內文');return{title:input.title,paragraphs};}
 function options(input={}){const o={look:'soft',rule:'auto',ratio:1,focus:1,accents:null,icons:[],roles:[],semantic:null,...input};if(!LOOKS.some(l=>l.id===o.look)||!['auto','same','each','focus'].includes(o.rule)||![1,.5,1/3].includes(o.ratio)||!Number.isInteger(o.focus)||o.focus<1||o.focus>6)throw Error('呈現設定無效');if(o.accents!==null&&(!Array.isArray(o.accents)||o.accents.length!==6||o.accents.some(c=>! /^[A-Fa-f0-9]{6}$/.test(c))))throw Error('配色必須包含六個有效色碼');if(!Array.isArray(o.icons)||o.icons.length>6||o.icons.some(id=>id!==''&&!(D.ICONS&&D.ICONS.BY[id])))throw Error('圖示選取無效');if(!Array.isArray(o.roles)||o.roles.length>6||o.roles.some(r=>!['none','problem','cause','action','result','risk'].includes(r)))throw Error('語意角色無效');if(o.semantic&&Object.values(o.semantic).some(c=>! /^[A-Fa-f0-9]{6}$/.test(c)))throw Error('語意色無效');return clone(o);}
 function luminance(h){const rgb=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
 function whiteFill(c){let out=c;for(let k=0;k<=10&&(1.05/(luminance(out)+.05))<4.5;k++)out=D.mix(c,'000000',Math.min(1,(k+1)/10));return out;}
 function presentationParams(params,settings={}){const o=options(settings),p={...D.BASE,...params};if(o.accents){p.P=o.accents[0];p.PD=D.mix(p.P,'000000',.35);p.PT=D.mix(p.P,'FFFFFF',.9);p.A=o.accents[1];p.useA=true;}return p;}
 // Presentation-only parsing: the original line remains in comparison.paragraphs
 // and in the editor. Ambiguous/malformed input is displayed verbatim as an event.
 function milestone(value){const parts=value.split(/[|｜]/);return parts.length===3&&parts[1].trim()?{raw:value,date:parts[0].trim(),event:parts[1].trim(),status:parts[2].trim(),parsed:true}:{raw:value,date:'',event:value,status:'',parsed:false};}
 function textHeight(value,width,size){
  // Conservative content height, not a font-size adjustment. Keep the original
  // text and point size; preflight still reports over-full slide bounds.
  const max=Math.max(.1,width)*.9;let lines=0;
  for(const paragraph of String(value).split('\n')){let used=0,count=1;for(const token of paragraph.match(/[A-Za-z0-9]+(?:[.,:/_-][A-Za-z0-9]+)*|[^A-Za-z0-9]/gu)||[]){const w=D.tw(token,size);if(used>0&&used+w>max){count++;used=0;}if(w>max){const n=Math.ceil(w/max);count+=n-1;used=w-(n-1)*max;}else used+=w;}lines+=count;}
  return Math.max(1,lines)*size/72*1.2+.08;
 }
 function comparison(params,input,layout,settings={}){if(!LAYOUTS.some(l=>l.id===layout))throw Error('未知版型');const c=content(input),o=options(settings),p=presentationParams(params,o),model=D.buildModel(p,{compose:{title:c.title}}),sl=model.slides[0];sl.key='compare-'+layout;sl.title=c.title||'版型比較';sl.no=1;sl.groups=[];
  const title=sl.items.find(it=>it.name==='標題');if(title){title.noAutoShrink=true;title.runs=[{t:c.title,o:{font:p.tFont,size:p.tSize,color:p.P,bold:p.tBold}}];title.tx.size=p.tSize;}
  const n=c.paragraphs.length,gap=.22,top=1.9,bottom=6.9,width=(D.W-1.3)*o.ratio,left=(D.W-width)/2,pad=.2;
  const accents=o.accents||[p.P,p.useA?p.A:p.PD,p.PD,D.mix(p.P,'FFFFFF',.25),D.mix(p.P,'000000',.15),D.mix(p.P,p.useA?p.A:p.PD,.5)];
  const font=p.bFont||'Microsoft JhengHei',size=20,inkDark='263746';
  const text=(value,name,x,y,w,h,color,bold=false,pt=size)=>({t:'sp',kind:null,x,y,w,h,name,noAutoShrink:true,runs:[{t:value,o:{size:pt,font,bold,color}}],tx:{align:'left',valign:'top',margin:0,lsp:1.15,font,size:pt,color,bold}});
  const roleOf=(i,col)=>o.roles[i]&&o.roles[i]!=='none'?o.roles[i]:layout==='cause'?['problem','cause','action'][col]:null;
  const roleNames={problem:'問題',cause:'原因',action:'對策',result:'成果',risk:'風險'};
  const baseOf=(i,col)=>o.semantic&&roleOf(i,col)?o.semantic[roleOf(i,col)]:o.rule==='focus'&&i!==o.focus-1?'7D8795':o.rule==='auto'&&layout==='beforeafter'&&col===0?'727D8B':accents[o.rule==='each'?i%6:0];
  const paintOf=base=>({fill:o.look==='solid'?whiteFill(base):o.look==='soft'?D.mix(base,'FFFFFF',.9):'FFFFFF',ink:o.look==='solid'?'FFFFFF':inkDark});
  const box=(i,x,y,w,h,base)=>({t:'sp',kind:'roundRect',x,y,w,h,adj:.07,name:'內容容器 '+(i+1),fill:paintOf(base).fill,ft:0,line:o.look==='outline'?base:D.mix(base,'FFFFFF',.55),lw:o.look==='outline'?1.25:.65,dash:'solid',...(layout==='cards'?{sh:{blur:3,dist:1,dir:90,alpha:.12,scale:1,color:'000000',kind:'drop'}}:{})});
  const addIcon=(i,x,y,ink)=>{if(!o.icons[i])return;const q=D.ICONS.geom('line',400),iw=.28;sl.items.push({t:'sp',kind:'custGeom',x,y,w:iw,h:iw,name:'原位圖示 '+(i+1),fill:ink,ft:0,line:null,lw:0,points:D.ICONS.points(o.icons[i],iw,q.k,q.off,q.wt),ic:{id:o.icons[i],variant:'line',wt:400}});};
  if(layout==='timeline'){
   const entries=c.paragraphs.map(milestone),dateW=Math.min(1.15,width*.2),nodeX=left+dateW+.13,x=nodeX+.24,w=left+width-x,hasIcons=o.icons.some(Boolean),slot=hasIcons?.38:0,tw=w-pad*2-slot;
   const heights=entries.map(v=>Math.max(.9,pad*2+textHeight(v.event,tw,size)+((v.status||o.semantic&&o.roles.some(r=>r!=='none'))?.12+textHeight(v.status||'狀態',tw,13):0),textHeight(v.date,dateW,14)+pad*2));
   let y=top;entries.forEach((v,i)=>{const h=heights[i],base=baseOf(i,0),ink=paintOf(base).ink,from=sl.items.length;
    if(i<entries.length-1)sl.items.push({t:'ln',x1:nodeX,y1:y+.22,x2:nodeX,y2:y+h+gap+.22,color:D.mix(base,'FFFFFF',.55),w:1.5});
    sl.items.push({t:'sp',kind:'ellipse',x:nodeX-.065,y:y+.155,w:.13,h:.13,name:'里程碑節點 '+(i+1),fill:base,ft:0,line:null,lw:0});
    sl.items.push(text(v.date||String(i+1).padStart(2,'0'),'里程碑日期 '+(i+1),left,y+.13,dateW,h-.2,inkDark,true,14));
    sl.items.push(box(i,x,y,w,h,base));addIcon(i,x+pad,y+pad,ink);
    const eh=textHeight(v.event,tw,size);sl.items.push(text(v.event,'共同內文 '+(i+1),x+pad+slot,y+pad,tw,eh,ink,true));
    const status=[o.semantic&&roleOf(i,0)?roleNames[roleOf(i,0)]:'',v.status].filter(Boolean).join(' · ');if(status)sl.items.push(text(status,'里程碑狀態 '+(i+1),x+pad+slot,y+pad+eh+.12,tw,textHeight(status,tw,13),ink,false,13));
    sl.groups.push({name:'里程碑 '+(i+1),from,to:sl.items.length-1,x:left,y,w:width,h});y+=h+gap;
   });
   model.comparison={layout,title:c.title,paragraphs:c.paragraphs.slice(),milestones:entries,options:o,region:{x:left,y:top,w:width,h:bottom-top}};return model;
  }
  // Three short cards use three equal columns on a full slide. Narrow regions
  // use a single tidy column; odd last rows are centered, never a 2+1 hole.
  const cols=layout==='single'?1:layout==='cause'?3:layout==='cards'?(width<8?(n%2===0&&width>=5?2:1):(n===1?1:n===3||n===5?3:2)):2,entries=c.paragraphs.slice();
  if(['beforeafter','cause'].includes(layout))while(entries.length%cols)entries.push('');
  const rows=Math.ceil(entries.length/cols),w=(width-(cols-1)*gap)/cols,slots=entries.map((value,i)=>({value,i,col:layout==='double'?Math.floor(i/rows):i%cols,row:layout==='double'?i%rows:Math.floor(i/cols)}));
  const hasIcons=o.icons.some(Boolean),iconSlot=hasIcons?.38:0,tw=w-pad*2-iconSlot,hasHeading=['beforeafter','cause'].includes(layout)||!!(o.semantic&&o.roles.some(r=>r!=='none')),headingH=hasHeading?.38:0;
  const heights=Array.from({length:rows},(_,r)=>Math.max(layout==='cards'?1.35:hasHeading?1.45:.8,...slots.filter(e=>e.row===r).map(e=>pad*2+headingH+textHeight(e.value,tw,size))));
  slots.forEach(({value,i,col,row})=>{const inRow=slots.filter(e=>e.row===row).length,center=layout==='cards'?(cols-inRow)*(w+gap)/2:0,x=left+center+col*(w+gap),y=top+heights.slice(0,row).reduce((a,b)=>a+b+gap,0),h=heights[row],from=sl.items.length,base=baseOf(i,col),ink=paintOf(base).ink;
   sl.items.push(box(i,x,y,w,h,base));let tx=x+pad+iconSlot,ty=y+pad,th=h-pad*2;
   const heading=o.semantic&&roleOf(i,col)?roleNames[roleOf(i,col)]:layout==='beforeafter'?(col===0?'改善前':'改善後'):layout==='cause'?['問題','原因','對策'][col]:'';
   if(heading){sl.items.push(text(heading,'組合標籤 '+(i+1),x+pad,ty,w-pad*2,.28,ink,true,13));ty+=headingH;th-=headingH;}
   // Reserve the icon gutter for every member of the set, including a member
   // with no icon. An icon swap/removal never shifts the content baseline.
   addIcon(i,x+pad,ty,ink);sl.items.push(text(value,'共同內文 '+(i+1),tx,ty,tw,Math.max(.1,th),ink));
   sl.groups.push({name:(heading?heading+'・':'')+'項目 '+(i+1),from,to:sl.items.length-1,x,y,w,h});
  });
  model.comparison={layout,title:c.title,paragraphs:c.paragraphs.slice(),options:o,region:{x:left,y:top,w:width,h:bottom-top}};return model;
 }
 function recommendations(layout){return(layout==='beforeafter'?['cmp2','cmp3','decide','cards']:layout==='timeline'?['steps','flow','tline','decide']:layout==='cause'?['rca','rca2','emph','decide']:['decide','cards','patterns','cmp2']).filter(k=>D.SLIDES.some(s=>s[0]===k));}
 return Object.freeze({PURPOSES,purposeWords,purposeMatches,cleanPages,pageModel,packPlan,LAYOUTS,LOOKS,content,options,presentationParams,comparison,milestone,recommendations,luminance});
});
