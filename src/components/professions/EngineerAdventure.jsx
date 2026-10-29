import { useEffect,useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import CombatScreen from '../combat/CombatScreen'
import { useInventoryStore } from '../../store/useInventoryStore'

const SCENES=[
 ['Rise of the Machines','Chief Mechanic Orin surveys a damaged workshop. “Machines do exactly what they are built to do. It is our job to make sure that is safe.”',[['Meet Chief Mechanic Orin','meet_mechanic']]],
 ['A Dangerous Circuit','The control panel sparks. A live circuit runs through the broken machine.',[['Isolate the power source','isolate_power'],['Grab the wires while powered','touch_wires']]],
 ['The Broken Actuator','A robotic arm shakes and struggles to turn. The gear teeth have shifted.',[['Realign the actuator and test movement','repair_actuator'],['Force the motor at maximum speed','force_motor']]],
 ['A Sensor Gone Wrong','The repaired machine still reports impossible measurements. The sensor must be recalibrated.',[['Calibrate against a known reference','calibrate_sensor'],['Ignore the error readings','ignore_sensor']]],
 ['Tarek · Rival Inventor','Tarek boasts about his fast prototype. Orin challenges you both to build a machine that survives a safety trial.',[['Choose a reliable protected design','safe_prototype'],['Remove safeguards for speed','unsafe_prototype']]],
 ['The Rogue Automaton','A workshop defense automaton escapes its control system. Shut it down before it destroys the facility.',[]],
 ['Mechanist Apprentice','Orin awards you a rare Calibrated Mechanist Core. The workshop survives, and more demanding inventions await.',[]],
]
const ENEMY={name:'Rogue Automaton',icon:'🤖',hp:95,atk:13,def:4,xp:0,loot:[]}
export default function EngineerAdventure({player,onReturn}){
 const [authorized,setAuthorized]=useState(null),[stage,setStage]=useState(0),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[battle,setBattle]=useState(false)
 const loadInventory=useInventoryStore(s=>s.loadInventory)
 useEffect(()=>{let live=true;Promise.all([
  supabase.from('profession_status').select('active_profession').eq('player_id',player.id).maybeSingle(),
  supabase.from('profession_unlocks').select('profession_key').eq('player_id',player.id).eq('profession_key','engineer').maybeSingle(),
  supabase.from('profession_adventures').select('stage').eq('player_id',player.id).eq('profession_key','engineer').maybeSingle()
 ]).then(([a,b,c])=>{if(!live)return;if(a.error||b.error||c.error)setMessage(a.error?.message||b.error?.message||c.error?.message);setAuthorized(a.data?.active_profession==='engineer'&&!!b.data&&player.chapters_unlocked?.includes(3));setStage(c.data?.stage||0)});return()=>{live=false}},[player.id,player.chapters_unlocked?.join(',')])
 async function advance(action){if(busy)return;setBusy(true);const {data,error}=await supabase.rpc('advance_engineer_trial',{target_player:player.id,action_key:action});if(error)setMessage(error.message);else{setStage(data.stage);setMessage(data.message+(data.xp?' · +'+data.xp+' Engineer XP':''));if(data.stage===6)setBattle(false);await loadInventory(player.id)}setBusy(false)}
 if(authorized===null)return <p className="story-text">Checking Engineer chapter access…</p>
 if(!authorized)return <section className="story-text"><h2>🔒 Rise of the Machines</h2><p>Requires the Engineer discovery, active Engineer profession, and Chapter 3 unlock. Invited guests will be added with multiplayer.</p><button className="reading-action" onClick={onReturn}>← Professions</button></section>
 const [title,description,actions]=SCENES[stage]||SCENES[0]
 return <section className="story-text" style={{padding:'1rem'}}>
  <h2>🔧 Engineer · Rise of the Machines</h2><p>Apprentice Chapter · Stage {Math.min(stage+1,6)} / 6</p>
  <h3>{title}</h3><p>{description}</p>{message&&<p role="status">{message}</p>}
  {actions.map(([label,key])=><button className="reading-action" key={key} disabled={busy} onClick={()=>advance(key)}>{label}</button>)}
  {stage===5&&!battle&&<button className="reading-action" onClick={()=>setBattle(true)}>⚔ Confront the Rogue Automaton</button>}
  {stage===5&&battle&&<CombatScreen enemyData={ENEMY} onWin={()=>advance('disable_automaton')} onLose={()=>{setBattle(false);setMessage('The automaton drives you back. Repair your equipment and try again.')}} onEscape={()=>setBattle(false)}/>}
  <button className="reading-action" onClick={onReturn}>← Back to professions</button>
 </section>
}