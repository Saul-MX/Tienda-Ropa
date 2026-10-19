import 'server-only';
import { headers } from 'next/headers';

/**
 * Límite de peticiones por IP en memoria (ventana fija).
 * En Vercel cada instancia tiene su propia memoria: frena abusos casuales y bots simples.
 * Para un límite global entre instancias, cambia el Map por Upstash Redis / Vercel KV.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const id = `${key}:${await clientIp()}`;
  const now = Date.now();
  const bucket = buckets.get(id);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}
