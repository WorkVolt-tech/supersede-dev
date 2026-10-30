import '../auth/auth.css'
import BookShell from '../book/BookShell'
import PlayerRecord from '../book/PlayerRecord'
import { chapterOneComplete, firstDriveComplete, chapterTwoComplete, secondDriveComplete } from '../../game/progression'

const CHAPTERS = [
  { view: 'ch1', label: 'Chapter 1', sub: 'Awakening' },
  { view: 'ch2', label: 'Chapter 2', sub: 'Broken Alliances — zones, alliances, Twin Judges' },
  { view: 'ch3', label: 'Chapter 3', sub: 'Signal Hunters — the System is listening' },
]

export default function StartMenu({ player, onPick, onSignOut, onReset }) {
  const chapters = CHAPTERS
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
        <button className="reading-action" onClick={() => onPick('tests-previews')}>Tests &amp; Previews</button>
        <button className="reading-action" onClick={onSignOut}>Sign out</button>
        <button className="reading-action" onClick={onReset}>Reset my character</button>
      </>}
      footer="The archive remembers · SuperSede" />
  )
}
