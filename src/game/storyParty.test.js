import {test} from 'node:test'
import assert from 'node:assert/strict'
import {partyTagsForScene,activeCompanions,partyAwareText} from './storyParty.js'
test('choice joins are persisted as distinct members; scenes without join do not invent allies',()=>{
 let tags=partyTagsForScene([],'garage_b2_together')
 assert.deepEqual(activeCompanions({alliance_log:tags}).map(x=>x.id),['marcus'])
 tags=partyTagsForScene(tags,'garage_b2_fight_together')
 assert.equal(activeCompanions({alliance_log:tags}).length,1)
 tags=partyTagsForScene(tags,'district_hub')
 assert.equal(activeCompanions({alliance_log:tags}).length,0)
})
test('market ally joins and departures use the same saved party state',()=>{
 let tags=partyTagsForScene([],'market_b2_ally_path')
 assert.deepEqual(activeCompanions({alliance_log:tags}).map(x=>x.id),['lena'])
 tags=partyTagsForScene(tags,'market_b4_gio_cross')
 assert.deepEqual(activeCompanions({alliance_log:tags}).map(x=>x.id),['gio'])
})
test('narration reflects actual membership rather than exposing conditional directions',()=>{
 const line="Lena — if she's with you — moves to intercept a Drone immediately. Her fighting style is focused: one clean strike, reposition, repeat. No flourishes. Pure function."
 assert.match(partyAwareText(line,{alliance_log:['party:lena']}),/Lena intercepts/)
 assert.equal(partyAwareText(line,{alliance_log:[]}),"")
})
