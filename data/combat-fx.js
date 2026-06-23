// data/combat-fx.js — Tier-2 elemental hit effects for combat.
// ─────────────────────────────────────────────────────────────────────
// Pure CSS/SVG. No image assets. Self-contained: injects its own <style>
// once (does NOT touch any chapter's MODULE_STYLES string), and exposes a
// single function the combat engine calls on each landed hit:
//
//     import { playHitFx } from '../../data/combat-fx.js'
//     playHitFx(targetEl, element)
//
//   targetEl — the DOM element to burst over (the enemy image/row).
//   element  — one of the skill `el` values, or 'physical' for basic strikes.
//
// Element → effect mapping (confirmed with design):
//   fire     → orange flame burst
//   water    → blue splash ring
//   lightning→ yellow jagged bolt
//   earth    → brown rock crack
//   wind     → cyan slash-swirl
//   plant    → green thorn burst
//   metal    → grey shard glint
//   poison   → green-and-purple toxic burst
//   dark/shadow → purple void smear (shared)
//   light/arcane → white-gold flash (shared = Lux)
//   physical → white slash (basic strike / unmapped)
//
// The overlay is absolutely positioned over the target, plays one keyframe
// animation (~500ms), then removes itself. Multiple hits stack harmlessly.
// pointer-events:none throughout, so it never blocks combat buttons.
// ─────────────────────────────────────────────────────────────────────

const STYLE_ID = 'combat-fx-styles'

// Per-element palette + which shape to draw. Shapes are CSS/SVG primitives.
const FX = {
  fire:      { color: '#ff7a1a', glow: '#ffcc44', shape: 'burst' },
  water:     { color: '#2a9df4', glow: '#9fd8ff', shape: 'ring' },
  lightning: { color: '#ffe23a', glow: '#fff7a0', shape: 'bolt' },
  earth:     { color: '#a9743c', glow: '#d6a86a', shape: 'crack' },
  wind:      { color: '#8fe3e8', glow: '#d6fbfd', shape: 'swirl' },
  plant:     { color: '#5cc24a', glow: '#bff0a8', shape: 'thorn' },
  metal:     { color: '#b8c0c8', glow: '#eef2f6', shape: 'shard' },
  poison:    { color: '#7aad30', glow: '#b06eff', shape: 'toxic' },   // green + purple
  dark:      { color: '#8a50c0', glow: '#c8a8ff', shape: 'smear' },
  shadow:    { color: '#8a50c0', glow: '#c8a8ff', shape: 'smear' },   // shares dark
  light:     { color: '#f5e3a0', glow: '#fffbe6', shape: 'flash' },
  arcane:    { color: '#f5e3a0', glow: '#fffbe6', shape: 'flash' },   // Lux = light
  physical:  { color: '#ffffff', glow: '#e8e8e8', shape: 'slash' },
}

