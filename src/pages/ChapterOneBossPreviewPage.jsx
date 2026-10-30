import { useEffect, useRef, useState } from 'react'
import ChapterOneBossPortrait, { CH1_BOSS_ENTRANCE_MS } from '../components/combat/ChapterOneBossPortrait'
import WatcherPortrait from '../components/combat/WatcherPortrait'

const BOSSES=[
 'Sentinel of the First Eye',
 'The Surveyor',
 'The Unseen',
 'The Watcher'
]

const MOVE_PREVIEWS={
 'Sentinel of the First Eye':[
  {key:'first_gaze',label:'First Gaze · eye charge'},
  {key:'record_sealed',label:'Record Sealed · heavy strike'},
  {key:'observation_complete',label:'Observation Complete · eye roar'}
 ],
 'The Surveyor':[
  {key:'begin_assessment',label:'Begin Assessment · scanner'},
  {key:'measuring_strike',label:'Measuring Strike · drone volley'},
  {key:'pinpoint_assessment',label:'Pinpoint Assessment · core burst'}
 ],
 'The Unseen':[
  {key:'shimmer_strike',label:'Shimmer Strike · spectral rush'},
  {key:'disperse',label:'Disperse · wind dissolution'},
  {key:'consolidate_and_strike',label:'Consolidate and Strike · reform'}
 ]
}
export default function ChapterOneBossPreviewPage({onReturn}){
 const [boss,setBoss]=useState(BOSSES[0])
 const [replay,setReplay]=useState(0)
 const [attacking,setAttacking]=useState(false)
 const [moveKey,setMoveKey]=useState('first_gaze')
 const [phase,setPhase]=useState(1)
 const [hit,setHit]=useState(false)
 const [defeated,setDefeated]=useState(false)
 const [entranceReady,setEntranceReady]=useState(false)
 useEffect(()=>{
  const duration=CH1_BOSS_ENTRANCE_MS[boss]??0
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  setEntranceReady(duration===0||reducedMotion)
  if(duration===0||reducedMotion)return
  const timer=setTimeout(()=>setEntranceReady(true),duration)
  return()=>clearTimeout(timer)
 },[boss,replay])
 const timers=useRef([])
 const clearTimers=()=>{timers.current.forEach(clearTimeout);timers.current=[]}
 useEffect(()=>()=>{timers.current.forEach(clearTimeout)},[])
 function reset(nextBoss=boss){
  clearTimers()
  setAttacking(false)
  setHit(false)
  setDefeated(false)
  setEntranceReady(false)
  setBoss(nextBoss)
  setMoveKey(MOVE_PREVIEWS[nextBoss]?.[0].key ?? null)
  setPhase(1)
  setReplay(n=>n+1)
 }
 function trigger(setter,duration){
  if(defeated||!entranceReady)return
  clearTimers()
  setAttacking(false);setHit(false)
  timers.current.push(setTimeout(()=>{
   setter(true)
   timers.current.push(setTimeout(()=>setter(false),duration))
  },35))
 }
 const isWatcher=boss==='The Watcher'
 return <div className="chapter-page" style={{display:'grid',gap:16}}>
  <h2>Chapter 1 · Boss Animation Preview</h2>
  <p className="story-text">Test entrances, attacks, damage reactions and defeats without changing your save.</p>
  <label htmlFor="ch1-boss-preview">Select boss</label>
  <select id="ch1-boss-preview" value={boss} onChange={e=>reset(e.target.value)} style={{padding:10,background:'#252026',color:'#f2e0bb'}}>
   {BOSSES.map(name=><option key={name} value={name}>{name}</option>)}
  </select>
  {!isWatcher&&<>
   <p className="story-text">Boss phase</p>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    {[1,2,3].map(n=><button key={n} type="button" className="reading-action" aria-pressed={phase===n} disabled={!entranceReady||attacking||hit||defeated} onClick={()=>setPhase(n)}>Phase {n}</button>)}
   </div>
   <label htmlFor="ch1-boss-move">Select a signature move</label>
   <select id="ch1-boss-move" value={moveKey ?? ''} disabled={!entranceReady||attacking||hit||defeated}
    onChange={e=>setMoveKey(e.target.value)}
    style={{padding:10,background:'#252026',color:'#f2e0bb'}}>
    {MOVE_PREVIEWS[boss].map(move=><option key={move.key} value={move.key}>{move.label}</option>)}
   </select>
  </>}
  <div key={boss+'-'+replay} style={{minHeight:280,display:'grid',placeItems:'center'}}>
   {isWatcher?<WatcherPortrait attacking={attacking} hit={hit} defeated={defeated}/>:
    <ChapterOneBossPortrait name={boss} attacking={attacking} hit={hit} defeated={defeated} moveKey={moveKey} phase={phase}/>}
  </div>
  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
   <button className="reading-action" disabled={defeated||!entranceReady} onClick={()=>trigger(setAttacking,720)}>{isWatcher?'Play attack':'Play selected move'}</button>
   <button className="reading-action" disabled={defeated||!entranceReady} onClick={()=>trigger(setHit,440)}>Preview hit</button>
   <button className="reading-action" disabled={defeated||!entranceReady} onClick={()=>{clearTimers();setAttacking(false);setHit(false);setDefeated(true)}}>Preview defeat</button>
   <button className="reading-action" onClick={()=>reset()}>Replay entrance / reset</button>
  </div>
  <p className="story-text" aria-live="polite">{!entranceReady?'Entrance playing…':defeated?'Defeat sequence triggered. Replay entrance to reset.':'Ready for attack, hit and defeat previews.'}</p>
  <p className="story-text">{isWatcher?'On defeat, the Watcher’s eyes burst outward and disperse.':boss==='Sentinel of the First Eye'?'The Sentinel crashes down and unleashes an eye roar.':boss==='The Surveyor'?'The Surveyor assembles through mechanical rotation.':'The Unseen emerges from spectral wind.'}</p>
  <button className="reading-action" onClick={onReturn}>← Return to menu</button>
 </div>
}
