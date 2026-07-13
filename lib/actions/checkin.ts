'use server';

import { requireAdmin } from '@/lib/permissions';
import { checkInSchema } from '@/lib/validation';
import { ok, fail, type ActionResult } from '@/lib/actions/types';

// ── Check-in server actions (STUBS) ──

/** Admin scans a QR code at the door and marks the attendee present. The QR
 *  payload is the attendee's unique `checkInCode`. */
export async function checkInByCode(
  input: unknown,
): Promise<ActionResult<{ attendeeId: string }>> {
  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) return fail('Invalid input', parsed.error.flatten().fieldErrors);

  const admin = await requireAdmin();

  // TODO: find EventAttendee by { eventId, checkInCode }, ensure not already
  // checked in, set checkedInAt = now() and checkedInBy = admin.id.
  void admin;
  return ok({ attendeeId: 'stub' });
}

/** Admin manually reverses a check-in (mistaken scan). */
export async function undoCheckIn(attendeeId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!attendeeId) return fail('Missing attendee id');
  // TODO: clear checkedInAt / checkedInBy, scoped to the admin's event.
  return ok(undefined);
}
