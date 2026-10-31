// Target preview uses the same legality and AoE footprint as the combat engine.
// Prefer the legal aim that catches the most living targets, not the first grid cell.
import { isTacticalTargetValid, getTacticalAffectedSquares } from './tacticalGrid.js'

export const ENEMY_GRID_CELLS=Array.from({length:9},(_,i)=>({col:i%3,rank:Math.floor(i/3)}))
export const sameBattleSquare=(a,b)=>Boolean(a&&b&&a.col===b.col&&a.rank===b.rank)
export function bestTacticalAim(pattern,hero,enemies=[],focusedId=null,preferred=null) {
  if(!pattern || pattern.target==='self')return null
  const legal=ENEMY_GRID_CELLS.filter(square=>isTacticalTargetValid(pattern,hero,square))
  if(!legal.length)return null
  const living=enemies.filter(unit=>unit.hp>0)
  const scored=legal.map(square=>{
    const affected=getTacticalAffectedSquares(pattern,square)
    const targets=living.filter(unit=>affected.some(cell=>sameBattleSquare(cell,unit)))
    return {square,score:targets.length*100+
      (targets.some(unit=>unit.id===focusedId)?10:0)+
      (living.some(unit=>sameBattleSquare(unit,square))?1:0)}
  }).sort((a,b)=>b.score-a.score)
  // Keep a previously chosen aim when it remains legal and is equally useful.
  const selected=scored.find(entry=>sameBattleSquare(entry.square,preferred))
  return selected&&selected.score===scored[0].score?selected.square:scored[0].square
}
export function tacticalPreview(pattern,hero,aim,enemies=[]) {
  if(!pattern||!aim||!isTacticalTargetValid(pattern,hero,aim))return {squares:[],targets:[]}
  const squares=getTacticalAffectedSquares(pattern,aim)
  return {squares,targets:enemies.filter(unit=>unit.hp>0&&
    squares.some(cell=>sameBattleSquare(cell,unit)))}
}
