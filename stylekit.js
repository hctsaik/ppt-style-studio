/* Style Kit: independent theme/palette choices, editable rectangle preview,
   and native-stylekit/{theme,common}/<id>.* static downloads.
   native-styles.js defines common accents/highlights. Single-file assets use
   the same full paths as STYLEKIT_B64 keys. */
(function(){
const T=window.STYLEKIT_THEMES||[];const W='FFFFFF',N=window.NativeStyles;
const hx=c=>[0,2,4].map(i=>parseInt(c.slice(i,i+2),16));
const toHex=a=>a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();
const mix=(a,b,t)=>{const x=hx(a),y=hx(b);return toHex(x.map((v,i)=>v+(y[i]-v)*t));};
// DrawingML lumMod/lumOff（HSL 亮度）
function lum(c,mod,off){let[r,g,b]=hx(c).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;
 if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6;}
 l=Math.min(1,l*mod+off);const f=(p,q,t)=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};
 if(!s)return toHex([l,l,l].map(v=>v*255));const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return toHex([f(p,q,h+1/3),f(p,q,h),f(p,q,h-1/3)].map(v=>v*255));}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Same effect description as the native formatting matrix; geometry is not a Ribbon style.
const ROWS=N.KIT_EFFECTS.map(e=>[e.label,e.en]);
function cell(c,i,t){const sc=t?t.sc:{dk1:'000000',lt1:'FFFFFF'},e=N.kitEffect(c,i,sc.dk1,sc.lt1,sc.dk2||sc.dk1),sh=e.shadow;return{bg:'#'+e.backgrounds[0],bd:e.line?(e.lineWidth*4/3)+'px solid #'+e.lineColor:'0',fg:'#'+e.foreground,sh:sh?'0 '+(sh.offset*4/3)+'px '+(sh.blur*4/3)+'px rgba(0,0,0,'+sh.alpha+')':null,radius:e.radius*4/3,bold:e.bold,text:e.text};}
function gallery(t){const cols=[t.sc.dk1].concat(t.sc.acc),names=['Text1 / 深色1'].concat(t.sc.acc.map((_,i)=>'Accent '+(i+1)+(choice.paletteSource==='common'?' / '+N.COMMON[i].label:'')));
 let h='<div class="skG" id="skGal" role="region" aria-label="快速樣式七欄目錄，可左右捲動" tabindex="0"><div></div>'+cols.map((c,j)=>`<div class="skCh">${names[j]}<br><code>#${c}</code></div>`).join('');
 ROWS.forEach((r,i)=>{h+=`<div class="skRh">${r[0]}<small>${r[1]}</small></div>`+cols.map((c,j)=>{const s=cell(c,i,t);return `<div class="skQ" data-r="${i}" data-c="${j}" style="background:${s.bg};border:${s.bd};color:${s.fg};border-radius:${s.radius}px;font-weight:${s.bold?700:400};${s.sh?'box-shadow:'+s.sh:''}">${s.text}</div>`;}).join('');});
 return h+'</div><p class="skHelp" id="skWhiteNote"><span class="skSample skWhite"><span style="display:inline-block;background:#FFFFFF;color:#333333;padding:3px 12px">白色</span></span> #FFFFFF 另附可編輯白色形狀，見下載檔的螢光筆範例頁；不是第七個 Accent，也不取代 Text1。</p>';}
