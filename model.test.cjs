const test = require('node:test');
const assert = require('node:assert/strict');
const {newBottle, initial, estimate, record, undo, dateKey} = require('./model.js');
const friday = new Date(2026,10,27,8);
test('200 mL at two pumps twice daily lasts 50 days, or 40 days with 80 mL once daily',()=>{
  const b = {...newBottle('lotion'),units:2,output:1,slots:['Morning','Evening']};
  assert.equal(estimate(b).days,50);
  b.slots=['Morning']; b.remaining=80;
  assert.equal(estimate(b).days,40);
});
test('rest days and pauses change the forecast',()=>{
  const b={...newBottle('wash'),output:1,remaining:30,days:[1,3,5]};
  assert.equal(estimate(b).days,70);
  b.paused=true;
  assert.equal(estimate(b).days,null);
});
test('double logging is idempotent, skipping consumes nothing, undo restores the balance',()=>{
  const s=initial().example;
  assert.ok(record(s,'lotion','Morning','Used',friday));
  assert.equal(s.bottles.lotion.remaining,126);
  assert.equal(record(s,'lotion','Morning','Used',friday),false);
  undo(s,'lotion','Morning',dateKey(friday));
  assert.equal(s.bottles.lotion.remaining,128);
  record(s,'lotion','Morning','Skipped',friday);
  assert.equal(s.bottles.lotion.remaining,128);
});
test('near-empty bottle and manual corrections preserve bounds',()=>{
  const s=initial().example, b=s.bottles.lotion;
  b.remaining=.5;
  record(s,'lotion','Morning','Used',friday);
  assert.equal(b.remaining,0);
  b.revision++; b.remaining=100;
  undo(s,'lotion','Morning',dateKey(friday));
  assert.equal(b.remaining,100);
});
test('unknown dispensing volume keeps the user-entered level',()=>{
  const s=initial().example, b=s.bottles.lotion; b.output=null;
  assert.equal(estimate(b).days,null);
  record(s,'lotion','Morning','Used',friday);
  assert.equal(b.remaining,128);
  assert.equal(s.events[0].calibrated,false);
});
test('off-schedule and paused uses are excluded',()=>{
  const s=initial().example;
  assert.equal(record(s,'lotion','Evening','Used',friday),false);
  s.bottles.lotion.days=[1];
  assert.equal(record(s,'lotion','Morning','Used',friday),false);
  s.bottles.lotion.days=[5]; s.bottles.lotion.paused=true;
  assert.equal(record(s,'lotion','Morning','Used',friday),false);
});
