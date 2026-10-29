import { describeSelection } from './materials.js';
import { createInitialState, updateState, applyCurtainsToAll, curtainColors } from './state.js';
import { initializeSelects, syncSelects, closeSelects } from './select.js';
import { initializeTheme } from './theme.js';

const form = document.getElementById('finishes');
const sceneContainer = document.getElementById('scene-container');
let state = createInitialState();
let selectedWindow = 'left';
let room = null;
const byId = id => document.getElementById(id);
const get = (object, path) => path.split('.').reduce((value, key) => value[key], object);

initializeTheme(byId('theme-toggle'));
initializeSelects();

function renderUI() {
  form.querySelectorAll('[data-path]').forEach(input => {
    const value = get(state, input.dataset.path);
    if (input.type === 'checkbox') input.checked = value;
    else if (input.type === 'radio') input.checked = input.value === value;
    else input.value = value;
  });
  const curtain = state.curtains[selectedWindow];
  form.querySelectorAll('[data-curtain]').forEach(input => {
    const value = curtain[input.dataset.curtain];
    if (input.type === 'checkbox') input.checked = value;
    else if (input.type === 'radio') input.checked = input.value === String(value);
    else input.value = value;
  });
  byId('curtain-controls').hidden = !curtain.enabled;
  byId('curtain-controls').disabled = !curtain.enabled;
  byId('curtain-toggle-label').textContent = selectedWindow === 'left' ? 'Шторы слева' : 'Шторы на дальнем окне';
  byId('curtain-length-value').textContent = `${curtain.length} см`;
  byId('curtain-length').setAttribute('aria-valuetext', `${curtain.length} сантиметров`);
  byId('rug-controls').hidden = !state.rug.enabled;
  byId('rug-color').disabled = !state.rug.enabled;
  byId('lamp-controls').hidden = !state.lighting.enabled;
  byId('lamp-controls').disabled = !state.lighting.enabled;
  byId('temperature').disabled = !state.lighting.on;
  byId('brightness').disabled = !state.lighting.on;
  byId('brightness-value').textContent = `${state.lighting.brightness}%`;
  byId('brightness').setAttribute('aria-valuetext', `${state.lighting.brightness} процентов`);
  byId('selection-summary').textContent = describeSelection(state);
  const curtainDescription = ['left', 'back'].map(side => {
    const current = state.curtains[side];
    const label = side === 'left' ? 'Слева' : 'На дальнем окне';
    return current.enabled ? `${label}: ${curtainColors[current.color].label.toLowerCase()}, ${current.open ? 'открыты' : 'закрыты'}, ${current.length} см.` : `${label}: без штор.`;
  }).join(' ');
  byId('curtain-status').textContent = curtainDescription;
  byId('scene-period').textContent = state.period === 'day' ? 'Дневной свет' : state.lighting.enabled && state.lighting.on ? 'Вечерний уют' : 'Ночь · свет выключен';
  document.querySelector('.stage').dataset.period = state.period;
  sceneContainer.setAttribute('aria-label', `Интерьер балкона. ${describeSelection(state)} ${state.period === 'day' ? 'День.' : 'Вечер.'} ${curtainDescription} ${state.rug.enabled ? 'На полу ковёр.' : 'Без ковра.'}`);
  syncSelects();
}

function render() { renderUI(); room?.update(state); }

function handleInput(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;
  if (input.type === 'radio' && !input.checked) return;
  let value = input.type === 'checkbox' ? input.checked : input.type === 'range' ? input.valueAsNumber : input.value;
  if (input.dataset.curtain === 'open') value = value === 'true';
  const path = input.dataset.path ?? (input.dataset.curtain ? `curtains.${selectedWindow}.${input.dataset.curtain}` : null);
  if (!path) return;
  state = updateState(state, path, value);
  render();
}
form.addEventListener('change', handleInput);
form.addEventListener('input', event => { if (event.target.type === 'range') handleInput(event); });
form.addEventListener('reset', () => {
  state = createInitialState();
  closeSelects();
  render();
  setView('wide');
});

function activateTab(name, focus = false) {
  closeSelects();
  document.querySelectorAll('[data-tab]').forEach(tab => {
    const selected = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    byId(`panel-${tab.dataset.tab}`).hidden = !selected;
    if (selected && focus) tab.focus({ preventScroll: true });
  });
}
const tabs = [...document.querySelectorAll('[data-tab]')];
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  tab.addEventListener('keydown', event => {
    const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!offset && !['Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + offset + tabs.length) % tabs.length;
    activateTab(tabs[next].dataset.tab, true);
  });
});
document.querySelectorAll('[data-window]').forEach(button => button.addEventListener('click', () => {
  closeSelects();
  selectedWindow = button.dataset.window;
  document.querySelectorAll('[data-window]').forEach(item => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  renderUI();
}));
byId('curtains-all').addEventListener('click', () => { state = applyCurtainsToAll(state, selectedWindow); render(); });
function setView(view) {
  closeSelects();
  document.querySelectorAll('[data-view]').forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  room?.setView(view);
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
sceneContainer.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const views = ['wide', 'detail', 'window'];
  const current = document.querySelector('[data-view][aria-pressed=true]').dataset.view;
  setView(views[(views.indexOf(current) + (event.key === 'ArrowRight' ? 1 : 2)) % views.length]);
});
if (!matchMedia('(pointer:fine)').matches) byId('scene-help').textContent = 'Выберите удобный ракурс';
renderUI();

try {
  const { BalconyScene } = await import('./scene.js');
  room = new BalconyScene(sceneContainer);
  room.update(state);
  byId('scene-loading').hidden = true;
} catch (error) {
  console.error('3D initialization failed:', error);
  sceneContainer.dataset.renderStatus = 'error';
  byId('scene-loading').lastElementChild.textContent = 'Для 3D-превью нужна поддержка WebGL 2. Попробуйте другой браузер.';
  byId('scene-loading').firstElementChild.hidden = true;
}
