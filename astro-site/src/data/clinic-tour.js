const asset = (name) => `${import.meta.env.BASE_URL}assets/clinic-tour/${name}`;
const cube = (id, name, { version = 'cube-v2', fov = 82, pitch = -.10 } = {}) => ({
  id, name, projection: 'cube', fov, pitch,
  // Native WebGL cube target order: +X, -X, +Y, -Y, +Z, -Z.
  faces: ['right', 'left', 'up', 'down', 'front', 'back'].map((face) => asset(`${version}/${id}/${face}.webp`)),
});

// The Gallery plan shows shared circulation, not direct doors between these
// viewpoints. Keep the supplied editorial sequence; arrows explicitly say Jump to.
export const scenes = [
  // Approved divider-side view toward reception, the public entrance and lab.
  { id: 'main-entrance', name: 'Main entrance', src: asset('main-entrance.webp?v=e722f3c1d880'), yaw: -.045 * Math.PI * 2, fov: 96, maxFov: 96 },
  cube('private-entrance', 'Private entrance', { version: 'cube-v3', fov: 78, pitch: 0 }),
  cube('patient-suite', 'Patient suite'),
  cube('dexa', 'DEXA'),
  cube('vo2-max', 'VO₂ max', { version: 'cube-v3', fov: 78, pitch: 0 }),
  cube('hyperbaric', 'Hyperbaric'),
];
