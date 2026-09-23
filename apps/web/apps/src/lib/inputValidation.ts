export const MAX_TEXT_LENGTH = 64
export const MAX_EMAIL_LENGTH = 64

const ASCII_TEXT_REGEX = /^[\x20-\x7E]*$/

/**
 * Standard email format:
 * - Local part: letters, digits, and . _ - + %
 * - Domain: valid domain labels with hyphen/letters/digits
 * - TLD: at least 2 alpha characters
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export function sanitizeAsciiText(input: string, max = MAX_TEXT_LENGTH): string {
  return input
    .slice(0, max)
    .split('')
    .filter((ch) => ASCII_TEXT_REGEX.test(ch))
    .join('')
}

export function sanitizeNoWhitespace(input: string, max = MAX_TEXT_LENGTH): string {
  return sanitizeAsciiText(input, max).replace(/\s/g, '')
}

export function isAsciiText(input: string): boolean {
  return ASCII_TEXT_REGEX.test(input)
}

export interface EmailValidationResult {
  isValid: boolean
  error?: string
}

export function validateEmailFormat(input: string): EmailValidationResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { isValid: false, error: 'Email is required' }
  }

  if (/\s/.test(input)) {
    return { isValid: false, error: 'Email must not contain spaces or whitespace' }
  }

  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return { isValid: false, error: `Email must not exceed ${MAX_EMAIL_LENGTH} characters` }
  }

  if (!isAsciiText(trimmed)) {
    return { isValid: false, error: 'Only standard characters are allowed' }
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }

  return { isValid: true }
}

export function isValidEmail(input: string): boolean {
  return validateEmailFormat(input).isValid
}

export const MAX_SEARCH_LENGTH = 60

/**
 * Allowed safe characters for search queries:
 * - Alphanumeric (a-z, A-Z, 0-9)
 * - Spaces
 * - Common safe symbols for addresses, barangays, dates, notes, and IDs: - , . / : # ( ) ' ñ Ñ
 * Strips dangerous injection/markup/script characters: < > { } [ ] $ % ^ * + = ; " ` \ | ~
 */
export const ALLOWED_SEARCH_CHAR_REGEX = /^[a-zA-Z0-9\s\-,\.\/:#()ñÑ']*$/

export function sanitizeSearchQuery(input: string, max = MAX_SEARCH_LENGTH): string {
  if (!input) return ''
  return input
    .slice(0, max)
    .split('')
    .filter((ch) => ALLOWED_SEARCH_CHAR_REGEX.test(ch))
    .join('')
}
