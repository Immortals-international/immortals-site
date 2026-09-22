const header = document.querySelector('.clinic-header');
if (header) {
  const mobile = header.querySelector('.clinic-mobile-toggle');
  const items = [...header.querySelectorAll('.clinic-nav-item')];
  let current = null, closeTimer;
  const positionOverview = () => {
    if (!current || !matchMedia('(min-width:1001px)').matches) return;
    const label = current.querySelector('.clinic-nav-label > a').getBoundingClientRect();
    const row = current.querySelector('.clinic-menu-top').getBoundingClientRect();
    const overview = current.querySelector('.clinic-menu-overview');
    overview.style.setProperty('--overview-offset', `${Math.max(0, Math.min(label.left-row.left, row.width-overview.offsetWidth))}px`);
  };
  const close = (focus = false) => {
    clearTimeout(closeTimer);
    if (!current) return;
    const item = current;
    item.querySelector('.clinic-mega').hidden = true;
    item.querySelector('.clinic-menu-toggle').setAttribute('aria-expanded', 'false');
    current = null;
    header.classList.remove('mega-open');
    if (focus) item.querySelector('.clinic-menu-toggle').focus();
  };
  const open = item => {
    clearTimeout(closeTimer);
    if (current === item) return;
    close(); current = item;
    item.querySelector('.clinic-mega').hidden = false;
    item.querySelector('.clinic-menu-toggle').setAttribute('aria-expanded', 'true');
    header.classList.add('mega-open');
    positionOverview();
  };
  const closeMobile = () => {mobile.setAttribute('aria-expanded','false');header.classList.remove('nav-open');close();};
  mobile.addEventListener('click', () => {
    const opening = mobile.getAttribute('aria-expanded') !== 'true';
    mobile.setAttribute('aria-expanded',String(opening));header.classList.toggle('nav-open',opening);
    if (!opening) close();
  });
  items.forEach(item => {
    item.addEventListener('pointerenter',()=>clearTimeout(closeTimer));
    item.querySelector('.clinic-menu-toggle').addEventListener('click',()=>current===item?close():open(item));
    item.querySelector('.clinic-nav-label > a').addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&matchMedia('(min-width:1001px)').matches)open(item)});
    item.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&matchMedia('(min-width:1001px)').matches)closeTimer=setTimeout(()=>{if(!item.contains(document.activeElement))close()},180)});
    item.addEventListener('focusout',()=>setTimeout(()=>{if(current===item&&!item.contains(document.activeElement))close()},0));
  });
  header.querySelector('.clinic-nav-direct').addEventListener('pointerenter',()=>close());
  document.addEventListener('keydown', e=>{if(e.key==='Escape'){if(current)close(true);else if(header.classList.contains('nav-open')){closeMobile();mobile.focus();}}});
  document.addEventListener('click',e=>{if(!header.contains(e.target)){close();closeMobile();}});
  header.querySelectorAll('.clinic-mega a').forEach(a=>a.addEventListener('click',()=>closeMobile()));
  window.addEventListener('resize',positionOverview);
  matchMedia('(min-width:1001px)').addEventListener('change',closeMobile);
}
