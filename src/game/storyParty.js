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
  fight_with_kai:['kai'],fight_plaza_spawn:['yara'],pre_boss_team:['yara'],
  tower_approach:['kai'],boss_unseen_fight_team:['kai','yara'],
  market_b2_ally_path:['lena'], market_b4_gio_cross:['gio'],
  tower_b2_rhen_invite:['rhen'],
}
const LEAVE_SCENES={
  garage_b2_alone:['marcus'],boss_sentinel_fight:['yara'],
  street_midpoint:['kai'],plaza_grind_done:['yara'],pre_boss_solo:['yara'],
  market_b4_solo_cross:['lena'],market_b4_gio_cross:['lena'],
  boss_surveyor_fight_lena:['gio'],boss_surveyor_fight_gio:['lena'],
}
export const SOLO_SCENES=new Set([
  'pre_boss_solo','boss','garage_b2_alone','garage_b2_fight_alone',
  'market_b4_solo_cross','boss_surveyor_fight','tower_b1_solo',
  'boss_unseen_fight','boss_sentinel_fight',
])
export function partyTagsForScene(log=[],scene) {
  let tags=[...log]
  // Zone transitions disband temporary travel companions.
  if(SOLO_SCENES.has(scene)||scene==='district_hub'||scene==='market_approach'||scene==='tower_approach'||
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
  const replacements=[
    {id:'marcus',from:"Not Marcus (if he's with you, he goes still the moment he sees it).",
      with:"Not Marcus. Marcus goes still when he sees the figure.",without:"Not the person you met before."},
    {id:'marcus',from:"Marcus — if he's with you — says nothing. Just looks at the ramp.\n\n\"There's one more level,\" he says finally.\n\n\"I know,\" you say.",
      with:"Marcus says nothing. Just looks at the ramp.\n\n\"There's one more level,\" he says finally.\n\n\"I know,\" you say.",
      without:"You look toward the ramp. One more level."},
    {id:'marcus',from:"Marcus — if he's with you — exhales slowly. \"Why did you let him go?\"\n\nYou don't answer. You're not entirely sure yourself.",
      with:"Marcus exhales slowly. \"Why did you let him go?\"\n\nYou don't answer. You're not entirely sure yourself.",
      without:"You consider why you let him go. You're not entirely sure yourself."},
    {id:'lena',from:"Lena — if she's with you — moves to intercept a Drone immediately. Her fighting style is focused: one clean strike, reposition, repeat. No flourishes. Pure function.",
      with:"Lena intercepts a Drone immediately. One clean strike, reposition, repeat. No flourishes. Pure function.",without:""},
    {id:'gio',from:"Gio — if he's with you — does something unexpected. He throws frozen produce. A suspended melon swings down from a vendor's display and catches a Drone mid-arc. It's not combat. It works.",
      with:"Gio throws frozen produce. A suspended melon swings into a Drone mid-arc. It works.",without:""},
    {id:'rhen',from:"Rhen — if they're with you — makes a sound that might be recognition.",
      with:"Rhen makes a sound that might be recognition.",without:""},
    {id:'rhen',from:"If Rhen is with you, they're ahead — always just around the next corner, never quite in sight until the fighting starts, and then suddenly and completely present.",
      with:"Rhen scouts ahead and returns for the fighting.",without:""},
  ]
  replacements.push(
    {id:'marcus',from:"\"If Marcus is with you\" — he doesn't look at Marcus — \"you should know he's not NEUTRAL-UNKNOWN because the System glitched. He's UNKNOWN because the System is still deciding what he is. What he does next writes the result. Same as everyone.\"",
      with:"\"Marcus,\" he says without looking at him, \"you're not NEUTRAL-UNKNOWN because the System glitched. You're UNKNOWN because the System is still deciding what you are. What you do next writes the result. Same as everyone.\"",
      without:"\"The System doesn't assign UNKNOWN status without a reason,\" he says. \"It watches what everyone does next. Same as everyone.\""},
    {id:'rhen',from:"Rhen — if present — steps forward.",
      with:"Rhen steps forward.",without:""},
  )
  for(const entry of replacements)
    text=text.replace(entry.from,party.has(entry.id)?entry.with:entry.without)
  if(text.includes('Four of you. Maybe.'))text=text.replace('Four of you. Maybe.',
    party.has('rhen')?'Four of you, together.':'Three of you, together.')
  return text
}
