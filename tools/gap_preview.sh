#!/bin/bash
# v12 缺漏元件預覽：每個風格匯出 KPI／時間軸／矩陣／強調 4 頁 → LibreOffice 轉 PNG → render/gap-<頁>-<風格>.png ＋ render/gap-all-styles-<頁>.png
# 只看一個風格：IDS=navy bash tools/gap_preview.sh
set -e; cd "$(dirname "$0")/.."; export FONTCONFIG_FILE=$PWD/tools/fonts.conf
PAGES="kpi tline mtx emph"
T=$(mktemp -d); node -e "
const PptxGenJS=require('pptxgenjs'),JSZip=require('jszip'),D=require('./deck.js'),fs=require('fs');const ids=(process.env.IDS||'').split(/[ ,]+/).filter(Boolean);
(async()=>{for(const st of D.PRESETS){if(ids.length&&!ids.includes(st.id))continue;const r=await D.exportPptx({PptxGenJS,JSZip},st,{type:'nodebuffer',only:'$PAGES'.split(' ')});fs.writeFileSync('$T/gap-'+st.id+'.pptx',Buffer.from(r.data));}})();"
cd $T; for f in gap-*.pptx; do b=${f%.pptx}; (soffice -env:UserInstallation=file:///tmp/lo_$b --headless --convert-to pdf $f >/dev/null 2>&1 && pdftoppm -r ${DPI:-110} -png $b.pdf $b) & done; wait; cd - >/dev/null
for f in $T/gap-*.pptx; do s=$(basename $f .pptx); s=${s#gap-}; n=1; for p in $PAGES; do cp $T/gap-$s-$n.png render/gap-$p-$s.png; n=$((n+1)); done; done
[ -n "$IDS" ] && exit 0
python3 - <<'PY'
import json,subprocess
from PIL import Image,ImageDraw,ImageFont
ids=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./deck.js').PRESETS.map(s=>[s.id,s.zh])))"]))
f=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',22,index=3)
for pg in ('kpi','tline','mtx','emph'):
  w,h=1000,563;g=16;cap=34;cols=3;rows=(len(ids)+cols-1)//cols
  O=Image.new('RGB',(cols*w+(cols+1)*g,rows*(h+cap+g)+g),'#E6E6E6');d=ImageDraw.Draw(O)
  for i,(s,zh) in enumerate(ids):
    im=Image.open(f'render/gap-{pg}-{s}.png').convert('RGB').resize((w,h),Image.LANCZOS);x=g+(i%cols)*(w+g);y=g+(i//cols)*(h+cap+g)
    d.text((x,y),f'{s}  {zh}',font=f,fill='#3A3A3A');O.paste(im,(x,y+cap))
  O.save(f'render/gap-all-styles-{pg}.png',optimize=True);print('ok',pg,O.size)
PY
