import {test} from 'node:test'
import assert from 'node:assert/strict'
import {bestTacticalAim,tacticalPreview,sameBattleSquare} from './tacticalPreview.js'
import {TACTICAL_ATTACKS} from './tacticalGrid.js'
import {getProgressedTacticalSkillRule} from './tacticalSkills.js'
const hero={col:1,rank:0}
test('AoE aims to maximize real enemies hit instead of unrelated first tile',()=>{
 const enemies=[0,1,2].map((col,i)=>({id:'foe-'+i,col,rank:0,hp:30}))
 const aim=bestTacticalAim(TACTICAL_ATTACKS.sweep,hero,enemies,'foe-0')
 assert.deepEqual(aim,{col:1,rank:0})
 const prev=tacticalPreview(TACTICAL_ATTACKS.sweep,hero,aim,enemies)
 assert.equal(prev.squares.length,3)
 assert.equal(prev.targets.length,3)
})
test('hovering a different legal AoE center updates exact footprint without moving units',()=>{
 const enemies=[{id:'one',col:0,rank:1,hp:8},{id:'two',col:2,rank:1,hp:12}]
 const pattern=TACTICAL_ATTACKS.wave
 const left=tacticalPreview(pattern,hero,{col:0,rank:1},enemies)
 const right=tacticalPreview(pattern,hero,{col:2,rank:1},enemies)
 assert.ok(!sameBattleSquare(left.squares[0],right.squares[0]))
 assert.deepEqual(enemies.map(e=>e.hp),[8,12])
})
test('leveled elemental AoE uses its expanded shape with legal aim constraints',()=>{
 const pattern=getProgressedTacticalSkillRule('lightning_skill_lightning_strike',7)
 const enemies=[{id:'left',col:0,rank:0,hp:9},{id:'middle',col:1,rank:0,hp:9},{id:'right',col:2,rank:0,hp:9}]
 const aim=bestTacticalAim(pattern,hero,enemies,'middle')
 const preview=tacticalPreview(pattern,hero,aim,enemies)
 assert.equal(pattern.shape,'cross')
 assert.ok(preview.targets.length>=2)
 assert.equal(tacticalPreview(pattern,hero,{col:7,rank:7},enemies).squares.length,0)
})
