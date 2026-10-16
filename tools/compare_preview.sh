#!/bin/bash
# 對比式排版預覽：每個風格匯出「對比式排版（一）（二）」→ LibreOffice 轉 PNG → render/compare-<id>-<頁>.png ＋ render/compare-all-styles-<頁>.png
set -e; cd "$(dirname "$0")/.."; export FONTCONFIG_FILE=$PWD/tools/fonts.conf
T=$(mktemp -d); node -e "
const PptxGenJS=require('pptxgenjs'),JSZip=require('jszip'),D=require('./deck.js'),fs=require('fs');
(async()=>{for(const st of D.PRESETS){const r=await D.exportPptx({PptxGenJS,JSZip},st,{type:'nodebuffer',only:['cmp','cmp2']});fs.writeFileSync('$T/compare-'+st.id+'.pptx',Buffer.from(r.data));}})();"
cd $T; for f in compare-*.pptx; do b=${f%.pptx}; (soffice -env:UserInstallation=file:///tmp/lo_$b --headless --convert-to pdf $f >/dev/null 2>&1 && pdftoppm -r ${DPI:-110} -png $b.pdf $b) & done; wait; cd - >/dev/null
for f in $T/compare-*-1.png $T/compare-*-2.png; do cp $f render/; done; python3 - <<'PY'
import json,subprocess
from PIL import Image,ImageDraw,ImageFont
ids=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./deck.js').PRESETS.map(s=>[s.id,s.zh])))"]))
f=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',22,index=3)
for pg in (1,2):
  w,h=1000,563;g=16;cap=34;cols=3;rows=(len(ids)+cols-1)//cols
  O=Image.new('RGB',(cols*w+(cols+1)*g,rows*(h+cap+g)+g),'#E6E6E6');d=ImageDraw.Draw(O)
  for i,(s,zh) in enumerate(ids):
    im=Image.open(f'render/compare-{s}-{pg}.png').convert('RGB').resize((w,h),Image.LANCZOS);x=g+(i%cols)*(w+g);y=g+(i//cols)*(h+cap+g)
    d.text((x,y),f'{s}  {zh}',font=f,fill='#3A3A3A');O.paste(im,(x,y+cap))
  O.save(f'render/compare-all-styles-{pg}.png',optimize=True);print('ok',O.size)
PY
