import { useState, useCallback } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { applyMoralChange } from '../game/reputation'
import { grantXp } from '../game/progression'
import { grantLoot } from '../game/loot'
import { useInventoryStore } from '../store/useInventoryStore'

export function useStoryEngine(NODES, chapterPrefix, initialNodeId = 'opening') {
  const player = usePlayerStore(s => s.player)
  const updatePlayer = usePlayerStore(s => s.updatePlayer)
  const loadInventory = useInventoryStore(s => s.loadInventory)

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

    if (NODES[resolvedId]?.type === 'end' && Array.isArray(player.chapters_completed)) {
      const chapterNumber = chapterPrefix === 'ch1' ? 1 : chapterPrefix === 'ch2' ? 2 : null
      if (chapterNumber) updates.chapters_completed = [...new Set([...player.chapters_completed, chapterNumber])]
    }

    if (cur?.xp) Object.assign(updates, grantXp(player, cur.xp))

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

    if (cur?.rewards?.length) {
      try {
        await grantLoot(player.id, cur.rewards)
        await loadInventory(player.id)
      } catch (error) {
        console.error('Could not grant story rewards:', error)
        return
      }
    }
    await updatePlayer(updates)
    setCurrentNodeId(resolvedId)
  }, [NODES, chapterPrefix, currentNodeId, player, updatePlayer, loadInventory])

  return { currentNodeId, currentNode, goTo }
}
