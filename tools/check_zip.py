"""PowerPoint 會「無法讀取」但 XSD 驗不出來的封裝／結構問題：
zip 順序與項目、重複名稱、每頁形狀 id 唯一、連接線參照存在、座標為整數。"""
import zipfile,sys,re
bad=0
for f in sys.argv[1:]:
  z=zipfile.ZipFile(f);L=z.infolist();e=[]
  if L[0].filename!='[Content_Types].xml':e.append('[Content_Types].xml 不是第一個')
  if any(i.is_dir() for i in L):e.append('含資料夾項目')
  if any('\\' in i.filename for i in L):e.append('檔名含反斜線')
  if len(set(i.filename.lower() for i in L))!=len(L):e.append('重複檔名')
  if z.testzip():e.append('CRC 錯誤')
  names=set(z.namelist())
  for n in names:
    if not n.endswith('.rels'):continue
    base=n.replace('_rels/','').rsplit('.rels',1)[0];d=base.rsplit('/',1)[0] if '/' in base else ''
    for t,m in re.findall(r'Target="([^"]+)"(?: TargetMode="(\w+)")?',z.read(n).decode()):
      if m=='External':continue
      p=t.lstrip('/') if t.startswith('/') else '/'.join(x for x in (d+'/'+t).split('/') if x)
      while '/../' in '/'+p+'/':p=re.sub(r'[^/]+/\.\./','',p,count=1)
      if p not in names:e.append(f'{n} → 不存在的 {t}')
  th={}
  for n in names:
    if re.match(r'ppt/(slideMasters|notesMasters|handoutMasters)/_rels/',n):
      for tg in re.findall(r'relationships/theme" Target="([^"]+)"',z.read(n).decode()):th.setdefault(tg.rsplit('/',1)[-1],[]).append(n)
  for tg,us in th.items():
    if len(us)>1:e.append(f'{tg} 被多個母片共用（PowerPoint 會修復）')
  if re.search(rb'<a:r><a:rPr[^>]*/><a:t\s*/></a:r>',b''.join(z.read(n) for n in names if 'notesSlide' in n and n.endswith('.xml'))):e.append('備忘稿含空白 run')
  for n in sorted(x for x in names if re.match(r'ppt/slides/slide\d+\.xml$',x)):
    s=z.read(n).decode();ids=re.findall(r'<p:cNvPr id="(\d+)"',s)
    if len(ids)!=len(set(ids)):e.append(n+' 形狀 id 重複')
    for c in re.findall(r'<a:(?:st|end)Cxn id="(\d+)"',s):
      if c not in ids:e.append(n+' 連接線參照不存在的 id '+c)
    if re.search(r'\b(?:x|y|cx|cy|w|h|sz)="-?\d*\.\d+"|NaN|undefined|Infinity',s):e.append(n+' 非整數座標／NaN')
  print('  ' + ('✓' if not e else '✗'),f.rsplit('/',1)[-1],'; '.join(e[:5]));bad+=bool(e)
sys.exit(1 if bad else 0)
