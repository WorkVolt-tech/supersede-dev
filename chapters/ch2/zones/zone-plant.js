// zone-plant.js — Flora | Garden Centre | Boss: The Root Mother
export default {

  zone_plant: {
    id: 'zone_plant', type: 'story',
    text: `The garden center near the south exit. The only place in the district where things are still growing. The System didn't stop biology. The plants have had a week to themselves — vines across the aisles, a fig tree dropping fruit, ferns unfurled under fluorescent lights still running on generator power. It smells like soil and green things.

Your interface: ELEMENTAL ZONE — FLORA. Resonance check: Defense-Decay alignment detected.

A root system has broken through the floor. The fast route goes straight through. Going around costs health — but your interface notes: if left intact, root growth reduces enemy effectiveness district-wide by 10%.

FLORA SKILL TREE — UNLOCKED.`,
    xp: 120,
    choices: [
      { label: 'Destroy the roots. Clear the path.', sub: 'Fast — chapter-wide debuff does not activate.', next: 'zone_plant_destroy' },
      { label: 'Navigate around. Leave the roots.', sub: 'Costs health — enemies district-wide take 10% more damage.', next: 'zone_plant_unlock' },
    ],
  },

  zone_plant_destroy: {
    id: 'zone_plant_destroy', type: 'story',
    text: `The roots tear cleanly. The plants don't react. They were going to keep growing regardless.

FLORA TREE UNLOCKED. FLORA BINDING: HP regen +3% per combat turn. Max HP −15%.

You pick up a fallen fig on your way through. It's good.`,
    xp: 50, rewards: [{ itemKey: 'rune_flora', qty: 2 }],
    choices: [{ label: 'Push deeper into the garden center', next: 'zone_plant_explore_1' }],
  },

  zone_plant_unlock: {
    id: 'zone_plant_unlock', type: 'story', hpLoss: 15,
    text: `Navigating around costs you. Zone flora active: Enemy attrition −10% district-wide.

FLORA TREE UNLOCKED. FLORA BINDING: HP regen +3% per combat turn. Max HP −15%.

You pick up a fallen fig on your way through. Fresh.`,
    xp: 80, rewards: [{ itemKey: 'rune_flora', qty: 2 }],
    choices: [{ label: 'Push deeper into the garden center', next: 'zone_plant_explore_1' }],
  },

  zone_plant_explore_1: {
    id: 'zone_plant_explore_1', type: 'story',
    text: `The main aisle. Vines have fully crossed the space overhead — a living ceiling. The lighting is filtered green through the growth.

A Thorn Stalker moves along the vine network — an elemental predator that's made the living ceiling its hunting ground. It drops when prey enters its territory.

It drops now.`,
    xp: 40,
    choices: [
      { label: 'Fight the Thorn Stalker', next: 'zone_plant_enemy_1' },
      { label: 'Grab a vine and swing to the next aisle', sub: 'Costs HP if you slip — avoids the fight if successful', next: 'zone_plant_swing' },
      { label: 'Shouting in the greenhouse — Builders cornered by Thorn Stalkers', sub: 'Three of Sera\'s people, surrounded.', next: 'zone_plant_builders' },
    ],
  },

  zone_plant_swing: {
    id: 'zone_plant_swing', type: 'story', hpLoss: 10,
    text: `The vine holds. You swing to the next aisle over — the Thorn Stalker drops behind you, lands in the wrong spot, has to reorient.

You're through before it catches up.`,
    xp: 40,
    choices: [{ label: 'Continue', next: 'zone_plant_explore_2' }],
  },

  zone_plant_enemy_1: {
    id: 'zone_plant_enemy_1', type: 'combat',
    text: `The Thorn Stalker drops — all sharp edges and reaching vines.`,
    enemy: { name: 'Thorn Stalker', icon: '🌿', hp: 95, atk: 18, def: 9, xp: 100,
      loot: [{ itemKey: 'rune_flora', qty: 1 }] },
    onWin: 'zone_plant_explore_2', onLose: 'zone_plant_explore_1',
  },

  zone_plant_explore_2: {
    id: 'zone_plant_explore_2', type: 'story',
    text: `The indoor greenhouse section. Glass panels, most intact. Everything has overgrown here dramatically — tomato plants eight feet tall, squash vines across every surface, a dwarf citrus tree that has doubled in size and is trying to reach the glass ceiling.

A flora formation grows from the base of the citrus tree — bright green, pulsing slowly. Harvestable.

On a potting bench: a first aid kit, fully stocked, sitting in a clear spot that's been deliberately kept clear of growth.`,
    xp: 60,
    choices: [
      { label: 'Harvest the formation and take the kit', next: 'zone_plant_take_both' },
      { label: 'Take only the kit', next: 'zone_plant_kit' },
      { label: 'Harvest only the formation', next: 'zone_plant_formation' },
      { label: 'Leave both', next: 'zone_plant_corridor' },
    ],
  },

  zone_plant_take_both: {
    id: 'zone_plant_take_both', type: 'story',
    text: `The formation releases gently — no resistance. The kit is fully stocked. You take both and move.`,
    xp: 50, rewards: [{ itemKey: 'rune_flora', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_plant_corridor' }],
  },

  zone_plant_kit: {
    id: 'zone_plant_kit', type: 'story',
    text: `The kit is fully stocked. You leave the formation — it pulses once as you go, slower, like it appreciated the restraint.`,
    xp: 30, rewards: [{ itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_plant_corridor' }],
  },

  zone_plant_formation: {
    id: 'zone_plant_formation', type: 'story',
    text: `The formation releases gently. You leave the kit — whoever comes next might need it more.`,
    xp: 40, rewards: [{ itemKey: 'rune_flora', qty: 2 }],
    choices: [{ label: 'Continue', next: 'zone_plant_corridor' }],
  },

  zone_plant_corridor: {
    id: 'zone_plant_corridor', type: 'story',
    text: `The back corridor. The growth is densest here — you have to push through vine curtains to move. The floor is soft underfoot with decomposed organic matter.

Two Briar Sentinels block the path to the rear greenhouse. Mobile thorn-bushes, essentially — elemental flora given enough coherence to move and defend territory.

They grow taller as you approach.`,
    xp: 40,
    choices: [{ label: 'Fight the Briar Sentinels', next: 'zone_plant_enemy_2' }],
  },

  zone_plant_enemy_2: {
    id: 'zone_plant_enemy_2', type: 'combat',
    text: `The Briar Sentinels surge forward — thorns first, moving faster than anything that dense should move.`,
    enemy: { name: 'Briar Sentinel Pair', icon: '🌿', hp: 165, atk: 20, def: 13, xp: 150,
      loot: [{ itemKey: 'rune_flora', qty: 1 }, { itemKey: 'scrap_metal', qty: 1 }] },
    onWin: 'zone_plant_midpoint', onLose: 'zone_plant_corridor',
  },

  zone_plant_midpoint: {
    id: 'zone_plant_midpoint', type: 'story',
    text: `The rear of the garden center. The largest greenhouse — glass ceiling reaching fifteen feet. Everything has overgrown here beyond the others.

At the center: a Root Warden. Not a formed elemental — something that grew into awareness. It's tending the other plants. Actually tending them — pruning, directing growth.

It becomes aware of you. Stops what it's doing.

Your interface: ZONE GUARDIAN PROXIMITY DETECTED.`,
    xp: 80,
    choices: [
      { label: 'Fight the Root Warden', next: 'zone_plant_enemy_3' },
      { label: 'Sit down and wait — let it decide', sub: 'Passive approach — may earn passage', next: 'zone_plant_wait' },
    ],
  },

  zone_plant_wait: {
    id: 'zone_plant_wait', type: 'story',
    text: `You sit. The Root Warden watches you for a long moment. Then returns to tending the plants. 

After a minute it moves aside — clearing the path to the main greenhouse door.

It didn't fight you. It assessed you.`,
    xp: 80, rewards: [{ itemKey: 'rune_flora', qty: 1 }],
    choices: [{ label: 'Enter the main greenhouse', next: 'zone_plant_boss_approach' }],
  },

  zone_plant_enemy_3: {
    id: 'zone_plant_enemy_3', type: 'combat',
    text: `The Root Warden stops tending and focuses entirely on you. Roots surge from the floor.`,
    enemy: { name: 'Root Warden', icon: '🌿', hp: 255, atk: 24, def: 15, xp: 225,
      loot: [{ itemKey: 'rune_flora', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }] },
    onWin: 'zone_plant_cache', onLose: 'zone_plant_midpoint',
  },

  zone_plant_cache: {
    id: 'zone_plant_cache', type: 'story',
    text: `The Root Warden goes still — returning to the floor slowly, like a plant at the end of its season.

Where it stood: a dense flora formation. A fig sapling is already growing from where it fell.

The main greenhouse door is ahead.`,
    xp: 60, rewards: [{ itemKey: 'rune_flora', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Enter the main greenhouse', next: 'zone_plant_boss_approach' }],
  },

  zone_plant_boss_approach: {
    id: 'zone_plant_boss_approach', type: 'story',
    text: `The main greenhouse. Glass ceiling, most panes intact. Vine curtains — two of them — to push through just to reach the center.

She was always here. The growth converges on her — all vines, all roots, all tendrils. Half woman, half tree. A crown of carnivorous flowers that open and close slowly. Eyes green, looking at you without moving.

The Root Mother.

Thorn vines begin to encircle the exits.

"Everything that enters this space," she says, "becomes part of it eventually."`,
    choices: [{ label: 'Fight The Root Mother', sub: 'Zone guardian — defeat to claim Flora', next: 'zone_plant_boss' }],
  },

  zone_plant_boss: {
    id: 'zone_plant_boss', type: 'boss',
    text: `The Root Mother heals every turn. The vines fight alongside her. You're fighting her environment, not just her.`,
    enemy: { name: 'The Root Mother', icon: '🌿', hp: 620, atk: 34, def: 26, xp: 320,
      img: '../assets/boss/boss_plant.webp', loot: [{ itemKey: 'rune_flora', qty: 2 }] },
    bossKey: 'zone_boss_plant',
    onWin: 'zone_plant_boss_win', onLose: 'zone_plant_boss_approach',
  },

  zone_plant_boss_win: {
    id: 'zone_plant_boss_win', type: 'story',
    text: `The vines go slack. The flowers close. The Root Mother settles back into the floor — not dramatically, just returning to where she came from.

Then something grows fast in the space where she was — a fig sapling, already fruiting.

Your interface: FLORA ZONE — FULLY CLAIMED. Flora resonance locked.

A rune sits at the base of the sapling, wrapped in a single small vine.`,
    xp: 80, rewards: [{ itemKey: 'rune_flora', qty: 1 }],
    choices: [{ label: 'Return to the district', next: 'district_hub' }],
  },

  // ── Builder Rescue event (#7) ────────────────────────────────────────────
  zone_plant_builders: {
    id: 'zone_plant_builders', type: 'story',
    text: `Three Builders backed against the greenhouse wall — vines whipping, two Thorn Stalkers closing on them from above. The lead Builder spots you first; her free hand is pressing a tourniquet on her partner's leg.

She doesn't ask. She just looks at you, then at the Stalkers, then back at you.`,
    choices: [
      { label: 'Move in and fight beside them', sub: 'Builders support — easier combat', next: 'zone_plant_builders_combat' },
      { label: 'Stay back. Take their gear when it\'s over', sub: 'Moral -5', next: 'zone_plant_builders_loot', moral: -5 },
      { label: 'Back out quietly', sub: 'The System notes this', next: 'zone_plant_explore_1', allianceTagRepeatable: 'cowardice' },
    ],
  },
  zone_plant_builders_combat: {
    id: 'zone_plant_builders_combat', type: 'combat',
    text: `You go in low under the vines. The Builders pivot — one drops the tourniquet, picks up a length of pipe, gets to work. Three on two. The Stalkers don't get to choose their angles.`,
    enemy: { name: 'Thorn Stalker Pair', icon: '🌿', hp: 90, atk: 15, def: 8, xp: 115,
      loot: [{ itemKey: 'rune_flora', qty: 1 }] },
    onWin: 'zone_plant_builders_win', onLose: 'zone_plant_explore_1',
  },
  zone_plant_builders_win: {
    id: 'zone_plant_builders_win', type: 'story',
    text: `"Two on one is bad math. You changed the math." The lead Builder applies a pressure bandage to her partner with practiced speed. "We won't forget that."

Your comm chirps: Sera. "Logged. Thank you."`,
    rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_metal', qty: 2 }],
    choices: [{ label: 'Continue', next: 'zone_plant_explore_2', moral: 5, allianceTagRepeatable: 'builders_helped' }],
  },
  zone_plant_builders_loot: {
    id: 'zone_plant_builders_loot', type: 'story',
    text: `You hold position behind a tipped-over planter. The Stalkers do what Stalkers do. The wounded one goes first. The other two don't last much longer.

You wait until the vines stop moving, then walk in and take what they had. The lead Builder's eyes are still open. You don't close them.`,
    rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_metal', qty: 3 }, { itemKey: 'knife', qty: 1 }],
    choices: [{ label: 'Continue', next: 'zone_plant_explore_2' }],
  },

}
