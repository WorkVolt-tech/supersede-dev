// ─────────────────────────────────────────────────────────────────────────
// puzzles.js — shared puzzle mini-game module
//
// Puzzles are mini-games that resolve to a success/fail callback. They
// follow the same pattern as combat: render into a target panel, then
// call onWin/onLose when the player resolves them.
//
// Each puzzle is parameterized — the chapter calling it provides the
// content (riddle question, sequence length, etc.) and the callbacks.
// The module owns DOM, state, and CSS.
//
// USAGE FROM A CHAPTER:
//
//   import { runRiddle, runSequence } from '../../data/puzzles.js'
//
//   // In a node handler:
//   const panel = document.getElementById('puzzle-panel')
//   runRiddle(panel, {
//     prompt: 'I speak without a mouth and hear without ears...',
//     answers: ['echo', 'an echo'],   // case-insensitive
//     attempts: 2,                    // optional, default 3
//     hint: 'You hear me in tunnels'  // optional
//   }, () => goTo('next_win'), () => goTo('next_fail'))
//
//   runSequence(panel, {
//     length: 5,                      // sequence length (3-8 reasonable)
//     speed: 600,                     // ms per flash
//     palette: 4                      // 4 or 6 cells
//   }, () => goTo('next_win'), () => goTo('next_fail'))
//
// DESIGN NOTES:
//   - Puzzles do NOT touch DB / player state. The chapter handles that
//     after the callback fires.
//   - Puzzles do NOT navigate. The callbacks are the only way out.
//   - Each puzzle inserts its own scoped CSS the first time it runs.
//     Re-running doesn't duplicate styles.
//   - Styles assume a dark/eerie aesthetic suitable for Ch3 (Echo Beast,
//     Metro tunnels). If you want a different theme per chapter, that's
//     a future change.
// ─────────────────────────────────────────────────────────────────────────

