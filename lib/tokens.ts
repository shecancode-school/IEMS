import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

// Invite-token security primitives.
//
// A raw token is 32 random bytes, delivered to the guest exactly once inside
// the invite link. Only the SHA-256 hash is ever persisted, so a database leak
// cannot be used to claim invitations. Verification is constant-time.

/** Generate a fresh invite token. Returns both the raw value (email it, never
 *  store it) and its hash (store this on the Invitation row). */
export function generateInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

/** SHA-256 hash of a raw token, hex-encoded. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Constant-time comparison of a presented raw token against a stored hash. */
export function verifyToken(token: string, storedHash: string): boolean {
  const presented = Buffer.from(hashToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  if (presented.length !== stored.length) return false;
  return timingSafeEqual(presented, stored);
}
