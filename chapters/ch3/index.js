// chapters/ch3/index.js — Chapter 3 "Signal Hunters" engine
//
// Linear-ish descent through metro tunnels. Puzzle-gated paths. Echo
// Beast boss at the bottom.
//
// SCOPE:
//   - Story node rendering (text + choices, same shape as Ch2)
//   - Puzzle node handling (delegates to puzzles.js)
//   - Save/load via player.current_node_ch3
//   - HUD reuse via the same 6-tier reputation module
//
// NOT YET WIRED:
//   - Combat (Echo Beast). Adding when we get to the boss node.
//   - Hidden caches (signal_strength-gated). Stubbed in NODES.
//   - PvP / lobby integration (not needed for SP chapter content)

import { supabase } from '../../supabase.js'
import {
  getMoralTier,
  getMoralBarPct,
  applyMoralChange,
} from '../../data/reputation.js'
import { runRiddle }     from '../../data/puzzle-riddle.js'
import { runSequence }   from '../../data/puzzle-sequence.js'
import { runVoiceDiscrimination } from '../../data/puzzle-voice.js'
import { META, signalTier } from './config.js'
import { NODES } from './nodes.js'

const $ = (id) => document.getElementById(id)

// xpForLevel — mirror Ch2 formula so leveling stays consistent across
// chapters. If Ch2 ever changes this, we change it here too.
function xpForLevel(lvl) {
  return Math.floor(100 * Math.pow(1.5, (lvl||1) - 1))
}

// book.html mounts modules by calling `mod.default || mod.mount`, so we
// export the chapter mount function as `mount`. Also keep the named
// alias `mountCh3` for window-global consistency with Ch1/Ch2 patterns.
export async function mount(__mountOptions = {}) {
  return mountCh3(__mountOptions)
}

