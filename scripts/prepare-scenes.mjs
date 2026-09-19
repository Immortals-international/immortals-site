import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const sharp=createRequire(new URL('../astro-site/package.json',import.meta.url))('sharp');
const source=path.resolve(process.argv[2] || 'verification/scene-pack/public');
const manifest=JSON.parse(await fs.readFile(path.join(source,'assets/scenes/manifest.json'),'utf8'));
for (const style of manifest.styles) {
  for (const im of style.images) {
    const original=path.join(source,im.src);
    im.sourceFile=im.src;
    im.sourceSha256=im.sha256;
    im.src=im.src.replace('.png','.webp');
    im.thumbnail=im.src.replace('.webp','-thumb.webp');
    const dest=path.join('astro-site/public',im.src);
    await fs.mkdir(path.dirname(dest),{recursive:true});
    await sharp(original).webp({quality:88,effort:5}).toFile(dest);
    await sharp(original).resize({width:400,withoutEnlargement:true}).webp({quality:78,effort:5}).toFile(path.join('astro-site/public',im.thumbnail));
    im.sha256=createHash('sha256').update(await fs.readFile(dest)).digest('hex');
    im.alt=im.alt.replace(' — ',' - ');
  }
}
manifest.sourceArchive='Immortals-Macau-24-Scene-Pack.zip';
manifest.pathNote='Display paths are relative to the public directory. Original PNG masters and source checksums are retained in the supplied archive.';
await fs.writeFile('astro-site/public/assets/scenes/manifest.json',JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile('astro-site/public/scenes-data.js','const sceneCatalog = '+JSON.stringify(manifest)+';\n');
console.log('Prepared 24 display images and 24 thumbnails without cropping or upscaling.');
