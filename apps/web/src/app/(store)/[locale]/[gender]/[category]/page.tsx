import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogSkeleton, CatalogView } from '@/components/catalog/catalog-view';
import { getDictionary, isLocale, localizePath, type Locale } from '@/lib/i18n';
import { localized } from '@/lib/product';
import { buildMetadata } from '@/lib/seo';
import { getCategory } from '@/lib/strapi/catalog';
import { mediaUrl } from '@/lib/strapi/client';
import { GenderHeader } from '@/components/catalog/gender-header';

const isGender = (v: string): v is 'hombre' | 'mujer' => v === 'hombre' || v === 'mujer';

export async function generateMetadata({ params }: PageProps<'/[locale]/[gender]/[category]'>): Promise<Metadata> {
  const { locale, gender, category } = await params;
  if (!isLocale(locale) || !isGender(gender)) return {};
  const cat = await getCategory(category);
  if (!cat) return {};
  const t = getDictionary(locale);
  const genderLabel = gender === 'hombre' ? t.nav.men : t.nav.women;
  const name = localized(cat, 'name', locale);
  const image = cat.seo?.shareImage ?? cat.image;
  return buildMetadata({
    locale,
    path: `/${gender}/${cat.slug}`,
    title: cat.seo?.metaTitle ?? `${name} ${locale === 'es' ? 'para' : 'for'} ${genderLabel.toLowerCase()}`,
    description:
      cat.seo?.metaDescription ??
      (locale === 'es'
        ? `${name} de marca para ${genderLabel.toLowerCase()} en SauldT. Envíos a todo México.`
        : `Designer ${name.toLowerCase()} for ${genderLabel.toLowerCase()} at SauldT.`),
    image: image ? { url: mediaUrl(image.url)!, width: image.width, height: image.height } : null,
  });
}

export default function CategoryPage({ params, searchParams }: PageProps<'/[locale]/[gender]/[category]'>) {
  return (
    <div className="page-x mx-auto max-w-(--container-page)">
      <Suspense fallback={<CatalogSkeleton />}>
        <CategoryContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CategoryContent({ params, searchParams }: Pick<PageProps<'/[locale]/[gender]/[category]'>, 'params' | 'searchParams'>) {
  const { locale, gender, category } = await params;
  if (!isLocale(locale) || !isGender(gender)) notFound();
  const cat = await getCategory(category);
  if (!cat) notFound();

  return (
    <>
      <GenderHeader locale={locale as Locale} gender={gender} category={cat.slug} />
      <CatalogView
        locale={locale}
        scope={{ gender, category: cat.slug }}
        searchParams={searchParams}
        basePath={localizePath(locale, `/${gender}/${cat.slug}`)}
      />
    </>
  );
}
