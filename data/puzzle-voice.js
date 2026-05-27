// data/puzzle-voice.js — voice discrimination puzzle.
//
// USAGE
//   import { runVoiceDiscrimination } from '../../data/puzzle-voice.js'
//
//   runVoiceDiscrimination(panel, {
//     prompt: 'One of these is your voice. The rest are echoes. Choose.',
//     rounds: 3,                          // how many rounds to play (default 3)
//     voices: [                           // each round: list of voice samples
//       {
//         options: [
//           { text: 'I gotta find a way out.', real: true },
//           { text: 'I gotta find a way... out.', real: false },
//           { text: 'I gotta find... a way out.', real: false },
//         ],
//       },
//       // ... more rounds
//     ],
//     headerText: 'ECHO // VOICE MATCH',
//   }, () => onWin(), () => onLose())
//
// Behavior
//   - Each round shows 3-4 text "voice samples" — variations of a phrase
//   - Player picks which one is the REAL voice (real: true)
//   - Player must get N rounds correct to win
//   - One wrong pick → fail (onLose)
//
// Theme
//   The Echo Beast mimics player voices. The puzzle is to recognize
//   YOUR speech among mimics. Visually styled like waveform / spectrogram
//   strips that the player taps to "select."

import { installBaseStyles, buildPuzzleFrame } from './puzzle-base.js'

const STYLE_ID = 'puzzle-voice-styles'
function installStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .puzzle-voice-rounds {
      display: flex;
      gap: 6px;
      margin-bottom: .85rem;
      font-family: 'Share Tech Mono', monospace;
      font-size: 9px;
      color: #a08858;
      letter-spacing: .12em;
    }
    .puzzle-voice-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: rgba(180,140,90,.2);
      border: 1px solid rgba(180,140,90,.4);
      transition: background .2s, border-color .2s;
    }
    .puzzle-voice-dot.done { background: #8ad48a; border-color: #8ad48a; }
    .puzzle-voice-dot.fail { background: #d48a8a; border-color: #d48a8a; }
    .puzzle-voice-dot.active { background: rgba(212,180,138,.5); border-color: #d4b48a; }
    .puzzle-voice-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 1rem;
    }
    .puzzle-voice-opt {
      background: rgba(0,0,0,.4);
      border: 1px solid rgba(180,140,90,.35);
      padding: .75rem .85rem;
      cursor: pointer;
      transition: border-color .15s, background .15s, transform .1s;
      color: #e8dcc2;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1rem;
      line-height: 1.5;
      text-align: left;
      width: 100%;
      position: relative;
      overflow: hidden;
    }
    /* Faux waveform bar at left edge of each option — purely decorative */
    .puzzle-voice-opt::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 4px;
      background: linear-gradient(180deg,
        transparent 0%,
        rgba(180,140,90,.6) 20%,
        rgba(212,180,138,.9) 50%,
        rgba(180,140,90,.6) 80%,
        transparent 100%);
    }
    .puzzle-voice-opt:hover:not(:disabled) {
      border-color: rgba(212,180,138,.9);
      background: rgba(180,140,90,.08);
    }
    .puzzle-voice-opt:active:not(:disabled) { transform: translateY(1px); }
    .puzzle-voice-opt:disabled { opacity: .5; cursor: not-allowed; }
    .puzzle-voice-opt.correct {
      border-color: #8ad48a !important;
      background: rgba(138,212,138,.08) !important;
    }
    .puzzle-voice-opt.wrong {
      border-color: #d48a8a !important;
      background: rgba(212,138,138,.08) !important;
    }
  `
  document.head.appendChild(style)
}

export function runVoiceDiscrimination(panel, config, onWin, onLose) {
  installBaseStyles()
  installStyles()

  const {
    prompt = 'One of these is your voice. The rest are echoes. Choose.',
    voices = [],
    rounds = voices.length || 3,
    headerText = 'ECHO // VOICE MATCH',
  } = config

  if (!voices.length) {
    console.error('[puzzle-voice] no voices provided')
    onLose && onLose()
    return
  }

  let currentRound = 0
  let correctCount = 0

  const { frame, body, result } = buildPuzzleFrame(panel, {
    headerText,
    headerRight: `Round 1/${rounds}`,
    prompt,
  })

  // Round indicator dots
  const dotsHTML = Array.from({ length: rounds }, (_, i) =>
    `<div class="puzzle-voice-dot${i === 0 ? ' active' : ''}" data-round="${i}"></div>`
  ).join('')
  body.innerHTML = `
    <div class="puzzle-voice-rounds">${dotsHTML}<span style="margin-left:auto">${correctCount}/${rounds} correct</span></div>
    <div class="puzzle-voice-options"></div>
  `
  const optionsHost = body.querySelector('.puzzle-voice-options')
  const dots = body.querySelectorAll('.puzzle-voice-dot')
  const counterSpan = body.querySelector('.puzzle-voice-rounds > span')
  const headerRight = panel.querySelector('.puzzle-header-right')

  const renderRound = () => {
    const round = voices[currentRound]
    if (!round || !round.options) {
      console.error('[puzzle-voice] malformed round', currentRound)
      onLose && onLose()
      return
    }
    headerRight.textContent = `Round ${currentRound + 1}/${rounds}`
    optionsHost.innerHTML = round.options.map((opt, i) =>
      `<button class="puzzle-voice-opt" data-idx="${i}">${opt.text}</button>`
    ).join('')
    optionsHost.querySelectorAll('.puzzle-voice-opt').forEach(btn => {
      btn.addEventListener('click', () => handlePick(btn, round))
    })
  }

  const handlePick = (btn, round) => {
    // Lock all buttons
    optionsHost.querySelectorAll('.puzzle-voice-opt').forEach(b => b.disabled = true)
    const idx = Number(btn.dataset.idx)
    const picked = round.options[idx]
    if (picked.real) {
      btn.classList.add('correct')
      correctCount += 1
      dots[currentRound].classList.remove('active')
      dots[currentRound].classList.add('done')
      counterSpan.textContent = `${correctCount}/${rounds} correct`
      currentRound += 1
      if (currentRound >= rounds) {
        result.innerHTML = '<div class="puzzle-result win">✓ VOICE MATCHED — all rounds correct.</div>'
        setTimeout(() => onWin && onWin(), 1300)
        return
      }
      // Advance to next round
      dots[currentRound].classList.add('active')
      setTimeout(renderRound, 900)
    } else {
      btn.classList.add('wrong')
      dots[currentRound].classList.remove('active')
      dots[currentRound].classList.add('fail')
      // Reveal which was real
      const realIdx = round.options.findIndex(o => o.real)
      if (realIdx !== -1) {
        optionsHost.querySelectorAll('.puzzle-voice-opt')[realIdx].classList.add('correct')
      }
      frame.classList.add('puzzle-shake')
      result.innerHTML = '<div class="puzzle-result fail">✗ ECHO ACCEPTED — the System notes the failure.</div>'
      setTimeout(() => onLose && onLose(), 1700)
    }
  }

  renderRound()
}
