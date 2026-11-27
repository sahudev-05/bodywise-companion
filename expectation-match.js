/* Expectation Match: turns the existing local product reflection into the
   primary post-purchase experience. All statements are customer-reported,
   not clinical assessments. Data remains in the browser. */
(() => {
  const KEY = 'bodywise-experience-v1';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const labels = {
    'No noticeable change':'No noticeable change reported',
    'A little change':'Some change reported',
    'Clear improvement':'Improvement reported',
    'Worse or uncomfortable':'Worse or uncomfortable experience reported',
    'Not sure yet':'Experience is still uncertain'
  };
  function readProducts() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{"products":[]}');
      return Array.isArray(value.products) ? value.products : [];
    } catch { return []; }
  }
  function enhance() {
    if (location.hash.split('/')[0] !== '#experience') return;
    const main = document.querySelector('main');
    const heading = main && main.querySelector('h1');
    if (!heading || heading.textContent === 'Expectation Match') return;
    heading.textContent = 'Expectation Match';
    const intro = heading.parentElement;
    const subtitle = intro && intro.querySelector('.muted');
    if (subtitle) subtitle.textContent = 'Compare what you hoped a product would do with what you actually notice—and decide whether the experience feels worth the price.';
    const eyebrow = main.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = 'Your post-purchase product experience';
    const explainer = main.querySelector('.experience-explainer');
    if (explainer) {
      explainer.innerHTML = '<strong>From expectation to experience</strong><p>Be Bodywise product pages explain product benefits and directions. This space helps you record your own expectations, reflect on changes you notice and assess perceived value after purchase. Your check-ins are personal observations—not proof of clinical effectiveness.</p>';
    }
    const products = readProducts();
    const introBlock = main.querySelector('.intro');
    if (introBlock && !main.querySelector('.expectation-steps')) {
      const steps = document.createElement('section');
      steps.className = 'expectation-steps';
      steps.innerHTML = '<div><span>01</span><strong>Set an expectation</strong><small>What did you hope this product would improve?</small></div><div><span>02</span><strong>Record your experience</strong><small>Check in honestly as you use the product.</small></div><div><span>03</span><strong>Reflect on value</strong><small>Consider the outcome, quantity and price together.</small></div>';
      introBlock.insertAdjacentElement('afterend', steps);
    }
    const cards = [...main.querySelectorAll('.experience-card')];
    cards.forEach((card, index) => {
      const product = products[index];
      if (!product || card.querySelector('.expectation-report')) return;
      const last = product.checkins && product.checkins[product.checkins.length - 1];
      const report = document.createElement('section');
      report.className = 'expectation-report';
      const expectation = product.goal || 'No original expectation recorded';
      const outcome = last ? (labels[last.change] || last.change || 'Not recorded') : 'No check-in recorded yet';
      const value = last ? (last.value || 'Not recorded') : 'Not assessed yet';
      report.innerHTML = '<div class="expectation-report-title">Your expectation vs. your experience</div><div class="expectation-report-grid"><div><small>You hoped to improve</small><strong>'+escapeHTML(expectation)+'</strong></div><div><small>Latest experience you reported</small><strong>'+escapeHTML(outcome)+'</strong></div><div><small>Your view of the price</small><strong>'+escapeHTML(value)+'</strong></div></div><p>Use this reflection to decide what questions remain. A check-in does not establish why a result did or did not occur.</p>';
      const metrics = card.querySelector('.experience-metrics');
      if (metrics) metrics.insertAdjacentElement('afterend', report);
      const addButton = card.querySelector('[data-action="experience-checkin"]');
      if (addButton) addButton.textContent = 'Record experience check-in';
    });
    const addButton = main.querySelector('[data-action="experience-add"]');
    if (addButton) addButton.textContent = 'Track a product';
    const empty = main.querySelector('.experience-empty');
    if (empty) {
      const title = empty.querySelector('h2');
      const copy = empty.querySelector('p');
      if (title) title.textContent = 'Start with a product you already own.';
      if (copy) copy.textContent = 'Record what you expected, the price you paid and the pack size. Then return for honest check-ins as your experience develops.';
    }
    const note = main.querySelector('.wellness-note');
    if (note) note.textContent = 'Your entries stay in this browser on this device and are not sent to Be Bodywise. Your reflections are self-reported, not medical advice or a clinical product assessment. Follow the directions on your own pack.';
    document.title = 'Bodywise Companion · Expectation Match';
  }
  if (!location.hash) location.hash = '#experience';
  const main = document.querySelector('main');
  if (main) new MutationObserver(() => enhance()).observe(main, {childList:true,subtree:true});
  window.addEventListener('hashchange', () => requestAnimationFrame(enhance));
  enhance();
})();