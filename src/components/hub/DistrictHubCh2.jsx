// Chapter 2 district navigation. The original data currently defines no
// zone prerequisites, so all ten zones remain available.
import { useState } from 'react'
import { ZONES, ELEMENT_NAMES } from '../../data/ch2/config'
import { getChapterResonance, getElementalDifficulty } from '../../data/ch2/elementalDifficulty'

export default function DistrictHubCh2({ player, goTo, text }) {
  const [navigating, setNavigating] = useState(false)
  const attempted = player.ch2_elements_attempted || []
  const defeated = player.defeated_bosses || []
  const visitedCount = ZONES.filter(zone => attempted.includes(zone.id)).length
  const resonance = getChapterResonance(player)
  const difficulty = getElementalDifficulty(player)
  const defeatedCount = ZONES.filter(zone => defeated.includes('zone_boss_' + zone.id.slice(5))).length

  async function enter(nodeId) {
    if (navigating) return
    setNavigating(true)
    try {
      await goTo(nodeId)
    } finally {
      setNavigating(false)
    }
  }

  return (
    <div className="story-node">
      {text && <p className="story-text">{text}</p>}
      <p className="choices-label">Elemental Zones · {visitedCount}/{ZONES.length} visited · {defeatedCount}/{ZONES.length} guardians defeated</p>
      <p className="story-text" style={{ fontSize: '.85rem' }}>
        Chapter resonance: {resonance ? ELEMENT_NAMES[resonance] || resonance : 'Not established — defeat your first elemental guardian'}.
        {' '}Elemental difficulty: ×{difficulty}. Each additional element doubles enemy HP, ATK, DEF and speed.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '1rem 0' }}>
        {ZONES.map(zone => {
          const visited = attempted.includes(zone.id)
          const cleared = defeated.includes('zone_boss_' + zone.id.slice(5))
          return (
            <button
              key={zone.id}
              type="button"
              disabled={navigating}
              onClick={() => enter(zone.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                border: `1px solid ${zone.color}50`, borderRadius: 5, padding: '.65rem .75rem',
                background: `${zone.color}10`, color: 'inherit',
                cursor: navigating ? 'wait' : 'pointer',
                font: 'inherit',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span aria-hidden="true">{zone.icon}</span>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: '.82rem' }}>{zone.name}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '.6rem', color: zone.color, marginLeft: 'auto' }}>
                  {cleared ? '✓ CLEARED' : visited ? '✓ VISITED' : zone.element}
                </span>
              </span>
              <span style={{ display: 'block', fontStyle: 'italic', fontSize: '.7rem', color: '#8a7255', marginTop: 3 }}>{zone.branch}</span>
            </button>
          )
        })}
      </div>
      <p className="choices-label">District activities</p>
      <button type="button" className="choice" disabled={navigating} onClick={() => enter('trader_intro')} style={{ width: '100%' }}>
        <span className="choice-arrow">→</span><span className="choice-body">Visit Pell's Shop · neutral trader and information</span>
      </button>
      <button type="button" className="choice" disabled={navigating} onClick={() => enter('farming_grounds_hub')} style={{ width: '100%' }}>
        <span className="choice-arrow">→</span><span className="choice-body">Enter Farming Grounds · rare profession discoveries</span>
      </button>
      <button type="button" className="choice" disabled={navigating} onClick={() => enter('pre_boss_gate')} style={{ width: '100%' }}>
        <span className="choice-arrow">→</span><span className="choice-body">Face the Twin Judges</span>
      </button>
    </div>
  )
}
