import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const sharp = createRequire(new URL('../astro-site/package.json', import.meta.url))('sharp');
const root = path.resolve(import.meta.dirname, '..');
if (!process.argv[2]) throw new Error('Pass the Shadow & Timber master image directory.');
const pack = path.resolve(process.argv[2]);
const publicDir = path.join(root, 'astro-site/public');
const manifestPath = path.join(publicDir, 'assets/scenes/manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const style = manifest.styles.find(s => s.id === 'asian');
const hash = data => createHash('sha256').update(data).digest('hex');
const images = await Promise.all(style.images.map(async image => {
  const master = await fs.readFile(path.join(pack, `${image.id}.png`));
  const meta = await sharp(master).metadata();
  // Generators may round a widescreen canvas by one pixel; reject other ratios.
  if (Math.abs(meta.width / meta.height - 16 / 9) > .004) {
    throw new Error(`${image.id} must be composed in 16:9 before publishing.`);
  }
  const full = await sharp(master).resize(1600, 900, {fit:'cover'}).webp({quality:90}).toBuffer();
  const thumb = await sharp(master).resize(640, 360, {fit:'cover'}).webp({quality:85}).toBuffer();
  return {image, master, meta, full, thumb};
}));
// Validate the entire set before replacing any public files.
for (const {image, master, meta, full, thumb} of images) {
  await fs.writeFile(path.join(publicDir, image.src), full);
  await fs.writeFile(path.join(publicDir, image.thumbnail), thumb);
  Object.assign(image, {
    width:1600, height:900, thumbnailWidth:640, thumbnailHeight:360,
    sha256:hash(full), thumbnailSha256:hash(thumb),
    sourceFile:`${path.basename(pack)}/${image.id}.png`, sourceSha256:hash(master),
    sourceWidth:meta.width, sourceHeight:meta.height,
  });
}
style.release = '2026-09-24';
style.aspectRatio = '16:9';
manifest.release = '2026-09-24';
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
await fs.writeFile(path.join(publicDir, 'scenes-data.js'), 'const sceneCatalog = ' + JSON.stringify(manifest) + ';\n');
console.log('Published six Shadow & Timber scenes at 1600 × 900 and thumbnails at 640 × 360.');
