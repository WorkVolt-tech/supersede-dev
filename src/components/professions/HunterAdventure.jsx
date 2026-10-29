import { useEffect,useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import CombatScreen from '../combat/CombatScreen'
import { useInventoryStore } from '../../store/useInventoryStore'

const SCENES=[
 ['The Apex Hunt','Warden Nessa examines your Hunter Crest. “The wilds leave clues for those patient enough to read them.”',[['Meet Warden Nessa','meet_warden']]],
 ['Tracks in Ash','Something heavy has crossed the scorched woodland. Its claw marks overlap several ordinary animal trails.',[['Study the older claw marks','read_tracks'],['Follow the freshest footprints immediately','rush_tracks']]],
 ['The Silent Approach','A wary herd grazes beyond the river. One wrong move will scatter the evidence.',[['Move downwind and observe','follow_wind'],['Approach directly through the clearing','rush_herd']]],
 ['A Careful Harvest','An abandoned nesting ground contains unusual fibers and shed scales. The ecosystem is fragile.',[['Collect only undamaged loose materials','harvest_carefully'],['Rip open the nest for more materials','ruin_nest']]],
 ['Dren · Rival Hunter','Dren claims he tracked the legendary creature alone. Nessa asks you both to present proof.',[['Present your mapped trails and field notes','trust_evidence'],['Accuse Dren without evidence','accuse_dren']]],
 ['The Howler Territory','The Apex Howler emerges from a twisted thicket. Its rare mineralized fangs are coveted by crafters.',[]],
 ['Mark of the Hunter','Nessa presents your guild recognition, and you keep a rare Howler Fang. Greater hunts lie ahead.',[]],
]
const ENEMY={name:'Apex Howler',icon:'🐺',hp:95,atk:13,def:4,xp:0,loot:[]}
export default function HunterAdventure({player,onReturn}){
 const [authorized,setAuthorized]=useState(null),[stage,setStage]=useState(0),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[battle,setBattle]=useState(false)
 const loadInventory=useInventoryStore(s=>s.loadInventory)
 useEffect(()=>{let live=true;Promise.all([
  supabase.from('profession_status').select('active_profession').eq('player_id',player.id).maybeSingle(),
  supabase.from('profession_unlocks').select('profession_key').eq('player_id',player.id).eq('profession_key','hunter').maybeSingle(),
  supabase.from('profession_adventures').select('stage').eq('player_id',player.id).eq('profession_key','hunter').maybeSingle()
 ]).then(([a,b,c])=>{if(!live)return;if(a.error||b.error||c.error)setMessage(a.error?.message||b.error?.message||c.error?.message);setAuthorized(a.data?.active_profession==='hunter'&&!!b.data&&player.chapters_unlocked?.includes(3));setStage(c.data?.stage||0)});return()=>{live=false}},[player.id,player.chapters_unlocked?.join(',')])
 async function advance(action){if(busy)return;setBusy(true);const {data,error}=await supabase.rpc('advance_hunter_trial',{target_player:player.id,action_key:action});if(error)setMessage(error.message);else{setStage(data.stage);setMessage(data.message+(data.xp?' · +'+data.xp+' Hunter XP':''));if(data.stage===6)setBattle(false);await loadInventory(player.id)}setBusy(false)}
 if(authorized===null)return <p className="story-text">Checking Hunter chapter access…</p>
 if(!authorized)return <section className="story-text"><h2>🔒 The Apex Hunt</h2><p>Requires the Hunter discovery, active Hunter profession, and Chapter 3 unlock. Invited guests will be added with multiplayer.</p><button className="reading-action" onClick={onReturn}>← Professions</button></section>
 const [title,description,actions]=SCENES[stage]||SCENES[0]
 return <section className="story-text" style={{padding:'1rem'}}>
  <h2>🏹 Hunter · The Apex Hunt</h2><p>Apprentice Chapter · Stage {Math.min(stage+1,6)} / 6</p>
  <h3>{title}</h3><p>{description}</p>{message&&<p role="status">{message}</p>}
  {actions.map(([label,key])=><button className="reading-action" key={key} disabled={busy} onClick={()=>advance(key)}>{label}</button>)}
  {stage===5&&!battle&&<button className="reading-action" onClick={()=>setBattle(true)}>⚔ Confront the Apex Howler</button>}
  {stage===5&&battle&&<CombatScreen enemyData={ENEMY} onWin={()=>advance('complete_hunt')} onLose={()=>{setBattle(false);setMessage('The Howler drives you back. Recover and return.')}} onEscape={()=>setBattle(false)}/>}
  <button className="reading-action" onClick={onReturn}>← Back to professions</button>
 </section>
}