import { intlLocale, type Currency, type Locale } from '@/lib/i18n/config';

export function formatMoney(amount: number, currency: Currency, locale: Locale) {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function formatDate(iso: string, locale: Locale, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat(intlLocale[locale], opts).format(new Date(iso));
}

/** Convierte a centavos sin errores de punto flotante (Stripe trabaja en centavos). */
export const toCents = (amount: number) => Math.round(Number(amount) * 100);
