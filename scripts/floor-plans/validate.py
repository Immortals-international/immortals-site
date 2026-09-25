"""Check concept geometry and access. Requires Shapely 2.x.

Run: python3 scripts/floor-plans/validate.py
Drawing coordinates are not measured metres; this is not a code-compliance test.
"""
import hashlib
import json
import re
from pathlib import Path
from shapely import set_precision
from shapely.geometry import LineString, Point, Polygon, box, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
models = json.loads(Path(__file__).with_name('concepts.json').read_text())
manifest = json.loads((ROOT / 'astro-site/public/assets/plan-manifest.json').read_text())
assets = ROOT / 'astro-site/public/assets'
assert hashlib.sha256((assets / 'plan-gallery.svg').read_bytes()).hexdigest() == manifest['referenceGallerySha256']

for model in models:
    label = model['title']
    numbers = list(map(float, re.findall(r'-?\d+(?:\.\d+)?', model['shell'])))
    shell = set_precision(Polygon(list(zip(numbers[::2], numbers[1::2]))), .001)
    zones = {z['id']: shape(z['geometry']) for z in model['zones']}
    required = {'S1', 'S2', 'S3', 'S4', 'D1', 'D2', 'D3', 'T1', 'T2', 'E', 'E1', 'E2', 'L1', 'B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'W1', 'W2', 'R'}
    assert required <= zones.keys(), label
    assert shell.symmetric_difference(unary_union(list(zones.values()))).area < .1, (label, 'coverage')
    for i, (id, room) in enumerate(zones.items()):
        assert room.is_valid and not room.is_empty, (label, id, 'invalid geometry')
        for other, area in list(zones.items())[i + 1:]:
            assert room.intersection(area).area < .01, (label, id, other, 'overlap')
    open_ids = {z['id'] for z in model['zones'] if z['open']}
    public = unary_union([zones[id] for id in open_ids]).buffer(.002)
    walk = unary_union([public, zones['B0']]).buffer(.002)
    assert walk.geom_type == 'Polygon', (label, 'disconnected floor')
    # Erosion rejects corridors connected only at a point or through tiny slits.
    clear = walk.buffer(-15)
    assert clear.geom_type == 'Polygon', (label, 'pinched circulation')
    tip = zones['K'] if model['key'] == 'wings' else zones['L1']
    assert tip.buffer(.002).covers(shell.intersection(box(0, 1255, 1500, 1500))), (label, 'active tip')
    for id in ['B1', 'B2', 'B3', 'B4', 'B5', 'W1', 'W2']:
        assert zones[id].distance(shell.boundary) > 1, (label, id, 'perimeter support')
    doors = {d['room']: d['door'] for d in model['doors']}
    for id in zones.keys() - open_ids:
        room = zones[id]
        assert room.geom_type == 'Polygon' and id in doors, (label, id, 'room or door missing')
        p = Point(doors[id])
        assert room.boundary.distance(p) < .01, (label, id, 'door off wall')
        adjacent = public if id == 'B0' else walk
        assert adjacent.distance(p) < .01, (label, id, 'door blocked')
        # The entire drawn door opening must meet an accessible shared boundary.
        for a, b in zip(room.exterior.coords, list(room.exterior.coords)[1:]):
            edge = LineString([a, b])
            if edge.distance(p) < .01:
                length = edge.length
                width = min(28 if id in ['B3', 'B4', 'B5', 'W2'] else 35, length - 4)
                ux, uy = (b[0] - a[0]) / length, (b[1] - a[1]) / length
                opening = LineString([(p.x - ux * width / 2, p.y - uy * width / 2), (p.x + ux * width / 2, p.y + uy * width / 2)])
                assert edge.buffer(.01).covers(opening), (label, id, 'door beyond wall')
                assert adjacent.buffer(.01).covers(opening), (label, id, 'door width blocked')
                assert clear.distance(p) < 27, (label, id, 'cramped door approach')
                if id == 'L1':
                    nx, ny = -uy, ux
                    if not room.contains(Point(p.x + nx, p.y + ny)):
                        nx, ny = -nx, -ny
                    ends = list(opening.coords)
                    swing = Polygon([ends[0], ends[1], (ends[1][0]+nx*width, ends[1][1]+ny*width), (ends[0][0]+nx*width, ends[0][1]+ny*width)])
                    assert room.buffer(.01).covers(swing), (label, 'lab door swing leaves room')
                    for name in ['bench', 'displayBench']:
                        if name in model['lab']:
                            x, y, w, h = model['lab'][name]
                            bench = box(x, y, x+w, y+h)
                            assert room.covers(bench), (label, 'lab bench outside room')
                            assert swing.intersection(bench).area < .01, (label, 'lab bench blocks door')
                break
    for x1, y1, x2, y2 in model['lab']['glass']:
        glass = LineString([(x1, y1), (x2, y2)])
        assert zones['L1'].boundary.buffer(.01).covers(glass), (label, 'lab glazing off wall')
        assert public.buffer(.01).covers(glass), (label, 'lab not visible from public floor')
    mall = LineString([(405,635),(305,735),(555,995),(760,1260),(975,1365),(1133,1137),(1133,1049.5),(1165,910.5),(1165,750),(1335,445)])
    exterior = model['lab']['exteriorGlass']
    assert exterior, (label, 'outside lab window missing')
    for x1, y1, x2, y2 in exterior:
        glass = LineString([(x1,y1),(x2,y2)])
        assert zones['L1'].boundary.buffer(.01).covers(glass), (label, 'outside glazing off lab')
        assert mall.buffer(.01).covers(glass), (label, 'lab glazing is not mall-facing')
        assert shell.boundary.buffer(.01).covers(glass), (label, 'lab glazing is not exterior')
    x, y, w, h = model['lab']['bench']
    assert zones['L1'].covers(box(x, y, x + w, y + h)), (label, 'lab bench outside room')
    for entry in [(1140, 982)] + ([(610, 1053)] if model['key'] in ['club', 'wings'] else []):
        assert public.covers(Point(entry)), (label, 'entry disconnected')
    print(f'{label}: coverage, walls, doors, lab visibility and circulation passed.')

for plan in manifest['plans']:
    assert hashlib.sha256((assets / plan['file']).read_bytes()).hexdigest() == plan['sha256']
print('All four drawings and cache hashes passed. Gallery hash is intact.')
