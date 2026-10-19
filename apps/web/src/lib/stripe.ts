import 'server-only';
import Stripe from 'stripe';
import { env } from '@/lib/env';

let client: Stripe | null = null;

export function stripe() {
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new Error('Falta STRIPE_SECRET_KEY en apps/web/.env.local');
  client ??= new Stripe(key, {
    appInfo: { name: 'SauldT Store' },
    maxNetworkRetries: 2,
    timeout: 20_000,
  });
  return client;
}
