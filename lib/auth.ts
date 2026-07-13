import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Nodemailer from 'next-auth/providers/nodemailer';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';

import { db } from '@/lib/db';
import { sendMagicLinkEmail } from '@/lib/email/send';

// Extend the session/user types with our domain fields.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  secret: process.env.AUTH_SECRET,
  // JWT strategy is required for the Credentials (email+password) provider.
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=1',
  },
  providers: [
    // 1) Email + password.
    Credentials({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').toLowerCase().trim();
        const password = String(credentials?.password ?? '');
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),

    // 2) Google OAuth.
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // 3) Email magic-link (delivered via our Gmail mailer).
    Nodemailer({
      server: 'smtp://localhost:1025',
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        await sendMagicLinkEmail({ to: identifier, url });
      },
    }),
  ],
  callbacks: {
    // With JWT sessions, persist id/role on the token at sign-in.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role ?? 'GUEST';
      } else if (token.email && token.role === undefined) {
        // OAuth/magic-link: look up the role once the adapter has created the user.
        const dbUser = await db.user.findUnique({ where: { email: token.email } });
        token.id = dbUser?.id ?? token.id;
        token.role = dbUser?.role ?? 'GUEST';
      }
      return token;
    },
    // Surface id and role on the session for layouts/route guards.
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? '';
        session.user.role = (token.role as Role) ?? 'GUEST';
      }
      return session;
    },
  },
});
