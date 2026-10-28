import { useState } from 'react'
import DragPuzzle from '../components/puzzle/DragPuzzle'
import { keypadPuzzleConfig } from '../data/ch3/keypadPuzzle'

export default function PuzzleDemoPage() {
  const [status, setStatus] = useState('playing')
  return (
    <div style={{ maxWidth: 420, margin: '2rem auto', padding: '0 1rem' }}>
      <DragPuzzle config={keypadPuzzleConfig} onWin={() => setStatus('won')} onLose={() => setStatus('lost')} />
      {status !== 'playing' && (
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#8a7255', fontFamily: 'monospace', fontSize: 12 }}>
          → would navigate to {status === 'won' ? 'ch3_keypad_win' : 'ch3_keypad_fail'}
        </p>
      )}
    </div>
  )
}
