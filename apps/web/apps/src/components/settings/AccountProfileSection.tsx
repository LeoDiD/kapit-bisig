'use client'

import React, { useState, useEffect, useRef } from 'react'
import { profileApi } from '@/lib/api'
import { showToast } from '@/lib/toast'
import ConfirmModal from '@/components/ui/ConfirmModal'

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

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
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
        setFullName(res.data.fullName || '')
        setUsername(res.data.username || '')
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

  /** Validate then open confirm modal */
  const handleRequestSave = () => {
    if (!fullName.trim()) {
      showToast.error('Full name is required')
      return
    }
    if (!username.trim() || username.trim().length < 3) {
      showToast.error('Username must be at least 3 characters')
      return
    }
    if (username.trim().length > 50) {
      showToast.error('Username must be at most 50 characters')
      return
    }
    setConfirmOpen(true)
  }

  /** Actually save after user confirms */
  const handleConfirmedSave = async () => {
    setSaving(true)
    try {
      const res = await profileApi.updateProfile({
        fullName: fullName.trim(),
        username: username.trim(),
      })
      if (res.success) {
        showToast.success('Profile updated successfully')
      } else {
        showToast.error(res.message || 'Update failed')
      }
    } catch (err: any) {
      showToast.error(err.message || 'Failed to update profile')
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
      // Reset file input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const initial = (fullName.trim()[0] || 'U').toUpperCase()
  const roleLabel = role === 'SUPERADMIN' ? 'Superadmin' : role === 'LGU_STAFF' ? 'LGU Staff' : role
  const isSuperadmin = role === 'SUPERADMIN'

  if (loading) return <ProfileSkeleton />

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800">Profile Information</h2>
      <p className="text-sm text-gray-500 mt-1">Update your personal details.</p>

      {/* Avatar */}
      <div className="flex items-center gap-4 mt-6">
        {avatarUrl ? (
          <img
            src={`${API_ORIGIN}${avatarUrl}`}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#0F533A] flex items-center justify-center text-white font-bold text-xl">
            {initial}
          </div>
        )}
        <div>
          {isSuperadmin ? (
            <p className="text-xs text-gray-400">Photo upload not available for Superadmin</p>
          ) : (
            <>
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
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <CameraIcon className="w-4 h-4" />
                {uploading ? 'Uploading…' : 'Change Photo'}
              </button>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WebP up to 2 MB</p>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        <div className="md:col-span-2">
          <Field label="Full Name" value={fullName} onChange={(v) => setFullName(v)} />
        </div>
        <Field label="Username" value={username} onChange={(v) => setUsername(v)} />
        <Field label="Email" value={email} readOnly />

        {/* Role badge */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
          <div className="pt-1.5">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-[#0F533A] rounded-full">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleRequestSave}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-[#0F533A] rounded-xl hover:bg-[#0a3f2c] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Spinner />}
          Save Changes
        </button>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirm Changes"
        body="Are you sure you want to save these profile changes?"
        confirmLabel="Yes, Save"
        loading={saving}
        onConfirm={handleConfirmedSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────── */

function Field({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  readOnly?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl transition-colors focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none ${
          readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
        }`}
      />
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-5 w-48 bg-gray-200 rounded" />
      <div className="h-4 w-64 bg-gray-100 rounded" />
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full" />
        <div className="h-9 w-32 bg-gray-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}



