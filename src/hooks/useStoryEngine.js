import { useState, useCallback } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { applyMoralChange } from '../game/reputation'
import { grantXp } from '../game/progression'
import { grantLoot } from '../game/loot'
import { useInventoryStore } from '../store/useInventoryStore'
import { getJudgesForm } from '../game/judgesClassRules'
import { ZONE_ELEMENT_MAP } from '../data/ch2/config'
import { resolveCh2HubInterrupt } from '../data/ch2/hubInterrupts'
import { getChapterResonance } from '../data/ch2/elementalDifficulty'
import { getActiveElement } from '../game/activeElement'

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
    // Legacy Watcher Eye returns used a synthetic target that is not a node.
    // Resolve it before validating, so no Chapter 1 choice is a dead end.
    if (chapterPrefix === 'ch1' && nextId === '__eye_return__') nextId = 'street_midpoint'
    if (!NODES[nextId]) return { ok:false, error:`Story destination not found: ${nextId}` }

    let resolvedId = nextId
    let hops = 0
    while (typeof NODES[resolvedId]?.route === 'function' && hops < 10) {
      resolvedId = NODES[resolvedId].route(player)
      hops++
    }
    // Resolve one-time Chapter 2 faction encounters when returning to the
    // plaza. Include the choice's pending tags: an event's exit choice must
    // count as complete before the next hub interruption is selected.
    if (chapterPrefix === 'ch2') {
      resolvedId = resolveCh2HubInterrupt(player, resolvedId, [
        choice.allianceTag, choice.allianceTagRepeatable,
      ])
    }
    if (!NODES[resolvedId]) return { ok:false, error:`Story route not found: ${resolvedId}` }

    const cur = NODES[currentNodeId]
    const updates = { current_node: `${chapterPrefix}_${resolvedId}` }
    // On entering a Chapter 2 elemental-zone root, commit the visit marker
    // with the checkpoint. Separate writes can lose a zone's visit even after
    // the player has left it, changing the Judges' scenario on reload.
    if (chapterPrefix === 'ch2' && Object.hasOwn(ZONE_ELEMENT_MAP, resolvedId)) {
      updates.ch2_elements_attempted = [...new Set([
        ...(player.ch2_elements_attempted || []), resolvedId,
      ])]
    }

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

    if (choice.allianceTag || choice.allianceTagRepeatable ||
        (chapterPrefix === 'ch2' && resolvedId === 'sweep_arrival')) {
      const log = [...(player.alliance_log || [])]
      // Some choices grant both a once-only story flag and repeatable
      // cooperation credit. Preserve both and do not suppress repeats.
      if (choice.allianceTag && !log.includes(choice.allianceTag)) {
        log.push(choice.allianceTag)
      }
      if (choice.allianceTagRepeatable) {
        log.push(choice.allianceTagRepeatable)
      }
      // In the original Chapter 2 engine, the Sweep sets this marker at
      // encounter entry, even if the player later loses or leaves.
      if (chapterPrefix === 'ch2' && resolvedId === 'sweep_arrival' && !log.includes('sweep_fired')) {
        log.push('sweep_fired')
      }
      updates.alliance_log = log
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
      // First elemental guardian victory locks in Chapter 2 resonance.
      // Save the marker in the same confirmed checkpoint as the boss win.
      if (chapterPrefix === 'ch2' &&
          cur.bossKey.startsWith('zone_boss_') &&
          !getChapterResonance(player)) {
        const element = cur.bossKey.slice('zone_boss_'.length)
        if (Object.values(ZONE_ELEMENT_MAP).includes(element)) {
          defeated.push('element_resonance_' + element)
          // The first guardian also activates the matching element, unless
          // this character has a different, previously chosen active tree.
          if (!getActiveElement(player)) updates.element = element
        }
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
        return { ok:false, error:`Could not save story reward: ${error?.message || 'unknown error'}` }
      }
    }
    // A failed database write must not advance the visible story while
    // current_node still points to the previous page on the server.
    const saved = await updatePlayer(updates)
    if (!saved) return { ok:false, error:usePlayerStore.getState().error || 'Could not save story progress.' }
    setCurrentNodeId(resolvedId)
    return {ok:true}
  }, [NODES, chapterPrefix, chapterNumber, currentNodeId, player, updatePlayer, loadInventory])

  return { currentNodeId, currentNode, goTo }
}
