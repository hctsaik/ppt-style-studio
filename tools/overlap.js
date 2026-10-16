// 估算每個文字的實際墨跡範圍，找出彼此重疊的文字（全站檢查）
function ext(it){const tx=it.tx||{};const txt=it.runs.map(r=>r.t+(r.o&&r.o.br?'\n':'')).join('');if(!txt.trim())return null;
 const sz=(it.runs[0].o&&it.runs[0].o.size)||tx.size||12;const lines=txt.split('\n');
 const cw=c=>c===' '?.28:/[\u0000-\u00ff]/.test(c)?.52:1;const lw=Math.max(...lines.map(l=>[...l].reduce((a,c)=>a+cw(c),0)))*sz/72;
 const m=tx.margin!=null?(Array.isArray(tx.margin)?tx.margin[0]/72:tx.margin/72):.05;
 const inner=Math.max(.01,it.w-2*m);const nl=lines.reduce((a,l)=>a+Math.max(1,Math.ceil([...l].reduce((s,c)=>s+cw(c),0)*sz/72/(inner*1.1))),0);
 const w=Math.min(lw,inner);let h=nl*sz*1.12/72*(tx.lsp||1);if(/^[“”"'「」『』]$/.test(txt.trim()))h*=.45;
 const x=tx.align==='center'?it.x+(it.w-w)/2:tx.align==='right'?it.x+it.w-m-w:it.x+m;
 const v=tx.valign||'top';const y=v==='middle'?it.y+(it.h-h)/2:v==='bottom'?it.y+it.h-h:it.y+m;
 return {x,y,w,h,txt};}
function overlaps(slide,tol){tol=tol||.03;const E=slide.items.filter(i=>i.runs&&!i.rot).map(i=>({i,e:ext(i),b:i.fill&&i.h<=.45&&i.w<=2.5&&i.kind!=='ellipse'?{x:i.x,y:i.y,w:i.w,h:i.h,txt:'['+i.runs.map(r=>r.t).join('')+']'}:null})).filter(o=>o.e);const out=[];
 for(let a=0;a<E.length;a++)for(let b=a+1;b<E.length;b++){const ia=E[a].i,ib=E[b].i;if(ia.fill&&ib.fill)continue;let p=E[a].e,q=E[b].e;if(!ib.fill&&ia.fill)p=E[a].b||p;if(!ia.fill&&ib.fill)q=E[b].b||q;
  const ox=Math.min(p.x+p.w,q.x+q.w)-Math.max(p.x,q.x),oy=Math.min(p.y+p.h,q.y+q.h)-Math.max(p.y,q.y);
  if(ox>tol&&oy>tol)out.push(p.txt.slice(0,12)+' ⟷ '+q.txt.slice(0,12)+(process.env.OVD?' ['+E[a].i.kind+'/'+E[b].i.kind+' '+[p.x,p.y,p.w,p.h,q.x,q.y,q.w,q.h].map(v=>v.toFixed(2))+']':''));}
 return out;}
module.exports={overlaps,ext};
