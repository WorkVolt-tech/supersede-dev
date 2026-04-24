// zone-fire.js — Ignis | Kitchen Supply Store
export default {

  zone_fire: {
    id: 'zone_fire', type: 'story',
    text: `The kitchen supply store still smells like copper and char. The fire came through here hard — shelves warped, glass melted into the floor in strange shapes, a row of copper pots that are now abstract sculpture.

But the back of the store is untouched. A door, slightly warm to the touch. No lock. Just the door and what's behind it.

When you push it open, the air changes. Not hot — charged. Like something powerful at rest.

Your interface: ELEMENTAL ZONE — IGNIS. Resonance check: Offense alignment detected. Loading...

Inside: a narrow corridor of hanging fire that doesn't burn. Near the end, a sealed glass case holds a supply cache — food, a med pack, two item upgrades. A second path branches left. Longer. The walls there are scored from something that moved through fast.

IGNIS SKILL TREE — UNLOCKED.
Elemental Focus: Fire. Branch variants: Offense, Defense, Flow, Arcane, Decay.`,
    xp: 120,
    choices: [
      { label: 'Break the glass. Take the cache. Fast path.', sub: 'Decisive — gain supplies, nothing wasted on detours', next: 'zone_fire_break' },
      { label: 'Take the long path. Leave the glass.',        sub: 'Costs health, leaves the cache for whoever comes next', next: 'zone_fire_unlock' },
    ],
  },

  zone_fire_break: {
    id: 'zone_fire_break', type: 'story',
    text: `The glass is thick. It takes two strikes. The sound echoes in the sealed corridor.

The supplies are real and useful. You take them and move through the fast path to the node interface.

IGNIS TREE UNLOCKED.

IGNIS BINDING ACTIVE:
Primary strike damage +15%.
Health regeneration −20%.

The fire in the corridor dims. The broken glass catches the light behind you.

Your interface adds a single line: Commitment to Ignis recorded.`,
    xp: 80,
    rewards: [{ itemKey: 'rune_ignis', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

  zone_fire_unlock: {
    id: 'zone_fire_unlock', type: 'story',
    text: `The long path costs you. The scored walls are recent — navigating without catching the residual heat requires focus and takes something out of you.

The node interface acknowledges you differently than it would have at the glass case. Not worse. Just different — a longer beat before it opens, like it's reading something more complicated.

IGNIS TREE UNLOCKED.

IGNIS BINDING ACTIVE:
Primary strike damage +15%.
Health regeneration −20%.

On the way out the glass case is intact. The cache still behind it. Left for whoever comes next.

Your interface adds a single line: Commitment to Ignis recorded.`,
    xp: 50,
    rewards: [{ itemKey: 'rune_ignis', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

}
