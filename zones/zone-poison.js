// zone-poison.js — Venom | Pharmacy (Anchor Store)
export default {

  zone_poison: {
    id: 'zone_poison', type: 'story',
    text: `The pharmacy section of the district's anchor department store. Not looted — the System sealed it early. The shelves are intact. The zone has formed in the compounding room at the back, where the temperature is controlled and the air smells chemical rather than biological.

The door is locked but not System-locked. A standard key lock, the kind a person put there. The kind a person could force.

Inside: rows of labeled compounds, refrigeration units still running, the particular silence of a room where things are preserved. The zone is visible immediately — a low shimmer across the work surfaces, a persistent faint environmental damage reading on your interface.

The zone deals constant low damage from the moment you enter. No warning. No escalation. Just — present.

Your interface: ELEMENTAL ZONE — VENOM. Resonance check: Attrition alignment detected. Loading...

At the trial's center: an antidote — one dose, which fully neutralizes the zone's environmental DoT for the duration of any fight here. And behind it, a secondary compound — unstable, labeled with a handling warning. Your interface reads: If carried and applied in the Twin Judges fight, deals 5% of both Judges' max HP as poison per turn for 3 turns. Application cost: 25% of your own max HP.

VENOM SKILL TREE — UNLOCKED.
Elemental Focus: Poison. Branch variants: Decay, Offense, Flow, Arcane, Defense.`,
    xp: 120,
    choices: [
      { label: 'Take the antidote only.',             sub: 'Safe — neutralizes zone DoT, no self-harm required', next: 'zone_poison_antidote' },
      { label: 'Take the compound. Accept the cost.', sub: 'Carries to boss fight — costs 25% HP to apply, poisons both Judges', next: 'zone_poison_compound' },
      { label: 'Take neither. Leave through it.',     sub: 'No resources spent — zone DoT persists, nothing carried', next: 'zone_poison_unlock' },
    ],
  },

  zone_poison_antidote: {
    id: 'zone_poison_antidote', type: 'story',
    text: `The antidote neutralizes the DoT cleanly. The shimmer in the room settles.

VENOM TREE UNLOCKED.

VENOM BINDING ACTIVE:
All attacks apply poison — 3% of target's max HP per turn, 2 turns.
Own HP regeneration permanently halved.

The Venom tree is not what you expected. Patient rather than explosive. Forty nodes built around the concept of damage that compounds over time — weak in short encounters, severe in extended ones.

The secondary compound is still on the shelf. You leave it there.

Your interface: Commitment to Venom recorded.`,
    xp: 50,
    rewards: [{ itemKey: 'rune_venom', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

  zone_poison_compound: {
    id: 'zone_poison_compound', type: 'story',
    text: `The compound requires careful handling — even carrying it costs you something. The warning label was accurate.

You take it. Your interface registers it with a flag: Unstable compound — active payload. Apply at 25% HP cost. Judge encounter: dual DoT 5%/turn × 3 turns.

The zone's DoT continues while you finish the trial. You don't have the antidote. You work through it.

VENOM TREE UNLOCKED.

VENOM BINDING ACTIVE:
All attacks apply poison — 3% of target's max HP per turn, 2 turns.
Own HP regeneration permanently halved.

By the time you reach the exit you're running lower than you started. The compound is in your pack. The math will come due later.

Your interface: Commitment to Venom recorded. Compound: Secured.`,
    xp: 80,
    rewards: [{ itemKey: 'rune_venom', qty: 2 }, { itemKey: 'venom_compound', qty: 1 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

  zone_poison_unlock: {
    id: 'zone_poison_unlock', type: 'story',
    text: `You take neither. Move through the zone under the environmental DoT, conserving everything else.

The shimmer doesn't stop. You manage it.

VENOM TREE UNLOCKED.

VENOM BINDING ACTIVE:
All attacks apply poison — 3% of target's max HP per turn, 2 turns.
Own HP regeneration permanently halved.

The Venom tree is patient. Forty nodes built around attrition — the concept of damage that doesn't announce itself but compounds until it can't be ignored. The System is accurate about what poison actually is.

You exit through the locked door. Leave it the way it was.

Your interface: Commitment to Venom recorded.`,
    xp: 50,
    rewards: [{ itemKey: 'rune_venom', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

}
