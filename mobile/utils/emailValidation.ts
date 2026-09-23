export const MAX_EMAIL_LENGTH = 64;

/**
 * Standard email format:
 * - Local part: letters, digits, and . _ - + %
 * - Domain: valid domain labels with hyphen/letters/digits
 * - TLD: at least 2 alpha characters
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an email address against application security and formatting standards:
 * - Not empty
 * - No whitespace characters anywhere
 * - Max length of 64 characters
 * - Valid email format (rejects missing domain, missing user, missing TLD, or special chars outside . _ - + %)
 */
export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email ? email.trim() : '';
  if (!trimmed) {
    return { isValid: false, error: 'Email is required' };
  }

  if (/\s/.test(email)) {
    return { isValid: false, error: 'Email must not contain spaces or whitespace' };
  }

  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return { isValid: false, error: `Email must not exceed ${MAX_EMAIL_LENGTH} characters` };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Strips whitespace and caps length to MAX_EMAIL_LENGTH.
 */
export function cleanEmailInput(text: string, max = MAX_EMAIL_LENGTH): string {
  return text.replace(/\s/g, '').slice(0, max);
}
