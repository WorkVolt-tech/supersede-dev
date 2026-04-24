// zone-wind.js — Aero | Glass Atrium
export default {

  zone_wind: {
    id: 'zone_wind', type: 'story',
    text: `The atrium is the largest interior space in the district — a glass-roofed corridor between two anchor stores, maybe sixty meters long. The roof caved on the west end three panels deep. The crossdraft that moves through has been moving since and has set up a permanent wind through the space.

It carries the smell of the outside — real outside, past the district boundaries.

The wind zone is where the crossdraft is strongest, where the air pressure makes a sound like a long held note. It doesn't announce itself. You walk into it and your interface registers immediately.

Your interface: ELEMENTAL ZONE — AERO. Resonance check: Flow-Arcane alignment detected. Loading...

Midway through: another player's abandoned equipment — a full pack, dropped mid-trial. The player who left it isn't here anymore. The equipment is valuable but heavy. Your interface notes: carrying it will reduce your movement-dependent abilities this trial.

AERO SKILL TREE — UNLOCKED.
Elemental Focus: Wind. Branch variants: Flow, Arcane, Defense, Offense, Decay.`,
    xp: 120,
    choices: [
      { label: 'Take the pack. Carry it out.', sub: "Reduces mobility for the trial's second half — significant resource gain", next: 'zone_wind_carry' },
      { label: 'Leave it. Move clean.',        sub: 'Nothing gained, nothing slowed', next: 'zone_wind_unlock' },
    ],
  },

  zone_wind_carry: {
    id: 'zone_wind_carry', type: 'story',
    text: `The pack is heavier than it looked. The crossdraft fights you the whole second half — not dramatically, just steadily. Every movement costs a little more than it should.

You get through. Slower than you'd have liked.

AERO TREE UNLOCKED.

AERO BINDING ACTIVE:
+2 actions per combat round before the enemy acts.
Critical hit rate +10%.
Mobility abilities cost −15% AP.

The zone crossdraft doesn't change when the unlock happens. It was going to keep doing this regardless of you.

The pack has useful contents. Someone left a good kit behind.

Your interface: Commitment to Aero recorded.`,
    xp: 80,
    rewards: [{ itemKey: 'rune_aero', qty: 2 }, { itemKey: 'stabilizer_pack', qty: 1 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

  zone_wind_unlock: {
    id: 'zone_wind_unlock', type: 'story',
    text: `You leave the pack. Move clean through the second half.

The Aero tree has forty nodes spread in a pattern that feels less linear than the others — more lateral. Options that branch sideways before they branch upward. Wind goes where it needs to.

AERO TREE UNLOCKED.

AERO BINDING ACTIVE:
+2 actions per combat round before the enemy acts.
Critical hit rate +10%.
Mobility abilities cost −15% AP.

Standing in the crossdraft for a moment. Somewhere past the district boundary it smells like rain that hasn't arrived yet.

You could use some rain.

Your interface: Commitment to Aero recorded.`,
    xp: 50,
    rewards: [{ itemKey: 'rune_aero', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

}
