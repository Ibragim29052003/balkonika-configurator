import { initialSelection } from './materials';
import type { CurtainSettings, RoomState } from './types';
export const curtainColors = {
  linen: { color: '#dfd2b8', label: 'Натуральный лён' },
  sage: { color: '#8d9e85', label: 'Шалфей' },
  graphite: { color: '#535c62', label: 'Графит' },
} as const;
export const temperatures = {
  warm: { color: '#ffd5a0', label: 'Тёплый · 3000 K' },
  neutral: { color: '#fff2dd', label: 'Нейтральный · 4500 K' },
  cool: { color: '#c9e0ff', label: 'Холодный · 6000 K' },
} as const;
export const rugColors = {
  sand: { color: '#c9bba0', label: 'Песочный' },
  clay: { color: '#ae7760', label: 'Терракотовый' },
  olive: { color: '#899279', label: 'Оливковый' },
} as const;
const defaultCurtain = (): CurtainSettings => ({
  enabled: false,
  open: true,
  color: 'linen',
  length: 260,
});
export function createInitialState(): RoomState {
  return {
    ...initialSelection,
    period: 'day',
    curtains: { left: defaultCurtain(), back: defaultCurtain() },
    lighting: { enabled: true, on: true, temperature: 'warm', brightness: 70 },
    rug: { enabled: false, color: 'sand' },
  };
}
export function curtainDimensions(settings: CurtainSettings, width: number) {
  return {
    panelWidth: settings.open ? width * 0.14 : width / 2,
    height: settings.length / 100,
  };
}
export function lightingParameters(state: RoomState) {
  const night = state.period === 'night';
  const on = state.lighting.enabled && state.lighting.on;
  const power = on ? state.lighting.brightness / 100 : 0;
  return {
    night,
    on,
    sky: night ? '#091324' : '#b8d0dd',
    ambient: night ? 0.14 : 1.05,
    sunlight: night ? 0 : 2.7,
    spot: power * 50,
    point: power * 1.3,
    color: temperatures[state.lighting.temperature].color,
  };
}
export function describeCurtains(state: RoomState): string {
  return (['left', 'back'] as const)
    .map((side) => {
      const curtain = state.curtains[side];
      const label = side === 'left' ? 'Слева' : 'На дальнем окне';
      return curtain.enabled
        ? `${label}: ${curtainColors[curtain.color].label.toLowerCase()}, ${curtain.open ? 'открыты' : 'закрыты'}, ${curtain.length} см.`
        : `${label}: без штор.`;
    })
    .join(' ');
}
