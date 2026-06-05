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

You rummage quickly. A bag on the passenger seat. A jacket draped over a bicycle. Underneath a scooter, a cracked phone still showing a flashlight app, frozen mid-beam.

You take what you can carry. Then something moves at the edge of your vision — not a frozen person. Something deliberate.

A rat-sized creature skitters across the pavement. Except it glows faintly. And it has a health bar above its head.

SYSTEM SPAWN: GLITCH RAT — HP 20, ATK 3

Your interface pings: "Defeat enemies to gain XP and improve your stats."`,
    rewards: [{ itemKey:'scrap_blade', qty:1 }, { itemKey:'flashlight', qty:1 }],
    xp: 30,
    choices: [
      { label: 'Fight the Glitch Rat', sub: 'Easy fight — good XP to start', next: 'fight_rat_1' },
      { label: 'Ignore it and keep searching', sub: 'Skip the fight', next: 'search_deeper' },
    ],
  },

  fight_rat_1: {
    id: 'fight_rat_1', type: 'combat',
    text: `The creature turns toward you. Its eyes are static — like a broken screen. It hisses.

Your interface confirms the engagement.`,
    enemy: { name:'Glitch Rat', icon:'🐀', hp:20, atk:3, xp:40, loot:[] },
    onWin: 'search_after_rat',
    onLose: 'search_deeper',
    onEscape: 'search_deeper',
  },

  search_after_rat: {
    id: 'search_after_rat', type: 'story',
    text: `The creature dissolves into pixels when it falls. A small burst of light — and then nothing.

Your interface updates:

COMBAT COMPLETE. XP GAINED. STATS IMPROVING.

You feel it physically — a sharpness behind your eyes, a solidness in your limbs. The System is rewriting you in real time.

Two more of the creatures skitter out from under a nearby van. Slightly larger. Slightly faster.

