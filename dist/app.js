import { walls, floors, initialSelection, selectMaterial, describeSelection } from './materials.js';

const form = document.querySelector('#finishes');
const scene = document.querySelector('#balcony');
const sceneTitle = document.querySelector('#scene-title');
const summary = document.querySelector('#selection-summary');
const wood = document.querySelector('#floor-wood');
const tile = document.querySelector('#floor-tile');
let selection = { ...initialSelection };

function render() {
  const wall = walls[selection.wall];
  const floor = floors[selection.floor];
  scene.style.setProperty('--wall-color', wall.color);
  scene.style.setProperty('--floor-color', floor.color);
  scene.style.setProperty('--floor-line', floor.line);
  wood.toggleAttribute('hidden', selection.floor === 'tile');
  tile.toggleAttribute('hidden', selection.floor !== 'tile');
  summary.textContent = describeSelection(selection);
  sceneTitle.textContent = `Интерьер балкона с ${wall.interior} стенами и ${floor.interior}`;
}

form.addEventListener('change', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'radio') return;
  selection = selectMaterial(selection, input.name, input.value);
  render();
});

form.addEventListener('reset', () => {
  selection = { ...initialSelection };
  render();
});

// Synchronize the native form, including values browsers may restore on navigation.
function syncWithForm() {
  selection = { wall: form.elements.wall.value, floor: form.elements.floor.value };
  render();
}
window.addEventListener('pageshow', syncWithForm);
syncWithForm();
