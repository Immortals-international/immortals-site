import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

// Exercise asynchronous room changes and pointer handling independently of GPU/UI.
// Browser rendering and real source-image QA are separate manual checks.
const source = (await readFile(new URL('../astro-site/src/scripts/clinic-tour.js', import.meta.url), 'utf8')).replace(/^import .*;\n/, '');
const flush = () => new Promise((resolve) => setImmediate(resolve));
function harness({ cube = false, missing = false } = {}) {
  class Element {
    constructor() { this.hidden = false; this.dataset = {}; this.attributes = {}; this.style = {}; this.events = {}; this.clientWidth = 1440; this.clientHeight = 822; const set = new Set(); this.classList = { add: (v) => set.add(v), remove: (v) => set.delete(v), contains: (v) => set.has(v), toggle: (v, force) => { const on = force ?? !set.has(v); on ? set.add(v) : set.delete(v); return on; } }; }
    setAttribute(k, v) { this.attributes[k] = v; }
    addEventListener(k, fn) { this.events[k] = fn; }
    fire(k, event = {}) { this.events[k]?.({ preventDefault() {}, ...event }); }
    getBoundingClientRect() { return { top: this.top ?? 78, height: 20 }; }
    querySelectorAll() { return []; }
    setPointerCapture() {}
    focus() {}
  }
  const elements = new Map();
  const el = (id) => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  el('tour-help').top = 750; el('toolbar').top = 790;
  const values = {}, uploads = [], pixelStores = [], pending = new Map();
  const constants = ['VERTEX_SHADER','FRAGMENT_SHADER','COMPILE_STATUS','LINK_STATUS','ARRAY_BUFFER','STATIC_DRAW','FLOAT','TEXTURE_2D','TEXTURE_CUBE_MAP','TEXTURE_CUBE_MAP_POSITIVE_X','TEXTURE_CUBE_MAP_NEGATIVE_X','TEXTURE_CUBE_MAP_POSITIVE_Y','TEXTURE_CUBE_MAP_NEGATIVE_Y','TEXTURE_CUBE_MAP_POSITIVE_Z','TEXTURE_CUBE_MAP_NEGATIVE_Z','RGBA','UNSIGNED_BYTE','TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER','TEXTURE_WRAP_S','TEXTURE_WRAP_T','LINEAR','CLAMP_TO_EDGE','TRIANGLES','MAX_CUBE_MAP_TEXTURE_SIZE','MAX_TEXTURE_SIZE','UNPACK_FLIP_Y_WEBGL'];
  const gl = Object.fromEntries(constants.map((k, i) => [k, i + 1]));
  Object.assign(gl, { TEXTURE0: 100, TEXTURE1: 101, NO_ERROR: 0, getError: () => 0, getParameter: () => 4096, getShaderParameter: () => true, getProgramParameter: () => true, getUniformLocation: (_, name) => name, getAttribLocation: () => 0, uniform1f: (k, v) => { values[k] = v; }, uniform1i: (k, v) => { values[k] = v; }, texImage2D: (...args) => uploads.push(args), pixelStorei: (...args) => pixelStores.push(args) });
  for (const name of ['createShader','createProgram','createBuffer','createTexture']) gl[name] = () => ({});
  for (const name of ['shaderSource','compileShader','attachShader','linkProgram','deleteShader','useProgram','bindBuffer','bufferData','enableVertexAttribArray','vertexAttribPointer','activeTexture','bindTexture','texParameteri','viewport','drawArrays']) gl[name] = () => {};
  el('tour-canvas').getContext = () => gl;
  class Image {
    set src(path) { this.path = path; this.width = cube && path.startsWith('/face') ? 512 : 1774; this.height = cube && path.startsWith('/face') ? 512 : 887; pending.set(path, this); }
  }
  const scenes = ['main-entrance','private-entrance','patient-suite','dexa','vo2-max','hyperbaric'].map((id) => ({ id, name: id, src: `/${id}.webp` }));
  if (cube || missing) scenes[5] = { id: 'hyperbaric', name: 'hyperbaric', projection: 'cube', faces: missing ? null : [0,1,2,3,4,5].map((i) => `/face${i}.webp`) };
  const doc = { getElementById: el, querySelector: () => el('toolbar'), addEventListener() {}, fullscreenElement: null };
  const context = { scenes, document: doc, navigator: { connection: { saveData: true } }, history: { replaceState: (_, __, hash) => { values.hash = hash; } }, location: { hash: '' }, Image, devicePixelRatio: 1, ResizeObserver: class { observe() {} }, addEventListener() {}, setTimeout, clearTimeout, requestAnimationFrame: (fn) => { setImmediate(fn); return 1; } };
  vm.runInNewContext(source, context);
  const select = (index) => { el('room-select').value = String(index); el('room-select').fire('change'); };
  const load = async (path, success = true) => { const img = pending.get(path); assert.ok(img, `Image requested: ${path}`); success ? img.onload() : img.onerror(); await flush(); await flush(); };
  return { el, select, load, pending, values, uploads, pixelStores, gl };
}

