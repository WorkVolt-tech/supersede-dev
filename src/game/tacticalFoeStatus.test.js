import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withFoeStatus, advanceFoeStatuses, enemyActionBudget } from './tacticalFoeStatus.js'
import { chooseTacticalEnemyAction } from './tacticalGrid.js'
import * as ClassCombat from './classCombat.js'
import { resolveKeystoneStrike } from './keystoneCombat.js'

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

test('real Wrathborn Fury Slam bleeds only the targeted enemy',()=>{
  const player={active_class:'wrathborn',class_nodes_unlocked:['wrathborn:wrathborn_t1c']}
  const shared={},perFoe={}
  ClassCombat.onCombatStart(player,shared)
  withFoeStatus(shared,perFoe,'rat-1',()=>ClassCombat.onActiveSkill(
    'fury_slam',player,shared,{name:'Rat',hp:15,hp_max:15}))
  assert.equal(perFoe['rat-1'].cls_bleedingTurns,3)
  assert.equal(perFoe['rat-2'],undefined)
  assert.equal(shared.cls_bleedingTurns,0)
  const after=advanceFoeStatuses([
    {id:'rat-1',name:'Rat 1',hp:15,maxHp:15},
    {id:'rat-2',name:'Rat 2',hp:15,maxHp:15}],perFoe,player)
  assert.deepEqual(after.units.map(u=>u.hp),[10,15])
})

test('real Arbiter Sentence Mark targets one foe without marking others',()=>{
  const player={active_class:'arbiter',class_nodes_unlocked:['arbiter:arbiter_t1c']}
  const shared={},perFoe={}
  ClassCombat.onCombatStart(player,shared)
  withFoeStatus(shared,perFoe,'rat-2',()=>ClassCombat.onActiveSkill(
    'sentence_mark',player,shared,{name:'Rat',hp:15,hp_max:15}))
  assert.equal(perFoe['rat-2'].cls_markTurns,3)
  assert.equal(perFoe['rat-1'],undefined)
  assert.equal(shared.cls_markTurns,0)
})

test('poison and ember stacks damage only their own foe each round',()=>{
  const units=[
    {id:'a',name:'A',hp:30,maxHp:30},
    {id:'b',name:'B',hp:30,maxHp:30},
    {id:'c',name:'C',hp:30,maxHp:30},
  ]
  const statuses={a:{cfx_longDecayStacks:2},b:{cfx_emberStacks:3},c:{}}
  const first=advanceFoeStatuses(units,statuses)
  assert.deepEqual(first.units.map(x=>x.hp),[24,18,30])
  assert.equal(first.statuses.a.cfx_longDecayStacks,2)
  assert.equal(first.statuses.b.cfx_emberStacks,3)
  const second=advanceFoeStatuses(first.units,first.statuses)
  assert.deepEqual(second.units.map(x=>x.hp),[18,6,30])
})

test('real Cinder Step and Plague Fang apply stacks to the struck enemy only',()=>{
  const global={cfx_emberStepTurns:2,cfx_plagueFangTurns:2,cfx_forgeAtk:true}
  const perFoe={}
  const attack=foeId=>withFoeStatus(global,perFoe,foeId,()=>
    resolveKeystoneStrike(global,10,false))
  assert.equal(attack('foe-1').damage,13)
  assert.equal(perFoe['foe-1'].cfx_emberStacks,1)
  assert.equal(perFoe['foe-1'].cfx_longDecayStacks,1)
  assert.equal(global.cfx_emberStacks,undefined)
  assert.equal(global.cfx_longDecayStacks,undefined)
  assert.equal(global.cfx_emberStepTurns,1)
  attack('foe-2')
  assert.equal(perFoe['foe-1'].cfx_emberStacks,1)
  assert.equal(perFoe['foe-2'].cfx_emberStacks,1)
  assert.equal(perFoe['foe-2'].cfx_longDecayStacks,1)
  assert.equal(global.cfx_emberStepTurns,0)
  assert.equal(global.cfx_plagueFangTurns,0)
})
