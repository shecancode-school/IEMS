import { z } from 'zod';

// Central Zod schemas used at server-action boundaries. Keeping them here makes
// them reusable in unit tests (see lib/validation.test.ts) and forms.

export const guestTypeSchema = z.enum(['PARTICIPANT', 'PLUS_ONE', 'SECTOR_GUEST']);

export const createInvitationSchema = z.object({
  eventId: z.string().cuid(),
  email: z.string().email(),
  guestType: guestTypeSchema,
  sector: z.string().min(1).max(120).optional(),
  invitedByAttendeeId: z.string().cuid().optional(),
  expiresInHours: z.number().int().positive().max(24 * 30).default(72),
});
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

export const claimInvitationSchema = z.object({
  token: z.string().min(20),
  fullName: z.string().min(2).max(120),
});
export type ClaimInvitationInput = z.infer<typeof claimInvitationSchema>;

export const updateProfileSchema = z.object({
  attendeeId: z.string().cuid(),
  headline: z.string().max(160).optional(),
  interests: z.array(z.string().min(1).max(40)).max(20).default([]),
  visibleInDirectory: z.boolean().default(true),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const requestMeetingSchema = z.object({
  eventId: z.string().cuid(),
  slotId: z.string().cuid(),
  recipientId: z.string().cuid(),
  message: z.string().max(500).optional(),
});
export type RequestMeetingInput = z.infer<typeof requestMeetingSchema>;

export const respondMeetingSchema = z.object({
  requestId: z.string().cuid(),
  decision: z.enum(['ACCEPTED', 'DECLINED']),
});
export type RespondMeetingInput = z.infer<typeof respondMeetingSchema>;

export const checkInSchema = z.object({
  eventId: z.string().cuid(),
  checkInCode: z.string().min(1),
});
export type CheckInInput = z.infer<typeof checkInSchema>;
