import StaffUser, { IStaffUser } from '../models/StaffUser';

const DEFAULT_SUPERADMIN_EMAIL = 'kapitbisig2026@gmail.com';
const DEFAULT_SUPERADMIN_PASSWORD_HASH =
  '$2b$12$V5PHd.zJhzX0b5LaT7VimeKQMO9wvY9Re1dA9kzv.UzeL7jzWOdWO'; // KapitBisig@LGU2026!Xyz

export interface EnsureSuperadminResult {
  user: IStaffUser;
  created: boolean;
  updated: boolean;
}

/**
 * Ensures a database-backed SUPERADMIN user exists in the StaffUser collection.
 * Idempotent: Can be safely called on server startup or from migration scripts.
 */
export async function ensureSuperadminExists(): Promise<EnsureSuperadminResult> {
  const email = (process.env.SUPERADMIN_EMAIL || DEFAULT_SUPERADMIN_EMAIL).trim();
  const emailLower = email.toLowerCase();
  const passwordHash = (
    process.env.SUPERADMIN_PASSWORD_HASH || DEFAULT_SUPERADMIN_PASSWORD_HASH
  ).trim();

  // First check if an account with role SUPERADMIN already exists (by role or by email)
  let superadmin = await StaffUser.findOne({
    $or: [{ role: 'SUPERADMIN' }, { emailLower }],
  }).select('+passwordHash');

  if (!superadmin) {
    superadmin = new StaffUser({
      email,
      emailLower,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPERADMIN',
      passwordHash,
      isActive: true,
      emailVerified: true,
      forcePasswordReset: false,
      assignedBarangays: [],
    });
    await superadmin.save();
    console.log(`[BOOTSTRAP] Created database-backed SUPERADMIN account (${email})`);
    return { user: superadmin, created: true, updated: false };
  }

  let wasUpdated = false;

  if (superadmin.role !== 'SUPERADMIN') {
    superadmin.role = 'SUPERADMIN';
    wasUpdated = true;
  }

  if (!superadmin.isActive) {
    superadmin.isActive = true;
    wasUpdated = true;
  }

  if (superadmin.forcePasswordReset) {
    superadmin.forcePasswordReset = false;
    wasUpdated = true;
  }

  // If passwordHash was missing on the document, ensure it is set
  if (!superadmin.passwordHash) {
    superadmin.passwordHash = passwordHash;
    wasUpdated = true;
  }

  if (wasUpdated) {
    await superadmin.save();
    console.log(`[BOOTSTRAP] Synchronized database-backed SUPERADMIN account (${superadmin.email})`);
  }

  return { user: superadmin, created: false, updated: wasUpdated };
}
