import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { useStoryEngine } from '../hooks/useStoryEngine'
import StoryNode from '../components/story/StoryNode'
import DistrictHubCh2 from '../components/hub/DistrictHubCh2'
import { NODES as CH2_NODES } from '../data/ch2/nodes'
import { ZONES, ZONE_ELEMENT_MAP, ELEMENT_NAMES } from '../data/ch2/config'
import { getChapterResonance, getElementalDifficulty, getZoneElement, scaleCh2ZoneEnemy } from '../data/ch2/elementalDifficulty'
import ClassChoice from '../components/story/ClassChoice'
import { randomizeFarmingWaves } from '../data/ch2/zones/zone-farming'
import { canChooseJudgesClass, getJudgesForm } from '../game/judgesClassRules'

const ZONE_IDS = ZONES.map(z => z.id)

// These two story nodes were dynamic in the original renderer. Their
// readouts use the current saved record and do not affect Judges AI.
function buildCampReflection(player) {
  const moral = Number(player.moral_score) || 0
  const zones = ZONES.filter(z => (player.ch2_elements_attempted || []).includes(z.id))
  const guardians = (player.defeated_bosses || []).filter(id => id.startsWith('zone_boss_')).length
  const decision = moral >= 40 ? 'Your record leans toward mercy.'
    : moral <= -40 ? 'Your record leans toward wrath.'
    : 'Your decisions resist a simple judgment.'
  return `Night settles over the shopping district. In the quiet before the Judges, your interface opens your record.

MORAL SCORE: ${moral}
ELEMENTAL ZONES ENTERED: ${zones.length} / ${ZONES.length}
ZONE GUARDIANS DEFEATED: ${guardians}

${decision}

Your record is already written. The Twin Judges will read it when you stand before them. The night passes.`
}

function buildJudgesVerdict(player) {
  const moral = Number(player.moral_score) || 0
  const zones = ZONES.filter(z => (player.ch2_elements_attempted || []).includes(z.id))
  const guardians = (player.defeated_bosses || []).filter(id => id.startsWith('zone_boss_')).length
  const form = getJudgesForm(player).replaceAll('_', ' ').toUpperCase()
  const alliances = (player.alliance_log || []).filter(tag => !tag.startsWith('class_form_'))
  return `Two enormous interfaces open between Judge Mercy and Judge Wrath. They read the record of your choices.

MORAL SCORE: ${moral}
ALLIANCE ENTRIES: ${alliances.length}
ELEMENTAL ZONES ENTERED: ${zones.length} / ${ZONES.length}
ZONE GUARDIANS DEFEATED: ${guardians}
ELEMENTS VISITED: ${zones.length ? zones.map(z => z.element).join(', ') : 'None recorded'}

ASSESSMENT FORM: ${form}

The records fold away. Both Judges turn toward you. The reading is complete; the trial begins.`
}

// Player + inventory are loaded once by App.jsx before any page renders.
export default function Ch2ChapterPage() {
  const player = usePlayerStore(s => s.player)
  const updatePlayer = usePlayerStore(s => s.updatePlayer)
  const [pendingZone, setPendingZone] = useState(null)

  const { currentNodeId, currentNode, goTo } = useStoryEngine(CH2_NODES, 'ch2')

  // Elements-attempted tracking — feeds the Twin Judges AI's
  // elementsAttempted scenario check. Records a zone the first time its
  // root node is entered.
  const trackedRef = useRef(new Set())
  const farmingRun = useRef(false)
  useEffect(() => {
    if (currentNodeId === 'farming_grounds_hub') farmingRun.current = false
    if (currentNodeId === 'farming_wave_1' && !farmingRun.current) {
      randomizeFarmingWaves()
      farmingRun.current = true
    }
  }, [currentNodeId])
  useEffect(() => {
    if (!player || !ZONE_IDS.includes(currentNodeId)) return
    const already = player.ch2_elements_attempted || []
    if (already.includes(currentNodeId) || trackedRef.current.has(currentNodeId)) return
    // This is only a recovery path for older saves whose current zone was
    // stored before visits were recorded atomically by useStoryEngine.
    trackedRef.current.add(currentNodeId)
    void updatePlayer({ ch2_elements_attempted: [...new Set([...already, currentNodeId])] })
      .then(saved => {
        if (!saved) trackedRef.current.delete(currentNodeId)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNodeId, player])

  if (!player) return <p className="story-text">No player loaded.</p>

  // The original Chapter 2 asks before entering a zone that differs from
  // the resonance established by the first elemental guardian victory.
  // This does not navigate or modify the player's record until confirmed.
  function goToWithDeviationWarning(nextId, choice = {}) {
    const element = ZONE_ELEMENT_MAP[nextId]
    const resonance = getChapterResonance(player)
    if (element && resonance && element !== resonance) {
      const attempted = [...new Set([...(player.ch2_elements_attempted || []), nextId])]
      const multiplier = getElementalDifficulty({ ...player, ch2_elements_attempted: attempted })
      setPendingZone({ nextId, choice, element, resonance, multiplier })
      return
    }
    return goTo(nextId, choice)
  }

  const warningDialog = pendingZone && (
    <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      background: 'rgba(0,0,0,.85)' }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="ch2-deviation-title"
        aria-describedby="ch2-deviation-description"
        style={{ maxWidth: 460, width: '100%', padding: 24, borderRadius: 8,
          border: '1px solid #f4c45a70', background: '#12111a', color: '#e8e3d6' }}>
        <h2 id="ch2-deviation-title" style={{ color: '#f4c45a' }}>Deviation detected</h2>
        <p id="ch2-deviation-description" className="story-text">
          Your chapter resonance is {ELEMENT_NAMES[pendingZone.resonance] || pendingZone.resonance}.
          Entering {ELEMENT_NAMES[pendingZone.element] || pendingZone.element} will raise
          enemy HP, ATK, DEF and speed to ×{pendingZone.multiplier} based on the distinct
          elements you've attempted. XP rewards remain unchanged.
        </p>
        <p className="story-text">The Twin Judges will remember your choice. Continue?</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <button type="button" className="reading-action"
            onClick={() => {
              const next = pendingZone
              setPendingZone(null)
              void goTo(next.nextId, next.choice)
            }}>Enter anyway</button>
          <button type="button" className="reading-action"
            onClick={() => setPendingZone(null)}>Turn back</button>
        </div>
      </div>
    </div>
  )

  if (currentNodeId === 'district_hub') {
    return <>
      <DistrictHubCh2 player={player} goTo={goToWithDeviationWarning} text={currentNode?.text} />
      {warningDialog}
    </>
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

  let displayNode = currentNodeId === 'camp_reflection'
    ? { ...currentNode, text: buildCampReflection(player) }
    : currentNodeId === 'judges_verdict'
      ? { ...currentNode, text: buildJudgesVerdict(player) }
      : currentNode

  // Scale a new combat copy, never the shared canonical zone encounter.
  // Farming grounds, faction fights and the Twin Judges are not zone fights.
  if (displayNode?.enemy && getZoneElement(currentNodeId) &&
      (displayNode.type === 'combat' || displayNode.type === 'boss')) {
    displayNode = {
      ...displayNode,
      enemy: scaleCh2ZoneEnemy(displayNode.enemy, player, currentNodeId, displayNode.bossKey),
    }
  }

  return (
    <div className="chapter-page">
      <StoryNode node={displayNode} player={player} goTo={goToWithDeviationWarning} judgeCtx={judgeCtx} />
      {warningDialog}
    </div>
  )
}
