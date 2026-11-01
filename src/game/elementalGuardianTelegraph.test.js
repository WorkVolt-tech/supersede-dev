import test from 'node:test'
import assert from 'node:assert/strict'
import { previewElementalGuardianAttack, previewBossAttack } from './enemyAI.js'

const names=['The Ashen King','The Tide Queen','The Fractured Arc','The Infinite Archivist','The Hollow Reaper','The Warden of Ruin','The Stormborn','The Root Mother','The Iron Sovereign','The Plague Coil']
test('all ten Chapter 2 guardians show legal three-by-three attacks',()=>{
 for(const name of names){
  for(let turn=0;turn<3;turn++){
   const result=previewElementalGuardianAttack({name,hp:100},turn,100,{col:1,rank:0})
   assert.ok(result?.cells.length>0,name)
   assert.ok(result.cells.every(cell=>cell.rank>=0&&cell.rank<3&&cell.col>=0&&cell.col<3),name)
  }
 }
})
test('telegraphs target rows, columns and spots distinctly',()=>{
 const boss={name:'The Ashen King',hp:100}
 const column=previewElementalGuardianAttack(boss,0,100,{col:2,rank:1})
 const row=previewElementalGuardianAttack(boss,1,100,{col:2,rank:1})
 assert.ok(column.cells.every(cell=>cell.col===2))
 assert.ok(row.cells.every(cell=>cell.rank===1))
 assert.ok(!row.cells.some(cell=>cell.rank===0))
})
test('enraged guardians switch attack rotation',()=>{
 const boss={name:'The Ashen King',hp:100}
 const normal=previewElementalGuardianAttack(boss,0,100,{col:1,rank:0})
 const enraged=previewElementalGuardianAttack(boss,0,40,{col:1,rank:0})
 assert.equal(enraged.enraged,true)
 assert.notEqual(normal.name,enraged.name)
})

test('boss warnings are available to other chapters',()=>{
 for(const name of ['The Watcher','Sentinel of the First Eye','The Surveyor','The Unseen','The Twin Judges','Echo Beast']){
  const warning=previewBossAttack({name,hp:250},0,250,{col:1,rank:0})
  assert.ok(warning?.cells.length>0,name)
  assert.ok(warning.cells.every(c=>c.rank>=0&&c.rank<3&&c.col>=0&&c.col<3),name)
 }
})
test('generic boss warning locks onto hero position when prepared',()=>{
 const boss={name:'The Watcher',hp:200}
 const warning=previewBossAttack(boss,0,200,{col:0,rank:0})
 assert.deepEqual(warning.cells,[{rank:0,col:0}])
 assert.ok(!warning.cells.some(c=>c.rank===0&&c.col===1))
})
