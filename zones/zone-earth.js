// zone-earth.js — Terra | Parking Structure
export default {

  zone_earth: {
    id: 'zone_earth', type: 'story',
    text: `The parking structure is three levels of poured concrete and the particular silence of spaces built for cars, now empty of them. Your footsteps echo in a way that makes you sound alone even if you're not.

Level two. The zone is between two structural pillars with hairline cracks — not dangerous, just present. Evidence of weight over time.

Less dramatic than the others. Just a space where the concrete floor has cracked in a specific pattern, and through the cracks something slow and warm is moving.

Your interface: ELEMENTAL ZONE — TERRA. Resonance check: Endurance alignment detected. Loading...

In the trial's midpoint: a collapsed section of flooring. Embedded in it, a cache of building materials — salvage, quality components, clearly useful. Recoverable, but only from a structurally compromised section. A handwritten note nearby reads simply: "Load-bearing. Don't."

TERRA SKILL TREE — UNLOCKED.
Elemental Focus: Earth. Branch variants: Defense, Offense, Flow, Decay, Arcane.`,
    xp: 120,
    choices: [
      { label: 'Pull the cache out. Risk the collapse.', sub: 'Significant damage + stun — cache can be given to Builders for alliance bonus', next: 'zone_earth_pull' },
      { label: 'Leave it. Move past the section.',       sub: 'No risk — the structure stays intact', next: 'zone_earth_unlock' },
    ],
  },

  zone_earth_pull: {
    id: 'zone_earth_pull', type: 'story',
    text: `You pull it out. The section shifts — a crack runs from floor to ceiling fast, and the ceiling drops a section of itself onto the space you just occupied.

You weren't in it. Barely.

The cache is in your hands. Real materials. The Builders' inventory interface appears as an option — you can log it for their stockpile now or carry it out.

At the node interface:

TERRA TREE UNLOCKED.

TERRA BINDING ACTIVE:
Maximum HP +20.
Physical damage reduction +10%.
Attack speed −1 action per round.

The cracks in the floor have stopped spreading. The warmth that was moving through them has gone somewhere else.

Your interface: Commitment to Terra recorded.`,
    xp: 100,
    rewards: [{ itemKey: 'rune_terra', qty: 2 }, { itemKey: 'scrap_metal', qty: 4 }],
    choices: [
      { label: 'Log the materials to the Builders', sub: 'Alliance bonus — Kaelith weight +3, moral +5', next: 'zone_earth_builders', moral: 5 },
      { label: 'Keep them and continue', next: 'district_hub' },
    ],
  },

  zone_earth_builders: {
    id: 'zone_earth_builders', type: 'story',
    text: `The materials log to the Builders' inventory remotely. Sera's interface confirms receipt a minute later with a single line: "This helps. Thank you."

No ceremony. Just the fact of it.

Your interface: Alliance contribution recorded. Kaelith weight +3.

You press one hand briefly to the pillar on your way out. Cold concrete, decades old. Still holding — barely.`,
    xp: 60,
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

  zone_earth_unlock: {
    id: 'zone_earth_unlock', type: 'story',
    text: `You move past the section without disturbing it. The note was right. You don't test it.

TERRA TREE UNLOCKED.

TERRA BINDING ACTIVE:
Maximum HP +20.
Physical damage reduction +10%.
Attack speed −1 action per round.

The Terra tree is straightforward in the way that deep things can be. No tricks. Forty nodes. Wall. Weight. Foundation. Growth.

You press one hand briefly to a pillar on your way out. Cold concrete, decades old. Still holding.

Birds have landed on the upper level. They've been there a while.

Your interface: Commitment to Terra recorded.`,
    xp: 50,
    rewards: [{ itemKey: 'rune_terra', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

}
