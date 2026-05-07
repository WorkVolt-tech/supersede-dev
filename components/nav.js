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

  root.innerHTML = `
    <style>
      .bm-wrap {
        position: relative;
        width: 100%;
        height: 70px;
        display: flex;
        align-items: stretch;
        user-select: none;
        gap: 0;
      }
      .bm-left {
        width: 43px;
        flex-shrink: 0;
        background: url('${base}components/left_cap.webp') no-repeat center center;
        background-size: 100% 100%;
        position: relative;
        z-index: 2;
      }
      .bm-middle {
        flex: 1;
        min-width: 0;
        background: url('${base}components/middle_body.webp') no-repeat center center;
        background-size: 100% 100%;
        position: relative;
        z-index: 1;
      }
      .bm-right {
        width: 80px;
        flex-shrink: 0;
        background: url('${base}components/right_cap.webp') no-repeat center center;
        background-size: 100% 100%;
        position: relative;
        z-index: 2;
      }
      .bm-content {
        position: absolute;
        left: 43px;
        right: 80px;
        top: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        padding: 0 16px;
        gap: 0;
        pointer-events: none;
        overflow: hidden;
      }
      .bm-content a, .bm-content button, .bm-content span { pointer-events: all; }
      .bm-logo {
        font-family: 'Cinzel', serif;
        font-size: 11px;
        letter-spacing: .32em;
        text-transform: uppercase;
        color: #3a2a14;
        text-decoration: none;
        flex-shrink: 0;
        margin-right: 20px;
      }
      .bm-player {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        letter-spacing: .10em;
        color: #4a3820;
        display: flex;
        align-items: center;
        gap: 5px;
        flex: 1;
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
        gap: 2px;
        flex-shrink: 0;
      }
      .bm-link {
        font-family: 'JetBrains Mono', monospace;
        font-size: 8px;
        letter-spacing: .22em;
        text-transform: uppercase;
        color: #4a3820;
        text-decoration: none;
        padding: 4px 10px;
        transition: color .2s;
        white-space: nowrap;
      }
      .bm-link:hover { color: #1a0e04; }
      .bm-link.active { color: #1a0e04; font-weight: 700; }
      .bm-sep {
        color: #8a7050;
        font-size: 9px;
        opacity: .5;
      }
      .bm-signout {
        font-family: 'JetBrains Mono', monospace;
        font-size: 8px;
        letter-spacing: .18em;
        text-transform: uppercase;
        color: #7a5030;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 6px;
        transition: color .2s;
        margin-left: 6px;
      }
      .bm-signout:hover { color: #1a0e04; }
    </style>
    <div class="bm-wrap">
      <div class="bm-left"></div>
      <div class="bm-middle"></div>
      <div class="bm-right"></div>
      <div class="bm-content">
        <a href="${base}index.html" class="bm-logo">SuperSede</a>
        <span class="bm-player">
          ${adminImg}<span class="bm-dot"></span>
          ${player.username} · Lvl ${player.level} · ${player.xp} XP · ◈ ${player.gold}
        </span>
        <nav class="bm-links">
          ${[
            { href: `${base}pages/book.html`,      label: 'Chapters'  },
            { href: `${base}pages/inventory.html`, label: 'Inventory' },
            { href: `${base}pages/skills.html`,    label: 'Skills'    },
            { href: `${base}pages/trader.html`,    label: 'Trader'    },
            { href: `${base}pages/lobby.html`,     label: 'Lobby'     },
            { href: `${base}pages/badges.html`,    label: 'Badges'    },
          ].map((l, i, arr) => {
            const active = l.href.includes(currentPage) && currentPage !== 'index.html'
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
