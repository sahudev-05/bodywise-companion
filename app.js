'use strict';
const {catalog, weekdays, dateKey, newBottle, initial, estimate, record, undo} = Companion;
const key = 'bodywise-companion-v1';
const main = document.querySelector('main');
const dialog = document.querySelector('dialog');
const sheet = document.querySelector('#sheet');
let storageWarning = '';
function load() {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return initial();
    const data = JSON.parse(raw);
    if (data.version !== 1 || !['example','personal'].includes(data.mode)) throw Error();
    for (const mode of ['example','personal']) {
      const shelf = data[mode];
      if (!shelf || !Array.isArray(shelf.events) || !shelf.bottles) throw Error();
      for (const [id,b] of Object.entries(shelf.bottles)) {
        if (!Object.hasOwn(catalog,id) || b.id !== id || !Number.isFinite(b.remaining) ||
            !(b.size>0) || !Array.isArray(b.days) || !Array.isArray(b.slots)) throw Error();
      }
    }
    return data;
  } catch {
    storageWarning = 'Browser storage is unavailable or unreadable. Changes in this session are temporary.';
    return initial();
  }
}
let state = load();
let selected = '';
let toastTimer;
const fmt = n => Number(n.toFixed(2)).toLocaleString();
const shelf = () => state[state.mode];
const bottles = () => Object.values(shelf().bottles);
const page = () => location.hash.split('/')[0]==='#ingredients' ? 'ingredients' : ['today','shelf','journal'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'today';
const button = (action,label,attrs='',cl='') => `<button class="${cl}" data-action="${action}" ${attrs}>${label}</button>`;
const idAttr = id => `data-id="${id}"`;
const guideBtn = id => button('guide','Read product guide ↗',idAttr(id),'linkbtn');
const editBtn = (id,label='Edit bottle') => button('edit',label,idAttr(id));
function say(message) {
  clearTimeout(toastTimer);
  document.querySelector('#toast').textContent = message;
  toastTimer = setTimeout(() => document.querySelector('#toast').textContent='',3200);
}
function save(message) {
  if (!storageWarning) {
    try {localStorage.setItem(key,JSON.stringify(state));}
    catch {storageWarning = 'Browser storage is full or unavailable. Changes in this session are temporary.';}
  }
  render();
  say(message);
}
function modal(title,content) {
  sheet.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">${title}</h2>${button('close','×','aria-label="Close dialog"','close')}</div>${content}`;
  if (!dialog.open) dialog.showModal();
}
function slotsToday() {
  return bottles().filter(b=>!b.paused && b.days.includes(new Date().getDay()))
    .flatMap(b=>b.slots.map(slot=>({b,slot})))
    .sort((a,b)=>b.slot.localeCompare(a.slot));
}
function bottleForecast(b) {
  const est = estimate(b), percent = Math.round(est.percent);
  const unmeasured = shelf().events.some(e=>e.id===b.id && e.revision===b.revision && e.status==='Used' && !e.calibrated);
  const showDays = est.days!==null && !unmeasured;
  const number = showDays ? (est.days>0 && est.days<1?'&lt;1':Math.round(est.days)) : fmt(b.remaining);
  const caption = b.paused ? 'Routine paused' : unmeasured ? 'Last entered quantity. Update after unmeasured uses.' :
    showDays ? 'Estimated bottle life at your scheduled pace' : 'Add measured dispensing volume to estimate days left.';
  return `<div class="forecast"><div class="forecast-main"><strong>${number} ${showDays?'days':'mL'}</strong><small>${caption}</small></div>
  <div class="meter" style="--fill:${percent}%"><i></i></div><div class="spread"><small>${fmt(b.remaining)} of ${b.size} mL</small><small>${percent}% ${unmeasured?'last entered':'remaining'}</small></div>
  ${percent<=15?'<p class="warn">Running low? Check the bottle and update your estimate.</p>':''}
  ${button('estimate','See estimate details →',idAttr(b.id),'linkbtn')}</div>`;
}
function hero(id) {
  const p=catalog[id], b=shelf().bottles[id];
  return `<div class="hero">${bottleStage(id)}<section class="hero-info">
  <div class="kicker">${id==='lotion'?'Leave-on moisturiser':'Rinse-off cleanser'}</div><h2>${p.name}</h2>
  <p>${p.description}</p><div class="actions"><a class="primary btn" href="#ingredients/${id}">Explore ingredients →</a>
  ${guideBtn(id)}</div>${b?bottleForecast(b):`<div class="forecast"><p>Add this bottle to track your own schedule and remaining quantity.</p>${button('edit','Add to shelf',idAttr(id))}</div>`}</section></div>`;
}
function routine() {
  const slots = slotsToday();
  if (!slots.length) return '<div class="card">No uses scheduled today. <a href="#shelf">Manage your shelf →</a></div>';
  return `<div class="card">${slots.map(({b,slot})=>{
    const event = shelf().events.find(e=>e.day===dateKey() && e.id===b.id && e.slot===slot);
    const attrs = `${idAttr(b.id)} data-slot="${slot}"`;
    const controls = event ? `<span class="success">${event.status}</span> ${button('undo','Undo',attrs,'linkbtn')}` :
      button('used','Log use',attrs,'primary')+button('skipped','Skip today',attrs);
    return `<div class="row"><div><div class="slot">${slot}</div><h3>${catalog[b.id].name}</h3><small>${fmt(b.units)} ${b.unit}${b.units===1?'':'s'} per use${state.mode==='example'?' · Example routine':''}</small><div class="actions">${controls}</div></div></div>`;
  }).join('')}</div>`;
}
function catalogTiles() {
  return `<div class="tiles">${Object.entries(catalog).map(([id,p])=>`<article class="card catalog-card"><div class="catalog-photo">${packshot(id)}</div><div class="slot">${p.type} · ${p.size} mL</div>
    <h3>${p.name}</h3><p>${p.description}</p><a href="#ingredients/${id}">View ingredients →</a><div class="actions">${shelf().bottles[id]?editBtn(id,'Bottle settings'):button('edit','Add to shelf',idAttr(id),'primary')}</div></article>`).join('')}</div>`;
}
function today() {
  const id = selected || bottles()[0]?.id || 'lotion';
  return `<div class="eyebrow">${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</div>
    <div class="intro"><h1>Your routine</h1>${productTabs(id,'feature')}</div>${hero(id)}
    <div class="below"><section><div class="section-title"><h2>Today’s check-in</h2></div>${routine()}</section>
    <section><div class="section-title"><h2>Key ingredients</h2><a href="#ingredients/${id}">Full formula →</a></div>
    ${activeCards(id)}</section></div>`;
}
function shelfPage() {
  return `<div class="eyebrow">Product library</div><div class="intro"><h1>My shelf</h1></div>
    <div class="section-title"><h2>Your bottles</h2></div>${bottles().length?
    `<div class="tiles">${bottles().map(b=>`<article class="card"><div class="slot">${b.paused?'Paused':b.slots.join(' + ')} · ${b.days.length===7?'Every day':b.days.map(i=>weekdays[i]).join(', ')}</div>
    <h3>${catalog[b.id].name}</h3><p>${fmt(b.remaining)} / ${b.size} mL recorded</p>
    <div class="actions">${editBtn(b.id)}${button('pause',b.paused?'Resume':'Pause',idAttr(b.id))}</div></article>`).join('')}</div>`:
    '<p class="muted">Choose a product below to start your shelf.</p>'}
    <div class="section-title"><h2>Explore products</h2></div>${catalogTiles()}`;
}
function journal() {
  const events = [...shelf().events].reverse();
  return `<div class="eyebrow">Routine history</div><div class="intro"><h1>Your journal</h1></div><div class="card">${events.length?events.map(e=>`<div class="history"><div><small>${e.day} · ${e.slot}</small><h3>${catalog[e.id].name}</h3></div><div>${e.status}<br><small>${e.status==='Skipped'?'No deduction':e.calibrated?fmt(e.used)+' mL estimated':'Quantity unmeasured'}</small></div></div>`).join(''):'<h2>No check-ins yet.</h2><p>Log or skip a scheduled use on Today. Each entry will appear here.</p><a href="#today">Go to today →</a>'}</div>`;
}
function render() {
  const view = page();
  const modeButton = document.querySelector('#mode');
  modeButton.textContent = state.mode==='example'?'Example shelf':'Personal shelf';
  modeButton.setAttribute('aria-label',modeButton.textContent);
  for (const a of document.querySelectorAll('nav a')) {
    if(a.hash.split('/')[0]==='#'+view) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  }
  main.innerHTML = (storageWarning?`<p role="alert" class="notice">${storageWarning}</p>`:'')+({today,shelf:shelfPage,journal,ingredients:ingredientPage}[view]());
  mountViewer();
  document.title = 'Bodywise Companion · '+({today:'Today',shelf:'My shelf',journal:'Journal',ingredients:'Ingredients'}[view]);
}
function settings(id) {
  const b = shelf().bottles[id] || newBottle(id);
  const field = (name,label,value,min,max,step='any',required=true)=>`<label>${label}<input type="number" name="${name}" min="${min}" max="${max}" step="${step}" value="${value??''}" ${required?'required':''}></label>`;
  const checks = (name,list,values)=>list.map(([v,label])=>`<label><input type="checkbox" name="${name}" value="${v}" ${values.includes(v)?'checked':''}>${label}</label>`).join('');
  modal(shelf().bottles[id]?'Edit your bottle':'Set up your bottle',`<p>${catalog[id].name}</p><p class="hint">Enter your own usage and follow your package directions.${state.mode==='example'?' Changes here apply to the example shelf.':''}</p>
    <form id="settings" data-id="${id}"><div class="fields">
    ${field('size','Bottle capacity (mL)',b.size,0.01,10000)}${field('remaining','Remaining now (mL)',b.remaining,0,10000)}
    <label>Dispenser<select name="unit">${['pump','drop','portion','swipe'].map(u=>`<option ${b.unit===u?'selected':''}>${u}</option>`).join('')}</select></label>
    ${field('units','Units per application',b.units,0.01,1000)}${field('output','mL per unit (optional)',b.output,0.001,1000,'any',false)}</div>
    <p class="hint">Use your measured output or a value from the manufacturer. Leave blank to track uses manually.</p>
    <fieldset><legend>Scheduled days</legend><div class="choices">${checks('days',weekdays.map((s,i)=>[i,s]),b.days)}</div></fieldset>
    <fieldset><legend>Usual time</legend><div class="choices">${checks('slots',['Morning','Evening'].map(s=>[s,s]),b.slots)}</div></fieldset>
    <p class="notice" role="alert" id="error"></p><div class="actions"><button class="primary" type="submit">Save bottle</button></div></form>`);
}
document.addEventListener('submit',e=>{
  if(e.target.id!=='settings') return;
  e.preventDefault();
  const form = e.target, id = form.dataset.id, data = new FormData(form);
  const number = k=>Number(data.get(k));
  const days = data.getAll('days').map(Number), slots = data.getAll('slots');
  const remaining = number('remaining'), size = number('size');
  let err = '';
  if(!days.length || !slots.length) err='Select at least one day and one time.';
  if(remaining>size) err='Remaining quantity must fit inside the bottle.';
  if(err){document.querySelector('#error').textContent=err;return;}
  const b = shelf().bottles[id] || newBottle(id);
  const corrected = remaining !== b.remaining || size !== b.size || form.elements.remaining.dataset.edited==='yes';
  Object.assign(b,{size,remaining,days,slots,units:number('units'),unit:data.get('unit'),output:number('output')||null});
  if(corrected) b.revision++;
  shelf().bottles[id] = b;
  selected = id;
  dialog.close();
  save('Bottle saved.');
});
document.addEventListener('input',e=>{if(e.target.name==='remaining') e.target.dataset.edited='yes';});
document.addEventListener('change',e=>{if(e.target.id==='featured'){selected=e.target.value;render();}});
document.addEventListener('click',e=>{
  const el=e.target.closest('button');
  if(!el) return;
  const act=el.dataset.action, id=el.dataset.id, slot=el.dataset.slot, b=shelf().bottles[id];
  if(el.id==='mode') {
    const example = state.mode==='example';
    modal('Choose your shelf',`<div class="dialog-copy"><p>${example?'You’re exploring an example bottle. Its amounts and schedule are illustrative.':'Your personal shelf holds the products and schedule you entered.'}</p><p class="muted">Each shelf is saved separately in this browser. Clearing browser data removes your records.</p>${button('switch',example?'Start or open my personal shelf':'Explore the example shelf','','primary')}</div>`);
  }
  if(act==='feature'){selected=id;render();}
  if(act==='formula'){location.hash='ingredients/'+id;}
  if(act==='close') dialog.close();
  if(act==='switch'){state.mode=state.mode==='example'?'personal':'example';selected='';dialog.close();save('Shelf switched.');}
  if(act==='guide'){
    const p=catalog[id];
    modal(p.name,`<div class="dialog-copy"><p class="slot">Be Bodywise · ${p.size} mL</p><h3>How to use</h3><p>${p.guide}</p><h3>Before first use</h3><p>The brand advises a patch test. Avoid use if you notice redness, itching or irritation. Check your own label for the directions and ingredients for your pack.</p><a href="${p.source}" target="_blank" rel="noopener noreferrer">Official product instructions ↗</a><div class="actions">${button('open-formula','See full formula →',idAttr(id))}</div></div>`);
  }
  if(act==='open-formula'){dialog.close();location.hash='ingredients/'+id;}
  if(act==='edit') settings(id);
  if(act==='estimate' && b){
    const est=estimate(b);
    modal('Behind the estimate',`<div class="dialog-copy"><p>${catalog[id].name}</p><p>${fmt(b.remaining)} mL recorded from a ${b.size} mL bottle.</p><p>${b.output?`${b.units} ${b.unit}(s) × ${b.output} mL × ${b.slots.length} use(s) per scheduled day. Your schedule covers ${b.days.length} day(s) per week.`:'Dispensing volume is unknown. Update the remaining amount manually after use.'}</p>${est.daily?`<p>Weekly usage averages ${fmt(est.daily)} mL per calendar day. Divide the remaining amount by that average to estimate days left.</p>`:''}<p class="hint">${state.mode==='example'?'The example uses illustrative settings. ':''}The level bar shows the recorded quantity. Actual pump output and use can vary.</p>${editBtn(id,'Adjust estimate')}</div>`);
  }
  if(act==='pause' && b){b.paused=!b.paused;save(b.paused?'Routine paused.':'Routine resumed.');}
  if(act==='used'||act==='skipped'){
    if(record(shelf(),id,slot,act==='used'?'Used':'Skipped')) save(act==='used'?'Use recorded.':'Skipped. Bottle quantity is unchanged.');
  }
  if(act==='undo'){undo(shelf(),id,slot,dateKey());save('Check-in removed.');}
});
window.addEventListener('hashchange',()=>{render();main.focus();window.scrollTo(0,0);});
window.addEventListener('storage',e=>{if(e.key===key){state=load();if(dialog.open)dialog.close();render();}});
let displayedDay=dateKey();
function checkDay(){if(displayedDay!==dateKey()){displayedDay=dateKey();render();}}
document.addEventListener('visibilitychange',checkDay);
setInterval(checkDay,60000);
render();
