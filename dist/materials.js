export const walls = Object.freeze({
  white: Object.freeze({ color: '#f3f1e9', description: 'белые' }),
  beige: Object.freeze({ color: '#e8ddc8', description: 'бежевые' }),
  gray: Object.freeze({ color: '#cdd2ce', description: 'светло-серые' }),
});

export const floors = Object.freeze({
  light: Object.freeze({ color: '#c5a479', line: '#795b3b', description: 'светлое дерево' }),
  dark: Object.freeze({ color: '#786047', line: '#35291e', description: 'тёмное дерево' }),
  tile: Object.freeze({ color: '#b6b9b3', line: '#e5e5dd', description: 'серая плитка' }),
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
