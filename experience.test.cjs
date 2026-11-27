const test = require('node:test');
const assert = require('node:assert/strict');
const store = new Map();
global.localStorage = {
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(key,String(value))
};
const Experience = require('./experience.js');
test('adds a product with valid price, size and start date',()=>{
  const result=Experience.add({name:'Body lotion',price:'499',size:'200',started:'2026-11-01',goal:'Dryness',targetDays:'30'});
  assert.equal(result.ok,true);
  assert.equal(Experience.all().length,1);
  assert.equal(Experience.all()[0].price,499);
});
test('rejects invalid product details',()=>{
  assert.equal(Experience.add({name:'',price:0,size:200,started:'2026-11-01'}).ok,false);
});
test('records an honest experience check-in and removes a product',()=>{
  const item=Experience.all()[0];
  assert.equal(Experience.checkin(item.id,{date:'2026-11-27',change:'A little change',value:'Fair for the price',note:'Feels comfortable'}).ok,true);
  assert.equal(Experience.all()[0].checkins.length,1);
  assert.equal(Experience.remove(item.id),true);
  assert.equal(Experience.all().length,0);
});
test('handles unreadable stored data safely',()=>{
  store.set('bodywise-experience-v1','{broken');
  assert.deepEqual(Experience.all(),[]);
});
