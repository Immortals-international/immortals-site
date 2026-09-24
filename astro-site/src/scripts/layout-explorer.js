import { layouts as layoutOptions } from '../data/layouts.js';
// Floor-plan explorer shared by the single Layout page.
(() => {
const layouts = layoutOptions.map(plan => ({...plan, image: import.meta.env.BASE_URL + plan.image}));
let layoutIndex=0,zoom=1,lastFocus=null;
function readHash(){const requested=location.hash.slice(1);const id=['club','salon'].includes(requested)?'gallery':requested;const i=layouts.findIndex(p=>p.id===id);if(i>=0){layoutIndex=i;renderLayout();document.querySelector('#plans').scrollIntoView({block:'start'});}}
window.addEventListener('hashchange',readHash);
const planDialog=document.querySelector('#plan-dialog');
function replacePlanImage(selector,plan,alt){
  const previous=document.querySelector(selector);
  const next=previous.cloneNode(false);
  next.src=plan.image;
  next.alt=alt;
  previous.replaceWith(next);
}
function renderLayout() {
  const p = layouts[layoutIndex];
  replacePlanImage('#plan-image', p, `${p.name} floor plan: ${p.title}`);
  document.querySelector('#open-plan').setAttribute('aria-label', `Enlarge the ${p.name} floor plan`);
  document.querySelector('#plan-title').textContent = p.title;
  document.querySelector('#plan-description').textContent = p.description;
  document.querySelector('#plan-tradeoff').textContent = p.tradeoff;
  const facts = document.querySelector('#plan-facts');
  facts.replaceChildren(...[['Window frontage', p.frontage], ['Patient suites', p.suites], ['Arrival', p.arrivals]].map(([label, value]) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    return row;
  }));
  const allocation = document.querySelector('#allocation');
  allocation.hidden = !p.areas;
  allocation.innerHTML = p.areas ? '<p class="allocation-heading">Original indicative allocation</p>' + p.areas.map((a, i) => `<div class="allocation-row"><div class="allocation-label"><span>${['Discovery gallery', 'Lounge + coffee bar', 'Baccarat / flexible salon'][i]}</span><span>${a} m²</span></div><div class="allocation-bar"><div class="allocation-fill" style="width:${a / 168 * 100}%"></div></div></div>`).join('') : '';
  document.querySelectorAll('[data-layout]').forEach(b => {
    const active = Number(b.dataset.layout) === layoutIndex;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  if (planDialog.open) renderLargePlan();
}
function renderLargePlan(){const p=layouts[layoutIndex];document.querySelector('#plan-dialog-title').textContent=`${p.name} layout`;replacePlanImage('#large-plan',p,`Complete ${p.name} floor plan`);document.querySelectorAll('[data-modal-plan]').forEach(b=>{const a=Number(b.dataset.modalPlan)===layoutIndex;b.classList.toggle('active',a);b.setAttribute('aria-pressed',a)});setZoom(1)}
function setZoom(z){zoom=Math.max(1,Math.min(3,z));document.querySelector('#large-plan').style.width=`${zoom*100}%`;document.querySelector('#zoom-level').textContent=`${Math.round(zoom*100)}%`;document.querySelector('#zoom-out').disabled=zoom===1;document.querySelector('#zoom-in').disabled=zoom===3;if(zoom===1){const v=document.querySelector('.plan-viewport');v.scrollTop=0;v.scrollLeft=0}}
document.querySelectorAll('[data-layout]').forEach(b=>b.addEventListener('click',()=>{layoutIndex=Number(b.dataset.layout);renderLayout();history.replaceState(null,'','#'+layouts[layoutIndex].id)}));document.querySelectorAll('[data-modal-plan]').forEach(b=>b.addEventListener('click',()=>{layoutIndex=Number(b.dataset.modalPlan);renderLayout();history.replaceState(null,'','#'+layouts[layoutIndex].id)}));document.querySelector('#open-plan').addEventListener('click',()=>{lastFocus=document.activeElement;planDialog.showModal();document.body.classList.add('modal-open');renderLargePlan()});document.querySelector('#close-plan').addEventListener('click',()=>planDialog.close());document.querySelector('#zoom-in').addEventListener('click',()=>setZoom(zoom+.5));document.querySelector('#zoom-out').addEventListener('click',()=>setZoom(zoom-.5));document.querySelector('#zoom-reset').addEventListener('click',()=>setZoom(1));
planDialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');lastFocus?.focus({preventScroll:true})});
planDialog.addEventListener('click',e=>{if(e.target===planDialog){const r=planDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)planDialog.close()}});
// Warm the image cache so switching does not wait for another download.
layouts.forEach(p=>{const image=new Image();image.src=p.image});
renderLayout();
readHash();
})();
