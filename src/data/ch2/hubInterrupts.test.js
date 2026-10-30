import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveCh2HubInterrupt as resolve } from './hubInterrupts.js'

const record = (cleared = 0, flags = []) => ({
  defeated_bosses: ['fire', 'water', 'wind'].slice(0, cleared).map(element => 'zone_boss_' + element),
  alliance_log: flags,
})

test('only redirects entries to the Chapter 2 district hub', () => {
  assert.equal(resolve(record(3, ['builders_helped']), 'zone_fire'), 'zone_fire')
  assert.equal(resolve(record(3, ['builders_helped']), 'pre_boss_gate'), 'pre_boss_gate')
})

test('the plaza has no interruption before clearing a guardian', () => {
  assert.equal(resolve(record(), 'district_hub'), 'district_hub')
})

test('Builder help triggers Sera before Voss', () => {
  assert.equal(resolve(record(1, ['builders_helped']), 'district_hub'), 'sera_checkin')
})

test('one-time Sera exit tag prevents replay and allows Voss', () => {
  assert.equal(resolve(record(1, ['builders_helped']), 'district_hub', ['sera_met']), 'voss_offer')
})

test('Voss is offered after the first guardian even without Builder credit', () => {
  assert.equal(resolve(record(1), 'district_hub'), 'voss_offer')
})

test('Rue appears after two guardians and the previous offers', () => {
  assert.equal(resolve(record(2, ['sera_met', 'voss_met']), 'district_hub'), 'rue_intel')
})

test('Rue exit tag prevents replay', () => {
  assert.equal(resolve(record(2, ['sera_met', 'voss_met']), 'district_hub', ['rue_met']), 'district_hub')
})

test('cache betrayal offer requires three guardians and Builder trust', () => {
  const flags = ['builders_helped', 'sera_met', 'voss_met', 'rue_met']
  assert.equal(resolve(record(2, flags), 'district_hub'), 'district_hub')
  assert.equal(resolve(record(3, flags), 'district_hub'), 'cache_betrayal_offer')
  assert.equal(resolve(record(3, flags.slice(1)), 'district_hub'), 'district_hub')
})

test('cache exit flag prevents repeat and leaves normal hub available', () => {
  const flags = ['builders_helped', 'sera_met', 'voss_met', 'rue_met']
  assert.equal(resolve(record(3, flags), 'district_hub', ['cache_seen']), 'district_hub')
})
