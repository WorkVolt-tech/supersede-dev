import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveCh2HubInterrupt as resolve, computeCh2Tension } from './hubInterrupts.js'

const record = (cleared = 0, flags = [], moral_score = 0) => ({
  defeated_bosses: Array.from({ length: cleared }, (_, i) => 'zone_boss_' + i),
  alliance_log: flags,
  moral_score,
})

test('ordinary routes and a fresh district hub are unchanged', () => {
  assert.equal(resolve(record(5), 'zone_fire'), 'zone_fire')
  assert.equal(resolve(record(), 'district_hub'), 'district_hub')
})

test('Sera follows a Builder rescue once a zone guardian falls', () => {
  assert.equal(resolve(record(1, ['builders_helped']), 'district_hub'), 'sera_checkin')
  assert.equal(resolve(record(1, ['builders_helped']), 'district_hub', ['sera_met']), 'district_hub')
})

test('Voss requires villain moral alignment or a humanoid execution', () => {
  assert.equal(resolve(record(1), 'district_hub'), 'district_hub')
  assert.equal(resolve(record(1, [], -20), 'district_hub'), 'voss_offer')
  assert.equal(resolve(record(1, ['executed_humanoid']), 'district_hub'), 'voss_offer')
  assert.equal(resolve(record(1, [], -20), 'district_hub', ['voss_met']), 'district_hub')
})

test('Rue appears only after two cleared guardians', () => {
  assert.equal(resolve(record(1, ['sera_met', 'voss_met']), 'district_hub'), 'district_hub')
  assert.equal(resolve(record(2, ['sera_met', 'voss_met']), 'district_hub'), 'rue_intel')
  assert.equal(resolve(record(2, ['sera_met', 'voss_met']), 'district_hub', ['rue_met']), 'district_hub')
})

test('Cache Offer takes priority after three guardians, without requiring Builder trust', () => {
  assert.equal(resolve(record(3), 'district_hub'), 'cache_betrayal_offer')
  assert.equal(resolve(record(3, ['builders_helped']), 'district_hub'), 'cache_betrayal_offer')
})

test('Cache Offer does not repeat after its decision flag is saved', () => {
  const p = record(3, ['sera_met', 'voss_met', 'rue_met', 'tam_mid1_seen'])
  assert.equal(resolve(p, 'district_hub', ['cache_seen']), 'district_hub')
})

test('Cold War tension calculation matches the original thresholds and cap', () => {
  assert.equal(computeCh2Tension(record(0, ['executed_humanoid', 'voss_aligned'])), 25)
  assert.equal(computeCh2Tension(record(0, ['builders_helped', 'sera_met'])), -7)
  assert.equal(computeCh2Tension(record(0, Array(10).fill('voss_aligned'))), 60)
})

test('Sweep fires once after Cache when tension reaches 35', () => {
  const flags = ['cache_seen', 'executed_humanoid', 'executed_humanoid', 'voss_aligned']
  assert.equal(resolve(record(3, flags, -25), 'district_hub'), 'sweep_arrival')
  assert.notEqual(resolve(record(3, [...flags, 'sweep_fired', 'rue_met', 'tam_mid1_seen'], -25), 'district_hub'), 'sweep_arrival')
})

test('Sera, Voss, and Rue react once to spare / execute records', () => {
  assert.equal(resolve(record(1, ['sera_met', 'spared_humanoid']), 'district_hub'), 'spare_reaction_sera')
  assert.equal(resolve(record(1, ['voss_met', 'executed_humanoid']), 'district_hub'), 'execute_reaction_voss')
  assert.equal(resolve(record(2, ['rue_met', 'voss_met', 'executed_humanoid', 'execute_reaction_seen']), 'district_hub'), 'rue_action_reaction')
})

test('Tam wounded and crossroads scenes follow the original zone windows', () => {
  const flags = ['cache_seen', 'sera_met', 'voss_met', 'rue_met']
  assert.equal(resolve(record(3, flags), 'district_hub'), 'tam_wounded')
  assert.equal(resolve(record(4, [...flags, 'tam_mid1_seen']), 'district_hub'), 'tam_at_crossroads')
  assert.equal(resolve(record(4, [...flags, 'tam_mid1_seen', 'tam_mid2_seen']), 'district_hub'), 'district_hub')
})

test('Pure hero and villain finales only interrupt the Judges approach', () => {
  const hero = record(5, ['sweep_builders'], 60)
  const villain = record(5, ['sweep_hunters'], -60)
  assert.equal(resolve(hero, 'pre_boss_ch2'), 'hero_finale_offer')
  assert.equal(resolve(villain, 'pre_boss_ch2'), 'villain_finale_offer')
  assert.equal(resolve(record(4, ['sweep_builders'], 60), 'pre_boss_ch2'), 'pre_boss_ch2')
  assert.equal(resolve(record(5, ['sweep_builders', 'hero_finale_done'], 60), 'pre_boss_ch2'), 'pre_boss_ch2')
  assert.equal(resolve(hero, 'district_hub'), 'cache_betrayal_offer')
})
