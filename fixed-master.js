/* Fixed source master is an independent contract, NOT a Deck/QuickStyles theme.
 * Native export keeps source content and adds five independent single-column designs. */
(function(root,factory){'use strict';if(typeof module!=='undefined'&&module.exports)module.exports=factory(require('./fixed-master-data.js'),require('./native-styles.js'),require('./deck.js'),()=>require('pptxgenjs'));else root.FixedMaster=factory(root.FixedMasterData,root.NativeStyles,root.Deck,()=>root.PptxGenJS);})(typeof window!=='undefined'?window:this,function(DATA,NativeStyles,Deck,getPptxGenJS){
 'use strict';
 const A='http://schemas.openxmlformats.org/drawingml/2006/main',P='http://schemas.openxmlformats.org/presentationml/2006/main',R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 const FONT='微軟正黑體';
 const COLORS=Object.freeze([['red','紅','D95D68'],['yellow','黃','E7BF4A'],['blue','藍','4E83CE'],['green','綠','4B9679'],['gray','灰','7D8795'],['purple','紫','9371C6'],['white','白','FFFFFF']].map(([key,label,color])=>Object.freeze({key,label,color})));
 const STYLES=Object.freeze([['soft','柔底'],['outline','細框'],['solid','實心'],['side','側邊條']].map(([key,label])=>Object.freeze({key,label})));
 const MARKERS=Object.freeze([['none','不加螢光筆'],['highlight','原生文字醒目提示']].map(([key,label])=>Object.freeze({key,label})));
 const HIGHLIGHTS=NativeStyles.HIGHLIGHTS;
 const PALETTES=Object.freeze([{key:'common',label:'常用色 · 紅黃藍綠灰紫'},{key:'theme',label:'主題色（原母片）'}].map(Object.freeze));
 const ORIGINAL_ACCENTS=Object.freeze(['4472C4','ED7D31','A5A5A5','FFC000','5B9BD5','70AD47']);
 const LAYOUTS=Object.freeze(DATA.layouts.filter(l=>[1,2,4].includes(l.number)).map(l=>Object.freeze({key:String(l.number),number:l.number,label:({1:'封面',2:'單欄內容',4:'雙欄內容'})[l.number],mode:({1:'marker',2:'keycard',4:'paired'})[l.number]})));
 const TEMPLATE_PAGES=Object.freeze([{title:'專案重點與下一步',label:'封面',layout:1},{title:'單欄內容',label:'單欄內容',layout:2},{title:'雙欄內容',label:'雙欄內容',layout:4}].map(Object.freeze));
 const SINGLE_SCHEMES=Object.freeze([
  {id:'07',name:'E01 v5',label:'單欄07',accents:['5470C6','91CC75','FAC858','EE6666','73C0DE','3BA272'],highlight:'7C9CC3'},
  {id:'06',name:'D3-01 Category10',label:'單欄06',accents:['1F77B4','FF7F0E','2CA02C','D62728','9467BD','8C564B'],highlight:'F9F0D4'},
  {id:'03',name:'Seaborn04 muted6',label:'單欄03',accents:['4878D0','6ACC64','D65F5F','956CB4','D5BB67','82C6E2'],highlight:'D4E6DF'},
  {id:'10',name:'E13 purplepassion',label:'單欄10',accents:['8A7CA8','E098C7','8FD3E8','71669E','CC70AF','7CB4CC'],highlight:'E5DDF1'},
  {id:'04',name:'D3-02 Observable10',label:'單欄04',accents:['4269D0','EFB118','FF725C','6CC5B0','3CA951','FF8AB7'],highlight:'F6D8DB'}
 ].map(s=>Object.freeze({...s,accents:Object.freeze(s.accents)})));
 const COMPONENT_STYLES=Object.freeze(['navy','teal','green','frame']);
 const COMPONENT_PAGES=Object.freeze([{key:'catalog',id:'00',title:'00 總覽'},{key:'cards',id:'A2',title:'卡片與面板'},{key:'schemebody',id:'A16',title:'內文＋強調'},{key:'schemeiconbody',id:'A18',title:'Icon＋內文＋強調'}].map(Object.freeze));
 const DOWNLOAD_PAGES=Object.freeze([...SINGLE_SCHEMES.map(s=>({key:'single-column',title:s.label,label:s.label,schemeId:s.id,layout:2,section:'single'})),{key:'rectangles-1',title:'可編輯矩形樣式 1 / 2',label:'矩形樣式 1 / 2',layout:6,section:'materials'},{key:'rectangles-2',title:'可編輯矩形樣式 2 / 2',label:'矩形樣式 2 / 2',layout:6,section:'materials'},{key:'native-highlight',title:'八色原生文字螢光筆',label:'八色文字螢光筆',layout:6,section:'materials'},...COMPONENT_STYLES.flatMap(styleId=>{const preset=Deck.PRESETS.find(p=>p.id===styleId);return COMPONENT_PAGES.map(p=>({...p,label:preset.zh+' · '+p.title,styleId,layout:6,section:styleId}));})].map(Object.freeze));
 const pageNumber=(key,styleId)=>{const i=DOWNLOAD_PAGES.findIndex(p=>p.key===key&&(!styleId||p.styleId===styleId));if(i<0)throw Error('Unknown download page '+key);return i+1;};
 const DOWNLOAD_SECTIONS=Object.freeze([{key:'single',name:'單欄主題 07／06／03／10／04',collapse:true},{key:'materials',name:'卡片與文字素材',collapse:false},...COMPONENT_STYLES.map(key=>({key,name:Deck.PRESETS.find(p=>p.id===key).zh,collapse:true}))].map((s,i)=>Object.freeze({...s,id:'{F17ED024-0000-4000-8000-'+String(i+1).padStart(12,'0')+'}',pages:Object.freeze(DOWNLOAD_PAGES.map((p,i)=>p.section===s.key?i+1:null).filter(Boolean))})));
 const PRESETS=Object.freeze([
  {label:'封面・文字重點',layout:'1',style:'none',marker:'highlight',color:'red',highlightColor:'red'},
  {label:'單欄・重點卡',layout:'2',style:'soft',marker:'highlight',color:'yellow',highlightColor:'yellow'},
  {label:'雙欄・並列重點',layout:'4',style:'side',marker:'highlight',color:'green',highlightColor:'green'}
 ].map(Object.freeze));
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const clone=v=>JSON.parse(JSON.stringify(v));
 const clean=(v,d)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,' '):d;
 const emu=v=>Math.round(v*9525);
 function normalize(value){
  const v=value&&typeof value==='object'?value:{},layout=LAYOUTS.find(l=>l.key===String(v.layout))||LAYOUTS[1],color=COLORS.some(c=>c.key===v.color)?v.color:'red';
  const explicit=HIGHLIGHTS.some(c=>c.key===v.highlightColor),legacyWhite=!explicit&&color==='white'&&['highlight','marker','underline'].includes(v.marker);
  // Retired bands become native run highlighting. White had no replacement ink;
  // keep its card color and content while dropping that legacy marker safely.
  const marker=legacyWhite?'none':v.marker==='none'?'none':'highlight',highlightColor=explicit?v.highlightColor:HIGHLIGHTS.some(c=>c.key===color)?color:'red';
  return {version:2,paletteSource:v.paletteSource==='theme'?'theme':'common',layout:layout.key,style:layout.mode==='marker'?'none':STYLES.some(s=>s.key===v.style)?v.style:'soft',marker,color,highlightColor,title:clean(v.title,'專案重點與下一步'),summary:clean(v.summary,'聚焦主要判斷，保留執行依據'),focus:clean(v.focus,'優先確認關鍵事項')};
 }
 function validate(s){for(const [k,n,label]of [['title',24,'標題'],['summary',28,'結論'],['focus',16,'強調短句']])if(!s[k].trim()||Array.from(s[k]).length>n)throw Error(label+'請填 1–'+n+' 字；不會自動縮字或截斷。');}
 function combinations(){return LAYOUTS.flatMap(l=>(l.mode==='marker'?['none']:STYLES.map(x=>x.key)).flatMap(style=>COLORS.flatMap(c=>[{layout:l.key,style,marker:'none',color:c.key,highlightColor:'red'},...HIGHLIGHTS.map(h=>({layout:l.key,style,marker:'highlight',color:c.key,highlightColor:h.key}))])));}
 function mix(c){return c.match(/../g).map(x=>Math.round(parseInt(x,16)*.1+255*.9).toString(16).padStart(2,'0')).join('').toUpperCase();}
 function ink(c){const lum=c.match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);return lum>.23?'333333':'FFFFFF';}
 function build(value){
  const s=normalize(value),layout=LAYOUTS.find(l=>l.key===s.layout),source=DATA.layouts[layout.number-1],color=COLORS.find(c=>c.key===s.color),c=color.color,ph=[],objects=[];
  const put=(idx,lines)=>{if(!source.placeholders[idx])throw Error('Missing original placeholder '+idx);ph.push({index:String(idx),lines:lines.map(x=>typeof x==='string'?{text:x,level:0}:x)});};
  put('0',[s.title]);put('10',['4']);
  const bullets=[{text:s.summary,level:0},{text:'保留原字級、縮排與行距',level:1},{text:'替換文字後仍可逐項編輯',level:2}];
  if(layout.key==='1')put('1',[s.summary]);
  else if(layout.key==='3')put('1',[s.summary]);
  else if(layout.key==='2')put('1',bullets);
  else if(['4','5','7'].includes(layout.key))put(layout.key==='7'?'1':'11',[{text:'結論：'+s.summary,level:0},{text:'支持結論的關鍵依據',level:1},{text:'補充條件或待確認事項',level:1}]);
  const rect=(name,x,y,w,h,fill,line=null,alpha=100000)=>({kind:'rect',name,x,y,w,h,fill,line,alpha});
  const text=(name,x,y,w,h,value,size=20,fg='333333',bold=false)=>({kind:'text',name,x,y,w,h,text:value,size,color:fg,bold});
  function marker(group,x,y,w,label,size=20,fg='333333'){
   const h=size*4/3*1.25;
   const phrase=text('強調短句',x,y,w,h,label,size,fg);
   if(s.marker==='highlight')phrase.highlight=HIGHLIGHTS.find(h=>h.key===s.highlightColor).color;
   group.push(phrase);
  }
  function card(x,y,w,h,label,body){
   const items=[],soft=mix(c),fg=s.style==='solid'?ink(c):'333333';
   items.push(rect('快速樣式底座',x,y,w,h,s.style==='outline'?null:s.style==='solid'?c:soft,s.style==='outline'?c:null));
   if(s.style==='side')items.push(rect('3 pt 側邊條',x,y+10,4,h-20,c));
   // Key-card header and paired-bar labels use the same selected fixed color.
   if(layout.mode==='keycard'){items.push(rect('Key card 表頭',x,y,w,44,c));items.push(text('Key card 標題',x+18,y+5,w-36,36,label,20,ink(c),true));items.push(text('Key card 內文',x+18,y+62,w-36,38,body,18,fg));marker(items,x+18,y+115,w-36,s.focus,20,fg);}
   else{items.push(text('並列標籤',x+18,y+14,w-36,38,label,22,fg,true));items.push(text('並列內文',x+18,y+67,w-36,38,body,18,fg));marker(items,x+18,y+120,w-36,s.focus,20,fg);}
   objects.push({kind:'group',name:label+' · '+s.style,items});
  }
  if(layout.mode==='marker'){const items=[];marker(items,84,470,960,s.focus,24);objects.push({kind:'group',name:'輕量螢光筆',items});}
  else if(layout.mode==='keycard')card(84,layout.key==='2'?345:220,950,205,'本頁關鍵結論',s.summary);
  else if(layout.mode==='paired'){
   if(layout.key==='5'){put('1',['方案 A']);put('3',['方案 B']);}
   card(55,layout.key==='4'?310:350,571,210,layout.key==='4'?'目前狀態':'分批交付','逐階確認，提早辨識差異。');
   card(655,layout.key==='4'?310:350,571,210,layout.key==='4'?'下一步行動':'集中交付','統一驗收，明確列出條件。');
  }else{
   put('2',['部署進度']);put('4',['資源盤點與配置']);
   for(const [x,label]of [[55,'項目'],[655,'單位']])objects.push({kind:'table',placeholder:x===55?3:5,name:'原生報表 '+label,x,y:348,w:571,h:245,style:s.style,color:c,rows:[[label,'進度','下一步'],[label+' A','進行中','確認條件'],[label+' B','待確認','補充資料'],[label+' C','已完成','安排檢視']]});
   const items=[];marker(items,84,617,1060,s.focus,18);objects.push({kind:'group',name:'報表補充標記',items});
  }
  return {selection:s,layout:clone(layout),sourceLayout:source,placeholders:ph,objects,color:c,fixed:{font:FONT,title:'C00000',body:'333333',footer:'000000',rule:'FF0000'},previewOnlyBackground:c==='FFFFFF'?'252A34':null};
 }
 const fonts=`<a:latin typeface="${FONT}"/><a:ea typeface="${FONT}"/><a:cs typeface="${FONT}"/>`;
 function fill(c,alpha=100000){return c?`<a:solidFill><a:srgbClr val="${c}">${alpha!==100000?`<a:alpha val="${alpha}"/>`:''}</a:srgbClr></a:solidFill>`:'<a:noFill/>';}
 function paras(lines){return lines.map(l=>`<a:p><a:pPr lvl="${l.level||0}"/><a:r><a:t>${esc(l.text)}</a:t></a:r></a:p>`).join('');}
 function textBody(value,size=20,color='333333',bold=false,highlight=null){return `<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr><a:lnSpc><a:spcPct val="100000"/></a:lnSpc><a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="0"/></a:spcAft><a:buNone/></a:pPr><a:r><a:rPr lang="zh-TW" sz="${size*100}" b="${bold?1:0}">${fill(color)}${highlight?`<a:highlight><a:srgbClr val="${highlight}"/></a:highlight>`:''}${fonts}</a:rPr><a:t>${esc(value)}</a:t></a:r></a:p></p:txBody>`;}
 function tableCell(m,r,col){const base=m.style==='solid'?m.color:m.style==='soft'||m.style==='side'?mix(m.color):'FFFFFF',highlight=r===1&&col===1,bg=r===0?m.color:highlight?base:'FFFFFF',fg=r===0?ink(m.color):highlight&&m.style==='solid'?ink(m.color):'333333';return {bg,fg,line:m.style==='outline'?m.color:'D9DDE3',side:m.style==='side'&&col===0};}
 function slideXml(model,number){
  let id=100;
  function object(o){const key=++id;
   if(o.kind==='group'){const x=Math.min(...o.items.map(v=>v.x)),y=Math.min(...o.items.map(v=>v.y)),w=Math.max(...o.items.map(v=>v.x+v.w))-x,h=Math.max(...o.items.map(v=>v.y+v.h))-y;return `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="${key}" name="${esc(o.name)}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/><a:chOff x="${emu(x)}" y="${emu(y)}"/><a:chExt cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm></p:grpSpPr>${o.items.map(object).join('')}</p:grpSp>`;}
   if(o.kind==='table'){
    const cw=emu(o.w/3),rh=emu(o.h/o.rows.length);
    const rows=o.rows.map((row,r)=>`<a:tr h="${rh}">${row.map((val,col)=>{const cell=tableCell(o,r,col),line=(side)=>`<a:ln${side} w="${cell.side&&side==='L'?38100:6350}">${fill(cell.side&&side==='L'?o.color:cell.line)}<a:prstDash val="solid"/></a:ln${side}>`;return `<a:tc>${textBody(val,16,cell.fg,r===0).replace(/p:txBody/g,'a:txBody')}<a:tcPr marL="114300" marR="114300" marT="76200" marB="76200" anchor="ctr">${['L','R','T','B'].map(line).join('')}${fill(cell.bg)}</a:tcPr></a:tc>`;}).join('')}</a:tr>`).join('');
    return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${key}" name="${esc(o.name)}"/><p:cNvGraphicFramePr/><p:nvPr><p:ph idx="${o.placeholder}"/></p:nvPr></p:nvGraphicFramePr><p:xfrm><a:off x="${emu(o.x)}" y="${emu(o.y)}"/><a:ext cx="${emu(o.w)}" cy="${emu(o.h)}"/></p:xfrm><a:graphic><a:graphicData uri="${A}/table"><a:tbl><a:tblPr/><a:tblGrid>${[0,1,2].map(()=>`<a:gridCol w="${cw}"/>`).join('')}</a:tblGrid>${rows}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
   }
   return `<p:sp><p:nvSpPr><p:cNvPr id="${key}" name="${esc(o.name)}"/><p:cNvSpPr${o.kind==='text'?' txBox="1"':''}/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${emu(o.x)}" y="${emu(o.y)}"/><a:ext cx="${emu(o.w)}" cy="${emu(o.h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${fill(o.fill,o.alpha)}<a:ln w="${o.line?15875:0}">${fill(o.line)}</a:ln></p:spPr>${o.kind==='text'?textBody(o.text,o.size,o.color,o.bold,o.highlight):''}</p:sp>`;
  }
  const placeholders=model.placeholders.map(p=>model.sourceLayout.placeholders[p.index].xml.replace('{{PARAGRAPHS}}',p.index==='10'?`<a:p><a:pPr lvl="0"/><a:fld id="{F17ED000-0000-4000-8000-${String(number).padStart(12,'0')}}" type="slidenum"><a:rPr lang="zh-TW" altLang="en-US"/><a:t>${number}</a:t></a:fld></a:p>`:paras(p.lines))).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:p="${P}" xmlns:a="${A}" xmlns:r="${R}" showMasterSp="1"><p:cSld name="${esc(model.layout.label)} · ${esc(model.selection.style)}"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${placeholders}${model.objects.map(object).join('')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
 }
 function originalBytes(){const s=atob(DATA.originalBase64);return Uint8Array.from(s,c=>c.charCodeAt(0));}
 async function prepareTemplate(JSZip,values=[],options={}){
  if(!JSZip||typeof JSZip.loadAsync!=='function')throw Error('原生封裝工具尚未載入，請重新開啟此頁。');
  if(!Array.isArray(values)||values.length>1)throw Error('主範本固定三頁；另做示範時只新增一頁。');
  const models=values.map(v=>{const m=build(v);validate(m.selection);return m;});
  const zip=await JSZip.loadAsync(originalBytes());
  if(!NativeStyles||typeof NativeStyles.nativeStyleProfile!=='function')throw Error('原生樣式模組尚未載入，請重新開啟此頁。');
  const profile=await NativeStyles.nativeStyleProfile(zip,options.selectedSchemes?{source:'custom',accents:SINGLE_SCHEMES[0].accents.slice(),format:'balanced-v2'}:{source:options.source==='theme'||options.paletteSource==='theme'?'theme':'common'});
  let pres=await zip.file('ppt/presentation.xml').async('string'),rels=await zip.file('ppt/_rels/presentation.xml.rels').async('string'),types=await zip.file('[Content_Types].xml').async('string');
  // Source bytes remain immutable. The current download retains only the single-
  // column source; the legacy internal helper still builds its explicit three pages.
  const removed=['ppt/slides/slide3.xml','ppt/slides/_rels/slide3.xml.rels','ppt/slides/slide4.xml','ppt/slides/_rels/slide4.xml.rels','ppt/notesSlides/notesSlide3.xml','ppt/notesSlides/_rels/notesSlide3.xml.rels'];
  if(options.currentDownload)removed.push('ppt/slides/slide2.xml','ppt/slides/_rels/slide2.xml.rels','ppt/notesSlides/notesSlide2.xml','ppt/notesSlides/_rels/notesSlide2.xml.rels');
  removed.forEach(name=>zip.remove(name));
  types=types.replace(/<Override\b[^>]*\/>/g,tag=>removed.some(name=>tag.includes('PartName="/'+name+'"'))?'':tag);
  rels=rels.replace(/<Relationship\b[^>]*\/>/g,tag=>tag.includes('Type="'+R+'/slide"')?'':tag);
  pres=pres.replace(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/,'<p:sldIdLst></p:sldIdLst>');
  const stamp=zip.file('ppt/slides/slide1.xml').date;
  function addSlide(part,layout,xml,id,rid){
   zip.file('ppt/slides/'+part+'.xml',xml,{date:stamp,createFolders:false});
   zip.file('ppt/slides/_rels/'+part+'.xml.rels',`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLayout" Type="${R}/slideLayout" Target="../slideLayouts/slideLayout${layout}.xml"/></Relationships>`,{date:stamp,createFolders:false});
   pres=pres.replace('</p:sldIdLst>',`<p:sldId xmlns:r="${R}" id="${id}" r:id="${rid}"/></p:sldIdLst>`);
   rels=rels.replace('</Relationships>',`<Relationship Id="${rid}" Type="${R}/slide" Target="slides/${part}.xml"/></Relationships>`);
   types=types.replace('</Types>',`<Override PartName="/ppt/slides/${part}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>`);
  }
  const cover=build({layout:'1',style:'none',marker:'none',color:'red'});
  if(!options.currentDownload)addSlide('slideCover',1,slideXml(cover,1),260,'rIdFixedCover');
  const retained=options.currentDownload?[['slide1',1,256,'Rbbb39bd5704c4961']]:[['slide1',2,256,'Rbbb39bd5704c4961'],['slide2',3,257,'Re12590bd29d746d8']];
  for(const [part,number,id,rid]of retained){
   const original=await zip.file('ppt/slides/'+part+'.xml').async('string');let fields=0;
   const numbered=original.replace(/(<a:fld\b[^>]*\btype="slidenum"[^>]*>[\s\S]*?<a:t>)\d+(<\/a:t>[\s\S]*?<\/a:fld>)/g,(_,before,after)=>{fields++;return before+number+after;});
   if(fields!==1)throw Error('來源頁碼欄位不符預期；已停止匯出。');
   zip.file('ppt/slides/'+part+'.xml',numbered,{date:stamp,createFolders:false});
   pres=pres.replace('</p:sldIdLst>',`<p:sldId xmlns:r="${R}" id="${id}" r:id="${rid}"/></p:sldIdLst>`);
   rels=rels.replace('</Relationships>',`<Relationship Id="${rid}" Type="${R}/slide" Target="slides/${part}.xml"/></Relationships>`);
  }
  models.forEach((m,i)=>addSlide('slide'+(i+4),m.layout.number,slideXml(m,i+4),261+i,'rIdFixedMaster'+(i+4)));
  zip.file('ppt/presentation.xml',pres,{date:stamp,createFolders:false});zip.file('ppt/_rels/presentation.xml.rels',rels,{date:stamp,createFolders:false});zip.file('[Content_Types].xml',types,{date:stamp,createFolders:false});
  const app=await zip.file('docProps/app.xml').async('string');zip.file('docProps/app.xml',app.replace(/(<(?:\w+:)?Slides>)\d+(<\/(?:\w+:)?Slides>)/,'$1'+(3+models.length)+'$2'),{date:stamp,createFolders:false});
  await NativeStyles.applyProfileToZip(zip,profile);
  return {zip,profile,stamp};
 }
 // Both downloads use the same immutable source and native profile.
 async function exportPptx(JSZip,values=[],options={}){
  const prepared=await prepareTemplate(JSZip,values,{...options,selectedSchemes:!values.length,currentDownload:!values.length}),{zip}=prepared;
  // Legacy internal demonstrations keep their explicit 3+1 contract. The main
  // empty-values path is the requested current master download.
  if(!values.length){await installSingleSchemes(prepared);await appendDownloadPages(JSZip,prepared,options);await installSections(prepared);}
  return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
 }
 function materialPage(title,number){
  let id=100,parts=[];const source=DATA.layouts.find(l=>l.number===6);
  const titleShape=source.placeholders['0'].xml.replace('{{PARAGRAPHS}}',paras([{text:title,level:0}]));
  const numberShape=source.placeholders['10'].xml.replace('{{PARAGRAPHS}}','<a:p><a:fld id="{F17ED001-0000-4000-8000-'+String(number).padStart(12,'0')+'}" type="slidenum"><a:rPr lang="zh-TW"/><a:t>'+number+'</a:t></a:fld></a:p>');
  function shape(name,x,y,w,h,pr,body='',style='',geometry='rect'){
   const adjust=geometry==='roundRect'?'<a:avLst><a:gd name="adj" fmla="val '+Math.round(NativeStyles.KIT_RADIUS_PT/(Math.min(w,h)*.75)*100000)+'"/></a:avLst>':'<a:avLst/>';
   parts.push('<p:sp><p:nvSpPr><p:cNvPr id="'+(++id)+'" name="'+esc(name)+'"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="'+emu(x)+'" y="'+emu(y)+'"/><a:ext cx="'+emu(w)+'" cy="'+emu(h)+'"/></a:xfrm><a:prstGeom prst="'+geometry+'">'+adjust+'</a:prstGeom>'+pr+'</p:spPr>'+style+body+'</p:sp>');
  }
  function label(name,x,y,w,h,value,size=12,color='333333',highlight=null){shape(name,x,y,w,h,'<a:noFill/><a:ln><a:noFill/></a:ln>',textBody(value,size,color,false,highlight));}
  return {shape,label,xml:()=> '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:p="'+P+'" xmlns:a="'+A+'" xmlns:r="'+R+'" showMasterSp="1"><p:cSld name="'+esc(title)+'"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>'+titleShape+numberShape+parts.join('')+'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'};
 }
 function materialCards(profile,pageIndex,number=pageIndex+1){
  const palette=profile.palette,slots=palette.slots,cols=[slots.dk1,...palette.accents],roles=['tx1','accent1','accent2','accent3','accent4','accent5','accent6'];
  const p=materialPage('可編輯矩形樣式 '+(pageIndex+1)+' / 2',number),solid=c=>'<a:solidFill>'+c+'</a:solidFill>',rgb=c=>'<a:srgbClr val="'+c+'"/>';
  p.label('Materials palette scope',40,93,1100,30,(palette.source==='custom'?'首選 07':palette.source==='common'?'常用六色':'原母片六色')+' · 原母片字型與主題效果 · 可複製形狀後改字',12);
  cols.forEach((color,j)=>p.label('Palette slot '+j,184+j*150,133,142,25,(j?'Accent '+j:'Text1')+' #'+color,9));
  NativeStyles.KIT_EFFECTS.slice(pageIndex*5,pageIndex*5+5).forEach((spec,k)=>{
   const row=pageIndex*5+k,y=180+k*91;
   p.label('Material effect '+row,40,y,132,57,row===0?'中性／淡主色柔影':row===1?'中性／主色白字':spec.label,12);
   cols.forEach((color,j)=>{
    const role=roles[j],variant=j>0&&row<2;let e=NativeStyles.kitEffect(color,row,slots.dk1,slots.lt1,slots.dk2);
    if(variant){const paint=NativeStyles.kitEffect(color,row===0?4:9,slots.dk1,slots.lt1,slots.dk2);e={...e,fillRole:'self',fillMods:row===0?[['tint',20000]]:paint.fillMods,fontRole:paint.fontRole,fontMods:paint.fontMods,foreground:paint.foreground,lineRole:'self',lineMods:row===0?[]:paint.fillMods};}
    const foreground=e.fontRole==='self'?role:e.fontRole;
    const background=row===5?rgb('F2F2F2'):NativeStyles.colorXml(e.fillRole==='self'?role:e.fillRole,row===4?[['tint',20000]]:e.fillMods);
    const line=e.line?'<a:ln w="'+Math.round(e.lineWidth*12700)+'" cap="flat" cmpd="sng" algn="ctr">'+solid(!variant&&[0,1,3].includes(row)?rgb(e.lineColor):NativeStyles.colorXml(e.lineRole==='self'?role:e.lineRole,e.lineMods))+'<a:prstDash val="solid"/><a:round/></a:ln>':'<a:ln><a:noFill/></a:ln>';
    const shadow=e.shadow?'<a:effectLst><a:outerShdw blurRad="'+Math.round(e.shadow.blur*12700)+'" dist="'+Math.round(e.shadow.offset*12700)+'" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="'+Math.round(e.shadow.alpha*100000)+'"/></a:srgbClr></a:outerShdw></a:effectLst>':'<a:effectLst/>';
    const style='<p:style><a:lnRef idx="0">'+NativeStyles.colorXml(role)+'</a:lnRef><a:fillRef idx="0">'+NativeStyles.colorXml(role)+'</a:fillRef><a:effectRef idx="0">'+NativeStyles.colorXml(role)+'</a:effectRef><a:fontRef idx="minor">'+NativeStyles.colorXml(foreground,e.fontMods)+'</a:fontRef></p:style>';
    const body=textBody(e.text,20,e.foreground,e.bold).replace(fill(e.foreground),solid(NativeStyles.colorXml(foreground,e.fontMods))).replace('<a:pPr>','<a:pPr algn="ctr">');
    p.shape('Material card '+(row+1)+' '+role,184+j*150,y,137,58,solid(background)+line+shadow,body,style,'roundRect');
   });
  });
  p.shape('White editable shape',42,650,80,24,fill('FFFFFF')+'<a:ln w="6350">'+fill('7D8795')+'</a:ln>');
  p.label('Materials capability',140,642,1090,34,'白色另選。兩頁共 70 個可編輯矩形；這些預設不是新增的 Office Ribbon 按鈕。',11);
  return p.xml();
 }
 function materialHighlights(number=3){
  const p=materialPage('八色原生文字螢光筆',number);
  p.label('Native highlight introduction',40,94,1140,35,'顏色作用於文字本身，改字時隨文字延伸；不含獨立底帶，也不自動修改文字顏色。',13);
  HIGHLIGHTS.forEach((c,i)=>{const y=150+i*56;p.label('Native highlight label '+(i+1),65,y,300,42,c.label+' #'+c.color,16);p.label('Native highlight '+(i+1),420,y,780,42,'Yield improved 良率提升',20,['dark-gray','navy'].includes(c.key)?'FFFFFF':'333333',c.color);});
  p.label('Reference blue note',40,611,1160,27,'參考藍保留 #7C9CC3。深灰與深藍範例以白字展示；套用醒目提示不會自動修改字色。',11);
  p.label('Highlight ribbon limits',40,647,1160,27,'八色已寫入近期色資料；內建 15 色選單不會被替換，近期色顯示、順序及保留仍依 PowerPoint 而定。',10);
  return p.xml();
 }
 // Reuse the registered component renderer, including native groups and icons.
 // Only placement changes: every source component is kept and scaled uniformly.
 function componentModel(profile,presetId){
  if(!Deck||typeof Deck.buildModel!=='function')throw Error('元件模組尚未載入，請重新開啟此頁。');
  const accents=profile.palette.accents,primary=accents[0];
  const preset=presetId&&Deck.PRESETS.find(p=>p.id===presetId);if(presetId&&!preset)throw Error('未知的元件風格：'+presetId);
  const params=preset?{...preset}:{...Deck.BASE,P:primary,PD:Deck.mix(primary,'000000',.35),PT:Deck.mix(primary,'FFFFFF',.85),A:accents[1],bFont:FONT,tFont:FONT,nFont:FONT};
  const keys=preset?COMPONENT_PAGES.map(p=>p.key):['cards','schemebody','schemeiconbody'];
  const model=Deck.buildModel(params,{only:keys}),out=[];
  function transform(item,k,dx,dy){
   const it=clone(item);
   if(!['sp','ln'].includes(it.t))throw Error('元件含未支援的內容類型，已停止匯出。');
   for(const a of ['x','x1','x2'])if(typeof it[a]==='number')it[a]=it[a]*k+dx;
   for(const a of ['y','y1','y2'])if(typeof it[a]==='number')it[a]=it[a]*k+dy;
   for(const a of ['w','h','lw','adj'])if(typeof it[a]==='number')it[a]*=k;
   if(it.sh)for(const a of ['blur','dist'])if(typeof it.sh[a]==='number')it.sh[a]*=k;
   if(it.points)it.points=it.points.map(p=>{const q={...p};for(const a of ['x','y','x1','y1','x2','y2'])if(typeof q[a]==='number')q[a]*=k;return q;});
   if(it.runs)for(const r of it.runs){r.o.size*=k;if(!preset)r.o.font=FONT;if(r.o.cs!=null)r.o.cs*=k;}
   if(it.tx){it.tx.size*=k;if(!preset)it.tx.font=FONT;if(Array.isArray(it.tx.margin))it.tx.margin=it.tx.margin.map(x=>x*k);else if(typeof it.tx.margin==='number')it.tx.margin*=k;}
   return it;
  }
  const caption=(text,x,y,w)=>({t:'sp',kind:null,x,y,w,h:.21,name:'素材款名',runs:[{t:text,o:{size:9,font:FONT,color:'595959',bold:false}}],tx:{size:9,font:FONT,color:'595959',align:'left',valign:'middle',margin:0,lsp:1}});
  for(const key of keys){
   const source=model.slides.find(s=>s.key===key);if(!source)throw Error('缺少已註冊元件頁：'+key);
   const slide={...source,items:[],groups:[],w:13.3333333333333,h:7.5,schemeCatalogue:false};
   if(key==='cards'||key==='catalog'){
    if(key==='cards'&&source.groups.length!==9)throw Error('卡片元件數量已變更，請先更新母片整合。');
    const start=key==='catalog'?source.items.findIndex(it=>it.name==='類別'):source.groups[0].from,end=source.groups.at(-1).to+1;
    if(start<0)throw Error('總覽類別標籤位置已變更。');
    if(source.items[end].name!=='圖說')throw Error('卡片圖說位置已變更。');
    slide.items=source.items.slice(start,end+1).map(it=>transform(it,1,0,-.45));
    slide.groups=source.groups.map(g=>({...g,from:g.from-start,to:g.to-start,y:g.y-.45}));
   }else{
    if(source.groups.length!==28)throw Error('方案元件數量已變更，請先更新母片整合。');
    const k=.5;
    for(let style=0;style<14;style++){
     const pair=source.groups.slice(style*2,style*2+2),x=.42+(style%2)*6.25,y=1.37+Math.floor(style/2)*.76;
     if(pair[0].schemeSide!=='A'||pair[1].schemeSide!=='B'||pair[0].schemeStyle!==pair[1].schemeStyle)throw Error('方案 A/B 對應不完整。');
     slide.items.push(caption(pair[0].name.replace(/・方案 A$/,''),x,y,5.98));
     pair.forEach((g,side)=>{
      const gx=x+side*(g.w*k+.12),gy=y+.25,from=slide.items.length;
      slide.items.push(...source.items.slice(g.from,g.to+1).map(it=>transform(it,k,gx-g.x*k,gy-g.y*k)));
      slide.groups.push({...g,from,to:slide.items.length-1,x:gx,y:gy,w:g.w*k,h:g.h*k});
     });
    }
   }
   out.push(slide);
  }
  return {...model,slides:out,W:13.3333333333333,H:7.5};
 }
 async function componentSlides(JSZip,profile,options={}){
  const model=componentModel(profile,options.presetId),PptxGenJS=options.PptxGenJS||getPptxGenJS(),startPage=options.startPage||pageNumber(options.presetId?'catalog':'cards',options.presetId||COMPONENT_STYLES[0]);
  if(typeof PptxGenJS!=='function')throw Error('原生簡報工具尚未載入。');
  const exported=await Deck.exportPptx({JSZip,PptxGenJS},model.params,{model,type:'uint8array'}),source=await JSZip.loadAsync(exported.data),pages=[];
  for(let i=0;i<model.slides.length;i++){
   const xml=await source.file('ppt/slides/slide'+(i+1)+'.xml').async('string');
   let body=(xml.match(/<p:spTree>([\s\S]*?)<\/p:spTree>/)||[])[1];
   if(!body)throw Error('元件頁沒有原生形狀樹。');
   body=body.replace(/^\s*<p:nvGrpSpPr>[\s\S]*?<\/p:nvGrpSpPr>\s*<p:grpSpPr(?:\s[^>]*)?(?:\/>|>[\s\S]*?<\/p:grpSpPr>)/,'');
   // These registered pages currently need no related media/master/theme parts.
   // Refuse future dependencies instead of silently dropping them or importing
   // a foreign theme into the fixed master.
   if(/\br:(?:embed|link)=|<p:pic\b|<p:ph\b|<a:schemeClr\b|<p:style\b/.test(body))throw Error('元件頁新增了外部關係或主題依賴，已停止匯出。');
   // The catalogue can link to Cards in this same four-page style group.
   // Copy only resolved internal slide links; never import foreign masters/media.
   const relationships=[],sourceRels=relEntries(await source.file('ppt/slides/_rels/slide'+(i+1)+'.xml.rels').async('string')),mapped=new Map();
   for(const match of body.matchAll(/\br:id="([^"]+)"/g)){
    const id=match[1];if(mapped.has(id))continue;const rel=sourceRels.find(r=>r.attrs.Id===id);
    if(!rel||rel.attrs.Type!==R+'/slide'||rel.attrs.TargetMode)throw Error('元件連結不是可保留的內部投影片。');
    const target=partTarget('ppt/slides/slide'+(i+1)+'.xml',rel.attrs.Target),dest=target.match(/^ppt\/slides\/slide(\d+)\.xml$/),index=dest?Number(dest[1])-1:-1;
    if(index<0||index>=model.slides.length)throw Error('元件連結目標不在此風格組。');
    const next='rIdComponent'+(mapped.size+1);mapped.set(id,next);
    relationships.push('<Relationship Id="'+next+'" Type="'+R+'/slide" Target="slideMaterial'+(startPage+index)+'.xml"/>');
   }
   body=body.replace(/\br:id="([^"]+)"/g,(_,id)=>'r:id="'+mapped.get(id)+'"');
   const ids=new Map();let next=1000;
   body=body.replace(/(<p:cNvPr\b[^>]*\bid=")(\d+)(")/g,(_,a,id,b)=>{if(ids.has(id))throw Error('元件 shape ID 重複。');ids.set(id,String(++next));return a+ids.get(id)+b;});
   body=body.replace(/(<a:(?:stCxn|endCxn)\b[^>]*\bid=")(\d+)(")/g,(_,a,id,b)=>{if(!ids.has(id))throw Error('元件連線缺少目標。');return a+ids.get(id)+b;});
   const pageNumber=startPage+i,pageDef=DOWNLOAD_PAGES[pageNumber-1],page=materialPage(pageDef.title,pageNumber);
   const caption=options.presetId?Deck.PRESETS.find(p=>p.id===options.presetId).zh+' · ':'';
   const dense=['schemebody','schemeiconbody'].includes(model.slides[i].key);
   page.label('Component page scope',40,94,1180,28,caption+(dense?'14 款 A/B，共 28 組原生元件 · 密集素材總覽（9 pt）· 可複製後放大編輯':model.slides[i].key==='catalog'?'元件總覽 · 可整組複製、修改文字與圖形':'9 種原生卡片與面板 · 可整組複製、修改文字與圖示'),11);
   pages.push({xml:page.xml().replace('</p:spTree>',body+'</p:spTree>'),relationships});
  }
  return pages;
 }
 function partTarget(owner,target){
  const parts=(target.startsWith('/')?target:owner.slice(0,owner.lastIndexOf('/')+1)+target).split('/'),out=[];
  for(const p of parts){if(!p||p==='.')continue;if(p==='..'){if(!out.length)throw Error('Invalid package target');out.pop();}else out.push(p);}return out.join('/');
 }
 function relationshipPart(part){const at=part.lastIndexOf('/');return part.slice(0,at+1)+'_rels/'+part.slice(at+1)+'.rels';}
 function relEntries(xml){return Array.from(xml.matchAll(/<(?:\w+:)?Relationship\b[^>]*\/>/g),m=>({xml:m[0],attrs:Object.fromEntries(Array.from(m[0].matchAll(/([\w:.-]+)="([^"]*)"/g),a=>[a[1],a[2]]))}));}
 function numbered(xml,number){let count=0;const out=xml.replace(/(<a:fld\b[^>]*\btype="slidenum"[^>]*>[\s\S]*?<a:t>)\d+(<\/a:t>[\s\S]*?<\/a:fld>)/g,(_,a,b)=>{count++;return a+number+b;});if(count!==1)throw Error('Single-column page number field changed');return out;}

 // Official ShapeStyle tuples, captured from PowerPoint's saved native gallery
 // (indices 2/9/16/23/30/37 for Accent1). No direct fill/line/effect overrides:
 // every sample resolves through this slide's independent balanced-v2 theme.
 function singleThemeSamples(xml){
  let content=0;
  xml=xml.replace(/<p:sp\b[^>]*>[\s\S]*?<\/p:sp>/g,sp=>{
   if(!/<p:ph\b[^>]*\bidx="1"/.test(sp))return sp;content++;
   const ps=sp.match(/<a:p(?:\s[^>]*)?>[\s\S]*?<\/a:p>/g);if(!ps||ps.length<3)throw Error('Single-column sample paragraphs changed');
   // Retain one exact 24/18/14 pt hierarchy, including inherited bullets/font.
   sp=sp.replace(/(<p:txBody>[\s\S]*?<\/ns0:lstStyle>|<p:txBody>[\s\S]*?<ns0:lstStyle[^>]*\/>)[\s\S]*?<\/p:txBody>/,(_,head)=>head+ps.slice(0,3).join('')+'</p:txBody>');
   const box=DATA.layouts.find(l=>l.number===2).placeholders['1'];
   return sp.replace('<p:spPr>','<p:spPr><a:xfrm xmlns:a="'+A+'"><a:off x="'+emu(box.x)+'" y="'+emu(box.y)+'"/><a:ext cx="'+emu(530)+'" cy="'+emu(box.h)+'"/></a:xfrm>');
  });
  if(content!==1)throw Error('Expected one single-column content placeholder');
  const tuples=[[2,1,0,'lt1','dk1'],[2,1,0,'self','lt1'],[3,1,1,'self','lt1'],[1,2,1,'self','dk1'],[1,3,2,'self','lt1'],[0,3,3,'self','lt1']];
  const parts=[],head=materialPage('',1);head.label('Theme styles heading',650,120,575,38,'佈景主題樣式',20);
  const label=head.xml().match(/<p:sp><p:nvSpPr><p:cNvPr id="101"[\s\S]*?<\/p:sp>/)[0].replace('id="101"','id="9100"');parts.push(label);
  for(let row=0;row<6;row++)for(let col=0;col<6;col++){
   const role='accent'+(col+1),[ln,fillIndex,effect,fillRole,fontRole]=tuples[row],shapeStyle=row*7+col+2;
   const ref=(name,index,color,mods=[])=>'<a:'+name+' idx="'+index+'">'+NativeStyles.colorXml(color==='self'?role:color,mods)+'</a:'+name+'>';
   const style='<p:style>'+ref('lnRef',ln,row===2?'lt1':role,row===1?[['shade',15000]]:[])+ref('fillRef',fillIndex,fillRole)+ref('effectRef',effect,role)+ref('fontRef','minor',fontRole)+'</p:style>';
   const body=textBody('Abc',16).replace(fill('333333'),'').replace('<a:pPr>','<a:pPr algn="ctr">');
   parts.push('<p:sp><p:nvSpPr><p:cNvPr id="'+(9101+row*6+col)+'" name="Native ShapeStyle '+shapeStyle+'"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="'+emu(650+col*96)+'" y="'+emu(181+row*76)+'"/><a:ext cx="'+emu(83)+'" cy="'+emu(53)+'"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom></p:spPr>'+style+body+'</p:sp>');
  }
  // Source slide has locally declared DrawingML namespaces; new shapes need a
  // root declaration without touching any source master/layout or its fonts.
  xml=xml.replace('<p:sld ', '<p:sld xmlns:a="'+A+'" ');
  return xml.replace('</p:spTree>',parts.join('')+'</p:spTree>');
 }
 async function installSections({zip,stamp}){
  const file='ppt/presentation.xml';let xml=await zip.file(file).async('string');
  const ids=Array.from(xml.match(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/)[0].matchAll(/<p:sldId\b[^>]*\bid="(\d+)"/g),m=>m[1]);
  if(ids.length!==DOWNLOAD_PAGES.length)throw Error('Section page list does not match the download');
  const uri='{521415D9-36F7-43E2-AB2F-B90AF26B5E84}',body='<p:ext uri="'+uri+'"><p14:sectionLst xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main">'+DOWNLOAD_SECTIONS.map(s=>'<p14:section name="'+esc(s.name)+'" id="'+s.id+'"><p14:sldIdLst>'+s.pages.map(n=>'<p14:sldId id="'+ids[n-1]+'"/>').join('')+'</p14:sldIdLst></p14:section>').join('')+'</p14:sectionLst></p:ext>';
  if(xml.includes(uri))throw Error('Source already contains sections; avoid overwriting them');
  // PowerPoint 16.0.20527 saves membership, but reopens collapsed sections
  // expanded. Do not invent an unsupported collapsed attribute or add macros.
  xml=xml.includes('<p:extLst>')?xml.replace('</p:extLst>',body+'</p:extLst>'):xml.replace('</p:presentation>','<p:extLst>'+body+'</p:extLst></p:presentation>');
  zip.file(file,xml,{date:stamp,createFolders:false});
 }

 async function installSingleSchemes({zip,profile,stamp}){
  const graph=await NativeStyles.resolveThemeGraph(zip);
  if(graph.masterParts.length!==1)throw Error('五款單欄需從原單一母片建立；已停止以免覆寫既有設計。');
  const master=graph.masterParts[0],masterRels=relationshipPart(master),theme=graph.masterThemes[master];
  const read=async part=>{if(!zip.file(part))throw Error('Missing package part '+part);return zip.file(part).async('string');};
  const sourceSlide='ppt/slides/slide1.xml',sourceSlideRels=relationshipPart(sourceSlide),slideXml0=await read(sourceSlide),slideRels0=await read(sourceSlideRels);
  const layoutRel=relEntries(slideRels0).filter(r=>r.attrs.Type===R+'/slideLayout');if(layoutRel.length!==1)throw Error('Single-column layout reference changed');
  const layout=partTarget(sourceSlide,layoutRel[0].attrs.Target),layoutRels=relationshipPart(layout),layoutXml0=await read(layout),layoutRels0=await read(layoutRels);
  const owner=relEntries(layoutRels0).filter(r=>r.attrs.Type===R+'/slideMaster');if(owner.length!==1||partTarget(layout,owner[0].attrs.Target)!==master)throw Error('Single-column master reference changed');
  const masterXml0=await read(master),masterRels0=await read(masterRels),themeXml0=await read(theme),pending=new Map();
  let pres=await read(graph.presentationPart),presRels=await read(graph.presentationRels),types=await read('[Content_Types].xml');
  const originalIds=Array.from((pres.match(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/)||[''])[0].matchAll(/<p:sldId\b[^>]*\/>/g),m=>m[0]);if(originalIds.length!==1)throw Error('Expected only the retained single-column source before scheme expansion');
  const insertedIds=[];
  function add(part,xml,type){if(zip.file(part)||pending.has(part))throw Error('Package part collision: '+part);pending.set(part,xml);if(type)types=types.replace('</Types>','<Override PartName="/'+part+'" ContentType="'+type+'"/></Types>');}
  for(let i=0;i<SINGLE_SCHEMES.length;i++){
   const scheme=SINGLE_SCHEMES[i],masterPart='ppt/slideMasters/slideMasterScheme'+scheme.id+'.xml',layoutPart='ppt/slideLayouts/slideLayoutScheme'+scheme.id+'.xml',themePart='ppt/slideMasters/theme/themeScheme'+scheme.id+'.xml',layoutId='rIdSingleLayout'+scheme.id;
   const slots={...profile.palette.slots};scheme.accents.forEach((c,j)=>slots['accent'+(j+1)]=c);
   const localProfile={...profile,palette:{...profile.palette,accents:scheme.accents.slice(),slots}};
   let themed=NativeStyles.profileThemeXml(themeXml0,localProfile);
   themed=themed.replace(/(<a:theme\b[^>]*\bname=")[^"]*(")/,(_,a,b)=>a+esc(scheme.label)+b).replace(/(<a:clrScheme\b[^>]*\bname=")[^"]*(")/,(_,a,b)=>a+esc(scheme.label)+b);
   add(themePart,themed,'application/vnd.openxmlformats-officedocument.theme+xml');
   let masterXml=masterXml0.replace(/<p:sldLayoutIdLst>[\s\S]*?<\/p:sldLayoutIdLst>/,'<p:sldLayoutIdLst><p:sldLayoutId xmlns:r="'+R+'" id="'+(2147483800+i)+'" r:id="'+layoutId+'"/></p:sldLayoutIdLst>');
   masterXml=masterXml.replace(/(<p:cSld\b[^>]*\bname=")[^"]*(")/,(_,a,b)=>a+esc(scheme.label)+b);
   let mr=masterRels0;
   for(const r of relEntries(masterRels0)){
    if(r.attrs.Type===R+'/slideLayout')mr=mr.replace(r.xml,'');
    else if(r.attrs.Type===R+'/theme')mr=mr.replace(r.xml,r.xml.replace(/Target="[^"]*"/,'Target="/'+themePart+'"'));
   }
   mr=mr.replace('</Relationships>','<Relationship Id="'+layoutId+'" Type="'+R+'/slideLayout" Target="/'+layoutPart+'"/></Relationships>');
   add(masterPart,masterXml,'application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml');add(relationshipPart(masterPart),mr);
   let lx=layoutXml0.replace(/(<p:cSld\b[^>]*\bname=")[^"]*(")/,(_,a,b)=>a+esc(scheme.label)+b);
   lx=lx.replace(/<p:sldLayout\b[^>]*>/,tag=>/\bpreserve=/.test(tag)?tag.replace(/preserve="[^"]*"/,'preserve="1"'):tag.replace(/>$/,' preserve="1">'));
   add(layoutPart,lx,'application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml');
   add(relationshipPart(layoutPart),layoutRels0.replace(owner[0].xml,owner[0].xml.replace(/Target="[^"]*"/,'Target="/'+masterPart+'"')));
   const rid='rIdSingleMaster'+scheme.id;
   pres=pres.replace('</p:sldMasterIdLst>','<p:sldMasterId xmlns:r="'+R+'" id="'+(2147483700+i)+'" r:id="'+rid+'"/></p:sldMasterIdLst>');
   presRels=presRels.replace('</Relationships>','<Relationship Id="'+rid+'" Type="'+R+'/slideMaster" Target="/'+masterPart+'"/></Relationships>');
   const slidePart=i===0?sourceSlide:'ppt/slides/slideScheme'+scheme.id+'.xml';
   let sx=numbered(slideXml0,i+1).replace('<a:t>單欄內容</a:t>','<a:t>'+esc(scheme.label)+'</a:t>');
   sx=singleThemeSamples(sx);
   sx=sx.replace(/(<p:cSld\b[^>]*\bname=")[^"]*(")/,(_,a,b)=>a+esc(scheme.label)+b);
   let sr=slideRels0.replace(layoutRel[0].xml,layoutRel[0].xml.replace(/Target="[^"]*"/,'Target="/'+layoutPart+'"'));
   if(i===0){pending.set(slidePart,sx);pending.set(sourceSlideRels,sr);}
   else{
    // Retained notes keep their exact owner/backlink. New content copies do not
    // share a notesSlide with the original source slide.
    for(const r of relEntries(sr))if(r.attrs.Type===R+'/notesSlide')sr=sr.replace(r.xml,'');
    add(slidePart,sx,'application/vnd.openxmlformats-officedocument.presentationml.slide+xml');add(relationshipPart(slidePart),sr);
    const sid='rIdSingleScheme'+scheme.id;
    presRels=presRels.replace('</Relationships>','<Relationship Id="'+sid+'" Type="'+R+'/slide" Target="/'+slidePart+'"/></Relationships>');
    insertedIds.push('<p:sldId xmlns:r="'+R+'" id="'+(400+i)+'" r:id="'+sid+'"/>');
   }
  }
  pres=pres.replace(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/,'<p:sldIdLst>'+[originalIds[0],...insertedIds].join('')+'</p:sldIdLst>');
  pending.set(graph.presentationPart,pres);pending.set(graph.presentationRels,presRels);pending.set('[Content_Types].xml',types);
  for(const [part,xml]of pending)zip.file(part,xml,{date:stamp,createFolders:false});
 }
 async function appendDownloadPages(JSZip,{zip,profile,stamp},options){
  const components=[];for(const presetId of COMPONENT_STYLES)components.push(...await componentSlides(JSZip,profile,{...options,presetId,startPage:pageNumber('catalog',presetId)}));
  const first=pageNumber('rectangles-1'),pages=[materialCards(profile,0,first),materialCards(profile,1,pageNumber('rectangles-2')),materialHighlights(pageNumber('native-highlight')),...components];
  let pres=await zip.file('ppt/presentation.xml').async('string'),rels=await zip.file('ppt/_rels/presentation.xml.rels').async('string'),types=await zip.file('[Content_Types].xml').async('string');
  pages.forEach((entry,i)=>{
   const xml=typeof entry==='string'?entry:entry.xml,links=typeof entry==='string'?'':entry.relationships.join('');
   const number=i+first,part='slideMaterial'+number,rid='rIdFixedMaterial'+number;
   zip.file('ppt/slides/'+part+'.xml',xml,{date:stamp,createFolders:false});
   zip.file('ppt/slides/_rels/'+part+'.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLayout" Type="'+R+'/slideLayout" Target="../slideLayouts/slideLayout6.xml"/>'+links+'</Relationships>',{date:stamp,createFolders:false});
   pres=pres.replace('</p:sldIdLst>','<p:sldId xmlns:r="'+R+'" id="'+(300+number)+'" r:id="'+rid+'"/></p:sldIdLst>');
   rels=rels.replace('</Relationships>','<Relationship Id="'+rid+'" Type="'+R+'/slide" Target="slides/'+part+'.xml"/></Relationships>');
   types=types.replace('</Types>','<Override PartName="/ppt/slides/'+part+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>');
  });
  for(const [part,value]of [['ppt/presentation.xml',pres],['ppt/_rels/presentation.xml.rels',rels],['[Content_Types].xml',types]])zip.file(part,value,{date:stamp,createFolders:false});
  const app=await zip.file('docProps/app.xml').async('string');zip.file('docProps/app.xml',app.replace(/(<(?:\w+:)?Slides>)\d+(<\/(?:\w+:)?Slides>)/,(_,a,b)=>a+DOWNLOAD_PAGES.length+b),{date:stamp,createFolders:false});
 }
 async function exportMaterials(JSZip,snapshot={}){
  const state=normalize(snapshot),{zip,profile,stamp}=await prepareTemplate(JSZip,[],{selectedSchemes:true});
  // Keep retained notes/master/layouts. Replace the three visible slides and only
  // their layout links; no original source file or theme seed is rewritten.
  const pages=[['slideCover',materialCards(profile,0)],['slide1',materialCards(profile,1)],['slide2',materialHighlights()]];
  for(const [part,xml]of pages){const relPath='ppt/slides/_rels/'+part+'.xml.rels',entry=zip.file(relPath);let rels=await entry.async('string');let count=0;
   rels=rels.replace(/<Relationship\b[^>]*\/>/g,tag=>{if(!tag.includes('Type="'+R+'/slideLayout"'))return tag;count++;return tag.replace(/Target="[^"]*"/,'Target="../slideLayouts/slideLayout6.xml"');});
   if(count!==1)throw Error('素材版面關係不符預期，已停止匯出。');
   zip.file('ppt/slides/'+part+'.xml',xml,{date:stamp,createFolders:false});zip.file(relPath,rels,{date:entry.date,createFolders:false});
  }
  return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
 }
 function preview(model){
  const text=(x,y,value,size,color='333333',bold=false)=>`<text x="${x}" y="${y}" font-size="${size*4/3}" fill="#${color}"${bold?' font-weight="700"':''}>${esc(value)}</text>`;
  function object(o){if(o.kind==='group')return o.items.map(object).join('');if(o.kind==='text')return (o.highlight?`<rect x="${o.x}" y="${o.y+2}" width="${Math.min(o.w,Array.from(o.text).reduce((sum,ch)=>sum+(/[\x00-\x7f]/.test(ch)?.55:1),0)*o.size*4/3)}" height="${o.h*.82}" fill="#${o.highlight}"/>`:'')+text(o.x,o.y+o.h/2+o.size*.45,o.text,o.size,o.color,o.bold);if(o.kind==='table')return o.rows.map((row,r)=>row.map((v,col)=>{const c=tableCell(o,r,col),w=o.w/3,h=o.h/o.rows.length,x=o.x+col*w,y=o.y+r*h;return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#${c.bg}" stroke="#${c.line}"/>`+(c.side?`<rect x="${x}" y="${y}" width="4" height="${h}" fill="#${o.color}"/>`:'')+text(x+12,y+h/2+7,v,16,c.fg,r===0);}).join('')).join('');return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="${o.fill?'#'+o.fill:'none'}" fill-opacity="${(o.alpha||100000)/100000}" stroke="${o.line?'#'+o.line:'none'}" stroke-width="1.67"/>`;}
  const ph=model.placeholders.filter(p=>p.index!=='10').map(p=>{const box=model.sourceLayout.placeholders[p.index],title=p.index==='0',header=model.layout.key==='7'&&['2','4'].includes(p.index),plain=['1','3'].includes(model.layout.key)||model.layout.key==='5'&&['1','3'].includes(p.index);let y=box.y;let xml=header?`<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="#282398"/>`:'';for(const l of p.lines){const size=title?32:header?24:plain?24:[24,18,14][Math.min(l.level||0,2)],lv=l.level||0,left=title||header||plain?0:[28.8,81.6,115.2][Math.min(lv,2)];y+=size*4/3;if(!title&&!header&&!plain){const mark=['●','■','◆'][Math.min(lv,2)],scale=[.5,.75,1][Math.min(lv,2)];xml+=text(box.x+left-[28.8,32,26.67][Math.min(lv,2)],y,mark,size*scale,lv===0?'C00000':'333333');}xml+=text(box.x+left+(header?18:0),y,l.text,size,title?'C00000':header?'FFFFFF':'333333',title||header||plain&&model.layout.key==='5');y+=8;}return xml;}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-label="母片組合 HTML 示意，非 PowerPoint 忠實縮圖" style="font-family:'Microsoft JhengHei','微軟正黑體',sans-serif"><rect width="1280" height="720" fill="#FFFFFF"/><image href="${DATA.logo}" x="1194.67" y="12.13" width="64.4" height="48.67"/>${text(1147,83,'Unleash Innovation',8,'999999',true)}${ph}${model.objects.map(object).join('')}<rect y="692.48" width="1280" height="3.2" fill="#FF0000"/><rect y="695.68" width="1280" height="24.32" fill="#000000"/>${text(10,714,'© 2021 TSMC, Ltd',9,'FFFFFF',true)}${text(637,714,'4',9,'FFFFFF')}${text(1180,714,'TSMC Property',9,'FFFFFF',true)}</svg>`;
 }
 // Bound both grid tracks and items: the 540px schematic must scroll inside its canvas, not size the mobile editor.
 const CSS=`body.tabM .wrap{grid-template-columns:1fr}body.tabM #panel,body.tabM #bPanel{display:none!important}.fm{width:100%;min-width:0;max-width:1260px;margin:auto;color:#333;font:14px 'Microsoft JhengHei','微軟正黑體',sans-serif}.fm *{box-sizing:border-box}.fm h2{margin:0 0 8px;font-size:24px}.fm p{line-height:1.65}.fmLead{max-width:850px}.fmLock{display:inline-block;color:#940000;background:#FFF1F1;border:1px solid #EDD0D0;border-radius:6px;padding:5px 9px;font-size:12px;font-weight:700}.fmLayout{display:grid;grid-template-columns:300px minmax(0,1fr);gap:22px;margin-top:18px}.fmLayout>*,.fmControls,.fmControls>*{min-width:0}.fmControls label{display:block;font-weight:700;margin:0 0 14px}.fmControls select,.fmControls input{display:block;width:100%;min-width:0;max-width:100%;min-height:44px;border:1px solid #BCC2C9;border-radius:6px;background:#FFF;color:#333;font:inherit;padding:9px;margin-top:6px}.fmPalette{max-width:720px;margin:16px 0}.fmPalette label{display:block;font-weight:700}.fmPalette select{display:block;width:100%;max-width:360px;min-height:44px;margin-top:6px;padding:9px;border:1px solid #BCC2C9;border-radius:6px;background:#FFF;color:#333;font:inherit}.fmAccentList{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0}.fmAccentList li{display:flex;align-items:center;gap:5px;font-size:12px}.fmAccentList i{display:inline-block;width:20px;height:20px;border:1px solid #AAA;border-radius:4px}.fmAccentList .fmSeparate{border-left:1px solid #AAA;padding-left:12px}.fm button{font:inherit;min-height:44px;border:1px solid #BCC2C9;border-radius:6px;background:#FFF;color:#333;padding:8px 12px;cursor:pointer}.fm button:focus-visible,.fm input:focus-visible,.fm select:focus-visible{outline:3px solid #C00000;outline-offset:2px}.fm button:disabled,.fm select:disabled,.fm input:disabled{opacity:.6;cursor:default}.fmColors{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 16px}.fmColors button{min-width:44px;padding:7px}.fmColors i{display:block;width:20px;height:20px;margin:auto auto 3px;border:1px solid #aaa;border-radius:50%}.fm button[aria-pressed=true]{outline:2px solid #C00000;outline-offset:1px}.fmCanvas{min-width:0;max-width:100%;border:1px solid #D4D6D9;background:#fff;overflow:auto}.fmCanvas svg{display:block;width:100%;height:auto;min-width:540px}.fmCaption,.fmNote{font-size:12px;color:#595959}.fmActions,.fmPresets{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.fmActions .fmPrimary{background:#A60000;color:#FFF;border-color:#A60000;font-weight:700}.fmWhite{padding:10px 12px;background:#F3F4F6;border-left:3px solid #7D8795}.fmOrigins{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.fmOriginal,.fmAdded{padding:12px;background:#FAFAFA;border:1px solid #D5D8DD;border-top:3px solid #C00000;border-radius:5px;line-height:1.6}.fmOriginal strong,.fmAdded strong{display:block}.fmStatus{min-height:1.6em;color:#8C0000}.fm details{margin-top:18px;border-top:1px solid #DDD;padding-top:12px}.fm summary{cursor:pointer;font-weight:700}.fm code{overflow-wrap:anywhere;font-size:11px}.fm[aria-busy=true] .fmControls{opacity:.8}@media(max-width:850px){.fmLayout{grid-template-columns:minmax(0,1fr)}.fmControls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}.fmColors,.fmFull{grid-column:1/-1}.fmOrigins{grid-template-columns:1fr 1fr}}@media(max-width:480px){.fmControls{grid-template-columns:minmax(0,1fr)}.fmOrigins{grid-template-columns:1fr}.fmCanvas svg{min-width:540px}.fmActions button{width:100%}}`;
 const EXTRA_CSS='.fmOriginal,.fmAdded{margin:0;padding:8px;overflow:hidden}.fmOriginal img,.fmAdded img{display:block;width:100%;height:auto;margin-top:8px}.fmOriginal figcaption,.fmAdded figcaption{font-weight:700}.fmGalleryScroll{max-width:100%;overflow:auto;padding:6px}.fmGalleryScroll:focus-visible{outline:3px solid #C00000;outline-offset:-3px}.fmGallery{min-width:800px}.fmGalleryRow{display:grid;grid-template-columns:135px repeat(7,minmax(72px,1fr));gap:12px;align-items:center;margin:16px 0}.fmGalleryRow strong{font-size:12px}.fmCard{display:flex;align-items:center;justify-content:center;height:48px;font-size:12px;box-sizing:border-box}.fmHighlightList{display:flex;flex-wrap:wrap;gap:18px}.fmHighlightList span{display:flex;flex-direction:column;gap:8px}.fmHighlightList mark{font-size:20px;padding:0 2px}.fmHighlightList small{font-size:11px;color:#595959}@media(max-width:480px){.fmOrigins{grid-template-columns:1fr}.fmPalette{max-width:100%}}';
 const records=new WeakMap();
 function render(container,options={}){
  if(!container)return;let r=records.get(container);if(!r){r={state:normalize(options.state),busy:false,status:'',examplesOpen:false,options};records.set(container,r);}else{r.options=options;if(options.state&&!r.busy)r.state=normalize(options.state);}
  const doc=container.ownerDocument;if(!doc.getElementById('fixedMasterCss')){const el=doc.createElement('style');el.id='fixedMasterCss';el.textContent=CSS+EXTRA_CSS;doc.head.appendChild(el);}
  const notify=()=>{if(r.options.onChange)r.options.onChange(clone(r.state));};
  function gallery(colors){return '<div class="fmGallery" role="table" aria-label="十款可編輯矩形，七欄色彩">'+NativeStyles.KIT_EFFECTS.map((row,i)=>'<div class="fmGalleryRow" role="row"><strong role="rowheader">'+esc(row.label)+'</strong>'+colors.map((color,j)=>{const e=NativeStyles.kitEffect(color,i,'000000','FFFFFF','44546A'),sh=e.shadow;return '<div class="fmCard" role="cell" data-fm-card="'+i+':'+j+'" style="background:#'+e.backgrounds[0]+';color:#'+e.foreground+';border:'+(e.line?e.lineWidth*4/3+'px solid #'+e.lineColor:'0')+';border-radius:'+e.radius*4/3+'px;font-weight:'+(e.bold?700:400)+';'+(sh?'box-shadow:0 '+sh.offset*4/3+'px '+sh.blur*4/3+'px rgba(0,0,0,'+sh.alpha+');':'')+'">'+esc(e.text)+'</div>';}).join('')+'</div>').join('')+'</div>';}
  function draw(){const old=container.querySelector('[data-fm-examples]');if(old)r.examplesOpen=old.open;const active=doc.activeElement,key=active&&container.contains(active)?active.getAttribute('data-fm-field'):null,disabled=r.busy?' disabled':'',s=r.state;
   const colors=SINGLE_SCHEMES[0].accents,previewData=doc.defaultView.FixedMasterPreviews,previews=previewData&&previewData.pages===DOWNLOAD_PAGES.length?previewData:null;
   container.innerHTML='<div class="fm" aria-busy="'+r.busy+'"><span class="fmLock">固定母片 · 不跟隨網站風格</span><h2>投影片母片</h2><div class="fmActions"><button type="button" class="fmPrimary" data-fm-download="template"'+disabled+'>下載 '+DOWNLOAD_PAGES.length+' 頁母片</button></div><p class="fmStatus" role="status" aria-live="polite" data-fm-status>'+esc(r.status)+'</p><div class="fmOrigins" aria-label="'+DOWNLOAD_PAGES.length+' 頁母片預覽">'+DOWNLOAD_PAGES.map((p,i)=>'<figure class="'+(p.schemeId?'fmOriginal':'fmAdded')+'"><figcaption>第 '+(i+1)+' 頁 · '+esc(p.label)+'</figcaption>'+(previews&&previews.images&&previews.images[i]?'<img src="'+previews.images[i]+'" alt="'+esc(p.label)+'" width="960" height="540">':'<p>'+esc(p.title)+'</p>')+'</figure>').join('')+'</div></div>';
   if(key){const next=container.querySelector('[data-fm-field="'+key+'"]');if(next&&!next.disabled)next.focus();}
   container.onclick=async e=>{const b=e.target.closest('button[data-fm-download]');if(!b||!container.contains(b)||r.busy)return;const mode=b.dataset.fmDownload;if(!['template','materials'].includes(mode))return;const snapshot=clone(r.state);r.focusDownload=mode;r.busy=true;r.status='正在準備原生封裝…';draw();try{const result=await r.options.onDownload({mode,selection:snapshot});r.status=result===false?'已取消；設定保留。':(mode==='template'?'已產生 '+DOWNLOAD_PAGES.length+' 頁母片':'已產生三頁卡片與文字素材')+'並交由瀏覽器處理；請確認下載紀錄。';}catch(err){r.status='未完成下載：'+err.message;}finally{r.busy=false;draw();if(container.isConnected&&!container.hidden&&doc.activeElement===doc.body){const done=container.querySelector('[data-fm-download="'+r.focusDownload+'"]');if(done)done.focus();}}};
  }
  draw();
 }
 return Object.freeze({COLORS,HIGHLIGHTS,STYLES,MARKERS,PALETTES,ORIGINAL_ACCENTS,LAYOUTS,PRESETS,TEMPLATE_PAGES,DOWNLOAD_PAGES,DOWNLOAD_SECTIONS,SINGLE_SCHEMES,COMPONENT_STYLES,COMPONENT_PAGES,componentModel,normalize,validate,combinations,build,preview,slideXml,originalBytes,exportPptx,exportMaterials,render,getState:container=>records.has(container)?clone(records.get(container).state):null,sourceSha256:DATA.sha256});
});
