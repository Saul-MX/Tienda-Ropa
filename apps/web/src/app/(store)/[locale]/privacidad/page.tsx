import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps<'/[locale]/privacidad'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, path: '/privacidad', title: getDictionary(locale).privacy.title });
}

/**
 * Texto base. Revísalo con un abogado: la LFPDPPP (México) exige identificar al responsable,
 * su domicilio y los medios para ejercer los derechos ARCO.
 */
export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacidad'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <article className="page-x mx-auto max-w-2xl py-16">
      <h1 className="display text-3xl">{t.privacy.title}</h1>
      {locale === 'es' ? (
        <div className="mt-8 space-y-5 leading-relaxed text-muted">
          <p>SauldT es responsable del tratamiento de los datos personales que nos proporcionas al comprar, crear una cuenta o suscribirte al newsletter.</p>
          <h2 className="pt-4 text-lg font-semibold text-ink">Datos que recabamos</h2>
          <p>Nombre, correo electrónico, dirección de envío y teléfono. Los datos de tu tarjeta los procesa Stripe directamente; SauldT nunca los recibe ni los almacena.</p>
          <h2 className="pt-4 text-lg font-semibold text-ink">Para qué los usamos</h2>
          <p>Procesar y enviar tus pedidos, darte seguimiento y, si lo autorizas, enviarte novedades. Puedes darte de baja del newsletter en cualquier momento.</p>
          <h2 className="pt-4 text-lg font-semibold text-ink">Tus derechos ARCO</h2>
          <p>Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos escribiendo al correo de contacto de la tienda.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-5 leading-relaxed text-muted">
          <p>SauldT is responsible for the personal data you share when you buy, create an account or subscribe to our newsletter.</p>
          <h2 className="pt-4 text-lg font-semibold text-ink">Data we collect</h2>
          <p>Name, email, shipping address and phone. Card details are processed directly by Stripe; SauldT never receives or stores them.</p>
          <h2 className="pt-4 text-lg font-semibold text-ink">How we use it</h2>
          <p>To process and ship your orders, follow up on them and, if you agree, send you news. You can unsubscribe at any time.</p>
          <h2 className="pt-4 text-lg font-semibold text-ink">Your rights</h2>
          <p>You can access, correct or delete your data, or object to its use, by writing to the store contact email.</p>
        </div>
      )}
    </article>
  );
}
