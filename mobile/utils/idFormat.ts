export interface IdFormatInfo {
  minLength: number;
  maxLength: number;
  hint: string;
  placeholder: string;
  keyboardType: 'number-pad' | 'default';
}

/**
 * Normalizes an ID number by stripping formatting hyphens, spaces, and converting to uppercase.
 */
export const normalizeStep3IdNumber = (type: string, value: string): string => {
  const upper = String(value || '').trim().toUpperCase();
  switch (type) {
    case 'PhilSys ID':
    case 'SSS ID':
    case 'PhilHealth ID':
      return upper.replace(/\D/g, '');
    case "Driver's License":
    case 'Passport':
    case "Voter's ID":
      return upper.replace(/[^A-Z0-9]/g, '');
    default:
      return upper.replace(/\s+/g, ' ');
  }
};

/**
 * Metadata configuration for each supported ID type.
 */
export const getIdFormatInfo = (type: string): IdFormatInfo => {
  switch (type) {
    case 'PhilSys ID':
      return {
        minLength: 12,
        maxLength: 19, // 16 digits + 3 hyphens (e.g. 1234-5678-9012-3456)
        hint: '16 digits, e.g. 1234-5678-9012-3456',
        placeholder: '1234-5678-9012-3456',
        keyboardType: 'number-pad',
      };
    case "Driver's License":
      return {
        minLength: 11,
        maxLength: 13, // 1 letter + 10 digits + 2 hyphens (e.g. N01-23-456789)
        hint: '1 letter + 10 digits, e.g. N01-23-456789',
        placeholder: 'N01-23-456789',
        keyboardType: 'default',
      };
    case 'Passport':
      return {
        minLength: 8,
        maxLength: 9, // e.g. P1234567 or P1234567A
        hint: '1 letter + 7 digits, e.g. P1234567',
        placeholder: 'P1234567',
        keyboardType: 'default',
      };
    case 'SSS ID':
      return {
        minLength: 10,
        maxLength: 12, // 10 digits + 2 hyphens (e.g. 01-2345678-9)
        hint: '10 digits, e.g. 01-2345678-9',
        placeholder: '01-2345678-9',
        keyboardType: 'number-pad',
      };
    case 'PhilHealth ID':
      return {
        minLength: 12,
        maxLength: 14, // 12 digits + 2 hyphens (e.g. 12-345678901-2)
        hint: '12 digits, e.g. 12-345678901-2',
        placeholder: '12-345678901-2',
        keyboardType: 'number-pad',
      };
    case "Voter's ID":
      return {
        minLength: 6,
        maxLength: 25,
        hint: '6-25 characters, e.g. 7501-0019A-C145BCD',
        placeholder: '7501-0019A-C145BCD',
        keyboardType: 'default',
      };
    default:
      return {
        minLength: 1,
        maxLength: 30,
        hint: 'Enter the ID number exactly as shown',
        placeholder: 'Enter ID number',
        keyboardType: 'default',
      };
  }
};

/**
 * Validates the format of an ID number string against its official specification.
 */
export const isStep3IdNumberFormatValid = (type: string, value: string): boolean => {
  const normalized = normalizeStep3IdNumber(type, value);
  switch (type) {
    case 'PhilSys ID':
      return /^(?:\d{12}|\d{16})$/.test(normalized);
    case 'PhilHealth ID':
      return /^\d{12}$/.test(normalized);
    case "Driver's License":
      return /^[A-Z]\d{10}$/.test(normalized);
    case 'Passport':
      return /^[A-Z]\d{7}[A-Z]?$|^[A-Z]{2}\d{7}$/.test(normalized);
    case 'SSS ID':
      return /^\d{10}$/.test(normalized);
    case "Voter's ID":
      return /^[A-Z0-9]{6,25}$/.test(normalized);
    default:
      return normalized.length > 0;
  }
};

/**
 * Formats display count of characters entered for user feedback (e.g. 16/16).
 */
