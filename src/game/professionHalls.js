// Resident NPCs ensure every profession hall has a working cast before multiplayer.
export const PROFESSION_HALLS = {
 merchant:{name:'The Golden Exchange',icon:'🪙',location:'Kessler Market',residents:[['Pell','Guild Merchant'],['Mira','Contract Broker']],offers:["Kessler Supply Chest","Guild Exchange Voucher","Caravan Provision Kit","Bronze Trade Token","Market Courier Satchel","Black-Seal Contract"]},
 miner:{name:'The Deepvein Guild',icon:'⛏️',location:'Old Kessler Mine',residents:[['Mara','Mine Supervisor'],['Rusk','Rival Prospector']],offers:["Deepvein Iron Ore","Azure Cave Crystal","Copperheart Nugget","Glowing Quartz Cluster","Basalt Core Chunk","Silver Vein Sample"]},
 forger:{name:'The Broken Forge',icon:'🔨',location:'Industrial Foundry',residents:[['Varrin','Forge Master'],['Kael','Rival Weaponsmith']],offers:["Balanced Iron Saber","Riveted Scout Armor","Reinforced Steel Buckler","Honed Caravan Dagger","Tempered Alloy Blade","Forged Guard Helm"]},
 alchemist:{name:'The Glass Laboratory',icon:'⚗️',location:'Botanical Wing',residents:[['Ilyra','Master Alchemist'],['Soren','Rival Brewer']],offers:["Restorative Trial Draught","Forest Antidote","Cooling Salve","Verdant Herbal Tonic","Purified Essence Vial","Stamina Elixir"]},
 hunter:{name:'The Warden Lodge',icon:'🏹',location:'Ashwood Outskirts',residents:[['Nessa','Hunt Warden'],['Dren','Rival Tracker']],offers:["Ashwood Wolf Pelt","Apex Howler Fang","Marsh Stalker Scale","River Eel Catch","Hardened Beast Bone","Tracker's Field Kit"]},
 pathfinder:{name:'The Atlas Archive',icon:'🧭',location:'Ruined Observatory',residents:[['Lyra','Archivist'],['Vey','Rival Explorer']],offers:["Ancient Route Chart","Lost World Compass Shard","Ruined Observatory Map","Forgotten Inscription Rubbing","Hidden Passage Survey","Relic Site Sketch"]},
 engineer:{name:'The Mechanist Workshop',icon:'🔧',location:'Kessler Utility Works',residents:[['Orin','Chief Mechanic'],['Tarek','Rival Inventor']],offers:["Calibrated Mechanist Core","Workshop Repair Kit","Clockwork Scout Drone","Stabilized Servo Assembly","Portable Survey Beacon","Reinforced Gear Housing"]},
 resonance_weaver:{name:'The Harmony Chamber',icon:'💠',location:'Crystal Sanctum',residents:[['Selene','Resonance Mentor'],['Nyx','Rival Weaver']],offers:["Harmonized Prism Shard","Luminous Attunement Diagram","Stable Fragment Matrix","Echo Purification Crystal","Resonance Frequency Chart","Prismatic Binding Catalyst"]}
}
export const ADVENTURE_ROUTES = {
 merchant:'merchant-adventure',miner:'miner-adventure',forger:'forger-adventure',alchemist:'alchemist-adventure',hunter:'hunter-adventure',pathfinder:'pathfinder-adventure',engineer:'engineer-adventure',resonance_weaver:'resonance-weaver-adventure'
}
// Each hall rotates between 48h and 72h windows, anchored to UTC.
// This produces the same stock for every visitor without scheduled jobs.
export function hallRotation(profession,when=Date.now()) {
 const keys=Object.keys(PROFESSION_HALLS)
 const index=keys.indexOf(profession)
 if(index<0) return null
 const hours=index%2===0?48:72
 const interval=hours*3600000
 const cycle=Math.floor(when/interval)
 const start=cycle*interval
 const offers=PROFESSION_HALLS[profession].offers
 const rotation=Array.from({length:3},(_,i)=>offers[(cycle*3+i+index)%offers.length])
 return {rotation,refreshAt:new Date(start+interval).toISOString(),hours,cycle}
}
