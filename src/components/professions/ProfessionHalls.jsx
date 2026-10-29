import { useEffect,useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { PROFESSIONS } from '../../game/professions'
import { PROFESSION_HALLS,ADVENTURE_ROUTES,hallRotation } from '../../game/professionHalls'

export default function ProfessionHalls({player,onReturn,onNavigate}) {
 const [active,setActive]=useState(null)
 const [unlocked,setUnlocked]=useState([])
 const [loading,setLoading]=useState(true)
 const [selected,setSelected]=useState('merchant')
 useEffect(()=>{
  let live=true
  Promise.all([
   supabase.from('profession_status').select('active_profession').eq('player_id',player.id).maybeSingle(),
   supabase.from('profession_unlocks').select('profession_key').eq('player_id',player.id)
  ]).then(([a,b])=>{if(!live)return;setActive(a.data?.active_profession||null);setUnlocked((b.data||[]).map(x=>x.profession_key));setLoading(false)})
  return ()=>{live=false}
 },[player.id])
 const hall=PROFESSION_HALLS[selected]
 const cycle=hallRotation(selected)
 const hasAccess=player.chapters_unlocked?.includes(3)&&active===selected&&unlocked.includes(selected)
 return <section className="story-text" style={{padding:'1rem'}}>
  <h2>🏛️ Profession District</h2>
  <p>Visit the eight trade halls. Resident NPCs work here even when no players are available. Their featured creations, materials, and assignments rotate every two or three days.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8,marginBottom:24}}>
   {PROFESSIONS.map(p=><button className="reading-action" key={p.key} disabled={selected===p.key} onClick={()=>setSelected(p.key)}>{p.icon} {p.name}</button>)}
  </div>
  <h3>{hall.icon} {hall.name}</h3><p>📍 {hall.location}</p>
  <h4>Resident NPCs</h4>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
   {hall.residents.map(([name,role])=><div key={name} style={{border:'1px solid #a9927055',borderRadius:6,padding:12}}><strong>{name}</strong><p>{role} · NPC</p><p>Available for future services and interactions.</p></div>)}
  </div>
  <h4>Current showcase · {cycle.hours}-hour rotation</h4>
  <p>Next rotation: {new Date(cycle.refreshAt).toLocaleString()}</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
   {cycle.rotation.map(item=><div key={item} style={{padding:12,border:'1px solid #a99270555',borderRadius:6}}><strong>{item}</strong><p>NPC showcase · service/trade not yet enabled</p></div>)}
  </div>
  <h4>Profession chapter</h4>
  {loading?<p>Checking profession access…</p>:hasAccess?<button className="reading-action" onClick={()=>onNavigate(ADVENTURE_ROUTES[selected])}>Enter {hall.name} adventure</button>:<p>🔒 You can visit this hall, but the exclusive storyline requires its discovery item, an active {PROFESSIONS.find(p=>p.key===selected)?.name} profession, and Chapter 3 access.</p>}
  <button className="reading-action" onClick={onReturn}>← Back to professions</button>
 </section>
}
