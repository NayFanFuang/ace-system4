// Dark-mode helper for the ACE design system.
// Toggles <html data-ds-theme="dark"> and persists to localStorage.
import { useEffect, useState } from 'react'

const KEY = 'ace_ds_theme'

export function getTheme() {
  try { return window.localStorage.getItem(KEY) || 'light' } catch { return 'light' }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-ds-theme', theme === 'dark' ? 'dark' : 'light')
  try { window.localStorage.setItem(KEY, theme) } catch {}
}

// Apply persisted theme immediately on module load (before React mounts)
applyTheme(getTheme())

export function useDarkMode() {
  const [theme, setTheme] = useState(getTheme)
  useEffect(() => { applyTheme(theme) }, [theme])
  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  return { theme, isDark: theme === 'dark', toggle }
}
