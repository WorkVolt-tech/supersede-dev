import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './auth.css'

// Character creation — the same insert your old setup.html did.
export default function SetupPage({ session, onCreated }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    const name = username.trim()
    if (name.length < 3) { setError('Username must be at least 3 characters.'); return }
    setBusy(true); setError('')
    const { error } = await supabase.from('players').insert({
      user_id: session.user.id, username: name,
      level: 1, xp: 0, hp: 100, max_hp: 100, gold: 0,
      reputation: 'neutral', chapters_unlocked: [1], current_chapter: 1,
    })
    setBusy(false)
    if (error) setError('Error: ' + error.message)
    else onCreated()
  }

  return (
    <div className="auth-outer">
      <form className="auth-card" onSubmit={submit}>
        <p className="auth-sys">IDENTITY CONFIGURATION</p>
        <h1 className="auth-title">Choose Your Name</h1>
        <p className="auth-sub">Welcome to the System.</p>
        <div className="auth-form">
          <label className="auth-label">Username</label>
          <input className="auth-input" value={username} onChange={e => setUsername(e.target.value)} maxLength={24} placeholder="Your in-game name" />
          <p className="auth-error">{error}</p>
          <button className="auth-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Enter the System ›'}</button>
        </div>
      </form>
    </div>
  )
}
