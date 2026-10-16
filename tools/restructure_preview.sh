#!/bin/bash
# v14 重整預覽：匯出整份（預設 navy）→ LibreOffice → render/rs/<NN>-<key>.png（驗證實際 .pptx）
# 用法：ID=wine bash tools/restructure_preview.sh；ONLY="frame cards" 只出幾頁
set -e; cd "$(dirname "$0")/.."; export FONTCONFIG_FILE=$PWD/tools/fonts.conf; ID=${ID:-navy}
T=$(mktemp -d); node -e "
const PptxGenJS=require('pptxgenjs'),JSZip=require('jszip'),D=require('./deck.js'),fs=require('fs');const only=(process.env.ONLY||'').split(/\s+/).filter(Boolean);
(async()=>{const st=D.PRESETS.find(p=>p.id==='$ID');const r=await D.exportPptx({PptxGenJS,JSZip},st,Object.assign({type:'nodebuffer'},only.length?{only}:{}));fs.writeFileSync('$T/d.pptx',Buffer.from(r.data));
fs.writeFileSync('$T/keys.txt',D.SLIDES.filter(s=>!only.length||only.includes(s[0])).map(s=>s[2].replace('·','-')+'-'+s[0]).join('\n'));})();"
cd $T; soffice -env:UserInstallation=file:///tmp/lo_rs --headless --convert-to pdf d.pptx >/dev/null 2>&1; pdftoppm -r ${DPI:-100} -png d.pdf p; cd - >/dev/null
mkdir -p render/rs; i=0; mapfile -t K < $T/keys.txt; for f in $(ls $T/p-*.png | sort -V); do cp $f render/rs/${ID}-${K[$i]}.png; i=$((i+1)); done; echo "$i pages → render/rs/"
