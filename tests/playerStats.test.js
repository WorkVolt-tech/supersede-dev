import test from 'node:test'
import assert from 'node:assert/strict'
import { getEffectiveStats, getCombatPlayer } from '../src/game/playerStats.js'

const player = { atk:8, def:2, power:2, guard:2, speed:2, control:2, insight:1, luck:2, agility:2, max_hp:100 }
const sword = { equipped_slot:'mainhand', atk_bonus:5, power_bonus:3, speed_bonus:2, luck_bonus:1 }
const armor = { equipped_slot:'chest', def_bonus:4, guard_bonus:2, insight_bonus:3, agility_bonus:2, max_hp_bonus:20 }

test('all equipment bonus fields contribute to effective attributes and derived stats', () => {
  const result = getEffectiveStats(player,[sword,armor])
  assert.equal(result.core.atk,13)
  assert.equal(result.core.def,6)
  assert.equal(result.core.power,5)
  assert.equal(result.core.guard,4)
  assert.equal(result.core.speed,4)
  assert.equal(result.core.insight,4)
  assert.equal(result.core.luck,3)
  assert.equal(result.core.agility,4)
  assert.equal(result.maxHp,120)
  assert.equal(result.attack,17)
  assert.equal(result.defense,9)
  assert.equal(result.initiative,4)
})

test('unequipping removes every item bonus and does not mutate stored base stats', () => {
  const result = getEffectiveStats(player,[{...sword,equipped_slot:null},armor])
  assert.equal(result.core.atk,8)
  assert.equal(result.core.speed,2)
  assert.equal(result.core.luck,2)
  assert.equal(player.atk,8)
  assert.equal(player.max_hp,100)
})

test('combat class hooks receive effective stats without a second gear addition', () => {
  const stats = getEffectiveStats(player,[sword,armor])
  const combat = getCombatPlayer(player,[sword,armor])
  assert.equal(combat.atk,stats.attack)
  assert.equal(combat.def,stats.defense)
  assert.equal(combat.speed,stats.initiative)
  assert.equal(combat.max_hp,stats.maxHp)
})
