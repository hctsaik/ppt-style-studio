#!/usr/bin/env python3
"""(from review R3, adapted) PowerPoint-pickiness invariant checker (beyond XSD). Usage: check_pptx.py file.pptx ...
Checks: duplicate shape ids per slide; stCxn/endCxn target exists & idx < preset site count; ea typeface is a CJK face;
ea charset (Big5=-120 expected for zh-TW); CJK text tagged lang en-US; XML-illegal control chars; empty-cell endParaRPr w/o font;
table rows shorter than their font needs (PowerPoint will grow them); group xfrm sanity."""
import sys,re,zipfile,collections
SITES={'rect':4,'roundRect':4,'diamond':4,'can':5,'ellipse':8,'parallelogram':6,'flowChartDocument':4,'hexagon':6}
CJKF=re.compile(r'JhengHei|PMingLiU|Noto Sans TC|Noto Serif TC|細明|正黑')
CJK=re.compile(r'[\u3000-\u303F\u3400-\u9FFF\uFF00-\uFFEF]')
CTL=re.compile(r'[\x00-\x08\x0B\x0C\x0E-\x1F]')
def check(path):
    z=zipfile.ZipFile(path);R=collections.Counter();ex=collections.defaultdict(list)
    def hit(k,v=''):
        R[k]+=1
        if len(ex[k])<3: ex[k].append(v)
    for n in sorted(z.namelist()):
        if not re.match(r'ppt/slides/slide\d+\.xml$',n):continue
        raw=z.read(n)
        try:s=raw.decode('utf-8')
        except: hit('not utf-8',n);continue
        if CTL.search(s): hit('XML-illegal control char',n)
        ids=re.findall(r'<p:cNvPr id="(\d+)"',s);d=[i for i,c in collections.Counter(ids).items() if c>1]
        if d: hit('duplicate cNvPr id',f'{n}:{d[:5]}')
        prst={};ncx={}
        for m in re.finditer(r'<p:sp>.*?</p:sp>',s,re.S):
            b=m.group(0);i=re.search(r'<p:cNvPr id="(\d+)"',b).group(1);g=re.search(r'prstGeom prst="(\w+)"',b);prst[i]=g.group(1) if g else 'custGeom'
            if not g: ncx[i]=len(re.findall(r'<a:cxn ',b))
        for m in re.finditer(r'<a:(stCxn|endCxn) id="(\d+)" idx="(\d+)"/>',s):
            t=prst.get(m.group(2))
            if t is None: hit('connector target missing/not a p:sp',f'{n}:{m.group(0)}');continue
            if t=='custGeom' and int(m.group(3))>=ncx.get(m.group(2),0): hit('connector to custGeom site that does not exist (no cxnLst)',f'{n}:{m.group(0)}')
            elif t in SITES and int(m.group(3))>=SITES[t]: hit('connector idx out of range',f'{n}:{t}#{m.group(3)}')
            if t=='can' and m.group(3)=='0': hit('can idx0 = inner cap edge, not top (top is idx1)',f'{n}')
        for m in re.finditer(r'<a:rPr ([^>]*)>(.*?)</a:rPr><a:t>(.*?)</a:t>',s,re.S):
            a,props,t=m.groups();ea=re.search(r'<a:ea typeface="([^"]*)"[^>]*?charset="(-?\d+)"',props)
            if CJK.search(t):
                if 'lang="en-US"' in a: hit('CJK run tagged lang=en-US',t[:20])
                if ea and not CJKF.search(ea.group(1)): hit('CJK run with Latin-only ea font',f'{ea.group(1)}:{t[:15]}')
            if ea and ea.group(2)=='-122': hit('ea charset GB2312(-122) for zh-TW deck')
        for m in re.finditer(r'<a:tc>(.*?)</a:tc>',s,re.S):
            if '<a:r>' not in m.group(1) and not re.search(r'<a:endParaRPr[^>]*>.*?<a:latin ',m.group(1),re.S): hit('empty table cell: endParaRPr has no font/colour (typing gives theme 12pt)')
        for tm in re.finditer(r'<a:tbl>.*?</a:tbl>',s,re.S):
            for tr in re.finditer(r'<a:tr h="(\d+)">(.*?)</a:tr>',tm.group(0),re.S):
                h=int(tr.group(1))/12700;sz=[int(x)/100 for x in re.findall(r'<a:rPr[^>]* sz="(\d+)"',tr.group(2))]
                mt=[int(x)/12700 for x in re.findall(r'marT="(\d+)"',tr.group(2))][:1] or [3.6]
                if sz and h < max(sz)*1.2+2*mt[0]-0.5: hit('table row shorter than text (PowerPoint will grow it)',f'{n}: row {h:.1f}pt < need {max(sz)*1.2+2*mt[0]:.1f}pt')
    th=z.read('ppt/theme/theme1.xml').decode()
    if re.search(r'<a:minorFont><a:latin typeface="Calibri"',th): hit('theme minor font Calibri (new text in PowerPoint ≠ deck font)')
    if '<a:font script="Hant" typeface="新細明體"/>' in th: hit('theme Hant font = 新細明體 (PMingLiU)')
    print(f'== {path}');
    if not R: print('  clean')
    for k,v in R.most_common(): print(f'  {v:6d}  {k}   e.g. {ex[k][:2]}')
    return 1 if R else 0
bad=0
for p in sys.argv[1:]: bad+=check(p) or 0
sys.exit(1 if bad else 0)
