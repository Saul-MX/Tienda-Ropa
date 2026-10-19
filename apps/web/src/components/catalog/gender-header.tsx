import { CatalogHeader } from './catalog-header';
import { getDictionary, localizePath, type Locale } from '@/lib/i18n';
import { localized } from '@/lib/product';
import { getCategories } from '@/lib/strapi/catalog';

type GenderSlug = 'hombre' | 'mujer';

export async function GenderHeader({ locale, gender, category }: { locale: Locale; gender: GenderSlug; category?: string }) {
  const t = getDictionary(locale);
  const categories = await getCategories();
  const genderLabel = gender === 'hombre' ? t.nav.men : t.nav.women;
  const current = categories.find((c) => c.slug === category);

  const crumbs = [
    { name: t.breadcrumbs.home, href: localizePath(locale, '/') },
    { name: genderLabel, href: localizePath(locale, `/${gender}`) },
    ...(current ? [{ name: localized(current, 'name', locale), href: localizePath(locale, `/${gender}/${current.slug}`) }] : []),
  ];

  return (
    <CatalogHeader
      title={current ? `${localized(current, 'name', locale)} · ${genderLabel}` : gender === 'hombre' ? t.catalog.menTitle : t.catalog.womenTitle}
      breadcrumbs={crumbs}
      breadcrumbLabel={t.breadcrumbs.label}
      links={[
        { href: localizePath(locale, `/${gender}`), label: t.catalog.all, current: !category },
        ...categories.map((c) => ({
          href: localizePath(locale, `/${gender}/${c.slug}`),
          label: localized(c, 'name', locale),
          current: c.slug === category,
        })),
      ]}
    />
  );
}
