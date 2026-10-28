import { usePlayerStore } from '../store/usePlayerStore'
import { useStoryEngine } from '../hooks/useStoryEngine'
import StoryNode from '../components/story/StoryNode'
import { NODES as CH1_NODES } from '../data/ch1/nodes'

// Player + inventory are loaded once by App.jsx before any page renders.
export default function ChapterPage() {
  const player = usePlayerStore(s => s.player)
  const { currentNode, goTo } = useStoryEngine(CH1_NODES, 'ch1')
  if (!player) return <p className="story-text">No player loaded.</p>
  return (
    <div className="chapter-page">
      <StoryNode node={currentNode} player={player} goTo={goTo} />
    </div>
  )
}
