# SuperSede — Tactical Battle Design (Working Draft)

**Status:** Initial live integration shipped for existing one-versus-one React encounters. Balancing and group-combat extensions remain experimental. Original boss move scripts remain active; tactical enemy positioning applies to ordinary encounters.

## 1. Battlefield and actions

- **Enemy side:** 3 columns × 3 ranks at the **top** of the book.
- **Player side:** 3 columns × 3 ranks at the **bottom**.
- Rank 0 is the frontline on either side. The enemy's front row is visually closest to the player's front row. Each side has a middle rank (1) and rear rank (2).
- The nine spaces per side are **positions**, not nine mandatory party members. Some may be empty. Companions, multi-tile bosses, traps, summoned creatures and terrain will come later.
- Attacks should have two independently defined rules: **where the attacker can stand** and **which opposing spaces they can target**. An effect then determines **which additional spaces are hit**.
- Every player class and enemy archetype needs a **viable turn** when frontline targets are absent. A weak System Pulse, legal from all nine squares against any enemy square, is the current fallback. It does not earn weapon mastery.
- Live React encounters now use **2 player AP per round**: move one square for 1 AP, a standard weapon attack for 1 AP, a wide-area weapon attack for 2 AP, or a regular class/elemental/keystone ability for 2 AP. Existing free-action exceptions remain free: Eclipse Walker stances, Chimera shifts (subject to form cooldown), Error's Buffer store action, and applicable utility keystones. Each enemy acts once per round, before the player if its SPD is higher, otherwise after. The Battle Lab still offers comparisons.

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

**Class skills and elemental skills:** These add targeting specifications atop the weapon kit. All 101 active class abilities and 30 elemental attacks are now categorized as self/support, close, mid or long in `src/game/tacticalSkills.js`. Close skills require a frontline/middle stance and a nearby enemy; mid skills can be cast from any rank into a nearby column; long skills can reach any cell; self/support actions remain available regardless of position. Out-of-range buttons are disabled with a movement prompt. This metadata currently gates **single-enemy** effects; group-target damage application is a separate phase.

**Existing classes:** The current `src/game/classes.js` has 21 class keys; the shared base weapon kit currently guarantees range coverage for each. Distinct class signatures are **not yet mapped**. Next design phase: tag each existing active class skill with valid origins, targets, AoE shape and any push/pull/swap effects. Review skills individually, preserving the existing class unlock requirements.

## 3. Area of effect and positional tactics

Current prototype shapes:
- **Single:** One target square.
- **Row:** Targeted enemy and adjacent enemy columns in the same rank.
- **Column:** All occupied opposing ranks of the targeted column.
- **Cross:** Target square plus its orthogonally adjacent squares.

Possible future shapes: diagonal, cone, full 3×3, one entire row, random multi-target hits, pull, push, knockback into blocked spaces, ally-guard, target swap, and attacks that reposition the attacker.

An AoE action earns at most **one use** of mastery XP, not one point per enemy hit.

## 4. Weapon mastery — saved in the live RPG

Mastery belongs to the **weapon family**, not the weapon instance. A rare sword therefore retains the user's Sword mastery earned with a common sword.

| Mastery level | Cumulative successful-use XP | Damage bonus |
| --- | ---: | ---: |
| 1 | 0 | +0 |
| 2 | 5 | +0 |
| 3 | 14 | +0 |
| 4 | 28 | +0 |
| 5 | 48 | +0 |
| 10 | 93 | +0 |
| 11 | 105 | +1 |
| 100 | 4,323 | +9 |

The leveling curve uses a growing threshold formula, and unlock thresholds (20/40/80) emphasize new techniques over raw damage.

Live rule: one mastery XP per successful non-Pulse weapon attack, capped at six per encounter and **saved on victory** in players.weapon_mastery (JSONB). Training applies to the weapon family, not its item instance. Mastery now extends to level 100, with a modest +1 attack bonus every ten levels (maximum +9). Master Arc unlocks at level 20, Master Piercing at level 40, and Grand Resonance at level 80 for compatible weapon families. Skill levels are a separate 1–10 upgrade system using skill points.

Potential later mastery rewards: new targeting patterns, reduced ranged penalties, an extra square of reach for specific skills, parry/counter chances, or unlockable signature techniques. **Do not automatically expand every attack's reach:** that would erase weapon identity.

