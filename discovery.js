/* Product discovery is based on the current Be Bodywise catalogue.
   Match by selected concern and product area; skin type is a compatibility filter,
   not a diagnosis. Sensitive/reactive answers suppress exfoliating/acne actives. */
const Discovery = (() => {
  const products = [
    {id:'facewash-oily',name:'2% Salicylic Acid Face Wash',category:'Face care',sizeMl:100,areas:['face'],concerns:['acne','blackheads'],skinTypes:['oily','normal','combination'],active:true,reason:'The brand positions this cleanser for mild, occasional acne and oily skin. Its 2% salicylic acid is intended to cleanse pores.',source:'https://bebodywise.com/product/2-salicylic-acid-face-wash',amount:1,uses:14},
    {id:'facewash-gentle',name:'1% Salicylic Acid Face Wash (Foam-Based)',category:'Face care',sizeMl:120,areas:['face'],concerns:['acne','blackheads'],skinTypes:['dry','combination'],active:true,reason:'The brand lists this 1% version for mild, occasional acne and dry/combination skin. It still contains exfoliating acids, so introduce carefully.',source:'https://bebodywise.com/product/acne-control-wash',amount:1,uses:7},
    {id:'face-moisturizer',name:'1% Peptide & Ceramide Moisturizer',category:'Face & body care',sizeG:50,areas:['face','body'],concerns:['hydration','barrier'],skinTypes:['all'],reason:'The brand describes this moisturiser as suitable for face and body, with peptides, panthenol and ceramides for moisture and barrier care.',source:'https://bebodywise.com/product/1-peptide-ceramide-moisturizer'},
    {id:'face-sunscreen',name:'Ultra Light Sunscreen SPF 50+',category:'Sun protection',sizeMl:50,areas:['face'],concerns:['sun'],skinTypes:['all'],reason:'A face sunscreen option when your priority is daily broad-spectrum sun protection. Follow the pack directions and apply enough for coverage.',source:'https://bebodywise.com/product/ultra-light-sunscreen-spf50',estimate:false},
    {id:'body-urea-lotion',name:'10% Urea Body Lotion',category:'Body care',sizeMl:200,areas:['body'],concerns:['dryness','flaky'],skinTypes:['dry','normal'],reason:'The brand positions this 10% urea lotion for very dry and flaky body skin. Urea is a humectant used to support hydration.',source:'https://bebodywise.com/product/10-urea-lotion',amount:2,uses:7},
    {id:'body-salicylic-wash',name:'1% Salicylic Acid Body Wash',category:'Body care',sizeMl:250,areas:['body'],concerns:['body-acne','bumps'],skinTypes:['all'],active:true,reason:'The brand positions this rinse-off cleanser for body acne and bumps. It contains 1% salicylic acid.',source:'https://bebodywise.com/product/1-salicylic-acid-body-wash-250ml-xp',amount:3,uses:7},
    {id:'body-niacinamide-wash',name:'5% Niacinamide Body Wash',category:'Body care',sizeMl:250,areas:['body'],concerns:['dullness','hydration','marks'],skinTypes:['all'],reason:'The brand describes this body wash for dull and dry skin and lists niacinamide and aloe vera among its featured ingredients.',source:'https://bebodywise.com/product/5-niacinamide-body-wash',amount:3,uses:7},
    {id:'underarm-rollon',name:'4% AHA BHA Underarm Roll On',category:'Underarm care',sizeMl:50,areas:['underarms'],concerns:['odour','underarm-pigmentation'],skinTypes:['all'],active:true,reason:'The brand lists this roll-on for underarm odour and pigmentation concerns. It contains exfoliating acids; avoid use on irritated or freshly shaved skin and follow the label.',source:'https://bebodywise.com/product/4-aha-bha-underarm-roll-on-no-fragrance',estimate:false},
    {id:'foot-urea',name:'20% Urea Foot Roll On',category:'Foot care',sizeMl:50,areas:['feet'],concerns:['heels'],skinTypes:['all'],reason:'The brand positions this concentrated urea roll-on for cracked and rough heels. Use only as directed on the product label.',source:'https://bebodywise.com/product/20-urea-foot-roll-on',estimate:false},
    {id:'body-lactic-lotion',name:'5% Lactic Acid Body Lotion',category:'Body care',sizeMl:200,areas:['body'],concerns:['strawberry','rough'],skinTypes:['normal','dry'],active:true,reason:'The brand positions this leave-on lotion for strawberry skin and rough-feeling body texture. Lactic acid is an exfoliating AHA.',source:'https://bebodywise.com/product/5-lactic-acid-body-lotion',amount:2,uses:7},
    {id:'body-niacinamide-lotion',name:'10% Niacinamide Body Lotion',category:'Body care',sizeMl:200,areas:['body'],concerns:['marks','pigmentation'],skinTypes:['all'],reason:'The brand lists this body lotion for the appearance of acne marks. Check the ingredient list and directions on your pack.',source:'https://bebodywise.com/product/10-niacinamide-body-lotion',amount:2,uses:7}
  ];
  const labels = {
    acne:'occasional face acne',blackheads:'blackheads or clogged pores',dryness:'dry body skin',flaky:'flaky body skin',
    hydration:'hydration',barrier:'skin-barrier support',sun:'sun protection', 'body-acne':'body acne',
    bumps:'body bumps',dullness:'dull-looking body skin',marks:'post-blemish marks',odour:'underarm odour',
    'underarm-pigmentation':'underarm pigmentation',heels:'rough or cracked heels',strawberry:'strawberry skin',
    rough:'rough body texture',pigmentation:'body pigmentation'
  };
  function recommend({area='multiple',skinType='unsure',concerns=[],sensitivity='unsure',owned=[]}={}) {
    const chosen = Array.isArray(concerns) ? concerns : [concerns];
    const ownedIds = Array.isArray(owned) ? owned : [owned];
    const cautious = sensitivity !== 'no' || skinType === 'sensitive';
    const ranked = products.map(p => {
      const matched = p.concerns.filter(c => chosen.includes(c));
      const areaMatch = area === 'multiple' || p.areas.includes(area) || p.areas.includes('all');
      const typeMatch = p.skinTypes.includes('all') || p.skinTypes.includes(skinType) || skinType === 'unsure';
      if (!areaMatch || !matched.length || !typeMatch || (cautious && p.active)) return null;
      return {...p, matchedConcerns:matched, score:matched.length*3 + (p.skinTypes.includes(skinType)?1:0)};
    }).filter(Boolean).sort((a,b)=>b.score-a.score);
    if (!ranked.length) return {status:'no-match',results:[],message:cautious
      ? 'I’m not going to guess while your skin is sensitive or irritated. Consider a simple routine, check product labels carefully, and speak with a qualified dermatologist if the concern persists.'
      : 'I couldn’t find a clear match in the products included here. Try changing the area or concern, or browse the full Be Bodywise catalogue.'};
    const available = ranked.filter(p=>!ownedIds.includes(p.id));
    if (!available.length) return {status:'already-owned',results:[],ownedMatches:ranked,message:'You already selected the matching products as ones you own. You may not need to buy anything new—check your current pack directions first.'};
    return {status:'suggestion',results:available.slice(0,5).map(p=>({...p,
      reason:p.reason+' This matches the concern(s) you selected: '+p.matchedConcerns.map(c=>labels[c]||c).join(', ')+'.',
      skinNote:p.skinTypes.includes('all')?'The brand listing does not restrict this product to one skin type.': 'The brand listing includes '+p.skinTypes.join(' / ')+' skin types for this product.'
    }))};
  }
  return {products,recommend};
})();
if (typeof module !== 'undefined') module.exports = Discovery;
