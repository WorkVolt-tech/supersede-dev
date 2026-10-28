import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Ch2ChapterPage from './pages/Ch2ChapterPage'
import './App.css'

// Points at Ch2 now, since that's what's freshly wired. Swap the import
// to try ChapterPage (Ch1), PuzzleDemoPage, InventoryDemoPage, or
// CombatDemoPage instead — all still present and working.
export default function App() {
  const [userId, setUserId] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data?.session?.user?.id || null))
  }, [])
  if (!userId) return <p className="story-text">Not signed in — Ch2 needs a real Supabase player to load.</p>
  return <Ch2ChapterPage userId={userId} />
}
