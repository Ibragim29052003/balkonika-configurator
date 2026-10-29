import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { Provider } from 'react-redux';
import { useState } from 'react';
import { SettingsPanel } from '../src/components/SettingsPanel';
import { CustomSelect } from '../src/components/CustomSelect';
import { useTheme } from '../src/hooks/useTheme';
import { createAppStore } from '../src/store';
import { createInitialState } from '../src/state';
import { describeSelection } from '../src/materials';
import type { Wall, Floor } from '../src/types';

const dom = new JSDOM(
  '<!doctype html><html><head><meta name="theme-color"></head><body></body></html>',
  { url: 'https://balkonika.test' },
);
const media = {
  matches: false,
  addEventListener() {},
  removeEventListener() {},
};
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
  Node: { value: dom.window.Node, configurable: true },
  localStorage: { value: dom.window.localStorage, configurable: true },
  matchMedia: { value: () => media, configurable: true },
  innerWidth: { value: 1200, configurable: true },
  innerHeight: { value: 900, configurable: true },
  IS_REACT_ACT_ENVIRONMENT: { value: true, writable: true, configurable: true },
});
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
const { render, cleanup, fireEvent, act } =
  await import('@testing-library/react');

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

function settings() {
  const store = createAppStore();
  let resetCount = 0;
  const ui = render(
    <Provider store={store}>
      <SettingsPanel
        onReset={() => {
          resetCount++;
        }}
      />
    </Provider>,
  );
  return { ...ui, store, resetCount: () => resetCount };
}

test('all nine finishes can be chosen through the React form and update its summary', () => {
  const ui = settings();
  for (const wall of ['white', 'beige', 'gray'] as Wall[]) {
    for (const floor of ['light', 'dark', 'tile'] as Floor[]) {
      fireEvent.click(
        ui.container.querySelector(`input[name="wall"][value="${wall}"]`)!,
      );
      fireEvent.click(
        ui.container.querySelector(`input[name="floor"][value="${floor}"]`)!,
      );
      assert.equal(ui.store.getState().room.wall, wall);
      assert.equal(ui.store.getState().room.floor, floor);
      assert.equal(
        ui.getByRole('status').textContent,
        describeSelection({ wall, floor }),
      );
      assert.ok(
        ui.container.querySelector<HTMLInputElement>(
          `input[name="wall"][value="${wall}"]`,
        )!.checked,
      );
    }
  }
});

test('tabs work with keyboard and reference persistent labelled panels', () => {
  const ui = settings();
  const tabs = ui.getAllByRole('tab');
  for (const tab of tabs)
    assert.ok(document.getElementById(tab.getAttribute('aria-controls')!));
  tabs[0].focus();
  fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
  assert.equal(document.activeElement, tabs[1]);
  assert.equal(ui.getByRole('tabpanel').id, 'panel-textiles');
  fireEvent.keyDown(tabs[1], { key: 'End' });
  assert.equal(ui.getByRole('tabpanel').id, 'panel-lighting');
  fireEvent.keyDown(tabs[2], { key: 'Home' });
  assert.equal(ui.getByRole('tabpanel').id, 'panel-finishes');
});

test('curtains are independent; apply-to-all copies choices; returning to tab preserves window choice', () => {
  const ui = settings();
  fireEvent.click(ui.getByRole('tab', { name: 'Текстиль' }));
  fireEvent.click(ui.getByRole('checkbox', { name: 'Шторы слева' }));
  fireEvent.click(ui.getByRole('radio', { name: 'Закрыты' }));
  fireEvent.change(ui.getByRole('slider'), { target: { value: '180' } });
  fireEvent.click(ui.getByRole('combobox', { name: /Цвет ткани/ }));
  fireEvent.click(ui.getByRole('option', { name: 'Шалфей' }));
  const left = { ...ui.store.getState().room.curtains.left };
  assert.equal(left.color, 'sage');
  assert.equal(left.length, 180);
  assert.equal(left.open, false);
  assert.equal(ui.store.getState().room.curtains.back.enabled, false);
  fireEvent.click(ui.getByRole('button', { name: /На все окна/ }));
  assert.deepEqual(ui.store.getState().room.curtains.back, left);
  fireEvent.click(ui.getByRole('button', { name: 'Дальнее окно' }));
  fireEvent.click(ui.getByRole('radio', { name: 'Открыты' }));
  assert.equal(ui.store.getState().room.curtains.left.open, false);
  fireEvent.click(ui.getByRole('tab', { name: 'Отделка' }));
  fireEvent.click(ui.getByRole('tab', { name: 'Текстиль' }));
  assert.equal(
    ui
      .getByRole('button', { name: 'Дальнее окно' })
      .getAttribute('aria-pressed'),
    'true',
  );
});

