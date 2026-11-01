import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useInventoryStore } from '../../store/useInventoryStore'
import './GarageScreen.css'
export const GARAGE_VEHICLES=[
 {key:'motorcycle',name:'Motorcycle',image:'/assets/ride/side_motorcycle.webp',speed:1.25,hull:75,fireRate:6,description:'Fast and agile. Light armor, rapid firing.'},
 {key:'car',name:'Car',image:'/assets/ride/side_car.webp',speed:1,hull:100,fireRate:8,description:'Balanced speed, protection and firepower.'},
 {key:'van',name:'Van',image:'/assets/ride/side_van.webp',speed:.8,hull:145,fireRate:10,description:'Heavy protection. Slower steering and firing.'},
]
export const GARAGE_UPGRADES=[
 {id:'eng_boost',slot:'engine',name:'Turbo Coil',cost:{scrap_metal:4,flashlight:2},stat:{speed:20},vehicles:['motorcycle','car','van']},
 {id:'eng_heavy',slot:'engine',name:'Heavy Engine',cost:{scrap_metal:8},stat:{speed:10,durability:10},vehicles:['car','van']},
 {id:'eng_lite',slot:'engine',name:'Lite Frame',cost:{scrap_metal:5,scrap_blade:1},stat:{speed:30,durability:-10},vehicles:['motorcycle']},
 {id:'arm_plate',slot:'armor',name:'Scrap Plate',cost:{scrap_metal:6},stat:{durability:25},vehicles:['motorcycle','car','van']},
 {id:'arm_reactive',slot:'armor',name:'Reactive Mesh',cost:{scrap_metal:8,scrap_blade:2},stat:{durability:15},vehicles:['car','van']},
 {id:'arm_shield',slot:'armor',name:'Flash Shield',cost:{scrap_metal:4,flashlight:4},stat:{durability:20},vehicles:['motorcycle','car','van']},
 {id:'wpn_cannon',slot:'weapon',name:'Scrap Cannon',cost:{scrap_metal:5,scrap_blade:3},stat:{firepower:25},vehicles:['car','van']},
 {id:'wpn_rapid',slot:'weapon',name:'Rapid Fire Kit',cost:{scrap_metal:4,flashlight:1},stat:{firepower:15},vehicles:['motorcycle','car']},
 {id:'wpn_beam',slot:'weapon',name:'Flash Beam',cost:{scrap_metal:3,flashlight:6},stat:{firepower:20},vehicles:['motorcycle','car','van']},
 {id:'spc_boost',slot:'special',name:'Nitro Tank',cost:{scrap_metal:6,scrap_blade:2},stat:{},vehicles:['motorcycle','car']},
 {id:'spc_drone',slot:'special',name:'Eye Drone',cost:{scrap_metal:5,flashlight:3},stat:{firepower:5},vehicles:['car','van']},
 {id:'spc_repair',slot:'special',name:'Repair Kit',cost:{scrap_metal:8,flashlight:2},stat:{},vehicles:['motorcycle','car','van']},
]
function upgradeStatText(u) {
 const lines = []
 if(u.stat.speed) lines.push((u.stat.speed>0?'+':'')+u.stat.speed+' speed')
 if(u.stat.durability) lines.push((u.stat.durability>0?'+':'')+u.stat.durability+' hull')
 if(u.stat.firepower) lines.push('+'+u.stat.firepower+' firepower')
 if(u.id==='spc_boost') lines.push('Nitro speed burst')
 if(u.id==='spc_drone') lines.push('Automatic drone shots')
 if(u.id==='spc_repair') lines.push('Regenerates 5 hull per second')
 if(u.id==='wpn_cannon') lines.push('Double shot damage')
 return lines.join(' · ') || 'Special upgrade'
}
export function vehicleStats(vehicle,ids=[]){
 const stats={...vehicle}
 for(const id of ids){const u=GARAGE_UPGRADES.find(x=>x.id===id);if(!u)continue
 stats.hull+=u.stat.durability||0
 stats.speed+=(u.stat.speed||0)/100
 stats.fireRate=Math.max(3,stats.fireRate-(u.stat.firepower||0)/10)
 }
 stats.upgrades=ids
 return stats
}
export default function GarageScreen({destination=2,onDrive,onBack}){
 const player=usePlayerStore(x=>x.player)
 const updatePlayer=usePlayerStore(x=>x.updatePlayer)
 const items=useInventoryStore(x=>x.items)
 const loadInventory=useInventoryStore(x=>x.loadInventory)
 const saved=player?.vehicle_data||{}
 const [selected,setSelected]=useState(saved.active||'car')
 const [busy,setBusy]=useState(false)
 const [notice,setNotice]=useState('')
 const vehicle=GARAGE_VEHICLES.find(v=>v.key===selected)||GARAGE_VEHICLES[1]
 const installed=Array.isArray(saved.upgrades?.[selected])?saved.upgrades[selected]:[]
 const stats=vehicleStats(vehicle,installed)
 const materials=Object.fromEntries(['scrap_metal','scrap_blade','flashlight'].map(key=>[key,items.filter(i=>i.item_key===key).reduce((sum,i)=>sum+(i.quantity||1),0)]))
 async function selectVehicle(key){
  setSelected(key)
  const ok=await updatePlayer({vehicle_data:{...saved,active:key,upgrades:saved.upgrades||{motorcycle:[],car:[],van:[]}}})
  if(!ok)setNotice('Could not save vehicle selection.')
 }
 async function install(upgrade){
  if(busy)return
  const needed=Object.entries(upgrade.cost)
  if(needed.some(([key,qty])=>materials[key]<qty)){setNotice('Not enough materials. Farm Chapter 1 for components.');return}
  if(installed.some(id=>GARAGE_UPGRADES.find(u=>u.id===id)?.slot===upgrade.slot)){setNotice('Remove the existing '+upgrade.slot+' upgrade first.');return}
  setBusy(true);setNotice('')
  try{
   const consumed=[]
   for(const [key,qty] of needed){
    let remaining=qty
    const rows=items.filter(i=>i.item_key===key)
    for(const row of rows){
     if(!remaining)break
     const n=Math.min(remaining,row.quantity||1)
     const q=(row.quantity||1)-n
     const result=q?await supabase.from('inventory').update({quantity:q}).eq('id',row.id).eq('player_id',player.id):await supabase.from('inventory').delete().eq('id',row.id).eq('player_id',player.id)
     if(result.error)throw result.error
     consumed.push({row,n})
     remaining-=n
    }
   }
   const ok=await updatePlayer({vehicle_data:{...saved,active:selected,upgrades:{...saved.upgrades,[selected]:[...installed,upgrade.id]}}})
   if(!ok)throw Error('Vehicle upgrade could not be saved. Materials may have been consumed; check your inventory.')
   setNotice(upgrade.name+' installed!')
  }catch(e){setNotice(e.message||'Upgrade failed.')}finally{await loadInventory(player.id);setBusy(false)}
 }
 async function remove(slot){
  setBusy(true)
  const next=installed.filter(id=>GARAGE_UPGRADES.find(u=>u.id===id)?.slot!==slot)
  const ok=await updatePlayer({vehicle_data:{...saved,active:selected,upgrades:{...saved.upgrades,[selected]:next}}})
  setNotice(ok?'Upgrade removed (materials are not refunded).':'Could not remove upgrade.')
  setBusy(false)
 }
 return <main className="garage-screen">
  <header className="garage-heading"><small>THE ROAD AHEAD</small><h1>The Garage</h1><p>Select and upgrade your vehicle before the five-wave drive to Chapter {destination}.</p></header>
  <div className="garage-vehicle-grid">{GARAGE_VEHICLES.map(v=><button key={v.key} type="button" className={'garage-vehicle'+(selected===v.key?' selected':'')} aria-pressed={selected===v.key} onClick={()=>selectVehicle(v.key)}>
   <img src={v.image} alt={v.name}/><strong>{v.name}</strong><span>{v.description}</span>
  </button>)}</div>
  <section className="garage-upgrade-shop"><h2>Vehicle Upgrades · {vehicle.name}</h2>
   <p>Hull {Math.round(stats.hull)} (base {vehicle.hull}) · Speed {Math.round(stats.speed*100)}% (base {Math.round(vehicle.speed*100)}%) · Fire interval {stats.fireRate.toFixed(1)} (base {vehicle.fireRate})</p>
   <p>Materials: ⚙ Scrap {materials.scrap_metal} · 🗡 Blades {materials.scrap_blade} · 🔦 Flashlights {materials.flashlight}</p>
   <div className="garage-upgrade-grid">{['engine','armor','weapon','special'].map(slot=>{
    const current=GARAGE_UPGRADES.find(u=>installed.includes(u.id)&&u.slot===slot)
    return <div className="garage-upgrade-slot" key={slot}><h3>{slot.toUpperCase()}</h3>
     <p>{current?current.name:'Empty slot'}</p>
     {current&&<p className="garage-upgrade-effect">Installed: {upgradeStatText(current)}</p>}
     {current&&<button type="button" disabled={busy} onClick={()=>remove(slot)}>Remove</button>}
     {!current&&GARAGE_UPGRADES.filter(u=>u.slot===slot&&u.vehicles.includes(selected)).map(u=><div key={u.id} className="garage-upgrade-option">
      <strong>{u.name}</strong><small className="garage-upgrade-effect">{upgradeStatText(u)}</small><small>{Object.entries(u.cost).map(([k,v])=>k.replace('_',' ')+' ×'+v).join(' · ')}</small>
      <button type="button" disabled={busy||Object.entries(u.cost).some(([k,v])=>materials[k]<v)} onClick={()=>install(u)}>Install</button>
     </div>)}
    </div>
   })}</div>
  </section>
  {notice&&<p role="status">{notice}</p>}
  <div className="garage-controls"><button type="button" className="garage-drive" disabled={busy} onClick={()=>onDrive(stats)}>▶ Drive to Chapter {destination}</button>
   <button type="button" className="garage-back" onClick={onBack}>← Return to book</button></div>
 </main>
}
