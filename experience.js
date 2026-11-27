/* Local-only product experience and value tracker. No account or server sync. */
const Experience = (() => {
  const KEY = 'bodywise-experience-v1';
  const clean = value => String(value ?? '').trim().slice(0, 160);
  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || '{"products":[]}');
      if (!parsed || !Array.isArray(parsed.products)) return {products:[]};
      return {products: parsed.products.filter(p =>
        p && typeof p.id === 'string' && typeof p.name === 'string' &&
        Number.isFinite(p.price) && Number.isFinite(p.size) &&
        typeof p.started === 'string' && Array.isArray(p.checkins)
      )};
    } catch { return {products:[]}; }
  }
  function all() { return load().products; }
  function add(input) {
    const name=clean(input.name), price=Number(input.price), size=Number(input.size);
    if (!name || !Number.isFinite(price) || price<=0 || !Number.isFinite(size) || size<=0 || !input.started) return {ok:false};
    const data=load();
    const item={id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),name,price,size,started:input.started,
      goal:clean(input.goal),targetDays:Math.max(0,Math.min(365,Number(input.targetDays)||0)),checkins:[]};
    data.products.unshift(item);
    try {localStorage.setItem(KEY,JSON.stringify(data));return {ok:true,item};} catch {return {ok:false,storageError:true};}
  }
  function checkin(id,input) {
    const data=load(), item=data.products.find(p=>p.id===id);
    if(!item) return {ok:false};
    const entry={date:input.date,change:clean(input.change),value:clean(input.value),note:clean(input.note)};
    if(!entry.date||!entry.change||!entry.value) return {ok:false};
    item.checkins.push(entry);
    try {localStorage.setItem(KEY,JSON.stringify(data));return {ok:true};} catch {return {ok:false,storageError:true};}
  }
  function remove(id) {
    const data=load(); data.products=data.products.filter(p=>p.id!==id);
    try {localStorage.setItem(KEY,JSON.stringify(data));return true;} catch {return false;}
  }
  return {all,add,checkin,remove};
})();
if (typeof module !== 'undefined') module.exports = Experience;
