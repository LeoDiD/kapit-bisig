export interface ResidentNameParts {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
}

function cleanName(value?: string | null): string {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export function formatResidentFullName({
  firstName,
  lastName,
  fullName,
}: ResidentNameParts): string {
  const cleanFirstName = cleanName(firstName);
  const cleanLastName = cleanName(lastName);
  const composedName = [cleanFirstName, cleanLastName].filter(Boolean).join(' ');

  if (cleanFirstName && cleanLastName) return composedName;
  return cleanName(fullName) || composedName;
}

export function normalizeResidentName(parts: ResidentNameParts): {
  firstName: string;
  lastName: string;
  fullName: string;
} {
  const fallbackParts = cleanName(parts.fullName).split(' ').filter(Boolean);
  const firstName = cleanName(parts.firstName) || fallbackParts[0] || '';
  const lastName = cleanName(parts.lastName) || (fallbackParts.length > 1 ? fallbackParts[fallbackParts.length - 1] : '');

  return {
    firstName,
    lastName,
    fullName: formatResidentFullName({ firstName, lastName, fullName: parts.fullName }),
  };
}

