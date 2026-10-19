'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { sendEmail } from '@/lib/email/send';
import { orderShippedEmail } from '@/lib/email/templates';
import { getOrder, updateOrder } from '@/lib/orders';
import { REVIEWS_TAG } from '@/lib/strapi/catalog';
import { strapi } from '@/lib/strapi/client';

const documentId = z.string().regex(/^[a-z0-9]{10,40}$/i);

const statusSchema = z.object({
  documentId,
  status: z.enum(['paid', 'shipped', 'delivered', 'cancelled']),
  carrier: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(80).regex(/^[A-Za-z0-9 -]*$/).optional(),
  notify: z.literal('on').optional(),
});

export type AdminActionState = { ok?: boolean; error?: string };

/**
 * Cambia el estado de un pedido. Los reembolsos se hacen en Stripe:
 * el webhook charge.refunded actualiza el pedido automáticamente.
 */
export async function updateOrderStatus(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Datos inválidos. Revisa la guía (solo letras, números y guiones).' };

  const { documentId: id, status, carrier, trackingNumber, notify } = parsed.data;
  const order = await getOrder(id);
  if (!order) return { error: 'Pedido no encontrado.' };
  if (order.status === 'pending' || order.status === 'refunded') {
    return { error: 'Este pedido no está pagado o ya fue reembolsado; no se puede cambiar desde aquí.' };
  }

  const now = new Date().toISOString();
  const updated = await updateOrder(id, {
    status,
    carrier: carrier || order.carrier,
    trackingNumber: trackingNumber || order.trackingNumber,
    ...(status === 'shipped' && !order.shippedAt ? { shippedAt: now } : {}),
    ...(status === 'delivered' && !order.deliveredAt ? { deliveredAt: now } : {}),
  });

  if (status === 'shipped' && notify && updated.email) {
    await sendEmail({ to: updated.email, ...orderShippedEmail(updated) });
  }

  revalidatePath(`/admin/pedidos/${id}`);
  return { ok: true };
}

export async function moderateReview(formData: FormData) {
  await requireAdmin();
  const id = documentId.parse(formData.get('documentId'));
  const intent = z.enum(['approve', 'hide', 'delete']).parse(formData.get('intent'));

  if (intent === 'delete') {
    await strapi(`/reviews/${id}`, { method: 'DELETE', auth: 'admin' });
  } else {
    await strapi(`/reviews/${id}`, { method: 'PUT', auth: 'admin', body: { data: { approved: intent === 'approve' } } });
  }
  revalidateTag(REVIEWS_TAG, 'max');
  revalidatePath('/admin/resenas');
}
