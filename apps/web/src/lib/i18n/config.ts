export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

export type Currency = 'mxn' | 'usd';

/** El idioma define la moneda: /es cobra en MXN y /en en USD. */
export const currencyFor: Record<Locale, Currency> = { es: 'mxn', en: 'usd' };

export const intlLocale: Record<Locale, string> = { es: 'es-MX', en: 'en-US' };

export const ogLocale: Record<Locale, string> = { es: 'es_MX', en: 'en_US' };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
