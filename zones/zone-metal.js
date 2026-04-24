// zone-metal.js — Ferro | Hardware Megastore
export default {

  zone_metal: {
    id: 'zone_metal', type: 'story',
    text: `The hardware megastore is the largest building in the district by footprint. Twelve aisles. High ceilings. The smell of machine oil and cut lumber and the specific clean smell of new tools still in packaging.

Everything is exactly where it was. No looting here — either no one thought of it or someone made sure no one could get to it. The security shutters were opened deliberately, not forced. Whoever opened them had a key.

The metal zone is in the power tool aisle. The resonance here is precision and function — the particular kind of beauty that comes from something that does exactly one thing extremely well.

Your interface: ELEMENTAL ZONE — FERRO. Resonance check: Offense-Arcane alignment detected. Loading...

At the trial's center: a fully functional tool cache attached to a structural support column. Valuable, clearly useful. A note on the security panel from whoever opened the store reads: "Took what I needed. Left the rest. It seemed right."

Taking the tools risks destabilizing the second floor. Your interface registers: Structural load-bearing. Removal may cause ceiling collapse — significant damage, brief stun.

FERRO SKILL TREE — UNLOCKED.
Elemental Focus: Metal. Branch variants: Offense, Arcane, Defense, Flow, Decay.`,
    xp: 120,
    choices: [
      { label: 'Take the tools. Accept the structural risk.', sub: 'Risk ceiling collapse — significant damage and stun if it triggers', next: 'zone_metal_take' },
      { label: 'Leave them. What you need is enough.',        sub: 'The note was right. The structure stays intact.', next: 'zone_metal_unlock' },
    ],
  },

  zone_metal_take: {
    id: 'zone_metal_take', type: 'story',
    text: `You pull the cache free. The column shifts — a sound above you, then a section of ceiling drops into the space you just vacated.

You weren't in it. Just barely.

The tools are real and precise and heavy in your pack.

FERRO TREE UNLOCKED.

FERRO BINDING ACTIVE:
+20% damage on second consecutive attack vs same target.
Each additional attack vs same target: +5% damage (stacks ×4 max).
First attack vs any new target: standard damage.

The Ferro tree is exactly as precise as you'd expect. Forty nodes, no ambiguity. Each one does a specific thing. The descriptions are technical. The System respects the nature of metal.

Your interface: Commitment to Ferro recorded.`,
    xp: 80,
    rewards: [{ itemKey: 'rune_ferro', qty: 2 }, { itemKey: 'scrap_metal', qty: 3 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

  zone_metal_unlock: {
    id: 'zone_metal_unlock', type: 'story',
    text: `You pick up a wrench from an open display. Good weight. You put it back exactly where you found it.

The note was right.

FERRO TREE UNLOCKED.

FERRO BINDING ACTIVE:
+20% damage on second consecutive attack vs same target.
Each additional attack vs same target: +5% damage (stacks ×4 max).
First attack vs any new target: standard damage.

The Ferro tree is exactly as precise as you'd expect. Forty nodes. No ambiguity. Technical descriptions. The System respects the nature of metal.

On your way out you stop at the front of the store. The security panel note is still there: "Took what I needed. Left the rest. It seemed right."

You go back into the district.

Your interface: Commitment to Ferro recorded.`,
    xp: 50,
    rewards: [{ itemKey: 'rune_ferro', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

}
