import * as THREE from 'three';

// All colour maps are drawn locally. Seeded variation keeps the room stable
// between renders and avoids external image requests or licensed materials.
function randomGenerator(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function rgb(red, green, blue) {
  return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
}

function makeTexture(size, draw, repeat = true) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  draw(context, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  return texture;
}

function addFineVariation(context, size, random, strength = 1.5) {
  const image = context.getImageData(0, 0, size, size);
  for (let index = 0; index < image.data.length; index += 4) {
    const variation = (random() - 0.5) * strength * 2;
    image.data[index] += variation;
    image.data[index + 1] += variation;
    image.data[index + 2] += variation;
  }
  context.putImageData(image, 0, 0);
}

export function createWoodTexture(tone = 'light') {
  const dark = tone === 'dark';
  const random = randomGenerator(dark ? 8321 : 1937);
  const base = dark ? [119, 87, 61] : [202, 175, 134];

  return makeTexture(1024, (context, size) => {
    const width = size / 14;
    const length = size / 2;

    for (let column = 0; column < 14; column += 1) {
      const x = column * width;
      const offset = (column % 3) * length / 3;
      const tones = [random() * 9 - 4.5, random() * 9 - 4.5];
      context.save();
      context.beginPath();
      context.rect(x, 0, width, size);
      context.clip();

      // Two alternating board lengths join seamlessly at the texture boundary.
      for (let row = 0; row < 3; row += 1) {
        const y = row * length - offset;
        const variation = tones[row % 2];
        context.fillStyle = rgb(...base.map(channel => channel + variation));
        context.fillRect(x, y, width, length);
        context.fillStyle = dark ? 'rgba(40, 29, 20, 0.23)' : 'rgba(102, 75, 45, 0.20)';
        context.fillRect(x, y, width, 1.4);
        context.fillStyle = 'rgba(255, 244, 220, 0.10)';
        context.fillRect(x, y + 1.4, width, 1);
      }

      // Long flowing fibres rather than repeated high-contrast stripes.
      for (let fibre = 0; fibre < 95; fibre += 1) {
        const center = x + random() * width;
        const phase = random() * Math.PI * 2;
        const amplitude = 0.5 + random() * 2.4;
        const light = fibre % 4 === 0;
        context.strokeStyle = light
          ? `rgba(255, 239, 209, ${0.025 + random() * 0.045})`
          : `rgba(${dark ? '43, 29, 18' : '105, 73, 42'}, ${0.025 + random() * 0.055})`;
        context.lineWidth = 0.35 + random() * 0.65;
        context.beginPath();
        for (let y = 0; y <= size; y += 16) {
          const wave = Math.sin(y / size * Math.PI * 2 + phase) * amplitude
            + Math.sin(y / size * Math.PI * 6 + phase) * amplitude * 0.3;
          if (y === 0) context.moveTo(center + wave, y);
          else context.lineTo(center + wave, y);
        }
        context.stroke();
      }

      // Sparse elongated knots stay soft enough not to dominate the floor.
      if (column % 3 === 1) {
        const centerX = x + width * (0.3 + random() * 0.4);
        const centerY = 180 + random() * 650;
        for (let ring = 1; ring <= 4; ring += 1) {
          context.strokeStyle = `rgba(${dark ? '48, 32, 20' : '113, 79, 44'}, ${0.035 - ring * 0.004})`;
          context.lineWidth = 0.8;
          context.beginPath();
          context.ellipse(centerX, centerY, 2 + ring * 1.1, 8 + ring * 5, -0.035, 0, Math.PI * 2);
          context.stroke();
        }
      }

      context.fillStyle = dark ? 'rgba(42, 29, 20, 0.25)' : 'rgba(111, 82, 48, 0.20)';
      context.fillRect(x, 0, 1.2, size);
      context.fillStyle = 'rgba(255, 247, 227, 0.11)';
      context.fillRect(x + 1.2, 0, 1, size);
      context.restore();
    }
    addFineVariation(context, size, random, 1.15);
  });
}

export function createFabricTexture() {
  const random = randomGenerator(2571);
  return makeTexture(256, (context, size) => {
    context.fillStyle = '#faf9f4';
    context.fillRect(0, 0, size, size);
    for (let index = 0; index < size; index += 2) {
      const opacity = 0.025 + random() * 0.035;
      context.fillStyle = `rgba(94, 91, 79, ${opacity})`;
      context.fillRect(index, 0, 0.7, size);
      context.fillStyle = `rgba(94, 91, 79, ${opacity * 0.7})`;
      context.fillRect(0, index, size, 0.6);
      context.fillStyle = 'rgba(255, 255, 255, 0.35)';
      context.fillRect(index + 0.9, 0, 0.5, size);
    }
    addFineVariation(context, size, random, 0.8);
  });
}

export function createRugTexture(color = '#c7b393') {
  const random = randomGenerator(6409);
  return makeTexture(512, (context, size) => {
    context.fillStyle = color;
    context.fillRect(0, 0, size, size);

    for (let thread = 0; thread < size; thread += 2) {
      context.fillStyle = `rgba(255, 251, 233, ${0.07 + random() * 0.07})`;
      context.fillRect(thread, 0, 0.9, size);
      context.fillStyle = `rgba(54, 45, 32, ${0.035 + random() * 0.025})`;
      context.fillRect(0, thread, size, 0.75);
    }

    context.strokeStyle = 'rgba(68, 57, 40, 0.18)';
    context.lineWidth = 2;
    context.strokeRect(22, 22, size - 44, size - 44);
    context.lineWidth = 1;
    context.strokeRect(31, 31, size - 62, size - 62);
    context.strokeStyle = 'rgba(255, 247, 224, 0.22)';
    context.lineWidth = 3;
    context.strokeRect(26, 26, size - 52, size - 52);

    for (let row = 64; row < size - 55; row += 48) {
      context.strokeStyle = 'rgba(67, 56, 39, 0.055)';
      context.lineWidth = 1.3;
      context.beginPath();
      for (let x = 52; x < size - 50; x += 24) {
        context.moveTo(x, row);
        context.lineTo(x + 7, row + 6);
        context.lineTo(x + 14, row);
      }
      context.stroke();
    }
    addFineVariation(context, size, random, 1.1);
  }, false);
}

function drawLeaf(context, x, y, angle, length, width, color) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, 0);
  context.quadraticCurveTo(length * 0.45, -width, length, 0);
  context.quadraticCurveTo(length * 0.45, width * 0.75, 0, 0);
  context.fill();
  context.restore();
}

