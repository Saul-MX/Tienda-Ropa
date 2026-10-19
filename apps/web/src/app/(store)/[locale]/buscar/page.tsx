import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogSkeleton, CatalogView } from '@/components/catalog/catalog-view';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { SearchIcon } from '@/components/ui/icons';
import { parseCatalogQuery } from '@/lib/catalog-params';
import { getDictionary, isLocale, localizePath, type Locale } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps<'/[locale]/buscar'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  // Los resultados de búsqueda no se indexan (contenido duplicado y casi infinito).
  return buildMetadata({ locale, path: '/buscar', title: getDictionary(locale).nav.search, noindex: true });
}

export default function SearchPage({ params, searchParams }: PageProps<'/[locale]/buscar'>) {
  return (
    <Suspense fallback={<div className="page-x mx-auto max-w-(--container-page) pt-8"><CatalogSkeleton /></div>}>
      <Search params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Search({ params, searchParams }: Pick<PageProps<'/[locale]/buscar'>, 'params' | 'searchParams'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const path = localizePath(locale, '/buscar');

  return (
    <div className="page-x mx-auto max-w-(--container-page) pt-8">
      <Breadcrumbs
        label={t.breadcrumbs.label}
        items={[
          { name: t.breadcrumbs.home, href: localizePath(locale, '/') },
          { name: t.nav.search, href: path },
        ]}
      />
      <Suspense fallback={<div className="mt-6 h-32" />}>
        <SearchHeader locale={locale} searchParams={searchParams} action={path} />
      </Suspense>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogView locale={locale} scope={{}} searchParams={searchParams} basePath={path} />
      </Suspense>
    </div>
  );
}

async function SearchHeader({
  locale,
  searchParams,
  action,
}: {
  locale: Locale;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  action: string;
}) {
  const t = getDictionary(locale);
  const query = parseCatalogQuery(await searchParams);
  const title = query.sale ? t.nav.sale : t.catalog.searchTitle(query.q ?? '');

  return (
    <header className="mt-6 mb-10">
      <h1 className="wordmark text-[clamp(2.25rem,6vw,4.5rem)]">{title}</h1>
      <search className="mt-8 max-w-xl">
        <form method="get" action={action} role="search" className="relative">
          <label htmlFor="q" className="sr-only">
            {t.nav.search}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query.q}
            maxLength={80}
            placeholder={t.catalog.searchPlaceholder}
            className="field rounded-full pr-14"
            enterKeyHint="search"
          />
          <button type="submit" className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center" aria-label={t.nav.search}>
            <SearchIcon size={20} />
          </button>
        </form>
      </search>
    </header>
  );
}
