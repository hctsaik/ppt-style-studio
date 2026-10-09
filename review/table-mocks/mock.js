// 三個方向的快速 mock（只用來比較版面與操作流程；表格本身用真正的 deck.js 引擎畫）
const S=window.SAMPLES,D=window.Deck,p=Object.assign({},D.PRESETS.find(x=>x.id==='navy'));
const svg=(look,sk,o)=>D.toSvg(D.buildModel(Object.assign({},p,{tbLook:look},o||{}),{table:S[sk]}).slides[0],{id:look+sk+Math.random().toString(36).slice(2,6)});
window.render=function(which){const app=document.getElementById('app');
 if(which==='A'){app.innerHTML=`<div class="top"><b>表格</b><span class="paste ok">✓ 已貼上 7 列 × 6 欄　<small>自動判斷：表頭列、5 個數字欄、2 個合計列</small></span><span class="sp"></span><button>重新貼上</button></div>
  <div class="hint">① 選一個外觀（用你的資料畫出來）</div>
  <div class="gal">${D.TABLE_LOOKS.map(([k,zh],i)=>`<div class="card${i===0?' on':''}"><div class="th">${svg(k,'fin')}</div><div class="nm">${zh}${i===0?'<em>使用中</em>':''}</div></div>`).join('')}</div>
  <div class="bar"><label>標題 <input value="損益表摘要（示意）"></label><label>強調 <select><option>欄：3Q25</option></select></label><span class="sp"></span><button class="pri">複製到 PowerPoint</button><button>下載 .pptx</button></div>`;}
 if(which==='B'){app.innerHTML=`<div class="top"><b>表格</b><select><option>外觀：細線</option></select><select><option>標準密度</option></select><span class="sp"></span><button class="pri">複製到 PowerPoint</button><button>下載 .pptx</button><button>＋待選</button></div>
  <div class="big">${svg('clean','fin')}<div class="pop" style="left:31.5%;top:31%"><b>3Q25 這一欄</b><button class="on">★ 強調</button><button>B 粗體</button><span class="seg"><button>左</button><button>中</button><button class="on">右</button></span><button>✕</button></div><div class="hl" style="left:33.4%;top:36.7%;width:6.7%;height:41.5%"></div></div>
  <div class="hint">點表格任一欄或列 → 小選單（強調／粗體／對齊）。資料在「編輯資料」抽屜裡。</div>`;}
 if(which==='C'){app.innerHTML=`<div class="top"><b>表格</b><span class="steps"><i class="on">1 選類型</i><i>2 貼資料</i><i>3 設定</i><i>4 輸出</i></span></div>
  <div class="cols"><div class="types">${[['財務摘要','損益表、營收；括號負數、最新一期強調'],['比較表','方案／規格；推薦欄強調、●○ 符號'],['進度／狀態','專案追蹤；完成／進行中／風險上色'],['KPI 表','目標 vs 實際；達成率、▲▼']].map((t,i)=>`<div class="ty${i===2?' on':''}"><b>${t[0]}</b><small>${t[1]}</small></div>`).join('')}
   <div class="form"><label><input type="checkbox" checked> 狀態欄上色</label><label><input type="checkbox" checked> 逾期列標紅</label><label><input type="checkbox"> 顯示負責人頭像</label><label>狀態欄 <select><option>狀態</option></select></label></div></div>
   <div class="prev">${svg('clean','status')}</div></div>`;}};
