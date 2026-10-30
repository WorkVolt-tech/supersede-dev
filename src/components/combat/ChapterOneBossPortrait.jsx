import { useEffect, useState } from 'react'
import './ChapterOneBossPortrait.css'
const BOSSES={
 'Sentinel of the First Eye':{id:'sentinel',image:'/sentinel_of_the_first_eye.webp',label:'Sentinel of the First Eye'},
 'The Surveyor':{id:'surveyor',image:'/the_surveyor.webp',label:'The Surveyor'},
 'The Unseen':{id:'unseen',image:'/the_unseen.webp',label:'The Unseen'}
}
export const CH1_BOSS_ENTRANCE_MS={
 'Sentinel of the First Eye':2400,
 'The Surveyor':3100,
 'The Unseen':3400,
 'The Watcher':0
}
export default function ChapterOneBossPortrait({name,attacking=false,hit=false,defeated=false}){
 const [failed,setFailed]=useState(false)
 const [entering,setEntering]=useState(true)
 useEffect(()=>{
  setEntering(true)
  const timer=setTimeout(()=>setEntering(false),CH1_BOSS_ENTRANCE_MS[name]??0)
  return()=>clearTimeout(timer)
 },[name])
 const boss=BOSSES[name]
 if(!boss||failed)return <span className="combat-icon">{boss?.id==='surveyor'?'🔭':boss?.id==='unseen'?'👻':'👁️'}</span>
 return <div className={`ch1-boss ch1-${boss.id} ${entering?'ch1-entering':''} ${attacking?'ch1-attacking':''} ${hit?'ch1-hit':''} ${defeated?'ch1-defeated':''}`} role="img" aria-label={boss.label}>
  <div className="ch1-aura" aria-hidden="true"/>
  <img className="ch1-boss-body" src={boss.image} alt="" draggable="false" onError={()=>setFailed(true)}/>
  <img className="ch1-boss-energy" src={boss.image} alt="" draggable="false" aria-hidden="true"/>
  <span className="ch1-boss-burst" aria-hidden="true"/>
 </div>
}
