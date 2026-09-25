"""Revise the public half of Gallery while retaining its clinical layout.

Run from the repository root: python3 scripts/floor-plans/build_gallery.py
The supplied Gallery is preserved in gallery-source.svg as the editable baseline.
"""
from pathlib import Path
import copy
import hashlib
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'astro-site/public/assets'
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
BG, WALL, INK = '#fffefa', '#33433c', '#263831'
GLASS = '#6c98a1'


def element(tag, **attrs):
    return ET.Element(f'{{{NS}}}{tag}', {k.replace('_', '-'): str(v) for k, v in attrs.items()})


def path(parent, d, stroke=WALL, width=1.3, fill='none', dash=''):
    node = element('path', d=d, stroke=stroke, stroke_width=width, fill=fill,
                   stroke_linecap='square', stroke_linejoin='round')
    if dash:
        node.set('stroke-dasharray', dash)
    parent.append(node)
    return node


def text(parent, x, y, value, size=14, weight=600, anchor='middle', color=INK):
    lines = value if isinstance(value, list) else [value]
    for i, line in enumerate(lines):
        node = element('text', x=x, y=y + i * (size + 4), font_family='Arial,sans-serif',
                       font_size=size, font_weight=weight, text_anchor=anchor, fill=color)
        node.text = line
        parent.append(node)


def rect(parent, x, y, width, height, fill='#e0e4df', stroke='#8b968c', radius=2):
    parent.append(element('rect', x=x, y=y, width=width, height=height,
                          fill=fill, stroke=stroke, stroke_width=1, rx=radius))


def couch(parent, x, y, width=58):
    rect(parent, x, y, width, 22, '#dce4d5', radius=4)
    path(parent, f'M{x+4} {y+17}h{width-8}', '#94a18f', 1)


def circle(parent, x, y, radius, fill='#fcfaf3', stroke='#a7a58e', dash=''):
    node = element('circle', cx=x, cy=y, r=radius, fill=fill, stroke=stroke, stroke_width=1)
    if dash:
        node.set('stroke-dasharray', dash)
    parent.append(node)


def toilet(parent, x, y):
    rect(parent, x-7, y-14, 14, 7, 'white', '#8b9e88', 0)
    parent.append(element('ellipse', cx=x, cy=y, rx=7, ry=10,
                          fill='white', stroke='#8b9e88', stroke_width=1))


def polygon(points):
    return 'M' + 'L'.join(f'{x:.6f} {y:.6f}' for x, y in points) + 'Z'


def room(number, points, fill, walls=True):
    group = element('g', id=f'space-{number}')
    shape = polygon(points)
    defs = element('defs')
    clip = element('clipPath', id=f'clip-{number}')
    clip.append(element('path', d=shape))
    defs.append(clip)
    group.append(defs)
    path(group, shape, WALL if walls else 'none', 4.5 if walls else 0, fill)
    furniture = element('g', clip_path=f'url(#clip-{number})')
    group.append(furniture)
    return group, furniture


def door(parent, x, y, angle, width=30):
    group = element('g', transform=f'translate({x} {y}) rotate({angle})')
    half = width / 2
    path(group, f'M{-half} 0H{half}', BG, 7)
    path(group, f'M{-half} 0V{-width}')
    path(group, f'M{-half} {-width}A{width} {width} 0 0 1 {half} 0', '#9ba59b', 1)
    parent.append(group)


root = ET.parse(Path(__file__).with_name('gallery-source.svg')).getroot()
plan = root.find('.//*[@id="architectural-plan"]')
original = {i: plan.find(f'./{{*}}g[@id="space-{i}"]') for i in range(24)}

# Use the actual shell intersections, keeping the shopfront precisely continuous.
left_at_770 = 305 + (770-735)*250/260
lab_tip = 995 + (570-555)*265/205
lounge_left = 555 + (1090-995)*205/265
shapes = {
    17: [(570,770),(825,770),(825,880),(570,880)],
    18: [(825,770),(1060,770),(1060,880),(825,880)],
    19: [(900,880),(970,880),(970,1005),(900,1005)],
    20: [(970,937.5),(1060,937.5),(1060,1005),(970,1005)],
    21: [(970,880),(1060,880),(1060,937.5),(970,937.5)],
    22: [(lounge_left,1090),(1133,1090),(1133,1137),(975,1365),(760,1260)],
    23: [(570,880),(900,880),(900,1005),(1060,1005),(1060,1049.5),
         (1133,1049.5),(1133,1090),(lounge_left,1090),(570,lab_tip)],
    24: [(left_at_770,770),(570,770),(570,lab_tip),(555,995)],
}
fills = {17:'#f2e8d8',18:'#eef3f2',19:'#fffaf0',20:'#f0f0ed',21:'#f0f0ed',
         22:'#f7efe1',23:'#fffaf0',24:'#eef3f2'}
