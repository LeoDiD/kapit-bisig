'use client'

import React, { useMemo } from 'react'

/**
 * Common weak patterns — must match backend passwordValidator.ts
 */
const COMMON_WEAK_PATTERNS = [
  'password', 'admin', '123456', 'qwerty', 'letmein', 'welcome',
  'monkey', 'dragon', 'master', 'login', 'superadmin', 'super',
  'abc123', 'trustno1', 'iloveyou', 'sunshine', 'princess',
  'football', 'shadow', 'passw0rd', 'kapitbisig', 'changeme',
  '12345678', '123456789',
]

export type PasswordStrengthLevel = '' | 'weak' | 'medium' | 'strong'

/**
 * Calculate password strength (mirrors backend calculatePasswordStrength).
 * If the password contains ANY common weak pattern → immediately "weak".
 * If length < 16 → "weak".
 * Otherwise a 7-point score → ≥6 strong, ≥4 medium, else weak.
 */
export function getPasswordStrength(password: string): PasswordStrengthLevel {
  if (!password) return ''

  const lower = password.toLowerCase()
  if (COMMON_WEAK_PATTERNS.some(p => lower.includes(p))) return 'weak'

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~\\]/.test(password)) score++

  if (score >= 6) return 'strong'
  if (score >= 4) return 'medium'
  return 'weak'
}

/**
 * Validate a password client-side (same rules as backend validatePassword).
 * Returns { isValid, errors }.
 */
export function validateStrongPassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (/\s/.test(password)) {
    errors.push('Password must not contain spaces or whitespace')
  }

  const lower = password.toLowerCase()
  if (COMMON_WEAK_PATTERNS.some(p => lower.includes(p))) {
    errors.push('Password contains a common or guessable pattern')
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain at least one number')
  }
  if (!/[!@#$%^&*(),.?":{}|<>\-_=+\\[\]~/`]/.test(password)) {
    errors.push('Must contain at least one special character')
  }

  return { isValid: errors.length === 0, errors }
}

interface PasswordStrengthMeterProps {
  password: string
}

/**
 * Reusable password strength meter bar + label.
 * Identical UX to the one used in AddUserModal.
 */
export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password])

  if (!password) return null

  const colorClass =
    strength === 'weak' ? 'bg-red-500' :
    strength === 'medium' ? 'bg-yellow-500' :
    strength === 'strong' ? 'bg-green-500' :
    'bg-gray-200'

  const widthClass =
    strength === 'weak' ? 'w-1/3' :
    strength === 'medium' ? 'w-2/3' :
    strength === 'strong' ? 'w-full' :
    'w-0'

  const textClass =
    strength === 'weak' ? 'text-red-500' :
    strength === 'medium' ? 'text-yellow-600' :
    strength === 'strong' ? 'text-green-600' :
    'text-gray-400'

  return (
    <div className="mt-2">
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} ${widthClass} transition-all duration-300`} />
      </div>
      <p className={`mt-1 text-xs ${textClass}`}>
        Password strength: {strength || 'none'}
        {strength === 'weak' && (
          <span className="ml-1">— too weak to submit</span>
        )}
      </p>
    </div>
  )
}
