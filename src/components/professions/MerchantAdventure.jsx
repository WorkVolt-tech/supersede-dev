import { useEffect,useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import CombatScreen from '../combat/CombatScreen'
import { useInventoryStore } from '../../store/useInventoryStore'

const SCENES=[
 ['The Golden Exchange','Pell stands beside the ruins of his trading stall. “Trading is about trust. A careless merchant loses more than gold.”',[['Meet Pell and accept the ledger','meet_pell']]],
 ['A Broken Inventory','The first shipment contains sealed crates. Their supplier claims every item is undamaged.',[['Inspect each crate before accepting','inspect_goods'],['Trust the supplier without checking','skip_inspection']]],
 ['The Bargain','A district buyer desperately needs provisions, but your goods are limited.',[['Offer fair terms and secure repeat business','fair_offer'],['Demand an unreasonable price','unfair_offer']]],
 ['Rival Broker','A competing trader presents a contract with unusually generous terms.',[['Verify every clause','verify_contract'],['Sign without reading','blind_sign']]],
 ['Caravan Route','Pell sends you with supplies toward the eastern market. One passage looks short but unsafe.',[['Scout a secure route','secure_route'],['Take the collapsed shortcut','shortcut']]],
 ['The Roadside Ambush','Raiders block the last road to the market. Protect the cargo and finish the delivery.',[]],
 ['Guild Recognition','Pell stamps your ledger. You have earned the Kessler Trade Seal and completed your first Merchant chapter.',[]],
]
const ENEMY={name:'Caravan Raider',icon:'🗡️',hp:90,atk:12,def:4,xp:0,loot:[]}
export default function MerchantAdventure({player,onReturn}){
 const [authorized,setAuthorized]=useState(null),[stage,setStage]=useState(0),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[battle,setBattle]=useState(false)
 const loadInventory=useInventoryStore(s=>s.loadInventory)
 useEffect(()=>{let live=true;Promise.all([
  supabase.from('profession_status').select('active_profession').eq('player_id',player.id).maybeSingle(),
  supabase.from('profession_unlocks').select('profession_key').eq('player_id',player.id).eq('profession_key','merchant').maybeSingle(),
  supabase.from('profession_adventures').select('stage').eq('player_id',player.id).eq('profession_key','merchant').maybeSingle()
 ]).then(([a,b,c])=>{if(!live)return;if(a.error||b.error||c.error)setMessage(a.error?.message||b.error?.message||c.error?.message);setAuthorized(a.data?.active_profession==='merchant'&&!!b.data&&player.chapters_unlocked?.includes(3));setStage(c.data?.stage||0)});return()=>{live=false}},[player.id,player.chapters_unlocked?.join(',')])
 async function advance(action){if(busy)return;setBusy(true);const {data,error}=await supabase.rpc('advance_merchant_trial',{target_player:player.id,action_key:action});if(error)setMessage(error.message);else{setStage(data.stage);setMessage(data.message+(data.xp?' · +'+data.xp+' Merchant XP':''));if(data.stage===6)setBattle(false);await loadInventory(player.id)}setBusy(false)}
 if(authorized===null)return <p className="story-text">Checking Merchant chapter access…</p>
 if(!authorized)return <section className="story-text"><h2>🔒 The Golden Exchange</h2><p>Requires the Merchant discovery, active Merchant profession, and Chapter 3 unlock. Invited guests will be added with multiplayer.</p><button className="reading-action" onClick={onReturn}>← Professions</button></section>
 const [title,description,actions]=SCENES[stage]||SCENES[0]
 return <section className="story-text" style={{padding:'1rem'}}>
  <h2>🪙 Merchant · The Golden Exchange</h2><p>Apprentice Chapter · Stage {Math.min(stage+1,6)} / 6</p>
  <h3>{title}</h3><p>{description}</p>{message&&<p role="status">{message}</p>}
  {actions.map(([label,key])=><button className="reading-action" key={key} disabled={busy} onClick={()=>advance(key)}>{label}</button>)}
  {stage===5&&!battle&&<button className="reading-action" onClick={()=>setBattle(true)}>⚔ Defend the caravan</button>}
  {stage===5&&battle&&<CombatScreen enemyData={ENEMY} onWin={()=>advance('complete_delivery')} onLose={()=>{setBattle(false);setMessage('The raiders drive you back. Prepare and try again.')}} onEscape={()=>setBattle(false)}/>}
  <button className="reading-action" onClick={onReturn}>← Back to professions</button>
 </section>
}