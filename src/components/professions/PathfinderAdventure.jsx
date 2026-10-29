import { useEffect,useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import CombatScreen from '../combat/CombatScreen'
import { useInventoryStore } from '../../store/useInventoryStore'

const SCENES=[
 ['The Forgotten World','Archivist Lyra examines your Pathfinder Compass. “Maps do not show the whole world. They show what someone wanted remembered.”',[['Meet Archivist Lyra','meet_scholar']]],
 ['Beneath the Towers','Two ruined towers cast broken shadows across a weathered map. The compass needle spins.',[['Align the map with the surviving landmarks','align_landmarks'],['Walk toward the compass without studying the map','follow_blindly']]],
 ['Words of the Ancients','An inscription warns of a corridor that only opens to those who understand the ancient script.',[['Decode the inscription before entering','decode_inscription'],['Step onto the glowing tiles','rush_corridor']]],
 ['The Unbroken Relic','A relic sits inside a fragile display. Nearby stones shift beneath your feet.',[['Preserve the relic and disarm the trap','preserve_relic'],['Pull the relic free immediately','grab_relic']]],
 ['Vey · The Rival Explorer','Vey claims a second entrance leads to the archive. His map contains markings that do not match the sky.',[['Compare his chart to the stars','verify_chart'],['Accept his chart as genuine','trust_vey']]],
 ['The Archive Sentinel','A massive stone guardian awakens as the archive opens. It has protected these records for centuries.',[]],
 ['Guardian of the Lost Archive','Lyra rewards you with a Lost World Compass Shard. The archive is saved, but other hidden locations remain.',[]],
]
const ENEMY={name:'Archive Sentinel',icon:'🗿',hp:95,atk:13,def:4,xp:0,loot:[]}
export default function PathfinderAdventure({player,onReturn}){
 const [authorized,setAuthorized]=useState(null),[stage,setStage]=useState(0),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[battle,setBattle]=useState(false)
 const loadInventory=useInventoryStore(s=>s.loadInventory)
 useEffect(()=>{let live=true;Promise.all([
  supabase.from('profession_status').select('active_profession').eq('player_id',player.id).maybeSingle(),
  supabase.from('profession_unlocks').select('profession_key').eq('player_id',player.id).eq('profession_key','pathfinder').maybeSingle(),
  supabase.from('profession_adventures').select('stage').eq('player_id',player.id).eq('profession_key','pathfinder').maybeSingle()
 ]).then(([a,b,c])=>{if(!live)return;if(a.error||b.error||c.error)setMessage(a.error?.message||b.error?.message||c.error?.message);setAuthorized(a.data?.active_profession==='pathfinder'&&!!b.data&&player.chapters_unlocked?.includes(3));setStage(c.data?.stage||0)});return()=>{live=false}},[player.id,player.chapters_unlocked?.join(',')])
 async function advance(action){if(busy)return;setBusy(true);const {data,error}=await supabase.rpc('advance_pathfinder_trial',{target_player:player.id,action_key:action});if(error)setMessage(error.message);else{setStage(data.stage);setMessage(data.message+(data.xp?' · +'+data.xp+' Pathfinder XP':''));if(data.stage===6)setBattle(false);await loadInventory(player.id)}setBusy(false)}
 if(authorized===null)return <p className="story-text">Checking Pathfinder chapter access…</p>
 if(!authorized)return <section className="story-text"><h2>🔒 The Forgotten World</h2><p>Requires the Pathfinder discovery, active Pathfinder profession, and Chapter 3 unlock. Invited guests will be added with multiplayer.</p><button className="reading-action" onClick={onReturn}>← Professions</button></section>
 const [title,description,actions]=SCENES[stage]||SCENES[0]
 return <section className="story-text" style={{padding:'1rem'}}>
  <h2>🧭 Pathfinder · The Forgotten World</h2><p>Apprentice Chapter · Stage {Math.min(stage+1,6)} / 6</p>
  <h3>{title}</h3><p>{description}</p>{message&&<p role="status">{message}</p>}
  {actions.map(([label,key])=><button className="reading-action" key={key} disabled={busy} onClick={()=>advance(key)}>{label}</button>)}
  {stage===5&&!battle&&<button className="reading-action" onClick={()=>setBattle(true)}>⚔ Confront the Archive Sentinel</button>}
  {stage===5&&battle&&<CombatScreen enemyData={ENEMY} onWin={()=>advance('claim_relic')} onLose={()=>{setBattle(false);setMessage('The guardian forces you to retreat. Decode the chamber and return.')}} onEscape={()=>setBattle(false)}/>}
  <button className="reading-action" onClick={onReturn}>← Back to professions</button>
 </section>
}