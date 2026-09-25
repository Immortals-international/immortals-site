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
    description: 'A working lab replaces the lower discovery lounge, with exterior glazing facing the two mall walkways. A public promenade leads from the shared entrance to the window café and glazed experience rooms. Four internal suites sit behind a separate clinical branch; support stays beside the retained escape.',
    frontage: 'Public discovery and café', suites: 'Four internal suites', arrivals: 'One shared entrance with an internal split',
    benefit: 'The lab attracts passersby at the mall junction; the window café provides the main public lounge.',
    tradeoff: 'Patients give up an exclusive window suite. The long public route needs clear hosting, and the compact support core needs a measured fit test.',
  },
  {
    id: 'shared-club', name: 'Shared window club', title: 'The view becomes a shared amenity',
    description: 'A working lab replaces the lower social salon and presents its work through windows facing the mall walkways. The left entrance opens into a clear foyer and discovery route to the shared window club, the main public lounge. Patients retain their right-hand arrival and internal suite cluster.',
    frontage: 'Shared lounge, coffee and hosting', suites: 'Four internal suites', arrivals: 'Separate public and patient entrances',
    benefit: 'A mall-facing lab creates an outward attraction while the shared window club provides the main hospitality space.',
    tradeoff: 'Access to the window club needs a clear policy. Hosting and acoustic separation must protect the nearby patient suites.',
  },
  {
    id: 'two-destinations', name: 'Two destinations', title: 'A public destination and a private retreat',
    description: 'The bottom corner becomes a public forum for talks, demonstrations and small events. A working lab occupies the shopfront triangle beside the public arrival, with an exterior window directly facing the mall walkway. A hosted hall links both entrances, with a clear route around the internal support block to the window café and experience rooms. The private wing keeps its own share of the view.',
    frontage: 'Public café and private suites', suites: 'Two window suites and two internal suites', arrivals: 'Two entrances linked by a hosted hall',
    benefit: 'A visible public forum gives the two wings a common meeting place.',
    tradeoff: 'Events need acoustic separation from care. The two suite settings remain different, and the right-hand assessment strip needs a measured fit test.',
  },
  {
    id: 'patient-houses', name: 'Two patient houses', title: 'Care feels smaller and more personal',
    description: 'A working lab replaces the corner living room, with exterior windows facing the mall walkways. A separate foyer keeps both salons accessible outside the lab. Coffee and public seating move to the window room between the two care houses. Each suite pair retains its local lounge and preparation space.',
    frontage: 'Patient houses around a public window room', suites: 'Two pairs with local lounge and preparation', arrivals: 'One hosted entrance with separate internal routes',
    benefit: 'The corner showcases the lab to passersby; one public window café serves the two care houses.',
    tradeoff: 'Patients still travel to shared tests and treatment. The public spine needs clear boundaries around the two care houses.',
  },
].map(plan => ({ ...plan, image: image(plan.id) }));
