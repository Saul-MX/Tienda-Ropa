import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogSkeleton, CatalogView } from '@/components/catalog/catalog-view';
import { GenderHeader } from '@/components/catalog/gender-header';
import { getDictionary, isLocale, localizePath } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

const GENDERS = ['hombre', 'mujer'] as const;
const isGender = (v: string): v is (typeof GENDERS)[number] => (GENDERS as readonly string[]).includes(v);

export function generateStaticParams() {
  return GENDERS.map((gender) => ({ gender }));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/[gender]'>): Promise<Metadata> {
  const { locale, gender } = await params;
  if (!isLocale(locale) || !isGender(gender)) return {};
  const t = getDictionary(locale).catalog;
  return buildMetadata({
    locale,
    path: `/${gender}`,
    title: gender === 'hombre' ? t.menTitle : t.womenTitle,
    description: gender === 'hombre' ? t.menDescription : t.womenDescription,
  });
}

export default function GenderPage({ params, searchParams }: PageProps<'/[locale]/[gender]'>) {
  return (
    <div className="page-x mx-auto max-w-(--container-page)">
      <Suspense fallback={<CatalogSkeleton />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ params, searchParams }: Pick<PageProps<'/[locale]/[gender]'>, 'params' | 'searchParams'>) {
  const { locale, gender } = await params;
  if (!isLocale(locale) || !isGender(gender)) notFound();
  return (
    <>
      <GenderHeader locale={locale} gender={gender} />
      <CatalogView locale={locale} scope={{ gender }} searchParams={searchParams} basePath={localizePath(locale, `/${gender}`)} />
    </>
  );
}
