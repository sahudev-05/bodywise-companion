const test = require('node:test');
const assert = require('node:assert/strict');
const {products,recommend} = require('./discovery.js');
const {dailyTip,dailyQuote} = require('./wellness.js');

test('catalog contains a varied set of face, body, underarm and foot products',()=>{
  assert.ok(products.length>=10);
  for (const area of ['face','body','underarms','feet']) assert.ok(products.some(p=>p.areas.includes(area)));
});
test('oily and dry/combination face acne have distinct product matches',()=>{
  const oily=recommend({area:'face',skinType:'oily',concerns:['acne'],sensitivity:'no'});
  const dry=recommend({area:'face',skinType:'dry',concerns:['acne'],sensitivity:'no'});
  assert.equal(oily.results[0].id,'facewash-oily');
  assert.equal(dry.results[0].id,'facewash-gentle');
});
test('dry body concern matches urea lotion',()=>{
  const r=recommend({area:'body',skinType:'dry',concerns:['dryness'],sensitivity:'no'});
  assert.equal(r.results[0].id,'body-urea-lotion');
});
test('body acne matches the salicylic body wash',()=>{
  const r=recommend({area:'body',skinType:'normal',concerns:['body-acne'],sensitivity:'no'});
  assert.equal(r.results[0].id,'body-salicylic-wash');
});
test('sensitive or unsure skin does not receive exfoliating active suggestions',()=>{
  const r=recommend({area:'face',skinType:'sensitive',concerns:['acne'],sensitivity:'yes'});
  assert.equal(r.status,'no-match');
});
test('already-owned matching products are filtered out',()=>{
  const r=recommend({area:'body',skinType:'dry',concerns:['dryness'],sensitivity:'no',owned:['body-urea-lotion']});
  assert.equal(r.status,'already-owned');
  assert.equal(r.results.length,0);
});
test('unmatched concerns do not force an irrelevant recommendation',()=>{
  assert.equal(recommend({area:'face',skinType:'unsure',concerns:['heels'],sensitivity:'no'}).status,'no-match');
});
test('daily content is stable for a given date',()=>{
  assert.equal(dailyTip('2026-11-27').title,dailyTip('2026-11-27').title);
  assert.equal(dailyQuote('2026-11-27'),dailyQuote('2026-11-27'));
  assert.ok(dailyTip('2026-11-27').body.length>20);
});
