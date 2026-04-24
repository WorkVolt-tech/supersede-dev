/**
 * enemyAI.js — SuperSede Enemy Move System
 *
 * Drop-in module for chapter1.html (and future chapters).
 * Exports one function: resolveEnemyTurn(enemy, context)
 *
 * WHAT THIS ADDS vs. the old system:
 *  - Per-enemy named move tables with weighted random selection
 *  - Phase triggers (e.g. Void Sentinel shifts at 50% HP)
 *  - Enemy-applied status effects: bleed, slow, stun, def-shred, poison, terrify
 *  - Boss-specific rotations: The Watcher, Sentinel of the First Eye, The Surveyor, The Unseen
 *  - Animation hooks: each move carries a CSS animation class + combat-log colour tag
 *  - Turn counter tracking so bosses can do choreographed rotations
 *
 * ─── HOW TO INTEGRATE ───────────────────────────────────────────────────────
 *
 *  1. Import at the top of your <script type="module"> in chapter1.html:
 *
 *       import { resolveEnemyTurn, initEnemyState, ANIM } from './enemyAI.js'
 *
 *  2. When you build a combat instance (inside buildCombatUI), initialise
 *     enemy state once:
 *
 *       const enemyState = initEnemyState(enemy)
 *
 *  3. Inside resolveEnemyAction() — replace the existing flat ATK calc with:
 *
 *       const result = resolveEnemyTurn(enemy, {
 *         enemyState,          // mutable state object from initEnemyState()
 *         enemyHp,             // current enemy HP (number)
 *         maxEnemyHp,          // max enemy HP
 *         currentHp,           // player current HP
 *         maxPlayerHp,         // player max HP
 *         playerDEF,           // function () => number
 *         defending,           // boolean — player chose Defend this turn
 *         statusEffects,       // existing statusEffects object
 *         yara,                // nullable yara ally object
 *         messages,            // string[] — push lines here
 *         triggerAnimation,    // function(animClass: string) — see §4
 *         onEnemyDmgPlayer,    // function(dmg: number) — apply dmg to player
 *         onEnemyHealSelf,     // function(amt: number) — heal the enemy
 *         onEnemyDmgReduced,   // function() — called when player fully blocks
 *       })
 *       // result.enemyHpDelta is negative (damage) or positive (heal to player, etc.)
 *       // result.logLines is already pushed onto messages for you
 *
 *  4. Animation hook — wire triggerAnimation to your combat-wrap shake/flash:
 *
 *       function triggerAnimation(animClass) {
 *         const wrap = document.getElementById(cid + '-combat-wrap')
 *         if (!wrap) return
 *         const panel = document.getElementById(cid + '-combat-panel-inner') // enemy portrait
 *         switch (animClass) {
 *           case ANIM.SHAKE:   wrap.classList.add('animate-shake'); setTimeout(()=>wrap.classList.remove('animate-shake'),350); break
 *           case ANIM.PULSE:   wrap.style.boxShadow='0 0 40px 4px #e05a4488'; setTimeout(()=>wrap.style.boxShadow='',600); break
 *           case ANIM.FLASH:   flashScreen('#e05a44', 0.18); break
 *           case ANIM.VOID:    flashScreen('#b06eff', 0.22); break
 *           case ANIM.GOLD:    flashScreen('#ffd68a', 0.15); break
 *           case ANIM.ICE:     flashScreen('#8fd8f0', 0.18); break
 *           case ANIM.TERROR:  wrap.classList.add('animate-shake'); flashScreen('#ff000033', 0.35); setTimeout(()=>wrap.classList.remove('animate-shake'),500); break
 *         }
 *       }
 *
 *       function flashScreen(color, opacity) {
 *         const el = document.createElement('div')
 *         el.style.cssText = `position:fixed;inset:0;z-index:9997;background:${color};opacity:0;pointer-events:none;transition:opacity .12s`
 *         document.body.appendChild(el)
 *         requestAnimationFrame(()=>{ el.style.opacity=opacity; setTimeout(()=>{ el.style.opacity=0; setTimeout(()=>el.remove(),200) },180) })
 *       }
 *
 * ─── ENEMY STATUS EFFECTS (applied TO player) ───────────────────────────────
 *
 *  These land on the existing statusEffects object with new keys:
 *
 *    statusEffects.playerBleedTurns    — lose HP each player turn
 *    statusEffects.playerBleedDmg      — bleed damage per turn
 *    statusEffects.playerSlowTurns     — SPD halved
 *    statusEffects.playerStunTurns     — player skips next action
 *    statusEffects.playerDefShredTurns — player DEF reduced by shredAmt
 *    statusEffects.playerDefShredAmt
 *    statusEffects.playerTerrorTurns   — skill buttons disabled (terror)
 *    statusEffects.playerPoisonTurns
 *    statusEffects.playerPoisonDmg
 *
 *  Apply these in your existing doTurn() BEFORE player resolves their action:
 *
 *    if (statusEffects.playerStunTurns > 0) {
 *      statusEffects.playerStunTurns--
 *      messages.push('<strong>You are stunned</strong> — cannot act!')
 *      return  // skip player action
 *    }
 *    if (statusEffects.playerBleedTurns > 0) {
 *      currentHp = Math.max(0, currentHp - statusEffects.playerBleedDmg)
 *      statusEffects.playerBleedTurns--
 *      messages.push('🩸 Bleed: ' + statusEffects.playerBleedDmg + ' damage.')
 *    }
 *    if (statusEffects.playerPoisonTurns > 0) {
 *      currentHp = Math.max(0, currentHp - statusEffects.playerPoisonDmg)
 *      statusEffects.playerPoisonTurns--
 *      messages.push('☠ Poison: ' + statusEffects.playerPoisonDmg + ' damage.')
 *    }
 *    if (statusEffects.playerDefShredTurns > 0) {
 *      statusEffects.playerDefShredTurns--
 *      // DEF reduction is already read inside resolveEnemyTurn via context
 *    }
 *    if (statusEffects.playerSlowTurns > 0) {
 *      statusEffects.playerSlowTurns--
 *      // Speed reduction is already factored in via calcSPD() calling context.statusEffects
 *    }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Animation class constants ─────────────────────────────────────────────────
export const ANIM = {
  SHAKE:  'shake',
  PULSE:  'pulse',
  FLASH:  'flash',
  VOID:   'void',
  GOLD:   'gold',
  ICE:    'ice',
  TERROR: 'terror',
  NONE:   'none',
}

// ── Status effect helpers ──────────────────────────────────────────────────────
function applyBleed(se, dmg, turns, messages) {
  se.playerBleedDmg   = Math.max(se.playerBleedDmg||0, dmg)
  se.playerBleedTurns = Math.max(se.playerBleedTurns||0, turns)
  messages.push(`🩸 <em>Bleed</em> applied — ${dmg} dmg/turn × ${turns} turns.`)
}
function applyPoison(se, dmg, turns, messages) {
  se.playerPoisonDmg   = Math.max(se.playerPoisonDmg||0, dmg)
  se.playerPoisonTurns = Math.max(se.playerPoisonTurns||0, turns)
  messages.push(`☠ <em>Poison</em> applied — ${dmg} dmg/turn × ${turns} turns.`)
}
function applySlow(se, turns, messages) {
  se.playerSlowTurns = Math.max(se.playerSlowTurns||0, turns)
  messages.push(`🌀 <em>Slowed</em> — your Speed halved for ${turns} turns.`)
}
function applyStun(se, turns, messages) {
  se.playerStunTurns = Math.max(se.playerStunTurns||0, turns)
  messages.push(`⚡ <em>Stunned!</em> You lose ${turns} action${turns>1?'s':''}.`)
}
function applyDefShred(se, amt, turns, messages) {
  se.playerDefShredAmt   = Math.max(se.playerDefShredAmt||0, amt)
  se.playerDefShredTurns = Math.max(se.playerDefShredTurns||0, turns)
  messages.push(`🔓 <em>Armour Shred</em> — your DEF reduced by ${amt} for ${turns} turns.`)
}
function applyTerror(se, turns, messages) {
  se.playerTerrorTurns = Math.max(se.playerTerrorTurns||0, turns)
  messages.push(`😱 <em>Terror</em> — skills disabled for ${turns} turns.`)
}

// ── Weighted random pick ───────────────────────────────────────────────────────
function pickWeighted(moves) {
  const total  = moves.reduce((s, m) => s + (m.weight||1), 0)
  let   roll   = Math.random() * total
  for (const m of moves) {
    roll -= (m.weight||1)
    if (roll <= 0) return m
  }
  return moves[moves.length - 1]
}

// ── Effective DEF considering shred ──────────────────────────────────────────
function effectiveDEF(playerDEFfn, se, defending) {
  const base = playerDEFfn() + (se.playerDEFBonus||0)
  const shred = se.playerDefShredTurns > 0 ? (se.playerDefShredAmt||0) : 0
  const defMult = defending ? 2 : 1
  return Math.max(0, (base - shred) * defMult)
}

// ── Base melee damage calculation ─────────────────────────────────────────────
function baseDmg(atkVal, playerDEFfn, se, defending, variance = 4) {
  const def  = effectiveDEF(playerDEFfn, se, defending)
  const roll = Math.floor(Math.random() * (variance + 1))
  return Math.max(1, Math.round(atkVal + roll - def))
}

// ── Initialise per-enemy mutable state ───────────────────────────────────────
export function initEnemyState(enemy) {
  return {
    turnCount:       0,
    phase:           1,           // phase shifts on HP thresholds
    lastMove:        null,        // key of last used move (prevent repeat on bosses)
    consecutiveHits: 0,           // how many turns in a row enemy landed a hit
    adaptLevel:      0,           // Void Sentinel: increases each round
    surveyorLockIn:  null,        // Surveyor: pattern it locked onto
    unseenVisible:   false,       // Unseen: consolidated to strike
    watcherEyeCount: 0,           // Watcher: eyes spawned this battle
    rotationIndex:   0,           // bosses with strict rotations
    enragedAt:       null,        // turn enrage triggered (phase 2)
  }
}

// ── Master resolver ───────────────────────────────────────────────────────────
/**
 * resolveEnemyTurn — call once per combat turn in place of the old flat ATK calc.
 *
 * @param {object} enemy         — enemy definition (name, atk, hp, etc.)
 * @param {object} ctx           — see integration notes above
 * @returns {{ anim: string }}   — animation class to trigger
 */
