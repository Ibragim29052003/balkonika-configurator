export const curtainColors = Object.freeze({
  linen: Object.freeze({ color: '#e2d4b8', label: 'лён' }),
  sage: Object.freeze({ color: '#879983', label: 'шалфей' }),
  graphite: Object.freeze({ color: '#56636a', label: 'графит' }),
});

export const temperatures = Object.freeze({
  warm: Object.freeze({ color: '#ffd08a', label: 'Тёплый свет · 3000 K' }),
  neutral: Object.freeze({ color: '#fff0d6', label: 'Нейтральный свет · 4500 K' }),
  cool: Object.freeze({ color: '#bedcff', label: 'Холодный свет · 6000 K' }),
});

export const initialAtmosphere = Object.freeze({
  curtains: false,
  curtainOpen: true,
  curtainColor: 'linen',
  curtainLength: 260,
  period: 'day',
  lamp: false,
  lampOn: true,
  temperature: 'warm',
  brightness: 75,
});

export function curtainGeometry({ curtainOpen, curtainLength }) {
  const width = curtainOpen ? 38 : 140;
  return { width, height: 318 * curtainLength / 260, left: 497, right: 777 - width, top: 165 };
}

export function lightingStyle({ period, lamp, lampOn, temperature, brightness }) {
  const on = lamp && lampOn;
  return {
    shade: period === 'night' ? 0.68 : 0,
    glow: on ? brightness / 100 * (period === 'night' ? 0.7 : 0.3) : 0,
    color: temperatures[temperature].color,
    on,
  };
}

export function describeAtmosphere(state) {
  const curtain = state.curtains
    ? `Шторы: ${state.curtainOpen ? 'открыты' : 'закрыты'}, ${curtainColors[state.curtainColor].label}, ${state.curtainLength} см.`
    : 'Без штор.';
  const period = state.period === 'day' ? 'День.' : 'Вечер.';
  const lamp = state.lamp
    ? state.lampOn ? `${temperatures[state.temperature].label}, ${state.brightness}%.` : 'Светильник выключен.'
    : 'Светильник не добавлен.';
  return `${curtain} ${period} ${lamp}`;
}
