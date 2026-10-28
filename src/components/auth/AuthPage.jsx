import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './auth.css'

// Same two calls your old auth.html made: signUp / signInWithPassword.
// App.jsx listens for the session change and moves on automatically.
export default function AuthPage() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    const { error } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <div className="auth-outer">
      <form className="auth-card" onSubmit={submit}>
        <p className="auth-sys">SYSTEM ACCESS</p>
        <h1 className="auth-title">{mode === 'signup' ? 'Create Account' : 'Sign In'}</h1>
        <p className="auth-sub">{mode === 'signup' ? 'A new record begins.' : 'The System remembers you.'}</p>
        <div className="auth-form">
          <label className="auth-label">Email</label>
          <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <label className="auth-label">Password</label>
          <input className="auth-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          <p className="auth-error">{error}</p>
          <button className="auth-btn" type="submit" disabled={busy}>{busy ? 'Working…' : mode === 'signup' ? 'Create Account ›' : 'Enter ›'}</button>
        </div>
        <button type="button" className="auth-switch" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}>
          {mode === 'signup' ? 'I already have an account' : 'I need to create an account'}
        </button>
      </form>
    </div>
  )
}
