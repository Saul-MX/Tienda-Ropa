import Link from 'next/link';
import type { Metadata } from 'next';
import { ProductGrid } from '@/components/product/product-card';
import { ProductImage } from '@/components/product/product-image';
import { JsonLd } from '@/components/seo/json-ld';
import { SectionHeading } from '@/components/ui/section-heading';
import { currencyFor, getDictionary, isLocale, localizePath, type Locale } from '@/lib/i18n';
import { localized } from '@/lib/product';
import { buildMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';
import { getBrands, getCollections, getProducts, getSettings } from '@/lib/strapi/catalog';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildMetadata({ locale, path: '/' });
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Home locale={locale} />;
}

async function Home({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const href = (path: string) => localizePath(locale, path);
  const currency = currencyFor[locale];

  const [settings, newArrivals, bestsellers, men, women, collections, brands] = await Promise.all([
    getSettings(),
    getProducts({ isNew: true, pageSize: 8, currency }),
    getProducts({ bestseller: true, pageSize: 4, currency }),
    getProducts({ gender: 'hombre', featured: true, pageSize: 1, currency }),
    getProducts({ gender: 'mujer', featured: true, pageSize: 1, currency }),
    getCollections(true),
    getBrands(),
  ]);

  const heroTitle = settings ? localized(settings, 'heroTitle', locale) : t.meta.tagline;
  const heroSubtitle = settings ? localized(settings, 'heroSubtitle', locale) : t.meta.description;

  const genderTiles = [
    { label: t.nav.men, cta: t.home.shopMen, href: href('/hombre'), image: men.data[0]?.images?.[0] },
    { label: t.nav.women, cta: t.home.shopWomen, href: href('/mujer'), image: women.data[0]?.images?.[0] },
  ];

  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'ClothingStore',
            name: 'SauldT',
            url: absoluteUrl(href('/')),
            logo: absoluteUrl('/icon.svg'),
            sameAs: [settings?.instagramUrl, settings?.tiktokUrl].filter(Boolean),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'SauldT',
            url: absoluteUrl(href('/')),
            inLanguage: locale === 'es' ? 'es-MX' : 'en-US',
            potentialAction: {
              '@type': 'SearchAction',
              target: `${absoluteUrl(href('/buscar'))}?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />

      {/* Hero: el titular en Archivo expandido es la pieza protagonista. */}
      <section aria-labelledby="hero-title" className="relative">
        <div className="relative aspect-[4/5] max-h-[88vh] w-full overflow-hidden bg-stone sm:aspect-[16/9]">
          {settings?.heroImage && (
            <>
              <ProductImage image={settings.heroImage} alt={heroTitle} sizes="100vw" priority />
              {/* Oscurece la parte baja de la foto para que el titular blanco se lea. */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/55 to-transparent pt-40" aria-hidden="true" />
            </>
          )}
          <div className="page-x absolute inset-x-0 bottom-0 mx-auto max-w-(--container-page) pb-10 md:pb-16">
            <h1
              id="hero-title"
              className={`wordmark max-w-[14ch] text-[clamp(2.75rem,8vw,7.5rem)] ${settings?.heroImage ? 'text-paper' : 'text-ink'}`}
            >
              {heroTitle}
            </h1>
            {heroSubtitle && (
              <p className={`mt-5 max-w-md text-base md:text-lg ${settings?.heroImage ? 'text-paper/90' : 'text-muted'}`}>
                {heroSubtitle}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={href('/hombre')} className={`btn ${settings?.heroImage ? 'bg-paper text-ink hover:bg-stone' : 'btn-primary'}`}>
                {t.home.shopMen}
              </Link>
              <Link href={href('/mujer')} className={`btn ${settings?.heroImage ? 'bg-paper text-ink hover:bg-stone' : 'btn-primary'}`}>
                {t.home.shopWomen}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {newArrivals.data.length > 0 && (
        <section aria-labelledby="new-arrivals" className="page-x mx-auto mt-20 max-w-(--container-page)">
          <SectionHeading id="new-arrivals" title={t.home.newArrivals} href={`${href('/buscar')}?sort=newest`} linkLabel={t.home.viewAll} />
          <ProductGrid products={newArrivals.data} locale={locale} />
        </section>
      )}

      <section aria-label={`${t.nav.men} / ${t.nav.women}`} className="page-x mx-auto mt-24 grid max-w-(--container-page) gap-3 md:grid-cols-2 md:gap-5">
        {genderTiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="group relative block aspect-[4/5] overflow-hidden bg-stone">
            <ProductImage image={tile.image} alt={tile.label} sizes="(min-width: 768px) 50vw, 100vw" placeholder={tile.label.toUpperCase()} />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
              <h2 className={`wordmark text-5xl md:text-6xl ${tile.image ? 'text-paper' : 'text-ink'}`}>{tile.label}</h2>
              <span className="btn bg-paper text-ink group-hover:bg-ink group-hover:text-paper">{tile.cta}</span>
            </div>
          </Link>
        ))}
      </section>

      {collections.length > 0 && (
        <section aria-labelledby="featured-collections" className="page-x mx-auto mt-24 max-w-(--container-page)">
          <SectionHeading id="featured-collections" title={t.home.featuredCollections} href={href('/colecciones')} linkLabel={t.home.viewAll} />
          <ul className="grid gap-5 md:grid-cols-2">
            {collections.slice(0, 2).map((c) => {
              const name = localized(c, 'name', locale);
              return (
                <li key={c.documentId}>
                  <Link href={href(`/colecciones/${c.slug}`)} className="group block">
                    <div className="relative aspect-[3/2] overflow-hidden bg-stone">
                      <ProductImage image={c.cover} alt={name} sizes="(min-width: 768px) 50vw, 100vw" placeholder={c.year ? String(c.year) : ' '} />
                    </div>
                    <h3 className="display mt-4 text-xl group-hover:underline">{name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {t.collections.seasons[c.season]}
                      {c.year ? ` ${c.year}` : ''}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {bestsellers.data.length > 0 && (
        <section aria-labelledby="bestsellers" className="page-x mx-auto mt-24 max-w-(--container-page)">
          <SectionHeading id="bestsellers" title={t.home.bestsellers} />
          <ProductGrid products={bestsellers.data} locale={locale} />
        </section>
      )}

      {brands.length > 0 && (
        <section aria-labelledby="brands" className="page-x mx-auto mt-24 max-w-(--container-page)">
          <SectionHeading id="brands" title={t.home.ourBrands} href={href('/marcas')} linkLabel={t.home.viewAll} />
          <ul className="flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-8">
            {brands.map((b) => (
              <li key={b.documentId}>
                <Link href={href(`/marcas/${b.slug}`)} className="display text-2xl text-muted hover:text-ink md:text-3xl">
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
