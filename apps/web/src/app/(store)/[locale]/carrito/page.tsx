import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CartView } from '@/components/cart/cart-view';
import { getDictionary, isLocale } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps<'/[locale]/carrito'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, path: '/carrito', title: getDictionary(locale).cart.title, noindex: true });
}

export default async function CartPage({ params }: PageProps<'/[locale]/carrito'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <div className="page-x mx-auto max-w-(--container-page) pt-10">
      <h1 className="wordmark mb-10 text-[clamp(2.5rem,7vw,5rem)]">{t.cart.title}</h1>
      <CartView locale={locale} />
    </div>
  );
}
