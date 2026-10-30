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
const labels={A_mercy:'Mercy Alone',B_wrath:'Wrath Alone',C_dual:'Equilibrium',D_wrath_absorbs:'Ruin',E_mercy_absorbs:'Absolution',F_dual_powered:'Dominion',G_verdict:'Verdict'}
function Judge({which,attacking,dominant=false}){
 const [failed,setFailed]=useState(false)
 const fallback=which==='absolution'?'mercy':which==='ruin'?'wrath':which==='verdict'?'mercy':null
 const image='/'+which+'.webp'
 return <div className={`judge-figure judge-${which} ${dominant?'judge-dominant':''} ${attacking?'judge-striking':''}`}>
  {failed?<span className="judge-fallback">{which==='mercy'||which==='absolution'?'⚖️':'🗡️'}</span>:<>
   <img className="judge-body" src={image} alt="" draggable="false" onError={e=>{if(fallback&&!e.currentTarget.dataset.fallback){e.currentTarget.dataset.fallback='1';e.currentTarget.src='/'+fallback+'.webp'}else setFailed(true)}}/>
   <img className="judge-sword" src={image} alt="" draggable="false" onError={e=>{e.currentTarget.style.display='none'}}/>
   <img className="judge-scales" src={image} alt="" draggable="false" onError={e=>{e.currentTarget.style.display='none'}}/>
   <span className="judge-glow"/>
  </>}
 </div>
}
const transformationAssets={
 D_wrath_absorbs:{video:'/wrath_absorbs_mercy.webp',alternative:'/wrath_to_ruin.webp',result:'ruin'},
 E_mercy_absorbs:{video:'/mercy_to_absolution.webp',result:'absolution'},
 G_verdict:{video:'/mercy_wrath_fuse_verdict.webp',result:'verdict'}
}
function TransformJudge({form,attacking,onReady}){
 const config=transformationAssets[form]
 const [finished,setFinished]=useState(false)
 const [triedAlternative,setTriedAlternative]=useState(false)
 const [loaded,setLoaded]=useState(false)
 useEffect(()=>{if(finished)onReady?.()},[finished,onReady])
 useEffect(()=>{
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)setFinished(true)
 },[])
 useEffect(()=>{
  if(!loaded||finished)return
  // Begin counting only when the animated WebP is ready for playback.
  const timer=setTimeout(()=>setFinished(true),form==='G_verdict'?3400:3800)
  return()=>clearTimeout(timer)
 },[loaded,finished,form])
 return <div className={`judge-transformation judge-transform-${form} ${attacking?'judge-transform-attacking':''}`}>
  {!finished&&<img className="judge-transition-animation" src={triedAlternative?config.alternative:config.video} alt="" draggable="false" onLoad={()=>setLoaded(true)} onError={()=>{if(config.alternative&&!triedAlternative){setLoaded(false);setTriedAlternative(true)}else setFinished(true)}}/>}
  {finished&&<Judge which={config.result} attacking={attacking} dominant/>}
 </div>
}
export default function TwinJudgesPortrait({moral=0,elements=1,attacking=false,hpPercent=1,onReady}){
 const form=judgesVisualForm(moral,elements)
 useEffect(()=>{if(!transformationAssets[form])onReady?.()},[form,onReady])
 const phase=hpPercent<.33?3:hpPercent<.66?2:1
 const transformation=Boolean(transformationAssets[form])
 return <div className={`twin-judges twin-${form} twin-phase-${phase} ${attacking?'twin-attacking':''}`} role="img" aria-label={`Twin Judges: ${labels[form]}, phase ${phase}`}>
  <div className="twin-judges-stage">
   {transformation?<TransformJudge key={form} form={form} attacking={attacking} onReady={onReady}/>:
    form==='A_mercy'?<Judge which="mercy" attacking={attacking} dominant/>:
    form==='B_wrath'?<Judge which="wrath" attacking={attacking} dominant/>:
    form==='F_dual_powered'?<><Judge which="absolution" attacking={attacking}/><Judge which="ruin" attacking={attacking}/></>:
    <><Judge which="mercy" attacking={attacking}/><Judge which="wrath" attacking={attacking}/></>}
   <span className="twin-energy" aria-hidden="true"/>
  </div>
  <span className="twin-form-label">{labels[form]} · Phase {phase}</span>
 </div>
}
