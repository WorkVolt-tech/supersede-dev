// chapters/ch2/zones/zone-farming.js
// ─────────────────────────────────────────────────────────────────────
// Farming Grounds — a repeatable wave-based combat area for Ch2.
//
// PURPOSE
// Lets the player grind XP between story beats by fighting random
// elemental enemies drawn from the 10 zones. Each "run" is 5 waves;
// every wave is a random enemy pulled from a pool that covers all
// 10 elements. XP per kill is bumped to 150-250 to make grinding
// efficient.
//
// HOW THE WAVES GET RANDOMIZED
// We export `randomizeFarmingWaves()` which mutates the 5 wave nodes
// in-place with fresh random enemy picks from FARMING_POOL. The
// parent (ch2 index.js) calls this each time the player enters
// `farming_grounds_hub`. The enemy assignment lives on the same
// `enemy:` field the engine already reads for combat, so no engine
// changes are needed.
//
// NODES EXPORTED
//   farming_grounds_hub  — story entry, "Start a run" / "Leave"
//   farming_wave_1..5    — combat nodes, daisy-chained via onWin
//   farming_complete     — XP summary + return to district_hub
//   farming_defeat       — return to district_hub on death
// ─────────────────────────────────────────────────────────────────────

// Enemy pool. One representative enemy per element x 3 variants per
// element = 30 entries. Stats are mid-tier zone (HP 90-180, ATK 18-26,
// DEF 8-15). XP set to a fixed 150-250 range so any pick is rewarding.
// Loot is just the matching rune so the farming feel like real progress.
const FARMING_POOL = [
  // Fire
  { name: 'Char Hound',         icon: '🔥', hp: 110, atk: 20, def: 8,  xp: 170, loot: [{ itemKey: 'rune_ignis', qty: 1 }] },
  { name: 'Slag Drone',         icon: '🔥', hp: 130, atk: 22, def: 10, xp: 190, loot: [{ itemKey: 'rune_ignis', qty: 1 }] },
  { name: 'Ember Wisp',         icon: '🔥', hp: 95,  atk: 24, def: 6,  xp: 175, loot: [{ itemKey: 'rune_ignis', qty: 1 }] },
  // Water
  { name: 'Tide Stalker',       icon: '💧', hp: 125, atk: 20, def: 9,  xp: 180, loot: [{ itemKey: 'rune_aqua', qty: 1 }] },
  { name: 'Drowned Sentinel',   icon: '💧', hp: 150, atk: 19, def: 12, xp: 195, loot: [{ itemKey: 'rune_aqua', qty: 1 }] },
  { name: 'Mire Eel',           icon: '💧', hp: 100, atk: 23, def: 7,  xp: 170, loot: [{ itemKey: 'rune_aqua', qty: 1 }] },
  // Earth
  { name: 'Stone Crawler',      icon: '🪨', hp: 140, atk: 21, def: 14, xp: 195, loot: [{ itemKey: 'rune_terra', qty: 1 }] },
  { name: 'Rubble Golem',       icon: '🪨', hp: 165, atk: 22, def: 15, xp: 215, loot: [{ itemKey: 'rune_terra', qty: 1 }] },
  { name: 'Dust Wraith',        icon: '🪨', hp: 110, atk: 24, def: 10, xp: 185, loot: [{ itemKey: 'rune_terra', qty: 1 }] },
  // Wind
  { name: 'Gale Hawk',          icon: '💨', hp: 100, atk: 22, def: 7,  xp: 165, loot: [{ itemKey: 'rune_aero', qty: 1 }] },
  { name: 'Zephyr Wraith',      icon: '💨', hp: 95,  atk: 23, def: 6,  xp: 165, loot: [{ itemKey: 'rune_aero', qty: 1 }] },
  { name: 'Storm Caller',       icon: '💨', hp: 130, atk: 24, def: 9,  xp: 200, loot: [{ itemKey: 'rune_aero', qty: 1 }] },
  // Lightning
  { name: 'Arc Spawn',          icon: '⚡', hp: 105, atk: 24, def: 6,  xp: 175, loot: [{ itemKey: 'rune_volt', qty: 1 }] },
  { name: 'Chain Elemental',    icon: '⚡', hp: 145, atk: 22, def: 9,  xp: 200, loot: [{ itemKey: 'rune_volt', qty: 1 }] },
  { name: 'Static Husk',        icon: '⚡', hp: 120, atk: 23, def: 8,  xp: 185, loot: [{ itemKey: 'rune_volt', qty: 1 }] },
  // Plant
  { name: 'Thorn Stalker',      icon: '🌿', hp: 130, atk: 21, def: 10, xp: 190, loot: [{ itemKey: 'rune_flora', qty: 1 }] },
  { name: 'Vine Choker',        icon: '🌿', hp: 115, atk: 22, def: 9,  xp: 180, loot: [{ itemKey: 'rune_flora', qty: 1 }] },
  { name: 'Bramble Husk',       icon: '🌿', hp: 150, atk: 20, def: 13, xp: 205, loot: [{ itemKey: 'rune_flora', qty: 1 }] },
  // Metal
  { name: 'Iron Crawler',       icon: '⚙️', hp: 145, atk: 22, def: 14, xp: 210, loot: [{ itemKey: 'rune_ferro', qty: 1 }] },
  { name: 'Ferro Sentinel',     icon: '⚙️', hp: 155, atk: 21, def: 15, xp: 215, loot: [{ itemKey: 'rune_ferro', qty: 1 }] },
  { name: 'Scrap Behemoth',     icon: '⚙️', hp: 170, atk: 23, def: 12, xp: 230, loot: [{ itemKey: 'rune_ferro', qty: 1 }] },
  // Arcane
  { name: 'Glyph Sentinel',     icon: '✨', hp: 110, atk: 22, def: 11, xp: 190, loot: [{ itemKey: 'rune_lux', qty: 1 }] },
  { name: 'Lore Phantom',       icon: '✨', hp: 100, atk: 23, def: 9,  xp: 180, loot: [{ itemKey: 'rune_lux', qty: 1 }] },
  { name: 'Sigil Echo',         icon: '✨', hp: 125, atk: 24, def: 10, xp: 205, loot: [{ itemKey: 'rune_lux', qty: 1 }] },
  // Shadow
  { name: 'Veil Stalker',       icon: '🌑', hp: 105, atk: 25, def: 7,  xp: 195, loot: [{ itemKey: 'rune_umbra', qty: 1 }] },
  { name: 'Hollow Watcher',     icon: '🌑', hp: 120, atk: 23, def: 9,  xp: 195, loot: [{ itemKey: 'rune_umbra', qty: 1 }] },
  { name: 'Umbral Hound',       icon: '🌑', hp: 115, atk: 24, def: 8,  xp: 200, loot: [{ itemKey: 'rune_umbra', qty: 1 }] },
  // Poison
  { name: 'Plague Crawler',     icon: '☠️', hp: 125, atk: 21, def: 10, xp: 190, loot: [{ itemKey: 'rune_venin', qty: 1 }] },
  { name: 'Spore Husk',         icon: '☠️', hp: 115, atk: 22, def: 9,  xp: 185, loot: [{ itemKey: 'rune_venin', qty: 1 }] },
  { name: 'Toxin Wraith',       icon: '☠️', hp: 100, atk: 24, def: 7,  xp: 180, loot: [{ itemKey: 'rune_venin', qty: 1 }] },
]

