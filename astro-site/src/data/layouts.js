import manifest from '../../public/assets/plan-manifest.json';

const image = id => {
  const version = id === 'gallery'
    ? manifest.referenceGallerySha256
    : manifest.plans.find(plan => plan.id === id).sha256;
  return `assets/plan-${id}.svg?v=${version.slice(0, 12)}`;
};

// Every concept activates the busy mall corner and moves support inward.
export const layouts = [
  {
    id: 'gallery', name: 'Gallery', title: 'An open discovery floor',
    description: 'A visible lab occupies the left shopfront triangle. An open discovery gallery leads to coffee and lounge seating at the busy bottom corner, with guest toilets moved behind an internal lobby.',
    frontage: 'Four private suites', suites: 'Four window suites', arrivals: 'Separate public and patient entrances',
    benefit: 'A visible lab attracts attention; the busiest corner becomes a public lounge.',
    tradeoff: 'Four suites keep the window frontage. Lab services, internal toilet access and the proposed corner glazing need detailed coordination.',
  },
  {
    id: 'windowfront', name: 'Public windowfront', title: 'The public gets the view',
    description: 'A discovery lounge brings demonstrations to the busy mall corner. A public promenade leads to the window café and glazed experience rooms, while four internal suites sit behind a separate clinical branch. Support moves beside the retained escape.',
    frontage: 'Public discovery and café', suites: 'Four internal suites', arrivals: 'One shared entrance with an internal split',
    benefit: 'Two public attractions connect the mall corner to the window frontage.',
    tradeoff: 'Patients give up an exclusive window suite. The long public route needs clear hosting, and the compact support core needs a measured fit test.',
  },
  {
    id: 'shared-club', name: 'Shared window club', title: 'The view becomes a shared amenity',
    description: 'The left entrance opens into a social salon across the whole lower tip. A discovery route leads to the shared window living room. Patients retain their right-hand arrival and internal suite cluster; toilets and support move into the upper clinical core.',
    frontage: 'Shared lounge, coffee and hosting', suites: 'Four internal suites', arrivals: 'Separate public and patient entrances',
    benefit: 'A lively corner salon and a quieter window club offer two reasons to stay.',
    tradeoff: 'Access to the window club needs a clear policy. Hosting and acoustic separation must protect the nearby patient suites.',
  },
  {
    id: 'two-destinations', name: 'Two destinations', title: 'A public destination and a private retreat',
    description: 'The bottom corner becomes a public forum for talks, demonstrations and small events. Behind it, a hosted hall links both entrances and branches into public and clinical wings. Toilets and support move into a central block; each wing keeps a share of the view.',
    frontage: 'Public café and private suites', suites: 'Two window suites and two internal suites', arrivals: 'Two entrances linked by a hosted hall',
    benefit: 'A visible public forum gives the two wings a common meeting place.',
    tradeoff: 'Events need acoustic separation from care. The two suite settings remain different, and the right-hand assessment strip needs a measured fit test.',
  },
  {
    id: 'patient-houses', name: 'Two patient houses', title: 'Care feels smaller and more personal',
    description: 'A neighbourhood living room with coffee occupies the mall corner, with the salons opening onto it. The public spine continues to a quiet window room between two care houses. Each suite pair keeps its local lounge and preparation space; support sits inside the care spine.',
    frontage: 'Patient houses around a public window room', suites: 'Two pairs with local lounge and preparation', arrivals: 'One hosted entrance with separate internal routes',
    benefit: 'A communal living room welcomes visitors while each patient belongs to a smaller care house.',
    tradeoff: 'Patients still travel to shared tests and treatment. The public spine needs clear boundaries around the two care houses.',
  },
].map(plan => ({ ...plan, image: image(plan.id) }));
