import illustration from './fallback.svg?raw';
import { walls, floors } from './materials';
import {
  curtainColors,
  rugColors,
  curtainDimensions,
  lightingParameters,
} from './state';

// A functional illustration for devices without WebGL 2, also available at ?mode=2d.
import type { RoomState, RoomRenderer } from './types';

export class FallbackScene implements RoomRenderer {
  container: HTMLDivElement;
  svg: SVGSVGElement;
  constructor(container: HTMLDivElement) {
    this.container = container;
    container.insertAdjacentHTML('afterbegin', illustration);
    this.svg = container.querySelector('svg')!;
  }

  update(state: RoomState) {
    const svg = this.svg;
    const find = (id: string) => svg.querySelector<SVGElement>(`#${id}`)!;
    const floor = floors[state.floor];
    svg.style.setProperty('--wall-color', walls[state.wall].color);
    svg.style.setProperty('--floor-color', floor.color);
    svg.style.setProperty('--floor-line', floor.line);
    svg.style.setProperty(
      '--curtain-color',
      curtainColors[state.curtains.back.color].color,
    );
    svg.style.setProperty(
      '--left-curtain-color',
      curtainColors[state.curtains.left.color].color,
    );
    svg.style.setProperty('--rug-color', rugColors[state.rug.color].color);
    find('floor-wood').toggleAttribute('hidden', state.floor === 'tile');
    find('floor-tile').toggleAttribute('hidden', state.floor !== 'tile');
    find('curtains').toggleAttribute('hidden', !state.curtains.back.enabled);
    const back = curtainDimensions(state.curtains.back, 280);
    const height = (state.curtains.back.length / 260) * 318;
    find('curtain-left').setAttribute(
      'transform',
      `translate(497 165) scale(${back.panelWidth} ${height})`,
    );
    find('curtain-right').setAttribute(
      'transform',
      `translate(${777 - back.panelWidth} 165) scale(${back.panelWidth} ${height})`,
    );
    const left = state.curtains.left;
    const leftGroup = find('left-curtain-fallback');
    leftGroup.replaceChildren();
    leftGroup.toggleAttribute('hidden', !left.enabled);
    const top = (x: number) => 65 + (x * 105) / 480;
    const bottom = (x: number) =>
      top(x) + ((760 - (x * 280) / 480 - top(x)) * left.length) / 260;
    const width = left.open ? 60 : 240;
    for (const start of [0, 480 - width]) {
      const end = start + width;
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      path.setAttribute(
        'd',
        `M${start} ${top(start)}L${end} ${top(end)}V${bottom(end)}L${start} ${bottom(start)}Z`,
      );
      leftGroup.append(path);
      const folds = path.cloneNode() as SVGPathElement;
      folds.setAttribute('fill', 'url(#curtain-folds)');
      leftGroup.append(folds);
    }
    find('rug-fallback').toggleAttribute('hidden', !state.rug.enabled);
    const light = lightingParameters(state);
    find('pendant-lamp').toggleAttribute('hidden', !state.lighting.enabled);
    find('lamp-bulb').setAttribute('fill', light.on ? light.color : '#8b8d82');
    find('sunlight').toggleAttribute('hidden', light.night);
    svg
      .querySelectorAll('.night-window-lights')
      .forEach((group) => group.toggleAttribute('hidden', !light.night));
    // Brightness changes preserve contrast; there is no translucent fog overlay.
    svg.style.filter = light.night
      ? `brightness(${light.on ? 0.42 + (state.lighting.brightness / 100) * 0.24 : 0.19})`
      : 'none';
    this.container.dataset.renderStatus = 'fallback';
    for (const key of ['wall', 'floor', 'period'] as const)
      this.container.dataset[key] = state[key];
    this.container.dataset.rug = String(state.rug.enabled);
    this.container.dataset.curtains = (['left', 'back'] as const)
      .filter((side) => state.curtains[side].enabled)
      .join(' ');
  }

  dispose() {
    this.svg.remove();
  }

  setView() {
    /* A fixed camera is intentional in the lightweight illustration. */
  }
}
