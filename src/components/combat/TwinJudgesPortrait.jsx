import { useState, useEffect } from 'react'
import './TwinJudgesPortrait.css'

// Matches the seven fixed scenarios from enemyAI.js; no combat mechanics altered.
export function judgesVisualForm(moral=0,elements=1){
 const greedy=elements>=2
 if(Math.abs(moral)>=70&&elements>=3)return 'G_verdict'
 if(moral>=40&&!greedy)return 'A_mercy'
 if(moral<=-40&&!greedy)return 'B_wrath'
 if(!greedy)return 'C_dual'
 if(moral<=-40)return 'D_wrath_absorbs'
 if(moral>=40)return 'E_mercy_absorbs'
 return 'F_dual_powered'
}
const labels={A_mercy:'Mercy Alone',B_wrath:'Wrath Alone',C_dual:'Dual Conflict',D_wrath_absorbs:'Wrath Absorbs Mercy',E_mercy_absorbs:'Mercy Absorbs Wrath',F_dual_powered:'Synchronized Judges',G_verdict:'Verdict — Collapsed Form'}
function Judge({which,attacking,dominant=false}){
 const [failed,setFailed]=useState(false)
 return <div className={`judge-figure judge-${which} ${dominant?'judge-dominant':''} ${attacking?'judge-striking':''}`}>
  {failed?<span className="judge-fallback">{which==='mercy'?'⚖️':'🗡️'}</span>:<>
   <img className="judge-body" src={`/${which}.webp`} alt="" draggable="false" onError={()=>setFailed(true)}/>
   <img className="judge-sword" src={`/${which}.webp`} alt="" draggable="false"/>
   <img className="judge-scales" src={`/${which}.webp`} alt="" draggable="false"/>
   <span className="judge-glow"/>
  </>}
 </div>
}
function Absolution({attacking}){
 const [transformed,setTransformed]=useState(false)
 const [missing,setMissing]=useState(false)
 useEffect(()=>{
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setTransformed(true);return}
  const timer=setTimeout(()=>setTransformed(true),3200)
  return()=>clearTimeout(timer)
 },[])
 return <div className={`absolution-form ${attacking?'absolution-attacking':''}`}>
  {!transformed&&!missing&&<img className="absolution-transition" src="/mercy_to_absolution.webp" alt="" onError={()=>{setMissing(true);setTransformed(true)}} draggable="false"/>}
  {(transformed||missing)&&<div className="judge-figure judge-mercy judge-dominant">
   <img className="judge-body" src="/absolution.webp" alt="" draggable="false" onError={e=>{e.currentTarget.src='/mercy.webp'}}/>
   <img className="judge-sword" src="/absolution.webp" alt="" draggable="false" onError={e=>{e.currentTarget.src='/mercy.webp'}}/>
   <img className="judge-scales" src="/absolution.webp" alt="" draggable="false" onError={e=>{e.currentTarget.src='/mercy.webp'}}/>
   <span className="judge-glow"/>
  </div>}
 </div>
}
export default function TwinJudgesPortrait({moral=0,elements=1,attacking=false,hpPercent=1}){
 const form=judgesVisualForm(moral,elements)
 const mercyLead=['A_mercy','E_mercy_absorbs'].includes(form)
 const wrathLead=['B_wrath','D_wrath_absorbs'].includes(form)
 const fused=form==='G_verdict'
 const showMercy=!wrathLead
 const showWrath=!mercyLead
 const phase=hpPercent<.33?3:hpPercent<.66?2:1
 return <div className={`twin-judges twin-${form} twin-phase-${phase} ${attacking?'twin-attacking':''}`} role="img" aria-label={`Twin Judges: ${labels[form]}, phase ${phase}`}>
  <div className="twin-judges-stage">
   {form==='E_mercy_absorbs'?<Absolution attacking={attacking}/>:showMercy&&<Judge which="mercy" attacking={attacking} dominant={mercyLead||fused}/>}
   {showWrath&&<Judge which="wrath" attacking={attacking} dominant={wrathLead||fused}/>}
   {fused&&<span className="twin-verdict-core" aria-hidden="true"/>}
   <span className="twin-energy" aria-hidden="true"/>
  </div>
  <span className="twin-form-label">{labels[form]} · Phase {phase}</span>
 </div>
}
