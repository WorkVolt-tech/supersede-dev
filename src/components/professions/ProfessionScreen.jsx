import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { PROFESSIONS, professionUnlocked, professionPointsAtLevel, professionSwitchCost } from '../../game/professions'

export default function ProfessionScreen({player,onReturn}) {
  const [status,setStatus] = useState(null)
  const [progress,setProgress] = useState([])
  const [loading,setLoading] = useState(true)
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')

  async function refresh() {
    if (!player || !professionUnlocked(player)) {setLoading(false);return}
    const [s,p] = await Promise.all([
      supabase.from('profession_status').select('*').eq('player_id',player.id).maybeSingle(),
      supabase.from('profession_progress').select('*').eq('player_id',player.id),
    ])
    setStatus(s.data||null)
    setProgress(p.data||[])
    setMessage(s.error?.message || p.error?.message || '')
    setLoading(false)
  }

  useEffect(()=>{refresh()},[player?.id,player?.chapters_unlocked?.join(',')])

  async function choose(key) {
    const existing = status?.active_profession
    const leaving = progress.find(p=>p.profession_key===existing)
    const fee = professionSwitchCost(leaving?.level||1)
    if (existing && !window.confirm(`Switch professions? You will lose 50% of ${existing} XP, pay ${fee} gold, and have a 7-day cooldown.`)) return
    setBusy(true)
    const {error} = await supabase.rpc('choose_profession',{target_player:player.id,target_profession:key})
    setMessage(error?.message || `${PROFESSIONS.find(p=>p.key===key)?.name} selected.`)
    await refresh()
    setBusy(false)
  }

  return <section className="story-text" style={{padding:'1rem'}}>
    <h2>⚒️ Professions</h2>
    {!professionUnlocked(player) ? <p>🔒 Professions unlock after completing Chapter 2 and opening Chapter 3. Continue the story to become eligible.</p> : <>
      <p>Choose one active profession. Profession XP and levels are independent of your combat class.</p>
      {loading ? <p>Loading professions…</p> : <>
        {status?.active_profession && <p><strong>Active profession:</strong> {PROFESSIONS.find(p=>p.key===status.active_profession)?.name} · Level {progress.find(p=>p.profession_key===status.active_profession)?.level||1} · {progress.find(p=>p.profession_key===status.active_profession)?.xp||0} XP · {professionPointsAtLevel(progress.find(p=>p.profession_key===status.active_profession)?.level||1)} earned specialization points</p>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(215px,1fr))',gap:12}}>
          {PROFESSIONS.map(profession=><div key={profession.key} style={{border:'1px solid #a9927055',padding:14,borderRadius:5}}>
            <h3>{profession.icon} {profession.name}</h3>
            <p>{profession.description}</p>
            {progress.some(p=>p.profession_key===profession.key) && <p>Saved level: {progress.find(p=>p.profession_key===profession.key).level}</p>}
            <button className="reading-action" disabled={busy || status?.active_profession===profession.key} onClick={()=>choose(profession.key)}>{status?.active_profession===profession.key?'Active':'Choose profession'}</button>
          </div>)}
        </div>
      </>}
    </>}
    {message && <p role="status">{message}</p>}
    <button className="reading-action" onClick={onReturn}>← Return to chapters</button>
  </section>
}
