/* Native theme accents and native text highlights. Never changes text/background
 * theme slots, fonts, the formatting matrix, or the Office Ribbon itself. */
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
 return{COMMON,ACCENTS,softColor,readScheme,replaceAccents,applyToZip};
});
