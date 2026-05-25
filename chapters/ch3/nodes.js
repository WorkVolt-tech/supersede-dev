// chapters/ch3/nodes.js — Chapter 3 "Signal Hunters" node graph
//
// Linear descent. The player enters the metro from a service entrance,
// follows a signal deeper. Each puzzle gate moves them one tier down.
// The Echo Beast lives at the bottom — not in this batch.
//
// Node types:
//   story  — text + choices (same shape as Ch2)
//   puzzle — runs a puzzle from /data/puzzles.js, routes onWin/onLose
//   combat — (not yet wired in this batch; for boss)
//
// Choice extras:
//   moral  — delta to moral_score
//   signal — delta to signal_strength (0-100). Ch3 mechanic.
//   xp     — flat XP gain
//   sub    — small subtext under the button
//
// Puzzle node fields:
//   puzzleType   — 'riddle' | 'sequence'
//   puzzleConfig — passed to the puzzle function
//   onWin        — node id to navigate to on success
//   onLose       — node id to navigate to on failure
//   winChoice    — optional choice-shaped object applied on win (moral, xp, signal)
//   loseChoice   — optional choice-shaped object applied on fail

export const NODES = {

  // ── ENTRY ─────────────────────────────────────────────────────────
  ch3_entry: {
    type: 'story',
    text: `The metro service entrance is unlocked when you find it — not forced, not broken. Unlocked. Which means someone is down there, or has been, recently enough that the lock hasn't been replaced.

The stairs go down further than they should. Forty steps, then a landing. Forty more. Industrial fluorescents flicker on motion, then off behind you. By the third landing you stop counting.

A signal pulses in your ear. Not a sound — a pressure. Three short, one long. Pause. Three short, one long.

The System has never broadcast before. It receives.`,
    choices: [
      { label: 'Descend further — track the signal', sub: 'Signal +5', next: 'ch3_platform', signal: 5 },
      { label: 'Stop. Listen. Record the pattern first.', sub: 'XP +30 · Moral +5', next: 'ch3_record_pattern', moral: 5, xp: 30 },
    ],
  },

  ch3_record_pattern: {
    type: 'story',
    text: `You sit on the landing. Take your interface out of standby. Let the signal cycle three more times before you commit anything.

It isn't morse — too even. Not a heartbeat — too geometric. It pulses on a count of seven. Three short, one long, with a rest measured in the space between the long and the next short. The rest is exactly the same duration every time.

Whatever is broadcasting is not improvising. It is repeating a known sequence.

Your interface logs it cleanly: 0001000. Seven beats.`,
    choices: [
      { label: 'Descend with the pattern in hand', sub: 'Signal +5', next: 'ch3_platform', signal: 5 },
    ],
  },

  // ── PLATFORM ──────────────────────────────────────────────────────
  ch3_platform: {
    type: 'story',
    text: `The bottom of the stairs opens onto a platform. Old line — pre-collapse infrastructure, probably mothballed when the surface district was built. The tile work is intact. The benches are intact. The destination board still scrolls, but slowly, and the words don't always resolve into anything you can read.

The signal is louder here. So is the silence under it.

Two ways forward. The tunnel mouth on the left disappears into proper dark. The maintenance corridor on the right is lit — sodium yellow, full of insects that shouldn't survive at this depth.

A panel beside the tunnel mouth has a keypad. Above the keypad, a plate: WORKER ACCESS — VERIFY.`,
    choices: [
      { label: 'Try the keypad', sub: 'Solve the cipher', next: 'ch3_keypad_puzzle' },
      { label: 'Take the maintenance corridor', sub: 'Avoid the puzzle, signal goes quieter', next: 'ch3_corridor', signal: -3 },
    ],
  },

  // ── PUZZLE 1: keypad cipher ───────────────────────────────────────
  // First puzzle. Easy difficulty, riddle/cipher hybrid. Pattern shown
  // earlier (0001000) is the answer.
  ch3_keypad_puzzle: {
    type: 'puzzle',
    puzzleType: 'riddle',
    puzzleConfig: {
      prompt: 'The keypad has seven slots, lit faintly. A small display reads:\n\n"VERIFY THE PATTERN."\n\nThe signal pulses overhead. Three short, one long.',
      answers: ['0001000', '0,0,0,1,0,0,0', '0 0 0 1 0 0 0'],
      attempts: 3,
      hint: 'You logged the pattern earlier. Three short, one long, three short. Use 0 for short, 1 for long.',
      headerText: 'METRO // ACCESS PANEL',
    },
    onWin:  'ch3_keypad_win',
    onLose: 'ch3_keypad_fail',
    winChoice:  { signal: 10, xp: 50 },
    loseChoice: { signal: -5 },
  },

  ch3_keypad_win: {
    type: 'story',
    text: `Seven beats entered. The keypad accepts them on the first try.

The panel hisses, drops two inches, and slides into the wall. Behind it, a service hatch. Clean inside. Lit. A maintenance access ladder going down further.

The signal sharpens — you've moved closer to its source. Or it's moved closer to you. The pulse is the same. The pressure isn't.`,
    rewards: [{ itemKey: 'rune_lux', qty: 1 }],
    choices: [
      { label: 'Climb down the service ladder', sub: 'Signal +10', next: 'ch3_subplatform', signal: 10 },
    ],
  },

  ch3_keypad_fail: {
    type: 'story',
    text: `The keypad locks out on the third wrong entry. A small red light comes on. Somewhere far down the tunnel, you hear a service door close — once, then again, slightly closer.

You step back from the panel.

The maintenance corridor is still lit. The tunnel mouth is darker than it was.`,
    choices: [
      { label: 'Take the maintenance corridor anyway', next: 'ch3_corridor' },
    ],
  },

  // ── MAINTENANCE CORRIDOR ──────────────────────────────────────────
  // Alt path. Lower signal gain, but no puzzle. Joins back to the same
  // subplatform via a longer route.
  ch3_corridor: {
    type: 'story',
    text: `Sodium light. Concrete walls weeping condensation. The insects you saw from the platform are everywhere down here — small, wrong-colored, moving in coordinated lines across the floor and ceiling.

They ignore you. Whatever they're doing, you are not part of it.

The corridor bends. At the bend, a maintenance cart sits against the wall, full of tools you don't recognize and a logbook with the cover ripped off. The first intact page reads: "Day 41. Whatever is in the deep tunnel is louder. Day 42. We're not going back."

The corridor continues. Below the floor grating, you hear running water. A long way down.`,
    choices: [
      { label: 'Take the tools you can use, keep moving', sub: 'XP +30', next: 'ch3_subplatform', xp: 30 },
      { label: 'Read the rest of the logbook', sub: 'XP +50 · Moral +3', next: 'ch3_corridor_read', xp: 50, moral: 3 },
    ],
  },

  ch3_corridor_read: {
    type: 'story',
    text: `Forty-three pages, dated tightly. Six workers, then five, then three. The last entry is in different handwriting — shakier, in pencil where the others used pen.

"It learned my voice. I heard myself ask me to open the maintenance hatch. I almost did."

You close the book. Slide it back where you found it.

The signal pulses overhead. Three short, one long.`,
    choices: [
      { label: 'Continue down the corridor', sub: 'Signal +5', next: 'ch3_subplatform', signal: 5 },
    ],
  },

  // ── SUBPLATFORM ───────────────────────────────────────────────────
  ch3_subplatform: {
    type: 'story',
    text: `The corridor (or ladder) ends at a smaller platform — narrower, lower ceiling, no benches. A single train sits at the platform. Old. Doors open. Lights on inside, somehow.

The signal is loud enough now that you can feel it in your sternum.

There are footprints on the platform. Wet. Recent. Going into the train, not out of it.`,
    choices: [
      { label: 'Board the train', sub: 'Follow the footprints', next: 'ch3_train_interior' },
      { label: 'Check the destination board first', sub: 'XP +20', next: 'ch3_destination', xp: 20 },
    ],
  },

  ch3_destination: {
    type: 'story',
    text: `The destination board scrolls, then locks on a single word that doesn't blink.

ECHO.

Not a station name you know. Not a station name you've ever heard. The board scrolls again, freshly: ECHO. EVERY THIRTY SECONDS. ECHO.

You count thirty seconds. The board updates. ECHO.

The train doors are still open.`,
    choices: [
      { label: 'Board the train', sub: 'Signal +5', next: 'ch3_train_interior', signal: 5 },
    ],
  },

  // ── TRAIN INTERIOR ────────────────────────────────────────────────
  ch3_train_interior: {
    type: 'story',
    text: `The car is empty. The seats are upholstered, intact, clean — far cleaner than anything you've seen since the surface. The lights are warm. There's a faint hum that has nothing to do with the signal.

At the far end of the car, an emergency control panel is exposed. Three switches in a row, two indicator lights below them, and a placard reading: SEQUENCE TO DEPART.

The doors close behind you. Not violently. Just — close.

The signal is no longer pulsing. It's holding.`,
    choices: [
      { label: 'Engage the departure sequence', sub: 'Watch the pattern, then repeat', next: 'ch3_train_sequence' },
      { label: 'Try to force the doors back open', sub: 'Moral -5 · uncertain outcome', next: 'ch3_train_force', moral: -5 },
    ],
  },

  // ── PUZZLE 2: train departure sequence ────────────────────────────
  // Sequence puzzle (Simon-says). Length 5, normal speed.
  ch3_train_sequence: {
    type: 'puzzle',
    puzzleType: 'sequence',
    puzzleConfig: {
      length: 5,
      speed: 600,
      palette: 4,
      headerText: 'TRAIN // DEPARTURE',
    },
    onWin:  'ch3_train_depart',
    onLose: 'ch3_train_lockout',
    winChoice:  { signal: 15, xp: 60 },
    loseChoice: { signal: -10, moral: -5 },
  },

  ch3_train_depart: {
    type: 'story',
    text: `The switches register your sequence. Both indicators turn green. The train shifts — softly, with the inertia of something heavy that hasn't moved in a long time — and starts to roll forward, into a tunnel that has no schedule and no other passengers.

The signal locks tighter. Not louder. More specific. Like it's no longer searching for you.`,
    choices: [
      { label: 'Sit. Watch the tunnel.', next: 'ch3_train_descent' },
    ],
  },

  ch3_train_lockout: {
    type: 'story',
    text: `The sequence breaks. An alarm pulses once. The indicator lights both go red, then off. The hum in the car drops a half-tone and stays there.

The doors do not open.

The train does not move.

You wait. After a long time, the panel resets. Three switches, two lights. SEQUENCE TO DEPART.

You try again — but the air in the car has changed. It feels watched.`,
    choices: [
      { label: 'Try the sequence again, more carefully', sub: 'Signal +5 if you succeed', next: 'ch3_train_sequence', signal: 5 },
    ],
  },

  ch3_train_force: {
    type: 'story',
    text: `You jam your shoulder into the door seam. It doesn't budge. You try the emergency handle above the door. It comes off in your hand.

The handle is not connected to anything. It was a prop.

You stand there holding it for a long second. Then you set it carefully on a seat — like you don't want to disrespect whoever was meant to find it — and walk back to the control panel.

The sequence is the only way out.`,
    choices: [
      { label: 'Engage the departure sequence', next: 'ch3_train_sequence' },
    ],
  },

  // ── TRAIN DESCENT ─────────────────────────────────────────────────
  ch3_train_descent: {
    type: 'story',
    text: `The tunnel slopes down. You can feel it in your inner ear before you can see it in the window — which is just dark, then darker, then occasionally interrupted by a maintenance light that is on for no reason.

After what might be ten minutes or might be twenty, you notice the reflections in the window.

They aren't of you.

Or rather — one of them is. The other one is sitting opposite you in the empty seat. It is reading something. When you turn to look at the seat directly, it is empty.

When you look back at the window, the reflection is gone too.

The train slows. A station materializes out of the dark — single platform, single sign that you cannot read because the letters keep rearranging themselves.

The doors open.`,
    choices: [
      { label: 'Step out onto the platform', sub: 'Signal +10', next: 'ch3_echo_station', signal: 10 },
    ],
  },

  // ── ECHO STATION ──────────────────────────────────────────────────
  // End of the opening sequence. Subsequent content (final puzzle gate
  // before the Echo Beast, and the boss itself) comes in a later batch.
  ch3_echo_station: {
    type: 'story',
    text: `The platform is yours. The train pulls away behind you on its own schedule, into deeper dark. The sign above the platform finally settles long enough to read:

ECHO — ALL PASSENGERS HEARD.

A single corridor leads off the platform. The signal that has been pulsing in your ear since you entered the metro is now coming from down that corridor — not as a pulse, but as a voice.

Your voice.

It is repeating something you said three hours ago, on the stairs, when you thought you were alone.

[END OF OPENING — Chapter 3 content in progress.]`,
    choices: [
      { label: '(End of current build — return to district)', next: 'ch3_entry' },
    ],
  },

}
