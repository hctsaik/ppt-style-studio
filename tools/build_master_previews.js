/* Embed current master PowerPoint pages without changing PNG bytes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const folder=process.argv[2];if(!folder)throw Error('Expected PowerPoint evidence folder');
const pageCount=require('../fixed-master').DOWNLOAD_PAGES.length;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const report=JSON.parse(fs.readFileSync(path.join(folder,'report.json'),'utf8').replace(/^\uFEFF/,''));
const result=report.files.find(f=>f.mode==='template');if(report.status!=='pass'||!result||result.status!=='pass'||result.slides!==pageCount)throw Error('Current master PowerPoint verification not complete');
const pptx=fs.readFileSync(path.join(folder,'template','own-template.pptx')),pngs=Array.from({length:pageCount},(_,i)=>fs.readFileSync(path.join(folder,'template','preview-'+(i+1)+'.png')));
if(hash(pptx)!==result.hash.toLowerCase())throw Error('Preview source hash does not match verification');
for(const b of pngs)if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.readUInt32BE(16)!==960||b.readUInt32BE(20)!==540)throw Error('Expected 960x540 PowerPoint PNG');
const data={renderer:'Microsoft PowerPoint '+report.version,pages:pageCount,schemes:['07','06','03','10','04'],sourceSha256:hash(pptx),imageSha256:pngs.map(hash),images:pngs.map(b=>'data:image/png;base64,'+b.toString('base64'))};
fs.writeFileSync(path.join(__dirname,'..','fixed-master-previews.js'),'/* Generated with tools/build_master_previews.js from actual PowerPoint renders. */\nwindow.FixedMasterPreviews='+JSON.stringify(data)+';\n');
console.log(JSON.stringify({pages:data.pages,schemes:data.schemes,sourceSha256:data.sourceSha256,imageSha256:data.imageSha256}));
