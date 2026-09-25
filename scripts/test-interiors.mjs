import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const sharp = createRequire(new URL('../astro-site/package.json',import.meta.url))('sharp');
const source = await readFile(new URL('../astro-site/src/scripts/scene-motion.js',import.meta.url),'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
function harness({reduced=false, blocked=false, deferred=false}={}) {
  class Element {
    constructor() { this.events={};this.dataset={};this.attributes={};this.hidden=false; }
    addEventListener(name,handler) { (this.events[name]??=[]).push(handler); }
    fire(name) { for(const handler of this.events[name]??[])handler(); }
    setAttribute(name,value) { this.attributes[name]=value; }
    toggleAttribute(name,on) { if(on)this.attributes[name]='';else delete this.attributes[name]; }
  }
  const video=new Element(),media=new Element(),slide=new Element(),doc=new Element(),motion=new Element();
  motion.matches=reduced; video.paused=true;video.calls=0;media.dataset.room='main-entrance';slide.inert=false;
  let pendingResolve,pendingReject;
  video.play=()=>{
    video.calls++;
    if(blocked)return Promise.reject(Object.assign(new Error('Blocked'),{name:'NotAllowedError'}));
    video.paused=false;
    if(deferred)return new Promise((resolve,reject)=>{pendingResolve=()=>{video.fire('playing');resolve();};pendingReject=reject;});
    video.fire('playing');return Promise.resolve();
  };
  video.pause=()=>{
    if(video.paused)return;
    video.paused=true;video.fire('pause');
    if(deferred)pendingReject?.(Object.assign(new Error('Cancelled'),{name:'AbortError'}));
  };
  media.querySelector=selector=>selector==='video'?video:null;
  media.closest=selector=>selector==='.carousel-slide'?slide:slide.inert?slide:null;
  doc.querySelectorAll=()=>[media];
  let intersect,mutate;
  vm.runInNewContext(source,{document:doc,window:{matchMedia:()=>motion},IntersectionObserver:class{constructor(fn){intersect=fn;}observe(){}},MutationObserver:class{constructor(fn){mutate=fn;}observe(){}}});
  return {video,media,doc,motion,slide,
    visible(on=true){intersect([{isIntersecting:on,intersectionRatio:on?1:0}]);},
    room(id){media.dataset.room=id;mutate();},
    inactive(on=true){slide.inert=on;mutate();},
    resolve(){pendingResolve();},
  };
}
test('motion starts only when visible and pauses on room, carousel and page changes',async()=>{
  const h=harness();assert.equal(h.video.calls,0);
  h.visible();await flush();assert.equal(h.video.paused,false);
  h.room('dexa');assert.equal(h.video.paused,true);
  h.room('main-entrance');await flush();assert.equal(h.video.paused,false);
  h.inactive();assert.equal(h.video.paused,true);
  h.inactive(false);await flush();assert.equal(h.video.paused,false);
  h.doc.hidden=true;h.doc.fire('visibilitychange');assert.equal(h.video.paused,true);
  h.doc.hidden=false;h.doc.fire('visibilitychange');await flush();assert.equal(h.video.paused,false);
  h.visible(false);assert.equal(h.video.paused,true);
});
test('reduced motion keeps the still and responds to preference changes without a button',async()=>{
  const h=harness({reduced:true});h.visible();await flush();assert.equal(h.video.calls,0);
  h.motion.matches=false;h.motion.fire('change');await flush();assert.equal(h.video.paused,false);
  h.motion.matches=true;h.motion.fire('change');assert.equal(h.video.paused,true);
  assert.equal(h.media.attributes['data-playing'],undefined);
});
test('autoplay rejection and broken video retain the still image',async()=>{
  const h=harness({blocked:true});h.visible();await flush();assert.equal(h.video.paused,true);
  assert.equal(h.media.attributes['data-playing'],undefined);
  h.video.fire('error');
  h.room('dexa');h.room('main-entrance');assert.equal(h.video.calls,1);
});
test('fast room switching recovers after an interrupted play request',async()=>{
  const h=harness({deferred:true});h.visible();h.room('dexa');h.room('main-entrance');await flush();
  assert.equal(h.video.calls,2);h.resolve();await flush();assert.equal(h.video.paused,false);
});
test('28 deployed images and thumbnails decode, match their manifest and preserve the intended source or crop proportions',async()=>{
  const publicRoot=new URL('../astro-site/public/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('assets/scenes/manifest.json',publicRoot),'utf8'));
  assert.equal(manifest.styles.length,4);assert.equal(manifest.scenes.length,7);
  assert.deepEqual(manifest.styles.map(s=>s.title),['Sculptural Minimalism','Shadow & Timber','Blue Mineral','Navy Residence']);
  for(const style of manifest.styles){
    assert.deepEqual(style.images.map(i=>i.id),manifest.scenes.map(s=>s.id));
    for(const im of style.images){
      for(const [file,hash] of [[im.src,im.sha256],[im.thumbnail,im.thumbnailSha256]]){
        const bytes=await readFile(new URL(file,publicRoot));
        assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,file);
        const meta=await sharp(bytes).metadata();assert.equal(meta.format,'webp');
        await sharp(bytes).raw().toBuffer();
        assert.ok(Math.abs(meta.width/meta.height-(im.sourceCrop?.width||im.sourceWidth)/(im.sourceCrop?.height||im.sourceHeight))<.004,file);
        if(file===im.src){assert.equal(meta.width,im.width);assert.equal(meta.height,im.height);}
      }
    }
  }
  assert.deepEqual(manifest.motions.map(m=>m.style),manifest.styles.map(s=>s.id));
  for(const motion of manifest.motions){
    assert.equal(motion.scene,'main-entrance');
    assert.deepEqual([motion.width,motion.height,motion.durationSeconds],[1600,900,8]);
    assert.deepEqual(motion.sources.map(s=>s.type),['video/webm','video/mp4']);
    for(const asset of motion.sources){
      assert.equal(createHash('sha256').update(await readFile(new URL(asset.src,publicRoot))).digest('hex'),asset.sha256);
    }
  }
});

test('All four directions use one 16:9 format across 28 scenes and thumbnails',async()=>{
  const publicRoot=new URL('../astro-site/public/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('assets/scenes/manifest.json',publicRoot),'utf8'));
  const images=manifest.styles.flatMap(s=>s.images);
  assert.equal(images.length,28);
  for(const image of images){
    for(const [file,width,height] of [[image.src,1600,900],[image.thumbnail,640,360]]){
      const meta=await sharp(await readFile(new URL(file,publicRoot))).metadata();
      assert.deepEqual([meta.width,meta.height],[width,height],file);
    }
  }
});
