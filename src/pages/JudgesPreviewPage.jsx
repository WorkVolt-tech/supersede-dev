import { useCallback, useEffect, useRef, useState } from 'react'
import TwinJudgesPortrait from '../components/combat/TwinJudgesPortrait'

const FORMS=[
 {name:'Mercy',moral:50,elements:1},
 {name:'Wrath',moral:-50,elements:1},
 {name:'Equilibrium',moral:0,elements:1},
 {name:'Ruin',moral:-50,elements:2},
 {name:'Absolution',moral:50,elements:2},
 {name:'Dominion',moral:0,elements:2},
 {name:'Verdict',moral:80,elements:3},
]
export default function JudgesPreviewPage({onReturn}){
 const [form,setForm]=useState(0)
 const [phase,setPhase]=useState(1)
 const [attacking,setAttacking]=useState(false)
 const [hit,setHit]=useState(false)
 const [defeated,setDefeated]=useState(false)
 const effectTimer=useRef(null)
 const effectResetTimer=useRef(null)
 useEffect(()=>()=>{clearTimeout(effectTimer.current);clearTimeout(effectResetTimer.current)},[])
 function playHit(){clearTimeout(effectTimer.current);clearTimeout(effectResetTimer.current);setHit(false);effectTimer.current=setTimeout(()=>{setHit(true);effectResetTimer.current=setTimeout(()=>setHit(false),450)},30)}
 const [replay,setReplay]=useState(0)
 const [ready,setReady]=useState(true)
 const markReady=useCallback(()=>setReady(true),[])
 function restartPreview(){clearTimeout(effectTimer.current);clearTimeout(effectResetTimer.current);setReady(false);setAttacking(false);setHit(false);setDefeated(false);setReplay(n=>n+1)}
 const attackRestartTimer=useRef(null)
 useEffect(()=>()=>clearTimeout(attackRestartTimer.current),[])
 function playAttack(){
  if(!ready)return
  clearTimeout(attackRestartTimer.current)
  setAttacking(false)
  attackRestartTimer.current=setTimeout(()=>setAttacking(true),40)
 }
 useEffect(()=>{setAttacking(false)},[form,replay])
 useEffect(()=>{
  if(!attacking)return
  const timer=setTimeout(()=>setAttacking(false),700)
  return()=>clearTimeout(timer)
 },[attacking])
 const selected=FORMS[form]
 return <div className="chapter-page" style={{display:'grid',gap:18}}>
  <h2>Twin Judges · Animation Preview</h2>
  <p className="story-text">Preview all seven Judge forms without fighting or changing your character.</p>
  <label htmlFor="judge-preview-form">Choose a form</label>
  <select id="judge-preview-form" value={form} onChange={e=>{setForm(Number(e.target.value));restartPreview()}} style={{padding:10,background:'#252026',color:'#f2e0bb'}}>
   {FORMS.map((f,i)=><option key={f.name} value={i}>{f.name}</option>)}
  </select>
  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
   {[1,2,3].map(n=><button key={n} className="reading-action" aria-pressed={phase===n} onClick={()=>setPhase(n)}>Phase {n}</button>)}
  </div>
  <TwinJudgesPortrait key={form+'-'+replay} moral={selected.moral} elements={selected.elements} hpPercent={phase===1?1:phase===2?.5:.2} attacking={attacking} hit={hit} defeated={defeated} onReady={markReady}/>
  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
   <button className="reading-action" disabled={!ready} onClick={playAttack}>{ready?'Play attack':'Transformation playing…'}</button>
   <button className="reading-action" disabled={!ready||defeated} onClick={playHit}>Preview hit</button>
   <button className="reading-action" disabled={!ready||defeated} onClick={()=>setDefeated(true)}>Preview defeat</button>
   <button className="reading-action" onClick={restartPreview}>Replay entrance / transformation</button>
  </div>
  <p className="story-text">Animations are visual previews only. No rewards, health, XP or combat state are changed.</p>
  <button className="reading-action" onClick={onReturn}>← Return to menu</button>
 </div>
}
