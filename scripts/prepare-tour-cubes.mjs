import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const sharp = createRequire(new URL('../astro-site/package.json', import.meta.url))('sharp');
const input = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
const root = new URL('../astro-site/public/assets/clinic-tour/cube-v2/', import.meta.url);
const sha = (buffer) => createHash('sha256').update(buffer).digest('hex');
const manifest = { projection: 'cubemap', faceOrder: ['right', 'left', 'up', 'down', 'front', 'back'], generation: 'Built-in image generation from approved room renders, authorized by the user on 2026-09-21', conversion: 'WebP quality 92 at original square dimensions, no projection conversion or crop', rooms: [] };
for (const [name, faces] of Object.entries(input)) {
  const output = new URL(`${name}/`, root);
  await fs.mkdir(output, { recursive: true });
  const room = { id: name, faces: [] };
  let size;
  for (const face of manifest.faceOrder) {
    const original = await fs.readFile(faces[face]);
    const { width, height } = await sharp(original).metadata();
    if (width !== height || (size && size !== width)) throw Error(`${name}/${face}: cube faces must have matching square dimensions`);
    size = width;
    const display = await sharp(original).webp({ quality: 92, effort: 6 }).toBuffer();
    await fs.writeFile(new URL(`${face}.webp`, output), display);
    room.faces.push({ face, sourceFile: path.basename(faces[face]), sourceSha256: sha(original), file: `${name}/${face}.webp`, width, height, sha256: sha(display), bytes: display.length });
  }
  manifest.rooms.push(room);
}
await fs.writeFile(new URL('manifest.json', root), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared ${manifest.rooms.length} cubemaps (${manifest.rooms.reduce((n, r) => n + r.faces.length, 0)} faces).`);
