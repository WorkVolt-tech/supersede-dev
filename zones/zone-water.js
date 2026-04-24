// zone-water.js — Aqua | Food Court Basement
export default {

  zone_water: {
    id: 'zone_water', type: 'story',
    text: `The food court basement is flooded — ankle height, cold, slightly luminescent. The pipes that burst have been burst for what feels like longer than they should have been.

At the bottom of the steps, the water is completely still despite the dripping above. A circular space, low ceiling. The walls are covered in condensation that forms patterns too regular to be accidental.

Your interface: ELEMENTAL ZONE — AQUA. Resonance check: Patience threshold detected. Loading...

Midway through the zone there's a wedged door — waterlogged, swollen shut. Behind it, sound: someone moving. A survivor. The door is too heavy to force without cost.

AQUA SKILL TREE — UNLOCKED.
Elemental Focus: Water. Branch variants: Defense, Flow, Arcane, Offense, Decay.`,
    xp: 120,
    choices: [
      { label: 'Force the door open. Get them out.', sub: 'Costs significant health and items — they become a passive combat ally', next: 'zone_water_rescue' },
      { label: 'Leave the door. Move forward.',      sub: 'The path continues without them', next: 'zone_water_unlock' },
    ],
  },

  zone_water_rescue: {
    id: 'zone_water_rescue', type: 'story',
    text: `It takes four attempts. The water resistance and the door's weight fight you the whole way. By the time it opens you've taken real damage and burned through a resource you didn't plan to spend.

The survivor — a player, young, badly shaken — slides out. They don't say much. Just: "I've been in there since yesterday."

They follow you through the rest of the zone. Don't speak. Don't get in the way.

At the node interface:

AQUA TREE UNLOCKED.

AQUA BINDING ACTIVE:
25% damage reduction when below 40% HP.
Maximum AP pool +10%.

A soft ripple moves out from you across the standing water. Perfect circles, overlapping.

Your interface: Commitment to Aqua recorded. Cooperative action logged.`,
    xp: 100,
    rewards: [{ itemKey: 'rune_aqua', qty: 2 }, { itemKey: 'aqua_cord', qty: 1 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

  zone_water_unlock: {
    id: 'zone_water_unlock', type: 'story',
    text: `You leave the door. Move past it. Whatever sound was behind it fades as you continue deeper.

The unlock is quiet. A soft ripple moves across the standing water — out from you in all directions, reaching the walls, coming back.

AQUA TREE UNLOCKED.

AQUA BINDING ACTIVE:
25% damage reduction when below 40% HP.
Maximum AP pool +10%.

There's something restful about this zone. Like it doesn't need you to be anything other than still.

You go back up the steps. The water level looks the same. It will probably always look the same.

Your interface: Commitment to Aqua recorded.`,
    xp: 50,
    rewards: [{ itemKey: 'rune_aqua', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

}
