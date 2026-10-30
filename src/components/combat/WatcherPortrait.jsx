import { useState } from 'react'
import './WatcherPortrait.css'

// The WebP is layered with independent elliptical masks over the glowing eyes.
// The painting itself remains unchanged; only its regions and light move.
const eyes=[
 {x:47,y:16,size:9},{x:63,y:20,size:7},{x:32,y:26,size:7},
 {x:49,y:29,size:13,core:true},{x:72,y:32,size:7},
 {x:26,y:36,size:6},{x:36,y:40,size:6},{x:63,y:38,size:6},
]
export default function WatcherPortrait({attacking=false,defeated=false}){
 const [failed,setFailed]=useState(false)
 if(failed)return <span className="combat-icon" aria-label="The Watcher">👁️</span>
 return <div className={`watcher-portrait ${attacking?'watcher-attacking':''} ${defeated?'watcher-defeated':''}`} role="img" aria-label="The Watcher, a floating spectral creature with eight luminous eyes">
  <img className="watcher-body" src="/the_watcher.webp" alt="" draggable="false" onError={()=>setFailed(true)}/>
  <div className="watcher-veil" aria-hidden="true"/>
  {eyes.map((eye,i)=><div key={i} className={`watcher-eye ${eye.core?'watcher-eye-core':''}`} style={{'--eye-x':eye.x+'%','--eye-y':eye.y+'%','--eye-size':eye.size+'%','--eye-delay':i*.13+'s'}} aria-hidden="true"/>)}
  {defeated&&eyes.map((eye,i)=>{
   const angle=(i/eyes.length)*Math.PI*2-Math.PI/2
   const distance=95+(i%3)*26
   const dx=Math.round(Math.cos(angle)*distance)
   const dy=Math.round(Math.sin(angle)*distance)
   const cropWidth=eye.size*1.55
   return <span key={'scatter-'+i} className={`watcher-scatter-eye ${eye.core?'watcher-scatter-core':''}`} style={{
    '--eye-x':eye.x+'%','--eye-y':eye.y+'%',
    '--eye-pop-size':cropWidth+'%','--eye-crop-size':(10000/cropWidth)+'%',
    '--scatter-x':dx+'px','--scatter-y':dy+'px',
    '--scatter-mid-x':Math.round(dx*.62)+'px','--scatter-mid-y':Math.round(dy*.62)+'px',
    '--scatter-turn':((i%2===0?-1:1)*(70+i*23))+'deg','--scatter-delay':(i*.075)+'s'
   }} aria-hidden="true"/>
  })}
  <div className="watcher-ray watcher-ray-left" aria-hidden="true"/>
  <div className="watcher-ray watcher-ray-right" aria-hidden="true"/>
 </div>
}
