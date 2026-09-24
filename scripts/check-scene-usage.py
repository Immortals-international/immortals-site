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
for style in manifest['styles']:
    for scene in style['images']:
        expected[scene['src']] = scene['sha256']
        expected[scene['thumbnail']] = scene['thumbnailSha256']
for source in manifest['motion']['sources']:
    expected[source['src']] = source['sha256']
for path, digest in expected.items():
    assert sha256((dist / path).read_bytes()).hexdigest() == digest, path

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.selectors = [], []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ['src', 'poster', 'data-lightbox']:
            if 'assets/scenes/' in attrs.get(key, ''):
                self.refs.append(attrs[key])
        if 'data-scene-sources' in attrs:
            options = json.loads(attrs['data-scene-sources'])
            assert set(options) == {s['id'] for s in manifest['scenes']}
            self.selectors.extend(options.values())

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