async function mountCh3(__mountOptions = {}) {
  const host = __mountOptions.host || document.getElementById('book-module-host') || document.body
  const player = __mountOptions.player || await window.renderNav('nav')
  if (!player) throw new Error('Ch3 mount: no player')

  // Inject the page DOM. Same layout shape as Ch1/Ch2 (two-page book
  // with HUD on the right, story on the left). The renderHUD and
  // renderNode functions below target #hud and #story-panel by id.
  host.innerHTML = `
    <div class="book-wrap">
      <div class="book animate-in" style="position:relative;">
        <div class="page-left parchment">
          <div class="page-inner">
            <p class="chapter-label">Chapter ${META.number} — ${META.title}</p>
            <p class="chapter-sub">${META.sub || ''}</p>
            <hr class="ink-divider">
            <div id="story-panel"></div>
          </div>
        </div>
        <div class="page-right parchment">
          <div class="page-inner">
            <div class="hud" id="hud"></div>
          </div>
        </div>
      </div>
    </div>
  `

  // First-visit bootstrap: if the player has no Ch3 progress, plant them
  // at the entry node. signal_strength defaults to 0.
  if (!player.current_node_ch3) {
    await supabase.from('players')
      .update({ current_node_ch3: 'ch3_entry', signal_strength: 0 })
      .eq('id', player.id)
    player.current_node_ch3 = 'ch3_entry'
    player.signal_strength  = 0
  }

  // Render the HUD on the left page. Same shape as Ch2 — uses the shared
  // 6-tier reputation tier helpers.
  function renderHUD() {
    const hp  = player.hp || player.max_hp || 100
    const mhp = player.max_hp || 100
    const xp  = player.xp || 0
    const lvl = player.level || 1
    const hpPct = Math.max(0, Math.round(hp / mhp * 100))
    const hpCol = hpPct > 60 ? '#5ec45e' : hpPct > 30 ? '#c8b96e' : '#e05555'
    const xpNext = xpForLevel(lvl)
    const xpPct  = Math.min(100, Math.round(Math.min(xp, xpNext-1) / xpNext * 100))
    const tier   = getMoralTier(player.moral_score)
    const moralPct = getMoralBarPct(player.moral_score)
    const dotLeft  = Math.max(2, Math.min(94, moralPct))

    // Signal strength bar — Ch3-specific. Replaces the rep position in
    // visual prominence; rep stays below in the standard slot.
    const sig    = player.signal_strength || 0
    const sigTier = signalTier(sig)
    const sigPct = Math.min(100, Math.max(0, sig))
    const sigCol = sigTier === 'lock'    ? '#a08aff'
                 : sigTier === 'strong'  ? '#7ab8e0'
                 : sigTier === 'present' ? '#c8b96e'
                 :                         '#5c4638'

    $('hud').innerHTML = `
      <div class="hud-badge-row">
        <span class="hud-seal">${tier.seal}</span>
        <div>
          <p class="hud-seal-label" style="color:${tier.color}">${tier.label}</p>
          <p class="hud-chapter">Chapter ${META.number} · Lvl ${lvl}</p>
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-key">HP</span>
        <div class="stat-bar-wrap"><div class="stat-bar" style="width:${hpPct}%;background:${hpCol}"></div></div>
        <span class="stat-val">${hp}/${mhp}</span>
      </div>
      <div class="stat-row">
        <span class="stat-key">XP</span>
        <div class="stat-bar-wrap"><div class="stat-bar" style="width:${xpPct}%;background:#7a5cb0"></div></div>
        <span class="stat-val">${xp}/${xpNext}</span>
      </div>
      <div style="margin-top:.75rem;padding-top:.5rem;border-top:1px solid rgba(138,91,68,.25)">
        <div style="display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:.55rem;letter-spacing:.1em;margin-bottom:.25rem">
          <span style="color:var(--ink-dim)">SIGNAL</span>
          <span style="color:${sigCol};font-weight:600">${sigTier.toUpperCase()}</span>
        </div>
        <div style="height:5px;background:rgba(0,0,0,.1);position:relative;overflow:hidden">
          <div style="width:${sigPct}%;height:100%;background:${sigCol};transition:width .5s,background .5s"></div>
        </div>
      </div>
      <div style="margin-top:.75rem">
        <div style="display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:.5rem;letter-spacing:.1em;margin-bottom:.2rem">
          <span style="color:var(--ink-dim)">REPUTATION</span>
          <span style="color:${tier.color};font-weight:600">${tier.label.toUpperCase()}</span>
        </div>
        <div style="position:relative;height:5px;background:linear-gradient(to right,#e05555,#e07a40,#c8b96e,#c8e8a0,#a0d0ff)">
          <div style="position:absolute;top:-2px;left:${dotLeft}%;width:9px;height:9px;background:${tier.color};border-radius:50%;transform:translateX(-50%);border:1px solid rgba(0,0,0,.3);transition:left .5s,background .5s"></div>
        </div>
      </div>
    `
  }

  // ── Node renderer ──────────────────────────────────────────────────
  // Three node types: 'story' (text + choices), 'puzzle' (delegates to
  // puzzles.js), 'combat' (stub — wires in when boss node is reached).
  async function goTo(nodeId, choice = {}) {
    const node = NODES[nodeId]
    if (!node) {
      console.error(`[ch3] missing node: ${nodeId}`)
      return
    }

    // Apply choice side effects (moral, xp, signal, rewards) before
    // navigating. Mirrors Ch2's flow.
    const updates = { current_node_ch3: nodeId }

    if (choice.moral) {
      const r = applyMoralChange(player, choice.moral)
      Object.assign(updates, r.updates)
    }
    if (choice.signal) {
      const ns = Math.max(0, Math.min(100, (player.signal_strength||0) + choice.signal))
      player.signal_strength = ns
      updates.signal_strength = ns
    }
    if (choice.xp) {
      player.xp = (player.xp || 0) + choice.xp
      updates.xp = player.xp
    }

    // Node-level entry effects. Used by failure/success nodes that need
    // to apply consequences regardless of HOW the player arrived (e.g.
    // voice-gate failure docks HP; chapter-ending unlocks Ch4).
    if (node.onEnter) {
      if (typeof node.onEnter.hp === 'number') {
        const newHp = Math.max(0, (player.hp || 100) + node.onEnter.hp)
        player.hp = newHp
        updates.hp = newHp
      }
      if (typeof node.onEnter.unlockChapter === 'number') {
        const unl = player.chapters_unlocked || [1]
        const n   = node.onEnter.unlockChapter
        if (!unl.includes(n)) {
          const merged = [...unl, n]
          player.chapters_unlocked = merged
          updates.chapters_unlocked = merged
        }
      }
    }

    // Save before rendering so a reload picks up here. Use upsert via
    // update — Ch3 fields are added to the existing players row.
    try {
      await supabase.from('players').update(updates).eq('id', player.id)
    } catch (e) {
      console.error('[ch3] save failed', e)
    }

    player.current_node_ch3 = nodeId
    renderHUD()

    // Terminal node — chapter is over. Navigate back to book TOC. The
    // chapters_unlocked update already happened at the previous node's
    // onEnter (ch3_ending), so the player will see Ch4 unlocked.
    if (node.type === 'complete') {
      if (window.bookNavigate) window.bookNavigate('book.html')
      else location.href = './book.html'
      return
    }

    renderNode(node, nodeId)
  }

  function renderNode(node, nodeId) {
    const panel = $('story-panel')

    if (node.type === 'puzzle') {
      // Delegate. The chapter doesn't know what the puzzle DOES — only
      // that it resolves. Win/lose route to onWin/onLose nodes.
      const cfg = node.puzzleConfig || {}
      let fn
      if      (node.puzzleType === 'voice')    fn = runVoiceDiscrimination
      else if (node.puzzleType === 'sequence') fn = runSequence
      else                                     fn = runRiddle
      fn(panel, cfg,
         () => goTo(node.onWin,  node.winChoice  || {}),
         () => goTo(node.onLose, node.loseChoice || {}))
      return
    }

    // Story node — text + choices. Future: combat nodes get a different
    // branch here.
    const text = (node.text || '').replace(/\[YOUR NAME\]/g, player.username || 'Player')
    const choicesHTML = (node.choices || []).map((c, i) => `
      <button class="choice" data-choice="${i}">
        <span class="choice-arrow">→</span>
        <span class="choice-body">
          ${c.label}
          ${c.sub ? `<span class="choice-sub">${c.sub}</span>` : ''}
        </span>
      </button>
    `).join('')

    panel.innerHTML = `
      <div class="story-text drop-cap">${text}</div>
      ${node.rewards ? `<div class="notice-box">REWARDS: ${node.rewards.map(r => `${r.itemKey} ×${r.qty}`).join(' · ')}</div>` : ''}
      <div style="margin-top:1.2rem">
        <div class="choices-label">— Choose your action —</div>
        <div class="choices">${choicesHTML}</div>
      </div>
    `

    panel.querySelectorAll('button.choice').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const c = node.choices[i]
        goTo(c.next, c)
      })
    })
  }

  // Initial render.
  renderHUD()
  const currentNode = NODES[player.current_node_ch3] || NODES['ch3_entry']
  renderNode(currentNode, player.current_node_ch3 || 'ch3_entry')
}

// Expose for legacy nav code that calls window.mountCh3.
window.mountCh3 = mountCh3
