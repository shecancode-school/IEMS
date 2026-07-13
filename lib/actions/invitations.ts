'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { generateInviteToken, hashToken } from '@/lib/tokens';
import { sendInviteEmail } from '@/lib/email/send';
import { createInvitationSchema, claimInvitationSchema } from '@/lib/validation';
import { ok, fail, type ActionResult } from '@/lib/actions/types';

// ── Invitation server actions ──
// Each action: (1) validates with Zod, (2) checks session/role, (3) persists.

/** Admin creates + sends an invite. Generates a one-time token, stores only its
 *  hash, and emails the raw token to the guest. */
export async function createInvitation(
  input: unknown,
): Promise<ActionResult<{ invitationId: string; claimUrl: string }>> {
  const parsed = createInvitationSchema.safeParse(input);
  if (!parsed.success) return fail('Invalid input', parsed.error.flatten().fieldErrors);

  await requireAdmin();

  const { eventId, email, guestType, sector, invitedByAttendeeId, expiresInHours } = parsed.data;

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) return fail('Event not found');

  // Real security primitive: raw token emailed, only its hash persisted.
  const { token, tokenHash } = generateInviteToken();
  const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/invite/${token}`;
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  const invitation = await db.invitation.create({
    data: {
      eventId,
      email: email.toLowerCase().trim(),
      guestType,
      sector,
      invitedByAttendeeId,
      tokenHash,
      expiresAt,
      status: 'SENT',
    },
  });

  await sendInviteEmail({ to: email, eventName: event.name, claimUrl, guestType });

  revalidatePath('/admin/invitations');
  return ok({ invitationId: invitation.id, claimUrl });
}

/** Guest claims an invite via the raw token from their link. Creates (or reuses)
 *  the User + EventAttendee and marks the invitation ACCEPTED. */
export async function claimInvitation(
  input: unknown,
): Promise<ActionResult<{ eventId: string; email: string }>> {
  const parsed = claimInvitationSchema.safeParse(input);
  if (!parsed.success) return fail('Invalid input', parsed.error.flatten().fieldErrors);

  const { token, fullName } = parsed.data;

  // Constant-time-ish lookup: hash the presented token and match on the stored hash.
  const invitation = await db.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!invitation) return fail('Invalid or unknown invitation link');
  if (invitation.status === 'ACCEPTED') return fail('This invitation was already claimed');
  if (invitation.status === 'REVOKED') return fail('This invitation has been revoked');
  if (invitation.expiresAt < new Date()) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    return fail('This invitation has expired');
  }

  const email = invitation.email.toLowerCase().trim();

  // Create or reuse the user account for the invited email.
  const user = await db.user.upsert({
    where: { email },
    update: { fullName, name: fullName },
    create: { email, fullName, name: fullName, role: 'GUEST' },
  });

  // Create or reuse the attendee row for this event (unique on eventId+userId).
  await db.eventAttendee.upsert({
    where: { eventId_userId: { eventId: invitation.eventId, userId: user.id } },
    update: {},
    create: {
      eventId: invitation.eventId,
      userId: user.id,
      guestType: invitation.guestType,
      sector: invitation.sector,
      invitedByAttendeeId: invitation.invitedByAttendeeId,
    },
  });

  await db.invitation.update({
    where: { id: invitation.id },
    data: { status: 'ACCEPTED' },
  });

  return ok({ eventId: invitation.eventId, email });
}

/** Admin revokes a pending/sent invitation. */
export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!invitationId) return fail('Missing invitation id');

  const invitation = await db.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation) return fail('Invitation not found');
  if (invitation.status === 'ACCEPTED') return fail('Cannot revoke an accepted invitation');

  await db.invitation.update({
    where: { id: invitationId },
    data: { status: 'REVOKED' },
  });

  revalidatePath('/admin/invitations');
  return ok(undefined);
}
