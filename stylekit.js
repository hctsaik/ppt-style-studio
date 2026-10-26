/* PPT Template Style Kit 分頁：選主題 → HTML 預覽（快速樣式 7×6、柔和螢光筆、強調記號）→ 下載內嵌該主題色彩＋fmtScheme 的 .pptx（另附 .potx、色彩 .xml）
   色彩來源 stylekit-data.js；檔案在 stylekit/<id>.*（tools/build_stylekit_assets.py 產生）；單檔版由 build_single.py 內嵌成 window.STYLEKIT_B64 */
(function(){
const T=window.STYLEKIT_THEMES||[];const W='FFFFFF';
const hx=c=>[0,2,4].map(i=>parseInt(c.slice(i,i+2),16));
const toHex=a=>a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();
const mix=(a,b,t)=>{const x=hx(a),y=hx(b);return toHex(x.map((v,i)=>v+(y[i]-v)*t));};
// DrawingML lumMod/lumOff（HSL 亮度）
function lum(c,mod,off){let[r,g,b]=hx(c).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;
 if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6;}
 l=Math.min(1,l*mod+off);const f=(p,q,t)=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};
 if(!s)return toHex([l,l,l].map(v=>v*255));const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return toHex([f(p,q,h+1/3),f(p,q,h),f(p,q,h-1/3)].map(v=>v*255));}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// PowerPoint 快速樣式 6 列（Office 2013+ 主題樣式）× 7 欄（Text1/dk1＋Accent1–6），依本主題 fmtScheme：
// fill1=實色、fill2=漸層(lumMod60/lumOff40→原色)、fill3=淺漸層(20/80→40/60)；線 0.75/1/1.5pt；效果 3＝柔和陰影
const ROWS=[['色彩外框','Colored Outline'],['色彩填滿','Colored Fill'],['淺色外框＋色彩填滿','Light 1 Outline, Colored Fill'],['輕微效果','Subtle Effect'],['中度效果','Moderate Effect'],['強烈效果','Intense Effect']];
function cell(c,i){const dk=lum(c,.5,0);
 switch(i){case 0:return{bg:'#FFF',bd:'1px solid #'+c,fg:'#'+c};
  case 1:return{bg:'#'+c,bd:'1px solid #'+dk,fg:'#FFF'};
  case 2:return{bg:'#'+c,bd:'1px solid #FFF;box-shadow:0 0 0 1px #'+c,fg:'#FFF'};
  case 3:return{bg:`linear-gradient(#${lum(c,.2,.8)},#${lum(c,.4,.6)})`,bd:'1px solid #'+c,fg:'#'+c==='#000000'?'#000':'#'+lum(c,.75,0)};
  case 4:return{bg:`linear-gradient(#${lum(c,.6,.4)},#${c})`,bd:'0',fg:'#FFF'};
  default:return{bg:'#'+c,bd:'0',fg:'#FFF',sh:'0 1.5px 4px rgba(0,0,0,.28)'};}}
function gallery(t){const cols=[t.sc.dk1].concat(t.sc.acc),names=['Text1 / 深色1','Accent 1','Accent 2','Accent 3','Accent 4','Accent 5','Accent 6'];
 let h='<div class="skG" id="skGal"><div></div>'+cols.map((c,j)=>`<div class="skCh">${names[j]}<br><code>#${c}</code></div>`).join('');
 ROWS.forEach((r,i)=>{h+=`<div class="skRh">${r[0]}<small>${r[1]}</small></div>`+cols.map((c,j)=>{const s=cell(c,i);return `<div class="skQ" data-r="${i}" data-c="${j}" style="background:${s.bg};border:${s.bd};color:${s.fg};${s.sh?'box-shadow:'+s.sh:''}">Abc</div>`;}).join('');});
 return h+'</div>';}
