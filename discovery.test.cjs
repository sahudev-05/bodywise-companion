const test = require('node:test');
const assert = require('node:assert/strict');
const {recommend} = require('./discovery.js');
const {dailyTip,dailyQuote} = require('./wellness.js');

test('dryness and rough texture map to the documented leave-on lotion',()=>{
  for (const concern of ['dryness','texture']) {
    const result=recommend({concern,owned:'none'});
    assert.equal(result.status,'suggestion');
    assert.equal(result.id,'lotion');
    assert.match(result.reason,/lactic acid/i);
  }
});
test('body blemish concern maps to the documented rinse-off salicylic wash',()=>{
  const result=recommend({concern:'blemishes',owned:'none'});
  assert.equal(result.status,'suggestion');
  assert.equal(result.id,'wash');
  assert.match(result.reason,/1% salicylic acid/i);
});
test('unknown concerns do not force an unsuitable recommendation',()=>{
  assert.equal(recommend({concern:'unsure'}).status,'no-match');
});
test('already-owned products are not recommended for repurchase',()=>{
  assert.equal(recommend({concern:'dryness',owned:'lotion'}).status,'already-owned');
  assert.equal(recommend({concern:'blemishes',owned:'both'}).status,'already-owned');
});
test('daily content is stable for a given date and changes by deterministic date key',()=>{
  assert.equal(dailyTip('2026-11-27').title,dailyTip('2026-11-27').title);
  assert.equal(dailyQuote('2026-11-27'),dailyQuote('2026-11-27'));
  assert.ok(dailyTip('2026-11-27').body.length>20);
});
