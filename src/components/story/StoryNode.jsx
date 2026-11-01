import { useState } from 'react'
// StoryNode.jsx
// ─────────────────────────────────────────────────────────────────────────
// Now dispatches on node.type, same as the vanilla engines' render()
// function — 'combat'/'boss' go to CombatScreen, everything else is
// choices. judgeCtx is optional and only meaningful for nodes whose
// enemy has bespoke AI (the Twin Judges); harmless to pass undefined
// for every other fight.
import ChoiceList from './ChoiceList'
import CombatScreen from '../combat/CombatScreen'
import GroupCombatScreen from '../combat/GroupCombatScreen'
import ClassChoice from './ClassChoice'
import { activeCompanions, partyAwareText, SOLO_SCENES } from '../../game/storyParty'

export default function StoryNode({ node, player, goTo, judgeCtx, onChapterEndingComplete }) {
  const [endingBeat,setEndingBeat]=useState(0)
  if (!node) return <p className="story-text">Error: node not found.</p>
  const companions=activeCompanions(player)
  const narration=partyAwareText(node.text,player)

  if (node.type === 'class_choice') {
    return <ClassChoice player={player} onContinue={() => goTo(node.onContinue)} />
  }

  if (node.type === 'combat' || node.type === 'boss') {
    // Group encounters are opt-in. Bosses and legacy singles retain their
    // existing, bespoke combat engine and script behavior.
    const Screen = node.type === 'combat' && Number(node.enemy?.groupSize) >= 2
      ? GroupCombatScreen : CombatScreen
    return (
      <div className="story-encounter">
      {narration && <p className="story-text">{narration}</p>}
      <Screen
        key={node.id}
        enemyData={node.enemy}
        solo={SOLO_SCENES.has(node.id)}
        isBoss={node.type === 'boss' || Boolean(node.bossKey)}
        judgeCtx={node.type === 'boss' ? judgeCtx : undefined}
        onWin={() => goTo(node.onWin)}
        onLose={() => goTo(node.onLose)}
        onEscape={node.onEscape ? () => goTo(node.onEscape) : null}
      />
      </div>
    )
  }

  if (node.type === 'end') {
    // Restored from the original Chapter I renderEnd / GARAGE_BEATS sequence.
    // The First Drive stays locked behind these story beats, not the Watcher fight.
    if(node.id==='chapter_end'){
      const beats=[
        {
          title:'The Eyes Scatter',
          text:`The Watcher shatters. Not with violence — with silence. The eye closes. The crack in the sky seals itself with threads of pale light.

The moment its eye closes for the last time, you feel something across the city before you see it. A signal cuts out. Then the sky cracks open in twenty places at once.

Out of each crack come Eyes — hundreds of them, large and small. The Watcher is gone, but its fragments remain.

They disperse into the roads, tunnels, and every route out of the city.

Your interface flashes:

WATCHER FRAGMENTS DETECTED ON ALL OUTBOUND ROUTES.
TRAVEL ON FOOT: NOT RECOMMENDED.`
        },
        {
          title:'The Garage',
          text:`Yara finds you before you finish reading the warning.

"I know what you're looking at," she says. "Come on."

She leads you north from the plaza, past the fountain and through a maintenance corridor to a heavy industrial door.

Inside are three modified vehicles: a motorcycle, a car, and a van. Each carries armor plating and unfamiliar components.

"The System flagged these as abandoned assets when the city froze," Yara explains. "The city has decided."

Your interface rewrites the ownership records. The vehicles are yours.`
        },
        {
          title:'The Road Ahead',
          text:`"The Eyes are thickest on the roads between here and Chapter 2," Yara says, resting a hand on the van. "But without the Watcher, they aren't organized anymore."

She gives you three keys.

"Pick your vehicle. Upgrade it with whatever you've got. The scrap metal, flashlights, and parts you've collected are exactly what these machines need."

Your interface displays three vehicle profiles. The garage is yours.

Beyond the city, Chapter II waits. First, you have to survive the drive.`
        },
      ]
      const beat=beats[Math.min(endingBeat,beats.length-1)]
      return <div className="story-node">
        <p className="choices-label">— Chapter I Complete —</p>
        <h3>{beat.title}</h3>
        <p className="story-text" style={{whiteSpace:'pre-line'}}>{beat.text}</p>
        {endingBeat<beats.length-1
          ?<button type="button" className="reading-action" onClick={()=>setEndingBeat(index=>index+1)}>Continue ›</button>
          :<button type="button" className="reading-action" onClick={()=>onChapterEndingComplete?.()}>Enter Garage ›</button>}
      </div>
    }
    return (
      <div className="story-node">
        <p className="story-text">{node.text || 'The Twin Judges have fallen. Chapter II is complete. The road to Chapter III is now open.'}</p>
        <p className="choices-label">— Chapter Complete —</p>
      </div>
    )
  }

  return (
    <div className="story-node">
      {companions.length>0&&<p className="story-party-presence">Party: {companions.map(member=>member.name).join(' · ')}</p>}
      <p className="story-text">{narration}</p>
      <ChoiceList node={node} player={player} goTo={goTo} />
    </div>
  )
}
