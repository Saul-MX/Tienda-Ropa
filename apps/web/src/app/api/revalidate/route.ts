import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { env } from '@/lib/env';
import { CATALOG_TAG, REVIEWS_TAG } from '@/lib/strapi/catalog';

/**
 * Strapi llama aquí (webhook "entry.create/update/delete") para refrescar el catálogo
 * en cuanto editas un producto. Requiere el header Authorization con REVALIDATE_SECRET.
 */
function authorized(header: string | null) {
  const expected = Buffer.from(`Bearer ${env().REVALIDATE_SECRET}`);
  const received = Buffer.from(header ?? '');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

const CATALOG_MODELS = new Set(['product', 'brand', 'category', 'collection', 'color', 'size-guide', 'store-setting']);

export async function POST(request: Request) {
  if (!authorized(request.headers.get('authorization'))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { model?: string } | null;
  const model = payload?.model;

  if (model === 'review') revalidateTag(REVIEWS_TAG, 'max');
  else if (!model || CATALOG_MODELS.has(model)) revalidateTag(CATALOG_TAG, 'max');

  return Response.json({ revalidated: true, model: model ?? 'all' });
}
