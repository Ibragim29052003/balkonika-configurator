import { walls, floors, initialSelection } from './materials.js';

export const curtainColors = Object.freeze({
  linen: { color: '#dfd2b8', label: 'Натуральный лён' },
  sage: { color: '#8d9e85', label: 'Шалфей' },
  graphite: { color: '#535c62', label: 'Графит' },
});

export const temperatures = Object.freeze({
  warm: { color: '#ffd5a0', label: 'Тёплый · 3000 K' },
  neutral: { color: '#fff2dd', label: 'Нейтральный · 4500 K' },
  cool: { color: '#c9e0ff', label: 'Холодный · 6000 K' },
});

export const rugColors = Object.freeze({
  sand: { color: '#c9bba0', label: 'Песочный' },
  clay: { color: '#ae7760', label: 'Терракотовый' },
  olive: { color: '#899279', label: 'Оливковый' },
});

const defaultCurtain = () => ({ enabled: false, open: true, color: 'linen', length: 260 });

export function createInitialState() {
  return {
    ...initialSelection, period: 'day',
    curtains: { left: defaultCurtain(), back: defaultCurtain() },
    lighting: { enabled: true, on: true, temperature: 'warm', brightness: 70 },
    rug: { enabled: false, color: 'sand' },
  };
}

const isBoolean = value => typeof value === 'boolean';
const inOptions = options => value => Object.hasOwn(options, value);
const range = (min, max, step) => value => Number.isFinite(value) && value >= min && value <= max && (value - min) % step === 0;
const validators = {
  wall: inOptions(walls), floor: inOptions(floors),
  period: value => ['day', 'night'].includes(value),
  'lighting.enabled': isBoolean, 'lighting.on': isBoolean,
  'lighting.temperature': inOptions(temperatures), 'lighting.brightness': range(10, 100, 5),
  'rug.enabled': isBoolean, 'rug.color': inOptions(rugColors),
};
for (const side of ['left', 'back']) {
  validators[`curtains.${side}.enabled`] = isBoolean;
  validators[`curtains.${side}.open`] = isBoolean;
  validators[`curtains.${side}.color`] = inOptions(curtainColors);
  validators[`curtains.${side}.length`] = range(120, 260, 10);
}

export function updateState(state, path, value) {
  if (!Object.hasOwn(validators, path) || !validators[path](value)) return state;
  const next = structuredClone(state);
  const keys = path.split('.');
  const key = keys.pop();
  const target = keys.reduce((object, part) => object[part], next);
  target[key] = value;
  return next;
}

export function applyCurtainsToAll(state, sourceSide) {
  if (!['left', 'back'].includes(sourceSide)) return state;
  const next = structuredClone(state);
  const settings = { ...state.curtains[sourceSide], enabled: true };
  next.curtains = { left: { ...settings }, back: { ...settings } };
  return next;
}

export function curtainDimensions(settings, width) {
  return { panelWidth: settings.open ? width * 0.14 : width / 2, height: settings.length / 100 };
}

export function lightingParameters(state) {
  const night = state.period === 'night';
  const on = state.lighting.enabled && state.lighting.on;
  const power = on ? state.lighting.brightness / 100 : 0;
  return {
    night, on,
    sky: night ? '#091324' : '#b8d0dd',
    ambient: night ? 0.14 : 1.05,
    sunlight: night ? 0 : 2.7,
    spot: power * 50,
    point: power * 1.3,
    color: temperatures[state.lighting.temperature].color,
  };
}
