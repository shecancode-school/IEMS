import { describe, it, expect } from 'vitest';

import { createInvitationSchema, requestMeetingSchema } from '@/lib/validation';
import { generateInviteToken, verifyToken, hashToken } from '@/lib/tokens';

describe('createInvitationSchema', () => {
  it('accepts a valid PARTICIPANT invitation and applies the default expiry', () => {
    const result = createInvitationSchema.safeParse({
      eventId: 'clh000000000000000000000',
      email: 'guest@example.com',
      guestType: 'PARTICIPANT',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expiresInHours).toBe(72);
    }
  });

  it('rejects an invalid email and unknown guest type', () => {
    const result = createInvitationSchema.safeParse({
      eventId: 'clh000000000000000000000',
      email: 'not-an-email',
      guestType: 'VIP',
    });
    expect(result.success).toBe(false);
  });
});

describe('requestMeetingSchema', () => {
  it('requires cuid ids', () => {
    const result = requestMeetingSchema.safeParse({
      eventId: 'x',
      slotId: 'y',
      recipientId: 'z',
    });
    expect(result.success).toBe(false);
  });
});

describe('invite tokens', () => {
  it('verifies a freshly generated token against its stored hash', () => {
    const { token, tokenHash } = generateInviteToken();
    expect(tokenHash).toBe(hashToken(token));
    expect(verifyToken(token, tokenHash)).toBe(true);
  });

  it('rejects a tampered token', () => {
    const { token, tokenHash } = generateInviteToken();
    expect(verifyToken(`${token}x`, tokenHash)).toBe(false);
  });
});
