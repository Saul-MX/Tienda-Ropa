import 'server-only';
import { revalidateTag } from 'next/cache';
import type Stripe from 'stripe';
import { env } from '@/lib/env';
import { sendEmail } from '@/lib/email/send';
import { adminNewOrderEmail, orderConfirmationEmail } from '@/lib/email/templates';
import { toCents } from '@/lib/format';
import { CATALOG_TAG } from '@/lib/strapi/catalog';
import { strapi } from '@/lib/strapi/client';
import type { ListResponse, Order } from '@/lib/strapi/types';

const orderPopulate = { items: true, shippingAddress: true };

export async function getOrder(documentId: string): Promise<Order | null> {
  try {
    const res = await strapi<{ data: Order }>(`/orders/${documentId}`, { auth: 'admin', query: { populate: orderPopulate } });
    return res.data;
  } catch {
    return null;
  }
}

async function findOrderBy(filters: Record<string, unknown>): Promise<Order | null> {
  const res = await strapi<ListResponse<Order>>('/orders', {
    auth: 'admin',
    query: { filters, populate: orderPopulate, pagination: { pageSize: 1 } },
  });
  return res.data[0] ?? null;
}

async function updateOrder(documentId: string, data: Record<string, unknown>) {
  const res = await strapi<{ data: Order }>(`/orders/${documentId}`, {
    method: 'PUT',
    auth: 'admin',
    body: { data },
    query: { populate: orderPopulate },
  });
  return res.data;
}

type ShippingDetails = { name?: string | null; address?: Stripe.Address | null } | null | undefined;

/** Marca el pedido como pagado, descuenta inventario y envía correos. Idempotente. */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return;

  const orderId = session.metadata?.orderDocumentId;
  const order = orderId ? await getOrder(orderId) : await findOrderBy({ stripeSessionId: { $eq: session.id } });
  if (!order) {
    console.error(`[webhook] pedido no encontrado para la sesión ${session.id}`);
    return;
  }
  if (order.status !== 'pending' && order.status !== 'cancelled') return; // ya procesado

  // Defensa extra: lo cobrado debe coincidir con lo que calculó el servidor.
  if (session.amount_total !== toCents(order.total)) {
    console.error(`[webhook] monto distinto en ${order.orderNumber}: Stripe=${session.amount_total} pedido=${toCents(order.total)}`);
  }

  const shipping = ((session as unknown as { collected_information?: { shipping_details?: ShippingDetails } }).collected_information
    ?.shipping_details ?? (session as unknown as { shipping_details?: ShippingDetails }).shipping_details) as ShippingDetails;
  const address = shipping?.address;

  const updated = await updateOrder(order.documentId, {
    status: 'paid',
    paidAt: new Date().toISOString(),
    email: session.customer_details?.email ?? order.email,
    stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
    shippingAddress: {
      name: shipping?.name ?? session.customer_details?.name ?? null,
      line1: address?.line1 ?? null,
      line2: address?.line2 ?? null,
      city: address?.city ?? null,
      state: address?.state ?? null,
      postalCode: address?.postal_code ?? null,
      country: address?.country ?? null,
      phone: session.customer_details?.phone ?? null,
    },
  });

  await strapi(`/store/orders/${order.documentId}/apply-stock`, { method: 'POST', auth: 'admin' });
  revalidateTag(CATALOG_TAG, 'max');

  if (updated.email) {
    const mail = orderConfirmationEmail(updated);
    await sendEmail({ to: updated.email, ...mail });
  }
  const adminEmail = env().ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) await sendEmail({ to: adminEmail, ...adminNewOrderEmail(updated) });
}

export async function cancelCheckoutSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderDocumentId;
  const order = orderId ? await getOrder(orderId) : null;
  if (order?.status === 'pending') await updateOrder(order.documentId, { status: 'cancelled' });
}

export async function markRefunded(paymentIntentId: string) {
  const order = await findOrderBy({ stripePaymentIntentId: { $eq: paymentIntentId } });
  if (order && order.status !== 'refunded') await updateOrder(order.documentId, { status: 'refunded' });
}

export { updateOrder };
