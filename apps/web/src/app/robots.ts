import type { MetadataRoute } from 'next';
import { absoluteUrl, siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Páginas privadas o sin valor para buscadores. (robots.txt no es seguridad:
        // estas rutas además exigen sesión o envían X-Robots-Tag: noindex.)
        disallow: ['/admin', '/api/', '/*/cuenta', '/*/account', '/*/carrito', '/*/cart', '/*/checkout', '/*/buscar', '/*/search'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteUrl,
  };
}
