import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { strapi, StrapiError } from './client';
import type {
  Brand,
  Category,
  Collection,
  Color,
  Gender,
  ListResponse,
  Product,
  Review,
  StoreSettings,
} from './types';
import type { Currency } from '@/lib/i18n/config';

/** Todo el catálogo comparte la etiqueta "catalog": el webhook de Strapi la invalida al editar. */
export const CATALOG_TAG = 'catalog';
export const REVIEWS_TAG = 'reviews';

const imageFields = { fields: ['url', 'alternativeText', 'width', 'height'] };

const cardPopulate = {
  images: imageFields,
  brand: { fields: ['name', 'slug'] },
  category: { fields: ['name', 'nameEn', 'slug'] },
  variants: { populate: { color: { fields: ['name', 'nameEn', 'slug', 'hex'] } } },
};

export const PAGE_SIZE = 24;

export type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'name';

export type ProductFilters = {
  gender?: Exclude<Gender, 'unisex'>;
  category?: string;
  brand?: string[];
  collection?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
  q?: string;
  sort?: SortKey;
  page?: number;
  currency?: Currency;
  featured?: boolean;
  isNew?: boolean;
  bestseller?: boolean;
  excludeSlug?: string;
  pageSize?: number;
};

function buildProductQuery(f: ProductFilters) {
  const currency = f.currency ?? 'mxn';
  const price = currency === 'mxn' ? 'priceMxn' : 'priceUsd';
  const sale = currency === 'mxn' ? 'salePriceMxn' : 'salePriceUsd';
  const and: Record<string, unknown>[] = [{ active: true }];

  if (f.gender) and.push({ gender: { $in: [f.gender, 'unisex'] } });
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.brand?.length) and.push({ brand: { slug: { $in: f.brand } } });
  if (f.collection) and.push({ collections: { slug: f.collection } });
  if (f.featured) and.push({ isFeatured: true });
  if (f.isNew) and.push({ isNew: true });
  if (f.bestseller) and.push({ isBestseller: true });
  if (f.excludeSlug) and.push({ slug: { $ne: f.excludeSlug } });
  if (f.onSale) and.push({ [sale]: { $notNull: true } });

  // Talla y color se evalúan sobre la misma variante, y solo cuentan si tiene inventario.
  const variant: Record<string, unknown> = {};
  if (f.sizes?.length) variant.size = { $in: f.sizes };
  if (f.colors?.length) variant.color = { slug: { $in: f.colors } };
  if (f.inStock || Object.keys(variant).length) variant.stock = { $gt: 0 };
  if (Object.keys(variant).length) and.push({ variants: variant });

  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    const range: Record<string, number> = {};
    if (f.minPrice !== undefined) range.$gte = f.minPrice;
    if (f.maxPrice !== undefined) range.$lte = f.maxPrice;
    and.push({ $or: [{ [sale]: range }, { [sale]: { $null: true }, [price]: range }] });
  }

  if (f.q) {
    and.push({
      $or: [
        { name: { $containsi: f.q } },
        { nameEn: { $containsi: f.q } },
        { brand: { name: { $containsi: f.q } } },
        { category: { name: { $containsi: f.q } } },
      ],
    });
  }

  const sort = {
    newest: ['createdAt:desc'],
    'price-asc': [`${price}:asc`],
    'price-desc': [`${price}:desc`],
    name: ['name:asc'],
  }[f.sort ?? 'newest'];

  return {
    filters: { $and: and },
    sort,
    populate: cardPopulate,
    pagination: { page: f.page ?? 1, pageSize: f.pageSize ?? PAGE_SIZE },
  };
}

export async function getProducts(filters: ProductFilters): Promise<ListResponse<Product>> {
  'use cache';
  cacheLife('hours');
  cacheTag(CATALOG_TAG);
  return strapi<ListResponse<Product>>('/products', { query: buildProductQuery(filters) });
}

export async function getProduct(slug: string): Promise<Product | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(CATALOG_TAG);
  const res = await strapi<ListResponse<Product>>('/products', {
    query: {
      filters: { slug: { $eq: slug }, active: true },
      populate: {
        ...cardPopulate,
        collections: { fields: ['name', 'nameEn', 'slug'] },
        sizeGuide: { fields: ['name', 'sizeSystem', 'measurements', 'notes', 'notesEn'] },
        seo: { populate: { shareImage: imageFields } },
      },
      pagination: { pageSize: 1 },
    },
  });
  return res.data[0] ?? null;
}

/** Busca variantes por SKU (carrito y checkout). Sin caché: el precio y el stock deben ser los actuales. */
export async function getProductsBySkus(skus: string[]): Promise<Product[]> {
  if (!skus.length) return [];
  const res = await strapi<ListResponse<Product>>('/products', {
    auth: 'admin',
    query: {
      filters: { active: true, variants: { sku: { $in: skus } } },
      populate: cardPopulate,
      pagination: { pageSize: 100 },
    },
  });
  return res.data;
}

export async function getReviews(productDocumentId: string): Promise<Review[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(REVIEWS_TAG);
  const res = await strapi<ListResponse<Review>>('/reviews', {
    query: {
      filters: { approved: true, product: { documentId: productDocumentId } },
      fields: ['rating', 'title', 'body', 'authorName', 'createdAt'],
      sort: ['createdAt:desc'],
      pagination: { pageSize: 50 },
    },
  });
  return res.data;
}

