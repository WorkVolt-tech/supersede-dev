// data/puzzle-riddle.js — text-input riddle puzzle.
//
// USAGE
//   import { runRiddle } from '../../data/puzzle-riddle.js'
//
//   runRiddle(panel, {
//     prompt:  'I speak without a mouth...',
//     answers: ['echo', 'an echo'],     // case-insensitive
//     attempts: 3,                       // optional, default 3
//     hint:    'You hear me in tunnels', // optional
//     headerText: 'SYSTEM // RIDDLE',    // optional
//   }, () => onWin(), () => onLose())
//
// Behavior
//   - Player types into an input, submits via button OR Enter key
//   - Case-insensitive, trimmed comparison against `answers` array
//   - Correct: shows green "RESOLVED", calls onWin after 1.2s
//   - Wrong: shake animation, attempts decrement
//   - Out of attempts: red "EXHAUSTED", calls onLose after 1.4s
//
// This module owns its specific input/button styles; shared frame/result
// styles come from puzzle-base.js.

import { installBaseStyles, buildPuzzleFrame } from './puzzle-base.js'

const STYLE_ID = 'puzzle-riddle-styles'
function installStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .puzzle-riddle-input {
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
    .puzzle-riddle-input:focus {
      border-color: rgba(212,180,138,.9) !important;
      background: rgba(0,0,0,.55) !important;
    }
    .puzzle-riddle-btn {
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
    .puzzle-riddle-btn:hover:not(:disabled) {
      background: rgba(180,140,90,.24) !important;
      border-color: rgba(212,180,138,.9) !important;
    }
    .puzzle-riddle-btn:active:not(:disabled) { transform: translateY(1px); }
    .puzzle-riddle-btn:disabled { opacity: .4; cursor: not-allowed; }
  `
  document.head.appendChild(style)
}

export function runRiddle(panel, config, onWin, onLose) {
  installBaseStyles()
  installStyles()

  const {
    prompt,
    answers,
    attempts = 3,
    hint = '',
    headerText = 'SYSTEM // RIDDLE',
  } = config

  // Normalize accepted answers once: lowercase + trim. Any match wins.
  const acceptable = (answers || []).map(a => String(a).toLowerCase().trim())
  let remaining = attempts

  const { frame, body, result, headerRight } = buildPuzzleFrame(panel, {
    headerText,
    headerRight: `Attempts: ${remaining}`,
    prompt,
    hint,
  })

  body.innerHTML = `
    <input class="puzzle-riddle-input" type="text" placeholder="Type your answer..." autocomplete="off" spellcheck="false" />
    <button class="puzzle-riddle-btn">Submit</button>
  `
  const input = body.querySelector('.puzzle-riddle-input')
  const btn   = body.querySelector('.puzzle-riddle-btn')
  input.focus()

  // Submit handler — accepts Enter key OR button click.
  const submit = () => {
    const guess = input.value.toLowerCase().trim()
    if (!guess) return
    if (acceptable.includes(guess)) {
      input.disabled = true
      btn.disabled   = true
      result.innerHTML = '<div class="puzzle-result win">✓ CORRECT — pattern resolved.</div>'
      setTimeout(() => onWin && onWin(), 1200)
      return
    }
    remaining -= 1
    headerRight.textContent = `Attempts: ${remaining}`
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
