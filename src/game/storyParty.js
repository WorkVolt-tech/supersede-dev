// Story companions are persisted as alliance_log tags to preserve existing saves.
// Never infer presence from narrative prose or from a named NPC appearing nearby.
export const COMPANIONS = {
  marcus:{name:'Marcus',icon:'🧑',damage:4},
  yara:{name:'Yara',icon:'🛡️',damage:5},
  lena:{name:'Lena',icon:'⚔️',damage:5},
  gio:{name:'Gio',icon:'🧑',damage:3},
  rhen:{name:'Rhen',icon:'👤',damage:5},
  kai:{name:'Kai',icon:'🧑',damage:4},
}
const JOIN_SCENES={
  garage_b2_together:['marcus'], boss_sentinel_fight_yara:['yara'],
  market_b2_ally_path:['lena'], market_b4_gio_cross:['gio'],
  tower_b2_rhen_invite:['rhen'],
}
const LEAVE_SCENES={
  garage_b2_alone:['marcus'],boss_sentinel_fight:['yara'],
  market_b4_solo_cross:['lena'],market_b4_gio_cross:['lena'],
  boss_surveyor_fight_lena:['gio'],boss_surveyor_fight_gio:['lena'],
}
export function partyTagsForScene(log=[],scene) {
  let tags=[...log]
  // Zone transitions disband temporary travel companions.
  if(scene==='district_hub'||scene==='market_approach'||scene==='tower_approach'||
     scene==='garage_approach'||scene==='plaza_allies')
    tags=tags.filter(tag=>!tag.startsWith('party:'))
  for(const id of LEAVE_SCENES[scene]||[])tags=tags.filter(t=>t!=='party:'+id)
  for(const id of JOIN_SCENES[scene]||[])
    if(!tags.includes('party:'+id))tags.push('party:'+id)
  return tags
}
export function activeCompanions(player) {
  const tags=new Set(player?.alliance_log||[])
  return Object.entries(COMPANIONS).filter(([key])=>tags.has('party:'+key))
    .map(([id,member])=>({id,...member}))
}

export function partyAwareText(text,player) {
  if(typeof text!=='string')return text
  const party=new Set(activeCompanions(player).map(member=>member.id))
  const segments=[
    ['Not Marcus (if he\'s with you, he goes still the moment he sees it).',
      'Not Marcus. Marcus goes still the moment he sees it.','Not the person you met before.'],
    ['Marcus — if he\'s with you — says nothing. Just looks at the ramp.\n\n"There's one more level," he says finally.\n\n"I know," you say.',
      'Marcus says nothing. Just looks at the ramp.\n\n"There's one more level," he says finally.\n\n"I know," you say.',
      'You look toward the ramp. One more level.'],
    ['Marcus — if he\'s with you — exhales slowly. "Why did you let him go?"\n\nYou don\'t answer. You\'re not entirely sure yourself.',
      'Marcus exhales slowly. "Why did you let him go?"\n\nYou don\'t answer. You\'re not entirely sure yourself.',
      'You consider why you let him go. You\'re not entirely sure yourself.'],
    ['Lena — if she\'s with you — moves to intercept a Drone immediately. Her fighting style is focused: one clean strike, reposition, repeat. No flourishes. Pure function.',
      'Lena intercepts a Drone immediately. One clean strike, reposition, repeat. No flourishes. Pure function.',''],
    ['Gio — if he\'s with you — does something unexpected. He throws frozen produce. A suspended melon swings down from a vendor\'s display and catches a Drone mid-arc. It\'s not combat. It works.',
      'Gio throws frozen produce. A suspended melon swings into a Drone mid-arc. It works.',''],
    ['Rhen — if they\'re with you — makes a sound that might be recognition.',
      'Rhen makes a sound that might be recognition.',''],
  ]
  const people=['marcus','marcus','marcus','lena','gio','rhen']
  segments.forEach(([original,present,absent],i)=>{
    if(text.includes(original))text=text.replace(original,party.has(people[i])?present:absent)
  })
  text=text.replace('If Rhen is with you, they\'re ahead — always just around the next corner, never quite in sight until the fighting starts, and then suddenly and completely present.',
    party.has('rhen')?'Rhen scouts ahead and returns for the fighting.':'')
  return text
}
