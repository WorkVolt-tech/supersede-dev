import '../auth/auth.css'
import BookShell from '../book/BookShell'

// Edit this list to add/remove/rename menu entries — one line each.
const ENTRIES = [
  { section: 'Story' },
  { view: 'ch1', label: 'Chapter 1', sub: 'Awakening' },
  { view: 'ch2', label: 'Chapter 2', sub: 'Broken Alliances — zones, alliances, Twin Judges' },
  { section: 'Systems' },
  { view: 'inventory', label: 'Inventory', sub: 'Your real items — drag to equip' },
  { view: 'drive', label: 'Drive', sub: 'Vehicle shooter, Hunter Captain boss' },
  { section: 'Demos' },
  { view: 'puzzle', label: 'Drag Puzzle', sub: 'Ch3 keypad cipher' },
  { view: 'inventory-demo', label: 'Inventory (sample items)', sub: 'Try drag-and-drop with fake gear' },
  { view: 'combat-demo', label: 'Ranked Combat', sub: 'Darkest Dungeon style' },
]

export default function StartMenu({ player, onPick, onSignOut }) {
  const chapters = ENTRIES.filter(e => e.view === 'ch1' || e.view === 'ch2')
  const systems = ENTRIES.filter(e => e.view && e.view !== 'ch1' && e.view !== 'ch2')
  return (
    <BookShell eyebrow="Table of contents" title="The Archive" subtitle="Select a chapter. Your choices and inventory travel with you."
      left={<>
        <h2>Where shall the story take you?</h2>
        {chapters.map(e => <button className="reading-chapter" key={e.view} onClick={() => onPick(e.view)}>{e.label}<small>{e.sub}</small></button>)}
        <p className="reading-quote">Every choice leaves an imprint. Every encounter writes the next page.</p>
      </>}
      right={<>
        <span className="reading-page-heading">Adventurer's record</span>
        <h2>{player.username}</h2>
        <div className="reading-stat-grid">
          <div><span className="reading-stat-label">Level</span><span className="reading-stat-value">{player.level || 1}</span></div>
          <div><span className="reading-stat-label">Health</span><span className="reading-stat-value">{player.hp ?? 100} / {player.max_hp ?? 100}</span></div>
        </div>
        <span className="reading-page-heading" style={{ marginTop: 28 }}>Adventurer's tools</span>
        {systems.map(e => <button className="reading-action" key={e.view} title={e.sub} onClick={() => onPick(e.view)}>{e.label}</button>)}
        <button className="reading-action" onClick={onSignOut}>Sign out</button>
      </>}
      footer="The archive remembers · SuperSede" />
  )
}
