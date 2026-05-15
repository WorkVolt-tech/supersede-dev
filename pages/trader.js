import { supabase }             from '../supabase.js'

const MODULE_STYLE_ID = 'book-module-style-trader'
const MODULE_MARKUP = "<div class=\"book-wrap\">\n  \n  <div class=\"book animate-in\">\n    <div class=\"page-left parchment\">\n      <div class=\"page-inner\">\n        <p class=\"chapter-label\">NPC Directory</p>\n        <h1 class=\"page-title\">Available</h1>\n        <hr class=\"ink-divider\">\n        <div id=\"npc-list\"></div>\n        <hr class=\"ink-divider\">\n        <div style=\"display:flex;justify-content:space-between;align-items:center\">\n          <span style=\"font-family:'Share Tech Mono',monospace;font-size:.62rem;color:var(--ink);letter-spacing:.08em\">GOLD</span>\n          <span id=\"gold-display\" style=\"font-family:'Cinzel',serif;font-size:1.2rem;font-weight:600;color:#c8b96e\">\u25c8 0</span>\n        </div>\n      </div>\n    </div>\n        <div class=\"page-right parchment\">\n      <div class=\"page-inner\" id=\"npc-panel\">\n        <div style=\"display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;gap:.5rem\">\n          <span style=\"font-size:2.5rem\">\ud83e\udded</span>\n          <p style=\"font-family:'IM Fell English',serif;font-style:italic;color:var(--ink)\">Select an NPC to interact.</p>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>"
const MODULE_STYLES = "\n    /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n       SUPERSEDE DARK THEME \u2014 Gold / Amber accent\n       Injected over main.css \u2014 no JS touched.\n    \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n        :root {\n      --bg-0:      #14110f;\n      --bg-1:      #2b1d16;\n      --panel:     #f4ead7;\n      --page-l:    #f4ead7;\n      --page-r:    #f1e4cf;\n      --ink:       #2b1d16;\n      --ink-dim:   #5c4638;\n      --ink-faint: #a08060;\n      --ice:       #7a5230;\n      --ice-hot:   #4b2e14;\n      --gold:      #c8a050;\n      --gold-hot:  #e0c070;\n      --gold-dim:  #a08040;\n      --amber:     #d09040;\n      --amber-hot: #e0a050;\n      --warn:      #e06050;\n      --line:      rgba(200,160,80,.30);\n      --green:     #5cae50;\n      --purple:    #8a50c0;\n      --spine-col: #2b1d16;\n    }\n    *, *::before, *::after { box-sizing:border-box; }\n        html, body {\n      background: radial-gradient(ellipse at 50% 0%, #2a1a0e 0%, #14110f 55%, #0d0b09 100%) !important;\n      color: var(--ink) !important;\n      font-family: 'Cormorant Garamond', Georgia, serif !important;\n      min-height: 100vh;\n      overflow-x: hidden;\n    }\n    body::after {\n      content: \"\"; position: fixed; inset: 0; pointer-events: none; z-index: 9998;\n      background: radial-gradient(ellipse 900px 900px at 50% 40%, rgba(180,120,60,.07) 0%, transparent 70%);\n    }\n        /* \u2500\u2500 BOOK \u2014 parchment open-book \u2500\u2500 */\n    .book, .craft-grid {\n      display: grid !important;\n      grid-template-columns: 1fr 1fr !important;\n      align-items: stretch !important;\n      gap: 0 !important;\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      box-shadow: none !important;\n      border-radius: 24px !important;\n      filter: drop-shadow(0 24px 60px rgba(0,0,0,.75)) drop-shadow(0 8px 20px rgba(0,0,0,.5)) !important;\n      transform: perspective(1600px) rotateX(2.5deg) !important;\n      transform-origin: 50% 0 !important;\n      margin-top: 10px !important;\n      overflow: hidden !important;\n    }\n    @media(max-width:860px){\n      .book, .craft-grid { grid-template-columns:1fr !important; transform:none !important; border-radius:12px !important; }\n    }\n    /* \u2500\u2500 PAGES \u2500\u2500 */\n    .parchment, .page-left, .page-right {\n      background: var(--panel) !important;\n      border: none !important;\n      border-radius: 0 !important;\n      box-shadow: none !important;\n      color: var(--ink) !important;\n      position: relative;\n      overflow-y: auto; overflow-x: hidden;\n    }\n    .page-left  { background: var(--page-l) !important; border-right: none !important; }\n    .page-right { background: var(--page-r) !important; border-left:  none !important; }\n    /* dot-texture grain */\n    .page-left::before, .page-right::before {\n      content: \"\" !important; position: absolute !important; inset: 0 !important;\n      pointer-events: none !important; z-index: 0 !important; opacity: .08 !important;\n      background-image: radial-gradient(circle, rgba(0,0,0,.25) 1px, transparent 1px) !important;\n      background-size: 12px 12px !important;\n    }\n    /* spine-edge shadows */\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    /* corner brackets */\n    .page-inner { padding: 28px 30px !important; position: relative; }\n    .page-inner::before {\n      content: \"\" !important; position: absolute !important;\n      top: 14px !important; left: 14px !important; width: 28px !important; height: 28px !important;\n      border-left: 1.5px solid rgba(138,91,68,.45) !important;\n      border-top: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-inner::after {\n      content: \"\" !important; position: absolute !important;\n      bottom: 14px !important; right: 14px !important; width: 28px !important; height: 28px !important;\n      border-right: 1.5px solid rgba(138,91,68,.45) !important;\n      border-bottom: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    /* \u2500\u2500 SPINE \u2014 open book gutter / inner binding \u2500\u2500 */\n    .spine {\n      background: linear-gradient(90deg,\n        rgba(232,210,170,.0)   0%,\n        rgba(200,170,120,.25)  15%,\n        rgba(160,120,70,.55)   30%,\n        rgba(90,55,20,.88)     43%,\n        rgba(40,20,5,1.0)      50%,\n        rgba(90,55,20,.88)     57%,\n        rgba(160,120,70,.55)   70%,\n        rgba(200,170,120,.25)  85%,\n        rgba(232,210,170,.0)   100%\n      ) !important;\n      border-left:  none !important;\n      border-right: none !important;\n      position: relative; z-index: 5; width: 22px !important;\n      box-shadow: none !important;\n    }\n    .spine::before {\n      content:\"\";\n      position:absolute;\n      top:0; bottom:0; left:50%;\n      width:1px;\n      transform:translateX(-50%);\n      background: linear-gradient(180deg,\n        transparent 0%,\n        rgba(0,8,18,.9) 6%,\n        rgba(0,8,18,.9) 94%,\n        transparent 100%);\n    }\n    .spine::after {\n      content:\"\";\n      position:absolute;\n      top:2px; bottom:2px; left:-3px;\n      width:3px;\n      background: repeating-linear-gradient(\n        180deg,\n        rgba(200,168,74,.05) 0px,\n        rgba(200,168,74,.02) 1px,\n        rgba(0,0,0,.15)      1px,\n        rgba(0,0,0,.05)      2px\n      );\n      border-left:1px solid rgba(200,168,74,.08);\n    }\n    /* \u2500\u2500 TYPOGRAPHY \u2500\u2500 */\n    .chapter-label, .page-label {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 9.5px !important; letter-spacing: .42em !important;\n      text-transform: uppercase !important;\n      color: var(--gold) !important; margin-bottom: 5px !important;\n    }\n    .page-title, h1.page-title, h2.page-title {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 22px !important; font-weight: 500 !important;\n      letter-spacing: .04em !important; color: var(--ink) !important;\n      margin-bottom: 14px !important;\n    }\n    .ink-divider, hr.ink-divider {\n      border: none !important; border-top: 1px solid var(--line) !important;\n      margin: 12px 0 !important; opacity: 1 !important;\n    }\n    /* body text */\n    p, li, span { color: var(--ink) !important; }\n    /* \u2500\u2500 INLINE COLOURS \u2014 remap parchment browns to gold tones \u2500\u2500 */\n    [style*=\"color:var(--ink)\"] { color: var(--ink) !important; }\n    [style*=\"color:var(--ink-dim)\"] { color: var(--ink-dim) !important; }\n    [style*=\"color:#7a6435\"] { color: var(--gold-dim) !important; }\n    [style*=\"color:#9a8050\"] { color: var(--gold-dim) !important; }\n    [style*=\"color:#c8b96e\"] { color: var(--gold) !important; }\n    [style*=\"background:rgba(200,184,128\"] { background: rgba(200,168,74,.08) !important; }\n    [style*=\"border-color:rgba(139,106,32\"] { border-color: rgba(200,168,74,.25) !important; }\n    /* \u2500\u2500 BUTTONS / CHOICES \u2500\u2500 */\n    button:not(.bm-signout), .choice, .combat-btn {\n      background: transparent !important;\n      border: 1px solid var(--line) !important;\n      border-radius: 0 !important;\n      color: var(--ink) !important;\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 10px !important; letter-spacing: .08em !important;\n      cursor: pointer !important;\n      transition: border-color .2s, color .2s, background .2s !important;\n    }\n    button:hover, .choice:hover, .combat-btn:hover:not(:disabled) {\n      border-color: var(--gold) !important;\n      color: var(--gold) !important;\n      background: rgba(200,168,74,.05) !important;\n    }\n    /* \u2500\u2500 STAT BARS \u2500\u2500 */\n    .stat-bar-wrap { background: rgba(255,255,255,.06) !important; border-radius:0 !important; }\n    .stat-key { color: var(--ink-dim) !important; font-family:'JetBrains Mono',monospace !important; font-size:.58rem !important; letter-spacing:.08em !important; }\n    .stat-val { color: var(--ink) !important; }\n    /* \u2500\u2500 MODALS / OVERLAYS \u2500\u2500 */\n    [id$=\"-window\"] > div, .end-box {\n      background: var(--panel) !important;\n      border: 1px solid var(--line) !important;\n      border-radius: 0 !important;\n    }\n    /* \u2500\u2500 SCROLLBAR \u2500\u2500 */\n    ::-webkit-scrollbar{width:5px}\n    ::-webkit-scrollbar-track{background:var(--bg-0)}\n    ::-webkit-scrollbar-thumb{background:var(--line)}\n    ::-webkit-scrollbar-thumb:hover{background:var(--gold-dim)}\n    /* \u2500\u2500 ANIMATE-IN \u2500\u2500 */\n    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}\n    .animate-in{animation:fadeIn .4s ease forwards}\n      /* \u2500\u2500 Book wrap \u2500\u2500 */\n    .book-wrap, .craft-grid-wrap {\n      background: transparent !important;\n      max-width: 1060px;\n      margin: 0 auto;\n      padding: 24px 24px 60px;\n    }\n    /* \u2500\u2500 Book \u2500\u2500 */\n    .book, .craft-grid {\n      display: grid !important;\n      grid-template-columns: 1fr 1fr !important;\n      align-items: stretch !important;\n      gap: 0 !important;\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      box-shadow: none !important;\n      border-radius: 24px !important;\n      filter: drop-shadow(0 24px 60px rgba(0,0,0,.75)) drop-shadow(0 8px 20px rgba(0,0,0,.5)) !important;\n      transform: perspective(1600px) rotateX(2.5deg) !important;\n      transform-origin: 50% 0 !important;\n      margin-top: 10px !important;\n      overflow: hidden !important;\n    }\n    @media(max-width:860px) {\n      .book, .craft-grid { grid-template-columns: 1fr !important; transform: none !important; border-radius: 12px !important; }\n    }\n    /* \u2500\u2500 Pages \u2500\u2500 */\n    .parchment, .page-left, .page-right {\n      background: var(--panel) !important;\n      border: none !important;\n      border-radius: 0 !important;\n      box-shadow: none !important;\n      color: var(--ink) !important;\n      position: relative;\n      overflow-y: auto; overflow-x: hidden;\n    }\n    .page-left::before, .page-right::before {\n      content: \"\" !important; position: absolute !important; inset: 0 !important;\n      pointer-events: none !important; z-index: 0 !important; opacity: .08 !important;\n      background-image: radial-gradient(circle, rgba(0,0,0,.25) 1px, transparent 1px) !important;\n      background-size: 12px 12px !important;\n    }\n    .page-left  { border-right: none !important; background: var(--page-l) !important; }\n    .page-right { border-left:  none !important; background: var(--page-r) !important; }\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-inner { padding: 28px 30px !important; position: relative; }\n    .page-inner::before {\n      content: \"\" !important; position: absolute !important;\n      top: 14px !important; left: 14px !important; width: 28px !important; height: 28px !important;\n      border-left: 1.5px solid rgba(138,91,68,.45) !important;\n      border-top: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-inner::after {\n      content: \"\" !important; position: absolute !important;\n      bottom: 14px !important; right: 14px !important; width: 28px !important; height: 28px !important;\n      border-right: 1.5px solid rgba(138,91,68,.45) !important;\n      border-bottom: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    /* \u2500\u2500 Spine \u2500\u2500 */\n    .spine {\n      background: linear-gradient(90deg,\n        rgba(0,0,0,.0) 0%, rgba(0,0,0,.20) 28%, rgba(0,0,0,.40) 46%,\n        rgba(0,0,0,.50) 50%, rgba(0,0,0,.40) 54%, rgba(0,0,0,.20) 72%, rgba(0,0,0,.0) 100%\n      ) !important;\n      border: none !important; position: relative; z-index: 5;\n      width: 22px !important; min-width: 22px !important;\n      margin: 0 !important; overflow: visible; box-shadow: none !important;\n    }\n    .spine::before {\n      content: \"\"; position: absolute; top: 0; bottom: 0; left: 50%; width: 1px;\n      transform: translateX(-50%);\n      background: linear-gradient(180deg, transparent 0%, rgba(43,29,22,.9) 8%, rgba(43,29,22,.9) 92%, transparent 100%);\n      z-index: 2;\n    }\n    .spine-inner, .spine-highlight, .spine-shadow,\n    .spine-title, .spine-rule, .spine-diamond, .spine-chapter { display: none !important; }\n    /* \u2500\u2500 Text & UI colours \u2500\u2500 */\n    h1, h2, h3, h4, h5, h6 { color: var(--ink) !important; }\n    .book p, .book li, .book span, .book label,\n    .book-wrap p, .book-wrap li, .book-wrap span, .book-wrap label { color: var(--ink) !important; }\n    button:not(.bm-signout), .btn { background: rgba(43,29,22,.08); border: 1px solid rgba(138,91,68,.35); color: var(--ink); border-radius: 0; cursor: pointer; transition: border-color .2s, color .2s; }\n    button:hover, .btn:hover { border-color: var(--gold) !important; color: var(--gold) !important; }\n    input, select, textarea { background: rgba(43,29,22,.06) !important; border: 1px solid rgba(138,91,68,.35) !important; color: var(--ink) !important; border-radius: 0 !important; }\n    ::-webkit-scrollbar { width: 5px; }\n    ::-webkit-scrollbar-track { background: rgba(43,29,22,.15); }\n    ::-webkit-scrollbar-thumb { background: rgba(138,91,68,.35); }\n    ::-webkit-scrollbar-thumb:hover { background: var(--gold-dim); }\n  \n    @media (max-width: 800px) {\n      .book, .book-body, .craft-grid { flex-direction: column !important; min-height: auto; }\n      .page-left, .page-right { width: 100% !important; padding: 20px 16px !important; }\n      .book-wrap, .craft-grid-wrap { padding: 8px 12px 40px !important; }\n    }\n  "

