#!/usr/bin/env python3
"""Validate every shipped Style Kit palette and OOXML relationship.

Packaging/role validation is not Microsoft PowerPoint visual acceptance.
Expected roles come from published palette data, not the asset generator.
"""
import base64
import json
import os
import posixpath
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(ROOT, 'stylekit-data.js'), encoding='utf-8') as source:
    THEMES = json.loads(re.search(r'=\s*(\[.*\]);', source.read(), re.S).group(1))
NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'rel': 'http://schemas.openxmlformats.org/package/2006/relationships',
      'ct': 'http://schemas.openxmlformats.org/package/2006/content-types'}
SLOTS = ['dk1', 'lt1', 'dk2', 'lt2'] + ['accent' + str(i) for i in range(1, 7)] + ['hlink', 'folHlink']
errors = []
checks = 0


def check(condition, context):
    global checks
    checks += 1
    if not condition:
        errors.append(context)


def expected(theme):
    sc = theme['sc']
    return dict(zip(SLOTS, [sc['dk1'], sc['lt1'], sc['dk2'], sc['lt2']] + sc['acc'] + [sc['hlink'], sc['fol']]))


def validate_scheme(node, palette, label):
    check(node is not None, label + ': missing clrScheme')
    if node is None:
        return
    check([child.tag.rsplit('}', 1)[-1] for child in node] == SLOTS, label + ': ordered twelve color slots')
    for role, color in palette.items():
        slot = node.find('a:' + role, NS)
        value = slot.find('a:srgbClr', NS) if slot is not None else None
        check(value is not None and value.get('val') == color, label + ': ' + role + ' must be ' + color)


def relationships(xmls, source):
    name = posixpath.join(posixpath.dirname(source), '_rels', posixpath.basename(source) + '.rels') if source else '_rels/.rels'
    node = xmls.get(name)
    if node is None:
        return []
    base = posixpath.dirname(source)
    return [(r.get('Id'), r.get('Type', '').rsplit('/', 1)[-1],
             posixpath.normpath(posixpath.join(base, r.get('Target', ''))).lstrip('/'), r.get('TargetMode')) for r in node]


def validate_package(theme, extension):
    filename = theme['id'] + extension
    with zipfile.ZipFile(os.path.join(ROOT, 'stylekit', filename)) as package:
        names = set(package.namelist())
        check(package.testzip() is None, filename + ': CRC')
        xmls = {name: ET.fromstring(package.read(name)) for name in names if name.endswith(('.xml', '.rels'))}
        content = xmls['[Content_Types].xml']
        overrides = {n.get('PartName').lstrip('/'): n.get('ContentType') for n in content.findall('ct:Override', NS)}
        suffix = 'template.main+xml' if extension == '.potx' else 'presentation.main+xml'
        check(overrides.get('ppt/presentation.xml', '').endswith(suffix), filename + ': presentation content type')
        for part in overrides:
            check(part in names, filename + ': content type points to missing ' + part)
        for rel_name in [n for n in names if n.endswith('.rels')]:
            source = '' if rel_name == '_rels/.rels' else rel_name.replace('/_rels/', '/').removesuffix('.rels')
            rs = relationships(xmls, source)
            check(len({r[0] for r in rs}) == len(rs), filename + ': duplicate relationship IDs in ' + rel_name)
            for _, _, target, mode in rs:
                if mode != 'External':
                    check(target in names, filename + ': missing relationship target ' + target)
        rootrels = relationships(xmls, '')
        check(any(kind == 'officeDocument' and target == 'ppt/presentation.xml' for _, kind, target, _ in rootrels), filename + ': root presentation relationship')
        slides = sorted(n for n in names if re.fullmatch(r'ppt/slides/slide\d+\.xml', n))
        ids = xmls['ppt/presentation.xml'].findall('p:sldIdLst/p:sldId', NS)
        prels = {rid: (kind, target) for rid, kind, target, _ in relationships(xmls, 'ppt/presentation.xml')}
        check(len(slides) == len(ids) == 4, filename + ': exactly four registered slides')
        registered = [prels.get(n.get('{' + NS['r'] + '}id')) for n in ids]
        check(set(registered) == {('slide', n) for n in slides}, filename + ': presentation slide list matches slide parts')
        masters = sorted(n for n in names if re.fullmatch(r'ppt/slideMasters/slideMaster\d+\.xml', n))
        layouts = sorted(n for n in names if re.fullmatch(r'ppt/slideLayouts/slideLayout\d+\.xml', n))
        check(bool(masters) and bool(layouts), filename + ': native masters and layouts')
        for slide in slides:
            check(any(k == 'slideLayout' and t in layouts for _, k, t, _ in relationships(xmls, slide)), filename + ': ' + slide + ' layout')
        for layout in layouts:
            check(any(k == 'slideMaster' and t in masters for _, k, t, _ in relationships(xmls, layout)), filename + ': ' + layout + ' master')
        referenced_themes = set()
        for master in masters:
            targets = [t for _, k, t, _ in relationships(xmls, master) if k == 'theme']
            check(len(targets) == 1, filename + ': ' + master + ' has one theme')
            referenced_themes.update(targets)
            check(xmls[master].find('p:clrMap', NS) is not None, filename + ': ' + master + ' color mapping')
        for name in referenced_themes:
            theme_xml = xmls[name]
            validate_scheme(theme_xml.find('a:themeElements/a:clrScheme', NS), expected(theme), filename + '/' + name)
            fmt = theme_xml.find('a:themeElements/a:fmtScheme', NS)
            check(fmt is not None and fmt.get('name') == 'PPT Template Style Kit', filename + ': fmtScheme identity')
            if fmt is not None:
                for child in ['fillStyleLst', 'lnStyleLst', 'effectStyleLst', 'bgFillStyleLst']:
                    node = fmt.find('a:' + child, NS)
                    check(node is not None and len(node) == 3, filename + ': fmtScheme ' + child + ' has three styles')
            fonts = theme_xml.find('a:themeElements/a:fontScheme', NS)
            check(fonts is not None and fonts.find('a:majorFont', NS) is not None and fonts.find('a:minorFont', NS) is not None, filename + ': major/minor fonts')
        check(all(xmls[s].find('p:cSld/p:spTree', NS) is not None for s in slides), filename + ': editable native shape trees')


