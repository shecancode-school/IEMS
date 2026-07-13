import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth';
import { db } from '@/lib/db';

// Login page. Three ways in: email+password, Google OAuth, or a magic link.
export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; verify?: string; claimed?: string };
}) {
  async function passwordSignIn(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    try {
      // redirect:false so we can route by role after the session is set.
      await signIn('credentials', { email, password, redirect: false });
    } catch (error) {
      // AuthError = bad credentials/config → show a message.
      if (error instanceof AuthError) {
        redirect('/login?error=CredentialsSignin');
      }
      throw error;
    }
    // Admins go to the admin console; everyone else to the guest dashboard.
    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    redirect(user?.role === 'ADMIN' ? '/admin' : '/dashboard');
  }

  async function googleSignIn() {
    'use server';
    await signIn('google', { redirectTo: '/dashboard' });
  }

  async function requestMagicLink(formData: FormData) {
    'use server';
    const email = String(formData.get('magicEmail') ?? '');
    await signIn('nodemailer', { email, redirectTo: '/dashboard' });
  }

  const errorMessage =
    searchParams?.error === 'CredentialsSignin' ? 'Invalid email or password.' : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-igire">Sign in to IGIRE</h1>
        <p className="mt-1 text-sm text-gray-500">Use your email and password, or Google.</p>
      </div>

      {errorMessage && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
      )}

      {searchParams?.claimed === '1' && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Invitation accepted! Sign in with your invited email (magic link or Google) to reach your
          dashboard.
        </p>
      )}

      {/* Email + password */}
      <form action={passwordSignIn} className="flex flex-col gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="rounded-md border border-gray-300 px-3 py-2"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="Password"
          className="rounded-md border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-igire px-4 py-2 font-medium text-white hover:bg-igire-dark"
        >
          Sign in
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" /> or <span className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Google */}
      <form action={googleSignIn}>
        <button
          type="submit"
          className="w-full rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
        >
          Continue with Google
        </button>
      </form>

      {/* Magic link */}
      <form action={requestMagicLink} className="flex flex-col gap-2">
        <input
          type="email"
          name="magicEmail"
          required
          placeholder="you@example.com"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md px-4 py-2 text-sm font-medium text-igire hover:underline"
        >
          Or email me a magic link
        </button>
      </form>
    </main>
  );
}
