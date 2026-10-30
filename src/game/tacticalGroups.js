// Independently positioned enemies for explicitly configured 2–9 unit story
// encounters. Group rewards remain on the parent encounter, never on units.
import { isTacticalTargetValid, tacticalHitTargets } from './tacticalGrid.js'

export const GROUP_POSITIONS = [
  {col:1,rank:0},{col:0,rank:0},{col:2,rank:0},
  {col:1,rank:1},{col:0,rank:1},{col:2,rank:1},
  {col:1,rank:2},{col:0,rank:2},{col:2,rank:2},
]

export function createTacticalGroup(encounter) {
  const count=Number(encounter?.groupSize)
  if(!Number.isInteger(count)||count<2||count>9)throw new RangeError('Group size must be 2–9')
  const hp=Math.max(count,Math.floor(Number(encounter.hp)||count))
  const attack=Math.max(1,Math.round((Number(encounter.atk)||count)/count))
  const baseHp=Math.floor(hp/count), extra=hp%count
  const name=encounter.groupUnitName||encounter.name||'Enemy'
  return GROUP_POSITIONS.slice(0,count).map((pos,i)=>({
    id:'foe-'+(i+1),name:name+' '+(i+1),icon:encounter.groupIcon||encounter.icon||'👹',
    ...pos,hp:baseHp+(i<extra?1:0),maxHp:baseHp+(i<extra?1:0),
    atk:attack,def:encounter.def||0,
    speed:encounter.speed??encounter.spd??encounter.agility??5,
    weapon:encounter.groupWeapon||encounter.weapon_type||'unarmed',
  }))
}
export function applyGroupAttack(units, attack, origin, targetId, damage) {
  const target=units.find(u=>u.id===targetId&&u.hp>0)
  if(!target||!isTacticalTargetValid(attack,origin,target))
    return {units,targets:[],defeated:[],valid:false}
  const targets=tacticalHitTargets(attack,target,units)
  const hits=new Set(targets.map(unit=>unit.id))
  const updated=units.map(unit=>hits.has(unit.id)?
    {...unit,hp:Math.max(0,unit.hp-Math.max(0,Math.round(
      typeof damage==='function'?damage(unit):damage)))}:unit)
  const defeated=updated.filter(unit=>hits.has(unit.id)&&unit.hp===0&&
    units.find(previous=>previous.id===unit.id).hp>0)
  return {units:updated,targets,defeated,valid:true}
}
export function nextAliveTarget(units,preferredId) {
  return units.find(u=>u.id===preferredId&&u.hp>0)||units.find(u=>u.hp>0)||null
}