check(len(THEMES) == 13 and len({t['id'] for t in THEMES}) == 13, 'thirteen unique Style Kit themes')
with open(os.path.join(ROOT, 'PPT-Style-Studio.html'), encoding='utf-8') as single_source:
    embedded_match = re.search(r'window\.STYLEKIT_B64=(\{[^\n]*\});', single_source.read())
embedded = json.loads(embedded_match.group(1)) if embedded_match else {}
legacy_names = {t['id'] + ext for t in THEMES for ext in ('.pptx', '.potx', '_colors.xml')}
native_names = {'native-stylekit/' + source + '/' + name for source in ('theme', 'common') for name in legacy_names}
check(set(embedded) == legacy_names | native_names,
      'single file embeds exactly 39 legacy and 78 native Style Kit assets')
for name in native_names:
    with open(os.path.join(ROOT, name), 'rb') as disk_source:
        check(base64.b64decode(embedded.get(name, ''), validate=True) == disk_source.read(),
              name + ': native standalone asset matches disk bytes')
for theme in THEMES:
    for ext in ('.pptx', '.potx', '_colors.xml'):
        name = theme['id'] + ext
        try:
            with open(os.path.join(ROOT, 'stylekit', name), 'rb') as disk_source:
                standalone, disk = base64.b64decode(embedded.get(name, ''), validate=True), disk_source.read()
                # Git autocrlf changes checked-out text XML on Windows. Binary
                # PPTX/POTX must remain byte-identical; XML permits CRLF vs LF only.
                if ext == '_colors.xml':
                    standalone, disk = standalone.replace(b'\r\n', b'\n'), disk.replace(b'\r\n', b'\n')
                check(standalone == disk, name + ': standalone matches disk asset (XML newline normalization only)')
            if ext == '_colors.xml':
                validate_scheme(ET.parse(os.path.join(ROOT, 'stylekit', name)).getroot(), expected(theme), name)
            else:
                validate_package(theme, ext)
        except (OSError, KeyError, ET.ParseError, zipfile.BadZipFile) as exc:
            errors.append(name + ': ' + str(exc))
print('Style Kit: {} themes, {} checks, {} failures'.format(len(THEMES), checks, len(errors)))
for error in errors:
    print('FAIL ' + error)
sys.exit(bool(errors))
