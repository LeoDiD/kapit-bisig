'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { profileApi, forgotPasswordApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import PasswordStrengthMeter, {
  getPasswordStrength,
  validateStrongPassword,
} from '@/components/ui/PasswordStrengthMeter'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function SecuritySection() {
  const router = useRouter()
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [forgotConfirmOpen, setForgotConfirmOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // OTP step state
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)

  // Device info (client-side detected)
  const [deviceInfo, setDeviceInfo] = useState({
    browser: 'Web Browser',
    os: 'Unknown OS',
    time: 'Active now',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent
      let browser = 'Modern Browser'
      if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Google Chrome'
      else if (ua.includes('Edg')) browser = 'Microsoft Edge'
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari'
      else if (ua.includes('Firefox')) browser = 'Mozilla Firefox'

      let os = 'Desktop Device'
      if (ua.includes('Windows')) os = 'Windows'
      else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS'
      else if (ua.includes('Linux')) os = 'Linux'
      else if (ua.includes('Android')) os = 'Android'
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

      setDeviceInfo({
        browser,
        os,
        time: 'Active now',
      })
    }

    // Pre-fetch user email for seamless forgot-password recovery
    profileApi
      .getProfile()
      .then((res) => {
        if (res.success && res.data?.email) {
          setUserEmail(res.data.email)
        }
      })
      .catch(() => {})
  }, [])

  // Derived strength of newPassword
  const strength = useMemo(
    () => getPasswordStrength(form.newPassword),
    [form.newPassword],
  )

  // Live password requirement breakdown
  const criteria = useMemo(() => {
    const p = form.newPassword
    return {
      length: p.length >= 8,
      uppercase: /[A-Z]/.test(p),
      lowercase: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
      symbol: /[^A-Za-z0-9\s]/.test(p),
      noWhitespace: p.length > 0 && !/\s/.test(p),
    }
  }, [form.newPassword])

  // Whether submit button should be disabled
  const isButtonDisabled =
    saving ||
    !form.currentPassword ||
    !form.newPassword ||
    !form.confirmPassword ||
    strength === 'weak' ||
    form.newPassword !== form.confirmPassword

  /** Strip whitespace as user types */
  const handlePasswordInput = (
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value.replace(/\s/g, '') }))
  }

  /** Pre-submit validation — opens confirm modal if OK */
  const handleRequestChange = () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      showToast.error('All password fields are required')
      return
    }

    if (/\s/.test(form.newPassword)) {
      showToast.error('Password must not contain whitespace')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      showToast.error('New passwords do not match')
      return
    }

    const result = validateStrongPassword(form.newPassword)
    if (!result.isValid) {
      result.errors.forEach((e) => showToast.error(e))
      return
    }

    if (strength === 'weak') {
      showToast.error('Password is too weak. Please choose a stronger password.')
      return
    }

    setConfirmOpen(true)
  }

  /** Step 1: Request OTP after user confirms in modal */
  const handleRequestOtp = async () => {
    setSaving(true)
    try {
      const res = await profileApi.requestPasswordChangeOtp({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      if (res.success) {
        showToast.success('Verification code sent to your email')
        setConfirmOpen(false)
        setOtpStep(true)
        setOtp('')
        setOtpError(null)
      } else {
        const errors = (res as any).errors
        if (Array.isArray(errors) && errors.length > 0) {
          errors.forEach((e: string) => showToast.error(e))
        } else {
          showToast.error(res.message || 'Failed to send verification code')
        }
        setConfirmOpen(false)
      }
    } catch (err: any) {
      console.error('Password change OTP request failed:', err)
      showToast.error('Failed to send verification code. Please try again.')
      setConfirmOpen(false)
    } finally {
      setSaving(false)
    }
  }

  /** Step 2: Verify OTP and change password */
  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setOtpError('Please enter a valid 6-digit verification code')
      return
    }
    setSaving(true)
    setOtpError(null)
    try {
      const res = await profileApi.confirmPasswordChange({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        otp,
      })
      if (res.success) {
        showToast.success('Password changed successfully')
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setOtp('')
        setOtpStep(false)
      } else {
        const errors = (res as any).errors
        if (Array.isArray(errors) && errors.length > 0) {
          errors.forEach((e: string) => showToast.error(e))
        } else {
          setOtpError(res.message || 'Invalid verification code')
        }
      }
    } catch (err: any) {
      console.error('OTP verification failed:', err)
      setOtpError('Verification failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelOtp = () => {
    setOtp('')
    setOtpStep(false)
    setOtpError(null)
  }

  /** Revoke all other active sessions */
  const handleRevokeOtherSessions = async () => {
    setRevoking(true)
    try {
      const res = await profileApi.revokeOtherSessions()
      if (res.success) {
        showToast.success(res.message || 'All other active sessions have been signed out')
        setRevokeConfirmOpen(false)
      } else {
        showToast.error(res.message || 'Failed to revoke other sessions')
      }
    } catch (err: any) {
      console.error('Session revocation error:', err)
      showToast.error(err.response?.data?.message || 'Failed to sign out of other devices')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Security Health Overview Banner */}
      <div className="bg-gradient-to-br from-[#0F533A]/10 via-emerald-500/5 to-transparent dark:from-emerald-950/30 dark:via-slate-800/50 dark:to-transparent rounded-2xl border border-[#0F533A]/15 dark:border-emerald-800/30 p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-[#0F533A] text-white rounded-xl shadow-sm shadow-[#0F533A]/25 shrink-0">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Account Security Status
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Your KapitBisig account requires multi-step email verification for password updates. All login activities are logged for administrative audit compliance.
            </p>
          </div>
        </div>
      </div>

      {otpStep ? (
        /* ── Modern OTP Verification Step ─────────────────────────── */
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-sm p-6 sm:p-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0F533A] dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <MailIcon className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Verify Your Identity
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              We sent a 6-digit confirmation code to your registered email address. Enter it below to complete your password update.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full max-w-[280px] mx-auto px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:border-[#0F533A] dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#0F533A]/10 outline-none text-center tracking-[0.4em] font-mono text-2xl font-bold transition-all shadow-inner"
                  autoFocus
                  disabled={saving}
                />
                <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                  Verification code expires in 10 minutes
                </p>
                {otpError && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                    {otpError}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCancelOtp}
                  disabled={saving}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700/80 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={saving || otp.length !== 6}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#0F533A] hover:bg-[#0a3f2c] active:bg-[#073021] rounded-xl transition-all shadow-sm shadow-[#0F533A]/25 disabled:opacity-50"
                >
                  {saving && <Spinner />}
                  Confirm Password Update
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Modern Change Password Form ──────────────────────────── */
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-sm p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/60 pb-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Change Password
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Update your account password using strong cryptographic standards.
              </p>
            </div>
            <div className="p-2 rounded-xl bg-gray-100 dark:bg-slate-700/60 text-gray-500 dark:text-gray-400 hidden sm:block">
              <KeyIcon className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-5 max-w-xl">
            {/* Current Password */}
            <ModernPasswordField
              label="Current Password"
              value={form.currentPassword}
              onChange={(v) => handlePasswordInput('currentPassword', v)}
              show={showCurrent}
              onToggle={() => setShowCurrent(!showCurrent)}
              placeholder="Enter current password"
              action={
                <button
                  type="button"
                  onClick={() => setForgotConfirmOpen(true)}
                  className="text-xs font-semibold text-[#0F533A] dark:text-emerald-400 hover:text-[#0a3f2c] dark:hover:text-emerald-300 hover:underline transition-all cursor-pointer"
                >
                  Forgot password?
                </button>
              }
            />

            {/* New Password */}
            <div>
              <ModernPasswordField
                label="New Password"
                value={form.newPassword}
                onChange={(v) => handlePasswordInput('newPassword', v)}
                show={showNew}
                onToggle={() => setShowNew(!showNew)}
                placeholder="Enter new password"
              />

              {/* Password Strength Meter */}
              <div className="mt-2.5">
                <PasswordStrengthMeter password={form.newPassword} />
              </div>

              {/* Interactive Requirements Checklist */}
              {form.newPassword.length > 0 && (
                <div className="mt-3.5 p-3.5 bg-gray-50 dark:bg-slate-700/30 border border-gray-200/70 dark:border-slate-700/50 rounded-xl">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Security Requirements
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <RequirementItem met={criteria.length} text="8+ characters length" />
                    <RequirementItem met={criteria.uppercase} text="At least 1 uppercase (A-Z)" />
                    <RequirementItem met={criteria.lowercase} text="At least 1 lowercase (a-z)" />
                    <RequirementItem met={criteria.number} text="At least 1 number (0-9)" />
                    <RequirementItem met={criteria.symbol} text="At least 1 symbol (!@#$)" />
                    <RequirementItem met={criteria.noWhitespace} text="No spaces or whitespace" />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <ModernPasswordField
                label="Confirm New Password"
                value={form.confirmPassword}
                onChange={(v) => handlePasswordInput('confirmPassword', v)}
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                placeholder="Re-enter new password"
              />
              {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
                  <ExclamationIcon className="w-3.5 h-3.5" />
                  Passwords do not match
                </p>
              )}
              {form.confirmPassword && form.newPassword === form.confirmPassword && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
                  <CheckIcon className="w-3.5 h-3.5" />
                  Passwords match
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-8 pt-5 border-t border-gray-100 dark:border-slate-700/60">
            <button
              type="button"
              onClick={handleRequestChange}
              disabled={isButtonDisabled}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0F533A] hover:bg-[#0a3f2c] active:bg-[#073021] rounded-xl transition-all shadow-sm shadow-[#0F533A]/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Spinner /> : <LockIcon className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        </div>
      )}

      {/* Modern Active Devices & Sessions */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-sm p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700/60 mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Active Sessions & Device Security
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Devices currently authenticated with your KapitBisig profile.
            </p>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 rounded-full">
            1 Active Device
          </span>
        </div>

        {/* Current Device Card */}
        <div className="p-4 rounded-xl border border-gray-200/80 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-700/30 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-200/60 dark:border-slate-600 flex items-center justify-center text-[#0F533A] dark:text-emerald-400 shadow-xs">
              <ComputerDesktopIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {deviceInfo.browser} on {deviceInfo.os}
                </p>
                <span className="px-2 py-0.5 text-[10px] font-semibold text-[#0F533A] dark:text-emerald-300 bg-[#0F533A]/10 dark:bg-emerald-500/20 rounded-md">
                  Current Session
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Local Session &bull; {deviceInfo.time}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Secured via JWT
          </div>
        </div>

        {/* Sign Out Other Devices Action */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Sign Out of All Other Devices
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Lost a mobile device or signed in from a shared computer? Invalidate all other active sessions immediately while keeping this browser active.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRevokeConfirmOpen(true)}
            disabled={revoking}
            className="px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/60 rounded-xl transition-all shrink-0 self-start sm:self-auto cursor-pointer disabled:opacity-50"
          >
            {revoking ? 'Signing Out...' : 'Sign Out Other Devices'}
          </button>
        </div>
      </div>

      {/* Confirm Password Change Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirm Password Update"
        body="Are you sure you want to update your password? A verification code will be sent to your email to confirm this action."
        confirmLabel="Yes, Send Code"
        loading={saving}
        onConfirm={handleRequestOtp}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Confirm Revoke Other Sessions Modal */}
      <ConfirmModal
        isOpen={revokeConfirmOpen}
        title="Sign Out of All Other Devices"
        body="Are you sure you want to sign out of all other sessions? Any other browsers, phones, or workstations will be required to log in again. Your current session will remain active."
        confirmLabel="Sign Out Other Devices"
        loading={revoking}
        onConfirm={handleRevokeOtherSessions}
        onCancel={() => setRevokeConfirmOpen(false)}
      />

      {/* Modern In-Modal Forgot Password Recovery */}
      <ForgotPasswordRecoveryModal
        isOpen={forgotConfirmOpen}
        userEmail={userEmail}
        onClose={() => setForgotConfirmOpen(false)}
      />
    </div>
  )
}

/* ── Modern Helpers & Subcomponents ─────────────────────────────── */

function ModernPasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  action,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder?: string
  action?: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-600 rounded-xl transition-all focus:border-[#0F533A] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#0F533A]/15 dark:focus:ring-emerald-500/20 outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          {show ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 transition-colors ${
        met ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-gray-400 dark:text-gray-500'
      }`}
    >
      {met ? (
        <CheckIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600 ml-1 mr-1 shrink-0" />
      )}
      <span className="text-[11px]">{text}</span>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ComputerDesktopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function PaperAirplaneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  )
}

/* ── Modern Self-Contained Forgot Password Recovery Modal ───────── */

function ForgotPasswordRecoveryModal({
  isOpen,
  userEmail,
  onClose,
}: {
  isOpen: boolean
  userEmail: string
  onClose: () => void
}) {
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when closed
  const handleClose = () => {
    if (loading) return
    setStep('request')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    onClose()
  }

  // Step 1: Send verification code to user email
  const handleSendCode = async () => {
    if (!userEmail) {
      setError('No registered email found for this account.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await forgotPasswordApi.sendOtp(userEmail)
      showToast.success('Verification code sent to your email')
      setStep('reset')
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Resend code while on step 2
  const handleResendCode = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      await forgotPasswordApi.sendOtp(userEmail)
      showToast.success('New verification code sent to your email')
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP and finalize password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit verification code.')
      return
    }

    if (!newPassword) {
      setError('Please enter a new password.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    const valResult = validateStrongPassword(newPassword)
    if (!valResult.isValid) {
      setError(valResult.errors[0] || 'Password does not meet complexity requirements.')
      return
    }

    setLoading(true)
    try {
      // 1. Verify OTP to obtain short-lived reset token
      const verifyRes = await forgotPasswordApi.verifyOtp(userEmail, otp.trim())
      if (!verifyRes.success || !verifyRes.resetToken) {
        setError('Invalid or expired verification code.')
        setLoading(false)
        return
      }

      // 2. Finalize reset with reset token
      const resetRes = await forgotPasswordApi.resetPassword(verifyRes.resetToken, newPassword)
      if (resetRes.success) {
        showToast.success('Password updated successfully!')
        handleClose()
      } else {
        setError(resetRes.message || 'Failed to reset password.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please check your verification code.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700/80 p-6 sm:p-7 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Soft radial glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 bg-[#0F533A]/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <CloseIcon className="w-4 h-4" />
        </button>

        {step === 'request' ? (
          /* ── Step 1: Dispatch Verification Code ── */
          <div>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F533A] to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-[#0F533A]/25 shrink-0">
                <KeyIcon className="w-6 h-6" />
              </div>
              <div className="pr-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  Reset Forgotten Password
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Don&apos;t remember your current password? We will dispatch a secure one-time verification code to restore your account access right here.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 font-medium">
                {error}
              </div>
            )}

            {/* Registered Email Card */}
            <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 bg-gray-50/70 dark:bg-slate-700/40 mb-4">
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <MailIcon className="w-3.5 h-3.5 text-[#0F533A] dark:text-emerald-400" />
                  Recipient Email Address
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified Account
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {userEmail || 'Your registered account email'}
              </p>
            </div>

            {/* Checklist */}
            <div className="space-y-2 mb-6 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <CheckIcon className="w-4 h-4 text-[#0F533A] dark:text-emerald-400 shrink-0" />
                <span>A 6-digit verification code will be generated immediately.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <CheckIcon className="w-4 h-4 text-[#0F533A] dark:text-emerald-400 shrink-0" />
                <span>You will enter your new password directly in this dialog.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <CheckIcon className="w-4 h-4 text-[#0F533A] dark:text-emerald-400 shrink-0" />
                <span>Your current device session remains active until reset.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700/80 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#0F533A] to-emerald-700 hover:from-[#0a3f2c] hover:to-emerald-800 rounded-xl shadow-md shadow-[#0F533A]/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Spinner /> : <PaperAirplaneIcon className="w-3.5 h-3.5" />}
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </div>
          </div>
        ) : (
          /* ── Step 2: In-Modal OTP Verification & Password Setup ── */
          <form onSubmit={handleResetPassword}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F533A] to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-[#0F533A]/25 shrink-0">
                <LockIcon className="w-6 h-6" />
              </div>
              <div className="pr-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  Set Your New Password
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Enter the 6-digit code sent to <strong className="text-gray-700 dark:text-gray-300">{userEmail}</strong> and choose your new password.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-5 max-h-[60vh] overflow-y-auto pr-1">
              {/* 6-Digit OTP */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.4em] font-mono font-bold text-lg py-2.5 bg-gray-50 dark:bg-slate-700/60 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-600 rounded-xl transition-all focus:border-[#0F533A] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#0F533A]/15 outline-none"
                  autoFocus
                />
              </div>

              {/* New Password */}
              <div>
                <ModernPasswordField
                  label="New Password"
                  value={newPassword}
                  onChange={(v) => setNewPassword(v.replace(/\s/g, ''))}
                  show={showNew}
                  onToggle={() => setShowNew(!showNew)}
                  placeholder="Enter strong new password"
                />
                <div className="mt-2">
                  <PasswordStrengthMeter password={newPassword} />
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <ModernPasswordField
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(v) => setConfirmPassword(v.replace(/\s/g, ''))}
                  show={showConfirm}
                  onToggle={() => setShowConfirm(!showConfirm)}
                  placeholder="Re-enter new password"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700/60 flex-wrap gap-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-xs font-semibold text-[#0F533A] dark:text-emerald-400 hover:underline disabled:opacity-50 cursor-pointer"
              >
                Resend code
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700/80 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6 || !newPassword || newPassword !== confirmPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#0F533A] to-emerald-700 hover:from-[#0a3f2c] hover:to-emerald-800 rounded-xl shadow-md shadow-[#0F533A]/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Spinner />}
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}

