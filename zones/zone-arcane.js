// zone-arcane.js — Arcane | Kessler Bookshop
export default {

  zone_arcane: {
    id: 'zone_arcane', type: 'story',
    text: `The bookshop at the district center. Floor-to-ceiling shelves, all still standing — which feels impossible given what happened to everything around it. Books undisturbed. Dust on the covers in the right places.

The shop cat watches you from the top of a shelf. It blinks once. It does not look impressed.

The arcane zone is in the middle of the store, behind an overstuffed reading chair that was situated exactly where it is with intention.

Your interface: ELEMENTAL ZONE — ARCANE. Resonance check: Knowledge alignment detected. Loading...

ARCANE SKILL TREE — UNLOCKED.
Elemental Focus: Arcane. Branch variants: Arcane, Mind, Flow, Offense, Defense.

The trial presents a choice: there's a collapsed player nearby — another faction, unconscious, wearing the Hunters' color. They're not a threat right now. They won't be for a few minutes.

The cat blinks again and looks away. As if to say: of course you qualified. Obviously. Now what are you going to do with it?`,
    xp: 120,
    choices: [
      { label: 'Assist them. Use your items.', sub: 'Costs a med pack — possible unexpected alliance, moral +10', next: 'zone_arcane_assist', moral: 10 },
      { label: 'Leave them and unlock the tree.', sub: 'No cost, no alliance — logged in the record', next: 'zone_arcane_unlock' },
    ],
  },

  zone_arcane_assist: {
    id: 'zone_arcane_assist', type: 'story',
    text: `You use the med pack. They come around slowly — disoriented, then surprised, then quiet.

"You're Builders?" they say.

"No."

They look at you for a moment. Then: "Okay."

They leave before you finish with the node interface. But your Alliance Log updates: Hunters — partial trust event. It's not an alliance. It's a data point.

ARCANE TREE UNLOCKED.

ARCANE BINDING ACTIVE:
Skill AP costs −12%.
All Arcane-branch abilities deal +18% damage.
Intelligence-based status effects last +1 turn.

The cat walks across three shelves and settles on the arm of the chair. It purrs for exactly forty-five seconds, then stops.

Your interface: Commitment to Arcane recorded. Kaelith weight +4.`,
    xp: 100,
    rewards: [{ itemKey: 'rune_lux', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

  zone_arcane_unlock: {
    id: 'zone_arcane_unlock', type: 'story',
    text: `You sit in the chair. It's comfortable. This chair has been comfortable for a long time.

The shop cat walks across three shelves and settles on the arm of the chair beside you. It purrs for exactly forty-five seconds, then stops and goes somewhere else.

ARCANE TREE UNLOCKED.

ARCANE BINDING ACTIVE:
Skill AP costs −12%.
All Arcane-branch abilities deal +18% damage.
Intelligence-based status effects last +1 turn.

The Arcane tree is dense — forty nodes, each suggesting something about how information and intention intersect. Navigable, but it takes a second look to read each one correctly.

On your way out you pick up a book from the closest shelf. You're not sure why. You put it in your pack.

Your interface: Commitment to Arcane recorded.`,
    xp: 50,
    rewards: [{ itemKey: 'rune_lux', qty: 2 }],
    choices: [{ label: 'Continue through the district', next: 'district_hub' }],
  },

}