// One-off random pick. Picks 5 distinct enemies (no repeats per run).
function pickFiveDistinct() {
  const shuffled = [...FARMING_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 5)
}

// The 5 wave nodes. Each gets its `enemy` field rewritten by
// randomizeFarmingWaves() before the player engages. Default values
// are placeholders so the engine won't crash if randomize fails.
const WAVE_NODES = {
  farming_wave_1: {
    id: 'farming_wave_1', type: 'combat',
    text: `A figure resolves from the haze — first contact.`,
    enemy: FARMING_POOL[0],
    onWin: 'farming_wave_2', onLose: 'farming_defeat',
  },
  farming_wave_2: {
    id: 'farming_wave_2', type: 'combat',
    text: `Another shape pushes through. Wave two.`,
    enemy: FARMING_POOL[1],
    onWin: 'farming_wave_3', onLose: 'farming_defeat',
  },
  farming_wave_3: {
    id: 'farming_wave_3', type: 'combat',
    text: `Halfway. The air is wrong with residue.`,
    enemy: FARMING_POOL[2],
    onWin: 'farming_wave_4', onLose: 'farming_defeat',
  },
  farming_wave_4: {
    id: 'farming_wave_4', type: 'combat',
    text: `Wave four. The grounds are wearing thin.`,
    enemy: FARMING_POOL[3],
    onWin: 'farming_wave_5', onLose: 'farming_defeat',
  },
  farming_wave_5: {
    id: 'farming_wave_5', type: 'combat',
    text: `Last one. Make it count.`,
    enemy: FARMING_POOL[4],
    onWin: 'farming_complete', onLose: 'farming_defeat',
  },
}

