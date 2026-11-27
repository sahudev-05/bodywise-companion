'use strict';
const productNames = {lotion:'Body lotion',wash:'Body wash'};
function productTabs(current, action) {
  return `<div class="product-tabs" aria-label="Choose a product">${Object.entries(productNames).map(([id,name])=>
    `<button data-action="${action}" data-id="${id}" aria-pressed="${current===id}">${name}</button>`).join('')}</div>`;
}
function packshot(id) {
  return `<img class="packshot" src="${id}-pack.webp" alt="${Companion.catalog[id].name}, front of the ${Companion.catalog[id].size} mL pack">`;
}
function bottleStage(id) {
  return `<section class="studio-stage" aria-label="Interactive pack viewer">
    <div class="stage-head"><span class="studio-label">Bottle studio</span><div class="view-tabs" aria-label="Pack presentation"><button data-view="model" aria-pressed="true">3D</button><button data-view="photo" aria-pressed="false">Pack photo</button></div></div>
    <div class="model-space">${packshot(id)}
      <model-viewer src="${id}.glb" alt="Rotatable model of the ${Companion.catalog[id].name}" camera-controls disable-pan
        touch-action="pan-y" interaction-prompt="none" shadow-intensity=".55" exposure="1.05" camera-orbit="-6deg 84deg 110%" min-camera-orbit="auto 20deg 80%" max-camera-orbit="auto 150deg 170%" field-of-view="29deg" loading="eager"></model-viewer>
    </div>
    <div class="viewer-foot"><div class="turns">
    <button data-turn="-35" aria-label="Rotate bottle left">↶</button><button data-turn="0" aria-label="Reset bottle view">Front</button><button data-turn="35" aria-label="Rotate bottle right">↷</button></div>
    <small class="viewer-help">Drag to rotate · Pinch to zoom</small></div></section>`;
}
function mountViewer() {
  const viewer = document.querySelector('model-viewer');
  if (!viewer) return;
  const stage = viewer.closest('.studio-stage');
  const fallback = () => {
    stage.classList.remove('ready');
    stage.classList.add('photo-only');
    stage.querySelector('.view-tabs').hidden = true;
    stage.querySelector('.viewer-help').textContent = 'Front pack photo · 3D unavailable in this browser';
  };
  viewer.addEventListener('load',()=>{stage.classList.add('ready');stage.classList.remove('photo-only');});
  viewer.addEventListener('error',fallback);
  if (!customElements.get('model-viewer') || location.protocol==='file:') fallback();
  stage.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>{
    const photo=btn.dataset.view==='photo';
    stage.classList.toggle('show-photo',photo);
    stage.querySelectorAll('[data-view]').forEach(tab=>tab.setAttribute('aria-pressed',String(tab===btn)));
    stage.querySelector('.viewer-help').textContent=photo?'Front pack photograph · Be Bodywise':'Drag to rotate · Pinch to zoom';
  }));
  stage.querySelectorAll('[data-turn]').forEach(btn=>btn.addEventListener('click',()=>{
    if (!viewer.loaded) return;
    const step=Number(btn.dataset.turn);
    if (!step) {viewer.cameraOrbit='0deg 84deg 110%';return;}
    const current=viewer.getCameraOrbit();
    viewer.cameraOrbit=`${current.theta*180/Math.PI+step}deg ${current.phi}rad ${current.radius}m`;
  }));
}
function activeCards(id) {
  const formula=Formulas[id];
  return `<div class="actives">${formula.featured.map(([name,category,img])=>
    `<article class="active-card"><img loading="lazy" src="${img}.webp" alt=""><div><small>${category}</small><h3>${name}</h3><p>${formula.items.find(row=>row[0]===name)[2]}</p></div></article>`).join('')}</div>`;
}
function currentFormula() {
  return location.hash.split('/')[1]==='wash'?'wash':'lotion';
}
function ingredientRows(id,query='',role='') {
  const rows=Formulas[id].items.filter(([name,group,info])=>
    (!role || group===role) && [name,group,info].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  return `<p id="matches" aria-live="polite">${rows.length} of ${Formulas[id].items.length} ingredients</p>${rows.length?
    `<dl class="formula-list">${rows.map(([name,role,info])=>`<div><dt>${name}</dt><dd><b>${role}</b><span>${info}</span></dd></div>`).join('')}</dl>`:
    '<p class="empty">No matching ingredients. Try another name or choose All roles.</p>'}`;
}
function ingredientPage() {
  const id=currentFormula(), f=Formulas[id], p=Companion.catalog[id];
  const roles=[...new Set(f.items.map(row=>row[1]))].sort();
  return `<div class="intro"><h1>Ingredients</h1>${productTabs(id,'formula')}</div>
  <div class="formula-banner"><div>${packshot(id)}</div><section><p class="kicker">${p.size} mL · Be Bodywise</p><h2>${p.name}</h2><p>${p.description}</p></section></div>
  <div class="section-title"><h2>Key ingredients</h2></div>${activeCards(id)}
  <div class="section-title"><h2>Full formula</h2></div>
  <p class="formula-note">${f.note} <a href="${f.source}" target="_blank" rel="noopener noreferrer">Brand ingredient list ↗</a></p>
  <div class="filters"><label>Search ingredients<input id="ingredient-query" type="search" placeholder="Try glycerin or hydration"></label>
  <label>Filter by role<select id="ingredient-role"><option value="">All roles</option>${roles.map(role=>`<option>${role}</option>`).join('')}</select></label></div>
  <div id="ingredient-results">${ingredientRows(id)}</div><p class="hint">Descriptions explain typical cosmetic functions. <a href="https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-ingredient-database_en" target="_blank" rel="noopener noreferrer">CosIng reference ↗</a></p>`;
}
function filterFormula(){
  document.querySelector('#ingredient-results').innerHTML=ingredientRows(currentFormula(),
    document.querySelector('#ingredient-query').value,document.querySelector('#ingredient-role').value);
}
document.addEventListener('input',e=>{if(e.target.id==='ingredient-query')filterFormula();});
document.addEventListener('change',e=>{if(e.target.id==='ingredient-role')filterFormula();});
