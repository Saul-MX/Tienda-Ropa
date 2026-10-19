import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/config';
import { localizePath } from '@/lib/i18n/routes';
import { absoluteUrl } from '@/lib/site';
import { getCategories, getSitemapEntries } from '@/lib/strapi/catalog';

type Entry = MetadataRoute.Sitemap[number];

/** Cada URL aparece en ambos idiomas con sus alternativas hreflang. */
function entry(path: string, lastModified?: string, priority = 0.6): Entry {
  return {
    url: absoluteUrl(localizePath('es', path)),
    lastModified: lastModified ? new Date(lastModified) : undefined,
    priority,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l === 'es' ? 'es-MX' : 'en-US', absoluteUrl(localizePath(l, path))])),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [data, categories] = await Promise.all([getSitemapEntries(), getCategories()]);

  const staticPaths = [
    entry('/', undefined, 1),
    entry('/hombre', undefined, 0.9),
    entry('/mujer', undefined, 0.9),
    entry('/colecciones', undefined, 0.8),
    entry('/marcas', undefined, 0.7),
    entry('/privacidad', undefined, 0.2),
  ];

  const categoryPaths = categories.flatMap((c) =>
    ['hombre', 'mujer'].map((g) => entry(`/${g}/${c.slug}`, undefined, 0.8)),
  );

  return [
    ...staticPaths,
    ...categoryPaths,
    ...data.collections.map((c) => entry(`/colecciones/${c.slug}`, c.updatedAt, 0.7)),
    ...data.brands.map((b) => entry(`/marcas/${b.slug}`, b.updatedAt, 0.6)),
    ...data.products.map((p) => entry(`/producto/${p.slug}`, p.updatedAt, 0.8)),
  ];
}
