import { useEffect, useRef, useState } from 'react'
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

// The AI's move keys only select visual choreography; they do not affect damage.
const MOVE_VISUALS={
 sentinel:{
  first_gaze:'eye',indexing_beam:'eye',pale_column:'roar',full_sight:'eye',
  record_sealed:'strike',watcher_inheritance:'roar',indexed_wound:'strike',
  final_closure:'roar',observation_complete:'roar'
 },
 surveyor:{
  measuring_strike:'drone',begin_assessment:'scan',assessment_tick:'scan',
  pinpoint_assessment:'burst',lens_burst:'burst',data_strike:'drone',
  full_assessment:'scan',slow_calculation:'scan',lens_shatter:'burst',final_verdict:'burst'
 },
 unseen:{
  shimmer_strike:'rush',disperse:'disperse',half_presence:'form',
  distributed_strike:'rush',consolidate_and_strike:'form',
  terror_of_formlessness:'disperse',becoming_visible:'form',final_dispersal:'disperse'
 }
}
export default function ChapterOneBossPortrait({name,attacking=false,hit=false,defeated=false,moveKey=null,phase=1}){
 const [failed,setFailed]=useState(false)
 const [entering,setEntering]=useState(true)
 const previousPhase=useRef(phase)
 const [phaseSurge,setPhaseSurge]=useState(false)
 useEffect(()=>{
  if(phase<=previousPhase.current){previousPhase.current=phase;return}
  previousPhase.current=phase
  setPhaseSurge(true)
  const timer=setTimeout(()=>setPhaseSurge(false),850)
  return()=>clearTimeout(timer)
 },[phase])
 useEffect(()=>{
  setEntering(true)
  const timer=setTimeout(()=>setEntering(false),CH1_BOSS_ENTRANCE_MS[name]??0)
  return()=>clearTimeout(timer)
 },[name])
 const boss=BOSSES[name]
 const moveVisual=MOVE_VISUALS[boss?.id]?.[moveKey] || {sentinel:'strike',surveyor:'drone',unseen:'rush'}[boss?.id]
 if(!boss||failed)return <span className="combat-icon">{boss?.id==='surveyor'?'🔭':boss?.id==='unseen'?'👻':'👁️'}</span>
 return <div className={`ch1-boss ch1-${boss.id} ${entering?'ch1-entering':''} ch1-phase-${Math.max(1,Math.min(3,phase))} ${phaseSurge?'ch1-phase-shift':''} ${attacking?'ch1-attacking ch1-attack-'+moveVisual:''} ${hit?'ch1-hit':''} ${defeated?'ch1-defeated':''}`} role="img" aria-label={boss.label}>
  <div className="ch1-aura" aria-hidden="true"/>
  <img className="ch1-boss-body" src={boss.image} alt="" draggable="false" onError={()=>setFailed(true)}/>
  <img className="ch1-boss-energy" src={boss.image} alt="" draggable="false" aria-hidden="true"/>
  <span className="ch1-boss-burst" aria-hidden="true"/>
 </div>
}
