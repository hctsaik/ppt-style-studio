#!/usr/bin/env python3
"""快取破除：把 studio.html 的 <script src="x.js"> 改成 x.js?v=<檔案內容雜湊前 8 碼>。
GitHub Pages 會快取 10 分鐘；改版後 studio.html 一定拿到同一版的 deck.js／icons.js（不會新舊混用）。
用法：python3 tools/stamp_version.py（每次改 .js 後、commit 前執行；npm test 也會檢查）"""
import hashlib, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(ROOT, 'studio.html'); s = open(p, encoding='utf-8').read()
def rep(m):
    name = m.group(1); h = hashlib.sha1(open(os.path.join(ROOT, name), 'rb').read()).hexdigest()[:8]
    return f'<script src="{name}?v={h}"></script>'
t = re.sub(r'<script src="([^"?]+\.js)(?:\?v=\w+)?"></script>', rep, s)
if '--check' in sys.argv:
    sys.exit(0 if t == s else '版本戳記過期：請執行 python3 tools/stamp_version.py')
open(p, 'w', encoding='utf-8').write(t); print('ok', re.findall(r'src="([^"]+)"', t))
