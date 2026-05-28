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
import { initEnemyState, resolveEnemyTurn } from '../../data/enemyAI.js'
import { ITEM_IMAGES } from './items.js'
import { META, signalTier, signalTierMeta } from './config.js'
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

  // ── Layout: parchment two-page book, story-left, HUD+choices right ──
  // Matches Ch1/Ch2 visual convention. Right page splits into HUD on
  // top and a #right-panel below for choices (and puzzle UI when puzzle
  // nodes render). Signal feed lives inside the HUD as its own block.
  host.innerHTML = `
    <div class="book-wrap">
      <div class="book animate-in" style="position:relative;">
        <div class="page-left parchment" id="left-page">
          <div class="page-inner">
            <p class="chapter-label">Chapter ${META.number} — ${META.title}</p>
            <p class="chapter-sub">${META.sub || ''}</p>
            <hr class="ink-divider">
            <p class="story-text" id="story-text"></p>
          </div>
        </div>
        <div class="page-right parchment">
          <div class="page-inner">
            <div class="hud" id="hud"></div>
            <hr class="ink-divider">
            <div id="right-panel"></div>
          </div>
        </div>
        <div class="page-flip-decorator" aria-hidden="true"></div>
      </div>
    </div>
  `

  // ── Parchment book theme (shared with Ch1) ──────────────────
  // Same parchment two-page layout and styling Ch1 uses. We install
  // it under a stable id so multiple chapters don't duplicate it.
  if (!document.getElementById('parchment-book-styles')) {
    const ps = document.createElement('style')
    ps.id = 'parchment-book-styles'
    ps.textContent = "\n    /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n       PARCHMENT BOOK THEME \u2014 Warm Ink / Aged Paper\n       Matches the interactive book page-flip UI.\n    \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n       :root {\n      --bg-0:      #14110f;\n      --bg-1:      #2b1d16;\n      --panel:     #f4ead7;\n      --page-l:    #f4ead7;\n      --page-r:    #f1e4cf;\n      --ink:       #2b1d16;\n      --ink-dim:   #5c4638;\n      --ink-faint: #a08060;\n      --ice:       #7a5230;\n      --ice-hot:   #4b2e14;\n      --gold:      #c8a050;\n      --gold-hot:  #e0c070;\n      --gold-dim:  #a08040;\n      --amber:     #d09040;\n      --amber-hot: #e0a050;\n      --warn:      #e06050;\n      --line:      rgba(200,160,80,.30);\n      --green:     #5cae50;\n      --purple:    #8a50c0;\n      --spine-col: #2b1d16;\n    }\n    *, *::before, *::after { box-sizing: border-box; }\n\n    /* \u2500\u2500 Global reset \u2500\u2500 */\n    html, body {\n      background: radial-gradient(ellipse at 50% 0%, #2a1a0e 0%, #14110f 55%, #0d0b09 100%) !important;\n      color: var(--ink) !important;\n      font-family: 'Cormorant Garamond', Georgia, serif !important;\n      min-height: 100vh;\n      overflow-x: hidden;\n    }\n\n    /* Warm ambient glow */\n    body::after {\n      content: \"\"; position: fixed; inset: 0; pointer-events: none; z-index: 9998;\n      background: radial-gradient(ellipse 900px 900px at 50% 40%, rgba(180,120,60,.07) 0%, transparent 70%);\n    }\n\n    /* \u2500\u2500 Book wrap \u2500\u2500 */\n    .book-wrap {\n      background: transparent !important;\n      max-width: 1060px;\n      margin: 0 auto;\n      padding: 24px 24px 60px;\n    }\n\n    /* \u2500\u2500 Book \u2014 warm parchment open-book \u2500\u2500 */\n    .book {\n      display: grid !important;\n      grid-template-columns: 1fr 1fr !important;\n      align-items: stretch !important;\n      gap: 0 !important;\n      background: transparent !important;\n      border: none !important;\n      box-shadow: none !important;\n      border-radius: 24px !important;\n      filter: drop-shadow(0 24px 60px rgba(0,0,0,.75)) drop-shadow(0 8px 20px rgba(0,0,0,.5)) !important;\n      transform: perspective(1600px) rotateX(2.5deg) !important;\n      transform-origin: 50% 0 !important;\n      margin-top: 10px !important;\n      overflow: hidden !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n    }\n    @media(max-width: 860px) {\n      .book { grid-template-columns: 1fr !important; transform: none !important; max-height: none !important; border-radius: 12px !important; }\n    }\n\n    /* \u2500\u2500 Pages \u2500\u2500 */\n    .parchment, .page-left, .page-right {\n      background: var(--panel) !important;\n      border: none !important;\n      border-radius: 0 !important;\n      box-shadow: none !important;\n      color: var(--ink) !important;\n      position: relative;\n      overflow-y: auto;\n      overflow-x: hidden;\n    }\n    /* Dot-texture paper grain */\n    .page-left::before, .page-right::before {\n      content: \"\" !important;\n      position: absolute !important; inset: 0 !important;\n      pointer-events: none !important; z-index: 0 !important;\n      opacity: .08 !important;\n      background-image: radial-gradient(circle, rgba(0,0,0,.25) 1px, transparent 1px) !important;\n      background-size: 12px 12px !important;\n    }\n    .page-left  { border-right: none !important; background: var(--page-l) !important; }\n    .page-right { border-left:  none !important; background: var(--page-r) !important; }\n\n    /* Spine-edge shadow */\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n\n    /* Decorative corner brackets */\n    .page-inner { padding: 28px 30px !important; position: relative; }\n    .page-inner::before {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 14px !important; left: 14px !important;\n      width: 28px !important; height: 28px !important;\n      border-left: 1.5px solid rgba(138,91,68,.45) !important;\n      border-top: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-inner::after {\n      content: \"\" !important;\n      position: absolute !important;\n      bottom: 14px !important; right: 14px !important;\n      width: 28px !important; height: 28px !important;\n      border-right: 1.5px solid rgba(138,91,68,.45) !important;\n      border-bottom: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-left  { border-right: none !important; background: var(--page-l) !important; }\n    .page-right { border-left:  none !important; background: var(--page-r) !important; }\n\n    .spine-inner, .spine-highlight, .spine-shadow,\n    .spine-title, .spine-rule, .spine-diamond, .spine-chapter { display: none !important; }\n\n    /* \u2500\u2500 Chapter label / subtitle \u2500\u2500 */\n    .chapter-label {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 9.5px !important;\n      letter-spacing: .42em !important;\n      text-transform: uppercase !important;\n      color: var(--ink) !important;\n      margin-bottom: 5px !important;\n    }\n    .chapter-sub {\n      font-size: 17px !important;\n      font-style: italic !important;\n      color: var(--ink) !important;\n      margin-bottom: 0 !important;\n    }\n\n        /* \u2500\u2500 Divider \u2500\u2500 */\n    .ink-divider, hr.ink-divider {\n      border: none !important;\n      border-top: 1px solid rgba(200,180,120,.40) !important;\n      margin: 12px 0 !important;\n      opacity: 1 !important;\n    }\n\n    /* \u2500\u2500 Body text colour remaps \u2500\u2500 */\n    p, li, span { color: var(--ink) !important; }\n    [style*=\"color:var(--ink)\"] { color: var(--ink) !important; }\n    [style*=\"color:var(--ink-dim)\"] { color: var(--ink-dim) !important; }\n    /* Normalize stale light-yellow inline colors on parchment pages only. */\n    .parchment [style*=\"color:#c8b96e\"], .parchment [style*=\"color: #c8b96e\"],\n    .parchment [style*=\"color:#c8b880\"], .parchment [style*=\"color: #c8b880\"],\n    .parchment [style*=\"color:#f0d060\"], .parchment [style*=\"color: #f0d060\"],\n    .parchment [style*=\"color:#e8d8b0\"], .parchment [style*=\"color: #e8d8b0\"],\n    .parchment [style*=\"color:#f0e0c0\"], .parchment [style*=\"color: #f0e0c0\"],\n    .parchment [style*=\"color:#f0c080\"], .parchment [style*=\"color: #f0c080\"],\n    .parchment [style*=\"color:#a08858\"], .parchment [style*=\"color: #a08858\"],\n    .parchment [style*=\"color:#e8d8a8\"], .parchment [style*=\"color: #e8d8a8\"] { color: var(--ink) !important; }\n    [style*=\"background:rgba(200,184,128\"] { background: rgba(138,91,68,.08) !important; }\n    [style*=\"border-color:rgba(139,106,32\"] { border-color: rgba(138,91,68,.30) !important; }\n\n    /* \u2500\u2500 Story text \u2500\u2500 */\n    .story-text {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 17px !important;\n      line-height: 1.65 !important;\n      color: var(--ink) !important;\n      white-space: pre-line !important;\n    }\n    .story-text.drop-cap::first-letter {\n      font-size: 3.8em !important;\n      float: left !important;\n      line-height: .78 !important;\n      margin: .05em .12em 0 0 !important;\n      color: var(--gold) !important;\n      font-weight: 600 !important;\n    }\n\n    /* \u2500\u2500 Notice / outcome box \u2500\u2500 */\n    .notice-box {\n      border: 1px solid rgba(200,180,120,.50) !important;\n      background: rgba(30,20,15,.85) !important;\n      color: #f0d060 !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 11px !important;\n      letter-spacing: .06em !important;\n      padding: 10px 14px !important;\n      border-radius: 0 !important;\n      margin-top: 14px !important;\n    }\n\n        /* \u2500\u2500 HUD (parchment-readable) \u2500\u2500 */\n    #hud { color: var(--ink); }\n    #hud p, #hud span, #hud div { color: var(--ink); }\n    /* seal-label: NO !important so inline color:${bc} wins for badge tint */\n    #hud .hud-badge-row .hud-seal-label { font-family: 'Cinzel', serif; font-weight: 600; letter-spacing: .04em; }\n    #hud .hud-chapter { color: var(--ink-dim) !important; font-family: 'JetBrains Mono',monospace !important; font-size: .62rem !important; letter-spacing: .08em !important; }\n    #hud .stat-key { color: var(--ink-dim) !important; font-family: 'JetBrains Mono',monospace !important; font-size: .6rem !important; letter-spacing: .08em !important; }\n    #hud .stat-val { color: var(--ink) !important; font-family: 'JetBrains Mono',monospace !important; font-weight: 600; }\n    #hud .stat-bar-wrap { background: rgba(43,29,22,.18) !important; border-radius: 0 !important; }\n    #hud .stat-box { background: rgba(138,91,68,.10) !important; border: 1px solid rgba(138,91,68,.35) !important; border-radius: 0 !important; }\n    #hud .stat-box-key { color: var(--ink-dim) !important; font-family: 'JetBrains Mono',monospace !important; letter-spacing: .08em !important; }\n    #hud .stat-box-val { color: var(--ink) !important; font-family: 'Cinzel',serif !important; font-weight: 600 !important; }\n    #hud button {\n      background: rgba(138,91,68,.10) !important;\n      border: 1px solid rgba(138,91,68,.40) !important;\n      color: var(--ink) !important;\n      border-radius: 0 !important;\n      font-family: 'JetBrains Mono',monospace !important;\n      transition: border-color .2s, color .2s, background .2s !important;\n    }\n    #hud button:hover { border-color: var(--gold-dim) !important; color: var(--gold-dim) !important; background: rgba(138,91,68,.06) !important; }\n    #hud div[onclick] {\n      background: rgba(138,91,68,.10) !important;\n      border: 1px solid rgba(138,91,68,.45) !important;\n      color: var(--ink) !important;\n      border-radius: 0 !important;\n      font-weight: 500;\n    }\n    /* Remap stale light-on-cream inline colors anywhere inside the HUD */\n    #hud [style*=\"color:#c8b96e\"], #hud [style*=\"color: #c8b96e\"],\n    #hud [style*=\"color:#c8b880\"], #hud [style*=\"color: #c8b880\"],\n    #hud [style*=\"color:#f0d060\"], #hud [style*=\"color: #f0d060\"],\n    #hud [style*=\"color:#e8d8b0\"], #hud [style*=\"color: #e8d8b0\"],\n    #hud [style*=\"color:#f0e0c0\"], #hud [style*=\"color: #f0e0c0\"],\n    #hud [style*=\"color:#f0c080\"], #hud [style*=\"color: #f0c080\"] { color: var(--ink) !important; }\n\n    /* \u2500\u2500 Buttons / choices \u2014 warm parchment \u2500\u2500 */\n    button:not(.bm-signout), .choice, .combat-btn {\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.35) !important;\n      border-radius: 0 !important;\n      color: var(--ink) !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 10px !important; letter-spacing: .08em !important;\n      cursor: pointer !important;\n      transition: border-color .2s, color .2s, background .2s !important;\n    }\n    button:hover, .choice:hover, .combat-btn:hover:not(:disabled) {\n      border-color: var(--gold) !important;\n      color: var(--gold) !important;\n      background: rgba(138,91,68,.07) !important;\n    }\n\n    /* \u2500\u2500 Choices panel \u2500\u2500 */\n    .choices-label {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 10px !important;\n      letter-spacing: .38em !important;\n      text-transform: uppercase !important;\n      color: var(--ink-dim) !important;\n      margin-bottom: 12px !important;\n    }\n    .choices { display: flex; flex-direction: column; gap: 8px; }\n\n    button.choice, .choice {\n      background: rgba(244,234,215,.60) !important;\n      border: 1px solid rgba(138,91,68,.35) !important;\n      border-radius: 0 !important;\n      color: var(--ink) !important;\n      padding: 12px 14px !important;\n      text-align: left !important;\n      cursor: pointer !important;\n      transition: border-color .2s, background .2s, transform .2s !important;\n      display: flex !important;\n      align-items: flex-start !important;\n      gap: 10px !important;\n      width: 100% !important;\n      font-family: 'Cormorant Garamond', serif !important;\n    }\n    button.choice:hover, .choice:hover {\n      border-color: var(--ice) !important;\n      background: rgba(138,91,68,.12) !important;\n      transform: translateX(4px) !important;\n    }\n    button.choice.danger, .choice.danger {\n      border-color: rgba(192,57,43,.35) !important;\n    }\n    button.choice.danger:hover, .choice.danger:hover {\n      border-color: var(--warn) !important;\n      background: rgba(192,57,43,.08) !important;\n    }\n    button.choice.locked, .choice.locked {\n      opacity: .45 !important;\n      cursor: default !important;\n      border-color: rgba(138,91,68,.15) !important;\n    }\n    .choice-arrow {\n      color: var(--gold) !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 13px !important;\n      flex-shrink: 0 !important;\n      margin-top: 1px !important;\n    }\n    button.choice.danger .choice-arrow, .choice.danger .choice-arrow { color: var(--warn) !important; }\n    .choice-body {\n      font-size: 17px !important;\n      color: var(--ink) !important;\n      display: flex !important;\n      flex-direction: column !important;\n    }\n    .choice-sub {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 9.5px !important;\n      letter-spacing: .06em !important;\n      color: var(--ink-dim) !important;\n      margin-top: 3px !important;\n    }\n\n    /* \u2500\u2500 Stat bars \u2500\u2500 */\n    .stat-bar-wrap { background: rgba(0,0,0,.08) !important; border-radius: 0 !important; }\n    .stat-key { color: var(--ink-dim) !important; font-family: 'JetBrains Mono',monospace !important; font-size: .58rem !important; letter-spacing: .08em !important; }\n    .stat-val { color: var(--ink) !important; }\n\n    /* \u2500\u2500 Combat panel \u2500\u2500 */\n    .combat-panel {\n      background: rgba(244,234,215,.80) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      padding: 16px !important;\n      position: relative;\n    }\n    .combat-panel::before {\n      content: \"\"; position: absolute; top: -1px; left: -1px;\n      width: 12px; height: 12px;\n      border-top: 1px solid var(--gold); border-left: 1px solid var(--gold);\n    }\n    .combat-enemy-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }\n    .combat-enemy-icon { font-size: 2.5rem; }\n    .combat-enemy-name {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 20px !important; font-weight: 600 !important;\n      letter-spacing: .04em !important; color: var(--ink) !important;\n    }\n    .combat-log {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-style: italic !important;\n      font-size: 15px !important;\n      line-height: 1.55 !important;\n      color: var(--ink-dim) !important;\n      background: rgba(0,0,0,.06) !important;\n      border: 1px solid rgba(138,91,68,.20) !important;\n      border-radius: 0 !important;\n      padding: 10px 12px !important;\n      min-height: 3rem !important;\n      margin-bottom: 10px !important;\n    }\n    .combat-log em     { color: var(--gold) !important; font-style: italic; }\n    .combat-log strong { color: var(--warn) !important; font-style: normal; }\n    .stat-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }\n    .stat-bar-wrap {\n      flex: 1; height: 5px !important;\n      background: rgba(0,0,0,.08) !important;\n      border-radius: 0 !important; overflow: hidden;\n    }\n    .stat-bar { height: 100%; transition: width .4s, background .4s; }\n    .stat-key {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: .58rem !important; letter-spacing: .08em !important;\n      color: var(--ink-dim) !important; min-width: 44px;\n    }\n    .stat-val {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: .6rem !important; color: var(--ink) !important;\n      min-width: 50px; text-align: right;\n    }\n\n    /* \u2500\u2500 Combat action buttons \u2500\u2500 */\n    .combat-btn {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: .6rem !important; letter-spacing: .06em !important;\n      color: var(--ink) !important;\n      background: rgba(244,234,215,.50) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      padding: .45rem .5rem !important;\n      cursor: pointer !important;\n      transition: border-color .2s, background .2s, color .2s !important;\n      display: flex !important; align-items: center !important; justify-content: center !important;\n    }\n    .combat-btn:hover:not(:disabled) {\n      border-color: var(--gold) !important;\n      color: var(--gold) !important;\n      background: rgba(138,91,68,.10) !important;\n    }\n    .combat-btn:disabled { opacity: .35 !important; cursor: not-allowed !important; }\n\n    /* stat-grid inside HUD */\n    .stat-grid {\n      display: grid;\n      grid-template-columns: repeat(3,1fr);\n      gap: 4px; margin-top: 6px;\n    }\n\n    /* \u2500\u2500 End screen \u2500\u2500 */\n    .end-box {\n      background: rgba(244,234,215,.80) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      padding: 20px !important;\n      position: relative;\n    }\n    .end-box::before { content:\"\"; position:absolute; top:-1px; left:-1px; width:14px; height:14px; border-top:1px solid var(--gold); border-left:1px solid var(--gold); }\n    .end-box::after  { content:\"\"; position:absolute; bottom:-1px; right:-1px; width:14px; height:14px; border-bottom:1px solid var(--gold); border-right:1px solid var(--gold); }\n    .end-title {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 22px !important; font-weight: 600 !important;\n      letter-spacing: .06em !important;\n      color: var(--gold) !important;\n      margin-bottom: 10px !important;\n    }\n    .end-sub {\n      font-style: italic !important;\n      font-size: 16px !important;\n      color: var(--ink-dim) !important;\n      line-height: 1.55 !important;\n      margin-bottom: 14px !important;\n    }\n    .end-btn {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: .75rem !important;\n      letter-spacing: .14em !important;\n      text-transform: uppercase !important;\n      color: var(--ink) !important;\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.35) !important;\n      border-radius: 0 !important;\n      padding: .55rem 1.2rem !important;\n      cursor: pointer !important;\n      transition: border-color .2s, color .2s, background .2s !important;\n      text-decoration: none !important;\n      display: inline-block !important;\n    }\n    .end-btn:hover {\n      border-color: var(--gold) !important;\n      color: var(--gold) !important;\n      background: rgba(138,91,68,.07) !important;\n    }\n\n    /* \u2500\u2500 Items panel \u2500\u2500 */\n    #items-panel, [id$=\"-items-panel\"] {\n      background: rgba(244,234,215,.70) !important;\n      border: 1px solid rgba(138,91,68,.25) !important;\n      border-radius: 0 !important;\n    }\n    [id$=\"-items-panel\"] p,\n    [id$=\"-items-panel\"] span { color: var(--ink) !important; }\n\n    /* \u2500\u2500 animate-in \u2500\u2500 */\n    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }\n    .animate-in { animation: fadeIn .4s ease forwards; }\n    @keyframes animateShake {\n      0%,100%{transform:translateX(0)}\n      20%,60%{transform:translateX(-4px)}\n      40%,80%{transform:translateX(4px)}\n    }\n    .animate-shake { animation: animateShake .35s ease; }\n\n    /* \u2500\u2500 Items panel \u2500\u2500 */\n    #items-panel, [id$=\"-items-panel\"] {\n      background: rgba(244,234,215,.70) !important;\n      border: 1px solid rgba(138,91,68,.25) !important;\n      border-radius: 0 !important;\n    }\n    [id$=\"-items-panel\"] p,\n    [id$=\"-items-panel\"] span { color: var(--ink) !important; }\n\n    /* \u2500\u2500 animate-in \u2500\u2500 */\n    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }\n    .animate-in { animation: fadeIn .4s ease forwards; }\n    @keyframes animateShake {\n      0%,100%{transform:translateX(0)}\n      20%,60%{transform:translateX(-4px)}\n      40%,80%{transform:translateX(4px)}\n    }\n    .animate-shake { animation: animateShake .35s ease; }\n\n        /* \u2500\u2500 System overlay messages \u2500\u2500 */\n    .sys-overlay, [id=\"sys-overlay\"] {\n      background: rgba(20,15,10,.98) !important;\n      border: 1px solid rgba(240,200,80,.70) !important;\n      color: #f0e0a0 !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 11px !important;\n      letter-spacing: .08em !important;\n      border-radius: 4px !important;\n      box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;\n      text-shadow: 0 0 2px rgba(0,0,0,0.5) !important;\n    }\n    .sys-overlay span, [id=\"sys-overlay\"] span,\n    .sys-overlay p, [id=\"sys-overlay\"] p {\n      color: #f0e0a0 !important;\n    }\n\n    /* \u2500\u2500 Toast \u2500\u2500 */\n    .toast, [class*=\"toast\"] {\n      background: rgba(20,15,10,.98) !important;\n      border: 1px solid rgba(240,200,80,.70) !important;\n      color: #f0e0a0 !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      border-radius: 4px !important;\n      font-size: 11px !important;\n      text-shadow: 0 0 2px rgba(0,0,0,0.5) !important;\n    }\n    .toast span, [class*=\"toast\"] span,\n    .toast p, [class*=\"toast\"] p {\n      color: #f0e0a0 !important;\n    }\n\n    /* \u2500\u2500 Loot window \u2500\u2500 */\n    #loot-window {\n      background: rgba(241,228,207,.96) !important;\n      border-color: rgba(138,91,68,.40) !important;\n      border-radius: 0 !important;\n      color: var(--ink) !important;\n    }\n    #loot-window p, #loot-window span { color: var(--ink) !important; }\n\n    /* \u2500\u2500 Stat window modal \u2500\u2500 */\n    #stat-window > div {\n      background: rgba(244,234,215,.97) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n    }\n    #stat-window * { color: var(--ink) !important; }\n    #stat-window [style*=\"background:rgba(200\"] {\n      background: rgba(138,91,68,.07) !important;\n    }\n\n    /* \u2500\u2500 Judge image \u2500\u2500 */\n    #judge-img {\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      filter: drop-shadow(0 0 20px rgba(138,91,68,.20)) !important;\n    }\n\n    /* \u2500\u2500 combat-over \u2500\u2500 */\n    [id$=\"-combat-over\"] { color: var(--ink) !important; }\n    [id$=\"-combat-over\"] button {\n      font-family: 'JetBrains Mono', monospace !important;\n      color: var(--ink) !important;\n      background: rgba(138,91,68,.07) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      cursor: pointer !important;\n      transition: border-color .15s, color .15s !important;\n    }\n    [id$=\"-combat-over\"] button:hover { border-color: var(--gold) !important; color: var(--gold) !important; }\n\n    /* \u2500\u2500 Modals \u2500\u2500 */\n    [id$=\"-window\"] > div, .end-box {\n      background: rgba(244,234,215,.97) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n    }\n\n    /* \u2500\u2500 Right panel zone cards \u2500\u2500 */\n    #right-panel div[onclick] { border-radius: 0 !important; }\n\n    /* \u2500\u2500 Spine \u2014 warm book gutter \u2500\u2500 */\n    .spine {\n      background: linear-gradient(90deg,\n        rgba(232,210,170,.0)   0%,\n        rgba(200,170,120,.25)  15%,\n        rgba(160,120,70,.55)   30%,\n        rgba(90,55,20,.88)     43%,\n        rgba(40,20,5,1.0)      50%,\n        rgba(90,55,20,.88)     57%,\n        rgba(160,120,70,.55)   70%,\n        rgba(200,170,120,.25)  85%,\n        rgba(232,210,170,.0)   100%\n      ) !important;\n      border-left:  none !important;\n      border-right: none !important;\n      position: relative; z-index: 5;\n      width: 32px !important;\n      min-width: 32px !important;\n      margin: 0 !important;\n      overflow: visible;\n      box-shadow: none !important;\n    }\n    .spine::before {\n      content: \"\";\n      position: absolute;\n      top: 0; bottom: 0; left: 50%;\n      width: 1px;\n      transform: translateX(-50%);\n      background: linear-gradient(180deg,\n        transparent 0%,\n        rgba(43,29,22,.9) 8%,\n        rgba(43,29,22,.9) 92%,\n        transparent 100%);\n      z-index: 2;\n    }\n    .spine::after {\n      content: \"\";\n      position: absolute;\n      top: 2px; bottom: 2px; left: -3px;\n      width: 3px;\n      background: repeating-linear-gradient(\n        180deg,\n        rgba(138,91,68,.08) 0px,\n        rgba(138,91,68,.03) 1px,\n        rgba(0,0,0,.10)     1px,\n        rgba(0,0,0,.04)     2px\n      );\n      border-left: 1px solid rgba(138,91,68,.12);\n      z-index: 1;\n    }\n\n    /* \u2500\u2500 Scrollbar \u2500\u2500 */\n    ::-webkit-scrollbar { width: 5px; }\n    ::-webkit-scrollbar-track { background: rgba(43,29,22,.20); }\n    ::-webkit-scrollbar-thumb { background: rgba(138,91,68,.35); }\n    ::-webkit-scrollbar-thumb:hover { background: var(--gold-dim); }\n\n    /* \u2500\u2500 Page-flip decorative animation \u2500\u2500 */\n    /* \u2500\u2500 Page-flip animation \u2014 triggered on navigation only \u2500\u2500 */\n    @keyframes bookPageFlip {\n      0%   { transform: perspective(1200px) rotateY(0deg);    opacity: 0; }\n      6%   { opacity: .92; }\n      50%  { transform: perspective(1200px) rotateY(-180deg); opacity: .92; }\n      80%  { opacity: 0; }\n      100% { transform: perspective(1200px) rotateY(-180deg); opacity: 0; }\n    }\n    .page-flip-decorator {\n      position: absolute;\n      top: 0; right: 0;\n      width: 50%; height: 100%;\n      transform-origin: left center;\n      pointer-events: none;\n      z-index: 40;\n      opacity: 0;\n      background: linear-gradient(to left, rgba(241,228,207,.96) 0%, rgba(230,215,190,.92) 60%, rgba(215,196,165,.72) 100%);\n      box-shadow: -4px 0 20px rgba(0,0,0,.15);\n    }\n    .page-flip-decorator.playing {\n      animation: bookPageFlip 0.55s cubic-bezier(0.4,0,0.2,1) forwards;\n    }\n    .page-flip-decorator::after { content: \"\"; }\n  "
    document.head.appendChild(ps)
  }

  // ── Ch3 module styles ───────────────────────────────────────────
  // The chapter inherits Ch1's parchment theme (loaded by Ch1's
  // MODULE_STYLES the first time the player opens Ch1). For Ch3 we
  // append a small block of Ch3-specific styles for the signal feed.
  // Idempotent — only installed once.
  if (!document.getElementById('ch3-module-styles')) {
    const s = document.createElement('style')
    s.id = 'ch3-module-styles'
    s.textContent = `
      /* Signal feed — radio-chatter style box inside the HUD */
      .signal-feed {
        margin-top: 10px;
        padding: 8px 10px;
        background: rgba(20,15,10,.85);
        border: 1px solid rgba(138,91,68,.35);
        border-radius: 0;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        line-height: 1.5;
        color: #d4b48a !important;
        max-height: 180px;
        overflow-y: auto;
      }
      .signal-feed-title {
        font-size: 8.5px;
        letter-spacing: .28em;
        text-transform: uppercase;
        color: #8a7050 !important;
        margin-bottom: 6px;
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(138,91,68,.25);
      }
      .signal-msg {
        padding: 4px 0;
        animation: signalIn .35s ease-out;
        opacity: .92;
        color: #d4b48a !important;
      }
      .signal-msg.new { color: #f0e0a0 !important; opacity: 1; }
      .signal-msg.fading { color: #d4b48a !important; opacity: .45; }
      .signal-msg-prefix {
        color: #7a5030 !important;
        margin-right: 6px;
        font-size: 9px;
      }
      @keyframes signalIn {
        from { opacity: 0; transform: translateX(-6px); }
        to   { opacity: .92; transform: translateX(0); }
      }
      /* When the player completes a chapter — terminal screen */
      .ch3-complete-banner {
        text-align: center; padding: 24px;
        font-family: 'Cormorant Garamond', serif;
        font-size: 18px; color: var(--ink); font-style: italic;
      }
    `
    document.head.appendChild(s)
  }

  // ── Bootstrap: first-time players land at ch3_entry. signal_strength
  // starts at 0. Saved server-side so reload picks up here.
  if (!player.current_node_ch3) {
    await supabase.from('players')
      .update({ current_node_ch3: 'ch3_entry', signal_strength: 0 })
      .eq('id', player.id)
    player.current_node_ch3 = 'ch3_entry'
    player.signal_strength  = 0
  }

  // Ensure caches_found exists in memory (DB column may or may not be
  // present; the cache code guards on the in-memory array regardless).
  if (!Array.isArray(player.caches_found)) player.caches_found = []

  // ── Signal feed state ───────────────────────────────────────────
  // We keep a rolling buffer of the last N signals so the player can
  // still scan recent context when they enter a new node. Each entry:
  //   { text, real, nodeId, key }  (nodeId = where it was heard)
  // The `real` flag is NOT displayed — it just determines the message's
  // truthfulness. Misdirection effects are applied via the choice the
  // player picks, not via the signal itself (signals only inform).
  const FEED_MAX = 4
  const signalFeed = []   // module-scoped, persists across nodes within a session

  function renderSignalFeed() {
    const host = $('signal-feed-body')
    if (!host) return
    if (signalFeed.length === 0) {
      host.innerHTML = '<div class="signal-msg" style="opacity:.4">— no transmissions —</div>'
      return
    }
    host.innerHTML = signalFeed.map((s, i) => {
      const isLatest = i === signalFeed.length - 1
      const cls = isLatest ? 'signal-msg new' : (i === 0 ? 'signal-msg fading' : 'signal-msg')
      return `<div class="${cls}">
        <span class="signal-msg-prefix">›</span>${s.text}
      </div>`
    }).join('')
    // Auto-scroll to bottom
    host.scrollTop = host.scrollHeight
  }

  function pushSignals(nodeSignals, nodeId) {
    if (!nodeSignals || !nodeSignals.length) return
    nodeSignals.forEach((sig, i) => {
      // Stagger the appearance so the player feels them arrive in order
      setTimeout(() => {
        signalFeed.push({ text: sig.text, real: !!sig.real, nodeId, key: nodeId + ':' + i })
        while (signalFeed.length > FEED_MAX) signalFeed.shift()
        renderSignalFeed()
      }, 250 + i * 600)
    })
  }

  // ── HUD render ───────────────────────────────────────────────────
  function renderHUD() {
    const lvl = player.level || 1
    const xp  = player.xp || 0
    const xpNeeded = xpForLevel(lvl + 1)
    const xpPct = Math.min(100, Math.round((xp / xpNeeded) * 100))
    const hp  = player.hp || 100
    const mhp = player.max_hp || 100
    const hpPct = Math.max(0, Math.round(hp / mhp * 100))
    const hpCol = hpPct > 60 ? '#5ec45e' : hpPct > 30 ? '#c8b96e' : '#e05555'
    const tier = getMoralTier(player.moral_score || 0)
    const signal = player.signal_strength || 0
    const sigTier = signalTierMeta(signal)

    // ── Fable-style moral alignment (matches Ch1) ─────────
    const moral = player.moral_score || 0
    const moralPct  = Math.round((moral + 100) / 2)
    const moralCol  = moral >= 60 ? '#1e5a8a'
      : moral >= 20  ? '#2f7a2f'
      : moral >= -20 ? '#8b6a20'
      : moral >= -60 ? '#a04a18'
      :                '#a02020'
    const moralLabel = moral >= 70  ? 'HERO'
      : moral >= 30   ? 'GOOD'
      : moral >= -10  ? 'NEUTRAL'
      : moral >= -40  ? 'RUTHLESS'
      : moral >= -70  ? 'CORRUPT'
      :                 'VILLAIN'
    const dotLeft = Math.max(2, Math.min(94, moralPct))

    // Stats — Ch3 doesn't have calcATK/calcDEF helpers, so inline base
    // calculations. Same shape as Ch1 (level scaling + small stat add).
    const atk = Math.round(10 + (lvl-1)*3 + (player.power||0)*0.6 + (player.speed||0)*0.2)
    const def = Math.round(5  + (lvl-1)*2 + (player.toughness||0)*0.5)

    $('hud').innerHTML = `
      <div class="hud-badge-row" style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span class="hud-seal" style="font-size:1.6rem">${tier.seal||'◆'}</span>
        <div>
          <p class="hud-seal-label" style="color:${tier.color};margin:0;font-size:.95rem">${tier.label}</p>
          <p class="hud-chapter" style="margin:0">Chapter ${META.number} · Lvl ${lvl}</p>
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-key">HP</span>
        <div class="stat-bar-wrap"><div class="stat-bar" style="width:${hpPct}%;background:${hpCol};transition:width .4s,background .4s"></div></div>
        <span class="stat-val">${hp}/${mhp}</span>
      </div>
      <div class="stat-row">
        <span class="stat-key">XP</span>
        <div class="stat-bar-wrap"><div class="stat-bar" style="width:${xpPct}%;background:#a07de0;transition:width .4s"></div></div>
        <span class="stat-val" style="font-size:.52rem;min-width:60px;text-align:right">${xp}/${xpNeeded}</span>
      </div>
      <div style="margin-bottom:5px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
          <span style="font-family:'JetBrains Mono',monospace;font-size:.55rem;color:var(--ink);font-weight:600;letter-spacing:.14em">REPUTATION</span>
          <span style="font-family:'Cinzel',serif;font-size:.5rem;font-weight:600;color:${moralCol};letter-spacing:.06em">${moralLabel}</span>
        </div>
        <div style="position:relative;height:5px;background:linear-gradient(to right,#e05555,#e07a40,#c8b96e,#c8e8a0,#a0d0ff);border-radius:3px">
          <div style="position:absolute;top:-2px;left:${dotLeft}%;width:9px;height:9px;background:${moralCol};border-radius:50%;transform:translateX(-50%);border:1px solid rgba(0,0,0,.3);transition:left .5s,background .5s"></div>
        </div>
      </div>
      <div class="stat-row" style="margin-bottom:5px">
        <span class="stat-key">SIG</span>
        <div class="stat-bar-wrap"><div class="stat-bar" style="width:${signal}%;background:${sigTier.color};transition:width .4s"></div></div>
        <span class="stat-val" style="color:${sigTier.color}">${signal} · ${sigTier.label}</span>
      </div>
      ${(player.skill_points||0)>0?`<div onclick="window.bookNavigate('skills.html')" style="background:rgba(160,125,224,.25);border:1px solid rgba(160,125,224,.5);border-radius:3px;padding:4px 8px;margin-bottom:6px;font-family:'Share Tech Mono',monospace;font-size:.6rem;color:var(--ink);cursor:pointer;text-align:center">⬡ ${player.skill_points} SKILL POINTS — tap to spend</div>`:''}
      <div class="stat-grid">
        <div class="stat-box"><span class="stat-box-key">ATK</span><span class="stat-box-val">${atk}</span></div>
        <div class="stat-box"><span class="stat-box-key">DEF</span><span class="stat-box-val">${def}</span></div>
        <div class="stat-box"><span class="stat-box-key">GOLD</span><span class="stat-box-val">${player.gold||0}</span></div>
      </div>
      <div style="display:flex;gap:4px;margin-top:6px">
        <button onclick="window.openStatWindow && window.openStatWindow()" style="flex:1;font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);background:rgba(200,184,128,.2);border:.5px solid rgba(139,106,32,.4);border-radius:2px;padding:3px 0;cursor:pointer;letter-spacing:.06em">📊 STATS</button>
        <button onclick="window.bookNavigate('skills.html')" style="flex:1;font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);background:rgba(160,125,224,.2);border:.5px solid rgba(160,125,224,.4);border-radius:2px;padding:3px 0;cursor:pointer;letter-spacing:.06em">⬡ SKILLS</button>
      </div>
      <div class="signal-feed">
        <div class="signal-feed-title">// Signal Feed</div>
        <div id="signal-feed-body"></div>
      </div>
    `
    renderSignalFeed()
  }

  // ── Hidden caches (signal_strength-gated) ───────────────────────
  // A story node may carry an optional `cache` descriptor:
  //   cache: {
  //     id:        'ch3_cache_platform',   // unique; tracked in player.caches_found
  //     reqSignal: 30,                     // min signal_strength to reveal
  //     itemKey:   'rune_lux', qty: 1,     // loot granted on search
  //     label:     'Trace the buried signal',   // optional choice label
  //     sub:       'Signal strong enough to localize a cache',
  //     foundText: 'You dig out a sealed cache...',  // optional story text on grab
  //   }
  // The choice only appears when signal_strength >= reqSignal AND the
  // cache id is not yet in player.caches_found. One-time per player.
  function cacheCollected(id) {
    return (player.caches_found || []).includes(id)
  }
  function isCacheAvailable(node) {
    const c = node && node.cache
    if (!c || !c.id) return false
    if (cacheCollected(c.id)) return false
    return (player.signal_strength || 0) >= (c.reqSignal || 0)
  }
  async function grabCache(node, nodeId) {
    const c = node.cache
    if (!c || cacheCollected(c.id)) return
    // Mark found (in-memory guard prevents double-grab even if the DB
    // column is missing).
    const found = [...(player.caches_found || [])]
    found.push(c.id)
    player.caches_found = found
    if (c.itemKey) { await addItem(c.itemKey, c.qty || 1) }
    // Best-effort persist. caches_found requires a jsonb/text[] column on
    // the players table; if it doesn't exist yet, this update silently
    // no-ops on that field and the rest still saves.
    try {
      await supabase.from('players').update({ caches_found: found }).eq('id', player.id)
    } catch (e) {
      console.warn('[ch3 cache] caches_found not persisted (add column?):', e?.message)
    }
    // Show the grab feedback in story text, then re-render the node so the
    // cache choice disappears and normal choices remain.
    if (c.foundText) $('story-text').textContent = c.foundText
    renderHUD()
    renderStoryNode(node, nodeId)
  }

  // ── Story node render ──────────────────────────────────────────
  // Story text goes on the LEFT page. Choices render in the RIGHT
  // panel below the HUD. This mirrors Ch1's layout exactly.
  function renderStoryNode(node, nodeId) {
    $('story-text').textContent = node.text || ''

    const choices = node.choices || []
    const cacheReady = isCacheAvailable(node)
    if (!choices.length && !cacheReady) {
      $('right-panel').innerHTML = '<p style="font-style:italic;color:var(--ink-dim)">— no choices —</p>'
      return
    }
    const cacheBtn = cacheReady ? `
      <button class="choice" data-cache="1" style="border-color:rgba(94,196,94,.5)">
        <span class="choice-arrow" style="color:#5ec45e">⬡</span>
        <span class="choice-body">
          <span>${node.cache.label || 'Search the signal source'}</span>
          <span class="choice-sub">${node.cache.sub || 'A hidden cache — your signal is strong enough to find it'}</span>
        </span>
      </button>
    ` : ''
    $('right-panel').innerHTML = `
      <div class="choices-label">Choices</div>
      <div class="choices">
        ${cacheBtn}
        ${choices.map((c, i) => `
          <button class="choice" data-i="${i}">
            <span class="choice-arrow">›</span>
            <span class="choice-body">
              <span>${c.label}</span>
              ${c.sub ? `<span class="choice-sub">${c.sub}</span>` : ''}
            </span>
          </button>
        `).join('')}
      </div>
    `
    $('right-panel').querySelectorAll('.choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.cache) { grabCache(node, nodeId); return }
        const c = choices[Number(btn.dataset.i)]
        goTo(c.next, c)
      })
    })
  }

  // ── Render dispatcher ─────────────────────────────────────────
  function renderNode(node, nodeId) {
    if (!node) {
      $('story-text').textContent = `[ERROR] Missing node: ${nodeId}`
      $('right-panel').innerHTML = ''
      return
    }

    // Always render story text on the left and push any node signals
    // into the feed before rendering choices/puzzle.
    if (node.signals) pushSignals(node.signals, nodeId)

    if (node.type === 'puzzle') {
      // Story stays on left; puzzle UI mounts in the right panel.
      $('story-text').textContent = node.text || ''
      const cfg = node.puzzleConfig || {}
      let fn
      if      (node.puzzleType === 'voice')    fn = runVoiceDiscrimination
      else if (node.puzzleType === 'sequence') fn = runSequence
      else                                     fn = runRiddle
      fn($('right-panel'), cfg,
         () => goTo(node.onWin,  node.winChoice  || {}),
         () => goTo(node.onLose, node.loseChoice || {}))
      return
    }

    if (node.type === 'complete') {
      $('story-text').textContent = node.text || 'Chapter complete.'
      $('right-panel').innerHTML = `
        <div class="ch3-complete-banner">${META.title} — complete.</div>
        <div class="choices">
          <button class="choice" id="ch3-return-btn">
            <span class="choice-arrow">›</span>
            <span class="choice-body"><span>Return to chapters</span></span>
          </button>
        </div>
      `
      $('ch3-return-btn').addEventListener('click', () => {
        if (window.bookNavigate) window.bookNavigate('book.html')
        else location.href = './book.html'
      })
      return
    }

    if (node.type === 'combat' || node.type === 'boss') {
      // Story text on the left; combat UI mounts in the right panel.
      $('story-text').textContent = node.text || ''
      renderCombat(node)
      return
    }

    // Default: story node
    renderStoryNode(node, nodeId)
  }

  // ── Inventory grant ─────────────────────────────────────────────
  // Mirrors Ch2's addItem schema so loot lands in the same `inventory`
  // table with the columns the inventory/skills pages expect. Only the
  // items Ch3 can actually award are defined; anything else falls back
  // to a generic material so a typo never throws.
  async function addItem(itemKey, qty) {
    try {
      const { data: ex } = await supabase.from('inventory')
        .select('id,quantity').eq('player_id', player.id).eq('item_key', itemKey).maybeSingle()
      if (ex) {
        await supabase.from('inventory').update({ quantity: ex.quantity + qty }).eq('id', ex.id)
        return
      }
      const ITEM_DEF = {
        rune_lux:          { name: 'Lux Rune',      item_type: 'material',  rarity: 'uncommon',  icon: '✨' },
        item_voice_imprint:{ name: 'Voice Imprint', item_type: 'accessory', rarity: 'legendary', icon: '📡' },
      }
      const def = ITEM_DEF[itemKey] || { name: itemKey, item_type: 'material', rarity: 'common', icon: '📦' }
      const { error } = await supabase.from('inventory').insert({
        player_id: player.id, item_key: itemKey, quantity: qty,
        name: def.name, item_type: def.item_type, rarity: def.rarity, icon: def.icon,
        element: 'none', hp_restore: 0, atk_bonus: 0, def_bonus: 0, power_bonus: 0,
        guard_bonus: 0, speed_bonus: 0, control_bonus: 0, insight_bonus: 0, luck_bonus: 0,
        agility_bonus: 0, max_hp_bonus: 0, two_handed: false,
        sockets_total: 0, sockets_used: 0, socketed_runes: [],
      })
      if (error) console.error('[ch3 addItem]', itemKey, error.message)
    } catch (e) {
      console.error('[ch3 addItem] failed', itemKey, e)
    }
  }

  // ── Combat ──────────────────────────────────────────────────────
  // Minimal player-first turn loop wired to data/enemyAI.js. The player
  // acts first each round (Attack or Defend), the enemy responds via
  // resolveEnemyTurn. For the Echo Beast this ordering matters: the boss
  // mimics the player's LAST attack, so the player must move first for
  // there to be something to copy.
  //
  // NOTE: class skills/items-in-combat are NOT wired here yet — that is a
  // separate, larger task (Ch2's skill registry is ~1600 lines). This is
  // the core boss loop: Attack / Defend, status effects, loot, xp.
  function renderCombat(node) {
    const enemy = node.enemy || { name: 'Unknown', hp: 100, atk: 10, def: 5, xp: 0, icon: '❓' }

    // Mirror renderHUD's stat formulas exactly so combat numbers match
    // the HUD the player just saw.
    const lvl     = player.level || 1
    const atkStat = Math.round(10 + (lvl - 1) * 3 + (player.power || 0) * 0.6 + (player.speed || 0) * 0.2)
    const defStat = Math.round(5  + (lvl - 1) * 2 + (player.toughness || 0) * 0.5)

    let enemyHp     = enemy.hp
    const maxEnemyHp = enemy.hp
    let currentHp   = player.hp || 100
    const maxPlayerHp = player.max_hp || 100
    let defending   = false
    let over        = false

    const enemyState = initEnemyState(enemy)
    const se = {
      playerSlowTurns: 0, playerDEFBonus: 0,
      playerDefShredTurns: 0, playerDefShredAmt: 0,
      playerBleedTurns: 0, playerBleedDmg: 0,
      playerPoisonTurns: 0, playerPoisonDmg: 0,
      playerStunTurns: 0, playerTerrorTurns: 0,
    }

    const playerDEF = () => defStat
    const panel = $('right-panel')

    const enemyImg = enemy.img
      ? `<img src="${enemy.img}" alt="${enemy.name}" style="width:54px;height:54px;object-fit:cover;border:1px solid rgba(138,91,68,.4)" onerror="this.style.display='none'">`
      : `<span class="combat-enemy-icon">${enemy.icon || '❓'}</span>`

    panel.innerHTML = `
      <div class="combat-panel" id="ch3-cb">
        <div class="combat-enemy-row">
          ${enemyImg}
          <div>
            <div class="combat-enemy-name">${enemy.name}</div>
            <div class="stat-row" style="margin-top:6px;min-width:180px">
              <span class="stat-key">FOE</span>
              <div class="stat-bar-wrap"><div class="stat-bar" id="ch3-cb-ehp" style="width:100%;background:#a02020"></div></div>
              <span class="stat-val" id="ch3-cb-ehp-val">${enemyHp}/${maxEnemyHp}</span>
            </div>
          </div>
        </div>
        <div class="combat-log" id="ch3-cb-log"><em>${enemy.combatIntro || 'The fight begins.'}</em></div>
        <div class="stat-row">
          <span class="stat-key">YOU</span>
          <div class="stat-bar-wrap"><div class="stat-bar" id="ch3-cb-php" style="width:${Math.round(currentHp/maxPlayerHp*100)}%;background:#5ec45e"></div></div>
          <span class="stat-val" id="ch3-cb-php-val">${currentHp}/${maxPlayerHp}</span>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px" id="ch3-cb-actions">
          <button class="combat-btn" id="ch3-cb-attack" style="flex:1">⚔ ATTACK</button>
          <button class="combat-btn" id="ch3-cb-defend" style="flex:1">🛡 DEFEND</button>
        </div>
      </div>
    `

    const logEl   = panel.querySelector('#ch3-cb-log')
    const ehpEl   = panel.querySelector('#ch3-cb-ehp')
    const ehpVal  = panel.querySelector('#ch3-cb-ehp-val')
    const phpEl   = panel.querySelector('#ch3-cb-php')
    const phpVal  = panel.querySelector('#ch3-cb-php-val')
    const frame   = panel.querySelector('#ch3-cb')

    function refreshBars() {
      const ep = Math.max(0, Math.round(enemyHp / maxEnemyHp * 100))
      const pp = Math.max(0, Math.round(currentHp / maxPlayerHp * 100))
      ehpEl.style.width = ep + '%'
      ehpVal.textContent = `${Math.max(0, enemyHp)}/${maxEnemyHp}`
      phpEl.style.width = pp + '%'
      phpEl.style.background = pp > 60 ? '#5ec45e' : pp > 30 ? '#c8b96e' : '#e05555'
      phpVal.textContent = `${Math.max(0, currentHp)}/${maxPlayerHp}`
    }

    function log(html) { logEl.innerHTML = html }
    const triggerAnimation = () => {
      frame.classList.remove('animate-shake')
      void frame.offsetWidth
      frame.classList.add('animate-shake')
    }

    function tickPlayerDots(messages) {
      if (se.playerBleedTurns > 0) {
        currentHp = Math.max(0, currentHp - se.playerBleedDmg)
        messages.push(`🩸 Bleed — <strong>${se.playerBleedDmg}</strong>.`)
        se.playerBleedTurns--
      }
      if (se.playerPoisonTurns > 0) {
        currentHp = Math.max(0, currentHp - se.playerPoisonDmg)
        messages.push(`☠ Poison — <strong>${se.playerPoisonDmg}</strong>.`)
        se.playerPoisonTurns--
      }
      if (se.playerSlowTurns > 0)      se.playerSlowTurns--
      if (se.playerDefShredTurns > 0)  se.playerDefShredTurns--
      if (se.playerStunTurns > 0)      se.playerStunTurns--
      if (se.playerTerrorTurns > 0)    se.playerTerrorTurns--
    }

    function enemyTurn(prefixMsgs) {
      const messages = prefixMsgs || []
      const ctx = {
        enemyState, enemyHp, maxEnemyHp, currentHp, maxPlayerHp,
        playerDEF, defending, statusEffects: se, yara: null, messages,
        triggerAnimation,
        onEnemyDmgPlayer: (d) => { currentHp = Math.max(0, currentHp - d) },
        onEnemyHealSelf:  (h) => { enemyHp = Math.min(maxEnemyHp, enemyHp + h) },
      }
      resolveEnemyTurn(enemy, ctx)
      defending = false
      tickPlayerDots(messages)
      log(messages.join('<br>'))
      refreshBars()
      if (currentHp <= 0) { endCombat(false) }
    }

    function playerAttack() {
      if (over) return
      const messages = []
      if (se.playerStunTurns > 0) {
        messages.push('⚡ <em>Stunned — you lose your action.</em>')
        enemyTurn(messages)
        return
      }
      const roll = Math.floor(Math.random() * 6)
      const dmg  = Math.max(1, atkStat + roll - (enemy.def || 0))
      enemyHp = Math.max(0, enemyHp - dmg)
      enemyState.echoLastPlayerMove = { name: 'Strike', dmg }
      messages.push(`⚔ You strike for <strong>${dmg}</strong>.`)
      refreshBars()
      if (enemyHp <= 0) { log(messages.join('<br>')); endCombat(true); return }
      enemyTurn(messages)
    }

    function playerDefend() {
      if (over) return
      defending = true
      enemyTurn(['🛡 <em>You brace. Defense doubled this turn.</em>'])
    }

    panel.querySelector('#ch3-cb-attack').addEventListener('click', playerAttack)
    panel.querySelector('#ch3-cb-defend').addEventListener('click', playerDefend)

    async function endCombat(won) {
      if (over) return
      over = true
      const actions = panel.querySelector('#ch3-cb-actions')
      if (actions) actions.remove()

      const updates = {}
      if (won) {
        // XP (no auto-level-up in Ch3 yet — mirrors how goTo handles choice.xp)
        const gainedXp = enemy.xp || 0
        player.xp = (player.xp || 0) + gainedXp
        updates.xp = player.xp
        // Persist surviving HP
        player.hp = currentHp
        updates.hp = currentHp
        // Loot
        const loot = enemy.loot || []
        for (const l of loot) { await addItem(l.itemKey, l.qty || 1) }
        try { await supabase.from('players').update(updates).eq('id', player.id) } catch (e) { console.error('[ch3] win save', e) }

        const lootHtml = loot.length
          ? loot.map(l => {
              const img = ITEM_IMAGES[l.itemKey]
              const thumb = img ? `<img src="${img}" onerror="this.style.display='none'" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;margin-right:4px">` : ''
              return `<div style="font-size:13px;color:var(--ink)">${thumb}${l.itemKey.replace(/_/g,' ')} ×${l.qty || 1}</div>`
            }).join('')
          : '<div style="font-size:13px;color:var(--ink-dim)">— no loot —</div>'

        panel.querySelector('.combat-panel').insertAdjacentHTML('beforeend', `
          <div class="end-box" id="ch3-cb-over" style="margin-top:12px">
            <div class="end-title">VICTORY</div>
            <div class="end-sub">${enemy.defeatText || 'The receiver goes silent.'}</div>
            <div style="margin:10px 0">
              <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.1em;color:var(--ink-dim);margin-bottom:4px">REWARDS</div>
              <div style="font-size:13px;color:var(--ink)">✦ ${gainedXp} XP</div>
              ${lootHtml}
            </div>
            <button class="end-btn" id="ch3-cb-continue">Continue ›</button>
          </div>
        `)
        panel.querySelector('#ch3-cb-continue').addEventListener('click', () => {
          renderHUD()
          goTo(node.onWin, node.winChoice || {})
        })
      } else {
        // Defeat — restore to full so the retry is playable, route to onLose.
        player.hp = maxPlayerHp
        updates.hp = maxPlayerHp
        try { await supabase.from('players').update(updates).eq('id', player.id) } catch (e) { console.error('[ch3] lose save', e) }
        panel.querySelector('.combat-panel').insertAdjacentHTML('beforeend', `
          <div class="end-box" id="ch3-cb-over" style="margin-top:12px">
            <div class="end-title" style="color:var(--warn)">DEFEATED</div>
            <div class="end-sub">${enemy.loseText || 'The signal swallows you. You pull back to regroup.'}</div>
            <button class="end-btn" id="ch3-cb-retry">Regroup ›</button>
          </div>
        `)
        panel.querySelector('#ch3-cb-retry').addEventListener('click', () => {
          renderHUD()
          goTo(node.onLose, node.loseChoice || {})
        })
      }
    }
  }

  // ── Navigation + side effects ───────────────────────────────────
  async function goTo(nodeId, choice = {}) {
    const node = NODES[nodeId]
    if (!node) {
      console.error(`[ch3] missing node: ${nodeId}`)
      return
    }

    const updates = { current_node_ch3: nodeId }

    // Choice-driven effects
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
    if (choice.hp) {
      const nh = Math.max(0, Math.min(player.max_hp||100, (player.hp||100) + choice.hp))
      player.hp = nh
      updates.hp = nh
    }

    // Node-level entry effects
    if (node.onEnter) {
      if (typeof node.onEnter.hp === 'number') {
        const newHp = Math.max(0, (player.hp || 100) + node.onEnter.hp)
        player.hp = newHp
        updates.hp = newHp
      }
      if (typeof node.onEnter.signal === 'number') {
        const ns = Math.max(0, Math.min(100, (player.signal_strength||0) + node.onEnter.signal))
        player.signal_strength = ns
        updates.signal_strength = ns
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

    try {
      await supabase.from('players').update(updates).eq('id', player.id)
    } catch (e) {
      console.error('[ch3] save failed', e)
    }

    player.current_node_ch3 = nodeId
    renderHUD()

    if (node.type === 'complete') {
      renderNode(node, nodeId)
      return
    }

    renderNode(node, nodeId)
  }

  // Initial render
  renderHUD()
  const currentNode = NODES[player.current_node_ch3] || NODES['ch3_entry']
  renderNode(currentNode, player.current_node_ch3 || 'ch3_entry')
}

// Expose for legacy nav code that calls window.mountCh3.
window.mountCh3 = mountCh3
