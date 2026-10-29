export const walls = Object.freeze({
  white: Object.freeze({ color: '#f3f1e9', description: 'белые', interior: 'белыми' }),
  beige: Object.freeze({ color: '#e8ddc8', description: 'бежевые', interior: 'бежевыми' }),
  gray: Object.freeze({ color: '#cdd2ce', description: 'светло-серые', interior: 'светло-серыми' }),
});

export const floors = Object.freeze({
  light: Object.freeze({ color: '#c5a479', line: '#795b3b', description: 'светлое дерево', interior: 'светлым деревянным полом' }),
  dark: Object.freeze({ color: '#786047', line: '#35291e', description: 'тёмное дерево', interior: 'тёмным деревянным полом' }),
  tile: Object.freeze({ color: '#b6b9b3', line: '#e5e5dd', description: 'серая плитка', interior: 'серой плиткой на полу' }),
});

export const initialSelection = Object.freeze({ wall: 'beige', floor: 'light' });

export function selectMaterial(selection, surface, value) {
  const options = surface === 'wall' ? walls : surface === 'floor' ? floors : null;
  if (!options || !Object.hasOwn(options, value)) return selection;
  return { ...selection, [surface]: value };
}

export function describeSelection({ wall, floor }) {
  return `Стены: ${walls[wall].description}. Пол: ${floors[floor].description}.`;
}
