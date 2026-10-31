import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CLASSES } from './classes.js'
import {
  TACTICAL_ATTACKS, TACTICAL_WEAPONS, tacticalWeaponType, getTacticalAttacks,
  isTacticalTargetValid, getTacticalAffectedSquares, tacticalHitTargets,
  weaponMasteryLevel, weaponMasteryBonus, awardWeaponMastery,
  nextWeaponMasteryThreshold, hasFullTacticalCoverage, chooseTacticalEnemyAction,
  getPlayerTacticalAttacks, startImprovisedThrowRecovery,
  improvisedThrowTurnsRemaining, tacticalAttackDescription,
} from './tacticalGrid.js'

test('all existing weapon families cover short, middle and long targets', () => {
  assert.ok(Object.keys(TACTICAL_WEAPONS).length>=10)
  for (const name of Object.keys(TACTICAL_WEAPONS))
    assert.equal(hasFullTacticalCoverage(name),true,name+' is missing a reach')
})

test('every current class inherits short-mid-long coverage and a target-anywhere fallback', () => {
  assert.ok(Object.keys(CLASSES).length>0)
  for (const key of Object.keys(CLASSES)) {
    for(const weapon of Object.keys(TACTICAL_WEAPONS))
      assert.equal(hasFullTacticalCoverage(weapon),true,key+' '+weapon)
  }
  assert.equal(isTacticalTargetValid('pulse',{col:2,rank:2},{col:0,rank:2}),true)
})

test('existing equipment subtypes resolve to meaningful weapon families', () => {
  assert.equal(tacticalWeaponType('sniper_rifle'),'rifle')
  assert.equal(tacticalWeaponType('shortbow'),'bow')
  assert.equal(tacticalWeaponType('revolver'),'pistol')
  assert.equal(tacticalWeaponType('crossbow'),'crossbow')
  assert.equal(tacticalWeaponType('sword'),'sword')
  assert.equal(tacticalWeaponType(null),'unarmed')
})

test('short sword slash hits only the directly adjacent square', () => {
  assert.equal(isTacticalTargetValid('slash',{col:1,rank:0},{col:1,rank:0}),true)
  assert.equal(isTacticalTargetValid('slash',{col:1,rank:0},{col:1,rank:2}),false)
  assert.equal(isTacticalTargetValid('slash',{col:1,rank:1},{col:1,rank:0}),false)
  assert.equal(isTacticalTargetValid('slash',{col:1,rank:0},{col:0,rank:0}),false)
})

test('distance and diagonal permissions control spear and bow attacks', () => {
  assert.equal(isTacticalTargetValid('thrust',{col:0,rank:1},{col:0,rank:0}),true)
  assert.equal(isTacticalTargetValid('thrust',{col:0,rank:1},{col:1,rank:0}),false)
  assert.equal(isTacticalTargetValid('thrust',{col:0,rank:2},{col:0,rank:2}),false)
  assert.equal(isTacticalTargetValid('aimed',{col:2,rank:2},{col:0,rank:2}),true)
  assert.equal(isTacticalTargetValid('aimed',{col:2,rank:0},{col:0,rank:2}),true)
})

test('cross attacks cover centre and orthogonally adjacent cells only', () => {
  const cells=getTacticalAffectedSquares('wave',{col:1,rank:1})
  assert.equal(cells.length,5)
  assert.equal(cells.some(c=>c.col===0&&c.rank===0),false)
  assert.equal(cells.some(c=>c.col===1&&c.rank===0),true)
})

test('line and row attacks strike multiple occupied squares but not arbitrary other squares', () => {
  const foes=[
    {col:1,rank:0,hp:10},{col:1,rank:1,hp:10},
    {col:1,rank:2,hp:10},{col:0,rank:0,hp:10},
  ]
  assert.equal(tacticalHitTargets('pierce',{col:1,rank:0},foes).length,3)
  assert.equal(tacticalHitTargets('sweep',{col:1,rank:0},foes).length,2)
})

test('mastery advances by successful uses, not by equipped item id', () => {
  const before={sword:4,bow:10}
  const after=awardWeaponMastery(before,'sword',2)
  assert.equal(after.sword,6)
  assert.equal(after.bow,10)
  assert.equal(before.sword,4)
  assert.equal(weaponMasteryLevel(after.sword),2)
  assert.equal(weaponMasteryBonus(after.sword),0)
  assert.equal(nextWeaponMasteryThreshold(after.sword),14)
})

