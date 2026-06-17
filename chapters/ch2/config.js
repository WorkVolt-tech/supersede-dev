// chapters/ch2/config.js — Chapter 2 constants & configuration

export const META = {
  number: 2,
  title:  'Broken Alliances',
  sub:    'Groups form. Groups break. The System watches both.',
  unlocksChapter: 3,
}

export const ELEMENT_NAMES = {
  fire:'Ignis', water:'Aqua', lightning:'Volt', arcane:'Lux',
  shadow:'Umbra', earth:'Terra', wind:'Aero', plant:'Flora',
  metal:'Ferro', poison:'Venin'
}

export const ZONE_ELEMENT_MAP = {
  zone_fire:'fire', zone_water:'water', zone_lightning:'lightning',
  zone_arcane:'arcane', zone_shadow:'shadow', zone_earth:'earth',
  zone_wind:'wind', zone_plant:'plant', zone_metal:'metal', zone_poison:'poison'
}

export const ZONES = [
  { id:'zone_fire',      icon:'🔥', name:'Kitchen Supply Store',    element:'Ignis',  color:'#ff5500', branch:'Offense',        img:'../assets/zones/zone_fire.webp' },
  { id:'zone_water',     icon:'💧', name:'Food Court Basement',     element:'Aqua',   color:'#0088ff', branch:'Defense',        img:'../assets/zones/zone_water.webp' },
  { id:'zone_lightning', icon:'⚡', name:'Electronics Hub',         element:'Volt',   color:'#ffee58', branch:'Flow',           img:'../assets/zones/zone_lightning.webp' },
  { id:'zone_arcane',    icon:'✨', name:'Kessler Bookshop',        element:'Lux', color:'#b06eff', branch:'Lux',         img:'../assets/zones/zone_arcane.webp' },
  { id:'zone_shadow',    icon:'🌑', name:'Closed Cinema',           element:'Umbra',  color:'#9a6fd8', branch:'Decay',          img:'../assets/zones/zone_shadow.webp' },
  { id:'zone_earth',     icon:'🪨', name:'Parking Structure',        element:'Terra',  color:'#8b5e3c', branch:'Defense+Offense', img:'../assets/zones/zone_earth.webp' },
  { id:'zone_wind',      icon:'💨', name:'Glass Atrium',            element:'Aero',   color:'#a8d8ea', branch:'Flow+Arcane',    img:'../assets/zones/zone_wind.webp' },
  { id:'zone_plant',     icon:'🌿', name:'Garden Centre',           element:'Flora',  color:'#66bb6a', branch:'Defense+Decay',  img:'../assets/zones/zone_plant.webp' },
  { id:'zone_metal',     icon:'⚙️', name:'Hardware Megastore',      element:'Ferro',  color:'#90a4ae', branch:'Offense+Arcane', img:'../assets/zones/zone_metal.webp' },
  { id:'zone_poison',    icon:'☠️', name:'Pharmacy — Anchor Store', element:'Venin',  color:'#7aad30', branch:'Decay+Offense',  img:'../assets/zones/zone_poison.webp' },
]

export const STORY_EVENTS = [
  { id:'cache_betrayal_offer', label:'⚖️ The Cache Offer', sub:'A decision point waits in the east corridor', done: false },
  { id:'trader_intro',         label:"🏪 Pell's Shop",      sub:'Neutral trader — weapons, info, reagents',  done: false },
]