function installModuleStyle() {
  document.querySelectorAll('style[data-book-module-style]').forEach(el => el.remove())
  const style = document.createElement('style')
  style.id = MODULE_STYLE_ID
  style.dataset.bookModuleStyle = 'true'
  style.textContent = MODULE_STYLES
  document.head.appendChild(style)
}

export async function mountTrader(__mountOptions = {}) {
  const host = __mountOptions.host || document.getElementById('book-module-host') || document.body
  installModuleStyle()
  host.innerHTML = MODULE_MARKUP

    
    const RARITY = { common:'#888', uncommon:'#5ec45e', rare:'#5eaee0', epic:'#a07de0', legendary:'#c8b96e' }

    // ── Item images (same as inventory) ───────────────
    const ITEM_IMAGES = {
      'ember_blade':'../assets/weapon/fire/ember_blade.png','flame_dagger':'../assets/weapon/fire/flame_dagger.png',
      'inferno_sword':'../assets/weapon/fire/inferno_sword.png','burning_staff':'../assets/weapon/fire/burning_staff.png',
      'tide_blade':'../assets/weapon/water/tide_blade.png','ocean_staff':'../assets/weapon/water/ocean_staff.png',
      'stone_sword':'../assets/weapon/earth/stone_sword.png','wind_dagger':'../assets/weapon/air/wind_dagger.png',
      'shadow_blade':'../assets/weapon/dark/shadow_blade.png','radiant_blade':'../assets/weapon/light/radiant_blade.png',
      'cinder_armor':'../assets/armor/cinder_armor.png','ocean_armor':'../assets/armor/ocean_armor.png',
      'rock_armor':'../assets/armor/rock_armor.png','storm_armor':'../assets/armor/storm_armor.png',
      'void_armor':'../assets/armor/void_armor.png','holy_armor':'../assets/armor/holy_armor.png',
      'rune_ignis':'../assets/runes/rune_ignis.png','rune_aqua':'../assets/runes/rune_aqua.png',
      'rune_terra':'../assets/runes/rune_terra.png','rune_aero':'../assets/runes/rune_aero.png',
      'rune_umbra':'../assets/runes/rune_umbra.png','rune_lux':'../assets/runes/rune_lux.png',
      'scrap_blade':'../assets/weapon/scrap_blade.png','knife':'../assets/weapon/knife.png',
      'jacket':'../assets/armor/jacket.png','worn_boots':'../assets/armor/worn_boots.png',
      'riot_vest':'../assets/armor/riot_vest.png','iron_ring':'../assets/armor/iron_ring.png',
      'energy_drink':'../assets/items/energy_drink.png','medkit':'../assets/items/medkit.png',
      'scrap_metal':'../assets/items/scrap_metal.png','flashlight':'../assets/items/flashlight.png',
      'core_fragment':'../assets/items/core_fragment.png',
      'scrap_helm':'../assets/armor/scrap_helm.png','scrap_shield':'../assets/armor/scrap_shield.png',
      'iron_helm':'../assets/armor/iron_helm.png','iron_shield':'../assets/armor/iron_shield.png',
      'tactical_helm':'../assets/armor/tactical_helm.png','tactical_shield':'../assets/armor/tactical_shield.png',
      'iron_sword':'../assets/weapon/iron_sword.png','tactical_sword':'../assets/weapon/tactical_sword.png',
      'wooden_shield':'../assets/armor/scrap_shield.png','leather_gloves':'../assets/armor/jacket.png',
    }
    function getItemImg(k) { return ITEM_IMAGES[k] || null }

    let traderSellMode = false
    let traderSellSelected = new Set()

    // ── NPC definitions ──────────────────────────────
    // Pell is gated on the player having met them in Chapter 2 — the
    // alliance_log flag 'pell_met' is set when the player first visits
    // Ch2 trader_intro. Pell's stock tiers respond to alignment flags
    // from the chapter (Builder-aligned and Hunter-aligned), and they
    // also offer info bounties — gold-priced hints surfaced via the
    // bounty tab. The base NPCS list is static and built before player
    // is loaded; Pell is spliced in below once we have alliance_log.
    const baseNPCS = [
      {
        key:'black_market', name:'The Trader', title:'Black Market Vendor', icon:'🧥',
        dialogue:'"I don\'t ask questions. I just sell."',
        type:'trader', unlockChapter:1,
        stock:[
          {itemKey:'knife',         chapterUnlock:1},
          {itemKey:'jacket',        chapterUnlock:1},
          {itemKey:'energy_drink',  chapterUnlock:1},
          {itemKey:'medkit',        chapterUnlock:1},
          {itemKey:'wooden_shield', chapterUnlock:1},
          {itemKey:'leather_gloves',chapterUnlock:1},
          {itemKey:'worn_boots',    chapterUnlock:1},
          {itemKey:'iron_sword',    chapterUnlock:2},
          {itemKey:'riot_vest',     chapterUnlock:2},
          {itemKey:'iron_helm',     chapterUnlock:2},
          {itemKey:'iron_shield',   chapterUnlock:2},
          {itemKey:'iron_ring',     chapterUnlock:2},
        ]
      },
      {
        key:'doc_mira', name:'Doc Mira', title:'Field Medic', icon:'🩺',
        dialogue:'"I patch you up. What you do after is your problem."',
        type:'healer', unlockChapter:1,
        services:[
          {action:'heal_full', label:'Full heal',    goldCost:200, desc:'Restore all HP'},
          {action:'heal_half', label:'Partial heal', goldCost:125, desc:'Restore 50% HP'},
        ]
      },
    ]

    const player = __mountOptions.player || await window.renderNav(__mountOptions.navId || 'nav')
    if (!player) throw new Error('no player')

    // Build Pell entry from alliance_log alignment flags.
    const allianceLog     = player.alliance_log || []
    const pellMet         = allianceLog.includes('pell_met')
    const builderAligned  = allianceLog.includes('builders_helped') || allianceLog.includes('sweep_builders')
    const hunterAligned   = allianceLog.includes('voss_aligned')   || allianceLog.includes('sweep_hunters')
    const pellBaseStock = [
      { itemKey:'medkit',         chapterUnlock:2 },
      { itemKey:'energy_drink',   chapterUnlock:2 },
      { itemKey:'leather_gloves', chapterUnlock:2 },
      { itemKey:'worn_boots',     chapterUnlock:2 },
    ]
    const pellBuilderStock = [
      { itemKey:'iron_helm',      chapterUnlock:2 },
      { itemKey:'iron_shield',    chapterUnlock:2 },
      { itemKey:'riot_vest',      chapterUnlock:2 },
    ]
    const pellHunterStock = [
      { itemKey:'knife',          chapterUnlock:2 },
      { itemKey:'iron_sword',     chapterUnlock:2 },
      { itemKey:'iron_ring',      chapterUnlock:2 },
    ]
    const pellStock = [
      ...pellBaseStock,
      ...(builderAligned ? pellBuilderStock : []),
      ...(hunterAligned  ? pellHunterStock  : []),
    ]
    const pellTier = builderAligned ? "Allied supplies — vouched for by the Builders' inventory."
                   : hunterAligned  ? "Voss's favorites — gear that moves quickly."
                   : "Standard stock — nothing fancy, all tested."
    const pellBounties = [
      {
        key: 'wounded_player',
        label: 'Hint: the wounded NPC in the Fire zone',
        hint: '"That wounded player you found? Slip them a med pack and they\'ll keep half of it for themselves. Pretty sure. Not a moral judgment — just a recurring data point."',
        goldCost: 60,
      },
      {
        key: 'cache_runner',
        label: "Hint: Voss's runner offer",
        hint: "\"The runner Voss tells you about? Bandaged hand. Kid. They've been useful to the Builders. If you intercept them, you're hurting a kid Sera is trying to raise. If that matters to you. Pell doesn't make recommendations — just maps.\"",
        goldCost: 80,
      },
      {
        key: 'judges_form',
        label: 'Hint: what the Judges actually weigh',
        hint: '"Two axes. Mercy reads what you helped build. Wrath reads what you took. You don\'t need to be either — but if you spread across both with no commitment, the Judges arrive together, and the fight is heaviest."',
        goldCost: 120,
      },
    ]
    const pellNPC = pellMet ? {
      key:'pell', name:'Pell', title:'Phone Kiosk · After Hours', icon:'🧦',
      dialogue: `"${pellTier}"`,
      type:'trader_with_bounties',
      unlockChapter:2,
      stock: pellStock,
      bounties: pellBounties,
    } : null

    // Final NPCS list: insert Pell between the Black Market and Doc Mira
    // so the narrative trader (Pell) takes visual precedence in Chapter 2.
    const NPCS = pellNPC
      ? [baseNPCS[0], pellNPC, baseNPCS[1]]
      : baseNPCS

    const chapter = player.current_chapter || 1
    const npcs = NPCS.filter(n=>n.unlockChapter<=chapter)
    let activeNPC = null
    let itemMasters = {}

    // Load all item data upfront
    const { data: allItems } = await supabase.from('items').select('*')
    allItems?.forEach(i=>{ itemMasters[i.item_key]=i })

    document.getElementById('gold-display').textContent = `◈ ${player.gold||0}`

    // NPC list
    document.getElementById('npc-list').innerHTML = npcs.map(n=>`
      <div class="equip-slot" data-npc="${n.key}" style="cursor:pointer;margin-bottom:4px">
        <span class="slot-icon">${n.icon}</span>
        <div style="flex:1">
          <p style="font-family:'Cinzel',serif;font-size:.9rem;color:var(--ink);margin:0 0 1px">${n.name}</p>
          <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.75rem;color:var(--ink);margin:0">${n.title}</p>
        </div>
        <span style="color:var(--ink)">›</span>
      </div>
    `).join('')

    document.querySelectorAll('[data-npc]').forEach(el=>{
      el.addEventListener('click',()=>{
        activeNPC = npcs.find(n=>n.key===el.dataset.npc)
        renderNPCPanel()
      })
    })

    function renderNPCPanel() {
      const n = activeNPC
      if (!n) return
      const panel = document.getElementById('npc-panel')

      if (n.type==='trader' || n.type==='trader_with_bounties') {
        const rows = n.stock.filter(s=>s.chapterUnlock<=chapter).map(s=>{
          const item = itemMasters[s.itemKey]
          if (!item) return ''
          const canAfford = (player.gold||0) >= item.buy_price
          const imgSrc = getItemImg(s.itemKey)
          return `
            <div style="display:flex;align-items:center;gap:.6rem;padding:.75rem 0;border-bottom:.5px solid rgba(139,106,32,.15);flex-wrap:wrap">
              ${imgSrc
                ? `<img src="${imgSrc}" style="width:36px;height:36px;object-fit:contain;border-radius:4px;flex-shrink:0" onerror="this.outerHTML='<span style=\\'font-size:1.2rem\\'>${item.icon}</span>'">`
                : `<span style="font-size:1.2rem">${item.icon}</span>`}
              <div style="flex:1;min-width:0">
                <p style="font-family:'Cinzel',serif;font-size:.82rem;color:${RARITY[item.rarity]||'var(--ink-dim)'};margin:0 0 1px">${item.name}</p>
                <p style="font-family:'Share Tech Mono',monospace;font-size:.56rem;color:var(--ink);margin:0">
                  ${item.element&&item.element!=='none'?`[${item.element.toUpperCase()}] `:''}${item.item_type}${item.atk_bonus>0?` · ATK +${item.atk_bonus}`:''}${item.def_bonus>0?` · DEF +${item.def_bonus}`:''}${item.hp_restore>0?` · +${item.hp_restore}HP`:''}${(item.power_bonus||0)>0?` · PWR +${item.power_bonus}`:''}${(item.speed_bonus||0)>0?` · SPD +${item.speed_bonus}`:''}${(item.insight_bonus||0)>0?` · INS +${item.insight_bonus}`:''}
                </p>
              </div>
              <span style="font-family:'Cinzel',serif;font-size:.88rem;font-weight:600;color:${canAfford?'var(--gold)':'#c04040'}">◈${item.buy_price}</span>
              <button onclick="buyItem('${s.itemKey}')" ${canAfford?'':'disabled'} style="font-family:'Cinzel',serif;font-size:.7rem;color:var(--ink);background:rgba(200,184,128,.4);border:1px solid rgba(139,106,32,.5);padding:.3rem .75rem;cursor:pointer;border-radius:2px;opacity:${canAfford?1:.4}">Buy</button>
            </div>
          `
        }).join('')

        // Bounty tab — Pell only. Each bounty fires once. Already-purchased
        // hints display the hint text inline so the player can re-read.
        const hasBounties = n.type === 'trader_with_bounties' && Array.isArray(n.bounties)
        const bountyRows = hasBounties ? n.bounties.map(b => {
          const purchased = (player.alliance_log||[]).includes('bounty_'+b.key)
          const canAfford = (player.gold||0) >= b.goldCost
          if (purchased) {
            return `
              <div style="padding:.7rem 0;border-bottom:.5px solid rgba(139,106,32,.15)">
                <p style="font-family:'Cinzel',serif;font-size:.78rem;color:var(--ink-dim);margin:0 0 4px">✓ ${b.label}</p>
                <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.85rem;color:var(--ink);margin:0;line-height:1.5">${b.hint}</p>
              </div>`
          }
          return `
            <div style="display:flex;align-items:center;gap:.6rem;padding:.75rem 0;border-bottom:.5px solid rgba(139,106,32,.15);flex-wrap:wrap">
              <div style="flex:1;min-width:0">
                <p style="font-family:'Cinzel',serif;font-size:.82rem;color:var(--ink);margin:0 0 1px">${b.label}</p>
                <p style="font-family:'Share Tech Mono',monospace;font-size:.56rem;color:var(--ink-dim);margin:0">One-time purchase · unlocks a hint about Chapter 2</p>
              </div>
              <span style="font-family:'Cinzel',serif;font-size:.88rem;font-weight:600;color:${canAfford?'var(--gold)':'#c04040'}">◈${b.goldCost}</span>
              <button onclick="buyBounty('${b.key}','${b.goldCost}')" ${canAfford?'':'disabled'} style="font-family:'Cinzel',serif;font-size:.7rem;color:var(--ink);background:rgba(200,184,128,.4);border:1px solid rgba(139,106,32,.5);padding:.3rem .75rem;cursor:pointer;border-radius:2px;opacity:${canAfford?1:.4}">Buy</button>
            </div>`
        }).join('') : ''

        const bountyTab = hasBounties
          ? `<button id="tab-bounty" onclick="switchTab('bounty', '${n.key}')" style="font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.07em;padding:3px 14px;border-radius:20px;cursor:pointer;background:none;border:.5px solid rgba(139,106,32,.2);color:var(--ink)">INTEL</button>`
          : ''
        const bountyContent = hasBounties
          ? `<div id="tab-content-bounty" style="display:none">${bountyRows}</div>`
          : ''

        panel.innerHTML = `
          <p class="chapter-label">${n.title}</p>
          <h2 class="page-title">${n.name}</h2>
          <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.9rem;color:var(--ink);margin-bottom:.5rem">${n.dialogue}</p>
          <hr class="ink-divider">
          <div style="display:flex;gap:6px;margin-bottom:.75rem">
            <button id="tab-buy"  onclick="switchTab('buy',  '${n.key}')" style="font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.07em;padding:3px 14px;border-radius:20px;cursor:pointer;background:rgba(139,106,32,.2);border:.5px solid rgba(139,106,32,.5);color:var(--ink)">BUY</button>
            <button id="tab-sell" onclick="switchTab('sell', '${n.key}')" style="font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.07em;padding:3px 14px;border-radius:20px;cursor:pointer;background:none;border:.5px solid rgba(139,106,32,.2);color:var(--ink)">SELL</button>
            ${bountyTab}
          </div>
          <div id="tab-content-buy">${rows}</div>
          <div id="tab-content-sell" style="display:none"></div>
          ${bountyContent}
        `
      } else if (n.type==='runesmith') {
        const rows = n.services.map(s=>{
          const canAfford = (player.gold||0) >= s.goldCost
          return `
            <div style="display:flex;align-items:center;gap:.6rem;padding:.75rem 0;border-bottom:.5px solid rgba(139,106,32,.15)">
              <div style="flex:1">
                <p style="font-family:'Cinzel',serif;font-size:.82rem;color:var(--ink);margin:0 0 1px">${s.label}</p>
                <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.75rem;color:var(--ink);margin:0">${s.desc}</p>
              </div>
              <span style="font-family:'Cinzel',serif;font-size:.88rem;font-weight:600;color:${canAfford?'var(--gold)':'#c04040'}">◈${s.goldCost}</span>
              <button onclick="runesmith('${s.action}','${s.goldCost}')" ${canAfford?'':'disabled'} style="font-family:'Cinzel',serif;font-size:.7rem;color:var(--ink);background:rgba(200,184,128,.4);border:1px solid rgba(139,106,32,.5);padding:.3rem .75rem;cursor:pointer;border-radius:2px;opacity:${canAfford?1:.4}">Use</button>
            </div>
          `
        }).join('')
        panel.innerHTML = `
          <p class="chapter-label">${n.title}</p>
          <h2 class="page-title">${n.name}</h2>
          <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.9rem;color:var(--ink);margin-bottom:.5rem">${n.dialogue}</p>
          <hr class="ink-divider">
          <p style="font-family:'Share Tech Mono',monospace;font-size:.6rem;color:var(--ink);letter-spacing:.06em;margin-bottom:.75rem">Select the rarity of item you want to socket. Maximum sockets: Common=1, Uncommon=2, Rare=3, Epic=4, Legendary=5</p>
          <div>${rows}</div>
          <hr class="ink-divider">
          <a href="crafting.html" style="font-family:'Cinzel',serif;font-size:.78rem;letter-spacing:.08em;color:#a07de0;text-decoration:none;border:.5px solid #a07de040;padding:.35rem .9rem;border-radius:2px">
            ✦ Open Crafting Table →
          </a>
        `
      } else if (n.type==='healer') {
        const rows = n.services.map(s=>{
          const canAfford = (player.gold||0) >= s.goldCost
          return `
            <div style="display:flex;align-items:center;gap:.6rem;padding:.75rem 0;border-bottom:.5px solid rgba(139,106,32,.15)">
              <div style="flex:1">
                <p style="font-family:'Cinzel',serif;font-size:.82rem;color:var(--ink);margin:0 0 1px">${s.label}</p>
                <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.75rem;color:var(--ink);margin:0">${s.desc}</p>
              </div>
              <span style="font-family:'Cinzel',serif;font-size:.88rem;font-weight:600;color:${canAfford?'var(--gold)':'#c04040'}">◈${s.goldCost}</span>
              <button onclick="heal('${s.action}','${s.goldCost}')" ${canAfford?'':'disabled'} style="font-family:'Cinzel',serif;font-size:.7rem;color:var(--ink);background:rgba(200,184,128,.4);border:1px solid rgba(139,106,32,.5);padding:.3rem .75rem;cursor:pointer;border-radius:2px;opacity:${canAfford?1:.4}">Use</button>
            </div>
          `
        }).join('')

        panel.innerHTML = `
          <p class="chapter-label">${n.title}</p>
          <h2 class="page-title">${n.name}</h2>
          <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.9rem;color:var(--ink);margin-bottom:.5rem">${n.dialogue}</p>
          <hr class="ink-divider">
          <div>${rows}</div>
        `
      }
    }

    window.switchTab = async (tab, npcKey) => {
      const buyBtn    = document.getElementById('tab-buy')
      const sellBtn   = document.getElementById('tab-sell')
      const bountyBtn = document.getElementById('tab-bounty')
      const buyDiv    = document.getElementById('tab-content-buy')
      const sellDiv   = document.getElementById('tab-content-sell')
      const bountyDiv = document.getElementById('tab-content-bounty')
      if (!buyBtn) return

      // Reset all tab visuals to inactive
      const setInactive = (b) => { if (!b) return; b.style.background = 'none'; b.style.borderColor = 'rgba(139,106,32,.2)' }
      const setActive   = (b) => { if (!b) return; b.style.background = 'rgba(139,106,32,.2)'; b.style.borderColor = 'rgba(139,106,32,.5)' }
      setInactive(buyBtn); setInactive(sellBtn); setInactive(bountyBtn)
      if (buyDiv)    buyDiv.style.display = 'none'
      if (sellDiv)   sellDiv.style.display = 'none'
      if (bountyDiv) bountyDiv.style.display = 'none'

      if (tab === 'buy') {
        setActive(buyBtn)
        if (buyDiv) buyDiv.style.display = 'block'
        traderSellMode = false
        traderSellSelected.clear()
      } else if (tab === 'sell') {
        setActive(sellBtn)
        if (sellDiv) { sellDiv.style.display = 'block'; await renderSellTab(sellDiv) }
      } else if (tab === 'bounty') {
        setActive(bountyBtn)
        if (bountyDiv) bountyDiv.style.display = 'block'
      }
    }

    // ── Info bounty purchase (Pell) ────────────────────────────────────────
    // Deducts gold, adds a 'bounty_<key>' flag to alliance_log, re-renders
    // the NPC panel so the purchased hint is shown inline. The hint text
    // itself lives in the bounty definition — pulled out on the next render.
    window.buyBounty = async (bountyKey, goldCost) => {
      const cost = parseInt(goldCost, 10) || 0
      if ((player.gold||0) < cost) { window.showToast('Not enough gold', true); return }
      const log = [...(player.alliance_log||[]), 'bounty_'+bountyKey]
      const newGold = player.gold - cost
      await supabase.from('players').update({ gold: newGold, alliance_log: log }).eq('id', player.id)
      player.gold = newGold
      player.alliance_log = log
      document.getElementById('gold-display').textContent = '◈ ' + newGold
      window.showToast('Intel received from Pell.')
      // Re-render the panel so the hint text appears in the bounty tab
      renderNPCPanel()
      // Snap to the bounty tab automatically so the player can read the hint
      setTimeout(() => window.switchTab('bounty', activeNPC?.key || ''), 50)
    }

    async function renderSellTab(sellDiv) {
      sellDiv.innerHTML = '<p style="font-family:\'Share Tech Mono\',monospace;font-size:.6rem;color:var(--ink)">Loading...</p>'
      const { data: inv } = await supabase.from('inventory').select('*')
        .eq('player_id', player.id)
        .order('item_type')

      if (!inv || !inv.length) {
        sellDiv.innerHTML = '<p style="font-family:\'IM Fell English\',serif;font-style:italic;font-size:.85rem;color:var(--ink)">Nothing to sell.</p>'
        return
      }

      const sellable = inv.filter(i => !i.equipped_slot)
      if (!sellable.length) {
        sellDiv.innerHTML = '<p style="font-family:\'IM Fell English\',serif;font-style:italic;font-size:.85rem;color:var(--ink)">All items are currently equipped.</p>'
        return
      }

      const RC = {common:'#888',uncommon:'#5ec45e',rare:'#5eaee0',epic:'#a07de0',legendary:'#c8b96e',mythic:'#ff88ff'}
      const RUNE_ICONS = {ignis:'🔥',aqua:'💧',terra:'🪨',aero:'💨',umbra:'🌑',lux:'✨'}

      const totalSell = [...traderSellSelected].reduce((sum,id)=>{
        const it = sellable.find(i=>i.id===id)
        if(!it) return sum
        const sp = it.sell_price || Math.max(1, Math.floor((it.buy_price||20)*.4))
        return sum + sp * (it.quantity||1)
      },0)

      // Toolbar
      const modeBar = traderSellMode
        ? `<div style="display:flex;gap:5px;margin-bottom:.5rem;flex-wrap:wrap;align-items:center">
            <button onclick="traderToggleMode()" style="font-family:'Share Tech Mono',monospace;font-size:.55rem;padding:2px 8px;border-radius:20px;cursor:pointer;background:rgba(192,64,64,.15);border:.5px solid rgba(192,64,64,.5);color:#c04040">✕ Cancel</button>
            ${traderSellSelected.size>0
              ? `<button onclick="traderSellSelected_action()" style="font-family:'Share Tech Mono',monospace;font-size:.55rem;padding:2px 8px;border-radius:20px;cursor:pointer;background:rgba(139,106,32,.2);border:.5px solid rgba(139,106,32,.5);color:var(--ink)">Sell ${traderSellSelected.size} items ◈${totalSell}</button>
                 <button onclick="traderSelectAll()" style="font-family:'Share Tech Mono',monospace;font-size:.55rem;padding:2px 8px;border-radius:20px;cursor:pointer;background:none;border:.5px solid rgba(139,106,32,.2);color:var(--ink-dim)">Select All</button>`
              : '<span style="font-family:\'IM Fell English\',serif;font-style:italic;font-size:.72rem;color:var(--ink-dim)">Click items to select</span>'}
           </div>`
        : `<div style="margin-bottom:.5rem"><button onclick="traderToggleMode()" style="font-family:'Share Tech Mono',monospace;font-size:.55rem;padding:2px 8px;border-radius:20px;cursor:pointer;background:none;border:.5px solid rgba(139,106,32,.2);color:var(--ink-dim)">⊞ Multi-Sell</button></div>`

      sellDiv.innerHTML = modeBar + sellable.map(item => {
        const sellPrice = item.sell_price || Math.max(1, Math.floor((item.buy_price||20) * 0.4))
        const hasSocket = (item.sockets_total||0) > 0
        const hasRune   = (item.sockets_used||0) > 0
        const isRune    = item.item_type === 'material' && item.item_key?.startsWith('rune_')
        const runeKey   = isRune ? item.item_key.replace('rune_','') : null
        const imgSrc    = getItemImg(item.item_key)
        const isSelected= traderSellMode && traderSellSelected.has(item.id)

        return `
          <div onclick="${traderSellMode ? `traderToggleItem('${item.id}')` : ''}"
            style="display:flex;align-items:center;gap:.6rem;padding:.65rem 0;border-bottom:.5px solid rgba(139,106,32,.15);cursor:${traderSellMode?'pointer':'default'};${isSelected?'background:rgba(200,184,128,.2);margin:0 -4px;padding-left:4px;padding-right:4px;border-radius:3px;':''}">
            ${traderSellMode ? `<div style="width:14px;height:14px;border-radius:3px;border:1.5px solid ${isSelected?'#c8b96e':'rgba(139,106,32,.4)'};background:${isSelected?'#c8b96e':'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0">${isSelected?'<span style="font-size:.5rem;color:var(--ink)">✓</span>':''}</div>` : ''}
            ${imgSrc
              ? `<img src="${imgSrc}" style="width:32px;height:32px;object-fit:contain;border-radius:3px;flex-shrink:0" onerror="this.outerHTML='<span style=\\'font-size:1.1rem\\'>${isRune?(RUNE_ICONS[runeKey]||'💎'):(item.icon||'📦')}</span>'">`
              : `<span style="font-size:1.1rem">${isRune?(RUNE_ICONS[runeKey]||'💎'):(item.icon||'📦')}</span>`}
            <div style="flex:1;min-width:0">
              <p style="font-family:'Cinzel',serif;font-size:.8rem;color:${RC[item.rarity]||'var(--ink-dim)'};margin:0 0 1px">
                ${item.name}
                ${hasSocket?`<span style="font-family:'Share Tech Mono',monospace;font-size:.5rem;color:#a07de0;margin-left:4px">[${item.sockets_used||0}/${item.sockets_total}◈]</span>`:''}
              </p>
              <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink);margin:0">
                ${item.rarity} ${item.subtype||item.item_type}
                ${item.atk_bonus>0?` · ATK +${item.atk_bonus}`:''}
                ${item.def_bonus>0?` · DEF +${item.def_bonus}`:''}
                ${item.hp_restore>0?` · +${item.hp_restore}HP`:''}
                ${(item.quantity||1)>1?` · ×${item.quantity}`:''}
              </p>
              ${hasRune?'<p style="font-family:\'Share Tech Mono\',monospace;font-size:.5rem;color:#e05555;margin:1px 0 0">⚠ Runes lost on sell</p>':''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0">
              <span style="font-family:'Cinzel',serif;font-size:.82rem;font-weight:600;color:#c8b96e">◈${sellPrice}${(item.quantity||1)>1?' ea':''}</span>
              ${!traderSellMode ? `<button onclick="traderSellOne('${item.id}','${item.name}',${sellPrice},${item.quantity||1})" style="font-family:'Cinzel',serif;font-size:.65rem;color:var(--ink);background:rgba(200,184,128,.4);border:1px solid rgba(139,106,32,.5);padding:2px .6rem;cursor:pointer;border-radius:2px">Sell${(item.quantity||1)>1?' ×1':''}</button>` : ''}
              ${!traderSellMode && (item.quantity||1)>1 ? `<button onclick="traderSellAll('${item.id}','${item.name}',${sellPrice},${item.quantity||1})" style="font-family:'Cinzel',serif;font-size:.65rem;color:var(--ink);background:rgba(200,184,128,.25);border:1px solid rgba(139,106,32,.4);padding:2px .6rem;cursor:pointer;border-radius:2px">Sell All ◈${sellPrice*(item.quantity||1)}</button>` : ''}
            </div>
          </div>
        `
      }).join('')
    }

    window.traderToggleMode = () => {
      traderSellMode = !traderSellMode
      traderSellSelected.clear()
      const sd = document.getElementById('tab-content-sell')
      if (sd) renderSellTab(sd)
    }
    window.traderToggleItem = (id) => {
      if (traderSellSelected.has(id)) traderSellSelected.delete(id)
      else traderSellSelected.add(id)
      const sd = document.getElementById('tab-content-sell')
      if (sd) renderSellTab(sd)
    }
    window.traderSelectAll = async () => {
      const { data: inv } = await supabase.from('inventory').select('id').eq('player_id', player.id)
      const { data: equipped } = await supabase.from('inventory').select('id').eq('player_id', player.id).not('equipped_slot','is',null)
      const equippedIds = new Set((equipped||[]).map(i=>i.id))
      ;(inv||[]).filter(i=>!equippedIds.has(i.id)).forEach(i=>traderSellSelected.add(i.id))
      const sd = document.getElementById('tab-content-sell')
      if (sd) renderSellTab(sd)
    }
    window.traderSellSelected_action = async () => {
      if (!traderSellSelected.size) return
      const { data: inv } = await supabase.from('inventory').select('*').eq('player_id', player.id)
      const sellable = (inv||[]).filter(i=>traderSellSelected.has(i.id) && !i.equipped_slot)
      let total = 0
      for (const item of sellable) {
        const sp = item.sell_price || Math.max(1, Math.floor((item.buy_price||20)*.4))
        total += sp * (item.quantity||1)
        await supabase.from('inventory').delete().eq('id', item.id)
      }
      const newGold = (player.gold||0) + total
      await supabase.from('players').update({ gold: newGold }).eq('id', player.id)
      player.gold = newGold
      document.getElementById('gold-display').textContent = '◈ ' + newGold
      window.showToast('Sold ' + sellable.length + ' item(s) for ◈' + total)
      traderSellMode = false
      traderSellSelected.clear()
      const sd = document.getElementById('tab-content-sell')
      if (sd) renderSellTab(sd)
    }
    window.traderSellOne = async (itemId, itemName, sellPrice, qty) => {
      const newQty = qty - 1
      if (newQty <= 0) await supabase.from('inventory').delete().eq('id', itemId)
      else await supabase.from('inventory').update({ quantity: newQty }).eq('id', itemId)
      const newGold = (player.gold||0) + sellPrice
      await supabase.from('players').update({ gold: newGold }).eq('id', player.id)
      player.gold = newGold
      document.getElementById('gold-display').textContent = '◈ ' + newGold
      window.showToast('Sold ' + itemName + ' for ◈' + sellPrice)
      const sd = document.getElementById('tab-content-sell')
      if (sd) renderSellTab(sd)
    }
    window.traderSellAll = async (itemId, itemName, priceEach, qty) => {
      await supabase.from('inventory').delete().eq('id', itemId)
      const total = priceEach * qty
      const newGold = (player.gold||0) + total
      await supabase.from('players').update({ gold: newGold }).eq('id', player.id)
      player.gold = newGold
      document.getElementById('gold-display').textContent = '◈ ' + newGold
      window.showToast('Sold ' + qty + '× ' + itemName + ' for ◈' + total)
      const sd = document.getElementById('tab-content-sell')
      if (sd) renderSellTab(sd)
    }

    window.sellItem = async (itemId, itemName, sellPrice) => {
      await supabase.from('inventory').delete().eq('id', itemId)
      const newGold = (player.gold||0) + sellPrice
      await supabase.from('players').update({ gold: newGold }).eq('id', player.id)
      player.gold = newGold
      document.getElementById('gold-display').textContent = '◈ ' + newGold
      window.showToast('Sold ' + itemName + ' for ◈' + sellPrice)
      window.switchTab('sell', '')
    }

    window.buyItem = async (itemKey) => {
      const item = itemMasters[itemKey]
      if (!item||(player.gold||0)<item.buy_price) { window.showToast('Not enough gold',true); return }
      const newGold = player.gold - item.buy_price
      await supabase.from('players').update({gold:newGold}).eq('id',player.id)
      player.gold = newGold
      document.getElementById('gold-display').textContent = `◈ ${newGold}`
      // Add to inventory — stack if same item_key already exists
      const {data:ex} = await supabase.from('inventory').select('id,quantity').eq('player_id',player.id).eq('item_key',itemKey).maybeSingle()
      if (ex) {
        await supabase.from('inventory').update({quantity:ex.quantity+1}).eq('id',ex.id)
      } else {
        await supabase.from('inventory').insert({
          player_id:     player.id,
          item_key:      item.item_key,
          name:          item.name,
          item_type:     item.item_type,
          subtype:       item.subtype       || null,
          rarity:        item.rarity,
          icon:          item.icon,
          element:       item.element       || 'none',
          quantity:      1,
          atk_bonus:     item.atk_bonus     || 0,
          def_bonus:     item.def_bonus     || 0,
          hp_restore:    item.hp_restore    || 0,
          two_handed:    item.two_handed    || false,
          power_bonus:   item.power_bonus   || 0,
          control_bonus: item.control_bonus || 0,
          guard_bonus:   item.guard_bonus   || 0,
          speed_bonus:   item.speed_bonus   || 0,
          insight_bonus: item.insight_bonus || 0,
          luck_bonus:    item.luck_bonus    || 0,
          agility_bonus: item.agility_bonus || 0,
          max_hp_bonus:  item.max_hp_bonus  || 0,
          special_effect:item.special_effect|| null,
        })
      }
      // Log the trade — use correct column names
      await supabase.from('trade_log').insert({
        to_player:      player.id,
        item_key:       itemKey,
        quantity:       1,
        gold_exchanged: item.buy_price,
      })
      window.showToast(`Bought ${item.name}`)
      renderNPCPanel()
    }

    window.heal = async (action, cost) => {
      const goldCost = parseInt(cost)
      if ((player.gold||0)<goldCost) { window.showToast('Not enough gold',true); return }
      let newHp = player.hp||100
      const maxHp = player.max_hp||100
      if (action==='heal_full') newHp = maxHp
      if (action==='heal_half') newHp = Math.min(maxHp, newHp + Math.floor(maxHp*.5))
      const newGold = player.gold - goldCost
      await supabase.from('players').update({hp:newHp,gold:newGold}).eq('id',player.id)
      player.hp=newHp; player.gold=newGold
      document.getElementById('gold-display').textContent = `◈ ${newGold}`
      window.showToast(`Healed to ${newHp} HP`)
      renderNPCPanel()
    }

  return { player, cleanup() {} }
}

export default mountTrader
