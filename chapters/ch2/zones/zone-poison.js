// zone-poison.js — Venin | Pharmacy (Anchor Store) | Boss: The Plague Coil
export default {

  zone_poison: {
    id: 'zone_poison', type: 'story',
    text: `The pharmacy section of the anchor store. Not looted — the System sealed it early. Shelves intact. Zone in the compounding room at the back — temperature controlled, air smelling chemical.

The door is locked but not System-locked. Standard key lock — a person put it there. A person could force it.

Your interface: ELEMENTAL ZONE — VENIN. Resonance check: Attrition alignment detected.

The zone deals constant low damage from the moment you enter.

Inside: an antidote — one dose, neutralizes the zone's environmental DoT. Behind it: an unstable compound. Your interface: If applied in the Judge fight, deals 5% of both Judges' max HP as poison per turn × 3 turns. Cost: 25% of your own max HP.

VENIN SKILL TREE — UNLOCKED.`,
    xp: 120,
    choices: [
      { label: 'Take the antidote only.', sub: 'Safe — neutralizes zone DoT.', next: 'zone_poison_antidote' },
      { label: 'Take the unstable compound.', sub: 'Powerful — costs 25% HP to use in boss fight.', next: 'zone_poison_compound' },
      { label: 'Take neither. Push through the DoT.', next: 'zone_poison_unlock' },
    ],
  },

  zone_poison_antidote: {
    id: 'zone_poison_antidote', type: 'story',
    text: `The antidote neutralizes the DoT cleanly.

VENIN TREE UNLOCKED. VENIN BINDING: All attacks apply poison — 3% max HP/turn × 2 turns. Own HP regen permanently halved.`,
    xp: 50, rewards: [{ itemKey: 'rune_venin', qty: 2 }],
    choices: [{ label: 'Push deeper into the pharmacy', next: 'zone_poison_explore_1' }],
  },

  zone_poison_compound: {
    id: 'zone_poison_compound', type: 'story',
    text: `The compound requires careful handling. The DoT continues while you work.

Your interface: Unstable compound secured.

VENIN TREE UNLOCKED. VENIN BINDING: All attacks apply poison — 3% max HP/turn × 2 turns. Own HP regen permanently halved.`,
    xp: 80, rewards: [{ itemKey: 'rune_venin', qty: 2 }, { itemKey: 'venom_compound', qty: 1 }],
    choices: [{ label: 'Push deeper into the pharmacy', next: 'zone_poison_explore_1' }],
  },

  zone_poison_unlock: {
    id: 'zone_poison_unlock', type: 'story',
    text: `You take neither. Move through under the DoT, conserving everything else.

VENIN TREE UNLOCKED. VENIN BINDING: All attacks apply poison — 3% max HP/turn × 2 turns. Own HP regen permanently halved.`,
    xp: 50, rewards: [{ itemKey: 'rune_venin', qty: 2 }],
    choices: [{ label: 'Push deeper into the pharmacy', next: 'zone_poison_explore_1' }],
  },

  zone_poison_explore_1: {
    id: 'zone_poison_explore_1', type: 'story',
    text: `The pharmacy floor. The environmental DoT continues — a faint shimmer in the air, a smell that's not quite chemical and not quite biological.

A Venom Sprite drifts through the medication aisle — small, compact, highly toxic. It's absorbed enough elemental residue to become independently aggressive. It detects your body heat and chemical signature immediately.`,
    xp: 40,
    choices: [
      { label: 'Fight the Venom Sprite', next: 'zone_poison_enemy_1' },
      { label: 'Use a medication shelf as a barrier — block its approach', sub: 'Delays it — gives you a moment to prepare', next: 'zone_poison_barrier' },
    ],
  },

  zone_poison_barrier: {
    id: 'zone_poison_barrier', type: 'story',
    text: `You knock a medication shelf across the aisle. The Venom Sprite hits the barrier and reorients — giving you a few seconds.

You use them.`,
    xp: 30,
    choices: [{ label: 'Fight the slowed Venom Sprite', next: 'zone_poison_enemy_1b' }],
  },

  zone_poison_enemy_1: {
    id: 'zone_poison_enemy_1', type: 'combat',
    text: `The Venom Sprite closes in — it hits fast and everything it touches stings.`,
    enemy: { name: 'Venom Sprite', icon: '☠️', hp: 85, atk: 17, def: 6, xp: 92,
      loot: [{ itemKey: 'rune_venin', qty: 1 }] },
    onWin: 'zone_poison_explore_2', onLose: 'zone_poison_explore_1',
  },

  zone_poison_enemy_1b: {
    id: 'zone_poison_enemy_1b', type: 'combat',
    text: `The Venom Sprite recovers from the barrier — slower, still dangerous.`,
    enemy: { name: 'Slowed Venom Sprite', icon: '☠️', hp: 55, atk: 13, def: 4, xp: 72,
      loot: [{ itemKey: 'rune_venin', qty: 1 }] },
    onWin: 'zone_poison_explore_2', onLose: 'zone_poison_explore_1',
  },

  zone_poison_explore_2: {
    id: 'zone_poison_explore_2', type: 'story',
    text: `The dispensary section. Behind the counter — still locked, still professional. The automated dispensing units are running on residual power, cycling through inventory that no one will ever collect.

A venom formation has grown inside one of the dispensing units — pushing through the machinery, taking advantage of the contained chemical environment.

On the pharmacist's counter: a clean, sealed bag. A note in small handwriting: "Everything in here is safe. I sorted it before I left."`,
    xp: 60,
    choices: [
      { label: 'Break into the dispensing unit — harvest the formation', sub: 'DoT intensifies temporarily', next: 'zone_poison_unit' },
      { label: 'Take the pharmacist\'s bag', next: 'zone_poison_bag' },
      { label: 'Leave both and continue', next: 'zone_poison_corridor' },
    ],
  },

  zone_poison_unit: {
    id: 'zone_poison_unit', type: 'story',
    text: `Breaking into the unit releases a concentrated burst of DoT into the immediate area. You hold your breath and push through. The formation is dense — worth it.`,
    xp: 50, rewards: [{ itemKey: 'rune_venin', qty: 2 }],
    choices: [{ label: 'Continue', next: 'zone_poison_corridor' }],
  },

  zone_poison_bag: {
    id: 'zone_poison_bag', type: 'story',
    text: `The bag has antidotes, a med pack, and a small selection of properly labeled medications. The pharmacist was careful.`,
    xp: 30, rewards: [{ itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_poison_corridor' }],
  },

  zone_poison_corridor: {
    id: 'zone_poison_corridor', type: 'story',
    text: `The back corridor toward the stockroom. The DoT is stronger here — the zone is denser.

Two Plague Crawlers block the stockroom entrance — crustacean-shaped venom elementals, moving low and fast. They spread DoT on contact. Everything they touch stays toxic.`,
    xp: 40,
    choices: [
      { label: 'Fight the Plague Crawlers', next: 'zone_poison_enemy_2' },
      { label: 'A woman calling for help from the side office', sub: 'A chemist trapped by toxic vines — losing her antidote dose.', next: 'zone_poison_chemist' },
    ],
  },

  // ── Side-quest: trapped chemist ──────────────────────────────────────
  // Civilian encounter mirroring the Builders pattern in plant/water/earth.
  // Moral choice: help her (she's running out of antidote), wait for her
  // to die and loot, or walk away.
  zone_poison_chemist: {
    id: 'zone_poison_chemist', type: 'story',
    text: `A woman in a stained lab coat, late thirties, ankle wrapped in a creeping toxic vine that's pulsing slow and deliberate. She has an empty antidote auto-injector in her hand. She's already used it once. The DoT is winning anyway.

"I have a second dose in my bag. Two meters away. I can't reach it without spreading the vine further up my leg. If you cut it I can dose myself."

A Spore Husk lurches in the corner of the office — drawn by the chemical leak. It's slow. It's also between her and the bag.`,
    choices: [
      { label: 'Kill the Husk, cut the vine, get her the dose', sub: 'Combat with the Husk', next: 'zone_poison_chemist_combat' },
      { label: 'Wait. She has compound on her either way.', sub: 'Moral -5', next: 'zone_poison_chemist_loot', moral: -5 },
      { label: 'Back out — too risky', sub: 'The System notes this', next: 'zone_poison_enemy_2', allianceTagRepeatable: 'cowardice' },
    ],
  },
  zone_poison_chemist_combat: {
    id: 'zone_poison_chemist_combat', type: 'combat',
    text: `You move on the Husk first — it's the bottleneck. The chemist shouts the vine's pressure point at you mid-fight. "Lower third — the joint near the floor — go!"`,
    enemy: { name: 'Spore Husk', icon: '☠️', hp: 105, atk: 17, def: 7, xp: 125,
      loot: [{ itemKey: 'rune_venin', qty: 1 }] },
    onWin: 'zone_poison_chemist_win', onLose: 'zone_poison_enemy_2',
  },
  zone_poison_chemist_win: {
    id: 'zone_poison_chemist_win', type: 'story',
    text: `The Husk drops. You cut the vine at the joint she pointed at — it shrivels back in one wet, fast motion. She gets to her bag, doses herself, and is breathing normally in under a minute.

"Take this. I won't make it back to the workshop, but you might use it." She hands you a vial of venom compound. "It's stabilized. Won't degrade for a week."`,
    rewards: [{ itemKey: 'venom_compound', qty: 1 }, { itemKey: 'rune_venin', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_poison_midpoint', moral: 5, allianceTagRepeatable: 'civilian_helped' }],
  },
  zone_poison_chemist_loot: {
    id: 'zone_poison_chemist_loot', type: 'story',
    text: `You hold position in the doorway. The vine works. The Husk eventually wanders close enough to finish what the vine started.

You walk in once the Husk is gone again. Her bag has what she said it had — the second dose, plus a vial labelled in careful pre-collapse handwriting.

You don't read the label.`,
    rewards: [{ itemKey: 'venom_compound', qty: 2 }, { itemKey: 'rune_venin', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_poison_midpoint' }],
  },

  zone_poison_enemy_2: {
    id: 'zone_poison_enemy_2', type: 'combat',
    text: `The Plague Crawlers scuttle forward together — close to the ground, fast, trailing toxic residue.`,
    enemy: { name: 'Plague Crawler Pair', icon: '☠️', hp: 150, atk: 19, def: 8, xp: 140,
      loot: [{ itemKey: 'rune_venin', qty: 1 }, { itemKey: 'scrap_metal', qty: 1 }] },
    onWin: 'zone_poison_midpoint', onLose: 'zone_poison_corridor',
  },

  zone_poison_midpoint: {
    id: 'zone_poison_midpoint', type: 'story',
    text: `The stockroom. High shelves, loading dock sealed from outside. The air is visibly wrong — a green-yellow tint, a smell that stings the eyes even at this distance.

A Toxic Node floats at the room's center — a sphere of concentrated venom elemental energy, slowly pulsing. Pre-boss formation. The zone's most concentrated point.

Your interface: ZONE GUARDIAN PROXIMITY DETECTED.`,
    xp: 80,
    choices: [
      { label: 'Destroy the Toxic Node', next: 'zone_poison_enemy_3' },
      { label: 'Move around it to the loading dock — direct route to the guardian', next: 'zone_poison_boss_approach' },
    ],
  },

  zone_poison_enemy_3: {
    id: 'zone_poison_enemy_3', type: 'combat',
    text: `The Toxic Node pulses outward as you approach — the DoT in the room intensifying dramatically.`,
    enemy: { name: 'Toxic Node', icon: '☠️', hp: 240, atk: 22, def: 10, xp: 220,
      loot: [{ itemKey: 'rune_venin', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }] },
    onWin: 'zone_poison_cache', onLose: 'zone_poison_midpoint',
  },

  zone_poison_cache: {
    id: 'zone_poison_cache', type: 'story',
    text: `The Toxic Node collapses — the concentrated energy releasing outward in a pulse that temporarily clears the air.

For about thirty seconds the stockroom is breathable.

You take what it left behind and use the window to get to the loading dock.`,
    xp: 60, rewards: [{ itemKey: 'rune_venin', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Enter the loading dock', next: 'zone_poison_boss_approach' }],
  },

  zone_poison_boss_approach: {
    id: 'zone_poison_boss_approach', type: 'story',
    text: `The loading dock. The DoT here is at its worst — the air is thick with it. Every breath costs something.

Your interface: ZONE GUARDIAN DETECTED. WARNING: Environmental hazard active.

The Plague Coil.

From behind the shelving — a serpent made of toxin and motion, dripping acid from its jaw. Each scale a different shade of sick green. Multiple eyes along its length, all of them glowing. The purple cloud around it isn't smoke. It's the zone itself, concentrated.

It opens its jaw. The sound of a burst pipe.

The DoT increases.`,
    choices: [{ label: 'Fight The Plague Coil', sub: 'Zone guardian — defeat to claim Venin', next: 'zone_poison_boss' }],
  },

  zone_poison_boss: {
    id: 'zone_poison_boss', type: 'boss',
    text: `The Plague Coil poisons the air before it strikes. The zone is the first weapon.`,
    enemy: { name: 'The Plague Coil', icon: '☠️', hp: 550, atk: 36, def: 22, xp: 320,
      img: '../assets/boss/boss_poison.webp', loot: [{ itemKey: 'rune_venin', qty: 2 }] },
    bossKey: 'zone_boss_poison',
    onWin: 'zone_poison_boss_win', onLose: 'zone_poison_boss_approach',
  },

  zone_poison_boss_win: {
    id: 'zone_poison_boss_win', type: 'story',
    text: `The eyes go out — one by one, from the tail forward. The coiling slows. The form loses cohesion, dissolving back into the floor.

The purple cloud disperses. Slowly. The air still tastes wrong for a few minutes, then clears.

Your interface: VENIN ZONE — FULLY CLAIMED. Venin resonance locked.

A rune sits on the loading dock floor. You take it carefully.`,
    xp: 80, rewards: [{ itemKey: 'rune_venin', qty: 1 }],
    choices: [{ label: 'Return to the district', next: 'district_hub' }],
  },

}
