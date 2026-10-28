import '../auth/auth.css'
import BookShell from '../book/BookShell'
import PlayerRecord from '../book/PlayerRecord'
import { chapterOneComplete, firstDriveComplete } from '../../game/progression'

// Edit this list to add/remove/rename menu entries — one line each.
const ENTRIES = [
  { section: 'Story' },
  { view: 'ch1', label: 'Chapter 1', sub: 'Awakening' },
  { view: 'ch2', label: 'Chapter 2', sub: 'Broken Alliances — zones, alliances, Twin Judges' },
  { view: 'drive', label: 'First Drive', sub: 'Escape the Hunters · Defeat the Captain' },
  { section: 'Systems' },
  { view: 'inventory', label: 'Inventory', sub: 'Your real items — drag to equip' },
  { section: 'Demos' },
  { view: 'puzzle', label: 'Drag Puzzle', sub: 'Ch3 keypad cipher' },
  { view: 'inventory-demo', label: 'Inventory (sample items)', sub: 'Try drag-and-drop with fake gear' },
  { view: 'combat-demo', label: 'Ranked Combat', sub: 'Darkest Dungeon style' },
]

export default function StartMenu({ player, onPick, onSignOut, onReset }) {
  const chapters = ENTRIES.filter(e => ['ch1','drive','ch2'].includes(e.view))
  const systems = ENTRIES.filter(e => e.view && !['ch1','drive','ch2'].includes(e.view))
  return (
    <BookShell eyebrow="Table of contents" title="The Archive" subtitle="Select a chapter. Your choices and inventory travel with you."
      left={<>
        <h2>Where shall the story take you?</h2>
        {chapters.map(e => {
          const locked = (e.view === 'drive' && !chapterOneComplete(player)) || (e.view === 'ch2' && !firstDriveComplete(player))
          return <button className="reading-chapter" key={e.view} disabled={locked} onClick={() => onPick(e.view)}>{locked ? '🔒 ' : ''}{e.label}<small>{locked ? (e.view === 'drive' ? 'Complete Chapter I to unlock' : 'Complete the First Drive to unlock') : e.sub}</small></button>
        })}
        <p className="reading-quote">Every choice leaves an imprint. Every encounter writes the next page.</p>
      </>}
      right={<>
        <PlayerRecord player={player} onNavigate={onPick} />
        <span className="reading-page-heading" style={{ marginTop: 28 }}>Additional activities</span>
        {systems.map(e => <button className="reading-action" key={e.view} title={e.sub} onClick={() => onPick(e.view)}>{e.label}</button>)}
        <button className="reading-action" onClick={onSignOut}>Sign out</button>
        <button className="reading-action" onClick={onReset}>Reset my character</button>
      </>}
      footer="The archive remembers · SuperSede" />
  )
}
