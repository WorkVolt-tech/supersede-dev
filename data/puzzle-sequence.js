// data/puzzle-sequence.js — Simon-says sequence memory puzzle.
//
// USAGE
//   import { runSequence } from '../../data/puzzle-sequence.js'
//
//   runSequence(panel, {
//     length:  5,          // sequence length (default 5)
//     speed:   600,        // ms per flash (default 600)
//     palette: 4,          // 4 or 6 cells (default 4)
//     headerText: 'SYSTEM // SEQUENCE',
//   }, () => onWin(), () => onLose())
//
// Behavior
//   - Renders N colored cells in a grid
//   - Flashes a random sequence of `length` cells
//   - Player must click cells in the same order
//   - Wrong click → fail (onLose)
//   - All correct → win (onWin)
//
// This module owns the cell grid styles; shared frame styles come from
// puzzle-base.js.

import { installBaseStyles, buildPuzzleFrame } from './puzzle-base.js'

const STYLE_ID = 'puzzle-sequence-styles'
function installStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
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
    /* Cell palette — 6 colors, first 4 used for 4-cell mode */
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

export function runSequence(panel, config, onWin, onLose) {
  installBaseStyles()
  installStyles()

  const {
    length = 5,
    speed = 600,
    palette = 4,
    headerText = 'SYSTEM // SEQUENCE',
  } = config

  const cellCount = (palette === 6) ? 6 : 4
  const sequence = Array.from({ length }, () => Math.floor(Math.random() * cellCount))
  let playerStep = 0
  let acceptingInput = false

  const { frame, body, result } = buildPuzzleFrame(panel, {
    headerText,
    headerRight: `Length: ${length}`,
    prompt: 'A pattern. Watch, then repeat.',
  })

  const cellsHTML = Array.from({ length: cellCount }, (_, i) =>
    `<button class="puzzle-seq-cell disabled" data-cell="${i}" aria-label="cell ${i}"></button>`
  ).join('')

  body.innerHTML = `
    <div class="puzzle-seq-grid cells-${cellCount}">${cellsHTML}</div>
    <div class="puzzle-seq-status">Memorize...</div>
  `
  const cells  = body.querySelectorAll('.puzzle-seq-cell')
  const status = body.querySelector('.puzzle-seq-status')

  const playSequence = () => {
    acceptingInput = false
    cells.forEach(c => c.classList.add('disabled'))
    let i = 0
    const tick = () => {
      if (i >= sequence.length) {
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
    setTimeout(tick, 800)
  }

  const onCellClick = (e) => {
    if (!acceptingInput) return
    const idx = Number(e.currentTarget.dataset.cell)
    e.currentTarget.classList.add('player-active')
    setTimeout(() => e.currentTarget.classList.remove('player-active'), 160)
    if (idx !== sequence[playerStep]) {
      acceptingInput = false
      cells.forEach(c => c.classList.add('disabled'))
      status.textContent = ''
      result.innerHTML = '<div class="puzzle-result fail">✗ BROKEN PATTERN — sequence rejected.</div>'
      frame.classList.add('puzzle-shake')
      setTimeout(() => onLose && onLose(), 1400)
      return
    }
    playerStep += 1
    if (playerStep >= sequence.length) {
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
