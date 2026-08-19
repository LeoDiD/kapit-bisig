import { formatResidentFullName } from '../residentName';

describe('formatResidentFullName', () => {
  it('prefers first and last name over a stale full name', () => {
    expect(formatResidentFullName({
      firstName: '  Maria  Clara ',
      lastName: ' Santos  ',
      fullName: 'Maria',
    })).toBe('Maria Clara Santos');
  });

  it('uses the full name when a structured name part is missing', () => {
    expect(formatResidentFullName({
      firstName: 'Maria',
      fullName: 'Maria Santos',
    })).toBe('Maria Santos');
  });

  it('returns the available structured name when there is no fallback', () => {
    expect(formatResidentFullName({ lastName: 'Santos' })).toBe('Santos');
  });
});

