#!/usr/bin/env python3
"""把 studio.html 與所有相依檔（pptxgen.bundle.js、deck.js）內嵌成單一檔案 PPT-Style-Studio.html。
用法：python3 tools/build_single.py [輸出路徑]
產生的檔案可以單獨放在任何資料夾、用 file:// 離線開啟（例如在 Windows 壓縮檔裡直接雙擊）。"""
import os, re, sys, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'PPT-Style-Studio.html')
html = open(os.path.join(ROOT, 'studio.html'), encoding='utf-8').read()

def js(name):
    s = open(os.path.join(ROOT, name), encoding='utf-8').read()
    s = re.sub(r'^\s*//# sourceMappingURL=.*$', '', s, flags=re.M)   # 單檔版沒有 .map
    s = s.replace('</script', '<\\/script').replace('<!--', '<\\!--')   # 避免提早結束 <script>
    return s

found = 0
def inline(m):
    global found
    found += 1
    name = m.group(1)
    return f'<script data-inlined="{name}">\n/* ==== 內嵌：{name} ==== */\n{js(name)}\n</script>'
html = re.sub(r'<script src="([^"]+\.js)"></script>', inline, html)
if found != 2:
    sys.exit(f'預期內嵌 2 個 script，實際 {found} 個')
if re.search(r'<(script|link|img)[^>]+(src|href)="(?!data:|https?:|#)[^"]+"', html):
    sys.exit('仍有外部相依檔，請檢查 studio.html')
stamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
html = html.replace('<title>', f'<!-- PPT Style Studio 單檔版（自動產生於 {stamp}，請勿手改；來源：studio.html + deck.js + pptxgen.bundle.js，以 tools/build_single.py 重建） -->\n<title>', 1)
open(out, 'w', encoding='utf-8').write(html)
print(f'寫入 {out}（{os.path.getsize(out)/1024:.0f} KB）')
