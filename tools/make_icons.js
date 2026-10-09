// 產生 icons.js 的圖示資料區塊（v8：約 500 個 Google Material Symbols Rounded，Apache License 2.0）
// 來源：google/material-design-icons 的 Material Symbols SVG（npm 套件 @material-symbols/svg-300／400／500，同一份官方 SVG 的打包）
// 挑選：tools/select_icons.py 讀 tools/icon_list.txt（人工分類、中文名稱、中文關鍵字）＋ Google Fonts 圖示 metadata 的 popularity → tools/icon_selected.json
// 用法：npm i @material-symbols/svg-300 @material-symbols/svg-400 @material-symbols/svg-500 && node tools/make_icons.js [node_modules 路徑]
// 壓縮：三種字重的路徑各自整數化（960 網格取整數 → 24 網格誤差 ≤ 0.0125）後以相對座標重寫，再 raw DEFLATE ＋ base64 內嵌；icons.js 載入時同步解壓
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const NM=process.argv[2]||path.join(process.cwd(),'node_modules');
const WEIGHTS=[300,400,500];
const ver=JSON.parse(fs.readFileSync(path.join(NM,'@material-symbols/svg-400/package.json'),'utf8')).version;
const SEL=JSON.parse(fs.readFileSync(path.join(__dirname,'icon_selected.json'),'utf8')).icons;
// 簡報第 04 頁（圖示總覽）只放精選的這一組（v7 原本的 118 個，一頁放得下）；其餘只在 Studio 圖示庫
const TOP=JSON.parse(fs.readFileSync(path.join(__dirname,'icon_top.json'),'utf8'));
// 自訂：晶圓（Material 沒有晶圓）。960 網格、與 Material 同樣的線寬（300/400/500 ≈ 40/60/72）
function wafer(w){const t={300:40,400:60,500:72}[w];const C=480,R=400,F=372,a=Math.sqrt(R*R-F*F),ri=R-t,fi=F-t,ai=Math.sqrt(ri*ri-fi*fi);const r=v=>Math.round(v*10)/10;
 // 外圈（底部小平邊＝晶圓定位邊）＋內圈反向（挖空）＋ 2×2 晶粒；各字重晶粒相同，只有外圈粗細跟字重
 let d=`M${r(C-a)} ${r(-C+F)}A${R} ${R} 0 1 1 ${r(C+a)} ${r(-C+F)}Z M${r(C+ai)} ${r(-C+fi)}A${ri} ${ri} 0 1 0 ${r(C-ai)} ${r(-C+fi)}Z`;
 const s=140,g=60,rr=20;[[-1,-1],[0,-1],[-1,0],[0,0]].forEach(([i,j])=>{const x0=C+(i<0?-g/2-s:g/2),y0=-C+(j<0?-g/2-s:g/2);
  d+=` M${r(x0+rr)} ${r(y0)}h${s-2*rr}a${rr} ${rr} 0 0 1 ${rr} ${rr}v${s-2*rr}a${rr} ${rr} 0 0 1 -${rr} ${rr}h-${s-2*rr}a${rr} ${rr} 0 0 1 -${rr} -${rr}v-${s-2*rr}a${rr} ${rr} 0 0 1 ${rr} -${rr}Z`;});
 return d;}
