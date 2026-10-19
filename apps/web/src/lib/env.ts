import 'server-only';
import { z } from 'zod';

/**
 * Variables secretas: solo existen en el servidor. Ninguna lleva el prefijo NEXT_PUBLIC_,
 * así que Next.js nunca las incluye en el JavaScript que descarga el navegador.
 */
const schema = z.object({
  STRAPI_URL: z.string().url(),
  STRAPI_READ_TOKEN: z.string().min(20, 'Crea un API token "Read-only" en Strapi'),
  STRAPI_ADMIN_TOKEN: z.string().min(20, 'Crea un API token "Full access" en Strapi'),
  // Opcionales para que la tienda cargue sin Stripe; el checkout falla con un mensaje claro si faltan.
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('SauldT <pedidos@sauldt.com>'),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().optional(),
  REVALIDATE_SECRET: z.string().min(24),
});

type Env = z.infer<typeof schema>;
let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  // Una variable vacía (KEY=) cuenta como no definida.
  const values = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined && v !== ''));
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  ');
    throw new Error(`Variables de entorno inválidas:\n  ${missing}\nRevisa apps/web/.env.local`);
  }
  cached = parsed.data;
  return cached;
}
