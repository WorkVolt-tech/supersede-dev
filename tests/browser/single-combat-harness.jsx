// Completely isolated 1v1/boss test. All character saves stay in memory.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { usePlayerStore } from '../../src/store/usePlayerStore'
import { useInventoryStore } from '../../src/store/useInventoryStore'
import CombatScreen from '../../src/components/combat/CombatScreen'
import { ELEMENT_TREES } from '../../src/game/elementsTree'
import '../../src/index.css'

const params=new URLSearchParams(location.search)
const unarmedScenario=params.get('scenario')?.startsWith('unarmed-')
const boss=params.get('scenario')==='boss'
const signatureElement={'signature-fire':'fire','signature-earth':'earth',
  'signature-lightning':'lightning'}[params.get('scenario')]
const triadElement=params.get('scenario')?.startsWith('triad-')
  ?params.get('scenario').slice(6):null
const triadScenario=Boolean(triadElement&&ELEMENT_TREES[triadElement])
const fused=params.get('scenario')!=='unfused'
const fusionElement=signatureElement||triadElement||'fire'
const fusionClass=signatureElement==='earth'?'bastion':
  signatureElement==='lightning'?'wrathborn':'ghostblade'
const player={
  id:'test-single-fusion',name:'Fusion Tester',level:unarmedScenario?3:25,
  hp:160,max_hp:160,atk:30,def:10,guard:3,speed:12,insight:1,luck:0,
  agility:1,power:0,control:0,
  active_class:unarmedScenario||triadScenario?null:fusionClass,
  element:unarmedScenario?'none':fusionElement,
  defeated_bosses:['zone_boss_'+fusionElement],
  class_nodes_unlocked:triadScenario?[]:
    [fusionClass+':'+fusionClass+'_t1a',fusionClass+':'+fusionClass+'_t1c'],
  elemental_unlocked:triadScenario?ELEMENT_TREES[fusionElement].nodes.slice(1).map(n=>n.id):
    [1,2,3,4,5].map(n=>fusionElement+'_aggr_'+n)
      .concat([fusionElement+'_aggr_ks']),
  fusion_unlocked:unarmedScenario?[]:triadScenario?['triad:'+fusionElement]:
    fused?[fusionClass+':'+fusionElement]:[],
  fusion_mastery:triadScenario?{['triad:'+fusionElement]:0}:
    {[fusionClass+':'+fusionElement]:45},
  weapon_mastery:{sword:0},skill_levels:{},
  skills_unlocked:params.get('scenario')==='loadout'?['ofn1']:[],
  battle_skills:params.get('scenario')==='loadout'?['ofn1']:[],
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
  items:unarmedScenario?[]:[{id:'test-sword',player_id:player.id,name:'Test Sword',
    item_type:'weapon',subtype:'sword',item_key:'test_sword',
    equipped_slot:'mainhand',atk_bonus:0,sockets_total:0,socketed_runes:[]}],
})
const encounter={name:boss?'Training Guardian':'Training Rival',
  hp:unarmedScenario||signatureElement||triadScenario?180:48,atk:3,def:0,
  initialTacticalPosition:unarmedScenario?{
    col:1,rank:params.get('scenario')==='unarmed-middle'?1:2,
  }:undefined,
  speed:3,weapon_type:'sword',xp:0,loot:[],icon:'👹'}
createRoot(document.getElementById('root')).render(
  <CombatScreen enemyData={encounter} isBoss={boss}
    onWin={()=>document.body.dataset.outcome='win'}
    onLose={()=>document.body.dataset.outcome='lose'}/>
)
