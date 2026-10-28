// zone-shadow.js — Umbra | Closed Cinema | Boss: The Hollow Reaper
export default {

  zone_shadow: {
    id: 'zone_shadow', type: 'story',
    text: `The cinema. Closed for renovations eight months ago — a sign on the door dated before the System arrived. Someone opened it anyway. Not forced. Just open.

Inside it's dark the way cinema lobbies are dark at 3am. Not scary. Just past its purpose.

A current of air from somewhere below leads you to the zone.

Your interface: ELEMENTAL ZONE — UMBRA. Resonance check: Decay alignment detected.

Partway in: an unmarked door. The correct exit is clearly marked. This one isn't. Scratched into the wall beside it: "This path was here before you."

UMBRA SKILL TREE — UNLOCKED.`,
    xp: 120,
    choices: [
      { label: 'Go through the unmarked door.', sub: 'Unknown — costs health. May reward.', next: 'zone_shadow_hidden' },
      { label: 'Take the correct exit.', next: 'zone_shadow_unlock' },
    ],
  },

  zone_shadow_hidden: {
    id: 'zone_shadow_hidden', type: 'story', hpLoss: 15,
    text: `A storage corridor. Film reel canisters, acetate, dust. In the back: a secondary cache. Small. Items that don't appear in any manifest.

You take them. The way back costs you health.

UMBRA TREE UNLOCKED. UMBRA BINDING: Passive dodge +20% vs physical. Item/skill healing −15%. First-turn attacks uncounterable.`,
    xp: 100, rewards: [{ itemKey: 'rune_umbra', qty: 3 }, { itemKey: 'rare_component', qty: 1 }],
    choices: [{ label: 'Push deeper into the cinema', next: 'zone_shadow_explore_1' }],
  },

  zone_shadow_unlock: {
    id: 'zone_shadow_unlock', type: 'story',
    text: `The circle of shadow closes gently.

UMBRA TREE UNLOCKED. UMBRA BINDING: Passive dodge +20% vs physical. Item/skill healing −15%. First-turn attacks uncounterable.`,
    xp: 50, rewards: [{ itemKey: 'rune_umbra', qty: 2 }],
    choices: [{ label: 'Push deeper into the cinema', next: 'zone_shadow_explore_1' }],
  },

  zone_shadow_explore_1: {
    id: 'zone_shadow_explore_1', type: 'story',
    text: `The lobby. Popcorn machine still warm — whatever powers this zone powers that too. Concession stand stripped bare except for a neat row of cups someone arranged.

A Shade Drifter moves through the lobby — barely visible, just a displacement in the air, a shadow where there's no source for one. It moves slowly. It's looking for something.

It finds you.`,
    xp: 40,
    choices: [
      { label: 'Fight the Shade Drifter', next: 'zone_shadow_enemy_1' },
      { label: 'Stand completely still — let it pass through you', sub: 'Costs HP — it ignores you after', next: 'zone_shadow_still' },
      { label: 'A shape in the dark — Hunter scouts hiding in the shadow cover', sub: 'Voss\'s people. Confront them.', next: 'zone_shadow_hunters' },
    ],
  },

  zone_shadow_still: {
    id: 'zone_shadow_still', type: 'story', hpLoss: 12,
    text: `You hold perfectly still. The Drifter reaches you — passes through. Cold, wrong-feeling, gone in three seconds.

You're lower on HP. But it doesn't look back.`,
    xp: 30,
    choices: [{ label: 'Continue', next: 'zone_shadow_explore_2' }],
  },

  zone_shadow_enemy_1: {
    id: 'zone_shadow_enemy_1', type: 'combat',
    text: `The Shade Drifter sharpens — becoming more present, more solid, more dangerous.`,
    enemy: { name: 'Shade Drifter', icon: '🌑', hp: 88, atk: 19, def: 7, xp: 95,
      loot: [{ itemKey: 'rune_umbra', qty: 1 }] },
    onWin: 'zone_shadow_explore_2', onLose: 'zone_shadow_explore_1',
  },

  zone_shadow_explore_2: {
    id: 'zone_shadow_explore_2', type: 'story',
    text: `Screening Room 2. The door is open. Inside: everything has been rearranged — all the chairs are facing the wall instead of the screen. Someone did this deliberately.

In the projection booth window above: a faint light. Someone left a lantern. Under it: a bag with supplies, and a note: "If you can read this you've made it further than the others. Don't go to the main screen."

Your interface tags a shadow formation in the corner — condensed umbra residue.`,
    xp: 60,
    choices: [
      { label: 'Take the bag and harvest the formation', next: 'zone_shadow_take_both' },
      { label: 'Take only the bag', next: 'zone_shadow_bag' },
      { label: 'Leave both', next: 'zone_shadow_corridor' },
    ],
  },

  zone_shadow_take_both: {
    id: 'zone_shadow_take_both', type: 'story',
    text: `The formation releases cleanly — whoever left it didn't seal it. You take the bag too. The note said don't go to the main screen. You pocket it and keep moving.`,
    xp: 50, rewards: [{ itemKey: 'rune_umbra', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_shadow_corridor' }],
  },

  zone_shadow_bag: {
    id: 'zone_shadow_bag', type: 'story',
    text: `The bag has a med pack and a small cache of supplies. You leave the formation — it pulses once as you go.`,
    xp: 30, rewards: [{ itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_shadow_corridor' }],
  },

  zone_shadow_corridor: {
    id: 'zone_shadow_corridor', type: 'story',
    text: `The corridor toward the main screening room. The note said don't. The zone guardian is in there.

Two Void Crawlers move along the corridor walls — elemental formations that exist slightly out of phase, flickering between visible and not. They're territorial.`,
    xp: 40,
    choices: [{ label: 'Fight the Void Crawlers', next: 'zone_shadow_enemy_2' }],
  },

  zone_shadow_enemy_2: {
    id: 'zone_shadow_enemy_2', type: 'combat',
    text: `The Void Crawlers phase in — attacking from a direction you can't fully track.`,
    enemy: { name: 'Void Crawler Pair', icon: '🌑', hp: 155, atk: 22, def: 9, xp: 145,
      loot: [{ itemKey: 'rune_umbra', qty: 1 }, { itemKey: 'scrap_metal', qty: 1 }] },
    onWin: 'zone_shadow_midpoint', onLose: 'zone_shadow_corridor',
  },

  zone_shadow_midpoint: {
    id: 'zone_shadow_midpoint', type: 'story',
    text: `The antechamber. The main screening room is through the double doors ahead. The darkness here is different — thicker, more intentional.

A Shadow Construct waits in the center. Not moving. Your interface reads it as pre-boss elemental — highly compressed umbra energy given loose physical form.

Your interface: ZONE GUARDIAN PROXIMITY DETECTED.`,
    xp: 80,
    choices: [
      { label: 'Fight the Shadow Construct', next: 'zone_shadow_enemy_3' },
      { label: 'Slip through the emergency side exit', next: 'zone_shadow_boss_approach' },
    ],
  },

  zone_shadow_enemy_3: {
    id: 'zone_shadow_enemy_3', type: 'combat',
    text: `The Shadow Construct turns toward you — reshaping itself into something with edges.`,
    enemy: { name: 'Shadow Construct', icon: '🌑', hp: 235, atk: 27, def: 11, xp: 215,
      loot: [{ itemKey: 'rune_umbra', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }] },
    onWin: 'zone_shadow_cache', onLose: 'zone_shadow_midpoint',
  },

  zone_shadow_cache: {
    id: 'zone_shadow_cache', type: 'story',
    text: `The Shadow Construct comes apart — the compressed energy releasing outward in a cold pulse.

Where it was: a cache of shadow residue and supplies.

The double doors to the main screening room are right there.`,
    xp: 60, rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'rune_umbra', qty: 1 }],
    choices: [{ label: 'Enter the main screening room', next: 'zone_shadow_boss_approach' }],
  },

  zone_shadow_boss_approach: {
    id: 'zone_shadow_boss_approach', type: 'story',
    text: `The main screening room. Projection screen on — white light, no image.

Your interface: ZONE GUARDIAN DETECTED.

Nothing moves. Then something does — and you realize it was always there.

The Hollow Reaper.

Scythe in one hand, violet smoke trailing. No face inside the hood — just the suggestion of one, and the eyes. Purple. Still.

It turns toward you the way a compass needle turns toward north.

It already knows where you're going to be standing.`,
    choices: [{ label: 'Fight The Hollow Reaper', sub: 'Zone guardian — defeat to claim Umbra', next: 'zone_shadow_boss' }],
  },

  zone_shadow_boss: {
    id: 'zone_shadow_boss', type: 'boss',
    text: `The Hollow Reaper attacks from directions that don't exist. You're fighting the room, not just the thing in it.`,
    enemy: { name: 'The Hollow Reaper', icon: '🌑', hp: 500, atk: 44, def: 20, xp: 320,
      img: '../assets/boss/boss_shadow.webp', loot: [{ itemKey: 'rune_umbra', qty: 2 }] },
    bossKey: 'zone_boss_shadow',
    onWin: 'zone_shadow_boss_win', onLose: 'zone_shadow_boss_approach',
  },

  zone_shadow_boss_win: {
    id: 'zone_shadow_boss_win', type: 'story',
    text: `The Hollow Reaper becomes the smoke. The scythe first, then the robes, then the eyes last — fading from purple to nothing.

The projection screen shuts off.

Complete darkness for three seconds. Then emergency lighting.

Your interface: UMBRA ZONE — FULLY CLAIMED. Umbra resonance locked.

A rune sits on the floor where the shadow was thickest.`,
    xp: 80, rewards: [{ itemKey: 'rune_umbra', qty: 1 }],
    choices: [{ label: 'Return to the district', next: 'district_hub' }],
  },

  // ── Hunter Scout encounter (humanoid — triggers spare/execute prompt on win)
  zone_shadow_hunters: {
    id: 'zone_shadow_hunters', type: 'combat',
    text: `Two Hunters step out of the shadow cover — they were using the zone's darkness as ambush ground. Knives drawn before you can blink. Voss trained them well.`,
    enemy: {
      name: 'Hunter Scout Pair', icon: '🗡️',
      hp: 100, atk: 24, def: 6, xp: 130,
      humanoid: true,
      loot: [{ itemKey: 'knife', qty: 1 }, { itemKey: 'worn_boots', qty: 1 }],
      executeLoot: [{ itemKey: 'scrap_blade', qty: 1 }],
    },
    onWin: 'zone_shadow_explore_2', onLose: 'zone_shadow_explore_1',
  },

}
