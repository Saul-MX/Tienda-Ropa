import Link from 'next/link';
import { Suspense } from 'react';
import { getDictionary, localizePath, type Locale } from '@/lib/i18n';
import { SearchIcon, UserIcon } from '@/components/ui/icons';
import { CartLink } from './cart-link';
import { LocaleSwitcher } from './locale-switcher';
import { MobileNav } from './mobile-nav';

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const href = (path: string) => localizePath(locale, path);

  const nav = [
    { href: href('/hombre'), label: t.nav.men },
    { href: href('/mujer'), label: t.nav.women },
    { href: href('/colecciones'), label: t.nav.collections },
    { href: href('/marcas'), label: t.nav.brands },
    { href: `${href('/buscar')}?sale=1`, label: t.nav.sale },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="page-x mx-auto grid h-16 max-w-(--container-page) grid-cols-[1fr_auto_1fr] items-center md:grid-cols-[auto_1fr_auto] md:gap-10">
        <div className="flex items-center md:hidden">
          <MobileNav items={nav} labels={{ menu: t.nav.menu, close: t.nav.close }} />
        </div>

        <Link href={href('/')} className="wordmark justify-self-center text-2xl md:justify-self-start" aria-label="SauldT">
          SAULDT
        </Link>

        <nav aria-label={t.nav.mainNav} className="hidden md:block">
          <ul className="flex items-center gap-7 text-sm font-medium">
            {nav.map((item, i) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`py-2 hover:underline hover:underline-offset-8 ${i === nav.length - 1 ? 'text-signal' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-end gap-1">
          <div className="mr-2 hidden sm:block">
            {/* El enlace depende de la URL actual: sin Suspense bloquearía el prerender. */}
            <Suspense
              fallback={
                <Link href={locale === 'es' ? '/en' : '/es'} className="text-sm hover:underline">
                  {t.nav.switchLanguage}
                </Link>
              }
            >
              <LocaleSwitcher locale={locale} label={t.nav.switchLanguage} />
            </Suspense>
          </div>
          <Link href={href('/buscar')} className="inline-flex size-11 items-center justify-center" aria-label={t.nav.search}>
            <SearchIcon />
          </Link>
          <Link
            href={href('/cuenta')}
            className="hidden size-11 items-center justify-center sm:inline-flex"
            aria-label={t.nav.account}
          >
            <UserIcon />
          </Link>
          <CartLink href={href('/carrito')} label={t.nav.cart} />
        </div>
      </div>
    </header>
  );
}
