import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withFoeStatus, advanceFoeStatuses, enemyActionBudget } from './tacticalFoeStatus.js'
import { chooseTacticalEnemyAction } from './tacticalGrid.js'

test('different enemies retain separate bleeds and marks',()=>{
  const shared={cls_markTurns:0,cls_stance:'solar'},perFoe={}
  withFoeStatus(shared,perFoe,'a',()=>{shared.cls_markTurns=3;shared.cls_bleedingTurns=2;shared.cls_bleedingDmg=4})
  withFoeStatus(shared,perFoe,'b',()=>{assert.equal(shared.cls_markTurns,undefined);shared.cls_rotTurns=2;shared.cls_rotDmg=8})
  assert.equal(shared.cls_markTurns,0)
  assert.equal(shared.cls_stance,'solar')
  assert.equal(perFoe.a.cls_markTurns,3)
  assert.equal(perFoe.b.cls_bleedingTurns,undefined)
})
test('bleed, rot and drowning tick independently, never damaging dead foes',()=>{
  const units=[{id:'a',name:'A',hp:20,maxHp:20},
    {id:'b',name:'B',hp:12,maxHp:12},{id:'dead',name:'D',hp:0,maxHp:10}]
  const statuses={a:{cls_bleedingTurns:2,cls_bleedingDmg:3,cls_rotTurns:1,cls_rotDmg:4},
    b:{cls_drownTurns:2,cls_drownStacks:2},dead:{cls_bleedingTurns:3,cls_bleedingDmg:100}}
  const after=advanceFoeStatuses(units,statuses)
  assert.deepEqual(after.units.map(u=>u.hp),[13,2,0])
  assert.equal(after.statuses.a.cls_bleedingTurns,1)
  assert.equal(after.statuses.a.cls_rotTurns,0)
  assert.equal(after.statuses.b.cls_drownTurns,1)
  assert.equal(after.statuses.dead.cls_bleedingTurns,3)
  assert.equal(statuses.a.cls_bleedingTurns,2)
})
test('drowning damage may defeat one foe without harming its neighbor',()=>{
  const a=advanceFoeStatuses([{id:'a',name:'A',hp:10,maxHp:10},{id:'b',name:'B',hp:20,maxHp:20}],
    {a:{cls_drownTurns:1,cls_drownStacks:3},b:{}})
  assert.deepEqual(a.events.map(x=>x.id),['a'])
  assert.equal(a.events[0].defeated,true)
  assert.equal(a.statuses.a.cls_drownStacks,0)
})
test('group enemy damage has a round budget',()=>{
  assert.equal(enemyActionBudget(4,5),7)
  assert.equal(enemyActionBudget(6,5),9)
})
test('unarmed rear enemies advance while out of range',()=>{
  const start={col:1,rank:2},player={col:1,rank:0}
  const first=chooseTacticalEnemyAction('unarmed',start,player)
  assert.deepEqual(first.move,{col:1,rank:1})
  const next=chooseTacticalEnemyAction('unarmed',first.move,player)
  assert.equal(Boolean(next.attack),true)
  assert.equal(next.attack.fallback,undefined)
})
test('blocked middle rank forces fallback instead of moving through allies',()=>{
  const a=chooseTacticalEnemyAction('unarmed',{col:1,rank:2},{col:1,rank:0},
    [{col:0,rank:1},{col:1,rank:1},{col:2,rank:1}])
  assert.equal(a.attack.fallback,true)
})
