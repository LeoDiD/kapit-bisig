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

/** Result returned by login when OTP is required */
export interface LoginOtpResult {
  otpRequired: true
  otpToken: string
  message: string
}

/** Result returned by login when no OTP is needed */
export interface LoginSuccessResult {
  otpRequired: false
}

export type LoginResult = LoginOtpResult | LoginSuccessResult

interface AuthContextValue {
  user: AppUser | null
  loading: boolean
  login: (username: string, password: string, rememberMe?: boolean) => Promise<LoginResult>
  verifyLoginOtp: (otpToken: string, otp: string) => Promise<void>
  resendLoginOtp: (otpToken: string) => Promise<void>
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
  const login = useCallback(async (username: string, password: string, rememberMe?: boolean): Promise<LoginResult> => {
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

    // OTP required — don't set user yet
    if (json.otpRequired) {
      return {
        otpRequired: true,
        otpToken: json.otpToken,
        message: json.message || 'OTP sent to your registered email.',
      }
    }

    // Normal login success
    const u = json.data.user
    setUser({
      username: u.username,
      role: u.role,
      id: u.id,
      fullName: u.fullName,
      assignedBarangays: u.assignedBarangays,
    })

    return { otpRequired: false }
  }, [])

  /** POST /api/auth/login/verify-otp */
  const verifyLoginOtp = useCallback(async (otpToken: string, otp: string) => {
    const res = await fetch(`${API_URL}/auth/login/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ otpToken, otp }),
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Verification failed')
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

  /** POST /api/auth/login/resend-otp */
  const resendLoginOtp = useCallback(async (otpToken: string) => {
    const res = await fetch(`${API_URL}/auth/login/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ otpToken }),
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to resend OTP')
    }
  }, [])

  /** POST /api/auth/logout */
  const logout = useCallback(async () => {
    try {
      // Read CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find((c) => c.startsWith('XSRF-TOKEN='))
        ?.split('=')[1]

      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      })
    } finally {
      setUser(null)
    }
  }, [])

  const isSuperadmin = user?.role === 'SUPERADMIN'

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyLoginOtp, resendLoginOtp, logout, isSuperadmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
