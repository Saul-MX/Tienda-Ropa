import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { getDictionary, localizePath, type Locale } from '@/lib/i18n';
import { getSettings } from '@/lib/strapi/catalog';
import { NewsletterForm } from './newsletter-form';

async function CopyrightYear({ locale }: { locale: Locale }) {
  'use cache';
  cacheLife('days');
  return <>{getDictionary(locale).footer.rights(new Date().getFullYear())}</>;
}

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const href = (path: string) => localizePath(locale, path);
  const settings = await getSettings().catch(() => null);

  const social = [
    settings?.instagramUrl && { href: settings.instagramUrl, label: 'Instagram' },
    settings?.tiktokUrl && { href: settings.tiktokUrl, label: 'TikTok' },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer className="mt-24 border-t border-line">
      <section className="page-x mx-auto grid max-w-(--container-page) gap-6 py-16 md:grid-cols-2 md:items-end" aria-labelledby="newsletter-title">
        <div className="max-w-md">
          <h2 id="newsletter-title" className="display text-2xl">
            {t.newsletter.title}
          </h2>
          <p className="mt-3 text-muted">{t.newsletter.body}</p>
        </div>
        <div className="md:justify-self-end">
          <NewsletterForm locale={locale} />
        </div>
      </section>

      <div className="page-x mx-auto grid max-w-(--container-page) grid-cols-2 gap-8 border-t border-line py-12 text-sm md:grid-cols-4">
        <nav aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="mb-4 font-semibold">
            {t.footer.shop}
          </h2>
          <ul className="space-y-2 text-muted">
            <li><Link className="hover:text-ink" href={href('/hombre')}>{t.nav.men}</Link></li>
            <li><Link className="hover:text-ink" href={href('/mujer')}>{t.nav.women}</Link></li>
            <li><Link className="hover:text-ink" href={href('/colecciones')}>{t.nav.collections}</Link></li>
            <li><Link className="hover:text-ink" href={href('/marcas')}>{t.nav.brands}</Link></li>
          </ul>
        </nav>
        <nav aria-labelledby="footer-help">
          <h2 id="footer-help" className="mb-4 font-semibold">
            {t.footer.help}
          </h2>
          <ul className="space-y-2 text-muted">
            <li><Link className="hover:text-ink" href={href('/cuenta')}>{t.nav.account}</Link></li>
            <li><Link className="hover:text-ink" href={href('/privacidad')}>{t.footer.privacy}</Link></li>
          </ul>
        </nav>
        {social.length > 0 && (
          <nav aria-labelledby="footer-follow">
            <h2 id="footer-follow" className="mb-4 font-semibold">
              {t.footer.follow}
            </h2>
            <ul className="space-y-2 text-muted">
              {social.map((s) => (
                <li key={s.href}>
                  <a className="hover:text-ink" href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <p className="col-span-2 text-muted md:col-span-1 md:col-start-4 md:text-right">{t.footer.payments}</p>
      </div>

      <div className="overflow-hidden" aria-hidden="true">
        <p className="wordmark -mb-[0.12em] text-center text-[23vw] select-none">SAULDT</p>
      </div>
      <p className="page-x border-t border-line py-4 text-center text-xs text-muted">
        <CopyrightYear locale={locale} />
      </p>
    </footer>
  );
}
