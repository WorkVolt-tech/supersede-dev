import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useInventoryStore } from '../../store/useInventoryStore'
import { CORE_STATS, getEffectiveStats } from '../../game/playerStats'
import { combatApBreakdown } from '../../game/combatAp'
import { SKILL_NODES } from '../../game/skillTreeNodes'
import { ELEMENT_TREES, isElementUnlocked } from '../../game/elementsTree'
import { getActiveElement, activeElementChange } from '../../game/activeElement'
import { getElementalAttackProgress, equipElementalAttack, isElementalAttack, countLearnedElementNodes } from '../../game/elementalAttacks'
import { CLASSES, isClassNodeAvailable, isClassNodeUnlocked, unlockClassNode } from '../../game/classes'
import { BATTLE_SKILLS_REGISTRY, NOTABLE_SKILLS_REGISTRY } from '../../game/skillsRegistry'
import { getSkillLevel, getSkillUpgrade, skillUpgradeCost, MAX_SKILL_LEVEL } from '../../game/skillLeveling'
import { getActiveClassSkills } from '../../game/classCombat'
import { getProgressedTacticalSkillRule } from '../../game/tacticalSkills'
import { getElementalTriadAction, getTriadSpecial } from '../../game/elementalTriad'
import { getFusionEligibility, unlockFusionPair, getElementalTriadEligibility,
  unlockElementalTriad, committedFusionKey, fusionMasteryLevel,
  getFusionSignature, FUSION_UNLOCK_COST,
  FUSION_MIN_LEVEL, FUSION_MIN_CLASS_NODES, FUSION_MIN_ELEMENT_NODES } from '../../game/classElementFusion'
import './SkillsScreen.css'

const BRANCHES = ['offense', 'defense', 'flow', 'arcane', 'decay']
const COLORS = { offense:'#c75c52', defense:'#558d74', flow:'#69a7b5', arcane:'#a77acb', decay:'#9580b8', center:'#c9a66c' }
const STAT_COL = { atk_bonus:'atk', def_bonus:'def', power_bonus:'power', guard_bonus:'guard', control_bonus:'control', speed_bonus:'speed', insight_bonus:'insight', luck_bonus:'luck' }
const REGISTRY = { ...BATTLE_SKILLS_REGISTRY, ...NOTABLE_SKILLS_REGISTRY }
const CORE_STAT_LABELS = {
  atk:'Attack',def:'Defense',power:'Power',guard:'Guard',
  speed:'Speed',control:'Control',insight:'Insight',luck:'Luck',agility:'Agility',
}

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

