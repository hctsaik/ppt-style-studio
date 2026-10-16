#!/usr/bin/env python3
"""從 /workspace/tsmc-style-kit（build.py 產物）匯入 PPT Template Style Kit 靜態檔到 stylekit/：
  stylekit/<id>.pptx（由 .potx 轉成一般簡報，佈景主題色彩＋fmtScheme 內嵌，含 Style Kit 頁）
  stylekit/<id>.potx、stylekit/<id>_colors.xml、stylekit-data.js（色碼對照，網頁預覽用）
用法：python3 tools/build_stylekit_assets.py [tsmc-style-kit 路徑]"""
import os, sys, json, zipfile, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else '/workspace/tsmc-style-kit'
OUT = os.path.join(ROOT, 'stylekit'); os.makedirs(OUT, exist_ok=True)
M = json.load(open(os.path.join(SRC, 'themes', 'mapping.json'), encoding='utf-8'))
POTX = b'application/vnd.openxmlformats-officedocument.presentationml.template.main+xml'
PPTX = b'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml'
for t in M:
    potx = os.path.join(SRC, 'templates', f'PPT Template Style Kit - {t["zh"]}.potx')
    open(os.path.join(OUT, t['id'] + '.potx'), 'wb').write(open(potx, 'rb').read())
    open(os.path.join(OUT, t['id'] + '_colors.xml'), 'wb').write(open(os.path.join(SRC, 'themes', t['id'] + '_colors.xml'), 'rb').read())
    zi = zipfile.ZipFile(potx); zo = zipfile.ZipFile(os.path.join(OUT, t['id'] + '.pptx'), 'w', zipfile.ZIP_DEFLATED)
    for it in zi.infolist():
        d = zi.read(it.filename)
        if it.filename == '[Content_Types].xml': d = d.replace(POTX, PPTX)
        if it.filename == 'docProps/core.xml': d = re.sub(rb'<dc:title>.*?</dc:title>', f'<dc:title>PPT Template Style Kit - {t["zh"]}</dc:title>'.encode(), d)
        zo.writestr(it, d)
    zo.close()
js = '/* 自動產生：tools/build_stylekit_assets.py（來源 tsmc-style-kit/themes/mapping.json），請勿手改 */\nwindow.STYLEKIT_THEMES=' + json.dumps(M, ensure_ascii=False) + ';\n'
open(os.path.join(ROOT, 'stylekit-data.js'), 'w', encoding='utf-8').write(js)
print('ok', len(M), 'themes →', OUT)