export const getIdDisplayCount = (type: string, value: string): string => {
  const normalized = normalizeStep3IdNumber(type, value);
  switch (type) {
    case 'PhilSys ID':
      return `${normalized.length}/16`;
    case 'PhilHealth ID':
      return `${normalized.length}/12`;
    case 'SSS ID':
      return `${normalized.length}/10`;
    case "Driver's License":
      return `${normalized.length}/11`;
    case 'Passport':
      return `${normalized.length}/8`;
    case "Voter's ID":
      return `${normalized.length}/25`;
    default:
      return `${value.length}/${getIdFormatInfo(type).maxLength}`;
  }
};

/**
 * Sanitizes and auto-formats user input as they type in the ID number field,
 * handling automatic hyphenation and graceful backspacing.
 */
export const sanitizeIdInput = (type: string, rawValue: string, prevValue?: string): string => {
  const upper = (rawValue || '').toUpperCase();

  switch (type) {
    case 'PhilSys ID': {
      let clean = upper.replace(/\D/g, '');
      if (prevValue && prevValue.endsWith('-') && upper === prevValue.slice(0, -1)) {
        clean = clean.slice(0, -1);
      }
      const limited = clean.slice(0, 16);
      const chunks = limited.match(/.{1,4}/g);
      return chunks ? chunks.join('-') : '';
    }

    case "Driver's License": {
      // Handle backspace when deleting a hyphen
      if (prevValue && prevValue.endsWith('-') && upper === prevValue.slice(0, -1)) {
        const prevNormalized = normalizeStep3IdNumber(type, prevValue);
        const stripped = prevNormalized.slice(0, -1);
        return formatDriversLicense(stripped);
      }
      const rawChars = upper.replace(/[^A-Z0-9]/g, '');
      return formatDriversLicense(rawChars);
    }

    case 'SSS ID': {
      let clean = upper.replace(/\D/g, '');
      if (prevValue && prevValue.endsWith('-') && upper === prevValue.slice(0, -1)) {
        clean = clean.slice(0, -1);
      }
      const limited = clean.slice(0, 10);
      let formatted = limited.slice(0, 2);
      if (limited.length > 2) {
        formatted += '-' + limited.slice(2, 9);
      }
      if (limited.length > 9) {
        formatted += '-' + limited.slice(9, 10);
      }
      return formatted;
    }

    case 'PhilHealth ID': {
      let clean = upper.replace(/\D/g, '');
      if (prevValue && prevValue.endsWith('-') && upper === prevValue.slice(0, -1)) {
        clean = clean.slice(0, -1);
      }
      const limited = clean.slice(0, 12);
      let formatted = limited.slice(0, 2);
      if (limited.length > 2) {
        formatted += '-' + limited.slice(2, 11);
      }
      if (limited.length > 11) {
        formatted += '-' + limited.slice(11, 12);
      }
      return formatted;
    }

    case 'Passport': {
      // 1-2 letters prefix, followed by digits and optional trailing letter
      const clean = upper.replace(/[^A-Z0-9]/g, '');
      return clean.slice(0, 9);
    }

    case "Voter's ID": {
      // Uppercase alphanumeric and hyphens
      const clean = upper.replace(/[^A-Z0-9\-]/g, '');
      return clean.slice(0, 25);
    }

    default:
      return upper.replace(/[^A-Z0-9\-\s]/g, '').slice(0, 30);
  }
};

/**
 * Formats Driver's License: 1 Letter + 10 digits as AXX-XX-XXXXXX
 */
function formatDriversLicense(raw: string): string {
  if (!raw) return '';
  const firstChar = raw[0];
  if (!/[A-Z]/.test(firstChar)) {
    return '';
  }
  const digits = raw.slice(1).replace(/\D/g, '').slice(0, 10);
  let formatted = firstChar;
  if (digits.length > 0) {
    formatted += digits.slice(0, 2);
  }
  if (digits.length > 2) {
    formatted += '-' + digits.slice(2, 4);
  }
  if (digits.length > 4) {
    formatted += '-' + digits.slice(4, 10);
  }
  return formatted;
}
