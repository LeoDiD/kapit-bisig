'use client'

import React, { useState } from 'react'
import { api, BARANGAY_OPTIONS, CreateStaffData } from '@/lib/api'
import { showToast } from '@/lib/toast'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface FormErrors {
  username?: string
  email?: string
  fullName?: string
  assignedBarangays?: string
  general?: string
}

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [assignedBarangays, setAssignedBarangays] = useState<string[]>([])
  const [brgyDropdownOpen, setBrgyDropdownOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const resetForm = () => {
    setUsername('')
    setEmail('')
    setFullName('')
    setAssignedBarangays([])
    setBrgyDropdownOpen(false)
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleBarangay = (brgy: string) => {
    setAssignedBarangays((prev) =>
      prev.includes(brgy)
        ? prev.filter((b) => b !== brgy)
        : [...prev, brgy],
    )
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!username.trim()) {
      newErrors.username = 'Username is required'
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      newErrors.username = 'Username may only contain letters, numbers, dots, hyphens, underscores'
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      newErrors.email = 'Invalid email format'
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (assignedBarangays.length === 0) {
      newErrors.assignedBarangays = 'Select at least one barangay'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const staffData: CreateStaffData = {
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        assignedBarangays,
      }

      const response = await api.createStaffUser(staffData)

      if (response.success) {
        resetForm()
        showToast.success('Account created. OTP sent to email.')
        onSuccess?.()
        onClose()
      }
    } catch (error: unknown) {
      console.error('Failed to create user:', error)
      const err = error as { response?: { message?: string; errors?: string[] } }
      if (err.response?.message) {
        setErrors({ general: err.response.message })
        showToast.error(err.response.message)
      } else if (err.response?.errors?.length) {
        setErrors({ general: err.response.errors.join(', ') })
        showToast.error('Failed to create user.')
      } else {
        setErrors({ general: 'Failed to create user. Please try again.' })
        showToast.error('Failed to create user.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="p-5 pb-3 flex justify-between items-start shrink-0 bg-white z-10 border-b border-gray-100 rounded-t-3xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add LGU Staff</h2>
            <p className="text-sm text-gray-500 mt-1">Create a new LGU Staff account</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {errors.general}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-sm text-gray-800 placeholder-gray-400 transition-colors`}
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. juan@lgu.gov.ph"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-sm text-gray-800 placeholder-gray-400 transition-colors`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="e.g. juan.delacruz"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-sm text-gray-800 placeholder-gray-400 transition-colors`}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Assigned Barangays <span className="text-red-500">*</span>
              </label>

              {assignedBarangays.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {assignedBarangays.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F533A]/10 text-[#0F533A] text-xs font-medium"
                    >
                      {b}
                      <button
                        type="button"
                        onClick={() => toggleBarangay(b)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setBrgyDropdownOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${
                  errors.assignedBarangays ? 'border-red-500' : 'border-gray-300'
                } bg-white text-sm text-gray-600 focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] transition-colors`}
                disabled={isLoading}
              >
                <span>
                  {assignedBarangays.length === 0
                    ? 'Select barangays...'
                    : `${assignedBarangays.length} barangay${assignedBarangays.length > 1 ? 's' : ''} selected`}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${brgyDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {brgyDropdownOpen && (
                <div className="mt-2 max-h-44 overflow-y-auto rounded-2xl border border-[#DCDCDC] bg-[#ECECEC] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
                  {BARANGAY_OPTIONS.map((b) => {
                    const checked = assignedBarangays.includes(b)
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBarangay(b)}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-left transition-colors ${
                          checked ? 'bg-[#EAB308] text-gray-900 font-medium' : 'text-slate-700 hover:bg-white/70'
                        }`}
                      >
                        <span className="w-5 flex items-center justify-center text-gray-900">
                          {checked && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        {b}
                      </button>
                    )
                  })}
                </div>
              )}

              {errors.assignedBarangays && (
                <p className="mt-1 text-sm text-red-500">{errors.assignedBarangays}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">Staff can only manage distributions in their assigned barangays.</p>
            </div>
          </div>

          <div className="px-5 py-3 flex justify-end gap-3 shrink-0 bg-white border-t border-gray-100 rounded-b-3xl">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0F533A] text-white text-sm font-medium hover:bg-[#0a3f2c] transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isLoading ? 'Creating...' : 'Create Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
