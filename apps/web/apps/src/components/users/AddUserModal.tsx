'use client'

import React, { useState, useEffect } from 'react'
import { api, CreateUserData, UserRole } from '@/lib/api'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  role?: string
  phoneNumber?: string
  general?: string
}

/**
 * Password validation helper
 */
const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Email validation helper
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Phone number validation helper (Philippine format)
 */
const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true // Optional field
  const phoneRegex = /^(\+63|0)?[0-9]{10,11}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export default function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [phoneNumber, setPhoneNumber] = useState('')
  
  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([])
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | ''>('')
  
  // Fetch available roles on mount
  useEffect(() => {
    if (isOpen) {
      fetchAvailableRoles()
    }
  }, [isOpen])
  
  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength('')
      return
    }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++
    
    if (strength <= 2) setPasswordStrength('weak')
    else if (strength <= 4) setPasswordStrength('medium')
    else setPasswordStrength('strong')
  }, [password])
  
  const fetchAvailableRoles = async () => {
    try {
      const response = await api.getAvailableRoles()
      if (response.success && response.data) {
        setAvailableRoles(response.data.availableRoles)
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
      // Default to all roles if fetch fails
      setAvailableRoles(['Admin', 'Staff', 'Volunteer'])
    }
  }
  
  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setRole('')
    setPhoneNumber('')
    setErrors({})
    setShowPassword(false)
  }
  
  const handleClose = () => {
    resetForm()
    onClose()
  }
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    // First name
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (firstName.length > 50) {
      newErrors.firstName = 'First name cannot exceed 50 characters'
    }
    
    // Last name
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (lastName.length > 50) {
      newErrors.lastName = 'Last name cannot exceed 50 characters'
    }
    
    // Email
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Password
    if (!password) {
      newErrors.password = 'Password is required'
    } else {
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0]
      } else if (password !== confirmPassword) {
        newErrors.password = 'Passwords do not match'
      }
    }
    
    // Role
    if (!role) {
      newErrors.role = 'Please select a role'
    }
    
    // Phone number
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid Philippine phone number'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      const userData: CreateUserData = {
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role as UserRole,
        ...(phoneNumber && { phoneNumber: phoneNumber.trim() }),
      }
      
      const response = await api.createUser(userData)
      
      if (response.success) {
        resetForm()
        onSuccess?.()
        onClose()
      }
    } catch (error: unknown) {
      console.error('Failed to create user:', error)
      
      // Handle specific error responses
      const err = error as { response?: { message?: string; errors?: string[] } }
      if (err.response?.message) {
        setErrors({ general: err.response.message })
      } else if (err.response?.errors?.length) {
        setErrors({ general: err.response.errors.join(', ') })
      } else {
        setErrors({ general: 'Failed to create user. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'strong': return 'bg-green-500'
      default: return 'bg-gray-200'
    }
  }

  const getPasswordStrengthWidth = () => {
    switch (passwordStrength) {
      case 'weak': return 'w-1/3'
      case 'medium': return 'w-2/3'
      case 'strong': return 'w-full'
      default: return 'w-0'
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header - Fixed at top */}
        <div className="p-5 pb-3 flex justify-between items-start shrink-0 bg-white z-10 border-b border-gray-100 rounded-t-3xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
            <p className="text-sm text-gray-500 mt-1">Create a new user account for the system</p>
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

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            
            {/* General Error */}
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {errors.general}
              </div>
            )}
            
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-sm text-gray-800 placeholder-gray-400 transition-colors`}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>
              
              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-sm text-gray-800 placeholder-gray-400 transition-colors`}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
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
                placeholder="Enter email address"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-sm text-gray-800 placeholder-gray-400 transition-colors`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
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
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${getPasswordStrengthColor()} ${getPasswordStrengthWidth()} transition-all duration-300`} />
                  </div>
                  <p className={`mt-1 text-xs ${
                    passwordStrength === 'weak' ? 'text-red-500' :
                    passwordStrength === 'medium' ? 'text-yellow-600' :
                    passwordStrength === 'strong' ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    Password strength: {passwordStrength || 'none'}
                  </p>
                </div>
              )}
              
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
                onChange={(e) => setConfirmPassword(e.target.value)}
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

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.role ? 'border-red-500' : 'border-gray-300'
                  } bg-white focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-sm text-gray-800 appearance-none cursor-pointer`}
                  disabled={isLoading}
                >
                  <option value="" disabled>Select role</option>
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-500">{errors.role}</p>
              )}
              
              {/* Role Description */}
              {role && (
                <p className="mt-2 text-xs text-gray-500">
                  {role === 'Admin' && 'Full system access - can manage all users and settings'}
                  {role === 'Staff' && 'Can manage residents, distributions, and view reports'}
                  {role === 'Volunteer' && 'Mobile app access for field verification'}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-2">
                Phone Number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input 
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., 09123456789"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:border-[#0F533A] focus:ring-1 focus:ring-[#0F533A] text-sm text-gray-800 placeholder-gray-400 transition-colors`}
                disabled={isLoading}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
              )}
            </div>

          </div>

          {/* Footer Actions - Fixed at bottom */}
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
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
