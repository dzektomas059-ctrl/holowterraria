import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDamageDeterministic,
  addItemToInventory,
  canPhaseShift,
  calculateFallDamage,
  validateHouseStructure,
  isToolSuitable,
} from './rules.ts';
import { InventorySlot, ItemCategory, TileType } from './types.ts';

test('calculateDamageDeterministic mitigates damage correctly with defense', () => {
  // 30 damage vs 10 defense -> effective defense = 5 -> net 25
  const dmg = calculateDamageDeterministic(30, 10, false, 1.0);
  assert.equal(dmg, 25);

  // high defense absorbs down to minimum 1
  const lowDmg = calculateDamageDeterministic(10, 50, false, 1.0);
  assert.equal(lowDmg, 1);

  // critical hit deals 1.5x damage
  const critDmg = calculateDamageDeterministic(20, 0, true, 1.0);
  assert.equal(critDmg, 30);
});

test('addItemToInventory stacks into existing slots and fills empty slots', () => {
  const slots: (InventorySlot | null)[] = [
    { itemId: 'wood', count: 10 },
    null,
    { itemId: 'stone', count: 5 },
  ];

  // Adding 5 more wood -> should stack into slots[0]
  const rem1 = addItemToInventory(slots, 'wood', 5, 999);
  assert.equal(rem1, 0);
  assert.equal(slots[0]?.count, 15);

  // Adding 3 iron bars -> should go into slot[1]
  const rem2 = addItemToInventory(slots, 'iron_bar', 3, 999);
  assert.equal(rem2, 0);
  assert.deepEqual(slots[1], { itemId: 'iron_bar', count: 3 });

  // When slots are full, remaining count should be returned
  const fullSlots: (InventorySlot | null)[] = [
    { itemId: 'dirt', count: 999 },
  ];
  const rem3 = addItemToInventory(fullSlots, 'dirt', 50, 999);
  assert.equal(rem3, 50);
});

test('canPhaseShift respects energy and cooldown timers', () => {
  // Has enough energy, cooldown ready
  assert.deepEqual(canPhaseShift(50, 20, 0), { canShift: true });

  // On cooldown
  assert.deepEqual(canPhaseShift(50, 20, 1.2), { canShift: false, reason: 'cooldown' });

  // Insufficient echo energy
  assert.deepEqual(canPhaseShift(10, 20, 0), { canShift: false, reason: 'no_energy' });
});

test('calculateFallDamage grants grace period and scales with excess height', () => {
  assert.equal(calculateFallDamage(20, 25), 0);
  assert.equal(calculateFallDamage(25, 25), 0);
  // 5 excess tiles * 10 = 50 damage
  assert.equal(calculateFallDamage(30, 25), 50);
});

test('validateHouseStructure requires space, door, light, furniture, and walls', () => {
  // Valid cozy room 10x6
  const valid = validateHouseStructure(10, 6, true, true, true, true, 0.95);
  assert.equal(valid.valid, true);

  // Missing light source
  const noLight = validateHouseStructure(10, 6, true, false, true, true, 0.95);
  assert.equal(noLight.valid, false);

  // Too tiny room (3x3 = 9 area)
  const tooSmall = validateHouseStructure(3, 3, true, true, true, true, 0.95);
  assert.equal(tooSmall.valid, false);
});

test('isToolSuitable checks appropriate tools for mining blocks', () => {
  // Chopping tree requires axe
  assert.equal(isToolSuitable(TileType.WOOD, ItemCategory.TOOL_AXE, 0, 40).suitable, true);
  assert.equal(isToolSuitable(TileType.WOOD, ItemCategory.TOOL_PICKAXE, 50, 0).suitable, false);

  // Mining stone requires pickaxe
  assert.equal(isToolSuitable(TileType.STONE, ItemCategory.TOOL_PICKAXE, 40, 0).suitable, true);
  assert.equal(isToolSuitable(TileType.STONE, ItemCategory.TOOL_AXE, 0, 50).suitable, false);

  // High tier obsidianite requires pick power >= 70
  assert.equal(isToolSuitable(TileType.OBSIDIANITE_ORE, ItemCategory.TOOL_PICKAXE, 55, 0).suitable, false);
  assert.equal(isToolSuitable(TileType.OBSIDIANITE_ORE, ItemCategory.TOOL_PICKAXE, 80, 0).suitable, true);
});