test('mastery progresses to level 100 with modest bonuses', () => {
  assert.equal(weaponMasteryLevel(0),1)
  assert.equal(weaponMasteryLevel(4),1)
  assert.equal(weaponMasteryLevel(5),2)
  assert.equal(weaponMasteryLevel(14),3)
  assert.equal(weaponMasteryLevel(28),4)
  assert.equal(weaponMasteryLevel(48),5)
  assert.equal(weaponMasteryLevel(500000),100)
  assert.equal(weaponMasteryBonus(500000),9)
  assert.equal(weaponMasteryBonus(48),0)
  assert.equal(nextWeaponMasteryThreshold(500000),null)
  assert.ok(nextWeaponMasteryThreshold(48)>48)
})

test('additional valid class abilities do not remove basic attacks or the fallback', () => {
  assert.ok(getTacticalAttacks('dagger',['wave']).some(a=>a.id==='pulse'))
  assert.ok(getTacticalAttacks('dagger',['wave']).some(a=>a.id==='wave'))
  assert.ok(getTacticalAttacks('dagger',['not_a_real_attack']).every(a=>TACTICAL_ATTACKS[a.id]))
})

test('enemy tactical AI attacks when in reach, advances unarmed, and falls back if blocked', () => {
  const front={col:1,rank:0}, back={col:1,rank:2}
  assert.equal(chooseTacticalEnemyAction('sword',front,front).attack.id,'slash')
  assert.equal(chooseTacticalEnemyAction('bow',front,back).attack.id,'aimed')
  assert.equal(chooseTacticalEnemyAction('sword',front,back).attack.id,'thrust')
  assert.deepEqual(chooseTacticalEnemyAction('unarmed',back,front).move,{col:1,rank:1})
  const blocked=chooseTacticalEnemyAction('unarmed',back,front,
    [{col:0,rank:1},{col:1,rank:1},{col:2,rank:1}])
  assert.equal(blocked.attack.id,'pulse')
})

test('mastery techniques unlock at milestones without replacing baseline attacks', () => {
  const starter=getTacticalAttacks('sword',[],0)
  assert.ok(!starter.some(a=>a.id==='masterArc'))
  assert.ok(!starter.some(a=>a.id==='masterBurst'))
  const expert=getTacticalAttacks('sword',[],500000)
  assert.ok(expert.some(a=>a.id==='masterArc'))
  assert.ok(expert.some(a=>a.id==='masterBurst'))
  assert.ok(expert.some(a=>a.id==='pulse'))
  assert.ok(!getTacticalAttacks('sword',['masterLine'],0).some(a=>a.id==='masterLine'))
})

test('enemy escapes an inferno square before attacking when a safe adjacent tile exists',()=>{
  const start={col:1,rank:0},hero={col:1,rank:0}
  const hazard=[{col:1,rank:0}]
  const act=chooseTacticalEnemyAction('dagger',start,hero,[],hazard)
  assert.ok(act.move,'enemy should evacuate dangerous tile')
  assert.equal(hazard.some(p=>p.col===act.move.col&&p.rank===act.move.rank),false)
  assert.equal(Math.abs(act.move.col-start.col)+Math.abs(act.move.rank-start.rank),1)
})
test('enemy cannot escape onto an occupied tile and can still attack if boxed in',()=>{
  const start={col:1,rank:0},hero={col:1,rank:0}
  const hazard=[{col:1,rank:0}]
  const allies=[{col:0,rank:0,hp:5},{col:2,rank:0,hp:5},{col:1,rank:1,hp:5}]
  const act=chooseTacticalEnemyAction('dagger',start,hero,allies,hazard)
  assert.equal(Boolean(act.move),false)
  assert.ok(act.attack)
})

