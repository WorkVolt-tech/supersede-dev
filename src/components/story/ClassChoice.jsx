import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { usePlayerStore } from '../../store/usePlayerStore'
import { CLASSES, pickClass } from '../../game/classes'
import { getJudgesForm, judgesClassChoices } from '../../game/judgesClassRules'
import './ClassChoice.css'

export default function ClassChoice({ player, onContinue }) {
  const setPlayerLocal = usePlayerStore(s => s.setPlayerLocal)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState(player.active_class || '')
  const choices = judgesClassChoices(player)
  const form = getJudgesForm(player)

  async function choose(key) {
    if (busy || !choices.includes(key)) return
    setBusy(true); setError('')
    try {
      // Re-check the current database record before a permanent choice.
      const { data: fresh, error: readError } = await supabase.from('players').select('*').eq('id',player.id).single()
      if (readError) throw readError
      const freshChoices = judgesClassChoices(fresh)
      if (!freshChoices.includes(key)) throw new Error('This class is no longer eligible.')
      const updates = pickClass(fresh,key)
      const { data, error: saveError } = await supabase.from('players').update(updates)
        .eq('id',player.id).is('active_class',null).select().single()
      if (saveError || !data) throw new Error(saveError?.message || 'Class selection could not be saved.')
      setPlayerLocal(data)
      setPicked(key)
    } catch (cause) {
      setError(cause.message || 'Could not save your class. Please try again.')
    } finally { setBusy(false) }
  }

  if (picked) {
    const cls = CLASSES[picked]
    return <div className="class-choice">
      <div className="class-choice-kicker">THE SYSTEM HAS RECOGNIZED YOU</div>
      <h2 style={{color:cls?.color}}>{cls?.name || picked}</h2>
      <p>{cls?.unlockNarrative || 'Your path is chosen. The others close.'}</p>
      <button disabled={busy} onClick={onContinue}>Continue to the chapter's end →</button>
    </div>
  }

  if (!choices.length) return <div className="class-choice">
    <div className="class-choice-kicker">THE JUDGES' VERDICT</div>
    {(player.defeated_bosses || []).includes('twin_judges') ? <>
      <h2>No hidden designation</h2>
      <p>Your existing elemental path or previous class commitment is recognized. The System offers no new hidden class.</p>
      <button onClick={onContinue}>Continue →</button>
    </> : <><h2>Verdict not recorded</h2><p>The Judges' victory could not be verified. Reload the chapter to recover your progress before continuing.</p></>}
  </div>

  return <div className="class-choice">
    <div className="class-choice-kicker">ANOMALY DETECTED · {form.toUpperCase()}</div>
    <h2>Choose your permanent class</h2>
    <p>The Twin Judges have rendered their verdict. One path may be chosen; the others close forever. This decision cannot be undone.</p>
    <div className="class-choice-cards">
      {choices.map(key => {
        const cls = CLASSES[key]
        if (!cls) return null
        return <button key={key} className="class-choice-card" disabled={busy} onClick={() => choose(key)} style={{'--class-color':cls.color}}>
          <strong>{cls.name}</strong>
          <small>{cls.judgeOf}</small>
          <span>{cls.tagline}</span>
          <em>{cls.tiers?.[0]?.a?.[0]} · {cls.tiers?.[0]?.b?.[0]}</em>
          <b>Choose {cls.name} →</b>
        </button>
      })}
    </div>
    {error && <p role="alert" className="class-choice-error">{error}</p>}
  </div>
}
