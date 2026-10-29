import { walls, floors, initialSelection, describeSelection } from './materials.js';
import { initialAtmosphere, describeAtmosphere } from './atmosphere.js';
import { readAtmosphere, renderAtmosphere } from './atmosphere-ui.js';

const form = document.querySelector('#finishes');
const scene = document.querySelector('#balcony');
const sceneTitle = document.querySelector('#scene-title');
const summary = document.querySelector('#selection-summary');
const wood = document.querySelector('#floor-wood');
const tile = document.querySelector('#floor-tile');
let selection = { ...initialSelection };
let atmosphere = { ...initialAtmosphere };

function render() {
  const wall = walls[selection.wall];
  const floor = floors[selection.floor];
  scene.style.setProperty('--wall-color', wall.color);
  scene.style.setProperty('--floor-color', floor.color);
  scene.style.setProperty('--floor-line', floor.line);
  wood.toggleAttribute('hidden', selection.floor === 'tile');
  tile.toggleAttribute('hidden', selection.floor !== 'tile');
  summary.textContent = describeSelection(selection);
  renderAtmosphere(scene, atmosphere);
  sceneTitle.textContent = `Интерьер балкона. ${describeSelection(selection)} ${describeAtmosphere(atmosphere)}`;
}

form.addEventListener('change', syncWithForm);

// Range inputs update continuously while dragging or using the arrow keys.
form.addEventListener('input', (event) => {
  if (event.target instanceof HTMLInputElement && event.target.type === 'range') syncWithForm();
});

// Render known defaults: native input values are restored after this event.
// Reading the form here (even in a microtask) can still return the old values.
form.addEventListener('reset', () => {
  selection = { ...initialSelection };
  atmosphere = { ...initialAtmosphere };
  render();
});

// Synchronize the native form, including values browsers may restore on navigation.
function syncWithForm() {
  selection = { wall: form.elements.wall.value, floor: form.elements.floor.value };
  atmosphere = readAtmosphere(form);
  render();
}
window.addEventListener('pageshow', syncWithForm);
syncWithForm();
