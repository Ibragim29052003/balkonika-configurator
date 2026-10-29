import { useAppDispatch, useAppSelector } from '../store/hooks';
import { wallChanged, floorChanged } from '../store/roomSlice';
import type { Wall, Floor } from '../types';
const walls: { value: Wall; label: string }[] = [
  { value: 'white', label: 'Белый' },
  { value: 'beige', label: 'Бежевый' },
  { value: 'gray', label: 'Светло-серый' },
];
const floors: { value: Floor; label: string; hint: string; swatch: string }[] =
  [
    {
      value: 'light',
      label: 'Светлое дерево',
      hint: 'Натуральный дуб',
      swatch: 'light-wood',
    },
    {
      value: 'dark',
      label: 'Тёмное дерево',
      hint: 'Глубокий ореховый оттенок',
      swatch: 'dark-wood',
    },
    {
      value: 'tile',
      label: 'Серая плитка',
      hint: 'Лаконичный камень',
      swatch: 'gray-tile',
    },
  ];
export function FinishPanel() {
  const room = useAppSelector((state) => state.room);
  const dispatch = useAppDispatch();
  return (
    <>
      <fieldset>
        <legend>
          Цвет стен<span>Спокойная основа интерьера</span>
        </legend>
        <div className="wall-options">
          {walls.map((option) => (
            <label className="wall-option" key={option.value}>
              <input
                type="radio"
                name="wall"
                value={option.value}
                checked={room.wall === option.value}
                onChange={() => dispatch(wallChanged(option.value))}
              />
              <span className={`wall-swatch ${option.value}`}>
                <i aria-hidden="true">✓</i>
              </span>
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="floor-fieldset">
        <legend>
          Покрытие пола<span>Фактура, которая задаёт настроение</span>
        </legend>
        <div className="floor-options">
          {floors.map((option) => (
            <label className="floor-option" key={option.value}>
              <input
                type="radio"
                name="floor"
                value={option.value}
                checked={room.floor === option.value}
                onChange={() => dispatch(floorChanged(option.value))}
              />
              <span
                className={`material ${option.swatch}`}
                aria-hidden="true"
              />
              <span className="floor-name">
                {option.label}
                <small>{option.hint}</small>
              </span>
              <span className="radio-mark" aria-hidden="true" />
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
