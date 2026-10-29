import { useAppDispatch, useAppSelector } from '../store/hooks';
import { periodChanged, lightingChanged } from '../store/roomSlice';
import { temperatures } from '../state';
import type { Temperature } from '../types';
import { Toggle, Range, Segmented } from './Controls';
import { CustomSelect } from './CustomSelect';
const options = (Object.keys(temperatures) as Temperature[]).map((value) => ({
  value,
  ...temperatures[value],
}));
export function LightingPanel() {
  const room = useAppSelector((state) => state.room);
  const dispatch = useAppDispatch();
  const light = room.lighting;
  return (
    <>
      <fieldset>
        <legend>
          Время суток<span>Два настроения одного пространства</span>
        </legend>
        <Segmented
          name="period"
          value={room.period}
          options={[
            {
              value: 'day',
              label: (
                <>
                  ☀ <span>День</span>
                </>
              ),
            },
            {
              value: 'night',
              label: (
                <>
                  ☾ <span>Вечер</span>
                </>
              ),
            },
          ]}
          onChange={(value) => dispatch(periodChanged(value))}
        />
      </fieldset>
      <div className="light-section">
        <Toggle
          label="Подвесной светильник"
          checked={light.enabled}
          onChange={(enabled) => dispatch(lightingChanged({ enabled }))}
        />
        {light.enabled && (
          <fieldset>
            <legend className="sr-only">Параметры света</legend>
            <Toggle
              label="Включить свет"
              checked={light.on}
              onChange={(on) => dispatch(lightingChanged({ on }))}
            />
            <CustomSelect
              label="Температура света"
              value={light.temperature}
              options={options}
              disabled={!light.on}
              onChange={(temperature) =>
                dispatch(lightingChanged({ temperature }))
              }
            />
            <fieldset disabled={!light.on}>
              <Range
                label="Яркость"
                value={light.brightness}
                min={10}
                max={100}
                step={5}
                unit="%"
                onChange={(brightness) =>
                  dispatch(lightingChanged({ brightness }))
                }
              />
            </fieldset>
          </fieldset>
        )}
      </div>
      <p className="panel-note">
        Свет падает на поверхности и создаёт тени. Тема интерфейса на освещение
        комнаты не влияет.
      </p>
    </>
  );
}
