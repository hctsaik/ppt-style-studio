/* Fixed source master is an independent contract, NOT a Deck/QuickStyles theme.
 * Native export derives the requested three-page template from an immutable source ZIP. */
(function(root,factory){'use strict';if(typeof module!=='undefined'&&module.exports)module.exports=factory(require('./fixed-master-data.js'));else root.FixedMaster=factory(root.FixedMasterData);})(typeof window!=='undefined'?window:this,function(DATA){
 'use strict';
 const A='http://schemas.openxmlformats.org/drawingml/2006/main',P='http://schemas.openxmlformats.org/presentationml/2006/main',R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 const FONT='微軟正黑體';
 const COLORS=Object.freeze([['red','紅','D95D68'],['yellow','黃','E7BF4A'],['blue','藍','4E83CE'],['green','綠','4B9679'],['gray','灰','7D8795'],['purple','紫','9371C6'],['white','白','FFFFFF']].map(([key,label,color])=>Object.freeze({key,label,color})));
 const STYLES=Object.freeze([['soft','柔底'],['outline','細框'],['solid','實心'],['side','側邊條']].map(([key,label])=>Object.freeze({key,label})));
 const MARKERS=Object.freeze([['none','不加螢光筆'],['marker','全字柔帶 · 24%'],['underline','下緣半筆 · 35%']].map(([key,label])=>Object.freeze({key,label})));
 const LAYOUTS=Object.freeze(DATA.layouts.filter(l=>[1,2,4].includes(l.number)).map(l=>Object.freeze({key:String(l.number),number:l.number,label:({1:'封面',2:'單欄內容',4:'雙欄內容'})[l.number],mode:({1:'marker',2:'keycard',4:'paired'})[l.number]})));
 const TEMPLATE_PAGES=Object.freeze([{title:'專案重點與下一步',label:'封面',layout:1},{title:'單欄內容',label:'單欄內容',layout:2},{title:'雙欄內容',label:'雙欄內容',layout:4}].map(Object.freeze));
 const PRESETS=Object.freeze([
  {label:'封面・輕量下緣',layout:'1',style:'none',marker:'underline',color:'red'},
  {label:'單欄・重點卡',layout:'2',style:'soft',marker:'marker',color:'yellow'},
  {label:'雙欄・並列重點',layout:'4',style:'side',marker:'underline',color:'green'}
 ].map(Object.freeze));
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const clone=v=>JSON.parse(JSON.stringify(v));
 const clean=(v,d)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,' '):d;
 const emu=v=>Math.round(v*9525);
 function normalize(value){const v=value&&typeof value==='object'?value:{},layout=LAYOUTS.find(l=>l.key===String(v.layout))||LAYOUTS[1];return {version:1,layout:layout.key,style:layout.mode==='marker'?'none':STYLES.some(s=>s.key===v.style)?v.style:'soft',marker:MARKERS.some(m=>m.key===v.marker)?v.marker:'marker',color:COLORS.some(c=>c.key===v.color)?v.color:'red',title:clean(v.title,'專案重點與下一步'),summary:clean(v.summary,'聚焦主要判斷，保留執行依據'),focus:clean(v.focus,'優先確認關鍵事項')};}
 function validate(s){for(const [k,n,label]of [['title',24,'標題'],['summary',28,'結論'],['focus',16,'強調短句']])if(!s[k].trim()||Array.from(s[k]).length>n)throw Error(label+'請填 1–'+n+' 字；不會自動縮字或截斷。');}
 function combinations(){return LAYOUTS.flatMap(l=>(l.mode==='marker'?['none']:STYLES.map(x=>x.key)).flatMap(style=>MARKERS.flatMap(m=>COLORS.map(c=>({layout:l.key,style,marker:m.key,color:c.key})))));}
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
   if(s.marker!=='none'){const full=s.marker==='marker';group.push(rect('螢光筆底帶',x-2,y+(full?2:h*.55),Math.min(w,Array.from(label).reduce((sum,ch)=>sum+(/[\x00-\x7f]/.test(ch)?.55:1),0)*size*4/3+6),full?h*.82:h*.42,c,null,full?24000:35000));}
   group.push(text('強調短句',x,y,w,h,label,size,fg));
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
 function textBody(value,size=20,color='333333',bold=false){return `<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr><a:lnSpc><a:spcPct val="100000"/></a:lnSpc><a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="0"/></a:spcAft><a:buNone/></a:pPr><a:r><a:rPr lang="zh-TW" sz="${size*100}" b="${bold?1:0}">${fill(color)}${fonts}</a:rPr><a:t>${esc(value)}</a:t></a:r></a:p></p:txBody>`;}
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
   return `<p:sp><p:nvSpPr><p:cNvPr id="${key}" name="${esc(o.name)}"/><p:cNvSpPr${o.kind==='text'?' txBox="1"':''}/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${emu(o.x)}" y="${emu(o.y)}"/><a:ext cx="${emu(o.w)}" cy="${emu(o.h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${fill(o.fill,o.alpha)}<a:ln w="${o.line?15875:0}">${fill(o.line)}</a:ln></p:spPr>${o.kind==='text'?textBody(o.text,o.size,o.color,o.bold):''}</p:sp>`;
  }
  const placeholders=model.placeholders.map(p=>model.sourceLayout.placeholders[p.index].xml.replace('{{PARAGRAPHS}}',p.index==='10'?`<a:p><a:pPr lvl="0"/><a:fld id="{F17ED000-0000-4000-8000-${String(number).padStart(12,'0')}}" type="slidenum"><a:rPr lang="zh-TW" altLang="en-US"/><a:t>${number}</a:t></a:fld></a:p>`:paras(p.lines))).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:p="${P}" xmlns:a="${A}" xmlns:r="${R}" showMasterSp="1"><p:cSld name="${esc(model.layout.label)} · ${esc(model.selection.style)}"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${placeholders}${model.objects.map(object).join('')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
 }
 function originalBytes(){const s=atob(DATA.originalBase64);return Uint8Array.from(s,c=>c.charCodeAt(0));}
 async function exportPptx(JSZip,values=[]){
  if(!JSZip||typeof JSZip.loadAsync!=='function')throw Error('原生封裝工具尚未載入，請重新開啟此頁。');
  if(!Array.isArray(values)||values.length>1)throw Error('主範本固定三頁；另做示範時只新增一頁。');
  const models=values.map(v=>{const m=build(v);validate(m.selection);return m;});
  const zip=await JSZip.loadAsync(originalBytes());let pres=await zip.file('ppt/presentation.xml').async('string'),rels=await zip.file('ppt/_rels/presentation.xml.rels').async('string'),types=await zip.file('[Content_Types].xml').async('string');
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
  const cover=build({layout:'1',style:'none',marker:'underline',color:'red'});
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
  return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
 }
 function preview(model){
  const text=(x,y,value,size,color='333333',bold=false)=>`<text x="${x}" y="${y}" font-size="${size*4/3}" fill="#${color}"${bold?' font-weight="700"':''}>${esc(value)}</text>`;
  function object(o){if(o.kind==='group')return o.items.map(object).join('');if(o.kind==='text')return text(o.x,o.y+o.h/2+o.size*.45,o.text,o.size,o.color,o.bold);if(o.kind==='table')return o.rows.map((row,r)=>row.map((v,col)=>{const c=tableCell(o,r,col),w=o.w/3,h=o.h/o.rows.length,x=o.x+col*w,y=o.y+r*h;return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#${c.bg}" stroke="#${c.line}"/>`+(c.side?`<rect x="${x}" y="${y}" width="4" height="${h}" fill="#${o.color}"/>`:'')+text(x+12,y+h/2+7,v,16,c.fg,r===0);}).join('')).join('');return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="${o.fill?'#'+o.fill:'none'}" fill-opacity="${(o.alpha||100000)/100000}" stroke="${o.line?'#'+o.line:'none'}" stroke-width="1.67"/>`;}
  const ph=model.placeholders.filter(p=>p.index!=='10').map(p=>{const box=model.sourceLayout.placeholders[p.index],title=p.index==='0',header=model.layout.key==='7'&&['2','4'].includes(p.index),plain=['1','3'].includes(model.layout.key)||model.layout.key==='5'&&['1','3'].includes(p.index);let y=box.y;let xml=header?`<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="#282398"/>`:'';for(const l of p.lines){const size=title?32:header?24:plain?24:[24,18,14][Math.min(l.level||0,2)],lv=l.level||0,left=title||header||plain?0:[28.8,81.6,115.2][Math.min(lv,2)];y+=size*4/3;if(!title&&!header&&!plain){const mark=['●','■','◆'][Math.min(lv,2)],scale=[.5,.75,1][Math.min(lv,2)];xml+=text(box.x+left-[28.8,32,26.67][Math.min(lv,2)],y,mark,size*scale,lv===0?'C00000':'333333');}xml+=text(box.x+left+(header?18:0),y,l.text,size,title?'C00000':header?'FFFFFF':'333333',title||header||plain&&model.layout.key==='5');y+=8;}return xml;}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-label="母片組合 HTML 示意，非 PowerPoint 忠實縮圖" style="font-family:'Microsoft JhengHei','微軟正黑體',sans-serif"><rect width="1280" height="720" fill="#FFFFFF"/><image href="${DATA.logo}" x="1194.67" y="12.13" width="64.4" height="48.67"/>${text(1147,83,'Unleash Innovation',8,'999999',true)}${ph}${model.objects.map(object).join('')}<rect y="692.48" width="1280" height="3.2" fill="#FF0000"/><rect y="695.68" width="1280" height="24.32" fill="#000000"/>${text(10,714,'© 2021 TSMC, Ltd',9,'FFFFFF',true)}${text(637,714,'4',9,'FFFFFF')}${text(1180,714,'TSMC Property',9,'FFFFFF',true)}</svg>`;
 }
 // Bound both grid tracks and items: the 540px schematic must scroll inside its canvas, not size the mobile editor.
 const CSS=`body.tabM .wrap{grid-template-columns:1fr}body.tabM #panel,body.tabM #bPanel{display:none!important}.fm{width:100%;min-width:0;max-width:1260px;margin:auto;color:#333;font:14px 'Microsoft JhengHei','微軟正黑體',sans-serif}.fm *{box-sizing:border-box}.fm h2{margin:0 0 8px;font-size:24px}.fm p{line-height:1.65}.fmLead{max-width:850px}.fmLock{display:inline-block;color:#940000;background:#FFF1F1;border:1px solid #EDD0D0;border-radius:6px;padding:5px 9px;font-size:12px;font-weight:700}.fmLayout{display:grid;grid-template-columns:300px minmax(0,1fr);gap:22px;margin-top:18px}.fmLayout>*,.fmControls,.fmControls>*{min-width:0}.fmControls label{display:block;font-weight:700;margin:0 0 14px}.fmControls select,.fmControls input{display:block;width:100%;min-width:0;max-width:100%;min-height:44px;border:1px solid #BCC2C9;border-radius:6px;background:#FFF;color:#333;font:inherit;padding:9px;margin-top:6px}.fm button{font:inherit;min-height:44px;border:1px solid #BCC2C9;border-radius:6px;background:#FFF;color:#333;padding:8px 12px;cursor:pointer}.fm button:focus-visible,.fm input:focus-visible,.fm select:focus-visible{outline:3px solid #C00000;outline-offset:2px}.fm button:disabled,.fm select:disabled,.fm input:disabled{opacity:.6;cursor:default}.fmColors{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 16px}.fmColors button{min-width:44px;padding:7px}.fmColors i{display:block;width:20px;height:20px;margin:auto auto 3px;border:1px solid #aaa;border-radius:50%}.fm button[aria-pressed=true]{outline:2px solid #C00000;outline-offset:1px}.fmCanvas{min-width:0;max-width:100%;border:1px solid #D4D6D9;background:#fff;overflow:auto}.fmCanvas svg{display:block;width:100%;height:auto;min-width:540px}.fmCaption,.fmNote{font-size:12px;color:#595959}.fmActions,.fmPresets{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.fmActions .fmPrimary{background:#A60000;color:#FFF;border-color:#A60000;font-weight:700}.fmWhite{padding:10px 12px;background:#F3F4F6;border-left:3px solid #7D8795}.fmWhiteDemo{display:inline-block;background:#252A34;color:#FFF;padding:9px 16px;margin-right:8px}.fmWhiteDemo span{background:rgba(255,255,255,.24)}.fmOrigins{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.fmOriginal{padding:12px;background:#FAFAFA;border:1px solid #D5D8DD;border-top:3px solid #C00000;border-radius:5px;line-height:1.6}.fmOriginal strong{display:block}.fmStatus{min-height:1.6em;color:#8C0000}.fm details{margin-top:18px;border-top:1px solid #DDD;padding-top:12px}.fm summary{cursor:pointer;font-weight:700}.fm code{overflow-wrap:anywhere;font-size:11px}.fm[aria-busy=true] .fmControls{opacity:.8}@media(max-width:850px){.fmLayout{grid-template-columns:minmax(0,1fr)}.fmControls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}.fmColors,.fmFull{grid-column:1/-1}.fmOrigins{grid-template-columns:1fr 1fr}}@media(max-width:480px){.fmControls{grid-template-columns:minmax(0,1fr)}.fmOrigins{grid-template-columns:1fr}.fmCanvas svg{min-width:540px}.fmActions button{width:100%}}`;
 const records=new WeakMap();
 function render(container,options={}){
  if(!container)return;let r=records.get(container);if(!r){r={state:normalize(options.state),busy:false,status:'',examplesOpen:false,options};records.set(container,r);}else{r.options=options;if(options.state)r.state=normalize(options.state);}
  const doc=container.ownerDocument;if(!doc.getElementById('fixedMasterCss')){const el=doc.createElement('style');el.id='fixedMasterCss';el.textContent=CSS;doc.head.appendChild(el);}
  const notify=()=>{if(r.options.onChange)r.options.onChange(clone(r.state));};
  function updatePreview(){const m=build(r.state);container.querySelector('[data-fm-preview]').innerHTML=preview(m);container.querySelector('[data-fm-white]').hidden=r.state.color!=='white';}
  function draw(){const examples=container.querySelector('[data-fm-examples]');if(examples)r.examplesOpen=examples.open;const active=doc.activeElement,focus=active&&container.contains(active)?['data-fm-field','data-fm-color','data-fm-preset','data-fm-download'].find(k=>active.hasAttribute(k)):null,focusSelector=focus?'['+focus+'="'+active.getAttribute(focus)+'"]':null;const s=r.state,layout=LAYOUTS.find(l=>l.key===s.layout),disabled=r.busy?' disabled':'';
   const select=(key,label,choices)=>`<label>${label}<select data-fm-field="${key}"${disabled}>${choices.map(c=>`<option value="${c.key}"${c.key===s[key]?' selected':''}>${esc(c.label)}</option>`).join('')}</select></label>`;
   container.innerHTML=`<div class="fm" aria-busy="${r.busy}"><span class="fmLock">固定母片 · 不跟隨網站風格</span><h2>投影片母片</h2><p class="fmLead">母片只含您指定的三頁：封面、單欄內容、雙欄內容。保留紅色標題、微軟正黑體、bullet、行距、TSMC 標誌與頁尾；主下載不附加示範頁。</p><div class="fmOrigins" aria-label="指定的三頁母片">${TEMPLATE_PAGES.map((p,i)=>`<div class="fmOriginal"><strong>第 ${i+1} 頁 · ${p.label}</strong>${p.title}<br><small>內容說明，非 PowerPoint 忠實縮圖</small></div>`).join('')}</div><div class="fmActions"><button type="button" class="fmPrimary" data-fm-download="template"${disabled}>下載三頁母片（不含示範）</button></div><p class="fmStatus" role="status" aria-live="polite" data-fm-status>${esc(r.status)}</p><details data-fm-examples${r.examplesOpen?' open':''}><summary>另做一頁組合示範（非三頁範本）</summary><p class="fmNote">以下只影響另行新增的示範頁，不改三頁母片。需另外按下「下載示範組合」才會增加一頁。</p><div class="fmPresets" aria-label="快速選擇組合">${PRESETS.map((p,i)=>`<button type="button" data-fm-preset="${i}"${disabled}>${p.label}</button>`).join('')}</div><div class="fmLayout"><div class="fmControls">${select('layout','版面',LAYOUTS.map(l=>({key:l.key,label:l.label})))}${select('style','快速樣式',layout.mode==='marker'?[{key:'none',label:'封面只用輕量標記'}]:STYLES)}${select('marker','螢光筆',MARKERS)}<div class="fmFull"><strong>內容層固定七色</strong><div class="fmColors" aria-label="內容層顏色">${COLORS.map(c=>`<button type="button" data-fm-color="${c.key}" aria-pressed="${s.color===c.key}"${disabled}><i style="background:#${c.color}"></i>${c.label}</button>`).join('')}</div></div>${[['title','新頁標題',24],['summary','結論／主要重點',28],['focus','強調短句',16]].map(([key,label,max])=>`<label>${label}<input data-fm-field="${key}" value="${esc(s[key])}" maxlength="${max}"${disabled}></label>`).join('')}<p class="fmNote fmFull">共 ${combinations().length} 種搭配。每頁只放一組：封面用輕量標記、單欄用 key card、雙欄用 paired cards。</p></div><div><div class="fmCanvas" data-fm-preview></div><p class="fmCaption">HTML 示意，非 PowerPoint 忠實縮圖；實際字形與換行依安裝字型而定。小螢幕可左右捲動。標誌／頁尾由原 master 繼承；淡色裝飾未在此示意重畫。</p><p class="fmWhite" data-fm-white hidden><span class="fmWhiteDemo"><span>真白標記示意</span></span>白色不改成灰色，放在白母片上可能不明顯。這個深色示意底板不匯出；請在 PowerPoint 移到需要的深底內容上。</p><div class="fmActions"><button type="button" class="fmPrimary" data-fm-download="current"${disabled}>下載示範組合（母片 3＋示範 1 頁）</button></div><p class="fmNote">新增卡片／底帶／文字為原生可編輯物件。螢光筆是底帶＋文字群組，不是逐字 highlight；改字後可解組調整底帶。</p></div></div></details><details><summary>固定規格與驗證範圍</summary><p>16:9 · 1280 × 720 · 1 個 master · 7 個 layouts。標題 32 pt 粗體 #C00000；內文 #333333，24／18／14 pt；●／■／◆ 為 50%／75%／100%，段後 6 pt、100% 行距。固定紅色不是以 theme accent1 定義。</p><p>三頁母片由原 layout1 的原生封面＋來源單欄及雙欄頁組成；不是原附件前三頁。比較／報表不在此範本內，底層 7 個 layouts 與 master／theme／media 原 bytes 保留。來源四頁附件另作不變安全基準，以下是來源 SHA-256（不是三頁下載檔的 hash）：<code>${DATA.sha256}</code></p><p>微軟正黑體未內嵌；瀏覽器可能限制 blob 下載，產生成功不代表檔案已落盤。此環境未完成實際下載落盤及 PowerPoint 開啟／忠實視覺驗收。封裝與 XML 驗證不等於 PowerPoint 視覺認證。</p></details></div>`;
   updatePreview();if(focusSelector){const next=container.querySelector(focusSelector);if(next&&!next.disabled)next.focus();}container.querySelectorAll('[data-fm-field]').forEach(el=>{const handler=e=>{if(r.busy)return;const key=e.target.dataset.fmField;r.state=normalize({...r.state,[key]:e.target.value});r.status='';notify();if(e.target.tagName==='SELECT')draw();else{updatePreview();container.querySelector('[data-fm-status]').textContent='';}};if(el.tagName==='SELECT')el.onchange=handler;else el.oninput=handler;});
   container.onclick=async e=>{const b=e.target.closest('button');if(!b||!container.contains(b)||r.busy)return;
    if(b.dataset.fmPreset!==undefined){r.state=normalize({...r.state,...PRESETS[+b.dataset.fmPreset]});r.status='';notify();draw();return;}
    if(b.dataset.fmColor){r.state=normalize({...r.state,color:b.dataset.fmColor});r.status='';notify();draw();return;}
    const mode=b.dataset.fmDownload;if(!['template','current'].includes(mode))return;const snapshot=clone(r.state);r.focusDownload=mode;r.busy=true;r.status='正在準備原生封裝…';draw();
    try{if(mode!=='template')validate(snapshot);const result=await r.options.onDownload({mode,selection:snapshot});r.status=result===false?'已取消；設定保留。':mode==='template'?'已產生三頁母片（不含示範）並交由瀏覽器處理；請確認下載紀錄。':'已產生母片 3＋示範 1 頁並交由瀏覽器處理；這不是三頁範本。請確認下載紀錄。PowerPoint 視覺尚未驗證。';}catch(err){r.status='未完成下載：'+err.message;}finally{r.busy=false;draw();if(container.isConnected&&!container.hidden&&doc.activeElement===doc.body){const done=container.querySelector('[data-fm-download="'+r.focusDownload+'"]');if(done)done.focus();}}
   };
  }
  draw();
 }
 return Object.freeze({COLORS,STYLES,MARKERS,LAYOUTS,PRESETS,TEMPLATE_PAGES,normalize,validate,combinations,build,preview,slideXml,originalBytes,exportPptx,render,getState:container=>records.has(container)?clone(records.get(container).state):null,sourceSha256:DATA.sha256});
});
