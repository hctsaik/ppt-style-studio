#!/usr/bin/env node
/* Reproduce the selected five-scheme main download and 07 materials. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const F=require('../fixed-master.js'),Z=require('../jszip.min.js');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function build(destination=path.resolve(__dirname,'../out/fixed-master-materials')){
 fs.mkdirSync(destination,{recursive:true});const files=[];
 for(const mode of ['template','materials']){
  const bytes=mode==='template'?await F.exportPptx(Z):await F.exportMaterials(Z);
  const name=mode==='template'?'template-thirteen.pptx':'materials-07.pptx',file=path.join(destination,name);fs.writeFileSync(file,bytes);files.push({name,bytes:bytes.length,sha256:hash(bytes)});
 }
 return {sourceSha256:hash(F.originalBytes()),schemes:['07','06','03','10','04'],destination,files};
}
if(require.main===module)build(process.argv[2]&&path.resolve(process.argv[2])).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={build};