new = {i: room(i, pts, fills[i], i not in [22,23]) for i, pts in shapes.items()}

# Salon and skin/data finish at the same gallery wall. Doors stay independent.
f = new[17][1]
text(f, 690, 790, ['E1','BACCARAT / FLEXIBLE SALON'], 13)
rect(f, 590, 831, 185, 35, 'none', '#ab9473', 17)
text(f, 682, 853, 'FLEXIBLE EQUIPMENT', 9, 400, color='#8d775a')
f = new[18][1]
text(f, 948, 798, ['E2','SKIN / DATA'], 16)
couch(f, 930, 840, 64)
rect(f, 1012, 834, 28, 34)

# Guest toilets face an internal lobby, with no fixtures against the busy corner.
f = new[19][1]
text(f, 935, 902, ['WC','LOBBY'], 12)
path(f, 'M935 951V982', '#b5bdaf', 1, dash='3 3')
f = new[21][1]
text(f, 1014, 897, 'WC 1', 11)
toilet(f, 1041, 923)
rect(f, 997, 913, 20, 11, 'white', '#8b9e88', 0)
f = new[20][1]
text(f, 1014, 951, ['WC 2','ACCESSIBLE'], 10)
toilet(f, 1041, 989)
rect(f, 1007, 978, 19, 11, 'white', '#8b9e88', 0)
circle(f, 993, 980, 17, 'none', '#bac4b8', '3 3')

# Retain the working coffee bar and extend the open lounge to the entire tip.
f = new[22][1]
for child in list(original[22].find('./{*}g')):
    f.append(copy.deepcopy(child))
text(f, 845, 1221, 'CORNER LOUNGE', 16)
circle(f, 925, 1262, 22)
couch(f, 849, 1241, 47)
path(f, 'M800 1254L958 1331L1022 1239L1037 1249L964 1354L791 1270Z',
     '#8b968c', 1.2, '#dce4d5')
path(f, 'M802 1266L960 1343L1030 1247', '#94a18f', 1)

# Discovery moves out of the lab triangle into the main public gallery.
f = new[23][1]
text(f, 725, 955, ['EXPERIENCE','GALLERY'], 18)
rect(f, 628, 986, 63, 22)
text(f, 659, 1023, 'DEMO / DATA', 9, 400)
rect(f, 767, 986, 63, 22)
text(f, 798, 1023, 'TRY / LEARN', 9, 400)
rect(f, 663, 1050, 38, 24)
text(f, 682, 1085, 'HOST', 10, 400)

# A real enclosed work area, visible through the existing mall-facing glazing.
f = new[24][1]
rect(f, 385, 792, 165, 24, '#dbe4df', '#879b90', 0)
rect(f, 397, 796, 25, 16, '#aebbb5', '#7f9389', 1)
rect(f, 443, 795, 35, 18, '#f7faf8', '#7f9389', 1)
rect(f, 521, 798, 21, 12, 'white', '#7f9389', 0)
text(f, 506, 850, ['L1 / VISIBLE LAB'], 13)
text(f, 511, 869, 'WORKBENCH ON DISPLAY', 8, 400)
rect(f, 539, 885, 16, 40, '#dbe4df', '#879b90', 0)
circle(f, 522, 901, 7, '#dce4d5', '#8b968c')
text(f, 526, 935, 'STAFF ONLY', 8, 400)

for i in range(17,24):
    index = list(plan).index(original[i])
    plan.remove(original[i])
    plan.insert(index,new[i][0])
plan.insert(list(plan).index(new[23][0])+1,new[24][0])

# Remove obsolete lower-half openings before drawing the revised doors.
old_doors = ['translate(715.0 925.0)','translate(915.0 880.0)',
             'translate(970.0 1235.0)','translate(900.0 1235.0)','translate(1060 987)']
old_masks = ['M795.0 1090.0H865.0','M902.5 1190H967.5','M628.5 1090H1130.25']
for child in list(plan):
    if any(child.get('transform','').startswith(t) for t in old_doors) \
       or child.get('d') in old_masks or child.text in ['ACCESS','CONTROL']:
        plan.remove(child)

