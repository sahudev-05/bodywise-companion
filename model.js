// All quantities use mL. Each scheduled slot has at most one event per local day.
const Companion = (() => {
  const source = 'https://bebodywise.com/product/aha-bha-body-pack';
  const catalog = {
    lotion: { name:'5% Lactic Acid Body Lotion', short:'Body lotion', size:200, type:'Body care',
      description:'A post-shower body lotion with lactic acid.', guide:'After showering, massage the lotion over the body until absorbed.', source },
    wash: { name:'1% Salicylic Acid Body Wash', short:'Body wash', size:250, type:'Body care',
      description:'A rinse-off cleanser with salicylic acid.', guide:'Apply to wet skin, rinse thoroughly, then pat dry.', source }
  };
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dateKey = (date = new Date()) => [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
  function newBottle(id) {
    const size = catalog[id].size;
    return {id, size, remaining:size, units:1, unit:'pump', output:null, days:[0,1,2,3,4,5,6], slots:['Morning'], paused:false, revision:0};
  }
  function initial() {
    const lotion = {...newBottle('lotion'), remaining:128, units:2, output:1};
    return {version:1, mode:'example', example:{bottles:{lotion}, events:[]}, personal:{bottles:{}, events:[]}};
  }
  function estimate(bottle) {
    const daily = bottle.paused ? 0 : bottle.units * (bottle.output || 0) * bottle.slots.length * bottle.days.length / 7;
    return {daily, days: daily ? bottle.remaining / daily : null, percent:100*bottle.remaining/bottle.size};
  }
  function record(shelf, id, slot, status, date = new Date()) {
    const b = shelf.bottles[id], day = dateKey(date);
    if (!b || b.paused || !b.days.includes(date.getDay()) || !b.slots.includes(slot)) return false;
    if (shelf.events.some(e => e.id===id && e.day===day && e.slot===slot)) return false;
    if (!['Used','Skipped'].includes(status)) return false;
    const used = status==='Used' && b.output ? Math.min(b.remaining, b.units*b.output) : 0;
    shelf.events.push({id, day, slot, status, used, calibrated:!!b.output, revision:b.revision});
    b.remaining = Math.max(0,b.remaining-used);
    return true;
  }
  function undo(shelf, id, slot, day) {
    const index = shelf.events.findIndex(e => e.id===id && e.day===day && e.slot===slot);
    if (index < 0) return;
    const [e] = shelf.events.splice(index,1), b = shelf.bottles[id];
    if (b && b.revision===e.revision) b.remaining = Math.min(b.size,b.remaining+e.used);
  }
  return {catalog, weekdays, dateKey, newBottle, initial, estimate, record, undo};
})();
if (typeof module !== 'undefined') module.exports = Companion;
