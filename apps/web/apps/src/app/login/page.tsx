'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { showToast } from '@/lib/toast'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading, login, verifyLoginOtp, resendLoginOtp } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // OTP modal state
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otpToken, setOtpToken] = useState<string | null>(null)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Restore remember-me preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('rememberMe')
    if (saved === 'true') setRememberMe(true)
  }, [])

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard')
    }
  }, [authLoading, user, router])

  // Focus first OTP input when modal opens
  useEffect(() => {
    if (otpModalOpen) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    }
  }, [otpModalOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!username || !password) {
      setError('Please enter your username and password')
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await login(username, password, rememberMe)

      if (result.otpRequired) {
        // Open OTP modal — do NOT navigate
        setOtpToken(result.otpToken)
        setOtpDigits(['', '', '', '', '', ''])
        setOtpError(null)
        setOtpModalOpen(true)
        showToast.info(result.message || 'OTP sent to your email.')
        return
      }
      
      // Normal login success
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberMe')
      }

      showToast.info('Signing in…')
      await new Promise((r) => setTimeout(r, 500))
      showToast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err: unknown) {
      const error = err as { message?: string }
      const msg = error.message || ''
      if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
        setError('Unable to connect to the server. Please try again later.')
        showToast.error('Unable to connect to the server.')
      } else {
        setError(msg || 'Invalid credentials. Please try again.')
        showToast.error(msg || 'Login failed. Check credentials.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  /* ---------- OTP input handlers ---------- */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // digits only
    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1) // only last char
    setOtpDigits(newDigits)
    setOtpError(null)

    // Auto-advance focus
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const newDigits = [...otpDigits]
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || ''
      }
      setOtpDigits(newDigits)
      // Focus last filled or the next empty
      const focusIdx = Math.min(pasted.length, 5)
      otpInputRefs.current[focusIdx]?.focus()
    }
  }

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('')
    if (otp.length !== 6) {
      setOtpError('Please enter the complete 6-digit code.')
      return
    }
    if (!otpToken) return

    setIsVerifying(true)
    setOtpError(null)

    try {
      await verifyLoginOtp(otpToken, otp)

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberMe')
      }

      setOtpModalOpen(false)
      showToast.success('Email verified! Welcome!')
      router.push('/dashboard')
    } catch (err: unknown) {
      const error = err as { message?: string }
      setOtpError(error.message || 'Invalid or expired code.')
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    if (!otpToken || isResending) return
    setIsResending(true)

    try {
      await resendLoginOtp(otpToken)
      showToast.success('A new OTP has been sent to your email.')
      setOtpDigits(['', '', '', '', '', ''])
      setOtpError(null)
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      const error = err as { message?: string }
      showToast.error(error.message || 'Failed to resend OTP.')
    } finally {
      setIsResending(false)
    }
  }

  const handleCancelOtp = () => {
    setOtpModalOpen(false)
    setOtpToken(null)
    setOtpDigits(['', '', '', '', '', ''])
    setOtpError(null)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0">
          {/* Background image */}
          <div className="absolute inset-0 bg-[url('/images/picW.png')] bg-cover bg-center"></div>
          {/* Green overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#226538]/90 via-[#226538]/80 to-[#226538]/60"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 text-white h-full w-full">
          <h1 className="text-5xl font-extrabold mb-2">
            <span className="text-white">Kapit-</span>
            <span className="text-[#ECC323]">Bisig</span>
          </h1>
          <p className="text-xl font-light mb-12 leading-relaxed max-w-md">
            AI-Powered Household Relief<br />
            Distribution and Tracking Platform<br />
            for Local Government Units
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-md w-full">
            <FeatureCard
              title="Precise"
              description="Data Driven aid Delivery"
              color="bg-[#226538]/90"
            />
            <FeatureCard
              title="Equitable"
              description="Fairness Through AI Prioritization"
              color="bg-[#226538]/90"
            />
            <FeatureCard
              title="Transparent"
              description="Blockchain-verified relief Tracking"
              color="bg-[#226538]/90"
            />
            <FeatureCard
              title="Resilient"
              description="Strengthening LGU disaster response"
              color="bg-[#226538]/90"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/images/logoW.png"
              alt="Kapit-Bisig Logo"
              width={280}
              height={100}
              priority
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
            <p className="text-gray-600 text-sm font-medium">Enter your credentials to access the relief system</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#226538] focus:border-[#226538] transition-colors text-gray-900 bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#226538] focus:border-[#226538] transition-colors text-gray-900 bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                {/* Visibility toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#226538] focus:ring-[#226538] border-gray-300 rounded cursor-pointer accent-[#226538]"
                  disabled={isLoading}
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer">
                  Remember me
                </label>
              </div>
              <a href="/forgot-password" className="text-sm text-[#ECC323] hover:text-yellow-600 font-medium">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#226538] hover:bg-[#1b502d] text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#226538] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ========== OTP VERIFICATION MODAL ========== */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop — blur + darken */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCancelOtp}
          />

          {/* Modal card */}
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={handleCancelOtp}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#226538]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#226538]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 text-center mb-1">Verify Your Email</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              We sent a 6-digit code to your registered email.
              <br />Enter it below to complete sign-in.
            </p>

            {/* OTP error */}
            {otpError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm text-center">{otpError}</p>
              </div>
            )}

            {/* OTP input boxes */}
            <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpInputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={isVerifying}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#226538] focus:border-[#226538] transition-colors text-gray-900 bg-white disabled:opacity-60"
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              onClick={handleVerifyOtp}
              disabled={isVerifying || otpDigits.join('').length !== 6}
              className="w-full py-3 px-4 bg-[#226538] hover:bg-[#1b502d] text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#226538] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying…
                </>
              ) : (
                'Verify & Sign In'
              )}
            </button>

            {/* Resend + Cancel row */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={handleResendOtp}
                disabled={isResending || isVerifying}
                className="text-sm text-[#226538] hover:text-[#1b502d] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Sending…' : 'Resend Code'}
              </button>
              <button
                onClick={handleCancelOtp}
                disabled={isVerifying}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">Code expires in 10 minutes</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Feature Card Component
function FeatureCard({ 
  title, 
  description, 
  color 
}: { 
  title: string
  description: string
  color: string 
}) {
  return (
    <div className={`${color} backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:scale-105 transition-transform cursor-default shadow-lg`}>
      {/* UPDATED: Title is now Yellow (#ECC323) */}
      <h3 className="text-lg font-bold text-[#ECC323] mb-1">{title}</h3>
      {/* UPDATED: Description reverted to White/90 */}
      <p className="text-xs text-white/90 leading-relaxed">{description}</p>
    </div>
  )
}