import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { useStoryEngine } from '../hooks/useStoryEngine'
import StoryNode from '../components/story/StoryNode'
import DistrictHubCh2 from '../components/hub/DistrictHubCh2'
import { NODES as CH2_NODES } from '../data/ch2/nodes'
import { ZONES } from '../data/ch2/config'
import ClassChoice from '../components/story/ClassChoice'
import { canChooseJudgesClass } from '../game/judgesClassRules'

const ZONE_IDS = ZONES.map(z => z.id)

// Player + inventory are loaded once by App.jsx before any page renders.
export default function Ch2ChapterPage() {
  const player = usePlayerStore(s => s.player)
  const updatePlayer = usePlayerStore(s => s.updatePlayer)

  const { currentNodeId, currentNode, goTo } = useStoryEngine(CH2_NODES, 'ch2')

  // Elements-attempted tracking — feeds the Twin Judges AI's
  // elementsAttempted scenario check. Records a zone the first time its
  // root node is entered.
  const trackedRef = useRef(new Set())
  useEffect(() => {
    if (!player || !ZONE_IDS.includes(currentNodeId)) return
    const already = player.ch2_elements_attempted || []
    if (already.includes(currentNodeId) || trackedRef.current.has(currentNodeId)) return
    trackedRef.current.add(currentNodeId)
    updatePlayer({ ch2_elements_attempted: [...already, currentNodeId] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNodeId, player])

  if (!player) return <p className="story-text">No player loaded.</p>

  if (currentNodeId === 'district_hub') {
    return <DistrictHubCh2 player={player} goTo={goTo} />
  }

  // Legacy characters may already be at the Chapter 2 ending from before
  // the class-selection screen was restored. Offer their earned choice here.
  if (currentNodeId === 'chapter_end_ch2' && canChooseJudgesClass(player)) {
    return <ClassChoice player={player} onContinue={() => goTo('chapter_end_ch2')} />
  }

  // judgeCtx — only meaningful for boss_judges; harmless to compute and
  // pass for every node since StoryNode only uses it when node.type is
  // 'boss'.
  const judgeCtx = {
    playerMoral: player.moral_score ?? 0,
    elementsAttempted: (player.ch2_elements_attempted || []).length || 1,
  }

  return (
    <div className="chapter-page">
      <StoryNode node={currentNode} player={player} goTo={goTo} judgeCtx={judgeCtx} />
    </div>
  )
}
