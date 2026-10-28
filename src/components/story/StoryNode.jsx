// StoryNode.jsx
// ─────────────────────────────────────────────────────────────────────────
// Now dispatches on node.type, same as the vanilla engines' render()
// function — 'combat'/'boss' go to CombatScreen, everything else is
// choices. judgeCtx is optional and only meaningful for nodes whose
// enemy has bespoke AI (the Twin Judges); harmless to pass undefined
// for every other fight.
import ChoiceList from './ChoiceList'
import CombatScreen from '../combat/CombatScreen'

export default function StoryNode({ node, player, goTo, judgeCtx }) {
  if (!node) return <p className="story-text">Error: node not found.</p>

  if (node.type === 'combat' || node.type === 'boss') {
    return (
      <CombatScreen
        enemyData={node.enemy}
        isBoss={node.type === 'boss'}
        judgeCtx={node.type === 'boss' ? judgeCtx : undefined}
        onWin={() => goTo(node.onWin)}
        onLose={() => goTo(node.onLose)}
        onEscape={node.onEscape ? () => goTo(node.onEscape) : null}
      />
    )
  }

  if (node.type === 'end') {
    return (
      <div className="story-node">
        <p className="story-text">{node.text}</p>
        <p className="choices-label">— Chapter Complete —</p>
      </div>
    )
  }

  return (
    <div className="story-node">
      <p className="story-text">{node.text}</p>
      <ChoiceList node={node} player={player} goTo={goTo} />
    </div>
  )
}
