/* Portable table work and reusable appearance. No DOM, storage, or network. */
(function(root){
'use strict';
const D=typeof module!=='undefined'?require('./deck.js'):root.Deck;
const VERSION=1,PROJECT='ppt-style-studio/table-project',STYLES='ppt-style-studio/table-styles',MAX_BYTES=8*1024*1024;
const THEME_KEYS=D.TABLE_THEME_KEYS;
const TABLE_KEYS=[...Object.keys(D.BASE).filter(k=>k.startsWith('tb')),'tbPanel','tbTitleInk'];
const STYLE_KEYS=['P','PD','PT','A','useA','ink','t2','mute','line','l2','fill','tFont','bFont','nFont','semWarn','semGood','semBad','tbFont','tbHeaderStyle','tbStripes','tbGrid','tbCardOn','tbLook','tbTitleInk'];
const ENUMS={size:['S','M','L'],shMode:['drop','halo','both','none'],tbDense:['auto','normal','compact','dense','loose','comfy'],tbHiColor:['auto','P','A','alert'],tbHiMode:['auto','fill','box','bold'],tbArrow:['mono'],tbLook:['clean','band','card','bandcard','zebra','hair','panel','matrix'],tbCard:['white'],tbHeaderStyle:[null,'normal','primary'],tbGrid:[null,'all','horizontal','none'],tbMinus:['auto','minus','paren'],tbWidth:['auto','full','90','45'],tbV:['center','top'],tbH:['center','left'],tbFont:['jh','auto','arial','noto'],tbPad:['none','s','m','l'],tbWidthMode:['auto','90','45'],tbHeightMode:['optimal','larger','smaller','minimum']};
const clone=o=>JSON.parse(JSON.stringify(o));
const fail=m=>{throw new Error(m);};
const object=(o,label)=>{if(!o||typeof o!=='object'||Array.isArray(o))fail(label+' 必須是物件');return o;};
const keys=(o,allowed,label)=>{object(o,label);for(const k of Object.keys(o))if(!allowed.includes(k))fail(label+' 含不支援欄位：'+k);};
const text=(s,label,max=64000)=>{if(typeof s!=='string'||s.length>max||D.stripCtl(s)!==s)fail(label+' 文字格式無效或過長');return s;};
const name=s=>{text(s,'名稱',80);if(!s.trim())fail('請輸入名稱');return s.trim();};
function guard(o,depth=0,budget={n:0}){if(depth>16||++budget.n>180000)fail('檔案結構過深或過大');if(o&&typeof o==='object'){for(const k of Object.keys(o)){if(['__proto__','constructor','prototype'].includes(k))fail('檔案含不安全欄位');guard(o[k],depth+1,budget);}}else if(typeof o==='number'&&!Number.isFinite(o))fail('數字必須有限');}
function parse(raw){if(typeof raw!=='string')fail('需要 JSON 文字');if(new TextEncoder().encode(raw).length>MAX_BYTES)fail('檔案超過 8 MiB，未載入');let o;try{o=JSON.parse(raw);}catch(_){fail('不是有效 JSON 檔案');}guard(o);return o;}
function params(p,allowed){keys(p,allowed,'樣式參數');for(const [k,v] of Object.entries(p)){
 if(ENUMS[k]){if(!ENUMS[k].includes(v))fail(k+' 選項無效');continue;}
 if(k==='tbSizingVersion'){if(![1,2].includes(v))fail('尺寸版本無效');continue;}
 if(['tbCardOn','tbStripes'].includes(k)){if(v!==null&&typeof v!=='boolean')fail(k+' 必須是布林值');continue;}
 if(k==='tbPanel'){if(typeof v!=='boolean')fail(k+' 必須是布林值');continue;}
 if(k==='tbTitleInk'||/^(P|PD|PT|A|ink|t2|mute|line|l2|fill|semWarn|semGood|semBad)$/.test(k)){if(typeof v!=='string'||!(/^[0-9A-Fa-f]{6}$/.test(v)||v===''&&/^(sem|tbTitle)/.test(k)))fail(k+' 色碼無效');continue;}
 const def=D.BASE[k];if(typeof def==='boolean'){if(typeof v!=='boolean'||k==='tbTight'&&v!==false)fail(k+' 必須是有效布林值');}
 else if(typeof def==='number'){const range=k==='r'?[0,.3]:k==='shDir'?[0,360]:/^(shA|haloA)$/.test(k)?[0,1]:/Size$/.test(k)?[1,200]:[0,100];if(!Number.isFinite(v)||v<range[0]||v>range[1])fail(k+' 數值超出範圍');}
 else if(/Font$/.test(k)){if(typeof v!=='string'||v.length>80||!/^[\w .\-\u4e00-\u9fff]*$/.test(v))fail(k+' 字型名稱無效');}
 else fail('不支援的參數：'+k);
 }return clone(p);}
const pick=(o,list)=>Object.fromEntries(list.filter(k=>o[k]!==undefined).map(k=>[k,o[k]]));
function range(q,nr,nc){if(!q||!['r0','r1','c0','c1'].every(k=>Number.isInteger(q[k]))||q.r0<0||q.c0<0||q.r1<q.r0||q.c1<q.c0||q.r1>=nr||q.c1>=nc)fail('範圍超出表格');}
function validateTable(t){
 keys(t,['rows','title','unit','note','header','hcol','lastTotal','keep','pin','bold','align','fmt','types','formats','cw','his','rules','hiStyle','legend','merges','sizingFont','theme','cellFormats','colLocks','rowLocks'],'表格');
 if(!Array.isArray(t.rows)||t.rows.length>1000)fail('表格列數無效（最多 1000 列）');const nr=t.rows.length,nc=nr&&Array.isArray(t.rows[0])?t.rows[0].length:0;
 if(nr&&(!nc||nc>100)||nr*nc>20000)fail('表格大小無效（最多 100 欄／20000 格）');
 for(const row of t.rows){if(!Array.isArray(row)||row.length!==nc)fail('每列欄數必須一致');row.forEach(s=>text(s,'儲存格'));}
 for(const k of ['title','unit','note'])if(k in t)text(t[k],k);
 if('header'in t&&![true,false,'auto',null].includes(t.header))fail('表頭位置無效');
 for(const k of ['hcol','keep','pin'])if(k in t&&typeof t[k]!=='boolean')fail(k+' 必須是布林值');
 if('lastTotal'in t&&![true,false,null].includes(t.lastTotal))fail('合計設定無效');
 if('hiStyle'in t&&![null,'fill','box','bold'].includes(t.hiStyle))fail('強調樣式無效');
 if(t.cw!=null&&(!Array.isArray(t.cw)||t.cw.length!==nc||t.cw.some(v=>!Number.isFinite(v)||v<=0||v>200)))fail('欄寬無效');
 if(t.sizingFont!=null){keys(t.sizingFont,['bodyPt','headerPt','scale','autoBoost'],'字級');if(!D.tableSizingFontOf(t.sizingFont))fail('字級無效');}
 if(t.theme)params(t.theme,THEME_KEYS);
 if(t.bold!==undefined&&(!Array.isArray(t.bold)||t.bold.some(v=>!Number.isInteger(v)||v<0||v>=nr)))fail('粗體列超出範圍');
 for(const [k,values] of Object.entries({align:['left','center','right'],types:['auto','text','number'],formats:['raw','grouped']}))if(t[k]!==undefined){object(t[k],k);for(const [c,v] of Object.entries(t[k]))if(!/^\d+$/.test(c)||+c>=nc||!values.includes(v))fail(k+' 欄格式無效');}
 if(t.fmt!==undefined){object(t.fmt,'個別格式');for(const [c,f] of Object.entries(t.fmt)){if(!/^\d+$/.test(c)||+c>=nc)fail('個別格式超出欄位');keys(f,['dec','pct'],'數字格式');if('dec'in f&&(!Number.isInteger(f.dec)||f.dec<0||f.dec>4)||'pct'in f&&typeof f.pct!=='boolean')fail('數字格式無效');}}
 if(t.legend!==undefined){keys(t.legend,['focus','rec','warn'],'圖例');Object.values(t.legend).forEach(s=>text(s,'圖例',80));}
 if(t.merges!==undefined){if(!Array.isArray(t.merges)||t.merges.length>1000)fail('合併範圍無效');for(const m of t.merges){keys(m,['r0','r1','c0','c1','text','originalText'],'合併');range(m,nr,nc);text(m.text,'合併文字');text(m.originalText,'合併原文');}D.tableMerges(t);}
 if(t.his!==undefined){if(!Array.isArray(t.his)||t.his.length>200)fail('強調數量無效');for(const h of t.his){keys(h,['type','i','r','c','r0','r1','c0','c1','presetId','color','kind','styleId','bold','borderWidth','boldRegions','excludes'],'強調');
  if(!['cell','row','col','range'].includes(h.type))fail('強調類型無效');if(h.type==='range'){range(h,nr,nc);if(!D.tableHighlightPreset(h.presetId))fail('強調樣式不存在');}
  if(h.type==='cell'&&(!Number.isInteger(h.r)||!Number.isInteger(h.c)||h.r<0||h.c<0||h.r>=nr||h.c>=nc))fail('強調儲存格越界');
  if(['row','col'].includes(h.type)&&(!Number.isInteger(h.i)||h.i<0||h.i>=(h.type==='row'?nr:nc)))fail('強調列欄越界');
  if('color'in h&&!['auto','P','A','alert'].includes(h.color))fail('強調色無效');if('kind'in h&&!['focus','rec','warn'].includes(h.kind))fail('強調角色無效');if('styleId'in h&&!['fill','outline'].includes(h.styleId))fail('強調種類無效');
  if('bold'in h&&typeof h.bold!=='boolean')fail('強調粗體無效');if('borderWidth'in h&&!D.TABLE_HIGHLIGHT_BORDER_WIDTHS.includes(h.borderWidth))fail('強調線寬無效');
  for(const k of ['boldRegions','excludes'])if(h[k]){if(!Array.isArray(h[k])||h[k].length>200)fail('強調範圍無效');for(const q of h[k]){keys(q,['r0','r1','c0','c1'],'強調範圍');range(q,nr,nc);}}
 }if(D.tableMarks(t,nc,nr).his.length!==t.his.length)fail('強調含重複或越界範圍');}
 if(t.rules!==undefined){if(!Array.isArray(t.rules)||t.rules.length)fail('作品含已停用的舊規則，未載入；請先移除舊規則後再儲存');for(const rule of t.rules){keys(rule,['c','op','v','tone','style'],'舊規則');if(!Number.isInteger(rule.c)||rule.c<0||rule.c>=nc||!['<','<=','>','>=','='].includes(rule.op)||rule.v!==null&&!Number.isFinite(rule.v)||!['warn','good','accent'].includes(rule.tone)||!['text','fill','box'].includes(rule.style))fail('舊規則無效');}}
 if(t.cellFormats!==undefined)validateCellFormats(t.cellFormats,nr,nc);
 D.tableLocks(t,'col');D.tableLocks(t,'row');
 return clone(t);
}
function validateProject(o){guard(o);keys(o,['type','schemaVersion','name','table','params'],'作品');if(o.type!==PROJECT)fail('這不是表格作品檔；全站設定 JSON 不包含表格資料');if(o.schemaVersion!==VERSION)fail('不支援此作品版本，請使用對應新版程式');return{type:PROJECT,schemaVersion:VERSION,name:name(o.name),table:validateTable(o.table),params:params(o.params,TABLE_KEYS)};}
function makeProject(n,p,t){const table=clone(t);table.theme=pick(D.tableParams(p,t),THEME_KEYS);return validateProject({type:PROJECT,schemaVersion:VERSION,name:n,table,params:pick(p,TABLE_KEYS)});}
function makeStyle(n,p){const a=D.tableAppearanceOf(p),s={...p,tbCardOn:a.card,tbHeaderStyle:a.header,tbStripes:a.stripes,tbGrid:a.grid};return{name:name(n),params:params(pick(s,STYLE_KEYS),STYLE_KEYS)};}
function validateStyles(o){guard(o);keys(o,['type','schemaVersion','styles'],'樣式檔');if(o.type!==STYLES||o.schemaVersion!==VERSION)fail('不支援的常用樣式檔案類型或版本');if(!Array.isArray(o.styles)||o.styles.length>50)fail('最多保存 50 份常用樣式');const seen=new Set(),styles=o.styles.map(s=>{keys(s,['name','params'],'常用樣式');const n=name(s.name);if(seen.has(n))fail('樣式名稱重複');seen.add(n);return{name:n,params:params(s.params,STYLE_KEYS)};});return{type:STYLES,schemaVersion:VERSION,styles};}
function applyStyle(p,t,style){keys(style,['name','params'],'常用樣式');name(style.name);const clean=params(style.params,STYLE_KEYS),nextP=clone(p),nextT=clone(t);nextT.theme=Object.assign({},pick(D.tableParams(p,t),THEME_KEYS),pick(clean,THEME_KEYS));for(const k of STYLE_KEYS.filter(k=>k.startsWith('tb')))if(k in clean)nextP[k]=clean[k];return{params:nextP,table:nextT};}
// Reserved explicit cell appearance schema, used by the format painter only.
function cellStyle(s){return D.tableCellStyle(s);}
function validateCellFormats(formats,nr,nc){if(!Array.isArray(formats)||formats.length>20000)fail('個別外觀格式無效');const seen=new Set();for(const f of formats){keys(f,['r','c','style'],'個別外觀');if(!Number.isInteger(f.r)||!Number.isInteger(f.c)||f.r<0||f.c<0||f.r>=nr||f.c>=nc||seen.has(f.r+':'+f.c))fail('個別外觀越界或重複');seen.add(f.r+':'+f.c);cellStyle(f.style);}return formats;}
const api={VERSION,PROJECT,STYLES,MAX_BYTES,THEME_KEYS,TABLE_KEYS,STYLE_KEYS,parse,validateProject,makeProject,makeStyle,validateStyles,applyStyle,validateTable,cellStyle,validateCellFormats};
if(typeof module!=='undefined')module.exports=api;else root.TableWorkspace=api;
})(this);
