const key = 'balkonika-theme';

export function initializeTheme(button) {
  const system = matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Storage is optional. */ }
  let explicit = saved === 'light' || saved === 'dark';

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    button.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему интерфейса' : 'Включить тёмную тему интерфейса');
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.title = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#121a17' : '#f5f4ef';
  }
  apply(explicit ? saved : system.matches ? 'dark' : 'light');
  button.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    explicit = true;
    apply(theme);
    try { localStorage.setItem(key, theme); } catch { /* Keep the current session usable. */ }
  });
  system.addEventListener('change', event => {
    if (!explicit) apply(event.matches ? 'dark' : 'light');
  });
}
