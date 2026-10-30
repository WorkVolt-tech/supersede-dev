import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { usePlayerStore } from './store/usePlayerStore'
import { useInventoryStore } from './store/useInventoryStore'
import AuthPage from './components/auth/AuthPage'
import SetupPage from './components/auth/SetupPage'
import StartMenu from './components/menu/StartMenu'
import ChapterPage from './pages/ChapterPage'
import Ch2ChapterPage from './pages/Ch2ChapterPage'
import Ch3ChapterPage from './pages/Ch3ChapterPage'
import InventoryDemoPage from './pages/InventoryDemoPage'
import CombatDemoPage from './pages/CombatDemoPage'
import JudgesPreviewPage from './pages/JudgesPreviewPage'
import InventoryScreen from './components/inventory/InventoryScreen'
import VehicleCanvas from './components/vehicle/VehicleCanvas'
import BookShell from './components/book/BookShell'
import PlayerRecord from './components/book/PlayerRecord'
import FarmingAreas from './components/farming/FarmingAreas'
import SkillsScreen from './components/skills/SkillsScreen'
import ProfessionScreen from './components/professions/ProfessionScreen'
import ProfessionHalls from './components/professions/ProfessionHalls'
import ForgerAdventure from './components/professions/ForgerAdventure'
import MinerAdventure from './components/professions/MinerAdventure'
import MerchantAdventure from './components/professions/MerchantAdventure'
import AlchemistAdventure from './components/professions/AlchemistAdventure'
import HunterAdventure from './components/professions/HunterAdventure'
import PathfinderAdventure from './components/professions/PathfinderAdventure'
import EngineerAdventure from './components/professions/EngineerAdventure'
import ResonanceWeaverAdventure from './components/professions/ResonanceWeaverAdventure'
import { chapterOneComplete, firstDriveComplete, chapterTwoComplete, secondDriveComplete } from './game/progression'
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
    if (nextView === 'drive3' && !chapterTwoComplete(player)) return
    if (nextView === 'ch2' && !firstDriveComplete(player)) return
    if (nextView === 'ch3' && !secondDriveComplete(player)) return
    setView(nextView)
  }

  async function finishDrive(result, destination) {
    if (result === 'win' && player) {
      const chapters = [...new Set([...(player.chapters_unlocked || [1]), destination])]
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
    ch3: <Ch3ChapterPage />,
    farming: <FarmingAreas onReturn={() => setView('menu')} />,
    inventory: <InventoryScreen />,
    'inventory-demo': <InventoryDemoPage />,
    'combat-demo': <CombatDemoPage />,
    'judges-preview': <JudgesPreviewPage onReturn={() => setView('menu')} />,
    drive: <VehicleCanvas destination={2} onComplete={result => finishDrive(result, 2)} />,
    drive3: <VehicleCanvas destination={3} onComplete={result => finishDrive(result, 3)} />,
  }

  const archivedSections = {
    trader: ['Trader', 'The original trading and merchant interface has not yet been migrated. No gold or inventory will be spent here.'],
    lobby: ['Lobby', 'Multiplayer lobby and player interactions still need their React and Supabase integration.'],
    badges: ['Badges', 'Your current reputation and standing are shown on the right. The original badges gallery is awaiting migration.'],
  }

  if (view === 'skills') return <SkillsScreen onReturn={() => setView('menu')} />
  if (view === 'resonance-weaver-adventure') return <BookShell eyebrow="Profession · Resonance Weaver" title="The Shattered Harmony" subtitle="Restore an unstable resonance." left={<ResonanceWeaverAdventure player={player} onReturn={()=>setView('professions')}/>} right={<PlayerRecord player={player} onNavigate={navigate}/>}/>
  if (view === 'engineer-adventure') return <BookShell eyebrow="Profession · Engineer" title="Rise of the Machines" subtitle="Build, repair, and face your creation." left={<EngineerAdventure player={player} onReturn={()=>setView('professions')}/>} right={<PlayerRecord player={player} onNavigate={navigate}/>}/>
  if (view === 'pathfinder-adventure') return <BookShell eyebrow="Profession · Pathfinder" title="The Forgotten World" subtitle="Discover what the System left behind." left={<PathfinderAdventure player={player} onReturn={()=>setView('professions')}/>} right={<PlayerRecord player={player} onNavigate={navigate}/>}/>
  if (view === 'hunter-adventure') return <BookShell eyebrow="Profession · Hunter" title="The Apex Hunt" subtitle="Track the creature before it tracks you." left={<HunterAdventure player={player} onReturn={()=>setView('professions')}/>} right={<PlayerRecord player={player} onNavigate={navigate}/>}/>
  if (view === 'alchemist-adventure') return <BookShell eyebrow="Profession · Alchemist" title="The Forbidden Formula" subtitle="A laboratory where one mistake changes everything." left={<AlchemistAdventure player={player} onReturn={()=>setView('professions')}/>} right={<PlayerRecord player={player} onNavigate={navigate}/>}/>
  if (view === 'merchant-adventure') return <BookShell eyebrow="Profession · Merchant" title="The Golden Exchange" subtitle="Trade, negotiation, and survival." left={<MerchantAdventure player={player} onReturn={()=>setView('professions')}/>} right={<PlayerRecord player={player} onNavigate={navigate}/>}/>
  if (view === 'miner-adventure') return <BookShell eyebrow="Profession · Miner" title="Beneath the Broken Earth" subtitle="The first mining expedition." left={<MinerAdventure player={player} onReturn={()=>setView('professions')}/>} right={<PlayerRecord player={player} onNavigate={navigate}/>}/>
  if (view === 'forger-adventure') return <BookShell eyebrow="Profession · Forger" title="The Trial of Steel" subtitle="The first of eight profession adventures." left={<ForgerAdventure player={player} onReturn={()=>setView('professions')}/>} right={<PlayerRecord player={player} onNavigate={navigate}/>}/>
  if (view === 'profession-halls') return <BookShell eyebrow="The District · Guilds & Crafts" title="Profession District" subtitle="Trade halls, workshops, and resident specialists." left={<ProfessionHalls player={player} onReturn={()=>setView('professions')} onNavigate={navigate}/>} right={<PlayerRecord player={player} onNavigate={navigate}/>}/>
  if (view === 'professions') return <BookShell eyebrow="Chapter III · Trade & craft" title="Professions" subtitle="Choose your craft after completing Chapter II."
    left={<ProfessionScreen player={player} onReturn={()=>setView('menu')} onHalls={()=>setView('profession-halls')} onAdventure={()=>setView('forger-adventure')} onMinerAdventure={()=>setView('miner-adventure')} onMerchantAdventure={()=>setView('merchant-adventure')} onAlchemistAdventure={()=>setView('alchemist-adventure')} onHunterAdventure={()=>setView('hunter-adventure')} onPathfinderAdventure={()=>setView('pathfinder-adventure')} onEngineerAdventure={()=>setView('engineer-adventure')} onResonanceWeaverAdventure={()=>setView('resonance-weaver-adventure')}/>} right={<PlayerRecord player={player} onNavigate={navigate}/>}/>

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

  if (view === 'farming') return <BookShell
    eyebrow="Chapter I · System hunting grounds"
    title="Farming Areas"
    subtitle="The district is alive with strange entities. Choose your next encounter."
    left={screens[view]}
    right={<PlayerRecord player={player} onNavigate={navigate} />}
  />

  const isChapter = view === 'ch1' || view === 'ch2' || view === 'ch3'
  if (isChapter) {
    return <BookShell
      eyebrow={`The story · ${view === 'ch1' ? 'Chapter I' : view === 'ch2' ? 'Chapter II' : 'Chapter III'}`}
      title={view === 'ch1' ? 'Awakening' : view === 'ch2' ? 'Broken Alliances' : 'Signal Hunters'}
      subtitle="Read, choose, and shape the world. Your journey is being recorded."
      left={screens[view]}
      right={<PlayerRecord player={player} onNavigate={navigate} />}
      footer={`${view === 'ch1' ? 'I' : view === 'ch2' ? 'II' : 'III'} · SuperSede · Living Archive`} />
  }

  return (
    <>
      <div className="back-bar"><button onClick={() => setView('menu')}>← Menu</button></div>
      <div style={{ padding: ['drive','drive3'].includes(view) ? 0 : '3rem 1rem 2rem', maxWidth: ['drive','drive3'].includes(view) ? 'none' : 720, margin: '0 auto' }}>
        {screens[view]}
      </div>
    </>
  )
}
