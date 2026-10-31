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

export default function StoryNode({ node, player, goTo, judgeCtx }) {
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
    return (
      <div className="story-node">
        <p className="story-text">{node.text || (node.id === 'chapter_end_ch2' ? 'The Twin Judges have fallen. Chapter II is complete. The road to Chapter III is now open.' : 'The Watcher has fallen. Chapter I is complete. Your next challenge awaits on the road: survive the first drive to unlock Chapter II.')}</p>
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
