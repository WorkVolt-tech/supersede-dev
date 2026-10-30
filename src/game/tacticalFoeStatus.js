// Swaps only foe-targeted effects into legacy class/element combat hooks.
// Player buffs, cooldowns and skills stay on the global combat status.
export const FOE_STATUS_KEYS=[
  'cls_markTurns','cls_crimeTally','cls_silenceTurns',
  'cls_bleedingTurns','cls_bleedingDmg','cls_bleedingStacks',
  'cls_rotTurns','cls_rotDmg','cls_rotApplied',
  'cls_executionMarkTurns','cls_drownTurns','cls_drownStacks',
  'cls_drownedActive','enemyStunTurns','enemyATKMult','cfx_longDecayStacks',
]
export function withFoeStatus(shared,perFoe,id,callback) {
  if(!id)return callback()
  const own=perFoe[id]||{}
  const saved={}
  for(const key of FOE_STATUS_KEYS){
    saved[key]={present:Object.prototype.hasOwnProperty.call(shared,key),value:shared[key]}
    if(Object.prototype.hasOwnProperty.call(own,key))shared[key]=own[key]
    else delete shared[key]
  }
  try{return callback()}
  finally{
    const updated={}
    for(const key of FOE_STATUS_KEYS){
      if(Object.prototype.hasOwnProperty.call(shared,key))updated[key]=shared[key]
      if(saved[key].present)shared[key]=saved[key].value
      else delete shared[key]
    }
    perFoe[id]=updated
  }
}

export function advanceFoeStatuses(units,perFoe,player={}) {
  const nextStatuses=Object.fromEntries(Object.entries(perFoe)
    .map(([id,effects])=>[id,{...effects}]))
  const events=[]
  const updated=units.map(unit=>{
    if(unit.hp<=0)return unit
    const s=nextStatuses[unit.id]||{}
    let damage=0
    if(s.cls_bleedingTurns>0){
      damage+=Math.max(0,s.cls_bleedingDmg||0)
      s.cls_bleedingTurns--
    }
    if(s.cls_rotTurns>0){
      damage+=Math.max(0,s.cls_rotDmg||0)
      s.cls_rotTurns--
    }
    if(s.cls_drownTurns>0){
      const stacks=s.cls_drownStacks||1
      let tick=5*stacks
      if(player.active_class==='abyss_walker' &&
        (player.class_nodes_unlocked||[]).includes('abyss_walker:abyss_walker_t3b') &&
        stacks>=5)tick*=2
      if(s.cls_drownedActive)tick=50+Math.round(unit.maxHp*.10)
      damage+=tick
      s.cls_drownTurns--
      if(s.cls_drownTurns===0){s.cls_drownStacks=0;s.cls_drownedActive=false}
    }
    for(const key of ['cls_markTurns','cls_silenceTurns','cls_executionMarkTurns'])
      if(s[key]>0)s[key]--
    if(s.cls_markTurns===0)s.cls_crimeTally=0
    nextStatuses[unit.id]=s
    if(damage<=0)return unit
    const hp=Math.max(0,unit.hp-damage)
    events.push({id:unit.id,name:unit.name,damage,hp,defeated:hp===0})
    return {...unit,hp}
  })
  return {units:updated,statuses:nextStatuses,events}
}

export function enemyActionBudget(attack,groupSize) {
  return Math.max(3,Math.round(Math.max(1,Number(attack)||1)+
    Math.ceil(Math.max(2,Number(groupSize)||2)/2)))
}