function kit(t){const sc=t.sc,P=sc.acc[0],A=sc.acc[1],PD=sc.dk2;
 const hl=sc.hl.map((v,i)=>`<div class="skHl"><span class="n">H${i+1}</span><span class="t" style="background:#${v}">Yield improved 良率提升</span><code>#${v}</code></div>`).join('');
 return `<div class="skCard"><h4>① 柔和螢光筆 <small>Soft highlights（自訂色：選單選不到，請用格式刷）</small></h4><div id="skHls">${hl}</div></div>
 <div class="skCard"><h4>② 強調記號 <small>Emphasis marks</small></h4>
  <p class="skE"><span class="hb"><i style="background:#FFD966"></i><b style="color:#${PD}">▶ 雙管齊下 Dual track</b></span><small>半高螢光條 Half-height marker</small></p>
  <p class="skE">Capacity: <s style="color:#8C8C8C">120K</s> <b style="color:#${P}">→ 150K</b> wpm<small>刪除線 舊→新 Strikethrough old→new</small></p>
  <p class="skE">Cycle time <b style="text-decoration:underline;text-decoration-thickness:3px;text-decoration-color:#${P};text-underline-offset:3px">−12%</b><small>粗色底線 Heavy colored underline</small></p>
  <p class="skE">Cost <b style="color:#${P};font-size:26px">-18</b><b style="color:#${P}">%</b> <span style="color:#8C8C8C;font-size:12px">vs. 2025</span><small>放大數字 Big number</small></p>
  <p class="skE skFt"><sup>1</sup> Source: internal report; data as of 2026/09. Note: <sup>*</sup> preliminary.<small>上標註腳＋頁尾來源 Superscript footer source</small></p></div>
 <div class="skCard"><h4>③ 佈景主題色彩 <small>Theme colors（設計 › 變化 › 色彩）</small></h4><div class="skSw">${[['深色1',sc.dk1],['淺色1',sc.lt1],['深色2',sc.dk2],['淺色2',sc.lt2]].concat(sc.acc.map((c,i)=>['輔色'+(i+1),c])).concat([['超連結',sc.hlink],['已瀏覽',sc.fol]]).map(([n,c])=>`<span><i style="background:#${c}"></i>${n}<code>#${c}</code></span>`).join('')}</div></div>`;}
const B64=()=>window.STYLEKIT_B64||null;const urls={};
function href(f){const b=B64();if(!b||!b[f])return 'stylekit/'+f;if(urls[f])return urls[f];
 const bin=atob(b[f]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
 const mime=/\.xml$/.test(f)?'application/xml':/\.potx$/.test(f)?'application/vnd.openxmlformats-officedocument.presentationml.template':'application/vnd.openxmlformats-officedocument.presentationml.presentation';
 return urls[f]=URL.createObjectURL(new Blob([u],{type:mime}));}
const CSS=`#vKit .skCr{display:block;font-size:10px;color:#595959;font-weight:400}#vKit .skCt{display:flex;flex-wrap:wrap;gap:6px 18px;margin:4px 0 10px;font-size:12px;color:#333}#vKit .skCt b{display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:-2px;margin-right:6px;border:1px solid #ddd}#vKit .skCt em{font-style:normal;font-weight:600}#vKit .skCt .ok{color:#2E7D4F}#vKit .skCt .mid{color:#7A5A00}#vKit .skCt .no{color:#9A3A3A}#vKit{background:#fff;overflow:auto;padding:18px 22px 40px}#vKit .skW{max-width:1180px;margin:0 auto;color:#3A3A3A}
#vKit h2{font-size:20px;margin:0 0 2px;color:#222}#vKit h2 small{font-size:12px;color:#8C8C8C;font-weight:400;margin-left:8px}
#vKit .skLead{font-size:12.5px;color:#595959;margin:4px 0 14px;line-height:1.6}
.skTh{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}.skTh button{border:1px solid #D9D9D9;background:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12.5px;display:flex;align-items:center;gap:6px;color:#3A3A3A}
.skTh button i{width:22px;height:12px;border-radius:2px;display:inline-flex;overflow:hidden}.skTh button i b{flex:1}.skTh button.on{border-color:var(--skP);box-shadow:inset 0 0 0 1px var(--skP);font-weight:700;color:var(--skP)}
.skDl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 16px;padding:12px 14px;border:1px solid #E5E5E5;border-left:4px solid var(--skP);border-radius:6px}
.skDl a{text-decoration:none;font-size:13px;border:1px solid #D9D9D9;border-radius:7px;padding:7px 12px;color:#3A3A3A}.skDl a.pri{background:var(--skP);border-color:var(--skP);color:#fff;font-weight:700}.skDl .skApply{font-size:13px;border:1px solid var(--skP);background:#fff;color:var(--skP);border-radius:7px;padding:7px 12px;font-weight:700;cursor:pointer}.skDl .skApply:hover{background:#EEF3FA}.skDl small{color:#8C8C8C;font-size:11.5px;flex-basis:100%}
.skSec{font-size:14px;font-weight:700;color:var(--skP);border-bottom:1.5px solid var(--skP);padding-bottom:4px;margin:18px 0 10px}.skSec small{color:#8C8C8C;font-weight:400;margin-left:6px;font-size:11.5px}
.skG{display:grid;grid-template-columns:150px repeat(7,1fr);gap:8px 10px;align-items:center}.skCh{font-size:10.5px;color:#8C8C8C;text-align:center;line-height:1.3}.skCh code{font-size:10px}
.skRh{font-size:12px;font-weight:700;color:#595959;line-height:1.25}.skRh small{display:block;font-weight:400;color:#8C8C8C;font-size:10.5px}
.skQ{height:40px;border-radius:5px;display:flex;align-items:center;justify-content:center;font:600 13px Arial,'Microsoft JhengHei',sans-serif;box-sizing:border-box}
.skK{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}.skCard{border:1px solid #E5E5E5;border-radius:6px;padding:12px 14px}.skCard h4{margin:0 0 8px;font-size:13.5px;color:var(--skP)}.skCard h4 small{display:block;color:#8C8C8C;font-weight:400;font-size:11px;margin-top:2px}
.skHl{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:13.5px}.skHl .n{color:#8C8C8C;font-size:11px;width:20px}.skHl .t{font-weight:700;padding:1px 3px}.skHl code,.skSw code{color:#8C8C8C;font-size:10.5px}
.skE{margin:8px 0;font-size:14px}.skE small{display:block;color:#8C8C8C;font-size:10.5px;margin-top:1px}.skFt{font-size:11px;color:#8C8C8C;border-top:1px solid #BFBFBF;padding-top:6px}
.hb{position:relative;display:inline-block;padding:0 2px}.hb i{position:absolute;left:14px;right:-2px;bottom:1px;height:45%;opacity:.65;border-radius:2px}.hb b{position:relative}
.skSw{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;font-size:12px}.skSw span{display:flex;align-items:center;gap:6px}.skSw i{width:16px;height:16px;border-radius:3px;border:1px solid #0001;flex:none}
.skNote{font-size:11.5px;color:#8C8C8C;line-height:1.7;margin-top:16px}
@media(max-width:820px){.skK{grid-template-columns:1fr}.skG{grid-template-columns:70px repeat(7,1fr);gap:5px}.skQ{height:30px;font-size:10px}.skCh{font-size:8.5px}.skRh small{display:none}.skRh{font-size:10px}}`;
// A Kit choice has a source. An explicit template selection must survive a
// visit to another tab, while the default follows the current Studio palette.
const STORE='ppt-studio-stylekit-v1',PALETTE_KEYS=['P','PD','PT','A','ink','t2','mute','line','l2','fill'];
let choice={source:'follow',id:null},globalPalette=null,cur=null;
try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved&&saved.source==='independent'&&T.some(t=>t.id===saved.id))choice={source:'independent',id:saved.id};}catch(_){}
const hex=c=>typeof c==='string'?c.replace(/^#/,'').toUpperCase():c;
function storeChoice(){try{localStorage.setItem(STORE,JSON.stringify(choice));}catch(_){}}
function matchGlobal(p){
 if(!p)return null;
 const D=window.Deck,known=D&&(D.PRESETS||[]).find(x=>{const full=Object.assign({},D.BASE,x);return PALETTE_KEYS.every(k=>hex(p[k])===hex(full[k]));});
 // Validate actual asset slots as well as the palette; matching a preset id
 // alone would silently serve an old/static file after a custom color edit.
 return known?T.find(t=>hex(t.sc.acc[0])===hex(p.P)&&hex(t.sc.dk2)===hex(p.PD)&&hex(t.sc.acc[4])===hex(p.PD)&&hex(t.sc.acc[1])===hex(p.A))||null:null;
}
function selectedTheme(){return choice.source==='independent'?T.find(t=>t.id===choice.id)||T[0]:matchGlobal(globalPalette&&globalPalette.params);}
function state(){const t=selectedTheme();return{source:choice.source,id:t?t.id:null,downloadable:!!t,base:globalPalette&&globalPalette.base||null};}
function sync(params,base,root){globalPalette={params:Object.assign({},params),base:base||null};return paint(root);}
function selectSource(source,root){if(source==='follow')choice.source='follow';else{choice={source:'independent',id:(selectedTheme()||T.find(t=>t.id===choice.id)||T[0]).id};}storeChoice();return paint(root);}
function selectTheme(id,root){if(!T.some(t=>t.id===id))return;choice={source:'independent',id};storeChoice();return paint(root);}
function sourceControls(t){return `<div class="skSource" role="group" aria-label="Style Kit 配色來源"><button type="button" id="skFollow" aria-pressed="${choice.source==='follow'}">跟隨全站配色</button><button type="button" id="skIndependent" aria-pressed="${choice.source==='independent'}">獨立範本</button><span id="skSourceStatus" role="status">${choice.source==='independent'?'目前使用獨立範本：'+esc(t.zh)+'；全站改色不會覆蓋這項選擇。':t?'已跟隨全站內建配色：'+esc(t.zh)+'。':'目前是自訂配色，尚無對應的靜態 Style Kit 範本。'}</span></div>`;}
function downloadLink(t,kind,label,primary){const ext=kind==='xml'?'_colors.xml':'.'+kind,fn='PPT Template Style Kit - '+(t?t.zh:'自訂配色');return `<a${primary?' class="pri"':''} id="sk${kind==='pptx'?'Pptx':kind==='potx'?'Potx':'Xml'}" ${t?`href="${href(t.id+ext)}" download="${esc(fn)}.${kind}" data-stylekit-file="${t.id+ext}" data-stylekit-theme="${t.id}" data-stylekit-source="${choice.source}"`:'aria-disabled="true" tabindex="-1"'}>${label}</a>`;}
function customNotice(){const p=globalPalette&&globalPalette.params||{};return `<div class="skCustom" id="skCustomNotice"><strong>自訂色尚未提供 Style Kit 範本下載</strong><p>這裡不會用舊範本代替目前配色。請選下方獨立範本，或切回全站內建配色。元件庫的預覽與匯出仍可使用自訂色。</p><div class="skSw">${[['主色 P',p.P],['深色 PD',p.PD],['淺色 PT',p.PT],['強調色 A',p.A]].filter(([,c])=>/^[0-9A-F]{6}$/.test(hex(c)||'')).map(([n,c])=>`<span><i style="background:#${hex(c)}"></i>${n}<code>#${hex(c)}</code></span>`).join('')}</div></div>`;}
function skL(h){const c=[0,2,4].map(k=>parseInt(h.slice(k,k+2),16)/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function skCR(a,b){const x=skL(a),y=skL(b||'FFFFFF');return ((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(1);}
function skCT(t){const R=[['主色 輔色1',t.sc.acc[0]],['強調 輔色2',t.sc.acc[1]],['深色 輔色5',t.sc.acc[4]],['說明 #595959','595959'],['淺色 H1',t.sc.hl[0]]];return '<div class="skCt" id="skCt">'+R.map(([n,c])=>{const r=+skCR(c);const ok=r>=4.5,mid=r>=3;return `<span><b style="background:#${c}"></b>${n} #${c}　<em class="${ok?'ok':mid?'mid':'no'}">${r}:1 ${ok?'✓ 可當字色':mid?'◐ 只用大字／圖形':'✕ 只當底色'}</em></span>`;}).join('')+'</div>';}
// Retain the public render(id) API for explicit standalone Kit consumers.
function render(id,root){if(id)return selectTheme(id,root);return paint(root);}
function paint(root){root=root||document.getElementById('vKit');if(!root||!T.length)return;const t=selectedTheme();cur=t?t.id:null;
 if(!document.getElementById('skCss')){const s=document.createElement('style');s.id='skCss';s.textContent=CSS;document.head.appendChild(s);}
 if(!document.getElementById('skSourceCss')){const s=document.createElement('style');s.id='skSourceCss';s.textContent='.skSource{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0;font-size:12px}.skSource button{border:1px solid #D9D9D9;border-radius:6px;background:#fff;color:#3A3A3A;padding:6px 10px;cursor:pointer}.skSource button[aria-pressed="true"]{border-color:var(--skP);color:var(--skP);font-weight:700}.skSource span{flex-basis:100%;color:#595959}.skDl a[aria-disabled="true"]{opacity:.5;cursor:not-allowed}.skCustom{padding:14px;border:1px solid #D9D9D9;border-radius:6px;font-size:13px;line-height:1.6}.skCustom p{margin:6px 0 12px}';document.head.appendChild(s);}
 root.style.setProperty('--skP','#'+(t?t.sc.acc[0]:'595959'));
 root.innerHTML=`<div class="skW"><h2>PPT 範本 Style Kit<small>Template Style Kit · 快速樣式＋螢光筆，下載即用</small></h2>
 <p class="skLead">選一個主題 → 下面預覽就是 PowerPoint〔常用 › 繪圖 › 快速樣式〕會出現的 7×6 樣式與柔和螢光筆。確認後下載 .pptx：佈景主題色彩與 fmtScheme 已內嵌，每一頁的快速樣式都是這組顏色；內含 Style Kit 範例頁，可直接用格式刷取用。<br>Pick a theme → preview the real Quick Styles gallery &amp; soft highlighters → download a .pptx with the theme embedded.</p>
 ${sourceControls(t)}<div class="skTh" id="skThemes" role="tablist" aria-label="選擇獨立範本">${T.map(x=>`<button data-sk="${x.id}" class="${t&&x.id===t.id?'on':''}" role="tab" aria-selected="${!!t&&x.id===t.id}"><i>${x.sc.acc.slice(0,3).map(c=>`<b style="background:#${c}"></b>`).join('')}</i>${esc(x.zh)}<small class="skCr">${skCR(x.sc.acc[0])}:1</small></button>`).join('')}</div>
 ${t?'<div class="skSec">對比值 Contrast<small>與白底比（WCAG）；文字需 ≥ 4.5:1</small></div>'+skCT(t):customNotice()}
 <div class="skDl" id="skDl">${downloadLink(t,'pptx','⬇ 下載 .pptx'+(t?'（'+esc(t.zh)+'）':''),true)}${downloadLink(t,'potx','⬇ 範本 .potx（另存成我的範本）',true)}<button type="button" class="skApply" id="skApply"${t?'':' disabled'}>🎨 一鍵套用到元件庫（全部元件改成這組色）</button>${downloadLink(t,'xml','色彩 .xml')}
 <small>.pptx：直接開啟使用（4 頁：封面、內容、Style Kit 頁、快速樣式預覽頁）｜.potx：存成個人範本（%APPDATA%\\Microsoft\\Templates）｜.xml：只換色彩，放到 …\\Document Themes\\Theme Colors，套在公司範本上不動母片／Logo</small></div>
 ${t?'<div class="skSec">快速樣式 Quick Styles<small>常用 › 繪圖 › 快速樣式（Home › Drawing › Quick Styles）· 7 欄 × 6 列</small></div>'+gallery(t)+'<div class="skSec">Style Kit 頁<small>Style Kit sample slide · 格式刷取用（雙擊格式刷可連續刷）</small></div><div class="skK">'+kit(t)+'</div>':''}
 <p class="skNote">限制：網頁預覽依主題色＋fmtScheme 以 HTML 模擬，與 PowerPoint 實際渲染可能有 1–2 px 線寬／漸層差異；柔和螢光筆是自訂 srgb 色，PowerPoint 的螢光筆選單選不到，只能格式刷／複製；只套色彩 .xml 時，快速樣式的陰影／漸層沿用原範本 fmtScheme。<br>Limits: HTML approximation of PowerPoint rendering; custom highlighter colors are only reachable via Format Painter.</p></div>`;
 root.querySelector('#skApply').onclick=()=>{if(t)document.dispatchEvent(new CustomEvent('stylekit-apply',{detail:{id:t.id,acc:t.sc.acc.slice()}}));};
 root.querySelector('#skFollow').onclick=()=>selectSource('follow',root);
 root.querySelector('#skIndependent').onclick=()=>selectSource('independent',root);
 root.querySelector('#skThemes').onclick=e=>{const b=e.target.closest('button[data-sk]');if(b)selectTheme(b.dataset.sk,root);};
 root.querySelectorAll('[data-stylekit-file]').forEach(a=>{a.onclick=e=>{
  const latest=state();if(!latest.downloadable||latest.id!==t.id||latest.source!==a.dataset.stylekitSource){e.preventDefault();return;}
  // The host can synchronously share its export lock without fetching assets:
  // this keeps both relative file:// links and bundled Blob URLs functional.
  const request=new CustomEvent('stylekit-download',{cancelable:true,detail:{theme:t.id,format:/\.potx$/.test(a.dataset.stylekitFile)?'potx':/\.xml$/.test(a.dataset.stylekitFile)?'xml':'pptx',file:a.dataset.stylekitFile,href:a.href,download:a.download,source:latest.source,validation:'build-time-package'}});
  if(!document.dispatchEvent(request))e.preventDefault();
 }});
 return state();}
window.StyleKit={render,sync,selectSource,selectTheme,state,themes:T,current:()=>cur,lum,cell};
})();
