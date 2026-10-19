'use server';

import { z } from 'zod';
import { sendEmail } from '@/lib/email/send';
import { welcomeEmail } from '@/lib/email/templates';
import { rateLimit } from '@/lib/security/rate-limit';
import { strapi, StrapiError } from '@/lib/strapi/client';

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  locale: z.enum(['es', 'en']),
  // Campo trampa invisible: los humanos lo dejan vacío, muchos bots lo llenan.
  company: z.string().max(0).optional(),
});

export type NewsletterState = { status: 'idle' | 'success' | 'invalid' | 'error' };

export async function subscribeToNewsletter(_: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    locale: formData.get('locale'),
    company: formData.get('company') ?? '',
  });
  if (!parsed.success) return { status: 'invalid' };
  if (parsed.data.company) return { status: 'success' }; // bot: se finge éxito
  if (!(await rateLimit('newsletter', 5, 10 * 60_000))) return { status: 'error' };

  const { email, locale } = parsed.data;
  try {
    await strapi('/newsletter-subscribers', { method: 'POST', auth: 'admin', body: { data: { email, locale, active: true } } });
    const mail = welcomeEmail(locale);
    await sendEmail({ to: email, ...mail });
  } catch (error) {
    // Si ya estaba suscrito (email único), se responde igual para no revelar quién está en la lista.
    if (!(error instanceof StrapiError && error.status === 400)) {
      console.error('[newsletter]', error);
      return { status: 'error' };
    }
  }
  return { status: 'success' };
}
