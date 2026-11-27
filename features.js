'use strict';
const wellnessTips=[
 ['Hydration without pressure','Drink regularly through the day and let thirst, activity and weather guide you. There is no single water target that suits everyone.'],
 ['Build a colourful plate','Include vegetables, fruits, whole grains, protein sources and healthy fats. A varied diet supports wellbeing; no single food guarantees glowing skin.'],
 ['Give sleep a place in your routine','A consistent wind-down time and comfortable sleep environment can support rest.'],
 ['Move in a way you enjoy','A walk, stretch, cycle or sport can make movement sustainable. Start gently and choose what feels comfortable.'],
 ['Keep sun protection practical','When outdoors, use broad-spectrum sunscreen, protective clothing and shade. Reapply as directed on the label.'],
 ['Keep skincare simple','Introduce products gradually, follow pack directions and patch test as the brand advises. Stop if irritation develops.']
];
const dailyQuotes=['Small, consistent steps are still progress.','Care is not a race. Give yourself time.','A routine should support your life, not control it.','Progress can be quiet, gradual and worth celebrating.','You deserve care on ordinary days, too.','Choose habits you can return to, not rules you cannot keep.','A little patience can make consistency easier.'];
function dayIndex(n){const d=new Date();return Math.floor((d-new Date(d.getFullYear(),0,0))/86400000)%n;}
function wellnessPanel(){
 const tip=wellnessTips[dayIndex(wellnessTips.length)],quote=dailyQuotes[dayIndex(dailyQuotes.length)];
 return '<section class="wellness-strip"><div class="wellness-copy"><p class="kicker">A small daily reset</p><h2>'+tip[0]+'</h2><p>'+tip[1]+'</p></div><blockquote><span>Today’s reminder</span><p>“'+quote+'”</p></blockquote><small class="wellness-note">General wellbeing ideas, not medical advice. Choose what works for your circumstances.</small></section>';
}
function discoverPage(){
 return '<div class="eyebrow">Personalised product guidance</div><div class="intro"><h1>Suggest me a product</h1></div><p class="discover-lead">Tell us what you are looking for. We’ll explain which currently listed Bodywise products may fit that goal, why, and what to check before using them.</p>'+
 '<form id="suggest-form" class="suggest-form"><label for="suggest-goal">What would you like help with?</label><select id="suggest-goal" name="goal">'+
 '<option value="dry">Dry-feeling or rough body skin</option><option value="texture">Rough or uneven-feeling body texture</option><option value="blemish">Body blemishes or clogged-feeling pores</option><option value="after-shower">A moisturiser after showering</option><option value="routine">Understanding a simple body-care routine</option><option value="unsure">I’m not sure yet</option></select>'+
 '<label for="suggest-sensitivity">Anything to take into account?</label><select id="suggest-sensitivity" name="sensitivity"><option value="none">No particular concern</option><option value="sensitive">My skin is easily irritated or sensitive</option><option value="acid">I already use exfoliating acids on my body</option><option value="unknown">I’m unsure about ingredient suitability</option></select>'+
 '<p class="hint">This is product discovery, not a skin diagnosis. No account or health profile is created.</p><button class="primary" type="submit">Show my suggestions →</button></form>'+
 '<section id="recommendation-results" aria-live="polite" class="recommendation-results"><div class="card"><h2>Start with your goal</h2><p>Choose an option above to see relevant products from the current catalogue.</p></div></section>'+
 '<p class="catalog-limit">Recommendations are limited to the two products documented in this prototype. Check the ingredient list and directions on your own pack.</p>';
}
function scoreSuggestions(goal){
 const rules={dry:{lotion:6},texture:{lotion:4,wash:4},blemish:{wash:6},'after-shower':{lotion:6},routine:{lotion:3,wash:3},unsure:{lotion:2,wash:2}};
 return Object.entries(rules[goal]||rules.unsure).map(([id,score])=>({id,score})).sort((a,b)=>b.score-a.score);
}
function suggestionCard(item,sensitivity,goal){
 const p=Companion.catalog[item.id];
 const reason=item.id==='lotion'?(goal==='after-shower'?'This leave-on body lotion is intended for use after showering.':'This moisturiser contains 5% lactic acid; the brand positions it for dry-feeling, rough body skin.'):'This rinse-off body wash lists 1% salicylic acid, an exfoliating ingredient.';
 const caution=item.id==='lotion'?'Contains lactic acid (an exfoliating AHA). Follow the pack directions and use daytime sun protection as directed by the brand.':'Contains salicylic acid (an exfoliating BHA). Rinse thoroughly and follow the pack directions.';
 const extra=['sensitive','acid','unknown'].includes(sensitivity)?' Your sensitivity or existing-acid-use note means this is not an automatic match. Review the full ingredient list, patch test as directed, and seek professional advice if unsure.':'';
 return '<article class="suggestion-card"><div class="suggestion-image">'+packshot(item.id)+'</div><div class="suggestion-body"><p class="kicker">'+(item.id==='lotion'?'Leave-on moisturiser':'Rinse-off cleanser')+' · '+p.size+' mL</p><h2>'+p.name+'</h2><p>'+reason+'</p><div class="suggestion-why"><strong>Why it appears</strong><p>'+(goal==='unsure'?'One of the two products available to explore. Compare its purpose with your needs.':reason)+'</p></div><div class="suggestion-caution"><strong>Before you choose</strong><p>'+caution+extra+'</p></div><div class="actions"><a class="primary btn" href="#ingredients/'+item.id+'">Check ingredients</a><a class="btn" href="'+p.source+'" target="_blank" rel="noopener noreferrer">Brand product page ↗</a></div></div></article>';
}
document.addEventListener('submit',event=>{
 if(event.target.id!=='suggest-form')return;
 event.preventDefault();
 const data=new FormData(event.target),goal=data.get('goal'),sensitivity=data.get('sensitivity');
 const results=scoreSuggestions(goal);
 document.querySelector('#recommendation-results').innerHTML='<div class="section-title"><h2>'+(goal==='unsure'?'Explore the current catalogue':'Suggestions based on your goal')+'</h2><span class="hint">Rule-based guidance</span></div>'+results.map(x=>suggestionCard(x,sensitivity,goal)).join('')+'<p class="hint">These are relevance suggestions, not promises of results or a substitute for checking the label. For persistent or painful concerns, seek advice from a qualified healthcare professional.</p>';
});
