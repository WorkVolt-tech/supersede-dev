// DistrictHubCh2.jsx
// ─────────────────────────────────────────────────────────────────────────
// Ch2's 10-zone hub. Same open question as the vanilla Ch2 build: nothing
// in the data defines when a zone should be locked, so all 10 are open
// from the start here too — revisit if there's a specific gating rule in
// mind.
import { ZONES } from '../../data/ch2/config'

export default function DistrictHubCh2({ player, goTo }) {
  const attempted = player.ch2_elements_attempted || []

  return (
    <div className="story-node">
      <p className="choices-label">Elemental Zones</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '1rem 0' }}>
        {ZONES.map(z => {
          const done = attempted.includes(z.id)
          return (
            <div
              key={z.id}
              onClick={() => goTo(z.id)}
              style={{
                border: `1px solid ${z.color}50`, borderRadius: 5, padding: '.65rem .75rem',
                background: `${z.color}10`, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span>{z.icon}</span>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: '.82rem' }}>{z.name}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '.5rem', color: z.color, marginLeft: 'auto' }}>
                  {done ? '✓ VISITED' : z.element}
                </span>
              </div>
              <p style={{ fontStyle: 'italic', fontSize: '.7rem', color: '#8a7255', margin: '3px 0 0' }}>{z.branch}</p>
            </div>
          )
        })}
      </div>
      <button className="choice" onClick={() => goTo('farming_grounds_hub')} style={{ width: '100%' }}>
        <span className="choice-arrow">→</span><span className="choice-body">Enter Farming Grounds · rare profession discoveries</span>
      </button>
      <button className="choice" onClick={() => goTo('pre_boss_gate')} style={{ width: '100%' }}>
        <span className="choice-arrow">→</span>
        <span className="choice-body">Face the Twin Judges</span>
      </button>
    </div>
  )
}
