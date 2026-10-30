// AP is derived from the persisted character level, and refills every round/fight.
export function maxCombatAp(level=1) {
  return 5 + Math.floor((Math.max(1, Number(level) || 1) - 1) / 5)
}

// Shared action point meter for solo, boss and group encounters.
export default function CombatActionPoints({ap,max=5,round=1}) {
  const current=Math.max(0,Math.min(max,Number(ap)||0))
  return <div className="combat-ap-meter" aria-label="Action points meter"
    data-round={round}>
    <div className="combat-ap-label"><strong>Action Points · Round {round}</strong>
      <span>{current}/{max} AP</span></div>
    <div className="combat-ap-segments" role="progressbar" aria-label="Action Points"
      aria-valuemin={0} aria-valuemax={max} aria-valuenow={current}>
      {Array.from({length:max},(_,i)=><span key={i}
        className={'combat-ap-segment'+(i<current?' filled':'')}/>)}
    </div>
  </div>
}
