'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore, useTransition } from 'react';
import { MinusIcon, PlusIcon } from '@/components/ui/icons';
import { getCartSummary, startCheckout, type CartSummary } from '@/lib/actions/cart';
import { useCart } from '@/lib/cart/store';
import { formatMoney } from '@/lib/format';
import { getDictionary, localizePath, type Locale } from '@/lib/i18n';

const subscribe = () => () => {};

export function CartView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).cart;
  const { lines, setQuantity, remove, replace } = useCart();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [paying, startPaying] = useTransition();

  // Cada cambio en el carrito vuelve a pedir precios y stock al servidor.
  const key = JSON.stringify(lines);
  useEffect(() => {
    if (!hydrated) return;
    startLoading(async () => {
      const result = await getCartSummary(lines, locale);
      if (!result) return;
      setSummary(result);

      // Sincroniza el carrito local con la realidad (stock agotado o reducido).
      if (result.unavailable.length || result.adjusted) {
        replace(result.lines.map((l) => ({ sku: l.sku, quantity: l.quantity })));
        const adjustedLine = result.lines.find((l) => l.quantity < l.requested);
        setNotice(adjustedLine ? t.adjusted(adjustedLine.quantity) : t.unavailable);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hydrated, locale]);

  function checkout() {
    setError(null);
    startPaying(async () => {
      const result = await startCheckout(lines, locale);
      // Si todo sale bien, el servidor redirige a Stripe y no se llega aquí.
      if (result?.error) setError(result.error === 'stock' ? t.errors.stock : result.error === 'empty' ? t.errors.empty : t.errors.generic);
    });
  }

  if (!hydrated || (lines.length > 0 && !summary)) {
    return <p className="py-20 text-center text-muted" role="status">{t.loading}</p>;
  }

  if (lines.length === 0 || !summary || summary.lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">{t.empty}</p>
        <Link href={`${localizePath(locale, '/buscar')}?sort=newest`} className="btn btn-primary mt-6">
          {t.startShopping}
        </Link>
      </div>
    );
  }

  const money = (n: number) => formatMoney(n, summary.currency, locale);
  const remaining = summary.freeShippingMin - summary.subtotal;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
      <section aria-label={t.title}>
        {notice && (
          <p className="mb-6 border border-signal px-4 py-3 text-sm text-signal" role="alert">
            {notice}
          </p>
        )}
        <ul className="divide-y divide-line border-y border-line" aria-busy={loading}>
          {summary.lines.map((line) => (
            <li key={line.sku} className="grid grid-cols-[6rem_1fr] gap-4 py-6 sm:grid-cols-[8rem_1fr]">
              <Link href={localizePath(locale, `/producto/${line.slug}`)} className="relative aspect-[4/5] bg-stone" tabIndex={-1}>
                {line.image && <Image src={line.image} alt={line.name} fill sizes="128px" className="object-cover" />}
              </Link>
              <div className="flex flex-col gap-1">
                {line.brand && <p className="text-xs text-muted">{line.brand}</p>}
                <h2 className="font-medium">
                  <Link href={localizePath(locale, `/producto/${line.slug}`)} className="hover:underline">
                    {line.name}
                  </Link>
                </h2>
                <p className="text-sm text-muted">{[line.color, line.size].filter(Boolean).join(' / ')}</p>
                <p className="text-sm">
                  {line.unitPrice < line.regularPrice ? (
                    <>
                      <span className="font-semibold text-signal">{money(line.unitPrice)}</span>{' '}
                      <s className="text-muted">{money(line.regularPrice)}</s>
                    </>
                  ) : (
                    <span className="font-semibold">{money(line.unitPrice)}</span>
                  )}
                </p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center border border-line" role="group" aria-label={`${t.quantity}: ${line.name}`}>
                    <button
                      type="button"
                      className="grid size-9 place-items-center disabled:text-stone-deep"
                      onClick={() => setQuantity(line.sku, line.quantity - 1)}
                      disabled={line.quantity <= 1 || loading}
                      aria-label="−1"
                    >
                      <MinusIcon size={16} />
                    </button>
                    <output className="w-8 text-center text-sm" aria-live="polite">
                      {line.quantity}
                    </output>
                    <button
                      type="button"
                      className="grid size-9 place-items-center disabled:text-stone-deep"
                      onClick={() => setQuantity(line.sku, line.quantity + 1)}
                      disabled={line.quantity >= Math.min(10, line.stock) || loading}
                      aria-label="+1"
                    >
                      <PlusIcon size={16} />
                    </button>
                  </div>
                  <button type="button" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline" onClick={() => remove(line.sku)}>
                    {t.remove}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside aria-labelledby="summary-title" className="lg:sticky lg:top-24 lg:self-start">
        <div className="bg-stone p-6">
          <h2 id="summary-title" className="sr-only">
            {t.total}
          </h2>
          <p className="mb-5 text-sm">{remaining > 0 ? t.remainingForFree(money(remaining)) : t.freeShippingUnlocked}</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>{t.subtotal}</dt>
              <dd>{money(summary.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t.shipping}</dt>
              <dd>{summary.shipping === 0 ? t.free : money(summary.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-deep pt-3 text-base font-semibold">
              <dt>{t.total}</dt>
              <dd>{money(summary.total)}</dd>
            </div>
          </dl>
          <button type="button" className="btn btn-primary mt-6 w-full" onClick={checkout} disabled={paying || loading}>
            {paying ? t.redirecting : t.checkout}
          </button>
          {error && (
            <p className="mt-3 text-sm text-signal" role="alert">
              {error}
            </p>
          )}
          <p className="mt-4 text-xs text-muted">{t.secure}</p>
        </div>
      </aside>
    </div>
  );
}
