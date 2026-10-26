/* Native accents/highlights preserve text/background slots and fonts. The palette
 * API preserves formatting matrices; the explicit Kit API replaces only Kit effects. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.NativeStyles=factory();})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const A='http://schemas.openxmlformats.org/drawingml/2006/main',P='http://schemas.openxmlformats.org/presentationml/2006/main',R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 const valid=c=>typeof c==='string'&&/^[0-9A-F]{6}$/i.test(c);
 function softColor(color){if(!valid(color))throw Error('Invalid native color');return color.match(/../g).map(v=>Math.round(parseInt(v,16)*.24+255*.76).toString(16).padStart(2,'0')).join('').toUpperCase();}
 const COMMON=Object.freeze([['red','紅','D95D68'],['yellow','黃','E7BF4A'],['blue','藍','4E83CE'],['green','綠','4B9679'],['gray','灰','7D8795'],['purple','紫','9371C6'],['white','白','FFFFFF']].map(([key,label,color])=>Object.freeze({key,label,color,highlight:softColor(color)})));
 const ACCENTS=Object.freeze(COMMON.slice(0,6).map(x=>x.color));
 function readScheme(xml){const block=(xml.match(/<a:clrScheme\b[^>]*>[\s\S]*?<\/a:clrScheme>/)||[])[0];if(!block)throw Error('Missing theme color scheme');const slots={};for(const role of ['dk1','lt1','dk2','lt2','accent1','accent2','accent3','accent4','accent5','accent6','hlink','folHlink']){const part=(block.match(new RegExp('<a:'+role+'>[\\s\\S]*?</a:'+role+'>'))||[])[0];const color=part&&(part.match(/<a:srgbClr\b[^>]*\bval="([0-9a-f]{6})"/i)||part.match(/<a:sysClr\b[^>]*\blastClr="([0-9a-f]{6})"/i));if(!color)throw Error('Missing theme slot '+role);slots[role]=color[1].toUpperCase();}return slots;}
 function replaceAccents(xml,colors){if(!Array.isArray(colors)||colors.length!==6||colors.some(c=>!valid(c)))throw Error('Six valid accent colors are required');let changed=0;const out=xml.replace(/<a:clrScheme\b[^>]*>[\s\S]*?<\/a:clrScheme>/g,block=>block.replace(/<a:accent([1-6])>[\s\S]*?<\/a:accent\1>/g,(_,n)=>{changed++;return '<a:accent'+n+'><a:srgbClr val="'+colors[+n-1].toUpperCase()+'"/></a:accent'+n+'>';}));if(changed!==6)throw Error('Expected exactly six accent slots');return out;}
 async function applyToZip(zip,options){
  const o=options||{},source=o.source||'common';if(!['common','theme'].includes(source))throw Error('Unknown native palette source');
  const files=Object.keys(zip.files).filter(n=>/(?:^|\/)theme[^/]*\.xml$/.test(n)&&!zip.files[n].dir).sort();if(!files.length)throw Error('Missing theme part');
  const first=await zip.file(files[0]).async('string'),scheme=readScheme(first),accents=(o.accents||(source==='common'?ACCENTS:Array.from({length:6},(_,i)=>scheme['accent'+(i+1)]))).slice();
  if(accents.length!==6||accents.some(c=>!valid(c)))throw Error('Six valid accent colors are required');
  const changedParts=[];
  if(source==='common'||o.accents)for(const file of files){const entry=zip.file(file),before=await entry.async('string'),after=replaceAccents(before,accents);if(after!==before){zip.file(file,after,{date:entry.date,createFolders:false});changedParts.push(file);}}
  const highlights=accents.map(softColor).concat('FFFFFF'),file='ppt/presProps.xml',entry=zip.file(file);let props=entry?await entry.async('string'):'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentationPr xmlns:p="'+P+'" xmlns:a="'+A+'"/>';
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
  {label:'清爽線框',en:'Clean Outline',fill:0,line:1,effect:0},
  {label:'主色實心',en:'Solid Color',fill:1,line:1,effect:0},
  {label:'白框浮起',en:'White Rim Lift',fill:1,line:2,effect:1},
  {label:'柔底微浮',en:'Soft Tint Lift',fill:3,line:3,effect:1},
  {label:'主色微立體',en:'Subtle Depth',fill:2,line:0,effect:2},
  {label:'深色浮起',en:'Deep Color Lift',fill:1,line:0,effect:3}
 ].map(Object.freeze));
 const KIT_SHADOWS=Object.freeze([{blur:4.2,offset:1.5,alpha:.20},{blur:7,offset:2,alpha:.18},{blur:7,offset:2,alpha:.24}].map(Object.freeze));
 // DrawingML tint/shade operate in linear RGB. Verified against PowerPoint's
 // resolved colors; blending encoded sRGB makes dark fills falsely look darker.
 function transform(color,mods=[]){let a=color.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);for(const [kind,value]of mods)a=a.map(v=>kind==='tint'?v*value/100000+(1-value/100000):v*value/100000);return a.map(v=>Math.round(255*(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055)).toString(16).padStart(2,'0')).join('').toUpperCase();}
 function luminance(c){const a=c.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;}
 function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
 function kitEffect(color,row,dark='000000',light='FFFFFF'){
  const spec=KIT_EFFECTS[row];if(!valid(color)||!spec)throw Error('Invalid Kit effect');
  let fillMods=row===5?[['shade',45000]]:[],fontMods=[],fontRole='self';
  const stops=()=>{const c=transform(color,fillMods);return row===0?['FFFFFF']:row===3?[transform(c,[['tint',12000]]),transform(c,[['tint',20000]])]:row===4?[transform(c,[['tint',95000]]),transform(c,[['shade',95000]])]:[c];};
  let backgrounds=stops(),foreground=color;
  const minimum=c=>Math.min(...backgrounds.map(bg=>contrast(c,bg)));
  if(row===0||row===3){for(let amount=100000;amount>=0;amount-=5000){fontMods=amount===100000?[]:[['shade',amount]];foreground=transform(color,fontMods);if(minimum(foreground)>=4.6)break;}}
  else{
   if(row===5){for(let amount=45000;amount>=0;amount-=2500){fillMods=[['shade',amount]];backgrounds=stops();if(minimum(light)>=4.6)break;}}
   // A narrow gradient can straddle the black/white contrast crossover. Darken
   // its reference color only in that case, leaving the actual Accent intact.
   if(row===4&&Math.max(minimum(dark),minimum(light))<4.6){for(let amount=95000;amount>=0;amount-=5000){fillMods=[['shade',amount]];backgrounds=stops();if(minimum(light)>=4.6)break;}}
   fontRole=minimum(light)>=4.6?'lt1':'tx1';foreground=fontRole==='lt1'?light:dark;
  }
  const lineMods=row===1?[['shade',80000]]:[],lineColor=row===2?light:transform(color,row===3?[['tint',30000]]:lineMods),shadow=spec.effect?KIT_SHADOWS[spec.effect-1]:null;
  return{...spec,row,fillMods,fontMods,fontRole,foreground,backgrounds,lineColor,lineMods,shadow,contrast:minimum(foreground)};
 }
 const colorXml=(role,mods=[])=>'<a:schemeClr val="'+role+'">'+mods.map(([k,v])=>'<a:'+k+' val="'+v+'"/>').join('')+'</a:schemeClr>';
 function kitThemeXml(themeXml){
  const old=(themeXml.match(/<a:fmtScheme\b[^>]*>[\s\S]*?<\/a:fmtScheme>/)||[])[0];if(!old)throw Error('Missing formatting matrix');
  const background=(old.match(/<a:bgFillStyleLst>[\s\S]*?<\/a:bgFillStyleLst>/)||[])[0];if(!background)throw Error('Missing background styles');
  const solid=mods=>'<a:solidFill>'+colorXml('phClr',mods)+'</a:solidFill>',gradient=(first,last)=>'<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0">'+colorXml('phClr',first)+'</a:gs><a:gs pos="100000">'+colorXml('phClr',last)+'</a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill>';
  const fills='<a:fillStyleLst>'+solid([])+gradient([['tint',95000]],[['shade',95000]])+gradient([['tint',12000]],[['tint',20000]])+'</a:fillStyleLst>';
  const lines='<a:lnStyleLst>'+[.75,1,.75].map((width,i)=>'<a:ln w="'+Math.round(width*12700)+'" cap="flat" cmpd="sng" algn="ctr">'+solid(i===2?[['tint',30000]]:[])+'<a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>').join('')+'</a:lnStyleLst>';
  const effects='<a:effectStyleLst>'+KIT_SHADOWS.map(s=>'<a:effectStyle><a:effectLst><a:outerShdw blurRad="'+Math.round(s.blur*12700)+'" dist="'+Math.round(s.offset*12700)+'" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="'+Math.round(s.alpha*100000)+'"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle>').join('')+'</a:effectStyleLst>';
  return themeXml.replace(old,'<a:fmtScheme name="PPT Style Studio component effects">'+fills+lines+effects+background+'</a:fmtScheme>');
 }
 return{COMMON,ACCENTS,softColor,readScheme,replaceAccents,applyToZip,KIT_EFFECTS,KIT_SHADOWS,kitEffect,kitThemeXml,colorXml,transform,contrast};
});
