import Link from 'next/link';
import type { CatalogQuery } from '@/lib/catalog-params';
import { hasActiveFilters } from '@/lib/catalog-params';
import { getDictionary, type Locale } from '@/lib/i18n';
import { colorName, sortSizes } from '@/lib/product';
import type { Facets } from '@/lib/strapi/catalog';
import { AutoSubmit } from './auto-submit';

type Props = {
  locale: Locale;
  facets: Facets;
  query: CatalogQuery;
  action: string;
  hideBrand?: boolean;
  /** Hay dos instancias (móvil y escritorio): cada una necesita ids propios. */
  idPrefix: string;
};

function Group({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group border-b border-line py-4" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        {title}
        <span className="text-muted transition-transform group-open:rotate-45" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}

/** Formulario GET: los filtros viven en la URL (se pueden compartir y funcionan sin JavaScript). */
export function Filters({ locale, facets, query, action, hideBrand, idPrefix }: Props) {
  const t = getDictionary(locale).catalog;
  const active = hasActiveFilters(query);
  const has = (list: string[] | undefined, v: string) => list?.includes(v) ?? false;

  return (
    <form method="get" action={action} aria-label={t.filters}>
      <AutoSubmit />
      {query.q && <input type="hidden" name="q" value={query.q} />}

      <div className="flex items-center justify-between border-b border-line pb-4">
        <label htmlFor={`${idPrefix}-sort`} className="text-sm font-semibold">
          {t.sort}
        </label>
        <select id={`${idPrefix}-sort`} name="sort" defaultValue={query.sort ?? 'newest'} className="bg-transparent text-sm">
          {Object.entries(t.sortOptions).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {facets.sizes.length > 0 && (
        <Group title={t.size} open={Boolean(query.size?.length)}>
          <fieldset>
            <legend className="sr-only">{t.size}</legend>
            <div className="flex flex-wrap gap-2">
              {sortSizes(facets.sizes).map((s) => (
                <label key={s} className="cursor-pointer">
                  <input type="checkbox" name="size" value={s} defaultChecked={has(query.size, s)} className="peer sr-only" />
                  <span className="inline-grid h-9 min-w-11 place-items-center border border-line px-2 text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
                    {s}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Group>
      )}

      {facets.colors.length > 0 && (
        <Group title={t.color} open={Boolean(query.color?.length)}>
          <fieldset>
            <legend className="sr-only">{t.color}</legend>
            <ul className="space-y-2">
              {facets.colors.map((c) => (
                <li key={c.slug}>
                  <label className="flex cursor-pointer items-center gap-3 text-sm">
                    <input type="checkbox" name="color" value={c.slug} defaultChecked={has(query.color, c.slug)} className="size-4 accent-ink" />
                    <span className="size-4 rounded-full ring-1 ring-line" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                    {colorName(c, locale)}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        </Group>
      )}

      {!hideBrand && facets.brands.length > 1 && (
        <Group title={t.brand} open={Boolean(query.brand?.length)}>
          <fieldset>
            <legend className="sr-only">{t.brand}</legend>
            <ul className="space-y-2">
              {facets.brands.map((b) => (
                <li key={b.slug}>
                  <label className="flex cursor-pointer items-center gap-3 text-sm">
                    <input type="checkbox" name="brand" value={b.slug} defaultChecked={has(query.brand, b.slug)} className="size-4 accent-ink" />
                    {b.name}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        </Group>
      )}

      <Group title={t.price} open={Boolean(query.min || query.max)}>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="sr-only">{t.price}</legend>
          <label className="text-xs text-muted">
            {t.minPrice}
            <input type="number" name="min" min={0} inputMode="numeric" defaultValue={query.min} className="field mt-1 min-h-10 py-2 text-sm" />
          </label>
          <label className="text-xs text-muted">
            {t.maxPrice}
            <input type="number" name="max" min={0} inputMode="numeric" defaultValue={query.max} className="field mt-1 min-h-10 py-2 text-sm" />
          </label>
        </fieldset>
      </Group>

      <div className="space-y-3 py-4 text-sm">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" name="sale" value="1" defaultChecked={query.sale === '1'} className="size-4 accent-ink" />
          {t.onSale}
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" name="stock" value="1" defaultChecked={query.stock === '1'} className="size-4 accent-ink" />
          {t.inStock}
        </label>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button type="submit" className="btn btn-primary w-full">
          {t.applyFilters}
        </button>
        {active && (
          <Link href={query.q ? `${action}?q=${encodeURIComponent(query.q)}` : action} className="btn btn-outline w-full">
            {t.clearFilters}
          </Link>
        )}
      </div>
    </form>
  );
}
