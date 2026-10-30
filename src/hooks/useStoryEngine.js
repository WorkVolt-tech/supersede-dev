import { useState, useCallback } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { applyMoralChange } from '../game/reputation'
import { grantXp } from '../game/progression'
import { grantLoot } from '../game/loot'
import { useInventoryStore } from '../store/useInventoryStore'
import { getJudgesForm } from '../game/judgesClassRules'

export function useStoryEngine(NODES, chapterPrefix, initialNodeId = 'opening') {
  const player = usePlayerStore(s => s.player)
  const updatePlayer = usePlayerStore(s => s.updatePlayer)
  const loadInventory = useInventoryStore(s => s.loadInventory)

  // Only one current_node is stored for the active chapter. When revisiting
  // an earlier completed chapter, show its ending rather than silently
  // restarting it (and potentially re-claiming story rewards).
  const chapterNumber = { ch1: 1, ch2: 2, ch3: 3 }[chapterPrefix]
  const completedEndId = { ch1: 'chapter_end', ch2: 'chapter_end_ch2', ch3: 'chapter_end_ch3' }[chapterPrefix]
  const completed = (player?.chapters_completed || []).includes(chapterNumber) ||
    (chapterNumber && chapterNumber < 3 && (player?.chapters_unlocked || []).includes(chapterNumber + 1))
  const savedNode = player?.current_node?.startsWith(chapterPrefix + '_')
    ? player.current_node.slice(chapterPrefix.length + 1)
    : null
  const startId = savedNode && NODES[savedNode]
    ? savedNode
    : completed && NODES[completedEndId] ? completedEndId : initialNodeId

  const [currentNodeId, setCurrentNodeId] = useState(startId)

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

    if (NODES[resolvedId]?.type === 'end' && chapterNumber) {
      updates.chapters_completed = [...new Set([...(player.chapters_completed || []), chapterNumber])]
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

    // Record boss victories only on the win route, never on defeat/escape.
    if (cur?.bossKey && nextId === cur.onWin) {
      const defeated = [...new Set([...(player.defeated_bosses || []), cur.bossKey])]
      if (cur.bossKey === 'twin_judges') {
        const form = getJudgesForm(player)
        const rewardTag = 'judges_sp_' + form
        if (!defeated.includes(rewardTag)) {
          defeated.push(rewardTag)
          updates.skill_points = (player.skill_points || 0) + 1
          updates.sp_claimed = (player.sp_claimed || 0) + 1
        }
        const log = (updates.alliance_log || player.alliance_log || []).filter(tag => !tag.startsWith('class_form_'))
        updates.alliance_log = [...new Set([...log, 'class_picker_unlocked', 'class_form_' + form])]
      }
      updates.defeated_bosses = defeated
    }

    // Chapter 3 exploration caches are one-time finds. Other chapters retain
    // their existing reward behavior while their own progression is audited.
    const rewardTag = chapterPrefix === 'ch3' ? 'ch3_reward_' + currentNodeId : null
    const alreadyClaimed = rewardTag && (player.alliance_log || []).includes(rewardTag)
    if (cur?.rewards?.length && !alreadyClaimed) {
      try {
        await grantLoot(player.id, cur.rewards)
        await loadInventory(player.id)
        if (rewardTag) updates.alliance_log = [...new Set([...(updates.alliance_log || player.alliance_log || []), rewardTag])]
      } catch (error) {
        console.error('Could not grant story rewards:', error)
        return
      }
    }
    // A failed database write must not advance the visible story while
    // current_node still points to the previous page on the server.
    const saved = await updatePlayer(updates)
    if (!saved) return
    setCurrentNodeId(resolvedId)
  }, [NODES, chapterPrefix, chapterNumber, currentNodeId, player, updatePlayer, loadInventory])

  return { currentNodeId, currentNode, goTo }
}
