import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AddToCart, type VariantOption } from '@/components/product/add-to-cart';
import { Gallery } from '@/components/product/gallery';
import { Price } from '@/components/product/price';
import { ProductGrid } from '@/components/product/product-card';
import { averageRating, Reviews } from '@/components/product/reviews';
import { SizeGuide } from '@/components/product/size-guide';
import { JsonLd } from '@/components/seo/json-ld';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { formatMoney } from '@/lib/format';
import { currencyFor, getDictionary, isLocale, localizePath, type Locale } from '@/lib/i18n';
import { colorName, localized, priceOf, sortSizes, totalStock } from '@/lib/product';
import { buildMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/site';
import { getProduct, getProducts, getReviews, getSettings } from '@/lib/strapi/catalog';
import { mediaUrl } from '@/lib/strapi/client';
import type { Product } from '@/lib/strapi/types';

export async function generateMetadata({ params }: PageProps<'/[locale]/producto/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getProduct(slug);
  if (!product) return {};
  const name = localized(product, 'name', locale);
  const image = product.seo?.shareImage ?? product.images?.[0];
  const price = priceOf(product, currencyFor[locale]);
  return buildMetadata({
    locale,
    path: `/producto/${product.slug}`,
    title: product.seo?.metaTitle ?? `${name}${product.brand ? ` — ${product.brand.name}` : ''}`,
    description:
      product.seo?.metaDescription ??
      `${name}. ${formatMoney(price.current, currencyFor[locale], locale)}. ${localized(product, 'description', locale)}`,
    image: image ? { url: mediaUrl(image.url)!, width: image.width, height: image.height, alt: name } : null,
  });
}

export default function ProductPage({ params }: PageProps<'/[locale]/producto/[slug]'>) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: Pick<PageProps<'/[locale]/producto/[slug]'>, 'params'>) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const product = await getProduct(slug);
  if (!product) notFound();

  const t = getDictionary(locale);
  const currency = currencyFor[locale];
  const [reviews, related, settings] = await Promise.all([
    getReviews(product.documentId),
    product.category
      ? getProducts({ category: product.category.slug, excludeSlug: product.slug, pageSize: 4, currency })
      : Promise.resolve({ data: [] as Product[] }),
    getSettings(),
  ]);

  const name = localized(product, 'name', locale);
  const description = localized(product, 'description', locale);
  const material = localized(product, 'material', locale);
  const sizes = sortSizes(product.variants.map((v) => v.size));
  const variants: VariantOption[] = product.variants.map((v) => ({
    sku: v.sku,
    size: v.size,
    stock: v.stock,
    color: v.color ? { slug: v.color.slug, name: colorName(v.color, locale), hex: v.color.hex } : null,
  }));
  const genderSlug = product.gender === 'mujer' ? 'mujer' : 'hombre';
  const freeFrom = settings ? (currency === 'mxn' ? settings.freeShippingMinMxn : settings.freeShippingMinUsd) : null;

  const crumbs = [
    { name: t.breadcrumbs.home, href: localizePath(locale, '/') },
    { name: t.gender[genderSlug], href: localizePath(locale, `/${genderSlug}`) },
    ...(product.category
      ? [{ name: localized(product.category, 'name', locale), href: localizePath(locale, `/${genderSlug}/${product.category.slug}`) }]
      : []),
    { name, href: localizePath(locale, `/producto/${product.slug}`) },
  ];

  return (
    <div className="page-x mx-auto max-w-(--container-page) pt-6">
      <ProductJsonLd product={product} locale={locale} reviewsAvg={averageRating(reviews)} reviewsCount={reviews.length} />
      <Breadcrumbs items={crumbs} label={t.breadcrumbs.label} />

      <article className="mt-6 grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] lg:gap-16">
        <Gallery images={product.images ?? []} alt={name} placeholder={product.brand?.name.split(' ')[0].toUpperCase()} />

        <div className="md:sticky md:top-24 md:self-start">
          <header>
            {product.brand && (
              <p className="text-sm">
                <Link href={localizePath(locale, `/marcas/${product.brand.slug}`)} className="text-muted hover:text-ink hover:underline">
                  {product.brand.name}
                </Link>
              </p>
            )}
            <h1 className="display mt-2 text-2xl md:text-3xl">{name}</h1>
            <div className="mt-4">
              <Price product={product} locale={locale} size="lg" />
            </div>
            {freeFrom ? <p className="mt-1 text-xs text-muted">{t.product.freeShippingFrom(formatMoney(Number(freeFrom), currency, locale))}</p> : null}
          </header>

          <div className="mt-8">
            <AddToCart locale={locale} variants={variants} sizes={sizes} cartHref={localizePath(locale, '/carrito')} />
          </div>

          <section aria-label={t.product.description} className="mt-8 border-t border-line">
            <details className="group border-b border-line py-4" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                {t.product.description}
                <span className="text-muted transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="pt-3 text-sm leading-relaxed whitespace-pre-line text-muted">{description}</p>
            </details>
            {material && (
              <details className="group border-b border-line py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                  {t.product.material}
                  <span className="text-muted transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="pt-3 text-sm text-muted">{material}</p>
              </details>
            )}
            {product.sizeGuide && <SizeGuide guide={product.sizeGuide} locale={locale} />}
          </section>
        </div>
      </article>

      <Reviews reviews={reviews} locale={locale} productDocumentId={product.documentId} />

      {related.data.length > 0 && (
        <section aria-labelledby="related" className="mt-24">
          <h2 id="related" className="display mb-6 text-2xl">
            {t.product.related}
          </h2>
          <ProductGrid products={related.data} locale={locale} />
        </section>
      )}
    </div>
  );
}

function ProductJsonLd({ product, locale, reviewsAvg, reviewsCount }: { product: Product; locale: Locale; reviewsAvg: number; reviewsCount: number }) {
  const currency = currencyFor[locale];
  const price = priceOf(product, currency);
  const url = absoluteUrl(localizePath(locale, `/producto/${product.slug}`));
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: localized(product, 'name', locale),
        description: localized(product, 'description', locale),
        sku: product.variants[0]?.sku,
        image: (product.images ?? []).map((i) => mediaUrl(i.url)),
        brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
        material: localized(product, 'material', locale) || undefined,
        audience: { '@type': 'PeopleAudience', suggestedGender: { hombre: 'male', mujer: 'female', unisex: 'unisex' }[product.gender] },
        url,
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: currency.toUpperCase(),
          price: price.current.toFixed(2),
          availability: totalStock(product) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
        ...(reviewsCount > 0
          ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: reviewsAvg.toFixed(1), reviewCount: reviewsCount } }
          : {}),
      }}
    />
  );
}

function ProductSkeleton() {
  return (
    <div className="page-x mx-auto grid max-w-(--container-page) gap-10 pt-16 md:grid-cols-[3fr_2fr]" aria-busy="true">
      <div className="aspect-[4/5] animate-pulse bg-stone" />
      <div className="space-y-4">
        <div className="h-4 w-24 bg-stone" />
        <div className="h-8 w-3/4 bg-stone" />
        <div className="h-6 w-28 bg-stone" />
        <div className="mt-8 h-12 bg-stone" />
      </div>
    </div>
  );
}
