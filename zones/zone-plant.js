// zone-plant.js — Flora | Garden Centre
export default {

  zone_plant: {
    id: 'zone_plant', type: 'story',
    text: `The garden center near the south exit is the only place in the district where things are still growing. The System didn't stop biology. It just stopped the people.

The plants have had a week to themselves. Vines have crossed the aisle. A fig tree in the back has dropped two cycles of fruit. Ferns have unfurled in the fluorescent light that's still running on generator power. It smells like soil and green things and something almost sweet.

The zone is in the back, past the fig tree. You don't need directions — you follow the warmth. Living things generate heat. This much life together generates a lot of it.

Your interface: ELEMENTAL ZONE — FLORA. Resonance check: Defense-Decay alignment detected. Loading...

At the trial's center: a root system has broken through the floor tiles — an overgrowth that's cracked the concrete and spread across the path. The fast route is straight through it. Destroying it clears the way. Navigating around it costs time and health — but a secondary note in your interface reads: if left intact, the root structure will grow further through the zone's remaining corridors and reduce enemy effectiveness by 10% for the rest of the chapter.

FLORA SKILL TREE — UNLOCKED.
Elemental Focus: Plant. Branch variants: Defense, Decay, Flow, Arcane, Offense.`,
    xp: 120,
    choices: [
      { label: 'Destroy the roots. Clear the path.', sub: 'Fast — the chapter-wide debuff on enemies does not activate', next: 'zone_plant_destroy' },
      { label: 'Navigate around. Leave the roots.',  sub: 'Costs health — enemies in future zones take 10% more damage this chapter', next: 'zone_plant_unlock' },
    ],
  },

  zone_plant_destroy: {
    id: 'zone_plant_destroy', type: 'story',
    text: `The roots tear cleanly. The path is open.

The plants don't react. They were going to keep growing regardless.

FLORA TREE UNLOCKED.

FLORA BINDING ACTIVE:
HP regeneration +3% per combat turn.
Maximum HP −15%.

The Flora tree is the only one with nodes that have dual character — things that are both growth and decay, both protective and corrosive. Roots that stabilize and roots that split stone. Vines that support and vines that constrict. The System is honest about what plant life actually is.

You pick up a fallen fig on your way out. It's good.

Your interface: Commitment to Flora recorded.`,
    xp: 50,
    rewards: [{ itemKey: 'rune_flora', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

  zone_plant_unlock: {
    id: 'zone_plant_unlock', type: 'story',
    text: `Navigating around costs you. The zone's growth presses in from every side and you take real chip damage finding the path. By the time you reach the node interface you're lower than you'd like.

But the root structure behind you is intact — and already, on your interface, a faint green indicator: Zone flora active. Enemy attrition −10% district-wide.

FLORA TREE UNLOCKED.

FLORA BINDING ACTIVE:
HP regeneration +3% per combat turn.
Maximum HP −15%.

The plants don't react. They were going to keep growing regardless. The tree didn't need your permission either.

You pick up a fallen fig on your way out. It's good. Fresh.

Your interface: Commitment to Flora recorded. Long-term growth logged.`,
    xp: 80,
    rewards: [{ itemKey: 'rune_flora', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

}
