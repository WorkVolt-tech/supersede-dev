import { useEffect } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { useStoryEngine } from '../hooks/useStoryEngine'
import StoryNode from '../components/story/StoryNode'
import { NODES as CH1_NODES } from '../data/ch1/nodes'

export default function ChapterPage({ userId }) {
  const player = usePlayerStore(s => s.player)
  const loading = usePlayerStore(s => s.loading)
  const error = usePlayerStore(s => s.error)
  const loadPlayer = usePlayerStore(s => s.loadPlayer)

  useEffect(() => { if (userId) loadPlayer(userId) }, [userId, loadPlayer])

  const { currentNode, goTo } = useStoryEngine(CH1_NODES, 'ch1')

  if (loading) return <p className="story-text">Loading…</p>
  if (error) return <p className="story-text">Error: {error}</p>
  if (!player) return <p className="story-text">No player loaded.</p>

  return (
    <div className="chapter-page">
      <StoryNode node={currentNode} player={player} goTo={goTo} />
    </div>
  )
}
