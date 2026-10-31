import { getMoralTier, getMoralBarPct, getBadgeMeta } from '../../game/reputation'
import { xpProgress } from '../../game/leveling'
import { useInventoryStore } from '../../store/useInventoryStore'
import { getEffectiveStats } from '../../game/playerStats'
import { professionUnlocked } from '../../game/professions'

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
    <button type="button" className="reading-action reading-skill-points" onClick={() => onNavigate('skills')}>
      ✦ Skill points: {player.skill_points ?? 0} available · Open Skills
    </button>
    <span className="reading-page-heading" style={{marginTop:26}}>Archive &amp; systems</span>
    <div className="reading-quick-nav">
      {['chapters','inventory','skills','trader','lobby','badges'].map(view => <button key={view} className="reading-action" onClick={() => onNavigate(view === 'chapters' ? 'menu' : view)}>{view}</button>)}
    </div>
    <button className="reading-action" onClick={() => onNavigate('farming')}>⚔ Chapter 1 farming areas</button>
    {professionUnlocked(player) && <button className="reading-action" onClick={() => onNavigate('professions')}>⚒ Professions</button>}
  </>
}
