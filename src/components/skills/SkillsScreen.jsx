import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { usePlayerStore } from '../../store/usePlayerStore'
import { SKILL_NODES } from '../../game/skillTreeNodes'
import { ELEMENT_TREES, isElementUnlocked } from '../../game/elementsTree'
import { getActiveElement, activeElementChange } from '../../game/activeElement'
import { getElementalAttackProgress, equipElementalAttack, isElementalAttack, countLearnedElementNodes } from '../../game/elementalAttacks'
import { CLASSES, isClassNodeAvailable, isClassNodeUnlocked, unlockClassNode } from '../../game/classes'
import { BATTLE_SKILLS_REGISTRY, NOTABLE_SKILLS_REGISTRY } from '../../game/skillsRegistry'
import { getSkillLevel, getSkillUpgrade, skillUpgradeCost, MAX_SKILL_LEVEL } from '../../game/skillLeveling'
import { getActiveClassSkills } from '../../game/classCombat'
import { getProgressedTacticalSkillRule } from '../../game/tacticalSkills'
import './SkillsScreen.css'

const BRANCHES = ['offense', 'defense', 'flow', 'arcane', 'decay']
const COLORS = { offense:'#c75c52', defense:'#558d74', flow:'#69a7b5', arcane:'#a77acb', decay:'#9580b8', center:'#c9a66c' }
const STAT_COL = { atk_bonus:'atk', def_bonus:'def', power_bonus:'power', guard_bonus:'guard', control_bonus:'control', speed_bonus:'speed', insight_bonus:'insight', luck_bonus:'luck' }
const REGISTRY = { ...BATTLE_SKILLS_REGISTRY, ...NOTABLE_SKILLS_REGISTRY }

function TreeMap({ nodes, unlocked, available, selected, onSelect, color }) {
  const bounds = useMemo(() => {
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y)
    return { minX:Math.min(...xs)-110, minY:Math.min(...ys)-90, width:Math.max(...xs)-Math.min(...xs)+220, height:Math.max(...ys)-Math.min(...ys)+180 }
  }, [nodes])
  const byId = new Map(nodes.map(n => [n.id, n]))
  const x = n => n.x-bounds.minX
  const y = n => n.y-bounds.minY
  return <div className="skills-map-scroll">
    <div className="skills-map" style={{ width:bounds.width, height:bounds.height }}>
      <svg className="skills-connections" width={bounds.width} height={bounds.height} aria-hidden="true">
        {nodes.flatMap(n => (n.requires || []).filter(id => byId.has(id)).map(id =>
          <line key={id+'-'+n.id} x1={x(byId.get(id))} y1={y(byId.get(id))} x2={x(n)} y2={y(n)}
            stroke={unlocked.includes(n.id) && unlocked.includes(id) ? color : '#665641'} strokeWidth={unlocked.includes(n.id) ? 3 : 1.5} opacity=".75" />))}
      </svg>
      {nodes.map(n => {
        const learned = unlocked.includes(n.id)
        const ready = available(n)
        return <button key={n.id} type="button"
          className={['skills-node', n.type || 'small', learned?'learned':'', ready?'ready':'', selected===n.id?'selected':''].join(' ')}
          style={{ left:x(n), top:y(n), '--node-color':n.color || color }}
          title={n.label} onClick={() => onSelect(n.id)}>
          <span className="skills-node-glyph">{n.type==='keystone'?'✦':n.type==='notable'?'◆':n.type==='start'?'⬡':'•'}</span>
          <span className="skills-node-label">{n.label}</span>
        </button>
      })}
    </div>
  </div>
}

