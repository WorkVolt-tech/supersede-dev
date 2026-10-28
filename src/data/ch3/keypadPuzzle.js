export const keypadPuzzleConfig = {
  headerText: 'METRO // ACCESS PANEL',
  prompt: 'The keypad has seven slots, lit faintly. A small display reads:\n\n"VERIFY THE PATTERN."\n\nThe signal pulses overhead. Three short, one long, three short.\n\nDrag the beats into the slots, in order.',
  pieces: [
    { id: 's1', label: '•' },
    { id: 's2', label: '•' },
    { id: 's3', label: '•' },
    { id: 'l1', label: '—' },
    { id: 's4', label: '•' },
    { id: 's5', label: '•' },
    { id: 's6', label: '•' },
  ],
  slots: [
    { id: 'p1', label: '1' }, { id: 'p2', label: '2' }, { id: 'p3', label: '3' },
    { id: 'p4', label: '4' }, { id: 'p5', label: '5' }, { id: 'p6', label: '6' }, { id: 'p7', label: '7' },
  ],
  solution: { p1: 's1', p2: 's2', p3: 's3', p4: 'l1', p5: 's4', p6: 's5', p7: 's6' },
  attempts: 3,
  matchBy: 'label',
}