// Per-SKILL overrides, keyed by the skill's combat fn name. These take priority
// over the element default so each attack looks distinct. color/glow can also be
// overridden per skill; if omitted, the element's palette is used.
const SKILL_FX = {
  // ── Fire ──
  fireBlast:     { shape: 'burst',  color: '#ff5500', glow: '#ffcc44' },
  infernoZone:   { shape: 'nova',   color: '#ff3300', glow: '#ffaa33' },
  cinderstorm:   { shape: 'meteor', color: '#ff6622', glow: '#ffd86a' },
  embersEnd:     { shape: 'slashx', color: '#ff7a1a', glow: '#ffcc44' },
  // ── Water ──
  waterJet:      { shape: 'pierce', color: '#2a9df4', glow: '#bfe6ff' },
  tsunami:       { shape: 'wave',   color: '#1f7fd0', glow: '#9fd8ff' },
  maelstrom:     { shape: 'nova',   color: '#2a9df4', glow: '#cfeeff' },
  waterShield:   { shape: 'ring',   color: '#2a9df4', glow: '#9fd8ff' },
  // ── Lightning ──
  lightningStrike:{ shape: 'bolt',  color: '#ffe23a', glow: '#fff7a0' },
  thunderstorm:  { shape: 'nova',   color: '#ffe23a', glow: '#ffffff' },
  tempest:       { shape: 'spike',  color: '#ffe23a', glow: '#fff7a0' },
  // ── Earth ──
  earthquake:    { shape: 'crack',  color: '#a9743c', glow: '#d6a86a' },
  earthSpike:    { shape: 'spike',  color: '#8b5e3c', glow: '#d6a86a' },
  stoneThrow:    { shape: 'meteor', color: '#8b5e3c', glow: '#cda06a' },
  tectonicCrush: { shape: 'nova',   color: '#7a5230', glow: '#d6a86a' },
  // ── Wind ──
  dashStrike:    { shape: 'slashx', color: '#8fe3e8', glow: '#d6fbfd' },
  wildCyclone:   { shape: 'swirl',  color: '#8fe3e8', glow: '#ffffff' },
  tornadoField:  { shape: 'swirl',  color: '#a8d8ea', glow: '#d6fbfd' },
  // ── Plant ──
  thornVolley:   { shape: 'spike',  color: '#5cc24a', glow: '#bff0a8' },
  overgrowth:    { shape: 'thorn',  color: '#5cc24a', glow: '#bff0a8' },
  carnivoreBloom:{ shape: 'nova',   color: '#4aa838', glow: '#bff0a8' },
  // ── Metal ──
  bladeArc:      { shape: 'cross',  color: '#c0c0c0', glow: '#eef2f6' },
  bladeForm:     { shape: 'shard',  color: '#b8c0c8', glow: '#eef2f6' },
  annihilate:    { shape: 'slashx', color: '#d8dce0', glow: '#ffffff' },
  ironDomain:    { shape: 'ring',   color: '#b8c0c8', glow: '#eef2f6' },
  // ── Shadow (Umbra) ──
  shadowLance:   { shape: 'pierce', color: '#9a6fd8', glow: '#c8a8ff' },
  umbralBurst:   { shape: 'smear',  color: '#8a50c0', glow: '#c8a8ff' },
  eclipse:       { shape: 'nova',   color: '#6a3aa0', glow: '#c8a8ff' },
  shadowStep:    { shape: 'smear',  color: '#8a50c0', glow: '#c8a8ff' },
  voidZone:      { shape: 'nova',   color: '#6a3aa0', glow: '#b06eff' },
  // ── Poison (Venin) ──
  venomSpit:     { shape: 'toxic',  color: '#7aad30', glow: '#b06eff' },
  blightNova:    { shape: 'nova',   color: '#7aad30', glow: '#b06eff' },
  pandemic:      { shape: 'toxic',  color: '#6a9a28', glow: '#c8a8ff' },
  venomLance:    { shape: 'pierce', color: '#7aad30', glow: '#b06eff' },
  // ── Arcane (Lux) ──
  resonantBolt:  { shape: 'flash',  color: '#b06eff', glow: '#fffbe6' },
  standingChord: { shape: 'nova',   color: '#b06eff', glow: '#f5e3a0' },
  resonanceBurst:{ shape: 'nova',   color: '#c88aff', glow: '#fffbe6' },
  // ── Physical (basic actions) ──
  __strike:      { shape: 'slash',  color: '#ffffff', glow: '#e8e8e8' },
  __heavy:       { shape: 'slashx', color: '#ffd0a0', glow: '#ffffff' },
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .cfx-layer {
      position: absolute; inset: 0;
      pointer-events: none; overflow: visible;
      z-index: 50;
    }
    .cfx {
      position: absolute; left: 50%; top: 50%;
      width: 90px; height: 90px;
      transform: translate(-50%, -50%);
      pointer-events: none;
      will-change: transform, opacity;
    }
    .cfx svg { width: 100%; height: 100%; display: block; overflow: visible; }

    /* ── Burst (fire / generic radial) ── */
    @keyframes cfxBurst {
      0%   { transform: translate(-50%,-50%) scale(.3); opacity: 0; }
      30%  { opacity: 1; }
      100% { transform: translate(-50%,-50%) scale(1.4); opacity: 0; }
    }
    .cfx-burst { animation: cfxBurst .5s ease-out forwards; }

    /* ── Ring (water) ── */
    @keyframes cfxRing {
      0%   { transform: translate(-50%,-50%) scale(.2); opacity: .9; }
      100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
    }
    .cfx-ring { animation: cfxRing .55s ease-out forwards; }

    /* ── Bolt (lightning) ── */
    @keyframes cfxBolt {
      0%   { opacity: 0; transform: translate(-50%,-50%) scale(1) rotate(-4deg); }
      12%  { opacity: 1; }
      28%  { opacity: .2; }
      40%  { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(1.1) rotate(2deg); }
    }
    .cfx-bolt { animation: cfxBolt .42s steps(1,end) forwards; }

    /* ── Crack (earth) ── */
    @keyframes cfxCrack {
      0%   { opacity: 0; transform: translate(-50%,-50%) scale(.6); }
      25%  { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(1.15); }
    }
    .cfx-crack { animation: cfxCrack .5s ease-out forwards; }

    /* ── Swirl (wind) ── */
    @keyframes cfxSwirl {
      0%   { opacity: 0; transform: translate(-50%,-50%) rotate(-60deg) scale(.6); }
      30%  { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%,-50%) rotate(80deg) scale(1.3); }
    }
    .cfx-swirl { animation: cfxSwirl .5s ease-out forwards; }

    /* ── Thorn (plant) ── */
    @keyframes cfxThorn {
      0%   { opacity: 0; transform: translate(-50%,-50%) scale(.4) rotate(0deg); }
      35%  { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(1.25) rotate(12deg); }
    }
    .cfx-thorn { animation: cfxThorn .5s ease-out forwards; }

    /* ── Shard (metal) ── */
    @keyframes cfxShard {
      0%   { opacity: 0; transform: translate(-50%,-50%) scale(.5); }
      20%  { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(1.2); }
    }
    .cfx-shard { animation: cfxShard .45s ease-out forwards; }

    /* ── Toxic (poison: green→purple) ── */
    @keyframes cfxToxic {
      0%   { opacity: 0; transform: translate(-50%,-50%) scale(.4); filter: hue-rotate(0deg); }
      30%  { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(1.4); filter: hue-rotate(40deg); }
    }
    .cfx-toxic { animation: cfxToxic .6s ease-out forwards; }

    /* ── Smear (dark / shadow) ── */
    @keyframes cfxSmear {
      0%   { opacity: 0; transform: translate(-50%,-50%) scale(.5); }
      30%  { opacity: .95; }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(1.5); }
    }
    .cfx-smear { animation: cfxSmear .55s ease-in forwards; }

    /* ── Flash (light / arcane = Lux) ── */
    @keyframes cfxFlash {
      0%   { opacity: 0; transform: translate(-50%,-50%) scale(.4); }
      18%  { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(1.5); }
    }
    .cfx-flash { animation: cfxFlash .45s ease-out forwards; }

    /* ── Slash (physical) ── */
    @keyframes cfxSlash {
      0%   { opacity: 0; transform: translate(-50%,-50%) rotate(-40deg) scale(.5); }
      25%  { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%,-50%) rotate(-40deg) scale(1.25); }
    }
    .cfx-slash { animation: cfxSlash .38s ease-out forwards; }

    /* ── Aura (self-cast buff glow on the player side) ── */
    @keyframes cfxAura {
      0%   { opacity: 0; transform: translate(-50%,-50%) scale(.6); }
      25%  { opacity: .85; }
      100% { opacity: 0; transform: translate(-50%,-50%) scale(1.5); }
    }
    .cfx-aura { animation: cfxAura .65s ease-out forwards; }

    @media (prefers-reduced-motion: reduce) {
      .cfx { animation-duration: .01ms !important; }
    }
  `
  document.head.appendChild(style)
}

// SVG markup per shape. `c` = main color, `g` = glow/accent color.
function svgFor(shape, c, g) {
  switch (shape) {
    case 'burst':
      return `<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round">
        ${[0,45,90,135,180,225,270,315].map(a=>{
          const r1=18,r2=46,rad=a*Math.PI/180
          return `<line x1="${50+r1*Math.cos(rad)}" y1="${50+r1*Math.sin(rad)}" x2="${50+r2*Math.cos(rad)}" y2="${50+r2*Math.sin(rad)}"/>`
        }).join('')}
        </g><circle cx="50" cy="50" r="14" fill="${g}"/></svg>`
    case 'ring':
      return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="none" stroke="${c}" stroke-width="7"/><circle cx="50" cy="50" r="22" fill="none" stroke="${g}" stroke-width="3" opacity=".8"/></svg>`
    case 'bolt':
      return `<svg viewBox="0 0 100 100"><polygon points="56,6 36,52 50,52 42,94 70,40 54,40" fill="${c}" stroke="${g}" stroke-width="2"/></svg>`
    case 'crack':
      return `<svg viewBox="0 0 100 100"><g stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="50,8 46,34 58,46 50,64 56,92"/><polyline points="46,34 26,40"/><polyline points="58,46 78,42"/><polyline points="50,64 30,72"/></g></svg>`
    case 'swirl':
      return `<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round">
        <path d="M20,40 q30,-20 60,0"/><path d="M16,56 q34,-18 68,2"/><path d="M24,70 q26,-12 52,2"/></g></svg>`
    case 'thorn':
      return `<svg viewBox="0 0 100 100"><g fill="${c}" stroke="${g}" stroke-width="2">
        ${[0,72,144,216,288].map(a=>{const rad=a*Math.PI/180;return `<polygon points="${50+10*Math.cos(rad)},${50+10*Math.sin(rad)} ${50+44*Math.cos(rad)},${50+44*Math.sin(rad)} ${50+10*Math.cos(rad+0.5)},${50+10*Math.sin(rad+0.5)}"/>`}).join('')}
        </g><circle cx="50" cy="50" r="9" fill="${g}"/></svg>`
    case 'shard':
      return `<svg viewBox="0 0 100 100"><g fill="${c}" stroke="${g}" stroke-width="2">
        <polygon points="50,8 58,48 50,40 42,48"/><polygon points="86,46 52,52 60,46 56,38"/><polygon points="64,88 48,54 54,58 60,52"/><polygon points="14,58 50,50 42,54 44,62"/></g></svg>`
    case 'toxic':
      return `<svg viewBox="0 0 100 100"><defs><radialGradient id="cfxtox" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${c}"/><stop offset="70%" stop-color="${c}"/><stop offset="100%" stop-color="${g}"/></radialGradient></defs>
        <circle cx="50" cy="50" r="30" fill="url(#cfxtox)" opacity=".85"/>
        ${[20,90,160,250,320].map(a=>{const rad=a*Math.PI/180;return `<circle cx="${50+30*Math.cos(rad)}" cy="${50+30*Math.sin(rad)}" r="9" fill="${g}" opacity=".7"/>`}).join('')}
        </svg>`
    case 'aura':
      return `<svg viewBox="0 0 100 100"><defs><radialGradient id="cfxaura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${g}" stop-opacity=".9"/><stop offset="55%" stop-color="${c}" stop-opacity=".5"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>
        <circle cx="50" cy="50" r="46" fill="url(#cfxaura)"/>
        <circle cx="50" cy="50" r="30" fill="none" stroke="${g}" stroke-width="2" opacity=".6"/></svg>`
    case 'smear':
      return `<svg viewBox="0 0 100 100"><defs><radialGradient id="cfxsm" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${g}"/><stop offset="60%" stop-color="${c}"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs>
        <circle cx="50" cy="50" r="44" fill="url(#cfxsm)"/></svg>`
    case 'flash':
      return `<svg viewBox="0 0 100 100"><g fill="${g}"><circle cx="50" cy="50" r="16"/></g>
        <g stroke="${c}" stroke-width="5" stroke-linecap="round">
        ${[0,30,60,90,120,150].map(a=>{const rad=a*Math.PI/180;return `<line x1="${50-46*Math.cos(rad)}" y1="${50-46*Math.sin(rad)}" x2="${50+46*Math.cos(rad)}" y2="${50+46*Math.sin(rad)}"/>`}).join('')}</g></svg>`
    case 'meteor':
      return `<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"><line x1="14" y1="14" x2="54" y2="54"/><line x1="26" y1="10" x2="60" y2="44" opacity=".5" stroke="${g}"/></g><circle cx="62" cy="62" r="20" fill="${c}"/><circle cx="62" cy="62" r="11" fill="${g}"/></svg>`
    case 'spike':
      return `<svg viewBox="0 0 100 100"><g fill="${c}" stroke="${g}" stroke-width="2">${[0,40,80,120,160,200,240,280,320].map(a=>{const rad=a*Math.PI/180;return `<polygon points="${50+8*Math.cos(rad)},${50+8*Math.sin(rad)} ${50+48*Math.cos(rad)},${50+48*Math.sin(rad)} ${50+8*Math.cos(rad+0.35)},${50+8*Math.sin(rad+0.35)}"/>`}).join('')}</g></svg>`
    case 'wave':
      return `<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"><path d="M8,40 q12,-14 24,0 t24,0 t24,0 t24,0"/><path d="M8,58 q12,-14 24,0 t24,0 t24,0 t24,0" stroke="${g}" opacity=".7"/></g></svg>`
    case 'slashx':
      return `<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"><path d="M18,18 L82,82"/><path d="M82,18 L18,82" stroke="${g}"/></g></svg>`
    case 'pierce':
      return `<svg viewBox="0 0 100 100"><g stroke="${c}" stroke-width="8" stroke-linecap="round"><line x1="10" y1="50" x2="90" y2="50"/></g><polygon points="78,38 96,50 78,62" fill="${g}"/></svg>`
    case 'nova':
      return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-width="4" opacity=".7"/><g fill="none" stroke="${g}" stroke-width="5" stroke-linecap="round">${[0,30,60,90,120,150,180,210,240,270,300,330].map(a=>{const rad=a*Math.PI/180;return `<line x1="${50+20*Math.cos(rad)}" y1="${50+20*Math.sin(rad)}" x2="${50+44*Math.cos(rad)}" y2="${50+44*Math.sin(rad)}"/>`}).join('')}</g><circle cx="50" cy="50" r="12" fill="${c}"/></svg>`
    case 'cross':
      return `<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"><path d="M20,28 Q50,44 80,64"/></g><g fill="none" stroke="${g}" stroke-width="9" stroke-linecap="round"><path d="M80,28 Q50,44 20,64"/></g></svg>`
    case 'slash':
    default:
      return `<svg viewBox="0 0 100 100"><g fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round">
        <path d="M16,30 Q50,46 84,70"/><path d="M22,20 Q56,38 90,62" opacity=".5" stroke="${g}"/></g></svg>`
  }
}

