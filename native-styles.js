/* Native accents/highlights preserve text/background slots and fonts. The palette
 * API preserves formatting matrices; the explicit Kit API replaces only Kit effects. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.NativeStyles=factory();})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const A='http://schemas.openxmlformats.org/drawingml/2006/main',P='http://schemas.openxmlformats.org/presentationml/2006/main',R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 const valid=c=>typeof c==='string'&&/^[0-9A-F]{6}$/i.test(c);
 function softColor(color){if(!valid(color))throw Error('Invalid native color');return color.match(/../g).map(v=>Math.round(parseInt(v,16)*.24+255*.76).toString(16).padStart(2,'0')).join('').toUpperCase();}
 const COMMON=Object.freeze([['red','紅','D95D68'],['yellow','黃','E7BF4A'],['blue','藍','4E83CE'],['green','綠','4B9679'],['gray','灰','7D8795'],['purple','紫','9371C6'],['white','白','FFFFFF']].map(([key,label,color])=>Object.freeze({key,label,color,highlight:softColor(color)})));
 const ACCENTS=Object.freeze(COMMON.slice(0,6).map(x=>x.color));
 // User-selected native highlighter inks are independent of theme Accents.
 // Reference blue replaces the old pale blue; white remains a shape/theme color.
 const HIGHLIGHTS=Object.freeze([['red','淡紅','F6D8DB'],['yellow','淡黃','F9F0D4'],['blue','參考藍','7C9CC3'],['green','淡綠','D4E6DF'],['gray','淺灰','E0E2E6'],['purple','淡紫','E5DDF1'],['dark-gray','深灰','595959'],['navy','深藍','1F3864']].map(([key,label,color])=>Object.freeze({key,label,color})));
 function readScheme(xml){const block=(xml.match(/<a:clrScheme\b[^>]*>[\s\S]*?<\/a:clrScheme>/)||[])[0];if(!block)throw Error('Missing theme color scheme');const slots={};for(const role of ['dk1','lt1','dk2','lt2','accent1','accent2','accent3','accent4','accent5','accent6','hlink','folHlink']){const part=(block.match(new RegExp('<a:'+role+'>[\\s\\S]*?</a:'+role+'>'))||[])[0];const color=part&&(part.match(/<a:srgbClr\b[^>]*\bval="([0-9a-f]{6})"/i)||part.match(/<a:sysClr\b[^>]*\blastClr="([0-9a-f]{6})"/i));if(!color)throw Error('Missing theme slot '+role);slots[role]=color[1].toUpperCase();}return slots;}
 function replaceAccents(xml,colors){if(!Array.isArray(colors)||colors.length!==6||colors.some(c=>!valid(c)))throw Error('Six valid accent colors are required');let changed=0;const out=xml.replace(/<a:clrScheme\b[^>]*>[\s\S]*?<\/a:clrScheme>/g,block=>block.replace(/<a:accent([1-6])>[\s\S]*?<\/a:accent\1>/g,(_,n)=>{changed++;return '<a:accent'+n+'><a:srgbClr val="'+colors[+n-1].toUpperCase()+'"/></a:accent'+n+'>';}));if(changed!==6)throw Error('Expected exactly six accent slots');return out;}
 async function applyToZip(zip,options){
  const o=options||{},source=o.source||'common';if(!['common','theme'].includes(source))throw Error('Unknown native palette source');
  const files=Object.keys(zip.files).filter(n=>/(?:^|\/)theme[^/]*\.xml$/.test(n)&&!zip.files[n].dir).sort();if(!files.length)throw Error('Missing theme part');
  const first=await zip.file(files[0]).async('string'),scheme=readScheme(first),accents=(o.accents||(source==='common'?ACCENTS:Array.from({length:6},(_,i)=>scheme['accent'+(i+1)]))).slice();
  if(accents.length!==6||accents.some(c=>!valid(c)))throw Error('Six valid accent colors are required');
  const changedParts=[];
  if(source==='common'||o.accents)for(const file of files){const entry=zip.file(file),before=await entry.async('string'),after=replaceAccents(before,accents);if(after!==before){zip.file(file,after,{date:entry.date,createFolders:false});changedParts.push(file);}}
  const highlights=HIGHLIGHTS.map(c=>c.color),file='ppt/presProps.xml',entry=zip.file(file);let props=entry?await entry.async('string'):'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentationPr xmlns:p="'+P+'" xmlns:a="'+A+'"/>';
  // Some native templates declare only p on this part. MRU colors introduce a
  // DrawingML prefix, so declare it here without changing any existing colors.
  props=props.replace(/<p:presentationPr\b[^>]*>/,tag=>/\bxmlns:a=/.test(tag)?tag:tag.replace(/\s*\/?>$/,end=>' xmlns:a="'+A+'"'+end));
  const mru='<p:clrMru>'+highlights.slice().reverse().map(c=>'<a:srgbClr val="'+c+'"/>').join('')+'</p:clrMru>';
  props=props.replace(/<p:clrMru\b[^>]*>[\s\S]*?<\/p:clrMru>|<p:clrMru\b[^>]*\/>/g,'');
  if(/<p:extLst/.test(props))props=props.replace('<p:extLst',mru+'<p:extLst');else if(props.includes('</p:presentationPr>'))props=props.replace('</p:presentationPr>',mru+'</p:presentationPr>');else props=props.replace(/\/>\s*$/, '>'+mru+'</p:presentationPr>');
  zip.file(file,props,{date:entry?entry.date:new Date(Date.UTC(2026,0,1)),createFolders:false});changedParts.push(file);
  if(!entry){const types=zip.file('[Content_Types].xml'),rels=zip.file('ppt/_rels/presentation.xml.rels');if(!types||!rels)throw Error('Missing package indexes');let t=await types.async('string'),r=await rels.async('string');t=t.replace('</Types>','<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/></Types>');let id='rIdNativePresProps';while(r.includes('Id="'+id+'"'))id+='X';r=r.replace('</Relationships>','<Relationship Id="'+id+'" Type="'+R+'/presProps" Target="presProps.xml"/></Relationships>');zip.file('[Content_Types].xml',t,{date:types.date,createFolders:false});zip.file('ppt/_rels/presentation.xml.rels',r,{date:rels.date,createFolders:false});changedParts.push('[Content_Types].xml','ppt/_rels/presentation.xml.rels');}
  return{source,accents:accents.map(c=>c.toUpperCase()),highlights,themeParts:files,changedParts};
 }
 // Component-inspired effects are opt-in for Style Kit only. applyToZip above
 // intentionally leaves the fixed master's formatting matrix unchanged.
 const KIT_EFFECTS=Object.freeze([
  {key:'outer-gray',group:'outer',label:'深灰框柔影外卡',en:'Gray Frame Card',fill:1,line:1,effect:1,lineWidth:1.25,lineOverride:true,bold:false},
  {key:'outer-soft',group:'outer',label:'細灰框柔影外卡',en:'Soft Frame Card',fill:1,line:2,effect:1,lineWidth:.5,bold:false},
  {key:'outer-theme',group:'outer',label:'主色框柔影外卡',en:'Theme Frame Card',fill:1,line:3,effect:1,lineWidth:1.75,bold:false},
  {key:'outline',group:'rectangle',label:'無陰影・外框',en:'Plain Outline',fill:1,line:1,effect:0,lineWidth:1,bold:false},
  {key:'tint',group:'rectangle',label:'淺主色底',en:'Light Color',fill:2,line:0,effect:0,lineWidth:0,bold:false},
  {key:'gray',group:'rectangle',label:'淺灰底',en:'Light Gray',fill:3,line:0,effect:0,lineWidth:0,bold:false},
  {key:'bold-outline',group:'rectangle',label:'主色粗外框',en:'Bold Color Outline',fill:1,line:3,effect:0,lineWidth:2.25,lineOverride:true,bold:true},
  {key:'deep-shadow',group:'rectangle',label:'深底白字柔影',en:'Deep Fill Shadow',fill:1,line:0,effect:2,lineWidth:0,bold:true},
  {key:'deep-white-frame',group:'rectangle',label:'深底白框柔影',en:'White Frame Shadow',fill:1,line:3,effect:2,lineWidth:2.25,lineOverride:true,bold:true},
  {key:'bright-solid',group:'rectangle',label:'主色白字・無影',en:'Bright Solid',fill:1,line:0,effect:0,lineWidth:0,bold:true}
 ].map(Object.freeze));
 // Catalog process-box tokens: card shadow and small emphasis shadow only.
 const KIT_SHADOWS=Object.freeze([{blur:7,offset:2,alpha:.24},{blur:4.2,offset:1.5,alpha:.28}].map(Object.freeze));
 const KIT_RADIUS_PT=7.2;
 // DrawingML tint/shade operate in linear RGB. Verified against PowerPoint's
 // resolved colors; blending encoded sRGB makes dark fills falsely look darker.
 function transform(color,mods=[]){let a=color.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);for(const [kind,value]of mods)a=a.map(v=>kind==='tint'?v*value/100000+(1-value/100000):v*value/100000);return a.map(v=>Math.round(255*(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055)).toString(16).padStart(2,'0')).join('').toUpperCase();}
 function luminance(c){const a=c.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;}
 function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
 function kitEffect(color,row,dark='000000',light='FFFFFF',ink=dark){
  const spec=KIT_EFFECTS[row];if(!valid(color)||!spec)throw Error('Invalid Kit effect');
  let fillMods=[],fontMods=[],fontRole='self';
  const fillRole=[0,1,2,3,6].includes(row)?'lt1':'self';
  const stops=()=>row===4?[transform(color,[['tint',20000]])]:row===5?['F2F2F2']:row>=7?[transform(color,fillMods)]:[light];
  const neutral=[0,1,2,3,5].includes(row),textBase=neutral?ink:color;
  if(neutral)fontRole='dk2';
  let backgrounds=stops(),foreground=textBase;
  const minimum=c=>Math.min(...backgrounds.map(bg=>contrast(c,bg)));
  if(row<7){for(let amount=100000;amount>=0;amount-=5000){fontMods=amount===100000?[]:[['shade',amount]];foreground=transform(textBase,fontMods);if(minimum(foreground)>=4.6)break;}}
  else{
   // Deep cards deliberately use a darker tone. The shadow-free solid keeps
   // the source color when white text is readable; light colors need a shade.
   for(let amount=row===9?100000:65000;amount>=0;amount-=2500){fillMods=amount===100000?[]:[['shade',amount]];backgrounds=stops();if(minimum(light)>=4.6)break;}
   fontRole='lt1';foreground=light;
  }
  const lineMods=[],lineColor=row===0?'666666':row===1?'D9D9D9':row===3?'BFBFBF':row===8?light:color,lineRole=row===8?'lt1':'self',shadow=spec.effect?KIT_SHADOWS[spec.effect-1]:null;
  return{...spec,row,fillRole,fillMods,fontMods,fontRole,foreground,backgrounds,lineColor,lineRole,lineMods,shadow,radius:KIT_RADIUS_PT,text:row<3?'外層卡片':row>=7?'關鍵步驟':'處理步驟',contrast:minimum(foreground)};
 }
 const colorXml=(role,mods=[])=>'<a:schemeClr val="'+role+'">'+mods.map(([k,v])=>'<a:'+k+' val="'+v+'"/>').join('')+'</a:schemeClr>';
 function kitThemeXml(themeXml){
  const old=(themeXml.match(/<a:fmtScheme\b[^>]*>[\s\S]*?<\/a:fmtScheme>/)||[])[0];if(!old)throw Error('Missing formatting matrix');
  const background=(old.match(/<a:bgFillStyleLst>[\s\S]*?<\/a:bgFillStyleLst>/)||[])[0];if(!background)throw Error('Missing background styles');
  const solid=mods=>'<a:solidFill>'+colorXml('phClr',mods)+'</a:solidFill>',fixed=c=>'<a:solidFill><a:srgbClr val="'+c+'"/></a:solidFill>';
  const fills='<a:fillStyleLst>'+solid([])+solid([['tint',20000]])+fixed('F2F2F2')+'</a:fillStyleLst>';
  const lines='<a:lnStyleLst>'+[1,.5,1.75].map((width,i)=>'<a:ln w="'+Math.round(width*12700)+'" cap="flat" cmpd="sng" algn="ctr">'+(i===2?solid([]):fixed(i===0?'BFBFBF':'D9D9D9'))+'<a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>').join('')+'</a:lnStyleLst>';
  const effects='<a:effectStyleLst>'+KIT_SHADOWS.map(s=>'<a:effectStyle><a:effectLst><a:outerShdw blurRad="'+Math.round(s.blur*12700)+'" dist="'+Math.round(s.offset*12700)+'" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="'+Math.round(s.alpha*100000)+'"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle>').join('')+'<a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>';
  return themeXml.replace(old,'<a:fmtScheme name="PPT Style Studio rectangle presets">'+fills+lines+effects+background+'</a:fmtScheme>');
 }
 // A fixed-master derivative is scoped by OPC relationships, never filenames.
 const decodeXml=v=>String(v).replace(/&(?:amp|quot|apos|lt|gt);/g,x=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'}[x]));
 function attrs(tag){const o={};for(const m of tag.matchAll(/([\w:.-]+)\s*=\s*(["'])(.*?)\2/g))o[m[1]]=decodeXml(m[3]);return o;}
 function relPath(part){const i=part.lastIndexOf('/');return (i<0?'':part.slice(0,i+1))+'_rels/'+part.slice(i+1)+'.rels';}
 function resolvePart(from,target){
  if(!target||/[?#\\]/.test(target)||/^[a-z][a-z0-9+.-]*:/i.test(target))throw Error('Unsupported internal relationship target '+target);
  const path=(target[0]==='/'?'':from.slice(0,from.lastIndexOf('/')+1))+target,stack=[];
  for(const bit of path.split('/')){if(!bit||bit==='.')continue;if(bit==='..'){if(!stack.length)throw Error('Relationship escapes package root');stack.pop();}else stack.push(bit);}
  return stack.join('/');
 }
 async function xmlPart(zip,part){const entry=zip.file(part);if(!entry)throw Error('Missing package part '+part);return entry.async('string');}
 async function relationships(zip,part,required=false){const p=part?relPath(part):'_rels/.rels',entry=zip.file(p);if(!entry){if(required)throw Error('Missing relationships '+p);return [];}const xml=await entry.async('string'),out=[];for(const m of xml.matchAll(/<(?:[\w.-]+:)?Relationship\b[^>]*\/?\s*>/g)){const a=attrs(m[0]);if(!a.Id||!a.Type||!a.Target)throw Error('Incomplete relationship in '+p);if(out.some(x=>x.id===a.Id))throw Error('Duplicate relationship '+a.Id);out.push({id:a.Id,type:a.Type.slice(a.Type.lastIndexOf('/')+1),external:a.TargetMode==='External',target:a.TargetMode==='External'?a.Target:resolvePart(part,a.Target)});}return out;}
 function refIds(xml,local){const out=[];for(const m of xml.matchAll(new RegExp('<(?:[\\w.-]+:)?'+local+'\\b[^>]*>','g'))){const a=attrs(m[0]),id=Object.keys(a).find(k=>k.endsWith(':id'));if(id)out.push(a[id]);}return out;}
 async function resolveThemeGraph(zip){
  const roots=await relationships(zip,'',true),office=roots.filter(r=>r.type==='officeDocument');if(office.length!==1||office[0].external)throw Error('Expected one internal presentation');
  const presentationPart=office[0].target,presentation=await xmlPart(zip,presentationPart),rels=await relationships(zip,presentationPart,true),masterParts=[],themeParts=[],notesThemeParts=[],notesParts=[];
  const push=(list,v)=>{if(!list.includes(v))list.push(v);};
  const target=(id,type)=>{const r=rels.find(r=>r.id===id);if(!r||r.type!==type||r.external)throw Error('Missing internal '+type+' reference '+id);return r.target;};
  for(const id of refIds(presentation,'sldMasterId'))push(masterParts,target(id,'slideMaster'));
  if(!masterParts.length)throw Error('Presentation has no active slide master');
  for(const r of rels.filter(r=>r.type==='theme')){if(r.external)throw Error('External presentation theme');push(themeParts,r.target);}
  const masterThemes={};for(const master of masterParts){await xmlPart(zip,master);const rs=await relationships(zip,master,true),ts=rs.filter(r=>r.type==='theme');if(ts.length!==1||ts[0].external)throw Error('Expected one theme for active master '+master);await xmlPart(zip,ts[0].target);masterThemes[master]=ts[0].target;push(themeParts,ts[0].target);}
  // Notes may be reached from either the presentation or an active slide. Do
  // not follow their backlink to slides into the main theme graph.
  const notesQueue=rels.filter(r=>r.type==='notesMaster'||r.type==='notesSlide').map(r=>r.target);
  for(const id of refIds(presentation,'sldId')){const slide=target(id,'slide');for(const r of await relationships(zip,slide))if(r.type==='notesSlide'&&!r.external)push(notesQueue,r.target);}
  while(notesQueue.length){const n=notesQueue.shift();if(notesParts.includes(n))continue;await xmlPart(zip,n);notesParts.push(n);for(const r of await relationships(zip,n)){if(r.external)continue;if(r.type==='theme')push(notesThemeParts,r.target);if(r.type==='notesMaster'||r.type==='notesSlide')push(notesQueue,r.target);}}
  for(const part of themeParts)await xmlPart(zip,part);
  const shared=themeParts.filter(p=>notesThemeParts.includes(p));if(shared.length)throw Error('Theme shared with notes requires cloning before style enhancement: '+shared.join(', '));
  const props=rels.filter(r=>r.type==='presProps');if(props.length>1||props.some(r=>r.external))throw Error('Invalid presentation properties relationship');
  return{presentationPart,presentationRels:relPath(presentationPart),masterParts,masterThemes,themeParts,notesThemeParts,notesParts,sourceThemePart:masterThemes[masterParts[0]],presPropsPart:props[0]?props[0].target:null};
 }
 async function nativeStyleProfile(zip,options={}){
  const source=options.source||options.paletteSource||'common',format=options.format||'master-enhanced-v1';if(!['common','theme','custom'].includes(source))throw Error('Unknown native palette source');if(!['master-enhanced-v1','balanced-v2'].includes(format))throw Error('Unknown native format profile');
  if(source==='custom'&&(!Array.isArray(options.accents)||options.accents.length!==6||options.accents.some(c=>!valid(c))))throw Error('Six valid custom accent colors are required');
  const graph=await resolveThemeGraph(zip),scheme=readScheme(await xmlPart(zip,graph.sourceThemePart)),accents=(source==='custom'?options.accents:source==='common'?ACCENTS:Array.from({length:6},(_,i)=>scheme['accent'+(i+1)])).map(c=>c.toUpperCase());
  const slots={...scheme};accents.forEach((v,i)=>slots['accent'+(i+1)]=v);
  return{version:1,palette:{source,accents,slots,sourceThemePart:graph.sourceThemePart},fmt:{id:format,lightFill:'soft-gray',note:'原生線框列共用淺灰底，白底外卡由獨立可編輯素材提供。'},preset:{effects:KIT_EFFECTS.map(e=>({...e})),radiusPt:KIT_RADIUS_PT},graph};
 }
 // Keep the Office matrix's solid / subtle / intense slot meanings. Unlike
 // the specimen-only Kit matrix, no slot is a fixed pale-gray background.
 function masterThemeXml(xml,format='master-enhanced-v1'){
  if(!['master-enhanced-v1','balanced-v2'].includes(format))throw Error('Unknown native format profile');
  const old=(xml.match(/<a:fmtScheme\b[^>]*>[\s\S]*?<\/a:fmtScheme>/)||[])[0];if(!old)throw Error('Missing formatting matrix');const bg=(old.match(/<a:bgFillStyleLst>[\s\S]*?<\/a:bgFillStyleLst>/)||[])[0];if(!bg)throw Error('Missing background styles');
  const solid=mods=>'<a:solidFill>'+colorXml('phClr',mods)+'</a:solidFill>',gradient=(a,b)=>'<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0">'+colorXml('phClr',a)+'</a:gs><a:gs pos="100000">'+colorXml('phClr',b)+'</a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill>';
  // Office shares fill slot 1 between lt1/black-text and Accent/white-text.
  // A bounded linear shade keeps both readable; outline tiles consequently
  // use soft gray. Exact white-card appearances live in editable specimens.
  // balanced-v2 is the approved R2 matrix, not a palette approximation. The
  // tint-before-shade order matters; preserve every transform and endpoint.
  const balanced=format==='balanced-v2';
  const fills='<a:fillStyleLst>'+(balanced?solid([['tint',90000],['shade',27500]]):solid([['shade',30000]]))+gradient([['tint',20000]],[['tint',12000]])+(balanced?gradient([['tint',85000],['shade',26000]],[['tint',90000],['shade',27500]]):gradient([['shade',30000]],[['shade',25000]]))+'</a:fillStyleLst>';
  const lines='<a:lnStyleLst>'+[.75,1,1.75].map(w=>'<a:ln w="'+Math.round(w*12700)+'" cap="flat" cmpd="sng" algn="ctr">'+solid([])+'<a:prstDash val="solid"/><a:round/></a:ln>').join('')+'</a:lnStyleLst>';
  const shadows=balanced?[null,{blur:3,offset:1.25,alpha:.14},{blur:4.5,offset:1.5,alpha:.19}]:[null,{blur:4.2,offset:1.5,alpha:.20},{blur:7,offset:2,alpha:.24}];
  const effects='<a:effectStyleLst>'+shadows.map(s=>'<a:effectStyle><a:effectLst>'+(s?'<a:outerShdw blurRad="'+Math.round(s.blur*12700)+'" dist="'+Math.round(s.offset*12700)+'" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="'+Math.round(s.alpha*100000)+'"/></a:srgbClr></a:outerShdw>':'')+'</a:effectLst></a:effectStyle>').join('')+'</a:effectStyleLst>';
  let next=old;for(const [tag,content]of [['fillStyleLst',fills],['lnStyleLst',lines],['effectStyleLst',effects]]){const re=new RegExp('<a:'+tag+'\\b[^>]*>[\\s\\S]*?</a:'+tag+'>');if(!re.test(next))throw Error('Missing formatting list '+tag);next=next.replace(re,()=>content);}return xml.replace(old,()=>next);
 }
 function validateProfile(profile){
  if(!profile||profile.version!==1||!profile.fmt||!['master-enhanced-v1','balanced-v2'].includes(profile.fmt.id)||!profile.palette||!['common','theme','custom'].includes(profile.palette.source)||!Array.isArray(profile.palette.accents)||profile.palette.accents.length!==6||profile.palette.accents.some(c=>!valid(c)))throw Error('Invalid native style profile');
 }
 // Pure transformation for explicitly selected cloned themes. The caller owns
 // each clone's relationships; this function does not broadcast across a deck.
 function profileThemeXml(xml,profile){validateProfile(profile);return masterThemeXml(replaceAccents(xml,profile.palette.accents),profile.fmt.id);}
 function appendElement(xml,local,child){const close=new RegExp('</((?:[\\w.-]+:)?'+local+')>\\s*$'),m=xml.match(close);if(!m)throw Error('Unsupported '+local+' XML');const prefix=m[1].includes(':')?m[1].split(':')[0]+':':'';return xml.replace(close,()=>child(prefix)+m[0]);}
 function recentColorsXml(props){
  props=props.replace(/<p:presentationPr\b[^>]*>/,tag=>/\bxmlns:a=/.test(tag)?tag:tag.replace(/\s*\/?>$/,end=>' xmlns:a="'+A+'"'+end));
  const mru='<p:clrMru>'+HIGHLIGHTS.slice().reverse().map(h=>'<a:srgbClr val="'+h.color+'"/>').join('')+'</p:clrMru>';
  props=props.replace(/<p:clrMru\b[^>]*>[\s\S]*?<\/p:clrMru>|<p:clrMru\b[^>]*\/>/g,'');
  if(/<p:extLst/.test(props))return props.replace('<p:extLst',mru+'<p:extLst');if(props.includes('</p:presentationPr>'))return props.replace('</p:presentationPr>',mru+'</p:presentationPr>');if(/<p:presentationPr[^>]*\/>/.test(props))return props.replace(/\/>\s*$/, '>'+mru+'</p:presentationPr>');throw Error('Unsupported presentation properties XML');
 }
 async function applyProfileToZip(zip,input={}){
  const requested=input.palette?input:null,profile=requested||await nativeStyleProfile(zip,input),graph=await resolveThemeGraph(zip),palette=profile.palette;
  validateProfile(profile);
  // A single profile may cover one shared palette, but must never erase the
  // independent schemes of a multi-master deck. Build clones individually
  // with profileThemeXml instead of broadcasting this API over those themes.
  const masterSchemes=await Promise.all([...new Set(Object.values(graph.masterThemes))].map(async part=>JSON.stringify(readScheme(await xmlPart(zip,part)))));
  if(new Set(masterSchemes).size>1)throw Error('Multiple active master color schemes require per-theme profiles; a single profile cannot overwrite independent palettes');
  const pending=new Map(),put=(part,xml)=>pending.set(part,xml);
  for(const part of graph.themeParts){const old=await xmlPart(zip,part),updated=profileThemeXml(old,profile);if(updated!==old)put(part,updated);}
  const pp=graph.presPropsPart||graph.presentationPart.slice(0,graph.presentationPart.lastIndexOf('/')+1)+'presProps.xml';
  if(!graph.presPropsPart&&zip.file(pp))throw Error('Unreferenced presentation properties part would be overwritten');
  put(pp,recentColorsXml(graph.presPropsPart?await xmlPart(zip,pp):'<?xml version="1.0" encoding="UTF-8"?><p:presentationPr xmlns:p="'+P+'" xmlns:a="'+A+'"/>'));
  if(!graph.presPropsPart){let rels=await xmlPart(zip,graph.presentationRels),types=await xmlPart(zip,'[Content_Types].xml'),id='rIdNativeProfileProps';while(rels.includes('Id="'+id+'"'))id+='X';rels=appendElement(rels,'Relationships',p=>'<'+p+'Relationship Id="'+id+'" Type="'+R+'/presProps" Target="/'+pp+'"/>');types=appendElement(types,'Types',p=>'<'+p+'Override PartName="/'+pp+'" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>');put(graph.presentationRels,rels);put('[Content_Types].xml',types);}
  // Every relationship, theme and properties part is checked before any write.
  for(const [part,xml]of pending){const entry=zip.file(part);zip.file(part,xml,{date:entry?entry.date:new Date(Date.UTC(2026,0,1)),createFolders:false});}
  return{profile,palette,source:palette.source,accents:palette.accents.slice(),scheme:{...palette.slots},highlights:HIGHLIGHTS.map(h=>h.color),themeParts:graph.themeParts,changedParts:[...pending.keys()]};
 }
 return{COMMON,ACCENTS,HIGHLIGHTS,softColor,readScheme,replaceAccents,applyToZip,KIT_EFFECTS,KIT_SHADOWS,KIT_RADIUS_PT,kitEffect,kitThemeXml,colorXml,transform,contrast,resolveThemeGraph,nativeStyleProfile,applyProfileToZip,masterThemeXml,profileThemeXml};
});
