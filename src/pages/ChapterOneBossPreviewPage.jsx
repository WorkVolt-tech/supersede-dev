import { useEffect, useRef, useState } from 'react'
import ChapterOneBossPortrait, { CH1_BOSS_ENTRANCE_MS } from '../components/combat/ChapterOneBossPortrait'
import WatcherPortrait from '../components/combat/WatcherPortrait'

const BOSSES=[
 'Sentinel of the First Eye',
 'The Surveyor',
 'The Unseen',
 'The Watcher'
]
export default function ChapterOneBossPreviewPage({onReturn}){
 const [boss,setBoss]=useState(BOSSES[0])
 const [replay,setReplay]=useState(0)
 const [attacking,setAttacking]=useState(false)
 const [hit,setHit]=useState(false)
 const [defeated,setDefeated]=useState(false)
 const [entranceReady,setEntranceReady]=useState(false)
 useEffect(()=>{
  const duration=CH1_BOSS_ENTRANCE_MS[boss]??0
  setEntranceReady(duration===0)
  if(duration===0)return
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
  <div key={boss+'-'+replay} style={{minHeight:280,display:'grid',placeItems:'center'}}>
   {isWatcher?<WatcherPortrait attacking={attacking} defeated={defeated}/>:
    <ChapterOneBossPortrait name={boss} attacking={attacking} hit={hit} defeated={defeated}/>}
  </div>
  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
   <button className="reading-action" disabled={defeated||!entranceReady} onClick={()=>trigger(setAttacking,720)}>Play attack</button>
   {!isWatcher&&<button className="reading-action" disabled={defeated||!entranceReady} onClick={()=>trigger(setHit,440)}>Preview hit</button>}
   <button className="reading-action" disabled={defeated||!entranceReady} onClick={()=>{clearTimers();setAttacking(false);setHit(false);setDefeated(true)}}>Preview defeat</button>
   <button className="reading-action" onClick={()=>reset()}>Replay entrance / reset</button>
  </div>
  <p className="story-text" aria-live="polite">{!entranceReady?'Entrance playing…':defeated?'Defeat sequence triggered. Replay entrance to reset.':'Ready for attack, hit and defeat previews.'}</p>
  <p className="story-text">{isWatcher?'On defeat, the Watcher’s eyes burst outward and disperse.':boss==='Sentinel of the First Eye'?'The Sentinel crashes down and unleashes an eye roar.':boss==='The Surveyor'?'The Surveyor assembles through mechanical rotation.':'The Unseen emerges from spectral wind.'}</p>
  <button className="reading-action" onClick={onReturn}>← Return to menu</button>
 </div>
}