// Public API. Plays one elemental burst over targetEl.
//   targetEl — DOM node (enemy image / combat-enemy-row). If null, no-op.
//   element  — skill el value or 'physical'. Unknown values fall back to physical.
export function playHitFx(targetEl, element, skillKey, speed) {
  if (!targetEl) return
  ensureStyles()
  // Per-skill FX takes priority; fall back to element palette, then physical.
  const base = FX[element] || FX.physical
  const skfx = skillKey ? SKILL_FX[skillKey] : null
  const fx = skfx ? { color: skfx.color || base.color, glow: skfx.glow || base.glow, shape: skfx.shape || base.shape } : base

  // The layer is positioned relative to the target. The target needs
  // position other than static; we set it if it's static so the layer
  // anchors correctly (non-destructive — relative doesn't shift layout).
  const pos = getComputedStyle(targetEl).position
  if (pos === 'static') targetEl.style.position = 'relative'

  let layer = targetEl.querySelector(':scope > .cfx-layer')
  if (!layer) {
    layer = document.createElement('div')
    layer.className = 'cfx-layer'
    targetEl.appendChild(layer)
  }

  const el = document.createElement('div')
  el.className = 'cfx cfx-' + fx.shape
  el.innerHTML = svgFor(fx.shape, fx.color, fx.glow)
  // Optional speed override: a number (seconds) sets the animation duration so
  // callers can make e.g. a quick Strike faster than a heavy blow.
  if (typeof speed === 'number' && speed > 0) el.style.animationDuration = speed + 's'
  layer.appendChild(el)

  // Self-remove after the animation finishes (fallback timeout in case
  // animationend doesn't fire, e.g. reduced-motion).
  let done = false
  const cleanup = () => { if (done) return; done = true; el.remove() }
  el.addEventListener('animationend', cleanup, { once: true })
  setTimeout(cleanup, 800)
}

// Buff/self-cast variant: plays the aura shape over the player's side
// (HP row) instead of a hit-burst on the enemy. Same color logic.
export function playBuffFx(targetEl, element) {
  if (!targetEl) return
  ensureStyles()
  const fx = FX[element] || FX.physical
  const pos = getComputedStyle(targetEl).position
  if (pos === 'static') targetEl.style.position = 'relative'
  let layer = targetEl.querySelector(':scope > .cfx-layer')
  if (!layer) { layer = document.createElement('div'); layer.className = 'cfx-layer'; targetEl.appendChild(layer) }
  const el = document.createElement('div')
  el.className = 'cfx cfx-aura'
  el.innerHTML = svgFor('aura', fx.color, fx.glow)
  layer.appendChild(el)
  let done = false
  const cleanup = () => { if (done) return; done = true; el.remove() }
  el.addEventListener('animationend', cleanup, { once: true })
  setTimeout(cleanup, 900)
}

// Optional convenience: map a basic combat action to an element.
// Skills pass their own sk.el; basic strike/heavy are 'physical'.
export function elementForAction(action, skill) {
  if (action === 'skill' && skill && skill.el) return skill.el
  return 'physical'
}
