import test from 'node:test';
import assert from 'node:assert/strict';
import { walls, floors, initialSelection, selectMaterial, describeSelection } from '../dist/materials.js';

test('the initial selection matches the assignment defaults', () => {
  assert.deepEqual(initialSelection, { wall: 'beige', floor: 'light' });
  assert.equal(describeSelection(initialSelection), 'Стены: бежевые. Пол: светлое дерево.');
});

for (const wall of Object.keys(walls)) {
  for (const floor of Object.keys(floors)) {
    test(`${wall} walls + ${floor} floor work in either selection order`, () => {
      const wallFirst = selectMaterial(selectMaterial(initialSelection, 'wall', wall), 'floor', floor);
      const floorFirst = selectMaterial(selectMaterial(initialSelection, 'floor', floor), 'wall', wall);
      assert.deepEqual(wallFirst, { wall, floor });
      assert.deepEqual(floorFirst, wallFirst);
      assert.equal(describeSelection(wallFirst), `Стены: ${walls[wall].description}. Пол: ${floors[floor].description}.`);
    });
  }
}

test('changing walls preserves every possible selected floor', () => {
  for (const floor of Object.keys(floors)) {
    const before = { wall: 'gray', floor };
    assert.deepEqual(selectMaterial(before, 'wall', 'white'), { wall: 'white', floor });
    assert.deepEqual(before, { wall: 'gray', floor });
  }
});

test('changing the floor preserves every possible selected wall', () => {
  for (const wall of Object.keys(walls)) {
    const before = { wall, floor: 'dark' };
    assert.deepEqual(selectMaterial(before, 'floor', 'tile'), { wall, floor: 'tile' });
    assert.deepEqual(before, { wall, floor: 'dark' });
  }
});

test('invalid surfaces and materials cannot corrupt the selection', () => {
  for (const [surface, value] of [['window', 'white'], ['wall', 'tile'], ['floor', 'gray'], ['wall', '__proto__']]) {
    assert.strictEqual(selectMaterial(initialSelection, surface, value), initialSelection);
  }
});

test('the initial selection remains reusable after repeated changes', () => {
  const changed = selectMaterial(selectMaterial(initialSelection, 'wall', 'gray'), 'floor', 'tile');
  assert.notDeepEqual(changed, initialSelection);
  assert.deepEqual({ ...initialSelection }, { wall: 'beige', floor: 'light' });
});
