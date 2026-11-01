import { useState } from 'react'
import './GarageScreen.css'
export const GARAGE_VEHICLES=[
 {key:'motorcycle',name:'Motorcycle',image:'/assets/ride/side_motorcycle.webp',speed:1.25,hull:75,fireRate:6,description:'Fast and agile. Light armor, rapid firing.'},
 {key:'car',name:'Car',image:'/assets/ride/side_car.webp',speed:1,hull:100,fireRate:8,description:'Balanced speed, protection and firepower.'},
 {key:'van',name:'Van',image:'/assets/ride/side_van.webp',speed:.8,hull:145,fireRate:10,description:'Heavy protection. Slower steering and firing.'},
]
export default function GarageScreen({destination=2,onDrive,onBack}){
 const [selected,setSelected]=useState('car')
 const vehicle=GARAGE_VEHICLES.find(v=>v.key===selected)
 return <main className="garage-screen">
  <header className="garage-heading"><small>THE ROAD AHEAD</small><h1>The Garage</h1><p>Yara's three modified vehicles are now yours. Choose one to face the Watcher's fragments on the road.</p></header>
  <div className="garage-vehicle-grid">{GARAGE_VEHICLES.map(v=><button key={v.key} type="button" className={'garage-vehicle'+(selected===v.key?' selected':'')} aria-pressed={selected===v.key} onClick={()=>setSelected(v.key)}>
   <img src={v.image} alt={v.name}/><strong>{v.name}</strong><span>{v.description}</span><small>HULL {v.hull} · SPEED {Math.round(v.speed*100)}% · FIRE {v.fireRate}</small>
  </button>)}</div>
  <div className="garage-controls"><p><strong>{vehicle.name} selected.</strong> Survive the drive to unlock Chapter {destination}.</p>
   <button type="button" className="garage-drive" onClick={()=>onDrive(vehicle)}>▶ Drive to Chapter {destination}</button>
   <button type="button" className="garage-back" onClick={onBack}>← Return to book</button>
  </div>
 </main>
}
