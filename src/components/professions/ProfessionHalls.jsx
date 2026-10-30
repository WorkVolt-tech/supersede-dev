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
