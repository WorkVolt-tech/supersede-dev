import { supabase }           from '../supabase.js'

const MODULE_STYLE_ID = 'book-module-style-inventory'
const MODULE_MARKUP = "<div class=\"book-wrap\">\n  \n\n  <div class=\"book animate-in\">\n    <div class=\"page-left parchment\">\n      <div class=\"page-inner\">\n        <p class=\"chapter-label\">Equipment</p>\n        <h1 class=\"page-title\">Loadout</h1>\n        <p style=\"font-family:'IM Fell English',serif;font-style:italic;font-size:.82rem;color:var(--ink-dim);margin-bottom:.5rem\" id=\"equip-hint\">Select an item from the right, then click a slot.</p>\n        <hr class=\"ink-divider\">\n        <div id=\"equip-slots\"></div>\n        <div id=\"set-bonus-panel\" style=\"margin-top:.5rem\"></div>\n        <hr class=\"ink-divider\">\n        <div id=\"total-stats\" style=\"font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--ink-dim);display:flex;gap:1.5rem;letter-spacing:.06em\"></div>\n      </div>\n    </div>\n\n    \n    <div class=\"page-right parchment\">\n      <div class=\"page-inner\">\n        <p class=\"chapter-label\">Item Bag</p>\n        <h2 class=\"page-title\" id=\"bag-count\">\u2014 items</h2>\n        <hr class=\"ink-divider\">\n        <div style=\"display:flex;gap:3px;margin-bottom:.75rem;flex-wrap:wrap\" id=\"filter-tabs\"></div>\n        <div class=\"item-grid\" id=\"item-grid\"></div>\n        <div id=\"item-detail\"></div>\n      </div>\n    </div>\n  </div>\n</div>"
const MODULE_STYLES = "\n    /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n       SUPERSEDE DARK THEME \u2014 Gold / Amber accent\n       Injected over main.css \u2014 no JS touched.\n    \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n        :root {\n      --bg-0:      #14110f;\n      --bg-1:      #2b1d16;\n      --panel:     #f4ead7;\n      --page-l:    #f4ead7;\n      --page-r:    #f1e4cf;\n      --ink:       #2b1d16;\n      --ink-dim:   #5c4638;\n      --ink-faint: #a08060;\n      --ice:       #7a5230;\n      --ice-hot:   #4b2e14;\n      --gold:      #c8a050;\n      --gold-hot:  #e0c070;\n      --gold-dim:  #a08040;\n      --amber:     #d09040;\n      --amber-hot: #e0a050;\n      --warn:      #e06050;\n      --line:      rgba(200,160,80,.30);\n      --green:     #5cae50;\n      --purple:    #8a50c0;\n      --spine-col: #2b1d16;\n    }\n    *, *::before, *::after { box-sizing:border-box; }\n        html, body {\n      background: radial-gradient(ellipse at 50% 0%, #2a1a0e 0%, #14110f 55%, #0d0b09 100%) !important;\n      color: var(--ink) !important;\n      font-family: 'Cormorant Garamond', Georgia, serif !important;\n      min-height: 100vh;\n      overflow-x: hidden;\n    }\n    body::after {\n      content: \"\"; position: fixed; inset: 0; pointer-events: none; z-index: 9998;\n      background: radial-gradient(ellipse 900px 900px at 50% 40%, rgba(180,120,60,.07) 0%, transparent 70%);\n    }\n        /* \u2500\u2500 BOOK \u2014 parchment open-book \u2500\u2500 */\n    .book, .craft-grid {\n      display: grid !important;\n      grid-template-columns: 1fr 1fr !important;\n      align-items: stretch !important;\n      gap: 0 !important;\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      box-shadow: none !important;\n      border-radius: 24px !important;\n      filter: drop-shadow(0 24px 60px rgba(0,0,0,.75)) drop-shadow(0 8px 20px rgba(0,0,0,.5)) !important;\n      transform: perspective(1600px) rotateX(2.5deg) !important;\n      transform-origin: 50% 0 !important;\n      margin-top: 10px !important;\n      overflow: hidden !important;\n    }\n    @media(max-width:860px){\n      .book, .craft-grid { grid-template-columns:1fr !important; transform:none !important; border-radius:12px !important; }\n    }\n    /* \u2500\u2500 PAGES \u2500\u2500 */\n    .parchment, .page-left, .page-right {\n      background: var(--panel) !important;\n      border: none !important;\n      border-radius: 0 !important;\n      box-shadow: none !important;\n      color: var(--ink) !important;\n      position: relative;\n      overflow-y: auto; overflow-x: hidden;\n    }\n    .page-left  { background: var(--page-l) !important; border-right: none !important; }\n    .page-right { background: var(--page-r) !important; border-left:  none !important; }\n    /* dot-texture grain */\n    .page-left::before, .page-right::before {\n      content: \"\" !important; position: absolute !important; inset: 0 !important;\n      pointer-events: none !important; z-index: 0 !important; opacity: .08 !important;\n      background-image: radial-gradient(circle, rgba(0,0,0,.25) 1px, transparent 1px) !important;\n      background-size: 12px 12px !important;\n    }\n    /* spine-edge shadows */\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    /* corner brackets */\n    .page-inner { padding: 28px 30px !important; position: relative; }\n    .page-inner::before {\n      content: \"\" !important; position: absolute !important;\n      top: 14px !important; left: 14px !important; width: 28px !important; height: 28px !important;\n      border-left: 1.5px solid rgba(138,91,68,.45) !important;\n      border-top: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-inner::after {\n      content: \"\" !important; position: absolute !important;\n      bottom: 14px !important; right: 14px !important; width: 28px !important; height: 28px !important;\n      border-right: 1.5px solid rgba(138,91,68,.45) !important;\n      border-bottom: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    /* \u2500\u2500 SPINE \u2014 open book gutter / inner binding \u2500\u2500 */\n    .spine {\n      background: linear-gradient(90deg,\n        rgba(232,210,170,.0)   0%,\n        rgba(200,170,120,.25)  15%,\n        rgba(160,120,70,.55)   30%,\n        rgba(90,55,20,.88)     43%,\n        rgba(40,20,5,1.0)      50%,\n        rgba(90,55,20,.88)     57%,\n        rgba(160,120,70,.55)   70%,\n        rgba(200,170,120,.25)  85%,\n        rgba(232,210,170,.0)   100%\n      ) !important;\n      border-left:  none !important;\n      border-right: none !important;\n      position: relative; z-index: 5; width: 22px !important;\n      box-shadow: none !important;\n    }\n    /* hairline crease at centre */\n    .spine::before {\n      content:\"\";\n      position:absolute;\n      top:0; bottom:0; left:50%;\n      width:1px;\n      transform:translateX(-50%);\n      background: linear-gradient(180deg,\n        transparent 0%,\n        rgba(0,8,18,.9) 6%,\n        rgba(0,8,18,.9) 94%,\n        transparent 100%);\n    }\n    /* stacked page edges */\n    .spine::after {\n      content:\"\";\n      position:absolute;\n      top:2px; bottom:2px; left:-3px;\n      width:3px;\n      background: repeating-linear-gradient(\n        180deg,\n        rgba(200,168,74,.05) 0px,\n        rgba(200,168,74,.02) 1px,\n        rgba(0,0,0,.15)      1px,\n        rgba(0,0,0,.05)      2px\n      );\n      border-left:1px solid rgba(200,168,74,.08);\n    }\n    /* \u2500\u2500 TYPOGRAPHY \u2500\u2500 */\n    .chapter-label, .page-label {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 9.5px !important; letter-spacing: .42em !important;\n      text-transform: uppercase !important;\n      color: var(--gold) !important; margin-bottom: 5px !important;\n    }\n    .page-title, h1.page-title, h2.page-title {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 22px !important; font-weight: 500 !important;\n      letter-spacing: .04em !important; color: var(--ink) !important;\n      margin-bottom: 14px !important;\n    }\n    .ink-divider, hr.ink-divider {\n      border: none !important; border-top: 1px solid var(--line) !important;\n      margin: 12px 0 !important; opacity: 1 !important;\n    }\n    /* body text */\n    p, li, span { color: var(--ink) !important; }\n    /* \u2500\u2500 INLINE COLOURS \u2014 remap parchment browns to gold tones \u2500\u2500 */\n    [style*=\"color:var(--ink)\"] { color: var(--ink) !important; }\n    [style*=\"color:var(--ink-dim)\"] { color: var(--ink-dim) !important; }\n    [style*=\"color:var(--ink-dim)\"] { color: var(--gold-dim) !important; }\n    [style*=\"color:var(--ink-dim)\"] { color: var(--gold-dim) !important; }\n    [style*=\"color:#c8b96e\"] { color: var(--gold) !important; }\n    [style*=\"background:rgba(200,184,128\"] { background: rgba(200,168,74,.08) !important; }\n    [style*=\"border-color:rgba(139,106,32\"] { border-color: rgba(200,168,74,.25) !important; }\n    /* \u2500\u2500 BUTTONS / CHOICES \u2500\u2500 */\n    button, .choice, .combat-btn {\n      background: transparent !important;\n      border: 1px solid var(--line) !important;\n      border-radius: 0 !important;\n      color: var(--ink) !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 10px !important; letter-spacing: .08em !important;\n      cursor: pointer !important;\n      transition: border-color .2s, color .2s, background .2s !important;\n    }\n    button:hover, .choice:hover, .combat-btn:hover:not(:disabled) {\n      border-color: var(--gold) !important;\n      color: var(--gold) !important;\n      background: rgba(200,168,74,.05) !important;\n    }\n    /* \u2500\u2500 STAT BARS \u2500\u2500 */\n    .stat-bar-wrap { background: rgba(255,255,255,.06) !important; border-radius:0 !important; }\n    .stat-key { color: var(--ink-dim) !important; font-family:'JetBrains Mono',monospace !important; font-size:.58rem !important; letter-spacing:.08em !important; }\n    .stat-val { color: var(--ink) !important; }\n    /* \u2500\u2500 MODALS / OVERLAYS \u2500\u2500 */\n    [id$=\"-window\"] > div, .end-box {\n      background: var(--panel) !important;\n      border: 1px solid var(--line) !important;\n      border-radius: 0 !important;\n    }\n    /* \u2500\u2500 SCROLLBAR \u2500\u2500 */\n    ::-webkit-scrollbar{width:5px}\n    ::-webkit-scrollbar-track{background:var(--bg-0)}\n    ::-webkit-scrollbar-thumb{background:var(--line)}\n    ::-webkit-scrollbar-thumb:hover{background:var(--gold-dim)}\n    /* \u2500\u2500 ANIMATE-IN \u2500\u2500 */\n    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}\n    .animate-in{animation:fadeIn .4s ease forwards}\n\n    /* \u2500\u2500 ITEM GRID \u2014 force equal 3-column layout \u2500\u2500 */\n    .item-grid {\n      display: grid !important;\n      grid-template-columns: repeat(3, 1fr) !important;\n      gap: 4px !important;\n      width: 100% !important;\n    }\n    .item-card {\n      position: relative !important;\n      border: .5px solid rgba(200,168,74,.15) !important;\n      border-radius: 3px !important;\n      padding: 5px 6px !important;\n      cursor: pointer !important;\n      transition: border-color .15s, background .15s !important;\n      background: rgba(0,0,0,.15) !important;\n      min-width: 0 !important;\n      overflow: hidden !important;\n    }\n    .item-card:hover { border-color: rgba(200,168,74,.4) !important; background: rgba(200,168,74,.06) !important; }\n    .item-card.selected { border-color: rgba(200,168,74,.7) !important; background: rgba(200,168,74,.1) !important; }\n    .item-icon { width: 28px !important; height: 28px !important; object-fit: contain !important; flex-shrink: 0 !important; }\n    .item-name { font-family: 'Cinzel', serif !important; font-size: .7rem !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; margin: 0 0 1px !important; }\n    .item-type { font-family: 'JetBrains Mono', monospace !important; font-size: .45rem !important; color: var(--ink-dim) !important; margin: 0 !important; letter-spacing: .04em !important; text-transform: uppercase !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }\n    .item-eq   { font-family: 'JetBrains Mono', monospace !important; font-size: .42rem !important; color: #5ec45e !important; letter-spacing: .06em !important; }\n      /* \u2500\u2500 Book wrap \u2500\u2500 */\n    .book-wrap, .craft-grid-wrap {\n      background: transparent !important;\n      max-width: 1060px;\n      margin: 0 auto;\n      padding: 24px 24px 60px;\n    }\n    /* \u2500\u2500 Book \u2500\u2500 */\n    .book, .craft-grid {\n      display: grid !important;\n      grid-template-columns: 1fr 1fr !important;\n      align-items: stretch !important;\n      gap: 0 !important;\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      box-shadow: none !important;\n      border-radius: 24px !important;\n      filter: drop-shadow(0 24px 60px rgba(0,0,0,.75)) drop-shadow(0 8px 20px rgba(0,0,0,.5)) !important;\n      transform: perspective(1600px) rotateX(2.5deg) !important;\n      transform-origin: 50% 0 !important;\n      margin-top: 10px !important;\n      overflow: hidden !important;\n    }\n    @media(max-width:860px) {\n      .book, .craft-grid { grid-template-columns: 1fr !important; transform: none !important; border-radius: 12px !important; }\n    }\n    /* \u2500\u2500 Pages \u2500\u2500 */\n    .parchment, .page-left, .page-right {\n      background: var(--panel) !important;\n      border: none !important;\n      border-radius: 0 !important;\n      box-shadow: none !important;\n      color: var(--ink) !important;\n      position: relative;\n      overflow-y: auto; overflow-x: hidden;\n    }\n    .page-left::before, .page-right::before {\n      content: \"\" !important; position: absolute !important; inset: 0 !important;\n      pointer-events: none !important; z-index: 0 !important; opacity: .08 !important;\n      background-image: radial-gradient(circle, rgba(0,0,0,.25) 1px, transparent 1px) !important;\n      background-size: 12px 12px !important;\n    }\n    .page-left  { border-right: none !important; background: var(--page-l) !important; }\n    .page-right { border-left:  none !important; background: var(--page-r) !important; }\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-inner { padding: 28px 30px !important; position: relative; }\n    .page-inner::before {\n      content: \"\" !important; position: absolute !important;\n      top: 14px !important; left: 14px !important; width: 28px !important; height: 28px !important;\n      border-left: 1.5px solid rgba(138,91,68,.45) !important;\n      border-top: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-inner::after {\n      content: \"\" !important; position: absolute !important;\n      bottom: 14px !important; right: 14px !important; width: 28px !important; height: 28px !important;\n      border-right: 1.5px solid rgba(138,91,68,.45) !important;\n      border-bottom: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    /* \u2500\u2500 Spine \u2500\u2500 */\n    .spine {\n      background: linear-gradient(90deg,\n        rgba(0,0,0,.0) 0%, rgba(0,0,0,.20) 28%, rgba(0,0,0,.40) 46%,\n        rgba(0,0,0,.50) 50%, rgba(0,0,0,.40) 54%, rgba(0,0,0,.20) 72%, rgba(0,0,0,.0) 100%\n      ) !important;\n      border: none !important; position: relative; z-index: 5;\n      width: 22px !important; min-width: 22px !important;\n      margin: 0 !important; overflow: visible; box-shadow: none !important;\n    }\n    .spine::before {\n      content: \"\"; position: absolute; top: 0; bottom: 0; left: 50%; width: 1px;\n      transform: translateX(-50%);\n      background: linear-gradient(180deg, transparent 0%, rgba(43,29,22,.9) 8%, rgba(43,29,22,.9) 92%, transparent 100%);\n      z-index: 2;\n    }\n    .spine-inner, .spine-highlight, .spine-shadow,\n    .spine-title, .spine-rule, .spine-diamond, .spine-chapter { display: none !important; }\n    /* \u2500\u2500 Text & UI colours \u2500\u2500 */\n    h1, h2, h3, h4, h5, h6 { color: var(--ink) !important; }\n    .book p, .book li, .book span, .book label,\n    .book-wrap p, .book-wrap li, .book-wrap span, .book-wrap label { color: var(--ink) !important; }\n    button:not(.bm-signout), .btn { background: rgba(43,29,22,.08); border: 1px solid rgba(138,91,68,.35); color: var(--ink); border-radius: 0; cursor: pointer; transition: border-color .2s, color .2s; }\n    button:hover, .btn:hover { border-color: var(--gold) !important; color: var(--gold) !important; }\n    input, select, textarea { background: rgba(43,29,22,.06) !important; border: 1px solid rgba(138,91,68,.35) !important; color: var(--ink) !important; border-radius: 0 !important; }\n    ::-webkit-scrollbar { width: 5px; }\n    ::-webkit-scrollbar-track { background: rgba(43,29,22,.15); }\n    ::-webkit-scrollbar-thumb { background: rgba(138,91,68,.35); }\n    ::-webkit-scrollbar-thumb:hover { background: var(--gold-dim); }\n  \n    @media (max-width: 800px) {\n      .book, .book-body, .craft-grid { flex-direction: column !important; min-height: auto; }\n      .page-left, .page-right { width: 100% !important; padding: 20px 16px !important; }\n      .book-wrap, .craft-grid-wrap { padding: 8px 12px 40px !important; }\n    }\n  "

