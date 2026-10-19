import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ClearCart } from '@/components/cart/clear-cart';
import { getDictionary, isLocale, localizePath, type Locale } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';
import { stripe } from '@/lib/stripe';

export async function generateMetadata({ params }: PageProps<'/[locale]/checkout/exito'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, path: '/checkout/exito', title: getDictionary(locale).checkout.successTitle, noindex: true });
}

export default async function SuccessPage({ params, searchParams }: PageProps<'/[locale]/checkout/exito'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <section className="page-x mx-auto max-w-xl py-24">
      <ClearCart />
      <Suspense fallback={<p className="text-muted">…</p>}>
        <Summary locale={locale} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

/** Solo muestra información; el estado "pagado" lo decide exclusivamente el webhook. */
async function Summary({ locale, searchParams }: { locale: Locale; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = getDictionary(locale).checkout;
  const { session_id } = await searchParams;
  const valid = typeof session_id === 'string' && /^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(session_id);
  const session = valid ? await stripe().checkout.sessions.retrieve(session_id).catch(() => null) : null;
  if (!session) notFound();

  const paid = session.payment_status === 'paid';
  const email = session.customer_details?.email ?? '';

  return (
    <>
      <h1 className="wordmark text-[clamp(2.25rem,6vw,4rem)]">{t.successTitle}</h1>
      <p className="mt-6 text-muted">{paid ? t.successBody(email) : t.processing}</p>
      {session.client_reference_id && (
        <p className="mt-8 border-y border-line py-4 text-sm">
          {t.orderNumber}: <strong>{session.client_reference_id}</strong>
        </p>
      )}
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={localizePath(locale, '/')} className="btn btn-primary">
          {t.continue}
        </Link>
        <Link href={localizePath(locale, '/cuenta')} className="btn btn-outline">
          {t.viewOrders}
        </Link>
      </div>
    </>
  );
}
