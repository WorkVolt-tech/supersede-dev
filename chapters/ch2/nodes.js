// chapters/ch2/nodes.js — Chapter 2 node graph (canonical source).
// All narrative nodes live here. Zones are spread in from ./zones/*.js.
// Moved out of index.js so narrative data has a single home.

import ZONE_FIRE      from './zones/zone-fire.js'
import ZONE_WATER     from './zones/zone-water.js'
import ZONE_LIGHTNING from './zones/zone-lightning.js'
import ZONE_ARCANE    from './zones/zone-arcane.js'
import ZONE_SHADOW    from './zones/zone-shadow.js'
import ZONE_EARTH     from './zones/zone-earth.js'
import ZONE_WIND      from './zones/zone-wind.js'
import ZONE_PLANT     from './zones/zone-plant.js'
import ZONE_METAL     from './zones/zone-metal.js'
import ZONE_POISON    from './zones/zone-poison.js'
import ZONE_FARMING   from './zones/zone-farming.js'

export const NODES = {
  ...ZONE_FIRE,
  ...ZONE_WATER,
  ...ZONE_LIGHTNING,
  ...ZONE_ARCANE,
  ...ZONE_SHADOW,
  ...ZONE_EARTH,
  ...ZONE_WIND,
  ...ZONE_PLANT,
  ...ZONE_METAL,
  ...ZONE_POISON,
  ...ZONE_FARMING,  // ═══════════════════════════════
  // OPENING — ARRIVAL
  // ═══════════════════════════════
  opening: {
    id: 'opening', type: 'story',
    text: `The road ends at a collapsed overpass.

Beyond it, the shopping district stretches out — or what's left of it. Glass storefronts shattered inward. Mannequins knocked from their pedestals, frozen mid-fall. A banner reading GRAND REOPENING hangs diagonally across an entrance, half-burned, swaying in a wind that shouldn't exist.

Your vehicle idles at the edge. The road here is cracked — something hit it from below.

Your interface updates:

CHAPTER 2 — BROKEN ALLIANCES
ZONE: Kessler Shopping District
STATUS: Contested. Multiple player factions active.

Three signals pulse on your radar. Close together, then moving apart. People — or something pretending to be.

A message appears in your interface. No sender ID:

"You'll need to pick a side eventually. Everyone does. The ones who don't just end up in the middle when it collapses."

You get out of the vehicle.`,
    sysMsg: 'Chapter 2 active. Faction activity detected across the district. Proceed with caution.',
    choices: [
      { label: 'Move toward the market plaza', sub: 'Three signals are clustered there', next: 'plaza_arrival' },
      { label: 'Scout the perimeter first',    sub: 'Get the lay of the land before making contact', next: 'scout_perimeter' },
      { label: 'Check your interface systems', sub: 'Review what carried over from Chapter 1', next: 'interface_check' },
    ],
  },

  interface_check: {
    id: 'interface_check', type: 'story',
    text: `You stand at the edge of the district and pull up your full interface display.

Everything you built in Chapter 1 is still there. The stats. The badge. The items. Whatever relationship you have with the System — it followed you here.

There's one new tab, though. FACTION ALIGNMENT. It's empty. A note below reads:

"Your position will be calculated from your actions in this district. You don't choose a faction — the faction chooses you, based on what you do."

Below that:

ELEMENTAL PATHS AVAILABLE: 9
STATUS: Locked. Complete district encounters to access.

There's a third section. ALLIANCE LOG. Also empty. The header reads:

"Cooperation and betrayal are both tracked here. The Judges will review this record."

You close the interface.

Something is watching the district. You can feel it — not like the Watcher. Quieter. More patient. Like something waiting to see what you'll become before it decides what to do about it.`,
    choices: [
      { label: 'Move into the district', next: 'plaza_arrival' },
    ],
  },

  scout_perimeter: {
    id: 'scout_perimeter', type: 'story',
    text: `You move along the outer edge of the district. Broken fencing. An overturned food truck. The smell of something that burned days ago.

You find three things:

One: a group of players hauling salvage into a parking structure, working in silence with practiced efficiency. They clock you but don't stop moving.

Two: a solo player crouched behind a collapsed wall, watching the same group. When they notice you noticing them, they don't run — they just hold up two fingers. Wait.

Three: a shopfront that's still intact. The lights are on inside. A handwritten sign on the door reads:

OPEN. TRADING. WEAPONS. INFO. NO QUESTIONS.

Your interface marks all three positions. Your radar has been accurate so far.

The question is where to go first.`,
    xp: 40,
    choices: [
      { label: 'Approach the salvage crew',        sub: 'The Builders — they look organized', next: 'meet_builders' },
      { label: 'Talk to the solo watcher',          sub: 'The Ghosts — quiet, hard to read',  next: 'meet_ghosts' },
      { label: 'Go to the intact shop',             sub: 'NPC trader — neutral ground',        next: 'trader_intro' },
      { label: 'Head to the main plaza',            sub: 'See what else is active',            next: 'plaza_arrival' },
    ],
  },

  // ═══════════════════════════════
  // PLAZA — THE THREE FACTIONS
  // ═══════════════════════════════
  plaza_arrival: {
    id: 'plaza_arrival', type: 'story',
    text: `The plaza is a wide open square at the center of the district. A fountain in the middle, dry, full of broken glass. Around the edges, three distinct groups.

On the left — the Builders. Eight or nine players, maybe more. They've pushed broken furniture into a defensive perimeter and are actively restoring a food stall at the far end. Someone is keeping inventory on a tablet. They have a visible stockpile. They look established.

On the right — the Hunters. Smaller group. Five. They're not working. They're watching. Every one of them has their interface open on the other groups' positions. One of them, a lean figure with a cracked visor, is smiling at something you can't see.

In the middle — the Ghosts. Not really a group. Just people sitting near each other by choice or proximity. Not talking much. Not committed to either side. Three of them, spread out enough to look casual but close enough to have a plan.

And then there's you.

Three different kinds of stares land on you at the same moment.

Your interface registers: NEW ENVIRONMENT. FACTION ASSESSMENT ACTIVE.`,
    choices: [
      { label: 'Walk toward the Builders',       sub: 'Signal cooperation',   next: 'meet_builders',  moral: 5 },
      { label: 'Walk toward the Hunters',        sub: 'Signal strength',        next: 'meet_hunters',   moral: -3 },
      { label: 'Sit with the Ghosts',            sub: 'Signal neutrality — no change',     next: 'meet_ghosts' },
      { label: 'Stand in the center and wait',   sub: 'Let them come to you',              next: 'plaza_center' },
    ],
  },

  // ── Faction approach scenes ──────────────────────────────────────────
  // Originally the four plaza choices linked here, but only plaza_center
  // had ever been written. The other three now exist as short approach
  // scenes that funnel into the same downstream alliance nodes the wait
  // path uses (builders_alliance, hunters_voss_goal, ghosts_deep).
  meet_builders: {
    id: 'meet_builders', type: 'story',
    text: `You walk toward the Builders directly. The reaction is immediate — the tall woman with the grey-streaked hair sets down whatever she was working on and gives you her full attention. The others don't stop what they're doing, but you can feel that they're listening.

"You came over." She doesn't smile, but there's something approving in the way she says it. "Most people circle the plaza first. I respect that you didn't."

She extends a hand. "Sera. I lead the Builders here. Salvage, stabilization, anything that needs hands and a plan. We've been waiting for someone from your chapter to come through. The Hunters have been waiting too, but for different reasons."

Behind her, a kid with a carefully bandaged hand gives you a small nod. Not performative. Just acknowledgment.`,
    choices: [
      { label: '"What do you need?"',            sub: 'Ask what the work looks like', next: 'builders_deep' },
      { label: '"Tell me about the alliance."',  sub: 'Cut to the offer',             next: 'builders_deep' },
      { label: 'Hear out the Hunters first',     sub: 'Walk over to Voss',            next: 'meet_hunters' },
    ],
  },

  meet_hunters: {
    id: 'meet_hunters', type: 'story',
    text: `You walk toward the Hunters. The smile under the cracked visor tilts up a degree. You can feel Sera's eyes on your back from across the plaza, but she doesn't call out. The Hunters didn't expect you, exactly — but they were ready for you.

"Interesting." The Hunter with the visor pulls it up. The face underneath is younger than you expected, and very tired. "Voss. I run what the Builders call 'the destabilizing element' and what we call 'the people who get things done.'"

Voss doesn't extend a hand. They tilt their head instead.

"Three faction caches in this district. System-locked. We have the location on one of them. We're missing the people. You look like someone who's been keeping their options open — that's a compliment, where I come from."

Behind them, the other Hunters watch you without pretending not to.`,
    choices: [
      { label: '"What\'s in it for me?"',         sub: 'Direct — Voss likes direct',     next: 'hunters_voss_goal' },
      { label: '"Tell me about the cache."',      sub: 'Get to the offer',               next: 'hunters_voss_goal' },
      { label: 'Hear out the Builders first',    sub: 'Walk over to Sera',              next: 'meet_builders' },
    ],
  },

  meet_ghosts: {
    id: 'meet_ghosts', type: 'story',
    text: `You sit down on the planter beside the Ghosts. None of the three of them react immediately. After a moment, the one closest to you — faded jacket, soft posture — shifts so their shoulder isn't blocking the plaza.

"Good spot," they say, like they're commenting on the weather. "Both factions can see you. Neither can pretend they don't see you. That's the only neutral move left in this district."

They look at you sideways.

"We're Rue. Some of us. I think most of us. The Ghosts aren't really a group — we're just people who decided the choice between Builder and Hunter isn't a choice we want to make. The district has nine elemental zones the System sealed when the alliances started fracturing. You don't need either faction to enter them — but they open differently depending on who you're walking with."

Rue gestures toward the plaza without looking at it.

"You can still pick a side. We're not going to stop you. We just want you to know that 'neither' is on the table."`,
    choices: [
      { label: '"Tell me more about the zones."', sub: 'Ask about the System',          next: 'ghosts_deep' },
      { label: 'Stand up and approach Sera',     sub: 'Choose the Builders',           next: 'meet_builders' },
      { label: 'Stand up and approach Voss',     sub: 'Choose the Hunters',            next: 'meet_hunters' },
      { label: 'Stay where you are',              sub: 'Continue with Rue',             next: 'ghosts_deep' },
    ],
  },

  plaza_center: {
    id: 'plaza_center', type: 'story',
    text: `You walk to the fountain and sit on the edge of it. Glass crunches under your boots. You wait.

It takes about forty seconds. Then someone from each group peels off and approaches — not together, but in loose orbit, like they've done this before. Like standing at the fountain is a neutral zone everyone agreed on without saying it.

The Builder is a tall woman with grey-streaked hair and methodical eyes. She looks at you like she's already cataloguing your usefulness.

The Hunter has the cracked visor. Up close the smile is less unsettling and more exhausted — like someone who decided to be threatening because it was simpler.

The Ghost is barely there. Faded jacket, soft voice. They don't introduce themselves. They just sit next to you on the fountain's edge like they've known you for a while.

The Builder speaks first. "You came from the road. That means you were in Chapter 1."

Not a question.`,
    choices: [
      { label: '"I finished Chapter 1."',          sub: 'Straightforward — neutral response', next: 'faction_talk_honest' },
      { label: '"I survived it."',                 sub: 'Evasive — Hunters will like it',     next: 'faction_talk_evasive', moral: -3 },
      { label: '"I helped people along the way."', sub: 'Signal alignment — Builders respond', next: 'faction_talk_helper', moral: 5 },
    ],
  },

  faction_talk_honest: {
    id: 'faction_talk_honest', type: 'story',
    text: `"Finished it," the Builder repeats. "Good. We need people who can finish things."

The Hunter with the cracked visor tilts their head. "What's your badge?"

You show them. They study it — all three of them, for a half-second, in the way people do when they're calculating something.

The Ghost speaks, almost to themselves: "Honest answer. That's unusual here."

The Builder extends a hand. "Sera. I run the Builders. We salvage, we stabilize, we protect what we build. Join a work rotation for a day and we'll give you access to our stockpile and the path we've been clearing." She pauses. "No obligation. We're not recruiting. We're just solving problems."

The Hunter doesn't offer a name. "We've identified three faction caches in this district. Sealed. System-protected. The only way to open them is a coordinated push — or convincing someone else to take the risk while you wait for the split." The smile again. "We call it 'Mutual Benefit.'"

The Ghost looks at the sky. "There are nine elemental zones in this district. I've found two. The System sealed them off when the alliances started fracturing. You want in — you need to be the kind of person a zone will open for."

Three offers. Three completely different definitions of what it means to be useful.`,
    choices: [
      { label: 'Ask Sera more about the Builders',  next: 'builders_deep' },
      { label: 'Ask the Hunter about the caches',   next: 'hunters_deep' },
      { label: 'Ask the Ghost about the elements',  next: 'ghosts_deep' },
      { label: 'Head into the district',            next: 'district_hub' },
    ],
  },

  faction_talk_evasive: {
    id: 'faction_talk_evasive', type: 'story',
    text: `The Hunter laughs — short and genuine. "Survived it. Yeah. That's the right word."

Sera, the Builder, doesn't smile. She files something away behind her eyes and waits.

The Ghost says nothing for a long moment. Then: "You're deciding what version of yourself to be in this chapter. That's fine. We all are."

The Hunter leans forward. "Here's what I'll tell you. There are three sealed caches in this district. The System put them there. The Builders are going to try to open them cooperatively. They'll succeed, and they'll share the contents, and it will be fair and organized and documented." A pause. "Or — someone could let the Builders do the work, and then take one of the caches while everyone's celebrating the other two." Another pause. "I'm not saying that's a good idea. I'm saying the System allows it. I find that interesting."

The Hunter stands up. "Name's Voss. Find me when you decide what kind of chapter this is going to be."`,
    choices: [
      { label: 'Follow Voss to learn more',       next: 'hunters_deep' },
      { label: 'Talk to Sera instead',             next: 'builders_deep' },
      { label: 'Talk to the Ghost',                next: 'ghosts_deep' },
      { label: 'Head into the district alone',     next: 'district_hub' },
    ],
  },

  faction_talk_helper: {
    id: 'faction_talk_helper', type: 'story',
    text: `Something shifts in Sera's posture. Not much — she's controlled — but it shifts.

"Good," she says. "We need people who remember that."

The Hunter's smile flickers. Recalculating. They don't leave — but they take a small step back.

The Ghost looks at you steadily. "The System tracked that in Chapter 1. It's tracking it now. I don't know what it does with that information. I don't think we're supposed to know."

Sera speaks at a normal pace, like she has unlimited time: "We have four active projects. Clearing the east corridor, establishing a medical station near the food court, inventorying the sealed shops, and — the one I actually need help with — the three elemental zones that shut down when the district went hostile. They respond to cooperative energy. My theory is they won't open for someone who came alone with no intention of sharing what they find." She looks at you. "You helped people in Chapter 1. That's a starting point. Work with us for a few hours and I think those zones will open."

She means it. No negotiation in her voice. Just information, offered without leverage.`,
    choices: [
      { label: 'Agree to work with the Builders', next: 'builders_alliance', moral: 5 },
      { label: 'Ask about the elemental zones',    next: 'ghosts_deep' },
      { label: 'Explore the district first',       next: 'district_hub' },
    ],
  },

  // ═══════════════════════════════
  // FACTION DEEP DIVES
  // ═══════════════════════════════
  builders_deep: {
    id: 'builders_deep', type: 'story',
    text: `Sera walks you through their setup while she works. Compact, efficient — no wasted motion.

"We have eleven active members. Three more who come and go. In Chapter 1, all of us made choices that pushed our moral scores positive. Not because we were told to. Because we watched what happened when people didn't."

She shows you the inventory on her tablet. Organized by type, by location, by priority. It's the most structured thing you've seen since the System started.

"The shopping district has resources. Real ones — not System drops, but actual food, medicine, tools. The sealed shops are full of it. The problem is they're locked. System-locked. The System requires an alliance signature to unlock each one — at least two players with compatible moral profiles, agreeing to share contents." She looks up. "The Hunters figured out the same thing. Their solution was to find someone who would sign as a partner, then take everything and run before the signature expires."

She goes back to her tablet.

"We've completed two unlocks. Shared everything both times. The third one is the largest. And we're short a partner with the right profile."

She doesn't say anything else. She lets you think.`,
    xp: 50,
    choices: [
      { label: 'Offer to be the partner',      sub: 'Alliance signature',  next: 'builders_alliance', moral: 8 },
      { label: "Ask what you'd get out of it",  sub: 'Practical question',              next: 'builders_negotiation' },
      { label: 'Scavengers are hitting the supply line — help defend it', sub: 'Stand with the Builders', next: 'builders_defend_intro' },
      { label: 'Keep your options open',        sub: 'Non-committal',                   next: 'district_hub' },
    ],
  },

  // ── Builders faction fight (skippable; win = +moral, skip = -moral) ──
  builders_defend_intro: {
    id: 'builders_defend_intro', type: 'story',
    text: `Sera's comm crackles before she's finished her sentence. "Supply line. Two of them. They're going for the medical crates." She's already moving. "You don't have to come."

You can hear it from here — the scrape of someone prying a locked shutter, the low voices of people who expect to be gone before anyone arrives.

Two scavengers, working fast. The crates behind them are stamped with the Builders' mark.`,
    choices: [
      { label: 'Step in — drive them off', sub: 'Defend the Builders', next: 'builders_defend_combat' },
      { label: 'Stay out of it — keep walking', sub: 'Not your fight — the Builders will remember', next: 'builders_defend_skip', moral: -3 },
    ],
  },
  builders_defend_combat: {
    id: 'builders_defend_combat', type: 'combat',
    text: `You move into the open. The scavengers turn — one reaching for the crate, the other for a length of pipe. Sera arrives at your shoulder a second later. "Good," she says. "Left one's mine."`,
    enemy: { name: 'Supply Scavengers', icon: '🗡️', hp: 120, atk: 19, def: 8, xp: 120, humanoid: true,
      loot: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_metal', qty: 2 }] },
    onWin: 'builders_defend_win', onLose: 'builders_deep', onEscape: 'builders_deep',
  },
  builders_defend_win: {
    id: 'builders_defend_win', type: 'story',
    text: `The scavengers break and run, leaving the crates and a few dropped supplies behind. Sera checks the seals, then looks at you.

"That wasn't your fight, and you made it yours anyway." She presses a salvaged pack into your hand. "The log will show this. So will I."`,
    hpLoss: 12,
    rewards: [{ itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Back to Sera', next: 'builders_deep', moral: 5, allianceTagRepeatable: 'builders_helped' }],
  },
  builders_defend_skip: {
    id: 'builders_defend_skip', type: 'story',
    text: `You keep walking. Behind you, the sound of the shutter giving way, then Sera's people arriving too late. When you see her again, she doesn't mention it.

She doesn't have to. The log already noted where you were.`,
    choices: [{ label: 'Back to Sera', next: 'builders_deep' }],
  },

  builders_negotiation: {
    id: 'builders_negotiation', type: 'story',
    text: `Sera doesn't look offended. She expected the question.

"Access to our stockpile. A guaranteed share of whatever's in the third cache. Backup on the elemental zones — we've mapped three of the nine and cleared the approaches." She pauses. "And the honest version: we'll vouch for you to the Judges."

You raise an eyebrow.

"The Twin Judges — you haven't heard yet?" She sets the tablet down. "The System placed them here when the alliances fractured. Two Judges — Mercy, who looks at what you built, and Wrath, who looks at what you took. At the end of this chapter, everyone faces one of them, or both, or some combination that the System decides based on your record. I don't know exactly how the forms work. I know that the people who worked with us in Chapter 1 — I mean, people who helped others — they faced the less dangerous version."

She picks the tablet back up.

"I'm not trying to scare you into it. I'm telling you what I know. You can decide what that's worth."`,
    choices: [
      { label: 'Sign the alliance',  sub: 'Commit to the alliance', next: 'builders_alliance', moral: 8 },
      { label: 'Decline, stay free', sub: 'Keep all options',  next: 'district_hub' },
    ],
  },

  builders_alliance: {
    id: 'builders_alliance', type: 'story',
    text: `You sign the alliance interface. A soft chime. A line of text:

ALLIANCE FORMED: [YOUR NAME] + BUILDERS
COOPERATIVE PROTOCOL ACTIVE
BENEFITS: Stockpile access, zone clearance support, vouched reputation

Sera extends her hand again — this time to shake. "Good. Come find me when you want to work on the cache. In the meantime, the elemental zones should start responding to you." She gestures toward the east side of the district. "Fire zone is that direction. Lightning's near the old sports store. Water's in the food court basement. Start wherever makes sense for how you fight."

One of the other Builders — a kid, maybe twenty, with a carefully bandaged hand — gives you a small nod as you pass. Not performative. Just acknowledgment.

Your interface updates: ALLIANCE LOG — Builders: Active. Cooperation credit recorded.`,
    xp: 80,
    rewards: [{ itemKey: 'builders_cache_key', qty: 1 }],
    choices: [
      { label: 'Head to the elemental zones', next: 'district_hub' },
      { label: 'Ask about the Judges',        next: 'judge_lore_builders' },
    ],
  },

  hunters_deep: {
    id: 'hunters_deep', type: 'story',
    text: `Voss takes you somewhere the others can't hear. A gutted electronics shop with all the screens still on, showing static.

"I'll be straight with you," they say. Which is probably what they say to everyone, you think. But they continue: "The Builders are going to open that third cache. Eleven players, moral scores high, organized — they'll do it. The question is what happens in the four minutes after it opens before they've distributed everything."

Voss pulls up their interface. "The System is watching cooperation and betrayal in this district. Both. It's not punishing either one — it's measuring. The Judges at the end aren't punishment. They're evaluation. Judge Mercy — Judge of Salvation — evaluates what you built and with whom. Judge Wrath — Judge of Ruin — evaluates what you took and how."

They look at you. "Most players will face one of them. The ones who split their choices — both cooperation and betrayal in the record — they face both at once. And from what I've gathered, when you push either record far enough, the Judge that matches you doesn't show up as themselves anymore. They show up as something more refined. Absolution. Ruin. There's a name for every form. I don't know all of them."

They pause. "I've heard it's the hardest fight. I've also heard the rewards are different. The System gives you what matches what you are, not what you want."

They lean against a broken shelf. "I'm not recruiting you to betray the Builders. I'm telling you the System doesn't care which path you pick. It just wants you to pick deliberately."`,
    xp: 50,
    choices: [
      { label: 'Ask what Voss wants',          next: 'hunters_voss_goal' },
      { label: 'Ask about the elemental zones', next: 'ghosts_deep' },
      { label: "Voss has a runner to corner — back the play", sub: 'Stand with the Hunters', next: 'hunters_corner_intro' },
      { label: 'Head into the district',       next: 'district_hub' },
    ],
  },

  // ── Hunters faction fight (skippable; win = -moral, skip = +moral) ──
  hunters_corner_intro: {
    id: 'hunters_corner_intro', type: 'story',
    text: `Voss tilts their head toward the back of the shop. "Convenient timing. There's a player who signed a cache deal with us this morning and is now trying to walk it back — with our half in their bag." A thin smile. "We're going to have a conversation. You can be part of it."

Through the gutted doorway, you can see them: one player, moving fast, a loaded pack on their shoulder. Two of Voss's people are already drifting to cut off the exits.

"They agreed to the split," Voss says. "Now they don't want to. The System recorded the agreement either way."`,
    choices: [
      { label: 'Back the Hunters — take it back by force', sub: 'Stand with Voss', next: 'hunters_corner_combat' },
      { label: 'Refuse — this one isn\'t yours to take', sub: 'Walk away from the aggression', next: 'hunters_corner_skip', moral: 3 },
    ],
  },
  hunters_corner_combat: {
    id: 'hunters_corner_combat', type: 'combat',
    text: `You move to cut the angle. The runner sees the trap close and decides to fight through it rather than hand the pack over. Voss's people hang back half a step — letting you take the front. Testing you.`,
    enemy: { name: 'Cornered Runner', icon: '🗡️', hp: 130, atk: 21, def: 9, xp: 130, humanoid: true,
      loot: [{ itemKey: 'scrap_metal', qty: 2 }, { itemKey: 'energy_drink', qty: 1 }] },
    onWin: 'hunters_corner_win', onLose: 'hunters_deep', onEscape: 'hunters_deep',
  },
  hunters_corner_win: {
    id: 'hunters_corner_win', type: 'story',
    text: `The runner goes down hard and stays down, pack spilling open. Voss steps past you, sorts the contents with a practiced hand, and tosses you a share without being asked.

"You don't flinch. That's rare." They don't smile this time. "The System saw that too. It always does."`,
    hpLoss: 14,
    rewards: [{ itemKey: 'energy_drink', qty: 1 }],
    choices: [{ label: 'Back to Voss', next: 'hunters_deep', moral: -5, allianceTagRepeatable: 'hunters_helped' }],
  },
  hunters_corner_skip: {
    id: 'hunters_corner_skip', type: 'story',
    text: `"Not mine to take," you say, and step back out of the angle.

Voss watches you go without anger. "Deliberate. Fine. The System logs the ones who walk away too." The runner slips past, pack intact. Voss doesn't chase.`,
    choices: [{ label: 'Back to Voss', next: 'hunters_deep' }],
  },

  hunters_voss_goal: {
    id: 'hunters_voss_goal', type: 'story',
    text: `"What do I want?" Voss looks almost amused. "I want to face Judge Wrath. Specifically. I want to see what the System thinks I'm worth after everything I've done in this city."

A pause.

"I betrayed three people in Chapter 1. None of them were weak. I made choices that lowered my moral score past the point of easy recovery. And I'm not — I don't regret it. I made calculated decisions and they worked." They look at you steadily. "I'm not asking you to do the same. I'm saying the System built a Judge for people like me. That means the System expected people like me. Maybe even needed us."

They push off the shelf.

"The elemental zones respond to character. Not good character or bad character. Just clarity. If you know what you are — really know — the zones open. The ones who get stuck are the ones pretending." Voss smiles. "The Shadow zone, specifically, is for people who've made a cost and paid it. If your moral score is below a threshold, it opens easy. If you're faking it — it stays shut."

They head for the door. "Find the Ghost if you want the map. They've been to all nine."`,
    choices: [
      { label: 'Find the Ghost',          next: 'ghosts_deep' },
      { label: 'Head to the zones alone', next: 'district_hub' },
    ],
  },

  ghosts_deep: {
    id: 'ghosts_deep', type: 'story',
    text: `The Ghost — they eventually tell you their name is Rue — has a map.

Not a System map. A physical one, drawn on the back of a parking ticket with a pen that's running out of ink. Somehow it's more accurate than your interface.

"Nine zones," Rue says, spreading it on a dust-covered bench. "One for each element. Fire, Water, Lightning, Arcane, Shadow, Earth, Wind, Plant, Metal. The System placed them in specific locations — each one in a part of the district that matches its nature."

They trace the path with one finger.

"Fire's in the old kitchen supply store. Lots of copper and heat damage already — it was near something that burned." A pause. "Water's in the food court basement where the pipes burst. Earth's in the parking structure — concrete, weight, layers. Shadow's under the closed cinema. Wind's in the atrium where the roof caved and the crossdraft never stopped. Lightning's at the old electronics hub." They look up. "Arcane is in the bookshop at the center. Plant is in the garden center near the south exit. Metal is in the hardware megastore."

Rue rolls the map. "I've been to all nine. None of them opened for me. I'm not sure what I am yet."

A beat. "Though — the longer I go without picking one, the more the System looks at me. Not like it's waiting for me to choose. Like the not-choosing is the thing it's reading." Rue shakes their head. "Probably nothing. I think about it too much."

They hand you the map. "Maybe you are."`,
    xp: 60,
    rewards: [{ itemKey: 'district_map', qty: 1 }],
    choices: [
      { label: 'Ask what the zones give you',     next: 'zone_explanation' },
      { label: 'A System construct is tracking Rue — intercept it', sub: 'Neutral encounter', next: 'ghosts_construct_intro' },
      { label: 'Head into the district',          next: 'district_hub' },
    ],
  },

  // ── Ghosts faction fight (skippable; win = neutral, skip = small -moral) ──
  ghosts_construct_intro: {
    id: 'ghosts_construct_intro', type: 'story',
    text: `Rue goes still mid-sentence. "Don't move." Their eyes track something over your shoulder.

A System construct — one of the unclassified ones, all angles and quiet — has been pacing the edge of the lot. It isn't faction. It isn't elemental. It's just the System, watching, the way it always is. Except this one has locked onto Rue's signal and started closing.

"It does this," Rue murmurs. "Follows the ones it can't read. Usually I just leave." A pause. "I'm tired of leaving."`,
    choices: [
      { label: 'Put yourself between Rue and the construct', sub: 'Face it down', next: 'ghosts_construct_combat' },
      { label: 'Let Rue slip away — don\'t engage', sub: 'Avoid the fight — Rue notes it', next: 'ghosts_construct_skip', moral: -2 },
    ],
  },
  ghosts_construct_combat: {
    id: 'ghosts_construct_combat', type: 'combat',
    text: `You step into its path. The construct reorients instantly — reassessing, recalculating. Rue moves to your flank, quiet and fast, reading its pattern out loud as it shifts. "Left. Now low. It telegraphs."`,
    enemy: { name: 'Unclassified Construct', icon: '👁', hp: 140, atk: 20, def: 12, xp: 125,
      loot: [{ itemKey: 'scrap_metal', qty: 2 }, { itemKey: 'rune_lux', qty: 1 }] },
    onWin: 'ghosts_construct_win', onLose: 'ghosts_deep', onEscape: 'ghosts_deep',
  },
  ghosts_construct_win: {
    id: 'ghosts_construct_win', type: 'story',
    text: `The construct folds in on itself and goes dark. Rue stares at the spot where it stood for a long moment.

"Huh." They almost smile. "It read you fine. It just couldn't decide what you were." They look at you differently now. "That's the interesting part, isn't it. Not the elements. What the System does when it can't sort you."

They don't explain what they mean. You're not sure they could.`,
    hpLoss: 10,
    rewards: [{ itemKey: 'rune_lux', qty: 1 }],
    choices: [{ label: 'Back to Rue', next: 'ghosts_deep' }],
  },
  ghosts_construct_skip: {
    id: 'ghosts_construct_skip', type: 'story',
    text: `Rue slips into the dark between two buildings and is gone before the construct finishes turning. When you find them again later, they're quieter than before.

"You didn't have to run with me," they say. "But you did." They let it drop. The construct logged you both anyway.`,
    choices: [{ label: 'Back to Rue', next: 'ghosts_deep' }],
  },

  zone_explanation: {
    id: 'zone_explanation', type: 'story',
    text: `"Each zone is a skill tree," Rue says. "Elemental. Connected to the five branches — offense, defense, flow, arcane, decay. Each element has variations for each build type, so whatever you focused on in Chapter 1, there's a version of each element that extends it."

They pause. "You can only activate one element at a time. The System calls it resonance. You can unlock nodes in multiple elemental trees — learn from them, understand them — but only one element resonates actively in any given fight."

"So pick the one that fits how you fight. Or pick the one the zone opens for. They're not always the same thing."

A silence.

"The Judges respond to elemental resonance. Judge Mercy — the cooperation Judge — responds to Water, Plant, Earth, Wind, Arcane. Protective elements. Patient ones. Judge Wrath — the dominance Judge — responds to Fire, Lightning, Shadow, Metal. Aggressive elements. Precise ones."

Rue looks at the map in your hands. "I don't think either Judge is worse than the other. I think they're the same difficulty, tuned for different kinds of players." A long pause. "I think the System is fair, actually. I just haven't figured out what that means yet."

Rue folds the map slowly. "One thing. The trees aren't the only door — they're just the one everyone walks through. The empty hand opens something else." They shrug, like they don't believe it themselves. "Probably nothing. Most doors are."`,
    choices: [
      { label: 'Head to the district hub',  next: 'district_hub' },
    ],
  },

  // ═══════════════════════════════
  // DISTRICT HUB — 9 ELEMENTAL ZONES
  // ═══════════════════════════════
  district_hub: {
    id: 'district_hub', type: 'story',
    text: `The shopping district spreads out before you. Mostly intact structures, mostly emptied of people — whoever was here before the System arrived either left or became something else. The silence has weight. Not the frozen silence of Chapter 1. This is the silence of aftermath.

Your interface shows ten elemental zones distributed across the district. Some are accessible immediately. Others glow dim — locked, waiting for a threshold you haven't reached yet.

Below the zone map, two separate indicators:

ALLIANCE LOG: Active entries determine which Judge evaluates your cooperation record.
ELEMENTAL RESONANCE: Elements attempted are recorded. Commitment is tracked.

A quiet system note beneath both:

"Only one element can be active at a time. Attempting additional elements does not increase rewards. The system is watching what you choose to do with that information."

The Builders are working somewhere to the east. Voss is watching somewhere to the north. Rue is near the fountain, eyes on the map.

The district is yours to move through. When you've finished what you came here for — the Judges will find you.`,
    choices: [], // rendered dynamically by renderDistrictHub
  },

  // ═══════════════════════════════
  // NPC CHECK-INS (#1 / #2 / #3)
  // Triggered by interrupt in _goToCore when player heads to district_hub.
  // Each fires once; the marker (sera_met / voss_met / rue_met) is set
  // when the player exits the node via any choice, so the encounter cannot
  // re-fire if reloaded mid-conversation.
  // ═══════════════════════════════
  sera_checkin: {
    id: 'sera_checkin', type: 'story',
    text: `Sera intercepts you near the east edge of the plaza. Same composed posture, same precise way of moving — but she's covered in concrete dust and there's blood drying on one cuff.

"You helped one of our teams. I owed you a conversation." She doesn't smile but her voice softens by a measured degree. "I'm short on field hands. The medical station two blocks over needs a resupply — two medical packs, anything you can spare. The team running it is good, but they're cut off until we can clear the lower corridor."

She watches you, patient.

"Take this as the favor it is. Not an obligation. The Builders don't trade in obligations."`,
    choices: [
      { label: 'Hand over two medical packs', sub: 'Costs 2 medical packs · Builder credit', next: 'sera_gave', moral: 5, allianceTag: 'sera_met', requires: [{ itemKey: 'medical_pack', qty: 2 }] },
      { label: '"I don\'t have any to spare."', sub: 'Honest — no penalty', next: 'sera_declined', allianceTag: 'sera_met' },
      { label: 'Walk past her without speaking', sub: 'The System notes the silence', next: 'sera_ignored', moral: -3, allianceTag: 'sera_met' },
    ],
  },
  sera_gave: {
    id: 'sera_gave', type: 'story',
    text: `Sera takes the packs without ceremony. "Logged. Tam will know." She looks at you a beat longer than she needs to. "Some of us are keeping count of who shows up. I wanted you to know that's a thing."

She turns back toward the corridor. Just before she rounds the corner: "Stay alive."`,
    // Mechanically: 1 rare_component as a small thank-you. The "Builder's
    // Mark" concept (#20 Judge scaling hook) is tracked via alliance_log
    // flags, not a literal inventory item.
    cost: [{ itemKey: 'medical_pack', qty: 2 }],
    rewards: [{ itemKey: 'rare_component', qty: 1 }],
    choices: [{ label: 'Continue', next: 'district_hub', allianceTagRepeatable: 'builders_helped' }],
  },
  sera_declined: {
    id: 'sera_declined', type: 'story',
    text: `Sera nods once — the nod of someone whose first instinct was to be insulted and whose second instinct caught the first. "Understood. Stay alive out there." She turns and goes.

You hear her start running before she's even out of sight.`,
    choices: [{ label: 'Continue', next: 'district_hub' }],
  },
  sera_ignored: {
    id: 'sera_ignored', type: 'story',
    text: `You keep walking. Sera watches you pass. She doesn't follow. She doesn't say anything.

Behind you, after a long pause, her boots scuff and head the other direction.`,
    choices: [{ label: 'Continue', next: 'district_hub' }],
  },

  voss_offer: {
    id: 'voss_offer', type: 'story',
    text: `Voss is leaning on a derelict ATM near the north corridor when you come back. They don't pretend to be doing anything else.

"You're making good time. I noticed." They tilt their head. "There's a Builder runner due through the underpass in maybe ten minutes. Carrying salvage. Decent salvage — Sera's people inventory carefully. If they don't make it back, the salvage is yours and nobody on Sera's side knows for certain what happened."

A small pause. Voss doesn't smile.

"I'm not asking you to pull a trigger. I'm telling you there's an option. Information has value. You don't even have to act on it."`,
    choices: [
      { label: '"Tell me where." (intercept the runner)', sub: 'Gear loot · Voss credit', next: 'voss_intercept', moral: -8, allianceTag: 'voss_met' },
      { label: '"Tell me where." (warn the runner)', sub: 'Builder credit', next: 'voss_warned', moral: 5, allianceTag: 'voss_met' },
      { label: '"Not interested."', sub: 'No change', next: 'voss_declined', allianceTag: 'voss_met' },
    ],
  },
  voss_intercept: {
    id: 'voss_intercept', type: 'story',
    text: `You take Voss's directions. The underpass is dim, narrow, perfect for the work. The runner doesn't see you coming.

It's the kid. The one with the bandaged hand, from the alliance scene. They look up at the last second. Their hand goes for a tool, not a weapon. They're not even sure how to do this part.

You take what you came for. You don't look at the face for long.

Voss is gone when you get back to the corridor. There's a single rune left on the wall where they were leaning. Bonus. Acknowledgment.`,
    rewards: [{ itemKey: 'rare_component', qty: 2 }, { itemKey: 'rune_umbra', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'voss_aligned' }],
  },
  voss_warned: {
    id: 'voss_warned', type: 'story',
    text: `You take Voss's directions — and use them the other way. You catch the runner before the underpass, point out where the ambush would be, watch the kid's eyes get very wide.

They press a small foil packet into your hand without breaking eye contact. "Sera will know." They take the long way back.

When you return to the corridor, Voss is still leaning on the ATM. They've watched the whole thing on a salvaged security feed. They don't look angry. They look curious.

"Interesting choice." That's all they say.`,
    rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_metal', qty: 2 }],
    choices: [{ label: 'Continue', next: 'district_hub', allianceTagRepeatable: 'builders_helped' }],
  },
  voss_declined: {
    id: 'voss_declined', type: 'story',
    text: `Voss watches you go without comment. They're still leaning on the ATM when you glance back over your shoulder.

A few minutes later you hear the runner pass through the underpass uneventfully. Voss never moved.

Information has value. Sometimes the value is knowing it was offered, and noting who offered.`,
    choices: [{ label: 'Continue', next: 'district_hub' }],
  },

  rue_intel: {
    id: 'rue_intel', type: 'story',
    text: `Rue is sitting cross-legged on a planter near the fountain, marking up their physical map with a pen that's about to die. They look up when you approach.

"You've cleared two. The pattern's showing." They tap the map. "Hunter scouts have been moving on the zones you haven't hit yet. Voss is testing them. Testing you too, probably."

They turn the map toward you.

"Two of the remaining zones have a Hunter pair set up at the entry. I can tell you which ones. Walk in knowing where they are and you can avoid them clean, or hit them from an angle they're not expecting. Or — your choice — ignore this entirely."

Rue waits. They have all the time in the world.`,
    choices: [
      { label: '"Tell me." (Hunter positions marked on your map)', sub: 'Future zones — clean approach available', next: 'rue_shared', allianceTag: 'rue_met' },
      { label: '"I\'ll figure it out myself."', sub: 'No change', next: 'rue_declined', allianceTag: 'rue_met' },
    ],
  },
  rue_shared: {
    id: 'rue_shared', type: 'story',
    text: `Rue marks two of the remaining zones with a small dot. "Hunters in the entry rooms. You'll see them before they see you if you remember." They roll the map up.

"For what it's worth — they don't all take Voss's offers. Some of them just need the salvage. Up to you what you do when you meet them."

They go back to their pen.`,
    rewards: [{ itemKey: 'district_map', qty: 1 }],
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'rue_aligned' }],
  },
  rue_declined: {
    id: 'rue_declined', type: 'story',
    text: `Rue shrugs — a small, neutral motion. "Suit yourself. I'm not going anywhere." They go back to the map.

You leave them to it.`,
    choices: [{ label: 'Continue', next: 'district_hub' }],
  },

  // ═══════════════════════════════
  // SPARE / EXECUTE REACTIONS
  // ═══════════════════════════════
  // After the player spares or executes a humanoid for the first time, the
  // next time they hit the plaza hub a faction NPC acknowledges it. Each
  // reaction sets a *_reaction_seen flag in alliance_log so it fires once.
  // Sera reacts to spare (Builder-aligned approval, pragmatic).
  // Voss reacts to execute (Hunter-aligned approval, interested).
  // Rue reacts to either (neutral observer, weighs the choice).
  // The interrupts only fire if the player has already met that NPC, so
  // these land as follow-ups rather than introductions.

  spare_reaction_sera: {
    id: 'spare_reaction_sera', type: 'story',
    text: `Sera catches you on the way past the salvage crew. Same dust-streaked sleeves, same controlled posture — but there's something different in her face today. Almost a softening, almost.

"I heard about the scout." She doesn't elaborate on which scout, or which zone. Word travels in the district apparently, and faster than you'd think. "You had them. You didn't take the kill."

She studies you for a moment.

"That used to be the standard out here. Mercy. Before the System sealed the zones and everyone got hungrier." A pause. "I'm not going to thank you for doing the bare minimum. But I'll say — fewer of the Hunters out there think we're worth talking to because of choices like yours. So I'll count it."

She makes a small mark in the notebook she carries everywhere.

"Tam asked after you again, by the way. They keep asking. I keep telling them you're still alive."`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'spare_reaction_seen' }],
  },

  execute_reaction_voss: {
    id: 'execute_reaction_voss', type: 'story',
    text: `Voss is in the plaza when you get there. Not waiting for you — they're never waiting for you, that would be too obvious — but they're close enough that this is happening on purpose.

"You finished one of mine." Voss says it the way someone might note the weather. Cracked visor up, tired face. "Specifically — the scout near the third bend. We found them. Or what was left."

They tilt their head, considering you.

"I'm not angry. The scouts know the risks. What I am, is interested." Voss steps closer. "Most people who come through here freeze when it's a person. They hesitate. They negotiate. They convince themselves the situation isn't what it is. You didn't do that."

A small, dry smile.

"That's the part I wanted to acknowledge. Whatever else happens in this district — you and I are speaking the same dialect now."

Voss steps back.

"My door is open. Just so you know what's in it."`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'execute_reaction_seen' }],
  },

  rue_action_reaction: {
    id: 'rue_action_reaction', type: 'story',
    text: `Rue is in their usual spot — the planter near the fountain, map across their knees. They don't look up when you approach, but they speak before you sit down.

"You had a moment in one of the zones. The kind where the System pauses for a half-second before logging it." They smooth a wrinkle in the paper. "I felt it from here."

Now they look at you. Not judging, not approving — just looking.

"I'm not going to tell you which way you should have decided. I'm not the Judges. But I'll say this — the System keeps a different file on the people who hesitate from the people who don't. You're in one of those files now."

They go back to the map.

"I have no idea which one. That's the honest part."`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'rue_action_reaction_seen' }],
  },

  // ═══════════════════════════════
  // TAM — recurring Builder kid arc (#4)
  // ═══════════════════════════════
  // Tam is the bandaged-handed kid from the cache scene. After meeting
  // the player there, they reappear twice in the mid-chapter: once
  // wounded (mid-1), once at a crossroads being pressured by a Hunter
  // runner (mid-2). Player choices in these scenes feed into how the
  // finales feel — knowing Tam's history shifts the weight of seeing
  // them in the line at the end (hero finale) or as the combat enemy
  // (villain finale).

  tam_wounded: {
    id: 'tam_wounded', type: 'story',
    text: `You're on your way to the next zone when you spot the bandaged hand. Tam is crouched next to a Builder runner you don't recognize — older, maybe early twenties — pressing a cloth against a leg wound that's bleeding through.

Tam looks up when they see you. The kid's face does something complicated.

"You're back." A pause. Then: "I— sorry. I keep doing that. I keep saying things like you've been gone. You haven't. You've just been in the zones."

They go back to working on the bandage. Their hands are steady. The other runner is breathing through clenched teeth.

"I'm running out of clean cloth," Tam says without looking up. "And we're not far from the medical station but I— this isn't the kind of bleeding you can walk through."

They finally look at you again.

"Could you stay? Or — I don't know. Whatever you can do."`,
    choices: [
      { label: 'Help bandage the leg',     sub: 'Stay — Builder credit',                              next: 'tam_wounded_help',    moral: 3, allianceTag: 'tam_helped_fire', allianceTagRepeatable: 'builders_helped' },
      { label: 'Give Tam a medical pack',  sub: 'Costs 1 medical pack — deeper Builder credit',       next: 'tam_wounded_medpack', moral: 4, allianceTag: 'tam_gave_medpack',  requires: [{ itemKey: 'medical_pack', qty: 1 }], cost: [{ itemKey: 'medical_pack', qty: 1 }] },
      { label: '"I have to keep moving."', sub: 'Walk on — Tam notes the choice',                     next: 'tam_wounded_left',    moral: -2, allianceTag: 'tam_walked_past' },
    ],
  },

  tam_wounded_help: {
    id: 'tam_wounded_help', type: 'story',
    text: `You kneel down and take the bandage from Tam. The runner's leg is worse up close — a deep cut, edges already starting to inflame. You hold pressure while Tam tears strips from their own jacket.

Neither of you talk for a while. The breathing of the wounded runner slows. After maybe ten minutes, the bleeding eases.

Tam exhales for what feels like the first time.

"Their name is Dov," Tam says. "They have a daughter in the medical station. She's going to be — okay. Because of you."

The kid stands up. Their hand brushes yours, very brief, very deliberate. It's the kind of touch a kid gives someone they want to remember.

"I'll get them moving. Thank you. Really."`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid1_seen' }],
  },

  tam_wounded_medpack: {
    id: 'tam_wounded_medpack', type: 'story',
    text: `You pull a medical pack from your kit and hand it over. Tam takes it carefully, the way you'd take something fragile.

"You— okay. Okay. This is— this is way more than I was asking for."

Tam tears the pack open. The proper bandage goes on cleanly. The wounded runner — Dov, you'll learn the name later — visibly relaxes.

Tam looks up at you, holding the empty wrapper.

"You didn't have to do that. You really, really didn't have to do that." They tuck the wrapper into a pocket like it means something. "I'm going to remember this. I know I say that a lot. I keep saying it. But I mean it every time."

They go back to securing the bandage. The wound looks like it'll hold.`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid1_seen' }],
  },

  tam_wounded_left: {
    id: 'tam_wounded_left', type: 'story',
    text: `"Okay," Tam says quietly. Just that.

You walk past. The kid doesn't watch you go — they go back to the bandage. The wounded runner — Dov, you'd have learned the name — makes a small sound that might be a thank-you to Tam.

You keep moving toward the zone.

You're not sure if what you just felt was guilt or hunger or the System logging something. Maybe all three.`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid1_seen' }],
  },

  // ── Mid-2: Tam at a crossroads ─────────────────────────────────────
  tam_at_crossroads: {
    id: 'tam_at_crossroads', type: 'story',
    text: `You hear the conversation before you see it — Tam's voice, lower than usual, and another voice you don't recognize. You round the corner and find them in a back alley near the plaza edge.

Tam is talking to a Voss runner. Older, mid-twenties, scar across the jaw. The runner isn't being aggressive — they're being patient, which is somehow worse. Tam looks up when they see you and their face does several things at once.

The Voss runner notices you too and turns, hands raised slightly.

"Not what it looks like." The runner has a dry voice. "I'm just — having a conversation with our young friend here about options. The Builders are folding. Everyone in this district knows it. I'm telling them what happens to the kids when a faction folds."

Tam looks at the ground. Then at you.

"They've been talking to me for a week. About switching. About what Voss can — what Voss can offer me." The kid's voice is steady but quiet. "I haven't said yes. I haven't said no, either."

The Voss runner watches you, waiting.`,
    choices: [
      { label: '"Walk away from them, Tam."',         sub: 'Tell Tam to stay loyal — Builder credit',                       next: 'tam_xroads_loyal',   moral: 3,  allianceTag: 'tam_stayed_builder', allianceTagRepeatable: 'builders_helped' },
      { label: '"Tam, you decide. I won\'t."',         sub: 'Respect the kid\'s agency — no faction shift',                  next: 'tam_xroads_neutral', allianceTag: 'tam_chose_own' },
      { label: '"The Voss runner has a point."',      sub: 'Push Tam toward Voss — Hunter credit + Tam uncertain',          next: 'tam_xroads_voss',    moral: -3, allianceTag: 'tam_uncertain' },
      { label: 'Confront the Voss runner',            sub: 'Combat — they\'re a humanoid',                                    next: 'tam_xroads_fight',   allianceTag: 'tam_defended' },
    ],
  },

  tam_xroads_loyal: {
    id: 'tam_xroads_loyal', type: 'story',
    text: `"Walk away from them, Tam." You don't take your eyes off the Voss runner when you say it.

The runner sighs — a small, patient sigh — and tilts their head toward Tam. "Up to you, kid."

Tam looks between you for maybe three seconds. Then, very deliberately, walks over and stands next to you. Not close enough to touch, but on your side of the alley.

The Voss runner shrugs.

"Fair." They turn and walk away. Slow, unhurried. Not defeated — just done.

Tam exhales when the runner is out of earshot.

"I was going to say no. I think. I'm — pretty sure I was going to say no. But I'm glad you came. It's easier with someone behind you."`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid2_seen' }],
  },

  tam_xroads_neutral: {
    id: 'tam_xroads_neutral', type: 'story',
    text: `"Tam, you decide. I won't make this one for you."

The kid looks at you for a long moment. Surprise — and something else, harder to read. Maybe respect. Maybe loneliness.

Tam turns to the Voss runner.

"I need more time."

The runner nods. "That's fair. I'm here when you've thought about it."

They leave. Tam stays where they are. After a while, they look at you again.

"Most people would have told me what to do. The kind ones especially." A pause. "I don't know if what you did was kind. But it felt different from kindness. It felt like — being a person."

They give you a small, complicated nod and walk back toward the plaza on their own.`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid2_seen' }],
  },

  tam_xroads_voss: {
    id: 'tam_xroads_voss', type: 'story',
    text: `"The runner has a point. The Builders are losing, Tam. You should think about it seriously."

Tam's face goes very still. The Voss runner is watching you now, not Tam, with a small, dry interest. Like noticing something they didn't expect.

"Yeah," Tam says. Just that. The kid's voice has gone flat.

The Voss runner looks at Tam. "We'll talk later, then."

They nod to you — a brief, professional nod, the kind one professional gives another — and leave.

Tam stays. They don't look at you for a long time.

Eventually they say: "I thought you were my friend."

And then they walk off, alone, toward nowhere in particular.`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid2_seen' }],
  },

  tam_xroads_fight: {
    id: 'tam_xroads_fight', type: 'combat',
    text: `"Step away from the kid." You move between Tam and the Voss runner.

The runner sighs. "I was being polite. I really was."

They draw a blade.`,
    enemy: { name: 'Voss Recruiter', icon: '🗡', hp: 130, atk: 18, def: 8, spd: 22, xp: 110, humanoid: true,
      loot: [{ itemKey: 'rare_component', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }] },
    onWin: 'tam_xroads_fight_win', onLose: 'tam_xroads_fight_lose', onEscape: 'tam_xroads_fight_lose',
  },

  tam_xroads_fight_win: {
    id: 'tam_xroads_fight_win', type: 'story',
    text: `The Voss recruiter goes down. You stand over them. Tam is behind you, very quiet.

The recruiter is alive but out of the fight. The blade is gone, the leg won't hold. They look up at you — that same dry, professional look — and wait.`,
    choices: [
      { label: 'Spare them',   sub: 'Let them live',                next: 'tam_xroads_fight_spare',   moral: 3,  allianceTag: 'spared_humanoid' },
      { label: 'Finish them',  sub: 'Executed — the System records it', next: 'tam_xroads_fight_execute', moral: -3, allianceTag: 'executed_humanoid' },
    ],
  },

  tam_xroads_fight_spare: {
    id: 'tam_xroads_fight_spare', type: 'story',
    text: `You step back. The recruiter watches you for a beat, then nods — the slightest nod, recognition between people who could have killed each other and didn't.

They drag themselves up against the wall and stay there.

Tam is staring at you.

"You— you didn't have to fight them at all. But you did. For me."

The kid looks at the recruiter, then back at you.

"Thank you. I'm — I won't forget this."`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid2_seen' }],
  },

  tam_xroads_fight_execute: {
    id: 'tam_xroads_fight_execute', type: 'story',
    text: `You don't pause. The recruiter doesn't make a sound.

Tam does. A small, sharp inhale. Not a scream — a child realizing what they just watched.

You wipe the blade. When you look up, Tam is still there but they have stepped back several paces. Their hand is pressed against the wall like they need it to hold them up.

"Okay." Tam's voice is very even. "Okay. I— I'm going to go now. I'm going to — yeah."

They walk away. They don't look back.`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid2_seen' }],
  },

  tam_xroads_fight_lose: {
    id: 'tam_xroads_fight_lose', type: 'story',
    text: `The Voss recruiter steps over you, calmly. They tap Tam on the shoulder, conversational.

"We'll talk later, kid."

Then they walk away. Tam crouches next to you, panicked, until you can stand.

"I'm sorry," Tam whispers. "I'm so sorry."`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTag: 'tam_mid2_seen' }],
  },

  // ═══════════════════════════════
  // THE SWEEP (#11) — forced plaza encounter
  // Fires from the hub interrupt when tension >= 35 and !sweep_fired.
  // Player has cleared at least 3 zones by definition (cache must have
  // resolved first, which sets cache_seen). The Sweep is a single major
  // alignment choice — defend, join, or escape — and never re-fires.
  // ═══════════════════════════════
  sweep_arrival: {
    id: 'sweep_arrival', type: 'story',
    text: `You're cutting through the central plaza when you hear it — voices raised, then the wet crack of a fist on a face, then shouting. Builders and Hunters have squared up by the fountain. Eight, maybe ten people total. Sera is in front of her crew, hand up, trying to make the moment hold. Voss is across from her, hands open and empty, smiling the way someone smiles before they tell you something is your fault.

The plaza has been waiting for this. The district has too.

A Hunter on Voss's left pulls a knife — slowly, openly, the way you pull a knife when you want to be sure it gets counted.

Tam — the kid with the bandaged hand — steps from behind Sera. They're holding a length of rebar. Their face is white.

The fight is going to happen in about ten seconds. The only question is who you stand next to when it does.`,
    sysMsg: 'THE SWEEP — district alignment is forcing a clash. Choose carefully.',
    choices: [
      { label: 'Stand with the Builders', sub: 'Defend Sera\'s crew', next: 'sweep_defend_combat', moral: 8, allianceTag: 'sweep_builders' },
      { label: 'Stand with the Hunters',  sub: 'Voss has been waiting for this', next: 'sweep_join_combat', moral: -8, allianceTag: 'sweep_hunters' },
      { label: 'Leave the plaza',         sub: 'Let them sort it out · cowardice noted', next: 'sweep_escape', allianceTag: 'sweep_walked' },
    ],
  },
  sweep_defend_combat: {
    id: 'sweep_defend_combat', type: 'combat',
    text: `You move to Sera's flank. She doesn't look at you — but her stance shifts, recalibrating around the new line. Tam slides in behind you. The Hunter on Voss's left lunges first.`,
    enemy: {
      name: 'Hunter Strike Team', icon: '⚔️',
      hp: 180, atk: 24, def: 10, xp: 240,
      // Deliberately NOT humanoid: this is a faction set-piece, not a
      // post-combat mercy beat. The moral choice happens in sweep_arrival.
      loot: [{ itemKey: 'rare_component', qty: 1 }, { itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_blade', qty: 1 }],
    },
    onWin: 'sweep_defend_win', onLose: 'district_hub',
  },
  sweep_defend_win: {
    id: 'sweep_defend_win', type: 'story',
    text: `The Hunters break. Two of them are down. The rest drag the wounded away — including Voss, who walks out under their own power, blood on their cheek and that same small smile fixed in place.

Sera lowers her hands slowly. The plaza is loud with breathing.

"You picked a side, then." She doesn't say thank you. She nods once.

Tam is staring at you. They look — not impressed. Steady. Like they're memorizing your face for later. They give a small nod and step back behind Sera.

Your interface registers a quiet update: ALLIANCE LOG — Builders: Sweep defended. The System has logged the moment.`,
    rewards: [{ itemKey: 'rare_component', qty: 1 }, { itemKey: 'medical_pack', qty: 2 }],
    choices: [{ label: 'Continue', next: 'district_hub' }],
  },
  sweep_join_combat: {
    id: 'sweep_join_combat', type: 'combat',
    text: `You step across the line. Voss's smile widens a fraction — they've been watching this potential the whole chapter. The Builders see you move and Sera's expression goes very still. Tam's hand tightens on the rebar.

Sera moves first. She always was the calmest fighter in the district.`,
    enemy: {
      name: 'Builder Strike Team', icon: '🛡️',
      hp: 200, atk: 22, def: 14, xp: 240,
      loot: [{ itemKey: 'rare_component', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_shield', qty: 1 }],
    },
    onWin: 'sweep_join_win', onLose: 'district_hub',
  },
  sweep_join_win: {
    id: 'sweep_join_win', type: 'story',
    text: `Sera goes down first. She fights well — she fights better than you expected — but she fights without joy, and that's the difference.

When it's over, Tam is still standing. They're holding the rebar in both hands now, knuckles white, looking at Sera on the ground.

Voss puts a hand on your shoulder, briefly. "You'll be famous in this district," they say. "For a little while. Then you'll be useful, which is better."

Tam doesn't move. They're staring at Sera. They're not going to forget this. Neither are you.

Your interface registers a quiet update: ALLIANCE LOG — Hunters: Sweep joined. The System has logged the moment.`,
    rewards: [{ itemKey: 'rare_component', qty: 2 }, { itemKey: 'medical_pack', qty: 1 }],
    choices: [{ label: 'Continue', next: 'district_hub' }],
  },
  sweep_escape: {
    id: 'sweep_escape', type: 'story',
    text: `You back out of the plaza before either side notices you arrive. You hear it start behind you — the first shout, then the first crash, then a sound that might be a body hitting tile.

You don't turn around.

You find a side corridor and keep moving. By the time the sounds fade you're three blocks away and you don't know who won.

Later, in the hub, the district feels different. Neither faction is in their usual position. People are missing on both sides. Nobody asks where you were. The way nobody asks is its own kind of answer.

Your interface registers a quiet update: ALLIANCE LOG — Sweep avoided. The System has logged the silence.`,
    choices: [{ label: 'Continue', next: 'district_hub', allianceTagRepeatable: 'cowardice' }],
  },

  // ═══════════════════════════════
  // PURE HERO FINALE (#27)
  // Intercepts at pre_boss_ch2 entry when:
  //   moral_score >= 60  AND
  //   alliance_log includes 'sweep_builders'  AND
  //   >= 5 zone bosses cleared
  // Sera offers a last defense of the plaza. Player can accept to lock the
  // hero finale (defends with Builder allies, then Judges fight where
  // Mercy is fully present) or decline (proceeds to normal Judges flow).
  // ═══════════════════════════════
  hero_finale_offer: {
    id: 'hero_finale_offer', type: 'story',
    text: `Sera is waiting for you at the edge of the plaza. The Builders have been quietly working — you can see it now in the way the rubble has been moved, the lines of sight cleared, the choke points planned.

"The Judges are coming." She's not asking. She's stating it. "We've been watching the system messages. We have maybe an hour. Maybe less."

Tam steps up beside her. The bandage on their hand is gone. There's a new scar there instead — a clean line, healed past the worst of it.

"We're going to defend this plaza," Sera says. "Not because we think we'll stop them. Because we want them to see a district that didn't fold." She looks at you steadily. "We'd like you to stand with us. One last fight before the assessment. The Judges will see it. They'll see what kind of place you helped make."

Behind her, the other Builders are taking positions. A dozen of them. Not many. Enough.

"This isn't required. You can walk past us right now and the Judges will still come for you. The fight just won't have us in it."`,
    sysMsg: 'HERO TRACK UNLOCKED — defend the plaza with the Builders before facing the Judges.',
    choices: [
      { label: 'Stand with them', sub: 'Defensive fight · Mercy will see this', next: 'hero_finale_combat', moral: 5, allianceTag: 'hero_finale_done' },
      { label: 'Walk past — face the Judges alone', sub: 'Normal Judges fight', next: 'pre_boss_ch2' },
    ],
  },
  hero_finale_combat: {
    id: 'hero_finale_combat', type: 'combat',
    text: `The Hunter remnants come fast — Voss not among them, but their best operators. Sera's line holds. Tam's holds. You're at the apex of the formation. The first wave breaks against you like a wave on cliff.`,
    enemy: {
      name: 'Hunter Remnants', icon: '⚔️',
      hp: 240, atk: 26, def: 12, xp: 280,
      loot: [{ itemKey: 'rare_component', qty: 2 }, { itemKey: 'medical_pack', qty: 2 }, { itemKey: 'scrap_shield', qty: 1 }],
    },
    onWin: 'hero_finale_done', onLose: 'pre_boss_ch2',
  },
  hero_finale_done: {
    id: 'hero_finale_done', type: 'story',
    text: `The Hunters break. Not many of them die. They retreat in good order — Voss's training showing in how they pull back.

Sera lets out a breath she's clearly been holding for a long time. She turns to face you. "Thank you." Just that, just two words, said the way she says things she means.

Tam looks at you. There's something in their face you haven't seen there before. Permission, maybe. The kind of permission a kid grants an adult after long observation.

"Mercy will see this," Sera says. "She's the one who designed this kind of mattering."

The plaza is quiet again. The Judges are coming. But this time you won't be standing in it alone.`,
    rewards: [{ itemKey: 'rare_component', qty: 1 }, { itemKey: 'medical_pack', qty: 3 }],
    choices: [{ label: 'Face the Judges', next: 'pre_boss_ch2' }],
  },

  // ═══════════════════════════════
  // PURE VILLAIN FINALE (#26)
  // Intercepts at pre_boss_ch2 entry when:
  //   moral_score <= -60  AND
  //   alliance_log includes 'sweep_hunters'  AND
  //   >= 5 zone bosses cleared
  // Voss offers a final sweep of the last Builder positions, with Tam
  // standing in the way. Player can complete the run (Judges fight where
  // Wrath dominates entirely) or decline (proceeds to normal Judges).
  // ═══════════════════════════════
  villain_finale_offer: {
    id: 'villain_finale_offer', type: 'story',
    text: `Voss intercepts you in the corridor approaching the plaza. The smile is there but it's tired around the edges. They've been working.

"There's one more position." They don't bother with preamble anymore — you're past that. "The Builders' last holdout. Three of them. The kid is with them. We can clear it before the Judges arrive. The Judges will see a district that committed all the way."

A pause. They're watching your face.

"I'm not asking you to do something I haven't done. But you're better at it than I am now. You've been moving differently the last few zones. Like you stopped needing to think about it."

The corridor is dark. The Judges are coming. Voss isn't going to ask twice.`,
    sysMsg: 'VILLAIN TRACK UNLOCKED — finish the district before facing the Judges.',
    choices: [
      { label: 'Finish it', sub: 'Final sweep · Wrath will see this', next: 'villain_finale_combat', moral: -5, allianceTag: 'villain_finale_done' },
      { label: 'Walk past — face the Judges alone', sub: 'Normal Judges fight', next: 'pre_boss_ch2' },
    ],
  },
  villain_finale_combat: {
    id: 'villain_finale_combat', type: 'combat',
    text: `The Builders' last position is a service corridor. Two of them go down fast — they were tired. The third puts up a real fight before Voss takes them from behind.

Then it's just the kid. Tam. Standing in front of a doorway. Holding the same length of rebar from the plaza. They've been crying. They are not crying now.`,
    enemy: {
      name: 'Tam', icon: '⚔️',
      hp: 130, atk: 24, def: 10, xp: 200,
      humanoid: true,
      loot: [{ itemKey: 'rare_component', qty: 1 }, { itemKey: 'medical_pack', qty: 2 }],
      executeLoot: [{ itemKey: 'judges_seal', qty: 1 }],
    },
    onWin: 'villain_finale_done', onLose: 'pre_boss_ch2',
    onSpare: 'villain_finale_done_spared',
    onExecute: 'villain_finale_done_executed',
  },
  villain_finale_done: {
    id: 'villain_finale_done', type: 'story',
    text: `Tam is down. Voss steps past you, checks them, says nothing. The corridor is silent in a way the district has never been.

"It's done." Voss is matter-of-fact. They look at you with something that's not quite respect but isn't far from it. "Wrath will see this. Mercy won't even speak. That's the form you've earned."

The Judges are still coming. But there's nothing left in this district for them to weigh except you.`,
    choices: [{ label: 'Face the Judges', next: 'pre_boss_ch2' }],
  },
  villain_finale_done_spared: {
    id: 'villain_finale_done_spared', type: 'story',
    text: `Tam is on the ground but breathing. You step over them. Voss watches.

"Interesting," Voss says. Just that.

You don't look back. The Judges are coming.`,
    choices: [{ label: 'Face the Judges', next: 'pre_boss_ch2' }],
  },
  villain_finale_done_executed: {
    id: 'villain_finale_done_executed', type: 'story',
    text: `Tam doesn't make a sound. You move past Voss without looking at them. The seal on Tam's vest comes off easily — Sera's mark. You take it.

When you step back into the corridor, Voss is gone. The plaza is empty.

The Judges are already there.`,
    rewards: [{ itemKey: 'judges_seal', qty: 1 }],
    choices: [{ label: 'Face the Judges', next: 'pre_boss_ch2' }],
  },

  // ═══════════════════════════════
  // NPC TRADER
  // ═══════════════════════════════
  trader_intro: {
    id: 'trader_intro', type: 'story',
    text: `The intact shop is a narrow space — a phone repair kiosk that someone has converted into something else. Behind the counter sits a small person with careful hands and a headset they're not using anymore.

They look up when you enter. Not startled. Like they've been waiting.

"You're not from this district," they say. "Good. The ones from here bring too much history."

They gesture at the shelves behind them. Not phone parts anymore — material goods, System-compatible items, a few things you recognize from Chapter 1 loot tables.

"I trade for scraps, for information, and occasionally for favors. Standard System economy." They tilt their head. "You look like you need something. You also look like you're not sure what it is yet. That's fine. Take a look."

A name tag on the counter reads PELL, written in careful block letters.`,
    choices: [
      { label: 'Browse Pell\'s stock',     sub: 'See what\'s available',      next: 'trader_shop',  allianceTag: 'pell_met' },
      { label: 'Ask Pell about the zones', sub: 'They might know something',  next: 'trader_lore',  allianceTag: 'pell_met' },
      { label: 'Ask about the Judges',     sub: 'Get a neutral read',         next: 'trader_judges', allianceTag: 'pell_met' },
      { label: 'Leave the shop',           sub: 'Continue into the district', next: 'district_hub', allianceTag: 'pell_met' },
    ],
  },

  trader_shop: {
    id: 'trader_shop', type: 'story',
    text: `Pell slides a short list across the counter. Handwritten, organized into columns.

WEAPONS: Notched blade (atk +6), Shock rod (atk +4, lightning damage), Reinforced gloves (atk +3, guard +2)

ARMOR: Patchwork vest (def +8), Wired jacket (def +5, speed +2), Glass-fiber shield (guard +8)

CONSUMABLES: Stabilizer pack (restore 40 HP), Signal jammer (1-turn enemy stun), Adrenaline spike (speed +5 for 1 fight)

MATERIALS: Scrap runs, component packs, and two items marked ELEMENTAL REAGENT — one labeled Ignis Seed, one labeled Aqua Cord.

"Elemental Reagents are new this chapter," Pell says. "They don't do anything on their own. Take them to the right zone and they open the zone faster — like a key that makes the lock easier." They shrug. "Or don't. The zones open for the right person without any key. It just takes longer."`,
    rewards: [],
    choices: [
      { label: 'Buy the Ignis Seed for 80 gold',        sub: 'Fire zone accelerant', next: 'buy_ignis_seed' },
      { label: 'Buy the Aqua Cord for 80 gold',         sub: 'Water zone accelerant', next: 'buy_aqua_cord' },
      { label: 'Buy a Stabilizer pack for 50 gold',     sub: 'Restore 40 HP', next: 'buy_stabilizer' },
      { label: 'Look but don\'t buy anything',          next: 'trader_intro' },
    ],
  },

  buy_ignis_seed:  { id:'buy_ignis_seed',  type:'story', text:`Pell wraps it in foil. "Don't drop it. It doesn't explode but it does stain everything permanently orange."`, rewards:[{itemKey:'ignis_seed',qty:1}], choices:[{label:'Continue', next:'district_hub'}] },
  buy_aqua_cord:   { id:'buy_aqua_cord',   type:'story', text:`Pell hands it over — a length of silvery cord that's always slightly damp. "Don't ask what it's made of. I asked. I regret it."`, rewards:[{itemKey:'aqua_cord',qty:1}], choices:[{label:'Continue', next:'district_hub'}] },
  buy_stabilizer:  { id:'buy_stabilizer',  type:'story', text:`Pell slides the pack across without ceremony. "Reliable. I've tested everything I sell." They say it flatly enough that you believe them.`, rewards:[{itemKey:'stabilizer_pack',qty:1}], choices:[{label:'Continue', next:'district_hub'}] },

  trader_lore: {
    id: 'trader_lore', type: 'story',
    text: `Pell leans on the counter.

"The nine zones were always here. Before the System activated — they were just buildings. Places. The fire zone was a kitchen supply store. The lightning zone was an electronics hub." They pause. "The System put something in them when it arrived. Not locked them — seeded them. Like it was curious what would grow."

A quiet moment.

"The zones respond to resonance. That's the official System term. Resonance is what happens when who you are and what you're standing in match closely enough. A fire zone resonates with aggression — not anger, aggression. The kind that's cold and deliberate. A water zone resonates with patience — not passivity, patience. The ability to absorb and redirect." Pell tilts their head. "I've been in and out of this district for a week. I think about it differently now."

"The zones don't want you to be special. They want you to be consistent."`,
    choices: [
      { label: 'Ask about the Judges', next: 'trader_judges' },
      { label: 'Go to the district',   next: 'district_hub' },
    ],
  },

  trader_judges: {
    id: 'trader_judges', type: 'story',
    text: `Pell's expression changes slightly. More careful.

"The Judges. Right." They come around the counter and sit on a stool. "I saw Mercy once, at the end of someone else's run. Briefly. It looked like — the most patient thing I've ever seen. Like it had been waiting a very long time and wasn't surprised by anything."

A long pause.

"Wrath I've only heard about. Players who faced Wrath describe it as... precise. Like it already knew what you'd done and was just confirming the math. No judgment in the face. Just accounting."

Pell looks at you directly.

"I don't know which one you'll face. I don't think anyone does until the chapter ends. But I'll tell you what I've observed: the players who faced both at once — the ones who did some of everything — they came out changed differently than the ones who faced just one. Not better or worse. Just different kinds of changed." 

They stand and go back behind the counter.

"Both Judges can be beaten. Both Judges can be respected. The System doesn't punish you for who you are. It evaluates you. That's different."`,
    choices: [
      { label: 'Go into the district', next: 'district_hub' },
    ],
  },

  // ═══════════════════════════════
  // THE BETRAYAL OPPORTUNITY
  // ═══════════════════════════════
  cache_betrayal_offer: {
    id: 'cache_betrayal_offer', type: 'story',
    text: `You're passing through the east corridor when Voss falls into step beside you. Silent until they choose to speak.

"The Builders are signing the third cache right now," Voss says. "Sera and two others. Alliance signature, full cooperative protocol." A pause. "There's a four-minute window after the cache opens where the distribution protocol hasn't locked in. Items are accessible to anyone with hands."

They keep walking.

"I'm not going to take it. I want to be clear — I'm not doing this. My record is already what it is and one cache isn't interesting to me." They glance sideways at you. "But someone could. The Builders trust you. You could be standing right there."

They stop walking.

"I'm telling you because the System knows about this opportunity whether you take it or not. The Judges know. Mercy will know you didn't betray your allies. Wrath will know you chose not to when you could." Voss almost smiles. "Either way, it becomes part of your record. Deliberate choice is what matters — not which choice."

They start walking again. "I'm going to the Shadow zone now. It's been open for me since the first day."`,
    choices: [
      { label: 'Go to the cache — consider it',     sub: 'See what the Builders found', next: 'cache_consider', moral: -3, allianceTag: 'cache_seen' },
      { label: 'Walk away from the offer',           sub: 'Your record stays clean', next: 'cache_refused', moral: 5, allianceTag: 'cache_seen' },
      { label: 'Report the offer to Sera',           sub: 'Build trust with Sera',    next: 'cache_reported', moral: 10, allianceTag: 'cache_seen' },
    ],
  },

  cache_consider: {
    id: 'cache_consider', type: 'story',
    text: `You go to the cache opening.

The Builders are there — Sera, two others named Dov and Mira, and the bandaged-hand kid from yesterday. They've completed the unlock. The cache is open. Contents spill out on a cloth they've laid on the floor: medical supplies, two weapon upgrades, three material packs, and a sealed System container with a glyph on the side.

Sera looks up and nods at you. Waves you closer. She's already started tallying the split.

The four-minute window ticks in your peripheral interface. Invisible to them.

You look at the cache. You look at Sera's careful hands doing the tally. You look at the bandaged kid taking inventory with a cracked stylus.

Your interface: MORAL DECISION POINT. This action will be recorded.

Two paths forward from here — take, or stand.`,
    choices: [
      { label: 'Take nothing — stand with the Builders', sub: 'Full alliance maintained', next: 'cache_stood', moral: 8 },
      { label: 'Take the sealed container and leave',    sub: 'Betrayal — recorded permanently', next: 'cache_betrayed', moral: -20 },
    ],
  },

  cache_stood: {
    id: 'cache_stood', type: 'story',
    text: `The four minutes pass. The distribution protocol locks in.

Sera hands you your share: a medical pack, a material bundle, and a small weapon component you don't have a name for yet.

"Good work," she says, without looking up.

The bandaged kid — you learn their name is Tam — gives you a fistbump. Unselfconscious. Like it was the obvious thing to do.

Your interface: ALLIANCE LOG UPDATED. Cache cooperation recorded. Mercy weight +3.

You don't feel heroic. You feel like someone who made a decision and then stuck with it. The System doesn't seem to have an opinion about that distinction.

Sera catches your eye. "The Judges will see this. What you could have done and didn't. I think that matters to Mercy." She pauses. "I think it matters to Wrath too, differently."`,
    xp: 100,
    rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_metal', qty: 3 }],
    choices: [
      { label: 'Head to the elemental zones', next: 'district_hub' },
    ],
  },

  cache_betrayed: {
    id: 'cache_betrayed', type: 'story',
    text: `You take the sealed container. Move fast. Out of the room before the distribution protocol locks in.

Sera's voice, behind you: "—hey—"

You don't stop.

Outside, the container opens: two item upgrades, a rare material. Worth something.

Your interface: BETRAYAL RECORDED. Alliance: Builders — BROKEN. Moral −40. Backstab counter: +1. Wrath weight +5.

The container is in your pack. The items are real. The record is real.

Voss passes you on a side corridor without stopping. Just a small nod — not approval, just acknowledgment. You made a deliberate choice. They respect deliberate choices.

The Builders won't trust you again this chapter. Some zones that respond to cooperation will be harder to access now. The Shadow zone, however, and the Fire zone — your interface shows them both lit up clearly. Resonating.

The System didn't punish you. It updated you.`,
    xp: 60,
    rewards: [{ itemKey: 'rare_component', qty: 1 }, { itemKey: 'scrap_metal', qty: 2 }],
    choices: [
      { label: 'Head to the Shadow zone', sub: 'Now open to you', next: 'zone_shadow' },
      { label: 'Go to the district hub',  next: 'district_hub' },
    ],
  },

  cache_refused: {
    id: 'cache_refused', type: 'story',
    text: `You keep walking. Voss watches you go.

Later, Sera finds you near the map station. "Voss told me what they offered you." She's direct about it, no setup. "Thank you for not taking it."

"You weren't there," you say.

"I know. That's why it counts."

She adds something to your share of the cache distribution — a small extra, unmarked. The bandaged kid, Tam, gives you a more formal nod this time. Like something's been decided about you.

Your interface: MORAL RECORD — Refusal logged. Mercy weight +5. Wrath weight −2.

It doesn't feel like a big moment. It probably shouldn't.`,
    xp: 120,
    rewards: [{ itemKey: 'medical_pack', qty: 1 }, { itemKey: 'scrap_metal', qty: 4 }],
    choices: [
      { label: 'Head to the elemental zones', next: 'district_hub' },
    ],
  },

  cache_reported: {
    id: 'cache_reported', type: 'story',
    text: `You find Sera before the opening. Tell her what Voss offered. No commentary — just the facts.

She listens without interrupting. When you finish she nods once.

"Voss does this," she says. "Tests people. I don't think they're malicious. I think they're curious." A pause. "We'll keep an eye on the window. Thank you."

At the cache opening, Voss appears. They see you. They see Sera's people distributed around the room. They see you meet their eye.

For a moment nothing happens.

Then Voss nods — small, real — and leaves without a word.

Sera's team completes the opening cleanly. Your share is full, plus a bonus Sera calls "trustworthy conduct." Tam high-fives you. You let them.

Interface: TRUST EVENT RECORDED. Alliance: Builders — Reinforced. Mercy weight +8. Moral +10. Permanent flag: "Can be trusted under pressure."`,
    xp: 150,
    rewards: [{ itemKey: 'medical_pack', qty: 2 }, { itemKey: 'scrap_metal', qty: 5 }],
    choices: [
      { label: 'Head to the elemental zones', next: 'district_hub' },
    ],
  },

  // ═══════════════════════════════
  // SYSTEM ESCALATION NODES
  // (triggered when player enters a 2nd or 3rd+ element zone)
  // ═══════════════════════════════
  zone_second_element_warning: {
    id: 'zone_second_element_warning', type: 'story',
    text: `Your interface flickers.

Not a glitch. Something deliberate.

A single line appears in a font you haven't seen the system use before — slightly smaller, monospace, cold:

"Greed detected."

A pause. Then:

"Deviation from chosen path observed."

The zone behind you closes. Not locked — just no longer interested in you. The elemental resonance you carried into it reads as background noise now. Whatever it recognized in you was already spent elsewhere.

The new zone ahead activates anyway. The System doesn't close doors out of punishment. It opens them without enthusiasm.

Your interface updates: Enemy parameters escalating.
All enemies in remaining zones: ×2 HP, ATK, DEF, SPD.
XP per kill: unchanged.

The next zone will not provide guidance. The system has stopped calibrating for your success.`,
    sysMsg: 'Deviation from chosen path observed. Escalating trial parameters.',
    choices: [
      { label: 'Continue into the district', next: 'district_hub' },
    ],
  },

  zone_third_element_warning: {
    id: 'zone_third_element_warning', type: 'story',
    text: `No flicker this time.

The system message appears directly on top of your field of view — not in the interface panel, not in a notification. Embedded in your vision like a heads-up display that doesn't belong to you:

"Power without commitment is instability."

Then:

"Escalating trial parameters."

Then nothing. The message doesn't clear. It fades, slowly, over fifteen seconds. Like it wants you to read it multiple times.

The zone ahead is active. The enemies inside are — different. Not visually. But the way they move has changed. Faster. More deliberate. Like something recalibrated them while you were deciding to come here.

Your interface: All enemies — ×4 HP, ATK, DEF, SPD.
Environmental hazards: active.
System support: withdrawn.

A final line, in a smaller font than everything else, as if the system is saying it to itself:

"You were given a path. You chose to take more. Now survive the weight of it."`,
    sysMsg: 'Power without commitment is instability. Parameters at ×4. System support withdrawn.',
    choices: [
      { label: 'Enter the zone anyway', next: 'district_hub' },
    ],
  },

  judge_lore_builders: {
    id: 'judge_lore_builders', type: 'story',
    text: `"Mercy and Wrath," Sera says. "We've been piecing together what we know."

She sits down. This is a longer conversation.

"Mercy appeared at the end of Chapter 1 for two players on our network who we know had high cooperation scores. Both described the same thing: an entity that was calm, precise, and — strange word for a System entity — kind. Not soft. Just fair. It evaluated what they built, who they helped, what they gave up. It didn't ask them to justify their choices. It just — confirmed them. And then it fought them."

"It's still a boss fight?"

"It's still a boss fight." She almost smiles. "The System evaluates you and then tests you. That's what it does. Mercy is hard. But the players who faced it said it felt like the System respecting them enough to take them seriously." 

She pauses.

"Wrath. The two people I know of who faced Wrath were quieter about it afterward. Not damaged — just quieter. One of them said: 'It knew exactly what I'd done and it didn't blink. It just wanted to see if I was as good at fighting as I was at taking.'" She looks at you. "Both players survived. Both players changed differently."`,
    choices: [
      { label: 'Head to the elemental zones', next: 'district_hub' },
    ],
  },

  // ═══════════════════════════════
  // PRE-BOSS GATE — routes through camp_reflection on first time
  // ═══════════════════════════════
  // The district hub points here instead of pre_boss_ch2 directly. On first
  // visit, the player is routed through camp_reflection to give the chapter
  // a quiet before-the-storm moment. Subsequent visits (replay, back-button)
  // go straight to pre_boss_ch2.
  pre_boss_gate: {
    id: 'pre_boss_gate', type: 'story',
    sysMsg: '',
    text: '',
    choices: [], // filled by route() — see below
    route(p) {
      return (p.alliance_log || []).includes('camp_seen')
        ? 'pre_boss_ch2'
        : 'camp_reflection'
    },
  },

  // ═══════════════════════════════
  // CAMP REFLECTION — the night before the Judges
  // ═══════════════════════════════
  // Text is composed at render-time from buildCampReflection(player).
  // Sets camp_seen on exit so it cannot re-fire if the player backs out
  // and returns later. Single choice leads to pre_boss_ch2.
  camp_reflection: {
    id: 'camp_reflection', type: 'story',
    sysMsg: 'CHAPTER ASSESSMENT BEGINNING — reflection logged.',
    text: '', // built dynamically
    choices: [
      { label: 'Walk back out into the plaza', sub: 'The Judges are summoning. You are ready.', next: 'pre_boss_ch2', allianceTag: 'camp_seen' },
    ],
  },

  // ═══════════════════════════════
  // PRE-BOSS CONVERGENCE
  // ═══════════════════════════════
  pre_boss_ch2: {
    id: 'pre_boss_ch2', type: 'story',
    text: `Your interface pulses once. An unfamiliar color — not the usual gold. Something cooler. More deliberate.

CHAPTER ASSESSMENT COMPLETE.
MORAL RECORD: Compiled.
ALLIANCE LOG: Compiled.
ELEMENTAL RESONANCE: Recorded.
ELEMENTS ATTEMPTED: Recorded.

[ The readout hesitates on that last line — ELEMENTS ATTEMPTED — as if checking it twice. For a fraction of a second a different status flickers behind it, one you don't recognize, before the interface smooths it over. Whatever it was, it didn't read as an error. It read as a category. ]

TWIN JUDGES: Summoned.

The district goes quiet in a new way. Not the System-pause quiet. Not the aftermath quiet. A third kind of quiet — expectation made physical.

The plaza is empty now. The Builders are gone. Voss is gone. Rue is gone. Pell's shop is dark.

It's just you and the fountain and the broken glass and whatever's coming.

Two shapes at the far end of the plaza. One moving toward you with the patience of something that has been waiting in exactly this way for exactly this moment. The other standing still — already there, somehow, without having arrived.

Your interface shows both:

JUDGE MERCY — Judge of Salvation
JUDGE WRATH — Judge of Ruin

Two axes. Two records. Both present.

A system message, the last one before the fight:

"The system adapts to human choices. This is what that looks like."

Below it, quieter, as if the system didn't mean for you to read it:

"The form this takes depends on what you built. Both of what you built."`,
    choices: [
      { label: 'Face the Twin Judges', sub: 'Boss fight — your full record determines the encounter', next: 'judges_verdict' },
    ],
  },

  // ═══════════════════════════════
  // JUDGES VERDICT — dynamic record readout
  // (text composed at render-time from real player state)
  // ═══════════════════════════════
  judges_verdict: {
    id: 'judges_verdict', type: 'story',
    sysMsg: 'TWIN JUDGES — Record review in progress.',
    text: '',
    choices: [
      { label: 'Stand before them', sub: 'The reading is finished. The fight begins.', next: 'boss_judges' },
    ],
  },

  // ═══════════════════════════════
  // BOSS FIGHT — TWIN JUDGES
  // ═══════════════════════════════
  boss_judges: {
    id: 'boss_judges', type: 'boss',
    text: `The reading is finished. The interfaces fold away — every choice, every alliance, every elemental zone, every life ended or spared, returned to wherever the System keeps things it has already accounted for.

Both Judges look at you now. Not the record — you.

Mercy's halo settles into its working state, twice the complexity of any System display you've seen.
Wrath's compression sharpens.

Neither of them speaks again.

The fight begins.`,
    enemy: {
      name: 'The Twin Judges',
      icon: '⚖️',
      hp: 380,
      atk: 22,
      def: 14,
      xp: 600,
      img: '../assets/boss/equilibrium.webp',
      loot: [{ itemKey: 'judges_seal', qty: 1 }, { itemKey: 'rune_lux', qty: 1 }],
    },
    bossKey: 'twin_judges',
    onWin:  'chapter_end_ch2',
    onLose: 'pre_boss_ch2',
  },

  // ═══════════════════════════════
  // CHAPTER END
  // ═══════════════════════════════
  chapter_end_ch2: {
    id: 'chapter_end_ch2', type: 'end',
  },

}
