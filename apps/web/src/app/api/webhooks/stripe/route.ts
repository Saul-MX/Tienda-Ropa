import type Stripe from 'stripe';
import { env } from '@/lib/env';
import { cancelCheckoutSession, fulfillCheckoutSession, markRefunded } from '@/lib/orders';
import { stripe } from '@/lib/stripe';

/**
 * Webhook de Stripe. Solo se confía en eventos con firma válida (STRIPE_WEBHOOK_SECRET):
 * nadie puede marcar un pedido como pagado llamando a esta URL directamente.
 */
export async function POST(request: Request) {
  const secret = env().STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response('Webhook not configured', { status: 503 });
  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  const body = await request.text();
  if (body.length > 1_000_000) return new Response('Payload too large', { status: 413 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await fulfillCheckoutSession(event.data.object);
        break;
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed':
        await cancelCheckoutSession(event.data.object);
        break;
      case 'charge.refunded': {
        const charge = event.data.object;
        const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
        if (pi && charge.refunded) await markRefunded(pi);
        break;
      }
    }
  } catch (error) {
    // 500 hace que Stripe reintente el evento más tarde.
    console.error(`[webhook] error procesando ${event.type} ${event.id}`, error);
    return new Response('Webhook handler failed', { status: 500 });
  }

  return Response.json({ received: true });
}
