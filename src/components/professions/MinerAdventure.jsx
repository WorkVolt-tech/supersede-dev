import { useEffect,useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import CombatScreen from '../combat/CombatScreen'
import { useInventoryStore } from '../../store/useInventoryStore'

const SCENES=[
 ['The Old Shaft','Supervisor Mara waits at the abandoned mine entrance. “The stones below Kessler hold more than ore. Learn to read them, or they will bury you.”',[['Meet Supervisor Mara','meet_supervisor']]],
 ['The Collapsing Passage','A rotten timber groans above the mine entrance. Rushing could seal the tunnel.',[['Reinforce the shaft before entering','reinforce_shaft'],['Rush inside','rush_shaft']]],
 ['Reading the Rock','Faint mineral streaks run through limestone. The richest vein is not always visible.',[['Trace the iron-colored seam','read_vein'],['Dig loose rubble','dig_rubble']]],
 ['The First Extraction','An iron seam curves alongside a fragile cave wall. Mara watches how you swing.',[['Extract in measured cuts','controlled_mining'],['Strike as hard as possible','reckless_mining']]],
 ['Rusk · The Rival Miner','Rusk challenges you to a contest for the deeper mineral deposit. Speed alone will not win.',[['Survey the chamber before Rusk','survey_before_rusk'],['Race straight into the darkness','race_rusk']]],
 ['The Caveheart Beast','A stone-skinned Caveheart Stalker guards the chamber. Defeat it to recover the rare mineral core.',[]],
 ['The Deepvein Apprentice','Mara welcomes you into the mining guild. You recovered ore and a Caveheart Mineral Core. Deeper expeditions will open later.',[]],
]
const ENEMY={name:'Caveheart Stalker',icon:'🪨',hp:95,atk:13,def:5,xp:0,loot:[]}
export default function MinerAdventure({player,onReturn}){
 const [authorized,setAuthorized]=useState(null),[stage,setStage]=useState(0),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[battle,setBattle]=useState(false)
 const loadInventory=useInventoryStore(s=>s.loadInventory)
 useEffect(()=>{let live=true;Promise.all([
  supabase.from('profession_status').select('active_profession').eq('player_id',player.id).maybeSingle(),
  supabase.from('profession_unlocks').select('profession_key').eq('player_id',player.id).eq('profession_key','miner').maybeSingle(),
  supabase.from('profession_adventures').select('stage').eq('player_id',player.id).eq('profession_key','miner').maybeSingle()
 ]).then(([a,b,c])=>{if(!live)return;if(a.error||b.error||c.error)setMessage(a.error?.message||b.error?.message||c.error?.message);setAuthorized(a.data?.active_profession==='miner'&&!!b.data&&player.chapters_unlocked?.includes(3));setStage(c.data?.stage||0)});return()=>{live=false}},[player.id,player.chapters_unlocked?.join(',')])
 async function advance(action){if(busy)return;setBusy(true);const {data,error}=await supabase.rpc('advance_miner_trial',{target_player:player.id,action_key:action});if(error)setMessage(error.message);else{setStage(data.stage);setMessage(data.message+(data.xp?' · +'+data.xp+' Miner XP':''));if(data.stage===6)setBattle(false);await loadInventory(player.id)}setBusy(false)}
 if(authorized===null)return <p className="story-text">Checking mining expedition access…</p>
 if(!authorized)return <section className="story-text"><h2>🔒 Beneath the Broken Earth</h2><p>Find the Miner's discovery item, activate Miner, and unlock Chapter 3 to enter. Multiplayer guests will be added later.</p><button className="reading-action" onClick={onReturn}>← Professions</button></section>
 const [title,text,actions]=SCENES[stage]||SCENES[0]
 return <section className="story-text" style={{padding:'1rem'}}>
  <h2>⛏️ Miner · Beneath the Broken Earth</h2><p>Apprentice expedition · Stage {Math.min(stage+1,6)} / 6</p>
  <h3>{title}</h3><p>{text}</p>
  {message&&<p role="status">{message}</p>}
  {actions.map(([label,key])=><button key={key} className="reading-action" disabled={busy} onClick={()=>advance(key)}>{label}</button>)}
  {stage===5&&!battle&&<button className="reading-action" onClick={()=>setBattle(true)}>⚔ Fight the Caveheart Stalker</button>}
  {stage===5&&battle&&<CombatScreen enemyData={ENEMY} onWin={()=>advance('claim_expedition')} onLose={()=>{setBattle(false);setMessage('The creature drives you out. Recover and return.') }} onEscape={()=>setBattle(false)}/>}
  <button className="reading-action" onClick={onReturn}>← Back to professions</button>
 </section>
}