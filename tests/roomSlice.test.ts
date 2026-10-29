import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppStore } from '../src/store/index';
import reducer, {
  wallChanged,
  floorChanged,
  curtainChanged,
  curtainsAppliedToAll,
  lightingChanged,
  periodChanged,
  rugToggled,
  rugColorChanged,
  roomReset,
} from '../src/store/roomSlice';
import {
  createInitialState,
  curtainDimensions,
  lightingParameters,
  curtainColors,
  temperatures,
  rugColors,
} from '../src/state';
import { describeSelection } from '../src/materials';
import type { Wall, Floor, WindowSide } from '../src/types';

const initial = () => reducer(undefined, { type: 'init' });
test('Redux store starts with independent default settings', () => {
  assert.deepEqual(createAppStore().getState().room, createInitialState());
  const first = createInitialState();
  first.curtains.left.enabled = true;
  assert.equal(first.curtains.back.enabled, false);
  assert.equal(createInitialState().curtains.left.enabled, false);
});
for (const wall of ['white', 'beige', 'gray'] as Wall[])
  for (const floor of ['light', 'dark', 'tile'] as Floor[]) {
    test(`${wall} walls and ${floor} floor work in either action order`, () => {
      const wallFirst = reducer(
        reducer(initial(), wallChanged(wall)),
        floorChanged(floor),
      );
      const floorFirst = reducer(
        reducer(initial(), floorChanged(floor)),
        wallChanged(wall),
      );
      assert.deepEqual(wallFirst, floorFirst);
      assert.equal(wallFirst.wall, wall);
      assert.equal(wallFirst.floor, floor);
      assert.match(describeSelection(wallFirst), /^Стены: .+\. Пол: .+\.$/);
    });
  }
for (const side of ['left', 'back'] as WindowSide[]) {
  test(`${side} curtain actions preserve the other side and existing state`, () => {
    const before = initial();
    const next = reducer(
      before,
      curtainChanged({
        side,
        changes: { enabled: true, open: false, color: 'graphite', length: 120 },
      }),
    );
    assert.deepEqual(next.curtains[side], {
      enabled: true,
      open: false,
      color: 'graphite',
      length: 120,
    });
    assert.deepEqual(
      next.curtains[side === 'left' ? 'back' : 'left'],
      before.curtains[side === 'left' ? 'back' : 'left'],
    );
    assert.deepEqual(before, createInitialState());
  });
}
test('apply to all copies a curtain into two independent objects', () => {
  const state = reducer(
    initial(),
    curtainChanged({ side: 'back', changes: { color: 'sage', open: false } }),
  );
  const next = reducer(state, curtainsAppliedToAll('back'));
  assert.deepEqual(next.curtains.left, {
    enabled: true,
    open: false,
    color: 'sage',
    length: 260,
  });
  assert.deepEqual(next.curtains.left, next.curtains.back);
  assert.notStrictEqual(next.curtains.left, next.curtains.back);
});
test('removing a curtain preserves its settings for re-adding', () => {
  let state = reducer(
    initial(),
    curtainChanged({
      side: 'left',
      changes: { enabled: true, color: 'sage', length: 120 },
    }),
  );
  state = reducer(
    state,
    curtainChanged({ side: 'left', changes: { enabled: false } }),
  );
  state = reducer(
    state,
    curtainChanged({ side: 'left', changes: { enabled: true } }),
  );
  assert.equal(state.curtains.left.color, 'sage');
  assert.equal(state.curtains.left.length, 120);
});
test('closed curtains cover their full window width at both heights', () => {
  for (const width of [2.61, 4.98])
    for (const length of [120, 260]) {
      const curtain = { ...initial().curtains.left, length };
      const closed = curtainDimensions({ ...curtain, open: false }, width);
      assert.equal(closed.panelWidth * 2, width);
      assert.equal(closed.height, length / 100);
      assert.ok(curtainDimensions(curtain, width).panelWidth * 2 < width);
    }
});
test('night removes sunlight; lamp power and presence control both light sources', () => {
  let state = reducer(initial(), periodChanged('night'));
  assert.equal(lightingParameters(state).sunlight, 0);
  assert.ok(lightingParameters(state).spot > 0);
  state = reducer(state, lightingChanged({ on: false }));
  assert.equal(lightingParameters(state).spot, 0);
  assert.equal(lightingParameters(state).point, 0);
  state = reducer(state, lightingChanged({ on: true, enabled: false }));
  assert.equal(lightingParameters(state).spot, 0);
});
test('brightness changes intensity while temperature preserves material choices', () => {
  let state = reducer(
    reducer(initial(), wallChanged('gray')),
    floorChanged('dark'),
  );
  const low = reducer(state, lightingChanged({ brightness: 10 }));
  const high = reducer(
    state,
    lightingChanged({ brightness: 100, temperature: 'cool' }),
  );
  assert.ok(lightingParameters(high).spot > lightingParameters(low).spot);
  assert.equal(high.wall, 'gray');
  assert.equal(high.floor, 'dark');
});
test('rug changes preserve finishes and curtain choices', () => {
  const before = reducer(
    reducer(initial(), floorChanged('tile')),
    curtainsAppliedToAll('left'),
  );
  const after = reducer(
    reducer(before, rugToggled(true)),
    rugColorChanged('clay'),
  );
  assert.deepEqual(after.rug, { enabled: true, color: 'clay' });
  assert.equal(after.floor, 'tile');
  assert.deepEqual(after.curtains, before.curtains);
});
test('slider bounds reject invalid numbers without partial updates', () => {
  for (const length of [119, 270, 255, NaN, Infinity]) {
    const before = initial();
    assert.strictEqual(
      reducer(
        before,
        curtainChanged({ side: 'left', changes: { length, color: 'sage' } }),
      ),
      before,
    );
  }
  for (const brightness of [0, 105, 11, NaN, Infinity]) {
    const before = initial();
    assert.strictEqual(
      reducer(before, lightingChanged({ brightness, on: false })),
      before,
    );
  }
});
test('palettes have three distinct colours', () => {
  for (const palette of [curtainColors, temperatures, rugColors])
    assert.equal(
      new Set(Object.values(palette).map((item) => item.color)).size,
      3,
    );
});
test('full reset restores every setting through the actual Redux store', () => {
  const store = createAppStore();
  store.dispatch(wallChanged('white'));
  store.dispatch(floorChanged('dark'));
  store.dispatch(periodChanged('night'));
  store.dispatch(
    curtainChanged({
      side: 'left',
      changes: { enabled: true, open: false, color: 'graphite', length: 120 },
    }),
  );
  store.dispatch(curtainsAppliedToAll('left'));
  store.dispatch(
    lightingChanged({ temperature: 'cool', brightness: 100, on: false }),
  );
  store.dispatch(rugToggled(true));
  store.dispatch(rugColorChanged('olive'));
  store.dispatch(roomReset());
  assert.deepEqual(store.getState().room, createInitialState());
});
