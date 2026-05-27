// data/puzzle-base.js — shared infrastructure for all puzzle modules.
//
// PURPOSE
// All puzzle mini-games share a visual frame (dark, scanline, monospace)
// and a common result-presentation pattern. Each puzzle imports
// `installBaseStyles` and calls it once before rendering its own UI.
// Puzzle-specific styles get installed separately by each module.
//
// EXPORTS
//   installBaseStyles()           — one-time inject of shared CSS
//   buildPuzzleFrame(panel, opts) — build the standard frame + return refs
//
// USAGE
//   import { installBaseStyles, buildPuzzleFrame } from './puzzle-base.js'
//
//   export function runMyPuzzle(panel, config, onWin, onLose) {
//     installBaseStyles()
//     const { frame, body, result } = buildPuzzleFrame(panel, {
//       headerText: 'SYSTEM // MY PUZZLE',
//       prompt: 'Solve me',
//     })
//     // ...append your puzzle UI to body
//     // ...show result via result.innerHTML / call onWin/onLose
//   }

const BASE_STYLE_ID = 'puzzle-base-styles'

// Inject the shared puzzle CSS once. Each puzzle module calls this
// before rendering. Idempotent — only adds the <style> tag the first
// time.
export function installBaseStyles() {
  if (document.getElementById(BASE_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = BASE_STYLE_ID
  style.textContent = `
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
  `
  document.head.appendChild(style)
}

// Build the standard puzzle frame and return references for the puzzle
// module to populate. Each puzzle owns what goes inside `body` and what
// updates `result`.
//
// opts:
//   headerText   — top label (e.g. 'SYSTEM // RIDDLE')
//   headerRight  — optional small text on right side of header (e.g. attempts counter)
//   prompt       — main prompt/question text
//   hint         — optional dim hint text below the prompt
//
// Returns:
//   { frame, body, result, headerRight }
//   - frame: the .puzzle-frame element (for shake animation)
//   - body: empty container to append puzzle-specific UI into
//   - result: container for win/fail feedback (use innerHTML)
//   - headerRight: the right header span (for updating live counters)
export function buildPuzzleFrame(panel, opts = {}) {
  const { headerText = 'SYSTEM // PUZZLE', headerRight = '', prompt = '', hint = '' } = opts
  panel.innerHTML = `
    <div class="puzzle-frame">
      <div class="puzzle-header">
        <span>${headerText}</span>
        <span class="puzzle-header-right">${headerRight}</span>
      </div>
      ${prompt ? `<div class="puzzle-prompt">${prompt}</div>` : ''}
      ${hint ? `<div class="puzzle-hint">› ${hint}</div>` : ''}
      <div class="puzzle-body"></div>
      <div class="puzzle-result-host"></div>
    </div>
  `
  return {
    frame:       panel.querySelector('.puzzle-frame'),
    body:        panel.querySelector('.puzzle-body'),
    result:      panel.querySelector('.puzzle-result-host'),
    headerRight: panel.querySelector('.puzzle-header-right'),
  }
}
