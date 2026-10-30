// Archive/Skills integration fixture. Test characters and equipment stay local.
import React, {useState} from 'react'
import {createRoot} from 'react-dom/client'
import {usePlayerStore} from '../../src/store/usePlayerStore'
import {useInventoryStore} from '../../src/store/useInventoryStore'
import StartMenu from '../../src/components/menu/StartMenu'
import TestsPreviewsPage from '../../src/components/menu/TestsPreviewsPage'
import SkillsScreen from '../../src/components/skills/SkillsScreen'
import {getEffectiveStats} from '../../src/game/playerStats'
import '../../src/index.css'
import '../../src/components/book/BookShell.css'

const chapter3=new URLSearchParams(location.search).get('chapter')==='3'
const player={
  id:'archive-test-player',username:'Archive Tester',level:3,xp:0,
  hp:110,max_hp:110,gold:30,moral_score:0,badge:'neutral',
  atk:2,def:3,power:3,guard:3,speed:3,control:3,insight:3,luck:3,agility:3,
  skill_points:4,resonance_shards:0,
  pvp_kills:8,helps_given:4,
  current_node:'ch1_start',
  chapters_unlocked:chapter3?[1,2,3]:[1],chapters_completed:chapter3?[1,2]:[],
  skills_unlocked:[],elemental_unlocked:[],class_nodes_unlocked:[],
  battle_skills:[],fusion_unlocked:[],fusion_mastery:{},
}
const items=[{
  id:'test-equipped',player_id:player.id,equipped_slot:'mainhand',
  item_type:'weapon',subtype:'sword',name:'Equipment Stat Test Sword',
  atk_bonus:3,def_bonus:2,sockets_total:0,socketed_runes:[],
}]
usePlayerStore.setState({player,loading:false,error:null})
useInventoryStore.setState({items,loading:false})
window.__archiveExpectedStats=getEffectiveStats(player,items)
function Harness(){
  const [view,setView]=useState('menu')
  const handlePick=next=>setView(next)
  if(view==='menu')return <StartMenu player={player} onPick={handlePick}
    onSignOut={()=>setView('signed-out')} onReset={()=>setView('reset')}/>
  if(view==='tests-previews')return <TestsPreviewsPage
    player={player} onPick={handlePick} onReturn={()=>setView('menu')}/>
  if(view==='skills')return <SkillsScreen onReturn={()=>setView('menu')}/>
  return <div id="archive-selected-route" data-view={view}>
    <button onClick={()=>setView('tests-previews')}>Back to Tests & Previews</button>
  </div>
}
createRoot(document.getElementById('root')).render(<Harness/>)
