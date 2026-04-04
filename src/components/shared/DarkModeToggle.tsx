/**
 * DarkModeToggle.tsx — Task 6.4 — Agent_Design_System
 *
 * Accessible dark mode toggle button:
 *  - Reads initial theme from the no-FOCT script (data-theme on <html>)
 *  - Persists explicit user choice to localStorage
 *  - Follows system preference (prefers-color-scheme) when no explicit choice made
 *  - SVG icons use currentColor to inherit CSS colour tokens
 *  - Use with client:load in SiteNav
 */
import { useState, useEffect, useRef } from 'react';

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="3" fill="currentColor" />
    <line x1="8" y1="1"    x2="8"    y2="3"    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="13"   x2="8"    y2="15"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="1" y1="8"    x2="3"    y2="8"    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13" y1="8"   x2="15"   y2="8"    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="3.05" y1="3.05"   x2="4.46"  y2="4.46"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="11.54" y1="11.54" x2="12.95" y2="12.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="3.05" y1="12.95"  x2="4.46"  y2="11.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="11.54" y1="4.46"  x2="12.95" y2="3.05"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M13.5 9.5A6 6 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z"
      fill="currentColor"
    />
  </svg>
);

export default function DarkModeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  // Track whether the user has made an explicit choice (so system changes only
  // take effect when no localStorage entry exists)
  const explicitRef = useRef(false);

  useEffect(() => {
    // Sync with the value already set by the no-FOCT inline script
    const current = (document.documentElement.getAttribute('data-theme') ?? 'light') as 'light' | 'dark';
    setTheme(current);
    explicitRef.current = localStorage.getItem('theme') !== null;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystem = (e: MediaQueryListEvent) => {
      if (!explicitRef.current) {
        const next: 'dark' | 'light' = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        setTheme(next);
      }
    };
    mq.addEventListener('change', handleSystem);
    return () => mq.removeEventListener('change', handleSystem);
  }, []);

  function toggle() {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    explicitRef.current = true;
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="dark-mode-toggle"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
