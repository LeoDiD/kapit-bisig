/**
 * Mobile Number Utilities (Philippines)
 *
 * Normalized format used by backend storage: 09XXXXXXXXX
 */

const PH_MOBILE_REGEX = /^09\d{9}$/;

/**
 * Normalize a Philippine mobile number to 09XXXXXXXXX.
 * - Removes spaces and special characters
 * - Converts +639XXXXXXXXX to 09XXXXXXXXX
 * - Also supports 639XXXXXXXXX input
 */
export function normalizePhilippineMobileNumber(input: string): string {
  if (typeof input !== 'string') return '';

  const trimmed = input.trim();
  if (!trimmed) return '';

  let sanitized: string;
  if (trimmed.startsWith('+')) {
    sanitized = `+${trimmed.slice(1).replace(/\D/g, '')}`;
  } else {
    sanitized = trimmed.replace(/\D/g, '');
  }

  if (sanitized.startsWith('+63')) {
    return `0${sanitized.slice(3)}`;
  }

  if (sanitized.startsWith('63')) {
    return `0${sanitized.slice(2)}`;
  }

  // Accept 10-digit local format entered without leading 0 (9XXXXXXXXX)
  if (/^9\d{9}$/.test(sanitized)) {
    return `0${sanitized}`;
  }

  return sanitized;
}

export function isValidPhilippineMobileNumber(input: string): boolean {
  return PH_MOBILE_REGEX.test(input);
}
