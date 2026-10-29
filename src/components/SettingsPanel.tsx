import { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { roomReset } from '../store/roomSlice';
import { describeSelection } from '../materials';
import { FinishPanel } from './FinishPanel';
import { TextilePanel } from './TextilePanel';
import { LightingPanel } from './LightingPanel';
const tabs = [
  { id: 'finishes', label: 'Отделка' },
  { id: 'textiles', label: 'Текстиль' },
  { id: 'lighting', label: 'Свет' },
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
        <span className="settings-count" aria-hidden="true">
          01—03
        </span>
      </div>
      <div className="tabs" role="tablist" aria-label="Разделы настроек">
        {tabs.map((item, index) => (
          <button
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-controls={`panel-${item.id}`}
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
            {item.label}
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
