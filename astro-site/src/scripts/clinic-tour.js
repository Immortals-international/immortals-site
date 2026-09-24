import { scenes } from '../data/clinic-tour';

// Adapted from the supplied standalone WebGL viewer. Render only on interaction.
const $ = (id) => document.getElementById(id);
const canvas = $('tour-canvas');
const stage = $('clinic-tour');
const status = $('tour-status');
const selector = $('room-select');
const nextMarker = $('next-marker');
const backMarker = $('back-marker');
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const wrap = (i) => (i + scenes.length) % scenes.length;

function showStatus(message, error = false, retry = false) {
  status.hidden = false;
  status.classList.toggle('error', error);
  $('status-message').textContent = message;
  $('retry-room').hidden = !retry;
}

function initialise() {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) throw new Error('This browser cannot display the tour. Enable hardware acceleration or try another browser.');
  const vertex = 'attribute vec2 a; varying vec2 p; void main(){p=a;gl_Position=vec4(a,0.,1.);}';
  const fragment = `precision highp float;
    varying vec2 p;
    uniform sampler2D panorama;
    uniform samplerCube roomCube;
    uniform bool isCube;
    uniform float yaw, pitch, aspect, lens;
    void main(){
      vec3 d=normalize(vec3(p.x*aspect*lens,p.y*lens,1.));
      d=vec3(d.x,d.y*cos(pitch)+d.z*sin(pitch),-d.y*sin(pitch)+d.z*cos(pitch));
      d=vec3(d.x*cos(yaw)+d.z*sin(yaw),d.y,-d.x*sin(yaw)+d.z*cos(yaw));
      if(isCube){gl_FragColor=textureCube(roomCube,d);}
      else {
        vec2 uv=vec2(fract(atan(d.x,d.z)/6.28318530718+.5),asin(clamp(d.y,-1.,1.))/3.14159265359+.5);
        gl_FragColor=texture2D(panorama,uv);
      }
    }`;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('The 360° renderer could not start. Try another browser.');
    return s;
  }
  const program = gl.createProgram();
  const shaders = [shader(gl.VERTEX_SHADER, vertex), shader(gl.FRAGMENT_SHADER, fragment)];
  shaders.forEach((s) => gl.attachShader(program, s));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('The 360° renderer could not start. Try another browser.');
  shaders.forEach((s) => gl.deleteShader(s));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['yaw','pitch','aspect','lens','panorama','roomCube','isCube'].map((n) => [n, gl.getUniformLocation(program, n)]));
  const cubeFaces = [gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
  const textures = [gl.createTexture(), gl.createTexture()];
  // Both sampler types must have complete textures, on distinct texture units.
  for (const [unit, target] of [[0, gl.TEXTURE_2D], [1, gl.TEXTURE_CUBE_MAP]]) {
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(target, textures[unit]);
    for (const face of unit ? cubeFaces : [target]) gl.texImage2D(face, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([12,18,32,255]));
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  gl.uniform1i(uniforms.panorama, 0); gl.uniform1i(uniforms.roomCube, 1);

  let yaw = 0, pitch = 0, fov = 78, ready = false, frame = 0, targetIndex = 0, loadToken = 0;
  const maxFov = () => scenes[targetIndex].maxFov ?? 90;
  let prefetchTimer;
  const imageCache = new Map();
  function imagesFor(scene) {
    if (scene.projection === 'cube' && !scene.faces) return Promise.reject(new Error('This room’s cube faces are unavailable. Please explore another room.'));
    if (imageCache.has(scene.id)) {
      const result = imageCache.get(scene.id);
      imageCache.delete(scene.id); imageCache.set(scene.id, result);
      return result;
    }
    const paths = scene.projection === 'cube' ? scene.faces : [scene.src];
    const result = Promise.all(paths.map((src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('This room could not load. Check your connection and try again, or choose another room.'));
      img.src = src;
    })));
    imageCache.set(scene.id, result);
    while (imageCache.size > 2) imageCache.delete(imageCache.keys().next().value);
    result.catch(() => { if (imageCache.get(scene.id) === result) imageCache.delete(scene.id); });
    return result;
  }
  // FOV is measured along the longer viewport dimension. A fixed vertical FOV
  // previously expanded to 120+ degrees on desktop and stretched the room edges.
  function viewLens() {
    return Math.tan(fov * Math.PI / 360) / Math.max(1, canvas.clientWidth / canvas.clientHeight);
  }
  function positionMarker(element, markerYaw) {
    const markerPitch = -Math.atan(viewLens() * (canvas.clientHeight < 450 ? .04 : canvas.clientHeight < 650 ? .20 : .35));
    const x = Math.sin(markerYaw) * Math.cos(markerPitch), y = Math.sin(markerPitch), z = Math.cos(markerYaw) * Math.cos(markerPitch);
    const rx = x * Math.cos(yaw) - z * Math.sin(yaw), rz = x * Math.sin(yaw) + z * Math.cos(yaw);
    const ry = y * Math.cos(pitch) - rz * Math.sin(pitch), depth = y * Math.sin(pitch) + rz * Math.cos(pitch);
    const lens = viewLens(), aspect = canvas.clientWidth / canvas.clientHeight;
    const px = rx / (depth * lens * aspect), py = ry / (depth * lens);
    const left = (px + 1) * canvas.clientWidth / 2, top = (1 - py) * canvas.clientHeight / 2;
    // Keep projected arrows out of the controls and title, including small phones.
    const help = $('tour-help');
    const controls = help.getBoundingClientRect().height ? help : document.querySelector('.tour-toolbar');
    const lowerLimit = controls.getBoundingClientRect().top - stage.getBoundingClientRect().top - 65;
    const upperLimit = canvas.clientHeight < 450 ? 120 : 155;
    element.hidden = !ready || depth <= 0 || left < 85 || left > canvas.clientWidth - 85 || top < upperLimit || top > lowerLimit;
    element.style.left = `${left}px`; element.style.top = `${top}px`;
  }
  function render() {
    frame = 0;
    if (!ready) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * ratio), h = Math.round(canvas.clientHeight * ratio);
    if (!w || !h) return;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform1f(uniforms.yaw, yaw); gl.uniform1f(uniforms.pitch, pitch);
    gl.uniform1f(uniforms.aspect, w / h); gl.uniform1f(uniforms.lens, viewLens());
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    const sceneYaw = scenes[targetIndex].yaw ?? 0;
    positionMarker(nextMarker, sceneYaw); positionMarker(backMarker, sceneYaw + Math.PI);
  }
  function draw() { if (!frame) frame = requestAnimationFrame(render); }
  function reset() {
    yaw = scenes[targetIndex].yaw ?? 0; pitch = scenes[targetIndex].pitch ?? 0; fov = scenes[targetIndex].fov ?? 78;
    draw();
  }
  async function loadScene(index) {
    index = wrap(index); targetIndex = index;
    const token = ++loadToken, scene = scenes[index];
    clearTimeout(prefetchTimer);
    ready = false;
    stage.dataset.state = 'loading'; canvas.setAttribute('aria-busy', 'true');
    canvas.classList.add('loading'); nextMarker.hidden = true; backMarker.hidden = true;
    selector.value = String(index);
    $('room-name').textContent = scene.name;
    $('scene-count').textContent = `${String(index + 1).padStart(2, '0')} / 06`;
    const previous = scenes[wrap(index - 1)], next = scenes[wrap(index + 1)];
    $('next-name').textContent = $('next-label').textContent = next.name;
    $('back-name').textContent = $('previous-label').textContent = previous.name;
    nextMarker.setAttribute('aria-label', `Jump to ${next.name}`);
    backMarker.setAttribute('aria-label', `Back to ${previous.name}`);
    $('previous-room').setAttribute('aria-label', `Previous room: ${previous.name}`);
    $('next-room').setAttribute('aria-label', `Next room: ${next.name}`);
    showStatus(`Entering ${scene.name}…`);
    try {
      const images = await imagesFor(scene);
      if (token !== loadToken) return;
      const cube = scene.projection === 'cube';
      const maxSize = gl.getParameter(cube ? gl.MAX_CUBE_MAP_TEXTURE_SIZE : gl.MAX_TEXTURE_SIZE);
      if (images.some((img) => img.width > maxSize || img.height > maxSize)) throw new Error('This device cannot load this room at its supplied resolution. Try another device.');
      if (cube && (images.length !== 6 || images.some((img) => img.width !== img.height || img.width !== images[0].width))) throw new Error('The six room cube faces must be matching square images.');
      gl.activeTexture(cube ? gl.TEXTURE1 : gl.TEXTURE0);
      gl.bindTexture(cube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, textures[cube ? 1 : 0]);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !cube);
      images.forEach((img, i) => gl.texImage2D(cube ? cubeFaces[i] : gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img));
      if (gl.getError() !== gl.NO_ERROR) throw new Error('This room could not be displayed. Please try again.');
      gl.uniform1i(uniforms.isCube, cube ? 1 : 0);
      ready = true; reset();
      stage.dataset.state = 'ready'; stage.dataset.room = scene.id;
      status.hidden = true; canvas.setAttribute('aria-busy', 'false'); canvas.classList.remove('loading');
      history.replaceState(null, '', `#${scene.id}`);
      document.title = `${scene.name} · Explore the clinic | Immortals`;
      $('tour-announcer').textContent = `Room ${index + 1} of 6: ${scene.name}`;
      // Warm only the next room, after the visible scene is ready. Respect data saving.
      if (!navigator.connection?.saveData && !/2g/.test(navigator.connection?.effectiveType || '')) {
        prefetchTimer = setTimeout(() => { imagesFor(next).catch(() => {}); }, 900);
      }
    } catch (error) {
      if (token !== loadToken) return;
      stage.dataset.state = 'error'; canvas.setAttribute('aria-busy', 'false');
      showStatus(error.message, true, Boolean(scene.src || scene.faces));
    }
  }
  selector.addEventListener('change', () => loadScene(Number(selector.value)));
  nextMarker.onclick = $('next-room').onclick = () => loadScene(targetIndex + 1);
  backMarker.onclick = $('previous-room').onclick = () => loadScene(targetIndex - 1);
  $('retry-room').onclick = () => loadScene(targetIndex);
  $('reset').onclick = reset;
  $('zoom-in').onclick = () => { fov = clamp(fov - 8, 45, maxFov()); draw(); };
  $('zoom-out').onclick = () => { fov = clamp(fov + 8, 45, maxFov()); draw(); };
  const requested = scenes.findIndex((scene) => scene.id === location.hash.slice(1));
  loadScene(requested < 0 ? 0 : requested);
  addEventListener('hashchange', () => {
    const index = scenes.findIndex((scene) => scene.id === location.hash.slice(1));
    if (index >= 0) loadScene(index);
  });

  const pointers = new Map();
  let pinchDistance = 0;
  function distance() { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); }
  canvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId); canvas.classList.add('dragging'); canvas.focus({ preventScroll: true });
    if (pointers.size === 2) pinchDistance = distance();
  });
  canvas.addEventListener('pointermove', (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      const scale = fov * Math.PI / 180 / Math.max(canvas.clientWidth, canvas.clientHeight);
      yaw -= (event.clientX - previous.x) * scale;
      pitch = clamp(pitch + (event.clientY - previous.y) * scale, -Math.PI / 2, Math.PI / 2);
    } else if (pointers.size === 2) {
      const current = distance();
      if (pinchDistance > 0 && current > 0) fov = clamp(fov * pinchDistance / current, 45, maxFov());
      pinchDistance = current;
    }
    draw();
  });
  function release(event) { pointers.delete(event.pointerId); pinchDistance = 0; if (!pointers.size) canvas.classList.remove('dragging'); }
  ['pointerup','pointercancel','lostpointercapture'].forEach((name) => canvas.addEventListener(name, release));
  canvas.addEventListener('wheel', (event) => { event.preventDefault(); fov = clamp(fov + event.deltaY * .045, 45, maxFov()); draw(); }, { passive: false });
  canvas.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowLeft': yaw -= .09; break;
      case 'ArrowRight': yaw += .09; break;
      case 'ArrowUp': pitch = clamp(pitch + .07, -Math.PI / 2, Math.PI / 2); break;
      case 'ArrowDown': pitch = clamp(pitch - .07, -Math.PI / 2, Math.PI / 2); break;
      case '+': case '=': fov = clamp(fov - 5, 45, maxFov()); break;
      case '-': fov = clamp(fov + 5, 45, maxFov()); break;
      case 'Home': reset(); break;
      default: return;
    }
    event.preventDefault(); draw();
  });
  function fullscreenState() {
    const active = Boolean(document.fullscreenElement || stage.classList.contains('expanded'));
    $('fullscreen').setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    $('fullscreen').setAttribute('aria-pressed', String(active));
    draw();
  }
  $('fullscreen').onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (stage.classList.contains('expanded')) stage.classList.remove('expanded');
      else if (stage.requestFullscreen) await stage.requestFullscreen();
      else stage.classList.add('expanded'); // Safari on iPhone: immersive in-page view.
    } catch { stage.classList.toggle('expanded'); }
    fullscreenState();
  };
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { stage.classList.remove('expanded'); fullscreenState(); } });
  document.addEventListener('fullscreenchange', fullscreenState);
  new ResizeObserver(draw).observe(stage);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault(); ++loadToken; ready = false; clearTimeout(prefetchTimer);
    nextMarker.hidden = backMarker.hidden = true; stage.dataset.state = 'error';
    showStatus('Graphics were interrupted. Reload the page to resume the tour.', true);
  });
}

try { initialise(); }
catch (error) {
  stage.dataset.state = 'error';
  showStatus(error.message, true);
  stage.querySelectorAll('button, select').forEach((control) => { control.disabled = true; });
}
