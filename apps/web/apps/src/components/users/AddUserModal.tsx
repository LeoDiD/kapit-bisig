'use client'

import React, { useState, useEffect } from 'react'
import { api, BARANGAY_OPTIONS, CreateStaffData } from '@/lib/api'
import { showToast } from '@/lib/toast'
import PasswordStrengthMeter, {
  getPasswordStrength,
  validateStrongPassword,
  type PasswordStrengthLevel,
} from '@/components/ui/PasswordStrengthMeter'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface FormErrors {
  username?: string
  email?: string
  fullName?: string
  password?: string
  assignedBarangays?: string
  general?: string
}

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  // Form state
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [assignedBarangays, setAssignedBarangays] = useState<string[]>([])
  const [brgyDropdownOpen, setBrgyDropdownOpen] = useState(false)
  
  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthLevel>('')

  // Calculate password strength using shared util
  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password))
  }, [password])
  
  const resetForm = () => {
    setUsername('')
    setEmail('')
    setFullName('')
    setPassword('')
    setConfirmPassword('')
    setAssignedBarangays([])
    setBrgyDropdownOpen(false)
    setErrors({})
    setShowPassword(false)
  }
  
  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleBarangay = (brgy: string) => {
    setAssignedBarangays(prev =>
      prev.includes(brgy)
        ? prev.filter(b => b !== brgy)
        : [...prev, brgy]
    )
  }
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    // Username
    if (!username.trim()) {
      newErrors.username = 'Username is required'
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      newErrors.username = 'Username may only contain letters, numbers, dots, hyphens, underscores'
    }

    // Email
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      newErrors.email = 'Invalid email format'
    }
    
    // Full name
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    
    // Password
    if (!password) {
      newErrors.password = 'Password is required'
    } else {
      const pwCheck = validateStrongPassword(password)
      if (!pwCheck.isValid) {
        newErrors.password = pwCheck.errors[0]
      } else if (password !== confirmPassword) {
        newErrors.password = 'Passwords do not match'
      }
    }
    
    // Assigned barangays
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
        password,
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

            {/* Email */}
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

            {/* Username */}
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

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Password <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1">(min. 16 characters)</span>
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                  placeholder="Strong password (≥16 chars)"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-sm text-gray-800 placeholder-gray-400 transition-colors`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator — shared component */}
              <PasswordStrengthMeter password={password} />
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ''))}
                placeholder="Confirm password"
                className={`w-full px-4 py-3 rounded-xl border ${
                  confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-sm text-gray-800 placeholder-gray-400 transition-colors`}
                disabled={isLoading}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
              )}
            </div>

            {/* Assigned Barangays */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Assigned Barangays <span className="text-red-500">*</span>
              </label>
              
              {/* Selected barangay chips */}
              {assignedBarangays.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {assignedBarangays.map(b => (
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

              {/* Dropdown trigger */}
              <button
                type="button"
                onClick={() => setBrgyDropdownOpen(prev => !prev)}
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

              {/* Dropdown list */}
              {brgyDropdownOpen && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {BARANGAY_OPTIONS.map(b => {
                    const checked = assignedBarangays.includes(b)
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBarangay(b)}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
                          checked ? 'bg-[#0F533A]/5 text-[#0F533A] font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`w-4 h-4 flex items-center justify-center rounded border ${
                          checked ? 'bg-[#0F533A] border-[#0F533A]' : 'border-gray-300'
                        }`}>
                          {checked && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
