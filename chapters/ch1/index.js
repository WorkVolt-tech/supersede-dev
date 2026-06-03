import { supabase } from '../../supabase.js'
// renderNav, showSysOverlay, showToast are exposed as window globals by book.html
import { META, SOCKET_RULES, rollSockets, ZONE_GUARDIANS } from './config.js'
import { NODES } from './nodes.js'
import { ITEM_IMAGES } from './items.js'
import * as ClsCombat from '../../data/class_combat.js'
import { BATTLE_SKILLS_REGISTRY, NOTABLE_SKILLS_REGISTRY } from '../../data/skills_registry.js'
import {
  getMoralTier,
  getMoralBarPct,
  calcBadge,
  applyMoralChange,
  getBadgeShiftLabel,
} from '../../data/reputation.js'
import { renderReputationBadge } from '../../data/avatar.js'
// Cache-bust enemyAI.js by hardcoding the version in the import path.
// When enemyAI.js changes, bump the ?v= here AND in book.html. Without
// this, browsers cache enemyAI.js indefinitely because book.html only
// cache-busts the chapter file itself, not its dependencies.
import {
  applyBleed, applyPoison, applySlow, applyStun, applyDefShred, applyTerror,
} from '../../data/enemyAI.js?v=2026-05-14-enemyai-cachebust'

const MODULE_STYLE_ID = 'book-module-style-chapter-1'
const MODULE_MARKUP = "<div class=\"book-wrap\">\n  \n  <div class=\"book animate-in\" style=\"position:relative;\">\n    <div class=\"page-left parchment\" id=\"left-page\">\n      <div class=\"page-inner\">\n        <p class=\"chapter-label\">Chapter 1 \u2014 System Initialization</p>\n        <p class=\"chapter-sub\">The world stops. The game begins.</p>\n        <hr class=\"ink-divider\">\n        <p class=\"story-text\" id=\"story-text\"></p>\n        <div class=\"notice-box animate-in\" id=\"outcome-box\" style=\"display:none\"></div>\n      </div>\n    </div>\n    <div class=\"page-right parchment\">\n      <div class=\"page-inner\">\n        <div class=\"hud\" id=\"hud\"></div>\n        <hr class=\"ink-divider\">\n        <div id=\"right-panel\"></div>\n      </div>\n    </div>\n    <!-- Decorative page-flip animation \u2014 purely visual, no pointer events -->\n    <div class=\"page-flip-decorator\" aria-hidden=\"true\"></div>\n  </div>\n</div>"
const MODULE_STYLES = "\n    /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n       PARCHMENT BOOK THEME \u2014 Warm Ink / Aged Paper\n       Matches the interactive book page-flip UI.\n    \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n       :root {\n      --bg-0:      #14110f;\n      --bg-1:      #2b1d16;\n      --panel:     #f4ead7;\n      --page-l:    #f4ead7;\n      --page-r:    #f1e4cf;\n      --ink:       #2b1d16;\n      --ink-dim:   #5c4638;\n      --ink-faint: #a08060;\n      --ice:       #7a5230;\n      --ice-hot:   #4b2e14;\n      --gold:      #c8a050;\n      --gold-hot:  #e0c070;\n      --gold-dim:  #a08040;\n      --amber:     #d09040;\n      --amber-hot: #e0a050;\n      --warn:      #e06050;\n      --line:      rgba(200,160,80,.30);\n      --green:     #5cae50;\n      --purple:    #8a50c0;\n      --spine-col: #2b1d16;\n    }\n    *, *::before, *::after { box-sizing: border-box; }\n\n    /* \u2500\u2500 Global reset \u2500\u2500 */\n    html, body {\n      background: radial-gradient(ellipse at 50% 0%, #2a1a0e 0%, #14110f 55%, #0d0b09 100%) !important;\n      color: var(--ink) !important;\n      font-family: 'Cormorant Garamond', Georgia, serif !important;\n      min-height: 100vh;\n      overflow-x: hidden;\n    }\n\n    /* Warm ambient glow */\n    body::after {\n      content: \"\"; position: fixed; inset: 0; pointer-events: none; z-index: 9998;\n      background: radial-gradient(ellipse 900px 900px at 50% 40%, rgba(180,120,60,.07) 0%, transparent 70%);\n    }\n\n    /* \u2500\u2500 Book wrap \u2500\u2500 */\n    .book-wrap {\n      background: transparent !important;\n      max-width: 1060px;\n      margin: 0 auto;\n      padding: 24px 24px 60px;\n    }\n\n    /* \u2500\u2500 Book \u2014 warm parchment open-book \u2500\u2500 */\n    .book {\n      display: grid !important;\n      grid-template-columns: 1fr 1fr !important;\n      align-items: stretch !important;\n      gap: 0 !important;\n      background: transparent !important;\n      border: none !important;\n      box-shadow: none !important;\n      border-radius: 24px !important;\n      filter: drop-shadow(0 24px 60px rgba(0,0,0,.75)) drop-shadow(0 8px 20px rgba(0,0,0,.5)) !important;\n      transform: perspective(1600px) rotateX(2.5deg) !important;\n      transform-origin: 50% 0 !important;\n      margin-top: 10px !important;\n      overflow: hidden !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n    }\n    @media(max-width: 860px) {\n      .book { grid-template-columns: 1fr !important; transform: none !important; max-height: none !important; border-radius: 12px !important; }\n    }\n\n    /* \u2500\u2500 Pages \u2500\u2500 */\n    .parchment, .page-left, .page-right {\n      background: var(--panel) !important;\n      border: none !important;\n      border-radius: 0 !important;\n      box-shadow: none !important;\n      color: var(--ink) !important;\n      position: relative;\n      overflow-y: auto;\n      overflow-x: hidden;\n    }\n    /* Dot-texture paper grain */\n    .page-left::before, .page-right::before {\n      content: \"\" !important;\n      position: absolute !important; inset: 0 !important;\n      pointer-events: none !important; z-index: 0 !important;\n      opacity: .08 !important;\n      background-image: radial-gradient(circle, rgba(0,0,0,.25) 1px, transparent 1px) !important;\n      background-size: 12px 12px !important;\n    }\n    .page-left  { border-right: none !important; background: var(--page-l) !important; }\n    .page-right { border-left:  none !important; background: var(--page-r) !important; }\n\n    /* Spine-edge shadow */\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n\n    /* Decorative corner brackets */\n    .page-inner { padding: 28px 30px !important; position: relative; }\n    .page-inner::before {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 14px !important; left: 14px !important;\n      width: 28px !important; height: 28px !important;\n      border-left: 1.5px solid rgba(138,91,68,.45) !important;\n      border-top: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-inner::after {\n      content: \"\" !important;\n      position: absolute !important;\n      bottom: 14px !important; right: 14px !important;\n      width: 28px !important; height: 28px !important;\n      border-right: 1.5px solid rgba(138,91,68,.45) !important;\n      border-bottom: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-left  { border-right: none !important; background: var(--page-l) !important; }\n    .page-right { border-left:  none !important; background: var(--page-r) !important; }\n\n    .spine-inner, .spine-highlight, .spine-shadow,\n    .spine-title, .spine-rule, .spine-diamond, .spine-chapter { display: none !important; }\n\n    /* \u2500\u2500 Chapter label / subtitle \u2500\u2500 */\n    .chapter-label {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 9.5px !important;\n      letter-spacing: .42em !important;\n      text-transform: uppercase !important;\n      color: var(--ink) !important;\n      margin-bottom: 5px !important;\n    }\n    .chapter-sub {\n      font-size: 17px !important;\n      font-style: italic !important;\n      color: var(--ink) !important;\n      margin-bottom: 0 !important;\n    }\n\n        /* \u2500\u2500 Divider \u2500\u2500 */\n    .ink-divider, hr.ink-divider {\n      border: none !important;\n      border-top: 1px solid rgba(200,180,120,.40) !important;\n      margin: 12px 0 !important;\n      opacity: 1 !important;\n    }\n\n    /* \u2500\u2500 Body text colour remaps \u2500\u2500 */\n    p, li, span { color: var(--ink) !important; }\n    [style*=\"color:var(--ink)\"] { color: var(--ink) !important; }\n    [style*=\"color:var(--ink-dim)\"] { color: var(--ink-dim) !important; }\n    /* Normalize stale light-yellow inline colors on parchment pages only. */\n    .parchment [style*=\"color:#c8b96e\"], .parchment [style*=\"color: #c8b96e\"],\n    .parchment [style*=\"color:#c8b880\"], .parchment [style*=\"color: #c8b880\"],\n    .parchment [style*=\"color:#f0d060\"], .parchment [style*=\"color: #f0d060\"],\n    .parchment [style*=\"color:#e8d8b0\"], .parchment [style*=\"color: #e8d8b0\"],\n    .parchment [style*=\"color:#f0e0c0\"], .parchment [style*=\"color: #f0e0c0\"],\n    .parchment [style*=\"color:#f0c080\"], .parchment [style*=\"color: #f0c080\"],\n    .parchment [style*=\"color:#a08858\"], .parchment [style*=\"color: #a08858\"],\n    .parchment [style*=\"color:#e8d8a8\"], .parchment [style*=\"color: #e8d8a8\"] { color: var(--ink) !important; }\n    [style*=\"background:rgba(200,184,128\"] { background: rgba(138,91,68,.08) !important; }\n    [style*=\"border-color:rgba(139,106,32\"] { border-color: rgba(138,91,68,.30) !important; }\n\n    /* \u2500\u2500 Story text \u2500\u2500 */\n    .story-text {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 17px !important;\n      line-height: 1.65 !important;\n      color: var(--ink) !important;\n      white-space: pre-line !important;\n    }\n    .story-text.drop-cap::first-letter {\n      font-size: 3.8em !important;\n      float: left !important;\n      line-height: .78 !important;\n      margin: .05em .12em 0 0 !important;\n      color: var(--gold) !important;\n      font-weight: 600 !important;\n    }\n\n    /* \u2500\u2500 Notice / outcome box \u2500\u2500 */\n    .notice-box {\n      border: 1px solid rgba(200,180,120,.50) !important;\n      background: rgba(30,20,15,.85) !important;\n      color: #f0d060 !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 11px !important;\n      letter-spacing: .06em !important;\n      padding: 10px 14px !important;\n      border-radius: 0 !important;\n      margin-top: 14px !important;\n    }\n\n        /* \u2500\u2500 HUD (parchment-readable) \u2500\u2500 */\n    #hud { color: var(--ink); }\n    #hud p, #hud span, #hud div { color: var(--ink); }\n    /* seal-label: NO !important so inline color:${bc} wins for badge tint */\n    #hud .hud-badge-row .hud-seal-label { font-family: 'Cinzel', serif; font-weight: 600; letter-spacing: .04em; }\n    #hud .hud-chapter { color: var(--ink-dim) !important; font-family: 'JetBrains Mono',monospace !important; font-size: .62rem !important; letter-spacing: .08em !important; }\n    #hud .stat-key { color: var(--ink-dim) !important; font-family: 'JetBrains Mono',monospace !important; font-size: .6rem !important; letter-spacing: .08em !important; }\n    #hud .stat-val { color: var(--ink) !important; font-family: 'JetBrains Mono',monospace !important; font-weight: 600; }\n    #hud .stat-bar-wrap { background: rgba(43,29,22,.18) !important; border-radius: 0 !important; }\n    #hud .stat-box { background: rgba(138,91,68,.10) !important; border: 1px solid rgba(138,91,68,.35) !important; border-radius: 0 !important; }\n    #hud .stat-box-key { color: var(--ink-dim) !important; font-family: 'JetBrains Mono',monospace !important; letter-spacing: .08em !important; }\n    #hud .stat-box-val { color: var(--ink) !important; font-family: 'Cinzel',serif !important; font-weight: 600 !important; }\n    #hud button {\n      background: rgba(138,91,68,.10) !important;\n      border: 1px solid rgba(138,91,68,.40) !important;\n      color: var(--ink) !important;\n      border-radius: 0 !important;\n      font-family: 'JetBrains Mono',monospace !important;\n      transition: border-color .2s, color .2s, background .2s !important;\n    }\n    #hud button:hover { border-color: var(--gold-dim) !important; color: var(--gold-dim) !important; background: rgba(138,91,68,.06) !important; }\n    #hud div[onclick] {\n      background: rgba(138,91,68,.10) !important;\n      border: 1px solid rgba(138,91,68,.45) !important;\n      color: var(--ink) !important;\n      border-radius: 0 !important;\n      font-weight: 500;\n    }\n    /* Remap stale light-on-cream inline colors anywhere inside the HUD */\n    #hud [style*=\"color:#c8b96e\"], #hud [style*=\"color: #c8b96e\"],\n    #hud [style*=\"color:#c8b880\"], #hud [style*=\"color: #c8b880\"],\n    #hud [style*=\"color:#f0d060\"], #hud [style*=\"color: #f0d060\"],\n    #hud [style*=\"color:#e8d8b0\"], #hud [style*=\"color: #e8d8b0\"],\n    #hud [style*=\"color:#f0e0c0\"], #hud [style*=\"color: #f0e0c0\"],\n    #hud [style*=\"color:#f0c080\"], #hud [style*=\"color: #f0c080\"] { color: var(--ink) !important; }\n\n    /* \u2500\u2500 Buttons / choices \u2014 warm parchment \u2500\u2500 */\n    button:not(.bm-signout), .choice, .combat-btn {\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.35) !important;\n      border-radius: 0 !important;\n      color: var(--ink) !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 10px !important; letter-spacing: .08em !important;\n      cursor: pointer !important;\n      transition: border-color .2s, color .2s, background .2s !important;\n    }\n    button:hover, .choice:hover, .combat-btn:hover:not(:disabled) {\n      border-color: var(--gold) !important;\n      color: var(--gold) !important;\n      background: rgba(138,91,68,.07) !important;\n    }\n\n    /* \u2500\u2500 Choices panel \u2500\u2500 */\n    .choices-label {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 10px !important;\n      letter-spacing: .38em !important;\n      text-transform: uppercase !important;\n      color: var(--ink-dim) !important;\n      margin-bottom: 12px !important;\n    }\n    .choices { display: flex; flex-direction: column; gap: 8px; }\n\n    button.choice, .choice {\n      background: rgba(244,234,215,.60) !important;\n      border: 1px solid rgba(138,91,68,.35) !important;\n      border-radius: 0 !important;\n      color: var(--ink) !important;\n      padding: 12px 14px !important;\n      text-align: left !important;\n      cursor: pointer !important;\n      transition: border-color .2s, background .2s, transform .2s !important;\n      display: flex !important;\n      align-items: flex-start !important;\n      gap: 10px !important;\n      width: 100% !important;\n      font-family: 'Cormorant Garamond', serif !important;\n    }\n    button.choice:hover, .choice:hover {\n      border-color: var(--ice) !important;\n      background: rgba(138,91,68,.12) !important;\n      transform: translateX(4px) !important;\n    }\n    button.choice.danger, .choice.danger {\n      border-color: rgba(192,57,43,.35) !important;\n    }\n    button.choice.danger:hover, .choice.danger:hover {\n      border-color: var(--warn) !important;\n      background: rgba(192,57,43,.08) !important;\n    }\n    button.choice.locked, .choice.locked {\n      opacity: .45 !important;\n      cursor: default !important;\n      border-color: rgba(138,91,68,.15) !important;\n    }\n    .choice-arrow {\n      color: var(--gold) !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 13px !important;\n      flex-shrink: 0 !important;\n      margin-top: 1px !important;\n    }\n    button.choice.danger .choice-arrow, .choice.danger .choice-arrow { color: var(--warn) !important; }\n    .choice-body {\n      font-size: 17px !important;\n      color: var(--ink) !important;\n      display: flex !important;\n      flex-direction: column !important;\n    }\n    .choice-sub {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 9.5px !important;\n      letter-spacing: .06em !important;\n      color: var(--ink-dim) !important;\n      margin-top: 3px !important;\n    }\n\n    /* \u2500\u2500 Stat bars \u2500\u2500 */\n    .stat-bar-wrap { background: rgba(0,0,0,.08) !important; border-radius: 0 !important; }\n    .stat-key { color: var(--ink-dim) !important; font-family: 'JetBrains Mono',monospace !important; font-size: .58rem !important; letter-spacing: .08em !important; }\n    .stat-val { color: var(--ink) !important; }\n\n    /* \u2500\u2500 Combat panel \u2500\u2500 */\n    .combat-panel {\n      background: rgba(244,234,215,.80) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      padding: 16px !important;\n      position: relative;\n    }\n    .combat-panel::before {\n      content: \"\"; position: absolute; top: -1px; left: -1px;\n      width: 12px; height: 12px;\n      border-top: 1px solid var(--gold); border-left: 1px solid var(--gold);\n    }\n    .combat-enemy-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }\n    .combat-enemy-icon { font-size: 2.5rem; }\n    .combat-enemy-name {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 20px !important; font-weight: 600 !important;\n      letter-spacing: .04em !important; color: var(--ink) !important;\n    }\n    .combat-log {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-style: italic !important;\n      font-size: 15px !important;\n      line-height: 1.55 !important;\n      color: var(--ink-dim) !important;\n      background: rgba(0,0,0,.06) !important;\n      border: 1px solid rgba(138,91,68,.20) !important;\n      border-radius: 0 !important;\n      padding: 10px 12px !important;\n      min-height: 3rem !important;\n      margin-bottom: 10px !important;\n    }\n    .combat-log em     { color: var(--gold) !important; font-style: italic; }\n    .combat-log strong { color: var(--warn) !important; font-style: normal; }\n    .stat-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }\n    .stat-bar-wrap {\n      flex: 1; height: 5px !important;\n      background: rgba(0,0,0,.08) !important;\n      border-radius: 0 !important; overflow: hidden;\n    }\n    .stat-bar { height: 100%; transition: width .4s, background .4s; }\n    .stat-key {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: .58rem !important; letter-spacing: .08em !important;\n      color: var(--ink-dim) !important; min-width: 44px;\n    }\n    .stat-val {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: .6rem !important; color: var(--ink) !important;\n      min-width: 50px; text-align: right;\n    }\n\n    /* \u2500\u2500 Combat action buttons \u2500\u2500 */\n    .combat-btn {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: .6rem !important; letter-spacing: .06em !important;\n      color: var(--ink) !important;\n      background: rgba(244,234,215,.50) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      padding: .45rem .5rem !important;\n      cursor: pointer !important;\n      transition: border-color .2s, background .2s, color .2s !important;\n      display: flex !important; align-items: center !important; justify-content: center !important;\n    }\n    .combat-btn:hover:not(:disabled) {\n      border-color: var(--gold) !important;\n      color: var(--gold) !important;\n      background: rgba(138,91,68,.10) !important;\n    }\n    .combat-btn:disabled { opacity: .35 !important; cursor: not-allowed !important; }\n\n    /* stat-grid inside HUD */\n    .stat-grid {\n      display: grid;\n      grid-template-columns: repeat(3,1fr);\n      gap: 4px; margin-top: 6px;\n    }\n\n    /* \u2500\u2500 End screen \u2500\u2500 */\n    .end-box {\n      background: rgba(244,234,215,.80) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      padding: 20px !important;\n      position: relative;\n    }\n    .end-box::before { content:\"\"; position:absolute; top:-1px; left:-1px; width:14px; height:14px; border-top:1px solid var(--gold); border-left:1px solid var(--gold); }\n    .end-box::after  { content:\"\"; position:absolute; bottom:-1px; right:-1px; width:14px; height:14px; border-bottom:1px solid var(--gold); border-right:1px solid var(--gold); }\n    .end-title {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 22px !important; font-weight: 600 !important;\n      letter-spacing: .06em !important;\n      color: var(--gold) !important;\n      margin-bottom: 10px !important;\n    }\n    .end-sub {\n      font-style: italic !important;\n      font-size: 16px !important;\n      color: var(--ink-dim) !important;\n      line-height: 1.55 !important;\n      margin-bottom: 14px !important;\n    }\n    .end-btn {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: .75rem !important;\n      letter-spacing: .14em !important;\n      text-transform: uppercase !important;\n      color: var(--ink) !important;\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.35) !important;\n      border-radius: 0 !important;\n      padding: .55rem 1.2rem !important;\n      cursor: pointer !important;\n      transition: border-color .2s, color .2s, background .2s !important;\n      text-decoration: none !important;\n      display: inline-block !important;\n    }\n    .end-btn:hover {\n      border-color: var(--gold) !important;\n      color: var(--gold) !important;\n      background: rgba(138,91,68,.07) !important;\n    }\n\n    /* \u2500\u2500 Items panel \u2500\u2500 */\n    #items-panel, [id$=\"-items-panel\"] {\n      background: rgba(244,234,215,.70) !important;\n      border: 1px solid rgba(138,91,68,.25) !important;\n      border-radius: 0 !important;\n    }\n    [id$=\"-items-panel\"] p,\n    [id$=\"-items-panel\"] span { color: var(--ink) !important; }\n\n    /* \u2500\u2500 animate-in \u2500\u2500 */\n    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }\n    .animate-in { animation: fadeIn .4s ease forwards; }\n    @keyframes animateShake {\n      0%,100%{transform:translateX(0)}\n      20%,60%{transform:translateX(-4px)}\n      40%,80%{transform:translateX(4px)}\n    }\n    .animate-shake { animation: animateShake .35s ease; }\n\n    /* \u2500\u2500 Items panel \u2500\u2500 */\n    #items-panel, [id$=\"-items-panel\"] {\n      background: rgba(244,234,215,.70) !important;\n      border: 1px solid rgba(138,91,68,.25) !important;\n      border-radius: 0 !important;\n    }\n    [id$=\"-items-panel\"] p,\n    [id$=\"-items-panel\"] span { color: var(--ink) !important; }\n\n    /* \u2500\u2500 animate-in \u2500\u2500 */\n    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }\n    .animate-in { animation: fadeIn .4s ease forwards; }\n    @keyframes animateShake {\n      0%,100%{transform:translateX(0)}\n      20%,60%{transform:translateX(-4px)}\n      40%,80%{transform:translateX(4px)}\n    }\n    .animate-shake { animation: animateShake .35s ease; }\n\n        /* \u2500\u2500 System overlay messages \u2500\u2500 */\n    .sys-overlay, [id=\"sys-overlay\"] {\n      background: rgba(20,15,10,.98) !important;\n      border: 1px solid rgba(240,200,80,.70) !important;\n      color: #f0e0a0 !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 11px !important;\n      letter-spacing: .08em !important;\n      border-radius: 4px !important;\n      box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;\n      text-shadow: 0 0 2px rgba(0,0,0,0.5) !important;\n    }\n    .sys-overlay span, [id=\"sys-overlay\"] span,\n    .sys-overlay p, [id=\"sys-overlay\"] p {\n      color: #f0e0a0 !important;\n    }\n\n    /* \u2500\u2500 Toast \u2500\u2500 */\n    .toast, [class*=\"toast\"] {\n      background: rgba(20,15,10,.98) !important;\n      border: 1px solid rgba(240,200,80,.70) !important;\n      color: #f0e0a0 !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      border-radius: 4px !important;\n      font-size: 11px !important;\n      text-shadow: 0 0 2px rgba(0,0,0,0.5) !important;\n    }\n    .toast span, [class*=\"toast\"] span,\n    .toast p, [class*=\"toast\"] p {\n      color: #f0e0a0 !important;\n    }\n\n    /* \u2500\u2500 Loot window \u2500\u2500 */\n    #loot-window {\n      background: rgba(241,228,207,.96) !important;\n      border-color: rgba(138,91,68,.40) !important;\n      border-radius: 0 !important;\n      color: var(--ink) !important;\n    }\n    #loot-window p, #loot-window span { color: var(--ink) !important; }\n\n    /* \u2500\u2500 Stat window modal \u2500\u2500 */\n    #stat-window > div {\n      background: rgba(244,234,215,.97) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n    }\n    #stat-window * { color: var(--ink) !important; }\n    #stat-window [style*=\"background:rgba(200\"] {\n      background: rgba(138,91,68,.07) !important;\n    }\n\n    /* \u2500\u2500 Judge image \u2500\u2500 */\n    #judge-img {\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      filter: drop-shadow(0 0 20px rgba(138,91,68,.20)) !important;\n    }\n\n    /* \u2500\u2500 combat-over \u2500\u2500 */\n    [id$=\"-combat-over\"] { color: var(--ink) !important; }\n    [id$=\"-combat-over\"] button {\n      font-family: 'JetBrains Mono', monospace !important;\n      color: var(--ink) !important;\n      background: rgba(138,91,68,.07) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      cursor: pointer !important;\n      transition: border-color .15s, color .15s !important;\n    }\n    [id$=\"-combat-over\"] button:hover { border-color: var(--gold) !important; color: var(--gold) !important; }\n\n    /* \u2500\u2500 Modals \u2500\u2500 */\n    [id$=\"-window\"] > div, .end-box {\n      background: rgba(244,234,215,.97) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n    }\n\n    /* \u2500\u2500 Right panel zone cards \u2500\u2500 */\n    #right-panel div[onclick] { border-radius: 0 !important; }\n\n    /* \u2500\u2500 Spine \u2014 warm book gutter \u2500\u2500 */\n    .spine {\n      background: linear-gradient(90deg,\n        rgba(232,210,170,.0)   0%,\n        rgba(200,170,120,.25)  15%,\n        rgba(160,120,70,.55)   30%,\n        rgba(90,55,20,.88)     43%,\n        rgba(40,20,5,1.0)      50%,\n        rgba(90,55,20,.88)     57%,\n        rgba(160,120,70,.55)   70%,\n        rgba(200,170,120,.25)  85%,\n        rgba(232,210,170,.0)   100%\n      ) !important;\n      border-left:  none !important;\n      border-right: none !important;\n      position: relative; z-index: 5;\n      width: 32px !important;\n      min-width: 32px !important;\n      margin: 0 !important;\n      overflow: visible;\n      box-shadow: none !important;\n    }\n    .spine::before {\n      content: \"\";\n      position: absolute;\n      top: 0; bottom: 0; left: 50%;\n      width: 1px;\n      transform: translateX(-50%);\n      background: linear-gradient(180deg,\n        transparent 0%,\n        rgba(43,29,22,.9) 8%,\n        rgba(43,29,22,.9) 92%,\n        transparent 100%);\n      z-index: 2;\n    }\n    .spine::after {\n      content: \"\";\n      position: absolute;\n      top: 2px; bottom: 2px; left: -3px;\n      width: 3px;\n      background: repeating-linear-gradient(\n        180deg,\n        rgba(138,91,68,.08) 0px,\n        rgba(138,91,68,.03) 1px,\n        rgba(0,0,0,.10)     1px,\n        rgba(0,0,0,.04)     2px\n      );\n      border-left: 1px solid rgba(138,91,68,.12);\n      z-index: 1;\n    }\n\n    /* \u2500\u2500 Scrollbar \u2500\u2500 */\n    ::-webkit-scrollbar { width: 5px; }\n    ::-webkit-scrollbar-track { background: rgba(43,29,22,.20); }\n    ::-webkit-scrollbar-thumb { background: rgba(138,91,68,.35); }\n    ::-webkit-scrollbar-thumb:hover { background: var(--gold-dim); }\n\n    /* \u2500\u2500 Page-flip decorative animation \u2500\u2500 */\n    /* \u2500\u2500 Page-flip animation \u2014 triggered on navigation only \u2500\u2500 */\n    @keyframes bookPageFlip {\n      0%   { transform: perspective(1200px) rotateY(0deg);    opacity: 0; }\n      6%   { opacity: .92; }\n      50%  { transform: perspective(1200px) rotateY(-180deg); opacity: .92; }\n      80%  { opacity: 0; }\n      100% { transform: perspective(1200px) rotateY(-180deg); opacity: 0; }\n    }\n    .page-flip-decorator {\n      position: absolute;\n      top: 0; right: 0;\n      width: 50%; height: 100%;\n      transform-origin: left center;\n      pointer-events: none;\n      z-index: 40;\n      opacity: 0;\n      background: linear-gradient(to left, rgba(241,228,207,.96) 0%, rgba(230,215,190,.92) 60%, rgba(215,196,165,.72) 100%);\n      box-shadow: -4px 0 20px rgba(0,0,0,.15);\n    }\n    .page-flip-decorator.playing {\n      animation: bookPageFlip 0.55s cubic-bezier(0.4,0,0.2,1) forwards;\n    }\n    .page-flip-decorator::after { content: \"\"; }\n  "

