import Link from 'next/link';
import { currencyFor, getDictionary, localizePath, type Locale } from '@/lib/i18n';
import { colorName, localized, priceOf, totalStock, uniqueColors } from '@/lib/product';
import type { Product } from '@/lib/strapi/types';
import { Price } from './price';
import { ProductImage } from './product-image';

const MAX_SWATCHES = 4;

/**
 * Card inspirada en Bape: foto grande sobre gris, etiquetas rectangulares en la esquina,
 * la segunda foto aparece al pasar el cursor, y debajo marca, nombre, precio y colores.
 */
export function ProductCard({ product, locale, priority = false }: { product: Product; locale: Locale; priority?: boolean }) {
  const t = getDictionary(locale).product;
  const name = localized(product, 'name', locale);
  const href = localizePath(locale, `/producto/${product.slug}`);
  const [first, second] = product.images ?? [];
  const price = priceOf(product, currencyFor[locale]);
  const soldOut = totalStock(product) === 0;
  const colors = uniqueColors(product);

  const badges = [
    soldOut && { label: t.soldOut, cls: 'bg-paper text-ink ring-1 ring-ink' },
    !soldOut && price.onSale && { label: `-${price.discountPct}%`, cls: 'bg-signal text-paper' },
    !soldOut && product.isNew && { label: t.new, cls: 'bg-ink text-paper' },
    !soldOut && product.isBestseller && { label: t.bestseller, cls: 'bg-paper text-ink' },
  ].filter(Boolean) as { label: string; cls: string }[];

  return (
    <article className="group relative flex flex-col">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden bg-stone" tabIndex={-1} aria-hidden="true">
        <ProductImage
          image={first}
          alt={name}
          priority={priority}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          placeholder={product.brand?.name.split(' ')[0].toUpperCase()}
          className={soldOut ? 'opacity-60' : ''}
        />
        {second && (
          <ProductImage
            image={second}
            alt=""
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
      </Link>

      {badges.length > 0 && (
        <ul className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1" aria-label="Etiquetas">
          {badges.map((b) => (
            <li key={b.label} className={`px-2 py-0.5 text-[11px] font-bold ${b.cls}`}>
              {b.label}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-1 flex-col gap-1">
        {product.brand && <p className="text-xs text-muted">{product.brand.name}</p>}
        <h3 className="text-sm leading-snug font-medium">
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none group-focus-within:underline">
            {name}
          </Link>
        </h3>
        <Price product={product} locale={locale} />
        {colors.length > 1 && (
          <div className="mt-1 flex items-center gap-1.5">
            <ul className="flex gap-1" aria-label={t.colors(colors.length)}>
              {colors.slice(0, MAX_SWATCHES).map((c) => (
                <li key={c.slug}>
                  <span
                    className="block size-3 rounded-full ring-1 ring-line ring-offset-1"
                    style={{ backgroundColor: c.hex }}
                    title={colorName(c, locale)}
                  />
                  <span className="sr-only">{colorName(c, locale)}</span>
                </li>
              ))}
            </ul>
            {colors.length > MAX_SWATCHES && (
              <span className="text-xs text-muted">{t.moreColors(colors.length - MAX_SWATCHES)}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, locale, priorityCount = 0 }: { products: Product[]; locale: Locale; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.documentId}>
          <ProductCard product={p} locale={locale} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
