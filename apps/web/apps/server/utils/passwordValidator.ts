/**
 * Password Validation Utility
 * 
 * Implements a strong password policy with the following requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*()_+-=[]{}|;':",.<>?/`~)
 * 
 * Security Rationale:
 * - Backend validation is CRITICAL because frontend validation can be bypassed
 * - Strong passwords significantly reduce the risk of:
 *   - Brute-force attacks
 *   - Dictionary attacks
 *   - Credential stuffing attacks
 * - Never rely solely on client-side validation for security
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

// Password policy configuration - easy to modify if requirements change
const PASSWORD_POLICY = {
  minLength: 16,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  rejectWhitespace: true,
};

// Regex patterns for password validation
const PATTERNS = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  // Special characters commonly allowed in passwords
  specialChar: /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?`~\\]/,
};

/**
 * Validates a password against the security policy.
 * 
 * @param password - The password string to validate
 * @returns PasswordValidationResult with validation status, errors, and strength
 * 
 * @example
 * const result = validatePassword('MyP@ssw0rd');
 * if (!result.isValid) {
 *   console.log(result.errors); // Array of validation errors
 * }
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // Check if password is provided
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak',
    };
  }

  // Whitespace check
  if (PASSWORD_POLICY.rejectWhitespace && /\s/.test(password)) {
    errors.push('Password must not contain spaces or whitespace');
  }

  // Common password / pattern check
  if (isCommonPassword(password)) {
    errors.push('Password contains a common or guessable pattern');
  }

  // Minimum length check
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
  }

  // Uppercase letter check
  if (PASSWORD_POLICY.requireUppercase && !PATTERNS.uppercase.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }

  // Lowercase letter check
  if (PASSWORD_POLICY.requireLowercase && !PATTERNS.lowercase.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }

  // Number check
  if (PASSWORD_POLICY.requireNumber && !PATTERNS.number.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }

  // Special character check
  if (PASSWORD_POLICY.requireSpecialChar && !PATTERNS.specialChar.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~)');
  }

  // Calculate password strength
  const strength = calculatePasswordStrength(password);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Calculates the overall strength of a password.
 * This provides additional feedback beyond just pass/fail validation.
 * 
 * Strength criteria:
 * - weak: Less than 16 chars or fails basic requirements
 * - medium: Meets minimum requirements (16-19 chars)
 * - strong: Exceeds requirements (20+ chars with all character types)
 */
function calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;

  // Length scoring
  if (password.length >= 16) score++;
  if (password.length >= 20) score++;
  if (password.length >= 24) score++;

  // Character variety scoring
  if (PATTERNS.uppercase.test(password)) score++;
  if (PATTERNS.lowercase.test(password)) score++;
  if (PATTERNS.number.test(password)) score++;
  if (PATTERNS.specialChar.test(password)) score++;

  // Determine strength based on score
  if (score >= 6) return 'strong';
  if (score >= 4) return 'medium';
  return 'weak';
}

/**
 * Quick check if password meets minimum policy requirements.
 * Use this for simple boolean validation without detailed errors.
 * 
 * @param password - The password to check
 * @returns boolean indicating if password meets policy
 */
export function isPasswordValid(password: string): boolean {
  return validatePassword(password).isValid;
}

/**
 * Reusable strength checker matching the checklist spec.
 * Returns { ok: true } or { ok: false, reason: '...' }.
 */
export function validatePasswordStrength(password: string): { ok: boolean; reason?: string } {
  const result = validatePassword(password);
  if (result.isValid) return { ok: true };
  return { ok: false, reason: result.errors.join('; ') };
}

/**
 * Common weak passwords / patterns to reject.
 * Checked case-insensitively as substrings — more thorough than exact-match.
 *
 * In production, consider also using:
 * - Have I Been Pwned API (https://haveibeenpwned.com/API/v3)
 * - NIST bad passwords list
 */
const COMMON_WEAK_PATTERNS = [
  'password',
  'admin',
  '123456',
  'qwerty',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'login',
  'superadmin',
  'super',
  'abc123',
  'trustno1',
  'iloveyou',
  'sunshine',
  'princess',
  'football',
  'shadow',
  'passw0rd',
  'kapitbisig',
  'changeme',
  '12345678',
  '123456789',
];

/**
 * Checks if password contains a commonly used weak pattern.
 * Uses case-insensitive **substring** matching for broader coverage.
 *
 * @param password - The password to check
 * @returns boolean indicating if password contains a common pattern (bad)
 */
export function isCommonPassword(password: string): boolean {
  const lower = password.toLowerCase();
  return COMMON_WEAK_PATTERNS.some((pattern) => lower.includes(pattern));
}

