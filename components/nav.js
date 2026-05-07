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

  // Highlight active page
  const currentPage = location.pathname.split('/').pop()
  const navLinks = [
    { href: `${base}pages/book.html`,      label: 'Chapters'  },
    { href: `${base}pages/inventory.html`, label: 'Inventory' },
    { href: `${base}pages/skills.html`,    label: 'Skills'    },
    { href: `${base}pages/trader.html`,    label: 'Trader'    },
    { href: `${base}pages/lobby.html`,     label: 'Lobby'     },
    { href: `${base}pages/badges.html`,    label: 'Badges'    },
  ]

  root.innerHTML = `
    <style>
      .bookmark-nav {
        background: #1a1410;
        border-bottom: 1px solid rgba(200,160,80,.20);
        font-family: 'JetBrains Mono', monospace;
        user-select: none;
      }
      .bookmark-nav-top {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 10px 32px;
        border-bottom: 1px solid rgba(200,160,80,.12);
      }
      .bookmark-logo {
        font-family: 'Cinzel', serif;
        font-size: 11px;
        letter-spacing: .38em;
        text-transform: uppercase;
        color: #c8a050;
        text-decoration: none;
        flex-shrink: 0;
      }
      .bookmark-player {
        font-size: 10px;
        letter-spacing: .12em;
        color: #d4c5a0;
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;
      }
      .bookmark-player-dot {
        display: inline-block;
        width: 6px; height: 6px;
        border-radius: 50%;
        background: ${color};
        flex-shrink: 0;
      }
      .bookmark-signout {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        letter-spacing: .2em;
        text-transform: uppercase;
        color: #7a6050;
        background: none;
        border: .5px solid #4a3828;
        padding: 3px 8px;
        cursor: pointer;
        transition: color .2s, border-color .2s;
        flex-shrink: 0;
      }
      .bookmark-signout:hover { color: #c8a050; border-color: #c8a050; }
      .bookmark-tabs {
        display: flex;
        align-items: flex-end;
        padding: 0 28px;
        gap: 2px;
      }
      .bookmark-tab {
        font-size: 9px;
        letter-spacing: .28em;
        text-transform: uppercase;
        color: #7a6e58;
        text-decoration: none;
        padding: 7px 16px 6px;
        border: 1px solid transparent;
        border-bottom: none;
        position: relative;
        transition: color .2s, background .2s, border-color .2s;
        background: transparent;
        top: 1px;
      }
      .bookmark-tab:hover {
        color: #d4c5a0;
        background: rgba(200,160,80,.06);
        border-color: rgba(200,160,80,.20);
      }
      .bookmark-tab.active {
        color: #d4c5a0;
        background: rgba(200,160,80,.08);
        border-color: rgba(200,160,80,.25);
      }
      .bookmark-tab.active::after {
        content: '';
        position: absolute;
        bottom: -1px; left: 0; right: 0;
        height: 1px;
        background: #1a1410;
      }
    </style>
    <nav class="bookmark-nav">
      <div class="bookmark-nav-top">
        <a href="${base}index.html" class="bookmark-logo">SuperSede</a>
        <span class="bookmark-player">
          ${adminImg}
          <span class="bookmark-player-dot"></span>
          ${player.username} · Lvl ${player.level} · ${player.xp} XP · ◈ ${player.gold}
        </span>
        <button class="bookmark-signout" onclick="signOut()">Sign Out</button>
      </div>
      <div class="bookmark-tabs">
        ${navLinks.map(l => {
          const isActive = l.href.includes(currentPage) && currentPage !== 'index.html'
          return `<a href="${l.href}" class="bookmark-tab${isActive ? ' active' : ''}">${l.label}</a>`
        }).join('')}
      </div>
    </nav>
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
