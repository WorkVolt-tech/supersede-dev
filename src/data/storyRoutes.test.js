import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NODES as CH1 } from './ch1/nodes.js'
import { NODES as CH2 } from './ch2/nodes.js'
import { NODES as CH3 } from './ch3/nodes.js'

// Guard against silent dead-end buttons when chapter data changes.
for (const [chapter,nodes] of [['Chapter 1',CH1],['Chapter 2',CH2],['Chapter 3',CH3]]) {
  test(chapter+' has reachable literal story choices and combat outcomes',()=>{
    assert.ok(nodes.opening,chapter+' missing opening')
    let choices=0,combats=0
    for(const [key,node] of Object.entries(nodes)){
      assert.equal(node.id,key,chapter+' mismatched node id: '+key)
      const destinations=[
        ...(node.choices||[]).map(choice=>choice.next),
        ...['onWin','onLose','onEscape','onContinue'].map(prop=>node[prop]).filter(Boolean),
      ]
      for(const destination of destinations){
        if(destination==='__eye_return__')continue // Explicitly resolved by story engine
        assert.equal(typeof destination,'string',chapter+' invalid destination on '+key)
        assert.ok(nodes[destination],chapter+': '+key+' points to missing '+destination)
      }
      if(node.type==='combat'||node.type==='boss'){
        combats++
        assert.ok(node.enemy,chapter+' combat without enemy at '+key)
        assert.ok(node.onWin && nodes[node.onWin],chapter+' combat missing win route at '+key)
        assert.ok(node.onLose && nodes[node.onLose],chapter+' combat missing lose route at '+key)
      }
      choices+=(node.choices||[]).length
    }
    assert.ok(choices>5,chapter+' has no choices')
    assert.ok(combats>0,chapter+' has no fights')
  })
}
