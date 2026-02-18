'use client'

import React, { useState, useMemo } from 'react'
import { profileApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import PasswordStrengthMeter, {
  getPasswordStrength,
  validateStrongPassword,
} from '@/components/ui/PasswordStrengthMeter'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function SecuritySection() {
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

  // Derived strength of newPassword
  const strength = useMemo(
    () => getPasswordStrength(form.newPassword),
    [form.newPassword],
  )

  // Whether submit button should be disabled
  const isButtonDisabled =
    saving ||
    !form.currentPassword ||
    !form.newPassword ||
    !form.confirmPassword ||
    strength === 'weak'

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

    // Whitespace (double-check trimmed value)
    if (/\s/.test(form.newPassword)) {
      showToast.error('Password must not contain whitespace')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      showToast.error('New passwords do not match')
      return
    }

    // Client-side strong validation (same rules as backend)
    const result = validateStrongPassword(form.newPassword)
    if (!result.isValid) {
      result.errors.forEach((e) => showToast.error(e))
      return
    }

    if (strength === 'weak') {
      showToast.error('Password is too weak. Please choose a stronger password.')
      return
    }

    // All checks passed — open confirm modal
    setConfirmOpen(true)
  }

  /** Actually call the API after user confirms */
  const handleConfirmedChange = async () => {
    setSaving(true)
    try {
      const res = await profileApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      if (res.success) {
        showToast.success('Password changed successfully')
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        const errors = (res as any).errors
        if (Array.isArray(errors) && errors.length > 0) {
          errors.forEach((e: string) => showToast.error(e))
        } else {
          showToast.error(res.message || 'Failed to change password')
        }
      }
    } catch (err: any) {
      const errors = err?.response?.errors
      if (Array.isArray(errors) && errors.length > 0) {
        errors.forEach((e: string) => showToast.error(e))
      } else {
        showToast.error(err.message || 'Failed to change password')
      }
    } finally {
      setSaving(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div>
      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800">Change Password</h2>
        <p className="text-sm text-gray-500 mt-1">Ensure your account stays secure.</p>

        <div className="mt-6 space-y-5 max-w-lg">
          <PasswordField
            label="Current Password"
            value={form.currentPassword}
            onChange={(v) => handlePasswordInput('currentPassword', v)}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
          />

          <div>
            <PasswordField
              label="New Password"
              value={form.newPassword}
              onChange={(v) => handlePasswordInput('newPassword', v)}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
              hint="Min. 16 characters, upper + lower + digit + symbol, no whitespace"
            />
            {/* Strength meter — same design as AddUserModal */}
            <PasswordStrengthMeter password={form.newPassword} />
          </div>

          <PasswordField
            label="Confirm New Password"
            value={form.confirmPassword}
            onChange={(v) => handlePasswordInput('confirmPassword', v)}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
          />
          {form.confirmPassword && form.newPassword !== form.confirmPassword && (
            <p className="text-sm text-red-500 -mt-3">Passwords do not match</p>
          )}
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleRequestChange}
            disabled={isButtonDisabled}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#0F533A] rounded-xl hover:bg-[#0a3f2c] transition-colors disabled:opacity-50"
          >
            <LockIcon className="w-4 h-4" />
            Update Password
          </button>
        </div>
      </div>

      {/* Active Sessions placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
        <h2 className="text-lg font-bold text-gray-800">Active Sessions</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your logged-in devices.</p>
        <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
          Session management coming soon.
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirm Password Update"
        body="Are you sure you want to update your password?"
        confirmLabel="Yes, Update"
        loading={saving}
        onConfirm={handleConfirmedChange}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────── */

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {hint && <span className="text-gray-400 font-normal ml-1 text-xs">({hint})</span>}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}
