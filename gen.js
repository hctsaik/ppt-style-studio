// 以 8 組範本參數產生 out/kit-<id>.pptx（含陰影 XML 修補）
// 用法：node gen.js [styleId ...]      或   node gen.js --params my.json out/custom.pptx
//       node gen.js --size S|M|L [styleId ...]   → out/size/kit-<id>-<S|M|L>.pptx（元件尺寸預設）
const PptxGenJS=require('pptxgenjs'),JSZip=require('jszip'),D=require('./deck.js'),fs=require('fs');
fs.mkdirSync('out',{recursive:true});
let args=process.argv.slice(2);let SIZE=null;
const si=args.indexOf('--size');if(si>=0){SIZE=args[si+1];args.splice(si,2);fs.mkdirSync('out/size',{recursive:true});}
(async()=>{
 if(args[0]==='--params'){const j=JSON.parse(fs.readFileSync(args[1],'utf8'));const p=j.params||j;const out=args[2]||'out/custom.pptx';
  const r=await D.exportPptx({PptxGenJS,JSZip},p,{type:'nodebuffer'});fs.writeFileSync(out,r.data);console.log('寫入',out,'陰影修補',r.patched,'個');return;}
 let all=[];
 for(const st of D.PRESETS){if(args.length&&!args.includes(st.id))continue;
  const p=SIZE?Object.assign({},st,{size:SIZE}):st;const f=SIZE?`out/size/kit-${st.id}-${SIZE}.pptx`:`out/kit-${st.id}.pptx`;
  const r=await D.exportPptx({PptxGenJS,JSZip},p,{type:'nodebuffer'});fs.writeFileSync(f,r.data);all=all.concat(r.model.warns);
  const c=r.model.connectors||{};console.log(`${f.replace('out/','')}  陰影修補 ${r.patched} 個・黏著連接線 ${c.ok}（兩端 ${c.both}／單端 ${c.one}／未轉換 ${c.fail}）`);}
 if(all.length){console.log('版面警告 '+all.length+' 筆：');all.forEach(x=>console.log('  '+x));}else console.log('OK：無文字溢出警告');})().catch(e=>{console.error(e);process.exit(1);});
