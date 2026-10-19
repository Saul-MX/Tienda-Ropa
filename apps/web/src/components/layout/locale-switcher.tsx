'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import { internalizeEnglishPath, localizePath } from '@/lib/i18n/routes';

/** Enlaza a la misma página en el otro idioma (la URL cambia de /en/men a /es/hombre). */
export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? `/${locale}`;
  const other: Locale = locale === 'es' ? 'en' : 'es';
  const rest = pathname.replace(/^\/(es|en)(?=\/|$)/, '') || '/';
  const internal = locale === 'en' ? internalizeEnglishPath(rest) : rest;

  return (
    <Link href={localizePath(other, internal)} hrefLang={other} lang={other} className="text-sm hover:underline">
      {label}
    </Link>
  );
}