test('starts at main entrance, loads one image, then supports sequence wrap', async () => {
  const h = harness();
  assert.equal(h.el('clinic-tour').dataset.state, 'loading');
  assert.equal(h.el('tour-canvas').attributes['aria-busy'], 'true');
  assert.equal(h.pending.size, 1);
  await h.load('/main-entrance.webp');
  assert.equal(h.el('clinic-tour').dataset.room, 'main-entrance');
  assert.equal(h.el('tour-status').hidden, true);
  h.el('previous-room').onclick(); await h.load('/hyperbaric.webp');
  assert.equal(h.el('clinic-tour').dataset.room, 'hyperbaric');
  h.el('next-room').onclick(); await flush();
  assert.equal(h.el('clinic-tour').dataset.room, 'main-entrance');
});
test('a slow earlier request cannot overwrite the most recently selected room', async () => {
  const h = harness(); h.select(1); h.select(3);
  await h.load('/dexa.webp'); await h.load('/private-entrance.webp'); await h.load('/main-entrance.webp');
  assert.equal(h.el('clinic-tour').dataset.room, 'dexa');
  assert.equal(h.el('room-select').value, '3');
  assert.equal(h.values.hash, '#dexa');
});
test('failed images show a retry state and recover with a fresh request', async () => {
  const h = harness(); await h.load('/main-entrance.webp', false);
  assert.equal(h.el('clinic-tour').dataset.state, 'error');
  assert.equal(h.el('retry-room').hidden, false);
  h.el('retry-room').onclick(); await h.load('/main-entrance.webp');
  assert.equal(h.el('clinic-tour').dataset.state, 'ready');
});
test('touch swipe changes view, pinch zooms, and a cancelled gesture releases', async () => {
  const h = harness(); await h.load('/main-entrance.webp'); const canvas = h.el('tour-canvas');
  canvas.fire('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 200 });
  canvas.fire('pointermove', { pointerId: 1, clientX: 140, clientY: 230 }); await flush();
  assert.notEqual(h.values.yaw, 0); assert.notEqual(h.values.pitch, 0);
  const lens = h.values.lens;
  canvas.fire('pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 240, clientY: 230 });
  canvas.fire('pointermove', { pointerId: 2, clientX: 290, clientY: 230 }); await flush();
  assert.ok(h.values.lens < lens, 'Spreading two fingers zooms in');
  canvas.fire('pointercancel', { pointerId: 1 }); canvas.fire('pointerup', { pointerId: 2 });
  assert.equal(canvas.classList.contains('dragging'), false);
  h.el('reset').onclick(); await flush(); assert.equal(h.values.yaw, 0); assert.equal(h.values.pitch, 0);
});
test('cube mode waits for all six equal faces and uses separate cube sampling', async () => {
  const h = harness({ cube: true }); h.select(5);
  for (let i = 0; i < 5; i++) await h.load(`/face${i}.webp`);
  assert.equal(h.el('clinic-tour').dataset.state, 'loading');
  await h.load('/face5.webp');
  assert.equal(h.values.isCube, 1);
  assert.deepEqual(h.uploads.slice(-6).map((args) => args[0]), [h.gl.TEXTURE_CUBE_MAP_POSITIVE_X,h.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,h.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,h.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,h.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,h.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]);
  assert.deepEqual(h.pixelStores.at(-1), [h.gl.UNPACK_FLIP_Y_WEBGL, false]);
  await h.load('/main-entrance.webp'); // Stale initial load cannot replace the cube.
  assert.equal(h.values.isCube, 1);
  h.select(0); await flush(); assert.equal(h.values.isCube, 0);
});
test('missing cube assets never fall back to the obsolete panorama', async () => {
  const h = harness({ missing: true }); h.select(5); await flush();
  assert.equal(h.el('clinic-tour').dataset.state, 'error');
  assert.equal(h.pending.has('/hyperbaric.webp'), false);
  assert.match(h.el('status-message').textContent, /cube faces are unavailable/);
});

test('one failed cube face keeps the room in an error state until a complete retry', async () => {
  const h = harness({ cube: true }); h.select(5);
  const before = h.uploads.length;
  for (let i = 0; i < 5; i++) await h.load(`/face${i}.webp`);
  await h.load('/face5.webp', false);
  assert.equal(h.el('clinic-tour').dataset.state, 'error');
  assert.equal(h.uploads.length, before, 'Partial cubes are never displayed');
  h.el('retry-room').onclick();
  for (let i = 0; i < 6; i++) await h.load(`/face${i}.webp`);
  assert.equal(h.el('clinic-tour').dataset.state, 'ready');
});

test('mismatched cube dimensions are rejected before upload', async () => {
  const h = harness({ cube: true }); h.select(5);
  h.pending.get('/face2.webp').height = 511;
  for (let i = 0; i < 6; i++) await h.load(`/face${i}.webp`);
  assert.equal(h.el('clinic-tour').dataset.state, 'error');
  assert.match(h.el('status-message').textContent, /matching square images/);
});

test('all production rooms have loadable assets and three complete cube sets', async () => {
  const sharp = createRequire(new URL('../astro-site/package.json', import.meta.url))('sharp');
  const data = (await readFile(new URL('../astro-site/src/data/clinic-tour.js', import.meta.url), 'utf8'))
    .replace('import.meta.env.BASE_URL', "'/immortals-site/'").replace('export const scenes', 'const scenes');
  const scenes = vm.runInNewContext(`${data}; scenes`);
  assert.equal(scenes.length, 6);
  assert.equal(scenes[0].id, 'main-entrance');
  assert.equal(scenes.filter(s => s.projection === 'cube').length, 3);
  for (const scene of scenes) {
    let size;
    const paths = scene.faces || [scene.src];
    if (scene.projection === 'cube') assert.equal(paths.length, 6);
    for (const src of paths) {
      const file = new URL(`../astro-site/public/${src.replace('/immortals-site/', '')}`, import.meta.url);
      const { width, height } = await sharp(await readFile(file)).metadata();
      if (scene.projection === 'cube') {
        assert.equal(width, height);
        if (size) assert.equal(width, size);
        size = width;
      } else assert.equal(width, height * 2);
    }
  }
});


test('desktop field of view stays below 90 degrees at every zoom level', async () => {
  const h = harness(); await h.load('/main-entrance.webp');
  const horizontalFov = () => 2 * Math.atan(h.values.lens * h.values.aspect) * 180 / Math.PI;
  assert.ok(Math.abs(horizontalFov() - 78) < .001);
  for (let i = 0; i < 12; i++) h.el('zoom-out').onclick();
  await flush();
  assert.ok(horizontalFov() <= 90.001);
});
