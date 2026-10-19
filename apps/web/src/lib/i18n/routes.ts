import type { Locale } from './config';

/**
 * Las carpetas de `app/` usan los segmentos en español. Para /en se traducen las URLs
 * (mejor SEO en inglés) con rewrites en next.config y redirecciones en proxy.ts.
 */
export const segmentsEn = {
  hombre: 'men',
  mujer: 'women',
  producto: 'product',
  colecciones: 'collections',
  marcas: 'brands',
  buscar: 'search',
  carrito: 'cart',
  cuenta: 'account',
  entrar: 'login',
  registro: 'register',
  exito: 'success',
  privacidad: 'privacy',
} as const;

type Segment = keyof typeof segmentsEn;

const toSpanish = Object.fromEntries(Object.entries(segmentsEn).map(([es, en]) => [en, es])) as Record<
  string,
  Segment
>;

/** Traduce una ruta interna (segmentos en español) a la URL pública del idioma. */
export function localizePath(locale: Locale, internalPath: string): string {
  const clean = internalPath.startsWith('/') ? internalPath : `/${internalPath}`;
  if (locale === 'es') return `/es${clean === '/' ? '' : clean}`;
  const translated = clean
    .split('/')
    .map((part) => (part in segmentsEn ? segmentsEn[part as Segment] : part))
    .join('/');
  return `/en${translated === '/' ? '' : translated}`;
}

/** Para /en: convierte segmentos en inglés a los internos en español (usado por rewrites). */
export function internalizeEnglishPath(path: string): string {
  return path
    .split('/')
    .map((part) => toSpanish[part] ?? part)
    .join('/');
}

/** Ruta pública con segmentos en español dentro de /en → debe redirigirse a la versión en inglés. */
export function hasSpanishSegment(pathAfterLocale: string): boolean {
  return pathAfterLocale.split('/').some((part) => part in segmentsEn);
}

export function englishRewrites() {
  // Un rewrite por profundidad: /en/men, /en/men/:a, /en/men/:a/:b ...
  const rules: { source: string; destination: string }[] = [];
  for (const [es, en] of Object.entries(segmentsEn)) {
    rules.push({ source: `/en/${en}`, destination: `/en/${es}` });
    rules.push({ source: `/en/${en}/:rest*`, destination: `/en/${es}/:rest*` });
  }
  // Segundo nivel traducido (cuenta/entrar, checkout/exito).
  rules.unshift(
    { source: '/en/account/login', destination: '/en/cuenta/entrar' },
    { source: '/en/account/register', destination: '/en/cuenta/registro' },
    { source: '/en/checkout/success', destination: '/en/checkout/exito' },
  );
  return rules;
}
