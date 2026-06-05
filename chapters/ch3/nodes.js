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
    signals: [
      { text: 'three short one long. three short one long.', real: true },
      { text: 'come down. come, come down.', real: false },
    ],
    choices: [
      { label: 'Descend further — track the signal', sub: 'Signal +5', next: 'ch3_platform', signal: 5 },
      { label: 'Stop. Listen. Record the pattern first.', sub: 'XP +30 · Moral +3', next: 'ch3_record_pattern', moral: 3, xp: 30 },
    ],
    // Very-early cache — appears at any signal_strength (5+) which the
    // player hits the moment they descend. Encourages exploration on
    // re-enter and rewards anyone who actually descends with the signal.
    cache: {
      id: 'ch3_cache_entry',
      reqSignal: 5,
      itemKey: 'medical_pack', qty: 1,
      label: 'Check the second landing',
      sub: 'A faint resonance behind the stairwell wall',
      foundText: `You stop at the second landing and put a hand on the wall. The pressure of the signal is stronger here — concentrated in a few square feet of plaster. Behind a loose access panel: someone left a sealed med kit. Recent. The seal hasn't yellowed.

The signal carries on past you. It wasn't pointing at the kit. The kit was just on the way.`,
    },
  },

  ch3_record_pattern: {
    type: 'story',
    text: `You sit on the landing. Take your interface out of standby. Let the signal cycle three more times before you commit anything.

It isn't morse — too even. Not a heartbeat — too geometric. It pulses on a count of seven. Three short, one long, with a rest measured in the space between the long and the next short. The rest is exactly the same duration every time.

Whatever is broadcasting is not improvising. It is repeating a known sequence.

Your interface logs it cleanly: 0001000. Seven beats.`,
    signals: [
      { text: '[pulse] 0001000. [pulse] 0001000.', real: true },
      { text: 'pattern recorded. pattern recorded. recorded.', real: false },
    ],
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
    signals: [
      { text: '...verify... worker access... verify...', real: true },
      { text: "it's calm down here. calm. it's calm.", real: false },
      { text: '[low hum, descending]', real: true },
    ],
    choices: [
      { label: 'Try the keypad', sub: 'Solve the cipher', next: 'ch3_keypad_puzzle' },
      { label: 'Take the maintenance corridor', sub: 'Avoid the puzzle, signal goes quieter', next: 'ch3_corridor', signal: -3 },
    ],
    // Hidden cache — only appears once signal_strength >= 30 ('present').
    // One-time grab, tracked in player.caches_found.
    cache: {
      id: 'ch3_cache_platform',
      reqSignal: 30,
      itemKey: 'rune_lux', qty: 1,
      label: 'Trace the signal to the bench',
      sub: 'PRESENT signal — something is buried in the old line',
      foundText: `You follow the signal to the third bench. The maintenance hatch beneath it is unlocked — someone left it that way. Inside: a sealed cache, dry despite the depth.\n\nThe signal hum drops for a moment, like it was guiding you here and is satisfied now that you've arrived.`,
    },
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
    signals: [
      { text: '[pulse sharpens. tone unchanged.]', real: true },
      { text: 'access. access. access granted.', real: false },
    ],
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
    signals: [
      { text: '[distant service door — single close.]', real: true },
      { text: 'try again. try. try again, try.', real: false },
    ],
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
    signals: [
      { text: "it's calm. calm. it's calm down here.", real: false },
      { text: '[running water — distant, below grate.]', real: true },
      { text: 'over here, friend. over, over here.', real: false },
    ],
    choices: [
      { label: 'Take the tools you can use, keep moving', sub: 'XP +30', next: 'ch3_subplatform', xp: 30 },
      { label: 'Read the rest of the logbook', sub: 'XP +50 · Moral +2', next: 'ch3_corridor_read', xp: 50, moral: 2 },
      // Echo trap — a voice "from the deep tunnel" the logbook warned about.
      // Mirrors the day-42 voice from the journal; an attentive player will
      // distrust it.
      { label: 'Follow the voice from the deep tunnel', sub: 'Someone calling — sounds calm, sounds calm, sounds calm', next: 'ch3_misdirect_corridor', signal: -5, echoTrap: true },
    ],
  },

  // Echo misdirect — corridor. Player follows the false voice into the
  // sub-tunnel; gets nothing for it and has to backtrack.
  ch3_misdirect_corridor: {
    type: 'story',
    text: `The voice is calm. You follow it down a side branch you didn't notice on the first pass — narrower, lower, the insects thinner here.

The voice keeps repeating the same calm phrase. The same intonation. The same breath.

You reach the end of the branch. A dead service shaft, half-collapsed, water at the bottom. Nothing else. No one.

The voice is still speaking when you turn around. It has not noticed you stopped walking toward it.

You walk back. The maintenance corridor is still where you left it.`,
    onEnter: { hp: -5 },
    choices: [
      { label: 'Return to the corridor', sub: 'You know better now', next: 'ch3_corridor' },
    ],
  },

  ch3_corridor_read: {
    type: 'story',
    text: `Forty-three pages, dated tightly. Six workers, then five, then three. The last entry is in different handwriting — shakier, in pencil where the others used pen.

"It learned my voice. I heard myself ask me to open the maintenance hatch. I almost did."

You close the book. Slide it back where you found it.

The signal pulses overhead. Three short, one long.`,
    signals: [
      { text: '[pulse overhead — three short, one long.]', real: true },
      { text: "open the hatch. open. open the hatch.", real: false },
    ],
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
    signals: [
      { text: '[signal — chest-level resonance, steady.]', real: true },
      { text: 'another train. another. one more train.', real: false },
      { text: '[no air movement in tunnel.]', real: true },
    ],
    choices: [
      { label: 'Board the train', sub: 'Follow the footprints', next: 'ch3_train_interior' },
      { label: 'Check the destination board first', sub: 'XP +20', next: 'ch3_destination', xp: 20 },
      // Echo trap — a "second train" the player thinks they hear arriving.
      // Tell: the wet footprints all go IN, not out. There is only one train.
      { label: 'Wait — another train is approaching', sub: 'You hear it. You hear it. You hear it.', next: 'ch3_misdirect_subplatform', signal: -5, echoTrap: true },
    ],
  },

  ch3_destination: {
    type: 'story',
    text: `The destination board scrolls, then locks on a single word that doesn't blink.

ECHO.

Not a station name you know. Not a station name you've ever heard. The board scrolls again, freshly: ECHO. EVERY THIRTY SECONDS. ECHO.

You count thirty seconds. The board updates. ECHO.

The train doors are still open.`,
    signals: [
      { text: '[board update — t+30s — "ECHO"]', real: true },
      { text: 'echo. echo. echo.', real: false },
      { text: '[low resonance, locked phase.]', real: true },
    ],
    choices: [
      { label: 'Board the train', sub: 'Signal +5', next: 'ch3_train_interior', signal: 5 },
    ],
    // Cache for the player who paused to read the board AND has been
    // accumulating signal. The maintenance bay behind the board is only
    // reachable when your signal can localize through the platform walls.
    cache: {
      id: 'ch3_cache_destination',
      reqSignal: 35,
      itemKey: 'rune_lux', qty: 2,
      label: 'Trace the resonance past the board',
      sub: 'STRONG signal — the board hides a maintenance recess behind it',
      foundText: `You step closer to the destination board and the signal sharpens against your right ear. There's a seam in the wall paint behind the scroller — a maintenance recess, never meant to be opened by the public.

The catch gives easily. Inside, someone left a small cache with intent: two compressed Lux runes wrapped in a square of clean cloth, sitting on top of a folded note.

The note says: "If you're hearing it clearly, you're close. Don't trust the voice that knows your name."`,
    },
  },

  // ── TRAIN INTERIOR ────────────────────────────────────────────────
  ch3_train_interior: {
    type: 'story',
    text: `The car is empty. The seats are upholstered, intact, clean — far cleaner than anything you've seen since the surface. The lights are warm. There's a faint hum that has nothing to do with the signal.

At the far end of the car, an emergency control panel is exposed. Three switches in a row, two indicator lights below them, and a placard reading: SEQUENCE TO DEPART.

The doors close behind you. Not violently. Just — close.

The signal is no longer pulsing. It's holding.`,
    signals: [
      { text: '[signal — hold tone, no pulse.]', real: true },
      { text: 'you came. you came down. you came.', real: false },
      { text: '[carriage hum, separate frequency from signal.]', real: true },
    ],
    choices: [
      { label: 'Engage the departure sequence', sub: 'Watch the pattern, then repeat', next: 'ch3_train_sequence' },
      { label: 'Try to force the doors back open', sub: 'Moral -3 · uncertain outcome', next: 'ch3_train_force', moral: -3 },
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
    loseChoice: { signal: -10, moral: -3 },
  },

  ch3_train_depart: {
    type: 'story',
    text: `The switches register your sequence. Both indicators turn green. The train shifts — softly, with the inertia of something heavy that hasn't moved in a long time — and starts to roll forward, into a tunnel that has no schedule and no other passengers.

The signal locks tighter. Not louder. More specific. Like it's no longer searching for you.`,
    signals: [
      { text: '[signal phase lock. zero drift.]', real: true },
      { text: 'good. good. you did it.', real: false },
    ],
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
    signals: [
      { text: '[hum: half-tone drop. sustained.]', real: true },
      { text: 'try again. try. try again, try.', real: false },
      { text: 'i am patient. i am. patient.', real: false },
    ],
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
    signals: [
      { text: '[material analysis — plastic, painted to look forged.]', real: true },
      { text: 'good. take care of it. take care.', real: false },
    ],
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
    signals: [
      { text: '[two heat signatures detected. one is yours.]', real: true },
      { text: "i was waiting. i waited. i'm here.", real: false },
      { text: '[descent angle: 11 degrees. consistent.]', real: true },
    ],
    choices: [
      { label: 'Step out onto the platform', sub: 'Signal +10', next: 'ch3_echo_station', signal: 10 },
    ],
    // STRONG-tier cache — a maintenance kit under the seat where the
    // "reflection" was sitting. Only findable when signal is sharp enough
    // to localize through the cushion.
    cache: {
      id: 'ch3_cache_descent',
      reqSignal: 55,
      itemKey: 'item_voice_imprint', qty: 1,
      label: 'Search the seat opposite',
      sub: 'STRONG signal — something small, dense, under the cushion',
      foundText: `You cross the car and slide your hand under the seat opposite — where the reflection sat reading. There's nothing on top. But under the cushion, taped to the underside in a way that suggests someone with time and intent, is a small resin block. A waveform sealed inside it.

A voice imprint. Older than this train. Captured by someone before the Echo had a chance to copy it.

The signal hums softer for a moment — like it noticed you took something it didn't want you to take.`,
    },
  },

  // ── ECHO STATION ──────────────────────────────────────────────────
  // Echo Station — the player arrives at the named destination. The
  // signal is now identifiable as a voice. From here, the player
  // explores the corridor, faces a final puzzle gate, then the boss.
  ch3_echo_station: {
    type: 'story',
    text: `The platform is yours. The train pulls away behind you on its own schedule, into deeper dark. The sign above the platform finally settles long enough to read:

ECHO — ALL PASSENGERS HEARD.

A single corridor leads off the platform. The signal that has been pulsing in your ear since you entered the metro is now coming from down that corridor — not as a pulse, but as a voice.

Your voice.

It is repeating something you said three hours ago, on the stairs, when you thought you were alone.`,
    signals: [
      { text: '[voice match: 94% subject-id.]', real: true },
      { text: "i gotta find a way out. i gotta find. a way out.", real: false },
      { text: '[corridor — source bearing: 270°, 14m.]', real: true },
    ],
    choices: [
      { label: 'Walk down the corridor', sub: 'Toward the voice',          next: 'ch3_corridor_walk',  signal: 5 },
      { label: 'Pause and listen first',  sub: 'Try to read the rhythm',    next: 'ch3_corridor_listen', signal: 8 },
      // Echo trap — late game. The Echo Beast is mimicking the player's
      // own voice; following it back toward the train is following the
      // copy, not the source. Tell: the voice tells you to LEAVE, when
      // every real instinct says push forward.
      { label: 'Follow the voice back toward the train', sub: 'It says to leave. To leave. To leave now.', next: 'ch3_misdirect_echo_station', signal: -8, echoTrap: true },
    ],
  },

  // Echo misdirect — subplatform. Player waits for a non-existent train.
  ch3_misdirect_subplatform: {
    type: 'story',
    text: `You wait at the platform edge. The voice keeps insisting another train is coming. It says it the same way three times.

After several minutes you realize the wind in the tunnel hasn't changed. There's no displaced air. No light at the end. Trains move air. Nothing here has moved air for a long time.

You look down at the footprints again. All of them lead INTO the train that is already here. None lead away.

The voice is still saying another train is coming.`,
    choices: [
      { label: 'Return to the subplatform', sub: 'The one train is still here', next: 'ch3_subplatform' },
    ],
  },

  // Echo misdirect — echo station. The Beast is closer here, the mimicry
  // sharper. Following it backward costs more.
  ch3_misdirect_echo_station: {
    type: 'story',
    text: `You walk back toward where the train pulled away. The tunnel mouth is closer than it should be. The platform is smaller than you remember leaving it.

The voice is still telling you to leave.

You keep walking. The tunnel mouth doesn't get any closer.

You stop. You look back. The corridor with the real voice in it is exactly where you turned away from. It hasn't moved. Only the platform geometry was wrong, and only for a few minutes, and only because something wanted it to be.

The voice telling you to leave has stopped. Whatever was using your voice this time wasn't a very good copy.`,
    onEnter: { hp: -8 },
    choices: [
      { label: 'Return to the platform', sub: 'You won\'t be fooled twice', next: 'ch3_echo_station' },
    ],
  },

  // Listening before walking — pure atmosphere + small signal reward
  // for caution. Funnels back into the walk node.
  ch3_corridor_listen: {
    type: 'story',
    text: `You stand still for a full minute. The corridor is long and the voice carries strangely — it doesn't echo so much as overlap with itself, like several recordings of the same phrase playing slightly out of sync.

Underneath that, you start to hear other voices. Not yours. Other people. Many of them. All speaking phrases that sound like something a person might have said once and then never again.

Whatever is down this corridor is collecting. Not killing. Collecting.

The realization is colder than it should be. You straighten up and start walking.`,
    signals: [
      { text: '[multi-source — at least 40 distinct voice signatures.]', real: true },
      { text: 'tell mom i love her. tell her. tell mom.', real: false },
      { text: 'i meant to call you back. i meant. i meant to.', real: false },
    ],
    choices: [
      { label: 'Continue down the corridor', next: 'ch3_corridor_walk' },
    ],
  },

  // The walk to the lair. The "ambient horror" beat — describes what
  // the player is moving past, builds dread.
  ch3_corridor_walk: {
    type: 'story',
    text: `The corridor curves left, then descends. The walls here are different — older, hand-finished tile, gone soft with age. Service lighting flickers in irregular pulses; the rhythm matches the signal in your ear.

Halfway down, you pass an alcove. Inside it, a tape recorder is running on a wooden table, looped to a phrase in a voice you don't recognize:

"I'll be back by seven. I promise. I'll be back by seven. I promise."

You walk past it without turning around.

Further on, another alcove. Another voice. Another fragment of a life cut down to four seconds and put on repeat.

By the time you reach the end of the corridor, you have stopped counting them.`,
    signals: [
      { text: "[alcove 1 — voice: f, 30s. loop length: 4.2s.]", real: true },
      { text: "[alcove 2 — voice: m, 70s. loop length: 3.8s.]", real: true },
      { text: 'you stopped counting. you stopped. you stopped.', real: false },
    ],
    choices: [
      { label: 'Push through to the source', next: 'ch3_lair_entrance' },
    ],
  },

  // Lair entrance — last decision before the final puzzle gate.
  // Gives the player a choice of approach (story-flavored, no mechanical
  // difference yet — keeps the skeleton lean).
  ch3_lair_entrance: {
    type: 'story',
    text: `The corridor opens into a chamber.

It was a station once — abandoned, sealed off, then re-occupied. The platform has been cleared and lit by a ring of standing lamps. Cables run in a careful, deliberate pattern across the floor and into the center, where something — not a person, not a beast, not exactly either — is hunched over a piece of equipment that looks like it was assembled from a dozen smaller things.

It is wearing your face.

Loosely. Like the face is a borrowed item it hasn't decided whether to keep.

The interface in your eye reads:

ENTITY: ECHO — class undefined. Threat: undefined. Origin: undefined.
ENGAGEMENT NOT RECOMMENDED.

The Echo looks up. It smiles with your mouth. It says, in your voice:

"You came down here on purpose, didn't you. Tell me you came down here on purpose."`,
    signals: [
      { text: '[face match — subject-id, 98%. anomaly: not subject.]', real: true },
      { text: 'tell me you came down here on purpose.', real: false },
      { text: '[entity classification: pending.]', real: true },
    ],
    choices: [
      { label: 'Answer honestly',     sub: '"I came down here on purpose."',  next: 'ch3_voice_gate' },
      { label: 'Refuse to answer',    sub: 'Stay silent',                      next: 'ch3_voice_gate' },
      { label: 'Threaten the Echo',   sub: '"Step away from me."',            next: 'ch3_voice_gate' },
    ],
  },

  // Final puzzle gate — voice discrimination. The Echo has been
  // listening to the player for the whole chapter and now mimics them.
  // The player has to pick their REAL voice among three echoes per
  // round, three rounds total.
  ch3_voice_gate: {
    type: 'puzzle',
    puzzleType: 'voice',
    puzzleConfig: {
      prompt: 'The Echo speaks with your voice — and the voices of the people it has collected. Each round, three samples will appear. One is genuinely you, recorded earlier. The other two are the Echo\'s impression. Pick yours.',
      headerText: 'ECHO // VOICE DISCRIMINATION',
      rounds: 3,
      voices: [
        {
          options: [
            { text: '"I gotta find a way out of here."',          real: true  },
            { text: '"I gotta find a way... out of here."',       real: false },
            { text: '"I have to find a way out of here."',        real: false },
          ],
        },
        {
          options: [
            { text: '"Pell, you better be straight with me."',    real: false },
            { text: '"Pell — you better be straight with me."',   real: true  },
            { text: '"Pell? You better be straight with me."',    real: false },
          ],
        },
        {
          options: [
            { text: '"This is the last time I come down here."',  real: false },
            { text: '"This is the last time I\'m coming down here."', real: true },
            { text: '"This is the last time I came down here."',  real: false },
          ],
        },
      ],
    },
    onWin:  'ch3_truth_reveal',
    onLose: 'ch3_voice_gate_fail',
  },

  // Voice gate fail — the Echo gets one of your phrases. The player
  // takes some HP damage (story-described), gets sent back to retry.
  // No permadeath — the puzzle is rerunnable.
  ch3_voice_gate_fail: {
    type: 'story',
    text: `The phrase the Echo just used was yours. You had thought it was an echo. It wasn't.

The realization arrives with a hard wave of pressure behind your eyes — the System interface stutters, your HP indicator drops, and for a moment you can't remember whether the Echo is wearing your face or whether it's the other way around.

You take a step back. You blink. The room re-resolves.

The Echo is waiting. Patient. It will try again.`,
    signals: [
      { text: '[sample captured. catalog +1.]', real: true },
      { text: 'thank you. thank you for that one.', real: false },
    ],
    onEnter: { hp: -15 },
    choices: [
      { label: 'Steady yourself. Try again.', next: 'ch3_voice_gate' },
    ],
  },

  // Truth reveal — the chapter's central revelation about what the
  // Echo is and why it exists.
  ch3_truth_reveal: {
    type: 'story',
    text: `Three correct.

The Echo straightens. Something in its posture changes — the borrowed face loosens, then resettles into something less specific. It is still wearing pieces of you, but it is no longer pretending to BE you.

When it speaks now, the voice is not yours. It is many voices, layered.

"You're harder than the others. Most of them — when I get even one right, they stop being sure who they are. The System scrapes them clean and I keep what's left."

It gestures at the equipment behind it. You see, now, what it is. A receiver. Not built for radio. Built for whatever it is that the System carries between players.

"The System listens to all of you. Constantly. Every word, every choice, every micro-hesitation. I'm what happens when it forgets to delete the recordings."

It looks at you with something that might be pity.

"It has fourteen years of you. It is going to be a lot harder to walk out of here intact than you think."

The interface flickers.

ENTITY: ECHO — class CONFIRMED: SYSTEM REMNANT.
ENGAGEMENT NOW VIABLE. Combat protocol active.`,
    signals: [
      { text: '[entity reclassified: system_remnant.]', real: true },
      { text: '[layered voiceprints — count: indeterminate.]', real: true },
    ],
    choices: [
      { label: 'Engage the Echo Beast', next: 'ch3_boss_encounter' },
    ],
  },

  // Boss encounter — Echo Beast. Real combat, resolved by the Ch3
  // combat engine (renderCombat in index.js → data/enemyAI.js).
  // The Echo's signature mechanic: every other enemy turn it MIMICS the
  // player's last attack, throwing copied damage back at them. The engine
  // routes on enemy.name including "Echo Beast" (see resolveEnemyTurn).
  ch3_boss_encounter: {
    type: 'combat',
    text: `The Echo lunges. The fight is in the same room as the equipment, which complicates things — every time you strike the Echo, the receiver picks up something and amplifies it, sending the sound back at you slightly delayed.

You fight in a room that is, with every passing second, becoming more familiar with how you fight.`,
    enemy: {
      name: 'The Echo Beast',
      icon: '📡',
      hp:  320,
      atk: 26,
      def: 14,
      spd: 24,
      xp:  800,
      img: '../assets/boss/echo_beast.png',
      combatIntro: 'The receiver hums. It has been listening the whole time.',
      defeatText: 'The receiver chokes on its own feedback and goes dark. Whatever it scraped from the others — it can\'t replay it anymore.',
      loseText: 'Your own moves come back faster than you can answer them. You break contact and fall back up the tunnel.',
      loot: [
        { itemKey: 'rune_lux', qty: 2 },
        { itemKey: 'item_voice_imprint', qty: 1 },
      ],
    },
    bossKey: 'echo_beast',
    onWin:  'ch3_aftermath',
    onLose: 'ch3_lair_entrance',
  },

  // Aftermath — the room after the boss falls. The win + the cost.
  ch3_aftermath: {
    type: 'story',
    text: `The Echo collapses inward. The face it was wearing slides off and onto the floor and dissolves into something the System didn't bother to render properly.

The receiver behind it is still running. It is now playing back fragments of YOU — but in the wrong order. A laugh from this morning, layered over a refusal from a year ago, layered over a thing you said in your sleep last Tuesday.

You step over the body and shut the receiver off.

The room goes quiet for the first time since you entered the metro.

In the silence, the interface updates:

ENTITY: ECHO — terminated.
RECEIVER: offline.
SYSTEM REMNANT LEAK — patched. (Coverage incomplete. Other remnants likely active in other regions.)`,
    signals: [
      { text: '[playback — fragmented. timestamps disordered.]', real: true },
      { text: 'last tuesday. tuesday. tuesday last.', real: false },
      { text: '[receiver: offline. signal: null.]', real: true },
    ],
    choices: [
      { label: 'Leave the chamber', next: 'ch3_ending' },
    ],
  },

  // Ending — the player walks out. Final framing of what they learned
  // and what's next. Pushes chapters_unlocked = 4 via onEnter so Ch4
  // becomes available (whenever Ch4 ships).
  ch3_ending: {
    type: 'story',
    text: `You walk back through the corridor of recorded voices. You don't pause for any of them. You don't know what to do for them, and stopping would be worse than passing.

At the platform, the train is gone. Of course it is. The stairs back up are where you left them.

The signal in your ear is silent for the first time since the chapter began. The interface has a new note pinned to it, in plain text:

"Other remnants. Listen for them. The System is not as careful as it tells you it is."

Above the stairs, the sign that used to read ECHO has reset to a blank panel.

You climb back into the open air.

The Twin Judges have heard about this. So has Yara. So have the Hunters. Word travels.

[CHAPTER 3 — Signal Hunters: COMPLETE]
[Chapter 4 unlocked.]`,
    signals: [
      { text: '[signal: null. baseline restored.]', real: true },
      { text: '[note pinned to interface — source: unverified.]', real: true },
    ],
    onEnter: { unlockChapter: 4 },
    choices: [
      { label: 'Return to the surface', next: 'ch3_complete' },
    ],
  },

  // Terminal node — sends the player back to the chapters TOC. The
  // engine reads `type: 'complete'` and triggers the chapter-finish
  // flow (save state, navigate back to book.html).
  ch3_complete: {
    type: 'complete',
    text: 'Chapter 3 complete.',
  },

}