// ── Style injection (idempotent) ────────────────────────────────────────
// Installs the puzzle stylesheet once. Called by each runX function.
const PUZZLE_STYLE_ID = 'puzzle-module-styles'
function installPuzzleStyles() {
  if (document.getElementById(PUZZLE_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = PUZZLE_STYLE_ID
  style.textContent = `
    /* ── Puzzle module styles ──
       Themed for Ch3 (Metro tunnels, Echo Beast). Dark frame, monospace
       prompt, subtle scanline texture. Each puzzle uses .puzzle-frame as
       its root container; sub-elements are puzzle-<thing>. */
    .puzzle-frame {
      background: linear-gradient(180deg, rgba(20,15,12,.96) 0%, rgba(28,22,18,.96) 100%);
      border: 1px solid rgba(180,140,90,.55);
      box-shadow: 0 0 24px rgba(0,0,0,.4), inset 0 0 32px rgba(180,140,90,.06);
      padding: 1.25rem 1.5rem;
      color: #e8dcc2;
      font-family: 'JetBrains Mono', 'Share Tech Mono', monospace;
      position: relative;
      overflow: hidden;
    }
    .puzzle-frame::before {
      content: '';
      position: absolute; inset: 0;
      pointer-events: none;
      background: repeating-linear-gradient(0deg, rgba(180,140,90,.03) 0px, rgba(180,140,90,.03) 1px, transparent 1px, transparent 4px);
    }
    .puzzle-frame > * { position: relative; z-index: 1; }
    .puzzle-header {
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      letter-spacing: .2em;
      color: #d4b48a;
      text-transform: uppercase;
      margin-bottom: .75rem;
      padding-bottom: .5rem;
      border-bottom: 1px solid rgba(180,140,90,.3);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .puzzle-prompt {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.05rem;
      line-height: 1.55;
      color: #e8dcc2;
      margin-bottom: 1rem;
      font-style: italic;
      white-space: pre-line;
    }
    .puzzle-hint {
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      color: #a08858;
      letter-spacing: .06em;
      margin-bottom: 1rem;
      padding: .5rem .75rem;
      border-left: 2px solid rgba(180,140,90,.4);
      background: rgba(180,140,90,.05);
    }
    .puzzle-input {
      background: rgba(0,0,0,.4) !important;
      border: 1px solid rgba(180,140,90,.5) !important;
      color: #e8dcc2 !important;
      font-family: 'Share Tech Mono', monospace !important;
      font-size: 14px !important;
      padding: .6rem .8rem !important;
      width: 100%;
      letter-spacing: .04em;
      outline: none;
      transition: border-color .15s, background .15s;
    }
    .puzzle-input:focus {
      border-color: rgba(212,180,138,.9) !important;
      background: rgba(0,0,0,.55) !important;
    }
    .puzzle-btn {
      font-family: 'Cinzel', serif !important;
      font-size: .85rem !important;
      letter-spacing: .12em !important;
      color: #e8dcc2 !important;
      background: rgba(180,140,90,.12) !important;
      border: 1px solid rgba(180,140,90,.5) !important;
      padding: .55rem 1.1rem !important;
      cursor: pointer;
      transition: background .15s, border-color .15s, transform .1s;
      margin-top: .75rem;
    }
    .puzzle-btn:hover:not(:disabled) {
      background: rgba(180,140,90,.24) !important;
      border-color: rgba(212,180,138,.9) !important;
    }
    .puzzle-btn:active:not(:disabled) {
      transform: translateY(1px);
    }
    .puzzle-btn:disabled {
      opacity: .4;
      cursor: not-allowed;
    }
    .puzzle-attempts {
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      letter-spacing: .15em;
      color: #a08858;
      margin-top: .5rem;
    }
    .puzzle-result {
      margin-top: 1rem;
      padding: .75rem 1rem;
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      letter-spacing: .08em;
      animation: puzzleFadeIn .3s ease-out;
    }
    .puzzle-result.win  { color: #8ad48a; border: 1px solid rgba(138,212,138,.5); background: rgba(138,212,138,.06); }
    .puzzle-result.fail { color: #d48a8a; border: 1px solid rgba(212,138,138,.5); background: rgba(212,138,138,.06); }
    @keyframes puzzleFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes puzzleShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
    .puzzle-shake { animation: puzzleShake .25s ease-in-out; }
    /* ── Sequence puzzle (Simon-says) ─── */
    .puzzle-seq-grid {
      display: grid;
      gap: 8px;
      margin: 1rem auto;
      width: fit-content;
    }
    .puzzle-seq-grid.cells-4 { grid-template-columns: repeat(2, 88px); }
    .puzzle-seq-grid.cells-6 { grid-template-columns: repeat(3, 80px); }
    .puzzle-seq-cell {
      width: 88px; height: 88px;
      border: 2px solid rgba(255,255,255,.15);
      background: rgba(0,0,0,.4);
      cursor: pointer;
      transition: filter .1s, transform .1s, box-shadow .1s;
      position: relative;
    }
    .puzzle-seq-grid.cells-6 .puzzle-seq-cell { width: 80px; height: 80px; }
    .puzzle-seq-cell.disabled { cursor: not-allowed; opacity: .7; }
    .puzzle-seq-cell.flash {
      filter: brightness(2.2);
      box-shadow: 0 0 24px var(--seq-glow, currentColor);
      transform: scale(1.04);
    }
    .puzzle-seq-cell.player-active {
      filter: brightness(1.6);
      box-shadow: 0 0 14px var(--seq-glow, currentColor);
    }
    /* Default 4-cell palette */
    .puzzle-seq-cell[data-cell="0"] { background: #882020; --seq-glow: #ff6060; }
    .puzzle-seq-cell[data-cell="1"] { background: #206688; --seq-glow: #60a0ff; }
    .puzzle-seq-cell[data-cell="2"] { background: #207830; --seq-glow: #80e090; }
    .puzzle-seq-cell[data-cell="3"] { background: #886820; --seq-glow: #ffd060; }
    .puzzle-seq-cell[data-cell="4"] { background: #6020a0; --seq-glow: #c080ff; }
    .puzzle-seq-cell[data-cell="5"] { background: #208870; --seq-glow: #60e0c0; }
    .puzzle-seq-status {
      text-align: center;
      font-family: 'Share Tech Mono', monospace;
      font-size: 10px;
      letter-spacing: .12em;
      color: #d4b48a;
      margin-top: .5rem;
    }
  `
  document.head.appendChild(style)
}

// ── Riddle puzzle ────────────────────────────────────────────────────────
// Text-input puzzle. Shows a prompt, accepts an answer (case-insensitive,
// trimmed). Compares against the `answers` array. The player has N
// attempts (default 3) before failure. On success/fail, calls the
// appropriate callback.
//
// PARAMETERS:
//   panel    — DOM element to render into (chapter provides this)
//   config   — { prompt, answers, attempts?, hint?, headerText? }
//   onWin    — callback for success (no args)
//   onLose   — callback for exhausted attempts (no args)
//
// CONFIG:
//   prompt     — string. The riddle/question text.
//   answers    — array of strings. Any matches (case-insensitive). Match
//                is exact-after-lowercase + trim. If the riddle wants
//                fuzzy matching ("a man" vs "man"), include both variants.
//   attempts   — int. Default 3. Failure fires onLose.
//   hint       — string (optional). Shown in a dim hint box below prompt.
//   headerText — string (optional). Top label, default 'SYSTEM // PUZZLE'
export function runRiddle(panel, config, onWin, onLose) {
  installPuzzleStyles()
  const {
    prompt,
    answers,
    attempts = 3,
    hint = '',
    headerText = 'SYSTEM // RIDDLE',
  } = config
  // Defensive: normalize answers once.
  const acceptable = (answers || []).map(a => String(a).toLowerCase().trim())
  let remaining = attempts

  // Render structure. Input + submit button + attempts counter.
  panel.innerHTML = `
    <div class="puzzle-frame">
      <div class="puzzle-header">
        <span>${headerText}</span>
        <span class="puzzle-attempts-inline">Attempts: ${remaining}</span>
      </div>
      <div class="puzzle-prompt">${prompt}</div>
      ${hint ? `<div class="puzzle-hint">› ${hint}</div>` : ''}
      <input class="puzzle-input" type="text" placeholder="Type your answer..." autocomplete="off" spellcheck="false" />
      <button class="puzzle-btn">Submit</button>
      <div class="puzzle-result-host"></div>
    </div>`

  const frame   = panel.querySelector('.puzzle-frame')
  const input   = panel.querySelector('.puzzle-input')
  const btn     = panel.querySelector('.puzzle-btn')
  const counter = panel.querySelector('.puzzle-attempts-inline')
  const result  = panel.querySelector('.puzzle-result-host')

  input.focus()

  // Submit handler — accepts Enter key OR button click.
  const submit = () => {
    const guess = input.value.toLowerCase().trim()
    if (!guess) return
    if (acceptable.includes(guess)) {
      // Win. Lock the input and call back after a short pause for feedback.
      input.disabled = true
      btn.disabled   = true
      result.innerHTML = '<div class="puzzle-result win">✓ CORRECT — pattern resolved.</div>'
      setTimeout(() => onWin && onWin(), 1200)
      return
    }
    remaining -= 1
    counter.textContent = `Attempts: ${remaining}`
    frame.classList.add('puzzle-shake')
    setTimeout(() => frame.classList.remove('puzzle-shake'), 260)
    if (remaining <= 0) {
      input.disabled = true
      btn.disabled   = true
      result.innerHTML = '<div class="puzzle-result fail">✗ INCORRECT — attempts exhausted.</div>'
      setTimeout(() => onLose && onLose(), 1400)
      return
    }
    result.innerHTML = `<div class="puzzle-result fail">✗ INCORRECT — ${remaining} attempt${remaining===1?'':'s'} remaining.</div>`
    input.value = ''
    input.focus()
  }

  btn.addEventListener('click', submit)
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submit() }
  })
}

