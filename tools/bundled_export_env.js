/* Use the exact browser-shipped exporter for local acceptance without installing
 * packages or accidentally substituting a different globally available version. */
'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const crypto=require('crypto');
const JSZip=require('../jszip.min.js');
const context={JSZip,console,Buffer,Uint8Array,ArrayBuffer,TextEncoder,TextDecoder,Blob,setTimeout,clearTimeout};
const source=fs.readFileSync(path.join(__dirname,'../pptxgen.min.js'),'utf8');
vm.runInNewContext(source,context,{filename:'bundled-pptxgen.js'});
const evidence={source:'repository browser bundles',pptxgenjs:new context.PptxGenJS().version,jszip:JSZip.version,
 sha256:Object.fromEntries(['pptxgen.min.js','jszip.min.js'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',name))).digest('hex')]))};
module.exports={PptxGenJS:context.PptxGenJS,JSZip,evidence};
