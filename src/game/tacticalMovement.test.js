import test from 'node:test'
import assert from 'node:assert/strict'
import { tacticalMovementRange, canTacticalMove } from './tacticalGrid.js'

test('combat Speed controls free movement range',()=>{
 assert.equal(tacticalMovementRange(0),1)
 assert.equal(tacticalMovementRange(14),1)
 assert.equal(tacticalMovementRange(15),2)
 assert.equal(tacticalMovementRange(29),2)
 assert.equal(tacticalMovementRange(30),4)
})
test('high Speed allows two steps; very high Speed reaches any 3x3 square',()=>{
 const from={col:0,rank:0}
 assert.equal(canTacticalMove(from,{col:1,rank:0},0),true)
 assert.equal(canTacticalMove(from,{col:1,rank:1},14),false)
 assert.equal(canTacticalMove(from,{col:1,rank:1},15),true)
 assert.equal(canTacticalMove(from,{col:2,rank:2},29),false)
 assert.equal(canTacticalMove(from,{col:2,rank:2},30),true)
 assert.equal(canTacticalMove(from,from,30),false)
 assert.equal(canTacticalMove(from,{col:3,rank:0},30),false)
})
