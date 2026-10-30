import { usePlayerStore } from '../store/usePlayerStore'
import { useStoryEngine } from '../hooks/useStoryEngine'
import StoryNode from '../components/story/StoryNode'
import { NODES } from '../data/ch3/nodes'

export default function Ch3ChapterPage() {
 const player=usePlayerStore(s=>s.player)
 const {currentNode,goTo}=useStoryEngine(NODES,'ch3')
 if(!player)return <p className="story-text">No player loaded.</p>
 return <div className="chapter-page"><StoryNode node={currentNode} player={player} goTo={goTo}/></div>
}
