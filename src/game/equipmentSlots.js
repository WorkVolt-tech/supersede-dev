export const SLOTS = [
  { key: 'helmet',     label: 'Helmet',      icon: '⛑', accepts: ['helmet', 'armor'] },
  { key: 'chest',      label: 'Chest',       icon: '🦺', accepts: ['chest', 'armor', 'cloak'] },
  { key: 'gloves',     label: 'Gloves',      icon: '🧤', accepts: ['gloves'] },
  { key: 'boots',      label: 'Boots',       icon: '👢', accepts: ['boots'] },
  { key: 'accessory1', label: 'Accessory 1', icon: '💍', accepts: ['accessory', 'ring'] },
  { key: 'accessory2', label: 'Accessory 2', icon: '📿', accepts: ['accessory', 'ring'] },
  { key: 'mainhand',   label: 'Weapon',      icon: '🗡', accepts: ['sword', 'dagger', 'staff', 'bow', 'spear', 'shield'] },
  { key: 'offhand',    label: 'Off-hand',    icon: '🛡', accepts: ['shield', 'dagger', 'tome', 'sword'] },
]

export const RARITY = {
  common: '#5c4638', uncommon: '#2f7a2f', rare: '#1e5a8a',
  epic: '#6b2da8', legendary: '#a06820', mythic: '#a82a8a',
}
