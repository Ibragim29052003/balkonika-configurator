import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { describeSelection } from '../materials';
import { describeCurtains } from '../state';
import type { RoomRenderer, CameraView } from '../types';
const views: { value: CameraView; label: string }[] = [
  { value: 'wide', label: 'Общий вид' },
  { value: 'detail', label: 'Ближе' },
  { value: 'window', label: 'К окнам' },
];
export function SceneViewport({
  view,
  onViewChange,
}: {
  view: CameraView;
  onViewChange(view: CameraView): void;
}) {
  const state = useAppSelector((store) => store.room);
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<RoomRenderer | null>(null);
  const stateRef = useRef(state);
  const viewRef = useRef(view);
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'fallback' | 'paused' | 'error'
  >('loading');
  const [finePointer] = useState(() => matchMedia('(pointer:fine)').matches);
  stateRef.current = state;
  viewRef.current = view;
  useEffect(() => {
    let cancelled = false;
    let renderer: RoomRenderer | null = null;
    const host = hostRef.current!;
    const start = async () => {
      try {
        if (new URLSearchParams(location.search).get('mode') === '2d')
          throw new Error('2D requested');
        const { BalconyScene } = await import('../scene');
        if (cancelled) return;
        renderer = new BalconyScene(host, (paused) => {
          if (!cancelled) setStatus(paused ? 'paused' : 'ready');
        });
        rendererRef.current = renderer;
        renderer.update(stateRef.current);
        renderer.setView(viewRef.current);
        setStatus('ready');
      } catch (error) {
        if (cancelled) return;
        if (new URLSearchParams(location.search).get('mode') !== '2d')
          console.warn('Using the lightweight illustration:', error);
        try {
          const { FallbackScene } = await import('../fallback');
          if (cancelled) return;
          host.replaceChildren();
          renderer = new FallbackScene(host);
          rendererRef.current = renderer;
          renderer.update(stateRef.current);
          setStatus('fallback');
        } catch {
          if (!cancelled) setStatus('error');
        }
      }
    };
    void start();
    return () => {
      cancelled = true;
      renderer?.dispose();
      rendererRef.current = null;
    };
  }, []);
  useEffect(() => {
    rendererRef.current?.update(state);
  }, [state]);
  useEffect(() => {
    rendererRef.current?.setView(view);
  }, [view]);
  const period =
    state.period === 'day'
      ? 'Дневной свет'
      : state.lighting.enabled && state.lighting.on
        ? 'Вечерний уют'
        : 'Ночь · свет выключен';
  return (
    <section
      className="stage"
      data-period={state.period}
      aria-label={
        status === 'fallback'
          ? 'Упрощённая визуализация балкона'
          : 'Трёхмерный интерьер балкона'
      }
    >
      <div
        id="scene-container"
        className="scene-container"
        role="img"
        aria-label={`Интерьер балкона. ${describeSelection(state)} ${state.period === 'day' ? 'День.' : 'Вечер.'} ${describeCurtains(state)} ${state.rug.enabled ? 'На полу ковёр.' : 'Без ковра.'}`}
        tabIndex={0}
        aria-describedby="scene-help"
        data-render-status={status}
        data-wall={state.wall}
        data-floor={state.floor}
        data-period={state.period}
        data-rug={state.rug.enabled}
        data-curtains={(['left', 'back'] as const)
          .filter((side) => state.curtains[side].enabled)
          .join(' ')}
        onKeyDown={(event) => {
          if (
            status !== 'fallback' &&
            ['ArrowLeft', 'ArrowRight'].includes(event.key)
          ) {
            event.preventDefault();
            const next =
              (views.findIndex((item) => item.value === view) +
                (event.key === 'ArrowRight' ? 1 : 2)) %
              3;
            onViewChange(views[next].value);
          }
        }}
      >
        <div ref={hostRef} className="render-host" />
        {['loading', 'paused', 'error'].includes(status) && (
          <div className="scene-loading" role="status">
            {status !== 'error' && <span className="loading-mark" />}
            <span>
              {status === 'loading'
                ? 'Обустраиваем ваш балкон…'
                : status === 'paused'
                  ? 'Восстанавливаем 3D-превью…'
                  : 'Не удалось загрузить превью. Обновите страницу.'}
            </span>
          </div>
        )}
      </div>
      <div className="stage-top">
        <span className="scene-badge">
          <i />
          Ваш будущий балкон
        </span>
        <span className="scene-period">{period}</span>
      </div>
      <div className="stage-bottom">
        <span className="scene-drag" id="scene-help">
          {status === 'fallback'
            ? 'Упрощённая иллюстрация · 2D'
            : finePointer
              ? 'Потяните мышью, чтобы осмотреть'
              : 'Выберите удобный ракурс'}
        </span>
        {status !== 'fallback' && (
          <div
            className="camera-views"
            role="group"
            aria-label="Ракурс интерьера"
          >
            {views.map((item) => (
              <button
                type="button"
                key={item.value}
                className={item.value === view ? 'active' : ''}
                aria-pressed={item.value === view}
                onClick={() => onViewChange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
