// Chapter III — Signal Hunters. New React-native narrative, separate from profession questlines.
const enemy=(name,icon,hp,atk,xp)=>({name,icon,hp,atk,def:3,speed:8,xp,loot:[]})
export const NODES = {
 opening:{id:'opening',type:'story',text:`CHAPTER III — SIGNAL HUNTERS

The road from Kessler bends into a valley of antenna towers. Every screen in your vehicle blinks the same sentence: WE HEARD WHAT YOU DID TO THE JUDGES.

At midnight, the radio switches itself on. A voice counts the seconds between your breaths. The System has stopped merely watching your choices. Now something is hunting the people who make them.

Beyond the road sign—BLACKGLASS RELAY DISTRICT—you see a settlement lit by improvised power, and a distant tower broadcasting a signal that sounds almost human.`,choices:[{label:'Investigate the relay settlement',next:'settlement'},{label:'Survey the abandoned checkpoint',next:'checkpoint'}]},
 checkpoint:{id:'checkpoint',type:'story',text:`The checkpoint is deserted, except for drag marks and a handheld receiver. Its display identifies three missing operators. Their final recorded phrase: "The voice copied me. Do not answer yourself."

A scavenger steps into the headlights and warns you that the Signal Hunters can imitate familiar voices. Someone is still transmitting from the tower.`,choices:[{label:'Help the scavenger repair a receiver',next:'receiver',moral:5},{label:'Follow the drag marks',next:'stalker'},{label:'Head toward the settlement',next:'settlement'}]},
 stalker:{id:'stalker',type:'combat',text:'A masked tracker rises from the ruined tollbooth. Its radio speaks in your voice.',enemy:enemy('Echo Stalker','📡',95,12,110),onWin:'receiver',onLose:'checkpoint',onEscape:'settlement'},
 settlement:{id:'settlement',type:'story',text:`The relay settlement is built from stacked freight containers and solar panels. Its people call themselves the Unheard.

Their leader, Ada, has three rules: never broadcast a real name, never follow a voice outside the perimeter, and never let the tower finish a countdown.

Ada admits they captured one Signal Hunter. It is human. Or was, before the System rewrote their hearing.`,choices:[{label:'Meet Ada and question the captive',next:'captive',moral:5},{label:'Inspect the signal lab',next:'receiver'},{label:'Check the perimeter for a breach',next:'perimeter'}]},
 perimeter:{id:'perimeter',type:'combat',text:'A pair of synchronized silhouettes slip beneath the settlement lights. One breaks away to attack.',enemy:enemy('Signal Hound','🐺',105,14,125),onWin:'settlement_defended',onLose:'settlement',onEscape:'settlement'},
 settlement_defended:{id:'settlement_defended',type:'story',text:'Ada thanks you. A technician uncovers an encrypted tower map and marks a narrow route through the transmission fields.',choices:[{label:'Study the relay map',next:'receiver'},{label:'Question the prisoner',next:'captive'}]},
 captive:{id:'captive',type:'story',text:`The captive wears an earpiece fused into the skin. He calls himself Ren. When he hears your footsteps, he whispers: "I was assigned to hunt a signal. Then I realized the signal was a person."

He says there are three relay anchors feeding the tower. Cut them, and the broadcast loses its grip. Destroy the central node, and the hunters become free—but the System will remember who did it.`,choices:[{label:'Promise to try to free the hunters',next:'receiver',moral:8,allianceTag:'ch3_free_hunters'},{label:'Demand the tower access code',next:'code_clue',moral:-3},{label:'Leave him and inspect the lab',next:'receiver'}]},
 receiver:{id:'receiver',type:'story',text:`In the lab, the recovered receiver ticks in groups of four. A dead operator left a handwritten note:

"The sequence follows the relay cycle: ECHO, STATIC, PULSE, SILENCE. Only the third word opens the gate."

The tower transmits four candidates. You can listen and solve the lock or force entry through the service tunnels.`,choices:[{label:'Open the cipher gate',next:'cipher_gate'},{label:'Take the maintenance tunnel',next:'tunnel'}]},
 code_clue:{id:'code_clue',type:'story',text:'Ren draws three concentric rings. "The answer is the third beat. The System expects you to hear it, not guess it." Outside, the tower flashes four times.',choices:[{label:'Approach the cipher gate',next:'cipher_gate'},{label:'Use the service tunnel instead',next:'tunnel'}]},
 cipher_gate:{id:'cipher_gate',type:'story',text:'CIPHER GATE — IDENTIFY THE THIRD TERM OF THE RELAY CYCLE. ECHO → STATIC → ? → SILENCE.',choices:[{label:'ECHO — reset cycle',next:'cipher_alarm'},{label:'STATIC — carrier noise',next:'cipher_alarm'},{label:'PULSE — third signal',next:'cipher_solved'},{label:'SILENCE — final stage',next:'cipher_alarm'}]},
 cipher_alarm:{id:'cipher_alarm',type:'combat',text:'The incorrect response activates a security warden. Solve the sequence once it falls.',enemy:enemy('Cipher Warden','🛡️',115,15,130),onWin:'cipher_gate',onLose:'receiver',onEscape:'tunnel'},
 cipher_solved:{id:'cipher_solved',type:'story',text:'The gate accepts PULSE. Behind the access panel, a signal schematic reveals the first anchor hidden inside the abandoned substation.',xp:90,choices:[{label:'Enter the substation',next:'anchor_one'}]},
 tunnel:{id:'tunnel',type:'story',text:'The maintenance tunnel is dry but threaded with speakers. Voices call your name from behind the walls. Ahead, a cracked hatch opens beneath the first relay anchor.',choices:[{label:'Climb into the substation',next:'anchor_one'},{label:'Turn back to decode the gate',next:'cipher_gate'}]},
 anchor_one:{id:'anchor_one',type:'story',text:'The first anchor is a coil of humming metal surrounded by discarded headsets. Each pulse makes you remember a choice you never made.',choices:[{label:'Sever the first relay anchor',next:'anchor_two',allianceTag:'ch3_anchor_one'},{label:'Inspect the captured headsets first',next:'headsets'}]},
 headsets:{id:'headsets',type:'story',text:'The headsets contain voices stolen from previous challengers. One belongs to a child who asks that the hunters be freed, not executed.',choices:[{label:'Preserve the recordings and sever the anchor',next:'anchor_two',moral:5,allianceTag:'ch3_rescue_recordings'}]},
 anchor_two:{id:'anchor_two',type:'combat',text:'The second anchor is guarded by a machine that rewrites its movements based on your last attack.',enemy:enemy('Adaptive Relay Sentinel','🤖',145,19,210),onWin:'anchor_two_down',onLose:'anchor_one'},
 anchor_two_down:{id:'anchor_two_down',type:'story',text:'The sentinel collapses. Its core reveals the last anchor: a transmission chamber beneath the central tower. Ada radios that the Unheard are losing contact with their own voices.',xp:150,choices:[{label:'Rush to the central tower',next:'tower_approach'},{label:'Send a warning to Ada first',next:'ada_warning',moral:5}]},
 ada_warning:{id:'ada_warning',type:'story',text:'You send a warning in code rather than speech. Ada understands. The settlement goes silent, cutting off the System from dozens of easy targets.',choices:[{label:'Advance to the tower',next:'tower_approach'}]},
 tower_approach:{id:'tower_approach',type:'story',text:`The tower door opens before you touch it. Inside, screens show your path from the Watcher through the Twin Judges, every betrayal and every mercy catalogued.

A figure steps from the static. It wears the insignia of the Signal Hunters.

"I am the Collector," it says. "The System does not predict choices. It collects the people willing to make them."

The last anchor is built into the Collector's armor.`,choices:[{label:'Confront the Collector',next:'collector_boss'},{label:'Offer to free the enslaved hunters',next:'collector_mercy',moral:5,allianceTag:'ch3_offered_mercy'}]},
 collector_mercy:{id:'collector_mercy',type:'story',text:'The Collector hesitates. For half a second, dozens of human voices answer from inside its armor. "Then prove you can survive knowing what I am."',choices:[{label:'Fight to break the signal',next:'collector_boss'}]},
 collector_boss:{id:'collector_boss',type:'boss',bossKey:'signal_collector',text:'The Collector channels the three relay anchors into a single overwhelming broadcast. Silence the source.',enemy:enemy('The Signal Collector','📻',265,26,420),onWin:'collector_defeated',onLose:'tower_approach'},
 collector_defeated:{id:'collector_defeated',type:'story',text:`The Collector falls to one knee. The broadcast fractures. Across the valley, hunters tear the receivers from their ears and remember their own names.

One final message scrolls across the tower wall:

ADAPTATION COMPLETE.
THE SYSTEM ADAPTS TO HUMAN CHOICES.

You cannot tell whether the words are a warning or an invitation. Ada asks what you intend to do with the surviving signal network.`,choices:[{label:'Give the Unheard control of the network',next:'ending_freedom',moral:10,allianceTag:'ch3_network_freed'},{label:'Seal the tower to keep it out of everyone’s hands',next:'ending_sealed',moral:2,allianceTag:'ch3_network_sealed'},{label:'Record its secrets before shutting it down',next:'ending_archive',allianceTag:'ch3_network_archived'}]},
 ending_freedom:{id:'ending_freedom',type:'story',text:'The Unheard inherit the relays. You leave knowing their voices finally belong to them.',choices:[{label:'Finish Chapter 3',next:'chapter_end_ch3'}]},
 ending_sealed:{id:'ending_sealed',type:'story',text:'You fuse the control panel. The valley becomes quiet. No one can use this tower again—at least for now.',choices:[{label:'Finish Chapter 3',next:'chapter_end_ch3'}]},
 ending_archive:{id:'ending_archive',type:'story',text:'You copy the hidden transmission logs. Their metadata points toward a second, deeper network outside the valley.',choices:[{label:'Finish Chapter 3',next:'chapter_end_ch3'}]},
 chapter_end_ch3:{id:'chapter_end_ch3',type:'end',text:'CHAPTER III COMPLETE — SIGNAL HUNTERS. The Collector is defeated, the signal broken, and your choices recorded. The next chapter is still beyond the horizon.'}
}
