// Vite serves this page only in development/tests; it is not included in
// the production index.html build. No credentials or real player data.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { usePlayerStore } from '../../src/store/usePlayerStore'
import { useInventoryStore } from '../../src/store/useInventoryStore'
import GroupCombatScreen from '../../src/components/combat/GroupCombatScreen'
import { ELEMENT_TREES } from '../../src/game/elementsTree'
import '../../src/index.css'

const scenario=new URLSearchParams(location.search).get('scenario')
const signatureElement={
  'signature-fire':'fire','signature-earth':'earth','signature-lightning':'lightning'
}[scenario]
const triadScenario=scenario==='triad-fire'||scenario==='triad-victory'
const fusionScenario=scenario==='fusion'||scenario==='fusion-victory'||
  Boolean(signatureElement)||triadScenario
const fusionElement=signatureElement||'fire'
const fusionClass=signatureElement==='earth'?'bastion':
  signatureElement==='lightning'?'wrathborn':'ghostblade'
const player = {
  id:'test-only-player',name:'Tactical Tester',level:fusionScenario?25:1,hp:160,max_hp:160,
  atk:12,def:8,guard:3,speed:12,insight:1,luck:0,agility:1,
  power:0,control:0,active_class:triadScenario?null:fusionScenario?fusionClass:null,
  element:fusionScenario?fusionElement:'none',active_element:null,
  weapon_mastery:{sword:new URLSearchParams(location.search).get('scenario')==='mastery'?500000:0},
  skill_levels:{},elemental_unlocked:triadScenario
    ?ELEMENT_TREES.fire.nodes.slice(1).map(n=>n.id)
    :fusionScenario?[1,2,3,4,5].map(n=>fusionElement+'_aggr_'+n)
      .concat([fusionElement+'_aggr_ks']):[],
  defeated_bosses:fusionScenario?['zone_boss_'+fusionElement]:[],
  class_nodes_unlocked:triadScenario?[]:fusionScenario?[fusionClass+':'+fusionClass+'_t1a',
    fusionClass+':'+fusionClass+'_t1c']:[],
  fusion_unlocked:triadScenario?['triad:fire']:
    fusionScenario?[fusionClass+':'+fusionElement]:[],
  fusion_mastery:triadScenario?{'triad:fire':0}:
    fusionScenario?{[fusionClass+':'+fusionElement]:45}:{},
  chapters_unlocked:[1],xp:0,skill_points:0,
}
const metrics={saves:0}
window.__tacticalTestMetrics=metrics
usePlayerStore.setState({
  player,loading:false,error:null,
  // Save in the test-only in-memory store. The harness NEVER writes Supabase.
  updatePlayer:async updates=>{
    metrics.saves++
    metrics.lastUpdates=updates
    usePlayerStore.setState(s=>({player:{...s.player,...updates}}))
    return true
  },
})
useInventoryStore.setState({
  loading:false,
  loadInventory:async()=>{},
  items:[{
    id:'test-only-sword',player_id:player.id,
    name:'Training Sword',item_type:'weapon',subtype:'sword',
    item_key:'training_sword',equipped_slot:'mainhand',
    atk_bonus:0,sockets_total:0,socketed_runes:[],
  }],
})

const victoryScenario=scenario==='victory'||scenario==='fusion-victory'||
  scenario==='triad-victory'
const enemyData={
  name:'Training Rats x3',groupSize:3,groupUnitName:'Training Rat',
  groupIcon:'🐀',groupWeapon:'dagger',icon:'🐀🐀🐀',
  hp:victoryScenario?9:triadScenario?480:120,atk:6,speed:3,def:0,xp:0,loot:[],
}
createRoot(document.getElementById('root')).render(
  <GroupCombatScreen
    enemyData={enemyData}
    onWin={()=>document.body.dataset.outcome='win'}
    onLose={()=>document.body.dataset.outcome='lose'}
    onEscape={()=>document.body.dataset.outcome='escape'}
  />
)
