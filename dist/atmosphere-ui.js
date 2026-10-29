import { curtainColors, curtainGeometry, lightingStyle, describeAtmosphere } from './atmosphere.js';

const element = (id) => document.getElementById(id);

export function readAtmosphere(form) {
  const field = (name) => form.elements.namedItem(name);
  return {
    curtains: field('curtains').checked,
    curtainOpen: field('curtainPosition').value === 'open',
    curtainColor: field('curtainColor').value,
    curtainLength: field('curtainLength').valueAsNumber,
    period: field('period').value,
    lamp: field('lamp').checked,
    lampOn: field('lampOn').checked,
    temperature: field('temperature').value,
    brightness: field('brightness').valueAsNumber,
  };
}

export function renderAtmosphere(scene, state) {
  const geometry = curtainGeometry(state);
  const light = lightingStyle(state);
  scene.style.setProperty('--curtain-color', curtainColors[state.curtainColor].color);
  scene.style.setProperty('--light-color', light.color);
  element('curtains').toggleAttribute('hidden', !state.curtains);
  for (const side of ['left', 'right']) {
    element(`curtain-${side}`).setAttribute('transform', `translate(${geometry[side]} ${geometry.top}) scale(${geometry.width} ${geometry.height})`);
  }
  element('curtain-controls').disabled = !state.curtains;
  element('curtain-controls').hidden = !state.curtains;
  element('curtain-length-value').textContent = `${state.curtainLength} см`;
  element('curtain-length').setAttribute('aria-valuetext', `${state.curtainLength} сантиметров`);

  element('night-shade').setAttribute('opacity', light.shade);
  element('sunlight').toggleAttribute('hidden', state.period === 'night');
  document.querySelectorAll('.night-window-lights').forEach((group) => group.toggleAttribute('hidden', state.period !== 'night'));
  element('pendant-lamp').toggleAttribute('hidden', !state.lamp);
  element('lamp-glow').toggleAttribute('hidden', !light.on);
  element('lamp-glow').setAttribute('opacity', light.glow);
  element('lamp-bulb').setAttribute('fill', light.on ? light.color : state.period === 'night' ? '#677365' : '#d6d5c4');
  element('lamp-controls').disabled = !state.lamp;
  element('lamp-controls').hidden = !state.lamp;
  element('temperature').disabled = !state.lampOn;
  element('brightness').disabled = !state.lampOn;
  element('brightness-value').textContent = `${state.brightness}%`;
  element('brightness').setAttribute('aria-valuetext', `${state.brightness} процентов`);
  element('atmosphere-summary').textContent = describeAtmosphere(state);
}
