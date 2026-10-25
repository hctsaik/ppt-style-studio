/* Export preflight: report facts and advice without changing data or typography.
 * Geometry uses the same inch units and 56-inch ceiling as Deck's exporter.
 * Text-width/line-height estimates are advice, never a measured PowerPoint fact. */
(function(root,factory){
 'use strict';
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./deck.js'));
 else root.Preflight=factory(root.Deck);
})(typeof globalThis!=='undefined'?globalThis:this,function(defaultDeck){
 'use strict';
 const LABELS={ready:'可以匯出',advisory:'建議調整',blocked:'必須修正'};
 const finite=Number.isFinite,hex=c=>typeof c==='string'&&/^[0-9a-f]{6}$/i.test(c);
 const textOf=it=>(it&&it.runs||[]).map(r=>String(r&&r.t||'')+(r&&r.o&&r.o.br?'\n':'')).join('');
 const own=(obj,key)=>obj&&Object.prototype.hasOwnProperty.call(obj,key);
 const itemsOf=sl=>sl&&Array.isArray(sl.items)?sl.items:[];
 function dimension(sl,model,key,legacy,fallback){return own(sl,key)?sl[key]:own(sl,legacy)?sl[legacy]:own(model,legacy)?model[legacy]:fallback;}
 function check(model,options){
  options=options||{};const D=options.deck||defaultDeck,issues=[],seen=new Set(),slides=model&&Array.isArray(model.slides)?model.slides:[];
  const epsilon=.01,smallPt=finite(options.smallTextPt)?options.smallTextPt:10;
  function add(severity,code,si,ii,reason,fix,extra){
   const sl=slides[si],it=sl&&Array.isArray(sl.items)&&sl.items[ii];
   let location=sl?'第 '+(si+1)+' 頁'+(sl.title?'「'+sl.title+'」':''):'整份匯出';
   if(it)location+=' · '+(it.name||('元件 '+(ii+1)));
   if(extra&&Number.isInteger(extra.rowIndex))location+=' · '+(Number.isInteger(extra.sourceRow)?'原始第 '+(extra.sourceRow+1):'第 '+(extra.rowIndex+1))+' 列'+(Number.isInteger(extra.columnIndex)?'／第 '+(extra.columnIndex+1)+' 欄':'');
   const detail=Object.assign({severity,code,slideIndex:sl?si:null,itemIndex:it?ii:null,slideKey:sl&&sl.key||null,location,reason,fix},extra||{});
   const key=[severity,code,si,ii,detail.rowIndex,detail.columnIndex,reason].join('|');if(seen.has(key))return;seen.add(key);issues.push(detail);
  }
  if(!model||!Array.isArray(model.slides)||!slides.length)add('error','EMPTY_DOCUMENT',null,null,'沒有可匯出的頁面。','請先選取頁面或加入素材。');
  // Reuse the exporter guard: source values, native cells, row/page manifests,
  // fixed-width identity and pagination rules have one authoritative validator.
  if(D&&typeof D.assertTableExportComplete==='function'){
   try{D.assertTableExportComplete(model);}catch(error){
    let si=slides.findIndex(sl=>sl&&((sl.table&&sl.table.documentId===error.documentId)||itemsOf(sl).some(it=>it&&it.dataIntegrity&&it.dataIntegrity.documentId===error.documentId)));
    if(!error.documentId)si=slides.findIndex(sl=>sl&&(sl.table||itemsOf(sl).some(it=>it&&it.t==='tbl')));
    const sl=slides[si],ii=sl&&Array.isArray(sl.items)?sl.items.findIndex(it=>it&&it.t==='tbl'&&(!error.documentId||it.dataIntegrity&&it.dataIntegrity.documentId===error.documentId)):-1;
    const tb=sl&&sl.items&&sl.items[ii],extra={validator:'Deck.assertTableExportComplete',validatorReason:error.reason||null};
    if(tb&&tb.dataIntegrity&&Array.isArray(tb.dataIntegrity.displayRows)&&Array.isArray(tb.cells)){
     outer:for(let r=0;r<tb.dataIntegrity.displayRows.length;r++)for(let c=0;c<tb.dataIntegrity.displayRows[r].length;c++){
      if(!tb.cells[r]||!tb.cells[r][c]||textOf(tb.cells[r][c])!==tb.dataIntegrity.displayRows[r][c]){extra.rowIndex=r;extra.columnIndex=c;extra.sourceRow=tb.dataIntegrity.sourceRows&&tb.dataIntegrity.sourceRows[r];break outer;}
     }
    }
    const why=error.code==='TABLE_EXPORT_INCOMPLETE'?error.message:'表格結構無法通過完整性檢查。';
    const fix=/width|寬度/.test((error.reason||'')+' '+why)?'請加寬表格、減少同頁欄數，或改選自動寬度；原始數值不會被改寫。':/56|slide-size/.test((error.reason||'')+' '+why)?'請減少同一張表格的列數，讓投影片寬高不超過 56 吋。':'請返回資料頁確認缺失的列／欄或重新建立這份素材；不要省略原始資料。';
    add('error',error.code||'TABLE_STRUCTURE_INVALID',si,ii,why,fix,extra);
   }
  }else if(slides.some(sl=>sl&&(sl.table||itemsOf(sl).some(it=>it&&it.t==='tbl')))){
   add('error','TABLE_VALIDATOR_UNAVAILABLE',null,null,'表格完整性檢查未載入。','請重新載入工作室後再匯出。');
  }
  slides.forEach((sl,si)=>{
   if(!sl||typeof sl!=='object'||!Array.isArray(sl.items)){add('error','INVALID_SLIDE',si,null,'頁面缺少有效的元件清單。','請重新建立或重新選取這一頁。');return;}
   const width=dimension(sl,model,'w','W',D&&D.W||13.333),height=dimension(sl,model,'h','H',D&&D.H||7.5);
   const validSize=finite(width)&&finite(height)&&width>0&&height>0&&width<=56&&height<=56;
   if(!validSize)add('error','INVALID_SLIDE_SIZE',si,null,'投影片尺寸無效：'+String(width)+' × '+String(height)+' 吋。','請使用大於 0 且不超過 56 吋的寬度與高度。');
   sl.items.forEach((it,ii)=>{
    if(!it||!['sp','ln','pic','tbl'].includes(it.t)){add('error','INVALID_ITEM',si,ii,'元件缺少支援的原生結構。','請重新加入這個元件。');return;}
    const line=it.t==='ln',coords=line?[it.x1,it.y1,it.x2,it.y2]:[it.x,it.y,it.w,it.h];
    if(!coords.every(finite)||!line&&(it.w<=0||it.h<=0)){
     add('error','INVALID_GEOMETRY',si,ii,'元件的座標或尺寸不是有效數值。','請恢復這個元件的尺寸，或重新加入元件。');return;
    }
    if(it.t==='sp'&&Array.isArray(it.points)&&it.points.some(p=>p&&!p.close&&(!finite(p.x)||!finite(p.y))))add('error','INVALID_PATH',si,ii,'圖形路徑含有無效座標。','請重新加入這個圖形。');
    const bounds=line?[Math.min(it.x1,it.x2),Math.min(it.y1,it.y2),Math.max(it.x1,it.x2),Math.max(it.y1,it.y2)]:[it.x,it.y,it.x+it.w,it.y+it.h];
    if(validSize&&(bounds[0]<-epsilon||bounds[1]<-epsilon||bounds[2]>width+epsilon||bounds[3]>height+epsilon)){
     // A transparent text box may extend past an edge while all its glyphs fit.
     // Do not claim those unmeasured glyphs are clipped.
     const transparentText=it.t==='sp'&&!it.kind&&Array.isArray(it.runs)&&bounds[0]<width&&bounds[1]<height&&bounds[2]>0&&bounds[3]>0;
     add(transparentText?'warning':'error',transparentText?'TEXT_BOX_OUTSIDE':'OUTSIDE_SLIDE',si,ii,transparentText?'文字框超出頁面邊界；實際文字是否裁切仍需確認。':'元件的可見範圍超出投影片邊界。','請移回頁面內或調整元件範圍；不會自動縮字。',{bounds});
    }
    const inspectText=(holder,extra)=>{
     if(!holder||!Array.isArray(holder.runs))return;
     if(holder.runs.some(r=>!r||typeof r.t!=='string'||!r.o||typeof r.o!=='object'||own(r.o,'size')&&(!finite(r.o.size)||r.o.size<=0))){add('error','INVALID_TEXT',si,ii,'文字內容或字級結構無效。','請重新輸入這個位置的文字，並選擇有效字級。',extra);return;}
     const nonblank=holder.runs.filter(r=>r.t.trim()),sizes=nonblank.map(r=>r.o.size||holder.tx&&holder.tx.size||holder.size).filter(finite);
     if(sizes.length&&Math.min(...sizes)<smallPt)add('warning','SMALL_TEXT',si,ii,'最小文字為 '+Math.min(...sizes)+' pt，投影時可能不易閱讀。','可加大字級、減少同頁內容或改用單元件匯出。',extra);
     // Contrast is meaningful only when the text's actual solid fill is known.
     // Do not assume transparent text sits on white or flag decorative colours.
     const fill=holder.fill;
     if(D&&D.contrastOf&&hex(fill)&&!(holder.ft>0)){
      const weak=nonblank.filter(r=>hex(r.o.color||holder.color)&&D.contrastOf(r.o.color||holder.color,fill)<((r.o.size||0)>=18||(r.o.bold&&(r.o.size||0)>=14)?3:4.5));
      if(weak.length)add('warning','LOW_CONTRAST',si,ii,'文字與底色的對比偏低。','可調整文字或底色；若為品牌指定色，請自行確認可讀性。',extra);
     }
    };
    inspectText(it);
    if(model.quickStyle&&it.noAutoShrink&&Array.isArray(it.runs)&&D&&D.tw){
     const size=it.tx&&it.tx.size||20,lines=textOf(it).split('\n');
     if(lines.some(line=>D.tw(line,size)>it.w)||lines.length*size*1.2/72>it.h+.01)add('warning','QUICKSTYLE_TEXT_FIT',si,ii,'文字可能需要換行或超出底帶；這是字寬估算。','請縮短文字或手動換行，並在 PowerPoint 確認；字級維持原值，不會自動縮小。');
    }
    if(it.shrunk&&it.shrunk<1)add('warning','EXISTING_TEXT_SHRINK',si,ii,'這段文字已由既有編輯功能縮為原字級的 '+Math.round(it.shrunk*100)+'%。','可縮短文字或加大元件；匯出檢查不會再縮字。');
    if(it.t==='tbl'&&Array.isArray(it.cells)){
     const rows=it.cells.length,columns=Array.isArray(it.colW)?it.colW.length:0;
     if(!rows||!columns||!Array.isArray(it.rowH)||it.rowH.length!==rows||[...it.rowH,...it.colW].some(v=>!finite(v)||v<=0)||it.cells.some(row=>!Array.isArray(row)||row.length!==columns))add('error','INVALID_TABLE_GRID',si,ii,'表格列高、欄寬或儲存格數量不一致。','請恢復表格資料與欄寬，或重新建立表格。');
     it.cells.forEach((row,r)=>Array.isArray(row)&&row.forEach((cell,c)=>inspectText(cell,{rowIndex:r,columnIndex:c,sourceRow:it.dataIntegrity&&it.dataIntegrity.sourceRows&&it.dataIntegrity.sourceRows[r]})));
     if(rows*columns>150)add('warning','DENSE_TABLE',si,ii,'同頁含 '+rows+' 列 × '+columns+' 欄，閱讀較密集。','可拆成數份表格或放大投影片；這不影響原始資料完整性。');
    }
   });
  });
  // Existing warnings are heuristic diagnostics. Keep their original context,
  // but explicitly say they are estimates and never turn them into blockers.
  (model&&Array.isArray(model.warns)?model.warns:[]).forEach(message=>{
   const str=String(message),match=str.match(/#(\d+)\]/),si=match?slides.findIndex(sl=>sl&&sl.no===Number(match[1])):-1;
   add('warning','LAYOUT_ESTIMATE',si,null,'版面估算提醒：'+str,'請檢查預覽與 PowerPoint 的實際換行；必要時減少文字或加大元件。');
  });
  (model&&model.tray&&Array.isArray(model.tray.notes)?model.tray.notes:[]).forEach(message=>add('warning','TRAY_LAYOUT_ADVICE',null,null,String(message),'可減少待選素材、調整排列或使用單元件匯出。'));
  if(model&&model.tray&&Array.isArray(model.tray.skipped)&&model.tray.skipped.length)add('error','SKIPPED_ASSETS',null,null,'有 '+model.tray.skipped.length+' 個已選素材未能加入匯出。','請檢查待選素材並重新加入失效項目。');
  const errors=issues.filter(i=>i.severity==='error').length,warnings=issues.length-errors,status=errors?'blocked':warnings?'advisory':'ready';
  return{status,label:LABELS[status],canExport:!errors,errors,warnings,issues};
 }
 return{check,labels:LABELS};
});
