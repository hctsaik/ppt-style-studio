#!/usr/bin/env python3
"""把所有風格的同一頁拼成一張總表：python3 tools/sheet_slide.py 01 render/catalog-all-styles.png"""
import sys,os,json,subprocess
from PIL import Image,ImageDraw,ImageFont
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));os.chdir(root)
n,out=sys.argv[1],sys.argv[2]
ids=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./deck.js').STYLES.map(s=>[s.id,s.zh])))"]))
f=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',22,index=3)
w,h=1000,563;g=16;cap=34;cols=3 if len(ids)>8 else 2;rows=(len(ids)+cols-1)//cols
O=Image.new('RGB',(cols*w+(cols+1)*g,rows*(h+cap+g)+g),'#E6E6E6');d=ImageDraw.Draw(O)
for i,(s,zh) in enumerate(ids):
    im=Image.open(f'render/{s}-{n}.png').convert('RGB').resize((w,h),Image.LANCZOS);x=g+(i%cols)*(w+g);y=g+(i//cols)*(h+cap+g)
    d.text((x,y),f'{s}  {zh}',font=f,fill='#3A3A3A');O.paste(im,(x,y+cap))
O.save(out,optimize=True);print(out,O.size)
