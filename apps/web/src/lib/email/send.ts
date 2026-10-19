import 'server-only';
import { Resend } from 'resend';
import { env } from '@/lib/env';

let client: Resend | null = null;

/** Envía un correo con Resend. Si no hay API key (desarrollo), solo lo registra en consola. */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const { RESEND_API_KEY, EMAIL_FROM } = env();
  if (!RESEND_API_KEY) {
    console.info(`[email omitido: falta RESEND_API_KEY] ${subject} → ${to}`);
    return;
  }
  client ??= new Resend(RESEND_API_KEY);
  const { error } = await client.emails.send({ from: EMAIL_FROM, to, subject, html });
  if (error) console.error('[resend]', error.name, error.message);
}
