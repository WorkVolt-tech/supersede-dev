import { useState } from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import { weaponMasteryLevel, nextWeaponMasteryThreshold, weaponMasteryBonus, MASTERY_XP_THRESHOLDS, getTacticalAttacks, MASTERY_TECHNIQUES, TACTICAL_ATTACKS, selectedWeaponAttacks } from '../../game/tacticalGrid'
import '../skills/SkillsScreen.css'

export default function WeaponMasteryScreen({ onReturn, onSkills }) {
  const player = usePlayerStore(s => s.player)
  const updatePlayer = usePlayerStore(s=>s.updatePlayer)
  const [saving,setSaving]=useState(false)
  const [notice,setNotice]=useState('')
  async function toggleTechnique(weapon,id,available) {
    if(saving)return
    const loadout=player.weapon_attack_loadout||{}
    const chosen=selectedWeaponAttacks(available.filter(a=>!a.fallback),loadout[weapon],4).map(a=>a.id)
    const next=chosen.includes(id)?chosen.filter(x=>x!==id):[...chosen,id]
    if(next.length>4||next.length===0){setNotice('Choose between 1 and 4 weapon techniques.');return}
    setSaving(true)
    const ok=await updatePlayer({weapon_attack_loadout:{...loadout,[weapon]:next}})
    setNotice(ok?'Weapon techniques saved.':'Could not save the loadout.')
    setSaving(false)
  }
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
      {notice&&<p role="status">{notice}</p>}
      {entries.length===0
        ? <p className="skills-weapon-empty">No weapon mastery earned yet. Land hits with an equipped weapon to start building mastery.</p>
        : <div className="skills-mastery-grid">{entries.map(([weapon,xp])=>{
          const value=Math.max(0,Math.floor(Number(xp)||0))
          const level=weaponMasteryLevel(value)
          const start=MASTERY_XP_THRESHOLDS[level-1]??0
          const next=nextWeaponMasteryThreshold(value)
          const pct=next===null?100:Math.min(100,Math.max(0,(value-start)/(next-start)*100))
          const available=getTacticalAttacks(weapon,[],value).filter(a=>!a.fallback)
          const active=selectedWeaponAttacks(available,player.weapon_attack_loadout?.[weapon],4).map(a=>a.id)
          const upcoming=(MASTERY_TECHNIQUES[weapon]||[]).filter(id=>!available.some(a=>a.id===id))
          return <article className="skills-mastery-card" key={weapon}>
            <div className="skills-mastery-top"><strong>{weapon.replaceAll('_',' ')}</strong><span>Lv {level}/100</span></div>
            <div className="skills-mastery-track" role="progressbar" aria-label={weapon+' mastery progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}><div style={{width:pct+'%'}} /></div>
            <small>{value} mastery XP {next!==null?'· '+(next-value)+' XP to next level':'· MAX LEVEL'} · +{weaponMasteryBonus(value)} damage</small>
            <p>Choose up to four attacks for your combat belt. Emergency Attack remains available separately.</p>
            <div className="mastery-technique-list">{available.map(attack=><label key={attack.id} className="mastery-technique-option"><input type="checkbox" checked={active.includes(attack.id)} disabled={saving || (!active.includes(attack.id)&&active.length>=4)} onChange={()=>toggleTechnique(weapon,attack.id,available)}/><span><strong>{attack.label}</strong><small> {attack.ap} AP · {attack.damage} base damage · {attack.reach} range</small></span></label>)}</div>
            {upcoming.length>0&&<p>Future unlocks: {upcoming.map(id=>TACTICAL_ATTACKS[id].label+' (Lv '+TACTICAL_ATTACKS[id].masteryLevel+')').join(' · ')}</p>}
          </article>
        })}</div>}
    </section>
  </main>
}
