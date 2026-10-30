import { usePlayerStore } from '../store/usePlayerStore'
import { useStoryEngine } from '../hooks/useStoryEngine'
import StoryNode from '../components/story/StoryNode'
import { NODES as CH1_NODES } from '../data/ch1/nodes'

// Player + inventory are loaded once by App.jsx before any page renders.
export default function ChapterPage() {
  const player = usePlayerStore(s => s.player)
  const { currentNode, goTo } = useStoryEngine(CH1_NODES, 'ch1')
  if (!player) return <p className="story-text">No player loaded.</p>

  // The original Chapter 1 renderer created these hub choices dynamically.
  // React's StoryNode only renders the choices on the node, so the saved
  // district_hub placeholder (choices: []) otherwise strands the player.
  const guardians = [
    { key: 'sentinel', label: 'Head to the Parking Garage', sub: 'Face the Sentinel of the First Eye', next: 'garage_approach' },
    { key: 'surveyor', label: 'Head to the Frozen Market', sub: 'Face The Surveyor', next: 'market_approach' },
    { key: 'unseen', label: 'Head to the Glass Tower', sub: 'Face The Unseen', next: 'tower_approach' },
  ]
  const defeated = new Set(Array.isArray(player.defeated_bosses) ? player.defeated_bosses : [])
  const remaining = guardians.filter(guardian => !defeated.has(guardian.key))
  const displayNode = currentNode?.id === 'district_hub'
    ? {
        ...currentNode,
        text: `${currentNode.text}\n\nZONE GUARDIANS DEFEATED: ${guardians.length - remaining.length}/${guardians.length}.`,
        choices: remaining.length
          ? remaining.map(({ key, ...choice }) => choice)
          : [{ label: 'The barrier is down — gather at the plaza', sub: 'The Watcher awaits', next: 'plaza_allies' }],
      }
    : currentNode

  return (
    <div className="chapter-page">
      <StoryNode node={displayNode} player={player} goTo={goTo} />
    </div>
  )
}
