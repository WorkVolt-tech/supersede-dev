// ════════════════════════════════════════════════════════════════════════
//  CHAPTER 3 — CLASS MIRROR ENCOUNTER
//  When the player unlocked a class under the Twin Judges in Chapter 2, the
//  System renders a "mirror" of that class as an optional super-boss in Ch3:
//  the player faces a perfected version of their own chosen path.
//
//  Stats are tuned MODERATELY above Verdict (the Twin Judges' strongest form,
//  base hp:380 / atk:22 / def:14) — tough but fair, with super-rewards.
//
//  Usage (from chapters/ch3/index.js):
//    import { buildClassMirror, hasClassMirror } from '../../data/ch3-class-mirror.js'
//    if (hasClassMirror(player)) { ...offer the optional encounter... }
//    const enemy = buildClassMirror(player)   // → enemy object for renderCombat
// ════════════════════════════════════════════════════════════════════════

// Per-class flavor for the mirror. name/title/color mirror data/classes.js so
// the encounter reads as the player's own class turned against them. The
// `verb`/`taunt` lines give each mirror a distinct voice in the story beat.
const CLASS_MIRROR = {
  eclipse_walker: { name: 'Eclipse Walker', title: 'Final Judge of Humanity', color: '#9b6dff',
    taunt: 'It moves the way you move — a half-second before you do.',
    flavor: 'The shape wears your silhouette stretched thin across the dark. It has been walking the eclipse longer than you have, and it does not blink.' },
  nullborn: { name: 'Nullborn', title: 'Final Judge of Humanity', color: '#5e5e5e',
    taunt: 'It has no element, no tell, no edge to read. It simply does not register.',
    flavor: 'The System tried to assign it an affinity and failed, the same way it failed with you. Where you are absence, it is a deeper absence — a hole the shape of a person who refused to be sorted.' },
  error: { name: 'Error', title: 'Final Judge of Humanity', color: '#ff3a5e',
    taunt: 'It glitches between three positions at once. None of them are wrong.',
    flavor: 'It should not exist and it knows it. That is its whole strength — a contradiction the System cannot resolve, walking toward you on broken frames.' },
  arbiter: { name: 'Arbiter', title: 'Judge of Authority', color: '#d4af37',
    taunt: '"I have already weighed you," it says. "This is only the sentence."',
    flavor: 'It carries authority like a blade it has never had to draw. Every motion is a ruling. It expects you to fall in line because everything else always has.' },
  monarch: { name: 'Monarch', title: 'Judge of Purity', color: '#e8c34a',
    taunt: 'It does not raise its voice. It does not have to.',
    flavor: 'A crown of clean light, a posture that has never once doubted itself. It looks at you the way a king looks at a coin — useful, spendable, replaceable.' },
  wrathborn: { name: 'Wrathborn', title: 'Judge of Desolation', color: '#c0392b',
    taunt: 'It is already burning. It wants you to burn with it.',
    flavor: 'No restraint, no patience, only the engine of its own fury feeding itself. It hits harder the angrier it gets, and it is always getting angrier.' },
  chimera: { name: 'Chimera', title: 'Judge of Desolation', color: '#8b4a8c',
    taunt: 'It is wearing four kinds of attack at once and choosing none of them yet.',
    flavor: 'Stitched from every path it ever refused to commit to. It adapts mid-swing, becoming whatever beats you in the moment.' },
  unwritten: { name: 'Unwritten', title: 'Judge of Authority', color: '#404a5a',
    taunt: 'Its story has no ending yet. It intends to end yours first.',
    flavor: 'A blank page that walks. Nothing about it is fixed, which means nothing about it can be predicted — including how it dies.' },
  oathbreaker: { name: 'Oathbreaker', title: 'Judge of Authority', color: '#7a6938',
    taunt: '"I kept a promise once," it says. "It cost me everything. Never again."',
    flavor: 'It broke the vow you are still keeping, and it got stronger for it. It fights like someone with nothing left to betray.' },
  prime: { name: 'Prime', title: 'Judge of Authority', color: '#e0a040',
    taunt: 'It is the version of you the System would have preferred.',
    flavor: 'Optimized. Complete. Everything you are, with the hesitation filed off. It is not cruel — it is just finished, and you are not.' },
  bastion: { name: 'Bastion', title: 'Judge of Purity', color: '#5e8aa0',
    taunt: 'It has not moved from that spot. It will not need to.',
    flavor: 'A wall that decided to have a will. Your strongest hits land and slide off. It is waiting for you to tire first — and it can wait a very long time.' },
  dawnbringer: { name: 'Dawnbringer', title: 'Judge of Purity', color: '#f4d96a',
    taunt: 'It brings light the way a flood brings water — without asking.',
    flavor: 'It believes it is saving you. That belief is the dangerous part. It will not stop until you are remade in its image or gone.' },
  ravager: { name: 'Ravager', title: 'Judge of Desolation', color: '#a02822',
    taunt: 'It does not fight to win. It fights to leave nothing.',
    flavor: 'Pure appetite given a shape. Where it has been, there is no after. It looks at you and sees only the next empty space.' },
  dreadnought: { name: 'Dreadnought', title: 'Judge of Desolation', color: '#6e7a8c',
    taunt: 'It advances. That is the entire plan. It is enough.',
    flavor: 'Unstoppable in the most literal sense — too heavy to turn, too committed to slow. Whatever is in front of it becomes behind it.' },
  ghostblade: { name: 'Ghostblade', title: 'Judge of Balance', color: '#3a8a8c',
    taunt: 'You do not see the strike. You see where it already landed.',
    flavor: 'Half here, half elsewhere, all edge. It cuts from angles that should not exist and is gone before the wound registers.' },
  silent_judge: { name: 'Silent Judge', title: 'Judge of Balance', color: '#604a78',
    taunt: 'It says nothing. The verdict is in how it stands.',
    flavor: 'No threats, no theater. It has already decided, and it carries that decision toward you with terrible patience.' },
  devourer: { name: 'Devourer', title: 'Judge of Salvation', color: '#7a4848',
    taunt: 'It calls eating you a kindness. It almost means it.',
    flavor: 'Salvation through consumption — it wants to take you in, make you part of something larger. Its mercy has teeth.' },
  mourning_king: { name: 'Mourning King', title: 'Judge of Salvation', color: '#4a4a5e',
    taunt: 'It grieves you already, as though you were a thing it lost long ago.',
    flavor: 'It rules over what it has buried. It will weep for you, sincerely, and bury you all the same.' },
  vessel: { name: 'Vessel', title: 'Judge of Ruin', color: '#5e3a78',
    taunt: 'Something else is wearing it. Something old. Something patient.',
    flavor: 'An empty container filled with whatever the Ruin pours in. You are not fighting it — you are fighting what is using it.' },
  hollow: { name: 'Hollow', title: 'Judge of Ruin', color: '#3a3a4a',
    taunt: 'There is nothing inside it. That is what makes it bottomless.',
    flavor: 'It gave everything up and found that emptiness is its own kind of armor. There is nothing left in it for you to break.' },
  abyss_walker: { name: 'Abyss Walker', title: 'Judge of Ruin', color: '#1c2840',
    taunt: 'It came up from somewhere with no bottom, and it brought the dark with it.',
    flavor: 'It walked down past where the signal reaches and kept going. Whatever it found down there, it is bringing back up to you.' },
}

