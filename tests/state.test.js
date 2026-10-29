import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, updateState, applyCurtainsToAll, curtainDimensions, lightingParameters, curtainColors, temperatures, rugColors } from '../src/state.js';

test('initial states do not share mutable window settings', () => {
  const first = createInitialState();
  first.curtains.left.enabled = true;
  assert.equal(first.curtains.back.enabled, false);
  assert.equal(createInitialState().curtains.left.enabled, false);
});

for (const side of ['left', 'back']) {
  test(`${side} window can be configured without changing the other window`, () => {
    const initial = createInitialState();
    let next = updateState(initial, `curtains.${side}.enabled`, true);
    next = updateState(next, `curtains.${side}.open`, false);
    next = updateState(next, `curtains.${side}.color`, 'graphite');
    next = updateState(next, `curtains.${side}.length`, 120);
    assert.deepEqual(next.curtains[side], { enabled: true, open: false, color: 'graphite', length: 120 });
    const other = side === 'left' ? 'back' : 'left';
    assert.deepEqual(next.curtains[other], initial.curtains[other]);
    assert.deepEqual(initial, createInitialState());
  });
}

test('apply to all copies current settings into independent window objects', () => {
  const initial = updateState(updateState(createInitialState(), 'curtains.back.color', 'sage'), 'curtains.back.open', false);
  const next = applyCurtainsToAll(initial, 'back');
  assert.deepEqual(next.curtains.left, { enabled: true, open: false, color: 'sage', length: 260 });
  assert.deepEqual(next.curtains.back, next.curtains.left);
  assert.notStrictEqual(next.curtains.left, next.curtains.back);
  assert.equal(initial.curtains.left.enabled, false);
});

test('closed curtains cover the entire width; open curtains leave a visible gap', () => {
  for (const width of [2.61, 4.98]) {
    const settings = createInitialState().curtains.left;
    const open = curtainDimensions(settings, width);
    const closed = curtainDimensions({ ...settings, open: false }, width);
    assert.equal(closed.panelWidth * 2, width);
    assert.ok(open.panelWidth * 2 < width);
    assert.equal(curtainDimensions({ ...settings, length: 120 }, width).height, 1.2);
    assert.equal(curtainDimensions({ ...settings, length: 260 }, width).height, 2.6);
  }
});

test('night switches off the sun; lamp off removes both direct light sources', () => {
  let state = updateState(createInitialState(), 'period', 'night');
  assert.equal(lightingParameters(state).sunlight, 0);
  assert.ok(lightingParameters(state).spot > 0);
  state = updateState(state, 'lighting.on', false);
  assert.equal(lightingParameters(state).spot, 0);
  assert.equal(lightingParameters(state).point, 0);
  state = updateState(updateState(state, 'lighting.on', true), 'lighting.enabled', false);
  assert.equal(lightingParameters(state).spot, 0);
});

test('brightness affects light intensity without altering selected materials', () => {
  const state = { ...createInitialState(), wall: 'gray', floor: 'dark' };
  const low = updateState(state, 'lighting.brightness', 10);
  const high = updateState(state, 'lighting.brightness', 100);
  assert.ok(lightingParameters(high).spot > lightingParameters(low).spot);
  assert.equal(low.wall, 'gray');
  assert.equal(high.floor, 'dark');
});

test('every light temperature and fabric palette is distinct', () => {
  for (const palette of [temperatures, curtainColors, rugColors]) {
    assert.equal(new Set(Object.values(palette).map(item => item.color)).size, 3);
  }
});

test('adding a rug preserves finish and curtain choices', () => {
  const initial = applyCurtainsToAll({ ...createInitialState(), floor: 'tile' }, 'left');
  const next = updateState(updateState(initial, 'rug.enabled', true), 'rug.color', 'clay');
  assert.deepEqual(next.rug, { enabled: true, color: 'clay' });
  assert.deepEqual(next.curtains, initial.curtains);
  assert.equal(next.floor, 'tile');
});

test('invalid paths, enums, types and slider values are rejected', () => {
  const state = createInitialState();
  for (const [path, value] of [
    ['__proto__.enabled', true], ['curtains.middle.enabled', true], ['wall', 'tile'],
    ['lighting.on', 'true'], ['lighting.brightness', 101], ['lighting.brightness', NaN],
    ['curtains.left.length', 119], ['curtains.back.length', 255], ['rug.color', 'pink'],
  ]) assert.strictEqual(updateState(state, path, value), state);
  assert.strictEqual(applyCurtainsToAll(state, 'middle'), state);
});

test('reset factory restores every setting independently of modified state', () => {
  let state = applyCurtainsToAll(createInitialState(), 'left');
  for (const [path, value] of [['wall', 'white'], ['floor', 'dark'], ['period', 'night'], ['lighting.temperature', 'cool'], ['lighting.brightness', 100], ['rug.enabled', true]]) state = updateState(state, path, value);
  assert.notDeepEqual(state, createInitialState());
  assert.deepEqual(createInitialState(), { wall: 'beige', floor: 'light', period: 'day', curtains: { left: { enabled: false, open: true, color: 'linen', length: 260 }, back: { enabled: false, open: true, color: 'linen', length: 260 } }, lighting: { enabled: true, on: true, temperature: 'warm', brightness: 70 }, rug: { enabled: false, color: 'sand' } });
});
