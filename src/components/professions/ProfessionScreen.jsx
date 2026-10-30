import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { PROFESSIONS, professionUnlocked, professionPointsAtLevel, professionSwitchCost } from '../../game/professions'
import { PROFESSION_TREES, activeProfessionRanks } from '../../game/professionTrees'

export default function ProfessionScreen({player,onReturn,onHalls,onAdventure,onMinerAdventure,onMerchantAdventure,onAlchemistAdventure,onHunterAdventure,onPathfinderAdventure,onEngineerAdventure,onResonanceWeaverAdventure}) {
  const [status,setStatus] = useState(null)
  const [progress,setProgress] = useState([])
  const [discoveries,setDiscoveries] = useState([])
  const [ownedTokens,setOwnedTokens] = useState([])
  const [loading,setLoading] = useState(true)
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')
  const [expandedBranch,setExpandedBranch] = useState(null)

  async function refresh() {
    if (!player) {setLoading(false);return}
    const [s,p,u,i] = await Promise.all([
      supabase.from('profession_status').select('*').eq('player_id',player.id).maybeSingle(),
      supabase.from('profession_progress').select('*').eq('player_id',player.id),
      supabase.from('profession_unlocks').select('profession_key').eq('player_id',player.id),
      supabase.from('inventory').select('item_key,quantity').eq('player_id',player.id).like('item_key','profession_token_%'),
    ])
    setStatus(s.data||null)
    setProgress(p.data||[])
    setDiscoveries((u.data||[]).map(x=>x.profession_key))
    setOwnedTokens((i.data||[]).filter(x=>x.quantity>0).map(x=>x.item_key.replace('profession_token_','')))
    if(s.error||p.error||u.error||i.error) setMessage(s.error?.message || p.error?.message || u.error?.message || i.error?.message || '')
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

  async function discover(key) {
    setBusy(true)
    const {error}=await supabase.rpc('discover_profession',{target_player:player.id,target_profession:key})
    await refresh()
    setMessage(error?.message||'Profession discovered! Available to activate after Chapter 2.')
    setBusy(false)
  }

  async function invest(branch) {
    setBusy(true)
    const {error} = await supabase.rpc('invest_profession_point',{target_player:player.id,branch_key:branch})
    await refresh()
    setMessage(error?.message || 'Specialization point allocated.')
    setBusy(false)
  }

  async function respecialize() {
    if (!window.confirm('Reset specialization? Lose 15% profession XP and start a 24-hour cooldown?')) return
    setBusy(true)
    const {error} = await supabase.rpc('reset_profession_specialization',{target_player:player.id})
    await refresh()
    setMessage(error?.message || 'Specialization reset successfully.')
    setBusy(false)
  }

  const active = status?.active_profession
  const current = progress.find(p=>p.profession_key===active)
  const history = current?.allocation_history || []
  const points = professionPointsAtLevel(current?.level||1)
  const ranks = activeProfessionRanks(history,current?.level||1)

  return <section className="story-text" style={{padding:'1rem'}}>
    <h2>⚒️ Professions</h2>
    <button className="reading-action" onClick={onHalls}>🏛️ Visit the Profession District · NPC halls and rotating showcases</button>
    {!professionUnlocked(player) && <p>🔒 Profession activation unlocks after Chapter 2. Collect profession discovery items in Chapter 2 farming areas; discoveries can be registered now.</p>}
    <>
      <p>Choose one active profession. Profession XP and levels are independent of your combat class.</p>
      {loading ? <p>Loading professions…</p> : <>
        {status?.active_profession && <p><strong>Active profession:</strong> {PROFESSIONS.find(p=>p.key===status.active_profession)?.name} · Level {progress.find(p=>p.profession_key===status.active_profession)?.level||1} · {progress.find(p=>p.profession_key===status.active_profession)?.xp||0} XP · {professionPointsAtLevel(progress.find(p=>p.profession_key===status.active_profession)?.level||1)} earned specialization points</p>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(215px,1fr))',gap:12}}>
          {PROFESSIONS.map(profession=><div key={profession.key} style={{border:'1px solid #a9927055',padding:14,borderRadius:5}}>
            <h3>{profession.icon} {profession.name}</h3>
            <p>{profession.description}</p>
            {progress.some(p=>p.profession_key===profession.key) && <p>Saved level: {progress.find(p=>p.profession_key===profession.key).level}</p>}
            <p>{discoveries.includes(profession.key)?'✓ Discovered':ownedTokens.includes(profession.key)?'Discovery item found':'🔒 Discovery item missing'}</p>
            {ownedTokens.includes(profession.key)&&!discoveries.includes(profession.key) && <button className="reading-action" disabled={busy} onClick={()=>discover(profession.key)}>Discover profession</button>}
            <button className="reading-action" disabled={busy || !professionUnlocked(player) || !discoveries.includes(profession.key) || status?.active_profession===profession.key} onClick={()=>choose(profession.key)}>{status?.active_profession===profession.key?'Active':'Activate profession'}</button>
          </div>)}
        </div>
        {active==='resonance_weaver'&&professionUnlocked(player)&&discoveries.includes('resonance_weaver')&&<button className="reading-action" onClick={onResonanceWeaverAdventure}>💠 Enter Resonance Weaver Chapter · The Shattered Harmony</button>}
        {active==='engineer'&&professionUnlocked(player)&&discoveries.includes('engineer')&&<button className="reading-action" onClick={onEngineerAdventure}>🔧 Enter Engineer Chapter · Rise of the Machines</button>}
        {active==='pathfinder'&&professionUnlocked(player)&&discoveries.includes('pathfinder')&&<button className="reading-action" onClick={onPathfinderAdventure}>🧭 Enter Pathfinder Chapter · The Forgotten World</button>}
        {active==='hunter'&&professionUnlocked(player)&&discoveries.includes('hunter')&&<button className="reading-action" onClick={onHunterAdventure}>🏹 Enter Hunter Chapter · The Apex Hunt</button>}
        {active==='alchemist'&&professionUnlocked(player)&&discoveries.includes('alchemist')&&<button className="reading-action" onClick={onAlchemistAdventure}>⚗️ Enter Alchemist Chapter · The Forbidden Formula</button>}
        {active==='merchant'&&professionUnlocked(player)&&discoveries.includes('merchant')&&<button className="reading-action" onClick={onMerchantAdventure}>🪙 Enter Merchant Chapter · The Golden Exchange</button>}
        {active==='miner'&&professionUnlocked(player)&&discoveries.includes('miner')&&<button className="reading-action" onClick={onMinerAdventure}>⛏️ Enter Miner Chapter · Beneath the Broken Earth</button>}
        {active==='forger'&&professionUnlocked(player)&&discoveries.includes('forger')&&<button className="reading-action" onClick={onAdventure}>🔨 Enter Forger Chapter · The Trial of Steel</button>}
        {active && <section style={{marginTop:24}}>
          <h3>Specialization · {PROFESSIONS.find(p=>p.key===active)?.name}</h3>
          <p><strong>{Math.max(0,points-history.length)} available</strong> · {history.length} spent · {points} earned · 20 maximum</p>
          {history.length>points && <p role="status">{history.length-points} previously purchased ranks are inactive until profession levels are regained.</p>}
          <p>Earn one point every five profession levels. Ranks are purchased sequentially; no branch can exceed rank 10.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
          {Object.entries(PROFESSION_TREES[active]||{}).map(([key,branch])=>{
            const purchased=history.filter(v=>v===key).length
            const enabled=ranks[key]||0
            return <div key={key} style={{border:'1px solid #a9927055',padding:12,borderRadius:5}}>
              <h4>{branch.name} · {enabled}/10 active</h4>
              <button className="reading-action" onClick={()=>setExpandedBranch(expandedBranch===key?null:key)}>{expandedBranch===key?'Hide':'Show'} upgrades</button>
              <button className="reading-action" disabled={busy||history.length>=points||purchased>=10} onClick={()=>invest(key)}>Invest one point</button>
              {expandedBranch===key && <ol style={{paddingLeft:22}}>{branch.ranks.map(rank=><li key={rank.rank} style={{marginBottom:8,opacity:rank.rank<=enabled?1:.65}}>
                <strong>{rank.name}</strong> {rank.rank<=enabled?'✓ Active':rank.rank<=purchased?'(inactive)':'(locked)'}<div>{rank.effect}</div>
              </li>)}</ol>}
            </div>
          })}
          </div>
          <button className="reading-action" disabled={busy||history.length===0||new Date(current?.respec_available_at||0)>new Date()} onClick={respecialize}>Reset specialization · −15% XP</button>
          {new Date(current?.respec_available_at||0)>new Date() && <p>Reset available after {new Date(current.respec_available_at).toLocaleString()}.</p>}
        </section>}
      </>}
    </>
    {message && <p role="status">{message}</p>}
    <button className="reading-action" onClick={onReturn}>← Return to chapters</button>
  </section>
}
