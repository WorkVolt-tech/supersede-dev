import { useState } from 'react'
import { NODES } from '../../data/ch1/nodes'
import CombatScreen from '../combat/CombatScreen'
import { usePlayerStore } from '../../store/usePlayerStore'
import { chapterOneComplete } from '../../game/progression'
import './FarmingAreas.css'

const images = {
  loc_garage: '/assets/zones/zone_parking_garage.webp',
  loc_market: '/assets/zones/zone_frozen_market.webp',
  loc_tower: '/assets/zones/zone_glass_tower.webp',
}

export default function FarmingAreas({ onReturn }) {
  const player = usePlayerStore(s => s.player)
  const [encounter, setEncounter] = useState(null)
  const [message, setMessage] = useState('')
  const locations = NODES.farming_hub.locations
  if (!chapterOneComplete(player)) return <div className="farming-areas">
    <p className="story-text">🔒 These hunting grounds unlock after you complete Chapter 1 of the story.</p>
    <button className="reading-action" onClick={onReturn}>← Return to the archive</button>
  </div>

  function beginFight(area) {
    const enemy = area.enemies[Math.floor(Math.random() * area.enemies.length)]
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
    <p className="story-text">Three districts are active with System entities. Choose where to hunt; defeated enemies award XP and any listed loot.</p>
    {message && <p className="farming-message" role="status">{message}</p>}
    <div className="farming-cards">
      {locations.map(area => <article className="farming-card" key={area.id}>
        <img src={images[area.id]} alt={`${area.name} environment artwork`} loading="lazy" />
        <div className="farming-card-content">
          <span className="farming-difficulty" style={{ color: area.color }}>{area.level} · System activity</span>
          <h3>{area.name}</h3>
          <p>{area.desc}</p>
          <p className="farming-enemies">{area.enemies.map(e => `${e.icon} ${e.name}`).join(' · ')}</p>
          <button className="reading-action" onClick={() => beginFight(area)}>Hunt here ›</button>
        </div>
      </article>)}
    </div>
    <button className="reading-action" onClick={onReturn}>← Return to the archive</button>
  </div>
}
