import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';

// Lazily construct the Resend client so builds/tests without a key don't crash.
// The actual send functions are stubbed (see `send.ts`) until wired for prod.
let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY ?? 'stub');
  }
  return client;
}

// Gmail (or other service) SMTP transport, configured from the env vars in
// `.env`: EMAIL_SERVICE / EMAIL_ADDRESS / EMAIL_PASSWORD. Built lazily and
// reused across sends.
let transporter: Transporter | null = null;

export function getSmtpTransport(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT ?? 465),
      secure: true,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
}

/** True when Gmail SMTP credentials are present in the environment. */
export function hasSmtpCredentials(): boolean {
  return Boolean(process.env.EMAIL_ADDRESS && process.env.EMAIL_PASSWORD);
}
