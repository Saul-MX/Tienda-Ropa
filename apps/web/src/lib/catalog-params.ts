import { z } from 'zod';
import type { ProductFilters, SortKey } from '@/lib/strapi/catalog';

const slug = z.string().regex(/^[a-z0-9-]{1,80}$/);
const size = z.string().regex(/^[A-Za-z0-9.½/-]{1,12}$/);
const list = <T extends z.ZodTypeAny>(item: T) =>
  z
    .union([item, z.array(item)])
    .optional()
    .transform((v) => (v === undefined ? undefined : (Array.isArray(v) ? v : [v]).slice(0, 20)));

const money = z.coerce.number().min(0).max(1_000_000).optional().catch(undefined);

/**
 * Los parámetros de la URL se validan antes de llegar a Strapi: cualquier valor raro
 * se descarta en lugar de pasarse al query (evita inyección de filtros).
 */
const schema = z.object({
  size: list(size).catch(undefined),
  color: list(slug).catch(undefined),
  brand: list(slug).catch(undefined),
  min: money,
  max: money,
  sale: z.literal('1').optional().catch(undefined),
  stock: z.literal('1').optional().catch(undefined),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'name']).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
  q: z.string().trim().max(80).optional().catch(undefined),
});

export type CatalogQuery = z.infer<typeof schema>;

export function parseCatalogQuery(searchParams: Record<string, string | string[] | undefined>): CatalogQuery {
  return schema.parse(searchParams);
}

export function toFilters(q: CatalogQuery): Partial<ProductFilters> {
  return {
    sizes: q.size,
    colors: q.color,
    brand: q.brand,
    minPrice: q.min,
    maxPrice: q.max,
    onSale: q.sale === '1',
    inStock: q.stock === '1',
    sort: q.sort as SortKey | undefined,
    page: q.page,
    q: q.q || undefined,
  };
}

export function hasActiveFilters(q: CatalogQuery) {
  return Boolean(q.size?.length || q.color?.length || q.brand?.length || q.min || q.max || q.sale || q.stock);
}

/** Reconstruye la query string (para paginación) sin perder filtros. */
export function toSearchString(q: CatalogQuery, overrides: Partial<CatalogQuery> = {}) {
  const merged = { ...q, ...overrides };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === '' || value === null) continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
    else params.set(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}