export default function SkillsScreen({ onReturn }) {
  const player = usePlayerStore(s => s.player)
  const setPlayerLocal = usePlayerStore(s => s.setPlayerLocal)
  const [tab, setTab] = useState('offense')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const isElement = tab.startsWith('element:')
  const isClass = tab.startsWith('class:')
  const elementKey = isElement ? tab.slice(8) : null
  const classKey = isClass ? tab.slice(6) : null
  const element = elementKey ? ELEMENT_TREES[elementKey] : null
  const cls = classKey ? CLASSES[classKey] : null
  const nodes = useMemo(() => isElement ? element.nodes : isClass ? cls.nodes : SKILL_NODES.filter(n => n.branch===tab || n.id==='center'), [tab, element, cls, isElement, isClass])
  const unlocked = isElement ? [element.nodes.find(n=>n.type==='start')?.id, ...(player.elemental_unlocked || [])].filter(Boolean) : isClass
    ? (player.class_nodes_unlocked || []).filter(id => id.startsWith(classKey+':')).map(id => id.slice(classKey.length+1))
    : ['center', ...(player.skills_unlocked || [])]
  const selectedNode = nodes.find(n => n.id===selected) || null
  const points = player.skill_points || 0
  const shards = player.resonance_shards || 0
  const activeElement = getActiveElement(player)
  const slots = player.battle_skills || []
  const elementalAttacks = elementKey ? getElementalAttackProgress(player, elementKey) : []

  function prerequisitesMet(node) {
    if (!node.requires?.length) return true
    if (node.requires.some(id => unlocked.includes(id))) return true
    return !isElement && !isClass && nodes.some(n => unlocked.includes(n.id) && n.requires?.includes(node.id))
  }
  function available(node) {
    if (node.type==='start') return false
    if (unlocked.includes(node.id)) return false
    if (isClass) return player.active_class===classKey && isClassNodeAvailable(player, classKey, node.id)
    if (isElement && !isElementUnlocked(elementKey, player)) return false
    return prerequisitesMet(node)
  }
  function cost(node) { return node.cost ?? (node.type==='keystone'?3:node.type==='notable'?2:1) }

  async function save(updates, successText) {
    setSaving(true); setMessage('')
    const { data, error } = await supabase.from('players').update(updates).eq('id', player.id).select().single()
    setSaving(false)
    if (error) { setMessage('Could not save: '+error.message); return false }
    setPlayerLocal(data || updates)
    setMessage(successText)
    return true
  }
  async function unlock() {
    const node = selectedNode
    if (!node || !available(node) || saving) return
    if (isClass) {
      if (!player.active_class || player.active_class!==classKey) return
      await save(unlockClassNode(player, classKey, node.id), node.label+' learned.')
    } else if (isElement) {
      if (shards<cost(node)) return
      await save({ elemental_unlocked:[...(player.elemental_unlocked||[]),node.id], resonance_shards:shards-cost(node) }, node.label+' attuned.')
    } else {
      if (points<cost(node)) return
      const updates = { skills_unlocked:[...(player.skills_unlocked||[]),node.id], skill_points:points-cost(node) }
      if (node.stat && node.val) {
        const column = STAT_COL[node.stat] || node.stat
        updates[column] = (player[column]||0)+node.val
      }
      await save(updates, node.label+' unlocked.')
    }
  }
  async function activateSelectedElement() {
    if (!isElement || saving) return
    const updates = activeElementChange(player, elementKey)
    if (!updates) {
      setMessage(activeElement === elementKey ? 'This element is already active.' : 'Defeat this zone guardian before activating its element.')
      return
    }
    await save(updates, element.label+' is now your active combat element.')
  }

  async function equipAttack(key) {
    if (saving) return
    const updates = equipElementalAttack(player, key)
    if (!updates) { setMessage('Unlock the required nodes in this elemental tree first.'); return }
    await save(updates, (REGISTRY[key]?.label || key)+' equipped as your only elemental attack.')
  }

  async function toggleSlot(key) {
    if (saving) return
    if (isElementalAttack(key)) { await equipAttack(key); return }
    const next = slots.includes(key) ? slots.filter(s => s!==key) : [...slots,key]
    if (next.length>4) { setMessage('All four battle slots are occupied. Remove one first.'); return }
    await save({ battle_skills:next }, 'Battle loadout saved.')
  }
  const allLearned = [...(player.skills_unlocked||[]), ...(player.elemental_unlocked||[])]
  const eligibleSkills = Object.entries(REGISTRY).filter(([key, skill]) => !isElementalAttack(key) && allLearned.includes(key) && skill.type!=='passive')
  const classBattleSkills = getActiveClassSkills(player, {}) || []
  // Upgrades are restricted to already learned skills, not arbitrary IDs.
  const upgradeableSkills = [...new Map([
    ...eligibleSkills.map(([id, skill]) => [id, { id, label: skill.label }]),
    ...Object.values(ELEMENT_TREES).flatMap(el => getElementalAttackProgress(player, el.key)
      .filter(skill => skill.unlocked).map(skill => [skill.id, { id: skill.id, label: skill.label }])),
    ...classBattleSkills.map(skill => [skill.id, { id: skill.id, label: skill.label }]),
  ]).values()]
  async function upgradeLearnedSkill(id) {
    if (saving || !upgradeableSkills.some(skill => skill.id === id)) return
    const updates = getSkillUpgrade(player, id)
    if (!updates) { setMessage('Maximum skill level reached or insufficient skill points.'); return }
    await save(updates, 'Skill upgraded to level ' + updates.skill_levels[id] + '.')
  }
  const status = selectedNode && (unlocked.includes(selectedNode.id) ? 'Learned' : available(selectedNode) ? 'Available' : 'Locked')
  const selectedColor = isElement ? element.color : isClass ? cls.color : COLORS[tab]
  function choose(next) { setTab(next); setSelected(null); setMessage('') }

  return <main className="skills-screen">
    <header className="skills-header">
      <button onClick={onReturn}>← The Archive</button>
      <div><span>CHARACTER PROGRESSION</span><h1>The Living Skill Tree</h1></div>
      <div className="skills-currency"><span>{points} Skill Points</span><span>{shards} Resonance Shards</span></div>
    </header>
    <nav className="skills-tabs" aria-label="Skill tree branches">
      {BRANCHES.map(b => <button key={b} className={tab===b?'active':''} onClick={() => choose(b)}>{b}</button>)}
    </nav>
    <div className="skills-section-label">Elemental paths · learn multiple trees, activate one for combat</div>
    <p className="skills-resonance-status">Active combat element: <strong>{activeElement ? ELEMENT_TREES[activeElement]?.sigil+' '+ELEMENT_TREES[activeElement]?.label : 'None selected'}</strong>. Only nodes from your active element contribute combat bonuses. Learned nodes in other trees stay saved.</p>
    <nav className="skills-tabs elemental" aria-label="Elemental paths">
      {Object.values(ELEMENT_TREES).map(el => <button key={el.key} className={tab==='element:'+el.key?'active':''} onClick={() => choose('element:'+el.key)}>{el.sigil} {el.label}{activeElement===el.key?' ★ ACTIVE':''}{!isElementUnlocked(el.key,player)?' 🔒':''}</button>)}
    </nav>
    <div className="skills-section-label">Class paths · chosen through the Judges' story</div>
    {player.active_class
      ? <nav className="skills-tabs class-tabs" aria-label="Classes">
          <button className={tab==='class:'+player.active_class?'active':''} onClick={() => choose('class:'+player.active_class)}>{CLASSES[player.active_class]?.name || player.active_class} ★</button>
        </nav>
      : <p className="skills-locked-class">Hidden classes remain unknown until the Twin Judges render their verdict.</p>}
    <section className="skills-workspace">
      <div className="skills-tree-column">
        <div className="skills-tree-heading">
          <h2 style={{color:selectedColor}}>{isElement ? element.sigil+' '+element.label : isClass ? cls.name : tab+' path'}</h2>
          <p>{isElement && !isElementUnlocked(elementKey,player) ? 'Defeat the zone boss to unlock this element.' : isClass && player.active_class!==classKey ? 'Class path preview. Your class is chosen through the story.' : 'Select a node to inspect its requirements and unlock it.'}</p>
          {isElement && isElementUnlocked(elementKey,player) && (activeElement === elementKey ? <p className="skills-resonance-active">★ This element is active in combat</p> : <button type="button" className="skills-primary" disabled={saving} onClick={activateSelectedElement}>Activate {element.label} for combat</button>)}
          {isElement && isElementUnlocked(elementKey,player) && <div className="skills-elemental-attacks">
            <h3>Elemental attacks · {countLearnedElementNodes(player, elementKey)}/19 nodes</h3>
            {elementalAttacks.map(skill => <div key={skill.id} className="skills-elemental-attack">
              <span><strong>{skill.label}</strong> · {skill.requiredNodes} nodes {skill.unlocked ? '✓' : '🔒'}</span>
              {skill.unlocked && <button type="button" disabled={saving || skill.equipped} onClick={() => equipAttack(skill.id)}>{skill.equipped ? 'Equipped' : 'Equip'}</button>}
            </div>)}
            <p>Only one elemental attack can occupy the four combat slots. Other unlocked attacks remain learned.</p>
          </div>}
        </div>
        <TreeMap nodes={nodes} unlocked={unlocked} available={available} selected={selected} onSelect={setSelected} color={selectedColor} />
      </div>
      <aside className="skills-detail">
        <h2>{selectedNode?.label || 'Choose a node'}</h2>
        {selectedNode ? <>
          <span className="skills-pill">{status} · {selectedNode.type || 'skill'}</span>
          <p>{selectedNode.desc || selectedNode.sub || 'An upgrade on this path.'}</p>
          {selectedNode.stat && <p>Bonus: +{selectedNode.val} {STAT_COL[selectedNode.stat] || selectedNode.stat}</p>}
          {!isClass && <p>Cost: {cost(selectedNode)} {isElement?'shards':'skill points'}</p>}
          {isClass && <p>Required level: {selectedNode.levelRequired || 1}</p>}
          {selectedNode.requires?.length>0 && <p>Connected to: {selectedNode.requires.map(id => nodes.find(n=>n.id===id)?.label || id).join(', ')}</p>}
          {status==='Available' && <button className="skills-primary" disabled={saving || (!isClass && (isElement?shards:points)<cost(selectedNode))} onClick={unlock}>Unlock {selectedNode.label}</button>}
        </> : <p>Explore every node in the original progression system. Connected paths light up as you learn new skills.</p>}
        <h3>Skill upgrades · separate from weapon mastery</h3>
        <p>Spend skill points to strengthen learned abilities. Every skill begins at level 1, up to level {MAX_SKILL_LEVEL}.</p>
        {upgradeableSkills.map(skill => {
          const level = getSkillLevel(player, skill.id)
          const cost = skillUpgradeCost(level)
          const shape = getProgressedTacticalSkillRule(skill.id, level)
          const nextLevel = [4,7,10].find(milestone => milestone > level)
          const nextShape = nextLevel && getProgressedTacticalSkillRule(skill.id, nextLevel)
          return <div key={skill.id} className="skills-slot">
            <div className="skills-upgrade-label">
              <span>{skill.label} · Lv {level}/{MAX_SKILL_LEVEL}</span>
              {shape?.target==='enemy'&&<small>
                Target area: {shape.shape}
                {nextShape?.shape!==shape.shape
                  ? ' · Lv '+nextLevel+': '+nextShape.shape
                  : ''}
              </small>}
              {shape?.target==='self'&&<small>Support skill · no enemy area</small>}
            </div>
            <button type="button" disabled={saving || level >= MAX_SKILL_LEVEL || points < cost}
              onClick={() => upgradeLearnedSkill(skill.id)}>
              {level >= MAX_SKILL_LEVEL ? 'MAX' : 'Upgrade · ' + cost + ' SP'}
            </button>
          </div>
        })}
        <h3>Battle loadout · {slots.length}/4</h3>
        <p>Choose up to four unlocked active combat skills.</p>
        {slots.map(key => <button key={key} className="skills-slot" disabled={saving} onClick={() => isElementalAttack(key) ? save({ battle_skills: slots.filter(s => s !== key) }, 'Elemental attack unequipped.') : toggleSlot(key)}>{REGISTRY[key]?.label || key} <span>Remove ×</span></button>)}
        {eligibleSkills.filter(([key])=>!slots.includes(key)).map(([key,skill])=><button key={key} className="skills-slot" disabled={saving || slots.length>=4} onClick={() => toggleSlot(key)}>{skill.label} <span>Equip +</span></button>)}
        {message && <p className="skills-message" role="status">{message}</p>}
      </aside>
    </section>
  </main>
}