// 座標四捨五入到 0.1（960 網格 → 24 網格誤差 < 0.003），只處理小數，整數與指令不動
function round1(d){return d.replace(/\d*\.\d+/g,(x,i,all)=>{let v=(+x).toFixed(1);if(v.endsWith('.0')&&all[i+x.length]!=='.')v=v.slice(0,-2);if(/[\d.]/.test(all[i-1]||''))v=v.startsWith('0.')?v.slice(1):' '+v;return v;});}
function quant(d){const segs=[];// own parser keeping Q/T as Q
 let i=0,cmd='',cx=0,cy=0,sx=0,sy=0,lq=null,lc=null;const out=[];
 const num=()=>{const m=/^[\s,]*([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/.exec(d.slice(i));if(!m)throw new Error('num '+d.slice(i,i+10));i+=m[0].length;return +m[1];};
 const more=()=>/^[\s,]*[-+.\d]/.test(d.slice(i));
 while(i<d.length){const m=/^[\s,]*([a-zA-Z])/.exec(d.slice(i));if(m){cmd=m[1];i+=m[0].length;}else if(!more())break;
  const rel=cmd===cmd.toLowerCase(),C=cmd.toUpperCase();const X=v=>rel?cx+v:v,Y=v=>rel?cy+v:v;
  if(C==='Z'){out.push(['Z']);cx=sx;cy=sy;lq=lc=null;continue;}
  do{switch(C){
   case 'M':{const x=X(num()),y=Y(num());out.push(['M',x,y]);cx=sx=x;cy=sy=y;cmd=rel?'l':'L';lq=lc=null;break;}
   case 'L':{const x=X(num()),y=Y(num());out.push(['L',x,y]);cx=x;cy=y;lq=lc=null;break;}
   case 'H':{const x=rel?cx+num():num();out.push(['L',x,cy]);cx=x;lq=lc=null;break;}
   case 'V':{const y=rel?cy+num():num();out.push(['L',cx,y]);cy=y;lq=lc=null;break;}
   case 'C':{const a=X(num()),b=Y(num()),c=X(num()),e=Y(num()),x=X(num()),y=Y(num());out.push(['C',a,b,c,e,x,y]);lc=[c,e];lq=null;cx=x;cy=y;break;}
   case 'S':{const r=lc?[2*cx-lc[0],2*cy-lc[1]]:[cx,cy];const c=X(num()),e=Y(num()),x=X(num()),y=Y(num());out.push(['C',r[0],r[1],c,e,x,y]);lc=[c,e];lq=null;cx=x;cy=y;break;}
   case 'Q':{const a=X(num()),b=Y(num()),x=X(num()),y=Y(num());out.push(['Q',a,b,x,y]);lq=[a,b];lc=null;cx=x;cy=y;break;}
   case 'T':{const r=lq?[2*cx-lq[0],2*cy-lq[1]]:[cx,cy];const x=X(num()),y=Y(num());out.push(['Q',r[0],r[1],x,y]);lq=r;lc=null;cx=x;cy=y;break;}
   case 'A':throw new Error('arc');
   default:throw new Error('cmd '+cmd);}}while(C!=='M'&&more()&&false);
 }
 // serialize: relative, integer coords from rounded absolutes
 let px=0,py=0,spx=0,spy=0,s='',last='';const R=Math.round;
 const join=a=>a.map((v,k)=>(k&&v>=0?' ':'')+v).join('').replace(/ -/g,'-');
 for(const g of out){const op=g[0];if(op==='Z'){s+='z';last='z';px=spx;py=spy;continue;}
  const P=g.slice(1).map(R);const rel=P.map((v,k)=>v-(k%2?py:px));
  let c=op.toLowerCase();let args=rel;
  if(op==='M'){c='M';args=P;} // absolute moves keep accuracy simple
  if(op==='L'){if(rel[0]===0&&rel[1]===0)continue;if(rel[1]===0){c='h';args=[rel[0]];}else if(rel[0]===0){c='v';args=[rel[1]];}}
  const body=join(args);s+=(c===last&&c!=='M'?(args[0]>=0?' ':''):c)+body;last=c;if(op==='M'){spx=P[0];spy=P[1];}
  px=P[P.length-2];py=P[P.length-1];}
 return s;}

const meta=[],paths=[];const cats=[];
SEL.forEach(i=>{const T=TOP[i.id];if(!cats.find(c=>c[0]===i.cat))cats.push([i.cat,i.catEn]);
 const en=T?T.en:i.id.split('_').map((w,k)=>k?w:w[0].toUpperCase()+w.slice(1)).join(' ');
 const kw=[...new Set([...(i.kw||'').split(/\s+/),...(T?T.kw.split(/\s+/):[]),...i.en.split(/\s+/)].filter(Boolean))].join(' ');
 meta.push([i.id,T&&T.zh||i.zh,en,i.cat,i.custom?'custom':'material',kw,T?1:0]);
 WEIGHTS.forEach(w=>{let d;
  if(i.custom)d=wafer(w);
  else{const s=fs.readFileSync(path.join(NM,`@material-symbols/svg-${w}/rounded/${i.id}.svg`),'utf8');const m=s.match(/<path d="([^"]+)"/g);if(!m||m.length!==1)throw new Error('path? '+i.id);
   d=quant(m[0].slice(9,-1)).replace(/M(-?\d+)\s?(-?\d+)h(-?\d+)\s?h?\s?(-?\d+)z/g,(a,x,y,h1,h2)=>(+h1+ +h2===0?'':a));}  // 去掉退化的 0 面積子路徑
  if(/[\n|]/.test(d))throw new Error('bad path');paths.push(d);});});
const raw=Buffer.from(paths.join('\n'));const z=zlib.deflateRawSync(raw,{level:9});
const b64=z.toString('base64').replace(/.{1,120}/g,'$&\\\n');
const js='const ICON_SRC='+JSON.stringify({material:ver,style:'Rounded',weights:WEIGHTS,count:meta.length,top:meta.filter(m=>m[6]).length})+';\n'+
 'const ICON_CATS='+JSON.stringify(cats)+';\n'+
 '// [id, 中文, English, 類別, 來源, 中英關鍵字, 精選(第 04 頁)]\nconst ICON_DATA=['+meta.map(m=>JSON.stringify(m)).join(',\n')+'];\n'+
 '// 路徑：每個圖示 300／400／500 三行（換行分隔）→ raw DEFLATE → base64\nconst ICON_PATHS_Z="'+b64.replace(/\\\n$/,'')+'";';
const f=path.join(__dirname,'..','icons.js');let s=fs.readFileSync(f,'utf8');
s=s.replace(/\/\*DATA\*\/[\s\S]*?\/\*END\*\//,()=>'/*DATA*/\n'+js+'\n/*END*/');fs.writeFileSync(f,s);
console.log('icons:',meta.length,'top',meta.filter(m=>m[6]).length,'material',ver,'paths raw',raw.length,'deflate',z.length,'data bytes',Buffer.byteLength(js));
module.exports={quant};
