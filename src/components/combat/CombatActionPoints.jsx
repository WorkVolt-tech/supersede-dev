// Shared two-segment action point meter for solo, boss and group encounters.
export default function CombatActionPoints({ap,max=2,round=1}) {
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
