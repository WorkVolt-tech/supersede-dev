// zone-shadow.js — Umbra | Closed Cinema
export default {

  zone_shadow: {
    id: 'zone_shadow', type: 'story',
    text: `The cinema is shut. Officially closed for renovations — a sign on the door is dated eight months ago. Someone opened it anyway. Not forced. Just open.

Inside it's dark the way cinema lobbies are dark at 3am. Not scary. Just past its purpose.

The zone is in one of the smaller screening rooms. You find it by following a current of air that shouldn't exist underground. The door is already open.

The screening room is completely dark except for where the zone is — a circle of shadow deeper than the room around it. Not a void. Something present in the absence.

Your interface: ELEMENTAL ZONE — UMBRA. Resonance check: Decay alignment detected.

Partway in, a second door appears — unmarked, unlit, not referenced in any of the trial's progression. The correct exit is clearly marked. This second door isn't.

UMBRA SKILL TREE — UNLOCKED.
Elemental Focus: Shadow. Branch variants: Decay, Offense, Flow, Arcane, Defense.`,
    xp: 120,
    choices: [
      { label: 'Go through the unmarked door.', sub: 'Unknown destination — costs time and health to investigate', next: 'zone_shadow_hidden' },
      { label: 'Take the correct exit.',         sub: 'Efficient — the trial concludes cleanly', next: 'zone_shadow_unlock' },
    ],
  },

  zone_shadow_hidden: {
    id: 'zone_shadow_hidden', type: 'story',
    text: `The unmarked door leads to a dead end. A narrow storage corridor, walls of old film reel canisters, the smell of acetate and dust.

And in the back, something the trial never mentioned: a secondary cache. Small. Three items, one of them a rare material, none of them labeled in any zone manifest. It doesn't appear in your quest log. It never will.

The zone acknowledges it with silence.

You take it. You take the long way back through the darkness. By the time you reach the node interface you've lost some health and more time.

UMBRA TREE UNLOCKED.

UMBRA BINDING ACTIVE:
Passive dodge chance +20% vs physical attacks.
Healing from items and skills −15%.
First-turn attacks cannot be countered.

Your interface: Commitment to Umbra recorded. Secondary cache: unlogged.`,
    xp: 100,
    rewards: [{ itemKey: 'rune_umbra', qty: 3 }, { itemKey: 'rare_component', qty: 1 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

  zone_shadow_unlock: {
    id: 'zone_shadow_unlock', type: 'story',
    text: `The circle of shadow closes gently — like a hand unclenching.

UMBRA TREE UNLOCKED.

UMBRA BINDING ACTIVE:
Passive dodge chance +20% vs physical attacks.
Healing from items and skills −15%.
First-turn attacks cannot be countered.

The Umbra tree doesn't announce itself the way the other trees did. Forty nodes, each one slightly harder to read than the last. The System isn't hiding anything — it's just being honest about what decay and shadow actually are. Patient. Precise. Costly in particular ways.

When you stand to leave, the door to the hallway is lit by the lobby lights. Warmer than when you came in.

Your interface: Commitment to Umbra recorded.`,
    xp: 50,
    rewards: [{ itemKey: 'rune_umbra', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

}
