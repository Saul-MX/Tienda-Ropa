'use server';

import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCustomer } from '@/lib/auth/session';
import { cartInputSchema, priceCart } from '@/lib/checkout/pricing';
import { toCents } from '@/lib/format';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { localizePath } from '@/lib/i18n/routes';
import { rateLimit } from '@/lib/security/rate-limit';
import { absoluteUrl } from '@/lib/site';
import { strapi } from '@/lib/strapi/client';
import { stripe } from '@/lib/stripe';

const localeSchema = z.string().refine(isLocale);

/** Lo que el navegador puede ver del carrito: sin objetos internos de Strapi. */
export type CartSummary = {
  currency: 'mxn' | 'usd';
  lines: {
    sku: string;
    quantity: number;
    requested: number;
    stock: number;
    unitPrice: number;
    regularPrice: number;
    name: string;
    slug: string;
    brand: string | null;
    size: string;
    color: string | null;
    image: string | null;
  }[];
  unavailable: string[];
  adjusted: boolean;
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingMin: number;
};

export async function getCartSummary(lines: unknown, locale: unknown): Promise<CartSummary | null> {
  const parsedLines = cartInputSchema.safeParse(lines);
  const parsedLocale = localeSchema.safeParse(locale);
  if (!parsedLines.success || !parsedLocale.success) return null;

  const cart = await priceCart(parsedLines.data, parsedLocale.data as Locale);
  return {
    ...cart,
    lines: cart.lines.map((l) => ({
      sku: l.sku,
      quantity: l.quantity,
      requested: l.requested,
      stock: l.stock,
      unitPrice: l.unitPrice,
      regularPrice: l.regularPrice,
      name: l.name,
      slug: l.slug,
      brand: l.brand,
      size: l.size,
      color: l.color,
      image: l.image,
    })),
  };
}

export type CheckoutResult = { error: 'empty' | 'stock' | 'generic' | 'rate' };

function orderNumber() {
  const d = new Date();
  const date = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  return `SDT-${date}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

/**
 * Crea un pedido "pendiente" en Strapi y una sesión de Stripe Checkout con los precios
 * calculados en el servidor. El pedido pasa a "pagado" solo cuando Stripe lo confirma
 * por webhook firmado; la página de éxito nunca marca nada como pagado.
 */
export async function startCheckout(lines: unknown, locale: unknown): Promise<CheckoutResult> {
  const parsedLines = cartInputSchema.safeParse(lines);
  const parsedLocale = localeSchema.safeParse(locale);
  if (!parsedLines.success || !parsedLocale.success) return { error: 'generic' };
  if (!parsedLines.data.length) return { error: 'empty' };
  if (!(await rateLimit('checkout', 10, 10 * 60_000))) return { error: 'rate' };

  const loc = parsedLocale.data as Locale;
  const cart = await priceCart(parsedLines.data, loc);
  if (!cart.lines.length) return { error: 'empty' };
  if (cart.unavailable.length || cart.adjusted) return { error: 'stock' };

  const customer = await getCustomer().catch(() => null);
  const number = orderNumber();
  let sessionUrl: string | null = null;

  try {
    const order = await strapi<{ data: { documentId: string } }>('/orders', {
      method: 'POST',
      auth: 'admin',
      body: {
        data: {
          orderNumber: number,
          email: customer?.email ?? null,
          customer: customer?.documentId ?? null,
          status: 'pending',
          currency: cart.currency,
          locale: loc,
          subtotal: cart.subtotal,
          shippingCost: cart.shipping,
          total: cart.total,
          items: cart.lines.map((l) => ({
            sku: l.sku,
            productDocumentId: l.product.documentId,
            productName: l.product.name,
            productSlug: l.slug,
            brandName: l.brand,
            categoryName: l.product.category?.name ?? null,
            gender: l.product.gender,
            size: l.size,
            colorName: l.variant.color?.name ?? null,
            image: l.image,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        },
      },
    });

    const orderId = order.data.documentId;
    const session = await stripe().checkout.sessions.create(
      {
        mode: 'payment',
        locale: loc,
        client_reference_id: number,
        customer_email: customer?.email,
        line_items: cart.lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: cart.currency,
            unit_amount: toCents(l.unitPrice),
            product_data: {
              name: l.name,
              description: [l.brand, l.color, l.size].filter(Boolean).join(' · '),
              images: l.image?.startsWith('https://') ? [l.image] : undefined,
              metadata: { sku: l.sku },
            },
          },
        })),
        shipping_address_collection: { allowed_countries: ['MX', 'US'] },
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              display_name: cart.shipping === 0 ? (loc === 'es' ? 'Envío gratis' : 'Free shipping') : loc === 'es' ? 'Envío estándar' : 'Standard shipping',
              fixed_amount: { amount: toCents(cart.shipping), currency: cart.currency },
              delivery_estimate: { minimum: { unit: 'business_day', value: 3 }, maximum: { unit: 'business_day', value: 7 } },
            },
          },
        ],
        phone_number_collection: { enabled: true },
        metadata: { orderDocumentId: orderId, orderNumber: number },
        payment_intent_data: { metadata: { orderDocumentId: orderId, orderNumber: number } },
        success_url: `${absoluteUrl(localizePath(loc, '/checkout/exito'))}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: absoluteUrl(localizePath(loc, '/carrito')),
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hora
      },
      { idempotencyKey: `checkout-${orderId}` },
    );

    await strapi(`/orders/${orderId}`, { method: 'PUT', auth: 'admin', body: { data: { stripeSessionId: session.id } } });
    sessionUrl = session.url;
  } catch (error) {
    console.error('[checkout]', error);
    return { error: 'generic' };
  }

  if (!sessionUrl) return { error: 'generic' };
  redirect(sessionUrl);
}
