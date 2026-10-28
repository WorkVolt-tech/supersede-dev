import { useState, useCallback } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { applyMoralChange } from '../game/reputation'

export function useStoryEngine(NODES, chapterPrefix, initialNodeId = 'opening') {
  const player = usePlayerStore(s => s.player)
  const updatePlayer = usePlayerStore(s => s.updatePlayer)

  const startId = player?.current_node?.startsWith(chapterPrefix + '_')
    ? player.current_node.replace(chapterPrefix + '_', '')
    : initialNodeId

  const [currentNodeId, setCurrentNodeId] = useState(
    NODES[startId] ? startId : initialNodeId
  )

  const currentNode = NODES[currentNodeId] || null

  const goTo = useCallback(async (nextId, choice = {}) => {
    if (!NODES[nextId]) return

    let resolvedId = nextId
    let hops = 0
    while (typeof NODES[resolvedId]?.route === 'function' && hops < 10) {
      resolvedId = NODES[resolvedId].route(player)
      hops++
    }
    if (!NODES[resolvedId]) return

    const cur = NODES[currentNodeId]
    const updates = { current_node: `${chapterPrefix}_${resolvedId}` }

    if (cur?.xp) updates.xp = (player.xp || 0) + cur.xp

    let moralDelta = 0
    if (choice.outcome === 'attack') moralDelta -= 20
    if (choice.moral) moralDelta += choice.moral
    if (moralDelta !== 0) {
      const r = applyMoralChange(player, moralDelta)
      Object.assign(updates, r.updates)
    }

    if (choice.allianceTag || choice.allianceTagRepeatable) {
      const log = player.alliance_log || []
      const tag = choice.allianceTag || choice.allianceTagRepeatable
      if (choice.allianceTagRepeatable || !log.includes(tag)) {
        updates.alliance_log = [...log, tag]
      }
    }

    await updatePlayer(updates)
    setCurrentNodeId(resolvedId)
  }, [NODES, chapterPrefix, currentNodeId, player, updatePlayer])

  return { currentNodeId, currentNode, goTo }
}
