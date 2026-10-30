// Chapter III — Signal Hunters. Canon: metro tunnels / Echo Beast.
// Story nodes use the existing React story engine and its persistent ch3_* save IDs.
const foe=(name,icon,hp,attack,xp)=>({name,icon,hp,atk:attack,def:4,speed:9,xp,loot:[]})
export const NODES={
 opening:{id:'opening',type:'story',text:`CHAPTER 3 — SIGNAL HUNTERS

ZONE: THE METRO TUNNELS

A signal emerges below the city. Its frequency matches the System's oldest transmissions—possibly the source itself.

The escalators are still. Water drips down the tiled stairwell. Your receiver plays a voice saying your name. It is your own voice, but you haven't spoken.

SYSTEM NOTICE: SIGNAL SOURCE UNCONFIRMED. OBSERVATION RECOMMENDED.

A subway map shows three routes toward the abandoned central interchange. You feel the walls listening.`,choices:[{label:'Study the metro map before descending',next:'map'},{label:'Go straight down to the platform',next:'platform'},{label:'Investigate a weak secondary transmission',next:'side_signal'}]},
 map:{id:'map',type:'story',text:`Three colored lines cross the map: BLUE (maintenance), RED (collapsed platform), GREEN (the old control room).

A penciled warning says: "Train 03 never completed its last journey. The clocks still count its stops."

The shortest path is not necessarily the safest.`,xp:35,choices:[{label:'Use the Blue maintenance route',next:'maintenance'},{label:'Take the Red platform shortcut',next:'platform'},{label:'Follow the Green signal to the control room',next:'control_room'}]},
 platform:{id:'platform',type:'story',text:`On Platform 9, a train sits with its doors open. Every advertisement displays a different version of the same face. A metallic scraping comes from the far carriage.

A station announcement crackles: "Passenger arriving... Passenger arriving..." It speaks using your own voice.`,choices:[{label:'Check the empty train',next:'carriage'},{label:'Keep to the wall and reach maintenance access',next:'maintenance'},{label:'Answer the voice',next:'voice_trap'}]},
 voice_trap:{id:'voice_trap',type:'combat',text:'When you answer, your echo answers back. An Echo Mimic drops from the ceiling.',enemy:foe('Echo Mimic','👤',105,15,115),onWin:'carriage',onLose:'platform',onEscape:'maintenance'},
 carriage:{id:'carriage',type:'story',text:`The final carriage contains six pairs of shoes and no passengers. The emergency intercom repeats a warning: "DO NOT TRUST A VOICE YOU DID NOT SEE SPEAK."

Under the seat is a damaged service badge and a battered supply box.`,choices:[{label:'Search carefully under the seats',next:'carriage_cache'},{label:'Leave the train for the control room',next:'control_room'}]},
 carriage_cache:{id:'carriage_cache',type:'story',text:'An emergency supply pack is lodged behind a loose panel. Your careful search pays off.',rewards:[{itemKey:'medical_pack',qty:2},{itemKey:'scrap_metal',qty:2}],choices:[{label:'Take the service badge toward the control room',next:'control_room'}]},
 side_signal:{id:'side_signal',type:'story',text:`The secondary signal comes from a maintenance booth. A recorder inside bears a label: "LOG 17 — voices repeating before the speaker arrives."

A cable leads behind a locked storage door. The lock shows four frequency positions.`,choices:[{label:'Examine the recorded pattern',next:'frequency_clue'},{label:'Return to the main platform',next:'platform'}]},
 maintenance:{id:'maintenance',type:'story',text:`The maintenance corridor is dark except for a strobing emergency light. Rats with glowing eyes nest around a broken signal junction. Your receiver detects a hidden chamber beyond the wiring.`,choices:[{label:'Fight through the corrupted rats',next:'rat_swarm'},{label:'Follow the wiring to the control room',next:'control_room'},{label:'Inspect the hidden chamber signal',next:'frequency_clue'}]},
 rat_swarm:{id:'rat_swarm',type:'combat',text:'The signal-corrupted rats gather into a chattering swarm.',enemy:foe('Signal Rat Swarm','🐀',90,12,95),onWin:'frequency_clue',onLose:'maintenance',onEscape:'control_room'},
 frequency_clue:{id:'frequency_clue',type:'story',text:`An engineer's notebook lists the channel order: 88.1 — 92.4 — 96.7 — 101.3.

The last entry is circled twice: "THIRD CHANNEL. The lock detects attention, not speed."

A second note: "The System remembers wrong answers, too."`,xp:60,choices:[{label:'Attempt the frequency lock',next:'frequency_lock'},{label:'Continue toward the control room',next:'control_room'}]},
 frequency_lock:{id:'frequency_lock',type:'story',text:'STORAGE LOCK: SELECT THE THIRD FREQUENCY IN THE RECORDED CHANNEL ORDER.',choices:[{label:'88.1 MHz',next:'frequency_alarm'},{label:'92.4 MHz',next:'frequency_alarm'},{label:'96.7 MHz',next:'secret_vault'},{label:'101.3 MHz',next:'frequency_alarm'}]},
 frequency_alarm:{id:'frequency_alarm',type:'combat',text:'The lock screams. A maintenance drone activates to contain the intruder.',enemy:foe('Tunnel Security Drone','🤖',125,17,135),onWin:'frequency_lock',onLose:'maintenance',onEscape:'control_room'},
 secret_vault:{id:'secret_vault',type:'story',text:`The door opens into a hidden equipment depot. The shelves contain supplies overlooked by the surviving scavengers. A map on the wall marks a sealed path directly into the central interchange.

SYSTEM OBSERVATION: INTELLIGENCE PATH RECOGNIZED.`,xp:100,rewards:[{itemKey:'rare_component',qty:2},{itemKey:'medkit',qty:2}],choices:[{label:'Use the secret service passage',next:'control_room'},{label:'Return to the main tunnel',next:'platform'}]},
 control_room:{id:'control_room',type:'story',text:`The metro control room is still powered. Security feeds show a figure entering the tunnel forty seconds before you did.

It is you.

A battered console can restore the route to the central interchange. One of its tracks is safe; another loops through a flooded dead end.`,choices:[{label:'Read the route logs',next:'route_clue'},{label:'Follow the figure on the security feed',next:'shadow_route'},{label:'Enter the route selector immediately',next:'route_puzzle'}]},
 shadow_route:{id:'shadow_route',type:'combat',text:'The figure in the security recording is waiting behind the control room door. Its mouth moves at the same time as yours.',enemy:foe('Voice Thief','🎭',155,19,185),onWin:'route_clue',onLose:'control_room',onEscape:'route_clue'},
 route_clue:{id:'route_clue',type:'story',text:`ROUTE LOG — LAST SAFE TRAIN:

Stop 1: Northbound Maintenance
Stop 2: Flood Gate
Stop 3: CENTRAL INTERCHANGE
Stop 4: The signal repeats.

The train never stops at the fourth station. The log is not telling you how to arrive. It tells you when to leave.`,xp:75,choices:[{label:'Select the correct stop',next:'route_puzzle'}]},
 route_puzzle:{id:'route_puzzle',type:'story',text:'CONTROL CONSOLE: AT WHICH STOP MUST YOU EXIT TO REACH THE SOURCE WITHOUT ENTERING THE REPEATING LOOP?',choices:[{label:'Stop 1 — Maintenance',next:'route_wrong'},{label:'Stop 2 — Flood Gate',next:'route_wrong'},{label:'Stop 3 — Central Interchange',next:'interchange'},{label:'Stop 4 — The Loop',next:'route_wrong'}]},
 route_wrong:{id:'route_wrong',type:'story',text:'The route selector resets as a ghost train thunders past. A whisper says: "Another choice recorded." No reward is lost, but the wrong route is closed.',choices:[{label:'Review the route logs',next:'route_clue'},{label:'Try the selector again',next:'route_puzzle'}]},
 interchange:{id:'interchange',type:'story',text:`The Central Interchange is larger than the maps suggest. Unused rails lead into a black tunnel. Voices carry from every direction, each one belonging to someone you've heard before.

A survivor, Imani, sits behind a barricade made from signal dampeners. She warns: "It learns your approach. If you attack everything, it sends something you can only defeat by thinking."

Three relay amplifiers feed an enormous shadow behind the platform.`,choices:[{label:'Help Imani disable the amplifiers',next:'amplifier_clue',moral:5,allianceTag:'ch3_imani_helped'},{label:'Rush toward the voices',next:'echo_guardian'},{label:'Ask what happened to the missing passengers',next:'memory_log'}]},
 memory_log:{id:'memory_log',type:'story',text:`Imani shows you recordings taken minutes before each disappearance. The victim hears their own voice giving advice. The advice changes whenever the victim changes their approach.

"The signal doesn't simply repeat us," she says. "It studies how we react."`,xp:100,choices:[{label:'Study the amplifier sequence',next:'amplifier_clue'},{label:'Challenge the creature guarding the rails',next:'echo_guardian'}]},
 echo_guardian:{id:'echo_guardian',type:'combat',text:'A shadow with many overlapping whispers rises between the rails. It copies your stance.',enemy:foe('Resonant Wraith','🌫️',185,22,260),onWin:'amplifier_clue',onLose:'interchange',onEscape:'amplifier_clue'},
 amplifier_clue:{id:'amplifier_clue',type:'story',text:`Three amplifiers are marked A, B, and C. Imani's calibration instructions read:

"To prevent feedback, shut down the source, then the echo, then the receiver."

A = Receiver. B = Source. C = Echo.

The sequence matters. The Beast is strongest while the circuit is closed.`,choices:[{label:'Choose the shutdown sequence',next:'amplifier_puzzle'},{label:'Search the tool lockers',next:'lockers'}]},
 lockers:{id:'lockers',type:'story',text:'Behind a false locker wall you discover supplies and a surviving technician’s final report. It confirms that the Echo Beast is not the source of the System—only one of its creations.',rewards:[{itemKey:'rare_component',qty:1},{itemKey:'medical_pack',qty:2}],choices:[{label:'Return to the amplifiers',next:'amplifier_puzzle'}]},
 amplifier_puzzle:{id:'amplifier_puzzle',type:'story',text:'AMPLIFIER CONTROL: THE SOURCE MUST GO FIRST, THEN ITS ECHO, THEN THE RECEIVER.',choices:[{label:'A → B → C',next:'amplifier_wrong'},{label:'B → C → A',next:'beast_chamber'},{label:'C → A → B',next:'amplifier_wrong'},{label:'B → A → C',next:'amplifier_wrong'}]},
 amplifier_wrong:{id:'amplifier_wrong',type:'combat',text:'The wrong circuit resonates with a violent feedback pulse. A signal construct defends the amplifiers.',enemy:foe('Feedback Construct','⚡',155,23,180),onWin:'amplifier_clue',onLose:'interchange',onEscape:'amplifier_clue'},
 beast_chamber:{id:'beast_chamber',type:'story',text:`The amplifiers die one by one. Silence lasts exactly three seconds.

Then every stolen voice in the tunnels screams at once.

Something enormous moves beyond the tracks—a mass of charcoal-black spectral flesh, green vapor, and half-formed human faces. Its central mouth opens impossibly wide, full of long, curved teeth.

It speaks in your voice: "I already know what you will do."

The Echo Beast has fed on recorded choices, repeating them until it learns how to break the next player.

SYSTEM WARNING: PREDICTIVE ENTITY — ECHO BEAST.`,choices:[{label:'Steady your thoughts and confront the Echo Beast',next:'echo_beast'},{label:'Study the pattern in its stolen voices',next:'beast_insight'}]},
 beast_insight:{id:'beast_insight',type:'story',text:`Some voices repeat events you recognize from earlier chapters. Others predict choices you haven't made yet.

The Beast is not omniscient. It rehearses the choices it has already observed. Unexpected decisions create interference in its predictions.

To survive, you must refuse to become predictable.`,xp:120,choices:[{label:'Break the pattern and challenge the Beast',next:'echo_beast'}]},
 echo_beast:{id:'echo_beast',type:'boss',bossKey:'echo_beast',text:'The Echo Beast roars in a chorus of stolen voices. Its ghostly faces emerge from the green-black mist as its enormous jaws open.',enemy:foe('The Echo Beast','👹',330,29,550),onWin:'beast_defeated',onLose:'beast_chamber'},
 beast_defeated:{id:'beast_defeated',type:'story',text:`The Echo Beast's great mouth collapses into the dark. The many stolen voices separate, becoming briefly human before dissolving into silence.

Imani's receiver plays one last recording. It isn't a scream. It's a statement from the System itself:

"THE SYSTEM LEARNS FROM PLAYERS."

The truth is worse than you feared. The Beast wasn't the source. It was a test—built from the System's observations of everyone who entered these tunnels.

Its lessons will survive its destruction.`,choices:[{label:'Release the recordings so the lost are remembered',next:'ending_mercy',moral:8,allianceTag:'ch3_voices_released'},{label:'Seal the tunnels to stop more victims entering',next:'ending_seal',moral:3,allianceTag:'ch3_tunnels_sealed'},{label:'Preserve the adaptation logs for the next chapter',next:'ending_knowledge',allianceTag:'ch3_logs_preserved'}]},
 ending_mercy:{id:'ending_mercy',type:'story',text:'Imani hears the last voices of the missing passengers. The tunnels are silent at last. You carry their names with you.',choices:[{label:'Complete Chapter 3',next:'chapter_end_ch3'}]},
 ending_seal:{id:'ending_seal',type:'story',text:'The metro doors close for the final time. You know locks alone cannot stop the System, but perhaps they can protect the next person.',choices:[{label:'Complete Chapter 3',next:'chapter_end_ch3'}]},
 ending_knowledge:{id:'ending_knowledge',type:'story',text:'You save the recordings. Each choice is a data point; each player, a lesson. The next confrontation will require more than strength.',choices:[{label:'Complete Chapter 3',next:'chapter_end_ch3'}]},
 chapter_end_ch3:{id:'chapter_end_ch3',type:'end',text:'CHAPTER III COMPLETE — SIGNAL HUNTERS. You defeated the Echo Beast deep in the metro tunnels. TRUTH REVEALED: THE SYSTEM LEARNS FROM PLAYERS.'}
}
