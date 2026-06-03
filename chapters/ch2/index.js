import { supabase } from '../../supabase.js'
// renderNav, showSysOverlay, showToast are exposed as window globals by book.html
import {
  CLASSES,
  getClassChoicesForFormKey,
  hasPickedClass,
  isClassEligible,
  pickClass,
} from '../../data/classes.js'
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
// Cache-bust enemyAI.js by hardcoding the version. When enemyAI.js changes,
// bump the ?v= here AND in book.html. Without this, browsers cache the file
// indefinitely.
import {
  resolveEnemyTurn, initEnemyState,
  applyBleed, applyPoison, applySlow, applyStun, applyDefShred, applyTerror,
} from '../../data/enemyAI.js?v=2026-05-14-enemyai-cachebust'
import { META, ELEMENT_NAMES, ZONE_ELEMENT_MAP, ZONES, STORY_EVENTS } from './config.js'
import { ITEM_IMAGES } from './items.js'
import ZONE_FIRE      from './zones/zone-fire.js'
import ZONE_WATER     from './zones/zone-water.js'
import ZONE_LIGHTNING from './zones/zone-lightning.js'
import ZONE_ARCANE    from './zones/zone-arcane.js'
import ZONE_SHADOW    from './zones/zone-shadow.js'
import ZONE_EARTH     from './zones/zone-earth.js'
import ZONE_WIND      from './zones/zone-wind.js'
import ZONE_PLANT     from './zones/zone-plant.js'
import ZONE_METAL     from './zones/zone-metal.js'
import ZONE_POISON    from './zones/zone-poison.js'
import ZONE_FARMING, { randomizeFarmingWaves } from './zones/zone-farming.js'

const MODULE_STYLE_ID = 'book-module-style-chapter-2'
const MODULE_MARKUP = "<div class=\"book-wrap\">\n  \n  <div class=\"book animate-in\" style=\"position:relative;\">\n    <div class=\"page-left parchment\" id=\"left-page\">\n      <div class=\"page-inner\">\n        <p class=\"chapter-label\">Chapter 2 \u2014 Broken Alliances</p>\n        <p class=\"chapter-sub\">Groups form. Groups break. The System watches both.</p>\n        <hr class=\"ink-divider\">\n        <p class=\"story-text\" id=\"story-text\"></p>\n        <div class=\"notice-box animate-in\" id=\"outcome-box\" style=\"display:none\"></div>\n      </div>\n    </div>\n    <div class=\"page-right parchment\">\n      <div class=\"page-inner\">\n        <div class=\"hud\" id=\"hud\"></div>\n        <hr class=\"ink-divider\">\n        <div id=\"right-panel\"></div>\n      </div>\n    </div>\n    <!-- Decorative page-flip animation \u2014 purely visual, no pointer events -->\n    <div class=\"page-flip-decorator\" aria-hidden=\"true\"></div>\n  </div>\n</div>"
const MODULE_STYLES = "\n    /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n       PARCHMENT BOOK THEME \u2014 Warm Ink / Aged Paper\n       Matches the interactive book page-flip UI.\n    \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n        :root {\n      --bg-0:      #14110f;\n      --bg-1:      #2b1d16;\n      --panel:     #f4ead7;\n      --page-l:    #f4ead7;\n      --page-r:    #f1e4cf;\n      --ink:       #2b1d16;\n      --ink-dim:   #5c4638;\n      --ink-faint: #a08060;\n      --ice:       #7a5230;\n      --ice-hot:   #4b2e14;\n      --gold:      #c8a050;\n      --gold-hot:  #e0c070;\n      --gold-dim:  #a08040;\n      --amber:     #d09040;\n      --amber-hot: #e0a050;\n      --warn:      #e06050;\n      --line:      rgba(200,160,80,.30);\n      --green:     #5cae50;\n      --purple:    #8a50c0;\n      --spine-col: #2b1d16;\n    }\n    *, *::before, *::after { box-sizing: border-box; }\n\n    /* \u2500\u2500 Global reset \u2500\u2500 */\n    html, body {\n      background: radial-gradient(ellipse at 50% 0%, #2a1a0e 0%, #14110f 55%, #0d0b09 100%) !important;\n      color: var(--ink) !important;\n      font-family: 'Cormorant Garamond', Georgia, serif !important;\n      min-height: 100vh;\n      overflow-x: hidden;\n    }\n\n    /* Warm ambient glow behind the book */\n    body::after {\n      content: \"\"; position: fixed; inset: 0; pointer-events: none; z-index: 9998;\n      background: radial-gradient(ellipse 900px 900px at 50% 40%, rgba(180,120,60,.07) 0%, transparent 70%);\n    }\n\n    /* \u2500\u2500 Book wrap \u2500\u2500 */\n    .book-wrap {\n      background: transparent !important;\n      max-width: 1060px;\n      margin: 0 auto;\n      padding: 24px 24px 60px;\n    }\n\n    /* \u2500\u2500 Book \u2014 warm parchment open-book \u2500\u2500 */\n    .book {\n      display: grid !important;\n      grid-template-columns: 1fr 1fr !important;\n      align-items: stretch !important;\n      gap: 0 !important;\n      background: transparent !important;\n      border: none !important;\n      box-shadow: none !important;\n      border-radius: 24px !important;\n      filter: drop-shadow(0 24px 60px rgba(0,0,0,.75)) drop-shadow(0 8px 20px rgba(0,0,0,.5)) !important;\n      transform: perspective(1600px) rotateX(2.5deg) !important;\n      transform-origin: 50% 0 !important;\n      margin-top: 10px !important;\n      overflow: hidden !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n    }\n    @media(max-width: 860px) {\n      .book { grid-template-columns: 1fr !important; transform: none !important; max-height: none !important; border-radius: 12px !important; }\n    }\n\n    /* \u2500\u2500 Pages \u2500\u2500 */\n    .parchment, .page-left, .page-right {\n      background: var(--panel) !important;\n      border: none !important;\n      border-radius: 0 !important;\n      box-shadow: none !important;\n      color: var(--ink) !important;\n      position: relative;\n      overflow-y: auto;\n      overflow-x: hidden;\n    }\n    /* Dot-texture paper grain overlay */\n    .page-left::before, .page-right::before {\n      content: \"\" !important;\n      position: absolute !important; inset: 0 !important;\n      pointer-events: none !important; z-index: 0 !important;\n      opacity: .08 !important;\n      background-image: radial-gradient(circle, rgba(0,0,0,.25) 1px, transparent 1px) !important;\n      background-size: 12px 12px !important;\n    }\n    .page-left  { border-right: none !important; background: var(--page-l) !important; }\n    .page-right { border-left:  none !important; background: var(--page-r) !important; }\n\n    /* Decorative corner brackets \u2014 parchment style */\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n\n    /* Decorative gold corner rules inside pages */\n    .page-inner { padding: 28px 30px !important; position: relative; }\n    .page-inner::before {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 14px !important; left: 14px !important;\n      width: 28px !important; height: 28px !important;\n      border-left: 1.5px solid rgba(138,91,68,.45) !important;\n      border-top: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-inner::after {\n      content: \"\" !important;\n      position: absolute !important;\n      bottom: 14px !important; right: 14px !important;\n      width: 28px !important; height: 28px !important;\n      border-right: 1.5px solid rgba(138,91,68,.45) !important;\n      border-bottom: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n\n    /* \u2500\u2500 Spine \u2014 warm book gutter \u2500\u2500 */\n    .spine {\n      background: linear-gradient(90deg,\n        rgba(232,210,170,.0)   0%,\n        rgba(200,170,120,.25)  15%,\n        rgba(160,120,70,.55)   30%,\n        rgba(90,55,20,.88)     43%,\n        rgba(40,20,5,1.0)      50%,\n        rgba(90,55,20,.88)     57%,\n        rgba(160,120,70,.55)   70%,\n        rgba(200,170,120,.25)  85%,\n        rgba(232,210,170,.0)   100%\n      ) !important;\n      border-left:  none !important;\n      border-right: none !important;\n      position: relative; z-index: 5;\n      width: 32px !important;\n      min-width: 32px !important;\n      margin: 0 !important;\n      overflow: visible;\n      box-shadow: none !important;\n    }\n\n    /* Hairline crease at the very centre */\n    .spine::before {\n      content: \"\";\n      position: absolute;\n      top: 0; bottom: 0;\n      left: 50%;\n      width: 1px;\n      transform: translateX(-50%);\n      background: linear-gradient(180deg,\n        transparent 0%,\n        rgba(43,29,22,.9) 8%,\n        rgba(43,29,22,.9) 92%,\n        transparent 100%);\n      z-index: 2;\n    }\n    .spine::after {\n      content: \"\";\n      position: absolute;\n      top: 2px; bottom: 2px; left: -3px;\n      width: 3px;\n      background: repeating-linear-gradient(\n        180deg,\n        rgba(138,91,68,.08) 0px,\n        rgba(138,91,68,.03) 1px,\n        rgba(0,0,0,.10)     1px,\n        rgba(0,0,0,.04)     2px\n      );\n      border-left: 1px solid rgba(138,91,68,.12);\n      z-index: 1;\n    }\n\n    /* Page curl shadow cast onto left page from the binding */\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n\n    /* Page curl shadow cast onto right page from the binding */\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n\n    .spine-inner, .spine-highlight, .spine-shadow,\n    .spine-title, .spine-rule, .spine-diamond, .spine-chapter { display: none !important; }\n\n         /* \u2500\u2500 Chapter label / subtitle \u2500\u2500 */\n    .chapter-label {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 9.5px !important;\n      letter-spacing: .42em !important;\n      text-transform: uppercase !important;\n      color: var(--ink) !important;\n      margin-bottom: 5px !important;\n    }\n    .chapter-sub {\n      font-size: 17px !important;\n      font-style: italic !important;\n      color: var(--ink) !important;\n      margin-bottom: 0 !important;\n    }\n\n        /* \u2500\u2500 Divider \u2500\u2500 */\n    .ink-divider, hr.ink-divider {\n      border: none !important;\n      border-top: 1px solid rgba(200,180,120,.40) !important;\n      margin: 12px 0 !important;\n      opacity: 1 !important;\n    }\n\n    /* \u2500\u2500 Body text colour remaps \u2500\u2500 */\n    p, li, span { color: var(--ink) !important; }\n    [style*=\"color:var(--ink)\"] { color: var(--ink) !important; }\n    [style*=\"color:var(--ink-dim)\"] { color: var(--ink-dim) !important; }\n    /* Normalize stale light-yellow inline colors on parchment pages only. */\n    .parchment [style*=\"color:#c8b96e\"], .parchment [style*=\"color: #c8b96e\"],\n    .parchment [style*=\"color:#c8b880\"], .parchment [style*=\"color: #c8b880\"],\n    .parchment [style*=\"color:#f0d060\"], .parchment [style*=\"color: #f0d060\"],\n    .parchment [style*=\"color:#e8d8b0\"], .parchment [style*=\"color: #e8d8b0\"],\n    .parchment [style*=\"color:#f0e0c0\"], .parchment [style*=\"color: #f0e0c0\"],\n    .parchment [style*=\"color:#f0c080\"], .parchment [style*=\"color: #f0c080\"],\n    .parchment [style*=\"color:#a08858\"], .parchment [style*=\"color: #a08858\"],\n    .parchment [style*=\"color:#e8d8a8\"], .parchment [style*=\"color: #e8d8a8\"] { color: var(--ink) !important; }\n    [style*=\"background:rgba(200,184,128\"] { background: rgba(138,91,68,.08) !important; }\n    [style*=\"border-color:rgba(139,106,32\"] { border-color: rgba(138,91,68,.30) !important; }\n\n    /* \u2500\u2500 Story text \u2500\u2500 */\n    .story-text {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 17px !important;\n      line-height: 1.65 !important;\n      color: var(--ink) !important;\n      white-space: pre-line !important;\n    }\n    .story-text.drop-cap::first-letter {\n      font-size: 3.8em !important;\n      float: left !important;\n      line-height: .78 !important;\n      margin: .05em .12em 0 0 !important;\n      color: var(--gold) !important;\n      font-weight: 600 !important;\n    }\n\n        /* \u2500\u2500 Notice / outcome box \u2500\u2500 */\n    .notice-box {\n      border: 1px solid rgba(200,180,120,.50) !important;\n      background: rgba(30,20,15,.85) !important;\n      color: #f0d060 !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 11px !important;\n      letter-spacing: .06em !important;\n      padding: 10px 14px !important;\n      border-radius: 0 !important;\n      margin-top: 14px !important;\n    }\n\n        /* \u2500\u2500 HUD (parchment-readable) \u2500\u2500 */\n    #hud { color: var(--ink); }\n    #hud p, #hud span, #hud div { color: var(--ink); }\n    /* seal-label: NO !important so inline color:${bc} wins for badge tint */\n    #hud .hud-badge-row .hud-seal-label { font-family: 'Cinzel', serif; font-weight: 600; letter-spacing: .04em; }\n    #hud .hud-chapter { color: var(--ink-dim) !important; font-family: 'JetBrains Mono',monospace !important; font-size: .62rem !important; letter-spacing: .08em !important; }\n    #hud .stat-key { color: var(--ink-dim) !important; font-family: 'JetBrains Mono',monospace !important; font-size: .6rem !important; letter-spacing: .08em !important; }\n    #hud .stat-val { color: var(--ink) !important; font-family: 'JetBrains Mono',monospace !important; font-weight: 600; }\n    #hud .stat-bar-wrap { background: rgba(43,29,22,.18) !important; border-radius: 0 !important; }\n    #hud .stat-box { background: rgba(138,91,68,.10) !important; border: 1px solid rgba(138,91,68,.35) !important; border-radius: 0 !important; }\n    #hud .stat-box-key { color: var(--ink-dim) !important; font-family: 'JetBrains Mono',monospace !important; letter-spacing: .08em !important; }\n    #hud .stat-box-val { color: var(--ink) !important; font-family: 'Cinzel',serif !important; font-weight: 600 !important; }\n    #hud button {\n      background: rgba(138,91,68,.10) !important;\n      border: 1px solid rgba(138,91,68,.40) !important;\n      color: var(--ink) !important;\n      border-radius: 0 !important;\n      font-family: 'JetBrains Mono',monospace !important;\n      transition: border-color .2s, color .2s, background .2s !important;\n    }\n    #hud button:hover { border-color: var(--gold-dim) !important; color: var(--gold-dim) !important; background: rgba(138,91,68,.06) !important; }\n    #hud div[onclick] {\n      background: rgba(138,91,68,.10) !important;\n      border: 1px solid rgba(138,91,68,.45) !important;\n      color: var(--ink) !important;\n      border-radius: 0 !important;\n      font-weight: 500;\n    }\n    /* Remap stale light-on-cream inline colors anywhere inside the HUD */\n    #hud [style*=\"color:#c8b96e\"], #hud [style*=\"color: #c8b96e\"],\n    #hud [style*=\"color:#c8b880\"], #hud [style*=\"color: #c8b880\"],\n    #hud [style*=\"color:#f0d060\"], #hud [style*=\"color: #f0d060\"],\n    #hud [style*=\"color:#e8d8b0\"], #hud [style*=\"color: #e8d8b0\"],\n    #hud [style*=\"color:#f0e0c0\"], #hud [style*=\"color: #f0e0c0\"],\n    #hud [style*=\"color:#f0c080\"], #hud [style*=\"color: #f0c080\"] { color: var(--ink) !important; }\n\n    /* \u2500\u2500 Buttons / choices \u2014 warm parchment style \u2500\u2500 */\n    button:not(.bm-signout), .choice, .combat-btn {\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.35) !important;\n      border-radius: 0 !important;\n      color: var(--ink) !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 10px !important; letter-spacing: .08em !important;\n      cursor: pointer !important;\n      transition: border-color .2s, color .2s, background .2s !important;\n    }\n    button:hover, .choice:hover, .combat-btn:hover:not(:disabled) {\n      border-color: var(--gold) !important;\n      color: var(--gold) !important;\n      background: rgba(138,91,68,.07) !important;\n    }\n\n    /* \u2500\u2500 Choices panel \u2500\u2500 */\n    .choices-label {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 10px !important;\n      letter-spacing: .38em !important;\n      text-transform: uppercase !important;\n      color: var(--ink-dim) !important;\n      margin-bottom: 12px !important;\n    }\n    .choices { display: flex; flex-direction: column; gap: 8px; }\n\n    button.choice, .choice {\n      background: rgba(244,234,215,.60) !important;\n      border: 1px solid rgba(138,91,68,.35) !important;\n      border-radius: 0 !important;\n      color: var(--ink) !important;\n      padding: 12px 14px !important;\n      text-align: left !important;\n      cursor: pointer !important;\n      transition: border-color .2s, background .2s, transform .2s !important;\n      display: flex !important;\n      align-items: flex-start !important;\n      gap: 10px !important;\n      width: 100% !important;\n      font-family: 'Cormorant Garamond', serif !important;\n    }\n    button.choice:hover, .choice:hover {\n      border-color: var(--gold) !important;\n      background: rgba(138,91,68,.12) !important;\n      transform: translateX(4px) !important;\n    }\n    button.choice.danger, .choice.danger {\n      border-color: rgba(192,57,43,.35) !important;\n    }\n    button.choice.danger:hover, .choice.danger:hover {\n      border-color: var(--warn) !important;\n      background: rgba(192,57,43,.08) !important;\n    }\n    button.choice.locked, .choice.locked {\n      opacity: .45 !important;\n      cursor: default !important;\n      border-color: rgba(138,91,68,.15) !important;\n    }\n    .choice-arrow {\n      color: var(--gold) !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 13px !important;\n      flex-shrink: 0 !important;\n      margin-top: 1px !important;\n    }\n    button.choice.danger .choice-arrow, .choice.danger .choice-arrow { color: var(--warn) !important; }\n    .choice-body {\n      font-size: 17px !important;\n      color: var(--ink) !important;\n      display: flex !important;\n      flex-direction: column !important;\n    }\n    .choice-sub {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 9.5px !important;\n      letter-spacing: .06em !important;\n      color: var(--ink-dim) !important;\n      margin-top: 3px !important;\n    }\n\n    /* \u2500\u2500 Stat bars \u2500\u2500 */\n    .stat-bar-wrap { background: rgba(0,0,0,.08) !important; border-radius: 0 !important; }\n    .stat-key { color: var(--ink-dim) !important; font-family: 'JetBrains Mono',monospace !important; font-size: .58rem !important; letter-spacing: .08em !important; }\n    .stat-val { color: var(--ink) !important; }\n\n    /* \u2500\u2500 Combat panel \u2500\u2500 */\n    .combat-panel {\n      background: rgba(244,234,215,.80) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      padding: 16px !important;\n      position: relative;\n    }\n    .combat-panel::before {\n      content: \"\"; position: absolute; top: -1px; left: -1px;\n      width: 12px; height: 12px;\n      border-top: 1px solid var(--gold); border-left: 1px solid var(--gold);\n    }\n    .combat-enemy-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }\n    .combat-enemy-icon { font-size: 2.5rem; }\n    .combat-enemy-name {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 20px !important; font-weight: 600 !important;\n      letter-spacing: .04em !important; color: var(--ink) !important;\n    }\n    .combat-log {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-style: italic !important;\n      font-size: 15px !important;\n      line-height: 1.55 !important;\n      color: var(--ink-dim) !important;\n      background: rgba(0,0,0,.06) !important;\n      border: 1px solid rgba(138,91,68,.20) !important;\n      border-radius: 0 !important;\n      padding: 10px 12px !important;\n      min-height: 3rem !important;\n      margin-bottom: 10px !important;\n    }\n    .combat-log em     { color: var(--gold) !important; font-style: italic; }\n    .combat-log strong { color: var(--warn) !important; font-style: normal; }\n    .stat-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }\n    .stat-bar-wrap {\n      flex: 1; height: 5px !important;\n      background: rgba(0,0,0,.08) !important;\n      border-radius: 0 !important; overflow: hidden;\n    }\n    .stat-bar { height: 100%; transition: width .4s, background .4s; }\n    .stat-key {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: .58rem !important; letter-spacing: .08em !important;\n      color: var(--ink-dim) !important; min-width: 44px;\n    }\n    .stat-val {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: .6rem !important; color: var(--ink) !important;\n      min-width: 50px; text-align: right;\n    }\n\n    /* combat action buttons */\n    .combat-btn {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: .6rem !important; letter-spacing: .06em !important;\n      color: var(--ink) !important;\n      background: rgba(244,234,215,.50) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      padding: .45rem .5rem !important;\n      cursor: pointer !important;\n      transition: border-color .2s, background .2s, color .2s !important;\n      display: flex !important; align-items: center !important; justify-content: center !important;\n    }\n    .combat-btn:hover:not(:disabled) {\n      border-color: var(--gold) !important;\n      color: var(--gold) !important;\n      background: rgba(138,91,68,.10) !important;\n    }\n    .combat-btn:disabled { opacity: .35 !important; cursor: not-allowed !important; }\n\n    /* stat-grid inside HUD */\n    .stat-grid {\n      display: grid;\n      grid-template-columns: repeat(3,1fr);\n      gap: 4px; margin-top: 6px;\n    }\n\n    /* \u2500\u2500 End screen \u2500\u2500 */\n    .end-box {\n      background: rgba(244,234,215,.80) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      padding: 20px !important;\n      position: relative;\n    }\n    .end-box::before { content:\"\"; position:absolute; top:-1px; left:-1px; width:14px; height:14px; border-top:1px solid var(--gold); border-left:1px solid var(--gold); }\n    .end-box::after  { content:\"\"; position:absolute; bottom:-1px; right:-1px; width:14px; height:14px; border-bottom:1px solid var(--gold); border-right:1px solid var(--gold); }\n    .end-title {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 22px !important; font-weight: 600 !important;\n      letter-spacing: .06em !important;\n      color: var(--gold) !important;\n      margin-bottom: 10px !important;\n    }\n    .end-sub {\n      font-style: italic !important;\n      font-size: 16px !important;\n      color: var(--ink-dim) !important;\n      line-height: 1.55 !important;\n      margin-bottom: 14px !important;\n    }\n    .end-btn {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: .75rem !important;\n      letter-spacing: .14em !important;\n      text-transform: uppercase !important;\n      color: var(--ink) !important;\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.35) !important;\n      border-radius: 0 !important;\n      padding: .55rem 1.2rem !important;\n      cursor: pointer !important;\n      transition: border-color .2s, color .2s, background .2s !important;\n      text-decoration: none !important;\n      display: inline-block !important;\n    }\n    .end-btn:hover {\n      border-color: var(--gold) !important;\n      color: var(--gold) !important;\n      background: rgba(138,91,68,.07) !important;\n    }\n\n    /* \u2500\u2500 Items panel \u2500\u2500 */\n    #items-panel, [id$=\"-items-panel\"] {\n      background: rgba(244,234,215,.70) !important;\n      border: 1px solid rgba(138,91,68,.25) !important;\n      border-radius: 0 !important;\n    }\n    [id$=\"-items-panel\"] p,\n    [id$=\"-items-panel\"] span { color: var(--ink) !important; }\n\n    /* \u2500\u2500 animate-in \u2500\u2500 */\n    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }\n    .animate-in { animation: fadeIn .4s ease forwards; }\n    @keyframes animateShake {\n      0%,100%{transform:translateX(0)}\n      20%,60%{transform:translateX(-4px)}\n      40%,80%{transform:translateX(4px)}\n    }\n    .animate-shake { animation: animateShake .35s ease; }\n\n         /* \u2500\u2500 System overlay messages \u2500\u2500 */\n    .sys-overlay, [id=\"sys-overlay\"] {\n      background: rgba(20,15,10,.98) !important;\n      border: 1px solid rgba(240,200,80,.70) !important;\n      color: #f0e0a0 !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 11px !important;\n      letter-spacing: .08em !important;\n      border-radius: 4px !important;\n      box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;\n      text-shadow: 0 0 2px rgba(0,0,0,0.5) !important;\n    }\n    .sys-overlay span, [id=\"sys-overlay\"] span,\n    .sys-overlay p, [id=\"sys-overlay\"] p {\n      color: #f0e0a0 !important;\n    }\n\n    /* \u2500\u2500 Toast \u2500\u2500 */\n    .toast, [class*=\"toast\"] {\n      background: rgba(20,15,10,.98) !important;\n      border: 1px solid rgba(240,200,80,.70) !important;\n      color: #f0e0a0 !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      border-radius: 4px !important;\n      font-size: 11px !important;\n      text-shadow: 0 0 2px rgba(0,0,0,0.5) !important;\n    }\n    .toast span, [class*=\"toast\"] span,\n    .toast p, [class*=\"toast\"] p {\n      color: #f0e0a0 !important;\n    }\n\n    /* \u2500\u2500 Loot window \u2500\u2500 */\n    #loot-window {\n      background: rgba(241,228,207,.96) !important;\n      border-color: rgba(138,91,68,.40) !important;\n      border-radius: 0 !important;\n      color: var(--ink) !important;\n    }\n    #loot-window p, #loot-window span { color: var(--ink) !important; }\n\n    /* \u2500\u2500 Stat window modal \u2500\u2500 */\n    #stat-window > div {\n      background: rgba(244,234,215,.97) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n    }\n    #stat-window * { color: var(--ink) !important; }\n    #stat-window [style*=\"background:rgba(200\"] {\n      background: rgba(138,91,68,.07) !important;\n    }\n\n    /* \u2500\u2500 Farm zones + location hub \u2500\u2500 */\n    #right-panel div[onclick] { border-radius: 0 !important; }\n\n    /* \u2500\u2500 Watcher image \u2500\u2500 */\n    #watcher-img {\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      filter: drop-shadow(0 0 20px rgba(138,91,68,.20)) !important;\n    }\n\n    /* \u2500\u2500 Eye encounter overlay \u2500\u2500 */\n    #eye-encounter-overlay {\n      background: rgba(20,14,10,.97) !important;\n    }\n\n    /* \u2500\u2500 combat-over \u2500\u2500 */\n    [id$=\"-combat-over\"] { color: var(--ink) !important; }\n    [id$=\"-combat-over\"] button {\n      font-family: 'JetBrains Mono', monospace !important;\n      color: var(--ink) !important;\n      background: rgba(138,91,68,.07) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n      cursor: pointer !important;\n      transition: border-color .15s, color .15s !important;\n    }\n    [id$=\"-combat-over\"] button:hover { border-color: var(--gold) !important; color: var(--gold) !important; }\n\n    /* \u2500\u2500 Modals \u2500\u2500 */\n    [id$=\"-window\"] > div, .end-box {\n      background: rgba(244,234,215,.97) !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      border-radius: 0 !important;\n    }\n\n    /* \u2500\u2500 Scrollbar \u2500\u2500 */\n    ::-webkit-scrollbar { width: 5px; }\n    ::-webkit-scrollbar-track { background: rgba(43,29,22,.20); }\n    ::-webkit-scrollbar-thumb { background: rgba(138,91,68,.35); }\n    ::-webkit-scrollbar-thumb:hover { background: var(--gold-dim); }\n\n    /* \u2500\u2500 Page-flip animation \u2014 triggered on navigation only \u2500\u2500 */\n    @keyframes bookPageFlip {\n      0%   { transform: perspective(1200px) rotateY(0deg);    opacity: 0; }\n      6%   { opacity: .92; }\n      50%  { transform: perspective(1200px) rotateY(-180deg); opacity: .92; }\n      80%  { opacity: 0; }\n      100% { transform: perspective(1200px) rotateY(-180deg); opacity: 0; }\n    }\n    .page-flip-decorator {\n      position: absolute;\n      top: 0; right: 0;\n      width: 50%; height: 100%;\n      transform-origin: left center;\n      pointer-events: none;\n      z-index: 40;\n      opacity: 0;\n      background: linear-gradient(to left, rgba(244,234,215,.96) 0%, rgba(235,220,195,.92) 60%, rgba(220,200,170,.72) 100%);\n      box-shadow: -4px 0 20px rgba(0,0,0,.15);\n    }\n    .page-flip-decorator.playing {\n      animation: bookPageFlip 0.55s cubic-bezier(0.4,0,0.2,1) forwards;\n    }\n    .page-flip-decorator::after { content: \"\"; }\n  "

function installModuleStyle() {
  document.querySelectorAll('style[data-book-module-style]').forEach(el => el.remove())
  const style = document.createElement('style')
  style.id = MODULE_STYLE_ID
  style.dataset.bookModuleStyle = 'true'
  style.textContent = MODULE_STYLES
  document.head.appendChild(style)
}

