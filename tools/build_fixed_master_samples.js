#!/usr/bin/env node
/* Reproduce the two fixed-master download types for both palette choices. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const F=require('../fixed-master.js'),Z=require('../jszip.min.js');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function build(destination=path.resolve(__dirname,'../out/fixed-master-materials')){
 fs.mkdirSync(destination,{recursive:true});const files=[];
 for(const source of ['common','theme'])for(const mode of ['template','materials']){
  const bytes=mode==='template'?await F.exportPptx(Z,[],{source}):await F.exportMaterials(Z,{paletteSource:source});
  const name=mode+'-'+source+'.pptx',file=path.join(destination,name);fs.writeFileSync(file,bytes);files.push({name,bytes:bytes.length,sha256:hash(bytes)});
 }
 return {sourceSha256:hash(F.originalBytes()),destination,files};
}
if(require.main===module)build(process.argv[2]&&path.resolve(process.argv[2])).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={build};
