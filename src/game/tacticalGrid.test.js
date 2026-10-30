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
  assert.equal(weaponMasteryBonus(after.sword),1)
  assert.equal(nextWeaponMasteryThreshold(after.sword),14)
})

test('mastery level is capped with small flat damage bonus', () => {
  assert.equal(weaponMasteryLevel(0),1)
  assert.equal(weaponMasteryLevel(4),1)
  assert.equal(weaponMasteryLevel(5),2)
  assert.equal(weaponMasteryLevel(14),3)
  assert.equal(weaponMasteryLevel(28),4)
  assert.equal(weaponMasteryLevel(48),5)
  assert.equal(weaponMasteryLevel(500000),5)
  assert.equal(weaponMasteryBonus(500000),4)
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
  const blocked=chooseTacticalEnemyAction('bow',front,back,
    [{col:1,rank:1},{col:0,rank:0},{col:2,rank:0}])
  assert.equal(blocked.attack.id,'pulse')
})
