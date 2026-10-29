// Resonance recipes restored from Supersede. Legacy rune IDs remain stable for saved games.
export const RUNE_NAMES = ['ignis','aqua','terra','aero','umbra','lux','venin','ferro','flora','volt']
export function fragmentName(key) {
  const element = String(key || '').replace(/^rune_|^fragment_/, '')
  return `${element.charAt(0).toUpperCase()}${element.slice(1)} Fragment`
}
const recipes = [
  // Weapon: 2 sockets
  ['weapon','ignis ignis','Ember Core','power:2 atk:2'],
  ['weapon','aero ignis','Blazing Speed','power:2 speed:4'],
  ['weapon','ignis umbra','Hellfire Pact','power:6 atk:4'],
  ['weapon','ignis terra','Molten Strike','power:2 atk:3 guard:1'],
  ['weapon','aqua ignis','Steam Burst','power:2 control:2'],
  ['weapon','ignis lux','Holy Flame','power:2 insight:2 atk:2'],
  ['weapon','aqua aqua','Flow State','control:3 luck:2'],
  ['weapon','aqua lux','Sacred Tide','control:2 insight:2'],
  ['weapon','aero aqua','Current Shift','control:3 speed:2'],
  ['weapon','aqua umbra','Drowning Curse','control:5 power:2'],
  ['weapon','aqua terra','Deep Stability','control:2 guard:2'],
  ['weapon','aero aero','Wind Fury','speed:4 luck:2'],
  ['weapon','aero umbra','Phantom Strike','speed:4 power:3'],
  ['weapon','aero lux','Light Speed','speed:3 insight:2'],
  ['weapon','umbra umbra','Abyss Core','power:5 atk:3'],
  ['weapon','lux umbra','Twilight Blade','power:3 guard:2 insight:2'],
  ['weapon','lux lux','Radiant Edge','insight:2 luck:2 guard:1'],
  ['weapon','terra umbra','Grave Force','power:4 atk:5'],
  // Weapon: 3+ sockets
  ['weapon','ignis ignis umbra','Doom Flame','power:5 atk:5'],
  ['weapon','aero ignis ignis','Doom Flame','power:5 atk:5'],
  ['weapon','aero aero ignis','Inferno Rush','power:3 speed:2 atk:2'],
  ['weapon','aero terra umbra','Shadow Cyclone','speed:2 power:3 atk:3'],
  ['weapon','aqua aero umbra','Phantom Current','control:4 speed:3 power:2'],
  ['weapon','aqua aqua lux','Ocean Blessing','control:3 insight:2 luck:2'],
  ['weapon','aero aqua lux','Radiant Flow','speed:2 control:2 insight:2'],
  ['weapon','aqua ignis terra','Steam Core','power:2 control:2 guard:1 atk:2'],
  ['weapon','ignis terra umbra','Magma Curse','power:3 atk:4'],
  ['weapon','aqua lux umbra','Void Purge','control:3 power:2 insight:2'],
  ['weapon','ignis lux terra','Sacred Volcano','guard:2 power:4 atk:3'],
  ['weapon','aero ignis umbra','Ash Reaper','power:3 speed:2 atk:3'],
  ['weapon','aero aqua ignis','Superheated Storm','power:2 speed:3 control:2'],
  ['weapon','lux terra umbra','Soul Rift','power:4 insight:2 atk:3'],
  ['weapon','ignis ignis umbra umbra','Hell Collapse','power:8 atk:6'],
  ['weapon','aero aero ignis ignis','Storm Inferno','speed:4 power:3 atk:3'],
  ['weapon','aqua aero ignis umbra','Chaos Engine','power:6 speed:4 atk:4'],
  ['weapon','aero aqua lux terra','Elemental Edge','power:3 control:3 speed:2 guard:2'],
  ['weapon','aero ignis terra umbra','Void Eruption','power:7 speed:3 atk:5'],
  ['weapon','aero aqua ignis terra umbra','Worldbreaker','power:8 speed:5 atk:7 guard:2'],
  ['weapon','aero aqua ignis lux umbra','Heaven Ender','power:7 speed:4 atk:6 insight:3'],
  ['weapon','aero aqua ignis lux terra umbra','Genesis Blade','power:6 control:6 guard:6 speed:6 insight:6 luck:6 atk:8'],
  // Armor
  ['armor','terra terra','Stone Skin','guard:5 def:3'],
  ['armor','lux terra','Sanctuary','guard:3 insight:2 def:2'],
  ['armor','aqua terra','Living Armor','guard:2 def:2'],
  ['armor','terra umbra','Grave Shell','guard:4 def:4'],
  ['armor','aero terra','Dust Guard','guard:2 speed:2 def:2'],
  ['armor','ignis ignis','Flame Guard','guard:1 def:2'],
  ['armor','ignis terra','Molten Shell','guard:2 power:1 def:3'],
  ['armor','aqua ignis','Steam Armor','guard:2 def:3'],
  ['armor','aqua aqua','Flow Armor','guard:2 control:2 def:2'],
  ['armor','aqua lux','Healing Guard','guard:2 insight:1 def:2'],
  ['armor','aqua umbra','Void Barrier','guard:3 control:2 def:2'],
  ['armor','aero aero','Ghost Cloak','guard:1 speed:4 def:1'],
  ['armor','aero aqua','Mist Form','guard:2 speed:3 control:1'],
  ['armor','aero umbra','Shadow Veil','guard:1 speed:3 def:2'],
  ['armor','umbra umbra','Grave Armor','guard:4 def:4'],
  ['armor','lux umbra','Fallen Light','guard:2 insight:2 power:1'],
  ['armor','lux lux','Divine Shell','guard:3 insight:3 luck:2'],
  ['armor','ignis umbra','Hell Armor','guard:2 power:2 def:3'],
  ['armor','aero lux','Heaven\'s Grace','guard:2 speed:3 def:1'],
  ['armor','ignis lux','Phoenix Guard','guard:2 def:2 power:1'],
  ['armor','aqua lux terra','Eternal Guard','guard:6 def:4 insight:2'],
  ['armor','terra terra aqua','Deep Root','guard:4 def:3 control:2'],
  ['armor','aero terra umbra','Wraith Shell','guard:4 speed:2 def:3'],
  ['armor','ignis terra umbra','Magma Armor','guard:3 power:2 def:4'],
  ['armor','aero ignis lux','Celestial Flame','guard:2 power:2 speed:2 def:2'],
  ['armor','lux umbra lux','Fallen Angel','guard:4 power:3 def:3'],
  ['armor','aqua lux terra umbra','World Core','guard:8 def:6 control:2'],
  ['armor','aero ignis terra umbra','Titan Shell','guard:6 def:5 power:3 speed:2'],
  ['armor','aero aqua lux terra umbra','Celestial Aegis','guard:6 def:6 insight:4 luck:4'],
  ['armor','aero aqua ignis lux terra umbra','Genesis Armor','guard:8 def:8 power:4 speed:4 insight:4 luck:4'],
  // Universal
  ['any','lux terra','Harmony','power:1 control:1 guard:1 speed:1'],
  ['any','aqua ignis','Balance Break','control:3 power:2'],
  ['any','lux umbra','Twilight Core','power:3 guard:2 insight:2'],
  ['any','aero terra','Foundation Shift','speed:2 guard:2'],
  ['any','aqua ignis lux','Trinity Flow','power:2 control:2 insight:2'],
  ['any','lux terra umbra','Dark Balance','power:3 guard:2 insight:2'],
  ['any','aero ignis terra','Storm Forge','speed:2 power:2 guard:1'],
  ['any','aero aqua umbra','Phantom Tide','speed:3 control:3 power:1'],
  ['any','lux lux lux','Pure Divinity','insight:5 guard:4 luck:5'],
  ['any','aero aqua ignis lux terra umbra','Genesis','power:5 control:5 guard:5 speed:5 insight:5 luck:5'],
  // Accessories
  ['accessory','lux lux','Blessing Loop','luck:3 insight:2'],
  ['accessory','umbra umbra','Curse Loop','power:4 luck:1'],
  ['accessory','aero ignis','Flash Burn','speed:2 power:1'],
  ['accessory','aqua lux','Pure Flow','control:2 insight:1'],
  ['accessory','lux terra','Stone Heart','guard:2 insight:1'],
  ['accessory','aero aqua','Slipstream','speed:2 control:1'],
  ['accessory','ignis umbra','Hell Ring','power:3 atk:2'],
  ['accessory','aqua umbra','Dark Flow','control:2 power:1'],
  ['accessory','aero terra','Dust Band','speed:2 guard:1'],
  ['accessory','lux umbra','Twilight Loop','insight:2 power:1 guard:1'],
]

export const RESONANCES = recipes.map(([slot, sequence, name, values]) => ({
  slot, name, runes:sequence.split(' ').sort(),
  stats:Object.fromEntries(values.split(' ').map(value => { const [stat,n] = value.split(':'); return [stat+'_bonus',Number(n)] })),
}))
export function findResonance(runes, slot, socketsTotal) {
  if (!runes?.length || runes.length !== Number(socketsTotal)) return null
  const key = [...runes].sort().join('+')
  return RESONANCES.find(recipe => recipe.slot===slot && recipe.runes.join('+')===key)
    || RESONANCES.find(recipe => recipe.slot==='any' && recipe.runes.join('+')===key) || null
}

export const STANDARD_WEAPONS = {
  scrap_blade: {atk_bonus:2}, knife: {atk_bonus:2,speed_bonus:1},
  iron_sword: {atk_bonus:5,power_bonus:1}, tactical_sword: {atk_bonus:8,control_bonus:2},
}
export function normalizedItem(item) {
  return { ...item, ...(STANDARD_WEAPONS[item.item_key] || {}) }
}
