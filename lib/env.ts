import { z } from 'zod';

// Validate environment variables once at module load so misconfiguration fails
// loudly and early rather than deep inside a request.
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  EMAIL_FROM: z.string().min(1).default('IGIRE <no-reply@igire.example>'),
});

// During `next build` / lint on CI some vars may be absent; use a permissive
// parse so the type is still available. Runtime code paths that actually need a
// value should read from `env`.
const parsed = envSchema.safeParse(process.env);

export const env: z.infer<typeof envSchema> = parsed.success
  ? parsed.data
  : ({
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      AUTH_SECRET: process.env.AUTH_SECRET ?? '',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      EMAIL_FROM: process.env.EMAIL_FROM ?? 'IGIRE <no-reply@igire.example>',
    } as z.infer<typeof envSchema>);
