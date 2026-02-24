/**
 * Theme store for manual light/dark/system toggle
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: () => 'light' | 'dark';
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      resolvedTheme: () => {
        const { theme } = get();
        if (theme === 'light') return 'light';
        if (theme === 'dark') return 'dark';
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
      },
    }),
    { name: 'comets-theme' }
  )
);

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
  } else if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

// Subscribe to system preference when theme is 'system'
if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    const stored = localStorage.getItem('comets-theme');
    const theme = stored ? (JSON.parse(stored)?.state?.theme as Theme) : 'system';
    if (theme === 'system') applyTheme('system');
  });
}

export { applyTheme };