function installModuleStyle() {
  document.querySelectorAll('style[data-book-module-style]').forEach(el => el.remove())
  const style = document.createElement('style')
  style.id = MODULE_STYLE_ID
  style.dataset.bookModuleStyle = 'true'
  style.textContent = MODULE_STYLES
  document.head.appendChild(style)
}

export async function mountInventory(__mountOptions = {}) {
  const host = __mountOptions.host || document.getElementById('book-module-host') || document.body
  installModuleStyle()
  host.innerHTML = MODULE_MARKUP

    const player = __mountOptions.player || await window.renderNav(__mountOptions.navId || 'nav')
    if (!player) throw new Error('no player')

  const ITEM_IMAGES = {
    'ember_blade':'../assets/weapon/fire/ember_blade.png',
    'flame_dagger':'../assets/weapon/fire/flame_dagger.png',
    'inferno_sword':'../assets/weapon/fire/inferno_sword.png',
    'burning_staff':'../assets/weapon/fire/burning_staff.png',
    'ashen_tome':'../assets/weapon/fire/ashen_tome.png',
    'lava_gauntlets':'../assets/weapon/fire/lava_gauntlets.png',
    'tide_blade':'../assets/weapon/water/tide_blade.png',
    'ocean_staff':'../assets/weapon/water/ocean_staff.png',
    'flow_dagger':'../assets/weapon/water/flow_dagger.png',
    'deep_tome':'../assets/weapon/water/deep_tome.png',
    'current_gauntlets':'../assets/weapon/water/current_gauntlets.png',
    'stone_sword':'../assets/weapon/earth/stone_sword.png',
    'root_blade':'../assets/weapon/earth/root_blade.png',
    'titan_hammer':'../assets/weapon/earth/titan_hammer.png',
    'crystal_staff':'../assets/weapon/earth/crystal_staff.png',
    'boulder_gauntlets':'../assets/weapon/earth/boulder_gauntlets.png',
    'wind_dagger':'../assets/weapon/air/wind_dagger.png',
    'gale_blade':'../assets/weapon/air/gale_blade.png',
    'storm_sword':'../assets/weapon/air/storm_sword.png',
    'sky_staff':'../assets/weapon/air/sky_staff.png',
    'swift_gauntlets':'../assets/weapon/air/swift_gauntlets.png',
    'shadow_blade':'../assets/weapon/dark/shadow_blade.png',
    'void_dagger':'../assets/weapon/dark/void_dagger.png',
    'curse_sword':'../assets/weapon/dark/curse_sword.png',
    'nightmare_staff':'../assets/weapon/dark/nightmare_staff.png',
    'abyss_gauntlets':'../assets/weapon/dark/abyss_gauntlets.png',
    'radiant_blade':'../assets/weapon/light/radiant_blade.png',
    'halo_staff':'../assets/weapon/light/halo_staff.png',
    'dawn_sword':'../assets/weapon/light/dawn_sword.png',
    'blessing_tome':'../assets/weapon/light/blessing_tome.png',
    'light_gauntlets':'../assets/weapon/light/light_gauntlets.png',
    'cinder_armor':'../assets/armor/cinder_armor.png',
    'inferno_cloak':'../assets/armor/inferno_cloak.png',
    'blazing_robes':'../assets/armor/blazing_robes.png',
    'smoke_veil':'../assets/armor/smoke_veil.png',
    'mist_cloak':'../assets/armor/mist_cloak.png',
    'ocean_armor':'../assets/armor/ocean_armor.png',
    'rain_robes':'../assets/armor/rain_robes.png',
    'tide_shield':'../assets/armor/tide_shield.png',
    'rock_armor':'../assets/armor/rock_armor.png',
    'root_cloak':'../assets/armor/root_cloak.png',
    'terra_plate':'../assets/armor/terra_plate.png',
    'crystal_shell':'../assets/armor/crystal_shell.png',
    'feather_cloak':'../assets/armor/feather_cloak.png',
    'storm_armor':'../assets/armor/storm_armor.png',
    'cloud_robes':'../assets/armor/cloud_robes.png',
    'wind_veil':'../assets/armor/wind_veil.png',
    'shadow_cloak':'../assets/armor/shadow_cloak.png',
    'void_armor':'../assets/armor/void_armor.png',
    'nightmare_robes':'../assets/armor/nightmare_robes.png',
    'curse_shell':'../assets/armor/curse_shell.png',
    'holy_armor':'../assets/armor/holy_armor.png',
    'blessing_cloak':'../assets/armor/blessing_cloak.png',
    'radiant_robes':'../assets/armor/radiant_robes.png',
    'halo_shield':'../assets/armor/halo_shield.png',
    'rune_ignis':'../assets/runes/rune_ignis.png',
    'rune_aqua':'../assets/runes/rune_aqua.png',
    'rune_terra':'../assets/runes/rune_terra.png',
    'rune_aero':'../assets/runes/rune_aero.png',
    'rune_umbra':'../assets/runes/rune_umbra.png',
    'rune_lux':'../assets/runes/rune_lux.png',
    'rune_venin':'../assets/runes/rune_venin.png',
    'rune_ferro':'../assets/runes/rune_ferro.png',
    'rune_flora':'../assets/runes/rune_flora.png',
    'rune_volt':'../assets/runes/rune_volt.png',
    // Base items
    'scrap_blade':    '../assets/weapon/scrap_blade.png',
    'knife':          '../assets/weapon/knife.png',
    'jacket':         '../assets/armor/jacket.png',
    'worn_boots':     '../assets/armor/worn_boots.png',
    'riot_vest':      '../assets/armor/riot_vest.png',
    'iron_ring':      '../assets/armor/iron_ring.png',
    'energy_drink':   '../assets/items/energy_drink.png',
    'medkit':         '../assets/items/medkit.png',
    'scrap_metal':    '../assets/items/scrap_metal.png',
    'flashlight':     '../assets/items/flashlight.png',
    'core_fragment':  '../assets/items/core_fragment.png',
    // Base helmets & shields
    'scrap_helm':     '../assets/armor/scrap_helm.png',
    'scrap_shield':   '../assets/armor/scrap_shield.png',
    'iron_helm':      '../assets/armor/iron_helm.png',
    'iron_shield':    '../assets/armor/iron_shield.png',
    'tactical_helm':  '../assets/armor/tactical_helm.png',
    'tactical_shield':'../assets/armor/tactical_shield.png',
    // Tactical weapon
    'iron_sword':     '../assets/weapon/iron_sword.png',
    'tactical_sword': '../assets/weapon/tactical_sword.png',
    // Watcher Set
    'watcher_eye_ring': '../assets/sets/watcher_eye_ring.png',
    'watcher_band':     '../assets/sets/watcher_band.png',
    'watcher_cloak':    '../assets/sets/watcher_cloak.png',
    'watcher_crown':    '../assets/sets/watcher_crown.png',
  }
  function getItemImg(k) { return ITEM_IMAGES[k] || null }


    const SLOTS = [
      { key:'helmet',     label:'Helmet',      icon:'⛑',  accepts:['helmet','armor'] },
      { key:'chest',      label:'Chest',       icon:'🦺', accepts:['chest','armor','cloak'] },
      { key:'gloves',     label:'Gloves',      icon:'🧤', accepts:['gloves'] },
      { key:'boots',      label:'Boots',       icon:'👢', accepts:['boots'] },
      { key:'accessory1', label:'Accessory 1', icon:'💍', accepts:['accessory','ring'] },
      { key:'accessory2', label:'Accessory 2', icon:'📿', accepts:['accessory','ring'] },
      { key:'mainhand',   label:'Weapon',      icon:'🗡',  accepts:['sword','dagger','staff','bow','spear','shield'] },
      { key:'offhand',    label:'Off-hand',    icon:'🛡',  accepts:['shield','dagger','tome','sword'] },
    ]

    // Item rarity colors — chosen for contrast on the LIGHT parchment
    // background. Each color keeps its rarity hue identity but is darker
    // and more saturated so text is readable. If the theme changes back
    // to dark, these will need to be lightened again.
    const RARITY = { common:'#5c4638', uncommon:'#2f7a2f', rare:'#1e5a8a', epic:'#6b2da8', legendary:'#a06820', mythic:'#a82a8a' }
    const FILTERS = ['all','weapon','armor','accessory','consumable','material','key']


    let items = [], selectedId = null, filter = 'all', sellMode = false, sellSelected = new Set()

    async function load() {
      const { data } = await supabase.from('inventory').select('*').eq('player_id', player.id).order('obtained_at',{ascending:false})
      items = data || []
      render()
    }

    function render() {
      renderSlots()
      renderGrid()
      renderStats()
      renderDetail()
    }
    window.render = render

    function renderSlots() {
      const equipped = {}
      items.filter(i=>i.equipped_slot).forEach(i=>{ equipped[i.equipped_slot]=i })
      document.getElementById('equip-slots').innerHTML = SLOTS.map(s => {
        const item = equipped[s.key]
        const EL_COLORS = {fire:'#ff5500',water:'#0088ff',earth:'#8b5e3c',air:'#a8d8ea',dark:'#b06eff',light:'#ffd700',none:'#9a8050'}
        const elColor = item ? (EL_COLORS[item.element] || '#9a8050') : '#9a8050'
        const _socketsTotal = item ? (item.sockets_total||0) : 0
        const _socketsUsed  = item ? (item.sockets_used||0)  : 0
        const _runeword     = item ? item.runeword_name : null
        return `<div class="equip-slot${selectedId?' clickable':''}" data-slot="${s.key}" title="${item?item.name+' — click to manage':s.label}">
          ${(()=>{if(!item)return '<span class="slot-icon">'+s.icon+'</span>';const _s=getItemImg(item.item_key);return _s?('<img src="'+_s+'" class="slot-icon" style="width:28px;height:28px;object-fit:contain;flex-shrink:0" onerror="this.style.display=\'none\'">'):'<span class="slot-icon" style="flex-shrink:0">'+item.icon+'</span>';})()}
          <div style="flex:1;min-width:0;overflow:hidden">
            <div style="color:${item ? (RARITY[item.rarity]||'#5c4638') : '#a08060'};display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.82rem;font-family:'Cinzel',serif">${item ? item.name : s.label}</div>
            ${item ? (()=>{
              const bonuses = [
                item.atk_bonus>0?'ATK +'+item.atk_bonus:'',
                item.def_bonus>0?'DEF +'+item.def_bonus:'',
                (item.power_bonus||0)>0?'PWR +'+item.power_bonus:'',
                (item.guard_bonus||0)>0?'GRD +'+item.guard_bonus:'',
                (item.speed_bonus||0)>0?'SPD +'+item.speed_bonus:'',
                (item.control_bonus||0)>0?'CTR +'+item.control_bonus:'',
                (item.insight_bonus||0)>0?'INS +'+item.insight_bonus:'',
                (item.luck_bonus||0)>0?'LCK +'+item.luck_bonus:'',
              ].filter(Boolean).join(' ')
              const rwLine = _runeword ? '✦ '+_runeword : (_socketsTotal>0?_socketsUsed+'/'+_socketsTotal+' sockets':'')
              return (bonuses ? '<div style="font-family:\'JetBrains Mono\',monospace;font-size:.44rem;color:#7a5c30;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+bonuses+'</div>' : '')
                + (rwLine ? '<div style="font-family:\'JetBrains Mono\',monospace;font-size:.44rem;color:'+(_runeword?'#6b2da8':'#7a5cb0')+'">'+rwLine+'</div>' : '')
            })() : ''}
          </div>
        </div>`
      }).join('')

      document.querySelectorAll('.equip-slot').forEach(el => {
        el.addEventListener('click', async () => {
          const slot = el.dataset.slot
          if (selectedId) {
            await equipItem(selectedId, slot)
          } else {
            const item = items.find(i=>i.equipped_slot===slot)
            if (item) showEquippedModal(item)
          }
        })
      })

      // ── Set bonus detection ───────────────────────────────
      const WATCHER_KEYS = ['watcher_eye_ring','watcher_band','watcher_cloak','watcher_crown']
      const SET_BONUSES = {
        1: null,
        2: { label:'2-Piece Set', effect:'Observer Stacks on hit (max 5): +2% Crit Chance & +2% Accuracy per stack.' },
        3: { label:'3-Piece Set', effect:'Dodging or critting auto-applies Observed. Observed enemies take +10% damage.' },
        4: { label:'4-Piece Set — THE WATCHER SEES ALL', effect:'After 5 hits: Total Observation — enemy Marked (+30% dmg), Slowed, cannot dodge.' },
      }
      const equippedWatcher = items.filter(i => i.equipped_slot && WATCHER_KEYS.includes(i.item_key))
      const panel = document.getElementById('set-bonus-panel')
      if (equippedWatcher.length >= 2) {
        const bonus = SET_BONUSES[Math.min(equippedWatcher.length, 4)]
        panel.innerHTML = `
          <div style="padding:.5rem .65rem;background:rgba(94,174,224,.06);border:.5px solid rgba(94,174,224,.2);border-radius:4px">
            <p style="font-family:'Share Tech Mono',monospace;font-size:.48rem;color:#1a4a8a;letter-spacing:.08em;margin-bottom:2px">
              👁 WATCHER SET (${equippedWatcher.length}/4) — ${bonus.label}
            </p>
            <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.68rem;color:var(--ink-dim);line-height:1.4;margin:0">${bonus.effect}</p>
            ${equippedWatcher.length < 4 ? `<p style="font-family:'Share Tech Mono',monospace;font-size:.44rem;color:var(--ink-dim);margin-top:3px">${4-equippedWatcher.length} more piece${equippedWatcher.length<3?'s':''} for next bonus</p>` : ''}
          </div>`
      } else if (equippedWatcher.length === 1) {
        panel.innerHTML = `<p style="font-family:'Share Tech Mono',monospace;font-size:.46rem;color:var(--ink-dim);letter-spacing:.06em">👁 Watcher Set: 1/4 equipped — equip 1 more for set bonus</p>`
      } else {
        panel.innerHTML = ''
      }
    }

    function renderGrid() {
      // Exclude equipped items from the bag view
      const unequipped = items.filter(i => !i.equipped_slot)
      const filtered = unequipped.filter(i=>filter==='all'||i.item_type===filter)
      const unequippedCount = items.filter(i=>!i.equipped_slot).length
      document.getElementById('bag-count').textContent = unequippedCount + ' items'

      // ── Sell-mode toolbar ────────────────────────────
      let toolbar = document.getElementById('sell-toolbar')
      if (!toolbar) {
        toolbar = document.createElement('div')
        toolbar.id = 'sell-toolbar'
        toolbar.style.cssText = 'display:flex;gap:5px;margin-bottom:.5rem;flex-wrap:wrap;align-items:center'
        const filterTabs = document.getElementById('filter-tabs')
        filterTabs.insertAdjacentElement('afterend', toolbar)
      }
      const totalSellGold = [...sellSelected].reduce((sum, id) => {
        const it = items.find(i=>i.id===id)
        if (!it) return sum
        return sum + (it.sell_price || Math.max(1, Math.floor((it.buy_price||20)*.4))) * (it.quantity||1)
      }, 0)
      const _bst = 'font-family:JetBrains Mono,monospace;font-size:.58rem;padding:4px 12px;border-radius:20px;cursor:pointer;letter-spacing:.04em'
      toolbar.innerHTML = sellMode
        ? `<button onclick="toggleSellMode()" style="${_bst};background:rgba(192,64,64,.3) !important;border:1px solid rgba(220,80,80,.7) !important;color:#ff8080 !important">✕ Cancel</button>
           ${sellSelected.size>0
             ? `<button onclick="sellSelectedItems()" style="${_bst};background:rgba(200,168,74,.3) !important;border:1px solid rgba(200,168,74,.8) !important;color:#f0d080 !important;font-weight:600">⊞ Sell ${sellSelected.size} · ◈${totalSellGold}</button>
                <button onclick="selectAllSellable()" style="${_bst};background:rgba(255,255,255,.05) !important;border:1px solid rgba(200,168,74,.3) !important;color:#c8a84a !important">All</button>`
             : `<span style="font-family:'IM Fell English',serif;font-style:italic;font-size:.78rem;color:var(--ink-dim)">Tap items to select…</span>`}`
        : `<button onclick="toggleSellMode()" style="${_bst};background:rgba(255,255,255,.04) !important;border:1px solid rgba(200,168,74,.25) !important;color:var(--gold-dim) !important">⊞ Multi-Sell</button>`

      document.getElementById('item-grid').innerHTML = filtered.map(item => {
        const isSellSelected = sellMode && sellSelected.has(item.id)
        const imgSrc = getItemImg(item.item_key)
        const bonuses = [
          item.atk_bonus>0?'ATK+'+item.atk_bonus:'',
          item.def_bonus>0?'DEF+'+item.def_bonus:'',
          (item.power_bonus||0)>0?'PWR+'+item.power_bonus:'',
          (item.guard_bonus||0)>0?'GRD+'+item.guard_bonus:'',
          (item.speed_bonus||0)>0?'SPD+'+item.speed_bonus:'',
          (item.control_bonus||0)>0?'CTR+'+item.control_bonus:'',
          (item.insight_bonus||0)>0?'INS+'+item.insight_bonus:'',
          (item.luck_bonus||0)>0?'LCK+'+item.luck_bonus:'',
          item.hp_restore>0?'+'+item.hp_restore+'HP':'',
        ].filter(Boolean).join(' ')
        const selOutline = isSellSelected ? 'outline:1.5px solid rgba(200,168,74,.8);background:rgba(200,168,74,.12) !important;' : ''
        const isSelected = !sellMode && selectedId===item.id
        return `
        <div class="item-card${isSelected?' selected':''}" data-id="${item.id}" style="${selOutline}">
          ${sellMode ? `<div style="position:absolute;top:4px;right:4px;width:14px;height:14px;border-radius:2px;border:1.5px solid ${isSellSelected?'rgba(200,168,74,.9)':'rgba(200,168,74,.3)'};background:${isSellSelected?'rgba(200,168,74,.5)':'transparent'};display:flex;align-items:center;justify-content:center;font-size:.5rem;color:#e8dfc8">${isSellSelected?'✓':''}</div>` : ''}
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">
            ${imgSrc ? `<img src="${imgSrc}" style="width:26px;height:26px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">` : `<div style="font-size:1.1rem;flex-shrink:0;line-height:1">${item.icon||'📦'}</div>`}
            <div style="min-width:0;flex:1;overflow:hidden">
              <div class="item-name" style="color:${RARITY[item.rarity]||'#c8c0a0'}">${item.name}</div>
              <div class="item-type">${item.subtype||item.item_type}${item.quantity>1?' ×'+item.quantity:''}</div>
            </div>
          </div>
          ${bonuses ? `<div style="font-family:'JetBrains Mono',monospace;font-size:.42rem;color:#7a5c30;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${bonuses}</div>` : ''}
          ${(item.sockets_total||0)>0 ? `<div style="font-family:'JetBrains Mono',monospace;font-size:.42rem;color:${item.runeword_name?'#6b2da8':'#7a5cb0'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.runeword_name?'✦ '+item.runeword_name:(item.sockets_used||0)+'/'+item.sockets_total+' ◈'}</div>` : ''}
          ${item.equipped_slot ? `<div class="item-eq" style="position:absolute;top:3px;right:3px">EQ</div>` : ''}
        </div>`
      }).join('') || `<div style="font-family:'IM Fell English',serif;font-style:italic;font-size:.88rem;color:#7a5c30;grid-column:span 3;padding:.5rem">Nothing here.</div>`

      document.querySelectorAll('.item-card').forEach(el => {
        el.addEventListener('click', () => {
          if (sellMode) {
            const id = el.dataset.id
            if (sellSelected.has(id)) sellSelected.delete(id)
            else sellSelected.add(id)
            renderGrid()
          } else {
            selectedId = selectedId === el.dataset.id ? null : el.dataset.id
            render()
            renderDetail()
          }
        })
      })
    }

    window.toggleSellMode = () => {
      sellMode = !sellMode
      sellSelected.clear()
      selectedId = null
      renderGrid()
      renderDetail()
    }

    window.selectAllSellable = () => {
      const unequipped = items.filter(i => !i.equipped_slot && (filter==='all'||i.item_type===filter))
      unequipped.forEach(i => sellSelected.add(i.id))
      renderGrid()
    }

    window.sellSelectedItems = async () => {
      if (!sellSelected.size) return
      const toSell = [...sellSelected].map(id => items.find(i=>i.id===id)).filter(Boolean)
      let totalGold = 0
      for (const item of toSell) {
        const price = item.sell_price || Math.max(1, Math.floor((item.buy_price||20)*.4))
        const qty = item.quantity || 1
        totalGold += price * qty
        await supabase.from('inventory').delete().eq('id', item.id)
      }
      const newGold = (player.gold || 0) + totalGold
      await supabase.from('players').update({ gold: newGold }).eq('id', player.id)
      player.gold = newGold
      window.showToast('Sold ' + toSell.length + ' item(s) for ◈' + totalGold)
      sellSelected.clear()
      sellMode = false
      selectedId = null
      await load()
    }

    function renderStats() {
      const eq   = items.filter(i=>i.equipped_slot)
      const atk  = 1 + eq.reduce((s,i)=>s+(i.atk_bonus||0),0)
      const def  =     eq.reduce((s,i)=>s+(i.def_bonus||0),0)
      const pwr  =     eq.reduce((s,i)=>s+(i.power_bonus||0),0)
      const ctr  =     eq.reduce((s,i)=>s+(i.control_bonus||0),0)
      const grd  =     eq.reduce((s,i)=>s+(i.guard_bonus||0),0)
      const spd  =     eq.reduce((s,i)=>s+(i.speed_bonus||0),0)
      const ins  =     eq.reduce((s,i)=>s+(i.insight_bonus||0),0)
      const lck  =     eq.reduce((s,i)=>s+(i.luck_bonus||0),0)
      document.getElementById('total-stats').innerHTML = `
        <span>ATK <strong style="color:#8a2020">${atk}</strong></span>
        <span>DEF <strong style="color:#1a6020">${def}</strong></span>
        ${pwr?`<span>PWR <strong style="color:#8a2a00">${pwr}</strong></span>`:''}
        ${ctr?`<span>CTR <strong style="color:#1a3a8a">${ctr}</strong></span>`:''}
        ${grd?`<span>GRD <strong style="color:#8b5e3c">${grd}</strong></span>`:''}
        ${spd?`<span>SPD <strong style="color:#2a6890">${spd}</strong></span>`:''}
        ${ins?`<span>INS <strong style="color:#8a6020">${ins}</strong></span>`:''}
        ${lck?`<span>LCK <strong style="color:#5a2090">${lck}</strong></span>`:''}
      `
    }

    function renderDetail() {
      const container = document.getElementById('item-detail')
      container.innerHTML = ''
      if (!selectedId) return
      const item = items.find(i=>i.id===selectedId)
      if (!item) return

      const RUNE_COLORS = {ignis:'#ff5500',aqua:'#0088ff',terra:'#8b5e3c',aero:'#a8d8ea',umbra:'#b06eff',lux:'#ffd700',venin:'#4caf50',ferro:'#90a4ae',flora:'#66bb6a',volt:'#ffee58'}
      const RUNE_ICONS  = {ignis:'🔥',aqua:'💧',terra:'🪨',aero:'💨',umbra:'🌑',lux:'✨',venin:'☠️',ferro:'⚙️',flora:'🌿',volt:'⚡'}

      const wrap = document.createElement('div')
      Object.assign(wrap.style, {border:'.5px solid rgba(200,168,74,.2)', borderRadius:'4px', padding:'.75rem', marginTop:'.5rem', background:'rgba(43,29,22,.04)'})

      // ── Header: image + name + close ──
      const header = document.createElement('div')
      header.style.cssText = 'display:flex;align-items:flex-start;gap:.6rem;margin-bottom:.6rem'

      const imgSrc = getItemImg(item.item_key)
      if (imgSrc) {
        const img = document.createElement('img')
        img.src = imgSrc
        img.style.cssText = 'width:48px;height:48px;object-fit:contain;border-radius:5px;flex-shrink:0;border:1px solid rgba(200,168,74,.2)'
        img.onerror = () => img.remove()
        header.appendChild(img)
      }

      const nameBlock = document.createElement('div')
      nameBlock.style.cssText = 'flex:1;min-width:0'

      const nameEl = document.createElement('div')
      nameEl.textContent = item.name
      Object.assign(nameEl.style, {fontFamily:"'Cinzel',serif", fontSize:'.88rem', fontWeight:'600', color: RARITY[item.rarity]||'#c8c0a0', marginBottom:'2px', lineHeight:'1.2'})
      nameBlock.appendChild(nameEl)

      const subEl = document.createElement('div')
      subEl.textContent = `${item.rarity} · ${item.subtype||item.item_type}${item.two_handed?' · 2H':''}`
      Object.assign(subEl.style, {fontFamily:"'JetBrains Mono',monospace", fontSize:'.5rem', color:'#2b1d16', letterSpacing:'.06em', textTransform:'uppercase'})
      nameBlock.appendChild(subEl)
      header.appendChild(nameBlock)

      // Close button — proper DOM button, not innerHTML
      const closeBtn = document.createElement('button')
      closeBtn.textContent = '✕'
      Object.assign(closeBtn.style, {
        flexShrink:'0', marginLeft:'.4rem',
        background:'rgba(255,255,255,.07)', border:'1px solid rgba(200,168,74,.25)',
        color:'#2b1d16', fontSize:'.85rem', cursor:'pointer',
        padding:'3px 8px', borderRadius:'3px',
        fontFamily:"'JetBrains Mono',monospace", lineHeight:'1'
      })
      closeBtn.addEventListener('click', () => { selectedId = null; render() })
      header.appendChild(closeBtn)
      wrap.appendChild(header)

      // ── Stat pills ──
      const statRow = document.createElement('div')
      statRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px;margin-bottom:.6rem'
      const statDefs = [
        [item.atk_bonus,    'ATK', '#8a2020'],
        [item.def_bonus,    'DEF', '#1a6020'],
        [item.power_bonus,  'PWR', '#8a2a00'],
        [item.guard_bonus,  'GRD', '#1a4a8a'],
        [item.speed_bonus,  'SPD', '#2a6890'],
        [item.control_bonus,'CTR', '#1a3a8a'],
        [item.insight_bonus,'INS', '#8a6020'],
        [item.luck_bonus,   'LCK', '#5a2090'],
        [item.hp_restore,   '+HP', '#1a4a8a'],
      ]
      let anyStats = false
      statDefs.forEach(([val, label, col]) => {
        if (!val || val <= 0) return
        anyStats = true
        const pill = document.createElement('div')
        pill.textContent = `${label} +${val}`
        Object.assign(pill.style, {fontFamily:"'JetBrains Mono',monospace", fontSize:'.6rem', color:col, background:col+'18', border:`1px solid ${col}44`, borderRadius:'3px', padding:'2px 6px'})
        statRow.appendChild(pill)
      })
      if (!anyStats) {
        const util = document.createElement('div')
        util.textContent = 'Utility item'
        Object.assign(util.style, {fontFamily:"'JetBrains Mono',monospace", fontSize:'.6rem', color:'#2b1d16'})
        statRow.appendChild(util)
      }
      wrap.appendChild(statRow)

      // ── Special effect ──
      if (item.special_effect) {
        const fxBox = document.createElement('div')
        Object.assign(fxBox.style, {marginBottom:'.6rem', padding:'5px 8px', background:'rgba(94,174,224,.08)', border:'.5px solid rgba(94,174,224,.3)', borderRadius:'3px'})
        const fxLabel = document.createElement('div')
        fxLabel.textContent = 'SET EFFECT'
        Object.assign(fxLabel.style, {fontFamily:"'JetBrains Mono',monospace", fontSize:'.48rem', color:'#1a4a8a', letterSpacing:'.08em', marginBottom:'2px'})
        const fxText = document.createElement('div')
        fxText.textContent = item.special_effect
        Object.assign(fxText.style, {fontFamily:"'IM Fell English',serif", fontStyle:'italic', fontSize:'.68rem', color:'#2b1d16', lineHeight:'1.4'})
        fxBox.appendChild(fxLabel)
        fxBox.appendChild(fxText)
        wrap.appendChild(fxBox)
      }

      // ── Sockets ──
      if ((item.sockets_total||0) > 0) {
        const sockWrap = document.createElement('div')
        sockWrap.style.cssText = 'margin-bottom:.5rem'

        const sockLabel = document.createElement('div')
        sockLabel.textContent = `SOCKETS ${item.sockets_used||0}/${item.sockets_total}`
        Object.assign(sockLabel.style, {fontFamily:"'JetBrains Mono',monospace", fontSize:'.52rem', color:'#5a2090', letterSpacing:'.07em', marginBottom:'5px'})
        sockWrap.appendChild(sockLabel)

        const sockRow = document.createElement('div')
        sockRow.style.cssText = 'display:flex;gap:4px;margin-bottom:5px;flex-wrap:wrap'
        Array.from({length:item.sockets_total}).forEach((_,i) => {
          const rune  = (item.socketed_runes||[])[i]
          const color = rune ? (RUNE_COLORS[rune]||'#a07de0') : 'rgba(160,125,224,.3)'
          const dot   = document.createElement('div')
          Object.assign(dot.style, {width:'24px',height:'24px',borderRadius:'50%',border:`1.5px solid ${color}`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',background: rune ? color+'22':'rgba(0,0,0,.3)',flexShrink:'0'})
          if (rune) {
            const ri = document.createElement('img')
            ri.src = `../assets/runes/rune_${rune}.png`
            ri.style.cssText = 'width:18px;height:18px;object-fit:contain;border-radius:50%'
            ri.onerror = () => { ri.remove(); dot.textContent = RUNE_ICONS[rune]||'◈' }
            dot.appendChild(ri)
          } else {
            const empty = document.createElement('div')
            empty.textContent = '○'
            Object.assign(empty.style, {color:'#5a2090', fontSize:'.75rem'})
            dot.appendChild(empty)
          }
          sockRow.appendChild(dot)
        })
        sockWrap.appendChild(sockRow)

        // Runeword
        if (item.runeword_name) {
          const rwBox = document.createElement('div')
          Object.assign(rwBox.style, {padding:'4px 6px', background:'rgba(160,125,224,.12)', border:'.5px solid rgba(160,125,224,.3)', borderRadius:'3px', marginBottom:'4px'})
          const rwName = document.createElement('div')
          rwName.textContent = '✦ ' + item.runeword_name
          Object.assign(rwName.style, {fontFamily:"'Cinzel',serif", fontSize:'.68rem', color:'#5a2090', marginBottom:'2px'})
          rwBox.appendChild(rwName)
          if (item.runeword_effect) {
            const rwFx = document.createElement('div')
            rwFx.textContent = item.runeword_effect
            Object.assign(rwFx.style, {fontFamily:"'IM Fell English',serif", fontStyle:'italic', fontSize:'.65rem', color:'#2b1d16', marginBottom:'2px'})
            rwBox.appendChild(rwFx)
          }
          const rwStats = [['power_bonus','PWR'],['control_bonus','CTR'],['guard_bonus','GRD'],['speed_bonus','SPD'],['insight_bonus','INS'],['luck_bonus','LCK'],['atk_bonus','ATK'],['def_bonus','DEF']]
            .filter(([k])=>(item[k]||0)>0).map(([k,l])=>l+' +'+item[k]).join(' · ')
          if (rwStats) {
            const rwSt = document.createElement('div')
            rwSt.textContent = rwStats
            Object.assign(rwSt.style, {fontFamily:"'JetBrains Mono',monospace", fontSize:'.52rem', color:'#2b1d16'})
            rwBox.appendChild(rwSt)
          }
          sockWrap.appendChild(rwBox)
        }

        // Add rune / remove rune buttons
        const sockBtnRow = document.createElement('div')
        sockBtnRow.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;margin-top:4px'
        if ((item.sockets_used||0) < (item.sockets_total||0)) {
          const addBtn = document.createElement('button')
          addBtn.textContent = '✦ Add Rune'
          Object.assign(addBtn.style, {fontFamily:"'Cinzel',serif", fontSize:'.68rem', color:'#5a2090', background:'rgba(160,125,224,.15)', border:'.5px solid rgba(160,125,224,.45)', borderRadius:'3px', padding:'3px 10px', cursor:'pointer'})
          addBtn.addEventListener('click', () => openRunePicker(item.id, item.item_type))
          sockBtnRow.appendChild(addBtn)
        }
        if ((item.sockets_used||0) > 0) {
          const remBtn = document.createElement('button')
          remBtn.textContent = 'Remove Runes'
          Object.assign(remBtn.style, {fontFamily:"'Cinzel',serif", fontSize:'.68rem', color:'#2b1d16', background:'rgba(200,168,74,.08)', border:'.5px solid rgba(200,168,74,.25)', borderRadius:'3px', padding:'3px 10px', cursor:'pointer'})
          remBtn.addEventListener('click', () => removeRunes(item.id))
          sockBtnRow.appendChild(remBtn)
        }
        sockWrap.appendChild(sockBtnRow)

        // Rune picker container
        const pickerDiv = document.createElement('div')
        pickerDiv.id = `rune-picker-${item.id}`
        pickerDiv.style.cssText = 'display:none;margin-top:6px;padding:6px;background:rgba(0,0,0,.2);border-radius:4px;border:.5px solid rgba(160,125,224,.3)'
        sockWrap.appendChild(pickerDiv)
        wrap.appendChild(sockWrap)
      }

      // ── Action buttons ──
      const actRow = document.createElement('div')
      actRow.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.25rem'

      const mkBtn = (text, color, border, onClick) => {
        const b = document.createElement('button')
        b.textContent = text
        Object.assign(b.style, {fontFamily:"'Cinzel',serif", fontSize:'.72rem', color, background: color+'18', border:`1px solid ${border}`, borderRadius:'3px', padding:'4px 12px', cursor:'pointer'})
        b.addEventListener('click', onClick)
        return b
      }

      if (item.item_type === 'consumable') {
        actRow.appendChild(mkBtn('Use ×1', '#5eaee0', '#5eaee055', () => useItem(item.id)))
      }
      if (item.equipped_slot) {
        actRow.appendChild(mkBtn('Unequip', '#c8a84a', '#c8a84a55', () => unequipSlot(item.equipped_slot)))
      }
      if (!item.equipped_slot) {
        const sp  = item.sell_price || Math.max(1, Math.floor((item.buy_price||20)*.4))
        const qty = item.quantity || 1
        actRow.appendChild(mkBtn(`Sell ◈${sp}`, '#c8a84a', 'rgba(200,168,74,.4)', () => sellItem(item.id, item.name, sp, qty)))
        if (qty > 1) {
          actRow.appendChild(mkBtn(`Sell All ◈${sp*qty}`, '#c8a84a', 'rgba(200,168,74,.4)', () => sellItemAll(item.id, item.name, sp, qty)))
        }
      }
      wrap.appendChild(actRow)
      container.appendChild(wrap)
    }

    // ── Equipped item modal ──────────────────────────
    function showEquippedModal(item) {
      document.getElementById('equipped-modal')?.remove()

      const RUNE_COLORS = {ignis:'#ff5500',aqua:'#0088ff',terra:'#8b5e3c',aero:'#a8d8ea',umbra:'#b06eff',lux:'#ffd700',venin:'#4caf50',ferro:'#90a4ae',flora:'#66bb6a',volt:'#ffee58'}
      const RUNE_ICONS  = {ignis:'🔥',aqua:'💧',terra:'🪨',aero:'💨',umbra:'🌑',lux:'✨',venin:'☠️',ferro:'⚙️',flora:'🌿',volt:'⚡'}
      const RARITY_COL  = {common:'#5c4638',uncommon:'#2f7a2f',rare:'#1e5a8a',epic:'#6b2da8',legendary:'#a06820',mythic:'#a82a8a'}

      const sockets  = item.sockets_total || 0
      const used     = item.sockets_used  || 0
      const runes    = item.socketed_runes || []
      const hasEmpty = used < sockets
      const hasRunes = used > 0

      // ── Build modal via DOM (bypasses p/span CSS overrides) ──
      const overlay = document.createElement('div')
      overlay.id = 'equipped-modal'
      Object.assign(overlay.style, {
        position:'fixed', inset:'0', zIndex:'600',
        display:'flex', alignItems:'center', justifyContent:'center',
        background:'rgba(0,0,0,.75)', animation:'fadeIn .2s ease'
      })

      const box = document.createElement('div')
      Object.assign(box.style, {
        background:'#0a0e08', border:'1px solid rgba(200,168,74,.4)',
        borderRadius:'6px', padding:'1.25rem',
        minWidth:'290px', maxWidth:'360px', width:'90vw',
        boxShadow:'0 24px 80px rgba(0,0,0,.95)',
        maxHeight:'85vh', overflowY:'auto'
      })

      // ── Header row ──
      const header = document.createElement('div')
      Object.assign(header.style, {display:'flex', alignItems:'flex-start', gap:'.75rem', marginBottom:'.85rem'})

      // Item image
      const imgSrc = getItemImg(item.item_key)
      if (imgSrc) {
        const img = document.createElement('img')
        img.src = imgSrc
        Object.assign(img.style, {width:'52px',height:'52px',objectFit:'contain',borderRadius:'4px',flexShrink:'0',border:'1px solid rgba(200,168,74,.25)'})
        img.onerror = () => img.remove()
        header.appendChild(img)
      }

      // Name + subtitle + stats
      const nameBlock = document.createElement('div')
      nameBlock.style.cssText = 'flex:1;min-width:0'

      const nameEl = document.createElement('div')
      nameEl.textContent = item.name
      Object.assign(nameEl.style, {fontFamily:"'Cinzel',serif", fontSize:'.95rem', fontWeight:'600', color: RARITY_COL[item.rarity]||'#e8dfc8', marginBottom:'3px', lineHeight:'1.2'})
      nameBlock.appendChild(nameEl)

      const subEl = document.createElement('div')
      subEl.textContent = `${item.rarity} · ${item.subtype||item.item_type}${item.two_handed?' · 2H':''}`
      Object.assign(subEl.style, {fontFamily:"'JetBrains Mono',monospace", fontSize:'.5rem', color:'#2b1d16', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'5px'})
      nameBlock.appendChild(subEl)

      // Stat pills
      const statRow = document.createElement('div')
      statRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px'
      const statDefs = [
        [item.atk_bonus,    'ATK', '#8a2020'],
        [item.def_bonus,    'DEF', '#1a6020'],
        [item.power_bonus,  'PWR', '#ff6622'],
        [item.guard_bonus,  'GRD', '#1a4a8a'],
        [item.speed_bonus,  'SPD', '#2a6890'],
        [item.control_bonus,'CTR', '#0099ff'],
        [item.insight_bonus,'INS', '#8a6020'],
        [item.luck_bonus,   'LCK', '#c090ff'],
        [item.hp_restore,   '+HP', '#1a4a8a'],
      ]
      statDefs.forEach(([val, label, col]) => {
        if (!val || val <= 0) return
        const pill = document.createElement('div')
        pill.textContent = `${label} +${val}`
        Object.assign(pill.style, {fontFamily:"'JetBrains Mono',monospace", fontSize:'.56rem', color:col, background: col+'18', border:`1px solid ${col}44`, borderRadius:'3px', padding:'1px 5px'})
        statRow.appendChild(pill)
      })
      nameBlock.appendChild(statRow)
      header.appendChild(nameBlock)

      // Close button
      const closeBtn = document.createElement('button')
      closeBtn.textContent = '✕'
      Object.assign(closeBtn.style, {
        background:'rgba(255,255,255,.06)', border:'1px solid rgba(200,168,74,.2)',
        color:'#2b1d16', fontSize:'.85rem', cursor:'pointer', padding:'4px 8px',
        lineHeight:'1', flexShrink:'0', borderRadius:'3px',
        fontFamily:"'JetBrains Mono',monospace"
      })
      closeBtn.onclick = () => overlay.remove()
      header.appendChild(closeBtn)
      box.appendChild(header)

      // ── Sockets section ──
      if (sockets > 0) {
        const sockWrap = document.createElement('div')
        Object.assign(sockWrap.style, {margin:'0 0 .75rem', padding:'.5rem .6rem', background:'rgba(255,255,255,.03)', border:'.5px solid rgba(200,168,74,.15)', borderRadius:'4px'})

        const sockLabel = document.createElement('div')
        sockLabel.textContent = `SOCKETS ${used}/${sockets}`
        Object.assign(sockLabel.style, {fontFamily:"'JetBrains Mono',monospace", fontSize:'.5rem', color:'#2b1d16', letterSpacing:'.1em', marginBottom:'7px'})
        sockWrap.appendChild(sockLabel)

        const sockRow = document.createElement('div')
        sockRow.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px'
        Array.from({length:sockets}).forEach((_,i) => {
          const rune  = runes[i]
          const color = rune ? (RUNE_COLORS[rune]||'#a07de0') : 'rgba(200,168,74,.25)'
          const dot   = document.createElement('div')
          Object.assign(dot.style, {width:'28px',height:'28px',borderRadius:'50%',border:`1.5px solid ${color}`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',background: rune ? color+'22' : 'rgba(0,0,0,.35)',flexShrink:'0'})
          if (rune) {
            const ri = document.createElement('img')
            ri.src = `../assets/runes/rune_${rune}.png`
            ri.style.cssText = 'width:22px;height:22px;object-fit:contain;border-radius:50%'
            ri.onerror = () => { ri.remove(); dot.textContent = RUNE_ICONS[rune]||'◈' }
            dot.appendChild(ri)
          } else {
            const empty = document.createElement('div')
            empty.textContent = '○'
            Object.assign(empty.style, {color:'#2b1d16', fontSize:'.8rem'})
            dot.appendChild(empty)
          }
          sockRow.appendChild(dot)
        })
        sockWrap.appendChild(sockRow)

        // Runeword display
        if (item.runeword_name) {
          const rwBox = document.createElement('div')
          Object.assign(rwBox.style, {padding:'5px 7px', background:'rgba(160,125,224,.12)', border:'.5px solid rgba(160,125,224,.35)', borderRadius:'3px'})

          const rwName = document.createElement('div')
          rwName.textContent = '✦ ' + item.runeword_name
          Object.assign(rwName.style, {fontFamily:"'Cinzel',serif", fontSize:'.72rem', color:'#5a2090', marginBottom:'2px'})
          rwBox.appendChild(rwName)

          if (item.runeword_effect) {
            const rwFx = document.createElement('div')
            rwFx.textContent = item.runeword_effect
            Object.assign(rwFx.style, {fontFamily:"'IM Fell English',serif", fontStyle:'italic', fontSize:'.66rem', color:'#2b1d16', marginBottom:'3px'})
            rwBox.appendChild(rwFx)
          }

          const rwStats = [['power_bonus','PWR'],['control_bonus','CTR'],['guard_bonus','GRD'],['speed_bonus','SPD'],['insight_bonus','INS'],['luck_bonus','LCK'],['atk_bonus','ATK'],['def_bonus','DEF']]
            .filter(([k])=>(item[k]||0)>0).map(([k,l])=>l+' +'+item[k]).join(' · ')
          if (rwStats) {
            const rwStatEl = document.createElement('div')
            rwStatEl.textContent = rwStats
            Object.assign(rwStatEl.style, {fontFamily:"'JetBrains Mono',monospace", fontSize:'.5rem', color:'#2b1d16'})
            rwBox.appendChild(rwStatEl)
          }
          sockWrap.appendChild(rwBox)
        }
        box.appendChild(sockWrap)
      }

      // ── Action buttons ──
      const btnWrap = document.createElement('div')
      btnWrap.style.cssText = 'display:flex;flex-direction:column;gap:6px'

      function makeBtn(text, bgColor, borderColor, textColor, onClick) {
        const b = document.createElement('button')
        b.textContent = text
        Object.assign(b.style, {
          width:'100%', fontFamily:"'Cinzel',serif", fontSize:'.76rem',
          color: textColor, background: bgColor, border:`1px solid ${borderColor}`,
          borderRadius:'3px', padding:'.45rem', cursor:'pointer'
        })
        b.onclick = onClick
        return b
      }

      if (hasEmpty) {
        btnWrap.appendChild(makeBtn(
          '✦ Add Rune to Socket',
          'rgba(160,125,224,.18)', 'rgba(160,125,224,.5)', '#c090ff',
          () => openRunePickerModal(item.id, item.item_type)
        ))
      }
      btnWrap.appendChild(makeBtn(
        'Unequip',
        'rgba(200,168,74,.12)', 'rgba(200,168,74,.4)', '#e8dfc8',
        () => { unequipSlot(item.equipped_slot); overlay.remove() }
      ))
      if (hasRunes) {
        btnWrap.appendChild(makeBtn(
          '✕ Remove & Destroy Runes',
          'rgba(192,64,64,.12)', 'rgba(192,64,64,.4)', '#ff7070',
          () => destroyRunes(item.id)
        ))
      }
      box.appendChild(btnWrap)

      overlay.appendChild(box)
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove() })
      document.body.appendChild(overlay)
    }

    // ── Open rune picker from equipped modal ──────────
    window.openRunePickerModal = async function(itemId, itemType) {
      const modal = document.getElementById('equipped-modal')
      if (!modal) return
      const existing = modal.querySelector('#modal-rune-picker')
      if (existing) { existing.remove(); return }

      const pickerEl = document.createElement('div')
      pickerEl.id = 'modal-rune-picker'
      Object.assign(pickerEl.style, {marginTop:'8px', padding:'8px', background:'rgba(43,29,22,.04)', borderRadius:'4px', border:'.5px solid rgba(160,125,224,.3)'})

      const { data: runeItems } = await supabase.from('inventory')
        .select('*').eq('player_id', player.id).like('item_key','rune_%').gt('quantity',0)

      const RUNE_COLORS = {ignis:'#ff5500',aqua:'#0088ff',terra:'#8b5e3c',aero:'#a8d8ea',umbra:'#b06eff',lux:'#ffd700',venin:'#4caf50',ferro:'#90a4ae',flora:'#66bb6a',volt:'#ffee58'}
      const RUNE_ICONS  = {ignis:'🔥',aqua:'💧',terra:'🪨',aero:'💨',umbra:'🌑',lux:'✨',venin:'☠️',ferro:'⚙️',flora:'🌿',volt:'⚡'}
      const RUNE_NAMES  = {ignis:'Ignis',aqua:'Aqua',terra:'Terra',aero:'Aero',umbra:'Umbra',lux:'Lux',venin:'Venin',ferro:'Ferro',flora:'Flora',volt:'Volt'}

      if (!runeItems || !runeItems.length) {
        const msg = document.createElement('div')
        msg.textContent = 'No runes in inventory.'
        Object.assign(msg.style, {fontFamily:"'IM Fell English',serif", fontStyle:'italic', fontSize:'.8rem', color:'#2b1d16'})
        pickerEl.appendChild(msg)
      } else {
        const label = document.createElement('div')
        label.textContent = 'SELECT RUNE'
        Object.assign(label.style, {fontFamily:"'JetBrains Mono',monospace", fontSize:'.5rem', color:'#2b1d16', letterSpacing:'.1em', marginBottom:'7px'})
        pickerEl.appendChild(label)

        const grid = document.createElement('div')
        grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px'

        runeItems.forEach(r => {
          const key = r.item_key.replace('rune_','')
          const col = RUNE_COLORS[key] || '#888'
          const btn = document.createElement('button')
          btn.onclick = () => socketRuneToItem(itemId, r.id, key, itemType)
          Object.assign(btn.style, {
            display:'flex', alignItems:'center', gap:'4px',
            background: col+'22', border:`1px solid ${col}70`,
            borderRadius:'4px', padding:'4px 8px', cursor:'pointer',
            fontFamily:"'JetBrains Mono',monospace", fontSize:'.6rem', color: col
          })
          const ri = document.createElement('img')
          ri.src = `../assets/runes/rune_${key}.png`
          ri.style.cssText = 'width:16px;height:16px;object-fit:contain;border-radius:2px;flex-shrink:0'
          ri.onerror = () => { ri.remove(); const ic = document.createElement('div'); ic.textContent = RUNE_ICONS[key]||'◈'; btn.insertBefore(ic, btn.firstChild) }

          const nameEl = document.createElement('div')
          nameEl.textContent = RUNE_NAMES[key] || key
          nameEl.style.color = col

          const qtyEl = document.createElement('div')
          qtyEl.textContent = '×' + r.quantity
          Object.assign(qtyEl.style, {color:'#2b1d16', fontSize:'.5rem'})

          btn.appendChild(ri)
          btn.appendChild(nameEl)
          btn.appendChild(qtyEl)
          grid.appendChild(btn)
        })
        pickerEl.appendChild(grid)
      }

      // Append to the box div inside the overlay
      const box = modal.querySelector('div')
      if (box) box.appendChild(pickerEl)
    }

    // ── Destroy runes (does NOT refund) ──────────────
    window.destroyRunes = async function(itemId) {
      if (!confirm('Remove and DESTROY all runes? They will not be returned.')) return
      await supabase.from('inventory').update({
        socketed_runes:[], sockets_used:0,
        runeword_name:null, runeword_effect:null,
        power_bonus:0, control_bonus:0, guard_bonus:0,
        speed_bonus:0, insight_bonus:0, luck_bonus:0,
      }).eq('id', itemId)
      document.getElementById('equipped-modal')?.remove()
      window.showToast('Runes destroyed')
      await load()
    }

    async function equipItem(itemId, slot) {
      const item = items.find(i=>i.id===itemId)
      if (!item) return
      const slotDef = SLOTS.find(s=>s.key===slot)
      if (!slotDef.accepts.includes(item.subtype||item.item_type)) {
        window.showToast(`${item.name} can't go in ${slotDef.label}`, true); return
      }
      // Unequip current in slot
      const current = items.find(i=>i.equipped_slot===slot)
      if (current) await supabase.from('inventory').update({equipped_slot:null}).eq('id',current.id)
      // If 2H, clear offhand
      if (item.two_handed && slot==='mainhand') {
        const oh = items.find(i=>i.equipped_slot==='offhand')
        if (oh) await supabase.from('inventory').update({equipped_slot:null}).eq('id',oh.id)
      }
      await supabase.from('inventory').update({equipped_slot:slot}).eq('id',itemId)
      window.showToast(`${item.name} equipped`)
      selectedId = null
      await load()
    }

    async function unequipSlot(slot) {
      const item = items.find(i=>i.equipped_slot===slot)
      if (!item) return
      await supabase.from('inventory').update({equipped_slot:null}).eq('id',item.id)
      window.showToast(`${item.name} unequipped`)
      await load()
    }

    window.unequipSlot = unequipSlot

    // ── Runeword data ──────────────────────────────
    const RUNEWORDS = {
      // ══════════════════════════════════════════════════════
      // WEAPON RUNEWORDS — 2 rune
      // ══════════════════════════════════════════════════════
      'ignis+ignis':              {n:2,name:'Ember Core',        rarity:'rare',      slot:'weapon',    stats:{power_bonus:2,atk_bonus:2}},
      'aero+ignis':               {n:2,name:'Blazing Speed',     rarity:'epic',      slot:'weapon',    stats:{power_bonus:2,speed_bonus:4}},
      'ignis+umbra':              {n:2,name:'Hellfire Pact',     rarity:'legendary', slot:'weapon',    stats:{power_bonus:6,atk_bonus:4}},
      'ignis+terra':              {n:2,name:'Molten Strike',     rarity:'rare',      slot:'weapon',    stats:{power_bonus:2,atk_bonus:3,guard_bonus:1}},
      'aqua+ignis':               {n:2,name:'Steam Burst',       rarity:'epic',      slot:'weapon',    stats:{power_bonus:2,control_bonus:2}},
      'ignis+lux':                {n:2,name:'Holy Flame',        rarity:'epic',      slot:'weapon',    stats:{power_bonus:2,insight_bonus:2,atk_bonus:2}},
      'aqua+aqua':                {n:2,name:'Flow State',        rarity:'rare',      slot:'weapon',    stats:{control_bonus:3,luck_bonus:2}},
      'aqua+lux':                 {n:2,name:'Sacred Tide',       rarity:'epic',      slot:'weapon',    stats:{control_bonus:2,insight_bonus:2}},
      'aero+aqua':                {n:2,name:'Current Shift',     rarity:'epic',      slot:'weapon',    stats:{control_bonus:3,speed_bonus:2}},
      'aqua+umbra':               {n:2,name:'Drowning Curse',    rarity:'legendary', slot:'weapon',    stats:{control_bonus:5,power_bonus:2}},
      'aqua+terra':               {n:2,name:'Deep Stability',    rarity:'rare',      slot:'weapon',    stats:{control_bonus:2,guard_bonus:2}},
      'aero+aero':                {n:2,name:'Wind Fury',         rarity:'rare',      slot:'weapon',    stats:{speed_bonus:4,luck_bonus:2}},
      'aero+umbra':               {n:2,name:'Phantom Strike',    rarity:'legendary', slot:'weapon',    stats:{speed_bonus:4,power_bonus:3}},
      'aero+lux':                 {n:2,name:'Light Speed',       rarity:'epic',      slot:'weapon',    stats:{speed_bonus:3,insight_bonus:2}},
      'umbra+umbra':              {n:2,name:'Abyss Core',        rarity:'epic',      slot:'weapon',    stats:{power_bonus:5,atk_bonus:3}},
      'lux+umbra':                {n:2,name:'Twilight Blade',    rarity:'legendary', slot:'weapon',    stats:{power_bonus:3,guard_bonus:2,insight_bonus:2}},
      'lux+lux':                  {n:2,name:'Radiant Edge',      rarity:'rare',      slot:'weapon',    stats:{insight_bonus:2,luck_bonus:2,guard_bonus:1}},
      'terra+umbra+weapon':       {n:2,name:'Grave Force',       rarity:'epic',      slot:'weapon',    stats:{power_bonus:4,atk_bonus:5}},

      // ══════════════════════════════════════════════════════
      // WEAPON RUNEWORDS — 3 rune
      // ══════════════════════════════════════════════════════
      'ignis+ignis+umbra':        {n:3,name:'Doom Flame',        rarity:'legendary', slot:'weapon',    stats:{power_bonus:5,atk_bonus:5}},
      'aero+ignis+ignis':         {n:3,name:'Doom Flame',        rarity:'legendary', slot:'weapon',    stats:{power_bonus:5,atk_bonus:5}},
      'aero+aero+ignis':          {n:3,name:'Inferno Rush',      rarity:'epic',      slot:'weapon',    stats:{power_bonus:3,speed_bonus:2,atk_bonus:2}},
      'aero+terra+umbra':         {n:3,name:'Shadow Cyclone',    rarity:'legendary', slot:'weapon',    stats:{speed_bonus:2,power_bonus:3,atk_bonus:3}},
      'aqua+aero+umbra':          {n:3,name:'Phantom Current',   rarity:'legendary', slot:'weapon',    stats:{control_bonus:4,speed_bonus:3,power_bonus:2}},
      'aqua+aqua+lux':            {n:3,name:'Ocean Blessing',    rarity:'epic',      slot:'weapon',    stats:{control_bonus:3,insight_bonus:2,luck_bonus:2}},
      'aero+aqua+lux':            {n:3,name:'Radiant Flow',      rarity:'epic',      slot:'weapon',    stats:{speed_bonus:2,control_bonus:2,insight_bonus:2}},
      'aqua+ignis+terra':         {n:3,name:'Steam Core',        rarity:'epic',      slot:'weapon',    stats:{power_bonus:2,control_bonus:2,guard_bonus:1,atk_bonus:2}},
      'ignis+terra+umbra':        {n:3,name:'Magma Curse',       rarity:'legendary', slot:'weapon',    stats:{power_bonus:3,atk_bonus:4}},
      'aqua+lux+umbra':           {n:3,name:'Void Purge',        rarity:'legendary', slot:'weapon',    stats:{control_bonus:3,power_bonus:2,insight_bonus:2}},
      'ignis+lux+terra':          {n:3,name:'Sacred Volcano',    rarity:'legendary', slot:'weapon',    stats:{guard_bonus:2,power_bonus:4,atk_bonus:3}},
      'aero+ignis+umbra':         {n:3,name:'Ash Reaper',        rarity:'epic',      slot:'weapon',    stats:{power_bonus:3,speed_bonus:2,atk_bonus:3}},
      'aero+aqua+ignis':          {n:3,name:'Superheated Storm', rarity:'epic',      slot:'weapon',    stats:{power_bonus:2,speed_bonus:3,control_bonus:2}},
      'lux+terra+umbra+weapon3':  {n:3,name:'Soul Rift',         rarity:'legendary', slot:'weapon',    stats:{power_bonus:4,insight_bonus:2,atk_bonus:3}},

      // ══════════════════════════════════════════════════════
      // WEAPON RUNEWORDS — 4 rune
      // ══════════════════════════════════════════════════════
      'ignis+ignis+umbra+umbra':  {n:4,name:'Hell Collapse',     rarity:'mythic',    slot:'weapon',    stats:{power_bonus:8,atk_bonus:6}},
      'aero+aero+ignis+ignis':    {n:4,name:'Storm Inferno',     rarity:'legendary', slot:'weapon',    stats:{speed_bonus:4,power_bonus:3,atk_bonus:3}},
      'aqua+aero+ignis+umbra':    {n:4,name:'Chaos Engine',      rarity:'mythic',    slot:'weapon',    stats:{power_bonus:6,speed_bonus:4,atk_bonus:4}},
      'aero+aqua+lux+terra':      {n:4,name:'Elemental Edge',    rarity:'legendary', slot:'weapon',    stats:{power_bonus:3,control_bonus:3,speed_bonus:2,guard_bonus:2}},
      'aero+ignis+terra+umbra':   {n:4,name:'Void Eruption',     rarity:'mythic',    slot:'weapon',    stats:{power_bonus:7,speed_bonus:3,atk_bonus:5}},

      // ══════════════════════════════════════════════════════
      // WEAPON RUNEWORDS — 5 rune
      // ══════════════════════════════════════════════════════
      'aero+aqua+ignis+terra+umbra':  {n:5,name:'Worldbreaker',  rarity:'mythic',    slot:'weapon',    stats:{power_bonus:8,speed_bonus:5,atk_bonus:7,guard_bonus:2}},
      'aero+aqua+ignis+lux+umbra':    {n:5,name:'Heaven Ender',  rarity:'mythic',    slot:'weapon',    stats:{power_bonus:7,speed_bonus:4,atk_bonus:6,insight_bonus:3}},

      // ══════════════════════════════════════════════════════
      // WEAPON RUNEWORDS — 6 rune
      // ══════════════════════════════════════════════════════
      'aero+aqua+ignis+lux+terra+umbra': {n:6,name:'Genesis Blade',rarity:'mythic',  slot:'weapon',    stats:{power_bonus:6,control_bonus:6,guard_bonus:6,speed_bonus:6,insight_bonus:6,luck_bonus:6,atk_bonus:8}},

      // ══════════════════════════════════════════════════════
      // ARMOR RUNEWORDS — 2 rune
      // ══════════════════════════════════════════════════════
      'terra+terra':              {n:2,name:'Stone Skin',         rarity:'rare',      slot:'armor',     stats:{guard_bonus:5,def_bonus:3}},
      'lux+terra':                {n:2,name:'Sanctuary',          rarity:'epic',      slot:'armor',     stats:{guard_bonus:3,insight_bonus:2,def_bonus:2}},
      'aqua+terra+armor':         {n:2,name:'Living Armor',       rarity:'rare',      slot:'armor',     stats:{guard_bonus:2,def_bonus:2}},
      'terra+umbra':              {n:2,name:'Grave Shell',        rarity:'epic',      slot:'armor',     stats:{guard_bonus:4,def_bonus:4}},
      'aero+terra':               {n:2,name:'Dust Guard',         rarity:'rare',      slot:'armor',     stats:{guard_bonus:2,speed_bonus:2,def_bonus:2}},
      'ignis+ignis+armor':        {n:2,name:'Flame Guard',        rarity:'uncommon',  slot:'armor',     stats:{guard_bonus:1,def_bonus:2}},
      'ignis+terra+armor':        {n:2,name:'Molten Shell',       rarity:'rare',      slot:'armor',     stats:{guard_bonus:2,power_bonus:1,def_bonus:3}},
      'aqua+ignis+armor':         {n:2,name:'Steam Armor',        rarity:'rare',      slot:'armor',     stats:{guard_bonus:2,def_bonus:3}},
      'aqua+aqua+armor':          {n:2,name:'Flow Armor',         rarity:'rare',      slot:'armor',     stats:{guard_bonus:2,control_bonus:2,def_bonus:2}},
      'aqua+lux+armor':           {n:2,name:'Healing Guard',      rarity:'epic',      slot:'armor',     stats:{guard_bonus:2,insight_bonus:1,def_bonus:2}},
      'aqua+umbra+armor':         {n:2,name:'Void Barrier',       rarity:'epic',      slot:'armor',     stats:{guard_bonus:3,control_bonus:2,def_bonus:2}},
      'aero+aero+armor':          {n:2,name:'Ghost Cloak',        rarity:'rare',      slot:'armor',     stats:{guard_bonus:1,speed_bonus:4,def_bonus:1}},
      'aero+aqua+armor':          {n:2,name:'Mist Form',          rarity:'epic',      slot:'armor',     stats:{guard_bonus:2,speed_bonus:3,control_bonus:1}},
      'aero+umbra+armor':         {n:2,name:'Shadow Veil',        rarity:'rare',      slot:'armor',     stats:{guard_bonus:1,speed_bonus:3,def_bonus:2}},
      'umbra+umbra+armor':        {n:2,name:'Grave Armor',        rarity:'epic',      slot:'armor',     stats:{guard_bonus:4,def_bonus:4}},
      'lux+umbra+armor':          {n:2,name:'Fallen Light',       rarity:'epic',      slot:'armor',     stats:{guard_bonus:2,insight_bonus:2,power_bonus:1}},
      'lux+lux+armor':            {n:2,name:'Divine Shell',       rarity:'epic',      slot:'armor',     stats:{guard_bonus:3,insight_bonus:3,luck_bonus:2}},
      'ignis+umbra+armor':        {n:2,name:'Hell Armor',         rarity:'epic',      slot:'armor',     stats:{guard_bonus:2,power_bonus:2,def_bonus:3}},

      // ══════════════════════════════════════════════════════
      // ARMOR RUNEWORDS — 3 rune
      // ══════════════════════════════════════════════════════
      'aero+lux+armor':           {n:3,name:"Heaven's Grace",     rarity:'epic',      slot:'armor',     stats:{guard_bonus:2,speed_bonus:3,def_bonus:1}},
      'ignis+lux+armor':          {n:3,name:'Phoenix Guard',      rarity:'legendary', slot:'armor',     stats:{guard_bonus:2,def_bonus:2,power_bonus:1}},
      'aqua+lux+terra+armor':     {n:3,name:'Eternal Guard',      rarity:'legendary', slot:'armor',     stats:{guard_bonus:6,def_bonus:4,insight_bonus:2}},
      'terra+terra+aqua+armor':   {n:3,name:'Deep Root',          rarity:'epic',      slot:'armor',     stats:{guard_bonus:4,def_bonus:3,control_bonus:2}},
      'aero+terra+umbra+armor':   {n:3,name:'Wraith Shell',       rarity:'legendary', slot:'armor',     stats:{guard_bonus:4,speed_bonus:2,def_bonus:3}},
      'ignis+terra+umbra+armor':  {n:3,name:'Magma Armor',        rarity:'legendary', slot:'armor',     stats:{guard_bonus:3,power_bonus:2,def_bonus:4}},
      'aero+ignis+lux+armor':     {n:3,name:'Celestial Flame',    rarity:'legendary', slot:'armor',     stats:{guard_bonus:2,power_bonus:2,speed_bonus:2,def_bonus:2}},
      'lux+umbra+lux+armor':      {n:3,name:'Fallen Angel',       rarity:'legendary', slot:'armor',     stats:{guard_bonus:4,power_bonus:3,def_bonus:3}},

      // ══════════════════════════════════════════════════════
      // ARMOR RUNEWORDS — 4 rune
      // ══════════════════════════════════════════════════════
      'aqua+lux+terra+umbra+armor':{n:4,name:'World Core',        rarity:'legendary', slot:'armor',     stats:{guard_bonus:8,def_bonus:6,control_bonus:2}},
      'aero+ignis+terra+umbra+armor':{n:4,name:'Titan Shell',     rarity:'mythic',    slot:'armor',     stats:{guard_bonus:6,def_bonus:5,power_bonus:3,speed_bonus:2}},

      // ══════════════════════════════════════════════════════
      // ARMOR RUNEWORDS — 5 rune
      // ══════════════════════════════════════════════════════
      'aero+aqua+lux+terra+umbra+armor':{n:5,name:'Celestial Aegis',rarity:'mythic',  slot:'armor',     stats:{guard_bonus:6,def_bonus:6,insight_bonus:4,luck_bonus:4}},

      // ══════════════════════════════════════════════════════
      // ARMOR RUNEWORDS — 6 rune
      // ══════════════════════════════════════════════════════
      'aero+aqua+ignis+lux+terra+umbra+armor':{n:6,name:'Genesis Armor',rarity:'mythic',slot:'armor',   stats:{guard_bonus:8,def_bonus:8,power_bonus:4,speed_bonus:4,insight_bonus:4,luck_bonus:4}},

      // ══════════════════════════════════════════════════════
      // UNIVERSAL RUNEWORDS (any slot)
      // ══════════════════════════════════════════════════════
      'lux+terra+uni':            {n:2,name:'Harmony',            rarity:'rare',      slot:'any',       stats:{power_bonus:1,control_bonus:1,guard_bonus:1,speed_bonus:1}},
      'aqua+ignis+uni':           {n:2,name:'Balance Break',      rarity:'epic',      slot:'any',       stats:{control_bonus:3,power_bonus:2}},
      'lux+umbra+uni':            {n:2,name:'Twilight Core',      rarity:'legendary', slot:'any',       stats:{power_bonus:3,guard_bonus:2,insight_bonus:2}},
      'aero+terra+uni':           {n:2,name:'Foundation Shift',   rarity:'rare',      slot:'any',       stats:{speed_bonus:2,guard_bonus:2}},
      'aqua+ignis+lux+uni':       {n:3,name:'Trinity Flow',       rarity:'epic',      slot:'any',       stats:{power_bonus:2,control_bonus:2,insight_bonus:2}},
      'lux+terra+umbra+uni':      {n:3,name:'Dark Balance',       rarity:'legendary', slot:'any',       stats:{power_bonus:3,guard_bonus:2,insight_bonus:2}},
      'aero+ignis+terra+uni':     {n:3,name:'Storm Forge',        rarity:'epic',      slot:'any',       stats:{speed_bonus:2,power_bonus:2,guard_bonus:1}},
      'aero+aqua+umbra+uni':      {n:3,name:'Phantom Tide',       rarity:'legendary', slot:'any',       stats:{speed_bonus:3,control_bonus:3,power_bonus:1}},
      'lux+lux+lux+uni':          {n:3,name:'Pure Divinity',      rarity:'mythic',    slot:'any',       stats:{insight_bonus:5,guard_bonus:4,luck_bonus:5}},
      'aero+aqua+ignis+lux+terra+umbra+uni':{n:6,name:'Genesis',  rarity:'mythic',    slot:'any',       stats:{power_bonus:5,control_bonus:5,guard_bonus:5,speed_bonus:5,insight_bonus:5,luck_bonus:5}},

      // ══════════════════════════════════════════════════════
      // ACCESSORY RUNEWORDS
      // ══════════════════════════════════════════════════════
      'lux+lux+acc':              {n:2,name:'Blessing Loop',      rarity:'rare',      slot:'accessory', stats:{luck_bonus:3,insight_bonus:2}},
      'umbra+umbra+acc':          {n:2,name:'Curse Loop',         rarity:'epic',      slot:'accessory', stats:{power_bonus:4,luck_bonus:1}},
      'aero+ignis+acc':           {n:2,name:'Flash Burn',         rarity:'uncommon',  slot:'accessory', stats:{speed_bonus:2,power_bonus:1}},
      'aqua+lux+acc':             {n:2,name:'Pure Flow',          rarity:'rare',      slot:'accessory', stats:{control_bonus:2,insight_bonus:1}},
      'lux+terra+acc':            {n:2,name:'Stone Heart',        rarity:'rare',      slot:'accessory', stats:{guard_bonus:2,insight_bonus:1}},
      'aero+aqua+acc':            {n:2,name:'Slipstream',         rarity:'uncommon',  slot:'accessory', stats:{speed_bonus:2,control_bonus:1}},
      'ignis+umbra+acc':          {n:2,name:'Hell Ring',          rarity:'epic',      slot:'accessory', stats:{power_bonus:3,atk_bonus:2}},
      'aqua+umbra+acc':           {n:2,name:'Dark Flow',          rarity:'epic',      slot:'accessory', stats:{control_bonus:2,power_bonus:1}},
      'aero+terra+acc':           {n:2,name:'Dust Band',          rarity:'uncommon',  slot:'accessory', stats:{speed_bonus:2,guard_bonus:1}},
      'lux+umbra+acc':            {n:2,name:'Twilight Loop',      rarity:'rare',      slot:'accessory', stats:{insight_bonus:2,power_bonus:1,guard_bonus:1}},
    }
    function findRuneword(runes, slot, socketsTotal) {
      const count = runes.length
      const key   = [...runes].sort().join('+')

      // Runeword only triggers when:
      // 1. The rune combo matches exactly
      // 2. The runeword requires exactly this many runes
      // 3. The item has exactly this many sockets total (no partial fills on larger items)
      if (RUNEWORDS[key] && RUNEWORDS[key].n === count && count === socketsTotal) return RUNEWORDS[key]

      // Try with slot suffix (armor/uni) — suffix adds to key but not rune count
      const suffixes = ['uni', slot==='accessory'?'acc':null, slot==='armor'?'armor':null].filter(Boolean)
      for (const s of suffixes) {
        const k2 = [...runes, s].sort().join('+')
        if (RUNEWORDS[k2] && RUNEWORDS[k2].n === count && count === socketsTotal) return RUNEWORDS[k2]
      }
      return null
    }

    // ── Open inline rune picker ──────────────────────
    window.openRunePicker = async function(itemId, itemType) {
      const pickerId = 'rune-picker-' + itemId
      const picker   = document.getElementById(pickerId)
      if (!picker) return

      // Toggle
      if (picker.style.display !== 'none') { picker.style.display = 'none'; return }
      picker.style.display = 'block'
      picker.innerHTML = '<p style="font-family:\'Share Tech Mono\',monospace;font-size:.58rem;color:var(--ink-dim)">Loading runes…</p>'

      // Load runes from inventory
      const { data: runeItems } = await supabase.from('inventory')
        .select('*').eq('player_id', player.id).like('item_key','rune_%').gt('quantity',0)

      if (!runeItems || !runeItems.length) {
        picker.innerHTML = '<p style="font-family:\'IM Fell English\',serif;font-style:italic;font-size:.8rem;color:var(--ink-dim)">No runes in inventory.<br>Farm enemies to find runes.</p>'
        return
      }

      const RUNE_COLORS = {ignis:'#ff5500',aqua:'#0088ff',terra:'#8b5e3c',aero:'#a8d8ea',umbra:'#b06eff',lux:'#ffd700',venin:'#4caf50',ferro:'#90a4ae',flora:'#66bb6a',volt:'#ffee58'}
      const RUNE_ICONS  = {ignis:'🔥',aqua:'💧',terra:'🪨',aero:'💨',umbra:'🌑',lux:'✨',venin:'☠️',ferro:'⚙️',flora:'🌿',volt:'⚡'}
      const RUNE_NAMES  = {ignis:'Ignis',aqua:'Aqua',terra:'Terra',aero:'Aero',umbra:'Umbra',lux:'Lux',venin:'Venin',ferro:'Ferro',flora:'Flora',volt:'Volt'}

      picker.innerHTML = `
        <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:#a07de0;letter-spacing:.07em;margin-bottom:5px">SELECT RUNE TO SOCKET</p>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          ${runeItems.map(r => {
            const key   = r.item_key.replace('rune_','')
            const color = RUNE_COLORS[key] || '#888'
            const icon  = RUNE_ICONS[key]  || '◈'
            const name  = RUNE_NAMES[key]  || key
            return `<button onclick="socketRuneToItem('${itemId}','${r.id}','${key}','${itemType}')"
              style="display:flex;align-items:center;gap:4px;background:${color}18;border:1px solid ${color}60;border-radius:4px;padding:4px 8px;cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:.6rem;color:${color}">
              <img src="../assets/runes/rune_${key}.png" style="width:16px;height:16px;object-fit:contain;border-radius:2px" onerror="this.outerHTML='<span>${icon}</span>'">
              <span>${name}</span><span style="color:var(--ink-dim);font-size:.5rem">×${r.quantity}</span>
            </button>`
          }).join('')}
        </div>
      `
    }

    // ── Socket a rune into an item ───────────────────
    window.socketRuneToItem = async function(itemId, runeInventoryId, runeKey, itemType) {
      const item = items.find(i => i.id === itemId)
      if (!item) return

      const sockets = item.sockets_total || 0
      const used    = item.sockets_used  || 0
      if (used >= sockets) { window.showToast('All sockets filled', true); return }

      const newRunes  = [...(item.socketed_runes||[]), runeKey]
      const newUsed   = used + 1

      // Check for runeword — only triggers if rune count fills ALL sockets exactly
      const slot = itemType === 'armor' ? 'armor' : itemType === 'weapon' ? 'weapon' : 'accessory'
      const rw   = findRuneword(newRunes, slot, sockets)

      // Build stat updates from runeword
      const statUpdates = {}
      if (rw) Object.entries(rw.stats).forEach(([k,v]) => { statUpdates[k] = (item[k]||0) + v })

      await supabase.from('inventory').update({
        socketed_runes:  newRunes,
        sockets_used:    newUsed,
        runeword_name:   rw ? rw.name   : (item.runeword_name  || null),
        runeword_effect: rw ? rw.effect : (item.runeword_effect || null),
        ...statUpdates,
      }).eq('id', itemId)

      // Consume the rune
      const runeItem = items.find(i => i.id === runeInventoryId)
      if (runeItem) {
        if ((runeItem.quantity||1) <= 1) {
          await supabase.from('inventory').delete().eq('id', runeInventoryId)
        } else {
          await supabase.from('inventory').update({ quantity: runeItem.quantity - 1 }).eq('id', runeInventoryId)
        }
      }

      if (rw) window.showToast('✦ Runeword activated: ' + rw.name + '!')
      else    window.showToast('Rune socketed — ' + newRunes.length + '/' + sockets + ' filled')

      selectedId = itemId
      await load()

      // Refresh the equipped modal so it shows updated sockets (keep it open)
      const updatedItem = items.find(i => i.id === itemId)
      if (updatedItem) {
        document.getElementById('equipped-modal')?.remove()
        showEquippedModal(updatedItem)
        // Re-open rune picker inline if sockets still available and no runeword triggered
        if (newUsed < sockets && !rw) {
          setTimeout(() => openRunePickerModal(itemId, itemType), 100)
        }
      }
    }

    // ── Remove all runes from an item ───────────────
    window.removeRunes = async function(itemId) {
      const item = items.find(i => i.id === itemId)
      if (!item || !(item.sockets_used > 0)) return

      // Refund runes to inventory
      for (const runeKey of (item.socketed_runes||[])) {
        const runeItemKey = 'rune_' + runeKey
        const { data: ex } = await supabase.from('inventory').select('*')
          .eq('player_id', player.id).eq('item_key', runeItemKey).maybeSingle()
        if (ex) {
          await supabase.from('inventory').update({ quantity: ex.quantity + 1 }).eq('id', ex.id)
        } else {
          const { data: m } = await supabase.from('items').select('*').eq('item_key', runeItemKey).single()
          if (m) await supabase.from('inventory').insert({
            player_id:player.id, item_key:runeItemKey, name:m.name,
            item_type:'material', rarity:m.rarity, icon:m.icon,
            element:m.element, quantity:1
          })
        }
      }

      // Clear rune stats (reset bonus stats)
      await supabase.from('inventory').update({
        socketed_runes:[], sockets_used:0,
        runeword_name:null, runeword_effect:null,
        power_bonus:0, control_bonus:0, guard_bonus:0,
        speed_bonus:0, insight_bonus:0, luck_bonus:0,
      }).eq('id', itemId)

      window.showToast('Runes removed — returned to inventory')
      selectedId = itemId
      await load()
    }

    window.sellItem = async (itemId, itemName, sellPrice, qty) => {
      const newQty = (qty || 1) - 1
      if (newQty <= 0) {
        await supabase.from('inventory').delete().eq('id', itemId)
      } else {
        await supabase.from('inventory').update({ quantity: newQty }).eq('id', itemId)
      }
      const newGold = (player.gold || 0) + sellPrice
      await supabase.from('players').update({ gold: newGold }).eq('id', player.id)
      player.gold = newGold
      window.showToast('Sold ' + itemName + ' for ◈' + sellPrice)
      selectedId = null
      await load()
    }

    window.sellItemAll = async (itemId, itemName, priceEach, qty) => {
      // Always delete the entire row
      await supabase.from('inventory').delete().eq('id', itemId)
      const total   = priceEach * (qty || 1)
      const newGold = (player.gold || 0) + total
      await supabase.from('players').update({ gold: newGold }).eq('id', player.id)
      player.gold = newGold
      window.showToast('Sold ' + (qty||1) + '× ' + itemName + ' for ◈' + total)
      selectedId = null
      await load()
    }

    window.useItem = async (itemId) => {
      const item = items.find(i=>i.id===itemId)
      if (!item || item.item_type !== 'consumable') return

      // ── Fetch current player HP from DB (always fresh) ──
      const { data: freshPlayer } = await supabase
        .from('players').select('hp,max_hp').eq('id', player.id).single()

      const currentHp = freshPlayer?.hp    || 100
      const maxHp     = freshPlayer?.max_hp || 100

      if (item.hp_restore > 0) {
        const newHp = Math.min(maxHp, currentHp + item.hp_restore)
        const healed = newHp - currentHp
        // Save to DB
        await supabase.from('players').update({ hp: newHp }).eq('id', player.id)
        window.showToast('+' + healed + ' HP restored (' + newHp + '/' + maxHp + ')')
      } else if (item.special_effect) {
        window.showToast(item.name + ' used — ' + item.special_effect)
      } else {
        window.showToast(item.name + ' used')
      }

      // Consume item
      const newQty = (item.quantity || 1) - 1
      if (newQty <= 0) {
        await supabase.from('inventory').delete().eq('id', itemId)
      } else {
        await supabase.from('inventory').update({ quantity: newQty }).eq('id', itemId)
      }

      selectedId = null
      await load()
    }

    // Filter tabs
    document.getElementById('filter-tabs').innerHTML = FILTERS.map(f => `
      <button onclick="setFilter('${f}')" id="ftab-${f}" style="font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.07em;background:none;border:.5px solid rgba(139,106,32,.2);border-radius:20px;padding:2px 9px;cursor:pointer;color:var(--ink-dim);transition:all .15s">${f}</button>
    `).join('')

    window.setFilter = (f) => {
      filter = f
      FILTERS.forEach(x => {
        const t = document.getElementById('ftab-'+x)
        t.style.background   = x===f ? 'rgba(139,106,32,.15)' : 'none'
        t.style.borderColor  = x===f ? 'rgba(139,106,32,.6)'  : 'rgba(139,106,32,.2)'
        t.style.color        = x===f ? '#1a1208' : '#3a2008'
      })
      renderGrid()
    }

    await load()

  return { player, cleanup() {} }
}

export default mountInventory
