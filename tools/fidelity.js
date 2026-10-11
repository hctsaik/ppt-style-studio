// 產生 /workspace/table-fidelity-test.pptx：4 種外觀 × 代表性表格，供真 PowerPoint 開啟比對
const D=require('../deck.js');const C=require('./table-cases.js');const fs=require('fs');
const env={PptxGenJS:require('pptxgenjs'),JSZip:require('jszip')};const nv=D.PRESETS[0];
const looks=[['clean','yield'],['band','pl'],['card','status'],['zebra','dense'],['clean','cmp'],['band','kpi'],['clean','s12'],['zebra','s16'],['card','s20']];
(async()=>{const slides=[];for(const [lk,c] of looks){const m=D.buildModel(Object.assign({},nv,{tbLook:lk}),{table:C[c]});slides.push(m.slides[0]);}
 const m=D.buildModel(nv,{table:C.yield});m.slides=slides;const r=await D.exportPptx(env,nv,{type:'nodebuffer',model:m});fs.writeFileSync(process.argv[2]||'/workspace/table-fidelity-test.pptx',r.data);console.log('slides',slides.length);})().catch(e=>{console.error(e);process.exit(1)});
