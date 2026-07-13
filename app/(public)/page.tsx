import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold text-igire">IGIRE</h1>
      <p className="text-gray-600">
        Invite-only event networking. Connect with participants, sector guests, and their
        plus-ones.
      </p>
      <Link
        href="/login"
        className="rounded-md bg-igire px-5 py-2.5 font-medium text-white hover:bg-igire-dark"
      >
        Sign in
      </Link>
      <p className="text-sm text-gray-400">Placeholder landing page.</p>
    </main>
  );
}