// Generic fallback if active_class isn't in the map for some reason.
const FALLBACK = {
  name: 'The Other', title: 'Unsorted', color: '#8a8a8a',
  taunt: 'It wears a face the System scraped from yours.',
  flavor: 'A reflection the receiver built from everything it learned watching you fight.',
}

// ── Stat tuning ──────────────────────────────────────────────────────────
// Verdict (Twin Judges strongest form) base: hp:380 / atk:22 / def:14.
// "Moderately above Verdict, tough but fair": ~1.4× hp, ~1.5× atk, ~1.5× def,
// plus a light scale with player level so it stays relevant for over-levelled
// characters without becoming trivial for those who rushed in.
const VERDICT = { hp: 380, atk: 22, def: 14, spd: 24 }

function mirrorStats(player) {
  const lvl = player.level || 25
  const lvlScale = 1 + Math.max(0, lvl - 25) * 0.015   // +1.5% per level past 25
  return {
    hp:  Math.round(VERDICT.hp  * 1.4 * lvlScale),   // ~532 at lvl 25
    atk: Math.round(VERDICT.atk * 1.5 * lvlScale),   // ~33
    def: Math.round(VERDICT.def * 1.5 * lvlScale),   // ~21
    spd: VERDICT.spd + 4,                            // 28 — slightly faster than Verdict
  }
}

/** True if the player unlocked a class in Ch2 and so qualifies for the mirror. */
export function hasClassMirror(player) {
  return !!(player && player.active_class && CLASS_MIRROR[player.active_class])
}

/** The display name of the mirror for this player (for story text / choices). */
export function classMirrorName(player) {
  const c = (player && CLASS_MIRROR[player.active_class]) || FALLBACK
  return c.name
}

/** Flavor block for the lead-in story node (title, color, taunt, flavor). */
export function classMirrorFlavor(player) {
  return (player && CLASS_MIRROR[player.active_class]) || FALLBACK
}

/**
 * Build the mirror enemy object consumed by renderCombat in ch3 index.
 * Shape matches the Echo Beast node's `enemy:{}` block.
 */
export function buildClassMirror(player) {
  const c = (player && CLASS_MIRROR[player.active_class]) || FALLBACK
  const s = mirrorStats(player)
  const lvl = player.level || 25

  return {
    name: c.name + ' (Mirror)',
    icon: '🪞',
    hp:  s.hp,
    atk: s.atk,
    def: s.def,
    spd: s.spd,
    xp:  1200 + lvl * 12,                 // super-reward XP, above the Echo Beast's 800
    color: c.color,
    // Art lives at assets/player/{classKey}.webp (e.g. assets/player/nullborn.webp).
    // Falls back to the 🪞 icon if the file isn't present (combat UI renders the
    // icon automatically on img load error).
    img: '../assets/player/' + (player.active_class || 'unknown') + '.webp',
    combatIntro: c.taunt,
    defeatText: 'The mirror cracks down its center. For one frame it shows your real face, mid-breath, unsure — then it falls dark. The System failed to overwrite you with yourself.',
    loseText: 'You hesitate against your own shape for half a second too long. It does not. You break away up the tunnel, the receiver still wearing your face behind you.',
    // Super-rewards: rare runes + a unique imprint of the mirror.
    loot: [
      { itemKey: 'rune_lux', qty: 3 },
      { itemKey: 'item_voice_imprint', qty: 1 },
      { itemKey: 'item_mirror_shard', qty: 1 },
    ],
    // Flag the engine can read for any mirror-specific mechanic later.
    isClassMirror: true,
    mirrorClassKey: player.active_class || null,
  }
}
