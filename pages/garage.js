import { supabase } from '../supabase.js'
import { renderNav } from '../components/nav.js'

const MODULE_STYLE_ID = 'book-module-style-garage'
const MODULE_MARKUP = "<div class=\"garage-wrap animate-in\">\n  <div class=\"garage-header\">\n    <div>\n      <div class=\"garage-title\">Garage</div>\n      <div class=\"garage-sub\">Build \u00b7 Upgrade \u00b7 Drive</div>\n    </div>\n    <button class=\"btn-secondary\" onclick=\"window.bookNavigate ? window.bookNavigate('book.html') : (location.href='book.html')\">\u2190 Book</button>\n  </div>\n\n  <!-- Materials strip -->\n  <div class=\"materials-strip\" id=\"materials-strip\">\n    <div class=\"mat-chip\">Loading...</div>\n  </div>\n\n  <!-- Vehicle select -->\n  <div class=\"section\">\n    <div class=\"section-label\">Your Vehicles</div>\n    <p style=\"font-family:'IM Fell English',serif;font-style:italic;font-size:.75rem;color:var(--ink-dim);margin-bottom:.85rem;line-height:1.6\">All three vehicles are permanently yours. Select one to drive, then install upgrades using your materials.</p>\n    <div class=\"vehicle-grid\" id=\"vehicle-grid\">Loading...</div>\n  </div>\n\n  <!-- Upgrades -->\n  <div class=\"section\" id=\"upgrade-section\" style=\"display:none\">\n    <div class=\"section-label\">Installed Upgrades</div>\n    <div class=\"upgrade-grid\" id=\"upgrade-grid\"></div>\n    <div class=\"action-row\">\n      <button class=\"btn-secondary\" id=\"upgrade-shop-btn\" onclick=\"openUpgradeShop()\">+ Install Upgrade</button>\n    </div>\n  </div>\n\n  <!-- Drive -->\n  <div class=\"drive-section\">\n    <button class=\"drive-btn\" id=\"drive-btn\" disabled onclick=\"drive()\">\u25b6 Drive</button>\n    <div class=\"drive-label\" id=\"drive-label\">Select a vehicle to drive</div>\n  </div>\n</div>\n\n<!-- Upgrade shop modal -->\n<div id=\"shop-modal\" style=\"display:none;position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.88);overflow-y:auto\">\n  <div class=\"shop-modal-inner\">\n    <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem\">\n      <div style=\"font-family:'Cinzel',serif;font-size:.88rem;color:var(--rust);letter-spacing:.08em\">Upgrade Shop</div>\n      <button onclick=\"closeUpgradeShop()\" style=\"background:rgba(255,255,255,.06);border:1px solid rgba(200,168,74,.2);color:var(--ink);font-size:.85rem;cursor:pointer;padding:3px 8px;border-radius:3px;font-family:'Share Tech Mono',monospace\">\u2715</button>\n    </div>\n    <div id=\"shop-list\"></div>\n  </div>\n</div>\n\n<div id=\"toast\"></div>"
const MODULE_STYLES = "\n        :root {\n      --bg-0:      #14110f;\n      --bg-1:      #2b1d16;\n      --panel:     #f4ead7;\n      --page-l:    #f4ead7;\n      --page-r:    #f1e4cf;\n      --ink:       #e8dcc2;\n      --ink-dim:   #a89272;\n      --ink-faint: #6f5d45;\n      --rust:      #c8512a;\n      --glow-r:    rgba(200,81,42,.5);\n      --ice:       #7a5230;\n      --ice-hot:   #4b2e14;\n      --gold:      #c8a050;\n      --gold-hot:  #e0c070;\n      --gold-dim:  #a08040;\n      --amber:     #d09040;\n      --amber-hot: #e0a050;\n      --warn:      #e06050;\n      --line:      rgba(200,160,80,.30);\n      --green:     #5cae50;\n      --purple:    #8a50c0;\n      --spine-col: #2b1d16;\n    }\n    *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }\n        html, body {\n      background: radial-gradient(ellipse at 50% 0%, #2a1a0e 0%, #14110f 55%, #0d0b09 100%) !important;\n      color: var(--ink) !important;\n      font-family: 'Cormorant Garamond', Georgia, serif !important;\n      min-height: 100vh;\n      overflow-x: hidden;\n    }\n    body::after {\n      content: \"\"; position: fixed; inset: 0; pointer-events: none; z-index: 9998;\n      background: radial-gradient(ellipse 900px 900px at 50% 40%, rgba(180,120,60,.07) 0%, transparent 70%);\n    }\n    /* road lines subtle overlay */\n    body::before {\n      content:''; position:fixed; inset:0; pointer-events:none; z-index:0;\n      background: repeating-linear-gradient(180deg,\n        transparent 0px, transparent 38px,\n        rgba(200,168,74,.015) 38px, rgba(200,168,74,.015) 40px);\n    }\n\n    .garage-wrap { position:relative; z-index:1; max-width:640px; margin:0 auto; padding:0 0 5rem; }\n\n    /* \u2500\u2500 Header \u2014 matches book/inventory banner style \u2500\u2500 */\n    .garage-header {\n      background: linear-gradient(180deg, rgba(14,18,8,.98), rgba(10,14,6,.95));\n      border-bottom: 2px solid var(--rust);\n      padding: 1.1rem 1.5rem .85rem;\n      display: flex; align-items: center; justify-content: space-between;\n      position: sticky; top: 0; z-index: 100;\n    }\n    .garage-title {\n      font-family: 'Cinzel', serif; font-size: 1.3rem; font-weight: 600;\n      color: var(--ink); letter-spacing: .08em;\n    }\n    .garage-sub { font-family:'Share Tech Mono',monospace; font-size:.5rem; color:var(--rust); letter-spacing:.2em; margin-top:3px; text-transform:uppercase; }\n\n    .materials-strip {\n      display:flex; gap:6px; flex-wrap:wrap;\n      padding:.65rem 1.5rem; background:rgba(0,0,0,.35);\n      border-bottom:.5px solid var(--line);\n    }\n    .mat-chip {\n      font-family:'Share Tech Mono',monospace; font-size:.5rem;\n      padding:2px 8px; border-radius:10px;\n      border:.5px solid rgba(200,168,74,.2); color:var(--ink-dim);\n      background:rgba(0,0,0,.3);\n    }\n    .mat-chip span { color:var(--gold); }\n\n    /* \u2500\u2500 Section \u2500\u2500 */\n    .section { padding:1rem 1.5rem; border-bottom:.5px solid var(--line); }\n    .section-label {\n      font-family:'Cinzel',serif; font-size:.7rem; font-weight:600;\n      color:var(--rust); letter-spacing:.1em; margin-bottom:.85rem;\n      display:flex; align-items:center; gap:.5rem; text-transform:uppercase;\n    }\n    .section-label::after { content:''; flex:1; height:1px; background:linear-gradient(to right, var(--rust), transparent); }\n\n    /* \u2500\u2500 Vehicle cards \u2014 horizontal with side image \u2500\u2500 */\n    .vehicle-grid { display:flex; flex-direction:column; gap:.85rem; }\n    .vehicle-card {\n      border:1px solid rgba(200,168,74,.15); border-radius:4px;\n      padding:0; cursor:pointer; transition:all .2s; position:relative;\n      background:rgba(0,0,0,.3); overflow:hidden;\n      display:grid; grid-template-columns:130px 1fr;\n    }\n    .vehicle-card:hover { border-color:rgba(200,168,74,.35); background:rgba(200,168,74,.04); }\n    .vehicle-card.selected { border-color:var(--rust); background:rgba(200,81,42,.06); box-shadow:0 0 20px rgba(200,81,42,.18); }\n\n    /* Vehicle image panel */\n    .vehicle-img-panel {\n      background: linear-gradient(135deg, rgba(0,0,0,.6), rgba(14,10,6,.8));\n      border-right:.5px solid rgba(200,168,74,.1);\n      display:flex; align-items:center; justify-content:center;\n      padding:.75rem; position:relative; overflow:hidden; min-height:110px;\n    }\n    .vehicle-img-panel::before {\n      content:''; position:absolute; inset:0;\n      background: repeating-linear-gradient(90deg, transparent 0, transparent 18px, rgba(200,168,74,.015) 18px, rgba(200,168,74,.015) 20px);\n    }\n    .vehicle-side-img {\n      width:110px; height:70px; object-fit:contain;\n      filter: drop-shadow(0 4px 12px rgba(0,0,0,.8));\n      position:relative; z-index:1;\n      transition: filter .3s;\n    }\n    .vehicle-card.selected .vehicle-side-img {\n      filter: drop-shadow(0 4px 18px rgba(200,81,42,.5));\n    }\n    /* road strip under vehicle */\n    .vehicle-img-panel::after {\n      content:''; position:absolute; bottom:12px; left:10%; right:10%; height:3px;\n      background: linear-gradient(90deg, transparent, rgba(200,168,74,.25), transparent);\n      border-radius:2px;\n    }\n\n    /* Vehicle info */\n    .vehicle-info { padding:.75rem .9rem; display:flex; flex-direction:column; justify-content:space-between; }\n    .vehicle-name { font-family:'Cinzel',serif; font-size:.88rem; font-weight:600; color:var(--ink); margin-bottom:1px; }\n    .vehicle-tagline { font-family:'IM Fell English',serif; font-style:italic; font-size:.7rem; color:var(--ink-dim); margin-bottom:.55rem; }\n\n    .stat-bars { display:flex; flex-direction:column; gap:3px; }\n    .stat-row-v { display:flex; align-items:center; gap:.45rem; }\n    .stat-lbl { font-family:'Share Tech Mono',monospace; font-size:.42rem; color:var(--ink-dim); width:56px; letter-spacing:.04em; text-transform:uppercase; }\n    .stat-track { flex:1; height:4px; background:rgba(255,255,255,.06); border-radius:2px; overflow:hidden; }\n    .stat-fill { height:100%; border-radius:2px; transition:width .4s; }\n    .stat-val-v { font-family:'Share Tech Mono',monospace; font-size:.46rem; color:var(--ink-dim); width:24px; text-align:right; }\n\n    .active-badge {\n      position:absolute; top:.5rem; right:.5rem; z-index:2;\n      font-family:'Share Tech Mono',monospace; font-size:.42rem; color:var(--rust);\n      border:.5px solid var(--rust); padding:2px 7px; border-radius:10px; letter-spacing:.08em;\n      animation:pulse 2s infinite;\n    }\n    .upgcount-badge {\n      position:absolute; bottom:.5rem; right:.5rem; z-index:2;\n      font-family:'Share Tech Mono',monospace; font-size:.42rem; color:var(--gold);\n      background:rgba(200,168,74,.1); border:.5px solid rgba(200,168,74,.25);\n      padding:2px 7px; border-radius:10px;\n    }\n    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }\n\n    /* \u2500\u2500 Upgrade slots \u2500\u2500 */\n    .upgrade-grid { display:grid; grid-template-columns:1fr 1fr; gap:.55rem; }\n    .upgrade-slot {\n      border:.5px solid rgba(200,168,74,.15); border-radius:3px; padding:.6rem .7rem;\n      background:rgba(0,0,0,.25); transition:all .2s;\n    }\n    .upgrade-slot.installed { border-color:var(--rust); background:rgba(200,81,42,.05); }\n    .slot-type { font-family:'Share Tech Mono',monospace; font-size:.42rem; color:var(--ink-dim); letter-spacing:.08em; margin-bottom:3px; text-transform:uppercase; }\n    .slot-name { font-family:'Cinzel',serif; font-size:.6rem; color:var(--ink); margin-bottom:3px; }\n    .slot-effect { font-family:'Share Tech Mono',monospace; font-size:.46rem; color:var(--ink-dim); line-height:1.4; }\n\n    /* \u2500\u2500 Action buttons \u2500\u2500 */\n    .action-row { display:flex; gap:.5rem; margin-top:.85rem; flex-wrap:wrap; }\n    .btn-primary {\n      flex:1; font-family:'Cinzel',serif; font-size:.65rem; font-weight:600;\n      letter-spacing:.08em; padding:.6rem 1rem; border-radius:3px; cursor:pointer;\n      background:linear-gradient(135deg,#5a1000,var(--rust));\n      border:1px solid var(--rust); color:#fff; transition:all .2s;\n    }\n    .btn-primary:hover { box-shadow:0 0 20px var(--glow-r); transform:translateY(-1px); }\n    .btn-primary:disabled { opacity:.35; cursor:not-allowed; transform:none; box-shadow:none; }\n    .btn-secondary {\n      font-family:'Share Tech Mono',monospace; font-size:.52rem; padding:.55rem .9rem;\n      border:.5px solid rgba(200,168,74,.2); background:none; color:var(--ink-dim);\n      border-radius:3px; cursor:pointer; transition:all .2s; letter-spacing:.04em;\n    }\n    .btn-secondary:hover { border-color:var(--gold); color:var(--gold); }\n\n    /* \u2500\u2500 Drive section \u2500\u2500 */\n    .drive-section {\n      padding:1.25rem 1.5rem; text-align:center;\n      background:linear-gradient(180deg,transparent,rgba(200,81,42,.04));\n      border-top:.5px solid var(--line);\n    }\n    .drive-btn {\n      width:100%; font-family:'Cinzel',serif; font-size:1rem; font-weight:600;\n      letter-spacing:.2em; padding:1rem; border-radius:4px; cursor:pointer;\n      background:linear-gradient(135deg,#5a1000,#c8512a,#e06030);\n      border:2px solid var(--rust); color:#fff;\n      box-shadow:0 0 30px rgba(200,81,42,.25); transition:all .25s;\n    }\n    .drive-btn:hover { box-shadow:0 0 50px rgba(200,81,42,.55); transform:scale(1.02); }\n    .drive-btn:disabled { opacity:.3; cursor:not-allowed; transform:none; box-shadow:none; }\n    .drive-label { font-family:'Share Tech Mono',monospace; font-size:.48rem; color:var(--ink-dim); letter-spacing:.1em; margin-top:.5rem; text-transform:uppercase; }\n\n    /* \u2500\u2500 Toast \u2500\u2500 */\n    #toast {\n      position:fixed; bottom:1.5rem; left:50%; transform:translateX(-50%) translateY(20px);\n      background:rgba(10,14,6,.95); border:1px solid var(--rust); border-radius:3px;\n      padding:.5rem 1.2rem; font-family:'Share Tech Mono',monospace; font-size:.58rem;\n      color:var(--ink); opacity:0; transition:all .3s; pointer-events:none;\n      white-space:nowrap; z-index:999;\n    }\n    #toast.show { opacity:1; transform:translateX(-50%) translateY(0); }\n\n    /* \u2500\u2500 Shop modal \u2500\u2500 */\n    .shop-modal-inner {\n      max-width:460px; margin:2rem auto; padding:1.25rem;\n      background:#0a0e06; border:1px solid var(--rust); border-radius:5px;\n    }\n    /* \u2500\u2500 Scrollbar \u2500\u2500 */\n    ::-webkit-scrollbar{width:5px}\n    ::-webkit-scrollbar-track{background:var(--bg-0)}\n    ::-webkit-scrollbar-thumb{background:var(--line)}\n    ::-webkit-scrollbar-thumb:hover{background:var(--gold-dim)}\n    /* \u2500\u2500 Animate \u2500\u2500 */\n    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}\n    .animate-in{animation:fadeIn .4s ease forwards}\n      /* \u2500\u2500 Book wrap \u2500\u2500 */\n    .book-wrap, .craft-grid-wrap {\n      background: transparent !important;\n      max-width: 1060px;\n      margin: 0 auto;\n      padding: 24px 24px 60px;\n    }\n    /* \u2500\u2500 Book \u2500\u2500 */\n    .book, .craft-grid {\n      display: grid !important;\n      grid-template-columns: 1fr 1fr !important;\n      align-items: stretch !important;\n      gap: 0 !important;\n      background: transparent !important;\n      border: 1px solid rgba(138,91,68,.30) !important;\n      box-shadow: none !important;\n      border-radius: 24px !important;\n      filter: drop-shadow(0 24px 60px rgba(0,0,0,.75)) drop-shadow(0 8px 20px rgba(0,0,0,.5)) !important;\n      transform: perspective(1600px) rotateX(2.5deg) !important;\n      transform-origin: 50% 0 !important;\n      margin-top: 10px !important;\n      overflow: hidden !important;\n    }\n    @media(max-width:860px) {\n      .book, .craft-grid { grid-template-columns: 1fr !important; transform: none !important; border-radius: 12px !important; }\n    }\n    /* \u2500\u2500 Pages \u2500\u2500 */\n    .parchment, .page-left, .page-right {\n      background: var(--panel) !important;\n      border: none !important;\n      border-radius: 0 !important;\n      box-shadow: none !important;\n      color: var(--ink) !important;\n      position: relative;\n      overflow-y: auto; overflow-x: hidden;\n    }\n    .page-left::before, .page-right::before {\n      content: \"\" !important; position: absolute !important; inset: 0 !important;\n      pointer-events: none !important; z-index: 0 !important; opacity: .08 !important;\n      background-image: radial-gradient(circle, rgba(0,0,0,.25) 1px, transparent 1px) !important;\n      background-size: 12px 12px !important;\n    }\n    .page-left  { border-right: none !important; background: var(--page-l) !important; }\n    .page-right { border-left:  none !important; background: var(--page-r) !important; }\n    .page-left::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; right: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to right, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-right::after {\n      content: \"\" !important;\n      position: absolute !important;\n      top: 0 !important; bottom: 0 !important; left: 0 !important;\n      width: 60px !important;\n      background: linear-gradient(to left, transparent 0%, rgba(100,60,10,.08) 40%, rgba(60,30,5,.22) 100%) !important;\n      pointer-events: none !important;\n      z-index: 2 !important;\n    }\n    .page-inner { padding: 28px 30px !important; position: relative; }\n    .page-inner::before {\n      content: \"\" !important; position: absolute !important;\n      top: 14px !important; left: 14px !important; width: 28px !important; height: 28px !important;\n      border-left: 1.5px solid rgba(138,91,68,.45) !important;\n      border-top: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    .page-inner::after {\n      content: \"\" !important; position: absolute !important;\n      bottom: 14px !important; right: 14px !important; width: 28px !important; height: 28px !important;\n      border-right: 1.5px solid rgba(138,91,68,.45) !important;\n      border-bottom: 1.5px solid rgba(138,91,68,.45) !important;\n      pointer-events: none !important;\n    }\n    /* \u2500\u2500 Spine \u2500\u2500 */\n    .spine {\n      background: linear-gradient(90deg,\n        rgba(0,0,0,.0) 0%, rgba(0,0,0,.20) 28%, rgba(0,0,0,.40) 46%,\n        rgba(0,0,0,.50) 50%, rgba(0,0,0,.40) 54%, rgba(0,0,0,.20) 72%, rgba(0,0,0,.0) 100%\n      ) !important;\n      border: none !important; position: relative; z-index: 5;\n      width: 22px !important; min-width: 22px !important;\n      margin: 0 !important; overflow: visible; box-shadow: none !important;\n    }\n    .spine::before {\n      content: \"\"; position: absolute; top: 0; bottom: 0; left: 50%; width: 1px;\n      transform: translateX(-50%);\n      background: linear-gradient(180deg, transparent 0%, rgba(43,29,22,.9) 8%, rgba(43,29,22,.9) 92%, transparent 100%);\n      z-index: 2;\n    }\n    .spine-inner, .spine-highlight, .spine-shadow,\n    .spine-title, .spine-rule, .spine-diamond, .spine-chapter { display: none !important; }\n    /* \u2500\u2500 Text & UI colours \u2500\u2500 */\n    h1, h2, h3, h4, h5, h6 { color: var(--ink) !important; }\n    .book p, .book li, .book span, .book label,\n    .book-wrap p, .book-wrap li, .book-wrap span, .book-wrap label { color: var(--ink) !important; }\n    button:not(.bm-signout), .btn { background: rgba(43,29,22,.08); border: 1px solid rgba(138,91,68,.35); color: var(--ink); border-radius: 0; cursor: pointer; transition: border-color .2s, color .2s; }\n    button:hover, .btn:hover { border-color: var(--gold) !important; color: var(--gold) !important; }\n    input, select, textarea { background: rgba(43,29,22,.06) !important; border: 1px solid rgba(138,91,68,.35) !important; color: var(--ink) !important; border-radius: 0 !important; }\n    ::-webkit-scrollbar { width: 5px; }\n    ::-webkit-scrollbar-track { background: rgba(43,29,22,.15); }\n    ::-webkit-scrollbar-thumb { background: rgba(138,91,68,.35); }\n    ::-webkit-scrollbar-thumb:hover { background: var(--gold-dim); }\n  \n    @media (max-width: 800px) {\n      .book, .book-body, .craft-grid { flex-direction: column !important; min-height: auto; }\n      .page-left, .page-right { width: 100% !important; padding: 20px 16px !important; }\n      .book-wrap, .craft-grid-wrap { padding: 8px 12px 40px !important; }\n    }\n  "

