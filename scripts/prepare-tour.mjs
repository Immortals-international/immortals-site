import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const sharp = createRequire(new URL('../astro-site/package.json', import.meta.url))('sharp');
const source = path.resolve(process.argv[2]);
const output = new URL('../astro-site/public/assets/clinic-tour/', import.meta.url);
await fs.mkdir(output, { recursive: true });
const records = [];
for (const room of ['main-entrance', 'private-entrance', 'patient-suite', 'dexa', 'vo2-max']) {
  const original = await fs.readFile(path.join(source, 'assets', `${room}.png`));
  const metadata = await sharp(original).metadata();
  const display = await sharp(original).webp({ quality: 90, effort: 6 }).toBuffer();
  await fs.writeFile(new URL(`${room}.webp`, output), display);
  records.push({ room, source: `assets/${room}.png`, sourceSha256: createHash('sha256').update(original).digest('hex'), display: `${room}.webp`, displaySha256: createHash('sha256').update(display).digest('hex'), width: metadata.width, height: metadata.height, sourceBytes: original.length, displayBytes: display.length });
}
await fs.writeFile(new URL('manifest.json', output), `${JSON.stringify({ sourcePackage: 'Immortals-Six-Room-360', conversion: 'WebP quality 90, original dimensions, no crop or upscaling', images: records }, null, 2)}\n`);
console.log(`Prepared ${records.length} panoramas: ${records.reduce((sum, r) => sum + r.sourceBytes, 0)} source bytes → ${records.reduce((sum, r) => sum + r.displayBytes, 0)} display bytes.`);
