import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTacticalGroup,applyGroupAttack,nextAliveTarget,
  makeGroupField,advanceGroupFields } from './tacticalGroups.js'
import { TACTICAL_ATTACKS } from './tacticalGrid.js'

test('real groups split previous total HP and have distinct squares',()=>{
  for(const n of [2,3,5,9]){
    const units=createTacticalGroup({groupSize:n,hp:90,atk:9,name:'Crawler'})
    assert.equal(units.length,n)
    assert.equal(units.reduce((sum,u)=>sum+u.hp,0),90)
    assert.equal(new Set(units.map(u=>u.col+':'+u.rank)).size,n)
    assert.equal(units.every(u=>u.hp>0),true)
  }
})
test('a row swing damages exactly the occupied row and kills are unique',()=>{
  const units=createTacticalGroup({groupSize:5,hp:25,atk:5})
  const result=applyGroupAttack(units,TACTICAL_ATTACKS.sweep,{col:1,rank:0},units[0].id,5)
  assert.equal(result.valid,true)
  assert.equal(result.targets.length,3)
  assert.equal(result.defeated.length,3)
  assert.equal(result.units.filter(u=>u.hp>0).length,2)
  assert.equal(units.filter(u=>u.hp>0).length,5)
  assert.equal(nextAliveTarget(result.units,units[0].id).id,units[3].id)
})
test('column hit passes through ranks while a single strike cannot',()=>{
  const units=createTacticalGroup({groupSize:7,hp:70,atk:7})
  const column=applyGroupAttack(units,TACTICAL_ATTACKS.pierce,
    {col:1,rank:2},units[0].id,3)
  assert.equal(column.targets.length,3)
  const single=applyGroupAttack(units,TACTICAL_ATTACKS.pulse,
    {col:1,rank:0},units[0].id,3)
  assert.equal(single.targets.length,1)
})
test('illegal targets cannot damage enemies',()=>{
  const units=createTacticalGroup({groupSize:3,hp:30,atk:6})
  const miss=applyGroupAttack(units,TACTICAL_ATTACKS.slash,{col:1,rank:2},units[0].id,100)
  assert.equal(miss.valid,false)
  assert.equal(miss.units,units)
})
test('invalid group sizes fail closed',()=>{
  assert.throws(()=>createTacticalGroup({groupSize:10,hp:20}),RangeError)
  assert.throws(()=>createTacticalGroup({groupSize:1,hp:20}),RangeError)
})

test('initiative movement changes which attacks can reach the enemy',()=>{
  const foes=createTacticalGroup({groupSize:2,hp:20,atk:4})
  const front=foes[0]
  const moved=foes.map(foe=>foe.id===front.id?{...foe,rank:2}:foe)
  const hero={col:1,rank:0}
  assert.equal(applyGroupAttack(foes,TACTICAL_ATTACKS.slash,hero,front.id,5).valid,true)
  assert.equal(applyGroupAttack(moved,TACTICAL_ATTACKS.slash,hero,front.id,5).valid,false)
  assert.deepEqual(applyGroupAttack(moved,TACTICAL_ATTACKS.slash,hero,front.id,5).units,moved)
})

test('Inferno Zone damages occupied squares over three rounds, not a selected enemy',()=>{
  const foes=createTacticalGroup({groupSize:4,hp:80,atk:4})
  const center=foes[0]
  const field=makeGroupField('inferno',{
    shape:'cross',from:[0,1,2],to:[0,1,2],cols:'any'},center,3,4)
  assert.equal(field.squares.length,4) // edge-centred cross
  const turn1=advanceGroupFields(foes,[field])
  assert.deepEqual(turn1.units.map(foe=>foe.hp),[16,16,16,16])
  assert.equal(turn1.fields[0].turns,2)
  // One enemy escapes the zone before the next tick.
  const moved=turn1.units.map(foe=>foe.id===foes[3].id
    ?{...foe,col:2,rank:2}:foe)
  const turn2=advanceGroupFields(moved,turn1.fields)
  assert.deepEqual(turn2.units.map(foe=>foe.hp),[12,12,12,16])
  const turn3=advanceGroupFields(turn2.units,turn2.fields)
  assert.equal(turn3.fields.length,0)
  assert.deepEqual(turn3.units.map(foe=>foe.hp),[8,8,8,16])
  assert.equal(advanceGroupFields(turn3.units,turn3.fields).events.length,0)
})
test('field effects skip dead enemies and cannot trigger repeat kills',()=>{
  const units=[{id:'a',name:'A',col:1,rank:0,hp:3,maxHp:3}]
  const field=makeGroupField('inferno',{shape:'single'},units[0],2,10)
  const first=advanceGroupFields(units,[field])
  assert.equal(first.events[0].defeated,true)
  const second=advanceGroupFields(first.units,first.fields)
  assert.equal(second.events.length,0)
})
