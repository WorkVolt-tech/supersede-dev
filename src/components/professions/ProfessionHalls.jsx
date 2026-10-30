import { useEffect,useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useInventoryStore } from '../../store/useInventoryStore'
import { PROFESSIONS } from '../../game/professions'
import { PROFESSION_HALLS,ADVENTURE_ROUTES,hallRotation } from '../../game/professionHalls'

export default function ProfessionHalls({player,onReturn,onNavigate}) {
 const [active,setActive]=useState(null)
 const [unlocked,setUnlocked]=useState([])
 const [loading,setLoading]=useState(true)
 const [selected,setSelected]=useState('merchant')
 const [stock,setStock]=useState([])
 const [orders,setOrders]=useState([])
 const [recipe,setRecipe]=useState(null)
 const [advanced,setAdvanced]=useState([])
 const [expeditions,setExpeditions]=useState([])
 const [dungeonSessions,setDungeonSessions]=useState([])
 const [expeditionRuns,setExpeditionRuns]=useState([])
 const [advancedRuns,setAdvancedRuns]=useState([])
 const [professionLevel,setProfessionLevel]=useState(1)
 const [lastWork,setLastWork]=useState(null)
 const inventory=useInventoryStore(x=>x.items)
 const [shopBusy,setShopBusy]=useState(false)
 const [shopMessage,setShopMessage]=useState('')
 const [shopLoading,setShopLoading]=useState(false)
 const loadPlayer=usePlayerStore(x=>x.loadPlayer)
 const loadInventory=useInventoryStore(x=>x.loadInventory)
 useEffect(()=>{
  let live=true
  Promise.all([
   supabase.from('profession_status').select('active_profession').eq('player_id',player.id).maybeSingle(),
   supabase.from('profession_unlocks').select('profession_key').eq('player_id',player.id)
  ]).then(([a,b])=>{if(!live)return;setActive(a.data?.active_profession||null);setUnlocked((b.data||[]).map(x=>x.profession_key));setLoading(false)})
  return ()=>{live=false}
 },[player.id])
 useEffect(()=>{let live=true;setShopLoading(true);setShopMessage('');Promise.all([supabase.rpc('npc_hall_stock',{hall_key:selected}),supabase.rpc('npc_hall_orders',{hall_key:selected,target_player:player.id})]).then(([a,b])=>{if(!live)return;setStock(a.data||[]);setOrders(b.data||[]);setShopMessage(a.error?.message||b.error?.message||'');setShopLoading(false)});return()=>{live=false}},[selected])
 async function buy(itemKey) {
  if(shopBusy)return
  setShopBusy(true)
  const {data,error}=await supabase.rpc('buy_npc_hall_item',{target_player:player.id,hall_key:selected,purchase_item:itemKey})
  setShopMessage(error?.message||data||'Purchased')
  if(!error){
   const [stockResult,userResult]=await Promise.all([supabase.rpc('npc_hall_stock',{hall_key:selected}),supabase.auth.getUser()])
   if(!stockResult.error)setStock(stockResult.data||[])
   await loadInventory(player.id)
   const ordersResult=await supabase.rpc('npc_hall_orders',{hall_key:selected,target_player:player.id})
   if(!ordersResult.error)setOrders(ordersResult.data||[])
   if(userResult.data?.user)await loadPlayer(userResult.data.user.id)
  }
  setShopBusy(false)
 }
 async function transact(action,payload){
  if(shopBusy)return
  setShopBusy(true)
  const {data,error}=await supabase.rpc(action,action==='sell_npc_hall_item'?{target_player:player.id,hall_key:selected,inventory_id:payload}:{target_player:player.id,hall_key:selected,requested_item:payload})
  setShopMessage(error?.message||data||'Complete')
  if(!error){
   const [a,b,userResult]=await Promise.all([supabase.rpc('npc_hall_stock',{hall_key:selected}),supabase.rpc('npc_hall_orders',{hall_key:selected,target_player:player.id}),supabase.auth.getUser()])
   if(!a.error)setStock(a.data||[])
   if(!b.error)setOrders(b.data||[])
   await loadInventory(player.id)
   if(userResult.data?.user)await loadPlayer(userResult.data.user.id)
  }
  setShopBusy(false)
 }
 useEffect(()=>{let live=true;Promise.all([
  supabase.from('profession_workshop_recipes').select('*,output:items!profession_workshop_recipes_output_key_fkey(name),input:items!profession_workshop_recipes_input_key_fkey(name)').eq('profession_key',selected).maybeSingle(),
  supabase.from('profession_workshop_runs').select('last_run_at').eq('player_id',player.id).eq('profession_key',selected).maybeSingle()
 ]).then(([a,b])=>{if(live){setRecipe(a.data||null);setLastWork(b.data?.last_run_at||null)}});return()=>{live=false}},[selected,player.id])
 async function work(){
  if(shopBusy)return
  setShopBusy(true)
  const {data,error}=await supabase.rpc('perform_profession_work',{target_player:player.id,job_key:selected})
  setShopMessage(error?.message||(data?'Produced '+data.qty+' × '+data.item+' · +'+data.xp+' profession XP':'Unable to produce'))
  if(!error){
   const [result,user]=await Promise.all([supabase.from('profession_workshop_runs').select('last_run_at').eq('player_id',player.id).eq('profession_key',selected).maybeSingle(),supabase.auth.getUser()])
   setLastWork(result.data?.last_run_at||null)
   await loadInventory(player.id)
   if(user.data?.user)await loadPlayer(user.data.user.id)
  }
  setShopBusy(false)
 }
 useEffect(()=>{let live=true;Promise.all([
  supabase.from('profession_advanced_recipes').select('*,output:items!profession_advanced_recipes_output_key_fkey(name),input:items!profession_advanced_recipes_input_key_fkey(name)').eq('profession_key',selected).order('required_level'),
  supabase.from('profession_advanced_runs').select('recipe_key,last_run_at').eq('player_id',player.id),
  supabase.from('profession_progress').select('level').eq('player_id',player.id).eq('profession_key',selected).maybeSingle()
 ]).then(([a,b,c])=>{if(!live)return;setAdvanced(a.data||[]);setAdvancedRuns(b.data||[]);setProfessionLevel(c.data?.level||1)});return()=>{live=false}},[selected,player.id])
 async function workAdvanced(recipeKey){
  if(shopBusy)return
  setShopBusy(true)
  const {data,error}=await supabase.rpc('perform_advanced_profession_work',{target_player:player.id,requested_recipe:recipeKey})
  setShopMessage(error?.message||(data?'Produced '+data.qty+' × '+data.item+' · +'+data.xp+' profession XP':'Production failed'))
  if(!error){
   const [runs,progress,user]=await Promise.all([
    supabase.from('profession_advanced_runs').select('recipe_key,last_run_at').eq('player_id',player.id),
    supabase.from('profession_progress').select('level').eq('player_id',player.id).eq('profession_key',selected).maybeSingle(),
    supabase.auth.getUser()
   ])
   setAdvancedRuns(runs.data||[]);setProfessionLevel(progress.data?.level||1)
   await loadInventory(player.id)
   if(user.data?.user)await loadPlayer(user.data.user.id)
  }
  setShopBusy(false)
 }
 useEffect(()=>{let live=true;Promise.all([
  supabase.from('profession_expeditions').select('*').eq('profession_key',selected).order('required_level'),
  supabase.from('profession_expedition_runs').select('expedition_key,last_success_at').eq('player_id',player.id),
  supabase.from('profession_dungeon_sessions').select('expedition_key,stage').eq('player_id',player.id)
  ]).then(([a,b,c])=>{if(live){setExpeditions(a.data||[]);setExpeditionRuns(b.data||[]);setDungeonSessions(c.data||[])}});return()=>{live=false}},[selected,player.id])
 async function expedition(key,action) {
  if(shopBusy)return
  setShopBusy(true)
  const {data,error}=await supabase.rpc('attempt_profession_expedition',{target_player:player.id,expedition_id:key,chosen_action:action})
  setShopMessage(error?.message||(data?.success?'Expedition complete: '+data.item+' · +'+data.xp+' XP':data?.message||'Expedition failed'))
  if(!error&&data?.success){
   const [runs,progress,user]=await Promise.all([
    supabase.from('profession_expedition_runs').select('expedition_key,last_success_at').eq('player_id',player.id),
    supabase.from('profession_progress').select('level').eq('player_id',player.id).eq('profession_key',selected).maybeSingle(),
    supabase.auth.getUser()
   ])
   setExpeditionRuns(runs.data||[]);setProfessionLevel(progress.data?.level||1)
   await loadInventory(player.id)
   if(user.data?.user)await loadPlayer(user.data.user.id)
  }
  setShopBusy(false)
 }
 async function progressDungeon(expeditionKey,action){
  if(shopBusy)return
  setShopBusy(true)
  const {data,error}=await supabase.rpc('progress_profession_dungeon',{target_player:player.id,expedition_id:expeditionKey,action_key:action})
  setShopMessage(error?.message||data?.message||'Expedition updated')
  if(!error){const a=await supabase.from('profession_dungeon_sessions').select('expedition_key,stage').eq('player_id',player.id);if(!a.error)setDungeonSessions(a.data||[])}
  setShopBusy(false)
 }
 const hall=PROFESSION_HALLS[selected]
 const cycle=hallRotation(selected)
 const hasAccess=player.chapters_unlocked?.includes(3)&&active===selected&&unlocked.includes(selected)
 return <section className="story-text" style={{padding:'1rem'}}>
  <h2>🏛️ Profession District</h2>
  <p>Visit the eight trade halls. Resident NPCs work here even when no players are available. Their featured creations, materials, and assignments rotate every two or three days.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8,marginBottom:24}}>
   {PROFESSIONS.map(p=><button className="reading-action" key={p.key} disabled={selected===p.key} onClick={()=>setSelected(p.key)}>{p.icon} {p.name}</button>)}
  </div>
  <h3>{hall.icon} {hall.name}</h3><p>📍 {hall.location}</p>
  <h4>Resident NPCs</h4>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
   {hall.residents.map(([name,role])=><div key={name} style={{border:'1px solid #a9927055',borderRadius:6,padding:12}}><strong>{name}</strong><p>{role} · NPC</p><p>Available for future services and interactions.</p></div>)}
  </div>
  <h4>NPC shop · rotating stock</h4>
  <p>Stock rotates every {cycle.hours} hours. Quantities are shared between visitors, and purchases use your character's gold.</p>
  <p>Next rotation: {stock[0]?.refresh_at?new Date(stock[0].refresh_at).toLocaleString():new Date(cycle.refreshAt).toLocaleString()} · Gold: {player.gold||0}</p>
  {shopMessage&&<p role="status">{shopMessage}</p>}
  {shopLoading?<p>Loading NPC stock…</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10}}>
   {stock.map(item=><div key={item.item_key} style={{padding:12,border:'1px solid #a99270555',borderRadius:6}}>
    <strong>{item.icon} {item.item_name}</strong><p>{item.rarity} · {item.price} gold · {item.remaining} remaining</p>
    <button className="reading-action" disabled={shopBusy||item.remaining<=0||player.gold<item.price} onClick={()=>buy(item.item_key)}>{item.remaining<=0?'Sold out':'Buy for '+item.price+' gold'}</button>
   </div>)}
  </div>}
  <h4>Profession workshop · create your own items</h4>
  {recipe?<div style={{border:'1px solid #a99270555',padding:14,borderRadius:6}}>
   <p><strong>Produce {recipe.output_qty} × {recipe.output?.name||recipe.output_key}</strong></p>
   <p>{recipe.input_qty>0?'Requires '+recipe.input_qty+' × '+(recipe.input?.name||recipe.input_key):'No materials required'} · +{recipe.xp_reward} profession XP · {recipe.cooldown_minutes} min cooldown</p>
   <button className="reading-action" disabled={shopBusy||!hasAccess||(lastWork&&Date.now()<new Date(lastWork).getTime()+recipe.cooldown_minutes*60000)} onClick={work}>{!hasAccess?'Activate this profession to work':'Produce items'}</button>
   {lastWork&&Date.now()<new Date(lastWork).getTime()+recipe.cooldown_minutes*60000&&<p>Next available: {new Date(new Date(lastWork).getTime()+recipe.cooldown_minutes*60000).toLocaleString()}</p>}
  </div>:<p>No workshop activity available.</p>}
  <h4>Profession recipes · Level {professionLevel}/100</h4>
  <p>Unlock stronger creations at levels 5, 15, 30, 50, 75, and 100. Master, Grandmaster, and Legendary creations consume materials from earlier tiers, with longer cooldowns.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(195px,1fr))',gap:10}}>
   {advanced.map(r=>{
    const last=advancedRuns.find(x=>x.recipe_key===r.recipe_key)?.last_run_at
    const cooling=last&&Date.now()<new Date(last).getTime()+r.cooldown_minutes*60000
    const owned=inventory.filter(x=>x.item_key===r.input_key&&!x.equipped_slot).reduce((n,x)=>n+x.quantity,0)
    return <div key={r.recipe_key} style={{border:'1px solid #a99270555',borderRadius:6,padding:12}}>
     <strong>{r.output?.name||r.output_key}</strong>
     <p>Requires level {r.required_level} · {r.input_qty} × {r.input?.name||r.input_key} (owned {owned})</p>
     <p>+{r.xp_reward} XP · {r.cooldown_minutes} min cooldown</p>
     {cooling&&<p>Available {new Date(new Date(last).getTime()+r.cooldown_minutes*60000).toLocaleString()}</p>}
     <button className="reading-action" disabled={shopBusy||!hasAccess||professionLevel<r.required_level||owned<r.input_qty||cooling} onClick={()=>workAdvanced(r.recipe_key)}>{professionLevel<r.required_level?'🔒 Level '+r.required_level:'Craft'}</button>
    </div>
   })}
  </div>
  <h4>Rare-resource expeditions</h4>
  <p>Explore profession-specific danger zones at levels 30, 50, and 75. Successful expeditions award rare materials and XP; the Level 50 resource is required for Master crafting.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10}}>
   {expeditions.map(e=>{
    const last=expeditionRuns.find(r=>r.expedition_key===e.expedition_key)?.last_success_at
    const cooling=last&&Date.now()<new Date(last).getTime()+e.cooldown_hours*3600000
    const canGo=hasAccess&&professionLevel>=e.required_level&&!cooling&&!shopBusy
    return <div key={e.expedition_key} style={{border:'1px solid #a99270555',borderRadius:6,padding:12}}>
     <strong>{e.title}</strong><p>{e.description}</p>
     <p>Level {e.required_level} · +{e.xp_reward} XP · {e.cooldown_hours}h cooldown</p>
     {cooling&&<p>Next expedition: {new Date(new Date(last).getTime()+e.cooldown_hours*3600000).toLocaleString()}</p>}
     {(()=>{
       const stage=dungeonSessions.find(x=>x.expedition_key===e.expedition_key)?.stage||0
       const labels=['Enter dungeon','Search for resource node','Stabilize environmental hazard']
       return stage<3?<button className="reading-action" disabled={!canGo} onClick={()=>progressDungeon(e.expedition_key,['enter','gather','secure'][stage])}>{labels[stage]}</button>:<p>⚔ Guardian discovered. Combat completion and rewards are locked pending server-verified battle integration.</p>
     })()}
    </div>
   })}
  </div>
  <h4>NPC commissions · {cycle.hours}-hour orders</h4>
  <p>Deliver two matching items to fulfill each order once per rotation. You can obtain them from NPC stock or other gameplay activities.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10}}>
   {orders.map(o=><div key={o.item_key} style={{padding:12,border:'1px solid #a9927055',borderRadius:6}}>
    <strong>{o.item_name}</strong><p>Deliver {o.required_quantity} · Earn {o.payout} gold</p>
    <button className="reading-action" disabled={shopBusy||o.completed||inventory.filter(i=>i.item_key===o.item_key&&!i.equipped_slot).reduce((sum,i)=>sum+i.quantity,0)<o.required_quantity} onClick={()=>transact('fulfill_npc_hall_order',o.item_key)}>{o.completed?'Completed':'Fulfill commission'}</button>
   </div>)}
  </div>
  <h4>Sell materials to NPCs</h4>
  <p>Eligible unequipped items can be sold individually. Profession unlock items cannot be sold.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10}}>
   {inventory.filter(i=>i.quantity>0&&!i.equipped_slot&&!i.item_key?.startsWith('profession_token_')&&i.item_type!=='key'&&i.item_type!=='rune'&&(i.item_type==='material'||i.item_type==='consumable'||stock.some(o=>o.item_key===i.item_key))).map(i=><div key={i.id} style={{padding:12,border:'1px solid #a99270555',borderRadius:6}}>
    <strong>{i.icon} {i.name}</strong><p>Owned: {i.quantity}</p>
    <button className="reading-action" disabled={shopBusy} onClick={()=>transact('sell_npc_hall_item',i.id)}>Sell one</button>
   </div>)}
  </div>
  <h4>Profession chapter</h4>
  {loading?<p>Checking profession access…</p>:hasAccess?<button className="reading-action" onClick={()=>onNavigate(ADVENTURE_ROUTES[selected])}>Enter {hall.name} adventure</button>:<p>🔒 You can visit this hall, but the exclusive storyline requires its discovery item, an active {PROFESSIONS.find(p=>p.key===selected)?.name} profession, and Chapter 3 access.</p>}
  <button className="reading-action" onClick={onReturn}>← Back to professions</button>
 </section>
}
