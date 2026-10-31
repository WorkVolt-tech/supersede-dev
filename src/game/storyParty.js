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