export function resolveEnemyTurn(enemy, ctx) {
  const {
    enemyState,
    enemyHp,
    maxEnemyHp,
    currentHp,
    maxPlayerHp,
    playerDEF,
    defending,
    statusEffects: se,
    yara,
    messages,
    triggerAnimation,
    onEnemyDmgPlayer,
    onEnemyHealSelf,
  } = ctx

  enemyState.turnCount++
  const hpPct = enemyHp / maxEnemyHp

  // Route to the right AI table
  const name = enemy.name || ''

  if (name.includes('Watcher') && !name.includes('Eye')) {
    return _boss_watcher(enemy, ctx, hpPct)
  }
  if (name.includes('Sentinel of the First Eye')) {
    return _boss_sentinel(enemy, ctx, hpPct)
  }
  if (name.includes('Surveyor')) {
    return _boss_surveyor(enemy, ctx, hpPct)
  }
  if (name.includes('Unseen')) {
    return _boss_unseen(enemy, ctx, hpPct)
  }
  if (name.includes("Watcher's Eye Swarm")) {
    return _enemy_eyeSwarm(enemy, ctx, hpPct)
  }
  if (name.includes("Watcher's Eye")) {
    return _enemy_watcherEye(enemy, ctx, hpPct)
  }
  if (name.includes('Void Sentinel')) {
    return _enemy_voidSentinel(enemy, ctx, hpPct)
  }
  if (name.includes('Void Sentinel')) {
    return _enemy_voidSentinel(enemy, ctx, hpPct)
  }
  if (name.includes('System Enforcer')) {
    return _enemy_systemEnforcer(enemy, ctx, hpPct)
  }
  if (name.includes('Corrupted Sentry') || name.includes('Lobby Corrupted Sentries')) {
    return _enemy_corruptedSentry(enemy, ctx, hpPct)
  }
  if (name.includes('Pixel Drone') || name.includes('Jury-Rigged')) {
    return _enemy_pixelDrone(enemy, ctx, hpPct)
  }
  if (name.includes('Fracture Wolf') || name.includes('Fracture Wolves')) {
    return _enemy_fractureWolf(enemy, ctx, hpPct)
  }
  if (name.includes('Flicker Hound') || name.includes("Lena's Flicker Hound")) {
    return _enemy_flickerHound(enemy, ctx, hpPct)
  }
  if (name.includes('Glitch Rat')) {
    return _enemy_glitchRat(enemy, ctx, hpPct)
  }
  if (name.includes('Static Crawler')) {
    return _enemy_staticCrawler(enemy, ctx, hpPct)
  }
  if (name.includes('Fragment Cluster')) {
    return _enemy_fragmentCluster(enemy, ctx, hpPct)
  }
  if (name.includes('Dorian')) {
    return _enemy_dorian(enemy, ctx, hpPct)
  }

  // ── Generic fallback ──────────────────────────────────────────────────────
  return _genericEnemy(enemy, ctx, hpPct)
}


// ═══════════════════════════════════════════════════════════════════════════════
// STANDARD ENEMIES
// ═══════════════════════════════════════════════════════════════════════════════

