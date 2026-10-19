import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AuthForm } from '@/components/account/auth-form';
import { getDictionary, isLocale, localizePath } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps<'/[locale]/cuenta/entrar'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, path: '/cuenta/entrar', title: getDictionary(locale).account.login, noindex: true });
}

export default async function LoginPage({ params }: PageProps<'/[locale]/cuenta/entrar'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).account;
  return (
    <section className="page-x mx-auto max-w-md py-20">
      <h1 className="display mb-10 text-3xl">{t.login}</h1>
      <AuthForm mode="login" locale={locale} switchHref={localizePath(locale, '/cuenta/registro')} />
    </section>
  );
}
