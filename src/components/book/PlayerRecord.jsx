import { getMoralTier, getMoralBarPct, getBadgeMeta } from '../../game/reputation'
import { xpProgress } from '../../game/leveling'
import { useInventoryStore } from '../../store/useInventoryStore'
import { getEffectiveStats } from '../../game/playerStats'

const clamp = (v) => Math.max(0, Math.min(100, v))

export default function PlayerRecord({ player, onNavigate }) {
  const items = useInventoryStore(s => s.items)
  const equipped = items.filter(i => i.equipped_slot)
  const stats = getEffectiveStats(player, equipped)
  const hp = Number(player.hp ?? 100)
  const maxHp = stats.maxHp
  const tier = getMoralTier(player.moral_score)
  const badge = getBadgeMeta(player.badge)
  const progress = xpProgress(player)
  return <>
    <span className="reading-page-heading">Adventurer's record</span>
    <h2>{player.username}</h2>
    <div className="reading-stat-grid">
      <div><span className="reading-stat-label">Level</span><span className="reading-stat-value">{player.level ?? 1}</span></div>
      <div><span className="reading-stat-label">Gold</span><span className="reading-stat-value">◈ {player.gold ?? 0}</span></div>
      <div><span className="reading-stat-label">Reputation</span><span className="reading-stat-value" style={{color:tier.color}}>{tier.label}</span></div>
      <div><span className="reading-stat-label">Standing</span><span className="reading-stat-value" style={{color:badge.color}}>{badge.label}</span></div>
    </div>
    <div className="reading-meter-label"><span>Life</span><span>{hp} / {maxHp}</span></div>
    <div className="reading-meter" role="progressbar" aria-label="Life" aria-valuenow={clamp(hp / maxHp * 100)} aria-valuemin="0" aria-valuemax="100"><div style={{width:`${clamp(hp/maxHp*100)}%`, background:'#a34835'}} /></div>
    <div className="reading-meter-label"><span>Experience</span><span>{progress.into} / {progress.needed}</span></div>
    <div className="reading-meter" role="progressbar" aria-label="Experience" aria-valuenow={progress.pct} aria-valuemin="0" aria-valuemax="100"><div style={{width:`${progress.pct}%`, background:'#8a7839'}} /></div>
    <div className="reading-meter-label"><span>Moral alignment</span><span>{player.moral_score ?? 0}</span></div>
    <div className="reading-moral-track"><span style={{left:`${getMoralBarPct(player.moral_score)}%`}} /></div>
    <div className="reading-meter-endpoints"><span>Villain</span><span>Hero</span></div>
    <div className="reading-minor-stats">
      <div>Insight <b>{stats.core.insight}</b></div>
      <div>PvP kills <b>{player.pvp_kills ?? 0}</b></div>
      <div>Helps given <b>{player.helps_given ?? 0}</b></div>
    </div>
    <span className="reading-page-heading" style={{marginTop:22}}>Attributes &amp; skill points</span>
    <p className="reading-stat-summary"><strong>{player.skill_points ?? 0}</strong> unspent skill points · <strong>{player.resonance_shards ?? 0}</strong> resonance shards</p>
    <div className="reading-derived-grid">
      <div>Combat ATK <strong>{stats.attack}</strong></div>
      <div>Combat DEF <strong>{stats.defense}</strong></div>
      <div>Initiative <strong>{stats.initiative}</strong></div>
    </div>
    <div className="reading-attribute-grid">
      {[
        ['Attack','atk'],['Defense','def'],['Power','power'],['Guard','guard'],
        ['Speed','speed'],['Control','control'],['Insight','insight'],['Luck','luck'],['Agility','agility'],
      ].map(([label,key])=><div key={key}>{label}<strong>{stats.core[key]}</strong>
        {stats.equipment[key] !== 0 && <small>{stats.base[key]} base {stats.equipment[key]>0?'+':''}{stats.equipment[key]} gear</small>}
      </div>)}
    </div>
    <button className="reading-action" onClick={()=>onNavigate('skills')}>⬡ View and spend skill points</button>
    <span className="reading-page-heading" style={{marginTop:26}}>Archive &amp; systems</span>
    <div className="reading-quick-nav">
      {['chapters','inventory','skills','trader','lobby','badges'].map(view => <button key={view} className="reading-action" onClick={() => onNavigate(view === 'chapters' ? 'menu' : view)}>{view}</button>)}
    </div>
    <button className="reading-action" onClick={() => onNavigate('farming')}>⚔ Chapter 1 farming areas</button>
  </>
}
