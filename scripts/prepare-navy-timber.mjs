import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const sharp=createRequire(new URL('../astro-site/package.json',import.meta.url))('sharp');
const root=path.resolve(import.meta.dirname,'..');
const input=path.resolve(process.argv[2]);
const publicDir=path.join(root,'astro-site/public');
const manifestPath=path.join(publicDir,'assets/scenes/manifest.json');
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
const style=manifest.styles.find(s=>s.id==='milanese');
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const image of style.images){
  const source=await fs.readFile(path.join(input,`${image.id}.png`));
  const meta=await sharp(source).metadata();
  if(Math.abs(meta.width/meta.height-16/9)>.004)throw new Error(`Unexpected source ratio: ${image.id}`);
  const master=await sharp(source).resize(1600,900,{fit:'cover',kernel:'lanczos3'}).sharpen({sigma:0.7,m1:0.5,m2:1.2}).png().toBuffer();
  await fs.mkdir(path.join(input,'web-masters'),{recursive:true});
  await fs.writeFile(path.join(input,'web-masters',`${image.id}.png`),master);
  // High-quality encoding retains the newly rendered grain, marble and fine edges.
  const full=await sharp(master).webp({quality:96,effort:6,smartSubsample:true}).toBuffer();
  const thumb=await sharp(master).resize(640,360,{kernel:'lanczos3'}).webp({quality:92,effort:6,smartSubsample:true}).toBuffer();
  await fs.writeFile(path.join(publicDir,image.src),full);
  await fs.writeFile(path.join(publicDir,image.thumbnail),thumb);
  Object.assign(image,{width:1600,height:900,thumbnailWidth:640,thumbnailHeight:360,sha256:hash(full),thumbnailSha256:hash(thumb),sourceFile:`${path.basename(input)}/${image.id}.png`,sourceSha256:hash(source),sourceWidth:meta.width,sourceHeight:meta.height,alt:`${image.label} - Navy Residence with smoked-oak flooring, Immortals Macau architectural concept`});
  delete image.sourceCrop;
  console.log(`${image.id}: 1600x900, full quality 96, thumbnail quality 92`);
}
style.release='2026-09-24-timber-floor';
style.aspectRatio='16:9';
style.exportSettings={quality:96,thumbnailQuality:92,sharpen:{sigma:0.7,m1:0.5,m2:1.2},mp4Crf:17,webmCrf:24};
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(path.join(publicDir,'scenes-data.js'),'const sceneCatalog = '+JSON.stringify(manifest)+';\n');
