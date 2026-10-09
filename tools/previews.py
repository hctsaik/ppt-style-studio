# 由 render/*.png 產生網頁預覽圖 preview/<id>-NN.jpg 與總覽 render/overview.png
import glob,os,json,subprocess
from PIL import Image,ImageDraw,ImageFont
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
os.makedirs('preview',exist_ok=True)
ids=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./deck.js').STYLES.map(s=>[s.id,s.zh,s.en])))"]))
for f in glob.glob('preview/*.jpg'): os.remove(f)
for id_,zh,en in ids:
  for f in sorted(glob.glob(f'render/{id_}-*.png')):
    im=Image.open(f).convert('RGB');im=im.resize((1200,675),Image.LANCZOS)
    im.save('preview/'+os.path.basename(f)[:-4]+'.jpg',quality=86,optimize=True)
# overview：每個風格取一張代表頁
rep={'navy':'11','green':'07','frame':'12','iceberg':'13','wire':'10','wine':'04','teal':'09','charcoal':'05','investor':'03'}
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',30,index=3)
font2=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',22,index=3)
tw,th=960,540;pad=36;cap=64;cols=2;rows=(len(ids)+1)//2
O=Image.new('RGB',(cols*tw+(cols+1)*pad,rows*(th+cap)+(rows+1)*pad-10),'#EDEDED');d=ImageDraw.Draw(O)
for i,(id_,zh,en) in enumerate(ids):
  n=rep.get(id_,'01');im=Image.open(f'render/{id_}-{n}.png').convert('RGB').resize((tw,th),Image.LANCZOS)
  x=pad+(i%cols)*(tw+pad);y=pad+(i//cols)*(th+cap+pad)
  d.rectangle([x-1,y-1,x+tw,y+th],outline='#CFCFCF');O.paste(im,(x,y))
  d.text((x,y+th+14),f'{i+1:02d}  {zh}',font=font,fill='#3A3A3A');d.text((x+330,y+th+20),en,font=font2,fill='#8C8C8C')
O.save('render/overview.png',optimize=True);print('previews + overview ok',O.size)
