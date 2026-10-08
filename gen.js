// 以 8 組範本參數產生 out/kit-<id>.pptx（含陰影 XML 修補）
// 用法：node gen.js [styleId ...]      或   node gen.js --params my.json out/custom.pptx
const PptxGenJS=require('pptxgenjs'),JSZip=require('jszip'),D=require('./deck.js'),fs=require('fs');
fs.mkdirSync('out',{recursive:true});
const args=process.argv.slice(2);
(async()=>{
 if(args[0]==='--params'){const j=JSON.parse(fs.readFileSync(args[1],'utf8'));const p=j.params||j;const out=args[2]||'out/custom.pptx';
  const r=await D.exportPptx({PptxGenJS,JSZip},p,{type:'nodebuffer'});fs.writeFileSync(out,r.data);console.log('寫入',out,'陰影修補',r.patched,'個');return;}
 let all=[];
 for(const st of D.PRESETS){if(args.length&&!args.includes(st.id))continue;
  const r=await D.exportPptx({PptxGenJS,JSZip},st,{type:'nodebuffer'});fs.writeFileSync(`out/kit-${st.id}.pptx`,r.data);all=all.concat(r.model.warns);
  console.log(`kit-${st.id}.pptx  陰影修補 ${r.patched} 個`);}
 if(all.length){console.log('版面警告 '+all.length+' 筆：');all.forEach(x=>console.log('  '+x));}else console.log('OK：無文字溢出警告');})().catch(e=>{console.error(e);process.exit(1);});
