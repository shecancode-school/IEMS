import { redirect } from 'next/navigation';

import { db } from '@/lib/db';
import { hashToken } from '@/lib/tokens';
import { claimInvitation } from '@/lib/actions/invitations';

// Invite claim flow. The raw token from the link arrives as a route param; we
// hash it, preview the invitation, and let the guest confirm their name.
export default async function ClaimInvitePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  const invitation = await db.invitation.findUnique({
    where: { tokenHash: hashToken(params.token) },
    include: { event: { select: { name: true, startsAt: true, venue: true } } },
  });

  // Unknown / expired / spent invitations get a friendly dead-end.
  const invalidReason =
    !invitation
      ? 'This invitation link is invalid or unknown.'
      : invitation.status === 'ACCEPTED'
        ? 'This invitation has already been claimed. Please sign in.'
        : invitation.status === 'REVOKED'
          ? 'This invitation has been revoked.'
          : invitation.expiresAt < new Date()
            ? 'This invitation has expired.'
            : null;

  if (invalidReason) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold">Invitation unavailable</h1>
        <p className="text-gray-600">{invalidReason}</p>
        <a href="/login" className="text-igire hover:underline">
          Go to sign in →
        </a>
      </main>
    );
  }

  async function claim(formData: FormData) {
    'use server';
    const result = await claimInvitation({
      token: params.token,
      fullName: String(formData.get('fullName') ?? ''),
    });
    if (!result.ok) {
      redirect(`/invite/${params.token}?error=${encodeURIComponent(result.error)}`);
    }
    // Account + attendee created — send them to sign in with their invited email.
    redirect('/login?claimed=1');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-8">
      <div>
        <h1 className="text-2xl font-bold text-igire">You&apos;re invited 🎉</h1>
        <p className="mt-1 text-gray-600">
          {invitation!.event.name} · {invitation!.event.venue}
        </p>
        <p className="text-sm text-gray-400">
          {invitation!.event.startsAt.toLocaleDateString()} · as{' '}
          {invitation!.guestType.replace('_', ' ').toLowerCase()}
        </p>
      </div>

      {searchParams?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>
      )}

      <form action={claim} className="flex flex-col gap-3">
        <label className="text-sm">
          Your full name
          <input
            type="text"
            name="fullName"
            required
            minLength={2}
            placeholder="Jane Doe"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        <p className="text-xs text-gray-400">
          Claiming as <strong>{invitation!.email}</strong>. You&apos;ll sign in with this email.
        </p>
        <button
          type="submit"
          className="rounded-md bg-igire px-4 py-2 font-medium text-white hover:bg-igire-dark"
        >
          Accept invitation
        </button>
      </form>
    </main>
  );
}
