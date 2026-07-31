'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { forgotPasswordApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import { MAX_TEXT_LENGTH, sanitizeAsciiText, sanitizeNoWhitespace } from '@/lib/inputValidation'
import PasswordStrengthMeter from '@/components/ui/PasswordStrengthMeter'

type Step = 'email' | 'otp' | 'reset'

/**
 * Password validation (mirrors backend policy: ≥8 chars, upper+lower+digit+symbol)
 */
const validateStrongPassword = (pw: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  if (pw.length < 8) errors.push('Must be at least 8 characters')
  if (!/[A-Z]/.test(pw)) errors.push('Must contain an uppercase letter')
  if (!/[a-z]/.test(pw)) errors.push('Must contain a lowercase letter')
  if (!/[0-9]/.test(pw)) errors.push('Must contain a number')
  if (!/[!@#$%^&*(),.?":{}|<>\-_=+\\[\]~/`]/.test(pw)) errors.push('Must contain a special character')
  const common = ['password', '12345678', 'qwerty', 'abcdefgh']
  if (common.some(p => pw.toLowerCase().includes(p))) errors.push('Contains a common pattern')
  return { isValid: errors.length === 0, errors }
}

export default function ForgotPasswordPage() {
  const router = useRouter()

  // Step state
  const [step, setStep] = useState<Step>('email')

  // Step 1
  const [email, setEmail] = useState('')

  // Step 2
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')

  // Step 3
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Shared
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ── Step 1: Send OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    setIsLoading(true)
    try {
      await forgotPasswordApi.sendOtp(email.trim())
      showToast.success('If the email exists, an OTP was sent.')
      setStep('otp')
    } catch (err: unknown) {
      console.error('Forgot password OTP send failed:', err)
      const msg = (err as { message?: string }).message || 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Step 2: Verify OTP ── */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code sent to your email.')
      return
    }

    setIsLoading(true)
    try {
      const res = await forgotPasswordApi.verifyOtp(email.trim(), otp)
      const token = res.resetToken || ''
      if (!token) {
        setError('Failed to obtain reset token. Please try again.')
        return
      }
      setResetToken(token)
      showToast.success('OTP verified.')
      setStep('reset')
    } catch (err: unknown) {
      console.error('Verify OTP failed:', err)
      setError('Invalid or expired code. Please use the latest OTP sent to your email.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setIsResending(true)
    setError(null)
    try {
      await forgotPasswordApi.sendOtp(email.trim())
      setOtp('')
      showToast.success('A new OTP has been sent.')
    } catch (err: unknown) {
      console.error('Resend OTP failed:', err)
      const msg = (err as { message?: string }).message || 'Failed to resend OTP. Please try again.'
      setError(msg)
    } finally {
      setIsResending(false)
    }
  }

  /* ── Step 3: Reset password ── */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const pwCheck = validateStrongPassword(newPassword)
    if (!pwCheck.isValid) {
      setError(pwCheck.errors[0])
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await forgotPasswordApi.resetPassword(resetToken, newPassword)
      showToast.success('Password reset successfully! Please sign in.')
      router.push('/login')
    } catch (err: unknown) {
      console.error('Reset password failed:', err)
      const msg = (err as { message?: string }).message || 'Failed to reset password. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Step indicator ── */
  const steps: { key: Step; label: string }[] = [
    { key: 'email', label: 'Email' },
    { key: 'otp', label: 'Verify' },
    { key: 'reset', label: 'Reset' },
  ]

  const stepIndex = steps.findIndex(s => s.key === step)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/logoW.png"
            alt="Kapit-Bisig Logo"
            width={200}
            height={72}
            priority
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Reset Password</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          {step === 'email' && 'Enter your email to receive a verification code.'}
          {step === 'otp' && 'Enter the 6-digit code sent to your email.'}
          {step === 'reset' && 'Create a new password for your account.'}
        </p>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= stepIndex ? 'bg-[#226538] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < stepIndex ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < stepIndex ? 'bg-[#226538]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}

        {/* ── Step 1: Email ── */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(sanitizeAsciiText(e.target.value))}
                maxLength={MAX_TEXT_LENGTH}
                placeholder="your.email@example.com"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#226538] focus:border-[#226538] text-gray-900 bg-white text-sm"
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#226538] hover:bg-[#1b502d] text-white font-medium rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? <Spinner /> : null}
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
            <BackToLogin />
          </form>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">6-Digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#226538] focus:border-[#226538] text-gray-900 bg-white text-sm text-center tracking-[0.3em] text-lg font-mono"
                required
                disabled={isLoading}
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-400">Code expires in 10 minutes.</p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#226538] hover:bg-[#1b502d] text-white font-medium rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? <Spinner /> : null}
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-60"
            >
              {isResending ? 'Resending...' : 'Resend OTP'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(null); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Change email
            </button>
          </form>
        )}

        {/* ── Step 3: New Password ── */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password <span className="font-normal text-gray-400">(min. 8 characters)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(sanitizeNoWhitespace(e.target.value))}
                  maxLength={MAX_TEXT_LENGTH}
                  placeholder="Strong password (≥8 chars)"
                  className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#226538] focus:border-[#226538] text-gray-900 bg-white text-sm"
                  required
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
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
              <div className="mt-2">
                <PasswordStrengthMeter password={newPassword} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(sanitizeNoWhitespace(e.target.value))}
                maxLength={MAX_TEXT_LENGTH}
                placeholder="Confirm your new password"
                className={`block w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#226538] focus:border-[#226538] text-gray-900 bg-white text-sm ${
                  confirmPassword && newPassword !== confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                required
                disabled={isLoading}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#226538] hover:bg-[#1b502d] text-white font-medium rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? <Spinner /> : null}
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function BackToLogin() {
  return (
    <div className="text-center">
      <a href="/login" className="text-sm text-[#226538] hover:text-[#1b502d] font-medium transition-colors">
        Back to Sign In
      </a>
    </div>
  )
}
