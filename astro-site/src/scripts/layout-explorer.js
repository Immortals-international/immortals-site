// Floor-plan explorer shared by the single Layout page.
(() => {
const layouts=[{id:'club',image:'assets/plan-club.svg?v=1eb2e6a2e6d3',name:'Club',title:'A lounge-led welcome',description:'Arrival opens into a generous lounge. A defined threshold leads into the gallery, with a balanced amount of space for conversation, discovery and hosted sessions.',areas:[101,116,70],tradeoff:'The balance: the largest dedicated lounge of the three options, with a mid-sized gallery and flexible salon.'},{id:'gallery',image:'assets/plan-gallery.svg?v=dd16cd0c82d2',name:'Gallery',title:'An open discovery floor',description:'Visitors enter directly into the gallery. More of the public floor is available for demonstrations and changing displays, with open coffee seating beyond.',areas:[168,64,55],tradeoff:'The trade-off: the largest gallery, with less space allocated to the lounge and enclosed flexible salon.'},{id:'salon',image:'assets/plan-salon.svg?v=e02763a862c1',name:'Salon',title:'A larger flexible salon',description:'A larger enclosed salon takes the shopfront side. This creates room for hosted group sessions and future equipment configurations, alongside a generous lounge.',areas:[78,99,105],tradeoff:'The trade-off: the largest flexible salon, with a smaller open discovery floor.'}];
layouts.forEach(p => { p.image = import.meta.env.BASE_URL + p.image; });
let layoutIndex=0,zoom=1,lastFocus=null;
function readHash(){const i=layouts.findIndex(p=>p.id===location.hash.slice(1));if(i>=0){layoutIndex=i;renderLayout();document.querySelector('#plans').scrollIntoView({block:'start'});}}
window.addEventListener('hashchange',readHash);
const planDialog=document.querySelector('#plan-dialog');
function replacePlanImage(selector,plan,alt){
  const previous=document.querySelector(selector);
  const next=previous.cloneNode(false);
  next.src=plan.image;
  next.alt=alt;
  previous.replaceWith(next);
}
function renderLayout(){const p=layouts[layoutIndex];replacePlanImage('#plan-image',p,`${p.name} floor plan: ${p.title}`);document.querySelector('#open-plan').setAttribute('aria-label',`Enlarge the ${p.name} floor plan`);document.querySelector('#plan-number').textContent=`LAYOUT 0${layoutIndex+1}`;document.querySelector('#plan-title').textContent=p.title;document.querySelector('#plan-description').textContent=p.description;document.querySelector('#plan-tradeoff').textContent=p.tradeoff;document.querySelector('#allocation').innerHTML=p.areas.map((a,i)=>`<div class="allocation-row"><div class="allocation-label"><span>${['Gallery','Lounge + coffee bar','Baccarat / flexible salon'][i]}</span><span>${a} m²</span></div><div class="allocation-bar"><div class="allocation-fill" style="width:${a/168*100}%"></div></div></div>`).join('');document.querySelectorAll('[data-layout]').forEach(b=>{const a=Number(b.dataset.layout)===layoutIndex;b.classList.toggle('active',a);b.setAttribute('aria-pressed',a)});if(planDialog.open)renderLargePlan()}
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
