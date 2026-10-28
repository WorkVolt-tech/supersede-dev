import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { usePlayerStore } from './store/usePlayerStore'
import { useInventoryStore } from './store/useInventoryStore'
import AuthPage from './components/auth/AuthPage'
import SetupPage from './components/auth/SetupPage'
import StartMenu from './components/menu/StartMenu'
import ChapterPage from './pages/ChapterPage'
import Ch2ChapterPage from './pages/Ch2ChapterPage'
import PuzzleDemoPage from './pages/PuzzleDemoPage'
import InventoryDemoPage from './pages/InventoryDemoPage'
import CombatDemoPage from './pages/CombatDemoPage'
import InventoryScreen from './components/inventory/InventoryScreen'
import VehicleCanvas from './components/vehicle/VehicleCanvas'
import './App.css'

// Which screen shows is just a piece of state (`view`) — no URL routing,
// so nothing extra is needed on Cloudflare. Add a screen: add a line in
// components/menu/StartMenu.jsx and a matching line in `screens` below.
export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [view, setView] = useState('menu')

  const player = usePlayerStore(s => s.player)
  const loading = usePlayerStore(s => s.loading)
  const error = usePlayerStore(s => s.error)
  const loadPlayer = usePlayerStore(s => s.loadPlayer)
  const loadInventory = useInventoryStore(s => s.loadInventory)

  // Track the login session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s || null))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Load the player whenever someone is signed in
  useEffect(() => {
    if (session) loadPlayer(session.user.id)
  }, [session, loadPlayer])

  // Load the player's REAL inventory (by player id) every time the screen changes,
  // so sample-item demos never leave fake gear behind.
  useEffect(() => {
    if (player && view !== 'inventory-demo') loadInventory(player.id)
  }, [player?.id, view, loadInventory])

  async function signOut() {
    await supabase.auth.signOut()
    usePlayerStore.setState({ player: null, loading: true, error: null })
    setView('menu')
  }

  if (session === undefined) return <p className="story-text" style={{ padding: '2rem' }}>Loading…</p>
  if (!session) return <AuthPage />
  if (loading) return <p className="story-text" style={{ padding: '2rem' }}>Loading…</p>
  if (error) return <p className="story-text" style={{ padding: '2rem' }}>Error: {error}</p>
  if (!player) return <SetupPage session={session} onCreated={() => loadPlayer(session.user.id)} />

  const screens = {
    ch1: <ChapterPage />,
    ch2: <Ch2ChapterPage />,
    inventory: <InventoryScreen />,
    'inventory-demo': <InventoryDemoPage />,
    puzzle: <PuzzleDemoPage />,
    'combat-demo': <CombatDemoPage />,
    drive: <VehicleCanvas onComplete={() => setView('menu')} />,
  }

  if (view === 'menu' || !screens[view]) {
    return <StartMenu player={player} onPick={setView} onSignOut={signOut} />
  }

  return (
    <>
      <div className="back-bar"><button onClick={() => setView('menu')}>← Menu</button></div>
      <div style={{ padding: view === 'drive' ? 0 : '3rem 1rem 2rem', maxWidth: view === 'drive' ? 'none' : 720, margin: '0 auto' }}>
        {screens[view]}
      </div>
    </>
  )
}
