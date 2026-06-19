// components/nav.js — inject nav into any page

// ── Admin config ─────────────────────────────────
// Add your Supabase user ID here to get the cloaked admin appearance
const ADMIN_USER_IDS = new Set([
  'YOUR_USER_ID_HERE',  // ← replace with your actual Supabase user ID
])
import { supabase } from '../supabase.js'

export async function renderNav(containerId = 'nav') {
  // ── Edge-safe session check ───────────────────────────────
  // Edge delays restoring sessions from storage. We wait for
  // onAuthStateChange to fire with the real session before acting.
  const session = await new Promise(resolve => {
    let resolved = false
    const done = (s) => { if (!resolved) { resolved = true; resolve(s) } }

    // Immediate check — works in Chrome/Firefox
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) done(data.session)
      else {
        // Wait up to 2.5s for Edge to restore session from storage
        const timer = setTimeout(() => done(null), 2500)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            clearTimeout(timer)
            subscription.unsubscribe()
            done(s)
          }
        })
      }
    })
  })

  if (!session) { location.href = '../pages/auth.html'; return null }

  const { data: player } = await supabase
    .from('players').select('*').eq('user_id', session.user.id).single()

  if (!player) { location.href = '../pages/auth.html'; return null }

  const badgeColors = { neutral:'#c8b96e', red:'#e05555', green:'#5ec45e', elite:'#a07de0', unknown:'#666' }
  const color = badgeColors[player.badge] || badgeColors.neutral

  const root = document.getElementById(containerId)
  if (!root) return player

  // Detect if we're in pages/ subfolder
  const inPages = location.pathname.includes('/pages/')
  const base = inPages ? '../' : ''

  const adminImg = ADMIN_USER_IDS.has(player.user_id)
    ? `<img src="${base}assets/mysterious_cloaked_player.png" alt="Admin" style="width:22px;height:22px;border-radius:50%;object-fit:cover;object-position:top;border:1px solid #00ffe7;box-shadow:0 0 6px #00ffe750;vertical-align:middle;margin-right:4px;">`
    : ''

  const currentPage = location.pathname.split('/').pop()
  const currentView = new URLSearchParams(location.search).get('view') || 'chapters'

  root.innerHTML = `
    <style>
      /* ── Nav isolation — always wins over page CSS ── */
      .bm-logo, .bm-player, .bm-link, .bm-signout, .bm-sep, .bm-dot,
      .bm-row, .bm-links, .bm-content, .bm-wrap {
        all: revert;
        box-sizing: border-box;
      }
      /* CSS bookmark — no image. Dovetail notch via clip-path. Sizes to its
         own content (no fixed height), so it never pushes the page down the
         way the old 330px webp did. Recolor by changing --bm-paper / --bm-edge. */
      .bm-wrap {
        --bm-paper: #f1e4cf;
        --bm-edge:  #8a5b44;
        --bm-gold:  #c8a050;
        position: relative;
        width: 540px;
        max-width: 100%;
        margin: 0 auto;
        background: var(--bm-paper);
        border: 2px solid var(--bm-edge);
        clip-path: polygon(0 0, 100% 0, 100% 100%, 54% 100%, 50% 90%, 46% 100%, 0 100%);
        padding: 16px 26px 30px;
        user-select: none;
      }
      @media (max-width: 800px) {
        .bm-wrap { width: 100%; padding: 12px 14px 26px; }
      }
      .bm-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }
      .bm-logo {
        font-family: 'Cinzel', Georgia, serif;
        font-size: 18px;
        letter-spacing: .34em;
        text-transform: uppercase;
        color: #3a2a14;
        text-decoration: none;
      }
      .bm-rule {
        height: 1px; width: 200px; max-width: 60%;
        background: var(--bm-gold); opacity: .55;
      }
      .bm-player {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        letter-spacing: .06em;
        color: #4a3820;
        display: flex; align-items: center; gap: 5px;
        white-space: nowrap;
      }
      .bm-dot {
        display: inline-block; width: 6px; height: 6px;
        border-radius: 50%; background: ${color}; flex-shrink: 0;
      }
      /* The links row: a centered wrapping flex row. Add or remove links in
         the array below and they stay centered and balanced automatically —
         no positions to adjust. */
      .bm-links {
        display: flex; align-items: center; justify-content: center;
        flex-wrap: wrap; gap: 0;
      }
      .bm-link {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        letter-spacing: .16em;
        text-transform: uppercase;
        color: #4a3820;
        text-decoration: none;
        padding: 3px 7px;
        transition: color .2s;
        white-space: nowrap;
      }
      .bm-link:hover { color: #1a0e04; }
      .bm-link.active { color: #1a0e04; font-weight: 700; }
      .bm-sep { color: #8a7050; font-size: 9px; opacity: .4; }
      .bm-signout {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: #7a5030;
        background: none; border: none; cursor: pointer;
        padding: 3px 7px; margin-left: 4px;
        transition: color .2s; white-space: nowrap;
      }
      .bm-signout:hover { color: #1a0e04; }
      @media (max-width: 800px) {
        .bm-logo { font-size: 15px; letter-spacing: .24em; }
        .bm-player { font-size: 9px; }
        .bm-link { font-size: 9px; padding: 2px 5px; }
        .bm-signout { font-size: 8px; }
      }
    </style>
    <div class="bm-wrap">
      <div class="bm-content">
        <a href="${base}index.html" class="bm-logo">SuperSede</a>
        <div class="bm-rule"></div>
        <span class="bm-player">
          ${adminImg}<span class="bm-dot"></span>
          ${player.username} · Lvl ${player.level} · ◈ ${player.gold}
        </span>
        <nav class="bm-links">
          ${[
            { href: `${base}pages/book.html`,                label: 'Chapters',  view: 'chapters'  },
            { href: `${base}pages/book.html?view=inventory`, label: 'Inventory', view: 'inventory' },
            { href: `${base}pages/book.html?view=skills`,    label: 'Skills',    view: 'skills'    },
            { href: `${base}pages/book.html?view=trader`,    label: 'Trader',    view: 'trader'    },
            { href: `${base}pages/book.html?view=lobby`,     label: 'Lobby',     view: 'lobby'     },
            { href: `${base}pages/book.html?view=badges`,    label: 'Badges',    view: 'badges'    },
          ].map((l, i, arr) => {
            const active = currentPage === 'book.html'
              ? currentView === l.view
              : l.href.includes(currentPage) && currentPage !== 'index.html'
            return `<a href="${l.href}" class="bm-link${active ? ' active' : ''}">${l.label}</a>${i < arr.length - 1 ? '<span class="bm-sep">·</span>' : ''}`
          }).join('')}
          <button class="bm-signout" onclick="signOut()">Sign Out</button>
        </nav>
      </div>
    </div>
  `

  window.signOut = async () => {
    await supabase.auth.signOut()
    location.href = base + 'index.html'
  }

  return player
}

export function showToast(msg, isErr = false) {
  let t = document.getElementById('toast')
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t) }
  t.textContent = msg
  t.className = 'toast show' + (isErr ? ' err' : '')
  clearTimeout(t._timer)
  t._timer = setTimeout(() => t.className = 'toast', 2200)
}

export function showSysOverlay(msg, variant = 'warn') {
  let el = document.getElementById('sys-overlay')
  if (!el) { el = document.createElement('div'); el.id = 'sys-overlay'; document.body.appendChild(el) }
  el.className = 'sys-overlay' + (variant === 'info' ? ' info' : '')
  el.innerHTML = `<span>⚠</span><span>${msg}</span>`
  clearTimeout(el._timer)
  el._timer = setTimeout(() => el.remove(), 5000)
}
