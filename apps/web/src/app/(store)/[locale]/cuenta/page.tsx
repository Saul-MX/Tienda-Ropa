import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCustomer } from '@/lib/auth/session';
import { logout } from '@/lib/actions/auth';
import { formatDate, formatMoney } from '@/lib/format';
import { getDictionary, isLocale, localizePath, type Locale } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';
import { strapi } from '@/lib/strapi/client';
import type { ListResponse, Order } from '@/lib/strapi/types';

export async function generateMetadata({ params }: PageProps<'/[locale]/cuenta'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, path: '/cuenta', title: getDictionary(locale).account.title, noindex: true });
}

export default async function AccountPage({ params }: PageProps<'/[locale]/cuenta'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <section className="page-x mx-auto max-w-4xl py-16">
      <Suspense fallback={<p className="text-muted">…</p>}>
        <Account locale={locale} />
      </Suspense>
    </section>
  );
}

async function Account({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const customer = await getCustomer();
  if (!customer) redirect(localizePath(locale, '/cuenta/entrar'));

  // Se filtra por el id del usuario verificado en el servidor: nadie puede ver pedidos ajenos.
  const orders = await strapi<ListResponse<Order>>('/orders', {
    auth: 'admin',
    query: {
      filters: { customer: { id: { $eq: customer.id } }, status: { $ne: 'pending' } },
      populate: { items: true },
      sort: ['createdAt:desc'],
      pagination: { pageSize: 50 },
    },
  });

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{customer.email}</p>
          <h1 className="display mt-1 text-3xl">{t.account.hello(customer.username)}</h1>
        </div>
        <form action={logout}>
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="btn btn-outline">
            {t.account.logout}
          </button>
        </form>
      </header>

      <h2 className="display mt-14 mb-6 text-xl">{t.account.orders}</h2>
      {orders.data.length === 0 ? (
        <p className="text-muted">{t.account.noOrders}</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {orders.data.map((o) => (
            <li key={o.documentId} className="py-5">
              <article className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                <div>
                  <h3 className="font-semibold">{o.orderNumber}</h3>
                  <p className="text-sm text-muted">
                    <time dateTime={o.createdAt}>{formatDate(o.createdAt, locale)}</time> ·{' '}
                    {o.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                  </p>
                  {o.trackingNumber && (
                    <p className="mt-1 text-sm">
                      {o.carrier} {o.trackingNumber}
                    </p>
                  )}
                </div>
                <div className="text-sm sm:text-right">
                  <p className="font-semibold">{formatMoney(Number(o.total), o.currency, locale)}</p>
                  <p className="text-muted">{t.orderStatus[o.status]}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
