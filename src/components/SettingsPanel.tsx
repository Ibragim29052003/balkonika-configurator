import { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { roomReset } from '../store/roomSlice';
import { describeSelection } from '../materials';
import { FinishPanel } from './FinishPanel';
import { TextilePanel } from './TextilePanel';
import { LightingPanel } from './LightingPanel';
const tabs = [
  {
    id: 'finishes',
    label: 'Отделка',
    hint: 'Стены и пол',
    icon: 'M4 4h16v16H4zM4 12h16M12 4v16',
  },
  {
    id: 'textiles',
    label: 'Текстиль',
    hint: 'Шторы и ковёр',
    icon: 'M3 4h18M5 4v16l3-2 4 2V4m0 16 4-2 3 2V4',
  },
  {
    id: 'lighting',
    label: 'Свет',
    hint: 'День и вечер',
    icon: 'M12 3v4M8 7h8l4 10H4L8 7Zm4 10v4M8 21h8',
  },
] as const;
type TabId = (typeof tabs)[number]['id'];
export function SettingsPanel({ onReset }: { onReset(): void }) {
  const [tab, setTab] = useState<TabId>('finishes');
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const dispatch = useAppDispatch();
  const room = useAppSelector((state) => state.room);
  return (
    <aside className="settings" id="settings" aria-label="Настройки интерьера">
      <div className="settings-top">
        <div>
          <p className="eyebrow">СТУДИЯ БАЛКОНИКА</p>
          <h2>Почувствуйте разницу</h2>
        </div>
      </div>
      <p className="tabs-hint" id="settings-tabs-hint">
        Выберите, что настроить
      </p>
      <div
        className="tabs"
        role="tablist"
        aria-label="Разделы настроек"
        aria-describedby="settings-tabs-hint"
      >
        {tabs.map((item, index) => (
          <button
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-controls={`panel-${item.id}`}
            aria-labelledby={`tab-label-${item.id}`}
            aria-describedby={`tab-hint-${item.id}`}
            aria-selected={tab === item.id}
            tabIndex={tab === item.id ? 0 : -1}
            key={item.id}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => {
              if (
                !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? tabs.length - 1
                    : (index +
                        (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) %
                      tabs.length;
              setTab(tabs[next].id);
              refs.current[next]?.focus({ preventScroll: true });
            }}
          >
            <span className="tab-heading">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d={item.icon}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span id={`tab-label-${item.id}`}>{item.label}</span>
            </span>
            <span className="tab-hint" id={`tab-hint-${item.id}`}>
              {item.hint}
            </span>
          </button>
        ))}
      </div>
      <form
        id="finishes"
        aria-label="Конструктор интерьера"
        onSubmit={(event) => event.preventDefault()}
        onReset={(event) => {
          event.preventDefault();
          dispatch(roomReset());
          onReset();
        }}
      >
        {tabs.map((item) => (
          <div
            key={item.id}
            className="tab-panel"
            role="tabpanel"
            id={`panel-${item.id}`}
            aria-labelledby={`tab-${item.id}`}
            hidden={tab !== item.id}
          >
            {item.id === 'finishes' ? (
              <FinishPanel />
            ) : item.id === 'textiles' ? (
              <TextilePanel />
            ) : (
              <LightingPanel />
            )}
          </div>
        ))}
        <div className="selection">
          <span className="selection-label">ВАШЕ СОЧЕТАНИЕ</span>
          <p
            id="selection-summary"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {describeSelection(room)}
          </p>
        </div>
        <button type="reset" className="reset">
          <svg viewBox="0 0 20 20" aria-hidden="true" fill="none">
            <path
              d="M4 7a6 6 0 1 1-.1 5M4 3v4h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Сбросить оформление<span aria-hidden="true">↺</span>
        </button>
      </form>
    </aside>
  );
}
