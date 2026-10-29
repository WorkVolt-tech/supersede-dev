import { useEffect,useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import CombatScreen from '../combat/CombatScreen'
import { useInventoryStore } from '../../store/useInventoryStore'

const SCENES=[
 ['The Forbidden Formula','Master Ilyra examines your discovery item. “Potioncraft is precision. Carelessness poisons more than its maker.”',[['Meet Master Ilyra','meet_master']]],
 ['The Botanical Trial','Two nearly identical leaves lie beside a ruined garden. One heals; one carries a dangerous toxin.',[['Identify the healing herb by its veins','identify_herbs'],['Collect both without checking','gather_blindly']]],
 ['The Measure of a Drop','An unstable reaction glows inside the vessel. Even a small excess will make it burst.',[['Measure every reagent precisely','measure_precisely'],['Pour until the color looks right','pour_freely']]],
 ['The Filtration','The formula darkens with residue. Its restorative properties are trapped beneath unstable sediment.',[['Cool and filter the mixture','cool_and_filter'],['Bottle the mixture immediately','bottle_early']]],
 ['Soren · Rival Apprentice','Soren boasts that raw power matters more than control. Ilyra asks both of you to demonstrate your work.',[['Conduct a safe controlled demonstration','test_safely'],['Ignite the entire batch for spectacle','show_off']]],
 ['The Flaskborn Mutation','The rival experiment bursts open and a Flaskborn creature emerges from the fumes. Defeat it to protect the laboratory.',[]],
 ['Keeper of the Formula','Ilyra archives your work and awards the Formula Archive Vial. You have finished your first Alchemist chapter.',[]],
]
const ENEMY={name:'Mutated Flaskborn',icon:'☣️',hp:95,atk:13,def:4,xp:0,loot:[]}
export default function AlchemistAdventure({player,onReturn}){
 const [authorized,setAuthorized]=useState(null),[stage,setStage]=useState(0),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[battle,setBattle]=useState(false)
 const loadInventory=useInventoryStore(s=>s.loadInventory)
 useEffect(()=>{let live=true;Promise.all([
  supabase.from('profession_status').select('active_profession').eq('player_id',player.id).maybeSingle(),
  supabase.from('profession_unlocks').select('profession_key').eq('player_id',player.id).eq('profession_key','alchemist').maybeSingle(),
  supabase.from('profession_adventures').select('stage').eq('player_id',player.id).eq('profession_key','alchemist').maybeSingle()
 ]).then(([a,b,c])=>{if(!live)return;if(a.error||b.error||c.error)setMessage(a.error?.message||b.error?.message||c.error?.message);setAuthorized(a.data?.active_profession==='alchemist'&&!!b.data&&player.chapters_unlocked?.includes(3));setStage(c.data?.stage||0)});return()=>{live=false}},[player.id,player.chapters_unlocked?.join(',')])
 async function advance(action){if(busy)return;setBusy(true);const {data,error}=await supabase.rpc('advance_alchemist_trial',{target_player:player.id,action_key:action});if(error)setMessage(error.message);else{setStage(data.stage);setMessage(data.message+(data.xp?' · +'+data.xp+' Alchemist XP':''));if(data.stage===6)setBattle(false);await loadInventory(player.id)}setBusy(false)}
 if(authorized===null)return <p className="story-text">Checking Alchemist chapter access…</p>
 if(!authorized)return <section className="story-text"><h2>🔒 The Forbidden Formula</h2><p>Requires the Alchemist discovery, active Alchemist profession, and Chapter 3 unlock. Invited guests will be added with multiplayer.</p><button className="reading-action" onClick={onReturn}>← Professions</button></section>
 const [title,description,actions]=SCENES[stage]||SCENES[0]
 return <section className="story-text" style={{padding:'1rem'}}>
  <h2>⚗️ Alchemist · The Forbidden Formula</h2><p>Apprentice Chapter · Stage {Math.min(stage+1,6)} / 6</p>
  <h3>{title}</h3><p>{description}</p>{message&&<p role="status">{message}</p>}
  {actions.map(([label,key])=><button className="reading-action" key={key} disabled={busy} onClick={()=>advance(key)}>{label}</button>)}
  {stage===5&&!battle&&<button className="reading-action" onClick={()=>setBattle(true)}>⚔ Contain the Flaskborn</button>}
  {stage===5&&battle&&<CombatScreen enemyData={ENEMY} onWin={()=>advance('seal_mutation')} onLose={()=>{setBattle(false);setMessage('The mutation overwhelms you. Regroup and try again.')}} onEscape={()=>setBattle(false)}/>}
  <button className="reading-action" onClick={onReturn}>← Back to professions</button>
 </section>
}