'use server';

import { requireUser, assertAttendeeInEvent } from '@/lib/permissions';
import { requestMeetingSchema, respondMeetingSchema } from '@/lib/validation';
import { ok, fail, type ActionResult } from '@/lib/actions/types';

// ── Meeting server actions (STUBS) ──

/** An attendee requests a meeting with another attendee in a given slot. */
export async function requestMeeting(
  input: unknown,
): Promise<ActionResult<{ requestId: string }>> {
  const parsed = requestMeetingSchema.safeParse(input);
  if (!parsed.success) return fail('Invalid input', parsed.error.flatten().fieldErrors);

  const user = await requireUser();
  // Event-scoping: the requester must belong to the event they're acting in.
  await assertAttendeeInEvent(user.id, parsed.data.eventId);

  // TODO: verify recipient is in same event, slot belongs to event, create
  // MeetingRequest (PENDING), notify recipient.
  return ok({ requestId: 'stub' });
}

/** The recipient accepts or declines a pending request. */
export async function respondToMeeting(input: unknown): Promise<ActionResult> {
  const parsed = respondMeetingSchema.safeParse(input);
  if (!parsed.success) return fail('Invalid input', parsed.error.flatten().fieldErrors);

  await requireUser();
  // TODO: load request, assert current user is the recipient, transition status.
  // The partial unique index enforces one ACCEPTED meeting per (attendee, slot).
  return ok(undefined);
}

/** Requester or recipient cancels a meeting. */
export async function cancelMeeting(requestId: string): Promise<ActionResult> {
  await requireUser();
  if (!requestId) return fail('Missing request id');
  // TODO: assert participant, set status = CANCELLED.
  return ok(undefined);
}
