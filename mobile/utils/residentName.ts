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

