#!/usr/bin/env python3
"""Style Kit 靜態檔檢查：每個主題 pptx/potx/_colors.xml 都在、theme1 accent1 = 主色、新主題 4 色存在。"""
import json,re,zipfile,os,sys
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T=json.loads(re.search(r'=\s*(\[.*\]);',open(f'{R}/stylekit-data.js',encoding='utf-8').read(),re.S).group(1))
bad=[]
for t in T:
    for ext in ('.pptx','.potx','_colors.xml'):
        if not os.path.exists(f'{R}/stylekit/{t["id"]}{ext}'):bad.append(t['id']+ext)
    for ext in ('.pptx','.potx'):
        z=zipfile.ZipFile(f'{R}/stylekit/{t["id"]}{ext}');th=[n for n in z.namelist() if re.match(r'ppt/theme/theme\d+\.xml',n)]
        if not any(t['sc']['acc'][0] in z.read(n).decode() for n in th):bad.append(t['id']+ext+' accent1')
    if t['id']+'' and t['id']+'.pptx' and b'presentation.main+xml' not in zipfile.ZipFile(f'{R}/stylekit/{t["id"]}.pptx').read('[Content_Types].xml'):bad.append(t['id']+' ct')
need={'1E4D45','6B1E2E','333F48','0B5CAD'}-{t['sc']['acc'][0] for t in T}
if need:bad.append('missing '+','.join(need))
print(('✓' if not bad else '✗'),f'Style Kit {len(T)} 主題資產完整',bad);sys.exit(1 if bad else 0)
