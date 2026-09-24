"""Audit every built page and room selector against the approved asset hashes."""
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import json
import sys

root = Path(__file__).resolve().parents[1]
dist = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'astro-site/dist'
base = sys.argv[2] if len(sys.argv) > 2 else '/'
manifest = json.loads((dist / 'assets/scenes/manifest.json').read_text())
expected = {}
dimensions = {}
for style in manifest['styles']:
    for scene in style['images']:
        expected[scene['src']] = scene['sha256']
        dimensions[scene['src']] = (scene['width'], scene['height'])
        dimensions[scene['thumbnail']] = (scene.get('thumbnailWidth', 640), scene.get('thumbnailHeight', round(640 * scene['height'] / scene['width'])))
        expected[scene['thumbnail']] = scene['thumbnailSha256']
for motion in manifest['motions']:
    for source in motion['sources']:
        expected[source['src']] = source['sha256']
for path, digest in expected.items():
    assert sha256((dist / path).read_bytes()).hexdigest() == digest, path

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.selectors = [], []
        self.videos = 0
        self.water_controls = 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'video' and 'water-loop' in attrs.get('class', ''):
            self.videos += 1
            assert all(key in attrs for key in ['muted', 'loop', 'playsinline']), attrs
            assert 'controls' not in attrs, attrs
        if 'data-water-toggle' in attrs:
            self.water_controls += 1
        for key in ['src', 'poster', 'data-lightbox']:
            if 'assets/scenes/' in attrs.get(key, ''):
                self.refs.append(attrs[key])
        if tag == 'img' and 'assets/scenes/' in attrs.get('src', ''):
            asset = urlparse(attrs['src']).path[len(base):]
            width, height = dimensions[asset]
            assert abs(int(attrs['width']) / int(attrs['height']) - width / height) < .004, attrs
        if 'data-scene-sources' in attrs:
            options = json.loads(attrs['data-scene-sources'])
            assert set(options) == {s['id'] for s in manifest['scenes']}
            self.selectors.extend(options.values())
            sizes = json.loads(attrs['data-scene-dimensions'])
            for room, ref in options.items():
                asset = urlparse(ref).path[len(base):]
                assert (sizes[room]['width'], sizes[room]['height']) == dimensions[asset], (room, sizes[room])

pages, refs, thumbnails, selectors = 0, 0, 0, 0
coverage = {}
for path in sorted(dist.rglob('*.html')):
    page = Page()
    page.feed(path.read_text())
    if not page.refs:
        continue
    pages += 1
    coverage[path.relative_to(dist).as_posix()] = len(page.refs)
    assert sum('-thumb.webp' in ref for ref in page.refs) == 4, path
    assert page.water_controls == 0, path
    relative = path.relative_to(dist).as_posix()
    if relative in ['index.html', 'interior-design/index.html']:
        assert page.videos == 8, (path, page.videos)
    elif relative.startswith('interior-design/'):
        assert page.videos == 5, (path, page.videos)
    else:
        assert page.videos >= 4, (path, page.videos)
    for ref in page.refs + page.selectors:
        parsed = urlparse(ref)
        assert parsed.path.startswith(base), (path, ref)
        asset = parsed.path[len(base):]
        assert asset in expected, (path, ref)
        assert parse_qs(parsed.query).get('v') == [expected[asset][:12]], (path, ref)
    refs += len(page.refs)
    thumbnails += sum('-thumb.webp' in ref for ref in page.refs)
    selectors += len(page.selectors)
assert pages == 22, pages
assert selectors == 24, selectors
assert 'index.html' in coverage
assert 'interior-design/index.html' in coverage
for style in manifest['styles']:
    assert f"interior-design/{style['slug']}/index.html" in coverage
assert sum(p.startswith('experiences/') for p in coverage) == 14
print(json.dumps({'pages':pages, 'versionedMediaReferences':refs, 'menuThumbnails':thumbnails, 'roomSwitchTargets':selectors, 'base':base, 'result':'pass'}, indent=2))
