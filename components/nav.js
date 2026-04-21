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

  root.innerHTML = `
    <nav class="nav">
      <a href="${base}index.html" class="nav-logo">SuperSede</a>
      <span class="nav-player">${adminImg}
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${color};margin-right:4px;vertical-align:middle"></span>
        ${player.username} · Lvl ${player.level} · ${player.xp} XP · ◈ ${player.gold}
      </span>
      <div class="nav-links">
        <a href="${base}pages/book.html"      class="nav-link">Chapters</a>
        <a href="${base}pages/inventory.html" class="nav-link">Inventory</a>
        <a href="${base}pages/skills.html"    class="nav-link">Skills</a>
        <a href="${base}pages/trader.html"    class="nav-link">Trader</a>
        <a href="${base}pages/lobby.html"     class="nav-link">Lobby</a>
        <a href="${base}pages/badges.html"    class="nav-link">Badges</a>
        <button onclick="signOut()" style="font-family:'Share Tech Mono',monospace;font-size:.62rem;color:#604040;background:none;border:.5px solid #604040;padding:.2rem .5rem;cursor:pointer;border-radius:2px">Sign Out</button>
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
