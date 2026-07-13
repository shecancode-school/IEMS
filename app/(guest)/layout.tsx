import Link from 'next/link';
import type { ReactNode } from 'react';

import { requireAttendee } from '@/lib/permissions';

// Guest layout guard: requires an authenticated user who is an EventAttendee of
// at least one event. Non-attendees are redirected inside requireAttendee().
export default async function GuestLayout({ children }: { children: ReactNode }) {
  await requireAttendee();

  return (
    <div className="min-h-screen">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl gap-6 px-6 py-3 text-sm font-medium">
          <Link href="/dashboard" className="hover:text-igire">
            Dashboard
          </Link>
          <Link href="/directory" className="hover:text-igire">
            Directory
          </Link>
          <Link href="/meetings" className="hover:text-igire">
            Meetings
          </Link>
          <Link href="/settings" className="ml-auto hover:text-igire">
            Settings
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
