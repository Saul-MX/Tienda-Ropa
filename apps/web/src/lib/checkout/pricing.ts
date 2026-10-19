import 'server-only';
import { z } from 'zod';
import { currencyFor, type Currency, type Locale } from '@/lib/i18n/config';
import { colorName, localized, priceOf } from '@/lib/product';
import { getProductsBySkus, getSettings } from '@/lib/strapi/catalog';
import { mediaUrl } from '@/lib/strapi/client';
import type { Product, Variant } from '@/lib/strapi/types';

export const cartInputSchema = z
  .array(
    z.object({
      sku: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
      quantity: z.number().int().min(1).max(10),
    }),
  )
  .max(30);

export type CartInput = z.infer<typeof cartInputSchema>;

export type PricedLine = {
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
  product: Product;
  variant: Variant;
};

export type PricedCart = {
  currency: Currency;
  lines: PricedLine[];
  /** SKUs que ya no existen, están inactivos o sin stock. */
  unavailable: string[];
  /** Hubo líneas con menos stock que lo pedido (se ajustó la cantidad). */
  adjusted: boolean;
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingMin: number;
};

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Única fuente de verdad del precio. Todo sale de Strapi en este momento;
 * del navegador solo se aceptan SKU y cantidad.
 */
export async function priceCart(input: CartInput, locale: Locale): Promise<PricedCart> {
  const currency = currencyFor[locale];
  // Combina líneas repetidas del mismo SKU.
  const merged = new Map<string, number>();
  for (const l of input) merged.set(l.sku, Math.min(10, (merged.get(l.sku) ?? 0) + l.quantity));

  const [products, settings] = await Promise.all([getProductsBySkus([...merged.keys()]), getSettings()]);
  const bySku = new Map<string, { product: Product; variant: Variant }>();
  for (const product of products) for (const variant of product.variants) bySku.set(variant.sku, { product, variant });

  const lines: PricedLine[] = [];
  const unavailable: string[] = [];
  let adjusted = false;

  for (const [sku, requested] of merged) {
    const match = bySku.get(sku);
    if (!match || match.variant.stock <= 0) {
      unavailable.push(sku);
      continue;
    }
    const { product, variant } = match;
    const quantity = Math.min(requested, variant.stock);
    if (quantity < requested) adjusted = true;
    const price = priceOf(product, currency);
    lines.push({
      sku,
      quantity,
      requested,
      stock: variant.stock,
      unitPrice: price.current,
      regularPrice: price.regular,
      name: localized(product, 'name', locale),
      slug: product.slug,
      brand: product.brand?.name ?? null,
      size: variant.size,
      color: variant.color ? colorName(variant.color, locale) : null,
      image: mediaUrl(product.images?.[0]?.url),
      product,
      variant,
    });
  }

  const subtotal = round(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
  const freeShippingMin = Number(currency === 'mxn' ? settings?.freeShippingMinMxn ?? 1999 : settings?.freeShippingMinUsd ?? 120);
  const flatShipping = Number(currency === 'mxn' ? settings?.shippingCostMxn ?? 199 : settings?.shippingCostUsd ?? 12);
  const shipping = subtotal === 0 || subtotal >= freeShippingMin ? 0 : flatShipping;

  return { currency, lines, unavailable, adjusted, subtotal, shipping, total: round(subtotal + shipping), freeShippingMin };
}
