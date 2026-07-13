'use server';

import { requireUser } from '@/lib/permissions';
import { updateProfileSchema } from '@/lib/validation';
import { ok, fail, type ActionResult } from '@/lib/actions/types';

// ── Profile server actions (STUBS) ──

/** An attendee updates their own directory profile. */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return fail('Invalid input', parsed.error.flatten().fieldErrors);

  const user = await requireUser();

  // TODO: load attendee by parsed.data.attendeeId, assert it belongs to `user`,
  // then update headline / interests / visibleInDirectory.
  void user;
  return ok(undefined);
}

/** Toggle directory visibility as a quick action from settings. */
export async function setDirectoryVisibility(
  attendeeId: string,
  visible: boolean,
): Promise<ActionResult> {
  await requireUser();
  if (!attendeeId) return fail('Missing attendee id');
  // TODO: assert ownership, update visibleInDirectory.
  void visible;
  return ok(undefined);
}
