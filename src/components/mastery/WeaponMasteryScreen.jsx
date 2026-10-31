import { usePlayerStore } from '../../store/usePlayerStore'
import { weaponMasteryLevel, nextWeaponMasteryThreshold, weaponMasteryBonus, MASTERY_XP_THRESHOLDS } from '../../game/tacticalGrid'
import '../skills/SkillsScreen.css'

export default function WeaponMasteryScreen({ onReturn, onSkills }) {
  const player = usePlayerStore(s => s.player)
  const entries = Object.entries(player?.weapon_mastery || {})
    .filter(([,xp]) => Number(xp)>0)
    .sort((a,b)=>Number(b[1]||0)-Number(a[1]||0))
  return <main className="skills-screen weapon-mastery-page">
    <header className="skills-header">
      <button type="button" onClick={onReturn}>← The Archive</button>
      <div><span>CHARACTER PROGRESSION</span><h1>Weapon Mastery</h1></div>
      {onSkills && <button type="button" onClick={onSkills}>Skills &amp; Attributes</button>}
    </header>
    <section className="skills-weapon-mastery" aria-labelledby="weapon-mastery-heading">
      <h2 id="weapon-mastery-heading">Your weapon specializations</h2>
      <p>Each weapon type advances independently when you land successful attacks. Mastery XP, level, damage bonuses and unlocked techniques all follow your saved character progression.</p>
      {entries.length===0
        ? <p className="skills-weapon-empty">No weapon mastery earned yet. Land hits with an equipped weapon to start building mastery.</p>
        : <div className="skills-mastery-grid">{entries.map(([weapon,xp])=>{
          const value=Math.max(0,Math.floor(Number(xp)||0))
          const level=weaponMasteryLevel(value)
          const start=MASTERY_XP_THRESHOLDS[level-1]??0
          const next=nextWeaponMasteryThreshold(value)
          const pct=next===null?100:Math.min(100,Math.max(0,(value-start)/(next-start)*100))
          return <article className="skills-mastery-card" key={weapon}>
            <div className="skills-mastery-top"><strong>{weapon.replaceAll('_',' ')}</strong><span>Lv {level}/100</span></div>
            <div className="skills-mastery-track" role="progressbar" aria-label={weapon+' mastery progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}><div style={{width:pct+'%'}} /></div>
            <small>{value} mastery XP {next!==null?'· '+(next-value)+' XP to next level':'· MAX LEVEL'} · +{weaponMasteryBonus(value)} damage</small>
          </article>
        })}</div>}
    </section>
  </main>
}
