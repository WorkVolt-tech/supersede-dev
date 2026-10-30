import '../auth/auth.css'
import BookShell from '../book/BookShell'
import PlayerRecord from '../book/PlayerRecord'
import { chapterOneComplete, firstDriveComplete, chapterTwoComplete, secondDriveComplete } from '../../game/progression'

// Edit this list to add/remove/rename menu entries — one line each.
const ENTRIES = [
  { section: 'Story' },
  { view: 'ch1', label: 'Chapter 1', sub: 'Awakening' },
  { view: 'ch2', label: 'Chapter 2', sub: 'Broken Alliances — zones, alliances, Twin Judges' },
  { view: 'ch3', label: 'Chapter 3', sub: 'Signal Hunters — the System is listening' },
  { section: 'Systems' },
  { view: 'skills', label: 'Skills & Classes', sub: 'Skill trees, elemental paths, class progression and battle skills' },
  { view: 'inventory', label: 'Inventory', sub: 'Your real items — drag to equip' },
  { section: 'Demos' },
  { view: 'inventory-demo', label: 'Inventory (sample items)', sub: 'Try drag-and-drop with fake gear' },
  { view: 'combat-demo', label: 'Combat Formation Test', sub: 'Optional rank-and-position training simulation; no story characters' },
  { view: 'judges-preview', label: 'Twin Judges Animation Preview', sub: 'View all seven forms and replay attacks and transformations without affecting progress' },
]

export default function StartMenu({ player, onPick, onSignOut, onReset }) {
  const chapters = ENTRIES.filter(e => ['ch1','ch2','ch3'].includes(e.view))
  const systems = ENTRIES.filter(e => e.view && !['ch1','ch2','ch3'].includes(e.view))
  return (
    <BookShell eyebrow="Table of contents" title="The Archive" subtitle="Select a chapter. Your choices and inventory travel with you."
      left={<>
        <h2>Where shall the story take you?</h2>
        {chapters.map(e => {
          if (e.view === 'ch1') return <button className="reading-chapter" key={e.view} onClick={() => onPick(e.view)}>{e.label}<small>{e.sub}</small></button>
          const isCh3 = e.view === 'ch3'
          const driveLocked = isCh3 ? !chapterTwoComplete(player) : !chapterOneComplete(player)
          const chapterLocked = isCh3 ? !secondDriveComplete(player) : !firstDriveComplete(player)
          return <div className="reading-chapter-row" key={e.view}>
            <div className="reading-chapter-details"><span>{e.label}</span><small>{e.sub}</small><small className="reading-chapter-hint">{driveLocked ? `Complete Chapter ${isCh3 ? 2 : 1} to unlock the drive` : chapterLocked ? `Complete the drive to unlock Chapter ${isCh3 ? 3 : 2}` : isCh3 ? 'Chapter 3 is ready' : 'Chapter 2 is ready'}</small></div>
            <div className="reading-chapter-actions">
              <button disabled={driveLocked} onClick={() => onPick(isCh3 ? 'drive3' : 'drive')}>{driveLocked ? '🔒 ' : ''}Drive ›</button>
              <button disabled={chapterLocked} onClick={() => onPick(e.view)}>{chapterLocked ? '🔒 ' : ''}Chapter ›</button>
            </div>
          </div>
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
