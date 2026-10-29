// Resident NPCs ensure every profession hall has a working cast before multiplayer.
export const PROFESSION_HALLS = {
 merchant:{name:'The Golden Exchange',icon:'🪙',location:'Kessler Market',residents:[['Pell','Guild Merchant'],['Mira','Contract Broker']],offers:['Supply crates','Trade contracts','Rare traveling merchandise','Consignment opportunities','Market maps','Guild commissions']},
 miner:{name:'The Deepvein Guild',icon:'⛏️',location:'Old Kessler Mine',residents:[['Mara','Mine Supervisor'],['Rusk','Rival Prospector']],offers:['Iron and copper veins','Crystal seam maps','Ore refinement orders','Deep tunnel permits','Rare mineral samples','Mining contracts']},
 forger:{name:'The Broken Forge',icon:'🔨',location:'Industrial Foundry',residents:[['Varrin','Forge Master'],['Kael','Rival Weaponsmith']],offers:['Balanced steel blades','Reinforced armor','Forging commissions','Weapon fittings','Salvage contracts','Experimental alloys']},
 alchemist:{name:'The Glass Laboratory',icon:'⚗️',location:'Botanical Wing',residents:[['Ilyra','Master Alchemist'],['Soren','Rival Brewer']],offers:['Healing draughts','Herbal extracts','Antidote research','Potion commissions','Rare reagents','Field rations']},
 hunter:{name:'The Warden Lodge',icon:'🏹',location:'Ashwood Outskirts',residents:[['Nessa','Hunt Warden'],['Dren','Rival Tracker']],offers:['Beast tracks','Hide and bone materials','Fishing reports','Hunting contracts','Rare beast sightings','Trophy exchanges']},
 pathfinder:{name:'The Atlas Archive',icon:'🧭',location:'Ruined Observatory',residents:[['Lyra','Archivist'],['Vey','Rival Explorer']],offers:['Survey charts','Relic investigations','Hidden passage clues','Ancient inscriptions','Expedition commissions','Fragmented atlases']},
 engineer:{name:'The Mechanist Workshop',icon:'🔧',location:'Kessler Utility Works',residents:[['Orin','Chief Mechanic'],['Tarek','Rival Inventor']],offers:['Repair components','Workshop schematics','Utility gadgets','Automaton parts','Device commissions','Prototype blueprints']},
 resonance_weaver:{name:'The Harmony Chamber',icon:'💠',location:'Crystal Sanctum',residents:[['Selene','Resonance Mentor'],['Nyx','Rival Weaver']],offers:['Fragment studies','Attunement diagrams','Resonance research','Purification materials','Crystal patterns','Harmonic commissions']}
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
