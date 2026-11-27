const test = require('node:test');
const assert = require('node:assert/strict');
const {claim,status} = require('./loyalty.js');

function memoryStorage() {
  const store=new Map();
  global.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value),removeItem:key=>store.delete(key)};
  return store;
}
test('loyalty points are awarded once per helpful activity',()=>{
  memoryStorage();
  const first=claim('guide_lotion');
  assert.equal(first.ok,true);
  assert.equal(first.earned,10);
  assert.equal(claim('guide_lotion').ok,false);
  assert.equal(status().points,10);
});
test('feedback and responsible pack disposal add points without rewarding extra product use',()=>{
  memoryStorage();
  claim('feedback');
  claim('pack_return');
  assert.equal(status().points,50);
  assert.equal(status().tier,'Routine explorer');
});
test('unknown activities cannot mint points',()=>{
  memoryStorage();
  assert.equal(claim('buy_more').ok,false);
  assert.equal(status().points,0);
});
