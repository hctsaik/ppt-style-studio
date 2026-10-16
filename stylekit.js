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
const CSS=`#vKit{background:#fff;overflow:auto;padding:18px 22px 40px}#vKit .skW{max-width:1180px;margin:0 auto;color:#3A3A3A}
#vKit h2{font-size:20px;margin:0 0 2px;color:#222}#vKit h2 small{font-size:12px;color:#8C8C8C;font-weight:400;margin-left:8px}
#vKit .skLead{font-size:12.5px;color:#595959;margin:4px 0 14px;line-height:1.6}
.skTh{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}.skTh button{border:1px solid #D9D9D9;background:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12.5px;display:flex;align-items:center;gap:6px;color:#3A3A3A}
.skTh button i{width:22px;height:12px;border-radius:2px;display:inline-flex;overflow:hidden}.skTh button i b{flex:1}.skTh button.on{border-color:var(--skP);box-shadow:inset 0 0 0 1px var(--skP);font-weight:700;color:var(--skP)}
.skDl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 16px;padding:12px 14px;border:1px solid #E5E5E5;border-left:4px solid var(--skP);border-radius:6px}
.skDl a{text-decoration:none;font-size:13px;border:1px solid #D9D9D9;border-radius:7px;padding:7px 12px;color:#3A3A3A}.skDl a.pri{background:var(--skP);border-color:var(--skP);color:#fff;font-weight:700}.skDl small{color:#8C8C8C;font-size:11.5px;flex-basis:100%}
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
let cur=null;
function render(id,root){root=root||document.getElementById('vKit');if(!root||!T.length)return;const t=T.find(x=>x.id===id)||T.find(x=>x.id===cur)||T[0];cur=t.id;
 if(!document.getElementById('skCss')){const s=document.createElement('style');s.id='skCss';s.textContent=CSS;document.head.appendChild(s);}
 root.style.setProperty('--skP','#'+t.sc.acc[0]);const fn='PPT Template Style Kit - '+t.zh;
 root.innerHTML=`<div class="skW"><h2>PPT 範本 Style Kit<small>Template Style Kit · 快速樣式＋螢光筆，下載即用</small></h2>
 <p class="skLead">選一個主題 → 下面預覽就是 PowerPoint〔常用 › 繪圖 › 快速樣式〕會出現的 7×6 樣式與柔和螢光筆。確認後下載 .pptx：佈景主題色彩與 fmtScheme 已內嵌，每一頁的快速樣式都是這組顏色；內含 Style Kit 範例頁，可直接用格式刷取用。<br>Pick a theme → preview the real Quick Styles gallery &amp; soft highlighters → download a .pptx with the theme embedded.</p>
 <div class="skTh" id="skThemes" role="tablist">${T.map(x=>`<button data-sk="${x.id}" class="${x.id===t.id?'on':''}" role="tab" aria-selected="${x.id===t.id}"><i>${x.sc.acc.slice(0,3).map(c=>`<b style="background:#${c}"></b>`).join('')}</i>${esc(x.zh)}</button>`).join('')}</div>
 <div class="skDl" id="skDl"><a class="pri" id="skPptx" href="${href(t.id+'.pptx')}" download="${esc(fn)}.pptx">⬇ 下載 .pptx（${esc(t.zh)}）</a><a id="skPotx" href="${href(t.id+'.potx')}" download="${esc(fn)}.potx">範本 .potx</a><a id="skXml" href="${href(t.id+'_colors.xml')}" download="${esc(fn)}.xml">色彩 .xml</a>
 <small>.pptx：直接開啟使用（4 頁：封面、內容、Style Kit 頁、快速樣式預覽頁）｜.potx：存成個人範本（%APPDATA%\\Microsoft\\Templates）｜.xml：只換色彩，放到 …\\Document Themes\\Theme Colors，套在公司範本上不動母片／Logo</small></div>
 <div class="skSec">快速樣式 Quick Styles<small>常用 › 繪圖 › 快速樣式（Home › Drawing › Quick Styles）· 7 欄 × 6 列</small></div>${gallery(t)}
 <div class="skSec">Style Kit 頁<small>Style Kit sample slide · 格式刷取用（雙擊格式刷可連續刷）</small></div><div class="skK">${kit(t)}</div>
 <p class="skNote">限制：網頁預覽依主題色＋fmtScheme 以 HTML 模擬，與 PowerPoint 實際渲染可能有 1–2 px 線寬／漸層差異；柔和螢光筆是自訂 srgb 色，PowerPoint 的螢光筆選單選不到，只能格式刷／複製；只套色彩 .xml 時，快速樣式的陰影／漸層沿用原範本 fmtScheme。<br>Limits: HTML approximation of PowerPoint rendering; custom highlighter colors are only reachable via Format Painter.</p></div>`;
 root.querySelector('#skThemes').onclick=e=>{const b=e.target.closest('button[data-sk]');if(b)render(b.dataset.sk,root);};}
window.StyleKit={render,themes:T,current:()=>cur,lum,cell};
})();
