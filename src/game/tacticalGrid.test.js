import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CLASSES } from './classes.js'
import {
  TACTICAL_ATTACKS, TACTICAL_WEAPONS, tacticalWeaponType, getTacticalAttacks,
  isTacticalTargetValid, getTacticalAffectedSquares, tacticalHitTargets,
  weaponMasteryLevel, weaponMasteryBonus, awardWeaponMastery,
  nextWeaponMasteryThreshold, hasFullTacticalCoverage, chooseTacticalEnemyAction,
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

test('frontline sword slash cannot reach a distant back-row enemy', () => {
  assert.equal(isTacticalTargetValid('slash',{col:1,rank:0},{col:1,rank:0}),true)
  assert.equal(isTacticalTargetValid('slash',{col:1,rank:0},{col:1,rank:2}),false)
  assert.equal(isTacticalTargetValid('slash',{col:1,rank:1},{col:1,rank:0}),false)
  assert.equal(isTacticalTargetValid('slash',{col:1,rank:0},{col:0,rank:0}),false)
})

test('spear reaches mid and ranged shot reaches rear without ignoring the firing position', () => {
  assert.equal(isTacticalTargetValid('thrust',{col:0,rank:1},{col:1,rank:1}),true)
  assert.equal(isTacticalTargetValid('thrust',{col:0,rank:2},{col:0,rank:0}),false)
  assert.equal(isTacticalTargetValid('aimed',{col:2,rank:2},{col:0,rank:2}),true)
  assert.equal(isTacticalTargetValid('aimed',{col:2,rank:0},{col:0,rank:2}),false)
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

test('enemy tactical AI uses legal attacks, moves when necessary and has a fallback', () => {
  const front={col:1,rank:0}, back={col:1,rank:2}
  assert.equal(chooseTacticalEnemyAction('sword', front,front).attack.id,'slash')
  const move=chooseTacticalEnemyAction('bow',front,back)
  assert.deepEqual(move.move,{col:1,rank:1})
  assert.equal(chooseTacticalEnemyAction('sword',front,back).attack.id,'pulse')
  assert.equal(chooseTacticalEnemyAction('unarmed',front,back).attack.id,'pulse')
  const blocked=chooseTacticalEnemyAction('bow',front,back,
    [{col:1,rank:1},{col:0,rank:0},{col:2,rank:0}])
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
})
