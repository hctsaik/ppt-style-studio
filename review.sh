#!/bin/bash
# 用法：bash review.sh [styleId ...]   → out/kit-*.pptx、render/<id>-NN.png、render/sheet_<id>.png
set -e
cd "$(dirname "$0")"
export FONTCONFIG_FILE=$PWD/tools/fonts.conf   # 渲染時把 微軟正黑體→Noto Sans CJK TC、新細明體→Noto Serif CJK TC
mkdir -p out render
IDS="$@"; [ -z "$IDS" ] && IDS=$(node -e "console.log(require('./deck.js').STYLES.map(s=>s.id).join(' '))")
for id in $IDS; do rm -f out/kit-$id.pptx render/$id-*.png; done
node gen.js $IDS
cd out
for id in $IDS; do (soffice -env:UserInstallation=file:///tmp/lo_$id --headless --convert-to pdf kit-$id.pptx >/dev/null 2>&1 && pdftoppm -r ${DPI:-100} -png kit-$id.pdf ../render/$id && rm -f kit-$id.pdf) & done; wait
cd ../render
python3 - $IDS <<'PY'
import sys,glob
from PIL import Image
for st in sys.argv[1:]:
  fs=sorted(glob.glob(st+'-*.png'))
  if not fs: continue
  ims=[Image.open(f).convert('RGB') for f in fs];w,h=ims[0].size;w2,h2=w//2,h//2;g=8
  m=Image.new('RGB',(2*w2+3*g,((len(ims)+1)//2)*(h2+g)+g),(200,200,200))
  for i,im in enumerate(ims): m.paste(im.resize((w2,h2),Image.LANCZOS),(g+(i%2)*(w2+g),g+(i//2)*(h2+g)))
  m.save('sheet_'+st+'.png')
PY
echo "render done: $IDS"
