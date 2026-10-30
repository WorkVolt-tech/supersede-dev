# SuperSede — Tactical Battle Design (Working Draft)

**Status:** Working rules, not final balance. The 3×3 Battle Lab is the experiment; SuperSede's live combat has **not** been converted.

## 1. Battlefield and actions

- **Enemy side:** 3 columns × 3 ranks at the **top** of the book.
- **Player side:** 3 columns × 3 ranks at the **bottom**.
- Rank 0 is the frontline on either side. The enemy's front row is visually closest to the player's front row. Each side has a middle rank (1) and rear rank (2).
- The nine spaces per side are **positions**, not nine mandatory party members. Some may be empty. Companions, multi-tile bosses, traps, summoned creatures and terrain will come later.
- Attacks should have two independently defined rules: **where the attacker can stand** and **which opposing spaces they can target**. An effect then determines **which additional spaces are hit**.
- Every player class and enemy archetype needs a **viable turn** when frontline targets are absent. A weak System Pulse, legal from all nine squares against any enemy square, is the current fallback. It does not earn weapon mastery.
- Movement cost remains unresolved. Battle Lab compares (A) 2 action points; (B) move ends turn; (C) one free move. Do **not** replace the existing SPD-based turn order until these are tested.

## 2. Weapon attacks, class abilities, elemental skills

A *character loadout*, not each individual attack, needs a mixture of **short / mid / long** choices.

| Weapon family | Short | Mid | Long | Area/special example |
| --- | --- | --- | --- | --- |
| Sword | Slash | Long Thrust | System Pulse | Sweeping Arc — adjacent enemies on one row |
| Dagger | Stab | Lunge | Thrown Blade | Stealth/positioning class abilities later |
| Spear | Jab | Thrust | System Pulse | Piercing Line — enemy column |
| Staff | Bash | Resonance Wave | Arcane Bolt | Cross-shaped spell |
| Bow | Bow Bash | Quick Shot | Aimed Shot | Arrow Volley — cross |
| Crossbow | Bash | Quick Shot | Aimed Shot | Piercing Line |
| Pistol / Revolver | Bash | Buckshot/skill | Quick Shot | Scatter |
| Rifle | Bash | Quick Shot | Aimed Shot | Piercing Line |
| Shotgun | Bash | Buckshot Spread | System Pulse | Shockwave |
| Shield | Bash | Shield Toss | System Pulse | Shield Shockwave |
| Tome | Bash | Resonance Wave | Arcane Bolt | Cross-shaped spell |
| Unarmed | Stab/strike | Lunge | System Pulse | Resonance Wave |

**Note:** Some ranges above come from supplemental techniques rather than the weapon's inherent reach. For instance, a sword remains fundamentally short range, while its long-range fallback is an emergency System ability. Most ranged weapons are more powerful when used from their preferred ranks.

Weapon subtype aliases follow the current `src/game/equipmentSlots.js` definitions. Unknown items fall back to Unarmed rather than soft-locking a fight.

**Class skills and elemental skills:** These add their own targeting specifications atop the weapon kit. They should not replace or remove the emergency fallback. Some can be ranged from any row; others depend on front/middle/rear formation or exploit displaced enemies. Not every class should have identical attack power at every range.

**Existing classes:** The current `src/game/classes.js` has 21 class keys; the shared base weapon kit currently guarantees range coverage for each. Distinct class signatures are **not yet mapped**. Next design phase: tag each existing active class skill with valid origins, targets, AoE shape and any push/pull/swap effects. Review skills individually, preserving the existing class unlock requirements.

## 3. Area of effect and positional tactics

Current prototype shapes:
- **Single:** One target square.
- **Row:** Targeted enemy and adjacent enemy columns in the same rank.
- **Column:** All occupied opposing ranks of the targeted column.
- **Cross:** Target square plus its orthogonally adjacent squares.

Possible future shapes: diagonal, cone, full 3×3, one entire row, random multi-target hits, pull, push, knockback into blocked spaces, ally-guard, target swap, and attacks that reposition the attacker.

An AoE action earns at most **one use** of mastery XP, not one point per enemy hit.

## 4. Weapon mastery — proposed, not yet in the live RPG

Mastery belongs to the **weapon family**, not the weapon instance. A rare sword therefore retains the user's Sword mastery earned with a common sword.

| Mastery level | Cumulative successful-use XP | Current lab-only damage boost |
| --- | ---: | ---: |
| 1 | 0 | +0 |
| 2 | 5 | +1 |
| 3 | 14 | +2 |
| 4 | 28 | +3 |
| 5 | 48 | +4 |

Current experiment: one XP per **successful weapon attack action**; even a multi-target strike counts once. The emergency System Pulse awards **no weapon mastery XP**. Mastery retains progress in the current page session across rematches and weapon changes, but does **not** persist to the database. These thresholds and damage amounts are placeholders.

Potential later mastery rewards: new targeting patterns, reduced ranged penalties, an extra square of reach for specific skills, parry/counter chances, or unlockable signature techniques. **Do not automatically expand every attack's reach:** that would erase weapon identity.

Live implementation must decide: persistence model (`weapon_mastery` JSONB or separate user-weapon table); whether to credit on victory, defeat or valid action; mastery XP caps per encounter; anti-idle/anti-farming controls; and whether equipped offhand attacks count. These need to be atomic with confirmed combat saves and should not use unverified player columns.

## 5. Enemies follow the same tactical rules

- Enemy archetypes get a weapon/attack profile and preferred attack origins, valid enemy targets and the same AoE geometry as players.
- Enemy AI first looks for a legal preferred weapon attack. If none is available, it moves to a legal nearby space that improves its options. If blocked, it can use a low-damage fallback.
- Enemy movement cannot overlap occupied allied enemy squares.
- The Battle Lab currently includes **sword, spear and staff** opponents to demonstrate different patterns.
- SPD-based action sequencing, crowd-control effects, weapon switching costs and elite boss size are future integration tasks; the lab's enemy turn is intentionally simplified.

## 6. Implementation order after the rules feel good

1. Experiment with the 3×3 lab's equipment selector, movement modes and target highlights.
2. Choose action economy, line-of-sight, ally occupancy and whether a character can switch weapon mid-battle.
3. Give all 21 existing class kits at least one distinctive positional attack, with one short/mid/long fallback in their combined kit.
4. Map all existing elemental attacks, keystones and class combat effects to target shapes; preserve their current damage, MP and cooldown rules.
5. Add positional metadata to enemy AI attacks, special-case multi-tile bosses and implement push/pull and defensive tiles.
6. Decide mastery progression and persistence. Confirm rewards are saved exactly once with fight outcomes.
7. Only then integrate the grid into `CombatScreen.jsx`, with a migration-safe fallback until battle mechanics are thoroughly tested on PC and mobile.

**Key non-goal for now:** Do not modify the character schema, boss difficulty, XP/loot rewards or live story combat. The Battle Lab remains a reversible and isolated prototype.
