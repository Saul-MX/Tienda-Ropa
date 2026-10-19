import { formatMoney } from '@/lib/format';
import { currencyFor, type Locale } from '@/lib/i18n';
import { priceOf } from '@/lib/product';
import type { Product } from '@/lib/strapi/types';

type Props = {
  product: Pick<Product, 'priceMxn' | 'priceUsd' | 'salePriceMxn' | 'salePriceUsd'>;
  locale: Locale;
  size?: 'sm' | 'lg';
};

export function Price({ product, locale, size = 'sm' }: Props) {
  const currency = currencyFor[locale];
  const p = priceOf(product, currency);
  const cls = size === 'lg' ? 'text-xl' : 'text-sm';

  if (!p.onSale) {
    return <p className={`${cls} font-semibold`}>{formatMoney(p.current, currency, locale)}</p>;
  }

  return (
    <p className={`${cls} flex flex-wrap items-baseline gap-x-2`}>
      <span className="font-semibold text-signal">
        <span className="sr-only">{locale === 'es' ? 'Precio de oferta: ' : 'Sale price: '}</span>
        {formatMoney(p.current, currency, locale)}
      </span>
      <s className="text-muted">
        <span className="sr-only">{locale === 'es' ? 'Precio anterior: ' : 'Original price: '}</span>
        {formatMoney(p.regular, currency, locale)}
      </s>
    </p>
  );
}
