import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getChapterResonance, getElementalDifficulty, getZoneElement, scaleCh2ZoneEnemy } from './elementalDifficulty.js'

const player = (attempted = [], defeated = [], level = 1) => ({
  ch2_elements_attempted: attempted,
  defeated_bosses: defeated,
  level,
})
const enemy = { name: 'Elemental Entity', hp: 100, atk: 12, def: 8, spd: 10, xp: 90, loot: [{ itemKey: 'ore', qty: 1 }] }

test('resonance is unset before first boss and reads first saved flag', () => {
  assert.equal(getChapterResonance(player()), null)
  assert.equal(getChapterResonance(player([], ['zone_boss_fire', 'element_resonance_fire'])), 'fire')
})

test('only canonical zone roots and their descendants receive elemental scaling', () => {
  assert.equal(getZoneElement('zone_water_boss'), 'zone_water')
  assert.equal(getZoneElement('zone_fire_enemy_1'), 'zone_fire')
  assert.equal(getZoneElement('farming_wave_1'), null)
  assert.equal(getZoneElement('boss_judges'), null)
})

test('first element is baseline and distinct additional elements double difficulty', () => {
  assert.equal(getElementalDifficulty(player()), 1)
  assert.equal(getElementalDifficulty(player(['zone_fire'])), 1)
  assert.equal(getElementalDifficulty(player(['zone_fire', 'zone_water'])), 2)
  assert.equal(getElementalDifficulty(player(['zone_fire', 'zone_water', 'zone_wind'])), 4)
})

test('repeat visits and unrelated nodes never increase difficulty', () => {
  assert.equal(getElementalDifficulty(player(['zone_fire', 'zone_fire', 'farming_grounds_hub'])), 1)
})

test('ordinary elemental enemies scale HP ATK DEF and initiative SPD without changing rewards', () => {
  const original = structuredClone(enemy)
  const scaled = scaleCh2ZoneEnemy(enemy, player(['zone_fire', 'zone_water']), 'zone_water_enemy_1')
  assert.deepEqual([scaled.hp, scaled.atk, scaled.def, scaled.spd], [200, 24, 16, 20])
  assert.equal(scaled.xp, 90)
  assert.deepEqual(scaled.loot, enemy.loot)
  assert.deepEqual(enemy, original)
})

test('all elemental enemies including side encounters scale on later elements', () => {
  const scaled = scaleCh2ZoneEnemy(enemy, player(['zone_fire', 'zone_water', 'zone_wind']), 'zone_fire_hunters')
  assert.deepEqual([scaled.hp, scaled.atk, scaled.def, scaled.spd], [400, 48, 32, 40])
})

test('bosses get original level and cleared-zone scaling then additional-element multiplier', () => {
  const p = player(['zone_fire', 'zone_water'], ['zone_boss_fire'], 5)
  const scaled = scaleCh2ZoneEnemy(enemy, p, 'zone_water_boss', 'zone_boss_water')
  assert.equal(scaled.hp, Math.round((100 + 50) * 1.5) * 2)
  assert.equal(scaled.atk, Math.round((12 + 4) * 1.5) * 2)
  assert.equal(scaled.def, Math.round(8 * 1.5) * 2)
  assert.equal(scaled.spd, Math.round(10 * 1.25) * 2)
  assert.equal(scaled.xp, 90)
})

test('bosses with speed aliases scale the initiative field actually used by combat', () => {
  const withSpeed = { ...enemy, speed: 14, spd: 12 }
  const scaled = scaleCh2ZoneEnemy(withSpeed, player(['zone_fire', 'zone_water']), 'zone_fire_boss', 'zone_boss_fire')
  assert.equal(scaled.speed, 28)
})

test('Twin Judges and non-elemental fights are unaffected', () => {
  const many = player(['zone_fire', 'zone_water', 'zone_wind'])
  assert.equal(scaleCh2ZoneEnemy(enemy, many, 'boss_judges', 'twin_judges'), enemy)
  assert.equal(scaleCh2ZoneEnemy(enemy, many, 'farming_wave_1'), enemy)
  assert.equal(scaleCh2ZoneEnemy(enemy, many, 'sweep_join_combat'), enemy)
})