// ── Sequence puzzle (Simon-says) ────────────────────────────────────────
// Shows N colored cells. Flashes a sequence in order. Player must click
// the cells in the same order to win. Wrong click = fail.
//
// PARAMETERS:
//   panel    — DOM element to render into
//   config   — { length?, speed?, palette?, headerText? }
//   onWin    — callback for full-sequence-correct
//   onLose   — callback for any wrong click
//
// CONFIG:
//   length     — int. Default 5. How many flashes in the sequence.
//   speed      — int ms. Default 600. Time between flashes (and hold time).
//   palette    — int. 4 or 6. Number of available cells. Default 4.
//   headerText — string. Default 'SYSTEM // SEQUENCE'
export function runSequence(panel, config, onWin, onLose) {
  installPuzzleStyles()
  const {
    length = 5,
    speed = 600,
    palette = 4,
    headerText = 'SYSTEM // SEQUENCE',
  } = config
  const cellCount = (palette === 6) ? 6 : 4
  // Generate the sequence. Use crypto.getRandomValues for variety; fall
  // back to Math.random if unavailable.
  const rng = () => Math.floor(Math.random() * cellCount)
  const sequence = Array.from({ length }, rng)
  let playerStep = 0
  let acceptingInput = false

  // Render. Cells are buttons styled by --seq-glow CSS variable.
  const cellsHTML = Array.from({ length: cellCount }, (_, i) =>
    `<button class="puzzle-seq-cell disabled" data-cell="${i}" aria-label="cell ${i}"></button>`
  ).join('')

  panel.innerHTML = `
    <div class="puzzle-frame">
      <div class="puzzle-header">
        <span>${headerText}</span>
        <span class="puzzle-attempts-inline">Length: ${length}</span>
      </div>
      <div class="puzzle-prompt">A pattern. Watch, then repeat.</div>
      <div class="puzzle-seq-grid cells-${cellCount}">${cellsHTML}</div>
      <div class="puzzle-seq-status">Memorize...</div>
      <div class="puzzle-result-host"></div>
    </div>`

  const cells  = panel.querySelectorAll('.puzzle-seq-cell')
  const status = panel.querySelector('.puzzle-seq-status')
  const result = panel.querySelector('.puzzle-result-host')

  // Play the sequence then enable input.
  const playSequence = () => {
    acceptingInput = false
    cells.forEach(c => c.classList.add('disabled'))
    let i = 0
    const tick = () => {
      if (i >= sequence.length) {
        // Done flashing — enable input.
        status.textContent = 'Repeat the pattern.'
        cells.forEach(c => c.classList.remove('disabled'))
        acceptingInput = true
        return
      }
      const cell = cells[sequence[i]]
      cell.classList.add('flash')
      setTimeout(() => {
        cell.classList.remove('flash')
        i += 1
        setTimeout(tick, speed * 0.4)
      }, speed * 0.6)
    }
    setTimeout(tick, 800) // initial pause before sequence starts
  }

  // Player click handler.
  const onCellClick = (e) => {
    if (!acceptingInput) return
    const idx = Number(e.currentTarget.dataset.cell)
    // Visual feedback on the clicked cell.
    e.currentTarget.classList.add('player-active')
    setTimeout(() => e.currentTarget.classList.remove('player-active'), 160)
    if (idx !== sequence[playerStep]) {
      // Wrong — fail.
      acceptingInput = false
      cells.forEach(c => c.classList.add('disabled'))
      status.textContent = ''
      result.innerHTML = '<div class="puzzle-result fail">✗ BROKEN PATTERN — sequence rejected.</div>'
      panel.querySelector('.puzzle-frame').classList.add('puzzle-shake')
      setTimeout(() => onLose && onLose(), 1400)
      return
    }
    playerStep += 1
    if (playerStep >= sequence.length) {
      // All correct — win.
      acceptingInput = false
      cells.forEach(c => c.classList.add('disabled'))
      status.textContent = ''
      result.innerHTML = '<div class="puzzle-result win">✓ PATTERN MATCHED — sequence resolved.</div>'
      setTimeout(() => onWin && onWin(), 1300)
    }
  }
  cells.forEach(c => c.addEventListener('click', onCellClick))

  playSequence()
}
