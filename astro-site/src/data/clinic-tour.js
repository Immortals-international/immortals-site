const asset = (name) => `${import.meta.env.BASE_URL}assets/clinic-tour/${name}`;
const cube = (id, name) => ({
  id, name, projection: 'cube', fov: 82, pitch: -.10,
  // Native WebGL cube target order: +X, -X, +Y, -Y, +Z, -Z.
  faces: ['right', 'left', 'up', 'down', 'front', 'back'].map((face) => asset(`cube-v2/${id}/${face}.webp`)),
});

// The Gallery plan shows shared circulation, not direct doors between these
// viewpoints. Keep the supplied editorial sequence; arrows explicitly say Jump to.
export const scenes = [
  { id: 'main-entrance', name: 'Main entrance', src: asset('main-entrance.webp') },
  { id: 'private-entrance', name: 'Private entrance', src: asset('private-entrance.webp') },
  cube('patient-suite', 'Patient suite'),
  cube('dexa', 'DEXA'),
  { id: 'vo2-max', name: 'VO₂ max', src: asset('vo2-max.webp') },
  cube('hyperbaric', 'Hyperbaric'),
];
