export const RANGED_WEAPONS = [
  'gun', 'firearm', 'pistol', 'revolver', 'handgun',
  'rifle', 'assault_rifle', 'sniper_rifle', 'shotgun',
  'smg', 'submachine_gun', 'bow', 'shortbow', 'longbow', 'crossbow',
]

const TWO_HANDED_WEAPONS = new Set([
  'rifle', 'assault_rifle', 'sniper_rifle', 'shotgun',
  'bow', 'shortbow', 'longbow', 'crossbow',
])

// Older or newly added catalog items may have item_type='weapon' with no
// subtype. Derive one from their item key/name for equip compatibility.
export function equipmentSubtype(item = {}) {
  if (item.subtype && item.subtype !== 'weapon') return item.subtype.toLowerCase().replace(/[ -]/g, '_')
  const text = [item.item_key, item.name].filter(Boolean).join(' ').toLowerCase().replace(/[ -]/g, '_')
  for (const type of [
    'sniper_rifle', 'assault_rifle', 'submachine_gun', 'crossbow',
    'longbow', 'shortbow', 'shotgun', 'revolver', 'handgun', 'pistol',
    'rifle', 'firearm', 'smg', 'bow', 'gun',
  ]) if (text.includes(type)) return type
  return item.item_type
}

export function isTwoHandedWeapon(item) {
  return Boolean(item?.two_handed) || TWO_HANDED_WEAPONS.has(equipmentSubtype(item))
}

export const SLOTS = [
  { key: 'helmet',     label: 'Helmet',      icon: '⛑', accepts: ['helmet', 'armor'] },
  { key: 'chest',      label: 'Chest',       icon: '🦺', accepts: ['chest', 'armor', 'cloak'] },
  { key: 'gloves',     label: 'Gloves',      icon: '🧤', accepts: ['gloves'] },
  { key: 'boots',      label: 'Boots',       icon: '👢', accepts: ['boots'] },
  { key: 'accessory1', label: 'Accessory 1', icon: '💍', accepts: ['accessory', 'ring'] },
  { key: 'accessory2', label: 'Accessory 2', icon: '📿', accepts: ['accessory', 'ring'] },
  { key: 'mainhand',   label: 'Weapon',      icon: '⚔️', accepts: ['sword', 'dagger', 'staff', 'spear', 'shield', ...RANGED_WEAPONS] },
  { key: 'offhand',    label: 'Off-hand',    icon: '🛡', accepts: ['shield', 'dagger', 'tome', 'sword', 'pistol', 'revolver', 'handgun'] },
]

export const RARITY = {
  common: '#5c4638', uncommon: '#2f7a2f', rare: '#1e5a8a',
  epic: '#6b2da8', legendary: '#a06820', mythic: '#a82a8a',
}
