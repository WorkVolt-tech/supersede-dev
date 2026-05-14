// zone-lightning.js — Volt | Electronics Hub | Boss: The Fractured Arc
export default {

  zone_lightning: {
    id: 'zone_lightning', type: 'story',
    text: `The electronics hub. Every screen is on — actual channels, actual content, as if the world outside is still broadcasting. The back of the store is where the air changes — arcs of electricity move between server racks. Not dangerous. Close.

Your interface: ELEMENTAL ZONE — VOLT. Resonance check: Flow alignment detected.

A live power junction at the zone's core. Another player is already here — working on it. They look up. "I almost have it. Two minutes and we split the unlock."

They mean it. They're not lying.

VOLT SKILL TREE — UNLOCKED.`,
    xp: 120,
    choices: [
      { label: 'Wait. Let them finish. Split it.', sub: 'Moral +10.', next: 'zone_lightning_wait', moral: 10 },
      { label: 'Channel through the junction yourself now.', sub: 'Faster — releases a pulse hurting district players.', next: 'zone_lightning_pulse', moral: -10 },
      { label: 'Discharge it safely through yourself.', sub: 'Costs 20% max HP — they get nothing.', next: 'zone_lightning_unlock' },
    ],
  },

  zone_lightning_wait: {
    id: 'zone_lightning_wait', type: 'story',
    text: `Two minutes. They finish. The junction opens cleanly. They nod once. "Good call." Then they leave.

VOLT TREE UNLOCKED. VOLT BINDING: Attacks after skipping a turn +30% damage. First action each round +25% crit. Physical resist −10%.`,
    xp: 100, rewards: [{ itemKey: 'rune_volt', qty: 2 }],
    choices: [{ label: 'Push deeper into the hub', next: 'zone_lightning_explore_1' }],
  },

  zone_lightning_pulse: {
    id: 'zone_lightning_pulse', type: 'story',
    text: `You push them aside and activate it yourself. The path opens instantly. A pulse rolls outward through the district's electrical infrastructure.

The other player stares at you. Then walks out.

VOLT TREE UNLOCKED. VOLT BINDING: Attacks after skipping a turn +30% damage. First action each round +25% crit. Physical resist −10%.

One of the screens has gone dark.`,
    xp: 80, rewards: [{ itemKey: 'rune_volt', qty: 2 }],
    choices: [{ label: 'Push deeper into the hub', next: 'zone_lightning_explore_1' }],
  },

  zone_lightning_unlock: {
    id: 'zone_lightning_unlock', type: 'story',
    text: `You discharge it through yourself. The jolt drops your HP. The other player gets nothing.

They look at you. Not angry. Just reading you. Then leave without a word.

VOLT TREE UNLOCKED. VOLT BINDING: Attacks after skipping a turn +30% damage. First action each round +25% crit. Physical resist −10%.`,
    xp: 50, rewards: [{ itemKey: 'rune_volt', qty: 2 }],
    choices: [{ label: 'Push deeper into the hub', next: 'zone_lightning_explore_1' }],
  },

  zone_lightning_explore_1: {
    id: 'zone_lightning_explore_1', type: 'story',
    text: `The main floor. Every display unit still running, drawing power from somewhere. The arcs of electricity have grown here — moving between shelving units, occasionally jumping to the ceiling.

An Arc Spawn drifts through the display aisle — a condensed knot of electrical discharge that's achieved enough coherence to move intentionally. It targets the highest conductivity in the room.

That's you.`,
    xp: 40,
    choices: [
      { label: 'Fight the Arc Spawn', next: 'zone_lightning_enemy_1' },
      { label: 'Use a display unit as a ground — draw it into the electronics', sub: 'Costs a turn but weakens it first', next: 'zone_lightning_ground' },
      { label: 'Someone\'s in the back room — Hunter scouts tapping the power grid', sub: 'Voss\'s people. Confront them.', next: 'zone_lightning_hunters' },
    ],
  },

  zone_lightning_ground: {
    id: 'zone_lightning_ground', type: 'story',
    text: `You grab a display unit and create a more attractive ground path. The Arc Spawn lurches toward it — discharging partially into the electronics. You hear the screens in that section blow.

It's weakened. Now fight it.`,
    xp: 40,
    choices: [{ label: 'Fight the weakened Arc Spawn', next: 'zone_lightning_enemy_1b' }],
  },

  zone_lightning_enemy_1: {
    id: 'zone_lightning_enemy_1', type: 'combat',
    text: `The Arc Spawn crackles toward you — erratic, fast, dangerous.`,
    enemy: { name: 'Arc Spawn', icon: '⚡', hp: 88, atk: 20, def: 5, xp: 95,
      loot: [{ itemKey: 'rune_volt', qty: 1 }] },
    onWin: 'zone_lightning_explore_2', onLose: 'zone_lightning_explore_1',
  },

  zone_lightning_enemy_1b: {
    id: 'zone_lightning_enemy_1b', type: 'combat',
    text: `The Arc Spawn is partially discharged — still dangerous but diminished.`,
    enemy: { name: 'Weakened Arc Spawn', icon: '⚡', hp: 55, atk: 15, def: 4, xp: 75,
      loot: [{ itemKey: 'rune_volt', qty: 1 }] },
    onWin: 'zone_lightning_explore_2', onLose: 'zone_lightning_explore_1',
  },

  zone_lightning_explore_2: {
    id: 'zone_lightning_explore_2', type: 'story',
    text: `The server room. Still running — all of it — drawing enormous power from somewhere below. The temperature in here is kept artificially cold by cooling systems that are still functional.

A rack in the corner is different from the others. The housing has cracked and something has grown inside — a volt elemental formation, crystalline, pulsing.

Your interface: VOLT RESIDUE NODE — Extractable. Warning: high discharge on contact.

On a workbench: an insulated tool bag, left by whoever was maintaining this equipment.`,
    xp: 60,
    choices: [
      { label: 'Extract the volt residue node', sub: 'High discharge — costs HP', next: 'zone_lightning_extract' },
      { label: 'Take the insulated tool bag', next: 'zone_lightning_tools' },
      { label: 'Leave both and continue', next: 'zone_lightning_corridor' },
    ],
  },

  zone_lightning_extract: {
    id: 'zone_lightning_extract', type: 'story',
    text: `Contact. The discharge runs through you — painful, disorienting. You hold on. The node collapses into three compressed rune units in your hand.

Your hair is standing on end. Your HP is down. Worth it.`,
    xp: 50, rewards: [{ itemKey: 'rune_volt', qty: 2 }],
    choices: [{ label: 'Continue', next: 'zone_lightning_corridor' }],
  },

  zone_lightning_tools: {
    id: 'zone_lightning_tools', type: 'story',
    text: `The bag has insulated gloves and a voltage meter. The gloves will help with the electrical hazards ahead.`,
    xp: 30, rewards: [{ itemKey: 'stabilizer_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_lightning_corridor' }],
  },

  zone_lightning_corridor: {
    id: 'zone_lightning_corridor', type: 'story',
    text: `The back corridor leading to the broadcast section. The arcs are constant here — floor to ceiling, ceiling to floor, regular intervals. Timed. Learnable.

A Chain Elemental moves through them — it's synchronized with the arc pattern, passing through them without triggering. It detects you as something that doesn't belong in the pattern.`,
    xp: 40,
    choices: [{ label: 'Fight the Chain Elemental', next: 'zone_lightning_enemy_2' }],
  },

  zone_lightning_enemy_2: {
    id: 'zone_lightning_enemy_2', type: 'combat',
    text: `The Chain Elemental moves in bursts — fast between arcs, striking in the gaps.`,
    enemy: { name: 'Chain Elemental', icon: '⚡', hp: 155, atk: 22, def: 8, xp: 145,
      loot: [{ itemKey: 'rune_volt', qty: 1 }, { itemKey: 'scrap_metal', qty: 1 }] },
    onWin: 'zone_lightning_midpoint', onLose: 'zone_lightning_corridor',
  },

  zone_lightning_midpoint: {
    id: 'zone_lightning_midpoint', type: 'story',
    text: `The dead broadcast studio. Chairs still arranged. Cameras still pointed at a desk. Every light blown — except what's coming from the far end.

A Storm Node floats at center-stage. Your interface reads it as a pre-boss elemental formation — highly charged, territory-sensitive.

Behind it: a sealed fire door. Through it: the sound of something that doesn't generate sound the way living things do.

Your interface: ZONE GUARDIAN PROXIMITY DETECTED.`,
    xp: 80,
    choices: [
      { label: 'Fight the Storm Node', next: 'zone_lightning_enemy_3' },
      { label: 'Go around — take the production booth route', next: 'zone_lightning_boss_approach' },
    ],
  },

  zone_lightning_enemy_3: {
    id: 'zone_lightning_enemy_3', type: 'combat',
    text: `The Storm Node expands as you approach — pulling arcs from across the room toward itself.`,
    enemy: { name: 'Storm Node', icon: '⚡', hp: 240, atk: 28, def: 10, xp: 220,
      loot: [{ itemKey: 'rune_volt', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }] },
    onWin: 'zone_lightning_cache', onLose: 'zone_lightning_midpoint',
  },

  zone_lightning_cache: {
    id: 'zone_lightning_cache', type: 'story',
    text: `The Storm Node collapses — discharging outward in a final pulse that scorches the studio chairs.

Where it stood: a compressed elemental cache. Runes and a med pack.

You take them, then push through the fire door.`,
    xp: 60, rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'rune_volt', qty: 1 }],
    choices: [{ label: 'Enter the broadcast room', next: 'zone_lightning_boss_approach' }],
  },

  zone_lightning_boss_approach: {
    id: 'zone_lightning_boss_approach', type: 'story',
    text: `The main broadcast room. The projection screen is running — white light, no image. Every surface crackles.

Your interface: ZONE GUARDIAN DETECTED.

The Fractured Arc.

It doesn't walk in. It arrives — already there, was always there, became visible between one heartbeat and the next. Spiked violet plating shedding lightning from both fists like water from a wet cloth.

It tilts its head. Three ceiling tiles arc.

It doesn't wait for you to be ready.`,
    choices: [{ label: 'Fight The Fractured Arc', sub: 'Zone guardian — defeat to claim Volt', next: 'zone_lightning_boss' }],
  },

  zone_lightning_boss: {
    id: 'zone_lightning_boss', type: 'boss',
    text: `The Fractured Arc moves before you finish thinking about moving.`,
    enemy: { name: 'The Fractured Arc', icon: '⚡', hp: 480, atk: 46, def: 18, xp: 320,
      img: '../assets/boss/boss_lightning.webp', loot: [{ itemKey: 'rune_volt', qty: 2 }] },
    bossKey: 'zone_boss_lightning',
    onWin: 'zone_lightning_boss_win', onLose: 'zone_lightning_boss_approach',
  },

  zone_lightning_boss_win: {
    id: 'zone_lightning_boss_win', type: 'story',
    text: `It fractures — the plating splitting along every seam simultaneously, the lightning inside releasing outward in a single controlled burst that somehow doesn't hit you.

Plates on the floor of a dead broadcast studio.

The room is very quiet.

Your interface: VOLT ZONE — FULLY CLAIMED. Volt resonance locked.

A rune crackles on the floor among the wreckage.`,
    xp: 80, rewards: [{ itemKey: 'rune_volt', qty: 1 }],
    choices: [{ label: 'Return to the district', next: 'district_hub' }],
  },

  // ── Hunter Scout encounter (humanoid — triggers spare/execute prompt on win)
  zone_lightning_hunters: {
    id: 'zone_lightning_hunters', type: 'combat',
    text: `Two Hunters working a tap into the back-room power conduit — illegal, dangerous, and worth a fortune in salvaged current. They're so focused they don't hear you until the conduit sparks. Then they turn, hands already on weapons.`,
    enemy: {
      name: 'Hunter Scout Pair', icon: '🗡️',
      hp: 100, atk: 23, def: 7, xp: 130,
      humanoid: true,
      loot: [{ itemKey: 'flashlight', qty: 2 }, { itemKey: 'scrap_metal', qty: 1 }],
      executeLoot: [{ itemKey: 'energy_drink', qty: 2 }],
    },
    onWin: 'zone_lightning_explore_2', onLose: 'zone_lightning_explore_1',
  },

}