export async function getSettings(): Promise<StoreSettings | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(CATALOG_TAG);
  try {
    const res = await strapi<{ data: StoreSettings }>('/store-setting', { query: { populate: { heroImage: imageFields } } });
    return res.data;
  } catch (error) {
    if (error instanceof StrapiError && error.status === 404) return null;
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(CATALOG_TAG);
  const res = await strapi<ListResponse<Category>>('/categories', {
    query: { sort: ['order:asc', 'name:asc'], populate: { image: imageFields }, pagination: { pageSize: 100 } },
  });
  return res.data;
}

export async function getCategory(slug: string): Promise<Category | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(CATALOG_TAG);
  const res = await strapi<ListResponse<Category>>('/categories', {
    query: { filters: { slug: { $eq: slug } }, populate: { image: imageFields, seo: { populate: { shareImage: imageFields } } } },
  });
  return res.data[0] ?? null;
}

export async function getColors(): Promise<Color[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(CATALOG_TAG);
  const res = await strapi<ListResponse<Color>>('/colors', { query: { sort: ['name:asc'], pagination: { pageSize: 100 } } });
  return res.data;
}

export async function getBrands(): Promise<(Brand & { products: { documentId: string }[] })[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(CATALOG_TAG);
  const res = await strapi<ListResponse<Brand & { products: { documentId: string }[] }>>('/brands', {
    query: {
      sort: ['name:asc'],
      populate: { logo: imageFields, products: { fields: ['documentId'], filters: { active: true } } },
      pagination: { pageSize: 100 },
    },
  });
  return res.data;
}

export async function getBrand(slug: string): Promise<Brand | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(CATALOG_TAG);
  const res = await strapi<ListResponse<Brand>>('/brands', {
    query: { filters: { slug: { $eq: slug } }, populate: { logo: imageFields, seo: { populate: { shareImage: imageFields } } } },
  });
  return res.data[0] ?? null;
}

export async function getCollections(onlyFeatured = false): Promise<Collection[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(CATALOG_TAG);
  const res = await strapi<ListResponse<Collection>>('/collections', {
    query: {
      filters: { active: true, ...(onlyFeatured ? { featured: true } : {}) },
      sort: ['year:desc', 'createdAt:desc'],
      populate: { cover: imageFields },
      pagination: { pageSize: 50 },
    },
  });
  return res.data;
}

export async function getCollection(slug: string): Promise<Collection | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(CATALOG_TAG);
  const res = await strapi<ListResponse<Collection>>('/collections', {
    query: {
      filters: { slug: { $eq: slug }, active: true },
      populate: { cover: imageFields, seo: { populate: { shareImage: imageFields } } },
    },
  });
  return res.data[0] ?? null;
}

export type Facets = {
  sizes: string[];
  colors: Color[];
  brands: { name: string; slug: string }[];
};

/** Opciones de filtro disponibles dentro de un listado (solo lo que realmente existe ahí). */
export async function getFacets(
  scope: Pick<ProductFilters, 'gender' | 'category' | 'collection' | 'brand' | 'q' | 'onSale'>,
): Promise<Facets> {
  'use cache';
  cacheLife('hours');
  cacheTag(CATALOG_TAG);
  const query = buildProductQuery({ ...scope, pageSize: 100 });
  const res = await strapi<ListResponse<Product>>('/products', {
    query: {
      filters: query.filters,
      fields: ['slug'],
      populate: { brand: { fields: ['name', 'slug'] }, variants: { populate: { color: { fields: ['name', 'nameEn', 'slug', 'hex'] } } } },
      pagination: { pageSize: 100 },
    },
  });

  const sizes = new Set<string>();
  const colors = new Map<string, Color>();
  const brands = new Map<string, { name: string; slug: string }>();
  for (const p of res.data) {
    if (p.brand) brands.set(p.brand.slug, { name: p.brand.name, slug: p.brand.slug });
    for (const v of p.variants ?? []) {
      sizes.add(v.size);
      if (v.color) colors.set(v.color.slug, v.color);
    }
  }
  return {
    sizes: [...sizes],
    colors: [...colors.values()].sort((a, b) => a.name.localeCompare(b.name)),
    brands: [...brands.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** Datos mínimos para el sitemap. */
export async function getSitemapEntries() {
  'use cache';
  cacheLife('hours');
  cacheTag(CATALOG_TAG);
  const fields = { fields: ['slug', 'updatedAt'] };
  const [products, categories, collections, brands] = await Promise.all([
    strapi<ListResponse<{ slug: string; updatedAt: string; gender: Gender }>>('/products', {
      query: { filters: { active: true }, fields: ['slug', 'updatedAt', 'gender'], pagination: { pageSize: 100 } },
    }),
    strapi<ListResponse<{ slug: string; updatedAt: string }>>('/categories', { query: { ...fields, pagination: { pageSize: 100 } } }),
    strapi<ListResponse<{ slug: string; updatedAt: string }>>('/collections', {
      query: { ...fields, filters: { active: true }, pagination: { pageSize: 100 } },
    }),
    strapi<ListResponse<{ slug: string; updatedAt: string }>>('/brands', { query: { ...fields, pagination: { pageSize: 100 } } }),
  ]);
  return {
    products: products.data,
    categories: categories.data,
    collections: collections.data,
    brands: brands.data,
  };
}
