import { useState } from 'react'
import { NODES } from '../../data/ch1/nodes'
import CombatScreen from '../combat/CombatScreen'
import { usePlayerStore } from '../../store/usePlayerStore'
import './FarmingAreas.css'

const images = {
  loc_garage: '/assets/zones/zone_parking_garage.webp',
  loc_market: '/assets/zones/zone_frozen_market.webp',
  loc_tower: '/assets/zones/zone_glass_tower.webp',
}
const ZONE_GUARDIANS = {
  loc_garage: 'sentinel',
  loc_market: 'surveyor',
  loc_tower: 'unseen',
}
const RANGED_ZONE_DROPS = {
  loc_garage: [{itemKey:'improvised_bow',chance:.06},{itemKey:'rusted_pistol',chance:.04}],
  loc_market: [{itemKey:'salvaged_crossbow',chance:.05}],
  loc_tower: [{itemKey:'security_rifle',chance:.05}],
}

export default function FarmingAreas({ onReturn }) {
  const player = usePlayerStore(s => s.player)
  const [encounter, setEncounter] = useState(null)
  const [message, setMessage] = useState('')
  const locations = NODES.farming_hub.locations
  const clearedGuardians = player?.defeated_bosses || []
  const isUnlocked = area => clearedGuardians.includes(ZONE_GUARDIANS[area.id])

  function beginFight(area) {
    if (!isUnlocked(area)) return
    const spawn = area.enemies[Math.floor(Math.random() * area.enemies.length)]
    const enemy = {...spawn,loot:[...(spawn.loot||[]),...(RANGED_ZONE_DROPS[area.id]||[])]}
    setMessage('')
    setEncounter({ enemy, area, key: `${area.id}-${Date.now()}` })
  }

  if (encounter) return <div className="farming-encounter" key={encounter.key}>
    <img className="farming-encounter-art" src={images[encounter.area.id]} alt={`${encounter.area.name} — the battlefield`} />
    <div className="farming-encounter-heading">
      <span>{encounter.area.icon} {encounter.area.name}</span>
      <h2>{encounter.enemy.icon} {encounter.enemy.name}</h2>
      <p>A System entity emerges from the distortion. Defeat it for experience.</p>
    </div>
    <CombatScreen enemyData={encounter.enemy}
      onWin={() => { setMessage(`Defeated ${encounter.enemy.name}. XP awarded.`); setEncounter(null) }}
      onLose={() => { setMessage('You retreated to the farming area.'); setEncounter(null) }}
      onEscape={() => { setMessage('You escaped the encounter.'); setEncounter(null) }} />
  </div>

  return <div className="farming-areas">
    <p className="story-text">Explore the district's farming grounds. Each area unlocks for repeatable hunts once you defeat its guardian in the Chapter 1 story.</p>
    {message && <p className="farming-message" role="status">{message}</p>}
    <div className="farming-cards">
      {locations.map(area => <article className={`farming-card ${isUnlocked(area) ? '' : 'farming-card-locked'}`} key={area.id}>
        <img src={images[area.id]} alt={`${area.name} environment artwork`} loading="lazy" />
        <div className="farming-card-content">
          <span className="farming-difficulty" style={{ color: area.color }}>{area.level} · System activity</span>
          <h3>{area.name}</h3>
          <p>{area.desc}</p>
          <p className="farming-enemies">{area.enemies.map(e => `${e.icon} ${e.name}`).join(' · ')}</p>
          {isUnlocked(area)
            ? <button className="reading-action" onClick={() => beginFight(area)}>Enter hunting ground ›</button>
            : <><p className="farming-locked-note">🔒 Complete the {area.name} storyline and defeat its guardian to unlock farming here.</p>
                <button className="reading-action" disabled>Locked · Story completion required</button></>}
        </div>
      </article>)}
    </div>
    <button className="reading-action" onClick={onReturn}>← Return to the archive</button>
  </div>
}
