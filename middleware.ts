import { NextResponse, type NextRequest } from 'next/server';

// Edge middleware gate for the (guest) and (admin) route groups.
//
// This is a coarse first line of defence: it only checks for the *presence* of
// an Auth.js session cookie so unauthenticated users never reach protected pages.
// The authoritative role/event-scoping checks run in the route-group layouts
// against the database (see lib/permissions.ts).
//
// We deliberately do NOT import lib/auth here: that module pulls in the Prisma
// adapter and the Nodemailer provider, neither of which runs in the Edge runtime.
// Reading the cookie name directly keeps middleware edge-safe.

const GUEST_PREFIXES = ['/dashboard', '/directory', '/profile', '/meetings', '/settings'];
const ADMIN_PREFIXES = ['/admin'];

// Auth.js v5 session cookie names (secure variant is used over HTTPS in prod).
const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token'];

function hasSession(req: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => Boolean(req.cookies.get(name)?.value));
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  const needsAuth =
    GUEST_PREFIXES.some((p) => pathname.startsWith(p)) ||
    ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  if (needsAuth && !hasSession(req)) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static assets and the auth API.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
