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
import BookShell from './components/book/BookShell'
import PlayerRecord from './components/book/PlayerRecord'
import { chapterOneComplete, firstDriveComplete } from './game/progression'
import { resetOwnCharacter } from './game/resetCharacter'
import './App.css'

// Which screen shows is just a piece of state (`view`) — no URL routing,
// so nothing extra is needed on Cloudflare. Add a screen: add a line in
// components/menu/StartMenu.jsx and a matching line in `screens` below.
export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [view, setView] = useState('menu')
  const [resetDialog, setResetDialog] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [resetError, setResetError] = useState('')

  const player = usePlayerStore(s => s.player)
  const loading = usePlayerStore(s => s.loading)
  const error = usePlayerStore(s => s.error)
  const loadPlayer = usePlayerStore(s => s.loadPlayer)
  const loadInventory = useInventoryStore(s => s.loadInventory)
  const updatePlayer = usePlayerStore(s => s.updatePlayer)

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

  async function confirmReset() {
    if (!player || resetBusy) return
    setResetBusy(true)
    setResetError('')
    try {
      await resetOwnCharacter(player)
      await loadPlayer(session.user.id)
      await loadInventory(player.id)
      setView('menu')
      setResetDialog(false)
    } catch (error) {
      setResetError(error.message || 'Reset failed. Please try again.')
    } finally {
      setResetBusy(false)
    }
  }

  function navigate(nextView) {
    if (nextView === 'drive' && !chapterOneComplete(player)) return
    if (nextView === 'ch2' && !firstDriveComplete(player)) return
    setView(nextView)
  }

  async function finishDrive(result) {
    if (result === 'win' && player) {
      const chapters = [...new Set([...(player.chapters_unlocked || [1]), 2])]
      await updatePlayer({ chapters_unlocked: chapters })
    }
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
    drive: <VehicleCanvas onComplete={finishDrive} />,
  }

  const archivedSections = {
    skills: ['Skills', 'The original skill tree and upgrade interface have not yet been migrated to React. Your character and progress are preserved.'],
    trader: ['Trader', 'The original trading and merchant interface has not yet been migrated. No gold or inventory will be spent here.'],
    lobby: ['Lobby', 'Multiplayer lobby and player interactions still need their React and Supabase integration.'],
    badges: ['Badges', 'Your current reputation and standing are shown on the right. The original badges gallery is awaiting migration.'],
  }

  if (archivedSections[view]) {
    const [title, description] = archivedSections[view]
    return <BookShell eyebrow="Archive · Game systems" title={title} subtitle="Your original game systems are being reunited with the reader."
      left={<><h2>{title}</h2><p className="story-text">{description}</p><button className="reading-action" onClick={() => setView('menu')}>← Return to chapters</button></>}
      right={<PlayerRecord player={player} onNavigate={setView} />} />
  }

  if (view === 'menu' || !screens[view]) {
    return <>
      <StartMenu player={player} onPick={navigate} onSignOut={signOut} onReset={() => { setResetError(''); setResetDialog(true) }} />
      {resetDialog && <div className="reset-overlay" role="dialog" aria-modal="true" aria-labelledby="reset-title">
        <div className="reset-panel">
          <h2 id="reset-title">Begin again?</h2>
          <p>This permanently resets your character to Level 1, 0 XP and the beginning of Chapter 1. Your inventory, gold, reputation and unlocks will be cleared. Your account and username stay.</p>
          {resetError && <p role="alert" className="reset-error">{resetError}</p>}
          <button disabled={resetBusy} onClick={confirmReset}>{resetBusy ? 'Resetting…' : 'Yes, reset my character'}</button>
          <button disabled={resetBusy} onClick={() => setResetDialog(false)}>Cancel</button>
        </div>
      </div>}
    </>
  }

  const isChapter = view === 'ch1' || view === 'ch2'
  if (isChapter) {
    return <BookShell
      eyebrow={`The story · ${view === 'ch1' ? 'Chapter I' : 'Chapter II'}`}
      title={view === 'ch1' ? 'Awakening' : 'Broken Alliances'}
      subtitle="Read, choose, and shape the world. Your journey is being recorded."
      left={screens[view]}
      right={<PlayerRecord player={player} onNavigate={navigate} />}
      footer={`${view === 'ch1' ? 'I' : 'II'} · SuperSede · Living Archive`} />
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
