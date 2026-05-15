// zone-water.js — Aqua | Food Court Basement | Boss: The Tide Queen
export default {

  zone_water: {
    id: 'zone_water', type: 'story',
    text: `The food court basement is flooded — ankle height, cold, slightly luminescent. The pipes that burst have been burst for longer than they should have been. The water is completely still despite the dripping above.

Your interface: ELEMENTAL ZONE — AQUA. Resonance check: Patience threshold detected.

Midway through: a wedged door, waterlogged, swollen shut. Someone is behind it — you can hear them moving. A shelf above the waterline holds a single dry med pack with a note: "For whoever needs it more than I did."

AQUA SKILL TREE — UNLOCKED.`,
    xp: 120,
    choices: [
      { label: 'Force the door. Get them out.', sub: 'Costs HP — Moral +15.', next: 'zone_water_rescue', moral: 15 },
      { label: 'Take the pack and leave the door.', sub: 'Full resources. Moral -10.', next: 'zone_water_take', moral: -10 },
      { label: 'Leave both. Move forward.', next: 'zone_water_unlock' },
    ],
  },

  zone_water_rescue: {
    id: 'zone_water_rescue', type: 'story',
    text: `It takes four attempts. The survivor — badly shaken — slides out. "I've been in there since yesterday." They follow you through, don't speak, don't get in the way.

AQUA TREE UNLOCKED. AQUA BINDING: 25% damage reduction below 40% HP. AP pool +10%.

A soft ripple moves out from you. Perfect circles, overlapping.`,
    xp: 100, rewards: [{ itemKey: 'rune_aqua', qty: 2 }],
    choices: [{ label: 'Push deeper into the basement', next: 'zone_water_explore_1' }],
  },

  zone_water_take: {
    id: 'zone_water_take', type: 'story',
    text: `You take the pack. The sound behind the door continues for a while. Then stops.

AQUA TREE UNLOCKED. AQUA BINDING: 25% damage reduction below 40% HP. AP pool +10%.

"You hesitate more than expected."`,
    xp: 60, rewards: [{ itemKey: 'rune_aqua', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Push deeper into the basement', next: 'zone_water_explore_1' }],
  },

  zone_water_unlock: {
    id: 'zone_water_unlock', type: 'story',
    text: `You leave both. Move past. A soft ripple moves across the water — out from you, reaching the walls, coming back.

AQUA TREE UNLOCKED. AQUA BINDING: 25% damage reduction below 40% HP. AP pool +10%.`,
    xp: 50, rewards: [{ itemKey: 'rune_aqua', qty: 2 }],
    choices: [{ label: 'Push deeper into the basement', next: 'zone_water_explore_1' }],
  },

  zone_water_explore_1: {
    id: 'zone_water_explore_1', type: 'story',
    text: `Deeper into the basement. The water is thigh-high now, the glow stronger — not light from above but from below, from whatever the water has become.

A Flood Wraith drifts between the submerged support columns. It was probably part of the building's water management system before the zone formed — now it moves like a current that's learned to resent you.

It registers your heat signature and orients.`,
    xp: 40,
    choices: [
      { label: 'Fight the Flood Wraith', next: 'zone_water_enemy_1' },
      { label: 'Submerge and move under it', sub: 'Risky — costs HP but avoids the fight', next: 'zone_water_submerge' },
      { label: 'Voices in the next room — Builders pinned down by elementals', sub: 'Three of Sera\'s people in trouble.', next: 'zone_water_builders' },
    ],
  },

  zone_water_submerge: {
    id: 'zone_water_submerge', type: 'story',
    text: `You drop below the surface and drag yourself along the floor. The cold hits hard. The Wraith passes overhead — you can see its luminescence through the water.

You come up on the far side, gasping, down on HP but through.`,
    xp: 30,
    choices: [{ label: 'Continue', next: 'zone_water_explore_2' }],
  },

  zone_water_enemy_1: {
    id: 'zone_water_enemy_1', type: 'combat',
    text: `The Flood Wraith flows toward you. Fighting in waist-deep water is a different kind of difficult.`,
    enemy: { name: 'Flood Wraith', icon: '💧', hp: 95, atk: 17, def: 8, xp: 100,
      loot: [{ itemKey: 'rune_aqua', qty: 1 }] },
    onWin: 'zone_water_explore_2', onLose: 'zone_water_explore_1',
  },

  zone_water_explore_2: {
    id: 'zone_water_explore_2', type: 'story',
    text: `A flooded storage room. Crates have floated to the ceiling and wedged there. The water here is perfectly transparent — you can see the floor six feet below. Something is down there. Not moving. Just sitting.

Your interface: AQUA RESIDUE NODE — Minor elemental cache. Salvageable.

On a floating crate: a waterproof bag with supplies inside. Someone planned to come back for it.`,
    xp: 60,
    choices: [
      { label: 'Dive for the residue node', sub: 'Costs HP — gains runes', next: 'zone_water_dive' },
      { label: 'Take the bag from the crate', next: 'zone_water_bag' },
      { label: 'Leave both and keep moving', next: 'zone_water_corridor' },
    ],
  },

  zone_water_dive: {
    id: 'zone_water_dive', type: 'story',
    text: `Six feet down in water that's gotten colder. You reach the node — it releases on contact, filling your palm with compressed elemental residue.

You surface, lower on HP than you went in. Worth it.`,
    xp: 50, rewards: [{ itemKey: 'rune_aqua', qty: 2 }],
    choices: [{ label: 'Continue', next: 'zone_water_corridor' }],
  },

  zone_water_bag: {
    id: 'zone_water_bag', type: 'story',
    text: `The bag has emergency rations and a small med pack. Whoever left this was thinking ahead.`,
    xp: 30, rewards: [{ itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_water_corridor' }],
  },

  zone_water_corridor: {
    id: 'zone_water_corridor', type: 'story',
    text: `The main basement corridor. The water reaches your chest now — you're wading more than walking. The luminescence is strong enough here to see clearly.

Two Tide Crawlers move along the ceiling above the waterline — crustacean-shaped elementals that formed in the condensation on the pipes. They drop when they detect you.`,
    xp: 40,
    choices: [{ label: 'Fight the Tide Crawlers', next: 'zone_water_enemy_2' }],
  },

  zone_water_enemy_2: {
    id: 'zone_water_enemy_2', type: 'combat',
    text: `Both Tide Crawlers drop from the pipes simultaneously. Fighting in chest-deep water, moving slowly, they have the advantage.`,
    enemy: { name: 'Tide Crawler Pair', icon: '💧', hp: 150, atk: 19, def: 11, xp: 140,
      loot: [{ itemKey: 'rune_aqua', qty: 1 }, { itemKey: 'scrap_metal', qty: 1 }] },
    onWin: 'zone_water_midpoint', onLose: 'zone_water_corridor',
  },

  zone_water_midpoint: {
    id: 'zone_water_midpoint', type: 'story',
    text: `The basement opens at its far end into a flooded chamber — deeper here, waist height, the water glowing faintly blue-green.

A Deep Construct floats in the center. Larger than the crawlers. Still. Your interface reads it as an advanced elemental — territorial but stationary unless provoked.

Behind it: the entrance to the main chamber where the glow is strongest.

Your interface: ZONE GUARDIAN PROXIMITY DETECTED.`,
    xp: 80,
    choices: [
      { label: 'Fight the Deep Construct', next: 'zone_water_enemy_3' },
      { label: 'Circle around it through the side passage', next: 'zone_water_boss_approach' },
    ],
  },

  zone_water_enemy_3: {
    id: 'zone_water_enemy_3', type: 'combat',
    text: `The Deep Construct registers your proximity and the water around it begins to move.`,
    enemy: { name: 'Deep Construct', icon: '💧', hp: 230, atk: 24, def: 16, xp: 215,
      loot: [{ itemKey: 'rune_aqua', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }] },
    onWin: 'zone_water_cache', onLose: 'zone_water_midpoint',
  },

  zone_water_cache: {
    id: 'zone_water_cache', type: 'story',
    text: `The Construct disperses into the water — becoming indistinguishable from the rest of it.

Behind where it stood: a waterproof cache bolted to the wall. Emergency supplies, sealed tight.

You take what you need.`,
    xp: 60, rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'rune_aqua', qty: 1 }],
    choices: [{ label: 'Enter the main chamber', next: 'zone_water_boss_approach' }],
  },

  zone_water_boss_approach: {
    id: 'zone_water_boss_approach', type: 'story',
    text: `The main chamber. Waist-deep water, glowing blue-green from below. Ceiling low. Room wide.

Your interface: ZONE GUARDIAN DETECTED.

She rises from the center — not surfacing so much as becoming distinct from the water. Coral-crowned, fluid. Every movement a redirect rather than an action.

The Tide Queen.

She looks at you the way water looks at a stone. Patient. Already planning the shape she'll wear around you after enough time.

She raises one hand. The water begins to move.`,
    choices: [{ label: 'Fight The Tide Queen', sub: 'Zone guardian — defeat to claim Aqua', next: 'zone_water_boss' }],
  },

  zone_water_boss: {
    id: 'zone_water_boss', type: 'boss',
    text: `The Tide Queen doesn't attack — she redirects. Every strike you land becomes the next wave.`,
    enemy: { name: 'The Tide Queen', icon: '💧', hp: 540, atk: 32, def: 28, xp: 320,
      img: '../assets/boss/boss_water.webp', loot: [{ itemKey: 'rune_aqua', qty: 2 }] },
    bossKey: 'zone_boss_water',
    onWin: 'zone_water_boss_win', onLose: 'zone_water_boss_approach',
  },

  zone_water_boss_win: {
    id: 'zone_water_boss_win', type: 'story',
    text: `She disperses — becoming the water gradually, the glow fading as she spreads thin. The coral crown sinks. You watch it settle on the bottom.

The water goes still. Completely still.

Your interface: AQUA ZONE — FULLY CLAIMED. Aqua resonance locked.

A rune rises to the surface near where she stood.`,
    xp: 80, rewards: [{ itemKey: 'rune_aqua', qty: 1 }],
    choices: [{ label: 'Return to the district', next: 'district_hub' }],
  },

  // ── Builder Rescue event (#7) ────────────────────────────────────────────
  zone_water_builders: {
    id: 'zone_water_builders', type: 'story',
    text: `Three Builders backed into the corner of a flooded mechanical room — water up to their chests, a pair of Flood Wraiths circling. The lead Builder spots you. She's bleeding from a cut above her eyebrow but she doesn't shout. Just one short tactical hand sign: HELP IF YOU CAN.

The Wraiths are closing.`,
    choices: [
      { label: 'Wade in and fight beside them', sub: 'Builders support — easier combat', next: 'zone_water_builders_combat' },
      { label: 'Hang back. Wait. Take their gear after', sub: 'Moral -10', next: 'zone_water_builders_loot', moral: -10 },
      { label: 'Retreat — too risky', sub: 'The System notes this', next: 'zone_water_explore_1', allianceTagRepeatable: 'cowardice' },
    ],
  },
  zone_water_builders_combat: {
    id: 'zone_water_builders_combat', type: 'combat',
    text: `You wade in. The lead Builder calls a flank, two of them angle around the column. Together you push the Wraiths apart. The fight is mean but fast.`,
    enemy: { name: 'Flood Wraith Pack', icon: '💧', hp: 85, atk: 14, def: 7, xp: 110,
      loot: [{ itemKey: 'rune_aqua', qty: 1 }] },
    onWin: 'zone_water_builders_win', onLose: 'zone_water_explore_1',
  },
  zone_water_builders_win: {
    id: 'zone_water_builders_win', type: 'story',
    text: `"Hold." The lead Builder rises, wipes water from her face. "That was clean work. You're on the log." She presses a small foil-wrapped pack into your hand. "Sera will know."

Your comm chirps once. Sera's voice, brief: "I see you."`,
    rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_metal', qty: 2 }],
    choices: [{ label: 'Continue', next: 'zone_water_explore_2', moral: 10, allianceTagRepeatable: 'builders_helped' }],
  },
  zone_water_builders_loot: {
    id: 'zone_water_builders_loot', type: 'story',
    text: `You wait at the doorway. The Wraiths do what Wraiths do. The Builders fight hard. The Builders lose.

The water goes still after, and you wade in. They had supplies on them. They won't need them now.`,
    rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_metal', qty: 3 }, { itemKey: 'flashlight', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_water_explore_2' }],
  },

}
