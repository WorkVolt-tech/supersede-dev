export const PROFESSIONS = [
  {key:'merchant',name:'Merchant',icon:'🪙',description:'Trading, exclusive merchandise, and commissions.'},
  {key:'miner',name:'Miner',icon:'⛏️',description:'Mining, rare deposits, and raw materials.'},
  {key:'forger',name:'Forger',icon:'🔨',description:'Weapons, armor, accessories, and salvage.'},
  {key:'alchemist',name:'Alchemist',icon:'⚗️',description:'Herbs, potions, meals, and compounds.'},
  {key:'hunter',name:'Hunter',icon:'🏹',description:'Tracking, harvesting, and fishing.'},
  {key:'pathfinder',name:'Pathfinder',icon:'🧭',description:'Exploration, relics, and maps.'},
  {key:'engineer',name:'Engineer',icon:'🔧',description:'Gadgets, machinery, and construction.'},
  {key:'resonance_weaver',name:'Resonance Weaver',icon:'✨',description:'Fragment refinement and Resonance enhancements.'},
]

export const professionUnlocked = player => (player?.chapters_unlocked || []).includes(3)
export const professionLevelForXp = xp => Math.min(100,1+Math.floor(Math.sqrt(Math.max(0,Number(xp)||0)/100)))
export const professionPointsAtLevel = level => Math.min(20,Math.floor(Math.max(1,level)/5))
export const professionSwitchCost = level => 100+50*Math.max(1,Number(level)||1)
