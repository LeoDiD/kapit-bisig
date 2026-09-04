export interface LoginAttempt {
  attempts: number;
  lockedUntil: Date | null;
  lastAttempt: Date;
}

/**
 * Shared in-memory login-attempt state.
 * Replace with Redis when the API runs on more than one process.
 */
export const loginAttempts = new Map<string, LoginAttempt>();

export function clearLoginAttempts(email: string): void {
  loginAttempts.delete(email.trim().toLowerCase());
}

export function getLoginLockout(email: string): { locked: boolean; remainingSeconds: number; lockedUntil: Date | null } {
  const attempt = loginAttempts.get(email.trim().toLowerCase());
  const lockedUntil = attempt?.lockedUntil ?? null;
  const remainingMs = lockedUntil ? lockedUntil.getTime() - Date.now() : 0;
  return {
    locked: remainingMs > 0,
    remainingSeconds: Math.max(0, Math.ceil(remainingMs / 1000)),
    lockedUntil: remainingMs > 0 ? lockedUntil : null,
  };
}

export default loginAttempts;