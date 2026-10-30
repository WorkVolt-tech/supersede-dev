// Completely isolated 1v1/boss test. All character saves stay in memory.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { usePlayerStore } from '../../src/store/usePlayerStore'
import { useInventoryStore } from '../../src/store/useInventoryStore'
import CombatScreen from '../../src/components/combat/CombatScreen'
import '../../src/index.css'

const params=new URLSearchParams(location.search)
const boss=params.get('scenario')==='boss'
const fused=params.get('scenario')!=='unfused'
const player={
  id:'test-single-fusion',name:'Fusion Tester',level:25,
  hp:160,max_hp:160,atk:30,def:10,guard:3,speed:12,insight:1,luck:0,
  agility:1,power:0,control:0,active_class:'ghostblade',element:'fire',
  defeated_bosses:['zone_boss_fire'],
  class_nodes_unlocked:['ghostblade:ghostblade_t1a','ghostblade:ghostblade_t1c'],
  elemental_unlocked:['fire_aggr_1','fire_aggr_2','fire_aggr_3',
    'fire_aggr_4','fire_aggr_5','fire_aggr_ks'],
  fusion_unlocked:fused?['ghostblade:fire']:[],
  fusion_mastery:{'ghostblade:fire':45},
  weapon_mastery:{sword:0},skill_levels:{},battle_skills:[],
  chapters_unlocked:[1],xp:0,skill_points:1,
}
const metrics={saves:0,lastUpdates:null}
window.__singleFusionMetrics=metrics
usePlayerStore.setState({
  player,loading:false,error:null,
  updatePlayer:async updates=>{
    metrics.saves++
    metrics.lastUpdates=updates
    usePlayerStore.setState(s=>({player:{...s.player,...updates}}))
    return true
  },
})
useInventoryStore.setState({
  loading:false,loadInventory:async()=>{},
  items:[{id:'test-sword',player_id:player.id,name:'Test Sword',
    item_type:'weapon',subtype:'sword',item_key:'test_sword',
    equipped_slot:'mainhand',atk_bonus:0,sockets_total:0,socketed_runes:[]}],
})
const encounter={name:boss?'Training Guardian':'Training Rival',
  hp:48,atk:3,def:0,speed:3,weapon_type:'sword',xp:0,loot:[],icon:'👹'}
createRoot(document.getElementById('root')).render(
  <CombatScreen enemyData={encounter} isBoss={boss}
    onWin={()=>document.body.dataset.outcome='win'}
    onLose={()=>document.body.dataset.outcome='lose'}/>
)
