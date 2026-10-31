import { SKILL_NODES } from './skillTreeNodes.js'
const STAT_COL={atk_bonus:'atk',def_bonus:'def',power_bonus:'power',guard_bonus:'guard',control_bonus:'control',speed_bonus:'speed',insight_bonus:'insight',luck_bonus:'luck'}
const byId=new Map(SKILL_NODES.map(n=>[n.id,n]))
export function refundableSkillPoints(player) {
 return [...new Set(player?.skills_unlocked||[])].reduce((sum,id)=>{
 const n=byId.get(id)
 return sum+(n&&n.type!=='start'?(n.cost??(n.type==='keystone'?3:n.type==='notable'?2:1)):0)
 },0)
}
export function skillResetCost(player) {
 return 100+50*Math.max(0,Math.floor(Number(player?.level)||1)-1)
}
export function skillResetUpdates(player) {
 const refund=refundableSkillPoints(player),cost=skillResetCost(player)
 if(!refund||Number(player?.gold||0)<cost)return null
 const updates={gold:Number(player.gold)-cost,skill_points:(Number(player.skill_points)||0)+refund,
 skills_unlocked:[],battle_skills:(player.battle_skills||[]).filter(id=>!byId.has(id))}
 for(const id of new Set(player.skills_unlocked||[])){
   const n=byId.get(id),col=STAT_COL[n?.stat]||n?.stat
   if(n&&col&&Number(n.val)>0)updates[col]=Math.max(0,
     (updates[col]??Number(player[col]||0))-Number(n.val))
 }
 return updates
}
