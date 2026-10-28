import '../auth/auth.css'

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
  return (
    <div className="auth-outer">
      <div className="auth-card">
        <p className="auth-sys">SUPERSEDE</p>
        <h1 className="auth-title">Welcome, {player.username}</h1>
        <p className="auth-sub">Level {player.level || 1} · {player.hp ?? 100}/{player.max_hp ?? 100} HP</p>
        <div className="menu-list">
          {ENTRIES.map((e, i) => e.section
            ? <p key={i} className="menu-section">{e.section}</p>
            : <button key={e.view} className="menu-btn" onClick={() => onPick(e.view)}>{e.label}<small>{e.sub}</small></button>
          )}
        </div>
        <button className="auth-switch menu-signout" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  )
}
