export const SPRITE_MANIFEST = {
  player: {
    default: 'sprites/player/car_default.png',
  },
  enemies: {
    looter:          'sprites/enemies/looter.png',
    hunter_scout:    'sprites/enemies/hunter_scout.png',
    bike_hunter:     'sprites/enemies/bike_hunter.png',
    looter_truck:    'sprites/enemies/looter_truck.png',
    hunter_marksman: 'sprites/enemies/hunter_marksman.png',
    stalker_pack:    'sprites/enemies/stalker_pack.png',
  },
  bosses: {
    hunter_captain: 'sprites/bosses/hunter_captain.png',
  },
}

export function flattenManifest() {
  const flat = {}
  for (const group of Object.values(SPRITE_MANIFEST)) {
    for (const [key, path] of Object.entries(group)) {
      flat[key] = path
    }
  }
  return flat
}