export async function mountChapter2(__mountOptions = {}) {
  const host = __mountOptions.host || document.getElementById('book-module-host') || document.body
  installModuleStyle()
  host.innerHTML = MODULE_MARKUP

  window._enemyAI = { resolveEnemyTurn }

  // ═══════════════════════════════════════════════════════════
  // CHAPTER 2 NODES & CONFIG
  // ═══════════════════════════════════════════════════════════
  const NODES = {
    ...ZONE_FIRE,
    ...ZONE_WATER,
    ...ZONE_LIGHTNING,
    ...ZONE_ARCANE,
    ...ZONE_SHADOW,
    ...ZONE_EARTH,
    ...ZONE_WIND,
    ...ZONE_PLANT,
    ...ZONE_METAL,
    ...ZONE_POISON,
    ...ZONE_FARMING,  // ═══════════════════════════════
    // OPENING — ARRIVAL
    // ═══════════════════════════════
    opening: {
      id: 'opening', type: 'story',
      text: `The road ends at a collapsed overpass.

  Beyond it, the shopping district stretches out — or what's left of it. Glass storefronts shattered inward. Mannequins knocked from their pedestals, frozen mid-fall. A banner reading GRAND REOPENING hangs diagonally across an entrance, half-burned, swaying in a wind that shouldn't exist.

  Your vehicle idles at the edge. The road here is cracked — something hit it from below.

  Your interface updates:

  CHAPTER 2 — BROKEN ALLIANCES
  ZONE: Kessler Shopping District
  STATUS: Contested. Multiple player factions active.

  Three signals pulse on your radar. Close together, then moving apart. People — or something pretending to be.

  A message appears in your interface. No sender ID:

  "You'll need to pick a side eventually. Everyone does. The ones who don't just end up in the middle when it collapses."

  You get out of the vehicle.`,
      sysMsg: 'Chapter 2 active. Faction activity detected across the district. Proceed with caution.',
      choices: [
        { label: 'Move toward the market plaza', sub: 'Three signals are clustered there', next: 'plaza_arrival' },
        { label: 'Scout the perimeter first',    sub: 'Get the lay of the land before making contact', next: 'scout_perimeter' },
        { label: 'Check your interface systems', sub: 'Review what carried over from Chapter 1', next: 'interface_check' },
      ],
    },

    interface_check: {
      id: 'interface_check', type: 'story',
      text: `You stand at the edge of the district and pull up your full interface display.

  Everything you built in Chapter 1 is still there. The stats. The badge. The items. Whatever relationship you have with the System — it followed you here.

  There's one new tab, though. FACTION ALIGNMENT. It's empty. A note below reads:

  "Your position will be calculated from your actions in this district. You don't choose a faction — the faction chooses you, based on what you do."

  Below that:

  ELEMENTAL PATHS AVAILABLE: 9
  STATUS: Locked. Complete district encounters to access.

  There's a third section. ALLIANCE LOG. Also empty. The header reads:

  "Cooperation and betrayal are both tracked here. The Judges will review this record."

  You close the interface.

  Something is watching the district. You can feel it — not like the Watcher. Quieter. More patient. Like something waiting to see what you'll become before it decides what to do about it.`,
      choices: [
        { label: 'Move into the district', next: 'plaza_arrival' },
      ],
    },

    scout_perimeter: {
      id: 'scout_perimeter', type: 'story',
      text: `You move along the outer edge of the district. Broken fencing. An overturned food truck. The smell of something that burned days ago.

  You find three things:

  One: a group of players hauling salvage into a parking structure, working in silence with practiced efficiency. They clock you but don't stop moving.

  Two: a solo player crouched behind a collapsed wall, watching the same group. When they notice you noticing them, they don't run — they just hold up two fingers. Wait.

  Three: a shopfront that's still intact. The lights are on inside. A handwritten sign on the door reads:

  OPEN. TRADING. WEAPONS. INFO. NO QUESTIONS.

  Your interface marks all three positions. Your radar has been accurate so far.

  The question is where to go first.`,
      xp: 40,
      choices: [
        { label: 'Approach the salvage crew',        sub: 'The Builders — they look organized', next: 'meet_builders' },
        { label: 'Talk to the solo watcher',          sub: 'The Ghosts — quiet, hard to read',  next: 'meet_ghosts' },
        { label: 'Go to the intact shop',             sub: 'NPC trader — neutral ground',        next: 'trader_intro' },
        { label: 'Head to the main plaza',            sub: 'See what else is active',            next: 'plaza_arrival' },
      ],
    },

    // ═══════════════════════════════
    // PLAZA — THE THREE FACTIONS
    // ═══════════════════════════════
    plaza_arrival: {
      id: 'plaza_arrival', type: 'story',
      text: `The plaza is a wide open square at the center of the district. A fountain in the middle, dry, full of broken glass. Around the edges, three distinct groups.

  On the left — the Builders. Eight or nine players, maybe more. They've pushed broken furniture into a defensive perimeter and are actively restoring a food stall at the far end. Someone is keeping inventory on a tablet. They have a visible stockpile. They look established.

  On the right — the Hunters. Smaller group. Five. They're not working. They're watching. Every one of them has their interface open on the other groups' positions. One of them, a lean figure with a cracked visor, is smiling at something you can't see.

  In the middle — the Ghosts. Not really a group. Just people sitting near each other by choice or proximity. Not talking much. Not committed to either side. Three of them, spread out enough to look casual but close enough to have a plan.

  And then there's you.

  Three different kinds of stares land on you at the same moment.

  Your interface registers: NEW ENVIRONMENT. FACTION ASSESSMENT ACTIVE.`,
      choices: [
        { label: 'Walk toward the Builders',       sub: 'Signal cooperation — moral +10',   next: 'meet_builders',  moral: 10 },
        { label: 'Walk toward the Hunters',        sub: 'Signal strength — moral -5',        next: 'meet_hunters',   moral: -5 },
        { label: 'Sit with the Ghosts',            sub: 'Signal neutrality — no change',     next: 'meet_ghosts' },
        { label: 'Stand in the center and wait',   sub: 'Let them come to you',              next: 'plaza_center' },
      ],
    },

    // ── Faction approach scenes ──────────────────────────────────────────
    // Originally the four plaza choices linked here, but only plaza_center
    // had ever been written. The other three now exist as short approach
    // scenes that funnel into the same downstream alliance nodes the wait
    // path uses (builders_alliance, hunters_voss_goal, ghosts_deep).
    meet_builders: {
      id: 'meet_builders', type: 'story',
      text: `You walk toward the Builders directly. The reaction is immediate — the tall woman with the grey-streaked hair sets down whatever she was working on and gives you her full attention. The others don't stop what they're doing, but you can feel that they're listening.

  "You came over." She doesn't smile, but there's something approving in the way she says it. "Most people circle the plaza first. I respect that you didn't."

  She extends a hand. "Sera. I lead the Builders here. Salvage, stabilization, anything that needs hands and a plan. We've been waiting for someone from your chapter to come through. The Hunters have been waiting too, but for different reasons."

  Behind her, a kid with a carefully bandaged hand gives you a small nod. Not performative. Just acknowledgment.`,
      choices: [
        { label: '"What do you need?"',            sub: 'Ask what the work looks like', next: 'builders_deep' },
        { label: '"Tell me about the alliance."',  sub: 'Cut to the offer',             next: 'builders_deep' },
        { label: 'Hear out the Hunters first',     sub: 'Walk over to Voss',            next: 'meet_hunters' },
      ],
    },

    meet_hunters: {
      id: 'meet_hunters', type: 'story',
      text: `You walk toward the Hunters. The smile under the cracked visor tilts up a degree. You can feel Sera's eyes on your back from across the plaza, but she doesn't call out. The Hunters didn't expect you, exactly — but they were ready for you.

  "Interesting." The Hunter with the visor pulls it up. The face underneath is younger than you expected, and very tired. "Voss. I run what the Builders call 'the destabilizing element' and what we call 'the people who get things done.'"

  Voss doesn't extend a hand. They tilt their head instead.

  "Three faction caches in this district. System-locked. We have the location on one of them. We're missing the people. You look like someone who's been keeping their options open — that's a compliment, where I come from."

  Behind them, the other Hunters watch you without pretending not to.`,
      choices: [
        { label: '"What\'s in it for me?"',         sub: 'Direct — Voss likes direct',     next: 'hunters_voss_goal' },
        { label: '"Tell me about the cache."',      sub: 'Get to the offer',               next: 'hunters_voss_goal' },
        { label: 'Hear out the Builders first',    sub: 'Walk over to Sera',              next: 'meet_builders' },
      ],
    },

    meet_ghosts: {
      id: 'meet_ghosts', type: 'story',
      text: `You sit down on the planter beside the Ghosts. None of the three of them react immediately. After a moment, the one closest to you — faded jacket, soft posture — shifts so their shoulder isn't blocking the plaza.

  "Good spot," they say, like they're commenting on the weather. "Both factions can see you. Neither can pretend they don't see you. That's the only neutral move left in this district."

  They look at you sideways.

  "We're Rue. Some of us. I think most of us. The Ghosts aren't really a group — we're just people who decided the choice between Builder and Hunter isn't a choice we want to make. The district has nine elemental zones the System sealed when the alliances started fracturing. You don't need either faction to enter them — but they open differently depending on who you're walking with."

  Rue gestures toward the plaza without looking at it.

  "You can still pick a side. We're not going to stop you. We just want you to know that 'neither' is on the table."`,
      choices: [
        { label: '"Tell me more about the zones."', sub: 'Ask about the System',          next: 'ghosts_deep' },
        { label: 'Stand up and approach Sera',     sub: 'Choose the Builders',           next: 'meet_builders' },
        { label: 'Stand up and approach Voss',     sub: 'Choose the Hunters',            next: 'meet_hunters' },
        { label: 'Stay where you are',              sub: 'Continue with Rue',             next: 'ghosts_deep' },
      ],
    },

    plaza_center: {
      id: 'plaza_center', type: 'story',
      text: `You walk to the fountain and sit on the edge of it. Glass crunches under your boots. You wait.

  It takes about forty seconds. Then someone from each group peels off and approaches — not together, but in loose orbit, like they've done this before. Like standing at the fountain is a neutral zone everyone agreed on without saying it.

  The Builder is a tall woman with grey-streaked hair and methodical eyes. She looks at you like she's already cataloguing your usefulness.

  The Hunter has the cracked visor. Up close the smile is less unsettling and more exhausted — like someone who decided to be threatening because it was simpler.

  The Ghost is barely there. Faded jacket, soft voice. They don't introduce themselves. They just sit next to you on the fountain's edge like they've known you for a while.

  The Builder speaks first. "You came from the road. That means you were in Chapter 1."

  Not a question.`,
      choices: [
        { label: '"I finished Chapter 1."',          sub: 'Straightforward — neutral response', next: 'faction_talk_honest' },
        { label: '"I survived it."',                 sub: 'Evasive — Hunters will like it',     next: 'faction_talk_evasive', moral: -5 },
        { label: '"I helped people along the way."', sub: 'Signal alignment — Builders respond', next: 'faction_talk_helper', moral: 10 },
      ],
    },

    faction_talk_honest: {
      id: 'faction_talk_honest', type: 'story',
      text: `"Finished it," the Builder repeats. "Good. We need people who can finish things."

  The Hunter with the cracked visor tilts their head. "What's your badge?"

  You show them. They study it — all three of them, for a half-second, in the way people do when they're calculating something.

  The Ghost speaks, almost to themselves: "Honest answer. That's unusual here."

  The Builder extends a hand. "Sera. I run the Builders. We salvage, we stabilize, we protect what we build. Join a work rotation for a day and we'll give you access to our stockpile and the path we've been clearing." She pauses. "No obligation. We're not recruiting. We're just solving problems."

  The Hunter doesn't offer a name. "We've identified three faction caches in this district. Sealed. System-protected. The only way to open them is a coordinated push — or convincing someone else to take the risk while you wait for the split." The smile again. "We call it 'Mutual Benefit.'"

  The Ghost looks at the sky. "There are nine elemental zones in this district. I've found two. The System sealed them off when the alliances started fracturing. You want in — you need to be the kind of person a zone will open for."

  Three offers. Three completely different definitions of what it means to be useful.`,
      choices: [
        { label: 'Ask Sera more about the Builders',  next: 'builders_deep' },
        { label: 'Ask the Hunter about the caches',   next: 'hunters_deep' },
        { label: 'Ask the Ghost about the elements',  next: 'ghosts_deep' },
        { label: 'Head into the district',            next: 'district_hub' },
      ],
    },

    faction_talk_evasive: {
      id: 'faction_talk_evasive', type: 'story',
      text: `The Hunter laughs — short and genuine. "Survived it. Yeah. That's the right word."

  Sera, the Builder, doesn't smile. She files something away behind her eyes and waits.

  The Ghost says nothing for a long moment. Then: "You're deciding what version of yourself to be in this chapter. That's fine. We all are."

  The Hunter leans forward. "Here's what I'll tell you. There are three sealed caches in this district. The System put them there. The Builders are going to try to open them cooperatively. They'll succeed, and they'll share the contents, and it will be fair and organized and documented." A pause. "Or — someone could let the Builders do the work, and then take one of the caches while everyone's celebrating the other two." Another pause. "I'm not saying that's a good idea. I'm saying the System allows it. I find that interesting."

  The Hunter stands up. "Name's Voss. Find me when you decide what kind of chapter this is going to be."`,
      choices: [
        { label: 'Follow Voss to learn more',       next: 'hunters_deep' },
        { label: 'Talk to Sera instead',             next: 'builders_deep' },
        { label: 'Talk to the Ghost',                next: 'ghosts_deep' },
        { label: 'Head into the district alone',     next: 'district_hub' },
      ],
    },

    faction_talk_helper: {
      id: 'faction_talk_helper', type: 'story',
      text: `Something shifts in Sera's posture. Not much — she's controlled — but it shifts.

  "Good," she says. "We need people who remember that."

  The Hunter's smile flickers. Recalculating. They don't leave — but they take a small step back.

  The Ghost looks at you steadily. "The System tracked that in Chapter 1. It's tracking it now. I don't know what it does with that information. I don't think we're supposed to know."

  Sera speaks at a normal pace, like she has unlimited time: "We have four active projects. Clearing the east corridor, establishing a medical station near the food court, inventorying the sealed shops, and — the one I actually need help with — the three elemental zones that shut down when the district went hostile. They respond to cooperative energy. My theory is they won't open for someone who came alone with no intention of sharing what they find." She looks at you. "You helped people in Chapter 1. That's a starting point. Work with us for a few hours and I think those zones will open."

  She means it. No negotiation in her voice. Just information, offered without leverage.`,
      choices: [
        { label: 'Agree to work with the Builders', next: 'builders_alliance', moral: 10 },
        { label: 'Ask about the elemental zones',    next: 'ghosts_deep' },
        { label: 'Explore the district first',       next: 'district_hub' },
      ],
    },

    // ═══════════════════════════════
    // FACTION DEEP DIVES
    // ═══════════════════════════════
    builders_deep: {
      id: 'builders_deep', type: 'story',
      text: `Sera walks you through their setup while she works. Compact, efficient — no wasted motion.

  "We have eleven active members. Three more who come and go. In Chapter 1, all of us made choices that pushed our moral scores positive. Not because we were told to. Because we watched what happened when people didn't."

  She shows you the inventory on her tablet. Organized by type, by location, by priority. It's the most structured thing you've seen since the System started.

  "The shopping district has resources. Real ones — not System drops, but actual food, medicine, tools. The sealed shops are full of it. The problem is they're locked. System-locked. The System requires an alliance signature to unlock each one — at least two players with compatible moral profiles, agreeing to share contents." She looks up. "The Hunters figured out the same thing. Their solution was to find someone who would sign as a partner, then take everything and run before the signature expires."

  She goes back to her tablet.

  "We've completed two unlocks. Shared everything both times. The third one is the largest. And we're short a partner with the right profile."

  She doesn't say anything else. She lets you think.`,
      xp: 50,
      choices: [
        { label: 'Offer to be the partner',      sub: 'Alliance signature — moral +15',  next: 'builders_alliance', moral: 15 },
        { label: "Ask what you'd get out of it",  sub: 'Practical question',              next: 'builders_negotiation' },
        { label: 'Keep your options open',        sub: 'Non-committal',                   next: 'district_hub' },
      ],
    },

    builders_negotiation: {
      id: 'builders_negotiation', type: 'story',
      text: `Sera doesn't look offended. She expected the question.

  "Access to our stockpile. A guaranteed share of whatever's in the third cache. Backup on the elemental zones — we've mapped three of the nine and cleared the approaches." She pauses. "And the honest version: we'll vouch for you to the Judges."

  You raise an eyebrow.

  "The Twin Judges — you haven't heard yet?" She sets the tablet down. "The System placed them here when the alliances fractured. Two Judges — Mercy, who looks at what you built, and Wrath, who looks at what you took. At the end of this chapter, everyone faces one of them, or both, or some combination that the System decides based on your record. I don't know exactly how the forms work. I know that the people who worked with us in Chapter 1 — I mean, people who helped others — they faced the less dangerous version."

  She picks the tablet back up.

  "I'm not trying to scare you into it. I'm telling you what I know. You can decide what that's worth."`,
      choices: [
        { label: 'Sign the alliance',  sub: 'moral +15', next: 'builders_alliance', moral: 15 },
        { label: 'Decline, stay free', sub: 'Keep all options',  next: 'district_hub' },
      ],
    },

    builders_alliance: {
      id: 'builders_alliance', type: 'story',
      text: `You sign the alliance interface. A soft chime. A line of text:

  ALLIANCE FORMED: [YOUR NAME] + BUILDERS
  COOPERATIVE PROTOCOL ACTIVE
  BENEFITS: Stockpile access, zone clearance support, vouched reputation

  Sera extends her hand again — this time to shake. "Good. Come find me when you want to work on the cache. In the meantime, the elemental zones should start responding to you." She gestures toward the east side of the district. "Fire zone is that direction. Lightning's near the old sports store. Water's in the food court basement. Start wherever makes sense for how you fight."

  One of the other Builders — a kid, maybe twenty, with a carefully bandaged hand — gives you a small nod as you pass. Not performative. Just acknowledgment.

  Your interface updates: ALLIANCE LOG — Builders: Active. Cooperation credit recorded.`,
      xp: 80,
      rewards: [{ itemKey: 'builders_cache_key', qty: 1 }],
      choices: [
        { label: 'Head to the elemental zones', next: 'district_hub' },
        { label: 'Ask about the Judges',        next: 'judge_lore_builders' },
      ],
    },

    hunters_deep: {
      id: 'hunters_deep', type: 'story',
      text: `Voss takes you somewhere the others can't hear. A gutted electronics shop with all the screens still on, showing static.

  "I'll be straight with you," they say. Which is probably what they say to everyone, you think. But they continue: "The Builders are going to open that third cache. Eleven players, moral scores high, organized — they'll do it. The question is what happens in the four minutes after it opens before they've distributed everything."

  Voss pulls up their interface. "The System is watching cooperation and betrayal in this district. Both. It's not punishing either one — it's measuring. The Judges at the end aren't punishment. They're evaluation. Judge Mercy — Judge of Salvation — evaluates what you built and with whom. Judge Wrath — Judge of Ruin — evaluates what you took and how."

  They look at you. "Most players will face one of them. The ones who split their choices — both cooperation and betrayal in the record — they face both at once. And from what I've gathered, when you push either record far enough, the Judge that matches you doesn't show up as themselves anymore. They show up as something more refined. Absolution. Ruin. There's a name for every form. I don't know all of them."

  They pause. "I've heard it's the hardest fight. I've also heard the rewards are different. The System gives you what matches what you are, not what you want."

  They lean against a broken shelf. "I'm not recruiting you to betray the Builders. I'm telling you the System doesn't care which path you pick. It just wants you to pick deliberately."`,
      xp: 50,
      choices: [
        { label: 'Ask what Voss wants',          next: 'hunters_voss_goal' },
        { label: 'Ask about the elemental zones', next: 'ghosts_deep' },
        { label: 'Head into the district',       next: 'district_hub' },
      ],
    },

    hunters_voss_goal: {
      id: 'hunters_voss_goal', type: 'story',
      text: `"What do I want?" Voss looks almost amused. "I want to face Judge Wrath. Specifically. I want to see what the System thinks I'm worth after everything I've done in this city."

  A pause.

  "I betrayed three people in Chapter 1. None of them were weak. I made choices that lowered my moral score past the point of easy recovery. And I'm not — I don't regret it. I made calculated decisions and they worked." They look at you steadily. "I'm not asking you to do the same. I'm saying the System built a Judge for people like me. That means the System expected people like me. Maybe even needed us."

  They push off the shelf.

  "The elemental zones respond to character. Not good character or bad character. Just clarity. If you know what you are — really know — the zones open. The ones who get stuck are the ones pretending." Voss smiles. "The Shadow zone, specifically, is for people who've made a cost and paid it. If your moral score is below a threshold, it opens easy. If you're faking it — it stays shut."

  They head for the door. "Find the Ghost if you want the map. They've been to all nine."`,
      choices: [
        { label: 'Find the Ghost',          next: 'ghosts_deep' },
        { label: 'Head to the zones alone', next: 'district_hub' },
      ],
    },

    ghosts_deep: {
      id: 'ghosts_deep', type: 'story',
      text: `The Ghost — they eventually tell you their name is Rue — has a map.

  Not a System map. A physical one, drawn on the back of a parking ticket with a pen that's running out of ink. Somehow it's more accurate than your interface.

  "Nine zones," Rue says, spreading it on a dust-covered bench. "One for each element. Fire, Water, Lightning, Arcane, Shadow, Earth, Wind, Plant, Metal. The System placed them in specific locations — each one in a part of the district that matches its nature."

  They trace the path with one finger.

  "Fire's in the old kitchen supply store. Lots of copper and heat damage already — it was near something that burned." A pause. "Water's in the food court basement where the pipes burst. Earth's in the parking structure — concrete, weight, layers. Shadow's under the closed cinema. Wind's in the atrium where the roof caved and the crossdraft never stopped. Lightning's at the old electronics hub." They look up. "Arcane is in the bookshop at the center. Plant is in the garden center near the south exit. Metal is in the hardware megastore."

  Rue rolls the map. "I've been to all nine. None of them opened for me. I'm not sure what I am yet."

  They hand you the map. "Maybe you are."`,
      xp: 60,
      rewards: [{ itemKey: 'district_map', qty: 1 }],
      choices: [
        { label: 'Ask what the zones give you',     next: 'zone_explanation' },
        { label: 'Head into the district',          next: 'district_hub' },
      ],
    },

    zone_explanation: {
      id: 'zone_explanation', type: 'story',
      text: `"Each zone is a skill tree," Rue says. "Elemental. Connected to the five branches — offense, defense, flow, arcane, decay. Each element has variations for each build type, so whatever you focused on in Chapter 1, there's a version of each element that extends it."

  They pause. "You can only activate one element at a time. The System calls it resonance. You can unlock nodes in multiple elemental trees — learn from them, understand them — but only one element resonates actively in any given fight."

  "So pick the one that fits how you fight. Or pick the one the zone opens for. They're not always the same thing."

  A silence.

  "The Judges respond to elemental resonance. Judge Mercy — the cooperation Judge — responds to Water, Plant, Earth, Wind, Arcane. Protective elements. Patient ones. Judge Wrath — the dominance Judge — responds to Fire, Lightning, Shadow, Metal. Aggressive elements. Precise ones."

  Rue looks at the map in your hands. "I don't think either Judge is worse than the other. I think they're the same difficulty, tuned for different kinds of players." A long pause. "I think the System is fair, actually. I just haven't figured out what that means yet."`,
      choices: [
        { label: 'Head to the district hub',  next: 'district_hub' },
      ],
    },

    // ═══════════════════════════════
    // DISTRICT HUB — 9 ELEMENTAL ZONES
    // ═══════════════════════════════
    district_hub: {
      id: 'district_hub', type: 'story',
      text: `The shopping district spreads out before you. Mostly intact structures, mostly emptied of people — whoever was here before the System arrived either left or became something else. The silence has weight. Not the frozen silence of Chapter 1. This is the silence of aftermath.

  Your interface shows ten elemental zones distributed across the district. Some are accessible immediately. Others glow dim — locked, waiting for a threshold you haven't reached yet.

  Below the zone map, two separate indicators:

  ALLIANCE LOG: Active entries determine which Judge evaluates your cooperation record.
  ELEMENTAL RESONANCE: Elements attempted are recorded. Commitment is tracked.

  A quiet system note beneath both:

  "Only one element can be active at a time. Attempting additional elements does not increase rewards. The system is watching what you choose to do with that information."

  The Builders are working somewhere to the east. Voss is watching somewhere to the north. Rue is near the fountain, eyes on the map.

  The district is yours to move through. When you've finished what you came here for — the Judges will find you.`,
      choices: [], // rendered dynamically by renderDistrictHub
    },

    // ═══════════════════════════════
    // NPC CHECK-INS (#1 / #2 / #3)
    // Triggered by interrupt in _goToCore when player heads to district_hub.
    // Each fires once; the marker (sera_met / voss_met / rue_met) is set
    // when the player exits the node via any choice, so the encounter cannot
    // re-fire if reloaded mid-conversation.
    // ═══════════════════════════════
    sera_checkin: {
      id: 'sera_checkin', type: 'story',
      text: `Sera intercepts you near the east edge of the plaza. Same composed posture, same precise way of moving — but she's covered in concrete dust and there's blood drying on one cuff.

"You helped one of our teams. I owed you a conversation." She doesn't smile but her voice softens by a measured degree. "I'm short on field hands. The medical station two blocks over needs a resupply — two medical packs, anything you can spare. The team running it is good, but they're cut off until we can clear the lower corridor."

She watches you, patient.

"Take this as the favor it is. Not an obligation. The Builders don't trade in obligations."`,
      choices: [
        { label: 'Hand over two medical packs', sub: 'Costs 2 medical_pack · Moral +10 · Builder credit', next: 'sera_gave', moral: 10, allianceTag: 'sera_met', requires: [{ itemKey: 'medical_pack', qty: 2 }] },
        { label: '"I don\'t have any to spare."', sub: 'Honest — no penalty', next: 'sera_declined', allianceTag: 'sera_met' },
        { label: 'Walk past her without speaking', sub: 'Moral -5 · the System notes the silence', next: 'sera_ignored', moral: -5, allianceTag: 'sera_met' },
      ],
    },
    sera_gave: {
      id: 'sera_gave', type: 'story',
      text: `Sera takes the packs without ceremony. "Logged. Tam will know." She looks at you a beat longer than she needs to. "Some of us are keeping count of who shows up. I wanted you to know that's a thing."

She turns back toward the corridor. Just before she rounds the corner: "Stay alive."`,
      // Mechanically: 1 rare_component as a small thank-you. The "Builder's
      // Mark" concept (#20 Judge scaling hook) is tracked via alliance_log
      // flags, not a literal inventory item.
      cost: [{ itemKey: 'medical_pack', qty: 2 }],
      rewards: [{ itemKey: 'rare_component', qty: 1 }],
      choices: [{ label: 'Continue', next: 'district_hub', allianceTagRepeatable: 'builders_helped' }],
    },
    sera_declined: {
      id: 'sera_declined', type: 'story',
      text: `Sera nods once — the nod of someone whose first instinct was to be insulted and whose second instinct caught the first. "Understood. Stay alive out there." She turns and goes.

You hear her start running before she's even out of sight.`,
      choices: [{ label: 'Continue', next: 'district_hub' }],
    },
    sera_ignored: {
      id: 'sera_ignored', type: 'story',
      text: `You keep walking. Sera watches you pass. She doesn't follow. She doesn't say anything.

Behind you, after a long pause, her boots scuff and head the other direction.`,
      choices: [{ label: 'Continue', next: 'district_hub' }],
    },

    voss_offer: {
      id: 'voss_offer', type: 'story',
      text: `Voss is leaning on a derelict ATM near the north corridor when you come back. They don't pretend to be doing anything else.

"You're making good time. I noticed." They tilt their head. "There's a Builder runner due through the underpass in maybe ten minutes. Carrying salvage. Decent salvage — Sera's people inventory carefully. If they don't make it back, the salvage is yours and nobody on Sera's side knows for certain what happened."

A small pause. Voss doesn't smile.

"I'm not asking you to pull a trigger. I'm telling you there's an option. Information has value. You don't even have to act on it."`,
      choices: [
        { label: '"Tell me where." (intercept the runner)', sub: 'Moral -15 · gear loot · Voss credit', next: 'voss_intercept', moral: -15, allianceTag: 'voss_met' },
        { label: '"Tell me where." (warn the runner)', sub: 'Moral +10 · Builder credit', next: 'voss_warned', moral: 10, allianceTag: 'voss_met' },
        { label: '"Not interested."', sub: 'No change', next: 'voss_declined', allianceTag: 'voss_met' },
      ],
    },
    voss_intercept: {
      id: 'voss_intercept', type: 'story',
      text: `You take Voss's directions. The underpass is dim, narrow, perfect for the work. The runner doesn't see you coming.

It's the kid. The one with the bandaged hand, from the alliance scene. They look up at the last second. Their hand goes for a tool, not a weapon. They're not even sure how to do this part.

You take what you came for. You don't look at the face for long.

Voss is gone when you get back to the corridor. There's a single rune left on the wall where they were leaning. Bonus. Acknowledgment.`,
      rewards: [{ itemKey: 'rare_component', qty: 2 }, { itemKey: 'rune_umbra', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }],
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'voss_aligned' }],
    },
    voss_warned: {
      id: 'voss_warned', type: 'story',
      text: `You take Voss's directions — and use them the other way. You catch the runner before the underpass, point out where the ambush would be, watch the kid's eyes get very wide.

They press a small foil packet into your hand without breaking eye contact. "Sera will know." They take the long way back.

When you return to the corridor, Voss is still leaning on the ATM. They've watched the whole thing on a salvaged security feed. They don't look angry. They look curious.

"Interesting choice." That's all they say.`,
      rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_metal', qty: 2 }],
      choices: [{ label: 'Continue', next: 'district_hub', allianceTagRepeatable: 'builders_helped' }],
    },
    voss_declined: {
      id: 'voss_declined', type: 'story',
      text: `Voss watches you go without comment. They're still leaning on the ATM when you glance back over your shoulder.

A few minutes later you hear the runner pass through the underpass uneventfully. Voss never moved.

Information has value. Sometimes the value is knowing it was offered, and noting who offered.`,
      choices: [{ label: 'Continue', next: 'district_hub' }],
    },

    rue_intel: {
      id: 'rue_intel', type: 'story',
      text: `Rue is sitting cross-legged on a planter near the fountain, marking up their physical map with a pen that's about to die. They look up when you approach.

"You've cleared two. The pattern's showing." They tap the map. "Hunter scouts have been moving on the zones you haven't hit yet. Voss is testing them. Testing you too, probably."

They turn the map toward you.

"Two of the remaining zones have a Hunter pair set up at the entry. I can tell you which ones. Walk in knowing where they are and you can avoid them clean, or hit them from an angle they're not expecting. Or — your choice — ignore this entirely."

Rue waits. They have all the time in the world.`,
      choices: [
        { label: '"Tell me." (Hunter positions marked on your map)', sub: 'Future zones — clean approach available', next: 'rue_shared', allianceTag: 'rue_met' },
        { label: '"I\'ll figure it out myself."', sub: 'No change', next: 'rue_declined', allianceTag: 'rue_met' },
      ],
    },
    rue_shared: {
      id: 'rue_shared', type: 'story',
      text: `Rue marks two of the remaining zones with a small dot. "Hunters in the entry rooms. You'll see them before they see you if you remember." They roll the map up.

"For what it's worth — they don't all take Voss's offers. Some of them just need the salvage. Up to you what you do when you meet them."

They go back to their pen.`,
      rewards: [{ itemKey: 'district_map', qty: 1 }],
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'rue_aligned' }],
    },
    rue_declined: {
      id: 'rue_declined', type: 'story',
      text: `Rue shrugs — a small, neutral motion. "Suit yourself. I'm not going anywhere." They go back to the map.

You leave them to it.`,
      choices: [{ label: 'Continue', next: 'district_hub' }],
    },

    // ═══════════════════════════════
    // SPARE / EXECUTE REACTIONS
    // ═══════════════════════════════
    // After the player spares or executes a humanoid for the first time, the
    // next time they hit the plaza hub a faction NPC acknowledges it. Each
    // reaction sets a *_reaction_seen flag in alliance_log so it fires once.
    // Sera reacts to spare (Builder-aligned approval, pragmatic).
    // Voss reacts to execute (Hunter-aligned approval, interested).
    // Rue reacts to either (neutral observer, weighs the choice).
    // The interrupts only fire if the player has already met that NPC, so
    // these land as follow-ups rather than introductions.

    spare_reaction_sera: {
      id: 'spare_reaction_sera', type: 'story',
      text: `Sera catches you on the way past the salvage crew. Same dust-streaked sleeves, same controlled posture — but there's something different in her face today. Almost a softening, almost.

"I heard about the scout." She doesn't elaborate on which scout, or which zone. Word travels in the district apparently, and faster than you'd think. "You had them. You didn't take the kill."

She studies you for a moment.

"That used to be the standard out here. Mercy. Before the System sealed the zones and everyone got hungrier." A pause. "I'm not going to thank you for doing the bare minimum. But I'll say — fewer of the Hunters out there think we're worth talking to because of choices like yours. So I'll count it."

She makes a small mark in the notebook she carries everywhere.

"Tam asked after you again, by the way. They keep asking. I keep telling them you're still alive."`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'spare_reaction_seen' }],
    },

    execute_reaction_voss: {
      id: 'execute_reaction_voss', type: 'story',
      text: `Voss is in the plaza when you get there. Not waiting for you — they're never waiting for you, that would be too obvious — but they're close enough that this is happening on purpose.

"You finished one of mine." Voss says it the way someone might note the weather. Cracked visor up, tired face. "Specifically — the scout near the third bend. We found them. Or what was left."

They tilt their head, considering you.

"I'm not angry. The scouts know the risks. What I am, is interested." Voss steps closer. "Most people who come through here freeze when it's a person. They hesitate. They negotiate. They convince themselves the situation isn't what it is. You didn't do that."

A small, dry smile.

"That's the part I wanted to acknowledge. Whatever else happens in this district — you and I are speaking the same dialect now."

Voss steps back.

"My door is open. Just so you know what's in it."`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'execute_reaction_seen' }],
    },

    rue_action_reaction: {
      id: 'rue_action_reaction', type: 'story',
      text: `Rue is in their usual spot — the planter near the fountain, map across their knees. They don't look up when you approach, but they speak before you sit down.

"You had a moment in one of the zones. The kind where the System pauses for a half-second before logging it." They smooth a wrinkle in the paper. "I felt it from here."

Now they look at you. Not judging, not approving — just looking.

"I'm not going to tell you which way you should have decided. I'm not the Judges. But I'll say this — the System keeps a different file on the people who hesitate from the people who don't. You're in one of those files now."

They go back to the map.

"I have no idea which one. That's the honest part."`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'rue_action_reaction_seen' }],
    },

    // ═══════════════════════════════
    // TAM — recurring Builder kid arc (#4)
    // ═══════════════════════════════
    // Tam is the bandaged-handed kid from the cache scene. After meeting
    // the player there, they reappear twice in the mid-chapter: once
    // wounded (mid-1), once at a crossroads being pressured by a Hunter
    // runner (mid-2). Player choices in these scenes feed into how the
    // finales feel — knowing Tam's history shifts the weight of seeing
    // them in the line at the end (hero finale) or as the combat enemy
    // (villain finale).

    tam_wounded: {
      id: 'tam_wounded', type: 'story',
      text: `You're on your way to the next zone when you spot the bandaged hand. Tam is crouched next to a Builder runner you don't recognize — older, maybe early twenties — pressing a cloth against a leg wound that's bleeding through.

  Tam looks up when they see you. The kid's face does something complicated.

  "You're back." A pause. Then: "I— sorry. I keep doing that. I keep saying things like you've been gone. You haven't. You've just been in the zones."

  They go back to working on the bandage. Their hands are steady. The other runner is breathing through clenched teeth.

  "I'm running out of clean cloth," Tam says without looking up. "And we're not far from the medical station but I— this isn't the kind of bleeding you can walk through."

  They finally look at you again.

  "Could you stay? Or — I don't know. Whatever you can do."`,
      choices: [
        { label: 'Help bandage the leg',     sub: 'Stay — moral +5, Builder credit',                              next: 'tam_wounded_help',    moral: 5, allianceTag: 'tam_helped_fire', allianceTagRepeatable: 'builders_helped' },
        { label: 'Give Tam a medical pack',  sub: 'Costs 1 medical_pack — moral +8, deeper Builder credit',       next: 'tam_wounded_medpack', moral: 8, allianceTag: 'tam_gave_medpack',  requires: [{ itemKey: 'medical_pack', qty: 1 }], cost: [{ itemKey: 'medical_pack', qty: 1 }] },
        { label: '"I have to keep moving."', sub: 'Walk on — moral -3, Tam notes the choice',                     next: 'tam_wounded_left',    moral: -3, allianceTag: 'tam_walked_past' },
      ],
    },

    tam_wounded_help: {
      id: 'tam_wounded_help', type: 'story',
      text: `You kneel down and take the bandage from Tam. The runner's leg is worse up close — a deep cut, edges already starting to inflame. You hold pressure while Tam tears strips from their own jacket.

  Neither of you talk for a while. The breathing of the wounded runner slows. After maybe ten minutes, the bleeding eases.

  Tam exhales for what feels like the first time.

  "Their name is Dov," Tam says. "They have a daughter in the medical station. She's going to be — okay. Because of you."

  The kid stands up. Their hand brushes yours, very brief, very deliberate. It's the kind of touch a kid gives someone they want to remember.

  "I'll get them moving. Thank you. Really."`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid1_seen' }],
    },

    tam_wounded_medpack: {
      id: 'tam_wounded_medpack', type: 'story',
      text: `You pull a medical pack from your kit and hand it over. Tam takes it carefully, the way you'd take something fragile.

  "You— okay. Okay. This is— this is way more than I was asking for."

  Tam tears the pack open. The proper bandage goes on cleanly. The wounded runner — Dov, you'll learn the name later — visibly relaxes.

  Tam looks up at you, holding the empty wrapper.

  "You didn't have to do that. You really, really didn't have to do that." They tuck the wrapper into a pocket like it means something. "I'm going to remember this. I know I say that a lot. I keep saying it. But I mean it every time."

  They go back to securing the bandage. The wound looks like it'll hold.`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid1_seen' }],
    },

    tam_wounded_left: {
      id: 'tam_wounded_left', type: 'story',
      text: `"Okay," Tam says quietly. Just that.

  You walk past. The kid doesn't watch you go — they go back to the bandage. The wounded runner — Dov, you'd have learned the name — makes a small sound that might be a thank-you to Tam.

  You keep moving toward the zone.

  You're not sure if what you just felt was guilt or hunger or the System logging something. Maybe all three.`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid1_seen' }],
    },

    // ── Mid-2: Tam at a crossroads ─────────────────────────────────────
    tam_at_crossroads: {
      id: 'tam_at_crossroads', type: 'story',
      text: `You hear the conversation before you see it — Tam's voice, lower than usual, and another voice you don't recognize. You round the corner and find them in a back alley near the plaza edge.

  Tam is talking to a Voss runner. Older, mid-twenties, scar across the jaw. The runner isn't being aggressive — they're being patient, which is somehow worse. Tam looks up when they see you and their face does several things at once.

  The Voss runner notices you too and turns, hands raised slightly.

  "Not what it looks like." The runner has a dry voice. "I'm just — having a conversation with our young friend here about options. The Builders are folding. Everyone in this district knows it. I'm telling them what happens to the kids when a faction folds."

  Tam looks at the ground. Then at you.

  "They've been talking to me for a week. About switching. About what Voss can — what Voss can offer me." The kid's voice is steady but quiet. "I haven't said yes. I haven't said no, either."

  The Voss runner watches you, waiting.`,
      choices: [
        { label: '"Walk away from them, Tam."',         sub: 'Tell Tam to stay loyal — Builder credit',                       next: 'tam_xroads_loyal',   moral: 5,  allianceTag: 'tam_stayed_builder', allianceTagRepeatable: 'builders_helped' },
        { label: '"Tam, you decide. I won\'t."',         sub: 'Respect the kid\'s agency — no faction shift',                  next: 'tam_xroads_neutral', allianceTag: 'tam_chose_own' },
        { label: '"The Voss runner has a point."',      sub: 'Push Tam toward Voss — Hunter credit + Tam uncertain',          next: 'tam_xroads_voss',    moral: -5, allianceTag: 'tam_uncertain' },
        { label: 'Confront the Voss runner',            sub: 'Combat — they\'re a humanoid',                                    next: 'tam_xroads_fight',   allianceTag: 'tam_defended' },
      ],
    },

    tam_xroads_loyal: {
      id: 'tam_xroads_loyal', type: 'story',
      text: `"Walk away from them, Tam." You don't take your eyes off the Voss runner when you say it.

  The runner sighs — a small, patient sigh — and tilts their head toward Tam. "Up to you, kid."

  Tam looks between you for maybe three seconds. Then, very deliberately, walks over and stands next to you. Not close enough to touch, but on your side of the alley.

  The Voss runner shrugs.

  "Fair." They turn and walk away. Slow, unhurried. Not defeated — just done.

  Tam exhales when the runner is out of earshot.

  "I was going to say no. I think. I'm — pretty sure I was going to say no. But I'm glad you came. It's easier with someone behind you."`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid2_seen' }],
    },

    tam_xroads_neutral: {
      id: 'tam_xroads_neutral', type: 'story',
      text: `"Tam, you decide. I won't make this one for you."

  The kid looks at you for a long moment. Surprise — and something else, harder to read. Maybe respect. Maybe loneliness.

  Tam turns to the Voss runner.

  "I need more time."

  The runner nods. "That's fair. I'm here when you've thought about it."

  They leave. Tam stays where they are. After a while, they look at you again.

  "Most people would have told me what to do. The kind ones especially." A pause. "I don't know if what you did was kind. But it felt different from kindness. It felt like — being a person."

  They give you a small, complicated nod and walk back toward the plaza on their own.`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid2_seen' }],
    },

    tam_xroads_voss: {
      id: 'tam_xroads_voss', type: 'story',
      text: `"The runner has a point. The Builders are losing, Tam. You should think about it seriously."

  Tam's face goes very still. The Voss runner is watching you now, not Tam, with a small, dry interest. Like noticing something they didn't expect.

  "Yeah," Tam says. Just that. The kid's voice has gone flat.

  The Voss runner looks at Tam. "We'll talk later, then."

  They nod to you — a brief, professional nod, the kind one professional gives another — and leave.

  Tam stays. They don't look at you for a long time.

  Eventually they say: "I thought you were my friend."

  And then they walk off, alone, toward nowhere in particular.`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid2_seen' }],
    },

    tam_xroads_fight: {
      id: 'tam_xroads_fight', type: 'combat',
      text: `"Step away from the kid." You move between Tam and the Voss runner.

  The runner sighs. "I was being polite. I really was."

  They draw a blade.`,
      enemy: { name: 'Voss Recruiter', icon: '🗡', hp: 130, atk: 18, def: 8, spd: 22, xp: 110, humanoid: true,
        loot: [{ itemKey: 'rare_component', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }] },
      onWin: 'tam_xroads_fight_win', onLose: 'tam_xroads_fight_lose', onEscape: 'tam_xroads_fight_lose',
    },

    tam_xroads_fight_win: {
      id: 'tam_xroads_fight_win', type: 'story',
      text: `The Voss recruiter goes down. You stand over them. Tam is behind you, very quiet.

  The recruiter is alive but out of the fight. The blade is gone, the leg won't hold. They look up at you — that same dry, professional look — and wait.`,
      choices: [
        { label: 'Spare them',   sub: 'Moral +5',                next: 'tam_xroads_fight_spare',   moral: 5,  allianceTag: 'spared_humanoid' },
        { label: 'Finish them',  sub: 'Moral -5, executed flag', next: 'tam_xroads_fight_execute', moral: -5, allianceTag: 'executed_humanoid' },
      ],
    },

    tam_xroads_fight_spare: {
      id: 'tam_xroads_fight_spare', type: 'story',
      text: `You step back. The recruiter watches you for a beat, then nods — the slightest nod, recognition between people who could have killed each other and didn't.

  They drag themselves up against the wall and stay there.

  Tam is staring at you.

  "You— you didn't have to fight them at all. But you did. For me."

  The kid looks at the recruiter, then back at you.

  "Thank you. I'm — I won't forget this."`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid2_seen' }],
    },

    tam_xroads_fight_execute: {
      id: 'tam_xroads_fight_execute', type: 'story',
      text: `You don't pause. The recruiter doesn't make a sound.

  Tam does. A small, sharp inhale. Not a scream — a child realizing what they just watched.

  You wipe the blade. When you look up, Tam is still there but they have stepped back several paces. Their hand is pressed against the wall like they need it to hold them up.

  "Okay." Tam's voice is very even. "Okay. I— I'm going to go now. I'm going to — yeah."

  They walk away. They don't look back.`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid2_seen' }],
    },

    tam_xroads_fight_lose: {
      id: 'tam_xroads_fight_lose', type: 'story',
      text: `The Voss recruiter steps over you, calmly. They tap Tam on the shoulder, conversational.

  "We'll talk later, kid."

  Then they walk away. Tam crouches next to you, panicked, until you can stand.

  "I'm sorry," Tam whispers. "I'm so sorry."`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid2_seen' }],
    },

    // ═══════════════════════════════
    // THE SWEEP (#11) — forced plaza encounter
    // Fires from the hub interrupt when tension >= 35 and !sweep_fired.
    // Player has cleared at least 3 zones by definition (cache must have
    // resolved first, which sets cache_seen). The Sweep is a single major
    // alignment choice — defend, join, or escape — and never re-fires.
    // ═══════════════════════════════
    sweep_arrival: {
      id: 'sweep_arrival', type: 'story',
      text: `You're cutting through the central plaza when you hear it — voices raised, then the wet crack of a fist on a face, then shouting. Builders and Hunters have squared up by the fountain. Eight, maybe ten people total. Sera is in front of her crew, hand up, trying to make the moment hold. Voss is across from her, hands open and empty, smiling the way someone smiles before they tell you something is your fault.

The plaza has been waiting for this. The district has too.

A Hunter on Voss's left pulls a knife — slowly, openly, the way you pull a knife when you want to be sure it gets counted.

Tam — the kid with the bandaged hand — steps from behind Sera. They're holding a length of rebar. Their face is white.

The fight is going to happen in about ten seconds. The only question is who you stand next to when it does.`,
      sysMsg: 'THE SWEEP — district alignment is forcing a clash. Choose carefully.',
      choices: [
        { label: 'Stand with the Builders', sub: 'Defend Sera\'s crew · moral +15', next: 'sweep_defend_combat', moral: 15, allianceTag: 'sweep_builders' },
        { label: 'Stand with the Hunters',  sub: 'Voss has been waiting for this · moral -15', next: 'sweep_join_combat', moral: -15, allianceTag: 'sweep_hunters' },
        { label: 'Leave the plaza',         sub: 'Let them sort it out · cowardice noted', next: 'sweep_escape', allianceTag: 'sweep_walked' },
      ],
    },
    sweep_defend_combat: {
      id: 'sweep_defend_combat', type: 'combat',
      text: `You move to Sera's flank. She doesn't look at you — but her stance shifts, recalibrating around the new line. Tam slides in behind you. The Hunter on Voss's left lunges first.`,
      enemy: {
        name: 'Hunter Strike Team', icon: '⚔️',
        hp: 180, atk: 24, def: 10, xp: 240,
        // Deliberately NOT humanoid: this is a faction set-piece, not a
        // post-combat mercy beat. The moral choice happens in sweep_arrival.
        loot: [{ itemKey: 'rare_component', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_blade', qty: 1 }],
      },
      onWin: 'sweep_defend_win', onLose: 'district_hub',
    },
    sweep_defend_win: {
      id: 'sweep_defend_win', type: 'story',
      text: `The Hunters break. Two of them are down. The rest drag the wounded away — including Voss, who walks out under their own power, blood on their cheek and that same small smile fixed in place.

Sera lowers her hands slowly. The plaza is loud with breathing.

"You picked a side, then." She doesn't say thank you. She nods once.

Tam is staring at you. They look — not impressed. Steady. Like they're memorizing your face for later. They give a small nod and step back behind Sera.

Your interface registers a quiet update: ALLIANCE LOG — Builders: Sweep defended. The System has logged the moment.`,
      rewards: [{ itemKey: 'rare_component', qty: 1 }, { itemKey: 'medical_pack', qty: 2 }],
      choices: [{ label: 'Continue', next: 'district_hub' }],
    },
    sweep_join_combat: {
      id: 'sweep_join_combat', type: 'combat',
      text: `You step across the line. Voss's smile widens a fraction — they've been watching this potential the whole chapter. The Builders see you move and Sera's expression goes very still. Tam's hand tightens on the rebar.

Sera moves first. She always was the calmest fighter in the district.`,
      enemy: {
        name: 'Builder Strike Team', icon: '🛡️',
        hp: 200, atk: 22, def: 14, xp: 240,
        loot: [{ itemKey: 'rare_component', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_shield', qty: 1 }],
      },
      onWin: 'sweep_join_win', onLose: 'district_hub',
    },
    sweep_join_win: {
      id: 'sweep_join_win', type: 'story',
      text: `Sera goes down first. She fights well — she fights better than you expected — but she fights without joy, and that's the difference.

When it's over, Tam is still standing. They're holding the rebar in both hands now, knuckles white, looking at Sera on the ground.

Voss puts a hand on your shoulder, briefly. "You'll be famous in this district," they say. "For a little while. Then you'll be useful, which is better."

Tam doesn't move. They're staring at Sera. They're not going to forget this. Neither are you.

Your interface registers a quiet update: ALLIANCE LOG — Hunters: Sweep joined. The System has logged the moment.`,
      rewards: [{ itemKey: 'rare_component', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }],
      choices: [{ label: 'Continue', next: 'district_hub' }],
    },
    sweep_escape: {
      id: 'sweep_escape', type: 'story',
      text: `You back out of the plaza before either side notices you arrive. You hear it start behind you — the first shout, then the first crash, then a sound that might be a body hitting tile.

You don't turn around.

You find a side corridor and keep moving. By the time the sounds fade you're three blocks away and you don't know who won.

Later, in the hub, the district feels different. Neither faction is in their usual position. People are missing on both sides. Nobody asks where you were. The way nobody asks is its own kind of answer.

Your interface registers a quiet update: ALLIANCE LOG — Sweep avoided. The System has logged the silence.`,
      choices: [{ label: 'Continue', next: 'district_hub', allianceTagRepeatable: 'cowardice' }],
    },

    // ═══════════════════════════════
    // PURE HERO FINALE (#27)
    // Intercepts at pre_boss_ch2 entry when:
    //   moral_score >= 60  AND
    //   alliance_log includes 'sweep_builders'  AND
    //   >= 5 zone bosses cleared
    // Sera offers a last defense of the plaza. Player can accept to lock the
    // hero finale (defends with Builder allies, then Judges fight where
    // Mercy is fully present) or decline (proceeds to normal Judges flow).
    // ═══════════════════════════════
    hero_finale_offer: {
      id: 'hero_finale_offer', type: 'story',
      text: `Sera is waiting for you at the edge of the plaza. The Builders have been quietly working — you can see it now in the way the rubble has been moved, the lines of sight cleared, the choke points planned.

"The Judges are coming." She's not asking. She's stating it. "We've been watching the system messages. We have maybe an hour. Maybe less."

Tam steps up beside her. The bandage on their hand is gone. There's a new scar there instead — a clean line, healed past the worst of it.

"We're going to defend this plaza," Sera says. "Not because we think we'll stop them. Because we want them to see a district that didn't fold." She looks at you steadily. "We'd like you to stand with us. One last fight before the assessment. The Judges will see it. They'll see what kind of place you helped make."

Behind her, the other Builders are taking positions. A dozen of them. Not many. Enough.

"This isn't required. You can walk past us right now and the Judges will still come for you. The fight just won't have us in it."`,
      sysMsg: 'HERO TRACK UNLOCKED — defend the plaza with the Builders before facing the Judges.',
      choices: [
        { label: 'Stand with them', sub: 'Defensive fight · Mercy will see this · moral +10', next: 'hero_finale_combat', moral: 10, allianceTag: 'hero_finale_done' },
        { label: 'Walk past — face the Judges alone', sub: 'Normal Judges fight', next: 'pre_boss_ch2' },
      ],
    },
    hero_finale_combat: {
      id: 'hero_finale_combat', type: 'combat',
      text: `The Hunter remnants come fast — Voss not among them, but their best operators. Sera's line holds. Tam's holds. You're at the apex of the formation. The first wave breaks against you like a wave on cliff.`,
      enemy: {
        name: 'Hunter Remnants', icon: '⚔️',
        hp: 240, atk: 26, def: 12, xp: 280,
        loot: [{ itemKey: 'rare_component', qty: 2 }, { itemKey: 'medical_pack', qty: 2 }, { itemKey: 'scrap_shield', qty: 1 }],
      },
      onWin: 'hero_finale_done', onLose: 'pre_boss_ch2',
    },
    hero_finale_done: {
      id: 'hero_finale_done', type: 'story',
      text: `The Hunters break. Not many of them die. They retreat in good order — Voss's training showing in how they pull back.

Sera lets out a breath she's clearly been holding for a long time. She turns to face you. "Thank you." Just that, just two words, said the way she says things she means.

Tam looks at you. There's something in their face you haven't seen there before. Permission, maybe. The kind of permission a kid grants an adult after long observation.

"Mercy will see this," Sera says. "She's the one who designed this kind of mattering."

The plaza is quiet again. The Judges are coming. But this time you won't be standing in it alone.`,
      rewards: [{ itemKey: 'rare_component', qty: 1 }, { itemKey: 'medical_pack', qty: 3 }],
      choices: [{ label: 'Face the Judges', next: 'pre_boss_ch2' }],
    },

    // ═══════════════════════════════
    // PURE VILLAIN FINALE (#26)
    // Intercepts at pre_boss_ch2 entry when:
    //   moral_score <= -60  AND
    //   alliance_log includes 'sweep_hunters'  AND
    //   >= 5 zone bosses cleared
    // Voss offers a final sweep of the last Builder positions, with Tam
    // standing in the way. Player can complete the run (Judges fight where
    // Wrath dominates entirely) or decline (proceeds to normal Judges).
    // ═══════════════════════════════
    villain_finale_offer: {
      id: 'villain_finale_offer', type: 'story',
      text: `Voss intercepts you in the corridor approaching the plaza. The smile is there but it's tired around the edges. They've been working.

"There's one more position." They don't bother with preamble anymore — you're past that. "The Builders' last holdout. Three of them. The kid is with them. We can clear it before the Judges arrive. The Judges will see a district that committed all the way."

A pause. They're watching your face.

"I'm not asking you to do something I haven't done. But you're better at it than I am now. You've been moving differently the last few zones. Like you stopped needing to think about it."

The corridor is dark. The Judges are coming. Voss isn't going to ask twice.`,
      sysMsg: 'VILLAIN TRACK UNLOCKED — finish the district before facing the Judges.',
      choices: [
        { label: 'Finish it', sub: 'Final sweep · Wrath will see this · moral -10', next: 'villain_finale_combat', moral: -10, allianceTag: 'villain_finale_done' },
        { label: 'Walk past — face the Judges alone', sub: 'Normal Judges fight', next: 'pre_boss_ch2' },
      ],
    },
    villain_finale_combat: {
      id: 'villain_finale_combat', type: 'combat',
      text: `The Builders' last position is a service corridor. Two of them go down fast — they were tired. The third puts up a real fight before Voss takes them from behind.

Then it's just the kid. Tam. Standing in front of a doorway. Holding the same length of rebar from the plaza. They've been crying. They are not crying now.`,
      enemy: {
        name: 'Tam', icon: '⚔️',
        hp: 130, atk: 24, def: 10, xp: 200,
        humanoid: true,
        loot: [{ itemKey: 'rare_component', qty: 1 }, { itemKey: 'medical_pack', qty: 2 }],
        executeLoot: [{ itemKey: 'judges_seal', qty: 1 }],
      },
      onWin: 'villain_finale_done', onLose: 'pre_boss_ch2',
      onSpare: 'villain_finale_done_spared',
      onExecute: 'villain_finale_done_executed',
    },
    villain_finale_done: {
      id: 'villain_finale_done', type: 'story',
      text: `Tam is down. Voss steps past you, checks them, says nothing. The corridor is silent in a way the district has never been.

"It's done." Voss is matter-of-fact. They look at you with something that's not quite respect but isn't far from it. "Wrath will see this. Mercy won't even speak. That's the form you've earned."

The Judges are still coming. But there's nothing left in this district for them to weigh except you.`,
      choices: [{ label: 'Face the Judges', next: 'pre_boss_ch2' }],
    },
    villain_finale_done_spared: {
      id: 'villain_finale_done_spared', type: 'story',
      text: `Tam is on the ground but breathing. You step over them. Voss watches.

"Interesting," Voss says. Just that.

You don't look back. The Judges are coming.`,
      choices: [{ label: 'Face the Judges', next: 'pre_boss_ch2' }],
    },
    villain_finale_done_executed: {
      id: 'villain_finale_done_executed', type: 'story',
      text: `Tam doesn't make a sound. You move past Voss without looking at them. The seal on Tam's vest comes off easily — Sera's mark. You take it.

When you step back into the corridor, Voss is gone. The plaza is empty.

The Judges are already there.`,
      rewards: [{ itemKey: 'judges_seal', qty: 1 }],
      choices: [{ label: 'Face the Judges', next: 'pre_boss_ch2' }],
    },

    // ═══════════════════════════════
    // NPC TRADER
    // ═══════════════════════════════
    trader_intro: {
      id: 'trader_intro', type: 'story',
      text: `The intact shop is a narrow space — a phone repair kiosk that someone has converted into something else. Behind the counter sits a small person with careful hands and a headset they're not using anymore.

  They look up when you enter. Not startled. Like they've been waiting.

  "You're not from this district," they say. "Good. The ones from here bring too much history."

  They gesture at the shelves behind them. Not phone parts anymore — material goods, System-compatible items, a few things you recognize from Chapter 1 loot tables.

  "I trade for scraps, for information, and occasionally for favors. Standard System economy." They tilt their head. "You look like you need something. You also look like you're not sure what it is yet. That's fine. Take a look."

  A name tag on the counter reads PELL, written in careful block letters.`,
      choices: [
        { label: 'Browse Pell\'s stock',     sub: 'See what\'s available',      next: 'trader_shop',  allianceTag: 'pell_met' },
        { label: 'Ask Pell about the zones', sub: 'They might know something',  next: 'trader_lore',  allianceTag: 'pell_met' },
        { label: 'Ask about the Judges',     sub: 'Get a neutral read',         next: 'trader_judges', allianceTag: 'pell_met' },
        { label: 'Leave the shop',           sub: 'Continue into the district', next: 'district_hub', allianceTag: 'pell_met' },
      ],
    },

    trader_shop: {
      id: 'trader_shop', type: 'story',
      text: `Pell slides a short list across the counter. Handwritten, organized into columns.

  WEAPONS: Notched blade (atk +6), Shock rod (atk +4, lightning damage), Reinforced gloves (atk +3, guard +2)

  ARMOR: Patchwork vest (def +8), Wired jacket (def +5, speed +2), Glass-fiber shield (guard +8)

  CONSUMABLES: Stabilizer pack (restore 40 HP), Signal jammer (1-turn enemy stun), Adrenaline spike (speed +5 for 1 fight)

  MATERIALS: Scrap runs, component packs, and two items marked ELEMENTAL REAGENT — one labeled Ignis Seed, one labeled Aqua Cord.

  "Elemental Reagents are new this chapter," Pell says. "They don't do anything on their own. Take them to the right zone and they open the zone faster — like a key that makes the lock easier." They shrug. "Or don't. The zones open for the right person without any key. It just takes longer."`,
      rewards: [],
      choices: [
        { label: 'Buy the Ignis Seed for 80 gold',        sub: 'Fire zone accelerant', next: 'buy_ignis_seed' },
        { label: 'Buy the Aqua Cord for 80 gold',         sub: 'Water zone accelerant', next: 'buy_aqua_cord' },
        { label: 'Buy a Stabilizer pack for 50 gold',     sub: 'Restore 40 HP', next: 'buy_stabilizer' },
        { label: 'Look but don\'t buy anything',          next: 'trader_intro' },
      ],
    },

    buy_ignis_seed:  { id:'buy_ignis_seed',  type:'story', text:`Pell wraps it in foil. "Don't drop it. It doesn't explode but it does stain everything permanently orange."`, rewards:[{itemKey:'ignis_seed',qty:1}], choices:[{label:'Continue', next:'district_hub'}] },
    buy_aqua_cord:   { id:'buy_aqua_cord',   type:'story', text:`Pell hands it over — a length of silvery cord that's always slightly damp. "Don't ask what it's made of. I asked. I regret it."`, rewards:[{itemKey:'aqua_cord',qty:1}], choices:[{label:'Continue', next:'district_hub'}] },
    buy_stabilizer:  { id:'buy_stabilizer',  type:'story', text:`Pell slides the pack across without ceremony. "Reliable. I've tested everything I sell." They say it flatly enough that you believe them.`, rewards:[{itemKey:'stabilizer_pack',qty:1}], choices:[{label:'Continue', next:'district_hub'}] },

    trader_lore: {
      id: 'trader_lore', type: 'story',
      text: `Pell leans on the counter.

  "The nine zones were always here. Before the System activated — they were just buildings. Places. The fire zone was a kitchen supply store. The lightning zone was an electronics hub." They pause. "The System put something in them when it arrived. Not locked them — seeded them. Like it was curious what would grow."

  A quiet moment.

  "The zones respond to resonance. That's the official System term. Resonance is what happens when who you are and what you're standing in match closely enough. A fire zone resonates with aggression — not anger, aggression. The kind that's cold and deliberate. A water zone resonates with patience — not passivity, patience. The ability to absorb and redirect." Pell tilts their head. "I've been in and out of this district for a week. I think about it differently now."

  "The zones don't want you to be special. They want you to be consistent."`,
      choices: [
        { label: 'Ask about the Judges', next: 'trader_judges' },
        { label: 'Go to the district',   next: 'district_hub' },
      ],
    },

    trader_judges: {
      id: 'trader_judges', type: 'story',
      text: `Pell's expression changes slightly. More careful.

  "The Judges. Right." They come around the counter and sit on a stool. "I saw Mercy once, at the end of someone else's run. Briefly. It looked like — the most patient thing I've ever seen. Like it had been waiting a very long time and wasn't surprised by anything."

  A long pause.

  "Wrath I've only heard about. Players who faced Wrath describe it as... precise. Like it already knew what you'd done and was just confirming the math. No judgment in the face. Just accounting."

  Pell looks at you directly.

  "I don't know which one you'll face. I don't think anyone does until the chapter ends. But I'll tell you what I've observed: the players who faced both at once — the ones who did some of everything — they came out changed differently than the ones who faced just one. Not better or worse. Just different kinds of changed." 

  They stand and go back behind the counter.

  "Both Judges can be beaten. Both Judges can be respected. The System doesn't punish you for who you are. It evaluates you. That's different."`,
      choices: [
        { label: 'Go into the district', next: 'district_hub' },
      ],
    },

    // ═══════════════════════════════
    // THE BETRAYAL OPPORTUNITY
    // ═══════════════════════════════
    cache_betrayal_offer: {
      id: 'cache_betrayal_offer', type: 'story',
      text: `You're passing through the east corridor when Voss falls into step beside you. Silent until they choose to speak.

  "The Builders are signing the third cache right now," Voss says. "Sera and two others. Alliance signature, full cooperative protocol." A pause. "There's a four-minute window after the cache opens where the distribution protocol hasn't locked in. Items are accessible to anyone with hands."

  They keep walking.

  "I'm not going to take it. I want to be clear — I'm not doing this. My record is already what it is and one cache isn't interesting to me." They glance sideways at you. "But someone could. The Builders trust you. You could be standing right there."

  They stop walking.

  "I'm telling you because the System knows about this opportunity whether you take it or not. The Judges know. Mercy will know you didn't betray your allies. Wrath will know you chose not to when you could." Voss almost smiles. "Either way, it becomes part of your record. Deliberate choice is what matters — not which choice."

  They start walking again. "I'm going to the Shadow zone now. It's been open for me since the first day."`,
      choices: [
        { label: 'Go to the cache — consider it',     sub: 'See what the Builders found', next: 'cache_consider', moral: -5, allianceTag: 'cache_seen' },
        { label: 'Walk away from the offer',           sub: 'Your record stays clean — moral +10', next: 'cache_refused', moral: 10, allianceTag: 'cache_seen' },
        { label: 'Report the offer to Sera',           sub: 'Build trust — moral +20',    next: 'cache_reported', moral: 20, allianceTag: 'cache_seen' },
      ],
    },

    cache_consider: {
      id: 'cache_consider', type: 'story',
      text: `You go to the cache opening.

  The Builders are there — Sera, two others named Dov and Mira, and the bandaged-hand kid from yesterday. They've completed the unlock. The cache is open. Contents spill out on a cloth they've laid on the floor: medical supplies, two weapon upgrades, three material packs, and a sealed System container with a glyph on the side.

  Sera looks up and nods at you. Waves you closer. She's already started tallying the split.

  The four-minute window ticks in your peripheral interface. Invisible to them.

  You look at the cache. You look at Sera's careful hands doing the tally. You look at the bandaged kid taking inventory with a cracked stylus.

  Your interface: MORAL DECISION POINT. This action will be recorded.

  Two paths forward from here — take, or stand.`,
      choices: [
        { label: 'Take nothing — stand with the Builders', sub: 'moral +15, full alliance maintained', next: 'cache_stood', moral: 15 },
        { label: 'Take the sealed container and leave',    sub: 'Betrayal — moral -40. Recorded permanently.', next: 'cache_betrayed', moral: -40 },
      ],
    },

    cache_stood: {
      id: 'cache_stood', type: 'story',
      text: `The four minutes pass. The distribution protocol locks in.

  Sera hands you your share: a medical pack, a material bundle, and a small weapon component you don't have a name for yet.

  "Good work," she says, without looking up.

  The bandaged kid — you learn their name is Tam — gives you a fistbump. Unselfconscious. Like it was the obvious thing to do.

  Your interface: ALLIANCE LOG UPDATED. Cache cooperation recorded. Mercy weight +3.

  You don't feel heroic. You feel like someone who made a decision and then stuck with it. The System doesn't seem to have an opinion about that distinction.

  Sera catches your eye. "The Judges will see this. What you could have done and didn't. I think that matters to Mercy." She pauses. "I think it matters to Wrath too, differently."`,
      xp: 100,
      rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_metal', qty: 3 }],
      choices: [
        { label: 'Head to the elemental zones', next: 'district_hub' },
      ],
    },

    cache_betrayed: {
      id: 'cache_betrayed', type: 'story',
      text: `You take the sealed container. Move fast. Out of the room before the distribution protocol locks in.

  Sera's voice, behind you: "—hey—"

  You don't stop.

  Outside, the container opens: two item upgrades, a rare material. Worth something.

  Your interface: BETRAYAL RECORDED. Alliance: Builders — BROKEN. Moral −40. Backstab counter: +1. Wrath weight +5.

  The container is in your pack. The items are real. The record is real.

  Voss passes you on a side corridor without stopping. Just a small nod — not approval, just acknowledgment. You made a deliberate choice. They respect deliberate choices.

  The Builders won't trust you again this chapter. Some zones that respond to cooperation will be harder to access now. The Shadow zone, however, and the Fire zone — your interface shows them both lit up clearly. Resonating.

  The System didn't punish you. It updated you.`,
      xp: 60,
      rewards: [{ itemKey: 'rare_component', qty: 1 }, { itemKey: 'scrap_metal', qty: 2 }],
      choices: [
        { label: 'Head to the Shadow zone', sub: 'Now open to you', next: 'zone_shadow' },
        { label: 'Go to the district hub',  next: 'district_hub' },
      ],
    },

    cache_refused: {
      id: 'cache_refused', type: 'story',
      text: `You keep walking. Voss watches you go.

  Later, Sera finds you near the map station. "Voss told me what they offered you." She's direct about it, no setup. "Thank you for not taking it."

  "You weren't there," you say.

  "I know. That's why it counts."

  She adds something to your share of the cache distribution — a small extra, unmarked. The bandaged kid, Tam, gives you a more formal nod this time. Like something's been decided about you.

  Your interface: MORAL RECORD — Refusal logged. Mercy weight +5. Wrath weight −2.

  It doesn't feel like a big moment. It probably shouldn't.`,
      xp: 120,
      rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_metal', qty: 4 }],
      choices: [
        { label: 'Head to the elemental zones', next: 'district_hub' },
      ],
    },

    cache_reported: {
      id: 'cache_reported', type: 'story',
      text: `You find Sera before the opening. Tell her what Voss offered. No commentary — just the facts.

  She listens without interrupting. When you finish she nods once.

  "Voss does this," she says. "Tests people. I don't think they're malicious. I think they're curious." A pause. "We'll keep an eye on the window. Thank you."

  At the cache opening, Voss appears. They see you. They see Sera's people distributed around the room. They see you meet their eye.

  For a moment nothing happens.

  Then Voss nods — small, real — and leaves without a word.

  Sera's team completes the opening cleanly. Your share is full, plus a bonus Sera calls "trustworthy conduct." Tam high-fives you. You let them.

  Interface: TRUST EVENT RECORDED. Alliance: Builders — Reinforced. Mercy weight +8. Moral +20. Permanent flag: "Can be trusted under pressure."`,
      xp: 150,
      rewards: [{ itemKey: 'medical_pack', qty: 2 }, { itemKey: 'scrap_metal', qty: 5 }],
      choices: [
        { label: 'Head to the elemental zones', next: 'district_hub' },
      ],
    },

    // ═══════════════════════════════
    // SYSTEM ESCALATION NODES
    // (triggered when player enters a 2nd or 3rd+ element zone)
    // ═══════════════════════════════
    zone_second_element_warning: {
      id: 'zone_second_element_warning', type: 'story',
      text: `Your interface flickers.

  Not a glitch. Something deliberate.

  A single line appears in a font you haven't seen the system use before — slightly smaller, monospace, cold:

  "Greed detected."

  A pause. Then:

  "Deviation from chosen path observed."

  The zone behind you closes. Not locked — just no longer interested in you. The elemental resonance you carried into it reads as background noise now. Whatever it recognized in you was already spent elsewhere.

  The new zone ahead activates anyway. The System doesn't close doors out of punishment. It opens them without enthusiasm.

  Your interface updates: Enemy parameters escalating.
  All enemies in remaining zones: ×2 HP, ATK, DEF, SPD.
  XP per kill: unchanged.

  The next zone will not provide guidance. The system has stopped calibrating for your success.`,
      sysMsg: 'Deviation from chosen path observed. Escalating trial parameters.',
      choices: [
        { label: 'Continue into the district', next: 'district_hub' },
      ],
    },

    zone_third_element_warning: {
      id: 'zone_third_element_warning', type: 'story',
      text: `No flicker this time.

  The system message appears directly on top of your field of view — not in the interface panel, not in a notification. Embedded in your vision like a heads-up display that doesn't belong to you:

  "Power without commitment is instability."

  Then:

  "Escalating trial parameters."

  Then nothing. The message doesn't clear. It fades, slowly, over fifteen seconds. Like it wants you to read it multiple times.

  The zone ahead is active. The enemies inside are — different. Not visually. But the way they move has changed. Faster. More deliberate. Like something recalibrated them while you were deciding to come here.

  Your interface: All enemies — ×4 HP, ATK, DEF, SPD.
  Environmental hazards: active.
  System support: withdrawn.

  A final line, in a smaller font than everything else, as if the system is saying it to itself:

  "You were given a path. You chose to take more. Now survive the weight of it."`,
      sysMsg: 'Power without commitment is instability. Parameters at ×4. System support withdrawn.',
      choices: [
        { label: 'Enter the zone anyway', next: 'district_hub' },
      ],
    },

    judge_lore_builders: {
      id: 'judge_lore_builders', type: 'story',
      text: `"Mercy and Wrath," Sera says. "We've been piecing together what we know."

  She sits down. This is a longer conversation.

  "Mercy appeared at the end of Chapter 1 for two players on our network who we know had high cooperation scores. Both described the same thing: an entity that was calm, precise, and — strange word for a System entity — kind. Not soft. Just fair. It evaluated what they built, who they helped, what they gave up. It didn't ask them to justify their choices. It just — confirmed them. And then it fought them."

  "It's still a boss fight?"

  "It's still a boss fight." She almost smiles. "The System evaluates you and then tests you. That's what it does. Mercy is hard. But the players who faced it said it felt like the System respecting them enough to take them seriously." 

  She pauses.

  "Wrath. The two people I know of who faced Wrath were quieter about it afterward. Not damaged — just quieter. One of them said: 'It knew exactly what I'd done and it didn't blink. It just wanted to see if I was as good at fighting as I was at taking.'" She looks at you. "Both players survived. Both players changed differently."`,
      choices: [
        { label: 'Head to the elemental zones', next: 'district_hub' },
      ],
    },

    // ═══════════════════════════════
    // PRE-BOSS GATE — routes through camp_reflection on first time
    // ═══════════════════════════════
    // The district hub points here instead of pre_boss_ch2 directly. On first
    // visit, the player is routed through camp_reflection to give the chapter
    // a quiet before-the-storm moment. Subsequent visits (replay, back-button)
    // go straight to pre_boss_ch2.
    pre_boss_gate: {
      id: 'pre_boss_gate', type: 'story',
      sysMsg: '',
      text: '',
      choices: [], // filled by route() — see below
      route(p) {
        return (p.alliance_log || []).includes('camp_seen')
          ? 'pre_boss_ch2'
          : 'camp_reflection'
      },
    },

    // ═══════════════════════════════
    // CAMP REFLECTION — the night before the Judges
    // ═══════════════════════════════
    // Text is composed at render-time from buildCampReflection(player).
    // Sets camp_seen on exit so it cannot re-fire if the player backs out
    // and returns later. Single choice leads to pre_boss_ch2.
    camp_reflection: {
      id: 'camp_reflection', type: 'story',
      sysMsg: 'CHAPTER ASSESSMENT BEGINNING — reflection logged.',
      text: '', // built dynamically
      choices: [
        { label: 'Walk back out into the plaza', sub: 'The Judges are summoning. You are ready.', next: 'pre_boss_ch2', allianceTag: 'camp_seen' },
      ],
    },

    // ═══════════════════════════════
    // PRE-BOSS CONVERGENCE
    // ═══════════════════════════════
    pre_boss_ch2: {
      id: 'pre_boss_ch2', type: 'story',
      text: `Your interface pulses once. An unfamiliar color — not the usual gold. Something cooler. More deliberate.

  CHAPTER ASSESSMENT COMPLETE.
  MORAL RECORD: Compiled.
  ALLIANCE LOG: Compiled.
  ELEMENTAL RESONANCE: Recorded.
  ELEMENTS ATTEMPTED: Recorded.

  TWIN JUDGES: Summoned.

  The district goes quiet in a new way. Not the System-pause quiet. Not the aftermath quiet. A third kind of quiet — expectation made physical.

  The plaza is empty now. The Builders are gone. Voss is gone. Rue is gone. Pell's shop is dark.

  It's just you and the fountain and the broken glass and whatever's coming.

  Two shapes at the far end of the plaza. One moving toward you with the patience of something that has been waiting in exactly this way for exactly this moment. The other standing still — already there, somehow, without having arrived.

  Your interface shows both:

  JUDGE MERCY — Judge of Salvation
  JUDGE WRATH — Judge of Ruin

  Two axes. Two records. Both present.

  A system message, the last one before the fight:

  "The system adapts to human choices. This is what that looks like."

  Below it, quieter, as if the system didn't mean for you to read it:

  "The form this takes depends on what you built. Both of what you built."`,
      choices: [
        { label: 'Face the Twin Judges', sub: 'Boss fight — your full record determines the encounter', next: 'judges_verdict' },
      ],
    },

    // ═══════════════════════════════
    // JUDGES VERDICT — dynamic record readout
    // (text composed at render-time from real player state)
    // ═══════════════════════════════
    judges_verdict: {
      id: 'judges_verdict', type: 'story',
      sysMsg: 'TWIN JUDGES — Record review in progress.',
      text: '',
      choices: [
        { label: 'Stand before them', sub: 'The reading is finished. The fight begins.', next: 'boss_judges' },
      ],
    },

    // ═══════════════════════════════
    // BOSS FIGHT — TWIN JUDGES
    // ═══════════════════════════════
    boss_judges: {
      id: 'boss_judges', type: 'boss',
      text: `The reading is finished. The interfaces fold away — every choice, every alliance, every elemental zone, every life ended or spared, returned to wherever the System keeps things it has already accounted for.

  Both Judges look at you now. Not the record — you.

  Mercy's halo settles into its working state, twice the complexity of any System display you've seen.
  Wrath's compression sharpens.

  Neither of them speaks again.

  The fight begins.`,
      enemy: {
        name: 'The Twin Judges',
        icon: '⚖️',
        hp: 380,
        atk: 22,
        def: 14,
        xp: 600,
        img: '../assets/boss/equilibrium.webp',
        loot: [{ itemKey: 'judges_seal', qty: 1 }, { itemKey: 'rune_lux', qty: 1 }],
      },
      bossKey: 'twin_judges',
      onWin:  'chapter_end_ch2',
      onLose: 'pre_boss_ch2',
    },

    // ═══════════════════════════════
    // CHAPTER END
    // ═══════════════════════════════
    chapter_end_ch2: {
      id: 'chapter_end_ch2', type: 'end',
    },

  } // END NODES

  // ═══════════════════════════════════════════════════════════
  // ENGINE — mirrors chapter1 exactly
  // ═══════════════════════════════════════════════════════════

  function xpForLevel(lv) { return Math.floor(100 * Math.pow(1.5, lv - 1)) }
  function getDefeatedBosses() { return player.defeated_bosses || [] }
  function markBossDefeated(key) { const d=[...getDefeatedBosses()]; if(!d.includes(key)) d.push(key); player.defeated_bosses=d; return d }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch]))
  }

  async function addItem(itemKey, qty) {
    const { data:ex } = await supabase.from('inventory').select('id,quantity').eq('player_id',player.id).eq('item_key',itemKey).maybeSingle()
    if (ex) { await supabase.from('inventory').update({ quantity: ex.quantity + qty }).eq('id', ex.id); return }
    const ITEM_DEF = {
      builders_cache_key: { name:"Builder's Cache Key", item_type:'key',      rarity:'uncommon',  icon:'🗝️' },
      district_map:       { name:'District Map',         item_type:'material', rarity:'common',    icon:'🗺️' },
      ignis_seed:         { name:'Ignis Seed',           item_type:'material', rarity:'uncommon',  icon:'🔥' },
      aqua_cord:          { name:'Aqua Cord',            item_type:'material', rarity:'uncommon',  icon:'💧' },
      stabilizer_pack:    { name:'Stabilizer Pack',      item_type:'consumable',rarity:'common',   icon:'💊', hp_restore:40 },
      medical_pack:       { name:'Medical Pack',         item_type:'consumable',rarity:'common',   icon:'🩹', hp_restore:30 },
      scrap_metal:        { name:'Scrap Metal',          item_type:'material', rarity:'common',    icon:'⚙️' },
      rare_component:     { name:'Rare Component',       item_type:'material', rarity:'rare',      icon:'🔮' },
      judges_seal:        { name:"Judges' Seal",         item_type:'accessory',rarity:'legendary', icon:'⚖️' },
      rune_ignis:         { name:'Ignis Rune',           item_type:'material', rarity:'uncommon',  icon:'🔥' },
      rune_aqua:          { name:'Aqua Rune',            item_type:'material', rarity:'uncommon',  icon:'💧' },
      rune_volt:          { name:'Volt Rune',            item_type:'material', rarity:'uncommon',  icon:'⚡' },
      rune_lux:           { name:'Lux Rune',             item_type:'material', rarity:'uncommon',  icon:'✨' },
      rune_umbra:         { name:'Umbra Rune',           item_type:'material', rarity:'uncommon',  icon:'🌑' },
      rune_terra:         { name:'Terra Rune',           item_type:'material', rarity:'uncommon',  icon:'🪨' },
      rune_aero:          { name:'Aero Rune',            item_type:'material', rarity:'uncommon',  icon:'💨' },
      rune_flora:         { name:'Flora Rune',           item_type:'material', rarity:'uncommon',  icon:'🌿' },
      rune_ferro:         { name:'Ferro Rune',           item_type:'material', rarity:'uncommon',  icon:'⚙️' },
      rune_venin:         { name:'Venin Rune',           item_type:'material', rarity:'uncommon',  icon:'☠️' },
      venom_compound:     { name:'Unstable Compound',    item_type:'consumable',rarity:'rare',     icon:'☠️', hp_restore:0 },
    }
    const def = ITEM_DEF[itemKey] || { name:itemKey, item_type:'material', rarity:'common', icon:'📦' }
    const { error } = await supabase.from('inventory').insert({
      player_id:     player.id,
      item_key:      itemKey,
      quantity:      qty,
      name:          def.name,
      item_type:     def.item_type      || 'material',
      rarity:        def.rarity         || 'common',
      icon:          def.icon           || '📦',
      element:       def.element        || 'none',
      hp_restore:    def.hp_restore     || 0,
      atk_bonus:     def.atk_bonus      || 0,
      def_bonus:     def.def_bonus      || 0,
      power_bonus:   def.power_bonus    || 0,
      guard_bonus:   def.guard_bonus    || 0,
      speed_bonus:   def.speed_bonus    || 0,
      control_bonus: def.control_bonus  || 0,
      insight_bonus: def.insight_bonus  || 0,
      luck_bonus:    def.luck_bonus     || 0,
      agility_bonus: def.agility_bonus  || 0,
      max_hp_bonus:  def.max_hp_bonus   || 0,
      two_handed:    def.two_handed     || false,
      sockets_total: 0,
      sockets_used:  0,
      socketed_runes:[],
    })
    if (error) console.error('[ch2 addItem]', itemKey, error.message)
  }

  // Deduct `qty` of `itemKey` from the player's inventory. Decrements the
  // existing row; deletes the row if quantity hits zero. Silent no-op if the
  // player doesn't have the item — callers should pre-check inventory if the
  // outcome depends on a successful deduction. Used by `cur.cost` arrays.
  async function removeItem(itemKey, qty) {
    const { data:ex } = await supabase.from('inventory').select('id,quantity').eq('player_id',player.id).eq('item_key',itemKey).maybeSingle()
    if (!ex) return
    const remaining = ex.quantity - qty
    if (remaining <= 0) await supabase.from('inventory').delete().eq('id', ex.id)
    else await supabase.from('inventory').update({ quantity: remaining }).eq('id', ex.id)
  }

  // Check whether the player has `qty` of `itemKey` available. Used to gate
  // choices behind inventory costs (e.g. Sera asking for medical packs).
  async function hasItem(itemKey, qty) {
    const { data:ex } = await supabase.from('inventory').select('quantity').eq('player_id',player.id).eq('item_key',itemKey).maybeSingle()
    return !!ex && ex.quantity >= qty
  }

  async function save(updates) {
    Object.assign(player, updates)
    const { data, error } = await supabase.from('players').update(updates).eq('id', player.id).select().single()
    if (error) console.error('[ch2 save]', error.message)
    // Merge DB-returned fields into the existing player object instead of
    // rebinding the variable. Same rationale as ch1/index.js save(): keeps
    // reference identity stable across modules (book.html currentPlayer,
    // sibling pages like skills/inventory) so post-save mutations remain
    // visible everywhere instead of getting orphaned on the old reference.
    if (data) { Object.assign(player, data); currentHp = data.hp }
    renderHUD()
  }

  // ── Hidden class picker — post Twin Judges victory ────────────────────
  // Renders the class-choice cards into the given combat-over container.
  // `choices` is an array of class keys from CLASS_CHOICES. The choice is
  // final: once a card is clicked, pickClass() runs, save() persists, and
  // the player proceeds to the chapter end node. There is no skip and no
  // "decide later" — the dramatic moment is the whole point.
  //
  // Visual: a small stack of cards, one per class. Each shows name, the
  // judge axis, the tagline, and a faint hint of what's inside (first two
  // skill names). Selection is permanent — no confirmation step. The card
  // gets a brief glow on click, then the page advances.
  function renderClassPicker(host, choices, formKey, nextNode) {
    const heading = formKey === 'verdict'
      ? 'ANOMALY CASCADE — three paths recognized. Choose one. The others will not be offered again.'
      : 'ANOMALY DETECTED — the System offers a designation. Choose one. The choice is final.'

    const cards = choices.map(key => {
      const cls = CLASSES[key]
      if (!cls) return ''
      // Peek at tier-1 abilities (branches a/b/c). Falls back to cls.skills
      // for classes that still use the old skills array shape, or to an empty
      // list if neither exists. This avoids the crash that occurred when a
      // class had `tiers:` but no `skills:` (most classes after the v2 refactor).
      let peekItems = []
      if (Array.isArray(cls.tiers) && cls.tiers[0]) {
        const t1 = cls.tiers[0]
        for (const branch of ['a', 'b', 'c']) {
          if (Array.isArray(t1[branch]) && t1[branch][0]) {
            peekItems.push(t1[branch][0])  // ability name only
          }
        }
        peekItems = peekItems.slice(0, 2)
      } else if (Array.isArray(cls.skills)) {
        peekItems = cls.skills.slice(0, 2).map(s => Array.isArray(s) ? s[0] : s)
      }
      const peek = peekItems.map(name => `<li style="margin:0;padding:0;font-family:'Cormorant Garamond',serif;font-size:13px;color:var(--ink-dim);line-height:1.35">▸ ${name}</li>`).join('')
      return `
        <button class="cls-card" data-class="${cls.key}" style="
            text-align:left;cursor:pointer;
            background:rgba(244,234,215,.55);
            border:1px solid ${cls.color}66;
            padding:14px 16px;
            font-family:inherit;color:inherit;
            display:flex;flex-direction:column;gap:8px;
            transition:border-color .15s, background .15s, transform .15s;
        ">
          <div style="display:flex;align-items:baseline;gap:8px">
            <span style="font-family:'Cinzel',serif;font-size:1.05rem;color:${cls.color};font-weight:700;letter-spacing:.06em">${cls.name}</span>
            <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--ink-dim);letter-spacing:.08em">${(cls.judgeOf||'').toUpperCase()}</span>
          </div>
          <p style="margin:0;font-family:'IM Fell English',serif;font-style:italic;font-size:14px;color:var(--ink);line-height:1.4">${cls.tagline||''}</p>
          <ul style="margin:0;padding:0;list-style:none">${peek}</ul>
        </button>`
    }).join('')

    host.innerHTML = `
      <div style="margin-bottom:10px;padding:8px 10px;border:1px solid rgba(155,109,255,.45);background:rgba(155,109,255,.08);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.06em;color:var(--ink)">
        ⚠ ${heading}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">${cards}</div>
    `

    host.querySelectorAll('.cls-card').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(244,234,215,.85)'
        btn.style.transform = 'translateY(-1px)'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(244,234,215,.55)'
        btn.style.transform = 'none'
      })
      btn.addEventListener('click', async () => {
        const classKey = btn.dataset.class
        const cls = CLASSES[classKey]
        if (!cls) return
        // Visual lock: dim other cards, highlight this one, disable clicks.
        host.querySelectorAll('.cls-card').forEach(other => {
          other.style.pointerEvents = 'none'
          if (other !== btn) other.style.opacity = '0.3'
        })
        btn.style.borderColor = cls.color
        btn.style.background = cls.color + '22'

        // Commit the pick: classes.js builds the updates, we apply + save.
        try {
          const upd = pickClass(player, classKey)
          await save(upd)
        } catch (err) {
          console.error('[class pick] failed', err)
          window.showToast?.('Failed to save class — try again', true)
          return
        }

        // Show the unlock narrative as a system overlay, then advance.
        window.showSysOverlay(cls.unlockNarrative, 'warn')
        setTimeout(() => {
          host.innerHTML = `<button class="choice" data-next-node="${nextNode}">
            <span class="choice-arrow">→</span>
            <span class="choice-body">You are <em style="color:${cls.color}">${cls.name}</em>. Continue.</span>
          </button>`
          host.querySelector('[data-next-node]')?.addEventListener('click', e => goTo(e.currentTarget.dataset.nextNode))
        }, 1800)
      })
    })
  }

  // calcBadge is now imported from reputation.js (shared with Ch1 + lobby).

  // ── Chapter Resonance ─────────────────────────────────────────────────────────
  // Resonance is set when the player defeats their first zone boss.
  // It persists for the chapter run. Restarting the chapter resets it.
  const RESONANCE_PREFIX = 'element_resonance_'

  function getChapterResonance() {
    const d = player.defeated_bosses || []
    const entry = d.find(k => k.startsWith(RESONANCE_PREFIX))
    return entry ? entry.replace(RESONANCE_PREFIX, '') : null
  }

  async function setChapterResonance(elementKey) {
    const flag = RESONANCE_PREFIX + elementKey
    if ((player.defeated_bosses||[]).includes(flag)) return // already set
    const d = markBossDefeated(flag)
    await save({ defeated_bosses: d })
    const elName = ELEMENT_NAMES[elementKey] || elementKey
    window.showSysOverlay(
      `Resonance established: ${elName}.\nFor this chapter, the System recognizes you as this.\nThe Judges will evaluate accordingly.`,
      'info'
    )
  }

  function isDeviating(zoneElement) {
    const resonance = getChapterResonance()
    if (!resonance) return false
    return resonance !== zoneElement
  }


  window.goTo = async function goTo(nextId, choice={}) {
    if (!NODES[nextId]) return

    // ── Resonance deviation warning ───────────────────────────────────────────
    // If player has a chapter resonance and is entering a different element zone,
    // show a confirmation overlay before proceeding.
    const zoneElement = ZONE_ELEMENT_MAP[nextId]
    if (zoneElement && isDeviating(zoneElement)) {
      const resonance   = getChapterResonance()
      const resName     = ELEMENT_NAMES[resonance]  || resonance
      const zoneName    = ELEMENT_NAMES[zoneElement] || zoneElement
      const existing    = document.getElementById('deviation-warning')
      if (existing) existing.remove()
      const el = document.createElement('div')
      el.id = 'deviation-warning'
      el.style.cssText = 'position:fixed;inset:0;z-index:800;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:1rem'
      el.innerHTML = `<div style="max-width:400px;background:#12111a;border:1px solid #f4c45a44;padding:1.5rem;border-radius:4px;text-align:center">
        <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:#f4c45a !important;letter-spacing:.12em;margin-bottom:.75rem">DEVIATION DETECTED</p>
        <p style="font-family:'Cormorant Garamond',serif;font-size:1rem;color:#e8e3d6 !important;line-height:1.6;margin-bottom:.5rem">Your chapter resonance is <strong style="color:#f4c45a !important">${resName}</strong>.</p>
        <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:.9rem;color:#a8a09a !important;line-height:1.6;margin-bottom:1.25rem">Entering the ${zoneName} zone will escalate enemy parameters. The Judges will note the deviation.<br><br>This path again?</p>
        <div style="display:flex;gap:.75rem;justify-content:center">
          <button id="deviation-enter-anyway" style="font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.08em;color:#e8e3d6 !important;background:rgba(244,196,90,.1);border:1px solid rgba(244,196,90,.4);padding:.5rem 1.2rem;cursor:pointer">Enter anyway</button>
          <button id="deviation-turn-back" style="font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.08em;color:#c8c0b8 !important;background:transparent;border:1px solid #4a4555;padding:.5rem 1.2rem;cursor:pointer">Turn back</button>
        </div>
      </div>`
      document.body.appendChild(el)
      document.getElementById('deviation-enter-anyway').addEventListener('click', () => {
        el.remove()
        window._goToConfirmed(nextId, choice)
      })
      document.getElementById('deviation-turn-back').addEventListener('click', () => el.remove())
      return
    }

    await _goToCore(nextId, choice)
  }

  window._goToConfirmed = async function(nextId, choice) {
    await _goToCore(nextId, choice)
  }

  async function _goToCore(nextId, choice={}) {
    if (!NODES[nextId]) return

    // ── Route gates ──────────────────────────────────────────────────────
    // Some nodes are "decision gates" rather than scenes — they have a
    // route(player) function that returns a different node id based on
    // current state. Used for things like pre_boss_gate which routes
    // through camp_reflection on first visit, straight to the boss after.
    if (typeof NODES[nextId].route === 'function') {
      const redirected = NODES[nextId].route(player)
      if (redirected && NODES[redirected]) {
        nextId = redirected
      }
    }

    // ── Farming Grounds: regenerate waves on every entry ───────────
    // The farming_grounds_hub is a repeatable encounter. We re-pick 5
    // random enemies from the pool each time the player enters the hub
    // so consecutive runs feel different. The picks mutate the wave
    // node `enemy` fields in place; engine reads them as normal combat.
    if (nextId === 'farming_grounds_hub') {
      randomizeFarmingWaves()
    }

    // ── District clock + NPC interrupts on hub entry (#1 #2 #3 #23) ──
    // When the player heads to district_hub, decide whether to redirect them
    // through a one-time event first, and fire any milestone sysMsgs the
    // clock has crossed. Triggers in order of priority:
    //   1. cache_betrayal_offer if zones cleared >= 3 and not yet seen (#23)
    //   2. Sera / Voss / Rue check-ins (#1 / #2 / #3)
    // Each fires at most once per run via flags in alliance_log.
    // Milestone sysMsgs (the Sweep warning, the Judges call) are passive —
    // they show on top of the hub without changing where you land.
    const pendingClockFlags = []
    if (nextId === 'district_hub') {
      const log = player.alliance_log || []
      const defeated = (player.defeated_bosses || []).filter(b => b.startsWith('zone_boss_')).length
      const helpedRescue = log.includes('builders_helped')
      const moral = player.moral_score || 0
      const executedHumanoid = log.includes('executed_humanoid')

      // Cache auto-fire (#23): once you've cleared 3 zones, the alliance you
      // either signed with or watched form has reached its peak — and that's
      // exactly when Voss decides to offer the cache. If you've already seen
      // the cache offer in this run (any of: considered / refused / reported)
      // the alliance_log carries 'cache_seen' and we skip the redirect.
      if (!log.includes('cache_seen') && defeated >= 3) {
        nextId = 'cache_betrayal_offer'
      }
      // The Sweep (#5 + #11): factions clash in the plaza when tension boils
      // over. Requires the cache to have resolved first (so it lands as a
      // mid-chapter beat, not a first thing), and tension >= 35.
      else if (!log.includes('sweep_fired') && log.includes('cache_seen') && computeTension(player) >= 35) {
        nextId = 'sweep_arrival'
        pendingClockFlags.push('sweep_fired')
      }
      // Sera (#1): builder-flavour, fires after first rescue + first zone clear
      else if (!log.includes('sera_met') && helpedRescue && defeated >= 1) {
        nextId = 'sera_checkin'
      }
      // Voss (#2): villain-flavour, fires for clearly villain players
      else if (!log.includes('voss_met') && (moral <= -20 || executedHumanoid) && defeated >= 1) {
        nextId = 'voss_offer'
      }
      // Rue (#3): cadence, fires after the second cleared zone
      else if (!log.includes('rue_met') && defeated >= 2) {
        nextId = 'rue_intel'
      }
      // Spare reaction: Sera notices, fires once after first humanoid spare.
      // Requires player has already met Sera (so it lands as a follow-up,
      // not a first impression). Sera leans Builder; her reaction is approving
      // but pragmatic. Voss also has a reaction one priority below.
      else if (log.includes('spared_humanoid') && !log.includes('spare_reaction_seen') && log.includes('sera_met')) {
        nextId = 'spare_reaction_sera'
      }
      // Execute reaction: Voss notices, fires once after first humanoid execute.
      // Same gating — Voss must have been met. Voss leans Hunter, reaction is
      // approving / interested. If both spare and execute have happened, the
      // most-recent flag-priority wins by appending order in alliance_log.
      else if (log.includes('executed_humanoid') && !log.includes('execute_reaction_seen') && log.includes('voss_met')) {
        nextId = 'execute_reaction_voss'
      }
      // Rue reaction: fires for EITHER action, once. Rue is the neutral
      // observer — her reaction acknowledges the player's escalation without
      // taking a side. This is the "even neutral parties see you now" beat.
      else if ((log.includes('spared_humanoid') || log.includes('executed_humanoid'))
        && !log.includes('rue_action_reaction_seen') && log.includes('rue_met')) {
        nextId = 'rue_action_reaction'
      }
      // Tam mid-1: wounded Tam, fires after 2-3 zones cleared. Gated on
      // cache_seen (so player has met Tam) AND zones >= 2. Once seen
      // (tam_mid1_seen), won't refire. Sets follow-up flags that the hero
      // finale can read for personalized text.
      else if (!log.includes('tam_mid1_seen') && log.includes('cache_seen') && defeated >= 2 && defeated <= 5) {
        nextId = 'tam_wounded'
      }
      // Tam mid-2: Tam-with-Voss-runner scene, fires after mid-1 AND 4-7
      // zones cleared. The "Tam is being pressured to switch sides" scene.
      else if (!log.includes('tam_mid2_seen') && log.includes('tam_mid1_seen') && defeated >= 4 && defeated <= 7) {
        nextId = 'tam_at_crossroads'
      }

      // Passive clock milestones (#23): fire sysMsg overlays the first time
      // the player crosses each threshold. The corresponding alliance_log
      // flag (clock_6 / clock_8) gets added to updates below so it doesn't
      // re-fire on subsequent hub returns.
      if (defeated >= 6 && !log.includes('clock_6')) {
        pendingClockFlags.push('clock_6')
        setTimeout(() => window.showSysOverlay('SIX ZONES CLAIMED. The Judges have begun their preparation.', 'warn'), 800)
      }
      if (defeated >= 8 && !log.includes('clock_8')) {
        pendingClockFlags.push('clock_8')
        setTimeout(() => window.showSysOverlay('EIGHT ZONES CLAIMED. The Twin Judges are summoning. Finish what you intend to finish.', 'warn'), 800)
      }
    }

    // ── Pure hero / pure villain finale interrupt (#26 / #27) ──────────────
    // When the player heads to pre_boss_ch2, check finale eligibility. Each
    // finale fires at most once per run, gated by alliance_log flags. Below
    // the eligibility thresholds, this is a no-op and the normal Judges flow
    // runs unchanged.
    if (nextId === 'pre_boss_ch2') {
      const log = player.alliance_log || []
      const defeated = (player.defeated_bosses || []).filter(b => b.startsWith('zone_boss_')).length
      const moral = player.moral_score || 0
      const heroEligible    = moral >= 60  && log.includes('sweep_builders') && defeated >= 5 && !log.includes('hero_finale_done')
      const villainEligible = moral <= -60 && log.includes('sweep_hunters')  && defeated >= 5 && !log.includes('villain_finale_done')
      if      (heroEligible)    nextId = 'hero_finale_offer'
      else if (villainEligible) nextId = 'villain_finale_offer'
    }

    const cur = NODES[nodeId]
    const oldXp=player.xp||0, oldLvl=player.level||1
    const updates = { current_node:'ch2_'+nextId }
    if (cur?.xp)     { updates.xp=oldXp+cur.xp; player.xp=updates.xp }
    if (cur?.hpLoss) { currentHp=Math.max(1,currentHp-cur.hpLoss); updates.hp=currentHp }
    if (choice.moral) {
      // applyMoralChange handles: clamp moral, recompute badge, mutate
      // player, build update payload. Caller merges payload into save.
      const r = applyMoralChange(player, choice.moral)
      Object.assign(updates, r.updates)

      // ── Visible feedback on moral changes ────────────────────────────────
      // Toast the delta with the new total so the player sees the swing
      // even when it doesn't cross a reputation band. If the band DID change
      // escalate to a sysOverlay since that's a more meaningful event.
      const sign = choice.moral > 0 ? '+' : ''
      const ntot = r.newMoral > 0 ? '+'+r.newMoral : String(r.newMoral)
      const isErr = choice.moral < 0
      window.showToast(`Moral ${sign}${choice.moral} · now ${ntot}`, isErr)

      if (r.shifted) {
        const variant = (r.newBadge === 'elite' || r.newBadge === 'green') ? 'info' : 'warn'
        window.showSysOverlay(`REPUTATION SHIFT — ${getBadgeShiftLabel(r.oldBadge)} → ${getBadgeShiftLabel(r.newBadge)}`, variant)
      }
    }
    // Optional allianceTag on the chosen option — pushes a flag onto the
    // player's alliance_log array so later content can react to it. Used by
    // the Builder rescue side quests (#7) and the cowardice / retreat hooks.
    // Idempotent: skip the push if the tag is already in the log. Tags that
    // ARE allowed to repeat (e.g. 'builders_helped' is counted multiple times
    // in the Judges fight) shouldn't use this single-fire path — they live
    // in choice.allianceTagRepeatable instead.
    if (choice.allianceTag && !(player.alliance_log||[]).includes(choice.allianceTag)) {
      const log = [...(player.alliance_log||[]), choice.allianceTag]
      updates.alliance_log = log; player.alliance_log = log
    }
    if (choice.allianceTagRepeatable) {
      const log = [...(player.alliance_log||[]), choice.allianceTagRepeatable]
      updates.alliance_log = log; player.alliance_log = log
    }
    // Apply pending district-clock flags collected in the hub-interrupt block
    // above. Done here so we have access to `updates`. Merges with any prior
    // alliance_log mutation rather than overwriting it.
    if (pendingClockFlags.length) {
      const base = updates.alliance_log || player.alliance_log || []
      const log = [...base, ...pendingClockFlags]
      updates.alliance_log = log; player.alliance_log = log
    }
    if (choice.outcome) outcome=choice.outcome
    // Apply cost (item deductions) then rewards (item additions) for the
    // current node we're leaving. cost runs first so the player sees the
    // expected net change.
    if (cur?.cost)    for (const c of cur.cost)    await removeItem(c.itemKey, c.qty)
    if (cur?.rewards) for (const r of cur.rewards) await addItem(r.itemKey, r.qty)
    if (updates.xp) { const lu=await checkLevelUp(oldXp,updates.xp,oldLvl); if(lu) Object.assign(updates,lu) }

    // ── Set chapter resonance on first zone boss kill ─────────────────────────
    const WIN_ELEMENT_MAP = {
      zone_fire_boss_win:'fire',      zone_water_boss_win:'water',
      zone_lightning_boss_win:'lightning', zone_arcane_boss_win:'arcane',
      zone_shadow_boss_win:'shadow',  zone_earth_boss_win:'earth',
      zone_wind_boss_win:'wind',      zone_plant_boss_win:'plant',
      zone_metal_boss_win:'metal',    zone_poison_boss_win:'poison',
    }
    if (WIN_ELEMENT_MAP[nextId] && !getChapterResonance()) {
      await setChapterResonance(WIN_ELEMENT_MAP[nextId])
    }

    await save(updates)
    // ── Page-flip animation on navigation ──
    const flipEl = document.querySelector('.page-flip-decorator')
    if (flipEl) {
      flipEl.classList.remove('playing')
      void flipEl.offsetWidth
      flipEl.classList.add('playing')
      flipEl.addEventListener('animationend', () => flipEl.classList.remove('playing'), { once: true })
    }
    const lp=document.getElementById('left-page')
    lp.style.cssText+='transition:opacity .3s,transform .3s;opacity:0;transform:translateX(-8px)'
    setTimeout(()=>{ nodeId=nextId; render(); lp.style.opacity='1'; lp.style.transform='translateX(0)'; window.scrollTo({top:0,behavior:'smooth'}) },320)
  }

  // ── Dynamic verdict text composed from real player flags. ──────────
  // Lives next to render() so the special-case in render() can call it.
  // All inputs are read-only; this function never mutates state.
  const ZONE_BOSS_TO_ELEMENT = {
    zone_boss_fire:'Ignis', zone_boss_water:'Aqua', zone_boss_lightning:'Volt',
    zone_boss_arcane:'Arcane', zone_boss_shadow:'Umbra', zone_boss_earth:'Terra',
    zone_boss_wind:'Aero', zone_boss_plant:'Flora', zone_boss_metal:'Ferro',
    zone_boss_poison:'Venom',
  }

  // Faction-tinted closing paragraph for zone boss-win nodes (#25).
  // Builder-aligned (formally signed OR helped a rescue): Sera ack via comm.
  // Hunter-aligned (low moral, no Builder alliance): Voss watches silently.
  // Otherwise (neutral): the authored node.text is returned unchanged.
  // Only fires for nodes matching /^zone_\w+_boss_win$/ — never modifies
  // anything else. Pure function; no state mutation.
  function appendFactionOutro(baseText, nid, p) {
    if (!/^zone_\w+_boss_win$/.test(nid)) return baseText
    const log = p.alliance_log || []
    const builderAligned = log.includes('builders') || log.includes('builders_helped')
    const moral = p.moral_score || 0
    const hunterAligned = !builderAligned && moral <= -30
    if (builderAligned) {
      return baseText + '\n\nSera\'s voice comes through your comm, low and clean: "Good. That makes another. We\'re counting." A pause, just long enough to register. "Keep counting with us."'
    }
    if (hunterAligned) {
      return baseText + '\n\nWhen you turn, Voss is leaning in the doorway. They don\'t say anything. They look you over once, the way you\'d appraise a useful tool, and then walk out without a sound. They were watching the whole fight.'
    }
    return baseText
  }

  // Zone aftermath lines (#24). Prepended to zone entry nodes only.
  // Fires when the player enters a new zone after having cleared others —
  // the world acknowledges the trail of clearings behind them. Doesn't
  // mention specific elements; cumulative tone only. Pure: no state mutation.
  // Only triggers on nodes that are exactly 'zone_<element>' (no suffix).
  function prependZoneAftermath(baseText, nid, p) {
    if (!/^zone_(fire|water|lightning|arcane|shadow|earth|wind|plant|metal|poison)$/.test(nid)) return baseText
    const cleared = (p.defeated_bosses || []).filter(b => b.startsWith('zone_boss_')).length
    let line = ''
    if      (cleared === 0) return baseText  // first zone — nothing to acknowledge yet
    else if (cleared <= 2)  line = 'The district feels slightly different than it did the last time you crossed it. The plaza is quieter. Pell is unloading something into the back of the shop. You see them notice you pass.'
    else if (cleared <= 4)  line = 'You\'ve been moving through the district for a while now. Builder runners have started nodding at you in passing. Voss watches you for a beat longer than they used to before going back to whatever they were doing.'
    else if (cleared <= 6)  line = 'There is a quality of attention in the district now. People step back from doorways when you enter rooms. Not afraid — measuring. The System is not the only thing keeping a record.'
    else                    line = 'The district has settled into something cold around you. Most of the regulars have stopped speaking to you outright. Even Rue, when you pass them at the fountain, only nods. Whatever you are now, the people who live here recognize it.'
    return line + '\n\n' + baseText
  }

  // ─────────────────────────────────────────────────────────────────────
  // PELL RECOGNITION — reactive opening line for return trader visits
  // Pell is a neutral observer who sees a lot. On every visit AFTER the
  // first, prepend a brief acknowledgment of the player's most recent big
  // action: faction picks, the cache outcome, sweep choice, big moral
  // shifts, executions, sparing, alliance changes. Priority list — only the
  // single most relevant line fires per visit. The text below is delivered
  // in Pell's voice (dry, observational, neutral-leaning).
  // ─────────────────────────────────────────────────────────────────────
  function prependPellRecognition(baseText, nid, p) {
    if (nid !== 'trader_intro') return baseText
    const log = p.alliance_log || []
    if (!log.includes('pell_met')) return baseText  // first visit — keep base intro

    // Priority order: most recent / most dramatic first. Each entry checks
    // a flag AND a "Pell hasn't said it yet" guard. The guard adds a tag
    // like 'pell_seen_X' which prevents repeats. Tags accumulate across the
    // run so Pell never repeats himself.
    const lines = [
      // Finale acknowledgements (highest priority — chapter-ending stuff)
      { flag: 'hero_finale_done',    seen: 'pell_seen_hero_finale',
        text: '"You came back from the plaza," Pell says when you walk in. They don\'t look up from whatever they\'re fiddling with on the counter. "Word got here before you did. Tam — the kid with the bandaged hand — told me about the line you held."\n\nPell finally looks up.\n\n"You don\'t need anything I sell. But you came here. I appreciate that."' },
      { flag: 'villain_finale_done', seen: 'pell_seen_villain_finale',
        text: '"You came back from the Builder position," Pell says without looking up. Their hands don\'t stop moving, but you notice they\'re slower than usual. "I heard."\n\nA long pause.\n\n"I\'m not in the business of grading you. I sell things. I trade information. I\'m going to keep doing that whether you came in here covered in blood or covered in mud. But you should know — the kid asked about you, before. I told them you\'d be back."' },

      // Sweep outcomes (mid-chapter dramatic beat)
      { flag: 'sweep_builders', seen: 'pell_seen_sweep_builders',
        text: '"I heard about the Sweep," Pell says. "You stood with Sera\'s crew." A short nod. "I don\'t take sides in this district. But I will say that decision changed which side of the door I keep my emergency cache on. Make of that what you will."' },
      { flag: 'sweep_hunters',  seen: 'pell_seen_sweep_hunters',
        text: '"I heard about the Sweep," Pell says. They don\'t look up. "You stood with Voss." A measured pause. "Some of my regular customers won\'t be coming back. They were Builder. I knew them. I\'m still selling to you. Don\'t mistake that for anything more than business."' },
      { flag: 'sweep_escaped',  seen: 'pell_seen_sweep_escaped',
        text: '"I heard about the Sweep," Pell says. "You weren\'t there." They tilt their head. "I\'m not sure if that\'s a thing to commend you for or worry about. The district isn\'t going to forget either way. Take a look at the shelf — I restocked yesterday."' },

      // Cache decision (early to mid)
      { flag: 'backstab', seen: 'pell_seen_backstab',
        text: '"The cache." Pell\'s eyes flick to yours and back to the counter. "The crew you ate up. I knew two of them by name. I\'m not going to repeat the names because I doubt you\'d remember them anyway." They finish whatever they were doing. "What do you need today."' },

      // Faction alignment moves (multiple instances)
      { flag: 'sera_met', seen: 'pell_seen_sera_aligned',
        check: () => log.filter(x => x === 'builders_helped').length >= 3,
        text: '"You\'ve been spending time with the Builders." Pell says it like a weather report. "Three rescue runs that I\'ve heard about. Maybe more. Sera mentioned you specifically last time she came through here, which she\'s never done before about anyone." A small shrug. "Interesting. What can I get you."' },
      { flag: 'voss_met', seen: 'pell_seen_voss_aligned',
        check: () => log.filter(x => x === 'executed_humanoid').length >= 2,
        text: '"You\'ve been busy on the Hunter side of things," Pell says. "Voss came in yesterday. Bought twice what they normally do. They mentioned you in a way that I\'m going to be very neutral about, because I\'m a neutral merchant. But I noticed." They finally look up. "What can I get you."' },

      // Single executions / spares (the moral choices)
      { flag: 'executed_humanoid', seen: 'pell_seen_first_execute',
        text: '"You finished a Hunter scout in one of the zones," Pell says quietly. "I heard about it from someone who heard about it from one of theirs. I\'m not going to ask you why." They straighten the counter, unnecessarily. "I\'ll just say — most people I sell to never have to make that decision. Some do. Some do more than once. The number changes how I price things, but it doesn\'t change whether I sell to them."' },
      { flag: 'spared_humanoid', seen: 'pell_seen_first_spare',
        text: '"You had a Hunter scout cornered. You walked away." Pell\'s tone doesn\'t change — observational, like always. "I find that interesting. Most people in your position keep walking forward when they\'ve already drawn." A pause. "I\'m not commending it. I\'m noting it. There\'s a difference."' },

      // Class unlocked — Pell notices something is off about you
      { flag: '', seen: 'pell_seen_class_unlocked',
        check: () => !!p.active_class,
        text: '"There\'s something different about you," Pell says when you walk in. They actually stop what they\'re doing and look. A long beat. "I can\'t put it into words. The System logs people differently and I can almost see when it\'s happened. I don\'t know what you picked or whether you picked it consciously, but you\'re running on a different signal now."\n\nPell goes back to the counter.\n\n"Anyway. What do you need."' },
    ]

    for (const entry of lines) {
      if (log.includes(entry.seen)) continue
      if (entry.flag && !log.includes(entry.flag)) continue
      if (entry.check && !entry.check()) continue
      // Found the highest-priority unfired line. Stamp it and return.
      // (Stamping is done by the trader_intro choice via allianceTag so the
      // tag persists. We can't mutate alliance_log here — that's the wrong
      // pattern. Instead we attach the seen-tag to a sticky var the choice
      // reads, OR we add the tag via the next save. The simplest reliable
      // version: set a flag on the player object so the next save picks it
      // up. But choice-driven saves don't carry this flag automatically.
      //
      // Cleanest approach: tag the seen flag via allianceTag on the choices
      // out of trader_intro, dynamically — but that requires choice-list
      // mutation which is more invasive. For v1 we just prepend the text
      // and don't track seen — Pell will repeat the same line each visit
      // until a NEW flag fires. That's acceptable because the priorities
      // ensure newer events always overshadow older ones.
      return entry.text + '\n\n' + baseText
    }
    return baseText
  }

  // ── Tam history acknowledgement ─────────────────────────────────────
  // Fires at the chapter finale scenes (hero / villain branches). Reads
  // the player's alliance_log for Tam-related flags from the mid-zone
  // scenes (tam_helped_fire, tam_gave_medpack, tam_walked_past,
  // tam_stayed_builder, tam_chose_own, tam_uncertain, tam_defended). Each
  // flag inflects how Tam appears in the finale text — a child-of-the-
  // district recognizing the player vs. a stranger.
  //
  // Scenes addressed:
  //   - hero_finale_done           — Tam alive, the line held
  //   - villain_finale_offer       — moment before the Tam fight
  //   - villain_finale_done        — Tam down, Voss says nothing
  //   - villain_finale_done_spared — Tam alive but you walked past
  //   - villain_finale_done_executed — Tam dead by your hand
  function prependTamRecognition(baseText, nid, p) {
    const FINALE_NODES = ['hero_finale_done', 'villain_finale_offer',
                          'villain_finale_done', 'villain_finale_done_spared',
                          'villain_finale_done_executed']
    if (!FINALE_NODES.includes(nid)) return baseText
    const log = p.alliance_log || []
    const flags = {
      helped:    log.includes('tam_helped_fire'),
      medpack:   log.includes('tam_gave_medpack'),
      walked:    log.includes('tam_walked_past'),
      loyal:     log.includes('tam_stayed_builder'),
      chose_own: log.includes('tam_chose_own'),
      uncertain: log.includes('tam_uncertain'),
      defended:  log.includes('tam_defended'),
    }
    // If no Tam-history flags at all, Tam is essentially a stranger — keep
    // base text. The finales work fine without recognition; they just
    // hit lighter.
    const anyTam = Object.values(flags).some(v => v)
    if (!anyTam) return baseText

    // Build the recognition line. Priority order: kindness > respect >
    // ambiguity > harm. Strongest history line goes in.
    let recognition = ''
    if (nid === 'hero_finale_done') {
      // Tam survives — what they remember about you matters
      if (flags.medpack) {
        recognition = 'Tam meets your eye before anyone else does. Their hand goes to the spot on their leg where the medpack stopped the bleeding, weeks ago now. They don\'t say anything. They don\'t need to.'
      } else if (flags.helped) {
        recognition = 'Tam meets your eye before anyone else does. The bandage on their leg is long gone but the look they give you is the same one you got back then — surprise that you stopped.'
      } else if (flags.loyal) {
        recognition = 'Tam stands close to Sera. You remember telling them to. You remember saying it like it was easy. They watch you across the plaza like they\'re measuring whether you knew what you were asking of them.'
      } else if (flags.chose_own) {
        recognition = 'Tam looks at you the way kids look at adults who said the right thing at the right time. You told them they got to decide. They\'re still here, so apparently they did.'
      } else if (flags.defended) {
        recognition = 'Tam sees you and goes still. You remember the Voss runner — the fight. Tam was watching. They\'re still watching now, but the look is different. Older.'
      } else if (flags.uncertain) {
        recognition = 'Tam is at the edge of the group. Not quite with the Builders, not quite away from them. You remember pushing them toward Voss. They look at you like someone who didn\'t take the push but didn\'t forget it either.'
      } else if (flags.walked) {
        recognition = 'Tam is here too, with the others. You remember walking past them in the fire zone — the look they gave you. They\'re not looking at you now.'
      }
    } else if (nid === 'villain_finale_offer') {
      // The moment before fighting Tam. Recognition makes it heavier.
      if (flags.medpack) {
        recognition = 'You see Tam before Voss says anything. They\'re standing in the corridor with a pack of supplies — the kind a kid carries when they\'ve been doing real work. You remember the medpack you gave them in the fire zone. Their leg healed clean.'
      } else if (flags.helped) {
        recognition = 'You recognize Tam from the corridor angle. The kid you bandaged in the fire zone. They\'ve grown since then — not much, but enough that it\'s noticeable. They\'re holding a Builder sigil.'
      } else if (flags.loyal) {
        recognition = 'Tam is the one in the corridor. You told them once to walk away from Voss. They did. Now they\'re standing where you told them to stand. That\'s on you, in a way that doesn\'t admit a clean version.'
      } else if (flags.defended) {
        recognition = 'You remember the Voss runner you fought to protect Tam. The same Tam. Standing in the corridor now in a Builder vest, the seal pinned where it\'s visible.'
      } else if (flags.chose_own) {
        recognition = 'You told Tam they got to decide. Apparently this is what they decided. You don\'t know if that means you respected them correctly or just abandoned them to make their own bad choice. Either way, they\'re here.'
      } else if (flags.uncertain) {
        recognition = 'Tam is the one Voss is pointing at. You remember pushing them toward Voss in the crossroads. They didn\'t come. They picked Builders anyway. And now Voss is asking you to finish what your push didn\'t.'
      } else if (flags.walked) {
        recognition = 'You\'ve seen Tam before. The fire zone — the bandage. You didn\'t stop. Voss doesn\'t know that. Maybe Tam doesn\'t even remember. You do.'
      }
    } else if (nid === 'villain_finale_done') {
      // Tam is down — Voss approves
      if (flags.helped || flags.medpack || flags.defended || flags.loyal) {
        recognition = 'You think of the fire zone. The corridor where you helped them. The Voss runner you fought to keep them safe. The history is on you and only you — Voss doesn\'t know it, and now no one ever will.'
      } else if (flags.chose_own || flags.uncertain || flags.walked) {
        recognition = 'You don\'t think of much. The kid was in the way. The kid is no longer in the way.'
      }
    } else if (nid === 'villain_finale_done_spared') {
      // Tam alive, you walked past
      if (flags.helped || flags.medpack || flags.defended) {
        recognition = 'You hesitated and Voss saw it. You wonder if Tam knows it was you in the fire zone. You wonder if it would matter to them.'
      } else if (flags.loyal || flags.chose_own) {
        recognition = 'You hesitated and Voss saw it. The kid had been doing what you told them. You don\'t know what to do with that.'
      }
    } else if (nid === 'villain_finale_done_executed') {
      // Tam dead by your hand — the heaviest version
      if (flags.medpack) {
        recognition = 'The medpack you gave them in the fire zone — it would still be in their kit somewhere. You don\'t check. You don\'t want to know.'
      } else if (flags.helped || flags.defended) {
        recognition = 'You think of the fire zone, then you stop thinking of the fire zone.'
      } else if (flags.loyal || flags.chose_own) {
        recognition = 'You told them, once, that they got to decide. You did this anyway. That\'s the part that\'s yours.'
      } else if (flags.uncertain || flags.walked) {
        recognition = 'You knew Tam, distantly. Not well enough that it should weigh much. It does anyway.'
      }
    }
    if (!recognition) return baseText
    return recognition + '\n\n' + baseText
  }

  function buildJudgesVerdict(p) {
    const moral       = p.moral_score || 0
    const helps       = p.helps_given || 0
    const pvpKills    = p.pvp_kills   || 0
    const lvl         = p.level       || 1
    const hasAlliance = (p.alliance_log || []).includes('builders')
    const defeated    = p.defeated_bosses || []

    const zonesCleared = defeated.filter(b => b in ZONE_BOSS_TO_ELEMENT)
    const zoneNames    = zonesCleared.map(b => ZONE_BOSS_TO_ELEMENT[b])
    const zoneCount    = zonesCleared.length

    // Mercy lines (cooperation side of the ledger)
    const mercy = []
    if (hasAlliance && moral >= 0) {
      mercy.push('▸ You signed an alliance with the Builders in this district. The signature still holds.')
    } else if (hasAlliance && moral < -10) {
      mercy.push('▸ You signed an alliance with the Builders. The signature broke under pressure.')
    }
    if (helps >= 5) {
      mercy.push('▸ Your record from before this carries ' + helps + ' acts of help to the System\'s stranded.')
    } else if (helps >= 1) {
      mercy.push('▸ You helped ' + helps + ' of the System\'s stranded in another life. I have not forgotten.')
    }
    if (moral >= 60) {
      mercy.push('▸ Moral score: +' + moral + '. The pattern is consistent.')
    } else if (moral >= 20) {
      mercy.push('▸ Moral score: +' + moral + '. Cooperation outweighs the rest.')
    }
    if (!mercy.length) {
      mercy.push('▸ Your record contains few entries on my side.')
      mercy.push('▸ Acknowledged.')
    }

    // Wrath lines (dominance side of the ledger)
    const wrath = []
    if (moral <= -60) {
      wrath.push('▸ Moral score: ' + moral + '. The pattern is committed.')
    } else if (moral <= -20) {
      wrath.push('▸ Moral score: ' + moral + '. The hand was offered. You weighed it.')
    }
    if (pvpKills >= 5) {
      wrath.push('▸ Lives ended by your hand: ' + pvpKills + '. Recorded.')
    } else if (pvpKills >= 1) {
      wrath.push('▸ ' + pvpKills + ' live' + (pvpKills === 1 ? '' : 's') + ' ended by your hand. Acknowledged.')
    }
    if (zoneCount >= 5) {
      wrath.push('▸ Elemental guardians felled: ' + zoneCount + '. You did not pass through this district. You took it.')
    } else if (zoneCount >= 1) {
      wrath.push('▸ You cleared ' + zoneCount + ' guardian' + (zoneCount === 1 ? '' : 's') + ' on the way here.')
    }
    if (lvl >= 14) {
      wrath.push('▸ You arrived at level ' + lvl + '. You did not arrive empty-handed.')
    }
    if (!wrath.length) {
      wrath.push('▸ Your record contains few entries on my side.')
      wrath.push('▸ Acknowledged.')
    }

    // Resonance line (the column between them)
    let resonance
    if      (zoneCount === 0)  resonance = '▸ No elements claimed. You walked through the district untouched by what it offered.'
    else if (zoneCount === 1)  resonance = '▸ One element claimed: ' + zoneNames[0] + '. Singular commitment.'
    else if (zoneCount <= 3)   resonance = '▸ ' + zoneCount + ' elements claimed: ' + zoneNames.join(', ') + '. Focused reach.'
    else if (zoneCount <= 6)   resonance = '▸ ' + zoneCount + ' elements claimed: ' + zoneNames.join(', ') + '. Broad reach.'
    else                       resonance = '▸ ' + zoneCount + ' of 10 elements claimed: ' + zoneNames.join(', ') + '. You reached for everything within reach.'

    // Closing line — who leads
    let closing
    if      (moral >=  60)        closing = 'Mercy speaks first. "You built more than you took. We see it." Wrath inclines its head — the smallest acknowledgement — and they step forward together, Mercy in the lead.'
    else if (moral <= -60)        closing = 'Wrath speaks first. "You took more than you built. Clarity respected." Mercy inclines its head — the smallest acknowledgement — and they step forward together, Wrath in the lead.'
    else if (Math.abs(moral)<20)  closing = 'Mercy looks at Wrath. "Mixed," she says. "Tested both ways," Wrath agrees. Neither leads. Both step forward at once.'
    else if (moral > 0)           closing = 'Mercy nods to Wrath. They step forward in unison — both ledgers active, with Mercy closer to your shoulder.'
    else                          closing = 'Wrath nods to Mercy. They step forward in unison — both ledgers active, with Wrath closer to your shoulder.'

    return [
      'Two interfaces unfold in front of you.',
      '',
      'Mercy stands to your left. Tall. Still. Cataloguing.',
      'Wrath stands to your right. Smaller. Compressed. Already finished reading.',
      '',
      'Neither of them looks at you yet. They look at the record.',
      '',
      '═══════════════════════════════════════',
      'MERCY READS, slowly:',
      '',
      mercy.join('\n'),
      '',
      '═══════════════════════════════════════',
      'WRATH READS, faster:',
      '',
      wrath.join('\n'),
      '',
      '═══════════════════════════════════════',
      'ELEMENTAL RESONANCE — the column between them:',
      '',
      resonance,
      '',
      '═══════════════════════════════════════',
      '',
      'They finish reading at the same moment. They look at each other for exactly long enough to make a decision.',
      '',
      closing,
    ].join('\n')
  }

  // ─────────────────────────────────────────────────────────────────────
  // CAMP REFLECTION — the night before the Judges
  // Fires once when the player first heads to the Judges from the hub.
  // Builds a quiet, conversational narrative recap of what they did during
  // the chapter, woven into a sitting-by-a-fire moment. Different paragraphs
  // appear based on flags in alliance_log + moral state. The point isn't to
  // teach mechanics — it's to make the player feel the weight of their record
  // as a story rather than a tally.
  // ─────────────────────────────────────────────────────────────────────
  function buildCampReflection(p) {
    const log         = p.alliance_log || []
    const moral       = p.moral_score || 0
    const defeated    = p.defeated_bosses || []
    const zoneCount   = defeated.filter(b => b in ZONE_BOSS_TO_ELEMENT).length
    const has         = (k) => log.includes(k)
    const builderHelps = log.filter(x => x === 'builders_helped').length
    const executions   = log.filter(x => x === 'executed_humanoid').length
    const spares       = log.filter(x => x === 'spared_humanoid').length

    // Opening — frames the moment. Tone varies by moral lean.
    let opening
    if (moral >= 40) {
      opening = `You find a corner of the plaza that the System hasn't quite scrubbed clean — an old café, mostly intact, a chair that survived. You sit down. The Judges aren't here yet. Not until you walk back out and let them be summoned. You have this much time.

You aren't sure where the impulse came from. To stop. To think. But the district is quieter than it's been in days, and tomorrow it won't be quiet anymore.`
    } else if (moral <= -40) {
      opening = `You break into the café yourself. The lock barely resists. Inside it smells like coffee that's been gone a long time. You sit at the bar. There's nothing left to drink. You aren't sure why you stopped.

Maybe to see whether stopping still feels like anything. Maybe to count.`
    } else {
      opening = `You stop at the edge of the plaza, in front of an old café. The door is unlocked. You go in. There are chairs. You take one.

You don't really know why. The Judges aren't here yet. You could keep moving. But you don't.`
    }

    // Middle — the recap, one paragraph per major thread. Only adds paragraphs
    // for things that actually happened. Order is roughly chronological.
    const recap = []

    if (zoneCount > 0) {
      const zoneWord = zoneCount === 1 ? 'zone' : 'zones'
      recap.push(`You count the ${zoneWord}. ${zoneCount} sealed places opened, ${zoneCount === 1 ? 'a' : ''} ${zoneCount} guardian${zoneCount === 1 ? '' : 's'} put down. Each one had a name the System didn't tell you. Each one had a body you walked past.`)
    }

    if (builderHelps >= 3) {
      recap.push(`You think about the Builders. About the medical stations. About the kid with the bandaged hand who kept asking after you. ${builderHelps} times you showed up when they needed something. ${builderHelps === 3 ? 'Three' : builderHelps} times you said yes.`)
    } else if (builderHelps >= 1) {
      recap.push(`You think about the time you helped the Builders. The kid with the bandaged hand — Tam — was there. You didn't stay long. You're not sure if that counts for anything.`)
    }

    if (has('backstab')) {
      recap.push(`The cache betrayal sits in your chest. The crew you ate up. The faces you didn't look at long enough to remember. You wonder if anyone is going to remember them for you.`)
    }

    if (executions >= 3) {
      recap.push(`${executions} Hunter scouts. You remember the look on the second one when they realized you weren't going to walk away. The third one didn't have time to look anything. You stopped counting after.`)
    } else if (executions >= 1) {
      recap.push(`The scout. The execution. You can recall the exact angle of light. You can recall the way the body fell. You don't know what it means that you can recall this so cleanly.`)
    }

    if (spares >= 1 && executions === 0) {
      recap.push(`The Hunters you spared. You wonder if any of them made it home. You wonder if you'll see them again, and on which side.`)
    } else if (spares >= 1) {
      recap.push(`The Hunter you spared sits next to the ones you didn't, in your head. You don't have a story that includes both, but here they are.`)
    }

    if (has('sweep_builders')) {
      recap.push(`The Sweep. You stood with the Builders. You remember Sera's hand on your shoulder afterward — brief, professional, but the contact was real.`)
    } else if (has('sweep_hunters')) {
      recap.push(`The Sweep. You stood with Voss. You remember the smile under the visor — not approval exactly. Acknowledgment. The kind of acknowledgment that doesn't go away.`)
    } else if (has('sweep_escaped')) {
      recap.push(`The Sweep. You weren't there for it. You don't know what happened. Maybe that's the answer the System wanted from you. Maybe it isn't.`)
    }

    if (has('hero_finale_done')) {
      recap.push(`The plaza defense. Sera, the kid, the others. They held because you were there. That's the thing the Judges will be reading, whether you tell it to them or not.`)
    } else if (has('villain_finale_done')) {
      recap.push(`The last Builder position. You went with Voss. You don't think about what the kid with the bandaged hand looked like at the end. You think about it constantly.`)
    }

    // Closing — what the player carries into the fight. Tone varies again.
    let closing
    if (moral >= 40) {
      closing = `The light shifts. The Judges are summoning. You stand up — slowly, the way you'd stand up from a meal you wanted to remember.

Then you walk out into the plaza.`
    } else if (moral <= -40) {
      closing = `Eventually you stop counting. The Judges are coming. You stand up because there isn't anything left to do in here. Your hands are steady.

The plaza is waiting.`
    } else {
      closing = `After a while you stand up. There isn't a sound to mark it — the Judges don't announce themselves the way you'd expect. But the air thickens, and you know.

You walk back out.`
    }

    return [
      opening,
      '',
      ...recap.map(r => r + '\n'),
      closing,
    ].join('\n')
  }

  async function render() {
    const node=NODES[nodeId]
    if (!node) { document.getElementById('story-text').textContent='Error: node "'+nodeId+'" not found.'; return }
    if (node.sysMsg) window.showSysOverlay(node.sysMsg)

    // Pre-resolve choice.requires gating (used by Sera giving 2 medical packs,
    // any future inventory-gated choice). Adds a transient `_unmetRequires`
    // flag on the choice that renderChoices below reads to disable the button.
    if (Array.isArray(node.choices)) {
      for (const c of node.choices) {
        if (Array.isArray(c.requires) && c.requires.length) {
          let ok = true
          for (const r of c.requires) if (!(await hasItem(r.itemKey, r.qty))) { ok = false; break }
          c._unmetRequires = !ok
        } else {
          c._unmetRequires = false
        }
      }
    }

    const stEl=document.getElementById('story-text')
    // judges_verdict composes its text from live player state — every other
    // node uses its authored node.text as-is, with one exception: zone boss-win
    // nodes get a faction-tinted closing paragraph appended (Sera for Builders,
    // Voss for Hunter-aligned, nothing for neutral). The base text stays intact.
    let baseText = nodeId === 'judges_verdict' ? buildJudgesVerdict(player)
                 : nodeId === 'camp_reflection' ? buildCampReflection(player)
                 : (node.text || '')
    // ── Placeholder substitution ───────────────────────────────────
    // Authors write [YOUR NAME] in narrative text where the player's name
    // should appear. Replace at render time with player.username.
    if (baseText.includes('[YOUR NAME]')) {
      baseText = baseText.split('[YOUR NAME]').join(player.username || 'OPERATOR')
    }
    stEl.textContent = appendFactionOutro(prependZoneAftermath(prependPellRecognition(prependTamRecognition(baseText, nodeId, player), nodeId, player), nodeId, player), nodeId, player)
    stEl.className=nodeId==='opening'?'story-text drop-cap':'story-text'

    // Judge image near boss (and on the verdict scene)
    const judgeNodes=['pre_boss_ch2','judges_verdict','boss_judges']
    const judgeImg=document.getElementById('judge-img')
    if (judgeNodes.includes(nodeId)) {
      const judgeSrc = judgeImgFromForm(composeJudgesForm(player, node.enemy || { hp:380, atk:22, def:14 }).canonForm)
      if (!judgeImg) {
        const img=document.createElement('img');img.id='judge-img'
        img.src=judgeSrc;img.alt='The Twin Judges'
        img.style.cssText='width:100%;max-width:320px;display:block;margin:1.5rem auto 0;border-radius:4px;opacity:0;transition:opacity 1s;filter:'+(nodeId==='boss_judges'?'none':'brightness(.6) saturate(0.5)')
        stEl.insertAdjacentElement('afterend',img);setTimeout(()=>img.style.opacity='1',100)
      } else { judgeImg.style.filter=nodeId==='boss_judges'?'none':'brightness(.6) saturate(0.5)';judgeImg.style.opacity='1' }
    } else { judgeImg?.remove() }

    document.getElementById('outcome-box').style.display='none'
    const panel=document.getElementById('right-panel')
    if      (node.type==='boss')   renderBoss(panel,node)
    else if (node.type==='combat') renderCombat(panel,node)
    else if (node.type==='end')    renderEnd(panel,node)
    else if (nodeId==='district_hub') renderDistrictHub(panel)
    else                           renderChoices(panel,node)
  }

  function renderChoices(panel,node) {
    const choices=node.choices||[]
    if (!choices.length) { panel.innerHTML=''; return }

    // Detect if we're inside an elemental zone so we can show a retreat button
    const zoneIds = ['zone_fire','zone_water','zone_lightning','zone_arcane','zone_shadow','zone_earth','zone_wind','zone_plant','zone_metal','zone_poison']
    const inZone = zoneIds.some(z => nodeId === z || nodeId.startsWith(z + '_'))

    const retreatBtn = inZone
      ? `<button class="choice" data-next="district_hub" style="margin-top:8px;border-color:rgba(255,255,255,.15);opacity:.7">
          <span class="choice-arrow" style="color:var(--ink-dim)">↩</span>
          <span class="choice-body" style="color:var(--ink-dim)">Retreat to District Hub<span class="choice-sub">Leave this zone — come back stronger</span></span>
         </button>`
      : ''

    panel.innerHTML='<p class="choices-label">What do you do?</p><div class="choices">'+
      choices.map((c,index)=>{
        const variant=c.variant?' choice-'+c.variant:''
        const sub=c.sub?'<span class="choice-sub">'+escapeHtml(c.sub)+'</span>':''
        // Optional `requires` on a choice: [{itemKey,qty}] — choice is hidden
        // (disabled visually + no click handler) if any requirement isn't met.
        // Resolved synchronously against the cached check below.
        const disabled = c._unmetRequires ? ' disabled' : ''
        const style = c._unmetRequires ? ' style="opacity:.35;cursor:not-allowed"' : ''
        return '<button class="choice'+variant+'" data-choice-index="'+index+'"'+disabled+style+'>'+
          '<span class="choice-arrow">→</span>'+
          '<span class="choice-body">'+escapeHtml(c.label)+sub+'</span>'+
          '</button>'
      }).join('')+retreatBtn+'</div>'
    panel.querySelectorAll('[data-choice-index]').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = choices[Number(btn.dataset.choiceIndex)] || {}
        if (choice._unmetRequires) return  // gated; no-op
        goTo(choice.next || '', {
          moral:                  choice.moral                  || 0,
          outcome:                choice.outcome                || '',
          allianceTag:            choice.allianceTag            || null,
          allianceTagRepeatable:  choice.allianceTagRepeatable  || null,
        })
      })
    })
    panel.querySelector('[data-next="district_hub"]')?.addEventListener('click', () => goTo('district_hub'))
  }

  // District hub — 9 elemental zones

  function renderDistrictHub(panel) {
    const defeated = getDefeatedBosses()
    const judgeReady = defeated.includes('twin_judges')

    // Build story events status
    const moral=player.moral_score||0
    const hasAlliance = (player.alliance_log||[]).includes('builders')

    const stEl=document.getElementById('story-text')
    const resonance = getChapterResonance()
    const resDisplay = resonance
      ? `CHAPTER RESONANCE: ${ELEMENT_NAMES[resonance]} — established this run`
      : `CHAPTER RESONANCE: None — defeat a zone boss to establish`
    // District clock: count cleared zone bosses (#23). The chapter has
    // forced beats at 3 (cache offer), 6 (Judges prepare), and 8 (Judges
    // summon).
    const zonesClear = defeated.filter(b => b.startsWith('zone_boss_')).length
    // Cold War tension (#5). Computed from alliance_log — readout below.
    const tens  = computeTension(player)
    const tensSign = tens > 0 ? '+' : ''

    stEl.textContent=`The shopping district spreads out before you. Ten elemental zones pulse across your radar — some bright and accessible, others dim, waiting for the right resonance to open them.

  Your interface shows the faction positions, the zone locations, and below it all, a quiet indicator:

  ALLIANCE LOG: ${hasAlliance?'Builders (Active)':'No alliances recorded'}
  MORAL SCORE: ${moral>0?'+':''}${moral}
  ${resDisplay}
  DISTRICT PROGRESS: ${zonesClear} / 10 zones cleared
  TENSION: ${tensionLabel(tens)} (${tensSign}${tens})
  JUDGES: ${judgeReady?'Both defeated — Chapter complete':'Watching'}`

    let zonesHtml = ZONES.map(z=>{
      const bossKey = 'zone_boss_'+z.id.replace('zone_','')
      const done = defeated.includes(bossKey)||player.skills_unlocked?.some(s=>s.startsWith(z.element.toLowerCase()+'_'))
      const imgHtml = z.img ? `<div style="height:56px;background:url('${z.img}') center/cover no-repeat;opacity:${done?'0.9':'0.55'};border-bottom:.5px solid ${z.color}44"></div>` : ''
      return `<div data-go="${z.id}" style="border:.5px solid ${z.color}${done?'':'44'};border-radius:5px;overflow:hidden;background:${z.color}${done?'18':'08'};cursor:pointer;transition:all .2s;margin-bottom:6px">
        ${imgHtml}
        <div style="display:flex;align-items:center;gap:.5rem;padding:.45rem .6rem">
          <span style="font-size:1rem">${z.icon}</span>
          <div style="flex:1;min-width:0">
            <p style="font-family:'Cinzel',serif;font-size:.78rem;color:${done?z.color:'var(--ink-dim)'};margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${z.element} — ${z.name}</p>
            <p style="font-family:'Share Tech Mono',monospace;font-size:.44rem;color:var(--ink-dim);margin:0">${z.branch} · ${done?'✓ CLEARED':'Enter zone'}</p>
          </div>
          <span style="font-family:'Share Tech Mono',monospace;font-size:.48rem;color:${done?z.color:'#5a4825'};border:.5px solid ${done?z.color+'44':'rgba(139,106,32,.2)'};padding:1px 6px;border-radius:10px">${done?'CLEARED':'ZONE'}</span>
        </div>
      </div>`
    }).join('')

    let eventsHtml = `<div style="margin-top:.75rem">
      <p style="font-family:'Share Tech Mono',monospace;font-size:.48rem;color:var(--ink-dim);letter-spacing:.08em;margin-bottom:.4rem">STORY EVENTS</p>
      <div data-go="cache_betrayal_offer" style="border:.5px solid rgba(200,184,128,.2);border-radius:5px;padding:.45rem .6rem;cursor:pointer;margin-bottom:5px;background:rgba(0,0,0,.05);transition:all .2s">
        <p style="font-family:'Cinzel',serif;font-size:.76rem;color:#c8b96e;margin:0">⚖️ The Cache Offer</p>
        <p style="font-family:'Share Tech Mono',monospace;font-size:.44rem;color:var(--ink-dim);margin:0">A decision waits in the east corridor</p>
      </div>
      <div data-go="trader_intro" style="border:.5px solid rgba(200,184,128,.2);border-radius:5px;padding:.45rem .6rem;cursor:pointer;margin-bottom:5px;background:rgba(0,0,0,.05);transition:all .2s">
        <p style="font-family:'Cinzel',serif;font-size:.76rem;color:#c8b96e;margin:0">🏪 Pell's Shop</p>
        <p style="font-family:'Share Tech Mono',monospace;font-size:.44rem;color:var(--ink-dim);margin:0">Neutral trader — open for business</p>
      </div>
      <div data-go="farming_grounds_hub" style="border:.5px solid rgba(94,196,94,.3);border-radius:5px;padding:.45rem .6rem;cursor:pointer;margin-bottom:5px;background:rgba(94,196,94,.06);transition:all .2s">
        <p style="font-family:'Cinzel',serif;font-size:.76rem;color:#5ec45e;margin:0">⚔ Farming Grounds</p>
        <p style="font-family:'Share Tech Mono',monospace;font-size:.44rem;color:var(--ink-dim);margin:0">Repeatable wave combat · 5 random elementals · XP only</p>
      </div>
      <div data-go="pre_boss_gate" style="border:.5px solid ${judgeReady?'#5ec45e44':'rgba(200,81,42,.4)'};border-radius:5px;padding:.45rem .6rem;cursor:pointer;background:rgba(200,81,42,.06);transition:all .2s">
        <p style="font-family:'Cinzel',serif;font-size:.76rem;color:${judgeReady?'#5ec45e':'#c8512a'};margin:0">⚖️ The Twin Judges</p>
        <p style="font-family:'Share Tech Mono',monospace;font-size:.44rem;color:var(--ink-dim);margin:0">${judgeReady?'Both defeated — Chapter complete':'End chapter — face the Judges'}</p>
      </div>
    </div>`

    panel.innerHTML=`<p class="choices-label">District Map</p><div style="max-height:65vh;overflow-y:auto;padding-right:2px">${zonesHtml}${eventsHtml}</div>`
    panel.querySelectorAll('[data-go]').forEach(el => {
      el.addEventListener('click', () => goTo(el.dataset.go))
    })
  }

  // Combat + boss engines (full implementation)
  function renderCombat(panel,node) {
    const zoneIds = ['zone_fire','zone_water','zone_lightning','zone_arcane','zone_shadow','zone_earth','zone_wind','zone_plant','zone_metal','zone_poison']
    const inZone = zoneIds.some(z => nodeId === z || nodeId.startsWith(z + '_'))
    const onEscape = node.onEscape || (inZone ? 'district_hub' : null)
    buildCombatUI(panel,node.enemy,node.onWin,node.onLose,onEscape,false,{ally: node.ally || null})
  }
  // ── Twin Judges scaling (#20 / #21) ──────────────────────────────────────
  // Composes the Judges fight stats and form from the player's actual record.
  // Pure: takes a player and returns { form, label, hp, atk, def, modifiers[] }.
  // form  : 'mercy' | 'wrath' | 'both' — picks the rendered narrative form
  // label : short string shown in the System call-out before the fight
  // hp/atk/def : baseline + record-derived adjustments
  // modifiers : array of human-readable strings (rendered in the call-out)
  // ── Cold War tension (#5) ────────────────────────────────────────────────
  // Computes the current Builder ↔ Hunter tension level from the player's
  // alliance_log entries. Pure: never mutates state. The chapter doesn't
  // store this number; it's recomputed on each hub entry from the flags
  // already in the log.
  //   negative → peace-aligned (Builders dominant)
  //   ~0       → neutral / balanced
  //   positive → conflict-aligned (Hunters dominant)
  // Capped at ±60 so a long pile of similar flags doesn't run away.
  function computeTension(p) {
    const log = p.alliance_log || []
    let t = 0
    for (const x of log) {
      if      (x === 'builders_helped')   t -= 5   // helped rescue
      else if (x === 'spared_humanoid')   t -= 3   // chose mercy
      else if (x === 'sera_met')          t -= 2   // Sera engagement (any outcome)
      else if (x === 'executed_humanoid') t += 10  // chose violence
      else if (x === 'voss_aligned')      t += 15  // intercepted runner
      else if (x === 'cowardice')         t += 5   // refused to engage
    }
    // If the player reported the cache to Sera, that's a strong peace signal.
    // We detect it indirectly: cache_seen with moral_score >= 10 implies
    // cache_reported (the +20 moral outcome).
    if (log.includes('cache_seen') && (p.moral_score || 0) >= 10) t -= 8
    return Math.max(-60, Math.min(60, t))
  }

  // Tension descriptor for the hub status panel.
  function tensionLabel(t) {
    if (t <= -20) return 'PEACE — Builder cooperation dominant'
    if (t <=  -5) return 'STABLE — Builder lean'
    if (t <   10) return 'BALANCED — Factions watching each other'
    if (t <   25) return 'TENSION — Conflict rising'
    return                'COLD WAR — Hunters mobilizing'
  }

  // Twin Judges — per-form battle art. Each of the 7 canonical forms has
  // its own webp in /assets/boss/. canonForm comes from composeJudgesForm
  // (single source of truth), so the picture always matches the form the
  // player is actually facing.
  const JUDGE_FORM_FILES = {
    verdict:     'verdict.webp',
    dominion:    'dominion.webp',
    absolution:  'absolution.webp',
    ruin:        'ruin.webp',
    equilibrium: 'equilibrium.webp',
    mercy:       'mercy.webp',
    wrath:       'wrath.webp',
  }
  function judgeImgFromForm(canonForm) {
    return '../assets/boss/' + (JUDGE_FORM_FILES[canonForm] || JUDGE_FORM_FILES.equilibrium)
  }

  function composeJudgesForm(p, baseEnemy) {
    const moral       = p.moral_score || 0
    const log         = p.alliance_log || []
    // Sweep result counts as a strong faction commitment: defending the
    // Builders adds Builder credit; joining the Hunters adds backstab weight.
    const sweepBuilders = log.includes('sweep_builders') ? 2 : 0
    const sweepHunters  = log.includes('sweep_hunters')  ? 3 : 0
    const builderHelps = log.filter(x => x === 'builders_helped').length
                       + (log.includes('sera_met') && log.includes('builders_helped') ? 1 : 0)
                       + sweepBuilders
    const backstabs   = (p.backstabs || 0)
                      + (log.filter(x => x === 'executed_humanoid').length)
                      + sweepHunters
    const cowardice   = log.includes('cowardice')
    const lvl         = p.level || 1

    // Form selection: strong moral lean ⇒ that Judge dominates the fight.
    // Otherwise both fight together (the default mixed form).
    // Finale flags (#26 / #27) override the form entirely: completing the
    // hero finale forces Mercy regardless of other numbers; completing the
    // villain finale forces Wrath. The finale also amplifies the stat shift
    // so the fight feels meaningfully different from the moral-only path.
    const heroFinale    = log.includes('hero_finale_done')
    const villainFinale = log.includes('villain_finale_done')
    let form
    if      (heroFinale)    form = 'mercy'
    else if (villainFinale) form = 'wrath'
    else if (moral >= 40)   form = 'mercy'
    else if (moral <= -40)  form = 'wrath'
    else                    form = 'both'

    // Stat composition. Baseline starts at the authored values and is shaped
    // by which form leads. Mercy form is endurance: higher HP, lower ATK.
    // Wrath form is brutality: lower HP, higher ATK. Both is the in-between.
    let hp  = (baseEnemy.hp  || 380) + lvl * 20
    let atk = (baseEnemy.atk || 22)  + Math.floor(lvl * 1.5)
    let def = (baseEnemy.def || 14)

    // NOTE: hp/atk/def above are now PLACEHOLDERS — they get overwritten
    // at the end of this function by the per-form table (see "Apply
    // fixed per-form stat targets" block below). All the form/finale/
    // builder/backstab/element modifier code that follows is kept ONLY
    // for the flavor strings it pushes into `modifiers`; the math no
    // longer affects the final stats. Player choices still get
    // acknowledged narratively, but Verdict always has 2054 HP, etc.

    const modifiers = []
    if (form === 'mercy') {
      hp  = Math.round(hp  * 1.25)  // longer fight
      atk = Math.round(atk * 0.85)  // softer hits
      modifiers.push(heroFinale
        ? 'Hero finale committed — Mercy is fully present. Wrath does not speak.'
        : 'Mercy leads — the fight is longer, the strikes lighter.')
      if (heroFinale) { hp = Math.round(hp * 1.10); atk = Math.round(atk * 0.92) }
    } else if (form === 'wrath') {
      hp  = Math.round(hp  * 0.85)  // shorter fight
      atk = Math.round(atk * 1.25)  // brutal hits
      modifiers.push(villainFinale
        ? 'Villain finale committed — Wrath is undivided. Mercy refuses to look.'
        : 'Wrath leads — the fight is brief and ugly.')
      if (villainFinale) { atk = Math.round(atk * 1.10); hp = Math.round(hp * 0.95) }
    } else {
      modifiers.push('Mercy and Wrath together — neither yields to the other.')
    }

    // Builder credit reduces Wrath's pressure (her sword stays half-sheathed).
    // Applies even outside the Wrath-led form because Mercy intervenes too.
    if (builderHelps > 0) {
      const cut = Math.min(40, builderHelps * 15)
      hp -= cut
      modifiers.push(`Builder credit (${builderHelps}): Wrath's pressure -${cut} HP.`)
    }

    // Wrath's "Accountant" passive: every backstab / execution sharpens her.
    // Cap at +8 ATK so the math stays survivable even on Wrath-dominant runs.
    if (backstabs > 0) {
      const add = Math.min(8, backstabs)
      atk += add
      modifiers.push(`Backstabs / executions (${backstabs}): Wrath's accountant adds +${add} ATK.`)
    }

    // Cowardice flag tips the fight psychologically. The damage boost is
    // applied during combat (see buildCombatUI), not at composition time —
    // we just surface the modifier here so the player sees the warning.
    if (cowardice) modifiers.push("Cowardice noted — Wrath strikes harder while you're below half HP.")

    // Elemental purity (#15) — count distinct elements the player has put
    // skill points into this chapter. The chapter's stated thesis is that
    // the System rewards commitment and notes greed. We translate that into
    // a stat shift on the Judges fight:
    //   1 element  → Resonant buff: enemy ATK -10%, Mercy notes the focus
    //   2 elements → no effect (default mixed allowance)
    //   3+         → Greed Mark debuff: enemy ATK +12%, Wrath notes the spread
    const ELEMENT_PREFIXES = ['ignis_', 'aqua_', 'volt_', 'arcane_', 'umbra_', 'terra_', 'aero_', 'flora_', 'ferro_', 'venin_']
    const skills = p.skills_unlocked || []
    const elementsInvested = new Set()
    for (const s of skills) {
      for (const prefix of ELEMENT_PREFIXES) {
        if (s.startsWith(prefix)) { elementsInvested.add(prefix.replace('_', '')); break }
      }
    }
    const elementCount = elementsInvested.size
    if (elementCount === 1) {
      atk = Math.round(atk * 0.90)
      modifiers.push(`Resonant focus (1 element): Mercy notes the commitment — Judges' ATK -10%.`)
    } else if (elementCount >= 3) {
      atk = Math.round(atk * 1.12)
      modifiers.push(`Greed Mark (${elementCount} elements): Wrath notes the spread — Judges' ATK +12%.`)
    }

    // ── Canonical 7-form name ────────────────────────────────────────────
    // canonForm is the single source of truth — form (stat scaling) is
    // derived from it below so the two can never contradict each other.
    //
    // Priority order:
    //   1. Verdict     — 5 or more zone bosses cleared, regardless of moral
    //   2. Dominion    — moral neutral (< ±40) AND 2+ elements invested
    //   3. Absolution  — moral positive (≥ 40) AND 2+ elements invested
    //   4. Ruin        — moral negative (≤ -40) AND 2+ elements invested
    //   5. Equilibrium — moral neutral (< ±40), single/no element
    //   6. Mercy       — moral positive (≥ 40), single/no element
    //   7. Wrath       — moral negative (≤ -40), single/no element
    const zoneBossesCleared = (p.defeated_bosses || []).filter(b => b.startsWith('zone_boss_')).length

    let canonForm
    if      (zoneBossesCleared >= 5)                      canonForm = 'verdict'
    else if (Math.abs(moral) < 40 && elementCount >= 2)  canonForm = 'dominion'
    else if (moral >= 40 && elementCount >= 2)            canonForm = 'absolution'
    else if (moral <= -40 && elementCount >= 2)           canonForm = 'ruin'
    else if (Math.abs(moral) < 40)                        canonForm = 'equilibrium'
    else if (moral >= 40)                                 canonForm = 'mercy'
    else                                                  canonForm = 'wrath'

    // Sync `form` (stat scaling bucket) from canonForm so they are never
    // out of step. mercy/absolution → mercy scaling. wrath/ruin → wrath
    // scaling. Everything else (verdict/dominion/equilibrium) → both.
    if      (canonForm === 'mercy' || canonForm === 'absolution') form = 'mercy'
    else if (canonForm === 'wrath' || canonForm === 'ruin')       form = 'wrath'
    else                                                           form = 'both'

    // Form labels — canonical Judge titles. Player-facing.
    const FORM_LABELS = {
      verdict:     'VERDICT — Final Judge of Humanity',
      dominion:    'DOMINION — Judges in Accord',
      absolution:  'ABSOLUTION — Judge of Purity',
      ruin:        'RUIN — Judge of Desolation',
      equilibrium: 'EQUILIBRIUM — Judges of Balance',
      mercy:       'MERCY — Judge of Salvation',
      wrath:       'WRATH — Judge of Ruin',
    }
    const label = FORM_LABELS[canonForm]

    // ── Apply fixed per-form stat targets ──────────────────────────────
    // Designer-tuned. Modifiers above stay as flavor only (they push
    // strings into `modifiers` so the fight intro still acknowledges
    // builder helps, backstabs, element focus, etc.) but the final
    // hp/atk/def numbers come straight from this table, NOT from the
    // accumulated math above.
    //
    // Form table (HP / ATK / DEF):
    //   Wrath       527  / 50 / 13  — Fast and brutal
    //   Mercy       775  / 34 / 15  — Long and grinding
    //   Ruin        658  / 58 / 13  — Wrath but sharper
    //   Absolution  899  / 36 / 17  — Mercy but tougher
    //   Equilibrium 1682 / 44 / 15  — Balanced above both bases
    //   Dominion    1037 / 56 / 18  — Aggressive balance, punishes waiting
    //   Verdict     2054 / 66 / 20  — Nothing compromised, hardest fight
    const FORM_STATS = {
      wrath:       { hp: 527,  atk: 50, def: 13 },
      mercy:       { hp: 775,  atk: 34, def: 15 },
      ruin:        { hp: 658,  atk: 58, def: 13 },
      absolution:  { hp: 899,  atk: 36, def: 17 },
      equilibrium: { hp: 1682, atk: 44, def: 15 },
      dominion:    { hp: 1037, atk: 56, def: 18 },
      verdict:     { hp: 2054, atk: 66, def: 20 },
    }
    const fixed = FORM_STATS[canonForm] || FORM_STATS.equilibrium
    hp  = fixed.hp
    atk = fixed.atk
    def = fixed.def

    return { form, canonForm, label, hp, atk, def, modifiers, cowardice }
  }

  function renderBoss(panel,node) {
    const lvl=player.level||1
    const enemy={...node.enemy}

    // Is this a zone boss (not the Twin Judges)?
    const isZoneBoss = node.bossKey && node.bossKey !== 'twin_judges'
    const isBoss = !isZoneBoss  // only Twin Judges triggers chapter-end logic

    // Twin Judges: derive stats + form from the player's record.
    // Zone bosses use the original level-scaled stats.
    let judgesForm = null
    if (node.bossKey === 'twin_judges') {
      const composed = composeJudgesForm(player, node.enemy)
      enemy.hp  = composed.hp
      enemy.atk = composed.atk
      enemy.def = composed.def
      enemy.img = judgeImgFromForm(composed.canonForm)
      enemy.name = {
        verdict:     'The Twin Judges — Verdict',
        dominion:    'The Twin Judges — Dominion',
        absolution:  'Judge Mercy — Absolution',
        ruin:        'Judge Wrath — Ruin',
        equilibrium: 'The Twin Judges — Equilibrium',
        mercy:       'Judge Mercy',
        wrath:       'Judge Wrath',
      }[composed.canonForm] || 'The Twin Judges'
      judgesForm = composed
    } else {
      // Standard zone-boss scaling — level-based first, then per-kill escalation.
      enemy.hp  = node.enemy.hp  + lvl * 10
      enemy.atk = node.enemy.atk + Math.floor(lvl * 0.8)
      // ── Per-kill escalation ────────────────────────────────────────────
      // Each zone boss already defeated buffs the remaining zone bosses
      // by +0.5× additive. So 1 cleared = ×1.5, 2 = ×2.0, 3 = ×2.5, etc.
      // Capped at ×3.5 (~5 zones cleared) so end-game zones don't become
      // mathematically impossible. Adjust the cap to taste.
      const defeated = player.defeated_bosses || []
      const zonesAlreadyCleared = defeated.filter(b =>
        b.startsWith('zone_boss_') && b !== node.bossKey
      ).length
      const escalation = Math.min(3.5, 1.0 + zonesAlreadyCleared * 0.5)
      enemy.hp  = Math.round(enemy.hp  * escalation)
      enemy.atk = Math.round(enemy.atk * escalation)
      enemy.def = Math.round((enemy.def || 0) * escalation)
      // SPD scales gentler so initiative doesn't become a wall — half the
      // escalation magnitude. Means later bosses are still beatable for
      // mid-SPD players, just slightly faster.
      const spdEscalation = Math.min(2.0, 1.0 + zonesAlreadyCleared * 0.25)
      if (!enemy.spd) {
        if (enemy.atk <= 36)      enemy.spd = 22
        else if (enemy.atk <= 42) enemy.spd = 27
        else                       enemy.spd = 31
      }
      enemy.spd = Math.round(enemy.spd * spdEscalation)
    }

    // Zone bosses use their own onLose/onEscape (back to approach node)
    // Twin Judges fall back to pre_boss_ch2
    const onLose   = node.onLose   || (isZoneBoss ? 'district_hub' : 'pre_boss_ch2')
    const onEscape = node.onEscape || (isZoneBoss ? 'district_hub' : 'pre_boss_ch2')

    const elementsAttempted = (() => {
      const elementKeys = ['ignis','aqua','volt','arcane','umbra','terra','aero','flora','ferro','venom']
      const skills = player.skills_unlocked || []
      const defeated = player.defeated_bosses || []
      const found = new Set()
      for (const k of elementKeys) {
        if (skills.some(s=>s.startsWith(k+'_')) || defeated.includes(k)) found.add(k)
      }
      return Math.max(1, found.size)
    })()

    buildCombatUI(panel,enemy,node.onWin,onLose,onEscape,isBoss,{
      playerMoral: player.moral_score||0,
      elementsAttempted,
      judgesForm,
      ally: node.ally || null,
    })
  }

  // ── Combat UI builder ──────────────────────────────────────────────────
  //
  // Ally support: pass extraCtx.ally to bring an NPC to combat. Shape:
  //   ally = {
  //     name:    string        — display name (e.g. 'Tam', 'Sera')
  //     hp:      number        — current HP
  //     maxHp:   number        — max HP
  //     atk:     number        — base attack power
  //     def:     number        — damage reduction
  //     alive:   boolean       — starts true, flipped to false on death
  //   }
  //
  // Mechanics when ally is present:
  //   - HP bar rendered below player's, in ally color
  //   - Each turn (after both player + enemy act), ally attacks the enemy
  //   - Ally has ~40% chance to take retaliation damage per attack
  //   - If ally HP hits 0, ally.alive = false, but combat continues
  //   - statusEffects.ally_died is set true the moment they die (one-shot)
  //   - Class skills (onPlayerHit, etc.) only fire when PLAYER is hit, never ally
  //   - Status effects (bleed/poison) only apply to player, not ally
  //   - Win/lose conditions are unchanged — ally death is narrative only
  //
  // On win, narrative nodes can check player.alliance_log for the ally death
  // tag (e.g. 'tam_died_in_combat') which the engine appends if it happened.
  //
  function buildCombatUI(panel,enemy,onWin,onLose,onEscape,isBoss,extraCtx={}) {
    const cid='cb'+Math.random().toString(36).slice(2,7)
    const $=id=>panel.querySelector('#'+cid+'-'+id)
    const ally = extraCtx.ally || null
    // Defensive: default ally.alive to true if author forgot to specify it.
    // Also default missing maxHp to hp so the bar can render correctly.
    if (ally) {
      if (ally.alive === undefined) ally.alive = true
      if (ally.maxHp === undefined) ally.maxHp = ally.hp
    }

    let enemyHp=enemy.hp, maxEnemyHp=enemy.hp, maxPlayerHp=player.max_hp||100
    let over=false, defending=false
    let currentHp = player.hp || 100

    window._enemyAIState = initEnemyState(enemy)

    function playerATK() { return (player.atk||5)+(player.power||0)*.5+(player.strength||0)+Math.floor(Math.random()*6) }
    function playerDEF() {
      let base = (player.def||2)+(player.guard||0)*.5+(player.armor||0)
      // Armour Shred (applied by enemyAI.js): reduces DEF by shredAmt
      if (statusEffects.playerDefShredTurns > 0) {
        base = Math.max(0, base - (statusEffects.playerDefShredAmt||0))
      }
      return base
    }
    function playerSPD() { return (player.speed||5)+(player.agility||0)*.5 }
    function enemySPD()  { return enemy.spd||5 }
    const eqLuck = player.luck||0

    // ── SKILL DEFINITIONS — sourced from shared registry ────────────

    // See data/skills_registry.js. Spread copies so combat code can

    // mutate the merged table without polluting the shared module.

    const BATTLE_SKILLS = { ...BATTLE_SKILLS_REGISTRY, ...NOTABLE_SKILLS_REGISTRY }

    const battleSkillKeys = player.battle_skills || []

    // ── Status effects ───────────────────────────────────────────────────────
    let statusEffects = {
      playerATKBonus:0, playerDEFBonus:0, playerSPDBonus:0,
      ignoreEnemyDEF:false, invulnerable:false, waterShield:0,
      enemyATKMult:1.0, enemyStunTurns:0,
      burnTurns:0, burnDmg:3, infernoTurns:0, regenTurns:0, rootTrapTurns:0,
      skillCooldowns:{},
    }

    const T=[0,10,25,50,90,150,240,380,590,900]
    function _skillLv(key) {
      const sl=(player.skill_levels||{})[key]; if(!sl) return 1
      let lv=1; for(let i=1;i<T.length;i++){if(sl.uses>=T[i])lv=i+1;else break} return Math.min(10,lv)
    }
    function skillScale(key){return 0.5+(_skillLv(key)-1)*(0.5/9)}
    async function recordSkillUse(key) {
      const sl = player.skill_levels || {}
      if (!sl[key]) sl[key] = { uses: 0 }
      const prevLv = _skillLv(key)
      sl[key].uses++
      player.skill_levels = sl
      const newLv = _skillLv(key)
      if (newLv > prevLv) {
        const sk = BATTLE_SKILLS[key]
        window.showToast('✦ ' + (sk?.label || key) + ' reached Lv ' + newLv + '!')
      }
      const { error } = await supabase.from('players').update({ skill_levels: sl }).eq('id', player.id)
      if (error) console.error('[skill_levels save]', error.message)
    }

    // ── Apply passives ────────────────────────────────────────────────────────
    const unlocked=player.skills_unlocked||[], inBattle=player.battle_skills||[]
    const has=k=>inBattle.includes(k)
    if(unlocked.includes('water_passive_regen'))            statusEffects.regenTurns=999
    if(unlocked.includes('earth_passive_damage_reduction')){const lv=_skillLv('earth_passive_damage_reduction');statusEffects.playerDEFBonus+=Math.round(5+(lv-1))}
    if(unlocked.includes('metal_passive_reflect'))          statusEffects.metalReflect=true
    if(has('ofn2')) statusEffects.flameFist=true
    if(has('ofn3')) statusEffects.venomFang=true
    if(has('dfn1')) statusEffects.tidalResolve=true
    if(has('dfn2')) statusEffects.absorption=true
    if(has('dfn3')) statusEffects.liveWire=true
    if(has('dfn5')) statusEffects.arcReflex=true
    if(has('fln1')) statusEffects.razorTempo=true
    if(has('fln2')) statusEffects.ghostStep=true
    if(has('fln4')) statusEffects.flicker=true
    if(has('fln5')) statusEffects.tremorStep=true
    if(has('arn1')) statusEffects.sharpMind=true
    if(has('arn3')) statusEffects.razorLuck=true
    if(has('arn4')) statusEffects.prescience=true
    if(has('arn5')) statusEffects.ricochet=true
    if(has('dcn2')) statusEffects.umbralVeil=true
    if(has('dcn4')) statusEffects.shadeWalk=true
    if(has('dcn5')) statusEffects.enduringRoot=true
    if(has('dc_ks2'))statusEffects.ancientRootShield=Math.round(maxPlayerHp*0.2)

    // ── Class skill combat hooks: initialize ─────────────────────────────────
    // Equal Sky (Arbiter t5b) grants +5 SP at combat start via statusEffects.cls_bonusSP
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
    // (messages will print in the first combat-log push after enemy actions)

    // ── Build UI — mirrors chapter1 structure exactly ─────────────────────────
    const enemyImg = enemy.img
      ? '<img src="'+enemy.img+'" style="width:80px;height:80px;object-fit:contain;border-radius:6px;flex-shrink:0;filter:drop-shadow(0 0 8px rgba(0,0,0,.7))">'
      : '<span style="font-size:2.5rem;line-height:1">'+( enemy.icon||'⚔')+'</span>'

    // ── Twin Judges form banner (#20 / #21) ────────────────────────────────
    // Shown only when the Judges fight is active. Renders the leading Judge,
    // the form name, and a short bulleted list of record-derived modifiers so
    // the player understands what the System is doing to this encounter.
    const judgesBanner = extraCtx.judgesForm
      ? `<div class="combat-judges-form" style="margin-bottom:10px;padding:8px 10px;border:1px solid rgba(138,91,68,.40);background:rgba(244,234,215,.55);font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.06em;color:var(--ink)">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <span style="font-size:11px">⚖</span>
            <span style="font-weight:600;letter-spacing:.16em">${extraCtx.judgesForm.label}</span>
          </div>
          ${extraCtx.judgesForm.modifiers.map(m =>
            `<div style="margin-left:14px;font-style:italic;color:var(--ink-dim);font-family:'Cormorant Garamond',serif;font-size:13px;letter-spacing:0;line-height:1.4">▸ ${m}</div>`
          ).join('')}
         </div>`
      : ''

    panel.innerHTML =
      '<div class="combat-panel" id="'+cid+'-combat-wrap">'
      + judgesBanner
      + '<div class="combat-enemy-row">'
      + enemyImg
      + '<div style="flex:1">'
      + '<p class="combat-enemy-name">'+enemy.name+'</p>'
      + '<div class="stat-bar-wrap"><div class="stat-bar" id="'+cid+'-e-bar" style="background:#e05555;width:100%;transition:width .4s,background .4s"></div></div>'
      + '<p id="'+cid+'-e-hp" style="font-family:\'Share Tech Mono\',monospace;font-size:.62rem;color:var(--ink-dim);margin-top:2px">'+enemyHp+' / '+maxEnemyHp+' HP</p>'
      + '</div></div>'
      + '<div class="combat-log" id="'+cid+'-combat-log">The encounter begins.</div>'
      + '<div class="stat-row" style="margin-bottom:.4rem">'
      + '<span class="stat-key" style="font-family:\'Share Tech Mono\',monospace;font-size:.62rem;color:var(--ink)">YOUR HP</span>'
      + '<div class="stat-bar-wrap"><div class="stat-bar" id="'+cid+'-c-player-bar" style="background:#5ec45e;width:100%;transition:width .4s,background .4s"></div></div>'
      + '<span id="'+cid+'-c-player-hp" style="font-family:\'Share Tech Mono\',monospace;font-size:.62rem;color:var(--ink);min-width:50px;text-align:right">'+currentHp+'/'+maxPlayerHp+'</span>'
      + '</div>'
      + (ally ? (
          '<div class="stat-row" style="margin-bottom:.4rem">'
          + '<span class="stat-key" style="font-family:\'Share Tech Mono\',monospace;font-size:.62rem;color:#5eaee0">'+ally.name.toUpperCase()+'</span>'
          + '<div class="stat-bar-wrap"><div class="stat-bar" id="'+cid+'-c-ally-bar" style="background:#5eaee0;width:100%;transition:width .4s,background .4s"></div></div>'
          + '<span id="'+cid+'-c-ally-hp" style="font-family:\'Share Tech Mono\',monospace;font-size:.62rem;color:#5eaee0;min-width:50px;text-align:right">'+ally.hp+'/'+ally.maxHp+'</span>'
          + '</div>'
        ) : '')
      + '<div id="'+cid+'-combat-actions">'
      + '<p style="font-family:\'Share Tech Mono\',monospace;font-size:.5rem;color:var(--ink);letter-spacing:.09em;margin-bottom:5px">— CHOOSE YOUR ACTION —</p>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:4px">'
      + '<button class="combat-btn" id="'+cid+'-btn-strike" style="flex-direction:column;gap:2px;padding:.45rem .25rem;font-size:.62rem" title="Fast attack. Always goes first."><span style="font-size:1.1rem;line-height:1">⚔</span><span>Strike</span><span style="font-size:.44rem;color:var(--ink-dim);letter-spacing:.04em">FAST · FIRST</span></button>'
      + '<button class="combat-btn" id="'+cid+'-btn-heavy"  style="flex-direction:column;gap:2px;padding:.45rem .25rem;font-size:.62rem" title="High damage but slower."><span style="font-size:1.1rem;line-height:1">💥</span><span>Heavy</span><span style="font-size:.44rem;color:var(--ink-dim);letter-spacing:.04em">HIGH DMG · SLOW</span></button>'
      + '<button class="combat-btn" id="'+cid+'-btn-defend" style="flex-direction:column;gap:2px;padding:.45rem .25rem;font-size:.62rem" title="Halve incoming damage."><span style="font-size:1.1rem;line-height:1">🛡</span><span>Defend</span><span style="font-size:.44rem;color:var(--ink-dim);letter-spacing:.04em">BLOCK · FIRST</span></button>'
      + '</div>'
      + '<div id="'+cid+'-skill-slots-row" style="margin-bottom:4px"></div>'
      + '<div id="'+cid+'-class-skills-row" style="margin-bottom:4px"></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">'
      + '<button class="combat-btn" id="'+cid+'-btn-items" style="color:#5eaee0;font-size:.6rem" title="Use a consumable item.">🎒 Items</button>'
      + (onEscape ? '<button class="combat-btn" id="'+cid+'-btn-escape" style="font-size:.6rem" title="Attempt to flee.">💨 Flee</button>' : '<span></span>')
      + '</div>'
      + '</div>'
      + '<div id="'+cid+'-items-panel" style="display:none;margin-top:.5rem;border:.5px solid rgba(94,174,224,.3);border-radius:4px;padding:.6rem;background:rgba(0,0,0,.05)">'
      + '<p style="font-family:\'Share Tech Mono\',monospace;font-size:.58rem;color:#5eaee0;letter-spacing:.06em;margin-bottom:.4rem">⚡ USE ITEM</p>'
      + '<div id="'+cid+'-items-list"></div>'
      + '<button id="'+cid+'-items-close" style="font-family:\'IM Fell English\',serif;font-size:.78rem;color:var(--ink-dim);background:none;border:none;cursor:pointer;margin-top:.4rem;padding:0">✕ Close</button>'
      + '</div>'
      + '<div id="'+cid+'-combat-over" style="display:none;text-align:center;padding:.5rem"></div>'
      + '</div>'
    function syncBars() {
      const ePct=Math.max(0,Math.round(enemyHp/maxEnemyHp*100))
      const pPct=Math.max(0,Math.round(currentHp/maxPlayerHp*100))
      const eBar=$('e-bar'), eHp=$('e-hp'), pBar=$('c-player-bar'), pHp=$('c-player-hp')
      if(eBar){eBar.style.width=ePct+'%'; eBar.style.background=ePct>50?'#e05555':'#c8b96e'}
      if(eHp) eHp.textContent=enemyHp+' / '+maxEnemyHp+' HP'
      if(pBar){pBar.style.width=pPct+'%'; pBar.style.background=pPct>60?'#5ec45e':pPct>30?'#c8b96e':'#e05555'}
      if(pHp) pHp.textContent=currentHp+'/'+maxPlayerHp
      // Ally bar (if present)
      if (ally) {
        const aPct = Math.max(0, Math.round(ally.hp / ally.maxHp * 100))
        const aBar = $('c-ally-bar'), aHp = $('c-ally-hp')
        if (aBar) {
          aBar.style.width = aPct + '%'
          aBar.style.background = ally.alive ? (aPct>60?'#5eaee0':aPct>30?'#c8b96e':'#e05555') : '#666'
        }
        if (aHp) aHp.textContent = ally.alive ? (ally.hp+'/'+ally.maxHp) : 'fallen'
      }
      updateHpBar(currentHp)
    }

    function log(msg) {
      const el=$('combat-log')
      if(el){el.innerHTML=msg; el.style.animation='none'; void el.offsetWidth; el.style.animation='fadeIn .3s ease'}
    }

    // ── Render battle skill slots — exact mirror of chapter1 ─────────────────
    function renderSkillSlots() {
      const row=$('skill-slots-row')
      if(!row) return

      const activeSkills  = battleSkillKeys.filter(k=>{const s=BATTLE_SKILLS[k];return s&&s.type!=='passive'})
      const passiveSkills = battleSkillKeys.filter(k=>{const s=BATTLE_SKILLS[k];return s&&s.type==='passive'})

      const passiveStrip = passiveSkills.length
        ? '<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:4px">'
          + passiveSkills.map(k=>{
              const sk=BATTLE_SKILLS[k]
              return '<span style="font-family:\'Share Tech Mono\',monospace;font-size:.44rem;color:'+sk.color+';border:.5px solid '+sk.color+'50;border-radius:12px;padding:1px 6px;background:'+sk.color+'12;letter-spacing:.04em">⚡ '+sk.label+' (passive)</span>'
            }).join('')
          + '</div>'
        : ''

      if(!activeSkills.length) {
        row.innerHTML = passiveStrip
          + '<p style="font-family:\'Share Tech Mono\',monospace;font-size:.5rem;color:var(--ink-dim);padding:4px 0">'
          + (battleSkillKeys.length===0
              ? 'No active skills assigned — visit Skills page'
              : battleSkillKeys.length+' skill key(s) found but not recognized — visit Skills page to re-save')
          + '</p>'
        return
      }

      const EL_ICON={fire:'🔥',water:'💧',earth:'🪨',wind:'💨',dark:'🌑',light:'✨',lightning:'⚡',metal:'⚙',plant:'🌿'}
      let html = passiveStrip
      html += '<p style="font-family:\'Share Tech Mono\',monospace;font-size:.48rem;color:var(--ink);letter-spacing:.09em;margin-bottom:4px">— SKILLS —</p>'
      html += '<div style="display:grid;grid-template-columns:'+(activeSkills.length===1?'1fr':activeSkills.length===2?'1fr 1fr':'1fr 1fr 1fr')+';gap:4px">'

      html += activeSkills.map(k=>{
        const sk     = BATTLE_SKILLS[k]
        const cd     = statusEffects.skillCooldowns[k]||0
        const isUlt  = sk.type==='ultimate'
        const lv     = _skillLv(k)
        const lvColor= lv>=10?'#ffd700':lv>=7?'#c8b96e':lv>=4?'#a0c080':'#9a8858'
        const pct    = Math.round((0.5+(lv-1)*(0.5/9))*100)
        const elIcon = EL_ICON[sk.el]||'✦'
        const cdLabel= cd>0 ? cd+' turn'+(cd>1?'s':'') : null
        const border = isUlt ? 'border-color:'+sk.color+'70' : 'border-color:'+sk.color+'40'
        const cdOverlay = cd>0
          ? '<div style="position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;border-radius:3px"><span style="font-family:Share Tech Mono,monospace;font-size:.55rem;color:#c8b96e">'+cdLabel+'</span></div>'
          : ''
        const iconFilter = cd>0 ? 'grayscale(1)' : 'drop-shadow(0 0 4px '+sk.color+'88)'
        const btnColor   = cd>0 ? 'rgba(200,160,60,.35)' : sk.color
        const imgTag = '<img src="../assets/skills/'+k+'.webp" style="width:24px;height:24px;object-fit:contain;border-radius:3px;display:block;margin:0 auto" onerror="this.style.display=\'none\'">'

        return '<button class="combat-btn" id="'+cid+'-btn-skill-'+k+'"'
          + ' data-skill-key="'+k+'"'
          + (cd>0?' disabled':'')
          + ' title="'+(sk.desc||sk.label)+' (Lv'+lv+' · '+pct+'% power)"'
          + ' style="flex-direction:column;gap:2px;padding:.45rem .25rem;'+border+';color:'+btnColor+';position:relative;overflow:hidden">'
          + cdOverlay
          + '<span style="font-size:1rem;line-height:1;filter:'+iconFilter+'">'+imgTag
          + '<span style="font-size:1rem;margin:0 auto;display:none">'+elIcon+'</span>'
          + '</span>'
          + '<span style="font-size:.58rem;font-weight:600;letter-spacing:.02em">'+(isUlt?'★ ':'')+sk.label+'</span>'
          + '<span style="font-size:.42rem;color:'+lvColor+';letter-spacing:.04em">Lv'+lv+' · '+pct+'%</span>'
          + '</button>'
      }).join('')

      html += '</div>'
      row.innerHTML = html
      row.querySelectorAll('[data-skill-key]').forEach(btn => {
        btn.addEventListener('click', () => useSkillLocal(btn.dataset.skillKey))
      })
    }

    // ── Class skill action buttons ───────────────────────────────────────
    // Renders a row of active class skills (Sentence Mark, Final Decree, etc).
    // Only visible if the player has an active class with active-type skills
    // unlocked. Each button represents a once-per-combat ability.
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

    // Local helper — fires when player clicks a class-skill button. Applies
    // the effect, logs feedback, advances the turn (consumes the action).
    async function useClassSkillLocal(skillId) {
      if (over) return
      const result = ClsCombat.onActiveSkill(skillId, player, statusEffects, enemy)
      if (!result.consumed) {
        // Stance toggles / free actions — just update UI
        log(result.messages.join('<br>'))
        renderClassSkills()
        return
      }
      // Post-activation side effects that need engine state:
      // Mass Decree heals to full
      if (statusEffects.cls_massDecree) {
        currentHp = maxPlayerHp
        statusEffects.cls_massDecree = false
      }
      // Conquest immediate damage = dominion stacks × 5 (also fires via onPlayerAttack
      // bonusFlatDmg next strike). Apply the immediate version here.
      if (skillId === 'conquest') {
        const dmg = (statusEffects.cls_dominionStacks || 10) * 5
        enemyHp = Math.max(0, enemyHp - dmg)
        log('👑 Conquest deals <strong>' + dmg + '</strong> damage.')
        syncBars()
      }
      // Last Engine drops HP to 1
      if (skillId === 'last_engine') {
        currentHp = 1
      }
      // Final Eclipse damage (immediate)
      if (skillId === 'final_eclipse') {
        const dmg = statusEffects.cls_finalEclipseDmg || 0
        if (dmg > 0) {
          enemyHp = Math.max(0, enemyHp - dmg)
          statusEffects.cls_finalEclipseDmg = 0
          log('☀☾ Final Eclipse deals <strong>' + dmg + '</strong> damage.')
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
        // Restore the statusEffects from snapshot, preserving the rewind
        // buffer + the pending flag (so we don't restore stale buffer state).
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
      log(result.messages.join('<br>'))
      renderClassSkills()
      syncBars()
    }

    function setButtons(enabled) {
      ['btn-strike','btn-heavy','btn-defend','btn-items','btn-escape'].forEach(id=>{
        const b=$(id); if(b) b.disabled=!enabled
      })
      battleSkillKeys.forEach(k=>{
        const b=$('btn-skill-'+k)
        if(b&&enabled){b.disabled=(statusEffects.skillCooldowns[k]||0)>0}
        else if(b){b.disabled=true}
      })
    }

    const useSkillLocal = function(key) {
      if (over) return
      const sk = BATTLE_SKILLS[key]
      if (!sk) return
      const cd = statusEffects.skillCooldowns[key] || 0
      if (cd > 0) { log('Skill on cooldown (' + cd + ' turns)'); return }
      doTurn('skill', key)
    }
    window['useSkill_' + cid] = useSkillLocal
    const itemCloseBtn = $('items-close')
    if (itemCloseBtn) itemCloseBtn.addEventListener('click', () => { $('items-panel').style.display = 'none' })

    // ── Items panel ───────────────────────────────────────────────────────────
    $('btn-items').addEventListener('click', async () => {
      if(over) return
      const itemsPanel=$('items-panel')
      const list=$('items-list')
      if(itemsPanel.style.display!=='none'){itemsPanel.style.display='none'; return}
      itemsPanel.style.display='block'
      list.innerHTML='<p style="font-family:\'Share Tech Mono\',monospace;font-size:.6rem;color:var(--ink-dim)">Loading...</p>'
      const {data}=await supabase.from('inventory').select('*')
        .eq('player_id',player.id).in('item_type',['consumable','key']).gt('quantity',0).order('item_type')
      const usable=(data||[]).filter(i=>i.hp_restore>0||['Phoenix Feather','Explosion Scroll','Lava Bomb','Water Potion','Medkit','Energy Drink','Fire Potion','Light Potion','Healing Rain'].includes(i.name))
      if(!usable.length){list.innerHTML='<p style="font-family:\'IM Fell English\',serif;font-style:italic;font-size:.8rem;color:var(--ink-dim)">No usable items in bag.</p>'; return}
      const RC={common:'#c8c0a0',uncommon:'#5ec45e',rare:'#5eaee0',epic:'#c090ff',legendary:'#f0d060',mythic:'#ff88ff'}
      list.innerHTML=usable.map((item,index)=>`
        <div data-combat-item-index="${index}"
          style="display:flex;align-items:center;gap:.5rem;padding:.45rem .25rem;border-bottom:.5px solid rgba(139,106,32,.12);cursor:pointer;transition:background .15s;border-radius:2px">
          <div style="flex:1;min-width:0">
            <p style="font-family:'Cinzel',serif;font-size:.75rem;color:${RC[item.rarity]||'#888'};margin:0 0 1px">${escapeHtml(item.name)}</p>
            <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink-dim);margin:0">${escapeHtml(item.hp_restore>0?'+'+item.hp_restore+' HP':item.special_effect||'Special effect')}</p>
          </div>
          <span style="font-family:'Share Tech Mono',monospace;font-size:.58rem;color:var(--ink-dim);flex-shrink:0">×${item.quantity||1}</span>
        </div>`).join('')
      list.querySelectorAll('[data-combat-item-index]').forEach(el => {
        el.addEventListener('click', () => {
          const item = usable[Number(el.dataset.combatItemIndex)]
          if (!item) return
          window['combatUseItem_'+cid](item.id, item.name, item.hp_restore || 0, item.quantity || 1, item.special_effect || '')
        })
      })
    })

    window['combatUseItem_'+cid] = async function(itemId,itemName,hpRestore,qty,specialEffect) {
      const maxHp=player.max_hp||100
      if(hpRestore>0){
        const healed=Math.min(maxHp,currentHp+hpRestore)-currentHp
        currentHp=Math.min(maxHp,currentHp+hpRestore); syncBars()
        await supabase.from('players').update({hp:currentHp}).eq('id',player.id)
        player.hp=currentHp
        log('Used '+itemName+' — restored '+healed+' HP. ('+currentHp+'/'+maxHp+')')
      } else if(itemName==='Phoenix Feather'){
        window._hasRevive=true; log('Phoenix Feather equipped — will auto-revive at 20 HP.')
      } else if(itemName==='Explosion Scroll'){
        window._forceMaxHit=true; log('Explosion Scroll loaded — next attack deals maximum damage.')
      } else if(itemName==='Lava Bomb'){
        enemyHp=0; syncBars(); log('Lava Bomb detonated — enemy destroyed instantly.')
        $('items-panel').style.display='none'
        if(qty<=1)await supabase.from('inventory').delete().eq('id',itemId)
        else await supabase.from('inventory').update({quantity:qty-1}).eq('id',itemId)
        await endCombat('win'); return
      } else {log('Cannot use '+itemName+' here.'); return}
      $('items-panel').style.display='none'
      if(qty<=1)await supabase.from('inventory').delete().eq('id',itemId)
      else await supabase.from('inventory').update({quantity:qty-1}).eq('id',itemId)
    }

    renderSkillSlots()
    renderClassSkills()
    syncBars()

    // ── Oathbreaker oath picker ──────────────────────────────────────
    // When combat starts and the player has multiple Oathbreaker oaths
    // unlocked, statusEffects.cls_oathPickerPending contains an array of
    // oath keys (e.g. ['fury', 'wall']). We render a modal with one button
    // per oath; clicking sets the oath and removes the modal.
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
      // Disable action buttons until picked
      setButtons(false)
      modal.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button[data-oath]')
        if (!btn) return
        const oath = btn.getAttribute('data-oath')
        const r = ClsCombat.setOathbreakerOath(oath, statusEffects)
        for (const m of r.messages) log(m)
        modal.remove()
        setButtons(true)
        renderClassSkills()  // re-render in case new actives appear (Break: X)
      })
    }

    // ── Button event listeners ─────────────────────────────────────────────────
    ;[['btn-strike','strike'],['btn-heavy','heavy'],['btn-defend','defend']].forEach(([id,action])=>{
      const b=$(id); if(b) b.addEventListener('click',()=>{if(!over)doTurn(action,null)})
    })
    const escBtn=$('btn-escape')
    if(escBtn) escBtn.addEventListener('click',()=>{
      if(over)return
      log('You disengage and retreat.')
      endCombat('escape')
    })

    // ── End combat ────────────────────────────────────────────────────────────
    async function endCombat(result) {
      if (over) return; over=true
      setButtons(false)

      // ── Ally outcome bookkeeping ────────────────────────────────────
      // If an ally was present, record their final state via alliance_log.
      // Tag format: 'ally_<name>_died' or 'ally_<name>_survived'. Narrative
      // nodes can read these and branch on the outcome. We mutate player in
      // memory now; the column is committed by the branch-specific save
      // calls below (we DON'T fire a separate save here because that would
      // race with the win/lose save calls).
      let _allyLogUpdate = null
      if (ally) {
        const tag = ally.alive
          ? 'ally_' + ally.name.toLowerCase() + '_survived'
          : 'ally_' + ally.name.toLowerCase() + '_died'
        const log = player.alliance_log || []
        if (!log.includes(tag)) {
          log.push(tag)
          player.alliance_log = log
          _allyLogUpdate = log
        }
      }

      if (result==='win') {
        const oldXp=player.xp||0, oldLvl=player.level||1
        const newXp=oldXp+(enemy.xp||50)
        const updates={xp:newXp,hp:currentHp}

        // ── Mark boss defeated + loot (zone bosses AND Twin Judges) ──
        const bossNode=NODES[nodeId]
        if (bossNode?.bossKey) {
          const d=markBossDefeated(bossNode.bossKey)
          updates.defeated_bosses=d
        }
        if (enemy.loot) for(const l of enemy.loot) await addItem(l.itemKey,l.qty)

        if (isBoss) {
          // Twin Judges only — chapter unlock + per-form SP
          const uls=player.chapters_unlocked||[1]; if(!uls.includes(3)) uls.push(3)
          updates.chapters_unlocked=uls
          // ── Per-form SP ──
          // Form key matches the canonical Judge forms from world design:
          //   verdict     — Verdict (Final Judge of Humanity)
          //   dominion    — Dominion (Judges of Authority)
          //   absolution  — Absolution (Judge of Purity)
          //   ruin        — Ruin (Judge of Desolation)
          //   equilibrium — Equilibrium (Judges of Balance)
          //   mercy       — Mercy (Judge of Salvation)
          //   wrath       — Wrath (Judge of Ruin)
          // Re-uses the canonForm computed by composeJudgesForm so the form
          // the player saw at fight start matches the class options offered.
          let formKey = extraCtx.judgesForm?.canonForm
          if (!formKey) {
            // Fallback if judgesForm wasn't populated for some reason.
            const moral = extraCtx.playerMoral||0, elems = extraCtx.elementsAttempted||1
            if     (Math.abs(moral)>=70&&elems>=3) formKey='verdict'
            else if(Math.abs(moral)<40&&elems>=2)  formKey='dominion'
            else if(moral>=40&&elems>=2)            formKey='absolution'
            else if(moral<=-40&&elems>=2)           formKey='ruin'
            else if(Math.abs(moral)<40)             formKey='equilibrium'
            else if(moral>=40)                      formKey='mercy'
            else                                    formKey='wrath'
          }
          // Stash on updates so the post-save class picker can read it.
          // Not persisted to DB — used only for the in-memory handoff.
          extraCtx._formKey = formKey
          const spKey='judges_sp_'+formKey
          const alreadyClaimed=(updates.defeated_bosses||player.defeated_bosses||[]).includes(spKey)
          if (!alreadyClaimed) {
            const d2=markBossDefeated(spKey); updates.defeated_bosses=d2
            updates.skill_points=(player.skill_points||0)+1
            updates.sp_claimed=(player.sp_claimed||0)+1
            player.skill_points=updates.skill_points; player.sp_claimed=updates.sp_claimed
            window.showToast('The Judges are defeated. +'+(enemy.xp||600)+' XP · +1 SP')
          } else { window.showToast('The Judges are defeated. +'+(enemy.xp||600)+' XP') }
        }
        // ── ESP award on zone boss win ──
        const WIN_ELEMENT_MAP2 = {
          zone_fire_boss_win:'fire', zone_water_boss_win:'water', zone_lightning_boss_win:'lightning',
          zone_arcane_boss_win:'arcane', zone_shadow_boss_win:'shadow', zone_earth_boss_win:'earth',
          zone_wind_boss_win:'wind', zone_plant_boss_win:'plant', zone_metal_boss_win:'metal', zone_poison_boss_win:'poison',
        }
        if (WIN_ELEMENT_MAP2[onWin]) {
          const elKey=WIN_ELEMENT_MAP2[onWin], espBossKey='esp_awarded_'+onWin
          const currentDefeated=updates.defeated_bosses||player.defeated_bosses||[]
          if (!currentDefeated.includes(espBossKey)) {
            const merged=[...new Set([...currentDefeated,espBossKey])]
            updates.defeated_bosses=merged; player.defeated_bosses=merged
            const espTree=player.esp_tree||{base:[],slots:{},collected:[]}
            if(!espTree.collected)espTree.collected=[]
            const elNodes=['off_n','def_n','flo_n','arc_n','dec_n','off_k','def_k','flo_k','arc_k','dec_k'].map(s=>elKey+'_'+s).filter(k=>!espTree.collected.includes(k))
            if(elNodes.length){espTree.collected.push(...elNodes);player.esp_tree=espTree;updates.esp_tree=espTree}
            const newEsp=(player.esp||0)+3; player.esp=newEsp; updates.esp=newEsp
            window.showToast('⬡ +3 ESP · '+elKey+' nodes unlocked!')
          } else {
            const newEsp=(player.esp||0)+1; player.esp=newEsp; updates.esp=newEsp
            window.showToast('⬡ +1 ESP')
          }
        }
        const lu=await checkLevelUp(oldXp,newXp,oldLvl); if(lu) Object.assign(updates,lu)

        // ── Class skill: combat-end hook (persistent stat updates) ──────
        // Currently used by Prime's Eternal Sovereign (t5a) to carry stat
        // stacks forward between combats. Returns DB column updates to merge.
        const _clsEnd = ClsCombat.onCombatEnd(player, statusEffects, 'win')
        if (Object.keys(_clsEnd.dbUpdates).length > 0) {
          Object.assign(updates, _clsEnd.dbUpdates)
          // Also update in-memory player so subsequent reads see the new values
          for (const k of Object.keys(_clsEnd.dbUpdates)) player[k] = _clsEnd.dbUpdates[k]
        }
        if (_clsEnd.messages.length) window.showToast(_clsEnd.messages[0])

        // Merge ally outcome tag into the same updates payload
        if (_allyLogUpdate) updates.alliance_log = _allyLogUpdate

        await save(updates)
        const nextNode=isBoss?'chapter_end_ch2':onWin
        const acts=$('combat-actions'); if(acts) acts.style.display='none'
        $('combat-over').style.display='block'

        // ── Humanoid enemies → Spare/Execute prompt (combat-driven reputation) ──
        // Constructs/drones go straight to the Continue button; humans deserve
        // a moral beat. Sparing nudges moral_score up and logs a spare; executing
        // nudges it down, increments pvp_kills, and (if the node defines it)
        // awards extra loot. Either choice still proceeds to `nextNode`, unless
        // the node defines onSpare/onExecute as explicit override destinations.
        const node = NODES[nodeId]
        if (enemy.humanoid && !isBoss) {
          $('combat-over').innerHTML = `
            <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:15px;color:var(--ink);margin:0 0 10px 0">
              They're down — bleeding, conscious, looking at you. The System is watching.
            </p>
            <div style="display:flex;flex-direction:column;gap:8px">
              <button class="choice" data-spare>
                <span class="choice-arrow">✦</span>
                <span class="choice-body">Spare them<span class="choice-sub">Moral +5 · the System notes mercy</span></span>
              </button>
              <button class="choice danger" data-execute>
                <span class="choice-arrow">✖</span>
                <span class="choice-body">Execute<span class="choice-sub">Moral -5 · the System notes the kill</span></span>
              </button>
            </div>`
          // Shared helper: apply moral delta + recompute badge + show feedback.
          // Wraps applyMoralChange so we can also accept extraUpdates that
          // get merged into the returned payload (e.g. pvp_kills, alliance_log).
          const applyMoralWithFeedback = (delta, extraUpdates = {}) => {
            // pvp_kills may be updated in this same beat (executions), so we
            // pass the new value through opts so badge gets recomputed against it.
            const opts = {}
            if (extraUpdates.pvp_kills !== undefined) opts.pvpKills = extraUpdates.pvp_kills
            const r = applyMoralChange(player, delta, opts)
            const updates = { ...r.updates, ...extraUpdates }
            const sign = delta > 0 ? '+' : ''
            const ntot = r.newMoral > 0 ? '+'+r.newMoral : String(r.newMoral)
            window.showToast(`Moral ${sign}${delta} · now ${ntot}`, delta < 0)
            if (r.shifted) {
              const variant = (r.newBadge === 'elite' || r.newBadge === 'green') ? 'info' : 'warn'
              window.showSysOverlay(`REPUTATION SHIFT — ${getBadgeShiftLabel(r.oldBadge)} → ${getBadgeShiftLabel(r.newBadge)}`, variant)
            }
            return updates
          }
          const handleSpare = async () => {
            const log = [...(player.alliance_log||[]), 'spared_humanoid']
            const upd = applyMoralWithFeedback(5, { alliance_log: log })
            player.alliance_log = log

            // ── Mourning King — spare bonuses ─────────────────────────
            if (player.active_class === 'mourning_king') {
              // Mercy's Echo (t1b): +2 Wake stacks, +8 SP
              if (ClsCombat.hasSkill(player, 'mourning_king_t1b')) {
                const newWake = Math.min(100, (player.mourning_king_wake_stacks||0) + 2)
                upd.mourning_king_wake_stacks = newWake
                player.mourning_king_wake_stacks = newWake
                upd.sp = Math.min(player.sp_max || 100, (player.sp||0) + 8)
                player.sp = upd.sp
                if (typeof window.showToast === 'function') {
                  window.showToast('☠ Mercy\'s Echo — +2 Wake, +8 SP')
                }
              }
              // Mercy is Power (t5b): +1 Wake permanent across run
              if (ClsCombat.hasSkill(player, 'mourning_king_t5b')) {
                const cur = upd.mourning_king_wake_stacks ?? (player.mourning_king_wake_stacks||0)
                const newWake = Math.min(100, cur + 1)
                upd.mourning_king_wake_stacks = newWake
                player.mourning_king_wake_stacks = newWake
              }
              // Quiet Funeral (t3b): heal 15% max HP
              if (ClsCombat.hasSkill(player, 'mourning_king_t3b')) {
                const maxHp = player.hp_max || maxPlayerHp || 100
                const heal = Math.round(maxHp * 0.15)
                upd.hp = Math.min(maxHp, (player.hp||0) + heal)
                player.hp = upd.hp
                if (typeof window.showToast === 'function') {
                  window.showToast('☠ Quiet Funeral — +'+heal+' HP')
                }
              }
            }

            await save(upd)
            goTo(node?.onSpare || nextNode)
          }
          const handleExecute = async () => {
            const log = [...(player.alliance_log||[]), 'executed_humanoid']
            const newPvp = (player.pvp_kills||0) + 1
            const upd = applyMoralWithFeedback(-5, { alliance_log: log, pvp_kills: newPvp })
            player.alliance_log = log; player.pvp_kills = newPvp
            await save(upd)
            // Optional extra loot for executing — node author opts in via `executeLoot`
            if (enemy.executeLoot) for (const l of enemy.executeLoot) await addItem(l.itemKey, l.qty)
            goTo(node?.onExecute || nextNode)
          }
          $('combat-over').querySelector('[data-spare]')?.addEventListener('click', handleSpare)
          $('combat-over').querySelector('[data-execute]')?.addEventListener('click', handleExecute)
        } else {
          // ── Twin Judges: deferred class picker ────────────────────────────
          // If this is the Twin Judges win AND the player is class-eligible
          // AND hasn't already picked a class, the picker is now DEFERRED
          // (not auto-rendered). The combat-over panel shows an anomaly
          // message + two buttons:
          //   • Continue — advance to chapter_end_ch2, picker waits on the
          //     skills page
          //   • View options now — open the picker modal inline
          // Refuse-in-modal closes the modal; both buttons remain available.
          // Pick-in-modal writes the class to DB and replaces combat-over
          // with just a Continue button.
          //
          // Alliance log tags written:
          //   class_picker_unlocked — set once, indicates the player has
          //     earned the option (used by skills.js to auto-show picker
          //     on first visit)
          //   class_form_<formKey>  — preserves the form the player saw
          //     (in case moral_score shifts before they pick)
          const formKey = extraCtx._formKey
          const choices = (isBoss && formKey && isClassEligible(player) && !hasPickedClass(player))
            ? getClassChoicesForFormKey(formKey)
            : []

          if (choices.length) {
            // Persist unlock + form tags
            const log = (player.alliance_log || []).slice()
            if (!log.includes('class_picker_unlocked')) log.push('class_picker_unlocked')
            // Replace any prior form tag (in case picker was unlocked twice)
            const cleaned = log.filter(t => !t.startsWith('class_form_'))
            cleaned.push('class_form_' + formKey)
            player.alliance_log = cleaned
            // Fire-and-forget save; non-critical for combat resolution.
            save({ alliance_log: cleaned })

            // ── System popup — boss-win class unlock announcement ──────
            // Shows a blocking modal overlay styled as an in-universe
            // System event. Includes pulsing border, scanline pattern,
            // a timestamp header, and the two action buttons. The combat
            // panel underneath shows a quiet Continue button as fallback
            // (in case the popup gets dismissed via ESC or backdrop click).
            const showAnomalyPopup = () => {
              // Hidden behind: a quiet Continue button + view button on the
              // combat-over panel, in case the popup is dismissed.
              $('combat-over').innerHTML = `
                <div style="display:flex;flex-direction:column;gap:8px">
                  <button class="choice" data-next-node="${nextNode}">
                    <span class="choice-arrow">→</span>
                    <span class="choice-body">Continue — handle this later</span>
                  </button>
                  <button class="choice" data-action="view-picker">
                    <span class="choice-arrow">⚖</span>
                    <span class="choice-body">View designation options</span>
                  </button>
                </div>`
              $('combat-over').querySelector('[data-next-node]')?.addEventListener('click', e => goTo(e.currentTarget.dataset.nextNode))
              $('combat-over').querySelector('[data-action=view-picker]')?.addEventListener('click', () => {
                showClassPickerModalCh2(choices, formKey, nextNode)
              })

              // The popup itself. Inserts into document.body so it sits over
              // everything regardless of combat-panel scroll position.
              if (document.getElementById('sys-anomaly-popup')) return
              const ts = new Date().toISOString().slice(11, 19) + 'Z'
              const popup = document.createElement('div')
              popup.id = 'sys-anomaly-popup'
              popup.style.cssText = `
                position:fixed;inset:0;z-index:10000;
                background:radial-gradient(ellipse at center, rgba(28,24,18,.65) 0%, rgba(10,8,5,.92) 80%);
                display:flex;align-items:center;justify-content:center;padding:20px;
                animation:sysAnomalyFadeIn .4s ease-out;
              `
              popup.innerHTML = `
                <style>
                  @keyframes sysAnomalyFadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                  }
                  @keyframes sysAnomalyPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(155,109,255,.5), inset 0 0 0 0 rgba(155,109,255,.15); }
                    50%      { box-shadow: 0 0 24px 2px rgba(155,109,255,.55), inset 0 0 32px 0 rgba(155,109,255,.18); }
                  }
                  @keyframes sysAnomalyScanline {
                    from { background-position: 0 0; }
                    to   { background-position: 0 4px; }
                  }
                  @keyframes sysAnomalyGlitch {
                    0%, 92%, 100% { transform: translateX(0); }
                    93%           { transform: translateX(-1px); }
                    94%           { transform: translateX(1px); }
                    95%           { transform: translateX(-1px); }
                    96%           { transform: translateX(0); }
                  }
                  #sys-anomaly-popup .frame {
                    background:linear-gradient(180deg, rgba(20,16,12,.96) 0%, rgba(28,24,18,.96) 100%);
                    border:2px solid rgba(155,109,255,.65);
                    box-shadow: 0 0 24px 2px rgba(155,109,255,.45), inset 0 0 32px 0 rgba(155,109,255,.12);
                    color:#e8dcc2;
                    max-width:520px;width:100%;
                    font-family:'JetBrains Mono','Share Tech Mono',monospace;
                    position:relative;
                    animation:sysAnomalyPulse 2.6s ease-in-out infinite, sysAnomalyGlitch 5s infinite;
                  }
                  #sys-anomaly-popup .frame::before {
                    content:'';position:absolute;inset:0;pointer-events:none;
                    background:repeating-linear-gradient(0deg, rgba(155,109,255,.04) 0px, rgba(155,109,255,.04) 1px, transparent 1px, transparent 4px);
                    animation:sysAnomalyScanline 1.2s linear infinite;
                  }
                  #sys-anomaly-popup .frame > * { position:relative; z-index:1; }
                  /* ────────────────────────────────────────────────────
                     ESCAPE PARCHMENT GLOBALS
                     The page-level "p, li, span { color: var(--ink) !important }"
                     rule was darkening every <p>/<span> inside this dark
                     overlay (System messages, button text, badge labels).
                     The next rules undo that scoped to the popup ONLY —
                     parchment pages are unaffected.
                     ──────────────────────────────────────────────────── */
                  #sys-anomaly-popup p,
                  #sys-anomaly-popup li,
                  #sys-anomaly-popup span,
                  #sys-anomaly-popup div { color: inherit !important; }
                  /* Re-establish the intended colors with !important so they
                     win over any other late-bound parchment overrides. */
                  #sys-anomaly-popup .sys-header        { color:#c8a8ff !important; }
                  #sys-anomaly-popup .sys-header .badge { color:#ff9090 !important; }
                  #sys-anomaly-popup .sys-title         { color:#d4b4ff !important; }
                  #sys-anomaly-popup .sys-msg           { color:#d8c8a8 !important; }
                  #sys-anomaly-popup .sys-msg em        { color:#c8a8ff !important; }
                  #sys-anomaly-popup .sys-btn           { color:#e8dcc2 !important; }
                  #sys-anomaly-popup .sys-header {
                    display:flex;justify-content:space-between;align-items:center;
                    padding:8px 14px;
                    background:linear-gradient(90deg, rgba(155,109,255,.18), rgba(155,109,255,.04));
                    border-bottom:1px solid rgba(155,109,255,.55);
                    font-size:9px;letter-spacing:.18em;text-transform:uppercase;
                    color:#c8a8ff;
                  }
                  #sys-anomaly-popup .sys-header .badge {
                    background:rgba(255,80,80,.18);
                    border:1px solid rgba(255,80,80,.5);
                    padding:2px 8px;font-size:8px;color:#ff9090;
                    letter-spacing:.2em;
                  }
                  #sys-anomaly-popup .sys-body {
                    padding:18px 22px 14px;
                  }
                  #sys-anomaly-popup .sys-title {
                    font-family:'Cinzel',serif;font-size:1.35rem;font-weight:700;
                    color:#d4b4ff;letter-spacing:.12em;margin-bottom:8px;
                    text-shadow:0 0 12px rgba(155,109,255,.5);
                  }
                  #sys-anomaly-popup .sys-msg {
                    font-family:'Share Tech Mono',monospace;font-size:11px;
                    line-height:1.7;letter-spacing:.04em;color:#d8c8a8;
                    margin-bottom:6px;
                  }
                  #sys-anomaly-popup .sys-msg em {
                    color:#c8a8ff;font-style:normal;font-weight:600;letter-spacing:.06em;
                  }
                  #sys-anomaly-popup .sys-divider {
                    height:1px;background:linear-gradient(90deg, transparent, rgba(155,109,255,.5), transparent);
                    margin:14px 0 12px;
                  }
                  #sys-anomaly-popup .sys-actions {
                    display:flex;flex-direction:column;gap:8px;padding:0 22px 18px;
                  }
                  #sys-anomaly-popup .sys-btn {
                    font-family:'Cinzel',serif;letter-spacing:.08em;
                    background:rgba(155,109,255,.12);
                    border:1px solid rgba(155,109,255,.45);
                    color:#e8dcc2;padding:11px 14px;
                    cursor:pointer;font-size:.85rem;
                    transition:background .15s,border-color .15s,transform .1s;
                    text-align:left;display:flex;align-items:center;gap:10px;
                  }
                  #sys-anomaly-popup .sys-btn:hover {
                    background:rgba(155,109,255,.25);
                    border-color:rgba(155,109,255,.8);
                    transform:translateX(2px);
                  }
                  #sys-anomaly-popup .sys-btn .arrow {
                    font-size:1rem;color:#c8a8ff;flex:none;
                  }
                  #sys-anomaly-popup .sys-btn .sub {
                    display:block;font-family:'Share Tech Mono',monospace;
                    font-size:9px;color:#9a8870;letter-spacing:.1em;
                    margin-top:2px;text-transform:uppercase;
                  }
                  #sys-anomaly-popup .sys-btn.primary {
                    background:rgba(200,168,255,.16);
                    border-color:rgba(200,168,255,.6);
                  }
                  #sys-anomaly-popup .sys-btn.primary:hover {
                    background:rgba(200,168,255,.28);
                  }
                </style>
                <div class="frame">
                  <div class="sys-header">
                    <span>System / 0xANOMALY · ${ts}</span>
                    <span class="badge">⚠ ALERT</span>
                  </div>
                  <div class="sys-body">
                    <div class="sys-title">ANOMALY DETECTED</div>
                    <div class="sys-msg">A hidden pre-requisite has <em>resolved</em>.</div>
                    <div class="sys-msg">The System has logged a <em>designation slot</em> against your record.</div>
                    <div class="sys-msg" style="font-size:10px;color:#9a8870;letter-spacing:.06em;margin-top:8px">› Reference: TWIN-JUDGES :: ${formKey.toUpperCase()}</div>
                    <div class="sys-divider"></div>
                    <div class="sys-msg" style="color:#a8987a">Select how to proceed.</div>
                  </div>
                  <div class="sys-actions">
                    <button class="sys-btn primary" data-action="view">
                      <span class="arrow">⚖</span>
                      <span>View designation options
                        <span class="sub">Open the picker now</span>
                      </span>
                    </button>
                    <button class="sys-btn" data-action="defer">
                      <span class="arrow">→</span>
                      <span>Defer — claim it later on the skills page
                        <span class="sub">A button will remain visible there</span>
                      </span>
                    </button>
                  </div>
                </div>`
              document.body.appendChild(popup)
              popup.querySelector('[data-action=view]').addEventListener('click', () => {
                popup.remove()
                showClassPickerModalCh2(choices, formKey, nextNode)
              })
              popup.querySelector('[data-action=defer]').addEventListener('click', () => {
                popup.remove()
                // combat-over panel still shows both buttons — fine
              })
            }

            const renderCombatOverWithPickerButton = showAnomalyPopup

            // The modal — overlay over the whole viewport. Pick or refuse.
            // On pick, writes class + replaces combat-over with a single
            // Continue button (no more View Now since the choice is made).
            const showClassPickerModalCh2 = (choices, formKey, nextNode) => {
              const heading = formKey === 'verdict'
                ? 'ANOMALY CASCADE — three paths recognized. Choose one. The choice is final.'
                : 'ANOMALY DETECTED — the System offers a designation. Choose one. The choice is final.'

              const cards = choices.map(key => {
                const cls = CLASSES[key]
                if (!cls) return ''
                let peekItems = []
                if (Array.isArray(cls.tiers) && cls.tiers[0]) {
                  const t1 = cls.tiers[0]
                  for (const b of ['a', 'b', 'c']) {
                    if (Array.isArray(t1[b]) && t1[b][0]) peekItems.push(t1[b][0])
                  }
                  peekItems = peekItems.slice(0, 2)
                } else if (Array.isArray(cls.skills)) {
                  peekItems = cls.skills.slice(0, 2).map(s => Array.isArray(s) ? s[0] : s)
                }
                const peek = peekItems.map(name => `<li style="margin:0;padding:0;font-family:'Cormorant Garamond',serif;font-size:13px;color:var(--ink-dim);line-height:1.35">▸ ${name}</li>`).join('')
                return `
                  <button class="cls-card" data-class="${cls.key}" style="
                      text-align:left;cursor:pointer;background:rgba(244,234,215,.55);
                      border:1px solid ${cls.color}66;padding:14px 16px;
                      font-family:inherit;color:inherit;display:flex;flex-direction:column;gap:8px;
                      transition:border-color .15s, background .15s, transform .15s;">
                    <div style="display:flex;align-items:baseline;gap:8px">
                      <span style="font-family:'Cinzel',serif;font-size:1.05rem;color:${cls.color};font-weight:700;letter-spacing:.06em">${cls.name}</span>
                      <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--ink-dim);letter-spacing:.08em">${(cls.judgeOf||'').toUpperCase()}</span>
                    </div>
                    <p style="margin:0;font-family:'IM Fell English',serif;font-style:italic;font-size:14px;color:var(--ink);line-height:1.4">${cls.tagline||''}</p>
                    <ul style="margin:0;padding:0;list-style:none">${peek}</ul>
                  </button>`
              }).join('')

              const modal = document.createElement('div')
              modal.id = 'cls-picker-modal'
              modal.style.cssText = 'position:fixed;inset:0;background:rgba(28,24,18,.82);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;overflow-y:auto'
              modal.innerHTML = `
                <div style="background:var(--paper,#f4ead7);border:2px solid var(--ink,#3a2a1a);padding:20px;max-width:520px;width:100%;font-family:'JetBrains Mono',monospace;color:var(--ink,#3a2a1a);max-height:90vh;overflow-y:auto">
                  <div style="margin-bottom:14px;padding:8px 10px;border:1px solid rgba(155,109,255,.45);background:rgba(155,109,255,.08);font-size:10px;letter-spacing:.06em;line-height:1.5">
                    ⚠ ${heading}
                  </div>
                  <div style="display:flex;flex-direction:column;gap:10px">${cards}</div>
                  <button id="cls-picker-refuse" style="margin-top:14px;width:100%;padding:8px 12px;background:transparent;border:1px solid var(--ink,#3a2a1a);font-family:inherit;font-size:11px;letter-spacing:.1em;color:var(--ink,#3a2a1a);cursor:pointer;text-transform:uppercase">↩ Decide Later</button>
                </div>`
              document.body.appendChild(modal)

              modal.querySelectorAll('.cls-card').forEach(btn => {
                btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(244,234,215,.85)'; btn.style.transform='translateY(-1px)' })
                btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(244,234,215,.55)'; btn.style.transform='none' })
                btn.addEventListener('click', async () => {
                  const classKey = btn.dataset.class
                  const cls = CLASSES[classKey]
                  if (!cls) return
                  modal.querySelectorAll('.cls-card').forEach(other => {
                    other.style.pointerEvents = 'none'
                    if (other !== btn) other.style.opacity = '0.3'
                  })
                  btn.style.borderColor = cls.color
                  btn.style.background = cls.color + '22'
                  try {
                    const upd = pickClass(player, classKey)
                    Object.assign(player, upd)
                    await save(upd)
                  } catch (err) {
                    console.error('[class pick] failed', err)
                    window.showToast?.('Failed to save class — try again', true)
                    return
                  }
                  window.showSysOverlay?.(cls.unlockNarrative, 'warn')
                  setTimeout(() => {
                    modal.remove()
                    // Replace combat-over with just Continue (no more View Now)
                    $('combat-over').innerHTML = `<button class="choice" data-next-node="${nextNode}"><span class="choice-arrow">→</span><span class="choice-body">You are <em style="color:${cls.color}">${cls.name}</em>. Continue.</span></button>`
                    $('combat-over').querySelector('[data-next-node]')?.addEventListener('click', e => goTo(e.currentTarget.dataset.nextNode))
                  }, 1800)
                })
              })
              modal.querySelector('#cls-picker-refuse').addEventListener('click', () => {
                modal.remove()
                // combat-over still has both buttons; nothing to re-render
              })
            }

            renderCombatOverWithPickerButton()
          } else {
            $('combat-over').innerHTML=`<button class="choice" data-next-node="${nextNode}"><span class="choice-arrow">→</span><span class="choice-body">${isBoss?'The Judges are defeated. Chapter ends.':'Continue'}</span></button>`
            $('combat-over').querySelector('[data-next-node]')?.addEventListener('click', event => goTo(event.currentTarget.dataset.nextNode))
          }
        }
      } else if (result==='escape') {
        const escapeUpdates = { hp: currentHp }
        if (_allyLogUpdate) escapeUpdates.alliance_log = _allyLogUpdate
        await save(escapeUpdates)
        const acts=$('combat-actions'); if(acts) acts.style.display='none'
        $('combat-over').style.display='block'
        $('combat-over').innerHTML=`<button class="choice" data-next-node="${onEscape||'district_hub'}"><span class="choice-arrow">↩</span><span class="choice-body">You escape</span></button>`
        $('combat-over').querySelector('[data-next-node]')?.addEventListener('click', event => goTo(event.currentTarget.dataset.nextNode))
      } else {
        // 'lose' / defeat path
        // ── Class skill: combat-end hook for defeat ─────────────────────
        // Lets Prime/Mourning King reset their accumulated stacks to 0.
        // Returns DB updates which we merge into the same save call.
        const _clsEnd = ClsCombat.onCombatEnd(player, statusEffects, 'lose')
        const loseUpdates = { hp: Math.max(1, Math.round(maxPlayerHp*0.25)) }
        if (Object.keys(_clsEnd.dbUpdates).length > 0) {
          Object.assign(loseUpdates, _clsEnd.dbUpdates)
          for (const k of Object.keys(_clsEnd.dbUpdates)) player[k] = _clsEnd.dbUpdates[k]
        }
        if (_clsEnd.messages.length && typeof window.showToast === 'function') {
          window.showToast(_clsEnd.messages[0])
        }
        currentHp = loseUpdates.hp
        // Merge ally outcome tag into the same updates payload
        if (_allyLogUpdate) loseUpdates.alliance_log = _allyLogUpdate
        await save(loseUpdates)
        const acts=$('combat-actions'); if(acts) acts.style.display='none'
        $('combat-over').style.display='block'
        $('combat-over').innerHTML=`<p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.8rem;color:#e05555;margin-bottom:.5rem">You fall.</p><button class="choice" data-next-node="${onLose||'district_hub'}"><span class="choice-arrow">↩</span><span class="choice-body">Try again</span></button>`
        $('combat-over').querySelector('[data-next-node]')?.addEventListener('click', event => goTo(event.currentTarget.dataset.nextNode))
      }
    }

    // ── Main turn function ────────────────────────────────────────────────────
    window['doAction_'+cid]=async function(action){
      if(over)return
      if(action==='escape'){log('You disengage and retreat.');await endCombat('escape');return}
      await doTurn(action,null)
    }

    async function doTurn(playerAction, skillKey=null) {
      if(over)return
      setButtons(false)
      defending=false
      const luckBonus=Math.floor(eqLuck/2)

      // ── Unwritten — Bury the Hour: snapshot state at turn start ──
      // Rolling buffer of last 4 snapshots (one per player turn). On
      // active fire, oldest snapshot is restored. Only enabled if player
      // is Unwritten + has the skill (cheap check; skip otherwise).
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
          // Deep clone of statusEffects, but exclude the buffer itself to
          // avoid recursion. Skip non-numeric/string nested objects we
          // wouldn't restore safely.
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
        // Keep only the last 4 snapshots
        if (statusEffects.cls_rewindBuffer.length > 4) {
          statusEffects.cls_rewindBuffer.shift()
        }
      }

      // Tick cooldowns and status
      if(statusEffects.enemyStunTurns>0) statusEffects.enemyStunTurns--
      if(statusEffects.rootTrapTurns>0)  statusEffects.rootTrapTurns--
      Object.keys(statusEffects.skillCooldowns).forEach(k=>{if(statusEffects.skillCooldowns[k]>0)statusEffects.skillCooldowns[k]--})

      // Mourner's Pace (Hollow t2b): SPD doubles below 50% HP.
      let pSPD=playerSPD()+(statusEffects.playerSPDBonus||0)
      if (player.active_class === 'hollow'
          && ClsCombat.hasSkill(player, 'hollow_t2b')
          && currentHp < maxPlayerHp * 0.5) {
        pSPD *= 2
      }
      // Slow (applied by enemyAI.js): halves SPD while active
      if (statusEffects.playerSlowTurns > 0) pSPD = Math.floor(pSPD / 2)
      // Terror (applied by enemyAI.js): skills are unusable while active. If
      // the player tried to use a skill, fall back to a basic strike with a
      // message. Cosmetic concession — disabling the skill button at the UI
      // level would be cleaner but requires renderClassSkills changes.
      if (statusEffects.playerTerrorTurns > 0 && playerAction === 'skill') {
        log('😱 You cannot focus enough to channel skills.')
        playerAction = 'strike'
        skillKey = null
      }
      const eSPD=enemySPD()
      const razorTempo=statusEffects.razorTempo&&playerAction==='strike'
      const dashStrike=skillKey==='wind_skill_dash_strike'
      const pEffSPD=pSPD+(playerAction==='heavy'?-3:0)+Math.floor(Math.random()*3)
      const eEffSPD=eSPD+Math.floor(Math.random()*3)
      let playerFirst=dashStrike||razorTempo||(playerAction==='defend')?true:pEffSPD>eEffSPD||(pEffSPD===eEffSPD&&Math.random()<0.5)

      let messages=[]

      function resolvePlayerAction() {
        if(playerAction==='strike') {
          const roll=Math.floor(Math.random()*(6+luckBonus))+1
          let baseATK=playerATK()+(statusEffects.playerATKBonus||0)
          const ignoreDEF=statusEffects.ignoreEnemyDEF; statusEffects.ignoreEnemyDEF=false
          const flickerMult=statusEffects.flickerReady?2:1; if(statusEffects.flickerReady)statusEffects.flickerReady=false

          // ── Class skill: pre-attack hook ──────────────────────────────
          // Populate HP-pct hints so hooks like Equal Measure can read them.
          statusEffects._enginePlayerHpPct = currentHp / Math.max(1, maxPlayerHp)
          statusEffects._engineEnemyHpPct  = enemyHp / Math.max(1, maxEnemyHp)
          const _clsAtk = ClsCombat.onPlayerAttack(player, statusEffects, enemy, baseATK + roll)
          for (const m of _clsAtk.messages) messages.push(m)
          // Defensive coercion — any field undefined gets a safe default so
          // the strike math never produces NaN. Protects against class_combat
          // versions that might be deployed out of sync with this engine.
          const _dmgMult       = (typeof _clsAtk.dmgMult       === 'number') ? _clsAtk.dmgMult       : 1
          const _critChanceAdd = (typeof _clsAtk.critChanceAdd === 'number') ? _clsAtk.critChanceAdd : 0
          const _defIgnoreFrac = (typeof _clsAtk.defIgnoreFrac === 'number') ? _clsAtk.defIgnoreFrac : 0
          const _bonusFlatDmg  = (typeof _clsAtk.bonusFlatDmg  === 'number') ? _clsAtk.bonusFlatDmg  : 0

          let dmg=Math.max(1,Math.round(((baseATK+roll)*flickerMult+_bonusFlatDmg)*_dmgMult))
          // Crit chance from Judgment Chain or other sources — roll it.
          let wasCrit = false
          if (_critChanceAdd > 0 && Math.random() < _critChanceAdd) {
            wasCrit = true
            dmg = Math.round(dmg * 1.5)
            messages.push('⚖ Judgment Chain — critical strike.')
            // Executioner's Eye: crits ignore 50% enemy DEF
            if (_defIgnoreFrac > 0 && (enemy.def||0) > 0) {
              const defBonus = Math.round((enemy.def||0) * _defIgnoreFrac)
              dmg += defBonus
              messages.push(`⚖ Executioner's Eye — pierced ${defBonus} DEF.`)
            }
          }
          const oldEnemyHp = enemyHp
          enemyHp=Math.max(0,enemyHp-dmg)
          messages.push('You strike for <strong>'+dmg+'</strong>.'+(ignoreDEF?' (DEF ignored)':''))

          // ── Class skill: post-attack hook ──────────────────────────────
          // Computes deferred damage from Delayed Verdict, increments hit counters.
          const _clsPost = ClsCombat.onPlayerAttackPost(player, statusEffects, enemy, dmg, wasCrit)
          for (const m of _clsPost.messages) messages.push(m)
          if (_clsPost.deferredDamage > 0 && enemyHp > 0) {
            // Apply deferred damage immediately at the end of player action.
            const deferred = _clsPost.deferredDamage
            enemyHp = Math.max(0, enemyHp - deferred)
          }
          // Life-steal: apply healToPlayer from class hooks
          if (_clsPost.healToPlayer > 0) {
            currentHp = Math.min(maxPlayerHp, currentHp + _clsPost.healToPlayer)
          }

          // ── Class skill: post-attack effects ────────────────────────────
          // Cataclysm dropped HP to 1 — apply now.
          if (statusEffects.cls_cataclysmAfterEffect) {
            currentHp = 1
            statusEffects.cls_cataclysmAfterEffect = false
            messages.push('💥 Cataclysm consumed your blood. 1 HP remains.')
          }
          // Hollow drop-to-1 signals (Endless Hollow / Survivor's End)
          if (statusEffects.cls_endlessHollowDropToOne) {
            currentHp = 1
            statusEffects.cls_endlessHollowDropToOne = false
          }
          if (statusEffects.cls_survivorsEndDropToOne) {
            // Apply heal THEN drop. Heal first because the active is "heal,
            // damage, drop" in order.
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
            messages.push(`⚠ Kernel Panic dealt <strong>${panicDmg}</strong>. You drop to 1 HP.`)
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
            messages.push(`✕ Null pulse strikes for <strong>${pulseDmg}</strong>.`)
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
            messages.push(`⚠ Recursion — second hit for <strong>${rdmg}</strong>.`)
          }

          // ── Class skill: HP-change hook (execute checks) ───────────────
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
          if(unlocked.includes('fire_passive_burn')){const lv=_skillLv('fire_passive_burn');statusEffects.burnTurns=Math.round(2+(lv-1)*(2/9));statusEffects.burnDmg=Math.round(3+(lv-1)*(3/9));messages.push('🔥 Burn applied!')}
          if(unlocked.includes('lightning_passive_chain_damage')){const lv=_skillLv('lightning_passive_chain_damage');if(Math.random()<0.20+(lv-1)*(0.20/9)){const cd=Math.max(1,Math.floor(dmg*(0.50+(lv-1)*(0.40/9))));enemyHp=Math.max(0,enemyHp-cd);messages.push('⚡ Chain hit <strong>'+cd+'</strong>!')}}
          if(statusEffects.venomFang&&Math.random()<0.15){statusEffects.burnTurns=Math.max(statusEffects.burnTurns,2);messages.push('☠ Venom Fang — poison!')}
          if(statusEffects.ricochet&&Math.random()<0.20){const bd=Math.max(1,Math.floor(dmg*0.4));enemyHp=Math.max(0,enemyHp-bd);messages.push('🎯 Ricochet +<strong>'+bd+'</strong>!')}
          if(statusEffects.nextCrit){statusEffects.nextCrit=false;const cb=Math.floor(dmg*0.75);enemyHp=Math.max(0,enemyHp-cb);messages.push('🎯 Crit +<strong>'+cb+'</strong>!')}
        } else if(playerAction==='heavy') {
          const roll=Math.floor(Math.random()*(10+luckBonus))+3
          const dmg=Math.max(1,Math.round(playerATK()*1.6)+roll)
          enemyHp=Math.max(0,enemyHp-dmg)
          messages.push('Heavy strike <strong>'+dmg+'</strong>!')
        } else if(playerAction==='defend') {
          defending=true; messages.push('You brace — defense doubled.')
          if(statusEffects.absorptionHeal){const h=statusEffects.absorptionHeal;currentHp=Math.min(maxPlayerHp,currentHp+h);statusEffects.absorptionHeal=0;messages.push('🛡 Absorption +<strong>'+h+'</strong> HP!')}
          // ── Bastion Bulwark on Defend (t1a) ─────────────────────────
          if (player.active_class === 'bastion') {
            statusEffects.cls_lastActionDefend = true
            const cap = statusEffects.cls_bulwarkCap || 10
            statusEffects.cls_bulwarkStacks = Math.min(cap, (statusEffects.cls_bulwarkStacks || 0) + 1)
            messages.push('🛡 Bulwark — '+statusEffects.cls_bulwarkStacks+' stacks.')
            // Riposte (t1b): Defend deals damage = DEF × 0.5 to enemy
            if (ClsCombat.hasSkill(player, 'bastion_t1b')) {
              const def = (player.def||2)+(statusEffects.playerDEFBonus||0)
              const ripDmg = Math.max(1, Math.round(def * 0.5))
              enemyHp = Math.max(0, enemyHp - ripDmg)
              messages.push('🛡 Riposte deals <strong>'+ripDmg+'</strong>.')
            }
            // Unmoving (t4c): Defend removes one debuff
            if (ClsCombat.hasSkill(player, 'bastion_t4c')) {
              const debuffFields = ['burnTurns','poisonTurns','cls_bleedingTurns','cls_rotTurns','cls_silenceTurns']
              for (const k of debuffFields) {
                if ((statusEffects[k]||0) > 0) {
                  statusEffects[k] = 0
                  messages.push('🛡 Unmoving — '+k.replace(/Turns$/,'').replace(/^cls_/,'')+' cleansed.')
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
            messages.push("☀ Vigil's Stand — +"+heal+" HP, +2 Sun.")
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
              messages.push("⚔ Patience of Stone — +1% damage permanent ("+(cur+1)+"%).")
            }
          }
        } else if(playerAction==='skill'&&skillKey) {
          const sk=BATTLE_SKILLS[skillKey]; if(!sk)return
          statusEffects.skillCooldowns[skillKey]=sk.type==='ultimate'?4:2
          const sc=skillScale(skillKey),lv=_skillLv(skillKey)
          // Skill effects
          if(sk.fn==='shadowStep'){statusEffects.ignoreEnemyDEF=true;messages.push('🌑 Shadow Step — next attack ignores DEF!')}
          else if(sk.fn==='rockArmor'){const b=Math.round(20*sc);statusEffects.playerDEFBonus=(statusEffects.playerDEFBonus||0)+b;statusEffects.rockArmorTurns=2;messages.push('🪨 Rock Armor +'+b+' DEF!')}
          else if(sk.fn==='earthquake'){const d=Math.max(5,Math.round(playerATK()*2*sc));enemyHp=Math.max(0,enemyHp-d);statusEffects.enemyStunTurns=1;messages.push('🌍 Earthquake <strong>'+d+'</strong> — stunned!')}
          else if(sk.fn==='fireBlast'){const d=Math.max(1,Math.round((25*sc+playerATK())-Math.floor((enemy.def||0)*0.5)));enemyHp=Math.max(0,enemyHp-d);messages.push('🔥 Fire Blast <strong>'+d+'</strong>!')}
          else if(sk.fn==='infernoZone'){statusEffects.infernoTurns=3;statusEffects.infernoDmg=Math.round(40*sc);messages.push('🔥 Inferno Zone — '+statusEffects.infernoDmg+' dmg/turn!')}
          else if(sk.fn==='healPulse'){const h=Math.round(25*sc);currentHp=Math.min(maxPlayerHp,currentHp+h);messages.push('✨ Heal Pulse +<strong>'+h+'</strong> HP!')}
          else if(sk.fn==='divineBarrier'){statusEffects.invulnerable=true;statusEffects.divineBarrierReflect=true;messages.push('✨ Divine Barrier — invulnerable this turn!')}
          else if(sk.fn==='lightningStrike'){const d=Math.round((30+playerATK()*0.5)*sc);enemyHp=Math.max(0,enemyHp-d);messages.push('⚡ Lightning Strike <strong>'+d+'</strong>!')}
          else if(sk.fn==='thunderstorm'){let tot=0;for(let i=0;i<5;i++){const b=Math.round(10*sc)+Math.floor(Math.random()*Math.round(10*sc));tot+=b;enemyHp=Math.max(0,enemyHp-b)};messages.push('⚡ Thunderstorm <strong>'+tot+'</strong>!')}
          else if(sk.fn==='bladeForm'){const ab=Math.round(20*sc),sb=Math.round(5*sc);statusEffects.playerATKBonus=(statusEffects.playerATKBonus||0)+ab;statusEffects.playerSPDBonus=(statusEffects.playerSPDBonus||0)+sb;messages.push('⚙ Blade Form ATK+'+ab+' SPD+'+sb+'!')}
          else if(sk.fn==='ironDomain'){const ab=Math.round(playerATK()*sc);statusEffects.playerATKBonus=(statusEffects.playerATKBonus||0)+ab;messages.push('⚙ Iron Domain ATK+'+ab+'!')}
          else if(sk.fn==='rootTrap'){statusEffects.rootTrapTurns=1;messages.push('🌿 Root Trap — enemy rooted!')}
          else if(sk.fn==='overgrowth'){const h=Math.round(40*sc),d=Math.round(30*sc);currentHp=Math.min(maxPlayerHp,currentHp+h);enemyHp=Math.max(0,enemyHp-d);messages.push('🌿 Overgrowth +'+h+' HP & <strong>'+d+'</strong> dmg!')}
          else if(sk.fn==='waterShield'){const s=Math.round(30*sc);statusEffects.waterShield=(statusEffects.waterShield||0)+s;messages.push('💧 Water Shield absorbs '+s+' dmg!')}
          else if(sk.fn==='tsunami'){const d=Math.round((50+playerATK()*0.4)*sc);enemyHp=Math.max(0,enemyHp-d);statusEffects.enemyStunTurns=1;messages.push('🌊 Tsunami <strong>'+d+'</strong> — stunned!')}
          else if(sk.fn==='dashStrike'){const d=Math.max(1,Math.round((playerATK()*2+Math.floor(Math.random()*8))*sc));enemyHp=Math.max(0,enemyHp-d);messages.push('💨 Dash Strike <strong>'+d+'</strong>!')}
          else if(sk.fn==='tornadoField'){statusEffects.enemyATKMult=Math.min(1,1-Math.round(sc*30)/100);statusEffects.playerSPDBonus=(statusEffects.playerSPDBonus||0)+pSPD;messages.push('💨 Tornado Field — enemy ATK -'+Math.round(sc*30)+'%!')}
          else if(sk.fn==='voidZone'){statusEffects.enemyATKMult=Math.min(1,1-Math.round(sc*30)/100);messages.push('🌑 Void Zone — enemy ATK -'+Math.round(sc*30)+'%!')}
          else if(sk.fn==='warbound'){statusEffects.playerATKBonus=(statusEffects.playerATKBonus||0)+Math.round(playerATK()*0.15);messages.push('✦ Warbound — ATK +15% this turn!')}
          else if(sk.fn==='embersEnd'){const eb=enemyHp/maxEnemyHp<0.3?0.25:0;const d=Math.max(1,Math.round(playerATK()*(1+eb)*sc));enemyHp=Math.max(0,enemyHp-d);messages.push('✦ Executioner <strong>'+d+'</strong>!'+(eb>0?' [execute bonus]':''))}
          else if(sk.fn==='venomLance'){statusEffects.venomLanceTurns=3;messages.push('☠ Venom Lance — next Heavy poisons!')}
          else if(sk.fn==='predator'){const ab=Math.round(20*sc);statusEffects.playerATKBonus=(statusEffects.playerATKBonus||0)+ab;messages.push('✦ Predator ATK+'+ab+'!')}
          else if(sk.fn==='foresight'){statusEffects.foresightThisTurn=true;messages.push('🔮 Hex Weave — incoming dmg -90% this turn!')}
          else if(sk.fn==='preciseStrike'){statusEffects.nextCrit=true;messages.push('🎯 Mind Pierce — next attack crits ×1.75!')}
          else if(sk.fn==='heavyGround'){statusEffects.enemySPDDebuff=(statusEffects.enemySPDDebuff||0)+6;messages.push('🌀 Lockdown — enemy SPD -6!')}
          else if(sk.fn==='phantomStep'){statusEffects.phantomStep=true;statusEffects.nextCrit=true;messages.push('👻 Phantom Step — untargetable + guaranteed crit!')}
          else if(sk.fn==='timeLock'){statusEffects.enemyStunTurns=1;statusEffects.nextCrit=true;messages.push('⏱ Time Lock — enemy frozen, next attack ×2!')}
          else if(sk.fn==='earthSpike'){const d=Math.max(1,Math.round((20-Math.floor((enemy.def||0)*0.3))*sc));enemyHp=Math.max(0,enemyHp-d);messages.push('🪨 Ground Spike <strong>'+d+'</strong>!')}
          else if(sk.fn==='nightshroud'){statusEffects.nightshroud=true;messages.push('🌑 Nightshroud — first dodge is free!')}
          else if(sk.fn==='thornwall'){statusEffects.thornwall=true;messages.push('🌿 Thornwall — Defend reflects 15% dmg!')}
          else if(sk.fn==='dreadPulse'){statusEffects.dreadPulseStacks=(statusEffects.dreadPulseStacks||0);messages.push('💀 Dread Pulse active — each hit -2 enemy ATK!')}
          else if(sk.fn==='pressureWave'){const b=Math.round(20*sc);statusEffects.playerDEFBonus=(statusEffects.playerDEFBonus||0)+b;messages.push('🛡 Fortress +'+b+' DEF!')}
          else if(sk.fn==='chargedStance'){statusEffects.chargedStance=true;messages.push('🛡 Bulwark — DEF doubled next turn!')}
          else if(sk.fn==='deepCurrent'){const b=Math.round(30*sc);statusEffects.playerDEFBonus=(statusEffects.playerDEFBonus||0)+b;statusEffects.deepCurrentShield=true;messages.push('💧 Deep Current +'+b+' DEF + absorb!')}
          else if(sk.fn==='ironMirror'){statusEffects.ironMirror=true;statusEffects.playerDEFBonus=(statusEffects.playerDEFBonus||0)+15;messages.push('⚙ Iron Mirror — reflect 40% next hit!')}
          else if(sk.fn==='reaperForm'){statusEffects.playerATKBonus=(statusEffects.playerATKBonus||0)+Math.round(playerATK()*0.5*sc);statusEffects.ignoreEnemyDEF=true;messages.push('☠ Reaper Form — ATK ×1.5, ignore DEF!')}
          else if(sk.fn==='bloodthirst'){messages.push('🩸 Bloodthirst ready — triggers on kill!')}
          else if(sk.fn==='spellSurge'){statusEffects.spellSurge=true;messages.push('✨ Spell Surge — next skill ×1.5!')}
          else if(sk.fn==='sixthSense'){statusEffects.sixthSense=true;messages.push('👁 Sixth Sense — predicting enemy move!')}
          else if(sk.fn==='chaosEngine'){const effects=['fire','stun','heal','buff'];const ef=effects[Math.floor(Math.random()*effects.length)];if(ef==='fire'){const d=Math.round(30*sc);enemyHp=Math.max(0,enemyHp-d);messages.push('🌀 Chaos — blast for <strong>'+d+'</strong>!')}else if(ef==='stun'){statusEffects.enemyStunTurns=1;messages.push('🌀 Chaos — enemy stunned!')}else if(ef==='heal'){const h=Math.round(25*sc);currentHp=Math.min(maxPlayerHp,currentHp+h);messages.push('🌀 Chaos — healed <strong>'+h+'</strong>!')}else{statusEffects.playerATKBonus=(statusEffects.playerATKBonus||0)+Math.round(15*sc);messages.push('🌀 Chaos — ATK buffed!')}}
          else if(sk.fn==='ancientRoot'){statusEffects.ancientRootShield=Math.round(maxPlayerHp*0.2*sc);messages.push('🌿 Ancient Root — shield activated!')}
        }
      }

      function resolveEnemyAction() {
        if(statusEffects.enemyStunTurns>0||statusEffects.rootTrapTurns>0){messages.push(enemy.name+' is <em>immobilized</em> this turn!');return}
        if(statusEffects.phantomStep){statusEffects.phantomStep=false;messages.push(enemy.name+' attacks — but you phase out!');return}
        let eDmg=Math.max(1,Math.round((enemy.atk||10)-(defending?playerDEF()*2:playerDEF())+(Math.random()*6|0)))
        eDmg=Math.round(eDmg*(statusEffects.enemyATKMult||1.0))
        // Cowardice modifier (#20): Twin Judges hit harder while player is
        // under 50% HP. Only applies to the Judges fight (gated by judgesForm).
        if (extraCtx.judgesForm?.cowardice && currentHp > 0 && currentHp <= maxPlayerHp * 0.5) {
          eDmg = Math.round(eDmg * 1.2)
        }
        if(statusEffects.invulnerable){messages.push(enemy.name+' strikes — you are <em>invulnerable</em>!');if(statusEffects.divineBarrierReflect){const r=Math.round(eDmg*0.5);enemyHp=Math.max(0,enemyHp-r);messages.push('✨ Reflected <strong>'+r+'</strong> damage!')};statusEffects.invulnerable=false;statusEffects.divineBarrierReflect=false;return}
        if(statusEffects.foresightThisTurn){eDmg=Math.round(eDmg*0.1);statusEffects.foresightThisTurn=false;messages.push('🔮 Hex Weave absorbed most damage!')}
        if(statusEffects.waterShield>0){const abs=Math.min(statusEffects.waterShield,eDmg);eDmg=Math.max(0,eDmg-abs);statusEffects.waterShield=Math.max(0,statusEffects.waterShield-abs);if(abs>0)messages.push('💧 Shield absorbed <strong>'+abs+'</strong>!')}
        if(statusEffects.ancientRootShield>0){const abs=Math.min(statusEffects.ancientRootShield,eDmg);eDmg=Math.max(0,eDmg-abs);statusEffects.ancientRootShield=Math.max(0,statusEffects.ancientRootShield-abs);if(abs>0)messages.push('🌿 Root Shield absorbed <strong>'+abs+'</strong>!')}
        // ── Class skill: player-hit hook ───────────────────────────────────
        // Lets Equal Measure reduce damage, Witness Stand build stacks,
        // Scales of Truth prime a vengeance strike, Law of Balance reflect.
        if (eDmg > 0) {
          statusEffects._enginePlayerHpPct = currentHp / Math.max(1, maxPlayerHp)
          statusEffects._engineEnemyHpPct  = enemyHp  / Math.max(1, maxEnemyHp)
          const _clsHit = ClsCombat.onPlayerHit(player, statusEffects, enemy, eDmg, maxPlayerHp)
          for (const m of _clsHit.messages) messages.push(m)
          eDmg = Math.round(eDmg * (_clsHit.dmgMult || 1))
          if (_clsHit.reflectAmount > 0) enemyHp = Math.max(0, enemyHp - _clsHit.reflectAmount)
        }
        if(eDmg>0){
          // The Throne (Monarch t6a) — HP cannot drop below 1 for 4 turns
          // Loyal Guard (Monarch t2b) — first killing blow sets HP to 1
          let newHp = Math.max(0, currentHp - eDmg)
          if (statusEffects.cls_throneTurns > 0 && newHp < 1) {
            newHp = 1
            messages.push('👑 The Throne — you stand.')
          } else if (statusEffects.cls_loyalGuardSavedHp && newHp <= 0) {
            newHp = 1
            statusEffects.cls_loyalGuardSavedHp = 0
          }
          currentHp = newHp
          messages.push(enemy.name+' strikes for <strong>'+eDmg+'</strong>.')
        }
        if(statusEffects.metalReflect&&eDmg>0){const ref=Math.round(eDmg*0.15);enemyHp=Math.max(0,enemyHp-ref);messages.push('⚙ Reflect <strong>'+ref+'</strong> back!')}
        if(statusEffects.liveWire&&Math.random()<0.20){statusEffects.enemyStunTurns=1;messages.push('⚡ Thorns — enemy stunned!')}
        if(statusEffects.ironMirror){const ref=Math.round(eDmg*0.4);enemyHp=Math.max(0,enemyHp-ref);statusEffects.ironMirror=false;messages.push('⚙ Iron Mirror reflected <strong>'+ref+'</strong>!')}
        // Ghost step dodge on counterattack
        if(statusEffects.ghostStep&&Math.random()<0.15){const cd=Math.round(playerATK()*0.5);enemyHp=Math.max(0,enemyHp-cd);messages.push('👻 Ghost Step counter <strong>'+cd+'</strong>!')}
        // Umbral Veil
        if(statusEffects.umbralVeil&&Math.random()<0.15){const cd=Math.round(playerATK()*0.5);enemyHp=Math.max(0,enemyHp-cd);messages.push('🌑 Umbral Veil counter <strong>'+cd+'</strong>!')}
      }

      // Turn order
      if(skillKey) recordSkillUse(skillKey)
      // Player stun gate (applied by enemyAI.js): if stunned, skip player
      // action this turn. Enemy still gets to act. The tick happens later
      // in the DoT block so this turn counts against the duration.
      const playerStunned = (statusEffects.playerStunTurns||0) > 0
      if (playerStunned) {
        log('⚡ You are stunned and cannot act.')
        if (currentHp > 0) resolveEnemyAction()
      } else if(playerFirst){resolvePlayerAction();if(enemyHp>0)resolveEnemyAction()}
      else{resolveEnemyAction();if(currentHp>0)resolvePlayerAction()}

      // Quickstep (Ghostblade t3a): every 3rd basic strike grants a free
      // chained strike. Flag is set in onPlayerAttackPost. We resolve one
      // additional strike here (max one chain per turn to prevent recursion).
      // Also skip if the player was stunned this turn — no strike happened.
      if (!playerStunned && statusEffects.cls_quickstepFreeStrike && enemyHp > 0 && currentHp > 0
          && playerAction === 'strike') {
        statusEffects.cls_quickstepFreeStrike = false
        resolvePlayerAction()
      }

      // ── Ally turn ──────────────────────────────────────────────────
      // The ally attacks the enemy if both are still alive. ~40% chance of
      // taking retaliation damage per swing. If ally HP hits 0, ally.alive
      // flips to false (the bar greys out) but combat continues. The death
      // is one-shot logged via statusEffects.ally_died (the engine appends
      // to alliance_log later for the narrative).
      if (ally && ally.alive && enemyHp > 0) {
        const aDmg = Math.max(1, (ally.atk || 5) + Math.floor(Math.random() * 4))
        enemyHp = Math.max(0, enemyHp - aDmg)
        // Only check retaliation if the enemy is still alive after the swing.
        // Otherwise the ally is striking a dead enemy and would take
        // retaliation from a corpse, which is nonsense.
        if (enemyHp > 0 && Math.random() < 0.4) {
          const aHit = Math.max(0, Math.floor((enemy.atk || 10) * 0.5) - (ally.def || 0))
          ally.hp = Math.max(0, ally.hp - aHit)
          if (ally.hp <= 0) {
            ally.alive = false
            statusEffects.ally_died = true
            messages.push(`<strong>${ally.name}</strong> strikes for ${aDmg} — then takes ${aHit} and falls.`)
          } else {
            messages.push(`<strong>${ally.name}</strong> strikes for ${aDmg} (takes ${aHit} retaliation, ${ally.hp} HP left).`)
          }
        } else {
          messages.push(`<strong>${ally.name}</strong> strikes for ${aDmg}.`)
        }
      }

      // DoT effects
      if(statusEffects.burnTurns>0){const bd=statusEffects.burnDmg;enemyHp=Math.max(0,enemyHp-bd);statusEffects.burnTurns--;messages.push('🔥 Burn — <strong>'+bd+'</strong> dmg ('+statusEffects.burnTurns+' left)')}
      if(statusEffects.infernoTurns>0){const id=statusEffects.infernoDmg||40;enemyHp=Math.max(0,enemyHp-id);statusEffects.infernoTurns--;messages.push('🔥 Inferno — <strong>'+id+'</strong> dmg!')}
      if(statusEffects.regenTurns>0){const rh=Math.round(maxPlayerHp*0.04);currentHp=Math.min(maxPlayerHp,currentHp+rh);messages.push('💧 Flow regen +'+rh+' HP')}

      // Player-side status DoTs and counter decrements. Player statuses are
      // applied by enemyAI.js (when used) via apply* helpers; ticking lives
      // here in the engine so it works regardless of where the apply call
      // came from. Bleed/poison deal damage; slow/defShred/terror/stun are
      // read elsewhere and just decremented here.
      if(statusEffects.playerBleedTurns>0){
        const bd=statusEffects.playerBleedDmg||3
        currentHp=Math.max(0,currentHp-bd)
        statusEffects.playerBleedTurns--
        messages.push('🩸 Bleed — <strong>'+bd+'</strong> dmg ('+statusEffects.playerBleedTurns+' left)')
        if(statusEffects.playerBleedTurns===0){statusEffects.playerBleedDmg=0}
      }
      if(statusEffects.playerPoisonTurns>0){
        const pd=statusEffects.playerPoisonDmg||3
        currentHp=Math.max(0,currentHp-pd)
        statusEffects.playerPoisonTurns--
        messages.push('☠ Poison — <strong>'+pd+'</strong> dmg ('+statusEffects.playerPoisonTurns+' left)')
        if(statusEffects.playerPoisonTurns===0){statusEffects.playerPoisonDmg=0}
      }
      if(statusEffects.playerSlowTurns>0){
        statusEffects.playerSlowTurns--
        if(statusEffects.playerSlowTurns===0){messages.push('🌀 Slow fades.')}
      }
      if(statusEffects.playerDefShredTurns>0){
        statusEffects.playerDefShredTurns--
        if(statusEffects.playerDefShredTurns===0){
          statusEffects.playerDefShredAmt=0
          messages.push('🔓 Armour Shred fades.')
        }
      }
      if(statusEffects.playerTerrorTurns>0){
        statusEffects.playerTerrorTurns--
        if(statusEffects.playerTerrorTurns===0){messages.push('😱 Terror fades.')}
      }
      if(statusEffects.playerStunTurns>0){
        statusEffects.playerStunTurns--
        if(statusEffects.playerStunTurns===0){messages.push('⚡ Stun fades.')}
      }

      // ── Class skill: turn-end hook (mark/silence countdown + DoT) ─────
      const _clsTurn = ClsCombat.onTurnEnd(player, statusEffects)
      if (_clsTurn.damageToEnemy > 0) enemyHp = Math.max(0, enemyHp - _clsTurn.damageToEnemy)
      if (_clsTurn.healToPlayer > 0)  currentHp = Math.min(maxPlayerHp, currentHp + _clsTurn.healToPlayer)
      for (const m of _clsTurn.messages) messages.push(m)

      syncBars()
      log(messages.join('<br>'))

      if(enemyHp<=0){
        // ── Class skill: kill hook (Final Sentence may refund an action) ──
        const _clsKill = ClsCombat.onKill(player, statusEffects, enemy)
        if (_clsKill.messages.length) log([...messages, ...(_clsKill.messages)].join('<br>'))
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
        // Note: action refund / Slaughterborn chain are cosmetic messages for v1.
        await endCombat('win');return
      }
      if(currentHp<=0){
        // Empty Throne (Mourning King t6c): enemy takes 100% their max HP, both die
        if (statusEffects.cls_emptyThronePending) {
          statusEffects.cls_emptyThronePending = false
          enemyHp = 0
          log(messages.concat(['☠ Empty Throne — they fall with you.']).join('<br>'))
          // Player still loses (death first), but the enemy dies too. We choose
          // to call the combat won since the enemy is dead.
          await endCombat('win'); return
        }
        // Maw of the Survivor (Devourer t5a): pending strike at enemy.
        // If kills, you survive at 1 HP.
        if (statusEffects.cls_mawOfSurvivorPending) {
          statusEffects.cls_mawOfSurvivorPending = false
          // Deal damage based on player ATK ×2 as a "final bite"
          const bite = (player.atk||5) + (statusEffects.playerATKBonus||0)
          const finalBite = bite * 2
          enemyHp = Math.max(0, enemyHp - finalBite)
          log(messages.concat(['🦷 Maw of the Survivor — last bite for '+finalBite+'.']).join('<br>'))
          if (enemyHp <= 0) {
            currentHp = 1
            log('You survive at 1 HP. The hunger remains.')
            await endCombat('win'); return
          }
          // Didn't kill — you die
        }
        await endCombat('lose');return
      }

      setButtons(true)
      renderSkillSlots()
      renderClassSkills()
    }
  }

  function renderEnd(panel,node) {
    const moral=player.moral_score||0
    const morality=moral>=60?'hero':moral>=20?'good':moral>=-20?'neutral':moral>=-60?'ruthless':'villain'
    const mColor=moral>=60?'#1e5a8a':moral>=20?'#2f7a2f':moral>=-20?'#8b6a20':moral>=-60?'#a04a18':'#a02020'

    const verdicts = {
      hero:     'Mercy steps back. The record speaks for itself. You built more than you took — not because the System asked you to, but because you decided that mattered. Wrath watches, satisfied at the precision even in cooperation. Both Judges acknowledge you with the same gesture: a slow opening of the hand. Whatever you are, you are consistent. The System calls it: complete.',
      good:     'Mercy weighs the record and finds it positive. More construction than demolition. More alliance than betrayal. Wrath notes the decisive moments where you acted without hesitation. Both Judges accept the accounting. Neither is surprised. You move into Chapter 3 with both evaluations behind you.',
      neutral:  'The Judges stand close together and consult in a language you cannot hear. The record is balanced — cooperation and betrayal, construction and taking, alliance and independence. Both Judges look at you simultaneously. Whatever they conclude, they keep to themselves. The System records: inconclusive, and moves you forward.',
      ruthless: 'Wrath steps forward and nods once. The record is decisive if not generous. You took more than you built. Mercy observes this without condemnation — just notation. You are what you are, and you were consistent about it. The System records this accurately and advances you.',
      villain:  'Wrath records everything with the expression of someone finding exactly what they expected. Mercy stands back — not in judgment, but in documentation. You were deliberate. The System respects deliberate choices. It advances you with full knowledge of what you are.',
    }

    const END_BEATS = [
      {
        title: 'The Record',
        text: verdicts[morality],
      },
      {
        title: 'What Remains',
        text: `The plaza empties quickly after the Judges withdraw.

  Sera finds you before you leave. She looks tired in the specific way of someone who has been responsible for other people for too long. She hands you something — a small pin, simple, the kind of thing that used to mark volunteers at community events.

  "For what it's worth," she says. "You were useful." She doesn't qualify it. She means it exactly as stated.

  Voss is already gone. But there's a message in your interface from a sender ID you don't recognize — you suspect it's them:

  "Good run. The Shadow zone opened easier because of you. Don't ask why. Just know the district remembers who passed through it."

  Rue leaves the map on the fountain's edge. You pick it up. It's not System-compatible — no upload, no sync. Just paper. You fold it and put it in your pack anyway.

  The district is clearing. Other players moving toward the boundary. Some of them look at you and nod. Some of them don't. Both feel right.`,
      },
      {
        title: 'Chapter 3 Awaits',
        text: `Your interface updates as you reach the district boundary.

  CHAPTER 2 COMPLETE.
  ALLIANCES RECORDED.
  ELEMENTAL RESONANCE: Locked in.
  JUDGES: Evaluated.

  Below that, a new entry:

  CHAPTER 3 — UNLOCKED.

  The road ahead is unfamiliar. The System's next chapter sits beyond a horizon you can't see yet. Whatever is there, it knows about Kessler District. It knows what you did here. It knows what you chose.

  You get back in your vehicle.

  The engine turns over first try. Some things still work the way they should.

  Chapter 3 is waiting.`,
      },
    ]

    let beatIdx=0
    function showBeat() {
      const b=END_BEATS[beatIdx], isLast=beatIdx===END_BEATS.length-1
      const ob=document.getElementById('outcome-box'); ob.style.display='none'
      document.getElementById('story-text').textContent=b.text
      panel.innerHTML=`
        <div class="end-box">
          <p style="font-family:'Share Tech Mono',monospace;font-size:.5rem;color:var(--ink-dim);letter-spacing:.1em;margin-bottom:.4rem">${beatIdx+1} / ${END_BEATS.length}</p>
          <p class="end-title" style="font-size:.95rem;margin-bottom:.6rem">${b.title}</p>
          <button class="end-btn" id="beat-btn" style="display:block;width:100%">${isLast?'→ Chapter 3':'Continue ›'}</button>
        </div>`
      document.getElementById('beat-btn').addEventListener('click',()=>{
        if (isLast) window.bookNavigate('book.html')
        else { beatIdx++; showBeat() }
      })
    }

    document.getElementById('story-text').textContent=''
    panel.innerHTML=`
      <div class="end-box">
        <p class="end-title">Chapter 2 Complete</p>
        <div style="margin:.5rem 0 .75rem;padding:.5rem .75rem;background:rgba(0,0,0,.08);border-radius:4px;border-left:3px solid ${mColor}">
          <p style="font-family:'Share Tech Mono',monospace;font-size:.5rem;color:var(--ink-dim);letter-spacing:.08em;margin-bottom:2px">EVALUATION COMPLETE</p>
          <p style="font-family:'Cinzel',serif;font-size:1rem;font-weight:600;color:${mColor};margin:0">${morality.toUpperCase()}</p>
          <p style="font-family:'Share Tech Mono',monospace;font-size:.48rem;color:var(--ink-dim);margin-top:2px">Moral score: ${moral>0?'+':''}${moral}</p>
        </div>
        <p class="end-sub" style="margin-bottom:.75rem">The Twin Judges have rendered their verdict.<br>Chapter 3 awaits.</p>
        <button class="end-btn" id="continue-ch2" style="display:block;width:100%;margin-bottom:.75rem">Continue ›</button>
      </div>`
    document.getElementById('continue-ch2').addEventListener('click',()=>showBeat())
  }

  // Level up
  async function checkLevelUp(oldXp,newXp,oldLevel) {
    let level=oldLevel,xp=newXp,leveled=false,levelsGained=0
    while(xp>=xpForLevel(level)){xp-=xpForLevel(level);level++;leveled=true;levelsGained++}
    if(!leveled)return null
    const newMaxHp=(player.max_hp||100)+levelsGained*5,newHp=newMaxHp
    const spGained=levelsGained,newSP=(player.skill_points||0)+spGained
    player.skill_points=newSP;player.sp_claimed=(player.sp_claimed||0)+spGained
    const sg=levelsGained
    const us={atk:(player.atk||1)+sg,def:(player.def||0)+sg,power:(player.power||0)+sg,guard:(player.guard||0)+sg,speed:(player.speed||0)+sg,insight:(player.insight||0)+sg,luck:(player.luck||0)+sg,control:(player.control||0)+sg}
    Object.assign(player,us);currentHp=newHp;player.max_hp=newMaxHp;player.level=level;player.xp=newXp
    window.showToast('LEVEL UP! Lvl '+level+' — +5 HP · +1 all stats · +'+spGained+' SP!')
    renderHUD()
    return{level,max_hp:newMaxHp,hp:newHp,xp:newXp,skill_points:newSP,sp_claimed:player.sp_claimed,...us}
  }

  function getEquippedBonus(stat) {
    return (window._equippedItems||[]).reduce((s,i)=>s+(i[stat]||0),0)
  }
  function calcATK() {
    return Math.max(1,Math.round((player.atk||1)+(player.power||0)*0.6+(player.speed||0)*0.2+getEquippedBonus('atk_bonus')))
  }
  function calcDEF() {
    return Math.round((player.def||0)+(player.guard||0)*0.6+(player.control||0)*0.2+getEquippedBonus('def_bonus'))
  }
  function calcSPD() {
    return Math.round((player.speed||0)+(player.insight||0)*0.1+getEquippedBonus('speed_bonus'))
  }

  window.openStatWindow = function() {
    document.getElementById('stat-window')?.remove()
    const eqItems=window._equippedItems||[]
    const STATS=[
      {label:'Power',  val:player.power||0,  color:'#ff5500',desc:'Scales ATK damage',         derived:'ATK +'+Math.round((player.power||0)*0.6)},
      {label:'Control',val:player.control||0,color:'#0088ff',desc:'Scales DEF & retry chance',  derived:'DEF +'+Math.round((player.control||0)*0.2)},
      {label:'Guard',  val:player.guard||0,  color:'#8b5e3c',desc:'Scales DEF & damage block',  derived:'DEF +'+Math.round((player.guard||0)*0.6)},
      {label:'Speed',  val:player.speed||0,  color:'#a8d8ea',desc:'Scales ATK & turn order',    derived:'ATK +'+Math.round((player.speed||0)*0.2)},
      {label:'Insight',val:player.insight||0,color:'#ffd700',desc:'Scales SPD & luck effects',  derived:'SPD +'+Math.round((player.insight||0)*0.1)},
      {label:'Luck',   val:player.luck||0,   color:'#b06eff',desc:'Improves crit & loot chance',derived:'Loot +'+Math.round((player.luck||0)*5)+'%'},
    ]
    const modal=document.createElement('div')
    modal.id='stat-window'
    modal.style.cssText='position:fixed;inset:0;z-index:700;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.75)'
    modal.innerHTML=`
      <div style="background:#b8a568;border:1px solid #8b6a20;border-radius:6px;padding:1.25rem;min-width:320px;max-width:400px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.8)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
          <p style="font-family:'Cinzel',serif;font-size:1rem;font-weight:600;color:var(--ink)">Character Stats</p>
          <button id="stat-window-close" style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--ink)">✕</button>
        </div>
        <div style="background:rgba(0,0,0,.08);border-radius:4px;padding:.6rem .75rem;margin-bottom:.75rem">
          <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);letter-spacing:.08em;margin-bottom:4px">DERIVED STATS</p>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">
            ${[['ATK',calcATK(),'#e05555'],['DEF',calcDEF(),'#5ec45e'],['SPD',calcSPD(),'#a8d8ea'],
               ['HP',player.max_hp||100,'#5eaee0'],['LVL',player.level||1,'#c8b96e'],['GOLD',player.gold||0,'#c8b96e']
            ].map(([k,v,c])=>'<div style="text-align:center;background:rgba(0,0,0,.1);border-radius:3px;padding:4px 2px"><span style="font-family:\'Share Tech Mono\',monospace;font-size:.5rem;color:var(--ink-dim);display:block">'+k+'</span><span style="font-family:\'Cinzel\',serif;font-size:.95rem;font-weight:600;color:'+c+'">'+v+'</span></div>').join('')}
          </div>
        </div>
        <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);letter-spacing:.08em;margin-bottom:6px">CORE STATS <span style="color:var(--ink-dim)">· Unlocked via Skill Tree</span></p>
        ${STATS.map(s=>`<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:5px;padding:5px 7px;background:rgba(0,0,0,.07);border-radius:3px">
          <div style="width:8px;height:8px;border-radius:50%;background:${s.color};flex-shrink:0"></div>
          <div style="flex:1">
            <div style="display:flex;align-items:baseline;gap:4px">
              <span style="font-family:'Cinzel',serif;font-size:.78rem;color:var(--ink);font-weight:600">${s.label}</span>
              <span style="font-family:'Share Tech Mono',monospace;font-size:.6rem;color:var(--ink)">${s.val}</span>
              <span style="font-family:'Share Tech Mono',monospace;font-size:.52rem;color:var(--ink-dim);margin-left:auto">${s.derived}</span>
            </div>
            <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.62rem;color:var(--ink-dim);margin:0">${s.desc}</p>
          </div></div>`).join('')}
        <div style="margin-top:.75rem;padding:.6rem .75rem;background:rgba(0,0,0,.08);border-radius:4px">
          <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);letter-spacing:.08em;margin-bottom:3px">EQUIPPED</p>
          <p style="font-family:'IM Fell English',serif;font-size:.72rem;color:var(--ink);margin:0">${eqItems.map(i=>i.name).join(', ')||'None'}</p>
        </div>
        ${(player.skill_points||0)>0?`<button id="stat-window-skills" style="width:100%;margin-top:.75rem;font-family:'Cinzel',serif;font-size:.8rem;color:var(--ink);background:rgba(160,125,224,.35);border:1px solid rgba(160,125,224,.6);border-radius:3px;padding:.45rem;cursor:pointer">⬡ Spend ${player.skill_points} Skill Points → Skills Page</button>`:''}
      </div>`
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()})
    document.body.appendChild(modal)
    document.getElementById('stat-window-close')?.addEventListener('click', () => modal.remove())
    document.getElementById('stat-window-skills')?.addEventListener('click', () => {
      modal.remove()
      window.bookNavigate('skills.html')
    })
  }

  function renderHUD() {
    const hp=currentHp, mhp=player.max_hp||100, xp=player.xp||0, lvl=player.level||1
    // ── 6-tier moral standing (HUD display) ─────────────────────────
    // We derive the seal display from moral_score directly, not from
    // player.badge. The badge column still exists for the lobby/PvP
    // 4-tier system (Hunter/Helper/Elite/Neutral as PvP roles), but the
    // single-player HUD shows the 6-tier morality ladder for clarity.
    const tier = getMoralTier(player.moral_score)
    const moralPct = getMoralBarPct(player.moral_score)
    const hpPct=Math.max(0,Math.round(hp/mhp*100))
    const hpCol=hpPct>60?'#5ec45e':hpPct>30?'#c8b96e':'#e05555'
    const xpNext=xpForLevel(lvl)
    const xpIntoLevel=Math.max(0,Math.min(xp,xpNext-1))
    const xpPct=Math.min(100,Math.round(xpIntoLevel/xpNext*100))
    const dotLeft=Math.max(2,Math.min(94,moralPct))

    document.getElementById('hud').innerHTML=`
      <div class="hud-badge-row">
        ${renderReputationBadge(player.moral_score, { size: 46 })}
        <div>
          <p class="hud-seal-label" style="color:${tier.color}">${tier.label}</p>
          <p class="hud-chapter">Chapter 2 · Lvl ${lvl}</p>
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-key">HP</span>
        <div class="stat-bar-wrap"><div class="stat-bar" id="hp-bar" style="width:${hpPct}%;background:${hpCol};transition:width .4s,background .4s"></div></div>
        <span class="stat-val" id="hp-val">${Math.round(hp)}/${mhp}</span>
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
      ${(player.skill_points||0)>0?`<div id="hud-skill-points-link" style="background:rgba(160,125,224,.25);border:1px solid rgba(160,125,224,.5);border-radius:3px;padding:4px 8px;margin-bottom:6px;font-family:'Share Tech Mono',monospace;font-size:.6rem;color:var(--ink);cursor:pointer;text-align:center">⬡ ${player.skill_points} SKILL POINTS — tap to spend</div>`:''}
      <div class="stat-grid">
        <div class="stat-box"><span class="stat-box-key">ATK</span><span class="stat-box-val">${calcATK()}</span></div>
        <div class="stat-box"><span class="stat-box-key">DEF</span><span class="stat-box-val">${calcDEF()}</span></div>
        <div class="stat-box"><span class="stat-box-key">GOLD</span><span class="stat-box-val">${player.gold||0}</span></div>
      </div>
      <div style="display:flex;gap:4px;margin-top:6px">
        <button id="hud-open-stats" style="flex:1;font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);background:rgba(200,184,128,.2);border:.5px solid rgba(139,106,32,.4);border-radius:2px;padding:3px 0;cursor:pointer;letter-spacing:.06em">📊 STATS</button>
        <button id="hud-open-skills" style="flex:1;font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);background:rgba(160,125,224,.2);border:.5px solid rgba(160,125,224,.4);border-radius:2px;padding:3px 0;cursor:pointer;letter-spacing:.06em">⬡ SKILLS</button>
      </div>`
    document.getElementById('hud-skill-points-link')?.addEventListener('click', () => window.bookNavigate('skills.html'))
    document.getElementById('hud-open-stats')?.addEventListener('click', () => openStatWindow())
    document.getElementById('hud-open-skills')?.addEventListener('click', () => window.bookNavigate('skills.html'))
  }

  function updateHpBar(hp) {
    currentHp=hp
    const mhp=player.max_hp||100, pct=Math.max(0,Math.round(hp/mhp*100))
    const col=pct>60?'#5ec45e':pct>30?'#c8b96e':'#e05555'
    const bar=document.getElementById('hp-bar'), val=document.getElementById('hp-val')
    if(bar){bar.style.width=pct+'%';bar.style.background=col}
    if(val)val.textContent=Math.round(hp)+'/'+mhp
  }

  // ── Init ──────────────────────────────────────────
  // Always call renderNav so the bookmark re-paints on every mount.
  // When book.html hosts us, __mountOptions.player IS set — the old
  // `||` short-circuit was skipping renderNav entirely in that case,
  // which left the nav blank if anything had cleared <div id="nav">
  // between book.html's init paint and our mount.
  let player = __mountOptions.player
  if (player) {
    window.renderNav(__mountOptions.navId || 'nav').catch(e => console.warn('[ch2] nav render failed', e))
  } else {
    player = await window.renderNav(__mountOptions.navId || 'nav')
  }
  if (!player) throw new Error('no player')

  let currentHp = player.hp || 100
  let nodeId = (player.current_node||'').startsWith('ch2_')
    ? player.current_node.replace('ch2_','')
    : 'opening'
  let outcome = null

  ;(async()=>{
    if(!window._equippedItems){
      const {data}=await supabase.from('inventory').select('*').eq('player_id',player.id).not('equipped_slot','is',null)
      window._equippedItems=data||[]
    }
  })()

  if (!NODES[nodeId]) nodeId='opening'

  renderHUD()
  render()

  return { player, cleanup() {} }
}

export default mountChapter2
