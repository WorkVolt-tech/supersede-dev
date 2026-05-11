export const NODES = {

  // Zone nodes — each element is a separate file in ./zones/
  ...ZONE_FIRE,
  ...ZONE_WATER,
  ...ZONE_LIGHTNING,
  ...ZONE_ARCANE,
  ...ZONE_SHADOW,
  ...ZONE_EARTH,
  ...ZONE_WIND,
  ...ZONE_PLANT,
  ...ZONE_METAL,
  ...ZONE_POISON,  // ═══════════════════════════════
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
      { label: 'Approach the salvage crew',        sub: 'The Builders — they look organized', next: 'meet_builders_first' },
      { label: 'Talk to the solo watcher',          sub: 'The Ghosts — quiet, hard to read',  next: 'meet_ghosts_first' },
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
      { label: 'Walk toward the Builders',       sub: 'Signal cooperation — moral +10',   next: 'meet_builders',  moral: 10 },
      { label: 'Walk toward the Hunters',        sub: 'Signal strength — moral -5',        next: 'meet_hunters',   moral: -5 },
      { label: 'Sit with the Ghosts',            sub: 'Signal neutrality — no change',     next: 'meet_ghosts' },
      { label: 'Stand in the center and wait',   sub: 'Let them come to you',              next: 'plaza_center' },
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
      { label: '"I survived it."',                 sub: 'Evasive — Hunters will like it',     next: 'faction_talk_evasive', moral: -5 },
      { label: '"I helped people along the way."', sub: 'Signal alignment — Builders respond', next: 'faction_talk_helper', moral: 10 },
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
      { label: 'Agree to work with the Builders', next: 'builders_alliance', moral: 10 },
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
      { label: 'Offer to be the partner',      sub: 'Alliance signature — moral +15',  next: 'builders_alliance', moral: 15 },
      { label: "Ask what you'd get out of it",  sub: 'Practical question',              next: 'builders_negotiation' },
      { label: 'Keep your options open',        sub: 'Non-committal',                   next: 'district_hub' },
    ],
  },

  builders_negotiation: {
    id: 'builders_negotiation', type: 'story',
    text: `Sera doesn't look offended. She expected the question.

"Access to our stockpile. A guaranteed share of whatever's in the third cache. Backup on the elemental zones — we've mapped three of the nine and cleared the approaches." She pauses. "And the honest version: we'll vouch for you to the Judges."

You raise an eyebrow.

"The Twin Judges — you haven't heard yet?" She sets the tablet down. "The System placed them here when the alliances fractured. Two evaluators — one looks at what you built, one looks at what you took. At the end of this chapter, everyone faces one of them, or both. I don't know exactly how it works. I know that the people who worked with us in Chapter 1 — I mean, people who helped others — they faced the less dangerous version."

She picks the tablet back up.

"I'm not trying to scare you into it. I'm telling you what I know. You can decide what that's worth."`,
    choices: [
      { label: 'Sign the alliance',  sub: 'moral +15', next: 'builders_alliance', moral: 15 },
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

Voss pulls up their interface. "The System is watching cooperation and betrayal in this district. Both. It's not punishing either one — it's measuring. The Judges at the end aren't punishment. They're evaluation. Judge Mercy evaluates what you built and with whom. Judge Wrath evaluates what you took and how."

They look at you. "Most players will face one of them. The ones who split their choices — both cooperation and betrayal in the record — they face both at once." They pause. "I've heard it's the hardest fight. I've also heard the rewards are different. The System gives you what matches what you are, not what you want."

They lean against a broken shelf. "I'm not recruiting you to betray the Builders. I'm telling you the System doesn't care which path you pick. It just wants you to pick deliberately."`,
    xp: 50,
    choices: [
      { label: 'Ask what Voss wants',          next: 'hunters_voss_goal' },
      { label: 'Ask about the elemental zones', next: 'ghosts_deep' },
      { label: 'Head into the district',       next: 'district_hub' },
    ],
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

They hand you the map. "Maybe you are."`,
    xp: 60,
    rewards: [{ itemKey: 'district_map', qty: 1 }],
    choices: [
      { label: 'Ask what the zones give you',     next: 'zone_explanation' },
      { label: 'Head into the district',          next: 'district_hub' },
    ],
  },

  zone_explanation: {
    id: 'zone_explanation', type: 'story',
    text: `"Each zone is a skill tree," Rue says. "Elemental. Connected to the five branches — offense, defense, flow, arcane, decay. Each element has variations for each build type, so whatever you focused on in Chapter 1, there's a version of each element that extends it."

They pause. "You can only activate one element at a time. The System calls it resonance. You can unlock nodes in multiple elemental trees — learn from them, understand them — but only one element resonates actively in any given fight."

"So pick the one that fits how you fight. Or pick the one the zone opens for. They're not always the same thing."

A silence.

"The Judges respond to elemental resonance. Judge Mercy — the cooperation Judge — responds to Water, Plant, Earth, Wind, Arcane. Protective elements. Patient ones. Judge Wrath — the dominance Judge — responds to Fire, Lightning, Shadow, Metal. Aggressive elements. Precise ones."

Rue looks at the map in your hands. "I don't think either Judge is worse than the other. I think they're the same difficulty, tuned for different kinds of players." A long pause. "I think the System is fair, actually. I just haven't figured out what that means yet."`,
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
      { label: 'Browse Pell\'s stock',     sub: 'See what\'s available',      next: 'trader_shop' },
      { label: 'Ask Pell about the zones', sub: 'They might know something',  next: 'trader_lore' },
      { label: 'Ask about the Judges',     sub: 'Get a neutral read',         next: 'trader_judges' },
      { label: 'Leave the shop',           sub: 'Continue into the district', next: 'district_hub' },
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
      { label: 'Go to the cache — consider it',     sub: 'See what the Builders found', next: 'cache_consider', moral: -5 },
      { label: 'Walk away from the offer',           sub: 'Your record stays clean — moral +10', next: 'cache_refused', moral: 10 },
      { label: 'Report the offer to Sera',           sub: 'Build trust — moral +20',    next: 'cache_reported', moral: 20 },
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
      { label: 'Take nothing — stand with the Builders', sub: 'moral +15, full alliance maintained', next: 'cache_stood', moral: 15 },
      { label: 'Take the sealed container and leave',    sub: 'Betrayal — moral -40. Recorded permanently.', next: 'cache_betrayed', moral: -40 },
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

Interface: TRUST EVENT RECORDED. Alliance: Builders — Reinforced. Mercy weight +8. Moral +20. Permanent flag: "Can be trusted under pressure."`,
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

TWIN JUDGES: Summoned.

The district goes quiet in a new way. Not the System-pause quiet. Not the aftermath quiet. A third kind of quiet — expectation made physical.

The plaza is empty now. The Builders are gone. Voss is gone. Rue is gone. Pell's shop is dark.

It's just you and the fountain and the broken glass and whatever's coming.

Two shapes at the far end of the plaza. One moving toward you with the patience of something that has been waiting in exactly this way for exactly this moment. The other standing still — already there, somehow, without having arrived.

Your interface shows both:

JUDGE KAELITH — Evaluator of Cooperation
JUDGE MORREN — Evaluator of Dominance

Two axes. Two records. Both present.

A system message, the last one before the fight:

"The system adapts to human choices. This is what that looks like."

Below it, quieter, as if the system didn't mean for you to read it:

"The form this takes depends on what you built. Both of what you built."`,
    choices: [
      { label: 'Face the Twin Judges', sub: 'Boss fight — your full record determines the encounter', next: 'boss_judges' },
    ],
  },

  // ═══════════════════════════════
  // BOSS FIGHT — TWIN JUDGES
  // ═══════════════════════════════
  boss_judges: {
    id: 'boss_judges', type: 'boss',
    text: `Mercy arrives like weather — not a dramatic entrance but a presence that was suddenly relevant. Tall. Still. An interface halo twice the complexity of any System display you've seen. Eyes that are cataloguing, not judging — or judging in the sense that a scale judges: accurately, without preference.

Wrath is already beside you somehow. No approach. Just — adjacent. Smaller than Mercy. More compressed. The feeling off Wrath is like holding something very sharp — not threatening unless you make a mistake.

Neither of them speaks.

Their interfaces open simultaneously. Your record scrolls between them — every choice, every alliance, every betrayal, every cooperation, every elemental zone entered. All of it, in precise System notation.

Mercy's display highlights the cooperative entries. They glow warm.
Wrath's display highlights the decisive entries. They glow cold.
A third column, narrower than the others: ELEMENTAL RESONANCE. Every zone you entered. One entry, or more.

Both Judges look at the third column. Then at each other. Then at you.

The form this fight takes — who leads, whether they stay separate, whether they become something neither of them was before — that was decided before they arrived. By you.

The fight begins.`,
    enemy: {
      name: 'The Twin Judges',
      icon: '⚖️',
      hp: 380,
      atk: 22,
      def: 14,
      xp: 600,
      img: '../assets/boss/twin_judges.png',
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

} // END NODES

// ═══════════════════════════════════════════════════════════
// ENGINE — mirrors chapter1 exactly
// ═══════════════════════════════════════════════════════════

