import {
  getResendClient,
  getSmtpTransport,
  hasSmtpCredentials,
} from '@/lib/email/client';

// Typed transactional-email send functions.
//
// Implementations are STUBBED: in development they log to the console instead of
// hitting Resend. Flip `EMAIL_LIVE=1` (and provide a real RESEND_API_KEY /
// verified domain) to actually send. Keeping the surface typed means callers are
// already correct when the real implementation lands.

const FROM =
  process.env.EMAIL_FROM ??
  (process.env.EMAIL_ADDRESS
    ? `IGIRE <${process.env.EMAIL_ADDRESS}>`
    : 'IGIRE <no-reply@igire.example>');
const LIVE = process.env.EMAIL_LIVE === '1';

export interface SendResult {
  id: string;
  stubbed: boolean;
}

interface BaseEmail {
  to: string;
}

export interface MagicLinkEmail extends BaseEmail {
  url: string;
}

export interface InviteEmail extends BaseEmail {
  eventName: string;
  claimUrl: string;
  guestType: string;
}

export interface MeetingNotificationEmail extends BaseEmail {
  fromName: string;
  eventName: string;
  slotLabel: string;
}

async function deliver(
  subject: string,
  to: string,
  html: string,
): Promise<SendResult> {
  // Prefer Gmail/SMTP when credentials are configured (see `.env`). This is the
  // path used for real login emails.
  if (hasSmtpCredentials()) {
    const info = await getSmtpTransport().sendMail({
      from: FROM,
      to,
      subject,
      html,
      cc: process.env.CC_EMAIL_ADDRESS || undefined,
    });
    return { id: info.messageId, stubbed: false };
  }
  if (!LIVE) {
    // eslint-disable-next-line no-console
    console.warn(`[email:stub] to=${to} subject="${subject}"`);
    return { id: `stub_${Date.now()}`, stubbed: true };
  }
  const { data, error } = await getResendClient().emails.send({
    from: FROM,
    to,
    subject,
    html,
  });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
  return { id: data?.id ?? 'unknown', stubbed: false };
}

/** Auth.js magic-link sign-in email. */
export function sendMagicLinkEmail({ to, url }: MagicLinkEmail): Promise<SendResult> {
  return deliver('Sign in to IGIRE', to, `<p>Sign in: <a href="${url}">${url}</a></p>`);
}

/** Admin-sent invitation with a one-time claim link. */
export function sendInviteEmail({
  to,
  eventName,
  claimUrl,
  guestType,
}: InviteEmail): Promise<SendResult> {
  return deliver(
    `You're invited to ${eventName}`,
    to,
    `<p>You have a ${guestType} invitation to ${eventName}.</p>
     <p>Claim it: <a href="${claimUrl}">${claimUrl}</a></p>`,
  );
}

/** Notify an attendee that someone requested a meeting. */
export function sendMeetingNotificationEmail({
  to,
  fromName,
  eventName,
  slotLabel,
}: MeetingNotificationEmail): Promise<SendResult> {
  return deliver(
    `New meeting request at ${eventName}`,
    to,
    `<p>${fromName} requested a meeting during ${slotLabel}.</p>`,
  );
}
