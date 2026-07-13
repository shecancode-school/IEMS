import { redirect } from 'next/navigation';
import type { EventAttendee, Role } from '@prisma/client';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// Centralised authorization helpers. Every layout, page, and server action funnels
// through these so session + role + event-scoping checks are consistent and
// impossible to forget.

export class AuthorizationError extends Error {
  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

/** Return the current session user, or null if unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
  };
}

/** Require any authenticated user; redirect to /login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

/** Require an ADMIN user; redirect non-admins away. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') redirect('/dashboard');
  return user;
}

/**
 * Require that the current user is an attendee of the given event (or, when no
 * event id is provided, of *any* event). Redirects unauthenticated users to
 * /login and non-attendees to the landing page.
 */
export async function requireAttendee(eventId?: string): Promise<{
  user: SessionUser;
  attendee: EventAttendee;
}> {
  const user = await requireUser();
  const attendee = await db.eventAttendee.findFirst({
    where: { userId: user.id, ...(eventId ? { eventId } : {}) },
    orderBy: { createdAt: 'desc' },
  });
  if (!attendee) redirect('/');
  return { user, attendee };
}

/**
 * Assert (throwing, for use inside server actions) that a user is an attendee of
 * an event and return the attendee row. Use this to event-scope every mutation.
 */
export async function assertAttendeeInEvent(
  userId: string,
  eventId: string,
): Promise<EventAttendee> {
  const attendee = await db.eventAttendee.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (!attendee) throw new AuthorizationError('Not an attendee of this event');
  return attendee;
}
