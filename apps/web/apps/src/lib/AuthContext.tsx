'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

/** Role type matching backend AppRole */
export type AppRole = 'SUPERADMIN' | 'LGU_STAFF'

/** Authenticated user shape – works for both SUPERADMIN and LGU_STAFF */
export interface AppUser {
  username: string
  role: AppRole
  /** Only present for LGU_STAFF */
  id?: string
  fullName?: string
  assignedBarangays?: string[]
}

/** @deprecated use AppUser instead */
export type SAUser = AppUser

interface AuthContextValue {
  user: AppUser | null
  loading: boolean
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  /** True when the current user is SUPERADMIN */
  isSuperadmin: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  /** Check session on mount via GET /api/auth/me */
  const initAuth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setUser({
            username: json.data.username,
            role: json.data.role,
            id: json.data.id,
            fullName: json.data.fullName,
            assignedBarangays: json.data.assignedBarangays,
          })
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

  /** POST /api/auth/login – supports both SUPERADMIN and LGU_STAFF */
  const login = useCallback(async (username: string, password: string, rememberMe?: boolean) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password, rememberMe: !!rememberMe }),
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Login failed')
    }

    const u = json.data.user
    setUser({
      username: u.username,
      role: u.role,
      id: u.id,
      fullName: u.fullName,
      assignedBarangays: u.assignedBarangays,
    })
  }, [])

  /** POST /api/auth/logout */
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setUser(null)
    }
  }, [])

  const isSuperadmin = user?.role === 'SUPERADMIN'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isSuperadmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
