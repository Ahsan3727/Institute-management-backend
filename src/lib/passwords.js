import bcrypt from 'bcryptjs';

// Cost factor for bcrypt. 12 is a reasonable default for a serverless
// environment in 2026 — high enough to be resistant to offline cracking,
// low enough not to blow request time budgets.
const SALT_ROUNDS = 12;

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Hash a plaintext password. Always await this before storing anything in
 * Mongo — nothing in this codebase should ever write `password` as a raw
 * string to the database again.
 */
export async function hashPassword(plain) {
  if (typeof plain !== 'string' || !plain) {
    throw new Error('hashPassword requires a non-empty string.');
  }
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash. Returns false (never
 * throws) for malformed input so callers can treat it as "wrong password"
 * rather than a 500.
 */
export async function verifyPassword(plain, hash) {
  if (typeof plain !== 'string' || typeof hash !== 'string' || !plain || !hash) {
    return false;
  }
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/**
 * Minimal password-strength check used at account-creation time.
 * Returns null when the password is acceptable, or an error string when not.
 */
export function validatePasswordStrength(plain) {
  if (typeof plain !== 'string' || plain.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

/**
 * Generates a random temporary password for accounts created without an
 * explicit password (e.g. bulk import rows that left the column blank).
 * Callers should set `mustChangePassword: true` alongside this.
 */
export function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  const bytes = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length];
  return out;
}
