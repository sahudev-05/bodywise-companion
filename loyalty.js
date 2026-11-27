/* Local prototype loyalty: points reward helpful engagement, never product overuse. */
const Loyalty = (() => {
  const storageKey = 'bodywise-companion-loyalty-v1';
  const activities = {
    guide_lotion: {points:10,label:'Read the lotion usage guide'},
    guide_wash: {points:10,label:'Read the body wash usage guide'},
    feedback: {points:20,label:'Share product experience feedback'},
    pack_return: {points:30,label:'Confirm responsible empty-pack disposal'}
  };
  function read() {
    try {
      const value=JSON.parse(localStorage.getItem(storageKey)||'{}');
      return {points:Number.isFinite(value.points)?Math.max(0,value.points):0, completed:Array.isArray(value.completed)?value.completed.filter(x=>Object.hasOwn(activities,x)):[]};
    } catch { return {points:0,completed:[]}; }
  }
  function claim(activity) {
    if (!Object.hasOwn(activities,activity)) return {ok:false,...read()};
    const data=read();
    if (data.completed.includes(activity)) return {ok:false,...data};
    data.completed.push(activity);
    data.points+=activities[activity].points;
    try { localStorage.setItem(storageKey,JSON.stringify(data)); }
    catch { return {ok:false,...read(),storageError:true}; }
    return {ok:true,...data,earned:activities[activity].points};
  }
  function status() {
    const data=read();
    const tier=data.points>=100?'Wellbeing champion':data.points>=50?'Routine explorer':'Getting started';
    const next=data.points>=100?100:data.points>=50?100:50;
    return {...data,tier,next,activities};
  }
  return {claim,status};
})();
if (typeof module !== 'undefined') module.exports = Loyalty;
