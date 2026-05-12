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
      .bm-top-row, .bm-mid-row, .bm-bottom-row, .bm-links, .bm-content,
      .bm-wrap, .bm-img {
        all: revert;
        box-sizing: border-box;
      }
      .bm-wrap {
        position: relative;
        width: 770px;
        height: 330px;
        margin: 0 auto;
        user-select: none;
      }
      @media (max-width: 800px) {
        .bm-wrap {
          width: 100%;
          height: auto;
          aspect-ratio: 1680 / 720;
        }
      }
      .bm-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: fill;
        pointer-events: none;
      }
      .bm-content {
        position: absolute;
        inset: 0;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding-top: 0px;
        gap: 6px;
        pointer-events: none;
      }
      .bm-content a, .bm-content button, .bm-content span { pointer-events: all; }
      .bm-top-row {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .bm-mid-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .bm-bottom-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0;
      }
      .bm-logo {
        font-family: 'Cinzel', serif;
        font-size: 12px;
        letter-spacing: .28em;
        text-transform: uppercase;
        color: #3a2a14;
        text-decoration: none;
        flex-shrink: 0;
        margin-right: 14px;
      }
      .bm-player {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        letter-spacing: .08em;
        color: #4a3820;
        display: flex;
        align-items: center;
        gap: 4px;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
      }
      .bm-dot {
        display: inline-block;
        width: 5px; height: 5px;
        border-radius: 50%;
        background: ${color};
        flex-shrink: 0;
      }
      .bm-links {
        display: flex;
        align-items: center;
        gap: 0;
        flex-shrink: 0;
      }
      .bm-link {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        letter-spacing: .18em;
        text-transform: uppercase;
        color: #4a3820;
        text-decoration: none;
        padding: 3px 7px;
        transition: color .2s;
        white-space: nowrap;
      }
      .bm-link:hover { color: #1a0e04; }
      .bm-link.active { color: #1a0e04; font-weight: 700; }
      .bm-sep {
        color: #8a7050;
        font-size: 8px;
        opacity: .4;
      }
      .bm-signout {
        font-family: 'JetBrains Mono', monospace;
        font-size: 7px;
        letter-spacing: .15em;
        text-transform: uppercase;
        color: #7a5030;
        background: none;
        border: none;
        cursor: pointer;
        padding: 3px 5px;
        transition: color .2s;
        margin-left: 4px;
        white-space: nowrap;
      }
      .bm-signout:hover { color: #1a0e04; }
      @media (max-width: 800px) {
        .bm-logo { font-size: 8px; }
        .bm-player { font-size: 6px; }
        .bm-link { font-size: 5.5px; padding: 2px 4px; }
        .bm-signout { font-size: 5.5px; }
        .bm-content { gap: 3px; padding-top: 0; }
      }
    </style>
    <div class="bm-wrap">
      <img class="bm-img" src="${base}components/nav_bookmark.webp" alt="">
      <div class="bm-content">
        <div class="bm-top-row">
          <a href="${base}index.html" class="bm-logo">SuperSede</a>
        </div>
        <div class="bm-mid-row">
          <span class="bm-player">
            ${adminImg}<span class="bm-dot"></span>
            ${player.username} · Lvl ${player.level} · ◈ ${player.gold}
          </span>
        </div>
        <div class="bm-bottom-row">
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
