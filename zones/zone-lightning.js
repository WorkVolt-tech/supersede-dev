// zone-lightning.js — Volt | Electronics Hub
export default {

  zone_lightning: {
    id: 'zone_lightning', type: 'story',
    text: `The electronics hub. Every screen is on — actual channels, actual content, as if the world outside is still broadcasting. News. A cooking show. A documentary about deep-sea creatures. The world going on without knowing what's happening here.

In the back, between two server racks that hum with too much energy, arcs of electricity move between the racks — not dangerous, but close.

Your interface: ELEMENTAL ZONE — VOLT. Resonance check: Flow alignment detected. Loading...

At the trial's core: a live power junction. Two options present themselves on your interface.

VOLT SKILL TREE — UNLOCKED.
Elemental Focus: Lightning. Branch variants: Flow, Offense, Arcane, Defense, Decay.`,
    xp: 120,
    choices: [
      { label: 'Channel through the junction. Open the path.',  sub: 'Fast — releases a pulse dealing 15 damage to all active district players', next: 'zone_lightning_pulse' },
      { label: 'Discharge it safely into yourself.',            sub: 'Costs 20% max HP — others unaffected', next: 'zone_lightning_unlock' },
    ],
  },

  zone_lightning_pulse: {
    id: 'zone_lightning_pulse', type: 'story',
    text: `The junction activates. The path opens instantly — a clean, precise connection.

A fraction of a second later, a pulse rolls outward through the district's electrical infrastructure. You feel it leave. You don't feel what it hits.

VOLT TREE UNLOCKED.

VOLT BINDING ACTIVE:
Attacks following a turn without attacking deal +30% damage.
First action each combat round: +25% crit chance.
Physical resistance −10%.

Your interface registers a secondary line, quiet: Systemic action logged. Morren weight +3.

On the way out, one of the screens on the television wall has gone dark. You're not sure which channel it was.

Your interface: Commitment to Volt recorded.`,
    xp: 80,
    rewards: [{ itemKey: 'rune_volt', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

  zone_lightning_unlock: {
    id: 'zone_lightning_unlock', type: 'story',
    text: `The discharge goes through you. It's not pleasant. Your HP drops — real cost, real pain, manageable.

The junction neutralizes safely. No pulse leaves the building.

VOLT TREE UNLOCKED.

VOLT BINDING ACTIVE:
Attacks following a turn without attacking deal +30% damage.
First action each combat round: +25% crit chance.
Physical resistance −10%.

The arcs between the server racks settle into a low, steady hum. Like something that was agitated, now calmed.

On the way out, the wall of screens is all still running. All of them.

Your interface: Commitment to Volt recorded. Kaelith weight +2.`,
    xp: 50,
    rewards: [{ itemKey: 'rune_volt', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

}
