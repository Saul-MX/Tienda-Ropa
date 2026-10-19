import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CatalogHeader } from '@/components/catalog/catalog-header';
import { ProductImage } from '@/components/product/product-image';
import { getDictionary, isLocale, localizePath } from '@/lib/i18n';
import { localized } from '@/lib/product';
import { buildMetadata } from '@/lib/seo';
import { getCollections } from '@/lib/strapi/catalog';

export async function generateMetadata({ params }: PageProps<'/[locale]/colecciones'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale).collections;
  return buildMetadata({ locale, path: '/colecciones', title: t.title, description: t.description });
}

export default async function CollectionsPage({ params }: PageProps<'/[locale]/colecciones'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const collections = await getCollections();

  return (
    <div className="page-x mx-auto max-w-(--container-page)">
      <CatalogHeader
        title={t.collections.title}
        description={t.collections.description}
        breadcrumbLabel={t.breadcrumbs.label}
        breadcrumbs={[
          { name: t.breadcrumbs.home, href: localizePath(locale, '/') },
          { name: t.collections.title, href: localizePath(locale, '/colecciones') },
        ]}
      />
      <ul className="grid gap-x-5 gap-y-14 md:grid-cols-2">
        {collections.map((c, i) => {
          const name = localized(c, 'name', locale);
          const description = localized(c, 'description', locale);
          return (
            <li key={c.documentId} className={i === 0 ? 'md:col-span-2' : ''}>
              <article className="group">
                <Link href={localizePath(locale, `/colecciones/${c.slug}`)} className="block">
                  <div className={`relative overflow-hidden bg-stone ${i === 0 ? 'aspect-[16/9]' : 'aspect-[3/2]'}`}>
                    <ProductImage image={c.cover} alt={name} sizes={i === 0 ? '100vw' : '50vw'} priority={i === 0} placeholder={c.year ? String(c.year) : ' '} />
                  </div>
                  <p className="mt-4 text-sm text-muted">
                    {t.collections.seasons[c.season]}
                    {c.year ? ` ${c.year}` : ''}
                  </p>
                  <h2 className="display mt-1 text-2xl group-hover:underline">{name}</h2>
                </Link>
                {description && <p className="mt-2 max-w-xl text-muted">{description}</p>}
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
