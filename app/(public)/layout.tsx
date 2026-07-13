import type { ReactNode } from 'react';

// Public layout — no auth required.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