function installModuleStyle() {
  document.querySelectorAll('style[data-book-module-style]').forEach(el => el.remove())
  const style = document.createElement('style')
  style.id = MODULE_STYLE_ID
  style.dataset.bookModuleStyle = 'true'
  style.textContent = MODULE_STYLES
  document.head.appendChild(style)
}

export async function mountChapter1(__mountOptions = {}) {
  const host = __mountOptions.host || document.getElementById('book-module-host') || document.body
  installModuleStyle()
  host.innerHTML = MODULE_MARKUP

  // ── Chapter data ─────────────────────────────────


  // ── Constants ────────────────────────────────────
  // XP needed to reach next level — exponential curve
  // Level 1→2: 100, 2→3: 150, 3→4: 225, 4→5: 337, 5→6: 506, 6→7: 759...
  function xpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1))
  }

  // ── App state ────────────────────────────────────
  // Always call renderNav so the bookmark re-paints on every mount.
  // (Same fix as ch2/garage — fire-and-forget when host already passed
  // us the player object; await it otherwise so we still get a player.)
  let player = __mountOptions.player
  if (player) {
    window.renderNav(__mountOptions.navId || 'nav').catch(e => console.warn('[ch1] nav render failed', e))
  } else {
    player = await window.renderNav(__mountOptions.navId || 'nav')
  }
  if (!player) throw new Error('no player')

  let currentHp = player.hp || 100
  let nodeId    = (player.current_node || '').startsWith('ch1_')
    ? player.current_node.replace('ch1_', '')
    : 'opening'
  let bossMode  = 'solo'
  let outcome   = null

  if (!NODES[nodeId]) nodeId = 'opening'

  // ── Level up logic ───────────────────────────────
  async function checkLevelUp(oldXp, newXp, oldLevel) {
    let level   = oldLevel
    let xp      = newXp
    let leveled = false
    let levelsGained = 0

    while (xp >= xpForLevel(level)) {
      xp -= xpForLevel(level)
      level += 1
      leveled = true
      levelsGained++
    }

    if (!leveled) return null

    // +5 HP per level (not 20)
    const newMaxHp  = (player.max_hp || 100) + levelsGained * 5
    const newHp     = newMaxHp  // full restore on level up

    // 1 SP per level gained
    const spGained  = levelsGained * 1
    const newSP     = (player.skill_points || 0) + spGained
    player.skill_points = newSP
    const newClaimed = (player.sp_claimed || 0) + spGained
    player.sp_claimed = newClaimed

    // +1 to all base stats per level
    const statGain = levelsGained
    const updStats = {
      atk:     (player.atk     || 1) + statGain,
      def:     (player.def     || 0) + statGain,
      power:   (player.power   || 0) + statGain,
      guard:   (player.guard   || 0) + statGain,
      speed:   (player.speed   || 0) + statGain,
      insight: (player.insight || 0) + statGain,
      luck:    (player.luck    || 0) + statGain,
      control: (player.control || 0) + statGain,
      agility: (player.agility || 0) + statGain,
    }
    Object.assign(player, updStats)

    currentHp = newHp
    player.max_hp = newMaxHp
    player.level  = level
    player.xp     = newXp

    window.showToast('LEVEL UP! Lvl ' + level + ' — +5 HP · +1 all stats · +' + spGained + ' SP!')
    renderHUD()

    return { level, max_hp: newMaxHp, hp: newHp, xp: newXp,
             skill_points: newSP, sp_claimed: newClaimed, ...updStats }
  }

  // ── HUD ──────────────────────────────────────────
  function renderHUD() {
    const hp  = currentHp
    const mhp = player.max_hp || 100
    const xp  = player.xp || 0
    const lvl = player.level || 1
    const hpPct  = Math.max(0, Math.round(hp / mhp * 100))
    const hpCol  = hpPct > 60 ? '#5ec45e' : hpPct > 30 ? '#c8b96e' : '#e05555'
    const xpNext = xpForLevel(lvl)
    const xpIntoLevel = Math.max(0, Math.min(xp, xpNext - 1))
    const xpPct = Math.min(100, Math.round(xpIntoLevel / xpNext * 100))

    // ── Moral standing (HUD display) ─────────────────────────
    // Shared 6-tier ladder via reputation.js (Hero/Good/Neutral/Ruthless/Corrupt/Villain).
    const tier = getMoralTier(player.moral_score)
    const moralPct = getMoralBarPct(player.moral_score)
    const dotLeft = Math.max(2, Math.min(94, moralPct))

    document.getElementById('hud').innerHTML = `
      <div class="hud-badge-row">
        ${renderReputationBadge(player.moral_score, { size: 46 })}
        <div>
          <p class="hud-seal-label" style="color:${tier.color}">${tier.label}</p>
          <p class="hud-chapter">Chapter ${player.current_chapter||1} · Lvl ${lvl}</p>
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-key">HP</span>
        <div class="stat-bar-wrap"><div class="stat-bar" id="hp-bar" style="width:${hpPct}%;background:${hpCol};transition:width .4s,background .4s"></div></div>
        <span class="stat-val" id="hp-val">${hp}/${mhp}</span>
      </div>
      <div class="stat-row">
        <span class="stat-key">XP</span>
        <div class="stat-bar-wrap"><div class="stat-bar" style="width:${xpPct}%;background:#a07de0;transition:width .4s"></div></div>
        <span class="stat-val" style="font-size:.52rem;min-width:60px;text-align:right">${xpIntoLevel}/${xpNext}</span>
      </div>
      <div style="margin-bottom:5px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
          <span style="font-family:'JetBrains Mono',monospace;font-size:.55rem;color:var(--ink);font-weight:600;letter-spacing:.14em">REPUTATION</span>
          <span style="font-family:'Cinzel',serif;font-size:.5rem;font-weight:600;color:${tier.color};letter-spacing:.06em">${tier.label.toUpperCase()}</span>
        </div>
        <div style="position:relative;height:5px;background:linear-gradient(to right,#e05555,#e07a40,#c8b96e,#c8e8a0,#a0d0ff);border-radius:3px">
          <div style="position:absolute;top:-2px;left:${dotLeft}%;width:9px;height:9px;background:${tier.color};border-radius:50%;transform:translateX(-50%);border:1px solid rgba(0,0,0,.3);transition:left .5s,background .5s"></div>
        </div>
      </div>
      ${(player.skill_points||0)>0?`<div onclick="window.bookNavigate('skills.html')" style="background:rgba(160,125,224,.25);border:1px solid rgba(160,125,224,.5);border-radius:3px;padding:4px 8px;margin-bottom:6px;font-family:'Share Tech Mono',monospace;font-size:.6rem;color:var(--ink);cursor:pointer;text-align:center">⬡ ${player.skill_points} SKILL POINTS — tap to spend</div>`:''}
      <div class="stat-grid">
        <div class="stat-box"><span class="stat-box-key">ATK</span><span class="stat-box-val">${calcATK()}</span></div>
        <div class="stat-box"><span class="stat-box-key">DEF</span><span class="stat-box-val">${calcDEF()}</span></div>
        <div class="stat-box"><span class="stat-box-key">GOLD</span><span class="stat-box-val">${player.gold||0}</span></div>
      </div>
      <div style="display:flex;gap:4px;margin-top:6px">
        <button onclick="openStatWindow()" style="flex:1;font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);background:rgba(200,184,128,.2);border:.5px solid rgba(139,106,32,.4);border-radius:2px;padding:3px 0;cursor:pointer;letter-spacing:.06em">📊 STATS</button>
        <button onclick="window.bookNavigate('skills.html')" style="flex:1;font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);background:rgba(160,125,224,.2);border:.5px solid rgba(160,125,224,.4);border-radius:2px;padding:3px 0;cursor:pointer;letter-spacing:.06em">⬡ SKILLS</button>
      </div>
      ${getDefeatedBosses().length>0?`<button onclick="goTo('district_hub')" style="width:100%;margin-top:4px;font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);background:rgba(94,174,224,.15);border:.5px solid rgba(94,174,224,.35);border-radius:2px;padding:3px 0;cursor:pointer;letter-spacing:.06em">⚔ FARM ZONES</button>`:''}
    `
  }

  function updateHpBar(hp) {
    currentHp = hp
    const mhp = player.max_hp || 100
    const pct = Math.max(0, Math.round(hp / mhp * 100))
    const col = pct > 60 ? '#5ec45e' : pct > 30 ? '#c8b96e' : '#e05555'
    const bar = document.getElementById('hp-bar')
    const val = document.getElementById('hp-val')
    if (bar) { bar.style.width = pct+'%'; bar.style.background = col }
    if (val) val.textContent = hp+'/' + ''+(player.max_hp||100)
  }

  // ── Save ─────────────────────────────────────────
  async function save(updates) {
    // Preserve defeated_bosses across the merge in case DB returns it empty.
    const prevDefeated = updates.defeated_bosses || player.defeated_bosses || []
    const { data } = await supabase
      .from('players').update({ ...updates, last_seen_at: new Date().toISOString() })
      .eq('id', player.id).select().single()
    if (data) {
      // Merge DB-returned fields into the existing player object instead of
      // rebinding the variable to a new object. This preserves reference
      // identity across every module that already holds the player (book.html's
      // currentPlayer, every previously-mounted module, etc.) so post-save
      // mutations don't get orphaned on the old reference. Without this, the
      // HUD would read fresh state from the rebound local while sibling pages
      // (skills, inventory, ...) would read stale state from the original
      // object that book.html cached at first load.
      Object.assign(player, data)
      currentHp = data.hp
      if (!player.defeated_bosses || !player.defeated_bosses.length) {
        player.defeated_bosses = prevDefeated
      }
    }
    renderHUD()
  }

  // ── Defeated bosses helpers ───────────────────────
  function getDefeatedBosses() {
    return player.defeated_bosses || []
  }

  function markBossDefeated(bossKey) {
    const defeated = [...getDefeatedBosses()]
    if (!defeated.includes(bossKey)) defeated.push(bossKey)
    player.defeated_bosses = defeated
    return defeated
  }

  // ── Add item ─────────────────────────────────────
  // ── Loot drop queue — collect drops then show summary window ──
  let _lootQueue = []
  let _lootTimerId = null
  let _lootSuppressed = false  // suppress mid-sequence flashes

  function queueLoot(name, qty, img) {
    _lootQueue.push({ name, qty, img })
    clearTimeout(_lootTimerId)
    _lootTimerId = setTimeout(showLootWindow, 800)
  }

  function suppressLoot() { _lootSuppressed = true }
  function unsuppressLoot() { _lootSuppressed = false }

  function showLootWindow() {
    if (_lootSuppressed || !_lootQueue.length) return
    const drops = [..._lootQueue]
    _lootQueue = []

    // Remove existing loot window if any
    document.getElementById('loot-window')?.remove()

    const win = document.createElement('div')
    win.id = 'loot-window'
    win.style.cssText = `
      position:fixed;bottom:80px;right:20px;z-index:500;
      background:#0f0d08;border:1px solid rgba(200,184,128,.5);
      border-radius:6px;padding:0;min-width:220px;max-width:280px;
      box-shadow:0 8px 40px rgba(0,0,0,.8);animation:fadeIn .3s ease;
      font-family:'Share Tech Mono',monospace;
    `
    win.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid rgba(200,184,128,.2)">
        <span style="font-size:.62rem;letter-spacing:.1em;color:#c8b880">ITEMS OBTAINED</span>
        <button onclick="document.getElementById('loot-window').remove()" style="background:none;border:none;color:var(--ink-dim);cursor:pointer;font-size:1rem;line-height:1;padding:0 2px">✕</button>
      </div>
      <div style="padding:6px 0;max-height:280px;overflow-y:auto">
        ${drops.map(d => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:.5px solid rgba(200,184,128,.1)">
            ${d.img ? `<img src="${d.img}" style="width:28px;height:28px;object-fit:contain;border-radius:3px;flex-shrink:0">` : `<span style="font-size:1.1rem;flex-shrink:0">📦</span>`}
            <span style="font-size:.68rem;color:#e8d8a8;flex:1">${d.name}</span>
            ${d.qty > 1 ? `<span style="font-size:.58rem;color:var(--ink-dim)">×${d.qty}</span>` : ''}
            <button onclick="declineDrop('${d.name}',this)" style="background:none;border:.5px solid rgba(224,85,85,.3);color:#e05555;cursor:pointer;font-size:.55rem;padding:1px 5px;border-radius:2px;font-family:'Share Tech Mono',monospace">skip</button>
          </div>
        `).join('')}
      </div>
      <div style="padding:8px 12px;display:flex;justify-content:flex-end">
        <button onclick="document.getElementById('loot-window').remove()" style="font-family:'Cinzel',serif;font-size:.68rem;color:var(--ink);background:rgba(200,184,128,.5);border:1px solid rgba(139,106,32,.6);padding:4px 14px;border-radius:2px;cursor:pointer">Keep All</button>
      </div>
    `
    document.body.appendChild(win)

    // Auto-dismiss after 8 seconds
    setTimeout(() => win.remove?.(), 8000)
  }

  window.declineDrop = async function(itemName, btn) {
    // Find item in inventory by name and delete it
    const { data } = await supabase.from('inventory').select('id').eq('player_id', player.id).eq('name', itemName).order('obtained_at',{ascending:false}).limit(1)
    if (data?.[0]) await supabase.from('inventory').delete().eq('id', data[0].id)
    btn.closest('div[style]').remove()
  }



  function getItemImg(k) { return ITEM_IMAGES[k] || null }

  async function addItem(itemKey, qty = 1) {
    const { data: m } = await supabase.from('items').select('*').eq('item_key', itemKey).single()
    if (!m) return
    const stackable = ['consumable','material','key']
    if (stackable.includes(m.item_type)) {
      // Always check for existing stack first — never rely on DB unique constraint
      const { data: ex, error: exErr } = await supabase
        .from('inventory').select('id,quantity')
        .eq('player_id', player.id).eq('item_key', itemKey)
        .maybeSingle()

      if (exErr) console.warn('addItem stack check error:', exErr.message)

      if (ex) {
        // Stack exists — increment quantity
        const { error: upErr } = await supabase.from('inventory')
          .update({ quantity: (ex.quantity || 1) + qty })
          .eq('id', ex.id)
        if (upErr) console.warn('addItem stack update error:', upErr.message)
      } else {
        // No existing stack — plain INSERT (no upsert, no constraint needed)
        const { error: insErr } = await supabase.from('inventory').insert({
          player_id:player.id, item_key:m.item_key, name:m.name, item_type:m.item_type,
          subtype:m.subtype, rarity:m.rarity, atk_bonus:m.atk_bonus||0, def_bonus:m.def_bonus||0,
          hp_restore:m.hp_restore||0, two_handed:m.two_handed||false, icon:m.icon, quantity:qty,
          element:m.element||'none', power_bonus:m.power_bonus||0, control_bonus:m.control_bonus||0,
          guard_bonus:m.guard_bonus||0, speed_bonus:m.speed_bonus||0,
          insight_bonus:m.insight_bonus||0, luck_bonus:m.luck_bonus||0,
          agility_bonus:m.agility_bonus||0, max_hp_bonus:m.max_hp_bonus||0,
          special_effect:m.special_effect||null, sockets_total:0, sockets_used:0, socketed_runes:[]
        })
        if (insErr) {
          console.warn('addItem insert error:', insErr.message)
          // If insert failed due to race condition, try updating the now-existing row
          const { data: retry } = await supabase.from('inventory').select('id,quantity')
            .eq('player_id', player.id).eq('item_key', itemKey).maybeSingle()
          if (retry) {
            await supabase.from('inventory')
              .update({ quantity: (retry.quantity || 1) + qty }).eq('id', retry.id)
          }
        }
      }
      queueLoot(m.name, qty, getItemImg(m.item_key))
      return
    }
    const socketsRolled = rollSockets(m.rarity, m.item_type)
    await supabase.from('inventory').insert({
      player_id:player.id, item_key:m.item_key, name:m.name, item_type:m.item_type,
      subtype:m.subtype, rarity:m.rarity, atk_bonus:m.atk_bonus||0, def_bonus:m.def_bonus||0,
      hp_restore:m.hp_restore||0, two_handed:m.two_handed||false, icon:m.icon, quantity:1,
      element:m.element||'none', power_bonus:m.power_bonus||0, control_bonus:m.control_bonus||0,
      guard_bonus:m.guard_bonus||0, speed_bonus:m.speed_bonus||0,
      insight_bonus:m.insight_bonus||0, luck_bonus:m.luck_bonus||0,
      agility_bonus:m.agility_bonus||0, max_hp_bonus:m.max_hp_bonus||0,
      special_effect:m.special_effect||null,
      sockets_total:socketsRolled, sockets_used:0, socketed_runes:[]
    })
    queueLoot(m.name + (socketsRolled > 0 ? ` [${socketsRolled} socket${socketsRolled>1?'s':''}!]` : ''), 1, getItemImg(m.item_key))
  }

  // ── Navigate ─────────────────────────────────────
  // ── Watcher Eye Random Encounter ─────────────────────
  // After level 3: 15% chance per story node transition to trigger Eye ambush
  // After level 7: 10% chance for Eye Swarm (harder) instead
  const EYE_EXEMPT_NODES = new Set([
    'opening','watcher_eye_ambush','eye_escape_attempt','fight_watcher_eye',
    'eye_defeated','eye_survived','watcher_eye_swarm','fight_eye_swarm',
    'swarm_defeated','swarm_survived','watcher_sees','watcher_sees_final',
    'pre_boss_team','pre_boss_solo','pre_boss_betray','pre_boss_check',
    'boss','chapter_end','plaza_allies','district_hub',
    'plaza_talk','street_midpoint','plaza_grind','plaza_grind_done',
    'fight_rat_1','fight_rats_2','fight_hounds','fight_crawlers',
    'fight_plaza_spawn','fight_drone_1','fight_sentry','fight_with_kai',
    'fight_watcher_eye','fight_eye_swarm',
  ])
  // ── Forced Eye Encounter Overlay ─────────────────────
  // Shows a full-screen interruption with forced combat — no player choice.
  // After win or loss, dismisses itself and resumes the original navigation.
  function triggerForcedEyeEncounter(encounterType, resumeNextId) {
    const isSwarm   = encounterType === 'watcher_eye_swarm'
    const enemyData = isSwarm
      ? { name:"Watcher's Eye Swarm", icon:'👁', hp:140, atk:14, xp:180, loot:[{itemKey:'rune_aero',qty:1},{itemKey:'rune_terra',qty:1}], img:'../assets/boss/watcher_eye_swarm.png' }
      : { name:"Watcher's Eye",       icon:'👁', hp:60,  atk:12, xp:80,  loot:[{itemKey:'rune_aqua',qty:1}],                               img:'../assets/boss/watcher_eye.png' }

    const alertLines = isSwarm ? [
      "The sky fractures in seven places at once.",
      "Seven eyes descend. Each the size of a fist. Each fixed on you.",
      "They orbit each other slowly — a single mind, distributed.",
      "⚠ WATCHER'S EYE SWARM — FORCED ENGAGEMENT.",
      "There is nowhere to run. They are already everywhere."
    ] : [
      "The sky splits without warning.",
      "A pale eye drops from the crack like a stone from a height.",
      "It finds you in less than a second.",
      "⚠ WATCHER'S EYE — SPOTTED. ENGAGING.",
      "It does not wait. It does not circle. It comes."
    ]

    // White flash
    const flash = document.createElement('div')
    flash.style.cssText = 'position:fixed;inset:0;z-index:9998;background:white;opacity:0;pointer-events:none;transition:opacity 0.12s ease'
    document.body.appendChild(flash)
    requestAnimationFrame(() => {
      flash.style.opacity = '0.92'
      setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 250) }, 180)
    })

    // Build overlay
    const overlay = document.createElement('div')
    overlay.id = 'eye-encounter-overlay'
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9000;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:rgba(8,6,3,0.97);
      animation:eyeOverlayIn 0.4s ease;
      font-family:'Share Tech Mono',monospace;
    `

    overlay.innerHTML = `
      <style>
        @keyframes eyeOverlayIn { from{opacity:0;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }
        @keyframes eyePulse { 0%,100%{box-shadow:0 0 30px 8px rgba(255,255,255,0.15)} 50%{box-shadow:0 0 60px 20px rgba(255,255,255,0.35)} }
        @keyframes eyeTextIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        #eye-alert-lines p { opacity:0; animation:eyeTextIn 0.35s ease forwards; }
        #eye-alert-lines p:nth-child(1){animation-delay:0.1s}
        #eye-alert-lines p:nth-child(2){animation-delay:0.3s}
        #eye-alert-lines p:nth-child(3){animation-delay:0.55s}
        #eye-alert-lines p:nth-child(4){animation-delay:0.8s;color:#e05555;font-weight:bold;letter-spacing:.1em}
        #eye-alert-lines p:nth-child(5){animation-delay:1.1s;color:#a08858}
        .eye-combat-panel { width:100%;max-width:440px;padding:0 1rem; }

        /* ── Override dark-on-parchment combat styles for the dark overlay ── */
        #eye-encounter-overlay .combat-panel {
          background: rgba(255,255,255,0.04);
          border: .5px solid rgba(200,184,128,.2);
          border-radius: 6px;
          padding: .75rem;
        }
        #eye-encounter-overlay .combat-enemy-row {
          display: flex; align-items: center; gap: .75rem; margin-bottom: .6rem;
        }
        #eye-encounter-overlay .combat-enemy-name {
          color: #e8d8a8 !important;
        }
        #eye-encounter-overlay .combat-log {
          color: #c8b96e !important;
          background: rgba(0,0,0,.3) !important;
          border-color: rgba(200,184,128,.15) !important;
          font-family: 'IM Fell English', serif;
          font-style: italic;
          min-height: 2.5rem;
        }
        #eye-encounter-overlay .combat-log em {
          color: #8fd8f0 !important;
        }
        #eye-encounter-overlay .combat-log strong {
          color: #e05555 !important;
        }
        #eye-encounter-overlay .stat-key {
          color: #a08858 !important;
        }
        #eye-encounter-overlay .stat-val {
          color: #e8d8a8 !important;
        }
        #eye-encounter-overlay .stat-bar-wrap {
          background: rgba(255,255,255,.08) !important;
        }
        #eye-encounter-overlay p[style*="color:var(--ink)"],
        #eye-encounter-overlay span[style*="color:var(--ink)"] {
          color: #c8b96e !important;
        }
        #eye-encounter-overlay .combat-btn {
          color: #c8b96e !important;
          background: rgba(200,184,128,.08) !important;
          border-color: rgba(200,184,128,.25) !important;
        }
        #eye-encounter-overlay .combat-btn:hover:not(:disabled) {
          background: rgba(200,184,128,.18) !important;
          border-color: rgba(200,184,128,.5) !important;
        }
        #eye-encounter-overlay .combat-btn:disabled {
          color: rgba(200,184,128,.3) !important;
          border-color: rgba(200,184,128,.1) !important;
        }
        #eye-encounter-overlay [id$="-skill-slots-row"] p,
        #eye-encounter-overlay [id$="-skill-slots-row"] span,
        #eye-encounter-overlay [id$="-skill-slots-row"] div {
          color: #c8b96e !important;
        }
        #eye-encounter-overlay [id$="-skill-slots-row"] button {
          color: #c8b96e !important;
          background: rgba(200,184,128,.08) !important;
          border: 1px solid rgba(200,184,128,.25) !important;
        }
        #eye-encounter-overlay [id$="-items-panel"] {
          background: rgba(15,12,8,.95) !important;
          border-color: rgba(200,184,128,.3) !important;
        }
        #eye-encounter-overlay [id$="-items-panel"] p,
        #eye-encounter-overlay [id$="-items-panel"] span,
        #eye-encounter-overlay [id$="-items-panel"] div {
          color: #c8b96e !important;
        }
        #eye-encounter-overlay [id$="-items-panel"] button {
          color: #c8b96e !important;
        }
        #eye-encounter-overlay #combat-over {
          color: #c8b96e !important;
        }
        #eye-encounter-overlay #combat-over button {
          color: #1a1208 !important;
          background: rgba(200,184,128,.45) !important;
          border-color: rgba(139,106,32,.6) !important;
        }
        /* FORCED ENGAGEMENT label */
        #eye-combat-phase > p {
          color: #c8b96e !important;
        }
        /* ─────────────────────────────────────────────────────────────
           ESCAPE PARCHMENT GLOBALS
           The page-level "p, li, span { color: var(--ink) !important }"
           rule was darkening every <p> inside this dark overlay (the
           alert lines, the "You have no choice" subtitle, anything
           inline-styled). The next rules undo that scoped to the overlay
           ONLY — parchment pages are unaffected.
           ─────────────────────────────────────────────────────────── */
        #eye-encounter-overlay p,
        #eye-encounter-overlay li,
        #eye-encounter-overlay span {
          color: inherit !important;
        }
        /* Re-establish the alert-phase colours, since 'inherit' above
           reset them. These match the original inline-style intent. */
        #eye-alert-phase { color: #c8b96e; }
        #eye-alert-lines p {
          color: #c8b96e !important;
          opacity: 0;
          animation: eyeTextIn .35s ease forwards;
        }
        #eye-alert-lines p:nth-child(4) {
          color: #e05555 !important;
          font-weight: bold;
          letter-spacing: .1em;
        }
        #eye-alert-lines p:nth-child(5) {
          color: #a08858 !important;
        }
        #eye-engage-btn-wrap p { color: #a08858 !important; }
        /* Make the ENGAGE button text bullet-proof too */
        #eye-engage-btn { color: #0d0b08 !important; }
      </style>

      <!-- Alert phase -->
      <div id="eye-alert-phase" style="text-align:center;max-width:400px;padding:2rem 1.5rem">
        <img src="${enemyData.img}" alt="${enemyData.name}"
          style="width:${isSwarm?'120px':'88px'};height:${isSwarm?'120px':'88px'};object-fit:contain;margin:0 auto 1.5rem;display:block;animation:eyePulse 2s infinite;filter:drop-shadow(0 0 20px rgba(255,255,255,0.4))"
          onerror="this.style.fontSize='4rem';this.textContent='👁';this.style.background='none'">
        <div id="eye-alert-lines" style="margin-bottom:1.5rem">
          ${alertLines.map(l => `<p style="font-size:.72rem;color:#c8b96e;margin:.4rem 0;line-height:1.6">${l}</p>`).join('')}
        </div>
        <div id="eye-engage-btn-wrap" style="opacity:0;transition:opacity 0.4s">
          <button id="eye-engage-btn"
            style="font-family:'Cinzel',serif;font-size:.9rem;color:#0d0b08;background:#c8b96e;border:none;border-radius:3px;padding:.6rem 2rem;cursor:pointer;letter-spacing:.08em;box-shadow:0 0 20px rgba(200,185,110,0.4)">
            ⚔ ENGAGE
          </button>
          <p style="font-size:.5rem;color:#a08858;margin-top:.5rem;letter-spacing:.06em">You have no choice.</p>
        </div>
      </div>

      <!-- Combat phase (hidden until engaged) -->
      <div id="eye-combat-phase" style="display:none;width:100%;max-width:460px;padding:1rem;max-height:90vh;overflow-y:auto">
        <p style="font-size:.58rem;color:var(--ink-dim);letter-spacing:.08em;margin-bottom:.75rem;text-align:center">
          ${isSwarm ? '👁 WATCHER\'S EYE SWARM' : '👁 WATCHER\'S EYE'} — FORCED ENGAGEMENT
        </p>
        <div id="eye-combat-inner"></div>
      </div>
    `
    document.body.appendChild(overlay)

    // Show engage button after lines have animated in
    setTimeout(() => {
      const btn = document.getElementById('eye-engage-btn-wrap')
      if (btn) btn.style.opacity = '1'
    }, 1600)

    // Engage button — swap to combat panel
    document.getElementById('eye-engage-btn').addEventListener('click', () => {
      document.getElementById('eye-alert-phase').style.display  = 'none'
      document.getElementById('eye-combat-phase').style.display = 'block'

      const panel = document.getElementById('eye-combat-inner')

      // Inline onWin/onLose handlers that dismiss overlay and resume navigation
      const onEncounterEnd = async (result) => {
        // Brief pause so player can read the result
        await new Promise(r => setTimeout(r, 1400))

        // Dismiss overlay
        overlay.style.transition = 'opacity 0.5s'
        overlay.style.opacity = '0'
        setTimeout(() => {
          overlay.remove()
          // Resume the navigation that was interrupted
          const flipEl2 = document.querySelector('.page-flip-decorator')
          if (flipEl2) {
            flipEl2.classList.remove('playing')
            void flipEl2.offsetWidth
            flipEl2.classList.add('playing')
            flipEl2.addEventListener('animationend', () => flipEl2.classList.remove('playing'), { once: true })
          }
          const lp = document.getElementById('left-page')
          lp.style.transition = 'opacity .3s,transform .3s'
          lp.style.opacity    = '0'
          lp.style.transform  = 'translateX(-8px)'
          setTimeout(() => {
            nodeId = resumeNextId
            render()
            lp.style.opacity   = '1'
            lp.style.transform = 'translateX(0)'
            window.scrollTo({ top:0, behavior:'smooth' })
          }, 320)
        }, 500)
      }

      // Patch buildCombatUI for this encounter — use special sentinels
      // that call onEncounterEnd instead of goTo
      window._eyeEncounterCallback = onEncounterEnd
      buildEyeCombat(panel, enemyData)
    })
  }

  // ── Eye combat builder (self-contained, calls _eyeEncounterCallback on end) ─
  function buildEyeCombat(panel, enemy) {
    window._inEyeEncounter = true
    buildCombatUI(panel, enemy, '__eye_win__', '__eye_lose__', '__eye_lose__', false, null)

    // After build — patch all dark inline colors to light ones for the black overlay
    requestAnimationFrame(() => {
      const overlay = document.getElementById('eye-encounter-overlay')
      if (!overlay) return
      // Walk all elements inside overlay and flip #1a1208 / #3a2008 to light colors
      overlay.querySelectorAll('[style]').forEach(el => {
        el.style.cssText = el.style.cssText
          .replace(/color\s*:\s*#1a1208/gi,  'color:#e8d8a8')
          .replace(/color\s*:\s*#3a2008/gi,  'color:#a08858')
          .replace(/color\s*:\s*#7a6435/gi,  'color:#a08858')
          .replace(/background\s*:\s*rgba\(200,184,128,[^)]+\)/gi, 'background:rgba(200,184,128,.12)')
      })
    })
  }

  function rollWatcherEncounter(nextId) {
    const lvl = player.level || 1
    if (lvl < 3) return null
    if (EYE_EXEMPT_NODES.has(nextId)) return null
    const nd = NODES[nextId]
    if (!nd || nd.type === 'combat' || nd.type === 'boss' || nd.type === 'end') return null
    const roll = Math.random()
    if (lvl >= 7 && roll < 0.10) return 'watcher_eye_swarm'
    if (roll < 0.15) return 'watcher_eye_ambush'
    return null
  }

  window.returnToBoss = function() {
    document.getElementById('loot-window')?.remove()
    const p = document.getElementById('right-panel')
    if (p) goTo('pre_boss_check')
  }
  window.returnToZone = function() {
    document.getElementById('loot-window')?.remove()
    const p   = document.getElementById('right-panel')
    const loc = window._currentFarmLoc
    if (loc && p) renderFarmZone(p, loc)
    else if (p) renderLocationHub(p, NODES['farming_hub'])
  }
  window.returnToZoneHub = function() {
    document.getElementById('loot-window')?.remove()
    const p = document.getElementById('right-panel')
    if (p) renderLocationHub(p, NODES['farming_hub'])
  }
  window.returnToStory = function() {
    document.getElementById('loot-window')?.remove()
    goTo('district_hub')
  }

  // ── Derived stat calculations ────────────────────────────────
  function calcATK() {
    const pwr = player.power   || 0
    const spd = player.speed   || 0
    const eqA = getEquippedBonus('atk_bonus')
    return Math.max(1, Math.round((player.atk||1) + pwr*0.6 + spd*0.2 + eqA))
  }
  function calcDEF() {
    const grd = player.guard   || 0
    const ctr = player.control || 0
    const eqD = getEquippedBonus('def_bonus')
    return Math.round((player.def||0) + grd*0.6 + ctr*0.2 + eqD)
  }
  function calcSPD() {
    const spd = player.speed   || 0
    const ins = player.insight || 0
    return Math.round(spd + ins*0.1 + getEquippedBonus('speed_bonus'))
  }
  function getEquippedBonus(stat) {
    // Sum bonus from all equipped items — pulled from window._equipped cache
    return (window._equippedItems||[]).reduce((s,i)=>s+(i[stat]||0),0)
  }

  // ── Full Stat Window ─────────────────────────────────────────
  // (Stat allocation modal removed — stats are now managed via the Skill Tree on the Skills page)
  window.openStatWindow = function() {
    document.getElementById('stat-window')?.remove()

    const eqItems  = window._equippedItems || []

    const pwr = player.power   || 0
    const ctr = player.control || 0
    const grd = player.guard   || 0
    const spd = player.speed   || 0
    const ins = player.insight || 0
    const lck = player.luck    || 0

    const finalATK = calcATK()
    const finalDEF = calcDEF()
    const finalSPD = calcSPD()

    const STATS = [
      { key:'power',   label:'Power',   val:pwr, color:'#ff5500', desc:'Scales ATK damage',          derived:'ATK +' + Math.round(pwr*0.6) },
      { key:'control', label:'Control', val:ctr, color:'#0088ff', desc:'Scales DEF & retry chance',   derived:'DEF +' + Math.round(ctr*0.2) },
      { key:'guard',   label:'Guard',   val:grd, color:'#8b5e3c', desc:'Scales DEF & damage block',   derived:'DEF +' + Math.round(grd*0.6) },
      { key:'speed',   label:'Speed',   val:spd, color:'#a8d8ea', desc:'Scales ATK & turn order',     derived:'ATK +' + Math.round(spd*0.2) + ', SPD +' + spd },
      { key:'insight', label:'Insight', val:ins, color:'#ffd700', desc:'Scales SPD & luck effects',   derived:'SPD +' + Math.round(ins*0.1) },
      { key:'luck',    label:'Luck',    val:lck, color:'#b06eff', desc:'Improves crit & loot chance', derived:'Loot +' + Math.round(lck*5) + '%' },
    ]

    const equippedNames = eqItems.map(i => i.name).join(', ') || 'None'

    const modal = document.createElement('div')
    modal.id = 'stat-window'
    modal.style.cssText = 'position:fixed;inset:0;z-index:700;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.75)'
    modal.innerHTML = `
      <div style="background:#b8a568;border:1px solid #8b6a20;border-radius:6px;padding:1.25rem;min-width:320px;max-width:400px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.8)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
          <p style="font-family:'Cinzel',serif;font-size:1rem;font-weight:600;color:var(--ink)">Character Stats</p>
          <button onclick="document.getElementById('stat-window').remove()" style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--ink)">✕</button>
        </div>

        <div style="background:rgba(0,0,0,.08);border-radius:4px;padding:.6rem .75rem;margin-bottom:.75rem">
          <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);letter-spacing:.08em;margin-bottom:4px">DERIVED STATS</p>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">
            ${[['ATK', finalATK, '#e05555'],['DEF', finalDEF, '#5ec45e'],['SPD', finalSPD, '#a8d8ea'],
               ['HP', (player.max_hp||100), '#5eaee0'],['LVL', (player.level||1), '#c8b96e'],['GOLD', (player.gold||0), '#c8b96e']
            ].map(([k,v,c]) => '<div style="text-align:center;background:rgba(0,0,0,.1);border-radius:3px;padding:4px 2px"><span style="font-family:\'Share Tech Mono\',monospace;font-size:.5rem;color:var(--ink-dim);display:block">'+k+'</span><span style="font-family:\'Cinzel\',serif;font-size:.95rem;font-weight:600;color:'+c+'">'+v+'</span></div>').join('')}
          </div>
        </div>

        <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);letter-spacing:.08em;margin-bottom:6px">CORE STATS <span style="color:#a08858">· Unlocked via Skill Tree</span></p>
        ${STATS.map(s => `
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:5px;padding:5px 7px;background:rgba(0,0,0,.07);border-radius:3px">
            <div style="width:8px;height:8px;border-radius:50%;background:${s.color};flex-shrink:0"></div>
            <div style="flex:1">
              <div style="display:flex;align-items:baseline;gap:4px">
                <span style="font-family:'Cinzel',serif;font-size:.78rem;color:var(--ink);font-weight:600">${s.label}</span>
                <span style="font-family:'Share Tech Mono',monospace;font-size:.6rem;color:var(--ink)">${s.val}</span>
                <span style="font-family:'Share Tech Mono',monospace;font-size:.52rem;color:var(--ink-dim);margin-left:auto">${s.derived}</span>
              </div>
              <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.62rem;color:var(--ink-dim);margin:0">${s.desc}</p>
            </div>
          </div>
        `).join('')}

        <div style="margin-top:.75rem;padding:.6rem .75rem;background:rgba(0,0,0,.08);border-radius:4px">
          <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);letter-spacing:.08em;margin-bottom:3px">EQUIPPED</p>
          <p style="font-family:'IM Fell English',serif;font-size:.72rem;color:var(--ink);margin:0">${equippedNames}</p>
        </div>

        ${(player.skill_points||0)>0?`
          <button onclick="document.getElementById('stat-window').remove();window.bookNavigate('skills.html')" style="width:100%;margin-top:.75rem;font-family:'Cinzel',serif;font-size:.8rem;color:var(--ink);background:rgba(160,125,224,.35);border:1px solid rgba(160,125,224,.6);border-radius:3px;padding:.45rem;cursor:pointer">
            ⬡ Spend ${player.skill_points} Skill Points → Skills Page
          </button>
        `:''}
      </div>
    `
    modal.addEventListener('click', e => { if (e.target===modal) modal.remove() })
    document.body.appendChild(modal)
  }

  // calcBadge is now imported from reputation.js (shared with Ch2 + lobby).

  window.goTo = async function goTo(nextId, choice = {}) {
    // Resolve eye encounter return node
    if (nextId === '__eye_return__') {
      nextId = window._eyeReturnNode || 'street_midpoint'
      window._eyeReturnNode = null
    }
    if (!NODES[nextId]) return

    // Track whether player defeated Dorian before the Sentinel fight
    // (suppresses dorianLurking in garage_b4_sentinel_fight)
    if (nodeId === 'garage_b4_dorian_won' && nextId === 'garage_b4_sentinel_fight') {
      window._dorianDefeated = true
    }
    // Reset when leaving the garage arc entirely
    if (nextId === 'garage_b4_clear' || nextId === 'garage_b5_summit') {
      window._dorianDefeated = false
    }

    const cur = NODES[nodeId]
    const oldXp  = player.xp || 0
    const oldLvl = player.level || 1

    const updates = { current_node: 'ch1_' + nextId }
    if (cur?.xp)     { updates.xp = oldXp + cur.xp; player.xp = updates.xp }
    if (cur?.hpLoss) { currentHp = Math.max(1, currentHp - cur.hpLoss); updates.hp = currentHp }

    // ── Moral updates ─────────────────────────────────────────────────
    // Two sources: (a) choice.outcome === 'attack' is a hard -20, (b)
    // choice.moral is the explicit delta. Combine, then apply via the
    // shared reputation helper.
    let moralDelta = 0
    if (choice.outcome === 'attack') moralDelta -= 20
    if (choice.moral)                moralDelta += choice.moral
    if (moralDelta !== 0) {
      const r = applyMoralChange(player, moralDelta)
      Object.assign(updates, r.updates)
    }

    if (choice.bossMode) bossMode = choice.bossMode
    if (choice.outcome)  outcome  = choice.outcome
    if (cur?.rewards) for (const r of cur.rewards) await addItem(r.itemKey, r.qty)

    // Check for level up before saving
    if (updates.xp) {
      const lvlUpdates = await checkLevelUp(oldXp, updates.xp, oldLvl)
      if (lvlUpdates) Object.assign(updates, lvlUpdates)
    }

    await save(updates)

    // ── Random Watcher Eye encounter check ───────────
    const eyeEncounter = rollWatcherEncounter(nextId)
    if (eyeEncounter) {
      // Intercept navigation — show forced combat overlay, do NOT change nodeId
      triggerForcedEyeEncounter(eyeEncounter, nextId)
      return  // abort normal navigation — overlay handles it
    }

    // ── Page-flip animation on navigation ──
    const flipEl = document.querySelector('.page-flip-decorator')
    if (flipEl) {
      flipEl.classList.remove('playing')
      void flipEl.offsetWidth // force reflow to restart animation
      flipEl.classList.add('playing')
      flipEl.addEventListener('animationend', () => flipEl.classList.remove('playing'), { once: true })
    }

    const lp = document.getElementById('left-page')
    lp.style.transition = 'opacity .3s,transform .3s'
    lp.style.opacity    = '0'
    lp.style.transform  = 'translateX(-8px)'
    setTimeout(() => {
      nodeId = nextId
      render()
      lp.style.opacity   = '1'
      lp.style.transform = 'translateX(0)'
      window.scrollTo({ top:0, behavior:'smooth' })
    }, 320)
  }

  // ── Render ───────────────────────────────────────
  function render() {
    const node = NODES[nodeId]
    if (!node) {
      document.getElementById('story-text').textContent = 'Error: node "' + nodeId + '" not found.'
      return
    }
    if (node.sysMsg) window.showSysOverlay(node.sysMsg)

    const stEl = document.getElementById('story-text')
    stEl.textContent = node.text || ''
    stEl.className   = nodeId === 'opening' ? 'story-text drop-cap' : 'story-text'

    // Watcher image — teaser on pre_boss nodes, full on boss node
    const watcherNodes = ['pre_boss_team','pre_boss_solo','pre_boss_betray','pre_boss_check','boss']
    const watcherImg   = document.getElementById('watcher-img')
    if (watcherNodes.includes(nodeId)) {
      if (!watcherImg) {
        const img = document.createElement('img')
        img.id    = 'watcher-img'
        img.src   = '../assets/boss/the_watcher.png'
        img.alt   = 'The Watcher'
        img.style.cssText = 'width:100%;max-width:320px;display:block;margin:1.5rem auto 0;border-radius:4px;opacity:0;transition:opacity 1s;filter:' + (nodeId==='boss'?'none':'brightness(.7) saturate(0.6)')
        document.getElementById('story-text').insertAdjacentElement('afterend', img)
        setTimeout(() => img.style.opacity = '1', 100)
      } else {
        watcherImg.style.filter = nodeId==='boss' ? 'none' : 'brightness(.7) saturate(0.6)'
        watcherImg.style.opacity = '1'
      }
    } else {
      if (watcherImg) watcherImg.remove()
    }

    const ob = document.getElementById('outcome-box')
    if (outcome && nodeId === 'search_deeper') {
      ob.style.display = 'block'
      ob.textContent   = outcome==='team'   ? 'You made a choice to be human first.'
        : outcome==='attack' ? 'The System recorded it. Reputation: Red.'
        : 'You watched. You learned. You moved on.'
    } else { ob.style.display = 'none' }

    const panel = document.getElementById('right-panel')
    if      (node.type === 'boss')         renderBoss(panel, node)
    else if (node.type === 'combat')       renderCombat(panel, node)
    else if (node.type === 'end')          renderEnd(panel, node)
    else if (node.type === 'location_hub') renderLocationHub(panel, node)
    else if (nodeId === 'district_hub')    renderDistrictHub(panel)
    else                                   renderChoices(panel, node)
  }

  // ── District hub — checks guardian progress, routes to plaza when all 3 done ──
  function renderDistrictHub(panel) {
    const defeated  = getDefeatedBosses()
    const sentinel  = defeated.includes('sentinel')
    const surveyor  = defeated.includes('surveyor')
    const unseen    = defeated.includes('unseen')
    const allDone   = sentinel && surveyor && unseen
    const ch1Done   = (player.chapters_unlocked||[]).includes(2)

    const stEl = document.getElementById('story-text')

    // Always show zone cards — farming is always available for cleared zones
    if (stEl) stEl.textContent = allDone
      ? `The district is clear. All three guardians defeated.

  The zones remain accessible for farming — enemies respawn, loot cycles continue. Your interface marks each cleared zone as open.

  ${ch1Done ? 'Chapter 1 is complete. You can replay the Watcher from the plaza, or farm here.' : 'The Watcher awaits in the plaza. Clear the zones or go face it.'}`
      : `You return to the plaza center.

  The barrier is still up. You can feel where it gives — and where it doesn't.

  Your interface shows the district status. Not all zones are clear.

  The Watcher won't show itself until every guardian is defeated.`

    const zones = [
      { id: 'loc_garage', bossKey: 'sentinel', introNode: 'garage_approach', name: 'Parking Garage',  guardian: 'Sentinel of the First Eye', icon: '🅿️', color: '#5ec45e', done: sentinel },
      { id: 'loc_market', bossKey: 'surveyor', introNode: 'market_approach', name: 'Frozen Market',   guardian: 'The Surveyor',               icon: '🏪', color: '#c8b96e', done: surveyor },
      { id: 'loc_tower',  bossKey: 'unseen',   introNode: 'tower_approach',  name: 'Glass Tower',     guardian: 'The Unseen',                 icon: '🏢', color: '#e05555', done: unseen  },
    ]

    panel.innerHTML = `
      <p class="choices-label">District Zones</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:1rem">
        ${zones.map(z => z.done ? `
          <div onclick="enterZoneFromHub('${z.id}')" style="border:.5px solid ${z.color}50;border-radius:5px;padding:.65rem .75rem;background:${z.color}10;cursor:pointer;transition:all .2s"
            onmouseover="this.style.background='${z.color}20'" onmouseout="this.style.background='${z.color}10'">
            <div style="display:flex;align-items:center;gap:.5rem">
              <span style="font-size:1rem">${z.icon}</span>
              <span style="font-family:'Cinzel',serif;font-size:.82rem;color:var(--ink)">${z.name}</span>
              <span style="font-family:'Share Tech Mono',monospace;font-size:.52rem;color:${z.color};margin-left:auto">✓ FARM</span>
            </div>
            <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.72rem;color:var(--ink-dim);margin:3px 0 0">${z.guardian} — defeated. Tap to farm.</p>
          </div>
        ` : `
          <div onclick="goTo('${z.introNode}')" style="border:.5px solid rgba(224,85,85,.4);border-radius:5px;padding:.65rem .75rem;background:rgba(80,20,20,.08);cursor:pointer;transition:all .2s"
            onmouseover="this.style.background='rgba(80,20,20,.15)'" onmouseout="this.style.background='rgba(80,20,20,.08)'">
            <div style="display:flex;align-items:center;gap:.5rem">
              <span style="font-size:1rem">${z.icon}</span>
              <span style="font-family:'Cinzel',serif;font-size:.82rem;color:#7a4040">${z.name}</span>
              <span style="font-family:'Share Tech Mono',monospace;font-size:.52rem;color:#e07070;border:.5px solid rgba(224,85,85,.3);padding:1px 6px;border-radius:12px;margin-left:auto">🔒 GUARDIAN ACTIVE</span>
            </div>
            <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.72rem;color:#8a5050;margin:3px 0 0">${z.guardian} — must be defeated to proceed.</p>
          </div>
        `).join('')}
      </div>
      ${allDone ? `
        <div style="border-top:.5px solid rgba(139,106,32,.2);padding-top:.75rem">
          <button class="choice" onclick="goTo('plaza_allies')" style="width:100%">
            <span class="choice-arrow">→</span>
            <span class="choice-body">Move to the plaza
              <span class="choice-sub">${ch1Done ? 'Replay the Watcher encounter' : 'Face the Watcher — Chapter 1 finale'}</span>
            </span>
          </button>
        </div>` : ''}
    `
  }

  // ── Zone guardian mapping ─────────────────────────

  function isZoneUnlocked(locId) {
    const g = ZONE_GUARDIANS[locId]
    if (!g) return true
    const defeated = getDefeatedBosses()
    return defeated.includes(g.bossKey)
  }

  // ── Enter a cleared zone directly from the district hub ──
  window.enterZoneFromHub = function(locId) {
    // Set up farming context using the farming_hub node locations
    const farmNode = NODES['farming_hub']
    if (!farmNode) return
    window._farmingLocations  = farmNode.locations
    window._farmingReturnNode = 'district_hub'
    const loc = farmNode.locations.find(l => l.id === locId)
    if (!loc) return
    window._currentFarmLoc = loc
    renderFarmZone(document.getElementById('right-panel'), loc)
  }

  // ── Location hub ─────────────────────────────────
  function renderLocationHub(panel, node) {
    window._farmingLocations = node.locations
    window._farmingReturnNode = node.returnNode

    panel.innerHTML = `
      <p class="choices-label">Choose a Zone</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:1rem">
        ${node.locations.map(loc => {
          const zMap = {'loc_garage':'../assets/zones/zone_parking_garage.png','loc_market':'../assets/zones/zone_frozen_market.png','loc_tower':'../assets/zones/zone_glass_tower.png'}
          const zImg = zMap[loc.id]
          const unlocked = isZoneUnlocked(loc.id)
          const guardian = ZONE_GUARDIANS[loc.id]
          if (unlocked) {
            return `
            <div onclick="enterLocation('${loc.id}')"
              style="border:.5px solid ${loc.color}50;border-radius:5px;overflow:hidden;cursor:pointer;transition:all .2s;background:${loc.color}10">
              ${zImg ? `<div style="width:100%;height:80px;background:url('${zImg}') center/cover;opacity:.8"></div>` : ''}
              <div style="padding:.65rem .75rem">
                <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:3px">
                  <span style="font-size:1rem">${loc.icon}</span>
                  <span style="font-family:'Cinzel',serif;font-size:.85rem;color:var(--ink);font-weight:500">${loc.name}</span>
                  <span style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:${loc.color};border:.5px solid ${loc.color}50;padding:1px 6px;border-radius:12px;margin-left:auto">${loc.level}</span>
                </div>
                <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.78rem;color:var(--ink-dim);margin:0">${loc.desc}</p>
              </div>
            </div>`
          } else {
            return `
            <div onclick="goTo('${guardian.introNode}')"
              style="border:.5px solid rgba(160,80,80,.4);border-radius:5px;overflow:hidden;cursor:pointer;transition:all .2s;background:rgba(80,20,20,.08);position:relative">
              ${zImg ? `<div style="width:100%;height:80px;background:url('${zImg}') center/cover;opacity:.35;filter:grayscale(1)"></div>` : ''}
              <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(10,5,5,.45)">
                <div style="text-align:center">
                  <div style="font-size:1.4rem;margin-bottom:2px">${guardian.icon}</div>
                  <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:#e07070;letter-spacing:.08em">ZONE LOCKED</p>
                  <p style="font-family:'Share Tech Mono',monospace;font-size:.5rem;color:#c09090;margin-top:2px">${guardian.name}</p>
                </div>
              </div>
              <div style="padding:.65rem .75rem">
                <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:3px">
                  <span style="font-size:1rem;opacity:.4">${loc.icon}</span>
                  <span style="font-family:'Cinzel',serif;font-size:.85rem;color:#7a5555;font-weight:500">${loc.name}</span>
                  <span style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:#a06060;border:.5px solid rgba(160,80,80,.3);padding:1px 6px;border-radius:12px;margin-left:auto">🔒 ${loc.level}</span>
                </div>
                <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.78rem;color:#8a6060;margin:0">Defeat the guardian to unlock this zone.</p>
              </div>
            </div>`
          }
        }).join('')}
      </div>
      <button class="choice" onclick="goTo('district_hub')" style="width:100%;text-align:left;border:none;background:none;cursor:pointer;padding:.5rem 0">
        <span class="choice-arrow">→</span>
        <span class="choice-body" style="font-family:'IM Fell English',serif;font-size:1rem;color:#3a2e15">Return to main story</span>
      </button>
    `
  }

  window.enterLocation = function(locId) {
    if (!isZoneUnlocked(locId)) {
      const g = ZONE_GUARDIANS[locId]
      if (g) goTo(g.introNode)
      return
    }
    const loc = (window._farmingLocations||[]).find(l => l.id === locId)
    if (!loc) return
    window._currentFarmLoc = loc
    renderFarmZone(document.getElementById('right-panel'), loc)
  }

  function renderFarmZone(panel, loc) {
    const zoneImgs = {
      'loc_garage': '../assets/zones/zone_parking_garage.png',
      'loc_market': '../assets/zones/zone_frozen_market.png',
      'loc_tower':  '../assets/zones/zone_glass_tower.png',
    }
    const zoneImg = zoneImgs[loc.id]

    panel.innerHTML = `
      ${zoneImg ? `<div style="width:100%;height:110px;background:url('${zoneImg}') center/cover;border-radius:6px;margin-bottom:.75rem;opacity:.85;border:.5px solid rgba(139,106,32,.3)"></div>` : ''}
      <p class="choices-label">${loc.icon} ${loc.name} — <span style="color:${loc.color}">${loc.level}</span></p>
      <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.78rem;color:var(--ink-dim);margin-bottom:.75rem">
        Enemies respawn indefinitely. Fight as many times as you need.
      </p>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:1rem">
        ${loc.enemies.map((e,i) => {
          const drops = e.loot.map(l => {
            const pct = Math.round(l.chance * 100)
            const label = l.itemKey.replace('rune_','').replace(/_/g,' ')
            return `<span style="font-family:'Share Tech Mono',monospace;font-size:.52rem;color:var(--ink-dim)">${label} ${pct}%</span>`
          }).join(' · ')
          const eImgs = {
            'Glitch Rat':              '../assets/enemy/enemy_glitch_rat.png',
            'Glitch Rats x2':         '../assets/enemy/enemy_glitch_rat.png',
            'Garage Glitch Rats':     '../assets/enemy/enemy_glitch_rat.png',
            'Static Crawler':         '../assets/enemy/enemy_static_crawler.png',
            'Static Crawlers':        '../assets/enemy/enemy_static_crawler.png',
            'Static Crawlers x5':     '../assets/enemy/enemy_static_crawler.png',
            'Pixel Shard':            '../assets/enemy/enemy_pixel_shard.png',
            'Flicker Hound':          '../assets/enemy/enemy_flicker_hound.png',
            "Lena's Flicker Hounds":  '../assets/enemy/enemy_flicker_hound.png',
            'Pixel Drone':            '../assets/enemy/enemy_pixel_drone.png',
            'Jury-Rigged Pixel Drones':'../assets/enemy/enemy_jury_rigged_pixel_drones.png',
            'Fracture Wolf':          '../assets/enemy/enemy_fracture_wolf.png',
            'Fracture Wolves':        '../assets/enemy/enemy_fracture_wolf.png',
            'Market Creature Cluster':'../assets/enemy/enemy_market_creature_cluster_wolf.png',
            'Fragment Cluster':       '../assets/enemy/enemy_fragment_cluster.png',
            'Corrupted Sentry':       '../assets/enemy/enemy_corrupted_sentry.png',
            'Lobby Corrupted Sentries':'../assets/enemy/enemy_corrupted_sentry.png',
            'Void Sentinel':          '../assets/enemy/enemy_void_sentinel.png',
            'System Enforcer':        '../assets/enemy/enemy_system_enforcer.png',
            'Dorian':                 '../assets/npc/dorian_normal.png',
            'Dorian (Betrayal)':      '../assets/npc/dorian_betrayal.png',
            "Watcher's Eye":          '../assets/boss/watcher_eye.png',
            "Watcher's Eye Swarm":    '../assets/boss/watcher_eye_swarm.png',
            'Sentinel of the First Eye': '../assets/boss/sentinel_of_the_first_eye.png',
            'The Surveyor':           '../assets/boss/the_surveyor.png',
            'The Unseen':             '../assets/boss/the_unseen.png',
          }
          const eImg = eImgs[e.name]
          return `<div onclick="fightFarmEnemy(${i})"
            style="border:.5px solid rgba(139,106,32,.25);border-radius:4px;padding:.6rem .75rem;cursor:pointer;transition:all .15s;background:rgba(0,0,0,.04)"
            onmouseover="this.style.background='rgba(200,184,128,.1)'" onmouseout="this.style.background='rgba(0,0,0,.04)'">
            <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:3px">
              ${eImg ? `<img src="${eImg}" style="width:36px;height:36px;object-fit:contain;border-radius:4px;flex-shrink:0;filter:drop-shadow(0 0 4px rgba(0,0,0,.5))">` : `<span style="font-size:1.1rem">${e.icon}</span>`}
              <span style="font-family:'Cinzel',serif;font-size:.82rem;color:var(--ink)">${e.name}</span>
              <span style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink-dim);margin-left:auto">HP ${e.hp} · ATK ${e.atk} · ${e.xp} XP</span>
            </div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">${drops}</div>
          </div>`
        }).join('')}
      </div>
      <div style="display:flex;gap:6px">
        <button class="choice" onclick="returnToZoneHub()" style="flex:1;text-align:left;border:none;background:none;cursor:pointer;padding:.5rem 0">
          <span class="choice-arrow">←</span>
          <span class="choice-body" style="font-family:'IM Fell English',serif;font-size:.9rem;color:var(--ink)">Back to zones</span>
        </button>
        <button class="choice" onclick="goTo('district_hub')" style="flex:1;text-align:left;border:none;background:none;cursor:pointer;padding:.5rem 0">
          <span class="choice-arrow">→</span>
          <span class="choice-body" style="font-family:'IM Fell English',serif;font-size:.9rem;color:var(--ink)">Return to story</span>
        </button>
      </div>
    `
  }

  window.fightFarmEnemy = function(enemyIndex) {
    const loc   = window._currentFarmLoc
    if (!loc) return
    const enemy = { ...loc.enemies[enemyIndex] }
    const panel = document.getElementById('right-panel')
    buildCombatUI(panel, enemy, '__farm_win__', '__farm_zone__', '__farm_zone__', false, null, loc, enemyIndex)
  }

  // ── Choices ──────────────────────────────────────
  function renderChoices(panel, node) {
    const insight = player.insight || 0
    // Filter choices: show hidden ones only if player has enough Insight
    const visibleChoices = (node.choices||[]).filter(c => !c.insightRequired || insight >= c.insightRequired)
    const hiddenChoices  = (node.choices||[]).filter(c => c.insightRequired && insight < c.insightRequired)

    panel.innerHTML = `
      <p class="choices-label">What do you do?</p>
      <div class="choices">
        ${visibleChoices.map(c => `
          <button class="choice ${c.variant||''}"
            data-next="${c.next}"
            data-outcome="${c.outcome||''}"
            data-bossmode="${c.bossMode||''}"
            data-moral="${c.moral||0}">
            <span class="choice-arrow">→</span>
            <span class="choice-body">
              ${c.label}
              ${c.sub ? '<span class="choice-sub">'+c.sub+'</span>' : ''}
            </span>
          </button>
        `).join('')}
        ${hiddenChoices.map(c => `
          <div class="choice locked" title="Requires Insight ${c.insightRequired}">
            <span class="choice-arrow" style="color:#555">→</span>
            <span class="choice-body" style="color:#888">
              [INSIGHT ${c.insightRequired} REQUIRED]
              <span class="choice-sub">Equip items with Insight to unlock hidden paths</span>
            </span>
            <span style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:#ffd700">⚡ INS</span>
          </div>
        `).join('')}
      </div>
    `
    panel.querySelectorAll('.choice').forEach(btn => {
      btn.addEventListener('click', () => {
        const moralVal = parseFloat(btn.dataset.moral) || 0
        goTo(btn.dataset.next, { outcome: btn.dataset.outcome||null, bossMode: btn.dataset.bossmode||null, moral: moralVal || null })
      })
    })
  }

  // ── End screen ───────────────────────────────────
  function renderEnd(panel, node) {
    const moral   = player.moral_score || 0
    const badge   = player.badge || 'neutral'
    const defeated = getDefeatedBosses()

    // ── Dynamic ending text based on moral score ─────
    const morality = moral >= 60 ? 'hero'
      : moral >= 20 ? 'good'
      : moral >= -20 ? 'neutral'
      : moral >= -60 ? 'ruthless'
      : 'villain'

    const watcherVerdict = {
      hero:     `THE WATCHER SEES ALL.\n\nAnd what it sees — it did not expect.\n\nA player who helped. Who stayed. Who chose the harder thing when the easier thing was right there.\n\nThe System was designed to test. It was not designed to be moved. But something in the Watcher's dissolution carries the weight of acknowledgment.`,
      good:     `THE WATCHER SEES ALL.\n\nIt looked through every choice you made in this city. Found more light than shadow.\n\nNot perfect. But honest. And in a game built to reveal what people become under pressure — honest is rarer than it sounds.`,
      neutral:  `THE WATCHER SEES ALL.\n\nIt saw both. The moments you chose to help and the moments you didn't. The lines you held and the ones you let slide.\n\nIt registers this as: inconclusive. The most human verdict it could give.`,
      ruthless: `THE WATCHER SEES ALL.\n\nIt saw the pattern before you did. The way efficiency became the excuse. The way pragmatism slowly stopped needing justification.\n\nIt does not condemn. It records. That might be worse.`,
      villain:  `THE WATCHER SEES ALL.\n\nAnd what it sees does not surprise it. The System was designed to find out what players do when no one is watching.\n\nSomething was watching. Something always was.`,
    }[morality]

    const allyScatter = `The plaza is still.

  Then, slowly, the frozen world begins to move again. One car. One pedestrian. A pigeon completes its flight. The wind returns.

  People stumble, confused. They don't know what happened. To them, no time passed.

  The people who stood with you in the plaza — they feel it first. The moment the game releases them.

  Marcus looks at his hands. Then at you. Then he turns and walks north, toward whatever the unfrozen city holds. His badge: steady. NEUTRAL. Chosen, not assigned.

  Lena is already organizing. The market will need restocking. People will be hungry and confused. She has a list started before the first person on the street has taken their second step.

  Kai closes their interface notes. Looks at the sky where the crack was. "I'll need to write all of this down," they say, to no one in particular. Then they're gone.

  Rhen disappears last. Or you think they do. There's a moment where they're there — NEUTRAL badge, clear eyes — and then the crowd fills in around them and they're just gone. Like they were always just passing through.

  Gio stands at the edge of the plaza the longest. He's looking at the market district. Something in his expression that might be a decision forming.

  Yara finds you in the crowd.

  "Well," she says.

  "Well," you say.

  She looks at the city opening back up around you — the noise returning, the motion, the smell of coffee from a shop that's already resuming where it left off.

  "Chapter 2," she says.

  Not a question.`

    const systemText = `Your interface pulses once. A message appears in letters that feel less like text and more like something carved:

  CHAPTER 1 COMPLETE.
  REPUTATION RECORDED: ${morality.toUpperCase()}.

  Below that, quieter, almost intimate:

  Your evolution is being calculated.

  You look at your hands. Same hands. Different player.

  Chapter 2 is waiting.`

    const fullText = `The Watcher shatters.

  Not with violence — with silence. Like a mirror falling in a dream, breaking without sound. The eye closes. The crack in the sky seals itself with threads of pale light.

  ${watcherVerdict}

  ${allyScatter}

  ${systemText}`

    document.getElementById('story-text').textContent = fullText

    // ── Moral verdict color ────────────────────────
    const mColor = moral >= 60 ? '#1e5a8a'
      : moral >= 20 ? '#2f7a2f'
      : moral >= -20 ? '#8b6a20'
      : moral >= -60 ? '#a04a18'
      : '#a02020'
    const mLabel = morality.toUpperCase()

    panel.innerHTML = `
      <div class="end-box">
        <p class="end-title">Chapter 1 Complete</p>
        <div style="margin:.5rem 0 .75rem;padding:.5rem .75rem;background:rgba(0,0,0,.08);border-radius:4px;border-left:3px solid ${mColor}">
          <p style="font-family:'Share Tech Mono',monospace;font-size:.5rem;color:var(--ink-dim);letter-spacing:.08em;margin-bottom:2px">REPUTATION RECORDED</p>
          <p style="font-family:'Cinzel',serif;font-size:1rem;font-weight:600;color:${mColor};margin:0">${mLabel}</p>
          <p style="font-family:'Share Tech Mono',monospace;font-size:.48rem;color:var(--ink-dim);margin-top:2px">Moral score: ${moral > 0 ? '+' : ''}${moral}</p>
        </div>
        <p class="end-sub" style="margin-bottom:.75rem">The Watcher has been defeated.<br>The Eyes have scattered across every road out of the city.</p>
        <button class="end-btn" id="continue-btn" style="display:block;margin-bottom:.75rem;width:100%">Continue ›</button>
        <button class="end-btn" id="restart-btn" style="font-size:.8rem;opacity:.7">↺ Replay Chapter 1</button>
      </div>
    `

    // ── Post-Watcher garage story beats ────────────────
    const GARAGE_BEATS = [
      {
        title: 'The Eyes Scatter',
        text: `The moment the Watcher's eye closes for the last time, something happens across the city that you feel before you see it.

  A sound — not quite a sound — like a signal cut. A frequency you didn't know you were hearing until it stops.

  Then the sky cracks open in twenty places at once.

  Not darkness. Light. Pale, pupil-shaped, wrong-colored light. And out of each crack — Eyes. Hundreds of them. Small ones, large ones, the slow-drifting kind and the kind that move like thrown knives.

  The Watcher is gone. Its fragments are still here.

  They disperse in every direction. Into the roads. Into the tunnels. Into the arteries of every route out of this city.

  Your interface updates with a warning you didn't ask for:

  WATCHER FRAGMENTS DETECTED ON ALL OUTBOUND ROUTES.
  TRAVEL ON FOOT: NOT RECOMMENDED.`
      },
      {
        title: 'The Garage',
        text: `Yara finds you before you've finished reading the warning.

  "I know what you're looking at," she says. She's already walking. "Come on."

  She leads you north — back through the plaza, past the fountain where the Watcher's light still lingers in the stone, down a maintenance corridor you didn't notice before. A door at the end. Heavy. Industrial. Painted over three times.

  She opens it.

  Inside: three vehicles. A motorcycle. A car. A van. Each one modified — armor plating, weapon mounts, components you don't recognize but can feel the purpose of.

  "The System flagged these as abandoned assets when the city froze," Yara says. "Technically they belong to the city now. Which means they belong to whoever the city decides needs them."

  She looks at you.

  "The city has decided."

  Your interface processes the transfer. The registration flickers. The vehicles' ownership data rewrites itself — three times, one after another.

  They're yours now. Permanently.`
      },
      {
        title: 'The Road Ahead',
        text: `"The Eyes are thickest on the roads between here and Chapter 2," Yara says, running her hand along the van's modified hood. "But they're not organized anymore. No Watcher to coordinate them. They're fragments — dangerous, but aimless."

  She hands you a set of three keys.

  "Pick your vehicle. Upgrade it with whatever you've got. The scrap metal, the flashlights, the parts you've been carrying — they're exactly what these machines need."

  She looks at the door behind you.

  "The other chapters are out there. Other parts of the System. Other players who never made it past their own Watchers — or who serve the ones still standing."

  A pause.

  "Get to Chapter 2. Whatever you find there — you'll be better prepared than you think."

  She leaves without ceremony. That's Yara's style.

  Your interface shows three vehicle profiles waiting for configuration.

  The garage is yours.`
      },
    ]

    let beatIdx = 0

    function showGarageBeat() {
      const beat = GARAGE_BEATS[beatIdx]
      const isLast = beatIdx === GARAGE_BEATS.length - 1
      panel.innerHTML = `
        <div class="end-box">
          <p style="font-family:'Share Tech Mono',monospace;font-size:.5rem;color:var(--ink-dim);letter-spacing:.1em;margin-bottom:.4rem">${beatIdx + 1} / ${GARAGE_BEATS.length}</p>
          <p class="end-title" style="font-size:.95rem;margin-bottom:.6rem">${beat.title}</p>
          <div id="story-text" style="font-family:'IM Fell English',serif;font-style:italic;font-size:.8rem;color:#c8b96e;line-height:1.65;margin-bottom:1rem;white-space:pre-line">${beat.text}</div>
          <button class="end-btn" id="beat-btn" style="display:block;width:100%">
            ${isLast ? '🔧 Enter Garage ›' : 'Continue ›'}
          </button>
        </div>`
      document.getElementById('beat-btn').addEventListener('click', () => {
        if (isLast) {
          window.bookNavigate('garage.html?dest=2')
        } else {
          beatIdx++
          showGarageBeat()
        }
      })
    }

    document.getElementById('continue-btn').addEventListener('click', () => {
      showGarageBeat()
    })

    document.getElementById('restart-btn').addEventListener('click', async () => {
      await supabase.from('players').update({ current_node:'ch1_opening' }).eq('id', player.id)
      player.current_node = 'ch1_opening'
      currentHp = player.hp
      outcome   = null
      bossMode  = 'solo'
      nodeId    = 'opening'
      render()
      window.scrollTo({ top:0, behavior:'smooth' })
    })
  }

  // ── Generic combat (for story encounters) ────────
  function renderCombat(panel, node) {
    // dorianLurking: true means Dorian backstabs player every 2 turns from the shadows.
    // Suppressed if player already defeated Dorian (window._dorianDefeated set on that path).
    const opts = {
      dorianLurking: node.dorianLurking && !window._dorianDefeated,
      sentinelAoe:   node.sentinelAoe   && !window._dorianDefeated,
      ally:          node.ally || null,
    }
    if (node.video) {
      playCombatCinematic(node.video, () => buildCombatUI(panel, node.enemy, node.onWin, node.onLose, node.onEscape, false, null, null, null, opts))
    } else {
      buildCombatUI(panel, node.enemy, node.onWin, node.onLose, node.onEscape, false, null, null, null, opts)
    }
  }

  // ── Boss cinematic video overlay ──────────────────
  function playCombatCinematic(src, onDone) {
    document.getElementById('cinematic-overlay')?.remove()

    const overlay = document.createElement('div')
    overlay.id = 'cinematic-overlay'
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .6s;'
    overlay.innerHTML = `
      <div style="position:relative;width:min(860px,92vw);max-height:80vh;aspect-ratio:16/9;background:#000">
        <video id="cinematic-video"
          src="${src}"
          autoplay playsinline muted
          style="width:100%;height:100%;object-fit:contain;display:block;">
        </video>
        <div id="cinematic-skip" style="
          position:absolute;bottom:1rem;right:1rem;z-index:1;
          font-family:'JetBrains Mono',monospace;font-size:.55rem;
          color:rgba(200,184,128,.7);letter-spacing:.08em;cursor:pointer;
          padding:4px 10px;border:.5px solid rgba(200,184,128,.3);
          background:rgba(0,0,0,.5);
        ">skip ›</div>
      </div>
    `
    document.body.appendChild(overlay)

    requestAnimationFrame(() => requestAnimationFrame(() => overlay.style.opacity = '1'))

    function endCinematic() {
      overlay.style.opacity = '0'
      setTimeout(() => { overlay.remove(); onDone() }, 650)
    }

    const video = overlay.querySelector('#cinematic-video')
    video.addEventListener('ended', endCinematic)
    video.addEventListener('error', endCinematic)
    overlay.querySelector('#cinematic-skip').addEventListener('click', endCinematic)
  }

  // ── Boss combat ───────────────────────────────────
  function renderBoss(panel, node) {
    // Scale Watcher to player level — always a real challenge
    const lvl    = player.level || 1
    const enemy  = { ...node.enemy }
    // HP bases bumped (+60 each) and per-level scaling slightly increased so
    // the fight lasts a few more turns at mid-level. Base DEF (15) carries
    // through to give the player meaningful resistance to chew through.
    if (bossMode === 'solo')   enemy.hp = 260 + lvl * 26
    if (bossMode === 'team')   enemy.hp = 320 + lvl * 26
    if (bossMode === 'betray') enemy.hp = 340 + lvl * 30
    // ATK scaling raised from *1.2 → *1.5 so its hits actually land hard
    // against a mid-level player's DEF (e.g. lv 11 + DEF 36 → ~14-20 dmg/turn).
    enemy.atk = node.enemy.atk + Math.floor(lvl * 1.5)

    // Yara joins as NPC ally in team mode
    const yara = bossMode === 'team' ? {
      name: 'Yara',
      hp: 80 + lvl * 10,
      maxHp: 80 + lvl * 10,
      atk: 6 + Math.floor(lvl * 0.8),
      def: 4 + Math.floor(lvl * 0.5),
      alive: true
    } : null

    const doBuild = () => buildCombatUI(panel, enemy, 'chapter_end', 'pre_boss_check', 'pre_boss_check', true, yara)

    if (node.video) {
      playCombatCinematic(node.video, doBuild)
    } else {
      doBuild()
    }
  }

  // ── Shared combat UI builder ──────────────────────
  function buildCombatUI(panel, enemy, onWin, onLose, onEscape, isBoss, yara = null, farmLoc = null, farmIdx = null, opts = {}) {
    // Unique namespace so multiple combat instances never share DOM IDs
    const cid = 'cb' + Math.random().toString(36).slice(2, 7)
    const $ = id => panel.querySelector('#' + cid + '-' + id)

    // ── Ally support ──────────────────────────────────────────────────
    // The 'yara' parameter is the original Ch1 ally slot (hardcoded for the
    // chapter-end team boss). For generic ally support across combats, the
    // node can pass opts.ally which we wire to the same code path. If both
    // are set, the explicit yara parameter wins.
    if (!yara && opts.ally) yara = opts.ally
    // Defensive: default missing fields if the author forgot.
    if (yara) {
      if (yara.alive === undefined) yara.alive = true
      if (yara.maxHp === undefined) yara.maxHp = yara.hp
    }

    // ── Dorian lurk + Sentinel AoE options ───────────────────
    const dorianLurking  = opts.dorianLurking || false   // Dorian backstabs every 2 turns
    const sentinelAoe    = opts.sentinelAoe   || false   // Void Sentinel hits both every 4 turns
    let   dorianLurkHp   = 40   // Dorian's shadow HP — Sentinel AoE chips him down too
    let   dorianLurkTurn = 0    // tracks turns for backstab cadence

    let enemyHp      = enemy.hp
    const maxEnemyHp  = enemy.hp
    const maxPlayerHp = player.max_hp || 100
    let over = false

    // Cache equipped items for derived stat calculations
    ;(async () => {
      const { data } = await supabase.from('inventory').select('*')
        .eq('player_id', player.id).not('equipped_slot', 'is', null)
      window._equippedItems = data || []
    })()

    panel.innerHTML = `
      <div class="combat-panel" id="${cid}-combat-wrap">
        <div class="combat-enemy-row">
          ${(()=>{
            const EIMGS = {
              'Glitch Rat':              '../assets/enemy/enemy_glitch_rat.png',
              'Glitch Rats x2':         '../assets/enemy/enemy_glitch_rat.png',
              'Garage Glitch Rats':     '../assets/enemy/enemy_glitch_rat.png',
              'Static Crawler':         '../assets/enemy/enemy_static_crawler.png',
              'Static Crawlers':        '../assets/enemy/enemy_static_crawler.png',
              'Static Crawlers x5':     '../assets/enemy/enemy_static_crawler.png',
              'Pixel Shard':            '../assets/enemy/enemy_pixel_shard.png',
              'Flicker Hound':          '../assets/enemy/enemy_flicker_hound.png',
              "Lena's Flicker Hounds":  '../assets/enemy/enemy_flicker_hound.png',
              'Pixel Drone':            '../assets/enemy/enemy_pixel_drone.png',
              'Jury-Rigged Pixel Drones':'../assets/enemy/enemy_jury_rigged_pixel_drones.png',
              'Fracture Wolf':          '../assets/enemy/enemy_fracture_wolf.png',
              'Fracture Wolves':        '../assets/enemy/enemy_fracture_wolf.png',
              'Market Creature Cluster':'../assets/enemy/enemy_market_creature_cluster_wolf.png',
              'Fragment Cluster':       '../assets/enemy/enemy_fragment_cluster.png',
              'Corrupted Sentry':       '../assets/enemy/enemy_corrupted_sentry.png',
              'Lobby Corrupted Sentries':'../assets/enemy/enemy_corrupted_sentry.png',
              'Void Sentinel':          '../assets/enemy/enemy_void_sentinel.png',
              'System Enforcer':        '../assets/enemy/enemy_system_enforcer.png',
              'Dorian':                 '../assets/npc/dorian_normal.png',
              'Dorian (Betrayal)':      '../assets/npc/dorian_betrayal.png',
              "Watcher's Eye":              '../assets/boss/watcher_eye.png',
              "Watcher's Eye Swarm":        '../assets/boss/watcher_eye_swarm.png',
              'Sentinel of the First Eye':  '../assets/boss/sentinel_of_the_first_eye.png',
              'The Surveyor':               '../assets/boss/the_surveyor.png',
              'The Unseen':                 '../assets/boss/the_unseen.png',
            }
            if (isBoss) return '<img src=\'../assets/boss/the_watcher.png\' alt=\'The Watcher\' style=\'width:80px;height:80px;object-fit:contain;border-radius:6px;flex-shrink:0;filter:drop-shadow(0 0 12px #00ffe740)\'>'
            const src = EIMGS[enemy.name]
            if (src) return `<img src="${src}" alt="${enemy.name}" style="width:80px;height:80px;object-fit:contain;border-radius:6px;flex-shrink:0;filter:drop-shadow(0 0 8px rgba(0,0,0,.7))" onerror="this.outerHTML='<span class=\'combat-enemy-icon\'>${enemy.icon}</span>'">`
            return `<span class="combat-enemy-icon">${enemy.icon}</span>`
          })()}
          <div style="flex:1">
            <p class="combat-enemy-name">${enemy.name}</p>
            <div class="stat-bar-wrap">
              <div class="stat-bar" id="${cid}-e-bar" style="background:#e05555;width:100%;transition:width .4s,background .4s"></div>
            </div>
            <p id="${cid}-e-hp" style="font-family:'Share Tech Mono',monospace;font-size:.62rem;color:var(--ink-dim);margin-top:2px">${enemyHp} / ${maxEnemyHp} HP</p>
          </div>
        </div>
        <div class="combat-log" id="${cid}-combat-log">${isBoss ? 'The eye opens. It sees everything.' : 'The encounter begins.'}</div>
        <div class="stat-row" style="margin-bottom:.4rem">
          <span class="stat-key" style="font-family:'Share Tech Mono',monospace;font-size:.62rem;color:var(--ink)">YOUR HP</span>
          <div class="stat-bar-wrap">
            <div class="stat-bar" id="${cid}-c-player-bar" style="background:#5ec45e;width:100%;transition:width .4s,background .4s"></div>
          </div>
          <span id="${cid}-c-player-hp" style="font-family:'Share Tech Mono',monospace;font-size:.62rem;color:var(--ink);min-width:50px;text-align:right">${currentHp}/${maxPlayerHp}</span>
        </div>
        ${yara ? `
        <div class="stat-row" style="margin-bottom:${dorianLurking ? '.3rem' : '1rem'}">
          <span class="stat-key" style="font-family:'Share Tech Mono',monospace;font-size:.62rem;color:#5ec45e">${(yara.name || 'ALLY').toUpperCase()}</span>
          <div class="stat-bar-wrap">
            <div class="stat-bar" id="${cid}-c-yara-bar" style="background:#5eaee0;width:100%;transition:width .4s,background .4s"></div>
          </div>
          <span id="${cid}-c-yara-hp" style="font-family:'Share Tech Mono',monospace;font-size:.62rem;color:#5eaee0;min-width:50px;text-align:right">${yara.hp}/${yara.maxHp}</span>
        </div>` : (dorianLurking ? '' : '<div style="margin-bottom:1rem"></div>')}
        ${dorianLurking ? `
        <div class="stat-row" style="margin-bottom:1rem">
          <span class="stat-key" style="font-family:'Share Tech Mono',monospace;font-size:.62rem;color:#e05555">DORIAN</span>
          <div class="stat-bar-wrap">
            <div class="stat-bar" id="${cid}-c-dorian-bar" style="background:#e05555;width:100%;transition:width .4s,background .4s"></div>
          </div>
          <span id="${cid}-c-dorian-hp" style="font-family:'Share Tech Mono',monospace;font-size:.62rem;color:#e05555;min-width:50px;text-align:right">?? / 40</span>
        </div>` : ''}
        <div id="${cid}-combat-actions">
          <p style="font-family:'Share Tech Mono',monospace;font-size:.5rem;color:var(--ink);letter-spacing:.09em;margin-bottom:5px">— CHOOSE YOUR ACTION —</p>

          <!-- Basic actions always visible -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:4px">
            <button class="combat-btn" id="${cid}-btn-strike"
              style="flex-direction:column;gap:2px;padding:.45rem .25rem;font-size:.62rem"
              title="Fast attack. Always goes first.">
              <span style="font-size:1.1rem;line-height:1">⚔</span>
              <span>Strike</span>
              <span style="font-size:.44rem;color:#a08858;letter-spacing:.04em">FAST · FIRST</span>
            </button>
            <button class="combat-btn" id="${cid}-btn-heavy"
              style="flex-direction:column;gap:2px;padding:.45rem .25rem;font-size:.62rem"
              title="Heavy blow. High damage but slower.">
              <span style="font-size:1.1rem;line-height:1">💥</span>
              <span>Heavy</span>
              <span style="font-size:.44rem;color:#a08858;letter-spacing:.04em">HIGH DMG · SLOW</span>
            </button>
            <button class="combat-btn" id="${cid}-btn-defend"
              style="flex-direction:column;gap:2px;padding:.45rem .25rem;font-size:.62rem"
              title="Halve incoming damage this turn. Always acts first.">
              <span style="font-size:1.1rem;line-height:1">🛡</span>
              <span>Defend</span>
              <span style="font-size:.44rem;color:#a08858;letter-spacing:.04em">BLOCK · FIRST</span>
            </button>
          </div>

          <!-- Skills — rendered dynamically, same visual weight as basic actions -->
          <div id="${cid}-skill-slots-row" style="margin-bottom:4px"></div>

          <!-- Class skills — only renders if player has unlocked active-type skills -->
          <div id="${cid}-class-skills-row" style="margin-bottom:4px"></div>

          <!-- Utility row -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
            <button class="combat-btn" id="${cid}-btn-items" style="color:#5eaee0;font-size:.6rem" title="Use a consumable item.">🎒 Items</button>
            <button class="combat-btn" id="${cid}-btn-escape" style="font-size:.6rem" title="Attempt to flee.">💨 Flee</button>
          </div>
        </div>
        <div id="${cid}-items-panel" style="display:none;margin-top:.5rem;border:.5px solid rgba(94,174,224,.3);border-radius:4px;padding:.6rem;background:rgba(0,0,0,.05);animation:fadeIn .2s ease">
          <p style="font-family:'Share Tech Mono',monospace;font-size:.58rem;color:#5eaee0;letter-spacing:.06em;margin-bottom:.4rem">⚡ USE ITEM</p>
          <div id="${cid}-items-list"></div>
          <button onclick="document.getElementById('${cid}-items-panel').style.display='none'" style="font-family:'IM Fell English',serif;font-size:.78rem;color:var(--ink-dim);background:none;border:none;cursor:pointer;margin-top:.4rem;padding:0">✕ Close</button>
        </div>
        <div id="${cid}-combat-over" style="display:none;text-align:center;padding:.5rem"></div>
      </div>
    `

    function syncBars() {
      const ePct = Math.max(0, Math.round(enemyHp  / maxEnemyHp  * 100))
      const pPct = Math.max(0, Math.round(currentHp / maxPlayerHp * 100))
      const eBar = $('e-bar')
      const eHp  = $('e-hp')
      const pBar = $('c-player-bar')
      const pHp  = $('c-player-hp')
      if (eBar) { eBar.style.width = ePct+'%'; eBar.style.background = ePct>50?'#e05555':'#c8b96e' }
      if (eHp)  eHp.textContent = enemyHp+' / '+maxEnemyHp+' HP'
      if (pBar) { pBar.style.width = pPct+'%'; pBar.style.background = pPct>60?'#5ec45e':pPct>30?'#c8b96e':'#e05555' }
      if (pHp)  pHp.textContent = currentHp+'/'+maxPlayerHp
      updateHpBar(currentHp)
      if (yara) {
        const yPct  = Math.max(0, Math.round(yara.hp / yara.maxHp * 100))
        const yBar  = $('c-yara-bar')
        const yHpEl = $('c-yara-hp')
        if (yBar)  {
          yBar.style.width = yPct+'%'
          yBar.style.background = yara.alive ? (yPct>50?'#5eaee0':'#c8b96e') : '#666'
        }
        if (yHpEl) yHpEl.textContent = yara.alive ? (yara.hp+'/'+yara.maxHp) : 'fallen'
      }
      if (dorianLurking) {
        const dPct  = Math.max(0, Math.round(dorianLurkHp / 40 * 100))
        const dBar  = $('c-dorian-bar')
        const dHpEl = $('c-dorian-hp')
        if (dBar)  { dBar.style.width = dPct+'%'; dBar.style.background = dPct > 30 ? '#e05555' : '#7a3030' }
        if (dHpEl) dHpEl.textContent = dorianLurkHp > 0 ? '?? / 40' : 'DOWN'
      }
    }

    function log(msg, turnInfo) {
      const el = $('combat-log')
      if (el) el.innerHTML = (turnInfo
        ? '<span style="font-family:\'Share Tech Mono\',monospace;font-size:.48rem;color:#a08858;letter-spacing:.06em;display:block;margin-bottom:2px">' + turnInfo + '</span>'
        : '') + msg
    }

    function shake() {
      const w = $('combat-wrap')
      if(!w) return
      w.classList.add('animate-shake')
      setTimeout(()=>w.classList.remove('animate-shake'),400)
    }

    async function endCombat(result) {
      if (over) return
      over = true
      const actions = $('combat-actions')
      const overEl  = $('combat-over')
      if (actions) actions.style.display = 'none'

      // ── Ally outcome bookkeeping ────────────────────────────────────
      // Tags ally outcome to alliance_log for narrative branching. Format:
      // 'ally_<name>_died' or 'ally_<name>_survived'. Mutates player in
      // memory; the column is committed by the save() calls below in each
      // branch (win/lose/escape). We do NOT save here separately because
      // that would race with the branch-specific save calls.
      let _allyLogUpdate = null
      if (yara) {
        const tag = yara.alive
          ? 'ally_yara_survived'
          : 'ally_yara_died'
        const log = player.alliance_log || []
        if (!log.includes(tag)) {
          log.push(tag)
          player.alliance_log = log
          _allyLogUpdate = log  // for branches below to merge into their updates
        }
      }

      // ── Record passive battle counts on any win ───────────
      if (result === 'win') {
        const unlocked = player.skills_unlocked || []
        const inBattle = player.battle_skills   || []

        // Elemental passives
        const EL_PASSIVES = [
          'darkness_passive_backstab','fire_passive_burn','lightning_passive_chain_damage',
          'wind_passive_dodge','earth_passive_damage_reduction','water_passive_regen','metal_passive_reflect',
        ]
        // Notable passives — both old and new key variants
        const NOTABLE_PASSIVES = [
          'ofn2','ofn3','dfn1','dfn2','dfn3','dfn5','fln1','fln2','fln4','fln5',
          'arn1','arn3','arn4','arn5','dcn2','dcn4','dcn5','dc_ks2',
          'an2','an3','dn1','dn2','dn3','dn5','gn1','gn2','gn4','gn5',
          'mn1','mn3','mn4','mn5','dkn1','pln2','dkn2',
        ]
        const T = [0,10,25,50,90,150,240,380,590,900]
        const sl = player.skill_levels || {}
        let leveledUp = []

        const tickSkill = k => {
          if (!sl[k]) sl[k] = { uses: 0 }
          const prevLv = getSkillLevel(k)
          sl[k].uses++
          let newLv = 1
          for (let i = 1; i < T.length; i++) { if (sl[k].uses >= T[i]) newLv = i+1; else break }
          newLv = Math.min(10, newLv)
          if (newLv > prevLv) leveledUp.push({ k, lv: newLv })
        }

        // Tick elemental passives if unlocked
        EL_PASSIVES.filter(k => unlocked.includes(k)).forEach(tickSkill)
        // Tick notable passives if in battle slots
        NOTABLE_PASSIVES.filter(k => inBattle.includes(k)).forEach(tickSkill)

        player.skill_levels = sl
        await supabase.from('players').update({ skill_levels: sl }).eq('id', player.id)
        for (const { k, lv } of leveledUp) {
          const sk = BATTLE_SKILLS[k] || NOTABLE_SKILLS[k]
          window.showToast('✦ ' + (sk?.label || k) + ' passive reached Lv ' + lv + '!')
        }

        // Increment helps_given if this was an ally-assist fight
        if (window._fightIsHelp) {
          window._fightIsHelp = false
          const newHelps = (player.helps_given || 0) + 1
          player.helps_given = newHelps
          const newBadge = calcBadge(player.moral_score, player.pvp_kills, newHelps, player.backstabs)
          player.badge = newBadge
          await supabase.from('players').update({ helps_given: newHelps, badge: newBadge, reputation: newBadge }).eq('id', player.id)
        }
      }

      const isFarm   = onWin === '__farm_win__'
      const isEyeFight = onWin === '__eye_win__'

      // ── Eye encounter: call callback and show minimal result, then let overlay handle dismiss
      if (isEyeFight && window._eyeEncounterCallback) {
        const cb = window._eyeEncounterCallback
        window._eyeEncounterCallback = null
        window._inEyeEncounter = false
        const resultLabel = result==='win' ? '✦ Eye Defeated ✦' : '✦ The Eye Retreats ✦'
        const resultColor = result==='win' ? '#c8b96e' : '#e05555'
        const resultMsg   = result==='win'
          ? 'It dissolves in pale light. Somewhere above the clouds, something blinks. It will send more.'
          : 'The eye rises back toward the crack in the sky, iris closing slowly. It was a test. You are still standing.'
        if (overEl) {
          overEl.style.display = 'block'
          overEl.innerHTML = '<p style="font-family:Cinzel,serif;font-size:1rem;font-weight:600;color:'+resultColor+';letter-spacing:.1em;margin-bottom:.5rem">'+resultLabel+'</p>'
            + '<p style="font-family:&quot;IM Fell English&quot;,serif;font-style:italic;font-size:.82rem;color:#c8b96e;line-height:1.55;margin-bottom:.6rem">'+resultMsg+'</p>'
            + '<p style="font-family:&quot;Share Tech Mono&quot;,monospace;font-size:.55rem;color:var(--ink-dim);letter-spacing:.08em">Returning to your story\u2026</p>'
        }
        // Award XP for eye fight
        const eyeXp  = result==='win' ? (enemy.xp || 80) : Math.floor((enemy.xp || 80) * 0.2)
        const eyeXpOld = player.xp || 0
        const eyeXpNew = eyeXpOld + eyeXp
        const eyeOldLvl = player.level || 1
        player.xp = eyeXpNew
        const eyeLvlUp = await checkLevelUp(eyeXpOld, eyeXpNew, eyeOldLvl)
        const eyeUpdates = { xp: eyeXpNew, hp: currentHp, ...(eyeLvlUp||{}) }
        if (result==='win' && enemy.loot) for (const l of enemy.loot) await addItem(l.itemKey, l.qty)
        await save(eyeUpdates)
        cb(result)
        return
      }

      if (overEl) {
        overEl.style.display = 'block'
        const resultLabel = result==='win' ? '✦ Victory ✦' : result==='escape' ? '✦ Escaped ✦' : '✦ Defeated ✦'

        if (isFarm) {
          const btnStyle = "font-family:'Cinzel',serif;font-size:.8rem;color:var(--ink);border-radius:3px;padding:.45rem 1rem;cursor:pointer;width:100%;border:1px solid rgba(139,106,32,.5);margin-bottom:4px"
          overEl.innerHTML =
            '<p style="font-family:Cinzel,serif;font-size:1.1rem;font-weight:600;color:var(--ink);letter-spacing:.1em;margin-bottom:.6rem">' + resultLabel + '</p>' +
            '<div style="display:flex;flex-direction:column;gap:4px">' +
            '<button onclick="returnToZone()" style="' + btnStyle + ';background:rgba(200,184,128,.45)">⚔ Fight Again (same zone)</button>' +
            '<button onclick="returnToZoneHub()" style="' + btnStyle + ';background:rgba(200,184,128,.25)">← Pick a Different Zone</button>' +
            '<button onclick="returnToStory()" style="' + btnStyle + ';background:rgba(200,184,128,.12)">↩ Return to Story</button>' +
            '</div>'
        } else {
          // Boss or story fight — show navigation buttons
          const btnStyle = "font-family:'Cinzel',serif;font-size:.8rem;color:var(--ink);border-radius:3px;padding:.45rem 1rem;cursor:pointer;width:100%;border:1px solid rgba(139,106,32,.5);margin-bottom:4px"
          overEl.innerHTML =
            '<p style="font-family:Cinzel,serif;font-size:1.1rem;font-weight:600;color:var(--ink);letter-spacing:.1em;margin-bottom:.6rem">' + resultLabel + '</p>' +
            '<div style="display:flex;flex-direction:column;gap:4px">' +
            (result === 'win' ? '' :
              '<button onclick="returnToBoss()" style="' + btnStyle + ';background:rgba(200,184,128,.45)">⚔ Try Again</button>' +
              '<button onclick="returnToZoneHub()" style="' + btnStyle + ';background:rgba(200,184,128,.25)">⚔ Go Farm XP</button>'
            ) +
            '<button onclick="returnToStory()" style="' + btnStyle + ';background:rgba(200,184,128,.12)">↩ Return to Story</button>' +
            '</div>'
        }
      }

      const oldXp  = player.xp || 0
      const oldLvl = player.level || 1

      if (result === 'win') {
        const RUNE_POOL_COMMON = ['rune_ignis','rune_aqua','rune_terra','rune_aero']
        const RUNE_POOL_RARE   = ['rune_ignis','rune_aqua','rune_terra','rune_aero']
        const isHardEnemy      = (enemy.hp||0) > 60
        const runeChance       = isBoss ? 1.0 : isHardEnemy ? 0.35 : 0.20
        const runePool         = (isBoss || isHardEnemy) ? RUNE_POOL_RARE : RUNE_POOL_COMMON
        const runeKey          = Math.random() < runeChance ? runePool[Math.floor(Math.random()*runePool.length)] : null

        if (isFarm) {
          // Farm: fire all DB saves in background — buttons already visible
          const newXp = oldXp + (enemy.xp || 50)
          player.xp = newXp
          // Gold drop: 0-100 gold scaled by enemy difficulty
          const goldMin  = Math.floor((enemy.hp || 20) * 0.1)
          const goldMax  = Math.floor((enemy.hp || 20) * 0.8)
          const goldDrop = Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin
          const newGold  = (player.gold || 0) + goldDrop
          player.gold = newGold
          checkLevelUp(oldXp, newXp, oldLvl).then(lvlUp => {
            save({ xp: newXp, hp: currentHp, gold: newGold, ...(lvlUp||{}) })
          })
          if (goldDrop > 0) queueLoot('◈ ' + goldDrop + ' Gold', 1, null)
          if (enemy.loot) for (const l of enemy.loot) addItem(l.itemKey, l.qty)
          if (runeKey) addItem(runeKey, 1)
          if (farmLoc && farmLoc.enemies[farmIdx]) {
            for (const drop of farmLoc.enemies[farmIdx].loot) {
              if (Math.random() < drop.chance) addItem(drop.itemKey, 1)
            }
          }
        } else {
          // Story/boss: await saves then navigate
          const newXp   = oldXp + (enemy.xp || 50)
          const updates = { xp: newXp, hp: currentHp }
          const lvlUp   = await checkLevelUp(oldXp, newXp, oldLvl)
          if (lvlUp) Object.assign(updates, lvlUp)

          // Zone guardian boss key — mark as defeated
          const curNode = NODES[nodeId]
          if (curNode && curNode.bossKey) {
            const defeated = markBossDefeated(curNode.bossKey)
            updates.defeated_bosses = defeated
          }

          if (isBoss) {
            const unlocked = player.chapters_unlocked || [1]
            if (!unlocked.includes(2)) updates.chapters_unlocked = [...unlocked, 2]
            // ── 1 SP for boss kill — only once ever ──
            const spKey = 'watcher_sp_claimed'
            const currentDefeated = updates.defeated_bosses || player.defeated_bosses || []
            const alreadyClaimed = currentDefeated.includes(spKey)
            if (!alreadyClaimed) {
              const merged = [...new Set([...currentDefeated, spKey])]
              updates.defeated_bosses = merged
              player.defeated_bosses  = merged
              const ch1Bonus = 1
              updates.skill_points = (player.skill_points || 0) + ch1Bonus
              updates.sp_claimed   = (player.sp_claimed  || 0) + ch1Bonus
              player.skill_points  = updates.skill_points
              player.sp_claimed    = updates.sp_claimed
              window.showToast('Chapter 1 Complete — +' + (enemy.xp||300) + ' XP  +' + ch1Bonus + ' Bonus SP!')
            } else {
              window.showToast('Chapter 1 Complete — +' + (enemy.xp||300) + ' XP')
            }
            // ── Watcher Item Set — rare drop (35% per piece) ──
            await dropWatcherSet()
          } else {
            window.showToast('Victory! +' + (enemy.xp||50) + ' XP gained!')
            // ── Zone guardian Watcher piece drops ──
            const curBossKey = NODES[nodeId]?.bossKey
            if (curBossKey === 'sentinel') {
              if (Math.random() < 0.05) await dropSingleWatcherPiece('watcher_crown')
            } else if (curBossKey === 'surveyor') {
              if (Math.random() < 0.05) await dropSingleWatcherPiece('watcher_eye_ring')
            } else if (curBossKey === 'unseen') {
              if (Math.random() < 0.05) await dropSingleWatcherPiece('watcher_cloak')
            }
          }
          // Gold drop for story fights (boss drops more)
          const sGoldDrop = isBoss ? (Math.floor(Math.random() * 80) + 60) : (Math.floor(Math.random() * 40) + 5)
          updates.gold = (player.gold || 0) + sGoldDrop
          player.gold = updates.gold
          if (updates.xp) player.xp = updates.xp

          // ── Class skill: combat-end hook (persistent stat updates) ──────
          // Eternal Sovereign (Prime t5a) carries stat stacks forward.
          const _clsEnd = ClsCombat.onCombatEnd(player, statusEffects, 'win')
          if (Object.keys(_clsEnd.dbUpdates).length > 0) {
            Object.assign(updates, _clsEnd.dbUpdates)
            for (const k of Object.keys(_clsEnd.dbUpdates)) player[k] = _clsEnd.dbUpdates[k]
          }
          if (_clsEnd.messages.length) window.showToast(_clsEnd.messages[0])

          // Merge ally outcome tag into the same updates payload
          if (_allyLogUpdate) updates.alliance_log = _allyLogUpdate

          await save(updates)
          if (sGoldDrop > 0) queueLoot('◈ ' + sGoldDrop + ' Gold', 1, null)
          // Award guaranteed loot from boss node definition
          if (enemy.loot) {
            for (const l of enemy.loot) {
              const result = await addItem(l.itemKey, l.qty)
              // If core_fragment fails (not in items table), award a rune instead
            }
          }
          if (runeKey) await addItem(runeKey, 1)
          // Watcher death cinematic before navigating to end
          if (isBoss) {
            playCombatCinematic('../assets/video/the_watcher_dead.mp4', () => goTo(onWin))
          } else {
            setTimeout(() => goTo(onWin), 1200)
          }
        }
      } else {
        if (isBoss) {
          // On boss defeat: fully restore HP and reset node so player isn't stuck
          const fullHp = player.max_hp || 100
          currentHp = fullHp
          const bossLoseUpdates = { hp: fullHp, current_node: 'ch1_pre_boss_check' }
          if (_allyLogUpdate) bossLoseUpdates.alliance_log = _allyLogUpdate
          await save(bossLoseUpdates)
          player.current_node = 'ch1_pre_boss_check'
          renderHUD()
          return
        }
        // ── Class skill: combat-end hook for defeat ─────────────────────
        // Lets Prime/Mourning King reset their accumulated stacks to 0.
        // Skip the call on 'escape' — fleeing isn't dying.
        const loseUpdates = { hp: Math.max(1, currentHp) }
        if (result === 'defeat') {
          const _clsEnd = ClsCombat.onCombatEnd(player, statusEffects, 'defeat')
          if (Object.keys(_clsEnd.dbUpdates).length > 0) {
            Object.assign(loseUpdates, _clsEnd.dbUpdates)
            for (const k of Object.keys(_clsEnd.dbUpdates)) player[k] = _clsEnd.dbUpdates[k]
          }
          if (_clsEnd.messages.length && typeof window.showToast === 'function') {
            window.showToast(_clsEnd.messages[0])
          }
        }
        // Merge ally outcome tag into the same updates payload
        if (_allyLogUpdate) loseUpdates.alliance_log = _allyLogUpdate
        await save(loseUpdates)
        setTimeout(() => {
          const dest = result==='escape' ? onEscape : onLose
          if (dest === '__farm_zone__') {
            const p = document.getElementById('right-panel')
            if (farmLoc && p) renderFarmZone(p, farmLoc)
            else renderLocationHub(p, NODES['farming_hub'])
          } else {
            goTo(dest)
          }
        }, 1200)
      }
    }

    // Get equipped stat bonuses (loaded from player object which we keep in sync)
    const eqPower  = player.power   || 0
    const eqGuard  = player.guard   || 0
    const eqSpeed  = player.speed   || 0
    const eqInsight= player.insight || 0
    const eqLuck   = player.luck    || 0

    // Speed bonus: if speed >= 3, player always goes first (already do by acting on click)
    // Luck: adds to random range
    // ── Turn-based combat engine ─────────────────────────────
    let defending = false

    function playerATK()  { return calcATK() }
    function playerDEF()  {
      let base = calcDEF()
      // Armour Shred (applied by enemyAI.js): reduces DEF by shredAmt
      if (statusEffects.playerDefShredTurns > 0) {
        base = Math.max(0, base - (statusEffects.playerDefShredAmt||0))
      }
      return base
    }
    function playerSPD()  { return calcSPD() }
    function enemySPD()   { return enemy.spd || Math.floor((enemy.atk||5) * 0.6) }

    // ── Global skill level getter (also used by renderSkillSlots outside doTurn) ─
    function _skillLvGlobal(key) {
      const T = [0,10,25,50,90,150,240,380,590,900]
      const sl = (player.skill_levels || {})[key]
      if (!sl) return 1
      let lv = 1
      for (let i = 1; i < T.length; i++) { if (sl.uses >= T[i]) lv = i+1; else break }
      return Math.min(10, lv)
    }

    // ── Battle skills from player ────────────────────────────
    const battleSkillKeys = player.battle_skills || []
    // BATTLE_SKILLS sourced from shared registry — see data/skills_registry.js
    // Local spread copy: the Object.assign below will mutate this with
    // NOTABLE_SKILLS (which itself gets OLD_KEY_MAP backfilled in). Using
    // a local copy keeps the shared module unmutated across engines.
    const BATTLE_SKILLS = { ...BATTLE_SKILLS_REGISTRY }

    // NOTABLE_SKILLS sourced from shared registry — see data/skills_registry.js
    // Local spread copy; OLD_KEY_MAP below mutates this for backward compat.
    const NOTABLE_SKILLS = { ...NOTABLE_SKILLS_REGISTRY }
    // Backward compat — old keys still work if any saved data uses them
    const OLD_KEY_MAP = { an1:'ofn1',an2:'ofn2',an3:'ofn3',an4:'ofn4',an5:'ofn5',an6:'ofn6',
      dn1:'dfn1',dn2:'dfn2',dn3:'dfn3',dn4:'dfn4',dn5:'dfn5',dn6:'dfn6',
      gn1:'fln1',gn2:'fln2',gn3:'fln3',gn4:'fln4',gn5:'fln5',gn6:'fln6',
      mn1:'arn1',mn2:'arn2',mn3:'arn3',mn4:'arn4',mn5:'arn5',mn6:'arn6',
      dpn1:'dcn1',dkn1:'dcn2',pln1:'dcn3',dkn2:'dcn4',pln2:'dcn5',dpn2:'dcn6' }
    Object.entries(OLD_KEY_MAP).forEach(([old,nw]) => { if (NOTABLE_SKILLS[nw]) NOTABLE_SKILLS[old] = NOTABLE_SKILLS[nw] })

    // Merge NOTABLE_SKILLS into BATTLE_SKILLS so the rest of the engine is unified
    Object.assign(BATTLE_SKILLS, NOTABLE_SKILLS)

    // ── Combat status effects ────────────────────────────────
    let statusEffects = {
      playerATKBonus:  0,
      playerDEFBonus:  0,
      playerSPDBonus:  0,
      ignoreEnemyDEF:  false,
      invulnerable:    false,
      waterShield:     0,   // HP absorbed
      enemyATKMult:    1.0,
      enemyStunTurns:  0,
      burnTurns:       0,
      burnDmg:         3,   // scaled by fire_passive_burn level
      infernoTurns:    0,
      regenTurns:      0,
      rootTrapTurns:   0,
      skillCooldowns:  {},  // key → turns remaining
    }

    // Apply passive skills at battle start
    function applyPassives() {
      const unlocked = player.skills_unlocked || []
      const inBattle = player.battle_skills   || []
      // Elemental passives — scaled by level
      if (unlocked.includes('water_passive_regen'))            statusEffects.regenTurns    = 999
      if (unlocked.includes('earth_passive_damage_reduction')) {
        const lv = _skillLvGlobal('earth_passive_damage_reduction')
        statusEffects.playerDEFBonus += Math.round(5 + (lv - 1))
      }
      if (unlocked.includes('metal_passive_reflect'))          statusEffects.metalReflect  = true
      // Notable passives — new IDs (ofn2, dfn1 etc.) plus old IDs for backward compat
      const has = k => inBattle.includes(k) || inBattle.includes(OLD_KEY_MAP[k] || k)
      if (has('ofn2')||has('an2')) statusEffects.flameFist    = true
      if (has('ofn3')||has('an3')) statusEffects.venomFang    = true
      if (has('dfn1')||has('dn1')) statusEffects.tidalResolve = true
      if (has('dfn2')||has('dn2')) statusEffects.absorption   = true
      if (has('dfn3')||has('dn3')) statusEffects.liveWire     = true
      if (has('dfn5')||has('dn5')) statusEffects.arcReflex    = true
      if (has('fln1')||has('gn1')) statusEffects.razorTempo   = true
      if (has('fln2')||has('gn2')) statusEffects.ghostStep    = true
      if (has('fln4')||has('gn4')) statusEffects.flicker      = true
      if (has('fln5')||has('gn5')) statusEffects.tremorStep   = true
      if (has('arn1')||has('mn1')) statusEffects.sharpMind    = true
      if (has('arn3')||has('mn3')) statusEffects.razorLuck    = true
      if (has('arn4')||has('mn4')) statusEffects.prescience   = true
      if (has('arn5')||has('mn5')) statusEffects.ricochet     = true
      if (has('dcn2')||has('dkn1'))statusEffects.umbralVeil   = true
      if (has('dcn4')||has('dkn2'))statusEffects.shadeWalk    = true
      if (has('dcn5')||has('pln2'))statusEffects.enduringRoot = true
      if (has('dcn6')||has('dpn2'))statusEffects.dreadPulse   = true
      // Keystones
      if (has('dc_ks2')) {
        // Ancient Root: shield at battle start
        statusEffects.ancientRootShield = Math.round(maxPlayerHp * 0.2)
      }
    }
    applyPassives()

    // ── Class skill combat hooks: initialize ─────────────────────────────
    // Mirrors Ch2 — populates per-combat counters and grants Equal Sky bonus SP.
    const _clsStart = ClsCombat.onCombatStart(player, statusEffects)
    // First Light (Dawnbringer t2c): heal to full at start (once/chapter)
    if (statusEffects.cls_firstLightHealToFull) {
      currentHp = maxPlayerHp
      statusEffects.cls_firstLightHealToFull = false
    }
    // Thick Hide (Dreadnought t1b): +20% max HP at combat start
    if ((statusEffects.cls_thickHideBonus || 0) > 0) {
      maxPlayerHp += statusEffects.cls_thickHideBonus
      currentHp += statusEffects.cls_thickHideBonus
      statusEffects.cls_thickHideBonus = 0
    }
    // (any "Equal Sky" message will appear in the first combat-log push)

    // ── Render battle skill slots ─────────────────────────────
    function renderSkillSlots() {
      const row = $('skill-slots-row')
      if (!row) return

      const activeSkills = battleSkillKeys.filter(k => {
        const s = BATTLE_SKILLS[k]
        return s && s.type !== 'passive'
      })
      const passiveSkills = battleSkillKeys.filter(k => {
        const s = BATTLE_SKILLS[k]
        return s && s.type === 'passive'
      })

      // Build passive indicator strip (always-on effects shown as small tags)
      const passiveStrip = passiveSkills.length
        ? '<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:4px">'
          + passiveSkills.map(k => {
              const sk = BATTLE_SKILLS[k]
              return `<span style="font-family:'Share Tech Mono',monospace;font-size:.44rem;color:${sk.color};
                border:.5px solid ${sk.color}50;border-radius:12px;padding:1px 6px;background:${sk.color}12;
                letter-spacing:.04em">⚡ ${sk.label} (passive)</span>`
            }).join('')
          + '</div>'
        : ''

      if (!activeSkills.length) {
        row.innerHTML = passiveStrip +
          '<p style="font-family:\'Share Tech Mono\',monospace;font-size:.5rem;color:var(--ink-dim);padding:4px 0">' +
          'No active skills assigned — visit Skills page</p>'
        return
      }

      // Skills header
      let html = passiveStrip
      html += '<p style="font-family:\'Share Tech Mono\',monospace;font-size:.48rem;color:var(--ink);letter-spacing:.09em;margin-bottom:4px">— SKILLS —</p>'

      // Skills grid — same 3-column layout as basic actions
      html += '<div style="display:grid;grid-template-columns:' +
        (activeSkills.length === 1 ? '1fr' : activeSkills.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr') +
        ';gap:4px">'

      html += activeSkills.map(k => {
        const sk     = BATTLE_SKILLS[k]
        const cd     = statusEffects.skillCooldowns[k] || 0
        const isUlt  = sk.type === 'ultimate'
        const lv     = _skillLvGlobal(k)
        const lvColor = lv >= 10 ? '#ffd700' : lv >= 7 ? '#c8b96e' : lv >= 4 ? '#a0c080' : '#9a8858'
        const pct    = Math.round((0.5 + (lv - 1) * (0.5 / 9)) * 100)

        // Skill icon — try image, fall back to element emoji
        const EL_ICON = { fire:'🔥', water:'💧', earth:'🪨', wind:'💨', dark:'🌑', light:'✨', lightning:'⚡', metal:'⚙', plant:'🌿' }
        const elIcon = EL_ICON[sk.el] || '✦'

        const cdLabel = cd > 0 ? cd + ' turn' + (cd > 1 ? 's' : '') : null
        const border  = isUlt ? `border-color:${sk.color}70` : `border-color:${sk.color}40`

        // Build skill button safely — avoid nested template literals and quote hell
        const cdOverlay = cd > 0
          ? '<div style="position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;border-radius:3px">'
            + '<span style="font-family:Share Tech Mono,monospace;font-size:.55rem;color:#c8b96e">' + cdLabel + '</span>'
            + '</div>'
          : ''
        const iconFilter = cd > 0 ? 'grayscale(1)' : 'drop-shadow(0 0 4px ' + sk.color + '88)'
        const btnColor   = cd > 0 ? 'rgba(200,160,60,.35)' : sk.color
        const imgTag = '<img src="../assets/skills/' + k + '.webp"'
          + ' style="width:24px;height:24px;object-fit:contain;border-radius:3px;display:block;margin:0 auto"'
          + ' onerror="this.remove()">'

        return '<button class="combat-btn" id="' + cid + '-btn-skill-' + k + '"'
          + ' onclick="useSkill_' + cid + '(\'' + k + '\')"'
          + (cd > 0 ? ' disabled' : '')
          + ' title="' + (sk.desc || sk.label) + ' (Lv' + lv + ' · ' + pct + '% power)"'
          + ' style="flex-direction:column;gap:2px;padding:.45rem .25rem;' + border + ';'
          + 'color:' + btnColor + ';position:relative;overflow:hidden">'
          + cdOverlay
          + '<span style="font-size:1rem;line-height:1;filter:' + iconFilter + '">' + imgTag
          + '<span style="font-size:1rem;margin:0 auto;display:none" class="sk-fallback-' + k + '">' + elIcon + '</span>'
          + '</span>'
          + '<span style="font-size:.58rem;font-weight:600;letter-spacing:.02em">' + (isUlt ? '★ ' : '') + sk.label + '</span>'
          + '<span style="font-size:.42rem;color:' + lvColor + ';letter-spacing:.04em">Lv' + lv + ' · ' + pct + '%</span>'
          + '</button>'
      }).join('')

      html += '</div>'
      row.innerHTML = html
    }

    // ── Class skill action buttons (Ch1 mirror of Ch2 renderClassSkills) ──
    // Renders a row of active class skills under the regular skill row.
    // Hidden if the player has no active class or no active-type skills.
    function renderClassSkills() {
      const row = $('class-skills-row')
      if (!row) return
      const skills = ClsCombat.getActiveClassSkills(player, statusEffects)
      if (!skills.length) { row.innerHTML = ''; return }
      row.innerHTML = '<div style="display:flex;gap:3px;flex-wrap:wrap">'
        + skills.map(s => {
            const dim = s.available ? '' : 'opacity:.35;cursor:not-allowed;'
            return '<button class="combat-btn" data-class-skill="'+s.id+'" '+(s.available?'':'disabled ')
              + 'style="font-size:.6rem;border-color:'+s.classColor+'88;color:'+s.classColor+';'+dim+'" '
              + 'title="'+s.sub+'">⚖ '+s.label+'</button>'
          }).join('')
        + '</div>'
      row.querySelectorAll('[data-class-skill]').forEach(btn => {
        btn.addEventListener('click', () => useClassSkillLocal(btn.dataset.classSkill))
      })
    }

    async function useClassSkillLocal(skillId) {
      const result = ClsCombat.onActiveSkill(skillId, player, statusEffects, enemy)
      if (!result.consumed) {
        log(result.messages.join(' '))
        renderClassSkills()
        return
      }
      // Post-activation side effects (mirror Ch2)
      if (statusEffects.cls_massDecree) {
        currentHp = maxPlayerHp
        statusEffects.cls_massDecree = false
      }
      if (skillId === 'conquest') {
        const dmg = (statusEffects.cls_dominionStacks || 10) * 5
        enemyHp = Math.max(0, enemyHp - dmg)
        log('👑 Conquest deals ' + dmg + ' damage.')
        syncBars()
      }
      if (skillId === 'last_engine') {
        currentHp = 1
      }
      if (skillId === 'final_eclipse') {
        const dmg = statusEffects.cls_finalEclipseDmg || 0
        if (dmg > 0) {
          enemyHp = Math.max(0, enemyHp - dmg)
          statusEffects.cls_finalEclipseDmg = 0
          log('☀☾ Final Eclipse deals ' + dmg + ' damage.')
          syncBars()
        }
      }
      // Bury the Hour restore (Unwritten t5b) — apply oldest snapshot
      if (statusEffects.cls_buryTheHourPending && Array.isArray(statusEffects.cls_rewindBuffer)
          && statusEffects.cls_rewindBuffer.length > 0) {
        const snap = statusEffects.cls_rewindBuffer.shift()
        currentHp = snap.currentHp
        enemyHp = snap.enemyHp
        maxPlayerHp = snap.maxPlayerHp
        maxEnemyHp = snap.maxEnemyHp
        const preservedBuffer = statusEffects.cls_rewindBuffer
        for (const k of Object.keys(statusEffects)) {
          if (k === 'cls_rewindBuffer' || k === 'cls_buryTheHourPending') continue
          delete statusEffects[k]
        }
        for (const k of Object.keys(snap.se)) {
          if (k === 'cls_rewindBuffer' || k === 'cls_buryTheHourPending') continue
          statusEffects[k] = snap.se[k]
        }
        statusEffects.cls_rewindBuffer = preservedBuffer
        statusEffects.cls_buryTheHourPending = false
        log('✎ The past replaces the present.')
        syncBars()
      }
      log(result.messages.join(' '))
      renderClassSkills()
      syncBars()
    }

    function setButtons(enabled) {
      ['btn-strike','btn-heavy','btn-defend','btn-items','btn-escape'].forEach(id => {
        const b = $(id)
        if (b) b.disabled = !enabled
      })
      // Also update skill buttons
      battleSkillKeys.forEach(k => {
        const b = $('btn-skill-'+k)
        if (b && enabled) {
          const cd = statusEffects.skillCooldowns[k] || 0
          b.disabled = cd > 0
        } else if (b) {
          b.disabled = true
        }
      })
    }

    // ── Skill use handler — scoped to this combat instance ───
    const useSkillLocal = function(key) {
      if (over) return
      const sk = BATTLE_SKILLS[key]
      if (!sk) return
      const cd = statusEffects.skillCooldowns[key] || 0
      if (cd > 0) { log('Skill on cooldown (' + cd + ' turns)'); return }
      doTurn('skill', key)
    }
    // Expose globally so inline onclick attrs can reach it, keyed by cid
    window['useSkill_' + cid] = useSkillLocal


    // ── Skill leveling system ───────────────────────────────
    // Tracks use-count for each skill: slow XP curve, max level 10.
    // Stored in player.skill_levels as { skillKey: { uses, level } }
    // Gains: every 10 uses grants +1 level, cost doubles each tier.
    // Required uses: lv1→2: 10, lv2→3: 25, lv3→4: 50, lv4→5: 90, lv5→6: 150,
    //               lv6→7: 240, lv7→8: 380, lv8→9: 590, lv9→10: 900 cumulative
    const SKILL_LVL_THRESHOLDS = [0,10,25,50,90,150,240,380,590,900]
    function getSkillLevel(key) {
      const sl = (player.skill_levels || {})[key]
      if (!sl) return 1
      let lv = 1
      for (let i = 1; i < SKILL_LVL_THRESHOLDS.length; i++) {
        if (sl.uses >= SKILL_LVL_THRESHOLDS[i]) lv = i + 1
        else break
      }
      return Math.min(10, lv)
    }
    function skillScale(key) {
      // Returns a multiplier 0.5–1.0 based on skill level (lv1=50%, lv10=100%)
      return 0.5 + (getSkillLevel(key) - 1) * (0.5 / 9)
    }
    async function recordSkillUse(key) {
      const sl  = player.skill_levels || {}
      if (!sl[key]) sl[key] = { uses: 0 }
      const prevLv = getSkillLevel(key)
      sl[key].uses++
      player.skill_levels = sl
      // Detect level-up
      const newLv = getSkillLevel(key)
      if (newLv > prevLv) {
        const sk = BATTLE_SKILLS[key]
        window.showToast('✦ ' + (sk?.label || key) + ' reached Lv ' + newLv + '!')
      }
      // Awaited save so failures surface in console
      const { error } = await supabase.from('players').update({ skill_levels: sl }).eq('id', player.id)
      if (error) console.error('[skill_levels save]', error.message)
    }

    async function doTurn(playerAction, skillKey = null) {
      if (over) return
      setButtons(false)
      defending = false
      const luckBonus  = Math.floor(eqLuck / 2)
      const unlocked   = player.skills_unlocked || []

      // ── Unwritten — Bury the Hour: snapshot state at turn start ──
      if (player.active_class === 'unwritten'
          && ClsCombat.hasSkill(player, 'unwritten_t5b')) {
        if (!Array.isArray(statusEffects.cls_rewindBuffer)) {
          statusEffects.cls_rewindBuffer = []
        }
        statusEffects.cls_rewindBuffer.push({
          currentHp,
          enemyHp,
          maxPlayerHp,
          maxEnemyHp,
          se: (function snapse() {
            const out = {}
            for (const k of Object.keys(statusEffects)) {
              if (k === 'cls_rewindBuffer') continue
              const v = statusEffects[k]
              if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
                out[k] = { ...v }
              } else if (Array.isArray(v)) {
                out[k] = [...v]
              } else {
                out[k] = v
              }
            }
            return out
          })(),
        })
        if (statusEffects.cls_rewindBuffer.length > 4) {
          statusEffects.cls_rewindBuffer.shift()
        }
      }

      // Tick down status effects
      if (statusEffects.enemyStunTurns > 0)  statusEffects.enemyStunTurns--
      if (statusEffects.rootTrapTurns  > 0)  statusEffects.rootTrapTurns--
      Object.keys(statusEffects.skillCooldowns).forEach(k => {
        if (statusEffects.skillCooldowns[k] > 0) statusEffects.skillCooldowns[k]--
      })

      // ── FF-Style Turn Order ───────────────────────────────────
      // Base speed comparison with jitter. Faster player goes first.
      // Ties broken randomly (spice!) unless one side has a speed-override skill.
      let pSPD = playerSPD() + (statusEffects.playerSPDBonus || 0)
      // Mourner's Pace (Hollow t2b): SPD doubles below 50% HP.
      if (player.active_class === 'hollow'
          && ClsCombat.hasSkill(player, 'hollow_t2b')
          && currentHp < maxPlayerHp * 0.5) {
        pSPD *= 2
      }
      // Slow (applied by enemyAI.js): halves SPD while active
      if (statusEffects.playerSlowTurns > 0) pSPD = Math.floor(pSPD / 2)
      // Terror (applied by enemyAI.js): skills are unusable while active.
      // If player tried to use a skill, fall back to a basic strike.
      if (statusEffects.playerTerrorTurns > 0 && playerAction === 'skill') {
        log('😱 You cannot focus enough to channel skills.')
        playerAction = 'strike'
        skillKey = null
      }
      const eSPD = enemySPD()

      // Skill-specific overrides
      const dashStrikeActive = (skillKey === 'wind_skill_dash_strike') // always first
      const razorTempoActive = statusEffects.razorTempo && playerAction === 'strike' // always first
      const heavySlowsPenalty = (playerAction === 'heavy') ? -3 : 0    // heavy is slower
      const defenseGoesFirst  = (playerAction === 'defend')             // defend always first

      // Effective speeds with jitter (±1–2) for variety
      const pEffSPD = pSPD + heavySlowsPenalty + Math.floor(Math.random() * 3)
      const eEffSPD = eSPD + Math.floor(Math.random() * 3)

      let playerFirst
      if (dashStrikeActive || defenseGoesFirst || razorTempoActive) {
        playerFirst = true  // speed override skills
      } else if (pEffSPD === eEffSPD) {
        playerFirst = Math.random() < 0.5  // dead tie → coin flip
      } else {
        playerFirst = pEffSPD > eEffSPD
      }

      // ── Dodge calculation ─────────────────────────────────────
      // Base dodge chance = 3% + (speed difference × 1.5%), capped 0–40%
      // Wind passive "Gust" adds flat 20% dodge
      function calcPlayerDodge() {
        const speedAdv = Math.max(0, pSPD - eSPD)
        const base = 0.03 + speedAdv * 0.015
        // Wind dodge: Lv1 +20%, Lv10 +35%
        const windLv = unlocked.includes('wind_passive_dodge') ? _skillLvGlobal('wind_passive_dodge') : 0
        const windBonus = windLv > 0 ? 0.20 + (windLv - 1) * (0.15 / 9) : 0
        return Math.min(0.55, base + windBonus)
      }
      function calcEnemyDodge() {
        const speedAdv = Math.max(0, eSPD - pSPD)
        return Math.min(0.25, 0.02 + speedAdv * 0.012)
      }

      let messages = []
      const turnLabel = playerFirst
        ? '⚡ You act first (SPD ' + pEffSPD + ' vs ' + eEffSPD + ')'
        : '⏳ ' + enemy.name + ' acts first (SPD ' + eEffSPD + ' vs ' + pEffSPD + ')'

      // ── Player action ─────────────────────────────────────
      function resolvePlayerAction() {
        // Enemy dodge check (applies to attack actions only)
        const enemyDodged = (playerAction === 'strike' || playerAction === 'heavy') && Math.random() < calcEnemyDodge()
        if (enemyDodged) {
          messages.push(enemy.name + ' <em>dodges</em> your attack!')
          return
        }

        if (playerAction === 'strike') {
          // Backstab passive: Lv1 15% chance 2× dmg → Lv10 35% chance 3× dmg
          const bsLv      = unlocked.includes('darkness_passive_backstab') ? _skillLvGlobal('darkness_passive_backstab') : 0
          const bsChance  = bsLv > 0 ? 0.15 + (bsLv - 1) * (0.20 / 9) : 0
          const bsMult    = bsLv > 0 ? 2 + (bsLv - 1) * (1 / 9) : 1
          const backstab  = bsLv > 0 && Math.random() < bsChance
          const roll       = window._forceMaxHit ? (6+luckBonus) : Math.floor(Math.random()*(6+luckBonus))+1
          window._forceMaxHit = false
          const baseATK    = playerATK() + (statusEffects.playerATKBonus||0)
          const ignoreDEF  = statusEffects.ignoreEnemyDEF
          statusEffects.ignoreEnemyDEF = false
          const flickerMult = statusEffects.flickerReady ? 2 : 1
          if (statusEffects.flickerReady) { statusEffects.flickerReady = false }

          // ── Class skill: pre-attack hook ──────────────────────────────
          // Equal Measure / Scales of Truth / Witness Stand / Crime Tally /
          // Executioner's Eye all modify damage or set up crit chance here.
          statusEffects._enginePlayerHpPct = currentHp / Math.max(1, maxPlayerHp)
          statusEffects._engineEnemyHpPct  = enemyHp  / Math.max(1, maxEnemyHp)
          const _clsAtk = ClsCombat.onPlayerAttack(player, statusEffects, enemy, baseATK + roll)
          for (const m of _clsAtk.messages) messages.push(m)
          // Defensive coercion — older class_combat versions may not return
          // every field, leaving them undefined. Anything undefined gets a
          // safe default so the strike math never produces NaN.
          const _dmgMult       = (typeof _clsAtk.dmgMult       === 'number') ? _clsAtk.dmgMult       : 1
          const _critChanceAdd = (typeof _clsAtk.critChanceAdd === 'number') ? _clsAtk.critChanceAdd : 0
          const _defIgnoreFrac = (typeof _clsAtk.defIgnoreFrac === 'number') ? _clsAtk.defIgnoreFrac : 0
          const _bonusFlatDmg  = (typeof _clsAtk.bonusFlatDmg  === 'number') ? _clsAtk.bonusFlatDmg  : 0

          let dmg = Math.max(1, Math.round((baseATK + roll) * (backstab ? bsMult : 1) * flickerMult * _dmgMult + _bonusFlatDmg))
          let wasCrit = false
          if (_critChanceAdd > 0 && Math.random() < _critChanceAdd) {
            wasCrit = true
            dmg = Math.round(dmg * 1.5)
            messages.push('⚖ Judgment Chain — critical strike.')
            if (_defIgnoreFrac > 0 && (enemy.def || 0) > 0) {
              const defBonus = Math.round((enemy.def || 0) * _defIgnoreFrac)
              dmg += defBonus
              messages.push(`⚖ Executioner's Eye — pierced ${defBonus} DEF.`)
            }
          }
          const oldEnemyHp = enemyHp
          enemyHp          = Math.max(0, enemyHp - dmg)
          messages.push(backstab
            ? '⚡ Backstab Lv' + bsLv + '! You strike for <strong>' + dmg + '</strong> (' + Math.round(bsMult*10)/10 + '× dmg)!'
            : 'You strike for <strong>' + dmg + '</strong>.' + (ignoreDEF ? ' (DEF ignored)' : ''))

          // ── Class skill: post-attack hook (deferred damage, hit counters) ─
          const _clsPost = ClsCombat.onPlayerAttackPost(player, statusEffects, enemy, dmg, wasCrit)
          for (const m of _clsPost.messages) messages.push(m)
          if (_clsPost.deferredDamage > 0 && enemyHp > 0) {
            enemyHp = Math.max(0, enemyHp - _clsPost.deferredDamage)
          }
          // Life-steal: apply healToPlayer
          if (_clsPost.healToPlayer > 0) {
            currentHp = Math.min(maxPlayerHp, currentHp + _clsPost.healToPlayer)
          }
          // ── Class skill: post-attack HP cost (Cataclysm) ──
          if (statusEffects.cls_cataclysmAfterEffect) {
            currentHp = 1
            statusEffects.cls_cataclysmAfterEffect = false
            messages.push('💥 Cataclysm consumed your blood. 1 HP remains.')
          }
          // Hollow drop-to-1 signals
          if (statusEffects.cls_endlessHollowDropToOne) {
            currentHp = 1
            statusEffects.cls_endlessHollowDropToOne = false
          }
          if (statusEffects.cls_survivorsEndDropToOne) {
            if (statusEffects.cls_survivorsEndHeal > 0) {
              currentHp = Math.min(maxPlayerHp, currentHp + statusEffects.cls_survivorsEndHeal)
              statusEffects.cls_survivorsEndHeal = 0
            }
            currentHp = 1
            statusEffects.cls_survivorsEndDropToOne = false
          }
          // Kernel Panic (Error t4c): deal current HP as damage, set HP to 1
          if (statusEffects.cls_kernelPanicReady) {
            const panicDmg = currentHp
            enemyHp = Math.max(0, enemyHp - panicDmg)
            currentHp = 1
            statusEffects.cls_kernelPanicReady = false
            messages.push('⚠ Kernel Panic dealt ' + panicDmg + '. You drop to 1 HP.')
          }
          // Bit Flip (Error t5b): swap player HP and enemy HP
          if (statusEffects.cls_bitFlipReady) {
            const t = currentHp
            currentHp = Math.min(maxPlayerHp, enemyHp)
            enemyHp   = Math.min(maxEnemyHp, t)
            statusEffects.cls_bitFlipReady = false
            messages.push('⚠ Bit Flip — HP values swapped.')
          }
          // Verdict Voided (Nullborn t6c): pulse damage on death-save
          if (statusEffects.cls_verdictVoidedDamage > 0) {
            const pulseDmg = statusEffects.cls_verdictVoidedDamage
            enemyHp = Math.max(0, enemyHp - pulseDmg)
            statusEffects.cls_verdictVoidedDamage = 0
            messages.push('✕ Null pulse strikes for ' + pulseDmg + '.')
          }
          // Cancel (Nullborn t4b): Null-reserve heal after surviving
          if (statusEffects.cls_cancelHeal > 0) {
            currentHp = Math.min(maxPlayerHp, currentHp + statusEffects.cls_cancelHeal)
            statusEffects.cls_cancelHeal = 0
          }
          // Recursion (Error t3b): pending second hit at 60%
          if (statusEffects.cls_recursionPending && enemyHp > 0) {
            const rdmg = Math.round(dmg * 0.6)
            enemyHp = Math.max(0, enemyHp - rdmg)
            statusEffects.cls_recursionPending = false
            messages.push('⚠ Recursion — second hit for ' + rdmg + '.')
          }
          // ── Class skill: HP-change hook (Verdict / Last Witness execute) ──
          if (enemyHp > 0) {
            const _clsHp = ClsCombat.onEnemyHpChange(player, statusEffects, enemy, oldEnemyHp, enemyHp, maxEnemyHp)
            for (const m of _clsHp.messages) messages.push(m)
            if (_clsHp.executeKill) enemyHp = 0
            // Fatal Exception (Error t6c): uncaught → player dies
            if (statusEffects.cls_fatalExceptionSelfKill) {
              currentHp = 0
              statusEffects.cls_fatalExceptionSelfKill = false
            }
          }
          // Burn passive: Lv1 3dmg × 2 turns → Lv10 6dmg × 4 turns
          if (unlocked.includes('fire_passive_burn')) {
            const burnLv  = _skillLvGlobal('fire_passive_burn')
            const burnDmg = Math.round(3 + (burnLv - 1) * (3 / 9))
            const burnDur = Math.round(2 + (burnLv - 1) * (2 / 9))
            statusEffects.burnTurns = burnDur
            statusEffects.burnDmg   = burnDmg
            messages.push('🔥 Burn Lv' + burnLv + ' applied — ' + burnDmg + ' dmg/turn × ' + burnDur + ' turns.')
          }
          // Chain passive: Lv1 20% chance 50% dmg → Lv10 40% chance 90% dmg
          if (unlocked.includes('lightning_passive_chain_damage')) {
            const chainLv     = _skillLvGlobal('lightning_passive_chain_damage')
            const chainChance = 0.20 + (chainLv - 1) * (0.20 / 9)
            const chainPct    = 0.50 + (chainLv - 1) * (0.40 / 9)
            if (Math.random() < chainChance) {
              const chainDmg = Math.max(1, Math.floor(dmg * chainPct))
              enemyHp = Math.max(0, enemyHp - chainDmg)
              messages.push('⚡ Chain Lv' + chainLv + ' hit for <strong>' + chainDmg + '</strong>!')
            }
          }
          // Venom Fang passive: 15% poison on strike
          if (statusEffects.venomFang && Math.random() < 0.15) {
            statusEffects.burnTurns = Math.max(statusEffects.burnTurns, 2)
            messages.push('☠ Venom Fang — poison applied! (3 dmg/turn × 2 turns)')
          }
          // Ricochet passive: 20% double hit
          if (statusEffects.ricochet && Math.random() < 0.20) {
            const bounceDmg = Math.max(1, Math.floor(dmg * 0.4))
            enemyHp = Math.max(0, enemyHp - bounceDmg)
            messages.push('🎯 Ricochet! Bounce hit for <strong>' + bounceDmg + '</strong>!')
          }
          // Flicker: post-dodge double damage flag (applied in dodge handler below)
          // Precise Strike: crit override
          if (statusEffects.nextCrit) {
            statusEffects.nextCrit = false
            const critBonus = Math.floor(dmg * 0.75)
            enemyHp = Math.max(0, enemyHp - critBonus)
            messages.push('🎯 Critical hit! +<strong>' + critBonus + '</strong> bonus damage!')
          }
          // Dread Pulse on-hit stack (passive version)
          if (statusEffects.dreadPulse && !statusEffects.dreadPulseStacks) {
            statusEffects.dreadPulseStacks = 0
          }
        } else if (playerAction === 'heavy') {
          const roll    = window._forceMaxHit ? (10+luckBonus) : Math.floor(Math.random()*(10+luckBonus))+3
          window._forceMaxHit = false
          const baseATK = playerATK() + (statusEffects.playerATKBonus||0)
          const dmg     = Math.max(1, Math.round(baseATK * 1.6) + roll)
          enemyHp       = Math.max(0, enemyHp - dmg)
          messages.push('Heavy strike for <strong>' + dmg + '</strong>!')
          // Venom Lance: apply poison after Heavy Strike
          if (statusEffects.venomLanceTurns > 0) {
            messages.push('☠ Venom Lance — venom coats the wound!')
          }
        } else if (playerAction === 'defend') {
          defending = true
          messages.push('You brace — defense doubled this turn.')
          // Absorption: heal 15 HP if charged
          if (statusEffects.absorptionHeal) {
            const healAmt = statusEffects.absorptionHeal
            currentHp = Math.min(maxPlayerHp, currentHp + healAmt)
            statusEffects.absorptionHeal = 0
            messages.push('🛡 Absorption — healed <strong>' + healAmt + '</strong> HP!')
          }
          // ── Bastion Bulwark on Defend (t1a) ─────────────────────────
          if (player.active_class === 'bastion') {
            statusEffects.cls_lastActionDefend = true
            const cap = statusEffects.cls_bulwarkCap || 10
            statusEffects.cls_bulwarkStacks = Math.min(cap, (statusEffects.cls_bulwarkStacks || 0) + 1)
            messages.push('🛡 Bulwark — ' + statusEffects.cls_bulwarkStacks + ' stacks.')
            // Riposte (t1b)
            if (ClsCombat.hasSkill(player, 'bastion_t1b')) {
              const def = (player.def||2)+(statusEffects.playerDEFBonus||0)
              const ripDmg = Math.max(1, Math.round(def * 0.5))
              enemyHp = Math.max(0, enemyHp - ripDmg)
              messages.push('🛡 Riposte deals ' + ripDmg + '.')
            }
            // Unmoving (t4c)
            if (ClsCombat.hasSkill(player, 'bastion_t4c')) {
              const debuffFields = ['burnTurns','poisonTurns','cls_bleedingTurns','cls_rotTurns','cls_silenceTurns']
              for (const k of debuffFields) {
                if ((statusEffects[k]||0) > 0) {
                  statusEffects[k] = 0
                  messages.push('🛡 Unmoving — debuff cleansed.')
                  break
                }
              }
            }
          }
          // ── Dawnbringer Vigil's Stand on Defend (t4c) ───────────────
          if (player.active_class === 'dawnbringer'
              && ClsCombat.hasSkill(player, 'dawnbringer_t4c')) {
            const heal = Math.round(maxPlayerHp * 0.10)
            currentHp = Math.min(maxPlayerHp, currentHp + heal)
            statusEffects.cls_sunStacks = Math.min(10, (statusEffects.cls_sunStacks || 0) + 2)
            messages.push("☀ Vigil's Stand — +" + heal + " HP, +2 Sun.")
          }
          // ── Oathbreaker Patience of Stone on Defend (t3b, Wall oath) ──
          if (player.active_class === 'oathbreaker'
              && statusEffects.cls_currentOath === 'wall'
              && ClsCombat.hasSkill(player, 'oathbreaker_t3b')) {
            const cur = statusEffects.cls_patienceOfStoneBonus || 0
            if (cur < 50) {
              statusEffects.cls_patienceOfStoneBonus = cur + 1
              const baseATK = (player.atk||5)
              statusEffects.playerATKBonus = (statusEffects.playerATKBonus||0) + Math.round(baseATK * 0.01)
              messages.push("⚔ Patience of Stone — +1% damage permanent (" + (cur+1) + "%).")
            }
          }
        } else if (playerAction === 'skill' && skillKey) {
          const sk = BATTLE_SKILLS[skillKey]
          if (!sk) return
          statusEffects.skillCooldowns[skillKey] = sk.type === 'ultimate' ? 4 : 2
          recordSkillUse(skillKey)
          const sc = skillScale(skillKey)
          const skLv = getSkillLevel(skillKey)
          if (skLv < 10) messages.push('Skill Lv ' + skLv + ' — power ' + Math.round(sc*100) + '%')

          if (sk.fn === 'shadowStep') {
            statusEffects.ignoreEnemyDEF = true
            messages.push('🌑 Shadow Step Lv' + skLv + ' — next attack ignores DEF!')
          } else if (sk.fn === 'rockArmor') {
            const defBonus = Math.round(20 * sc)
            statusEffects.playerDEFBonus = (statusEffects.playerDEFBonus||0) + defBonus
            statusEffects.rockArmorTurns = 2
            messages.push('🪨 Rock Armor Lv' + skLv + ' — +' + defBonus + ' DEF for 2 turns!')
          } else if (sk.fn === 'earthquake') {
            const dmg = Math.max(5, Math.round(playerATK() * 2 * sc))
            enemyHp   = Math.max(0, enemyHp - dmg)
            statusEffects.enemyStunTurns = 1
            messages.push('🌍 Earthquake Lv' + skLv + '! <strong>' + dmg + '</strong> dmg — stunned!')
          } else if (sk.fn === 'fireBlast') {
            const def = Math.floor((enemy.def||0) * 0.5)
            const dmg = Math.max(1, Math.round((25 * sc + playerATK()) - def))
            enemyHp   = Math.max(0, enemyHp - dmg)
            messages.push('🔥 Fire Blast Lv' + skLv + ' — <strong>' + dmg + '</strong> (50% DEF ignored)!')
          } else if (sk.fn === 'infernoZone') {
            statusEffects.infernoTurns = 3
            statusEffects.infernoDmg   = Math.round(40 * sc)
            messages.push('🔥 Inferno Zone Lv' + skLv + ' — ' + statusEffects.infernoDmg + ' dmg/turn × 3 turns!')
          } else if (sk.fn === 'healPulse') {
            const base = Math.round(25 * sc)
            const heal = Math.min(player.max_hp||100, currentHp + base) - currentHp
            currentHp  = Math.min(player.max_hp||100, currentHp + base)
            messages.push('✨ Heal Pulse Lv' + skLv + ' — restored <strong>' + heal + '</strong> HP!')
          } else if (sk.fn === 'divineBarrier') {
            statusEffects.invulnerable = true
            statusEffects.divineBarrierReflect = true
            messages.push('✨ Divine Barrier Lv' + skLv + ' — invulnerable this turn! Damage reflected.')
          } else if (sk.fn === 'lightningStrike') {
            const dmg = Math.round((30 + playerATK() * 0.5) * sc)
            enemyHp   = Math.max(0, enemyHp - dmg)
            messages.push('⚡ Lightning Strike Lv' + skLv + ' — <strong>' + dmg + '</strong> (ignores shields)!')
          } else if (sk.fn === 'thunderstorm') {
            let total = 0
            const boltBase = Math.round(10 * sc)
            for (let b = 0; b < 5; b++) {
              const bolt = boltBase + Math.floor(Math.random() * Math.round(10 * sc))
              total += bolt; enemyHp = Math.max(0, enemyHp - bolt)
            }
            messages.push('⚡ Thunderstorm Lv' + skLv + ' — 5 bolts, <strong>' + total + '</strong> total!')
          } else if (sk.fn === 'bladeForm') {
            const atkBon = Math.round(20 * sc), spdBon = Math.round(5 * sc)
            statusEffects.playerATKBonus = (statusEffects.playerATKBonus||0) + atkBon
            statusEffects.playerSPDBonus = (statusEffects.playerSPDBonus||0) + spdBon
            statusEffects.bladeFormTurns = 2
            messages.push('⚙ Blade Form Lv' + skLv + ' — ATK +' + atkBon + ', SPD +' + spdBon + ' (2 turns)!')
          } else if (sk.fn === 'ironDomain') {
            const atkBon = Math.round(playerATK() * sc)
            statusEffects.playerATKBonus = (statusEffects.playerATKBonus||0) + atkBon
            statusEffects.ironDomainTurns = 3
            messages.push('⚙ Iron Domain Lv' + skLv + ' — ATK +' + atkBon + ' for 3 turns!')
          } else if (sk.fn === 'rootTrap') {
            statusEffects.rootTrapTurns = 1
            messages.push('🌿 Root Trap Lv' + skLv + ' — enemy rooted, skips next attack!')
          } else if (sk.fn === 'overgrowth') {
            const healAmt = Math.round(40 * sc), dmg = Math.round(30 * sc)
            const heal = Math.min(player.max_hp||100, currentHp + healAmt) - currentHp
            currentHp  = Math.min(player.max_hp||100, currentHp + healAmt)
            enemyHp    = Math.max(0, enemyHp - dmg)
            messages.push('🌿 Overgrowth Lv' + skLv + ' — +' + heal + ' HP & <strong>' + dmg + '</strong> dmg!')
          } else if (sk.fn === 'waterShield') {
            const shAmt = Math.round(30 * sc)
            statusEffects.waterShield = (statusEffects.waterShield||0) + shAmt
            messages.push('💧 Water Shield Lv' + skLv + ' — absorbs up to ' + shAmt + ' damage!')
          } else if (sk.fn === 'tsunami') {
            const dmg = Math.round((50 + playerATK() * 0.4) * sc)
            enemyHp   = Math.max(0, enemyHp - dmg)
            statusEffects.enemyStunTurns = 1
            messages.push('🌊 Tsunami Lv' + skLv + ' — <strong>' + dmg + '</strong> dmg, enemy stunned!')
          } else if (sk.fn === 'dashStrike') {
            const dmg = Math.max(1, Math.round((playerATK() * 2 + Math.floor(Math.random()*8)) * sc))
            enemyHp   = Math.max(0, enemyHp - dmg)
            const spdBon = Math.round(10 * sc)
            statusEffects.playerSPDBonus = (statusEffects.playerSPDBonus||0) + spdBon
            messages.push('💨 Dash Strike Lv' + skLv + ' — <strong>' + dmg + '</strong>, SPD +' + spdBon + '!')
          } else if (sk.fn === 'tornadoField') {
            const reduct = 1 - Math.round(sc * 30) / 100
            statusEffects.enemyATKMult  = Math.min(statusEffects.enemyATKMult||1.0, reduct)
            statusEffects.playerSPDBonus = (statusEffects.playerSPDBonus||0) + pSPD
            statusEffects.tornadoTurns   = 3
            messages.push('💨 Tornado Field Lv' + skLv + ' — enemy ATK -' + Math.round(sc*30) + '%, SPD doubled!')
          } else if (sk.fn === 'voidZone') {
            const reduct = 1 - Math.round(sc * 30) / 100
            statusEffects.enemyATKMult  = Math.min(statusEffects.enemyATKMult||1.0, reduct)
            statusEffects.voidZoneTurns = 3
            messages.push('🌑 Void Zone Lv' + skLv + ' — enemy ATK -' + Math.round(sc*30) + '% for 3 turns!')

          // ── NOTABLE SKILL EFFECTS ─────────────────────────────
          } else if (sk.fn === 'warbound') {
            const bonus = Math.round(playerATK() * 0.15 * sc)
            statusEffects.playerATKBonus = (statusEffects.playerATKBonus||0) + bonus
            statusEffects.warboundTurns  = 1
            messages.push('⚔ Warbound — +' + bonus + ' ATK this turn!')

          } else if (sk.fn === 'embersEnd') {
            const mult = enemyHp / maxEnemyHp < 0.30 ? 1.25 : 1.0
            const dmg  = Math.max(1, Math.round(playerATK() * mult * sc))
            enemyHp    = Math.max(0, enemyHp - dmg)
            messages.push("🔥 Ember's End — " + dmg + ' damage' + (mult > 1 ? ' (+25% finishing blow)!' : '!'))

          } else if (sk.fn === 'venomLance') {
            statusEffects.venomLanceTurns = 3
            statusEffects.venomLanceDmg   = Math.round(5 * sc)
            messages.push('☠ Venom Lance — Heavy Strike venom: ' + statusEffects.venomLanceDmg + ' dmg/turn × 3 turns!')

          } else if (sk.fn === 'predator') {
            const bonus = Math.round(20 * sc)
            statusEffects.playerATKBonus  = (statusEffects.playerATKBonus||0) + bonus
            statusEffects.predatorTurns   = 2
            messages.push('🐺 Predator — +' + bonus + ' ATK for 2 turns!')

          } else if (sk.fn === 'pressureWave') {
            const lowHp = currentHp / maxPlayerHp < 0.30
            const defBonus = lowHp ? 20 : 0
            const dmgBonus = lowHp ? 15 : 0
            if (lowHp) {
              statusEffects.playerDEFBonus = (statusEffects.playerDEFBonus||0) + defBonus
              enemyHp = Math.max(0, enemyHp - dmgBonus)
              messages.push('🌊 Pressure Wave — below 30% HP: +' + defBonus + ' DEF & ' + dmgBonus + ' damage!')
            } else {
              messages.push('🌊 Pressure Wave — full power needs low HP (>30% remaining).')
            }

          } else if (sk.fn === 'chargedStance') {
            statusEffects.chargedStance = true
            messages.push('⚡ Charged Stance — DEF doubled next turn if you take 2 hits!')

          } else if (sk.fn === 'heavyGround') {
            statusEffects.enemySPDReduction = (statusEffects.enemySPDReduction||0) + 6
            messages.push('🪨 Heavy Ground — enemy SPD -6 for this battle!')

          } else if (sk.fn === 'earthSpike') {
            const dmg = Math.round((20 + playerATK() * 0.3) * sc)
            enemyHp   = Math.max(0, enemyHp - dmg)
            messages.push('🪨 Earth Spike — ' + dmg + ' damage (ignores 30% DEF)!')

          } else if (sk.fn === 'foresight') {
            statusEffects.foresight = true
            messages.push('🔮 Foresight — next incoming attack reduced by 90%!')

          } else if (sk.fn === 'preciseStrike') {
            statusEffects.nextCrit = true
            messages.push('🎯 Precise Strike — next attack will critical hit (×1.75)!')

          } else if (sk.fn === 'nightshroud') {
            statusEffects.nightshroud = true
            messages.push('🌑 Nightshroud — free dodge active! Counter on dodge.')

          } else if (sk.fn === 'thornwall') {
            statusEffects.thornwall = true
            messages.push('🌿 Thornwall — next Defend reflects 15% damage as thorns!')

          } else if (sk.fn === 'dreadPulse') {
            const stacks = Math.min(3, (statusEffects.dreadPulseStacks||0) + 1)
            statusEffects.dreadPulseStacks = stacks
            statusEffects.enemyATKMult = Math.max(0.1, (statusEffects.enemyATKMult||1.0) - 0.08)
            messages.push('💀 Dread Pulse — enemy ATK -' + (stacks * 8) + '% total (' + stacks + ' stacks)!')

          } else if (sk.fn === 'bloodthirst') {
            // On-use: restore 20% max HP, gain ATK bonus
            const heal = Math.round(maxPlayerHp * 0.2 * sc)
            currentHp = Math.min(maxPlayerHp, currentHp + heal)
            statusEffects.playerATKBonus = (statusEffects.playerATKBonus||0) + Math.round(10 * sc)
            statusEffects.bloodthirstTurns = 2
            messages.push('🩸 Bloodthirst — +'+ heal +' HP restored, +' + Math.round(10*sc) + ' ATK for 2 turns!')

          } else if (sk.fn === 'spellSurge') {
            statusEffects.spellSurge = true
            messages.push('✨ Spell Surge — next skill hits ×1.5 and ignores 50% DEF!')

          } else if (sk.fn === 'deepCurrent') {
            const defBonus = Math.round(30 * sc)
            statusEffects.playerDEFBonus = (statusEffects.playerDEFBonus||0) + defBonus
            statusEffects.deepCurrentTurns = 2
            statusEffects.absorbNextHit = true
            messages.push('🌊 Deep Current — +' + defBonus + ' DEF for 2 turns, next hit absorbed!')

          } else if (sk.fn === 'ironMirror') {
            statusEffects.ironMirror = true
            statusEffects.playerDEFBonus = (statusEffects.playerDEFBonus||0) + 15
            messages.push('🛡 Iron Mirror — reflect 40% next hit + +15 DEF!')

          } else if (sk.fn === 'phantomStep') {
            statusEffects.phantomStep = true
            statusEffects.nextCrit = true
            messages.push('👻 Phantom Step — untargetable 1 turn, next hit crits!')

          } else if (sk.fn === 'timeLock') {
            statusEffects.enemyStunTurns = (statusEffects.enemyStunTurns||0) + 1
            statusEffects.timeLockCrit = true
            messages.push('⏱ Time Lock — enemy frozen 1 turn, next attack ×2 damage!')

          } else if (sk.fn === 'sixthSense') {
            statusEffects.sixthSense = true
            messages.push('🔮 Sixth Sense — reading enemy pattern. 80% damage reduction if correct!')

          } else if (sk.fn === 'chaosEngine') {
            const chaos = Math.floor(Math.random() * 5)
            if (chaos === 0) {
              const dmg = Math.round(playerATK() * 2 * sc)
              enemyHp = Math.max(0, enemyHp - dmg)
              messages.push('🌀 Chaos Engine — CHAOS STRIKE: ' + dmg + ' dmg!')
            } else if (chaos === 1) {
              const heal = Math.round(maxPlayerHp * 0.3 * sc)
              currentHp = Math.min(maxPlayerHp, currentHp + heal)
              messages.push('🌀 Chaos Engine — CHAOS HEAL: +' + heal + ' HP!')
            } else if (chaos === 2) {
              statusEffects.playerATKBonus = (statusEffects.playerATKBonus||0) + Math.round(25 * sc)
              messages.push('🌀 Chaos Engine — CHAOS SURGE: +' + Math.round(25*sc) + ' ATK!')
            } else if (chaos === 3) {
              statusEffects.enemyStunTurns = (statusEffects.enemyStunTurns||0) + 2
              messages.push('🌀 Chaos Engine — CHAOS FREEZE: enemy stunned 2 turns!')
            } else {
              statusEffects.invulnerable = true
              messages.push('🌀 Chaos Engine — CHAOS SHIELD: invulnerable 1 turn!')
            }

          } else if (sk.fn === 'reaperForm') {
            // Mirrors Ch2 implementation: persistent +50% ATK plus a
            // one-shot ignore-DEF on the next attack. Both engines reset
            // ignoreEnemyDEF after one attack, so the "rest of fight"
            // wording only applies to the ATK boost; the DEF-ignore is
            // a single-attack window.
            const atkBoost = Math.round(playerATK() * 0.5 * sc)
            statusEffects.playerATKBonus = (statusEffects.playerATKBonus || 0) + atkBoost
            statusEffects.ignoreEnemyDEF = true
            messages.push('☠ Reaper Form — ATK +' + atkBoost + ', next attack ignores DEF!')
          }
        }
      }

      // ── Enemy action ──────────────────────────────────────
      function resolveEnemyAction() {
        if (enemyHp <= 0) return
        // Stun / root check
        if (statusEffects.enemyStunTurns > 0 || statusEffects.rootTrapTurns > 0) {
          messages.push(enemy.name + ' is stunned — cannot attack!')
          return
        }
        if (statusEffects.invulnerable) {
          const reflectDmg = Math.floor(enemy.atk * 0.5)
          enemyHp          = Math.max(0, enemyHp - reflectDmg)
          statusEffects.invulnerable = false
          messages.push('✨ Divine Barrier absorbs! Reflected ' + reflectDmg + ' back.')
          return
        }
        // Player dodge check — includes Nightshroud first-turn, Ghost Step, Umbral Veil
        let dodgeChance = calcPlayerDodge()
        if (statusEffects.ghostStep  || statusEffects.umbralVeil) dodgeChance = Math.max(dodgeChance, 0.15)
        if (statusEffects.nightshroud) { dodgeChance = 1.0; statusEffects.nightshroud = false }

        if (Math.random() < dodgeChance) {
          messages.push('You <em>dodge</em> the attack!')
          // Flicker: next strike doubles
          if (statusEffects.flicker) { statusEffects.flickerReady = true }
          // Ghost Step / Umbral Veil: counter on dodge
          if (statusEffects.ghostStep || statusEffects.umbralVeil) {
            const counterDmg = Math.max(1, Math.floor(playerATK() * 0.5))
            enemyHp = Math.max(0, enemyHp - counterDmg)
            messages.push('↩ Counter hit for <strong>' + counterDmg + '</strong>!')
          }
          // Increment consecutive-hit counter on dodge (reset it)
          statusEffects.consecutiveHits = 0
          return
        }
        // Foresight active: reduce damage 90%
        let foresightMult = 1.0
        if (statusEffects.foresight) { foresightMult = 0.10; statusEffects.foresight = false; messages.push('🔮 Foresight absorbs the blow!') }
        // Endurig Root: immune to stun
        if (statusEffects.enduringRoot) { statusEffects.enemyStunTurns = 0; statusEffects.rootTrapTurns = 0 }
        const defMult  = defending ? 0.25 : 1
        const eATKMult = (statusEffects.enemyATKMult || 1.0) * (foresightMult || 1.0)
        // Apply enemy SPD reduction from heavyGround
        const eSPDReduced = (statusEffects.enemySPDReduction || 0)
        const totalDEF = playerDEF() + (statusEffects.playerDEFBonus||0)
        let eDmg       = Math.max(0, Math.round((enemy.atk * eATKMult + Math.floor(Math.random()*4) - totalDEF) * defMult))

        // Water shield absorbs
        if (statusEffects.waterShield > 0 && eDmg > 0) {
          const absorbed = Math.min(statusEffects.waterShield, eDmg)
          eDmg -= absorbed
          statusEffects.waterShield -= absorbed
          if (absorbed > 0) messages.push('💧 Water Shield absorbs ' + absorbed + ' damage.')
        }

        // ── Class skill: player-hit hook ───────────────────────────────────
        if (eDmg > 0) {
          statusEffects._enginePlayerHpPct = currentHp / Math.max(1, maxPlayerHp)
          statusEffects._engineEnemyHpPct  = enemyHp  / Math.max(1, maxEnemyHp)
          const _clsHit = ClsCombat.onPlayerHit(player, statusEffects, enemy, eDmg, maxPlayerHp)
          for (const m of _clsHit.messages) messages.push(m)
          eDmg = Math.round(eDmg * (_clsHit.dmgMult || 1))
          if (_clsHit.reflectAmount > 0) enemyHp = Math.max(0, enemyHp - _clsHit.reflectAmount)
        }

        // ── Class skill: HP-clamp guards (Monarch Throne / Loyal Guard) ──
        let _newHp = Math.max(0, currentHp - eDmg)
        if (statusEffects.cls_throneTurns > 0 && _newHp < 1) {
          _newHp = 1
          messages.push('👑 The Throne — you stand.')
        } else if (statusEffects.cls_loyalGuardSavedHp && _newHp <= 0) {
          _newHp = 1
          statusEffects.cls_loyalGuardSavedHp = 0
        }
        currentHp = _newHp

        // Metal reflect passive: Lv1 10% → Lv10 28% reflected
        if (statusEffects.metalReflect && eDmg > 0) {
          const refLv  = _skillLvGlobal('metal_passive_reflect')
          const refPct = 0.10 + (refLv - 1) * (0.18 / 9)
          const refDmg = Math.max(1, Math.floor(eDmg * refPct))
          enemyHp      = Math.max(0, enemyHp - refDmg)
          messages.push('⚙ Metal Reflect Lv' + refLv + ' — ' + refDmg + ' damage reflected!')
        }
        // Thornwall: reflect 15% of Defend absorption
        if (statusEffects.thornwall && defending && eDmg > 0) {
          const thornDmg = Math.max(1, Math.floor(eDmg * 0.15))
          enemyHp = Math.max(0, enemyHp - thornDmg)
          statusEffects.thornwall = false
          messages.push('🌿 Thornwall — ' + thornDmg + ' thorn damage reflected!')
        }
        // Live Wire: 20% stun on being hit
        if (statusEffects.liveWire && eDmg > 0 && Math.random() < 0.20) {
          statusEffects.enemyStunTurns = 1
          messages.push('⚡ Live Wire — shock! Enemy stunned next turn.')
        }
        // Tidal Resolve: first time below 50% HP, gain +20 DEF for 2 turns
        if (statusEffects.tidalResolve && !statusEffects.tidalResolveFired &&
            currentHp / maxPlayerHp < 0.50 && eDmg > 0) {
          statusEffects.tidalResolveFired = true
          statusEffects.playerDEFBonus = (statusEffects.playerDEFBonus||0) + 20
          statusEffects.rockArmorTurns = (statusEffects.rockArmorTurns||0) + 2
          messages.push('🌊 Tidal Resolve — below 50% HP: +20 DEF for 2 turns!')
        }
        // Absorption: hit counter — every 3 hits, next Defend heals 15
        if (statusEffects.absorption && eDmg > 0) {
          statusEffects.absorptionCount = (statusEffects.absorptionCount||0) + 1
          if (statusEffects.absorptionCount >= 3) {
            statusEffects.absorptionCount = 0
            statusEffects.absorptionHeal  = 15
            messages.push('🛡 Absorption charged — next Defend heals 15 HP!')
          }
        }
        // Arc Reflex: 3 consecutive hits → auto counter
        if (statusEffects.arcReflex && eDmg > 0) {
          statusEffects.consecutiveHits = (statusEffects.consecutiveHits||0) + 1
          if (statusEffects.consecutiveHits >= 3) {
            statusEffects.consecutiveHits = 0
            const arcDmg = Math.max(1, Math.floor(playerATK() * 0.5))
            enemyHp = Math.max(0, enemyHp - arcDmg)
            messages.push('⚡ Arc Reflex — counter strike for <strong>' + arcDmg + '</strong>!')
          }
        }
        // Tremor Step: 20% chance to stagger enemy (they skip attack next turn)
        if (statusEffects.tremorStep && Math.random() < 0.20) {
          statusEffects.enemyStunTurns = 1
          messages.push('🌍 Tremor Step — ground shakes! Enemy staggered.')
        }

        if (defending && eDmg === 0) {
          messages.push(enemy.name + ' attacks — completely blocked!')
        } else if (defending) {
          messages.push(enemy.name + ' attacks for <strong>' + eDmg + '</strong> (reduced by defense).')
        } else {
          messages.push(enemy.name + ' retaliates for <strong>' + eDmg + '</strong>.')
        }
      }

      // Player stun gate (applied by enemyAI.js): if stunned, skip player
      // action this turn. Enemy still gets to act. The tick happens later.
      const playerStunned = (statusEffects.playerStunTurns||0) > 0
      if (playerStunned) {
        log('⚡ You are stunned and cannot act.')
        if (currentHp > 0) resolveEnemyAction()
      } else if (playerFirst) {
        resolvePlayerAction()
        resolveEnemyAction()
      } else {
        resolveEnemyAction()
        resolvePlayerAction()
      }

      // Quickstep (Ghostblade t3a): every 3rd basic strike grants a free
      // chained strike. Flag is set in onPlayerAttackPost. Skip if stunned.
      if (!playerStunned && statusEffects.cls_quickstepFreeStrike && enemyHp > 0 && currentHp > 0
          && playerAction === 'strike') {
        statusEffects.cls_quickstepFreeStrike = false
        resolvePlayerAction()
      }

      // ── DoT & ongoing effects ─────────────────────────────
      if (statusEffects.burnTurns > 0 && enemyHp > 0) {
        const bd = statusEffects.burnDmg || 3
        enemyHp = Math.max(0, enemyHp - bd)
        statusEffects.burnTurns--
        messages.push('🔥 Burn: ' + bd + ' dmg. (' + statusEffects.burnTurns + ' left)')
      }
      if (statusEffects.infernoTurns > 0 && enemyHp > 0) {
        const iDmg = statusEffects.infernoDmg || 40
        enemyHp = Math.max(0, enemyHp - iDmg)
        statusEffects.infernoTurns--
        messages.push('🔥 Inferno: ' + iDmg + ' dmg! (' + statusEffects.infernoTurns + ' left)')
      }
      if (statusEffects.regenTurns > 0 && currentHp > 0) {
        const regenLv  = _skillLvGlobal('water_passive_regen')
        const regenAmt = Math.round(5 + (regenLv - 1))
        const heal = Math.min(player.max_hp||100, currentHp + regenAmt) - currentHp
        currentHp += heal
        if (heal > 0) messages.push('💧 Flow Lv' + regenLv + ': +' + heal + ' HP regen.')
      }
      // Player-side status DoTs and counter decrements. Mirrors Ch2.
      if (statusEffects.playerBleedTurns > 0) {
        const bd = statusEffects.playerBleedDmg || 3
        currentHp = Math.max(0, currentHp - bd)
        statusEffects.playerBleedTurns--
        messages.push('🩸 Bleed: ' + bd + ' dmg. (' + statusEffects.playerBleedTurns + ' left)')
        if (statusEffects.playerBleedTurns === 0) statusEffects.playerBleedDmg = 0
      }
      if (statusEffects.playerPoisonTurns > 0) {
        const pd = statusEffects.playerPoisonDmg || 3
        currentHp = Math.max(0, currentHp - pd)
        statusEffects.playerPoisonTurns--
        messages.push('☠ Poison: ' + pd + ' dmg. (' + statusEffects.playerPoisonTurns + ' left)')
        if (statusEffects.playerPoisonTurns === 0) statusEffects.playerPoisonDmg = 0
      }
      if (statusEffects.playerSlowTurns > 0) {
        statusEffects.playerSlowTurns--
        if (statusEffects.playerSlowTurns === 0) messages.push('🌀 Slow fades.')
      }
      if (statusEffects.playerDefShredTurns > 0) {
        statusEffects.playerDefShredTurns--
        if (statusEffects.playerDefShredTurns === 0) {
          statusEffects.playerDefShredAmt = 0
          messages.push('🔓 Armour Shred fades.')
        }
      }
      if (statusEffects.playerTerrorTurns > 0) {
        statusEffects.playerTerrorTurns--
        if (statusEffects.playerTerrorTurns === 0) messages.push('😱 Terror fades.')
      }
      if (statusEffects.playerStunTurns > 0) {
        statusEffects.playerStunTurns--
        if (statusEffects.playerStunTurns === 0) messages.push('⚡ Stun fades.')
      }
      // Tick temp buffs
      if (statusEffects.rockArmorTurns > 0) {
        statusEffects.rockArmorTurns--
        if (statusEffects.rockArmorTurns === 0) { statusEffects.playerDEFBonus = Math.max(0, (statusEffects.playerDEFBonus||0)-20); messages.push('🪨 Rock Armor faded.') }
      }
      if (statusEffects.bladeFormTurns > 0) {
        statusEffects.bladeFormTurns--
        if (statusEffects.bladeFormTurns === 0) { statusEffects.playerATKBonus=Math.max(0,(statusEffects.playerATKBonus||0)-20); statusEffects.playerSPDBonus=Math.max(0,(statusEffects.playerSPDBonus||0)-5); messages.push('⚙ Blade Form faded.') }
      }
      if (statusEffects.voidZoneTurns > 0) { statusEffects.voidZoneTurns--; if(statusEffects.voidZoneTurns===0){statusEffects.enemyATKMult=1.0; messages.push('🌑 Void Zone faded.')} }
      if (statusEffects.tornadoTurns  > 0) { statusEffects.tornadoTurns--;  if(statusEffects.tornadoTurns===0){statusEffects.enemyATKMult=1.0; messages.push('💨 Tornado Field faded.')} }

      // ── Ally attacks (team mode or generic ally) ────────────────────────
      // Same logic as the original Yara hardcoded fight, but the messages
      // now use yara.name so generic allies display correctly. We also
      // gate retaliation on enemyHp > 0 AFTER the swing (dead enemies don't
      // counter-attack). Existing Yara fight unaffected since Yara is named.
      if (yara && yara.alive && enemyHp > 0) {
        const aName = yara.name || 'Yara'
        const yaraDmg = Math.max(1, yara.atk + Math.floor(Math.random()*4))
        enemyHp = Math.max(0, enemyHp - yaraDmg)
        if (enemyHp > 0 && Math.random() < 0.4) {
          const yaraHit = Math.max(0, Math.floor(enemy.atk * 0.5) - yara.def)
          yara.hp = Math.max(0, yara.hp - yaraHit)
          if (yara.hp <= 0) {
            yara.alive = false
            statusEffects.ally_died = true  // one-shot flag for narrative
            messages.push(aName + ' strikes for ' + yaraDmg + ' — then takes ' + yaraHit + ' and falls!')
          } else {
            messages.push(aName + ' strikes for ' + yaraDmg + ' (takes ' + yaraHit + ' retaliation, ' + yara.hp + ' HP left).')
          }
        } else {
          messages.push(aName + ' strikes for ' + yaraDmg + '.')
        }
      }

      // ── Dorian lurks — backstabs every 2 turns ──────────────────
      if (dorianLurking && enemyHp > 0 && currentHp > 0) {
        dorianLurkTurn++
        if (dorianLurkTurn % 2 === 0) {
          // Even turn: backstab — ignores all DEF
          const dorianDmg = Math.max(2, 11 + Math.floor(Math.random() * 6))
          currentHp = Math.max(0, currentHp - dorianDmg)
          messages.push('🔴 <strong>DORIAN BACKSTABS from the shadows — ' + dorianDmg + ' damage!</strong> He was never going to hold the deal.')
        } else {
          // Odd turn: repositioning taunt
          const taunts = [
            '🔴 Dorian shifts in the dark. <em>"Force of habit,"</em> he mutters.',
            '🔴 You hear movement behind you. Dorian is repositioning.',
            '🔴 <em>"Every person I betrayed, I told myself it was the game."</em> Dorian watches from the shadows.',
            '🔴 A shadow peels away from the wall. Dorian is circling.',
          ]
          messages.push(taunts[Math.floor(Math.random() * taunts.length)])
        }
      }

      // ── Void Sentinel AoE — hits BOTH player AND Dorian every 4 turns ──
      // Only triggers in the garage_b4_sentinel_fight when Dorian is lurking.
      if (sentinelAoe && dorianLurking && enemyHp > 0 && dorianLurkHp > 0) {
        const turnNum = dorianLurkTurn  // reuse the same counter
        if (turnNum > 0 && turnNum % 4 === 0) {
          // AoE pulse — hits player for moderate dmg (partially mitigated), Dorian for more
          const aoePlyDmg = Math.max(1, Math.round(enemy.atk * 0.55) - Math.floor((calcDEF() + (statusEffects.playerDEFBonus||0)) * 0.4))
          const aoeDorDmg = Math.max(3, Math.round(enemy.atk * 0.8))
          currentHp    = Math.max(0, currentHp    - aoePlyDmg)
          dorianLurkHp = Math.max(0, dorianLurkHp - aoeDorDmg)
          const dorianStatus = dorianLurkHp <= 0
            ? '🔴 Dorian is caught in the blast — he collapses in the shadows. <em>He won\'t backstab again.</em>'
            : '🔴 Dorian takes ' + aoeDorDmg + ' from the pulse too. (' + dorianLurkHp + ' HP left in the dark.)'
          messages.push('⚫ <strong>VOID SENTINEL GEOMETRY PULSE</strong> — reality warps in all directions. You take <strong>' + aoePlyDmg + '</strong>. ' + dorianStatus)
        }
      }

      shake()
      log(messages.join(' '), turnLabel)
      syncBars()
      // ── Class skill: turn-end hook (mark/silence countdown + DoT) ────
      const _clsTurn = ClsCombat.onTurnEnd(player, statusEffects)
      if (_clsTurn.damageToEnemy > 0) enemyHp = Math.max(0, enemyHp - _clsTurn.damageToEnemy)
      if (_clsTurn.healToPlayer > 0)  currentHp = Math.min(maxPlayerHp, currentHp + _clsTurn.healToPlayer)
      for (const m of _clsTurn.messages) messages.push(m)
      renderSkillSlots()
      renderClassSkills()

      if (enemyHp <= 0) {
        // ── Class skill: kill hook (Final Sentence message) ────────────
        const _clsKill = ClsCombat.onKill(player, statusEffects, enemy)
        if (_clsKill.messages.length) log(_clsKill.messages.join(' '))
        // Apply kill-triggered heals (Vampire's Hunger / Hunter's Pulse)
        if (statusEffects.cls_killHeal > 0) {
          currentHp = Math.min(maxPlayerHp, currentHp + statusEffects.cls_killHeal)
          statusEffects.cls_killHeal = 0
        }
        // Devour Soul: full heal if signal set
        if (statusEffects.cls_devourSoulHealToFull) {
          currentHp = maxPlayerHp
          statusEffects.cls_devourSoulHealToFull = false
        }
        log(enemy.name + ' has fallen.'); endCombat('win'); return
      }
      if (currentHp <= 0) {
        // Empty Throne (Mourning King t6c): enemy dies too
        if (statusEffects.cls_emptyThronePending) {
          statusEffects.cls_emptyThronePending = false
          enemyHp = 0
          log('☠ Empty Throne — they fall with you.')
          log(enemy.name + ' has fallen.'); endCombat('win'); return
        }
        // Maw of the Survivor (Devourer t5a): final bite
        if (statusEffects.cls_mawOfSurvivorPending) {
          statusEffects.cls_mawOfSurvivorPending = false
          const bite = (player.atk||5) + (statusEffects.playerATKBonus||0)
          const finalBite = bite * 2
          enemyHp = Math.max(0, enemyHp - finalBite)
          log('🦷 Maw of the Survivor — last bite for ' + finalBite + '.')
          if (enemyHp <= 0) {
            currentHp = 1
            log('You survive at 1 HP. The hunger remains.')
            log(enemy.name + ' has fallen.'); endCombat('win'); return
          }
        }
        if (window._hasRevive) {
          window._hasRevive = false; currentHp = 20; syncBars()
          await supabase.from('players').update({ hp: 20 }).eq('id', player.id)
          player.hp = 20
          log('Phoenix Feather activates — you rise at 20 HP!')
          setButtons(true)
        } else { log('You collapse…'); endCombat('defeat') }
        return
      }
      setButtons(true)
    }


    // ── Oathbreaker oath picker ──────────────────────────────────────
    // Same picker as Ch2 — see ch2_index_fixed.js for full comment.
    if (Array.isArray(statusEffects.cls_oathPickerPending) && statusEffects.cls_oathPickerPending.length > 0) {
      const OATH_INFO = {
        fury: { label: 'Oath of Fury',     sub: '+20% damage, -10% DEF',           icon: '⚔' },
        wall: { label: 'Oath of the Wall', sub: '+25% DEF, -15% damage, +5%/turn', icon: '🛡' },
        hunt: { label: 'Oath of the Hunt', sub: '+15% SPD, +10% crit, -10% DEF',   icon: '🏹' },
      }
      const oaths = statusEffects.cls_oathPickerPending
      const modal = document.createElement('div')
      modal.id = 'cls-oath-picker'
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(28,24,18,.78);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px'
      modal.innerHTML = `
        <div style="background:var(--paper,#f4ead7);border:2px solid var(--ink,#3a2a1a);padding:20px;max-width:420px;width:100%;font-family:'JetBrains Mono',monospace;color:var(--ink,#3a2a1a)">
          <div style="font-size:11px;letter-spacing:.18em;margin-bottom:6px;opacity:.7">CHOOSE YOUR OATH</div>
          <div style="font-size:13px;line-height:1.4;margin-bottom:14px">Before combat, you must swear. The oath shapes how you fight — and the moment you break it.</div>
          ${oaths.map(o => `
            <button data-oath="${o}" style="display:block;width:100%;margin-bottom:8px;padding:10px 12px;background:#fff;border:1px solid var(--ink,#3a2a1a);font-family:inherit;color:inherit;cursor:pointer;text-align:left">
              <div style="font-weight:600;font-size:12px;letter-spacing:.06em">${OATH_INFO[o].icon} ${OATH_INFO[o].label.toUpperCase()}</div>
              <div style="font-size:10px;opacity:.7;margin-top:2px">${OATH_INFO[o].sub}</div>
            </button>
          `).join('')}
        </div>
      `
      document.body.appendChild(modal)
      setButtons(false)
      modal.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button[data-oath]')
        if (!btn) return
        const oath = btn.getAttribute('data-oath')
        const r = ClsCombat.setOathbreakerOath(oath, statusEffects)
        for (const m of r.messages) log(m)
        modal.remove()
        setButtons(true)
        renderClassSkills()
      })
    }

    $('btn-strike').addEventListener('click', () => doTurn('strike'))
    $('btn-heavy').addEventListener('click',  () => doTurn('heavy'))
    $('btn-defend').addEventListener('click', () => doTurn('defend'))

    $('btn-escape').addEventListener('click', async () => {
      if (over) return
      const escChance = 0.3 + (playerSPD() - enemySPD()) * 0.05
      if (Math.random() < Math.max(0.1, Math.min(0.8, escChance))) {
        log('You slip away…')
        endCombat('escape')
      } else {
        const dmg = Math.max(0, enemy.atk - playerDEF())
        currentHp = Math.max(0, currentHp - dmg)
        log('Failed to flee — took ' + dmg + ' damage.')
        syncBars()
        if (currentHp <= 0) endCombat('defeat')
      }
    })

    // ── Items button ─────────────────────────────
    $('btn-items').addEventListener('click', async () => {
      if (over) return
      const itemsPanel = $('items-panel')
      const list       = $('items-list')

      // Toggle panel
      if (itemsPanel.style.display !== 'none') {
        itemsPanel.style.display = 'none'
        return
      }
      itemsPanel.style.display = 'block'
      list.innerHTML = '<p style="font-family:\'Share Tech Mono\',monospace;font-size:.6rem;color:var(--ink-dim)">Loading...</p>'

      // Fetch consumables and usable keys from inventory
      const { data } = await supabase
        .from('inventory').select('*')
        .eq('player_id', player.id)
        .in('item_type', ['consumable','key'])
        .gt('quantity', 0)
        .order('item_type')

      const usable = (data||[]).filter(i => i.hp_restore > 0 || ['Phoenix Feather','Explosion Scroll','Lava Bomb','Water Potion','Medkit','Energy Drink','Fire Potion','Light Potion','Healing Rain'].includes(i.name))

      if (!usable.length) {
        list.innerHTML = '<p style="font-family:\'IM Fell English\',serif;font-style:italic;font-size:.8rem;color:var(--ink-dim)">No usable items in bag.</p>'
        return
      }

      const RC = {common:'#c8c0a0',uncommon:'#5ec45e',rare:'#5eaee0',epic:'#c090ff',legendary:'#f0d060',mythic:'#ff88ff'}

      list.innerHTML = usable.map(item => `
        <div onclick="combatUseItem_${cid}('${item.id}','${item.name}',${item.hp_restore||0},${item.quantity||1},'${item.special_effect||''}')"
          style="display:flex;align-items:center;gap:.5rem;padding:.45rem .25rem;border-bottom:.5px solid rgba(139,106,32,.12);cursor:pointer;transition:background .15s;border-radius:2px"
          onmouseover="this.style.background='rgba(200,184,128,.1)'" onmouseout="this.style.background=''">
          ${(()=>{const _s=getItemImg(item.item_key);return _s?('<img src="'+_s+'" style="width:28px;height:28px;object-fit:contain;border-radius:3px;flex-shrink:0">'):(item.icon||'📦')})()}
          <div style="flex:1;min-width:0">
            <p style="font-family:'Cinzel',serif;font-size:.75rem;color:${RC[item.rarity]||'#888'};margin:0 0 1px">${item.name}</p>
            <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink-dim);margin:0">
              ${item.hp_restore>0 ? `+${item.hp_restore} HP` : item.special_effect || 'Special effect'}
            </p>
          </div>
          <span style="font-family:'Share Tech Mono',monospace;font-size:.58rem;color:var(--ink-dim);flex-shrink:0">×${item.quantity||1}</span>
        </div>
      `).join('')
    })

    window['combatUseItem_' + cid] = async function(itemId, itemName, hpRestore, qty, specialEffect) {
      const maxHp = player.max_hp || 100

      // ── Healing items ─────────────────────────
      if (hpRestore > 0) {
        const healed  = Math.min(maxHp, currentHp + hpRestore) - currentHp
        currentHp     = Math.min(maxHp, currentHp + hpRestore)
        syncBars()
        await supabase.from('players').update({ hp: currentHp }).eq('id', player.id)
        player.hp = currentHp
        log('Used ' + itemName + ' — restored ' + healed + ' HP. (' + currentHp + '/' + maxHp + ')')
      }
      // ── Phoenix Feather — auto-revive ─────────
      else if (itemName === 'Phoenix Feather') {
        window._hasRevive = true
        log('Phoenix Feather equipped — will auto-revive at 20 HP if you fall.')
      }
      // ── Explosion Scroll — max next attack ────
      else if (itemName === 'Explosion Scroll') {
        window._forceMaxHit = true
        log('Explosion Scroll loaded — next attack will deal maximum damage.')
      }
      // ── Lava Bomb — skip fight ─────────────────
      else if (itemName === 'Lava Bomb') {
        enemyHp = 0
        syncBars()
        log('Lava Bomb detonated — enemy destroyed instantly.')
        $('items-panel').style.display = 'none'
        await consumeItem(itemId, qty)
        endCombat('win')
        return
      }
      else {
        log('Cannot use ' + itemName + ' here.')
        return
      }

      $('items-panel').style.display = 'none'
      await consumeItem(itemId, qty)
    }

    // Helper — remove 1 from stack or delete if last
    async function consumeItem(itemId, qty) {
      if (qty <= 1) {
        await supabase.from('inventory').delete().eq('id', itemId)
      } else {
        await supabase.from('inventory').update({ quantity: qty - 1 }).eq('id', itemId)
      }
    }


    // ── Watcher Item Set Drop ─────────────────────────────────
    // Guaranteed 1 piece on first kill. Each additional piece: 40% chance.
    // Stats roll 1-6 randomly per stat slot.
    async function dropSingleWatcherPiece(itemKey) {
      const piece = WATCHER_PIECES.find(p => p.item_key === itemKey)
      if (!piece) return
      const statRolls = {}
      for (const stat of piece.stats) statRolls[stat] = Math.floor(Math.random() * 6) + 1
      const row = {
        player_id: player.id, item_key: piece.item_key, name: piece.name,
        item_type: piece.item_type, rarity: piece.rarity, icon: piece.icon,
        quantity: 1, equipped_slot: null,
        ...statRolls,
        special_effect: piece.special_effect,
        sockets_total: 2, sockets_used: 0, socketed_runes: [],
      }
      const { error } = await supabase.from('inventory').insert(row)
      if (!error) {
        window.showToast(`★ ${piece.name} dropped!`)
        queueLoot(piece.name, 1, piece.img)
      }
    }

    async function dropWatcherSet() {
      const WATCHER_KEYS = {
        watcher_cloak:    { chance: 0.05 },
        watcher_eye_ring: { chance: 0.05 },
        watcher_crown:    { chance: 0.05 },
        watcher_band:     { chance: 0.10 },
      }
      for (const piece of WATCHER_PIECES) {
        const rule = WATCHER_KEYS[piece.item_key]
        if (!rule) continue
        if (Math.random() > rule.chance) continue
        await dropSingleWatcherPiece(piece.item_key)
      }
    }

    const WATCHER_PIECES = [
      {
        item_key: 'watcher_eye_ring', name: "Watcher's Multi-Eye Ring", rarity: 'rare',
        item_type: 'accessory', icon: '💍',
        img: '../assets/sets/watcher_eye_ring.png',
        stats: ['insight_bonus','luck_bonus','atk_bonus'],
        special_effect: "Observer's Sight: First attack on an unseen enemy deals +25% damage. Reveals hidden enemies nearby.",
      },
      {
        item_key: 'watcher_band', name: "Watcher's Band", rarity: 'rare',
        item_type: 'accessory', icon: '💍',
        img: '../assets/sets/watcher_band.png',
        stats: ['control_bonus','speed_bonus','atk_bonus'],
        special_effect: "Pattern Recognition: Consecutive hits on the same enemy stack +2% damage (max 20%).",
      },
      {
        item_key: 'watcher_cloak', name: "Watcher's Cloak", rarity: 'rare',
        item_type: 'armor', icon: '🧥',
        img: '../assets/sets/watcher_cloak.png',
        stats: ['speed_bonus','insight_bonus','def_bonus','luck_bonus'],
        special_effect: "Phantom Step: After dodging, your next attack cannot be dodged. 15% chance to phase (50% dmg reduction).",
      },
      {
        item_key: 'watcher_crown', name: "Watcher's Crown", rarity: 'rare',
        item_type: 'armor', icon: '👑',
        img: '../assets/sets/watcher_crown.png',
        stats: ['insight_bonus','guard_bonus','def_bonus'],
        special_effect: "Observed: Enemies you hit take -10% ATK and +10% damage from you.",
      },
    ]

    renderSkillSlots()
    renderClassSkills()
    syncBars()
  }

  // ── Init ─────────────────────────────────────────
  renderHUD()
  render()

  return { player, cleanup() {} }
}

export default mountChapter1
