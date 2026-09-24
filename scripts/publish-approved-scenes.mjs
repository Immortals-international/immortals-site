import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const sharp = createRequire(new URL('../astro-site/package.json', import.meta.url))('sharp');
const root = path.resolve(import.meta.dirname, '..');
const pack = path.resolve(process.argv[2] || path.join(root, 'output/clinic-scene-rollout-2026-09-23'));
const entries = JSON.parse(await fs.readFile(path.join(pack, 'asset-index.json'), 'utf8'));
const ids = { 'sculptural-minimalism':'futurism', 'shadow-and-timber':'asian', 'blue-mineral':'aman', 'navy-residence':'milanese' };
const hash = data => createHash('sha256').update(data).digest('hex');
const publicDir = path.join(root, 'astro-site/public');
const scenes = [...new Map(entries.map(e => [e.scene, { id:e.scene, label:e.sceneName }])).values()];
if (entries.length !== 24 || scenes.length !== 6) throw new Error('Expected all 24 scenes.');
const manifest = { schemaVersion:2, release:'2026-09-23', layoutBasis:'Gallery', assetBase:'assets/scenes/', pathNote:'Display paths are relative to the public directory. Master hashes identify the approved local scene rollout; web exports retain the complete composition.', scenes, styles:[] };
for (const [slug,id] of Object.entries(ids)) {
  const images = [];
  const selected = entries.filter(e => e.direction === slug);
  if (new Set(selected.map(e => e.scene)).size !== 6) throw new Error(`Incomplete direction: ${slug}`);
  for (const entry of selected) {
    const masterFile = `${slug}/${path.basename(entry.master)}`;
    if (hash(await fs.readFile(path.join(pack, masterFile))) !== entry.sha256) throw new Error(`Master has changed: ${masterFile}`);
    const src = `assets/scenes/${id}/${entry.scene}.webp`;
    const thumbnail = src.replace('.webp','-thumb.webp');
    const bytes = await fs.readFile(path.join(pack, 'web-ready', slug, `${entry.scene}.webp`));
    const thumb = await fs.readFile(path.join(pack, 'web-ready', slug, `${entry.scene}-thumb.webp`));
    const {width,height} = await sharp(bytes).metadata();
    await fs.mkdir(path.dirname(path.join(publicDir,src)), {recursive:true});
    await fs.writeFile(path.join(publicDir,src), bytes);
    await fs.writeFile(path.join(publicDir,thumbnail), thumb);
    images.push({ id:entry.scene, label:entry.sceneName, src, thumbnail, width, height, alt:`${entry.sceneName} - ${entry.directionName}, Immortals Macau architectural concept`, sha256:hash(bytes), thumbnailSha256:hash(thumb), sourceFile:masterFile, sourceSha256:entry.sha256, sourceWidth:entry.width, sourceHeight:entry.height });
  }
  manifest.styles.push({id,slug,title:selected[0].directionName,images});
}
const motionDir = path.join(root, 'output/gallery-water-motion-2026-09-23');
const motion = { style:'aman', scene:'main-entrance', durationSeconds:8, muted:true, sources:[] };
for (const extension of ['webm','mp4']) {
  const filename = `blue-mineral-water-loop.${extension}`;
  const bytes = await fs.readFile(path.join(motionDir,filename));
  const src = `assets/scenes/motion/${filename}`;
  await fs.mkdir(path.dirname(path.join(publicDir,src)), {recursive:true});
  await fs.writeFile(path.join(publicDir,src),bytes);
  motion.sources.push({src,sha256:hash(bytes)});
}
manifest.motion = motion;
await fs.writeFile(path.join(publicDir,'assets/scenes/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(path.join(publicDir,'scenes-data.js'),'const sceneCatalog = '+JSON.stringify(manifest)+';\n');
console.log('Published 24 approved scene exports, 24 thumbnails and the two water-loop formats.');
