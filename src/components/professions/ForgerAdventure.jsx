import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import CombatScreen from '../combat/CombatScreen'
import { useInventoryStore } from '../../store/useInventoryStore'

const SCENES = [
 {title:'The Broken Forge',text:'The workshop stands beneath the ruins of Kessler. Master Varrin eyes your ember sigil. “A badge does not make you a smith. Show me what your hands can do.”',actions:[['Meet Master Varrin','meet_master']]},
 {title:'Lesson I · The Furnace',text:'The metal rests inside a roaring furnace. Too little heat leaves it brittle. Too much burns the steel.',actions:[['Maintain steady heat','steady_heat'],['Turn the furnace to maximum','overheat']]},
 {title:'Lesson II · Hammer and Anvil',text:'Varrin sets a blade blank before you. Every strike changes its balance.',actions:[['Strike carefully and rotate the blade','controlled_strikes'],['Hammer as quickly as possible','wild_strikes']]},
 {title:'Lesson III · The Quench',text:'The blade glows red. The final cooling will determine whether it survives.',actions:[['Quench gradually and inspect the edge','quench_gradually'],['Drop the entire blade into ice water','shock_quench']]},
 {title:'Kael · Rival at the Anvil',text:'Kael laughs at your plain design. His silver-trimmed sword sparkles under the light, but its center of mass looks wrong.',actions:[['Prioritize balance and a reliable edge','balance_over_flash'],['Add elaborate decorations to impress the judges','ornament']]},
 {title:'Field Trial · The Scrapbound',text:'Varrin gives you the Apprentice Trial Blade you forged. It is now in your inventory; equip it before the fight if you want to use it. At the ruined foundry, a Scrapbound construct lurches from the furnace. “A forged blade is only proven when it survives a fight.”',actions:[]},
 {title:'Apprentice of Steel',text:'Your first Trial of Steel is complete. Kael watches in silence as Varrin welcomes you to the guild. New profession quests will open in later adventures.',actions:[]},
]
const TRIAL_ENEMY={name:'Scrapbound Construct',icon:'⚙️',hp:85,atk:12,def:4,xp:0,loot:[]}
export default function ForgerAdventure({player,onReturn}) {
 const [status,setStatus]=useState(null)
 const [stage,setStage]=useState(0)
 const [message,setMessage]=useState('')
 const [busy,setBusy]=useState(false)
 const [battle,setBattle]=useState(false)
 const loadInventory=useInventoryStore(s=>s.loadInventory)
 useEffect(()=>{
  let live=true
  Promise.all([
   supabase.from('profession_status').select('active_profession').eq('player_id',player.id).maybeSingle(),
   supabase.from('profession_adventures').select('stage').eq('player_id',player.id).eq('profession_key','forger').maybeSingle(),
   supabase.from('profession_unlocks').select('profession_key').eq('player_id',player.id).eq('profession_key','forger').maybeSingle()
  ]).then(([a,b,c])=>{if(!live)return; if(a.error||b.error||c.error) setMessage(a.error?.message||b.error?.message||c.error?.message);setStatus(a.data?.active_profession==='forger'&&!!c.data&&player.chapters_unlocked?.includes(3));setStage(b.data?.stage||0)})
  return ()=>{live=false}
 },[player.id,player.chapters_unlocked?.join(',')])
 async function advance(action){
  if(busy)return
  setBusy(true)
  const {data,error}=await supabase.rpc('advance_forger_trial',{target_player:player.id,action_key:action})
  if(error)setMessage(error.message)
  else {setStage(data.stage);setMessage(data.message+(data.xp?' · +'+data.xp+' Forger XP':''));if(data.stage===6)setBattle(false);await loadInventory(player.id)}
  setBusy(false)
 }
 if(status===null) return <p className="story-text">Checking Forger chapter access…</p>
 if(!status) return <section className="story-text"><h2>🔒 The Trial of Steel</h2><p>Requires the Forger discovery and an active Forger profession after unlocking Chapter 3. Guests from other professions will be supported when multiplayer launches.</p><button className="reading-action" onClick={onReturn}>← Professions</button></section>
 const scene=SCENES[stage]||SCENES[0]
 return <section className="story-text" style={{padding:'1rem'}}>
  <h2>🔨 Forger · The Trial of Steel</h2><p>Apprentice Chapter · Trial {Math.min(stage+1,6)} / 6</p>
  <h3>{scene.title}</h3><p>{scene.text}</p>
  {message&&<p role="status">{message}</p>}
  {scene.actions.map(([label,key])=><button className="reading-action" key={key} disabled={busy} onClick={()=>advance(key)}>{label}</button>)}
  {stage===5&&!battle&&<button className="reading-action" onClick={()=>setBattle(true)}>⚔ Begin field trial</button>}
  {stage===5&&battle&&<CombatScreen enemyData={TRIAL_ENEMY} onWin={()=>advance('claim_trial')} onLose={()=>{setBattle(false);setMessage('The construct overpowers you. Return and try again.')}} onEscape={()=>setBattle(false)}/>}
  <button className="reading-action" onClick={onReturn}>← Back to professions</button>
 </section>
}
