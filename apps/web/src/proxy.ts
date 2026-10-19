import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/auth/cookies';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config';
import { hasSpanishSegment, localizePath } from '@/lib/i18n/routes';

/**
 * Rutas que bots usan para buscar archivos privados o paneles de otros CMS.
 * Next.js no los serviría de todos modos, pero se cortan aquí con un 404 barato.
 */
const PROBE = /(^|\/)\.(?!well-known\/)|\.(php|asp|aspx|jsp|cgi|env|ini|log|sql|bak|old|swp|git|ya?ml|toml|lock)$|wp-(admin|login|content)|phpmyadmin/i;

function preferredLocale(request: NextRequest): Locale {
  const header = request.headers.get('accept-language') ?? '';
  const first = header
    .split(',')
    .map((part) => part.split(';')[0].trim().slice(0, 2).toLowerCase())
    .find((code) => code === 'es' || code === 'en');
  return (first as Locale | undefined) ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PROBE.test(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  // Panel de administración: sin cookie de sesión ni siquiera se renderiza.
  // La validación real (rol "Store Admin") ocurre en el servidor en cada página y acción.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (pathname !== '/admin/login' && !request.cookies.has(ADMIN_COOKIE)) {
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const [, first, ...rest] = pathname.split('/');

  if (!first) {
    return NextResponse.redirect(new URL(`/${preferredLocale(request)}${search}`, request.url));
  }

  if (!isLocale(first)) {
    // /producto/x → /es/producto/x
    return NextResponse.redirect(new URL(`${localizePath(defaultLocale, pathname)}${search}`, request.url), 308);
  }

  // /en/producto/x → /en/product/x (una sola URL por idioma para no duplicar contenido)
  const after = `/${rest.join('/')}`;
  if (first === 'en' && hasSpanishSegment(after)) {
    return NextResponse.redirect(new URL(`${localizePath('en', after)}${search}`, request.url), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|\\.well-known/|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|robots.txt|sitemap.xml|manifest.webmanifest).*)'],
};
