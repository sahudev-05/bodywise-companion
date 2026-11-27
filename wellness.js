/* Original, non-medical everyday wellbeing content. Date-keyed so it stays stable for a local day. */
const Wellness = (() => {
  const tips = [
    {category:'Hydration', title:'Keep water within reach', body:'Drink regularly through the day and respond to thirst. Fluid needs vary; follow a clinician’s advice if you have a fluid restriction.'},
    {category:'Nutrition', title:'Add colour to your plate', body:'When practical, include a variety of fruits and vegetables alongside balanced meals. No single food guarantees clear or glowing skin.'},
    {category:'Rest', title:'Give yourself a wind-down window', body:'A consistent bedtime routine and enough sleep can support general wellbeing. Start with one small habit that feels realistic.'},
    {category:'Movement', title:'Take a gentle movement break', body:'A short walk, stretch or activity you enjoy can break up long periods of sitting. Adapt movement to your comfort and ability.'},
    {category:'Sun care', title:'Make sun protection a habit', body:'Use shade, protective clothing and broad-spectrum sunscreen according to its label and local guidance. Reapply as directed.'},
    {category:'Routine', title:'Keep skincare simple and steady', body:'Follow the directions on your product pack, introduce products thoughtfully and avoid using more in the hope of faster results.'}
  ];
  const quotes = [
    'Small acts of care add up.',
    'Progress is built one kind choice at a time.',
    'Consistency matters more than perfection.',
    'Give your routine time, and give yourself grace.',
    'Your wellbeing is more than what you see in the mirror.',
    'A fresh start can begin with one small step.',
    'You do not need to do everything today. Just begin.'
  ];
  function indexFor(key, length) {
    let hash = 0;
    for (const char of String(key)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return hash % length;
  }
  function dailyTip(key) { return tips[indexFor(key, tips.length)]; }
  function dailyQuote(key) { return quotes[indexFor(key, quotes.length)]; }
  return {dailyTip, dailyQuote};
})();