test('lighting controls update Redux and are disabled while the light is switched off', () => {
  const ui = settings();
  fireEvent.click(ui.getByRole('tab', { name: 'Свет' }));
  fireEvent.click(ui.getByRole('radio', { name: /Вечер/ }));
  fireEvent.change(ui.getByRole('slider'), { target: { value: '25' } });
  fireEvent.click(ui.getByRole('combobox', { name: /Температура света/ }));
  fireEvent.click(ui.getByRole('option', { name: /Холодный/ }));
  assert.equal(ui.store.getState().room.period, 'night');
  assert.equal(ui.store.getState().room.lighting.temperature, 'cool');
  assert.equal(ui.store.getState().room.lighting.brightness, 25);
  fireEvent.click(ui.getByRole('checkbox', { name: 'Включить свет' }));
  assert.ok((ui.getByRole('combobox') as HTMLButtonElement).disabled);
  assert.ok(ui.getByRole('slider').closest('fieldset')!.disabled);
});

test('reset from another tab restores all controlled fields and invokes camera reset once', () => {
  const ui = settings();
  fireEvent.click(ui.getByRole('radio', { name: 'Белый' }));
  fireEvent.click(ui.getByRole('tab', { name: 'Текстиль' }));
  fireEvent.click(ui.getByRole('checkbox', { name: 'Шторы слева' }));
  fireEvent.click(ui.getByRole('button', { name: /На все окна/ }));
  fireEvent.click(ui.getByRole('checkbox', { name: /Добавить ковёр/ }));
  fireEvent.click(ui.getByRole('tab', { name: 'Свет' }));
  fireEvent.click(ui.getByRole('radio', { name: /Вечер/ }));
  fireEvent.change(ui.getByRole('slider'), { target: { value: '10' } });
  fireEvent.click(ui.getByRole('button', { name: /Сбросить оформление/ }));
  assert.deepEqual(ui.store.getState().room, createInitialState());
  assert.equal(ui.resetCount(), 1);
  fireEvent.click(ui.getByRole('tab', { name: 'Отделка' }));
  assert.ok(
    (ui.getByRole('radio', { name: 'Бежевый' }) as HTMLInputElement).checked,
  );
});

function SelectExample() {
  const [value, setValue] = useState('linen');
  return (
    <CustomSelect
      label="Ткань"
      value={value}
      options={[
        { value: 'linen', label: 'Лён' },
        { value: 'sage', label: 'Шалфей' },
        { value: 'graphite', label: 'Графит' },
      ]}
      onChange={setValue}
    />
  );
}

test('custom select supports keyboard selection, Escape, typeahead and outside dismissal', () => {
  const ui = render(<SelectExample />);
  const select = ui.getByRole('combobox');
  select.focus();
  fireEvent.keyDown(select, { key: 'Enter' });
  fireEvent.keyDown(select, { key: 'End' });
  fireEvent.keyDown(select, { key: 'Enter' });
  assert.match(select.textContent!, /Графит/);
  assert.equal(select.getAttribute('aria-expanded'), 'false');
  fireEvent.keyDown(select, { key: 'ArrowDown' });
  fireEvent.keyDown(select, { key: 'Home' });
  fireEvent.keyDown(select, { key: 'Escape' });
  assert.match(select.textContent!, /Графит/);
  fireEvent.keyDown(select, { key: 'Ш' });
  fireEvent.keyDown(select, { key: 'Enter' });
  assert.match(select.textContent!, /Шалфей/);
  fireEvent.click(select);
  fireEvent.pointerDown(document.body);
  assert.equal(ui.queryByRole('listbox'), null);
});

test('custom select removes its portal on unmount and cannot open while disabled', () => {
  const ui = render(<SelectExample />);
  fireEvent.click(ui.getByRole('combobox'));
  assert.ok(ui.getByRole('listbox'));
  ui.unmount();
  assert.equal(document.querySelector('[role="listbox"]'), null);
  const disabled = render(
    <CustomSelect
      label="Ткань"
      value="linen"
      options={[{ value: 'linen', label: 'Лён' }]}
      onChange={() => assert.fail('Disabled choice')}
      disabled
    />,
  );
  fireEvent.click(disabled.getByRole('combobox'));
  assert.equal(disabled.queryByRole('listbox'), null);
});

test('theme persists independently of room state and room reset', () => {
  const store = createAppStore();
  function ThemeExample() {
    const { theme, toggleTheme } = useTheme();
    return (
      <>
        <button onClick={toggleTheme}>{theme}</button>
        <SettingsPanel onReset={() => {}} />
      </>
    );
  }
  const ui = render(
    <Provider store={store}>
      <ThemeExample />
    </Provider>,
  );
  const initial = store.getState().room;
  fireEvent.click(ui.getByRole('button', { name: /^light$/ }));
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(localStorage.getItem('balkonika-theme'), 'dark');
  assert.equal(store.getState().room, initial);
  fireEvent.click(ui.getByRole('radio', { name: 'Белый' }));
  fireEvent.click(ui.getByRole('button', { name: /Сбросить оформление/ }));
  assert.equal(document.documentElement.dataset.theme, 'dark');
  act(() =>
    window.dispatchEvent(
      new dom.window.StorageEvent('storage', {
        key: 'balkonika-theme',
        newValue: 'light',
      }),
    ),
  );
  assert.equal(document.documentElement.dataset.theme, 'light');
});
