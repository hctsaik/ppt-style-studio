import sys
from PIL import Image
fs=sys.argv[2:];out=sys.argv[1];ims=[Image.open(f).convert('RGB') for f in fs];w,h=ims[0].size
O=Image.new('RGB',(w*2+10,h*((len(ims)+1)//2)+10*((len(ims)+1)//2)),'#888')
for i,im in enumerate(ims):O.paste(im,((i%2)*(w+10),(i//2)*(h+10)))
O.save(out)
