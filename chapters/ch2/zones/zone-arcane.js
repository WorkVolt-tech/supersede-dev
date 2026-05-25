// zone-arcane.js — Arcane | Kessler Bookshop | Boss: The Infinite Archivist
export default {

  zone_arcane: {
    id: 'zone_arcane', type: 'story',
    text: `The bookshop at the district center. Floor-to-ceiling shelves, all still standing. Books undisturbed. The shop cat watches from the top of a shelf. It blinks once. Unimpressed.

The arcane zone is behind an overstuffed reading chair positioned with intention.

Your interface: ELEMENTAL ZONE — ARCANE. Resonance check: Knowledge alignment detected.

A collapsed player nearby — Hunter faction colors, unconscious. Not a threat right now.

ARCANE SKILL TREE — UNLOCKED.`,
    xp: 120,
    choices: [
      { label: 'Assist them. Use your items.', sub: 'Costs a med pack — Moral +10.', next: 'zone_arcane_assist', moral: 10 },
      { label: 'Leave them and unlock the tree.', next: 'zone_arcane_unlock' },
    ],
  },

  zone_arcane_assist: {
    id: 'zone_arcane_assist', type: 'story',
    text: `They come around slowly. "You're Builders?" "No." They look at you a moment. "Okay." They leave.

Alliance Log updated: Hunters — partial trust event.

ARCANE TREE UNLOCKED. ARCANE BINDING: Skill AP costs −12%. Arcane abilities +18% damage. Status effects last +1 turn.

The cat walks across three shelves and purrs for forty-five seconds. Then stops.`,
    xp: 100, rewards: [{ itemKey: 'rune_lux', qty: 2 }],
    choices: [{ label: 'Push deeper into the shop', next: 'zone_arcane_explore_1' }],
  },

  zone_arcane_unlock: {
    id: 'zone_arcane_unlock', type: 'story',
    text: `You sit in the chair. The cat settles on the arm. Purrs for forty-five seconds. Stops. Goes somewhere else.

ARCANE TREE UNLOCKED. ARCANE BINDING: Skill AP costs −12%. Arcane abilities +18% damage. Status effects last +1 turn.`,
    xp: 50, rewards: [{ itemKey: 'rune_lux', qty: 2 }],
    choices: [{ label: 'Push deeper into the shop', next: 'zone_arcane_explore_1' }],
  },

  zone_arcane_explore_1: {
    id: 'zone_arcane_explore_1', type: 'story',
    text: `The back of the bookshop. The shelves are taller here, the aisles narrower. The books are arranged differently than they should be — alphabetical by subject, not author, not title. Someone reorganized everything.

A Lore Phantom drifts through the shelves — made of compressed knowledge residue, it manifests as a figure made of turning pages. It doesn't like being looked at directly.`,
    xp: 40,
    choices: [
      { label: 'Fight the Lore Phantom', next: 'zone_arcane_enemy_1' },
      { label: 'Speak to it — address it as if it were real', sub: 'Risky — it might answer', next: 'zone_arcane_speak' },
    ],
  },

  zone_arcane_speak: {
    id: 'zone_arcane_speak', type: 'story',
    text: `You address it directly: "What are you protecting?"

The pages stop turning for a moment.

Then it resumes drifting — but moves past you without engaging. You don't know if that was success or deferral.`,
    xp: 60, rewards: [{ itemKey: 'rune_lux', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_arcane_explore_2' }],
  },

  zone_arcane_enemy_1: {
    id: 'zone_arcane_enemy_1', type: 'combat',
    text: `The Lore Phantom turns toward you — the pages accelerating, the figure sharpening into something that can hit.`,
    enemy: { name: 'Lore Phantom', icon: '✨', hp: 92, atk: 19, def: 9, xp: 100,
      loot: [{ itemKey: 'rune_lux', qty: 1 }] },
    onWin: 'zone_arcane_explore_2', onLose: 'zone_arcane_explore_1',
  },

  zone_arcane_explore_2: {
    id: 'zone_arcane_explore_2', type: 'story',
    text: `A private reading room. Locked, but the lock is mechanical and old. Inside: a desk covered in notes in three different handwritings. Someone has been mapping the district's elemental zones. The map is incomplete but more detailed than anything you have.

Your interface tags a small arcane formation in the corner — stable, low-level, harvestable.

The notes include a warning at the bottom: "The Archivist sees everything you take."`,
    xp: 60,
    choices: [
      { label: 'Take the notes and harvest the formation', sub: 'Moral -5 — the Archivist will know', next: 'zone_arcane_take', moral: -5 },
      { label: 'Take only the notes', next: 'zone_arcane_notes' },
      { label: 'Leave both — the warning feels real', next: 'zone_arcane_corridor' },
    ],
  },

  zone_arcane_take: {
    id: 'zone_arcane_take', type: 'story',
    text: `You take the notes and drain the formation. The cat appears in the doorway, looks at you, and walks away.

Your interface: The Archivist has logged this action.`,
    xp: 40, rewards: [{ itemKey: 'rune_lux', qty: 2 }, { itemKey: 'district_map', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_arcane_corridor' }],
  },

  zone_arcane_notes: {
    id: 'zone_arcane_notes', type: 'story',
    text: `You take the notes. Leave the formation.

The formation pulses once — like an acknowledgment.`,
    xp: 50, rewards: [{ itemKey: 'district_map', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_arcane_corridor' }],
  },

  zone_arcane_corridor: {
    id: 'zone_arcane_corridor', type: 'story',
    text: `The corridor leading to the reading room at the back. The bookshelves here have rearranged themselves — you can see where books have moved, gaps where they were, new gaps where they landed.

Two Glyph Sentinels guard the passage — animated shelf-units, running on arcane residue, enforcing an order that no longer applies.

They register you as unauthorized.`,
    xp: 40,
    choices: [
      { label: 'Fight the Glyph Sentinels', next: 'zone_arcane_enemy_2' },
      { label: 'Movement two aisles over — someone trapped', sub: 'A scholar pinned by fallen shelves.', next: 'zone_arcane_scholar' },
    ],
  },

  // ── Side-quest: trapped scholar ──────────────────────────────────────
  // Mirrors the Builders pattern in plant/water/earth. A neutral civilian
  // encounter that gives the player a moral test (help / loot / walk
  // away). Adds 4 nodes to bring arcane's content in line with the
  // faction-rich zones.
  zone_arcane_scholar: {
    id: 'zone_arcane_scholar', type: 'story',
    text: `Two aisles over, a section of shelving has come down. A man is under it — older, glasses cracked, one leg pinned under a beam of solid oak loaded with reference volumes. He's conscious. He's also bleeding from a scalp wound that's running into his collar.

A Glyph Sentinel paces the next aisle. It hasn't found him yet. It will.

He sees you. Doesn't beg. Just says, quietly: "Lift from the left side. The pin is mostly the books."`,
    choices: [
      { label: 'Lift the beam, get him out, fight the Sentinel when it comes', sub: 'Sentinel ambush — easier with momentum', next: 'zone_arcane_scholar_combat' },
      { label: 'Wait for the Sentinel to find him. Take what he has after.', sub: 'Moral -10', next: 'zone_arcane_scholar_loot', moral: -10 },
      { label: 'Back out quietly', sub: 'The System notes this', next: 'zone_arcane_enemy_2', allianceTagRepeatable: 'cowardice' },
    ],
  },
  zone_arcane_scholar_combat: {
    id: 'zone_arcane_scholar_combat', type: 'combat',
    text: `The beam shifts. He pulls his leg free in one motion that costs him visibly. He doesn't make a sound. The Sentinel rounds the corner just as he reaches for the broken edge of a shelf and turns it into a weapon.`,
    enemy: { name: 'Glyph Sentinel', icon: '✨', hp: 95, atk: 16, def: 9, xp: 120,
      loot: [{ itemKey: 'rune_lux', qty: 1 }] },
    onWin: 'zone_arcane_scholar_win', onLose: 'zone_arcane_enemy_2',
  },
  zone_arcane_scholar_win: {
    id: 'zone_arcane_scholar_win', type: 'story',
    text: `The Sentinel collapses into its component shelves. The scholar leans against the wall, holding his side. "I was cataloguing what's still here. The Archivist won't let me leave with notes." He hands you a folded page anyway. "Pre-collapse arcane index. It's accurate."

He limps toward the front of the shop on his own.`,
    rewards: [{ itemKey: 'rune_lux', qty: 1 }, { itemKey: 'district_map', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_arcane_midpoint', moral: 10, allianceTagRepeatable: 'civilian_helped' }],
  },
  zone_arcane_scholar_loot: {
    id: 'zone_arcane_scholar_loot', type: 'story',
    text: `You step back behind a shelf and wait. The Sentinel does what Sentinels do.

When it's done, the aisle is quiet. You walk over. The scholar's notes are folded in his coat pocket, blood-edged but legible. His glasses are still on, somehow.

You take what's useful and keep moving.`,
    rewards: [{ itemKey: 'rune_lux', qty: 2 }, { itemKey: 'district_map', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_arcane_midpoint' }],
  },

  zone_arcane_enemy_2: {
    id: 'zone_arcane_enemy_2', type: 'combat',
    text: `The Glyph Sentinels move with the weight of things that know where everything belongs.`,
    enemy: { name: 'Glyph Sentinel Pair', icon: '✨', hp: 160, atk: 21, def: 13, xp: 150,
      loot: [{ itemKey: 'rune_lux', qty: 1 }, { itemKey: 'scrap_metal', qty: 1 }] },
    onWin: 'zone_arcane_midpoint', onLose: 'zone_arcane_corridor',
  },

  zone_arcane_midpoint: {
    id: 'zone_arcane_midpoint', type: 'story',
    text: `The reading room. Impossibly large for the building that contains it. Orbiting crystal rings catching light from no visible source.

An Arcane Warden occupies the center — a senior elemental formation, organized and purposeful. It's cataloguing something. You are now part of what it's cataloguing.

Your interface: ZONE GUARDIAN PROXIMITY DETECTED.`,
    xp: 80,
    choices: [
      { label: 'Fight the Arcane Warden', next: 'zone_arcane_enemy_3' },
      { label: 'Present yourself as a researcher — engage it directly', sub: 'Insight check — may avoid the fight', next: 'zone_arcane_engage' },
    ],
  },

  zone_arcane_engage: {
    id: 'zone_arcane_engage', type: 'story',
    text: `You hold out the zone notes. The Warden stops cataloguing. Reads them. Reads you.

Then steps aside.

You don't know what it decided about you. But it lets you through.`,
    xp: 80, rewards: [{ itemKey: 'rune_lux', qty: 1 }],
    choices: [{ label: 'Enter the deep reading room', next: 'zone_arcane_boss_approach' }],
  },

  zone_arcane_enemy_3: {
    id: 'zone_arcane_enemy_3', type: 'combat',
    text: `The Arcane Warden turns to face you — the crystal rings accelerating around it.`,
    enemy: { name: 'Arcane Warden', icon: '✨', hp: 245, atk: 25, def: 17, xp: 225,
      loot: [{ itemKey: 'rune_lux', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }] },
    onWin: 'zone_arcane_cache', onLose: 'zone_arcane_midpoint',
  },

  zone_arcane_cache: {
    id: 'zone_arcane_cache', type: 'story',
    text: `The Warden dissolves — its cataloguing incomplete.

Where it stood: a crystallized knowledge formation. Runes and supplies.

The cat is sitting on the table. It blinks at you once. Then at the door.`,
    xp: 60, rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'rune_lux', qty: 1 }],
    choices: [{ label: 'Enter the deep reading room', next: 'zone_arcane_boss_approach' }],
  },

  zone_arcane_boss_approach: {
    id: 'zone_arcane_boss_approach', type: 'story',
    text: `The deep reading room. Vaulted ceiling. Orbiting crystal rings. Light from no source.

Your interface: ZONE GUARDIAN DETECTED.

The Infinite Archivist.

Six-armed. Draped in fabric that contains stars — not a print, actual stars, visible through the cloth like windows. Each arm holds something: a book, a lens, a compass, a scale, a mirror, a key.

It looks at you the way someone looks at a sentence they've already read.

"I know what you chose in there," it says. Not an accusation. A statement of record.

The rings begin to move faster.`,
    choices: [{ label: 'Fight The Infinite Archivist', sub: 'Zone guardian — defeat to claim Arcane', next: 'zone_arcane_boss' }],
  },

  zone_arcane_boss: {
    id: 'zone_arcane_boss', type: 'boss',
    text: `The Infinite Archivist already knows your next move. The question is whether you can surprise it anyway.`,
    enemy: { name: 'The Infinite Archivist', icon: '✨', hp: 520, atk: 36, def: 24, xp: 320,
      img: '../assets/boss/boss_arcane.webp', loot: [{ itemKey: 'rune_lux', qty: 2 }] },
    bossKey: 'zone_boss_arcane',
    onWin: 'zone_arcane_boss_win', onLose: 'zone_arcane_boss_approach',
  },

  zone_arcane_boss_win: {
    id: 'zone_arcane_boss_win', type: 'story',
    text: `The Archivist closes its books one by one. Folds each arm. The rings slow, stop, fall softly.

"Unexpected," it says. Then it's gone.

The reading room is still impossibly large. The cat is sitting on one of the chairs. It blinks once.

Your interface: ARCANE ZONE — FULLY CLAIMED. Arcane resonance locked.

A rune rests on the table where the Archivist stood.`,
    xp: 80, rewards: [{ itemKey: 'rune_lux', qty: 1 }],
    choices: [{ label: 'Return to the district', next: 'district_hub' }],
  },

}
