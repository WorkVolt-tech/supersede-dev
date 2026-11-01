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
 const [filter,setFilter]=useState('all')
 const [search,setSearch]=useState('')
 const [selected,setSelected]=useState([])
 useEffect(()=>{let cancelled=false;supabase.from('items').select('*').then(({data,error})=>{if(!cancelled){setCatalog(data||[]);if(error)setNotice(error.message)}});return()=>{cancelled=true}},[])
 const npc=VENDORS.find(v=>v.key===vendor)
 const unlocked=(player?.chapters_unlocked||[]).includes(2)||(player?.current_chapter||1)>=2
 const choices=VENDORS.filter(v=>v.key!=='pell'||(player?.alliance_log||[]).includes('pell_met'))
 const master=Object.fromEntries(catalog.map(i=>[i.item_key,i]))
 const sellPrice=i=>Math.max(0,Number(i.sell_price)||Number(master[i.item_key]?.sell_price)|| (Number(i.buy_price||master[i.item_key]?.buy_price)>0?Math.floor(Number(i.buy_price||master[i.item_key]?.buy_price)*.4):0))
 const sellable=items.filter(i=>!i.equipped_slot)
 const visibleSell=sellable.filter(i=>(filter==='all'||i.item_type===filter)&&(!search||i.name.toLowerCase().includes(search.toLowerCase())))
 const chosen=sellable.filter(i=>selected.includes(i.id)&&sellPrice(i)>0)
 const total=chosen.reduce((sum,i)=>sum+sellPrice(i)*Math.max(1,Number(i.quantity)||1),0)
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
   const price=sellPrice(item)
   const qty=Math.max(1,Number(item.quantity)||1)
   const {error}=qty>1?await supabase.from('inventory').update({quantity:qty-1}).eq('id',item.id).eq('player_id',player.id):await supabase.from('inventory').delete().eq('id',item.id).eq('player_id',player.id)
   if(error)throw error
   if(!await updatePlayer({gold:Number(player.gold||0)+price}))throw Error('Item sold but gold update failed.')
   await reload(player.id);setNotice('Sold '+item.name+' for '+price+' gold')
  }catch(error){setNotice(error.message)}finally{setBusy(false)}
 }
 async function sellBatch(){
  if(busy||!chosen.length||!player)return
  if(!window.confirm('Sell '+chosen.length+' item stacks for ◈ '+total+'? All quantities in selected stacks will be sold.'))return
  setBusy(true);setNotice('')
  let earned=0, sold=0
  for(const item of chosen){
   const qty=Math.max(1,Number(item.quantity)||1)
   const {error}=await supabase.from('inventory').delete().eq('id',item.id).eq('player_id',player.id).is('equipped_slot',null)
   if(error){setNotice('Sale stopped: '+error.message);break}
   earned+=sellPrice(item)*qty;sold++
  }
  if(earned){
   const ok=await updatePlayer({gold:Number(player.gold||0)+earned})
   setNotice(ok?'Sold '+sold+' stacks for ◈ '+earned: 'Items sold but gold saving failed; contact support.')
  }
  await reload(player.id)
  setSelected([])
  setBusy(false)
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
  {tab!=='heal'&&<div className="trader-filters"><input aria-label="Search items" placeholder="Search items…" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Filter items by type" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All types</option>{[...new Set([...catalog,...items].map(i=>i.item_type).filter(Boolean))].map(t=><option key={t} value={t}>{t}</option>)}</select></div>}
  {tab==='buy'&&stock.filter(i=>(filter==='all'||i.item_type===filter)&&i.name.toLowerCase().includes(search.toLowerCase())).map(item=><div key={item.item_key} className="garage-upgrade-option"><strong>{item.name}</strong><span>◈ {item.buy_price}</span><button disabled={busy||Number(player.gold)<Number(item.buy_price)} onClick={()=>buy(item)}>Buy</button></div>)}
  {tab==='sell'&&<><div className="trader-batch-actions"><button type="button" onClick={()=>setSelected([...new Set([...selected,...visibleSell.filter(i=>sellPrice(i)>0).map(i=>i.id)])])}>Select visible</button><button type="button" onClick={()=>setSelected([])}>Clear selection</button><strong>{chosen.length} stacks · ◈ {total}</strong><button type="button" disabled={busy||!chosen.length} onClick={sellBatch}>Sell selected stacks</button></div>
   {visibleSell.map(item=><div key={item.id} className="garage-upgrade-option"><label><input type="checkbox" checked={selected.includes(item.id)} disabled={!sellPrice(item)||busy} onChange={e=>setSelected(ids=>e.target.checked?[...ids,item.id]:ids.filter(id=>id!==item.id))}/> <strong>{item.name} ×{item.quantity||1}</strong></label><span>◈ {sellPrice(item)} each · ◈ {sellPrice(item)*Math.max(1,Number(item.quantity)||1)} stack</span><button disabled={busy||!sellPrice(item)} onClick={()=>sell(item)}>Sell one</button>{!sellPrice(item)&&<small>Not sellable</small>}</div>)}</>}
  {tab==='heal'&&<div><p>Doc Mira can restore your health.</p><button className="reading-action" disabled={busy||Number(player.gold)<125} onClick={()=>heal(Math.ceil(Number(player.max_hp||100)*.5),125)}>Partial heal · 125 gold</button><button className="reading-action" disabled={busy||Number(player.gold)<200} onClick={()=>heal(Number(player.max_hp)||100,200)}>Full heal · 200 gold</button></div>}
  {notice&&<p role="status">{notice}</p>}
  <button className="reading-action" onClick={onReturn}>← Return to Archive</button>
 </div>
}