// Call before the player enters the hub. Rewrites enemy on each wave
// node with fresh random picks. Wave 5 is the "boss" of the run — bumps
// HP and XP by ~15% so the final fight feels meaningful.
export function randomizeFarmingWaves() {
  const picks = pickFiveDistinct()
  const keys = ['farming_wave_1','farming_wave_2','farming_wave_3','farming_wave_4','farming_wave_5']
  keys.forEach((key, idx) => {
    const base = picks[idx]
    const isLast = idx === 4
    WAVE_NODES[key].enemy = {
      ...base,
      // Wave 5 gets a 15% boost to HP + XP for "boss" feel.
      hp: isLast ? Math.round(base.hp * 1.15) : base.hp,
      xp: isLast ? Math.round(base.xp * 1.15) : base.xp,
    }
  })
}

// Hub + completion + defeat nodes.
const STORY_NODES = {
  farming_grounds_hub: {
    id: 'farming_grounds_hub', type: 'story',
    text: `The Farming Grounds — an old plaza behind the district that the elementals seem drawn to. You don't know why. You also know better than to ask.

Whatever wanders here, you can fight here. Five engagements per run. Mixed elements. The plaza doesn't care which.

Your interface offers a single notice:

"Combat XP only. No alliance log entries. No moral changes. The System still watches, but does not record this place."`,
    choices: [
      { label: 'Begin a run — Wave 1', sub: 'Five random elemental engagements', next: 'farming_wave_1' },
      { label: 'Leave the grounds', sub: 'Return to the district', next: 'district_hub' },
    ],
  },
  farming_complete: {
    id: 'farming_complete', type: 'story',
    text: `Five waves down. The plaza is quiet again. Residue settles. The interface ticks over to standby.

The XP is yours.`,
    choices: [
      { label: 'Begin another run', sub: 'Reset and re-engage', next: 'farming_grounds_hub' },
      { label: 'Return to the district', next: 'district_hub' },
    ],
  },
  farming_defeat: {
    id: 'farming_defeat', type: 'story',
    text: `The plaza spits you back out. The grounds don't kill, exactly — but they don't owe you anything either.

You're whole. You're not winning here today.`,
    choices: [
      { label: 'Return to the district', next: 'district_hub' },
    ],
  },
}

// Default export: merged nodes. The hub render code in ch2 index.js
// references the IDs above; the wave nodes get their `enemy` rewritten
// at run start by randomizeFarmingWaves().
export default {
  ...STORY_NODES,
  ...WAVE_NODES,
}
