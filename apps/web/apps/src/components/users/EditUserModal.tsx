'use client'

import React, { useEffect, useRef, useState } from 'react'
import { api, BARANGAY_OPTIONS, StaffUser, UpdateStaffData } from '@/lib/api'
import { showToast } from '@/lib/toast'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: StaffUser | null
  onSuccess?: () => void
}

interface FormErrors {
  assignedBarangays?: string
  general?: string
}

export default function EditUserModal({ isOpen, onClose, user, onSuccess }: EditUserModalProps) {
  const [assignedBarangays, setAssignedBarangays] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [barangayDropdownOpen, setBarangayDropdownOpen] = useState(false)
  const barangayButtonRef = useRef<HTMLButtonElement>(null)
  const barangayMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user && isOpen) {
      setAssignedBarangays(Array.isArray(user.assignedBarangays) ? [...user.assignedBarangays] : [])
      setErrors({})
    }
  }, [user, isOpen])

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

  const handleClose = () => {
    setBarangayDropdownOpen(false)
    setErrors({})
    onClose()
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (assignedBarangays.length < 1) {
      newErrors.assignedBarangays = 'Select at least one barangay.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const updateData: UpdateStaffData = {
        assignedBarangays,
      }

      const response = await api.updateStaffUser(user.id, updateData)

      if (response.success) {
        showToast.success('Assigned barangays updated successfully.')
        onSuccess?.()
        handleClose()
      }
    } catch (error: unknown) {
      console.error('Failed to update user barangays:', error)
      const err = error as {
        response?: {
          message?: string
          errors?: Array<{ location?: string; path?: string; message?: string } | string>
        }
      }

      if (err.response?.errors?.length) {
        const newErrors: FormErrors = {}
        const errorMessages: string[] = []

        for (const e of err.response.errors) {
          if (typeof e === 'string') {
            errorMessages.push(e)
          } else if (e.path && e.message) {
            if (e.path === 'assignedBarangays') {
              newErrors.assignedBarangays = e.message
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
        setErrors({ general: 'Failed to update assigned barangays. Please try again.' })
        showToast.error('Failed to update assigned barangays.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !user) return null

  const staffFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName || 'Staff Member'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col border border-gray-100 dark:border-slate-800">
        {/* Header */}
        <div className="p-5 pb-3 flex justify-between items-start shrink-0 bg-white dark:bg-slate-900 z-10 border-b border-gray-100 dark:border-slate-800 rounded-t-3xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Modify Assigned Barangays</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Update barangay jurisdiction for {staffFullName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
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
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-sm">
                {errors.general}
              </div>
            )}

            {/* Read-Only Profile Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-900 dark:text-slate-200">
                    Staff Member
                  </label>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">Read-only</span>
                </div>
                <input
                  type="text"
                  value={staffFullName}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-100/80 dark:bg-slate-800/60 text-xs font-medium text-gray-600 dark:text-slate-300 cursor-not-allowed select-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-900 dark:text-slate-200">
                    Email Address
                  </label>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">Read-only</span>
                </div>
                <input
                  type="email"
                  value={user.email || '--'}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-100/80 dark:bg-slate-800/60 text-xs font-medium text-gray-600 dark:text-slate-300 cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Accessible Barangays (Editable) */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-900 dark:text-slate-100">
                  Assigned Barangays <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignedBarangays([...BARANGAY_OPTIONS])
                      setErrors((prev) => ({ ...prev, assignedBarangays: undefined }))
                    }}
                    className="text-[11px] font-semibold text-[#004A1C] dark:text-[#ECC323] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300 dark:text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignedBarangays([])
                    }}
                    className="text-[11px] font-semibold text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="relative">
                <button
                  ref={barangayButtonRef}
                  type="button"
                  onClick={() => setBarangayDropdownOpen((v) => !v)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${
                    errors.assignedBarangays ? 'border-red-500' : 'border-gray-300 dark:border-slate-700'
                  } bg-white dark:bg-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-sm ${
                    assignedBarangays.length > 0 ? 'text-gray-800 dark:text-slate-100' : 'text-gray-400'
                  }`}
                  disabled={isLoading}
                >
                  <span className="truncate font-medium">
                    {assignedBarangays.length > 0
                      ? `${assignedBarangays.length} barangay${assignedBarangays.length > 1 ? 's' : ''} assigned`
                      : 'Select barangays'}
                  </span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${barangayDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {barangayDropdownOpen && (
                  <div
                    ref={barangayMenuRef}
                    className="absolute left-0 top-full mt-2 w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1 z-50"
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
                            selected
                              ? 'bg-[#EAB308]/20 text-gray-900 dark:text-slate-100 font-semibold'
                              : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50',
                          ].join(' ')}
                        >
                          <span className="w-5 flex items-center justify-center">
                            {selected ? (
                              <svg className="w-4 h-4 text-[#004A1C] dark:text-[#ECC323]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {assignedBarangays.map((barangay) => (
                    <span
                      key={barangay}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800"
                    >
                      {barangay}
                      <button
                        type="button"
                        onClick={() => setAssignedBarangays((prev) => prev.filter((b) => b !== barangay))}
                        className="hover:text-red-600 transition-colors ml-0.5"
                        aria-label={`Remove ${barangay}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {errors.assignedBarangays && (
                <p className="mt-1 text-sm text-red-500">{errors.assignedBarangays}</p>
              )}
            </div>

            <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 px-4 py-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Updating assigned barangays takes effect immediately. The staff member will gain or lose scanning and relief access for the modified barangays.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3 flex justify-end gap-3 shrink-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 rounded-b-3xl">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
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
              {isLoading ? 'Saving...' : 'Save Assigned Barangays'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
