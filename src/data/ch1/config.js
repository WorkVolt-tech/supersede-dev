// chapters/ch1/config.js — Chapter 1 constants & configuration

export const META = {
  number: 1,
  title:  'System Initialization',
  sub:    'The world stops. The game begins.',
  unlocksChapter: 2,
}

export const SOCKET_RULES = {
  // Chapter 1-2 cap: max 2 sockets. 3+ unlock in later chapters.
  common:   {chance:0.10, max:1},
  uncommon: {chance:0.20, max:1},
  rare:     {chance:0.30, max:2},
  epic:     {chance:0.35, max:2},
  legendary:{chance:0.40, max:2},
  mythic:   {chance:0.50, max:2},
}

export function rollSockets(rarity, itemType) {
  if (!['weapon','armor'].includes(itemType)) return 0
  const rule = SOCKET_RULES[rarity] || {chance:0.10, max:1}
  if (Math.random() > rule.chance) return 0
  // Max 2: second socket is rare even when eligible
  const roll = Math.floor(Math.random() * rule.max) + 1
  if (roll === 2 && Math.random() > 0.35) return 1  // only 35% chance of actually getting 2
  return roll
}

export const ZONE_GUARDIANS = {
  'loc_garage': { bossKey: 'sentinel', introNode: 'garage_approach',  name: 'Sentinel of the First Eye', icon: '👁' },
  'loc_market': { bossKey: 'surveyor', introNode: 'market_approach',  name: 'The Surveyor',               icon: '🔭' },
  'loc_tower':  { bossKey: 'unseen',   introNode: 'tower_approach',   name: 'The Unseen',                 icon: '👤' },
}
