import { useEffect,useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import CombatScreen from '../combat/CombatScreen'
import { useInventoryStore } from '../../store/useInventoryStore'

const SCENES=[
 ['The Shattered Harmony','Mentor Selene stands beside an altar of broken crystals. “Fragments carry memories of power. A Weaver learns to hear what they remember.”',[['Meet Mentor Selene','meet_mentor']]],
 ['The Fractured Prism','An unstable Fragment floats above the altar, its inner pattern visibly fractured.',[['Study the Fragment before touching it','inspect_fragment'],['Force the Fragment open','break_fragment']]],
 ['Finding the Frequency','Two unstable pulses interfere with each other. The stronger the push, the more chaotic the pattern becomes.',[['Align the frequencies gradually','stabilize_frequency'],['Flood the altar with energy','overcharge']]],
 ['The Forgotten Pattern','Runes of light reveal a combination sequence. A mistaken order could collapse the attunement.',[['Map and record the combination carefully','map_combination'],['Guess the order of the symbols','guess_pattern']]],
 ['Nyx · Rival Weaver','Nyx promises incredible power through reckless amplification. Selene demands a controlled demonstration.',[['Maintain stable attunement','controlled_attunement'],['Amplify beyond the safe threshold','reckless_boost']]],
 ['The Corrupted Echo','A shattered pulse becomes a hostile Echo. Defeat it to restore the harmony of the workshop.',[]],
 ['Keeper of Harmony','Selene presents you with the Harmonized Prism Shard. The first Weaver trial is complete, but deeper Resonance mysteries await.',[]],
]
const ENEMY={name:'Corrupted Echo',icon:'💠',hp:95,atk:13,def:4,xp:0,loot:[]}
export default function ResonanceWeaverAdventure({player,onReturn}){
 const [authorized,setAuthorized]=useState(null),[stage,setStage]=useState(0),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[battle,setBattle]=useState(false)
 const loadInventory=useInventoryStore(s=>s.loadInventory)
 useEffect(()=>{let live=true;Promise.all([
  supabase.from('profession_status').select('active_profession').eq('player_id',player.id).maybeSingle(),
  supabase.from('profession_unlocks').select('profession_key').eq('player_id',player.id).eq('profession_key','resonance_weaver').maybeSingle(),
  supabase.from('profession_adventures').select('stage').eq('player_id',player.id).eq('profession_key','resonance_weaver').maybeSingle()
 ]).then(([a,b,c])=>{if(!live)return;if(a.error||b.error||c.error)setMessage(a.error?.message||b.error?.message||c.error?.message);setAuthorized(a.data?.active_profession==='resonance_weaver'&&!!b.data&&player.chapters_unlocked?.includes(3));setStage(c.data?.stage||0)});return()=>{live=false}},[player.id,player.chapters_unlocked?.join(',')])
 async function advance(action){if(busy)return;setBusy(true);const {data,error}=await supabase.rpc('advance_resonance_weaver_trial',{target_player:player.id,action_key:action});if(error)setMessage(error.message);else{setStage(data.stage);setMessage(data.message+(data.xp?' · +'+data.xp+' Resonance Weaver XP':''));if(data.stage===6)setBattle(false);await loadInventory(player.id)}setBusy(false)}
 if(authorized===null)return <p className="story-text">Checking Resonance Weaver chapter access…</p>
 if(!authorized)return <section className="story-text"><h2>🔒 The Shattered Harmony</h2><p>Requires the Resonance Weaver discovery, active Resonance Weaver profession, and Chapter 3 unlock. Invited guests will be added with multiplayer.</p><button className="reading-action" onClick={onReturn}>← Professions</button></section>
 const [title,description,actions]=SCENES[stage]||SCENES[0]
 return <section className="story-text" style={{padding:'1rem'}}>
  <h2>💠 Resonance Weaver · The Shattered Harmony</h2><p>Apprentice Chapter · Stage {Math.min(stage+1,6)} / 6</p>
  <h3>{title}</h3><p>{description}</p>{message&&<p role="status">{message}</p>}
  {actions.map(([label,key])=><button className="reading-action" key={key} disabled={busy} onClick={()=>advance(key)}>{label}</button>)}
  {stage===5&&!battle&&<button className="reading-action" onClick={()=>setBattle(true)}>⚔ Confront the Corrupted Echo</button>}
  {stage===5&&battle&&<CombatScreen enemyData={ENEMY} onWin={()=>advance('seal_echo')} onLose={()=>{setBattle(false);setMessage('The Echo overwhelms the altar. Recenter and try again.')}} onEscape={()=>setBattle(false)}/>}
  <button className="reading-action" onClick={onReturn}>← Back to professions</button>
 </section>
}