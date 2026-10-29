import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { walls } from './materials';
import {
  curtainColors,
  rugColors,
  curtainDimensions,
  lightingParameters,
} from './state';
import type {
  RoomState,
  RoomRenderer,
  CameraView,
  Floor,
  RugColor,
  WindowSide,
  CurtainSettings,
} from './types';
import {
  createWoodTexture,
  createFabricTexture,
  createTileTexture,
  createRugTexture,
  createArtTexture,
} from './textures';

type Position = [number, number, number];
type Material = THREE.Material;
const mat = (
  color: THREE.ColorRepresentation,
  options: THREE.MeshStandardMaterialParameters = {},
) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0,
    ...options,
  });

type CurtainObject = {
  group: THREE.Group;
  material: THREE.MeshStandardMaterial;
  panels: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>[];
  width: number;
  signature: string;
};

export class BalconyScene implements RoomRenderer {
  container: HTMLDivElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  observer: ResizeObserver;
  paint!: THREE.MeshStandardMaterial;
  floorMaps!: Record<Floor, THREE.CanvasTexture>;
  floorMaterial!: THREE.MeshStandardMaterial;
  floor!: THREE.Mesh;
  fabric!: THREE.CanvasTexture;
  rugMaterial!: THREE.MeshStandardMaterial;
  rug!: THREE.Mesh;
  curtains!: Record<WindowSide, CurtainObject>;
  hemisphere!: THREE.HemisphereLight;
  sun!: THREE.DirectionalLight;
  lamp!: THREE.Group;
  bulbMaterial!: THREE.MeshStandardMaterial;
  spot!: THREE.SpotLight;
  point!: THREE.PointLight;
  bounce!: THREE.AmbientLight;
  outdoorMaterials!: { material: THREE.MeshBasicMaterial; day: string }[];
  windowMaterials!: THREE.MeshBasicMaterial[];
  lastFloor?: Floor;
  lastRug?: RugColor;
  disposed = false;
  constructor(
    container: HTMLDivElement,
    onContextChange: (paused: boolean) => void,
  ) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#b8d0dd');
    this.camera = new THREE.PerspectiveCamera(54, 1, 0.05, 70);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.style.touchAction = 'pan-y';
    container.prepend(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = false;
    this.controls.minDistance = 3.7;
    this.controls.maxDistance = 6.2;
    this.controls.minAzimuthAngle = -0.22;
    this.controls.maxAzimuthAngle = 0.3;
    this.controls.minPolarAngle = 1.3;
    this.controls.maxPolarAngle = 1.56;
    this.controls.enabled = matchMedia('(pointer:fine)').matches;
    this.renderer.domElement.style.touchAction = 'pan-y';
    this.controls.addEventListener('change', () => this.render());
    this.createRoom();
    this.createFurniture();
    this.createCurtains();
    this.createLighting();
    this.createOutdoors();
    this.setView('wide');
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      container.dataset.renderStatus = 'paused';
      onContextChange(true);
    });
    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.renderer.shadowMap.needsUpdate = true;
      this.render();
      container.dataset.renderStatus = 'ready';
      onContextChange(false);
    });
  }

  mesh<G extends THREE.BufferGeometry, M extends Material>(
    geometry: G,
    material: M,
    position: Position,
    parent: THREE.Object3D = this.scene,
  ): THREE.Mesh<G, M> {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  box<M extends Material>(
    width: number,
    height: number,
    depth: number,
    material: M,
    position: Position,
    parent?: THREE.Object3D,
  ) {
    return this.mesh(
      new THREE.BoxGeometry(width, height, depth),
      material,
      position,
      parent,
    );
  }

  rounded<M extends Material>(
    width: number,
    height: number,
    depth: number,
    radius: number,
    material: M,
    position: Position,
    parent?: THREE.Object3D,
  ) {
    return this.mesh(
      new RoundedBoxGeometry(width, height, depth, 3, radius),
      material,
      position,
      parent,
    );
  }

  createRoom() {
    this.paint = mat(walls.beige.color, { roughness: 0.94 });
    const white = mat('#f6f4eb', { roughness: 0.55 });
    const ceiling = mat('#efeee6', { roughness: 1 });
    const frame = mat('#f7f6ee', { roughness: 0.32, metalness: 0.08 });
    this.floorMaps = {
      light: createWoodTexture('light'),
      dark: createWoodTexture('dark'),
      tile: createTileTexture(),
    };
    Object.values(this.floorMaps).forEach((texture) =>
      texture.repeat.set(1, 2),
    );
    this.floorMaterial = mat('#ffffff', {
      map: this.floorMaps.light,
      roughness: 0.7,
    });
    this.floor = this.mesh(
      new THREE.PlaneGeometry(2.8, 5),
      this.floorMaterial,
      [0, 0, 0],
    );
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.castShadow = false;
    // The left and far walls have physical openings, not painted window overlays.
    this.box(0.14, 2.8, 5, this.paint, [1.47, 1.4, 0]);
    this.box(2.8, 0.85, 0.14, this.paint, [0, 0.425, -2.57]);
    this.box(2.8, 0.15, 0.14, this.paint, [0, 2.725, -2.57]);
    this.box(0.15, 2.8, 0.14, this.paint, [-1.325, 1.4, -2.57]);
    this.box(0.15, 2.8, 0.14, this.paint, [1.325, 1.4, -2.57]);
    this.box(0.14, 0.85, 5, this.paint, [-1.47, 0.425, 0]);
    this.box(0.14, 0.15, 5, this.paint, [-1.47, 2.725, 0]);
    this.box(2.94, 0.12, 5.1, ceiling, [0, 2.86, 0]);
    this.box(2.8, 0.075, 0.035, white, [0, 0.038, -2.48]);
    this.box(0.035, 0.075, 5, white, [1.385, 0.038, 0]);
    this.box(0.035, 0.075, 5, white, [-1.385, 0.038, 0]);
    this.box(2.62, 0.045, 0.18, white, [0, 0.855, -2.5]);
    this.box(0.18, 0.045, 5, white, [-1.42, 0.855, 0]);
    const glass = new THREE.MeshStandardMaterial({
      color: '#cce3e8',
      roughness: 0.1,
      metalness: 0.03,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const backGlass = this.mesh(
      new THREE.PlaneGeometry(2.5, 1.78),
      glass,
      [0, 1.75, -2.545],
    );
    backGlass.castShadow = false;
    const leftGlass = this.mesh(
      new THREE.PlaneGeometry(4.98, 1.78),
      glass,
      [-1.455, 1.75, 0],
    );
    leftGlass.rotation.y = Math.PI / 2;
    leftGlass.castShadow = false;
    for (const x of [-1.25, 0, 1.25])
      this.box(0.055, 1.8, 0.075, frame, [x, 1.75, -2.49]);
    for (const y of [0.875, 2.625])
      this.box(2.55, 0.055, 0.075, frame, [0, y, -2.49]);
    for (const z of [-2.45, -1.225, 0, 1.225, 2.45])
      this.box(0.075, 1.8, 0.055, frame, [-1.405, 1.75, z]);
    for (const y of [0.875, 2.625])
      this.box(0.075, 0.055, 4.95, frame, [-1.405, y, 0]);
    const handle = mat('#9ba6a0', { metalness: 0.5, roughness: 0.4 });
    this.box(0.018, 0.11, 0.025, handle, [0.07, 1.65, -2.43]);
    for (const z of [-1.14, 0.08, 1.3])
      this.box(0.025, 0.11, 0.018, handle, [-1.35, 1.65, z]);
  }

  createFurniture() {
    const woodMap = createWoodTexture('light');
    woodMap.repeat.set(0.35, 0.5);
    const wood = mat('#f4e6c8', { map: woodMap, roughness: 0.7 });
    this.fabric = createFabricTexture();
    this.fabric.repeat.set(8, 8);
    const cushion = mat('#83917a', { map: this.fabric, roughness: 1 });
    const pillow = mat('#e4dcc6', { map: this.fabric, roughness: 1 });
    // A grounded cabinet bench: two cabinet doors, a recessed plinth and soft seat.
    this.rounded(0.59, 0.39, 1.8, 0.015, wood, [1.04, 0.25, -0.65]);
    this.box(0.48, 0.055, 1.68, mat('#7b6c53'), [1.04, 0.045, -0.65]);
    this.box(0.006, 0.31, 0.012, mat('#9b896d'), [0.741, 0.25, -0.65]);
    this.rounded(0.57, 0.09, 1.76, 0.035, cushion, [1.03, 0.49, -0.65]);
    const pillowMesh = this.rounded(
      0.35,
      0.11,
      0.41,
      0.04,
      pillow,
      [1.02, 0.59, -1.18],
    );
    pillowMesh.rotation.y = 0.15;
    const table = this.mesh(
      new THREE.CylinderGeometry(0.29, 0.29, 0.04, 48),
      wood,
      [-0.36, 0.56, -1.35],
    );
    table.receiveShadow = true;
    this.mesh(
      new THREE.CylinderGeometry(0.035, 0.05, 0.51, 24),
      wood,
      [-0.36, 0.285, -1.35],
    );
    this.mesh(
      new THREE.CylinderGeometry(0.17, 0.19, 0.025, 40),
      wood,
      [-0.36, 0.02, -1.35],
    );
    const book = this.box(
      0.17,
      0.016,
      0.12,
      mat('#657b69'),
      [-0.42, 0.592, -1.32],
    );
    book.rotation.y = -0.25;
    this.box(
      0.16,
      0.008,
      0.115,
      mat('#e9e1cd'),
      [-0.42, 0.581, -1.32],
    ).rotation.y = -0.25;
    const porcelain = mat('#f6f0e3', { roughness: 0.28 });
    this.mesh(
      new THREE.CylinderGeometry(0.037, 0.03, 0.06, 28),
      porcelain,
      [-0.25, 0.61, -1.4],
    );
    const coffee = this.mesh(
      new THREE.CircleGeometry(0.031, 24),
      mat('#6d4630'),
      [-0.25, 0.641, -1.4],
    );
    coffee.rotation.x = -Math.PI / 2;
    const cupHandle = this.mesh(
      new THREE.TorusGeometry(0.022, 0.007, 8, 20),
      porcelain,
      [-0.206, 0.616, -1.4],
    );
    cupHandle.rotation.y = Math.PI / 2;
    this.createPlant(0.91, -2.1);
    const frame = mat('#9c8159');
    this.box(0.035, 0.64, 0.48, frame, [1.386, 1.65, -0.62]);
    const art = this.mesh(
      new THREE.PlaneGeometry(0.42, 0.58),
      mat('#ffffff', { map: createArtTexture(), roughness: 1 }),
      [1.362, 1.65, -0.62],
    );
    art.rotation.y = -Math.PI / 2;
    this.rugMaterial = mat('#ffffff', {
      map: createRugTexture(),
      roughness: 1,
      side: THREE.DoubleSide,
    });
    this.rug = this.mesh(
      new THREE.PlaneGeometry(1.12, 2.0),
      this.rugMaterial,
      [-0.27, 0.006, 0.55],
    );
    this.rug.rotation.x = -Math.PI / 2;
    this.rug.castShadow = false;
    this.rug.visible = false;
  }

  createPlant(x: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    this.scene.add(group);
    const terracotta = mat('#b87852', { roughness: 0.92 });
    this.mesh(
      new THREE.CylinderGeometry(0.155, 0.115, 0.32, 40),
      terracotta,
      [0, 0.17, 0],
      group,
    );
    const rim = this.mesh(
      new THREE.TorusGeometry(0.151, 0.012, 10, 40),
      terracotta,
      [0, 0.33, 0],
      group,
    );
    rim.rotation.x = Math.PI / 2;
    const soil = this.mesh(
      new THREE.CircleGeometry(0.144, 32),
      mat('#3d3328'),
      [0, 0.329, 0],
      group,
    );
    soil.rotation.x = -Math.PI / 2;
    const stemMaterial = mat('#516341');
    const leaves = [
      mat('#4c683f', { side: THREE.DoubleSide }),
      mat('#668452', { side: THREE.DoubleSide }),
      mat('#75915c', { side: THREE.DoubleSide }),
    ];
    for (let i = 0; i < 11; i++) {
      const angle = i * 2.4;
      const height = 0.66 + (i % 4) * 0.16;
      const spread = 0.18 + (i % 3) * 0.025;
      const start = new THREE.Vector3(0, 0.33, 0);
      const tip = new THREE.Vector3(
        Math.cos(angle) * spread,
        height,
        Math.sin(angle) * spread,
      );
      const curve = new THREE.CatmullRomCurve3([
        start,
        new THREE.Vector3(tip.x * 0.2, height * 0.78, tip.z * 0.2),
        tip,
      ]);
      this.mesh(
        new THREE.TubeGeometry(curve, 10, 0.004, 5, false),
        stemMaterial,
        [0, 0, 0],
        group,
      );
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(-0.13, 0.15, 0, 0.36);
      shape.quadraticCurveTo(0.13, 0.15, 0, 0);
      const geometry = new THREE.ShapeGeometry(shape, 10);
      const positions = geometry.attributes.position;
      for (let v = 0; v < positions.count; v++)
        positions.setZ(
          v,
          Math.sin((positions.getY(v) / 0.36) * Math.PI) * 0.035,
        );
      geometry.computeVertexNormals();
      const leaf = this.mesh(
        geometry,
        leaves[i % leaves.length],
        tip.toArray(),
        group,
      );
      leaf.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(
          Math.cos(angle) * 0.8,
          0.5,
          Math.sin(angle) * 0.8,
        ).normalize(),
      );
      leaf.rotateY(angle * 0.3);
    }
  }

  createCurtains() {
    this.curtains = {} as Record<WindowSide, CurtainObject>;
    const rodMaterial = mat('#7d7764', { roughness: 0.4, metalness: 0.55 });
    for (const [side, width] of [
      ['back', 2.61],
      ['left', 4.98],
    ] as const) {
      const group = new THREE.Group();
      if (side === 'back') group.position.set(0, 0, -2.32);
      else {
        group.position.set(-1.27, 0, 0);
        group.rotation.y = Math.PI / 2;
      }
      const rod = this.mesh(
        new THREE.CylinderGeometry(0.014, 0.014, width + 0.08, 16),
        rodMaterial,
        [0, 2.655, 0],
        group,
      );
      rod.rotation.z = Math.PI / 2;
      const material = mat(curtainColors.linen.color, {
        map: this.fabric,
        roughness: 1,
        side: THREE.DoubleSide,
      });
      const panels = [-1, 1].map(() => {
        const panel = this.mesh(
          new THREE.PlaneGeometry(1, 1),
          material,
          [0, 0, 0],
          group,
        );
        // Fine pleats cast shadows on the room, without self-shadow aliasing.
        panel.receiveShadow = false;
        return panel;
      });
      this.scene.add(group);
      this.curtains[side] = { group, material, panels, width, signature: '' };
    }
  }

  updateCurtain(side: WindowSide, settings: CurtainSettings) {
    const curtain = this.curtains[side];
    curtain.group.visible = settings.enabled;
    curtain.material.color.set(curtainColors[settings.color].color);
    const signature = `${settings.open}-${settings.length}`;
    if (curtain.signature === signature) return;
    curtain.signature = signature;
    const dimensions = curtainDimensions(settings, curtain.width);
    curtain.panels.forEach((panel, index) => {
      panel.geometry.dispose();
      const geometry = new THREE.PlaneGeometry(
        dimensions.panelWidth,
        dimensions.height,
        72,
        12,
      );
      const positions = geometry.attributes.position;
      for (let vertex = 0; vertex < positions.count; vertex++) {
        const u = positions.getX(vertex) / dimensions.panelWidth + 0.5;
        const v = positions.getY(vertex) / dimensions.height + 0.5;
        positions.setZ(
          vertex,
          Math.sin(u * Math.PI * 16) * 0.028 + (1 - v) * 0.008,
        );
        positions.setY(
          vertex,
          positions.getY(vertex) + (1 - v) * Math.sin(u * Math.PI * 16) * 0.007,
        );
      }
      geometry.computeVertexNormals();
      panel.geometry = geometry;
      panel.position.set(
        (index ? 1 : -1) * (curtain.width / 2 - dimensions.panelWidth / 2),
        2.62 - dimensions.height / 2,
        0,
      );
    });
  }

  createLighting() {
    this.hemisphere = new THREE.HemisphereLight('#e5f0fc', '#b9aa89', 1.3);
    this.scene.add(this.hemisphere);
    this.sun = new THREE.DirectionalLight('#fff1d7', 3.4);
    this.sun.position.set(-5, 4.2, 2.5);
    this.sun.target.position.set(0.2, 0.1, -0.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, {
      left: -4,
      right: 4,
      top: 5,
      bottom: -4,
      near: 0.5,
      far: 16,
    });
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.025;
    this.scene.add(this.sun, this.sun.target);
    this.lamp = new THREE.Group();
    this.lamp.position.set(0.15, 0, -0.7);
    const metal = mat('#53614e', { metalness: 0.22, roughness: 0.45 });
    this.mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.025, 24),
      metal,
      [0, 2.78, 0],
      this.lamp,
    );
    this.mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.43, 8),
      mat('#343d32'),
      [0, 2.55, 0],
      this.lamp,
    );
    this.mesh(
      new THREE.CylinderGeometry(0.09, 0.205, 0.18, 48, 1, true),
      metal,
      [0, 2.245, 0],
      this.lamp,
    );
    this.bulbMaterial = mat('#fff0d5', {
      emissive: '#ffd5a0',
      emissiveIntensity: 1,
    });
    const bulb = this.mesh(
      new THREE.CircleGeometry(0.196, 48),
      this.bulbMaterial,
      [0, 2.155, 0],
      this.lamp,
    );
    bulb.rotation.x = Math.PI / 2;
    bulb.castShadow = false;
    this.scene.add(this.lamp);
    this.spot = new THREE.SpotLight('#ffd5a0', 45, 10, Math.PI * 0.36, 0.65, 2);
    this.spot.position.set(0.15, 2.12, -0.7);
    this.spot.target.position.set(0.05, 0, -0.55);
    this.spot.castShadow = true;
    this.spot.shadow.mapSize.set(1024, 1024);
    this.spot.shadow.bias = -0.0003;
    this.spot.shadow.normalBias = 0.02;
    this.scene.add(this.spot, this.spot.target);
    this.point = new THREE.PointLight('#ffd5a0', 5, 7, 2);
    this.point.position.set(0.15, 2.12, -0.7);
    this.scene.add(this.point);
    this.bounce = new THREE.AmbientLight('#ffd5a0', 0);
    this.scene.add(this.bounce);
  }

  createOutdoors() {
    this.outdoorMaterials = [];
    this.windowMaterials = [];
    const palette = ['#9eafb4', '#b4c0bf', '#aab6b9', '#c3cbc6'];
    for (let i = 0; i < 14; i++) {
      const back = i < 7;
      const k = i % 7;
      const width = 0.85 + (k % 3) * 0.3;
      const height = 2.4 + (k % 4) * 0.8;
      const material = new THREE.MeshBasicMaterial({
        color: palette[i % palette.length],
      });
      this.outdoorMaterials.push({
        material,
        day: palette[i % palette.length],
      });
      const building = this.box(
        width,
        height,
        1,
        material,
        back
          ? [-5 + k * 1.65, height / 2 - 3, -7 - (k % 2)]
          : [-6 - (k % 2), height / 2 - 3, -4.5 + k * 1.7],
      );
      building.castShadow = false;
      const windows = new THREE.MeshBasicMaterial({ color: '#dbe4df' });
      this.windowMaterials.push(windows);
      for (let row = 0; row < 5; row++)
        for (let column = 0; column < 3; column++) {
          if ((row * 3 + column + i) % 4 === 0) continue;
          const window = this.mesh(
            new THREE.PlaneGeometry(0.09, 0.14),
            windows,
            back
              ? [
                  building.position.x + (column - 1) * 0.23,
                  -2.45 + row * 0.37,
                  building.position.z + 0.51,
                ]
              : [
                  building.position.x + width / 2 + 0.01,
                  -2.45 + row * 0.37,
                  building.position.z + (column - 1) * 0.23,
                ],
          );
          if (!back) window.rotation.y = Math.PI / 2;
          window.castShadow = false;
        }
    }
    const foliage = new THREE.MeshBasicMaterial({ color: '#8fa283' });
    this.outdoorMaterials.push({ material: foliage, day: '#8fa283' });
    for (let i = 0; i < 14; i++)
      this.mesh(
        new THREE.SphereGeometry(0.5 + (i % 3) * 0.16, 10, 8),
        foliage,
        [-4 + (i % 7) * 1.5, -1.8, i < 7 ? -4.5 : 3.2],
      );
  }

  update(state: RoomState) {
    this.paint.color.set(walls[state.wall].color);
    if (this.lastFloor !== state.floor) {
      this.floorMaterial.map = this.floorMaps[state.floor];
      this.floorMaterial.roughness = state.floor === 'tile' ? 0.78 : 0.67;
      this.floorMaterial.needsUpdate = true;
      this.lastFloor = state.floor;
    }
    for (const side of ['left', 'back'] as const)
      this.updateCurtain(side, state.curtains[side]);
    this.rug.visible = state.rug.enabled;
    if (this.lastRug !== state.rug.color) {
      this.rugMaterial.map?.dispose();
      this.rugMaterial.map = createRugTexture(rugColors[state.rug.color].color);
      this.rugMaterial.needsUpdate = true;
      this.lastRug = state.rug.color;
    }
    const light = lightingParameters(state);
    (this.scene.background as THREE.Color).set(light.sky);
    this.hemisphere.intensity = light.ambient;
    this.hemisphere.color.set(light.night ? '#8198cc' : '#e5f0fc');
    this.hemisphere.groundColor.set(light.night ? '#303347' : '#b9aa89');
    this.sun.intensity = light.sunlight;
    this.spot.color.set(light.color);
    this.point.color.set(light.color);
    this.spot.intensity = light.spot;
    this.point.intensity = light.point;
    this.bounce.color.set(light.color);
    this.bounce.intensity =
      light.night && light.on ? (state.lighting.brightness / 100) * 0.2 : 0;
    this.lamp.visible = state.lighting.enabled;
    this.bulbMaterial.emissive.set(light.color);
    this.bulbMaterial.emissiveIntensity = light.on ? 1.6 : 0;
    this.outdoorMaterials.forEach(({ material, day }) =>
      material.color.set(light.night ? '#172437' : day),
    );
    this.windowMaterials.forEach((material) =>
      material.color.set(light.night ? '#dfba72' : '#dbe4df'),
    );
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.needsUpdate = true;
    this.container.dataset.renderStatus = 'ready';
    this.container.dataset.wall = state.wall;
    this.container.dataset.floor = state.floor;
    this.container.dataset.period = state.period;
    this.container.dataset.rug = String(state.rug.enabled);
    this.container.dataset.curtains = (['left', 'back'] as const)
      .filter((side) => state.curtains[side].enabled)
      .join(' ');
    this.resize();
  }

  setView(view: CameraView) {
    const views: Record<CameraView, { camera: Position; target: Position }> = {
      wide: { camera: [0.35, 1.88, 3.75], target: [0, 1.24, -0.55] },
      detail: { camera: [0.55, 1.72, 2.65], target: [0.05, 1.1, -1.08] },
      window: { camera: [1.04, 1.8, 2.9], target: [-0.25, 1.25, -1.2] },
    };
    const setting = views[view] ?? views.wide;
    this.controls.target.set(...setting.target);
    this.camera.position.set(...setting.camera);
    this.camera.lookAt(this.controls.target);
    this.controls.update();
    this.render();
  }

  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    const size = this.renderer.getSize(new THREE.Vector2());
    if (size.x !== width || size.y !== height)
      this.renderer.setSize(width, height);
    this.render();
  }

  dispose() {
    this.disposed = true;
    this.observer.disconnect();
    this.controls.dispose();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>(Object.values(this.floorMaps));
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        (Array.isArray(object.material)
          ? object.material
          : [object.material]
        ).forEach((material: THREE.Material) => {
          materials.add(material);
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture) textures.add(value);
          });
        });
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    this.sun.shadow.dispose();
    this.spot.shadow.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.scene.clear();
  }

  render() {
    if (!this.disposed && this.scene && this.camera)
      this.renderer.render(this.scene, this.camera);
  }
}
