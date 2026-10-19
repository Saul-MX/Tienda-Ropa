'use server';

import { z } from 'zod';
import { getCustomer } from '@/lib/auth/session';
import { rateLimit } from '@/lib/security/rate-limit';
import { strapi } from '@/lib/strapi/client';

const schema = z.object({
  productDocumentId: z.string().regex(/^[a-z0-9]{10,40}$/i),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(100).optional(),
  body: z.string().trim().min(10).max(2000),
  authorName: z.string().trim().min(2).max(60),
});

export type ReviewState = { status: 'idle' | 'success' | 'login' | 'invalid' | 'error'; errors?: Record<string, string> };

export async function submitReview(_: ReviewState, formData: FormData): Promise<ReviewState> {
  const customer = await getCustomer();
  if (!customer) return { status: 'login' };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
    return { status: 'invalid', errors };
  }
  if (!(await rateLimit(`review:${customer.id}`, 3, 60 * 60_000))) return { status: 'error' };

  const { productDocumentId, ...review } = parsed.data;
  try {
    // Siempre entra como no aprobada: se publica cuando el admin la aprueba en el dashboard.
    await strapi('/reviews', {
      method: 'POST',
      auth: 'admin',
      body: { data: { ...review, product: productDocumentId, user: customer.documentId, approved: false } },
    });
    return { status: 'success' };
  } catch (error) {
    console.error('[review]', error);
    return { status: 'error' };
  }
}
