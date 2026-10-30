import { test } from 'node:test'
import assert from 'node:assert/strict'
import { persistCombatResult } from './combatPersistence.js'

const pending = () => ({
  outcome: 'win', updates: { hp: 50, xp: 200 },
  saving: false, committed: false, rewardsHandled: false,
})

test('failed save retains outcome without granting loot or marking it committed', async () => {
  const fight = pending()
  let lootCalls = 0
  const ok = await persistCombatResult(fight, async () => false, async () => { lootCalls++ })
  assert.equal(ok, false)
  assert.equal(fight.committed, false)
  assert.equal(fight.saving, false)
  assert.equal(lootCalls, 0)
})

test('retry saves same fixed XP values, then grants loot only once', async () => {
  const fight = pending()
  const writes = []
  let lootCalls = 0
  let canSave = false
  const save = async updates => { writes.push({ ...updates }); return canSave }
  const loot = async () => { lootCalls++ }
  assert.equal(await persistCombatResult(fight, save, loot), false)
  canSave = true
  assert.equal(await persistCombatResult(fight, save, loot), true)
  assert.equal(await persistCombatResult(fight, save, loot), true)
  assert.deepEqual(writes, [fight.updates, fight.updates])
  assert.equal(lootCalls, 1)
  assert.equal(fight.committed, true)
})

test('a thrown network exception is retryable and never grants loot early', async () => {
  const fight = pending()
  let lootCalls = 0
  assert.equal(await persistCombatResult(fight, async () => { throw Error('Network lost') }, async () => { lootCalls++ }), false)
  assert.equal(fight.error, 'Network lost')
  assert.equal(lootCalls, 0)
  assert.equal(await persistCombatResult(fight, async () => true, async () => { lootCalls++ }), true)
  assert.equal(lootCalls, 1)
})

test('loot error cannot cause an already-committed fight to replay XP', async () => {
  const fight = pending()
  let saveCalls = 0, lootCalls = 0
  const saved = await persistCombatResult(fight, async () => { saveCalls++; return true }, async () => { lootCalls++; throw Error('loot unavailable') })
  assert.equal(saved, true)
  assert.equal(fight.rewardError, 'loot unavailable')
  assert.equal(await persistCombatResult(fight, async () => { saveCalls++; return true }, async () => { lootCalls++ }), true)
  assert.equal(saveCalls, 1)
  assert.equal(lootCalls, 1)
})

test('overlapping save requests cannot write twice', async () => {
  const fight = pending()
  let resolveSave, calls = 0, rewards = 0
  const first = persistCombatResult(fight, () => {
    calls++
    return new Promise(resolve => { resolveSave = resolve })
  }, async () => { rewards++ })
  assert.equal(await persistCombatResult(fight, async () => { calls++; return true }), false)
  resolveSave(true)
  assert.equal(await first, true)
  assert.equal(calls, 1)
  assert.equal(rewards, 1)
})

test('a losing fight saves once but never grants victory-only loot', async () => {
  const fight = { ...pending(), outcome: 'lose', updates: { hp: 1 } }
  let saves = 0, loot = 0
  const ok = await persistCombatResult(fight, async updates => { saves++; return updates.hp === 1 }, async () => { if (fight.outcome === 'win') loot++ })
  assert.equal(ok, true)
  assert.equal(saves, 1)
  assert.equal(loot, 0)
})
