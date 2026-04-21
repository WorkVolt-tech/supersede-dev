// data/chapter1.js — Chapter 1 story content

export const META = {
  number: 1,
  title:  'System Initialization',
  sub:    'The world stops. The game begins.',
  unlocksChapter: 2,
}

export const NODES = {

  // ═══════════════════════════════════════
  // OPENING
  // ═══════════════════════════════════════
  opening: {
    id: 'opening', type: 'story',
    text: `Everything freezes.

Cars stop mid-motion. People halt mid-step. Even the wind disappears — as though the world has been pressed pause.

Then a voice. Calm. Everywhere at once.

"Welcome to SuperSede."

A glowing interface materializes before your eyes — transparent, electric, impossibly clear. Your name floats in the center of it. Below that, a single word:

OBJECTIVE: SURVIVE.

You stand in the middle of a frozen street. Nobody moves. Nobody breathes. The whole city is a photograph.

Somewhere in the distance, something cracks. Like ice. Like a bone.

The game has started.`,
    sysMsg: 'Players are now active. A player may appear at any time.',
    choices: [
      { id: 'go_search', label: 'Search your surroundings',     sub: 'Check nearby cars and bodies for supplies', next: 'search' },
      { id: 'go_street', label: 'Move forward into the street', sub: 'See what is happening beyond',             next: 'street_approach' },
      { id: 'go_system', label: 'Inspect the System interface',  sub: 'Study your stats and nearby signals',      next: 'system' },
    ],
  },

  // ═══════════════════════════════════════
  // PATH A — SEARCH
  // ═══════════════════════════════════════
  search: {
    id: 'search', type: 'story',
    text: `You move between frozen cars. A coffee cup hangs in mid-drip. A coin spins in the air, suspended at eye level, neither falling nor rising.

Everything feels paused — yet alive, like held breath.

You rummage quickly. A bag on the passenger seat of a nearby car. A jacket draped over a bicycle. Underneath a delivery scooter, a cracked phone still showing a flashlight app, frozen mid-beam.

You take what you can carry.`,
    rewards: [{ itemKey:'scrap_blade', qty:1 }, { itemKey:'flashlight', qty:1 }],
    xp: 15,
    choices: [{ label: 'Continue exploring', next: 'search_deeper' }],
  },

  search_deeper: {
    id: 'search_deeper', type: 'story',
    text: `You move further from the road, into a parking structure. The shadow is thick here. Your flashlight cuts through it in a narrow beam.

On the second level, you find something strange — a player. Not frozen. Sitting against a concrete pillar, knees pulled up, staring at their interface screen.

They look up when you approach. They can't be older than nineteen. Their badge reads NEUTRAL. Their hands are shaking.

"I don't want to fight," they say before you've said anything. "I just want to know what the rules are."

You don't have an answer for them.`,
    sysMsg: '⚠ A player is nearby…',
    choices: [
      { id: 'enc_team',    label: 'Sit with them a moment',    sub: 'Listen — gain Awareness XP',               next: 'search_team',    outcome: 'team' },
      { id: 'enc_attack',  label: 'Take their supplies',       sub: 'Easy loot. Reputation shifts red.',         next: 'search_attack',  outcome: 'attack', variant: 'danger' },
      { id: 'enc_observe', label: 'Say nothing and move on',   sub: 'Keep your distance — observe',              next: 'search_observe', outcome: 'observe' },
    ],
  },

  search_team: {
    id: 'search_team', type: 'story',
    text: `You lower yourself to sit across from them. For a moment neither of you speaks.

"My name was Marcus," they say eventually. "Don't know if that matters here."

"It matters," you say.

He nods. Shows you his interface — he's found something in the System you haven't seen yet. A map overlay. Basic, glitchy, but real. He shares it with you. You share your flashlight.

You part ways at the parking exit. He goes south. You go north. Neither of you say good luck.

You both know luck isn't the variable here.`,
    xp: 20,
    choices: [{ label: 'Head back to the street', next: 'street_return' }],
  },

  search_attack: {
    id: 'search_attack', type: 'story',
    text: `It's fast. Efficient. Brutal in the way that only things that are over quickly can be.

He doesn't fight back. That's the worst part.

His bag has a half-eaten energy bar, some scrap metal, and a note with an address on it. You take the metal. You leave the note.

The System registers it before you've even stood up.

REPUTATION SHIFT: RED.

You don't feel different. That might be the scariest thing.`,
    xp: 15,
    rewards: [{ itemKey: 'scrap_metal', qty: 2 }, { itemKey: 'energy_drink', qty: 1 }],
    choices: [{ label: 'Return to the street', next: 'street_return' }],
  },

  search_observe: {
    id: 'search_observe', type: 'story',
    text: `You don't stop walking. You don't look back.

But you keep thinking about what he said.

"I just want to know what the rules are."

You don't know them either. You're not sure anyone does yet. Maybe that's the whole point.

The parking structure opens back onto the street. The city is still frozen around you, patient and still, waiting to see what kind of player you'll become.`,
    xp: 12,
    choices: [{ label: 'Continue into the street', next: 'street_return' }],
  },

  // ═══════════════════════════════════════
  // PATH B — STREET (main approach)
  // ═══════════════════════════════════════
  street_approach: {
    id: 'street_approach', type: 'story',
    text: `You push forward onto the main road.

The frozen world is eerie at walking pace — people mid-stride, pigeons suspended in the air, a newspaper mid-unfolding caught in a wind that no longer exists.

Then it shifts.

Three blocks ahead, something moves. Someone. They're running — sprinting — cutting between the frozen pedestrians like a slalom course. Behind them, two others in pursuit. One of them has something in their hand that glints.

Your interface pings. Three player signals, converging fast.`,
    sysMsg: '⚠ Multiple players detected — conflict in progress',
    choices: [
      { label: 'Get closer and watch',       sub: 'Observe from cover first',           next: 'street_watch' },
      { label: 'Step in and break it up',    sub: 'Risky — but shows who you are',      next: 'street_intervene' },
      { label: 'Cut through the side alley', sub: 'Avoid the conflict entirely',        next: 'street_alley' },
    ],
  },

  street_watch: {
    id: 'street_watch', type: 'story',
    text: `You duck behind a frozen delivery truck and watch.

The runner is fast but flagging. They dart into a shop doorway. The two pursuers slow, circling. You can see their badges now — both RED. The runner's badge is NEUTRAL.

One of the red-badge players pulls out a scrap blade. Not much — but enough.

The runner looks up from the doorway and sees you watching. Their eyes go wide. Not asking for help exactly. Just — acknowledging that someone is there. That they're not invisible.

You have maybe ten seconds before it escalates.`,
    xp: 10,
    choices: [
      { label: 'Step in — draw their attention', sub: 'Help the runner escape',         next: 'street_rescue', variant: 'danger' },
      { label: 'Stay hidden',                    sub: 'Watch what happens next',         next: 'street_watch2' },
    ],
  },

  street_rescue: {
    id: 'street_rescue', type: 'story',
    text: `You step out from behind the truck.

"Hey."

Both red-badge players turn. A split second of confusion is all it takes — the runner bolts from the doorway, disappearing around a corner.

The two players look at each other. Then at you. They decide you're not worth the trouble and move on, muttering.

The runner is gone. But as you turn back to the road, you notice something on the ground where they were standing — a folded piece of paper. Torn from a notebook. It reads:

LEVEL 2 CACHE — parking garage off 5th, beneath the blue car.

A gift from a stranger. You find the spot. They weren't wrong.`,
    xp: 25,
    rewards: [{ itemKey: 'jacket', qty:1 }, { itemKey: 'scrap_metal', qty:2 }],
    choices: [{ label: 'Continue forward', next: 'street_midpoint' }],
  },

  street_watch2: {
    id: 'street_watch2', type: 'story',
    text: `You stay hidden.

The encounter resolves quickly. The runner escapes on their own — throws something at the pursuers, creates enough noise to slip away. Smart. Experienced.

The red-badge players argue briefly, then separate. The street goes quiet again.

You emerge from cover with a better understanding of how other players move. What they prioritize. How aggression works here.

It cost you nothing. It taught you something.`,
    xp: 18,
    choices: [{ label: 'Move on', next: 'street_midpoint' }],
  },

  street_intervene: {
    id: 'street_intervene', type: 'story',
    text: `You walk straight into the middle of it.

"Stop."

It's a stupid move by every metric. You have no weapon, no backup, and no idea what the System will do if you die in the first chapter.

But it works.

The two red-badge players are so surprised that someone would just — stand there — that they actually do stop. Three seconds of silence. The runner uses those three seconds to disappear.

One of the hunters shoves you. You stumble. They leave.

You're standing in the middle of the road with bruised ribs and the knowledge that sometimes the dumb move lands.`,
    hpLoss: 15, xp: 30,
    choices: [{ label: 'Keep moving', next: 'street_midpoint' }],
  },

  street_alley: {
    id: 'street_alley', type: 'story',
    text: `You cut down a side alley between two restaurants. The smell of frozen food hits you — a kitchen caught mid-service, steam hanging motionless above a wok.

The alley is quiet. No players. No signals on your radar.

Behind a dumpster you find a bag someone dropped mid-run. Inside: an energy drink, still cold somehow. A roll of bandage. A folded piece of paper with a hand-drawn map of this block.

You study the map. There's an X marked at the far end of the alley, below the words "BEFORE THE BOSS — STOCK UP."

Someone was here before you. They wanted to help.

You follow the X. You find a small cache tucked under a loose step. Modest but real.`,
    rewards: [{ itemKey:'energy_drink', qty:1 }, { itemKey:'scrap_metal', qty:2 }, { itemKey:'scrap_blade', qty:1 }],
    xp: 15,
    choices: [{ label: 'Exit the alley', next: 'street_midpoint' }],
  },

  street_return: {
    id: 'street_return', type: 'story',
    text: `You emerge from the parking structure back onto the main road.

The city looks different now that you've spent time in it. Not less strange — more. Every frozen face a question. Every suspended object a reminder that physics itself has been suspended.

Your interface pings softly.

CHAPTER PROGRESS: 40%

There's more ahead. You can feel it before you see it — a change in the air, a heaviness, like the atmosphere itself has thickened.

Something is coming.`,
    choices: [{ label: 'Press forward', next: 'street_midpoint' }],
  },

  street_midpoint: {
    id: 'street_midpoint', type: 'story',
    text: `You reach the center of the city.

It's a wide plaza — fountains frozen mid-arc, pigeons hovering at impossible angles. Beautiful and wrong in equal measure.

And then you see it.

Another player, sitting on the edge of a fountain. Not frozen. Just sitting. They look up when you approach. Their badge is GREEN. Their face is exhausted.

"I've been here since it started," they say. "Counting. There are at least forty players in this district alone."

Forty. The number lands.

"What happens when they all meet?" you ask.

They look at the sky. "I think we're about to find out."`,
    choices: [{ label: 'Ask them what they know', next: 'plaza_talk' }],
  },

  plaza_talk: {
    id: 'plaza_talk', type: 'story',
    text: `The green-badge player — they say their name is Yara — has been building a picture from everything she's seen.

"The System rewards survival. It tracks behavior. And somewhere" — she points up — "something is watching all of it."

As if on cue, your interface flickers. A new alert, one you haven't seen before:

WARNING: HIGH-TIER ENTITY APPROACHING THIS ZONE.

PLAYER ADVICE: PREPARE.

Yara reads it from her own screen at the same time. She looks at you. You look at her.

"Together?" she asks.

You have about ninety seconds to decide.`,
    sysMsg: '⚠ High-tier entity inbound. Prepare for engagement.',
    choices: [
      { label: 'Ask Yara to fight beside you', sub: 'A green ally — shared XP',             next: 'pre_boss_team' },
      { label: 'Tell her to run — you will handle it', sub: 'Face it alone. Your choice.',  next: 'pre_boss_solo' },
      { label: 'Use her as bait and prepare an ambush', sub: 'Cold. Effective. Dangerous.',  next: 'pre_boss_betray', variant: 'danger' },
    ],
  },

  pre_boss_team: {
    id: 'pre_boss_team', type: 'story',
    text: `She nods once. Stands up. Rolls her shoulders.

"I've been waiting for something worth fighting," she says.

You position yourselves back to back at the center of the plaza. Your interface counts down from ten. The fountains begin to vibrate.

At zero, the sky cracks open.`,
    choices: [{ label: 'Face The Watcher', next: 'boss', bossMode: 'team' }],
  },

  pre_boss_solo: {
    id: 'pre_boss_solo', type: 'story',
    text: `"You should go," you tell her. "This one is mine."

She looks at you for a long moment. Then: "Don't die being stubborn."

She leaves at a run. You stand alone in the plaza. The fountains begin to tremble. The air goes cold.

Your interface counts down. You breathe. You wait.

At zero, the sky splits.`,
    choices: [{ label: 'Face The Watcher', next: 'boss', bossMode: 'solo' }],
  },

  pre_boss_betray: {
    id: 'pre_boss_betray', type: 'story',
    text: `You keep your voice calm. "Stay center. It'll come from above — you'll see it first from there."

She believes you. Moves to the middle of the plaza.

You take position behind a frozen news kiosk. Thirty meters back. Clear sightline.

The countdown hits zero. The sky tears open. The eye descends.

It looks directly at Yara first — then past her, to you. As if it already knows.

As if it's been watching you all along.`,
    choices: [{ label: 'Face The Watcher', next: 'boss', bossMode: 'betray' }],
  },

  // ═══════════════════════════════════════
  // PATH C — SYSTEM
  // ═══════════════════════════════════════
  system: {
    id: 'system', type: 'story',
    text: `You focus on the interface and let everything else fall away.

It responds to your attention — expanding, deepening. New panels slide open. A stats breakdown. An inventory grid, empty for now. A radar map pulsing with soft signals.

You study them. Six signals within two hundred meters. Three are stationary. Two are moving slowly. One is moving fast — too fast, like someone running.

The interface also shows something else. A notification you almost miss at the edge of the screen:

TUTORIAL AVAILABLE: TAP TO BEGIN.

You tap it.`,
    xp: 10,
    sysMsg: '⚠ Scanning… Multiple players detected nearby.',
    choices: [
      { label: 'Read the tutorial',          sub: 'Learn the System mechanics',         next: 'sys_tutorial' },
      { label: 'Track the running signal',   sub: 'First-strike advantage',             next: 'sys_track' },
      { label: 'Close it and stay hidden',   sub: 'Observe before engaging',            next: 'sys_observe' },
    ],
  },

  sys_tutorial: {
    id: 'sys_tutorial', type: 'story',
    text: `The tutorial is brief. Clinical. Written like a legal document.

SUPERSEDE SYSTEM — PLAYER BRIEFING:

1. All persons within the affected zone are now designated Players.
2. Players may interact freely. Outcomes are recorded.
3. XP is awarded for survival, engagement, and behavioral consistency.
4. Reputation is permanent and visible to all Players.
5. Chapter progression unlocks additional zones and entities.
6. High-tier entities will test Player performance at chapter intervals.
7. Death results in a penalty phase, not elimination.
8. The System observes everything.

There is no point 9.

You close the tutorial. You feel like you've read a lease agreement for a building you're already living in. The terms feel non-negotiable.

Your interface pings. The fast-moving signal has stopped.`,
    xp: 15,
    choices: [
      { label: 'Track the stopped signal',   sub: 'Investigate',    next: 'sys_track' },
      { label: 'Stay off the radar',         sub: 'Lie low',        next: 'sys_observe' },
    ],
  },

  sys_track: {
    id: 'sys_track', type: 'story',
    text: `You move silently, using the radar as a guide. Left at the fountain. Right past the frozen florist. Through a gap between two stopped buses.

You find them crouched behind a car — a player, maybe mid-twenties, studying their own interface. They don't know you're standing behind them.

You could announce yourself. You could attack. You could just watch.

For ten full seconds you stand there. Then your shadow falls across their screen. They freeze.

"I heard your footsteps three blocks back," they say without turning around. "I was waiting to see what you'd do."

They turn. Their badge: NEUTRAL. Their expression: amused.`,
    xp: 18,
    choices: [
      { label: 'Laugh — admit they caught you', sub: 'An honest moment',               next: 'sys_track_meet' },
      { label: 'Stay silent and walk away',     sub: 'Keep them guessing',             next: 'sys_track_leave' },
    ],
  },

  sys_track_meet: {
    id: 'sys_track_meet', type: 'story',
    text: `They introduce themselves as Kai. Former data analyst. Already figured out that the System runs on behavior patterns.

"It's not watching what you do," they say. "It's watching why you do it. Pattern recognition. The entity at the end of this chapter — it'll know your tendencies before you do."

They share a location pin — a supply stash two blocks over. You share your flashlight reading. Both of you are better for the exchange.

You part as something that isn't quite friends but might become it, given time.`,
    xp: 20,
    rewards: [{ itemKey: 'medkit', qty: 1 }],
    choices: [{ label: 'Head toward the plaza', next: 'street_midpoint' }],
  },

  sys_track_leave: {
    id: 'sys_track_leave', type: 'story',
    text: `You say nothing. Just hold their gaze for a moment, then turn and walk away.

You hear them exhale behind you. Not frightened. Thoughtful.

Your interface logs the interaction as NEUTRAL ENCOUNTER — DISENGAGED.

You're not sure if that's good or bad. The System doesn't clarify.

You carry on toward the center of the city.`,
    xp: 12,
    choices: [{ label: 'Head toward the plaza', next: 'street_midpoint' }],
  },

  sys_observe: {
    id: 'sys_observe', type: 'story',
    text: `You let the signals move without following them. Just watch from your position — the radar's pulsing dots shifting and drifting.

Two signals merge. Then separate quickly. A fight, maybe. Or just proximity.

One signal goes dark. Not moving anymore, just — absent. You log it. No idea what it means yet.

Your own position on the radar must look the same to anyone watching you. A stationary dot. Patient. Unreadable.

You decide that's fine. In a game being watched, sometimes stillness is the loudest signal of all.`,
    xp: 14,
    choices: [{ label: 'Move toward the plaza', next: 'street_midpoint' }],
  },

  // ═══════════════════════════════════════
  // BOSS + END
  // ═══════════════════════════════════════
  boss: {
    id:'boss', type:'boss',
    text:`The eye opens fully.

Not a metaphor. Not a symbol. An actual eye, the size of a building, suspended in the torn sky above the plaza.

It blinks once — slowly, deliberately — and every player in the district feels it. A pressure behind the eyes. A sudden awareness of being seen.

The System announces it with a single line of text:

THE WATCHER.

The air vibrates at a frequency just below hearing. The frozen people around the plaza begin to tremble, as if even suspended physics recognizes something ancient and wrong has arrived.

It looks at you.

It already knows everything.`,
    enemy: { name:'The Watcher', icon:'👁', hp:200, atk:18, xp:80, loot:[{itemKey:'core_fragment',qty:1}] },
  },

  chapter_end: {
    id:'chapter_end', type:'end',
    text:`The Watcher shatters.

Not with violence — with silence. Like a mirror falling in a dream, breaking without sound. The eye closes. The crack in the sky seals, stitching itself shut with threads of pale light.

The plaza is still.

Then, slowly, the frozen world begins to move again. One car. One pedestrian. A pigeon completes its flight. The wind returns.

People stumble, confused. They don't know what happened. To them, no time passed.

To you, everything has changed.

Your interface pulses once. A message appears in letters that feel less like text and more like something carved:

CHAPTER 1 COMPLETE.
BEHAVIOR RECORDED.

Below that, quieter, almost intimate:

Your evolution is being calculated.

You look at your hands. Same hands. Different player.

Chapter 2 is waiting.`,
    sysMsg: 'Core Fragment obtained. Chapter 2 unlocked.',
    unlocksChapter: 2,
  },
}
