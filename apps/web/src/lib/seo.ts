import type { Metadata } from 'next';
import { getDictionary, ogLocale, type Locale } from '@/lib/i18n';
import { localizePath } from '@/lib/i18n/routes';
import { absoluteUrl } from '@/lib/site';

type MetaInput = {
  locale: Locale;
  /** Ruta interna con segmentos en español, p. ej. "/producto/playera". */
  path: string;
  title?: string;
  description?: string;
  image?: { url: string; width?: number | null; height?: number | null; alt?: string } | null;
  noindex?: boolean;
  type?: 'website' | 'article';
};

/** Metadata con canonical, hreflang es/en/x-default y Open Graph consistentes en todo el sitio. */
export function buildMetadata({ locale, path, title, description, image, noindex, type = 'website' }: MetaInput): Metadata {
  const t = getDictionary(locale);
  const desc = (description ?? t.meta.description).slice(0, 160);
  const canonical = localizePath(locale, path);
  const images = image
    ? [{ url: image.url, width: image.width ?? undefined, height: image.height ?? undefined, alt: image.alt ?? title }]
    : undefined;

  return {
    title,
    description: desc,
    alternates: {
      canonical,
      languages: {
        'es-MX': localizePath('es', path),
        'en-US': localizePath('en', path),
        'x-default': localizePath('es', path),
      },
    },
    openGraph: {
      type,
      siteName: t.meta.siteName,
      locale: ogLocale[locale],
      url: absoluteUrl(canonical),
      title: title ? `${title} | ${t.meta.siteName}` : `${t.meta.siteName} | ${t.meta.tagline}`,
      description: desc,
      images,
    },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description: desc, images: images?.map((i) => i.url) },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
  };
}

/** Breadcrumb JSON-LD a partir de la misma lista que se pinta en pantalla. */
export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}
