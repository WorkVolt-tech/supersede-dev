// Vite serves this page only in development/tests; it is not included in
// the production index.html build. No credentials or real player data.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { usePlayerStore } from '../../src/store/usePlayerStore'
import { useInventoryStore } from '../../src/store/useInventoryStore'
import GroupCombatScreen from '../../src/components/combat/GroupCombatScreen'
import '../../src/index.css'

const scenario=new URLSearchParams(location.search).get('scenario')
const fusionScenario=scenario==='fusion'
const player = {
  id:'test-only-player',name:'Tactical Tester',level:fusionScenario?25:1,hp:160,max_hp:160,
  atk:12,def:8,guard:3,speed:12,insight:1,luck:0,agility:1,
  power:0,control:0,active_class:fusionScenario?'ghostblade':null,
  element:fusionScenario?'fire':'none',active_element:null,
  weapon_mastery:{sword:new URLSearchParams(location.search).get('scenario')==='mastery'?500000:0},
  skill_levels:{},elemental_unlocked:fusionScenario?
    ['fire_aggr_1','fire_aggr_2','fire_aggr_3','fire_aggr_4','fire_aggr_5','fire_aggr_ks']:[],
  defeated_bosses:fusionScenario?['fire_boss_placeholder']:[],
  class_nodes_unlocked:fusionScenario?['ghostblade:ghostblade_t1a','ghostblade:ghostblade_t1c']:[],
  fusion_unlocked:fusionScenario?['ghostblade:fire']:[],
  fusion_mastery:fusionScenario?{'ghostblade:fire':45}:{},
  chapters_unlocked:[1],xp:0,skill_points:0,
}
const metrics={saves:0}
window.__tacticalTestMetrics=metrics
usePlayerStore.setState({
  player,loading:false,error:null,
  // Save in the test-only in-memory store. The harness NEVER writes Supabase.
  updatePlayer:async updates=>{
    metrics.saves++
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

const victoryScenario=new URLSearchParams(window.location.search)
  .get('scenario')==='victory'
const enemyData={
  name:'Training Rats x3',groupSize:3,groupUnitName:'Training Rat',
  groupIcon:'🐀',groupWeapon:'dagger',icon:'🐀🐀🐀',
  hp:victoryScenario?9:120,atk:6,speed:3,def:0,xp:0,loot:[],
}
createRoot(document.getElementById('root')).render(
  <GroupCombatScreen
    enemyData={enemyData}
    onWin={()=>document.body.dataset.outcome='win'}
    onLose={()=>document.body.dataset.outcome='lose'}
    onEscape={()=>document.body.dataset.outcome='escape'}
  />
)
