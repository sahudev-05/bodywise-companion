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
let discoveryStep = 0;
let toastTimer;
const fmt = n => Number(n.toFixed(2)).toLocaleString();
const shelf = () => state[state.mode];
const bottles = () => Object.values(shelf().bottles);
const page = () => { const route=location.hash.split('/')[0].slice(1); return ['today','shelf','journal','compare','discover','wellness','loyalty'].includes(route)?route:route==='ingredients'?'ingredients':'discover'; };
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
  ${guideBtn(id)}</div>${expectation(p)}${b?bottleForecast(b):`<div class="forecast"><p>Add this bottle to track your own schedule and remaining quantity.</p>${button('edit','Add to shelf',idAttr(id))}</div>`}</section></div>`;
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
function brandLink(p) {
  return `<a href="${p.source}" target="_blank" rel="noopener noreferrer">Be Bodywise product guide ↗</a>`;
}
function expectation(p) {
  return `<section class="expectation"><h3>What to expect</h3><p>${p.expectation}</p><p>${p.timing}</p>${brandLink(p)}</section>`;
}
function startingPaths() {
  return `<div class="starting-paths" aria-label="Getting started">
    <a class="path-card" href="#compare"><strong>Help me choose</strong><span>Compare the wash and lotion</span></a>
    <button class="path-card" data-action="pick-owned"><strong>I own this already</strong><span>Set up my bottle and routine</span></button></div>`;
}
function chooseOwned() {
  modal('Which bottle do you own?',`<div class="owned-packs">${Object.entries(catalog).map(([id,p])=>
    `<button data-action="setup-owned" data-id="${id}">${packshot(id)}<span><strong>${p.name}</strong><small>${p.size} mL · ${state.personal.bottles[id]?'Edit my routine':'Set up my routine'}</small></span></button>`).join('')}</div>`);
}
function comparisonPage() {
  const ids=['wash','lotion'];
  const cells = renderCell => ids.map(id=>`<td>${renderCell(catalog[id],id)}</td>`).join('');
  const row = (label,renderCell) => `<tr><th scope="row">${label}</th>${cells(renderCell)}</tr>`;
  return `<a class="back-link" href="#today">← Your routine</a><div class="intro"><h1>Compare the bottles</h1></div>
    <table class="comparison" aria-label="Body wash and body lotion compared"><thead><tr><td></td>${ids.map(id=>`<th scope="col">${packshot(id)}<strong>${catalog[id].name}</strong><small>${catalog[id].size} mL</small></th>`).join('')}</tr></thead><tbody>
    ${row('What it’s for',p=>p.purpose)}${row('When to use it',p=>p.step)}${row('Rinse or leave on?',p=>p.finish)}
    ${row('What to expect',p=>p.expectation)}${row('Timing',p=>p.timing)}
    ${row('Product details',(p,id)=>`<a href="#ingredients/${id}">Full formula</a><br>${brandLink(p)}`)}
    ${row('Your routine',(p,id)=>button('setup-owned',state.personal.bottles[id]?'Edit my routine':'Set up my bottle',idAttr(id)+' aria-label="Set up '+p.short.toLowerCase()+'"','primary'))}
    </tbody></table>`;
}
function today() {
  const id = selected || bottles()[0]?.id || 'lotion';
  return `<div class="eyebrow">${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</div>
    <div class="intro"><h1>Your routine</h1><p class="muted">Your personal care, at your pace.</p>${productTabs(id,'feature')}</div><a class="home-discovery-cta" href="#discover"><span><strong>Not sure what suits you?</strong><small>Answer a few quick questions and get a relevant product shortlist.</small></span><span class="cta-arrow">Find my routine →</span></a>${startingPaths()}${hero(id)}
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
function updateDiscoveryStep() {
  const form=document.querySelector('#discovery-form');
  if(!form) return;
  const steps=[...form.querySelectorAll('[data-quiz-step]')];
  steps.forEach((step,i)=>step.hidden=i!==discoveryStep);
  const count=document.querySelector('#quiz-count'), fill=document.querySelector('#quiz-fill');
  if(count) count.textContent='Step '+(discoveryStep+1)+' of '+steps.length;
  if(fill) fill.style.width=((discoveryStep+1)/steps.length*100)+'%';
  const back=form.querySelector('[data-action="discovery-back"]');
  const next=form.querySelector('[data-action="discovery-next"]');
  const submit=form.querySelector('#discovery-submit');
  if(back) back.hidden=discoveryStep===0;
  if(next) next.hidden=discoveryStep===steps.length-1;
  if(submit) submit.hidden=discoveryStep!==steps.length-1;
}
function estimateMarkup(p) {
  if(!p.sizeMl || p.estimate===false) return '<p class="estimate-note">A month estimate is not shown here because the amount per swipe/application is difficult to measure reliably. Follow the pack directions.</p>';
  const ml=p.amount||1, uses=p.uses||7, months=p.sizeMl/(ml*uses)/4.345;
  return '<div class="usage-estimator"><strong>How long could this bottle last?</strong><div class="estimate-fields"><label>mL per use<input type="number" min="0.1" max="100" step="0.1" value="'+ml+'" data-estimate-id="'+p.id+'" data-estimate-ml></label><label>Uses per week<input type="number" min="0.1" max="70" step="0.5" value="'+uses+'" data-estimate-id="'+p.id+'" data-estimate-frequency></label></div><p id="estimate-'+p.id+'" class="estimate-result">At these example settings: about '+months.toFixed(1)+' months.</p><small>Estimate only: '+p.sizeMl+' mL ÷ (mL per use × uses per week). Actual use varies by body area, coverage and dispensing. Do not reduce the amount you use just to make a product last longer.</small></div>';
}
function discoveryProductCard(p,index) {
  return '<article class="match-card" data-size="'+(p.sizeMl||'')+'"><div class="match-card-top"><span class="product-category">'+p.category+'</span><span class="match-number">Match '+(index+1)+'</span></div><div class="product-visual"><span>'+p.name.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase()+'</span><small>'+p.category+'</small></div><div class="product-size">'+(p.sizeMl?p.sizeMl+' mL':p.sizeG?p.sizeG+' g':'Pack')+'</div><h3>'+p.name+'</h3><p>'+p.reason+'</p><p class="skin-note">'+p.skinNote+'</p>'+estimateMarkup(p)+'<a class="primary btn product-link" href="'+p.source+'" target="_blank" rel="noopener noreferrer">View on Be Bodywise ↗</a></article>';
}
function discoverPage() {
  discoveryStep=0;
  const productChecks=Discovery.products.map(p=>'<label class="quiz-choice compact"><input type="checkbox" name="owned" value="'+p.id+'"><span>'+p.name+'</span></label>').join('');
  return '<div class="eyebrow">Your personal skincare assistant</div><div class="intro"><h1>Let’s find what feels right for your skin.</h1><p class="muted">A short, guided conversation. You choose what to share, and you can change your answers at any time.</p></div>' +
    '<div class="discovery-layout"><form id="discovery-form" class="discovery-form"><div class="assistant-greeting"><span class="assistant-avatar">B</span><div><strong>Hi! I’m your Bodywise Companion.</strong><p>I’ll ask one thing at a time about your skin and routine. Then I’ll explain which products may fit—and why. No pressure to buy.</p></div></div><div class="quiz-progress"><span id="quiz-count">Step 1 of 5</span><div class="meter"><i id="quiz-fill" style="width:20%"></i></div></div>' +
    '<fieldset data-quiz-step="0"><legend>1. What area would you like help with?</legend><p class="hint">Choose the area you want to focus on first.</p><div class="quiz-options">' +
    [['face','Face'],['body','Body'],['underarms','Underarms'],['feet','Feet'],['multiple','More than one area']].map(([v,l])=>'<label class="quiz-choice"><input type="radio" name="area" value="'+v+'"><span>'+l+'</span></label>').join('')+'</div></fieldset>' +
    '<fieldset data-quiz-step="1" hidden><legend>2. How would you describe your skin?</legend><p class="hint">If you are unsure, that is completely fine.</p><div class="quiz-options">' +
    [['oily','Oily'],['dry','Dry'],['combination','Combination'],['normal','Normal'],['sensitive','Sensitive'],['unsure','Not sure']].map(([v,l])=>'<label class="quiz-choice"><input type="radio" name="skinType" value="'+v+'"><span>'+l+'</span></label>').join('')+'</div></fieldset>' +
    '<fieldset data-quiz-step="2"><legend>3. What would you like to work on?</legend><p class="hint">Select all that apply. We’ll use these concerns to find relevant products.</p><div class="quiz-options">' +
    [['acne','Occasional face acne'],['blackheads','Blackheads / clogged pores'],['dryness','Dry body skin'],['flaky','Very dry or flaky skin'],['hydration','Hydration'],['barrier','Skin barrier care'],['sun','Sun protection'],['body-acne','Body acne'],['bumps','Body bumps'],['dullness','Dull-looking skin'],['marks','Acne marks'],['odour','Underarm odour'],['underarm-pigmentation','Underarm pigmentation'],['heels','Cracked or rough heels'],['strawberry','Strawberry skin'],['rough','Rough body texture'],['pigmentation','Body pigmentation']].map(([v,l])=>'<label class="quiz-choice"><input type="checkbox" name="concerns" value="'+v+'"><span>'+l+'</span></label>').join('')+'</div></fieldset>' +
    '<fieldset data-quiz-step="3" hidden><legend>4. Does your skin react easily to products?</legend><p class="hint">This helps us avoid suggesting exfoliating actives when you may need a gentler approach.</p><div class="quiz-options">' +
    [['no','Usually no'],['reactive','Yes, it gets irritated easily'],['current','It is irritated right now'],['unsure','I’m not sure']].map(([v,l])=>'<label class="quiz-choice"><input type="radio" name="sensitivity" value="'+v+'"><span>'+l+'</span></label>').join('')+'</div></fieldset>' +
    '<fieldset data-quiz-step="4" hidden><legend>5. Do you already own any of these?</legend><p class="hint">Tick what you have. We’ll avoid recommending a duplicate.</p><div class="owned-checks">'+productChecks+'</div><label class="quiz-choice"><input type="checkbox" name="owned" value="__other"><span>I already have another product / I’m not sure</span></label></fieldset>' +
    '<div class="quiz-actions"><button type="button" data-action="discovery-back" hidden>← Back</button><button type="button" class="primary" data-action="discovery-next">Continue →</button><button type="submit" id="discovery-submit" class="primary" hidden>Show my matches →</button></div></form>' +
    '<section id="recommendation-result" class="recommendation" aria-live="polite"><div class="result-empty"><div class="result-orb">✦</div><span class="slot">Your results will appear here</span><h2>Let’s get to know your skin.</h2><p>Once you finish the questions, I’ll explain why each suggested product may match your selected concern.</p></div></section></div>' +
    '<p class="wellness-note">This is an educational product-discovery tool, not a diagnosis or medical advice. Product fit depends on your own skin and the current pack label. Patch test new products and stop if irritation occurs. If your skin is currently irritated or a concern is persistent, consider professional advice.</p>';
}
function wellnessPage() {
  const keyToday=dateKey(), tip=Wellness.dailyTip(keyToday), quote=Wellness.dailyQuote(keyToday);
  let saved=''; try { saved=localStorage.getItem('bodywise-saved-quote')||''; } catch {}
  const isSaved=saved===quote;
  return '<div class="eyebrow">Everyday wellbeing</div><div class="intro"><h1>A little care, every day</h1></div>' +
    '<p class="muted">Small, realistic ideas to support general wellbeing. These are optional reminders, not medical advice or promises about skin outcomes.</p>' +
    '<div class="wellness-grid"><section class="wellness-card"><div class="slot">Wellness tip of the day · '+tip.category+'</div><h2>'+tip.title+'</h2><p>'+tip.body+'</p><p class="wellness-note">Choose what works for your circumstances. If you have a medical condition, special diet or fluid restriction, follow advice from your healthcare professional.</p></section>' +
    '<section class="quote-card"><div class="slot">A thought for today</div><blockquote>“'+quote+'”</blockquote><p class="wellness-note">An original line from Bodywise Companion.</p>'+button('save-quote',isSaved?'Saved for today ✓':'Save today’s thought','','primary')+'</section></div>' +
    '<section class="wellness-card" style="margin-top:16px"><div class="slot">A gentle reminder</div><h2>Consistency without pressure</h2><p>Follow product directions, be patient with routines and give yourself permission to keep things simple. You do not need a perfect routine to take care of yourself.</p></section>';
}

function loyaltyPage() {
  const s=Loyalty.status();
  const activities=Object.entries(s.activities);
  return '<div class="eyebrow">Your relationship with Bodywise</div><div class="intro"><h1>Care that comes full circle</h1></div>' +
    '<p class="muted">Collect Care Points for useful product education, sharing feedback and responsible empty-pack disposal—not for using more product than you need.</p>' +
    '<section class="loyalty-summary"><div><div class="slot">Your Care Points</div><strong class="loyalty-points">'+s.points+'</strong><p>'+s.tier+'</p></div><div class="loyalty-progress"><div class="spread"><span>Next milestone</span><strong>'+s.next+' points</strong></div><div class="meter" style="--fill:'+Math.min(100,s.points/s.next*100)+'%"><i></i></div><small>'+Math.max(0,s.next-s.points)+' points to go</small></div></section>' +
    '<section class="loyalty-card"><div class="section-title"><h2>Earn points through helpful actions</h2></div>'+activities.map(([id,item])=>'<div class="loyalty-activity"><div><strong>'+item.label+'</strong><small>+'+item.points+' Care Points</small></div>'+ (s.completed.includes(id)?'<span class="success">Completed ✓</span>':button('loyalty-claim','Complete', 'data-activity="'+id+'"','primary'))+'</div>').join('')+'</section>' +
    '<section class="loyalty-card"><div class="section-title"><h2>Replenishment, on your terms</h2></div><p>When your bottle estimate is running low, check your remaining quantity and decide whether the product is still right for you. You can reorder when you genuinely need it—there is no pressure to buy on a schedule.</p><p class="wellness-note">Purchase-linked points, coupons and order verification need an official Be Bodywise commerce/loyalty integration. This prototype does not issue discounts or verify purchases.</p></section>' +
    '<p class="wellness-note">Points are stored only in this browser and are a demonstration of the loyalty experience, not redeemable brand rewards.</p>';
}
function render() {
  const view = page();
  const modeButton = document.querySelector('#mode');
  modeButton.textContent = state.mode==='example'?'Example shelf':'Personal shelf';
  modeButton.setAttribute('aria-label',modeButton.textContent);
  for (const a of document.querySelectorAll('nav a')) {
    if(a.hash.split('/')[0]==='#'+view) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  }
  main.innerHTML = (storageWarning?`<p role="alert" class="notice">${storageWarning}</p>`:'')+({today,shelf:shelfPage,journal,compare:comparisonPage,ingredients:ingredientPage,discover:discoverPage,wellness:wellnessPage,loyalty:loyaltyPage}[view]());
  mountViewer();
  if(view==='discover') updateDiscoveryStep();
  document.title = 'Bodywise Companion · '+({today:'Today',shelf:'My shelf',journal:'Journal',compare:'Compare bottles',ingredients:'Ingredients',discover:'Discover',wellness:'Wellness',loyalty:'Rewards'}[view]);
}
function settings(id, targetMode=state.mode, fromOwnerPath=false) {
  const savedBottle = state[targetMode].bottles[id];
  const b = savedBottle || newBottle(id);
  const field = (name,label,value,min,max,step='any',required=true)=>`<label>${label}<input type="number" name="${name}" min="${min}" max="${max}" step="${step}" value="${value??''}" ${required?'required':''}></label>`;
  const checks = (name,list,values)=>list.map(([v,label])=>`<label><input type="checkbox" name="${name}" value="${v}" ${values.includes(v)?'checked':''}>${label}</label>`).join('');
  modal(savedBottle?'Edit your bottle':'Set up your bottle',`<p>${catalog[id].name}</p><p class="hint">Enter your own usage and follow your package directions.${targetMode==='example'?' Changes here apply to the example shelf.':''}</p>
    <form id="settings" data-id="${id}" data-mode="${targetMode}" data-owner-path="${fromOwnerPath}"><div class="fields">
    ${field('size','Bottle capacity (mL)',b.size,0.01,10000)}${field('remaining','Remaining now (mL)',b.remaining,0,10000)}
    <label>Dispenser<select name="unit">${['pump','drop','portion','swipe'].map(u=>`<option ${b.unit===u?'selected':''}>${u}</option>`).join('')}</select></label>
    ${field('units','Units per application',b.units,0.01,1000)}${field('output','mL per unit (optional)',b.output,0.001,1000,'any',false)}</div>
    <p class="hint">Use your measured output or a value from the manufacturer. Leave blank to track uses manually.</p>
    <fieldset><legend>Scheduled days</legend><div class="choices">${checks('days',weekdays.map((s,i)=>[i,s]),b.days)}</div></fieldset>
    <fieldset><legend>Usual time</legend><div class="choices">${checks('slots',['Morning','Evening'].map(s=>[s,s]),b.slots)}</div></fieldset>
    <p class="notice" role="alert" id="error"></p><div class="actions"><button class="primary" type="submit">Save bottle</button></div></form>`);
}
document.addEventListener('submit',e=>{
  if(e.target.id==='loyalty-feedback'){
    e.preventDefault();
    const feedback=new FormData(e.target).get('feedback').trim();
    if(feedback.length<10) return;
    const result=Loyalty.claim('feedback');
    dialog.close();
    if(result.ok){say('Thanks for sharing. You earned '+result.earned+' Care Points.');render();}
    else say(result.storageError?'Could not save points on this device.':'Feedback reward already claimed.');
    return;
  }
  if(e.target.id!=='discovery-form') return;
  e.preventDefault();
  const data=new FormData(e.target);
  const result=Discovery.recommend({area:data.get('area'),skinType:data.get('skinType'),concerns:data.getAll('concerns'),sensitivity:data.get('sensitivity'),owned:data.getAll('owned')});
  const target=document.querySelector('#recommendation-result');
  if(result.status==='no-match') {
    target.innerHTML='<div class="result-empty"><div class="slot">No clear match yet</div><h2>Let’s not guess.</h2><p>'+result.message+'</p><a href="https://bebodywise.com/shop/all" target="_blank" rel="noopener noreferrer">Browse the full Be Bodywise catalogue ↗</a></div>';
    return;
  }
  if(result.status==='already-owned') {
    target.innerHTML='<div class="result-empty"><div class="slot">No need to repurchase</div><h2>You may already have what you need.</h2><p>'+result.message+'</p><ul>'+result.ownedMatches.map(p=>'<li>'+p.name+'</li>').join('')+'</ul></div>';
    return;
  }
  const areaLabels={face:'face',body:'body',underarms:'underarms',feet:'feet',multiple:'more than one area'};
  const skinLabels={oily:'oily',dry:'dry',combination:'combination',normal:'normal',sensitive:'sensitive',unsure:'not sure'};
  const concernLabels=[...data.getAll('concerns')];
  const answerSummary='<div class="answer-summary"><strong>What you told me</strong><p>'+areaLabels[data.get('area')]+' · '+skinLabels[data.get('skinType')]+' skin · '+concernLabels.length+' concern(s) selected</p><button type="button" class="text-button" data-action="discovery-edit">Edit my answers</button></div>';
  target.innerHTML=answerSummary+'<div class="results-heading"><div class="slot">Your personalised shortlist</div><h2>Here’s what may fit your routine.</h2><p>Based on what you shared, these products are worth exploring. You do not need all of them—start with the one that best addresses your priority.</p></div><div class="match-grid">'+result.results.map(discoveryProductCard).join('')+'</div><p class="wellness-note">I’m a guided product-discovery tool, not a dermatologist. A match is not a guarantee of results or suitability. Check your pack, patch test new products and introduce active products cautiously.</p>');
  target.scrollIntoView({behavior:'smooth',block:'start'});
});
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
  state.mode = form.dataset.mode;
  const b = shelf().bottles[id] || newBottle(id);
  const corrected = remaining !== b.remaining || size !== b.size || form.elements.remaining.dataset.edited==='yes';
  Object.assign(b,{size,remaining,days,slots,units:number('units'),unit:data.get('unit'),output:number('output')||null});
  if(corrected) b.revision++;
  shelf().bottles[id] = b;
  selected = id;
  dialog.close();
  if (form.dataset.ownerPath==='true' && page()!=='today') location.hash='today';
  save('Bottle saved.');
});
document.addEventListener('input',e=>{
  if(e.target.name==='remaining') e.target.dataset.edited='yes';
  if(e.target.matches('[data-estimate-ml],[data-estimate-frequency]')) {
    const id=e.target.dataset.estimateId;
    const form=e.target.closest('.match-card');
    const ml=Number(form.querySelector('[data-estimate-ml]').value);
    const uses=Number(form.querySelector('[data-estimate-frequency]').value);
    const size=Number(form.dataset.size);
    const output=form.querySelector('.estimate-result');
    if(ml>0&&uses>0&&Number.isFinite(size)) output.textContent='At these settings: about '+(size/(ml*uses)/4.345).toFixed(1)+' months.';
    else output.textContent='Enter amounts greater than zero to calculate an estimate.';
  }
});
document.addEventListener('change',e=>{if(e.target.id==='featured'){selected=e.target.value;render();}});
document.addEventListener('click',e=>{
  const el=e.target.closest('button');
  if(!el) return;
  const act=el.dataset.action, id=el.dataset.id, slot=el.dataset.slot, b=shelf().bottles[id];
  if(act==='discovery-edit'){document.querySelector('#discovery-form').scrollIntoView({behavior:'smooth',block:'start'});return;}
  if(act==='discovery-next'||act==='discovery-back') {
    const form=document.querySelector('#discovery-form');
    if(act==='discovery-back'){discoveryStep=Math.max(0,discoveryStep-1);updateDiscoveryStep();return;}
    const active=form.querySelector('[data-quiz-step="'+discoveryStep+'"]');
    const hasAnswer=active.querySelector('input:checked');
    if(!hasAnswer){say(discoveryStep===2?'Select at least one concern to continue.':'Choose an option to continue.');return;}
    discoveryStep=Math.min(4,discoveryStep+1);updateDiscoveryStep();return;
  }
  if(el.id==='mode') {
    const example = state.mode==='example';
    modal('Choose your shelf',`<div class="dialog-copy"><p>${example?'You’re exploring an example bottle. Its amounts and schedule are illustrative.':'Your personal shelf holds the products and schedule you entered.'}</p><p class="muted">Each shelf is saved separately in this browser. Clearing browser data removes your records.</p>${button('switch',example?'Start or open my personal shelf':'Explore the example shelf','','primary')}</div>`);
  }
  if(act==='pick-owned') chooseOwned();
  if(act==='loyalty-claim'){
    const activity=el.dataset.activity;
    if(activity==='feedback'){
      modal('Share your product experience',`<form id="loyalty-feedback"><p>What worked well, what did not, or what would you improve? Please do not include medical or highly personal information.</p><textarea name="feedback" rows="4" required minlength="10" maxlength="1200" placeholder="Share an honest, optional comment"></textarea><div class="actions"><button class="primary" type="submit">Submit feedback</button></div></form>`);
    } else if(activity==='pack_return'){
      modal('Confirm responsible pack disposal',`<div class="dialog-copy"><p>Have you finished this pack and disposed of or recycled it responsibly according to local facilities?</p><div class="actions">${button('confirm-pack-return','Yes, I have', '', 'primary')}${button('close','Not yet','','linkbtn')}</div></div>`);
    } else {
      const result=Loyalty.claim(activity);
      if(result.ok){say('You earned '+result.earned+' Care Points.');render();}
      else say(result.storageError?'Could not save points on this device.':'This activity is already completed.');
    }
  }
  if(act==='confirm-pack-return'){
    const result=Loyalty.claim('pack_return');dialog.close();
    if(result.ok){say('You earned '+result.earned+' Care Points.');render();}
    else say('This activity is already completed.');
  }
  if(act==='save-quote'){try{localStorage.setItem('bodywise-saved-quote',Wellness.dailyQuote(dateKey()));say('Thought saved on this device.');render();}catch{say('Could not save on this device.');}}
  if(act==='setup-owned') settings(id,'personal',true);
  if(act==='feature'){selected=id;render();}
  if(act==='formula'){location.hash='ingredients/'+id;}
  if(act==='close') dialog.close();
  if(act==='switch'){state.mode=state.mode==='example'?'personal':'example';selected='';dialog.close();save('Shelf switched.');}
  if(act==='guide'){
    const p=catalog[id];
    if(state.mode==='personal') Loyalty.claim('guide_'+id);
    modal(p.name,`<div class="dialog-copy"><p class="slot">Be Bodywise · ${p.size} mL</p><h3>How to use</h3><p>${p.guide}</p>${expectation(p)}<h3>Before first use</h3><p>The brand advises a patch test. Avoid use if you notice redness, itching or irritation. Check your own label for the directions and ingredients for your pack.</p><div class="actions">${button('open-formula','See full formula →',idAttr(id))}</div></div>`);
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
