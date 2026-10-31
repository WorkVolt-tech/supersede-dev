// Skill levels are independent of character XP, unlocks and weapon mastery.
export const MAX_SKILL_LEVEL = 10
export function getSkillLevel(player, id) {
  const value = Number(player?.skill_levels?.[id])
  return Number.isFinite(value) && value >= 1 ? Math.min(MAX_SKILL_LEVEL, Math.floor(value)) : 1
}
export function skillUpgradeCost(level) {
  return 1 + Math.floor((Math.max(1, level) - 1) / 3)
}
// Call only for a learned skill; the UI checks the unlock before requesting a save.
export function getSkillUpgrade(player, id) {
  if (!id || !player) return null
  const level = getSkillLevel(player, id)
  const cost = skillUpgradeCost(level)
  if (level >= MAX_SKILL_LEVEL || (player.skill_points || 0) < cost) return null
  return { skill_levels: { ...(player.skill_levels || {}), [id]: level + 1 }, skill_points: (player.skill_points || 0) - cost }
}
export function scaleSkillAmount(value, level) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 0
  const lvl = Math.min(MAX_SKILL_LEVEL, Math.max(1, Math.floor(Number(level) || 1)))
  return Math.round(n * (1 + (lvl - 1) * 0.05))
}

/** Every ten successful casts of an equipped notable skill grant a level.
 * Practice is stored beside its level in the existing skill_levels JSON column. */
export function awardSkillPractice(levels={},uses={},threshold=10) {
  const result={...levels},leveled=[]
  for(const [id,countRaw] of Object.entries(uses)) {
    const count=Math.max(0,Math.floor(Number(countRaw)||0))
    if(!count)continue
    const key='__practice_'+id
    const prior=Math.max(0,Math.floor(Number(result[key])||0))
    const total=prior+count
    const current=getSkillLevel({skill_levels:result},id)
    const gained=Math.min(MAX_SKILL_LEVEL-current,Math.floor(total/threshold))
    if(gained>0){result[id]=current+gained;leveled.push({id,level:result[id]})}
    result[key]=current+gained>=MAX_SKILL_LEVEL?0:total%threshold
  }
  return {skill_levels:result,leveled}
}
