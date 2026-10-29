import test from 'node:test';
import assert from 'node:assert/strict';
import { initialAtmosphere, curtainColors, temperatures, curtainGeometry, lightingStyle, describeAtmosphere } from '../dist/atmosphere.js';
import { initialSelection } from '../dist/materials.js';

test('extras start absent and the room starts in daylight', () => {
  assert.equal(initialAtmosphere.curtains, false);
  assert.equal(initialAtmosphere.lamp, false);
  assert.equal(lightingStyle(initialAtmosphere).shade, 0);
  assert.equal(lightingStyle(initialAtmosphere).glow, 0);
});

test('open curtains leave a gap and closed panels meet without overlapping', () => {
  const opened = curtainGeometry({ ...initialAtmosphere, curtainOpen: true });
  const closed = curtainGeometry({ ...initialAtmosphere, curtainOpen: false });
  assert.ok(opened.left + opened.width < opened.right);
  assert.equal(closed.left + closed.width, closed.right);
  assert.equal(opened.right + opened.width, closed.right + closed.width);
});

test('curtain length stays within the room at both slider limits', () => {
  for (const curtainOpen of [true, false]) {
    const short = curtainGeometry({ ...initialAtmosphere, curtainOpen, curtainLength: 120 });
    const long = curtainGeometry({ ...initialAtmosphere, curtainOpen, curtainLength: 260 });
    assert.ok(short.height < long.height);
    assert.ok(long.top + long.height <= 483);
    assert.equal(short.width, long.width);
  }
});

test('removing the lamp and turning it off both remove the glow', () => {
  for (const period of ['day', 'night']) {
    assert.equal(lightingStyle({ ...initialAtmosphere, period, lamp: false, lampOn: true }).glow, 0);
    assert.equal(lightingStyle({ ...initialAtmosphere, period, lamp: true, lampOn: false }).glow, 0);
    assert.ok(lightingStyle({ ...initialAtmosphere, period, lamp: true, lampOn: true }).glow > 0);
  }
});

test('brightness increases light intensity in both daylight and evening', () => {
  for (const period of ['day', 'night']) {
    const low = lightingStyle({ ...initialAtmosphere, period, lamp: true, brightness: 10 });
    const high = lightingStyle({ ...initialAtmosphere, period, lamp: true, brightness: 100 });
    assert.ok(low.glow > 0 && low.glow < high.glow && high.glow <= 1);
  }
});

test('every light temperature and curtain colour has a distinct colour', () => {
  assert.equal(new Set(Object.values(curtainColors).map(item => item.color)).size, 3);
  const colors = Object.keys(temperatures).map(temperature => lightingStyle({ ...initialAtmosphere, lamp: true, temperature }).color);
  assert.equal(new Set(colors).size, 3);
});

test('atmosphere calculations preserve material choices and reusable defaults', () => {
  const before = JSON.stringify({ initialSelection, initialAtmosphere });
  for (const period of ['day', 'night']) {
    for (const temperature of Object.keys(temperatures)) {
      lightingStyle({ ...initialAtmosphere, period, temperature, lamp: true });
      describeAtmosphere({ ...initialAtmosphere, period, temperature, curtains: true });
    }
  }
  assert.equal(JSON.stringify({ initialSelection, initialAtmosphere }), before);
});

test('the atmosphere summary distinguishes closed curtains, disabled lamp and night', () => {
  const text = describeAtmosphere({ ...initialAtmosphere, curtains: true, curtainOpen: false, period: 'night', lamp: true, lampOn: false });
  assert.match(text, /закрыты/);
  assert.match(text, /260 см/);
  assert.match(text, /Вечер/);
  assert.match(text, /выключен/);
});
