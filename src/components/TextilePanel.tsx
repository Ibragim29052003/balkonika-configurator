import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  curtainChanged,
  curtainsAppliedToAll,
  rugToggled,
  rugColorChanged,
} from '../store/roomSlice';
import { curtainColors, rugColors, describeCurtains } from '../state';
import type { CurtainColor, RugColor, WindowSide } from '../types';
import { Toggle, Range, Segmented } from './Controls';
import { CustomSelect } from './CustomSelect';
const fabrics = (Object.keys(curtainColors) as CurtainColor[]).map((value) => ({
  value,
  ...curtainColors[value],
}));
const rugs = (Object.keys(rugColors) as RugColor[]).map((value) => ({
  value,
  ...rugColors[value],
}));
export function TextilePanel() {
  const room = useAppSelector((state) => state.room);
  const dispatch = useAppDispatch();
  const [side, setSide] = useState<WindowSide>('left');
  const curtain = room.curtains[side];
  const change = (changes: Partial<typeof curtain>) =>
    dispatch(curtainChanged({ side, changes }));
  return (
    <>
      <div className="section-heading">
        <h3>Шторы</h3>
        <button
          type="button"
          className="text-button"
          onClick={() => dispatch(curtainsAppliedToAll(side))}
        >
          На все окна <span aria-hidden="true">↗</span>
        </button>
      </div>
      <p className="section-copy">
        Настройте каждую сторону отдельно или примените выбранную ткань ко всем
        окнам.
      </p>
      <div
        className="segmented window-tabs"
        role="group"
        aria-label="Какие окна настроить"
      >
        {(['left', 'back'] as const).map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={side === value}
            className={side === value ? 'active' : ''}
            onClick={() => setSide(value)}
          >
            {value === 'left' ? 'Левая сторона' : 'Дальнее окно'}
          </button>
        ))}
      </div>
      <Toggle
        label={side === 'left' ? 'Шторы слева' : 'Шторы на дальнем окне'}
        checked={curtain.enabled}
        onChange={(enabled) => change({ enabled })}
      />
      {curtain.enabled && (
        <fieldset className="curtain-controls">
          <legend className="sr-only">Параметры выбранных штор</legend>
          <Segmented
            name="curtainOpen"
            value={curtain.open ? 'open' : 'closed'}
            options={[
              { value: 'open', label: 'Открыты' },
              { value: 'closed', label: 'Закрыты' },
            ]}
            onChange={(value) => change({ open: value === 'open' })}
          />
          <CustomSelect
            key={side}
            label="Цвет ткани"
            value={curtain.color}
            options={fabrics}
            onChange={(color) => change({ color })}
          />
          <Range
            label="Длина штор"
            value={curtain.length}
            min={120}
            max={260}
            step={10}
            unit="см"
            onChange={(length) => change({ length })}
          />
        </fieldset>
      )}
      <div className="rug-section">
        <Toggle
          label="Добавить ковёр"
          hint="Немного тепла под ногами"
          checked={room.rug.enabled}
          onChange={(value) => dispatch(rugToggled(value))}
        />
        {room.rug.enabled && (
          <CustomSelect
            label="Цвет ковра"
            value={room.rug.color}
            options={rugs}
            onChange={(value) => dispatch(rugColorChanged(value))}
          />
        )}
      </div>
      <p className="panel-note" role="status" aria-live="polite">
        {describeCurtains(room)}
      </p>
    </>
  );
}
