import {
  normalizeStep3IdNumber,
  getIdFormatInfo,
  isStep3IdNumberFormatValid,
  getIdDisplayCount,
  sanitizeIdInput,
} from '../idFormat';

describe('idFormat utilities', () => {
  describe('PhilSys ID', () => {
    it('formats input with hyphens every 4 digits up to 16 digits', () => {
      expect(sanitizeIdInput('PhilSys ID', '1234567890123456')).toBe('1234-5678-9012-3456');
    });

    it('handles backspace across hyphens', () => {
      const prev = '1234-';
      const typed = '1234';
      expect(sanitizeIdInput('PhilSys ID', typed, prev)).toBe('123');
    });

    it('validates 16 digits PCN and 12 digits PSN', () => {
      expect(isStep3IdNumberFormatValid('PhilSys ID', '1234-5678-9012-3456')).toBe(true);
      expect(isStep3IdNumberFormatValid('PhilSys ID', '1234-5678-9012')).toBe(true);
      expect(isStep3IdNumberFormatValid('PhilSys ID', '1234-5678')).toBe(false);
    });

    it('returns correct display count', () => {
      expect(getIdDisplayCount('PhilSys ID', '1234-5678-9012-3456')).toBe('16/16');
      expect(getIdDisplayCount('PhilSys ID', '1234-5678')).toBe('8/16');
    });
  });

  describe("Driver's License", () => {
    it('formats as AXX-XX-XXXXXX (1 letter + 10 digits)', () => {
      expect(sanitizeIdInput("Driver's License", 'N0123456789')).toBe('N01-23-456789');
    });

    it('rejects input that does not start with a letter', () => {
      expect(sanitizeIdInput("Driver's License", '123456')).toBe('');
    });

    it('handles backspace across hyphen', () => {
      const prev = 'N01-';
      const typed = 'N01';
      expect(sanitizeIdInput("Driver's License", typed, prev)).toBe('N0');
    });

    it('validates 1 letter + 10 digits', () => {
      expect(isStep3IdNumberFormatValid("Driver's License", 'N01-23-456789')).toBe(true);
      expect(isStep3IdNumberFormatValid("Driver's License", 'N0123456789')).toBe(true);
      expect(isStep3IdNumberFormatValid("Driver's License", '001-23-456789')).toBe(false);
      expect(isStep3IdNumberFormatValid("Driver's License", 'N01-23-45678')).toBe(false);
    });

    it('returns correct display count', () => {
      expect(getIdDisplayCount("Driver's License", 'N01-23-456789')).toBe('11/11');
    });
  });

  describe('SSS ID', () => {
    it('formats as XX-XXXXXXX-X (10 digits)', () => {
      expect(sanitizeIdInput('SSS ID', '0123456789')).toBe('01-2345678-9');
    });

    it('handles backspacing over hyphens', () => {
      const prev = '01-';
      const typed = '01';
      expect(sanitizeIdInput('SSS ID', typed, prev)).toBe('0');
    });

    it('validates exactly 10 digits', () => {
      expect(isStep3IdNumberFormatValid('SSS ID', '01-2345678-9')).toBe(true);
      expect(isStep3IdNumberFormatValid('SSS ID', '0123456789')).toBe(true);
      expect(isStep3IdNumberFormatValid('SSS ID', '01-2345678')).toBe(false);
    });

    it('returns correct display count', () => {
      expect(getIdDisplayCount('SSS ID', '01-2345678-9')).toBe('10/10');
    });
  });

  describe('PhilHealth ID', () => {
    it('formats as XX-XXXXXXXXX-X (12 digits)', () => {
      expect(sanitizeIdInput('PhilHealth ID', '123456789012')).toBe('12-345678901-2');
    });

    it('handles backspacing over hyphens', () => {
      const prev = '12-';
      const typed = '12';
      expect(sanitizeIdInput('PhilHealth ID', typed, prev)).toBe('1');
    });

    it('validates exactly 12 digits', () => {
      expect(isStep3IdNumberFormatValid('PhilHealth ID', '12-345678901-2')).toBe(true);
      expect(isStep3IdNumberFormatValid('PhilHealth ID', '123456789012')).toBe(true);
      expect(isStep3IdNumberFormatValid('PhilHealth ID', '12-345678901')).toBe(false);
    });

    it('returns correct display count', () => {
      expect(getIdDisplayCount('PhilHealth ID', '12-345678901-2')).toBe('12/12');
    });
  });

  describe('Passport', () => {
    it('limits to 9 uppercase alphanumeric chars', () => {
      expect(sanitizeIdInput('Passport', 'p1234567890')).toBe('P12345678');
    });

    it('validates standard 8-9 char passports', () => {
      expect(isStep3IdNumberFormatValid('Passport', 'P1234567')).toBe(true);
      expect(isStep3IdNumberFormatValid('Passport', 'P1234567A')).toBe(true);
      expect(isStep3IdNumberFormatValid('Passport', '12345678')).toBe(false);
    });

    it('returns correct display count', () => {
      expect(getIdDisplayCount('Passport', 'P1234567')).toBe('8/8');
    });
  });

  describe("Voter's ID", () => {
    it('accepts alphanumeric and hyphens', () => {
      expect(sanitizeIdInput("Voter's ID", '7501-0019a-c145bcd')).toBe('7501-0019A-C145BCD');
    });

    it('validates between 6 and 25 alphanumeric chars', () => {
      expect(isStep3IdNumberFormatValid("Voter's ID", '7501-0019A-C145BCD')).toBe(true);
      expect(isStep3IdNumberFormatValid("Voter's ID", '12345')).toBe(false);
    });

    it('returns correct display count', () => {
      expect(getIdDisplayCount("Voter's ID", '7501-0019A-C145BCD')).toBe('16/25');
    });
  });

  describe('getIdFormatInfo', () => {
    it('returns valid metadata for all supported IDs', () => {
      const types = ['PhilSys ID', "Driver's License", 'Passport', 'SSS ID', 'PhilHealth ID', "Voter's ID"];
      for (const t of types) {
        const info = getIdFormatInfo(t);
        expect(info.minLength).toBeGreaterThan(0);
        expect(info.maxLength).toBeGreaterThanOrEqual(info.minLength);
        expect(info.hint.length).toBeGreaterThan(0);
        expect(info.placeholder.length).toBeGreaterThan(0);
        expect(['number-pad', 'default']).toContain(info.keyboardType);
      }
    });
  });
});
