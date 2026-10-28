// TurnQueue.jsx — visual readout of formation.js's computeTurnOrder() result.
export default function TurnQueue({ order, activeIndex }) {
  return (
    <div className="turn-queue">
      <span className="turn-queue-label">ORDER</span>
      {order.map((entry, i) => (
        <div
          key={entry.combatant.id + i}
          className={`turn-queue-item ${i === activeIndex ? 'active' : ''} ${entry.side === 'enemy' ? 'enemy-turn' : ''}`}
          title={entry.combatant.name}
        >
          {entry.combatant.icon || (entry.side === 'enemy' ? '👹' : '🧑')}
        </div>
      ))}
    </div>
  )
}
