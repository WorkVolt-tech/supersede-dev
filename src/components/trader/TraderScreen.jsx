import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useInventoryStore } from '../../store/useInventoryStore'

const VENDORS=[
 {key:'trader',name:'The Trader',intro:'I do not ask questions. I just sell.',items:['knife','jacket','energy_drink','medkit','wooden_shield','leather_gloves','worn_boots','iron_sword','riot_vest','iron_helm','iron_shield','iron_ring']},
 {key:'pell',name:'Pell',intro:'I keep my promises, and I keep supplies.',items:['medkit','energy_drink','leather_gloves','worn_boots','iron_helm','iron_shield','riot_vest','knife','iron_sword','iron_ring']},
]
export default function TraderScreen({onReturn}){
 const player=usePlayerStore(s=>s.player)
 const updatePlayer=usePlayerStore(s=>s.updatePlayer)
 const items=useInventoryStore(s=>s.items)
 const reload=useInventoryStore(s=>s.loadInventory)
 const [catalog,setCatalog]=useState([])
 const [vendor,setVendor]=useState('trader')
 const [tab,setTab]=useState('buy')
 const [busy,setBusy]=useState(false)
 const [notice,setNotice]=useState('')
 useEffect(()=>{let cancelled=false;supabase.from('items').select('*').then(({data,error})=>{if(!cancelled){setCatalog(data||[]);if(error)setNotice(error.message)}});return()=>{cancelled=true}},[])
 const npc=VENDORS.find(v=>v.key===vendor)
 const unlocked=(player?.chapters_unlocked||[]).includes(2)||(player?.current_chapter||1)>=2
 const choices=VENDORS.filter(v=>v.key!=='pell'||(player?.alliance_log||[]).includes('pell_met'))
 const stock=catalog.filter(item=>npc.items.includes(item.item_key)&&Number(item.buy_price)>0&&(unlocked||!['iron_sword','riot_vest','iron_helm','iron_shield','iron_ring'].includes(item.item_key)))
 async function buy(item){
  if(busy||!player||Number(player.gold)<Number(item.buy_price))return
  setBusy(true);setNotice('')
  try{
   const {error}=await supabase.from('inventory').insert({player_id:player.id,item_key:item.item_key,name:item.name,item_type:item.item_type,subtype:item.subtype||null,quantity:1,buy_price:item.buy_price,sell_price:item.sell_price||0})
   if(error)throw error
   const ok=await updatePlayer({gold:Number(player.gold)-Number(item.buy_price)})
   if(!ok)throw Error('Purchase added, but gold could not be saved. Contact support before purchasing again.')
   await reload(player.id);setNotice('Purchased '+item.name)
  }catch(error){setNotice(error.message)}finally{setBusy(false)}
 }
 async function sell(item){
  if(busy||item.equipped_slot||!player)return
  setBusy(true);setNotice('')
  try{
   const price=Number(item.sell_price)||0
   const qty=Math.max(1,Number(item.quantity)||1)
   const {error}=qty>1?await supabase.from('inventory').update({quantity:qty-1}).eq('id',item.id).eq('player_id',player.id):await supabase.from('inventory').delete().eq('id',item.id).eq('player_id',player.id)
   if(error)throw error
   if(!await updatePlayer({gold:Number(player.gold||0)+price}))throw Error('Item sold but gold update failed.')
   await reload(player.id);setNotice('Sold '+item.name+' for '+price+' gold')
  }catch(error){setNotice(error.message)}finally{setBusy(false)}
 }
 async function heal(amount,cost){
  if(busy||Number(player.gold)<cost)return
  setBusy(true)
  const hp=Math.min(Number(player.max_hp)||100,(Number(player.hp)||0)+amount)
  const ok=await updatePlayer({hp,gold:Number(player.gold)-cost})
  setNotice(ok?'Healing complete.':'Could not save healing.')
  setBusy(false)
 }
 return <div className="story-node">
  <h2>District Traders</h2><p>Gold: ◈ {player.gold||0}</p>
  <div className="reading-quick-nav">{choices.map(n=><button className="reading-action" key={n.key} onClick={()=>setVendor(n.key)} aria-pressed={vendor===n.key}>{n.name}</button>)}</div>
  <p className="story-text">{npc.intro}</p>
  <div className="reading-quick-nav"><button className="reading-action" onClick={()=>setTab('buy')}>Buy</button><button className="reading-action" onClick={()=>setTab('sell')}>Sell</button><button className="reading-action" onClick={()=>setTab('heal')}>Doc Mira</button></div>
  {tab==='buy'&&stock.map(item=><div key={item.item_key} className="garage-upgrade-option"><strong>{item.name}</strong><span>◈ {item.buy_price}</span><button disabled={busy||Number(player.gold)<Number(item.buy_price)} onClick={()=>buy(item)}>Buy</button></div>)}
  {tab==='sell'&&items.filter(i=>!i.equipped_slot).map(item=><div key={item.id} className="garage-upgrade-option"><strong>{item.name} ×{item.quantity||1}</strong><span>◈ {item.sell_price||0}</span><button disabled={busy} onClick={()=>sell(item)}>Sell one</button></div>)}
  {tab==='heal'&&<div><p>Doc Mira can restore your health.</p><button className="reading-action" disabled={busy||Number(player.gold)<125} onClick={()=>heal(Math.ceil(Number(player.max_hp||100)*.5),125)}>Partial heal · 125 gold</button><button className="reading-action" disabled={busy||Number(player.gold)<200} onClick={()=>heal(Number(player.max_hp)||100,200)}>Full heal · 200 gold</button></div>}
  {notice&&<p role="status">{notice}</p>}
  <button className="reading-action" onClick={onReturn}>← Return to Archive</button>
 </div>
}