test('weapon mastery expands existing attacks but never System Pulse',()=>{
  const kit=getTacticalAttacks('sword',[],500000)
  assert.equal(kit.find(a=>a.id==='slash').shape,'diamond2')
  assert.equal(kit.find(a=>a.id==='sweep').shape,'rowPlus')
  assert.equal(kit.find(a=>a.id==='pulse').shape,'single')
  assert.equal(getTacticalAttacks('sword',[],0)[0].shape,'single')
  assert.equal(getTacticalAttacks('bow',[],500000).find(a=>a.id==='aimed').shape,'row')
  assert.equal(getTacticalAffectedSquares(kit[0],{col:1,rank:1}).length,9)
  assert.equal(TACTICAL_ATTACKS.slash.shape,'single')
})
test('new progressive footprints stay inside the 3×3 board',()=>{
  assert.equal(getTacticalAffectedSquares({shape:'fullRow'},{col:0,rank:1}).length,3)
  assert.equal(getTacticalAffectedSquares({shape:'diamond2'},{col:1,rank:1}).length,9)
  assert.equal(getTacticalAffectedSquares({shape:'diamond2'},{col:0,rank:0}).length,6)
  assert.equal(getTacticalAffectedSquares({shape:'wideColumn'},{col:0,rank:1}).length,6)
  assert.equal(getTacticalAffectedSquares({shape:'rowPlus'},{col:2,rank:0}).length,6)
  assert.equal(getTacticalAffectedSquares({shape:'all'},{col:2,rank:2}).length,9)
  assert.equal(getTacticalAffectedSquares({shape:'crossPlus'},{col:1,rank:1}).length,7)
  assert.equal(getTacticalAffectedSquares({shape:'crossPlus'},{col:1,rank:0}).length,6)
})

test('unequipped player starts with only Basic Strike and Improvised Throw',()=>{
  const kit=getPlayerTacticalAttacks(false,'unarmed',500000)
  assert.deepEqual(kit.map(attack=>attack.id),['bareStrike','improvisedThrow'])
  assert.equal(kit.some(a=>['stab','lunge','wave','pulse'].includes(a.id)),false)
  assert.equal(kit.every(a=>a.ap===1),true)
  assert.ok(tacticalAttackDescription(kit[0]).includes('1 square'))
  assert.ok(tacticalAttackDescription(kit[1]).includes('2 rounds'))
  assert.ok(getPlayerTacticalAttacks(true,'sword',0).some(a=>a.id==='slash'))
  assert.ok(getPlayerTacticalAttacks(true,'sword',0).some(a=>a.id==='pulse'))
})
test('unarmed basic strike only reaches the adjacent square straight ahead',()=>{
  const hero={col:1,rank:0}
  assert.equal(isTacticalTargetValid('bareStrike',hero,{col:1,rank:0}),true)
  assert.equal(isTacticalTargetValid('bareStrike',hero,{col:0,rank:0}),false)
  assert.equal(isTacticalTargetValid('bareStrike',hero,{col:1,rank:1}),false)
  assert.equal(isTacticalTargetValid('bareStrike',hero,{col:1,rank:2}),false)
  assert.equal(isTacticalTargetValid('bareStrike',{col:1,rank:1},{col:1,rank:0}),false)
  assert.equal(isTacticalTargetValid('bareStrike',hero,{col:0,rank:2}),false)
})
test('improvised throw uses distance and diagonal permission with shared recovery',()=>{
  const hero={col:1,rank:0}
  assert.equal(isTacticalTargetValid('improvisedThrow',hero,{col:0,rank:0}),true)
  assert.equal(isTacticalTargetValid('improvisedThrow',hero,{col:0,rank:1}),true)
  assert.equal(isTacticalTargetValid('improvisedThrow',hero,{col:2,rank:2}),true)
  assert.equal(isTacticalTargetValid('improvisedThrow',{col:0,rank:2},{col:2,rank:2}),false)
  const middle=startImprovisedThrowRecovery(1,1)
  const rear=startImprovisedThrowRecovery(1,2)
  assert.equal(middle,2)
  assert.equal(rear,3)
  assert.equal(improvisedThrowTurnsRemaining(middle,1),1)
  assert.equal(improvisedThrowTurnsRemaining(middle,2),0)
  assert.equal(improvisedThrowTurnsRemaining(rear,2),1)
  assert.equal(improvisedThrowTurnsRemaining(rear,3),0)
  assert.equal(startImprovisedThrowRecovery(1,0),2)
})

// Range and diagonal rules must be symmetric for players and enemies.
test('straight melee cannot hit diagonally; dagger throw reaches two squares',()=>{
  const attacker={col:1,rank:0}
  const diagonal={col:0,rank:0}
  assert.equal(isTacticalTargetValid('stab',attacker,diagonal),false)
  assert.equal(isTacticalTargetValid('bareStrike',attacker,diagonal),false)
  assert.equal(isTacticalTargetValid('throw',attacker,diagonal),true)
  assert.equal(isTacticalTargetValid('throw',attacker,{col:1,rank:1}),true)
  assert.equal(isTacticalTargetValid('throw',attacker,{col:0,rank:1}),false)
  assert.equal(isTacticalTargetValid('stab',diagonal,attacker),false)
})