function installModuleStyle() {
  document.querySelectorAll('style[data-book-module-style]').forEach(el => el.remove())
  const style = document.createElement('style')
  style.id = MODULE_STYLE_ID
  style.dataset.bookModuleStyle = 'true'
  style.textContent = MODULE_STYLES
  document.head.appendChild(style)
}

export async function mountGarage(__mountOptions = {}) {
  const host = __mountOptions.host || document.getElementById('book-module-host') || document.body
  installModuleStyle()
  host.innerHTML = MODULE_MARKUP

  // If the host page already has the player (book.html embed), still
  // call renderNav so the bookmark nav mounts into <div id="nav"> on
  // top of the host. Standalone mode does its usual auth-redirect-on-fail.
  let player = __mountOptions.player
  if (player) {
    // Don't block on this; nav will paint when ready.
    renderNav(__mountOptions.navId || 'nav').catch(e => console.warn('[garage] nav render failed', e))
  } else {
    player = await renderNav(__mountOptions.navId || 'nav')
  }


  // ── Vehicle definitions ───────────────────────────────────
  const VEHICLES = {
    motorcycle: {
      icon: '🏍️', name: 'Motorcycle', tagline: 'Fast. Fragile. Furious.',
      base: { speed:90, durability:30, firepower:50 },
      color: '#e05555',
      cost: { scrap_metal:5, flashlight:2 },
      desc: 'High speed lets you dodge incoming Eyes. Low armor means every hit counts. The right parts can make it last.',
    },
    car: {
      icon: '🚗', name: 'Car', tagline: 'Balanced. Reliable. Ready.',
      base: { speed:60, durability:60, firepower:60 },
      color: '#5eaee0',
      cost: { scrap_metal:10, flashlight:3 },
      desc: 'The all-rounder. Upgrades push it in any direction. The most flexible platform.',
    },
    van: {
      icon: '🚐', name: 'Van', tagline: 'Slow. Armored. Overwhelming.',
      base: { speed:30, durability:90, firepower:70 },
      color: '#5ec45e',
      cost: { scrap_metal:15, flashlight:5, scrap_blade:2 },
      desc: 'Takes everything and keeps moving. The right engine parts make it surprisingly fast.',
    },
  }

  // ── Upgrade definitions ───────────────────────────────────
  const UPGRADES = [
    // Engine upgrades
    { id:'eng_boost',   slot:'engine',  name:'Turbo Coil',       effect:'+20 Speed',                   icon:'⚡', cost:{scrap_metal:4,flashlight:2},  stat:{speed:20},     vehicles:['motorcycle','car','van'] },
    { id:'eng_heavy',   slot:'engine',  name:'Heavy Engine',     effect:'+10 Speed, +10 Durability',   icon:'⚙️', cost:{scrap_metal:8},                stat:{speed:10,durability:10}, vehicles:['car','van'] },
    { id:'eng_lite',    slot:'engine',  name:'Lite Frame',       effect:'+30 Speed, -10 Durability',   icon:'💨', cost:{scrap_metal:5,scrap_blade:1},  stat:{speed:30,durability:-10}, vehicles:['motorcycle'] },
    // Armor upgrades
    { id:'arm_plate',   slot:'armor',   name:'Scrap Plate',      effect:'+25 Durability',              icon:'🛡', cost:{scrap_metal:6},                stat:{durability:25}, vehicles:['motorcycle','car','van'] },
    { id:'arm_reactive',slot:'armor',   name:'Reactive Mesh',    effect:'+15 Durability, reflect dmg', icon:'⚙️', cost:{scrap_metal:8,scrap_blade:2},  stat:{durability:15}, vehicles:['car','van'] },
    { id:'arm_shield',  slot:'armor',   name:'Flash Shield',     effect:'+20 Durability, blinds Eyes', icon:'🔦', cost:{scrap_metal:4,flashlight:4},   stat:{durability:20}, vehicles:['motorcycle','car','van'] },
    // Weapon upgrades
    { id:'wpn_cannon',  slot:'weapon',  name:'Scrap Cannon',     effect:'+25 Firepower',               icon:'💥', cost:{scrap_metal:5,scrap_blade:3},  stat:{firepower:25},  vehicles:['car','van'] },
    { id:'wpn_rapid',   slot:'weapon',  name:'Rapid Fire Kit',   effect:'+15 Firepower, faster fire',  icon:'🔫', cost:{scrap_metal:4,flashlight:1},   stat:{firepower:15},  vehicles:['motorcycle','car'] },
    { id:'wpn_beam',    slot:'weapon',  name:'Flash Beam',       effect:'+20 Firepower, pierces Eyes', icon:'🔦', cost:{scrap_metal:3,flashlight:6},   stat:{firepower:20},  vehicles:['motorcycle','car','van'] },
    // Special upgrades
    { id:'spc_boost',   slot:'special', name:'Nitro Tank',       effect:'Burst speed on demand',       icon:'🔥', cost:{scrap_metal:6,scrap_blade:2},  stat:{},              vehicles:['motorcycle','car'] },
    { id:'spc_drone',   slot:'special', name:'Eye Drone',        effect:'Auto-targets nearest Eye',    icon:'👁', cost:{scrap_metal:5,flashlight:3},   stat:{firepower:5},   vehicles:['car','van'] },
    { id:'spc_repair',  slot:'special', name:'Repair Kit',       effect:'Regen 5 Durability/sec',      icon:'🔧', cost:{scrap_metal:8,flashlight:2},   stat:{},              vehicles:['motorcycle','car','van'] },
  ]

  const MAT_ICONS = {
    scrap_metal:'⚙️', flashlight:'🔦', scrap_blade:'🗡️',
    scrap_helm:'🪖', scrap_shield:'🛡', energy_drink:'🥤',
    medkit:'💊', knife:'🔪', worn_boots:'👢',
  }
  const MAT_NAMES = {
    scrap_metal:'Scrap Metal', flashlight:'Flashlight', scrap_blade:'Scrap Blade',
    scrap_helm:'Scrap Helm', scrap_shield:'Scrap Shield', energy_drink:'Energy Drink',
    medkit:'Medkit', knife:'Knife', worn_boots:'Worn Boots',
  }

  let materials = {}  // item_key → quantity
  let vehicleData = null  // from players table: { type, parts, upgrades[] }

  // ── vehicle_data shape: { active:'car', upgrades:{motorcycle:[],car:[],van:[]} }
  // All 3 vehicles are always owned. active = which one is selected to drive.

  // ── Normalise legacy vehicle_data ────────────────────────
  function normaliseVehicleData(raw) {
    if (!raw) return { active: null, upgrades: { motorcycle:[], car:[], van:[] } }
    // Legacy: { type:'car', upgrades:[] }
    if (raw.type !== undefined && !raw.active) {
      return {
        active: raw.type,
        upgrades: {
          motorcycle: [],
          car: raw.type === 'car' ? (raw.upgrades||[]) : [],
          van: raw.type === 'van' ? (raw.upgrades||[]) : [],
        }
      }
    }
    // Already new format
    if (!raw.upgrades?.motorcycle) raw.upgrades = { motorcycle:[], car:[], van:[] }
    return raw
  }

  // ── Init ─────────────────────────────────────────────────
  if (!player) throw new Error('no player')

  const urlDest = new URLSearchParams(window.location.search).get('dest')
  const destination = urlDest ? parseInt(urlDest) : null

  vehicleData = normaliseVehicleData(player.vehicle_data)
  const VEHICLE_IMGS = {
    motorcycle: '../assets/ride/side_motorcycle.webp',
    car:        '../assets/ride/side_car.webp',
    van:        '../assets/ride/side_van.webp',
  }

  await loadMaterials()
  renderMaterials()
  renderVehicleGrid()
  renderUpgrades()
  updateDriveButton()

  if (destination) {
    document.getElementById('drive-label').textContent = `DESTINATION: CHAPTER ${destination}`
  }

  // ── Load materials from inventory ─────────────────────────
  async function loadMaterials() {
    const matKeys = Object.keys(MAT_ICONS)
    const { data } = await supabase.from('inventory')
      .select('item_key,quantity')
      .eq('player_id', player.id)
      .in('item_key', matKeys)
    materials = {}
    if (data) data.forEach(r => { materials[r.item_key] = r.quantity })
  }

  // ── Render materials strip ────────────────────────────────
  function renderMaterials() {
    const el = document.getElementById('materials-strip')
    const mats = Object.entries(materials).filter(([,q]) => q > 0)
    if (!mats.length) {
      el.innerHTML = `<span class="mat-chip" style="color:#5a4825">No materials — farm Chapter 1 enemies</span>`
      return
    }
    el.innerHTML = mats.map(([key, qty]) =>
      `<span class="mat-chip">${MAT_ICONS[key]||'📦'} ${MAT_NAMES[key]||key} <span>×${qty}</span></span>`
    ).join('')
  }

  // ── Vehicle side images ───────────────────────────────────
  // ── Render vehicle grid ───────────────────────────────────
  function renderVehicleGrid() {
    const el = document.getElementById('vehicle-grid')
    el.innerHTML = Object.entries(VEHICLES).map(([type, v]) => {
      const isActive = vehicleData.active === type
      const stats = computeStats(type)
      const statBars = [
        { label:'SPEED',     val:stats.speed,      max:130, color:'#5eaee0' },
        { label:'DURABILITY',val:stats.durability,  max:130, color:'#5ec45e' },
        { label:'FIREPOWER', val:stats.firepower,   max:130, color:'#e05555' },
      ]
      const upgCount = (vehicleData.upgrades?.[type]||[]).length
      return `
        <div class="vehicle-card${isActive?' selected':''}" onclick="selectVehicle('${type}')">
          ${isActive ? `<div class="active-badge">◉ Active</div>` : ''}
          ${upgCount > 0 ? `<div class="upgcount-badge">${upgCount} upgrade${upgCount>1?'s':''}</div>` : ''}
          <div class="vehicle-img-panel">
            <img class="vehicle-side-img" src="${VEHICLE_IMGS[type]}" alt="${v.name}"
              onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<div style=\\'font-size:2.5rem;opacity:.5\\'>${v.icon}</div>')">
          </div>
          <div class="vehicle-info">
            <div>
              <div class="vehicle-name">${v.name}</div>
              <div class="vehicle-tagline">${v.tagline}</div>
            </div>
            <div class="stat-bars">
              ${statBars.map(s => `
                <div class="stat-row-v">
                  <div class="stat-lbl">${s.label}</div>
                  <div class="stat-track">
                    <div class="stat-fill" style="width:${Math.min(100,s.val/s.max*100)}%;background:${s.color}"></div>
                  </div>
                  <div class="stat-val-v">${s.val}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>`
    }).join('')
  }

  function computeStats(type) {
    const base = { ...VEHICLES[type].base }
    const typeUpgrades = vehicleData.upgrades?.[type] || []
    typeUpgrades.forEach(uid => {
      const u = UPGRADES.find(u => u.id === uid)
      if (!u) return
      Object.entries(u.stat).forEach(([k,v]) => { base[k] = (base[k]||0) + v })
    })
    return base
  }

  function canAffordVehicle(type) {
    return Object.entries(VEHICLES[type].cost).every(([k,n]) => (materials[k]||0) >= n)
  }

  // ── Select active vehicle (all are owned, just pick which to drive) ───────
  window.selectVehicle = async function(type) {
    vehicleData.active = type
    if (!vehicleData.upgrades) vehicleData.upgrades = { motorcycle:[], car:[], van:[] }
    await supabase.from('players').update({ vehicle_data: vehicleData }).eq('id', player.id)
    player.vehicle_data = vehicleData
    toast(`${VEHICLES[type].icon} ${VEHICLES[type].name} selected`)
    renderVehicleGrid()
    renderUpgrades()
    updateDriveButton()
  }

  // ── Render installed upgrades ─────────────────────────────
  function renderUpgrades() {
    const sec  = document.getElementById('upgrade-section')
    const grid = document.getElementById('upgrade-grid')
    if (!vehicleData.active) { sec.style.display='none'; return }
    sec.style.display = 'block'
    const type = vehicleData.active
    const typeUpgrades = vehicleData.upgrades?.[type] || []
    const slots = ['engine','armor','weapon','special']
    grid.innerHTML = slots.map(slot => {
      const installedId = typeUpgrades.find(uid => {
        const u = UPGRADES.find(u=>u.id===uid)
        return u && u.slot === slot
      })
      const u = installedId ? UPGRADES.find(u=>u.id===installedId) : null
      return `
        <div class="upgrade-slot${u?' installed':''}">
          <div class="slot-type">${slot.toUpperCase()}</div>
          ${u ? `
            <div class="slot-name">${u.icon} ${u.name}</div>
            <div class="slot-effect">${u.effect}</div>
            <button onclick="removeUpgrade('${u.id}')" style="margin-top:5px;font-family:'Share Tech Mono',monospace;font-size:.44rem;color:#e05555;background:none;border:.5px solid #e0555540;padding:2px 6px;border-radius:3px;cursor:pointer">✕ Remove</button>
          ` : `
            <div class="slot-name" style="color:#5a4825">Empty Slot</div>
            <div class="slot-effect" style="color:#4a3820">No upgrade installed</div>
          `}
        </div>`
    }).join('')
  }

  // ── Upgrade shop ──────────────────────────────────────────
  window.openUpgradeShop = function() {
    if (!vehicleData.active) { toast('Select a vehicle first', true); return }
    const type = vehicleData.active
    const typeUpgrades = vehicleData.upgrades?.[type] || []
    const modal = document.getElementById('shop-modal')
    const list  = document.getElementById('shop-list')

    const available = UPGRADES.filter(u =>
      u.vehicles.includes(type) && !typeUpgrades.includes(u.id)
    )

    const bySlot = {}
    available.forEach(u => { if (!bySlot[u.slot]) bySlot[u.slot]=[]; bySlot[u.slot].push(u) })

    list.innerHTML = Object.entries(bySlot).map(([slot, ups]) => `
      <div style="margin-bottom:1rem">
        <div style="font-family:'Orbitron',monospace;font-size:.52rem;color:var(--rust);letter-spacing:.1em;margin-bottom:.4rem">${slot.toUpperCase()}</div>
        ${ups.map(u => {
          const afford = Object.entries(u.cost).every(([k,n])=>(materials[k]||0)>=n)
          const conflict = typeUpgrades.find(uid => {
            const ex = UPGRADES.find(u2=>u2.id===uid)
            return ex && ex.slot === u.slot
          })
          return `
            <div style="border:.5px solid rgba(200,184,128,${afford?'.25':'.1'});border-radius:4px;padding:.6rem .7rem;margin-bottom:.4rem;background:rgba(0,0,0,.3)">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px">
                <span style="font-family:'Orbitron',monospace;font-size:.62rem;color:${afford?'#c8b96e':'#5a4825'}">${u.icon} ${u.name}</span>
                <button onclick="installUpgrade('${u.id}')" ${!afford||conflict?'disabled':''} style="font-family:'Share Tech Mono',monospace;font-size:.5rem;color:#1a1208;background:${afford&&!conflict?'rgba(200,184,128,.5)':'rgba(100,80,40,.2)'};border:1px solid ${afford&&!conflict?'rgba(200,184,128,.6)':'rgba(100,80,40,.3)'};border-radius:3px;padding:2px 8px;cursor:${afford&&!conflict?'pointer':'not-allowed'}">
                  ${conflict ? 'SLOT FULL' : afford ? 'INSTALL' : 'NEED MATS'}
                </button>
              </div>
              <div style="font-size:.5rem;color:#7a6435;margin-bottom:4px">${u.effect}</div>
              <div style="display:flex;gap:5px;flex-wrap:wrap">
                ${Object.entries(u.cost).map(([k,n])=>
                  `<span style="font-size:.44rem;color:${(materials[k]||0)>=n?'#5ec45e':'#e05555'};background:rgba(0,0,0,.3);padding:1px 5px;border-radius:8px;border:.5px solid rgba(200,184,128,.1)">${MAT_ICONS[k]||'📦'} ${n} ${MAT_NAMES[k]||k} (have ${materials[k]||0})</span>`
                ).join('')}
              </div>
            </div>`
        }).join('')}
      </div>`
    ).join('') || '<p style="font-family:\'IM Fell English\',serif;font-style:italic;color:#7a6435;font-size:.8rem">All available upgrades installed.</p>'

    modal.style.display = 'block'
  }

  window.closeUpgradeShop = function() {
    document.getElementById('shop-modal').style.display = 'none'
  }

  window.installUpgrade = async function(uid) {
    const u = UPGRADES.find(u=>u.id===uid)
    if (!u || !vehicleData.active) return
    const type = vehicleData.active
    for (const [key, qty] of Object.entries(u.cost)) {
      const { data } = await supabase.from('inventory').select('id,quantity').eq('player_id',player.id).eq('item_key',key).maybeSingle()
      if (!data || data.quantity < qty) { toast('Not enough '+MAT_NAMES[key], true); return }
      if (data.quantity <= qty) await supabase.from('inventory').delete().eq('id', data.id)
      else await supabase.from('inventory').update({ quantity: data.quantity - qty }).eq('id', data.id)
      materials[key] = Math.max(0, (materials[key]||0) - qty)
    }
    if (!vehicleData.upgrades) vehicleData.upgrades = { motorcycle:[], car:[], van:[] }
    vehicleData.upgrades[type] = [...(vehicleData.upgrades[type]||[]), uid]
    await supabase.from('players').update({ vehicle_data: vehicleData }).eq('id', player.id)
    toast(`${u.icon} ${u.name} installed on ${VEHICLES[type].name}!`)
    await loadMaterials()
    renderMaterials()
    renderVehicleGrid()
    renderUpgrades()
    closeUpgradeShop()
  }

  window.removeUpgrade = async function(uid) {
    const type = vehicleData.active
    if (!type) return
    if (!vehicleData.upgrades) vehicleData.upgrades = { motorcycle:[], car:[], van:[] }
    vehicleData.upgrades[type] = (vehicleData.upgrades[type]||[]).filter(id=>id!==uid)
    await supabase.from('players').update({ vehicle_data: vehicleData }).eq('id', player.id)
    const u = UPGRADES.find(u=>u.id===uid)
    toast(`${u?.name||uid} removed`)
    renderVehicleGrid()
    renderUpgrades()
  }

  // ── Drive ─────────────────────────────────────────────────
  function updateDriveButton() {
    const btn = document.getElementById('drive-btn')
    const lbl = document.getElementById('drive-label')
    if (vehicleData.active) {
      btn.disabled = false
      const v = VEHICLES[vehicleData.active]
      lbl.textContent = destination
        ? `${v.icon} ${v.name.toUpperCase()} — HEADING TO CHAPTER ${destination}`
        : `${v.icon} ${v.name.toUpperCase()} READY`
    } else {
      btn.disabled = true
      lbl.textContent = 'SELECT A VEHICLE TO DRIVE'
    }
  }

  window.drive = function() {
    if (!vehicleData.active) return
    const dest = destination ? `?dest=${destination}` : ''
    window.bookNavigate('vehicle.html' + dest)
  }

  // ── Toast ─────────────────────────────────────────────────
  function toast(msg, err=false) {
    const el = document.getElementById('toast')
    el.textContent = msg
    el.style.borderColor = err ? '#e05555' : 'var(--rust)'
    el.classList.add('show')
    setTimeout(() => el.classList.remove('show'), 2800)
  }

  // Render upgrades if vehicle already owned
  if (vehicleData.type) renderUpgrades()

  return { player, cleanup() {} }
}

export default mountGarage
