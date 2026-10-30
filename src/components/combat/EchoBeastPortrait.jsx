import { useState } from 'react'
import './EchoBeastPortrait.css'

// One WebP is reused through clipping: jaw, stolen faces and spectral edge
// animate independently while preserving the original painted appearance.
export default function EchoBeastPortrait({ attacking = false }) {
  const [failed,setFailed]=useState(false)
  if(failed)return <span className="combat-icon" aria-label="Echo Beast">👹</span>
  return <div className={`echo-beast-portrait ${attacking?'echo-beast-attacking':''}`} role="img" aria-label="The Echo Beast, a mass of screaming faces and fanged jaws">
    <img className="echo-beast-base" src="/the_echo_beast.webp" alt="" draggable="false" onError={()=>setFailed(true)}/>
    <img className="echo-beast-part echo-beast-left" src="/the_echo_beast.webp" alt="" draggable="false"/>
    <img className="echo-beast-part echo-beast-right" src="/the_echo_beast.webp" alt="" draggable="false"/>
    <img className="echo-beast-part echo-beast-jaw" src="/the_echo_beast.webp" alt="" draggable="false"/>
    <span className="echo-beast-scream" aria-hidden="true" />
  </div>
}
