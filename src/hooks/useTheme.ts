import { useEffect, useState } from 'react';
type Theme = 'light' | 'dark';
const key = 'balkonika-theme';
function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* Storage is optional. */
  }
  return matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
}
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [explicit, setExplicit] = useState(() => {
    try {
      return ['light', 'dark'].includes(localStorage.getItem(key) ?? '');
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (meta) meta.content = theme === 'dark' ? '#121a17' : '#f5f4ef';
    if (explicit)
      try {
        localStorage.setItem(key, theme);
      } catch {
        /* Keep the session usable. */
      }
  }, [theme, explicit]);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme:dark)');
    const change = (event: MediaQueryListEvent) => {
      if (!explicit) setTheme(event.matches ? 'dark' : 'light');
    };
    const storage = (event: StorageEvent) => {
      if (
        event.key === key &&
        (event.newValue === 'light' || event.newValue === 'dark')
      ) {
        setExplicit(true);
        setTheme(event.newValue);
      }
    };
    media.addEventListener('change', change);
    window.addEventListener('storage', storage);
    return () => {
      media.removeEventListener('change', change);
      window.removeEventListener('storage', storage);
    };
  }, [explicit]);
  return {
    theme,
    toggleTheme: () => {
      setExplicit(true);
      setTheme((current) => (current === 'light' ? 'dark' : 'light'));
    },
  };
}
