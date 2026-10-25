/* Focused native quick styles. Web theme roles and intentionally fixed common colors
 * are separate contracts. Preview and download consume the same Deck model. */
(function(root,factory){
 'use strict';
 if(typeof module!=='undefined'&&module.exports)module.exports=factory(require('./deck.js'));
 else root.QuickStyles=factory(root.Deck);
})(typeof window!=='undefined'?window:this,function(D){
 'use strict';
 const COMMON=Object.freeze([
  ['red','紅','D95D68'],['yellow','黃','E7BF4A'],['blue','藍','4E83CE'],
  ['green','綠','4B9679'],['gray','灰','7D8795'],['purple','紫','9371C6'],['white','白','FFFFFF']
 ].map(([key,label,color])=>Object.freeze({key,label,color})));
 const ROLES=Object.freeze([{key:'main',label:'主色',role:'P'},{key:'deep',label:'深色',role:'PD'},{key:'light',label:'淺色',role:'PT'}]);
 const STYLES=Object.freeze([
  {key:'soft',label:'柔底',hint:'柔和分組與短說明'},
  {key:'outline',label:'細框',hint:'乾淨留白的選項框'},
  {key:'solid',label:'實心',hint:'醒目的主題與節點'},
  {key:'side',label:'側邊條',hint:'摘要與內容重點'},
  {key:'marker',label:'全字柔帶',hint:'24% 不透明度的柔和底帶'},
  {key:'underline',label:'下緣半筆',hint:'35% 不透明度的下緣底帶'}
 ]);
 const clone=x=>JSON.parse(JSON.stringify(x));
 const hex=(x,fallback)=>/^[0-9a-f]{6}$/i.test(String(x||''))?String(x).toUpperCase():fallback;
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const records=new WeakMap();
 function normalizeState(value){
  const v=value&&typeof value==='object'?value:{},source=v.source==='common'?'common':'theme';
  const themeKey=ROLES.some(x=>x.key===(v.themeKey||(source==='theme'&&v.colorKey)))?(v.themeKey||v.colorKey):'main';
  const commonKey=COMMON.some(x=>x.key===(v.commonKey||(source==='common'&&v.colorKey)))?(v.commonKey||v.colorKey):'red';
  return {version:1,source,themeKey,commonKey,style:STYLES.some(x=>x.key===v.style)?v.style:'soft',
   text:typeof v.text==='string'?v.text:'重點說明',width:Number.isFinite(v.width)&&v.width>0?v.width:3.4,height:Number.isFinite(v.height)&&v.height>0?v.height:1};
 }
 function palette(params,source){
  if(source==='common')return COMMON.map(x=>({...x}));
  const p=Object.assign({},D.BASE,params||{});
  return ROLES.map(x=>({...x,color:hex(p[x.role],D.BASE[x.role])}));
 }
 function selectedColor(params,state){const s=normalizeState(state),key=s.source==='common'?s.commonKey:s.themeKey;return palette(params,s.source).find(x=>x.key===key);}
 function foreground(bg){return D.contrastOf('303640',bg)>=D.contrastOf('FFFFFF',bg)?'303640':'FFFFFF';}
 function buildModel(params,value){
  const state=normalizeState(value),p=Object.assign({},D.BASE,clone(params||{})),color=selectedColor(p,state),c=color.color;
  const style=STYLES.find(x=>x.key===state.style),isMarker=['marker','underline'].includes(state.style),transparent=state.style==='outline'||isMarker;
  const darkIntent=c==='FFFFFF'&&transparent,ink=darkIntent?'FFFFFF':'303640',font=p.bFont||p.tFont||'Microsoft JhengHei';
  const w=state.width,h=state.height,x=(D.W-w)/2,y=(D.H-h)/2,padX=14/72,padY=10/72,items=[];
  const shape=(name,sx,sy,sw,sh,fill,line,lw,ft,r)=>({t:'sp',kind:r?'roundRect':'rect',name,x:sx,y:sy,w:sw,h:sh,fill:fill||null,line:line||null,lw:lw||0,ft:ft||0,dash:'solid',adj:r||0});
  const text=(name,sx,sy,sw,sh,t,fg)=>({t:'sp',kind:null,name,x:sx,y:sy,w:sw,h:sh,noAutoShrink:true,
   runs:String(t).split('\n').map((line,i,a)=>({t:line,o:{size:20,font,bold:false,color:fg,...(i<a.length-1?{br:true}:{})}})),
   tx:{align:'left',valign:'middle',margin:0,lsp:1,font,size:20,color:fg,bold:false,wrap:1}});
  const soft=D.mix(c,'FFFFFF',.9);
  if(!isMarker){
   items.push(shape(style.label+'底座',x,y,w,h,state.style==='outline'?null:state.style==='solid'?c:soft,state.style==='outline'?c:null,state.style==='outline'?1.25:0,0,7/72));
   if(state.style==='side')items.push(shape('3 pt 側邊條',x,y+7/72,3/72,h-14/72,c,null,0,0,0));
   items.push(text('快速樣式文字',x+padX,y+padY,w-padX*2,h-padY*2,state.text,state.style==='solid'?foreground(c):ink));
  }else{
   // Explicit lines remain separate native text boxes. Long lines stay at 20 pt;
   // the shared export check can ask the user to wrap or shorten instead of shrinking.
   const lines=state.text.split('\n'),lineH=24/72,total=lines.length*lineH,top=y+(h-total)/2;
   lines.forEach((line,i)=>{
    const ly=top+i*lineH,bandH=(state.style==='marker'?22:11)/72,bandY=state.style==='marker'?ly+1/72:ly+13/72;
    const bandW=Math.min(w-padX*2,Math.max(.15,D.tw(line,20)+.1));
    const band=shape(style.label+'第 '+(i+1)+' 行底帶',x+padX-.025,bandY,bandW,bandH,c,null,0,state.style==='marker'?76:65,2/72);
    const label=text('螢光筆文字第 '+(i+1)+' 行',x+padX,ly,w-padX*2,lineH,line,ink);
    label.tx.wrap=0;label.quickStyleLine=true;items.push(band,label);
   });
  }
  const minY=Math.min(y,...items.map(i=>i.y)),maxY=Math.max(y+h,...items.map(i=>i.y+i.h));
  const group={name:style.label+'・'+color.label,from:0,to:items.length-1,x,y:minY,w,h:maxY-minY,quickStyle:state.style,
   backgroundIntent:darkIntent?'dark':'any',previewOnlyBackground:c==='FFFFFF'?'252A34':null};
  const slide={key:'quickstyle-'+state.style,title:group.name,no:1,items,groups:[group],backgroundIntent:group.backgroundIntent};
  return {params:p,slides:[slide],warns:[],quickStyle:{version:1,selection:clone(state),baseColor:c,source:state.source,
   backgroundIntent:group.backgroundIntent,previewOnlyBackground:group.previewOnlyBackground,nativeColorMode:'rgb',editable:'shape-text-group'}};
 }
 function snapshot(params,state){const selection=normalizeState(state),model=buildModel(params,selection);return {model,params:clone(model.params),selection:clone(selection),filename:'快速樣式-'+model.slides[0].title+'.pptx'};}
 function preview(model,id){return D.elementSvg(model.slides[0],0,{bg:false,pad:12,id:id||'qs'}).svg;}
 const CSS=`.qs{color:#303640;max-width:1120px;margin:auto}.qs h3{font-size:20px;margin:0 0 8px}.qsLead,.qsNote{font-size:13px;line-height:1.6;color:#595959}.qsSources,.qsColors{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.qs button{font:inherit;cursor:pointer}.qs button:disabled{cursor:wait;opacity:.65}.qsSources button,.qsColors button{padding:8px 12px;border:1px solid #D7DBE1;background:#fff;border-radius:7px;color:#303640}.qs button[aria-pressed=true]{outline:2px solid var(--qsP,#1F4E79);outline-offset:2px}.qsColors i{width:18px;height:18px;display:inline-block;border:1px solid #C8CDD3;border-radius:50%;vertical-align:-4px;margin-right:6px}.qsText{display:block;font-size:13px;font-weight:600}.qs textarea{box-sizing:border-box;width:100%;min-height:76px;padding:12px;margin-top:6px;border:1px solid #C7CDD5;border-radius:7px;color:#303640;font:16px 'Microsoft JhengHei',sans-serif;resize:vertical}.qsGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:18px 0}.qsCard{min-width:0;text-align:left;border:1px solid #DCE0E6;border-radius:9px;background:#fff;padding:10px;color:#303640}.qsCard strong{display:block;font-size:14px;margin:2px 2px 8px}.qsCard small{display:block;font-size:11px;color:#69717C;margin:8px 2px 2px}.qsPreview{display:flex;align-items:center;justify-content:center;min-height:125px;border-radius:6px;overflow:hidden;background:#F8F9FB}.qsPreview.dark{background:#252A34}.qsPreview svg{display:block;width:100%;height:auto;max-height:160px}.qsActions{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.qsDownload{padding:10px 18px;border:0;border-radius:7px;background:var(--qsP,#1F4E79);color:#fff;font-weight:700!important}.qsStatus{font-size:13px;color:#595959}.qsWhite{padding:9px 12px;border-left:3px solid #7D8795;font-size:12px;background:#F2F4F6}.qsNote{font-size:12px}@media(max-width:780px){.qsGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.qsGrid{grid-template-columns:1fr}}`;
 function render(container,params,options){
  if(!container)return;
  options=options||{};let r=records.get(container);
  if(!r){r={state:normalizeState(options.state),params:{},options:{},busy:false,status:''};records.set(container,r);}
  else if(options.state)r.state=normalizeState(options.state);
  r.params=clone(params||{});r.options=options;
  const doc=container.ownerDocument;
  if(!doc.getElementById('quickStylesCss')){const css=doc.createElement('style');css.id='quickStylesCss';css.textContent=CSS;doc.head.appendChild(css);}
  const notify=()=>{if(typeof r.options.onChange==='function')r.options.onChange(clone(r.state));};
  function paintCards(){
   const color=selectedColor(r.params,r.state),white=color.color==='FFFFFF';
   container.querySelector('[data-qs-cards]').innerHTML=STYLES.map((s,i)=>{
    const m=buildModel(r.params,{...r.state,style:s.key});return `<button type="button" class="qsCard" data-qs-style="${s.key}" aria-pressed="${r.state.style===s.key}"${r.busy?' disabled':''}><strong>${s.label}</strong><span class="qsPreview${white?' dark':''}">${preview(m,'qs'+i)}</span><small>${s.hint}</small></button>`;
   }).join('');
   const whiteNote=container.querySelector('[data-qs-white]');whiteNote.hidden=!white;
   container.querySelector('[data-qs-note]').textContent=['marker','underline'].includes(r.state.style)?'螢光筆是可編輯底帶＋文字群組，不是逐字 highlight。長行請手動換行；在 PowerPoint 改字後可解組調整底帶，整組縮放會一起縮放。':'原生方塊與文字可解組編輯；長文字維持 20 pt，不會自動縮小。';
  }
  function draw(){
   const s=r.state,colors=palette(r.params,s.source),key=s.source==='common'?s.commonKey:s.themeKey;
   container.innerHTML=`<section class="qs"><h3>快速樣式與柔和螢光筆</h3><p class="qsLead">選一個顏色，預覽六款實用元件。文字與形狀皆可在 PowerPoint 編輯。</p><div class="qsSources" aria-label="顏色來源"><button type="button" data-qs-source="theme" aria-pressed="${s.source==='theme'}">主題色</button><button type="button" data-qs-source="common" aria-pressed="${s.source==='common'}">常用色</button></div><p class="qsNote">${s.source==='theme'?'跟隨目前全站主題與自訂色。':'固定常用色，不隨全站主題改變。'}</p><div class="qsColors" aria-label="選擇顏色">${colors.map(c=>`<button type="button" data-qs-color="${c.key}" aria-pressed="${c.key===key}" title="#${c.color}"><i style="background:#${c.color}"></i>${c.label}</button>`).join('')}</div><label class="qsText">元件文字<textarea data-qs-text rows="2" spellcheck="false"></textarea></label><p class="qsWhite" data-qs-white hidden>白色保留真白。透明樣式適合深底簡報；深色預覽底板不會匯出。</p><div class="qsGrid" data-qs-cards></div><div class="qsActions"><button type="button" class="qsDownload" data-qs-download${r.busy?' disabled':''}>${r.busy?'正在檢查與準備…':'下載此元件 .pptx'}</button><span class="qsStatus" role="status" data-qs-status>${esc(r.status)}</span></div><p class="qsNote" data-qs-note></p><p class="qsNote">網站換主題時，主題來源會同步。下載保留當下 RGB 色彩，不宣稱在 PowerPoint 更換主題後會自動換色。</p></section>`;
   container.querySelector('.qs').style.setProperty('--qsP','#'+D.ensureContrast(hex(r.params.P,D.BASE.P),'FFFFFF',4.5));
   container.querySelector('[data-qs-text]').value=s.text;paintCards();
   container.querySelector('[data-qs-text]').oninput=e=>{r.state.text=e.target.value;r.status='';container.querySelector('[data-qs-status]').textContent='';notify();paintCards();};
   container.onclick=async e=>{
    const button=e.target.closest('button');if(!button||!container.contains(button)||r.busy)return;
    if(button.dataset.qsSource){r.state.source=button.dataset.qsSource;r.status='';notify();draw();return;}
    if(button.dataset.qsColor){r.state[r.state.source==='common'?'commonKey':'themeKey']=button.dataset.qsColor;r.status='';notify();draw();return;}
    if(button.dataset.qsStyle){r.state.style=button.dataset.qsStyle;r.status='';notify();paintCards();return;}
    if(!button.hasAttribute('data-qs-download'))return;
    if(typeof r.options.onDownload!=='function'){r.status='匯出尚未連接，請稍後再試。';draw();return;}
    const request=snapshot(r.params,r.state),download=r.options.onDownload;
    r.busy=true;r.status='';draw();
    try{const result=await download(request);r.status=result===false?'已取消；調整後可再下載。':'已完成匯出準備。';}
    catch(err){r.status='未完成下載：'+(err&&err.message?err.message:'請重試。');}
    finally{r.busy=false;draw();}
   };
  }
  draw();return clone(r.state);
 }
 return {COMMON,ROLES,STYLES,normalizeState,palette,selectedColor,buildModel,snapshot,preview,render,getState:container=>records.has(container)?clone(records.get(container).state):null};
});
