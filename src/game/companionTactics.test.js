import {test} from 'node:test'
import assert from 'node:assert/strict'
import {initialCompanionPositions,decideCompanionAction} from './companionTactics.js'
const hero={col:1,rank:0}
test('companions occupy separate legal cells and do not overlap the hero',()=>{
 const party=initialCompanionPositions([{id:'marcus'},{id:'lena'},{id:'gio'}],hero)
 assert.equal(new Set(party.map(p=>p.col+','+p.rank)).size,3)
 assert.ok(party.every(p=>p.col!==hero.col||p.rank!==hero.rank))
})
test('a melee ally moves instead of attacking across the board',()=>{
 const ally={id:'marcus',col:0,rank:0,damage:4}
 const decision=decideCompanionAction(ally,[ally],[{id:'enemy',col:1,rank:2,hp:12}],[],hero)
 assert.equal(decision.kind,'move')
 assert.equal(Math.abs(decision.to.col-ally.col)+Math.abs(decision.to.rank-ally.rank),1)
})
test('a ranged ally attacks when range is legal',()=>{
 const ally={id:'rhen',col:0,rank:0,damage:5}
 const decision=decideCompanionAction(ally,[ally],[{id:'enemy',col:1,rank:2,hp:12}],[],hero)
 assert.equal(decision.kind,'attack')
})
test('an ally leaves a threatened cell before attacking when a safe neighbor exists',()=>{
 const ally={id:'rhen',col:0,rank:0,damage:5}
 const decision=decideCompanionAction(ally,[ally],[{id:'enemy',col:1,rank:0,hp:12}],
  [{col:0,rank:0}],hero)
 assert.equal(decision.kind,'move')
 assert.notDeepEqual(decision.to,{col:0,rank:0})
})
