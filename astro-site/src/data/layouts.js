import manifest from '../../public/assets/plan-manifest.json';

const image = id => {
  const version = id === 'gallery'
    ? manifest.referenceGallerySha256
    : manifest.plans.find(plan => plan.id === id).sha256;
  return `assets/plan-${id}.svg?v=${version.slice(0, 12)}`;
};

// Gallery stays as the original reference. New concepts reopen frontage and arrival choices.
export const layouts = [
  {
    id: 'gallery', name: 'Gallery', title: 'An open discovery floor',
    description: 'Visitors enter directly into the gallery. More of the public floor is available for demonstrations and changing displays, with open coffee seating beyond.',
    frontage: 'Four private suites', suites: 'Four window suites', arrivals: 'Separate public and patient entrances',
    benefit: 'Discovery leads into private care.',
    tradeoff: 'The window frontage is reserved for private care; public discovery and hospitality occupy the shopfront side.',
    areas: [168, 64, 55],
  },
  {
    id: 'windowfront', name: 'Public windowfront', title: 'The public gets the view',
    description: 'Discovery and a working café follow the curved window frontage. Four private suites move into an internal clinical cluster, reached through a discreet branch from the shared arrival.',
    frontage: 'Public discovery and café', suites: 'Four internal suites', arrivals: 'One shared entrance with an internal split',
    benefit: 'The best frontage attracts and engages visitors.',
    tradeoff: 'Patients give up an exclusive window suite. The internal retreat needs to feel compelling during longer visits.',
  },
  {
    id: 'shared-club', name: 'Shared window club', title: 'The view becomes a shared amenity',
    description: 'A public entrance on the left leads through discovery toward the window living room. Patients arrive on the right and enter the private suite cluster. Hospitality is shared; support occupies the lower tip.',
    frontage: 'Shared lounge, coffee and hosting', suites: 'Four internal suites', arrivals: 'Separate public and patient entrances',
    benefit: 'An exceptional shared space gives people a reason to return.',
    tradeoff: 'Access to the window club needs a clear policy, with hosted thresholds between public activity and patient care.',
  },
  {
    id: 'two-destinations', name: 'Two destinations', title: 'A public destination and a private retreat',
    description: 'Public and clinical wings each receive a stretch of window frontage. Two entrances connect through a hosted arrival hall, with separate public and patient routes into the wings.',
    frontage: 'Public café and private suites', suites: 'Two window suites and two internal suites', arrivals: 'Two entrances linked by a hosted hall',
    benefit: 'Both sides have their own arrival and a share of the view.',
    tradeoff: 'The two suite settings create an uneven offer. The right-hand assessment strip needs particular attention in a measured fit test.',
  },
  {
    id: 'patient-houses', name: 'Two patient houses', title: 'Care feels smaller and more personal',
    description: 'Two pairs of suites sit around local lounges and preparation spaces. A public window café occupies the frontage between them, while dedicated assessments and HBOT remain shared.',
    frontage: 'Patient houses around a public café', suites: 'Two pairs with local lounge and preparation', arrivals: 'One hosted entrance with separate internal routes',
    benefit: 'Patients belong to a smaller, more personal care setting.',
    tradeoff: 'Visits still require trips to shared assessment and treatment rooms. Local care must do enough to make each house meaningful.',
  },
].map(plan => ({ ...plan, image: image(plan.id) }));
