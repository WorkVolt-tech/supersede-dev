import BookShell from '../book/BookShell'
import PlayerRecord from '../book/PlayerRecord'
import { TEST_PREVIEW_ENTRIES } from './archiveLinks'

// The Archive has one doorway to the previews. Real Skills and Inventory
// remain in PlayerRecord's main navigation, never in this testing room.
export default function TestsPreviewsPage({player,onPick,onReturn}) {
  return <BookShell
    eyebrow="Archive · Testing room" title="Tests & Previews"
    subtitle="Experiment with sample items, formations and animations without changing story progress."
    left={<>
      <h2>Testing room</h2>
      <p className="story-text">Select a test or preview. These activities are separate from your adventure.</p>
      {TEST_PREVIEW_ENTRIES.map(entry=><button key={entry.view}
        className="reading-chapter" title={entry.sub}
        onClick={()=>onPick(entry.view)}>
        {entry.label}<small>{entry.sub}</small>
      </button>)}
      <button className="reading-action" onClick={onReturn}>← Return to Archive</button>
    </>}
    right={<PlayerRecord player={player} onNavigate={onPick} />}
  />
}
