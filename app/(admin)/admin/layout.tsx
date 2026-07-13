import Link from 'next/link';
import type { ReactNode } from 'react';

import { requireAdmin } from '@/lib/permissions';

// Admin layout guard: requires an authenticated user with role ADMIN.
// requireAdmin() redirects guests to /dashboard and anonymous users to /login.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <nav className="border-b bg-igire-dark text-white">
        <div className="mx-auto flex max-w-6xl gap-6 px-6 py-3 text-sm font-medium">
          <span className="font-bold">IGIRE Admin</span>
          <Link href="/admin/events" className="hover:underline">
            Events
          </Link>
          <Link href="/admin/invitations" className="hover:underline">
            Invitations
          </Link>
          <Link href="/admin/attendees" className="hover:underline">
            Attendees
          </Link>
          <Link href="/admin/checkin" className="hover:underline">
            Check-in
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