details = element('g', id='gallery-frontage-revision')
path(details, 'M1060 1005V1049.5H1133', WALL, 4.5)
# Glazed internal lab screen; upper section remains the salon's solid side wall.
path(details, f'M570 880V{lab_tip}', BG, 7)
path(details, f'M570 880V{lab_tip}', GLASS, 2, dash='5 3')
path(details, f'M576 886V{lab_tip-8}', GLASS, .9, dash='5 3')
door(details,805,880,0,28)
door(details,860,880,0,28)
door(details,570,953,-90,28)
# Lobby entry is screened from the gallery by a short return wall.
path(details, 'M900 950V991', BG, 7)
path(details, 'M928 978V1005', WALL, 2)
door(details,970,910,-90,26)
# Accessible WC has a sliding door, keeping the lobby free of a door swing.
path(details, 'M970 970V999', BG, 7)
path(details, 'M966 941V970', WALL, 1.3)
path(details, 'M966 970H974M966 999H974', WALL, 1.3)
door(details,1060,1027,90,30)
text(details,1001,1076,'HOSTED ACCESS',10,400)
# Corner transparency is a proposal, distinguished from retained glazing.
path(details, 'M760 1260L975 1365L1133 1137', BG, 7)
path(details, 'M760 1260L975 1365L1133 1137', GLASS, 3, dash='7 4')
path(details, 'M766 1255L973 1356L1127 1134', GLASS, 1, dash='7 4')
path(details, 'M1045 1281L1150 1340H1190', '#9aab9d', 1)
text(details,1206,1336,['HIGH-FOOTFALL CORNER','PROPOSED GLAZED LOUNGE'],13,600,'start')
plan.append(details)

for node in plan.findall('./{*}text'):
    if node.text in ['PUBLIC ENTRY','NEW SHOPFRONT DOOR']:
        node.set('x','315')
    if node.text == 'MALL WALKWAY / SHOP FRONTAGE':
        node.set('transform','translate(285 850) rotate(48)')

# Replace outdated numbering and area figures; the revised areas are unmeasured.
replacements = {
    '02 / Gallery':'Gallery', 'OPTION 02 / GALLERY':'GALLERY',
    'Four permanent window suites · aligned ensuites · coffee bar · wider guest circulation':
        'Four window suites · visible lab · internal guest toilets · prominent corner lounge',
    'OPTION INTENT':'DESIGN INTENT',
    'Visitors enter directly into the gallery.':'Visitors arrive beside a visible working lab.',
    'Compact enclosed experience rooms release':'Salon and skin/data share one straight wall.',
    'more floor for demonstrations and pop-ups.':'Guest toilets sit behind an internal lobby.',
    'Coffee seating forms an open zone beyond.':'Coffee and lounge fill the busy bottom corner.',
    'PUBLIC SPACE ALLOCATION':'PUBLIC FRONTAGE',
    'Gallery':'Lab visible from the left mall shopfront.',
    'Lounge + coffee bar':'Corner lounge faces the main mall junction.',
    'Baccarat / flexible salon':'An open gallery connects both public draws.',
    'Indicative areas; calibrated to reported 1,100 m².':'Revised areas require a measured take-off.',
    'COMMON TO ALL THREE':'CLINICAL FRAMEWORK',
    'White = clinical corridor':'White = corridor / arrival',
    'Coffee water / drainage routes unconfirmed.':'Lab services and toilet drainage unconfirmed.',
    'Baccarat equipment envelope is provisional.':'Corner glazing and equipment fit are proposals.',
    'Source: your annotated footprint. Furniture is illustrative. All remaining internal areas are assigned to a room or circulation.':
        'Gallery revision: visible lab, internal guest toilets and a public corner lounge. Furniture and equipment are illustrative.',
}
for child in list(root):
    if child.tag.endswith('text'):
        old = child.text
        if old in ['168 m²','64 m²','55 m²']:
            root.remove(child)
        elif old in replacements:
            child.text = replacements[old]

# Extra legend line occupies the available gap above design intent.
path(root,'M1640 517H1695',GLASS,3,dash='7 4')
path(root,'M1640 523H1695',GLASS,1,dash='7 4')
text(root,1720,525,'Proposed glazing',20,400,'start')
title=element('title'); title.text='Gallery / visible lab and corner lounge'; root.insert(0,title)
description=element('desc')
description.text='Revised Gallery concept. Four window suites retained. A visible lab occupies the left shopfront triangle, salon and skin/data share an aligned wall, guest toilets move inside, and the bottom mall junction becomes an open lounge with proposed glazing.'
root.insert(1,description)
data=ET.tostring(root,encoding='unicode')
(ASSETS/'plan-gallery.svg').write_text(data)
manifest_path=ASSETS/'plan-manifest.json'
manifest=json.loads(manifest_path.read_text())
manifest['referenceGallerySha256']=hashlib.sha256(data.encode()).hexdigest()
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print('Gallery revised; clinical rooms and the other four drawings retained.')