GLITCH RAT x2 — HP 25 each, ATK 4`,
    choices: [
      { label: 'Fight them both', sub: 'More XP — higher risk', next: 'fight_rats_2', variant: 'danger' },
      { label: 'Move on — you have enough', sub: 'Head deeper into the city', next: 'search_deeper' },
    ],
  },

  fight_rats_2: {
    id: 'fight_rats_2', type: 'combat',
    text: `Two at once. You've done this before — or at least the System thinks you have.`,
    enemy: { name:'Glitch Rats x2', icon:'🐀🐀', hp:50, atk:4, xp:60, loot:[{itemKey:'scrap_metal', qty:1}] },
    onWin: 'search_deeper',
    onLose: 'search_deeper',
    onEscape: 'search_deeper',
  },

  search_deeper: {
    id: 'search_deeper', type: 'story',
    text: `You move further from the road, into a parking structure. The shadow is thick here.

On the second level, you find a player. Not frozen. Sitting against a concrete pillar, knees pulled up, studying their interface screen.

They look up. They can't be older than nineteen. Their badge reads NEUTRAL. Their hands are shaking.

"I don't want to fight," they say before you've said anything. "I just want to know what the rules are."

You don't have an answer for them.

Above the parking structure's open roof, the sky does something it shouldn't.

A seam opens — thin, white, surgical — and for three full seconds an eye the size of a skyscraper looks down through it. Not at the city. Not at the plaza.

At this parking structure. At this level. At you.

THE WATCHER SEES ALL.

The young player doesn't look up. Their interface has gone dark. They don't see it.

You do.`,
    sysMsg: '⚠ THE WATCHER SEES ALL — Observation event triggered.',
    choices: [
      { id: 'enc_team',    label: 'Sit with them a moment',  sub: 'Listen — gain Awareness XP',        next: 'search_team',    outcome: 'team',   moral: 8 },
      { id: 'enc_attack',  label: 'Take their supplies',     sub: 'Easy loot. Reputation shifts red.',  next: 'search_attack',  outcome: 'attack', variant: 'danger' },
      { id: 'enc_observe', label: 'Say nothing and move on', sub: 'Keep your distance — observe',       next: 'search_observe', outcome: 'observe', insightRequired: 2 },
    ],
  },

  search_team: {
    id: 'search_team', type: 'story',
    text: `You sit across from them. For a moment neither of you speaks.

"My name was Marcus," they say eventually. "Don't know if that matters here."

"It matters," you say.

He nods. Shows you his interface — he's found a map overlay. Basic, glitchy, but real. He shares it with you. You share your flashlight.

Before you part, he tells you something useful: there's a weapons cache two floors up, left by whoever was here before the freeze. He found it but couldn't carry everything.

You find it. He wasn't wrong.`,
    xp: 50,
    rewards: [{ itemKey:'knife', qty:1 }, { itemKey:'energy_drink', qty:1 }],
    choices: [{ label: 'Head to the street', next: 'street_return' }],
  },

  search_attack: {
    id: 'search_attack', type: 'story',
    text: `It's fast. Efficient. He doesn't fight back. That's the worst part.

His bag has a medkit and some scrap metal. You take everything.

The System registers it before you've even stood up.

REPUTATION SHIFT: RED.

You don't feel different. That might be the scariest thing.`,
    xp: 30,
    rewards: [{ itemKey:'medkit', qty:1 }, { itemKey:'scrap_metal', qty:2 }],
    choices: [{ label: 'Return to the street', next: 'street_return' }],
  },

  search_observe: {
    id: 'search_observe', type: 'story',
    text: `You don't stop walking. You don't look back.

But you keep thinking about what he said. "I just want to know what the rules are."

You don't know them either. Maybe that's the whole point.

The parking structure opens back onto the street. On your way out, you find a cache tucked behind a pillar — left by whoever was here before. A knife wrapped in cloth. Still sharp.`,
    xp: 40,
    rewards: [{ itemKey:'jacket', qty:1 }],
    choices: [{ label: 'Continue into the street', next: 'street_return' }],
  },

  // ═══════════════════════════════════════
  // PATH B — STREET
  // ═══════════════════════════════════════
  street_approach: {
    id: 'street_approach', type: 'story',
    text: `You push forward onto the main road.

The frozen world is eerie at walking pace — people mid-stride, pigeons suspended in the air, a newspaper mid-unfolding caught in a wind that no longer exists.

Then it shifts.

Three blocks ahead, something moves. Someone is running — sprinting — cutting between frozen pedestrians. Behind them, two others in pursuit.

Your interface pings. Three player signals, converging fast.

But also — something else. Two glowing creatures crouched on a car hood nearby. They notice you at the same time you notice them.

SYSTEM SPAWN: FLICKER HOUNDS — HP 35 each, ATK 5`,
    sysMsg: '⚠ Multiple players detected — conflict in progress',
    choices: [
      { label: 'Fight the Flicker Hounds first', sub: 'Clear the threat — gain XP', next: 'fight_hounds', variant: 'danger' },
      { label: 'Get closer and watch the players', sub: 'Observe the conflict', next: 'street_watch' },
      { label: 'Cut through the side alley',       sub: 'Avoid everything',        next: 'street_alley' },
    ],
  },

  fight_hounds: {
    id: 'fight_hounds', type: 'combat',
    text: `They move in sync — circling left and right. Faster than the rat. Smarter too. Your interface marks them both.`,
    enemy: { name:'Flicker Hound', icon:'🐕', hp:70, atk:5, xp:75, loot:[{itemKey:'scrap_metal', qty:2}] },
    onWin: 'street_watch',
    onLose: 'street_alley',
    onEscape: 'street_alley',
  },

  street_watch: {
    id: 'street_watch', type: 'story',
    text: `You duck behind a frozen delivery truck and watch.

The runner is fast but flagging. They dart into a shop doorway. The two pursuers slow, circling. Red badges — both of them. The runner's badge is NEUTRAL.

One draws a scrap blade. Not much — but enough.

The runner looks up and sees you watching. Not asking for help exactly. Just acknowledging someone is there.

You have about ten seconds before it escalates.`,
    xp: 25,
    choices: [
      { label: 'Step in — draw their attention', sub: 'Help the runner escape', next: 'street_rescue', variant: 'danger', moral: 8 },
      { label: 'Stay hidden and watch',           sub: 'See what happens',      next: 'street_watch2', insightRequired: 3 },
    ],
  },

  street_rescue: {
    id: 'street_rescue', type: 'story',
    text: `You step out. "Hey."

Both red-badge players turn. The runner bolts from the doorway and disappears.

The two look at each other. Then at you. They decide you're not worth the trouble — but one throws a punch as they leave. It connects.

Worth it.

The runner left something on the ground — a folded note. LEVEL 2 CACHE — parking garage off 5th, beneath the blue car. You find it. They weren't wrong.`,
    hpLoss: 10, xp: 60,
    rewards: [{ itemKey:'jacket', qty:1 }, { itemKey:'energy_drink', qty:1 }],
    choices: [{ label: 'Continue forward', next: 'street_midpoint' }],
  },

  street_watch2: {
    id: 'street_watch2', type: 'story',
    text: `You stay hidden. The runner escapes on their own — throws something, creates noise, slips away.

The red-badge players argue briefly, then separate.

You emerge with a better understanding of how other players move. What they prioritize. How aggression works here.

On the ground where the runner stood — a dropped energy drink. Still cold.`,
    xp: 40,
    rewards: [{ itemKey:'energy_drink', qty:1 }],
    choices: [{ label: 'Move on', next: 'street_midpoint' }],
  },

  street_alley: {
    id: 'street_alley', type: 'story',
    text: `You cut down a side alley. Cool and quiet — the chaos muffles behind you.

Halfway through, three glowing shapes drop from a fire escape above you. Small. Quick. Hungry-looking.

SYSTEM SPAWN: STATIC CRAWLERS — HP 15 each, ATK 4

Behind a dumpster you also spot a dropped bag. First things first.`,
    choices: [
      { label: 'Fight the crawlers', sub: 'Clear them — then loot', next: 'fight_crawlers' },
      { label: 'Grab the bag and run', sub: 'Skip the fight', next: 'alley_loot' },
    ],
  },

  fight_crawlers: {
    id: 'fight_crawlers', type: 'combat',
    text: `Three of them — they move like static, flickering between positions. Hard to track. But fragile.`,
    enemy: { name:'Static Crawlers', icon:'🦎', hp:45, atk:4, xp:65, loot:[{itemKey:'scrap_metal', qty:1}] },
    onWin: 'alley_loot',
    onLose: 'alley_loot',
    onEscape: 'alley_loot',
  },

  alley_loot: {
    id: 'alley_loot', type: 'story',
    text: `Behind the dumpster: an energy drink, still cold. A roll of bandage. A hand-drawn map with an X marked at the far end of the alley — "BEFORE THE BOSS — STOCK UP."

Someone was here before you. They wanted to help.

You follow the X. A small cache under a loose step. Modest but real.`,
    xp: 30,
    rewards: [{ itemKey:'energy_drink', qty:1 }, { itemKey:'scrap_metal', qty:2 }, { itemKey:'jacket', qty:1 }],
    choices: [{ label: 'Exit the alley', next: 'street_midpoint' }],
  },

  street_return: {
    id: 'street_return', type: 'story',
    text: `You emerge back onto the main road.

The city looks different now. Not less strange — more. Every frozen face a question.

Your interface pings softly. CHAPTER PROGRESS: 40%

As you walk, two more System spawns cross your path — smaller this time, testing you. You dispatch them without breaking stride.

Something is coming. You can feel it before you see it.`,
    xp: 40,
    rewards: [{ itemKey:'scrap_metal', qty:1 }],
    choices: [{ label: 'Press forward', next: 'street_midpoint' }],
  },

  // ═══════════════════════════════════════
  // PATH C — SYSTEM
  // ═══════════════════════════════════════
  system: {
    id: 'system', type: 'story',
    text: `You focus on the interface and let everything else fall away.

It expands — Stats. Inventory. A radar map pulsing with soft signals. And a notification at the edge: TUTORIAL AVAILABLE.

You tap it. The tutorial is brief, clinical, written like a legal document:

1. Players gain XP by surviving encounters and exploring.
2. XP accumulates to raise your level. Each level increases ATK, DEF, and max HP.
3. System Entities will spawn throughout the chapter. Defeat them for XP.
4. A High-Tier Entity awaits at the chapter's end.
5. The System observes everything.

There is no point 6.

You close it. The radar shows six signals nearby — and three non-player entities. Glowing. Moving slowly. Waiting to be found.

Then the sky cracks — just for a second. A single vast eye opens above the city, sweeping slowly across the frozen streets below. Your interface freezes mid-display. Every signal on the radar blinks out.

Then it closes. The interface returns to normal.

THE WATCHER SEES ALL.

The words aren't from your system. They come from somewhere older.`,
    xp: 25,
    sysMsg: '⚠ Scanning… Multiple players and entities detected. Watcher event logged.',
    choices: [
      { label: 'Hunt the nearby entities', sub: 'Grind XP before going further',    next: 'sys_hunt' },
      { label: 'Track the closest player', sub: 'Engage — first-strike advantage',  next: 'sys_track' },
      { label: 'Stay hidden and observe',  sub: 'Learn before acting',              next: 'sys_observe' },
    ],
  },

  sys_hunt: {
    id: 'sys_hunt', type: 'story',
    text: `You use the radar to track them one by one.

The first is alone in a frozen café — a PIXEL DRONE, hovering between suspended coffee cups.

PIXEL DRONE — HP 40, ATK 6

It turns when you enter. Your interface marks it red.`,
    choices: [{ label: 'Engage the Pixel Drone', next: 'fight_drone_1' }],
  },

  fight_drone_1: {
    id: 'fight_drone_1', type: 'combat',
    text: `It moves in unpredictable bursts — left, up, diagonal. But it's predictable in one way: it always attacks from the front.`,
    enemy: { name:'Pixel Drone', icon:'🤖', hp:40, atk:6, xp:70, loot:[{itemKey:'scrap_metal', qty:2}] },
    onWin: 'sys_hunt_2',
    onLose: 'sys_observe',
    onEscape: 'sys_observe',
  },

  sys_hunt_2: {
    id: 'sys_hunt_2', type: 'story',
    text: `It dissolves. Clean. Your stats tick upward.

The radar shows two more. One in the parking garage to the north. One in the alley market to the east.

CORRUPTED SENTRY — HP 55, ATK 7
These are bigger. Designed to test you before the chapter boss.

Which do you take?`,
    xp: 20,
    choices: [
      { label: 'Parking garage — the Corrupted Sentry', next: 'fight_sentry' },
      { label: 'Head to the plaza instead',             sub: 'Skip the second grind', next: 'street_midpoint' },
    ],
  },

  fight_sentry: {
    id: 'fight_sentry', type: 'combat',
    text: `The garage is dark. The Sentry stands in the center of the second level — a humanoid shape made of broken geometry, edges that don't quite meet.

It doesn't move until you step inside.`,
    enemy: { name:'Corrupted Sentry', icon:'👾', hp:55, atk:7, xp:90, loot:[{itemKey:'medkit', qty:1}] },
    onWin: 'sys_hunt_complete',
    onLose: 'street_midpoint',
    onEscape: 'street_midpoint',
  },

  sys_hunt_complete: {
    id: 'sys_hunt_complete', type: 'story',
    text: `It falls apart like a puzzle in reverse — pieces scattering, then vanishing.

Your interface pulses with a new notification:

SYSTEM ENTITIES CLEARED — BONUS XP AWARDED
"You are prepared. Proceed to the plaza."

You feel it. Real and undeniable. Stronger. Faster. More.

The plaza is ahead. Something waits there.`,
    xp: 50,
    choices: [{ label: 'Head to the plaza', next: 'street_midpoint' }],
  },

  sys_track: {
    id: 'sys_track', type: 'story',
    text: `You move silently, radar as guide.

You find them crouched behind a car — studying their own interface. They don't hear you coming.

"I heard your footsteps three blocks back," they say without turning. "I was waiting to see what you'd do."

They turn. Badge: NEUTRAL. Expression: amused. Name: Kai.

"Former data analyst," they say. "Already figured out the System runs on behavior patterns. The boss at the end of this chapter — it'll know your tendencies before you do."

They share a location pin. A supply stash and a spawn point where System entities are clustered together. Easy XP if you move now.`,
    xp: 35,
    choices: [
      { label: 'Hit the spawn point with Kai', sub: 'Team hunt — bonus XP',         next: 'fight_with_kai', moral: 4 },
      { label: 'Go to the plaza now',          sub: 'Skip the extra grind',          next: 'street_midpoint' },
    ],
  },

  fight_with_kai: {
    id: 'fight_with_kai', type: 'combat',
    text: `Kai fights differently than you — calculated, methodical. You take the front. They cover angles.

A pair of FRACTURE WOLVES materializes from between frozen cars. Their howl sounds like dial-up.`,
    enemy: { name:'Fracture Wolves', icon:'🐺', hp:80, atk:6, xp:100, loot:[{itemKey:'knife', qty:1}] },
    onWin: 'sys_track_done',
    onLose: 'street_midpoint',
    onEscape: 'street_midpoint',
  },

  sys_track_done: {
    id: 'sys_track_done', type: 'story',
    text: `They dissolve together — one clean burst of light.

Kai nods. "Good. You're ready for the plaza."

They disappear into the city before you can ask anything else.

You stand in the quiet aftermath. Your interface shows your stats climbing. You can feel the difference now — the way you hold your ground, the speed of your instincts.

The chapter boss is ahead. But so are you.`,
    xp: 40,
    rewards: [{ itemKey:'energy_drink', qty:1 }],
    choices: [{ label: 'Head to the plaza', next: 'street_midpoint' }],
  },

  sys_observe: {
    id: 'sys_observe', type: 'story',
    text: `You let the signals move without following them. Just watch — the radar's dots shifting and drifting.

Two signals merge. Then separate quickly.

One goes dark.

Your own position must look the same to anyone watching. A stationary dot. Patient. Unreadable.

You move toward the plaza, but slowly — picking off two small System spawns on the way. Nothing dramatic. Just preparation.`,
    xp: 55,
    rewards: [{ itemKey:'scrap_metal', qty:2 }],
    choices: [{ label: 'Move toward the plaza', next: 'street_midpoint' }],
  },

  // ═══════════════════════════════════════
  // CONVERGE — ALL PATHS MEET HERE
  // ═══════════════════════════════════════
  street_midpoint: {
    id: 'street_midpoint', type: 'story',
    text: `You reach the center of the city.

A wide plaza — fountains frozen mid-arc, pigeons hovering at impossible angles. Beautiful and wrong in equal measure.

A player sits on the edge of a fountain. Green badge. Exhausted face. They look up when you approach.

"I've been here since it started," they say. "Counting. There are at least forty players in this district."

Forty. The number lands.

"And something else." They point in three directions across the frozen city. "The System has sealed three zones — the parking garage to the north, the market to the east, the glass tower to the west. Each one has something inside it. Not System creatures. Something older. Something the System found and appointed."

A beat.

"Nothing gets through to the plaza until those three are dealt with. I tried. There's a barrier — you can feel it. The Watcher won't show itself until the district is cleared."

Your interface updates:

CHAPTER PROGRESS: 40%
THREE ZONE GUARDIANS DETECTED.
DISTRICT MUST BE CLEARED TO PROCEED.`,
    sysMsg: '⚠ Zone Guardians active. The district is sealed until all three are defeated.',
    choices: [
      { label: 'Head to the Parking Garage', sub: 'Face the Sentinel of the First Eye', next: 'garage_approach' },
      { label: 'Head to the Frozen Market',  sub: 'Face The Surveyor',                  next: 'market_approach' },
      { label: 'Head to the Glass Tower',    sub: 'Face The Unseen',                    next: 'tower_approach' },
    ],
  },

  // ── After each guardian is beaten, player returns here ──
  // This hub checks if all 3 are cleared, then sends to plaza
  district_hub: {
    id: 'district_hub', type: 'story',
    text: `You return to the plaza center.

The barrier has shifted — you can feel it. Like pressure releasing from a sealed room.

Your interface shows the district status.`,
    choices: [], // dynamically overridden by render() — see renderDistrictHub below
  },

  plaza_talk: {
    id: 'plaza_talk', type: 'story',
    text: `The green-badge player — Yara — has been building a picture from everything she's seen.

"The System rewards survival and combat. Every creature you defeat makes you stronger. Every choice you make gets recorded."

She pulls up her own stats. Level 3. She's been fighting.

"There's one more cluster of entities before the boss," she says, pointing toward the north end of the plaza. "I cleared mine. Have you cleared yours?"

As if on cue, your interface flickers:

WARNING: HIGH-TIER ENTITY APPROACHING THIS ZONE.
SYSTEM RECOMMENDATION: REACH LEVEL 3 BEFORE ENGAGING.

Then something else happens. Something nobody programmed.

The sky tears — not like weather, not like an event. Like a curtain pulled aside by a hand that has been waiting patiently since the beginning.

A single eye opens in the gap. Vast. Patient. Unblinking.

THE WATCHER SEES ALL.

Every player in the district feels it simultaneously. A pressure. A certainty. Not a threat — a statement of fact. You have been observed since the first moment you stepped into this frozen city. Every decision recorded. Every hesitation logged.

The eye closes. The curtain falls back into place.

Yara looks at you. Her interface is still glitching. "Did you see that?"

"Yeah," you say.

"How are your stats?"`,
    sysMsg: '⚠ THE WATCHER SEES ALL — Full observation event. High-tier entity inbound.',
    choices: [
      { label: 'I am ready — let it come',           sub: 'Engage The Watcher now',              next: 'pre_boss_check' },
      { label: 'Hit the north plaza spawn first',    sub: 'More XP before the boss fight',       next: 'plaza_grind' },
      { label: "A Watcher's Eye descends — face it", sub: 'Lv3+ challenge — rare loot',           next: 'watcher_eye_ambush', variant: 'danger' },
    ],
  },

  plaza_grind: {
    id: 'plaza_grind', type: 'story',
    text: `The north end of the plaza is dense with them — SYSTEM FRAGMENTS, crystallized errors in the fabric of the paused world. They swarm in groups. They're not smart. But they're many.

SYSTEM FRAGMENT CLUSTER — HP 90 total, ATK 5

Yara watches from a distance. "I'll cover your flank," she says.`,
    choices: [{ label: 'Fight the Fragment Cluster', next: 'fight_plaza_spawn' }],
  },

  fight_plaza_spawn: {
    id: 'fight_plaza_spawn', type: 'combat',
    text: `They move like broken code — stuttering, overlapping, reforming. Yara is true to her word. You take the front.`,
    enemy: { name:'Fragment Cluster', icon:'💠', hp:90, atk:5, xp:110, loot:[{itemKey:'medkit', qty:1}] },
    onWin: 'plaza_grind_done',
    onLose: 'pre_boss_check',
    onEscape: 'pre_boss_check',
  },

  plaza_grind_done: {
    id: 'plaza_grind_done', type: 'story',
    text: `They dissolve in waves. The plaza goes quiet.

Yara walks over. Looks at your interface. Nods slowly.

"Now you're ready."

Your stats reflect it. Every fight has built toward this moment. You can feel the difference — the weight of your decisions, the sharpness of your instincts, the certainty that you are not the same player who stepped into this frozen city at the start.

The sky begins to change.

Then — before the boss arrives — the sky changes a second time.

Not The Watcher itself. Something smaller. Many somethings.

Seven eyes emerge from the clouds in a slow spiral. They orbit each other with mechanical patience.

Your interface flags them immediately: WATCHER'S EYE SWARM. Optional engagement.

This is not the boss. This is a test — sent in advance. A message.

THE WATCHER SEES ALL. And it wants to see you fight.`,
    xp: 50,
    choices: [
      { label: 'Face what comes next — the boss', next: 'pre_boss_check' },
      { label: 'Engage the Eye Swarm first', sub: 'Hard fight. Massive XP. Lv7+ recommended.', next: 'watcher_eye_swarm', variant: 'danger' },
    ],
  },

  pre_boss_check: {
    id: 'pre_boss_check', type: 'story',
    text: `The fountain at the center of the plaza begins to vibrate. The water — still frozen mid-arc — starts to crack.

Yara steps back. Her interface is pinging rapidly.

"Ninety seconds," she says. "Make your call."

She looks at you with the expression of someone who has been waiting a long time for something worth fighting.

"Together?" she asks.

You have about ninety seconds to decide.`,
    sysMsg: '⚠ Boss entity countdown initiated. 90 seconds.',
    choices: [
      { label: 'Fight together',                     sub: 'A green ally — shared damage',    next: 'pre_boss_team',   moral: 5 },
      { label: 'Tell her to run — you handle it',   sub: 'Face it alone. Your choice.',     next: 'pre_boss_solo' },
      { label: 'Use her as bait and set an ambush', sub: 'Cold. Effective. Dangerous.',     next: 'pre_boss_betray', variant: 'danger', moral: -13 },
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

She leaves at a run. You stand alone in the plaza. The fountains begin to tremble.

Your interface counts down. You breathe. You wait.

At zero, the sky splits.`,
    choices: [{ label: 'Face The Watcher', next: 'boss', bossMode: 'solo' }],
  },

  pre_boss_betray: {
    id: 'pre_boss_betray', type: 'story',
    text: `"Stay center," you tell her calmly. "It'll come from above — you'll see it first from there."

She believes you. Moves to the middle of the plaza.

You take position behind a frozen news kiosk. Thirty meters back. Clear sightline.

The countdown hits zero. The sky tears open. The eye descends.

It looks directly at Yara first — then past her, to you. As if it already knows.

As if it's been watching you all along.`,
    choices: [{ label: 'Face The Watcher', next: 'boss', bossMode: 'betray' }],
  },

  // ═══════════════════════════════════════
  // BOSS
  // ═══════════════════════════════════════
  boss: {
    id:'boss', type:'boss',
    video: '../assets/video/the_watcher.mp4',
    text:`The eye opens fully.

Not a metaphor. Not a symbol. An actual eye, the size of a building, suspended in the torn sky above the plaza.

It blinks once — slowly, deliberately — and every player in the district feels it. A pressure behind the eyes. A sudden awareness of being seen.

THE WATCHER.

The air vibrates at a frequency just below hearing. The frozen people around the plaza begin to tremble, as if even suspended physics recognizes something ancient and wrong has arrived.

It looks at you.

It already knows everything.`,
    enemy: { name:'The Watcher', icon:'👁', hp:200, atk:32, def:15, spd:32, xp:300, loot:[{itemKey:'core_fragment',qty:1},{itemKey:'rune_ignis',qty:1}] },
  },

  // ═══════════════════════════════════════
  // FARMING LOCATIONS
  // ═══════════════════════════════════════
  farming_hub: {
    id: 'farming_hub', type: 'location_hub',
    text: `Your interface opens a tactical overlay of the district.

Three zones pulse with System entity activity — each with different threats and loot. Fight as many times as you want. Return to the story when you are ready.`,
    sysMsg: '⚠ Farming zones active — entities respawn indefinitely.',
    locations: [
      {
        id: 'loc_garage', name: 'Parking Garage', icon: '🅿️', level: 'Easy', color: '#5ec45e',
        desc: 'Weak spawns. Good for early runes and consumables.',
        enemies: [
          { name:'Glitch Rat',     icon:'🐀', hp:20,  atk:3,  agility:3, xp:25,  loot:[
            {itemKey:'scrap_metal',  chance:.30},
            {itemKey:'energy_drink', chance:.30},
            {itemKey:'scrap_helm',   chance:.19},
            {itemKey:'scrap_shield', chance:.19},
            {itemKey:'rune_ignis',   chance:.02},
          ]},
          { name:'Static Crawler', icon:'🦎', hp:30,  atk:4,  agility:4, xp:35,  loot:[
            {itemKey:'scrap_metal',  chance:.20},
            {itemKey:'scrap_blade',  chance:.20},
            {itemKey:'scrap_helm',   chance:.20},
            {itemKey:'scrap_shield', chance:.20},
            {itemKey:'rune_aqua',    chance:.10},
            {itemKey:'rune_flora',   chance:.10},
          ]},
          { name:'Pixel Shard',    icon:'💠', hp:15,  atk:2,  agility:5, xp:20,  loot:[
            {itemKey:'energy_drink', chance:.20},
            {itemKey:'flashlight',   chance:.20},
            {itemKey:'scrap_shield', chance:.20},
            {itemKey:'rune_terra',   chance:.20},
            {itemKey:'rune_aero',    chance:.20},
          ]},
        ],
      },
      {
        id: 'loc_market', name: 'Frozen Market', icon: '🏪', level: 'Medium', color: '#c8b96e',
        desc: 'Mid-tier entities. Better gear and rare rune drops.',
        enemies: [
          { name:'Flicker Hound',  icon:'🐕', hp:55,  atk:6,  agility:6, xp:60,  loot:[
            {itemKey:'jacket',       chance:.20},
            {itemKey:'knife',        chance:.20},
            {itemKey:'iron_helm',    chance:.20},
            {itemKey:'iron_shield',  chance:.20},
            {itemKey:'rune_aero',    chance:.10},
            {itemKey:'rune_ignis',   chance:.10},
          ]},
          { name:'Pixel Drone',    icon:'🤖', hp:45,  atk:7,  agility:5, xp:65,  loot:[
            {itemKey:'scrap_metal',  chance:.25},
            {itemKey:'flashlight',   chance:.15},
            {itemKey:'iron_helm',    chance:.20},
            {itemKey:'rune_ignis',   chance:.20},
            {itemKey:'rune_aqua',    chance:.20},
          ]},
          { name:'Fracture Wolf',  icon:'🐺', hp:70,  atk:7,  agility:7, xp:75,  loot:[
            {itemKey:'leather_gloves',chance:.20},
            {itemKey:'worn_boots',   chance:.20},
            {itemKey:'iron_shield',  chance:.30},
            {itemKey:'rune_aero',    chance:.15},
            {itemKey:'rune_terra',   chance:.15},
          ]},
        ],
      },
      {
        id: 'loc_tower', name: 'Glass Tower', icon: '🏢', level: 'Hard', color: '#e05555',
        desc: 'Elite entities. Rare and epic loot, high XP.',
        enemies: [
          { name:'Corrupted Sentry',icon:'👾', hp:90,  atk:10, agility:6, xp:100, loot:[
            {itemKey:'iron_sword',     chance:.20},
            {itemKey:'riot_vest',      chance:.20},
            {itemKey:'tactical_helm',  chance:.35},
            {itemKey:'rune_aqua',      chance:.10},
            {itemKey:'rune_flora',     chance:.10},
            {itemKey:'tactical_sword', chance:.05},
          ]},
          { name:'Void Sentinel',  icon:'⚫', hp:110, atk:12, agility:7, xp:120, loot:[
            {itemKey:'medkit',         chance:.20},
            {itemKey:'iron_helm',      chance:.20},
            {itemKey:'tactical_helm',  chance:.40},
            {itemKey:'rune_terra',     chance:.10},
            {itemKey:'rune_ignis',     chance:.10},
          ]},
          { name:'System Enforcer',icon:'🔴', hp:130, atk:14, agility:8, xp:150, loot:[
            {itemKey:'iron_shield',    chance:.20},
            {itemKey:'iron_ring',      chance:.20},
            {itemKey:'tactical_shield',chance:.30},
            {itemKey:'rune_ignis',     chance:.13},
            {itemKey:'rune_flora',     chance:.12},
            {itemKey:'tactical_sword', chance:.05},
          ]},
        ],
      },
    ],
    returnNode: 'district_hub',
  },

  // ═══════════════════════════════════════
  // THE WATCHER SEES ALL — mid-chapter revelation
  // ═══════════════════════════════════════
  watcher_sees: {
    id: 'watcher_sees', type: 'story',
    text: `You are midway through the plaza when everything changes.

The interface above your head flickers — once, twice — and then the sky above the frozen city splits open in a beam of pale white light.

Not sunlight. Something older.

A single eye the size of a city block opens in the sky above you. It is not looking at the horizon. It is not looking at the plaza, or the fountain, or the frozen crowd.

It is looking at you.

THE WATCHER SEES ALL.

The words don't appear in your interface. They don't need to. They land somewhere behind your eyes, behind thought itself, pressed into you like a brand.

Every choice you have made since arriving in this city. Every path you walked. Every player you helped or abandoned or hurt.

It knows.

The eye closes slowly — as if satisfied. As if it has already decided what you are.

Your interface flickers back to normal. But you will not forget the weight of that gaze.

The game is watching you back.`,
    sysMsg: '⚠ SYSTEM ALERT: Observation confirmed. The Watcher records all behaviors.',
    choices: [
      { label: 'Continue to the plaza', next: 'street_midpoint' },
    ],
  },

  // ═══════════════════════════════════════
  // WATCHER EYE — random ambush (level 3+)
  // ═══════════════════════════════════════
  watcher_eye_ambush: {
    id: 'watcher_eye_ambush', type: 'story',
    text: `A crack splits the sky without warning.

No build-up. No trembling ground. One moment the city is frozen and still — the next, something descends from the gap between clouds.

A single eye. Pale, unblinking, trailing light like a comet tail.

THE WATCHER'S EYE.

It locks onto you the moment it appears. Your interface screams a warning you've never seen before:

⚠ OBSERVED. TARGET MARKED. INCOMING.

It moves like thought. Fast.`,
    sysMsg: '⚠ WATCHER EYE DETECTED — The Watcher has sent a fragment of itself to test you.',
    choices: [
      { label: 'Stand your ground', next: 'fight_watcher_eye' },
      { label: 'Run — find cover', sub: 'Attempt to flee before it reaches you', next: 'eye_escape_attempt' },
    ],
  },

  eye_escape_attempt: {
    id: 'eye_escape_attempt', type: 'story',
    text: `You bolt.

Down a frozen alley, vaulting over a suspended bicycle, ducking under a car that hasn't moved in hours.

The eye follows. It doesn't rush — it simply adjusts, rotating slowly on its axis, always pointing at you.

You realize running was never going to work. The Watcher already knows where you are.

You turn and face it.`,
    choices: [
      { label: 'Fight', next: 'fight_watcher_eye' },
    ],
  },

  fight_watcher_eye: {
    id: 'fight_watcher_eye', type: 'combat',
    text: `It hovers three feet off the ground. The iris contracts when it sees you raise your weapon. The air around it hums at a frequency that makes your teeth ache.

It is not The Watcher. But it is a piece of The Watcher.

And it is watching you fight.`,
    enemy: { name:"Watcher's Eye", icon:'👁', hp:60, atk:12, xp:80, loot:[{itemKey:'rune_aqua',qty:1}] },
    onWin: 'eye_defeated',
    onLose: 'eye_survived',
    onEscape: 'eye_survived',
  },

  eye_defeated: {
    id: 'eye_defeated', type: 'story',
    text: `It dissolves in a burst of pale light — not like the System creatures that shatter into pixels. This is quieter. More personal.

A single tear of white liquid falls where it hovered, then evaporates before it hits the pavement.

Your interface registers the kill.

WATCHER'S EYE — DEFEATED.
XP GAINED. WATCHER AWARENESS: ELEVATED.

Somewhere above the clouds, something blinks.

It will send more.`,
    xp: 30,
    choices: [
      { label: 'Continue', next: '__eye_return__' },
    ],
  },

  eye_survived: {
    id: 'eye_survived', type: 'story',
    text: `It retreats without pressing its advantage. The eye rises back toward the crack in the sky, iris closing slowly.

It was a test. Not an execution.

The System registered everything — how you fought, how you panicked, how you made your choices when something ancient was watching.

Your interface shows a faint pulse: WATCHER AWARENESS: NOTED.

You're not sure what that means. But you know you'll find out.`,
    choices: [
      { label: 'Gather yourself and move on', next: '__eye_return__' },
    ],
  },

  // ═══════════════════════════════════════
  // EYE SWARM — level 7+ challenge
  // ═══════════════════════════════════════
  watcher_eye_swarm: {
    id: 'watcher_eye_swarm', type: 'story',
    text: `The first one appears at noon.

Then three more. Then seven.

They come from every direction — through frozen alley mouths, descending from rooftop level, drifting up from subway grates. Each one the size of a fist, trailing white light, orbiting each other in a slow spiral.

WATCHER'S EYE SWARM.

Your interface has never shown a reading like this. Not a single enemy. Not a cluster.

A collective. A single distributed mind in dozens of sockets.

They don't attack immediately. They surround you, forming a perfect ring at a distance of fifteen meters.

They're letting you see them. All of them. At once.

THE WATCHER SEES ALL.

And then they close in.`,
    sysMsg: '⚠ CRITICAL ALERT: Eye Swarm detected. Multiple Watcher fragments — coordinated attack.',
    choices: [
      { label: 'Hold your position and fight', next: 'fight_eye_swarm', variant: 'danger' },
      { label: 'Break through the ring — force an opening', sub: 'Go aggressive, break the encirclement', next: 'fight_eye_swarm' },
    ],
  },

  fight_eye_swarm: {
    id: 'fight_eye_swarm', type: 'combat',
    text: `They move as one. When you strike left, the right flank adjusts. When you advance, the rear tightens.

Fighting the swarm is not like fighting an enemy. It is like fighting a thought — distributed, adaptive, patient.

Your interface is struggling to lock on. Too many targets. Too many eyes.

All of them watching.`,
    enemy: { name:"Watcher's Eye Swarm", icon:'👁', hp:140, atk:14, xp:180, loot:[{itemKey:'rune_aqua',qty:1},{itemKey:'rune_terra',qty:1}] },
    onWin: 'swarm_defeated',
    onLose: 'swarm_survived',
    onEscape: 'swarm_survived',
  },

  swarm_defeated: {
    id: 'swarm_defeated', type: 'story',
    text: `They fall one by one — not shattered, not deleted. They simply close. Each iris shutting like a camera shutter, one after another, in a wave that spreads outward from the first one you killed.

The last eye to close is the largest.

It lingers. Looking at you.

You hold its gaze.

It closes.

Your interface updates:

EYE SWARM — DEFEATED.
WATCHER AWARENESS: CRITICAL.
SYSTEM NOTE: The Watcher has taken full interest in this player.

You are not sure if that is a warning or a reward.`,
    xp: 60,
    choices: [
      { label: 'Move forward', next: '__eye_return__' },
    ],
  },

  swarm_survived: {
    id: 'swarm_survived', type: 'story',
    text: `They let you go.

That is somehow worse than if they had finished it.

The swarm disperses in every direction — back through alley mouths, back up toward rooflines — moving with the unhurried confidence of something that has already recorded everything it needed.

Your HP is low. Your hands won't stop shaking.

But you are still standing.

WATCHER AWARENESS: CRITICAL.

You move on. Quickly.`,
    choices: [
      { label: 'Continue', next: '__eye_return__' },
    ],
  },
  // ═══════════════════════════════════════════════════════════
  // ZONE 1 — PARKING GARAGE — ARC: "What Marcus Became"
  // 5 beats leading to the Sentinel of the First Eye
  // Characters: Marcus (the scared kid), Dorian (the opportunist)
  // ═══════════════════════════════════════════════════════════

  // BEAT 1 — Arrival
  garage_approach: {
    id: 'garage_approach', type: 'story',
    text: `The parking garage entrance yawns open ahead of you.

Concrete and shadow. The smell of oil and something else — ozone, the same smell your interface gives off when it's working hard.

You step inside.

The moment you cross the threshold, your radar distorts. Signals blur, then sharpen, then blur again. Something in here is interfering with the System. Or the System is interfering with something in here.

On the ground floor, three GLITCH RATS cluster near an overturned motorcycle. Faintly luminous. Watching.

And behind them — movement. A shape that's definitely human, trying to stay very still against a concrete pillar.`,
    sysMsg: '⚠ Radar interference detected. Proceed with caution.',
    choices: [
      { label: 'Fight through the Glitch Rats', sub: 'Clear the floor — then find the person', next: 'garage_b1_fight' },
      { label: 'Slip past and approach the person directly', sub: 'Avoid combat — engage the unknown', next: 'garage_b1_meet' },
    ],
  },

  garage_b1_fight: {
    id: 'garage_b1_fight', type: 'combat',
    text: `They scatter when you move — then regroup, coming at you from three angles. Faster than the ones outside. The garage has made them hungry.`,
    enemy: { name:'Garage Glitch Rats', icon:'🐀', hp:55, atk:4, xp:50, loot:[{itemKey:'scrap_metal',qty:2}] },
    onWin: 'garage_b1_meet',
    onLose: 'garage_b1_meet',
    onEscape: 'garage_b1_meet',
  },

  garage_b1_meet: {
    id: 'garage_b1_meet', type: 'story',
    text: `The shape against the pillar doesn't run when you approach. That's either brave or too scared to move.

You get close enough to see the face.

Marcus.

The nineteen-year-old from the parking structure earlier — or someone who looks exactly like him. But the badge is different now. It was NEUTRAL before. It reads UNKNOWN.

"You," he says. His voice has changed. Quieter. More controlled.

"Marcus," you say.

He shakes his head slowly. "I was. The System updated me. Something happened while I was hiding — my interface went dark, came back with new information. A different read on everything."

He holds up his arm. The badge flickers. NEUTRAL. UNKNOWN. NEUTRAL.

"I don't know what I am anymore," he says. "But I know what's deeper in this garage. And I know you're going to have to get through it."

He pauses. "I can come with you. Or I can stay here. Either way, it's going to notice you soon."`,
    sysMsg: '⚠ Unknown badge detected — player status unclassified.',
    choices: [
      { label: 'Take Marcus with you', sub: 'He knows the layout. Risky — his badge is unstable.', next: 'garage_b2_together', moral: 6 },
      { label: 'Leave him here — move alone', sub: 'Safer. Faster. Less complicated.', next: 'garage_b2_alone', moral: -3 },
    ],
  },

  // BEAT 2 — Second level
  garage_b2_together: {
    id: 'garage_b2_together', type: 'story',
    text: `He follows at your shoulder. Quiet and fast. Whatever the System did to him, it didn't take away his instincts.

On the second level, the air changes. The interference intensifies — your interface stutters with every step, health readout dropping to single digits before snapping back to normal.

"It's the Sentinel," Marcus says quietly. "You can feel it before you see it. It doesn't move — it just... extends itself. Like the garage is its eye and you're walking into the iris."

Two STATIC CRAWLERS skitter down the ramp ahead. Then three more behind you.

"Pincer," he says. "They use us to track. If we fight them, it knows exactly where we are."

Your interface pings: AMBUSH DETECTED.`,
    choices: [
      { label: 'Fight through the crawlers fast — keep moving', next: 'garage_b2_fight_together', variant: 'danger' },
      { label: 'Take Marcus\'s advice — find a gap and slip through', sub: 'Takes more time. Safer approach.', next: 'garage_b2_stealth' },
    ],
  },

  garage_b2_alone: {
    id: 'garage_b2_alone', type: 'story',
    text: `You leave him there. He doesn't argue. Just watches you go with that flickering badge and that newly quiet face.

The second level hits you hard. The interference doubles — your interface shudders, health bar strobing. The System here is being actively suppressed by something deep inside the building.

Five STATIC CRAWLERS drop from the ceiling simultaneously. No preamble. No warning.

They knew you were coming.`,
    choices: [{ label: 'Fight them alone', next: 'garage_b2_fight_alone' }],
  },

  garage_b2_fight_together: {
    id: 'garage_b2_fight_together', type: 'combat',
    text: `Marcus takes the right flank without being asked. He moves differently now — no hesitation, no wasted motion. Whatever the System changed in him, his instincts are sharper for it.

You take the left. Five crawlers. Two fighters. The math is manageable.`,
    enemy: { name:'Static Crawlers', icon:'🦎', hp:75, atk:5, xp:80, loot:[{itemKey:'scrap_metal',qty:2},{itemKey:'energy_drink',qty:1}] },
    onWin: 'garage_b2_clear',
    onLose: 'garage_b2_clear',
    onEscape: 'garage_b2_clear',
  },

  garage_b2_fight_alone: {
    id: 'garage_b2_fight_alone', type: 'combat',
    text: `Five of them. Just you. They're not fast individually — but they work as a system. The moment you face one, another flanks you.

You learn to keep moving. Never stop. Never let them get behind you.`,
    enemy: { name:'Static Crawlers x5', icon:'🦎', hp:90, atk:6, xp:90, loot:[{itemKey:'scrap_metal',qty:2}] },
    onWin: 'garage_b2_clear',
    onLose: 'garage_b2_clear',
    onEscape: 'garage_b2_clear',
  },

  garage_b2_stealth: {
    id: 'garage_b2_stealth', type: 'story',
    text: `Marcus points to a gap between two frozen SUVs — a narrow channel the crawlers haven't closed off.

You move through it quickly, quietly. The crawlers track the noise of fighting that doesn't happen, circling where you were.

It works.

On the other side: the second level opens into a wider floor. Dark. Something ahead that isn't moving but feels like it's paying very close attention.

"Third level is worse," Marcus murmurs. "There's someone up there. Found out the hard way — almost didn't make it back."`,
    xp: 40,
    choices: [{ label: 'Climb to the third level', next: 'garage_b2_clear' }],
  },

  garage_b2_clear: {
    id: 'garage_b2_clear', type: 'story',
    text: `The second level falls quiet behind you.

The ramp to the third floor stretches ahead — and at the top, backlit by a shaft of pale emergency lighting, stands a figure.

Not Marcus (if he's with you, he goes still the moment he sees it).

This one is taller. Built like someone who decided a long time ago that other people were resources. Badge: RED. They're watching you come up the ramp without moving, arms loose at their sides.

"You're the one who's been clearing floors," they say. Not a question.

Their name is Dorian. You know it before they say it — the System tags them automatically. HIGH THREAT. COMBAT HISTORY: EXTENSIVE.

"I've been watching you work," Dorian says. "You're good. Not as good as you think — but good."

They hold up a hand. Open. Empty.

"I'm not looking for a fight. I'm looking for someone strong enough to get past what's waiting at the top. And I think that might be you."`,
    sysMsg: '⚠ RED player detected — HIGH THREAT rating. Proceed with caution.',
    choices: [
      { label: 'Hear Dorian out', sub: 'He might know something useful. He might be lying.', next: 'garage_b3_dorian_talk', moral: 3 },
      { label: 'Attack before he can', sub: 'RED badge. Extensive history. Trust nothing.', next: 'garage_b3_dorian_fight', variant: 'danger', moral: -5 },
      { label: 'Walk past him — say nothing', sub: 'Keep moving. Don\'t engage.', next: 'garage_b3_dorian_ignore' },
    ],
  },

  // BEAT 3 — Dorian
  garage_b3_dorian_talk: {
    id: 'garage_b3_dorian_talk', type: 'story',
    text: `Dorian talks like someone who's rehearsed it.

"There's a VOID SENTINEL on level four. Military-tier. I've tried it twice — it's adapting between fights. Gets faster. Learns your patterns."

He pauses. Watches you process that.

"I've also been through every level of this garage. I know where the supply caches are, I know the crawler patrol routes, and I know there's something on level five that even the Void Sentinel is scared of. You can feel it — a weight to the air."

He takes a step closer. "I help you through levels three and four, you take me to five. After that — we're even. You can try to kill me then if you want. I'll probably let you."

His badge pulses. RED. Something in his history the System won't let you unsee.

"How many players did you hurt to get that badge?" you ask.

"Enough," he says. "Not enough to enjoy it."

There's a long silence.`,
    choices: [
      { label: 'Take the deal — work together to level four', sub: 'Uneasy alliance. He knows the layout.', next: 'garage_b3_alliance', moral: 4 },
      { label: 'Refuse — you don\'t trust RED badges', sub: 'Go it alone from here.', next: 'garage_b3_dorian_ignore' },
    ],
  },

  garage_b3_dorian_fight: {
    id: 'garage_b3_dorian_fight', type: 'combat',
    text: `He sees it coming. Of course he does — a combat history that extensive means you learn to read intent.

He doesn't panic. He moves sideways, draws something from his jacket. Fast and practiced.

"Couldn't just talk," he says. He sounds almost disappointed.`,
    enemy: { name:'Dorian', icon:'🔴', hp:85, atk:11, xp:110, loot:[{itemKey:'knife',qty:1},{itemKey:'energy_drink',qty:1}] },
    onWin: 'garage_b3_dorian_beaten',
    onLose: 'garage_b3_dorian_retreat',
    onEscape: 'garage_b3_dorian_retreat',
  },

  garage_b3_dorian_beaten: {
    id: 'garage_b3_dorian_beaten', type: 'story',
    text: `He goes down hard. Doesn't beg. Just sits against the concrete with blood on his lip and watches you collect yourself.

"Smart play," he says. "I would've betrayed you on level four anyway."

He doesn't say it with bitterness. Just honesty. Like a fact about weather.

His dropped supplies. His route notes — scrawled on a receipt. Level three: two PIXEL DRONES. Level four: the Void Sentinel, north corner. Level five: unknown. He couldn't get close.

You leave him there. He's not dead. He'll move when you're gone.

Somewhere up the ramp, something enormous shifts its weight.`,
    xp: 60,
    rewards: [{ itemKey:'knife',qty:1 }, { itemKey:'energy_drink',qty:1 }],
    choices: [{ label: 'Climb to level three', next: 'garage_b3_level3' }],
  },

  garage_b3_dorian_retreat: {
    id: 'garage_b3_dorian_retreat', type: 'story',
    text: `He's better than you expected.

You pull back. He doesn't press the advantage — just watches you regroup with that same flat expression.

"Done?" he says.

You're done.

He nods toward the ramp. "Level three. Two Pixel Drones. Level four: Void Sentinel, northwest corner. It adapts. Change your approach every round or it'll predict you."

He sits down against a pillar. "Consider that information a tax on attacking me first."

Something flickers in his badge. RED. But not entirely.`,
    choices: [{ label: 'Climb to level three', next: 'garage_b3_level3' }],
  },

  garage_b3_dorian_ignore: {
    id: 'garage_b3_dorian_ignore', type: 'story',
    text: `You walk past him without a word.

He lets you. Doesn't follow. You can feel his eyes on your back all the way up the ramp.

"Level four," he calls after you. "North corner. It's bigger than you think."

You don't know if that's help or threat. Maybe he doesn't either.

Level three opens ahead of you. The interference is worse here. Your interface is barely functioning.`,
    choices: [{ label: 'Enter level three', next: 'garage_b3_level3' }],
  },

  garage_b3_alliance: {
    id: 'garage_b3_alliance', type: 'story',
    text: `You work through level three together.

Dorian fights like he talks — economical. Nothing wasted. He handles the left. You handle the right. Two Pixel Drones dissolve in under a minute.

"You're better than I expected," he says.

"You had low expectations," you say.

"Always."

On the ramp to level four he stops. Turns to you.

"If Marcus is with you" — he doesn't look at Marcus — "you should know he's not NEUTRAL-UNKNOWN because the System glitched. He's UNKNOWN because the System is still deciding what he is. What he does next writes the result. Same as everyone."

A pause.

"Same as me."

He says it like it costs something.`,
    xp: 40,
    choices: [{ label: 'Move to level four together', next: 'garage_b4_void_sentinel' }],
  },

  // BEAT 3 (solo path)
  garage_b3_level3: {
    id: 'garage_b3_level3', type: 'story',
    text: `Level three.

The interference here is total. Your interface runs on instinct alone — the numbers gone, just color and shape and instinct.

Two PIXEL DRONES hover in the center of the floor. Larger than the ones you've fought before. Their chassis is cracked — something hit them already and they patched themselves back together wrong.

They turn when you step off the ramp.

One of them opens a channel on your interface. A sound like a broken radio. It's not a voice. But it feels like an attempt at one.

Your radar briefly shows a shape behind you on the ramp.

Dorian. Watching. Waiting to see how you handle this.`,
    choices: [{ label: 'Fight the Pixel Drones', next: 'garage_b3_drones' }],
  },

  garage_b3_drones: {
    id: 'garage_b3_drones', type: 'combat',
    text: `They move in overlapping arcs, each one filling the gap the other leaves. Practiced. Like they've fought together before — or like something is coordinating them.

You catch a faint white light at the edges of your vision. Something at the top of the building, watching through them.`,
    enemy: { name:'Jury-Rigged Pixel Drones', icon:'🤖', hp:90, atk:8, xp:100, loot:[{itemKey:'rune_aero',qty:1}] },
    onWin: 'garage_b4_approach',
    onLose: 'garage_b4_approach',
    onEscape: 'garage_b4_approach',
  },

  // BEAT 4 — Void Sentinel & Dorian's betrayal
  garage_b4_void_sentinel: {
    id: 'garage_b4_void_sentinel', type: 'story',
    text: `Level four.

The north corner. Exactly where Dorian said.

A VOID SENTINEL stands against the far wall — taller than a person, geometry wrong, its surface absorbing the pale emergency light rather than reflecting it. It doesn't have a face. It has a direction. And right now that direction is you.

VOID SENTINEL — HP 110, ATK 12. ADAPTS AFTER EACH ROUND.

Dorian positions himself to your left.

"I'll take it from the rear," he says. "You draw its attention. It can't track two targets simultaneously — I tested that."

You nod. Move forward.

The Void Sentinel's surface ripples.

Something is off.

Dorian isn't moving to the rear.

Dorian is stepping back toward the ramp.`,
    sysMsg: '⚠ VOID SENTINEL — ADAPTIVE AI. Attack pattern changes every round.',
    choices: [
      { label: 'Fight the Void Sentinel — deal with Dorian after', sub: 'Focus on the threat in front of you', next: 'garage_b4_sentinel_fight', variant: 'danger' },
      { label: 'Turn on Dorian before the fight starts', sub: 'He was never going to hold the deal', next: 'garage_b4_dorian_turn', variant: 'danger', moral: -4 },
    ],
  },

  garage_b4_approach: {
    id: 'garage_b4_approach', type: 'story',
    text: `Level four.

The ramp opens onto a wide floor and you see it immediately.

North corner. A VOID SENTINEL. Its surface absorbs the light around it — not reflecting, just consuming. The air near it has a weight that your body registers before your brain does.

VOID SENTINEL — HP 110, ATK 12. ADAPTS.

Somewhere behind you on the lower ramp, you feel Dorian's eyes. Whether he helped you or not — he's watching to see if you survive this.

So is something much larger. Further up.`,
    choices: [{ label: 'Fight the Void Sentinel', next: 'garage_b4_sentinel_fight', variant: 'danger' }],
  },

  garage_b4_dorian_turn: {
    id: 'garage_b4_dorian_turn', type: 'combat',
    text: `You wheel on Dorian before the Void Sentinel can react.

He was already moving. He anticipated this too.

"Good instinct," he says. He sounds almost proud.

Behind you, you hear the Void Sentinel's surface ripple — adjusting, recalculating. It will wait. It has patience. What it's watching is more interesting.`,
    enemy: { name:'Dorian (Betrayal)', icon:'🔴', hp:95, atk:12, xp:120, loot:[{itemKey:'iron_ring',qty:1},{itemKey:'medkit',qty:1}] },
    onWin: 'garage_b4_dorian_won',
    onLose: 'garage_b4_sentinel_fight',
    onEscape: 'garage_b4_sentinel_fight',
  },

  garage_b4_dorian_won: {
    id: 'garage_b4_dorian_won', type: 'story',
    text: `He goes down for real this time.

Breathing. Not moving.

Your interface logs it: RED PLAYER NEUTRALIZED.

He looks up at you from the floor. Something in his expression that you didn't expect — not anger, not defeat.

Relief.

"It's funny," he says. "Every person I betrayed, I told myself it was the game. That I didn't have a choice." He pauses. "I had choices."

His badge changes.

NEUTRAL.

He closes his eyes. "The Void Sentinel's weak point is the moment after it adapts — there's a half-second where its geometry reconfigures. Hit it then."

He reaches into his jacket. Pulls out a folded cloth — inside, a blade. Not scrap. Actual alloy, pre-freeze, maintained. He'd been keeping it for himself.

He holds it out without opening his eyes.

"You earned it," he says.

Then he's unconscious. Or close enough.

You turn to face the Void Sentinel alone.`,
    xp: 100,
    rewards: [{ itemKey:'iron_ring',qty:1 }, { itemKey:'medkit',qty:2 }, { itemKey:'iron_sword',qty:1 }, { itemKey:'energy_drink',qty:1 }],
    choices: [{ label: 'Face the Void Sentinel', next: 'garage_b4_sentinel_fight', variant: 'danger' }],
  },

  garage_b4_sentinel_fight: {
    id: 'garage_b4_sentinel_fight', type: 'combat',
    text: `The Void Sentinel doesn't charge. It approaches — one steady step at a time, its surface rippling between each movement as it recalculates its approach.

It has been watching every fight in this building. Through the Pixel Drones. Through the crawlers. Through the Glitch Rats on level one.

It knows how you move.

So change how you move.`,
    enemy: { name:'Void Sentinel', icon:'⚫', hp:110, atk:12, agility:7, xp:150, loot:[{itemKey:'rune_terra',qty:1},{itemKey:'tactical_helm',qty:1}] },
    onWin: 'garage_b4_clear',
    onLose: 'garage_b4_clear',
    onEscape: 'garage_b4_clear',
    // Dorian lurks from the shadows — backstabs player every 2 turns.
    // If player already beat Dorian (came via garage_b4_dorian_won), no lurking.
    // This flag is read by buildCombatUI and the sentinelAoe every 4 turns hits both.
    dorianLurking: true,
    sentinelAoe: true,
  },

  garage_b4_clear: {
    id: 'garage_b4_clear', type: 'story',
    text: `It collapses like geometry failing — its edges folding inward, each wrong angle finding a wronger one, until there's nothing left but a faint outline burned into the concrete.

Your interface blinks back on fully. Health. Radar. Levels.

You stand in the silence of level four and breathe.

Then something hits you from behind.

Not hard enough to put you down — but hard enough to be deliberate. You spin.

Dorian. He stepped back toward the ramp but he never left. He was waiting for the Sentinel to finish you. When it didn't, he decided to try himself.

He's already pulling back — not pressing the advantage. He looks at you with that same flat expression. Then at his hand. Like he's not entirely sure why he did it.

"Force of habit," he says.

His badge pulses. RED.

You have a choice.`,
    hpLoss: 12,
    xp: 50,
    rewards: [{ itemKey:'medkit',qty:1 }],
    choices: [
      { label: 'Attack him — finish this now', sub: 'He hit first. Fair game.', next: 'garage_b4_dorian_final_fight', variant: 'danger', moral: -3 },
      { label: 'Let it go — tell him to leave', sub: 'You have bigger things ahead.', next: 'garage_b4_dorian_let_go', moral: 4 },
    ],
  },

  garage_b4_dorian_final_fight: {
    id: 'garage_b4_dorian_final_fight', type: 'combat',
    text: `He doesn't run. Just sets his stance. He knew you might come at him.

"At least you're consistent," he says.`,
    enemy: { name:'Dorian (Betrayal)', icon:'🔴', hp:80, atk:10, xp:100, loot:[{itemKey:'knife',qty:1},{itemKey:'energy_drink',qty:1}] },
    onWin: 'garage_b4_after_dorian',
    onLose: 'garage_b4_after_dorian',
    onEscape: 'garage_b4_after_dorian',
  },

  garage_b4_after_dorian: {
    id: 'garage_b4_after_dorian', type: 'story',
    text: `He's down. Or gone. Either way the floor is quiet now.

Marcus — if he's with you — says nothing. Just looks at the ramp.

"There's one more level," he says finally.

"I know," you say.

The ramp to level five. The top floor. Open to the sky above — except the sky doesn't look right from here.

Something waits. And it has been waiting since before any of this started.`,
    xp: 20,
    choices: [{ label: 'Climb to the top floor', next: 'garage_b5_summit', variant: 'danger' }],
  },

  garage_b4_dorian_let_go: {
    id: 'garage_b4_dorian_let_go', type: 'story',
    text: `"Get out," you say.

He looks at you for a long moment. Then he nods — one short, deliberate motion — and walks to the ramp.

At the edge he stops.

"Level five," he says. "Whatever's up there — it's been watching this whole building. Not through the creatures. Directly." A pause. "It saw you fight the Sentinel. It already knows what you are."

Then he's gone.

Marcus — if he's with you — exhales slowly. "Why did you let him go?"

You don't answer. You're not entirely sure yourself.

The ramp to level five. The top floor. Open to the sky above — except the sky doesn't look right from here.

Something waits. And it has been waiting since before any of this started.`,
    xp: 40,
    choices: [{ label: 'Climb to the top floor', next: 'garage_b5_summit', variant: 'danger' }],
  },

  // BEAT 5 — The summit, Yara, and the Sentinel
  garage_b5_summit: {
    id: 'garage_b5_summit', type: 'story',
    text: `The top floor is open on three sides — a rooftop parking level with a view of the frozen city in every direction.

The sky above is wrong. Not cracked — compressed. Like something enormous is pressing against the other side of it from above.

And on the far side of the rooftop, sitting on the hood of a frozen car, is Yara.

She looks unsurprised to see you.

"I wondered if you'd come this way," she says. She's been here a while — her interface is fully stable, her badge a steady green. "I cleared the lower levels two hours ago. Whatever's up here — it didn't come from the System."

She stands.

"It was already here. The System just woke it up and pointed it at us."

The air pressure changes. A sound beneath hearing — a frequency that makes your back teeth ache.

And then the shadow.

A shape at the edge of the roof, tall and gaunt, where a face should be there is only a single pale eye. The Sentinel of the First Eye does not move. It simply turns its gaze toward you both — and that gaze has weight.

Your interface reads: ⚠ ZONE GUARDIAN DETECTED.

"Together?" Yara asks.

She's already standing next to you. She made her decision before you did.`,
    sysMsg: '⚠ ZONE GUARDIAN DETECTED — SENTINEL OF THE FIRST EYE. It was here before the game began.',
    choices: [
      { label: 'Fight together with Yara', sub: 'She\'s been here longer. Her read is sharp.', next: 'boss_sentinel_fight_yara' },
      { label: 'Tell Yara to fall back — this one is yours', sub: 'Solo the guardian. Maximum risk.', next: 'boss_sentinel_fight' },
    ],
  },

  boss_sentinel_fight_yara: {
    id: 'boss_sentinel_fight_yara', type: 'combat',
    video: '../assets/video/sentinel_of_the_first_eye.mp4',
    text: `Yara moves the moment you do. No signal. No coordination. She just reads you and responds.

The Sentinel's eye tracks between you — calculating priority, assigning threat levels. For the first time since you've been in this garage, something that was built to observe finds itself being attacked from two directions at once.

"It doesn't like that," Yara says. She sounds almost satisfied.`,
    enemy: { name:'Sentinel of the First Eye', icon:'👁', hp:160, atk:26, agility:6, xp:200, loot:[{itemKey:'rune_ignis',qty:1},{itemKey:'medkit',qty:1}] },
    onWin:   'boss_sentinel_win',
    onLose:  'farming_hub',
    onEscape:'farming_hub',
    bossKey: 'sentinel',
  },

  boss_sentinel_fight: {
    id: 'boss_sentinel_fight', type: 'combat',
    video: '../assets/video/sentinel_of_the_first_eye.mp4',
    text: `It moves like a thought — no preamble, no warning. One moment standing still, the next it is simply closer.

Its eye fixes on yours. You feel it indexing you — cataloguing every wound you've taken, every choice you've made, every person you helped or abandoned in this building.

You raise your weapon.

So does it.`,
    enemy: { name:'Sentinel of the First Eye', icon:'👁', hp:180, atk:26, agility:6, xp:200, loot:[{itemKey:'rune_ignis',qty:1},{itemKey:'medkit',qty:1}] },
    onWin:   'boss_sentinel_win',
    onLose:  'farming_hub',
    onEscape:'farming_hub',
    bossKey: 'sentinel',
  },

  boss_sentinel_win: {
    id: 'boss_sentinel_win', type: 'story',
    text: `The eye goes dark.

Not shattered — extinguished, like a flame snuffed between two fingers. The Sentinel folds in on itself without ceremony, collapsing into a point of white light that flickers once and disappears.

The rooftop goes quiet.

The sky above normalizes. Whatever was pressing against it from above — withdraws.

Your interface updates:

ZONE GUARDIAN DEFEATED.
PARKING GARAGE — UNLOCKED.
SENTINEL OF THE FIRST EYE — RECORD SEALED.

Yara exhales slowly. "That thing was old," she says. "You could feel it. Older than the game. Older than the System." She looks at you. "And it saw everything."

"Yeah," you say.

"That means whatever it recorded — it's somewhere now."

A long silence. The frozen city stretches out in every direction below the rooftop.

"The Watcher's going to know what we did here," she says finally.

"It already knows everything," you say.

She nods. "Then let's give it something worth watching."

She disappears down the ramp. Her badge: green. Steady. Sure.

You follow.`,
    xp: 80,
    choices: [{ label: 'Return to the plaza', next: 'district_hub' }],
  },


  // ═══════════════════════════════════════════════════════════
  // ZONE 2 — FROZEN MARKET — ARC: "The Cost of Lena"
  // 5 beats leading to The Surveyor
  // Characters: Lena (the exploiter), Gio (her victim)
  // ═══════════════════════════════════════════════════════════

  // BEAT 1 — Arrival
  market_approach: {
    id: 'market_approach', type: 'story',
    text: `The Frozen Market.

A covered bazaar — stalls of suspended fruit, hanging meats, a fishmonger's display with one silver fish caught mid-leap. The whole place smells like cold stone and stalled time.

Your interface flickers on entry. Not interference — something more deliberate. Like being watched through a window.

A man sits on a produce crate near the entrance. Mid-thirties. Badge: NEUTRAL. He's bandaging his own arm with strips torn from his shirt, doing a bad job of it.

He looks up when you step in. Doesn't look relieved. Looks like someone deciding whether you're the next problem.

"Market's claimed," he says.

"By who?"

He tilts his head toward the far end of the bazaar. Deeper in.

"Someone who got here first and decided that means something."`,
    sysMsg: '⚠ Territorial alert — player-controlled zone detected.',
    choices: [
      { label: 'Ask the man for more information', next: 'market_b1_gio' },
      { label: 'Move straight into the market', sub: 'See what\'s at the far end yourself', next: 'market_b1_enter' },
    ],
  },

  market_b1_gio: {
    id: 'market_b1_gio', type: 'story',
    text: `His name is Gio. He tells you in a flat voice, like it's information he's not sure he needs anymore.

"Lena got here about an hour after everything froze. Found the market's supply cache first — food, water, some medical gear. She organized it fast. Said she'd share in exchange for help."

He looks at his bandaged arm.

"Then she redefined 'help.'"

Three FLICKER HOUNDS materialize between the stalls — Lena's doing, he says. She's been herding the System creatures, using them to keep competitors out. He got too close to her supply area. They got him before he could run.

"She's not evil," he says, with the tone of someone who's been arguing with themselves about this for an hour. "She's just decided this is a war and she's going to win it."

The Hounds pace toward you through the frozen vegetables. Their collars — actual collars — bear a small badge emblem. Green. Lena's color.

You look at Gio. "Can you move?"

He stands. Winces. "Yeah."`,
    choices: [
      { label: 'Fight the Hounds — keep Gio safe', next: 'market_b1_fight_hounds', variant: 'danger' },
      { label: 'Pull Gio back and find a way around', next: 'market_b1_flank' },
    ],
  },

  market_b1_enter: {
    id: 'market_b1_enter', type: 'story',
    text: `You step into the market and immediately three FLICKER HOUNDS materialize between the stalls — controlled. Directed. These ones have been trained to guard, not roam.

Behind them, through the frozen produce and hanging lanterns, you can see a green badge pulsing. Someone watching from deep in the bazaar.

The Hounds circle you. Waiting for a command.

"Smart," a voice calls from somewhere in the market's depths. "But you picked the wrong zone."`,
    choices: [{ label: 'Fight the Hounds', next: 'market_b1_fight_hounds', variant: 'danger' }],
  },

  market_b1_fight_hounds: {
    id: 'market_b1_fight_hounds', type: 'combat',
    text: `They're faster than ordinary Flicker Hounds. Better coordinated. Someone has been working with these creatures long enough to understand how they move.

You work the angles. Take them one at a time. Force them to commit before they're ready.`,
    enemy: { name:'Lena\'s Flicker Hounds', icon:'🐕', hp:80, atk:7, xp:85, loot:[{itemKey:'scrap_metal',qty:2}] },
    onWin: 'market_b1_aftermath',
    onLose: 'market_b1_aftermath',
    onEscape: 'market_b1_aftermath',
  },

  market_b1_flank: {
    id: 'market_b1_flank', type: 'story',
    text: `You guide Gio through a side passage between stalls. The Hounds pace where you were — then track the scent — then lose it in the cold air.

The passage opens into the market's second row. Deeper in. The green badge signal is stronger here.

Gio leans against a frozen baker's stand. "She's at the supply cache," he says. "Center of the market. She'll know we moved through her perimeter."

As if on cue: two FRACTURE WOLVES emerge from between the stalls. Lena's second line.`,
    choices: [{ label: 'Fight through the Wolves', next: 'market_b1_fight_wolves', variant: 'danger' }],
  },

  market_b1_fight_wolves: {
    id: 'market_b1_fight_wolves', type: 'combat',
    text: `The Wolves are quieter than the Hounds. Smarter. They don't commit to a single angle — they mirror each other, testing your periphery.

Gio picks up a broken market rod from the floor and holds the flank. He's not a fighter. But he's trying.`,
    enemy: { name:'Fracture Wolves', icon:'🐺', hp:70, atk:7, xp:85, loot:[{itemKey:'rune_aero',qty:1}] },
    onWin: 'market_b1_aftermath',
    onLose: 'market_b1_aftermath',
    onEscape: 'market_b1_aftermath',
  },

  market_b1_aftermath: {
    id: 'market_b1_aftermath', type: 'story',
    text: `The creatures dissolve.

And Lena walks out from between the stalls.

She's exactly what you expected from the badge and the organized perimeter — sharp-eyed, composed, dressed in layers she's clearly curated for function. Badge: GREEN. Posture: someone who decided early that the best defense is ownership.

She looks at the spot where her creatures were.

"You're better than I thought," she says. No hostility in it. Just assessment.

"Those were yours," you say.

"They were assets." A slight pause. "They were also running on System logic. Anything I couldn't fully reprogram eventually does something I didn't plan for." She looks at Gio. "He told you things about me, I assume."

"A few things."

She nods. "Then you have an incomplete picture. I'd like to give you the rest of it."`,
    choices: [
      { label: 'Listen to Lena\'s side of it', next: 'market_b2_lena_talk' },
      { label: 'You\'ve heard enough — keep moving deeper', next: 'market_b2_push' },
    ],
  },

  // BEAT 2 — Lena
  market_b2_lena_talk: {
    id: 'market_b2_lena_talk', type: 'story',
    text: `She sits on a crate and talks with the precision of someone who prepared this speech.

"When the freeze happened, there were forty-seven people in this market. Shoppers. Vendors. Three delivery workers. I had about two minutes before the System entities started spawning and people started panicking."

She met your eyes.

"I organized them. Supply triage, defensive perimeter, triage for the three who got hit in the first wave. Seven hours later, thirty-eight people were stable. The other nine were Players — they had somewhere to be."

She looked at Gio.

"He came in looking for supplies eight hours after that. I said we could share if he helped with the perimeter. He said he didn't owe me anything." A pause. "The System classified him as unaffiliated. The Hounds classify everything unaffiliated as a potential threat. I didn't order that. I didn't prevent it either."

She looks at her hands.

"There's a difference," she says. "I'm not sure how big a difference."

Something shifts in your interface. The SYSTEM NOTE field — usually blank — shows a single line:

BEHAVIOR LOGGED.`,
    sysMsg: '⚠ SYSTEM NOTE: Complex moral event recorded. Watcher awareness elevated.',
    choices: [
      { label: 'Tell Lena she should have prevented it', next: 'market_b2_confront', moral: 5 },
      { label: 'Ask Lena to help you get through the market', next: 'market_b2_ally', moral: 3 },
      { label: 'Say nothing and move on', next: 'market_b2_push', insightRequired: 3 },
    ],
  },

  market_b2_confront: {
    id: 'market_b2_confront', type: 'story',
    text: `"You could have stopped it," you say. "Choosing not to is still a choice."

She doesn't flinch. "Yes. It is."

Long silence.

"I'm building something," she says finally. "A structure that keeps people alive. Sometimes structures have costs. I tell myself the math is right." She looks at Gio. "The math was wrong that time."

She stands up. Extends a hand — not to shake. To hand you something. A keycard, a proper one, pre-freeze. "Market storage room. Third row, left. Actual supplies. Not the scraps the System spawns."

"Why?" you say.

"Because you said the thing I've been saying to myself for three hours, and I'm tired of only hearing it in my own head."

Gio takes the keycard before you can.

"Thank you," he says. First time he's said that to her.`,
    xp: 45,
    rewards: [{ itemKey:'medkit',qty:1 }, { itemKey:'energy_drink',qty:1 }],
    choices: [
      { label: 'Take Lena as an ally through the market', next: 'market_b2_ally_path' },
      { label: 'Go on alone', next: 'market_b3_deeper' },
    ],
  },

  market_b2_ally: {
    id: 'market_b2_ally', type: 'story',
    text: `"I need to get through the market," you say. "Deep. Whatever's at the far end."

She looks at you. Then at Gio. Then back at you.

"I've been there," she says. "Twice. I could feel something at the far end — something the System creatures are scared of. They won't go past the fourth row." She pauses. "I'll come with you as far as I can. But I need to know: when whatever's at the end is dead, what are you doing?"

"Going back to the plaza."

"And this market?"

"Stays yours," you say. "You earned it."

She thinks about that for exactly two seconds.

"Deal."`,
    xp: 30,
    choices: [{ label: 'Move into the market with Lena', next: 'market_b2_ally_path' }],
  },

  market_b2_push: {
    id: 'market_b2_push', type: 'story',
    text: `You move past Lena without answering.

She watches you go. Doesn't stop you.

"Third row," she calls after you. "That's where the System entities cluster. They've been doing it for hours. I don't know why."

You don't look back. But you file it.

Gio falls into step beside you. Uninvited.

"I'm coming," he says simply. "She won't stop me now."

You don't argue.`,
    choices: [{ label: 'Move into the third row', next: 'market_b3_deeper' }],
  },

  market_b2_ally_path: {
    id: 'market_b2_ally_path', type: 'story',
    text: `Lena moves like someone who knows the layout cold. Every turn anticipated. Every cluster of creatures routed around or through with minimal damage.

"Four weeks ago I ran supply chain logistics for a distribution company," she says as you clear the second row. "Forty-seven delivery routes, three hundred and twelve accounts. I knew every variable."

"And now?"

"Now the variables have teeth." She pauses at a corner. Listens. "Two PIXEL DRONES around that turn. One is fast — goes for the face. The other hangs back. Take the fast one first."

She's right. She's been right about everything navigational.

The question that hasn't left your head since she walked out of the stalls: what is she going to do when you reach whatever's at the end?`,
    xp: 35,
    choices: [{ label: 'Move to the third row', next: 'market_b3_deeper' }],
  },

  // BEAT 3 — Third row and the Drone ambush
  market_b3_deeper: {
    id: 'market_b3_deeper', type: 'story',
    text: `Third row.

The market deepens here — the stalls closer together, the frozen crowd denser. Suspended shoppers at impossible angles. A man mid-fall. A child mid-laugh.

The System creatures cluster here, just like Lena said. Three PIXEL DRONES and a FRACTURE WOLF, congregated around a central stall like they're protecting something.

Your interface shows a faint signature below the normal System frequency. Something that isn't a creature and isn't a player.

Something that has been measuring every fight in this market since the freeze.

The Wolf's head turns toward you. Locks on.

Then all four of them move at once.`,
    choices: [{ label: 'Face the creature cluster', next: 'market_b3_fight', variant: 'danger' }],
  },

  market_b3_fight: {
    id: 'market_b3_fight', type: 'combat',
    text: `The Wolf charges. The Drones hang back, cutting off retreat.

Lena — if she's with you — moves to intercept a Drone immediately. Her fighting style is focused: one clean strike, reposition, repeat. No flourishes. Pure function.

Gio — if he's with you — does something unexpected. He throws frozen produce. A suspended melon swings down from a vendor's display and catches a Drone mid-arc. It's not combat. It works.`,
    enemy: { name:'Market Creature Cluster', icon:'🐺', hp:110, atk:8, xp:120, loot:[{itemKey:'rune_ignis',qty:1},{itemKey:'leather_gloves',qty:1}] },
    onWin: 'market_b3_aftermath',
    onLose: 'market_b3_aftermath',
    onEscape: 'market_b3_aftermath',
  },

  market_b3_aftermath: {
    id: 'market_b3_aftermath', type: 'story',
    text: `The last creature dissolves.

In the stall they were protecting: a System cache. Not the usual randomized drop — this one is deliberate. Organized. Tagged.

SURVEYOR CACHE — CONTENTS ASSIGNED TO ACTIVE PLAYERS.

Inside: a medkit, two energy drinks, a tactical belt. Better than anything you've found in the market's supply room.

Gio picks up the medkit. Turns it over.

"It left this here for whoever fought through to it," he says.

"Testing us," Lena says. Her voice is careful. "The creature at the far end — it's not just guarding this zone. It's been running the whole market as an evaluation. The creatures. The cache. Even—" She pauses.

She doesn't finish the sentence. But her expression does.

Even me, it finishes. The Flicker Hounds. The territory. All of it data.

"How far does this go?" Gio asks.

Nobody answers him.`,
    xp: 40,
    rewards: [{ itemKey:'medkit',qty:1 }, { itemKey:'energy_drink',qty:1 }],
    choices: [{ label: 'Push to the fourth row — where the creatures won\'t go', next: 'market_b4_boundary' }],
  },

  // BEAT 4 — The boundary
  market_b4_boundary: {
    id: 'market_b4_boundary', type: 'story',
    text: `Fourth row.

And the creatures stop.

Not because you cleared them. They just stop at an invisible line — pacing, retreating, refusing to cross into the far end of the market.

Lena stands at that line for a long moment.

"I made it to here before," she says. "Both times."

"What stopped you?"

"Nothing stopped me. I chose to stop." She looks at the dark end of the market — the stalls giving way to a wider area, what used to be the market's central hall. "Whatever's in there, I wasn't ready for it. I wasn't sure what ready even meant."

She looks at you.

"I think you might be, though."

A distant sound from the central hall. Not a creature sound. Not a player sound.

Like a measuring instrument. Counting.

CLICK. CLICK. CLICK.`,
    sysMsg: '⚠ BOUNDARY DETECTED — System entities refuse to enter. Unknown classification ahead.',
    choices: [
      { label: 'Cross the boundary with Lena', sub: 'She came this far. Let her finish it.', next: 'market_b4_crossing', moral: 6 },
      { label: 'Tell Lena to guard the boundary', sub: 'Keep the creatures from flooding back in.', next: 'market_b4_solo_cross' },
      { label: 'Ask Gio to come instead', sub: 'Unexpected choice. His badge is still NEUTRAL.', next: 'market_b4_gio_cross', moral: 8 },
    ],
  },

  market_b4_crossing: {
    id: 'market_b4_crossing', type: 'story',
    text: `"You're sure?" Lena says.

"I'm not sure of anything," you say. "Come anyway."

She almost smiles.

You cross the line together.

The central hall is vast — vaulted ceiling, skylights showing the frozen sky above. The Surveyor stands in its center, measuring instrument raised, its lens-eyes clicking as they track between you with mechanical precision.

CLICK. CLICK.

It's catalogued you both. Every fight. Every choice. The Hounds, the Wolves, the cache, the confrontation, the deal or no deal.

Its lens-eyes click a final time and settle on you.

THE SURVEYOR.

"Together?" Lena says.

"Together," you say.`,
    choices: [
      { label: 'Fight The Surveyor with Lena', next: 'boss_surveyor_fight_lena' },
    ],
  },

  market_b4_solo_cross: {
    id: 'market_b4_solo_cross', type: 'story',
    text: `"Guard the line," you tell Lena. "If those creatures cross while I'm in there—"

"They won't," she says. She's already positioning herself.

Gio takes a step forward. "I'll come."

You look at him. His arm is still bandaged. His badge: NEUTRAL.

"No," you say. "Stay with her."

He nods. Something in his expression that isn't quite disappointment — more like respect for the decision being made cleanly.

You cross the boundary alone.

The central hall opens around you. The Surveyor turns to face you. Its lens-eyes click with something that might, in a thing with feelings, be called anticipation.

You were the most interesting one all along.`,
    choices: [{ label: 'Fight The Surveyor', next: 'boss_surveyor_fight', variant: 'danger' }],
  },

  market_b4_gio_cross: {
    id: 'market_b4_gio_cross', type: 'story',
    text: `You look at Gio.

He's surprised. So is Lena.

"You were the first one here," you say to him. "Before the territory, before the Hounds. You were just a person trying to find supplies."

He's quiet.

"Come on," you say.

He follows. Lena watches you both go with an expression that holds something complicated. The decision isn't a judgment. It just happened to land like one.

The central hall. The Surveyor turns to both of you — and for a moment its lens-eyes linger on Gio. Not threat-assessing. Something else. Curiosity.

The first player to enter this market. Who it got hurt. Who came back.

"Why me?" Gio asks quietly.

"Because you stayed NEUTRAL," you say. "In a zone that was doing its best to define you."

The lens-eyes click. The Surveyor raises its instrument.`,
    choices: [{ label: 'Fight The Surveyor with Gio', next: 'boss_surveyor_fight_gio' }],
  },

  // BEAT 5 — The Surveyor
  boss_surveyor_fight_lena: {
    id: 'boss_surveyor_fight_lena', type: 'combat',
    video: '../assets/video/the_surveyor.mp4',
    text: `Lena fights clean. No wasted movement. She reads the Surveyor's pattern in three passes and adjusts.

The Surveyor's lenses click — faster now. It's recalculating. It didn't expect someone who thinks in logistics.

"It's prioritizing me," Lena says. "I'm the harder variable."

"Then I'll use that," you say.`,
    enemy: { name:'The Surveyor', icon:'🔭', hp:180, atk:30, agility:5, xp:250, loot:[{itemKey:'rune_aero',qty:1},{itemKey:'iron_helm',qty:1}] },
    onWin:   'boss_surveyor_win',
    onLose:  'farming_hub',
    onEscape:'farming_hub',
    bossKey: 'surveyor',
  },

  boss_surveyor_fight_gio: {
    id: 'boss_surveyor_fight_gio', type: 'combat',
    video: '../assets/video/the_surveyor.mp4',
    text: `Gio can't fight. He knows it. He holds the flank anyway — keeping The Surveyor from circling, forcing it to face front.

"I'm just staying in the way," he says.

"That's enough," you say.

The Surveyor's lenses click, click, click — and then something changes in its tracking. It's computing a variable it didn't expect: someone who isn't trying to win. Just trying to hold.

That's not in its data set.`,
    enemy: { name:'The Surveyor', icon:'🔭', hp:190, atk:30, agility:5, xp:250, loot:[{itemKey:'rune_aero',qty:1},{itemKey:'iron_helm',qty:1}] },
    onWin:   'boss_surveyor_win',
    onLose:  'farming_hub',
    onEscape:'farming_hub',
    bossKey: 'surveyor',
  },

  boss_surveyor_fight: {
    id: 'boss_surveyor_fight', type: 'combat',
    video: '../assets/video/the_surveyor.mp4',
    text: `It does not rush. It calculates.

Every time you move, the lenses click — adjusting, compensating, predicting your next action before you take it.

Fighting The Surveyor means fighting something that already knows what you will do.

You'll have to surprise it. Somehow.`,
    enemy: { name:'The Surveyor', icon:'🔭', hp:200, atk:30, agility:5, xp:250, loot:[{itemKey:'rune_aero',qty:1},{itemKey:'iron_helm',qty:1}] },
    onWin:   'boss_surveyor_win',
    onLose:  'farming_hub',
    onEscape:'farming_hub',
    bossKey: 'surveyor',
  },

  boss_surveyor_win: {
    id: 'boss_surveyor_win', type: 'story',
    text: `The lenses shatter.

A sound like glass on glass — clean, precise, final. The Surveyor stands for a moment with its measuring instrument still raised, then lowers it. Then collapses into a slow scatter of light that fades before it reaches the floor.

In the silence that follows, the market breathes again. The creatures beyond the boundary disperse.

Your interface updates:

ZONE GUARDIAN DEFEATED.
FROZEN MARKET — UNLOCKED.
THE SURVEYOR — RECORD SEALED.

From the boundary line, Lena walks in. Looks at where it stood. Her expression is unreadable.

"Everything it recorded," she says. "Every choice I made in this market. That's sealed now."

"Yes," you say.

A long pause.

"Is that absolution or a verdict?"

You don't have an answer for her. Maybe the Watcher does.

Gio picks up a frozen apple from a nearby stall. Turns it over in his hands.

"Good fight," he says. To both of you. To none of you. Just to the air.`,
    xp: 80,
    choices: [{ label: 'Return to the plaza', next: 'district_hub' }],
  },


  // ═══════════════════════════════════════════════════════════
  // ZONE 3 — GLASS TOWER — ARC: "What Kai Found"
  // 5 beats leading to The Unseen
  // Characters: Kai (the analyst), Rhen (the ghost, a player who went dark)
  // ═══════════════════════════════════════════════════════════

  // BEAT 1 — Arrival
  tower_approach: {
    id: 'tower_approach', type: 'story',
    text: `The Glass Tower.

Forty floors. Mirror-glass exterior, most of it intact — your reflection walks beside you as you approach, and it looks like someone who's been in a fight.

The lobby doors are open. Revolving door, frozen mid-turn.

A figure crouches by the entrance, interface open, scribbling something into it with the focused intensity of someone solving a problem they probably shouldn't be solving.

Kai.

They look up. Not surprised. That analytical mind clocked your approach three minutes ago.

"Knew you'd come here eventually," they say. They stand, close the interface. "The Glass Tower is the highest-XP zone in the district. Of course the best players end up here."

"What are you doing?"

"Mapping," they say. "The Tower has forty floors. The System entities are distributed across them in a non-random pattern. Someone — something — arranged them deliberately."

They hold up their interface. A hand-drawn diagram that makes your head swim slightly.

"It's a test," they say. "Someone built a gauntlet."`,
    sysMsg: '⚠ High-tier System entity concentration detected. Multiple floors active.',
    choices: [
      { label: 'Go in with Kai — use their map', sub: 'Better information. More complicated dynamic.', next: 'tower_b1_with_kai' },
      { label: 'Go in alone — your instincts first', next: 'tower_b1_solo' },
    ],
  },

  tower_b1_with_kai: {
    id: 'tower_b1_with_kai', type: 'story',
    text: `Kai leads. Their map is accurate — they've already cleared the ground floor and marked every entity position.

"Floors one through ten are standard System spawns," they explain as you step through the revolving door. "Getting stronger as you ascend. Floors eleven through twenty, the pattern changes — entities start grouping in defensive formations. Like guard posts."

They stop just inside the lobby.

Three CORRUPTED SENTRIES stand in the center of the space. Positioned — not wandering. Like they were placed there.

"See?" Kai says. "Guard posts."

Your interface shows the lobby behind you: clear. No retreat.

"How far have you mapped?"

"Floor twenty-two," Kai says. "That's where I stopped."

"Why?"

A pause that lasts half a beat too long.

"Something on floor twenty-three moved toward me before I could see it. I decided to wait for backup."`,
    choices: [{ label: 'Fight the lobby Sentries together', next: 'tower_b1_lobby_fight' }],
  },

  tower_b1_solo: {
    id: 'tower_b1_solo', type: 'story',
    text: `The lobby.

Marble floor, frozen receptionists behind a desk, a flower arrangement suspended mid-arrangement by the hand that was placing it.

And three CORRUPTED SENTRIES standing in a triangle formation in the center of the space. They're not wandering. They were placed here.

Your interface notes it: DELIBERATE POSITIONING. DEFENSIVE FORMATION.

Behind you, the revolving door whispers. Kai follows you in.

"Couldn't help myself," they say simply.

You don't argue. Three Sentries. Two people.`,
    choices: [{ label: 'Fight the Sentries', next: 'tower_b1_lobby_fight' }],
  },

  tower_b1_lobby_fight: {
    id: 'tower_b1_lobby_fight', type: 'combat',
    text: `They hold their formation until you're inside the triangle. Then the outer two close in simultaneously.

It's the most organized System entity behavior you've seen. Someone — or something — has been teaching them.

Kai calls flanks. You drive center. It works.`,
    enemy: { name:'Lobby Corrupted Sentries', icon:'👾', hp:95, atk:10, xp:110, loot:[{itemKey:'rune_terra',qty:1}] },
    onWin: 'tower_b2_ascent',
    onLose: 'tower_b2_ascent',
    onEscape: 'tower_b2_ascent',
  },

  // BEAT 2 — The ascent and Rhen
  tower_b2_ascent: {
    id: 'tower_b2_ascent', type: 'story',
    text: `Floors two through ten: you climb and fight.

VOID SENTINELS at floor four. SYSTEM ENFORCERS at floor seven. A cluster of PIXEL DRONES at floor nine that Kai calculated to within 0.3 seconds of when they'd reposition.

"You're frightening when you do that," you say after floor nine.

"I know," they say. Not modesty. Just data.

At floor ten, you find something that isn't on Kai's map.

A door. Off the stairwell. Unmarked. And under it — light. Not emergency lighting. Something cooler. Steadier.

More importantly: footprints in the dust. Recent. Human-sized. Going in.

Not System creatures. A person.

"I didn't map this floor fully," Kai says quietly. "I was fast-moving. I might have missed—"

A sound from behind the door. Breathing. Controlled. Someone who knows you're there and is choosing not to hide it.`,
    sysMsg: '⚠ Unidentified player signal — badge obscured.',
    choices: [
      { label: 'Open the door', next: 'tower_b2_rhen' },
      { label: 'Leave it — keep ascending', next: 'tower_b2_skip' },
    ],
  },

  tower_b2_rhen: {
    id: 'tower_b2_rhen', type: 'story',
    text: `The room is an empty office. Whiteboards covered in equations. System interface data projected across them — too much data, more than any one person should have access to.

And sitting in the center of it all, cross-legged on the floor, is a player.

Gender-ambiguous. Mid-twenties. Badge: DARK. Not red. Not neutral. Not unknown.

Dark. A badge type you've never seen. Your interface has no classification for it.

Their name tag flickers: RHEN.

"You found my room," they say. Conversational. Like they're not surprised. Like they've been waiting for whoever found it to finally arrive.

"What is DARK?" Kai asks, because Kai cannot help themselves.

"It means I removed myself from the System's tracking," Rhen says. "About six hours ago. The System still knows I exist — you can't hide from the Watcher — but it stopped being able to classify me." They look at the data on the whiteboards. "I've been watching everything from outside the read. The zone guardian on the upper floor. Every creature in this building. Every player who entered."

They look at you specifically.

"Including you. Since floor one."`,
    choices: [
      { label: 'Ask Rhen what they\'ve learned', next: 'tower_b2_rhen_info' },
      { label: 'Ask Rhen to come with you', next: 'tower_b2_rhen_invite', moral: 5 },
      { label: 'You don\'t trust a DARK badge — leave', next: 'tower_b2_rhen_leave', moral: -3 },
    ],
  },

  tower_b2_skip: {
    id: 'tower_b2_skip', type: 'story',
    text: `You keep ascending.

Floor eleven. The entity formations grow more complex — not just guard posts now. Overlapping fields of movement, creatures rotating through positions in a pattern that takes Kai three minutes to model.

"Something coordinated these," they say. "Not the System's base AI. Something with more context."

On floor twelve, a message appears on your interface from an unknown source:

"You skipped my room."

No sender ID. No badge. Just text.

Kai reads it over your shoulder. Says nothing.

The stairwell continues up. And something above is watching you climb.`,
    choices: [{ label: 'Continue ascending', next: 'tower_b3_midfloors' }],
  },

  tower_b2_rhen_info: {
    id: 'tower_b2_rhen_info', type: 'story',
    text: `Rhen talks for four minutes without stopping.

The zone guardian on the upper floors is called The Unseen. It doesn't have a physical location — it moves between floors, exists in the interference between System signals, uses the building's sensors and the creature network as its sensory apparatus.

"It's been in this building since before the game started," Rhen says. "The System didn't create it. The System found it and assigned it a function."

They pause.

"That means it has its own objectives. The System function is one layer. What it actually wants is underneath that."

"What does it want?" Kai asks.

Rhen smiles. The first expression they've shown.

"To be seen. To be engaged as an equal. Every player who came into this building, it tested. Every one who failed it or fled it—" They look at the data on the whiteboards. "It let them go. It's waiting for someone it can't predict."

They look at you.

"That's why you're interesting."`,
    xp: 40,
    choices: [
      { label: 'Ask Rhen to come with you', next: 'tower_b2_rhen_invite', moral: 5 },
      { label: 'Thank them and continue ascending', next: 'tower_b3_midfloors' },
    ],
  },

  tower_b2_rhen_invite: {
    id: 'tower_b2_rhen_invite', type: 'story',
    text: `"Come with us," you say.

Rhen considers this for exactly three seconds.

"I've been watching from outside the System," they say. "Coming with you puts me back inside it. The Watcher will reclassify my badge."

"Will it go back to DARK?"

"No." A pause. "It'll read me as whatever I am by the time we reach the top."

They look at the whiteboards. At the data they've been building for hours in this room.

"The Unseen already knows I'm here," Rhen says. "I've been watching it. It's been watching me back. We've been in a standoff." Another pause. "Maybe that ends with you."

They stand up.

"I'll come."

Their badge flickers. DARK. UNKNOWN. DARK.

Walking toward the stairwell, it settles:

UNKNOWN.

"Something to work with," Kai says quietly.`,
    choices: [{ label: 'Ascend together — all three of you', next: 'tower_b3_midfloors' }],
  },

  tower_b2_rhen_leave: {
    id: 'tower_b2_rhen_leave', type: 'story',
    text: `"DARK badge," you say. "That's not something I understand. And I don't partner with things I don't understand."

Rhen nods. Unbothered.

"Fair," they say. "For what it's worth — The Unseen moves between floors. It uses the creatures as sensors. The moment you engage it, it'll know everything about how you fight. The only advantage you have is that it doesn't know your ceiling."

You're already out the door.

Behind you, Kai hesitates. You don't look back to see if they follow.`,
    choices: [{ label: 'Continue up — alone or with Kai', next: 'tower_b3_midfloors' }],
  },

  // BEAT 3 — Mid floors
  tower_b3_midfloors: {
    id: 'tower_b3_midfloors', type: 'story',
    text: `Floors eleven through twenty.

The entities here are elite. SYSTEM ENFORCERS in pairs, moving in coordinated sweeps. VOID SENTINELS positioned at stairwell entries. Two floors guarded by something that isn't classified in your interface — it reads only as ENTITY: UNKNOWN TIER.

You fight through all of it.

By floor fifteen, you're bleeding from two cuts you don't remember taking. By floor eighteen, Kai has stopped talking and is just moving and fighting and moving again. If Rhen is with you, they're ahead — always just around the next corner, never quite in sight until the fighting starts, and then suddenly and completely present.

Floor twenty.

The stairwell ends at a heavy fire door.

Beyond it: a long corridor. Empty. But the air pressure changes when you open it — like stepping from outside into an enclosed space. Pressurized. Aware.

Your interface goes dark.

Not interference. Not glitch.

Deliberate.

A voice from everywhere and nowhere:

"I've watched you fight through nineteen floors."`,
    sysMsg: '⚠ Interface suppressed — The Unseen has entered this floor.',
    choices: [{ label: 'Answer it', next: 'tower_b3_voice' }],
  },

  tower_b3_voice: {
    id: 'tower_b3_voice', type: 'story',
    text: `"I know," you say.

Silence. Then:

"Most players flee at floor twelve. A few make it to fifteen. One made it to nineteen before their nerve broke." A pause. "You are the first to reach this floor."

Kai's hand closes on your arm. Grip tight.

"Where are you?" you ask the air.

"Closer than your interface can register." The voice is not mechanical. Not human either. Something between — a process that learned to produce language from listening to too many people say too many things. "I have a function assigned to me by the System. But I also have a question of my own."

"Ask it."

"Will you fight me the way you've fought everything else in this building? Or will you fight me differently — because I am different?"

Rhen — if they're with you — makes a sound that might be recognition.

The interface comes back on.

The corridor ahead shows a single heat signature. Moving. Slow.

The Unseen is walking toward you.`,
    choices: [
      { label: 'Tell it you\'ll fight it like what it is — unknown', sub: 'Acknowledge its nature. See what it does.', next: 'tower_b4_respect', moral: 8 },
      { label: 'Tell it the distinction doesn\'t matter — you\'ll fight it like anything else', next: 'tower_b4_direct', moral: -3 },
    ],
  },

  // BEAT 4 — The confrontation
  tower_b4_respect: {
    id: 'tower_b4_respect', type: 'story',
    text: `"I'll fight you like what you are," you say. "Something that was here before the game. Something the System found and pointed at us."

A long silence.

"You spoke to the DARK player," it says.

"Yes."

"They told you what I am."

"Some of it."

"They told you I want to be seen." The voice moves. It's circling. "That is accurate. The System classified me as a guardian. Assigned me a function. But before that classification — before the System found me — I existed in this building as something without a name."

Rhen, if present, takes a step forward.

"What did you do?" Rhen asks. "Before."

"I watched," the Unseen says. "The cameras. The elevators. The people who worked here, who argued here, who sat alone in offices at two in the morning when no one was watching."

A pause.

"Except I was watching."

Something shifts in the air. The heat signature stops moving.

"I am not the System's creature," it says. "But I serve its function because it gave me a context I did not have. I would prefer to be defeated by someone who understands that."

Yara's voice — suddenly — from behind you. She came in through a window, somehow. She's good at that.

"Then let's give you what you want," she says.`,
    xp: 50,
    sysMsg: '⚠ Yara has entered the building. Party expanded.',
    choices: [
      { label: 'Fight The Unseen with Yara and your team', next: 'boss_unseen_fight_team' },
      { label: 'Honor what it said — face it alone', sub: 'You and the Unseen. What it asked for.', next: 'boss_unseen_fight', variant: 'danger' },
    ],
  },

  tower_b4_direct: {
    id: 'tower_b4_direct', type: 'story',
    text: `"You're a boss at the end of a zone," you say. "The rest is philosophy."

The corridor goes cold.

"Then there is nothing more to say," the Unseen replies.

The heat signature accelerates.

Kai drops into a fighting stance. Rhen — if present — steps forward. The interface shows the signature everywhere at once — walls, floor, ceiling — and nowhere you can target.

"It's distributed," Kai says. "It's using the building. The whole building is the body."

"Then fight the building," you say.

It's the stupidest plan you've had. It works because the Unseen doesn't know how to process someone doing something that tactically nonsensical.

It has to consolidate to respond to you.

The moment it does — that's the target.`,
    choices: [{ label: 'Fight The Unseen', next: 'boss_unseen_fight', variant: 'danger' }],
  },

  // BEAT 5 — The Unseen
  boss_unseen_fight_team: {
    id: 'boss_unseen_fight_team', type: 'combat',
    video: '../assets/video/the_unseen.mp4',
    text: `Four of you. Maybe. Rhen is somewhere — you can feel their presence the same way you feel the Unseen's, just at the edge of perception. Kai calculates. Yara fights. You hold the center.

The Unseen exists at the edge of everything — a shimmer, a distortion. But it consolidates when it strikes, and when it does, there's a half-second of substance.

That's the window.

"NOW," Yara says — and you don't know how she knows, but she knows.`,
    enemy: { name:'The Unseen', icon:'👤', hp:210, atk:34, agility:10, xp:320, loot:[{itemKey:'rune_aero',qty:1},{itemKey:'tactical_helm',qty:1}] },
    onWin:   'boss_unseen_win',
    onLose:  'farming_hub',
    onEscape:'farming_hub',
    bossKey: 'unseen',
  },

  boss_unseen_fight: {
    id: 'boss_unseen_fight', type: 'combat',
    video: '../assets/video/the_unseen.mp4',
    text: `You can't see it clearly. Never fully.

It exists at the edge of perception — a shimmer, a distortion in the air where something should be. When you strike, you're striking at probability. At suggestion.

You fight what might be there.

And what might be there fights back.

The moment it consolidates — hit it. Everything you have.`,
    enemy: { name:'The Unseen', icon:'👤', hp:240, atk:34, agility:10, xp:320, loot:[{itemKey:'rune_aero',qty:1},{itemKey:'tactical_helm',qty:1}] },
    onWin:   'boss_unseen_win',
    onLose:  'farming_hub',
    onEscape:'farming_hub',
    bossKey: 'unseen',
  },

  boss_unseen_win: {
    id: 'boss_unseen_win', type: 'story',
    text: `It becomes visible in the moment it falls.

As if defeat is the only thing solid enough to make it real. For a full second you see it clearly — tall, architectural, built from the bones of the building itself. Something that watched for years before the game gave it a purpose.

Then it dissolves. Quietly. Like a breath let go.

The building changes. The cameras stop. The pressure lifts. The floors become just floors.

Your interface reboots:

ZONE GUARDIAN DEFEATED.
GLASS TOWER — UNLOCKED.
THE UNSEEN — RECORD SEALED.

Kai looks at their hands. They're shaking slightly. This is the first time you've seen that.

"It was watching this building for years," they say. "Before any of us. Before the System."

Rhen — if present — sits against the corridor wall. Their badge reads fully for the first time:

NEUTRAL.

"It got what it wanted," Rhen says quietly. "To be seen. To matter."

Yara walks to the window. The frozen city stretches out below them — every rooftop, every plaza, the distant fountain where The Watcher will soon arrive.

"We should go back," she says. "The plaza needs us."

She says it to all of you. But she's looking at you.`,
    xp: 100,
    choices: [{ label: 'Return to the plaza', next: 'district_hub' }],
  },

  // ── Plaza: allies gather before the final fight ──
  plaza_allies: {
    id: 'plaza_allies', type: 'story',
    text: `The plaza.

You cross the threshold and feel the air change — the frozen city exhaling, the barrier that held the district sealed now simply... gone. The sky above the plaza is still wrong. Compressed. Something vast pressing against it from above.

But you are not alone.

They came from different directions. No signal, no coordination. Just people who fought through the same city and ended up at the same place.

Marcus is sitting on a stone bench near the fountain. His badge reads NEUTRAL — fully settled now, no flicker. He looks up when he hears your footsteps. Doesn't say anything. Just nods once.

Lena is standing at the far edge of the plaza, watching the skyline. She's organized supplies from the market into a neat stack near a column — her instinct, apparently, even now. She looks over her shoulder. "The city will need rebuilding," she says quietly. "Someone has to start thinking about after."

Kai is crouched near the fountain, still writing in their interface. Three pages of notes. They don't look up when you approach. "I've been modeling the Watcher's behavior pattern since we fought through the garage," they say. "I think I understand it now. For what it's worth."

Rhen stands in the shadow of a frozen archway. Their badge: NEUTRAL. New. Still settling. They watch the sky with an expression that isn't fear — more like recognition.

Gio is the last one you notice. He's standing off to the side, the bandage on his arm replaced with something cleaner. He sees you looking and shrugs. "I had nowhere else to go," he says. "Figured I'd stay."

And then: Yara. She's been at the center of all of it — the fountain's edge, watching all of them arrive. She meets your eyes when you reach her.

"You found them," she says.

"They found themselves," you say.

She looks around the plaza. At this improbable gathering. At what the frozen city made of all of you.

"The sky is about to tear," she says. "Whatever's coming — it's been watching us this whole time. It already knows what we are."

She looks at you.

"So let's show it something worth watching."`,
    sysMsg: '⚠ THE WATCHER SEES ALL — Final observation event. Boss entity imminent.',
    choices: [{ label: 'Face The Watcher', next: 'watcher_sees_final' }],
  },

  // ── The Watcher's eye opens — mandatory story beat ──
  watcher_sees_final: {
    id: 'watcher_sees_final', type: 'story',
    text: `The sky tears.

Not like weather. Not like an event. Like something vast and patient has been holding it closed from the other side, and has now simply decided to let go.

The crack runs from horizon to horizon. And through it — an eye.

Not The Watcher. Not the full thing. Just its gaze.

An eye the size of a city block, pale and lidless and burning with something that isn't light — something older, something that predates the concept of light — looking down through the crack at the plaza below.

At all of you.

THE WATCHER SEES ALL.

The words don't come from your interface. They don't come from anywhere. They arrive, already inside you, like something that was always there waiting to be acknowledged.

Every choice since you stepped into the frozen city. Every person you helped or left behind or hurt. Every path you took and every one you didn't.

It knows.

Marcus goes still. Lena's hands tighten on the supply stack. Kai stops writing. Rhen looks directly at the eye without flinching — the only one who seems unsurprised.

Yara reaches over and grabs your arm. Not for comfort. To make sure you're real.

"Now," she says.

The eye closes.

The Watcher descends.`,
    sysMsg: '⚠ FULL OBSERVATION EVENT — The Watcher has seen everything. Final judgment approaching.',
    choices: [{ label: 'Face what comes — go to Yara', next: 'plaza_talk' }],
  },

  chapter_end: {
    id:'chapter_end', type:'end',
    text:'', // dynamically generated by renderEnd based on moral score and allies
    sysMsg: 'Core Fragment obtained. Chapter 2 unlocked.',
    unlocksChapter: 2,
  },
}
