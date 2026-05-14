// zone-metal.js — Ferro | Hardware Megastore | Boss: The Iron Sovereign
export default {

  zone_metal: {
    id: 'zone_metal', type: 'story',
    text: `The hardware megastore. Largest building in the district by footprint. Twelve aisles. The smell of machine oil and cut lumber and new tools still in packaging. Everything exactly where it was.

The metal zone is in the power tool aisle. The resonance here is precision and function.

Your interface: ELEMENTAL ZONE — FERRO. Resonance check: Offense-Arcane alignment detected.

A fully functional tool cache attached to a structural support column. A note: "Took what I needed. Left the rest. It seemed right." Your interface: Structural load-bearing. Removal may cause ceiling collapse.

FERRO SKILL TREE — UNLOCKED.`,
    xp: 120,
    choices: [
      { label: 'Take the tools. Accept the structural risk.', next: 'zone_metal_take' },
      { label: 'Leave them. The note was right.', next: 'zone_metal_unlock' },
    ],
  },

  zone_metal_take: {
    id: 'zone_metal_take', type: 'story',
    text: `You pull the cache free. The column shifts — a section of ceiling drops into the space you just vacated. Barely.

FERRO TREE UNLOCKED. FERRO BINDING: +20% damage on second consecutive attack vs same target. Stacks ×4.`,
    xp: 80, rewards: [{ itemKey: 'rune_ferro', qty: 2 }, { itemKey: 'scrap_metal', qty: 3 }],
    choices: [{ label: 'Push deeper into the megastore', next: 'zone_metal_explore_1' }],
  },

  zone_metal_unlock: {
    id: 'zone_metal_unlock', type: 'story',
    text: `You pick up a wrench from the display. Good weight. Put it back exactly where you found it.

FERRO TREE UNLOCKED. FERRO BINDING: +20% damage on second consecutive attack vs same target. Stacks ×4.`,
    xp: 50, rewards: [{ itemKey: 'rune_ferro', qty: 2 }],
    choices: [{ label: 'Push deeper into the megastore', next: 'zone_metal_explore_1' }],
  },

  zone_metal_explore_1: {
    id: 'zone_metal_explore_1', type: 'story',
    text: `The fastener aisle. Thousands of small metal components have been drawn toward the ceiling — magnetized by the zone's influence, forming patterns overhead like metal constellations. 

An Iron Drone moves through the aisle — a repurposed inventory unit now running on ferro elemental energy, its magnetism strong enough to drag small tools off the shelves as it passes.

Its magnetism is strong enough to affect your equipment too.`,
    xp: 40,
    choices: [
      { label: 'Fight the Iron Drone', next: 'zone_metal_enemy_1' },
      { label: 'Ground yourself against the shelving and wait for it to pass', sub: 'Takes time — safer option', next: 'zone_metal_ground' },
      { label: 'Cart rolling at the end of the aisle — Hunter scouts scrapping the magnetic equipment', sub: 'Voss\'s people. Confront them.', next: 'zone_metal_hunters' },
    ],
  },

  zone_metal_ground: {
    id: 'zone_metal_ground', type: 'story',
    text: `You grip the steel shelving and let the drone's magnetic field flow around you. It passes three feet away. The tools on the shelves rattle. Then it's gone down the aisle.`,
    xp: 30,
    choices: [{ label: 'Continue', next: 'zone_metal_explore_2' }],
  },

  zone_metal_enemy_1: {
    id: 'zone_metal_enemy_1', type: 'combat',
    text: `The Iron Drone locks onto you — its magnetism pulling at your equipment as it moves in.`,
    enemy: { name: 'Iron Drone', icon: '⚙️', hp: 100, atk: 20, def: 12, xp: 105,
      loot: [{ itemKey: 'rune_ferro', qty: 1 }, { itemKey: 'scrap_metal', qty: 1 }] },
    onWin: 'zone_metal_explore_2', onLose: 'zone_metal_explore_1',
  },

  zone_metal_explore_2: {
    id: 'zone_metal_explore_2', type: 'story',
    text: `The electrical aisle. Wire, conduit, panel boxes — all of it vibrating slightly. The ferro elemental influence has magnetized everything in here.

A ferro formation grows from the wall panel — the zone has grown it right into the electrical infrastructure. Dense, crystalline, slowly pulling more metal toward itself.

On a shelf: a sealed professional tool kit. Expensive. Still in packaging.`,
    xp: 60,
    choices: [
      { label: 'Extract the ferro formation from the panel', sub: 'Electrical discharge risk — costs HP', next: 'zone_metal_extract' },
      { label: 'Take the tool kit', next: 'zone_metal_kit' },
      { label: 'Leave both', next: 'zone_metal_corridor' },
    ],
  },

  zone_metal_extract: {
    id: 'zone_metal_extract', type: 'story',
    text: `The extraction triggers a discharge that runs through you and the shelving both. You hold on. The formation releases — heavy, warm, solid.

Your hand tingles for the next few minutes. Worth it.`,
    xp: 50, rewards: [{ itemKey: 'rune_ferro', qty: 2 }],
    choices: [{ label: 'Continue', next: 'zone_metal_corridor' }],
  },

  zone_metal_kit: {
    id: 'zone_metal_kit', type: 'story',
    text: `The kit has everything — quality tools, still in their cases. You take it.`,
    xp: 30, rewards: [{ itemKey: 'stabilizer_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_metal_corridor' }],
  },

  zone_metal_corridor: {
    id: 'zone_metal_corridor', type: 'story',
    text: `The central aisle. The megastore's main spine — longest uninterrupted run of floor in the building.

Two Forge Sentinels patrol it. Heavy, armored in actual store merchandise — steel plates, pipe sections, all of it magnetized together into functional armor. They move at the pace of something confident in its own durability.`,
    xp: 40,
    choices: [{ label: 'Fight the Forge Sentinels', next: 'zone_metal_enemy_2' }],
  },

  zone_metal_enemy_2: {
    id: 'zone_metal_enemy_2', type: 'combat',
    text: `The Forge Sentinels turn together — heavy, deliberate, impossible to knock down.`,
    enemy: { name: 'Forge Sentinel Pair', icon: '⚙️', hp: 180, atk: 22, def: 18, xp: 165,
      loot: [{ itemKey: 'rune_ferro', qty: 1 }, { itemKey: 'scrap_metal', qty: 2 }] },
    onWin: 'zone_metal_midpoint', onLose: 'zone_metal_corridor',
  },

  zone_metal_midpoint: {
    id: 'zone_metal_midpoint', type: 'story',
    text: `The warehouse section at the back. Loading bay, forklift still parked, ceiling high enough for what's waiting.

A Steel Colossus stands at the loading dock — assembled from the megastore's own heavy stock. Larger than the sentinels. More organized. It's been here since the zone formed.

Your interface: ZONE GUARDIAN PROXIMITY DETECTED.`,
    xp: 80,
    choices: [
      { label: 'Fight the Steel Colossus', next: 'zone_metal_enemy_3' },
      { label: 'Use the forklift — create a magnetic interference field', sub: 'Technical approach — weakens it first', next: 'zone_metal_forklift' },
    ],
  },

  zone_metal_forklift: {
    id: 'zone_metal_forklift', type: 'story',
    text: `You get the forklift running and drive it into the Colossus's magnetic field — the competing magnetism disrupts its coherence. It staggers, losing pieces of itself, trying to reassemble.

Now fight it while it's compromised.`,
    xp: 60,
    choices: [{ label: 'Fight the disrupted Colossus', next: 'zone_metal_enemy_3b' }],
  },

  zone_metal_enemy_3: {
    id: 'zone_metal_enemy_3', type: 'combat',
    text: `The Steel Colossus turns toward you — its magnetic field pulling at everything metal in the warehouse.`,
    enemy: { name: 'Steel Colossus', icon: '⚙️', hp: 270, atk: 26, def: 20, xp: 235,
      loot: [{ itemKey: 'rune_ferro', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }] },
    onWin: 'zone_metal_cache', onLose: 'zone_metal_midpoint',
  },

  zone_metal_enemy_3b: {
    id: 'zone_metal_enemy_3b', type: 'combat',
    text: `The Steel Colossus is disrupted — reassembling slowly, half its mass scattered across the warehouse floor.`,
    enemy: { name: 'Disrupted Steel Colossus', icon: '⚙️', hp: 160, atk: 18, def: 12, xp: 180,
      loot: [{ itemKey: 'rune_ferro', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }] },
    onWin: 'zone_metal_cache', onLose: 'zone_metal_midpoint',
  },

  zone_metal_cache: {
    id: 'zone_metal_cache', type: 'story',
    text: `The Colossus seizes — magnetic field collapsing — and settles into a pile of store merchandise.

A ferro formation is exposed where its core was. Runes and supplies.

The loading bay door is ahead. That's where the real guardian is.`,
    xp: 60, rewards: [{ itemKey: 'rune_ferro', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Enter the loading bay', next: 'zone_metal_boss_approach' }],
  },

  zone_metal_boss_approach: {
    id: 'zone_metal_boss_approach', type: 'story',
    text: `The loading bay. Ceiling high enough. Floor clear enough.

Your interface: ZONE GUARDIAN DETECTED.

The Iron Sovereign.

Steam-powered. A war-golem assembled from the megastore's own materials — recognizable hardware fused into something that shouldn't be able to move. Gear-crown. A spiked mace — a forklift attachment, once. Two exhaust towers on its shoulders, already smoking.

Its furnace-core glows orange through a grated chest plate.

It raises the mace. The floor dents where the head rests.`,
    choices: [{ label: 'Fight The Iron Sovereign', sub: 'Zone guardian — defeat to claim Ferro', next: 'zone_metal_boss' }],
  },

  zone_metal_boss: {
    id: 'zone_metal_boss', type: 'boss',
    text: `The Iron Sovereign reflects physical damage. It was built to outlast you.`,
    enemy: { name: 'The Iron Sovereign', icon: '⚙️', hp: 680, atk: 38, def: 38, xp: 320,
      img: '../assets/boss/boss_metal.webp', loot: [{ itemKey: 'rune_ferro', qty: 2 }] },
    bossKey: 'zone_boss_metal',
    onWin: 'zone_metal_boss_win', onLose: 'zone_metal_boss_approach',
  },

  zone_metal_boss_win: {
    id: 'zone_metal_boss_win', type: 'story',
    text: `The furnace-core dims. The exhaust towers stop smoking. The Iron Sovereign's joints seize one by one — settling into a crouch it will never rise from.

The mace falls. The sound echoes through the whole building.

Your interface: FERRO ZONE — FULLY CLAIMED. Ferro resonance locked.

A rune sits inside the furnace-core, visible through the grate. Still warm.`,
    xp: 80, rewards: [{ itemKey: 'rune_ferro', qty: 1 }],
    choices: [{ label: 'Return to the district', next: 'district_hub' }],
  },

  // ── Hunter Scout encounter (humanoid — triggers spare/execute prompt on win)
  zone_metal_hunters: {
    id: 'zone_metal_hunters', type: 'combat',
    text: `Two Hunters with a half-loaded scrap cart. Magnetized panels, ferro-charged fastener bundles, anything they can fence later. They see you and reach for their weapons. The cart squeals as one of them kicks it aside.`,
    enemy: {
      name: 'Hunter Scout Pair', icon: '🗡️',
      hp: 125, atk: 22, def: 10, xp: 135,
      humanoid: true,
      loot: [{ itemKey: 'scrap_metal', qty: 3 }, { itemKey: 'scrap_blade', qty: 1 }],
      executeLoot: [{ itemKey: 'scrap_shield', qty: 1 }],
    },
    onWin: 'zone_metal_explore_2', onLose: 'zone_metal_explore_1',
  },

}
