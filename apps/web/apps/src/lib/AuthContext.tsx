'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export type AppRole = 'SUPERADMIN' | 'LGU_STAFF'

export interface AppUser {
  username: string
  role: AppRole
  id?: string
  fullName?: string
  assignedBarangays?: string[]
  forcePasswordReset?: boolean
}

export type SAUser = AppUser

export interface LoginOtpResult {
  otpRequired: true
  otpToken: string
  message: string
}

export interface LoginSuccessResult {
  otpRequired: false
}

export type LoginResult = LoginOtpResult | LoginSuccessResult

interface AuthContextValue {
  user: AppUser | null
  loading: boolean
  login: (username: string, password?: string, rememberMe?: boolean, otp?: string) => Promise<LoginResult>
  verifyLoginOtp: (otpToken: string, otp: string) => Promise<void>
  resendLoginOtp: (otpToken: string) => Promise<void>
  setInitialPassword: (newPassword: string) => Promise<void>
  logout: () => Promise<void>
  isSuperadmin: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const getCsrfToken = useCallback(() => {
    return document.cookie
      .split('; ')
      .find((c) => c.startsWith('XSRF-TOKEN='))
      ?.split('=')[1]
  }, [])

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
            forcePasswordReset: !!json.data.forcePasswordReset,
          })
          return
        }
      }
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

  const login = useCallback(async (username: string, password?: string, rememberMe?: boolean, otp?: string): Promise<LoginResult> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password, rememberMe: !!rememberMe, otp }),
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Login failed')
    }

    if (json.otpRequired) {
      return {
        otpRequired: true,
        otpToken: json.otpToken,
        message: json.message || 'OTP sent to your registered email.',
      }
    }

    const u = json.data.user
    setUser({
      username: u.username,
      role: u.role,
      id: u.id,
      fullName: u.fullName,
      assignedBarangays: u.assignedBarangays,
      forcePasswordReset: !!u.forcePasswordReset,
    })

    return { otpRequired: false }
  }, [])

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
      forcePasswordReset: !!u.forcePasswordReset,
    })
  }, [])

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

  const setInitialPassword = useCallback(async (newPassword: string) => {
    const csrfToken = getCsrfToken()
    const res = await fetch(`${API_URL}/auth/set-password`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      body: JSON.stringify({ newPassword }),
    })

    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to set password')
    }

    setUser((prev) => (prev ? { ...prev, forcePasswordReset: false } : prev))
  }, [getCsrfToken])

  const logout = useCallback(async () => {
    try {
      const csrfToken = getCsrfToken()
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      })
    } finally {
      setUser(null)
    }
  }, [getCsrfToken])

  const isSuperadmin = user?.role === 'SUPERADMIN'

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyLoginOtp, resendLoginOtp, setInitialPassword, logout, isSuperadmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
