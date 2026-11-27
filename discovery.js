/* Transparent, rule-based discovery using only the two products documented in catalog. */
const Discovery = (() => {
  const choices = {
    dryness: {
      id: 'lotion',
      reason: 'You selected dry or rough-feeling body skin. The documented lotion is a leave-on moisturiser with lactic acid, intended to moisturise and gently exfoliate the skin surface.',
      next: 'Use it only as directed on your own pack. The brand recommends daytime sun protection when using this exfoliating lotion.'
    },
    texture: {
      id: 'lotion',
      reason: 'You selected rough or uneven-feeling body texture. The documented lotion is a leave-on moisturiser with lactic acid and is positioned for rough, dry-feeling body skin.',
      next: 'Check the product label and introduce it thoughtfully. Individual results and tolerance vary.'
    },
    blemishes: {
      id: 'wash',
      reason: 'You selected body blemishes or clogged-feeling pores. The documented body wash contains 1% salicylic acid and is a rinse-off cleanser.',
      next: 'Rinse thoroughly and follow the directions on your own pack. Stop use if irritation occurs.'
    }
  };
  function recommend({concern, owned = 'none'}) {
    const match = choices[concern];
    if (!match) return {status:'no-match', message:'I can’t make a useful suggestion from the options selected. Check the official product catalogue or ask a qualified professional if you have a persistent skin concern.'};
    if (owned === match.id) return {status:'already-owned', id:match.id, message:'You already selected this product as one you own. You may find the product guide and routine tracker more useful than buying another one.', reason:match.reason};
    if (owned === 'both') return {status:'already-owned', id:match.id, message:'You already own both products. Review each product guide and avoid adding steps or increasing frequency beyond the pack directions.', reason:match.reason};
    return {status:'suggestion', id:match.id, reason:match.reason, next:match.next};
  }
  return {recommend};
})();

if (typeof module !== 'undefined') module.exports = Discovery;
