/* Fixed source master is an independent contract, NOT a Deck/QuickStyles theme.
 * Native export derives the requested three-page template from an immutable source ZIP. */
(function(root,factory){'use strict';if(typeof module!=='undefined'&&module.exports)module.exports=factory(require('./fixed-master-data.js'),require('./native-styles.js'));else root.FixedMaster=factory(root.FixedMasterData,root.NativeStyles);})(typeof window!=='undefined'?window:this,function(DATA,NativeStyles){
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
  const profile=await NativeStyles.nativeStyleProfile(zip,{source:options.source==='theme'||options.paletteSource==='theme'?'theme':'common'});
  let pres=await zip.file('ppt/presentation.xml').async('string'),rels=await zip.file('ppt/_rels/presentation.xml.rels').async('string'),types=await zip.file('[Content_Types].xml').async('string');
  // The user-selected cover is not original slide 1: retain original content slides 1/2,
  // remove comparison/report and their unused note, then prepend a native layout-1 cover.
  const removed=['ppt/slides/slide3.xml','ppt/slides/_rels/slide3.xml.rels','ppt/slides/slide4.xml','ppt/slides/_rels/slide4.xml.rels','ppt/notesSlides/notesSlide3.xml','ppt/notesSlides/_rels/notesSlide3.xml.rels'];
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
  addSlide('slideCover',1,slideXml(cover,1),260,'rIdFixedCover');
  for(const [part,number,id,rid]of [['slide1',2,256,'Rbbb39bd5704c4961'],['slide2',3,257,'Re12590bd29d746d8']]){
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
  const {zip}=await prepareTemplate(JSZip,values,options);
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
 function materialCards(profile,pageIndex){
  const palette=profile.palette,slots=palette.slots,cols=[slots.dk1,...palette.accents],roles=['tx1','accent1','accent2','accent3','accent4','accent5','accent6'];
  const p=materialPage('可編輯矩形樣式 '+(pageIndex+1)+' / 2',pageIndex+1),solid=c=>'<a:solidFill>'+c+'</a:solidFill>',rgb=c=>'<a:srgbClr val="'+c+'"/>';
  p.label('Materials palette scope',40,93,1100,30,(palette.source==='common'?'常用六色':'原母片六色')+' · 原母片字型與主題效果 · 可複製形狀後改字',12);
  cols.forEach((color,j)=>p.label('Palette slot '+j,184+j*150,133,142,25,(j?'Accent '+j:'Text1')+' #'+color,9));
  NativeStyles.KIT_EFFECTS.slice(pageIndex*5,pageIndex*5+5).forEach((spec,k)=>{
   const row=pageIndex*5+k,y=180+k*91;
   p.label('Material effect '+row,40,y,132,57,spec.label,12);
   cols.forEach((color,j)=>{
    const role=roles[j],e=NativeStyles.kitEffect(color,row,slots.dk1,slots.lt1,slots.dk2),foreground=e.fontRole==='self'?role:e.fontRole;
    const background=row===5?rgb('F2F2F2'):NativeStyles.colorXml(e.fillRole==='self'?role:e.fillRole,row===4?[['tint',20000]]:e.fillMods);
    const line=e.line?'<a:ln w="'+Math.round(e.lineWidth*12700)+'" cap="flat" cmpd="sng" algn="ctr">'+solid([0,1,3].includes(row)?rgb(e.lineColor):NativeStyles.colorXml(e.lineRole==='self'?role:e.lineRole,e.lineMods))+'<a:prstDash val="solid"/><a:round/></a:ln>':'<a:ln><a:noFill/></a:ln>';
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
 function materialHighlights(){
  const p=materialPage('八色原生文字螢光筆',3);
  p.label('Native highlight introduction',40,94,1140,35,'顏色作用於文字本身，改字時隨文字延伸；不含獨立底帶，也不自動修改文字顏色。',13);
  HIGHLIGHTS.forEach((c,i)=>{const y=150+i*56;p.label('Native highlight label '+(i+1),65,y,300,42,c.label+' #'+c.color,16);p.label('Native highlight '+(i+1),420,y,780,42,'Yield improved 良率提升',20,['dark-gray','navy'].includes(c.key)?'FFFFFF':'333333',c.color);});
  p.label('Reference blue note',40,611,1160,27,'參考藍保留 #7C9CC3。深灰與深藍範例以白字展示；套用醒目提示不會自動修改字色。',11);
  p.label('Highlight ribbon limits',40,647,1160,27,'八色已寫入近期色資料；內建 15 色選單不會被替換，近期色顯示、順序及保留仍依 PowerPoint 而定。',10);
  return p.xml();
 }
 async function exportMaterials(JSZip,snapshot={}){
  const state=normalize(snapshot),{zip,profile,stamp}=await prepareTemplate(JSZip,[],{source:state.paletteSource});
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
 const CSS=`body.tabM .wrap{grid-template-columns:1fr}body.tabM #panel,body.tabM #bPanel{display:none!important}.fm{width:100%;min-width:0;max-width:1260px;margin:auto;color:#333;font:14px 'Microsoft JhengHei','微軟正黑體',sans-serif}.fm *{box-sizing:border-box}.fm h2{margin:0 0 8px;font-size:24px}.fm p{line-height:1.65}.fmLead{max-width:850px}.fmLock{display:inline-block;color:#940000;background:#FFF1F1;border:1px solid #EDD0D0;border-radius:6px;padding:5px 9px;font-size:12px;font-weight:700}.fmLayout{display:grid;grid-template-columns:300px minmax(0,1fr);gap:22px;margin-top:18px}.fmLayout>*,.fmControls,.fmControls>*{min-width:0}.fmControls label{display:block;font-weight:700;margin:0 0 14px}.fmControls select,.fmControls input{display:block;width:100%;min-width:0;max-width:100%;min-height:44px;border:1px solid #BCC2C9;border-radius:6px;background:#FFF;color:#333;font:inherit;padding:9px;margin-top:6px}.fmPalette{max-width:720px;margin:16px 0}.fmPalette label{display:block;font-weight:700}.fmPalette select{display:block;width:100%;max-width:360px;min-height:44px;margin-top:6px;padding:9px;border:1px solid #BCC2C9;border-radius:6px;background:#FFF;color:#333;font:inherit}.fmAccentList{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0}.fmAccentList li{display:flex;align-items:center;gap:5px;font-size:12px}.fmAccentList i{display:inline-block;width:20px;height:20px;border:1px solid #AAA;border-radius:4px}.fmAccentList .fmSeparate{border-left:1px solid #AAA;padding-left:12px}.fm button{font:inherit;min-height:44px;border:1px solid #BCC2C9;border-radius:6px;background:#FFF;color:#333;padding:8px 12px;cursor:pointer}.fm button:focus-visible,.fm input:focus-visible,.fm select:focus-visible{outline:3px solid #C00000;outline-offset:2px}.fm button:disabled,.fm select:disabled,.fm input:disabled{opacity:.6;cursor:default}.fmColors{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 16px}.fmColors button{min-width:44px;padding:7px}.fmColors i{display:block;width:20px;height:20px;margin:auto auto 3px;border:1px solid #aaa;border-radius:50%}.fm button[aria-pressed=true]{outline:2px solid #C00000;outline-offset:1px}.fmCanvas{min-width:0;max-width:100%;border:1px solid #D4D6D9;background:#fff;overflow:auto}.fmCanvas svg{display:block;width:100%;height:auto;min-width:540px}.fmCaption,.fmNote{font-size:12px;color:#595959}.fmActions,.fmPresets{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.fmActions .fmPrimary{background:#A60000;color:#FFF;border-color:#A60000;font-weight:700}.fmWhite{padding:10px 12px;background:#F3F4F6;border-left:3px solid #7D8795}.fmOrigins{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.fmOriginal{padding:12px;background:#FAFAFA;border:1px solid #D5D8DD;border-top:3px solid #C00000;border-radius:5px;line-height:1.6}.fmOriginal strong{display:block}.fmStatus{min-height:1.6em;color:#8C0000}.fm details{margin-top:18px;border-top:1px solid #DDD;padding-top:12px}.fm summary{cursor:pointer;font-weight:700}.fm code{overflow-wrap:anywhere;font-size:11px}.fm[aria-busy=true] .fmControls{opacity:.8}@media(max-width:850px){.fmLayout{grid-template-columns:minmax(0,1fr)}.fmControls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}.fmColors,.fmFull{grid-column:1/-1}.fmOrigins{grid-template-columns:1fr 1fr}}@media(max-width:480px){.fmControls{grid-template-columns:minmax(0,1fr)}.fmOrigins{grid-template-columns:1fr}.fmCanvas svg{min-width:540px}.fmActions button{width:100%}}`;
 const EXTRA_CSS='.fmOriginal{margin:0;padding:8px;overflow:hidden}.fmOriginal img{display:block;width:100%;height:auto;margin-top:8px}.fmOriginal figcaption{font-weight:700}.fmGalleryScroll{max-width:100%;overflow:auto;padding:6px}.fmGalleryScroll:focus-visible{outline:3px solid #C00000;outline-offset:-3px}.fmGallery{min-width:800px}.fmGalleryRow{display:grid;grid-template-columns:135px repeat(7,minmax(72px,1fr));gap:12px;align-items:center;margin:16px 0}.fmGalleryRow strong{font-size:12px}.fmCard{display:flex;align-items:center;justify-content:center;height:48px;font-size:12px;box-sizing:border-box}.fmHighlightList{display:flex;flex-wrap:wrap;gap:18px}.fmHighlightList span{display:flex;flex-direction:column;gap:8px}.fmHighlightList mark{font-size:20px;padding:0 2px}.fmHighlightList small{font-size:11px;color:#595959}@media(max-width:480px){.fmOrigins{grid-template-columns:1fr}.fmPalette{max-width:100%}}';
 const records=new WeakMap();
 function render(container,options={}){
  if(!container)return;let r=records.get(container);if(!r){r={state:normalize(options.state),busy:false,status:'',examplesOpen:false,options};records.set(container,r);}else{r.options=options;if(options.state&&!r.busy)r.state=normalize(options.state);}
  const doc=container.ownerDocument;if(!doc.getElementById('fixedMasterCss')){const el=doc.createElement('style');el.id='fixedMasterCss';el.textContent=CSS+EXTRA_CSS;doc.head.appendChild(el);}
  const notify=()=>{if(r.options.onChange)r.options.onChange(clone(r.state));};
  function gallery(colors){return '<div class="fmGallery" role="table" aria-label="十款可編輯矩形，七欄色彩">'+NativeStyles.KIT_EFFECTS.map((row,i)=>'<div class="fmGalleryRow" role="row"><strong role="rowheader">'+esc(row.label)+'</strong>'+colors.map((color,j)=>{const e=NativeStyles.kitEffect(color,i,'000000','FFFFFF','44546A'),sh=e.shadow;return '<div class="fmCard" role="cell" data-fm-card="'+i+':'+j+'" style="background:#'+e.backgrounds[0]+';color:#'+e.foreground+';border:'+(e.line?e.lineWidth*4/3+'px solid #'+e.lineColor:'0')+';border-radius:'+e.radius*4/3+'px;font-weight:'+(e.bold?700:400)+';'+(sh?'box-shadow:0 '+sh.offset*4/3+'px '+sh.blur*4/3+'px rgba(0,0,0,'+sh.alpha+');':'')+'">'+esc(e.text)+'</div>';}).join('')+'</div>').join('')+'</div>';}
  function draw(){const old=container.querySelector('[data-fm-examples]');if(old)r.examplesOpen=old.open;const active=doc.activeElement,key=active&&container.contains(active)?active.getAttribute('data-fm-field'):null,disabled=r.busy?' disabled':'',s=r.state;
   const colors=s.paletteSource==='theme'?ORIGINAL_ACCENTS:COLORS.slice(0,6).map(c=>c.color),previews=doc.defaultView.FixedMasterPreviews;
   container.innerHTML='<div class="fm" aria-busy="'+r.busy+'"><span class="fmLock">固定母片 · 不跟隨網站風格</span><h2>投影片母片</h2><p class="fmLead">保留原母片外觀與內容，強化下載檔主題效果。三頁母片維持封面、單欄內容、雙欄內容，紅色標題、字型、bullet、原標誌與頁尾保留。</p><div class="fmOrigins" aria-label="指定的三頁母片">'+TEMPLATE_PAGES.map((p,i)=>'<figure class="fmOriginal"><figcaption>第 '+(i+1)+' 頁 · '+esc(p.label)+'</figcaption>'+(previews&&previews.images&&previews.images[i]?'<img src="'+previews.images[i]+'" alt="'+esc(p.label)+'，Microsoft PowerPoint 轉圖" width="960" height="540">':'<p>'+esc(p.title)+'</p>')+'</figure>').join('')+'</div><p class="fmNote">三頁預覽為 Microsoft PowerPoint 渲染；不同電腦若缺少微軟正黑體，可能替換字型。</p><section class="fmPalette" aria-label="母片與素材共用配色"><label>下載檔採用的快速樣式配色<select data-fm-field="paletteSource"'+disabled+'>'+PALETTES.map(c=>'<option value="'+c.key+'"'+(c.key===s.paletteSource?' selected':'')+'>'+esc(c.key==='theme'?'原母片主題色':'常用色：紅、黃、藍、綠、灰、紫')+'</option>').join('')+'</select></label><ul class="fmAccentList" aria-label="六個 Accent 與另選白色">'+colors.map((c,i)=>'<li><i style="background:#'+c+'"></i>Accent '+(i+1)+(s.paletteSource==='common'?' · '+COLORS[i].label:'')+'</li>').join('')+'<li class="fmSeparate"><i style="background:#FFFFFF"></i>白色另選 · Text1 保持深色</li></ul><p class="fmNote">兩個下載採用同一組母片配色與字型。這會更新下載檔的一組 Accent 1–6 與主題效果，不會新增第二組 Ribbon 快速樣式選單。來源檔案保持不變。</p></section><div class="fmActions"><button type="button" class="fmPrimary" data-fm-download="template"'+disabled+'>下載三頁母片</button><button type="button" data-fm-download="materials"'+disabled+'>下載卡片與文字素材</button></div><p class="fmNote">素材另為三頁：兩頁 70 個可編輯矩形、一頁 8 種原生文字螢光筆；不放進主母片。可複製需要的素材到母片，再修改文字。</p><p class="fmStatus" role="status" aria-live="polite" data-fm-status>'+esc(r.status)+'</p><details data-fm-examples'+(r.examplesOpen?' open':'')+'><summary>預覽卡片與文字素材</summary><p class="fmNote">前三款是外層白卡：深灰框柔影、細灰框柔影、主色框柔影。七欄為 Text1 與 Accent 1–6。這些是可編輯矩形預設，不代表 Ribbon 有十個完全相同的按鈕。白色填滿可在 PowerPoint 另選。</p><div class="fmGalleryScroll" tabindex="0" role="region" aria-label="矩形素材預覽，可左右捲動">'+gallery(['000000',...colors])+'</div><h3>原生文字螢光筆</h3><div class="fmHighlightList">'+HIGHLIGHTS.map(c=>'<span><mark style="background:#'+c.color+';color:#'+(['dark-gray','navy'].includes(c.key)?'FFFFFF':'333333')+'">'+esc(c.label)+'文字</mark><small>#'+c.color+'</small></span>').join('')+'</div><p class="fmNote">八色使用真正的文字醒目提示格式，跟隨文字編輯，沒有獨立底帶。參考藍為 #7C9CC3；深灰、深藍範例以白字展示，套用醒目提示不會自動修改您的字色。近期色不保證各版本顯示、順序或永久保留，也不替換內建 15 色。</p></details><details><summary>固定規格與使用範圍</summary><p>16:9 · 1280 × 720；固定紅色標題、微軟正黑體與原生 bullet。來源 master、layouts、logo 及頁尾保留；衍生檔僅按配色更新 Accent 與指定主題填色、線條、效果，文字色槽、字型配置、背景樣式及 notes 主題保留。</p><p>PowerPoint 的樣式選單組合與字色仍由 Office 控制。為讓淺主題色搭白字仍可讀，原生填色已加深；共用填色槽使部分內建線框樣式呈灰底。需要白底外卡請使用上方卡片素材。矩形素材使用主題色與明確形狀格式確保外觀；複製時使用保留來源格式。原生 API 驗證不等於 Ribbon 點擊驗收。瀏覽器可能限制 blob 下載，請確認下載紀錄。</p></details></div>';
   if(key){const next=container.querySelector('[data-fm-field="'+key+'"]');if(next&&!next.disabled)next.focus();}
   container.querySelector('[data-fm-field="paletteSource"]').onchange=e=>{if(r.busy)return;r.state=normalize({...r.state,paletteSource:e.target.value});r.status='';notify();draw();};
   container.onclick=async e=>{const b=e.target.closest('button[data-fm-download]');if(!b||!container.contains(b)||r.busy)return;const mode=b.dataset.fmDownload;if(!['template','materials'].includes(mode))return;const snapshot=clone(r.state);r.focusDownload=mode;r.busy=true;r.status='正在準備原生封裝…';draw();try{const result=await r.options.onDownload({mode,selection:snapshot});r.status=result===false?'已取消；設定保留。':(mode==='template'?'已產生三頁母片':'已產生三頁卡片與文字素材')+'並交由瀏覽器處理；請確認下載紀錄。';}catch(err){r.status='未完成下載：'+err.message;}finally{r.busy=false;draw();if(container.isConnected&&!container.hidden&&doc.activeElement===doc.body){const done=container.querySelector('[data-fm-download="'+r.focusDownload+'"]');if(done)done.focus();}}};
  }
  draw();
 }
 return Object.freeze({COLORS,HIGHLIGHTS,STYLES,MARKERS,PALETTES,ORIGINAL_ACCENTS,LAYOUTS,PRESETS,TEMPLATE_PAGES,normalize,validate,combinations,build,preview,slideXml,originalBytes,exportPptx,exportMaterials,render,getState:container=>records.has(container)?clone(records.get(container).state):null,sourceSha256:DATA.sha256});
});