function _genericEnemy(enemy, ctx, hpPct) {
  const { messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx
  const dmg = baseDmg(enemy.atk, playerDEF, se, defending)
  onEnemyDmgPlayer(dmg)
  messages.push(`${enemy.icon || '👾'} ${enemy.name} attacks for <strong>${dmg}</strong>.`)
  triggerAnimation(ANIM.SHAKE)
  return { anim: ANIM.SHAKE }
}

// ── Glitch Rat — erratic, fast, tiny ──────────────────────────────────────────
function _enemy_glitchRat(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx

  const moves = [
    {
      key: 'gnaw', weight: 4, label: 'gnaws at you',
      exec() {
        const dmg = baseDmg(enemy.atk, playerDEF, se, defending, 2)
        onEnemyDmgPlayer(dmg)
        messages.push(`🐀 The Glitch Rat <em>gnaws</em> for <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.SHAKE)
        return ANIM.SHAKE
      },
    },
    {
      key: 'scramble', weight: 2, label: 'scrambles erratically',
      exec() {
        // Scramble: very fast multi-hit but each hit is tiny
        const hits = 2 + Math.floor(Math.random() * 2)  // 2–3 hits
        let total = 0
        for (let i = 0; i < hits; i++) {
          const d = Math.max(1, Math.floor(enemy.atk * 0.4) + Math.floor(Math.random()*2))
          total += d
        }
        onEnemyDmgPlayer(total)
        messages.push(`🐀 Static scramble — ${hits} quick bites for <strong>${total}</strong> total.`)
        triggerAnimation(ANIM.SHAKE)
        return ANIM.SHAKE
      },
    },
    {
      key: 'static_burst', weight: 1, label: 'bursts with static',
      exec() {
        const dmg = baseDmg(enemy.atk * 1.4, playerDEF, se, defending, 0)
        onEnemyDmgPlayer(dmg)
        applyBleed(se, 2, 1, messages)
        messages.push(`⚡ Static burst for <strong>${dmg}</strong>!`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
  ]

  const move = pickWeighted(moves)
  return { anim: move.exec() }
}

// ── Static Crawler — flanking, precise ────────────────────────────────────────
function _enemy_staticCrawler(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx

  const moves = [
    {
      key: 'claw', weight: 3,
      exec() {
        const dmg = baseDmg(enemy.atk, playerDEF, se, defending, 3)
        onEnemyDmgPlayer(dmg)
        messages.push(`🦎 Crawler claw strike — <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.SHAKE)
        return ANIM.SHAKE
      },
    },
    {
      key: 'flank', weight: 2,
      exec() {
        // Flank: ignores 40% of DEF
        const rawDef  = playerDEF() + (se.playerDEFBonus||0) - (se.playerDefShredTurns>0 ? se.playerDefShredAmt||0 : 0)
        const defMult = defending ? 2 : 1
        const partialDef = Math.floor(rawDef * defMult * 0.6)
        const dmg = Math.max(1, enemy.atk + Math.floor(Math.random()*3) - partialDef)
        onEnemyDmgPlayer(dmg)
        messages.push(`🦎 <em>Flanking strike</em> from the blind spot — <strong>${dmg}</strong> (partial DEF).`)
        triggerAnimation(ANIM.PULSE)
        return ANIM.PULSE
      },
    },
    {
      key: 'acid_spit', weight: 1,
      exec() {
        const dmg = baseDmg(enemy.atk * 0.7, playerDEF, se, defending, 0)
        onEnemyDmgPlayer(dmg)
        applyDefShred(se, 4, 2, messages)
        messages.push(`🦎 Acid spit — <strong>${dmg}</strong> + armour shredded!`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
  ]

  return { anim: pickWeighted(moves).exec() }
}

// ── Flicker Hound — fast, coordinated ────────────────────────────────────────
function _enemy_flickerHound(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx

  const moves = [
    {
      key: 'lunge', weight: 4,
      exec() {
        const dmg = baseDmg(enemy.atk, playerDEF, se, defending, 4)
        onEnemyDmgPlayer(dmg)
        messages.push(`🐕 Flicker Hound <em>lunges</em> — <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.SHAKE)
        return ANIM.SHAKE
      },
    },
    {
      key: 'coordinate', weight: 2,
      exec() {
        // Coordinated: +20% damage if the enemy was hit last turn (retaliation pattern)
        const bonus = (enemyState.lastMove === 'lunge') ? 1.2 : 1.0
        const dmg = Math.round(baseDmg(enemy.atk * bonus, playerDEF, se, defending, 3))
        onEnemyDmgPlayer(dmg)
        messages.push(`🐕 <em>Pack coordination</em> — hounds converge for <strong>${dmg}</strong>!`)
        triggerAnimation(ANIM.PULSE)
        return ANIM.PULSE
      },
    },
    {
      key: 'collar_spark', weight: 1,
      exec() {
        const dmg = baseDmg(enemy.atk * 1.1, playerDEF, se, defending, 0)
        onEnemyDmgPlayer(dmg)
        applySlow(se, 1, messages)
        messages.push(`⚡ Collar spark — <strong>${dmg}</strong> + slowed.`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
  ]

  const move = pickWeighted(moves)
  const anim = move.exec()
  enemyState.lastMove = move.key
  return { anim }
}

// ── Fracture Wolf — mirroring, adaptive flanks ────────────────────────────────
function _enemy_fractureWolf(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx

  // Phase 2: enrage below 35% HP
  const enraged = hpPct < 0.35
  if (enraged && !enemyState.enragedAt) {
    enemyState.enragedAt = enemyState.turnCount
    messages.push(`🐺 <strong>The Fracture Wolf howls — ENRAGE!</strong> ATK sharply increased.`)
    enemy.atk = Math.round(enemy.atk * 1.35)
  }

  const moves = [
    {
      key: 'mirror_strike', weight: 3,
      exec() {
        // Mirror: copies the player's last action type — if player defended, wolf uses low dmg; if player attacked, wolf retaliates hard
        const dmg = baseDmg(enemy.atk, playerDEF, se, defending, 4)
        onEnemyDmgPlayer(dmg)
        messages.push(`🐺 <em>Mirror strike</em> — the wolf reads your stance for <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.SHAKE)
        return ANIM.SHAKE
      },
    },
    {
      key: 'flank_arc', weight: 2,
      exec() {
        // Flank: 2 rapid hits, each at 60% ATK — better than single if DEF is high
        const h1 = Math.max(1, Math.round(enemy.atk * 0.6) + Math.floor(Math.random()*3) - Math.floor(effectiveDEF(playerDEF, se, defending) * 0.5))
        const h2 = Math.max(1, Math.round(enemy.atk * 0.6) + Math.floor(Math.random()*3) - Math.floor(effectiveDEF(playerDEF, se, defending) * 0.5))
        onEnemyDmgPlayer(h1 + h2)
        messages.push(`🐺 <em>Dual flank arc</em> — ${h1} + ${h2} = <strong>${h1+h2}</strong>.`)
        triggerAnimation(ANIM.PULSE)
        return ANIM.PULSE
      },
    },
    {
      key: 'howl', weight: enraged ? 0 : 1,   // only in phase 1
      exec() {
        // Howl: no damage but shreds DEF
        applyDefShred(se, 5, 2, messages)
        messages.push(`🐺 Fracture Wolf <em>howls</em> — your armour cracks! (DEF shred 2 turns)`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
    {
      key: 'frenzy', weight: enraged ? 3 : 0, // only in phase 2
      exec() {
        const dmg = baseDmg(enemy.atk * 1.4, playerDEF, se, defending, 3)
        onEnemyDmgPlayer(dmg)
        applyBleed(se, 3, 2, messages)
        messages.push(`🐺 <em>FRENZY</em> — savage bite for <strong>${dmg}</strong> + bleed!`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
  ]

  const move = pickWeighted(moves.filter(m => m.weight > 0))
  const anim = move.exec()
  enemyState.lastMove = move.key
  return { anim }
}

// ── Pixel Drone — frontal patterns, predictable arcs ─────────────────────────
function _enemy_pixelDrone(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx

  // Pixel Drones always attack from the front — now mechanically: less effective
  // vs Defend (extra block) but very high damage vs undefended player
  const moves = [
    {
      key: 'frontal_beam', weight: 4,
      exec() {
        const defBonus = defending ? 1.5 : 1.0  // frontal — Defend is especially good here
        const rawDmg   = enemy.atk + Math.floor(Math.random()*4) - Math.floor((playerDEF() + (se.playerDEFBonus||0)) * defBonus)
        const dmg = Math.max(defending ? 0 : 1, rawDmg)
        onEnemyDmgPlayer(dmg)
        if (dmg === 0) {
          messages.push(`🤖 Frontal beam — <em>completely blocked</em> by your defence.`)
        } else {
          messages.push(`🤖 <em>Frontal beam</em> — <strong>${dmg}</strong>. (Defend is extra effective vs this.)`)
        }
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
    {
      key: 'burst_diagonal', weight: 2,
      exec() {
        // Diagonal: Defend helps less — only 50% mitigation
        const def = Math.floor((playerDEF() + (se.playerDEFBonus||0) - (se.playerDefShredTurns>0?se.playerDefShredAmt||0:0)) * (defending ? 1.1 : 1))
        const dmg = Math.max(1, enemy.atk + 4 + Math.floor(Math.random()*3) - def)
        onEnemyDmgPlayer(dmg)
        messages.push(`🤖 <em>Burst diagonal</em> — <strong>${dmg}</strong>! (Harder to block.)`)
        triggerAnimation(ANIM.PULSE)
        return ANIM.PULSE
      },
    },
    {
      key: 'overclock', weight: 1,
      exec() {
        // Overclock: turn skip — drone charges — next turn deals ×2 (stored in state)
        enemyState.overclocking = true
        messages.push(`🤖 Drone <em>overclocks</em> — charging a burst attack!`)
        triggerAnimation(ANIM.GOLD)
        return ANIM.GOLD
      },
    },
  ]

  // If overclocking from last turn — release the burst
  if (enemyState.overclocking) {
    enemyState.overclocking = false
    const dmg = baseDmg(enemy.atk * 2.2, playerDEF, se, defending, 2)
    onEnemyDmgPlayer(dmg)
    messages.push(`🤖 ⚡ OVERCLOCK RELEASE — <strong>${dmg}</strong> massive beam!`)
    triggerAnimation(ANIM.TERROR)
    return { anim: ANIM.TERROR }
  }

  const move = pickWeighted(moves)
  const anim = move.exec()
  enemyState.lastMove = move.key
  return { anim }
}

// ── Corrupted Sentry — methodical, shield-bash ───────────────────────────────
function _enemy_corruptedSentry(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx

  const moves = [
    {
      key: 'guard_advance', weight: 3,
      exec() {
        const dmg = baseDmg(enemy.atk, playerDEF, se, defending, 3)
        onEnemyDmgPlayer(dmg)
        messages.push(`👾 Sentry <em>guard advances</em> — methodical strike for <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.SHAKE)
        return ANIM.SHAKE
      },
    },
    {
      key: 'shield_bash', weight: 2,
      exec() {
        const dmg = baseDmg(enemy.atk * 0.8, playerDEF, se, false, 2)  // ignores Defend bonus
        onEnemyDmgPlayer(dmg)
        applyStun(se, 1, messages)
        messages.push(`👾 <em>Shield bash</em> — <strong>${dmg}</strong>! Defence bypassed — stunned!`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
    {
      key: 'scan_and_lock', weight: 1,
      exec() {
        // Telegraphed: no damage but next attack ignores DEF
        enemyState.lockOn = true
        messages.push(`👾 Sentry <em>scans and locks</em> — target acquired. Next strike ignores your DEF.`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
  ]

  // Lock-on follow-through
  if (enemyState.lockOn) {
    enemyState.lockOn = false
    const dmg = Math.max(1, enemy.atk + 6 + Math.floor(Math.random()*4))  // no DEF
    onEnemyDmgPlayer(dmg)
    messages.push(`👾 ⚡ LOCK-ON STRIKE — <strong>${dmg}</strong>! Your armour means nothing.`)
    triggerAnimation(ANIM.TERROR)
    return { anim: ANIM.TERROR }
  }

  const move = pickWeighted(moves)
  const anim = move.exec()
  enemyState.lastMove = move.key
  return { anim }
}

// ── Void Sentinel — ADAPTIVE, phase-shifting ─────────────────────────────────
// "Adapts after each round" — now mechanically real.
// adaptLevel increases each turn; move weights shift accordingly.
function _enemy_voidSentinel(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx

  enemyState.adaptLevel = (enemyState.adaptLevel || 0) + 1

  // Phase 2 at 50% HP
  const phase2 = hpPct < 0.50
  if (phase2 && enemyState.phase === 1) {
    enemyState.phase = 2
    enemy.atk = Math.round(enemy.atk * 1.2)
    messages.push(`⚫ <strong>Void Sentinel shifts geometry — Phase 2 active. ATK increased.</strong>`)
    triggerAnimation(ANIM.VOID)
  }

  // Half-second reconfigure tells player: "hit it NOW" — mechanically: player Defend is weak this turn
  // We represent this as: if player DID NOT attack (chose Defend/item), Sentinel's attack is stronger
  const playerWasted = defending  // proxy for "player didn't press attack"
  const adaptMult    = 1 + enemyState.adaptLevel * 0.06  // +6% per round, caps at ~2.6× at turn 26

  const moves = [
    {
      key: 'geometric_advance', weight: phase2 ? 2 : 4,
      exec() {
        const mult  = playerWasted ? adaptMult * 1.3 : adaptMult
        const dmg   = baseDmg(enemy.atk * mult, playerDEF, se, defending, 3)
        onEnemyDmgPlayer(dmg)
        messages.push(`⚫ Void Sentinel <em>advances</em> — adapted pattern: <strong>${dmg}</strong>. (Adapt lv ${enemyState.adaptLevel})`)
        triggerAnimation(ANIM.SHAKE)
        return ANIM.SHAKE
      },
    },
    {
      key: 'void_absorption', weight: 2,
      exec() {
        // Absorption: does light damage but heals itself for half
        const dmg   = Math.max(1, Math.round(enemy.atk * 0.5 * adaptMult) - effectiveDEF(playerDEF, se, defending))
        const heal  = Math.floor(dmg * 0.6)
        onEnemyDmgPlayer(dmg)
        ctx.onEnemyHealSelf(heal)
        messages.push(`⚫ <em>Void absorption</em> — drains <strong>${dmg}</strong> from you, heals ${heal} HP.`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
    {
      key: 'geometry_fold', weight: phase2 ? 3 : 1,
      exec() {
        // Phase 2 signature: DEF shred + high damage
        const dmg = baseDmg(enemy.atk * 1.2 * adaptMult, playerDEF, se, false, 2)  // ignores Defend
        onEnemyDmgPlayer(dmg)
        applyDefShred(se, 6, 2, messages)
        messages.push(`⚫ <em>Geometry fold</em> — space collapses around you for <strong>${dmg}</strong>! Armour shredded.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
    {
      key: 'reconfigure', weight: 1,
      exec() {
        // No damage — Sentinel pauses. But adaptLevel surges.
        enemyState.adaptLevel = Math.min(enemyState.adaptLevel + 2, 12)
        messages.push(`⚫ Sentinel <em>reconfigures</em> — no attack, but it is learning faster. (Adapt lv ${enemyState.adaptLevel})`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
  ]

  const move = pickWeighted(moves)
  const anim = move.exec()
  enemyState.lastMove = move.key
  return { anim }
}

// ── System Enforcer — relentless, protocol-driven ─────────────────────────────
function _enemy_systemEnforcer(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx

  // Strict protocol rotation: Advance → Suppress → Override → repeat
  const rotation = ['advance', 'suppress', 'override']
  const moveKey  = rotation[enemyState.rotationIndex % rotation.length]
  enemyState.rotationIndex++

  const anim = (() => {
    if (moveKey === 'advance') {
      const dmg = baseDmg(enemy.atk, playerDEF, se, defending, 4)
      onEnemyDmgPlayer(dmg)
      messages.push(`🔴 System Enforcer: <em>Protocol ADVANCE</em> — <strong>${dmg}</strong>.`)
      triggerAnimation(ANIM.FLASH)
      return ANIM.FLASH
    }
    if (moveKey === 'suppress') {
      const dmg = baseDmg(enemy.atk * 0.7, playerDEF, se, defending, 2)
      onEnemyDmgPlayer(dmg)
      applyStun(se, 1, messages)
      messages.push(`🔴 Protocol <em>SUPPRESS</em> — <strong>${dmg}</strong> + suppression field (stunned 1 turn).`)
      triggerAnimation(ANIM.TERROR)
      return ANIM.TERROR
    }
    if (moveKey === 'override') {
      // Override: attacks TWICE — one rapid hit each
      const h1 = Math.max(1, Math.round(enemy.atk * 0.8) + Math.floor(Math.random()*3) - Math.floor(effectiveDEF(playerDEF, se, defending)*0.7))
      const h2 = Math.max(1, Math.round(enemy.atk * 0.8) + Math.floor(Math.random()*3) - Math.floor(effectiveDEF(playerDEF, se, defending)*0.7))
      onEnemyDmgPlayer(h1 + h2)
      messages.push(`🔴 Protocol <em>OVERRIDE</em> — dual strike ${h1} + ${h2} = <strong>${h1+h2}</strong>.`)
      triggerAnimation(ANIM.PULSE)
      return ANIM.PULSE
    }
    return ANIM.SHAKE
  })()

  return { anim }
}

// ── Fragment Cluster — chaotic swarm ─────────────────────────────────────────
function _enemy_fragmentCluster(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx

  const moves = [
    {
      key: 'splinter', weight: 4,
      exec() {
        // Splinter: 3–5 tiny hits, each barely blocked
        const count = 3 + Math.floor(Math.random() * 3)
        const perHit = Math.max(1, Math.floor(enemy.atk / count) - Math.floor(effectiveDEF(playerDEF, se, defending) * 0.25))
        onEnemyDmgPlayer(perHit * count)
        messages.push(`💠 <em>Splinter burst</em> — ${count} shards, ${perHit} each = <strong>${perHit*count}</strong>.`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
    {
      key: 'reform', weight: 2,
      exec() {
        // Cluster reforms: no damage, but heals a sliver
        const heal = Math.round(enemy.hp * 0.08) || 5
        ctx.onEnemyHealSelf(heal)
        messages.push(`💠 Fragment Cluster <em>reforms</em> — regenerates ${heal} HP.`)
        triggerAnimation(ANIM.GOLD)
        return ANIM.GOLD
      },
    },
    {
      key: 'overload', weight: 1,
      exec() {
        const dmg = baseDmg(enemy.atk * 1.6, playerDEF, se, defending, 2)
        onEnemyDmgPlayer(dmg)
        messages.push(`💠 <em>Cluster overload</em> — all fragments detonate for <strong>${dmg}</strong>!`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
  ]

  return { anim: pickWeighted(moves).exec() }
}

// ── Dorian — tactical, feints, and lurking backstabs ─────────────────────────
//
// Two modes:
//   Normal fight  (ctx.dorianLurking = false/undefined): standard tactical moves
//   Lurking mode  (ctx.dorianLurking = true):
//     - Every 2nd turn: guaranteed BACKSTAB from the shadows (ignores DEF, high dmg)
//     - Odd turns: he repositions — no damage, but marks player for the next stab
//
function _enemy_dorian(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx

  // ── LURKING MODE — Dorian watches from the shadows during the Void Sentinel fight ──
  if (ctx.dorianLurking) {
    enemyState.lurkTurn = (enemyState.lurkTurn || 0) + 1

    // Even turns: backstab from the shadows — ignores ALL defence
    if (enemyState.lurkTurn % 2 === 0) {
      const dmg = Math.max(3, enemy.atk + 4 + Math.floor(Math.random() * 6))
      onEnemyDmgPlayer(dmg)
      messages.push(`🔴 <strong>DORIAN BACKSTABS from the shadows — <strong>${dmg}</strong>! He was never going to hold the deal.</strong>`)
      triggerAnimation(ANIM.TERROR)
      return { anim: ANIM.TERROR }
    }

    // Odd turns: repositioning — taunts but no hit
    const taunts = [
      `🔴 Dorian shifts position silently. <em>"Every person I betrayed, I told myself it was the game."</em>`,
      `🔴 You hear him move behind you. <em>"Force of habit,"</em> he says quietly.`,
      `🔴 Dorian watches the Sentinel, then you. <em>"I was going to betray you on level four anyway."</em>`,
      `🔴 A shadow moves. Dorian is repositioning. The backstab is coming.`,
    ]
    messages.push(taunts[Math.floor(Math.random() * taunts.length)])
    triggerAnimation(ANIM.VOID)
    return { anim: ANIM.VOID }
  }

  // ── NORMAL FIGHT MODE ────────────────────────────────────────────────────────
  const phase2 = hpPct < 0.40

  // If he had a previous feint queued — land the real hit now
  if (enemyState.dorianFeintQueued) {
    enemyState.dorianFeintQueued = false
    const dmg = Math.max(1, enemy.atk + 8 + Math.floor(Math.random() * 5))  // ignores DEF — he found the gap
    onEnemyDmgPlayer(dmg)
    messages.push(`🔴 Dorian <em>closes the feint</em> — real strike hits the gap he created: <strong>${dmg}</strong>! Your defence was already committed elsewhere.`)
    triggerAnimation(ANIM.TERROR)
    return { anim: ANIM.TERROR }
  }

  const moves = [
    {
      key: 'calculated_strike', weight: 3,
      exec() {
        // Punishes Defend hard — Dorian specifically trained against passive fighters
        const mult = defending ? 1.45 : 1.0
        const dmg  = baseDmg(enemy.atk * mult, playerDEF, se, false, 3)
        onEnemyDmgPlayer(dmg)
        messages.push(`🔴 Dorian's <em>calculated strike</em> — <strong>${dmg}</strong>.${defending ? ' <em>He punishes passivity.</em>' : ''}`)
        triggerAnimation(ANIM.SHAKE)
        return ANIM.SHAKE
      },
    },
    {
      key: 'feint', weight: 2,
      exec() {
        // Feint: sets up a guaranteed big hit next turn (unless player lands the kill)
        enemyState.dorianFeintQueued = true
        const tickDmg = baseDmg(enemy.atk * 0.4, playerDEF, se, defending, 1)
        onEnemyDmgPlayer(tickDmg)
        messages.push(`🔴 Dorian <em>feints</em> — light pressure for <strong>${tickDmg}</strong>. He's setting something up.`)
        triggerAnimation(ANIM.PULSE)
        return ANIM.PULSE
      },
    },
    {
      key: 'attrition', weight: phase2 ? 0 : 2,
      exec() {
        const dmg = baseDmg(enemy.atk * 0.7, playerDEF, se, defending, 2)
        onEnemyDmgPlayer(dmg)
        applyBleed(se, 3, 2, messages)
        messages.push(`🔴 <em>Attrition tactic</em> — <strong>${dmg}</strong> + bleed. He's playing the long game.`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
    {
      key: 'read_and_exploit', weight: phase2 ? 0 : 1,
      exec() {
        // Reads player's last action — applies DEF shred
        applyDefShred(se, 5, 2, messages)
        const dmg = baseDmg(enemy.atk * 0.8, playerDEF, se, defending, 2)
        onEnemyDmgPlayer(dmg)
        messages.push(`🔴 Dorian <em>reads your pattern</em> — found the gap. <strong>${dmg}</strong> + armour shred.`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
    {
      key: 'desperation', weight: phase2 ? 3 : 0,
      exec() {
        const dmg = baseDmg(enemy.atk * 1.8, playerDEF, se, defending, 4)
        onEnemyDmgPlayer(dmg)
        messages.push(`🔴 Dorian: <em>"Force of habit."</em> — desperate lunge for <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
    {
      key: 'cold_efficiency', weight: phase2 ? 2 : 0,
      exec() {
        // Phase 2 signature: bleed + def shred combo — he's done being careful
        const dmg = baseDmg(enemy.atk * 1.2, playerDEF, se, defending, 3)
        onEnemyDmgPlayer(dmg)
        applyBleed(se, 4, 2, messages)
        applyDefShred(se, 4, 1, messages)
        messages.push(`🔴 <em>Cold efficiency</em> — <strong>${dmg}</strong> + bleed + armour shred. He stops holding back.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
  ]

  const move = pickWeighted(moves.filter(m => m.weight > 0))
  return { anim: move.exec() }
}

// ── Watcher's Eye — focused, relentless ──────────────────────────────────────
function _enemy_watcherEye(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx

  const moves = [
    {
      key: 'retinal_beam', weight: 4,
      exec() {
        const dmg = baseDmg(enemy.atk, playerDEF, se, defending, 3)
        onEnemyDmgPlayer(dmg)
        messages.push(`👁 <em>Retinal beam</em> — the Eye locks on for <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
    {
      key: 'observe_mark', weight: 2,
      exec() {
        // No damage — marks the player: next Eye attack ignores DEF
        enemyState.marked = true
        messages.push(`👁 The Eye <em>observes</em> — you are marked. Next attack bypasses your defence.`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
    {
      key: 'pale_sight', weight: 1,
      exec() {
        const dmg = baseDmg(enemy.atk * 1.4, playerDEF, se, defending, 0)
        onEnemyDmgPlayer(dmg)
        applyTerror(se, 1, messages)
        messages.push(`👁 <em>Pale Sight</em> — terror of observation strikes for <strong>${dmg}</strong>!`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
  ]

  // Mark follow-through
  if (enemyState.marked) {
    enemyState.marked = false
    const dmg = Math.max(1, enemy.atk + 8 + Math.floor(Math.random()*4))
    onEnemyDmgPlayer(dmg)
    messages.push(`👁 ⚡ MARKED STRIKE — <strong>${dmg}</strong>! Your armour is meaningless to the Eye.`)
    triggerAnimation(ANIM.TERROR)
    return { anim: ANIM.TERROR }
  }

  return { anim: pickWeighted(moves).exec() }
}

// ── Watcher's Eye Swarm — distributed mind ────────────────────────────────────
function _enemy_eyeSwarm(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, playerDEF, defending, statusEffects: se } = ctx

  // The swarm adapts: if player used the same action 2 turns in a row, swarm counters it
  const sameAction = enemyState.lastPlayerAction === ctx.playerAction
  enemyState.lastPlayerAction = ctx.playerAction || 'unknown'

  const moves = [
    {
      key: 'convergence', weight: 4,
      exec() {
        // Ring tightens — attacks from all sides, Defend only mitigates 30%
        const def = Math.floor(effectiveDEF(playerDEF, se, defending) * (defending ? 0.3 : 1.0))
        const dmg = Math.max(1, enemy.atk + Math.floor(Math.random()*4) - def)
        onEnemyDmgPlayer(dmg)
        messages.push(`👁 <em>The swarm converges</em> — attacks from every angle for <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
    {
      key: 'counter_pattern', weight: sameAction ? 4 : 1,
      exec() {
        // Counter: if player repeated action, extra damage
        const mult = sameAction ? 1.5 : 1.0
        const dmg  = baseDmg(enemy.atk * mult, playerDEF, se, defending, 2)
        onEnemyDmgPlayer(dmg)
        messages.push(sameAction
          ? `👁 <em>Pattern recognised</em> — the swarm exploits your repetition for <strong>${dmg}</strong>!`
          : `👁 <em>Adaptive response</em> — <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
    {
      key: 'full_observation', weight: 1,
      exec() {
        const dmg = baseDmg(enemy.atk * 1.6, playerDEF, se, false, 3)
        onEnemyDmgPlayer(dmg)
        applyTerror(se, 2, messages)
        applyDefShred(se, 5, 2, messages)
        messages.push(`👁 <em>Full Observation</em> — every Eye locks on simultaneously. <strong>${dmg}</strong>! Terror + armour shred.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
  ]

  return { anim: pickWeighted(moves).exec() }
}


// ═══════════════════════════════════════════════════════════════════════════════
// ZONE BOSSES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Sentinel of the First Eye — binary seeing/unseeing phases ─────────────────
function _boss_sentinel(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, onEnemyHealSelf, playerDEF, defending, statusEffects: se } = ctx

  // Phase transitions
  if (hpPct < 0.50 && enemyState.phase === 1) {
    enemyState.phase = 2
    messages.push(`👁 <strong>THE SENTINEL'S EYE WIDENS. The light intensifies. Phase 2 — it sees everything now.</strong>`)
    triggerAnimation(ANIM.TERROR)
  }
  if (hpPct < 0.20 && enemyState.phase === 2) {
    enemyState.phase = 3
    messages.push(`👁 <strong>The Sentinel trembles. Phase 3 — desperate, ancient, unstoppable.</strong>`)
    triggerAnimation(ANIM.TERROR)
  }

  // Phase 1 — The Sentinel searches. Methodical.
  const phase1Moves = [
    {
      key: 'first_gaze', weight: 4,
      exec() {
        const dmg = baseDmg(enemy.atk, playerDEF, se, defending, 4)
        onEnemyDmgPlayer(dmg)
        messages.push(`👁 The Sentinel's <em>First Gaze</em> sweeps over you — <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
    {
      key: 'indexing_beam', weight: 2,
      exec() {
        // Catalogues a wound — marks player for extra damage next turn
        const dmg = baseDmg(enemy.atk * 0.7, playerDEF, se, defending, 2)
        onEnemyDmgPlayer(dmg)
        enemyState.indexed = true
        messages.push(`👁 <em>Indexing beam</em> — <strong>${dmg}</strong>. Your wounds are being recorded.`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
    {
      key: 'pale_column', weight: 1,
      exec() {
        const dmg = baseDmg(enemy.atk * 1.5, playerDEF, se, defending, 0)
        onEnemyDmgPlayer(dmg)
        messages.push(`👁 <em>Pale Column</em> — a shaft of ancient light for <strong>${dmg}</strong>!`)
        triggerAnimation(ANIM.GOLD)
        return ANIM.GOLD
      },
    },
  ]

  // Phase 2 — The eye opens fully. Attacks cut harder.
  const phase2Moves = [
    {
      key: 'full_sight', weight: 3,
      exec() {
        // Full sight: ignores 50% DEF
        const def = Math.floor(effectiveDEF(playerDEF, se, defending) * 0.5)
        const dmg = Math.max(1, enemy.atk + 5 + Math.floor(Math.random()*4) - def)
        onEnemyDmgPlayer(dmg)
        messages.push(`👁 <em>Full Sight</em> — the eye sees through your defences for <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
    {
      key: 'record_sealed', weight: 2,
      exec() {
        const dmg = baseDmg(enemy.atk * 1.3, playerDEF, se, defending, 4)
        onEnemyDmgPlayer(dmg)
        applyBleed(se, 5, 3, messages)
        messages.push(`👁 <em>Record Sealed</em> — the Sentinel brands you for <strong>${dmg}</strong> + bleed.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
    {
      key: 'watcher_inheritance', weight: 1,
      exec() {
        // Pull from The Watcher — massive damage but telegraphed
        if (!enemyState.charging_inheritance) {
          enemyState.charging_inheritance = true
          messages.push(`👁 <strong>The Sentinel channels the Watcher's inheritance…</strong> Brace yourself.`)
          triggerAnimation(ANIM.VOID)
          return ANIM.VOID
        }
        enemyState.charging_inheritance = false
        const dmg = Math.max(5, enemy.atk * 2 - Math.floor(effectiveDEF(playerDEF, se, defending) * 0.3))
        onEnemyDmgPlayer(dmg)
        messages.push(`👁 ⚡ <strong>WATCHER'S INHERITANCE</strong> — <strong>${dmg}</strong> ancient light!`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
  ]

  // Phase 3 — Extinguishing
  const phase3Moves = [
    {
      key: 'final_closure', weight: 3,
      exec() {
        const dmg = baseDmg(enemy.atk * 1.5, playerDEF, se, false, 3) // ignores Defend
        onEnemyDmgPlayer(dmg)
        applyDefShred(se, 8, 2, messages)
        messages.push(`👁 <em>Final Closure</em> — the eye attempts to extinguish you for <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
    {
      key: 'observation_complete', weight: 1,
      exec() {
        const dmg = baseDmg(enemy.atk * 2.0, playerDEF, se, defending, 0)
        onEnemyDmgPlayer(dmg)
        messages.push(`👁 <strong>OBSERVATION COMPLETE</strong> — a verdict rendered for <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
  ]

  // Indexed follow-through (from phase 1)
  if (enemyState.indexed) {
    enemyState.indexed = false
    const dmg = baseDmg(enemy.atk * 1.4, playerDEF, se, defending, 2)
    onEnemyDmgPlayer(dmg)
    messages.push(`👁 <em>Indexed wound</em> — the Sentinel exploits what it recorded for <strong>${dmg}</strong>!`)
    triggerAnimation(ANIM.PULSE)
    return { anim: ANIM.PULSE }
  }

  const pool = enemyState.phase === 3 ? phase3Moves : enemyState.phase === 2 ? phase2Moves : phase1Moves
  const move = pickWeighted(pool)
  const anim = move.exec()
  return { anim }
}

// ── The Surveyor — methodical, predictive, click-counting ────────────────────
function _boss_surveyor(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, onEnemyHealSelf, playerDEF, defending, statusEffects: se } = ctx

  // Phase transitions
  if (hpPct < 0.60 && enemyState.phase === 1) {
    enemyState.phase = 2
    enemy.atk = Math.round(enemy.atk * 1.15)
    messages.push(`🔭 <strong>SURVEYOR RECALIBRATES — lenses click faster. Phase 2. Data complete.</strong>`)
    triggerAnimation(ANIM.VOID)
  }
  if (hpPct < 0.25 && enemyState.phase === 2) {
    enemyState.phase = 3
    messages.push(`🔭 <strong>All lenses shattering — Surveyor enters final assessment. Phase 3.</strong>`)
    triggerAnimation(ANIM.TERROR)
  }

  // Lock-in mechanic: Surveyor observes 2 turns, then fires devastating follow-up
  if (enemyState.surveyorLockIn !== null) {
    enemyState.surveyorLockIn++
    if (enemyState.surveyorLockIn >= 2) {
      enemyState.surveyorLockIn = null
      // Pinpoint: ignores ALL DEF
      const dmg = Math.max(5, enemy.atk * 2 + Math.floor(Math.random()*6))
      onEnemyDmgPlayer(dmg)
      messages.push(`🔭 ⚡ <strong>PINPOINT ASSESSMENT</strong> — every weakness catalogued. <strong>${dmg}</strong>! DEF ignored.`)
      triggerAnimation(ANIM.TERROR)
      return { anim: ANIM.TERROR }
    }
    // Still observing — applies a measurement tick
    const dmg = baseDmg(enemy.atk * 0.4, playerDEF, se, defending, 1)
    onEnemyDmgPlayer(dmg)
    messages.push(`🔭 <em>CLICK. CLICK.</em> Surveyor measures… (assessing turn ${enemyState.surveyorLockIn}) — <strong>${dmg}</strong> incidental.`)
    triggerAnimation(ANIM.GOLD)
    return { anim: ANIM.GOLD }
  }

  const phase1Moves = [
    {
      key: 'measuring_strike', weight: 4,
      exec() {
        const dmg = baseDmg(enemy.atk, playerDEF, se, defending, 3)
        onEnemyDmgPlayer(dmg)
        messages.push(`🔭 <em>Measuring strike</em> — click click — <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.SHAKE)
        return ANIM.SHAKE
      },
    },
    {
      key: 'begin_assessment', weight: 2,
      exec() {
        enemyState.surveyorLockIn = 0
        messages.push(`🔭 Surveyor <em>begins full assessment</em> — lenses rotating… (2 turns to pinpoint)`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
    {
      key: 'lens_burst', weight: 1,
      exec() {
        const dmg = baseDmg(enemy.atk * 1.4, playerDEF, se, defending, 2)
        onEnemyDmgPlayer(dmg)
        messages.push(`🔭 <em>Lens burst</em> — refracted strike for <strong>${dmg}</strong>!`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
  ]

  const phase2Moves = [
    {
      key: 'data_strike', weight: 3,
      exec() {
        // Hits harder against low-DEF players (the Surveyor noticed your weakness)
        const def = effectiveDEF(playerDEF, se, defending)
        const mult = def < 10 ? 1.4 : 1.0
        const dmg  = baseDmg(enemy.atk * mult, playerDEF, se, defending, 4)
        onEnemyDmgPlayer(dmg)
        messages.push(`🔭 <em>Data-driven strike</em> — exploiting recorded weakness for <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.PULSE)
        return ANIM.PULSE
      },
    },
    {
      key: 'full_assessment', weight: 2,
      exec() {
        enemyState.surveyorLockIn = 0
        const dmg = baseDmg(enemy.atk * 0.5, playerDEF, se, defending, 1)
        onEnemyDmgPlayer(dmg)
        messages.push(`🔭 <em>Full assessment initiated</em> — CLICK CLICK CLICK. <strong>${dmg}</strong> precision tap.`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
    {
      key: 'slow_calculation', weight: 1,
      exec() {
        applySlow(se, 2, messages)
        applyBleed(se, 4, 2, messages)
        const dmg = baseDmg(enemy.atk * 0.8, playerDEF, se, defending, 2)
        onEnemyDmgPlayer(dmg)
        messages.push(`🔭 <em>Slow calculation protocol</em> — <strong>${dmg}</strong> + slow + bleed.`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
  ]

  const phase3Moves = [
    {
      key: 'lens_shatter', weight: 2,
      exec() {
        // Lenses shatter — uncontrolled, high-variance
        const min = Math.max(1, Math.floor(enemy.atk * 0.5))
        const max = Math.round(enemy.atk * 2.5)
        const dmg = min + Math.floor(Math.random() * (max - min))
        onEnemyDmgPlayer(dmg)
        messages.push(`🔭 <em>Lens shatter</em> — uncontrolled refraction for <strong>${dmg}</strong>!`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
    {
      key: 'final_verdict', weight: 1,
      exec() {
        const dmg = baseDmg(enemy.atk * 1.8, playerDEF, se, false, 0)
        onEnemyDmgPlayer(dmg)
        messages.push(`🔭 <strong>FINAL VERDICT</strong> — assessment complete. <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
  ]

  const pool = enemyState.phase === 3 ? phase3Moves : enemyState.phase === 2 ? phase2Moves : phase1Moves
  const move = pickWeighted(pool)
  const anim = move.exec()
  return { anim }
}

// ── The Unseen — distributed, invisible, consolidating ───────────────────────
function _boss_unseen(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, onEnemyHealSelf, playerDEF, defending, statusEffects: se } = ctx

  // Phase transitions
  if (hpPct < 0.55 && enemyState.phase === 1) {
    enemyState.phase = 2
    enemyState.unseenVisible = false
    messages.push(`👤 <strong>The Unseen disperses — it is everywhere and nowhere. Phase 2.</strong>`)
    triggerAnimation(ANIM.VOID)
  }
  if (hpPct < 0.25 && enemyState.phase === 2) {
    enemyState.phase = 3
    messages.push(`👤 <strong>Something vast and patient is about to become visible. Phase 3 — final form.</strong>`)
    triggerAnimation(ANIM.TERROR)
  }

  // Consolidation mechanic: The Unseen randomly becomes visible (targetable / weaker)
  // If it's consolidated: take normal dmg. If dispersed: dmg to player is reduced but can't be targeted well.
  // We track this in enemyState.unseenVisible.
  // Every 2 turns: roll to consolidate.
  if (enemyState.turnCount % 2 === 0) {
    enemyState.unseenVisible = Math.random() < 0.45
  }

  const phase1Moves = [
    {
      key: 'shimmer_strike', weight: 4,
      exec() {
        // Dispersed: hits from unexpected angle, Defend barely helps
        const defFraction = enemyState.unseenVisible ? 1.0 : 0.35
        const def = Math.floor(effectiveDEF(playerDEF, se, defending) * defFraction)
        const dmg = Math.max(1, enemy.atk + Math.floor(Math.random()*4) - def)
        onEnemyDmgPlayer(dmg)
        const label = enemyState.unseenVisible ? 'visible strike' : 'shimmer from nowhere'
        messages.push(`👤 <em>${label.charAt(0).toUpperCase() + label.slice(1)}</em> — <strong>${dmg}</strong>.${!enemyState.unseenVisible ? ' (Dispersed — hard to block.)' : ''}`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
    {
      key: 'disperse', weight: 2,
      exec() {
        // Deliberately disperses — no damage, but becomes harder to hit next round
        enemyState.unseenVisible = false
        ctx.onEnemyHealSelf(Math.floor(enemy.atk * 0.3))
        messages.push(`👤 The Unseen <em>disperses</em> through the walls — you can't find it. It recovers slightly.`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
    {
      key: 'half_presence', weight: 1,
      exec() {
        // Partial consolidation — medium hit, sets up consolidate next
        const dmg = baseDmg(enemy.atk * 0.8, playerDEF, se, defending, 3)
        onEnemyDmgPlayer(dmg)
        enemyState.consolidating = true
        messages.push(`👤 <em>Half-presence</em> — <strong>${dmg}</strong>. Something is coalescing…`)
        triggerAnimation(ANIM.PULSE)
        return ANIM.PULSE
      },
    },
  ]

  const phase2Moves = [
    {
      key: 'distributed_strike', weight: 3,
      exec() {
        // Multiple simultaneous edges
        const hits = 2 + Math.floor(Math.random()*2)
        const defFraction = 0.4 // hard to block distributed
        const def = Math.floor(effectiveDEF(playerDEF, se, defending) * defFraction)
        const dmgPer = Math.max(1, Math.floor(enemy.atk * 0.65) - def)
        onEnemyDmgPlayer(dmgPer * hits)
        messages.push(`👤 <em>Distributed strike</em> — ${hits} edges from every wall, ${dmgPer} each = <strong>${dmgPer*hits}</strong>.`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
    {
      key: 'consolidate_and_strike', weight: 3,
      exec() {
        // Consolidates for a massive hit — the window the narrative describes
        enemyState.unseenVisible = true
        const dmg = baseDmg(enemy.atk * 1.6, playerDEF, se, defending, 3)
        onEnemyDmgPlayer(dmg)
        messages.push(`👤 The Unseen <em>consolidates</em> — a half-second of substance. <strong>${dmg}</strong>! Hit it NOW.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
    {
      key: 'terror_of_formlessness', weight: 1,
      exec() {
        applyTerror(se, 2, messages)
        applyDefShred(se, 6, 2, messages)
        const dmg = baseDmg(enemy.atk, playerDEF, se, defending, 2)
        onEnemyDmgPlayer(dmg)
        messages.push(`👤 <em>Terror of Formlessness</em> — the unknown strikes for <strong>${dmg}</strong>. Skills disrupted.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
  ]

  const phase3Moves = [
    {
      key: 'becoming_visible', weight: 2,
      exec() {
        // Phase 3: The Unseen becomes real. Highest single hit.
        enemyState.unseenVisible = true
        const dmg = baseDmg(enemy.atk * 1.9, playerDEF, se, false, 4) // ignores defend
        onEnemyDmgPlayer(dmg)
        messages.push(`👤 <strong>The Unseen BECOMES VISIBLE</strong> — tall, architectural, ancient. <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
    {
      key: 'final_dispersal', weight: 1,
      exec() {
        // Scatters back — massive distributed hit, then reforms
        const h1 = baseDmg(enemy.atk * 0.8, playerDEF, se, defending, 2)
        const h2 = baseDmg(enemy.atk * 0.8, playerDEF, se, defending, 2)
        onEnemyDmgPlayer(h1 + h2)
        messages.push(`👤 <em>Final dispersal</em> — every surface strikes at once. ${h1} + ${h2} = <strong>${h1+h2}</strong>.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
  ]

  const pool = enemyState.phase === 3 ? phase3Moves : enemyState.phase === 2 ? phase2Moves : phase1Moves
  const move = pickWeighted(pool)
  const anim = move.exec()
  return { anim }
}

// ── The Watcher — final boss, 3-phase choreography ───────────────────────────
function _boss_watcher(enemy, ctx, hpPct) {
  const { enemyState, messages, triggerAnimation, onEnemyDmgPlayer, onEnemyHealSelf, playerDEF, defending, statusEffects: se, yara } = ctx

  // Phase gates
  if (hpPct < 0.70 && enemyState.phase === 1) {
    enemyState.phase = 2
    enemy.atk = Math.round(enemy.atk * 1.15)
    messages.push(`👁 <strong>THE WATCHER BLINKS. The second eye opens. Phase 2 — full attention.</strong>`)
    triggerAnimation(ANIM.TERROR)
    return { anim: ANIM.TERROR }
  }
  if (hpPct < 0.35 && enemyState.phase === 2) {
    enemyState.phase = 3
    enemy.atk = Math.round(enemy.atk * 1.2)
    messages.push(`👁 <strong>THE WATCHER SEES ALL. Phase 3 — final judgment. The sky is tearing.</strong>`)
    triggerAnimation(ANIM.TERROR)
    return { anim: ANIM.TERROR }
  }

  // ── Phase 1 — Observation. Measured. Establishing dominance.
  const phase1 = [
    // Turn 1: always opens with this
    {
      key: 'opening_gaze', turns: [1],
      exec() {
        const dmg = baseDmg(enemy.atk * 0.8, playerDEF, se, defending, 3)
        onEnemyDmgPlayer(dmg)
        messages.push(`👁 <em>The Opening Gaze</em> — it knows your name before you've spoken it. <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
    {
      key: 'recorded', weight: 3,
      exec() {
        const dmg = baseDmg(enemy.atk, playerDEF, se, defending, 4)
        onEnemyDmgPlayer(dmg)
        messages.push(`👁 <em>Recorded</em> — every wound you've taken, every choice made. <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.FLASH)
        return ANIM.FLASH
      },
    },
    {
      key: 'verdict_pending', weight: 2,
      exec() {
        // No damage — The Watcher studies you. But it marks you.
        enemyState.watcherMarked = true
        messages.push(`👁 The Watcher <em>studies you silently</em> — verdict pending. It is measuring everything.`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
    {
      key: 'pressure_of_being_seen', weight: 2,
      exec() {
        const dmg = baseDmg(enemy.atk * 1.2, playerDEF, se, defending, 3)
        onEnemyDmgPlayer(dmg)
        applyTerror(se, 1, messages)
        messages.push(`👁 <em>The pressure of being seen</em> — an ancient weight for <strong>${dmg}</strong>. Skills momentarily disrupted.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
    {
      key: 'iris_contract', weight: 1,
      exec() {
        // Iris contracts — summons a tiny Eye that hits for bonus next turn
        enemyState.watcherEyeCount++
        const dmg = baseDmg(enemy.atk * 0.6, playerDEF, se, defending, 2)
        onEnemyDmgPlayer(dmg)
        enemyState.orbitalEye = true
        messages.push(`👁 The iris contracts — a fragment detaches. <strong>${dmg}</strong> + an Eye now orbits.`)
        triggerAnimation(ANIM.VOID)
        return ANIM.VOID
      },
    },
  ]

  // ── Phase 2 — Full attention. Rotates predictably — player can learn it.
  const phase2Rotation = ['retinal_press', 'recorded_weakness', 'full_attention', 'blink']
  const p2Move = phase2Rotation[enemyState.rotationIndex % phase2Rotation.length]
  enemyState.rotationIndex++

  const phase2Exec = {
    retinal_press() {
      const dmg = baseDmg(enemy.atk * 1.2, playerDEF, se, defending, 4)
      onEnemyDmgPlayer(dmg)
      messages.push(`👁 <em>Retinal Press</em> — the gaze bears down for <strong>${dmg}</strong>.`)
      triggerAnimation(ANIM.FLASH)
      return ANIM.FLASH
    },
    recorded_weakness() {
      // Targets the player's specific weakness — DEF shred then immediate follow-up
      applyDefShred(se, 6, 2, messages)
      const dmg = baseDmg(enemy.atk * 0.8, playerDEF, se, defending, 2)
      onEnemyDmgPlayer(dmg)
      messages.push(`👁 <em>Recorded Weakness</em> — the Watcher found it. <strong>${dmg}</strong> + armour shred.`)
      triggerAnimation(ANIM.VOID)
      return ANIM.VOID
    },
    full_attention() {
      // Ignores 70% of DEF — the Watcher sees through everything
      const def = Math.floor(effectiveDEF(playerDEF, se, defending) * 0.30)
      const dmg = Math.max(1, enemy.atk + 8 + Math.floor(Math.random()*5) - def)
      onEnemyDmgPlayer(dmg)
      messages.push(`👁 <strong>FULL ATTENTION</strong> — nothing is hidden from it. <strong>${dmg}</strong>!`)
      triggerAnimation(ANIM.TERROR)
      return ANIM.TERROR
    },
    blink() {
      // Watcher blinks — brief respite, but sends an Eye ahead
      enemyState.orbitalEye = true
      messages.push(`👁 The Watcher <em>blinks</em> — one moment of absence. A fragment launches toward you.`)
      triggerAnimation(ANIM.VOID)
      return ANIM.VOID
    },
  }

  // ── Phase 3 — Judgment. Relentless. Personal.
  const phase3Moves = [
    {
      key: 'the_verdict', weight: 3,
      exec() {
        // Verdict: damage scales inversely with player's moral score — the Watcher knows
        const moral   = (ctx.playerMoral || 0)
        const moralMult = moral >= 50 ? 0.80 : moral >= 0 ? 1.0 : moral >= -50 ? 1.20 : 1.40
        const dmg     = baseDmg(enemy.atk * moralMult, playerDEF, se, defending, 4)
        onEnemyDmgPlayer(dmg)
        const moralLabel = moral >= 50 ? 'The Watcher sees your choices. It hesitates.'
          : moral >= 0 ? 'The Watcher weighs you.'
          : moral >= -50 ? 'The Watcher judges you harshly.'
          : 'The Watcher has already decided.'
        messages.push(`👁 <em>The Verdict</em> — "${moralLabel}" — <strong>${dmg}</strong>.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
    {
      key: 'total_recall', weight: 2,
      exec() {
        // Recall every hit player has taken — hits for 1 per HP lost
        const hpLost = Math.max(0, ctx.maxPlayerHp - ctx.currentHp)
        const dmg    = Math.max(3, Math.floor(hpLost * 0.20) + Math.floor(Math.random()*6))
        onEnemyDmgPlayer(dmg)
        messages.push(`👁 <em>Total Recall</em> — it replays every wound for <strong>${dmg}</strong>. (Scales with your injuries.)`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
    {
      key: 'the_eye_closes', weight: 1,
      exec() {
        // Telegraphed big hit
        if (!enemyState.closingEye) {
          enemyState.closingEye = true
          messages.push(`👁 <strong>The pupil contracts. The Watcher prepares to end this.</strong>`)
          triggerAnimation(ANIM.VOID)
          return ANIM.VOID
        }
        enemyState.closingEye = false
        const dmg = Math.max(10, enemy.atk * 2.5 - Math.floor(effectiveDEF(playerDEF, se, defending) * 0.2))
        onEnemyDmgPlayer(dmg)
        messages.push(`👁 ⚡ <strong>THE EYE CLOSES — </strong><strong>${dmg}</strong>. A silence like the end of something.`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
    {
      key: 'yara_targeting', weight: yara?.alive ? 2 : 0,
      exec() {
        // The Watcher targets Yara specifically — forces moral choice
        if (!yara || !yara.alive) return ANIM.NONE
        const yaraDmg = Math.round(enemy.atk * 0.7)
        yara.hp = Math.max(0, yara.hp - yaraDmg)
        if (yara.hp <= 0) yara.alive = false
        messages.push(`👁 <em>The Watcher turns its full gaze on Yara</em> — <strong>${yaraDmg}</strong> directed at your ally.${yara.alive ? ` (${yara.hp} HP left)` : ' She falls.'}`)
        triggerAnimation(ANIM.TERROR)
        return ANIM.TERROR
      },
    },
  ]

  // ── Marked follow-through
  if (enemyState.watcherMarked) {
    enemyState.watcherMarked = false
    const dmg = baseDmg(enemy.atk * 1.6, playerDEF, se, defending, 3)
    onEnemyDmgPlayer(dmg)
    messages.push(`👁 <em>Verdict delivered</em> — the Watcher acts on what it saw. <strong>${dmg}</strong>!`)
    triggerAnimation(ANIM.TERROR)
    return { anim: ANIM.TERROR }
  }

  // ── Orbital Eye strikes in addition to main move (once active)
  if (enemyState.orbitalEye) {
    enemyState.orbitalEye = false
    const eyeDmg = Math.max(1, Math.floor(enemy.atk * 0.35) - Math.floor(effectiveDEF(playerDEF, se, defending) * 0.5))
    onEnemyDmgPlayer(eyeDmg)
    messages.push(`👁 <em>Orbital Eye strikes</em> — <strong>${eyeDmg}</strong> additional!`)
  }

  let anim = ANIM.SHAKE
  if (enemyState.phase === 1) {
    // First turn: force opening gaze
    const forced = enemyState.turnCount === 1 ? phase1.find(m => m.key === 'opening_gaze') : null
    const move   = forced || pickWeighted(phase1.filter(m => !m.turns))
    anim = move.exec()
  } else if (enemyState.phase === 2) {
    anim = phase2Exec[p2Move]?.() || ANIM.SHAKE
  } else {
    const move = pickWeighted(phase3Moves.filter(m => m.weight > 0))
    anim = move.exec()
  }

  return { anim }
}
