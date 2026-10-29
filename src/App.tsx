import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { SceneViewport } from './components/SceneViewport';
import { SettingsPanel } from './components/SettingsPanel';
import type { CameraView } from './types';
export function App() {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<CameraView>('wide');
  return (
    <>
      <a className="skip-link" href="#settings">
        Перейти к настройкам
      </a>
      <header className="site-header shell">
        <a href="./" className="brand" aria-label="Балконика — на главную">
          <svg viewBox="0 0 36 40" aria-hidden="true" fill="none">
            <path
              d="M4 35V8l14-4 14 4v27H4ZM18 5v30M4 23h28M4 8l14 4 14-4"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            балконика<span className="brand-dot">.</span>
          </span>
        </a>
        <span className="header-label">Личная студия интерьера</span>
        <div className="header-actions">
          <span className="live-chip">
            <i />
            Интерьер в реальном времени
          </span>
          <button
            id="theme-toggle"
            className="theme-toggle"
            type="button"
            aria-label={`Включить ${theme === 'dark' ? 'светлую' : 'тёмную'} тему интерфейса`}
            aria-pressed={theme === 'dark'}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            onClick={toggleTheme}
          >
            <svg
              className="moon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M20 14.4A8.5 8.5 0 0 1 9.6 4 8.5 8.5 0 1 0 20 14.4Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              className="sun"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="4"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>
      <main className="shell">
        <div className="intro">
          <div>
            <p className="eyebrow">МАЛЕНЬКОЕ ПРОСТРАНСТВО. ВАШ БОЛЬШОЙ МИР.</p>
            <h1>
              Создайте <em>своё место.</em>
            </h1>
          </div>
          <p className="intro-text">
            Натуральные фактуры, мягкий текстиль и правильный свет.
            <br /> Посмотрите, как всё сочетается в вашем балконе.
          </p>
        </div>
        <div className="studio" id="configurator">
          <SceneViewport view={view} onViewChange={setView} />
          <SettingsPanel onReset={() => setView('wide')} />
        </div>
        <div className="under-studio">
          <span>
            <i aria-hidden="true">✧</i>Пространство меняется. Уют остаётся
            вашим.
          </span>
          <p>
            Визуализация помогает выбрать сочетание. Реальные оттенки и размеры
            могут отличаться.
          </p>
        </div>
      </main>
      <footer className="shell site-footer">
        <span>
          Балконика <i>/</i> Пространство для жизни
        </span>
        <span>Создавайте. Примеряйте. Чувствуйте себя дома.</span>
      </footer>
    </>
  );
}