export function createArtTexture() {
  const random = randomGenerator(9031);
  return makeTexture(512, (context, size) => {
    context.fillStyle = '#f0ecdf';
    context.fillRect(0, 0, size, size);
    context.fillStyle = '#d8b99d';
    context.beginPath();
    context.arc(329, 158, 74, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#e4dfcc';
    context.beginPath();
    context.ellipse(236, 405, 135, 21, 0, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = '#65755c';
    context.lineWidth = 4;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(232, 409);
    context.bezierCurveTo(237, 299, 254, 223, 298, 115);
    context.stroke();
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(244, 332);
    context.quadraticCurveTo(201, 279, 165, 235);
    context.moveTo(256, 277);
    context.quadraticCurveTo(300, 266, 346, 242);
    context.stroke();

    const leaves = [
      [242, 355, -2.5, 83, 25, '#8d9c7b'],
      [247, 323, -0.6, 91, 27, '#71866b'],
      [255, 280, -2.1, 78, 23, '#849576'],
      [266, 243, -0.55, 86, 25, '#536f58'],
      [278, 199, -2.0, 66, 21, '#8f9f7e'],
      [291, 154, -1.2, 56, 17, '#657d61'],
      [194, 275, -2.4, 55, 19, '#789070'],
      [319, 256, -0.8, 58, 18, '#8e9d7e'],
    ];
    for (const leaf of leaves) drawLeaf(context, ...leaf);
    addFineVariation(context, size, random, 1);
  }, false);
}

export function createTileTexture() {
  const random = randomGenerator(7219);
  return makeTexture(512, (context, size) => {
    const width = size / 4;
    context.fillStyle = '#d5d7d1';
    context.fillRect(0, 0, size, size);

    for (let column = 0; column < 4; column += 1) {
      for (let row = 0; row < 4; row += 1) {
        const x = column * width;
        const y = row * width;
        const variation = random() * 8 - 4;
        context.fillStyle = rgb(173 + variation, 177 + variation, 170 + variation);
        context.fillRect(x + 1.4, y + 1.4, width - 2.8, width - 2.8);
        const cloud = context.createRadialGradient(x + width * 0.2, y + width * 0.3, 0, x + width * 0.5, y + width * 0.5, width * 0.85);
        cloud.addColorStop(0, 'rgba(255, 255, 246, 0.065)');
        cloud.addColorStop(1, 'rgba(255, 255, 246, 0)');
        context.fillStyle = cloud;
        context.fillRect(x + 1.4, y + 1.4, width - 2.8, width - 2.8);
      }
    }
    addFineVariation(context, size, random, 1.1);
  });
}
