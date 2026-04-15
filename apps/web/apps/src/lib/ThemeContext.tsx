'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

export type Theme = 'light' | 'dark' | 'system'
export type TextSize = 'small' | 'medium' | 'large'

interface ThemeContextValue {
  theme: Theme
  textSize: TextSize
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  setTextSize: (size: TextSize) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function isThemeLockedToLight(pathname?: string | null) {
  return pathname === '/login'
}

function applyThemeToDOM(t: Theme, pathname?: string | null) {
  const resolved = isThemeLockedToLight(pathname) ? 'light' : (t === 'system' ? getSystemTheme() : t)
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.setAttribute('data-theme', resolved)
  return resolved
}

function applyTextSizeToDOM(size: TextSize) {
  document.documentElement.setAttribute('data-text-size', size)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [theme, setThemeState] = useState<Theme>('light')
  const [textSize, setTextSizeState] = useState<TextSize>('medium')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('kb-theme') as Theme | null
    const storedSize = localStorage.getItem('kb-text-size') as TextSize | null

    const t =
      storedTheme && ['light', 'dark', 'system'].includes(storedTheme) ? storedTheme : 'light'
    const s =
      storedSize && ['small', 'medium', 'large'].includes(storedSize) ? storedSize : 'medium'

    setThemeState(t)
    setTextSizeState(s)
    const resolved = applyThemeToDOM(t, pathname)
    setResolvedTheme(resolved)
    applyTextSizeToDOM(s)
    setMounted(true)
  }, [pathname])

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (!mounted || theme !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const resolved = applyThemeToDOM('system', pathname)
      setResolvedTheme(resolved)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme, mounted, pathname])

  useEffect(() => {
    if (!mounted) return
    const resolved = applyThemeToDOM(theme, pathname)
    setResolvedTheme(resolved)
  }, [mounted, pathname, theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem('kb-theme', t)
    const resolved = applyThemeToDOM(t, pathname)
    setResolvedTheme(resolved)
  }, [pathname])

  const setTextSize = useCallback((s: TextSize) => {
    setTextSizeState(s)
    localStorage.setItem('kb-text-size', s)
    applyTextSizeToDOM(s)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, textSize, resolvedTheme, setTheme, setTextSize }}>
      {children}
    </ThemeContext.Provider>
  )
}
