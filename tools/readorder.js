// 變體字母閱讀順序：同一列（垂直範圍重疊 >50%）的兩個元件，左邊的字母必須在前
function readOrder(s){const gs=s.groups||[];const caps=s.items.filter(i=>i.runs&&/^[A-Z]｜/.test(i.runs.map(r=>r.t).join(''))).map(i=>{const c={L:i.runs.map(r=>r.t).join('')[0],x:i.x,y:i.y};let best=null,bd=9;gs.forEach(g=>{const d=c.y-(g.y+g.h);if(c.x>=g.x-.35&&c.x<=g.x+g.w&&d>-.25&&d<bd){bd=d;best=g;}});c.g=best;return c;}).filter(c=>c.g);
 const Ls=caps.map(c=>c.L).sort().join('');if(Ls!=='ABCDEFGHIJKL'.slice(0,Ls.length))return [];
 const out=[];for(const a of caps)for(const b of caps){if(a===b||a.L>=b.L)continue;const A=a.g,B=b.g;const ov=Math.min(A.y+A.h,B.y+B.h)-Math.max(A.y,B.y);if(ov>.5*Math.min(A.h,B.h)&&A.x>B.x+B.w*.5)out.push(a.L+' 在 '+b.L+' 右邊');}
 return out;}
// 灰字標籤（非元件說明、非標題）下方或旁邊 0.6 吋內必須有圖形
function orphanLabels(s){const out=[];const its=s.items;const GREY=/^(6E6E6E|7F7F7F|808080|8C8C8C|A6A6A6|595959|767171)$/i;
 const isG=q=>q.t==='sp'&&q.runs&&!q.fill&&!q.line&&GREY.test((q.runs[0].o||{}).color||'')&&!(q.runs[0].o||{}).bold;
 its.forEach((it,k)=>{if(!isG(it))return;const t=it.runs.map(r=>r.t).join('').trim();if(!t||t.length>16||/^[A-Z]｜/.test(t))return;if(((it.runs[0].o||{}).size||12)>10.5)return;if(it.y<1.7||it.y>6.85)return;
  const near=its.some((q,j)=>{if(j===k||isG(q))return false;if(q.t!=='ln'&&q.y+(q.h||0)<1.65)return false;let b;if(q.t==='ln')b={x:Math.min(q.x1,q.x2),y:Math.min(q.y1,q.y2),w:Math.abs(q.x2-q.x1),h:Math.abs(q.y2-q.y1)};else if(q.t==='sp'&&q.runs&&!q.fill&&!q.line){if(!q.runs.map(r=>r.t).join('').trim())return false;b=q;}else b=q;
   if(b.w>3.2&&q.t!=='tbl'&&q.t!=='pic'&&!(q.t==='sp'&&q.runs&&!q.fill&&!q.line))return false;
   const dx=Math.max(0,Math.max(b.x,it.x)-Math.min(b.x+b.w,it.x+it.w)),dy=Math.max(0,Math.max(b.y,it.y)-Math.min(b.y+b.h,it.y+it.h));return (dx<.05&&dy<.6)||(dy<.02&&dx<.8);});
  if(!near)out.push(t);});return out;}
module.exports={readOrder,orphanLabels};
