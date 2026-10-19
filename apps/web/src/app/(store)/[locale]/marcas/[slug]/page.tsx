import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogHeader } from '@/components/catalog/catalog-header';
import { CatalogSkeleton, CatalogView } from '@/components/catalog/catalog-view';
import { getDictionary, isLocale, localizePath } from '@/lib/i18n';
import { localized } from '@/lib/product';
import { buildMetadata } from '@/lib/seo';
import { getBrand } from '@/lib/strapi/catalog';
import { mediaUrl } from '@/lib/strapi/client';

export async function generateMetadata({ params }: PageProps<'/[locale]/marcas/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const b = await getBrand(slug);
  if (!b) return {};
  const image = b.seo?.shareImage ?? b.logo;
  return buildMetadata({
    locale,
    path: `/marcas/${b.slug}`,
    title: b.seo?.metaTitle ?? b.name,
    description: b.seo?.metaDescription ?? (localized(b, 'description', locale) || undefined),
    image: image ? { url: mediaUrl(image.url)!, width: image.width, height: image.height } : null,
  });
}

export default function BrandPage({ params, searchParams }: PageProps<'/[locale]/marcas/[slug]'>) {
  return (
    <div className="page-x mx-auto max-w-(--container-page)">
      <Suspense fallback={<CatalogSkeleton />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ params, searchParams }: Pick<PageProps<'/[locale]/marcas/[slug]'>, 'params' | 'searchParams'>) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const b = await getBrand(slug);
  if (!b) notFound();
  const t = getDictionary(locale);
  const path = localizePath(locale, `/marcas/${b.slug}`);

  return (
    <>
      <CatalogHeader
        title={b.name}
        description={localized(b, 'description', locale)}
        breadcrumbLabel={t.breadcrumbs.label}
        breadcrumbs={[
          { name: t.breadcrumbs.home, href: localizePath(locale, '/') },
          { name: t.brands.title, href: localizePath(locale, '/marcas') },
          { name: b.name, href: path },
        ]}
      />
      <CatalogView locale={locale} scope={{ brand: [b.slug] }} searchParams={searchParams} basePath={path} hideBrandFilter />
    </>
  );
}
