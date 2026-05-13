import { supabase } from '../supabase.js'

const MODULE_STYLE_ID = 'book-module-style-crafting'
const MODULE_MARKUP = "<div class=\"book-wrap\">\n  \n\n  <div class=\"craft-grid book\">\n    <!-- Left: item selector -->\n    <div class=\"page-left parchment\">\n      <div class=\"page-inner\">\n        <p class=\"chapter-label\">Crafting Table</p>\n        <h1 class=\"page-title\">Socket Runes</h1>\n        <p style=\"font-family:'IM Fell English',serif;font-style:italic;font-size:.82rem;color:#7a6435;margin-bottom:.5rem\">\n          Socket runes dropped from combat into your gear. Matching combinations form powerful Runewords.\n        </p>\n        <hr class=\"ink-divider\">\n\n        <!-- Filter tabs -->\n        <div style=\"display:flex;gap:4px;margin-bottom:.75rem;flex-wrap:wrap\" id=\"filter-tabs\">\n          <button onclick=\"setFilter('all')\"       id=\"ft-all\"       style=\"font-family:'Share Tech Mono',monospace;font-size:.6rem;border:.5px solid rgba(139,106,32,.3);background:rgba(139,106,32,.15);border-radius:20px;padding:2px 9px;cursor:pointer;color:#1a1208\">all</button>\n          <button onclick=\"setFilter('weapon')\"    id=\"ft-weapon\"    style=\"font-family:'Share Tech Mono',monospace;font-size:.6rem;border:.5px solid rgba(139,106,32,.2);background:none;border-radius:20px;padding:2px 9px;cursor:pointer;color:#7a6435\">weapon</button>\n          <button onclick=\"setFilter('armor')\"     id=\"ft-armor\"     style=\"font-family:'Share Tech Mono',monospace;font-size:.6rem;border:.5px solid rgba(139,106,32,.2);background:none;border-radius:20px;padding:2px 9px;cursor:pointer;color:#7a6435\">armor</button>\n          <button onclick=\"setFilter('accessory')\" id=\"ft-accessory\" style=\"font-family:'Share Tech Mono',monospace;font-size:.6rem;border:.5px solid rgba(139,106,32,.2);background:none;border-radius:20px;padding:2px 9px;cursor:pointer;color:#7a6435\">accessory</button>\n        </div>\n\n        <!-- Item list -->\n        <div id=\"item-list\" style=\"max-height:420px;overflow-y:auto;scrollbar-width:thin\"></div>\n      </div>\n    </div>\n\n    \n    <!-- Right: socketing UI -->\n    <div class=\"page-right parchment\">\n      <div class=\"page-inner\">\n        <div id=\"socket-panel\">\n          <p style=\"font-family:'IM Fell English',serif;font-style:italic;color:#7a6435;margin-top:2rem;text-align:center\">\n            \u2190 Select an item to begin socketing\n          </p>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>"
const MODULE_STYLES = "\n    /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n       SUPERSEDE DARK THEME \u2014 Gold / Amber accent\n       Injected over main.css \u2014 no JS touched.\n    \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n        :root {\n      --bg-0:      #14110f;\n      --bg-1:      #2b1d16;\n      --panel:     #f4ead7;\n      --page-l:    #f4ead7;\n      --page-r:    #f1e4cf;\n      --ink:       #2b1d16;\n      --ink-dim:   #5c4638;\n      --ink-faint: #a08060;\n      --ice:       #7a5230;\n      --ice-hot:   #4b2e14;\n      --gold:      #c8a050;\n      --gold-hot:  #e0c070;\n      --gold-dim:  #a08040;\n      --amber:     #d09040;\n      --amber-hot: #e0a050;\n      --warn:      #e06050;\n      --line:      rgba(200,160,80,.30);\n      --green:     #5cae50;\n      --purple:    #8a50c0;\n      --spine-col: #2b1d16;\n    }\n    *, *::before, *::after { box-sizing:border-box; }\n        html, body {\n      background: radial-gradient(ellipse at 50% 0%, #2a1a0e 0%, #14110f 55%, #0d0b09 100%) !important;\n      color: var(--ink) !important;\n      font-family: 'Cormorant Garamond', Georgia, serif !important;\n      min-height: 100vh;\n      overflow-x: hidden;\n    }\n    body::after {\n      content: \"\"; position: fixed; inset: 0; pointer-events: none; z-index: 9998;\n      background: radial-gradient(ellipse 900px 900px at 50% 40%, rgba(180,120,60,.07) 0%, transparent 70%);\n    }\n        /* \u2500\u2500 BOOK \u2014 parchment open-book \u2500\u2500 */\n    .book, .craft-grid {\n      display: grid !important;\n      grid-template-columns: 1fr 1fr !important;\n      align-items: stretch !important;\n      gap: 0 !important;\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      box-shadow: none !important;\n      border-radius: 24px !important;\n      filter: drop-shadow(0 24px 60px rgba(0,0,0,.75)) drop-shadow(0 8px 20px rgba(0,0,0,.5)) !important;\n      transform: perspective(1600px) rotateX(2.5deg) !important;\n      transform-origin: 50% 0 !important;\n      margin-top: 10px !important;\n      overflow: hidden !important;\n    }\n    @media(max-width:860px){\n      .book, .craft-grid { grid-template-columns:1fr !important; transform:none !important; border-radius:12px !important; }\n    }\n    /* \u2500\u2500 PAGES \u2500\u2500 */\n    .parchment, .page-left, .page-right {\n      background: var(--panel) !important;\n      border: none !important;\n      border-radius: 0 !important;\n      box-shadow: none !important;\n      color: var(--ink) !important;\n      position: relative;\n      overflow-y: auto; overflow-x: hidden;\n    }\n    .page-left  { background: var(--page-l) !important; border-right: none !important; }\n    .page-right { background: var(--page-r) !important; border-left:  none !important; }\n    /* dot-texture grain */\n    .page-left::before, .page-right::before {\n      content: \"\" !important; position: absolute !important; inset: 0 !important;\n      pointer-events: none !important; z-index: 0 !important; opacity: .08 !important;\n      background-image: radial-gradient(circle, rgba(0,0,0,.25) 1px, transparent 1px) !important;\n      background-size: 12px 12px !important;\n    }\n    /* spine-edge shadows */\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    /* corner brackets */\n    .page-inner { padding: 28px 30px !important; position: relative; }\n    .page-inner::before {\n      content: \"\" !important; position: absolute !important;\n      top: 14px !important; left: 14px !important; width: 28px !important; height: 28px !important;\n      border-left: 1.5px solid rgba(138,91,68,.45) !important;\n      border-top: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-inner::after {\n      content: \"\" !important; position: absolute !important;\n      bottom: 14px !important; right: 14px !important; width: 28px !important; height: 28px !important;\n      border-right: 1.5px solid rgba(138,91,68,.45) !important;\n      border-bottom: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    /* \u2500\u2500 SPINE \u2500\u2500 */\n    .spine {\n      background: linear-gradient(180deg, #14120a 0%, #0e0c06 50%, #14120a 100%) !important;\n      border-left:  1px solid #2a2412 !important;\n      border-right: 1px solid #2a2412 !important;\n      position: relative; z-index: 5; width: 20px !important;\n      box-shadow: inset 2px 0 5px rgba(0,0,0,.5), inset -2px 0 5px rgba(0,0,0,.5) !important;\n    }\n    .spine::before {\n      content:\"\"; position:absolute; top:0; left:50%; width:1px; height:100%;\n      background:linear-gradient(180deg,transparent,rgba(200,168,74,.12) 30%,rgba(200,168,74,.12) 70%,transparent);\n    }\n    /* \u2500\u2500 TYPOGRAPHY \u2500\u2500 */\n    .chapter-label, .page-label {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 9.5px !important; letter-spacing: .42em !important;\n      text-transform: uppercase !important;\n      color: var(--gold) !important; margin-bottom: 5px !important;\n    }\n    .page-title, h1.page-title, h2.page-title {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 22px !important; font-weight: 500 !important;\n      letter-spacing: .04em !important; color: var(--ink) !important;\n      margin-bottom: 14px !important;\n    }\n    .ink-divider, hr.ink-divider {\n      border: none !important; border-top: 1px solid var(--line) !important;\n      margin: 12px 0 !important; opacity: 1 !important;\n    }\n    /* body text */\n    p, li, span { color: var(--ink) !important; }\n    /* \u2500\u2500 INLINE COLOURS \u2014 remap parchment browns to gold tones \u2500\u2500 */\n    [style*=\"color:#1a1208\"] { color: var(--ink) !important; }\n    [style*=\"color:#3a2008\"] { color: var(--ink-dim) !important; }\n    [style*=\"color:#7a6435\"] { color: var(--gold-dim) !important; }\n    [style*=\"color:#9a8050\"] { color: var(--gold-dim) !important; }\n    [style*=\"color:#c8b96e\"] { color: var(--gold) !important; }\n    [style*=\"background:rgba(200,184,128\"] { background: rgba(200,168,74,.08) !important; }\n    [style*=\"border-color:rgba(139,106,32\"] { border-color: rgba(200,168,74,.25) !important; }\n    /* \u2500\u2500 BUTTONS / CHOICES \u2500\u2500 */\n    button:not(.bm-signout), .choice, .combat-btn {\n      background: transparent !important;\n      border: 1px solid var(--line) !important;\n      border-radius: 0 !important;\n      color: var(--ink) !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 10px !important; letter-spacing: .08em !important;\n      cursor: pointer !important;\n      transition: border-color .2s, color .2s, background .2s !important;\n    }\n    button:hover, .choice:hover, .combat-btn:hover:not(:disabled) {\n      border-color: var(--gold) !important;\n      color: var(--gold) !important;\n      background: rgba(200,168,74,.05) !important;\n    }\n    /* \u2500\u2500 STAT BARS \u2500\u2500 */\n    .stat-bar-wrap { background: rgba(255,255,255,.06) !important; border-radius:0 !important; }\n    .stat-key { color: var(--ink-dim) !important; font-family:'JetBrains Mono',monospace !important; font-size:.58rem !important; letter-spacing:.08em !important; }\n    .stat-val { color: var(--ink) !important; }\n    /* \u2500\u2500 MODALS / OVERLAYS \u2500\u2500 */\n    [id$=\"-window\"] > div, .end-box {\n      background: var(--panel) !important;\n      border: 1px solid var(--line) !important;\n      border-radius: 0 !important;\n    }\n    /* \u2500\u2500 SCROLLBAR \u2500\u2500 */\n    ::-webkit-scrollbar{width:5px}\n    ::-webkit-scrollbar-track{background:var(--bg-0)}\n    ::-webkit-scrollbar-thumb{background:var(--line)}\n    ::-webkit-scrollbar-thumb:hover{background:var(--gold-dim)}\n    /* \u2500\u2500 ANIMATE-IN \u2500\u2500 */\n    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}\n    .animate-in{animation:fadeIn .4s ease forwards}\n      /* \u2500\u2500 Book wrap \u2500\u2500 */\n    .book-wrap, .craft-grid-wrap {\n      background: transparent !important;\n      max-width: 1060px;\n      margin: 0 auto;\n      padding: 24px 24px 60px;\n    }\n    /* \u2500\u2500 Book \u2500\u2500 */\n    .book, .craft-grid {\n      display: grid !important;\n      grid-template-columns: 1fr 1fr !important;\n      align-items: stretch !important;\n      gap: 0 !important;\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      box-shadow: none !important;\n      border-radius: 24px !important;\n      filter: drop-shadow(0 24px 60px rgba(0,0,0,.75)) drop-shadow(0 8px 20px rgba(0,0,0,.5)) !important;\n      transform: perspective(1600px) rotateX(2.5deg) !important;\n      transform-origin: 50% 0 !important;\n      margin-top: 10px !important;\n      overflow: hidden !important;\n    }\n    @media(max-width:860px) {\n      .book, .craft-grid { grid-template-columns: 1fr !important; transform: none !important; border-radius: 12px !important; }\n    }\n    /* \u2500\u2500 Pages \u2500\u2500 */\n    .parchment, .page-left, .page-right {\n      background: var(--panel) !important;\n      border: none !important;\n      border-radius: 0 !important;\n      box-shadow: none !important;\n      color: var(--ink) !important;\n      position: relative;\n      overflow-y: auto; overflow-x: hidden;\n    }\n    .page-left::before, .page-right::before {\n      content: \"\" !important; position: absolute !important; inset: 0 !important;\n      pointer-events: none !important; z-index: 0 !important; opacity: .08 !important;\n      background-image: radial-gradient(circle, rgba(0,0,0,.25) 1px, transparent 1px) !important;\n      background-size: 12px 12px !important;\n    }\n    .page-left  { border-right: none !important; background: var(--page-l) !important; }\n    .page-right { border-left:  none !important; background: var(--page-r) !important; }\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-inner { padding: 28px 30px !important; position: relative; }\n    .page-inner::before {\n      content: \"\" !important; position: absolute !important;\n      top: 14px !important; left: 14px !important; width: 28px !important; height: 28px !important;\n      border-left: 1.5px solid rgba(138,91,68,.45) !important;\n      border-top: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-inner::after {\n      content: \"\" !important; position: absolute !important;\n      bottom: 14px !important; right: 14px !important; width: 28px !important; height: 28px !important;\n      border-right: 1.5px solid rgba(138,91,68,.45) !important;\n      border-bottom: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    /* \u2500\u2500 Spine \u2500\u2500 */\n    .spine {\n      background: linear-gradient(90deg,\n        rgba(0,0,0,.0) 0%, rgba(0,0,0,.20) 28%, rgba(0,0,0,.40) 46%,\n        rgba(0,0,0,.50) 50%, rgba(0,0,0,.40) 54%, rgba(0,0,0,.20) 72%, rgba(0,0,0,.0) 100%\n      ) !important;\n      border: none !important; position: relative; z-index: 5;\n      width: 22px !important; min-width: 22px !important;\n      margin: 0 !important; overflow: visible; box-shadow: none !important;\n    }\n    .spine::before {\n      content: \"\"; position: absolute; top: 0; bottom: 0; left: 50%; width: 1px;\n      transform: translateX(-50%);\n      background: linear-gradient(180deg, transparent 0%, rgba(43,29,22,.9) 8%, rgba(43,29,22,.9) 92%, transparent 100%);\n      z-index: 2;\n    }\n    .spine-inner, .spine-highlight, .spine-shadow,\n    .spine-title, .spine-rule, .spine-diamond, .spine-chapter { display: none !important; }\n    /* \u2500\u2500 Text & UI colours \u2500\u2500 */\n    h1, h2, h3, h4, h5, h6 { color: var(--ink) !important; }\n    .book p, .book li, .book span, .book label,\n    .book-wrap p, .book-wrap li, .book-wrap span, .book-wrap label { color: var(--ink) !important; }\n    button:not(.bm-signout), .btn { background: rgba(43,29,22,.08); border: 1px solid rgba(138,91,68,.35); color: var(--ink); border-radius: 0; cursor: pointer; transition: border-color .2s, color .2s; }\n    button:hover, .btn:hover { border-color: var(--gold) !important; color: var(--gold) !important; }\n    input, select, textarea { background: rgba(43,29,22,.06) !important; border: 1px solid rgba(138,91,68,.35) !important; color: var(--ink) !important; border-radius: 0 !important; }\n    ::-webkit-scrollbar { width: 5px; }\n    ::-webkit-scrollbar-track { background: rgba(43,29,22,.15); }\n    ::-webkit-scrollbar-thumb { background: rgba(138,91,68,.35); }\n    ::-webkit-scrollbar-thumb:hover { background: var(--gold-dim); }\n  \n    @media (max-width: 800px) {\n      .book, .book-body, .craft-grid { flex-direction: column !important; min-height: auto; }\n      .page-left, .page-right { width: 100% !important; padding: 20px 16px !important; }\n      .book-wrap, .craft-grid-wrap { padding: 8px 12px 40px !important; }\n    }\n  "

