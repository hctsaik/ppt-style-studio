#!/bin/bash
# 標籤元件預覽：每個風格匯出「標籤元件」頁 .pptx → LibreOffice 轉 PNG → render/labels-<id>.png ＋ render/labels-all-styles.png
set -e; cd "$(dirname "$0")/.."; export FONTCONFIG_FILE=$PWD/tools/fonts.conf
T=$(mktemp -d); node -e "
const PptxGenJS=require('pptxgenjs'),JSZip=require('jszip'),D=require('./deck.js'),fs=require('fs');
(async()=>{for(const st of D.PRESETS){const r=await D.exportPptx({PptxGenJS,JSZip},st,{type:'nodebuffer',only:['labels']});fs.writeFileSync('$T/labels-'+st.id+'.pptx',Buffer.from(r.data));}})();"
cd $T; for f in labels-*.pptx; do b=${f%.pptx}; (soffice -env:UserInstallation=file:///tmp/lo_$b --headless --convert-to pdf $f >/dev/null 2>&1 && pdftoppm -r ${DPI:-110} -png -singlefile $b.pdf $b) & done; wait; cd - >/dev/null
cp $T/labels-*.png render/; python3 - <<'PY'
import glob,json,subprocess
from PIL import Image,ImageDraw,ImageFont
ids=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./deck.js').PRESETS.map(s=>[s.id,s.zh])))"]))
f=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',22,index=3)
w,h=1000,563;g=16;cap=34;cols=3;rows=(len(ids)+cols-1)//cols
O=Image.new('RGB',(cols*w+(cols+1)*g,rows*(h+cap+g)+g),'#E6E6E6');d=ImageDraw.Draw(O)
for i,(s,zh) in enumerate(ids):
  im=Image.open(f'render/labels-{s}.png').convert('RGB').resize((w,h),Image.LANCZOS);x=g+(i%cols)*(w+g);y=g+(i//cols)*(h+cap+g)
  d.text((x,y),f'{s}  {zh}',font=f,fill='#3A3A3A');O.paste(im,(x,y+cap))
O.save('render/labels-all-styles.png',optimize=True);print('ok',O.size)
PY
