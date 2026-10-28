// ChoiceList.jsx
// ─────────────────────────────────────────────────────────────────────────
// Now also handles `requires` (Ch2's inventory-gated choices, e.g. "hand
// over 2 medical packs") — greys out and explains what's missing, same
// pattern as the insightRequired gating that was already here.
import { useInventoryStore } from '../../store/useInventoryStore'

export default function ChoiceList({ node, player, goTo }) {
  const items = useInventoryStore(s => s.items)
  const insight = player?.insight || 0

  function itemCount(key) {
    return items.filter(i => i.item_key === key).reduce((sum, i) => sum + (i.quantity || 1), 0)
  }
  function meetsRequires(c) {
    if (!c.requires) return true
    return c.requires.every(r => itemCount(r.itemKey) >= r.qty)
  }

  const visible = (node.choices || []).filter(c => !c.insightRequired || insight >= c.insightRequired)
  const hidden  = (node.choices || []).filter(c => c.insightRequired && insight < c.insightRequired)

  return (
    <div className="choices">
      <p className="choices-label">What do you do?</p>
      {visible.map((c, i) => {
        const met = meetsRequires(c)
        if (c.requires && !met) {
          const missing = c.requires.map(r => `${r.qty}× ${r.itemKey}`).join(', ')
          return (
            <div key={i} className="choice locked" title={`Requires ${missing}`}>
              <span className="choice-arrow" style={{ color: '#555' }}>→</span>
              <span className="choice-body" style={{ color: '#888' }}>
                {c.label}
                <span className="choice-sub">Requires {missing}</span>
              </span>
            </div>
          )
        }
        return (
          <button
            key={i}
            className={`choice ${c.variant || ''}`}
            onClick={() => goTo(c.next, {
              outcome: c.outcome || null,
              bossMode: c.bossMode || null,
              moral: c.moral || null,
              allianceTag: c.allianceTag || null,
              allianceTagRepeatable: c.allianceTagRepeatable || null,
            })}
          >
            <span className="choice-arrow">→</span>
            <span className="choice-body">
              {c.label}
              {c.sub && <span className="choice-sub">{c.sub}</span>}
            </span>
          </button>
        )
      })}
      {hidden.map((c, i) => (
        <div key={i} className="choice locked" title={`Requires Insight ${c.insightRequired}`}>
          <span className="choice-arrow" style={{ color: '#555' }}>→</span>
          <span className="choice-body" style={{ color: '#888' }}>
            [INSIGHT {c.insightRequired} REQUIRED]
            <span className="choice-sub">Equip items with Insight to unlock hidden paths</span>
          </span>
        </div>
      ))}
    </div>
  )
}