function kit(t){const sc=t.sc;
 const hl=N.HIGHLIGHTS.map(({label,color})=>`<div class="skHl" data-color="${color}"><span class="n">${label}</span><span class="skSample"><span class="t" style="background:#${color};color:#333333">Yield improved 良率提升</span></span><code>#${color}</code></div>`).join('');
 return `<div class="skCard"><h4>① 八色文字螢光筆 <small>原生文字醒目提示（a:highlight）</small></h4><div id="skHls">${hl}</div><p class="skHelp">下載檔已套用真正文字高亮，改字會隨文字延伸；沒有獨立底帶。參考藍固定 #7C9CC3；深灰與深藍可自行搭配白字，套用色彩不會自動修改文字顏色。這八色不隨主題切換，也不取代 PowerPoint 內建 15 色選單。</p></div>
 <div class="skCard"><h4>② 佈景主題色彩 <small>Theme colors（設計 › 變化 › 色彩）</small></h4><div class="skSw">${[['深色1',sc.dk1],['淺色1',sc.lt1],['深色2',sc.dk2],['淺色2',sc.lt2]].concat(sc.acc.map((c,i)=>['輔色'+(i+1),c])).concat([['超連結',sc.hlink],['已瀏覽',sc.fol]]).map(([n,c])=>`<span><i style="background:#${c}"></i>${n}<code>#${c}</code></span>`).join('')}</div></div>`;}
const B64=()=>window.STYLEKIT_B64||null;const urls={};
function href(f){const b=B64();if(!b||!b[f])return f;if(urls[f])return urls[f];
 const bin=atob(b[f]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
 const mime=/\.xml$/.test(f)?'application/xml':/\.potx$/.test(f)?'application/vnd.openxmlformats-officedocument.presentationml.template':'application/vnd.openxmlformats-officedocument.presentationml.presentation';
 return urls[f]=URL.createObjectURL(new Blob([u],{type:mime}));}
const CSS=`#vKit .skCr{display:block;font-size:10px;color:#595959;font-weight:400}#vKit .skCt{display:flex;flex-wrap:wrap;gap:6px 18px;margin:4px 0 10px;font-size:12px;color:#333}#vKit .skCt b{display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:-2px;margin-right:6px;border:1px solid #ddd}#vKit .skCt em{font-style:normal;font-weight:600}#vKit .skCt .ok{color:#2E7D4F}#vKit .skCt .mid{color:#7A5A00}#vKit .skCt .no{color:#9A3A3A}#vKit{background:#fff;overflow:auto;padding:18px 22px 40px}#vKit .skW{width:100%;min-width:0;max-width:1180px;margin:0 auto;color:#3A3A3A}
#vKit h2{font-size:20px;margin:0 0 2px;color:#222}#vKit h2 small{font-size:12px;color:#8C8C8C;font-weight:400;margin-left:8px}
#vKit .skLead{font-size:12.5px;color:#595959;margin:4px 0 14px;line-height:1.6}
.skTh{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}.skTh button{border:1px solid #D9D9D9;background:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12.5px;display:flex;align-items:center;gap:6px;color:#3A3A3A}
.skTh button i{width:22px;height:12px;border-radius:2px;display:inline-flex;overflow:hidden}.skTh button i b{flex:1}.skTh button.on{border-color:var(--skP);box-shadow:inset 0 0 0 1px var(--skP);font-weight:700;color:var(--skP)}
.skDl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 16px;padding:12px 14px;border:1px solid #E5E5E5;border-left:4px solid var(--skP);border-radius:6px}
.skDl a{text-decoration:none;font-size:13px;border:1px solid #D9D9D9;border-radius:7px;padding:7px 12px;color:#3A3A3A}.skDl a.pri{background:var(--skP);border-color:var(--skP);color:#fff;font-weight:700}.skDl .skApply{font-size:13px;border:1px solid var(--skP);background:#fff;color:var(--skP);border-radius:7px;padding:7px 12px;font-weight:700;cursor:pointer}.skDl .skApply:hover{background:#EEF3FA}.skDl small{color:#8C8C8C;font-size:11.5px;flex-basis:100%}
.skSec{font-size:14px;font-weight:700;color:var(--skP);border-bottom:1.5px solid var(--skP);padding-bottom:4px;margin:18px 0 10px}.skSec small{color:#8C8C8C;font-weight:400;margin-left:6px;font-size:11.5px}
.skG{display:grid;min-width:0;max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;grid-template-columns:150px repeat(7,minmax(56px,1fr));gap:8px 10px;align-items:center}.skCh{font-size:10.5px;color:#8C8C8C;text-align:center;line-height:1.3}.skCh code{font-size:10px}
.skRh{font-size:12px;font-weight:700;color:#595959;line-height:1.25}.skRh small{display:block;font-weight:400;color:#8C8C8C;font-size:10.5px}
.skQ{height:40px;border-radius:0;display:flex;align-items:center;justify-content:center;font:600 13px Arial,'Microsoft JhengHei',sans-serif;box-sizing:border-box}
.skK{display:grid;min-width:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.skCard{min-width:0;border:1px solid #E5E5E5;border-radius:6px;padding:12px 14px}.skCard h4{margin:0 0 8px;font-size:13.5px;color:var(--skP)}.skCard h4 small{display:block;color:#8C8C8C;font-weight:400;font-size:11px;margin-top:2px}
.skHl{display:flex;flex-wrap:wrap;min-width:0;align-items:center;gap:8px;margin:5px 0;font-size:13.5px}.skHl .n{color:#8C8C8C;font-size:11px;width:38px}.skHl .t{min-width:0;overflow-wrap:anywhere;font-weight:700;padding:1px 3px}.skHl code,.skSw code{color:#8C8C8C;font-size:10.5px}
.skE{margin:8px 0;font-size:14px}.skE small{display:block;color:#8C8C8C;font-size:10.5px;margin-top:1px}.skFt{font-size:11px;color:#8C8C8C;border-top:1px solid #BFBFBF;padding-top:6px}
.skSample{padding:2px 3px;display:inline-block}.skWhite{background:#303640;border-radius:3px}.skHelp{font-size:11.5px;color:#595959;line-height:1.6}.skApply:disabled{opacity:.5;cursor:not-allowed}
.skSw{display:grid;min-width:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 10px;font-size:12px}.skSw span{display:flex;min-width:0;flex-wrap:wrap;align-items:center;gap:6px}.skSw i{width:16px;height:16px;border-radius:3px;border:1px solid #0001;flex:none}
.skNote{font-size:11.5px;color:#8C8C8C;line-height:1.7;margin-top:16px}
#vKit .skW h2,#vKit .skLead,#vKit .skNote,#vKit .skDl small,#vKit .skSource span{min-width:0;overflow-wrap:anywhere}#vKit .skDl a,#vKit .skDl .skApply{max-width:100%;white-space:normal;overflow-wrap:anywhere}.skG:focus-visible{outline:2px solid var(--skP);outline-offset:2px}
@media(max-width:820px){.skK{grid-template-columns:1fr}.skG{grid-template-columns:70px repeat(7,minmax(56px,1fr));gap:5px}.skQ{height:30px;font-size:10px}.skCh{font-size:8.5px}.skRh small{display:none}.skRh{font-size:10px}}`;
// A Kit choice has a source. An explicit template selection must survive a
// visit to another tab, while the default follows the current Studio palette.
const STORE='ppt-studio-stylekit-v1',PALETTE_KEYS=['P','PD','PT','A','ink','t2','mute','line','l2','fill'];
let choice={source:'follow',id:null,paletteSource:'common'},globalPalette=null,cur=null;
// Keep valid legacy choices on the former theme palette; new state uses common.
try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved&&['follow','independent'].includes(saved.source)&&(saved.source==='follow'||T.some(t=>t.id===saved.id)))choice={source:saved.source,id:saved.source==='independent'?saved.id:null,paletteSource:saved.paletteSource==='common'?'common':'theme'};}catch(_){}
const hex=c=>typeof c==='string'?c.replace(/^#/,'').toUpperCase():c;
function storeChoice(){try{localStorage.setItem(STORE,JSON.stringify(choice));}catch(_){}}
function matchGlobal(p){
 if(!p)return null;
 const D=window.Deck,known=D&&(D.PRESETS||[]).find(x=>{const full=Object.assign({},D.BASE,x);return PALETTE_KEYS.every(k=>hex(p[k])===hex(full[k]));});
 // Validate actual asset slots as well as the palette; matching a preset id
 // alone would silently serve an old/static file after a custom color edit.
 return known?T.find(t=>hex(t.sc.acc[0])===hex(p.P)&&hex(t.sc.dk2)===hex(p.PD)&&hex(t.sc.acc[4])===hex(p.PD)&&hex(t.sc.acc[1])===hex(p.A))||null:null;
}
function selectedTheme(){if(choice.source==='independent')return T.find(t=>t.id===choice.id)||T[0];const matched=matchGlobal(globalPalette&&globalPalette.params);return matched||(choice.paletteSource==='common'?(T.find(t=>t.id===(globalPalette&&globalPalette.base))||T[0]):null);}
function exportTheme(t){if(!t)return null;const acc=choice.paletteSource==='common'?N.COMMON.slice(0,6).map(c=>c.color):t.sc.acc.slice();return Object.assign({},t,{sc:Object.assign({},t.sc,{acc,hl:N.HIGHLIGHTS.map(c=>c.color)})});}
function state(){const t=selectedTheme();return{source:choice.source,paletteSource:choice.paletteSource,id:t?t.id:null,downloadable:!!t,base:globalPalette&&globalPalette.base||null};}
function sync(params,base,root){globalPalette={params:Object.assign({},params),base:base||null};return paint(root);}
function selectSource(source,root){if(!['follow','independent'].includes(source))return state();if(source==='follow')choice.source='follow';else{choice=Object.assign({},choice,{source:'independent',id:(selectedTheme()||T.find(t=>t.id===choice.id)||T[0]).id});}storeChoice();return paint(root);}
function selectTheme(id,root){if(!T.some(t=>t.id===id))return;choice=Object.assign({},choice,{source:'independent',id});storeChoice();return paint(root);}
function selectPalette(source,root){if(!['theme','common'].includes(source))return state();choice.paletteSource=source;storeChoice();return paint(root);}
function sourceControls(t){const common=choice.paletteSource==='common';return `<div class="skSource" role="group" aria-label="範本來源"><button type="button" id="skFollow" aria-pressed="${choice.source==='follow'}">跟隨全站配色</button><button type="button" id="skIndependent" aria-pressed="${choice.source==='independent'}">獨立範本</button><span id="skSourceStatus" role="status">${choice.source==='independent'?'目前使用獨立範本：'+esc(t.zh)+'；全站改色不會覆蓋這項選擇。':common?'使用全站對應範本：'+esc(t.zh)+'；常用六色固定，其他色槽沿用範本，未套入全站自訂色。':t?'已跟隨全站內建配色：'+esc(t.zh)+'。':'目前是自訂配色，尚無對應的靜態 Style Kit 範本。'}</span></div><div class="skSource" role="group" aria-label="匯出配色來源"><button type="button" id="skPaletteTheme" aria-pressed="${!common}">主題色</button><button type="button" id="skPaletteCommon" aria-pressed="${common}">常用色</button><span id="skPaletteStatus" role="status">${common?'本次匯出：Accent 1–6 為紅、黃、藍、綠、灰、紫；白色另提供。':'本次匯出：Accent 1–6 使用所選範本的主題色。'} Text1／深色1 保留原值。此選擇決定下載檔的一套配色，不會增加第二組 PowerPoint 快速樣式選單。</span></div>`;}
function downloadLink(t,kind,label,primary){const ext=kind==='xml'?'_colors.xml':'.'+kind,file=t?'native-stylekit/'+choice.paletteSource+'/'+t.id+ext:'',fn='PPT Template Style Kit - '+(t?t.zh:'自訂配色')+' - '+(choice.paletteSource==='common'?'常用色':'主題色');return `<a${primary?' class="pri"':''} id="sk${kind==='pptx'?'Pptx':kind==='potx'?'Potx':'Xml'}" ${t?`href="${href(file)}" download="${esc(fn)}.${kind}" data-stylekit-file="${file}" data-stylekit-theme="${t.id}" data-stylekit-source="${choice.source}" data-stylekit-palette-source="${choice.paletteSource}"`:'aria-disabled="true" tabindex="-1"'}>${label}</a>`;}
function customNotice(){const p=globalPalette&&globalPalette.params||{};return `<div class="skCustom" id="skCustomNotice"><strong>自訂色尚未提供 Style Kit 範本下載</strong><p>這裡不會用舊範本代替目前配色。請選下方獨立範本，或切回全站內建配色。元件庫的預覽與匯出仍可使用自訂色。</p><div class="skSw">${[['主色 P',p.P],['深色 PD',p.PD],['淺色 PT',p.PT],['強調色 A',p.A]].filter(([,c])=>/^[0-9A-F]{6}$/.test(hex(c)||'')).map(([n,c])=>`<span><i style="background:#${hex(c)}"></i>${n}<code>#${hex(c)}</code></span>`).join('')}</div></div>`;}
function skL(h){const c=[0,2,4].map(k=>parseInt(h.slice(k,k+2),16)/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function skCR(a,b){const x=skL(a),y=skL(b||'FFFFFF');return ((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(1);}
function skCT(t){const R=[['Accent 1',t.sc.acc[0]],['Accent 2',t.sc.acc[1]],['Accent 5',t.sc.acc[4]],['說明 #595959','595959'],['柔和 H1',t.sc.hl[0]]];return '<div class="skCt" id="skCt">'+R.map(([n,c])=>{const r=+skCR(c);const ok=r>=4.5,mid=r>=3;return `<span><b style="background:#${c}"></b>${n} #${c}　<em class="${ok?'ok':mid?'mid':'no'}">${r}:1 ${ok?'✓ 可當字色':mid?'◐ 只用大字／圖形':'✕ 只當底色'}</em></span>`;}).join('')+'</div>';}
// Retain the public render(id) API for explicit standalone Kit consumers.
function render(id,root){if(id)return selectTheme(id,root);return paint(root);}
function paint(root){root=root||document.getElementById('vKit');if(!root||!T.length)return;const t=exportTheme(selectedTheme());cur=t?t.id:null;
 if(!document.getElementById('skCss')){const s=document.createElement('style');s.id='skCss';s.textContent=CSS;document.head.appendChild(s);}
 if(!document.getElementById('skSourceCss')){const s=document.createElement('style');s.id='skSourceCss';s.textContent='.skSource{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0;font-size:12px}.skSource button{border:1px solid #D9D9D9;border-radius:6px;background:#fff;color:#3A3A3A;padding:6px 10px;cursor:pointer}.skSource button[aria-pressed="true"]{border-color:var(--skP);color:var(--skP);font-weight:700}.skSource span{flex-basis:100%;color:#595959}.skDl a[aria-disabled="true"]{opacity:.5;cursor:not-allowed}.skCustom{padding:14px;border:1px solid #D9D9D9;border-radius:6px;font-size:13px;line-height:1.6}.skCustom p{margin:6px 0 12px}';document.head.appendChild(s);}
 root.style.setProperty('--skP','#'+(t?t.sc.acc[0]:'595959'));
 root.innerHTML=`<div class="skW"><h2>PPT 範本 Style Kit<small>Template Style Kit · 快速樣式＋螢光筆，下載即用</small></h2>
 <p class="skLead">十款矩形樣式對齊元件總覽，前三款優先提供外層白卡：深灰框柔影、細灰框柔影、主色框柔影；其餘為線框、淺底及實心強調。選擇「主題色」或「常用色」決定下載配色。灰框、灰底及中性深字保留各自角色；螢光筆使用獨立固定八色。</p>
 ${sourceControls(t)}<div class="skTh" id="skThemes" role="tablist" aria-label="選擇獨立範本">${T.map(x=>`<button data-sk="${x.id}" class="${t&&x.id===t.id?'on':''}" role="tab" aria-selected="${!!t&&x.id===t.id}"><i>${x.sc.acc.slice(0,3).map(c=>`<b style="background:#${c}"></b>`).join('')}</i>${esc(x.zh)}<small class="skCr">${skCR(x.sc.acc[0])}:1</small></button>`).join('')}</div>
 ${t?'<div class="skSec">對比值 Contrast<small>與白底比（WCAG）；文字需 ≥ 4.5:1</small></div>'+skCT(t):customNotice()}
 <div class="skDl" id="skDl">${downloadLink(t,'pptx','⬇ 下載 .pptx'+(t?'（'+esc(t.zh)+'）':''),true)}${downloadLink(t,'potx','⬇ 範本 .potx',true)}<button type="button" class="skApply" id="skApply"${t&&choice.paletteSource==='theme'?'':' disabled'}>套用主題色到元件庫</button>${downloadLink(t,'xml','色彩 .xml')}
 <small>.pptx／.potx 為獨立 5 頁 Style Kit：封面、內容、八色原生螢光筆與白色形狀、兩頁共 70 格矩形樣式。不會增加「投影片母片」主下載的頁數。常用色模式不改元件庫配色。</small><small>.xml 只提供色彩集；手動套用會改變使用主題色的內容，效果仍依原檔 fmtScheme。請先在副本確認。</small></div>
 ${t?'<div class="skSec">快速樣式 · 可編輯矩形<small>Text1 ＋ Accent 1–6 · 7 欄 × 10 款矩形；前三款是外層卡片，不是 Ribbon 的十個固定按鈕</small></div>'+gallery(t)+'<div class="skSec">螢光筆與白色範例<small>包含於上述獨立 Style Kit 下載</small></div><div class="skK">'+kit(t)+'</div>':''}
 <p class="skNote">限制：網頁以 HTML 示意十款矩形；細框、填色與柔影使用 Style Kit 主題矩陣與個別形狀設定。70 格範例字色已作對比調整；Ribbon 的固定組合與字色不保證逐格相同。這不會新增任意 Ribbon 選項，也不會改變所選圖形的幾何。下載檔的文字高亮使用 a:highlight；柔色也寫入近期色，但無法保證各版 PowerPoint 的螢光筆選單會顯示或永久保留，不會替換內建 15 色。可複製已套色文字再改字；格式刷操作尚未驗證，且可能連帶套用字型、字級。白色形狀保留 #FFFFFF，不列入螢光筆近期色。</p></div>`;
 root.querySelector('#skApply').onclick=()=>{if(t&&choice.paletteSource==='theme')document.dispatchEvent(new CustomEvent('stylekit-apply',{detail:{id:t.id,acc:t.sc.acc.slice()}}));};
 root.querySelector('#skFollow').onclick=()=>selectSource('follow',root);
 root.querySelector('#skIndependent').onclick=()=>selectSource('independent',root);
 root.querySelector('#skPaletteTheme').onclick=()=>selectPalette('theme',root);
 root.querySelector('#skPaletteCommon').onclick=()=>selectPalette('common',root);
 root.querySelector('#skThemes').onclick=e=>{const b=e.target.closest('button[data-sk]');if(b)selectTheme(b.dataset.sk,root);};
 root.querySelectorAll('[data-stylekit-file]').forEach(a=>{a.onclick=e=>{
  const latest=state();if(!latest.downloadable||latest.id!==t.id||latest.source!==a.dataset.stylekitSource||latest.paletteSource!==a.dataset.stylekitPaletteSource){e.preventDefault();return;}
  // The host can synchronously share its export lock without fetching assets:
  // this keeps both relative file:// links and bundled Blob URLs functional.
  const request=new CustomEvent('stylekit-download',{cancelable:true,detail:{theme:t.id,format:/\.potx$/.test(a.dataset.stylekitFile)?'potx':/\.xml$/.test(a.dataset.stylekitFile)?'xml':'pptx',file:a.dataset.stylekitFile,href:a.href,download:a.download,source:latest.source,paletteSource:latest.paletteSource,validation:'build-time-package'}});
  if(!document.dispatchEvent(request))e.preventDefault();
 }});
 return state();}
window.StyleKit={render,sync,selectSource,selectTheme,selectPalette,state,themes:T,current:()=>cur,lum,cell};
})();
