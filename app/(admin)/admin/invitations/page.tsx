import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/permissions';
import { createInvitation, revokeInvitation } from '@/lib/actions/invitations';

// Admin: invite guests to an event and track/revoke existing invitations.
export default async function AdminInvitationsPage() {
  await requireAdmin();

  const [events, invitations] = await Promise.all([
    db.event.findMany({ orderBy: { startsAt: 'desc' } }),
    db.invitation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { event: { select: { name: true } } },
    }),
  ]);

  async function invite(formData: FormData) {
    'use server';
    const result = await createInvitation({
      eventId: String(formData.get('eventId') ?? ''),
      email: String(formData.get('email') ?? ''),
      guestType: String(formData.get('guestType') ?? 'PARTICIPANT'),
      sector: (String(formData.get('sector') ?? '').trim() || undefined) as string | undefined,
      expiresInHours: 72,
    });
    if (!result.ok) {
      throw new Error(result.error);
    }
    revalidatePath('/admin/invitations');
  }

  async function revoke(formData: FormData) {
    'use server';
    await revokeInvitation(String(formData.get('invitationId') ?? ''));
    revalidatePath('/admin/invitations');
  }

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold">Invitations</h1>

      {events.length === 0 ? (
        <p className="text-sm text-red-600">
          No events exist yet. Seed or create an event before inviting guests.
        </p>
      ) : (
        <form action={invite} className="grid max-w-xl gap-3 rounded-lg border p-4">
          <h2 className="font-semibold">Invite a guest</h2>
          <label className="text-sm">
            Event
            <select name="eventId" required className="mt-1 w-full rounded-md border px-3 py-2">
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.status})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Guest email
            <input
              type="email"
              name="email"
              required
              placeholder="guest@example.com"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Guest type
            <select name="guestType" className="mt-1 w-full rounded-md border px-3 py-2">
              <option value="PARTICIPANT">Participant</option>
              <option value="SECTOR_GUEST">Sector guest</option>
              <option value="PLUS_ONE">Plus one</option>
            </select>
          </label>
          <label className="text-sm">
            Sector (optional)
            <input
              type="text"
              name="sector"
              placeholder="e.g. Fintech"
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-igire px-4 py-2 font-medium text-white hover:bg-igire-dark"
          >
            Send invitation
          </button>
        </form>
      )}

      <div>
        <h2 className="mb-3 font-semibold">Sent invitations ({invitations.length})</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Expires</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-gray-400">
                    No invitations yet.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="px-3 py-2">{inv.email}</td>
                    <td className="px-3 py-2">{inv.event.name}</td>
                    <td className="px-3 py-2">{inv.guestType}</td>
                    <td className="px-3 py-2">{inv.status}</td>
                    <td className="px-3 py-2">{inv.expiresAt.toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      {inv.status !== 'ACCEPTED' && inv.status !== 'REVOKED' && (
                        <form action={revoke}>
                          <input type="hidden" name="invitationId" value={inv.id} />
                          <button className="text-red-600 hover:underline">Revoke</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
