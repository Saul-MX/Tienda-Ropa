import Link from 'next/link';
import { ProductGrid } from '@/components/product/product-card';
import { parseCatalogQuery, toFilters, toSearchString } from '@/lib/catalog-params';
import { currencyFor, getDictionary, type Locale } from '@/lib/i18n';
import { getFacets, getProducts, type ProductFilters } from '@/lib/strapi/catalog';
import { Filters } from './filters';

type Props = {
  locale: Locale;
  /** Filtros fijos de la página (género, categoría, colección o marca). */
  scope: Pick<ProductFilters, 'gender' | 'category' | 'collection' | 'brand' | 'onSale'>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  /** URL pública del listado, usada como action del formulario y en la paginación. */
  basePath: string;
  hideBrandFilter?: boolean;
};

export async function CatalogView({ locale, scope, searchParams, basePath, hideBrandFilter }: Props) {
  const t = getDictionary(locale).catalog;
  const query = parseCatalogQuery(await searchParams);
  const filters = toFilters(query);
  const currency = currencyFor[locale];

  const [result, facets] = await Promise.all([
    getProducts({ ...scope, ...filters, brand: filters.brand ?? scope.brand, onSale: filters.onSale || scope.onSale, currency }),
    getFacets({ ...scope, q: filters.q }),
  ]);

  const { page, pageCount, total } = result.meta.pagination;

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-12">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <details className="lg:hidden" open={false}>
          <summary className="btn btn-outline w-full cursor-pointer list-none">{t.filters}</summary>
          <div className="pt-4">
            <Filters locale={locale} facets={facets} query={query} action={basePath} hideBrand={hideBrandFilter} idPrefix="mobile" />
          </div>
        </details>
        <div className="hidden lg:block">
          <h2 className="sr-only">{t.filters}</h2>
          <Filters locale={locale} facets={facets} query={query} action={basePath} hideBrand={hideBrandFilter} idPrefix="desktop" />
        </div>
      </aside>

      <section aria-labelledby="results-count">
        <p id="results-count" className="mb-6 text-sm text-muted" role="status">
          {t.results(total)}
        </p>

        {result.data.length === 0 ? (
          <p className="border border-line p-10 text-center text-muted">{t.empty}</p>
        ) : (
          <ProductGrid products={result.data} locale={locale} priorityCount={4} />
        )}

        {pageCount > 1 && (
          <nav aria-label={t.page(page, pageCount)} className="mt-14 flex items-center justify-between border-t border-line pt-6 text-sm">
            {page > 1 ? (
              <Link rel="prev" className="link" href={`${basePath}${toSearchString(query, { page: page - 1 })}`}>
                {t.previous}
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted">{t.page(page, pageCount)}</span>
            {page < pageCount ? (
              <Link rel="next" className="link" href={`${basePath}${toSearchString(query, { page: page + 1 })}`}>
                {t.next}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-12" aria-busy="true">
      <div className="hidden h-96 bg-stone/60 lg:block" />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}>
            <div className="aspect-[4/5] animate-pulse bg-stone" />
            <div className="mt-3 h-3 w-1/3 bg-stone" />
            <div className="mt-2 h-3 w-2/3 bg-stone" />
          </li>
        ))}
      </ul>
    </div>
  );
}
