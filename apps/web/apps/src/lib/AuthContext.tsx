'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

/** Authenticated user shape */
export interface SAUser {
  username: string
  role: 'superadmin'
}

interface AuthContextValue {
  user: SAUser | null
  loading: boolean
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SAUser | null>(null)
  const [loading, setLoading] = useState(true)

  /** Check session on mount via GET /api/sa/me */
  const initAuth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/sa/me`, { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setUser({ username: json.data.username, role: json.data.role })
          return
        }
      }
      // Not authenticated
      setUser(null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    initAuth()
  }, [initAuth])

  /** POST /api/sa/login */
  const login = useCallback(async (username: string, password: string, rememberMe?: boolean) => {
    const res = await fetch(`${API_URL}/sa/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password, rememberMe: !!rememberMe }),
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Login failed')
    }

    setUser(json.data.user)
  }, [])

  /** POST /api/sa/logout */
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/sa/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
