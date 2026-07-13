# IGIRE

Recurring, invite-only event networking platform. Guests join via admin-sent
one-time invite links, build a profile, browse a directory, and request meetings
in admin-defined slots. Admins scan QR codes at the door to record attendance.

> **Status:** production-grade scaffold. Structure, tooling, schema, auth guards,
> and CI are real and runnable. Business logic in the server actions is stubbed.

## Stack

- **Next.js 14** (App Router, TypeScript strict, Server Components + Server Actions)
- **MongoDB + Prisma** (replica set required by the Prisma connector)
- **Auth.js (NextAuth v5)** — email magic-link provider (mailer stubbed)
- **Tailwind CSS**
- **Resend** for email (typed send functions, stubbed)
- **Zod** for input validation at every server-action boundary
- **Vitest** for unit tests

## Local setup (under 5 commands)

```bash
cp .env.example .env          # 1. configure env (defaults match docker-compose)
docker compose up -d          # 2. start MongoDB 7 as a single-node replica set
npm install                   # 3. install deps
npm run db:migrate && npm run db:indexes && npm run db:seed   # 4. push schema, create partial indexes, seed
npm run dev                   # 5. run the app at http://localhost:3000
```

Then visit:

- `/` — public landing
- `/login` — magic-link sign-in (link is logged to the console in dev)
- `/dashboard` — guest area (guarded: requires an EventAttendee session)
- `/admin` — admin area (guarded: requires role `ADMIN`)

## npm scripts

| Script            | Purpose                                       |
| ----------------- | --------------------------------------------- |
| `dev`             | Start the Next.js dev server                  |
| `build`           | `prisma generate` + production build          |
| `db:migrate`      | Push schema to MongoDB (`prisma db push`)     |
| `db:indexes`      | Create partial unique meeting indexes         |
| `db:seed`         | Seed sample data                              |
| `db:studio`       | Open Prisma Studio                            |
| `lint`            | ESLint                                        |
| `typecheck`       | `tsc --noEmit` (strict, no `any`)             |
| `test`            | Vitest                                        |

## Environment variables

| Variable              | Description                                         |
| --------------------- | --------------------------------------------------- |
| `DATABASE_URL`        | MongoDB connection string (must target a replica set) |
| `AUTH_SECRET`         | Auth.js token signing secret (`openssl rand -base64 32`) |
| `RESEND_API_KEY`      | Resend API key for transactional email              |
| `NEXT_PUBLIC_APP_URL` | Public base URL used to build invite/magic links    |
| `EMAIL_FROM`          | From-address for outgoing email                     |
| `EMAIL_LIVE`          | Set to `1` to actually send via Resend (else stub)  |

## Architecture

```
app/
  (public)/      landing + invite/[token] claim flow
  (auth)/login/  magic-link sign-in
  (guest)/       dashboard, directory, profile/[attendeeId], meetings, settings
                 → layout guard requires an EventAttendee session
  (admin)/admin/ events, invitations, attendees, checkin
                 → layout guard requires role ADMIN
lib/
  db.ts          singleton PrismaClient
  auth.ts        Auth.js (NextAuth v5) config, magic-link provider
  permissions.ts session + role + event-scoping guards
  tokens.ts      invite-token crypto (randomBytes → SHA-256, constant-time verify)
  validation.ts  Zod schemas for all action inputs
  email/         Resend client + typed, stubbed send functions
  actions/       invitations, meetings, profiles, checkin (typed stubs)
prisma/
  schema.prisma  domain + Auth.js adapter models (MongoDB provider)
  indexes.ts     creates partial unique meeting indexes via $runCommandRaw
  seed.ts        1 admin, 1 LIVE event, 8 slots, 6 attendees (1 linked plus-one)
middleware.ts    edge gate for (guest)/(admin) route groups
```

### Security defaults

- **Invite tokens:** 32 random bytes via `crypto.randomBytes`; only the SHA-256
  hash is stored; presented tokens are compared in constant time.
- **Server actions:** every action validates input with Zod and checks
  session + role + event scoping before touching the database.
- **Route protection:** middleware gates the `(guest)` and `(admin)` groups;
  layouts perform the authoritative DB-backed role/attendee checks.
- **No secrets committed:** `.env` is gitignored; `.env.example` documents every var.

### Data model highlights

- `EventAttendee` carries the **+1 lineage** via a self-relation
  (`invitedByAttendeeId`, relation `InvitedBy`).
- A partial unique index enforces **one `ACCEPTED` meeting per (attendee, slot)**,
  covering both the requester and recipient sides. Prisma can't express partial
  indexes for MongoDB, so they're created in `prisma/indexes.ts` (`npm run db:indexes`).

## CI

`.github/workflows/ci.yml` runs on every PR: start a MongoDB replica set → install →
prisma generate/validate → db push + create indexes → lint → typecheck → test → build.
