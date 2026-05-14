// zone-fire.js — Ignis | Kitchen Supply Store | Boss: The Ashen King
export default {

  zone_fire: {
    id: 'zone_fire', type: 'story',
    text: `The kitchen supply store still smells like copper and char. The fire came through here hard — shelves warped, glass melted into the floor in strange shapes, a row of copper pots that are now abstract sculpture.

A door at the back, slightly warm to the touch. No lock. When you push it open, the air changes — not hot, charged. Like something powerful at rest.

Your interface: ELEMENTAL ZONE — IGNIS. Resonance check: Offense alignment detected.

Inside: a narrow corridor of hanging fire that doesn't burn. Near the entrance, a wounded player — no faction colors, barely conscious. They look up at you. Just watch.

IGNIS SKILL TREE — UNLOCKED.`,
    xp: 120,
    choices: [
      { label: 'Give them a med pack before going further', sub: 'Moral +10', next: 'zone_fire_help', moral: 10 },
      { label: 'Break the glass cache and move on', sub: 'Full supplies. Moral -5.', next: 'zone_fire_break', moral: -5 },
      { label: 'Take the long path. Leave both.', sub: 'Costs your health.', next: 'zone_fire_unlock' },
    ],
  },

  zone_fire_help: {
    id: 'zone_fire_help', type: 'story',
    text: `You leave the med pack beside them. They take it without a word.

You take the long path. The scored walls cost you.

IGNIS TREE UNLOCKED. IGNIS BINDING: Strike damage +15%. Regen −20%.

"Consistency detected."`,
    xp: 100, rewards: [{ itemKey: 'rune_ignis', qty: 2 }],
    choices: [{ label: 'Push deeper into the store', next: 'zone_fire_explore_1' }],
  },

  zone_fire_break: {
    id: 'zone_fire_break', type: 'story',
    text: `Two strikes. The glass breaks. You take everything and move.

Behind you, the wounded player has pulled themselves to the wall. Watching.

IGNIS TREE UNLOCKED. IGNIS BINDING: Strike damage +15%. Regen −20%.`,
    xp: 80, rewards: [{ itemKey: 'rune_ignis', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Push deeper into the store', next: 'zone_fire_explore_1' }],
  },

  zone_fire_unlock: {
    id: 'zone_fire_unlock', type: 'story',
    text: `The long path costs you. Residual heat, scored walls, everything harder than expected.

IGNIS TREE UNLOCKED. IGNIS BINDING: Strike damage +15%. Regen −20%.`,
    xp: 50, rewards: [{ itemKey: 'rune_ignis', qty: 2 }],
    choices: [{ label: 'Push deeper into the store', next: 'zone_fire_explore_1' }],
  },

  zone_fire_explore_1: {
    id: 'zone_fire_explore_1', type: 'story',
    text: `The main floor. Overhead lighting gone — replaced by bioluminescent fire running along the shelving. Not burning. Just existing. Ten degrees warmer than the rest of the district.

Something moves between the shelves. Not fast. Not subtle. A Char Hound — what used to be an inventory drone, now running on absorbed elemental residue. It tracks heat.

It finds yours.`,
    xp: 40,
    choices: [
      { label: 'Fight the Char Hound', next: 'zone_fire_enemy_1' },
      { label: 'Try to slip past — you track cold', sub: 'Costs HP if you fail', next: 'zone_fire_slip_1' },
      { label: 'Movement by the back exit — Hunter scouts working the zone', sub: 'Voss\'s people. Confront them.', next: 'zone_fire_hunters' },
    ],
  },

  zone_fire_slip_1: {
    id: 'zone_fire_slip_1', type: 'story',
    text: `You move low and slow along the far wall. The Char Hound turns toward you once. Pauses. Moves away. You're through — barely.`,
    xp: 30,
    choices: [{ label: 'Continue', next: 'zone_fire_explore_2' }],
  },

  zone_fire_enemy_1: {
    id: 'zone_fire_enemy_1', type: 'combat',
    text: `The Char Hound lunges — fast, low, heat trailing.`,
    enemy: { name: 'Char Hound', icon: '🔥', hp: 90, atk: 18, def: 6, xp: 95,
      loot: [{ itemKey: 'rune_ignis', qty: 1 }] },
    onWin: 'zone_fire_explore_2', onLose: 'zone_fire_explore_1',
  },

  zone_fire_explore_2: {
    id: 'zone_fire_explore_2', type: 'story',
    text: `The stockroom. Shelving half-melted into the floor. A fire elemental sprite — barely visible, fist-sized — hovers near a collapsed display. Non-hostile unless provoked. It watches you.

On the far wall, a note taped to the emergency exit: "Back corridor is clear. Loading bay is not. Something big is back there."

Someone added in different handwriting: "Don't fight it. Just don't."`,
    xp: 60,
    choices: [
      { label: 'Harvest the elemental sprite for a rune', sub: 'Moral -5', next: 'zone_fire_harvest', moral: -5 },
      { label: 'Leave it alone and continue', next: 'zone_fire_corridor' },
    ],
  },

  zone_fire_harvest: {
    id: 'zone_fire_harvest', type: 'story',
    text: `You reach for the sprite. It flares — hot enough to sting — then collapses into a residue crystal in your palm.

The room is a few degrees cooler now. You notice it immediately.`,
    xp: 40, rewards: [{ itemKey: 'rune_ignis', qty: 1 }],
    choices: [{ label: 'Continue to the corridor', next: 'zone_fire_corridor' }],
  },

  zone_fire_corridor: {
    id: 'zone_fire_corridor', type: 'story',
    text: `The back corridor. Narrow, ceiling low. Fire runs along the old sprinkler system overhead — colonized, repurposed.

Two Slag Drones block the path. Former warehouse equipment, now running on heat-conversion engines. They're already oriented toward you.`,
    xp: 40,
    choices: [
      { label: 'Fight both Slag Drones', next: 'zone_fire_enemy_2' },
      { label: 'Blow the pipe overhead — drop fire on them', sub: 'Damages both but burns you too', next: 'zone_fire_pipe' },
    ],
  },

  zone_fire_pipe: {
    id: 'zone_fire_pipe', type: 'story',
    text: `You hit the pipe coupling. The pressurized system vents downward — a burst that catches both drones. One goes down. The other staggers, damaged but functional. The burst caught your arm. You're singed.`,
    xp: 50,
    choices: [{ label: 'Finish the second drone', next: 'zone_fire_enemy_2b' }],
  },

  zone_fire_enemy_2: {
    id: 'zone_fire_enemy_2', type: 'combat',
    text: `Both Slag Drones close in simultaneously.`,
    enemy: { name: 'Slag Drone Pair', icon: '🔥', hp: 145, atk: 20, def: 10, xp: 135,
      loot: [{ itemKey: 'scrap_metal', qty: 2 }] },
    onWin: 'zone_fire_midpoint', onLose: 'zone_fire_corridor',
  },

  zone_fire_enemy_2b: {
    id: 'zone_fire_enemy_2b', type: 'combat',
    text: `The surviving Slag Drone is damaged but still dangerous.`,
    enemy: { name: 'Damaged Slag Drone', icon: '🔥', hp: 72, atk: 16, def: 6, xp: 80,
      loot: [{ itemKey: 'scrap_metal', qty: 1 }] },
    onWin: 'zone_fire_midpoint', onLose: 'zone_fire_corridor',
  },

  zone_fire_midpoint: {
    id: 'zone_fire_midpoint', type: 'story',
    text: `A receiving area. Still intact — crates, a forklift, a functioning overhead light.

In the center: an Ignis Construct. Larger than the drones. Different. It faces the far wall — not guarding, not patrolling. Waiting.

Your interface: IGNIS CONSTRUCT — Advanced elemental unit. Territorial. Non-aggressive beyond 4 meters.

To its left: a sealed cache. To its right: the door to the loading bay. You can see it from here.

Your interface: ZONE GUARDIAN PROXIMITY DETECTED.`,
    xp: 80,
    choices: [
      { label: 'Fight the Ignis Construct and take the cache', next: 'zone_fire_enemy_3' },
      { label: 'Slip past and go straight for the loading bay', sub: 'Skip the fight', next: 'zone_fire_boss_approach' },
    ],
  },

  zone_fire_enemy_3: {
    id: 'zone_fire_enemy_3', type: 'combat',
    text: `The Ignis Construct detects your approach and turns. Its core ignites.`,
    enemy: { name: 'Ignis Construct', icon: '🔥', hp: 225, atk: 26, def: 14, xp: 210,
      loot: [{ itemKey: 'rune_ignis', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }] },
    onWin: 'zone_fire_cache', onLose: 'zone_fire_midpoint',
  },

  zone_fire_cache: {
    id: 'zone_fire_cache', type: 'story',
    text: `The Construct collapses. Its core dims slowly — a dying ember.

The sealed cache holds real supplies. Someone stashed this here before the zone formed.

You take what you need and face the loading bay door.`,
    xp: 60, rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'rune_ignis', qty: 1 }],
    choices: [{ label: 'Enter the loading bay', next: 'zone_fire_boss_approach' }],
  },

  zone_fire_boss_approach: {
    id: 'zone_fire_boss_approach', type: 'story',
    text: `The loading bay. Shelving collapsed. Freight door warped open by heat from inside.

Your interface: ZONE GUARDIAN DETECTED.

It emerges slowly. Not because it's cautious — because it doesn't need to hurry.

The Ashen King.

Twelve feet of black plate armor cracked through with lava veins. A molten cleaver that was part of the building before it became a weapon. Sealed helm — two thin seams of orange light where eyes would be.

It sets the cleaver down. The shelving shakes. Then picks it back up.

The note said don't. You're here anyway.`,
    choices: [{ label: 'Fight The Ashen King', sub: 'Zone guardian — defeat to claim Ignis', next: 'zone_fire_boss' }],
  },

  zone_fire_boss: {
    id: 'zone_fire_boss', type: 'boss',
    text: `The Ashen King doesn't speak. It raises the cleaver and the temperature spikes.`,
    enemy: { name: 'The Ashen King', icon: '🔥', hp: 580, atk: 38, def: 22, xp: 320,
      img: '../assets/boss/boss_fire.webp', loot: [{ itemKey: 'rune_ignis', qty: 2 }] },
    bossKey: 'zone_boss_fire',
    onWin: 'zone_fire_boss_win', onLose: 'zone_fire_boss_approach',
  },

  zone_fire_boss_win: {
    id: 'zone_fire_boss_win', type: 'story',
    text: `The Ashen King folds inward. The lava veins go dark from outside in. The cleaver cracks clean through when it hits the floor.

Rubble. Stone. Nothing that was ever alive.

The temperature drops back to normal over thirty seconds.

Your interface: IGNIS ZONE — FULLY CLAIMED. Ignis resonance locked.

A rune sits in the rubble where it stood.`,
    xp: 80, rewards: [{ itemKey: 'rune_ignis', qty: 1 }],
    choices: [{ label: 'Return to the district', next: 'district_hub' }],
  },

  // ── Hunter Scout encounter (humanoid — triggers spare/execute prompt on win)
  zone_fire_hunters: {
    id: 'zone_fire_hunters', type: 'combat',
    text: `Two Hunters — Voss's people, geared for solo work, here for whatever they can carry out. They see you. The taller one swears, draws.`,
    enemy: {
      name: 'Hunter Scout Pair', icon: '🗡️',
      hp: 110, atk: 22, def: 8, xp: 130,
      humanoid: true,
      loot: [{ itemKey: 'scrap_metal', qty: 2 }, { itemKey: 'energy_drink', qty: 1 }],
      executeLoot: [{ itemKey: 'medkit', qty: 1 }],
    },
    onWin: 'zone_fire_explore_2', onLose: 'zone_fire_explore_1',
  },

}
