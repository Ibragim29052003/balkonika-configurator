import test from 'node:test';
import assert from 'node:assert/strict';
import { walls, floors, initialSelection, describeSelection } from '../src/materials.js';
import { updateState } from '../src/state.js';

test('the initial selection matches the assignment defaults', () => {
  assert.deepEqual(initialSelection, { wall: 'beige', floor: 'light' });
  assert.equal(describeSelection(initialSelection), 'Стены: бежевые. Пол: светлое дерево.');
});

for (const wall of Object.keys(walls)) {
  for (const floor of Object.keys(floors)) {
    test(`${wall} walls + ${floor} floor work in either selection order`, () => {
      const wallFirst = updateState(updateState(initialSelection, 'wall', wall), 'floor', floor);
      const floorFirst = updateState(updateState(initialSelection, 'floor', floor), 'wall', wall);
      assert.deepEqual(wallFirst, { wall, floor });
      assert.deepEqual(floorFirst, wallFirst);
      assert.equal(describeSelection(wallFirst), `Стены: ${walls[wall].description}. Пол: ${floors[floor].description}.`);
    });
  }
}

test('changing walls preserves every possible selected floor', () => {
  for (const floor of Object.keys(floors)) {
    const before = { wall: 'gray', floor };
    assert.deepEqual(updateState(before, 'wall', 'white'), { wall: 'white', floor });
    assert.deepEqual(before, { wall: 'gray', floor });
  }
});

test('changing the floor preserves every possible selected wall', () => {
  for (const wall of Object.keys(walls)) {
    const before = { wall, floor: 'dark' };
    assert.deepEqual(updateState(before, 'floor', 'tile'), { wall, floor: 'tile' });
    assert.deepEqual(before, { wall, floor: 'dark' });
  }
});

test('invalid surfaces and materials cannot corrupt the selection', () => {
  for (const [surface, value] of [['window', 'white'], ['wall', 'tile'], ['floor', 'gray'], ['wall', '__proto__']]) {
    assert.strictEqual(updateState(initialSelection, surface, value), initialSelection);
  }
});

test('the initial selection remains reusable after repeated changes', () => {
  const changed = updateState(updateState(initialSelection, 'wall', 'gray'), 'floor', 'tile');
  assert.notDeepEqual(changed, initialSelection);
  assert.deepEqual({ ...initialSelection }, { wall: 'beige', floor: 'light' });
});
