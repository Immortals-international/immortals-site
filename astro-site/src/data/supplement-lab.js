import manifest from '../../public/assets/supplement-lab/manifest.json';
import { url } from './site';

export const supplementLab = {
  ...manifest,
  href: url('interior-design/supplement-lab/'),
  image: `${url(manifest.src)}?v=${manifest.sha256.slice(0, 12)}`,
  preview: `${url(manifest.thumbnail)}?v=${manifest.thumbnailSha256.slice(0, 12)}`,
  alt: 'A technician prepares supplements at an L-shaped oak counter, with ingredient cabinets and a sink, seen through the lab’s bronze-framed mall glazing.',
};
