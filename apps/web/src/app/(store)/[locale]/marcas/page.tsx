import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CatalogHeader } from '@/components/catalog/catalog-header';
import { getDictionary, isLocale, localizePath } from '@/lib/i18n';
import { localized } from '@/lib/product';
import { buildMetadata } from '@/lib/seo';
import { getBrands } from '@/lib/strapi/catalog';

export async function generateMetadata({ params }: PageProps<'/[locale]/marcas'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale).brands;
  return buildMetadata({ locale, path: '/marcas', title: t.title, description: t.description });
}

export default async function BrandsPage({ params }: PageProps<'/[locale]/marcas'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const brands = await getBrands();

  return (
    <div className="page-x mx-auto max-w-(--container-page)">
      <CatalogHeader
        title={t.brands.title}
        description={t.brands.description}
        breadcrumbLabel={t.breadcrumbs.label}
        breadcrumbs={[
          { name: t.breadcrumbs.home, href: localizePath(locale, '/') },
          { name: t.brands.title, href: localizePath(locale, '/marcas') },
        ]}
      />
      <ul className="divide-y divide-line border-y border-line">
        {brands.map((b) => (
          <li key={b.documentId}>
            <Link
              href={localizePath(locale, `/marcas/${b.slug}`)}
              className="group grid gap-2 py-8 md:grid-cols-[1fr_2fr_auto] md:items-baseline md:gap-10"
            >
              <h2 className="display text-3xl group-hover:underline md:text-4xl">{b.name}</h2>
              <p className="text-muted">{localized(b, 'description', locale)}</p>
              <p className="text-sm text-muted">{t.brands.products(b.products?.length ?? 0)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
