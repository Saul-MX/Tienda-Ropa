import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogHeader } from '@/components/catalog/catalog-header';
import { CatalogSkeleton, CatalogView } from '@/components/catalog/catalog-view';
import { ProductImage } from '@/components/product/product-image';
import { getDictionary, isLocale, localizePath } from '@/lib/i18n';
import { localized } from '@/lib/product';
import { buildMetadata } from '@/lib/seo';
import { getCollection } from '@/lib/strapi/catalog';
import { mediaUrl } from '@/lib/strapi/client';

export async function generateMetadata({ params }: PageProps<'/[locale]/colecciones/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const c = await getCollection(slug);
  if (!c) return {};
  const image = c.seo?.shareImage ?? c.cover;
  return buildMetadata({
    locale,
    path: `/colecciones/${c.slug}`,
    title: c.seo?.metaTitle ?? localized(c, 'name', locale),
    description: c.seo?.metaDescription ?? (localized(c, 'description', locale) || undefined),
    image: image ? { url: mediaUrl(image.url)!, width: image.width, height: image.height } : null,
  });
}

export default function CollectionPage({ params, searchParams }: PageProps<'/[locale]/colecciones/[slug]'>) {
  return (
    <div className="page-x mx-auto max-w-(--container-page)">
      <Suspense fallback={<CatalogSkeleton />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ params, searchParams }: Pick<PageProps<'/[locale]/colecciones/[slug]'>, 'params' | 'searchParams'>) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const c = await getCollection(slug);
  if (!c) notFound();
  const t = getDictionary(locale);
  const name = localized(c, 'name', locale);
  const path = localizePath(locale, `/colecciones/${c.slug}`);

  return (
    <>
      {c.cover && (
        <div className="relative -mx-4 mt-0 aspect-[21/9] overflow-hidden bg-stone md:-mx-8">
          <ProductImage image={c.cover} alt={name} sizes="100vw" priority />
        </div>
      )}
      <CatalogHeader
        title={name}
        description={localized(c, 'description', locale)}
        breadcrumbLabel={t.breadcrumbs.label}
        breadcrumbs={[
          { name: t.breadcrumbs.home, href: localizePath(locale, '/') },
          { name: t.collections.title, href: localizePath(locale, '/colecciones') },
          { name, href: path },
        ]}
      />
      <CatalogView locale={locale} scope={{ collection: c.slug }} searchParams={searchParams} basePath={path} />
    </>
  );
}
