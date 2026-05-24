import { supabase }  from '../supabase.js'

const MODULE_STYLE_ID = 'book-module-style-badges'
const MODULE_MARKUP = "<div class=\"book-wrap\">\n  \n  <div class=\"book animate-in\">\n    <div class=\"page-left parchment\">\n      <div class=\"page-inner\">\n        <p class=\"chapter-label\">Hall of Records</p>\n        <h1 class=\"page-title\">Earned Seals</h1>\n        <p id=\"earned-count\" style=\"font-family:'Share Tech Mono',monospace;font-size:.62rem;color:var(--ink-dim);letter-spacing:.06em;margin-bottom:.5rem\"></p>\n        <hr class=\"ink-divider\">\n        <div id=\"earned-seals\" style=\"display:grid;grid-template-columns:repeat(2,1fr);gap:1rem\"></div>\n        <p id=\"no-badges\" style=\"display:none;font-family:'IM Fell English',serif;font-style:italic;font-size:.88rem;color:var(--ink-dim)\">No seals earned yet. Complete Chapter 1 to begin.</p>\n      </div>\n    </div>\n        <div class=\"page-right parchment\">\n      <div class=\"page-inner\">\n        <p class=\"chapter-label\">Sealed Records</p>\n        <h2 class=\"page-title\">In Progress</h2>\n        <hr class=\"ink-divider\">\n        <div id=\"locked-badges\"></div>\n      </div>\n    </div>\n  </div>\n</div>"
const MODULE_STYLES = "\n    /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n       SUPERSEDE DARK THEME \u2014 Gold / Amber accent\n       Injected over main.css \u2014 no JS touched.\n    \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n        :root {\n      --bg-0:      #14110f;\n      --bg-1:      #2b1d16;\n      --panel:     #f4ead7;\n      --page-l:    #f4ead7;\n      --page-r:    #f1e4cf;\n      --ink:       #2b1d16;\n      --ink-dim:   #5c4638;\n      --ink-faint: #a08060;\n      --ice:       #7a5230;\n      --ice-hot:   #4b2e14;\n      --gold:      #c8a050;\n      --gold-hot:  #e0c070;\n      --gold-dim:  #a08040;\n      --amber:     #d09040;\n      --amber-hot: #e0a050;\n      --warn:      #e06050;\n      --line:      rgba(200,160,80,.30);\n      --green:     #5cae50;\n      --purple:    #8a50c0;\n      --spine-col: #2b1d16;\n    }\n    *, *::before, *::after { box-sizing:border-box; }\n        html, body {\n      background: radial-gradient(ellipse at 50% 0%, #2a1a0e 0%, #14110f 55%, #0d0b09 100%) !important;\n      color: var(--ink) !important;\n      font-family: 'Cormorant Garamond', Georgia, serif !important;\n      min-height: 100vh;\n      overflow-x: hidden;\n    }\n    body::after {\n      content: \"\"; position: fixed; inset: 0; pointer-events: none; z-index: 9998;\n      background: radial-gradient(ellipse 900px 900px at 50% 40%, rgba(180,120,60,.07) 0%, transparent 70%);\n    }\n        /* \u2500\u2500 BOOK \u2014 parchment open-book \u2500\u2500 */\n    .book, .craft-grid {\n      display: grid !important;\n      grid-template-columns: 1fr 1fr !important;\n      align-items: stretch !important;\n      gap: 0 !important;\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      box-shadow: none !important;\n      border-radius: 24px !important;\n      filter: drop-shadow(0 24px 60px rgba(0,0,0,.75)) drop-shadow(0 8px 20px rgba(0,0,0,.5)) !important;\n      transform: perspective(1600px) rotateX(2.5deg) !important;\n      transform-origin: 50% 0 !important;\n      margin-top: 10px !important;\n      overflow: hidden !important;\n    }\n    @media(max-width:860px){\n      .book, .craft-grid { grid-template-columns:1fr !important; transform:none !important; border-radius:12px !important; }\n    }\n    /* \u2500\u2500 PAGES \u2500\u2500 */\n    .parchment, .page-left, .page-right {\n      background: var(--panel) !important;\n      border: none !important;\n      border-radius: 0 !important;\n      box-shadow: none !important;\n      color: var(--ink) !important;\n      position: relative;\n      overflow-y: auto; overflow-x: hidden;\n    }\n    .page-left  { background: var(--page-l) !important; border-right: none !important; }\n    .page-right { background: var(--page-r) !important; border-left:  none !important; }\n    /* dot-texture grain */\n    .page-left::before, .page-right::before {\n      content: \"\" !important; position: absolute !important; inset: 0 !important;\n      pointer-events: none !important; z-index: 0 !important; opacity: .08 !important;\n      background-image: radial-gradient(circle, rgba(0,0,0,.25) 1px, transparent 1px) !important;\n      background-size: 12px 12px !important;\n    }\n    /* spine-edge shadows */\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    /* corner brackets */\n    .page-inner { padding: 28px 30px !important; position: relative; }\n    .page-inner::before {\n      content: \"\" !important; position: absolute !important;\n      top: 14px !important; left: 14px !important; width: 28px !important; height: 28px !important;\n      border-left: 1.5px solid rgba(138,91,68,.45) !important;\n      border-top: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-inner::after {\n      content: \"\" !important; position: absolute !important;\n      bottom: 14px !important; right: 14px !important; width: 28px !important; height: 28px !important;\n      border-right: 1.5px solid rgba(138,91,68,.45) !important;\n      border-bottom: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    /* \u2500\u2500 SPINE \u2500\u2500 */\n    .spine {\n      background: linear-gradient(180deg, #14120a 0%, #0e0c06 50%, #14120a 100%) !important;\n      border-left:  1px solid #2a2412 !important;\n      border-right: 1px solid #2a2412 !important;\n      position: relative; z-index: 5; width: 20px !important;\n      box-shadow: inset 2px 0 5px rgba(0,0,0,.5), inset -2px 0 5px rgba(0,0,0,.5) !important;\n    }\n    .spine::before {\n      content:\"\"; position:absolute; top:0; left:50%; width:1px; height:100%;\n      background:linear-gradient(180deg,transparent,rgba(200,168,74,.12) 30%,rgba(200,168,74,.12) 70%,transparent);\n    }\n    /* \u2500\u2500 TYPOGRAPHY \u2500\u2500 */\n    .chapter-label, .page-label {\n      font-family: 'JetBrains Mono', monospace !important;\n      font-size: 9.5px !important; letter-spacing: .42em !important;\n      text-transform: uppercase !important;\n      color: var(--gold) !important; margin-bottom: 5px !important;\n    }\n    .page-title, h1.page-title, h2.page-title {\n      font-family: 'Cormorant Garamond', serif !important;\n      font-size: 22px !important; font-weight: 500 !important;\n      letter-spacing: .04em !important; color: var(--ink) !important;\n      margin-bottom: 14px !important;\n    }\n    .ink-divider, hr.ink-divider {\n      border: none !important; border-top: 1px solid var(--line) !important;\n      margin: 12px 0 !important; opacity: 1 !important;\n    }\n    /* body text */\n    p, li, span { color: var(--ink) !important; }\n    /* \u2500\u2500 INLINE COLOURS \u2014 remap parchment browns to gold tones \u2500\u2500 */\n    [style*=\"color:var(--ink)\"] { color: var(--ink) !important; }\n    [style*=\"color:var(--ink-dim)\"] { color: var(--ink-dim) !important; }\n    [style*=\"color:var(--ink-dim)\"] { color: var(--gold-dim) !important; }\n    [style*=\"color:var(--ink-dim)\"] { color: var(--gold-dim) !important; }\n    [style*=\"color:#c8b96e\"] { color: var(--gold) !important; }\n    [style*=\"background:rgba(200,184,128\"] { background: rgba(200,168,74,.08) !important; }\n    [style*=\"border-color:rgba(139,106,32\"] { border-color: rgba(200,168,74,.25) !important; }\n    /* \u2500\u2500 BUTTONS / CHOICES \u2500\u2500 */\n    /* \u2500\u2500 STAT BARS \u2500\u2500 */\n    .stat-bar-wrap { background: rgba(255,255,255,.06) !important; border-radius:0 !important; }\n    .stat-key { color: var(--ink-dim) !important; font-family:'JetBrains Mono',monospace !important; font-size:.58rem !important; letter-spacing:.08em !important; }\n    .stat-val { color: var(--ink) !important; }\n    /* \u2500\u2500 MODALS / OVERLAYS \u2500\u2500 */\n    [id$=\"-window\"] > div, .end-box {\n      background: var(--panel) !important;\n      border: 1px solid var(--line) !important;\n      border-radius: 0 !important;\n    }\n    /* \u2500\u2500 SCROLLBAR \u2500\u2500 */\n    ::-webkit-scrollbar{width:5px}\n    ::-webkit-scrollbar-track{background:var(--bg-0)}\n    ::-webkit-scrollbar-thumb{background:var(--line)}\n    ::-webkit-scrollbar-thumb:hover{background:var(--gold-dim)}\n    /* \u2500\u2500 ANIMATE-IN \u2500\u2500 */\n    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}\n    .animate-in{animation:fadeIn .4s ease forwards}\n      /* \u2500\u2500 Book wrap \u2500\u2500 */\n    .book-wrap, .craft-grid-wrap {\n      background: transparent !important;\n      max-width: 1060px;\n      margin: 0 auto;\n      padding: 24px 24px 60px;\n    }\n    /* \u2500\u2500 Book \u2500\u2500 */\n    .book, .craft-grid {\n      display: grid !important;\n      grid-template-columns: 1fr 1fr !important;\n      align-items: stretch !important;\n      gap: 0 !important;\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      box-shadow: none !important;\n      border-radius: 24px !important;\n      filter: drop-shadow(0 24px 60px rgba(0,0,0,.75)) drop-shadow(0 8px 20px rgba(0,0,0,.5)) !important;\n      transform: perspective(1600px) rotateX(2.5deg) !important;\n      transform-origin: 50% 0 !important;\n      margin-top: 10px !important;\n      overflow: hidden !important;\n    }\n    @media(max-width:860px) {\n      .book, .craft-grid { grid-template-columns: 1fr !important; transform: none !important; border-radius: 12px !important; }\n    }\n    /* \u2500\u2500 Pages \u2500\u2500 */\n    .parchment, .page-left, .page-right {\n      background: var(--panel) !important;\n      border: none !important;\n      border-radius: 0 !important;\n      box-shadow: none !important;\n      color: var(--ink) !important;\n      position: relative;\n      overflow-y: auto; overflow-x: hidden;\n    }\n    .page-left::before, .page-right::before {\n      content: \"\" !important; position: absolute !important; inset: 0 !important;\n      pointer-events: none !important; z-index: 0 !important; opacity: .08 !important;\n      background-image: radial-gradient(circle, rgba(0,0,0,.25) 1px, transparent 1px) !important;\n      background-size: 12px 12px !important;\n    }\n    .page-left  { border-right: none !important; background: var(--page-l) !important; }\n    .page-right { border-left:  none !important; background: var(--page-r) !important; }\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-inner { padding: 28px 30px !important; position: relative; }\n    .page-inner::before {\n      content: \"\" !important; position: absolute !important;\n      top: 14px !important; left: 14px !important; width: 28px !important; height: 28px !important;\n      border-left: 1.5px solid rgba(138,91,68,.45) !important;\n      border-top: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-inner::after {\n      content: \"\" !important; position: absolute !important;\n      bottom: 14px !important; right: 14px !important; width: 28px !important; height: 28px !important;\n      border-right: 1.5px solid rgba(138,91,68,.45) !important;\n      border-bottom: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    /* \u2500\u2500 Spine \u2500\u2500 */\n    .spine {\n      background: linear-gradient(90deg,\n        rgba(0,0,0,.0) 0%, rgba(0,0,0,.20) 28%, rgba(0,0,0,.40) 46%,\n        rgba(0,0,0,.50) 50%, rgba(0,0,0,.40) 54%, rgba(0,0,0,.20) 72%, rgba(0,0,0,.0) 100%\n      ) !important;\n      border: none !important; position: relative; z-index: 5;\n      width: 22px !important; min-width: 22px !important;\n      margin: 0 !important; overflow: visible; box-shadow: none !important;\n    }\n    .spine::before {\n      content: \"\"; position: absolute; top: 0; bottom: 0; left: 50%; width: 1px;\n      transform: translateX(-50%);\n      background: linear-gradient(180deg, transparent 0%, rgba(43,29,22,.9) 8%, rgba(43,29,22,.9) 92%, transparent 100%);\n      z-index: 2;\n    }\n    .spine-inner, .spine-highlight, .spine-shadow,\n    .spine-title, .spine-rule, .spine-diamond, .spine-chapter { display: none !important; }\n    /* \u2500\u2500 Text & UI colours \u2500\u2500 */\n    h1, h2, h3, h4, h5, h6 { color: var(--ink) !important; }\n    .book p, .book li, .book span, .book label,\n    .book-wrap p, .book-wrap li, .book-wrap span, .book-wrap label { color: var(--ink) !important; }\n    input, select, textarea { background: rgba(43,29,22,.06) !important; border: 1px solid rgba(138,91,68,.35) !important; color: var(--ink) !important; border-radius: 0 !important; }\n    ::-webkit-scrollbar { width: 5px; }\n    ::-webkit-scrollbar-track { background: rgba(43,29,22,.15); }\n    ::-webkit-scrollbar-thumb { background: rgba(138,91,68,.35); }\n    ::-webkit-scrollbar-thumb:hover { background: var(--gold-dim); }\n  \n    @media (max-width: 800px) {\n      .book, .book-body, .craft-grid { flex-direction: column !important; min-height: auto; }\n      .page-left, .page-right { width: 100% !important; padding: 20px 16px !important; }\n      .book-wrap, .craft-grid-wrap { padding: 8px 12px 40px !important; }\n    }\n  "

