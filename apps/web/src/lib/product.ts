import type { Currency, Locale } from '@/lib/i18n/config';
import type { Color, Product } from '@/lib/strapi/types';

/** Elige el campo en inglés si existe; si no, cae al español. */
export function localized<T extends Record<string, unknown>, K extends keyof T & string>(
  entity: T,
  field: K,
  locale: Locale,
): string {
  const en = entity[`${field}En` as keyof T];
  if (locale === 'en' && typeof en === 'string' && en.trim()) return en;
  return (entity[field] as string | null) ?? '';
}

export function colorName(color: Pick<Color, 'name' | 'nameEn'>, locale: Locale) {
  return locale === 'en' && color.nameEn ? color.nameEn : color.name;
}

export function priceOf(product: Pick<Product, 'priceMxn' | 'priceUsd' | 'salePriceMxn' | 'salePriceUsd'>, currency: Currency) {
  const regular = Number(currency === 'mxn' ? product.priceMxn : product.priceUsd);
  const saleRaw = currency === 'mxn' ? product.salePriceMxn : product.salePriceUsd;
  const sale = saleRaw === null || saleRaw === undefined ? null : Number(saleRaw);
  const onSale = sale !== null && sale < regular;
  return {
    current: onSale ? sale : regular,
    regular,
    onSale,
    discountPct: onSale ? Math.round((1 - sale / regular) * 100) : 0,
  };
}

export function uniqueColors(product: Pick<Product, 'variants'>): Color[] {
  const seen = new Map<string, Color>();
  for (const v of product.variants ?? []) if (v.color && !seen.has(v.color.slug)) seen.set(v.color.slug, v.color);
  return [...seen.values()];
}

export const totalStock = (product: Pick<Product, 'variants'>) =>
  (product.variants ?? []).reduce((sum, v) => sum + v.stock, 0);

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'UNI', 'UNITALLA'];

/** Ordena tallas de letras por su secuencia natural y las numéricas de menor a mayor. */
export function sortSizes(sizes: string[]) {
  return [...new Set(sizes)].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return parseFloat(a) - parseFloat(b) || a.localeCompare(b);
  });
}
