// zone-wind.js — Aero | Glass Atrium | Boss: The Stormborn
export default {

  zone_wind: {
    id: 'zone_wind', type: 'story',
    text: `The glass atrium. Sixty meters long, roof caved on the west end. The crossdraft created by the breach has been running since and set up a permanent wind through the space. It carries the smell of real outside.

The wind zone is where the draft is strongest — the air pressure makes a sound like a long held note.

Your interface: ELEMENTAL ZONE — AERO. Resonance check: Flow-Arcane alignment detected.

An abandoned pack mid-zone — clearly dropped in a hurry. Beside it: a note. "Couldn't carry it anymore. Hope whoever finds this needs it more."

AERO SKILL TREE — UNLOCKED.`,
    xp: 120,
    choices: [
      { label: 'Take the pack. Carry it out.', sub: 'Reduces mobility — resource gain. You honor the intent.', next: 'zone_wind_carry' },
      { label: 'Leave it. Move clean.', next: 'zone_wind_unlock' },
    ],
  },

  zone_wind_carry: {
    id: 'zone_wind_carry', type: 'story',
    text: `The pack is heavier than it looked. The crossdraft fights you the whole way. You get through — slower than you'd like.

AERO TREE UNLOCKED. AERO BINDING: +2 actions per round before enemy acts. Crit rate +10%. Mobility abilities −15% AP.`,
    xp: 80, rewards: [{ itemKey: 'rune_aero', qty: 2 }, { itemKey: 'stabilizer_pack', qty: 1 }],
    choices: [{ label: 'Push deeper into the atrium', next: 'zone_wind_explore_1' }],
  },

  zone_wind_unlock: {
    id: 'zone_wind_unlock', type: 'story',
    text: `You leave the pack. Move clean through the second half.

AERO TREE UNLOCKED. AERO BINDING: +2 actions per round before enemy acts. Crit rate +10%. Mobility abilities −15% AP.

The crossdraft smells like rain that hasn't arrived yet.`,
    xp: 50, rewards: [{ itemKey: 'rune_aero', qty: 2 }],
    choices: [{ label: 'Push deeper into the atrium', next: 'zone_wind_explore_1' }],
  },

  zone_wind_explore_1: {
    id: 'zone_wind_explore_1', type: 'story',
    text: `The atrium's main body. The crossdraft is intense enough here to push you sideways if you're not careful. Display cases along the walls have been emptied — by the wind, not people.

A Wind Wisp moves at ceiling height — a compressed air elemental the size of a large bird, moving in tight circles. It drops when it detects you, diving fast.`,
    xp: 40,
    choices: [
      { label: 'Fight the Wind Wisp', next: 'zone_wind_enemy_1' },
      { label: 'Use the crossdraft to redirect it — make it miss', sub: 'Speed check — costs a turn but it overshoots', next: 'zone_wind_redirect' },
    ],
  },

  zone_wind_redirect: {
    id: 'zone_wind_redirect', type: 'story',
    text: `You step into the strongest part of the crossdraft at the right moment. The Wisp dives — and overshoots, caught by the draft and carried past you into the far wall.

It recovers but you're already positioned better.`,
    xp: 50,
    choices: [{ label: 'Fight the disoriented Wisp', next: 'zone_wind_enemy_1b' }],
  },

  zone_wind_enemy_1: {
    id: 'zone_wind_enemy_1', type: 'combat',
    text: `The Wind Wisp dives — fast, erratic, hitting from every angle.`,
    enemy: { name: 'Wind Wisp', icon: '💨', hp: 82, atk: 21, def: 5, xp: 92,
      loot: [{ itemKey: 'rune_aero', qty: 1 }] },
    onWin: 'zone_wind_explore_2', onLose: 'zone_wind_explore_1',
  },

  zone_wind_enemy_1b: {
    id: 'zone_wind_enemy_1b', type: 'combat',
    text: `The Wind Wisp recovers from the wall — disoriented, slower than normal.`,
    enemy: { name: 'Disoriented Wind Wisp', icon: '💨', hp: 52, atk: 15, def: 3, xp: 70,
      loot: [{ itemKey: 'rune_aero', qty: 1 }] },
    onWin: 'zone_wind_explore_2', onLose: 'zone_wind_explore_1',
  },

  zone_wind_explore_2: {
    id: 'zone_wind_explore_2', type: 'story',
    text: `The anchor store entrance at the atrium's center. The automatic doors are locked open, wind cycling through the space they create.

A compact aero formation sits in the door frame itself — the wind has built it there, layer by layer, over days. Dense. Accessible if you reach through the strongest part of the draft.

On a bench nearby: a folded map weighted down with a chunk of concrete. Someone left this deliberately.`,
    xp: 60,
    choices: [
      { label: 'Reach through the draft and harvest the formation', sub: 'Knockback risk — costs HP', next: 'zone_wind_harvest' },
      { label: 'Take the map', next: 'zone_wind_map' },
      { label: 'Leave both and continue', next: 'zone_wind_corridor' },
    ],
  },

  zone_wind_harvest: {
    id: 'zone_wind_harvest', type: 'story',
    text: `The draft is strong enough to push your arm backward as you reach. You brace and push through. The formation releases — your hand comes back full of compressed residue and the knockback sends you into the far wall.

Worth it.`,
    xp: 50, rewards: [{ itemKey: 'rune_aero', qty: 2 }],
    choices: [{ label: 'Continue', next: 'zone_wind_corridor' }],
  },

  zone_wind_map: {
    id: 'zone_wind_map', type: 'story',
    text: `The map shows the atrium's upper structure — including a route along the structural beams above the zone that bypasses the main floor entirely.

You pocket it. Could be useful.`,
    xp: 30, rewards: [{ itemKey: 'district_map', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_wind_corridor' }],
  },

  zone_wind_corridor: {
    id: 'zone_wind_corridor', type: 'story',
    text: `The west end of the atrium. Where the roof is most completely gone and the crossdraft becomes something closer to a gale.

Two Gale Hawks circle in the open air above — large wind elementals in rough bird shape, riding the draft. They descend when you enter the open section.`,
    xp: 40,
    choices: [
      { label: 'Fight the Gale Hawks', next: 'zone_wind_enemy_2' },
      { label: 'Movement at the maintenance balcony — someone hanging', sub: 'A salvager dangling from a rigging line, losing grip.', next: 'zone_wind_salvager' },
    ],
  },

  // ── Side-quest: stranded salvager ────────────────────────────────────
  // Civilian encounter mirroring the Builders pattern in plant/water/earth.
  // Moral choice: cut her down safely (combat with a wind elemental on the
  // way), wait for her to fall, or walk away.
  zone_wind_salvager: {
    id: 'zone_wind_salvager', type: 'story',
    text: `Three stories up on the maintenance balcony, a woman is hanging from a frayed rigging line — one hand around the rope, the other on her harness clip, which is jammed. Her toolkit dangles from her belt and swings hard in the crossdraft. She's not screaming. She's working on the clip.

A Zephyr Wraith — a sharp, narrow wind elemental — is gliding the updraft toward her line. One more pass and it'll cut the rope clean.

She sees you below. Yells over the wind: "Top of the stairs. The pulley. If you can hold it I can climb."`,
    choices: [
      { label: 'Take the stairs, kill the Wraith, hold the pulley', sub: 'Wraith combat — wind hits hard', next: 'zone_wind_salvager_combat' },
      { label: 'Wait. The rope cuts itself eventually.', sub: 'Moral -10', next: 'zone_wind_salvager_loot', moral: -10 },
      { label: 'Back out — the climb is too exposed', sub: 'The System notes this', next: 'zone_wind_enemy_2', allianceTagRepeatable: 'cowardice' },
    ],
  },
  zone_wind_salvager_combat: {
    id: 'zone_wind_salvager_combat', type: 'combat',
    text: `You take the stairs three at a time. The Wraith pivots from the rope to you — better target, closer. It comes in fast and low, cutting the air with edges that aren't quite visible until they're already past you.`,
    enemy: { name: 'Zephyr Wraith', icon: '💨', hp: 100, atk: 18, def: 6, xp: 125,
      loot: [{ itemKey: 'rune_aero', qty: 1 }] },
    onWin: 'zone_wind_salvager_win', onLose: 'zone_wind_enemy_2',
  },
  zone_wind_salvager_win: {
    id: 'zone_wind_salvager_win', type: 'story',
    text: `The Wraith breaks apart into a hard gust that flattens against the far wall. You brace on the pulley. She climbs in fifteen seconds — fast, deliberate, no wasted movement.

On the balcony she unhooks the toolkit and hands you a section of it without ceremony. "Climbing rigging. Pre-collapse spec. Worth more than you'd think." She rolls her shoulder, tests the joint. "Thanks. I owe you."

She heads back down the stairs at a measured pace.`,
    rewards: [{ itemKey: 'rune_aero', qty: 1 }, { itemKey: 'district_map', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_wind_midpoint', moral: 10, allianceTagRepeatable: 'civilian_helped' }],
  },
  zone_wind_salvager_loot: {
    id: 'zone_wind_salvager_loot', type: 'story',
    text: `You step back behind the doorframe. It takes longer than you expected. She works at the clip almost the entire way down. The Wraith makes one more pass and the line parts.

She lands on rubble three floors below. Her toolkit comes apart on impact. You wait for the Wraith to drift away before going down to collect the pieces.

The rigging is still good. So is most of the kit.`,
    rewards: [{ itemKey: 'rune_aero', qty: 2 }, { itemKey: 'district_map', qty: 1 }, { itemKey: 'scrap_metal', qty: 2 }],
    choices: [{ label: 'Continue', next: 'zone_wind_midpoint' }],
  },

  zone_wind_enemy_2: {
    id: 'zone_wind_enemy_2', type: 'combat',
    text: `Both Gale Hawks dive simultaneously — hitting hard from above, using the wind as cover.`,
    enemy: { name: 'Gale Hawk Pair', icon: '💨', hp: 155, atk: 23, def: 7, xp: 145,
      loot: [{ itemKey: 'rune_aero', qty: 1 }, { itemKey: 'scrap_metal', qty: 1 }] },
    onWin: 'zone_wind_midpoint', onLose: 'zone_wind_corridor',
  },

  zone_wind_midpoint: {
    id: 'zone_wind_midpoint', type: 'story',
    text: `The open section. The crossdraft is a gale here — you have to lean into it to stay in place.

A Storm Sentinel hovers at the breach in the roof — large, composed of multiple compressed aero formations, holding the entire crossdraft in something like equilibrium. It notices you the way weather notices an obstacle.

Your interface: ZONE GUARDIAN PROXIMITY DETECTED.`,
    xp: 80,
    choices: [
      { label: 'Fight the Storm Sentinel', next: 'zone_wind_enemy_3' },
      { label: 'Use the structural beam route — go above it', next: 'zone_wind_boss_approach' },
    ],
  },

  zone_wind_enemy_3: {
    id: 'zone_wind_enemy_3', type: 'combat',
    text: `The Storm Sentinel descends — the gale intensifying as it drops toward you.`,
    enemy: { name: 'Storm Sentinel', icon: '💨', hp: 235, atk: 26, def: 9, xp: 220,
      loot: [{ itemKey: 'rune_aero', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }] },
    onWin: 'zone_wind_cache', onLose: 'zone_wind_midpoint',
  },

  zone_wind_cache: {
    id: 'zone_wind_cache', type: 'story',
    text: `The Storm Sentinel disperses — the gale dropping by half in an instant.

Where it was: a compressed aero formation and supplies caught in the draft.

Through the breach, the sky is visible. Real sky.`,
    xp: 60, rewards: [{ itemKey: 'rune_aero', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Face what\'s through the breach', next: 'zone_wind_boss_approach' }],
  },

  zone_wind_boss_approach: {
    id: 'zone_wind_boss_approach', type: 'story',
    text: `Through the breach in the roof. Or at the breach. Or descending through it.

Your interface: ZONE GUARDIAN DETECTED.

The Stormborn.

White and silver-blue, part feather, part cloud, part motion. Dragon-shaped but never quite landing on a shape — always between forms. Its wings create the crossdraft that's been running through this atrium since the roof caved.

It was here first. This is its space.

It banks once across the length of the atrium, eyeing you, then turns.`,
    choices: [{ label: 'Fight The Stormborn', sub: 'Zone guardian — defeat to claim Aero', next: 'zone_wind_boss' }],
  },

  zone_wind_boss: {
    id: 'zone_wind_boss', type: 'boss',
    text: `The Stormborn never lands. It attacks from above, from the sides, from angles that require you to keep moving.`,
    enemy: { name: 'The Stormborn', icon: '💨', hp: 460, atk: 42, def: 20, xp: 320,
      img: '../assets/boss/boss_wind.webp', loot: [{ itemKey: 'rune_aero', qty: 2 }] },
    bossKey: 'zone_boss_wind',
    onWin: 'zone_wind_boss_win', onLose: 'zone_wind_boss_approach',
  },

  zone_wind_boss_win: {
    id: 'zone_wind_boss_win', type: 'story',
    text: `The Stormborn rises — ascending back through the breach, becoming harder to distinguish from the actual clouds. Then gone. Or gone somewhere you can't follow.

The gale settles. A breeze remains — gentler.

Real sky through the breach.

Your interface: AERO ZONE — FULLY CLAIMED. Aero resonance locked.

A rune falls from above and lands at your feet.`,
    xp: 80, rewards: [{ itemKey: 'rune_aero', qty: 1 }],
    choices: [{ label: 'Return to the district', next: 'district_hub' }],
  },

}
