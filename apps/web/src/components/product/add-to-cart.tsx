'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { useCart } from '@/lib/cart/store';
import { getDictionary, type Locale } from '@/lib/i18n';

export type VariantOption = {
  sku: string;
  size: string;
  stock: number;
  color: { slug: string; name: string; hex: string } | null;
};

type Props = {
  locale: Locale;
  variants: VariantOption[];
  sizes: string[];
  cartHref: string;
};

const LOW_STOCK = 3;

export function AddToCart({ locale, variants, sizes, cartHref }: Props) {
  const t = getDictionary(locale).product;
  const add = useCart((s) => s.add);
  const id = useId();

  const colors = useMemo(() => {
    const map = new Map<string, NonNullable<VariantOption['color']>>();
    for (const v of variants) if (v.color) map.set(v.color.slug, v.color);
    return [...map.values()];
  }, [variants]);

  const firstInStock = variants.find((v) => v.stock > 0);
  const [color, setColor] = useState(firstInStock?.color?.slug ?? colors[0]?.slug ?? null);
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [added, setAdded] = useState(false);

  const forColor = variants.filter((v) => (color ? v.color?.slug === color : true));
  const selected = forColor.find((v) => v.size === size) ?? null;
  const colorLabel = colors.find((c) => c.slug === color)?.name;

  function onAdd() {
    if (!selected || selected.stock === 0) return;
    add(selected.sku, 1);
    setAdded(true);
  }

  return (
    <div className="space-y-6">
      {colors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm">
            <span className="font-semibold">{t.color}:</span> {colorLabel}
          </legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <label key={c.slug} className="cursor-pointer" title={c.name}>
                <input
                  type="radio"
                  name={`${id}-color`}
                  value={c.slug}
                  checked={color === c.slug}
                  onChange={() => {
                    setColor(c.slug);
                    setAdded(false);
                  }}
                  className="peer sr-only"
                />
                <span className="sr-only">{c.name}</span>
                <span
                  aria-hidden="true"
                  className="block size-9 rounded-full ring-1 ring-line ring-offset-2 peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4"
                  style={{ backgroundColor: c.hex }}
                />
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">{t.size}</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {sizes.map((s) => {
            const variant = forColor.find((v) => v.size === s);
            const out = !variant || variant.stock === 0;
            return (
              <label key={s} className={out ? 'cursor-not-allowed' : 'cursor-pointer'}>
                <input
                  type="radio"
                  name={`${id}-size`}
                  value={s}
                  disabled={out}
                  checked={size === s}
                  onChange={() => {
                    setSize(s);
                    setAdded(false);
                  }}
                  className="peer sr-only"
                />
                <span className="grid h-11 place-items-center border border-line text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-disabled:text-muted peer-disabled:line-through peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
                  {s}
                  {out && <span className="sr-only"> — {t.soldOut}</span>}
                </span>
              </label>
            );
          })}
        </div>
        {selected && selected.stock > 0 && selected.stock <= LOW_STOCK && (
          <p className="mt-3 text-sm text-signal">{t.onlyLeft(selected.stock)}</p>
        )}
      </fieldset>

      <button type="button" className="btn btn-primary w-full" disabled={!selected || selected.stock === 0} onClick={onAdd}>
        {!firstInStock ? t.soldOut : selected ? t.addToCart : t.selectSize}
      </button>

      <p role="status" className="min-h-6 text-sm">
        {added && (
          <>
            {t.added}.{' '}
            <Link href={cartHref} className="link font-semibold">
              {t.viewCart}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
