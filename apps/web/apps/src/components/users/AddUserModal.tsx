'use client'

import React, { useEffect, useRef, useState } from 'react'
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

const TEXT_MAX_LENGTH = 64

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  // Form state
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [assignedBarangays, setAssignedBarangays] = useState<string[]>([])

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [barangayDropdownOpen, setBarangayDropdownOpen] = useState(false)
  const barangayButtonRef = useRef<HTMLButtonElement>(null)
  const barangayMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!barangayDropdownOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const inButton = barangayButtonRef.current?.contains(target)
      const inMenu = barangayMenuRef.current?.contains(target)
      if (!inButton && !inMenu) {
        setBarangayDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [barangayDropdownOpen])

  useEffect(() => {
    if (!isOpen) {
      setBarangayDropdownOpen(false)
    }
  }, [isOpen])

  const resetForm = () => {
    setUsername('')
    setEmail('')
    setFullName('')
    setAssignedBarangays([])
    setBarangayDropdownOpen(false)
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Username
    if (!username.trim()) {
      newErrors.username = 'Username is required'
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (username.length > TEXT_MAX_LENGTH) {
      newErrors.username = `Username must not exceed ${TEXT_MAX_LENGTH} characters`
    } else if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      newErrors.username = 'Username may only contain letters, numbers, dots, hyphens, underscores'
    }

    // Email
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (email.trim().length > TEXT_MAX_LENGTH) {
      newErrors.email = `Email must not exceed ${TEXT_MAX_LENGTH} characters`
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      newErrors.email = 'Invalid email format'
    }

    // Full name
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (fullName.trim().length > TEXT_MAX_LENGTH) {
      newErrors.fullName = `Full name must not exceed ${TEXT_MAX_LENGTH} characters`
    }

    // Accessible barangays
    if (assignedBarangays.length < 1) {
      newErrors.assignedBarangays = 'Select at least one barangay.'
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
        showToast.success('Staff user created.')
        onSuccess?.()
        onClose()
      }
    } catch (error: unknown) {
      console.error('Failed to create user:', error)
      const err = error as {
        response?: {
          message?: string
          errors?: Array<{ location?: string; path?: string; message?: string } | string>
        }
      }

      // Extract validation errors from server response
      if (err.response?.errors?.length) {
        const newErrors: FormErrors = {}
        const errorMessages: string[] = []

        for (const e of err.response.errors) {
          if (typeof e === 'string') {
            errorMessages.push(e)
          } else if (e.path && e.message) {
            // Map path to form field
            const fieldMap: Record<string, keyof FormErrors> = {
              username: 'username',
              email: 'email',
              fullName: 'fullName',
              assignedBarangays: 'assignedBarangays',
            }
            const field = fieldMap[e.path]
            if (field) {
              newErrors[field] = e.message
            } else {
              errorMessages.push(e.message)
            }
          }
        }

        if (errorMessages.length > 0) {
          newErrors.general = errorMessages.join(', ')
        }

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors)
        }

        const displayMessage = err.response.message || 'Validation failed'
        showToast.error(displayMessage)
      } else if (err.response?.message) {
        setErrors({ general: err.response.message })
        showToast.error(err.response.message)
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            {/* General Error */}
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {errors.general}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.slice(0, TEXT_MAX_LENGTH))}
                maxLength={TEXT_MAX_LENGTH}
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

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, TEXT_MAX_LENGTH))}
                maxLength={TEXT_MAX_LENGTH}
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

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').slice(0, TEXT_MAX_LENGTH))}
                maxLength={TEXT_MAX_LENGTH}
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

            {/* Accessible Barangays */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Accessible Barangays <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <button
                  ref={barangayButtonRef}
                  type="button"
                  onClick={() => setBarangayDropdownOpen((v) => !v)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${
                    errors.assignedBarangays ? 'border-red-500' : 'border-gray-300'
                  } bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-sm ${
                    assignedBarangays.length > 0 ? 'text-gray-800' : 'text-gray-400'
                  }`}
                  disabled={isLoading}
                >
                  <span className="truncate">
                    {assignedBarangays.length > 0
                      ? `${assignedBarangays.length} barangay${assignedBarangays.length > 1 ? 's' : ''} selected`
                      : 'Select barangays'}
                  </span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${barangayDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {barangayDropdownOpen && (
                  <div
                    ref={barangayMenuRef}
                    className="absolute left-0 top-full mt-2 w-full max-h-56 overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1 z-50"
                  >
                    {BARANGAY_OPTIONS.map((barangay) => {
                      const selected = assignedBarangays.includes(barangay)
                      return (
                        <button
                          key={barangay}
                          type="button"
                          onClick={() => {
                            setAssignedBarangays((prev) =>
                              prev.includes(barangay)
                                ? prev.filter((b) => b !== barangay)
                                : [...prev, barangay]
                            )
                            setErrors((prev) => ({ ...prev, assignedBarangays: undefined }))
                          }}
                          className={[
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                            selected ? 'bg-[#EAB308] text-gray-900' : 'text-gray-700 hover:bg-gray-50',
                          ].join(' ')}
                        >
                          <span className="w-5 flex items-center justify-center">
                            {selected ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : null}
                          </span>
                          <span className="truncate">{barangay}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {assignedBarangays.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {assignedBarangays.map((barangay) => (
                    <span key={barangay} className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs border border-green-100">
                      {barangay}
                    </span>
                  ))}
                </div>
              )}

              {errors.assignedBarangays && (
                <p className="mt-1 text-sm text-red-500">{errors.assignedBarangays}</p>
              )}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-800">
                New staff will receive a first-login OTP, set their own password, and only access the barangays selected above.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
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
