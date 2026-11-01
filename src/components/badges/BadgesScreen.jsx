import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { usePlayerStore } from '../../store/usePlayerStore'
const BADGES=[
 {key:'survivor',name:'Survivor',icon:'🟡',rarity:'Common',desc:'Complete Chapter 1.',qualifies:p=>(p.chapters_completed||[]).includes(1)||(p.chapters_unlocked||[]).includes(2)},
 {key:'helper',name:'Helper',icon:'🟢',rarity:'Uncommon',desc:'Help 3 players.',qualifies:p=>(p.helps_given||0)>=3},
 {key:'hunter',name:'Hunter',icon:'🔴',rarity:'Uncommon',desc:'Defeat 5 players in PvP.',qualifies:p=>(p.pvp_kills||0)>=5},
 {key:'watcher_slain',name:'Watcher Slain',icon:'👁',rarity:'Rare',desc:'Defeat The Watcher.',qualifies:p=>(p.defeated_bosses||[]).some(b=>b.includes('watcher'))||(p.chapters_completed||[]).includes(1)},
 {key:'elite',name:'Elite',icon:'🟣',rarity:'Epic',desc:'Reach level 10.',qualifies:p=>(p.level||1)>=10},
 {key:'unknown',name:'Unknown',icon:'⚫',rarity:'Legendary',desc:'Hidden conditions.',qualifies:()=>false},
]
export default function BadgesScreen({onReturn}){
 const player=usePlayerStore(s=>s.player)
 const [earned,setEarned]=useState([])
 const [message,setMessage]=useState('')
 useEffect(()=>{
  if(!player?.id)return
  let cancelled=false
  async function load(){
   const {data,error}=await supabase.from('player_badges').select('badge_key').eq('player_id',player.id)
   if(cancelled)return
   if(error){setMessage(error.message);return}
   const found=new Set((data||[]).map(x=>x.badge_key))
   for(const badge of BADGES){
    if(!found.has(badge.key)&&badge.qualifies(player)){
     const {error:insertError}=await supabase.from('player_badges').insert({player_id:player.id,badge_key:badge.key})
     if(!insertError)found.add(badge.key)
     else setMessage(insertError.message)
    }
   }
   if(!cancelled)setEarned([...found])
  }
  load()
  return()=>{cancelled=true}
 },[player])
 return <div className="story-node"><h2>Achievement Seals</h2><p>{BADGES.filter(b=>earned.includes(b.key)).length} / {BADGES.length} earned</p>
  {BADGES.map(b=><div key={b.key} style={{padding:'12px',marginBottom:8,border:'1px solid #9f8053',opacity:earned.includes(b.key)?1:.55}}>
   <strong>{b.icon} {b.name}</strong> · {b.rarity}
   <p className="story-text">{b.desc}</p>
   <small>{earned.includes(b.key)?'✓ Earned':'🔒 Locked'}</small>
  </div>)}
  {message&&<p role="alert">{message}</p>}
  <button className="reading-action" onClick={onReturn}>← Return to Archive</button>
 </div>
}