function installModuleStyle() {
  document.querySelectorAll('style[data-book-module-style]').forEach(el => el.remove())
  const style = document.createElement('style')
  style.id = MODULE_STYLE_ID
  style.dataset.bookModuleStyle = 'true'
  style.textContent = MODULE_STYLES
  document.head.appendChild(style)
}

export async function mountBadges(__mountOptions = {}) {
  const host = __mountOptions.host || document.getElementById('book-module-host') || document.body
  installModuleStyle()
  host.innerHTML = MODULE_MARKUP

    const player = __mountOptions.player || await window.renderNav(__mountOptions.navId || 'nav')
    if (!player) throw new Error('no player')

    const ALL_BADGES = [
      {key:'survivor',      name:'Survivor',      icon:'🟡', rarity:'common',    desc:'Complete Chapter 1.',           ctype:'chapter', cval:1 },
      {key:'helper',        name:'Helper',        icon:'🟢', rarity:'uncommon',  desc:'Help 3 players.',               ctype:'helps',   cval:3 },
      {key:'hunter',        name:'Hunter',        icon:'🔴', rarity:'uncommon',  desc:'Defeat 5 players in PvP.',      ctype:'kills',   cval:5 },
      {key:'watcher_slain', name:'Watcher Slain', icon:'👁', rarity:'rare',      desc:'Defeat The Watcher.',           ctype:'boss',    cval:1 },
      {key:'elite',         name:'Elite',         icon:'🟣', rarity:'epic',      desc:'Reach level 10.',               ctype:'level',   cval:10},
      {key:'unknown',       name:'Unknown',       icon:'⚫', rarity:'legendary', desc:'????? hidden conditions ?????',  ctype:'hidden',  cval:0 },
    ]
    const RC = {common:'#c8c8c8',uncommon:'#5ec45e',rare:'#5eaee0',epic:'#a07de0',legendary:'#c8b96e'}


    const defeated = player.defeated_bosses || []
    const {data:earnedRows} = await supabase.from('player_badges').select('badge_key,earned_at').eq('player_id',player.id)
    const earnedKeys = new Set((earnedRows||[]).map(b=>b.badge_key))

    // ── Auto-award badges based on current player stats ──
    // For each badge, check if the player qualifies. If they do AND it's not
    // already earned, insert into player_badges. If the insert fails (RLS,
    // duplicate, etc.), log it so we can diagnose.
    function hasEarned(b) {
      switch(b.ctype) {
        case 'chapter': return (player.chapters_unlocked||[]).includes(2) || (player.current_chapter||1) >= 2
        case 'level':   return (player.level||1) >= b.cval
        case 'helps':   return (player.helps_given||0) >= b.cval
        case 'kills':   return (player.pvp_kills||0) >= b.cval
        case 'boss':    return defeated.some(k => k.includes('watcher'))
        case 'hidden':  return false
        default:        return false
      }
    }

    function getProgress(b) {
      switch(b.ctype) {
        case 'chapter': return (player.chapters_unlocked||[]).includes(2) ? 1 : 0
        case 'level':   return Math.min(b.cval, player.level||1)
        case 'helps':   return Math.min(b.cval, player.helps_given||0)
        case 'kills':   return Math.min(b.cval, player.pvp_kills||0)
        case 'boss':    return defeated.some(k=>k.includes('watcher')) ? 1 : 0
        default:        return 0
      }
    }

    console.log('[badges] player state:', {
      level: player.level,
      current_chapter: player.current_chapter,
      chapters_unlocked: player.chapters_unlocked,
      helps_given: player.helps_given,
      pvp_kills: player.pvp_kills,
      defeated_bosses: defeated,
    })
    console.log('[badges] already earned:', [...earnedKeys])

    for (const b of ALL_BADGES) {
      const qualifies = hasEarned(b)
      if (qualifies) console.log(`[badges] ${b.key} qualifies (already earned: ${earnedKeys.has(b.key)})`)
      if (!earnedKeys.has(b.key) && qualifies) {
        const {error} = await supabase.from('player_badges').insert({
          player_id: player.id,
          badge_key:  b.key,
          earned_at:  new Date().toISOString(),
        })
        if (error) {
          console.error(`[badges] FAILED to insert ${b.key}:`, error.message)
        } else {
          console.log(`[badges] inserted ${b.key}`)
          earnedKeys.add(b.key)
        }
      }
    }
    console.log('[badges] final earned set:', [...earnedKeys])

    const earned = ALL_BADGES.filter(b => earnedKeys.has(b.key))
    const locked  = ALL_BADGES.filter(b => !earnedKeys.has(b.key))

    document.getElementById('earned-count').textContent = `${earned.length} of ${ALL_BADGES.length} seals obtained`

    if (!earned.length) {
      document.getElementById('no-badges').style.display = 'block'
    } else {
      document.getElementById('earned-seals').innerHTML = earned.map(b => `
        <div class="seal">
          <div class="seal-wax" style="border-color:${RC[b.rarity]}80;box-shadow:0 0 12px ${RC[b.rarity]}40">
            <span class="seal-emoji">${b.icon}</span>
            <div class="seal-ring" style="border-color:${RC[b.rarity]}40"></div>
          </div>
          <p class="seal-name" style="color:${RC[b.rarity]}">${b.name}</p>
          <p class="seal-desc">${b.desc}</p>
          <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink-dim);letter-spacing:.1em;text-transform:uppercase">${b.rarity}</p>
        </div>
      `).join('')
    }

    document.getElementById('locked-badges').innerHTML = locked.map(b => {
      const prog   = b.cval > 0 ? Math.min(1, getProgress(b) / b.cval) : 0
      const rc     = RC[b.rarity]
      const hidden = b.ctype === 'hidden'
      return `
        <div style="display:flex;align-items:flex-start;gap:.75rem;padding:.8rem 0;border-bottom:.5px solid var(--line);opacity:.7">
          <span style="font-size:1.5rem;filter:grayscale(.7);flex-shrink:0">${b.icon}</span>
          <div style="flex:1;min-width:0">
            <p style="font-family:'Cinzel',serif;font-size:.82rem;color:var(--ink);margin:0 0 2px">${b.name}</p>
            <p style="font-family:'IM Fell English',serif;font-style:italic;font-size:.75rem;color:var(--ink-dim);margin:0 0 5px">${hidden ? '?????' : b.desc}</p>
            ${!hidden ? `
              <div class="prog-bar"><div class="prog-fill" style="width:${prog*100}%;background:${rc}"></div></div>
              <p style="font-family:'Share Tech Mono',monospace;font-size:.55rem;color:var(--ink-dim);letter-spacing:.06em">${getProgress(b)} / ${b.cval}</p>
            ` : ''}
          </div>
          <span style="font-family:'Share Tech Mono',monospace;font-size:.55rem;border:.5px solid ${rc}40;border-radius:20px;padding:1px 6px;letter-spacing:.08em;color:${rc};flex-shrink:0;margin-top:2px">${b.rarity}</span>
        </div>
      `
    }).join('')

  return { player, cleanup() {} }
}

export default mountBadges
