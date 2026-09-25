'use client'

import React, { useState, useEffect, useRef } from 'react'
import { profileApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { MAX_TEXT_LENGTH, isAsciiText, sanitizeAsciiText } from '@/lib/inputValidation'

const API_ORIGIN = (() => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!apiUrl || apiUrl.startsWith('/')) return ''
  return apiUrl.replace(/\/api\/?$/, '')
})()

export default function AccountProfileSection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initial values for reset detection
  const [initialData, setInitialData] = useState({ firstName: '', lastName: '' })
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const res = await profileApi.getProfile()
      if (res.success && res.data) {
        const fName = res.data.firstName || ''
        const lName = res.data.lastName || ''
        setFirstName(fName)
        setLastName(lName)
        setInitialData({ firstName: fName, lastName: lName })
        setEmail(res.data.email || '')
        setRole(res.data.role || '')
        setAvatarUrl(res.data.avatarUrl || null)
      }
    } catch {
      showToast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const isDirty = firstName !== initialData.firstName || lastName !== initialData.lastName

  const handleReset = () => {
    setFirstName(initialData.firstName)
    setLastName(initialData.lastName)
  }

  /** Validate then open confirm modal */
  const handleRequestSave = () => {
    if (!firstName.trim()) {
      showToast.error('First name is required')
      return
    }
    if (!isAsciiText(firstName.trim()) || !isAsciiText(lastName.trim())) {
      showToast.error('Only standard characters are allowed')
      return
    }
    if (!lastName.trim()) {
      showToast.error('Last name is required')
      return
    }
    setConfirmOpen(true)
  }

  /** Actually save after user confirms */
  const handleConfirmedSave = async () => {
    setSaving(true)
    try {
      const res = await profileApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      if (res.success) {
        showToast.success('Profile updated successfully')
        setInitialData({ firstName: firstName.trim(), lastName: lastName.trim() })
      } else {
        showToast.error(res.message || 'Update failed')
      }
    } catch (err: any) {
      console.error('Profile update failed:', err)
      showToast.error('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
      setConfirmOpen(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast.error('Only JPEG, PNG, and WebP images are allowed')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast.error('File must be under 2 MB')
      return
    }

    setUploading(true)
    try {
      const res = await profileApi.uploadAvatar(file)
      if (res.success && res.data) {
        setAvatarUrl(res.data.avatarUrl)
        showToast.success('Photo updated')
      } else {
        showToast.error('Upload failed')
      }
    } catch {
      showToast.error('Failed to upload photo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const displayName = `${firstName} ${lastName}`.trim() || 'KapitBisig User'
  const initial = (displayName[0] || 'U').toUpperCase()
  const roleLabel = role === 'SUPERADMIN' ? 'Superadmin' : role === 'LGU_STAFF' ? 'LGU Staff' : role || 'Member'
  const isSuperadmin = role === 'SUPERADMIN'

  if (loading) return <ProfileSkeleton />

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-sm overflow-hidden">
      {/* Decorative Brand Banner */}
      <div className="h-28 bg-gradient-to-r from-[#0F533A] via-[#146c4c] to-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_50%)]" />
        <div className="absolute bottom-2 right-4 text-white/30 text-xs font-mono select-none hidden sm:block">
          KapitBisig ID: {roleLabel}
        </div>
      </div>

      {/* Profile Header Hero */}
      <div className="px-6 pb-6 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
          {/* Avatar & Identifiers */}
          <div className="flex items-end gap-4">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-md bg-[#0F533A] flex items-center justify-center text-white text-3xl font-bold select-none">
                {avatarUrl ? (
                  <img
                    src={`${API_ORIGIN}${avatarUrl}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>

              {/* Online/Active Indicator */}
              <span
                className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"
                title="Active account"
              />
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 rounded-full">
                  <CheckBadgeIcon className="w-3.5 h-3.5" />
                  {roleLabel}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {email || 'No email registered'}
              </p>
            </div>
          </div>

          {/* Change Photo Button */}
          {!isSuperadmin && (
            <div className="sm:self-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-700/80 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                <CameraIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                {uploading ? 'Uploading...' : 'Change Photo'}
              </button>
            </div>
          )}
        </div>

        {/* Content Divider */}
        <hr className="my-6 border-gray-100 dark:border-slate-700/60" />

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Section 1: Personal Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserCircleIcon className="w-4 h-4 text-[#0F533A] dark:text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModernField
                label="First Name"
                value={firstName}
                onChange={(v) => setFirstName(sanitizeAsciiText(v))}
                placeholder="Enter first name"
                maxLength={MAX_TEXT_LENGTH}
                hint="Used on official receipts and reports"
              />
              <ModernField
                label="Last Name"
                value={lastName}
                onChange={(v) => setLastName(sanitizeAsciiText(v))}
                placeholder="Enter last name"
                maxLength={MAX_TEXT_LENGTH}
                hint="Family or legal surname"
              />
            </div>
          </div>

          {/* Section 2: Contact & Access */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheckIcon className="w-4 h-4 text-[#0F533A] dark:text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Account & Credentials
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email (Read Only) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    Verified ID
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <MailIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600/70 rounded-xl cursor-not-allowed select-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400">
                    <LockSmallIcon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                  Contact system administrator to request an email address update.
                </p>
              </div>

              {/* Role Card */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Role & Privileges
                </label>
                <div className="p-2.5 rounded-xl border border-gray-200/80 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-700/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0F533A]/10 dark:bg-emerald-500/20 text-[#0F533A] dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      {roleLabel.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {roleLabel}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {isSuperadmin
                          ? 'Full administrative control and user governance'
                          : 'Barangay relief distributions and resident claims'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-5 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {isDirty ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                You have unsaved changes
              </span>
            ) : (
              <span>All changes saved</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={handleRequestSave}
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0F533A] hover:bg-[#0a3f2c] active:bg-[#073021] rounded-xl transition-all shadow-sm shadow-[#0F533A]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Spinner /> : <SaveIcon className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirm Profile Changes"
        body="Are you sure you want to update your profile information? These changes will reflect immediately across all system reports."
        confirmLabel="Yes, Save"
        loading={saving}
        onConfirm={handleConfirmedSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

/* ── Modern Field Component ─────────────────────────────────────── */

function ModernField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {maxLength && (
          <span className="text-[10px] text-gray-400">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-600 rounded-xl transition-all focus:border-[#0F533A] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#0F533A]/15 dark:focus:ring-emerald-500/20 outline-none"
      />
      {hint && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200/70 dark:border-slate-700/60 shadow-sm overflow-hidden animate-pulse">
      <div className="h-28 bg-gray-200 dark:bg-slate-700" />
      <div className="p-6 space-y-6">
        <div className="flex items-end gap-4 -mt-12">
          <div className="w-24 h-24 rounded-2xl bg-gray-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-800" />
          <div className="space-y-2 pb-2">
            <div className="h-5 w-40 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-28 bg-gray-100 dark:bg-slate-700/60 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="h-10 bg-gray-100 dark:bg-slate-700/60 rounded-xl" />
          <div className="h-10 bg-gray-100 dark:bg-slate-700/60 rounded-xl" />
        </div>
      </div>
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

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CheckBadgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function LockSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  )
}
