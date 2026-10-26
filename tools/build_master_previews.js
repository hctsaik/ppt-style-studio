/* Embed PowerPoint-exported final three-page previews, without changing their bytes.
 * node tools/build_master_previews.js <three-page-pptx> <page1.png> <page2.png> <page3.png>
 * The PPTX and PNG inputs remain private validation files. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const inputs=process.argv.slice(2);if(inputs.length!==4)throw Error('Expected one PPTX and three PowerPoint PNG exports');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const pptx=fs.readFileSync(inputs[0]),pngs=inputs.slice(1).map(p=>fs.readFileSync(p));
for(const b of pngs){if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.readUInt32BE(16)!==960||b.readUInt32BE(20)!==540)throw Error('Preview must be a 960x540 PowerPoint PNG export');}
const data={renderer:'Microsoft PowerPoint 16.0.20527.20088',sourceSha256:hash(pptx),imageSha256:pngs.map(hash),images:pngs.map(b=>'data:image/png;base64,'+b.toString('base64'))};
const script='/* Generated from actual PowerPoint renders with tools/build_master_previews.js. */\nwindow.FixedMasterPreviews='+JSON.stringify(data)+';\n';
fs.writeFileSync(path.join(__dirname,'..','fixed-master-previews.js'),script);console.log(JSON.stringify({pages:pngs.length,sourceSha256:data.sourceSha256,imageSha256:data.imageSha256}));