function installModuleStyle() {
  document.querySelectorAll('style[data-book-module-style]').forEach(el => el.remove())
  const style = document.createElement('style')
  style.id = MODULE_STYLE_ID
  style.dataset.bookModuleStyle = 'true'
  style.textContent = MODULE_STYLES
  document.head.appendChild(style)
}

export async function mountCrafting(__mountOptions = {}) {
  const host = __mountOptions.host || document.getElementById('book-module-host') || document.body
  installModuleStyle()
  host.innerHTML = MODULE_MARKUP

  const player = __mountOptions.player || await window.renderNav(__mountOptions.navId || 'nav')


  const ITEM_IMAGES = {
    'ember_blade':'../assets/weapon/fire/ember_blade.png','flame_dagger':'../assets/weapon/fire/flame_dagger.png',
    'inferno_sword':'../assets/weapon/fire/inferno_sword.png','burning_staff':'../assets/weapon/fire/burning_staff.png',
    'ashen_tome':'../assets/weapon/fire/ashen_tome.png','lava_gauntlets':'../assets/weapon/fire/lava_gauntlets.png',
    'tide_blade':'../assets/weapon/water/tide_blade.png','ocean_staff':'../assets/weapon/water/ocean_staff.png',
    'flow_dagger':'../assets/weapon/water/flow_dagger.png','deep_tome':'../assets/weapon/water/deep_tome.png',
    'current_gauntlets':'../assets/weapon/water/current_gauntlets.png',
    'stone_sword':'../assets/weapon/earth/stone_sword.png','root_blade':'../assets/weapon/earth/root_blade.png',
    'titan_hammer':'../assets/weapon/earth/titan_hammer.png','crystal_staff':'../assets/weapon/earth/crystal_staff.png',
    'boulder_gauntlets':'../assets/weapon/earth/boulder_gauntlets.png',
    'wind_dagger':'../assets/weapon/air/wind_dagger.png','gale_blade':'../assets/weapon/air/gale_blade.png',
    'storm_sword':'../assets/weapon/air/storm_sword.png','sky_staff':'../assets/weapon/air/sky_staff.png',
    'swift_gauntlets':'../assets/weapon/air/swift_gauntlets.png',
    'shadow_blade':'../assets/weapon/dark/shadow_blade.png','void_dagger':'../assets/weapon/dark/void_dagger.png',
    'curse_sword':'../assets/weapon/dark/curse_sword.png','nightmare_staff':'../assets/weapon/dark/nightmare_staff.png',
    'abyss_gauntlets':'../assets/weapon/dark/abyss_gauntlets.png',
    'radiant_blade':'../assets/weapon/light/radiant_blade.png','halo_staff':'../assets/weapon/light/halo_staff.png',
    'dawn_sword':'../assets/weapon/light/dawn_sword.png','blessing_tome':'../assets/weapon/light/blessing_tome.png',
    'light_gauntlets':'../assets/weapon/light/light_gauntlets.png',
    'cinder_armor':'../assets/armor/cinder_armor.png','inferno_cloak':'../assets/armor/inferno_cloak.png',
    'blazing_robes':'../assets/armor/blazing_robes.png','smoke_veil':'../assets/armor/smoke_veil.png',
    'mist_cloak':'../assets/armor/mist_cloak.png','ocean_armor':'../assets/armor/ocean_armor.png',
    'rain_robes':'../assets/armor/rain_robes.png','tide_shield':'../assets/armor/tide_shield.png',
    'rock_armor':'../assets/armor/rock_armor.png','root_cloak':'../assets/armor/root_cloak.png',
    'terra_plate':'../assets/armor/terra_plate.png','crystal_shell':'../assets/armor/crystal_shell.png',
    'feather_cloak':'../assets/armor/feather_cloak.png','storm_armor':'../assets/armor/storm_armor.png',
    'cloud_robes':'../assets/armor/cloud_robes.png','wind_veil':'../assets/armor/wind_veil.png',
    'shadow_cloak':'../assets/armor/shadow_cloak.png','void_armor':'../assets/armor/void_armor.png',
    'nightmare_robes':'../assets/armor/nightmare_robes.png','curse_shell':'../assets/armor/curse_shell.png',
    'holy_armor':'../assets/armor/holy_armor.png','blessing_cloak':'../assets/armor/blessing_cloak.png',
    'radiant_robes':'../assets/armor/radiant_robes.png','halo_shield':'../assets/armor/halo_shield.png',
    'rune_ignis':'../assets/runes/rune_ignis.png','rune_aqua':'../assets/runes/rune_aqua.png',
    'rune_terra':'../assets/runes/rune_terra.png','rune_aero':'../assets/runes/rune_aero.png',
    'rune_umbra':'../assets/runes/rune_umbra.png','rune_lux':'../assets/runes/rune_lux.png',
    'rune_venin':'../assets/runes/rune_venin.png','rune_ferro':'../assets/runes/rune_ferro.png',
    'rune_flora':'../assets/runes/rune_flora.png','rune_volt':'../assets/runes/rune_volt.png',
    // Watcher Set
    'watcher_eye_ring':'../assets/sets/watcher_eye_ring.png',
    'watcher_band':    '../assets/sets/watcher_band.png',
    'watcher_cloak':   '../assets/sets/watcher_cloak.png',
    'watcher_crown':   '../assets/sets/watcher_crown.png',
  }
  function getItemImg(k) { return ITEM_IMAGES[k] || null }


  // ── Import runeword data inline ───────────────────
  const RUNE_ELEMENTS = {
    ignis: { name:'Ignis Rune', label:'Fire',      icon:'🔥', color:'#ff5500' },
    aqua:  { name:'Aqua Rune',  label:'Water',     icon:'💧', color:'#0088ff' },
    terra: { name:'Terra Rune', label:'Earth',     icon:'🪨', color:'#8b5e3c' },
    aero:  { name:'Aero Rune',  label:'Air',       icon:'💨', color:'#a8d8ea' },
    umbra: { name:'Umbra Rune', label:'Dark',      icon:'🌑', color:'#b06eff' },
    lux:   { name:'Lux Rune',   label:'Light',     icon:'✨', color:'#ffd700' },
    venin: { name:'Venin Rune', label:'Poison',    icon:'☠️', color:'#44cc44' },
    ferro: { name:'Ferro Rune', label:'Metal',     icon:'⚙️', color:'#a0a8b8' },
    flora: { name:'Flora Rune', label:'Plant',     icon:'🌿', color:'#22aa55' },
    volt:  { name:'Volt Rune',  label:'Lightning', icon:'⚡', color:'#ffe033' },
  }

  const SOCKET_RULES = {
    common:   {max:1}, uncommon:{max:2}, rare:{max:3},
    epic:     {max:4}, legendary:{max:5},mythic:{max:6},
  }

  const RARITY_COLORS = { common:'#888',uncommon:'#5ec45e',rare:'#5eaee0',epic:'#a07de0',legendary:'#c8b96e',mythic:'#ff88ff' }

  // All runewords — key is sorted rune array joined by +
  // Slot: 'weapon' | 'armor' | 'accessory' | 'any'
  // Runes: ignis🔥 aqua💧 terra🪨 aero💨 umbra🌑 lux✨ venin☠️ ferro⚙️ flora🌿 volt⚡
  const RUNEWORDS = {

    // ══════════════════════════════════════════════
    // ⚔️ WEAPONS — 2-rune
    // ══════════════════════════════════════════════
    'ignis+ignis':    {name:'Ember Core',      rarity:'rare',      slot:'weapon',    effect:'Burn on every action — enemy takes 3 fire dmg/turn',                               stats:{power_bonus:2,atk_bonus:2},                              icon:'🔥🔥'},
    'ignis+terra':    {name:'Molten Strike',   rarity:'rare',      slot:'weapon',    effect:'Guaranteed minimum damage — strike always lands for at least 5',                   stats:{power_bonus:2,atk_bonus:3,guard_bonus:1},                icon:'🔥🪨'},
    'aero+ignis':     {name:'Blazing Speed',   rarity:'epic',      slot:'weapon',    effect:'Act first every turn. Fire damage gains +2 per consecutive hit.',                  stats:{power_bonus:2,speed_bonus:4},                            icon:'🔥💨'},
    'aqua+ignis':     {name:'Steam Burst',     rarity:'epic',      slot:'weapon',    effect:'Convert any miss into a 50% partial hit',                                          stats:{power_bonus:2,control_bonus:2,atk_bonus:1},              icon:'🔥💧'},
    'ignis+lux':      {name:'Holy Flame',      rarity:'epic',      slot:'weapon',    effect:'Damage without downsides — no backlash, no miss penalty',                          stats:{power_bonus:2,insight_bonus:2,atk_bonus:2},              icon:'🔥✨'},
    'ignis+umbra':    {name:'Hellfire Pact',   rarity:'legendary', slot:'weapon',    effect:'+Massive power. 20% chance of backlash (−15 HP per use)',                          stats:{power_bonus:6,atk_bonus:4},                              icon:'🔥🌑'},
    'ignis+volt':     {name:'Plasma Burst',    rarity:'epic',      slot:'weapon',    effect:'On hit: chain lightning arc to a second target for 60% dmg + burn',               stats:{power_bonus:3,atk_bonus:4},                              icon:'🔥⚡'},
    'ignis+venin':    {name:'Toxic Flame',     rarity:'epic',      slot:'weapon',    effect:'Burn and poison simultaneously — 3 fire + 3 poison dmg/turn',                     stats:{power_bonus:3,atk_bonus:3},                              icon:'🔥☠️'},
    'ferro+ignis':    {name:'Forge Strike',    rarity:'epic',      slot:'weapon',    effect:'Metal heated red — strikes bypass 25% DEF and leave a burn',                       stats:{atk_bonus:4,power_bonus:2,guard_bonus:1},                icon:'🔥⚙️'},

    'aqua+aqua':      {name:'Flow State',      rarity:'rare',      slot:'weapon',    effect:'Retry any failed action once per fight',                                            stats:{control_bonus:3,luck_bonus:2},                           icon:'💧💧'},
    'aqua+terra':     {name:'Deep Stability',  rarity:'rare',      slot:'weapon',    effect:'Reduce critical failure chance by 40%',                                            stats:{control_bonus:2,guard_bonus:2},                          icon:'💧🪨'},
    'aero+aqua':      {name:'Current Shift',   rarity:'epic',      slot:'weapon',    effect:'Reorder outcomes — see next enemy action before choosing yours',                   stats:{control_bonus:3,speed_bonus:2},                          icon:'💧💨'},
    'aqua+lux':       {name:'Sacred Tide',     rarity:'epic',      slot:'weapon',    effect:'Heal 10 HP after every successful hit',                                            stats:{control_bonus:2,insight_bonus:2,luck_bonus:1},           icon:'💧✨'},
    'aqua+umbra':     {name:'Drowning Curse',  rarity:'legendary', slot:'weapon',    effect:'Seize enemy control for 2 turns — then take 15 backlash',                         stats:{control_bonus:5,power_bonus:2},                          icon:'💧🌑'},
    'aqua+volt':      {name:'Surge Current',   rarity:'epic',      slot:'weapon',    effect:'Water conducts — chain hit always triggers, arcs ignore evasion',                 stats:{control_bonus:2,atk_bonus:3,speed_bonus:2},              icon:'💧⚡'},
    'aqua+flora':     {name:'Tide Root',       rarity:'rare',      slot:'weapon',    effect:'Regen 5 HP/turn. Heals stack with other regeneration.',                            stats:{control_bonus:2,luck_bonus:2,insight_bonus:1},           icon:'💧🌿'},
    'aqua+venin':     {name:'Brine Venom',     rarity:'epic',      slot:'weapon',    effect:'Poison is amplified in water — dmg increases each turn (3→5→8→12)',               stats:{control_bonus:2,atk_bonus:3,luck_bonus:2},               icon:'💧☠️'},

    'aero+aero':      {name:'Wind Fury',       rarity:'rare',      slot:'weapon',    effect:'30% chance to act twice in one turn',                                              stats:{speed_bonus:4,luck_bonus:2},                             icon:'💨💨'},
    'aero+umbra':     {name:'Phantom Strike',  rarity:'legendary', slot:'weapon',    effect:'Invisible action — enemy cannot counter or dodge for 1 turn',                     stats:{speed_bonus:4,power_bonus:3},                            icon:'💨🌑'},
    'aero+lux':       {name:'Light Speed',     rarity:'epic',      slot:'weapon',    effect:'Act first. Speed-based actions deal +30% damage.',                                 stats:{speed_bonus:3,insight_bonus:2},                          icon:'💨✨'},
    'aero+volt':      {name:'Thunder Rush',    rarity:'epic',      slot:'weapon',    effect:'Always act first. Guaranteed chain on first strike.',                              stats:{speed_bonus:5,atk_bonus:3},                              icon:'💨⚡'},
    'aero+venin':     {name:'Miasma',          rarity:'epic',      slot:'weapon',    effect:'Poison spreads on dodge — if enemy misses you, they get poisoned',                 stats:{speed_bonus:3,atk_bonus:2,luck_bonus:2},                 icon:'💨☠️'},
    'aero+ferro':     {name:'Razor Wind',      rarity:'rare',      slot:'weapon',    effect:'Cuts through armor — wind-accelerated blade ignores 20% DEF',                     stats:{speed_bonus:3,atk_bonus:3},                              icon:'💨⚙️'},
    'aero+flora':     {name:'Spore Drift',     rarity:'rare',      slot:'weapon',    effect:'Pollen on each hit — 25% chance to disorient enemy (skip their next action)',     stats:{speed_bonus:2,luck_bonus:3,atk_bonus:1},                 icon:'💨🌿'},

    'umbra+umbra':    {name:'Abyss Core',      rarity:'epic',      slot:'weapon',    effect:'Double power — double penalty on miss (−10 HP)',                                   stats:{power_bonus:5,atk_bonus:3},                              icon:'🌑🌑'},
    'lux+umbra':      {name:'Twilight Edge',   rarity:'epic',      slot:'weapon',    effect:'Strike in the balance — 50% chance to deal double or half damage',                stats:{power_bonus:3,insight_bonus:2,luck_bonus:2},             icon:'🌑✨'},
    'ferro+umbra':    {name:'Shadow Alloy',    rarity:'legendary', slot:'weapon',    effect:'+40% crit damage. Blade forged dark reflects nothing back.',                       stats:{power_bonus:4,atk_bonus:4,guard_bonus:1},                icon:'⚙️🌑'},
    'umbra+venin':    {name:'Deathblight',     rarity:'legendary', slot:'weapon',    effect:'Poison scales with enemy missing HP — damage doubles below 50%',                  stats:{power_bonus:4,atk_bonus:3,luck_bonus:2},                 icon:'🌑☠️'},
    'flora+umbra':    {name:'Rotwood',         rarity:'epic',      slot:'weapon',    effect:'Regen while you drain — heal 4 HP per turn you poison an enemy',                  stats:{power_bonus:3,atk_bonus:2,luck_bonus:2},                 icon:'🌿🌑'},

    'lux+lux':        {name:'Radiant Edge',    rarity:'rare',      slot:'weapon',    effect:'Remove all negative status after each fight',                                      stats:{insight_bonus:2,luck_bonus:2,guard_bonus:1},             icon:'✨✨'},
    'lux+terra':      {name:'Sacred Strike',   rarity:'epic',      slot:'weapon',    effect:'Stable guaranteed minimum success — never deals less than base',                   stats:{insight_bonus:2,guard_bonus:2,atk_bonus:2},              icon:'✨🪨'},
    'ferro+lux':      {name:'Radiant Steel',   rarity:'epic',      slot:'weapon',    effect:'Attacks bypass 30% enemy DEF — strikes ring like a tuning fork',                  stats:{atk_bonus:4,insight_bonus:2,guard_bonus:1},              icon:'⚙️✨'},
    'flora+lux':      {name:'Sunbloom',        rarity:'epic',      slot:'weapon',    effect:'Heal 5 HP per successful hit. Cleanse poison on victory.',                         stats:{atk_bonus:2,insight_bonus:3,luck_bonus:2},               icon:'🌿✨'},
    'lux+venin':      {name:'Holy Blight',     rarity:'legendary', slot:'weapon',    effect:'Poison that cannot be resisted — even immune enemies take 2 dmg/turn',            stats:{power_bonus:3,atk_bonus:2,insight_bonus:2,luck_bonus:1}, icon:'✨☠️'},
    'lux+volt':       {name:'Arc Light',       rarity:'epic',      slot:'weapon',    effect:'Chain lightning guided by insight — arcs hit the lowest HP target',               stats:{insight_bonus:3,atk_bonus:3,speed_bonus:1},              icon:'✨⚡'},

    'volt+volt':      {name:'Storm Core',      rarity:'rare',      slot:'weapon',    effect:'40% chain hit chance — arc to second target for 60% dmg',                         stats:{atk_bonus:4,speed_bonus:2},                              icon:'⚡⚡'},
    'ferro+volt':     {name:'Magnetar',        rarity:'epic',      slot:'weapon',    effect:'Metal conducts — pull enemy in, guarantee next hit, arc on contact',              stats:{atk_bonus:4,guard_bonus:2,speed_bonus:1},                icon:'⚙️⚡'},
    'volt+venin':     {name:'Shock Venom',     rarity:'epic',      slot:'weapon',    effect:'Chain hit also injects venom — arced target is poisoned (3 dmg/turn)',            stats:{atk_bonus:3,power_bonus:2,luck_bonus:2},                 icon:'⚡☠️'},
    'flora+volt':     {name:'Thorn Spark',     rarity:'rare',      slot:'weapon',    effect:'On hit: 30% chance thorn-spark stuns enemy for 1 turn',                           stats:{atk_bonus:2,luck_bonus:3,speed_bonus:1},                 icon:'🌿⚡'},

    'venin+venin':    {name:'Venom Core',      rarity:'rare',      slot:'weapon',    effect:'Every strike poisons — 3 dmg/turn × 3 turns, stacks per hit',                    stats:{power_bonus:2,atk_bonus:2,luck_bonus:1},                 icon:'☠️☠️'},
    'ferro+venin':    {name:'Serrated Blade',  rarity:'epic',      slot:'weapon',    effect:'Metal serrations hold venom — poison duration +2 turns, cannot be cleansed early',stats:{atk_bonus:3,power_bonus:2,luck_bonus:2},                 icon:'⚙️☠️'},
    'flora+venin':    {name:'Spore Cloud',     rarity:'legendary', slot:'weapon',    effect:'On hit: 40% chance to poison and disorient — enemy loses next action',            stats:{power_bonus:3,atk_bonus:2,luck_bonus:3},                 icon:'🌿☠️'},

    'ferro+ferro':    {name:'Iron Will',       rarity:'rare',      slot:'weapon',    effect:'Strike heavy — 25% chance to stagger enemy, forcing them to defend',              stats:{atk_bonus:4,guard_bonus:2},                              icon:'⚙️⚙️'},
    'flora+flora':    {name:'Twinvine',        rarity:'rare',      slot:'weapon',    effect:'Entangle on hit — enemy speed reduced by 4 for 2 turns',                          stats:{atk_bonus:2,luck_bonus:2,control_bonus:2},               icon:'🌿🌿'},

    // ══════════════════════════════════════════════
    // ⚔️ WEAPONS — 3-rune
    // ══════════════════════════════════════════════
    'aero+ignis+ignis':   {name:'Inferno Rush',    rarity:'epic',      slot:'weapon',    effect:'Chain burn — attack twice if first hit connects',                              stats:{power_bonus:3,speed_bonus:2,atk_bonus:2},                icon:'🔥🔥💨'},
    'ignis+ignis+umbra':  {name:'Doom Flame',      rarity:'legendary', slot:'weapon',    effect:'Massive damage + chaos effect on enemy (random debuff)',                       stats:{power_bonus:5,atk_bonus:5},                              icon:'🔥🔥🌑'},
    'ignis+terra+umbra':  {name:'Volcanic Doom',   rarity:'legendary', slot:'weapon',    effect:'Power scales with HP lost — stronger when wounded',                            stats:{power_bonus:4,atk_bonus:4,guard_bonus:1},                icon:'🔥🪨🌑'},
    'aero+ignis+umbra':   {name:'Chaos Engine',    rarity:'mythic',    slot:'weapon',    effect:'Random massive effect each turn — unpredictable and devastating',               stats:{power_bonus:6,speed_bonus:4,atk_bonus:4},                icon:'🔥💨🌑'},
    'aqua+aqua+lux':      {name:'Ocean Blessing',  rarity:'epic',      slot:'weapon',    effect:'Restore 20 HP and retry after any failure',                                    stats:{control_bonus:3,insight_bonus:2,luck_bonus:2},           icon:'💧💧✨'},
    'aero+aqua+umbra':    {name:'Phantom Current', rarity:'legendary', slot:'weapon',    effect:'Strike twice, hidden — enemy cannot counter either hit',                       stats:{control_bonus:4,speed_bonus:3,power_bonus:2},            icon:'💧💨🌑'},
    'aero+aero+ignis':    {name:'Storm Inferno',   rarity:'legendary', slot:'weapon',    effect:'Chain attack + burn — acts three times if all land',                           stats:{speed_bonus:4,power_bonus:3,atk_bonus:3},                icon:'💨💨🔥'},
    'volt+volt+aero':     {name:'Stormcaller',     rarity:'legendary', slot:'weapon',    effect:'Every attack chains. Third chain stuns.',                                      stats:{atk_bonus:5,speed_bonus:4,power_bonus:2},                icon:'⚡⚡💨'},
    'aqua+ignis+terra':   {name:'Steam Core',      rarity:'epic',      slot:'weapon',    effect:'Fire damage + water retry + earth stability — balanced offense',               stats:{power_bonus:2,control_bonus:2,guard_bonus:1,atk_bonus:2},icon:'🔥💧🪨'},
    'aero+terra+umbra':   {name:'Shadow Cyclone',  rarity:'legendary', slot:'weapon',    effect:'AoE — hits all targets, random effect per target',                             stats:{speed_bonus:2,power_bonus:3,atk_bonus:3},                icon:'💨🪨🌑'},
    'aero+aqua+lux':      {name:'Radiant Flow',    rarity:'epic',      slot:'weapon',    effect:'Heal while acting fast — recover HP each time you act first',                  stats:{speed_bonus:2,control_bonus:2,insight_bonus:2},          icon:'💧💨✨'},
    'lux+lux+terra':      {name:'Divine Judgment', rarity:'legendary', slot:'weapon',    effect:'Near-guaranteed success every fight',                                          stats:{insight_bonus:4,guard_bonus:3,luck_bonus:3},             icon:'✨✨🪨'},
    'venin+venin+umbra':  {name:'Plague Harbinger',rarity:'legendary', slot:'weapon',    effect:'Poison cannot be cleansed — doubles in potency after 2 turns',                 stats:{power_bonus:5,atk_bonus:4},                              icon:'☠️☠️🌑'},
    'flora+venin+venin':  {name:'Poison Garden',   rarity:'legendary', slot:'weapon',    effect:'Poison doubles every 2 turns. Flora regen prevents self-damage.',              stats:{power_bonus:4,atk_bonus:3,luck_bonus:3},                 icon:'🌿☠️☠️'},
    'ignis+volt+venin':   {name:'Toxin Reactor',   rarity:'legendary', slot:'weapon',    effect:'Three damage types at once: burn, chain, poison — all stack',                  stats:{power_bonus:4,atk_bonus:4,luck_bonus:2},                 icon:'🔥⚡☠️'},
    'ferro+ferro+volt':   {name:'Arc Forge',       rarity:'legendary', slot:'weapon',    effect:'Iron amplifies arc — every hit chains twice, chains bypass armor',             stats:{atk_bonus:5,speed_bonus:3,guard_bonus:2,power_bonus:2},  icon:'⚙️⚙️⚡'},
    'aqua+flora+venin':   {name:'Bog Witch',       rarity:'legendary', slot:'weapon',    effect:'Regen while poisoning — heal 4 HP for every turn enemy is poisoned',           stats:{control_bonus:3,power_bonus:3,luck_bonus:3},             icon:'💧🌿☠️'},

    // ══════════════════════════════════════════════
    // ⚔️ WEAPONS — 4-rune mythic
    // ══════════════════════════════════════════════
    'ignis+ignis+umbra+umbra':       {name:'Hell Collapse',    rarity:'mythic', slot:'weapon', effect:'Extreme damage — heavy HP cost each use (−20 HP)',                       stats:{power_bonus:8,atk_bonus:6},                                          icon:'🔥🔥🌑🌑'},
    'ferro+ferro+volt+volt':         {name:'Arc Cannon',       rarity:'mythic', slot:'weapon', effect:'Every hit chains twice. Chains bypass all armor.',                       stats:{atk_bonus:7,speed_bonus:4,guard_bonus:2,power_bonus:3},              icon:'⚙️⚙️⚡⚡'},
    'aqua+flora+lux+venin':          {name:"Alchemist's Will", rarity:'mythic', slot:'weapon', effect:'Poison heals you. Regen damages enemy. Light reveals hidden paths.',      stats:{power_bonus:5,control_bonus:4,luck_bonus:4,insight_bonus:3},         icon:'💧🌿✨☠️'},
    'aero+aqua+ignis+lux+terra+umbra':{name:'Genesis Blade',  rarity:'mythic', slot:'weapon', effect:'All elements united — every stat maximized, all effects active',          stats:{power_bonus:6,control_bonus:6,guard_bonus:6,speed_bonus:6,insight_bonus:6,luck_bonus:6,atk_bonus:8}, icon:'⚡'},

    // ══════════════════════════════════════════════
    // 🛡️ ARMOR — 2-rune
    // ══════════════════════════════════════════════
    'ignis+ignis-armor':  {name:'Flame Guard',     rarity:'uncommon',  slot:'armor', effect:'Burn attackers — 2 fire damage when you are hit',                                 stats:{guard_bonus:1,def_bonus:2},                              icon:'🔥🔥'},
    'aero+aero-armor':    {name:'Ghost Cloak',     rarity:'rare',      slot:'armor', effect:'40% dodge chance on each incoming attack',                                         stats:{guard_bonus:1,speed_bonus:4,def_bonus:1},                icon:'💨💨'},
    'aqua+aqua-armor':    {name:'Flow Armor',      rarity:'rare',      slot:'armor', effect:'Retry defense — reduce incoming damage on second check',                           stats:{guard_bonus:2,control_bonus:2,def_bonus:2},              icon:'💧💧'},
    'terra+terra':        {name:'Stone Skin',      rarity:'rare',      slot:'armor', effect:'Heavy reduction — take 30% less from all sources',                                 stats:{guard_bonus:5,def_bonus:3},                              icon:'🪨🪨'},
    'ferro+ferro-armor':  {name:'Iron Bastion',    rarity:'rare',      slot:'armor', effect:'Reflect 10% of all incoming damage. Cannot be stunned.',                           stats:{guard_bonus:4,def_bonus:4},                              icon:'⚙️⚙️'},
    'ferro+terra':        {name:'Tempered Earth',  rarity:'rare',      slot:'armor', effect:'Massive DEF — take minimum 1 damage from any hit',                                 stats:{guard_bonus:3,def_bonus:5},                              icon:'⚙️🪨'},
    'flora+flora':        {name:'Living Armor',    rarity:'rare',      slot:'armor', effect:'Regenerate 4 HP/turn. Remove 1 debuff per turn.',                                  stats:{guard_bonus:2,def_bonus:2,control_bonus:2},              icon:'🌿🌿'},
    'flora+terra':        {name:'Thornwall',       rarity:'rare',      slot:'armor', effect:'Attackers take 4 thorn damage. Your DEF scales up each turn.',                    stats:{guard_bonus:4,def_bonus:2},                              icon:'🌿🪨'},
    'aqua+flora':         {name:'Tide Root',       rarity:'epic',      slot:'armor', effect:'Regen 8 HP/turn. Revive once per fight at 1 HP.',                                  stats:{guard_bonus:3,def_bonus:2,control_bonus:3},              icon:'🌿💧'},
    'ignis+lux-armor':    {name:'Phoenix Guard',   rarity:'legendary', slot:'armor', effect:'Auto-revive once per chapter at 30 HP',                                            stats:{guard_bonus:2,def_bonus:2,power_bonus:1},                icon:'🔥✨'},
    'lux+lux+umbra':      {name:'Fallen Angel',    rarity:'legendary', slot:'armor', effect:'High-power defense — counter-strike when hit',                                     stats:{guard_bonus:4,power_bonus:3,def_bonus:3},                icon:'✨✨🌑'},
    'ferro+volt-armor':   {name:'Faraday Shell',   rarity:'epic',      slot:'armor', effect:'Lightning absorbed — redirect 20% of lightning damage back as counter-arc',        stats:{guard_bonus:3,def_bonus:3,speed_bonus:1},                icon:'⚙️⚡'},
    'aqua+ferro':         {name:'Rust Ward',       rarity:'rare',      slot:'armor', effect:'Water-cooled iron — reduce fire and lightning damage by 30%',                      stats:{guard_bonus:3,def_bonus:3},                              icon:'💧⚙️'},
    'flora+lux-armor':    {name:'Sacred Grove',    rarity:'epic',      slot:'armor', effect:'Regen 5 HP/turn + cleanse one poison/debuff per turn',                             stats:{guard_bonus:2,def_bonus:2,insight_bonus:2,control_bonus:1},icon:'🌿✨'},
    'umbra+venin-armor':  {name:'Plague Shell',    rarity:'epic',      slot:'armor', effect:'Attackers are poisoned on hit (3 dmg/turn × 2 turns)',                             stats:{guard_bonus:3,def_bonus:2,luck_bonus:2},                 icon:'🌑☠️'},
    'aero+ferro':         {name:'Hollow Plate',    rarity:'rare',      slot:'armor', effect:'Lightweight metal — +3 speed with no def penalty',                                 stats:{guard_bonus:2,def_bonus:2,speed_bonus:3},                icon:'💨⚙️'},

    // ══════════════════════════════════════════════
    // 🛡️ ARMOR — 3-rune
    // ══════════════════════════════════════════════
    'aqua+terra+terra':       {name:'Deep Root',      rarity:'epic',      slot:'armor', effect:'Prevent all critical failures this fight',                                      stats:{guard_bonus:4,def_bonus:3,control_bonus:2},              icon:'💧🪨🪨'},
    'aqua+lux+terra':         {name:'Eternal Guard',  rarity:'legendary', slot:'armor', effect:'Strong protection — resist all damage types equally',                           stats:{guard_bonus:6,def_bonus:4,insight_bonus:2},              icon:'💧✨🪨'},
    'aqua+flora+lux':         {name:'Garden of Life', rarity:'legendary', slot:'armor', effect:'Full regen — 10 HP/turn, immune to poison, revive once per fight',              stats:{guard_bonus:4,def_bonus:3,control_bonus:3,insight_bonus:2},icon:'💧🌿✨'},
    'ferro+ferro+terra':      {name:'Fortress Core',  rarity:'legendary', slot:'armor', effect:'Reduce all damage by 25%. Reflect 15%. Cannot be displaced.',                   stats:{guard_bonus:6,def_bonus:5},                              icon:'⚙️⚙️🪨'},
    'aero+umbra+venin':       {name:'Toxic Phantom',  rarity:'legendary', slot:'armor', effect:'Dodge poisons attacker — if you evade, they take 5 dmg/turn for 3 turns',      stats:{guard_bonus:3,def_bonus:2,speed_bonus:3,luck_bonus:2},   icon:'💨🌑☠️'},
    'flora+terra+terra':      {name:'Ancient Bark',   rarity:'legendary', slot:'armor', effect:'Living wood — regen 6 HP/turn, DEF increases each round until hit',             stats:{guard_bonus:5,def_bonus:4,control_bonus:2},              icon:'🌿🪨🪨'},
    'ferro+volt+terra':       {name:'Grounding Core', rarity:'epic',      slot:'armor', effect:'Earth grounds the circuit — immune to stun, reflect 15% lightning damage',     stats:{guard_bonus:4,def_bonus:3,speed_bonus:1},                icon:'⚙️⚡🪨'},

    // ══════════════════════════════════════════════
    // 🛡️ ARMOR — 4-5 rune mythic
    // ══════════════════════════════════════════════
    'aqua+lux+terra+terra':       {name:'World Core',     rarity:'legendary', slot:'armor', effect:'Massive defense — reduce all incoming damage by 50%',                      stats:{guard_bonus:8,def_bonus:6,control_bonus:2},                    icon:'🌍'},
    'aero+aqua+lux+lux+terra':   {name:'Celestial Aegis', rarity:'mythic',   slot:'armor', effect:'Perfect protection — immune to all negative effects',                       stats:{guard_bonus:6,def_bonus:6,insight_bonus:4,luck_bonus:4},       icon:'🌟'},
    'aqua+ferro+flora+lux+terra': {name:'Iron Garden',    rarity:'mythic',    slot:'armor', effect:'Living iron — regen, reflect, resist, revive. All at once.',                stats:{guard_bonus:7,def_bonus:6,control_bonus:3,insight_bonus:2,luck_bonus:2}, icon:'🌿⚙️'},

    // ══════════════════════════════════════════════
    // 💍 ACCESSORIES
    // ══════════════════════════════════════════════
    'ignis+umbra-acc':    {name:'Hell Ring',        rarity:'epic',      slot:'accessory', effect:'Power spike every 3 turns — third action deals double',                       stats:{power_bonus:3,atk_bonus:2},                              icon:'🔥🌑'},
    'lux+umbra-acc':      {name:'Twilight Loop',    rarity:'rare',      slot:'accessory', effect:'Nullify one extreme consequence per chapter',                                  stats:{insight_bonus:2,power_bonus:1,guard_bonus:1},            icon:'✨🌑'},
    'volt+ferro-acc':     {name:'Conductor Ring',   rarity:'epic',      slot:'accessory', effect:'+2 chain hit chance per equipped ferro rune. Always crits on chains.',        stats:{atk_bonus:3,speed_bonus:2},                              icon:'⚡⚙️'},
    'venin+venin-acc':    {name:'Poison Sigil',     rarity:'rare',      slot:'accessory', effect:'Poison you apply lasts +2 turns longer',                                      stats:{luck_bonus:3,power_bonus:1},                             icon:'☠️☠️'},
    'flora+aqua-acc':     {name:'Bloom Ring',       rarity:'rare',      slot:'accessory', effect:'Regen 3 HP/turn passively — always active',                                   stats:{control_bonus:2,luck_bonus:2},                           icon:'🌿💧'},
    'lux+lux-acc':        {name:'Halo Band',        rarity:'epic',      slot:'accessory', effect:'+15% crit chance. Crits cleanse one debuff.',                                 stats:{insight_bonus:3,luck_bonus:3},                           icon:'✨✨'},
    'aero+aero-acc':      {name:'Wind Walker',      rarity:'rare',      slot:'accessory', effect:'+4 SPD permanently. First action each fight is always free.',                 stats:{speed_bonus:4,luck_bonus:1},                             icon:'💨💨'},
    'umbra+umbra-acc':    {name:'Shadow Brand',     rarity:'epic',      slot:'accessory', effect:'First strike each fight is always a crit. +2 crit damage multiplier.',        stats:{power_bonus:3,atk_bonus:2},                              icon:'🌑🌑'},

    // ══════════════════════════════════════════════
    // ☯️ UNIVERSAL (any slot)
    // ══════════════════════════════════════════════
    'lux+terra':          {name:'Harmony',          rarity:'rare',      slot:'any',       effect:'All stats slightly improved — stable, balanced, reliable',                    stats:{power_bonus:1,control_bonus:1,guard_bonus:1,speed_bonus:1}, icon:'☯️'},
    'lux+umbra':          {name:'Twilight Core',    rarity:'legendary', slot:'any',       effect:'Risk plus stability — high power with a safety net',                          stats:{power_bonus:3,guard_bonus:2,insight_bonus:2},            icon:'🌓'},
    'lux+lux+lux':        {name:'Pure Divinity',    rarity:'mythic',    slot:'any',       effect:'Remove all negative effects permanently this chapter',                        stats:{insight_bonus:5,guard_bonus:4,luck_bonus:5},             icon:'👼'},
    'aero+aqua+ignis+lux+terra+umbra': {name:'Genesis', rarity:'mythic', slot:'any',      effect:'All abilities unlocked, all elemental paths visible',                        stats:{power_bonus:5,control_bonus:5,guard_bonus:5,speed_bonus:5,insight_bonus:5,luck_bonus:5}, icon:'🌌'},
  }

  function findRuneword(runes, slot) {
    // Try slot-specific key first (e.g. 'ignis+ignis-armor')
    const base = [...runes].sort().join('+')
    const slotKey = base + '-' + slot
    if (RUNEWORDS[slotKey]) return RUNEWORDS[slotKey]
    // Try base key
    if (RUNEWORDS[base]) {
      const rw = RUNEWORDS[base]
      if (rw.slot === 'any' || rw.slot === slot) return rw
      return null  // exists but wrong slot
    }
    // Try accessory suffix
    const accKey = base + '-acc'
    if (RUNEWORDS[accKey] && slot === 'accessory') return RUNEWORDS[accKey]
    // Try any-slot universal
    if (RUNEWORDS[base] && RUNEWORDS[base].slot === 'any') return RUNEWORDS[base]
    return null
  }

  // ── Load ─────────────────────────────────────────
  if (!player) throw new Error('no player')

  let items = [], selectedItem = null, filter = 'all'
  let runeInventory = []

  async function load() {
    const { data } = await supabase.from('inventory').select('*')
      .eq('player_id', player.id).order('obtained_at',{ascending:false})
    items         = (data||[]).filter(i => i.item_type !== 'consumable' && i.item_type !== 'material' && i.item_type !== 'key')
    runeInventory = (data||[]).filter(i => i.item_key && i.item_key.startsWith('rune_'))
    renderItemList()
    renderRuneInventory()
  }

  function setFilter(f) {
    filter = f
    document.querySelectorAll('[id^="ft-"]').forEach(b => {
      b.style.background = 'none'
      b.style.borderColor = 'rgba(139,106,32,.2)'
      b.style.color = '#7a6435'
    })
    const active = document.getElementById('ft-'+f)
    if (active) { active.style.background='rgba(139,106,32,.15)'; active.style.borderColor='rgba(139,106,32,.4)'; active.style.color='#1a1208' }
    renderItemList()
  }
  window.setFilter = setFilter

  function renderItemList() {
    const filtered = items.filter(i => filter==='all' || i.item_type===filter || (filter==='accessory' && (i.subtype==='accessory' || i.item_type==='accessory')))
    const el = document.getElementById('item-list')
    if (!filtered.length) { el.innerHTML=`<p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.85rem;color:#7a6435;padding:.5rem 0">No items in this category.</p>`; return }

    el.innerHTML = filtered.map(item => {
      const rc      = RARITY_COLORS[item.rarity] || '#888'
      const sockets = item.sockets_total || 0
      const used    = item.sockets_used  || 0
      const runes   = item.socketed_runes || []
      const isSel   = selectedItem?.id === item.id
      const socketDisplay = sockets > 0
        ? runes.map(r => RUNE_ELEMENTS[r]?.icon || '?').join('') + '○'.repeat(sockets-used)
        : '(no sockets)'

      return `<div class="item-pick${isSel?' selected':''}" data-id="${item.id}" onclick="selectItem('${item.id}')">
        ${(()=>{const _s=getItemImg(item.item_key);return _s?('<img src="'+_s+'" style="width:32px;height:32px;object-fit:contain;border-radius:3px" onerror="this.style.display=\'none\'">'):'<span style="font-size:1.1rem">'+(item.icon||'📦')+'</span>';})()}
        <div style="flex:1;min-width:0">
          <p style="font-family:'Cinzel',serif;font-size:.82rem;color:${rc};margin:0 0 1px">${item.name}</p>
          <p style="font-family:'Share Tech Mono',monospace;font-size:.56rem;color:#7a6435;margin:0">${item.rarity} · ${item.subtype||item.item_type} · <span style="color:${sockets>0?'#c8b880':'#555'}">${socketDisplay}</span>${item.runeword_name?` · <span style="color:#a07de0">${item.runeword_name}</span>`:''}</p>
        </div>
      </div>`
    }).join('')
  }

  window.selectItem = function(id) {
    selectedItem = items.find(i=>i.id===id) || null
    renderItemList()
    renderSocketPanel()
  }

  function renderRuneInventory() {
    const el = document.getElementById('rune-inventory')
    if (!el) return
    if (!runeInventory.length) {
      el.innerHTML = `<p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.82rem;color:#7a6435">No runes in inventory. Buy from the Trader or earn from combat.</p>`
      return
    }
    el.innerHTML = runeInventory.map(r => {
      const key = r.item_key.replace('rune_','')
      const re  = RUNE_ELEMENTS[key] || {}
      const runeImgPath = `../assets/runes/rune_${key}.png`
      return `<span class="rune-pill" style="color:${re.color||'#888'};border-color:${re.color||'#888'}40;background:${re.color||'#888'}12;display:inline-flex;align-items:center;gap:4px"
        onclick="socketRune('${key}','${r.id}')" title="Socket ${re.name||key} rune (qty: ${r.quantity||1})">
        <img src="${runeImgPath}" style="width:18px;height:18px;object-fit:contain;border-radius:2px" onerror="this.style.display='none'">
        ${re.name||key} ×${r.quantity||1}
      </span>`
    }).join('')
  }

  window.socketRune = async function(runeKey, runeItemId) {
    if (!selectedItem) { window.showToast('Select an item first',true); return }
    const item = selectedItem
    const sockets = item.sockets_total || 0
    const used    = item.sockets_used  || 0

    if (sockets === 0) { window.showToast('Item has no sockets — visit the Runesmith',true); return }
    if (used >= sockets) { window.showToast('All sockets are filled',true); return }

    // Check rune qty
    const runeItem = runeInventory.find(r=>r.id===runeItemId)
    if (!runeItem || (runeItem.quantity||0) < 1) { window.showToast('No runes left',true); return }

    // Add rune to item
    const newRunes    = [...(item.socketed_runes||[]), runeKey]
    const newUsed     = used + 1

    // Check for runeword
    const slot = item.subtype === 'accessory' ? 'accessory' : item.item_type
    const rw   = findRuneword(newRunes, slot)

    // Build stat updates from runeword
    const statUpdates = {}
    if (rw) {
      Object.entries(rw.stats).forEach(([k,v]) => { statUpdates[k] = (item[k]||0) + v })
    }

    // Update inventory item
    await supabase.from('inventory').update({
      socketed_runes:   newRunes,
      sockets_used:     newUsed,
      runeword_name:    rw ? rw.name : item.runeword_name,
      runeword_effect:  rw ? rw.effect : item.runeword_effect,
      ...statUpdates,
    }).eq('id', item.id)

    // Consume rune
    if ((runeItem.quantity||1) <= 1) {
      await supabase.from('inventory').delete().eq('id', runeItemId)
    } else {
      await supabase.from('inventory').update({ quantity: runeItem.quantity - 1 }).eq('id', runeItemId)
    }

    if (rw) window.showToast(`✨ Runeword activated: ${rw.name}!`)
    else    window.showToast(`Rune socketed — ${newRunes.length}/${sockets} filled`)

    await load()

    selectedItem = items.find(i=>i.id===item.id) || null
    renderSocketPanel()
  }

  window.removeRunes = async function() {
    if (!selectedItem) return
    const item = selectedItem

    // Refund runes to inventory
    for (const runeKey of (item.socketed_runes||[])) {
      const runeItemKey = 'rune_' + runeKey
      const { data: ex } = await supabase.from('inventory').select('*')
        .eq('player_id', player.id).eq('item_key', runeItemKey).maybeSingle()
      if (ex) {
        await supabase.from('inventory').update({ quantity: ex.quantity + 1 }).eq('id', ex.id)
      } else {
        const { data: m } = await supabase.from('items').select('*').eq('item_key', runeItemKey).single()
        if (m) await supabase.from('inventory').insert({ player_id:player.id, item_key:runeItemKey, name:m.name, item_type:'material', rarity:m.rarity, icon:m.icon, element:m.element, quantity:1 })
      }
    }

    // Remove runeword stats — reset to base (simplified: reset bonus stats to 0)
    await supabase.from('inventory').update({
      socketed_runes: [], sockets_used: 0,
      runeword_name: null, runeword_effect: null,
      power_bonus:0,control_bonus:0,guard_bonus:0,speed_bonus:0,insight_bonus:0,luck_bonus:0,
    }).eq('id', item.id)

    window.showToast('Runes removed — returned to inventory')
    await load()

  // Pick up pending socket from Runesmith
  const pendingSocket = sessionStorage.getItem('pending_socket')
  if (pendingSocket) {
    sessionStorage.removeItem('pending_socket')
    const SOCKET_MAX = {common:1,uncommon:2,rare:3,epic:4,legendary:5,mythic:6}
    const maxForRarity = SOCKET_MAX[pendingSocket] || 1
    // Show a prompt to pick which item to add socket to
    const eligible = items.filter(i => i.rarity === pendingSocket && (i.sockets_total||0) < maxForRarity)
    if (eligible.length > 0) {
      window.showToast(`Select a ${pendingSocket} item from the list to add your socket`, false)
      // Mark items as socket-pending
      document.querySelectorAll('.item-pick').forEach(el => {
        const item = items.find(i=>i.id===el.dataset.id)
        if (item && item.rarity===pendingSocket) {
          el.style.boxShadow = '0 0 0 1.5px #a07de0'
          el.dataset.socketPending = '1'
        }
      })
      // Override selectItem temporarily
      const origSelect = window.selectItem
      window.selectItem = async function(id) {
        const item = items.find(i=>i.id===id)
        if (!item) return
        if (item.rarity !== pendingSocket) { window.showToast(`Select a ${pendingSocket} item`,true); return }
        const maxS = SOCKET_MAX[item.rarity] || 1
        if ((item.sockets_total||0) >= maxS) { window.showToast('Already at max sockets',true); return }
        await supabase.from('inventory').update({ sockets_total:(item.sockets_total||0)+1 }).eq('id',id)
        window.showToast('Socket added!')
        window.selectItem = origSelect
        await load()
        selectedItem = items.find(i=>i.id===id) || null
        renderSocketPanel()
      }
    } else {
      window.showToast(`No ${pendingSocket} items available for socketing`, true)
    }
  }
    selectedItem = items.find(i=>i.id===item.id) || null
    renderSocketPanel()
  }

  function renderSocketPanel() {
    const panel = document.getElementById('socket-panel')
    if (!selectedItem) {
      panel.innerHTML = `<p style="font-family:'IM Fell English',serif;font-style:italic;color:#7a6435;margin-top:2rem;text-align:center">← Select an item to begin socketing</p>`
      return
    }
    const item    = selectedItem
    const rc      = RARITY_COLORS[item.rarity] || '#888'
    const sockets = item.sockets_total  || 0
    const used    = item.sockets_used   || 0
    const runes   = item.socketed_runes || []
    const rw      = item.runeword_name

    const EL_COLORS = {fire:'#ff5500',water:'#0088ff',earth:'#8b5e3c',air:'#a8d8ea',dark:'#b06eff',light:'#ffd700',none:'#9a8050'}

    // Build socket slots display
    const slotHTML = Array.from({length:sockets}).map((_,i) => {
      const runeKey = runes[i]
      const re      = runeKey ? RUNE_ELEMENTS[runeKey] : null
      return `<div class="socket-slot ${runeKey?'filled':'empty'}" style="--slot-color:${re?.color||'#c8b880'}" title="${re?re.name:'Empty socket'}">
        ${re ? re.icon : '○'}
      </div>`
    }).join('')

    panel.innerHTML = `
      <p class="chapter-label">${item.rarity.toUpperCase()} ${item.item_type.toUpperCase()}</p>
      <h2 class="page-title" style="color:${rc}">${item.icon} ${item.name}</h2>
      <p style="font-family:'Share Tech Mono',monospace;font-size:.6rem;color:#9a8050;letter-spacing:.06em;margin-bottom:.5rem">
        ${item.element&&item.element!=='none'?`[${item.element.toUpperCase()}] `:''}${item.subtype||item.item_type}
        ${(item.atk_bonus||0)>0?` · ATK +${item.atk_bonus}`:''}
        ${(item.def_bonus||0)>0?` · DEF +${item.def_bonus}`:''}
        ${(item.power_bonus||0)>0?` · PWR +${item.power_bonus}`:''}
        ${(item.guard_bonus||0)>0?` · GRD +${item.guard_bonus}`:''}
        ${(item.speed_bonus||0)>0?` · SPD +${item.speed_bonus}`:''}
        ${(item.control_bonus||0)>0?` · CTR +${item.control_bonus}`:''}
        ${(item.insight_bonus||0)>0?` · INS +${item.insight_bonus}`:''}
        ${(item.luck_bonus||0)>0?` · LCK +${item.luck_bonus}`:''}
      </p>
      ${item.special_effect ? `<div style="margin:.4rem 0;padding:5px 8px;background:rgba(94,174,224,.08);border:.5px solid rgba(94,174,224,.3);border-radius:3px">
        <p style="font-family:'Share Tech Mono',monospace;font-size:.46rem;color:#5eaee0;letter-spacing:.08em;margin:0 0 2px">SET EFFECT</p>
        <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.68rem;color:#1a1208;margin:0;line-height:1.4">${item.special_effect}</p>
      </div>` : ''}
      <hr class="ink-divider">

      <!-- Sockets -->
      <p style="font-family:'Cinzel',serif;font-size:.72rem;letter-spacing:.1em;color:#9a8050;margin-bottom:.4rem">SOCKETS — ${used}/${sockets}</p>
      ${sockets > 0
        ? `<div class="socket-slots">${slotHTML}</div>`
        : `<p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.82rem;color:#7a6435">No sockets. Visit the Runesmith NPC to add sockets.</p>`
      }

      <!-- Active runeword -->
      ${rw ? `
        <div class="runeword-card" style="border-color:${RARITY_COLORS[item.runeword_rarity||'rare']||'#888'}60;background:${RARITY_COLORS[item.runeword_rarity||'rare']||'#888'}08">
          <p style="font-family:'Cinzel',serif;font-size:.92rem;font-weight:600;color:${RARITY_COLORS[item.runeword_rarity||'rare']||'#c8b880'};margin-bottom:3px">${runes.map(r=>RUNE_ELEMENTS[r]?.icon||'?').join(' ')} ${rw}</p>
          <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.82rem;color:#6b5a35;margin:0">${item.runeword_effect||''}</p>
        </div>
      ` : sockets > 0 && used > 0 ? `
        <p style="font-family:'Share Tech Mono',monospace;font-size:.6rem;color:#7a6435;letter-spacing:.06em;margin-top:.5rem">
          Socketed: ${runes.map(r=>(RUNE_ELEMENTS[r]?.icon||'?')+' '+r).join(', ')}<br>
          No runeword yet — add more runes to complete a combination.
        </p>
      ` : ''}

      <hr class="ink-divider">

      <!-- Available runes -->
      <p style="font-family:'Cinzel',serif;font-size:.72rem;letter-spacing:.1em;color:#9a8050;margin-bottom:.4rem">YOUR RUNES</p>
      <div id="rune-inventory"></div>

      ${runes.length > 0 ? `
        <hr class="ink-divider">
        <button onclick="removeRunes()" style="font-family:'Cinzel',serif;font-size:.72rem;letter-spacing:.08em;color:#804040;background:none;border:.5px solid #80404040;padding:.35rem .9rem;cursor:pointer;border-radius:2px;transition:all .2s">
          ✕ Remove All Runes
        </button>
      ` : ''}

      <hr class="ink-divider">

      <!-- Possible runewords preview -->
      <p style="font-family:'Cinzel',serif;font-size:.72rem;letter-spacing:.1em;color:#9a8050;margin-bottom:.6rem">RUNEWORD GUIDE</p>
      <div id="rw-guide" style="max-height:200px;overflow-y:auto;scrollbar-width:thin"></div>
    `

    renderRuneInventory()
    renderRunewordGuide(item.item_type, item.subtype)
  }

  function renderRunewordGuide(itemType, subtype) {
    const slot = subtype==='accessory' ? 'accessory' : itemType
    const relevant = Object.entries(RUNEWORDS)
      .filter(([k,rw]) => rw.slot===slot || rw.slot==='any')
      .slice(0, 20)

    document.getElementById('rw-guide').innerHTML = relevant.map(([k,rw]) => {
      const runes   = k.replace(/\+(acc|uni)$/,'').split('+')
      const rc      = RARITY_COLORS[rw.rarity] || '#888'
      return `<div style="display:flex;align-items:flex-start;gap:.5rem;margin-bottom:.5rem;padding-bottom:.5rem;border-bottom:.5px solid rgba(139,106,32,.12)">
        <span style="font-size:1rem;flex-shrink:0">${rw.icon}</span>
        <div style="flex:1;min-width:0">
          <p style="font-family:'Cinzel',serif;font-size:.78rem;color:${rc};margin:0 0 1px">${rw.name} <span style="font-size:.58rem;color:#9a8050">(${rw.rarity})</span></p>
          <p style="font-family:'Share Tech Mono',monospace;font-size:.56rem;color:#7a6435;margin:0 0 1px">${runes.map(r=>(RUNE_ELEMENTS[r]?.icon||'?')+' '+r).join(' + ')}</p>
          <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.72rem;color:#9a8050;margin:0">${rw.effect}</p>
        </div>
      </div>`
    }).join('')
  }

  await load()

  // Pick up pending socket from Runesmith
  const pendingSocket = sessionStorage.getItem('pending_socket')
  if (pendingSocket) {
    sessionStorage.removeItem('pending_socket')
    const SOCKET_MAX = {common:1,uncommon:2,rare:3,epic:4,legendary:5,mythic:6}
    const maxForRarity = SOCKET_MAX[pendingSocket] || 1
    // Show a prompt to pick which item to add socket to
    const eligible = items.filter(i => i.rarity === pendingSocket && (i.sockets_total||0) < maxForRarity)
    if (eligible.length > 0) {
      window.showToast(`Select a ${pendingSocket} item from the list to add your socket`, false)
      // Mark items as socket-pending
      document.querySelectorAll('.item-pick').forEach(el => {
        const item = items.find(i=>i.id===el.dataset.id)
        if (item && item.rarity===pendingSocket) {
          el.style.boxShadow = '0 0 0 1.5px #a07de0'
          el.dataset.socketPending = '1'
        }
      })
      // Override selectItem temporarily
      const origSelect = window.selectItem
      window.selectItem = async function(id) {
        const item = items.find(i=>i.id===id)
        if (!item) return
        if (item.rarity !== pendingSocket) { window.showToast(`Select a ${pendingSocket} item`,true); return }
        const maxS = SOCKET_MAX[item.rarity] || 1
        if ((item.sockets_total||0) >= maxS) { window.showToast('Already at max sockets',true); return }
        await supabase.from('inventory').update({ sockets_total:(item.sockets_total||0)+1 }).eq('id',id)
        window.showToast('Socket added!')
        window.selectItem = origSelect
        await load()
        selectedItem = items.find(i=>i.id===id) || null
        renderSocketPanel()
      }
    } else {
      window.showToast(`No ${pendingSocket} items available for socketing`, true)
    }
  }

  return { player, cleanup() {} }
}

export default mountCrafting
