import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const sharp = createRequire(new URL('../astro-site/package.json', import.meta.url))('sharp');
const root = path.resolve(import.meta.dirname, '..');
const input = path.resolve(process.argv[2] || path.join(root, 'output'));
const output = path.join(input, 'all-lobby-water-2026-09-24');
const publicDir = path.join(root, 'astro-site/public');
const manifestPath = path.join(publicDir, 'assets/scenes/manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const hash = b => createHash('sha256').update(b).digest('hex');
const width=1600, height=900, fps=30, duration=8, tau=2*Math.PI;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const mod=(x,m)=>((x%m)+m)%m;
await fs.mkdir(output,{recursive:true});
const texturePath=path.join(input,'gallery-water-motion-2026-09-23/water-texture-reference.jpg');
const {data:texture,info:ti}=await sharp(texturePath).removeAlpha().raw().toBuffer({resolveWithObject:true});
const tw=ti.width, th=ti.height, overlap=32, period=th-overlap;
const gray=new Float32Array(tw*th);
let mean=0;
for(let i=0;i<gray.length;i++){gray[i]=texture[i*3]*.299+texture[i*3+1]*.587+texture[i*3+2]*.114;mean+=gray[i];}
mean/=gray.length;
function textureAt(x,y){
  x=clamp(x,0,tw-1.001);y=clamp(y,0,th-1.001);
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  return (gray[iy*tw+ix]*(1-fx)+gray[iy*tw+ix+1]*fx)*(1-fy)+(gray[(iy+1)*tw+ix]*(1-fx)+gray[(iy+1)*tw+ix+1]*fx)*fy;
}
function sample(x,y){
  y=mod(y,period);
  if(y<overlap){const a=smooth(y/overlap);return textureAt(x,y+period)*(1-a)+textureAt(x,y)*a;}
  return textureAt(x,y);
}
function inside(x,y,poly){
  let hit=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const [xi,yi]=poly[i],[xj,yj]=poly[j];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;
  }
  return hit;
}
function edgeDistance(x,y,poly){
  return Math.min(...poly.map(([ax,ay],i)=>{
    const [bx,by]=poly[(i+1)%poly.length],dx=bx-ax,dy=by-ay;
    const t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy),0,1);
    return Math.hypot(x-ax-t*dx,y-ay-t*dy);
  }));
}
const loops=[];
for(const style of manifest.styles){
  const scene=style.images.find(im=>im.id==='main-entrance');
  const shadow=style.id==='asian';
  const source=path.join(input,shadow?'shadow-timber-widescreen-2026-09-24/main-entrance.png':`clinic-scene-rollout-2026-09-23/${style.slug}/main-entrance.png`);
  const sourceBytes=await fs.readFile(source),meta=await sharp(sourceBytes).metadata();
  if(hash(sourceBytes)!==scene.sourceSha256)throw new Error(`Source mismatch: ${style.slug}`);
  // Remove only excess foreground floor from the three original 3:2 lobbies.
  const crop=shadow?null:{left:0,top:0,width:1536,height:864};
  let pipeline=sharp(sourceBytes);
  if(crop)pipeline=pipeline.extract(crop);
  const master=await pipeline.resize(width,height,{fit:'cover'}).png().toBuffer();
  await fs.writeFile(path.join(output,`${style.slug}.png`),master);
  if(!shadow){
    const full=await sharp(master).webp({quality:90}).toBuffer();
    const thumb=await sharp(master).resize(640,360).webp({quality:85}).toBuffer();
    await fs.writeFile(path.join(publicDir,scene.src),full);
    await fs.writeFile(path.join(publicDir,scene.thumbnail),thumb);
    Object.assign(scene,{width,height,thumbnailWidth:640,thumbnailHeight:360,sha256:hash(full),thumbnailSha256:hash(thumb),sourceCrop:crop});
  }
  style.aspectRatio='16:9';
  const still=await sharp(master).removeAlpha().raw().toBuffer();
  const blur=await sharp(master).removeAlpha().blur(7).raw().toBuffer();
  const sx=width/(crop?.width||meta.width),sy=height/(crop?.height||meta.height);
  const scale=poly=>poly.map(([x,y])=>[x*sx,y*sy]);
  const wall=scale(shadow?[[180,58],[269,128],[269,591],[180,625]]:[[195,49],[294,136],[294,640],[195,671]]);
  const pool=shadow?scale([[626,582],[906,582],[967,641],[565,641]]):null;
  const plinth=shadow?scale([[712,567],[833,567],[833,619],[712,619]]):null;
  const wallPixels=[],poolPixels=[],mask=new Uint8Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    if(inside(x,y,wall)){
      const u=(x-wall[0][0])/(wall[1][0]-wall[0][0]);
      const top=wall[0][1]+(wall[1][1]-wall[0][1])*u;
      const bottom=wall[3][1]+(wall[2][1]-wall[3][1])*u;
      wallPixels.push({i:(y*width+x)*3,u,v:(y-top)/(bottom-top),alpha:smooth(edgeDistance(x,y,wall)/2.5)*.91});
      mask[y*width+x]=1;
    }else if(pool&&inside(x,y,pool)&&!inside(x,y,plinth)){
      poolPixels.push({i:(y*width+x)*3,x,y,alpha:smooth(Math.min(edgeDistance(x,y,pool),edgeDistance(x,y,plinth))/3)});
      mask[y*width+x]=2;
    }
  }
  function frame(time){
    const out=Buffer.from(still),phase=mod(time,duration)/duration*tau;
    for(const {i,u,v,alpha} of wallPixels){
      const wave=2*Math.sin(v*29-phase*3+u*10)+.8*Math.sin(v*59-phase*5);
      const primary=sample(14+u*238+wave,v*740-phase/tau*period*2)-mean;
      const secondary=sample(250-u*225-wave*.6,v*540-phase/tau*period*3+64)-mean;
      const ripple=primary*.76+secondary*.20+Math.max(0,primary-35)*.22;
      for(let c=0;c<3;c++)out[i+c]=clamp(Math.round(still[i+c]*(1-alpha)+(blur[i+c]+ripple)*alpha),0,255);
    }
    for(const {i,x,y,alpha} of poolPixels){
      const dx=Math.round(1.5*Math.sin(x*.09+y*.16-phase*2));
      const dy=Math.round(Math.sin(x*.04+y*.3-phase*3));
      const at=(y+dy)*width+x+dx;
      const sourceIndex=mask[at]===2?at*3:i;
      const light=1.8*Math.sin(x*.07+y*.32-phase*2)+.8*Math.cos(x*.13-y*.15+phase*3);
      for(let c=0;c<3;c++)out[i+c]=clamp(Math.round(still[i+c]*(1-alpha)+(still[sourceIndex+c]+light)*alpha),0,255);
    }
    return out;
  }
  const first=frame(0),next=frame(1),end=frame(duration);
  let outside=0,seam=0,wallChange=0,poolChange=0;
  for(let i=0;i<first.length;i++){
    if(!mask[Math.floor(i/3)]&&first[i]!==next[i])outside++;
    seam=Math.max(seam,Math.abs(first[i]-end[i]));
    if(mask[Math.floor(i/3)]===1)wallChange+=Math.abs(first[i]-next[i]);
    if(mask[Math.floor(i/3)]===2)poolChange+=Math.abs(first[i]-next[i]);
  }
  const qa={style:style.id,width,height,fps,duration,wall,pool,excludedPlinth:plinth,changedChannelsOutsideWater:outside,loopEndpointMaxDifference:seam,wallMeanDifference:wallChange/(wallPixels.length*3),poolMeanDifference:poolPixels.length?poolChange/(poolPixels.length*3):null};
  if(outside||seam||!wallChange||(shadow&&!poolChange))throw new Error('Motion mask or loop check failed');
  await fs.writeFile(path.join(output,`${style.slug}-verification.json`),JSON.stringify(qa,null,2)+'\n');
  await sharp(first,{raw:{width,height,channels:3}}).png().toFile(path.join(output,`${style.slug}-frame-0.png`));
  await sharp(next,{raw:{width,height,channels:3}}).png().toFile(path.join(output,`${style.slug}-frame-1.png`));
  const maskPreview=Buffer.from(still);
  for(let i=0;i<mask.length;i++)if(mask[i]){maskPreview[i*3]=Math.round(still[i*3]*.5);maskPreview[i*3+1]=Math.round(still[i*3+1]*.5+127);maskPreview[i*3+2]=Math.round(still[i*3+2]*.5);}
  await sharp(maskPreview,{raw:{width,height,channels:3}}).png().toFile(path.join(output,`${style.slug}-mask.png`));
  const filename=`${style.slug}-water-loop`;
  const args=['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgb24','-video_size',`${width}x${height}`,'-framerate',String(fps),'-i','pipe:0',
    '-map','0:v','-an','-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',path.join(output,filename+'.mp4'),
    '-map','0:v','-an','-c:v','libvpx-vp9','-b:v','0','-crf','32','-row-mt','1','-cpu-used','4','-pix_fmt','yuv420p',path.join(output,filename+'.webm')];
  const ff=spawn('ffmpeg',args,{stdio:['pipe','inherit','inherit']});
  const done=once(ff,'exit');
  for(let n=0;n<fps*duration;n++)if(!ff.stdin.write(frame(n/fps)))await once(ff.stdin,'drain');
  ff.stdin.end();const [code]=await done;if(code!==0)throw new Error(`Encoding failed: ${style.slug}`);
  const sources=[];
  for(const ext of ['webm','mp4']){
    const bytes=await fs.readFile(path.join(output,filename+'.'+ext));
    const src=`assets/scenes/motion/${filename}.${ext}`;
    await fs.mkdir(path.dirname(path.join(publicDir,src)),{recursive:true});
    await fs.writeFile(path.join(publicDir,src),bytes);
    sources.push({src,type:`video/${ext}`,sha256:hash(bytes)});
  }
  loops.push({style:style.id,scene:'main-entrance',width,height,durationSeconds:duration,muted:true,sources});
  console.log(`${style.slug}: 16:9 crop, seamless water loop, zero changes outside water mask.`);
}
manifest.schemaVersion=3;
manifest.motions=loops;
delete manifest.motion;
manifest.pathNote='Display paths are relative to the public directory. Source hashes identify original masters; sourceCrop records intentional 16:9 crops in source pixels.';
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(path.join(publicDir,'scenes-data.js'),'const sceneCatalog = '+JSON.stringify(manifest)+';\n');