Further balancing is still needed for offhand attacks, PvP, defeat credits, and stronger anti-farming protections. No mastery is granted for System Pulse, failed attacks, or skill-only actions.

## 5. Enemies follow the same tactical rules

- Enemy archetypes get a weapon/attack profile and preferred attack origins, valid enemy targets and the same AoE geometry as players.
- Enemy AI first looks for a legal preferred weapon attack. If none is available, it moves to a legal nearby space that improves its options. If blocked, it can use a low-damage fallback.
- Enemy movement cannot overlap occupied allied enemy squares. Movement and stunned turns still tick existing damage-over-time, regeneration and keystone effects once; an emergency pulse cannot trigger a stronger named AI attack/status behind the scenes.
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

**Remaining work:** Multi-enemy encounters, per-class positional metadata for every class/elemental skill, boss telegraphs, and complete mobile balancing. Keep existing boss scripts, loot and level-up rewards intact while integrating those features.

## 7. First playable multi-enemy encounters (Chapter 1)

Five explicitly counted, non-boss story encounters now route to the isolated `GroupCombatScreen.jsx`: two Glitch Rats, three Static Crawlers, two Fracture Wolves, and the two five-Crawler encounters. They are not one large HP bar: each enemy occupies its own grid square, has independent HP and can move or act in SPD order. The original combined HP is divided across the group; per-enemy ATK is reduced to keep total incoming damage near the previous encounter level. The existing total encounter XP and loot are awarded **once** on confirmed victory, using the same save-retry mechanism as the single-enemy screen. Weapon area patterns use `applyGroupAttack` to hit every occupied, affected square, never dead units. Mastery awards at most one action-use XP and six per encounter.

**Independent status effects and AI (current):** Group encounters now isolate bleed, rot, drown, marks, stuns and attack-weakening effects per foe. Every living foe ticks its own ongoing effects once at the end of the round. The player's class/elemental hooks are reused with temporary per-target status context; global player buffs are not duplicated. Area attacks can spread their stun and weakening effects to all enemies actually hit. Enemy melee units use obstacle-aware breadth-first movement to close the gap over multiple turns, rather than pulsing from the rear. A shared per-round enemy damage budget of `max(3, encounter ATK + ceil(group size / 2))` caps simultaneous-group damage without removing their separate SPD turns.

**Limitations:** Some exotic legacy skill and enemy status mechanics still require per-target handling; all abilities are not yet fully multi-target. Group mode remains opt-in for explicitly counted fights and does not override bosses or unspecified encounters. Full mobile/desktop Vite build and real-browser playtests are still needed.

**Elemental per-enemy damage:** Poison's Long Decay and Fire's Ember stacks now tick on each affected foe, independently, at the same 3 damage per poison stack and 4 damage per ember stack used by the original combat engine. Area attacks that spread stacks only affect occupied squares they actually hit.

**Lingering area fields:** Fire's Inferno Zone in group combat now ignites its affected 3×3 grid squares for three round-end ticks. It damages all living foes occupying those squares, allows enemies to avoid damage by moving out, and does not double-apply the legacy single-target Inferno tick. Field positions, rather than the currently selected target, determine damage.

**Multi-hit keystones:** In group encounters, attuned Chain Lightning sends four diminishing arcs to living foes, while Cyclone distributes its original damage among four positional strikes. Both begin at the chosen enemy, prefer the nearest not-yet-hit foe, can bounce back when everyone has been hit, and stop when all enemies are defeated. Damage totals use the existing keystone formulas (no extra combined hit), with existing one-time encounter rewards and per-unit kill hooks.

## Evolving battlefield footprints (existing skills and mastery)

All existing class and elemental skills retain their original unlock, damage,
status, MP and cooldown formulas. The 1–10 skill upgrade system now affects
the 3×3 battlefield. Enemy-targeted skill levels 4, 7, and 10 increase area:
a single-target skill gradually reaches a row, then a cross, then a seven-square cross-plus;
existing large spells grow their signature shapes without replacing them.
Self/support abilities do not suddenly damage enemies. Every status is spread
to additional affected living foes only if the original skill actually applied
that debuff to its selected target.

Weapon mastery independently evolves the base weapon's attacks at mastery
levels 20, 40 and 80 (short-range techniques gain area first; ranged
techniques evolve later). The System Pulse fallback never evolves or awards
mastery XP. Battlefield attack and skill previews use the same evolved
footprints as hit resolution; class and elemental skills have a separate
preview button so the existing cast action stays single-click.
