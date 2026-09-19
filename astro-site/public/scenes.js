(() => {
  const {styles, scenes} = sceneCatalog;
  let sceneIndex=0, styleIndex=0, zoom=1, returnFocus=null;
  const imageAt=(style, index=sceneIndex)=>styles[style].images[index];
  let activeImage=0;
  const galleries=styles.map((style,i)=>{
    const el=document.querySelector(`#${style.id} .story-gallery`);
    el.setAttribute('role','region');
    el.setAttribute('aria-roledescription','carousel');
    el.setAttribute('aria-label',`${style.title} images`);
    const main=el.firstElementChild;
    main.classList.add('story-carousel-main');
    // The side image advances the carousel; only the main image opens the viewer.
    const oldSide=el.querySelector('.story-secondary .image-button');
    const preview=document.createElement('button');
    preview.className='image-button story-preview';
    preview.type='button';
    oldSide.replaceWith(preview);
    preview.addEventListener('click',()=>selectImage(activeImage+1));
    const controls=document.createElement('div');
    controls.className='story-carousel-controls';
    controls.innerHTML=`<button data-image-step="-1" aria-label="Previous image for ${style.title}">←</button><span class="story-carousel-count" aria-live="polite">01 / 06</span><button data-image-step="1" aria-label="Next image for ${style.title}">→</button>`;
    main.append(controls);
    controls.querySelectorAll('[data-image-step]').forEach(b=>b.addEventListener('click',()=>selectImage(activeImage+Number(b.dataset.imageStep))));
    el.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();selectImage(activeImage+(e.key==='ArrowRight'?1:-1));}});
    el.querySelectorAll('.image-button').forEach(b=>bindSwipe(b,d=>selectImage(activeImage+d)));
    return el;
  });
  function selectImage(index){
    activeImage=(index+scenes.length)%scenes.length;
    galleries.forEach((el,i)=>{
      const im=styles[i].images[activeImage],next=styles[i].images[(activeImage+1)%scenes.length];
      const main=el.querySelector('.story-carousel-main .image-button'),preview=el.querySelector('.story-preview');
      main.dataset.view=im.id;
      main.setAttribute('aria-label',`Enlarge ${im.label} - ${styles[i].title}`);
      main.innerHTML=`<div class="story-room"><img src="${im.src}" alt="${im.alt}" width="${im.width}" height="${im.height}" loading="lazy" decoding="async"></div><span class="image-caption"><span>${im.label}</span><span>Enlarge ↗</span></span>`;
      preview.setAttribute('aria-label',`Show next image: ${next.label} - ${styles[i].title}`);
      preview.innerHTML=`<span class="story-room"><img src="${next.src}" alt="${next.alt}" width="${next.width}" height="${next.height}" loading="lazy" decoding="async"></span><span class="image-caption"><span>${next.label}</span><span aria-hidden="true">→</span></span>`;
      el.querySelector('.story-carousel-count').textContent=`0${activeImage+1} / 06`;
    });
  }
  selectImage(0);
  const dialog=document.createElement('dialog');
  dialog.id='scene-dialog';dialog.setAttribute('aria-labelledby','scene-dialog-title');
  dialog.innerHTML=`<div class="scene-dialog-head"><div><p class="eyebrow" id="scene-dialog-style"></p><h2 id="scene-dialog-title"></h2></div><button class="close" id="scene-close" autofocus aria-label="Close room image">Close ×</button></div><div class="scene-style-tabs" role="group" aria-label="Architectural direction">${styles.map((s,i)=>`<button data-scene-style="${i}" aria-pressed="false">0${i+1} / ${s.title}</button>`).join('')}</div><div class="scene-room-tabs" role="group" aria-label="Room">${scenes.map((s,i)=>`<button data-lightbox-scene="${i}" aria-pressed="false">${s.label}</button>`).join('')}</div><div class="scene-viewport" tabindex="0" aria-label="Room image. Use zoom controls and scroll to explore."><div class="scene-image-size"><img id="scene-full-image" alt="" decoding="async"></div></div><div class="scene-dialog-controls"><button id="scene-previous" aria-label="Previous room">← Previous room</button><span id="scene-position" aria-live="polite"></span><div class="scene-zoom"><button id="scene-zoom-out" aria-label="Zoom out">−</button><span id="scene-zoom-level">100%</span><button id="scene-zoom-in" aria-label="Zoom in">+</button><button id="scene-fit">Fit</button></div><button id="scene-next" aria-label="Next room">Next room →</button></div>`;
  document.body.append(dialog);
  const viewport=dialog.querySelector('.scene-viewport');
  function selectScene(index){
    sceneIndex=(index+scenes.length)%scenes.length;
    if(dialog.open)renderLightbox();
  }
  function setZoom(value){
    zoom=Math.max(1,Math.min(3,value));
    const size=dialog.querySelector('.scene-image-size');size.style.width=`${zoom*100}%`;size.style.height=`${zoom*100}%`;
    dialog.querySelector('#scene-zoom-level').textContent=`${Math.round(zoom*100)}%`;
    dialog.querySelector('#scene-zoom-out').disabled=zoom===1;
    dialog.querySelector('#scene-zoom-in').disabled=zoom===3;
    if(zoom===1){viewport.scrollLeft=0;viewport.scrollTop=0;}
  }
  function renderLightbox(){
    const im=imageAt(styleIndex),img=dialog.querySelector('#scene-full-image');
    img.src=im.src;img.alt=im.alt;img.width=im.width;img.height=im.height;
    dialog.querySelector('#scene-dialog-title').textContent=im.label;
    dialog.querySelector('#scene-dialog-style').textContent=styles[styleIndex].title;
    dialog.querySelector('#scene-position').textContent=`${sceneIndex+1} / ${scenes.length}`;
    dialog.querySelectorAll('[data-scene-style]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===styleIndex)));
    dialog.querySelectorAll('[data-lightbox-scene]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===sceneIndex)));
    setZoom(1);
  }
  function openScene(style,scene){
    returnFocus=document.activeElement;styleIndex=style;
    selectScene(Math.max(0,scenes.findIndex(s=>s.id===scene)));
    renderLightbox();dialog.showModal();document.body.classList.add('modal-open');
  }
  window.openRoomScene=openScene;
  dialog.querySelector('#scene-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');returnFocus?.focus({preventScroll:true});});
  dialog.querySelectorAll('[data-scene-style]').forEach(b=>b.addEventListener('click',()=>{styleIndex=Number(b.dataset.sceneStyle);renderLightbox();}));
  dialog.querySelectorAll('[data-lightbox-scene]').forEach(b=>b.addEventListener('click',()=>selectScene(Number(b.dataset.lightboxScene))));
  dialog.querySelector('#scene-previous').addEventListener('click',()=>selectScene(sceneIndex-1));
  dialog.querySelector('#scene-next').addEventListener('click',()=>selectScene(sceneIndex+1));
  dialog.querySelector('#scene-zoom-in').addEventListener('click',()=>setZoom(zoom+.5));
  dialog.querySelector('#scene-zoom-out').addEventListener('click',()=>setZoom(zoom-.5));
  dialog.querySelector('#scene-fit').addEventListener('click',()=>setZoom(1));
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){if(zoom>1&&e.target===viewport)return;e.preventDefault();selectScene(sceneIndex+(e.key==='ArrowRight'?1:-1));}});
  bindSwipe(viewport,d=>{if(zoom===1)selectScene(sceneIndex+d);});
  function bindSwipe(el,move){
    let start=null,swiped=false;
    el.addEventListener('touchstart',e=>{start=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;swiped=false;},{passive:true});
    el.addEventListener('touchend',e=>{if(!start||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;start=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5){swiped=true;move(dx<0?1:-1);}},{passive:true});
    el.addEventListener('touchcancel',()=>{start=null;},{passive:true});
    el.addEventListener('click',e=>{if(swiped){e.preventDefault();e.stopImmediatePropagation();swiped=false;}},true);
  }
})();
