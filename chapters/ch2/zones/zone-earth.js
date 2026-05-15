// zone-earth.js — Terra | Parking Structure | Boss: The Warden of Ruin
export default {

  zone_earth: {
    id: 'zone_earth', type: 'story',
    text: `The parking structure. Three levels of poured concrete. The particular silence of spaces built for cars, now empty of them.

Level two. The zone is between two structural pillars with hairline cracks. Through the cracks something slow and warm moves.

Your interface: ELEMENTAL ZONE — TERRA. Resonance check: Endurance alignment detected.

A collapsed section of flooring — a cache of building materials visible beneath it. A handwritten note nearby: "Load-bearing. Don't."

TERRA SKILL TREE — UNLOCKED.`,
    xp: 120,
    choices: [
      { label: 'Pull the cache out. Risk the collapse.', sub: 'Significant damage — useful materials.', next: 'zone_earth_pull' },
      { label: 'Leave it. The note was right.', next: 'zone_earth_unlock' },
    ],
  },

  zone_earth_pull: {
    id: 'zone_earth_pull', type: 'story',
    text: `A crack runs from floor to ceiling fast. The ceiling drops a section onto the space you just occupied. You weren't in it. Barely.

TERRA TREE UNLOCKED. TERRA BINDING: Max HP +20. Physical damage reduction +10%. Attack speed −1.`,
    xp: 100, rewards: [{ itemKey: 'rune_terra', qty: 2 }, { itemKey: 'scrap_metal', qty: 3 }],
    choices: [{ label: 'Push deeper into the structure', next: 'zone_earth_explore_1' }],
  },

  zone_earth_unlock: {
    id: 'zone_earth_unlock', type: 'story',
    text: `You move past without disturbing it. The note was right. You press one hand to a pillar on your way through — cold concrete, decades old. Still holding.

TERRA TREE UNLOCKED. TERRA BINDING: Max HP +20. Physical damage reduction +10%. Attack speed −1.`,
    xp: 50, rewards: [{ itemKey: 'rune_terra', qty: 2 }],
    choices: [{ label: 'Push deeper into the structure', next: 'zone_earth_explore_1' }],
  },

  zone_earth_explore_1: {
    id: 'zone_earth_explore_1', type: 'story',
    text: `Level two, east section. The concrete here has cracked in deliberate-looking patterns — too geometric to be accidental. Something moving through the structure has been making these.

A Stone Crawler emerges from a crack in the floor — roughly the size of a large dog, built from aggregated concrete and rebar, running on earth elemental residue. Slow. Very heavy.

It doesn't rush. It doesn't need to.`,
    xp: 40,
    choices: [
      { label: 'Fight the Stone Crawler', next: 'zone_earth_enemy_1' },
      { label: 'Collapse a section of floor on top of it', sub: 'Costs a structural point — weakens it but damages the area', next: 'zone_earth_collapse' },
      { label: 'A signal flare two levels down — Builders trapped in collapsed stairwell', sub: 'Three of Sera\'s people, pinned in rubble.', next: 'zone_earth_builders' },
    ],
  },

  zone_earth_collapse: {
    id: 'zone_earth_collapse', type: 'story',
    text: `You hit the weakened section of floor above the crawler. It drops — concrete and rebar landing squarely. The crawler is buried but not finished.

You can hear it moving through the rubble.`,
    xp: 50,
    choices: [{ label: "Fight it while it's slowed", next: 'zone_earth_enemy_1b' }],
  },

  zone_earth_enemy_1: {
    id: 'zone_earth_enemy_1', type: 'combat',
    text: `The Stone Crawler advances — slow, inexorable, hitting like a building.`,
    enemy: { name: 'Stone Crawler', icon: '🪨', hp: 130, atk: 22, def: 15, xp: 110,
      loot: [{ itemKey: 'rune_terra', qty: 1 }, { itemKey: 'scrap_metal', qty: 1 }] },
    onWin: 'zone_earth_explore_2', onLose: 'zone_earth_explore_1',
  },

  zone_earth_enemy_1b: {
    id: 'zone_earth_enemy_1b', type: 'combat',
    text: `The Stone Crawler pushes through the rubble — slower now, damaged, but still coming.`,
    enemy: { name: 'Buried Stone Crawler', icon: '🪨', hp: 80, atk: 16, def: 10, xp: 90,
      loot: [{ itemKey: 'rune_terra', qty: 1 }] },
    onWin: 'zone_earth_explore_2', onLose: 'zone_earth_explore_1',
  },

  zone_earth_explore_2: {
    id: 'zone_earth_explore_2', type: 'story',
    text: `A section of the structure that's been reinforced — by the zone, not by anyone human. The concrete here is denser, the cracks sealed with something amber-colored. Like the structure is healing itself.

In one sealed alcove: a terra formation — crystallized earth residue, warm to the touch. This one's stable.

Birds have nested on the upper level. You can hear them through the open ceiling above.`,
    xp: 60,
    choices: [
      { label: 'Harvest the terra formation', next: 'zone_earth_harvest' },
      { label: 'Leave it and continue', next: 'zone_earth_corridor' },
    ],
  },

  zone_earth_harvest: {
    id: 'zone_earth_harvest', type: 'story',
    text: `The formation releases on contact — warm, solid, real. The alcove is cooler now. The amber sealing around the cracks fades slightly.`,
    xp: 40, rewards: [{ itemKey: 'rune_terra', qty: 2 }],
    choices: [{ label: 'Continue to the ramp', next: 'zone_earth_corridor' }],
  },

  zone_earth_corridor: {
    id: 'zone_earth_corridor', type: 'story',
    text: `The ramp to level three. The structure is groaning here — stressed, but not failing. The earth elemental density increases with each step upward.

Two Rubble Golems block the ramp. Smaller than what's ahead — assembled from broken concrete and rebar, moving on elemental energy. They weren't here yesterday. The zone made them.`,
    xp: 40,
    choices: [{ label: 'Fight the Rubble Golems', next: 'zone_earth_enemy_2' }],
  },

  zone_earth_enemy_2: {
    id: 'zone_earth_enemy_2', type: 'combat',
    text: `The Rubble Golems lurch forward together — coordinated in the way that mindless things sometimes are.`,
    enemy: { name: 'Rubble Golem Pair', icon: '🪨', hp: 170, atk: 24, def: 16, xp: 155,
      loot: [{ itemKey: 'rune_terra', qty: 1 }, { itemKey: 'scrap_metal', qty: 2 }] },
    onWin: 'zone_earth_midpoint', onLose: 'zone_earth_corridor',
  },

  zone_earth_midpoint: {
    id: 'zone_earth_midpoint', type: 'story',
    text: `Level three. The top — open to the sky, the roof long gone. Rubble everywhere. Plants pushing through cracks in the concrete. Birds scattered when you emerged from the ramp.

The floor vibrates slightly. Not structurally — rhythmically.

A Terra Guardian stands at the far end, half-emerged from the floor itself. Massive. Ancient-looking. Your interface reads it as pre-boss formation — the zone's primary defensive unit.

Your interface: ZONE GUARDIAN PROXIMITY DETECTED.`,
    xp: 80,
    choices: [
      { label: 'Fight the Terra Guardian', next: 'zone_earth_enemy_3' },
      { label: 'Move through the rubble field — stay low, stay quiet', next: 'zone_earth_boss_approach' },
    ],
  },

  zone_earth_enemy_3: {
    id: 'zone_earth_enemy_3', type: 'combat',
    text: `The Terra Guardian fully emerges — the floor cracking around it as it rises to full height.`,
    enemy: { name: 'Terra Guardian', icon: '🪨', hp: 260, atk: 28, def: 20, xp: 230,
      loot: [{ itemKey: 'rune_terra', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }] },
    onWin: 'zone_earth_cache', onLose: 'zone_earth_midpoint',
  },

  zone_earth_cache: {
    id: 'zone_earth_cache', type: 'story',
    text: `The Terra Guardian settles — returning partially to the floor, going still.

Where it emerged: a vein of crystallized terra residue, exposed. You extract what you can.

Birds have returned to the upper edge. The sky above is clear.`,
    xp: 60, rewards: [{ itemKey: 'rune_terra', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Approach the far end of the level', next: 'zone_earth_boss_approach' }],
  },

  zone_earth_boss_approach: {
    id: 'zone_earth_boss_approach', type: 'story',
    text: `The far end of level three. Where the roof is most completely gone.

The ground shakes once. Then again. Then the far section shifts — and something underneath it stands up.

The Warden of Ruin.

It assembles itself from the concrete and stone and rebar, gold-veined cracks glowing from within its chest, its fists the size of car doors. It doesn't roar.

It walks toward you at the pace of something that has never needed to hurry.`,
    choices: [{ label: 'Fight The Warden of Ruin', sub: 'Zone guardian — defeat to claim Terra', next: 'zone_earth_boss' }],
  },

  zone_earth_boss: {
    id: 'zone_earth_boss', type: 'boss',
    text: `The Warden of Ruin hits like a building falling. It cannot be stunned. It does not stop.`,
    enemy: { name: 'The Warden of Ruin', icon: '🪨', hp: 720, atk: 40, def: 34, xp: 320,
      img: '../assets/boss/boss_earth.webp', loot: [{ itemKey: 'rune_terra', qty: 2 }] },
    bossKey: 'zone_boss_earth',
    onWin: 'zone_earth_boss_win', onLose: 'zone_earth_boss_approach',
  },

  zone_earth_boss_win: {
    id: 'zone_earth_boss_win', type: 'story',
    text: `The gold veins go dark one by one. The Warden settles — the way a building settles. Slowly. Deliberately. Until it's just rubble again, indistinguishable from everything around it.

Birds return and land.

Your interface: TERRA ZONE — FULLY CLAIMED. Terra resonance locked.

A rune sits in the rubble, warm to the touch.`,
    xp: 80, rewards: [{ itemKey: 'rune_terra', qty: 1 }],
    choices: [{ label: 'Return to the district', next: 'district_hub' }],
  },

  // ── Builder Rescue event (#7) ────────────────────────────────────────────
  zone_earth_builders: {
    id: 'zone_earth_builders', type: 'story',
    text: `Two levels down. A stairwell has partially collapsed, and three Builders are trapped on a slab of broken floor with a Stone Crawler grinding toward them from the far side. They have a winch anchor set, but the Crawler's between them and the way out.

One of them sees you on the level above. Doesn't shout. Just raises a hand. Steady. Patient. Bleeding from the temple.`,
    choices: [
      { label: 'Drop down and engage', sub: 'Builders support — easier combat', next: 'zone_earth_builders_combat' },
      { label: 'Wait it out. Take the gear after', sub: 'Moral -10', next: 'zone_earth_builders_loot', moral: -10 },
      { label: 'Move on — not your fight', sub: 'The System notes this', next: 'zone_earth_explore_1', allianceTagRepeatable: 'cowardice' },
    ],
  },
  zone_earth_builders_combat: {
    id: 'zone_earth_builders_combat', type: 'combat',
    text: `You drop down. The lead Builder hands off her winch line to her partner without looking — pivots, picks up a length of rebar like a spear. "Right side." That's all the planning you get. It's enough.`,
    enemy: { name: 'Stone Crawler', icon: '🪨', hp: 110, atk: 18, def: 13, xp: 120,
      loot: [{ itemKey: 'rune_terra', qty: 1 }, { itemKey: 'scrap_metal', qty: 2 }] },
    onWin: 'zone_earth_builders_win', onLose: 'zone_earth_explore_1',
  },
  zone_earth_builders_win: {
    id: 'zone_earth_builders_win', type: 'story',
    text: `The Crawler goes still. The lead Builder steadies herself against a column, wipes blood from her face. "We had a backup plan. It was a worse plan. You didn't have to do that." She presses a pack into your hand. "But you did. Sera will know."

Your comm chirps. "I see you. Keep going."`,
    rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'rare_component', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_earth_explore_2', moral: 10, allianceTagRepeatable: 'builders_helped' }],
  },
  zone_earth_builders_loot: {
    id: 'zone_earth_builders_loot', type: 'story',
    text: `You watch from the level above. The Crawler doesn't rush — Crawlers never rush. The slab tips. The screaming is short.

When the dust settles, the Crawler retreats back into the structure. You climb down. You take what's worth taking. You don't look at the faces.`,
    rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_metal', qty: 4 }, { itemKey: 'rare_component', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_earth_explore_2' }],
  },

}