export default function SkillsScreen({ onReturn, onOpenMastery }) {
  const player = usePlayerStore(s => s.player)
  const inventory = useInventoryStore(s => s.items)
  const stats = getEffectiveStats(player, inventory.filter(item => item.equipped_slot))
  const apCapacity = combatApBreakdown(player, inventory)
  const setPlayerLocal = usePlayerStore(s => s.setPlayerLocal)
  const [tab, setTab] = useState('offense')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmFusion, setConfirmFusion] = useState(null)

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
  const availableElements = Object.values(ELEMENT_TREES).filter(el => isElementUnlocked(el.key,player))
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

  async function unlockFusion(element,kind='class-element') {
    if(saving)return
    const eligibility=kind==='triad'
      ?getElementalTriadEligibility(player,element)
      :getFusionEligibility(player,element)
    if(!eligibility.canUnlock){
      setMessage(eligibility.lockedByOther
        ?'Your only fusion slot is already permanently committed.'
        :'Fusion requirements are not met yet.')
      return
    }
    if(confirmFusion!==eligibility.pair) {
      setConfirmFusion(eligibility.pair)
      setMessage('Permanent choice: confirm to lock '+eligibility.pair+
        ' as this character’s ONLY fusion.')
      return
    }
    const updates=kind==='triad'
      ?unlockElementalTriad(player,element)
      :unlockFusionPair(player,element)
    setConfirmFusion(null)
    if(!updates)return
    await save(updates,(kind==='triad'?'Elemental Triad':'Class–element')+
      ' fusion permanently unlocked: '+eligibility.pair+'.')
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
  const availableElementalAttacks = availableElements.flatMap(el => getElementalAttackProgress(player,el.key).filter(skill => skill.unlocked))
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
  function choose(next) {
    setTab(next); setSelected(null); setMessage(''); setConfirmFusion(null)
  }

  return <main className="skills-screen">
    <header className="skills-header">
      <button onClick={onReturn}>← The Archive</button>
      <div><span>CHARACTER PROGRESSION</span><h1>The Living Skill Tree</h1></div>
      <div className="skills-currency"><span>{points} Skill Points</span><span>{shards} Resonance Shards</span>{onOpenMastery&&<button type="button" onClick={onOpenMastery}>⚔ Weapon Mastery</button>}</div>
    </header>
    <section className="skills-character-stats" aria-labelledby="skills-stats-heading">
      <h2 id="skills-stats-heading">Character stats</h2>
      <div className="skills-combat-metrics" aria-label="Combat and player record stats">
        {[
          ['Combat ATK',stats.attack],['Combat DEF',stats.defense],
          ['Initiative',stats.initiative],['Max AP',apCapacity.max],['Insight',stats.core.insight],
          ['PvP Kills',player.pvp_kills ?? 0],['Helps Given',player.helps_given ?? 0],
        ].map(([label,value])=><div key={label} className="skills-stat-tile">
          <span>{label}</span><strong>{value}</strong>
          {label==='Max AP'&&<small>{apCapacity.base} base + {apCapacity.level} level + {apCapacity.permanent} permanent + {apCapacity.gear} gear</small>}
        </div>)}
      </div>
      <div className="skills-attribute-stats" aria-label="Character attributes">
        {CORE_STATS.map(key=><div key={key} className="skills-stat-tile">
          <span>{CORE_STAT_LABELS[key]}</span><strong>{stats.core[key]}</strong>
          {stats.equipment[key]!==0&&<small>
            {stats.base[key]} base · {stats.equipment[key]>0?'+':''}{stats.equipment[key]} gear
          </small>}
        </div>)}
      </div>
    </section>
    <section className="skills-battle-loadout" aria-labelledby="skills-loadout-heading">
      <h2 id="skills-loadout-heading">Battle loadout · {slots.length}/4</h2>
      <p>These four slots are saved to your character. Equip unlocked abilities here; weapon attacks and active class abilities are available automatically during combat.</p>
      <div className="skills-loadout-grid">
        {Array.from({length:4},(_,index)=>{
          const id=slots[index]
          return <div className="skills-loadout-slot" key={index}>
            <small>Slot {index+1}</small>
            {id ? <>
              <strong>{REGISTRY[id]?.label || id.replaceAll('_',' ')}</strong>
              <button type="button" disabled={saving} onClick={()=>save({battle_skills:slots.filter((_,i)=>i!==index)},'Battle loadout saved.')}>Unequip</button>
            </> : <span>Empty</span>}
          </div>
        })}
      </div>
      <h3>Unlocked skills you can equip</h3>
      {eligibleSkills.filter(([key])=>!slots.includes(key)).length===0
        ? <p>No additional learned skills are ready to equip. Unlock abilities in your skill trees or elemental paths first.</p>
        : <div className="skills-loadout-options">
          {eligibleSkills.filter(([key])=>!slots.includes(key)).map(([key,skill])=>
            <button key={key} type="button" disabled={saving||slots.length>=4}
              onClick={()=>toggleSlot(key)}>{skill.label} <span>Equip +</span></button>)}
        </div>}
      {availableElementalAttacks.length>0&&<>
        <h3>Unlocked elemental attacks · one can be equipped</h3>
        <div className="skills-loadout-options">
          {availableElementalAttacks.map(skill=><button key={skill.id} type="button"
            disabled={saving||skill.equipped} onClick={()=>equipAttack(skill.id)}>
            {skill.label} <span>{skill.equipped?'Equipped':'Equip +'}</span>
          </button>)}
        </div>
      </>}
      {classBattleSkills.length>0&&<p className="skills-loadout-auto">Active class abilities (automatic): {classBattleSkills.map(skill=>skill.label).join(' · ')}</p>}
      <p className="skills-loadout-auto">Weapon attacks are determined by your equipped weapon and weapon mastery. They do not occupy these four slots.</p>
    </section>
    <nav className="skills-tabs" aria-label="Skill tree branches">
      {BRANCHES.map(b => <button key={b} className={tab===b?'active':''} onClick={() => choose(b)}>{b}</button>)}
    </nav>
    <div className="skills-section-label">Elemental paths · unlocked elements only</div>
    <p className="skills-resonance-status">Active combat element: <strong>{activeElement ? ELEMENT_TREES[activeElement]?.sigil+' '+ELEMENT_TREES[activeElement]?.label : 'None selected'}</strong>. Defeat an elemental guardian to reveal its path here.</p>
    {availableElements.length>0
      ? <nav className="skills-tabs elemental" aria-label="Elemental paths">
          {availableElements.map(el => <button key={el.key} className={tab==='element:'+el.key?'active':''} onClick={() => choose('element:'+el.key)}>{el.sigil} {el.label}{activeElement===el.key?' ★ ACTIVE':''}</button>)}
        </nav>
      : <p className="skills-locked-class">No elemental paths unlocked yet.</p>}
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
            {player.active_class&&(()=>{
              const fusion=getFusionEligibility(player,elementKey)
              const fusionXp=Math.max(0,player.fusion_mastery?.[fusion.pair]||0)
              const fusionLevel=fusionMasteryLevel(fusionXp)
              const signature=getFusionSignature({key:fusion.pair,level:5})
              return <div className="skills-fusion-unlock">
                <h3>✦ Class–element fusion</h3>
                <p>{player.active_class} + {elementKey} · {fusion.unlocked?'Unlocked':
                  fusion.lockedByOther?'Fusion slot already taken':
                  fusion.ready?'Ready to unlock':'Not yet eligible'}</p>
                <p>Requires character Lv {FUSION_MIN_LEVEL}, {FUSION_MIN_CLASS_NODES}
                  {' '}learned class nodes and {FUSION_MIN_ELEMENT_NODES} elemental nodes.
                  Unlock costs {FUSION_UNLOCK_COST} SP. Progress: Lv {fusion.level},
                  {' '}{fusion.classNodes} class nodes, {fusion.elementNodes} element nodes.</p>
                {fusion.unlocked
                  ?<div>
                    <p>Fusion Mastery Lv {fusionLevel}/10 · {fusionXp} XP.
                      Your single permanent fusion keeps its progress if you change
                      active elements. Other pairings cannot be unlocked.</p>
                    {signature&&<p>✦ Signature: <strong>{signature}</strong>
                      {' · '}{fusionLevel>=5?'Available in combat':'Unlocks at Fusion Lv 5'}.
                      {' '}Attack pattern expands at Fusion Lv 8 and Lv 10.</p>}
                    {!signature&&<p>This pairing has an elemental infusion, with
                      independent fusion mastery. No signature active is defined yet.</p>}
                  </div>
                  :fusion.lockedByOther
                    ?<p>Already committed to {fusion.committed}. One fusion per character.</p>
                    :<button type="button" disabled={saving||!fusion.canUnlock}
                      onClick={()=>unlockFusion(elementKey)}>
                      {confirmFusion===fusion.pair?'Confirm PERMANENT fusion':
                        'Choose this fusion'} · {FUSION_UNLOCK_COST} SP
                    </button>}
              </div>
            })()}
            {!player.active_class&&(()=>{
              const triad=getElementalTriadEligibility(player,elementKey)
              const fusionXp=Math.max(0,player.fusion_mastery?.[triad.pair]||0)
              const mastery=fusionMasteryLevel(fusionXp)
              const triadAction=getElementalTriadAction({
                kind:'triad',key:triad.pair,element:elementKey,level:mastery})
              const specialty=getTriadSpecial(elementKey,mastery,0)
              return <div className="skills-fusion-unlock">
                <h3>✦ Elemental Triad Fusion</h3>
                <p>Classless elemental path: combine all three unlocked {elementKey}
                  {' '}attacks into one independent technique.
                  Requires level {FUSION_MIN_LEVEL} and 19 learned elemental nodes.
                  Cost: {FUSION_UNLOCK_COST} skill points.</p>
                {triad.unlocked
                  ?<p>Committed fusion: {triad.pair} · Fusion Mastery
                    {' '}Lv {fusionMasteryLevel(fusionXp)}/10 · {fusionXp} XP.
                    Three elemental attacks fuse during combat, while their
                    original individual skills remain available.
                    {' '}<strong>{triadAction.technique}</strong> · {specialty.detail}.
                    {' '}Area: {triadAction.attack.shape} · {triadAction.mp} MP /
                    {' '}{triadAction.ap} AP · {triadAction.cooldown}-round cooldown.
                    Attack area expands at Fusion Mastery Lv 5 and 8.</p>
                  :triad.lockedByOther
                    ?<p>Only fusion slot already committed to {triad.committed}.
                      You cannot purchase another fusion.</p>
                    :<button type="button" disabled={saving||!triad.canUnlock}
                      onClick={()=>unlockFusion(elementKey,'triad')}>
                      {confirmFusion===triad.pair?'Confirm PERMANENT Elemental Triad':
                        'Choose Elemental Triad'} · {FUSION_UNLOCK_COST} SP
                    </button>}
              </div>
            })()}
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
                {nextShape&&nextShape.shape!==shape.shape
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
        {message && <p className="skills-message" role="status">{message}</p>}
      </aside>
    </section>
  </main>
}
