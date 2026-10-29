import test from 'node:test'
import assert from 'node:assert/strict'
import { PROFESSION_TREES, activeProfessionRanks } from '../src/game/professionTrees.js'

test('all eight professions have 3 branches and 10 ranked upgrades each',()=>{
 assert.equal(Object.keys(PROFESSION_TREES).length,8)
 for(const branches of Object.values(PROFESSION_TREES)) {
  assert.equal(Object.keys(branches).length,3)
  for(const branch of Object.values(branches)) assert.equal(branch.ranks.length,10)
 }
})
test('excess purchases become inactive in purchase order after level loss',()=>{
 const history=['shopkeeper','broker','shopkeeper','supplier']
 assert.deepEqual(activeProfessionRanks(history,10),{shopkeeper:1,broker:1,supplier:0})
 assert.deepEqual(activeProfessionRanks(history,20),{shopkeeper:2,broker:1,supplier:1})
})
